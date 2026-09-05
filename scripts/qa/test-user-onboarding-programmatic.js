'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.IDTS_EMAIL_ENABLED = 'false'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const cds = require('@sap/cds')
const fs = require('node:fs')
const path = require('node:path')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')

const {
  createInvitationToken,
  invitationIDFromToken
} = require('../../srv/user-admin/invitations')
const { identityKeyHash } = require('../../srv/auth/identity-map')
const { buildInvitationMessage, processUserOnboardingDeliveries } = require('../../srv/user-admin/delivery')
const { requiresProvisioningApproval } = require('../../srv/user-admin')

const SIGNING_KEY = 'local-programmatic-invitation-signing-key-123456789'
const PM_ID = '71000000-0000-4000-8000-000000000001'
const ONBOARDING_REQUESTS = 'idts.cap.UserOnboardingRequests'
const ONBOARDING_DELIVERIES = 'idts.cap.UserOnboardingDeliveries'
const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

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

async function runRegressionChecks () {
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
      displayName: 'Controlled Test User',
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
  const persistedCreated = await db.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').columns('requestedDisplayName').where({ ID: created.ID })
  )
  assert.equal(persistedCreated.requestedDisplayName, 'Controlled Test User')

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: {
      displayName: '   ',
      email: 'missing-name@example.invalid',
      requestedRole: 'TESTER',
      userAdminRequested: false
    },
    user: administrator
  }), 400, 'INVALID_DISPLAY_NAME')

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
  assert.equal(sentMessages[0].from, '"IDTS" <no-reply@example.invalid>')
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
    data: { displayName: 'Controlled Test User', email: 'controlled.test@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  }), 409, 'ONBOARDING_ALREADY_OPEN')
  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: { displayName: 'Other User', email: 'other@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
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
      displayName: 'Controlled PM',
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
      displayName: 'Missing Developer Profile',
      email: 'missing.developer.profile@example.invalid',
      requestedRole: 'DEVELOPER',
      userAdminRequested: false
    },
    user: administrator
  }), 400, 'DEVELOPER_PROFILE_REQUIRED')

  await expectRejected(service.send({
    event: 'requestOnboarding',
    data: {
      displayName: 'Tester With Profile',
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
      displayName: 'Desired Developer',
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
      displayName: 'Controlled Developer',
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
      data: { displayName: 'Concurrent User', email: 'concurrent@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
      user: administrator
    }),
    service.send({
      event: 'requestOnboarding',
      data: { displayName: 'Concurrent User', email: 'CONCURRENT@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
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
    data: { displayName: 'Reinvited User', email: 'expired@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
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
    data: { displayName: 'Cancelled Standard User', email: 'cancel.standard@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
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
    data: { displayName: 'Replacement Standard User', email: 'cancel.standard@example.invalid', requestedRole: 'TESTER', userAdminRequested: false },
    user: administrator
  })
  assert.equal(replacementStandard.status, 'INVITED')

  cds.spawn = originalSpawn

  console.log('IDTS user onboarding programmatic checks: PASS')
}

async function createAtomicOnboardingFixture () {
  const db = await cds.deploy('db').to('sqlite::memory:')
  const previousDb = cds.db
  const previousIdts = cds.env.idts
  const previousSpawn = cds.spawn
  cds.db = db
  cds.env.idts = {
    ...(previousIdts || {}),
    userAdmin: {
      ...((previousIdts && previousIdts.userAdmin) || {}),
      invitationSigningKey: SIGNING_KEY,
      invitationTtlMinutes: 60,
      invitationBaseUrl: 'https://idts.example.invalid/onboarding/continue'
    }
  }
  cds.spawn = () => ({ on () { return this } })
  const administratorEmail = 'atomic.programmatic.pm@example.invalid'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: PM_ID,
    displayName: 'Atomic Programmatic PM',
    email: administratorEmail,
    role_code: 'PM',
    active: true
  }))
  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = new cds.User({ id: administratorEmail, roles: ['authenticated-user', 'PM', 'UserAdmin'] })
  return {
    db,
    service,
    administrator,
    restore: async () => {
      cds.spawn = previousSpawn
      cds.env.idts = previousIdts
      if (previousDb === undefined) delete cds.db
      else cds.db = previousDb
      if (typeof db.disconnect === 'function') await db.disconnect()
    }
  }
}

async function activeComponentCategory (db) {
  const row = await db.run(SELECT.one.from('idts.cap.ComponentCategories').columns('ID').where({ active: true }))
  assert.ok(row?.ID)
  return row.ID
}

async function createStandardInvitation (fixture, options = {}) {
  const email = options.email || 'atomic.standard@example.invalid'
  const role = options.role || 'TESTER'
  const created = await fixture.service.send({
    event: 'requestOnboarding',
    data: {
      displayName: options.displayName || 'Atomic Standard User',
      email,
      requestedRole: role,
      userAdminRequested: options.userAdminRequested === true,
      developerProfile: options.developerProfile
    },
    user: fixture.administrator
  })
  const row = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: created.ID }))
  const token = createInvitationToken({
    invitationID: row.ID,
    targetEmail: row.targetEmailNormalized,
    expiresAt: row.expiresAt,
    signingKey: SIGNING_KEY,
    nonce: row.tokenNonce
  }).token
  return { created, row, token, email }
}

