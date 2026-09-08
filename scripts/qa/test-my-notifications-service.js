'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql
const { identityKeyHash } = require('../../srv/auth/identity-map')
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')

const root = path.resolve(__dirname, '../..')
const servicePath = path.join(root, 'srv/notification.cds')
assert.ok(fs.existsSync(servicePath), 'NotificationService CDS contract exists')

const USER_A = 'd1000000-0000-4000-8000-000000000001'
const USER_B = 'd1000000-0000-4000-8000-000000000002'
const INACTIVE = 'd1000000-0000-4000-8000-000000000003'
const PM_USER = 'd1000000-0000-4000-8000-000000000004'
const USER_ADMIN = 'd1000000-0000-4000-8000-000000000005'
const BUG_ID = '90000000-0000-0000-0000-000000000001'
const ACCESS_AUDIT = 'd2000000-0000-4000-8000-000000000001'
const NOTIFICATION_DTO_FIELDS = [
  'notificationID', 'category', 'eventType', 'title', 'summary', 'bugNumber',
  'bugTitle', 'priority', 'actionRequired', 'occurredAt', 'readAt', 'targetPath',
  'modifiedAt'
]

const atomicCases = new Map([
  ['IDTS110-F232', runAtomicSearchCase],
  ['IDTS110-F233', runAtomicHydrationCase],
  ['IDTS110-F234', runAtomicUnreadCountCase],
  ['IDTS110-F235', runAtomicReadCase],
  ['IDTS110-F235I', runAtomicIdempotentReadCase],
  ['IDTS110-F235C', runAtomicStaleReadCase],
  ['IDTS110-F236', runAtomicMarkAllCase]
])

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

async function runAtomicSelector (options) {
  assert.deepEqual([...atomicCases.keys()], [
    'IDTS110-F232', 'IDTS110-F233', 'IDTS110-F234', 'IDTS110-F235',
    'IDTS110-F235I', 'IDTS110-F235C', 'IDTS110-F236'
  ])
  const executeCase = atomicCases.get(options.caseKey)
  if (!executeCase) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-my-notifications-service.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      ...await executeCase(),
      assertionPassed: true,
      actualResult: definition.expectedResult,
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

function user (email, role = 'TESTER') {
  const roles = Array.isArray(role) ? role : [role]
  return new cds.User({ id: email, roles: ['authenticated-user', ...roles] })
}

async function expectRejected (promise, status, code) {
  await assert.rejects(promise, error =>
    Number(error?.status || error?.statusCode || error?.code) === status && (!code || error?.code === code))
}

async function expectSafeDenied (promise, statuses, code) {
  const allowed = new Set(Array.isArray(statuses) ? statuses : [statuses])
  let captured
  await assert.rejects(promise, error => {
    captured = error
    return allowed.has(Number(error?.status || error?.statusCode || error?.code)) && (!code || error?.code === code)
  })
  assert.ok(captured)
  assert.equal(captured.data, undefined)
  assert.equal(captured.payload, undefined)
  assert.equal(captured.details, undefined)
  assert.equal(captured.target, undefined)
  assert.equal(captured.args, undefined)
  assert.doesNotMatch(JSON.stringify(captured), /@example\.invalid|recipientEmail|detailsSummary|password|token|provider/i)
  return Number(captured.status || captured.statusCode || captured.code)
}

function atomicID (prefix, index) {
  return `${prefix}${String(index).padStart(6, '0')}-0000-4000-8000-000000000001`
}

function atomicNotification (index, overrides = {}) {
  return {
    ID: atomicID('d3', index),
    bug_ID: BUG_ID,
    recipient_ID: USER_A,
    eventType_code: 'ASSIGNED',
    channel_code: 'IN_APP',
    deliveryStatus_code: 'SENT',
    message: `Atomic notification ${index}`,
    sourceKey: `ATOMIC:${index}`,
    ...overrides
  }
}

function atomicInbox (index, overrides = {}) {
  return {
    ID: atomicID('d4', index),
    recipient_ID: USER_A,
    bugNotification_ID: atomicID('d3', index),
    accessAuditEvent_ID: null,
    occurredAt: '2026-08-27T01:00:00.000Z',
    readAt: null,
    ...overrides
  }
}

function atomicAudit (index, overrides = {}) {
  return {
    ID: atomicID('d2', index),
    targetUser_ID: USER_A,
    action: 'CHANGE_ROLE',
    result: 'APPLIED',
    correlationId: atomicID('d2', index),
    detailsSummary: 'Private audit detail must not enter the notification DTO.',
    ...overrides
  }
}

async function createAtomicFixture ({ notifications = [], inboxEntries = [], audits = [] } = {}) {
  const csn = await cds.load('srv/service.cds')
  const db = await cds.deploy(csn).to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: USER_A, displayName: 'Notification User A', email: 'notification.a@example.invalid', role_code: 'TESTER', active: true },
    { ID: USER_B, displayName: 'Notification User B', email: 'notification.b@example.invalid', role_code: 'DEVELOPER', active: true },
    { ID: INACTIVE, displayName: 'Inactive Notification User', email: 'notification.inactive@example.invalid', role_code: 'TESTER', active: false },
    { ID: PM_USER, displayName: 'Notification PM', email: 'notification.pm@example.invalid', role_code: 'PM', active: true },
    { ID: USER_ADMIN, displayName: 'Notification User Admin', email: 'notification.useradmin@example.invalid', role_code: 'PM', active: true }
  ]))
  if (audits.length) await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries(audits))
  if (notifications.length) await db.run(INSERT.into('idts.cap.Notifications').entries(notifications))
  if (inboxEntries.length) await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries(inboxEntries))
  const service = await cds.serve('NotificationService').from('srv/notification.cds')
  return {
    db,
    service,
    actorA: user('notification.a@example.invalid'),
    actorB: user('notification.b@example.invalid', 'DEVELOPER'),
    inactiveActor: user('notification.inactive@example.invalid'),
    pmActor: user('notification.pm@example.invalid', 'PM'),
    userAdminActor: user('notification.useradmin@example.invalid', ['PM', 'UserAdmin'])
  }
}

