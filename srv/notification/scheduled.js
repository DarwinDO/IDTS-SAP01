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
const RECIPIENT_USER_PAGE_SIZE = CANDIDATE_PAGE_SIZE * 2
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
  const result = {
    candidates: 0,
    pendingAssignment: 0,
    sla: 0,
    overdue: 0,
    created: 0,
    skipped: 0
  }

  const runPage = createPageTransactionRunner(tx)
  let lastID
  for (;;) {
    const page = await runPage(async pageTx => {
      const candidates = await readCandidatePage(pageTx, businessDate, lastID)
      if (!candidates.length) return { candidates, pageResult: null }

      const pms = await pageTx.run(
        SELECT.from(USERS)
          .columns('ID')
          .where({ active: true, role_code: 'PM' })
      )
      const pmIDs = pms.map(row => row.ID).filter(Boolean)
      const pageResult = {
        candidates: candidates.length,
        pendingAssignment: 0,
        sla: 0,
        overdue: 0,
        created: 0,
        skipped: 0
      }

      // Lock recipient trước profile, rồi profile trước Bug để giữ thứ tự User -> Profile -> Bug.
      const candidateLocks = await prepareCandidateLocks(pageTx, candidates)
      const currentBugs = []
      for (const candidate of candidates) {
        // Candidate rows are only a bounded snapshot. Lock and re-read the Bug before deriving any entry.
        const bug = await readCurrentBug(pageTx, candidate.ID)
        if (!bug) {
          pageResult.skipped += 1
          continue
        }
        if (!isScheduledCandidate(bug, businessDate)) {
          pageResult.skipped += 1
          continue
        }
        currentBugs.push(bug)
      }

      const anchors = await readScheduleAnchors(pageTx, currentBugs, businessDate)
      const overdueRecipients = await readOverdueRecipients(pageTx, currentBugs, candidateLocks)
      for (const bug of currentBugs) {
        const anchor = anchors.get(bug.ID) || {}
        const urgent = isUrgent(bug)
        if (bug.status_code === STATUS.PENDING_ASSIGNMENT) {
          for (const recipientID of pmIDs) {
            await writeScheduledEvent(pageTx, bug, {
              eventType: 'PENDING_ASSIGNMENT',
              message: `${bug.bugNumber || 'Bug'} is waiting for assignment.`,
              sourceKey: boundedSourceKey(`PENDING_ASSIGNMENT:${bug.ID}:${recipientID}`),
              recipientID,
              emailRequired: urgent,
              requirePM: true
            }, emailConfig, pageResult, 'pendingAssignment')
          }

          const thresholdHours = urgent ? URGENT_SLA_HOURS : STANDARD_SLA_HOURS
          if (isSlaDue({ ...bug, pendingAssignmentAt: anchor.pendingAssignmentAt }, instant, thresholdHours)) {
            for (const recipientID of pmIDs) {
              await writeScheduledEvent(pageTx, bug, {
                eventType: 'PENDING_ASSIGNMENT',
                message: `${bug.bugNumber || 'Bug'} has been pending assignment for ${thresholdHours} hours.`,
                sourceKey: boundedSourceKey(`SLA:${bug.ID}:${thresholdHours}h:${recipientID}`),
                recipientID,
                emailRequired: urgent,
                requirePM: true
              }, emailConfig, pageResult, 'sla')
            }
          }
        }

        if (isOverdue(bug, businessDate)) {
          const dueDate = String(bug.dueDate).slice(0, 10)
          for (const recipientID of overdueRecipients.get(bug.ID) || []) {
            await writeScheduledEvent(pageTx, bug, {
              eventType: 'OVERDUE',
              message: `${bug.bugNumber || 'Bug'} is overdue.`,
              sourceKey: boundedSourceKey(`OVERDUE:${bug.ID}:${dueDate}:${anchor.overdueCycleID}:${recipientID}`),
              recipientID,
              emailRequired: false,
              requirePM: false
            }, emailConfig, pageResult, 'overdue')
          }
        }
      }

      return {
        candidates,
        pageResult,
        nextID: candidates.at(-1)?.ID
      }
    })

    if (!page.pageResult) break
    for (const key of ['candidates', 'pendingAssignment', 'sla', 'overdue', 'created', 'skipped']) {
      result[key] += page.pageResult[key]
    }
    if (page.candidates.length < CANDIDATE_PAGE_SIZE) break
    const nextID = page.nextID
    if (!nextID || nextID === lastID) break
    lastID = nextID
  }

  return result
}

