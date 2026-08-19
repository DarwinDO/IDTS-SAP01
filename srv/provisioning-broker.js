'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const BUSINESS_ROLES = ['PM', 'TESTER', 'DEVELOPER']
const SUCCESS_RESULTS = ['APPLIED', 'NOOP_ALREADY_DESIRED']
const FAILURE_RESULTS = ['CONFLICT', 'RETRYABLE_FAILURE', 'PERMANENT_FAILURE']

class ProvisioningBrokerService extends cds.ApplicationService {
  async init () {
    this.on('claimNextAccessOperation', req => claimNextAccessOperation(req))
    this.on('completeAccessOperation', req => completeAccessOperation(req))
    return super.init()
  }
}

async function claimNextAccessOperation (req) {
  assertProvisioningBroker(req)
  const tx = cds.tx(req)
  await blockExpiredLeases(tx, req.timestamp || new Date())
  const operation = await tx.run(
    SELECT.one.from('idts.cap.UserAccessOperations')
      .where({ state: 'PENDING' })
      .orderBy('createdAt asc')
  )
  if (!operation) return null
  const request = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: operation.onboardingRequest_ID })
  )
  assertOperationMatchesRequest(operation, request)
  if (request.status_code !== queuedStateFor(operation.operationType)) {
    throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access request is not queued for this operation.')
  }
  assertVerifiedIdentity(request)

  const leaseToken = crypto.randomBytes(32).toString('hex')
  const now = req.timestamp || new Date()
  const processingState = processingStateFor(operation.operationType)
  const claimed = await tx.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: 'PROCESSING',
    leasedAt: now.toISOString(),
    leaseExpiresAt: new Date(now.getTime() + 5 * 60000).toISOString(),
    leaseTokenHash: sha256(leaseToken),
    attemptCount: operation.attemptCount + 1,
    nextAttemptAt: null
  }).where({ ID: operation.ID, state: 'PENDING' }))
  if (claimed !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access operation changed.')
  const requestClaimed = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set({ status_code: processingState }).where({
    ID: request.ID,
    provisioningVersion: operation.expectedVersion
  }))
  if (requestClaimed !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access request changed.')

  return {
    operationID: operation.ID,
    operationType: operation.operationType,
    targetEmail: request.identityEmailNormalized,
    identityOrigin: request.identityOrigin,
    identityIssuer: request.identityIssuer,
    identitySubject: request.identitySubject,
    identityPlatformUserId: request.identityPlatformUserId,
    desiredBusinessRole: operation.desiredRole_code,
    desiredUserAdmin: operation.desiredUserAdmin === true,
    idempotencyKey: operation.idempotencyKey,
    expectedVersion: operation.expectedVersion,
    leaseToken
  }
}

async function blockExpiredLeases (tx, now) {
  const nowIso = now.toISOString()
  const expired = await tx.run(
    SELECT.from('idts.cap.UserAccessOperations')
      .where(`state = 'PROCESSING' and leaseExpiresAt < '${nowIso}'`)
      .orderBy('leaseExpiresAt asc')
      .limit(20)
  )
  for (const operation of expired) {
    const reconciliationCorrelationId = cds.utils.uuid()
    const request = await tx.run(
      SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: operation.onboardingRequest_ID })
    )
    if (!request || request.provisioningVersion !== operation.expectedVersion ||
        request.status_code !== processingStateFor(operation.operationType)) {
      throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'Expired operation state cannot be reconciled.')
    }
    const operationUpdated = await tx.run(UPDATE('idts.cap.UserAccessOperations').set({
      state: 'BLOCKED_MANUAL_REVIEW',
      completedAt: nowIso,
      nextAttemptAt: null,
      leaseTokenHash: null,
      leaseExpiresAt: null,
      correlationId: reconciliationCorrelationId,
      safeResultCode: 'AMBIGUOUS_PROVIDER_OUTCOME',
      safeResultSummary: safeSummaryFor('AMBIGUOUS_PROVIDER_OUTCOME')
    }).where({
      ID: operation.ID,
      state: 'PROCESSING',
      leaseTokenHash: operation.leaseTokenHash
    }))
    if (operationUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'Expired operation changed during reconciliation.')
    const requestUpdated = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'BLOCKED_MANUAL_REVIEW',
      lastErrorCode: 'AMBIGUOUS_PROVIDER_OUTCOME',
      lastErrorSummary: safeSummaryFor('AMBIGUOUS_PROVIDER_OUTCOME')
    }).where({
      ID: request.ID,
      status_code: request.status_code,
      provisioningVersion: operation.expectedVersion
    }))
    if (requestUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'Expired access request changed during reconciliation.')
    await appendAudit(tx, { ...operation, correlationId: reconciliationCorrelationId }, request, 'BLOCKED_MANUAL_REVIEW', request.activeUser_ID, 'AMBIGUOUS_PROVIDER_OUTCOME')
  }
}

