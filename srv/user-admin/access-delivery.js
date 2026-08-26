'use strict'

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { formatFrom, retryDelayMs, sanitizeTransportError } = require('../email/outbox')
const { isSafeEmailAddress } = require('../email/config')

const DELIVERIES = 'idts.cap.UserAccessNotificationDeliveries'
const USERS = 'idts.cap.Users'

const ACCESS_EVENT_BY_ACTION = Object.freeze({
  CHANGE_ROLE: 'ACCESS_ROLE_CHANGED',
  SUSPEND: 'ACCESS_SUSPENDED',
  REACTIVATE: 'ACCESS_REACTIVATED',
  REVOKE: 'ACCESS_REVOKED'
})

const EVENT_LABELS = Object.freeze({
  ACCESS_ROLE_CHANGED: 'access changed',
  ACCESS_SUSPENDED: 'access suspended',
  ACCESS_REACTIVATED: 'access reactivated',
  ACCESS_REVOKED: 'access revoked'
})

function buildAccessDeliveryMessage ({ eventType, effectiveRole, effectiveAccessState, completedAt }, emailConfig) {
  const label = EVENT_LABELS[eventType] || 'access updated'
  const link = buildAccessApplicationLink(emailConfig?.baseUrl)
  const text = [
    `Your IDTS ${label}.`,
    `Effective role: ${effectiveRole || 'Unknown'}`,
    `Access state: ${effectiveAccessState || 'Unknown'}`,
    `Completed at: ${completedAt || 'Unknown'}`,
    `Open IDTS: ${link || 'Unavailable'}`
  ].join('\n')
  const html = `<!doctype html><html><body><p>Your IDTS ${escapeHtml(label)}.</p><p><strong>Effective role:</strong> ${escapeHtml(effectiveRole || 'Unknown')}</p><p><strong>Access state:</strong> ${escapeHtml(effectiveAccessState || 'Unknown')}</p><p><strong>Completed at:</strong> ${escapeHtml(completedAt || 'Unknown')}</p>${link ? `<p><a href="${escapeHtml(link)}">Open IDTS</a></p>` : ''}</body></html>`

  return {
    subject: `[IDTS] Your ${label}`,
    text,
    html,
    templateKey: `USER_ACCESS_${eventType}`
  }
}

async function writeUserAccessDelivery ({
  tx,
  auditEvent,
  targetUserID,
  eventType,
  effectiveRole,
  effectiveAccessState,
  completedAt,
  emailConfig
}) {
  const expectedEventType = ACCESS_EVENT_BY_ACTION[auditEvent?.action]
  if (!tx || !auditEvent?.ID || auditEvent.result !== 'APPLIED' || expectedEventType !== eventType) return { created: false }

  const existing = await tx.run(SELECT.one.from(DELIVERIES).where({ sourceAuditEvent_ID: auditEvent.ID }))
  if (existing) return { deliveryID: existing.ID, deliveryStatus: existing.status_code, created: false }

  const recipient = await tx.run(SELECT.one.from(USERS).columns('ID', 'email').where({ ID: targetUserID }))
  if (!recipient) return { created: false }

  const message = buildAccessDeliveryMessage({ eventType, effectiveRole, effectiveAccessState, completedAt }, emailConfig)
  const skipped = skippedAccessDeliveryReason(emailConfig, recipient.email, message)
  const deliveryID = cds.utils.uuid()
  await tx.run(INSERT.into(DELIVERIES).entries({
    ID: deliveryID,
    sourceAuditEvent_ID: auditEvent.ID,
    targetUser_ID: recipient.ID,
    recipientEmail: recipient.email || '',
    eventType,
    templateKey: message.templateKey,
    subject: message.subject,
    textBody: message.text,
    htmlBody: message.html,
    status_code: skipped ? 'SKIPPED' : 'PENDING',
    attemptCount: 0,
    lastErrorCode: skipped?.code || null,
    lastErrorSummary: skipped?.summary || null
  }))

  return { deliveryID, deliveryStatus: skipped ? 'SKIPPED' : 'PENDING', created: true }
}

