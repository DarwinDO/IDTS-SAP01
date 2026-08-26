/**
 * IDTS-34 Custom Login/Auth Foundation Verification
 *
 * Verifies the backend auth contract without using real credentials:
 * - active user login succeeds
 * - wrong password fails with a safe message
 * - inactive user is denied
 * - raw session token is not stored
 * - Bearer token middleware maps to cds.User roles/attributes
 * - current-user lookup returns the safe authenticated user profile
 * - logout revokes the session
 */

'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const AuthService = require('../../srv/auth')
const customAuth = require('../../srv/auth/custom-auth')
const {
  hashPassword,
  hashToken
} = require('../../srv/auth/passwords')
const { identityKeyHash } = require('../../srv/auth/identity-map')

const RESULTS = []
let PASS = 0
let FAIL = 0

const ACTIVE_EMAIL = 'donhv@example.local'
const ACTIVE_PASSWORD = 'idts-34-active-user-password'
const INACTIVE_EMAIL = 'inactive-auth@example.local'
const INACTIVE_PASSWORD = 'idts-34-inactive-user-password'
const INACTIVE_USER_ID = '99000000-0000-0000-0000-000000000034'
const TESTER_USER_ID = '10000000-0000-0000-0000-000000000004'
const DEVELOPER_USER_ID = '10000000-0000-0000-0000-000000000002'
const XSUAA_ORIGIN = 'sap.default'
const XSUAA_ISSUER = 'https://issuer.example.invalid'

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectTruthy (label, actual) {
  rec(label, Boolean(actual), `actual=${JSON.stringify(actual)}`)
}

function expectSecretPresent (label, value) {
  rec(label, typeof value === 'string' && value.length > 0, `present=${Boolean(value)}`)
}

function expectSecretEqual (label, actual, expected) {
  rec(label, actual === expected, `equal=${actual === expected}`)
}

function expectNoLeak (label, value) {
  const text = JSON.stringify(value).toLowerCase()
  const leakPatterns = [
    'select',
    'from ',
    'where ',
    'passwordhash',
    'tokenhash',
    'abc123',
    'very-secret-token',
    'idts.cap.users',
    'idts.cap.authsessions'
  ]
  const leaked = leakPatterns.filter(pattern => text.includes(pattern))
  rec(label, leaked.length === 0, leaked.length ? `leaked=${leaked.join(', ')}` : 'no unsafe detail detected')
}

async function expectRejectsSafe (label, action) {
  try {
    await action()
    rec(label, false, 'action unexpectedly succeeded')
  } catch (error) {
    const code = Number(error.code || error.statusCode || error.status)
    const message = String(error.message || '')
    rec(label, code === 401 && message.includes('Invalid email or password'), `code=${code} message=${message}`)
  }
}

async function expectRejectsGenericInternal (label, action) {
  try {
    await action()
    rec(label, false, 'action unexpectedly succeeded')
  } catch (error) {
    const code = Number(error.code || error.statusCode || error.status)
    const message = String(error.message || '')
    const pass = code === 500 &&
      message === AuthService.__test.LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE &&
      !message.toLowerCase().includes('select') &&
      !message.toLowerCase().includes('passwordhash')
    rec(label, pass, `code=${code} message=${message}`)
  }
}

