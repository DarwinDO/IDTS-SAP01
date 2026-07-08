'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { FEATURE_TYPES, createAiSuggestion } = require('./audit')
const { createAiProvider } = require('./provider')
const { tokenSimilarity } = require('./duplicate-detection')
const { sanitizeErrorSummary } = require('./safety')
const { resolveRequestUser } = require('../bug-service/helpers')

const LOW_CONFIDENCE_THRESHOLD = 0.6
const MIN_FALLBACK_SCORE = 0.32

const FIELD_DEFS = [
  {
    key: 'sapModule',
    label: 'SAP Module',
    catalogKey: 'sapModules',
    sourceID: 'sapModule_ID',
    providerKeys: ['sapModule', 'sapModuleID', 'sapModuleCode', 'sapModuleName']
  },
  {
    key: 'applicationComponent',
    label: 'Application Component',
    catalogKey: 'applicationComponents',
    sourceID: 'applicationComponent_ID',
    providerKeys: ['applicationComponent', 'applicationComponentID', 'applicationComponentCode', 'applicationComponentName']
  },
  {
    key: 'defectCategory',
    label: 'Defect Category',
    catalogKey: 'defectCategories',
    sourceID: 'defectCategory_ID',
    providerKeys: ['defectCategory', 'defectCategoryID', 'defectCategoryCode', 'defectCategoryName']
  },
  {
    key: 'priority',
    label: 'Priority',
    catalogKey: 'priorityValues',
    sourceCode: 'priority_code',
    providerKeys: ['priority', 'priorityCode', 'priorityName']
  },
  {
    key: 'severity',
    label: 'Severity',
    catalogKey: 'severityValues',
    sourceCode: 'severity_code',
    providerKeys: ['severity', 'severityCode', 'severityName']
  }
]

async function suggestClassification (req, entities, dependencies = {}) {
  const tx = cds.tx(req)
  const provider = dependencies.provider || createAiProvider()
  const input = await resolveClassificationInput(tx, req, entities, req.data || {})

  if (!hasBugContext(input)) {
    return req.reject(400, 'Provide a bug title, description, reproduction context, or source bug to suggest classification.')
  }

  const catalogs = await readCatalogs(tx, entities)
  const providerResult = await provider.structured({
    featureType: FEATURE_TYPES.CLASSIFICATION,
    schemaName: 'IdtsClassificationSuggestion',
    correlationId: req.id,
    instruction: [
      'Suggest existing IDTS catalog values for bug classification.',
      'Return only values from the provided catalogs.',
      'Include confidence between 0 and 1 and short business-facing reasons.',
      'Do not invent catalog values and do not include private data.'
    ].join(' '),
    input: {
      bug: buildProviderBugInput(input),
      catalogs: buildProviderCatalogInput(catalogs)
    }
  })

  const result = buildClassificationSuggestions({
    input,
    catalogs,
    providerResult
  })

  await recordClassificationAudit({
    tx,
    req,
    entities,
    input,
    provider,
    providerResult,
    result
  })

  return result
}

async function resolveClassificationInput (tx, req, entities, data) {
  if (data.sourceBugID) {
    const source = await tx.run(
      SELECT.one.from(entities.Bugs)
        .where({ ID: data.sourceBugID })
    )
    if (!source) return req.reject(404, 'Source bug was not found.')
    return {
      sourceBugID: data.sourceBugID,
      title: source.title,
      description: source.description,
      stepsToReproduce: source.stepsToReproduce,
      actualResult: source.actualResult,
      expectedResult: source.expectedResult,
      sapModule_ID: source.sapModule_ID,
      applicationComponent_ID: source.applicationComponent_ID,
      defectCategory_ID: source.defectCategory_ID,
      priority_code: source.priority_code,
      severity_code: source.severity_code
    }
  }

  return {
    sourceBugID: null,
    title: cleanText(data.title),
    description: cleanText(data.description),
    stepsToReproduce: cleanText(data.stepsToReproduce),
    actualResult: cleanText(data.actualResult),
    expectedResult: cleanText(data.expectedResult),
    sapModule_ID: data.sapModuleID || null,
    applicationComponent_ID: data.applicationComponentID || null,
    defectCategory_ID: data.defectCategoryID || null,
    priority_code: cleanCode(data.priorityCode),
    severity_code: cleanCode(data.severityCode)
  }
}

