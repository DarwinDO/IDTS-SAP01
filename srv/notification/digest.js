'use strict'

// Học nhanh (DonHV): snapshot digest đọc Bug hiện tại; email worker hiện có mới claim và gửi payload đã lưu.

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { STATUS } = require('../bug-service/constants')
const { getEmailConfig, isSafeEmailAddress } = require('../email/config')
const { buildBugLink, escapeHtml } = require('../email/template')
const {
  formatFrom,
  retryDelayMs,
  sanitizeTransportError
} = require('../email/outbox')

const BUGS = 'idts.cap.Bugs'
const USERS = 'idts.cap.Users'
const PROFILES = 'idts.cap.DeveloperProfiles'
const DIGESTS = 'idts.cap.NotificationDigestDeliveries'
const BANGKOK = 'Asia/Bangkok'
const DIGEST_TYPE = 'DAILY'
const DEFAULT_LIMIT = 20
const DIGEST_QUERY_LIMIT = 5000
const DIGEST_ROLES = new Set(['PM', 'DEVELOPER', 'TESTER'])
const PRIORITY_RANK = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 })
const SEVERITY_RANK = Object.freeze({ MINOR: 1, MAJOR: 2, CRITICAL: 3, BLOCKER: 4 })
const COMPLETED_STATUSES = new Set([STATUS.CLOSED])
const APP_PATH = '/idtsbugmanagementui/index.html'

async function buildDigestSnapshot ({ tx, recipient, businessDate, snapshotAt, limit = DEFAULT_LIMIT } = {}) {
  if (!tx || typeof tx.run !== 'function') throw digestError(500, 'DIGEST_TRANSACTION_REQUIRED', 'A CAP transaction is required.')

  const instant = normalizeInstant(snapshotAt)
  const date = normalizeBusinessDate(businessDate || bangkokDate(instant))
  const actor = await readRecipient(tx, recipient)
  if (!actor?.ID || !actor.active || !DIGEST_ROLES.has(String(actor.role_code || '').toUpperCase())) return null

  const role = String(actor.role_code).toUpperCase()
  const profileIDs = role === 'PM' ? new Set() : await readActiveProfileIDs(tx, actor.ID)
  const bugs = await tx.run(
    SELECT.from(BUGS)
      .columns(
        'ID', 'bugNumber', 'title', 'status_code', 'priority_code', 'severity_code',
        'createdAt', 'dueDate', 'nextProcessorUser_ID', 'retestOwner_ID', 'assignee_ID'
      )
      .where`status_code != ${STATUS.CLOSED} and createdAt <= ${instant.toISOString()}`
      .orderBy('ID asc')
      .limit(DIGEST_QUERY_LIMIT)
  )

  const items = bugs
    .map(bug => digestItemFor({ bug, role, recipientID: actor.ID, profileIDs, businessDate: date, snapshotAt: instant }))
    .filter(Boolean)
    .sort(compareDigestItems)

  if (!items.length) return null

  const safeLimit = normalizeLimit(limit)
  const renderedItems = items.slice(0, safeLimit)
  const remainder = Math.max(items.length - renderedItems.length, 0)
  const config = getEmailConfig()
  const appBase = allowlistedAppBase(config?.baseUrl)
  const subject = `[IDTS] Daily notification digest - ${date}`
  const textLines = [
    `IDTS daily notification digest for ${date}`,
    `Items: ${items.length}`,
    ...renderedItems.map((item, index) => `${index + 1}. ${safeText(item.bugNumber, 'Bug')} - ${safeText(item.title, 'Untitled bug')} [${item.priority}] (${item.reason}) ${buildBugLink(appBase, item.ID)}`)
  ]
  if (remainder) textLines.push(`and ${remainder} more - Open filtered queue: ${buildQueueLink(appBase, role)}`)

  const htmlItems = renderedItems.map(item => {
    const link = buildBugLink(appBase, item.ID)
    return `<li style="margin:0 0 10px;"><a href="${escapeHtml(link)}" style="color:#0a6ed1;">${escapeHtml(safeText(item.bugNumber, 'Bug'))}</a> - ${escapeHtml(safeText(item.title, 'Untitled bug'))} <span style="color:#556b82;">[${escapeHtml(item.priority)}] ${escapeHtml(item.reason)}</span></li>`
  }).join('')
  const moreHtml = remainder
    ? `<p style="margin:16px 0 0;color:#556b82;">and ${remainder} more - <a href="${escapeHtml(buildQueueLink(appBase, role))}" style="color:#0a6ed1;">Open filtered queue</a></p>`
    : ''
  const htmlBody = [
    '<div style="margin:0;padding:24px;background:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#223548;">',
    '  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d9e2ec;border-radius:8px;overflow:hidden;">',
    `    <div style="padding:18px 24px;background:#0a6ed1;color:#ffffff;"><h1 style="margin:0;font-size:20px;line-height:28px;">${escapeHtml(subject)}</h1></div>`,
    `    <div style="padding:22px 24px;"><p style="margin:0 0 16px;font-size:15px;line-height:22px;">${items.length} actionable item${items.length === 1 ? '' : 's'}.</p><ol style="margin:0;padding-left:24px;">${htmlItems}</ol>${moreHtml}</div>`,
    '    <div style="padding:14px 24px;background:#f7f9fb;color:#6a7d90;font-size:12px;line-height:18px;">This is an automated IDTS digest. Open IDTS for full Bug details.</div>',
    '  </div>',
    '</div>'
  ].join('')

  return {
    recipientID: actor.ID,
    businessDate: date,
    digestType: DIGEST_TYPE,
    windowStart: bangkokMidnight(date),
    windowEnd: instant.toISOString(),
    snapshotAt: instant.toISOString(),
    itemCount: items.length,
    items: renderedItems,
    subject,
    textBody: textLines.join('\n'),
    htmlBody
  }
}

