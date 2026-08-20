'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const root = path.resolve(__dirname, '../..')
const cdsSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')

const required = [
  'type ActiveUserSummary',
  'type ActiveUserDetails',
  'action searchActiveUsers(query : String(255), includeNonActive : Boolean, skip : Integer, top : Integer) returns many ActiveUserSummary;',
  'action readActiveUserDetails('
]
for (const marker of required) assert.ok(cdsSource.includes(marker), marker)

const activeUserContract = cdsSource.slice(cdsSource.indexOf('type ActiveUserSummary'))
for (const forbidden of [
  'identityOrigin',
  'identityIssuer',
  'identitySubject',
  'identityKeyHash',
  'identityPlatformUserId'
]) {
  assert.equal(activeUserContract.includes(forbidden), false, forbidden)
}

const PM_ID = '82000000-0000-4000-8000-000000000001'
const ACTIVE_USER_ID = '82000000-0000-4000-8000-000000000002'
const AMBIGUOUS_USER_ID = '82000000-0000-4000-8000-000000000003'
const REVOKED_USER_ID = '82000000-0000-4000-8000-000000000004'
const SUSPENDED_USER_ID = '82000000-0000-4000-8000-000000000005'
const INCOMPLETE_USER_ID = '82000000-0000-4000-8000-000000000006'
const UNLINKED_ACTIVE_USER_ID = '82000000-0000-4000-8000-000000000007'
const ACTIVE_REQUEST_ID = '82100000-0000-4000-8000-000000000001'
const EXPIRED_REQUEST_A_ID = '82100000-0000-4000-8000-000000000002'
const EXPIRED_REQUEST_B_ID = '82100000-0000-4000-8000-000000000003'
const AMBIGUOUS_REQUEST_A_ID = '82100000-0000-4000-8000-000000000004'
const AMBIGUOUS_REQUEST_B_ID = '82100000-0000-4000-8000-000000000005'
const REVOKED_REQUEST_ID = '82100000-0000-4000-8000-000000000006'
const SUSPENDED_REQUEST_ID = '82100000-0000-4000-8000-000000000007'
const UNLINKED_ACTIVE_REQUEST_ID = '82100000-0000-4000-8000-000000000008'
const ACTIVE_OPERATION_ID = '82200000-0000-4000-8000-000000000001'
const STALE_OPERATION_ID = '82200000-0000-4000-8000-000000000002'
const REVOKED_OPERATION_ID = '82200000-0000-4000-8000-000000000003'
const SUSPENDED_OPERATION_ID = '82200000-0000-4000-8000-000000000004'
const ACTIVE_PROFILE_ID = '82300000-0000-4000-8000-000000000001'
const ACTIVE_AUDIT_ID = '82400000-0000-4000-8000-000000000001'
const PAGED_USER_COUNT = 205

const ACTIVE_HASH = 'a'.repeat(64)
const REVOKED_HASH = 'b'.repeat(64)
const SUSPENDED_HASH = 'c'.repeat(64)

function requestEntry (ID, values) {
  return {
    ID,
    targetEmailNormalized: values.targetEmailNormalized,
    requestedRole_code: values.requestedRole_code || 'TESTER',
    userAdminRequested: values.userAdminRequested === true,
    status_code: values.status_code,
    requestedBy_ID: PM_ID,
    expiresAt: '2026-09-01T00:00:00.000Z',
    tokenNonce: `${ID}-nonce`,
    tokenHash: `${ID}-hash`,
    correlationId: ID,
    provisioningVersion: 1,
    activeUser_ID: values.activeUser_ID || null,
    identityKeyHash: values.identityKeyHash || null,
    latestOperation_ID: values.latestOperation_ID || null,
    createdAt: values.createdAt,
    modifiedAt: values.modifiedAt
  }
}

