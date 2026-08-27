'use strict'

// Scheduler chỉ phát hiện source event trong transaction; worker/outbox vẫn là đường gửi email riêng.

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { STATUS } = require('../bug-service/constants')
const { getEmailConfig } = require('../email/config')
const { writeNotificationRecord } = require('../email/outbox')

const BUGS = 'idts.cap.Bugs'
const NOTIFICATIONS = 'idts.cap.Notifications'
const USERS = 'idts.cap.Users'
const DEVELOPER_PROFILES = 'idts.cap.DeveloperProfiles'
const CANDIDATE_PAGE_SIZE = 500
const URGENT_SLA_HOURS = 4
const STANDARD_SLA_HOURS = 24
const URGENT_SEVERITIES = new Set(['CRITICAL', 'BLOCKER'])

async function processNotificationSchedules (req) {
  assertOutboxProcessor(req)
  const now = normalizeNow(req?.data?.now)
  return discoverScheduledNotifications({ tx: cds.tx(req), now })
}

async function discoverScheduledNotifications ({ tx, now, emailConfig = getEmailConfig() } = {}) {
  if (!tx || typeof tx.run !== 'function') throw schedulerError(500, 'SCHEDULE_TRANSACTION_REQUIRED', 'A CAP transaction is required.')
  const instant = normalizeNow(now)
  const businessDate = instant.toISOString().slice(0, 10)
  const pms = await tx.run(
    SELECT.from(USERS)
      .columns('ID')
      .where({ active: true, role_code: 'PM' })
  )
  const pmIDs = pms.map(row => row.ID).filter(Boolean)
  const result = {
    candidates: 0,
    pendingAssignment: 0,
    sla: 0,
    overdue: 0,
    created: 0,
    skipped: 0
  }

  for (let offset = 0; ; offset += CANDIDATE_PAGE_SIZE) {
    const candidates = await readCandidatePage(tx, businessDate, offset)
    if (!candidates.length) break
    result.candidates += candidates.length
    const recipients = await readOverdueRecipients(tx, candidates)

    for (const bug of candidates) {
      const urgent = isUrgent(bug)
      if (bug.status_code === STATUS.PENDING_ASSIGNMENT) {
        for (const recipientID of pmIDs) {
          await writeScheduledEvent(tx, bug, {
            eventType: 'PENDING_ASSIGNMENT',
            message: `${bug.bugNumber || 'Bug'} is waiting for assignment.`,
            sourceKey: `PENDING_ASSIGNMENT:${bug.ID}:${recipientID}`,
            recipientID,
            emailRequired: urgent
          }, emailConfig, result, 'pendingAssignment')
        }

        const thresholdHours = urgent ? URGENT_SLA_HOURS : STANDARD_SLA_HOURS
        if (isSlaDue(bug, instant, thresholdHours)) {
          for (const recipientID of pmIDs) {
            await writeScheduledEvent(tx, bug, {
              eventType: 'PENDING_ASSIGNMENT',
              message: `${bug.bugNumber || 'Bug'} has been pending assignment for ${thresholdHours} hours.`,
              sourceKey: `SLA:${bug.ID}:${thresholdHours}h:${recipientID}`,
              recipientID,
              emailRequired: urgent
            }, emailConfig, result, 'sla')
          }
        }
      }

      if (isOverdue(bug, businessDate)) {
        const dueDate = String(bug.dueDate).slice(0, 10)
        for (const recipientID of recipients.get(bug.ID) || []) {
          await writeScheduledEvent(tx, bug, {
            eventType: 'OVERDUE',
            message: `${bug.bugNumber || 'Bug'} is overdue.`,
            sourceKey: `OVERDUE:${bug.ID}:${dueDate}:${recipientID}`,
            recipientID,
            emailRequired: false
          }, emailConfig, result, 'overdue')
        }
      }
    }

    if (candidates.length < CANDIDATE_PAGE_SIZE) break
  }

  return result
}

