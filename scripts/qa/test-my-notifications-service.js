'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, UPDATE } = cds.ql
const { enforcePlatformRoleAlignment } = require('../../srv/auth/platform-role')

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
    Number(error?.status || error?.statusCode) === status && (!code || error?.code === code))
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
  for (const forbidden of ['recipientEmail', 'sourceAuditEvent', 'providerMessageId', 'lockToken', 'detailsSummary']) {
    assert.equal(summary.elements[forbidden], undefined, `summary omits ${forbidden}`)
  }

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

  const service = await cds.serve('NotificationService').from('srv/notification.cds')
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
  assert.equal(userBRows[0].targetPath, '/idtsbugmanagementui/index.html')

  const unread = await service.send({ event: 'getMyUnreadNotificationCount', user: actorA })
  assert.deepEqual(unread, { count: 104 })
  await db.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: USER_A }))
  await expectRejected(service.send({ event: 'getMyUnreadNotificationCount', user: actorA }), 403, 'NOTIFICATION_ACTOR_REQUIRED')
  await expectRejected(service.send({
    event: 'getMyUnreadNotificationCount', user: user('unmapped@example.invalid')
  }), 403, 'NOTIFICATION_ACTOR_REQUIRED')
  verifyXsuaaRoleMismatch()

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

function verifyXsuaaRoleMismatch () {
  const originalKind = cds.env.requires.auth.kind
  const originalImpl = cds.env.requires.auth.impl
  cds.env.requires.auth.kind = 'xsuaa'
  delete cds.env.requires.auth.impl
  const req = {
    user: { is: role => role === 'TESTER' },
    reject (status, message) {
      throw Object.assign(new Error(message), { status, statusCode: status })
    }
  }
  assert.throws(
    () => enforcePlatformRoleAlignment(req, { ID: USER_B, role_code: 'DEVELOPER', active: true }),
    error => Number(error?.status || error?.statusCode) === 403
  )
  cds.env.requires.auth.kind = originalKind
  if (originalImpl === undefined) delete cds.env.requires.auth.impl
  else cds.env.requires.auth.impl = originalImpl
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
