'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { SELECT, UPDATE, INSERT } = cds.ql

const { getEmailConfig: defaultEmailConfig } = require('../email/config')
const { scheduleImmediateEmailOutbox: defaultSchedule } = require('../email/worker')

const DELIVERIES = 'idts.cap.UserOnboardingDeliveries'
const ACCESS_DELIVERIES = 'idts.cap.UserAccessNotificationDeliveries'
const DIGEST_DELIVERIES = 'idts.cap.NotificationDigestDeliveries'
const REQUESTS = 'idts.cap.UserOnboardingRequests'
const OPERATIONS = 'idts.cap.UserAccessOperations'
const AUDIT_EVENTS = 'idts.cap.UserIdentityAuditEvents'
const USERS = 'idts.cap.Users'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_PAGE_SKIP = 1000000
const MAX_ADMINISTRATION_PAGE_SKIP = 10000
const READINESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const RETRYABLE_DELIVERY_CODES = new Set([
  'BREVO_API_FAILED',
  'ECONNECTION',
  'ECONNREFUSED',
  'ESOCKET',
  'ETIMEDOUT'
])

const DELIVERY_ERROR_SUMMARIES = Object.freeze({
  BREVO_API_FAILED: 'Email provider request failed.',
  BREVO_API_REJECTED: 'Email provider rejected the message.',
  EAUTH: 'Email delivery authentication failed.',
  ECONNECTION: 'Email provider connection failed.',
  ECONNREFUSED: 'Email provider connection was refused.',
  ESOCKET: 'Email provider connection failed.',
  ETIMEDOUT: 'Email provider connection timed out.'
})

const OPERATION_RESULT_SUMMARIES = Object.freeze({
  APPLIED: 'The requested access change was applied and verified.',
  NOOP_ALREADY_DESIRED: 'The requested access was already present and verified.',
  ROLE_COLLECTIONS_VERIFIED: 'The assigned role collections were verified.',
  CONFLICT: 'Provider state conflicts with the requested IDTS access.',
  RETRYABLE_FAILURE: 'The provider is temporarily unavailable; a bounded retry may be requested.',
  PERMANENT_FAILURE: 'The provider rejected the access change; manual review is required.',
  AMBIGUOUS_PROVIDER_OUTCOME: 'The provider outcome is ambiguous; manual reconciliation is required.'
})

const AUDIT_SUMMARIES = Object.freeze({
  RETRY_ONBOARDING_DELIVERY: 'Onboarding delivery retry queued.',
  RETRY_ACCESS_DELIVERY: 'Access delivery retry queued.',
  REQUEST_SUSPEND: 'Local access suspension requested.',
  REQUEST_REACTIVATE: 'Access reactivation requested.',
  RECONCILE_ACCESS_OPERATION: 'Access operation reconciliation queued.',
  RETRY_ACCESS_OPERATION: 'Access operation retry queued.'
})

// Gate 6 giữ một allow-list cho mọi field trả ra; model persistence không được leak ra OData.
function registerOperationsAuditHandlers (service, dependencies = {}) {
  if (typeof dependencies.authorize !== 'function') throw new TypeError('Operations authorization is required.')
  service.on('searchOnboardingDeliveries', req => searchOnboardingDeliveries(req, dependencies))
  service.on('searchAdministrationDeliveries', req => searchAdministrationDeliveries(req, dependencies))
  service.on('searchAccessOperations', req => searchAccessOperations(req, dependencies))
  service.on('searchAccessAuditEvents', req => searchAccessAuditEvents(req, dependencies))
  service.on('readAdministrationReadiness', req => readAdministrationReadiness(req, dependencies))
  service.on('retryOnboardingDelivery', req => retryOnboardingDelivery(req, dependencies))
  service.on('retryUserAccessDelivery', req => retryUserAccessDelivery(req, dependencies))
}

