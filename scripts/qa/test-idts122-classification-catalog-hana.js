'use strict'

const cds = require('@sap/cds')
const { ENTITY, EXPECTED, TARGET_IDS, loadPlan, runCatalog, snapshot } = require('../db/apply-idts122-classification-catalog-hana')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql

async function main () {
  const model = await cds.load('db/schema.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(model).to(db)
  await addSyntheticBugsForSixCount(db)

  const plan = loadPlan()
  assert(plan.components.length === 1, 'plan contains one AI component')
  assert(plan.bridges.length === 18, 'plan contains eighteen missing component/category pairs')
  assert(plan.responsibilities.length === 8, 'plan contains eight AI responsibility rows')

  await db.run(DELETE.from(ENTITY.responsibilities).where({ ID: { in: [...TARGET_IDS.responsibilities] } }))
  await db.run(DELETE.from(ENTITY.bridges).where({ ID: { in: [...TARGET_IDS.bridges] } }))
  await db.run(DELETE.from(ENTITY.components).where({ ID: { in: [...TARGET_IDS.components] } }))

  const initial = await snapshot(db)
  for (const [name, count] of Object.entries(EXPECTED.before)) assert(initial[name].count === count, `${name} starts at approved pre-count ${count}`)

  const dry = await runCatalog(db, 'dry-run')
  assert(dry.plannedInserts.components === 1 && dry.plannedInserts.bridges === 18 && dry.plannedInserts.responsibilities === 8, 'dry-run reports the exact additive diff')
  assert(equalSnapshot(initial, await snapshot(db)), 'dry-run performs no mutation')

  const rehearsal = await runCatalog(db, 'rehearse')
  assert(rehearsal.rolledBack === true, 'rehearsal reports rollback')
  assert(equalSnapshot(initial, await snapshot(db)), 'rehearsal restores every tracked ID fingerprint')

  const executed = await runCatalog(db, 'execute')
  assert(executed.afterCounts.components === 8 && executed.afterCounts.bridges === 31 && executed.afterCounts.responsibilities === 38, 'execute reaches the exact target counts')
  const afterExecute = await snapshot(db)
  for (const name of Object.keys(EXPECTED.preserved)) {
    assert(afterExecute[name].idFingerprint === initial[name].idFingerprint, `${name} identity fingerprint is preserved`)
  }

  const repeated = await runCatalog(db, 'execute')
  assert(Object.values(repeated.plannedInserts).every(count => count === 0), 'sequential rerun is idempotent')

  await db.run(UPDATE(ENTITY.components).set({ name: 'Conflicting name' }).where({ ID: [...TARGET_IDS.components][0] }))
  await expectFailure(() => runCatalog(db, 'dry-run'), 'CATALOG_ID_CONFLICT', 'conflicting current row is rejected instead of overwritten')

  console.log('RESULT: PASS — IDTS-122 classification catalog rollout is additive, rollback-safe and idempotent.')
}

async function addSyntheticBugsForSixCount (db) {
  const rows = await db.run(SELECT.from(ENTITY.bugs))
  assert(rows.length === 4, 'isolated legacy seed starts with four Bugs')
  const source = rows[0]
  await db.run(INSERT.into(ENTITY.bugs).entries([5, 6].map(number => ({
    ...source,
    ID: `12200000-0000-0000-0000-${String(number).padStart(12, '0')}`,
    bugNumber: `IDTS-122-TEST-${number}`,
    title: `Synthetic preservation fixture ${number}`,
    description: 'Temporary in-memory row used only to test the six-Bug safety gate.'
  }))))
}

function equalSnapshot (left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

async function expectFailure (fn, code, label) {
  try {
    await fn()
    throw new Error(`FAIL: ${label}`)
  } catch (error) {
    if (error.code !== code) throw error
    console.log(`PASS: ${label}`)
  }
}

function assert (condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`)
  console.log(`PASS: ${label}`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
}).finally(() => cds.shutdown())
