#!/usr/bin/env node
'use strict'

const { createHdiDatabase } = require('./run-user-admin-logical-backup')

const TABLES = Object.freeze({
  users: 'IDTS_CAP_USERS',
  auditEvents: 'IDTS_CAP_USERIDENTITYAUDITEVENTS',
  onboardingDeliveries: 'IDTS_CAP_USERONBOARDINGDELIVERIES',
  accessDeliveries: 'IDTS_CAP_USERACCESSNOTIFICATIONDELIVERIES'
})

function numericValue (rows) {
  const value = Number(rows?.[0]?.VALUE ?? rows?.[0]?.value)
  if (!Number.isInteger(value) || value < 0) throw new Error('Gate 6.5 aggregate readback is invalid.')
  return value
}

async function count (db, table) {
  return numericValue(await db.run(`SELECT COUNT(*) AS VALUE FROM "${table}"`))
}

async function inspectAccessDeliveryState (db, { phase }) {
  if (!['pre', 'post'].includes(phase)) throw new Error('Gate 6.5 inspection phase is invalid.')

  const result = {
    users: await count(db, TABLES.users),
    auditEvents: await count(db, TABLES.auditEvents),
    onboardingDeliveries: await count(db, TABLES.onboardingDeliveries),
    accessDeliveries: null,
    accessDeliveryTableExists: false
  }

  try {
    result.accessDeliveries = await count(db, TABLES.accessDeliveries)
    result.accessDeliveryTableExists = true
  } catch (error) {
    if (phase !== 'pre' || Number(error?.code) !== 259) {
      throw new Error('Gate 6.5 access delivery inspection failed.')
    }
  }

  if (phase === 'pre' && result.accessDeliveryTableExists) {
    throw new Error('Gate 6.5 access delivery table must be absent before migration.')
  }
  if (phase === 'post' && (!result.accessDeliveryTableExists || result.accessDeliveries !== 0)) {
    throw new Error('Gate 6.5 access delivery table must be empty after migration.')
  }
  return result
}

async function main () {
  let db
  try {
    const phase = process.argv.includes('--post-migration') ? 'post' : 'pre'
    db = await createHdiDatabase()
    const result = await inspectAccessDeliveryState(db, { phase })
    console.log(`IDTS_GATE65_SCHEMA_INSPECTION=${Buffer.from(JSON.stringify(result), 'utf8').toString('base64')}`)
  } catch {
    console.error('IDTS_GATE65_SCHEMA_INSPECTION=FAIL')
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

if (require.main === module) main()

module.exports = { inspectAccessDeliveryState }
