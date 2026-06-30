'use strict'

const cds = require('@sap/cds')

const DEFAULTS = Object.freeze({
  enabled: false,
  secure: false,
  maxRetryCount: 2,
  pollIntervalMs: 15000,
  batchSize: 10,
  maxConnections: 3,
  testMode: false
})

function getEmailConfig () {
  return normalizeEmailConfig(cds.env.idts?.email || {})
}

function normalizeEmailConfig (raw = {}) {
  const config = {
    enabled: toBoolean(raw.enabled, DEFAULTS.enabled),
    host: toStringOrNull(raw.host),
    port: toPositiveInteger(raw.port, 587),
    secure: toBoolean(raw.secure, DEFAULTS.secure),
    username: toStringOrNull(raw.username),
    password: toStringOrNull(raw.password),
    fromAddress: toStringOrNull(raw.fromAddress),
    fromName: toStringOrNull(raw.fromName) || 'IDTS',
    replyTo: toStringOrNull(raw.replyTo),
    baseUrl: trimTrailingSlash(toStringOrNull(raw.baseUrl)),
    maxRetryCount: toNonNegativeInteger(raw.maxRetryCount, DEFAULTS.maxRetryCount),
    pollIntervalMs: toPositiveInteger(raw.pollIntervalMs, DEFAULTS.pollIntervalMs),
    batchSize: toPositiveInteger(raw.batchSize, DEFAULTS.batchSize),
    maxConnections: toPositiveInteger(raw.maxConnections, DEFAULTS.maxConnections),
    testMode: toBoolean(raw.testMode, DEFAULTS.testMode),
    defaultTestRecipient: toStringOrNull(raw.defaultTestRecipient)
  }

  config.missing = requiredFields(config).filter(field => !config[field])
  if (config.fromAddress && !isSafeEmailAddress(config.fromAddress)) config.missing.push('fromAddress')
  if (config.testMode && config.defaultTestRecipient && !isSafeEmailAddress(config.defaultTestRecipient)) {
    config.missing.push('defaultTestRecipient')
  }
  config.missing = [...new Set(config.missing)]
  config.ready = config.enabled && config.missing.length === 0
  return Object.freeze(config)
}

function requiredFields (config) {
  const fields = ['host', 'port', 'username', 'password', 'fromAddress']
  if (config.testMode) fields.push('defaultTestRecipient')
  return fields
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

function toNonNegativeInteger (value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function toStringOrNull (value) {
  if (value === undefined || value === null) return null
  const normalized = String(value).trim()
  return normalized || null
}

function trimTrailingSlash (value) {
  return value?.replace(/\/+$/, '') || null
}

function isSafeEmailAddress (value) {
  return typeof value === 'string' && !/[\r\n]/.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

module.exports = {
  DEFAULTS,
  getEmailConfig,
  isSafeEmailAddress,
  normalizeEmailConfig
}
