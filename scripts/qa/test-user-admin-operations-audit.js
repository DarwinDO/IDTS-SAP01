'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const serviceSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')

const required = [
  'type OnboardingDeliverySummary',
  'type AccessOperationSummary',
  'type AdministrationAuditEventSummary',
  'type AdministrationReadiness',
  'action searchOnboardingDeliveries(',
  'action searchAccessOperations(',
  'action searchAccessAuditEvents(',
  'action readAdministrationReadiness()',
  'action retryOnboardingDelivery('
]
for (const marker of required) assert.ok(serviceSource.includes(marker), `missing ${marker}`)

const contractStart = serviceSource.indexOf('type OnboardingDeliverySummary')
const entityMarker = serviceSource.match(/@readonly\r?\n\s+entity OnboardingRequests/)
const contractEnd = entityMarker?.index ?? -1
assert.ok(contractStart >= 0 && contractEnd > contractStart, 'safe operations contract boundary missing')
const safeContract = serviceSource.slice(contractStart, contractEnd)
for (const forbidden of [
  'recipientEmail',
  'providerMessageId',
  'lockToken',
  'leaseToken',
  'leaseTokenHash',
  'idempotencyKey',
  'providerCorrelationHash',
  'beforeIdentityHash',
  'afterIdentityHash',
  'identityOrigin',
  'identityIssuer',
  'identitySubject',
  'identityPlatformUserId'
]) {
  assert.equal(safeContract.includes(forbidden), false, `forbidden field ${forbidden}`)
}

const operationsAuditPath = path.join(root, 'srv/user-admin/operations-audit.js')
assert.ok(fs.existsSync(operationsAuditPath), 'operations audit handler module is missing')

const cds = require('@sap/cds')
const crypto = require('node:crypto')
const { INSERT, SELECT, UPDATE } = cds.ql
const operationsAudit = require(operationsAuditPath)

const PM_ID = '91000000-0000-4000-8000-000000000001'
const TARGET_ID = '91000000-0000-4000-8000-000000000002'
const ADMIN_ID = '91000000-0000-4000-8000-000000000003'
const RETRY_REQUEST_ID = '91100000-0000-4000-8000-000000000001'
const AMBIGUOUS_REQUEST_ID = '91100000-0000-4000-8000-000000000002'
const PERMANENT_REQUEST_ID = '91100000-0000-4000-8000-000000000003'
const SUCCESS_REQUEST_ID = '91100000-0000-4000-8000-000000000004'
const INCONSISTENT_REQUEST_ID = '91100000-0000-4000-8000-000000000005'
const RETRY_OPERATION_ID = '91200000-0000-4000-8000-000000000001'
const AMBIGUOUS_OPERATION_ID = '91200000-0000-4000-8000-000000000002'
const PERMANENT_OPERATION_ID = '91200000-0000-4000-8000-000000000003'
const SUCCESS_OPERATION_ID = '91200000-0000-4000-8000-000000000004'
const INCONSISTENT_OPERATION_ID = '91200000-0000-4000-8000-000000000005'
const RETRY_DELIVERY_ID = '91300000-0000-4000-8000-000000000001'
const PERMANENT_DELIVERY_ID = '91300000-0000-4000-8000-000000000002'
const EXHAUSTED_DELIVERY_ID = '91300000-0000-4000-8000-000000000003'
const LOCKED_DELIVERY_ID = '91300000-0000-4000-8000-000000000004'
const SENT_DELIVERY_ID = '91300000-0000-4000-8000-000000000005'
const EXPIRED_DELIVERY_ID = '91300000-0000-4000-8000-000000000006'
const NON_INVITED_DELIVERY_ID = '91300000-0000-4000-8000-000000000007'
const RETRY_MODIFIED_AT = '2026-08-24T06:00:00.000Z'
const RECENT_TIMESTAMP = new Date(Date.now() - (60 * 60 * 1000)).toISOString()

const ADMIN = new cds.User({
  id: 'ops.admin@example.invalid',
  roles: ['authenticated-user', 'PM', 'UserAdmin']
})

