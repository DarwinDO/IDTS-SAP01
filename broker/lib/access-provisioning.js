'use strict'

const BUSINESS_ROLE_COLLECTIONS = Object.freeze({
  PM: 'IDTS_PM',
  TESTER: 'IDTS_TESTER',
  DEVELOPER: 'IDTS_DEVELOPER'
})
const USER_ADMIN_ROLE_COLLECTION = 'IDTS_USER_ADMIN'
const IDTS_BUSINESS_COLLECTIONS = new Set(Object.values(BUSINESS_ROLE_COLLECTIONS))
const IDTS_ACCESS_COLLECTIONS = new Set([...IDTS_BUSINESS_COLLECTIONS, USER_ADMIN_ROLE_COLLECTION])

function requestedRoleCollections ({ requestedRole, userAdminRequested }) {
  const role = String(requestedRole || '').trim().toUpperCase()
  const businessCollection = BUSINESS_ROLE_COLLECTIONS[role]
  if (!businessCollection) throw brokerError('INVALID_BUSINESS_ROLE', 'Requested business role is invalid.')
  if (userAdminRequested === true && role !== 'PM') {
    throw brokerError('USER_ADMIN_REQUIRES_PM', 'UserAdmin can only be requested with PM.')
  }
  return userAdminRequested === true
    ? [businessCollection, USER_ADMIN_ROLE_COLLECTION]
    : [businessCollection]
}

async function executeAccessChange ({ action, requestedRole, userAdminRequested, provider }) {
  const normalizedAction = String(action || '').trim().toUpperCase()
  if (!['ASSIGN', 'CHANGE_ROLE', 'REVOKE', 'REACTIVATE'].includes(normalizedAction)) {
    throw brokerError('INVALID_PROVISIONING_ACTION', 'Provisioning action is invalid.')
  }
  assertProvider(provider, normalizedAction === 'REACTIVATE')

  const desired = requestedRoleCollections({ requestedRole, userAdminRequested })
  const before = unique(await provider.listRoleCollections())
  if (normalizedAction === 'REACTIVATE') {
    assertValidUserAdminOverlay(before)
    const currentIDTS = before.filter(collection => IDTS_ACCESS_COLLECTIONS.has(collection))
    if (currentIDTS.length !== desired.length || desired.some(collection => !currentIDTS.includes(collection))) {
      throw brokerError('PROVISIONING_READBACK_MISMATCH', 'The current access state does not match the requested IDTS access.')
    }
    return { action: normalizedAction, changed: [], finalRoleCollections: desired }
  }
  if (normalizedAction !== 'REVOKE') {
    assertValidUserAdminOverlay(before)
    if (normalizedAction !== 'CHANGE_ROLE') assertNoConflictingBusinessRole(before, desired[0])
  }

  if (normalizedAction === 'REVOKE') {
    const changed = []
    const revokeOrder = [USER_ADMIN_ROLE_COLLECTION, ...Object.values(BUSINESS_ROLE_COLLECTIONS)]
    for (const collection of revokeOrder) {
      if (!before.includes(collection)) continue
      await provider.unassignRoleCollection(collection)
      changed.push(collection)
    }
    const after = unique(await provider.listRoleCollections())
    if (after.some(collection => IDTS_ACCESS_COLLECTIONS.has(collection))) {
      throw brokerError('PROVISIONING_READBACK_MISMATCH', 'Access removal could not be verified.')
    }
    return { action: normalizedAction, changed, finalRoleCollections: [] }
  }

  const changed = []
  const removed = []
  try {
    if (normalizedAction === 'CHANGE_ROLE') {
      const existingBusiness = before.filter(collection => IDTS_BUSINESS_COLLECTIONS.has(collection))
      if (existingBusiness.length > 1) throw brokerError('MULTIPLE_BUSINESS_ROLES', 'The account has conflicting IDTS business access.')
      for (const collection of [USER_ADMIN_ROLE_COLLECTION, ...existingBusiness]) {
        if (!before.includes(collection) || desired.includes(collection)) continue
        await provider.unassignRoleCollection(collection)
        removed.push(collection)
      }
    }
    for (const collection of desired) {
      if (before.includes(collection)) continue
      await provider.assignRoleCollection(collection)
      changed.push(collection)
    }
    const after = unique(await provider.listRoleCollections())
    if (desired.some(collection => !after.includes(collection))) {
      throw brokerError('PROVISIONING_READBACK_MISMATCH', 'Access assignment could not be verified.')
    }
    assertNoConflictingBusinessRole(after, desired[0])
    assertValidUserAdminOverlay(after)
    return { action: normalizedAction, changed, finalRoleCollections: desired }
  } catch (error) {
    await compensateAccessChange(provider, changed, removed)
    throw error
  }
}

