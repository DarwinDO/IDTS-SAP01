'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const fs = require('node:fs')
const path = require('node:path')
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')
const { INSERT, SELECT, UPDATE } = cds.ql

const PM_ID = '72000000-0000-4000-8000-000000000001'
const DEV_ID = '72000000-0000-4000-8000-000000000002'
const PROFILE_ID = '72000000-0000-4000-8000-000000000003'
const RESPONSIBILITY_ID = '72000000-0000-4000-8000-000000000004'

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && error?.code === code)
}

const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

async function runAtomicProfileActionCase (caseKey) {
  const csn = await cds.load('srv/service.cds')
  const db = await cds.deploy(csn).to('sqlite::memory:')
  cds.db = db
  const componentCategories = await db.run(
    SELECT.from('idts.cap.ComponentCategories').columns('ID').where({ active: true }).limit(2)
  )
  assert.equal(componentCategories.length, 2)

  const activeComponent = { ID: '72000000-0000-0000-0000-000000000011' }
  const activeDefectCategory = { ID: '72000000-0000-0000-0000-000000000012' }
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({
    ...activeComponent,
    code: 'PROFILE-ATOMIC',
    name: 'Profile atomic component',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DefectCategories').entries({
    ...activeDefectCategory,
    code: 'PROFILE-ATOMIC',
    name: 'Profile atomic category',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: PM_ID, displayName: 'Atomic PM', email: 'pm.atomic@example.invalid', role_code: 'PM', active: true },
    { ID: DEV_ID, displayName: 'Atomic Developer', email: 'dev.atomic@example.invalid', role_code: 'DEVELOPER', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: PROFILE_ID,
    user_ID: DEV_ID,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 3,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperProfileAdministrationStates').entries({
    ID: '72000000-0000-0000-0000-000000000005',
    developerProfile_ID: PROFILE_ID,
    administrationVersion: 0
  }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: RESPONSIBILITY_ID,
    developerProfile_ID: PROFILE_ID,
    componentCategory_ID: componentCategories[0].ID,
    sapModule_ID: null,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))
  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = new cds.User({ id: 'pm.atomic@example.invalid', roles: ['authenticated-user', 'PM', 'UserAdmin'] })
  if (caseKey === 'IDTS110-P189') {
    const profile = await service.send({ event: 'readDeveloperProfile', data: { userID: DEV_ID }, user: administrator })
    assert.equal(profile.availabilityStatusCode, 'AVAILABLE')
    assert.equal(profile.workloadLimit, 3)
    assert.equal(profile.ready, true)
    assert.equal(profile.activeResponsibilityCount, 1)
    assert.deepEqual(Object.keys(profile).sort(), [
      'activeResponsibilityCount', 'administrationVersion', 'availabilityStatusCode',
      'developerProfileID', 'openBugImpactCount', 'ready', 'responsibilities',
      'userID', 'workloadLimit'
    ])
    assert.deepEqual(Object.keys(profile.responsibilities[0]).sort(), [
      'ID', 'active', 'componentCategoryID', 'responsibilityLevelCode', 'sapModuleID'
    ])
    assert.equal(Object.hasOwn(profile, 'identitySubject'), false)
    return { readiness: profile.ready, activeResponsibilities: profile.activeResponsibilityCount }
  }
  if (caseKey === 'IDTS110-P190') {
    const inactiveID = '72000000-0000-0000-0000-000000000006'
    await db.run(INSERT.into('idts.cap.Users').entries({
      ID: inactiveID,
      displayName: 'Inactive Atomic Developer',
      email: 'inactive.atomic@example.invalid',
      role_code: 'DEVELOPER',
      active: false
    }))
    const beforeInactive = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: inactiveID }))
    let notFoundError
    await assert.rejects(
      service.send({ event: 'readDeveloperProfile', data: { userID: inactiveID }, user: administrator }),
      error => {
        notFoundError = error
        return Number(error?.status || error?.statusCode) === 404 && error?.code === 'ACTIVE_DEVELOPER_NOT_FOUND'
      }
    )
    const reloaded = await db.run(SELECT.one.from('idts.cap.Users').where({ ID: inactiveID }))
    assert.deepEqual(reloaded, beforeInactive)
    assert.ok(notFoundError)
    assert.doesNotMatch(notFoundError.message, /inactive\.atomic@example\.invalid/i)
    return { inactiveUserFound: true, profilePayloadExposed: false }
  }
  const beforeRows = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: PROFILE_ID }))
  const updated = await service.send({
    event: 'updateDeveloperProfile',
    data: {
      userID: DEV_ID,
      desiredProfile: {
        availabilityStatusCode: 'BUSY',
        workloadLimit: 2,
        responsibilities: [{
          componentCategoryID: componentCategories[1].ID,
          sapModuleID: null,
          responsibilityLevelCode: 'BACKUP'
        }]
      },
      reason: 'Atomic profile responsibility update.',
      expectedVersion: 0
    },
    user: administrator
  })
  assert.equal(updated.administrationVersion, 1)
  assert.equal(updated.availabilityStatusCode, 'BUSY')
  assert.equal(updated.workloadLimit, 2)
  assert.equal(updated.activeResponsibilityCount, 1)
  const persistedProfile = await db.run(SELECT.one.from('idts.cap.DeveloperProfiles').where({ ID: PROFILE_ID }))
  assert.equal(persistedProfile.availabilityStatus_code, 'BUSY')
  assert.equal(persistedProfile.workloadLimit, 2)
  const afterRows = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: PROFILE_ID }))
  assert.equal(afterRows.length, 2)
  assert.equal(afterRows.filter(row => row.active).length, 1)
  assert.equal(afterRows.find(row => row.ID === RESPONSIBILITY_ID).active, false)
  const auditActions = (await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').columns('action'))).map(row => row.action)
  assert.ok(auditActions.includes('DEVELOPER_PROFILE_UPDATED'))
  assert.ok(auditActions.includes('DEVELOPER_RESPONSIBILITY_DEACTIVATED'))
  const reloaded = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: PROFILE_ID }))
  assert.deepEqual(reloaded.map(row => row.active), [false, true])
  return {
    beforeResponsibilities: beforeRows.length,
    afterResponsibilities: afterRows.length,
    activeResponsibilities: afterRows.filter(row => row.active).length,
    persistedWorkloadLimit: persistedProfile.workloadLimit,
    auditActions: auditActions.filter(action => action.startsWith('DEVELOPER_')).length
  }
}