async function searchOnboardingDeliveries (req, dependencies) {
  const tx = cds.tx(req)
  await dependencies.authorize(req, tx)
  const { skip, top } = clampPage(req.data?.skip, req.data?.top)
  const status = optionalCode(req.data?.status, 'INVALID_DELIVERY_STATUS')
  const query = normalizeQuery(req.data?.query)
  const maxAttempts = maxAttemptsFrom(dependencies.getEmailConfig)
  const readAt = requestTime(req)
  const selection = SELECT.from(DELIVERIES)
    .columns(
      'ID',
      'onboardingRequest_ID',
      'recipientEmail',
      'status_code',
      'attemptCount',
      'nextAttemptAt',
      'lastAttemptAt',
      'sentAt',
      'lastErrorCode',
      'lastErrorSummary',
      'modifiedAt'
    )
    .orderBy('createdAt desc', 'ID desc')
    .limit(top, skip)
  if (status) selection.where({ status_code: status })
  if (query) selection.where`contains(recipientEmail, ${query}) or contains(ID, ${query}) or contains(onboardingRequest_ID, ${query})`
  const rows = await tx.run(selection)
  const requestIDs = [...new Set(rows.map(row => row.onboardingRequest_ID).filter(Boolean))]
  const requests = requestIDs.length === 0
    ? []
    : await tx.run(SELECT.from(REQUESTS).columns('ID', 'status_code', 'expiresAt').where({ ID: { in: requestIDs } }))
  const requestByID = new Map(requests.map(row => [row.ID, row]))
  return rows.map(row => toDeliverySummary(row, maxAttempts, requestByID.get(row.onboardingRequest_ID), readAt))
}

async function searchAdministrationDeliveries (req, dependencies = {}) {
  const tx = dependencies.tx || cds.tx(req)
  await dependencies.authorize(req, tx)
  const deliveryType = administrationDeliveryType(req.data?.deliveryType)
  const { skip, top } = clampAdministrationPage(req.data?.skip, req.data?.top)
  const status = optionalCode(req.data?.status, 'INVALID_DELIVERY_STATUS')
  const query = normalizeQuery(req.data?.query)
  const maxAttempts = maxAttemptsFrom(dependencies.getEmailConfig)
  const readAt = requestTime(req)

  if (deliveryType !== 'ALL') {
    const digestQuery = deliveryType === 'DIGEST' && query
    const rows = await tx.run(administrationDeliverySelection(
      deliveryType,
      status,
      query,
      digestQuery ? MAX_ADMINISTRATION_PAGE_SKIP + MAX_PAGE_SIZE : top,
      digestQuery ? 0 : skip
    ))
    const normalized = await normalizeAdministrationDeliveries(tx, deliveryType, rows, maxAttempts, readAt)
    if (!digestQuery) return normalized.map(entry => entry.value)
    return filterAdministrationDeliveries(normalized, query).slice(skip, skip + top).map(entry => entry.value)
  }

  const readLimit = skip + top
  const [invitations, accessChanges, digests] = await Promise.all([
    tx.run(administrationDeliverySelection('INVITATION', status, query, readLimit)),
    tx.run(administrationDeliverySelection('ACCESS_CHANGE', status, query, readLimit)),
    tx.run(administrationDeliverySelection('DIGEST', status, query, query ? MAX_ADMINISTRATION_PAGE_SKIP + MAX_PAGE_SIZE : readLimit))
  ])
  const normalized = [
    ...await normalizeAdministrationDeliveries(tx, 'INVITATION', invitations, maxAttempts, readAt),
    ...await normalizeAdministrationDeliveries(tx, 'ACCESS_CHANGE', accessChanges, maxAttempts, readAt),
    ...filterAdministrationDeliveries(await normalizeAdministrationDeliveries(tx, 'DIGEST', digests, maxAttempts, readAt), query)
  ]
  normalized.sort(compareAdministrationDeliveries)
  return normalized.slice(skip, skip + top).map(entry => entry.value)
}

function administrationDeliverySelection (deliveryType, status, query, top, skip) {
  const invitation = deliveryType === 'INVITATION'
  const digest = deliveryType === 'DIGEST'
  const selection = SELECT.from(invitation ? DELIVERIES : digest ? DIGEST_DELIVERIES : ACCESS_DELIVERIES)
    .columns(...(invitation
      ? [
          'ID',
          'onboardingRequest_ID',
          'recipientEmail',
          'status_code',
          'attemptCount',
          'nextAttemptAt',
          'lastAttemptAt',
          'sentAt',
          'lastErrorCode',
          'modifiedAt',
          'lockedUntil',
          'createdAt'
        ]
      : digest
        ? [
            'ID',
            'recipient_ID',
            'digestType',
            'status_code',
            'attemptCount',
            'nextAttemptAt',
            'lastAttemptAt',
            'sentAt',
            'lastErrorCode',
            'modifiedAt',
            'createdAt'
          ]
        : [
          'ID',
          'recipientEmail',
          'eventType',
          'status_code',
          'attemptCount',
          'nextAttemptAt',
          'lastAttemptAt',
          'sentAt',
          'lastErrorCode',
          'modifiedAt',
          'lockedUntil',
          'createdAt'
          ]))
    .orderBy('createdAt desc', 'ID desc')
    .limit(top, skip)
  if (status) selection.where({ status_code: status })
  // Digest recipient search is applied after the bounded User lookup so raw email never enters the DTO.
  if (query && invitation) {
    selection.where`contains(recipientEmail, ${query}) or contains(ID, ${query}) or contains(onboardingRequest_ID, ${query})`
  } else if (query && !digest) {
    selection.where`contains(recipientEmail, ${query}) or contains(ID, ${query}) or contains(eventType, ${query})`
  }
  return selection
}

