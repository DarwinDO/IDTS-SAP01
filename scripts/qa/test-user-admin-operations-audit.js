'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const serviceSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')

const required = [
  'type OnboardingDeliverySummary',
  'type AdministrationDeliverySummary',
  'type AccessOperationSummary',
  'type AdministrationAuditEventSummary',
  'type AdministrationReadiness',
  'action searchOnboardingDeliveries(',
  'action searchAdministrationDeliveries(',
  'action searchAccessOperations(',
  'action searchAccessAuditEvents(',
  'action readAdministrationReadiness()',
  'action retryOnboardingDelivery(',
  'action retryUserAccessDelivery('
]
for (const marker of required) assert.ok(serviceSource.includes(marker), `missing ${marker}`)

const contractStart = serviceSource.indexOf('type OnboardingDeliverySummary')
const entityMarker = serviceSource.match(/@readonly\r?\n\s+entity OnboardingRequests/)
const contractEnd = entityMarker?.index ?? -1
assert.ok(contractStart >= 0 && contractEnd > contractStart, 'safe operations contract boundary missing')
const safeContract = serviceSource.slice(contractStart, contractEnd)
for (const forbidden of [
  'recipientEmail',
  'subject',
  'textBody',
  'htmlBody',
  'providerMessageId',
  'sourceAuditEvent',
  'targetUser',
  'lockToken',
  'lockedUntil',
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
const ACCESS_RETRY_DELIVERY_ID = '91800000-0000-4000-8000-000000000001'
const ACCESS_PERMANENT_DELIVERY_ID = '91800000-0000-4000-8000-000000000002'
const ACCESS_EXHAUSTED_DELIVERY_ID = '91800000-0000-4000-8000-000000000003'
const ACCESS_LOCKED_DELIVERY_ID = '91800000-0000-4000-8000-000000000004'
const ACCESS_SENT_DELIVERY_ID = '91800000-0000-4000-8000-000000000005'
const DIGEST_FAILED_DELIVERY_ID = '91800000-0000-4000-8000-000000000006'
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

function accessDeliveryEntry (ID, sourceAuditEventID, values = {}) {
  return {
    ID,
    sourceAuditEvent_ID: sourceAuditEventID,
    targetUser_ID: TARGET_ID,
    recipientEmail: values.email || `access-${ID.slice(-4)}@example.invalid`,
    eventType: values.eventType || 'ACCESS_SUSPENDED',
    templateKey: values.templateKey || 'USER_ACCESS_ACCESS_SUSPENDED',
    subject: values.subject || '[IDTS] Your access suspended',
    textBody: values.textBody || 'Safe access delivery text snapshot.',
    htmlBody: values.htmlBody || '<p>Safe access delivery HTML snapshot.</p>',
    status_code: values.status || 'FAILED',
    attemptCount: values.attemptCount ?? 1,
    nextAttemptAt: values.nextAttemptAt || '2026-08-24T06:05:00.000Z',
    lastAttemptAt: values.lastAttemptAt || '2026-08-24T05:55:00.000Z',
    sentAt: values.sentAt || null,
    lastErrorCode: values.errorCode === undefined ? 'BREVO_API_FAILED' : values.errorCode,
    lastErrorSummary: values.errorSummary === undefined ? 'Persisted provider summary must not leave the service.' : values.errorSummary,
    providerMessageId: values.providerMessageId || 'access-provider-private',
    lockedUntil: values.lockedUntil || null,
    lockToken: values.lockToken || null,
    createdAt: values.createdAt || '2026-08-24T05:30:00.000Z',
    modifiedAt: values.modifiedAt || RETRY_MODIFIED_AT
  }
}

function digestDeliveryEntry (ID, values = {}) {
  return {
    ID,
    recipient_ID: values.recipientID || ADMIN_ID,
    businessDate: values.businessDate || '2026-08-24',
    digestType: values.digestType || 'PM',
    windowStart: values.windowStart || '2026-08-23T01:00:00.000Z',
    windowEnd: values.windowEnd || '2026-08-24T01:00:00.000Z',
    snapshotAt: values.snapshotAt || '2026-08-24T01:00:00.000Z',
    itemCount: values.itemCount ?? 2,
    subject: 'Private digest subject must not leave Operations.',
    textBody: 'Private digest text must not leave Operations.',
    htmlBody: '<p>Private digest HTML must not leave Operations.</p>',
    status_code: values.status || 'FAILED',
    attemptCount: values.attemptCount ?? 1,
    nextAttemptAt: values.nextAttemptAt || '2026-08-24T06:05:00.000Z',
    lastAttemptAt: values.lastAttemptAt || '2026-08-24T05:55:00.000Z',
    sentAt: values.sentAt || null,
    lastErrorCode: values.errorCode || 'BREVO_API_FAILED',
    lastErrorSummary: 'Private persisted provider summary must not leave Operations.',
    providerMessageId: 'private-digest-provider-id',
    lockedUntil: values.lockedUntil || null,
    lockToken: values.lockToken || 'private-digest-lock',
    createdAt: values.createdAt || '2026-08-24T05:40:00.000Z',
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

async function verifyAdministrationDeliveryAuthorizationAndBounds () {
  let authorized = false
  const sources = []
  const limits = []
  const tx = {
    run: async query => {
      assert.equal(authorized, true, 'authorization precedes every Administration delivery table read')
      sources.push(String(query.SELECT?.from?.ref?.[0] || ''))
      limits.push({
        rows: query.SELECT?.limit?.rows?.val,
        offset: query.SELECT?.limit?.offset?.val
      })
      return []
    }
  }
  const dependencies = {
    tx,
    authorize: async () => { authorized = true },
    getEmailConfig: () => ({ maxRetryCount: 2 })
  }
  const all = await operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'ALL', status: '', query: '', skip: 50000, top: 500 },
    timestamp: new Date('2026-08-26T10:00:00.000Z')
  }, dependencies)
  assert.deepEqual(all, [])
  assert.deepEqual(sources.sort(), [
    'idts.cap.NotificationDigestDeliveries',
    'idts.cap.UserAccessNotificationDeliveries',
    'idts.cap.UserOnboardingDeliveries'
  ])
  assert.deepEqual(limits, [
    { rows: 10100, offset: undefined },
    { rows: 10100, offset: undefined },
    { rows: 10100, offset: undefined }
  ], 'ALL reads at most clamped skip plus top from each table')

  authorized = false
  sources.length = 0
  limits.length = 0
  await operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'ACCESS_CHANGE', status: '', query: '', skip: 5, top: 10 }
  }, dependencies)
  assert.deepEqual(sources, ['idts.cap.UserAccessNotificationDeliveries'], 'a concrete type reads only its own table')
  assert.deepEqual(limits, [{ rows: 10, offset: 5 }])

  authorized = false
  sources.length = 0
  limits.length = 0
  await operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'DIGEST', status: '', query: '', skip: 0, top: 25 }
  }, dependencies)
  assert.deepEqual(sources, ['idts.cap.NotificationDigestDeliveries'], 'Digest reads only the existing digest delivery table')

  let reads = 0
  await expectRejected(operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'ALL', skip: 0, top: 25 }
  }, {
    tx: { run: async () => { reads += 1 } },
    authorize: async () => { throw Object.assign(new Error('forbidden'), { status: 403, code: 'USER_ADMIN_REQUIRED' }) }
  }), 403, 'USER_ADMIN_REQUIRED')
  assert.equal(reads, 0, 'failed authorization performs no Administration delivery table read')

  reads = 0
  await expectRejected(operationsAudit.retryUserAccessDelivery({
    data: { deliveryID: ACCESS_RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT }
  }, {
    tx: { run: async () => { reads += 1 } },
    authorize: async () => { throw Object.assign(new Error('forbidden'), { status: 403, code: 'USER_ADMIN_REQUIRED' }) }
  }), 403, 'USER_ADMIN_REQUIRED')
  assert.equal(reads, 0, 'failed authorization performs no access delivery read or mutation')
}

