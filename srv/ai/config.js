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
  return normalizeAiConfig(cds.env.idts?.ai || {})
}

function normalizeAiConfig (raw = {}) {
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
  return safeAlias(value) || DEFAULTS.provider
}

function normalizeMockMode (value) {
  const mode = safeAlias(value) || DEFAULTS.mockMode
  return SUPPORTED_MOCK_MODES.includes(mode) ? mode : DEFAULTS.mockMode
}

function normalizeMockStructuredOutput (value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.freeze({ ...value })
  }
  return Object.freeze({
    suggestion: 'mock',
    confidence: 0.75
  })
}

function safeAlias (value) {
  if (value === undefined || value === null) return null
  const alias = String(value).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '-').slice(0, 80)
  return alias || null
}

function toBoolean (value, fallback) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function toPositiveInteger (value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function toStringOrNull (value) {
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
