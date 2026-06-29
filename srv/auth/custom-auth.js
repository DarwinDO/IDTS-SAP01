'use strict'

const cds = require('@sap/cds')

const { SELECT, UPDATE } = cds.ql
const { hashToken } = require('./passwords')

module.exports = async function idtsCustomAuth (req, res, next) {
  try {
    const token = bearerTokenFrom(req)
    if (!token) return next()

    const db = await cds.connect.to('db')
    const session = await db.run(
      SELECT.one.from('idts.cap.AuthSessions')
        .columns('ID', 'user_ID', 'expiresAt', 'revokedAt')
        .where({ tokenHash: hashToken(token) })
    )

    if (!session || session.revokedAt || isExpired(session.expiresAt)) {
      return rejectUnauthorized(res)
    }

    const user = await db.run(
      SELECT.one.from('idts.cap.Users')
        .columns('ID', 'displayName', 'email', 'role_code', 'active')
        .where({ ID: session.user_ID, active: true })
    )

    if (!user) return rejectUnauthorized(res)

    cds.context.user = new cds.User({
      id: user.email,
      roles: ['authenticated-user', user.role_code].filter(Boolean),
      attr: {
        user_ID: user.ID,
        email: user.email,
        displayName: user.displayName,
        role_code: user.role_code,
        session_ID: session.ID
      }
    })

    await db.run(
      UPDATE('idts.cap.AuthSessions')
        .set({ lastUsedAt: new Date().toISOString() })
        .where({ ID: session.ID })
    )

    next()
  } catch (error) {
    next(error)
  }
}

function bearerTokenFrom (req) {
  const header = req.headers?.authorization || req.headers?.Authorization
  if (!header || typeof header !== 'string') return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function isExpired (expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now()
}

function rejectUnauthorized (res) {
  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication token.'
    }
  })
}
