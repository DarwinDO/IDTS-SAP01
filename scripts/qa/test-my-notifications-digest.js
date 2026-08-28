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
  pendingTransition: 'b3000000-0000-4000-8000-000000000009',
  roleMismatch: 'b3000000-0000-4000-8000-000000000010',
  strayRetest: 'b3000000-0000-4000-8000-000000000011',
  strayProfile: 'b3000000-0000-4000-8000-000000000012',
  strayTesterProfile: 'b2000000-0000-4000-8000-000000000002',
  unique: 'b1000000-0000-4000-8000-000000000005',
  uniqueBug: 'b3000000-0000-4000-8000-000000000008',
  personaPmTester: 'b6000000-0000-4000-8000-000000000001',
  personaPmDeveloper: 'b6000000-0000-4000-8000-000000000002',
  personaDeveloperTester: 'b6000000-0000-4000-8000-000000000003',
  personaDeveloperPm: 'b6000000-0000-4000-8000-000000000004',
  personaTesterDeveloper: 'b6000000-0000-4000-8000-000000000005',
  personaTesterPm: 'b6000000-0000-4000-8000-000000000006',
  personaInactivePm: 'b6000000-0000-4000-8000-000000000007',
  personaDeveloperTesterProfile: 'b7000000-0000-4000-8000-000000000001',
  personaDeveloperPmProfile: 'b7000000-0000-4000-8000-000000000002',
  personaInactivePmProfile: 'b7000000-0000-4000-8000-000000000003'
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
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: IDS.strayTesterProfile,
    user_ID: IDS.tester,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 5,
    active: true
  }))
  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(IDS.pending, 'BUG-DIGEST-PENDING', 'LOW', 'MINOR', '2026-08-27T00:00:00.000Z', null, IDS.pm, null, 'PENDING_ASSIGNMENT'),
    bug(IDS.urgent, 'BUG-DIGEST-CRITICAL', 'CRITICAL', 'BLOCKER', '2026-08-27T00:00:00.000Z', null, IDS.developer, IDS.developerProfile, 'ASSIGNED'),
    bug(IDS.developerOverdue, 'BUG-DIGEST-DEVELOPER-OVERDUE', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, IDS.developerProfile, 'ASSIGNED'),
    bug(IDS.testerAwaiting, 'BUG-DIGEST-TESTER-AWAITING', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-09-04', IDS.tester, null, 'RETEST_REQUIRED', 'BUG-DIGEST-TESTER-AWAITING digest fixture', 'TESTER', IDS.tester),
    bug(IDS.closed, 'BUG-DIGEST-CLOSED', 'CRITICAL', 'BLOCKER', '2026-08-26T00:00:00.000Z', '2026-08-27', IDS.pm, null, 'CLOSED'),
    bug(IDS.future, 'BUG-DIGEST-FUTURE', 'CRITICAL', 'BLOCKER', '2026-08-28T02:00:00.000Z', null, IDS.pm, null, 'ASSIGNED'),
    bug(IDS.unsafe, '<script>alert(1)</script>', 'MEDIUM', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, IDS.developerProfile, 'ASSIGNED', '<img src=x onerror=alert(2)>'),
    bug(IDS.pendingTransition, 'BUG-DIGEST-PENDING-RECENT', 'LOW', 'MINOR', '2026-08-20T00:00:00.000Z', null, IDS.pm, null, 'PENDING_ASSIGNMENT', 'Pending Assignment was entered recently', 'PM'),
    bug(IDS.roleMismatch, 'BUG-DIGEST-ROLE-MISMATCH', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.tester, null, 'ASSIGNED', 'Mismatched next processor role', 'DEVELOPER'),
    bug(IDS.strayRetest, 'BUG-DIGEST-STRAY-RETEST', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', IDS.developer, null, 'ASSIGNED', 'Retest owner on wrong status', 'DEVELOPER', IDS.tester),
    bug(IDS.strayProfile, 'BUG-DIGEST-STRAY-PROFILE', 'HIGH', 'MAJOR', '2026-08-27T00:00:00.000Z', '2026-08-27', null, IDS.strayTesterProfile, 'ASSIGNED', 'Tester has a developer profile', null)
  ]))
  await addPendingAssignmentHistory(db, IDS.pendingTransition)

  // Schedule boundaries are local to Bangkok, not UTC. 07:59 does nothing; 08:00 Friday creates rows.
  assert.equal(isDigestScheduleDue(new Date('2026-08-28T00:59:59.000Z')), false,
    '07:59 Bangkok is before the digest boundary')
  assert.equal(isDigestScheduleDue(SNAPSHOT_AT), true,
    '08:00 Bangkok on a weekday is a digest boundary')
  assert.equal(isDigestScheduleDue(new Date('2026-08-28T01:01:00.000Z')), true,
    '08:01 Bangkok remains inside the weekday recovery hour')
  assert.equal(isDigestScheduleDue(new Date('2026-08-28T01:59:00.000Z')), true,
    '08:59 Bangkok remains inside the weekday recovery hour')
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
  await scheduleNotificationDigests({ tx: db, now: new Date('2026-08-28T01:59:00.000Z') })
  assert.equal(await count(db, 'idts.cap.NotificationDigestDeliveries'), scheduledCount,
    'late invocation in the same Bangkok recovery hour remains idempotent')
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
  const recentPending = pmSnapshot.items.find(item => item.ID === IDS.pendingTransition)
  assert.ok(recentPending, 'PM snapshot retains a recently pending-assignment Bug')
  assert.doesNotMatch(recentPending.reason, /SLA breached/, 'PM SLA age starts at the latest Pending Assignment transition')
  assert.doesNotMatch(pmSnapshot.textBody, /BUG-DIGEST-CLOSED|BUG-DIGEST-FUTURE/, 'PM snapshot excludes completed and future rows')
  assert.ok(developerSnapshot.textBody.includes('BUG-DIGEST-DEVELOPER-OVERDUE'), 'Developer sees assigned overdue work')
  assert.ok(developerSnapshot.textBody.includes('<script>'), 'text output keeps source text readable without affecting HTML safety')
  assert.doesNotMatch(developerSnapshot.textBody, /BUG-DIGEST-PENDING|BUG-DIGEST-TESTER-AWAITING/, 'Developer does not receive PM-only or Tester-only work')
  assert.ok(testerSnapshot.textBody.includes('BUG-DIGEST-TESTER-AWAITING'), 'Tester sees the item awaiting that user')
  assert.doesNotMatch(testerSnapshot.textBody, /BUG-DIGEST-DEVELOPER-OVERDUE|BUG-DIGEST-PENDING/, 'Tester does not receive another persona’s work')
  assert.doesNotMatch(testerSnapshot.textBody, /BUG-DIGEST-ROLE-MISMATCH/, 'Tester does not receive a role-mismatched next processor row')
  assert.doesNotMatch(testerSnapshot.textBody, /BUG-DIGEST-STRAY-RETEST/, 'Tester does not receive a retest owner outside Retest Required')
  assert.doesNotMatch(testerSnapshot.textBody, /BUG-DIGEST-STRAY-PROFILE/, 'Tester is never treated as a DeveloperProfile owner')
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
  assert.equal(moreSnapshot.itemCount, 25, 'snapshot retains the full actionable count')
  assert.equal(moreSnapshot.items.length, 20, 'snapshot renders no more than twenty items')
  assert.match(moreSnapshot.textBody, /and 5 more/i, 'snapshot reports the unrendered remainder')
  assert.match(moreSnapshot.htmlBody, /href="[^"]*\/idtsbugmanagementui\/index\.html[^\"]*"[^>]*>Open filtered queue<\/a>/,
    'remainder uses an allowlisted filtered queue link')
  assert.match(moreSnapshot.htmlBody, /exclude_closed=true/,
    'remainder queue link uses a filter understood by the existing ListReport consumer')
  assert.match(moreSnapshot.htmlBody, new RegExp(`nextProcessorUser_ID=${IDS.developer}`),
    'Developer remainder queue link scopes to the current action owner consumer filter')
  assert.doesNotMatch(moreSnapshot.htmlBody, /filter=digest-(?:pm|my-action)/,
    'remainder queue link does not advertise an unknown filter token')
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
    businessDate: BUSINESS_DATE
  }))
  await db.run(INSERT.into('idts.cap.Users').entries(user(IDS.unique, 'Digest Unique', 'digest-unique@example.test', 'TESTER')))
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    bug(IDS.uniqueBug, 'BUG-DIGEST-UNIQUE', 'LOW', 'MINOR', '2026-08-30T00:00:00.000Z', '2026-08-30', IDS.unique, null, 'RETEST_REQUIRED', 'BUG-DIGEST-UNIQUE digest fixture', 'TESTER', IDS.unique)
  ))
  const uniqueDeliveryID = cds.utils.uuid()
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({
    ID: uniqueDeliveryID,
    recipient_ID: IDS.unique,
    businessDate: '2026-08-31',
    digestType: digestTypeFor('TESTER'),
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
  let independentReads = 0
  let winnerReads = 0
  const uniqueService = {
    tx: (context, callback) => {
      independentReads += 1
      return callback({
        run: async query => {
          const where = JSON.stringify(query.SELECT?.where || '')
          const winnerRead = query.SELECT?.from?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries' &&
            query.SELECT.one && where.includes(IDS.unique) && where.includes('2026-08-31') && digestLookupCount >= 2
          if (winnerRead) winnerReads += 1
          return uniqueTx.run(query)
        }
      })
    }
  }
  const uniqueTx = Object.create(uniqueService)
  uniqueTx.context = { tenant: 'unique-race-tenant', user: new cds.User({ id: 'unique-race-worker' }) }
  uniqueTx.run = async query => {
      const insertEntries = JSON.stringify(query.INSERT?.entries || '')
      const digestWhere = JSON.stringify(query.SELECT?.where || '')
      const targetsUnique = (digestWhere.includes(IDS.unique) && digestWhere.includes('2026-08-31')) ||
        (insertEntries.includes(IDS.unique) && insertEntries.includes('2026-08-31'))
      if (targetsUnique && query.SELECT?.from?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries' && query.SELECT.one) {
        digestLookupCount += 1
        if (digestLookupCount <= 2) return undefined
      }
      const insertDigest = query.INSERT?.into === 'idts.cap.NotificationDigestDeliveries' || query.INSERT?.into?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries'
      if (insertDigest && targetsUnique) {
        throw Object.assign(new Error('unique constraint violated'), {
          code: 301,
          constraint: 'idts_cap_NotificationDigestDeliveries_digestRecipientDateType'
        })
      }
      return db.run(query)
    }

  const reused = await scheduleNotificationDigests({ tx: uniqueTx, now: new Date('2026-08-31T01:00:00.000Z') })
  assert.ok(reused.reused >= 1,
    `exact digest unique conflict re-reads and reuses the existing row: ${JSON.stringify(reused)} lookups=${digestLookupCount} independent=${independentReads}`)
  assert.equal(winnerReads, 1, `unique conflict is re-read exactly once through an independent CAP transaction boundary: ${winnerReads}`)
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
    businessDate: BUSINESS_DATE
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

  await db.run(UPDATE('idts.cap.NotificationDigestDeliveries').set({
    status_code: 'SENT',
    sentAt: SNAPSHOT_AT.toISOString()
  }).where({ status_code: { in: ['PENDING', 'FAILED'] } }))
  const sendTimeDeliveryID = cds.utils.uuid()
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({
    ID: sendTimeDeliveryID,
    recipient_ID: IDS.developer,
    businessDate: '2026-09-03',
    digestType: digestTypeFor('DEVELOPER'),
    windowStart: '2026-09-02T17:00:00.000Z',
    windowEnd: '2026-09-03T01:00:00.000Z',
    snapshotAt: '2026-09-03T01:00:00.000Z',
    itemCount: developerSnapshot.itemCount,
    subject: developerSnapshot.subject,
    textBody: developerSnapshot.textBody,
    htmlBody: developerSnapshot.htmlBody,
    status_code: 'PENDING',
    attemptCount: 0
  }))
  await db.run(UPDATE('idts.cap.Users').set({ role_code: 'TESTER' }).where({ ID: IDS.developer }))
  const sendTimeMessages = []
  await processNotificationDigestDeliveries({
    tx: db,
    config: enabledConfig(),
    sendMail: async message => {
      sendTimeMessages.push(message)
      return { messageId: 'should-not-send-persona-change' }
    },
    now: new Date('2026-09-03T01:01:00.000Z'),
    workerID: 'send-time-persona-worker'
  })
  const sendTimeDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDigestDeliveries').where({ ID: sendTimeDeliveryID }))
  assert.equal(sendTimeDelivery.status_code, 'SKIPPED', 'send-time persona change fails closed for a stored Developer digest')
  assert.equal(sendTimeDelivery.lastErrorCode, 'RECIPIENT_PERSONA_INVALID')
  assert.equal(sendTimeMessages.length, 0, 'send-time persona revalidation prevents provider delivery')
  await db.run(UPDATE('idts.cap.Users').set({ role_code: 'DEVELOPER' }).where({ ID: IDS.developer }))

  // Stored digest persona transitions must fail closed, while an inactive historical profile
  // must not invalidate a currently valid PM persona.
  const personaDb = await isolatedDigestDatabase()
  await personaDb.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.tester, 'Persona Fixture Reporter', 'persona-reporter@example.test', 'TESTER'),
    user(IDS.personaPmTester, 'Persona PM to Tester', 'persona-pm-tester@example.test', 'PM'),
    user(IDS.personaPmDeveloper, 'Persona PM to Developer', 'persona-pm-developer@example.test', 'PM'),
    user(IDS.personaDeveloperTester, 'Persona Developer to Tester', 'persona-developer-tester@example.test', 'DEVELOPER'),
    user(IDS.personaDeveloperPm, 'Persona Developer to PM', 'persona-developer-pm@example.test', 'DEVELOPER'),
    user(IDS.personaTesterDeveloper, 'Persona Tester to Developer', 'persona-tester-developer@example.test', 'TESTER'),
    user(IDS.personaTesterPm, 'Persona Tester to PM', 'persona-tester-pm@example.test', 'TESTER'),
    user(IDS.personaInactivePm, 'Persona PM with Inactive Profile', 'persona-inactive-pm@example.test', 'PM')
  ]))
  await personaDb.run(INSERT.into('idts.cap.DeveloperProfiles').entries([
    { ID: IDS.personaDeveloperTesterProfile, user_ID: IDS.personaDeveloperTester, availabilityStatus_code: 'AVAILABLE', workloadLimit: 5, active: true },
    { ID: IDS.personaDeveloperPmProfile, user_ID: IDS.personaDeveloperPm, availabilityStatus_code: 'AVAILABLE', workloadLimit: 5, active: true },
    { ID: IDS.personaInactivePmProfile, user_ID: IDS.personaInactivePm, availabilityStatus_code: 'AVAILABLE', workloadLimit: 5, active: false }
  ]))
  await personaDb.run(INSERT.into('idts.cap.Bugs').entries([
    bug('b8000000-0000-4000-8000-000000000001', 'BUG-PERSONA-DEVELOPER-TESTER', 'HIGH', 'MAJOR', '2026-09-03T00:00:00.000Z', '2026-09-03', null, IDS.personaDeveloperTesterProfile, 'ASSIGNED'),
    bug('b8000000-0000-4000-8000-000000000002', 'BUG-PERSONA-DEVELOPER-PM', 'HIGH', 'MAJOR', '2026-09-03T00:00:00.000Z', '2026-09-03', null, IDS.personaDeveloperPmProfile, 'ASSIGNED'),
    bug('b8000000-0000-4000-8000-000000000003', 'BUG-PERSONA-TESTER-DEVELOPER', 'HIGH', 'MAJOR', '2026-09-03T00:00:00.000Z', '2026-09-04', IDS.personaTesterDeveloper, null, 'RETEST_REQUIRED', 'Tester to Developer transition', 'TESTER', IDS.personaTesterDeveloper),
    bug('b8000000-0000-4000-8000-000000000004', 'BUG-PERSONA-TESTER-PM', 'HIGH', 'MAJOR', '2026-09-03T00:00:00.000Z', '2026-09-04', IDS.personaTesterPm, null, 'RETEST_REQUIRED', 'Tester to PM transition', 'TESTER', IDS.personaTesterPm)
  ]))
  const personaDate = '2026-09-04'
  const personaSnapshotAt = new Date('2026-09-04T01:00:00.000Z')
  const personaDefinitions = [
    [IDS.personaPmTester, 'PM'],
    [IDS.personaPmDeveloper, 'PM'],
    [IDS.personaDeveloperTester, 'DEVELOPER'],
    [IDS.personaDeveloperPm, 'DEVELOPER'],
    [IDS.personaTesterDeveloper, 'TESTER'],
    [IDS.personaTesterPm, 'TESTER'],
    [IDS.personaInactivePm, 'PM']
  ]
  const personaSnapshots = new Map()
  for (const [recipientID, role] of personaDefinitions) {
    const snapshot = await buildDigestSnapshot({
      tx: personaDb,
      recipient: { ID: recipientID, role_code: role },
      businessDate: personaDate,
      snapshotAt: personaSnapshotAt,
      limit: 20
    })
    assert.ok(snapshot?.itemCount > 0, `stored ${role} persona fixture has actionable snapshot items for ${recipientID}`)
    personaSnapshots.set(recipientID, snapshot)
    await insertStoredDigestSnapshot(personaDb, snapshot)
  }

  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'TESTER' }).where({ ID: IDS.personaPmTester }))
  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'DEVELOPER' }).where({ ID: IDS.personaPmDeveloper }))
  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'TESTER' }).where({ ID: IDS.personaDeveloperTester }))
  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'PM' }).where({ ID: IDS.personaDeveloperPm }))
  await personaDb.run(UPDATE('idts.cap.DeveloperProfiles').set({ active: false }).where({ ID: IDS.personaDeveloperPmProfile }))
  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'DEVELOPER' }).where({ ID: IDS.personaTesterDeveloper }))
  await personaDb.run(UPDATE('idts.cap.Users').set({ role_code: 'PM' }).where({ ID: IDS.personaTesterPm }))

  const personaSentRecipients = []
  const personaResult = await processNotificationDigestDeliveries({
    tx: personaDb,
    config: enabledConfig({ batchSize: 100 }),
    sendMail: async message => {
      personaSentRecipients.push(message.to)
      return { messageId: 'persona-transition-message' }
    },
    now: new Date('2026-09-04T01:01:00.000Z'),
    workerID: 'persona-transition-worker'
  })
  assert.equal(personaResult.failed, 0, 'persona transition fixture has no provider failures')
  const personaRows = await personaDb.run(SELECT.from('idts.cap.NotificationDigestDeliveries').orderBy('recipient_ID asc'))
  const transitionedIDs = personaDefinitions.slice(0, 6).map(([recipientID]) => recipientID)
  assert.deepEqual(personaSentRecipients.sort(), ['persona-inactive-pm@example.test'],
    'an old PM-wide/Developer/Tester snapshot never reaches a changed current persona')
  for (const recipientID of transitionedIDs) {
    const row = personaRows.find(candidate => candidate.recipient_ID === recipientID)
    assert.equal(row?.status_code, 'SKIPPED', `changed persona row fails closed for ${recipientID}`)
    assert.equal(row?.lastErrorCode, 'RECIPIENT_PERSONA_INVALID', `changed persona reason is safe for ${recipientID}`)
  }
  const inactiveProfilePmRow = personaRows.find(row => row.recipient_ID === IDS.personaInactivePm)
  assert.equal(inactiveProfilePmRow?.status_code, 'SENT',
    'a valid current PM with only an inactive historical DeveloperProfile remains eligible')
  for (const [recipientID, role] of personaDefinitions) {
    assert.equal(personaSnapshots.get(recipientID).digestType, digestTypeFor(role),
      `stored digest type binds the snapshot persona for ${role}`)
  }

  // The protected scheduler action owns the schedule hook; it still uses the same persisted digest contract.
  const schedulerRequest = new cds.Request({
    user: new cds.User({ id: 'digest-scheduler', roles: ['OutboxProcessor'] }),
    data: { now: '2026-08-31T01:00:00.000Z' }
  })
  await processNotificationSchedules(schedulerRequest)
  assert.ok(await count(db, 'idts.cap.NotificationDigestDeliveries', { businessDate: '2026-08-31' }) >= 1,
    'protected scheduled action invokes weekday digest generation')

  const recipientScaleUsers = Array.from({ length: 1001 }, (_, index) =>
    user(`c1000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, `Scale PM ${index + 1}`, `scale-pm-${index + 1}@example.test`, 'PM'))
  await db.run(INSERT.into('idts.cap.Users').entries(recipientScaleUsers))
  await db.run(INSERT.into('idts.cap.Bugs').entries(bug(
    'f8000000-0000-4000-8000-000000000001',
    'BUG-DIGEST-RECIPIENT-SCALE',
    'LOW',
    'MINOR',
    '2026-09-02T00:00:00.000Z',
    null,
    null,
    null,
    'PENDING_ASSIGNMENT',
    'Recipient scale pending assignment',
    'PM'
  )))
  let recipientBugPageReads = 0
  const recipientScaleTx = {
    run: async query => {
      if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) recipientBugPageReads += 1
      return db.run(query)
    }
  }
  await scheduleNotificationDigests({ tx: recipientScaleTx, now: new Date('2026-09-02T01:00:00.000Z') })
  const recipientScaleIDs = new Set(recipientScaleUsers.map(row => row.ID))
  const recipientScaleRows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').columns('recipient_ID').where({ businessDate: '2026-09-02' }))
  assert.equal(recipientScaleRows.filter(row => recipientScaleIDs.has(row.recipient_ID)).length, 1001,
    'digest scheduling continues through every eligible recipient page')
  assert.ok(recipientBugPageReads >= Math.ceil(recipientScaleUsers.length / 100),
    'recipient pages stream bounded Bug pages without an all-recipient aggregate scan')

  const longScanBaseline = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.developer, role_code: 'DEVELOPER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  const irrelevantScanRows = Array.from({ length: 5000 }, (_, index) =>
    bug(`00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, `BUG-DIGEST-SCAN-FILLER-${index + 1}`, 'LOW', 'MINOR', '2026-08-27T00:00:00.000Z', null, null, null, 'ASSIGNED'))
  const highPriorityAfterScan = bug(
    'f9000000-0000-4000-8000-000000000001',
    'BUG-DIGEST-AFTER-5000',
    'CRITICAL',
    'BLOCKER',
    '2026-08-27T00:00:00.000Z',
    '2026-08-27',
    IDS.developer,
    IDS.developerProfile,
    'ASSIGNED'
  )
  await db.run(INSERT.into('idts.cap.Bugs').entries([...irrelevantScanRows, highPriorityAfterScan]))
  const longScanSnapshot = await buildDigestSnapshot({
    tx: db,
    recipient: { ID: IDS.developer, role_code: 'DEVELOPER' },
    businessDate: BUSINESS_DATE,
    snapshotAt: SNAPSHOT_AT,
    limit: 20
  })
  assert.ok(longScanSnapshot && longScanSnapshot.itemCount === longScanBaseline.itemCount + 1,
    'role-scoped digest paging reaches actionable Bugs after the first 5000 IDs')
  assert.ok(longScanSnapshot?.textBody.includes('BUG-DIGEST-AFTER-5000'),
    'high-priority actionable Bug after the first 5000 IDs is included')

  const deliveryDb = await isolatedDigestDatabase()
  const deliveryUsers = Array.from({ length: 1001 }, (_, index) =>
    user(`d1000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, `Delivery User ${index + 1}`, `delivery-user-${index + 1}@example.test`, 'PM'))
  await deliveryDb.run(INSERT.into('idts.cap.Users').entries(deliveryUsers))
  const deliveryRows = deliveryUsers.map((recipient, index) => ({
    ID: `d2000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    recipient_ID: recipient.ID,
    businessDate: BUSINESS_DATE,
    digestType: digestTypeFor('PM'),
    windowStart: '2026-08-27T17:00:00.000Z',
    windowEnd: SNAPSHOT_AT.toISOString(),
    snapshotAt: SNAPSHOT_AT.toISOString(),
    itemCount: 1,
    subject: 'Stored digest delivery',
    textBody: 'Stored digest body',
    htmlBody: '<p>Stored digest body</p>',
    status_code: 'PENDING',
    attemptCount: 0
  }))
  await deliveryDb.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries(deliveryRows))
  const recipientQuerySizes = []
  const deliveryTx = {
    run: async query => {
      if (query.SELECT?.from?.ref?.[0] === 'idts.cap.Users') {
        const where = JSON.stringify(query.SELECT.where)
        const matched = deliveryUsers.filter(recipient => where.includes(recipient.ID)).length
        if (matched) recipientQuerySizes.push(matched)
      }
      return deliveryDb.run(query)
    }
  }
  let delivered = 0
  let skipped = 0
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await processNotificationDigestDeliveries({
      tx: deliveryTx,
      config: enabledConfig({ batchSize: 5000 }),
      sendMail: async () => ({ messageId: 'bounded-digest-message' }),
      now: new Date('2026-08-28T01:00:00.000Z'),
      workerID: `bounded-delivery-worker-${attempt}`
    })
    delivered += result.sent
    skipped += result.skipped
    if (!result.sent && !result.failed) break
  }
  assert.equal(delivered, 1001, 'large configured batch drains every eligible digest row across bounded worker calls')
  assert.equal(skipped, 0, 'bounded digest recipient lookup never mislabels a claimed recipient as missing')
  assert.ok(recipientQuerySizes.length > 0 && recipientQuerySizes.every(size => size <= 100),
    'digest recipient IN queries stay within the documented safe batch bound')

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

  const finalFixFailures = []
  for (const [name, fixture] of [
    ['snapshot role binding race', assertSnapshotRoleBindingRace],
    ['send-time authorization race', assertSendTimeAuthorizationRace],
    ['unique conflict transaction isolation', assertUniqueConflictIsolation],
    ['bounded digest pages and restart', assertBoundedDigestPagesAndRestart]
  ]) {
    try {
      await fixture()
    } catch (error) {
      finalFixFailures.push(`${name}: ${error.stack || error.message}`)
    }
  }
  if (finalFixFailures.length) {
    throw new Error(`N4 final fix RED fixtures failed:\n${finalFixFailures.join('\n')}`)
  }

  console.log('IDTS My Notifications digest contract: PASS')
}

