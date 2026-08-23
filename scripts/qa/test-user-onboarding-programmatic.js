'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.IDTS_EMAIL_ENABLED = 'false'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql

const {
  createInvitationToken,
  invitationIDFromToken
} = require('../../srv/user-admin/invitations')
const { identityKeyHash } = require('../../srv/auth/identity-map')
const { processUserOnboardingDeliveries } = require('../../srv/user-admin/delivery')
const { requiresProvisioningApproval } = require('../../srv/user-admin')

const SIGNING_KEY = 'local-programmatic-invitation-signing-key-123456789'
const PM_ID = '71000000-0000-4000-8000-000000000001'

function xsuaaUser ({
  email = 'controlled.test@example.invalid',
  userUuid = 'stable-user-uuid-001',
  platformUserId = '71000000-0000-4000-8000-000000000020'
} = {}) {
  return new cds.User({
    id: 'mutable-login-name',
    roles: ['authenticated-user'],
    attr: { email },
    authInfo: {
      token: {
        origin: 'sap.default',
        issuer: 'https://issuer.example.invalid',
        userId: 'forbidden-sub-fallback',
        payload: {
          user_id: platformUserId,
          user_uuid: userUuid,
          sub: 'forbidden-sub-fallback'
        }
      }
    }
  })
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && error?.code === code)
}

