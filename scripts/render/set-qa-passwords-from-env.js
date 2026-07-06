/**
 * Set Render QA user password hashes from private environment variables.
 *
 * This script is intentionally small and direct:
 * - it reads the PostgreSQL connection string from IDTS_RENDER_DATABASE_URL;
 * - it reads plaintext passwords only from process environment variables;
 * - it writes only password hashes to idts_cap_users;
 * - it never prints plaintext passwords, hashes, or database URLs.
 *
 * Supported password env vars:
 * - IDTS_QA_SHARED_PASSWORD: set the same temporary QA password for all seed users.
 * - IDTS_QA_DONHV_PASSWORD, IDTS_QA_SANGVN_PASSWORD,
 *   IDTS_QA_DATDT_PASSWORD, IDTS_QA_NHANT_PASSWORD: set per-user passwords.
 * - IDTS_AUTH_EMAIL + IDTS_AUTH_PASSWORD: set one explicit user.
 */

'use strict'

const { Client } = require('pg')
const { hashPassword } = require('../../srv/auth/passwords')

const DEFAULT_USERS = [
  { envKey: 'DONHV', id: '10000000-0000-0000-0000-000000000001' },
  { envKey: 'SANGVN', id: '10000000-0000-0000-0000-000000000002' },
  { envKey: 'DATDT', id: '10000000-0000-0000-0000-000000000003' },
  { envKey: 'NHANT', id: '10000000-0000-0000-0000-000000000004' }
]

async function main () {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    return
  }

  const databaseUrl = process.env.IDTS_RENDER_DATABASE_URL
  if (!databaseUrl) {
    fail('Missing IDTS_RENDER_DATABASE_URL. No password hash was written.')
  }

  const targets = resolveTargets()
  if (targets.length === 0) {
    fail('No password env var was provided. Set IDTS_QA_SHARED_PASSWORD, per-user IDTS_QA_*_PASSWORD, or IDTS_AUTH_EMAIL + IDTS_AUTH_PASSWORD.')
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: readBoolean(process.env.IDTS_RENDER_DATABASE_SSL, true) ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: readInteger(process.env.IDTS_RENDER_DATABASE_CONNECT_TIMEOUT_MS, 30000)
  })

  await client.connect()
  try {
    const updated = []
    for (const target of targets) {
      const passwordHash = await hashPassword(target.password)
      const whereClause = target.id ? 'id = $2' : 'lower(email) = lower($2)'
      const identity = target.id || normalizeEmail(target.email)
      const result = await client.query(
        `update idts_cap_users
           set passwordhash = $1,
               passwordchangedat = now()
         where ${whereClause}
         returning displayname, role_code, active`,
        [passwordHash, identity]
      )

      if (result.rowCount !== 1) {
        fail(`Expected exactly one QA user for ${target.envKey || 'explicit email'}, updated ${result.rowCount}.`, 2)
      }

      const user = result.rows[0]
      updated.push({
        displayName: user.displayname,
        role: user.role_code,
        active: user.active
      })
    }

    console.log(JSON.stringify({
      updatedCount: updated.length,
      updatedUsers: updated,
      note: 'Plaintext passwords and password hashes were not printed.'
    }, null, 2))
  } finally {
    await client.end()
  }
}

function resolveTargets () {
  const explicitEmail = normalizeEmail(process.env.IDTS_AUTH_EMAIL)
  const explicitPassword = process.env.IDTS_AUTH_PASSWORD
  if (explicitEmail || explicitPassword) {
    if (!explicitEmail || !explicitPassword) {
      fail('IDTS_AUTH_EMAIL and IDTS_AUTH_PASSWORD must be provided together.')
    }
    return [{ email: explicitEmail, password: explicitPassword }]
  }

  const sharedPassword = process.env.IDTS_QA_SHARED_PASSWORD
  if (sharedPassword) {
    return DEFAULT_USERS.map(user => ({ ...user, password: sharedPassword }))
  }

  const targets = []
  for (const user of DEFAULT_USERS) {
    const password = process.env[`IDTS_QA_${user.envKey}_PASSWORD`]
    if (password) {
      targets.push({ ...user, password })
    }
  }
  return targets
}

function normalizeEmail (email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function readBoolean (value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function readInteger (value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function fail (message, code = 1) {
  console.error(message)
  process.exit(code)
}

function printHelp () {
  console.log(`Set Render QA password hashes from private environment variables.

Required:
  IDTS_RENDER_DATABASE_URL=<private Render PostgreSQL external connection string>

Choose one password mode:
  IDTS_QA_SHARED_PASSWORD=<private-password>
  IDTS_QA_DONHV_PASSWORD=<private-password>
  IDTS_QA_SANGVN_PASSWORD=<private-password>
  IDTS_QA_DATDT_PASSWORD=<private-password>
  IDTS_QA_NHANT_PASSWORD=<private-password>
  IDTS_AUTH_EMAIL=<one-email> IDTS_AUTH_PASSWORD=<private-password>

Optional:
  IDTS_RENDER_DATABASE_SSL=true|false
  IDTS_RENDER_DATABASE_CONNECT_TIMEOUT_MS=30000

The script prints only updated user identities. It does not print plaintext passwords, hashes, or database URLs.`)
}

if (require.main === module) main().catch(error => {
  const safeMessage = String(error && error.message ? error.message : error)
    .replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[REDACTED_POSTGRES_URL]')
  console.error(`Failed to set Render QA passwords: ${safeMessage}`)
  process.exit(1)
})

module.exports = { DEFAULT_USERS, normalizeEmail, readBoolean, readInteger, resolveTargets }