async function scheduleNotificationDigests ({ tx, now = new Date() } = {}) {
  if (!tx || typeof tx.run !== 'function') throw digestError(500, 'DIGEST_TRANSACTION_REQUIRED', 'A CAP transaction is required.')
  const instant = normalizeInstant(now)
  if (!isDigestScheduleDue(instant)) return { created: 0, reused: 0, skipped: 0 }

  const businessDate = bangkokDate(instant)
  const users = await tx.run(
    SELECT.from(USERS)
      .columns('ID', 'displayName', 'email', 'role_code', 'active')
      .where({ active: true, role_code: { in: [...DIGEST_ROLES] } })
      .orderBy('ID asc')
      .limit(1000)
  )
  const result = { created: 0, reused: 0, skipped: 0 }
  for (const recipient of users) {
    const existing = await tx.run(SELECT.one.from(DIGESTS).columns('ID').where({
      recipient_ID: recipient.ID,
      businessDate,
      digestType: DIGEST_TYPE
    }))
    if (existing?.ID) {
      result.reused += 1
      continue
    }

    const snapshot = await buildDigestSnapshot({
      tx,
      recipient,
      businessDate,
      snapshotAt: instant,
      limit: DEFAULT_LIMIT
    })
    if (!snapshot) {
      result.skipped += 1
      continue
    }

    const delivery = await insertDigestDelivery(tx, snapshot)
    if (delivery.reused) result.reused += 1
    else result.created += 1
  }
  return result
}