async function readCatalogs (tx, entities) {
  const [sapModules, applicationComponents, defectCategories, priorityValues, severityValues] = await Promise.all([
    tx.run(SELECT.from(entities.SAPModules).columns('ID', 'code', 'name', 'active')),
    tx.run(SELECT.from(entities.ApplicationComponents).columns('ID', 'code', 'name', 'componentType', 'active')),
    tx.run(SELECT.from(entities.DefectCategories).columns('ID', 'code', 'name', 'categoryType', 'active')),
    tx.run(SELECT.from(entities.PriorityValues).columns('code', 'name', 'criticality', 'active')),
    tx.run(SELECT.from(entities.SeverityValues).columns('code', 'name', 'criticality', 'active'))
  ])

  return {
    sapModules,
    applicationComponents,
    defectCategories,
    priorityValues,
    severityValues
  }
}

function buildClassificationSuggestions ({ input, catalogs, providerResult }) {
  const payload = providerPayload(providerResult)
  const providerStatus = providerResult?.status || 'AI_PROVIDER_ERROR'

  return FIELD_DEFS.map(field => {
    const raw = providerResult?.ok ? extractProviderValue(payload, field) : null
    if (raw?.hasValue) {
      return resolveProviderSuggestion({ field, raw, catalogs, providerStatus })
    }
    return fallbackSuggestion({ field, input, catalogs, providerStatus })
  })
}

function resolveProviderSuggestion ({ field, raw, catalogs, providerStatus }) {
  const row = findCatalogRow(catalogs[field.catalogKey], raw)
  const confidence = confidenceFor(raw)

  if (!row) {
    return suggestionRow({
      field,
      providerStatus,
      confidence,
      status: 'INVALID_PROVIDER_VALUE',
      reason: `${field.label} suggestion is not an active IDTS catalog value.`,
      requiresReview: true
    })
  }

  if (row.active === false) {
    return suggestionRow({
      field,
      providerStatus,
      confidence,
      status: 'INVALID_PROVIDER_VALUE',
      reason: `${field.label} suggestion exists but is inactive.`,
      requiresReview: true
    })
  }

  const status = confidence < LOW_CONFIDENCE_THRESHOLD ? 'LOW_CONFIDENCE' : 'SUGGESTED'
  return suggestionRow({
    field,
    row,
    providerStatus,
    confidence,
    status,
    reason: safeReason(raw.reason) || defaultReason(field, row, confidence),
    requiresReview: true
  })
}

function fallbackSuggestion ({ field, input, catalogs, providerStatus }) {
  const sourceValue = sourceValueFor(field, input)
  if (sourceValue) {
    const existing = findCatalogRow(catalogs[field.catalogKey], { id: sourceValue, code: sourceValue, name: sourceValue })
    if (existing?.active !== false) {
      return suggestionRow({
        field,
        row: existing,
        providerStatus,
        confidence: 0.52,
        status: 'LOW_CONFIDENCE',
        reason: `Uses the current ${field.label.toLowerCase()} on the bug as a review starting point.`,
        requiresReview: true
      })
    }
  }

  const text = bugText(input)
  const ranked = catalogs[field.catalogKey]
    .filter(row => row.active !== false)
    .map(row => ({
      row,
      score: fallbackScore(field, row, text)
    }))
    .sort((left, right) => right.score - left.score)

  const best = ranked[0]
  if (!best || best.score < MIN_FALLBACK_SCORE) {
    return suggestionRow({
      field,
      providerStatus,
      status: providerStatus === 'SUCCESS' ? 'NO_SUGGESTION' : providerStatus,
      reason: providerStatus === 'SUCCESS'
        ? `No safe ${field.label.toLowerCase()} suggestion met the review threshold.`
        : safeProviderReason(providerStatus),
      requiresReview: true
    })
  }

  const confidence = Math.min(0.58, Math.max(0.35, best.score))
  return suggestionRow({
    field,
    row: best.row,
    providerStatus,
    confidence,
    status: 'LOW_CONFIDENCE',
    reason: `Deterministic fallback matched bug text to ${field.label.toLowerCase()} catalog terms.`,
    requiresReview: true
  })
}

function fallbackScore (field, row, text) {
  const rowText = [row.code, row.name, row.componentType, row.categoryType].filter(Boolean).join(' ')
  const lexical = tokenSimilarity(text, rowText)
  const keyword = keywordScore(field, row, text)
  return Math.max(lexical, keyword)
}

