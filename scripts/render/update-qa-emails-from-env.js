/**
 * Update Render QA login emails from private environment variables.
 *
 * The four seed users are located by stable UUID, not by their current email.
 * Real addresses remain outside source control and are never printed.
 */

'use strict'

const { Client } = require('pg')

const QA_USERS = [
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
  if (!databaseUrl) throw new Error('Missing IDTS_RENDER_DATABASE_URL. No login email was changed.')

  const targets = resolveTargets(process.env)
  const client = new Client({
    connectionString: databaseUrl,
    ssl: readBoolean(process.env.IDTS_RENDER_DATABASE_SSL, true) ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: readInteger(process.env.IDTS_RENDER_DATABASE_CONNECT_TIMEOUT_MS, 30000)
  })

  await client.connect()
  try {
    const result = await updateQaEmails(client, targets)
    console.log(JSON.stringify({
      updatedCount: result.updatedUsers.length,
      updatedUsers: result.updatedUsers,
      revokedSessionCount: result.revokedSessionCount,
      note: 'Email addresses, password hashes, tokens, and database URLs were not printed.'
    }, null, 2))
  } finally {
    await client.end()
  }
}

function resolveTargets (env) {
  const targets = QA_USERS.map(user => ({
    ...user,
    email: normalizeEmail(env[`IDTS_QA_${user.envKey}_EMAIL`])
  }))

  const missing = targets.filter(target => !target.email).map(target => `IDTS_QA_${target.envKey}_EMAIL`)
  if (missing.length) throw new Error(`Missing required QA email variables: ${missing.join(', ')}.`)

  for (const target of targets) {
    if (!isValidEmail(target.email)) throw new Error(`Invalid email address for ${target.envKey}.`)
  }

  if (new Set(targets.map(target => target.email)).size !== targets.length) {
    throw new Error('QA email addresses must be unique.')
  }
  return targets
}

async function updateQaEmails (client, targets) {
  const ids = targets.map(target => target.id)
  const emails = targets.map(target => target.email)
  await client.query('begin')
  try {
    const current = await client.query(
      `select id, displayname, role_code, active, passwordhash
         from idts_cap_users
        where id = any($1::uuid[])
        for update`,
      [ids]
    )
    if (current.rowCount !== targets.length) {
      throw new Error(`Expected ${targets.length} stable QA users, found ${current.rowCount}.`)
    }
    if (current.rows.some(row => !row.passwordhash)) {
      throw new Error('Every QA user must have a password hash before changing login email.')
    }

    const collisions = await client.query(
      `select id
         from idts_cap_users
        where lower(email) = any($1::text[])
          and not (id = any($2::uuid[]))`,
      [emails, ids]
    )
    if (collisions.rowCount) throw new Error('One or more QA email addresses are already used by another user.')

    const updatedUsers = []
    for (const target of targets) {
      const updated = await client.query(
        `update idts_cap_users
            set email = $1,
                modifiedat = now(),
                modifiedby = 'render-qa-identity-helper'
          where id = $2
          returning displayname, role_code, active`,
        [target.email, target.id]
      )
      if (updated.rowCount !== 1) throw new Error(`Failed to update stable QA user ${target.envKey}.`)
      updatedUsers.push({
        member: target.envKey,
        displayName: updated.rows[0].displayname,
        role: updated.rows[0].role_code,
        active: updated.rows[0].active,
        emailConfigured: true
      })
    }

    const revoked = await client.query(
      `update idts_cap_authsessions
          set revokedat = now(),
              modifiedat = now(),
              modifiedby = 'render-qa-identity-helper'
        where user_id = any($1::uuid[])
          and revokedat is null`,
      [ids]
    )
    await client.query('commit')
    return { updatedUsers, revokedSessionCount: revoked.rowCount }
  } catch (error) {
    await client.query('rollback')
    throw error
  }
}

function normalizeEmail (value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail (value) {
  return value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
  console.log(`Update Render QA login emails from private environment variables.

Required:
  IDTS_RENDER_DATABASE_URL=<private Render PostgreSQL external connection string>
  IDTS_QA_DONHV_EMAIL=<private-email>
  IDTS_QA_SANGVN_EMAIL=<private-email>
  IDTS_QA_DATDT_EMAIL=<private-email>
  IDTS_QA_NHANT_EMAIL=<private-email>

The command updates users by stable UUID, preserves password hashes, revokes old
sessions, and never prints the configured email addresses.`)
}

if (require.main === module) main().catch(error => {
  const safeMessage = String(error && error.message ? error.message : error)
    .replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[REDACTED_POSTGRES_URL]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
  console.error(`Failed to update Render QA emails: ${safeMessage}`)
  process.exit(1)
})

module.exports = { QA_USERS, isValidEmail, normalizeEmail, readBoolean, readInteger, resolveTargets, updateQaEmails }