async function completeAccessOperation (req) {
  assertProvisioningBroker(req)
  const resultCode = String(req.data.resultCode || '').trim().toUpperCase()
  if (![...SUCCESS_RESULTS, ...FAILURE_RESULTS].includes(resultCode)) {
    throw brokerError(400, 'INVALID_PROVIDER_RESULT', 'Provider result is invalid.')
  }
  const safeCode = safeResultCode(req.data.safeCode)
  const providerCorrelationHash = optionalHash(req.data.providerCorrelationHash)
  const tx = cds.tx(req)
  const operation = await tx.run(
    SELECT.one.from('idts.cap.UserAccessOperations').where({ ID: req.data.operationID })
  )
  assertValidLease(operation, req.data.leaseToken, req.timestamp || new Date())
  const request = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: operation.onboardingRequest_ID })
  )
  assertOperationMatchesRequest(operation, request)
  if (request.status_code !== processingStateFor(operation.operationType)) {
    throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access request is not processing this operation.')
  }

  if (!SUCCESS_RESULTS.includes(resultCode)) {
    return completeFailure(tx, {
      operation,
      request,
      resultCode,
      safeCode,
      providerCorrelationHash,
      now: req.timestamp || new Date()
    })
  }
  return completeSuccess(tx, { operation, request, resultCode, safeCode, providerCorrelationHash, now: req.timestamp || new Date() })
}

async function completeSuccess (tx, options) {
  const { operation, request } = options
  let userID = request.activeUser_ID || null
  if (operation.operationType === 'PROVISION') {
    const collision = await tx.run(
      SELECT.one.from('idts.cap.Users').columns('ID').where({ externalIdentityKeyHash: request.identityKeyHash })
    )
    const emailCollision = (await tx.run(SELECT.from('idts.cap.Users').columns('ID', 'email')))
      .some(user => normalizedEmail(user.email) === request.targetEmailNormalized)
    if (collision || emailCollision) {
      return completeProviderConflict(tx, options, 'IDENTITY_RECONCILIATION_REQUIRED')
    }
    userID = cds.utils.uuid()
    await tx.run(INSERT.into('idts.cap.Users').entries({
      ID: userID,
      displayName: request.targetEmailNormalized,
      email: request.targetEmailNormalized,
      role_code: operation.desiredRole_code,
      externalIdentityOrigin: request.identityOrigin,
      externalIdentityIssuer: request.identityIssuer,
      externalIdentitySubject: request.identitySubject,
      externalIdentityKeyHash: request.identityKeyHash,
      active: true
    }))
    await alignDeveloperProfile(tx, userID, operation.desiredRole_code, request, operation)
  } else if (operation.operationType === 'CHANGE_ROLE') {
    if (!userID) throw brokerError(409, 'ACTIVE_ACCESS_NOT_RECONCILED', 'Active access is not reconciled.')
    await tx.run(UPDATE('idts.cap.Users').set({ role_code: operation.desiredRole_code, active: true }).where({ ID: userID }))
    await alignDeveloperProfile(tx, userID, operation.desiredRole_code, request, operation)
  } else if (operation.operationType === 'REVOKE') {
    if (!userID) throw brokerError(409, 'ACTIVE_ACCESS_NOT_RECONCILED', 'Active access is not reconciled.')
    await tx.run(UPDATE('idts.cap.Users').set({ active: false }).where({ ID: userID }))
    await alignDeveloperProfile(tx, userID, null, request, operation)
  }

  const finalState = operation.operationType === 'REVOKE' ? 'REVOKED' : 'ACTIVE'
  const nowIso = options.now.toISOString()
  const requestPatch = {
    status_code: finalState,
    provisioningVersion: request.provisioningVersion + 1,
    activeUser_ID: userID,
    lastErrorCode: null,
    lastErrorSummary: null
  }
  if (operation.operationType === 'PROVISION') requestPatch.provisionedAt = nowIso
  if (operation.operationType === 'REVOKE') requestPatch.revokedAt = nowIso
  const requestUpdated = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set(requestPatch).where({
    ID: request.ID,
    provisioningVersion: operation.expectedVersion
  }))
  if (requestUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access request changed.')
  const operationUpdated = await tx.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: 'SUCCEEDED',
    completedAt: nowIso,
    leaseTokenHash: null,
    leaseExpiresAt: null,
    safeResultCode: options.safeCode,
    safeResultSummary: safeSummaryFor(options.resultCode),
    providerCorrelationHash: options.providerCorrelationHash
  }).where({ ID: operation.ID, state: 'PROCESSING' }))
  if (operationUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access operation changed.')
  await appendAudit(tx, operation, request, finalState, userID, options.resultCode)
  return { operationID: operation.ID, status: finalState }
}

