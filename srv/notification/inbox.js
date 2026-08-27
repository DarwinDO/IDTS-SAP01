'use strict'

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql
const { resolveRequestUser } = require('../bug-service/helpers')
const { buildBugLink } = require('../email/template')

const INBOX = 'idts.cap.UserNotificationInboxEntries'
const BUG_NOTIFICATIONS = 'idts.cap.Notifications'
const ACCESS_AUDITS = 'idts.cap.UserIdentityAuditEvents'
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_PAGE_SKIP = 10000
const CATEGORIES = new Set(['ALL', 'BUG', 'ACCESS'])
const READ_STATES = new Set(['ALL', 'UNREAD', 'READ'])
const BUG_EVENTS = new Set(['ASSIGNED', 'NEED_MORE_INFORMATION', 'REJECTED', 'UPDATED', 'OVERDUE', 'CLOSED', 'RESOLVED', 'RETEST_REQUIRED', 'REOPENED', 'RESUBMITTED', 'REASSIGNED', 'RETEST_OWNER_CHANGED', 'PENDING_ASSIGNMENT', 'ASSIGNMENT_REMOVED', 'OWNER_CHANGED'])
const ACTION_REQUIRED_EVENTS = new Set(['ASSIGNED', 'NEED_MORE_INFORMATION', 'REJECTED', 'RESOLVED', 'RETEST_REQUIRED', 'REOPENED', 'RESUBMITTED', 'REASSIGNED', 'RETEST_OWNER_CHANGED', 'OWNER_CHANGED'])
// Bundle riêng dùng fallback native CAP; không dịch raw audit/message có thể chứa dữ liệu riêng.
const texts = cds.i18n.bundle4({ basename: 'notifications', roots: [__dirname], model: undefined })

async function resolveNotificationActor (req) {
  // Luôn resolve identity active từ request trước input, query và mutation; không nhận recipient từ client.
  const actor = await resolveRequestUser(req, {})
  if (!actor?.ID || actor.active !== true) {
    throw serviceError(403, 'NOTIFICATION_ACTOR_REQUIRED', 'An active IDTS user is required.')
  }
  return actor
}

async function searchMyNotifications (req) {
  const actor = await resolveNotificationActor(req)
  const input = normalizeSearch(req.data)
  const tx = cds.tx(req)
  const rows = await readInboxPage(tx, actor.ID, input)
  return hydrateNotificationPage(tx, rows, req.locale)
}

async function getMyUnreadNotificationCount (req) {
  const actor = await resolveNotificationActor(req)
  const row = await cds.tx(req).run(
    SELECT.one.from(INBOX)
      .columns('count(*) as count')
      .where({ recipient_ID: actor.ID, readAt: null })
  )
  return { count: Number(row?.count || 0) }
}

async function markMyNotificationRead (req) {
  // Update có điều kiện; tab cũ được trả row đã đọc hoặc conflict, không overwrite phiên mới.
  const actor = await resolveNotificationActor(req)
  const notificationID = requiredUuid(req.data?.notificationID)
  const expectedModifiedAt = requiredTimestamp(req.data?.expectedModifiedAt)
  const now = new Date(req.timestamp || Date.now()).toISOString()
  const tx = cds.tx(req)
  const changed = await tx.run(
    UPDATE(INBOX).set({ readAt: now }).where({
      ID: notificationID,
      recipient_ID: actor.ID,
      modifiedAt: expectedModifiedAt,
      readAt: null
    })
  )
  const row = await readCallerInboxRow(tx, actor.ID, notificationID)
  if (!row) throw serviceError(404, 'NOTIFICATION_NOT_FOUND', 'Notification was not found.')
  if (changed !== 1 && !row.readAt) {
    throw serviceError(409, 'NOTIFICATION_VERSION_CONFLICT', 'Notification changed. Reload and try again.')
  }
  return (await hydrateNotificationPage(tx, [row], req.locale))[0]
}

async function markAllMyNotificationsRead (req) {
  const actor = await resolveNotificationActor(req)
  const throughOccurredAt = requiredTimestamp(req.data?.throughOccurredAt)
  const now = new Date(req.timestamp || Date.now()).toISOString()
  const changed = await cds.tx(req).run(
    UPDATE(INBOX).set({ readAt: now }).where({
      recipient_ID: actor.ID,
      readAt: null,
      occurredAt: { '<=': throughOccurredAt }
    })
  )
  return { count: Number(changed || 0) }
}

function readCallerInboxRow (tx, recipientID, notificationID) {
  return tx.run(
    SELECT.one.from(INBOX)
      .columns('ID', 'recipient_ID', 'bugNotification_ID', 'accessAuditEvent_ID', 'occurredAt', 'readAt', 'modifiedAt')
      .where({ ID: notificationID, recipient_ID: recipientID })
  )
}

function normalizeSearch (data = {}) {
  const category = normalizeEnum(data.category, 'ALL', CATEGORIES)
  const readState = normalizeEnum(data.readState, 'ALL', READ_STATES)
  const skip = data.skip === undefined || data.skip === null ? 0 : Number(data.skip)
  const top = data.top === undefined || data.top === null ? DEFAULT_PAGE_SIZE : Number(data.top)

  if (!Number.isInteger(skip) || skip < 0 || skip > MAX_PAGE_SKIP ||
      !Number.isInteger(top) || top < 1 || top > MAX_PAGE_SIZE) {
    throw serviceError(400, 'INVALID_NOTIFICATION_PAGE', 'Notification page parameters are invalid.')
  }
  return { category, readState, skip, top }
}