function user (ID, displayName, email, role_code) {
  return { ID, displayName, email, role_code, active: true }
}

function digestTypeFor (role) {
  return `DAILY_${String(role).toUpperCase()}`
}

async function insertStoredDigestSnapshot (db, snapshot) {
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({
    ID: cds.utils.uuid(),
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
  }))
}

async function assertSnapshotRoleBindingRace () {
  await assertSnapshotRoleChange('PM', 'TESTER', 'Pending Assignment', 'PM to Tester')
  await assertSnapshotRoleChange('DEVELOPER', 'PM', 'Technical assignment', 'Developer to PM')
}

async function assertSnapshotRoleChange (initialRole, nextRole, bugTitle, label) {
  const db = await isolatedDigestDatabase()
  const recipientID = `e1000000-0000-4000-8000-${initialRole === 'PM' ? '000000000001' : '000000000002'}`
  const bugID = `e2000000-0000-4000-8000-${initialRole === 'PM' ? '000000000001' : '000000000002'}`
  const profileID = `e3000000-0000-4000-8000-${initialRole === 'PM' ? '000000000001' : '000000000002'}`
  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.tester, `${label} reporter`, `${label.toLowerCase().replaceAll(' ', '-')}@reporter.example.test`, 'TESTER'),
    user(recipientID, `${label} recipient`, `${label.toLowerCase().replaceAll(' ', '-')}@example.test`, initialRole)
  ]))
  if (initialRole === 'DEVELOPER') {
    await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
      ID: profileID,
      user_ID: recipientID,
      availabilityStatus_code: 'AVAILABLE',
      workloadLimit: 5,
      active: true
    }))
  }
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    initialRole === 'PM'
      ? bug(bugID, `BUG-DIGEST-RACE-${initialRole}-${nextRole}`, 'LOW', 'MINOR', '2026-09-02T00:00:00.000Z', null, recipientID, null, 'PENDING_ASSIGNMENT', bugTitle, 'PM')
      : bug(bugID, `BUG-DIGEST-RACE-${initialRole}-${nextRole}`, 'HIGH', 'MAJOR', '2026-09-02T00:00:00.000Z', '2026-09-02', null, profileID, 'ASSIGNED', bugTitle)
  ))

  let injected = false
  const tx = {
    run: async query => {
      const from = query.SELECT?.from?.ref?.[0]
      const columns = JSON.stringify(query.SELECT?.columns || [])
      if (!injected && from === 'idts.cap.Users' && query.SELECT.one && columns.includes('role_code')) {
        injected = true
        await db.run(UPDATE('idts.cap.Users').set({ role_code: nextRole }).where({ ID: recipientID }))
      }
      return db.run(query)
    }
  }
  await scheduleNotificationDigests({ tx, now: new Date('2026-09-03T01:00:00.000Z') })
  const rows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').where({ recipient_ID: recipientID }))
  assert.equal(rows.length, 0,
    `${label} shared-index items are never persisted under a newly derived ${nextRole} digest persona`)
}

