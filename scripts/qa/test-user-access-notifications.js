'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const {
  ACCESS_EVENT_BY_ACTION,
  buildAccessApplicationLink,
  buildAccessDeliveryMessage,
  processUserAccessDeliveries,
  writeUserAccessDelivery
} = require('../../srv/user-admin/access-delivery')

const ENTITY = 'idts.cap.UserAccessNotificationDeliveries'

const BUG_DELIVERY_SHAPE = [
  ['ID', 'cds.UUID', null, false, null, null, true],
  ['createdAt', 'cds.Timestamp', null, false, null, null, false],
  ['createdBy', 'User', null, false, 255, null, false],
  ['modifiedAt', 'cds.Timestamp', null, false, null, null, false],
  ['modifiedBy', 'User', null, false, 255, null, false],
  ['notification', 'cds.Association', 'idts.cap.Notifications', true, null, null, false],
  ['channel', 'cds.Association', 'idts.cap.NotificationChannels', true, null, null, false],
  ['recipientEmail', 'cds.String', null, false, 255, null, false],
  ['templateKey', 'cds.String', null, true, 80, null, false],
  ['subject', 'cds.String', null, true, 255, null, false],
  ['textBody', 'cds.LargeString', null, true, null, null, false],
  ['htmlBody', 'cds.LargeString', null, true, null, null, false],
  ['status', 'cds.Association', 'idts.cap.NotificationDeliveryStatuses', true, null, null, false],
  ['attemptCount', 'cds.Integer', null, true, null, 0, false],
  ['nextAttemptAt', 'cds.Timestamp', null, false, null, null, false],
  ['lastAttemptAt', 'cds.Timestamp', null, false, null, null, false],
  ['sentAt', 'cds.Timestamp', null, false, null, null, false],
  ['lastErrorCode', 'cds.String', null, false, 80, null, false],
  ['lastErrorSummary', 'cds.String', null, false, 500, null, false],
  ['providerMessageId', 'cds.String', null, false, 255, null, false],
  ['lockedUntil', 'cds.Timestamp', null, false, null, null, false],
  ['lockToken', 'cds.String', null, false, 64, null, false]
]

const ONBOARDING_DELIVERY_SHAPE = [
  ['ID', 'cds.UUID', null, false, null, null, true],
  ['createdAt', 'cds.Timestamp', null, false, null, null, false],
  ['createdBy', 'User', null, false, 255, null, false],
  ['modifiedAt', 'cds.Timestamp', null, false, null, null, false],
  ['modifiedBy', 'User', null, false, 255, null, false],
  ['onboardingRequest', 'cds.Association', 'idts.cap.UserOnboardingRequests', true, null, null, false],
  ['recipientEmail', 'cds.String', null, true, 255, null, false],
  ['templateKey', 'cds.String', null, true, 80, null, false],
  ['status', 'cds.Association', 'idts.cap.NotificationDeliveryStatuses', true, null, null, false],
  ['attemptCount', 'cds.Integer', null, true, null, 0, false],
  ['nextAttemptAt', 'cds.Timestamp', null, false, null, null, false],
  ['lastAttemptAt', 'cds.Timestamp', null, false, null, null, false],
  ['sentAt', 'cds.Timestamp', null, false, null, null, false],
  ['lastErrorCode', 'cds.String', null, false, 80, null, false],
  ['lastErrorSummary', 'cds.String', null, false, 500, null, false],
  ['providerMessageId', 'cds.String', null, false, 255, null, false],
  ['lockedUntil', 'cds.Timestamp', null, false, null, null, false],
  ['lockToken', 'cds.String', null, false, 64, null, false]
]