async function normalizeAdministrationDeliveries (tx, deliveryType, rows, maxAttempts, readAt) {
  let requestByID = new Map()
  let userByID = new Map()
  if (deliveryType === 'INVITATION') {
    const requestIDs = [...new Set(rows.map(row => row.onboardingRequest_ID).filter(Boolean))]
    const requests = requestIDs.length === 0
      ? []
      : await tx.run(SELECT.from(REQUESTS).columns('ID', 'status_code', 'expiresAt').where({ ID: { in: requestIDs } }))
    requestByID = new Map(requests.map(row => [row.ID, row]))
  } else if (deliveryType === 'DIGEST') {
    const userIDs = [...new Set(rows.map(row => row.recipient_ID).filter(Boolean))]
    const users = userIDs.length === 0
      ? []
      : await tx.run(SELECT.from(USERS).columns('ID', 'email').where({ ID: { in: userIDs } }).limit(MAX_ADMINISTRATION_PAGE_SKIP + MAX_PAGE_SIZE))
    userByID = new Map(users.map(row => [row.ID, row]))
  }
  return rows.map(row => ({
    createdAt: row.createdAt,
    ID: row.ID,
    value: toAdministrationDeliverySummary(
      row,
      deliveryType,
      maxAttempts,
      requestByID.get(row.onboardingRequest_ID),
      readAt,
      userByID.get(row.recipient_ID)
    )
  }))
}

function filterAdministrationDeliveries (entries, query) {
  if (!query) return entries
  const normalized = query.toLowerCase()
  return entries.filter(entry => [
    entry.value.deliveryID,
    entry.value.deliveryType,
    entry.value.eventType,
    entry.value.recipientDisplay
  ].some(value => String(value || '').toLowerCase().includes(normalized)))
}

function compareAdministrationDeliveries (left, right) {
  const leftTime = Date.parse(left.createdAt || '')
  const rightTime = Date.parse(right.createdAt || '')
  const timestampOrder = (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0)
  return timestampOrder || String(right.ID || '').localeCompare(String(left.ID || ''))
}

async function searchAccessOperations (req, dependencies) {
  const tx = cds.tx(req)
  await dependencies.authorize(req, tx)
  const { skip, top } = clampPage(req.data?.skip, req.data?.top)
  const state = optionalCode(req.data?.state, 'INVALID_OPERATION_STATE')
  const operationType = optionalCode(req.data?.operationType, 'INVALID_OPERATION_TYPE')
  const selection = SELECT.from(OPERATIONS)
    .columns(
      'ID',
      'onboardingRequest_ID',
      'operationType',
      'state',
      'requestedBy_ID',
      'attemptCount',
      'leasedAt',
      'completedAt',
      'safeResultCode',
      'safeResultSummary',
      'expectedVersion',
      'createdAt'
    )
    .orderBy('createdAt desc', 'ID desc')
    .limit(top, skip)
  if (state) selection.where({ state })
  if (operationType) selection.where({ operationType })
  const rows = await tx.run(selection)
  return mapOperationSummaries(tx, rows)
}

async function searchAccessAuditEvents (req, dependencies) {
  const tx = cds.tx(req)
  await dependencies.authorize(req, tx)
  const { skip, top } = clampPage(req.data?.skip, req.data?.top)
  const action = optionalCode(req.data?.action, 'INVALID_AUDIT_ACTION')
  const result = optionalCode(req.data?.result, 'INVALID_AUDIT_RESULT')
  const from = optionalTimestamp(req.data?.from, 'INVALID_AUDIT_DATE')
  const to = optionalTimestamp(req.data?.to, 'INVALID_AUDIT_DATE', true)
  if (from && to && Date.parse(from) > Date.parse(to)) {
    throw serviceError(400, 'INVALID_DATE_RANGE', 'The audit date range is invalid.')
  }

  const selection = SELECT.from(AUDIT_EVENTS)
    .columns(
      'ID',
      'operation_ID',
      'onboardingRequest_ID',
      'actor_ID',
      'targetUser_ID',
      'action',
      'result',
      'fromState',
      'toState',
      'correlationId',
      'detailsSummary',
      'createdAt'
    )
    .orderBy('createdAt desc', 'ID desc')
    .limit(top, skip)
  if (action) selection.where({ action })
  if (result) selection.where({ result })
  if (from) selection.where({ createdAt: { '>=': from } })
  if (to) selection.where({ createdAt: { '<=': to } })
  const rows = await tx.run(selection)
  return mapAuditSummaries(tx, rows)
}

