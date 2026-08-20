'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const root = path.resolve(__dirname, '../..')
const serviceSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')
const statusSource = fs.readFileSync(path.join(root, 'db/data/idts.cap-UserOnboardingStatuses.csv'), 'utf8')

assert.match(
  serviceSource,
  /action\s+requestSuspend\(\s*userID\s*:\s*UUID,\s*reason\s*:\s*String\(500\),\s*expectedVersion\s*:\s*Integer\s*\)\s*returns\s+OnboardingResult\s*;/
)
assert.match(
  serviceSource,
  /action\s+requestReactivate\(\s*userID\s*:\s*UUID,\s*reason\s*:\s*String\(500\),\s*expectedVersion\s*:\s*Integer\s*\)\s*returns\s+OnboardingResult\s*;/
)

const rows = statusSource.trim().split(/\r?\n/).slice(1).map(line => {
  const [code, name, descr, sortOrder, active, criticality] = line.split(',')
  return { code, name, descr, sortOrder: Number(sortOrder), active, criticality: Number(criticality) }
})
const existingCodes = new Set([
  'INVITED',
  'IDENTITY_VERIFIED',
  'PENDING_APPROVAL',
  'PROVISION_QUEUED',
  'PROVISIONING',
  'ROLE_CHANGE_QUEUED',
  'ROLE_CHANGING',
  'REVOKE_QUEUED',
  'REVOKING',
  'ACTIVE',
  'RETRYABLE_FAILURE',
  'BLOCKED_MANUAL_REVIEW',
  'FAILED',
  'REVOKED'
])
assert.equal(rows.length, existingCodes.size + 1)
assert.deepEqual(new Set(rows.filter(row => row.code !== 'SUSPENDED').map(row => row.code)), existingCodes)
assert.deepEqual(rows.filter(row => row.code === 'SUSPENDED'), [{
  code: 'SUSPENDED',
  name: 'Suspended',
  descr: 'IDTS-local access is suspended pending an explicit reactivation.',
  sortOrder: 105,
  active: 'true',
  criticality: 1
}])
assert.equal(rows.filter(row => row.code === 'SUSPENDED' && row.active === 'true').length, 1)
assert.equal(rows.find(row => row.code === 'ACTIVE').sortOrder < rows.find(row => row.code === 'SUSPENDED').sortOrder, true)
assert.equal(rows.find(row => row.code === 'SUSPENDED').sortOrder < rows.find(row => row.code === 'RETRYABLE_FAILURE').sortOrder, true)

const ADMIN_ONE_ID = '83000000-0000-4000-8000-000000000001'
const ADMIN_TWO_ID = '83000000-0000-4000-8000-000000000002'
const TARGET_ID = '83000000-0000-4000-8000-000000000010'
const ADMIN_ONE_REQUEST_ID = '83100000-0000-4000-8000-000000000001'
const ADMIN_TWO_REQUEST_ID = '83100000-0000-4000-8000-000000000002'
const TARGET_REQUEST_ID = '83100000-0000-4000-8000-000000000010'
const TARGET_SESSION_ONE_ID = '83200000-0000-4000-8000-000000000001'
const TARGET_SESSION_TWO_ID = '83200000-0000-4000-8000-000000000002'
const TARGET_SESSION_REVOKED_ID = '83200000-0000-4000-8000-000000000003'
const TARGET_IDENTITY_HASH = 'a'.repeat(64)

function requestEntry (ID, values) {
  return {
    ID,
    targetEmailNormalized: values.email,
    requestedRole_code: values.role,
    userAdminRequested: values.userAdmin === true,
    status_code: values.status,
    requestedBy_ID: values.requestedBy,
    expiresAt: '2026-09-01T00:00:00.000Z',
    tokenNonce: `${ID}-nonce`,
    tokenHash: `${ID}-hash`,
    provisioningVersion: values.version,
    activeUser_ID: values.userID,
    identityOrigin: values.identityOrigin || 'sap.default',
    identityIssuer: values.identityIssuer || 'https://issuer.example.invalid',
    identitySubject: values.identitySubject || `${ID}-subject`,
    identityPlatformUserId: values.identityPlatformUserId || `${ID}-platform`,
    identityKeyHash: values.identityKeyHash || `${ID.replaceAll('-', '').slice(0, 64)}`,
    identityEmailNormalized: values.email,
    correlationId: `${ID}-correlation`
  }
}