async function main () {
  const model = await cds.load('db/schema.cds')
  const delivery = model.definitions[ENTITY]

  assert.ok(delivery, `${ENTITY} exists`)
  assert.equal(delivery.elements.ID?.key, true, 'access delivery has a cuid key')
  for (const field of ['createdAt', 'createdBy', 'modifiedAt', 'modifiedBy']) {
    assert.ok(delivery.elements[field], `access delivery has managed field ${field}`)
  }

  const expected = {
    sourceAuditEvent: ['idts.cap.UserIdentityAuditEvents', true],
    targetUser: ['idts.cap.Users', true],
    recipientEmail: ['cds.String', true, 255],
    eventType: ['cds.String', true, 40],
    templateKey: ['cds.String', true, 80],
    subject: ['cds.String', true, 255],
    textBody: ['cds.LargeString', true],
    htmlBody: ['cds.LargeString', true],
    status: ['idts.cap.NotificationDeliveryStatuses', true],
    attemptCount: ['cds.Integer', true],
    nextAttemptAt: ['cds.Timestamp', false],
    lastAttemptAt: ['cds.Timestamp', false],
    sentAt: ['cds.Timestamp', false],
    lastErrorCode: ['cds.String', false, 80],
    lastErrorSummary: ['cds.String', false, 500],
    providerMessageId: ['cds.String', false, 255],
    lockedUntil: ['cds.Timestamp', false],
    lockToken: ['cds.String', false, 64]
  }

  for (const [name, [typeOrTarget, notNull, length]] of Object.entries(expected)) {
    const element = delivery.elements[name]
    assert.ok(element, `access delivery field ${name} exists`)
    assert.equal(element.target || element.type, typeOrTarget, `access delivery field ${name} type`)
    assert.equal(element.notNull === true, notNull, `access delivery field ${name} nullability`)
    if (length !== undefined) assert.equal(element.length, length, `access delivery field ${name} length`)
  }
  assert.equal(delivery.elements.attemptCount.default?.val, 0, 'attempt count defaults to zero')

  const unique = delivery['@assert.unique.accessAuditDelivery']
  assert.deepEqual(unique?.map(item => item['=']), ['sourceAuditEvent'], 'source audit event is unique')

  const bugDelivery = model.definitions['idts.cap.NotificationDeliveries']
  assert.deepEqual(entityShape(bugDelivery), BUG_DELIVERY_SHAPE, 'Bug delivery model shape remains unchanged')
  assert.deepEqual(
    bugDelivery['@assert.unique.notificationChannel']?.map(item => item['=']),
    ['notification', 'channel'],
    'Bug delivery uniqueness remains unchanged'
  )
  const onboardingDelivery = model.definitions['idts.cap.UserOnboardingDeliveries']
  assert.deepEqual(
    entityShape(onboardingDelivery),
    ONBOARDING_DELIVERY_SHAPE,
    'onboarding delivery model shape remains unchanged'
  )
  assert.deepEqual(
    onboardingDelivery['@assert.unique.onboardingRequestDelivery']?.map(item => item['=']),
    ['onboardingRequest'],
    'onboarding delivery uniqueness remains unchanged'
  )

  const mutatedBugShape = structuredClone(BUG_DELIVERY_SHAPE)
  mutatedBugShape.find(([name]) => name === 'subject')[4] = 254
  assert.notDeepEqual(
    entityShape(bugDelivery),
    mutatedBugShape,
    'controlled subject-length mutation is detected by the normalized shape contract'
  )

  await verifyAccessDeliveryBehavior()
  await verifyConstraintFailuresPropagate()

  console.log('IDTS user access notification contract: PASS')
}

