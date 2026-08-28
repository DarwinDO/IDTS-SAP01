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
  buildDigestSnapshot,
  isDigestScheduleDue,
  processNotificationDigestDeliveries,
  scheduleNotificationDigests
} = require('../../srv/notification/digest')
const { processEmailOutboxBatch } = require('../../srv/email/worker')
const { processNotificationSchedules } = require('../../srv/notification/scheduled')

const IDS = Object.freeze({
  pm: 'b1000000-0000-4000-8000-000000000001',
  developer: 'b1000000-0000-4000-8000-000000000002',
  tester: 'b1000000-0000-4000-8000-000000000003',
  idle: 'b1000000-0000-4000-8000-000000000004',
  developerProfile: 'b2000000-0000-4000-8000-000000000001',
  pending: 'b3000000-0000-4000-8000-000000000001',
  urgent: 'b3000000-0000-4000-8000-000000000002',
  developerOverdue: 'b3000000-0000-4000-8000-000000000003',
  testerAwaiting: 'b3000000-0000-4000-8000-000000000004',
  closed: 'b3000000-0000-4000-8000-000000000005',
  future: 'b3000000-0000-4000-8000-000000000006',
  unsafe: 'b3000000-0000-4000-8000-000000000007',
  unique: 'b1000000-0000-4000-8000-000000000005',
  uniqueBug: 'b3000000-0000-4000-8000-000000000008'
})

const SNAPSHOT_AT = new Date('2026-08-28T01:00:00.000Z')
const BUSINESS_DATE = '2026-08-28'

function enabledConfig (overrides = {}) {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    secure: false,
    username: 'digest-test-user',
    password: 'digest-test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Digest Test',
    baseUrl: 'https://idts.example.test',
    maxRetryCount: 2,
    batchSize: 10,
    pollIntervalMs: 15000,
    maxConnections: 3,
    ...overrides
  })
}

