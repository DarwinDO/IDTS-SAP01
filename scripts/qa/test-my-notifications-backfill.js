'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const USER_ID = 'e1000000-0000-4000-8000-000000000001'
const BUG_ID = '90000000-0000-0000-0000-000000000001'

async function main () {
  const {
    assertExactlyOneSource,
    buildBugInboxBackfillPlan,
    executeBugInboxBackfill,
    runBackfill
  } = require('../db/backfill-notification-inbox')

  assert.throws(() => assertExactlyOneSource({}), /exactly one/i)
  assert.throws(() => assertExactlyOneSource({ bugNotification_ID: 'bug', accessAuditEvent_ID: 'audit' }), /exactly one/i)
  assert.doesNotThrow(() => assertExactlyOneSource({ bugNotification_ID: 'bug' }))

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: USER_ID,
    displayName: 'Backfill User',
    email: 'backfill@example.invalid',
    role_code: 'TESTER',
    active: true
  }))

  const recentMissing = 'e2000000-0000-4000-8000-000000000001'
  const recentWithEmail = 'e2000000-0000-4000-8000-000000000002'
  const stale = 'e2000000-0000-4000-8000-000000000003'
  const alreadyIndexed = 'e2000000-0000-4000-8000-000000000004'
  await db.run(INSERT.into('idts.cap.Notifications').entries([
    notification(recentMissing, '2026-08-20T00:00:00.000Z'),
    notification(recentWithEmail, '2026-08-21T00:00:00.000Z'),
    notification(stale, '2026-07-01T00:00:00.000Z'),
    notification(alreadyIndexed, '2026-08-22T00:00:00.000Z')
  ]))
  await db.run(INSERT.into('idts.cap.NotificationDeliveries').entries({
    ID: 'e3000000-0000-4000-8000-000000000001',
    notification_ID: recentWithEmail,
    channel_code: 'EMAIL',
    recipientEmail: 'backfill@example.invalid',
    templateKey: 'TEST',
    subject: 'Existing email',
    textBody: 'Existing email',
    htmlBody: '<p>Existing email</p>',
    status_code: 'SENT',
    attemptCount: 1
  }))
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({
    ID: 'e4000000-0000-4000-8000-000000000001',
    recipient_ID: USER_ID,
    bugNotification_ID: alreadyIndexed,
    occurredAt: '2026-08-22T00:00:00.000Z'
  }))

  const now = new Date('2026-08-27T00:00:00.000Z')
  const plan = await buildBugInboxBackfillPlan({ tx: db, now, days: 30 })
  assert.equal(plan.cutoff, '2026-07-28T00:00:00.000Z')
  assert.deepEqual(plan.entries.map(entry => entry.bugNotification_ID), [recentMissing])
  assert.equal(plan.accessEntryCount, 0)
  assert.equal(plan.deliveryInsertCount, 0)

  const beforeDeliveryCount = await count(db, 'idts.cap.NotificationDeliveries')
  const beforeAuditCount = await count(db, 'idts.cap.UserIdentityAuditEvents')
  const logs = []
  const dryRun = await runBackfill({ tx: db, now, execute: false, log: line => logs.push(line) })
  assert.equal(dryRun.insertedCount, 0)
  assert.match(logs.join('\n'), /No database was changed/)
  assert.equal((await buildBugInboxBackfillPlan({ tx: db, now, days: 30 })).entries.length, 1)

  const executed = await executeBugInboxBackfill({ tx: db, now, days: 30 })
  assert.equal(executed.insertedCount, 1)
  assert.equal((await buildBugInboxBackfillPlan({ tx: db, now, days: 30 })).entries.length, 0, 'rerun is a no-op')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries'), beforeDeliveryCount)
  assert.equal(await count(db, 'idts.cap.UserIdentityAuditEvents'), beforeAuditCount)

  console.log('IDTS My Notifications dry-run backfill contract: PASS')
}

function notification (ID, createdAt) {
  return {
    ID,
    bug_ID: BUG_ID,
    recipient_ID: USER_ID,
    eventType_code: 'UPDATED',
    channel_code: 'IN_APP',
    deliveryStatus_code: 'SENT',
    message: 'Backfill candidate',
    createdAt,
    modifiedAt: createdAt
  }
}

async function count (tx, entity) {
  const row = await tx.run(SELECT.one.from(entity).columns('count(*) as count'))
  return Number(row?.count || 0)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
