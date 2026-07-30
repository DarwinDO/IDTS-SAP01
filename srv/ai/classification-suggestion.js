// Học nhanh (DonHV): gợi ý classification nhưng luôn validate với active catalog; user mới là người chọn/lưu giá trị cuối.
'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { FEATURE_TYPES, createAiSuggestion } = require('./audit')
const { createAiProvider } = require('./provider')
const { tokenSimilarity } = require('./duplicate-detection')
const {
  containsUnsafeDiagnosticText,
  redactSensitiveText,
  sanitizeErrorSummary
} = require('./safety')
const { resolveRequestUser } = require('../bug-service/helpers')

const LOW_CONFIDENCE_THRESHOLD = 0.6
const MIN_FALLBACK_SCORE = 0.32

const FIELD_DEFS = [
  {
    key: 'sapModule',
    label: 'SAP Module',
    referencePrefix: 'SM',
    catalogKey: 'sapModules',
    sourceID: 'sapModule_ID',
    providerKeys: ['sapModule', 'sapModuleID', 'sapModuleCode', 'sapModuleName']
  },
  {
    key: 'applicationComponent',
    label: 'Application Component',
    referencePrefix: 'AC',
    catalogKey: 'applicationComponents',
    sourceID: 'applicationComponent_ID',
    providerKeys: ['applicationComponent', 'applicationComponentID', 'applicationComponentCode', 'applicationComponentName']
  },
  {
    key: 'defectCategory',
    label: 'Defect Category',
    referencePrefix: 'DC',
    catalogKey: 'defectCategories',
    sourceID: 'defectCategory_ID',
    providerKeys: ['defectCategory', 'defectCategoryID', 'defectCategoryCode', 'defectCategoryName']
  },
  {
    key: 'priority',
    label: 'Priority',
    referencePrefix: 'P',
    catalogKey: 'priorityValues',
    sourceCode: 'priority_code',
    providerKeys: ['priority', 'priorityCode', 'priorityName']
  },
  {
    key: 'severity',
    label: 'Severity',
    referencePrefix: 'S',
    catalogKey: 'severityValues',
    sourceCode: 'severity_code',
    providerKeys: ['severity', 'severityCode', 'severityName']
  }
]

async function suggestClassification (req, entities, dependencies = {}) {
  // Entry point action: resolve Bug context, đọc catalog active, gọi provider structured nếu bật,
  // ground từng gợi ý vào catalog, audit và trả review-only; không PATCH classification của Bug.
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
      'For each selected value, return the exact catalogRef from its field catalog. Do not return UUIDs or free-text values.',
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

  const audit = await recordClassificationAudit({
    tx,
    req,
    entities,
    input,
    provider,
    providerResult,
    result
  })
  if (audit?.ID) {
    for (const row of result) row.suggestionID = audit.ID
  }

  return result
}

async function resolveClassificationInput (tx, req, entities, data) {
  // Ghép source Bug với text/code input cho phép; output là context đã clean dùng chung cho fallback/provider.
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
  // Đọc toàn bộ catalog active liên quan trong một transaction để provider output luôn được kiểm chứng.
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
  // Dựng một row cho mỗi field; provider value sai/không có được thay bằng deterministic fallback hoặc no-result.
  const payload = providerPayload(providerResult)
  const unsafeProviderOutput = containsUnsafeDiagnosticText(payload)
  const providerStatus = unsafeProviderOutput ? 'AI_OUTPUT_UNSAFE' : (providerResult?.status || 'AI_PROVIDER_ERROR')

  return FIELD_DEFS.map(field => {
    const raw = providerResult?.ok && !unsafeProviderOutput ? extractProviderValue(payload, field) : null
    if (raw?.hasValue) {
      return resolveProviderSuggestion({ field, raw, catalogs, providerStatus })
    }
    return fallbackSuggestion({ field, input, catalogs, providerStatus })
  })
}

