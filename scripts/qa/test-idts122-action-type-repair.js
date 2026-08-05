'use strict'

const cds = require('@sap/cds')
const { ACTION, runRepair } = require('../db/repair-idts122-reassign-action-type')

async function main () {
  const model = await cds.load('db/schema.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(model).to(db)
  await db.run(DELETE.from('idts.cap.ActionTypes').where({ code: ACTION.code }))

  const dry = await runRepair(db, 'dry-run')
  assert(dry.before === 'MISSING' && dry.exactMatchAfter === false, 'dry-run reports the missing row')
  assert(await count(db) === 0, 'dry-run performs no mutation')

  const rehearsal = await runRepair(db, 'rehearse')
  assert(rehearsal.rolledBack === true, 'rehearsal reports an intentional rollback')
  assert(await count(db) === 0, 'rehearsal leaves no row behind')

  const executed = await runRepair(db, 'execute')
  assert(executed.exactMatchAfter === true, 'execute inserts the exact canonical row')
  assert(await count(db) === 1, 'execute inserts exactly one row')

  await runRepair(db, 'execute')
  assert(await count(db) === 1, 'sequential rerun is idempotent')
  console.log('RESULT: PASS — IDTS-122 ActionType repair is narrow, rollback-safe and idempotent.')
}

async function count (db) {
  const rows = await db.run(SELECT.from('idts.cap.ActionTypes').columns('code').where({ code: ACTION.code }))
  return rows.length
}

function assert (condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`)
  console.log(`PASS: ${label}`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
}).finally(() => cds.shutdown())