function rowSnapshot (row) {
  return row ? { ID: row.ID, readAt: row.readAt || null, modifiedAt: row.modifiedAt } : null
}

function rowsSnapshot (rows) {
  return {
    count: rows.length,
    IDs: rows.map(row => row.ID),
    unread: rows.filter(row => !row.readAt).length,
    read: rows.filter(row => Boolean(row.readAt)).length
  }
}

function inboxSnapshot (rows) {
  return rows.map(row => ({
    ID: row.ID,
    owner: row.recipient_ID,
    occurredAt: row.occurredAt,
    readAt: row.readAt || null,
    modifiedAt: row.modifiedAt
  }))
}

async function runAtomicSearchCase () {
  const notifications = [1, 2, 3, 4, 5].map(index => atomicNotification(index, {
    recipient_ID: index === 5 ? USER_B : USER_A
  }))
  const inboxEntries = [
    atomicInbox(1),
    atomicInbox(2, { readAt: '2026-08-27T01:05:00.000Z' }),
    atomicInbox(3),
    atomicInbox(4, { occurredAt: '2026-08-27T02:00:00.000Z' }),
    atomicInbox(5, { recipient_ID: USER_B })
  ]
  const fixture = await createAtomicFixture({ notifications, inboxEntries })
  const beforeCallerRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_A }).orderBy('ID asc')
  )
  const beforeOtherCallerRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_B }).orderBy('ID asc')
  )
  const beforePmRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: PM_USER }).orderBy('ID asc')
  )
  const beforeUserAdminRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_ADMIN }).orderBy('ID asc')
  )
  const page1 = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'ALL', skip: 0, top: 2 },
    user: fixture.actorA
  })
  const page2 = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'ALL', skip: 2, top: 2 },
    user: fixture.actorA
  })
  assert.deepEqual(page1.map(row => row.notificationID), [atomicID('d4', 4), atomicID('d4', 3)])
  assert.deepEqual(page2.map(row => row.notificationID), [atomicID('d4', 2), atomicID('d4', 1)])
  const pagedIDs = [...page1, ...page2].map(row => row.notificationID)
  assert.equal(new Set(pagedIDs).size, pagedIDs.length, 'paged caller results do not duplicate a row')
  assert.equal(page1.some(row => page2.some(other => other.notificationID === row.notificationID)), false)
  assert.ok([...page1, ...page2].every(row => row.bugNumber === 'BUG-0001'))
  const unread = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'UNREAD', skip: 0, top: 100 },
    user: fixture.actorA
  })
  assert.deepEqual(unread.map(row => row.notificationID), [atomicID('d4', 4), atomicID('d4', 3), atomicID('d4', 1)])
  const userBRows = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'ALL', readState: 'ALL', skip: 0, top: 100 },
    user: fixture.actorB
  })
  assert.deepEqual(userBRows.map(row => row.notificationID), [atomicID('d4', 5)])
  const pmRows = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'ALL', readState: 'ALL', skip: 0, top: 100 },
    user: fixture.pmActor
  })
  assert.deepEqual(pmRows, [], 'a PM without owned inbox rows cannot read another caller\'s rows')
  const userAdminRows = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'ALL', readState: 'ALL', skip: 0, top: 100 },
    user: fixture.userAdminActor
  })
  assert.deepEqual(userAdminRows, [], 'a UserAdmin overlay without owned inbox rows cannot read another caller\'s rows')
  const reloadedCallerRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_A }).orderBy('ID asc')
  )
  const reloadedOtherCallerRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_B }).orderBy('ID asc')
  )
  assert.deepEqual(inboxSnapshot(reloadedCallerRows), inboxSnapshot(beforeCallerRows))
  assert.deepEqual(inboxSnapshot(reloadedOtherCallerRows), inboxSnapshot(beforeOtherCallerRows))
  return {
    beforeState: { callerRows: beforeCallerRows.length, otherCallerRows: beforeOtherCallerRows.length, pmRows: beforePmRows.length, userAdminRows: beforeUserAdminRows.length },
    afterState: { firstPageIDs: page1.map(row => row.notificationID), secondPageIDs: page2.map(row => row.notificationID), unreadRows: unread.length },
    reloadState: { uniquePagedRows: new Set(pagedIDs).size, callerBRows: userBRows.length, callerPMRows: pmRows.length, callerUserAdminRows: userAdminRows.length }
  }
}

