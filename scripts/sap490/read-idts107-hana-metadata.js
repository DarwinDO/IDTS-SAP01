'use strict'

const cds = require('@sap/cds')

const expected = { tables: 48, columns: 578 }
const governedPrefixes = [
  'IDTS_CAP_',
  'BUGSERVICE_',
  'DRAFT_',
  'CDS_OUTBOX_',
  'SAP_ATTACHMENTS_'
]

;(async () => {
  const db = await cds.connect.to('db')
  const rows = await db.run(`
    SELECT TABLE_NAME, COUNT(*) AS COLUMN_COUNT
      FROM SYS.TABLE_COLUMNS
     WHERE SCHEMA_NAME = CURRENT_SCHEMA
     GROUP BY TABLE_NAME
     ORDER BY TABLE_NAME
  `)
  const tables = rows
    .map(row => ({
      table: String(row.TABLE_NAME || row.table_name || ''),
      columns: Number(row.COLUMN_COUNT || row.column_count || 0)
    }))
    .filter(row => governedPrefixes.some(prefix => row.table.toUpperCase().startsWith(prefix)))

  const actual = {
    tables: tables.length,
    columns: tables.reduce((total, row) => total + row.columns, 0)
  }
  process.stdout.write(`${JSON.stringify({
    evidence: 'IDTS107_HANA_METADATA_READBACK',
    expected,
    actual,
    matchesProductionBuild: actual.tables === expected.tables && actual.columns === expected.columns,
    tables
  })}\n`)
  await cds.shutdown()
})().catch(error => {
  process.stderr.write(`IDTS107_HANA_METADATA_READBACK_FAILED ${String(error?.code || 'UNKNOWN')}\n`)
  process.exitCode = 1
})