function operationEntry (ID, values) {
  return {
    ID,
    onboardingRequest_ID: values.onboardingRequest_ID,
    operationType: values.operationType,
    state: values.state,
    requestedBy_ID: PM_ID,
    idempotencyKey: ID.replaceAll('-', '').padEnd(64, '0'),
    expectedVersion: 1,
    desiredRole_code: values.desiredRole_code || 'TESTER',
    desiredUserAdmin: false,
    correlationId: ID,
    attemptCount: values.state === 'PENDING' ? 0 : 1,
    completedAt: values.completedAt || null,
    safeResultCode: values.safeResultCode || null,
    createdAt: values.createdAt,
    modifiedAt: values.modifiedAt
  }
}

function administrator () {
  return new cds.User({
    id: 'gate2.admin@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })
}

function pagedUserID (index) {
  return `82000000-0000-4000-8000-${String(100 + index).padStart(12, '0')}`
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status &&
    (code === undefined || error?.code === code))
}

async function main () {
  const { deriveAccessState } = require('../../srv/user-admin/active-users')

  assert.equal(deriveAccessState({ userActive: true, requestStatus: 'ACTIVE' }), 'ACTIVE')
  assert.equal(deriveAccessState({ userActive: false, requestStatus: 'REVOKED' }), 'REVOKED')
  assert.equal(deriveAccessState({ userActive: false, requestStatus: 'ROLE_CHANGE_QUEUED' }), 'SUSPENDED')
  assert.equal(deriveAccessState({ userActive: false, requestStatus: null }), 'INCOMPLETE')

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: PM_ID,
      displayName: 'Gate 2 PM',
      email: 'gate2.admin@example.invalid',
      role_code: 'PM',
      active: true
    },
    {
      ID: ACTIVE_USER_ID,
      displayName: 'Active Alice',
      email: 'alice@example.invalid',
      role_code: 'DEVELOPER',
      externalIdentityKeyHash: ACTIVE_HASH,
      active: true
    },
    {
      ID: AMBIGUOUS_USER_ID,
      displayName: 'Ambiguous User',
      email: 'ambiguous@example.invalid',
      role_code: 'TESTER',
      active: true
    },
    {
      ID: REVOKED_USER_ID,
      displayName: 'Revoked User',
      email: 'revoked@example.invalid',
      role_code: 'TESTER',
      externalIdentityKeyHash: REVOKED_HASH,
      active: false
    },
    {
      ID: SUSPENDED_USER_ID,
      displayName: 'Suspended User',
      email: 'suspended@example.invalid',
      role_code: 'PM',
      externalIdentityKeyHash: SUSPENDED_HASH,
      active: false
    },
    {
      ID: INCOMPLETE_USER_ID,
      displayName: 'Incomplete User',
      email: 'incomplete@example.invalid',
      role_code: 'TESTER',
      active: false
    },
    {
      ID: UNLINKED_ACTIVE_USER_ID,
      displayName: 'Unlinked Active User',
      email: 'unlinked-active@example.invalid',
      role_code: 'TESTER',
      active: true
    }
  ]))
  await db.run(INSERT.into('idts.cap.Users').entries(Array.from({ length: PAGED_USER_COUNT }, (_, index) => ({
    ID: pagedUserID(index),
    displayName: `Paged User ${String(index).padStart(3, '0')}`,
    email: `paged-${String(index).padStart(3, '0')}@example.invalid`,
    role_code: 'TESTER',
    active: true
  }))))

  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries([
    requestEntry(ACTIVE_REQUEST_ID, {
      targetEmailNormalized: 'alice@example.invalid',
      requestedRole_code: 'DEVELOPER',
      activeUser_ID: ACTIVE_USER_ID,
      identityKeyHash: ACTIVE_HASH,
      latestOperation_ID: ACTIVE_OPERATION_ID,
      status_code: 'ACTIVE',
      createdAt: '2026-08-19T08:00:00.000Z',
      modifiedAt: '2026-08-20T10:00:00.000Z'
    }),
    requestEntry(EXPIRED_REQUEST_A_ID, {
      targetEmailNormalized: 'alice@example.invalid',
      status_code: 'FAILED',
      createdAt: '2026-08-17T08:00:00.000Z',
      modifiedAt: '2026-08-17T09:00:00.000Z'
    }),
    requestEntry(EXPIRED_REQUEST_B_ID, {
      targetEmailNormalized: 'alice@example.invalid',
      status_code: 'INVITED',
      createdAt: '2026-08-18T08:00:00.000Z',
      modifiedAt: '2026-08-18T09:00:00.000Z'
    }),
    requestEntry(AMBIGUOUS_REQUEST_A_ID, {
      targetEmailNormalized: 'ambiguous@example.invalid',
      activeUser_ID: AMBIGUOUS_USER_ID,
      identityKeyHash: 'd'.repeat(64),
      status_code: 'ACTIVE',
      createdAt: '2026-08-19T08:00:00.000Z',
      modifiedAt: '2026-08-20T08:00:00.000Z'
    }),
    requestEntry(AMBIGUOUS_REQUEST_B_ID, {
      targetEmailNormalized: 'ambiguous@example.invalid',
      activeUser_ID: AMBIGUOUS_USER_ID,
      identityKeyHash: 'e'.repeat(64),
      status_code: 'ACTIVE',
      createdAt: '2026-08-19T09:00:00.000Z',
      modifiedAt: '2026-08-20T09:00:00.000Z'
    }),
    requestEntry(REVOKED_REQUEST_ID, {
      targetEmailNormalized: 'revoked@example.invalid',
      activeUser_ID: REVOKED_USER_ID,
      identityKeyHash: REVOKED_HASH,
      latestOperation_ID: REVOKED_OPERATION_ID,
      status_code: 'REVOKED',
      createdAt: '2026-08-18T08:00:00.000Z',
      modifiedAt: '2026-08-20T09:00:00.000Z'
    }),
    requestEntry(SUSPENDED_REQUEST_ID, {
      targetEmailNormalized: 'suspended@example.invalid',
      requestedRole_code: 'PM',
      activeUser_ID: SUSPENDED_USER_ID,
      identityKeyHash: SUSPENDED_HASH,
      latestOperation_ID: SUSPENDED_OPERATION_ID,
      status_code: 'ROLE_CHANGE_QUEUED',
      createdAt: '2026-08-20T08:00:00.000Z',
      modifiedAt: '2026-08-20T09:00:00.000Z'
    }),
    requestEntry(UNLINKED_ACTIVE_REQUEST_ID, {
      targetEmailNormalized: 'unlinked-active@example.invalid',
      activeUser_ID: UNLINKED_ACTIVE_USER_ID,
      identityKeyHash: 'f'.repeat(64),
      status_code: 'ACTIVE',
      createdAt: '2026-08-20T08:30:00.000Z',
      modifiedAt: '2026-08-20T09:30:00.000Z'
    })
  ]))

  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries([
    operationEntry(ACTIVE_OPERATION_ID, {
      onboardingRequest_ID: ACTIVE_REQUEST_ID,
      operationType: 'PROVISION',
      state: 'SUCCEEDED',
      safeResultCode: 'ROLE_COLLECTIONS_VERIFIED',
      completedAt: '2026-08-20T10:01:00.000Z',
      createdAt: '2026-08-20T09:00:00.000Z',
      modifiedAt: '2026-08-20T10:01:00.000Z'
    }),
    operationEntry(STALE_OPERATION_ID, {
      onboardingRequest_ID: ACTIVE_REQUEST_ID,
      operationType: 'REVOKE',
      state: 'SUCCEEDED',
      safeResultCode: 'STALE_RESULT',
      completedAt: '2026-08-20T11:01:00.000Z',
      createdAt: '2026-08-20T11:00:00.000Z',
      modifiedAt: '2026-08-20T11:01:00.000Z'
    }),
    operationEntry(REVOKED_OPERATION_ID, {
      onboardingRequest_ID: REVOKED_REQUEST_ID,
      operationType: 'REVOKE',
      state: 'SUCCEEDED',
      safeResultCode: 'ROLE_COLLECTIONS_REVOKED',
      completedAt: '2026-08-20T09:01:00.000Z',
      createdAt: '2026-08-20T09:00:00.000Z',
      modifiedAt: '2026-08-20T09:01:00.000Z'
    }),
    operationEntry(SUSPENDED_OPERATION_ID, {
      onboardingRequest_ID: SUSPENDED_REQUEST_ID,
      operationType: 'CHANGE_ROLE',
      state: 'PENDING',
      createdAt: '2026-08-20T09:00:00.000Z',
      modifiedAt: '2026-08-20T09:00:00.000Z'
    })
  ]))

  const componentCategory = await db.run(SELECT.one.from('idts.cap.ComponentCategories').columns('ID').where({ active: true }))
  assert.ok(componentCategory)
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: ACTIVE_PROFILE_ID,
    user_ID: ACTIVE_USER_ID,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 3,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: '82310000-0000-4000-8000-000000000001',
    developerProfile_ID: ACTIVE_PROFILE_ID,
    componentCategory_ID: componentCategory.ID,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: ACTIVE_AUDIT_ID,
    targetUser_ID: ACTIVE_USER_ID,
    actor_ID: PM_ID,
    action: 'PROVISION',
    result: 'APPLIED',
    correlationId: ACTIVE_AUDIT_ID,
    detailsSummary: 'Controlled Gate 2 test audit.'
  }))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const admin = administrator()
  const defaultRows = await service.send({
    event: 'searchActiveUsers',
    data: { query: '', includeNonActive: false, skip: 0, top: 100 },
    user: admin
  })
  const fixtureDefaultRows = defaultRows.filter(row => [
    ACTIVE_USER_ID,
    AMBIGUOUS_USER_ID,
    PM_ID,
    INCOMPLETE_USER_ID,
    SUSPENDED_USER_ID,
    REVOKED_USER_ID
  ].includes(row.userID))
  assert.deepEqual(fixtureDefaultRows.map(row => row.userID), [ACTIVE_USER_ID, AMBIGUOUS_USER_ID, PM_ID, INCOMPLETE_USER_ID])
  const defaultSuspendedRows = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Suspended User', includeNonActive: false, skip: 0, top: 100 },
    user: admin
  })
  assert.deepEqual(defaultSuspendedRows.map(row => row.userID), [SUSPENDED_USER_ID])

  const activeAlice = defaultRows[0]
  assert.equal(activeAlice.displayName, 'Active Alice')
  assert.equal(activeAlice.businessRole, 'DEVELOPER')
  assert.equal(activeAlice.accessState, 'ACTIVE')
  assert.equal(activeAlice.identityLinked, true)
  assert.equal(activeAlice.developerReady, true)
  assert.equal(activeAlice.activeResponsibilityCount, 1)
  assert.equal(activeAlice.lastSafeResultCode, 'ROLE_COLLECTIONS_VERIFIED')
  assert.equal(activeAlice.lastReconciledAt, '2026-08-20T10:01:00.000Z')
  assert.equal(activeAlice.pendingOperationType, null)
  assert.equal(activeAlice.pendingOperationState, null)

  const revoked = (await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Revoked User', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }))[0]
  const suspended = (await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Suspended User', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }))[0]
  const ambiguous = (await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Ambiguous User', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }))[0]
  const incomplete = (await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Incomplete User', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }))[0]
  assert.equal(revoked.accessState, 'REVOKED')
  assert.equal(suspended.accessState, 'SUSPENDED')
  assert.equal(suspended.pendingOperationType, 'CHANGE_ROLE')
  assert.equal(suspended.pendingOperationState, 'PENDING')
  assert.equal(ambiguous.accessState, 'INCOMPLETE')
  assert.equal(incomplete.accessState, 'INCOMPLETE')
  assert.equal(revoked.userID, REVOKED_USER_ID)

  const unlinkedActive = (await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Unlinked Active User', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }))[0]
  assert.equal(unlinkedActive.identityLinked, false)
  assert.equal(unlinkedActive.accessState, 'INCOMPLETE')

  const roleSearch = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'DeVeLoPeR', includeNonActive: false, skip: 0, top: 100 },
    user: admin
  })
  assert.equal(roleSearch.some(row => row.userID === ACTIVE_USER_ID), true)
  assert.equal(roleSearch.every(row => row.businessRole === 'DEVELOPER'), true)
  const stateSearch = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'sUsPeNdEd', includeNonActive: true, skip: 0, top: 100 },
    user: admin
  })
  assert.deepEqual(stateSearch.map(row => row.userID), [SUSPENDED_USER_ID])
  await expectRejected(service.send({
    event: 'searchActiveUsers',
    data: { query: 'x'.repeat(256), includeNonActive: true, skip: 0, top: 100 },
    user: admin
  }), 400)

  const pageOne = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Paged User', includeNonActive: false, skip: 0, top: 100 },
    user: admin
  })
  const pageTwo = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Paged User', includeNonActive: false, skip: 100, top: 100 },
    user: admin
  })
  const pageThree = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Paged User', includeNonActive: false, skip: 200, top: 100 },
    user: admin
  })
  const pageFour = await service.send({
    event: 'searchActiveUsers',
    data: { query: 'Paged User', includeNonActive: false, skip: 300, top: 100 },
    user: admin
  })
  assert.equal(pageOne.length, 100)
  assert.equal(pageTwo.length, 100)
  assert.equal(pageThree.length, 5)
  assert.equal(pageFour.length, 0)
  assert.equal(new Set([...pageOne, ...pageTwo, ...pageThree].map(row => row.userID)).size, PAGED_USER_COUNT)
  assert.equal(pageOne.some(left => pageTwo.some(right => left.userID === right.userID)), false)
  assert.equal(pageOne[pageOne.length - 1].displayName < pageTwo[0].displayName, true)
  assert.equal(pageTwo[pageTwo.length - 1].displayName < pageThree[0].displayName, true)
  assert.deepEqual(
    [...pageOne, ...pageTwo, ...pageThree].map(row => row.userID),
    Array.from({ length: PAGED_USER_COUNT }, (_, index) => pagedUserID(index))
  )
  await expectRejected(service.send({
    event: 'searchActiveUsers',
    data: { query: '', includeNonActive: false, skip: -1, top: 100 },
    user: admin
  }), 400, 'INVALID_PAGE')
  await expectRejected(service.send({
    event: 'searchActiveUsers',
    data: { query: '', includeNonActive: false, skip: 0, top: 101 },
    user: admin
  }), 400, 'INVALID_PAGE')

  const details = await service.send({
    event: 'readActiveUserDetails',
    data: { userID: ACTIVE_USER_ID },
    user: admin
  })
  assert.equal(details.userID, ACTIVE_USER_ID)
  assert.equal(details.requestCount, 3)
  assert.equal(details.auditEventCount, 1)
  assert.equal(details.developerProfileID, ACTIVE_PROFILE_ID)
  assert.equal(details.developerAvailabilityStatus, 'AVAILABLE')
  assert.equal(details.developerWorkloadLimit, 3)
  assert.equal(details.developerOpenBugImpactCount, 0)

  for (const forbidden of [
    'identityOrigin',
    'identityIssuer',
    'identitySubject',
    'identityKeyHash',
    'identityPlatformUserId'
  ]) {
    assert.equal(forbidden in activeAlice, false, forbidden)
    assert.equal(forbidden in details, false, forbidden)
  }

  for (const user of [
    new cds.User({ id: 'gate2.admin@example.invalid', roles: ['authenticated-user', 'PM'] }),
    new cds.User({ id: 'gate2.admin@example.invalid', roles: ['authenticated-user', 'TESTER', 'UserAdmin'] }),
    new cds.User({ id: 'gate2.admin@example.invalid', roles: ['authenticated-user', 'PM', 'TESTER', 'UserAdmin'] })
  ]) {
    await expectRejected(service.send({
      event: 'searchActiveUsers',
      data: { query: '', includeNonActive: false, skip: 0, top: 100 },
      user
    }), 403, 'USER_ADMIN_REQUIRED')
  }
  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: PM_ID }))
  await expectRejected(service.send({
    event: 'searchActiveUsers',
    data: { query: '', includeNonActive: false, skip: 0, top: 100 },
    user: admin
  }), 403, 'USER_ADMIN_REQUIRED')

  console.log('IDTS Active Users contract and aggregation: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