async function verifyDigestSearchContinuesPastFormerCap () {
  const targetRecipientID = '91000000-0000-4000-8000-000000000099'
  let latestDigestRows = []
  let digestReads = 0
  const tx = {
    run: async query => {
      const source = String(query.SELECT?.from?.ref?.[0] || '')
      if (source === 'idts.cap.NotificationDigestDeliveries') {
        digestReads += 1
        const rows = Number(query.SELECT?.limit?.rows?.val || 0)
        const offset = Number(query.SELECT?.limit?.offset?.val || 0)
        if (offset > 10100) return []
        if (offset === 10100) {
          latestDigestRows = [digestDeliveryEntry('91800000-0000-4000-8000-000000010101', {
            recipientID: targetRecipientID,
            createdAt: '2026-08-20T00:00:00.000Z'
          })]
          return latestDigestRows
        }
        latestDigestRows = Array.from({ length: rows }, (_, index) => digestDeliveryEntry(
          `digest-${String(offset + index).padStart(5, '0')}`,
          { recipientID: `user-${String(offset + index).padStart(5, '0')}` }
        ))
        return latestDigestRows
      }
      if (source === 'idts.cap.Users') {
        return latestDigestRows.some(row => row.recipient_ID === targetRecipientID)
          ? [{ ID: targetRecipientID, email: 'zeta@example.invalid' }]
          : []
      }
      throw new Error(`Unexpected source ${source}`)
    }
  }
  const rows = await operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'DIGEST', status: '', query: 'z***@example.invalid', skip: 0, top: 1 }
  }, {
    tx,
    authorize: async () => {},
    getEmailConfig: () => ({ maxRetryCount: 2 })
  })
  assert.equal(digestReads > 1, true, 'Digest search continues page-by-page beyond the former 10,100-row cap')
  assert.deepEqual(rows.map(row => row.deliveryID), ['91800000-0000-4000-8000-000000010101'])
}