async function completeFailure (tx, options) {
  const retryable = options.resultCode === 'RETRYABLE_FAILURE'
  const finalState = retryable ? 'RETRYABLE_FAILURE' : 'BLOCKED_MANUAL_REVIEW'
  const now = options.now || new Date()
  const operationUpdated = await tx.run(UPDATE('idts.cap.UserAccessOperations').set({
    state: finalState,
    completedAt: now.toISOString(),
    nextAttemptAt: retryable ? new Date(now.getTime() + 60000).toISOString() : null,
    leaseTokenHash: null,
    leaseExpiresAt: null,
    safeResultCode: options.safeCode,
    safeResultSummary: safeSummaryFor(options.resultCode),
    providerCorrelationHash: options.providerCorrelationHash
  }).where({
    ID: options.operation.ID,
    state: 'PROCESSING',
    leaseTokenHash: options.operation.leaseTokenHash
  }))
  if (operationUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access operation changed.')
  const requestUpdated = await tx.run(UPDATE('idts.cap.UserOnboardingRequests').set({
    status_code: finalState,
    lastErrorCode: options.safeCode,
    lastErrorSummary: safeSummaryFor(options.resultCode)
  }).where({ ID: options.request.ID, provisioningVersion: options.operation.expectedVersion }))
  if (requestUpdated !== 1) throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access request changed.')
  await appendAudit(tx, options.operation, options.request, finalState, options.request.activeUser_ID, options.resultCode)
  return { operationID: options.operation.ID, status: finalState }
}

async function completeProviderConflict (tx, options, safeCode) {
  const completed = await completeFailure(tx, {
    ...options,
    resultCode: 'CONFLICT',
    safeCode,
    providerCorrelationHash: options.providerCorrelationHash
  })
  return completed
}

async function alignDeveloperProfile (tx, userID, desiredRole, request, operation) {
  const profile = await tx.run(SELECT.one.from('idts.cap.DeveloperProfiles').where({ user_ID: userID }))
  if (desiredRole === 'DEVELOPER') {
    const desiredResponsibilities = await tx.run(
      SELECT.from('idts.cap.UserOnboardingDeveloperResponsibilities').where({ onboardingRequest_ID: request.ID })
    )
    if (!request.developerAvailabilityStatus_code || !Number.isInteger(request.developerWorkloadLimit) ||
        request.developerWorkloadLimit < 1 || desiredResponsibilities.length === 0) {
      throw brokerError(409, 'DEVELOPER_PROFILE_INCOMPLETE', 'Developer profile is incomplete.')
    }
    let profileID
    if (profile) {
      profileID = profile.ID
      await tx.run(UPDATE('idts.cap.DeveloperProfiles').set({
        availabilityStatus_code: request.developerAvailabilityStatus_code,
        workloadLimit: request.developerWorkloadLimit,
        administrationVersion: (profile.administrationVersion || 0) + 1,
        active: true
      }).where({ ID: profile.ID }))
      await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_PROFILE_UPDATED')
    } else {
      profileID = cds.utils.uuid()
      await tx.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
        ID: profileID,
        user_ID: userID,
        availabilityStatus_code: request.developerAvailabilityStatus_code,
        workloadLimit: request.developerWorkloadLimit,
        administrationVersion: 0,
        active: true
      }))
      await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_PROFILE_CREATED')
    }
    await materializeDeveloperResponsibilities(tx, profileID, desiredResponsibilities, operation, request, userID)
  } else if (profile?.active) {
    await tx.run(UPDATE('idts.cap.DeveloperProfiles').set({ active: false }).where({ ID: profile.ID }))
    await tx.run(UPDATE('idts.cap.DeveloperResponsibilities').set({ active: false }).where({
      developerProfile_ID: profile.ID,
      active: true
    }))
    await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_PROFILE_DEACTIVATED')
  }
}

