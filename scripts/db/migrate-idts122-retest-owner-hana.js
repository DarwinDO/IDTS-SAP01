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
const physicalColumnName = columnName.toUpperCase()
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
      note: 'No database connection was opened. No DDL, DML, deploy, or seed operation ran. Execute from one operator only. HANA additive DDL may commit per statement; this helper is intentionally idempotent and rerunnable.'
    }, null, 2))
    return
  }

  const db = await cds.connect.to('db')
  if (db.kind !== 'hana') throw new Error('IDTS-122 migration requires a bound SAP HANA database service.')

  const resolvedTargets = []
  for (const target of targets) {
    const table = await resolveTable(db, target.tableHint)
    if (!table) throw new Error(`Required ${target.logicalName} table was not found.`)
    const reporterColumn = await requireColumn(db, table, 'reporter_ID', target.logicalName)
    const retestOwnerColumn = await resolveColumn(db, table, columnName)
    resolvedTargets.push({ ...target, table, reporterColumn, retestOwnerColumn })
  }

  const usersTable = await resolveTable(db, 'idts_cap_Users')
  if (!usersTable) throw new Error('Users table was not found; safe backfill was not executed.')
  const actionTypesTable = await resolveTable(db, 'idts_cap_ActionTypes')
  if (!actionTypesTable) throw new Error('ActionTypes table was not found; audit code-list update was not executed.')

  // Resolve every existing physical column before the first DDL statement. HDI
  // artifacts use unquoted identifiers, which HANA stores in uppercase.
  const userColumns = {
    ID: await requireColumn(db, usersTable, 'ID', 'Users'),
    roleCode: await requireColumn(db, usersTable, 'role_code', 'Users'),
    active: await requireColumn(db, usersTable, 'active', 'Users')
  }
  const actionColumns = {
    code: await requireColumn(db, actionTypesTable, 'code', 'ActionTypes'),
    name: await requireColumn(db, actionTypesTable, 'name', 'ActionTypes'),
    descr: await requireColumn(db, actionTypesTable, 'descr', 'ActionTypes'),
    sortOrder: await requireColumn(db, actionTypesTable, 'sortOrder', 'ActionTypes'),
    active: await requireColumn(db, actionTypesTable, 'active', 'ActionTypes'),
    criticality: await requireColumn(db, actionTypesTable, 'criticality', 'ActionTypes')
  }

  for (const target of resolvedTargets) {
    const columnExists = Boolean(target.retestOwnerColumn)
    if (!columnExists) {
      await db.run(`ALTER TABLE ${quoteIdentifier(target.table)} ADD (${quoteIdentifier(physicalColumnName)} NVARCHAR(36))`)
      target.retestOwnerColumn = await resolveColumn(db, target.table, columnName)
    }
    if (!target.retestOwnerColumn) throw new Error(`Column verification failed for ${target.logicalName}.`)
    target.added = !columnExists
  }

  const migrationResult = await db.tx(async tx => {
    const actionTypeInserted = await ensureRetestOwnerAction(tx, actionTypesTable, actionColumns)
    for (const target of resolvedTargets) {
      target.backfilledRowCount = Number(await tx.run(`
        UPDATE ${quoteIdentifier(target.table)} AS B
           SET ${quoteIdentifier(target.retestOwnerColumn)} = B.${quoteIdentifier(target.reporterColumn)}
         WHERE B.${quoteIdentifier(target.retestOwnerColumn)} IS NULL
           AND EXISTS (
             SELECT 1
               FROM ${quoteIdentifier(usersTable)} AS U
              WHERE U.${quoteIdentifier(userColumns.ID)} = B.${quoteIdentifier(target.reporterColumn)}
                AND U.${quoteIdentifier(userColumns.roleCode)} = 'TESTER'
                AND U.${quoteIdentifier(userColumns.active)} = TRUE
           )
      `)) || 0
      target.unresolvedOwnerCount = await unresolvedOwnerCount(tx, target.table, target.retestOwnerColumn)
    }
    return { actionTypeInserted }
  })

  console.log(JSON.stringify({
    mode: 'execute',
    targets: resolvedTargets.map(({ logicalName, added, backfilledRowCount, unresolvedOwnerCount }) => ({
      logicalName,
      columnAdded: added,
      backfilledRowCount,
      unresolvedOwnerCount
    })),
    actionTypeInserted: migrationResult.actionTypeInserted,
    note: 'Existing non-null retest owners were preserved. Execute from one operator only. Additive DDL may commit per statement; sequential rerun is safe. Credentials and private endpoints were not printed.'
  }, null, 2))
}

async function ensureRetestOwnerAction (db, table, columns) {
  const existing = await db.run(
    `SELECT ${quoteIdentifier(columns.code)} FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(columns.code)} = ?`,
    [retestOwnerAction.code]
  )
  if (Array.isArray(existing) && existing.length > 0) return false

  await db.run(`
    INSERT INTO ${quoteIdentifier(table)} (
      ${quoteIdentifier(columns.code)}, ${quoteIdentifier(columns.name)}, ${quoteIdentifier(columns.descr)},
      ${quoteIdentifier(columns.sortOrder)}, ${quoteIdentifier(columns.active)}, ${quoteIdentifier(columns.criticality)}
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

async function unresolvedOwnerCount (db, table, retestOwnerColumn) {
  const rows = await db.run(`
    SELECT COUNT(*) AS "count"
      FROM ${quoteIdentifier(table)}
     WHERE ${quoteIdentifier(retestOwnerColumn)} IS NULL
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

async function resolveColumn (db, table, column) {
  const rows = await db.run(
    `SELECT COLUMN_NAME FROM SYS.TABLE_COLUMNS WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME = ? AND UPPER(COLUMN_NAME) = UPPER(?)`,
    [table, column]
  )
  return rows?.[0]?.COLUMN_NAME || rows?.[0]?.columnName || null
}

async function requireColumn (db, table, column, logicalName) {
  const resolved = await resolveColumn(db, table, column)
  if (!resolved) throw new Error(`Required ${logicalName} column ${column} was not found.`)
  return resolved
}

async function hasColumn (db, table, column) {
  return Boolean(await resolveColumn(db, table, column))
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
  physicalColumnName,
  quoteIdentifier,
  requireColumn,
  resolveColumn,
  resolveTable,
  retestOwnerAction,
  safeErrorMessage,
  targets,
  unresolvedOwnerCount
}