async function runAtomicHydrationCase () {
  const notifications = [
    atomicNotification(11),
    atomicNotification(12, { recipient_ID: USER_B }),
    atomicNotification(13)
  ]
  const audits = [
    atomicAudit(11),
    atomicAudit(12, { result: 'FAILED' }),
    atomicAudit(13, { action: 'UNSUPPORTED' }),
    atomicAudit(14)
  ]
  const missingNotificationID = atomicID('d3', 99)
  const inboxEntries = [
    atomicInbox(11, { occurredAt: '2026-08-27T01:00:00.000Z' }),
    atomicInbox(14, { bugNotification_ID: null, accessAuditEvent_ID: atomicID('d2', 11) }),
    atomicInbox(12, { bugNotification_ID: atomicID('d3', 12) }),
    atomicInbox(13, { bugNotification_ID: atomicID('d3', 13), accessAuditEvent_ID: atomicID('d2', 12) }),
    atomicInbox(15, { bugNotification_ID: null, accessAuditEvent_ID: atomicID('d2', 13) }),
    atomicInbox(16, { bugNotification_ID: missingNotificationID })
  ]
  const fixture = await createAtomicFixture({ notifications, inboxEntries, audits })
  const rawInboxRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_A }).orderBy('ID asc')
  )
  const bugSourceIDs = [...new Set(rawInboxRows.map(row => row.bugNotification_ID).filter(Boolean))]
  const accessSourceIDs = [...new Set(rawInboxRows.map(row => row.accessAuditEvent_ID).filter(Boolean))]
  const bugSourceRows = bugSourceIDs.length
    ? await fixture.db.run(SELECT.from('idts.cap.Notifications').where({ ID: { in: bugSourceIDs } }))
    : []
  const accessSourceRows = accessSourceIDs.length
    ? await fixture.db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ ID: { in: accessSourceIDs } }))
    : []
  const rows = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'ALL', readState: 'ALL', skip: 0, top: 100 },
    user: fixture.actorA
  })
  assert.equal(rows.length, rawInboxRows.length, 'the DTO cardinality matches the caller query cardinality')
  const byID = new Map(rows.map(row => [row.notificationID, row]))
  const validBug = byID.get(atomicID('d4', 11))
  assert.equal(validBug.category, 'BUG')
  assert.equal(validBug.eventType, 'ASSIGNED')
  assert.equal(validBug.title, 'Assigned')
  assert.equal(validBug.bugNumber, 'BUG-0001')
  assert.equal(validBug.bugTitle, 'List report filters do not show defect category value help')
  assert.equal(validBug.targetPath, `/idtsbugmanagementui/index.html#/Bugs(ID=${BUG_ID},IsActiveEntity=true)`)
  const validAccess = byID.get(atomicID('d4', 14))
  assert.equal(validAccess.category, 'ACCESS')
  assert.equal(validAccess.eventType, 'CHANGE_ROLE')
  assert.equal(validAccess.title, 'Access role changed')
  assert.equal(validAccess.summary, 'Your access role changed.')
  assert.equal(validAccess.targetPath, '/idtsbugmanagementui/index.html')
  for (const id of [atomicID('d4', 12), atomicID('d4', 13), atomicID('d4', 15), atomicID('d4', 16)]) {
    const unavailable = byID.get(id)
    assert.equal(unavailable.eventType, 'UNAVAILABLE')
    assert.equal(unavailable.summary, null)
    assert.equal(unavailable.targetPath, null)
  }
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), [...NOTIFICATION_DTO_FIELDS].sort(), 'DTO exposes only the documented safe fields')
    for (const forbidden of ['recipientEmail', 'detailsSummary', 'providerMessageId', 'lockToken', 'sourceAuditEvent']) {
      assert.equal(Object.hasOwn(row, forbidden), false, `DTO omits ${forbidden}`)
    }
  }
  const reloadedInboxRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').where({ recipient_ID: USER_A }).orderBy('ID asc')
  )
  assert.deepEqual(inboxSnapshot(reloadedInboxRows), inboxSnapshot(rawInboxRows))
  return {
    beforeState: { sourceRows: rawInboxRows.length, bugSourceRows: bugSourceRows.length, accessSourceRows: accessSourceRows.length },
    afterState: { dtoRows: rows.length, unavailableRows: rows.filter(row => row.eventType === 'UNAVAILABLE').length },
    reloadState: { rawRows: reloadedInboxRows.length, safeProjectionRows: rows.length, dtoFieldsExact: true, privateFieldsExposed: false }
  }
}