function createPageTransactionRunner (tx) {
  // CAP request tx là nested transaction; dùng service gốc để mỗi page có root tx riêng và nhả lock sau commit.
  const service = tx?.context ? Object.getPrototypeOf(tx) : tx
  if (typeof service?.tx !== 'function') {
    if (tx?.context) throw schedulerError(500, 'SCHEDULE_TRANSACTION_FACTORY_REQUIRED', 'A CAP transaction factory is required for page-bounded discovery.')
    return fn => fn(tx)
  }
  const context = tx?.context
    ? { tenant: tx.context.tenant, user: tx.context.user }
    : null
  return fn => context ? service.tx(context, fn) : service.tx(fn)
}

async function prepareCandidateLocks (tx, candidates) {
  const profileIDs = [...new Set(candidates.map(row => row.assignee_ID).filter(Boolean))]
  const profiles = profileIDs.length
    ? await tx.run(
      SELECT.from(DEVELOPER_PROFILES)
        .columns('ID', 'user_ID')
        .where({ ID: { in: profileIDs } })
        .orderBy('ID asc')
        .limit(CANDIDATE_PAGE_SIZE)
    )
    : []
  const userIDs = [...new Set([
    ...candidates.map(row => row.nextProcessorUser_ID).filter(Boolean),
    ...profiles.map(row => row.user_ID).filter(Boolean)
  ])]
  const users = userIDs.length
    ? await tx.run(
      SELECT.from(USERS)
        .columns('ID', 'active')
        .where({ ID: { in: userIDs } })
        .orderBy('ID asc')
        .limit(RECIPIENT_USER_PAGE_SIZE)
        .forUpdate()
    )
    : []
  const lockedProfiles = profileIDs.length
    ? await tx.run(
      SELECT.from(DEVELOPER_PROFILES)
        .columns('ID')
        .where({ ID: { in: profileIDs } })
        .orderBy('ID asc')
        .limit(CANDIDATE_PAGE_SIZE)
        .forUpdate()
    )
    : []
  return {
    profileIDs: new Set(lockedProfiles.map(row => row.ID).filter(Boolean)),
    userIDs: new Set(users.map(row => row.ID).filter(Boolean))
  }
}