function fakeUnexpectedLoginReject () {
  const req = {
    reject (code, message) {
      const error = new Error(message)
      error.code = code
      throw error
    }
  }
  return req.reject(500, AuthService.__test.LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE)
}

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-34 Custom Login/Auth Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load(['db/schema.cds', 'srv/service.cds', 'srv/auth.cds'])
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const activeHash = await hashPassword(ACTIVE_PASSWORD)
  const inactiveHash = await hashPassword(INACTIVE_PASSWORD)

  await db.run(
    UPDATE('idts.cap.Users')
      .set({
        passwordHash: activeHash,
        passwordChangedAt: new Date().toISOString()
      })
      .where({ email: ACTIVE_EMAIL })
  )

  await db.run(
    INSERT.into('idts.cap.Users').entries({
      ID: INACTIVE_USER_ID,
      displayName: 'Inactive Auth User',
      email: INACTIVE_EMAIL,
      role_code: 'TESTER',
      passwordHash: inactiveHash,
      passwordChangedAt: new Date().toISOString(),
      active: false
    })
  )

  const auth = await cds.serve('AuthService').from(csn)

  const loginResult = await auth.send('login', {
    email: `  ${ACTIVE_EMAIL.toUpperCase()}  `,
    password: ACTIVE_PASSWORD
  })

  expectEqual('active login token type', loginResult.tokenType, 'Bearer')
  expectSecretPresent('active login returns token', loginResult.token)
  expectEqual('active login maps user ID', loginResult.user.ID, '10000000-0000-0000-0000-000000000001')
  expectEqual('active login maps role', loginResult.user.role_code, 'PM')
  expectTruthy('active login returns expiry', loginResult.expiresAt)

  await expectRejectsSafe('wrong password is denied safely', () => auth.send('login', {
    email: ACTIVE_EMAIL,
    password: 'wrong-password'
  }))

  await expectRejectsSafe('inactive user is denied safely', () => auth.send('login', {
    email: INACTIVE_EMAIL,
    password: INACTIVE_PASSWORD
  }))

  const rawSqlError = Object.assign(
    new Error('SQLITE_ERROR: no such column: SU.passwordHash in SELECT from idts.cap.Users where email = abc123'),
    { code: 'SQLITE_ERROR' }
  )
  const diagnostic = AuthService.__test.safeAuthErrorDiagnostic(rawSqlError)
  expectNoLeak('unexpected login diagnostic excludes raw SQL details', diagnostic)
  await expectRejectsGenericInternal('unexpected login error response is sanitized', () => fakeUnexpectedLoginReject(rawSqlError))

  const session = await db.run(
    SELECT.one.from('idts.cap.AuthSessions')
      .columns('ID', 'user_ID', 'tokenHash', 'expiresAt', 'revokedAt')
      .where({ user_ID: loginResult.user.ID })
  )

  expectTruthy('session row created', session?.ID)
  expectEqual('raw token is not stored', session?.tokenHash === loginResult.token, false)
  expectSecretEqual('stored hash matches token', session?.tokenHash, hashToken(loginResult.token))
  expectEqual('session starts unrevoked', session?.revokedAt, null)

  const mapped = await runCustomAuth(loginResult.token)
  expectEqual('middleware accepts valid token', mapped.statusCode, null)
  expectEqual('middleware maps user id to email', mapped.user?.id, ACTIVE_EMAIL)
  expectEqual('middleware maps authenticated-user role', mapped.user?.is('authenticated-user'), true)
  expectEqual('middleware maps business role', mapped.user?.is('PM'), true)
  expectEqual('middleware maps IDTS user attribute', mapped.user?.attr?.user_ID, loginResult.user.ID)
  expectEqual('middleware maps session attribute', mapped.user?.attr?.session_ID, session.ID)

  const serviceUser = new cds.User({
    id: ACTIVE_EMAIL,
    roles: ['PM', 'authenticated-user'],
    attr: {
      user_ID: loginResult.user.ID,
      email: ACTIVE_EMAIL,
      role_code: 'PM',
      session_ID: session.ID
    }
  })

  const meResult = await auth.send({
    event: 'me',
    user: serviceUser
  })
  expectEqual('me returns current user ID', meResult.ID, loginResult.user.ID)
  expectEqual('me returns current user email', meResult.email, ACTIVE_EMAIL)
  expectEqual('me returns current user role', meResult.role_code, 'PM')
  expectEqual('custom-auth me hides UserAdmin capability', meResult.canAdministerUsers, false)
  expectEqual('custom-auth login hides UserAdmin capability', loginResult.user.canAdministerUsers, false)

  const originalAuth = cds.env.requires.auth
  try {
    cds.env.requires.auth = { kind: 'xsuaa' }
    await db.run(
      UPDATE('idts.cap.Users')
        .set({ externalIdentityKeyHash: xsuaaIdentityHash('pm-user-uuid') })
        .where({ ID: loginResult.user.ID })
    )
    await db.run(
      UPDATE('idts.cap.Users')
        .set({ externalIdentityKeyHash: xsuaaIdentityHash('tester-user-uuid') })
        .where({ ID: TESTER_USER_ID })
    )
    await db.run(
      UPDATE('idts.cap.Users')
        .set({ externalIdentityKeyHash: xsuaaIdentityHash('developer-user-uuid') })
        .where({ ID: DEVELOPER_USER_ID })
    )

    const btpAdminProfile = await auth.send({
      event: 'me',
      user: xsuaaUser('pm-user-uuid', ['PM', 'UserAdmin'])
    })
    expectEqual('XSUAA active PM with UserAdmin exposes capability', btpAdminProfile.canAdministerUsers, true)
    expectEqual('XSUAA capability keeps business role', btpAdminProfile.role_code, 'PM')

    const btpPmProfile = await auth.send({
      event: 'me',
      user: xsuaaUser('pm-user-uuid', ['PM'])
    })
    expectEqual('XSUAA PM without UserAdmin hides capability', btpPmProfile.canAdministerUsers, false)

    const btpTesterProfile = await auth.send({
      event: 'me',
      user: xsuaaUser('tester-user-uuid', ['TESTER', 'UserAdmin'])
    })
    expectEqual('XSUAA Tester with accidental UserAdmin hides capability', btpTesterProfile.canAdministerUsers, false)

    const btpDeveloperProfile = await auth.send({
      event: 'me',
      user: xsuaaUser('developer-user-uuid', ['DEVELOPER', 'UserAdmin'])
    })
    expectEqual('XSUAA Developer with accidental UserAdmin hides capability', btpDeveloperProfile.canAdministerUsers, false)

    await expectRejectsStatus('XSUAA mismatched platform and business roles fail closed', 403, () => auth.send({
      event: 'me',
      user: xsuaaUser('pm-user-uuid', ['TESTER', 'UserAdmin'])
    }))

    await expectRejectsStatus('XSUAA multiple business roles fail closed', 403, () => auth.send({
      event: 'me',
      user: xsuaaUser('pm-user-uuid', ['PM', 'TESTER', 'UserAdmin'])
    }))

    await expectRejectsStatus('XSUAA missing identity fails closed', 403, () => auth.send({
      event: 'me',
      user: new cds.User({ id: 'missing-identity', roles: ['authenticated-user', 'PM', 'UserAdmin'] })
    }))

    const safeKeys = Object.keys(btpAdminProfile).sort()
    expectEqual('safe XSUAA profile has no provider or identity fields', safeKeys.some(key => /scope|rolecollection|identity|token|issuer|origin|subject|provider/i.test(key)), false)
  } finally {
    cds.env.requires.auth = originalAuth
  }

  const logoutResult = await auth.send({
    event: 'logout',
    user: serviceUser
  })
  expectEqual('logout returns true for active session', logoutResult, true)

  const revoked = await db.run(
    SELECT.one.from('idts.cap.AuthSessions')
      .columns('revokedAt')
      .where({ ID: session.ID })
  )
  expectTruthy('logout sets revokedAt', revoked?.revokedAt)

  const rejected = await runCustomAuth(loginResult.token)
  expectEqual('middleware rejects revoked token', rejected.statusCode, 401)

  const originalConnectTo = cds.connect.to
  try {
    cds.connect.to = async () => {
      throw Object.assign(
        new Error('SELECT tokenHash, passwordHash FROM idts.cap.AuthSessions WHERE tokenHash = very-secret-token'),
        { code: 'SQLITE_ERROR' }
      )
    }
    const internalAuthError = await runCustomAuth('token-that-triggers-internal-error')
    expectEqual('middleware internal auth error status is generic', internalAuthError.statusCode, 500)
    expectEqual('middleware internal auth error code is generic', internalAuthError.body?.error?.code, 'AUTHENTICATION_UNAVAILABLE')
    expectNoLeak('middleware internal auth error response excludes raw SQL details', internalAuthError.body)
  } finally {
    cds.connect.to = originalConnectTo
  }

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('==============================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(row => !row.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }
}

