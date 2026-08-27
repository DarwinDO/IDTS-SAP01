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
const HISTORY_LOGS = 'idts.cap.HistoryLogs'
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

  let lastID
  for (;;) {
    const candidates = await readCandidatePage(tx, businessDate, lastID)
    if (!candidates.length) break
    result.candidates += candidates.length

    for (const candidate of candidates) {
      // Candidate rows are only a bounded snapshot. Lock and re-read the Bug before deriving any entry.
      const bug = await readCurrentBug(tx, candidate.ID)
      if (!bug) {
        result.skipped += 1
        continue
      }
      const anchors = await readScheduleAnchors(tx, bug)
      const urgent = isUrgent(bug)
      if (bug.status_code === STATUS.PENDING_ASSIGNMENT) {
        for (const recipientID of pmIDs) {
          await writeScheduledEvent(tx, bug, {
            eventType: 'PENDING_ASSIGNMENT',
            message: `${bug.bugNumber || 'Bug'} is waiting for assignment.`,
            sourceKey: boundedSourceKey(`PENDING_ASSIGNMENT:${bug.ID}:${recipientID}`),
            recipientID,
            emailRequired: urgent,
            requirePM: true
          }, emailConfig, result, 'pendingAssignment')
        }

        const thresholdHours = urgent ? URGENT_SLA_HOURS : STANDARD_SLA_HOURS
        if (isSlaDue({ ...bug, pendingAssignmentAt: anchors.pendingAssignmentAt }, instant, thresholdHours)) {
          for (const recipientID of pmIDs) {
            await writeScheduledEvent(tx, bug, {
              eventType: 'PENDING_ASSIGNMENT',
              message: `${bug.bugNumber || 'Bug'} has been pending assignment for ${thresholdHours} hours.`,
              sourceKey: boundedSourceKey(`SLA:${bug.ID}:${thresholdHours}h:${recipientID}`),
              recipientID,
              emailRequired: urgent,
              requirePM: true
            }, emailConfig, result, 'sla')
          }
        }
      }

      if (isOverdue(bug, businessDate)) {
        const dueDate = String(bug.dueDate).slice(0, 10)
        const recipients = await readOverdueRecipients(tx, [bug])
        for (const recipientID of recipients.get(bug.ID) || []) {
          await writeScheduledEvent(tx, bug, {
            eventType: 'OVERDUE',
            message: `${bug.bugNumber || 'Bug'} is overdue.`,
            sourceKey: boundedSourceKey(`OVERDUE:${bug.ID}:${dueDate}:${anchors.overdueCycleID}:${recipientID}`),
            recipientID,
            emailRequired: false,
            requirePM: false
          }, emailConfig, result, 'overdue')
        }
      }
    }

    if (candidates.length < CANDIDATE_PAGE_SIZE) break
    const nextID = candidates.at(-1)?.ID
    if (!nextID || nextID === lastID) break
    lastID = nextID
  }

  return result
}

async function readCandidatePage (tx, businessDate, lastID) {
  // Chỉ đọc hai nhóm scheduler, mỗi page bounded; client không thể truyền filter/ID để mở rộng scope.
  const query = SELECT.from(BUGS)
    .columns(
      'ID', 'bugNumber', 'status_code', 'priority_code', 'severity_code',
      'createdAt', 'dueDate', 'nextProcessorUser_ID', 'assignee_ID'
    )
    .where`(status_code = ${STATUS.PENDING_ASSIGNMENT} or (dueDate < ${businessDate} and status_code != ${STATUS.CLOSED}))`
    .orderBy('ID asc')
    .limit(CANDIDATE_PAGE_SIZE)
  if (lastID) query.and`ID > ${lastID}`
  return tx.run(query)
}

function readCurrentBug (tx, bugID) {
  return tx.run(
    SELECT.one.from(BUGS)
      .columns(
        'ID', 'bugNumber', 'status_code', 'priority_code', 'severity_code',
        'createdAt', 'dueDate', 'nextProcessorUser_ID', 'assignee_ID'
      )
      .where({ ID: bugID })
      .forUpdate()
  )
}

async function readScheduleAnchors (tx, bug) {
  const logs = await tx.run(
    SELECT.from(HISTORY_LOGS)
      .columns('event_ID', 'fieldName', 'newValue', 'createdAt')
      .where({ bug_ID: bug.ID, fieldName: { in: ['status', 'dueDate'] } })
      .orderBy('createdAt desc', 'event_ID desc')
  )
  const pendingLog = logs.find(log => log.fieldName === 'status' && log.newValue === STATUS.PENDING_ASSIGNMENT)
  const dueDate = bug.dueDate ? String(bug.dueDate).slice(0, 10) : null
  const dueDateLog = dueDate && logs.find(log => log.fieldName === 'dueDate' && String(log.newValue).slice(0, 10) === dueDate)
  return {
    pendingAssignmentAt: pendingLog?.createdAt || bug.createdAt,
    // History event IDs are immutable cycle identities; the created-at fallback covers legacy Bugs without due-date audit.
    overdueCycleID: dueDateLog?.event_ID || `CREATED:${bug.ID}:${bug.createdAt || ''}`
  }
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
  // The Bug is locked/re-read by the caller immediately before this write; re-check the recipient while still in that tx.
  const recipient = await tx.run(
    SELECT.one.from(USERS).columns('ID', 'active', 'role_code').where({ ID: entry.recipientID }).forUpdate()
  )
  if (!recipient?.active || (entry.requirePM && recipient.role_code !== 'PM')) {
    result.skipped += 1
    return {}
  }
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
  const anchor = new Date(bug.pendingAssignmentAt || bug.createdAt)
  return !Number.isNaN(anchor.getTime()) && now.getTime() - anchor.getTime() >= thresholdHours * 60 * 60 * 1000
}

function isOverdue (bug, businessDate) {
  return bug.status_code !== STATUS.CLOSED && bug.dueDate && String(bug.dueDate).slice(0, 10) < businessDate
}

function isUrgent (bug) {
  return bug.priority_code === 'CRITICAL' || URGENT_SEVERITIES.has(bug.severity_code)
}

function boundedSourceKey (sourceKey) {
  if (sourceKey.length > 255) throw schedulerError(500, 'SCHEDULE_SOURCE_KEY_TOO_LONG', 'Scheduled notification source key is too long.')
  return sourceKey
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
