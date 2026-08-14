'use strict'

// Reviewed source: SAP Business Accelerator Hub PlatformAPI.json
// SHA-256: 69dc872e32ce2c4bcec77466c736f81e0a99961b333eea9f10aa23b9705c2cc8
const OPENAPI_SHA256 = '69dc872e32ce2c4bcec77466c736f81e0a99961b333eea9f10aa23b9705c2cc8'
const CONTRACT_ID = 'SAP_USER_MANAGEMENT_OPENAPI_69DC872E_V1'
const DEFAULT_ORIGIN = 'sap.default'
const PAGE_SIZE = 500
const MAX_GROUP_PAGES = 20
const ALLOWED_ROLE_COLLECTIONS = new Set([
  'IDTS_PM',
  'IDTS_TESTER',
  'IDTS_DEVELOPER',
  'IDTS_USER_ADMIN'
])

function createSapUserManagementContract () {
  return Object.freeze({
    contractId: CONTRACT_ID,
    listRoleCollections: async (identity, apiClient) => {
      const user = await readVerifiedUser(identity, apiClient)
      return directRoleCollections(user)
    },
    assignRoleCollection: async (identity, roleCollection, apiClient) => {
      return patchMembership(identity, roleCollection, 'create', apiClient)
    },
    unassignRoleCollection: async (identity, roleCollection, apiClient) => {
      return patchMembership(identity, roleCollection, 'delete', apiClient)
    }
  })
}

async function patchMembership (identity, roleCollection, operation, apiClient) {
  const user = await readVerifiedUser(identity, apiClient)
  const group = await exactRoleCollection(roleCollection, apiClient)
  return apiClient.request({
    method: 'PATCH',
    path: `/Groups/${encodeURIComponent(group.id)}`,
    body: {
      members: [{
        origin: identity.origin,
        type: 'USER',
        value: user.id,
        operation
      }]
    }
  })
}

async function readVerifiedUser (identity, apiClient) {
  assertApiClient(apiClient)
  assertIdentity(identity)
  const user = await apiClient.request({
    method: 'GET',
    path: `/Users/${encodeURIComponent(identity.platformUserId)}`
  })
  if (!user || typeof user !== 'object' || Array.isArray(user) ||
      user.id !== identity.platformUserId || user.origin !== identity.origin ||
      user.active !== true || !Array.isArray(user.groups)) {
    throw providerError('PROVIDER_IDENTITY_UNVERIFIED')
  }
  return user
}

function directRoleCollections (user) {
  const direct = []
  for (const group of user.groups) {
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      throw providerError('PROVIDER_IDENTITY_UNVERIFIED')
    }
    if (group.type !== 'DIRECT') continue
    const display = bounded(group.display, 255)
    const value = bounded(group.value, 255)
    if (!display || !value) throw providerError('PROVIDER_IDENTITY_UNVERIFIED')
    direct.push(display)
  }
  return [...new Set(direct)]
}

async function exactRoleCollection (roleCollection, apiClient) {
  assertAllowedRoleCollection(roleCollection)
  const groups = await allRoleCollections(apiClient)
  const matches = groups.filter(group => group.displayName === roleCollection)
  if (matches.length === 0) throw providerError('PROVIDER_GROUP_MISSING')
  if (matches.length !== 1) throw providerError('PROVIDER_GROUP_AMBIGUOUS')
  const id = bounded(matches[0].id, 255)
  if (!id) throw providerError('PROVIDER_GROUP_AMBIGUOUS')
  return { id }
}

async function allRoleCollections (apiClient) {
  assertApiClient(apiClient)
  const groups = []
  let startIndex = 1
  for (let page = 0; page < MAX_GROUP_PAGES; page += 1) {
    const response = await apiClient.request({
      method: 'GET',
      path: `/Groups?count=${PAGE_SIZE}&startIndex=${startIndex}`
    })
    const parsed = parsedGroupPage(response, startIndex)
    groups.push(...parsed.resources)
    if (groups.length >= parsed.totalResults) return groups
    if (parsed.resources.length === 0) throw providerError('PROVIDER_GROUP_AMBIGUOUS')
    startIndex += parsed.resources.length
  }
  throw providerError('PROVIDER_GROUP_AMBIGUOUS')
}

function parsedGroupPage (response, expectedStartIndex) {
  if (!response || typeof response !== 'object' || Array.isArray(response) ||
      !Array.isArray(response.resources) ||
      !Number.isInteger(response.startIndex) || response.startIndex !== expectedStartIndex ||
      !Number.isInteger(response.itemsPerPage) || response.itemsPerPage < 0 || response.itemsPerPage > PAGE_SIZE ||
      !Number.isInteger(response.totalResults) || response.totalResults < 0 ||
      response.resources.length > PAGE_SIZE || response.resources.length > response.itemsPerPage) {
    throw providerError('PROVIDER_GROUP_AMBIGUOUS')
  }
  return response
}

function assertIdentity (identity) {
  const valid = identity && typeof identity === 'object' && !Array.isArray(identity) &&
    identity.origin === DEFAULT_ORIGIN &&
    httpsUrl(identity.issuer) &&
    bounded(identity.subject, 255) &&
    uuid(identity.platformUserId)
  if (!valid) throw providerError('PROVIDER_IDENTITY_UNVERIFIED')
}

function assertAllowedRoleCollection (roleCollection) {
  if (!ALLOWED_ROLE_COLLECTIONS.has(roleCollection)) throw providerError('PROVIDER_DENIED')
}

function assertApiClient (apiClient) {
  if (typeof apiClient?.request !== 'function') throw providerError('PROVIDER_UNAVAILABLE')
}

function bounded (value, maxLength) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(normalized)
    ? normalized
    : null
}

function uuid (value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function httpsUrl (value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}

function providerError (code) {
  return Object.assign(new Error('The access provider is unavailable.'), { code })
}

module.exports = {
  CONTRACT_ID,
  OPENAPI_SHA256,
  createSapUserManagementContract
}