async function assertSendTimeAuthorizationRace () {
  const db = await isolatedDigestDatabase()
  const inactiveUserID = 'e4000000-0000-4000-8000-000000000001'
  const changedRoleUserID = 'e4000000-0000-4000-8000-000000000002'
  const changedProfileUserID = 'e4000000-0000-4000-8000-000000000003'
  const changedProfileID = 'e5000000-0000-4000-8000-000000000001'
  const deliveryIDs = {
    inactive: 'e6000000-0000-4000-8000-000000000001',
    role: 'e6000000-0000-4000-8000-000000000002',
    profile: 'e6000000-0000-4000-8000-000000000003'
  }
  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.tester, 'Send race reporter', 'send-race-reporter@example.test', 'TESTER'),
    user(inactiveUserID, 'Send race inactive', 'send-race-inactive@example.test', 'PM'),
    user(changedRoleUserID, 'Send race role', 'send-race-role@example.test', 'DEVELOPER'),
    user(changedProfileUserID, 'Send race profile', 'send-race-profile@example.test', 'DEVELOPER')
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: changedProfileID,
    user_ID: changedProfileUserID,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 5,
    active: true
  }))
  const delivery = (ID, recipient_ID, digestType) => ({
    ID,
    recipient_ID,
    businessDate: '2026-09-03',
    digestType,
    windowStart: '2026-09-02T17:00:00.000Z',
    windowEnd: '2026-09-03T01:00:00.000Z',
    snapshotAt: '2026-09-03T01:00:00.000Z',
    itemCount: 1,
    subject: 'Send race snapshot',
    textBody: 'Send race body',
    htmlBody: '<p>Send race body</p>',
    status_code: 'PENDING',
    attemptCount: 0
  })
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries([
    delivery(deliveryIDs.inactive, inactiveUserID, digestTypeFor('PM')),
    delivery(deliveryIDs.role, changedRoleUserID, digestTypeFor('DEVELOPER')),
    delivery(deliveryIDs.profile, changedProfileUserID, digestTypeFor('DEVELOPER'))
  ]))

  const claimChanges = new Set()
  const boundaryUserLocks = []
  const boundaryProfileLocks = []
  const tx = {
    run: async query => {
      const updateData = JSON.stringify(query.UPDATE?.data || query.UPDATE?.with || {})
      const isClaim = updateData.includes('lockToken') && updateData.includes('lockedUntil') && !updateData.includes('status_code')
      const whereText = isClaim ? JSON.stringify(query.UPDATE.where || query.UPDATE.where) : ''
      const result = await db.run(query)
      if (isClaim) {
        if (whereText.includes(deliveryIDs.inactive) && !claimChanges.has(deliveryIDs.inactive)) {
          claimChanges.add(deliveryIDs.inactive)
          await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: inactiveUserID }))
        } else if (whereText.includes(deliveryIDs.role) && !claimChanges.has(deliveryIDs.role)) {
          claimChanges.add(deliveryIDs.role)
          await db.run(UPDATE('idts.cap.Users').set({ role_code: 'TESTER' }).where({ ID: changedRoleUserID }))
        } else if (whereText.includes(deliveryIDs.profile) && !claimChanges.has(deliveryIDs.profile)) {
          claimChanges.add(deliveryIDs.profile)
          await db.run(UPDATE('idts.cap.DeveloperProfiles').set({ active: false }).where({ ID: changedProfileID }))
        }
      }
      const from = query.SELECT?.from?.ref?.[0]
      if (from === 'idts.cap.Users' && query.SELECT.one && Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')) boundaryUserLocks.push(query)
      if (from === 'idts.cap.DeveloperProfiles' && Object.prototype.hasOwnProperty.call(query.SELECT, 'forUpdate')) boundaryProfileLocks.push(query)
      return result
    }
  }
  const sent = []
  const result = await processNotificationDigestDeliveries({
    tx,
    config: enabledConfig({ batchSize: 10 }),
    sendMail: async message => {
      sent.push(message.to)
      return { messageId: 'unexpected-send-race-message' }
    },
    now: new Date('2026-09-03T01:01:00.000Z'),
    workerID: 'send-race-worker'
  })
  assert.equal(result.sent, 0, `deactivation, role change and profile deactivation before send prevent provider calls: sent=${result.sent} claimChanges=${JSON.stringify([...claimChanges])} sentTo=${JSON.stringify(sent)}`)
  assert.equal(sent.length, 0, `send-time authorization race never sends stale prefetched eligibility: ${JSON.stringify(sent)}`)
  assert.equal(result.skipped, 3, 'all three send-time authorization changes fail closed')
  assert.equal(boundaryUserLocks.length, 3, 'each claimed delivery locks the authoritative User at send time')
  assert.ok(boundaryProfileLocks.length >= 2, 'active-profile eligibility is re-read and locked at send time')
}

