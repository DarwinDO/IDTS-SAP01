'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const ADMIN_ID = '81000000-0000-4000-8000-000000000001'
const REQUEST_ID = '81000000-0000-4000-8000-000000000002'
const OPERATION_ID = '81000000-0000-4000-8000-000000000003'
const FAILURE_REQUEST_ID = '81000000-0000-4000-8000-000000000006'
const FAILURE_OPERATION_ID = '81000000-0000-4000-8000-000000000007'
const EXPIRED_REQUEST_ID = '81000000-0000-4000-8000-000000000010'
const EXPIRED_OPERATION_ID = '81000000-0000-4000-8000-000000000011'

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
  await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  const expiredOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: EXPIRED_OPERATION_ID }))
  const expiredRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: EXPIRED_REQUEST_ID }))
  assert.equal(expiredOperation.state, 'BLOCKED_MANUAL_REVIEW')
  assert.equal(expiredOperation.leaseTokenHash, null)
  assert.equal(expiredOperation.safeResultCode, 'AMBIGUOUS_PROVIDER_OUTCOME')
  assert.equal(expiredRequest.status_code, 'BLOCKED_MANUAL_REVIEW')

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
