'use strict'

const crypto = require('node:crypto')
const { validatedXsuaaIdentityFromRequestUser } = require('./validated-xsuaa-identity')

function identityKeyFromRequestUser (user) {
  const validated = validatedXsuaaIdentityFromRequestUser(user)
  if (!validated.complete) return null

  const { origin, issuer, subject, platformUserId } = validated

  return {
    origin,
    issuer,
    subject,
    platformUserId,
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
  if (user?.authInfo !== undefined && user?.authInfo !== null) return true
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

module.exports = {
  identityKeyHash,
  identityKeyFromRequestUser,
  hasPartialExternalIdentity,
  selectActiveUserForRequest,
  validatedXsuaaIdentityFromRequestUser
}
