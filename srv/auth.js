// Học nhanh (DonHV): nhận login, chỉ lưu hash của session token và luôn trả lỗi an toàn để không lộ user/password/database.
'use strict'

const cds = require('@sap/cds')

const { SELECT, INSERT, UPDATE } = cds.ql
const {
  verifyPassword,
  createSessionToken,
  hashToken,
  addMinutes
} = require('./auth/passwords')

const DEFAULT_SESSION_TTL_MINUTES = 8 * 60
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.'
const LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE = 'Sign-in is temporarily unavailable. Please try again later.'
const LOG = cds.log('idts-auth')

class AuthService extends cds.ApplicationService {
  async init () {
    this.on('login', req => login(req))
    this.on('logout', req => logout(req))
    this.on('me', req => me(req))

    return super.init()
  }
}

async function login (req) {
  const email = normalizeEmail(req.data.email)
  const password = req.data.password

  if (!email || typeof password !== 'string' || !password) {
    return rejectInvalidCredentials(req)
  }

  try {
    const tx = cds.tx(req)
    // Không phân biệt "không có user" và "sai password" ở response: tránh cho người ngoài dò account hợp lệ.
    const user = await tx.run(
      SELECT.one.from('idts.cap.Users')
        .columns('ID', 'displayName', 'email', 'role_code', 'active', 'passwordHash')
        .where({ email })
    )

    if (!user || !user.active || !user.passwordHash) {
      return rejectInvalidCredentials(req)
    }

    const passwordOk = await verifyPassword(password, user.passwordHash)
    if (!passwordOk) return rejectInvalidCredentials(req)

    const now = new Date()
    const expiresAt = addMinutes(now, sessionTtlMinutes())
    const token = createSessionToken()

    // DB chỉ nhận tokenHash; raw bearer token chỉ trả một lần cho client sau khi login thành công.
    await tx.run(
      INSERT.into('idts.cap.AuthSessions').entries({
        ID: cds.utils.uuid(),
        user_ID: user.ID,
        tokenHash: hashToken(token),
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        userAgent: userAgentFrom(req)
      })
    )

    return {
      token,
      tokenType: 'Bearer',
      expiresAt: expiresAt.toISOString(),
      user: await publicUser(tx, user)
    }
  } catch (error) {
    if (isExpectedClientAuthReject(error)) throw error
    logUnexpectedAuthError('login', error)
    return req.reject(500, LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE)
  }
}

async function logout (req) {
  const sessionID = req.user?.attr?.session_ID
  if (!sessionID) return false

  const affected = await cds.tx(req).run(
    UPDATE('idts.cap.AuthSessions')
      .set({ revokedAt: new Date().toISOString() })
      .where({ ID: sessionID, revokedAt: null })
  )

  return Number(affected) > 0
}

async function me (req) {
  const userID = req.user?.attr?.user_ID
  if (!userID) return req.reject(401, 'Authentication token is required.')

  const tx = cds.tx(req)
  const user = await tx.run(
    SELECT.one.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'role_code', 'active')
      .where({ ID: userID, active: true })
  )

  if (!user) return req.reject(401, 'Authentication token is no longer valid.')
  return publicUser(tx, user)
}

async function publicUser (tx, user) {
  const role = user.role_code
    ? await tx.run(SELECT.one.from('idts.cap.UserRoles').columns('name').where({ code: user.role_code }))
    : null

  return {
    ID: user.ID,
    displayName: user.displayName,
    email: user.email,
    role_code: user.role_code,
    roleName: role?.name || null
  }
}

function normalizeEmail (email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : null
}

function rejectInvalidCredentials (req) {
  return req.reject(401, INVALID_CREDENTIALS_MESSAGE)
}

function userAgentFrom (req) {
  const header = req?.headers?.['user-agent'] || req?._?.req?.headers?.['user-agent']
  return typeof header === 'string' ? header.slice(0, 255) : null
}

function sessionTtlMinutes () {
  const configured = Number(cds.env.idts?.auth?.sessionTtlMinutes)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SESSION_TTL_MINUTES
}

function isExpectedClientAuthReject (error) {
  const code = Number(error?.code || error?.statusCode || error?.status)
  return code >= 400 && code < 500
}

function logUnexpectedAuthError (operation, error) {
  LOG.error('Unexpected authentication failure', {
    operation,
    diagnostic: safeAuthErrorDiagnostic(error)
  })
}

function safeAuthErrorDiagnostic (error) {
  const status = Number(error?.statusCode || error?.status)
  return {
    name: safeDiagnosticToken(error?.name, 'Error'),
    code: safeDiagnosticToken(error?.code, 'UNKNOWN'),
    status: Number.isFinite(status) ? status : null
  }
}

function safeDiagnosticToken (value, fallback) {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback
  const token = String(value).replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80)
  return token || fallback
}

module.exports = AuthService
module.exports.__test = {
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE,
  isExpectedClientAuthReject,
  safeAuthErrorDiagnostic,
  safeDiagnosticToken
}