async function processUserAccessDeliveries ({ tx, config, sendMail, now = new Date(), workerID = cds.utils.uuid() }) {
  if (!config?.ready || typeof sendMail !== 'function') return { sent: 0, failed: 0, skipped: 0 }

  const maxAttempts = config.maxRetryCount + 1
  const candidates = await tx.run(
    SELECT.from(DELIVERIES)
      .where({ status_code: { in: ['PENDING', 'FAILED'] } })
      .orderBy('createdAt asc')
      .limit(config.batchSize * 3)
  )
  const eligible = candidates
    .filter(row => Number(row.attemptCount || 0) < maxAttempts)
    .filter(row => !row.nextAttemptAt || new Date(row.nextAttemptAt) <= now)
    .filter(row => !row.lockedUntil || new Date(row.lockedUntil) <= now)
    .slice(0, config.batchSize)

  const result = { sent: 0, failed: 0, skipped: 0 }
  for (const delivery of eligible) {
    const lockToken = `${workerID}-${cds.utils.uuid()}`.slice(0, 64)
    const lockedUntil = new Date(now.getTime() + Math.max(config.pollIntervalMs * 4, 60000)).toISOString()
    const claimed = await tx.run(
      UPDATE(DELIVERIES).set({ lockToken, lockedUntil }).where({
        ID: delivery.ID,
        status_code: delivery.status_code,
        attemptCount: delivery.attemptCount,
        lockedUntil: delivery.lockedUntil || null
      })
    )
    if (!claimed) continue

    const attemptCount = Number(delivery.attemptCount || 0) + 1
    await tx.run(UPDATE(DELIVERIES).set({ attemptCount, lastAttemptAt: now.toISOString() }).where({ ID: delivery.ID, lockToken }))
    try {
      const providerResult = await sendMail({
        to: delivery.recipientEmail,
        from: formatFrom(config),
        replyTo: config.replyTo || undefined,
        subject: delivery.subject,
        text: delivery.textBody,
        html: delivery.htmlBody,
        headers: { 'X-IDTS-Access-Delivery-ID': delivery.ID }
      })
      await tx.run(UPDATE(DELIVERIES).set({
        status_code: 'SENT',
        sentAt: now.toISOString(),
        providerMessageId: providerResult?.messageId || null,
        nextAttemptAt: null,
        lastErrorCode: null,
        lastErrorSummary: null,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.sent += 1
    } catch (error) {
      const safeError = sanitizeTransportError(error)
      await tx.run(UPDATE(DELIVERIES).set({
        status_code: 'FAILED',
        nextAttemptAt: attemptCount < maxAttempts ? new Date(now.getTime() + retryDelayMs(attemptCount)).toISOString() : null,
        lastErrorCode: safeError.code,
        lastErrorSummary: safeError.summary,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.failed += 1
    }
  }
  return result
}

function skippedAccessDeliveryReason (config, recipientEmail, message) {
  if (!config?.enabled) return { code: 'EMAIL_DISABLED', summary: 'Email delivery is disabled.' }
  if (!config?.ready) return { code: 'EMAIL_CONFIG_INCOMPLETE', summary: 'Email delivery configuration is incomplete.' }
  if (!recipientEmail) return { code: 'RECIPIENT_EMAIL_MISSING', summary: 'Notification recipient has no email address.' }
  if (!isSafeEmailAddress(recipientEmail)) return { code: 'RECIPIENT_EMAIL_INVALID', summary: 'Notification recipient email is invalid.' }
  if (!message.text.includes('Open IDTS: https://')) return { code: 'EMAIL_BASE_URL_INVALID', summary: 'Email delivery application URL is invalid.' }
  return null
}

function buildAccessApplicationLink (baseUrl) {
  try {
    const url = new URL(String(baseUrl || ''))
    return url.protocol === 'https:' && !url.username && !url.password
      ? `${url.origin}/idtsbugmanagementui/index.html`
      : null
  } catch {
    return null
  }
}

function escapeHtml (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = {
  ACCESS_EVENT_BY_ACTION,
  buildAccessDeliveryMessage,
  processUserAccessDeliveries,
  writeUserAccessDelivery
}
