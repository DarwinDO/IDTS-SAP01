/**
 * Set a local/demo user's password hash without committing credentials.
 *
 * Usage in PowerShell:
 *   $env:IDTS_AUTH_EMAIL='donhv@example.local'
 *   $env:IDTS_AUTH_PASSWORD='your-private-password'
 *   npm run dev:auth:set-password
 */

'use strict'

process.env.CDS_LOG_LEVEL = process.env.CDS_LOG_LEVEL || 'warn'

const cds = require('@sap/cds')
const { UPDATE, SELECT } = cds.ql
const { hashPassword } = require('../../srv/auth/passwords')

async function main () {
  const email = normalizeEmail(process.env.IDTS_AUTH_EMAIL)
  const password = process.env.IDTS_AUTH_PASSWORD

  if (!email || !password) {
    console.error('Missing IDTS_AUTH_EMAIL or IDTS_AUTH_PASSWORD.')
    console.error('No password was written.')
    process.exit(1)
  }

  const db = await cds.connect.to('db')
  const user = await db.run(
    SELECT.one.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'active')
      .where({ email })
  )

  if (!user) {
    console.error(`No local IDTS user found for email: ${email}`)
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)
  const affected = await db.run(
    UPDATE('idts.cap.Users')
      .set({
        passwordHash,
        passwordChangedAt: new Date().toISOString()
      })
      .where({ ID: user.ID })
  )

  if (Number(affected) < 1) {
    console.error(`Password hash was not updated for user: ${email}`)
    process.exit(1)
  }

  console.log(`Password hash updated for local user ${user.displayName} <${user.email}>.`)
  console.log('The plaintext password was only read from the environment and was not written to source files.')
}

function normalizeEmail (email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : null
}

main().catch(error => {
  console.error('Failed to set local password:', error.message)
  process.exit(1)
})
