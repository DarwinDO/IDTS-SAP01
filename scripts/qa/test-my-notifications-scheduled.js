'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const {
  discoverScheduledNotifications,
  processNotificationSchedules
} = require('../../srv/notification/scheduled')

const IDS = Object.freeze({
  pm: 'a1000000-0000-4000-8000-000000000001',
  inactivePm: 'a1000000-0000-4000-8000-000000000002',
  owner: 'a1000000-0000-4000-8000-000000000003',
  assigneeUser: 'a1000000-0000-4000-8000-000000000004',
  assigneeProfile: 'a2000000-0000-4000-8000-000000000001',
  urgent: 'a3000000-0000-4000-8000-000000000001',
  standard: 'a3000000-0000-4000-8000-000000000002',
  overdue: 'a3000000-0000-4000-8000-000000000003',
  closed: 'a3000000-0000-4000-8000-000000000004',
  staleClosed: 'a3000000-0000-4000-8000-000000000005',
  edited: 'a3000000-0000-4000-8000-000000000006',
  staleAssigned: 'a3000000-0000-4000-8000-000000000007',
  staleDueDate: 'a3000000-0000-4000-8000-000000000008',
  staleRecipient: 'a3000000-0000-4000-8000-000000000009'
})

const BASE_NOW = new Date('2026-08-27T04:00:00.000Z')

function emailConfig () {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    username: 'scheduled-test-user',
    password: 'scheduled-test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Scheduled Test',
    baseUrl: 'https://idts.example.test'
  })
}