async function processNotificationDigestDeliveries ({ tx, config, sendMail, now = new Date(), workerID = cds.utils.uuid() } = {}) {
  if (!config?.ready || typeof sendMail !== 'function' || !tx || typeof tx.run !== 'function') {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const instant = normalizeInstant(now)
  const maxAttempts = config.maxRetryCount + 1
  const candidates = await tx.run(
    SELECT.from(DIGESTS)
      .where({ status_code: { in: ['PENDING', 'FAILED'] } })
      .orderBy('createdAt asc')
      .limit(config.batchSize * 3)
  )
  const today = bangkokDate(instant)
  const eligible = candidates
    .filter(row => !row.businessDate || String(row.businessDate).slice(0, 10) <= today)
    .filter(row => Number(row.attemptCount || 0) < maxAttempts)
    .filter(row => !row.nextAttemptAt || new Date(row.nextAttemptAt) <= instant)
    .filter(row => !row.lockedUntil || new Date(row.lockedUntil) <= instant)
    .slice(0, config.batchSize)

  const recipientIDs = [...new Set(eligible.map(row => row.recipient_ID).filter(Boolean))]
  const recipients = recipientIDs.length
    ? await tx.run(SELECT.from(USERS).columns('ID', 'email', 'active').where({ ID: { in: recipientIDs } }).limit(1000))
    : []
  const recipientByID = new Map(recipients.map(row => [row.ID, row]))
  const result = { sent: 0, failed: 0, skipped: 0 }

  for (const delivery of eligible) {
    const lockToken = `${workerID}-${cds.utils.uuid()}`.slice(0, 64)
    const lockedUntil = new Date(instant.getTime() + Math.max(config.pollIntervalMs * 4, 60000)).toISOString()
    const claimed = await tx.run(
      UPDATE(DIGESTS)
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
    await tx.run(UPDATE(DIGESTS).set({
      attemptCount,
      lastAttemptAt: instant.toISOString()
    }).where({ ID: delivery.ID, lockToken }))

    const recipient = recipientByID.get(delivery.recipient_ID)
    if (!recipient?.active || !isSafeEmailAddress(recipient.email)) {
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'SKIPPED',
        lastErrorCode: recipient ? 'RECIPIENT_EMAIL_INVALID' : 'RECIPIENT_NOT_FOUND',
        lastErrorSummary: recipient ? 'Digest recipient email is invalid.' : 'Digest recipient was not found.',
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      result.skipped += 1
      continue
    }

    try {
      const providerResult = await sendMail({
        to: recipient.email,
        from: formatFrom(config),
        replyTo: config.replyTo || undefined,
        subject: delivery.subject,
        text: delivery.textBody,
        html: delivery.htmlBody,
        headers: {
          'X-IDTS-Digest-ID': delivery.ID,
          'X-IDTS-Digest-Type': delivery.digestType
        }
      })
      await tx.run(UPDATE(DIGESTS).set({
        status_code: 'SENT',
        sentAt: instant.toISOString(),
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
        ? new Date(instant.getTime() + retryDelayMs(attemptCount)).toISOString()
        : null
      await tx.run(UPDATE(DIGESTS).set({
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

async function insertDigestDelivery (tx, snapshot) {
  const deliveryID = cds.utils.uuid()
  const entry = {
    ID: deliveryID,
    recipient_ID: snapshot.recipientID,
    businessDate: snapshot.businessDate,
    digestType: snapshot.digestType,
    windowStart: snapshot.windowStart,
    windowEnd: snapshot.windowEnd,
    snapshotAt: snapshot.snapshotAt,
    itemCount: snapshot.itemCount,
    subject: snapshot.subject,
    textBody: snapshot.textBody,
    htmlBody: snapshot.htmlBody,
    status_code: 'PENDING',
    attemptCount: 0
  }
  try {
    await tx.run(INSERT.into(DIGESTS).entries(entry))
    return { ID: deliveryID, reused: false }
  } catch (error) {
    if (!isDigestUniqueViolation(error)) throw error
    const existing = await tx.run(SELECT.one.from(DIGESTS).columns('ID').where({
      recipient_ID: snapshot.recipientID,
      businessDate: snapshot.businessDate,
      digestType: snapshot.digestType
    }))
    if (!existing?.ID) throw error
    return { ID: existing.ID, reused: true }
  }
}

async function readRecipient (tx, recipient) {
  const recipientID = typeof recipient === 'string' ? recipient : recipient?.ID || recipient?.id
  if (!recipientID) return null
  const row = await tx.run(SELECT.one.from(USERS).columns('ID', 'role_code', 'active').where({ ID: recipientID }))
  if (!row) return null
  return row
}

async function readActiveProfileIDs (tx, userID) {
  const rows = await tx.run(SELECT.from(PROFILES).columns('ID').where({ user_ID: userID, active: true }).limit(100))
  return new Set(rows.map(row => row.ID).filter(Boolean))
}

function digestItemFor ({ bug, role, recipientID, profileIDs, businessDate, snapshotAt }) {
  if (!bug?.ID || COMPLETED_STATUSES.has(bug.status_code)) return null
  const createdAt = new Date(bug.createdAt)
  if (Number.isNaN(createdAt.getTime()) || createdAt > snapshotAt) return null

  const overdue = isOverdue(bug, businessDate)
  const urgent = isUrgent(bug)
  const pending = bug.status_code === STATUS.PENDING_ASSIGNMENT
  const slaBreached = pending && isSlaBreached(bug, snapshotAt)
  const awaiting = bug.nextProcessorUser_ID === recipientID || bug.retestOwner_ID === recipientID
  const assigned = profileIDs.has(bug.assignee_ID)
  const reasons = []

  if (role === 'PM') {
    if (pending) reasons.push('Pending Assignment')
    if (overdue) reasons.push('Overdue')
    if (slaBreached) reasons.push('SLA breached')
    if (urgent && !new Set([STATUS.CLOSED, STATUS.RESOLVED]).has(bug.status_code)) reasons.push('Critical/Blocker')
  } else {
    if (overdue && (assigned || awaiting)) reasons.push('Overdue')
    if (awaiting) reasons.push('Awaiting your action')
  }
  if (!reasons.length) return null

  return {
    ID: bug.ID,
    bugNumber: bug.bugNumber || 'Bug',
    title: bug.title || 'Untitled bug',
    priority: safeCode(bug.priority_code, 'LOW'),
    severity: safeCode(bug.severity_code, 'MINOR'),
    reason: [...new Set(reasons)].join(' / '),
    dueDate: bug.dueDate ? String(bug.dueDate).slice(0, 10) : null,
    createdAt: createdAt.toISOString()
  }
}

function compareDigestItems (left, right) {
  return (PRIORITY_RANK[right.priority] || 0) - (PRIORITY_RANK[left.priority] || 0) ||
    (SEVERITY_RANK[right.severity] || 0) - (SEVERITY_RANK[left.severity] || 0) ||
    Number(Boolean(right.dueDate)) - Number(Boolean(left.dueDate)) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.ID.localeCompare(right.ID)
}

function isSlaBreached (bug, snapshotAt) {
  const createdAt = new Date(bug.createdAt)
  const thresholdHours = isUrgent(bug) ? 4 : 24
  return !Number.isNaN(createdAt.getTime()) && snapshotAt.getTime() - createdAt.getTime() >= thresholdHours * 60 * 60 * 1000
}

function isOverdue (bug, businessDate) {
  return bug.status_code !== STATUS.CLOSED && bug.dueDate && String(bug.dueDate).slice(0, 10) < businessDate
}

function isUrgent (bug) {
  return bug.priority_code === 'CRITICAL' || bug.severity_code === 'CRITICAL' || bug.severity_code === 'BLOCKER'
}

function isDigestScheduleDue (value) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(normalizeInstant(value))
  const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return !['Sat', 'Sun'].includes(values.weekday) && values.hour === '08' && values.minute === '00'
}

function bangkokDate (value) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK }).format(normalizeInstant(value))
}

function bangkokMidnight (businessDate) {
  return new Date(`${businessDate}T00:00:00+07:00`).toISOString()
}

function allowlistedAppBase (baseUrl) {
  try {
    const parsed = new URL(String(baseUrl || ''))
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported app URL protocol')
    return `${parsed.origin}${APP_PATH}`
  } catch {
    return APP_PATH
  }
}

function buildQueueLink (appBase, role) {
  const filter = role === 'PM' ? 'digest-pm' : 'digest-my-action'
  return `${appBase}#/Bugs?filter=${encodeURIComponent(filter)}`
}

function safeText (value, fallback = '') {
  const text = String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return text || fallback
}

function safeCode (value, fallback) {
  const code = String(value || '').toUpperCase()
  return Object.prototype.hasOwnProperty.call(PRIORITY_RANK, code) || Object.prototype.hasOwnProperty.call(SEVERITY_RANK, code)
    ? code
    : fallback
}

function normalizeLimit (value) {
  const limit = Number(value)
  return Number.isInteger(limit) && limit > 0 ? Math.min(limit, DEFAULT_LIMIT) : DEFAULT_LIMIT
}

function normalizeBusinessDate (value) {
  const date = String(value || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw digestError(400, 'INVALID_DIGEST_DATE', 'Digest business date is invalid.')
  return date
}

function normalizeInstant (value) {
  const instant = value instanceof Date ? new Date(value.getTime()) : new Date(value === undefined || value === null ? Date.now() : value)
  if (Number.isNaN(instant.getTime())) throw digestError(400, 'INVALID_DIGEST_TIMESTAMP', 'Digest timestamp is invalid.')
  return instant
}

function isDigestUniqueViolation (error) {
  const code = String(error?.code || '').toUpperCase()
  const message = String(error?.message || error || '').toLowerCase()
  const uniqueCode = code === 'SQLITE_CONSTRAINT_UNIQUE' || code === '23505' || code === 'DUPLICATE_KEY'
  const exactDigestKey = message.includes('notificationdigestdeliveries') &&
    message.includes('recipient') && message.includes('businessdate') && message.includes('digesttype')
  return uniqueCode && exactDigestKey
}

function digestError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  buildDigestSnapshot,
  isDigestScheduleDue,
  processNotificationDigestDeliveries,
  scheduleNotificationDigests
}