async function runAtomicUnreadCountCase () {
  const notifications = [21, 22, 23, 24, 25].map(index => atomicNotification(index, {
    recipient_ID: index >= 24 ? USER_B : USER_A
  }))
  const inboxEntries = [
    atomicInbox(21, { readAt: '2026-08-27T01:01:00.000Z' }),
    atomicInbox(22),
    atomicInbox(23),
    atomicInbox(24, { recipient_ID: USER_B }),
    atomicInbox(25, { recipient_ID: USER_B })
  ]
  const fixture = await createAtomicFixture({ notifications, inboxEntries })
  const beforeRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').columns('ID', 'recipient_ID', 'occurredAt', 'readAt', 'modifiedAt').orderBy('ID asc')
  )
  const unreadCount = recipientID => beforeRows.filter(row => row.recipient_ID === recipientID && !row.readAt).length
  const callerAUnread = unreadCount(USER_A)
  const callerBUnread = unreadCount(USER_B)
  const inactiveRows = beforeRows.filter(row => row.recipient_ID === INACTIVE).length
  const pmRows = beforeRows.filter(row => row.recipient_ID === PM_USER).length
  const userAdminRows = beforeRows.filter(row => row.recipient_ID === USER_ADMIN).length
  const callerACount = await fixture.service.send({ event: 'getMyUnreadNotificationCount', user: fixture.actorA })
  const callerBCount = await fixture.service.send({ event: 'getMyUnreadNotificationCount', user: fixture.actorB })
  assert.deepEqual(callerACount, { count: callerAUnread })
  assert.deepEqual(callerBCount, { count: callerBUnread })
  const anonymousStatus = await expectSafeDenied(
    fixture.service.send({ event: 'getMyUnreadNotificationCount', user: new cds.User.Anonymous() }),
    401
  )
  const anonymousPrincipalStatus = await expectSafeDenied(
    fixture.service.send({ event: 'getMyUnreadNotificationCount', user: user('anonymous.notification@example.invalid') }),
    403,
    'NOTIFICATION_ACTOR_REQUIRED'
  )
  const inactiveStatus = await expectSafeDenied(
    fixture.service.send({ event: 'getMyUnreadNotificationCount', user: fixture.inactiveActor }),
    403,
    'NOTIFICATION_ACTOR_REQUIRED'
  )
  const unmappedStatus = await expectSafeDenied(
    fixture.service.send({ event: 'getMyUnreadNotificationCount', user: user('unmapped.notification@example.invalid') }),
    403,
    'NOTIFICATION_ACTOR_REQUIRED'
  )
  const pmCount = await fixture.service.send({ event: 'getMyUnreadNotificationCount', user: fixture.pmActor })
  const userAdminCount = await fixture.service.send({ event: 'getMyUnreadNotificationCount', user: fixture.userAdminActor })
  assert.deepEqual(pmCount, { count: pmRows })
  assert.deepEqual(userAdminCount, { count: userAdminRows })
  assert.equal(pmCount.count, 0, 'PM without recipient-owned rows cannot count another caller\'s inbox')
  assert.equal(userAdminCount.count, 0, 'UserAdmin overlay without recipient-owned rows cannot count another caller\'s inbox')
  assert.ok(callerACount.count > pmCount.count)
  const afterRows = await fixture.db.run(
    SELECT.from('idts.cap.UserNotificationInboxEntries').columns('ID', 'recipient_ID', 'occurredAt', 'readAt', 'modifiedAt').orderBy('ID asc')
  )
  assert.deepEqual(inboxSnapshot(afterRows), inboxSnapshot(beforeRows), 'unauthorized calls do not mutate inbox state')
  return {
    beforeState: { inboxRows: beforeRows.length, callerAUnread, callerBUnread, inactiveRows, pmRows, userAdminRows },
    afterState: { callerAUnread: callerACount.count, callerBUnread: callerBCount.count, pmUnread: pmCount.count, userAdminUnread: userAdminCount.count },
    reloadState: { rowsUnchanged: true, deniedStatuses: [anonymousStatus, anonymousPrincipalStatus, inactiveStatus, unmappedStatus], safeNoPayload: true }
  }
}

async function runAtomicReadCase () {
  const fixture = await createAtomicFixture({
    notifications: [atomicNotification(31)],
    inboxEntries: [atomicInbox(31)]
  })
  const before = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: atomicID('d4', 31) }))
  const [current] = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'UNREAD', skip: 0, top: 1 },
    user: fixture.actorA
  })
  const marked = await fixture.service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: current.notificationID, expectedModifiedAt: current.modifiedAt },
    user: fixture.actorA
  })
  assert.ok(marked.readAt)
  const after = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  const reload = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  assert.ok(after.readAt)
  assert.equal(reload.readAt, after.readAt)
  assert.equal(after.readAt, marked.readAt)
  return {
    beforeState: rowSnapshot(before),
    afterState: rowSnapshot(after),
    reloadState: rowSnapshot(reload)
  }
}

async function runAtomicIdempotentReadCase () {
  const fixture = await createAtomicFixture({
    notifications: [atomicNotification(32)],
    inboxEntries: [atomicInbox(32)]
  })
  const before = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: atomicID('d4', 32) }))
  const [current] = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'UNREAD', skip: 0, top: 1 },
    user: fixture.actorA
  })
  assert.equal(current.readAt, null, 'the first read starts from an unread DTO')
  const first = await fixture.service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: current.notificationID, expectedModifiedAt: current.modifiedAt },
    user: fixture.actorA
  })
  assert.ok(first.readAt, 'the first mark-read call transitions the DTO to read')
  const afterFirst = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  assert.ok(afterFirst.readAt, 'the first mark-read call persists readAt')
  const firstReload = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  assert.ok(firstReload.readAt, 'the persisted first read remains read after reload before retry')
  assert.equal(firstReload.readAt, first.readAt)
  const repeated = await fixture.service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: current.notificationID, expectedModifiedAt: first.modifiedAt },
    user: fixture.actorA
  })
  const afterRepeat = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  assert.ok(repeated.readAt, 'the repeated call still returns a read DTO')
  assert.equal(repeated.readAt, first.readAt)
  assert.equal(repeated.modifiedAt, first.modifiedAt)
  assert.equal(afterRepeat.readAt, firstReload.readAt)
  assert.equal(afterRepeat.modifiedAt, firstReload.modifiedAt)
  return {
    beforeState: rowSnapshot(before),
    afterState: rowSnapshot(firstReload),
    reloadState: rowSnapshot(afterRepeat)
  }
}