async function count (db, entity, where = {}) {
  const row = await db.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

async function notificationBySource (db, sourceKey) {
  return db.run(SELECT.one.from('idts.cap.Notifications').where({ sourceKey }))
}

async function main () {
  const notificationCds = fs.readFileSync(path.join(__dirname, '../../srv/notification.cds'), 'utf8')
  assert.match(notificationCds, /@\(requires:\s*'OutboxProcessor'\)\s*action processNotificationSchedules\(now:Timestamp\)/,
    'scheduled action is protected by the OutboxProcessor scope')

  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  cds.db = db

  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.pm, 'Scheduled PM', 'scheduled-pm@example.test', 'PM', true),
    user(IDS.inactivePm, 'Inactive Scheduled PM', 'inactive-pm@example.test', 'PM', false),
    user(IDS.owner, 'Current Action Owner', 'scheduled-owner@example.test', 'TESTER', true),
    user(IDS.assigneeUser, 'Technical Assignee', 'scheduled-assignee@example.test', 'DEVELOPER', true)
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: IDS.assigneeProfile,
    user_ID: IDS.assigneeUser,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 5,
    active: true
  }))

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(IDS.urgent, 'BUG-SCHEDULED-URGENT', 'CRITICAL', 'MAJOR', '2026-08-27T00:00:00.000Z', null, null),
    bug(IDS.standard, 'BUG-SCHEDULED-STANDARD', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', null, null),
    bug(IDS.overdue, 'BUG-SCHEDULED-OVERDUE', 'HIGH', 'MAJOR', '2026-08-26T00:00:00.000Z', '2026-08-26', IDS.owner, IDS.assigneeProfile),
    bug(IDS.closed, 'BUG-SCHEDULED-CLOSED', 'CRITICAL', 'BLOCKER', '2026-08-20T00:00:00.000Z', '2026-08-20', IDS.owner, IDS.assigneeProfile, 'CLOSED'),
    bug(IDS.edited, 'BUG-SCHEDULED-EDITED', 'HIGH', 'MAJOR', '2026-08-27T04:00:00.000Z', null, null)
  ]))
  await addStatusHistory(db, IDS.edited, 'a7000000-0000-4000-8000-000000000001')

  const boundedQueries = []
  const boundedTx = {
    run: query => {
      if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val) {
        boundedQueries.push(query)
        assert.ok(query.SELECT.limit.rows.val <= 500, 'candidate pages are bounded to 500 rows')
      }
      return db.run(query)
    }
  }

  // 03:59 is before the four-hour Critical threshold; the PM inbox event is still discovered.
  await discoverScheduledNotifications({ tx: boundedTx, now: new Date('2026-08-27T03:59:00.000Z'), emailConfig: emailConfig() })
  assert.ok(boundedQueries.length >= 1, 'discovery uses a bounded Bug candidate query')
  assert.ok(boundedQueries.some(query => JSON.stringify(query.SELECT.where).includes('PENDING_ASSIGNMENT')),
    'candidate query is limited to pending/overdue scope')
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: `PENDING_ASSIGNMENT:${IDS.urgent}:${IDS.pm}` }), 1)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: `SLA:${IDS.urgent}:4h:${IDS.pm}` }), 0,
    'Critical SLA is not due at 03:59')

  // 04:00 is exactly due; the one source-keyed Critical SLA row and prompt delivery are created.
  await discoverScheduledNotifications({ tx: db, now: BASE_NOW, emailConfig: emailConfig() })
  const urgentSla = await notificationBySource(db, `SLA:${IDS.urgent}:4h:${IDS.pm}`)
  assert.ok(urgentSla?.ID, 'Critical SLA creates a source event at the threshold')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: urgentSla.ID }), 1,
    'Critical SLA uses the prompt email outbox')

  // 23:59 is before the standard 24-hour threshold; 24:00 creates inbox/digest policy only.
  await discoverScheduledNotifications({ tx: db, now: new Date('2026-08-27T23:59:00.000Z'), emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: `SLA:${IDS.standard}:24h:${IDS.pm}` }), 0,
    'standard SLA is not due at 23:59')
  await discoverScheduledNotifications({ tx: db, now: new Date('2026-08-28T00:00:00.000Z'), emailConfig: emailConfig() })
  const standardSla = await notificationBySource(db, `SLA:${IDS.standard}:24h:${IDS.pm}`)
  assert.ok(standardSla?.ID, 'standard SLA creates an inbox event at 24:00')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: standardSla.ID }), 0,
    'standard SLA stays on inbox/digest policy')

  // Editing a still-pending Bug must not reset the SLA clock to mutable modifiedAt.
  await db.run(UPDATE('idts.cap.Bugs').set({ title: 'Edited while still pending', modifiedAt: '2026-08-28T02:00:00.000Z' }).where({ ID: IDS.edited }))
  await discoverScheduledNotifications({ tx: db, now: new Date('2026-08-28T04:00:00.000Z'), emailConfig: emailConfig() })
  assert.ok(await notificationBySource(db, `SLA:${IDS.edited}:24h:${IDS.pm}`),
    'standard SLA uses the immutable Pending Assignment entry anchor after an unrelated edit')

  const overdueOwner = (await db.run(SELECT.from('idts.cap.Notifications').where({
    bug_ID: IDS.overdue, eventType_code: 'OVERDUE', recipient_ID: IDS.owner
  }))).at(0)
  const overdueAssignee = (await db.run(SELECT.from('idts.cap.Notifications').where({
    bug_ID: IDS.overdue, eventType_code: 'OVERDUE', recipient_ID: IDS.assigneeUser
  }))).at(0)
  assert.ok(overdueOwner?.ID, 'overdue notifies the current action owner')
  assert.ok(overdueAssignee?.ID, 'a different technical assignee receives an inbox-only item')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: overdueOwner.ID }), 0)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: overdueAssignee.ID }), 0)
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: IDS.closed, eventType_code: 'OVERDUE' }), 0,
    'closed Bugs are excluded from overdue discovery')
  assert.equal(await count(db, 'idts.cap.Notifications', { recipient_ID: IDS.inactivePm }), 0,
    'inactive PMs are excluded from recipient resolution')

  const beforeCycleCount = await count(db, 'idts.cap.Notifications', { bug_ID: IDS.overdue, eventType_code: 'OVERDUE' })
  await discoverScheduledNotifications({ tx: db, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: IDS.overdue, eventType_code: 'OVERDUE' }), beforeCycleCount,
    'repeating the same schedule is a no-op')
  await db.run(UPDATE('idts.cap.Bugs').set({ dueDate: '2026-08-25' }).where({ ID: IDS.overdue }))
  await addDueDateHistory(db, IDS.overdue, '2026-08-26', '2026-08-25', 'a5000000-0000-4000-8000-000000000001')
  await discoverScheduledNotifications({ tx: db, now: BASE_NOW, emailConfig: emailConfig() })
  assert.ok((await db.run(SELECT.from('idts.cap.Notifications').where({
    bug_ID: IDS.overdue, eventType_code: 'OVERDUE', recipient_ID: IDS.owner
  }))).length >= 2,
    'changing dueDate establishes a new overdue cycle')
  await db.run(UPDATE('idts.cap.Bugs').set({ dueDate: '2026-08-26' }).where({ ID: IDS.overdue }))
  await addDueDateHistory(db, IDS.overdue, '2026-08-25', '2026-08-26', 'a5000000-0000-4000-8000-000000000002')
  const beforeReusedDate = await count(db, 'idts.cap.Notifications', { bug_ID: IDS.overdue, eventType_code: 'OVERDUE' })
  await discoverScheduledNotifications({ tx: db, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: IDS.overdue, eventType_code: 'OVERDUE' }), beforeReusedDate + 2,
    'reusing a prior due date still creates a new cycle for both overdue recipients')

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(IDS.staleClosed, 'BUG-SCHEDULED-STALE-CLOSED', 'CRITICAL', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-26', IDS.owner, IDS.assigneeProfile),
    bug(IDS.staleAssigned, 'BUG-SCHEDULED-STALE-ASSIGNED', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', null, null),
    bug(IDS.staleDueDate, 'BUG-SCHEDULED-STALE-DUE-DATE', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-26', IDS.owner, IDS.assigneeProfile, 'ASSIGNED'),
    bug(IDS.staleRecipient, 'BUG-SCHEDULED-STALE-RECIPIENT', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-26', IDS.owner, IDS.assigneeProfile, 'ASSIGNED')
  ]))

  // A mutable candidate set must use keyset pagination, not OFFSET.
  const keysetRows = Array.from({ length: 501 }, (_, index) => ({
    ID: `keyset-${String(index + 1).padStart(4, '0')}`,
    bugNumber: `KEYSET-${index + 1}`,
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'LOW',
    severity_code: 'MINOR',
    createdAt: '2026-08-27T00:00:00.000Z',
    modifiedAt: '2026-08-27T00:00:00.000Z',
    dueDate: null,
    nextProcessorUser_ID: null,
    assignee_ID: null
  }))
  const keysetQueries = []
  const keysetTx = {
    run: async query => {
      if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
        keysetQueries.push(query)
        return keysetQueries.length === 1 ? keysetRows.slice(0, 500) : keysetRows.slice(500)
      }
      return []
    }
  }
  await discoverScheduledNotifications({ tx: keysetTx, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(keysetQueries.length, 2, 'keyset discovery reads the second bounded page')
  assert.equal(keysetQueries[1].SELECT.limit.offset, undefined, 'second candidate page does not use OFFSET')
  assert.match(JSON.stringify(keysetQueries[1].SELECT.where), /ID.*>.*keyset-0500/,
    'second candidate page starts strictly after the last ID')

  // A full page must bulk-read bounded history and recipient state; lock-time Bug re-reads remain per candidate.
  const bulkCandidates = Array.from({ length: 500 }, (_, index) => ({
    ID: `bulk-${String(index + 1).padStart(4, '0')}`,
    bugNumber: `BULK-${index + 1}`,
    title: 'Bulk scheduled QA fixture',
    status_code: 'ASSIGNED',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    createdAt: '2026-08-26T00:00:00.000Z',
    dueDate: '2026-08-26',
    nextProcessorUser_ID: IDS.owner,
    assignee_ID: IDS.assigneeProfile
  }))
  const bulkCandidateQueries = []
  const bulkCurrentQueries = []
  const bulkHistoryQueries = []
  const bulkProfileQueries = []
  const bulkUserQueries = []
  const bulkFinalUserLocks = []
  const bulkTx = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
        bulkCandidateQueries.push(query)
        return bulkCandidateQueries.length === 1 ? bulkCandidates : []
      }
      if (from === 'idts.cap.Bugs' && query.SELECT.one && Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate') && query.SELECT.columns?.length > 1) {
        bulkCurrentQueries.push(query)
        const where = JSON.stringify(query.SELECT.where)
        return bulkCandidates.find(row => where.includes(row.ID)) || null
      }
      if (from === 'idts.cap.Bugs' && query.SELECT.one) {
        const where = JSON.stringify(query.SELECT.where)
        return bulkCandidates.find(row => where.includes(row.ID)) || null
      }
      if (from === 'idts.cap.HistoryLogs') {
        bulkHistoryQueries.push(query)
        return []
      }
      if (from === 'idts.cap.DeveloperProfiles') {
        bulkProfileQueries.push(query)
        return [{ ID: IDS.assigneeProfile, user_ID: IDS.assigneeUser, active: true }]
      }
      if (from === 'idts.cap.Users' && !query.SELECT.one) {
        if (JSON.stringify(query.SELECT.where).includes('role_code')) return [{ ID: 'bulk-pm', active: true, role_code: 'PM' }]
        bulkUserQueries.push(query)
        return [
          { ID: IDS.owner, active: true },
          { ID: IDS.assigneeUser, active: true }
        ]
      }
      if (from === 'idts.cap.Users' && query.SELECT.one) {
        if (Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')) bulkFinalUserLocks.push(query)
        const where = JSON.stringify(query.SELECT.where)
        const ID = where.includes(IDS.assigneeUser) ? IDS.assigneeUser : IDS.owner
        return { ID, active: true, role_code: ID === IDS.owner ? 'TESTER' : 'DEVELOPER', email: `${ID}@example.test`, displayName: ID }
      }
      if (from === 'idts.cap.EventTypes') return { code: 'OVERDUE', name: 'Overdue' }
      if (from === 'idts.cap.StatusValues') return { name: 'Assigned' }
      return undefined
    }
  }
  await discoverScheduledNotifications({ tx: bulkTx, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(bulkCandidateQueries.length, 2, 'full-page discovery reads the bounded second page')
  assert.equal(bulkCurrentQueries.length, bulkCandidates.length, 'full-page discovery keeps lock-time Bug revalidation')
  assert.ok(bulkHistoryQueries.length >= 1 && bulkHistoryQueries.length <= 3,
    'history anchors are resolved in a bounded number of page bulk queries')
  assert.ok(bulkHistoryQueries.every(query => query.SELECT.limit?.rows?.val <= 500),
    'history anchor bulk queries are individually bounded')
  assert.equal(bulkProfileQueries.length, 1, 'overdue profiles are resolved in one page-bounded bulk query')
  assert.equal(bulkUserQueries.length, 1, 'overdue recipient users are resolved in one page-bounded bulk query')
  assert.ok(bulkProfileQueries.every(query => query.SELECT.limit?.rows?.val <= 500),
    'overdue profile bulk queries are individually bounded')
  assert.ok(bulkUserQueries.every(query => query.SELECT.limit?.rows?.val <= 1000),
    'overdue user bulk queries are individually bounded')
  assert.ok(bulkProfileQueries.every(query => !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')),
    'bulk profile eligibility reads do not acquire a Bug-to-Profile lock')
  assert.ok(bulkUserQueries.every(query => !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')),
    'bulk user eligibility reads do not acquire a Bug-to-User lock')
  assert.ok(bulkFinalUserLocks.length > 0,
    'each written recipient keeps a final locked User revalidation')

  // Re-read and lock the Bug immediately before writing; stale close/assignment/due-date changes must not emit.
  await assertStaleCandidateSkipped(db, IDS.staleClosed,
    { status_code: 'CLOSED', dueDate: '2026-08-20' },
    'a Bug closed after candidate selection is revalidated before notification insert')
  await assertStaleCandidateSkipped(db, IDS.staleAssigned,
    { status_code: 'ASSIGNED', assignee_ID: IDS.assigneeProfile, nextProcessorUser_ID: IDS.assigneeUser },
    'a Bug assigned after candidate selection is revalidated before notification insert')
  await assertStaleCandidateSkipped(db, IDS.staleDueDate,
    { dueDate: '2026-08-30' },
    'a Bug rescheduled after candidate selection is revalidated before notification insert')

  // A recipient returned by the bulk read can change before its writer call; the final lock must reject it.
  await assertStaleRecipientSkipped(db, IDS.staleRecipient, IDS.owner,
    'a recipient deactivated after bulk resolution is revalidated before notification insert')

  const nonSchedulerRequest = new cds.Request({
    user: new cds.User({ id: 'ordinary-user', roles: ['authenticated-user'] }),
    data: { now: BASE_NOW.toISOString(), bugID: IDS.closed, recipientID: IDS.inactivePm }
  })
  await assert.rejects(() => processNotificationSchedules(nonSchedulerRequest), error => {
    assert.equal(error.status, 403)
    assert.equal(error.code, 'OUTBOX_PROCESSOR_REQUIRED')
    return true
  }, 'non-OutboxProcessor callers are denied before input/query processing')

  console.log('IDTS My Notifications scheduled discovery contract: PASS')
}

function user (ID, displayName, email, role_code, active) {
  return { ID, displayName, email, role_code, active }
}

function bug (ID, bugNumber, priority_code, severity_code, modifiedAt, dueDate, nextProcessorUser_ID, assignee_ID, status_code = 'PENDING_ASSIGNMENT') {
  return {
    ID,
    bugNumber,
    title: `${bugNumber} scheduled discovery fixture`,
    description: 'Scheduled discovery fixture.',
    status_code,
    priority_code,
    severity_code,
    environment_code: 'QAS',
    environmentDetail: 'Local scheduled QA',
    stepsToReproduce: 'Run scheduled QA.',
    actualResult: 'No notification was discovered yet.',
    expectedResult: 'The scheduled notification is discovered once.',
    applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
    defectCategory_ID: '50000000-0000-0000-0000-000000000001',
    componentCategory_ID: '60000000-0000-0000-0000-000000000001',
    reporter_ID: '10000000-0000-0000-0000-000000000004',
    assignee_ID: assignee_ID || null,
    nextProcessorUser_ID: nextProcessorUser_ID || IDS.pm,
    nextProcessorRole_code: nextProcessorUser_ID ? 'TESTER' : 'PM',
    plannedCompletionDate: dueDate,
    dueDate,
    estimatedEffortHours: '2.00',
    createdAt: modifiedAt,
    modifiedAt
  }
}

async function assertStaleCandidateSkipped (db, bugID, update, message) {
  let candidateRead = false
  const tx = {
    run: async query => {
      if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500 && !candidateRead) {
        candidateRead = true
        const rows = await db.run(query)
        await db.run(UPDATE('idts.cap.Bugs').set(update).where({ ID: bugID }))
        return rows.filter(row => row.ID === bugID)
      }
      return db.run(query)
    }
  }
  await discoverScheduledNotifications({ tx, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: bugID }), 0, message)
}

async function assertStaleRecipientSkipped (db, bugID, recipientID, message) {
  let candidateRead = false
  let recipientBulkRead = false
  const tx = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500 && !candidateRead) {
        candidateRead = true
        const rows = await db.run(query)
        return rows.filter(row => row.ID === bugID)
      }
      if (from === 'idts.cap.Users' && !query.SELECT.one && !recipientBulkRead && JSON.stringify(query.SELECT.where).includes(recipientID)) {
        recipientBulkRead = true
        const rows = await db.run(query)
        await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: recipientID }))
        return rows
      }
      return db.run(query)
    }
  }
  await discoverScheduledNotifications({ tx, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: bugID, recipient_ID: recipientID }), 0, message)
}

