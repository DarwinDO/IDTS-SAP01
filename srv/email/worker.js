'use strict'

const cds = require('@sap/cds')

const { getEmailConfig } = require('./config')
const { processEmailDeliveries } = require('./outbox')
const { createEmailSender } = require('./sender')

const LOG = cds.log('idts-email')
let job
let sender

function shouldStartEmailWorker () {
  // Render keeps polling. SAP BTP sets `scheduler`, so the Job Scheduling
  // service invokes the protected CAP action instead of starting a timer.
  return String(process.env.IDTS_EMAIL_WORKER_MODE || 'poll').toLowerCase() !== 'scheduler'
}

async function processEmailOutboxBatch ({ tx }) {
  const config = getEmailConfig()
  if (!config.enabled || !config.ready) {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const batchSender = createEmailSender(config)
  try {
    return await processEmailDeliveries({
      tx,
      config,
      sendMail: message => batchSender.sendMail(message)
    })
  } finally {
    batchSender.close()
  }
}

function startEmailWorker () {
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
  processEmailOutboxBatch,
  shouldStartEmailWorker,
  startEmailWorker
}
