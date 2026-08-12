'use strict'

const cds = require('@sap/cds')

const { getEmailConfig } = require('./config')
const { processEmailDeliveries, writeNotificationRecord } = require('./outbox')
const { createEmailSender } = require('./sender')
const { getUserAdminConfig } = require('../user-admin/config')
const { processUserOnboardingDeliveries } = require('../user-admin/delivery')

const LOG = cds.log('idts-email')
const immediateKickRequests = new WeakSet()
let job
let sender

function shouldStartEmailWorker () {
  // Render keeps polling. SAP BTP sets `scheduler`, so the Job Scheduling
  // service invokes the protected CAP action instead of starting a timer.
  return String(process.env.IDTS_EMAIL_WORKER_MODE || 'poll').toLowerCase() !== 'scheduler'
}

async function processEmailOutboxBatch ({ tx, dependencies = {} }) {
  const config = dependencies.emailConfig || getEmailConfig()
  if (!config.enabled || !config.ready) {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const invitationConfig = dependencies.invitationConfig || getUserAdminConfig()
  const batchSender = (dependencies.createSender || createEmailSender)(config)
  const processNotifications = dependencies.processNotifications || processEmailDeliveries
  const processInvitations = dependencies.processInvitations || processUserOnboardingDeliveries
  const sendMail = message => batchSender.sendMail(message)
  try {
    const notifications = await processNotifications({
      tx,
      config,
      sendMail
    })
    const invitations = invitationConfig.ready
      ? await processInvitations({
          tx,
          emailConfig: config,
          invitationConfig,
          sendMail
        })
      : { sent: 0, failed: 0, skipped: 0 }
    return {
      sent: notifications.sent + invitations.sent,
      failed: notifications.failed + invitations.failed,
      skipped: notifications.skipped + invitations.skipped
    }
  } finally {
    batchSender.close()
  }
}

function scheduleImmediateEmailOutbox (req, dependencies = {}) {
  if (!req || typeof req.on !== 'function' || immediateKickRequests.has(req)) return false

  const spawn = dependencies.spawn || cds.spawn
  const processBatch = dependencies.processBatch || processEmailOutboxBatch
  immediateKickRequests.add(req)

  // Chỉ kick sau khi transaction nghiệp vụ commit; scheduler vẫn là lớp recovery bền vững.
  req.on('succeeded', () => {
    try {
      const immediateJob = spawn({ user: cds.User.privileged }, async tx => {
        const result = await processBatch({ tx })
        if (result.sent || result.failed) {
          LOG.info(`Email outbox processed immediately: sent=${result.sent}, failed=${result.failed}.`)
        }
        return result
      })
      immediateJob?.on?.('failed', error => logWorkerFailure('Immediate email outbox run failed.', error))
    } catch (error) {
      logWorkerFailure('Immediate email outbox could not start.', error)
    }
  })

  return true
}

async function writeNotificationAndSchedule (req, entry, dependencies = {}) {
  const tx = dependencies.tx || cds.tx(req)
  const config = dependencies.config || getEmailConfig()
  const writeRecord = dependencies.writeRecord || writeNotificationRecord
  const schedule = dependencies.schedule || scheduleImmediateEmailOutbox
  const result = await writeRecord(tx, entry, config)

  if (result.deliveryStatus === 'PENDING') schedule(req)
  return result
}

function logWorkerFailure (message, error) {
  const rawCode = String(error?.code || '')
  const code = /^[A-Z0-9_-]{1,80}$/i.test(rawCode) ? ` code=${rawCode}` : ''
  LOG.error(`${message}${code}`)
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
  const invitationConfig = getUserAdminConfig()
  job = cds.spawn({
    user: cds.User.privileged,
    every: config.pollIntervalMs
  }, async tx => {
    const result = await processEmailOutboxBatch({
      tx,
      dependencies: {
        emailConfig: config,
        invitationConfig,
        createSender: () => ({
          sendMail: message => sender.sendMail(message),
          close () {}
        })
      }
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
  scheduleImmediateEmailOutbox,
  shouldStartEmailWorker,
  startEmailWorker,
  writeNotificationAndSchedule
}
