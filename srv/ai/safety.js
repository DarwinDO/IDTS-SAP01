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
  if (value === undefined || value === null) return ''
  let text = String(value)
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern.regex, `[redacted:${pattern.name}]`)
  }
  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}…[truncated]`
  }
  return text
}

function sanitizeDiagnosticToken (value, fallback = 'UNKNOWN') {
  if (value === undefined || value === null) return fallback
  const token = String(value).replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80)
  return token || fallback
}

function sanitizeErrorSummary (error) {
  const raw = redactSensitiveText(error?.message || error?.code || error?.name || 'AI provider failed.', 180)
  const lower = raw.toLowerCase()
  const unsafe = UNSAFE_ERROR_TOKENS.some(token => lower.includes(token))
  if (unsafe) return 'AI provider request failed.'
  return raw || 'AI provider request failed.'
}

function safeFeatureType (value) {
  return sanitizeDiagnosticToken(value || 'GENERAL', 'GENERAL').toUpperCase().slice(0, 40)
}

function containsUnsafeDiagnosticText (value) {
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
