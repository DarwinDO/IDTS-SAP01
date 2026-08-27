'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { writeNotificationRecord } = require('../../srv/email/outbox')
const { buildLifecycleNotification } = require('../../srv/bug-service/history')

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
    [ 'PENDING_ASSIGNMENT', {}, [{ fieldName: 'assignee', oldValue: 'old-assignee', newValue: null }], 'PENDING_ASSIGNMENT', false ],
    [ 'NEED_MORE_INFORMATION', { nextProcessorUser_ID: recipient.ID }, [], 'NEED_MORE_INFORMATION', true ],
    [ 'REJECTED', { nextProcessorUser_ID: recipient.ID }, [], 'REJECTED', true ],
    [ 'RESOLVED', { nextProcessorUser_ID: recipient.ID }, [], 'RESOLVED', true ],
    [ 'RETEST_REQUIRED', { nextProcessorUser_ID: recipient.ID }, [], 'RETEST_REQUIRED', true ],
    [ 'REOPENED', { nextProcessorUser_ID: recipient.ID }, [], 'REOPENED', true ],
    [ 'CLOSED', { reporter_ID: recipient.ID }, [], 'CLOSED', true ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_PROGRESS', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'nextProcessorUser', oldValue: 'old-owner', newValue: recipient.ID }], 'UPDATED', true ]
  ]
  for (const [status, bugInput, changes, eventType, emailRequired] of matrix) {
    const plan = buildLifecycleNotification({
      bug: { ID: bug.ID, ...bugInput }, status, changes,
      historyID, previousAssigneeUserID: recipient.ID
    })
    assert.equal(plan?.eventType || null, eventType, `${status} event type`)
    if (plan) {
      assert.equal(plan.emailRequired, emailRequired, `${status} channel`)
      assert.equal(plan.sourceKey, `STATUS:${historyID}:${plan.recipientID}`, `${status} source key`)
    }
  }

  console.log('My Notifications lifecycle event matrix: PASS')
}

main().catch(error => {
  console.error('My Notifications lifecycle event matrix: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
