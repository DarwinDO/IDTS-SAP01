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
  staleRecipient: 'a3000000-0000-4000-8000-000000000009',
  staleProfile: 'a3000000-0000-4000-8000-000000000010'
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
    bug(IDS.staleRecipient, 'BUG-SCHEDULED-STALE-RECIPIENT', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-26', IDS.owner, IDS.assigneeProfile, 'ASSIGNED'),
    bug(IDS.staleProfile, 'BUG-SCHEDULED-STALE-PROFILE', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-26', IDS.pm, IDS.assigneeProfile, 'ASSIGNED')
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

  // CAP keeps forUpdate() locks until the root transaction commits; each keyset page must therefore
  // finish its detached CAP transaction before the scheduler starts the next page.
  const pageCandidates = Array.from({ length: 501 }, (_, index) => ({
    ID: `page-boundary-${String(index + 1).padStart(4, '0')}`,
    bugNumber: `PAGE-BOUNDARY-${index + 1}`,
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'LOW',
    severity_code: 'MINOR',
    createdAt: '2026-08-27T00:00:00.000Z',
    dueDate: null,
    nextProcessorUser_ID: null,
    assignee_ID: null
  }))
  const pageStarts = []
  const committedPages = []
  let fallbackCandidatePage = 0
  const candidatePage = pageNumber => pageNumber === 1
    ? pageCandidates.slice(0, 500)
    : pageNumber === 2
      ? pageCandidates.slice(500)
      : []
  const pageTransactionService = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
        return candidatePage(++fallbackCandidatePage)
      }
      return db.run(query)
    },
    tx: (...args) => {
      const callback = typeof args[0] === 'function' ? args[0] : args[1]
      const rootStats = { candidatePageNumber: null }
      return db.tx(async actualTx => {
        // Force a real CAP BEGIN so the callback's completion is followed by CAP COMMIT.
        await actualTx.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ ID: '__page_boundary_probe__' }))
        return callback({
          run: async query => {
            const from = query.SELECT?.from?.ref?.[0]
            if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
              if (rootStats.candidatePageNumber === null) {
                rootStats.candidatePageNumber = ++fallbackCandidatePage
                pageStarts.push({ pageNumber: rootStats.candidatePageNumber, committedBefore: committedPages.length })
              }
              return candidatePage(rootStats.candidatePageNumber)
            }
            if (from === 'idts.cap.Bugs' && query.SELECT.one) return null
            if (from === 'idts.cap.Users' && !query.SELECT.one && JSON.stringify(query.SELECT.where).includes('role_code')) return []
            return actualTx.run(query)
          }
        })
      }).then(result => {
        if (rootStats.candidatePageNumber !== null) committedPages.push(rootStats.candidatePageNumber)
        return result
      })
    }
  }
  await discoverScheduledNotifications({ tx: pageTransactionService, now: BASE_NOW, emailConfig: emailConfig() })
  assert.deepEqual(pageStarts.map(page => page.committedBefore), [0, 1],
    'each bounded scheduler page starts only after the prior CAP page transaction committed')
  assert.deepEqual(committedPages, [1, 2],
    'CAP commits each page transaction before moving to the next keyset page')

  // The protected action path supplies a context-bearing CAP request transaction. CAP's
  // compatibility layer marks a reused plain context after the first root invocation;
  // each page must therefore receive a fresh tenant/user context and invoke its callback.
  await assertContextBearingRequestPath(db, emailConfig())
  await assertContextPageRollback(db, emailConfig())

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
  bulkCandidates[0].status_code = 'PENDING_ASSIGNMENT'
  bulkCandidates[0].dueDate = null
  bulkCandidates[0].nextProcessorUser_ID = null
  bulkCandidates[0].assignee_ID = null
  const bulkCandidateQueries = []
  const bulkCurrentQueries = []
  const bulkHistoryQueries = []
  const bulkProfileQueries = []
  const bulkUserQueries = []
  const bulkPMQueries = []
  const bulkFinalUserLocks = []
  const bulkQueryOrder = []
  const bulkTx = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
        bulkCandidateQueries.push(query)
        bulkQueryOrder.push('candidate-page')
        return bulkCandidateQueries.length === 1 ? bulkCandidates : []
      }
      if (from === 'idts.cap.Bugs' && query.SELECT.one && Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate') && query.SELECT.columns?.length > 1) {
        bulkCurrentQueries.push(query)
        bulkQueryOrder.push('bug-lock')
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
        bulkQueryOrder.push(Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate') ? 'profile-lock' : 'profile-recheck')
        return [{ ID: IDS.assigneeProfile, user_ID: IDS.assigneeUser, active: true }]
      }
      if (from === 'idts.cap.Users' && !query.SELECT.one) {
        if (JSON.stringify(query.SELECT.where).includes('role_code')) {
          bulkPMQueries.push(query)
          bulkQueryOrder.push('user-lock')
          return [{ ID: 'bulk-pm', active: true, role_code: 'PM' }]
        }
        bulkUserQueries.push(query)
        bulkQueryOrder.push(Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate') ? 'user-lock' : 'user-recheck')
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
  assert.equal(bulkCurrentQueries.length, bulkCandidates.length + 1, 'full-page discovery keeps lock-time Bug revalidation for the PM and overdue units')
  assert.ok(bulkHistoryQueries.length >= 1 && bulkHistoryQueries.length <= 3,
    'history anchors are resolved in a bounded number of page bulk queries')
  assert.ok(bulkHistoryQueries.every(query => query.SELECT.limit?.rows?.val <= 500),
    'history anchor bulk queries are individually bounded')
  assert.equal(bulkProfileQueries.length, 3, 'overdue profiles use one preload, one lock and one page-bounded eligibility recheck')
  assert.equal(bulkUserQueries.length, 2, 'overdue recipient users use one lock and one page-bounded eligibility recheck')
  assert.ok(bulkProfileQueries.every(query => query.SELECT.limit?.rows?.val <= 500),
    'overdue profile bulk queries are individually bounded')
  assert.ok(bulkUserQueries.every(query => query.SELECT.limit?.rows?.val <= 1000),
    'overdue user bulk queries are individually bounded')
  assert.equal(bulkProfileQueries.filter(query => Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')).length, 1,
    'one page-bounded profile query acquires the Profile lock')
  assert.ok(bulkProfileQueries.filter(query => !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')).length === 2,
    'profile preload and eligibility recheck stay lock-free')
  assert.ok(bulkUserQueries.some(query => Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')),
    'one page-bounded user query acquires recipient locks before profiles')
  assert.ok(bulkUserQueries.filter(query => !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')).length === 1,
    'user eligibility recheck stays lock-free after Bug revalidation')
  assert.ok(bulkProfileQueries.slice(-1).every(query => !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')),
    'profile eligibility recheck stays lock-free after Bug revalidation')
  const profileLockIndex = bulkQueryOrder.indexOf('profile-lock')
  const bugLockAfterProfile = bulkQueryOrder.indexOf('bug-lock', profileLockIndex + 1)
  const userLockBeforeProfile = bulkQueryOrder.lastIndexOf('user-lock', profileLockIndex - 1)
  assert.ok(userLockBeforeProfile >= 0 && userLockBeforeProfile < profileLockIndex && profileLockIndex < bugLockAfterProfile,
    'overdue scheduler unit acquires User -> Profile -> Bug locks after the PM unit')
  assert.ok(bulkFinalUserLocks.length > 0,
    'each written recipient keeps a final locked User revalidation')
  assert.ok(bulkPMQueries.length > 0 && bulkPMQueries.every(query => query.SELECT.limit?.rows?.val <= 500),
    'active PM discovery reads bounded keyset pages')

  await assertActivePMPageBoundedAndRestart()

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
  await assertStaleProfileSkipped(db, IDS.staleProfile, IDS.assigneeProfile, IDS.assigneeUser,
    'a DeveloperProfile deactivated after bulk resolution is revalidated before notification insert')

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

async function assertStaleProfileSkipped (db, bugID, profileID, recipientID, message) {
  let candidateRead = false
  let profileBulkRead = false
  const tx = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500 && !candidateRead) {
        candidateRead = true
        const rows = await db.run(query)
        return rows.filter(row => row.ID === bugID)
      }
      if (from === 'idts.cap.DeveloperProfiles' && !query.SELECT.one && !profileBulkRead &&
          JSON.stringify(query.SELECT.where).includes(profileID)) {
        profileBulkRead = true
        const rows = await db.run(query)
        await db.run(UPDATE('idts.cap.DeveloperProfiles').set({ active: false }).where({ ID: profileID }))
        return rows
      }
      return db.run(query)
    }
  }
  await discoverScheduledNotifications({ tx, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(profileBulkRead, true, 'race fixture deactivates the profile after its real bulk preload')
  const profile = await db.run(SELECT.one.from('idts.cap.DeveloperProfiles').columns('active').where({ ID: profileID }))
  assert.equal(profile?.active, false, 'race fixture commits the profile deactivation before notification readback')
  assert.equal(await count(db, 'idts.cap.Notifications', { bug_ID: bugID, recipient_ID: recipientID }), 0, message)
}

async function assertActivePMPageBoundedAndRestart () {
  const pageUsers = Array.from({ length: 1001 }, (_, index) => user(
    `f1000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    `PM page ${index + 1}`,
    `pm-page-${index + 1}@example.test`,
    'PM',
    true
  ))
  const bugID = 'f2000000-0000-4000-8000-000000000001'

  const failureFixture = await isolatedSchedulerDatabase()
  await failureFixture.run(INSERT.into('idts.cap.Users').entries([
    user('f3000000-0000-4000-8000-000000000001', 'PM page reporter', 'pm-page-reporter@example.test', 'TESTER', true),
    ...pageUsers
  ]))
  await failureFixture.run(INSERT.into('idts.cap.Bugs').entries(
    bug(bugID, 'BUG-SCHEDULED-PM-PAGES', 'LOW', 'MINOR', BASE_NOW.toISOString(), null, null)
  ))
  const failureState = createActivePMPageState()
  failureState.failAfterPMWritePage = 2
  const failureService = makeActivePMPageService(failureFixture, failureState)
  await assert.rejects(
    () => discoverScheduledNotifications({ tx: failureService, now: BASE_NOW, emailConfig: emailConfig() }),
    /late PM page failure/,
    'a late active-PM page failure is observable'
  )
  assert.equal(await count(failureFixture, 'idts.cap.Notifications', { sourceKey: `PENDING_ASSIGNMENT:${bugID}:${pageUsers[0].ID}` }), 1,
    'the first PM page commits before a later PM page fails')
  assert.equal(await count(failureFixture, 'idts.cap.Notifications', { sourceKey: `PENDING_ASSIGNMENT:${bugID}:${pageUsers[500].ID}` }), 0,
    'the failed PM page rolls back its source-keyed writes')
  assert.ok(failureState.pmPageSizes.length >= 2 && failureState.pmPageSizes.every(size => size <= 500),
    'active PM pages never retain more than 500 recipients')
  assert.ok(failureState.rootStats.some(root => root.committed && root.pmPages.length === 1),
    'a successful PM page is a committed CAP root')

  failureState.failAfterPMWritePage = null
  failureState.failureRaised = false
  failureState.pmPageQueries = 0
  const rerun = await discoverScheduledNotifications({ tx: failureService, now: BASE_NOW, emailConfig: emailConfig() })
  const failureRows = await failureFixture.run(SELECT.from('idts.cap.Notifications').columns('sourceKey').where({ bug_ID: bugID }))
  const pageUserIDs = new Set(pageUsers.map(row => row.ID))
  const pageRows = failureRows.filter(row => [...pageUserIDs].some(ID => row.sourceKey.endsWith(`:${ID}`)))
  assert.equal(pageRows.length, pageUsers.length,
    `rerun completes all active PM recipients through source keys: ${JSON.stringify(rerun)}`)
  assert.equal(new Set(pageRows.map(row => row.sourceKey)).size, pageUsers.length,
    'rerun reuses existing PM source keys without duplicates')
  assert.ok(failureState.rootStats.filter(root => root.committed && root.pmPages.length > 0).length >= 3,
    'each committed PM page has its own CAP transaction root')
  assert.ok(failureState.rootStats.filter(root => root.committed && root.pmPages.length > 0).every(root => root.pmPages.length === 1),
    'no committed root spans multiple active-PM pages')
  assert.ok(failureState.maxUserLocks <= 500 && failureState.maxBugLocks <= 500,
    `scheduler locks stay bounded per candidate page: users=${failureState.maxUserLocks} bugs=${failureState.maxBugLocks}`)
  assert.ok(failureState.rootStats.filter(root => root.pmPages.length > 0).every(root => root.bugLocks.size <= 500),
    'each PM page root holds only the bounded pending candidate page locks')

  await assertPMPageBugRevalidation(pageUsers, bugID, { status_code: 'CLOSED' }, 'closed')
  await assertPMPageBugRevalidation(pageUsers, bugID, { nextProcessorRole_code: 'DEVELOPER' }, 'role-changed')
  await assertPMPageAnchorFrozen(pageUsers)
}

async function assertPMPageBugRevalidation (pageUsers, bugID, mutation, label) {
  const db = await isolatedSchedulerDatabase()
  await db.run(INSERT.into('idts.cap.Users').entries([
    user('f3000000-0000-4000-8000-000000000001', `PM page ${label} reporter`, `pm-page-${label}-reporter@example.test`, 'TESTER', true),
    ...pageUsers
  ]))
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    bug(bugID, `BUG-SCHEDULED-PM-PAGES-${label}`, 'LOW', 'MINOR', BASE_NOW.toISOString(), null, null)
  ))
  const state = createActivePMPageState()
  state.mutatePMPage = 2
  state.mutation = mutation
  const service = makeActivePMPageService(db, state)
  await discoverScheduledNotifications({ tx: service, now: BASE_NOW, emailConfig: emailConfig() })
  const rows = await db.run(SELECT.from('idts.cap.Notifications').columns('recipient_ID').where({ bug_ID: bugID }))
  assert.equal(rows.length, 500,
    `a Bug ${label} between PM pages is revalidated without stale events`)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: `PENDING_ASSIGNMENT:${bugID}:${pageUsers[500].ID}` }), 0,
    `the second PM page emits no stale ${label} event`)
}

async function assertPMPageAnchorFrozen (pageUsers) {
  const db = await isolatedSchedulerDatabase()
  const bugID = 'f2000000-0000-4000-8000-000000000002'
  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.pm, 'PM anchor reporter', 'pm-anchor-reporter@example.test', 'PM', true),
    ...pageUsers
  ]))
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    bug(bugID, 'BUG-SCHEDULED-PM-ANCHOR', 'LOW', 'MINOR', '2026-08-26T00:00:00.000Z', null, null, null)
  ))
  const state = createActivePMPageState()
  state.beforePMPageNumber = 2
  state.beforePMPage = async run => {
    await run(INSERT.into('idts.cap.HistoryEvents').entries({
      ID: 'f5000000-0000-4000-8000-000000000001',
      bug_ID: bugID,
      actor_ID: IDS.pm,
      actorRole_code: 'PM',
      actionType_code: 'EDIT',
      summary: 'Late duplicate pending transition for anchor fixture.',
      createdAt: '2026-08-27T03:59:00.000Z',
      modifiedAt: '2026-08-27T03:59:00.000Z'
    }))
    await run(INSERT.into('idts.cap.HistoryLogs').entries({
      ID: 'f6000000-0000-4000-8000-000000000001',
      bug_ID: bugID,
      event_ID: 'f5000000-0000-4000-8000-000000000001',
      actor_ID: IDS.pm,
      actorRole_code: 'PM',
      actionType_code: 'EDIT',
      fieldName: 'status',
      fieldLabel: 'Status',
      oldValue: 'PENDING_ASSIGNMENT',
      newValue: 'PENDING_ASSIGNMENT',
      createdAt: '2026-08-27T03:59:00.000Z',
      modifiedAt: '2026-08-27T03:59:00.000Z'
    }))
  }
  const service = makeActivePMPageService(db, state)
  await discoverScheduledNotifications({ tx: service, now: BASE_NOW, emailConfig: emailConfig() })
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: `SLA:${bugID}:24h:${pageUsers[500].ID}` }), 1,
    'the immutable SLA anchor is reused across PM roots after a late HistoryLog change')
}

function createActivePMPageState () {
  return {
    pmPageQueries: 0,
    pmPageSizes: [],
    rootStats: [],
    maxUserLocks: 0,
    maxBugLocks: 0,
    failAfterPMWritePage: null,
    currentPMPage: null,
    failureRaised: false,
    mutatePMPage: null,
    mutation: null,
    beforePMPageNumber: null,
    beforePMPage: null
  }
}

function makeActivePMPageService (db, state) {
  const service = {
    run: query => runActivePMPageQuery(db, state, query, null, null),
    tx: (...args) => {
      const callback = typeof args[0] === 'function' ? args[0] : args[1]
      const rootStats = { pmPages: [], userLocks: new Set(), bugLocks: new Set(), committed: false }
      state.rootStats.push(rootStats)
      return db.tx(async actualTx => {
        const root = {
          context: { tenant: 'pm-page-tenant', user: new cds.User({ id: 'pm-page-worker' }) },
          run: query => runActivePMPageQuery(db, state, query, actualTx, rootStats)
        }
        Object.setPrototypeOf(root, service)
        return callback(root)
      }).then(result => {
        rootStats.committed = true
        return result
      })
    }
  }
  return service
}

async function runActivePMPageQuery (db, state, query, actualTx, rootStats) {
  const run = actualTx ? actualTx.run.bind(actualTx) : db.run.bind(db)
  const from = query.SELECT?.from?.ref?.[0]
  if (from === 'idts.cap.Users' && !query.SELECT.one && query.SELECT.limit?.rows?.val === 500 &&
      !Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate') && JSON.stringify(query.SELECT.where).includes('role_code')) {
    const rows = await run(query)
    const pageNumber = ++state.pmPageQueries
    state.currentPMPage = pageNumber
    state.pmPageSizes.push(rows.length)
    if (rootStats) rootStats.pmPages.push(pageNumber)
    if (state.mutatePMPage === pageNumber) await run(UPDATE('idts.cap.Bugs').set(state.mutation).where({ ID: 'f2000000-0000-4000-8000-000000000001' }))
    if (state.beforePMPageNumber === pageNumber && state.beforePMPage) await state.beforePMPage(run, pageNumber)
    return rows
  }
  const insertInto = query.INSERT?.into
  const isNotificationInsert = insertInto === 'idts.cap.Notifications' || insertInto?.ref?.[0] === 'idts.cap.Notifications'
  if (state.failAfterPMWritePage === state.currentPMPage && !state.failureRaised && isNotificationInsert) {
    await run(query)
    state.failureRaised = true
    throw new Error('late PM page failure')
  }
  const result = await run(query)
  if (rootStats && query.SELECT && Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')) {
    const lockSet = from === 'idts.cap.Users' ? rootStats.userLocks : from === 'idts.cap.Bugs' ? rootStats.bugLocks : null
    if (lockSet) {
      for (const row of Array.isArray(result) ? result : [result]) if (row?.ID) lockSet.add(row.ID)
      state.maxUserLocks = Math.max(state.maxUserLocks, rootStats.userLocks.size)
      state.maxBugLocks = Math.max(state.maxBugLocks, rootStats.bugLocks.size)
    }
  }
  return result
}

async function assertContextBearingRequestPath (db, config) {
  const realDb = await isolatedSchedulerDatabase()
  await realDb.run(INSERT.into('idts.cap.Users').entries(user(
    IDS.pm,
    'Context Scheduler PM',
    'context-scheduler-pm@example.test',
    'PM',
    true
  )))
  const pageCandidates = Array.from({ length: 501 }, (_, index) =>
    bug(`f3000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, `CONTEXT-PAGE-${index + 1}`, 'LOW', 'MINOR', BASE_NOW.toISOString(), null, null, null))
  await realDb.run(INSERT.into('idts.cap.Bugs').entries(pageCandidates))
  const candidatePage = pageNumber => pageNumber === 1 ? pageCandidates.slice(0, 500) : pageCandidates.slice(500)
  const pageContexts = []
  const candidatePageStarts = []
  const candidateCommittedPages = []
  const candidateCallbackPages = []
  const requestUser = new cds.User({ id: 'context-scheduler', roles: ['OutboxProcessor'] })
  const request = new cds.Request({
    tenant: 'tenant-context-test',
    user: requestUser,
    data: { now: BASE_NOW.toISOString() }
  })
  const servicePrototype = Object.getPrototypeOf(realDb)
  const originalServiceTx = servicePrototype.tx
  const previousDb = cds.db
  let candidatePageNumber = 0
  servicePrototype.tx = function (...args) {
    const callback = typeof args[0] === 'function' ? args[0] : args[1]
    const context = typeof args[0] === 'function' ? null : args[0]
    if (typeof callback !== 'function' || !context?.tenant) return originalServiceTx.apply(this, args)
    const rootStats = { candidatePageNumber: null }
    pageContexts.push(context)
    return originalServiceTx.call(this, context, async pageTx => {
      const wrappedPageTx = {
        run: async query => {
          if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
            if (rootStats.candidatePageNumber === null) {
              rootStats.candidatePageNumber = ++candidatePageNumber
              candidatePageStarts.push({ pageNumber: rootStats.candidatePageNumber, committedBefore: candidateCommittedPages.length })
              candidateCallbackPages.push(rootStats.candidatePageNumber)
            }
            return candidatePage(rootStats.candidatePageNumber)
          }
          return pageTx.run(query)
        }
      }
      return callback(wrappedPageTx)
    }).then(result => {
      if (rootStats.candidatePageNumber !== null) candidateCommittedPages.push(rootStats.candidatePageNumber)
      return result
    })
  }
  cds.db = realDb
  try {
    await processNotificationSchedules(request)
  } finally {
    servicePrototype.tx = originalServiceTx
    cds.db = previousDb
  }

  assert.deepEqual(candidateCallbackPages, [1, 2],
    'protected CAP request path invokes both bounded page callbacks')
  assert.deepEqual(candidateCommittedPages, [1, 2],
    'protected CAP request path commits page one before page two')
  assert.ok(new Set(pageContexts).size >= 2,
    'each detached candidate/PM page receives a fresh CAP transaction context object')
  assert.ok(pageContexts.every(context => context.tenant === 'tenant-context-test' && context.user === requestUser),
    'tenant and user context propagate to every detached page root')
  assert.deepEqual(candidatePageStarts.map(page => page.committedBefore), [0, 1],
    'real CAP page roots commit before the next page starts')
  assert.ok(await count(realDb, 'idts.cap.Notifications', { bug_ID: pageCandidates[0].ID }) >= 1,
    'real CAP request path persists page-one notification work')
  assert.ok(await count(realDb, 'idts.cap.Notifications', { bug_ID: pageCandidates.at(-1).ID }) >= 1,
    'real CAP request path persists page-two notification work')
  assert.equal(config.enabled, true, 'context-path fixture keeps the existing email policy')
}

async function assertContextPageRollback (db, config) {
  const realDb = await isolatedSchedulerDatabase()
  await realDb.run(INSERT.into('idts.cap.Users').entries(user(
    IDS.pm,
    'Rollback Scheduler PM',
    'rollback-scheduler-pm@example.test',
    'PM',
    true
  )))
  const pageBugs = Array.from({ length: 501 }, (_, index) =>
    bug(`f4000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, `CONTEXT-ROLLBACK-${index + 1}`, 'LOW', 'MINOR', BASE_NOW.toISOString(), null, null, null))
  await realDb.run(INSERT.into('idts.cap.Bugs').entries(pageBugs))
  const candidatePage = pageNumber => pageNumber === 1 ? pageBugs.slice(0, 500) : pageBugs.slice(500)

  const pageContexts = []
  const candidatePageStarts = []
  const candidateCommittedPages = []
  const candidateCallbackPages = []
  const requestUser = new cds.User({ id: 'context-rollback-scheduler', roles: ['OutboxProcessor'] })
  const request = new cds.Request({
    tenant: 'tenant-context-rollback',
    user: requestUser,
    data: { now: BASE_NOW.toISOString() }
  })
  const servicePrototype = Object.getPrototypeOf(realDb)
  const originalServiceTx = servicePrototype.tx
  const previousDb = cds.db
  let candidatePageNumber = 0
  servicePrototype.tx = function (...args) {
    const callback = typeof args[0] === 'function' ? args[0] : args[1]
    const context = typeof args[0] === 'function' ? null : args[0]
    if (typeof callback !== 'function' || !context?.tenant) return originalServiceTx.apply(this, args)
    const rootStats = { candidatePageNumber: null }
    pageContexts.push(context)
    return originalServiceTx.call(this, context, async pageTx => {
      const wrappedPageTx = {
        run: async query => {
          if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
            if (rootStats.candidatePageNumber === null) {
              rootStats.candidatePageNumber = ++candidatePageNumber
              candidatePageStarts.push({ pageNumber: rootStats.candidatePageNumber, committedBefore: candidateCommittedPages.length })
              candidateCallbackPages.push(rootStats.candidatePageNumber)
            }
            return candidatePage(rootStats.candidatePageNumber)
          }
          return pageTx.run(query)
        }
      }
      const result = await callback(wrappedPageTx)
      if (rootStats.candidatePageNumber === 2) throw Object.assign(new Error('scheduled page failure fixture'), { code: 'PAGE_FAILURE_FIXTURE' })
      return result
    }).then(result => {
      if (rootStats.candidatePageNumber !== null) candidateCommittedPages.push(rootStats.candidatePageNumber)
      return result
    })
  }
  cds.db = realDb
  try {
    await assert.rejects(() => processNotificationSchedules(request), /scheduled page failure fixture/)
  } finally {
    servicePrototype.tx = originalServiceTx
    cds.db = previousDb
  }

  const firstSource = `PENDING_ASSIGNMENT:${pageBugs[0].ID}:${IDS.pm}`
  const secondSource = `PENDING_ASSIGNMENT:${pageBugs[500].ID}:${IDS.pm}`
  assert.equal(await count(realDb, 'idts.cap.Notifications', { sourceKey: firstSource }), 1,
    'page one source/inbox write survives a later page failure')
  assert.equal(await count(realDb, 'idts.cap.Notifications', { sourceKey: secondSource }), 0,
    'failed page source/inbox write rolls back as one CAP unit')
  assert.deepEqual(candidateCallbackPages, [1, 2],
    'the failing page callback still runs before its root transaction rolls back')
  assert.deepEqual(candidateCommittedPages, [1],
    'only the successful first page commits')
  assert.ok(new Set(pageContexts).size >= 2,
    'rollback path also receives a fresh context per detached root page')
  assert.ok(pageContexts.every(context => context.tenant === request.tenant && context.user === request.user),
    'rollback path preserves tenant and user context')
  assert.deepEqual(candidatePageStarts.map(page => page.committedBefore), [0, 1],
    'rollback path starts page two only after page one commits')
  assert.equal(config.enabled, true, 'rollback fixture keeps the existing email policy')
}

async function isolatedSchedulerDatabase () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const isolated = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(isolated)
  return isolated
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
