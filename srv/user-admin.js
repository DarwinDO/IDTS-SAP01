'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const {
  assertRequestedAccess,
  assertUserAdministrator,
  createInvitationToken,
  identitySnapshotFrom,
  invitationIDFromToken,
  verifyInvitationToken
} = require('./user-admin/invitations')
const { getUserAdminConfig } = require('./user-admin/config')
const { scheduleImmediateEmailOutbox } = require('./email/worker')
const { identityKeyHash, selectActiveUserForRequest } = require('./auth/identity-map')
const { isXsuaaRuntime } = require('./auth/platform-role')

const OPEN_STATUSES = ['INVITED', 'IDENTITY_VERIFIED', 'PROVISIONING']

class UserAdministrationService extends cds.ApplicationService {
  async init () {
    this.before('READ', 'OnboardingRequests', req => requireActiveUserAdministrator(req))
    this.on('requestOnboarding', req => requestOnboarding(req))
    this.on('verifySapIdentity', req => verifySapIdentity(req))
    this.on('searchOnboarding', req => searchOnboarding(req))
    return super.init()
  }
}

async function searchOnboarding (req) {
  const query = normalizeSearchQuery(req.data.query)
  const tx = cds.tx(req)
  await requireActiveUserAdministrator(req, tx)

  const selection = SELECT.from('idts.cap.UserOnboardingRequests')
    .columns(
      'ID',
      'targetEmailNormalized',
      'requestedRole_code',
      'userAdminRequested',
      'status_code',
      'expiresAt',
      'lastErrorCode',
      'lastErrorSummary'
    )
    .orderBy('createdAt desc')
    .limit(200)
  if (query) selection.where`contains(targetEmailNormalized, ${query})`
  return tx.run(selection)
}

async function requestOnboarding (req) {
  const access = assertRequestedAccess(req.data.requestedRole, req.data.userAdminRequested)
  const targetEmail = normalizeEmail(req.data.email)
  if (!targetEmail) throw serviceError(400, 'INVALID_INVITATION_EMAIL', 'A valid invitation email is required.')

  const config = invitationConfig()
  const tx = cds.tx(req)
  const requestedBy = await requireActiveUserAdministrator(req, tx)
  const now = req.timestamp || new Date()

  await tx.run(
    UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'FAILED',
      openRequestKey: null,
      lastErrorCode: 'INVITATION_EXPIRED',
      lastErrorSummary: 'Invitation expired before identity verification.'
    }).where({
      targetEmailNormalized: targetEmail,
      status_code: 'INVITED',
      expiresAt: { '<=': now.toISOString() }
    })
  )

  const existing = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({ targetEmailNormalized: targetEmail, status_code: { in: OPEN_STATUSES } })
  )
  if (existing) throw serviceError(409, 'ONBOARDING_ALREADY_OPEN', 'An onboarding request is already open for this identity.')

  const invitationID = cds.utils.uuid()
  const correlationId = cds.utils.uuid()
  const expiresAt = new Date(now.getTime() + config.invitationTtlMinutes * 60000).toISOString()
  const invitation = createInvitationToken({
    invitationID,
    targetEmail,
    expiresAt,
    signingKey: config.invitationSigningKey
  })
  const openRequestKey = crypto.createHash('sha256').update(targetEmail).digest('hex')

  try {
    await tx.run(INSERT.into('idts.cap.UserOnboardingRequests').entries({
      ID: invitationID,
      targetEmailNormalized: targetEmail,
      openRequestKey,
      requestedRole_code: access.requestedRole,
      userAdminRequested: access.userAdminRequested,
      status_code: 'INVITED',
      requestedBy_ID: requestedBy.ID,
      expiresAt,
      tokenNonce: invitation.persisted.tokenNonce,
      tokenHash: invitation.persisted.tokenHash,
      correlationId
    }))
  } catch (error) {
    if (isOpenRequestConstraintError(error)) {
      throw serviceError(409, 'ONBOARDING_ALREADY_OPEN', 'An onboarding request is already open for this identity.')
    }
    throw error
  }
  await tx.run(INSERT.into('idts.cap.UserOnboardingDeliveries').entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: invitationID,
    recipientEmail: targetEmail,
    templateKey: 'IDTS_USER_ONBOARDING_V1',
    status_code: 'PENDING',
    attemptCount: 0
  }))
  scheduleImmediateEmailOutbox(req)

  return onboardingResult({
    ID: invitationID,
    targetEmailNormalized: targetEmail,
    requestedRole_code: access.requestedRole,
    userAdminRequested: access.userAdminRequested,
    status_code: 'INVITED',
    expiresAt,
    correlationId
  })
}