async function verifyDigestSearchHasFixedWorkBudget () {
  let digestReads = 0
  let latestDigestRows = []
  const tx = {
    run: async query => {
      const source = String(query.SELECT?.from?.ref?.[0] || '')
      if (source === 'idts.cap.NotificationDigestDeliveries') {
        digestReads += 1
        const rows = Number(query.SELECT?.limit?.rows?.val || 0)
        const offset = Number(query.SELECT?.limit?.offset?.val || 0)
        if (offset >= 20100) return []
        latestDigestRows = Array.from({ length: rows }, (_, index) => digestDeliveryEntry(
          `budget-${String(offset + index).padStart(5, '0')}`,
          { recipientID: `budget-user-${String(offset + index).padStart(5, '0')}` }
        ))
        return latestDigestRows
      }
      if (source === 'idts.cap.Users') return []
      throw new Error(`Unexpected source ${source}`)
    }
  }
  await expectRejected(operationsAudit.searchAdministrationDeliveries({
    data: { deliveryType: 'DIGEST', status: '', query: 'no-match@example.invalid', skip: 0, top: 1 }
  }, {
    tx,
    authorize: async () => {},
    getEmailConfig: () => ({ maxRetryCount: 2 })
  }), 422, 'DIGEST_SEARCH_TOO_BROAD')
  assert.equal(digestReads, 200, 'Digest search performs at most 20,000 candidate-row page reads')
}

