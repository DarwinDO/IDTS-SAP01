'use strict'

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const NOTIFICATIONS = 'idts.cap.Notifications'
const DELIVERIES = 'idts.cap.NotificationDeliveries'
const INBOX = 'idts.cap.UserNotificationInboxEntries'

async function buildBugInboxBackfillPlan ({ tx, now = new Date(), days = 30 }) {
  const cutoff = cutoffTimestamp(now, days)
  const candidates = await tx.run(
    SELECT.from(NOTIFICATIONS)
      .columns('ID', 'recipient_ID', 'createdAt')
      .where({ createdAt: { '>=': cutoff } })
      .orderBy('createdAt asc', 'ID asc')
  )
  if (!candidates.length) return emptyPlan(cutoff)

  const notificationIDs = candidates.map(row => row.ID)
  const [deliveries, indexed] = await Promise.all([
    tx.run(SELECT.from(DELIVERIES).columns('notification_ID').where({ notification_ID: { in: notificationIDs } })),
    tx.run(SELECT.from(INBOX).columns('bugNotification_ID').where({ bugNotification_ID: { in: notificationIDs } }))
  ])
  const deliveredIDs = new Set(deliveries.map(row => row.notification_ID))
  const indexedIDs = new Set(indexed.map(row => row.bugNotification_ID))
  const entries = candidates
    .filter(row => row.recipient_ID && !deliveredIDs.has(row.ID) && !indexedIDs.has(row.ID))
    .map(row => ({
      ID: cds.utils.uuid(),
      recipient_ID: row.recipient_ID,
      bugNotification_ID: row.ID,
      accessAuditEvent_ID: null,
      occurredAt: row.createdAt
    }))
  entries.forEach(assertExactlyOneSource)
  return {
    cutoff,
    candidateCount: candidates.length,
    missingCount: entries.length,
    entries,
    accessEntryCount: 0,
    deliveryInsertCount: 0
  }
}

async function executeBugInboxBackfill ({ tx, now = new Date(), days = 30 }) {
  const plan = await buildBugInboxBackfillPlan({ tx, now, days })
  if (plan.entries.length) await tx.run(INSERT.into(INBOX).entries(plan.entries))
  return { ...plan, insertedCount: plan.entries.length }
}

async function runBackfill ({ tx, now = new Date(), days = 30, execute = false, log = defaultLog }) {
  const plan = await buildBugInboxBackfillPlan({ tx, now, days })
  log(`Cutoff: ${plan.cutoff}`)
  log(`Bug candidates: ${plan.candidateCount}`)
  log(`Missing inbox entries: ${plan.missingCount}`)
  if (!execute) {
    log('No database was changed')
    return { ...plan, insertedCount: 0 }
  }
  const result = await executeBugInboxBackfill({ tx, now, days })
  log(`Inserted inbox entries: ${result.insertedCount}`)
  return result
}

function assertExactlyOneSource (entry) {
  const sourceCount = Number(Boolean(entry?.bugNotification_ID)) + Number(Boolean(entry?.accessAuditEvent_ID))
  if (sourceCount !== 1) throw new Error('Inbox entry must reference exactly one source.')
}

function cutoffTimestamp (now, days) {
  const instant = new Date(now)
  if (Number.isNaN(instant.getTime()) || !Number.isInteger(days) || days < 1 || days > 30) {
    throw new TypeError('Backfill window must be between 1 and 30 days.')
  }
  instant.setUTCDate(instant.getUTCDate() - days)
  return instant.toISOString()
}

function emptyPlan (cutoff) {
  return { cutoff, candidateCount: 0, missingCount: 0, entries: [], accessEntryCount: 0, deliveryInsertCount: 0 }
}

function defaultLog (line) {
  process.stdout.write(`${line}\n`)
}

async function main () {
  const execute = process.argv.slice(2).includes('--execute')
  const unknown = process.argv.slice(2).filter(argument => argument !== '--execute')
  if (unknown.length) throw new TypeError('Only --execute is supported.')
  const db = await cds.connect.to('db')
  if (execute) {
    await db.tx(tx => runBackfill({ tx, execute: true }))
  } else {
    await runBackfill({ tx: db, execute: false })
  }
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Notification inbox backfill failed: ${error.message}\n`)
    process.exitCode = 1
  }).finally(() => cds.shutdown())
}

module.exports = {
  assertExactlyOneSource,
  buildBugInboxBackfillPlan,
  executeBugInboxBackfill,
  runBackfill
}
