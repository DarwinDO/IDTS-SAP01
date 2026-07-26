'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const {
  redactSensitiveText,
  sanitizeDiagnosticToken
} = require('./safety')

const LOG = cds.log('idts-ai-metrics')
const DEFAULT_WINDOW_DAYS = 30
const MAX_WINDOW_DAYS = 90

const UNAVAILABLE_STATUSES = new Set([
  'AI_DISABLED',
  'AI_CONFIGURATION_INCOMPLETE',
  'AI_PROVIDER_UNSUPPORTED'
])

function safeToken (value, fallback, maxLength) {
  const redacted = redactSensitiveText(value, maxLength)
  return sanitizeDiagnosticToken(redacted || fallback, fallback).slice(0, maxLength)
}

function normalizeLatency (value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  return Math.min(Math.round(number), 2147483647)
}

function outcomeForStatus (value) {
  const status = safeToken(value, 'UNKNOWN', 40).toUpperCase()
  if (status === 'SUCCESS') return 'SUCCESS'
  if (status === 'AI_TIMEOUT') return 'TIMEOUT'
  if (UNAVAILABLE_STATUSES.has(status)) return 'UNAVAILABLE'
  return 'FAILURE'
}

function safeOperationalMetric (result = {}) {
  const status = safeToken(result.status, 'UNKNOWN', 40).toUpperCase()
  return Object.freeze({
    featureType: safeToken(result.featureType, 'GENERAL', 40).toUpperCase(),
    operation: safeToken(result.operation, 'unknown', 40).toLowerCase(),
    providerAlias: safeToken(result.providerAlias, 'not-configured', 80),
    modelAlias: safeToken(result.modelAlias, 'not-configured', 80),
    status,
    outcome: outcomeForStatus(status),
    latencyMs: normalizeLatency(result.durationMs)
  })
}

function emitAiOperationalMetric (result, logger = LOG) {
  const metric = safeOperationalMetric(result)
  try {
    logger.info('AI operation metric', metric)
  } catch {
    // Operational telemetry must never change the provider result or the Bug workflow.
  }
  return metric
}

function normalizeWindowDays (value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) return DEFAULT_WINDOW_DAYS
  return Math.min(number, MAX_WINDOW_DAYS)
}

function aggregateAiOperationalMetrics (rows = [], { windowStart, windowEnd } = {}) {
  const groups = new Map()
  for (const row of rows) {
    const featureTypeCode = safeToken(row.featureType_code, 'UNKNOWN', 40).toUpperCase()
    const providerAlias = safeToken(row.providerAlias, 'not-configured', 80)
    const modelAlias = safeToken(row.modelAlias, 'not-configured', 80)
    const key = `${featureTypeCode}\u0000${providerAlias}\u0000${modelAlias}`
    const group = groups.get(key) || {
      windowStart,
      windowEnd,
      featureTypeCode,
      providerAlias,
      modelAlias,
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      unavailableCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      ignoredCount: 0,
      pendingCount: 0,
      latencySampleCount: 0,
      averageLatencyMs: null,
      maxLatencyMs: null,
      _latencyTotal: 0
    }

    const outcome = outcomeForStatus(row.operationStatus)
    group.requestCount += 1
    if (outcome === 'SUCCESS') group.successCount += 1
    else group.failureCount += 1
    if (outcome === 'TIMEOUT') group.timeoutCount += 1
    if (outcome === 'UNAVAILABLE') group.unavailableCount += 1

    const reviewState = safeToken(row.reviewState_code, 'PENDING', 40).toUpperCase()
    if (reviewState === 'ACCEPTED') group.acceptedCount += 1
    else if (reviewState === 'REJECTED') group.rejectedCount += 1
    else if (reviewState === 'IGNORED') group.ignoredCount += 1
    else if (reviewState === 'PENDING') group.pendingCount += 1

    const latency = normalizeLatency(row.latencyMs)
    if (latency !== null) {
      group.latencySampleCount += 1
      group._latencyTotal += latency
      group.maxLatencyMs = Math.max(group.maxLatencyMs ?? 0, latency)
    }
    groups.set(key, group)
  }

  return [...groups.values()]
    .map(group => {
      if (group.latencySampleCount) {
        group.averageLatencyMs = Math.round(group._latencyTotal / group.latencySampleCount)
      }
      delete group._latencyTotal
      return group
    })
    .sort((left, right) =>
      left.featureTypeCode.localeCompare(right.featureTypeCode) ||
      left.providerAlias.localeCompare(right.providerAlias) ||
      left.modelAlias.localeCompare(right.modelAlias))
}

async function readAiOperationalMetrics (req) {
  const windowDays = normalizeWindowDays(req.data?.windowDays)
  const windowEnd = new Date()
  const windowStart = new Date(windowEnd.getTime() - (windowDays * 24 * 60 * 60 * 1000))
  const rows = await cds.tx(req).run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns(
        'featureType_code',
        'providerAlias',
        'modelAlias',
        'operationStatus',
        'latencyMs',
        'reviewState_code'
      )
      .where({ createdAt: { '>=': windowStart.toISOString() } })
  )
  return aggregateAiOperationalMetrics(rows, {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString()
  })
}

module.exports = {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  aggregateAiOperationalMetrics,
  emitAiOperationalMetric,
  normalizeLatency,
  normalizeWindowDays,
  outcomeForStatus,
  readAiOperationalMetrics,
  safeOperationalMetric
}
