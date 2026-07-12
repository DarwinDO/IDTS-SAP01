// Học nhanh (DonHV): lưu dấu vết AI suggestion đã sanitize. Audit chứng minh AI chỉ tư vấn, không tự đổi Bug/workflow.
'use strict'

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const {
  redactSensitiveText,
  sanitizeDiagnosticToken
} = require('./safety')

const FEATURE_TYPES = Object.freeze({
  DUPLICATE_DETECTION: 'DUPLICATE_DETECTION',
  CLASSIFICATION: 'CLASSIFICATION',
  BUG_SUMMARY: 'BUG_SUMMARY',
  ASSIGNMENT_EXPLANATION: 'ASSIGNMENT_EXPLANATION'
})

const REVIEW_STATES = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  IGNORED: 'IGNORED',
  EXPIRED: 'EXPIRED'
})

const FORBIDDEN_PAYLOAD_KEYS = new Set([
  'prompt',
  'rawprompt',
  'rawproviderresponse',
  'rawresponse',
  'messages',
  'request',
  'response',
  'stack',
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'apikey',
  'api_key',
  'secret'
])

function normalizeCode (value, fallback) {
  return sanitizeDiagnosticToken(value || fallback, fallback).toUpperCase().slice(0, 40)
}

function cleanText (value, maxLength) {
  if (value === undefined || value === null) return null
  const text = redactSensitiveText(String(value), maxLength).trim()
  return text || null
}

function normalizeConfidence (value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(1, Math.max(0, number)).toFixed(4)
}

function sanitizePayloadValue (value, depth = 0) {
  if (depth > 8) return '[redacted:max-depth]'
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'string') return redactSensitiveText(value, 2000)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map(item => sanitizePayloadValue(item, depth + 1))
      .filter(item => item !== undefined)
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !FORBIDDEN_PAYLOAD_KEYS.has(String(key).toLowerCase().replace(/[^a-z0-9_]/g, '')))
        .map(([key, item]) => [key, sanitizePayloadValue(item, depth + 1)])
        .filter(([, item]) => item !== undefined)
    )
  }
  return redactSensitiveText(String(value), 2000)
}

function serializeSuggestionPayload (payload) {
  const safePayload = sanitizePayloadValue(payload)
  const text = JSON.stringify(safePayload)
  if (!text || text === undefined) {
    throw Object.assign(new Error('AI suggestion payload is required.'), { statusCode: 400 })
  }
  return redactSensitiveText(text, 12000)
}

async function ensureActiveCode (tx, entityName, code, label) {
  const row = await tx.run(
    SELECT.one.from(entityName)
      .columns('code', 'active')
      .where({ code })
  )
  if (!row || row.active === false) {
    throw Object.assign(new Error(`${label} is not available for AI suggestion audit.`), { statusCode: 400 })
  }
}

async function ensureTargetExists (tx, entityName, id, label) {
  const row = await tx.run(
    SELECT.one.from(entityName)
      .columns('ID')
      .where({ ID: id })
  )
  if (!row) {
    throw Object.assign(new Error(`${label} does not exist for AI suggestion audit.`), { statusCode: 400 })
  }
}

async function createAiSuggestion (tx, data) {
  if (!tx || typeof tx.run !== 'function') {
    throw new Error('A CAP transaction or database service is required to create an AI suggestion audit row.')
  }

  const bugID = cleanText(data?.bugID || data?.bug_ID, 36)
  const requestedByID = cleanText(data?.requestedByID || data?.requestedBy_ID, 36)
  if (!bugID) throw Object.assign(new Error('bugID is required for AI suggestion audit.'), { statusCode: 400 })
  if (!requestedByID) throw Object.assign(new Error('requestedByID is required for AI suggestion audit.'), { statusCode: 400 })

  const featureType = normalizeCode(data.featureType, FEATURE_TYPES.BUG_SUMMARY)
  const reviewState = normalizeCode(data.reviewState, REVIEW_STATES.PENDING)
  await ensureActiveCode(tx, 'idts.cap.AiSuggestionFeatureTypes', featureType, 'featureType')
  await ensureActiveCode(tx, 'idts.cap.AiSuggestionReviewStates', reviewState, 'reviewState')
  await ensureTargetExists(tx, 'idts.cap.Bugs', bugID, 'bugID')
  await ensureTargetExists(tx, 'idts.cap.Users', requestedByID, 'requestedByID')

  const reviewedByID = cleanText(data?.reviewedByID || data?.reviewedBy_ID, 36)
  if (reviewedByID) await ensureTargetExists(tx, 'idts.cap.Users', reviewedByID, 'reviewedByID')

  const ID = data.ID || cds.utils.uuid()
  const entry = {
    ID,
    bug_ID: bugID,
    featureType_code: featureType,
    requestedBy_ID: requestedByID,
    providerAlias: cleanText(data.providerAlias, 80),
    modelAlias: cleanText(data.modelAlias, 80),
    confidence: normalizeConfidence(data.confidence),
    suggestionPayload: serializeSuggestionPayload(data.suggestionPayload || data.payload || data.suggestion),
    summary: cleanText(data.summary, 500),
    reviewState_code: reviewState,
    reviewedBy_ID: reviewedByID,
    reviewedAt: data.reviewedAt || null,
    expiresAt: data.expiresAt || null,
    correlationId: cleanText(data.correlationId, 80)
  }

  await tx.run(INSERT.into('idts.cap.AiSuggestions').entries(entry))
  return tx.run(SELECT.one.from('idts.cap.AiSuggestions').where({ ID }))
}

module.exports = {
  FEATURE_TYPES,
  REVIEW_STATES,
  createAiSuggestion,
  serializeSuggestionPayload
}
