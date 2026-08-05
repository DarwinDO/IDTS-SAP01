'use strict'

const assert = require('node:assert/strict')
const {
  EXPECTED_COUNTS,
  RESTORED_ENTITIES,
  assertDefaultUsers,
  collectReferenceSets,
  normalizeTemporalValues,
  validatePackageClosure
} = require('../db/build-idts122-clean-baseline')

assert.deepEqual(RESTORED_ENTITIES, [
  'idts.cap.Bugs',
  'idts.cap.Comments',
  'idts.cap.HistoryEvents',
  'idts.cap.HistoryLogs'
])
assert.equal(EXPECTED_COUNTS['idts.cap.Bugs'], 6)

assert.doesNotThrow(() => assertDefaultUsers([
  { ID: 'pm', role_code: 'PM', active: true },
  { ID: 'tester', role_code: 'TESTER', active: true },
  { ID: 'dev-1', role_code: 'DEVELOPER', active: true },
  { ID: 'dev-2', role_code: 'DEVELOPER', active: true }
]))
assert.throws(() => assertDefaultUsers([
  { ID: 'pm', role_code: 'PM', active: true }
]), error => error.code === 'BASELINE_DEFAULT_USERS_INVALID')
assert.throws(() => assertDefaultUsers([
  { ID: 'same', role_code: 'PM', active: true },
  { ID: 'same', role_code: 'TESTER', active: true },
  { ID: 'dev-1', role_code: 'DEVELOPER', active: true },
  { ID: 'dev-2', role_code: 'DEVELOPER', active: true }
]), error => error.code === 'BASELINE_DEFAULT_USERS_INVALID')

const references = collectReferenceSets([
  { entity: 'idts.cap.Bugs', rows: [{ reporter_ID: 'u1', retestOwner_ID: 'u1', assignee_ID: 'd1', status_code: 'NEW', priority_code: 'HIGH', severity_code: 'MAJOR', applicationComponent_ID: 'a1', defectCategory_ID: 'c1', componentCategory_ID: 'cc1' }] },
  { entity: 'idts.cap.Comments', rows: [{ author_ID: 'u1', authorRole_code: 'TESTER' }] },
  { entity: 'idts.cap.HistoryEvents', rows: [{ actor_ID: 'u1', actorRole_code: 'TESTER', actionType_code: 'CREATE' }] },
  { entity: 'idts.cap.HistoryLogs', rows: [{ actor_ID: 'u1', actorRole_code: 'TESTER', actionType_code: 'CREATE' }] }
])
assert.equal(references.users.length, 1)
assert.equal(references.developerProfiles.length, 1)
assert.deepEqual(references.statusCodes, ['NEW'])

const closedPackage = [
  { entity: 'idts.cap.Bugs', rows: [{ ID: 'b1' }] },
  { entity: 'idts.cap.Comments', rows: [{ ID: 'c1', bug_ID: 'b1' }] },
  { entity: 'idts.cap.HistoryEvents', rows: [{ ID: 'e1', bug_ID: 'b1' }] },
  { entity: 'idts.cap.HistoryLogs', rows: [{ ID: 'l1', bug_ID: 'b1', event_ID: 'e1' }] }
]
assert.doesNotThrow(() => validatePackageClosure(closedPackage))
closedPackage[1].rows[0].bug_ID = 'missing'
assert.throws(() => validatePackageClosure(closedPackage), error => error.code === 'BASELINE_REFERENCE_CLOSURE_INVALID')

const normalized = normalizeTemporalValues({
  elements: {
    createdAt: { type: 'cds.Timestamp' },
    dueDate: { type: 'cds.Date' }
  }
}, {
  createdAt: new Date('2026-08-05T10:20:30.000Z'),
  dueDate: new Date('2026-08-06T00:00:00.000Z')
})
assert.equal(normalized.createdAt, '2026-08-05T10:20:30.000Z')
assert.equal(normalized.dueDate, '2026-08-06')

console.log('IDTS-122 clean baseline builder tests: PASS')
