'use strict'

function validatedXsuaaIdentityFromRequestUser (user) {
  const token = user?.authInfo?.token
  const origin = bounded(token?.origin, 120)
  const issuer = bounded(token?.issuer, 500)
  const subject = bounded(token?.payload?.user_uuid, 255)
  const platformUserId = bounded(token?.payload?.user_id, 255)

  return {
    origin,
    issuer,
    subject,
    platformUserId,
    originPresent: Boolean(origin),
    issuerPresent: Boolean(issuer),
    userUuidPresent: Boolean(subject),
    platformUserIdPresent: Boolean(platformUserId),
    complete: Boolean(origin && issuer && subject),
    provisioningComplete: Boolean(origin && issuer && subject && platformUserId),
    subjectSource: subject ? 'user_uuid' : null
  }
}

function bounded (value, maxLength) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

module.exports = { validatedXsuaaIdentityFromRequestUser }