async function runAtomicStaleReadCase () {
  const fixture = await createAtomicFixture({
    notifications: [atomicNotification(33)],
    inboxEntries: [atomicInbox(33)]
  })
  const [current] = await fixture.service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'UNREAD', skip: 0, top: 1 },
    user: fixture.actorA
  })
  const before = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  await expectRejected(
    fixture.service.send({
      event: 'markMyNotificationRead',
      data: { notificationID: current.notificationID, expectedModifiedAt: '2026-01-01T00:00:00.000Z' },
      user: fixture.actorA
    }),
    409,
    'NOTIFICATION_VERSION_CONFLICT'
  )
  const after = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  const reload = await fixture.db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: current.notificationID }))
  assert.equal(after.readAt, null)
  assert.equal(after.modifiedAt, before.modifiedAt)
  assert.deepEqual(rowSnapshot(reload), rowSnapshot(before))
  return {
    beforeState: rowSnapshot(before),
    afterState: rowSnapshot(after),
    reloadState: rowSnapshot(reload)
  }
}

async function runAtomicMarkAllCase () {
  const notifications = [41, 42, 43, 44].map(index => atomicNotification(index, {
    recipient_ID: index === 44 ? USER_B : USER_A
  }))
  const inboxEntries = [
    atomicInbox(41, { occurredAt: '2026-08-27T01:00:00.000Z' }),
    atomicInbox(42, { occurredAt: '2026-08-27T01:30:00.000Z' }),
    atomicInbox(43, { occurredAt: '2026-08-27T02:00:00.000Z' }),
    atomicInbox(44, { recipient_ID: USER_B, occurredAt: '2026-08-27T01:00:00.000Z' })
  ]
  const fixture = await createAtomicFixture({ notifications, inboxEntries })
  const beforeRows = await fixture.db.run(SELECT.from('idts.cap.UserNotificationInboxEntries').orderBy('ID asc'))
  const marked = await fixture.service.send({
    event: 'markAllMyNotificationsRead',
    data: { throughOccurredAt: '2026-08-27T01:30:00.000Z' },
    user: fixture.actorA
  })
  assert.deepEqual(marked, { count: 2 })
  const afterRows = await fixture.db.run(SELECT.from('idts.cap.UserNotificationInboxEntries').orderBy('ID asc'))
  const byID = new Map(afterRows.map(row => [row.ID, row]))
  assert.ok(byID.get(atomicID('d4', 41)).readAt)
  assert.ok(byID.get(atomicID('d4', 42)).readAt)
  assert.equal(byID.get(atomicID('d4', 43)).readAt, null)
  assert.equal(byID.get(atomicID('d4', 44)).readAt, null)
  const pmMarked = await fixture.service.send({
    event: 'markAllMyNotificationsRead',
    data: { throughOccurredAt: '2026-08-27T23:00:00.000Z' },
    user: fixture.pmActor
  })
  const userAdminMarked = await fixture.service.send({
    event: 'markAllMyNotificationsRead',
    data: { throughOccurredAt: '2026-08-27T23:00:00.000Z' },
    user: fixture.userAdminActor
  })
  assert.deepEqual(pmMarked, { count: 0 }, 'PM mark-all cannot update another caller\'s inbox')
  assert.deepEqual(userAdminMarked, { count: 0 }, 'UserAdmin mark-all cannot update another caller\'s inbox')
  const reloadRows = await fixture.db.run(SELECT.from('idts.cap.UserNotificationInboxEntries').orderBy('ID asc'))
  assert.deepEqual(reloadRows.map(row => row.readAt), afterRows.map(row => row.readAt))
  const beforeByID = new Map(beforeRows.map(row => [row.ID, row]))
  const updatedBeforeSnapshot = afterRows.filter(row => !beforeByID.get(row.ID)?.readAt && row.readAt).length
  return {
    beforeState: rowsSnapshot(beforeRows),
    afterState: rowsSnapshot(afterRows),
    reloadState: { updatedBeforeSnapshot, laterUnread: reloadRows.find(row => row.ID === atomicID('d4', 43)).readAt === null, otherCallerUnread: reloadRows.find(row => row.ID === atomicID('d4', 44)).readAt === null, pmCount: pmMarked.count, userAdminCount: userAdminMarked.count }
  }
}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  const model = await cds.load('srv/notification.cds')
  const serviceDefinition = model.definitions.NotificationService
  const searchDefinition = model.definitions['NotificationService.searchMyNotifications']
  const summary = model.definitions['NotificationService.NotificationSummary']
  assert.ok(serviceDefinition, 'NotificationService is defined')
  assert.deepEqual(
    Object.keys(searchDefinition.params),
    ['category', 'readState', 'skip', 'top'],
    'search has no cross-source free-text input'
  )
  assert.ok(model.definitions['NotificationService.markMyNotificationRead'], 'single-read action exists')
  assert.ok(model.definitions['NotificationService.markAllMyNotificationsRead'], 'snapshot mark-all action exists')
  for (const forbidden of ['recipientEmail', 'sourceAuditEvent', 'providerMessageId', 'lockToken', 'detailsSummary']) {
    assert.equal(summary.elements[forbidden], undefined, `summary omits ${forbidden}`)
  }
  assert.ok(summary.elements.bugNumber, 'caller-only summary exposes the related Bug number')
  assert.ok(summary.elements.bugTitle, 'caller-only summary exposes the related Bug title')
  assert.equal(summary.elements.bugDescription, undefined, 'notification popover does not expose the Bug description')

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: USER_A, displayName: 'Notification User A', email: 'notification.a@example.invalid', role_code: 'TESTER', active: true },
    { ID: USER_B, displayName: 'Notification User B', email: 'notification.b@example.invalid', role_code: 'DEVELOPER', active: true },
    { ID: INACTIVE, displayName: 'Inactive Notification User', email: 'notification.inactive@example.invalid', role_code: 'TESTER', active: false }
  ]))

  const occurredAt = '2026-08-27T01:00:00.000Z'
  const notifications = Array.from({ length: 105 }, (_, index) => ({
    ID: `d3${String(index).padStart(6, '0')}-0000-4000-8000-000000000001`,
    bug_ID: BUG_ID,
    recipient_ID: USER_A,
    eventType_code: index % 2 === 0 ? 'ASSIGNED' : 'UPDATED',
    channel_code: 'IN_APP',
    deliveryStatus_code: 'SENT',
    message: `Safe notification ${index}`,
    sourceKey: `TEST:${index}`
  }))
  await db.run(INSERT.into('idts.cap.Notifications').entries(notifications))
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries(
    notifications.map((notification, index) => ({
      ID: `d4${String(index).padStart(6, '0')}-0000-4000-8000-000000000001`,
      recipient_ID: USER_A,
      bugNotification_ID: notification.ID,
      occurredAt,
      readAt: index === 0 ? '2026-08-27T01:01:00.000Z' : null
    }))
  ))
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: ACCESS_AUDIT,
    targetUser_ID: USER_B,
    action: 'CHANGE_ROLE',
    result: 'APPLIED',
    correlationId: ACCESS_AUDIT,
    detailsSummary: 'Access changed safely.'
  }))
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({
    ID: 'd5000000-0000-4000-8000-000000000001',
    recipient_ID: USER_B,
    accessAuditEvent_ID: ACCESS_AUDIT,
    occurredAt: '2026-08-27T02:00:00.000Z'
  }))

  const app = require('express')()
  app.use((req, res, next) => {
    req.user = req.headers['x-test-persona'] === 'b'
      ? user('notification.b@example.invalid', 'DEVELOPER')
      : new cds.User.Anonymous()
    next()
  })
  const service = await cds.serve('NotificationService').from('srv/notification.cds').in(app)
  const actorA = user('notification.a@example.invalid')
  const actorB = user('notification.b@example.invalid', 'DEVELOPER')
  const defaultPage = await service.send({
    event: 'searchMyNotifications',
    data: { category: 'ALL', readState: 'ALL' },
    user: actorA
  })
  assert.equal(defaultPage.length, 25)
  assert.deepEqual(
    defaultPage.map(row => row.notificationID),
    [...defaultPage.map(row => row.notificationID)].sort().reverse(),
    'equal timestamps use notification ID descending as a stable tie-breaker'
  )
  assert.ok(defaultPage.every(row => row.category === 'BUG'))
  assert.ok(defaultPage.every(row => row.bugNumber === 'BUG-0001'))
  assert.ok(defaultPage.every(row => row.bugTitle === 'List report filters do not show defect category value help'))
  assert.ok(defaultPage.every(row => row.targetPath === `/idtsbugmanagementui/index.html#/Bugs(ID=${BUG_ID},IsActiveEntity=true)`),
    'Bug deep links include the active-entity key used by the real Fiori route')
  assert.ok(defaultPage.every(row => !('recipientEmail' in row) && !('detailsSummary' in row)))

  const maximumPage = await service.send({
    event: 'searchMyNotifications',
    data: { category: 'BUG', readState: 'UNREAD', skip: 0, top: 100 },
    user: actorA
  })
  assert.equal(maximumPage.length, 100)
  assert.ok(maximumPage.every(row => row.readAt === null))
  await expectRejected(service.send({
    event: 'searchMyNotifications', data: { category: 'ALL', readState: 'ALL', top: 101 }, user: actorA
  }), 400, 'INVALID_NOTIFICATION_PAGE')
  await expectRejected(service.send({
    event: 'searchMyNotifications', data: { category: 'ALL', readState: 'ALL', skip: 10001 }, user: actorA
  }), 400, 'INVALID_NOTIFICATION_PAGE')
  await expectRejected(service.send({
    event: 'searchMyNotifications', data: { category: 'PRIVATE', readState: 'ALL' }, user: actorA
  }), 400, 'INVALID_NOTIFICATION_FILTER')

  const userBRows = await service.send({
    event: 'searchMyNotifications', data: { category: 'ALL', readState: 'ALL' }, user: actorB
  })
  assert.equal(userBRows.length, 1)
  assert.equal(userBRows[0].category, 'ACCESS')
  assert.equal(userBRows[0].eventType, 'CHANGE_ROLE')
  assert.equal(userBRows[0].bugNumber, null)
  assert.equal(userBRows[0].bugTitle, null)
  assert.equal(userBRows[0].summary, 'Your access role changed.')
  assert.doesNotMatch(userBRows[0].summary, /safely/i, 'raw audit details do not enter the public DTO')
  assert.equal(userBRows[0].targetPath, '/idtsbugmanagementui/index.html')
  for (const result of ['FAILED', 'QUEUED', 'NOOP_ALREADY_DESIRED']) {
    await db.run(UPDATE('idts.cap.UserIdentityAuditEvents').set({ result }).where({ ID: ACCESS_AUDIT }))
    const rows = await service.send({ event: 'searchMyNotifications', user: actorB })
    assert.equal(rows[0].eventType, 'UNAVAILABLE', 'unapplied access cannot claim a completed change')
    assert.equal(rows[0].summary, null)
    assert.equal(rows[0].targetPath, null)
  }
  await db.run(UPDATE('idts.cap.UserIdentityAuditEvents').set({ result: 'APPLIED' }).where({ ID: ACCESS_AUDIT }))
  const vietnamese = await service.send({ event: 'searchMyNotifications', user: actorB, locale: 'vi' })
  assert.equal(vietnamese[0].summary, 'Vai trò truy cập của bạn đã thay đổi.')
  const localizedBug = await service.send({ event: 'searchMyNotifications', user: actorA, locale: 'vi' })
  assert.equal(localizedBug[0].title, 'Được giao Bug')
  assert.equal(localizedBug[0].priority, 'HIGH')
  await verifyODataWire(app)
  await db.run(UPDATE('idts.cap.UserNotificationInboxEntries').set({ readAt: null })
    .where({ ID: 'd5000000-0000-4000-8000-000000000001' }))
  await verifyHydrationSafety(db, notifications[0].ID)

  const unread = await service.send({ event: 'getMyUnreadNotificationCount', user: actorA })
  assert.deepEqual(unread, { count: 104 })

  const rowToRead = defaultPage.find(row => row.readAt === null)
  const firstRead = await service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: rowToRead.notificationID, expectedModifiedAt: rowToRead.modifiedAt },
    user: actorA
  })
  assert.ok(firstRead.readAt, 'first tab persists readAt')
  const repeatedRead = await service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: rowToRead.notificationID, expectedModifiedAt: rowToRead.modifiedAt },
    user: actorA
  })
  assert.equal(repeatedRead.readAt, firstRead.readAt, 'second tab with the same version is idempotent')

  const staleRow = defaultPage.find(row => row.readAt === null && row.notificationID !== rowToRead.notificationID)
  await expectRejected(service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: staleRow.notificationID, expectedModifiedAt: '2026-01-01T00:00:00.000Z' },
    user: actorA
  }), 409, 'NOTIFICATION_VERSION_CONFLICT')
  await expectRejected(service.send({
    event: 'markMyNotificationRead',
    data: { notificationID: staleRow.notificationID, expectedModifiedAt: staleRow.modifiedAt },
    user: actorB
  }), 404, 'NOTIFICATION_NOT_FOUND')

  const snapshot = '2026-08-27T01:30:00.000Z'
  const lateNotification = 'd3999999-0000-4000-8000-000000000001'
  const lateInbox = 'd4999999-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.Notifications').entries({
    ID: lateNotification,
    bug_ID: BUG_ID,
    recipient_ID: USER_A,
    eventType_code: 'UPDATED',
    channel_code: 'IN_APP',
    deliveryStatus_code: 'SENT',
    message: 'Arrived after mark-all snapshot',
    sourceKey: 'TEST:LATE'
  }))
  await db.run(INSERT.into('idts.cap.UserNotificationInboxEntries').entries({
    ID: lateInbox,
    recipient_ID: USER_A,
    bugNotification_ID: lateNotification,
    occurredAt: '2026-08-27T02:30:00.000Z'
  }))
  const marked = await service.send({
    event: 'markAllMyNotificationsRead', data: { throughOccurredAt: snapshot }, user: actorA
  })
  assert.ok(marked.count > 0)
  const lateStored = await db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: lateInbox }))
  assert.equal(lateStored.readAt, null, 'notification after snapshot remains unread')

  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: USER_A }))
  await expectRejected(service.send({ event: 'getMyUnreadNotificationCount', user: actorA }), 403, 'NOTIFICATION_ACTOR_REQUIRED')
  await expectRejected(service.send({
    event: 'getMyUnreadNotificationCount', user: user('unmapped@example.invalid')
  }), 403, 'NOTIFICATION_ACTOR_REQUIRED')
  await verifyXsuaaAuthorization(service, db)

  const { hydrateNotificationPage } = require('../../srv/notification/inbox')
  let sourceReads = 0
  const fakeTx = {
    run: async () => {
      sourceReads += 1
      return []
    }
  }
  await hydrateNotificationPage(fakeTx, [
    { ID: 'bug', bugNotification_ID: notifications[0].ID, accessAuditEvent_ID: null, occurredAt },
    { ID: 'access', bugNotification_ID: null, accessAuditEvent_ID: ACCESS_AUDIT, occurredAt }
  ])
  assert.equal(sourceReads, 2, 'one Bug source read plus one access source read hydrates a mixed page')

  console.log('IDTS My Notifications caller-only service contract: PASS')
}