async function materializeDeveloperResponsibilities (tx, profileID, desired, operation, request, userID) {
  const existing = await tx.run(SELECT.from('idts.cap.DeveloperResponsibilities').where({ developerProfile_ID: profileID }))
  const desiredTuples = new Set()
  for (const row of desired) {
    const tuple = responsibilityTuple(row.componentCategory_ID, row.sapModule_ID)
    desiredTuples.add(tuple)
    const current = existing.find(item => responsibilityTuple(item.componentCategory_ID, item.sapModule_ID) === tuple)
    if (current) {
      await tx.run(UPDATE('idts.cap.DeveloperResponsibilities').set({
        responsibilityLevel_code: row.responsibilityLevel_code,
        active: true
      }).where({ ID: current.ID }))
      await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_RESPONSIBILITY_UPDATED')
    } else {
      await tx.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
        ID: cds.utils.uuid(),
        developerProfile_ID: profileID,
        componentCategory_ID: row.componentCategory_ID,
        sapModule_ID: row.sapModule_ID,
        responsibilityLevel_code: row.responsibilityLevel_code,
        active: true
      }))
      await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_RESPONSIBILITY_ADDED')
    }
  }
  for (const row of existing.filter(item => item.active && !desiredTuples.has(responsibilityTuple(item.componentCategory_ID, item.sapModule_ID)))) {
    await tx.run(UPDATE('idts.cap.DeveloperResponsibilities').set({ active: false }).where({ ID: row.ID, active: true }))
    await appendDeveloperAudit(tx, operation, request, userID, 'DEVELOPER_RESPONSIBILITY_DEACTIVATED')
  }
}

async function appendDeveloperAudit (tx, operation, request, userID, action) {
  await tx.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: cds.utils.uuid(),
    operation_ID: operation.ID,
    onboardingRequest_ID: request.ID,
    actor_ID: operation.requestedBy_ID,
    targetUser_ID: userID,
    action,
    result: 'APPLIED',
    fromState: request.status_code,
    toState: request.status_code,
    correlationId: cds.utils.uuid(),
    detailsSummary: 'Developer profile materialized after provider verification.'
  }))
}

function responsibilityTuple (componentCategoryID, sapModuleID) {
  return `${componentCategoryID}|${sapModuleID || 'ANY'}`
}

async function appendAudit (tx, operation, request, toState, userID, result) {
  await tx.run(INSERT.into('idts.cap.UserIdentityAuditEvents').entries({
    ID: cds.utils.uuid(),
    operation_ID: operation.ID,
    onboardingRequest_ID: request.ID,
    actor_ID: operation.requestedBy_ID,
    targetUser_ID: userID || null,
    action: operation.operationType,
    result,
    fromState: request.status_code,
    toState,
    correlationId: operation.correlationId,
    detailsSummary: safeSummaryFor(result)
  }))
}

function assertProvisioningBroker (req) {
  const businessRoles = BUSINESS_ROLES.filter(role => req?.user?.is?.(role))
  if (!isNativeXsuaaRuntime() || !req?.user?.is?.('ProvisioningBroker') || req?.user?.is?.('UserAdmin') || businessRoles.length > 0) {
    throw brokerError(403, 'PROVISIONING_BROKER_REQUIRED', 'Provisioning broker authorization is required.')
  }
}