async function readAdministrationReadiness (req, dependencies) {
  const tx = cds.tx(req)
  await dependencies.authorize(req, tx)
  const [invitations, accessChanges, operations] = await Promise.all([
    tx.run(SELECT.from(DELIVERIES).columns('status_code', 'lastAttemptAt', 'sentAt').orderBy('createdAt desc', 'ID desc').limit(25)),
    tx.run(SELECT.from(ACCESS_DELIVERIES).columns('status_code', 'lastAttemptAt', 'sentAt').orderBy('createdAt desc', 'ID desc').limit(25)),
    tx.run(SELECT.from(OPERATIONS).columns('state', 'completedAt').orderBy('createdAt desc', 'ID desc').limit(25))
  ])
  return deriveAdministrationReadiness([...invitations, ...accessChanges], operations, Date.now())
}

function deriveAdministrationReadiness (deliveries, operations, now) {
  const hasRecentSent = deliveries.some(row => persistedValue(row, 'status_code') === 'SENT' && isRecentPersistedOutcome(persistedValue(row, 'sentAt'), now))
  const hasRecentFailure = deliveries.some(row => persistedValue(row, 'status_code') === 'FAILED' && isRecentPersistedOutcome(persistedValue(row, 'lastAttemptAt'), now))
  const successful = operations.filter(row => persistedValue(row, 'state') === 'SUCCEEDED' && isRecentPersistedOutcome(persistedValue(row, 'completedAt'), now))
  const lastSuccessful = successful
    .map(row => persistedValue(row, 'completedAt'))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] || null
  return {
    emailDeliveryState: hasRecentSent
      ? 'AVAILABLE'
      : hasRecentFailure
        ? 'UNAVAILABLE'
        : 'UNKNOWN',
    provisioningBrokerState: successful.length > 0
      ? 'RECENT_SUCCESS'
      : operations.length > 0
        ? 'STALE'
        : 'UNKNOWN',
    lastSuccessfulReconciliationAt: lastSuccessful
  }
}

function persistedValue (row, name) {
  return row?.[name] ?? row?.[name.toUpperCase()]
}

function isRecentPersistedOutcome (value, now) {
  const timestamp = Date.parse(value || '')
  return Number.isFinite(timestamp) && timestamp <= now && timestamp >= now - READINESS_WINDOW_MS
}