async function verifyAccessDeliveryBehavior () {
  const csn = await cds.load('db/schema.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const userID = '61000000-0000-4000-8000-000000000001'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: userID,
    displayName: 'Suspended Access User',
    email: 'access.user@example.test',
    role_code: 'TESTER',
    active: false
  }))

  assert.deepEqual(ACCESS_EVENT_BY_ACTION, {
    CHANGE_ROLE: 'ACCESS_ROLE_CHANGED',
    SUSPEND: 'ACCESS_SUSPENDED',
    REACTIVATE: 'ACCESS_REACTIVATED',
    REVOKE: 'ACCESS_REVOKED'
  })

  const safeConfig = {
    enabled: true,
    ready: true,
    baseUrl: 'https://idts.example.test/',
    fromAddress: 'no-reply@example.test',
    fromName: 'IDTS Test',
    batchSize: 10,
    maxRetryCount: 1,
    pollIntervalMs: 15000
  }
  const message = buildAccessDeliveryMessage({
    eventType: 'ACCESS_ROLE_CHANGED',
    effectiveRole: 'DEVELOPER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:00:00.000Z'
  }, safeConfig)
  assert.match(message.subject, /access changed/i)
  assert.match(message.text, /Developer/)
  assert.match(message.text, /https:\/\/idts\.example\.test\/idtsbugmanagementui\/index\.html/)
  assert.match(message.html, /Developer/)
  assert.doesNotMatch(message.html, /Role Collection|provider|identity|reason/i)
  assert.equal(
    buildAccessApplicationLink(safeConfig.baseUrl),
    'https://idts.example.test/idtsbugmanagementui/index.html',
    'the application link is validated directly rather than inferred from rendered text'
  )
  for (const unsafeBaseUrl of [null, 'http://idts.example.test', 'https://user:password@idts.example.test', 'https://idts.example.test/?token=private', 'https://idts.example.test/#private', 'https://idts.example.test\r\nBcc: attacker@example.test']) {
    assert.equal(buildAccessApplicationLink(unsafeBaseUrl), null, `unsafe base URL is rejected: ${String(unsafeBaseUrl)}`)
  }
  const injectedSnapshot = buildAccessDeliveryMessage({
    eventType: 'ACCESS_ROLE_CHANGED',
    effectiveRole: 'DEVELOPER\r\nBcc: attacker@example.test',
    effectiveAccessState: 'ACTIVE\nForged state',
    completedAt: '2026-08-26T10:00:00.000Z\r\nForged time'
  }, safeConfig)
  assert.doesNotMatch(injectedSnapshot.text, /Bcc:|Forged state|Forged time/)
  assert.match(injectedSnapshot.text, /Effective role: Unknown/)
  for (const [eventType, label] of Object.entries({
    ACCESS_ROLE_CHANGED: 'access changed',
    ACCESS_SUSPENDED: 'access suspended',
    ACCESS_REACTIVATED: 'access reactivated',
    ACCESS_REVOKED: 'access revoked'
  })) {
    assert.match(buildAccessDeliveryMessage({ eventType }, safeConfig).subject, new RegExp(label, 'i'))
  }

  const audit = {
    ID: '62000000-0000-4000-8000-000000000001',
    action: 'SUSPEND',
    result: 'APPLIED'
  }
  const missingPersistedAudit = await writeUserAccessDelivery({
    tx: db,
    auditEvent: { ...audit, ID: '62000000-0000-4000-8000-000000000099' },
    targetUserID: userID,
    eventType: 'ACCESS_SUSPENDED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'SUSPENDED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.deepEqual(missingPersistedAudit, { created: false }, 'a non-persisted audit cannot create a delivery')
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ...audit,
    targetUser_ID: userID,
    correlationId: '63000000-0000-4000-8000-000000000001'
  }))
  const written = await writeUserAccessDelivery({
    tx: db,
    auditEvent: audit,
    targetUserID: userID,
    eventType: 'ACCESS_SUSPENDED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'SUSPENDED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.equal(written.created, true, 'an applied allowlisted audit creates one delivery')
  assert.equal(written.deliveryStatus, 'PENDING', 'an inactive suspend target is still eligible')
  const stored = await db.run(SELECT.one.from(ENTITY).where({ ID: written.deliveryID }))
  assert.equal(stored.sourceAuditEvent_ID, audit.ID)
  assert.equal(stored.targetUser_ID, userID)
  assert.equal(stored.recipientEmail, 'access.user@example.test')

  const duplicate = await writeUserAccessDelivery({
    tx: db,
    auditEvent: audit,
    targetUserID: userID,
    eventType: 'ACCESS_SUSPENDED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'SUSPENDED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.deepEqual(duplicate, { deliveryID: written.deliveryID, deliveryStatus: 'PENDING', created: false })

  const excluded = await writeUserAccessDelivery({
    tx: db,
    auditEvent: { ID: '62000000-0000-4000-8000-000000000002', action: 'UPDATE_DEVELOPER_PROFILE', result: 'APPLIED' },
    targetUserID: userID,
    eventType: 'ACCESS_ROLE_CHANGED',
    effectiveRole: 'DEVELOPER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.deepEqual(excluded, { created: false })
  const noop = await writeUserAccessDelivery({
    tx: db,
    auditEvent: { ID: '62000000-0000-4000-8000-000000000003', action: 'REACTIVATE', result: 'NOOP_ALREADY_DESIRED' },
    targetUserID: userID,
    eventType: 'ACCESS_REACTIVATED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.deepEqual(noop, { created: false })
  const excludedWriterCases = [
    ['CHANGE_ROLE', 'QUEUED', 'ACCESS_ROLE_CHANGED'],
    ['SUSPEND', 'FAILED', 'ACCESS_SUSPENDED'],
    ['PROVISION', 'APPLIED', 'ACCESS_ROLE_CHANGED'],
    ['LINK_EXISTING', 'APPLIED', 'ACCESS_ROLE_CHANGED'],
    ['UPDATE_DEVELOPER_PROFILE', 'APPLIED', 'ACCESS_ROLE_CHANGED'],
    ['UPDATE_DEVELOPER_RESPONSIBILITIES', 'APPLIED', 'ACCESS_ROLE_CHANGED'],
    ['CHANGE_ROLE', 'APPLIED', 'ACCESS_REACTIVATED']
  ]
  for (const [action, result, eventType] of excludedWriterCases) {
    const excludedResult = await writeUserAccessDelivery({
      tx: db,
      auditEvent: { ID: cds.utils.uuid(), action, result },
      targetUserID: userID,
      eventType,
      effectiveRole: 'TESTER',
      effectiveAccessState: 'ACTIVE',
      completedAt: '2026-08-26T10:00:00.000Z',
      emailConfig: safeConfig
    })
    assert.deepEqual(excludedResult, { created: false }, `${action}/${result}/${eventType} is excluded`)
  }

  const blankEmailUserID = '61000000-0000-4000-8000-000000000002'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: blankEmailUserID,
    displayName: 'Blank Email User',
    email: '',
    role_code: 'TESTER',
    active: true
  }))
  const disabledAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000004', userID, 'REACTIVATE')
  const disabledDelivery = await writeUserAccessDelivery({
    tx: db,
    auditEvent: disabledAudit,
    targetUserID: userID,
    eventType: 'ACCESS_REACTIVATED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: { ...safeConfig, enabled: false, ready: false }
  })
  assert.equal(disabledDelivery.deliveryStatus, 'SKIPPED')
  const blankAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000005', blankEmailUserID, 'REVOKE')
  const blankDelivery = await writeUserAccessDelivery({
    tx: db,
    auditEvent: blankAudit,
    targetUserID: blankEmailUserID,
    eventType: 'ACCESS_REVOKED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'REVOKED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  assert.equal(blankDelivery.deliveryStatus, 'SKIPPED')
  const blankStored = await db.run(SELECT.one.from(ENTITY).where({ ID: blankDelivery.deliveryID }))
  assert.equal(blankStored.lastErrorCode, 'RECIPIENT_EMAIL_MISSING')
  const invalidEmailUserID = '61000000-0000-4000-8000-000000000003'
  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: invalidEmailUserID,
    displayName: 'Invalid Email User',
    email: 'invalid-email',
    role_code: 'TESTER',
    active: true
  }))
  const invalidAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000007', invalidEmailUserID, 'REVOKE')
  const invalidDelivery = await writeUserAccessDelivery({
    tx: db,
    auditEvent: invalidAudit,
    targetUserID: invalidEmailUserID,
    eventType: 'ACCESS_REVOKED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'REVOKED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: safeConfig
  })
  const invalidStored = await db.run(SELECT.one.from(ENTITY).where({ ID: invalidDelivery.deliveryID }))
  assert.equal(invalidStored.lastErrorCode, 'RECIPIENT_EMAIL_INVALID')
  const unreadyAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000008', userID, 'CHANGE_ROLE')
  const unreadyDelivery = await writeUserAccessDelivery({
    tx: db,
    auditEvent: unreadyAudit,
    targetUserID: userID,
    eventType: 'ACCESS_ROLE_CHANGED',
    effectiveRole: 'DEVELOPER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: { ...safeConfig, ready: false }
  })
  const unreadyStored = await db.run(SELECT.one.from(ENTITY).where({ ID: unreadyDelivery.deliveryID }))
  assert.equal(unreadyStored.lastErrorCode, 'EMAIL_CONFIG_INCOMPLETE')

  const sent = []
  const sentResult = await processUserAccessDeliveries({
    tx: db,
    config: safeConfig,
    sendMail: async entry => {
      sent.push(entry)
      return { messageId: 'access-provider-message-id' }
    },
    now: new Date('2026-08-26T10:01:00.000Z'),
    workerID: 'access-test-worker'
  })
  assert.deepEqual(sentResult, { sent: 1, failed: 0, skipped: 0 })
  assert.equal(sent.length, 1)
  assert.equal(sent[0].headers['X-IDTS-Access-Delivery-ID'], written.deliveryID)
  const delivered = await db.run(SELECT.one.from(ENTITY).where({ ID: written.deliveryID }))
  assert.equal(delivered.status_code, 'SENT')
  assert.equal(delivered.providerMessageId, 'access-provider-message-id')

  const retryAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000006', userID, 'REACTIVATE')
  const retryDelivery = await writeUserAccessDelivery({
    tx: db,
    auditEvent: retryAudit,
    targetUserID: userID,
    eventType: 'ACCESS_REACTIVATED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'ACTIVE',
    completedAt: '2026-08-26T10:02:00.000Z',
    emailConfig: safeConfig
  })
  const providerError = Object.assign(new Error('private-provider.example secret'), { code: 'ESOCKET' })
  const failedResult = await processUserAccessDeliveries({
    tx: db,
    config: safeConfig,
    sendMail: async () => { throw providerError },
    now: new Date('2026-08-26T10:02:00.000Z'),
    workerID: 'access-failure-worker'
  })
  assert.deepEqual(failedResult, { sent: 0, failed: 1, skipped: 0 })
  const failed = await db.run(SELECT.one.from(ENTITY).where({ ID: retryDelivery.deliveryID }))
  assert.equal(failed.status_code, 'FAILED')
  assert.equal(failed.lastErrorCode, 'ESOCKET')
  assert.doesNotMatch(failed.lastErrorSummary, /private-provider|secret/)
  await db.run(UPDATE(ENTITY).set({ lockedUntil: '2026-08-26T11:00:00.000Z' }).where({ ID: retryDelivery.deliveryID }))
  const lockedResult = await processUserAccessDeliveries({
    tx: db,
    config: safeConfig,
    sendMail: async () => { throw new Error('must not send locked delivery') },
    now: new Date('2026-08-26T10:03:00.000Z'),
    workerID: 'access-lock-worker'
  })
  assert.deepEqual(lockedResult, { sent: 0, failed: 0, skipped: 0 })
  await db.run(UPDATE(ENTITY).set({ lockedUntil: null, nextAttemptAt: '2026-08-26T10:02:00.000Z' }).where({ ID: retryDelivery.deliveryID }))
  const retriedResult = await processUserAccessDeliveries({
    tx: db,
    config: safeConfig,
    sendMail: async () => ({ messageId: 'access-retry-message-id' }),
    now: new Date('2026-08-26T10:03:00.000Z'),
    workerID: 'access-retry-worker'
  })
  assert.deepEqual(retriedResult, { sent: 1, failed: 0, skipped: 0 })
  const retried = await db.run(SELECT.one.from(ENTITY).where({ ID: retryDelivery.deliveryID }))
  assert.equal(retried.status_code, 'SENT')
  assert.equal(retried.attemptCount, 2)

  const futureAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000009', userID, 'SUSPEND')
  const futureDelivery = await writeUserAccessDelivery({ tx: db, auditEvent: futureAudit, targetUserID: userID, eventType: 'ACCESS_SUSPENDED', effectiveRole: 'TESTER', effectiveAccessState: 'SUSPENDED', completedAt: '2026-08-26T10:04:00.000Z', emailConfig: safeConfig })
  const exhaustedAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000010', userID, 'REACTIVATE')
  const exhaustedDelivery = await writeUserAccessDelivery({ tx: db, auditEvent: exhaustedAudit, targetUserID: userID, eventType: 'ACCESS_REACTIVATED', effectiveRole: 'TESTER', effectiveAccessState: 'ACTIVE', completedAt: '2026-08-26T10:04:00.000Z', emailConfig: safeConfig })
  const expiredLockAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000011', userID, 'REVOKE')
  const expiredLockDelivery = await writeUserAccessDelivery({ tx: db, auditEvent: expiredLockAudit, targetUserID: userID, eventType: 'ACCESS_REVOKED', effectiveRole: 'TESTER', effectiveAccessState: 'REVOKED', completedAt: '2026-08-26T10:04:00.000Z', emailConfig: safeConfig })
  const competingAudit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000012', userID, 'CHANGE_ROLE')
  const competingDelivery = await writeUserAccessDelivery({ tx: db, auditEvent: competingAudit, targetUserID: userID, eventType: 'ACCESS_ROLE_CHANGED', effectiveRole: 'DEVELOPER', effectiveAccessState: 'ACTIVE', completedAt: '2026-08-26T10:04:00.000Z', emailConfig: safeConfig })
  await db.run(UPDATE(ENTITY).set({ nextAttemptAt: '2026-08-26T11:00:00.000Z' }).where({ ID: futureDelivery.deliveryID }))
  await db.run(UPDATE(ENTITY).set({ status_code: 'FAILED', attemptCount: 2, nextAttemptAt: '2026-08-26T10:00:00.000Z' }).where({ ID: exhaustedDelivery.deliveryID }))
  await db.run(UPDATE(ENTITY).set({ lockedUntil: '2026-08-26T10:03:00.000Z' }).where({ ID: expiredLockDelivery.deliveryID }))
  const claimMessages = []
  const claimResults = await Promise.all([
    processUserAccessDeliveries({ tx: db, config: safeConfig, sendMail: async entry => { claimMessages.push(entry); return { messageId: `claim-${entry.headers['X-IDTS-Access-Delivery-ID']}` } }, now: new Date('2026-08-26T10:04:00.000Z'), workerID: 'competing-worker-a' }),
    processUserAccessDeliveries({ tx: db, config: safeConfig, sendMail: async entry => { claimMessages.push(entry); return { messageId: `claim-${entry.headers['X-IDTS-Access-Delivery-ID']}` } }, now: new Date('2026-08-26T10:04:00.000Z'), workerID: 'competing-worker-b' })
  ])
  assert.equal(claimResults.reduce((total, result) => total + result.sent, 0), 2, 'competing workers claim each eligible delivery once')
  assert.equal(claimMessages.length, 2)
  const [futureStored, exhaustedStored, expiredLockStored, competingStored] = await Promise.all([
    db.run(SELECT.one.from(ENTITY).where({ ID: futureDelivery.deliveryID })),
    db.run(SELECT.one.from(ENTITY).where({ ID: exhaustedDelivery.deliveryID })),
    db.run(SELECT.one.from(ENTITY).where({ ID: expiredLockDelivery.deliveryID })),
    db.run(SELECT.one.from(ENTITY).where({ ID: competingDelivery.deliveryID }))
  ])
  assert.equal(futureStored.status_code, 'PENDING', 'future retry is excluded')
  assert.equal(exhaustedStored.status_code, 'FAILED', 'max-attempt delivery is excluded')
  assert.equal(expiredLockStored.status_code, 'SENT', 'expired lock is recovered')
  assert.equal(competingStored.status_code, 'SENT', 'competing claim is delivered once')

  await verifySerializedTransactions(db, safeConfig, userID)

  await db.disconnect()
}

async function insertAppliedAudit (db, ID, targetUserID, action) {
  const audit = { ID, action, result: 'APPLIED' }
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ...audit,
    targetUser_ID: targetUserID,
    correlationId: ID.replace(/^62/, '63')
  }))
  return audit
}

