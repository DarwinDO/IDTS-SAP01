#!/usr/bin/env node
'use strict'

// Narrow, idempotent DML repair for the IDTS-122 audit code. Dry-run is the
// default. This helper never deploys CDS/HDI artifacts, imports seed data, or
// mutates any Bug/user/profile row.
const cds = require('@sap/cds')

const { SELECT, UPSERT } = cds.ql
const ACTION = Object.freeze({
  code: 'REASSIGN_RETEST_OWNER',
  name: 'Reassign Retest Owner',
  descr: 'Tester responsible for retest was reassigned',
  sortOrder: 45,
  active: true,
  criticality: 1
})

async function readAction (db) {
  return db.run(SELECT.one.from('idts.cap.ActionTypes').where({ code: ACTION.code }))
}

async function runRepair (db, mode = 'dry-run') {
  const before = await readAction(db)
  if (mode === 'dry-run') return result(mode, before, before, false)

  if (mode === 'rehearse') {
    const tx = db.tx()
    try {
      await tx.run(UPSERT.into('idts.cap.ActionTypes').entries(ACTION))
    } finally {
      await tx.rollback()
    }
    const after = await readAction(db)
    return result(mode, before, after, true)
  }

  if (mode !== 'execute') throw new Error('Unsupported repair mode.')
  await db.tx(tx => tx.run(UPSERT.into('idts.cap.ActionTypes').entries(ACTION)))
  const after = await readAction(db)
  if (!matches(after)) throw new Error('ActionType post-verification failed.')
  return result(mode, before, after, false)
}

function result (mode, before, after, rolledBack) {
  return {
    marker: `IDTS122_ACTION_REPAIR_${mode.toUpperCase()}_COMPLETE`,
    mode,
    before: before ? 'PRESENT' : 'MISSING',
    plannedCode: ACTION.code,
    exactMatchAfter: matches(after),
    rolledBack,
    note: 'No Bug, user, profile, draft, schema, seed, credential, or private endpoint was read or changed.'
  }
}

function matches (row) {
  if (!row) return false
  const value = key => row[key] ?? row[key.toUpperCase()]
  return value('code') === ACTION.code &&
    value('name') === ACTION.name &&
    value('descr') === ACTION.descr &&
    Number(value('sortOrder')) === ACTION.sortOrder &&
    [true, 1, '1'].includes(value('active')) &&
    Number(value('criticality')) === ACTION.criticality
}

async function main () {
  const mode = process.argv.includes('--execute')
    ? 'execute'
    : process.argv.includes('--rehearse') ? 'rehearse' : 'dry-run'
  const db = await cds.connect.to('db')
  console.log(JSON.stringify(await runRepair(db, mode)))
}

if (require.main === module || (process.argv[1] === '-' && module.id === '[stdin]')) {
  main().catch(() => {
    console.error(JSON.stringify({ marker: 'IDTS122_ACTION_REPAIR_FAILED' }))
    process.exitCode = 1
  }).finally(() => cds.shutdown())
}

module.exports = { ACTION, matches, readAction, runRepair }