function resolveProviderSuggestion ({ field, raw, catalogs, providerStatus }) {
  // Parse output của một field, tìm row catalog thật và tạo confidence/reason an toàn.
  const row = findCatalogRow(catalogs[field.catalogKey], raw, field)
  const confidence = confidenceFor(raw)

  if (!row) {
    return suggestionRow({
      field,
      providerStatus,
      confidence,
      status: 'INVALID_PROVIDER_VALUE',
      suggestionSource: 'NONE',
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
      suggestionSource: 'NONE',
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
    suggestionSource: 'AI',
    reason: safeReason(raw.reason) || defaultReason(field, row, confidence),
    requiresReview: true
  })
}

function fallbackSuggestion ({ field, input, catalogs, providerStatus }) {
  // Chấm keyword/context local khi provider unavailable; vẫn yêu cầu user review trước khi áp dụng.
  const sourceValue = sourceValueFor(field, input)
  if (sourceValue) {
    const existing = findCatalogRow(catalogs[field.catalogKey], { id: sourceValue, code: sourceValue, name: sourceValue }, field)
    if (existing?.active !== false) {
      return suggestionRow({
        field,
        row: existing,
        providerStatus,
        confidence: 0.52,
        status: 'LOW_CONFIDENCE',
        suggestionSource: 'RULES',
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
      suggestionSource: 'NONE',
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
    suggestionSource: 'RULES',
    reason: `Deterministic fallback matched bug text to ${field.label.toLowerCase()} catalog terms.`,
    requiresReview: true
  })
}

function fallbackScore (field, row, text) {
  // Kết hợp exact/current value và keyword score để chọn catalog candidate deterministic.
  const rowText = [row.code, row.name, row.componentType, row.categoryType].filter(Boolean).join(' ')
  const lexical = tokenSimilarity(text, rowText)
  const keyword = keywordScore(field, row, text)
  return Math.max(lexical, keyword)
}

function keywordScore (field, row, text) {
  // So token của title/description với code/name/keywords catalog, không dùng model.
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
  // Lưu source, grounded suggestion và provider status đã sanitize vào AISuggestions.
  if (!input.sourceBugID) return

  const requester = await resolveRequestUser(req, entities)
  if (!requester) return

  const validRows = result.filter(row => row.valueCode || row.valueID)
  const bestConfidence = validRows.reduce((max, row) => Math.max(max, Number(row.confidence || 0)), 0) || null

  return createAiSuggestion(tx, {
    bugID: input.sourceBugID,
    requestedByID: requester.ID,
    featureType: FEATURE_TYPES.CLASSIFICATION,
    providerAlias: providerResult?.providerAlias || provider?.config?.provider || null,
    modelAlias: providerResult?.modelAlias || provider?.config?.modelAlias || null,
    operationStatus: result.find(row => row.providerStatus && row.providerStatus !== 'SUCCESS')?.providerStatus ||
      result[0]?.providerStatus ||
      providerResult?.status ||
      'AI_PROVIDER_ERROR',
    latencyMs: providerResult?.durationMs,
    confidence: bestConfidence,
    correlationId: providerResult?.correlationId || req.id,
    summary: summarizeResult(result),
    suggestionPayload: {
      providerStatus: providerResult?.status || 'AI_PROVIDER_ERROR',
      sourceClassification: {
        sapModuleID: input.sapModule_ID || null,
        applicationComponentID: input.applicationComponent_ID || null,
        defectCategoryID: input.defectCategory_ID || null,
        priorityCode: input.priority_code || null,
        severityCode: input.severity_code || null
      },
      suggestions: result.map(row => ({
        field: row.field,
        valueID: row.valueID || null,
        valueCode: row.valueCode || null,
        valueName: row.valueName || null,
        confidence: row.confidence ?? null,
        status: row.status,
        suggestionSource: row.suggestionSource,
        reason: row.reason
      }))
    }
  })
}

function extractProviderValue (payload, field) {
  // Lấy value từ các shape structured output được hỗ trợ; field khác bị bỏ.
  const direct = field.providerKeys.map(key => payload?.[key]).find(value => value !== undefined && value !== null)
  const nested = payload?.classification?.[field.key] || payload?.fields?.[field.key]
  const arrayValue = Array.isArray(payload?.suggestions)
    ? payload.suggestions.find(entry => normalizeKey(entry?.field || entry?.name) === normalizeKey(field.key))
    : null
  return normalizeProviderValue(direct ?? nested ?? arrayValue)
}

function normalizeProviderValue (value) {
  // Chuẩn hóa string/object provider thành `{code, confidence, reason}` giới hạn.
  if (value === undefined || value === null || value === '') return { hasValue: false }
  if (typeof value === 'string') {
    return { hasValue: true, code: cleanCode(value), name: cleanText(value), confidence: null, reason: null }
  }
  if (typeof value !== 'object') return { hasValue: false }
  const catalogRef = cleanCode(value.catalogRef || value.reference)
  const id = cleanText(value.ID || value.id || value.valueID)
  const code = cleanCode(value.code || value.valueCode || value.Code)
  const name = cleanText(value.name || value.valueName || value.label || value.text)
  return {
    hasValue: Boolean(catalogRef || id || code || name),
    catalogRef,
    id,
    code,
    name,
    confidence: Number(value.confidence ?? value.score),
    reason: cleanText(value.reason || value.explanation)
  }
}

function findCatalogRow (rows, raw, field) {
  // Ưu tiên catalogRef ngắn; code/name chỉ giữ tương thích mock/legacy, không gửi ID cho provider mới.
  const catalogRef = cleanCode(raw.catalogRef)
  const id = cleanText(raw.id)
  const code = cleanCode(raw.code)
  const name = normalizeText(raw.name)

  const activeRows = rows.filter(row => row.active !== false)
  const referenced = activeRows.find((row, index) => catalogRefFor(field, index) === catalogRef)
  if (
    catalogRef &&
    referenced &&
    (!code || cleanCode(referenced.code) === code) &&
    (!name || normalizeText(referenced.name) === name)
  ) return referenced

  return rows.find(row => {
    if (id && normalizeText(row.ID) === normalizeText(id)) return true
    if (code && cleanCode(row.code) === code) return true
    if (name && normalizeText(row.name) === name) return true
    return false
  }) || null
}

function providerPayload (providerResult) {
  // Lấy payload thành công; failure/no-data trả object rỗng để fallback.
  const data = providerResult?.data
  if (data?.json && typeof data.json === 'object') return data.json
  return data && typeof data === 'object' ? data : {}
}

function buildProviderBugInput (input) {
  // Chọn field Bug tối thiểu gửi AI, loại comment/attachment/user/secret.
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
  // Provider chỉ nhận ref ngắn + label/code; UUID ở catalog không cần rời khỏi backend.
  return Object.fromEntries(FIELD_DEFS.map(field => [
    field.catalogKey,
    (catalogs[field.catalogKey] || [])
      .filter(row => row.active !== false)
      .map((row, index) => ({
        catalogRef: catalogRefFor(field, index),
        code: row.code || null,
        name: row.name || null,
        type: row.componentType || row.categoryType || null
      }))
  ]))
}

function catalogRefFor (field, index) {
  return field && field.referencePrefix ? `${field.referencePrefix}${index + 1}` : ''
}

function suggestionRow ({ field, row = null, providerStatus, confidence = null, status, suggestionSource, reason, requiresReview }) {
  // Dựng response row thống nhất; `requiresReview` luôn bảo vệ quyết định cuối của user.
  return {
    field: field.key,
    fieldLabel: field.label,
    valueID: row?.ID || null,
    valueCode: row?.code || null,
    valueName: row?.name || null,
    confidence: confidence === null || Number.isNaN(Number(confidence)) ? null : roundConfidence(confidence),
    reason: safeReason(reason),
    status,
    suggestionSource: suggestionSource === 'AI' ? 'AI' : suggestionSource === 'RULES' ? 'RULES' : 'NONE',
    providerStatus,
    requiresReview: Boolean(requiresReview)
  }
}

function summarizeResult (result) {
  // Tạo summary gọn cho audit, không copy toàn bộ provider payload.
  const suggested = result.filter(row => row.status === 'SUGGESTED').length
  const review = result.filter(row => row.status === 'LOW_CONFIDENCE').length
  const invalid = result.filter(row => row.status === 'INVALID_PROVIDER_VALUE').length
  if (invalid) return `Classification suggestion returned ${invalid} invalid provider value(s) for review.`
  if (suggested) return `Classification suggestion found ${suggested} high-confidence value(s).`
  if (review) return `Classification suggestion found ${review} low-confidence value(s) requiring review.`
  return 'Classification suggestion did not find a safe catalog value.'
}

function sourceValueFor (field, input) {
  // Lấy giá trị classification hiện tại để UI so sánh suggestion với source.
  return field.sourceID ? input[field.sourceID] : input[field.sourceCode]
}

function hasBugContext (input) {
  // Chỉ cho gọi provider/ranking khi có title/description hoặc classification đủ dùng.
  return Boolean(bugText(input) || input.sourceBugID)
}

function bugText (input) {
  // Ghép text deterministic dùng fallback keyword score.
  return [
    input.title,
    input.description,
    input.stepsToReproduce,
    input.actualResult,
    input.expectedResult
  ].filter(Boolean).join(' ')
}

function confidenceFor (raw) {
  // Chuẩn hóa confidence provider 0..1 hoặc null.
  const value = Number(raw?.confidence)
  if (Number.isFinite(value)) return Math.max(0, Math.min(1, value))
  return 0.5
}

function defaultReason (field, row, confidence) {
  // Dựng lý do grounded từ catalog row/score khi provider không có reason dùng được.
  return confidence < LOW_CONFIDENCE_THRESHOLD
    ? `${field.label} matches an active catalog value but needs human review because confidence is low.`
    : `${field.label} matches the active IDTS catalog value ${row.code || row.name}.`
}

function safeProviderReason (providerStatus) {
  // Chuyển trạng thái provider thành lời giải thích user-facing không lộ diagnostic.
  if (providerStatus === 'AI_DISABLED') return 'AI assistance is disabled, so only deterministic fallback was available.'
  if (providerStatus === 'AI_RATE_LIMITED') return 'AI is temporarily busy. Safe local suggestions are shown. Try again later.'
  if (providerStatus === 'AI_TIMEOUT') return 'AI assistance timed out, so only deterministic fallback was available.'
  if (providerStatus === 'AI_PROVIDER_UNSUPPORTED') return 'AI provider is not supported in this environment.'
  if (providerStatus === 'AI_PROVIDER_ERROR') return 'AI provider failed safely; no provider details are exposed.'
  if (providerStatus === 'AI_OUTPUT_UNSAFE') return 'AI output was removed because it was not safe to show.'
  return sanitizeErrorSummary(new Error('AI provider did not return a usable classification suggestion.'))
}

function cleanText (value) {
  // Trim/redact/cắt text Bug trước provider/audit.
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCode (value) {
  // Chuẩn hóa code catalog; rỗng thành null.
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function normalizeText (value) {
  // Lowercase text cho matching deterministic, không thay text response gốc.
  return String(value || '').trim().toLowerCase()
}

function normalizeKey (value) {
  // Tạo key code/name để so không phân biệt khoảng trắng/casing.
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

function safeReason (value) {
  // Redact/cắt reason provider trước response.
  const text = redactSensitiveText(cleanText(value), 500)
  if (containsUnsafeDiagnosticText(text)) return 'AI output was removed because it was not safe to show.'
  return text.slice(0, 500)
}

function roundConfidence (value) {
  // Làm tròn confidence để UI/audit/test ổn định.
  return Number(Math.max(0, Math.min(1, Number(value))).toFixed(4))
}

module.exports = {
  suggestClassification,
  buildClassificationSuggestions,
  extractProviderValue,
  findCatalogRow,
  buildProviderCatalogInput
}