async function verifyConstraintFailuresPropagate () {
  const state = { auditLocks: 0, deliveryReads: 0, inserts: 0, aborted: false }
  const tx = {
    run: async query => {
      if (state.aborted) throw Object.assign(new Error('query after PostgreSQL transaction abort'), { code: 'POST_ERROR_QUERY' })
      if (query.SELECT) {
        const source = String(query.SELECT.from?.ref?.[0] || '')
        if (source === 'idts.cap.UserIdentityAuditEvents') {
          assert.ok(query.SELECT.forUpdate, 'the persisted audit source is locked before delivery lookup')
          state.auditLocks += 1
          return { ID: '66000000-0000-4000-8000-000000000001' }
        }
        if (source === ENTITY) {
          assert.equal(state.auditLocks, 1, 'the audit lock precedes the delivery lookup')
          state.deliveryReads += 1
          return undefined
        }
        if (source === 'idts.cap.Users') return { ID: '65000000-0000-4000-8000-000000000001', email: 'race.user@example.test' }
      }
      if (query.INSERT) {
        state.inserts += 1
        state.aborted = true
        throw Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })
      }
      throw new Error('Unexpected CQN in PostgreSQL duplicate test.')
    }
  }
  const input = {
    tx,
    auditEvent: { ID: '66000000-0000-4000-8000-000000000001', action: 'SUSPEND', result: 'APPLIED' },
    targetUserID: '65000000-0000-4000-8000-000000000001',
    eventType: 'ACCESS_SUSPENDED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'SUSPENDED',
    completedAt: '2026-08-26T10:00:00.000Z',
    emailConfig: { enabled: true, ready: true, baseUrl: 'https://idts.example.test', fromAddress: 'no-reply@example.test' }
  }
  await assert.rejects(writeUserAccessDelivery(input), error => error?.code === '23505')
  assert.equal(state.auditLocks, 1)
  assert.equal(state.inserts, 1, 'the PostgreSQL duplicate reaches one insert')
  assert.equal(state.deliveryReads, 1, 'no query follows the aborted PostgreSQL insert')

  for (const code of ['SQLITE_CONSTRAINT_FOREIGNKEY', 'SQLITE_CONSTRAINT_NOTNULL']) {
    let auditLocks = 0
    let deliveryReads = 0
    const constraintTx = {
      run: async query => {
        if (query.SELECT) {
          const source = String(query.SELECT.from?.ref?.[0] || '')
          if (source === 'idts.cap.UserIdentityAuditEvents') {
            assert.ok(query.SELECT.forUpdate)
            auditLocks += 1
            return { ID: input.auditEvent.ID }
          }
          if (source === ENTITY) {
            assert.equal(auditLocks, 1, `${code} mock honors the audit lock before delivery lookup`)
            deliveryReads += 1
            return deliveryReads === 1 ? undefined : { ID: 'visible-but-unrelated-delivery', status_code: 'PENDING' }
          }
          return { ID: input.targetUserID, email: 'race.user@example.test' }
        }
        if (query.INSERT) throw Object.assign(new Error('constraint failed'), { code })
        throw new Error('Unexpected CQN in SQLite constraint test.')
      }
    }
    await assert.rejects(writeUserAccessDelivery({ ...input, tx: constraintTx }), error => error?.code === code)
    assert.equal(auditLocks, 1)
    assert.equal(deliveryReads, 1, `${code} is rethrown even when a row could be read`)
  }

  let nonUniqueAuditLocks = 0
  const nonUniqueTx = {
    run: async query => {
      if (query.SELECT) {
        const source = String(query.SELECT.from?.ref?.[0] || '')
        if (source === 'idts.cap.UserIdentityAuditEvents') {
          assert.ok(query.SELECT.forUpdate)
          nonUniqueAuditLocks += 1
          return { ID: input.auditEvent.ID }
        }
        if (source === ENTITY) assert.equal(nonUniqueAuditLocks, 1, 'non-unique mock honors the audit lock before delivery lookup')
        return source === ENTITY ? undefined : { ID: input.targetUserID, email: 'race.user@example.test' }
      }
      if (query.INSERT) throw Object.assign(new Error('database connection failed'), { code: 'ECONNREFUSED' })
      throw new Error('Unexpected CQN in non-unique test.')
    }
  }
  await assert.rejects(writeUserAccessDelivery({ ...input, tx: nonUniqueTx }), error => error?.code === 'ECONNREFUSED')
  assert.equal(nonUniqueAuditLocks, 1)
}