async function verifyXsuaaAuthorization (service, db) {
  const originalKind = cds.env.requires.auth.kind
  const originalImpl = cds.env.requires.auth.impl
  const origin = 'notification-test'
  const issuer = 'https://issuer.example.invalid'
  const subject = 'notification-user-b'
  await db.run(UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: identityKeyHash({ origin, issuer, subject }) }).where({ ID: USER_B }))
  cds.env.requires.auth.kind = 'xsuaa'
  delete cds.env.requires.auth.impl
  function linkedUser (roles, uuid = subject) {
    const caller = new cds.User({ id: 'mutable-login', roles: ['authenticated-user', ...roles] })
    caller.authInfo = { token: { origin, issuer, payload: { user_uuid: uuid } } }
    return caller
  }
  try {
    assert.deepEqual(await service.send({ event: 'getMyUnreadNotificationCount', user: linkedUser(['DEVELOPER']) }), { count: 1 })
    for (const caller of [linkedUser(['TESTER']), linkedUser(['PM', 'UserAdmin']), linkedUser([]), linkedUser(['DEVELOPER', 'TESTER']), linkedUser(['DEVELOPER'], 'unmapped')]) {
      for (const [event, data] of [
        ['searchMyNotifications', { category: 'ALL' }],
        ['getMyUnreadNotificationCount', {}],
        ['markMyNotificationRead', { notificationID: 'd5000000-0000-4000-8000-000000000001', expectedModifiedAt: '2026-01-01T00:00:00.000Z' }],
        ['markAllMyNotificationsRead', { throughOccurredAt: '2026-08-27T23:00:00.000Z' }]
      ]) await expectRejected(service.send({ event, data, user: caller }), 403)
    }
    await db.run(UPDATE('idts.cap.Users').set({ role_code: 'PM' }).where({ ID: USER_B }))
    const pm = linkedUser(['PM', 'UserAdmin'])
    assert.deepEqual(await service.send({ event: 'getMyUnreadNotificationCount', user: pm }), { count: 1 }, 'PM cannot count another inbox')
    await service.send({ event: 'markAllMyNotificationsRead', data: { throughOccurredAt: '2026-08-27T23:00:00.000Z' }, user: pm })
    const other = await db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ ID: 'd4999999-0000-4000-8000-000000000001' }))
    assert.equal(other.readAt, null, 'PM mark-all never updates another inbox')
  } finally {
    cds.env.requires.auth.kind = originalKind
    if (originalImpl === undefined) delete cds.env.requires.auth.impl
    else cds.env.requires.auth.impl = originalImpl
  }
}