function isNativeXsuaaRuntime () {
  const auth = cds.env.requires?.auth
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) return false
  return auth.kind === 'xsuaa' && (auth.impl === undefined || auth.impl === null || auth.impl === '')
}

function assertOperationMatchesRequest (operation, request) {
  if (!request || request.provisioningVersion !== operation.expectedVersion ||
      request.requestedRole_code !== operation.desiredRole_code ||
      (request.userAdminRequested === true) !== (operation.desiredUserAdmin === true)) {
    throw brokerError(409, 'ACCESS_OPERATION_CONFLICT', 'The access operation no longer matches the request.')
  }
}

function assertVerifiedIdentity (request) {
  const complete = request &&
    typeof request.identityOrigin === 'string' && request.identityOrigin.length > 0 &&
    typeof request.identityIssuer === 'string' && request.identityIssuer.length > 0 &&
    typeof request.identitySubject === 'string' && request.identitySubject.length > 0 &&
    typeof request.identityPlatformUserId === 'string' && request.identityPlatformUserId.length > 0 &&
    /^[a-f0-9]{64}$/.test(String(request.identityKeyHash || '')) &&
    typeof request.identityEmailNormalized === 'string' && request.identityEmailNormalized.length > 0
  if (!complete) throw brokerError(409, 'IDENTITY_RECONCILIATION_REQUIRED', 'Verified identity is incomplete.')
}

function assertValidLease (operation, leaseToken, now) {
  if (!operation || operation.state !== 'PROCESSING' || !operation.leaseTokenHash ||
      typeof leaseToken !== 'string' || leaseToken.length !== 64 ||
      !safeEqual(operation.leaseTokenHash, sha256(leaseToken)) ||
      new Date(operation.leaseExpiresAt).getTime() <= now.getTime()) {
    throw brokerError(409, 'ACCESS_OPERATION_LEASE_INVALID', 'Access operation lease is invalid.')
  }
}

function processingStateFor (operationType) {
  if (operationType === 'CHANGE_ROLE') return 'ROLE_CHANGING'
  if (operationType === 'REVOKE') return 'REVOKING'
  if (operationType === 'PROVISION') return 'PROVISIONING'
  throw brokerError(400, 'INVALID_PROVISIONING_ACTION', 'Provisioning action is invalid.')
}

function queuedStateFor (operationType) {
  if (operationType === 'CHANGE_ROLE') return 'ROLE_CHANGE_QUEUED'
  if (operationType === 'REVOKE') return 'REVOKE_QUEUED'
  if (operationType === 'PROVISION') return 'PROVISION_QUEUED'
  throw brokerError(400, 'INVALID_PROVISIONING_ACTION', 'Provisioning action is invalid.')
}

function safeResultCode (value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z0-9_]{1,80}$/.test(code) ? code : 'PROVISIONING_RESULT_UNAVAILABLE'
}

function optionalHash (value) {
  if (value === undefined || value === null || value === '') return null
  return /^[a-f0-9]{64}$/.test(String(value)) ? String(value) : null
}

function safeSummaryFor (resultCode) {
  const summaries = {
    APPLIED: 'The requested access change was applied and verified.',
    NOOP_ALREADY_DESIRED: 'The requested access was already present and verified.',
    CONFLICT: 'Provider state conflicts with the requested IDTS access.',
    RETRYABLE_FAILURE: 'The provider is temporarily unavailable; a bounded retry may be requested.',
    PERMANENT_FAILURE: 'The provider rejected the access change; manual review is required.',
    AMBIGUOUS_PROVIDER_OUTCOME: 'The provider outcome is ambiguous; manual reconciliation is required.'
  }
  return summaries[resultCode] || 'Provisioning result is unavailable.'
}

function normalizedEmail (value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function sha256 (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function safeEqual (left, right) {
  const a = Buffer.from(String(left))
  const b = Buffer.from(String(right))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function brokerError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = ProvisioningBrokerService
module.exports.claimNextAccessOperation = claimNextAccessOperation
module.exports.completeAccessOperation = completeAccessOperation