function normalizeEnum (value, fallback, allowed) {
  const normalized = value === undefined || value === null || value === ''
    ? fallback
    : String(value).trim().toUpperCase()
  if (!allowed.has(normalized)) {
    throw serviceError(400, 'INVALID_NOTIFICATION_FILTER', 'Notification filter is invalid.')
  }
  return normalized
}

async function readInboxPage (tx, recipientID, input) {
  const query = SELECT.from(INBOX)
    .columns('ID', 'recipient_ID', 'bugNotification_ID', 'accessAuditEvent_ID', 'occurredAt', 'readAt', 'modifiedAt')
    .where({ recipient_ID: recipientID })

  if (input.category === 'BUG') query.and({ bugNotification_ID: { '!=': null } })
  if (input.category === 'ACCESS') query.and({ accessAuditEvent_ID: { '!=': null } })
  if (input.readState === 'UNREAD') query.and({ readAt: null })
  if (input.readState === 'READ') query.and({ readAt: { '!=': null } })

  return tx.run(
    query.orderBy('occurredAt desc', 'ID desc').limit(input.top, input.skip)
  )
}

async function hydrateNotificationPage (tx, rows, locale = 'en') {
  const validRows = rows.filter(row => Boolean(row.bugNotification_ID) !== Boolean(row.accessAuditEvent_ID))
  const bugIDs = [...new Set(validRows.map(row => row.bugNotification_ID).filter(Boolean))]
  const accessIDs = [...new Set(validRows.map(row => row.accessAuditEvent_ID).filter(Boolean))]
  const bugSources = bugIDs.length
    ? await tx.run(SELECT.from(BUG_NOTIFICATIONS)
        .columns('ID', 'recipient_ID', 'bug_ID', 'eventType_code', { ref: ['bug', 'priority_code'], as: 'priority' })
        .where({ ID: { in: bugIDs } }))
    : []
  const accessSources = accessIDs.length
    ? await tx.run(SELECT.from(ACCESS_AUDITS)
        .columns('ID', 'targetUser_ID', 'action', 'result')
        .where({ ID: { in: accessIDs } }))
    : []
  const bugsByID = new Map(bugSources.map(source => [source.ID, source]))
  const accessByID = new Map(accessSources.map(source => [source.ID, source]))

  return rows.map(row => Boolean(row.bugNotification_ID) === Boolean(row.accessAuditEvent_ID)
    ? unavailableSummary(row, row.bugNotification_ID ? 'BUG' : 'ACCESS', locale)
    : row.bugNotification_ID
    ? bugSummary(row, bugsByID.get(row.bugNotification_ID), locale)
    : accessSummary(row, accessByID.get(row.accessAuditEvent_ID), locale))
}

function bugSummary (row, source, locale) {
  if (!source || source.recipient_ID !== row.recipient_ID || !BUG_EVENTS.has(source.eventType_code)) return unavailableSummary(row, 'BUG', locale)
  const eventType = source.eventType_code
  return baseSummary(row, {
    category: 'BUG',
    eventType,
    title: texts.at(`BUG_${eventType}_TITLE`, locale),
    summary: texts.at(`BUG_${eventType}_SUMMARY`, locale),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(source.priority) ? source.priority : null,
    actionRequired: ACTION_REQUIRED_EVENTS.has(eventType),
    targetPath: typeof source.bug_ID === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(source.bug_ID)
      ? buildBugLink('/idtsbugmanagementui/index.html', source.bug_ID)
      : null
  })
}

function accessSummary (row, source, locale) {
  if (!source || source.targetUser_ID !== row.recipient_ID) return unavailableSummary(row, 'ACCESS', locale)
  const eventType = source.action
  const supported = source.result === 'APPLIED' && ['CHANGE_ROLE', 'REACTIVATE'].includes(eventType)
  if (!supported) return unavailableSummary(row, 'ACCESS', locale)
  return baseSummary(row, {
    category: 'ACCESS',
    eventType,
    title: texts.at(`ACCESS_${eventType}_TITLE`, locale),
    summary: texts.at(`ACCESS_${eventType}_SUMMARY`, locale),
    priority: null,
    actionRequired: false,
    targetPath: '/idtsbugmanagementui/index.html'
  })
}

function unavailableSummary (row, category, locale) {
  return baseSummary(row, {
    category,
    eventType: 'UNAVAILABLE',
    title: texts.at('UNAVAILABLE_TITLE', locale),
    summary: null,
    priority: null,
    actionRequired: false,
    targetPath: null
  })
}

function baseSummary (row, source) {
  return {
    notificationID: row.ID,
    category: source.category,
    eventType: source.eventType,
    title: source.title,
    summary: source.summary,
    priority: source.priority,
    actionRequired: source.actionRequired,
    occurredAt: row.occurredAt,
    readAt: row.readAt || null,
    targetPath: source.targetPath,
    modifiedAt: row.modifiedAt
  }
}

function requiredTimestamp (value) {
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value))) {
    throw serviceError(400, 'INVALID_NOTIFICATION_TIMESTAMP', 'Notification timestamp is invalid.')
  }
  return new Date(value).toISOString()
}

function requiredUuid (value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw serviceError(400, 'INVALID_NOTIFICATION_ID', 'Notification ID is invalid.')
  }
  return normalized
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  getMyUnreadNotificationCount,
  hydrateNotificationPage,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  normalizeSearch,
  readInboxPage,
  resolveNotificationActor,
  searchMyNotifications
}