async function addDueDateHistory (db, bugID, oldValue, newValue, eventID) {
  await db.run(INSERT.into('idts.cap.HistoryEvents').entries({
    ID: eventID,
    bug_ID: bugID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'EDIT',
    summary: 'Changed due date for scheduled QA.',
    createdAt: eventID.endsWith('001') ? '2026-08-27T01:00:00.000Z' : '2026-08-27T02:00:00.000Z',
    modifiedAt: eventID.endsWith('001') ? '2026-08-27T01:00:00.000Z' : '2026-08-27T02:00:00.000Z'
  }))
  await db.run(INSERT.into('idts.cap.HistoryLogs').entries({
    ID: eventID.endsWith('001') ? 'a6000000-0000-4000-8000-000000000001' : 'a6000000-0000-4000-8000-000000000002',
    bug_ID: bugID,
    event_ID: eventID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'EDIT',
    fieldName: 'dueDate',
    fieldLabel: 'Due Date',
    oldValue,
    newValue,
    createdAt: eventID.endsWith('001') ? '2026-08-27T01:00:00.000Z' : '2026-08-27T02:00:00.000Z',
    modifiedAt: eventID.endsWith('001') ? '2026-08-27T01:00:00.000Z' : '2026-08-27T02:00:00.000Z'
  }))
}

async function addStatusHistory (db, bugID, eventID) {
  await db.run(INSERT.into('idts.cap.HistoryEvents').entries({
    ID: eventID,
    bug_ID: bugID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'CREATE',
    summary: 'Entered Pending Assignment for scheduled QA.',
    createdAt: '2026-08-27T04:00:00.000Z',
    modifiedAt: '2026-08-27T04:00:00.000Z'
  }))
  await db.run(INSERT.into('idts.cap.HistoryLogs').entries({
    ID: 'a8000000-0000-4000-8000-000000000001',
    bug_ID: bugID,
    event_ID: eventID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'CREATE',
    fieldName: 'status',
    fieldLabel: 'Status',
    oldValue: null,
    newValue: 'PENDING_ASSIGNMENT',
    createdAt: '2026-08-27T04:00:00.000Z',
    modifiedAt: '2026-08-27T04:00:00.000Z'
  }))
}

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1600))
  process.exit(1)
})
