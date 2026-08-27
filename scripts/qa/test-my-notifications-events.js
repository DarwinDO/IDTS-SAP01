'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const { normalizeEmailConfig } = require('../../srv/email/config')
const { writeNotificationRecord } = require('../../srv/email/outbox')
const { buildEmailMessage } = require('../../srv/email/template')
const { buildLifecycleNotification } = require('../../srv/bug-service/history')
const { hydrateNotificationPage } = require('../../srv/notification/inbox')
const { recordBugChangeSideEffects } = require('../../srv/bug-service/history')
const { addComment, getMentionCandidates, resubmitToDeveloper, reassignRetestOwner } = require('../../srv/bug-service/actions')

function emailConfig () {
  return normalizeEmailConfig({
    enabled: true,
    host: 'smtp.example.test',
    port: 2525,
    username: 'test-user',
    password: 'test-password',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test',
    baseUrl: 'https://idts.example.test'
  })
}

async function count (db, entity, where) {
  const row = await db.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

function commentRequest (actor, bugID, content, mentionedUserIDs = []) {
  return new cds.Request({
    user: new cds.User({ id: actor.email, roles: [actor.role_code, 'authenticated-user'] }),
    params: [{ ID: bugID }],
    data: { content, mentionedUserIDs }
  })
}

async function makeIdentityReady (db, user, requestedByID) {
  const hash = `mention-ready-${user.ID}`
  await db.run(cds.ql.UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: hash }).where({ ID: user.ID }))
  await db.run(cds.ql.INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: cds.utils.uuid(),
    targetEmailNormalized: user.email,
    requestedRole_code: user.role_code,
    status_code: 'ACTIVE',
    requestedBy_ID: requestedByID,
    expiresAt: '2030-01-01T00:00:00.000Z',
    tokenNonce: `mention-${user.ID}`,
    tokenHash: `mention-token-${user.ID}`,
    identityKeyHash: hash,
    activeUser_ID: user.ID,
    correlationId: cds.utils.uuid()
  }))
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

  // RED contract: selected UUIDs (not @text) drive a single transactional mention event.
  const mentionRecipient = await db.run(SELECT.one.from(entities.Users).where({
    active: true,
    ID: { '!=': routeActor.ID },
    role_code: { in: ['TESTER', 'DEVELOPER', 'PM'] }
  }))
  await makeIdentityReady(db, mentionRecipient, routeActor.ID)
  const mentionEntities = { ...entities, Comments: 'idts.cap.Comments' }
  const candidateReq = commentRequest(routeActor, bug.ID, '')
  const candidates = await db.tx(candidateReq, () => getMentionCandidates(candidateReq, mentionEntities))
  const candidate = candidates.find(row => row.ID === mentionRecipient.ID)
  assert.deepEqual(Object.keys(candidate).sort(), ['ID', 'displayName', 'roleCode'], 'picker returns only safe candidate fields')
  assert.ok(!candidates.some(row => row.ID === routeActor.ID), 'picker excludes the comment author')
  const mentionContent = '<script>alert(1)</script>' + 'x'.repeat(240)
  const mentionReq = commentRequest(routeActor, bug.ID, mentionContent, [mentionRecipient.ID, mentionRecipient.ID, routeActor.ID])
  await db.tx(mentionReq, () => addComment(mentionReq, mentionEntities))
  const mentionComment = await db.run(SELECT.one.from('idts.cap.Comments').where({ bug_ID: bug.ID, content: mentionContent }))
  assert.ok(mentionComment?.ID, 'selected mention persists its source comment')
  const mentionSource = `MENTION:${mentionComment.ID}:${mentionRecipient.ID}`
  const mentionNotification = await db.run(SELECT.one.from('idts.cap.Notifications').where({ sourceKey: mentionSource }))
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: mentionSource }), 1, 'duplicate IDs produce one recipient event')
  assert.equal(mentionNotification?.eventType_code, 'COMMENT_MENTIONED')
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: mentionNotification.ID }), 1)
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: mentionNotification.ID }), 1, 'comment mention creates the durable email outbox row')
  const expectedMentionMessage = `You were mentioned in a Bug comment: ${mentionContent.slice(0, 200)}`
  assert.equal(mentionNotification.message, expectedMentionMessage, 'notification stores exactly the capped 200-character comment excerpt')
  const mentionDelivery = await db.run(SELECT.one.from('idts.cap.NotificationDeliveries').where({ notification_ID: mentionNotification.ID }))
  assert.ok(mentionDelivery.textBody.includes(expectedMentionMessage), 'email text includes exactly the capped comment excerpt')
  assert.ok(mentionDelivery.htmlBody.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'email HTML escapes the comment excerpt')
  assert.ok(!mentionDelivery.htmlBody.includes('<script>alert(1)</script>'), 'email HTML never embeds raw comment markup')
  const linkedMentionEmail = buildEmailMessage({
    notificationID: mentionNotification.ID,
    recipientEmail: mentionRecipient.email,
    eventType: 'COMMENT_MENTIONED',
    eventTypeName: 'Comment Mentioned',
    message: expectedMentionMessage,
    bug: { ID: bug.ID, bugNumber: 'BUG-TEST', title: 'Mention test', statusName: 'New' },
    config: emailConfig()
  })
  assert.match(linkedMentionEmail.html, /href="https:\/\/idts\.example\.test\/idtsbugmanagementui\/index\.html#\/Bugs\(ID=/, 'email uses the existing allowlisted Bug link when configured')

  const rollbackContent = 'Injected failure after complete mention persistence.'
  const rollbackReq = commentRequest(routeActor, bug.ID, rollbackContent, [mentionRecipient.ID])
  let mentionRollbackSourceKey
  let rollbackHistoryID
  let rollbackNotificationID
  await assert.rejects(db.tx(rollbackReq, () => addComment(rollbackReq, mentionEntities, {
    afterMentionWrites: async ({ tx, commentID, historyID, recipients }) => {
      mentionRollbackSourceKey = `MENTION:${commentID}:${recipients[0].ID}`
      rollbackHistoryID = historyID
      assert.equal(await count(tx, 'idts.cap.Comments', { ID: commentID }), 1, 'fault hook runs after comment write')
      assert.equal(await count(tx, 'idts.cap.HistoryEvents', { ID: historyID }), 1, 'fault hook runs after history write')
      assert.equal(await count(tx, 'idts.cap.Notifications', { sourceKey: mentionRollbackSourceKey }), 1, 'fault hook runs after mention notification write')
      const notification = await tx.run(SELECT.one.from('idts.cap.Notifications').columns('ID').where({ sourceKey: mentionRollbackSourceKey }))
      rollbackNotificationID = notification.ID
      assert.equal(await count(tx, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: notification.ID }), 1, 'fault hook runs after inbox write')
      assert.equal(await count(tx, 'idts.cap.NotificationDeliveries', { notification_ID: notification.ID }), 1, 'fault hook runs after outbox write')
      throw new Error('INJECTED_MENTION_ROLLBACK')
    }
  })), /INJECTED_MENTION_ROLLBACK/)
  assert.equal(await count(db, 'idts.cap.Comments', { bug_ID: bug.ID, content: rollbackContent }), 0, 'injected failure rolls back comment')
  assert.equal(await count(db, 'idts.cap.HistoryEvents', { ID: rollbackHistoryID }), 0, 'injected failure rolls back history event')
  assert.equal(await count(db, 'idts.cap.HistoryLogs', { event_ID: rollbackHistoryID }), 0, 'injected failure rolls back history logs')
  assert.equal(await count(db, 'idts.cap.Notifications', { sourceKey: mentionRollbackSourceKey }), 0, 'injected failure rolls back source notification')
  assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: rollbackNotificationID }), 0, 'injected failure rolls back inbox row')
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: rollbackNotificationID }), 0, 'injected failure rolls back delivery row')

  const authorOnlyReq = commentRequest(routeActor, bug.ID, 'Author-only selected mention.', [routeActor.ID])
  await db.tx(authorOnlyReq, () => addComment(authorOnlyReq, mentionEntities))
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: 'COMMENT_MENTIONED' }), 1, 'author is excluded from mention recipients')

  const typedOnlyReq = commentRequest(routeActor, bug.ID, '@typed-name only.', [])
  await db.tx(typedOnlyReq, () => addComment(typedOnlyReq, mentionEntities))
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: 'COMMENT_MENTIONED' }), 1, 'typed @name alone creates zero mentions')

  const invalidMentionReq = commentRequest(routeActor, bug.ID, 'Invalid mention must roll back.', ['00000000-0000-4000-8000-000000000099'])
  await assert.rejects(
    db.tx(invalidMentionReq, () => addComment(invalidMentionReq, mentionEntities)),
    /mention/i
  )
  assert.equal(await count(db, 'idts.cap.Comments', { bug_ID: bug.ID, content: 'Invalid mention must roll back.' }), 0, 'invalid recipient rejects before comment INSERT')
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: 'COMMENT_MENTIONED' }), 1, 'rollback leaves no notification')

  const tooManyIDs = Array.from({ length: 21 }, (_, index) => `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`)
  const tooManyReq = commentRequest(routeActor, bug.ID, 'Too many mentions must roll back.', tooManyIDs)
  await assert.rejects(db.tx(tooManyReq, () => addComment(tooManyReq, mentionEntities)), /20 mention/i)
  assert.equal(await count(db, 'idts.cap.Comments', { bug_ID: bug.ID, content: 'Too many mentions must roll back.' }), 0, 'more than 20 recipients rejects before comment INSERT')

  const inactiveID = '20000000-0000-4000-8000-000000000101'
  const unreadyID = '20000000-0000-4000-8000-000000000102'
  const unsupportedID = '20000000-0000-4000-8000-000000000103'
  await db.run(cds.ql.INSERT.into(entities.Users).entries([
    { ID: inactiveID, displayName: 'Inactive mention recipient', email: 'inactive-mention@example.test', role_code: 'TESTER', active: false },
    { ID: unreadyID, displayName: 'Unready mention recipient', email: 'unready-mention@example.test', role_code: 'DEVELOPER', active: true },
    { ID: unsupportedID, displayName: 'Unsupported mention recipient', email: 'unsupported-mention@example.test', role_code: 'ADMIN', active: true }
  ]))
  await makeIdentityReady(db, { ID: unsupportedID, email: 'unsupported-mention@example.test', role_code: 'ADMIN' }, routeActor.ID)
  for (const [recipientID, label] of [[inactiveID, 'inactive'], [unreadyID, 'identity-unready'], [unsupportedID, 'unsupported-role']]) {
    const rejectedContent = `${label} mention must roll back.`
    const rejectedReq = commentRequest(routeActor, bug.ID, rejectedContent, [recipientID])
    await assert.rejects(db.tx(rejectedReq, () => addComment(rejectedReq, mentionEntities)), /active, authorized/i)
    assert.equal(await count(db, 'idts.cap.Comments', { bug_ID: bug.ID, content: rejectedContent }), 0, `${label} recipient rejects before comment INSERT`)
  }

  const legacyContent = 'Legacy caller omits mention IDs.'
  const legacyReq = new cds.Request({
    user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }),
    params: [{ ID: bug.ID }], data: { content: legacyContent }
  })
  await db.tx(legacyReq, () => addComment(legacyReq, mentionEntities))
  assert.equal(await count(db, 'idts.cap.Comments', { bug_ID: bug.ID, content: legacyContent }), 1, 'legacy caller without mentionedUserIDs remains compatible')

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

  // RED contract: escalation uses stable codes, keeps priority/severity events distinct, and only reaches aligned recipients.
  const escalationAssigneeUser = {
    ID: 'de000000-0000-4000-8000-000000000008', displayName: 'Escalation Developer',
    email: 'escalation-developer@example.test', role_code: 'DEVELOPER', active: true
  }
  const escalationPm = {
    ID: 'de000000-0000-4000-8000-000000000009', displayName: 'Escalation PM',
    email: 'escalation-pm@example.test', role_code: 'PM', active: true
  }
  const escalationAssignee = { ID: 'de000000-0000-4000-8000-000000000010', user_ID: escalationAssigneeUser.ID }
  await db.run(INSERT.into(entities.Users).entries([escalationAssigneeUser, escalationPm]))
  await db.run(INSERT.into(entities.DeveloperProfiles).entries({
    ...escalationAssignee, availabilityStatus_code: 'AVAILABLE', workloadLimit: 5, active: true
  }))
  await makeIdentityReady(db, escalationAssigneeUser, routeActor.ID)
  await makeIdentityReady(db, escalationPm, routeActor.ID)
  const escalationBug = {
    ...routeBug,
    assignee_ID: escalationAssignee.ID,
    nextProcessorUser_ID: escalationAssigneeUser.ID,
    priority_code: 'HIGH',
    severity_code: 'MAJOR'
  }
  const escalationReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  await db.tx(escalationReq, () => recordBugChangeSideEffects(escalationReq, entities, [
    { fieldName: 'priority', oldValue: 'HIGH', newValue: 'CRITICAL' },
    { fieldName: 'severity', oldValue: 'MAJOR', newValue: 'BLOCKER' }
  ], { ...escalationBug, priority_code: 'CRITICAL', severity_code: 'BLOCKER' }))
  const escalationEvents = await db.run(SELECT.from('idts.cap.Notifications').where({
    eventType_code: { in: ['PRIORITY_ESCALATED', 'SEVERITY_ESCALATED'] }
  }))
  assert.equal(escalationEvents.length, 4, 'both raised fields retain their own event for assignee/current owner and PM')
  for (const notification of escalationEvents) {
    assert.match(notification.sourceKey, new RegExp(`^STATUS:[0-9a-f-]{36}:${notification.recipient_ID}:(PRIORITY_ESCALATED|SEVERITY_ESCALATED)$`), 'event discriminator prevents same-history source-key collision')
    assert.equal(await count(db, 'idts.cap.UserNotificationInboxEntries', { bugNotification_ID: notification.ID }), 1, 'material escalation is indexed once')
    assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: notification.ID }), 1, 'Critical/Blocker escalation schedules prompt email')
  }
  const escalationInbox = await db.run(SELECT.one.from('idts.cap.UserNotificationInboxEntries').where({ bugNotification_ID: escalationEvents[0].ID }))
  const [escalationSummary] = await hydrateNotificationPage(db, [escalationInbox], 'en')
  assert.equal(escalationSummary.actionRequired, true, 'escalation consumer marks the material event as requiring action')
  assert.deepEqual([...new Set(escalationEvents.map(row => row.recipient_ID))].sort(), [escalationAssigneeUser.ID, escalationPm.ID].sort(), 'assignee and current owner dedupe while aligned PM is added')

  const escalationCount = escalationEvents.length
  const sameRankReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  await db.tx(sameRankReq, () => recordBugChangeSideEffects(sameRankReq, entities, [
    { fieldName: 'priority', oldValue: 'HIGH', newValue: 'HIGH' },
    { fieldName: 'severity', oldValue: 'BLOCKER', newValue: 'MAJOR' }
  ], escalationBug))
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: { in: ['PRIORITY_ESCALATED', 'SEVERITY_ESCALATED'] } }), escalationCount, 'same or downward rank creates no escalation')

  const lowerEscalationReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  await db.tx(lowerEscalationReq, () => recordBugChangeSideEffects(lowerEscalationReq, entities, [
    { fieldName: 'priority', oldValue: 'LOW', newValue: 'MEDIUM' }
  ], { ...escalationBug, priority_code: 'MEDIUM', severity_code: 'MAJOR' }))
  const lowerEscalation = await db.run(SELECT.one.from('idts.cap.Notifications').where({
    eventType_code: 'PRIORITY_ESCALATED', recipient_ID: escalationAssigneeUser.ID
  }).orderBy('createdAt desc'))
  assert.equal(await count(db, 'idts.cap.NotificationDeliveries', { notification_ID: lowerEscalation.ID }), 0, 'lower upward escalation is inbox-only')
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: 'PRIORITY_ESCALATED', recipient_ID: escalationPm.ID }), 1, 'PM is not added unless the resulting escalation is material')

  const unreadyEscalationReq = new cds.Request({ user: new cds.User({ id: routeActor.email, roles: [routeActor.role_code, 'authenticated-user'] }) })
  await db.tx(unreadyEscalationReq, () => recordBugChangeSideEffects(unreadyEscalationReq, entities, [
    { fieldName: 'priority', oldValue: 'HIGH', newValue: 'CRITICAL' }
  ], { ...escalationBug, assignee_ID: null, nextProcessorUser_ID: unreadyID, priority_code: 'CRITICAL', severity_code: 'MAJOR' }))
  assert.equal(await count(db, 'idts.cap.Notifications', { eventType_code: 'PRIORITY_ESCALATED', recipient_ID: unreadyID }), 0, 'unmapped direct owner fails closed')

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

  const catalog = fs.readFileSync(path.join(__dirname, '../../db/data/idts.cap-NotificationEventTypes.csv'), 'utf8')
  const uiBundles = ['i18n.properties', 'i18n_en.properties', 'i18n_vi.properties']
    .map(file => fs.readFileSync(path.join(__dirname, '../../app/bug-management-ui/webapp/i18n', file), 'utf8'))
  assert.match(catalog, /^PENDING_ASSIGNMENT,Pending Assignment,Bug is waiting for PM assignment,/m)
  assert.match(catalog, /^ASSIGNMENT_REMOVED,Assignment Removed,Bug assignment was removed for the previous developer,/m)
  for (const bundle of uiBundles) {
    assert.doesNotMatch(bundle, /notificationEventPENDING_ASSIGNMENT=(Assignment removed|Đã bỏ giao việc)/)
    assert.match(bundle, /notificationEventASSIGNMENT_REMOVED=(Assignment removed|Đã bỏ giao việc)/)
  }

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
