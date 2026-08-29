#!/usr/bin/env node
'use strict'

const { createHash } = require('node:crypto')
const { createHdiDatabase } = require('./run-user-admin-logical-backup')

const TABLE = 'IDTS_CAP_NOTIFICATIONEVENTTYPES'
const COLUMNS = ['code', 'name', 'descr', 'sortOrder', 'active', 'criticality']
const EVENT_TYPES = Object.freeze([
  ['ASSIGNED', 'Assigned', 'Bug was assigned to a developer', 10, true, 1],
  ['NEED_MORE_INFORMATION', 'Need More Information', 'Additional information is requested', 20, true, 2],
  ['UPDATED', 'Updated', 'Bug was updated', 30, true, 0],
  ['REJECTED', 'Rejected', 'Bug needs follow-up after rejection', 40, true, 2],
  ['OVERDUE', 'Overdue', 'Bug is overdue', 50, true, 3],
  ['CLOSED', 'Closed', 'Bug was closed', 60, true, 3],
  ['RESOLVED', 'Resolved', 'Bug was resolved and is ready for verification', 70, true, 1],
  ['RETEST_REQUIRED', 'Retest Required', 'Bug requires retest', 80, true, 2],
  ['REOPENED', 'Reopened', 'Bug was reopened and needs follow-up', 90, true, 2],
  ['RESUBMITTED', 'Resubmitted', 'Bug was resubmitted to the assigned developer', 100, true, 1],
  ['REASSIGNED', 'Reassigned', 'Bug was reassigned to a different developer', 110, true, 1],
  ['RETEST_OWNER_CHANGED', 'Retest Owner Changed', 'Tester responsible for retest changed', 120, true, 1],
  ['COMMENT_MENTIONED', 'Comment Mentioned', 'User was mentioned in a bug comment', 130, true, 1],
  ['PRIORITY_ESCALATED', 'Priority Escalated', 'Bug priority increased', 140, true, 2],
  ['SEVERITY_ESCALATED', 'Severity Escalated', 'Bug severity increased', 150, true, 2],
  ['PENDING_ASSIGNMENT', 'Pending Assignment', 'Bug is waiting for PM assignment', 160, true, 2],
  ['ASSIGNMENT_REMOVED', 'Assignment Removed', 'Bug assignment was removed for the previous developer', 170, true, 1],
  ['OWNER_CHANGED', 'Current Owner Changed', 'Bug workflow ownership changed', 180, true, 1]
].map(values => Object.freeze(Object.fromEntries(COLUMNS.map((column, index) => [column, values[index]])))))

function normalizeRow (row) {
  return {
    code: String(row.CODE ?? row.code),
    name: String(row.NAME ?? row.name),
    descr: String(row.DESCR ?? row.descr),
    sortOrder: Number(row.SORTORDER ?? row.sortOrder),
    active: Boolean(row.ACTIVE ?? row.active),
    criticality: Number(row.CRITICALITY ?? row.criticality)
  }
}

function canonical (rows) {
  return JSON.stringify(rows.map(normalizeRow).sort((left, right) => left.code.localeCompare(right.code)))
}

function verifyExistingRows (rows) {
  const desired = new Map(EVENT_TYPES.map(row => [row.code, canonical([row])]))
  const seen = new Set()
  for (const raw of rows) {
    const row = normalizeRow(raw)
    if (seen.has(row.code) || !desired.has(row.code) || canonical([row]) !== desired.get(row.code)) {
      throw new Error('The notification event catalog contains an unexpected or conflicting row.')
    }
    seen.add(row.code)
  }
  return EVENT_TYPES.filter(row => !seen.has(row.code))
}

async function selectRows (db) {
  const placeholders = EVENT_TYPES.map(() => '?').join(', ')
  return db.run(
    `SELECT "CODE" AS "code", "NAME" AS "name", "DESCR" AS "descr", "SORTORDER" AS "sortOrder", "ACTIVE" AS "active", "CRITICALITY" AS "criticality" FROM "${TABLE}" WHERE "CODE" IN (${placeholders}) ORDER BY "CODE"`,
    EVENT_TYPES.map(row => row.code)
  )
}

async function initializeEventTypes (db) {
  let stage = 'READ_BEFORE'
  try {
    const before = await selectRows(db)
    stage = 'VALIDATE_BEFORE'
    const missing = verifyExistingRows(before)
    if (missing.length === 0) {
      return { result: 'NOOP', inserted: 0, rowCount: before.length, digestPrefix: createHash('sha256').update(canonical(before)).digest('hex').slice(0, 12) }
    }
    stage = 'BEGIN'
    await db.begin()
    try {
      const insert = `INSERT INTO "${TABLE}" ("CODE", "NAME", "DESCR", "SORTORDER", "ACTIVE", "CRITICALITY") VALUES (?, ?, ?, ?, ?, ?)`
      stage = 'INSERT'
      for (const row of missing) await db.run(insert, COLUMNS.map(column => row[column]))
      stage = 'READ_AFTER'
      const after = await selectRows(db)
      stage = 'VALIDATE_AFTER'
      if (after.length !== EVENT_TYPES.length || canonical(after) !== canonical(EVENT_TYPES)) {
        throw new Error('The notification event catalog readback did not match the exact allowlist.')
      }
      stage = 'COMMIT'
      await db.commit()
      return { result: 'INITIALIZED', inserted: missing.length, rowCount: after.length, digestPrefix: createHash('sha256').update(canonical(after)).digest('hex').slice(0, 12) }
    } catch (error) {
      const failedStage = stage
      await db.rollback()
      error.safeStage = failedStage
      throw error
    }
  } catch (error) {
    if (!error.safeStage) error.safeStage = stage
    throw error
  }
}

async function main () {
  let db
  try {
    db = await createHdiDatabase()
    const result = await initializeEventTypes(db)
    console.log(`IDTS_N4_EVENT_INIT=${Buffer.from(JSON.stringify(result)).toString('base64')}`)
  } catch (error) {
    console.error(`IDTS_N4_EVENT_INIT=FAIL;CODE=${error?.safeStage || 'CONNECT'}`)
    process.exitCode = 1
  } finally {
    if (db) await db.disconnect()
  }
}

if (require.main === module) main()

module.exports = { EVENT_TYPES, initializeEventTypes, verifyExistingRows }
