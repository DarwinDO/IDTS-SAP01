'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { writeNotificationRecord } = require('../../srv/email/outbox')
const { buildLifecycleNotification } = require('../../srv/bug-service/history')
const { hydrateNotificationPage } = require('../../srv/notification/inbox')

function emailConfig () {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    username: 'test-user',
    password: 'test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test'
  })
}

async function count (db, entity, where) {
  const row = await db.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

async function main () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  const recipient = await db.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ active: true }))
  assert.ok(bug?.ID)
  assert.ok(recipient?.ID)

  const historyID = cds.utils.uuid()
  const sourceKey = `STATUS:${historyID}:${recipient.ID}`
  const inApp = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Inbox-only assignment removal.',
    sourceKey,
    emailRequired: false
  }, emailConfig()))
  assert.equal(inApp.deliveryStatus, 'IN_APP_ONLY')
  assert.equal(inApp.deliveryID, null)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: inApp.notificationID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: inApp.notificationID }), 0)

  const duplicate = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Duplicate producer must reuse source.',
    sourceKey,
    emailRequired: false
  }, emailConfig()))
  assert.deepEqual(duplicate, inApp)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: inApp.notificationID }), 1)

  const emailHistoryID = cds.utils.uuid()
  const emailSourceKey = `STATUS:${emailHistoryID}:${recipient.ID}`
  const email = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Prompt assignment.',
    sourceKey: emailSourceKey,
    emailRequired: true
  }, emailConfig()))
  assert.equal(email.deliveryStatus, 'PENDING')
  assert.ok(email.deliveryID)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: email.notificationID }), 1)

  const ownerChanged = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'OWNER_CHANGED',
    message: 'Current owner changed.',
    sourceKey: `STATUS:${cds.utils.uuid()}:${recipient.ID}`,
    emailRequired: true
  }, emailConfig()))
  const ownerInbox = await db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ bugNotification_ID: ownerChanged.notificationID }))
  const [ownerSummary] = await hydrateNotificationPage(db, [ownerInbox], 'en')
  assert.equal(ownerSummary.eventType, 'OWNER_CHANGED')
  assert.equal(ownerSummary.actionRequired, true, 'owner-only handoff requires action without changing legacy UPDATED')

  const concurrentHistoryID = cds.utils.uuid()
  const concurrentSourceKey = `STATUS:${concurrentHistoryID}:${recipient.ID}`
  const concurrentEntry = {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'RESOLVED',
    message: 'Concurrent lifecycle producer.',
    sourceKey: concurrentSourceKey,
    emailRequired: true
  }
  const concurrent = await Promise.all([
    db.tx(tx => writeNotificationRecord(tx, concurrentEntry, emailConfig())),
    db.tx(tx => writeNotificationRecord(tx, concurrentEntry, emailConfig()))
  ])
  assert.equal(concurrent[0].notificationID, concurrent[1].notificationID, 'concurrent source producers reuse one notification')
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: concurrentSourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: concurrent[0].notificationID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: concurrent[0].notificationID }), 1)

  const rollbackSourceKey = `STATUS:${cds.utils.uuid()}:${recipient.ID}`
  await assert.rejects(db.tx(async tx => {
    await writeNotificationRecord(tx, {
      ...concurrentEntry,
      message: 'Rollback lifecycle producer.',
      sourceKey: rollbackSourceKey
    }, emailConfig())
    throw new Error('ROLLBACK_LIFECYCLE_EVENT')
  }), /ROLLBACK_LIFECYCLE_EVENT/)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: rollbackSourceKey }), 0)

  const matrix = [
    [ 'ASSIGNED', { nextProcessorUser_ID: recipient.ID }, [], 'ASSIGNED', true ],
    [ 'ASSIGNED', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'assignee', oldValue: 'old-assignee', newValue: 'new-assignee' }], 'REASSIGNED', true ],
    [ 'PENDING_ASSIGNMENT', {}, [{ fieldName: 'assignee', oldValue: 'old-assignee', newValue: null }], 'ASSIGNMENT_REMOVED', false ],
    [ 'NEED_MORE_INFORMATION', { nextProcessorUser_ID: recipient.ID }, [], 'NEED_MORE_INFORMATION', true ],
    [ 'REJECTED', { nextProcessorUser_ID: recipient.ID }, [], 'REJECTED', true ],
    [ 'RESOLVED', { nextProcessorUser_ID: recipient.ID }, [], 'RESOLVED', true ],
    [ 'RETEST_REQUIRED', { nextProcessorUser_ID: recipient.ID }, [], 'RETEST_REQUIRED', true ],
    [ 'REOPENED', { nextProcessorUser_ID: recipient.ID }, [], 'REOPENED', true ],
    [ 'CLOSED', { reporter_ID: recipient.ID }, [], 'CLOSED', true ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_PROGRESS', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'nextProcessorUser', oldValue: 'old-owner', newValue: recipient.ID }], 'OWNER_CHANGED', true ],
    [ 'IN_PROGRESS', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'nextProcessorUser', oldValue: 'old-owner', newValue: recipient.ID }], 'OWNER_CHANGED', true ]
  ]
  for (const [status, bugInput, changes, eventType, emailRequired] of matrix) {
    const plan = buildLifecycleNotification({
      bug: { ID: bug.ID, ...bugInput }, status, changes,
      historyID, previousAssigneeUserID: recipient.ID
    })
    assert.equal(plan?.eventType || null, eventType, `${status} event type`)
    if (plan) {
      assert.equal(plan.recipientID, recipient.ID, `${status} recipient`)
      assert.equal(plan.emailRequired, emailRequired, `${status} channel`)
      assert.equal(plan.sourceKey, `STATUS:${historyID}:${plan.recipientID}`, `${status} source key`)
    }
  }

  const resubmitted = buildLifecycleNotification({
    bug: { ID: bug.ID, nextProcessorUser_ID: recipient.ID }, status: 'ASSIGNED', historyID,
    eventType: 'RESUBMITTED'
  })
  assert.equal(resubmitted.eventType, 'RESUBMITTED')
  assert.equal(resubmitted.recipientID, recipient.ID)
  const retestOwnerChanged = buildLifecycleNotification({
    bug: { ID: bug.ID, nextProcessorUser_ID: recipient.ID }, status: 'RETEST_REQUIRED', historyID,
    eventType: 'RETEST_OWNER_CHANGED'
  })
  assert.equal(retestOwnerChanged.eventType, 'RETEST_OWNER_CHANGED')
  assert.equal(retestOwnerChanged.recipientID, recipient.ID)

  const outboxSource = fs.readFileSync(path.join(__dirname, '../../srv/email/outbox.js'), 'utf8')
  assert.match(outboxSource, /SELECT\.one\.from\(ENTITIES\.Bugs\)[\s\S]*\.forUpdate\(\)/, 'source Bug lock precedes source-key lookup')

  console.log('My Notifications lifecycle event matrix: PASS')
}

main().catch(error => {
  console.error('My Notifications lifecycle event matrix: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
