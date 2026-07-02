'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { buildEmailMessage } = require('../../srv/email/template')
const {
  processEmailDeliveries,
  sanitizeTransportError,
  writeNotificationRecord
} = require('../../srv/email/outbox')

const INACTIVE_USER_ID = '99000000-0000-0000-0000-000000000036'

function enabledConfig (overrides = {}) {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    secure: false,
    username: 'idts-test-user',
    password: 'idts-test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test',
    maxRetryCount: 2,
    batchSize: 10,
    pollIntervalMs: 15000,
    maxConnections: 3,
    ...overrides
  })
}

async function main () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID', 'bugNumber', 'title'))
  const recipient = await db.run(
    SELECT.one.from('idts.cap.Users').columns('ID', 'email', 'displayName', 'active').where({ active: true })
  )

  assert.ok(bug?.ID, 'seed bug is available')
  assert.ok(recipient?.ID, 'seed recipient is available')

  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: INACTIVE_USER_ID,
    displayName: 'Inactive Email User',
    email: 'inactive-email@example.test',
    role_code: 'TESTER',
    active: false
  }))

  const disabled = normalizeEmailConfig({ enabled: false })
  assert.equal(disabled.enabled, false)
  assert.equal(disabled.ready, false)

  const invalidReplyTo = enabledConfig({ replyTo: '<optional-reply-to@example.test>' })
  assert.equal(invalidReplyTo.ready, false)
  assert.ok(invalidReplyTo.missing.includes('replyTo'))

  const validReplyTo = enabledConfig({ replyTo: 'reply@example.test' })
  assert.equal(validReplyTo.ready, true)
  assert.equal(validReplyTo.replyTo, 'reply@example.test')

  const escaped = buildEmailMessage({
    notificationID: 'notification-template-test',
    recipientEmail: recipient.email,
    eventType: 'ASSIGNED',
    eventTypeName: 'Assigned',
    message: '<script>alert("x")</script>',
    bug: {
      ID: bug.ID,
      bugNumber: bug.bugNumber,
      title: '<b>Unsafe title</b>',
      statusName: 'Assigned',
      nextProcessorDisplayName: 'Developer <One>'
    },
    config: enabledConfig({ baseUrl: 'https://idts.example.test' })
  })
  assert.match(escaped.html, /&lt;b&gt;Unsafe title&lt;\/b&gt;/)
  assert.doesNotMatch(escaped.html, /<script>/)
  assert.match(escaped.text, /Unsafe title/)

  const pending = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Pending delivery test.'
  }, enabledConfig()))

  const inApp = await db.run(SELECT.one.from('idts.cap.Notifications').where({ ID: pending.notificationID }))
  const pendingDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: pending.deliveryID })
  )
  assert.equal(inApp.channel_code, 'IN_APP')
  assert.equal(inApp.deliveryStatus_code, 'SENT')
  assert.ok(inApp.sentAt)
  assert.equal(pendingDelivery.channel_code, 'EMAIL')
  assert.equal(pendingDelivery.status_code, 'PENDING')
  assert.equal(pendingDelivery.attemptCount, 0)

  const skippedDisabled = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'UPDATED',
    message: 'Disabled delivery test.'
  }, disabled))
  const disabledDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: skippedDisabled.deliveryID })
  )
  assert.equal(disabledDelivery.status_code, 'SKIPPED')
  assert.equal(disabledDelivery.lastErrorCode, 'EMAIL_DISABLED')

  const skippedInactive = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: INACTIVE_USER_ID,
    eventType: 'UPDATED',
    message: 'Inactive recipient test.'
  }, enabledConfig()))
  const inactiveDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: skippedInactive.deliveryID })
  )
  assert.equal(inactiveDelivery.status_code, 'SKIPPED')
  assert.equal(inactiveDelivery.lastErrorCode, 'RECIPIENT_INACTIVE')

  const sent = []
  await processEmailDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async message => {
      sent.push(message)
      return { messageId: 'smtp-message-success' }
    },
    now: new Date('2026-06-30T00:00:00.000Z'),
    workerID: 'test-success-worker'
  })
  const sentDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: pending.deliveryID })
  )
  assert.equal(sent.length, 1)
  assert.equal(sentDelivery.status_code, 'SENT')
  assert.equal(sentDelivery.attemptCount, 1)
  assert.equal(sentDelivery.providerMessageId, 'smtp-message-success')
  assert.ok(sentDelivery.sentAt)

  const failing = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'REJECTED',
    message: 'Failure and retry test.'
  }, enabledConfig()))

  const secretBearingError = new Error('connect failed smtp.private.local idts-test-password')
  secretBearingError.code = 'ESOCKET'
  await processEmailDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async () => { throw secretBearingError },
    now: new Date('2026-06-30T01:00:00.000Z'),
    workerID: 'test-failure-worker'
  })
  const failedDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: failing.deliveryID })
  )
  assert.equal(failedDelivery.status_code, 'FAILED')
  assert.equal(failedDelivery.attemptCount, 1)
  assert.equal(failedDelivery.lastErrorCode, 'ESOCKET')
  assert.doesNotMatch(failedDelivery.lastErrorSummary, /smtp\.private\.local|idts-test-password/)
  assert.ok(failedDelivery.nextAttemptAt)

  await db.run(UPDATE('idts.cap.NotificationDeliveries').set({
    nextAttemptAt: '2026-06-30T00:59:00.000Z'
  }).where({ ID: failing.deliveryID }))
  await processEmailDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async () => ({ messageId: 'smtp-message-retry' }),
    now: new Date('2026-06-30T01:01:00.000Z'),
    workerID: 'test-retry-worker'
  })
  const retriedDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: failing.deliveryID })
  )
  assert.equal(retriedDelivery.status_code, 'SENT')
  assert.equal(retriedDelivery.attemptCount, 2)
  assert.equal(retriedDelivery.providerMessageId, 'smtp-message-retry')

  cds.env.idts.email.enabled = false
  const service = await cds.serve('BugService').from(csn)
  const authenticatedUser = new cds.User({ id: recipient.email, roles: ['authenticated-user', 'TESTER'] })
  const exposedRows = await service.tx({ user: authenticatedUser }, tx =>
    tx.run(SELECT.from(service.entities.NotificationDeliveries))
  )
  assert.ok(Array.isArray(exposedRows))
  assert.ok(exposedRows.length >= 4)
  assert.equal(Object.hasOwn(exposedRows[0], 'textBody'), false)
  assert.equal(Object.hasOwn(exposedRows[0], 'htmlBody'), false)

  await assert.rejects(service.tx({ user: authenticatedUser }, tx =>
    tx.create(service.entities.NotificationDeliveries).entries({
      recipientEmail: 'blocked-write@example.test',
      templateKey: 'BLOCKED',
      subject: 'Blocked write'
    })
  ), error => {
    const code = Number(error.code || error.status)
    return code === 405 || String(error).includes('DRAFT_MODIFICATION_ONLY_VIA_ROOT')
  })

  await assert.rejects(service.tx({ user: cds.User.anonymous }, tx =>
    tx.run(SELECT.from(service.entities.NotificationDeliveries))
  ))

  await assert.rejects(
    db.run(INSERT.into('idts.cap.NotificationDeliveries').entries({
      ...pendingDelivery,
      ID: cds.utils.uuid()
    })),
    /unique|constraint/i
  )

  const rollbackMessage = `Rollback-${cds.utils.uuid()}`
  await assert.rejects(db.tx(async tx => {
    await writeNotificationRecord(tx, {
      bugID: bug.ID,
      recipientID: recipient.ID,
      eventType: 'UPDATED',
      message: rollbackMessage
    }, enabledConfig())
    throw new Error('ROLLBACK_TEST')
  }), /ROLLBACK_TEST/)
  const rolledBack = await db.run(
    SELECT.one.from('idts.cap.Notifications').where({ message: rollbackMessage })
  )
  assert.equal(rolledBack, undefined)

  const safeError = sanitizeTransportError(secretBearingError)
  assert.deepEqual(safeError, {
    code: 'ESOCKET',
    summary: 'SMTP connection failed.'
  })

  console.log('IDTS-36 email outbox programmatic checks: PASS')
}

main().catch(error => {
  console.error('IDTS-36 email outbox programmatic checks: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
