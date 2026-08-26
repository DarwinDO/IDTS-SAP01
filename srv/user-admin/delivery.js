'use strict'

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql

const { formatFrom, retryDelayMs, sanitizeTransportError } = require('../email/outbox')
const { createInvitationToken } = require('./invitations')

const DELIVERIES = 'idts.cap.UserOnboardingDeliveries'
const REQUESTS = 'idts.cap.UserOnboardingRequests'
const SAP_ACCOUNT_URL = 'https://account.sap.com/'
const SAP_REGISTRATION_URL = 'https://account.sap.com/registration/'

async function processUserOnboardingDeliveries ({
  tx,
  emailConfig,
  invitationConfig,
  sendMail,
  now = new Date(),
  workerID = cds.utils.uuid()
}) {
  if (!emailConfig?.ready || !invitationConfigReady(invitationConfig) || typeof sendMail !== 'function') {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const maxAttempts = emailConfig.maxRetryCount + 1
  const candidates = await tx.run(
    SELECT.from(DELIVERIES)
      .where({ status_code: { in: ['PENDING', 'FAILED'] } })
      .orderBy('createdAt asc')
      .limit(emailConfig.batchSize * 3)
  )
  const eligible = candidates
    .filter(row => Number(row.attemptCount || 0) < maxAttempts)
    .filter(row => !row.nextAttemptAt || new Date(row.nextAttemptAt) <= now)
    .filter(row => !row.lockedUntil || new Date(row.lockedUntil) <= now)
    .slice(0, emailConfig.batchSize)

  const result = { sent: 0, failed: 0, skipped: 0 }
  for (const delivery of eligible) {
    const lockToken = `${workerID}-${cds.utils.uuid()}`.slice(0, 64)
    const lockedUntil = new Date(now.getTime() + Math.max(emailConfig.pollIntervalMs * 4, 60000)).toISOString()
    const claimed = await tx.run(
      UPDATE(DELIVERIES).set({ lockToken, lockedUntil }).where({
        ID: delivery.ID,
        status_code: delivery.status_code,
        attemptCount: delivery.attemptCount,
        lockedUntil: delivery.lockedUntil || null
      })
    )
    if (!claimed) continue

    const request = await tx.run(
      SELECT.one.from(REQUESTS).where({ ID: delivery.onboardingRequest_ID })
    )
    if (!request || request.status_code !== 'INVITED' || new Date(request.expiresAt) <= now) {
      const lastErrorCode = request ? 'INVITATION_EXPIRED' : 'INVITATION_NOT_FOUND'
      const lastErrorSummary = request ? 'Invitation is no longer eligible for delivery.' : 'Invitation was not found.'
      await tx.run(UPDATE(DELIVERIES).set({
        status_code: 'SKIPPED',
        lastErrorCode,
        lastErrorSummary,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      if (request) {
        await tx.run(UPDATE(REQUESTS).set({ lastErrorCode, lastErrorSummary }).where({ ID: request.ID }))
      }
      result.skipped += 1
      continue
    }

    const attemptCount = Number(delivery.attemptCount || 0) + 1
    const lastAttemptAt = now.toISOString()
    await tx.run(UPDATE(DELIVERIES).set({ attemptCount, lastAttemptAt }).where({ ID: delivery.ID, lockToken }))

    try {
      const invitation = createInvitationToken({
        invitationID: request.ID,
        targetEmail: request.targetEmailNormalized,
        expiresAt: request.expiresAt,
        signingKey: invitationConfig.invitationSigningKey,
        nonce: request.tokenNonce
      })
      if (invitation.persisted.tokenHash !== request.tokenHash) throw safeDeliveryError('INVITATION_TOKEN_MISMATCH')
      const message = buildInvitationMessage(request, invitation.token, invitationConfig, emailConfig)
      const providerResult = await sendMail(message)

      await tx.run(UPDATE(DELIVERIES).set({
        status_code: 'SENT',
        sentAt: now.toISOString(),
        providerMessageId: providerResult?.messageId || null,
        nextAttemptAt: null,
        lastErrorCode: null,
        lastErrorSummary: null,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      await tx.run(UPDATE(REQUESTS).set({
        lastErrorCode: null,
        lastErrorSummary: null
      }).where({ ID: request.ID }))
      result.sent += 1
    } catch (error) {
      const safeError = sanitizeTransportError(error)
      const retryAt = attemptCount < maxAttempts
        ? new Date(now.getTime() + retryDelayMs(attemptCount)).toISOString()
        : null
      await tx.run(UPDATE(DELIVERIES).set({
        status_code: 'FAILED',
        nextAttemptAt: retryAt,
        lastErrorCode: safeError.code,
        lastErrorSummary: safeError.summary,
        lockedUntil: null,
        lockToken: null
      }).where({ ID: delivery.ID, lockToken }))
      await tx.run(UPDATE(REQUESTS).set({
        lastErrorCode: safeError.code,
        lastErrorSummary: safeError.summary
      }).where({ ID: request.ID }))
      result.failed += 1
    }
  }

  return result
}

function buildInvitationMessage (request, token, invitationConfig, emailConfig) {
  const link = `${invitationConfig.invitationBaseUrl}#token=${encodeURIComponent(token)}`
  const role = request.requestedRole_code
  const overlay = request.userAdminRequested ? ' with User Administration capability' : ''
  const subject = '[IDTS] IDTS access invitation'
  const text = [
    'An IDTS Project Manager requested access for this SAP identity.',
    `Requested access: ${role}${overlay}`,
    `Invitation expires: ${request.expiresAt}`,
    '',
    `Continue with SAP: ${link}`,
    '',
    `Already have an SAP account? Sign in or manage it: ${SAP_ACCOUNT_URL}`,
    `Need an SAP Universal ID? Register here: ${SAP_REGISTRATION_URL}`,
    'For privacy, IDTS cannot check whether an email is registered with SAP.',
    '',
    'IDTS will never ask for your SAP password, OTP, passkey, or recovery code.'
  ].join('\n')
  const html = `<!doctype html><html><body><p>An IDTS Project Manager requested access for this SAP identity.</p><p><strong>Requested access:</strong> ${escapeHtml(role + overlay)}</p><p><strong>Invitation expires:</strong> ${escapeHtml(request.expiresAt)}</p><p><a href="${escapeHtml(link)}">Continue with SAP</a></p><p><a href="${SAP_ACCOUNT_URL}">Sign in or manage your SAP account</a></p><p><a href="${SAP_REGISTRATION_URL}">Register an SAP Universal ID</a></p><p>For privacy, IDTS cannot check whether an email is registered with SAP.</p><p>IDTS will never ask for your SAP password, OTP, passkey, or recovery code.</p></body></html>`

  return {
    to: request.targetEmailNormalized,
    from: formatFrom(emailConfig),
    replyTo: emailConfig.replyTo || undefined,
    subject,
    text,
    html,
    headers: { 'X-IDTS-Onboarding-ID': request.ID }
  }
}

function invitationConfigReady (config) {
  return typeof config?.invitationSigningKey === 'string' &&
    Buffer.byteLength(config.invitationSigningKey) >= 32 &&
    typeof config?.invitationBaseUrl === 'string' &&
    /^https:\/\//i.test(config.invitationBaseUrl)
}

function safeDeliveryError (code) {
  return Object.assign(new Error('Invitation delivery failed.'), { code })
}

function escapeHtml (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

module.exports = {
  buildInvitationMessage,
  processUserOnboardingDeliveries
}
