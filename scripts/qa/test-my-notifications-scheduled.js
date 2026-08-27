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
  closed: 'a3000000-0000-4000-8000-000000000004'
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
    bug(IDS.closed, 'BUG-SCHEDULED-CLOSED', 'CRITICAL', 'BLOCKER', '2026-08-20T00:00:00.000Z', '2026-08-20', IDS.owner, IDS.assigneeProfile, 'CLOSED')
  ]))

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

  const overdueOwner = await notificationBySource(db, `OVERDUE:${IDS.overdue}:2026-08-26:${IDS.owner}`)
  const overdueAssignee = await notificationBySource(db, `OVERDUE:${IDS.overdue}:2026-08-26:${IDS.assigneeUser}`)
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
  await discoverScheduledNotifications({ tx: db, now: BASE_NOW, emailConfig: emailConfig() })
  assert.ok(await notificationBySource(db, `OVERDUE:${IDS.overdue}:2026-08-25:${IDS.owner}`),
    'changing dueDate establishes a new overdue cycle')

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

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1600))
  process.exit(1)
})