async function retryOnboardingDelivery (req, dependencies = {}) {
  const deliveryID = normalizeUuid(req.data?.deliveryID)
  if (!deliveryID) throw serviceError(400, 'INVALID_DELIVERY_ID', 'Delivery ID is invalid.')
  const expectedModifiedAt = requiredTimestamp(req.data?.expectedModifiedAt)
  const tx = dependencies.tx || cds.tx(req)
  const administrator = await dependencies.authorize(req, tx)
  const delivery = await tx.run(
    SELECT.one.from(DELIVERIES).columns(
      'ID',
      'onboardingRequest_ID',
      'recipientEmail',
      'templateKey',
      'status_code',
      'attemptCount',
      'lastAttemptAt',
      'sentAt',
      'lastErrorCode',
      'lastErrorSummary',
      'providerMessageId',
      'lockedUntil',
      'lockToken',
      'modifiedAt'
    ).where({ ID: deliveryID })
  )
  if (!delivery) throw serviceError(404, 'DELIVERY_NOT_FOUND', 'Delivery was not found.')
  if (normalizeTimestamp(delivery.modifiedAt) !== expectedModifiedAt) {
    throw serviceError(409, 'DELIVERY_RETRY_CONFLICT', 'The delivery changed. Reload and try again.')
  }
  if (delivery.status_code !== 'FAILED' || !RETRYABLE_DELIVERY_CODES.has(delivery.lastErrorCode)) {
    throw serviceError(409, 'DELIVERY_NOT_RETRYABLE', 'The delivery cannot be retried.')
  }

  const now = req.timestamp instanceof Date ? req.timestamp : new Date(req.timestamp || Date.now())
  const request = await tx.run(
    SELECT.one.from(REQUESTS).columns('ID', 'status_code', 'expiresAt').where({ ID: delivery.onboardingRequest_ID })
  )
  const expiresAt = request?.expiresAt ? Date.parse(request.expiresAt) : NaN
  if (!request || request.status_code !== 'INVITED' || Number.isNaN(expiresAt) || expiresAt <= now.getTime()) {
    throw serviceError(409, 'DELIVERY_NOT_RETRYABLE', 'The invitation is no longer eligible for delivery.')
  }

  const config = (dependencies.getEmailConfig || defaultEmailConfig)()
  const maxAttempts = Number(config?.maxRetryCount) + 1
  if (!Number.isInteger(maxAttempts) || Number(delivery.attemptCount || 0) >= maxAttempts) {
    throw serviceError(409, 'DELIVERY_RETRY_LIMIT_REACHED', 'The delivery retry limit has been reached.')
  }
  const lockedUntil = delivery.lockedUntil ? Date.parse(delivery.lockedUntil) : null
  if (delivery.lockedUntil && (Number.isNaN(lockedUntil) || lockedUntil > now.getTime())) {
    throw serviceError(409, 'DELIVERY_LOCKED', 'The delivery is currently being processed.')
  }

  const changed = await tx.run(
    UPDATE(DELIVERIES).set({
      status_code: 'PENDING',
      nextAttemptAt: now.toISOString(),
      lastErrorCode: null,
      lastErrorSummary: null,
      lockedUntil: null,
      lockToken: null
    }).where({
      ID: delivery.ID,
      status_code: 'FAILED',
      attemptCount: delivery.attemptCount,
      lastErrorCode: delivery.lastErrorCode,
      modifiedAt: delivery.modifiedAt
    })
  )
  if (changed !== 1) throw serviceError(409, 'DELIVERY_RETRY_CONFLICT', 'The delivery changed. Reload and try again.')

  await tx.run(INSERT.into(AUDIT_EVENTS).entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: delivery.onboardingRequest_ID,
    actor_ID: administrator?.ID || null,
    action: 'RETRY_ONBOARDING_DELIVERY',
    result: 'QUEUED',
    fromState: 'FAILED',
    toState: 'PENDING',
    correlationId: cds.utils.uuid(),
    detailsSummary: AUDIT_SUMMARIES.RETRY_ONBOARDING_DELIVERY
  }))

  const schedule = dependencies.schedule || defaultSchedule
  if (typeof schedule === 'function') schedule(req)
  const refreshed = await tx.run(
    SELECT.one.from(DELIVERIES).columns(
      'ID',
      'onboardingRequest_ID',
      'recipientEmail',
      'status_code',
      'attemptCount',
      'nextAttemptAt',
      'lastAttemptAt',
      'sentAt',
      'lastErrorCode',
      'lastErrorSummary',
      'modifiedAt'
    ).where({ ID: delivery.ID })
  )
  return toDeliverySummary(refreshed, maxAttempts, request, now)
}

async function retryUserAccessDelivery (req, dependencies = {}) {
  const tx = dependencies.tx || cds.tx(req)
  const administrator = await dependencies.authorize(req, tx)
  const deliveryID = normalizeUuid(req.data?.deliveryID)
  if (!deliveryID) throw serviceError(400, 'INVALID_DELIVERY_ID', 'Delivery ID is invalid.')
  const expectedModifiedAt = requiredTimestamp(req.data?.expectedModifiedAt)
  const delivery = await tx.run(
    SELECT.one.from(ACCESS_DELIVERIES).columns(
      'ID',
      'targetUser_ID',
      'recipientEmail',
      'eventType',
      'status_code',
      'attemptCount',
      'nextAttemptAt',
      'lastAttemptAt',
      'sentAt',
      'lastErrorCode',
      'lockedUntil',
      'modifiedAt'
    ).where({ ID: deliveryID })
  )
  if (!delivery) throw serviceError(404, 'DELIVERY_NOT_FOUND', 'Delivery was not found.')
  if (normalizeTimestamp(delivery.modifiedAt) !== expectedModifiedAt) {
    throw serviceError(409, 'DELIVERY_RETRY_CONFLICT', 'The delivery changed. Reload and try again.')
  }
  if (delivery.status_code !== 'FAILED' || !RETRYABLE_DELIVERY_CODES.has(delivery.lastErrorCode)) {
    throw serviceError(409, 'DELIVERY_NOT_RETRYABLE', 'The delivery cannot be retried.')
  }

  const maxAttempts = maxAttemptsFrom(dependencies.getEmailConfig)
  if (Number(delivery.attemptCount || 0) >= maxAttempts) {
    throw serviceError(409, 'DELIVERY_RETRY_LIMIT_REACHED', 'The delivery retry limit has been reached.')
  }
  const now = requestTime(req)
  const lockedUntil = delivery.lockedUntil ? Date.parse(delivery.lockedUntil) : null
  if (delivery.lockedUntil && (!Number.isFinite(lockedUntil) || lockedUntil > now.getTime())) {
    throw serviceError(409, 'DELIVERY_LOCKED', 'The delivery is currently being processed.')
  }

  const changed = await tx.run(
    UPDATE(ACCESS_DELIVERIES).set({
      status_code: 'PENDING',
      nextAttemptAt: now.toISOString(),
      lastErrorCode: null,
      lastErrorSummary: null,
      lockedUntil: null,
      lockToken: null
    }).where({
      ID: delivery.ID,
      status_code: 'FAILED',
      attemptCount: delivery.attemptCount,
      lastErrorCode: delivery.lastErrorCode,
      modifiedAt: delivery.modifiedAt
    })
  )
  if (changed !== 1) throw serviceError(409, 'DELIVERY_RETRY_CONFLICT', 'The delivery changed. Reload and try again.')

  await tx.run(INSERT.into(AUDIT_EVENTS).entries({
    ID: cds.utils.uuid(),
    actor_ID: administrator?.ID || null,
    targetUser_ID: delivery.targetUser_ID,
    action: 'RETRY_ACCESS_DELIVERY',
    result: 'QUEUED',
    fromState: 'FAILED',
    toState: 'PENDING',
    correlationId: cds.utils.uuid(),
    detailsSummary: AUDIT_SUMMARIES.RETRY_ACCESS_DELIVERY
  }))

  const schedule = dependencies.schedule || defaultSchedule
  if (typeof schedule === 'function') schedule(req)
  const refreshed = await tx.run(
    SELECT.one.from(ACCESS_DELIVERIES).columns(
      'ID',
      'recipientEmail',
      'eventType',
      'status_code',
      'attemptCount',
      'nextAttemptAt',
      'lastAttemptAt',
      'sentAt',
      'lastErrorCode',
      'lockedUntil',
      'modifiedAt'
    ).where({ ID: delivery.ID })
  )
  return toAdministrationDeliverySummary(refreshed, 'ACCESS_CHANGE', maxAttempts, null, now)
}

