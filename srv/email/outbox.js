// Học nhanh (DonHV): outbox claim delivery, gửi và cập nhật trạng thái. Đây là ranh giới giúp email failure không phá transaction Bug.
'use strict'

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { buildEmailMessage } = require('./template')
const { isSafeEmailAddress } = require('./config')

const ENTITIES = Object.freeze({
  Bugs: 'idts.cap.Bugs',
  Deliveries: 'idts.cap.NotificationDeliveries',
  EventTypes: 'idts.cap.NotificationEventTypes',
  Notifications: 'idts.cap.Notifications',
  StatusValues: 'idts.cap.StatusValues',
  Users: 'idts.cap.Users'
})

async function writeNotificationRecord (tx, entry, config) {
  // Workflow gọi trong transaction Bug: ghi Notifications và một delivery EMAIL duy nhất.
  // Hàm chỉ tạo outbox PENDING/SKIPPED, không gọi Brevo/SMTP nên lỗi provider không rollback Bug.
  if (!entry?.bugID || !entry?.recipientID || !entry?.eventType) return {}

  const notificationID = cds.utils.uuid()
  const deliveryID = cds.utils.uuid()
  const createdAt = new Date().toISOString()

  const [recipient, bug, eventType] = await Promise.all([
    tx.run(SELECT.one.from(ENTITIES.Users)
      .columns('ID', 'displayName', 'email', 'active')
      .where({ ID: entry.recipientID })),
    readBugEmailContext(tx, entry.bugID),
    tx.run(SELECT.one.from(ENTITIES.EventTypes)
      .columns('code', 'name')
      .where({ code: entry.eventType }))
  ])

  await tx.run(INSERT.into(ENTITIES.Notifications).entries({
    ID: notificationID,
    bug_ID: entry.bugID,
    recipient_ID: entry.recipientID,
    eventType_code: entry.eventType,
    channel_code: 'IN_APP',
    deliveryStatus_code: 'SENT',
    message: entry.message,
    sentAt: createdAt
  }))

  const recipientEmail = config?.testMode && config.defaultTestRecipient
    ? config.defaultTestRecipient
    : recipient?.email
  const email = buildEmailMessage({
    notificationID,
    recipientEmail,
    eventType: entry.eventType,
    eventTypeName: eventType?.name,
    message: entry.message,
    bug,
    config
  })
  const skip = skippedDeliveryReason(config, recipient)

  await tx.run(INSERT.into(ENTITIES.Deliveries).entries({
    ID: deliveryID,
    notification_ID: notificationID,
    channel_code: 'EMAIL',
    recipientEmail,
    templateKey: email.templateKey,
    subject: email.subject,
    textBody: email.text,
    htmlBody: email.html,
    status_code: skip ? 'SKIPPED' : 'PENDING',
    attemptCount: 0,
    lastErrorCode: skip?.code || null,
    lastErrorSummary: skip?.summary || null
  }))

  return { notificationID, deliveryID }
}

async function readBugEmailContext (tx, bugID) {
  // Đọc bugNumber/title/status/owner cần cho template; không lấy description/comment/attachment nhạy cảm.
  const bug = await tx.run(SELECT.one.from(ENTITIES.Bugs)
    .columns('ID', 'bugNumber', 'title', 'status_code', 'nextProcessorUser_ID')
    .where({ ID: bugID }))
  if (!bug) return null

  const [status, nextProcessor] = await Promise.all([
    bug.status_code
      ? tx.run(SELECT.one.from(ENTITIES.StatusValues).columns('name').where({ code: bug.status_code }))
      : null,
    bug.nextProcessorUser_ID
      ? tx.run(SELECT.one.from(ENTITIES.Users).columns('displayName').where({ ID: bug.nextProcessorUser_ID }))
      : null
  ])

  return {
    ...bug,
    statusName: status?.name,
    nextProcessorDisplayName: nextProcessor?.displayName
  }
}

