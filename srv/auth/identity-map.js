'use strict'

const crypto = require('node:crypto')

function identityKeyFromRequestUser (user) {
  const attr = user?.attr || {}
  const origin = bounded(attr.origin, 120)
  const issuer = bounded(attr.iss || attr.issuer, 500)
  const subject = bounded(attr.user_uuid, 255)
  if (!origin || !issuer || !subject) return null

  return {
    origin,
    issuer,
    subject,
    keyHash: identityKeyHash({ origin, issuer, subject })
  }
}

function identityKeyHash ({ origin, issuer, subject }) {
  return crypto.createHash('sha256')
    .update(JSON.stringify([origin, issuer, subject]))
    .digest('hex')
}

function selectActiveUserForRequest (users, requestUser, options = {}) {
  const activeUsers = (users || []).filter(user => user?.active === true)
  const identity = identityKeyFromRequestUser(requestUser)
  if (identity) {
    const linked = activeUsers.find(user => user.externalIdentityKeyHash === identity.keyHash)
    if (linked) return linked
    return null
  }

  if (options.requireExternalIdentity || hasPartialExternalIdentity(requestUser)) return null

  const attr = requestUser?.attr || {}
  const internalUserID = normalize(attr.user_ID)
  if (internalUserID) return uniqueMatch(activeUsers, user => normalize(user.ID) === internalUserID)

  const requestID = normalize(requestUser?.id)
  if (requestID) {
    const byID = uniqueMatch(activeUsers, user => normalize(user.ID) === requestID)
    if (byID) return byID
  }

  const emailCandidates = [attr.email, attr.user_name, attr.login_name, requestUser?.id]
    .map(normalize)
    .filter(Boolean)
  return uniqueMatch(activeUsers, user => emailCandidates.includes(normalize(user.email)))
}

function hasPartialExternalIdentity (user) {
  const attr = user?.attr || {}
  return [attr.origin, attr.iss, attr.issuer, attr.user_uuid, attr.sub]
    .some(value => typeof value === 'string' && value.trim())
}

function uniqueMatch (users, predicate) {
  const matches = users.filter(predicate)
  return matches.length === 1 ? matches[0] : null
}

function normalize (value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}

function bounded (value, maxLength) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

module.exports = {
  identityKeyHash,
  identityKeyFromRequestUser,
  hasPartialExternalIdentity,
  selectActiveUserForRequest
}
