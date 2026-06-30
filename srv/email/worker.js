'use strict'

const cds = require('@sap/cds')

const { getEmailConfig } = require('./config')
const { processEmailDeliveries } = require('./outbox')
const { createSmtpSender } = require('./sender')

const LOG = cds.log('idts-email')
let job
let sender

function startEmailWorker () {
  if (job) return job

  const config = getEmailConfig()
  if (!config.enabled) {
    LOG.info('SMTP email delivery is disabled; new delivery rows will be marked SKIPPED.')
    return null
  }
  if (!config.ready) {
    LOG.warn(`SMTP email delivery is not configured; missing fields: ${config.missing.join(', ')}.`)
    return null
  }

  sender = createSmtpSender(config)
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
      LOG.info(`SMTP outbox processed: sent=${result.sent}, failed=${result.failed}.`)
    }
  })

  job.on('failed', error => {
    const code = error?.code ? ` code=${error.code}` : ''
    LOG.error(`SMTP outbox worker run failed.${code}`)
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