async function count (db, entity, where = {}) {
  const row = await db.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

async function main () {
  const source = fs.readFileSync(path.join(__dirname, '../../srv/notification/digest.js'), 'utf8')
  assert.match(source, /Intl\.DateTimeFormat\(['"]en-CA['"],\s*\{\s*timeZone:\s*['"]Asia\/Bangkok['"]/,
    'digest date derivation is explicitly Bangkok-local')
  assert.match(source, /NotificationDigestDeliveries/,
    'digest implementation writes only the stored digest delivery entity')

  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  cds.db = db

  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.pm, 'Digest PM', 'digest-pm@example.test', 'PM'),
    user(IDS.developer, 'Digest Developer', 'digest-developer@example.test', 'DEVELOPER'),
    user(IDS.tester, 'Digest Tester', 'digest-tester@example.test', 'TESTER'),
    user(IDS.idle, 'Digest Idle', 'digest-idle@example.test', 'TESTER')
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: IDS.developerProfile,
    user_ID: IDS.developer,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 5,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(IDS.pending, 'BUG-DIGEST-PENDING', 'LOW', 'MINOR', '2026-08-27T00:00:00.000Z', null, IDS.pm, null, 'PENDING_ASSIGNMENT'),
    bug(IDS.urgent, 'BUG-DIGEST-CRITICAL', 'CRITICAL', 'BLOCKER', '2026-08-27T00:00:00.000Z', null, IDS.developer, IDS.developerProfile, 'ASSIGNED'),
    bug(IDS.developerOverdue, 'BUG-DIGEST-DEVELOPER-OVERDUE', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, IDS.developerProfile, 'ASSIGNED'),
    bug(IDS.testerAwaiting, 'BUG-DIGEST-TESTER-AWAITING', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-09-04', IDS.tester, null, 'RETEST_REQUIRED'),
    bug(IDS.closed, 'BUG-DIGEST-CLOSED', 'CRITICAL', 'BLOCKER', '2026-08-26T00:00:00.000Z', '2026-08-27', IDS.pm, null, 'CLOSED'),
    bug(IDS.future, 'BUG-DIGEST-FUTURE', 'CRITICAL', 'BLOCKER', '2026-08-28T02:00:00.000Z', null, IDS.pm, null, 'ASSIGNED'),
    bug(IDS.unsafe, '<script>alert(1)</script>', 'MEDIUM', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, IDS.developerProfile, 'ASSIGNED', '<img src=x onerror=alert(2)>')
  ]))

  // Schedule boundaries are local to Bangkok, not UTC. 07:59 does nothing; 08:00 Friday creates rows.
  assert.equal(isDigestScheduleDue(new Date('2026-08-28T00:59:59.000Z')), false,
    '07:59 Bangkok is before the digest boundary')
  assert.equal(isDigestScheduleDue(SNAPSHOT_AT), true,
    '08:00 Bangkok on a weekday is a digest boundary')
  assert.equal(isDigestScheduleDue(new Date('2026-08-29T01:00:00.000Z')), false,
    'Saturday 08:00 Bangkok does not run the weekday digest')
  await scheduleNotificationDigests({ tx: db, now: new Date('2026-08-28T00:59:59.000Z') })
  assert.equal(await count(db, 'idts.cap.NotificationDigestDeliveries'), 0,
    'before the boundary no digest delivery is inserted')
  await scheduleNotificationDigests({ tx: db, now: SNAPSHOT_AT })

  const scheduledCount = await count(db, 'idts.cap.NotificationDigestDeliveries')
  const scheduledRows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').columns('recipient_ID', 'itemCount').where({ businessDate: BUSINESS_DATE }))
  assert.ok(scheduledCount >= 3,
    'PM, Developer and Tester recipients with actionable items receive a digest')
  assert.ok(scheduledRows.some(row => row.recipient_ID === IDS.pm) &&
    scheduledRows.some(row => row.recipient_ID === IDS.developer) &&
    scheduledRows.some(row => row.recipient_ID === IDS.tester),
  'controlled PM, Developer and Tester recipients are scheduled')
  assert.equal(scheduledRows.filter(row => row.recipient_ID === IDS.idle).length, 0,
    'an active controlled recipient with no actionable items has no empty digest')
  await scheduleNotificationDigests({ tx: db, now: SNAPSHOT_AT })
  assert.equal(await count(db, 'idts.cap.NotificationDigestDeliveries'), scheduledCount,
    'same recipient/date/type schedule rerun reuses one stored delivery')
  await scheduleNotificationDigests({ tx: db, now: new Date('2026-08-29T01:00:00.000Z') })
  assert.equal(await count(db, 'idts.cap.NotificationDigestDeliveries'), scheduledCount,
    'weekend schedule does not create a new digest')

  const pmSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.pm, role_code: 'PM' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  const developerSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.developer, role_code: 'DEVELOPER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  const testerSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.tester, role_code: 'TESTER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  const idleSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.idle, role_code: 'TESTER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })

  assert.ok(pmSnapshot.textBody.includes('BUG-DIGEST-PENDING'), 'PM sees pending assignment work')
  assert.ok(pmSnapshot.textBody.includes('BUG-DIGEST-CRITICAL'), 'PM sees unresolved Critical/Blocker work')
  assert.doesNotMatch(pmSnapshot.textBody, /BUG-DIGEST-CLOSED|BUG-DIGEST-FUTURE/, 'PM snapshot excludes completed and future rows')
  assert.ok(developerSnapshot.textBody.includes('BUG-DIGEST-DEVELOPER-OVERDUE'), 'Developer sees assigned overdue work')
  assert.ok(developerSnapshot.textBody.includes('<script>'), 'text output keeps source text readable without affecting HTML safety')
  assert.doesNotMatch(developerSnapshot.textBody, /BUG-DIGEST-PENDING|BUG-DIGEST-TESTER-AWAITING/, 'Developer does not receive PM-only or Tester-only work')
  assert.ok(testerSnapshot.textBody.includes('BUG-DIGEST-TESTER-AWAITING'), 'Tester sees the item awaiting that user')
  assert.doesNotMatch(testerSnapshot.textBody, /BUG-DIGEST-DEVELOPER-OVERDUE|BUG-DIGEST-PENDING/, 'Tester does not receive another persona’s work')
  assert.equal(idleSnapshot, null, 'an active recipient with no actionable items gets no empty digest')

  const criticalPosition = pmSnapshot.textBody.indexOf('BUG-DIGEST-CRITICAL')
  const pendingPosition = pmSnapshot.textBody.indexOf('BUG-DIGEST-PENDING')
  assert.ok(criticalPosition >= 0 && criticalPosition < pendingPosition,
    'digest items are ordered by highest business priority first')
  assert.ok(developerSnapshot.htmlBody.includes('/idtsbugmanagementui/index.html#/Bugs('),
    'item links use the allowlisted Bug Management route')
  assert.doesNotMatch(developerSnapshot.htmlBody, /<script>|<img\b/i,
    'untrusted title/content cannot inject HTML markup')
  assert.match(developerSnapshot.htmlBody, /&lt;script&gt;|&lt;img/i,
    'unsafe source text is escaped into the HTML snapshot')

  const moreBugs = Array.from({ length: 21 }, (_, index) =>
    bug(uuidFromIndex(400 + index), `BUG-DIGEST-MORE-${String(index + 1).padStart(2, '0')}`, 'LOW', 'MINOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, IDS.developerProfile, 'ASSIGNED'))
  await db.run(INSERT.into('idts.cap.Bugs').entries(moreBugs))
  const moreSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.developer, role_code: 'DEVELOPER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  assert.equal(moreSnapshot.itemCount, 24, 'snapshot retains the full actionable count')
  assert.equal(moreSnapshot.items.length, 20, 'snapshot renders no more than twenty items')
  assert.match(moreSnapshot.textBody, /and 4 more/i, 'snapshot reports the unrendered remainder')
  assert.match(moreSnapshot.htmlBody, /href="[^"]*\/idtsbugmanagementui\/index\.html[^\"]*"[^>]*>Open filtered queue<\/a>/,
    'remainder uses an allowlisted filtered queue link')
  const cappedSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.developer, role_code: 'DEVELOPER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 50
  })
  assert.equal(cappedSnapshot.items.length, 20, 'caller-provided limit cannot exceed the digest maximum')

  // The unique-key path must reuse only the exact digest conflict and propagate another insert error.
  const existingDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDigestDeliveries').where({
    recipient_ID: IDS.pm,
    businessDate: BUSINESS_DATE,
    digestType: 'DAILY'
  }))
  await db.run(INSERT.into('idts.cap.Users').entries(user(IDS.unique, 'Digest Unique', 'digest-unique@example.test', 'TESTER')))
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    bug(IDS.uniqueBug, 'BUG-DIGEST-UNIQUE', 'LOW', 'MINOR', '2026-08-30T00:00:00.000Z', '2026-08-30', IDS.unique, null, 'RETEST_REQUIRED')
  ))
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({
    ID: cds.utils.uuid(),
    recipient_ID: IDS.unique,
    businessDate: '2026-08-31',
    digestType: 'DAILY',
    windowStart: '2026-08-30T17:00:00.000Z',
    windowEnd: '2026-08-31T01:00:00.000Z',
    snapshotAt: '2026-08-31T01:00:00.000Z',
    itemCount: 1,
    subject: 'Existing unique digest',
    textBody: 'Existing unique digest',
    htmlBody: '<p>Existing unique digest</p>',
    status_code: 'PENDING'
  }))
  let digestLookupCount = 0
  const uniqueTx = {
    run: async query => {
      const digestWhere = JSON.stringify(query.SELECT?.where || '')
      const targetsUnique = digestWhere.includes(IDS.unique) && digestWhere.includes('2026-08-31')
      if (targetsUnique && query.SELECT?.from?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries' && query.SELECT.one) {
        digestLookupCount += 1
        if (digestLookupCount === 1) return undefined
      }
      const insertDigest = query.INSERT?.into === 'idts.cap.NotificationDigestDeliveries' || query.INSERT?.into?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries'
      if (insertDigest && targetsUnique) {
        throw Object.assign(new Error('UNIQUE constraint failed: NotificationDigestDeliveries.recipient_ID,businessDate,digestType'), {
          code: 'SQLITE_CONSTRAINT_UNIQUE'
        })
      }
      return db.run(query)
    }
  }
  const reused = await scheduleNotificationDigests({ tx: uniqueTx, now: new Date('2026-08-31T01:00:00.000Z') })
  assert.ok(reused.reused >= 1, 'exact digest unique conflict re-reads and reuses the existing row')
  const errorTx = {
    run: async query => {
      if (query.INSERT?.into === 'idts.cap.NotificationDigestDeliveries' || query.INSERT?.into?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries') {
        throw Object.assign(new Error('unrelated insert failure'), { code: 'SQLITE_CONSTRAINT_NOT_NULL' })
      }
      return db.run(query)
    }
  }
  await db.run(UPDATE('idts.cap.NotificationDigestDeliveries').set({
    status_code: 'SENT',
    sentAt: SNAPSHOT_AT.toISOString()
  }).where({ ID: existingDelivery.ID }))
  await assert.rejects(
    () => scheduleNotificationDigests({ tx: errorTx, now: new Date('2026-09-01T01:00:00.000Z') }),
    /unrelated insert failure/,
    'a non-unique digest insert error is not swallowed as idempotency'
  )

  const retryDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDigestDeliveries').where({
    recipient_ID: IDS.developer,
    businessDate: BUSINESS_DATE,
    digestType: 'DAILY'
  }))
  const storedText = retryDelivery.textBody
  const storedHtml = retryDelivery.htmlBody
  const otherDigestRows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').where({
    businessDate: BUSINESS_DATE,
    ID: { '!=': retryDelivery.ID }
  }))
  for (const row of otherDigestRows) {
    await db.run(UPDATE('idts.cap.NotificationDigestDeliveries').set({
      status_code: 'SENT',
      sentAt: SNAPSHOT_AT.toISOString()
    }).where({ ID: row.ID }))
  }
  await db.run(UPDATE('idts.cap.NotificationDigestDeliveries').set({
    status_code: 'FAILED',
    attemptCount: 0,
    nextAttemptAt: '2026-08-28T00:00:00.000Z',
    lastErrorCode: 'ESOCKET',
    lastErrorSummary: 'prior failure'
  }).where({ ID: retryDelivery.ID }))
  await db.run(UPDATE('idts.cap.Bugs').set({
    title: 'Changed after digest snapshot'
  }).where({ ID: IDS.developerOverdue }))
  const failedRetryMessages = []
  await processNotificationDigestDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async message => {
      failedRetryMessages.push(message)
      throw Object.assign(new Error('smtp.private.local digest-test-password'), { code: 'ESOCKET' })
    },
    now: new Date('2026-08-28T01:01:00.000Z'),
    workerID: 'digest-failure-worker'
  })
  const failedRetry = await db.run(SELECT.one.from('idts.cap.NotificationDigestDeliveries').where({ ID: retryDelivery.ID }))
  assert.equal(failedRetry.status_code, 'FAILED', 'provider failure leaves the digest row retryable')
  assert.equal(failedRetry.lastErrorCode, 'ESOCKET')
  assert.equal(failedRetry.lastErrorSummary, 'SMTP connection failed.', 'digest provider failure is sanitized')
  assert.equal(failedRetryMessages.length, 1)
  await db.run(UPDATE('idts.cap.NotificationDigestDeliveries').set({
    nextAttemptAt: '2026-08-28T00:00:00.000Z'
  }).where({ ID: retryDelivery.ID }))
  const retryMessages = []
  await processNotificationDigestDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async message => {
      retryMessages.push(message)
      return { messageId: 'digest-retry-message' }
    },
    now: new Date('2026-08-28T01:01:00.000Z'),
    workerID: 'digest-retry-worker'
  })
  const retriedDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDigestDeliveries').where({ ID: retryDelivery.ID }))
  assert.equal(retriedDelivery.status_code, 'SENT', 'stored digest failure is retried successfully')
  assert.equal(retryMessages.length, 1, 'only the due digest row is sent in the focused retry')
  assert.equal(retryMessages[0].text, storedText, 'retry sends the stored text snapshot')
  assert.equal(retryMessages[0].html, storedHtml, 'retry sends the stored HTML snapshot')
  assert.equal(await count(db, 'idts.cap.Notifications', { message: { like: '%digest%' } }), 0,
    'digest delivery failure/retry creates no end-user failure notification')

  // The protected scheduler action owns the schedule hook; it still uses the same persisted digest contract.
  const schedulerRequest = new cds.Request({
    user: new cds.User({ id: 'digest-scheduler', roles: ['OutboxProcessor'] }),
    data: { now: '2026-08-31T01:00:00.000Z' }
  })
  await processNotificationSchedules(schedulerRequest)
  assert.ok(await count(db, 'idts.cap.NotificationDigestDeliveries', { businessDate: '2026-08-31' }) >= 1,
    'protected scheduled action invokes weekday digest generation')

  const senderRefs = []
  let senderCreates = 0
  let senderCloses = 0
  const batchResult = await processEmailOutboxBatch({
    tx: db,
    dependencies: {
      emailConfig: enabledConfig(),
      invitationConfig: { ready: false },
      createSender: () => {
        senderCreates += 1
        return {
          sendMail: async () => ({ messageId: 'shared-sender-message' }),
          close: () => { senderCloses += 1 }
        }
      },
      processNotifications: async ({ sendMail }) => {
        senderRefs.push(sendMail)
        return { sent: 0, failed: 0, skipped: 0 }
      },
      processAccess: async ({ sendMail }) => {
        senderRefs.push(sendMail)
        return { sent: 0, failed: 0, skipped: 0 }
      },
      processDigests: async ({ sendMail }) => {
        senderRefs.push(sendMail)
        return { sent: 1, failed: 0, skipped: 0 }
      }
    }
  })
  assert.equal(batchResult.sent, 1, 'worker includes injected digest processing in one batch result')
  assert.equal(senderCreates, 1, 'worker creates one sender for all delivery types')
  assert.equal(senderCloses, 1, 'worker closes the shared sender once after the batch')
  assert.equal(new Set(senderRefs).size, 1, 'notifications/access/digests receive the same sender-backed sendMail')

  console.log('IDTS My Notifications digest contract: PASS')
}

