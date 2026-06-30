'use strict'

const assert = require('node:assert/strict')
const { SMTPServer } = require('smtp-server')

const { normalizeEmailConfig } = require('../../srv/email/config')
const { createSmtpSender } = require('../../srv/email/sender')

async function main () {
  let acceptedMessages = 0
  const server = new SMTPServer({
    disabledCommands: ['STARTTLS'],
    authOptional: false,
    onAuth (auth, session, callback) {
      if (auth.username === 'idts-test-user' && auth.password === 'idts-test-password') {
        return callback(null, { user: auth.username })
      }
      callback(new Error('Invalid test credentials'))
    },
    onData (stream, session, callback) {
      stream.on('data', () => {})
      stream.on('end', () => {
        acceptedMessages += 1
        callback(null)
      })
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const port = server.server.address().port
  const sender = createSmtpSender(normalizeEmailConfig({
    enabled: true,
    host: '127.0.0.1',
    port,
    secure: false,
    username: 'idts-test-user',
    password: 'idts-test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS SMTP Test',
    maxConnections: 2
  }))

  try {
    const result = await sender.sendMail({
      to: 'recipient@example.test',
      from: '"IDTS SMTP Test" <no-reply@example.test>',
      subject: '[IDTS] SMTP integration test',
      text: 'SMTP integration test',
      html: '<p>SMTP integration test</p>',
      headers: { 'X-IDTS-Notification-ID': 'smtp-integration-test' }
    })
    assert.ok(result.messageId)
    assert.equal(acceptedMessages, 1)
    console.log('IDTS-36 local SMTP integration check: PASS')
  } finally {
    sender.close()
    await new Promise(resolve => server.close(resolve))
  }
}

main().catch(error => {
  console.error('IDTS-36 local SMTP integration check: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