function requestEntry (ID, values = {}) {
  return {
    ID,
    targetEmailNormalized: values.email || `${ID.slice(-4)}@example.invalid`,
    requestedRole_code: values.role || 'TESTER',
    userAdminRequested: values.userAdmin === true,
    status_code: values.status || 'INVITED',
    requestedBy_ID: PM_ID,
    expiresAt: values.expiresAt || '2026-09-01T00:00:00.000Z',
    tokenNonce: `${ID}-nonce`,
    tokenHash: crypto.createHash('sha256').update(`${ID}-token`).digest('hex'),
    correlationId: `${ID}`,
    provisioningVersion: values.version || 1,
    activeUser_ID: values.activeUserID || null,
    latestOperation_ID: values.latestOperationID || null,
    lastErrorCode: values.lastErrorCode || null,
    lastErrorSummary: values.lastErrorSummary || null,
    createdAt: values.createdAt || '2026-08-24T01:00:00.000Z',
    modifiedAt: values.modifiedAt || '2026-08-24T01:00:00.000Z'
  }
}

function deliveryEntry (ID, requestID, values = {}) {
  return {
    ID,
    onboardingRequest_ID: requestID,
    recipientEmail: values.email || `delivery-${ID.slice(-4)}@example.invalid`,
    templateKey: 'IDTS_USER_ONBOARDING_V1',
    status_code: values.status || 'FAILED',
    attemptCount: values.attemptCount ?? 1,
    nextAttemptAt: values.nextAttemptAt || '2026-08-24T06:05:00.000Z',
    lastAttemptAt: values.lastAttemptAt || '2026-08-24T05:55:00.000Z',
    sentAt: values.sentAt || null,
    lastErrorCode: values.errorCode || 'BREVO_API_FAILED',
    lastErrorSummary: values.errorSummary || 'Email provider API request failed.',
    providerMessageId: values.providerMessageId || 'provider-message-private',
    lockedUntil: values.lockedUntil || null,
    lockToken: values.lockToken || null,
    createdAt: values.createdAt || '2026-08-24T05:00:00.000Z',
    modifiedAt: values.modifiedAt || RETRY_MODIFIED_AT
  }
}

function operationEntry (ID, requestID, values = {}) {
  return {
    ID,
    onboardingRequest_ID: requestID,
    operationType: values.operationType || 'PROVISION',
    state: values.state || 'RETRYABLE_FAILURE',
    requestedBy_ID: PM_ID,
    idempotencyKey: `${ID.replaceAll('-', '')}`.padEnd(64, '0'),
    expectedVersion: values.expectedVersion || 1,
    desiredRole_code: 'TESTER',
    desiredUserAdmin: false,
    correlationId: ID,
    attemptCount: values.attemptCount ?? 1,
    leasedAt: values.leasedAt || null,
    completedAt: values.completedAt || null,
    safeResultCode: values.safeResultCode || 'RETRYABLE_FAILURE',
    safeResultSummary: values.safeResultSummary || 'The provider is temporarily unavailable; a bounded retry may be requested.',
    createdAt: values.createdAt || '2026-08-24T04:00:00.000Z',
    modifiedAt: values.modifiedAt || '2026-08-24T05:00:00.000Z'
  }
}

function auditEntry (ID, operationID, requestID, values = {}) {
  return {
    ID,
    operation_ID: operationID,
    onboardingRequest_ID: requestID,
    actor_ID: PM_ID,
    targetUser_ID: values.targetUserID || null,
    action: values.action || 'PROVISION',
    result: values.result || 'RETRYABLE_FAILURE',
    fromState: values.fromState || 'PROVISIONING',
    toState: values.toState || 'RETRYABLE_FAILURE',
    correlationId: values.correlationId || operationID,
    beforeIdentityHash: 'b'.repeat(64),
    afterIdentityHash: 'a'.repeat(64),
    detailsSummary: values.detailsSummary || 'Safe controlled audit details.',
    createdAt: values.createdAt || '2026-08-24T04:00:00.000Z'
  }
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status &&
    (code === undefined || error?.code === code))
}

