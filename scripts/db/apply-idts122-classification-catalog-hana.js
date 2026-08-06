#!/usr/bin/env node
'use strict'

// Narrow, additive IDTS-122 master-data rollout. Dry-run is the default.
// This helper never deploys CDS/HDI artifacts, imports Bug seed data, deletes
// rows, or updates an existing row. Any conflicting current row stops the run.
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')

const { INSERT, SELECT } = cds.ql

const ENTITY = Object.freeze({
  components: 'idts.cap.ApplicationComponents',
  categories: 'idts.cap.DefectCategories',
  bridges: 'idts.cap.ComponentCategories',
  responsibilities: 'idts.cap.DeveloperResponsibilities',
  bugs: 'idts.cap.Bugs',
  users: 'idts.cap.Users',
  profiles: 'idts.cap.DeveloperProfiles'
})

const EXPECTED = Object.freeze({
  before: { components: 7, categories: 8, bridges: 13, responsibilities: 30 },
  after: { components: 8, categories: 8, bridges: 31, responsibilities: 38 },
  preserved: { bugs: 6, users: 14, profiles: 12 }
})

const TARGET_IDS = Object.freeze({
  components: new Set(['40000000-0000-0000-0000-000000000008']),
  bridges: numericIds('60000000-0000-0000-0000-', 14, 31),
  responsibilities: numericIds('70000000-0000-0000-0000-', 31, 38)
})

// These fingerprints bind the executable rollout to the exact reviewed source rows.
// A changed CSV must be reviewed and deliberately re-baselined; --execute must never
// accept a merely count-correct but semantically different catalog.
const APPROVED_SOURCE_FINGERPRINTS = Object.freeze({
  components: '6c2a7500b7d2c6c2b85fdf9555b2162693cd6bc7ed1a301d05808d89918471ba',
  categories: '709880b1d21156693fa05128c866d52d37f9d087508e2cdc0e743e5d9620add6',
  bridges: '372b8ce9410f0558d52050f8bafa6e08477340f765f3dd7cbd9fc1a038b4e283',
  responsibilities: '19fe29bbe1a457f4e23a5e28d82b15fd1d1d2174577f3dedc569f1d53ccde1ab'
})

const DEFINITIONS = Object.freeze({
  components: {
    entity: ENTITY.components,
    file: 'idts.cap-ApplicationComponents.csv',
    columns: ['ID', 'code', 'name', 'componentType', 'active'],
    natural: ['code']
  },
  bridges: {
    entity: ENTITY.bridges,
    file: 'idts.cap-ComponentCategories.csv',
    columns: ['ID', 'component_ID', 'defectCategory_ID', 'active'],
    natural: ['component_ID', 'defectCategory_ID']
  },
  responsibilities: {
    entity: ENTITY.responsibilities,
    file: 'idts.cap-DeveloperResponsibilities.csv',
    columns: ['ID', 'developerProfile_ID', 'componentCategory_ID', 'sapModule_ID', 'responsibilityLevel_code', 'active'],
    natural: ['developerProfile_ID', 'componentCategory_ID', 'sapModule_ID', 'responsibilityLevel_code']
  }
})

