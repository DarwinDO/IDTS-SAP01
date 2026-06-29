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

module.exports = class AuthService extends cds.ApplicationService {
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

  const tx = cds.tx(req)
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
  return req.reject(401, 'Invalid email or password.')
}

function userAgentFrom (req) {
  const header = req?.headers?.['user-agent'] || req?._?.req?.headers?.['user-agent']
  return typeof header === 'string' ? header.slice(0, 255) : null
}

function sessionTtlMinutes () {
  const configured = Number(cds.env.idts?.auth?.sessionTtlMinutes)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SESSION_TTL_MINUTES
}
