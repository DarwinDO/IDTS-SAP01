'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')

const { getEmailConfig, normalizeEmailConfig } = require('../../srv/email/config')
const { sanitizeTransportError } = require('../../srv/email/outbox')
const { processEmailOutboxBatch } = require('../../srv/email/worker')
const { wrapEmailSenderForUat } = require('../../srv/email/uat-fault')

const TOKEN = 'UAT-EMAIL-002-FAIL'
const WORKER_TOKEN = 'UAT-EMAIL-002-WORKER'

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
