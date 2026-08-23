'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { createInvitationToken, normalizeEmail } = require('./invitations')
const { getUserAdminConfig } = require('./config')
const { scheduleImmediateEmailOutbox } = require('../email/worker')

const USERS = 'idts.cap.Users'
const REQUESTS = 'idts.cap.UserOnboardingRequests'
const DELIVERIES = 'idts.cap.UserOnboardingDeliveries'
const AUDIT_EVENTS = 'idts.cap.UserIdentityAuditEvents'

async function requestExistingUserIdentityLink (req, dependencies) {
  const tx = cds.tx(req)
  const administrator = await dependencies.requireActiveUserAdministrator(req, tx)
  const targetEmail = normalizeEmail(req.data.email)
  if (!targetEmail) throw serviceError(400, 'INVALID_INVITATION_EMAIL', 'A valid invitation email is required.')

  const target = await tx.run(
    SELECT.one.from(USERS).columns(
      'ID', 'email', 'role_code', 'active',
      'externalIdentityOrigin', 'externalIdentityIssuer',
      'externalIdentitySubject', 'externalIdentityKeyHash'
    ).where({ ID: req.data.userID })
  )
  assertEligibleLegacyTarget(target)
  await assertEmailAvailable(tx, target.ID, targetEmail)

  const now = req.timestamp || new Date()
  await expireStaleLinkRequest(tx, target.ID, now)
  await assertNoOpenLinkRequest(tx, target.ID)

  return createExistingLinkRequest(tx, {
    administratorID: administrator.ID,
    target,
    targetEmail,
    now,
    req,
    dependencies
  })
}

async function cancelExistingUserIdentityLink (req, dependencies) {
  const tx = cds.tx(req)
  const administrator = await dependencies.requireActiveUserAdministrator(req, tx)
  const requestID = req.data.requestID
  const expectedVersion = req.data.expectedVersion
  if (typeof requestID !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestID)) {
    throw serviceError(400, 'INVALID_ONBOARDING_REQUEST', 'The onboarding request is invalid.')
  }

  const request = await tx.run(
    SELECT.one.from(REQUESTS).columns(
      'ID', 'targetEmailNormalized', 'requestedRole_code', 'userAdminRequested',
      'status_code', 'expiresAt', 'verifiedAt', 'provisionedAt', 'revokedAt',
      'provisioningVersion', 'correlationId', 'consumedAt', 'linkTargetUser_ID'
    ).where({ ID: requestID })
  )
  if (!request) {
    throw serviceError(404, 'IDENTITY_LINK_INVITATION_NOT_FOUND', 'The invitation was not found.')
  }
  const isExistingLink = Boolean(request.linkTargetUser_ID)
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0 || request.provisioningVersion !== expectedVersion) {
    throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The onboarding request changed. Reload and try again.')
  }
  if (request.status_code !== 'INVITED' || request.consumedAt != null) {
    const code = isExistingLink ? 'IDENTITY_LINK_INVITATION_NOT_OPEN' : 'ONBOARDING_INVITATION_NOT_OPEN'
    throw serviceError(409, code, 'Only an open invitation can be cancelled.')
  }

  const nextVersion = expectedVersion + 1
  const lastErrorSummary = 'Invitation was cancelled before identity verification.'
  const affectedRows = await tx.run(
    UPDATE(REQUESTS).set({
      status_code: 'FAILED',
      openRequestKey: null,
      provisioningVersion: nextVersion,
      lastErrorCode: 'INVITATION_CANCELLED',
      lastErrorSummary
    }).where({
      ID: request.ID,
      status_code: 'INVITED',
      consumedAt: null,
      provisioningVersion: expectedVersion
    })
  )
  if (affectedRows !== 1) {
    throw serviceError(409, 'ONBOARDING_VERSION_CONFLICT', 'The onboarding request changed. Reload and try again.')
  }

  await tx.run(UPDATE(DELIVERIES).set({
    status_code: 'SKIPPED',
    nextAttemptAt: null,
    lastErrorCode: 'INVITATION_CANCELLED',
    lastErrorSummary,
    lockedUntil: null,
    lockToken: null
  }).where({
    onboardingRequest_ID: request.ID,
    status_code: { in: ['PENDING', 'FAILED'] }
  }))
  await tx.run(INSERT.into(AUDIT_EVENTS).entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: request.ID,
    actor_ID: administrator.ID,
    targetUser_ID: request.linkTargetUser_ID || null,
    action: isExistingLink ? 'CANCEL_LINK_INVITATION' : 'CANCEL_INVITATION',
    result: 'APPLIED',
    fromState: 'INVITED',
    toState: 'FAILED',
    correlationId: request.correlationId,
    detailsSummary: 'An open onboarding invitation was cancelled.'
  }))

  return dependencies.onboardingResult({
    ...request,
    status_code: 'FAILED',
    provisioningVersion: nextVersion
  })
}