function onboardingEmailConfig () {
  return {
    enabled: true,
    ready: true,
    batchSize: 10,
    maxRetryCount: 1,
    pollIntervalMs: 15000,
    fromAddress: 'no-reply@example.invalid',
    fromName: 'IDTS Atomic'
  }
}

async function readAtomicOnboardingState (db) {
  const [requests, deliveries] = await Promise.all([
    db.run(SELECT.from(ONBOARDING_REQUESTS).columns('ID', 'status_code', 'provisioningVersion', 'lastErrorCode', 'expiresAt')),
    db.run(SELECT.from(ONBOARDING_DELIVERIES).columns('ID', 'onboardingRequest_ID', 'status_code', 'attemptCount', 'nextAttemptAt', 'lastErrorCode', 'providerMessageId'))
  ])
  return {
    requestRows: requests.length,
    requestIDs: requests.map(row => row.ID),
    requestStatuses: requests.map(row => row.status_code),
    requestVersions: requests.map(row => Number(row.provisioningVersion || 0)),
    requestErrorCodes: requests.map(row => row.lastErrorCode || null),
    requestExpiresAt: requests.map(row => row.expiresAt),
    deliveryRows: deliveries.length,
    deliveryIDs: deliveries.map(row => row.ID),
    deliveryRequestIDs: deliveries.map(row => row.onboardingRequest_ID),
    deliveryStatuses: deliveries.map(row => row.status_code),
    deliveryAttempts: deliveries.map(row => Number(row.attemptCount || 0)),
    deliveryNextAttemptAt: deliveries.map(row => row.nextAttemptAt),
    deliveryErrorCodes: deliveries.map(row => row.lastErrorCode || null),
    deliveryProviderMessages: deliveries.map(row => row.providerMessageId || null)
  }
}

async function verifyStandardInvitation (fixture, invitation, options = {}) {
  return fixture.service.send({
    event: 'verifySapIdentity',
    data: { token: invitation.token },
    user: xsuaaUser({
      email: invitation.email,
      userUuid: options.userUuid || 'atomic-standard-subject',
      platformUserId: options.platformUserId || '71000000-0000-4000-8000-000000000020'
    })
  })
}

