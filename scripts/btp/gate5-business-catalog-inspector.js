#!/usr/bin/env node
'use strict'

const { createHdiDatabase } = require('./run-user-admin-logical-backup')

const CATALOGS = Object.freeze([
  {
    key: 'sapModules',
    table: 'IDTS_CAP_SAPMODULES',
    groupBy: 'UPPER(TRIM("CODE"))'
  },
  {
    key: 'applicationComponents',
    table: 'IDTS_CAP_APPLICATIONCOMPONENTS',
    groupBy: 'UPPER(TRIM("CODE"))'
  },
  {
    key: 'defectCategories',
    table: 'IDTS_CAP_DEFECTCATEGORIES',
    groupBy: 'UPPER(TRIM("CODE"))'
  },
  {
    key: 'componentCategories',
    table: 'IDTS_CAP_COMPONENTCATEGORIES',
    groupBy: '"COMPONENT_ID", "DEFECTCATEGORY_ID"'
  }
])

function numericValue (rows) {
  const value = Number(rows?.[0]?.VALUE ?? rows?.[0]?.value)
  if (!Number.isInteger(value) || value < 0) throw new Error('Catalog aggregate readback is invalid.')
  return value
}

async function inspectCatalogState (db, { requireAuditEmpty = false } = {}) {
  const result = {}
  for (const catalog of CATALOGS) {
    const rowCount = numericValue(await db.run(`SELECT COUNT(*) AS VALUE FROM "${catalog.table}"`))
    const duplicateGroups = numericValue(await db.run(
      `SELECT COUNT(*) AS VALUE FROM (` +
      `SELECT ${catalog.groupBy} FROM "${catalog.table}" ` +
      `GROUP BY ${catalog.groupBy} HAVING COUNT(*) > 1) AS DUPLICATES`
    ))
    result[catalog.key] = { rowCount, duplicateGroups }
  }
  if (Object.values(result).some(catalog => catalog.duplicateGroups !== 0)) {
    throw new Error('Catalog duplicate state blocks Gate 5 rollout.')
  }
  if (requireAuditEmpty) {
    const rowCount = numericValue(await db.run('SELECT COUNT(*) AS VALUE FROM "IDTS_CAP_CATALOGADMINISTRATIONAUDITEVENTS"'))
    if (rowCount !== 0) throw new Error('Catalog audit table must be empty for Gate 5 rollback safety.')
    result.auditEvents = { rowCount }
  }
  return result
}

async function main () {
  let db
  try {
    db = await createHdiDatabase()
    const result = await inspectCatalogState(db, { requireAuditEmpty: process.argv.includes('--post-migration') })
    console.log(`IDTS_GATE5_CATALOG_INSPECTION=${Buffer.from(JSON.stringify(result), 'utf8').toString('base64')}`)
  } catch {
    console.error('IDTS_GATE5_CATALOG_INSPECTION=FAIL')
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

if (require.main === module) main()

module.exports = { inspectCatalogState }