function isScheduledCandidate (bug, businessDate) {
  return bug.status_code === STATUS.PENDING_ASSIGNMENT || isOverdue(bug, businessDate)
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

async function readScheduleAnchors (tx, bugs, businessDate) {
  // Lock-time eligibility is established before these page-bounded aggregate reads; history is never materialized per Bug.
  const anchors = new Map(bugs.map(bug => [bug.ID, {
    pendingAssignmentAt: bug.createdAt,
    // History event IDs are immutable cycle identities; the created-at fallback covers legacy Bugs without due-date audit.
    overdueCycleID: `CREATED:${bug.ID}:${bug.createdAt || ''}`
  }]))
  if (!bugs.length) return anchors

  const pendingBugs = bugs.filter(bug => bug.status_code === STATUS.PENDING_ASSIGNMENT)
  const pendingRows = await readLatestHistoryTimes(tx, pendingBugs.map(bug => bug.ID), {
    fieldName: 'status',
    newValue: STATUS.PENDING_ASSIGNMENT
  })
  for (const row of pendingRows) {
    const anchor = anchors.get(row.bug_ID)
    if (anchor && row.latestAt) anchor.pendingAssignmentAt = row.latestAt
  }

  const overdueBugs = bugs.filter(bug => isOverdue(bug, businessDate) && bug.dueDate)
  const dueRows = await readLatestHistoryTimes(tx, overdueBugs.map(bug => bug.ID), { fieldName: 'dueDate' })
  const dueEvents = await readLatestDueDateEvents(tx, overdueBugs, dueRows)
  const bugsByID = new Map(overdueBugs.map(bug => [bug.ID, bug]))
  const latestDueAtByBug = new Map(dueRows.map(row => [row.bug_ID, historyTimestampKey(row.latestAt)]))
  for (const row of dueEvents) {
    const bug = bugsByID.get(row.bug_ID)
    const anchor = anchors.get(row.bug_ID)
    const dueDate = bug?.dueDate && String(bug.dueDate).slice(0, 10)
    if (anchor && dueDate && String(row.newValue).slice(0, 10) === dueDate && historyTimestampKey(row.createdAt) === latestDueAtByBug.get(row.bug_ID) && row.cycleID) {
      anchor.overdueCycleID = row.cycleID
    }
  }
  return anchors
}

function historyTimestampKey (value) {
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? String(value || '') : timestamp.toISOString()
}

async function readLatestHistoryTimes (tx, bugIDs, { fieldName, newValue } = {}) {
  const uniqueBugIDs = [...new Set(bugIDs.filter(Boolean))]
  if (!uniqueBugIDs.length) return []
  const where = { bug_ID: { in: uniqueBugIDs }, fieldName }
  if (newValue !== undefined) where.newValue = newValue
  return tx.run(
    SELECT.from(HISTORY_LOGS)
      .columns('bug_ID', { func: 'max', args: [{ ref: ['createdAt'] }], as: 'latestAt' })
      .where(where)
      .groupBy('bug_ID')
      .orderBy('bug_ID asc')
      .limit(CANDIDATE_PAGE_SIZE)
  )
}

async function readLatestDueDateEvents (tx, bugs, dueRows) {
  if (!dueRows.length) return []
  const bugIDs = [...new Set(bugs.map(bug => bug.ID).filter(Boolean))]
  const dueDates = [...new Set(bugs.map(bug => bug.dueDate && String(bug.dueDate).slice(0, 10)).filter(Boolean))]
  const latestAt = [...new Set(dueRows.map(row => row.latestAt).filter(Boolean))]
  if (!bugIDs.length || !dueDates.length || !latestAt.length) return []
  return tx.run(
    SELECT.from(HISTORY_LOGS)
      .columns(
        'bug_ID', 'createdAt', 'newValue',
        { func: 'max', args: [{ ref: ['event_ID'] }], as: 'cycleID' }
      )
      .where({
        bug_ID: { in: bugIDs },
        fieldName: 'dueDate',
        newValue: { in: dueDates },
        createdAt: { in: latestAt }
      })
      .groupBy('bug_ID', 'createdAt', 'newValue')
      .orderBy('bug_ID asc')
      .limit(CANDIDATE_PAGE_SIZE)
  )
}

async function readOverdueRecipients (tx, candidates, candidateLocks = {}) {
  // Candidate bounded một page; User -> Profile đã lock trước khi lock Bug.
  const profileIDs = [...new Set(candidates.map(row => row.assignee_ID).filter(Boolean))]
  const profiles = profileIDs.length
    ? await tx.run(SELECT.from(DEVELOPER_PROFILES)
      .columns('ID', 'user_ID', 'active')
      .where({ ID: { in: profileIDs }, active: true })
      .orderBy('ID asc')
      .limit(CANDIDATE_PAGE_SIZE))
    : []
  const lockedProfiles = candidateLocks.profileIDs instanceof Set ? candidateLocks.profileIDs : new Set()
  const lockedUsers = candidateLocks.userIDs instanceof Set ? candidateLocks.userIDs : new Set()
  const eligibleProfiles = profiles.filter(profile => lockedProfiles.has(profile.ID))
  const userIDs = [...new Set([
    ...candidates.map(row => row.nextProcessorUser_ID).filter(Boolean),
    ...eligibleProfiles.map(row => row.user_ID).filter(Boolean)
  ].filter(userID => lockedUsers.has(userID)))]
  const users = userIDs.length
    ? await tx.run(SELECT.from(USERS)
      .columns('ID', 'active')
      .where({ ID: { in: userIDs }, active: true })
      .orderBy('ID asc')
      .limit(RECIPIENT_USER_PAGE_SIZE))
    : []
  const activeUsers = new Set(users.map(row => row.ID))
  const userByProfile = new Map(eligibleProfiles.filter(row => lockedUsers.has(row.user_ID) && activeUsers.has(row.user_ID)).map(row => [row.ID, row.user_ID]))
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
