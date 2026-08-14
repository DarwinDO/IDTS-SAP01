'use strict'

const { CONTRACT_ID } = require('./sap-user-management-contract')
const ALLOWED_ROLE_COLLECTIONS = new Set([
  'IDTS_PM',
  'IDTS_TESTER',
  'IDTS_DEVELOPER',
  'IDTS_USER_ADMIN'
])

function createSapAuthorizationProviderFactory ({ enabled = false, mutationContract, apiClient = null }) {
  if (enabled !== true) {
    return Object.freeze({
      forIdentity: () => { throw providerError('PROVIDER_DISABLED') }
    })
  }
  assertContract(mutationContract)

  return Object.freeze({
    forIdentity (rawIdentity) {
      const identity = normalizedIdentity(rawIdentity)
      return Object.freeze({
        correlationHash: null,
        listRoleCollections: async () => mutationContract.listRoleCollections(identity, apiClient),
        assignRoleCollection: async roleCollection => {
          assertAllowedRoleCollection(roleCollection)
          return mutationContract.assignRoleCollection(identity, roleCollection, apiClient)
        },
        unassignRoleCollection: async roleCollection => {
          assertAllowedRoleCollection(roleCollection)
          return mutationContract.unassignRoleCollection(identity, roleCollection, apiClient)
        }
      })
    }
  })
}

function assertContract (contract) {
  if (!contract || contract.contractId !== CONTRACT_ID ||
      typeof contract.listRoleCollections !== 'function' ||
      typeof contract.assignRoleCollection !== 'function' ||
      typeof contract.unassignRoleCollection !== 'function') {
    throw providerError('PROVIDER_CONTRACT_UNVERIFIED')
  }
}

function normalizedIdentity (identity) {
  if (!identity || typeof identity !== 'object') throw providerError('PROVIDER_DENIED')
  const normalized = {
    origin: boundedString(identity.origin, 120),
    issuer: boundedHttpsUrl(identity.issuer, 500),
    email: boundedString(identity.email, 255).toLowerCase(),
    subject: boundedString(identity.subject, 255),
    platformUserId: boundedString(identity.platformUserId, 255)
  }
  if (!normalized.email.includes('@')) throw providerError('PROVIDER_DENIED')
  return Object.freeze(normalized)
}

function assertAllowedRoleCollection (roleCollection) {
  if (!ALLOWED_ROLE_COLLECTIONS.has(roleCollection)) throw providerError('PROVIDER_DENIED')
}

function boundedString (value, maxLength) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized || normalized.length > maxLength) throw providerError('PROVIDER_DENIED')
  return normalized
}

function boundedHttpsUrl (value, maxLength) {
  const normalized = boundedString(value, maxLength)
  try {
    const url = new URL(normalized)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid')
    return normalized
  } catch {
    throw providerError('PROVIDER_DENIED')
  }
}

function providerError (code) {
  return Object.assign(new Error('The access provider is unavailable.'), { code })
}

module.exports = {
  CONTRACT_ID,
  createSapAuthorizationProviderFactory
}