async function main () {
  assert.deepEqual(operationsAudit.clampPage(), { skip: 0, top: 25 })
  assert.deepEqual(operationsAudit.clampPage(-2, 500), { skip: 0, top: 100 })
  assert.equal(operationsAudit.maskRecipient('alice@example.invalid'), 'a***@example.invalid')
  assert.equal(operationsAudit.maskRecipient(''), 'Hidden recipient')
  assert.match(operationsAudit.correlationFingerprint('91000000-0000-4000-8000-000000000001'), /^[a-f0-9]{12}$/)
  assert.deepEqual(operationsAudit.deriveAdministrationReadiness([
    { STATUS_CODE: 'SENT', SENTAT: RECENT_TIMESTAMP, LASTATTEMPTAT: RECENT_TIMESTAMP }
  ], [
    { STATE: 'SUCCEEDED', COMPLETEDAT: RECENT_TIMESTAMP }
  ], Date.now()), {
    emailDeliveryState: 'AVAILABLE',
    provisioningBrokerState: 'RECENT_SUCCESS',
    lastSuccessfulReconciliationAt: RECENT_TIMESTAMP
  }, 'HANA uppercase column names must retain fresh readiness outcomes')

  const db = await cds.deploy('db').to('sqlite::memory:')
  cds.db = db
  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: PM_ID,
      displayName: 'Operations PM',
      email: ADMIN.id,
      role_code: 'PM',
      active: true
    },
    {
      ID: TARGET_ID,
      displayName: 'Target User',
      email: 'target@example.invalid',
      role_code: 'TESTER',
      active: true
    },
    {
      ID: ADMIN_ID,
      displayName: 'Second PM',
      email: 'second.pm@example.invalid',
      role_code: 'PM',
      active: true
    }
  ]))

  const requests = [
    requestEntry(RETRY_REQUEST_ID, { email: 'retry@example.invalid', latestOperationID: RETRY_OPERATION_ID, status: 'RETRYABLE_FAILURE' }),
    requestEntry(AMBIGUOUS_REQUEST_ID, { email: 'ambiguous@example.invalid', latestOperationID: AMBIGUOUS_OPERATION_ID, status: 'BLOCKED_MANUAL_REVIEW' }),
    requestEntry(PERMANENT_REQUEST_ID, { email: 'permanent@example.invalid', latestOperationID: PERMANENT_OPERATION_ID, status: 'BLOCKED_MANUAL_REVIEW' }),
    requestEntry(SUCCESS_REQUEST_ID, { email: 'success@example.invalid', latestOperationID: SUCCESS_OPERATION_ID, status: 'ACTIVE', activeUserID: TARGET_ID }),
    requestEntry(INCONSISTENT_REQUEST_ID, { email: 'inconsistent@example.invalid', latestOperationID: INCONSISTENT_OPERATION_ID, status: 'ACTIVE' })
  ]
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries(requests))
  await db.run(INSERT.into('idts.cap.UserAccessOperations').entries([
    operationEntry(RETRY_OPERATION_ID, RETRY_REQUEST_ID),
    operationEntry(AMBIGUOUS_OPERATION_ID, AMBIGUOUS_REQUEST_ID, {
      state: 'BLOCKED_MANUAL_REVIEW',
      safeResultCode: 'AMBIGUOUS_PROVIDER_OUTCOME',
      safeResultSummary: 'The provider outcome is ambiguous; manual reconciliation is required.'
    }),
    operationEntry(PERMANENT_OPERATION_ID, PERMANENT_REQUEST_ID, {
      state: 'BLOCKED_MANUAL_REVIEW',
      safeResultCode: 'PERMANENT_FAILURE',
      safeResultSummary: 'The provider rejected the access change; manual review is required.'
    }),
    operationEntry(SUCCESS_OPERATION_ID, SUCCESS_REQUEST_ID, {
      state: 'SUCCEEDED',
      safeResultCode: 'ROLE_COLLECTIONS_VERIFIED',
      safeResultSummary: 'The assigned role collections were verified.',
      attemptCount: 1,
      completedAt: RECENT_TIMESTAMP,
      modifiedAt: RECENT_TIMESTAMP
    }),
    operationEntry(INCONSISTENT_OPERATION_ID, INCONSISTENT_REQUEST_ID, {
      state: 'RETRYABLE_FAILURE',
      safeResultCode: 'RETRYABLE_FAILURE'
    })
  ]))
  await db.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries([
    auditEntry('91400000-0000-4000-8000-000000000001', RETRY_OPERATION_ID, RETRY_REQUEST_ID),
    auditEntry('91400000-0000-4000-8000-000000000002', SUCCESS_OPERATION_ID, SUCCESS_REQUEST_ID, {
      result: 'APPLIED',
      toState: 'ACTIVE',
      targetUserID: TARGET_ID,
      detailsSummary: 'Successful provider reconciliation.'
    })
  ]))

  const deliveryRequests = []
  const deliveryRows = []
  for (let index = 1; index <= 26; index += 1) {
    const requestID = `91500000-0000-4000-8000-${String(index).padStart(12, '0')}`
    const deliveryID = `91600000-0000-4000-8000-${String(index).padStart(12, '0')}`
    deliveryRequests.push(requestEntry(requestID, {
      email: `delivery-${String(index).padStart(2, '0')}@example.invalid`,
      status: 'INVITED',
      createdAt: `2026-08-24T05:${String(index).padStart(2, '0')}:00.000Z`,
      modifiedAt: `2026-08-24T05:${String(index).padStart(2, '0')}:00.000Z`
    }))
    deliveryRows.push(deliveryEntry(deliveryID, requestID, {
      email: `delivery-${String(index).padStart(2, '0')}@example.invalid`,
      createdAt: `2026-08-24T05:${String(index).padStart(2, '0')}:00.000Z`,
      modifiedAt: `2026-08-24T05:${String(index).padStart(2, '0')}:00.000Z`
    }))
  }
  deliveryRequests.push(
    requestEntry('91700000-0000-4000-8000-000000000001', { email: 'retry-action@example.invalid', status: 'INVITED' }),
    requestEntry('91700000-0000-4000-8000-000000000002', { email: 'permanent-action@example.invalid', status: 'INVITED' }),
    requestEntry('91700000-0000-4000-8000-000000000003', { email: 'exhausted-action@example.invalid', status: 'INVITED' }),
    requestEntry('91700000-0000-4000-8000-000000000004', { email: 'locked-action@example.invalid', status: 'INVITED' }),
    requestEntry('91700000-0000-4000-8000-000000000005', { email: 'sent-action@example.invalid', status: 'INVITED' }),
    requestEntry('91700000-0000-4000-8000-000000000006', { email: 'expired-action@example.invalid', status: 'INVITED', expiresAt: '2026-08-01T00:00:00.000Z' }),
    requestEntry('91700000-0000-4000-8000-000000000007', { email: 'non-invited-action@example.invalid', status: 'ACTIVE' })
  )
  deliveryRows.push(
    deliveryEntry(RETRY_DELIVERY_ID, '91700000-0000-4000-8000-000000000001', { email: 'retry-action@example.invalid', modifiedAt: RETRY_MODIFIED_AT }),
    deliveryEntry(PERMANENT_DELIVERY_ID, '91700000-0000-4000-8000-000000000002', { email: 'permanent-action@example.invalid', errorCode: 'BREVO_API_REJECTED' }),
    deliveryEntry(EXHAUSTED_DELIVERY_ID, '91700000-0000-4000-8000-000000000003', { email: 'exhausted-action@example.invalid', attemptCount: 3 }),
    deliveryEntry(LOCKED_DELIVERY_ID, '91700000-0000-4000-8000-000000000004', { email: 'locked-action@example.invalid', lockedUntil: '2099-01-01T00:00:00.000Z' }),
    deliveryEntry(SENT_DELIVERY_ID, '91700000-0000-4000-8000-000000000005', {
      email: 'sent-action@example.invalid',
      status: 'SENT',
      attemptCount: 1,
      sentAt: '2026-08-24T05:45:00.000Z',
      createdAt: RECENT_TIMESTAMP,
      modifiedAt: RECENT_TIMESTAMP,
      lastErrorCode: null,
      lastErrorSummary: null,
      providerMessageId: 'sent-provider-private'
    }),
    deliveryEntry(EXPIRED_DELIVERY_ID, '91700000-0000-4000-8000-000000000006', {
      email: 'expired-action@example.invalid'
    }),
    deliveryEntry(NON_INVITED_DELIVERY_ID, '91700000-0000-4000-8000-000000000007', {
      email: 'non-invited-action@example.invalid'
    })
  )
  await db.run(INSERT.into('idts.cap.UserOnboardingRequests').entries(deliveryRequests))
  await db.run(INSERT.into('idts.cap.UserOnboardingDeliveries').entries(deliveryRows))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const deliveries = await service.send({
    event: 'searchOnboardingDeliveries',
    data: { status: 'FAILED', query: '', skip: 0, top: 100 },
    user: ADMIN
  })
  assert.equal(deliveries.length, 32)
  assert.equal(deliveries[0].recipientDisplay.startsWith('d***@'), true)
  assert.equal(deliveries[0].recipientDisplay.includes('@example.invalid'), true)
  assert.equal(deliveries[0].recipientDisplay.includes('delivery-26'), false)
  assert.equal('providerMessageId' in deliveries[0], false)
  assert.equal('lockToken' in deliveries[0], false)
  assert.equal('recipientEmail' in deliveries[0], false)

  const defaultDeliveries = await service.send({
    event: 'searchOnboardingDeliveries',
    data: { status: 'FAILED', query: '', skip: 0 },
    user: ADMIN
  })
  assert.equal(defaultDeliveries.length, 25)
  const filteredDelivery = await service.send({
    event: 'searchOnboardingDeliveries',
    data: { status: 'FAILED', query: 'retry-action', skip: 0, top: 25 },
    user: ADMIN
  })
  assert.deepEqual(filteredDelivery.map(row => row.deliveryID), [RETRY_DELIVERY_ID])
  const filteredByRequest = await service.send({
    event: 'searchOnboardingDeliveries',
    data: { status: 'FAILED', query: '91700000-0000-4000-8000-000000000001', skip: 0, top: 25 },
    user: ADMIN
  })
  assert.deepEqual(filteredByRequest.map(row => row.deliveryID), [RETRY_DELIVERY_ID])
  assert.equal(deliveries.find(row => row.deliveryID === RETRY_DELIVERY_ID).canRetry, true)
  assert.equal(deliveries.find(row => row.deliveryID === EXPIRED_DELIVERY_ID).canRetry, false)
  assert.equal(deliveries.find(row => row.deliveryID === NON_INVITED_DELIVERY_ID).canRetry, false)

  const operations = await service.send({
    event: 'searchAccessOperations',
    data: { skip: 0, top: 100 },
    user: ADMIN
  })
  assert.equal(operations.length, 5)
  const retryOperation = operations.find(row => row.operationID === RETRY_OPERATION_ID)
  const ambiguousOperation = operations.find(row => row.operationID === AMBIGUOUS_OPERATION_ID)
  const permanentOperation = operations.find(row => row.operationID === PERMANENT_OPERATION_ID)
  const inconsistentOperation = operations.find(row => row.operationID === INCONSISTENT_OPERATION_ID)
  const successfulOperation = operations.find(row => row.operationID === SUCCESS_OPERATION_ID)
  assert.equal(retryOperation.canRetry, true)
  assert.equal(retryOperation.canReconcile, false)
  assert.equal(ambiguousOperation.canRetry, false)
  assert.equal(ambiguousOperation.canReconcile, true)
  assert.equal(permanentOperation.canRetry, false)
  assert.equal(permanentOperation.canReconcile, false)
  assert.equal(inconsistentOperation.canRetry, false)
  assert.equal(inconsistentOperation.canReconcile, false)
  assert.equal(successfulOperation.safeResultSummary, 'The assigned role collections were verified.')
  assert.equal(retryOperation.requestedByDisplay, 'Operations PM')
  assert.equal(retryOperation.targetDisplay, 'r***@example.invalid')
  assert.equal('idempotencyKey' in retryOperation, false)
  assert.equal('providerCorrelationHash' in retryOperation, false)
  assert.equal('leaseTokenHash' in retryOperation, false)

  const auditEvents = await service.send({
    event: 'searchAccessAuditEvents',
    data: { action: '', result: '', from: null, to: null, skip: 0, top: 100 },
    user: ADMIN
  })
  assert.equal(auditEvents.length, 2)
  assert.match(auditEvents[0].correlationFingerprint, /^[a-f0-9]{12}$/)
  assert.equal(auditEvents[0].actorDisplay, 'Operations PM')
  assert.equal('beforeIdentityHash' in auditEvents[0], false)
  assert.equal('afterIdentityHash' in auditEvents[0], false)
  assert.equal('correlationId' in auditEvents[0], false)
  const auditEventsByDate = await service.send({
    event: 'searchAccessAuditEvents',
    data: { action: '', result: '', from: '2026-08-24', to: '2026-08-24', skip: 0, top: 100 },
    user: ADMIN
  })
  assert.equal(auditEventsByDate.length, 2)
  await expectRejected(service.send({
    event: 'searchAccessAuditEvents',
    data: { from: '2026-08-25T00:00:00.000Z', to: '2026-08-24T00:00:00.000Z', skip: 0, top: 25 },
    user: ADMIN
  }), 400, 'INVALID_DATE_RANGE')

  const readiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(readiness.emailDeliveryState, 'AVAILABLE')
  assert.equal(readiness.provisioningBrokerState, 'RECENT_SUCCESS')
  assert.equal(readiness.lastSuccessfulReconciliationAt, RECENT_TIMESTAMP)

  // Direct DB CQL writers persist explicit outcome timestamps but legacy/live rows may
  // not have a fresh managed modifiedAt. Readiness must use the outcome timestamp.
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({
    modifiedAt: '2020-01-01T00:00:00.000Z'
  }).where({ ID: SENT_DELIVERY_ID }))
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    modifiedAt: '2020-01-01T00:00:00.000Z'
  }).where({ ID: SUCCESS_OPERATION_ID }))
  const outcomeTimestampReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(outcomeTimestampReadiness.emailDeliveryState, 'AVAILABLE')
  assert.equal(outcomeTimestampReadiness.provisioningBrokerState, 'RECENT_SUCCESS')
  assert.equal(outcomeTimestampReadiness.lastSuccessfulReconciliationAt, RECENT_TIMESTAMP)

  await expectRejected(service.send({
    event: 'searchAccessOperations',
    data: { skip: 0, top: 25 },
    user: new cds.User({ id: ADMIN.id, roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

  let scheduleCalled = false
  const retryResult = await operationsAudit.retryOnboardingDelivery({
    data: { deliveryID: RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    timestamp: new Date('2026-08-24T07:00:00.000Z'),
    user: ADMIN
  }, {
    tx: db,
    authorize: async () => ({ ID: PM_ID }),
    getEmailConfig: () => ({ maxRetryCount: 2 }),
    schedule: () => { scheduleCalled = true }
  })
  assert.equal(retryResult.status, 'PENDING')
  assert.equal(retryResult.recipientDisplay, 'r***@example.invalid')
  assert.equal(scheduleCalled, true)
  const retriedDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: RETRY_DELIVERY_ID }))
  assert.equal(retriedDelivery.status_code, 'PENDING')
  assert.equal(retriedDelivery.lastErrorCode, null)
  assert.equal(retriedDelivery.lastErrorSummary, null)
  assert.equal(retriedDelivery.lockedUntil, null)
  assert.equal(retriedDelivery.lockToken, null)
  assert.equal(retriedDelivery.recipientEmail, 'retry-action@example.invalid')
  assert.equal(retriedDelivery.templateKey, 'IDTS_USER_ONBOARDING_V1')
  assert.equal(retriedDelivery.providerMessageId, 'provider-message-private')
  const retryAudits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ action: 'RETRY_ONBOARDING_DELIVERY' }))
  assert.equal(retryAudits.length, 1)
  assert.equal(retryAudits[0].result, 'QUEUED')
  assert.equal(retryAudits[0].fromState, 'FAILED')
  assert.equal(retryAudits[0].toState, 'PENDING')

  await expectRejected(operationsAudit.retryOnboardingDelivery({
    data: { deliveryID: RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    timestamp: new Date('2026-08-24T07:01:00.000Z'),
    user: ADMIN
  }, {
    tx: db,
    authorize: async () => ({ ID: PM_ID }),
    getEmailConfig: () => ({ maxRetryCount: 2 }),
    schedule: () => {}
  }), 409, 'DELIVERY_RETRY_CONFLICT')

  for (const [deliveryID, expectedCode] of [
    [PERMANENT_DELIVERY_ID, 'DELIVERY_NOT_RETRYABLE'],
    [EXHAUSTED_DELIVERY_ID, 'DELIVERY_RETRY_LIMIT_REACHED'],
    [LOCKED_DELIVERY_ID, 'DELIVERY_LOCKED'],
    [EXPIRED_DELIVERY_ID, 'DELIVERY_NOT_RETRYABLE'],
    [NON_INVITED_DELIVERY_ID, 'DELIVERY_NOT_RETRYABLE']
  ]) {
    const row = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: deliveryID }))
    await expectRejected(operationsAudit.retryOnboardingDelivery({
      data: { deliveryID, expectedModifiedAt: row.modifiedAt },
      timestamp: new Date('2026-08-24T07:02:00.000Z'),
      user: ADMIN
    }, {
      tx: db,
      authorize: async () => ({ ID: PM_ID }),
      getEmailConfig: () => ({ maxRetryCount: 2 }),
      schedule: () => {}
    }), 409, expectedCode)
  }
  const expiredDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: EXPIRED_DELIVERY_ID }))
  assert.equal(expiredDelivery.status_code, 'FAILED')
  const nonInvitedDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: NON_INVITED_DELIVERY_ID }))
  assert.equal(nonInvitedDelivery.status_code, 'FAILED')
  assert.equal((await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ action: 'RETRY_ONBOARDING_DELIVERY' }))).length, 1)

  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'PENDING', modifiedAt: RECENT_TIMESTAMP }))
  const pendingReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(pendingReadiness.emailDeliveryState, 'UNKNOWN')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'FAILED', modifiedAt: RECENT_TIMESTAMP }))
  const failedReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(failedReadiness.emailDeliveryState, 'UNAVAILABLE')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'SENT', modifiedAt: RECENT_TIMESTAMP }))
  const sentReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(sentReadiness.emailDeliveryState, 'AVAILABLE')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'FAILED', modifiedAt: RECENT_TIMESTAMP }))
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'SENT', modifiedAt: RECENT_TIMESTAMP }).where({ ID: SENT_DELIVERY_ID }))
  const sentPrecedenceReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(sentPrecedenceReadiness.emailDeliveryState, 'AVAILABLE')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({
    modifiedAt: '2020-01-01T00:00:00.000Z',
    lastAttemptAt: '2020-01-01T00:00:00.000Z',
    sentAt: '2020-01-01T00:00:00.000Z'
  }))
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    modifiedAt: '2020-01-01T00:00:00.000Z',
    completedAt: '2020-01-01T00:00:00.000Z'
  }))
  const staleReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(staleReadiness.emailDeliveryState, 'UNKNOWN')
  assert.equal(staleReadiness.provisioningBrokerState, 'STALE')

  console.log('IDTS User Administration operations/audit checks: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
