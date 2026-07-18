// Học nhanh (DonHV): đọc AI feature config an toàn; provider/key thật chỉ được lấy từ private env và AI có thể tắt hoàn toàn.
'use strict'

const cds = require('@sap/cds')

const DEFAULTS = Object.freeze({
  enabled: false,
  provider: 'mock',
  timeoutMs: 10000,
  maxInputChars: 8000,
  modelAlias: null,
  embeddingModelAlias: null,
  mockMode: 'success',
  mockEmbeddingDimensions: 8
})

const SUPPORTED_PROVIDERS = Object.freeze(['mock', 'openai'])
const SUPPORTED_MOCK_MODES = Object.freeze(['success', 'error', 'timeout'])

function getAiConfig () {
  // Đọc CAP private config và trả bản normalize; feature modules không đọc API key trực tiếp.
  return normalizeAiConfig(cds.env.idts?.ai || {})
}

function normalizeAiConfig (raw = {}) {
  // Parse provider/mode/timeout/limits/model alias; secret chỉ ở config runtime, không đưa vào public result.
  const provider = normalizeProvider(raw.provider)
  const mockMode = normalizeMockMode(raw.mockMode)
  const config = {
    enabled: toBoolean(raw.enabled, DEFAULTS.enabled),
    provider,
    timeoutMs: toPositiveInteger(raw.timeoutMs, DEFAULTS.timeoutMs),
    maxInputChars: toPositiveInteger(raw.maxInputChars, DEFAULTS.maxInputChars),
    modelAlias: safeAlias(raw.modelAlias) || DEFAULTS.modelAlias,
    embeddingModelAlias: safeAlias(raw.embeddingModelAlias) || safeAlias(raw.modelAlias) || DEFAULTS.embeddingModelAlias,
    mockMode,
    mockResponseText: toStringOrNull(raw.mockResponseText),
    mockStructuredOutput: normalizeMockStructuredOutput(raw.mockStructuredOutput),
    mockEmbeddingDimensions: toPositiveInteger(raw.mockEmbeddingDimensions, DEFAULTS.mockEmbeddingDimensions)
  }

  config.openaiApiKey = config.provider === 'openai'
    ? toStringOrNull(raw.openaiApiKey) || toStringOrNull(process.env.OPENAI_API_KEY)
    : null

  config.unsupported = config.enabled && !SUPPORTED_PROVIDERS.includes(config.provider)
  config.missing = []
  if (config.unsupported) config.missing.push('supportedProvider')
  if (config.enabled && config.provider === 'openai' && !config.openaiApiKey) config.missing.push('openaiApiKey')
  if (config.enabled && config.provider === 'openai' && !config.modelAlias) config.missing.push('modelAlias')
  config.ready = config.enabled && config.missing.length === 0
  return Object.freeze(config)
}

function normalizeProvider (value) {
  // Chỉ cho provider được hỗ trợ; giá trị lạ fallback disabled/mock an toàn.
  return safeAlias(value) || DEFAULTS.provider
}

function normalizeMockMode (value) {
  // Chọn hành vi mock deterministic cho test failure/no-result/success.
  const mode = safeAlias(value) || DEFAULTS.mockMode
  return SUPPORTED_MOCK_MODES.includes(mode) ? mode : DEFAULTS.mockMode
}

function normalizeMockStructuredOutput (value) {
  // Parse structured fixture private với giới hạn; invalid không làm service crash.
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.freeze({ ...value })
  }
  return Object.freeze({
    suggestion: 'mock',
    confidence: 0.75
  })
}

function safeAlias (value) {
  // Cho phép model alias hiển thị/audit nhưng loại ký tự có thể lộ endpoint/secret.
  if (value === undefined || value === null) return null
  const alias = String(value).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '-').slice(0, 80)
  return alias || null
}

function toBoolean (value, fallback) {
  // Parse env boolean chính xác, tránh chuỗi `'false'` bị coi là true.
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function toPositiveInteger (value, fallback) {
  // Parse timeout/limit dương và fallback khi invalid.
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function toStringOrNull (value) {
  // Trim config string; rỗng thành null để completeness check hoạt động.
  if (value === undefined || value === null) return null
  const normalized = String(value).trim()
  return normalized || null
}

module.exports = {
  DEFAULTS,
  SUPPORTED_PROVIDERS,
  getAiConfig,
  normalizeAiConfig
}