function safeProvisioningFailure (error) {
  const known = {
    PROVIDER_REQUEST_INVALID: ['The access provider rejected the request format.', false],
    PROVIDER_DENIED: ['The access provider rejected the requested change.', false],
    PROVIDER_AUTHENTICATION_FAILED: ['The access provider could not authenticate the broker credential.', false],
    PROVIDER_FORBIDDEN: ['The access provider denied the requested change.', false],
    PROVIDER_SCOPE_MISSING: ['The broker credential is missing a required provider scope.', false],
    PROVIDER_CONFLICT: ['The access provider reported a state conflict; reconciliation is required.', false],
    PROVIDER_RATE_LIMITED: ['The access provider temporarily rate-limited the request.', true],
    PROVIDER_UPSTREAM_5XX: ['The access provider is temporarily unavailable.', true],
    PROVIDER_TIMEOUT: ['The access provider did not respond before the timeout.', true],
    PROVIDER_NETWORK_FAILURE: ['The access provider network request failed.', true],
    PROVIDER_RESPONSE_INVALID: ['The access provider returned an invalid response.', false],
    PROVIDER_UNAVAILABLE: ['The access provider is temporarily unavailable.', true],
    PROVIDER_RESOURCE_NOT_FOUND: ['The required SAP access resource is unavailable.', false],
    PROVIDER_IDENTITY_UNVERIFIED: ['The target SAP identity could not be verified.', false],
    PROVIDER_GROUP_MISSING: ['The required IDTS role collection is unavailable.', false],
    PROVIDER_GROUP_AMBIGUOUS: ['The required IDTS role collection is ambiguous.', false],
    PROVISIONING_READBACK_MISMATCH: ['The access provider result could not be verified.', false],
    MULTIPLE_BUSINESS_ROLES: ['The account has conflicting IDTS business access.', false],
    USER_ADMIN_REQUIRES_PM: ['The UserAdmin capability requires the PM business role.', false]
  }
  const code = typeof error?.code === 'string' && known[error.code]
    ? error.code
    : 'PROVISIONING_FAILED'
  const [summary, retryable] = known[code] || ['The access change could not be completed.', false]
  return { code, summary, retryable }
}

async function compensateAccessChange (provider, changed, removed) {
  for (const collection of [...changed].reverse()) {
    try {
      await provider.unassignRoleCollection(collection)
    } catch {
      // Reconciliation will observe and safely remediate any provider drift.
    }
  }
  for (const collection of removed) {
    try {
      await provider.assignRoleCollection(collection)
    } catch {
      // Reconciliation will observe and safely remediate any provider drift.
    }
  }
}

function assertNoConflictingBusinessRole (collections, expectedBusinessCollection) {
  const assignedBusinessCollections = collections.filter(collection => IDTS_BUSINESS_COLLECTIONS.has(collection))
  const conflicts = assignedBusinessCollections.filter(collection => collection !== expectedBusinessCollection)
  if (conflicts.length > 0 || assignedBusinessCollections.length > 1) {
    throw brokerError('MULTIPLE_BUSINESS_ROLES', 'The account has conflicting IDTS business access.')
  }
}

function assertValidUserAdminOverlay (collections) {
  if (collections.includes(USER_ADMIN_ROLE_COLLECTION) && !collections.includes(BUSINESS_ROLE_COLLECTIONS.PM)) {
    throw brokerError('USER_ADMIN_REQUIRES_PM', 'UserAdmin can only be assigned together with PM.')
  }
}

function assertProvider (provider, readOnly = false) {
  const methods = readOnly
    ? ['listRoleCollections']
    : ['listRoleCollections', 'assignRoleCollection', 'unassignRoleCollection']
  for (const method of methods) {
    if (typeof provider?.[method] !== 'function') {
      throw brokerError('PROVIDER_UNAVAILABLE', 'The access provider is unavailable.')
    }
  }
}

function unique (values) {
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) {
    throw brokerError('PROVISIONING_READBACK_MISMATCH', 'The access provider result could not be verified.')
  }
  return [...new Set(values)]
}

function brokerError (code, message) {
  return Object.assign(new Error(message), { code })
}

module.exports = {
  BUSINESS_ROLE_COLLECTIONS,
  USER_ADMIN_ROLE_COLLECTION,
  executeAccessChange,
  requestedRoleCollections,
  safeProvisioningFailure
}
