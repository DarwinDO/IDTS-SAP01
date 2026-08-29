'use strict'

const assert = require('node:assert/strict')
const {
  EVENT_TYPES,
  initializeEventTypes,
  verifyExistingRows
} = require('../btp/initialize-n4-notification-event-types')

const legacy = EVENT_TYPES.slice(0, 6).map(row => ({ ...row }))
assert.equal(EVENT_TYPES.length, 18)
assert.deepEqual(verifyExistingRows(legacy).map(row => row.code), EVENT_TYPES.slice(6).map(row => row.code))
assert.throws(() => verifyExistingRows([{ ...legacy[0], name: 'Changed' }]), /conflicting row/i)

function fakeDb (before = legacy) {
  const rows = before.map(row => ({ ...row }))
  const calls = []
  return {
    calls,
    async run (sql, parameters = []) {
      calls.push({ sql, parameters })
      if (/^SELECT/i.test(sql.trim())) return rows.map(row => ({ ...row }))
      if (/^INSERT/i.test(sql.trim())) {
        rows.push(Object.fromEntries(['code', 'name', 'descr', 'sortOrder', 'active', 'criticality'].map((column, index) => [column, parameters[index]])))
      }
      return []
    },
    async begin () { calls.push({ sql: 'BEGIN' }) },
    async commit () { calls.push({ sql: 'COMMIT' }) },
    async rollback () { calls.push({ sql: 'ROLLBACK' }) }
  }
}

;(async () => {
  const db = fakeDb()
  const result = await initializeEventTypes(db)
  assert.equal(result.result, 'INITIALIZED')
  assert.equal(result.inserted, 12)
  assert.equal(result.rowCount, 18)
  assert.equal(db.calls.filter(({ sql }) => /^INSERT/i.test(sql)).length, 12)
  assert.equal(db.calls.some(({ sql }) => sql === 'COMMIT'), true)

  const noOp = await initializeEventTypes(fakeDb(EVENT_TYPES))
  assert.equal(noOp.result, 'NOOP')
  assert.equal(noOp.inserted, 0)

  const failing = fakeDb()
  const originalRun = failing.run
  failing.run = async (sql, parameters) => {
    if (/^INSERT/i.test(sql.trim()) && parameters[0] === 'COMMENT_MENTIONED') throw new Error('fixture insert failure')
    return originalRun(sql, parameters)
  }
  await assert.rejects(initializeEventTypes(failing), /fixture insert failure/)
  assert.equal(failing.calls.some(({ sql }) => sql === 'ROLLBACK'), true)

  console.log('N4 notification event catalog initializer: PASS')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
