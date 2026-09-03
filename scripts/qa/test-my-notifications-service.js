'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql
const { identityKeyHash } = require('../../srv/auth/identity-map')

const root = path.resolve(__dirname, '../..')
const servicePath = path.join(root, 'srv/notification.cds')
assert.ok(fs.existsSync(servicePath), 'NotificationService CDS contract exists')

const USER_A = 'd1000000-0000-4000-8000-000000000001'
const USER_B = 'd1000000-0000-4000-8000-000000000002'
const INACTIVE = 'd1000000-0000-4000-8000-000000000003'
const BUG_ID = '90000000-0000-0000-0000-000000000001'
const ACCESS_AUDIT = 'd2000000-0000-4000-8000-000000000001'

function user (email, role = 'TESTER') {
  return new cds.User({ id: email, roles: ['authenticated-user', role] })
}

async function expectRejected (promise, status, code) {
  await assert.rejects(promise, error =>
    Number(error?.status || error?.statusCode || error?.code) === status && (!code || error?.code === code))
}

async function main () {
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