async function assertUniqueConflictIsolation () {
  const db = await isolatedDigestDatabase()
  const conflictUserID = 'e7000000-0000-4000-8000-000000000001'
  const laterUserID = 'e7000000-0000-4000-8000-000000000002'
  const winnerID = 'e8000000-0000-4000-8000-000000000001'
  const conflictBugID = 'e9000000-0000-4000-8000-000000000001'
  const laterBugID = 'e9000000-0000-4000-8000-000000000002'
  const date = '2026-09-04'
  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.tester, 'Unique isolation reporter', 'unique-isolation-reporter@example.test', 'TESTER'),
    user(conflictUserID, 'Unique conflict PM', 'unique-conflict@example.test', 'PM'),
    user(laterUserID, 'Unique later PM', 'unique-later@example.test', 'PM')
  ]))
  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(conflictBugID, 'BUG-DIGEST-UNIQUE-CONFLICT', 'LOW', 'MINOR', '2026-09-03T00:00:00.000Z', null, conflictUserID, null, 'PENDING_ASSIGNMENT', 'Unique conflict pending', 'PM'),
    bug(laterBugID, 'BUG-DIGEST-UNIQUE-LATER', 'LOW', 'MINOR', '2026-09-03T00:00:00.000Z', null, laterUserID, null, 'PENDING_ASSIGNMENT', 'Later recipient pending', 'PM')
  ]))
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries({
    ID: winnerID,
    recipient_ID: conflictUserID,
    businessDate: date,
    digestType: digestTypeFor('PM'),
    windowStart: '2026-09-03T17:00:00.000Z',
    windowEnd: '2026-09-04T01:00:00.000Z',
    snapshotAt: '2026-09-04T01:00:00.000Z',
    itemCount: 1,
    subject: 'Existing winner',
    textBody: 'Existing winner',
    htmlBody: '<p>Existing winner</p>',
    status_code: 'PENDING',
    attemptCount: 0
  }))

  const state = { conflictOccurred: false, winnerReads: 0, queriesAfterAbort: 0, rootCount: 0 }
  const uniqueError = () => Object.assign(new Error('duplicate digest key'), {
    code: '23505',
    constraint: 'idts_cap_NotificationDigestDeliveries_digestRecipientDateType'
  })
  const isConflictKey = query => {
    const text = JSON.stringify(query)
    return text.includes(conflictUserID) && text.includes(date) && text.includes(digestTypeFor('PM'))
  }
  const rootService = {
    tx: (...args) => {
      const callback = typeof args[0] === 'function' ? args[0] : args[1]
      const context = typeof args[0] === 'function' ? { tenant: 'unique-isolation-tenant', user: new cds.User({ id: 'unique-worker' }) } : args[0]
      const root = { context, aborted: false, exactReads: 0 }
      root.run = async query => {
        if (root.aborted) {
          state.queriesAfterAbort += 1
          throw new Error('query after simulated 23505')
        }
        const from = query.SELECT?.from?.ref?.[0]
        if (from === 'idts.cap.NotificationDigestDeliveries' && query.SELECT.one && isConflictKey(query)) {
          root.exactReads += 1
          if (!state.conflictOccurred) return undefined
          state.winnerReads += 1
          return { ID: winnerID }
        }
        const insertInto = query.INSERT?.into === 'idts.cap.NotificationDigestDeliveries' || query.INSERT?.into?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries'
        if (insertInto && isConflictKey(query) && !state.conflictOccurred) {
          state.conflictOccurred = true
          root.aborted = true
          throw uniqueError()
        }
        return db.run(query)
      }
      Object.setPrototypeOf(root, rootService)
      state.rootCount += 1
      return Promise.resolve(callback(root))
    }
  }
  const outer = Object.create(rootService)
  outer.context = { tenant: 'unique-isolation-tenant', user: new cds.User({ id: 'unique-worker' }) }
  outer.aborted = false
  outer.run = async query => {
    if (outer.aborted) {
      state.queriesAfterAbort += 1
      throw new Error('query after simulated 23505')
    }
    const from = query.SELECT?.from?.ref?.[0]
    if (from === 'idts.cap.NotificationDigestDeliveries' && query.SELECT.one && isConflictKey(query)) return undefined
    const insertInto = query.INSERT?.into === 'idts.cap.NotificationDigestDeliveries' || query.INSERT?.into?.ref?.[0] === 'idts.cap.NotificationDigestDeliveries'
    if (insertInto && isConflictKey(query) && !state.conflictOccurred) {
      state.conflictOccurred = true
      outer.aborted = true
      throw uniqueError()
    }
    return db.run(query)
  }
  const result = await scheduleNotificationDigests({ tx: outer, now: new Date('2026-09-04T01:00:00.000Z') })
  assert.ok(result.reused >= 1, 'exact unique conflict reuses the winner in a healthy transaction')
  assert.ok(result.created >= 1, 'a later recipient continues after the isolated unique conflict')
  assert.equal(state.queriesAfterAbort, 0, 'no query is issued after the simulated 23505 root abort')
  assert.ok(state.winnerReads >= 1, 'the exact winner is read through an independent healthy root')
  assert.equal(await count(db, 'idts.cap.NotificationDigestDeliveries', { recipient_ID: laterUserID, businessDate: date }), 1,
    'later recipient snapshot persists after an earlier exact-key conflict')
}

