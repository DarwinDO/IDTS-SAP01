'use strict'

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql
const { resolveRequestUser } = require('../bug-service/helpers')

const INBOX = 'idts.cap.UserNotificationInboxEntries'
const BUG_NOTIFICATIONS = 'idts.cap.Notifications'
const ACCESS_AUDITS = 'idts.cap.UserIdentityAuditEvents'
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_PAGE_SKIP = 10000
const CATEGORIES = new Set(['ALL', 'BUG', 'ACCESS'])
const READ_STATES = new Set(['ALL', 'UNREAD', 'READ'])
const ACTION_REQUIRED_EVENTS = new Set([
  'ASSIGNED',
  'NEED_MORE_INFORMATION',
  'REJECTED',
  'REACTIVATE',
  'CHANGE_ROLE'
])
const ACCESS_SUMMARY_BY_EVENT = Object.freeze({
  CHANGE_ROLE: 'Your access role changed.',
  REACTIVATE: 'Your access was reactivated.'
})

async function resolveNotificationActor (req) {
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
  return hydrateNotificationPage(tx, rows)
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
  return (await hydrateNotificationPage(tx, [row]))[0]
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
      .columns('ID', 'bugNotification_ID', 'accessAuditEvent_ID', 'occurredAt', 'readAt', 'modifiedAt')
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
    .columns('ID', 'bugNotification_ID', 'accessAuditEvent_ID', 'occurredAt', 'readAt', 'modifiedAt')
    .where({ recipient_ID: recipientID })

  if (input.category === 'BUG') query.and({ bugNotification_ID: { '!=': null } })
  if (input.category === 'ACCESS') query.and({ accessAuditEvent_ID: { '!=': null } })
  if (input.readState === 'UNREAD') query.and({ readAt: null })
  if (input.readState === 'READ') query.and({ readAt: { '!=': null } })

  return tx.run(
    query.orderBy('occurredAt desc', 'ID desc').limit(input.top, input.skip)
  )
}

async function hydrateNotificationPage (tx, rows) {
  const bugIDs = [...new Set(rows.map(row => row.bugNotification_ID).filter(Boolean))]
  const accessIDs = [...new Set(rows.map(row => row.accessAuditEvent_ID).filter(Boolean))]
  const bugSources = bugIDs.length
    ? await tx.run(SELECT.from(BUG_NOTIFICATIONS)
        .columns('ID', 'bug_ID', 'eventType_code', 'message')
        .where({ ID: { in: bugIDs } }))
    : []
  const accessSources = accessIDs.length
    ? await tx.run(SELECT.from(ACCESS_AUDITS)
        .columns('ID', 'action', 'result')
        .where({ ID: { in: accessIDs } }))
    : []
  const bugsByID = new Map(bugSources.map(source => [source.ID, source]))
  const accessByID = new Map(accessSources.map(source => [source.ID, source]))

  return rows.map(row => row.bugNotification_ID
    ? bugSummary(row, bugsByID.get(row.bugNotification_ID))
    : accessSummary(row, accessByID.get(row.accessAuditEvent_ID)))
}

function bugSummary (row, source) {
  if (!source) return unavailableSummary(row, 'BUG')
  const eventType = safeText(source.eventType_code, 40) || 'UPDATED'
  return baseSummary(row, {
    category: 'BUG',
    eventType,
    title: titleFor(eventType),
    summary: safeText(source.message, 500),
    priority: null,
    actionRequired: ACTION_REQUIRED_EVENTS.has(eventType),
    targetPath: source.bug_ID ? `/idtsbugmanagementui/index.html#/Bugs(${source.bug_ID})` : null
  })
}

function accessSummary (row, source) {
  if (!source) return unavailableSummary(row, 'ACCESS')
  const eventType = safeText(source.action, 40) || 'ACCESS_CHANGED'
  const supported = source.result === 'APPLIED' && ['CHANGE_ROLE', 'REACTIVATE'].includes(eventType)
  return baseSummary(row, {
    category: 'ACCESS',
    eventType,
    title: titleFor(eventType),
    summary: ACCESS_SUMMARY_BY_EVENT[eventType] || null,
    priority: null,
    actionRequired: supported,
    targetPath: supported ? '/idtsbugmanagementui/index.html' : null
  })
}

function unavailableSummary (row, category) {
  return baseSummary(row, {
    category,
    eventType: 'UNAVAILABLE',
    title: 'Notification unavailable',
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

function titleFor (eventType) {
  return String(eventType || 'Notification')
    .toLowerCase()
    .split('_')
    .map(word => word ? word[0].toUpperCase() + word.slice(1) : '')
    .join(' ')
    .slice(0, 160)
}

function safeText (value, limit) {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/[\r\n\t]+/g, ' ').trim()
  return normalized ? normalized.slice(0, limit) : null
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