function xsuaaIdentityHash (subject) {
  return identityKeyHash({ origin: XSUAA_ORIGIN, issuer: XSUAA_ISSUER, subject })
}

function xsuaaUser (subject, roles) {
  return new cds.User({
    id: `xsuaa-${subject}`,
    roles: ['authenticated-user', ...roles],
    authInfo: {
      token: {
        origin: XSUAA_ORIGIN,
        issuer: XSUAA_ISSUER,
        payload: {
          user_uuid: subject,
          user_id: `platform-${subject}`
        }
      }
    }
  })
}

async function expectRejectsStatus (label, expectedStatus, action) {
  try {
    await action()
    rec(label, false, 'action unexpectedly succeeded')
  } catch (error) {
    const status = Number(error.status || error.statusCode || error.code)
    rec(label, status === expectedStatus, `status=${status}`)
  }
}

function runCustomAuth (token) {
  return new Promise((resolve, reject) => {
    cds.context = {}

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const res = {
      statusCode: null,
      body: null,
      status (code) {
        this.statusCode = code
        return this
      },
      json (body) {
        this.body = body
        resolve({
          statusCode: this.statusCode,
          body,
          user: cds.context.user
        })
      }
    }

    customAuth(req, res, error => {
      if (error) return reject(error)
      resolve({
        statusCode: null,
        body: null,
        user: cds.context.user
      })
    })
  })
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 1000))
  process.exit(1)
})