async function verifySapIdentity (req) {
  const config = invitationConfig()
  const invitationID = invitationIDFromToken(req.data.token)
  const tx = cds.tx(req)
  const invitation = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests').where({ ID: invitationID })
  )
  if (!invitation) throw serviceError(400, 'INVALID_INVITATION', 'Invitation is invalid.')

  try {
    verifyInvitationToken({
      token: req.data.token,
      persisted: invitation,
      signingKey: config.invitationSigningKey,
      now: req.timestamp || new Date()
    })
  } catch (error) {
    if (error.code === 'INVITATION_ALREADY_USED') throw serviceError(409, error.code, error.message)
    if (error.code === 'INVITATION_EXPIRED') throw serviceError(410, error.code, error.message)
    throw serviceError(400, 'INVALID_INVITATION', 'Invitation is invalid.')
  }

  let identity
  try {
    identity = identitySnapshotFrom(req.user, invitation)
  } catch (error) {
    const status = error.code === 'INVITATION_IDENTITY_MISMATCH' ? 403 : 400
    throw serviceError(status, error.code, error.message)
  }

  const identityKeyHashValue = identityKeyHash(identity)

  const collision = await tx.run(
    SELECT.one.from('idts.cap.UserOnboardingRequests')
      .columns('ID')
      .where({
        ID: { '!=': invitation.ID },
        identityKeyHash: identityKeyHashValue
      })
  )
  if (collision) throw serviceError(409, 'EXTERNAL_IDENTITY_ALREADY_LINKED', 'SAP identity is already linked to another onboarding request.')

  const linkedUser = await tx.run(
    SELECT.one.from('idts.cap.Users')
      .columns('ID')
      .where({ externalIdentityKeyHash: identityKeyHashValue })
  )
  if (linkedUser) throw serviceError(409, 'EXTERNAL_IDENTITY_ALREADY_LINKED', 'SAP identity is already linked to an IDTS user.')

  const verifiedAt = (req.timestamp || new Date()).toISOString()
  const updated = await tx.run(
    UPDATE('idts.cap.UserOnboardingRequests').set({
      status_code: 'IDENTITY_VERIFIED',
      consumedAt: verifiedAt,
      verifiedAt,
      identityOrigin: identity.origin,
      identityIssuer: identity.issuer,
      identitySubject: identity.subject,
      identityKeyHash: identityKeyHashValue,
      identityEmailNormalized: identity.emailNormalized,
      lastErrorCode: null,
      lastErrorSummary: null
    }).where({ ID: invitation.ID, status_code: 'INVITED', consumedAt: null })
  )
  if (updated !== 1) throw serviceError(409, 'INVITATION_ALREADY_USED', 'Invitation has already been used.')

  return onboardingResult({
    ...invitation,
    status_code: 'IDENTITY_VERIFIED',
    verifiedAt,
    identityOrigin: identity.origin,
    identitySubject: identity.subject
  })
}

async function resolveActiveRequester (tx, req) {
  const users = await tx.run(
    SELECT.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'role_code', 'active', 'externalIdentityKeyHash')
      .where({ active: true })
  )
  return selectActiveUserForRequest(users, req.user, { requireExternalIdentity: isXsuaaRuntime() })
}

async function requireActiveUserAdministrator (req, tx = cds.tx(req)) {
  assertUserAdministrator(req)
  const requester = await resolveActiveRequester(tx, req)
  if (!requester || requester.role_code !== 'PM') {
    throw serviceError(403, 'USER_ADMIN_REQUIRED', 'PM and UserAdmin authorization is required.')
  }
  return requester
}

function isOpenRequestConstraintError (error) {
  const detail = `${error?.code || ''} ${error?.message || ''} ${error?.constraint || ''}`.toLowerCase()
  return detail.includes('openrequestkey') || detail.includes('openonboardingrequest')
}

function onboardingResult (row) {
  return {
    ID: row.ID,
    targetEmail: row.targetEmailNormalized,
    requestedRole: row.requestedRole_code,
    userAdminRequested: row.userAdminRequested === true,
    status: row.status_code,
    expiresAt: row.expiresAt,
    verifiedAt: row.verifiedAt || null,
    correlationId: row.correlationId
  }
}

function invitationConfig () {
  const config = getUserAdminConfig()
  if (!config.ready) {
    throw serviceError(503, 'INVITATION_CONFIG_UNAVAILABLE', 'User onboarding is temporarily unavailable.')
  }
  return config
}

function normalizeEmail (value) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 255 && !/[<>\r\n]/.test(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null
}

function normalizeSearchQuery (value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  const query = value.trim().toLowerCase()
  if (query.length > 255 || /[<>\r\n]/.test(query)) {
    throw serviceError(400, 'INVALID_SEARCH_QUERY', 'Search query is invalid.')
  }
  return query
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = UserAdministrationService
module.exports.requestOnboarding = requestOnboarding
module.exports.verifySapIdentity = verifySapIdentity
module.exports.searchOnboarding = searchOnboarding