async function readCandidatePage (tx, businessDate, offset) {
  // Chỉ đọc hai nhóm scheduler, mỗi page bounded; client không thể truyền filter/ID để mở rộng scope.
  return tx.run(
    SELECT.from(BUGS)
      .columns(
        'ID', 'bugNumber', 'status_code', 'priority_code', 'severity_code',
        'createdAt', 'modifiedAt', 'dueDate', 'nextProcessorUser_ID', 'assignee_ID'
      )
      .where({ status_code: { in: [STATUS.PENDING_ASSIGNMENT] } })
      .or({ dueDate: { '<': businessDate }, status_code: { '!=': STATUS.CLOSED } })
      .orderBy('ID asc')
      .limit(CANDIDATE_PAGE_SIZE, offset)
  )
}

async function readOverdueRecipients (tx, candidates) {
  const profileIDs = [...new Set(candidates.map(row => row.assignee_ID).filter(Boolean))]
  const profiles = profileIDs.length
    ? await tx.run(SELECT.from(DEVELOPER_PROFILES).columns('ID', 'user_ID', 'active').where({ ID: { in: profileIDs }, active: true }))
    : []
  const userIDs = [...new Set([
    ...candidates.map(row => row.nextProcessorUser_ID).filter(Boolean),
    ...profiles.map(row => row.user_ID).filter(Boolean)
  ])]
  const users = userIDs.length
    ? await tx.run(SELECT.from(USERS).columns('ID', 'active').where({ ID: { in: userIDs }, active: true }))
    : []
  const activeUsers = new Set(users.map(row => row.ID))
  const userByProfile = new Map(profiles.filter(row => activeUsers.has(row.user_ID)).map(row => [row.ID, row.user_ID]))
  return new Map(candidates.map(bug => {
    const currentOwner = activeUsers.has(bug.nextProcessorUser_ID) ? bug.nextProcessorUser_ID : null
    const assignee = userByProfile.get(bug.assignee_ID) || null
    return [bug.ID, [...new Set([currentOwner, assignee].filter(Boolean))]]
  }))
}

async function writeScheduledEvent (tx, bug, entry, emailConfig, result, bucket) {
  const existing = await tx.run(SELECT.one.from(NOTIFICATIONS).columns('ID').where({ sourceKey: entry.sourceKey }))
  const written = await writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: entry.recipientID,
    eventType: entry.eventType,
    message: entry.message,
    sourceKey: entry.sourceKey,
    emailRequired: entry.emailRequired
  }, emailConfig)
  if (existing?.ID || !written?.notificationID) {
    result.skipped += 1
    return written
  }
  result.created += 1
  result[bucket] += 1
  return written
}

function isSlaDue (bug, now, thresholdHours) {
  const anchor = new Date(bug.modifiedAt || bug.createdAt)
  return !Number.isNaN(anchor.getTime()) && now.getTime() - anchor.getTime() >= thresholdHours * 60 * 60 * 1000
}

function isOverdue (bug, businessDate) {
  return bug.status_code !== STATUS.CLOSED && bug.dueDate && String(bug.dueDate).slice(0, 10) < businessDate
}

function isUrgent (bug) {
  return bug.priority_code === 'CRITICAL' || URGENT_SEVERITIES.has(bug.severity_code)
}

function normalizeNow (value) {
  const now = value === undefined || value === null ? new Date() : new Date(value)
  if (Number.isNaN(now.getTime())) throw schedulerError(400, 'INVALID_SCHEDULE_TIMESTAMP', 'Schedule timestamp is invalid.')
  return now
}

function assertOutboxProcessor (req) {
  const user = req?.user
  const roleNames = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles && typeof user.roles === 'object'
      ? Object.keys(user.roles).filter(role => user.roles[role])
      : []
  const allowed = [
    typeof user?.is === 'function' && user.is('OutboxProcessor'),
    typeof user?.is === 'function' && user.is('$XSAPPNAME.OutboxProcessor'),
    roleNames.includes('OutboxProcessor'),
    roleNames.includes('$XSAPPNAME.OutboxProcessor')
  ].some(Boolean)
  if (!allowed) throw schedulerError(403, 'OUTBOX_PROCESSOR_REQUIRED', 'OutboxProcessor scope is required.')
}

function schedulerError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  CANDIDATE_PAGE_SIZE,
  discoverScheduledNotifications,
  isOverdue,
  isSlaDue,
  processNotificationSchedules
}