function numericIds (prefix, from, to) {
  return new Set(Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${String(from + index).padStart(12, '0')}`))
}

function readCsv (fileName) {
  const file = path.join(__dirname, '..', '..', 'db', 'data', fileName)
  const [headerLine, ...lines] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/)
  const headers = headerLine.split(',')
  return lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [
    headers[index],
    value === '' ? null : value === 'true' ? true : value === 'false' ? false : value
  ])))
}

function loadPlan () {
  const plan = {}
  for (const [name, definition] of Object.entries(DEFINITIONS)) {
    const rows = readCsv(definition.file).filter(row => TARGET_IDS[name].has(row.ID))
    if (rows.length !== TARGET_IDS[name].size || new Set(rows.map(row => row.ID)).size !== rows.length) {
      throw coded('CATALOG_PLAN_INVALID', `${name} target rows are missing or duplicated.`)
    }
    plan[name] = rows
  }
  const categories = readCsv('idts.cap-DefectCategories.csv')
  assertApprovedSource('categories', categories)
  for (const [name, rows] of Object.entries(plan)) assertApprovedSource(name, rows)
  return plan
}

function assertApprovedSource (name, rows) {
  const actual = sha256(JSON.stringify(rows))
  if (actual !== APPROVED_SOURCE_FINGERPRINTS[name]) {
    throw coded('CATALOG_SOURCE_NOT_APPROVED', `${name} source rows differ from the reviewed catalog baseline.`)
  }
}

async function snapshot (db) {
  const result = {}
  for (const name of ['components', 'categories', 'bridges', 'responsibilities', 'bugs', 'users', 'profiles']) {
    const rows = await db.run(SELECT.from(ENTITY[name]).columns('ID'))
    result[name] = {
      count: rows.length,
      idFingerprint: sha256(rows.map(row => rowValue(row, 'ID')).sort().join('\n'))
    }
  }
  return result
}

async function inspectPlan (db, plan) {
  const missing = {}
  for (const [name, definition] of Object.entries(DEFINITIONS)) {
    const current = await db.run(SELECT.from(definition.entity).columns(...definition.columns))
    const byId = new Map(current.map(row => [rowValue(row, 'ID'), row]))
    missing[name] = []
    for (const desired of plan[name]) {
      const sameId = byId.get(desired.ID)
      if (sameId) {
        if (!sameRow(sameId, desired, definition.columns)) {
          throw coded('CATALOG_ID_CONFLICT', `${name} contains a conflicting target ID.`)
        }
        continue
      }
      const naturalConflict = current.find(row => definition.natural.every(column => comparable(rowValue(row, column)) === comparable(desired[column])))
      if (naturalConflict) throw coded('CATALOG_NATURAL_KEY_CONFLICT', `${name} contains a conflicting natural key.`)
      missing[name].push(desired)
    }
  }
  return missing
}

async function insertMissing (db, missing) {
  for (const name of ['components', 'bridges', 'responsibilities']) {
    if (missing[name].length) await db.run(INSERT.into(DEFINITIONS[name].entity).entries(missing[name]))
  }
}

function validateBefore (state) {
  for (const [name, expected] of Object.entries(EXPECTED.preserved)) {
    if (state[name].count !== expected) throw coded('PRESERVED_BASELINE_MISMATCH', `${name} count is not the approved baseline.`)
  }
  const isBefore = Object.entries(EXPECTED.before).every(([name, count]) => state[name].count === count)
  const isAfter = Object.entries(EXPECTED.after).every(([name, count]) => state[name].count === count)
  if (!isBefore && !isAfter) throw coded('CATALOG_BASELINE_MISMATCH', 'Catalog counts match neither the approved pre-state nor the target state.')
}

function validateAfter (before, after) {
  for (const [name, expected] of Object.entries(EXPECTED.after)) {
    if (after[name].count !== expected) throw coded('CATALOG_POSTVERIFY_FAILED', `${name} target count mismatch.`)
  }
  for (const name of Object.keys(EXPECTED.preserved)) {
    if (after[name].count !== before[name].count || after[name].idFingerprint !== before[name].idFingerprint) {
      throw coded('PRESERVED_DATA_CHANGED', `${name} changed during the catalog transaction.`)
    }
  }
}

async function runCatalog (db, mode = 'dry-run') {
  if (!['dry-run', 'rehearse', 'execute'].includes(mode)) throw coded('MODE_INVALID', 'Unsupported catalog mode.')
  const plan = loadPlan()
  const before = await snapshot(db)
  validateBefore(before)
  const missing = await inspectPlan(db, plan)
  const planned = counts(missing)

  if (mode === 'dry-run') return result(mode, before, before, planned, false)

  if (mode === 'rehearse') {
    const tx = db.tx()
    try {
      await insertMissing(tx, missing)
      const during = await snapshot(tx)
      validateAfter(before, during)
    } finally {
      await tx.rollback()
    }
    const after = await snapshot(db)
    if (stableJson(after) !== stableJson(before)) throw coded('REHEARSAL_ROLLBACK_FAILED', 'Rehearsal changed database state.')
    return result(mode, before, after, planned, true)
  }

  await db.tx(async tx => {
    await insertMissing(tx, missing)
    validateAfter(before, await snapshot(tx))
  })
  const after = await snapshot(db)
  validateAfter(before, after)
  await inspectPlan(db, plan)
  return result(mode, before, after, planned, false)
}

function result (mode, before, after, planned, rolledBack) {
  return {
    marker: `IDTS122_CLASSIFICATION_CATALOG_${mode.toUpperCase().replace('-', '_')}_COMPLETE`,
    mode,
    plannedInserts: planned,
    beforeCounts: Object.fromEntries(Object.entries(before).map(([name, value]) => [name, value.count])),
    afterCounts: Object.fromEntries(Object.entries(after).map(([name, value]) => [name, value.count])),
    rolledBack,
    note: 'Additive catalog rows only; no Bug, user, profile, draft, schema, seed, credential, or endpoint is changed or disclosed.'
  }
}

function counts (missing) {
  return Object.fromEntries(Object.entries(missing).map(([name, rows]) => [name, rows.length]))
}

function sameRow (actual, expected, columns) {
  return columns.every(column => comparable(rowValue(actual, column)) === comparable(expected[column]))
}

function rowValue (row, column) {
  return row[column] ?? row[column.toUpperCase()]
}

function comparable (value) {
  if (value === null || value === undefined || value === '') return ''
  if ([true, 1, '1', 'true'].includes(value)) return 'true'
  if ([false, 0, '0', 'false'].includes(value)) return 'false'
  return String(value)
}

function sha256 (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function stableJson (value) {
  return JSON.stringify(value)
}

function coded (code, message) {
  return Object.assign(new Error(message), { code })
}

async function main () {
  const mode = process.argv.includes('--execute') ? 'execute' : process.argv.includes('--rehearse') ? 'rehearse' : 'dry-run'
  const db = await cds.connect.to('db')
  console.log(JSON.stringify(await runCatalog(db, mode)))
}

if (require.main === module || (process.argv[1] === '-' && module.id === '[stdin]')) {
  main().catch(error => {
    console.error(JSON.stringify({ marker: 'IDTS122_CLASSIFICATION_CATALOG_FAILED', code: error.code || 'UNEXPECTED' }))
    process.exitCode = 1
  }).finally(() => cds.shutdown())
}

module.exports = { APPROVED_SOURCE_FINGERPRINTS, ENTITY, EXPECTED, TARGET_IDS, assertApprovedSource, loadPlan, runCatalog, snapshot }