function skippedDeliveryReason (config, recipient) {
  // Trả lý do SKIPPED khi email tắt, config thiếu hoặc recipient không hợp lệ/inactive.
  if (!config?.enabled) return { code: 'EMAIL_DISABLED', summary: 'Email delivery is disabled.' }
  if (!config.ready) return { code: 'EMAIL_CONFIG_INCOMPLETE', summary: 'Email delivery configuration is incomplete.' }
  if (!recipient) return { code: 'RECIPIENT_NOT_FOUND', summary: 'Notification recipient was not found.' }
  if (!recipient.active) return { code: 'RECIPIENT_INACTIVE', summary: 'Notification recipient is inactive.' }
  if (!recipient.email) return { code: 'RECIPIENT_EMAIL_MISSING', summary: 'Notification recipient has no email address.' }
  if (!isSafeEmailAddress(recipient.email)) return { code: 'RECIPIENT_EMAIL_INVALID', summary: 'Notification recipient email is invalid.' }
  return null
}

async function processEmailDeliveries ({ tx, config, sendMail, now = new Date(), workerID = cds.utils.uuid() }) {
  // Worker gọi theo batch: claim row đủ retry bằng lock token, gửi ngoài transaction claim,
  // rồi update SENT/FAILED và lịch retry. Breakpoint ở claim, `sendMail`, và update trạng thái.
  if (!config?.ready || typeof sendMail !== 'function') return { sent: 0, failed: 0, skipped: 0 }

  const maxAttempts = config.maxRetryCount + 1
  const candidates = await tx.run(
    SELECT.from(ENTITIES.Deliveries)
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
      UPDATE(ENTITIES.Deliveries)
        .set({ lockToken, lockedUntil })
        .where({
          ID: delivery.ID,
          status_code: delivery.status_code,
          attemptCount: delivery.attemptCount,
          lockedUntil: delivery.lockedUntil || null
        })
    )
    if (!claimed) continue

    const attemptCount = Number(delivery.attemptCount || 0) + 1
    const lastAttemptAt = now.toISOString()
    await tx.run(UPDATE(ENTITIES.Deliveries).set({ attemptCount, lastAttemptAt }).where({ ID: delivery.ID, lockToken }))

    try {
      const providerResult = await sendMail({
        to: delivery.recipientEmail,
        from: formatFrom(config),
        replyTo: config.replyTo || undefined,
        subject: delivery.subject,
        text: delivery.textBody,
        html: delivery.htmlBody,
        headers: { 'X-IDTS-Notification-ID': delivery.notification_ID }
      })
      await tx.run(UPDATE(ENTITIES.Deliveries).set({
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
      const retryAt = attemptCount < maxAttempts
        ? new Date(now.getTime() + retryDelayMs(attemptCount)).toISOString()
        : null
      await tx.run(UPDATE(ENTITIES.Deliveries).set({
        status_code: 'FAILED',
        nextAttemptAt: retryAt,
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

function formatFrom (config) {
  // Dựng header From từ name/address đã normalize; không đưa credential vào message.
  const safeName = String(config.fromName || 'IDTS').replace(/["\r\n]/g, '')
  return `"${safeName}" <${config.fromAddress}>`
}

function retryDelayMs (attemptCount) {
  // Backoff đơn giản theo số lần thử để provider lỗi không bị spam liên tục.
  return Math.min(60000 * (2 ** Math.max(attemptCount - 1, 0)), 15 * 60000)
}

function sanitizeTransportError (error) {
  // Chỉ lưu mã/tóm tắt đã làm sạch vào delivery; bỏ hostname, username, password và stack.
  const rawCode = String(error?.code || 'EMAIL_DELIVERY_FAILED')
  const code = /^[A-Z0-9_-]{1,80}$/i.test(rawCode) ? rawCode : 'EMAIL_DELIVERY_FAILED'
  const summaries = {
    BREVO_API_FAILED: 'Email provider API request failed.',
    BREVO_API_REJECTED: 'Email provider API rejected the message.',
    EAUTH: 'SMTP authentication failed.',
    ECONNECTION: 'SMTP connection failed.',
    ECONNREFUSED: 'SMTP connection was refused.',
    ESOCKET: 'SMTP connection failed.',
    ETIMEDOUT: 'SMTP connection timed out.'
  }
  return {
    code,
    summary: summaries[code] || 'Email delivery failed.'
  }
}

module.exports = {
  processEmailDeliveries,
  retryDelayMs,
  sanitizeTransportError,
  skippedDeliveryReason,
  writeNotificationRecord
}
