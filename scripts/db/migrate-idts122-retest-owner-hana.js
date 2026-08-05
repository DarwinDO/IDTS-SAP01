#!/usr/bin/env node
'use strict'

// Narrow additive HANA migration for IDTS-122. Dry-run is the default. The
// helper never invokes cds deploy, imports seed data, drops columns, or prints
// service-binding credentials.
const cds = require('@sap/cds')

const targets = [
  { logicalName: 'active Bugs', tableHint: 'idts_cap_Bugs' },
  { logicalName: 'draft Bugs', tableHint: 'BugService_Bugs_drafts' }
]
const columnName = 'retestOwner_ID'
const retestOwnerAction = Object.freeze({
  code: 'REASSIGN_RETEST_OWNER',
  name: 'Reassign Retest Owner',
  descr: 'Tester responsible for retest was reassigned',
  sortOrder: 45,
  active: true,
  criticality: 1
})

async function main () {
  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      targets,
      column: columnName,
      type: 'NVARCHAR(36) NULL',
      codeListInsert: `${retestOwnerAction.code} only when missing`,
      backfill: 'Active and draft rows whose reporter resolves to an active TESTER; existing non-null values are preserved.',
      note: 'No database connection was opened. No DDL, DML, deploy, or seed operation ran. HANA additive DDL may commit per statement; this helper is intentionally idempotent and rerunnable.'
    }, null, 2))
    return
  }

  const db = await cds.connect.to('db')
  if (db.kind !== 'hana') throw new Error('IDTS-122 migration requires a bound SAP HANA database service.')

  const resolvedTargets = []
  for (const target of targets) {
    const table = await resolveTable(db, target.tableHint)
    if (!table) throw new Error(`Required ${target.logicalName} table was not found.`)
    const columnExists = await hasColumn(db, table, columnName)
    if (!columnExists) {
      await db.run(`ALTER TABLE ${quoteIdentifier(table)} ADD (${quoteIdentifier(columnName)} NVARCHAR(36))`)
    }
    if (!await hasColumn(db, table, columnName)) {
      throw new Error(`Column verification failed for ${target.logicalName}.`)
    }
    resolvedTargets.push({ ...target, table, added: !columnExists })
  }

  const usersTable = await resolveTable(db, 'idts_cap_Users')
  if (!usersTable) throw new Error('Users table was not found; safe backfill was not executed.')
  const actionTypesTable = await resolveTable(db, 'idts_cap_ActionTypes')
  if (!actionTypesTable) throw new Error('ActionTypes table was not found; audit code-list update was not executed.')

  const actionTypeInserted = await ensureRetestOwnerAction(db, actionTypesTable)

  for (const target of resolvedTargets) {
    target.backfilledRowCount = Number(await db.run(`
      UPDATE ${quoteIdentifier(target.table)} AS B
         SET ${quoteIdentifier(columnName)} = B.${quoteIdentifier('reporter_ID')}
       WHERE B.${quoteIdentifier(columnName)} IS NULL
         AND EXISTS (
           SELECT 1
             FROM ${quoteIdentifier(usersTable)} AS U
            WHERE U.${quoteIdentifier('ID')} = B.${quoteIdentifier('reporter_ID')}
              AND U.${quoteIdentifier('role_code')} = 'TESTER'
              AND U.${quoteIdentifier('active')} = TRUE
         )
    `)) || 0
    target.unresolvedOwnerCount = await unresolvedOwnerCount(db, target.table)
  }

  console.log(JSON.stringify({
    mode: 'execute',
    targets: resolvedTargets.map(({ logicalName, added, backfilledRowCount, unresolvedOwnerCount }) => ({
      logicalName,
      columnAdded: added,
      backfilledRowCount,
      unresolvedOwnerCount
    })),
    actionTypeInserted,
    note: 'Existing non-null retest owners were preserved. Additive DDL may commit per statement; rerun is safe. Credentials and private endpoints were not printed.'
  }, null, 2))
}

async function ensureRetestOwnerAction (db, table) {
  const existing = await db.run(
    `SELECT ${quoteIdentifier('code')} FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier('code')} = ?`,
    [retestOwnerAction.code]
  )
  if (Array.isArray(existing) && existing.length > 0) return false

  await db.run(`
    INSERT INTO ${quoteIdentifier(table)} (
      ${quoteIdentifier('code')}, ${quoteIdentifier('name')}, ${quoteIdentifier('descr')},
      ${quoteIdentifier('sortOrder')}, ${quoteIdentifier('active')}, ${quoteIdentifier('criticality')}
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    retestOwnerAction.code,
    retestOwnerAction.name,
    retestOwnerAction.descr,
    retestOwnerAction.sortOrder,
    retestOwnerAction.active,
    retestOwnerAction.criticality
  ])
  return true
}

async function unresolvedOwnerCount (db, table) {
  const rows = await db.run(`
    SELECT COUNT(*) AS "count"
      FROM ${quoteIdentifier(table)}
     WHERE ${quoteIdentifier(columnName)} IS NULL
  `)
  return Number(rows?.[0]?.count ?? rows?.[0]?.COUNT ?? 0)
}

async function resolveTable (db, hint) {
  const rows = await db.run(
    `SELECT TABLE_NAME FROM SYS.TABLES WHERE SCHEMA_NAME = CURRENT_SCHEMA AND UPPER(TABLE_NAME) = UPPER(?)`,
    [hint]
  )
  return rows?.[0]?.TABLE_NAME || rows?.[0]?.tableName || null
}

async function hasColumn (db, table, column) {
  const rows = await db.run(
    `SELECT COLUMN_NAME FROM SYS.TABLE_COLUMNS WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME = ? AND UPPER(COLUMN_NAME) = UPPER(?)`,
    [table, column]
  )
  return Array.isArray(rows) && rows.length > 0
}

function quoteIdentifier (value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function safeErrorMessage (error) {
  return String(error?.message || error || 'Unknown migration error.')
    .replace(/(?:https?|hana):\/\/[^\s"']+/gi, '[REDACTED_ENDPOINT]')
    .replace(/password\s*[=:]\s*[^\s,;]+/gi, 'password=[REDACTED]')
}

if (require.main === module) main().catch(error => {
  console.error(`IDTS-122 HANA migration failed: ${safeErrorMessage(error)}`)
  process.exit(1)
})

module.exports = {
  columnName,
  ensureRetestOwnerAction,
  hasColumn,
  quoteIdentifier,
  resolveTable,
  retestOwnerAction,
  safeErrorMessage,
  targets,
  unresolvedOwnerCount
}