function assertEligibleLegacyTarget (target) {
  if (!target) throw serviceError(404, 'IDENTITY_LINK_TARGET_NOT_FOUND', 'The selected user is not eligible for identity linking.')
  if (target.active !== true) throw serviceError(409, 'IDENTITY_LINK_TARGET_INACTIVE', 'The selected user is not eligible for identity linking.')
  if (!['TESTER', 'DEVELOPER'].includes(target.role_code)) {
    throw serviceError(409, 'IDENTITY_LINK_TARGET_ROLE_INVALID', 'The selected user is not eligible for identity linking.')
  }

  const identity = [
    target.externalIdentityOrigin,
    target.externalIdentityIssuer,
    target.externalIdentitySubject,
    target.externalIdentityKeyHash
  ]
  if (identity.every(value => value != null)) {
    throw serviceError(409, 'IDENTITY_LINK_TARGET_ALREADY_LINKED', 'The selected user is not eligible for identity linking.')
  }
  if (identity.some(value => value != null)) {
    throw serviceError(409, 'IDENTITY_LINK_TARGET_IDENTITY_CONFLICT', 'The selected user is not eligible for identity linking.')
  }
  if (!normalizeEmail(target.email)?.endsWith('@example.local')) {
    throw serviceError(409, 'IDENTITY_LINK_TARGET_NOT_LEGACY', 'The selected user is not eligible for identity linking.')
  }
}

async function assertEmailAvailable (tx, targetID, targetEmail) {
  const users = await tx.run(SELECT.from(USERS).columns('ID', 'email'))
  if (users.some(user => user.ID !== targetID && normalizeEmail(user.email) === targetEmail)) {
    throw serviceError(409, 'EMAIL_RECONCILIATION_REQUIRED', 'An existing IDTS user requires identity reconciliation.')
  }
}

async function expireStaleLinkRequest (tx, targetID, now) {
  await tx.run(
    UPDATE(REQUESTS).set({
      status_code: 'FAILED',
      openRequestKey: null,
      lastErrorCode: 'INVITATION_EXPIRED',
      lastErrorSummary: 'Invitation expired before identity verification.'
    }).where({
      linkTargetUser_ID: targetID,
      status_code: 'INVITED',
      expiresAt: { '<=': now.toISOString() }
    })
  )
}

async function assertNoOpenLinkRequest (tx, targetID) {
  const existing = await tx.run(
    SELECT.one.from(REQUESTS).columns('ID').where({ openRequestKey: openRequestKeyFor(targetID) })
  )
  if (existing) {
    throw serviceError(409, 'EXISTING_IDENTITY_LINK_ALREADY_OPEN', 'An identity-link invitation is already open for the selected user.')
  }
}

async function createExistingLinkRequest (tx, { administratorID, target, targetEmail, now, req, dependencies }) {
  const config = invitationConfig(dependencies.getUserAdminConfig || getUserAdminConfig)
  const invitationID = cds.utils.uuid()
  const correlationId = cds.utils.uuid()
  const expiresAt = new Date(now.getTime() + config.invitationTtlMinutes * 60000).toISOString()
  const invitation = createInvitationToken({
    invitationID,
    targetEmail,
    expiresAt,
    signingKey: config.invitationSigningKey
  })

  try {
    await tx.run(INSERT.into(REQUESTS).entries({
      ID: invitationID,
      targetEmailNormalized: targetEmail,
      openRequestKey: openRequestKeyFor(target.ID),
      requestedRole_code: target.role_code,
      userAdminRequested: false,
      status_code: 'INVITED',
      requestedBy_ID: administratorID,
      linkTargetUser_ID: target.ID,
      linkSourceEmailNormalized: normalizeEmail(target.email),
      expiresAt,
      tokenNonce: invitation.persisted.tokenNonce,
      tokenHash: invitation.persisted.tokenHash,
      correlationId
    }))
  } catch (error) {
    if (dependencies.isOpenRequestConstraintError(error)) {
      throw serviceError(409, 'EXISTING_IDENTITY_LINK_ALREADY_OPEN', 'An identity-link invitation is already open for the selected user.')
    }
    throw error
  }

  await tx.run(INSERT.into(DELIVERIES).entries({
    ID: cds.utils.uuid(),
    onboardingRequest_ID: invitationID,
    recipientEmail: targetEmail,
    templateKey: 'IDTS_EXISTING_USER_IDENTITY_LINK_V1',
    status_code: 'PENDING',
    attemptCount: 0
  }))
  scheduleImmediateEmailOutbox(req)

  return dependencies.onboardingResult({
    ID: invitationID,
    targetEmailNormalized: targetEmail,
    requestedRole_code: target.role_code,
    userAdminRequested: false,
    status_code: 'INVITED',
    expiresAt,
    correlationId
  })
}

function invitationConfig (readConfig) {
  const config = readConfig()
  if (!config.ready) {
    throw serviceError(503, 'INVITATION_CONFIG_UNAVAILABLE', 'User onboarding is temporarily unavailable.')
  }
  return config
}

function openRequestKeyFor (targetID) {
  return crypto.createHash('sha256').update(JSON.stringify(['LINK_EXISTING', targetID])).digest('hex')
}

function serviceError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = { requestExistingUserIdentityLink, cancelExistingUserIdentityLink }
