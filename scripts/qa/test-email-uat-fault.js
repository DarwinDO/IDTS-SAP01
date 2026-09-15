'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { getEmailConfig, normalizeEmailConfig } = require('../../srv/email/config')
const {
  processEmailDeliveries,
  sanitizeTransportError,
  writeNotificationRecord
} = require('../../srv/email/outbox')
const { buildEmailMessage } = require('../../srv/email/template')
const { processEmailOutboxBatch } = require('../../srv/email/worker')
const { wrapEmailSenderForUat } = require('../../srv/email/uat-fault')

const TOKEN = 'UAT-EMAIL-002-FAIL'
const WORKER_TOKEN = 'UAT-EMAIL-002-WORKER'
const REAL_TOKEN = 'UAT-EMAIL-002-REAL'

function readyConfig (overrides = {}) {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    username: 'uat-test-user',
    password: 'uat-test-password',
    fromAddress: 'no-reply@example.test',
    uatFailureEnabled: true,
    uatFailureToken: TOKEN,
    ...overrides
  })
}

async function main () {
  const defaults = normalizeEmailConfig({})
  assert.equal(defaults.uatFailureEnabled, false, 'UAT failure seam is disabled by default')
  assert.equal(defaults.uatFailureToken, null, 'UAT failure token is absent by default')

  const previousEnabled = process.env.IDTS_EMAIL_UAT_FAILURE_ENABLED
  const previousToken = process.env.IDTS_EMAIL_UAT_FAILURE_TOKEN
  try {
    process.env.IDTS_EMAIL_UAT_FAILURE_ENABLED = 'true'
    process.env.IDTS_EMAIL_UAT_FAILURE_TOKEN = `  ${TOKEN}  `
    const runtimeConfig = getEmailConfig()
    assert.equal(runtimeConfig.uatFailureEnabled, true, 'the explicit runtime flag enables the seam')
    assert.equal(runtimeConfig.uatFailureToken, TOKEN, 'the runtime token is normalized before use')
  } finally {
    if (previousEnabled === undefined) delete process.env.IDTS_EMAIL_UAT_FAILURE_ENABLED
    else process.env.IDTS_EMAIL_UAT_FAILURE_ENABLED = previousEnabled
    if (previousToken === undefined) delete process.env.IDTS_EMAIL_UAT_FAILURE_TOKEN
    else process.env.IDTS_EMAIL_UAT_FAILURE_TOKEN = previousToken
  }

  let disabledCalls = 0
  const disabledSender = wrapEmailSenderForUat(readyConfig({ uatFailureEnabled: false }), async message => {
    disabledCalls += 1
    return { messageId: 'disabled-provider-result' }
  })
  const disabledResult = await disabledSender({ text: TOKEN })
  assert.equal(disabledCalls, 1, 'disabled seam passes the exact token to the provider')
  assert.equal(disabledResult.messageId, 'disabled-provider-result', 'disabled seam preserves the provider result')

  let providerCalls = 0
  const provider = async message => {
    providerCalls += 1
    return { messageId: `provider-${providerCalls}`, text: message.text }
  }
  const sender = wrapEmailSenderForUat(readyConfig(), provider)

  const nonmatchingResult = await sender({ text: 'ordinary notification', html: TOKEN })
  assert.equal(nonmatchingResult.messageId, 'provider-1', 'token outside message.text does not trigger the seam')
  assert.equal(providerCalls, 1, 'a nonmatching message reaches the provider')

  await assert.rejects(
    sender({ text: TOKEN }),
    error => error?.code === 'EMAIL_UAT_FORCED_FAILURE',
    'the first exact message.text match fails with the controlled code'
  )
  assert.equal(providerCalls, 1, 'the first exact match fails before the provider call')

  const secondMatchResult = await sender({ text: TOKEN })
  assert.equal(secondMatchResult.messageId, 'provider-2', 'the second exact match reaches the provider')
  assert.equal(providerCalls, 2, 'the seam is consumed after one forced failure')

  const secondWrapperResult = await wrapEmailSenderForUat(readyConfig(), provider)({ text: TOKEN })
  assert.equal(secondWrapperResult.messageId, 'provider-3', 'consumption survives a second wrapper in the same process')
  assert.equal(providerCalls, 3, 'the same token is not forced again by a later batch wrapper')

  let shortTokenCalls = 0
  const shortTokenSender = wrapEmailSenderForUat(readyConfig({ uatFailureToken: 'too-short' }), async message => {
    shortTokenCalls += 1
    return { messageId: message.text }
  })
  const shortTokenResult = await shortTokenSender({ text: 'too-short' })
  assert.equal(shortTokenCalls, 1, 'tokens shorter than 16 characters are ignored')
  assert.equal(shortTokenResult.messageId, 'too-short', 'short-token delivery passes through')

  const sanitized = sanitizeTransportError(Object.assign(new Error('raw controlled diagnostic'), {
    code: 'EMAIL_UAT_FORCED_FAILURE'
  }))
  assert.deepEqual(sanitized, {
    code: 'EMAIL_UAT_FORCED_FAILURE',
    summary: 'Email delivery failed in the controlled UAT check.'
  }, 'the controlled failure is mapped to a generic persisted summary')
  assert.doesNotMatch(JSON.stringify(sanitized), /raw controlled diagnostic|UAT-EMAIL-002-FAIL/)

  const realConfig = readyConfig({
    baseUrl: 'https://idts.example.test',
    uatFailureToken: REAL_TOKEN
  })
  const realTemplate = buildEmailMessage({
    notificationID: 'uat-real-template',
    recipientEmail: 'recipient@example.test',
    eventType: 'ASSIGNED',
    eventTypeName: 'Assigned',
    message: `Controlled notification ${REAL_TOKEN}`,
    bug: {
      ID: 'uat-real-bug',
      bugNumber: 'BUG-UAT-002',
      title: 'Controlled UAT title',
      statusName: 'Assigned',
      nextProcessorDisplayName: 'Controlled recipient'
    },
    config: realConfig
  })
  assert.ok(realTemplate.text.includes(REAL_TOKEN), 'the real template places the marker in message.text')
  assert.notEqual(realTemplate.text, REAL_TOKEN, 'the real template body is not the marker alone')

  let realProviderCalls = 0
  const realSender = wrapEmailSenderForUat(realConfig, async () => {
    realProviderCalls += 1
    return { messageId: `real-provider-${realProviderCalls}` }
  })
  await realSender({
    ...realTemplate,
    text: realTemplate.text.replace(REAL_TOKEN, REAL_TOKEN.slice(0, -1))
  })
  await realSender({
    ...realTemplate,
    text: realTemplate.text.replace(REAL_TOKEN, 'UAT-EMAIL-002-DIFFERENT')
  })
  await realSender({
    ...realTemplate,
    text: 'Ordinary notification',
    html: `<p>${REAL_TOKEN}</p>`
  })
  assert.equal(realProviderCalls, 3, 'partial, different, and HTML-only markers do not trigger the seam')

  const csn = await cds.load(['db/schema.cds', 'srv/service.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  const recipient = await db.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ active: true }))
  assert.ok(bug?.ID, 'real outbox fixture has a Bug')
  assert.ok(recipient?.ID, 'real outbox fixture has a recipient')

  const realRecord = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: `Controlled notification ${REAL_TOKEN}`
  }, realConfig))
  const realDeliveryBefore = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: realRecord.deliveryID })
  )
  assert.ok(realDeliveryBefore.textBody.includes(REAL_TOKEN), 'the persisted workflow body contains the marker')
  assert.notEqual(realDeliveryBefore.textBody, REAL_TOKEN, 'the persisted workflow body is not the marker alone')

  const providerCallsBeforeOutbox = realProviderCalls
  const firstRealResult = await processEmailDeliveries({
    tx: db,
    config: realConfig,
    sendMail: realSender,
    now: new Date('2026-09-15T00:00:00.000Z'),
    workerID: 'uat-real-first'
  })
  assert.deepEqual(firstRealResult, { sent: 0, failed: 1, skipped: 0 }, 'the first real notification body fails in the outbox')
  assert.equal(realProviderCalls, providerCallsBeforeOutbox, 'the first real body fails before the provider call')
  const failedRealDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: realRecord.deliveryID })
  )
  assert.equal(failedRealDelivery.status_code, 'FAILED')
  assert.equal(failedRealDelivery.attemptCount, 1)
  assert.equal(failedRealDelivery.lastErrorCode, 'EMAIL_UAT_FORCED_FAILURE')
  assert.equal(failedRealDelivery.lastErrorSummary, 'Email delivery failed in the controlled UAT check.')
  assert.ok(failedRealDelivery.nextAttemptAt)

  const secondRealResult = await processEmailDeliveries({
    tx: db,
    config: realConfig,
    sendMail: realSender,
    now: new Date('2026-09-15T00:01:00.000Z'),
    workerID: 'uat-real-second'
  })
  assert.deepEqual(secondRealResult, { sent: 1, failed: 0, skipped: 0 }, 'the same real notification body passes on the later attempt')
  assert.equal(realProviderCalls, providerCallsBeforeOutbox + 1, 'the later real body reaches the provider once')
  const sentRealDelivery = await db.run(
    SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: realRecord.deliveryID })
  )
  assert.equal(sentRealDelivery.status_code, 'SENT')
  assert.equal(sentRealDelivery.attemptCount, 2)
  assert.equal(sentRealDelivery.providerMessageId, 'real-provider-4')
  if (typeof db.disconnect === 'function') await db.disconnect()

  const references = {}
  let workerProviderCalls = 0
  const workerConfig = readyConfig({ uatFailureToken: WORKER_TOKEN })
  const workerResult = await processEmailOutboxBatch({
    tx: {},
    dependencies: {
      emailConfig: workerConfig,
      invitationConfig: { ready: true },
      createSender: () => ({
        sendMail: async message => {
          workerProviderCalls += 1
          return { messageId: `worker-provider-${workerProviderCalls}`, text: message.text }
        },
        close () {}
      }),
      processNotifications: async input => {
        references.notifications = input.sendMail
        return { sent: 0, failed: 0, skipped: 0 }
      },
      processInvitations: async input => {
        references.invitations = input.sendMail
        return { sent: 0, failed: 0, skipped: 0 }
      },
      processAccess: async input => {
        references.access = input.sendMail
        return { sent: 0, failed: 0, skipped: 0 }
      },
      processDigests: async input => {
        references.digests = input.sendMail
        return { sent: 0, failed: 0, skipped: 0 }
      }
    }
  })
  assert.deepEqual(workerResult, { sent: 0, failed: 0, skipped: 0 })
  assert.notEqual(references.notifications, references.invitations, 'notifications receive the isolated UAT wrapper')
  assert.equal(references.invitations, references.access, 'invitations retain the provider sender')
  assert.equal(references.access, references.digests, 'access and digests retain the provider sender')
  await assert.rejects(references.notifications({ text: WORKER_TOKEN }), error => error?.code === 'EMAIL_UAT_FORCED_FAILURE')
  await references.invitations({ text: WORKER_TOKEN })
  assert.equal(workerProviderCalls, 1, 'non-notification paths are not fault-injected')

  console.log('PASS: isolated email UAT failure seam contract')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