async function mapOperationSummaries (tx, rows) {
  if (rows.length === 0) return []
  const requestIDs = [...new Set(rows.map(row => row.onboardingRequest_ID).filter(Boolean))]
  const requests = await tx.run(SELECT.from(REQUESTS).columns('ID', 'activeUser_ID', 'targetEmailNormalized', 'provisioningVersion', 'status_code', 'lastErrorCode').where({ ID: { in: requestIDs } }))
  const requestByID = new Map(requests.map(row => [row.ID, row]))
  const userIDs = [...new Set(rows.flatMap(row => [row.requestedBy_ID, requestByID.get(row.onboardingRequest_ID)?.activeUser_ID]).filter(Boolean))]
  const users = userIDs.length === 0 ? [] : await tx.run(SELECT.from(USERS).columns('ID', 'displayName').where({ ID: { in: userIDs } }))
  const userByID = new Map(users.map(row => [row.ID, row]))
  return rows.map(row => {
    const request = requestByID.get(row.onboardingRequest_ID)
    const regularRetryEligible = row.state === 'RETRYABLE_FAILURE' && request?.status_code === 'RETRYABLE_FAILURE'
    const legacyRetryEligible = row.state === 'BLOCKED_MANUAL_REVIEW' &&
      request?.status_code === 'BLOCKED_MANUAL_REVIEW' &&
      row.safeResultCode === 'PROVIDER_REQUEST_INVALID' &&
      request.lastErrorCode === 'PROVIDER_REQUEST_INVALID' &&
      row.attemptCount === 4
    return {
      operationID: row.ID,
      requestID: row.onboardingRequest_ID,
      operationType: row.operationType,
      state: row.state,
      attemptCount: Number(row.attemptCount || 0),
      createdAt: row.createdAt || null,
      startedAt: row.leasedAt || null,
      completedAt: row.completedAt || null,
      safeResultCode: safeCode(row.safeResultCode),
      safeResultSummary: operationSummary(row.safeResultCode),
      requestedByDisplay: safeDisplay(userByID.get(row.requestedBy_ID)?.displayName),
      targetDisplay: userByID.has(request?.activeUser_ID)
        ? safeDisplay(userByID.get(request.activeUser_ID).displayName)
        : maskRecipient(request?.targetEmailNormalized),
      expectedVersion: Number.isInteger(request?.provisioningVersion) ? request.provisioningVersion : row.expectedVersion,
      canRetry: regularRetryEligible || legacyRetryEligible,
      canReconcile: row.state === 'BLOCKED_MANUAL_REVIEW' &&
        request?.status_code === 'BLOCKED_MANUAL_REVIEW' &&
        row.safeResultCode === 'AMBIGUOUS_PROVIDER_OUTCOME'
    }
  })
}

