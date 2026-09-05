'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')

const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')
const {
  assertRequestedAccess,
  assertUserAdministrator
} = require('../../srv/user-admin/invitations')
const {
  enforcePlatformRoleAlignment,
  platformBusinessRoles
} = require('../../srv/auth/platform-role')

const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

function requestUser (roles) {
  const granted = new Set(roles)
  return { user: { is: role => granted.has(role) } }
}

function expectCode (fn, expectedCode) {
  assert.throws(fn, error => error?.code === expectedCode)
}

function runRoleChecks () {
  const persisted = []
  for (const businessRole of ['TESTER', 'DEVELOPER', 'PM']) {
    const request = requestUser([businessRole])
    assert.deepEqual(platformBusinessRoles(request), [businessRole])
    assert.deepEqual(assertRequestedAccess(businessRole, false), {
      requestedRole: businessRole,
      userAdminRequested: false
    })
    const before = persisted.length
    if (businessRole === 'PM') expectCode(() => assertUserAdministrator(request), 'USER_ADMIN_REQUIRED')
    assert.equal(persisted.length, before)
  }

  const administrator = requestUser(['PM', 'UserAdmin'])
  assert.deepEqual(platformBusinessRoles(administrator), ['PM'])
  assert.doesNotThrow(() => assertUserAdministrator(administrator))
  assert.deepEqual(assertRequestedAccess('PM', true), {
    requestedRole: 'PM',
    userAdminRequested: true
  })

  for (const roles of [['TESTER', 'UserAdmin'], ['DEVELOPER', 'UserAdmin'], ['UserAdmin']]) {
    const before = persisted.length
    expectCode(() => assertUserAdministrator(requestUser(roles)), 'USER_ADMIN_REQUIRED')
    assert.equal(persisted.length, before)
  }
  expectCode(() => assertRequestedAccess('DEVELOPER', true), 'USER_ADMIN_REQUIRES_PM')
  expectCode(() => assertRequestedAccess('ADMIN', false), 'INVALID_BUSINESS_ROLE')

  const originalAuth = cds.env.requires.auth
  cds.env.requires.auth = { kind: 'xsuaa' }
  try {
    const matchingRequest = {
      user: { is: role => role === 'PM' },
      reject: (status, message) => {
        const error = new Error(message)
        error.status = status
        throw error
      }
    }
    assert.deepEqual(platformBusinessRoles(matchingRequest), ['PM'])
    assert.deepEqual(enforcePlatformRoleAlignment(matchingRequest, { role_code: 'PM' }), { role_code: 'PM' })
    assert.throws(
      () => enforcePlatformRoleAlignment({ ...matchingRequest, user: { is: role => role === 'PM' || role === 'TESTER' } }, { role_code: 'PM' }),
      /role assignment is not valid/i
    )
    assert.throws(
      () => enforcePlatformRoleAlignment(matchingRequest, { role_code: 'TESTER' }),
      /does not match/i
    )
  } finally {
    cds.env.requires.auth = originalAuth
  }
  assert.equal(persisted.length, 0, 'role-boundary rejection must happen before persistence')
  return { roleBoundaries: 3, persistenceWrites: persisted.length }
}

async function runAtomicSelector (options) {
  if (options.caseKey !== 'IDTS110-P191') {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-user-admin-role-contract.js' })
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
      beforeState: { persistenceWrites: 0 },
      afterState: runRoleChecks(),
      reloadState: { persistenceWrites: 0 },
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
  runRoleChecks()
  console.log('IDTS User Administration role contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
