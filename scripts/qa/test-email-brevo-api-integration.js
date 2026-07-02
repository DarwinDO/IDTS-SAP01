'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const http = require('node:http')

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { processEmailDeliveries } = require('../../srv/email/outbox')
const { createBrevoApiSender } = require('../../srv/email/sender')

async function main () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const requests = []
  let forceFailure = false
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      requests.push({
        method: req.method,
        url: req.url,
        apiKeyPresent: Boolean(req.headers['api-key']),
        body: JSON.parse(body || '{}')
      })

      res.setHeader('content-type', 'application/json')
      if (forceFailure) {
        res.statusCode = 500
        res.end(JSON.stringify({ code: 'internal_error', message: 'simulated provider failure' }))
      } else {
        res.statusCode = 201
        res.end(JSON.stringify({ messageId: 'brevo-api-message-success' }))
      }
    })
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const endpoint = `http://127.0.0.1:${server.address().port}/v3/smtp/email`
  const config = normalizeEmailConfig({
    enabled: true,
    provider: 'brevo-api',
    brevoApiKey: 'test-api-key-not-real',
    brevoApiEndpoint: endpoint,
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS API Test',
    maxRetryCount: 2,
    batchSize: 10,
    pollIntervalMs: 15000
  })
  assert.equal(config.ready, true)
  assert.equal(config.provider, 'brevo-api')

  const sender = createBrevoApiSender(config)

  try {
    const direct = await sender.sendMail({
      to: 'recipient@example.test',
      from: '"IDTS API Test" <no-reply@example.test>',
      replyTo: 'reply@example.test',
      subject: '[IDTS] Brevo API integration test',
      text: 'Plain text',
      html: '<p>Plain text</p>',
      headers: { 'X-IDTS-Notification-ID': 'brevo-api-direct-test' }
    })
    assert.equal(direct.messageId, 'brevo-api-message-success')
    assert.equal(requests[0].method, 'POST')
    assert.equal(requests[0].apiKeyPresent, true)
    assert.equal(requests[0].body.sender.email, 'no-reply@example.test')
    assert.equal(requests[0].body.to[0].email, 'recipient@example.test')
    assert.equal(requests[0].body.headers['X-IDTS-Notification-ID'], 'brevo-api-direct-test')

    const user = await db.run(SELECT.one.from('idts.cap.Users').columns('ID', 'email').where({ active: true }))
    const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
    assert.ok(bug?.ID, 'seed bug is available for Brevo API outbox integration')
    const notificationID = cds.utils.uuid()
    const deliveryID = cds.utils.uuid()
    await db.run(INSERT.into('idts.cap.Notifications').entries({
      ID: notificationID,
      bug_ID: bug.ID,
      recipient_ID: user.ID,
      eventType_code: 'UPDATED',
      channel_code: 'IN_APP',
      deliveryStatus_code: 'SENT',
      message: 'Brevo API outbox success test.',
      sentAt: '2026-07-02T00:00:00.000Z'
    }))
    await db.run(INSERT.into('idts.cap.NotificationDeliveries').entries({
      ID: deliveryID,
      notification_ID: notificationID,
      channel_code: 'EMAIL',
      recipientEmail: user.email,
      templateKey: 'BREVO_API_TEST',
      subject: 'Brevo API outbox success',
      textBody: 'Brevo API outbox success',
      htmlBody: '<p>Brevo API outbox success</p>',
      status_code: 'PENDING',
      attemptCount: 0
    }))

    await processEmailDeliveries({
      tx: db,
      config,
      sendMail: message => sender.sendMail(message),
      now: new Date('2026-07-02T01:00:00.000Z'),
      workerID: 'brevo-api-success-worker'
    })
    const sentDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: deliveryID }))
    assert.equal(sentDelivery.status_code, 'SENT')
    assert.equal(sentDelivery.providerMessageId, 'brevo-api-message-success')
    assert.equal(sentDelivery.attemptCount, 1)
    assert.ok(sentDelivery.sentAt)

    forceFailure = true
    const failedNotificationID = cds.utils.uuid()
    const failedDeliveryID = cds.utils.uuid()
    await db.run(INSERT.into('idts.cap.Notifications').entries({
      ID: failedNotificationID,
      bug_ID: bug.ID,
      recipient_ID: user.ID,
      eventType_code: 'UPDATED',
      channel_code: 'IN_APP',
      deliveryStatus_code: 'SENT',
      message: 'Brevo API outbox failure test.',
      sentAt: '2026-07-02T00:00:00.000Z'
    }))
    await db.run(INSERT.into('idts.cap.NotificationDeliveries').entries({
      ID: failedDeliveryID,
      notification_ID: failedNotificationID,
      channel_code: 'EMAIL',
      recipientEmail: user.email,
      templateKey: 'BREVO_API_TEST',
      subject: 'Brevo API outbox failure',
      textBody: 'Brevo API outbox failure',
      htmlBody: '<p>Brevo API outbox failure</p>',
      status_code: 'PENDING',
      attemptCount: 0
    }))

    await processEmailDeliveries({
      tx: db,
      config,
      sendMail: message => sender.sendMail(message),
      now: new Date('2026-07-02T02:00:00.000Z'),
      workerID: 'brevo-api-failure-worker'
    })
    const failedDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ ID: failedDeliveryID }))
    assert.equal(failedDelivery.status_code, 'FAILED')
    assert.equal(failedDelivery.lastErrorCode, 'BREVO_API_FAILED')
    assert.equal(failedDelivery.lastErrorSummary, 'Email provider API request failed.')
    assert.ok(failedDelivery.nextAttemptAt)

    console.log('IDTS-48 Brevo API integration check: PASS')
  } finally {
    sender.close()
    await new Promise(resolve => server.close(resolve))
  }
}

main().catch(error => {
  console.error('IDTS-48 Brevo API integration check: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
