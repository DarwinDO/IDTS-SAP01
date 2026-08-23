'use strict'

const assert = require('node:assert/strict')

const { inspectCatalogState } = require('../btp/gate5-business-catalog-inspector')

const calls = []
const values = [8, 0, 8, 0, 8, 0, 31, 0]
const db = {
  async run (sql) {
    calls.push(sql)
    return [{ VALUE: values[calls.length - 1] }]
  }
}

;(async () => {
  const result = await inspectCatalogState(db)

  assert.deepEqual(result, {
    sapModules: { rowCount: 8, duplicateGroups: 0 },
    applicationComponents: { rowCount: 8, duplicateGroups: 0 },
    defectCategories: { rowCount: 8, duplicateGroups: 0 },
    componentCategories: { rowCount: 31, duplicateGroups: 0 }
  })
  assert.equal(calls.length, 8)
  assert.equal(calls.every(sql => /^\s*SELECT\b/i.test(sql)), true)
  assert.equal(calls.some(sql => /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|DROP|ALTER|TRUNCATE)\b/i.test(sql)), false)

  await assert.rejects(
    inspectCatalogState({ run: async () => [{ VALUE: -1 }] }),
    /Catalog aggregate readback is invalid/
  )

  let duplicateRead = 0
  await assert.rejects(
    inspectCatalogState({
      async run () {
        duplicateRead += 1
        return [{ VALUE: duplicateRead === 2 ? 1 : 0 }]
      }
    }),
    /Catalog duplicate state blocks Gate 5 rollout/
  )

  console.log('Gate 5 Business Catalog aggregate inspector: PASS')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
