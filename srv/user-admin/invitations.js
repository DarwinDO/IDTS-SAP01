'use strict'

const crypto = require('node:crypto')

const BUSINESS_ROLES = Object.freeze(['PM', 'TESTER', 'DEVELOPER'])
const MAX_INVITATION_TOKEN_LENGTH = 2048

function assertUserAdministrator (req) {
  const roles = BUSINESS_ROLES.filter(role => req?.user?.is?.(role))
  if (roles.length !== 1 || roles[0] !== 'PM' || !req?.user?.is?.('UserAdmin')) {
    throw contractError('USER_ADMIN_REQUIRED', 'PM and UserAdmin authorization is required.')
  }
  return true
}

function assertRequestedAccess (requestedRole, userAdminRequested) {
  const role = String(requestedRole || '').trim().toUpperCase()
  if (!BUSINESS_ROLES.includes(role)) {
    throw contractError('INVALID_BUSINESS_ROLE', 'Requested business role is invalid.')
  }

  const overlay = userAdminRequested === true
  if (overlay && role !== 'PM') {
    throw contractError('USER_ADMIN_REQUIRES_PM', 'UserAdmin can only be requested with PM.')
  }

  return { requestedRole: role, userAdminRequested: overlay }
}

function createInvitationToken ({ invitationID, targetEmail, expiresAt, signingKey, nonce = crypto.randomBytes(18).toString('base64url') }) {
  const email = normalizeEmail(targetEmail)
  const expiry = normalizeExpiry(expiresAt)
  assertSigningKey(signingKey)
  if (!isUuid(invitationID) || !email || !nonce) {
    throw contractError('INVALID_INVITATION_INPUT', 'Invitation input is invalid.')
  }

  const payload = Buffer.from(JSON.stringify({
    id: invitationID,
    email,
    exp: expiry,
    nonce
  })).toString('base64url')
  const signature = sign(payload, signingKey)
  const token = `${payload}.${signature}`

  return {
    token,
    persisted: {
      ID: invitationID,
      targetEmailNormalized: email,
      expiresAt: expiry,
      tokenNonce: nonce,
      tokenHash: sha256(token),
      consumedAt: null
    }
  }
}

function verifyInvitationToken ({ token, persisted, signingKey, now = new Date() }) {
  assertSigningKey(signingKey)
  if (!persisted || persisted.consumedAt) {
    throw contractError(
      persisted?.consumedAt ? 'INVITATION_ALREADY_USED' : 'INVALID_INVITATION',
      persisted?.consumedAt ? 'Invitation has already been used.' : 'Invitation is invalid.'
    )
  }

  const [payload, signature] = invitationTokenSegments(token)
  if (!safeEqual(signature, sign(payload, signingKey))) {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }
  if (!safeEqual(sha256(token), persisted.tokenHash)) {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }

  let decoded
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }

  const expectedEmail = normalizeEmail(persisted.targetEmailNormalized)
  const expectedExpiry = normalizeExpiry(persisted.expiresAt)
  if (
    decoded.id !== persisted.ID ||
    decoded.email !== expectedEmail ||
    decoded.exp !== expectedExpiry ||
    decoded.nonce !== persisted.tokenNonce
  ) {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }
  if (new Date(expectedExpiry).getTime() <= now.getTime()) {
    throw contractError('INVITATION_EXPIRED', 'Invitation has expired.')
  }

  return {
    invitationID: persisted.ID,
    targetEmailNormalized: expectedEmail
  }
}

function invitationIDFromToken (token) {
  const [payload] = invitationTokenSegments(token)

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!isUuid(decoded?.id)) throw new Error('invalid id')
    return decoded.id
  } catch {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }
}

function invitationTokenSegments (token) {
  if (typeof token !== 'string' || token.length > MAX_INVITATION_TOKEN_LENGTH) {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra || payload.length > MAX_INVITATION_TOKEN_LENGTH - 44 || signature.length !== 43) {
    throw contractError('INVALID_INVITATION', 'Invitation is invalid.')
  }
  return [payload, signature]
}

function identitySnapshotFrom (user, invitation) {
  const attr = user?.attr || {}
  const subject = bounded(user?.id, 255)
  const emailNormalized = normalizeEmail(attr.email)
  const origin = bounded(attr.origin, 120)
  const issuer = bounded(attr.iss || attr.issuer, 500)

  if (!subject || !emailNormalized || !origin || !issuer) {
    throw contractError('IDENTITY_CLAIMS_INCOMPLETE', 'SAP identity claims are incomplete.')
  }
  if (emailNormalized !== normalizeEmail(invitation?.targetEmailNormalized)) {
    throw contractError('INVITATION_IDENTITY_MISMATCH', 'Signed-in SAP identity does not match the invitation.')
  }

  return { subject, emailNormalized, origin, issuer }
}

function normalizeEmail (value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (email.length > 255 || /[<>\r\n]/.test(email)) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function normalizeExpiry (value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw contractError('INVALID_INVITATION_INPUT', 'Invitation expiry is invalid.')
  return date.toISOString()
}

function assertSigningKey (value) {
  if (typeof value !== 'string' || Buffer.byteLength(value) < 32) {
    throw contractError('INVITATION_SIGNING_UNAVAILABLE', 'Invitation signing is unavailable.')
  }
}

function sign (payload, signingKey) {
  return crypto.createHmac('sha256', signingKey).update(payload).digest('base64url')
}

function sha256 (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function safeEqual (left, right) {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function bounded (value, maxLength) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function isUuid (value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function contractError (code, message) {
  const statusByCode = {
    USER_ADMIN_REQUIRED: 403,
    USER_ADMIN_REQUIRES_PM: 400,
    INVALID_BUSINESS_ROLE: 400,
    INVALID_INVITATION_INPUT: 400,
    INVALID_INVITATION: 400,
    INVITATION_EXPIRED: 410,
    INVITATION_ALREADY_USED: 409,
    INVITATION_IDENTITY_MISMATCH: 403,
    IDENTITY_CLAIMS_INCOMPLETE: 400,
    INVITATION_SIGNING_UNAVAILABLE: 503
  }
  const status = statusByCode[code] || 400
  return Object.assign(new Error(message), { code, status, statusCode: status })
}

module.exports = {
  BUSINESS_ROLES,
  assertRequestedAccess,
  assertUserAdministrator,
  createInvitationToken,
  identitySnapshotFrom,
  invitationIDFromToken,
  verifyInvitationToken
}
