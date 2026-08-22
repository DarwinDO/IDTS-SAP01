'use strict'

const {
  executeAccessChange,
  safeProvisioningFailure
} = require('./lib/access-provisioning')

async function processOneAccessOperation ({ capClient, providerFactory }) {
  assertClient(capClient)
  if (typeof providerFactory?.forIdentity !== 'function') {
    throw Object.assign(new Error('Provisioning provider is unavailable.'), { code: 'PROVIDER_UNAVAILABLE' })
  }
  const operation = await capClient.claimNextAccessOperation()
  if (!operation) return { processed: false, status: 'IDLE' }

  let provider
  let result
  try {
    provider = providerFactory.forIdentity({
      origin: operation.identityOrigin,
      issuer: operation.identityIssuer,
      email: operation.targetEmail,
      subject: operation.identitySubject,
      platformUserId: operation.identityPlatformUserId
    })
    result = await executeAccessChange({
      action: brokerActionFor(operation.operationType),
      requestedRole: operation.desiredBusinessRole,
      userAdminRequested: operation.desiredUserAdmin,
      provider
    })
  } catch (error) {
    const safe = safeProvisioningFailure(error)
    const completed = await capClient.completeAccessOperation({
      operationID: operation.operationID,
      leaseToken: operation.leaseToken,
      resultCode: safe.retryable ? 'RETRYABLE_FAILURE' : 'PERMANENT_FAILURE',
      safeCode: safe.code,
      providerCorrelationHash: safeProviderCorrelationHash(provider)
    })
    return { processed: true, status: completed.status }
  }

  // Provider state has already been changed and verified. If CAP completion is
  // unavailable, the outcome is ambiguous: propagate it and let lease expiry
  // block for reconciliation. Never rewrite it as a failure or retry blindly.
  const completed = await capClient.completeAccessOperation({
    operationID: operation.operationID,
    leaseToken: operation.leaseToken,
    resultCode: result.changed.length > 0 ? 'APPLIED' : 'NOOP_ALREADY_DESIRED',
    safeCode: 'ROLE_COLLECTIONS_VERIFIED',
    providerCorrelationHash: safeProviderCorrelationHash(provider)
  })
  return { processed: true, status: completed.status }
}

function brokerActionFor (operationType) {
  if (operationType === 'PROVISION') return 'ASSIGN'
  if (operationType === 'LINK_EXISTING') return 'LINK_EXISTING'
  return operationType
}

function assertClient (client) {
  for (const method of ['claimNextAccessOperation', 'completeAccessOperation']) {
    if (typeof client?.[method] !== 'function') {
      throw Object.assign(new Error('Provisioning CAP client is unavailable.'), { code: 'CAP_CLIENT_UNAVAILABLE' })
    }
  }
}

function safeProviderCorrelationHash (provider) {
  const value = typeof provider?.correlationHash === 'string' ? provider.correlationHash : ''
  return /^[a-f0-9]{64}$/.test(value) ? value : null
}

module.exports = { processOneAccessOperation }
