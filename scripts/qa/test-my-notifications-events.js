'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { writeNotificationRecord } = require('../../srv/email/outbox')
const { buildLifecycleNotification } = require('../../srv/bug-service/history')
const { hydrateNotificationPage } = require('../../srv/notification/inbox')
const { recordBugChangeSideEffects } = require('../../srv/bug-service/history')
const { resubmitToDeveloper, reassignRetestOwner } = require('../../srv/bug-service/actions')

function emailConfig () {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    username: 'test-user',
    password: 'test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test'
  })
}

async function count (db, entity, where) {
  const row = await db.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

async function main () {
  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/notification.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const bug = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID'))
  const recipient = await db.run(SELECT.one.from('idts.cap.Users').columns('ID').where({ active: true }))
  assert.ok(bug?.ID)
  assert.ok(recipient?.ID)
  const entities = Object.fromEntries([
    'Bugs', 'Users', 'HistoryEvents', 'HistoryLogs', 'StatusValues', 'PriorityValues', 'SeverityValues',
    'EnvironmentValues', 'DeveloperProfiles', 'SAPModules', 'ApplicationComponents', 'DefectCategories',
    'ComponentCategories', 'ProcessorRoleValues'
  ].map(name => [name, `idts.cap.${name}`]))
  const routeBug = await db.run(SELECT.one.from(entities.Bugs).where({ ID: bug.ID }))
  const routeActor = await db.run(SELECT.one.from(entities.Users).where({ active: true }))
  const routeOwner = await db.run(SELECT.one.from(entities.Users).where({ active: true, ID: { '!=': routeActor.ID } }))
  const routeAssignee = await db.run(SELECT.one.from(entities.DeveloperProfiles).columns('ID'))
  assert.ok(routeOwner?.ID, 'fixture has a distinct current owner')

  // Production route: history side effects receive a CAP request and persist all lifecycle records.
  const routeReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  const routeSourceBefore = `STATUS:`
  await db.tx(routeReq, async () => {
    await recordBugChangeSideEffects(routeReq, entities, [{
      fieldName: 'nextProcessorUser', oldValue: routeBug.nextProcessorUser_ID, newValue: routeOwner.ID
    }], { ...routeBug, nextProcessorUser_ID: routeOwner.ID, status_code: 'IN_PROGRESS' })
  })
  const ownerRouteNotification = await db.run(SELECT.one.from('idts.cap.Notifications')
    .where({ recipient_ID: routeOwner.ID, eventType_code: 'OWNER_CHANGED' }))
  assert.ok(ownerRouteNotification?.sourceKey?.startsWith(routeSourceBefore), 'owner route persisted a history-derived source key')
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: ownerRouteNotification.ID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: ownerRouteNotification.ID }), 1)

  const removalReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  await db.tx(removalReq, async () => {
    await recordBugChangeSideEffects(removalReq, entities, [{
      fieldName: 'assignee', oldValue: routeAssignee.ID, newValue: null
    }], { ...routeBug, assignee_ID: null, nextProcessorUser_ID: null, status_code: 'PENDING_ASSIGNMENT' })
  })
  const removalRouteNotification = await db.run(SELECT.one.from('idts.cap.Notifications').where({ eventType_code: 'ASSIGNMENT_REMOVED' }))
  assert.ok(removalRouteNotification, 'assignee removal route persisted an inbox-only notification')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: removalRouteNotification.ID }), 0)

  const developerProfile = await db.run(SELECT.one.from(entities.DeveloperProfiles).columns('ID', 'user_ID'))
  const coordinator = await db.run(SELECT.one.from(entities.Users).where({ active: true, role_code: { in: ['TESTER', 'PM'] } }))
  await db.run(cds.ql.UPDATE(entities.Bugs).set({
    status_code: 'NEED_MORE_INFORMATION', assignee_ID: developerProfile.ID,
    nextProcessorUser_ID: coordinator.ID, nextProcessorRole_code: 'TESTER'
  }).where({ ID: bug.ID }))
  const resubmitReq = new cds.Request({
    user: new cds.User({ id: coordinator.email, roles: [coordinator.role_code, 'authenticated-user'] }),
    params: [{ ID: bug.ID }], data: { note: 'Route coverage note.' }
  })
  const resubmittedBug = await db.tx(resubmitReq, () => resubmitToDeveloper(resubmitReq, entities))
  const resubmitNotification = await db.run(SELECT.one.from('idts.cap.Notifications').where({
    recipient_ID: resubmittedBug.nextProcessorUser_ID, eventType_code: 'RESUBMITTED'
  }))
  assert.ok(resubmitNotification?.sourceKey?.startsWith('STATUS:'))
  assert.ok(resubmitNotification.sourceKey.endsWith(`:${resubmittedBug.nextProcessorUser_ID}`))
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: resubmitNotification.ID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: resubmitNotification.ID }), 1)

  const pm = await db.run(SELECT.one.from(entities.Users).where({ active: true, role_code: 'PM' }))
  let testers = await db.run(SELECT.from(entities.Users).where({ active: true, role_code: 'TESTER' }))
  if (testers.length < 2) {
    await db.run(cds.ql.INSERT.into(entities.Users).entries({
      ID: 'de000000-0000-4000-8000-000000000007', displayName: 'Route Tester',
      email: 'route-tester@example.test', role_code: 'TESTER', active: true
    }))
    testers = await db.run(SELECT.from(entities.Users).where({ active: true, role_code: 'TESTER' }))
  }
  const oldRetestOwner = testers[0]
  const newRetestOwner = testers[1]
  assert.ok(oldRetestOwner?.ID && newRetestOwner?.ID, 'fixture has two active testers')
  await db.run(cds.ql.UPDATE(entities.Bugs).set({
    status_code: 'RESOLVED', retestOwner_ID: oldRetestOwner.ID,
    nextProcessorUser_ID: oldRetestOwner.ID, nextProcessorRole_code: 'TESTER'
  }).where({ ID: bug.ID }))
  const retestReq = new cds.Request({
    user: new cds.User({ id: pm.email, roles: ['PM', 'authenticated-user'] }), params: [{ ID: bug.ID }],
    data: { retestOwnerID: newRetestOwner.ID, reason: 'Route coverage reassignment.' }
  })
  await db.tx(retestReq, () => reassignRetestOwner(retestReq, entities))
  const retestNotification = await db.run(SELECT.one.from('idts.cap.Notifications').where({
    recipient_ID: newRetestOwner.ID, eventType_code: 'RETEST_OWNER_CHANGED'
  }))
  assert.ok(retestNotification?.sourceKey?.startsWith('STATUS:'))
  assert.ok(retestNotification.sourceKey.endsWith(`:${newRetestOwner.ID}`))
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: retestNotification.ID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: retestNotification.ID }), 1)

  const historyID = cds.utils.uuid()
  const sourceKey = `STATUS:${historyID}:${recipient.ID}`
  const inApp = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Inbox-only assignment removal.',
    sourceKey,
    emailRequired: false
  }, emailConfig()))
  assert.equal(inApp.deliveryStatus, 'IN_APP_ONLY')
  assert.equal(inApp.deliveryID, null)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: inApp.notificationID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: inApp.notificationID }), 0)

  const duplicate = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Duplicate producer must reuse source.',
    sourceKey,
    emailRequired: false
  }, emailConfig()))
  assert.deepEqual(duplicate, inApp)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: inApp.notificationID }), 1)

  const emailHistoryID = cds.utils.uuid()
  const emailSourceKey = `STATUS:${emailHistoryID}:${recipient.ID}`
  const email = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'ASSIGNED',
    message: 'Prompt assignment.',
    sourceKey: emailSourceKey,
    emailRequired: true
  }, emailConfig()))
  assert.equal(email.deliveryStatus, 'PENDING')
  assert.ok(email.deliveryID)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: email.notificationID }), 1)

  const ownerChanged = await db.tx(tx => writeNotificationRecord(tx, {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'OWNER_CHANGED',
    message: 'Current owner changed.',
    sourceKey: `STATUS:${cds.utils.uuid()}:${recipient.ID}`,
    emailRequired: true
  }, emailConfig()))
  const ownerInbox = await db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ bugNotification_ID: ownerChanged.notificationID }))
  const [ownerSummary] = await hydrateNotificationPage(db, [ownerInbox], 'en')
  assert.equal(ownerSummary.eventType, 'OWNER_CHANGED')
  assert.equal(ownerSummary.actionRequired, true, 'owner-only handoff requires action without changing legacy UPDATED')

  const concurrentHistoryID = cds.utils.uuid()
  const concurrentSourceKey = `STATUS:${concurrentHistoryID}:${recipient.ID}`
  const concurrentEntry = {
    bugID: bug.ID,
    recipientID: recipient.ID,
    eventType: 'RESOLVED',
    message: 'Concurrent lifecycle producer.',
    sourceKey: concurrentSourceKey,
    emailRequired: true
  }
  const independentProducer = () => db.tx(async tx => {
    const calls = []
    const instrumentedTx = { run: query => { calls.push(query); return tx.run(query) } }
    return { result: await writeNotificationRecord(instrumentedTx, concurrentEntry, emailConfig()), calls }
  })
  const concurrent = await Promise.all([independentProducer(), independentProducer()])
  assert.equal(concurrent[0].result.notificationID, concurrent[1].result.notificationID, 'independently started producers converge')
  for (const producer of concurrent) {
    const lockIndex = producer.calls.findIndex(query => query?.SELECT?.from?.ref?.[0] === 'idts.cap.Bugs' && query.SELECT.forUpdate)
    const sourceLookupIndex = producer.calls.findIndex(query => JSON.stringify(query).includes('sourceKey'))
    assert.ok(lockIndex >= 0 && sourceLookupIndex > lockIndex, 'real delegated transaction executes Bug lock before source-key lookup')
  }
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: concurrentSourceKey }), 1)
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: concurrent[0].result.notificationID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: concurrent[0].result.notificationID }), 1)

  const rollbackSourceKey = `STATUS:${cds.utils.uuid()}:${recipient.ID}`
  await assert.rejects(db.tx(async tx => {
    await writeNotificationRecord(tx, {
      ...concurrentEntry,
      message: 'Rollback lifecycle producer.',
      sourceKey: rollbackSourceKey
    }, emailConfig())
    throw new Error('ROLLBACK_LIFECYCLE_EVENT')
  }), /ROLLBACK_LIFECYCLE_EVENT/)
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: rollbackSourceKey }), 0)

  const matrix = [
    [ 'ASSIGNED', { nextProcessorUser_ID: recipient.ID }, [], 'ASSIGNED', true ],
    [ 'ASSIGNED', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'assignee', oldValue: 'old-assignee', newValue: 'new-assignee' }], 'REASSIGNED', true ],
    [ 'PENDING_ASSIGNMENT', {}, [{ fieldName: 'assignee', oldValue: 'old-assignee', newValue: null }], 'ASSIGNMENT_REMOVED', false ],
    [ 'NEED_MORE_INFORMATION', { nextProcessorUser_ID: recipient.ID }, [], 'NEED_MORE_INFORMATION', true ],
    [ 'REJECTED', { nextProcessorUser_ID: recipient.ID }, [], 'REJECTED', true ],
    [ 'RESOLVED', { nextProcessorUser_ID: recipient.ID }, [], 'RESOLVED', true ],
    [ 'RETEST_REQUIRED', { nextProcessorUser_ID: recipient.ID }, [], 'RETEST_REQUIRED', true ],
    [ 'REOPENED', { nextProcessorUser_ID: recipient.ID }, [], 'REOPENED', true ],
    [ 'CLOSED', { reporter_ID: recipient.ID }, [], 'CLOSED', true ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_PROGRESS', { nextProcessorUser_ID: recipient.ID }, [], null, null ],
    [ 'IN_REVIEW', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'nextProcessorUser', oldValue: 'old-owner', newValue: recipient.ID }], 'OWNER_CHANGED', true ],
    [ 'IN_PROGRESS', { nextProcessorUser_ID: recipient.ID }, [{ fieldName: 'nextProcessorUser', oldValue: 'old-owner', newValue: recipient.ID }], 'OWNER_CHANGED', true ]
  ]
  for (const [status, bugInput, changes, eventType, emailRequired] of matrix) {
    const plan = buildLifecycleNotification({
      bug: { ID: bug.ID, ...bugInput }, status, changes,
      historyID, previousAssigneeUserID: recipient.ID
    })
    assert.equal(plan?.eventType || null, eventType, `${status} event type`)
    if (plan) {
      assert.equal(plan.recipientID, recipient.ID, `${status} recipient`)
      assert.equal(plan.emailRequired, emailRequired, `${status} channel`)
      assert.equal(plan.sourceKey, `STATUS:${historyID}:${plan.recipientID}`, `${status} source key`)
    }
  }


  console.log('My Notifications lifecycle event matrix: PASS')
}

main().catch(error => {
  console.error('My Notifications lifecycle event matrix: FAIL')
  console.error(error.stack || error.message)
  process.exit(1)
})