async function mapAuditSummaries (tx, rows) {
  if (rows.length === 0) return []
  const requestIDs = [...new Set(rows.map(row => row.onboardingRequest_ID).filter(Boolean))]
  const requests = requestIDs.length === 0 ? [] : await tx.run(SELECT.from(REQUESTS).columns('ID', 'targetEmailNormalized').where({ ID: { in: requestIDs } }))
  const requestByID = new Map(requests.map(row => [row.ID, row]))
  const userIDs = [...new Set(rows.flatMap(row => [row.actor_ID, row.targetUser_ID]).filter(Boolean))]
  const users = userIDs.length === 0 ? [] : await tx.run(SELECT.from(USERS).columns('ID', 'displayName').where({ ID: { in: userIDs } }))
  const userByID = new Map(users.map(row => [row.ID, row]))
  return rows.map(row => ({
    eventID: row.ID,
    requestID: row.onboardingRequest_ID || null,
    operationID: row.operation_ID || null,
    action: safeCode(row.action),
    result: safeCode(row.result),
    fromState: safeCode(row.fromState),
    toState: safeCode(row.toState),
    actorDisplay: safeDisplay(userByID.get(row.actor_ID)?.displayName),
    targetDisplay: row.targetUser_ID
      ? safeDisplay(userByID.get(row.targetUser_ID)?.displayName)
      : maskRecipient(requestByID.get(row.onboardingRequest_ID)?.targetEmailNormalized),
    occurredAt: row.createdAt || null,
    detailsSummary: auditSummary(row.action, row.result),
    correlationFingerprint: correlationFingerprint(row.correlationId)
  }))
}

function toDeliverySummary (row, maxAttempts = 3, request, readAt = new Date()) {
  return {
    deliveryID: row.ID,
    requestID: row.onboardingRequest_ID,
    recipientDisplay: maskRecipient(row.recipientEmail),
    status: safeCode(row.status_code),
    attemptCount: Number(row.attemptCount || 0),
    nextAttemptAt: row.nextAttemptAt || null,
    lastAttemptAt: row.lastAttemptAt || null,
    sentAt: row.sentAt || null,
    safeErrorCode: row.lastErrorCode ? safeCode(row.lastErrorCode) : null,
    safeErrorSummary: row.lastErrorCode ? deliverySummary(row.lastErrorCode) : null,
    modifiedAt: row.modifiedAt || null,
    canRetry: canRetryDelivery(row, maxAttempts, request, readAt)
  }
}

function toAdministrationDeliverySummary (row, deliveryType, maxAttempts = 3, request, readAt = new Date(), recipient) {
  const invitation = deliveryType === 'INVITATION'
  const digest = deliveryType === 'DIGEST'
  return {
    deliveryID: row.ID,
    deliveryType,
    eventType: invitation ? 'INVITATION' : digest ? 'DIGEST' : safeCode(row.eventType),
    recipientDisplay: maskRecipient(digest ? recipient?.email : row.recipientEmail),
    status: safeCode(row.status_code),
    attemptCount: Number(row.attemptCount || 0),
    nextAttemptAt: row.nextAttemptAt || null,
    lastAttemptAt: row.lastAttemptAt || null,
    sentAt: row.sentAt || null,
    errorCode: row.lastErrorCode ? safeCode(row.lastErrorCode) : null,
    errorSummary: row.lastErrorCode ? deliverySummary(row.lastErrorCode) : null,
    canRetry: digest
      ? false
      : invitation
      ? canRetryDelivery(row, maxAttempts, request, readAt)
      : canRetryAccessDelivery(row, maxAttempts, readAt),
    modifiedAt: row.modifiedAt || null
  }
}

function canRetryDelivery (row, maxAttempts, request, readAt) {
  const expiresAt = request?.expiresAt ? Date.parse(request.expiresAt) : NaN
  return row.status_code === 'FAILED' &&
    RETRYABLE_DELIVERY_CODES.has(row.lastErrorCode) &&
    Number(row.attemptCount || 0) < maxAttempts &&
    (!row.lockedUntil || Date.parse(row.lockedUntil) <= readAt.getTime()) &&
    request?.status_code === 'INVITED' &&
    Number.isFinite(expiresAt) &&
    expiresAt > readAt.getTime()
}

function canRetryAccessDelivery (row, maxAttempts, readAt) {
  const lockedUntil = row.lockedUntil ? Date.parse(row.lockedUntil) : null
  return row.status_code === 'FAILED' &&
    RETRYABLE_DELIVERY_CODES.has(row.lastErrorCode) &&
    Number(row.attemptCount || 0) < maxAttempts &&
    (!row.lockedUntil || (Number.isFinite(lockedUntil) && lockedUntil <= readAt.getTime()))
}