function user (ID, displayName, email, role_code) {
  return { ID, displayName, email, role_code, active: true }
}

function bug (ID, bugNumber, priority_code, severity_code, createdAt, dueDate, nextProcessorUser_ID, assignee_ID, status_code, title = `${bugNumber} digest fixture`) {
  return {
    ID,
    bugNumber,
    title,
    description: 'Digest fixture.',
    status_code,
    priority_code,
    severity_code,
    environment_code: 'QAS',
    environmentDetail: 'Digest QA',
    stepsToReproduce: 'Run digest QA.',
    actualResult: 'Digest fixture is actionable.',
    expectedResult: 'Digest fixture appears only for its owner or PM policy.',
    applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
    defectCategory_ID: '50000000-0000-0000-0000-000000000001',
    componentCategory_ID: '60000000-0000-0000-0000-000000000001',
    reporter_ID: IDS.tester,
    assignee_ID: assignee_ID || null,
    nextProcessorUser_ID: nextProcessorUser_ID || null,
    nextProcessorRole_code: nextProcessorUser_ID ? 'DEVELOPER' : null,
    plannedCompletionDate: dueDate,
    dueDate,
    estimatedEffortHours: '2.00',
    createdAt,
    modifiedAt: createdAt
  }
}

function uuidFromIndex (index) {
  return `b3000000-0000-4000-8000-${String(index).padStart(12, '0')}`
}

main().catch(error => {
  console.error('IDTS My Notifications digest contract: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
