'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const ADMIN_ID = '82000000-0000-4000-8000-000000000001'
const REQUEST_ID = '82000000-0000-4000-8000-000000000002'
const OPERATION_ID = '82000000-0000-4000-8000-000000000003'

async function main () {
  cds.env.requires.auth = { kind: 'xsuaa' }
  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  const componentCategory = await db.run(
    SELECT.one.from('idts.cap.ComponentCategories').columns('ID').where({ active: true })
  )
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: ADMIN_ID,
    displayName: 'Controlled Administrator',
    email: 'admin.developer@example.invalid',
    role_code: 'PM',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: REQUEST_ID,
    targetEmailNormalized: 'new.developer@example.invalid',
    openRequestKey: '8'.repeat(64),
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    developerAvailabilityStatus_code: 'AVAILABLE',
    developerWorkloadLimit: 3,
    status_code: 'PROVISION_QUEUED',
    requestedBy_ID: ADMIN_ID,
    expiresAt: '2026-08-20T00:00:00.000Z',
    tokenNonce: 'controlled-developer-nonce',
    tokenHash: '9'.repeat(64),
    consumedAt: '2026-08-19T00:00:00.000Z',
    verifiedAt: '2026-08-19T00:00:00.000Z',
    identityOrigin: 'sap.default',
    identityIssuer: 'https://issuer.example.invalid',
    identitySubject: 'stable-developer-uuid',
    identityPlatformUserId: '82000000-0000-4000-8000-000000000020',
    identityKeyHash: 'a'.repeat(64),
    identityEmailNormalized: 'new.developer@example.invalid',
    provisioningVersion: 1,
    correlationId: '82000000-0000-4000-8000-000000000004'
  }))
  await db.run(INSERT.into('idts.cap.UserOnboardingDeveloperResponsibilities').entries({
    ID: '82000000-0000-4000-8000-000000000005',
    onboardingRequest_ID: REQUEST_ID,
    componentCategory_ID: componentCategory.ID,
    sapModule_ID: null,
    responsibilityLevel_code: 'PRIMARY'
  }))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries({
    ID: OPERATION_ID,
    onboardingRequest_ID: REQUEST_ID,
    operationType: 'PROVISION',
    state: 'PENDING',
    requestedBy_ID: ADMIN_ID,
    idempotencyKey: 'b'.repeat(64),
    expectedVersion: 1,
    desiredRole_code: 'DEVELOPER',
    desiredUserAdmin: false,
    correlationId: '82000000-0000-4000-8000-000000000006',
    attemptCount: 0
  }))

  const service = await cds.serve('ProvisioningBrokerService').from('srv/provisioning-broker.cds')
  const broker = new cds.User({ id: 'broker-client', roles: ['authenticated-user', 'ProvisioningBroker'] })
  const claimed = await service.send({ event: 'claimNextAccessOperation', data: {}, user: broker })
  const completed = await service.send({
    event: 'completeAccessOperation',
    data: {
      operationID: OPERATION_ID,
      leaseToken: claimed.leaseToken,
      resultCode: 'APPLIED',
      safeCode: 'ROLE_COLLECTIONS_VERIFIED'
    },
    user: broker
  })
  assert.equal(completed.status, 'ACTIVE')
  const request = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: REQUEST_ID }))
  const user = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: request.activeUser_ID }))
  const profile = await db.run(SELECT.one.from('idts.cap.DeveloperProfiles').where({ user_ID: user.ID }))
  const responsibilities = await db.run(
    SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: profile.ID, active: true })
  )
  assert.equal(request.status_code, 'ACTIVE')
  assert.equal(user.role_code, 'DEVELOPER')
  assert.equal(user.active, true)
  assert.equal(profile.availabilityStatus_code, 'AVAILABLE')
  assert.equal(profile.workloadLimit, 3)
  assert.equal(profile.active, true)
  assert.equal(responsibilities.length, 1)
  assert.equal(responsibilities[0].componentCategory_ID, componentCategory.ID)

  console.log('IDTS Developer provisioning completion: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