function requestTime (req) {
  const readAt = req.timestamp instanceof Date ? req.timestamp : new Date(req.timestamp || Date.now())
  return Number.isNaN(readAt.getTime()) ? new Date() : readAt
}

function maxAttemptsFrom (getConfig) {
  const maxRetryCount = Number((getConfig || defaultEmailConfig)()?.maxRetryCount)
  return Number.isInteger(maxRetryCount) && maxRetryCount >= 0 ? maxRetryCount + 1 : 3
}

function clampPage (skip, top) {
  const parsedSkip = Number(skip)
  const parsedTop = Number(top)
  return {
    skip: Number.isInteger(parsedSkip) && parsedSkip >= 0 ? Math.min(parsedSkip, MAX_PAGE_SKIP) : 0,
    top: Number.isInteger(parsedTop) && parsedTop > 0 ? Math.min(parsedTop, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE
  }
}

function clampAdministrationPage (skip, top) {
  const parsedSkip = Number(skip)
  const parsedTop = Number(top)
  return {
    skip: Number.isInteger(parsedSkip) ? Math.min(Math.max(parsedSkip, 0), MAX_ADMINISTRATION_PAGE_SKIP) : 0,
    top: Number.isInteger(parsedTop) ? Math.min(Math.max(parsedTop, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE
  }
}

function administrationDeliveryType (value) {
  const deliveryType = optionalCode(value, 'INVALID_DELIVERY_TYPE') || 'ALL'
  if (!['ALL', 'INVITATION', 'ACCESS_CHANGE', 'DIGEST'].includes(deliveryType)) {
    throw serviceError(400, 'INVALID_DELIVERY_TYPE', 'Delivery type is invalid.')
  }
  return deliveryType
}

function maskRecipient (value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const at = normalized.lastIndexOf('@')
  if (at <= 0 || at === normalized.length - 1) return 'Hidden recipient'
  return `${normalized.slice(0, 1)}***@${normalized.slice(at + 1)}`
}

function correlationFingerprint (value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12)
}

function optionalCode (value, errorCode) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^[A-Za-z0-9_]{1,80}$/.test(value.trim())) {
    throw serviceError(400, errorCode, 'The filter value is invalid.')
  }
  return value.trim().toUpperCase()
}

function normalizeQuery (value) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string') throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  const query = value.trim().toLowerCase()
  if (query.length > 255 || /[<>'"\r\n]/.test(query)) {
    throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  }
  return query
}

function requiredTimestamp (value) {
  const result = optionalTimestamp(value, 'INVALID_DELIVERY_CONCURRENCY')
  if (!result) throw serviceError(400, 'INVALID_DELIVERY_CONCURRENCY', 'A delivery version is required.')
  return result
}

function optionalTimestamp (value, errorCode, endOfDay = false) {
  if (value === undefined || value === null || value === '') return null
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) throw serviceError(400, errorCode, 'The timestamp is invalid.')
  if (endOfDay && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    timestamp.setUTCHours(23, 59, 59, 999)
  }
  return timestamp.toISOString()
}

function normalizeTimestamp (value) {
  if (value === undefined || value === null || value === '') return null
  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString()
}

function normalizeUuid (value) {
  const uuid = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(uuid) ? uuid : null
}

function safeCode (value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z0-9_]{1,80}$/.test(code) ? code : 'UNAVAILABLE'
}

function deliverySummary (code) {
  return DELIVERY_ERROR_SUMMARIES[code] || 'Email delivery failed.'
}

function operationSummary (code) {
  return OPERATION_RESULT_SUMMARIES[code] || 'Provisioning result is unavailable.'
}

function auditSummary (action, result) {
  return AUDIT_SUMMARIES[action] || OPERATION_RESULT_SUMMARIES[result] || 'Administration event recorded.'
}

function safeDisplay (value) {
  const display = typeof value === 'string' ? value.replace(/[\r\n]/g, ' ').trim().slice(0, 120) : ''
  if (display.includes('@')) return maskRecipient(display)
  return display || 'Unknown user'
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  registerOperationsAuditHandlers,
  searchOnboardingDeliveries,
  searchAdministrationDeliveries,
  searchAccessOperations,
  searchAccessAuditEvents,
  readAdministrationReadiness,
  deriveAdministrationReadiness,
  retryOnboardingDelivery,
  retryUserAccessDelivery,
  clampPage,
  clampAdministrationPage,
  maskRecipient,
  correlationFingerprint,
  toDeliverySummary,
  toAdministrationDeliverySummary
}