async function verifySerializedTransactions (db, emailConfig, targetUserID) {
  const audit = await insertAppliedAudit(db, '62000000-0000-4000-8000-000000000013', targetUserID, 'SUSPEND')
  const input = {
    auditEvent: audit,
    targetUserID,
    eventType: 'ACCESS_SUSPENDED',
    effectiveRole: 'TESTER',
    effectiveAccessState: 'SUSPENDED',
    completedAt: '2026-08-26T10:05:00.000Z',
    emailConfig
  }
  const results = await Promise.all([
    db.tx(tx => writeUserAccessDelivery({ ...input, tx })),
    db.tx(tx => writeUserAccessDelivery({ ...input, tx }))
  ])
  assert.deepEqual(results.map(result => result.created).sort(), [false, true], 'both enclosing transactions commit with one creation')
  const rows = await db.run(SELECT.from(ENTITY).where({ sourceAuditEvent_ID: audit.ID }))
  assert.equal(rows.length, 1, 'serialized transactions leave exactly one delivery row')
  assert.ok(results.every(result => result.deliveryID === rows[0].ID))
}

function entityShape (definition) {
  return Object.entries(definition.elements).map(([name, element]) => [
    name,
    element.type,
    element.target || null,
    element.notNull === true,
    element.length ?? null,
    element.default?.val ?? null,
    element.key === true
  ])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
