#!/usr/bin/env node
'use strict'

// This helper is intentionally narrow: it only adds the two nullable IDTS-97
// columns. It never runs cds deploy, reloads seed data, or prints the DB URL.
const { Client } = require('pg')

// CAP compiles unquoted CDS identifiers to PostgreSQL identifiers. PostgreSQL
// folds those physical identifiers to lower case, so this helper must use the
// same lower-case names that CAP created in the Render database.
const physicalTable = 'idts_cap_aisuggestions'
const physicalColumns = ['operationstatus', 'latencyms']
const statements = [
  `ALTER TABLE ${physicalTable} ADD COLUMN IF NOT EXISTS ${physicalColumns[0]} VARCHAR(40)`,
  `ALTER TABLE ${physicalTable} ADD COLUMN IF NOT EXISTS ${physicalColumns[1]} INTEGER`
]
const viewStatement = `
  CREATE OR REPLACE VIEW bugservice_aisuggestions AS
  SELECT
    a.id, a.createdat, a.modifiedat, a.bug_id, a.featuretype_code,
    ft.name AS featuretypename,
    a.requestedby_id, requester.displayname AS requestedbydisplayname,
    a.provideralias, a.modelalias, a.confidence, a.suggestionpayload, a.summary,
    a.reviewstate_code, rs.name AS reviewstatename,
    a.reviewedby_id, reviewer.displayname AS reviewedbydisplayname,
    a.reviewedat, a.expiresat, a.correlationid,
    a.operationstatus, a.latencyms
  FROM idts_cap_aisuggestions a
  LEFT JOIN idts_cap_aisuggestionfeaturetypes ft ON a.featuretype_code = ft.code
  LEFT JOIN idts_cap_users requester ON a.requestedby_id = requester.id
  LEFT JOIN idts_cap_aisuggestionreviewstates rs ON a.reviewstate_code = rs.code
  LEFT JOIN idts_cap_users reviewer ON a.reviewedby_id = reviewer.id
`

async function main () {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    return
  }

  const execute = process.argv.includes('--execute')
  if (!execute) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      table: physicalTable,
      columns: physicalColumns,
      statementCount: statements.length,
      refreshesServiceView: true,
      note: 'No database connection was opened and no SQL was executed.'
    }, null, 2))
    return
  }

  const databaseUrl = process.env.IDTS_RENDER_DATABASE_URL
  if (!databaseUrl) throw new Error('Missing IDTS_RENDER_DATABASE_URL. No migration was executed.')

  const client = new Client({
    connectionString: databaseUrl,
    ssl: readBoolean(process.env.IDTS_RENDER_DATABASE_SSL, true)
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: readInteger(process.env.IDTS_RENDER_DATABASE_CONNECT_TIMEOUT_MS, 30000)
  })

  await client.connect()
  try {
    await client.query('BEGIN')
    for (const statement of statements) await client.query(statement)
    await client.query(viewStatement)
    const verification = await client.query(`
      SELECT column_name AS "columnName", data_type AS "dataType", is_nullable AS "isNullable"
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = ANY($2::text[])
      ORDER BY column_name
    `, [physicalTable, physicalColumns])

    if (verification.rows.length !== 2) {
      throw new Error('IDTS-97 migration verification did not find both expected columns.')
    }
    const viewVerification = await client.query(`
      SELECT column_name AS "columnName"
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'bugservice_aisuggestions'
        AND column_name = ANY($1::text[])
      ORDER BY column_name
    `, [physicalColumns])
    if (viewVerification.rows.length !== 2) {
      throw new Error('IDTS-97 migration verification did not expose both columns through BugService_AiSuggestions.')
    }
    await client.query('COMMIT')
    console.log(JSON.stringify({
      mode: 'execute',
      migratedColumnCount: verification.rows.length,
      columns: verification.rows,
      exposedViewColumnCount: viewVerification.rows.length,
      note: 'Database URL and credentials were not printed.'
    }, null, 2))
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

function readBoolean (value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function readInteger (value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function printHelp () {
  console.log(`IDTS-97 additive PostgreSQL migration helper.

Dry-run (default, opens no connection):
  node scripts/db/migrate-idts97-ai-metrics.js --dry-run

Execute explicitly:
  IDTS_RENDER_DATABASE_URL=<private-url> node scripts/db/migrate-idts97-ai-metrics.js --execute

The helper only adds nullable operationStatus and latencyMs columns with
ADD COLUMN IF NOT EXISTS and refreshes the existing read-only
BugService_AiSuggestions view inside one transaction.`)
}

function safeErrorMessage (error) {
  return String(error?.message || error || 'Unknown migration error.')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[REDACTED_POSTGRES_URL]')
    .replace(/password\s*[=:]\s*[^\s,;]+/gi, 'password=[REDACTED]')
}

if (require.main === module) main().catch(error => {
  console.error(`IDTS-97 migration failed: ${safeErrorMessage(error)}`)
  process.exit(1)
})

module.exports = {
  physicalTable,
  physicalColumns,
  readBoolean,
  readInteger,
  safeErrorMessage,
  statements,
  viewStatement
}
