'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const ADMIN_ID = '81000000-0000-4000-8000-000000000001'
const REQUEST_ID = '81000000-0000-4000-8000-000000000002'
const OPERATION_ID = '81000000-0000-4000-8000-000000000003'
const FAILURE_REQUEST_ID = '81000000-0000-4000-8000-000000000006'
const FAILURE_OPERATION_ID = '81000000-0000-4000-8000-000000000007'
const EXPIRED_REQUEST_ID = '81000000-0000-4000-8000-000000000010'
const EXPIRED_OPERATION_ID = '81000000-0000-4000-8000-000000000011'
const REACTIVATION_OPERATION_ID = '81000000-0000-4000-8000-000000000015'
const REACTIVATION_SESSION_ID = '81000000-0000-4000-8000-000000000016'
const REVOKE_OPERATION_ID = '81000000-0000-4000-8000-000000000017'
const LINK_USER_ID = '81000000-0000-4000-8000-000000000018'
const LINK_REQUEST_ID = '81000000-0000-4000-8000-000000000019'
const LINK_OPERATION_ID = '81000000-0000-4000-8000-000000000020'
const LINK_PROFILE_ID = '81000000-0000-4000-8000-000000000021'
const LINK_RESPONSIBILITY_ID = '81000000-0000-4000-8000-000000000022'
const LINK_RACE_USER_A_ID = '81000000-0000-4000-8000-000000000023'
const LINK_RACE_USER_B_ID = '81000000-0000-4000-8000-000000000024'
const LINK_RACE_REQUEST_A_ID = '81000000-0000-4000-8000-000000000025'
const LINK_RACE_REQUEST_B_ID = '81000000-0000-4000-8000-000000000026'
const LINK_RACE_OPERATION_A_ID = '81000000-0000-4000-8000-000000000027'
const LINK_RACE_OPERATION_B_ID = '81000000-0000-4000-8000-000000000028'