async function runRegressionChecks () {
  const csn = await cds.load('srv/service.cds')
  const db = await cds.deploy(csn).to('sqlite::memory:')
  cds.db = db
  const componentCategories = await db.run(
    SELECT.from('idts.cap.ComponentCategories').columns('ID').where({ active: true }).limit(2)
  )
  assert.equal(componentCategories.length, 2)

  const inactiveCategoryID = '72000000-0000-4000-8000-000000000010'
  const activeComponent = { ID: '72000000-0000-4000-8000-000000000011' }
  const activeDefectCategory = { ID: '72000000-0000-4000-8000-000000000012' }
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({
    ...activeComponent,
    code: 'PROFILE-FIXTURE',
    name: 'Profile fixture component',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DefectCategories').entries({
    ...activeDefectCategory,
    code: 'PROFILE-FIXTURE',
    name: 'Profile fixture category',
    active: true
  }))
  await db.run(INSERT.into('idts.cap.ComponentCategories').entries({
    ID: inactiveCategoryID,
    component_ID: activeComponent.ID,
    defectCategory_ID: activeDefectCategory.ID,
    active: false
  }))

  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: PM_ID, displayName: 'Controlled PM', email: 'pm.profile@example.invalid', role_code: 'PM', active: true },
    { ID: DEV_ID, displayName: 'Controlled Developer', email: 'dev.profile@example.invalid', role_code: 'DEVELOPER', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: PROFILE_ID,
    user_ID: DEV_ID,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 3,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.DeveloperProfileAdministrationStates').entries({
    ID: '72000000-0000-4000-8000-000000000005',
    developerProfile_ID: PROFILE_ID,
    administrationVersion: 0
  }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: RESPONSIBILITY_ID,
    developerProfile_ID: PROFILE_ID,
    componentCategory_ID: componentCategories[0].ID,
    sapModule_ID: null,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const bugService = await cds.serve('BugService').from(csn)
  const administrator = new cds.User({
    id: 'pm.profile@example.invalid',
    roles: ['authenticated-user', 'PM', 'UserAdmin']
  })
  const identityHash = '7'.repeat(64)
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: identityHash }).where({ ID: DEV_ID }))
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: '72000000-0000-4000-8000-000000000020',
    targetEmailNormalized: 'dev.profile@example.invalid',
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    status_code: 'ACTIVE',
    requestedBy_ID: PM_ID,
    expiresAt: '2026-09-01T00:00:00.000Z',
    tokenNonce: 'developer-profile-action-nonce',
    tokenHash: '8'.repeat(64),
    identityKeyHash: identityHash,
    identityEmailNormalized: 'dev.profile@example.invalid',
    activeUser_ID: DEV_ID,
    provisioningVersion: 1,
    correlationId: '72000000-0000-4000-8000-000000000021'
  }))
  const controlledBug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  await db.run(UPDATE('idts.cap.Bugs').set({
    assignee_ID: PROFILE_ID,
    componentCategory_ID: componentCategories[0].ID,
    status_code: 'ASSIGNED'
  }).where({ ID: controlledBug.ID }))

  async function readAssignable (componentCategoryID) {
    return bugService.dispatch(new cds.Request({
      method: 'READ',
      target: bugService.entities.AssignableDevelopers,
      query: SELECT.from(bugService.entities.AssignableDevelopers).where({ componentCategoryID, active: true }),
      user: administrator
    }))
  }

  await expectRejected(service.send({
    event: 'updateDeveloperProfile',
    data: {
      userID: DEV_ID,
      desiredProfile: {
        availabilityStatusCode: 'AVAILABLE',
        workloadLimit: 3,
        responsibilities: [{ componentCategoryID: inactiveCategoryID, sapModuleID: null, responsibilityLevelCode: 'PRIMARY' }]
      },
      reason: 'Invalid inactive catalog test.',
      expectedVersion: 0
    },
    user: administrator
  }), 400, 'INVALID_COMPONENT_CATEGORY')

  const initial = await service.send({ event: 'readDeveloperProfile', data: { userID: DEV_ID }, user: administrator })
  assert.equal(initial.ready, true)
  assert.equal(initial.administrationVersion, 0)
  assert.equal(initial.activeResponsibilityCount, 1)
  assert.equal(initial.responsibilities.length, 1)
  assert.equal((await readAssignable(componentCategories[0].ID)).some(row => row.developerProfileID === PROFILE_ID), true)

  const updated = await service.send({
    event: 'updateDeveloperProfile',
    data: {
      userID: DEV_ID,
      desiredProfile: {
        availabilityStatusCode: 'BUSY',
        workloadLimit: 2,
        responsibilities: [{
          componentCategoryID: componentCategories[1].ID,
          sapModuleID: null,
          responsibilityLevelCode: 'BACKUP'
        }]
      },
      reason: 'Adjust controlled assignment coverage.',
      expectedVersion: 0
    },
    user: administrator
  })
  assert.equal(updated.administrationVersion, 1)
  assert.equal(updated.availabilityStatusCode, 'BUSY')
  assert.equal(updated.activeResponsibilityCount, 1)
  assert.equal(updated.responsibilities.length, 2)
  assert.equal(updated.responsibilities.find(row => row.ID === RESPONSIBILITY_ID).active, false)

  const persisted = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: PROFILE_ID }))
  assert.equal(persisted.length, 2, 'responsibilities must be deactivated, never hard-deleted')
  assert.equal(persisted.filter(row => row.active).length, 1)
  const persistedState = await db.run(
    SELECT.one.from('idts.cap.DeveloperProfileAdministrationStates').where({ developerProfile_ID: PROFILE_ID })
  )
  assert.equal(persistedState.administrationVersion, 1)
  assert.equal((await readAssignable(componentCategories[0].ID)).some(row => row.developerProfileID === PROFILE_ID), false)
  assert.equal((await readAssignable(componentCategories[1].ID)).some(row => row.developerProfileID === PROFILE_ID), true)
  assert.equal((await db.run(SELECT.one.from('idts.cap.Bugs').columns('assignee_ID').where({ ID: controlledBug.ID }))).assignee_ID, PROFILE_ID)

  const reactivated = await service.send({
    event: 'updateDeveloperProfile',
    data: {
      userID: DEV_ID,
      desiredProfile: {
        availabilityStatusCode: 'AVAILABLE',
        workloadLimit: 3,
        responsibilities: [{
          componentCategoryID: componentCategories[0].ID,
          sapModuleID: null,
          responsibilityLevelCode: 'PRIMARY'
        }, {
          componentCategoryID: componentCategories[1].ID,
          sapModuleID: null,
          responsibilityLevelCode: 'BACKUP'
        }]
      },
      reason: 'Reactivate the original scope without reassigning existing Bugs.',
      expectedVersion: 1
    },
    user: administrator
  })
  assert.equal(reactivated.administrationVersion, 2)
  assert.equal(reactivated.activeResponsibilityCount, 2)
  const reactivatedRows = await db.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: PROFILE_ID }))
  assert.equal(reactivatedRows.length, 2, 'reactivation must reuse the inactive responsibility instead of duplicating it')
  assert.equal(reactivatedRows.filter(row => row.active).length, 2)
  assert.equal((await readAssignable(componentCategories[0].ID)).some(row => row.developerProfileID === PROFILE_ID), true)
  assert.equal((await db.run(SELECT.one.from('idts.cap.Bugs').columns('assignee_ID').where({ ID: controlledBug.ID }))).assignee_ID, PROFILE_ID)

  const auditActions = (await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').columns('action')))
    .map(row => row.action)
  assert.ok(auditActions.includes('DEVELOPER_PROFILE_UPDATED'))
  assert.ok(auditActions.includes('DEVELOPER_RESPONSIBILITY_ADDED'))
  assert.ok(auditActions.includes('DEVELOPER_RESPONSIBILITY_DEACTIVATED'))

  await expectRejected(service.send({
    event: 'updateDeveloperProfile',
    data: {
      userID: DEV_ID,
      desiredProfile: {
        availabilityStatusCode: 'AVAILABLE',
        workloadLimit: 3,
        responsibilities: [{
          componentCategoryID: componentCategories[0].ID,
          sapModuleID: null,
          responsibilityLevelCode: 'PRIMARY'
        }]
      },
      reason: 'Stale update.',
      expectedVersion: 0
    },
    user: administrator
  }), 409, 'DEVELOPER_PROFILE_VERSION_CONFLICT')

  await expectRejected(service.send({
    event: 'readDeveloperProfile',
    data: { userID: DEV_ID },
    user: new cds.User({ id: 'pm.profile@example.invalid', roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

}

async function runAtomicSelector (options) {
  const atomicCases = new Map([
    ['IDTS110-P189', runAtomicProfileActionCase],
    ['IDTS110-P190', runAtomicProfileActionCase],
    ['IDTS110-F219', runAtomicProfileActionCase]
  ])
  const executeCase = atomicCases.get(options.caseKey)
  if (!executeCase) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-user-admin-developer-profile-actions.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      assertionPassed: true,
      actualResult: definition.expectedResult,
      beforeState: { fixture: 'isolated-sqlite', responsibilities: 1 },
      afterState: await executeCase(options.caseKey),
      reloadState: { persisted: true },
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
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
  console.log('IDTS developer profile administration actions: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