function administrator (email) {
  return new cds.User({ id: email, roles: ['authenticated-user', 'PM', 'UserAdmin'] })
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && error?.code === code)
}

async function runProgrammaticLifecycleChecks () {
  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: ADMIN_ONE_ID,
      displayName: 'Lifecycle Admin One',
      email: 'lifecycle.admin.one@example.invalid',
      role_code: 'PM',
      active: true
    },
    {
      ID: ADMIN_TWO_ID,
      displayName: 'Lifecycle Admin Two',
      email: 'lifecycle.admin.two@example.invalid',
      role_code: 'PM',
      active: true
    },
    {
      ID: TARGET_ID,
      displayName: 'Lifecycle Target',
      email: 'lifecycle.target@example.invalid',
      role_code: 'TESTER',
      active: true,
      externalIdentityKeyHash: TARGET_IDENTITY_HASH
    }
  ]))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries([
    requestEntry(ADMIN_ONE_REQUEST_ID, {
      email: 'lifecycle.admin.one@example.invalid',
      role: 'PM',
      userAdmin: true,
      status: 'ACTIVE',
      requestedBy: ADMIN_ONE_ID,
      version: 1,
      userID: ADMIN_ONE_ID
    }),
    requestEntry(ADMIN_TWO_REQUEST_ID, {
      email: 'lifecycle.admin.two@example.invalid',
      role: 'PM',
      userAdmin: true,
      status: 'ACTIVE',
      requestedBy: ADMIN_ONE_ID,
      version: 1,
      userID: ADMIN_TWO_ID
    }),
    requestEntry(TARGET_REQUEST_ID, {
      email: 'lifecycle.target@example.invalid',
      role: 'TESTER',
      status: 'ACTIVE',
      requestedBy: ADMIN_ONE_ID,
      version: 7,
      userID: TARGET_ID,
      identityKeyHash: TARGET_IDENTITY_HASH
    })
  ]))
  await db.run(INSERT.into('idts.cap.AuthSessions').entries([
    {
      ID: TARGET_SESSION_ONE_ID,
      user_ID: TARGET_ID,
      tokenHash: 'b'.repeat(64),
      issuedAt: '2026-08-20T00:00:00.000Z',
      expiresAt: '2026-08-21T00:00:00.000Z'
    },
    {
      ID: TARGET_SESSION_TWO_ID,
      user_ID: TARGET_ID,
      tokenHash: 'c'.repeat(64),
      issuedAt: '2026-08-20T00:00:00.000Z',
      expiresAt: '2026-08-21T00:00:00.000Z'
    },
    {
      ID: TARGET_SESSION_REVOKED_ID,
      user_ID: TARGET_ID,
      tokenHash: 'd'.repeat(64),
      issuedAt: '2026-08-19T00:00:00.000Z',
      expiresAt: '2026-08-20T12:00:00.000Z',
      revokedAt: '2026-08-20T12:01:00.000Z'
    }
  ]))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const adminOne = administrator('lifecycle.admin.one@example.invalid')
  const adminTwo = administrator('lifecycle.admin.two@example.invalid')
  const beforeOperations = await db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: TARGET_REQUEST_ID }))

  const suspended = await service.send({
    event: 'requestSuspend',
    data: {
      userID: TARGET_ID,
      reason: 'Temporarily suspend access during controlled review.',
      expectedVersion: 7
    },
    user: adminOne
  })
  assert.equal(suspended.status, 'SUSPENDED')
  assert.equal(suspended.provisioningVersion, 8)

  const suspendedUser = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: TARGET_ID }))
  const suspendedRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: TARGET_REQUEST_ID }))
  const suspendedSessions = await db.run(SELECT.from('idts.cap.AuthSessions').where({ user_ID: TARGET_ID }))
  const suspensionAudit = await db.run(
    SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({
      onboardingRequest_ID: TARGET_REQUEST_ID,
      targetUser_ID: TARGET_ID,
      action: 'REQUEST_SUSPEND'
    })
  )
  assert.equal(suspendedUser.active, false)
  assert.equal(suspendedRequest.status_code, 'SUSPENDED')
  assert.equal(suspendedRequest.provisioningVersion, 8)
  assert.equal(suspendedSessions.filter(session => session.ID !== TARGET_SESSION_REVOKED_ID).every(session => session.revokedAt), true)
  assert.equal(suspendedSessions.find(session => session.ID === TARGET_SESSION_REVOKED_ID).revokedAt, '2026-08-20T12:01:00.000Z')
  assert.equal(suspensionAudit.result, 'QUEUED')
  assert.equal(suspendedRequest.latestOperation_ID, null)
  assert.equal((await db.run(SELECT.from('idts.cap.UserAccessOperations').where({ onboardingRequest_ID: TARGET_REQUEST_ID }))).length, beforeOperations.length)

  await expectRejected(service.send({
    event: 'requestSuspend',
    data: { userID: TARGET_ID, reason: 'Already inactive.', expectedVersion: 8 },
    user: adminOne
  }), 404, 'ACTIVE_USER_NOT_FOUND')
  await expectRejected(service.send({
    event: 'requestReactivate',
    data: { userID: TARGET_ID, reason: 'Wrong version.', expectedVersion: 7 },
    user: adminOne
  }), 409, 'ONBOARDING_VERSION_CONFLICT')

  const reactivated = await service.send({
    event: 'requestReactivate',
    data: { userID: TARGET_ID, reason: 'Provider state will be reconciled before access returns.', expectedVersion: 8 },
    user: adminOne
  })
  assert.equal(reactivated.status, 'SUSPENDED')
  assert.equal(reactivated.provisioningVersion, 9)
  const reactivationRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: TARGET_REQUEST_ID }))
  const reactivationOperation = await db.run(SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: reactivationRequest.latestOperation_ID }))
  const reactivationAudit = await db.run(
    SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({
      onboardingRequest_ID: TARGET_REQUEST_ID,
      action: 'REQUEST_REACTIVATE'
    })
  )
  assert.equal(reactivationRequest.status_code, 'SUSPENDED')
  assert.equal(reactivationRequest.provisioningVersion, 9)
  assert.equal(reactivationOperation.operationType, 'REACTIVATE')
  assert.equal(reactivationOperation.state, 'PENDING')
  assert.equal(reactivationOperation.desiredRole_code, 'TESTER')
  assert.equal(reactivationOperation.desiredUserAdmin, false)
  assert.equal(reactivationAudit.result, 'QUEUED')
  assert.equal((await db.run(SELECT.one.from('idts.cap.Users').where({ ID: TARGET_ID }))).active, false)

  const concurrent = await Promise.allSettled([
    service.send({
      event: 'requestSuspend',
      data: { userID: ADMIN_ONE_ID, reason: 'Concurrent final-admin suspension one.', expectedVersion: 1 },
      user: adminOne
    }),
    service.send({
      event: 'requestSuspend',
      data: { userID: ADMIN_TWO_ID, reason: 'Concurrent final-admin suspension two.', expectedVersion: 1 },
      user: adminTwo
    })
  ])
  assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(concurrent.filter(result => result.status === 'rejected' && result.reason?.code === 'LAST_USER_ADMIN_REQUIRED').length, 1)

  const activeAdmin = await db.run(SELECT.one.from('idts.cap.Users').where({
    ID: { in: [ADMIN_ONE_ID, ADMIN_TWO_ID] },
    role_code: 'PM',
    active: true
  }))
  const activeAdminRequest = await db.run(SELECT.one.from('idts.cap.UserOnboardingRequests').where({ activeUser_ID: activeAdmin.ID, status_code: 'ACTIVE' }))
  await expectRejected(service.send({
    event: 'requestSuspend',
    data: { userID: activeAdmin.ID, reason: 'Final administrator must remain.', expectedVersion: activeAdminRequest.provisioningVersion },
    user: activeAdmin.ID === ADMIN_ONE_ID ? adminOne : adminTwo
  }), 409, 'LAST_USER_ADMIN_REQUIRED')
  assert.equal((await db.run(SELECT.one.from('idts.cap.Users').where({ ID: activeAdmin.ID }))).active, true)

  console.log('IDTS access lifecycle transaction checks: PASS')
}

runProgrammaticLifecycleChecks().catch(error => {
  console.error(error)
  process.exitCode = 1
})
