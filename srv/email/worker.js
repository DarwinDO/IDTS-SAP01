// Học nhanh (DonHV): worker chạy SAU transaction workflow. Email lỗi không được rollback việc assign/resolve/close bug.
'use strict'

const cds = require('@sap/cds')

const { getEmailConfig } = require('./config')
const { processEmailDeliveries } = require('./outbox')
const { createEmailSender } = require('./sender')

const LOG = cds.log('idts-email')
let job
let sender

function startEmailWorker () {
  // `service.js` gọi một lần khi startup. `cds.spawn` chạy poll định kỳ với transaction riêng,
  // đọc outbox qua `processEmailDeliveries`; email failure chỉ được log/schedule retry, không dừng CAP service.
  if (job) return job

  const config = getEmailConfig()
  if (!config.enabled) {
    LOG.info('Email delivery is disabled; new delivery rows will be marked SKIPPED.')
    return null
  }
  if (!config.ready) {
    LOG.warn(`Email delivery provider ${config.provider} is not configured; missing fields: ${config.missing.join(', ')}.`)
    return null
  }

  sender = createEmailSender(config)
  // `cds.spawn` tạo transaction riêng cho polling; breakpoint callback này khi delivery bị kẹt PENDING/FAILED.
  job = cds.spawn({
    user: cds.User.privileged,
    every: config.pollIntervalMs
  }, async tx => {
    const result = await processEmailDeliveries({
      tx,
      config,
      sendMail: message => sender.sendMail(message)
    })
    if (result.sent || result.failed) {
      LOG.info(`Email outbox processed via ${config.provider}: sent=${result.sent}, failed=${result.failed}.`)
    }
  })

  job.on('failed', error => {
    const code = error?.code ? ` code=${error.code}` : ''
    LOG.error(`Email outbox worker run failed.${code}`)
  })

  cds.once('shutdown', () => {
    if (job?.timer) clearInterval(job.timer)
    sender?.close()
    job = null
    sender = null
  })

  return job
}

module.exports = {
  startEmailWorker
}
