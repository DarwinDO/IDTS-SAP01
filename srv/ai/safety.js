// Học nhanh (DonHV): chặn secret/prompt nguy hiểm trước khi data đi vào AI provider hoặc diagnostic. Đây là security boundary của AI.
'use strict'

const SECRET_PATTERNS = Object.freeze([
  { name: 'awsAccessKey', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'brevoApiKey', regex: /\bxkeysib-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'bearerToken', regex: /\bbearer\s+[A-Za-z0-9._~+/-]{20,}/gi },
  { name: 'privateKey', regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
  { name: 'databaseUrl', regex: /\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi },
  { name: 'assignmentSecret', regex: /\b(?:api[_-]?key|password|token|secret)\s*[:=]\s*['"]?[^\s'",;{}<>]{8,}/gi }
])

const UNSAFE_ERROR_TOKENS = Object.freeze([
  'select',
  'insert',
  'update',
  'delete',
  'from ',
  'where ',
  'passwordhash',
  'tokenhash',
  'xkeysib-',
  'postgres://',
  'postgresql://',
  'bearer ',
  'aws_secret_access_key',
  'secret_access_key',
  'stack'
])

function redactSensitiveText (value, maxLength = 8000) {
  // Redact pattern secret/token/email/diagnostic và cắt độ dài trước response, audit hoặc log.
  if (value === undefined || value === null) return ''
  let text = String(value)
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern.regex, `[redacted:${pattern.name}]`)
  }
  if (text.length > maxLength) {
    const marker = '...[truncated]'
    if (maxLength <= marker.length) return text.slice(0, maxLength)
    return `${text.slice(0, maxLength - marker.length)}${marker}`
  }
  return text
}

function sanitizeDiagnosticToken (value, fallback = 'UNKNOWN') {
  // Chuẩn hóa mã lỗi/model/provider thành token allow-list, không phải auth token.
  if (value === undefined || value === null) return fallback
  const token = String(value).replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80)
  return token || fallback
}

function sanitizeErrorSummary (error) {
  // Biến Error/provider response thành summary generic không lộ stack, SQL, host hay key.
  const raw = redactSensitiveText(error?.message || error?.code || error?.name || 'AI provider failed.', 180)
  const lower = raw.toLowerCase()
  const unsafe = UNSAFE_ERROR_TOKENS.some(token => lower.includes(token))
  if (unsafe) return 'AI provider request failed.'
  return raw || 'AI provider request failed.'
}

function safeFeatureType (value) {
  // Chỉ giữ feature type hợp lệ để audit không nhận nhãn tùy ý từ client.
  return sanitizeDiagnosticToken(value || 'GENERAL', 'GENERAL').toUpperCase().slice(0, 40)
}

function containsUnsafeDiagnosticText (value) {
  // Phát hiện output còn dấu hiệu SQL/stack/secret để feature chuyển fallback thay vì trả text nguy hiểm.
  const raw = JSON.stringify(value || {})
  const lower = raw.toLowerCase()
  return UNSAFE_ERROR_TOKENS.some(token => lower.includes(token)) ||
    SECRET_PATTERNS.some(pattern => {
      pattern.regex.lastIndex = 0
      return pattern.regex.test(raw)
    })
}

module.exports = {
  containsUnsafeDiagnosticText,
  redactSensitiveText,
  safeFeatureType,
  sanitizeDiagnosticToken,
  sanitizeErrorSummary
}