async function verifyODataWire (app) {
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  const base = `http://127.0.0.1:${server.address().port}/odata/v4/notification`
  try {
    const denied = await fetch(`${base}/getMyUnreadNotificationCount()`)
    assert.equal(denied.status, 401, 'wire endpoint denies anonymous sessions')
    const headers = { 'x-test-persona': 'b', 'Accept-Language': 'vi' }
    const response = await fetch(`${base}/searchMyNotifications(category='ALL',readState='ALL',skip=0,top=25)`, { headers })
    assert.equal(response.status, 200)
    const { value } = await response.json()
    assert.equal(value.length, 1)
    assert.equal(value[0].summary, 'Vai trò truy cập của bạn đã thay đổi.')
    assert.equal(value[0].category, 'ACCESS')
    const tooMany = await fetch(`${base}/searchMyNotifications(top=101)`, { headers })
    assert.equal(tooMany.status, 400)
    const count = await fetch(`${base}/getMyUnreadNotificationCount()`, { headers })
    assert.equal((await count.json()).count, 1)
    const cross = await fetch(`${base}/markMyNotificationRead`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationID: 'd4000104-0000-4000-8000-000000000001', expectedModifiedAt: '2026-08-27T00:00:00.000Z' })
    })
    assert.equal(cross.status, 404)
    const read = await fetch(`${base}/markMyNotificationRead`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationID: value[0].notificationID, expectedModifiedAt: value[0].modifiedAt })
    })
    assert.equal(read.status, 200)
    assert.ok((await read.json()).readAt)
    const reload = await fetch(`${base}/getMyUnreadNotificationCount()`, { headers })
    assert.equal((await reload.json()).count, 0, 'wire reload observes persisted read state')
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
}

async function verifyHydrationSafety (db, bugNotificationID) {
  const { hydrateNotificationPage } = require('../../srv/notification/inbox')
  const row = {
    ID: 'd6000000-0000-4000-8000-000000000001', recipient_ID: USER_A,
    bugNotification_ID: bugNotificationID, accessAuditEvent_ID: null,
    occurredAt: '2026-08-27T01:00:00.000Z'
  }
  for (const entry of [
    { ...row, recipient_ID: USER_B },
    { ...row, accessAuditEvent_ID: ACCESS_AUDIT },
    { ...row, bugNotification_ID: null }
  ]) {
    const [result] = await hydrateNotificationPage(db, [entry], 'vi')
    assert.equal(result.eventType, 'UNAVAILABLE', 'invalid source/recipient invariant fails closed')
    assert.equal(result.title, 'Thông báo không khả dụng')
    assert.equal(result.targetPath, null)
    assert.equal(result.summary, null)
  }
  const [fallback] = await hydrateNotificationPage(db, [row], 'zz')
  assert.equal(fallback.title, 'Assigned', 'unsupported locale falls back to English')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