async function assertBoundedDigestPagesAndRestart () {
  const db = await isolatedDigestDatabase()
  const users = Array.from({ length: 201 }, (_, index) => user(
    `ea000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    `Bounded PM ${index + 1}`,
    `bounded-pm-${index + 1}@example.test`,
    'PM'
  ))
  await db.run(INSERT.into('idts.cap.Users').entries([
    user(IDS.tester, 'Bounded digest reporter', 'bounded-reporter@example.test', 'TESTER'),
    ...users
  ]))
  await db.run(INSERT.into('idts.cap.Bugs').entries(bug(
    'eb000000-0000-4000-8000-000000000001',
    'BUG-DIGEST-BOUNDED-PAGES',
    'HIGH',
    'MAJOR',
    '2026-09-06T00:00:00.000Z',
    null,
    null,
    null,
    'PENDING_ASSIGNMENT',
    'Bounded page pending',
    'PM'
  )))
  const state = { recipientPageQueries: 0, recipientPageSizes: [], bugPageSizes: [], rootRecipientSizes: [], failSecondPage: true }
  const service = makeDigestPageService(db, state)
  await assert.rejects(
    () => scheduleNotificationDigests({ tx: service, now: new Date('2026-09-07T01:00:00.000Z') }),
    /late recipient page failure/,
    'late recipient page failure is observable'
  )
  const boundedRecipientIDs = new Set(users.map(row => row.ID))
  const firstPageRows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').columns('recipient_ID').where({ businessDate: '2026-09-07' }))
  const firstPageCount = firstPageRows.filter(row => boundedRecipientIDs.has(row.recipient_ID)).length
  assert.ok(firstPageCount > 0 && firstPageCount < users.length,
    `the first recipient page remains committed after a late-page failure: ${firstPageCount}`)
  assert.ok(state.recipientPageSizes.every(size => size <= 100), 'recipient pages never exceed the bounded page size')
  assert.ok(state.bugPageSizes.length > 0 && state.bugPageSizes.every(size => size <= 500), 'Bug stream pages stay bounded')

  state.failSecondPage = false
  state.recipientPageQueries = 0
  const rerun = await scheduleNotificationDigests({ tx: service, now: new Date('2026-09-07T01:30:00.000Z') })
  assert.ok(rerun.reused >= firstPageCount && rerun.created >= users.length - firstPageCount, `restart reuses earlier page and creates all remaining snapshots: ${JSON.stringify(rerun)} firstPage=${firstPageCount} sizes=${JSON.stringify(state.recipientPageSizes)}`)
  const completeRows = await db.run(SELECT.from('idts.cap.NotificationDigestDeliveries').columns('recipient_ID').where({ businessDate: '2026-09-07' }))
  assert.equal(completeRows.filter(row => boundedRecipientIDs.has(row.recipient_ID)).length, users.length,
    'all recipients process without a silent aggregate cap')
  assert.ok(state.rootRecipientSizes.filter(Boolean).every(size => size <= 100), 'each committed root handles at most one recipient page')
}

function makeDigestPageService (db, state) {
  const service = {
    run: query => runDigestPageQuery(db, state, query, null, null),
    tx: (...args) => {
      const callback = typeof args[0] === 'function' ? args[0] : args[1]
      const context = typeof args[0] === 'function' ? { tenant: 'bounded-digest-tenant', user: new cds.User({ id: 'bounded-worker' }) } : args[0]
      return db.tx(async actualTx => {
        const root = { context, recipientPageSize: 0, run: query => runDigestPageQuery(db, state, query, actualTx, root) }
        Object.setPrototypeOf(root, service)
        const result = await callback(root)
        state.rootRecipientSizes.push(root.recipientPageSize || 0)
        return result
      })
    }
  }
  return service
}

async function runDigestPageQuery (db, state, query, actualTx, root) {
  const from = query.SELECT?.from?.ref?.[0]
  const run = actualTx ? actualTx.run.bind(actualTx) : db.run.bind(db)
  if (from === 'idts.cap.Users' && !query.SELECT.one && JSON.stringify(query.SELECT.where).includes('role_code')) {
    state.recipientPageQueries += 1
    const rows = await run(query)
    state.recipientPageSizes.push(rows.length)
    if (state.failSecondPage && state.recipientPageQueries === 2) throw new Error('late recipient page failure')
    if (root) root.recipientPageSize = rows.length
    return rows
  }
  if (from === 'idts.cap.Bugs' && query.SELECT.limit?.rows?.val === 500) {
    const rows = await run(query)
    state.bugPageSizes.push(rows.length)
    return rows
  }
  return run(query)
}

function bug (ID, bugNumber, priority_code, severity_code, createdAt, dueDate, nextProcessorUser_ID, assignee_ID, status_code, title = `${bugNumber} digest fixture`, nextProcessorRole_code = nextProcessorUser_ID ? 'DEVELOPER' : null, retestOwner_ID = null) {
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
    nextProcessorRole_code,
    retestOwner_ID: retestOwner_ID || null,
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

async function addPendingAssignmentHistory (db, bugID) {
  const eventID = 'b4000000-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.HistoryEvents').entries({
    ID: eventID,
    bug_ID: bugID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'STATUS_CHANGE',
    summary: 'Digest fixture entered Pending Assignment recently.',
    createdAt: '2026-08-28T00:30:00.000Z',
    modifiedAt: '2026-08-28T00:30:00.000Z'
  }))
  await db.run(INSERT.into('idts.cap.HistoryLogs').entries({
    ID: 'b5000000-0000-4000-8000-000000000001',
    bug_ID: bugID,
    event_ID: eventID,
    actor_ID: IDS.pm,
    actorRole_code: 'PM',
    actionType_code: 'STATUS_CHANGE',
    fieldName: 'status',
    fieldLabel: 'Status',
    oldValue: 'ASSIGNED',
    newValue: 'PENDING_ASSIGNMENT',
    createdAt: '2026-08-28T00:30:00.000Z',
    modifiedAt: '2026-08-28T00:30:00.000Z'
  }))
}

async function isolatedDigestDatabase () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const isolated = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(isolated)
  return isolated
}

main().catch(error => {
  console.error('IDTS My Notifications digest contract: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
