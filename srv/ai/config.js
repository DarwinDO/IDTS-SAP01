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
  fallbackEnabled: false,
  fallbackModelAlias: null,
  fallbackEmbeddingModelAlias: null,
  mockMode: 'success',
  mockEmbeddingDimensions: 8
})

const SUPPORTED_PROVIDERS = Object.freeze(['mock', 'openai', 'vercel'])
const SUPPORTED_MOCK_MODES = Object.freeze(['success', 'error', 'timeout'])

function getAiConfig () {
  // Đọc CAP private config và trả bản normalize; feature modules không đọc API key trực tiếp.
  return normalizeAiConfig({
    ...(cds.env.idts?.ai || {}),
    ...runtimeOverrides(process.env),
    gatewayApiKey: toStringOrNull(process.env.AI_GATEWAY_API_KEY) || readGatewayApiKeyFromVcap(process.env)
  })
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
    modelAlias: safeModelId(raw.modelAlias) || DEFAULTS.modelAlias,
    // `null` explicit cho phép pha Ling tắt embedding: Similar Bugs vẫn dùng lexical fallback hiện có.
    // Khi field không được cấu hình (`undefined`), giữ compatibility cũ: dùng model chat làm default alias.
    embeddingModelAlias: raw.embeddingModelAlias === null
      ? null
      : safeModelId(raw.embeddingModelAlias) || safeModelId(raw.modelAlias) || DEFAULTS.embeddingModelAlias,
    fallbackEnabled: toBoolean(raw.fallbackEnabled, DEFAULTS.fallbackEnabled),
    fallbackModelAlias: safeModelId(raw.fallbackModelAlias) || DEFAULTS.fallbackModelAlias,
    fallbackEmbeddingModelAlias: safeModelId(raw.fallbackEmbeddingModelAlias) || DEFAULTS.fallbackEmbeddingModelAlias,
    mockMode,
    mockResponseText: toStringOrNull(raw.mockResponseText),
    mockStructuredOutput: normalizeMockStructuredOutput(raw.mockStructuredOutput),
    mockEmbeddingDimensions: toPositiveInteger(raw.mockEmbeddingDimensions, DEFAULTS.mockEmbeddingDimensions)
  }

  config.openaiApiKey = config.provider === 'openai'
    ? toStringOrNull(raw.openaiApiKey) || toStringOrNull(process.env.OPENAI_API_KEY)
    : null
  config.gatewayApiKey = config.provider === 'vercel'
    ? toStringOrNull(raw.gatewayApiKey) || toStringOrNull(raw.aiGatewayApiKey) || toStringOrNull(process.env.AI_GATEWAY_API_KEY)
    : null

  config.unsupported = config.enabled && !SUPPORTED_PROVIDERS.includes(config.provider)
  config.missing = []
  if (config.unsupported) config.missing.push('supportedProvider')
  if (config.enabled && config.provider === 'openai' && !config.openaiApiKey) config.missing.push('openaiApiKey')
  if (config.enabled && config.provider === 'openai' && !config.modelAlias) config.missing.push('modelAlias')
  if (config.enabled && config.provider === 'vercel' && !config.gatewayApiKey) config.missing.push('gatewayApiKey')
  if (config.enabled && config.provider === 'vercel' && !config.modelAlias) config.missing.push('modelAlias')
  if (config.enabled && config.provider !== 'vercel' && config.fallbackEnabled) config.missing.push('vercelFallbackProvider')
  if (config.enabled && config.provider === 'vercel' && config.fallbackEnabled && !config.fallbackModelAlias) config.missing.push('fallbackModelAlias')
  config.ready = config.enabled && config.missing.length === 0
  return Object.freeze(config)
}

function runtimeOverrides (env = {}) {
  return Object.fromEntries([
    ['enabled', env.IDTS_AI_ENABLED],
    ['provider', env.IDTS_AI_PROVIDER],
    ['modelAlias', env.IDTS_AI_MODEL],
    ['embeddingModelAlias', env.IDTS_AI_EMBEDDING_MODEL],
    ['fallbackEnabled', env.IDTS_AI_FALLBACK_ENABLED],
    ['fallbackModelAlias', env.IDTS_AI_FALLBACK_MODEL],
    ['fallbackEmbeddingModelAlias', env.IDTS_AI_EMBEDDING_FALLBACK_MODEL],
    ['timeoutMs', env.IDTS_AI_TIMEOUT_MS],
    ['maxInputChars', env.IDTS_AI_MAX_INPUT_CHARS]
  ].filter(([, value]) => value !== undefined))
}

function readGatewayApiKeyFromVcap (env = {}) {
  // Trust only the dedicated AI binding, never the retained S3/Brevo binding.
  const services = parseVcapServices(env.VCAP_SERVICES)
  for (const instances of Object.values(services)) {
    if (!Array.isArray(instances)) continue
    const binding = instances.find(instance => instance?.name === 'idts-sap01-ai-gateway')
    const credentials = binding?.credentials
    if (!credentials || typeof credentials !== 'object') continue
    return toStringOrNull(credentials.gatewayApiKey) ||
      toStringOrNull(credentials.aiGatewayApiKey) ||
      toStringOrNull(credentials.AI_GATEWAY_API_KEY)
  }
  return null
}

function parseVcapServices (value) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
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

function safeModelId (value) {
  if (value === undefined || value === null) return null
  const model = String(value).trim().toLowerCase()
  if (!model || model.includes('://') || model.includes('..')) return null
  return /^[a-z0-9][a-z0-9_.\/-]{0,119}$/.test(model) ? model : null
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
  normalizeAiConfig,
  runtimeOverrides,
  readGatewayApiKeyFromVcap,
  safeModelId
}
