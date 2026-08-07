'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const {
  ACTIVE_DELETE_ORDER,
  DRAFT_DELETE_ORDER,
  EXPECTED_COUNTS,
  INSERT_ORDER,
  OMITTED_ACTIVE_ENTITIES,
  classifyDatabaseError,
  validatePackage,
  validateReferences
} = require('../db/run-idts122-clean-baseline-hana')

assert.equal(ACTIVE_DELETE_ORDER.at(-1), 'idts.cap.Bugs')
assert.equal(INSERT_ORDER[0], 'idts.cap.Bugs')
assert.equal(INSERT_ORDER.at(-1), 'idts.cap.HistoryLogs')
assert.ok(DRAFT_DELETE_ORDER.includes('BUGSERVICE_BUGS_DRAFTS'))
assert.ok(DRAFT_DELETE_ORDER.includes('BUGSERVICE_AISUGGESTIONS_DRAFTS'))
assert.ok(DRAFT_DELETE_ORDER.includes('DRAFT_DRAFTADMINISTRATIVEDATA'))
assert.ok(OMITTED_ACTIVE_ENTITIES.includes('idts.cap.Bugs.attachments'))
assert.ok(!OMITTED_ACTIVE_ENTITIES.includes('idts.cap.HistoryLogs'))
assert.equal(classifyDatabaseError(new Error('foreign key constraint violation')), 'FOREIGN_KEY_CONSTRAINT')
assert.equal(classifyDatabaseError(new Error('invalid column name')), 'COLUMN_CONTRACT')

const body = {
  schemaVersion: 2,
  policy: {
    preserveCurrentUsers: true,
    preserveCurrentDeveloperProfiles: true,
    preserveCurrentCodeLists: true,
    clearCurrentBugDrafts: true,
    expectedPreservedCounts: { users: 14, developerProfiles: 12 }
  },
  source: {
    defaultUserCount: 4,
    defaultUsers: [
      { idHash: '1'.repeat(64), roleCode: 'PM' },
      { idHash: '2'.repeat(64), roleCode: 'TESTER' },
      { idHash: '3'.repeat(64), roleCode: 'DEVELOPER' },
      { idHash: '4'.repeat(64), roleCode: 'DEVELOPER' }
    ]
  },
  referenceSets: {},
  entities: INSERT_ORDER.map(entity => ({ entity, count: EXPECTED_COUNTS[entity], rows: Array.from({ length: EXPECTED_COUNTS[entity] }, (_, index) => ({ ID: String(index) })) }))
}
const stable = value => JSON.stringify(sort(value), null, 2)
const sort = value => Array.isArray(value) ? value.map(sort) : (!value || typeof value !== 'object') ? value : Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]))
body.packageSha256 = crypto.createHash('sha256').update(stable(body)).digest('hex')
assert.doesNotThrow(() => validatePackage(body))
body.entities[0].count = 5
assert.throws(() => validatePackage(body), error => error.code === 'CLEAN_BASELINE_CHECKSUM_MISMATCH')

async function verifiesUppercaseHanaColumns () {
  const hash = value => crypto.createHash('sha256').update(value).digest('hex')
  const defaultUsers = ['u1', 'u2', 'u3', 'u4']
const data = {
    source: {
      defaultUsers: [
        { idHash: hash('u1'), roleCode: 'PM' },
        { idHash: hash('u2'), roleCode: 'TESTER' },
        { idHash: hash('u3'), roleCode: 'DEVELOPER' },
        { idHash: hash('u4'), roleCode: 'DEVELOPER' }
      ]
    },
    referenceSets: {
      users: [hash('u1')],
      developerProfiles: [hash('d1')],
      sapModules: [hash('m1')],
      applicationComponents: [hash('a1')],
      defectCategories: [hash('c1')],
      componentCategories: [hash('cc1')],
      statusCodes: ['NEW'],
      priorityCodes: ['HIGH'],
      severityCodes: ['MAJOR'],
      environmentCodes: ['QAS'],
      processorRoleCodes: ['TESTER'],
      actionTypeCodes: ['CREATE'],
      userRoleCodes: ['TESTER']
    }
  }
  const rowsByEntity = {
    'idts.cap.Users': [
      { ID: 'u1', ACTIVE: true, ROLE_CODE: 'PM' },
      { ID: 'u2', ACTIVE: true, ROLE_CODE: 'TESTER' },
      { ID: 'u3', ACTIVE: true, ROLE_CODE: 'DEVELOPER' },
      { ID: 'u4', ACTIVE: true, ROLE_CODE: 'DEVELOPER' }
    ],
    'idts.cap.DeveloperProfiles': [{ ID: 'd1' }],
    'idts.cap.SAPModules': [{ ID: 'm1' }],
    'idts.cap.ApplicationComponents': [{ ID: 'a1' }],
    'idts.cap.DefectCategories': [{ ID: 'c1' }],
    'idts.cap.ComponentCategories': [{ ID: 'cc1' }],
    'idts.cap.StatusValues': [{ CODE: 'NEW' }],
    'idts.cap.PriorityValues': [{ CODE: 'HIGH' }],
    'idts.cap.SeverityValues': [{ CODE: 'MAJOR' }],
    'idts.cap.EnvironmentValues': [{ CODE: 'QAS' }],
    'idts.cap.ProcessorRoleValues': [{ CODE: 'TESTER' }],
    'idts.cap.ActionTypes': [{ CODE: 'CREATE' }],
    'idts.cap.UserRoles': [{ CODE: 'TESTER' }]
  }
  const db = {
    run: async query => rowsByEntity[query.SELECT.from.ref[0]] || []
  }
  const result = await validateReferences(db, data)
  assert.equal(result.defaultUsers.missing, 0)
  assert.equal(result.currentUsersPreserved, 4)
  for (const [name, value] of Object.entries(result)) {
    if (name !== 'currentUsersPreserved') assert.equal(value.missing, 0, `${name} should support uppercase HANA columns`)
  }
}

verifiesUppercaseHanaColumns()
  .then(() => console.log('IDTS-122 HANA clean baseline guard tests: PASS'))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
