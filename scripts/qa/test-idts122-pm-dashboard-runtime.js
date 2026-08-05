#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const REQUIRED_STATUSES = [
  'PENDING_ASSIGNMENT',
  'ASSIGNED',
  'IN_REVIEW',
  'NEED_MORE_INFORMATION',
  'IN_PROGRESS',
  'RESOLVED',
  'RETEST_REQUIRED',
  'REJECTED',
  'REOPENED',
  'CLOSED'
]

async function main () {
  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  const result = await service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }, tx => tx.send('readBugStatusMetrics'))

  assert.deepEqual(result.map(row => row.statusCode), REQUIRED_STATUSES)
  assert.equal(result.some(row => row.statusCode === 'NEW'), false)
  assert.equal(result.every(row => Number.isInteger(row.bugCount) && row.bugCount >= 0), true)

  const grouped = await db.run(
    SELECT.from('idts.cap.Bugs')
      .columns('status_code', { func: 'count', args: [{ ref: ['ID'] }], as: 'bugCount' })
      .where({ status_code: { in: REQUIRED_STATUSES } })
      .groupBy('status_code')
  )
  const expected = new Map(grouped.map(row => [row.status_code, Number(row.bugCount)]))
  result.forEach(row => assert.equal(row.bugCount, expected.get(row.statusCode) || 0))

  let rejected = false
  try {
    await service.tx({
      user: new cds.User({ id: 'NhanT', roles: ['Tester', 'authenticated-user'] })
    }, tx => tx.send('readBugStatusMetrics'))
  } catch (error) {
    rejected = Number(error.code || error.status || error.statusCode) === 403
  }
  assert.equal(rejected, true)

  console.log('PASS PM receives exactly ten current status rows including zero counts')
  console.log('PASS status counts match the database aggregate')
  console.log('PASS NEW is excluded')
  console.log('PASS non-PM receives HTTP 403')
  console.log('TOTAL: 4 PASS / 4 checks')
}

main().catch(error => {
  console.error(error.stack || error.message)
  process.exit(1)
})