async function main () {
  assert.equal(requiresProvisioningApproval({ requestedRole_code: 'TESTER', userAdminRequested: false }), false)
  assert.equal(requiresProvisioningApproval({ requestedRole_code: 'DEVELOPER', userAdminRequested: false }), false)
  assert.equal(requiresProvisioningApproval({ requestedRole_code: 'PM', userAdminRequested: false }), true)
  assert.equal(requiresProvisioningApproval({ requestedRole_code: 'PM', userAdminRequested: true }), true)
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.userAdmin = {
    invitationSigningKey: SIGNING_KEY,
    invitationTtlMinutes: 60,
    invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
  }

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  let immediateSpawnCount = 0
  const originalSpawn = cds.spawn
  cds.spawn = (_options, task) => {
    immediateSpawnCount += 1
    const job = new EventEmitter()
    Promise.resolve(task(db))
      .then(result => job.emit('succeeded', result))
      .catch(error => job.emit('failed', error))
    return job
  }
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: PM_ID,
    displayName: 'Controlled PM',
    email: 'pm@example.invalid',
    role_code: 'PM',
    active: true
  }))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = new cds.User({
    id: 'pm@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })

  const created = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'Controlled.Test@Example.invalid',
      requestedRole: 'TESTER',
      userAdminRequested: false
    },
    user: administrator
  })
  assert.equal(created.targetEmail, 'controlled.test@example.invalid')
  assert.equal(created.requestedRole, 'TESTER')
  assert.equal(created.status, 'INVITED')
  assert.equal(created.userAdminRequested, false)
  assert.equal('token' in created, false)
  assert.equal('tokenHash' in created, false)
  assert.equal('tokenNonce' in created, false)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(immediateSpawnCount, 1)

  const searchResults = await service.send({
    event: 'searchOnboarding',
    data: { query: 'CONTROLLED.TEST' },
    user: administrator
  })
  assert.equal(searchResults.length, 1)
  assert.equal(searchResults[0].targetEmailNormalized, 'controlled.test@example.invalid')
  assert.equal(searchResults[0].requestedRole_code, 'TESTER')
  assert.equal(searchResults[0].status_code, 'INVITED')
  assert.equal('identitySubject' in searchResults[0], false)
  assert.equal('identityIssuer' in searchResults[0], false)

  await expectRejected(service.send({
    event: 'searchOnboarding',
    data: { query: 'controlled.test' },
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  for (const roles of [
    ['authenticated-user', 'TESTER', 'UserAdmin'],
    ['authenticated-user', 'DEVELOPER', 'UserAdmin'],
    ['authenticated-user', 'PM', 'TESTER', 'UserAdmin']
  ]) {
    await expectRejected(service.send({
      event: 'searchOnboarding',
      data: { query: 'controlled.test' },
      user: new cds.User({ id: 'pm@example.invalid', roles })
    }), 403, 'USER_ADMIN_REQUIRED')
  }

  await expectRejected(service.send({
    event: 'READ',
    query: SELECT.from(service.entities.OnboardingRequests),
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  await expectRejected(service.send({
    event: 'READ',
    query: SELECT.from(service.entities.ComponentCategories),
    user: new cds.User({ id: 'developer@example.invalid', roles: ['authenticated-user', 'DEVELOPER'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: PM_ID }))
  await expectRejected(service.send({
    event: 'READ',
    query: SELECT.from(service.entities.OnboardingRequests),
    user: administrator
  }), 403, 'USER_ADMIN_REQUIRED')
  await db.run(UPDATE('idts.cap.Users').set({ active: true }).where({ ID: PM_ID }))

  const serviceContract = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../srv/user-admin.cds'), 'utf8')
  assert.doesNotMatch(serviceContract, /\btokenHash\b|\btokenNonce\b|\bidentityOrigin\b|\bidentityIssuer\b|\bidentitySubject\b|\bidentityPlatformUserId\b/)
  assert.match(serviceContract, /verifySapIdentity\(token\s*:\s*String\(2048\)\)/)
  assert.match(serviceContract, /searchOnboarding\(query\s*:\s*String\(255\)\)/)

  const persisted = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
  assert.equal(persisted.targetEmailNormalized, 'controlled.test@example.invalid')
  assert.equal(persisted.requestedRole_code, 'TESTER')
  assert.equal(persisted.requestedBy_ID, PM_ID)
  assert.equal(persisted.status_code, 'INVITED')
  assert.equal(persisted.tokenHash.length, 64)

  const delivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: created.ID }))
  assert.equal(delivery.status_code, 'PENDING')
  assert.equal(delivery.recipientEmail, 'controlled.test@example.invalid')
  assert.equal(delivery.attemptCount, 0)

  const sentMessages = []
  const sendResult = await processUserOnboardingDeliveries({
    tx: db,
    emailConfig: {
      ready: true,
      batchSize: 10,
      maxRetryCount: 2,
      pollIntervalMs: 15000,
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS'
    },
    invitationConfig: {
      invitationSigningKey: SIGNING_KEY,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    },
    sendMail: async message => {
      sentMessages.push(message)
      return { messageId: 'controlled-provider-message-id' }
    },
    now: new Date('2026-08-12T10:05:00.000Z'),
    workerID: 'onboarding-programmatic-worker'
  })
  assert.deepEqual(sendResult, { sent: 1, failed: 0, skipped: 0 })
  assert.equal(sentMessages.length, 1)
  assert.match(sentMessages[0].subject, /IDTS access invitation/)
  assert.match(sentMessages[0].text, /Continue with SAP/)
  assert.match(sentMessages[0].text, /https:\/\/idts\.example\.invalid\/onboarding\/continue#token=/)
  assert.doesNotMatch(sentMessages[0].text, /\?token=/)
  assert.match(sentMessages[0].text, /https:\/\/account\.sap\.com\//)
  assert.match(sentMessages[0].text, /https:\/\/account\.sap\.com\/registration\//)
  assert.match(sentMessages[0].text, /IDTS cannot check whether an email is registered with SAP/)
  assert.match(sentMessages[0].html, /https:\/\/account\.sap\.com\//)
  assert.match(sentMessages[0].html, /https:\/\/account\.sap\.com\/registration\//)
  assert.doesNotMatch(JSON.stringify(persisted), /local-programmatic-invitation-signing-key/)
  assert.doesNotMatch(JSON.stringify(delivery), /onboarding\/continue\?token=/)

  const sentDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: delivery.ID }))
  assert.equal(sentDelivery.status_code, 'SENT')
  assert.equal(sentDelivery.providerMessageId, 'controlled-provider-message-id')
  assert.equal(sentDelivery.lockedUntil, null)
  assert.equal(sentDelivery.lockToken, null)

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: { email: 'controlled.test@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  }), 409, 'ONBOARDING_ALREADY_OPEN')
  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: { email: 'other@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  const regenerated = createInvitationToken({
    invitationID: persisted.ID,
    targetEmail: persisted.targetEmailNormalized,
    expiresAt: persisted.expiresAt,
    signingKey: SIGNING_KEY,
    nonce: persisted.tokenNonce
  })
  const verifiedIdentityKeyHash = identityKeyHash({
    origin: 'sap.default',
    issuer: 'https://issuer.example.invalid',
    subject: 'stable-user-uuid-001'
  })
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: verifiedIdentityKeyHash }).where({ ID: PM_ID }))
  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: xsuaaUser()
  }), 409, 'EXTERNAL_IDENTITY_ALREADY_LINKED')
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: null }).where({ ID: PM_ID }))

  const duplicateEmailUserID = '71000000-0000-4000-8000-000000000009'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: duplicateEmailUserID,
    displayName: 'Legacy Duplicate Email',
    email: 'Controlled.Test@Example.invalid',
    role_code: 'TESTER',
    active: false
  }))
  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: xsuaaUser()
  }), 409, 'EMAIL_RECONCILIATION_REQUIRED')
  await db.run(DELETE.from('idts.cap.Users').where({ ID: duplicateEmailUserID }))

  const verified = await service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: xsuaaUser()
  })
  assert.equal(verified.status, 'PROVISION_QUEUED')
  assert.equal('identityOrigin' in verified, false)
  assert.equal('identitySubject' in verified, false)
  assert.equal('tokenHash' in verified, false)

  const verifiedRow = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
  assert.ok(verifiedRow.consumedAt)
  assert.ok(verifiedRow.verifiedAt)
  assert.equal(verifiedRow.identityOrigin, 'sap.default')
  assert.equal(verifiedRow.identitySubject, 'stable-user-uuid-001')
  assert.equal(verifiedRow.identityPlatformUserId, '71000000-0000-4000-8000-000000000020')
  assert.equal(verifiedRow.identityIssuer, 'https://issuer.example.invalid')
  assert.equal(verifiedRow.identityKeyHash.length, 64)
  assert.equal(verifiedRow.status_code, 'PROVISION_QUEUED')
  assert.equal(verifiedRow.provisioningVersion, 2)
  assert.ok(verifiedRow.approvedAt)
  assert.equal(verifiedRow.approvedBy_ID, PM_ID)
  const queuedOperation = await db.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: created.ID })
  )
  assert.equal(queuedOperation.operationType, 'PROVISION')
  assert.equal(queuedOperation.state, 'PENDING')
  assert.equal(queuedOperation.expectedVersion, 2)

  const privilegedCreated = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'controlled.pm@example.invalid',
      requestedRole: 'PM',
      userAdminRequested: true
    },
    user: administrator
  })

  const componentCategory = await db.run(
    SELECT.one.from('idts.cap.ComponentCategories').columns('ID').where({ active: true })
  )
  assert.ok(componentCategory?.ID)
  const desiredDeveloperProfile = {
    availabilityStatusCode: 'AVAILABLE',
    workloadLimit: 3,
    responsibilities: [{
      componentCategoryID: componentCategory.ID,
      sapModuleID: null,
      responsibilityLevelCode: 'PRIMARY'
    }]
  }

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: {
      email: 'missing.developer.profile@example.invalid',
      requestedRole: 'DEVELOPER',
      userAdminRequested: false
    },
    user: administrator
  }), 400, 'DEVELOPER_PROFILE_REQUIRED')

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: {
      email: 'tester.with.profile@example.invalid',
      requestedRole: 'TESTER',
      userAdminRequested: false,
      developerProfile: desiredDeveloperProfile
    },
    user: administrator
  }), 400, 'DEVELOPER_PROFILE_NOT_ALLOWED')

  const developerInvitation = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'desired.developer@example.invalid',
      requestedRole: 'DEVELOPER',
      userAdminRequested: false,
      developerProfile: desiredDeveloperProfile
    },
    user: administrator
  })
  const persistedDeveloperInvitation = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: developerInvitation.ID })
  )
  const persistedDesiredProfile = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingDeveloperProfiles').where({ onboardingRequest_ID: developerInvitation.ID })
  )
  const persistedDesiredResponsibilities = await db.run(
    SELECT.from('idts.cap.UserOnboardingDeveloperResponsibilities').where({ onboardingRequest_ID: developerInvitation.ID })
  )
  assert.equal(Object.hasOwn(persistedDeveloperInvitation, 'developerAvailabilityStatus_code'), false)
  assert.equal(Object.hasOwn(persistedDeveloperInvitation, 'developerWorkloadLimit'), false)
  assert.equal(persistedDesiredProfile.availabilityStatus_code, 'AVAILABLE')
  assert.equal(persistedDesiredProfile.workloadLimit, 3)
  assert.equal(persistedDesiredResponsibilities.length, 1)
  assert.equal(persistedDesiredResponsibilities[0].componentCategory_ID, componentCategory.ID)
  const privilegedSend = await processUserOnboardingDeliveries({
    tx: db,
    emailConfig: {
      ready: true,
      batchSize: 10,
      maxRetryCount: 2,
      pollIntervalMs: 15000,
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS'
    },
    invitationConfig: {
      invitationSigningKey: SIGNING_KEY,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    },
    sendMail: async () => ({ messageId: 'controlled-privileged-message-id' }),
    now: new Date('2026-08-12T10:06:00.000Z'),
    workerID: 'onboarding-privileged-worker'
  })
  assert.deepEqual(privilegedSend, { sent: 2, failed: 0, skipped: 0 })
  const privilegedRow = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: privilegedCreated.ID }))
  const privilegedToken = createInvitationToken({
    invitationID: privilegedRow.ID,
    targetEmail: privilegedRow.targetEmailNormalized,
    expiresAt: privilegedRow.expiresAt,
    signingKey: SIGNING_KEY,
    nonce: privilegedRow.tokenNonce
  })
  const privilegedVerified = await service.send({
    event: 'verifySapIdentity',
    data: { token: privilegedToken.token },
    user: xsuaaUser({
      email: 'controlled.pm@example.invalid',
      userUuid: 'stable-pm-user-uuid-002',
      platformUserId: '71000000-0000-4000-8000-000000000021'
    })
  })
  assert.equal(privilegedVerified.status, 'PENDING_APPROVAL')
  assert.equal(privilegedVerified.provisioningVersion, 1)
  assert.equal(await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: privilegedRow.ID })), undefined)

  const privilegedApproved = await service.send({
    event: 'approveProvisioning',
    data: { requestID: privilegedRow.ID, expectedVersion: 1 },
    user: administrator
  })
  assert.equal(privilegedApproved.status, 'PROVISION_QUEUED')
  assert.equal(privilegedApproved.provisioningVersion, 2)
  assert.ok(await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: privilegedRow.ID })))

  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: 'RETRYABLE_FAILURE',
    safeResultCode: 'PROVIDER_TEMPORARY_FAILURE',
    safeResultSummary: 'Temporary provider failure.'
  }).where({ ID: queuedOperation.ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'RETRYABLE_FAILURE'
  }).where({ ID: created.ID }))
  const retried = await service.send({
    event: 'retryAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 2 },
    user: administrator
  })
  assert.equal(retried.status, 'PROVISION_QUEUED')
  assert.equal(retried.provisioningVersion, 3)
  const originalRequestCorrelation = created.correlationId
  const retriedRequest = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID })
  )
  const retriedOperation = await db.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: queuedOperation.ID })
  )
  assert.equal(retriedOperation.state, 'PENDING')
  assert.equal(retriedOperation.expectedVersion, 3)
  assert.notEqual(retriedOperation.idempotencyKey, queuedOperation.idempotencyKey)
  assert.notEqual(retriedOperation.correlationId, queuedOperation.correlationId)
  assert.equal(retriedRequest.correlationId, originalRequestCorrelation, 'ordinary PROVISION retry must preserve request correlation behavior')
  assert.notEqual(retriedOperation.correlationId, retriedRequest.correlationId, 'ordinary PROVISION retry must not adopt LINK_EXISTING correlation binding')
  assert.equal(retried.correlationId, retriedOperation.correlationId)
  assert.equal(retriedOperation.safeResultCode, null)
  assert.equal(retriedOperation.completedAt, null)
  assert.equal(queuedOperation.expectedVersion, 2)
  assert.equal(queuedOperation.desiredRole_code, 'TESTER')
  assert.equal(queuedOperation.desiredUserAdmin, false)
  assert.equal(queuedOperation.idempotencyKey.length, 64)
  await expectRejected(service.send({
    event: 'reconcileAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 3 },
    user: administrator
  }), 409, 'ACCESS_OPERATION_NOT_RECONCILABLE')

  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: 'BLOCKED_MANUAL_REVIEW',
    completedAt: '2026-08-13T00:05:00.000Z',
    attemptCount: 4,
    safeResultCode: 'PROVIDER_REQUEST_INVALID',
    safeResultSummary: 'Provider rejected the request contract.',
    providerCorrelationHash: '9'.repeat(64)
  }).where({ ID: queuedOperation.ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'BLOCKED_MANUAL_REVIEW',
    lastErrorCode: 'PROVIDER_REQUEST_INVALID'
  }).where({ ID: created.ID }))
  const requestInvalidSearch = await service.send({
    event: 'searchOnboarding',
    data: { query: 'controlled.test' },
    user: administrator
  })
  assert.equal(requestInvalidSearch[0].latestOperationAttemptCount, 4)
  const legacyDiagnosticRetry = await service.send({
    event: 'retryAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 3 },
    user: administrator
  })
  assert.equal(legacyDiagnosticRetry.status, 'PROVISION_QUEUED')
  assert.equal(legacyDiagnosticRetry.provisioningVersion, 4)
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: 'BLOCKED_MANUAL_REVIEW',
    completedAt: '2026-08-13T00:06:00.000Z',
    attemptCount: 5,
    safeResultCode: 'PROVIDER_REQUEST_INVALID',
    safeResultSummary: 'Provider still rejected the request contract.'
  }).where({ ID: queuedOperation.ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'BLOCKED_MANUAL_REVIEW',
    lastErrorCode: 'PROVIDER_REQUEST_INVALID'
  }).where({ ID: created.ID }))
  await expectRejected(service.send({
    event: 'retryAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 4 },
    user: administrator
  }), 409, 'ACCESS_OPERATION_NOT_RETRYABLE')
  await expectRejected(service.send({
    event: 'reconcileAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 4 },
    user: administrator
  }), 409, 'ACCESS_OPERATION_NOT_RECONCILABLE')
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    safeResultCode: 'PROVIDER_FORBIDDEN',
    safeResultSummary: 'Provider denied the operation.'
  }).where({ ID: queuedOperation.ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    lastErrorCode: 'PROVIDER_FORBIDDEN'
  }).where({ ID: created.ID }))
  await expectRejected(service.send({
    event: 'retryAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 4 },
    user: administrator
  }), 409, 'ACCESS_OPERATION_NOT_RETRYABLE')
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    safeResultCode: 'AMBIGUOUS_PROVIDER_OUTCOME',
    safeResultSummary: 'Provider result requires reconciliation.'
  }).where({ ID: queuedOperation.ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    lastErrorCode: 'AMBIGUOUS_PROVIDER_OUTCOME'
  }).where({ ID: created.ID }))
  const reconciled = await service.send({
    event: 'reconcileAccessOperation',
    data: { operationID: queuedOperation.ID, expectedVersion: 4 },
    user: administrator
  })
  assert.equal(reconciled.status, 'PROVISION_QUEUED')
  assert.equal(reconciled.provisioningVersion, 5)
  const reconciledOperation = await db.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: queuedOperation.ID })
  )
  assert.equal(reconciledOperation.state, 'PENDING')
  assert.equal(reconciledOperation.expectedVersion, 5)
  assert.notEqual(reconciledOperation.correlationId, retriedOperation.correlationId)
  assert.equal(reconciled.correlationId, reconciledOperation.correlationId)
  assert.equal(reconciledOperation.completedAt, null)
  assert.equal(reconciledOperation.safeResultCode, null)
  assert.equal(reconciledOperation.providerCorrelationHash, null)

  const provisionedUserID = '71000000-0000-4000-8000-000000000010'
  const provisionedSessionID = '71000000-0000-4000-8000-000000000011'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: provisionedUserID,
    displayName: 'Controlled Test User',
    email: 'controlled.test@example.invalid',
    role_code: 'TESTER',
    active: true,
    externalIdentityOrigin: verifiedRow.identityOrigin,
    externalIdentityIssuer: verifiedRow.identityIssuer,
    externalIdentitySubject: verifiedRow.identitySubject,
    externalIdentityKeyHash: verifiedRow.identityKeyHash
  }))
  await db.run(INSERT.into('idts.cap.AuthSessions').entries({
    ID: provisionedSessionID,
    user_ID: provisionedUserID,
    tokenHash: 'b'.repeat(64),
    issuedAt: '2026-08-13T00:00:00.000Z',
    expiresAt: '2026-08-14T00:00:00.000Z'
  }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'ACTIVE',
    activeUser_ID: provisionedUserID,
    provisionedAt: '2026-08-13T00:00:00.000Z'
  }).where({ ID: created.ID }))

  const roleChange = await service.send({
    event: 'requestRoleChange',
    data: {
      userID: provisionedUserID,
      requestedRole: 'DEVELOPER',
      userAdminRequested: false,
      developerProfile: desiredDeveloperProfile,
      reason: 'Move controlled user to the development workflow.',
      expectedVersion: 5
    },
    user: administrator
  })
  assert.equal(roleChange.status, 'ROLE_CHANGE_QUEUED')
  assert.equal(roleChange.provisioningVersion, 6)
  const suspendedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: provisionedUserID }))
  const revokedSession = await db.run(SELECT.one.from('idts.cap.AuthSessions').where({ ID: provisionedSessionID }))
  assert.equal(suspendedUser.active, false)
  assert.ok(revokedSession.revokedAt)
  const roleChangeOperation = await db.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: created.ID, operationType: 'CHANGE_ROLE' })
  )
  assert.equal(roleChangeOperation.desiredRole_code, 'DEVELOPER')

  await db.run(UPDATE('idts.cap.Users').set({ active: true, role_code: 'DEVELOPER' }).where({ ID: provisionedUserID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({ status_code: 'ACTIVE' }).where({ ID: created.ID }))
  const revoke = await service.send({
    event: 'requestRevoke',
    data: {
      userID: provisionedUserID,
      reason: 'Controlled access is no longer required.',
      expectedVersion: 6
    },
    user: administrator
  })
  assert.equal(revoke.status, 'REVOKE_QUEUED')
  assert.equal(revoke.provisioningVersion, 7)
  const revokedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: provisionedUserID }))
  assert.equal(revokedUser.active, false)
  const revokeOperation = await db.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: created.ID, operationType: 'REVOKE' })
  )
  assert.equal(revokeOperation.state, 'PENDING')

  const bootstrapAdminRequestID = '71000000-0000-4000-8000-000000000012'
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: bootstrapAdminRequestID,
    targetEmailNormalized: 'pm@example.invalid',
    requestedRole_code: 'PM',
    userAdminRequested: true,
    status_code: 'ACTIVE',
    requestedBy_ID: PM_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'bootstrap-admin-controlled-nonce',
    tokenHash: '4'.repeat(64),
    provisioningVersion: 1,
    activeUser_ID: PM_ID,
    correlationId: '71000000-0000-4000-8000-000000000013'
  }))
  await expectRejected(service.send({
    event: 'requestRevoke',
    data: {
      userID: PM_ID,
      reason: 'Attempt to remove the final administrator.',
      expectedVersion: 1
    },
    user: administrator
  }), 409, 'LAST_USER_ADMIN_REQUIRED')
  const preservedAdmin = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: PM_ID }))
  assert.equal(preservedAdmin.active, true)

  const secondAdminID = '71000000-0000-4000-8000-000000000014'
  const secondAdminRequestID = '71000000-0000-4000-8000-000000000015'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: secondAdminID,
    displayName: 'Second Controlled PM',
    email: 'second.pm@example.invalid',
    role_code: 'PM',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: secondAdminRequestID,
    targetEmailNormalized: 'second.pm@example.invalid',
    requestedRole_code: 'PM',
    userAdminRequested: true,
    status_code: 'ACTIVE',
    requestedBy_ID: PM_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'second-admin-controlled-nonce',
    tokenHash: '5'.repeat(64),
    provisioningVersion: 1,
    activeUser_ID: secondAdminID,
    correlationId: '71000000-0000-4000-8000-000000000016'
  }))
  const secondAdministrator = new cds.User({
    id: 'second.pm@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })
  const concurrentAdminRevokes = await Promise.allSettled([
    service.send({
      event: 'requestRevoke',
      data: { userID: PM_ID, reason: 'Concurrent controlled revoke A.', expectedVersion: 1 },
      user: administrator
    }),
    service.send({
      event: 'requestRevoke',
      data: { userID: secondAdminID, reason: 'Concurrent controlled revoke B.', expectedVersion: 1 },
      user: secondAdministrator
    })
  ])
  assert.equal(concurrentAdminRevokes.filter(result => result.status === 'fulfilled').length, 1)
  const adminRevokeFailure = concurrentAdminRevokes.find(result => result.status === 'rejected')?.reason
  assert.equal(adminRevokeFailure?.code, 'LAST_USER_ADMIN_REQUIRED')
  const remainingActiveAdmins = await db.run(
    SELECT.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({ status_code: 'ACTIVE', requestedRole_code: 'PM', userAdminRequested: true })
  )
  assert.equal(remainingActiveAdmins.length, 1)
  // Restore test-only administrator fixtures so the remaining unrelated checks keep a stable caller.
  await db.run(UPDATE('idts.cap.Users').set({ active: true }).where({ ID: { in: [PM_ID, secondAdminID] } }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({ status_code: 'ACTIVE' }).where({
    ID: { in: [bootstrapAdminRequestID, secondAdminRequestID] }
  }))

  await expectRejected(service.send({
    event: 'approveProvisioning',
    data: { requestID: created.ID, expectedVersion: 1 },
    user: administrator
  }), 409, 'ONBOARDING_VERSION_CONFLICT')

  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: regenerated.token },
    user: xsuaaUser()
  }), 409, 'INVITATION_ALREADY_USED')

  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: 'a'.repeat(2049) },
    user: new cds.User({ id: 'oversized-token-user', roles: ['authenticated-user'] })
  }), 400, 'ASSERT_DATA_TYPE')
  assert.throws(
    () => invitationIDFromToken('a'.repeat(2049)),
    error => error?.status === 400 && error?.code === 'INVALID_INVITATION'
  )

  const failingInvite = await service.send({
    event: 'requestOnboarding',
    data: {
      email: 'controlled.developer@example.invalid',
      requestedRole: 'DEVELOPER',
      userAdminRequested: false,
      developerProfile: desiredDeveloperProfile
    },
    user: administrator
  })
  await new Promise(resolve => setImmediate(resolve))
  const providerError = Object.assign(new Error('private-host.example invalid-api-key-value'), {
    code: 'BREVO_API_FAILED'
  })
  const failureResult = await processUserOnboardingDeliveries({
    tx: db,
    emailConfig: {
      ready: true,
      batchSize: 10,
      maxRetryCount: 2,
      pollIntervalMs: 15000,
      fromAddress: 'no-reply@example.invalid',
      fromName: 'IDTS'
    },
    invitationConfig: {
      invitationSigningKey: SIGNING_KEY,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    },
    sendMail: async () => { throw providerError },
    now: new Date('2026-08-12T10:10:00.000Z'),
    workerID: 'onboarding-failure-worker'
  })
  assert.deepEqual(failureResult, { sent: 0, failed: 1, skipped: 0 })
  const failedDelivery = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: failingInvite.ID })
  )
  assert.equal(failedDelivery.status_code, 'FAILED')
  assert.equal(failedDelivery.lastErrorCode, 'BREVO_API_FAILED')
  assert.equal(failedDelivery.lastErrorSummary, 'Email provider API request failed.')
  assert.ok(failedDelivery.nextAttemptAt)
  assert.equal(failedDelivery.lockedUntil, null)
  assert.equal(failedDelivery.lockToken, null)
  assert.doesNotMatch(JSON.stringify(failedDelivery), /private-host|invalid-api-key-value/)
  const failedRequest = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: failingInvite.ID })
  )
  assert.equal(failedRequest.lastErrorCode, 'BREVO_API_FAILED')
  assert.equal(failedRequest.lastErrorSummary, 'Email provider API request failed.')
  assert.doesNotMatch(JSON.stringify(failedRequest), /private-host|invalid-api-key-value/)

  const concurrentResults = await Promise.allSettled([
    service.send({
      event: 'requestOnboarding',
      data: { email: 'concurrent@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
      user: administrator
    }),
    service.send({
      event: 'requestOnboarding',
      data: { email: 'CONCURRENT@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
      user: administrator
    })
  ])
  assert.equal(concurrentResults.filter(result => result.status === 'fulfilled').length, 1)
  const concurrentFailure = concurrentResults.find(result => result.status === 'rejected')?.reason
  assert.equal(concurrentFailure?.code, 'ONBOARDING_ALREADY_OPEN')
  const concurrentRows = await db.run(
    SELECT.from('idts.cap.UserOnboardingRequests').where({ targetEmailNormalized: 'concurrent@example.invalid' })
  )
  assert.equal(concurrentRows.length, 1)

  const expiredInviteID = '73000000-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: expiredInviteID,
    targetEmailNormalized: 'expired@example.invalid',
    openRequestKey: require('node:crypto').createHash('sha256').update('expired@example.invalid').digest('hex'),
    requestedRole_code: 'TESTER',
    userAdminRequested: false,
    status_code: 'INVITED',
    requestedBy_ID: PM_ID,
    expiresAt: '2020-01-01T00:00:00.000Z',
    tokenNonce: 'expired-controlled-nonce',
    tokenHash: require('node:crypto').createHash('sha256').update('expired-controlled-token').digest('hex'),
    correlationId: '74000000-0000-4000-8000-000000000001'
  }))
  const reinvited = await service.send({
    event: 'requestOnboarding',
    data: { email: 'expired@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  })
  assert.equal(reinvited.status, 'INVITED')
  assert.notEqual(reinvited.ID, expiredInviteID)
  const expiredRow = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: expiredInviteID }))
  assert.equal(expiredRow.status_code, 'FAILED')
  assert.equal(expiredRow.openRequestKey, null)
  assert.equal(expiredRow.lastErrorCode, 'INVITATION_EXPIRED')
  assert.equal(expiredRow.lastErrorSummary, 'Invitation expired before identity verification.')

  const cancellableInvite = await service.send({
    event: 'requestOnboarding',
    data: { email: 'cancel.standard@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  })
  const cancellableRow = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: cancellableInvite.ID })
  )
  const cancellableToken = createInvitationToken({
    invitationID: cancellableRow.ID,
    targetEmail: cancellableRow.targetEmailNormalized,
    expiresAt: cancellableRow.expiresAt,
    signingKey: SIGNING_KEY,
    nonce: cancellableRow.tokenNonce
  }).token
  const cancellableSummary = (await service.send({
    event: 'searchOnboarding',
    data: { query: 'cancel.standard' },
    user: administrator
  })).find(row => row.ID === cancellableInvite.ID)
  assert.equal(cancellableSummary.cancelEligible, true, 'every unverified INVITED request must be cancellable')

  await expectRejected(service.send({
    event: 'cancelExistingUserIdentityLink',
    data: { requestID: cancellableInvite.ID, expectedVersion: 0 },
    user: new cds.User({ id: 'pm@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')
  await expectRejected(service.send({
    event: 'cancelExistingUserIdentityLink',
    data: { requestID: cancellableInvite.ID, expectedVersion: 99 },
    user: administrator
  }), 409, 'ONBOARDING_VERSION_CONFLICT')

  const cancelledStandard = await service.send({
    event: 'cancelExistingUserIdentityLink',
    data: { requestID: cancellableInvite.ID, expectedVersion: 0 },
    user: administrator
  })
  assert.equal(cancelledStandard.status, 'FAILED')
  assert.equal(cancelledStandard.provisioningVersion, 1)
  const cancelledStandardRow = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: cancellableInvite.ID })
  )
  assert.equal(cancelledStandardRow.openRequestKey, null)
  assert.equal(cancelledStandardRow.lastErrorCode, 'INVITATION_CANCELLED')
  assert.equal(cancelledStandardRow.consumedAt, null)
  const cancelledStandardDelivery = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: cancellableInvite.ID })
  )
  assert.equal(cancelledStandardDelivery.status_code, 'SKIPPED')
  const standardCancelAudits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({
    onboardingRequest_ID: cancellableInvite.ID,
    action: 'CANCEL_INVITATION'
  }))
  assert.equal(standardCancelAudits.length, 1)
  assert.equal(standardCancelAudits[0].targetUser_ID, null)
  assert.equal(standardCancelAudits[0].detailsSummary.includes('cancel.standard'), false)
  await expectRejected(service.send({
    event: 'verifySapIdentity',
    data: { token: cancellableToken },
    user: xsuaaUser({ email: 'cancel.standard@example.invalid', userUuid: 'cancelled-standard-user' })
  }), 409, 'INVITATION_ALREADY_USED')
  await expectRejected(service.send({
    event: 'cancelExistingUserIdentityLink',
    data: { requestID: cancellableInvite.ID, expectedVersion: 1 },
    user: administrator
  }), 409, 'ONBOARDING_INVITATION_NOT_OPEN')
  const replacementStandard = await service.send({
    event: 'requestOnboarding',
    data: { email: 'cancel.standard@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  })
  assert.equal(replacementStandard.status, 'INVITED')

  cds.spawn = originalSpawn

  console.log('IDTS user onboarding programmatic checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