async function main () {
  cds.env.requires.auth = { kind: 'xsuaa' }
  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: ADMIN_ID,
    displayName: 'Controlled Administrator',
    email: 'admin@example.invalid',
    role_code: 'PM',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: REQUEST_ID,
    targetEmailNormalized: 'new.user@example.invalid',
    openRequestKey: 'a'.repeat(64),
    requestedRole_code: 'TESTER',
    userAdminRequested: false,
    status_code: 'PROVISION_QUEUED',
    requestedBy_ID: ADMIN_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'controlled-nonce',
    tokenHash: 'b'.repeat(64),
    consumedAt: '2026-08-13T00:00:00.000Z',
    verifiedAt: '2026-08-13T00:00:00.000Z',
    identityOrigin: 'sap.default',
    identityIssuer: 'https://issuer.example.invalid',
    identitySubject: 'stable-user-uuid-002',
    identityPlatformUserId: '81000000-0000-4000-8000-000000000020',
    identityKeyHash: 'c'.repeat(64),
    identityEmailNormalized: 'new.user@example.invalid',
    provisioningVersion: 2,
    correlationId: '81000000-0000-4000-8000-000000000004'
  }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: OPERATION_ID,
    onboardingRequest_ID: REQUEST_ID,
    operationType: 'PROVISION',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: 'd'.repeat(64),
    expectedVersion: 2,
    desiredRole_code: 'TESTER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000005',
    attemptCount: 0
  }))

  const service = await cds.serve('ProvisioningBrokerService').from('srv/provisioning-broker.cds')
  const broker = new cds.User({ id: 'broker-client', roles: ['authenticated-user', 'ProvisioningBroker'] })

  const claimed = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  assert.equal(claimed.operationID, OPERATION_ID)
  assert.equal(claimed.operationType, 'PROVISION')
  assert.equal(claimed.targetEmail, 'new.user@example.invalid')
  assert.equal(claimed.desiredBusinessRole, 'TESTER')
  assert.equal(claimed.desiredUserAdmin, false)
  assert.equal(claimed.identityOrigin, 'sap.default')
  assert.equal(claimed.identityIssuer, 'https://issuer.example.invalid')
  assert.equal(claimed.identitySubject, 'stable-user-uuid-002')
  assert.equal(claimed.identityPlatformUserId, '81000000-0000-4000-8000-000000000020')
  assert.equal(claimed.leaseToken.length, 64)

  const completed = await service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: OPERATION_ID,
      leaseToken: claimed.leaseToken,
      resultCode: 'APPLIED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED',
      providerCorrelationHash: 'e'.repeat(64)
    },
    user: broker
  })
  assert.equal(completed.status, 'ACTIVE')

  const request = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: REQUEST_ID }))
  assert.equal(request.status_code, 'ACTIVE')
  assert.ok(request.activeUser_ID)
  assert.ok(request.provisionedAt)
  const user = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: request.activeUser_ID }))
  assert.equal(user.role_code, 'TESTER')
  assert.equal(user.active, true)
  assert.equal(user.externalIdentityKeyHash, 'c'.repeat(64))
  const operation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: OPERATION_ID }))
  assert.equal(operation.state, 'SUCCEEDED')
  assert.equal(operation.attemptCount, 1)
  assert.equal(operation.leaseTokenHash, null)
  assert.equal(operation.providerCorrelationHash, 'e'.repeat(64))

  await db.run(INSERT.into('idts.cap.AuthSessions').entries({
    ID: REACTIVATION_SESSION_ID,
    user_ID: request.activeUser_ID,
    tokenHash: 'a'.repeat(64),
    issuedAt: '2026-08-13T00:00:00.000Z',
    expiresAt: '2026-08-14T00:00:00.000Z',
    revokedAt: '2026-08-13T01:00:00.000Z'
  }))
  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: request.activeUser_ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'SUSPENDED',
    provisioningVersion: 4,
    latestOperation_ID: REACTIVATION_OPERATION_ID
  }).where({ ID: REQUEST_ID }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: REACTIVATION_OPERATION_ID,
    onboardingRequest_ID: REQUEST_ID,
    operationType: 'REACTIVATE',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: 'b'.repeat(64),
    expectedVersion: 4,
    desiredRole_code: 'TESTER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000017',
    attemptCount: 0
  }))
  const reactivationClaim = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  assert.equal(reactivationClaim.operationID, REACTIVATION_OPERATION_ID)
  assert.equal(reactivationClaim.operationType, 'REACTIVATE')
  assert.equal(reactivationClaim.desiredBusinessRole, 'TESTER')
  const reactivationCompletion = await service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: REACTIVATION_OPERATION_ID,
      leaseToken: reactivationClaim.leaseToken,
      resultCode: 'APPLIED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED',
      providerCorrelationHash: 'c'.repeat(64)
    },
    user: broker
  })
  assert.equal(reactivationCompletion.status, 'ACTIVE')
  assert.equal((await db.run(SELECT.one.from('idts.cap.Users').where({ ID: request.activeUser_ID }))).active, true)
  assert.equal((await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: REQUEST_ID }))).status_code, 'ACTIVE')
  assert.equal((await db.run(SELECT.one.from('idts.cap.AuthSessions').where({ ID: REACTIVATION_SESSION_ID }))).revokedAt, '2026-08-13T01:00:00.000Z')
  await assert.rejects(service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: REACTIVATION_OPERATION_ID,
      leaseToken: reactivationClaim.leaseToken,
      resultCode: 'APPLIED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED',
      providerCorrelationHash: 'c'.repeat(64)
    },
    user: broker
  }), error => error?.code === 'ACCESS_OPERATION_LEASE_INVALID')

  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: request.activeUser_ID }))
  await db.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: 'REVOKE_QUEUED',
    provisioningVersion: 6,
    latestOperation_ID: REVOKE_OPERATION_ID
  }).where({ ID: REQUEST_ID }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: REVOKE_OPERATION_ID,
    onboardingRequest_ID: REQUEST_ID,
    operationType: 'REVOKE',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: 'f'.repeat(64),
    expectedVersion: 6,
    desiredRole_code: 'TESTER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000018',
    attemptCount: 0
  }))
  const revokeClaim = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  assert.equal(revokeClaim.operationID, REVOKE_OPERATION_ID)
  const revokeFailure = await service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: REVOKE_OPERATION_ID,
      leaseToken: revokeClaim.leaseToken,
      resultCode: 'PERMANENT_FAILURE',
      safeCode: 'PROVIDER_FORBIDDEN',
      providerCorrelationHash: null
    },
    user: broker
  })
  assert.equal(revokeFailure.status, 'BLOCKED_MANUAL_REVIEW')
  assert.equal((await db.run(SELECT.one.from('idts.cap.Users').where({ ID: request.activeUser_ID }))).active, false)
  const revokeRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: REQUEST_ID }))
  assert.equal(revokeRequest.activeUser_ID, request.activeUser_ID)
  assert.equal(revokeRequest.status_code, 'BLOCKED_MANUAL_REVIEW')
  assert.ok(await db.run(SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({
    operation_ID: REVOKE_OPERATION_ID,
    action: 'REVOKE'
  })))

  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: FAILURE_REQUEST_ID,
    targetEmailNormalized: 'retry.user@example.invalid',
    openRequestKey: 'f'.repeat(64),
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    status_code: 'PROVISION_QUEUED',
    requestedBy_ID: ADMIN_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'controlled-retry-nonce',
    tokenHash: '1'.repeat(64),
    consumedAt: '2026-08-13T00:00:00.000Z',
    verifiedAt: '2026-08-13T00:00:00.000Z',
    identityOrigin: 'sap.default',
    identityIssuer: 'https://issuer.example.invalid',
    identitySubject: 'stable-user-uuid-003',
    identityPlatformUserId: '81000000-0000-4000-8000-000000000021',
    identityKeyHash: '2'.repeat(64),
    identityEmailNormalized: 'retry.user@example.invalid',
    provisioningVersion: 2,
    correlationId: '81000000-0000-4000-8000-000000000008'
  }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: FAILURE_OPERATION_ID,
    onboardingRequest_ID: FAILURE_REQUEST_ID,
    operationType: 'PROVISION',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: '3'.repeat(64),
    expectedVersion: 2,
    desiredRole_code: 'DEVELOPER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000009',
    attemptCount: 0
  }))
  const failureClaim = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  const failureCompletion = {
    event: 'completeAccessOperation',
    data: {
      operationID: FAILURE_OPERATION_ID,
      leaseToken: failureClaim.leaseToken,
      resultCode: 'RETRYABLE_FAILURE',
      safeCode: 'PROVIDER_UNAVAILABLE',
      providerCorrelationHash: null
    },
    user: broker
  }
  const duplicateResults = await Promise.allSettled([
    service.send(failureCompletion),
    service.send(failureCompletion)
  ])
  assert.equal(duplicateResults.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(duplicateResults.filter(result => result.status === 'rejected').length, 1)
  const failureAudits = await db.run(
    SELECT.from('idts.cap.UserIdentityAuditEvents').where({ operation_ID: FAILURE_OPERATION_ID })
  )
  assert.equal(failureAudits.length, 1)
  const failedOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: FAILURE_OPERATION_ID }))
  assert.equal(failedOperation.state, 'RETRYABLE_FAILURE')
  assert.equal(failedOperation.attemptCount, 1)
  assert.ok(failedOperation.nextAttemptAt)
  assert.equal(failedOperation.leaseTokenHash, null)

  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: EXPIRED_REQUEST_ID,
    targetEmailNormalized: 'expired.lease@example.invalid',
    openRequestKey: '5'.repeat(64),
    requestedRole_code: 'TESTER',
    userAdminRequested: false,
    status_code: 'PROVISIONING',
    requestedBy_ID: ADMIN_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'expired-lease-controlled-nonce',
    tokenHash: '6'.repeat(64),
    consumedAt: '2026-08-13T00:00:00.000Z',
    verifiedAt: '2026-08-13T00:00:00.000Z',
    identityOrigin: 'sap.default',
    identityIssuer: 'https://issuer.example.invalid',
    identitySubject: 'stable-user-uuid-004',
    identityPlatformUserId: '81000000-0000-4000-8000-000000000022',
    identityKeyHash: '7'.repeat(64),
    identityEmailNormalized: 'expired.lease@example.invalid',
    provisioningVersion: 2,
    correlationId: '81000000-0000-4000-8000-000000000012'
  }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: EXPIRED_OPERATION_ID,
    onboardingRequest_ID: EXPIRED_REQUEST_ID,
    operationType: 'PROVISION',
    state: 'PROCESSING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: '8'.repeat(64),
    expectedVersion: 2,
    desiredRole_code: 'TESTER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000013',
    attemptCount: 1,
    leasedAt: '2026-08-12T00:00:00.000Z',
    leaseExpiresAt: '2026-08-12T00:05:00.000Z',
    leaseTokenHash: '9'.repeat(64)
  }))
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: '81000000-0000-4000-8000-000000000014',
    operation_ID: EXPIRED_OPERATION_ID,
    onboardingRequest_ID: EXPIRED_REQUEST_ID,
    actor_ID: ADMIN_ID,
    action: 'PROVISION',
    result: 'RETRYABLE_FAILURE',
    fromState: 'PROVISIONING',
    toState: 'RETRYABLE_FAILURE',
    correlationId: '81000000-0000-4000-8000-000000000013',
    detailsSummary: 'A prior attempt already recorded its outcome.'
  }))
  await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  const expiredOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: EXPIRED_OPERATION_ID }))
  const expiredRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: EXPIRED_REQUEST_ID }))
  assert.equal(expiredOperation.state, 'BLOCKED_MANUAL_REVIEW')
  assert.equal(expiredOperation.leaseTokenHash, null)
  assert.equal(expiredOperation.safeResultCode, 'AMBIGUOUS_PROVIDER_OUTCOME')
  assert.notEqual(expiredOperation.correlationId, '81000000-0000-4000-8000-000000000013')
  assert.equal(expiredRequest.status_code, 'BLOCKED_MANUAL_REVIEW')
  const expiredAudits = await db.run(
    SELECT.from('idts.cap.UserIdentityAuditEvents').where({ operation_ID: EXPIRED_OPERATION_ID, action: 'PROVISION' })
  )
  assert.equal(expiredAudits.length, 2)

  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: LINK_USER_ID,
    displayName: 'Legacy Link Developer',
    email: 'legacy.link@example.local',
    role_code: 'DEVELOPER',
    passwordHash: 'legacy-password-hash',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: LINK_PROFILE_ID,
    user_ID: LINK_USER_ID,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 3,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: LINK_RESPONSIBILITY_ID,
    developerProfile_ID: LINK_PROFILE_ID,
    componentCategory_ID: '60000000-0000-0000-0000-000000000001',
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: LINK_REQUEST_ID,
    targetEmailNormalized: 'linked.user@example.invalid',
    linkTargetUser_ID: LINK_USER_ID,
    linkSourceEmailNormalized: 'legacy.link@example.local',
    openRequestKey: 'h'.repeat(64),
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    status_code: 'PROVISION_QUEUED',
    requestedBy_ID: ADMIN_ID,
    expiresAt: '2026-08-14T00:00:00.000Z',
    tokenNonce: 'controlled-link-nonce',
    tokenHash: 'i'.repeat(64),
    consumedAt: '2026-08-13T00:00:00.000Z',
    verifiedAt: '2026-08-13T00:00:00.000Z',
    identityOrigin: 'sap.default',
    identityIssuer: 'https://issuer.example.invalid',
    identitySubject: 'stable-link-user-uuid',
    identityPlatformUserId: '81000000-0000-4000-8000-000000000028',
    identityKeyHash: 'j'.repeat(64),
    identityEmailNormalized: 'linked.user@example.invalid',
    provisioningVersion: 2,
    latestOperation_ID: LINK_OPERATION_ID,
    correlationId: '81000000-0000-4000-8000-000000000030'
  }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: LINK_OPERATION_ID,
    onboardingRequest_ID: LINK_REQUEST_ID,
    operationType: 'LINK_EXISTING',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: 'k'.repeat(64),
    expectedVersion: 2,
    desiredRole_code: 'DEVELOPER',
    desiredUserAdmin: false,
    correlationId: '81000000-0000-4000-8000-000000000030',
    attemptCount: 0
  }))

  const beforeLinkUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: LINK_USER_ID }))
  const beforeLinkProfile = await db.run(SELECT.one.from('idts.cap.DeveloperProfiles').where({ ID: LINK_PROFILE_ID }))
  const beforeLinkResponsibilities = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: LINK_PROFILE_ID }))
  const linkClaim = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  assert.equal(linkClaim.operationID, LINK_OPERATION_ID)
  assert.equal(linkClaim.operationType, 'LINK_EXISTING')
  assert.equal(linkClaim.targetEmail, 'linked.user@example.invalid')
  assert.equal(linkClaim.desiredBusinessRole, 'DEVELOPER')
  const linkCompletion = await service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: LINK_OPERATION_ID,
      leaseToken: linkClaim.leaseToken,
      resultCode: 'NOOP_ALREADY_DESIRED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED',
      providerCorrelationHash: null
    },
    user: broker
  })
  assert.equal(linkCompletion.status, 'ACTIVE')
  const linkedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: LINK_USER_ID }))
  const linkedRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: LINK_REQUEST_ID }))
  const linkedOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: LINK_OPERATION_ID }))
  assert.equal(linkedUser.ID, LINK_USER_ID)
  assert.equal(linkedUser.displayName, beforeLinkUser.displayName)
  assert.equal(linkedUser.role_code, beforeLinkUser.role_code)
  assert.equal(linkedUser.active, beforeLinkUser.active)
  assert.equal(linkedUser.passwordHash, beforeLinkUser.passwordHash)
  assert.equal(linkedUser.email, 'linked.user@example.invalid')
  assert.equal(linkedUser.externalIdentityOrigin, 'sap.default')
  assert.equal(linkedUser.externalIdentityIssuer, 'https://issuer.example.invalid')
  assert.equal(linkedUser.externalIdentitySubject, 'stable-link-user-uuid')
  assert.equal(linkedUser.externalIdentityKeyHash, 'j'.repeat(64))
  assert.equal(linkedRequest.status_code, 'ACTIVE')
  assert.equal(linkedRequest.activeUser_ID, LINK_USER_ID)
  assert.equal(linkedRequest.provisioningVersion, 3)
  assert.ok(linkedRequest.provisionedAt)
  assert.equal(linkedRequest.lastErrorCode, null)
  assert.equal(linkedRequest.lastErrorSummary, null)
  assert.equal(linkedOperation.state, 'SUCCEEDED')
  assert.deepEqual(
    (await db.run(SELECT.one.from('idts.cap.DeveloperProfiles').where({ ID: LINK_PROFILE_ID }))),
    beforeLinkProfile
  )
  assert.deepEqual(
    (await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: LINK_PROFILE_ID }))),
    beforeLinkResponsibilities
  )
  assert.ok(await db.run(SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({
    operation_ID: LINK_OPERATION_ID,
    action: 'LINK_EXISTING'
  })))
  await assert.rejects(service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: LINK_OPERATION_ID,
      leaseToken: linkClaim.leaseToken,
      resultCode: 'NOOP_ALREADY_DESIRED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED',
      providerCorrelationHash: null
    },
    user: broker
  }), error => error?.code === 'ACCESS_OPERATION_LEASE_INVALID')

  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: LINK_RACE_USER_A_ID,
      displayName: 'Cross Target A',
      email: 'cross.target.a@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: LINK_RACE_USER_B_ID,
      displayName: 'Cross Target B',
      email: 'cross.target.b@example.local',
      role_code: 'DEVELOPER',
      active: true
    }
  ]))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries([
    {
      ID: LINK_RACE_REQUEST_A_ID,
      targetEmailNormalized: 'cross.target@example.invalid',
      linkTargetUser_ID: LINK_RACE_USER_A_ID,
      linkSourceEmailNormalized: 'cross.target.a@example.local',
      openRequestKey: 'l'.repeat(64),
      requestedRole_code: 'DEVELOPER',
      userAdminRequested: false,
      status_code: 'PROVISION_QUEUED',
      requestedBy_ID: ADMIN_ID,
      expiresAt: '2026-08-14T00:00:00.000Z',
      tokenNonce: 'controlled-cross-a-nonce',
      tokenHash: 'm'.repeat(64),
      consumedAt: '2026-08-13T00:00:00.000Z',
      verifiedAt: '2026-08-13T00:00:00.000Z',
      identityOrigin: 'sap.default',
      identityIssuer: 'https://issuer.example.invalid',
      identitySubject: 'cross-target-a',
      identityPlatformUserId: '81000000-0000-4000-8000-000000000029',
      identityKeyHash: 'n'.repeat(64),
      identityEmailNormalized: 'cross.target@example.invalid',
      provisioningVersion: 2,
      latestOperation_ID: LINK_RACE_OPERATION_A_ID,
      correlationId: '81000000-0000-4000-8000-000000000031'
    },
    {
      ID: LINK_RACE_REQUEST_B_ID,
      targetEmailNormalized: 'cross.target@example.invalid',
      linkTargetUser_ID: LINK_RACE_USER_B_ID,
      linkSourceEmailNormalized: 'cross.target.b@example.local',
      openRequestKey: 'o'.repeat(64),
      requestedRole_code: 'DEVELOPER',
      userAdminRequested: false,
      status_code: 'PROVISION_QUEUED',
      requestedBy_ID: ADMIN_ID,
      expiresAt: '2026-08-14T00:00:00.000Z',
      tokenNonce: 'controlled-cross-b-nonce',
      tokenHash: 'p'.repeat(64),
      consumedAt: '2026-08-13T00:00:00.000Z',
      verifiedAt: '2026-08-13T00:00:00.000Z',
      identityOrigin: 'sap.default',
      identityIssuer: 'https://issuer.example.invalid',
      identitySubject: 'cross-target-b',
      identityPlatformUserId: '81000000-0000-4000-8000-000000000030',
      identityKeyHash: 'q'.repeat(64),
      identityEmailNormalized: 'cross.target@example.invalid',
      provisioningVersion: 2,
      latestOperation_ID: LINK_RACE_OPERATION_B_ID,
      correlationId: '81000000-0000-4000-8000-000000000032'
    }
  ]))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries([
    {
      ID: LINK_RACE_OPERATION_A_ID,
      onboardingRequest_ID: LINK_RACE_REQUEST_A_ID,
      operationType: 'LINK_EXISTING',
      state: 'PENDING',
      requestedBy_ID: ADMIN_ID,
      idempotencyKey: 'r'.repeat(64),
      expectedVersion: 2,
      desiredRole_code: 'DEVELOPER',
      desiredUserAdmin: false,
      correlationId: '81000000-0000-4000-8000-000000000031',
      attemptCount: 0
    },
    {
      ID: LINK_RACE_OPERATION_B_ID,
      onboardingRequest_ID: LINK_RACE_REQUEST_B_ID,
      operationType: 'LINK_EXISTING',
      state: 'PENDING',
      requestedBy_ID: ADMIN_ID,
      idempotencyKey: 's'.repeat(64),
      expectedVersion: 2,
      desiredRole_code: 'DEVELOPER',
      desiredUserAdmin: false,
      correlationId: '81000000-0000-4000-8000-000000000032',
      attemptCount: 0
    }
  ]))
  const raceClaimA = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  const raceClaimB = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  assert.deepEqual(new Set([raceClaimA.operationID, raceClaimB.operationID]), new Set([LINK_RACE_OPERATION_A_ID, LINK_RACE_OPERATION_B_ID]))
  const raceCompletions = await Promise.all([
    service.send({
      event: 'completeAccessOperation',
      data: {
        operationID: raceClaimA.operationID,
        leaseToken: raceClaimA.leaseToken,
        resultCode: 'NOOP_ALREADY_DESIRED',
        safeCode: 'ROLE_COLLECTIONS_VERIFIED',
        providerCorrelationHash: null
      },
      user: broker
    }),
    service.send({
      event: 'completeAccessOperation',
      data: {
        operationID: raceClaimB.operationID,
        leaseToken: raceClaimB.leaseToken,
        resultCode: 'NOOP_ALREADY_DESIRED',
        safeCode: 'ROLE_COLLECTIONS_VERIFIED',
        providerCorrelationHash: null
      },
      user: broker
    })
  ])
  assert.deepEqual(raceCompletions.map(result => result.status).sort(), ['ACTIVE', 'BLOCKED_MANUAL_REVIEW'], 'cross-target email race must have one winner and one blocked loser')
  const raceUsers = await db.run(SELECT.from('idts.cap.Users').where({ ID: { in: [LINK_RACE_USER_A_ID, LINK_RACE_USER_B_ID] } }))
  const raceRequests = await db.run(SELECT.from('idts.cap.UserOnboardingRequests').where({ ID: { in: [LINK_RACE_REQUEST_A_ID, LINK_RACE_REQUEST_B_ID] } }))
  assert.equal(raceUsers.filter(user => user.email === 'cross.target@example.invalid').length, 1, 'cross-target email race must materialize one owner')
  assert.equal(raceRequests.filter(request => request.status_code === 'ACTIVE').length, 1, 'cross-target email race must activate one request')
  assert.equal(raceRequests.filter(request => request.status_code === 'BLOCKED_MANUAL_REVIEW').length, 1, 'cross-target email race must block one request')
  const blockedRaceRequest = raceRequests.find(request => request.status_code === 'BLOCKED_MANUAL_REVIEW')
  const blockedRaceUser = raceUsers.find(user => user.ID === blockedRaceRequest.linkTargetUser_ID)
  assert.match(blockedRaceUser.email, /@example\.local$/, 'cross-target email race loser must preserve its legacy email')
  assert.equal(blockedRaceUser.externalIdentityKeyHash, null, 'cross-target email race loser must preserve unlinked identity state')

  await assert.rejects(service.send({
    event: 'claimNextAccessOperation',
    data: {},
    user: new cds.User({ id: 'pm', roles: ['authenticated-user', 'PM', 'UserAdmin'] })
  }), error => Number(error?.status || error?.statusCode || error?.code) === 403)

  cds.env.requires.auth = { kind: 'xsuaa', impl: './custom-auth.js' }
  await assert.rejects(service.send({
    event: 'claimNextAccessOperation',
    data: {},
    user: broker
  }), error => Number(error?.status || error?.statusCode || error?.code) === 403)

  console.log('IDTS provisioning broker programmatic checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