async function main () {
  const serviceModel = await cds.load('srv/user-admin.cds')
  assert.deepEqual(
    Object.keys(serviceModel.definitions['UserAdministrationService.AdministrationDeliverySummary'].elements),
    [
      'deliveryID',
      'deliveryType',
      'eventType',
      'recipientDisplay',
      'status',
      'attemptCount',
      'nextAttemptAt',
      'lastAttemptAt',
      'sentAt',
      'errorCode',
      'errorSummary',
      'canRetry',
      'modifiedAt'
    ],
    'the normalized Administration delivery DTO is an exact allowlist'
  )
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
  assert.equal(operationsAudit.toAdministrationDeliverySummary({
    ID: DIGEST_FAILED_DELIVERY_ID,
    status_code: 'FAILED',
    lastErrorCode: 'PRIVATE_PROVIDER_STACK_TOKEN'
  }, 'DIGEST').errorCode, 'UNAVAILABLE', 'unknown persisted delivery error codes stay private')
  await verifyAdministrationDeliveryAuthorizationAndBounds()
  await verifyDigestSearchContinuesPastFormerCap()
  await verifyDigestSearchHasFixedWorkBudget()

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
    }),
    auditEntry('91900000-0000-4000-8000-000000000001', null, null, {
      action: 'SUSPEND',
      result: 'APPLIED',
      toState: 'SUSPENDED',
      targetUserID: TARGET_ID,
      correlationId: '91900000-0000-4000-8000-000000000001'
    }),
    auditEntry('91900000-0000-4000-8000-000000000002', null, null, {
      action: 'CHANGE_ROLE',
      result: 'APPLIED',
      toState: 'ACTIVE',
      targetUserID: TARGET_ID,
      correlationId: '91900000-0000-4000-8000-000000000002'
    }),
    auditEntry('91900000-0000-4000-8000-000000000003', null, null, {
      action: 'REACTIVATE',
      result: 'APPLIED',
      toState: 'ACTIVE',
      targetUserID: TARGET_ID,
      correlationId: '91900000-0000-4000-8000-000000000003'
    }),
    auditEntry('91900000-0000-4000-8000-000000000004', null, null, {
      action: 'REVOKE',
      result: 'APPLIED',
      toState: 'REVOKED',
      targetUserID: TARGET_ID,
      correlationId: '91900000-0000-4000-8000-000000000004'
    }),
    auditEntry('91900000-0000-4000-8000-000000000005', null, null, {
      action: 'CHANGE_ROLE',
      result: 'APPLIED',
      toState: 'ACTIVE',
      targetUserID: TARGET_ID,
      correlationId: '91900000-0000-4000-8000-000000000005'
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
  await db.run(INSERT.into('idts.cap.UserAccessNotificationDeliveries').entries([
    accessDeliveryEntry(ACCESS_RETRY_DELIVERY_ID, '91900000-0000-4000-8000-000000000001', {
      email: 'delivery-26-access@example.invalid',
      createdAt: '2026-08-24T05:26:00.000Z',
      modifiedAt: RETRY_MODIFIED_AT
    }),
    accessDeliveryEntry(ACCESS_PERMANENT_DELIVERY_ID, '91900000-0000-4000-8000-000000000002', {
      email: 'permanent-access@example.invalid',
      eventType: 'ACCESS_ROLE_CHANGED',
      errorCode: 'BREVO_API_REJECTED'
    }),
    accessDeliveryEntry(ACCESS_EXHAUSTED_DELIVERY_ID, '91900000-0000-4000-8000-000000000003', {
      email: 'exhausted-access@example.invalid',
      eventType: 'ACCESS_REACTIVATED',
      attemptCount: 3
    }),
    accessDeliveryEntry(ACCESS_LOCKED_DELIVERY_ID, '91900000-0000-4000-8000-000000000004', {
      email: 'locked-access@example.invalid',
      eventType: 'ACCESS_REVOKED',
      lockedUntil: '2099-01-01T00:00:00.000Z',
      lockToken: 'private-access-lock'
    }),
    accessDeliveryEntry(ACCESS_SENT_DELIVERY_ID, '91900000-0000-4000-8000-000000000005', {
      email: 'sent-access@example.invalid',
      eventType: 'ACCESS_ROLE_CHANGED',
      status: 'SENT',
      sentAt: RECENT_TIMESTAMP,
      lastAttemptAt: RECENT_TIMESTAMP,
      errorCode: null,
      errorSummary: null,
      createdAt: RECENT_TIMESTAMP,
      modifiedAt: RECENT_TIMESTAMP
    })
  ]))
  await db.run(INSERT.into('idts.cap.NotificationDigestDeliveries').entries(
    digestDeliveryEntry(DIGEST_FAILED_DELIVERY_ID, { errorCode: 'PRIVATE_PROVIDER_STACK_TOKEN' })
  ))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const normalizedDeliveries = await service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'ALL', status: 'FAILED', query: 'delivery-26', skip: 0, top: 10 },
    user: ADMIN
  })
  assert.deepEqual(
    normalizedDeliveries.map(row => [row.deliveryID, row.deliveryType]),
    [
      [ACCESS_RETRY_DELIVERY_ID, 'ACCESS_CHANGE'],
      ['91600000-0000-4000-8000-000000000026', 'INVITATION']
    ],
    'mixed delivery rows sort by createdAt descending then ID descending'
  )
  const normalizedKeys = [
    'attemptCount',
    'canRetry',
    'deliveryID',
    'deliveryType',
    'errorCode',
    'errorSummary',
    'eventType',
    'lastAttemptAt',
    'modifiedAt',
    'nextAttemptAt',
    'recipientDisplay',
    'sentAt',
    'status'
  ]
  assert.deepEqual(Object.keys(normalizedDeliveries[0]).sort(), normalizedKeys)
  assert.equal(normalizedDeliveries[0].recipientDisplay, 'd***@example.invalid')
  assert.equal(normalizedDeliveries[0].recipientDisplay.includes('delivery-26-access'), false)
  assert.equal(normalizedDeliveries[0].errorCode, 'BREVO_API_FAILED')
  assert.equal(normalizedDeliveries[0].errorSummary, 'Email provider request failed.')
  assert.equal(normalizedDeliveries[0].canRetry, true)
  for (const forbidden of ['recipientEmail', 'subject', 'textBody', 'htmlBody', 'providerMessageId', 'sourceAuditEvent_ID', 'targetUser_ID', 'lockToken', 'lockedUntil']) {
    assert.equal(forbidden in normalizedDeliveries[0], false, `normalized delivery forbids ${forbidden}`)
  }

  const accessOnly = await service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'ACCESS_CHANGE', status: 'FAILED', query: '', skip: 0, top: 100 },
    user: ADMIN
  })
  assert.equal(accessOnly.length, 4)
  assert.ok(accessOnly.every(row => row.deliveryType === 'ACCESS_CHANGE'))
  assert.equal(accessOnly.find(row => row.deliveryID === ACCESS_PERMANENT_DELIVERY_ID).canRetry, false)
  assert.equal(accessOnly.find(row => row.deliveryID === ACCESS_EXHAUSTED_DELIVERY_ID).canRetry, false)
  assert.equal(accessOnly.find(row => row.deliveryID === ACCESS_LOCKED_DELIVERY_ID).canRetry, false)
  const digestsOnly = await service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'DIGEST', status: 'FAILED', query: 's***@example.invalid', skip: 0, top: 25 },
    user: ADMIN
  })
  assert.equal(digestsOnly.length, 1)
  assert.deepEqual(digestsOnly[0], {
    deliveryID: DIGEST_FAILED_DELIVERY_ID,
    deliveryType: 'DIGEST',
    eventType: 'DIGEST',
    recipientDisplay: 's***@example.invalid',
    status: 'FAILED',
    attemptCount: 1,
    nextAttemptAt: '2026-08-24T06:05:00.000Z',
    lastAttemptAt: '2026-08-24T05:55:00.000Z',
    sentAt: null,
    errorCode: 'UNAVAILABLE',
    errorSummary: 'Email delivery failed.',
    canRetry: false,
    modifiedAt: RETRY_MODIFIED_AT
  }, 'Digest diagnostics expose only the shared safe DTO and never enable manual retry')
  for (const forbidden of ['recipient_ID', 'recipientEmail', 'digestType', 'businessDate', 'itemCount', 'subject', 'textBody', 'htmlBody', 'providerMessageId', 'lockToken', 'lockedUntil']) {
    assert.equal(forbidden in digestsOnly[0], false, `Digest diagnostic forbids ${forbidden}`)
  }
  const invitationsOnly = await service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'INVITATION', status: 'FAILED', query: 'retry-action', skip: 0, top: 25 },
    user: ADMIN
  })
  assert.deepEqual(invitationsOnly.map(row => row.deliveryID), [RETRY_DELIVERY_ID])
  assert.equal(invitationsOnly[0].eventType, 'INVITATION')
  assert.equal(invitationsOnly[0].deliveryType, 'INVITATION')
  await expectRejected(service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'BUG', status: '', query: '', skip: 0, top: 25 },
    user: ADMIN
  }), 400, 'INVALID_DELIVERY_TYPE')
  await expectRejected(service.send({
    event: 'searchAdministrationDeliveries',
    data: { deliveryType: 'ALL', status: '', query: '', skip: 0, top: 25 },
    user: new cds.User({ id: ADMIN.id, roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')
  await expectRejected(service.send({
    event: 'retryUserAccessDelivery',
    data: { deliveryID: ACCESS_RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    user: new cds.User({ id: ADMIN.id, roles: ['authenticated-user', 'PM'] })
  }), 403, 'USER_ADMIN_REQUIRED')

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
  assert.equal(auditEvents.length, 7)
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
  assert.equal(auditEventsByDate.length, 7)
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

  const accessRetryBefore = await db.run(SELECT.one.from('idts.cap.UserAccessNotificationDeliveries').where({ ID: ACCESS_RETRY_DELIVERY_ID }))
  const completionAuditBefore = await db.run(SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({ ID: accessRetryBefore.sourceAuditEvent_ID }))
  let accessScheduleCount = 0
  const accessRetryResult = await operationsAudit.retryUserAccessDelivery({
    data: { deliveryID: ACCESS_RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    timestamp: new Date('2026-08-24T07:10:00.000Z'),
    user: ADMIN
  }, {
    tx: db,
    authorize: async () => ({ ID: PM_ID }),
    getEmailConfig: () => ({ maxRetryCount: 2 }),
    schedule: () => { accessScheduleCount += 1 }
  })
  assert.equal(accessRetryResult.deliveryType, 'ACCESS_CHANGE')
  assert.equal(accessRetryResult.eventType, 'ACCESS_SUSPENDED')
  assert.equal(accessRetryResult.status, 'PENDING')
  assert.equal(accessRetryResult.recipientDisplay, 'd***@example.invalid')
  assert.equal(accessRetryResult.errorCode, null)
  assert.equal(accessRetryResult.errorSummary, null)
  assert.equal(accessScheduleCount, 1, 'the existing post-commit scheduler is registered once')
  const accessRetryAfter = await db.run(SELECT.one.from('idts.cap.UserAccessNotificationDeliveries').where({ ID: ACCESS_RETRY_DELIVERY_ID }))
  assert.equal(accessRetryAfter.status_code, 'PENDING')
  assert.equal(accessRetryAfter.nextAttemptAt, '2026-08-24T07:10:00.000Z')
  assert.equal(accessRetryAfter.lastErrorCode, null)
  assert.equal(accessRetryAfter.lastErrorSummary, null)
  assert.equal(accessRetryAfter.lockedUntil, null)
  assert.equal(accessRetryAfter.lockToken, null)
  for (const field of ['sourceAuditEvent_ID', 'targetUser_ID', 'recipientEmail', 'eventType', 'templateKey', 'subject', 'textBody', 'htmlBody', 'providerMessageId', 'attemptCount', 'lastAttemptAt', 'sentAt']) {
    assert.equal(accessRetryAfter[field], accessRetryBefore[field], `access retry preserves ${field}`)
  }
  const completionAuditAfter = await db.run(SELECT.one.from('idts.cap.UserIdentityAuditEvents').where({ ID: accessRetryBefore.sourceAuditEvent_ID }))
  assert.deepEqual(completionAuditAfter, completionAuditBefore, 'access retry preserves the final completion audit snapshot')
  const accessRetryAudits = await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ action: 'RETRY_ACCESS_DELIVERY' }))
  assert.equal(accessRetryAudits.length, 1)
  assert.equal(accessRetryAudits[0].targetUser_ID, TARGET_ID)
  assert.equal(accessRetryAudits[0].result, 'QUEUED')
  assert.equal(accessRetryAudits[0].fromState, 'FAILED')
  assert.equal(accessRetryAudits[0].toState, 'PENDING')

  await expectRejected(operationsAudit.retryUserAccessDelivery({
    data: { deliveryID: ACCESS_RETRY_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    timestamp: new Date('2026-08-24T07:11:00.000Z'),
    user: ADMIN
  }, {
    tx: db,
    authorize: async () => ({ ID: PM_ID }),
    getEmailConfig: () => ({ maxRetryCount: 2 }),
    schedule: () => { accessScheduleCount += 1 }
  }), 409, 'DELIVERY_RETRY_CONFLICT')
  for (const [deliveryID, expectedCode] of [
    [ACCESS_PERMANENT_DELIVERY_ID, 'DELIVERY_NOT_RETRYABLE'],
    [ACCESS_EXHAUSTED_DELIVERY_ID, 'DELIVERY_RETRY_LIMIT_REACHED'],
    [ACCESS_LOCKED_DELIVERY_ID, 'DELIVERY_LOCKED'],
    [ACCESS_SENT_DELIVERY_ID, 'DELIVERY_NOT_RETRYABLE']
  ]) {
    const row = await db.run(SELECT.one.from('idts.cap.UserAccessNotificationDeliveries').where({ ID: deliveryID }))
    await expectRejected(operationsAudit.retryUserAccessDelivery({
      data: { deliveryID, expectedModifiedAt: row.modifiedAt },
      timestamp: new Date('2026-08-24T07:12:00.000Z'),
      user: ADMIN
    }, {
      tx: db,
      authorize: async () => ({ ID: PM_ID }),
      getEmailConfig: () => ({ maxRetryCount: 2 }),
      schedule: () => { accessScheduleCount += 1 }
    }), 409, expectedCode)
  }
  await expectRejected(operationsAudit.retryUserAccessDelivery({
    data: { deliveryID: PERMANENT_DELIVERY_ID, expectedModifiedAt: RETRY_MODIFIED_AT },
    timestamp: new Date('2026-08-24T07:13:00.000Z'),
    user: ADMIN
  }, {
    tx: db,
    authorize: async () => ({ ID: PM_ID }),
    getEmailConfig: () => ({ maxRetryCount: 2 }),
    schedule: () => { accessScheduleCount += 1 }
  }), 404, 'DELIVERY_NOT_FOUND')
  assert.equal(accessScheduleCount, 1, 'rejected access retries never schedule provider work')
  assert.equal((await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ action: 'RETRY_ACCESS_DELIVERY' }))).length, 1)

  const expiredDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: EXPIRED_DELIVERY_ID }))
  assert.equal(expiredDelivery.status_code, 'FAILED')
  const nonInvitedDelivery = await db.run(SELECT.one.from('idts.cap.UserOnboardingDeliveries').where({ ID: NON_INVITED_DELIVERY_ID }))
  assert.equal(nonInvitedDelivery.status_code, 'FAILED')
  assert.equal((await db.run(SELECT.from('idts.cap.UserIdentityAuditEvents').where({ action: 'RETRY_ONBOARDING_DELIVERY' }))).length, 1)

  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({ status_code: 'PENDING', modifiedAt: RECENT_TIMESTAMP }))
  await db.run(UPDATE('idts.cap.UserAccessNotificationDeliveries').set({ status_code: 'PENDING', modifiedAt: RECENT_TIMESTAMP }))
  const pendingReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(pendingReadiness.emailDeliveryState, 'UNKNOWN')
  await db.run(UPDATE('idts.cap.UserAccessNotificationDeliveries').set({
    status_code: 'FAILED',
    lastAttemptAt: RECENT_TIMESTAMP,
    modifiedAt: RECENT_TIMESTAMP
  }))
  const failedReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(failedReadiness.emailDeliveryState, 'UNAVAILABLE')
  await db.run(UPDATE('idts.cap.UserAccessNotificationDeliveries').set({
    status_code: 'SENT',
    sentAt: RECENT_TIMESTAMP,
    modifiedAt: RECENT_TIMESTAMP
  }).where({ ID: ACCESS_SENT_DELIVERY_ID }))
  const sentReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(sentReadiness.emailDeliveryState, 'AVAILABLE')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({
    status_code: 'SENT',
    sentAt: RECENT_TIMESTAMP,
    modifiedAt: RECENT_TIMESTAMP
  }).where({ ID: SENT_DELIVERY_ID }))
  await db.run(UPDATE('idts.cap.UserAccessNotificationDeliveries').set({
    status_code: 'FAILED',
    lastAttemptAt: RECENT_TIMESTAMP,
    sentAt: null,
    modifiedAt: RECENT_TIMESTAMP
  }))
  const sentPrecedenceReadiness = await service.send({ event: 'readAdministrationReadiness', data: {}, user: ADMIN })
  assert.equal(sentPrecedenceReadiness.emailDeliveryState, 'AVAILABLE', 'recent SENT in either UA table precedes recent FAILED in the other')
  await db.run(UPDATE('idts.cap.UserOnboardingDeliveries').set({
    modifiedAt: '2020-01-01T00:00:00.000Z',
    lastAttemptAt: '2020-01-01T00:00:00.000Z',
    sentAt: '2020-01-01T00:00:00.000Z'
  }))
  await db.run(UPDATE('idts.cap.UserAccessOperations').set({
    modifiedAt: '2020-01-01T00:00:00.000Z',
    completedAt: '2020-01-01T00:00:00.000Z'
  }))
  await db.run(UPDATE('idts.cap.UserAccessNotificationDeliveries').set({
    modifiedAt: '2020-01-01T00:00:00.000Z',
    lastAttemptAt: '2020-01-01T00:00:00.000Z',
    sentAt: '2020-01-01T00:00:00.000Z'
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