async function runAtomicOnboardingCase (caseKey) {
  const fixture = await createAtomicOnboardingFixture()
  try {
    if (caseKey === 'IDTS110-F205') {
      const componentCategoryID = await activeComponentCategory(fixture.db)
      const desiredProfile = {
        availabilityStatusCode: 'AVAILABLE',
        workloadLimit: 3,
        responsibilities: [{ componentCategoryID, sapModuleID: null, responsibilityLevelCode: 'PRIMARY' }]
      }
      const invitation = await createStandardInvitation(fixture, {
        email: 'atomic.desired.developer@example.invalid',
        displayName: '  Atomic Desired Developer  ',
        role: 'DEVELOPER',
        developerProfile: desiredProfile
      })
      assert.equal(invitation.created.targetEmail, 'atomic.desired.developer@example.invalid')
      assert.equal(invitation.created.status, 'INVITED')
      assert.equal(Object.hasOwn(invitation.created, 'tokenHash'), false)
      assert.equal(Object.hasOwn(invitation.created, 'tokenNonce'), false)
      assert.equal(Object.hasOwn(invitation.created, 'token'), false)
      assert.equal(invitation.row.requestedDisplayName, 'Atomic Desired Developer')
      assert.equal(invitation.row.requestedRole_code, 'DEVELOPER')
      assert.equal(invitation.row.tokenHash.length, 64)
      const desired = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingDeveloperProfiles').where({ onboardingRequest_ID: invitation.row.ID }))
      const responsibilities = await fixture.db.run(SELECT.from('idts.cap.UserOnboardingDeveloperResponsibilities').where({ onboardingRequest_ID: invitation.row.ID }))
      const deliveries = await fixture.db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: invitation.row.ID }))
      assert.equal(desired.workloadLimit, 3)
      assert.equal(desired.availabilityStatus_code, 'AVAILABLE')
      assert.equal(responsibilities.length, 1)
      assert.equal(deliveries.length, 1)
      assert.equal(deliveries[0].status_code, 'PENDING')
      assert.equal(deliveries[0].recipientEmail, invitation.row.targetEmailNormalized)
      return { normalizedEmail: invitation.row.targetEmailNormalized, normalizedDisplayName: invitation.row.requestedDisplayName, tokenHashLength: invitation.row.tokenHash.length, desiredProfilePersisted: true, pendingDeliveries: deliveries.length }
    }
    if (caseKey === 'IDTS110-F206') {
      const invitation = await createStandardInvitation(fixture, { email: 'atomic.identity@example.invalid' })
      const verified = await verifyStandardInvitation(fixture, invitation, { userUuid: 'atomic-matching-subject' })
      assert.equal(verified.status, 'PROVISION_QUEUED')
      assert.equal(Object.hasOwn(verified, 'identitySubject'), false)
      assert.equal(Object.hasOwn(verified, 'identityOrigin'), false)
      assert.equal(Object.hasOwn(verified, 'identityIssuer'), false)
      assert.equal(Object.hasOwn(verified, 'identityPlatformUserId'), false)
      assert.equal(Object.hasOwn(verified, 'identityKeyHash'), false)
      const request = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.row.ID }))
      const operations = await fixture.db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: request.ID }))
      const deliveries = await fixture.db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: request.ID }))
      const audits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: request.ID, action: 'AUTO_APPROVE_PROVISIONING', result: 'QUEUED' }))
      assert.ok(request.consumedAt)
      assert.ok(request.verifiedAt)
      assert.equal(request.status_code, 'PROVISION_QUEUED')
      assert.equal(operations.length, 1)
      assert.equal(operations[0].operationType, 'PROVISION')
      assert.equal(operations[0].state, 'PENDING')
      assert.equal(deliveries.length, 1)
      await expectRejected(verifyStandardInvitation(fixture, invitation, { userUuid: 'atomic-matching-subject' }), 409, 'INVITATION_ALREADY_USED')
      const replayRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: request.ID }))
      const replayOperations = await fixture.db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: request.ID }))
      assert.equal(replayRequest.status_code, 'PROVISION_QUEUED')
      assert.equal(replayOperations.length, 1)
      assert.equal(audits.length, 1)
      return { consumed: true, operationState: operations[0].state, operationRows: operations.length, deliveryRows: deliveries.length, replayRejected: true, auditRows: audits.length, identityFieldsOmitted: true }
    }
    if (caseKey === 'IDTS110-F209') {
      const invitation = await createStandardInvitation(fixture, { email: 'atomic.cancel.invited@example.invalid' })
      const negativeStates = ['IDENTITY_VERIFIED', 'PENDING_APPROVAL', 'PROVISION_QUEUED', 'ACTIVE', 'FAILED']
      const negativeRequests = negativeStates.map((status, index) => ({
        ID: `71000000-0000-4000-8000-${String(30 + index).padStart(12, '0')}`,
        targetEmailNormalized: `atomic.cancel.${status.toLowerCase()}@example.invalid`,
        requestedRole_code: 'TESTER',
        userAdminRequested: false,
        status_code: status,
        requestedBy_ID: PM_ID,
        expiresAt: '2026-10-01T00:00:00.000Z',
        tokenNonce: `atomic-cancel-${index}`,
        tokenHash: `${String(index + 1).repeat(64)}`.slice(0, 64),
        provisioningVersion: 1,
        correlationId: `71000000-0000-4000-8000-${String(40 + index).padStart(12, '0')}`,
        consumedAt: null
      }))
      const consumedInvitation = {
        ID: '71000000-0000-4000-8000-000000000035',
        targetEmailNormalized: 'atomic.cancel.consumed@example.invalid',
        requestedRole_code: 'TESTER',
        userAdminRequested: false,
        status_code: 'INVITED',
        requestedBy_ID: PM_ID,
        expiresAt: '2026-10-01T00:00:00.000Z',
        tokenNonce: 'atomic-cancel-consumed',
        tokenHash: 'f'.repeat(64),
        provisioningVersion: 1,
        correlationId: '71000000-0000-4000-8000-000000000045',
        consumedAt: '2026-09-05T00:00:00.000Z'
      }
      await fixture.db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries([...negativeRequests, consumedInvitation]))
      const rows = await fixture.service.send({ event: 'searchOnboarding', data: { query: 'atomic.cancel' }, user: fixture.administrator })
      const allRows = [invitation.row, ...negativeRequests, consumedInvitation]
      assert.equal(rows.length, allRows.length)
      const invited = rows.find(row => row.ID === invitation.row.ID)
      assert.equal(invited?.status_code, 'INVITED')
      assert.equal(invited?.cancelEligible, true)
      for (const row of rows.filter(candidate => candidate.ID !== invitation.row.ID)) assert.equal(row.cancelEligible, false)
      for (const row of rows) {
        for (const forbidden of ['tokenHash', 'tokenNonce', 'identitySubject', 'identityIssuer', 'identityOrigin', 'identityPlatformUserId']) assert.equal(Object.hasOwn(row, forbidden), false)
      }
      return { boundedRows: rows.length, cancelEligible: invited.cancelEligible, cancelEligibleNegativeStates: rows.length - 1, sensitiveFieldsOmitted: true }
    }
    if (caseKey === 'IDTS110-F210' || caseKey === 'IDTS110-F210S') {
      const invitation = await createStandardInvitation(fixture, { email: `atomic.approval.${caseKey.slice(-1).toLowerCase()}@example.invalid`, role: 'PM', userAdminRequested: true })
      const verified = await verifyStandardInvitation(fixture, invitation, { userUuid: `atomic-approval-${caseKey}` })
      assert.equal(verified.status, 'PENDING_APPROVAL')
      assert.equal(verified.provisioningVersion, 1)
      const beforeRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.row.ID }))
      const beforeOperations = await fixture.db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: invitation.row.ID }))
      const beforeAudits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: invitation.row.ID }))
      if (caseKey === 'IDTS110-F210S') {
        await expectRejected(fixture.service.send({ event: 'approveProvisioning', data: { requestID: invitation.row.ID, expectedVersion: 0 }, user: fixture.administrator }), 409, 'ONBOARDING_VERSION_CONFLICT')
        const afterRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.row.ID }))
        const afterOperations = await fixture.db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: invitation.row.ID }))
        const afterAudits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: invitation.row.ID }))
        assert.deepEqual(afterRequest, beforeRequest)
        assert.deepEqual(afterOperations, beforeOperations)
        assert.deepEqual(afterAudits, beforeAudits)
        return { conflictCode: 'ONBOARDING_VERSION_CONFLICT', requestUnchanged: true, operationsUnchanged: true, auditsUnchanged: true }
      }
      const approved = await fixture.service.send({ event: 'approveProvisioning', data: { requestID: invitation.row.ID, expectedVersion: 1 }, user: fixture.administrator })
      assert.equal(approved.status, 'PROVISION_QUEUED')
      assert.equal(approved.provisioningVersion, 2)
      const afterRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.row.ID }))
      const operations = await fixture.db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: invitation.row.ID }))
      const audits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: invitation.row.ID, action: 'APPROVE_PROVISIONING', result: 'QUEUED' }))
      assert.equal(afterRequest.status_code, 'PROVISION_QUEUED')
      assert.equal(operations.length, 1)
      const operation = operations[0]
      assert.equal(operation.operationType, 'PROVISION')
      assert.equal(operation.state, 'PENDING')
      assert.equal(operation.onboardingRequest_ID, invitation.row.ID)
      assert.equal(afterRequest.latestOperation_ID, operation.ID)
      assert.equal(audits.length, 1)
      return { status: afterRequest.status_code, provisioningVersion: afterRequest.provisioningVersion, operationRows: operations.length, operationType: operation.operationType, operationState: operation.state, auditRows: audits.length }
    }
    if (caseKey === 'IDTS110-F211') {
      const componentCategoryID = await activeComponentCategory(fixture.db)
      const targetID = '71000000-0000-4000-8000-000000000021'
      const requestID = '71000000-0000-4000-8000-000000000022'
      const sessionID = '71000000-0000-4000-8000-000000000023'
      await fixture.db.run(INSERT.into('idts.cap.Users').entries({ ID: targetID, displayName: 'Atomic Role Target', email: 'atomic.role.target@example.invalid', role_code: 'TESTER', active: true }))
      await fixture.db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({ ID: requestID, targetEmailNormalized: 'atomic.role.target@example.invalid', requestedRole_code: 'TESTER', userAdminRequested: false, status_code: 'ACTIVE', requestedBy_ID: PM_ID, expiresAt: '2026-10-01T00:00:00.000Z', tokenNonce: 'atomic-role-nonce', tokenHash: 'a'.repeat(64), provisioningVersion: 2, activeUser_ID: targetID, correlationId: requestID }))
      await fixture.db.run(INSERT.into('idts.cap.AuthSessions').entries({ ID: sessionID, user_ID: targetID, tokenHash: 'b'.repeat(64), issuedAt: '2026-09-05T00:00:00.000Z', expiresAt: '2026-10-05T00:00:00.000Z' }))
      const desiredProfile = { availabilityStatusCode: 'AVAILABLE', workloadLimit: 3, responsibilities: [{ componentCategoryID, sapModuleID: null, responsibilityLevelCode: 'PRIMARY' }] }
      const changed = await fixture.service.send({ event: 'requestRoleChange', data: { userID: targetID, requestedRole: 'DEVELOPER', userAdminRequested: false, developerProfile: desiredProfile, reason: 'Move into the controlled developer workflow.', expectedVersion: 2 }, user: fixture.administrator })
      assert.equal(changed.status, 'ROLE_CHANGE_QUEUED')
      assert.equal(changed.provisioningVersion, 3)
      const user = await fixture.db.run(SELECT.one.from('idts.cap.Users').where({ ID: targetID }))
      const session = await fixture.db.run(SELECT.one.from('idts.cap.AuthSessions').where({ ID: sessionID }))
      const request = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: requestID }))
      const operation = await fixture.db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: requestID, operationType: 'CHANGE_ROLE' }))
      assert.equal(user.active, false)
      assert.ok(session.revokedAt)
      assert.equal(request.status_code, 'ROLE_CHANGE_QUEUED')
      assert.equal(request.requestedRole_code, 'DEVELOPER')
      assert.equal(operation.state, 'PENDING')
      assert.equal(operation.safeResultCode, null)
      return { localAccessInactive: true, sessionsRevoked: true, queuedOperation: operation.operationType, providerCompletionClaimed: false }
    }
    if (caseKey === 'IDTS110-F215') {
      const targetID = '71000000-0000-4000-8000-000000000024'
      await fixture.db.run(INSERT.into('idts.cap.Users').entries({ ID: targetID, displayName: 'Atomic Legacy Target', email: 'atomic.legacy@example.local', role_code: 'DEVELOPER', active: true }))
      const invitation = await fixture.service.send({ event: 'requestExistingUserIdentityLink', data: { userID: targetID, email: 'atomic.link.destination@example.invalid' }, user: fixture.administrator })
      const beforeRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.ID }))
      const beforeDeliveries = await fixture.db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: invitation.ID }))
      const cancelled = await fixture.service.send({ event: 'cancelExistingUserIdentityLink', data: { requestID: invitation.ID, expectedVersion: beforeRequest.provisioningVersion }, user: fixture.administrator })
      assert.equal(cancelled.status, 'FAILED')
      const afterRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.ID }))
      const afterDeliveries = await fixture.db.run(SELECT.from('idts.cap.UserOnboardingDeliveries').where({ onboardingRequest_ID: invitation.ID }))
      const audits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: invitation.ID, action: 'CANCEL_LINK_INVITATION', result: 'APPLIED' }))
      assert.equal(afterRequest.openRequestKey, null)
      assert.equal(afterRequest.lastErrorCode, 'INVITATION_CANCELLED')
      assert.equal(afterDeliveries.length, beforeDeliveries.length)
      assert.equal(afterDeliveries[0].status_code, 'SKIPPED')
      assert.equal(audits.length, 1)
      const requestHistoryPreserved = afterRequest.ID === beforeRequest.ID &&
        afterRequest.linkTargetUser_ID === beforeRequest.linkTargetUser_ID &&
        afterRequest.linkSourceEmailNormalized === beforeRequest.linkSourceEmailNormalized
      const deliveryHistoryPreserved = afterDeliveries.length === beforeDeliveries.length &&
        afterDeliveries.every(row => beforeDeliveries.some(before => before.ID === row.ID))
      assert.equal(requestHistoryPreserved, true)
      assert.equal(deliveryHistoryPreserved, true)
      return {
        status: afterRequest.status_code,
        deliveryStatus: afterDeliveries[0].status_code,
        requestHistoryPreserved,
        deliveryHistoryPreserved,
        auditRows: audits.length
      }
    }
    if (caseKey === 'IDTS110-F243') {
      const missingInvitation = await createStandardInvitation(fixture, { email: 'atomic.missing.invitation@example.invalid' })
      const expiredInvitation = await createStandardInvitation(fixture, { email: 'atomic.expired.invitation@example.invalid' })
      const missingDelivery = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ onboardingRequest_ID: missingInvitation.row.ID }))
      const expiredDelivery = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ onboardingRequest_ID: expiredInvitation.row.ID }))
      const missingRequestID = '71000000-0000-4000-8000-000000000099'
      await fixture.db.run(UPDATE(ONBOARDING_DELIVERIES).set({ onboardingRequest_ID: missingRequestID }).where({ ID: missingDelivery.ID }))
      await fixture.db.run(UPDATE(ONBOARDING_REQUESTS).set({ expiresAt: '2026-09-04T00:00:00.000Z' }).where({ ID: expiredInvitation.row.ID }))
      const beforeState = await readAtomicOnboardingState(fixture.db)
      let senderCalls = 0
      const processed = await processUserOnboardingDeliveries({
        tx: fixture.db,
        emailConfig: onboardingEmailConfig(),
        invitationConfig: cds.env.idts.userAdmin,
        sendMail: async () => {
          senderCalls += 1
          throw new Error('ineligible invitation must not send')
        },
        now: new Date('2026-09-05T00:00:00.000Z'),
        workerID: 'atomic-onboarding-f243'
      })
      assert.deepEqual(processed, { sent: 0, failed: 0, skipped: 2 })
      assert.equal(senderCalls, 0)
      const afterState = await readAtomicOnboardingState(fixture.db)
      const missingIndex = afterState.deliveryIDs.indexOf(missingDelivery.ID)
      const expiredIndex = afterState.deliveryIDs.indexOf(expiredDelivery.ID)
      const expiredRequestIndex = afterState.requestIDs.indexOf(expiredInvitation.row.ID)
      assert.equal(afterState.deliveryStatuses[missingIndex], 'SKIPPED')
      assert.equal(afterState.deliveryErrorCodes[missingIndex], 'INVITATION_NOT_FOUND')
      assert.equal(afterState.deliveryStatuses[expiredIndex], 'SKIPPED')
      assert.equal(afterState.deliveryErrorCodes[expiredIndex], 'INVITATION_EXPIRED')
      assert.equal(afterState.requestErrorCodes[expiredRequestIndex], 'INVITATION_EXPIRED')
      const reloadState = await readAtomicOnboardingState(fixture.db)
      assert.deepEqual(reloadState, afterState)
      return {
        beforeState,
        afterState: { ...afterState, skippedMissing: true, skippedExpired: true, senderCalls },
        reloadState
      }
    }
    if (caseKey === 'IDTS110-F243M') {
      const invitation = await createStandardInvitation(fixture, { email: 'atomic.token-mismatch@example.invalid' })
      const delivery = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ onboardingRequest_ID: invitation.row.ID }))
      await fixture.db.run(UPDATE(ONBOARDING_REQUESTS).set({ tokenHash: 'f'.repeat(64) }).where({ ID: invitation.row.ID }))
      const beforeState = await readAtomicOnboardingState(fixture.db)
      let senderCalls = 0
      const emailConfig = onboardingEmailConfig()
      const first = await processUserOnboardingDeliveries({
        tx: fixture.db,
        emailConfig,
        invitationConfig: cds.env.idts.userAdmin,
        sendMail: async () => {
          senderCalls += 1
          throw new Error('token mismatch must not reach provider')
        },
        now: new Date('2026-09-05T00:00:00.000Z'),
        workerID: 'atomic-onboarding-f243m-1'
      })
      assert.deepEqual(first, { sent: 0, failed: 1, skipped: 0 })
      const firstFailure = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ ID: delivery.ID }))
      assert.equal(firstFailure.status_code, 'FAILED')
      assert.equal(firstFailure.lastErrorCode, 'INVITATION_TOKEN_MISMATCH')
      assert.equal(firstFailure.attemptCount, 1)
      assert.ok(firstFailure.nextAttemptAt)
      await fixture.db.run(UPDATE(ONBOARDING_DELIVERIES).set({ nextAttemptAt: '2026-09-05T00:00:00.000Z' }).where({ ID: delivery.ID }))
      const second = await processUserOnboardingDeliveries({
        tx: fixture.db,
        emailConfig,
        invitationConfig: cds.env.idts.userAdmin,
        sendMail: async () => {
          senderCalls += 1
          throw new Error('token mismatch must not reach provider')
        },
        now: new Date('2026-09-05T00:02:00.000Z'),
        workerID: 'atomic-onboarding-f243m-2'
      })
      assert.deepEqual(second, { sent: 0, failed: 1, skipped: 0 })
      assert.equal(senderCalls, 0)
      const finalFailure = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ ID: delivery.ID }))
      assert.equal(finalFailure.status_code, 'FAILED')
      assert.equal(finalFailure.lastErrorCode, 'INVITATION_TOKEN_MISMATCH')
      assert.equal(finalFailure.attemptCount, 2)
      assert.equal(finalFailure.nextAttemptAt, null)
      assert.doesNotMatch(finalFailure.lastErrorSummary, /tokenHash|tokenNonce|signing|programmatic/i)
      const afterState = await readAtomicOnboardingState(fixture.db)
      const reloadState = await readAtomicOnboardingState(fixture.db)
      assert.deepEqual(reloadState, afterState)
      return {
        beforeState,
        afterState: { ...afterState, firstAttemptFailed: true, retryScheduled: true, retryBoundedAtTwoAttempts: true, senderCalls },
        reloadState
      }
    }
    if (caseKey === 'IDTS110-F244') {
      const invitation = await createStandardInvitation(fixture, { email: 'atomic.message-boundary@example.invalid', role: 'TESTER' })
      const beforeState = await readAtomicOnboardingState(fixture.db)
      const emailConfig = onboardingEmailConfig()
      const message = buildInvitationMessage(invitation.row, invitation.token, cds.env.idts.userAdmin, emailConfig)
      for (const body of [message.text, message.html]) {
        assert.match(body, /https:\/\/idts\.example\.invalid\/onboarding\/continue#token=/)
        assert.doesNotMatch(body, /(?:\?|&|&amp;)token=/i)
        assert.doesNotMatch(body, /\b(?:tokenHash|tokenNonce|invitationSigningKey|signingKey)\b/i)
        assert.doesNotMatch(body, /(?:password|otp|passkey|recovery code)\s*[:=]/i)
        assert.doesNotMatch(body, /\bBearer\s+\S+/i)
      }
      assert.match(message.html, /<strong>Requested access:<\/strong> TESTER/)
      assert.match(message.html, /<strong>Invitation expires:<\/strong> \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/)
      assert.match(message.html, /href="https:\/\/idts\.example\.invalid\/onboarding\/continue#token=[^"&]+"/)
      const htmlLinks = [...message.html.matchAll(/href="([^"]+)"/g)].map(match => match[1])
      assert.equal(htmlLinks.filter(link => link.includes('#token=')).length, 1)
      assert.deepEqual(htmlLinks.filter(link => !link.includes('#token=')).sort(), [
        'https://account.sap.com/',
        'https://account.sap.com/registration/'
      ])
      assert.match(message.text, /Requested access: TESTER/)
      assert.match(message.text, new RegExp(`Invitation expires: ${invitation.row.expiresAt}`))
      assert.doesNotMatch(JSON.stringify(message), /tokenHash|tokenNonce|local-programmatic-invitation-signing-key/i)
      const escaped = buildInvitationMessage({
        ...invitation.row,
        requestedRole_code: 'TESTER & <role>',
        expiresAt: '2026-09-05T00:00:00.000Z & <expiry>'
      }, invitation.token, cds.env.idts.userAdmin, emailConfig)
      assert.match(escaped.html, /TESTER &amp; &lt;role&gt;/)
      assert.match(escaped.html, /2026-09-05T00:00:00\.000Z &amp; &lt;expiry&gt;/)
      assert.doesNotMatch(escaped.html, /<role>|<expiry>/)
      const afterState = await readAtomicOnboardingState(fixture.db)
      const reloadState = await readAtomicOnboardingState(fixture.db)
      assert.deepEqual(reloadState, afterState)
      return {
        beforeState,
        afterState: { ...afterState, htmlQueryLinkOmitted: true, htmlOfficialSapLinks: true, htmlRoleAndExpiry: true, htmlFragmentLinkOnly: true, htmlEscaped: true },
        reloadState
      }
    }
    if (caseKey === 'IDTS110-F245') {
      const targetID = '71000000-0000-4000-8000-000000000025'
      await fixture.db.run(INSERT.into('idts.cap.Users').entries({ ID: targetID, displayName: 'Atomic Cancellation Target', email: 'atomic.cancellation.target@example.local', role_code: 'DEVELOPER', active: true }))
      const invitation = await fixture.service.send({ event: 'requestExistingUserIdentityLink', data: { userID: targetID, email: 'atomic.cancelled.invitation@example.invalid' }, user: fixture.administrator })
      const beforeState = await readAtomicOnboardingState(fixture.db)
      const beforeRequest = await fixture.db.run(SELECT.one.from(ONBOARDING_REQUESTS).where({ ID: invitation.ID }))
      assert.equal(beforeRequest.status_code, 'INVITED')
      const cancelled = await fixture.service.send({ event: 'cancelExistingUserIdentityLink', data: { requestID: invitation.ID, expectedVersion: beforeRequest.provisioningVersion }, user: fixture.administrator })
      assert.equal(cancelled.status, 'FAILED')
      let senderCalls = 0
      const processed = await processUserOnboardingDeliveries({
        tx: fixture.db,
        emailConfig: onboardingEmailConfig(),
        invitationConfig: cds.env.idts.userAdmin,
        sendMail: async () => {
          senderCalls += 1
          throw new Error('cancelled invitation must not send')
        },
        now: new Date('2026-09-05T00:00:00.000Z'),
        workerID: 'atomic-onboarding-f245'
      })
      assert.deepEqual(processed, { sent: 0, failed: 0, skipped: 0 })
      assert.equal(senderCalls, 0)
      const afterRequest = await fixture.db.run(SELECT.one.from(ONBOARDING_REQUESTS).where({ ID: invitation.ID }))
      const afterDelivery = await fixture.db.run(SELECT.one.from(ONBOARDING_DELIVERIES).where({ onboardingRequest_ID: invitation.ID }))
      const audits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: invitation.ID, action: 'CANCEL_LINK_INVITATION', result: 'APPLIED' }))
      assert.equal(afterRequest.status_code, 'FAILED')
      assert.equal(afterRequest.lastErrorCode, 'INVITATION_CANCELLED')
      assert.equal(afterDelivery.status_code, 'SKIPPED')
      assert.equal(afterDelivery.lastErrorCode, 'INVITATION_CANCELLED')
      assert.equal(audits.length, 1)
      const afterState = await readAtomicOnboardingState(fixture.db)
      const reloadState = await readAtomicOnboardingState(fixture.db)
      assert.deepEqual(reloadState, afterState)
      return {
        beforeState,
        afterState: { ...afterState, cancellationPreserved: true, deliverySkipped: true, senderCalls },
        reloadState
      }
    }
    if (caseKey === 'IDTS110-F216' || caseKey === 'IDTS110-F216R') {
      const invitation = await createStandardInvitation(fixture, { email: `atomic.recovery.${caseKey.slice(-1).toLowerCase()}@example.invalid` })
      await verifyStandardInvitation(fixture, invitation, { userUuid: `atomic-recovery-${caseKey}` })
      const requestBefore = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitation.row.ID }))
      const operationBefore = await fixture.db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: invitation.row.ID }))
      const failureState = caseKey === 'IDTS110-F216' ? 'RETRYABLE_FAILURE' : 'BLOCKED_MANUAL_REVIEW'
      const safeCode = caseKey === 'IDTS110-F216' ? 'PROVIDER_TEMPORARY_FAILURE' : 'AMBIGUOUS_PROVIDER_OUTCOME'
      const event = caseKey === 'IDTS110-F216' ? 'retryAccessOperation' : 'reconcileAccessOperation'
      const action = caseKey === 'IDTS110-F216' ? 'RETRY_ACCESS_OPERATION' : 'RECONCILE_ACCESS_OPERATION'
      const invalidStateCode = caseKey === 'IDTS110-F216' ? 'ACCESS_OPERATION_NOT_RETRYABLE' : 'ACCESS_OPERATION_NOT_RECONCILABLE'
      await expectRejected(
        fixture.service.send({ event, data: { operationID: operationBefore.ID, expectedVersion: requestBefore.provisioningVersion }, user: fixture.administrator }),
        409,
        invalidStateCode
      )
      const afterInvalidStateRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: requestBefore.ID }))
      const afterInvalidStateOperation = await fixture.db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: operationBefore.ID }))
      assert.deepEqual(afterInvalidStateRequest, requestBefore)
      assert.deepEqual(afterInvalidStateOperation, operationBefore)
      await expectRejected(
        fixture.service.send({ event, data: { operationID: operationBefore.ID, expectedVersion: requestBefore.provisioningVersion - 1 }, user: fixture.administrator }),
        409,
        'ONBOARDING_VERSION_CONFLICT'
      )
      const afterInvalidVersionRequest = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: requestBefore.ID }))
      const afterInvalidVersionOperation = await fixture.db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: operationBefore.ID }))
      assert.deepEqual(afterInvalidVersionRequest, requestBefore)
      assert.deepEqual(afterInvalidVersionOperation, operationBefore)
      await fixture.db.run(UPDATE('idts.cap.UserAccessOperations').set({ state: failureState, safeResultCode: safeCode, safeResultSummary: 'Controlled recovery fixture.', completedAt: '2026-09-05T00:00:00.000Z' }).where({ ID: operationBefore.ID }))
      await fixture.db.run(UPDATE('idts.cap.UserOnboardingRequests').set({ status_code: failureState, lastErrorCode: safeCode, lastErrorSummary: 'Controlled recovery fixture.' }).where({ ID: requestBefore.ID }))
      const recovered = await fixture.service.send({ event, data: { operationID: operationBefore.ID, expectedVersion: requestBefore.provisioningVersion }, user: fixture.administrator })
      assert.equal(recovered.status, 'PROVISION_QUEUED')
      assert.equal(recovered.provisioningVersion, requestBefore.provisioningVersion + 1)
      const operationAfter = await fixture.db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: operationBefore.ID }))
      const requestAfter = await fixture.db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: requestBefore.ID }))
      const audits = await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ onboardingRequest_ID: requestBefore.ID, action, result: 'QUEUED' }))
      assert.equal(operationAfter.state, 'PENDING')
      assert.equal(operationAfter.safeResultCode, null)
      assert.notEqual(operationAfter.correlationId, operationBefore.correlationId)
      assert.notEqual(operationAfter.idempotencyKey, operationBefore.idempotencyKey)
      assert.equal(requestAfter.status_code, 'PROVISION_QUEUED')
      assert.equal(audits.length, 1)
      assert.equal(audits[0].fromState, failureState)
      assert.equal(audits[0].toState, 'PROVISION_QUEUED')
      assert.equal(audits[0].result, 'QUEUED')
      assert.equal(audits[0].correlationId, operationAfter.correlationId)
      return {
        invalidStateRejected: true,
        invalidVersionRejected: true,
        recoveryAction: action,
        state: operationAfter.state,
        auditFromState: audits[0].fromState,
        auditToState: audits[0].toState,
        newCorrelation: operationAfter.correlationId !== operationBefore.correlationId,
        auditRows: audits.length
      }
    }
    throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  } finally {
    await fixture.restore()
  }
}

async function runAtomicSelector (options) {
  const supported = new Set(['IDTS110-F205', 'IDTS110-F206', 'IDTS110-F209', 'IDTS110-F210', 'IDTS110-F210S', 'IDTS110-F211', 'IDTS110-F215', 'IDTS110-F216', 'IDTS110-F216R', 'IDTS110-F243', 'IDTS110-F243M', 'IDTS110-F244', 'IDTS110-F245'])
  if (!supported.has(options.caseKey)) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-user-onboarding-programmatic.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => {
      const observed = await runAtomicOnboardingCase(options.caseKey)
      return {
        assertionPassed: true,
        actualResult: definition.expectedResult,
        beforeState: observed.beforeState || { fixture: 'isolated-sqlite' },
        afterState: observed.afterState || observed,
        reloadState: observed.reloadState || { readback: true },
        evidenceIds: [`${options.caseKey}-RESULT`]
      }
    }
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  await runRegressionChecks()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