function keywordScore (field, row, text) {
  const normalized = String(text || '').toLowerCase()
  const code = String(row.code || '').toUpperCase()
  if (field.key === 'priority' || field.key === 'severity') {
    if (/blocker|critical|cannot|crash|security|data loss|login/i.test(normalized) && ['CRITICAL', 'BLOCKER', 'HIGH'].includes(code)) return 0.56
    if (/minor|typo|cosmetic|layout/i.test(normalized) && ['LOW', 'MINOR'].includes(code)) return 0.48
    if (/major|broken|failed|error|wrong/i.test(normalized) && ['MAJOR', 'HIGH'].includes(code)) return 0.50
  }
  if (field.key === 'defectCategory') {
    if (/login|permission|authorization|auth/i.test(normalized) && code === 'AUTH') return 0.56
    if (/database|sql|postgres|sqlite|data/i.test(normalized) && ['DATABASE', 'DATA_QUALITY'].includes(code)) return 0.54
    if (/workflow|status|assign|route/i.test(normalized) && code === 'WORKFLOW') return 0.52
    if (/fiori|ui5|screen|button|layout|page/i.test(normalized) && code === 'FIORI_UI5') return 0.52
  }
  if (field.key === 'applicationComponent') {
    if (/notification|email|mail/i.test(normalized) && code === 'IDTS_NOTIFICATIONS') return 0.52
    if (/assign|developer|owner/i.test(normalized) && code === 'IDTS_ASSIGNMENT') return 0.52
    if (/fiori|ui|screen|layout|page/i.test(normalized) && code === 'IDTS_FIORI_UI') return 0.52
    if (/cap|odata|service|backend/i.test(normalized) && code === 'IDTS_CAP_SERVICE') return 0.52
    if (/database|postgres|sqlite|schema/i.test(normalized) && code === 'IDTS_DB_MODEL') return 0.52
  }
  return 0
}

async function recordClassificationAudit ({ tx, req, entities, input, provider, providerResult, result }) {
  if (!input.sourceBugID) return

  const requester = await resolveRequestUser(req, entities)
  if (!requester) return

  const validRows = result.filter(row => row.valueCode || row.valueID)
  const bestConfidence = validRows.reduce((max, row) => Math.max(max, Number(row.confidence || 0)), 0) || null

  await createAiSuggestion(tx, {
    bugID: input.sourceBugID,
    requestedByID: requester.ID,
    featureType: FEATURE_TYPES.CLASSIFICATION,
    providerAlias: providerResult?.providerAlias || provider?.config?.provider || null,
    modelAlias: providerResult?.modelAlias || provider?.config?.modelAlias || null,
    confidence: bestConfidence,
    correlationId: providerResult?.correlationId || req.id,
    summary: summarizeResult(result),
    suggestionPayload: {
      providerStatus: providerResult?.status || 'AI_PROVIDER_ERROR',
      suggestions: result.map(row => ({
        field: row.field,
        valueID: row.valueID || null,
        valueCode: row.valueCode || null,
        valueName: row.valueName || null,
        confidence: row.confidence ?? null,
        status: row.status,
        reason: row.reason
      }))
    }
  })
}

function extractProviderValue (payload, field) {
  const direct = field.providerKeys.map(key => payload?.[key]).find(value => value !== undefined && value !== null)
  const nested = payload?.classification?.[field.key] || payload?.fields?.[field.key]
  const arrayValue = Array.isArray(payload?.suggestions)
    ? payload.suggestions.find(entry => normalizeKey(entry?.field || entry?.name) === normalizeKey(field.key))
    : null
  return normalizeProviderValue(direct ?? nested ?? arrayValue)
}

function normalizeProviderValue (value) {
  if (value === undefined || value === null || value === '') return { hasValue: false }
  if (typeof value === 'string') {
    return { hasValue: true, code: cleanCode(value), name: cleanText(value), confidence: null, reason: null }
  }
  if (typeof value !== 'object') return { hasValue: false }
  const id = cleanText(value.ID || value.id || value.valueID)
  const code = cleanCode(value.code || value.valueCode || value.Code)
  const name = cleanText(value.name || value.valueName || value.label || value.text)
  return {
    hasValue: Boolean(id || code || name),
    id,
    code,
    name,
    confidence: Number(value.confidence ?? value.score),
    reason: cleanText(value.reason || value.explanation)
  }
}

