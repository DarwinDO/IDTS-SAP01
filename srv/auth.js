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
const {
  enforcePlatformRoleAlignment,
  isXsuaaRuntime
} = require('./auth/platform-role')

const DEFAULT_SESSION_TTL_MINUTES = 8 * 60
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.'
const LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE = 'Sign-in is temporarily unavailable. Please try again later.'
const BTP_LOGIN_MESSAGE = 'Use your SAP BTP account to sign in to this environment.'
const BTP_USER_NOT_REGISTERED_MESSAGE = 'Your SAP BTP identity is not registered in IDTS.'
const LOG = cds.log('idts-auth')

class AuthService extends cds.ApplicationService {
  // CAP gọi `init()` khi publish AuthService; ba action login/logout/me được nối tới handler bên dưới.
  async init () {
    this.on('login', req => login(req))
    this.on('logout', req => logout(req))
    this.on('me', req => me(req))

    return super.init()
  }
}

async function login (req) {
  if (isXsuaaRuntime()) {
    return req.reject(405, BTP_LOGIN_MESSAGE)
  }

  // UI login gửi email/password vào action này. Hàm normalize email, đọc user active, verify hash,
  // tạo session token dạng thô cho client nhưng chỉ lưu hash token vào database.
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
  if (isXsuaaRuntime()) return true

  // Lấy bearer token hiện tại, hash lại và vô hiệu session tương ứng; không cần lưu raw token để tìm row.
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
  if (isXsuaaRuntime()) return btpUserProfile(req)

  // Trả profile public của session đã được custom-auth xác thực; không trả passwordHash/tokenHash.
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

async function btpUserProfile (req) {
  const tx = cds.tx(req)
  const candidates = new Set(requestUserCandidates(req).map(value => value.trim().toLowerCase()))
  const users = await tx.run(
    SELECT.from('idts.cap.Users')
      .columns('ID', 'displayName', 'email', 'role_code', 'active')
      .where({ active: true })
  )
  const user = users.find(row =>
    [row.ID, row.email, row.displayName]
      .filter(Boolean)
      .some(value => candidates.has(String(value).trim().toLowerCase()))
  )

  if (!user) return req.reject(403, BTP_USER_NOT_REGISTERED_MESSAGE)
  return publicUser(tx, enforcePlatformRoleAlignment(req, user))
}

function requestUserCandidates (req) {
  const attributes = req.user?.attr || {}
  return [
    req.user?.id,
    attributes.email,
    attributes.user_name,
    attributes.login_name,
    attributes.name
  ]
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(Boolean)
}

async function publicUser (tx, user) {
  // Dựng object user an toàn cho response login/me bằng cách join role/profile cần hiển thị.
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
  // Chuẩn hóa username login thành lowercase/trim để PostgreSQL không phân biệt cùng email do casing.
  return typeof email === 'string' ? email.trim().toLowerCase() : null
}

function rejectInvalidCredentials (req) {
  // Dùng cùng message cho email không tồn tại và password sai để không lộ account nào có thật.
  return req.reject(401, INVALID_CREDENTIALS_MESSAGE)
}

function userAgentFrom (req) {
  // Lấy user-agent đã giới hạn độ dài để audit session, không dùng làm yếu tố xác thực.
  const header = req?.headers?.['user-agent'] || req?._?.req?.headers?.['user-agent']
  return typeof header === 'string' ? header.slice(0, 255) : null
}

function sessionTtlMinutes () {
  // Đọc TTL private config với fallback an toàn; kết quả quyết định expiresAt của session mới.
  const configured = Number(cds.env.idts?.auth?.sessionTtlMinutes)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SESSION_TTL_MINUTES
}

function isExpectedClientAuthReject (error) {
  // Phân biệt 4xx dự kiến với lỗi runtime để chỉ log diagnostic cần thiết.
  const code = Number(error?.code || error?.statusCode || error?.status)
  return code >= 400 && code < 500
}

function logUnexpectedAuthError (operation, error) {
  // Log mã/tóm tắt đã sanitize cho vận hành; tuyệt đối không in raw SQL, stack, token hoặc credential.
  LOG.error('Unexpected authentication failure', {
    operation,
    diagnostic: safeAuthErrorDiagnostic(error)
  })
}

function safeAuthErrorDiagnostic (error) {
  // Chuyển error không tin cậy thành object code/summary an toàn cho server log.
  const status = Number(error?.statusCode || error?.status)
  return {
    name: safeDiagnosticToken(error?.name, 'Error'),
    code: safeDiagnosticToken(error?.code, 'UNKNOWN'),
    status: Number.isFinite(status) ? status : null
  }
}

function safeDiagnosticToken (value, fallback) {
  // Chỉ giữ ký tự allow-list và giới hạn độ dài của mã lỗi trước khi log.
  if (typeof value !== 'string' && typeof value !== 'number') return fallback
  const token = String(value).replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80)
  return token || fallback
}

module.exports = AuthService
module.exports.__test = {
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_TEMPORARILY_UNAVAILABLE_MESSAGE,
  BTP_LOGIN_MESSAGE,
  BTP_USER_NOT_REGISTERED_MESSAGE,
  isExpectedClientAuthReject,
  requestUserCandidates,
  safeAuthErrorDiagnostic,
  safeDiagnosticToken
}