function findCatalogRow (rows, raw) {
  const id = cleanText(raw.id)
  const code = cleanCode(raw.code)
  const name = normalizeText(raw.name)

  return rows.find(row => {
    if (id && normalizeText(row.ID) === normalizeText(id)) return true
    if (code && cleanCode(row.code) === code) return true
    if (name && normalizeText(row.name) === name) return true
    return false
  }) || null
}

function providerPayload (providerResult) {
  const data = providerResult?.data
  if (data?.json && typeof data.json === 'object') return data.json
  return data && typeof data === 'object' ? data : {}
}

function buildProviderBugInput (input) {
  return {
    title: cleanText(input.title),
    description: cleanText(input.description),
    stepsToReproduce: cleanText(input.stepsToReproduce),
    actualResult: cleanText(input.actualResult),
    expectedResult: cleanText(input.expectedResult),
    existingClassification: {
      sapModuleID: input.sapModule_ID || null,
      applicationComponentID: input.applicationComponent_ID || null,
      defectCategoryID: input.defectCategory_ID || null,
      priorityCode: input.priority_code || null,
      severityCode: input.severity_code || null
    }
  }
}

function buildProviderCatalogInput (catalogs) {
  return Object.fromEntries(Object.entries(catalogs).map(([key, rows]) => [
    key,
    rows
      .filter(row => row.active !== false)
      .map(row => ({
        ID: row.ID || null,
        code: row.code || null,
        name: row.name || null,
        type: row.componentType || row.categoryType || null
      }))
  ]))
}

function suggestionRow ({ field, row = null, providerStatus, confidence = null, status, reason, requiresReview }) {
  return {
    field: field.key,
    fieldLabel: field.label,
    valueID: row?.ID || null,
    valueCode: row?.code || null,
    valueName: row?.name || null,
    confidence: confidence === null || Number.isNaN(Number(confidence)) ? null : roundConfidence(confidence),
    reason: safeReason(reason),
    status,
    providerStatus,
    requiresReview: Boolean(requiresReview)
  }
}

function summarizeResult (result) {
  const suggested = result.filter(row => row.status === 'SUGGESTED').length
  const review = result.filter(row => row.status === 'LOW_CONFIDENCE').length
  const invalid = result.filter(row => row.status === 'INVALID_PROVIDER_VALUE').length
  if (invalid) return `Classification suggestion returned ${invalid} invalid provider value(s) for review.`
  if (suggested) return `Classification suggestion found ${suggested} high-confidence value(s).`
  if (review) return `Classification suggestion found ${review} low-confidence value(s) requiring review.`
  return 'Classification suggestion did not find a safe catalog value.'
}

function sourceValueFor (field, input) {
  return field.sourceID ? input[field.sourceID] : input[field.sourceCode]
}

function hasBugContext (input) {
  return Boolean(bugText(input) || input.sourceBugID)
}

function bugText (input) {
  return [
    input.title,
    input.description,
    input.stepsToReproduce,
    input.actualResult,
    input.expectedResult
  ].filter(Boolean).join(' ')
}

function confidenceFor (raw) {
  const value = Number(raw?.confidence)
  if (Number.isFinite(value)) return Math.max(0, Math.min(1, value))
  return 0.5
}

function defaultReason (field, row, confidence) {
  return confidence < LOW_CONFIDENCE_THRESHOLD
    ? `${field.label} matches an active catalog value but needs human review because confidence is low.`
    : `${field.label} matches the active IDTS catalog value ${row.code || row.name}.`
}

function safeProviderReason (providerStatus) {
  if (providerStatus === 'AI_DISABLED') return 'AI assistance is disabled, so only deterministic fallback was available.'
  if (providerStatus === 'AI_TIMEOUT') return 'AI assistance timed out, so only deterministic fallback was available.'
  if (providerStatus === 'AI_PROVIDER_UNSUPPORTED') return 'AI provider is not supported in this environment.'
  if (providerStatus === 'AI_PROVIDER_ERROR') return 'AI provider failed safely; no provider details are exposed.'
  return sanitizeErrorSummary(new Error('AI provider did not return a usable classification suggestion.'))
}

function cleanText (value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCode (value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function normalizeText (value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeKey (value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

function safeReason (value) {
  const text = cleanText(value)
  return text.slice(0, 500)
}

function roundConfidence (value) {
  return Number(Math.max(0, Math.min(1, Number(value))).toFixed(4))
}

module.exports = {
  suggestClassification,
  buildClassificationSuggestions,
  extractProviderValue,
  findCatalogRow
}
