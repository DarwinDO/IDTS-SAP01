// Học nhanh (DonHV): giải thích vì sao developer có thể phù hợp; explanation không thay quyền chọn/validate assignee của backend.
'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { FEATURE_TYPES, createAiSuggestion } = require('./audit')
const { createAiProvider } = require('./provider')
const {
  containsUnsafeDiagnosticText,
  sanitizeErrorSummary
} = require('./safety')
const { STATUS } = require('../bug-service/constants')
const { resolveRequestUser } = require('../bug-service/helpers')
const { buildAssignableDeveloperRows } = require('../bug-service/read-models')

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 10
const SMART_ASSIGNMENT_PROVIDER_DEADLINE_MS = 24_000

async function explainSmartAssignment (req, entities, dependencies = {}) {
  // OData action entry point: resolve Bug/candidate context, gọi provider nếu bật, dựng explanation grounded,
  // ghi AI audit rồi trả review-only result; không tự chọn hoặc ghi assignee.
  const tx = cds.tx(req)
  const provider = dependencies.provider || createAiProvider()
  const input = await resolveAssignmentInput(tx, req, entities, req.data || {})

  if (!input.componentCategoryID) {
    return req.reject(400, 'Select an application component and defect category before requesting assignment explanations.')
  }

  const candidates = (await readCandidateContext(tx, entities, input)).map((candidate, index) => ({
    ...candidate,
    candidateRef: `C${index + 1}`
  }))
  const providerResult = await provider.structured({
    featureType: FEATURE_TYPES.ASSIGNMENT_EXPLANATION,
    schemaName: 'IdtsSmartAssignmentExplanation',
    correlationId: req.id,
    instruction: [
      'Explain why each existing IDTS developer candidate may fit the bug assignment.',
      'Use only the supplied candidate and bug facts.',
      'Do not choose the assignee automatically.',
      'Do not invent skills, availability, workload, or personal information.',
      'Return one short business-facing explanation per candidate.',
      'For every candidate, return the exact supplied candidateRef. Never return a UUID, developer name, or a candidate that was not supplied.'
    ].join(' '),
    input: buildProviderInput(input, candidates),
    // Trả deterministic explanation trước ngưỡng AppRouter thay vì để request bị cắt ở khoảng 30 giây.
    deadlineMs: SMART_ASSIGNMENT_PROVIDER_DEADLINE_MS
  })

  const result = buildAssignmentExplanations({ input, candidates, providerResult })

  const audit = await recordAssignmentAudit({
    tx,
    req,
    entities,
    input,
    provider,
    providerResult,
    result
  })

  return result.map(row => ({
    suggestionID: audit?.ID || null,
    ...row
  }))
}

async function resolveAssignmentInput (tx, req, entities, data) {
  // Chuẩn hóa sourceBug/candidate IDs từ request và đọc dữ liệu nền cần thiết trong transaction.
  const sourceBugID = cleanID(data.sourceBugID)
  let source = null

  if (sourceBugID) {
    source = await tx.run(
      SELECT.one.from(entities.Bugs)
        .columns(
          'ID',
          'bugNumber',
          'title',
          'status_code',
          'componentCategory_ID',
          'sapModule_ID',
          { ref: ['componentCategory', 'component', 'name'], as: 'applicationComponentName' },
          { ref: ['componentCategory', 'defectCategory', 'name'], as: 'defectCategoryName' },
          { ref: ['sapModule', 'name'], as: 'sapModuleName' }
        )
        .where({ ID: sourceBugID })
    )
    if (!source) return req.reject(404, 'Source bug was not found.')
  }

  return {
    sourceBugID,
    bugNumber: source?.bugNumber || null,
    title: cleanText(source?.title),
    statusCode: source?.status_code || null,
    componentCategoryID: cleanID(data.componentCategoryID) || source?.componentCategory_ID || null,
    sapModuleID: cleanID(data.sapModuleID) || source?.sapModule_ID || null,
    applicationComponentName: source?.applicationComponentName || null,
    defectCategoryName: source?.defectCategoryName || null,
    sapModuleName: source?.sapModuleName || null,
    limit: normalizeLimit(data.limit)
  }
}

async function readCandidateContext (tx, entities, input) {
  // Đọc profile, responsibility và availability của candidate; loại ID không tồn tại/inactive khỏi giải thích.
  const rows = await buildAssignableDeveloperRows(tx, entities, {
    componentCategoryID: input.componentCategoryID,
    sapModuleID: input.sapModuleID,
    active: true
  })

  const candidates = rows
    .filter(row => row.active !== false)
    .sort((left, right) => String(left.developerName || '').localeCompare(String(right.developerName || '')))
    .slice(0, input.limit)

  const workloadByProfileID = await readCandidateWorkloads(tx, entities, candidates)
  return candidates.map(candidate => ({
    ...candidate,
    workload: workloadByProfileID.get(candidate.developerProfileID) || emptyWorkload(candidate)
  }))
}

async function readCandidateWorkloads (tx, entities, candidates) {
  // Tính workload từ Bug hiện có cho candidate, chỉ dùng làm ground truth cảnh báo/ranking explanation.
  const ids = [...new Set(candidates.map(candidate => candidate.developerProfileID).filter(Boolean))]
  const workloads = new Map(ids.map(id => [id, emptyWorkload({ developerProfileID: id })]))
  if (!ids.length) return workloads

  const bugs = await tx.run(
    SELECT.from(entities.Bugs)
      .columns('assignee_ID', 'status_code', 'dueDate')
      .where({ assignee_ID: { in: ids } })
  )

  for (const bug of bugs) {
    if (!bug.assignee_ID || bug.status_code === STATUS.CLOSED) continue
    const workload = workloads.get(bug.assignee_ID) || emptyWorkload({ developerProfileID: bug.assignee_ID })
    workload.openOwnedBugCount += 1
    if (bug.status_code === STATUS.ASSIGNED) workload.assignedCount += 1
    if (bug.status_code === STATUS.IN_PROGRESS) workload.inProgressCount += 1
    if (bug.status_code === STATUS.NEED_MORE_INFORMATION) workload.needMoreInformationCount += 1
    if (bug.dueDate && String(bug.dueDate) < todayDateString()) workload.overdueOwnedBugCount += 1
    workloads.set(bug.assignee_ID, workload)
  }

  for (const candidate of candidates) {
    const workload = workloads.get(candidate.developerProfileID) || emptyWorkload(candidate)
    workload.workloadLimit = candidate.workloadLimit ?? null
    workload.isOverloaded = workload.workloadLimit !== null && workload.workloadLimit !== undefined
      ? workload.openOwnedBugCount > workload.workloadLimit
      : false
    workloads.set(candidate.developerProfileID, workload)
  }

  return workloads
}

function buildAssignmentExplanations ({ input, candidates, providerResult }) {
  // Ghép provider output với candidate thật theo ID; output thiếu/sai được thay bằng fallback deterministic.
  const providerStatus = providerResult?.status || 'AI_PROVIDER_ERROR'
  const payload = providerPayload(providerResult)
  const unsafeProviderOutput = containsUnsafeDiagnosticText(payload)
  const providerRows = unsafeProviderOutput ? new Map() : providerRowsByCandidateRef(payload)
  const effectiveProviderStatus = unsafeProviderOutput ? 'AI_OUTPUT_UNSAFE' : providerStatus

  return candidates.map(candidate => {
    const providerRow = providerResult?.ok && !unsafeProviderOutput
      ? providerRows.get(candidate.candidateRef)
      : null
    const fallback = fallbackExplanation(input, candidate)

    if (providerRow?.explanation) {
      return explanationRow({
        candidate,
        explanation: providerRow.explanation,
        warnings: providerRow.warnings || fallback.warnings,
        confidence: confidenceFor(providerRow.confidence, fallback.confidence),
        providerStatus: effectiveProviderStatus,
        status: providerRow.status || fallback.status,
        explanationSource: 'AI',
        groundingStatus: fallback.groundingStatus,
        requiresReview: true
      })
    }

    return explanationRow({
      candidate,
      explanation: fallback.explanation,
      warnings: fallback.warnings,
      confidence: fallback.confidence,
      providerStatus: effectiveProviderStatus,
      status: fallback.status,
      explanationSource: 'RULES',
      groundingStatus: fallback.groundingStatus,
      requiresReview: true
    })
  })
}

function fallbackExplanation (input, candidate) {
  // Dựng lời giải thích từ responsibility/availability/workload khi AI tắt hoặc provider lỗi.
  const parts = []
  const warnings = []

  if (candidate.applicationComponentName && candidate.defectCategoryName) {
    parts.push(`Matches ${candidate.applicationComponentName} / ${candidate.defectCategoryName}.`)
  } else {
    warnings.push('Classification match is partial because component/category detail is missing.')
  }

  if (candidate.sapModuleName) {
    parts.push(`Covers SAP module ${candidate.sapModuleName}.`)
  } else if (input.sapModuleID) {
    warnings.push('SAP module-specific responsibility was not found; candidate may be using a broader responsibility.')
  } else {
    parts.push('Applies to any SAP module for this responsibility.')
  }

  if (candidate.responsibilityLevelName) {
    parts.push(`${candidate.responsibilityLevelName} responsibility is configured for this area.`)
  }

  const availability = cleanText(candidate.availabilityStatusName)
  if (availability) {
    if (Number(candidate.availabilityCriticality) === 1) {
      warnings.push(`Availability is ${availability}.`)
    } else if (Number(candidate.availabilityCriticality) === 2) {
      warnings.push(`Availability is ${availability}; review workload before assigning.`)
    } else {
      parts.push(`Availability is ${availability}.`)
    }
  } else {
    warnings.push('Availability data is missing.')
  }

  const workload = candidate.workload || emptyWorkload(candidate)
  if (workload.workloadLimit !== null && workload.workloadLimit !== undefined) {
    parts.push(`Current open workload is ${workload.openOwnedBugCount}/${workload.workloadLimit}.`)
    if (workload.isOverloaded) {
      warnings.push('Candidate is above the configured workload limit.')
    }
  } else {
    warnings.push('Workload limit is not configured.')
  }

  return {
    explanation: parts.join(' ') || 'Candidate is available for manual review, but there is not enough data for a stronger explanation.',
    warnings: warnings.join(' '),
    confidence: warnings.length ? 0.55 : 0.72,
    status: warnings.length ? 'REVIEW_RECOMMENDED' : 'EXPLAINED',
    groundingStatus: warnings.length ? 'PARTIAL_DATA' : 'GROUNDED'
  }
}

async function recordAssignmentAudit ({ tx, req, entities, input, provider, providerResult, result }) {
  // Lưu metadata request/result đã sanitize vào AISuggestions; không lưu prompt, secret hay tự đổi Bug.
  if (!input.sourceBugID) return null

  const requester = await resolveRequestUser(req, entities)
  if (!requester) return null

  const bestConfidence = result.reduce((max, row) => Math.max(max, Number(row.confidence || 0)), 0) || null
  return createAiSuggestion(tx, {
    bugID: input.sourceBugID,
    requestedByID: requester.ID,
    featureType: FEATURE_TYPES.ASSIGNMENT_EXPLANATION,
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
      candidates: result.map(row => ({
        developerProfileID: row.developerProfileID,
        developerName: row.developerName,
        confidence: row.confidence,
        status: row.status,
        explanationSource: row.explanationSource,
        groundingStatus: row.groundingStatus,
        explanation: row.explanation,
        warnings: row.warnings
      }))
    }
  })
}

function buildProviderInput (input, candidates) {
  // Chỉ gửi field allow-list cần cho explanation, không gửi comment/attachment/credential.
  return {
    bug: {
      bugNumber: input.bugNumber,
      title: input.title,
      statusCode: input.statusCode,
      applicationComponentName: input.applicationComponentName,
      defectCategoryName: input.defectCategoryName,
      sapModuleName: input.sapModuleName
    },
    candidates: candidates.map(candidate => ({
      candidateRef: candidate.candidateRef,
      developerName: candidate.developerName,
      availabilityStatusName: candidate.availabilityStatusName,
      availabilityCriticality: candidate.availabilityCriticality,
      applicationComponentName: candidate.applicationComponentName,
      defectCategoryName: candidate.defectCategoryName,
      sapModuleName: candidate.sapModuleName,
      responsibilityLevelName: candidate.responsibilityLevelName,
      workload: {
        openOwnedBugCount: candidate.workload?.openOwnedBugCount || 0,
        workloadLimit: candidate.workload?.workloadLimit ?? null,
        overdueOwnedBugCount: candidate.workload?.overdueOwnedBugCount || 0,
        isOverloaded: Boolean(candidate.workload?.isOverloaded)
      }
    }))
  }
}

function providerPayload (providerResult) {
  // Lấy structured payload từ wrapper provider; status lỗi trả object rỗng để fallback tiếp quản.
  const data = providerResult?.data
  if (data?.json && typeof data.json === 'object') return data.json
  return data && typeof data === 'object' ? data : {}
}

function providerRowsByCandidateRef (payload) {
  // Index output theo ref ngắn do backend cấp; provider không cần và không được thấy UUID profile.
  const rows = Array.isArray(payload?.candidates)
    ? payload.candidates
    : Array.isArray(payload?.explanations)
        ? payload.explanations
        : Array.isArray(payload)
            ? payload
            : []

  const mapped = new Map()
  for (const row of rows) {
    const candidateRef = cleanCandidateRef(row?.candidateRef)
    if (!candidateRef) continue
    mapped.set(candidateRef, {
      explanation: safeText(row.explanation || row.reason || row.summary, 700),
      warnings: safeText(row.warnings || row.warning, 500),
      confidence: row.confidence ?? row.score,
      status: cleanCode(row.status)
    })
  }
  return mapped
}

function explanationRow ({ candidate, explanation, warnings, confidence, providerStatus, status, explanationSource, groundingStatus, requiresReview }) {
  // Dựng row public thống nhất cho UI, luôn đánh dấu review khi suggestion không phải quyết định tự động.
  return {
    developerProfileID: candidate.developerProfileID,
    developerName: candidate.developerName || null,
    explanation: safeText(explanation, 700),
    warnings: safeText(warnings, 500),
    confidence: roundConfidence(confidence),
    status: cleanCode(status) || 'REVIEW_RECOMMENDED',
    explanationSource: explanationSource === 'AI' ? 'AI' : 'RULES',
    providerStatus,
    groundingStatus,
    workloadOpenCount: Number(candidate.workload?.openOwnedBugCount || 0),
    workloadLimit: candidate.workload?.workloadLimit ?? null,
    isOverloaded: Boolean(candidate.workload?.isOverloaded),
    requiresReview: Boolean(requiresReview)
  }
}

function cleanCandidateRef (value) {
  const ref = String(value || '').trim().toUpperCase()
  return /^C[1-9]\d*$/.test(ref) ? ref : null
}

function summarizeResult (result) {
  // Tạo summary nhỏ cho audit/telemetry, không chép toàn bộ explanation nhạy cảm.
  if (!result.length) return 'Smart assignment explanation found no eligible developer candidates.'
  const overloaded = result.filter(row => row.isOverloaded).length
  const partial = result.filter(row => row.groundingStatus === 'PARTIAL_DATA').length
  if (overloaded) return `Smart assignment explanation returned ${result.length} candidate(s), including ${overloaded} workload warning(s).`
  if (partial) return `Smart assignment explanation returned ${result.length} candidate(s), including ${partial} partial-data warning(s).`
  return `Smart assignment explanation returned ${result.length} grounded candidate explanation(s).`
}

function normalizeLimit (value) {
  // Giới hạn số candidate hợp lệ để provider/payload không phình do input client.
  const number = Number(value || DEFAULT_LIMIT)
  if (!Number.isFinite(number) || number <= 0) return DEFAULT_LIMIT
  return Math.min(MAX_LIMIT, Math.floor(number))
}

function confidenceFor (value, fallback) {
  // Chuẩn hóa confidence về 0..1 và fallback khi provider trả sai kiểu/phạm vi.
  const number = Number(value)
  if (Number.isFinite(number)) return number
  return fallback
}

function roundConfidence (value) {
  // Làm tròn confidence để UI/audit ổn định, không làm nó đáng tin hơn.
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Number(Math.max(0, Math.min(1, number)).toFixed(4))
}

function emptyWorkload (candidate) {
  // Tạo workload 0 khi chưa có Bug, giữ candidate vẫn review được thay vì biến mất.
  return {
    developerProfileID: candidate.developerProfileID,
    workloadLimit: candidate.workloadLimit ?? null,
    openOwnedBugCount: 0,
    overdueOwnedBugCount: 0,
    assignedCount: 0,
    inProgressCount: 0,
    needMoreInformationCount: 0,
    isOverloaded: false
  }
}

function todayDateString () {
  // Trả ngày chuẩn để tính overdue nhất quán với workload backend.
  return new Date().toISOString().slice(0, 10)
}

function cleanID (value) {
  // Chuẩn hóa ID text và chặn giá trị quá dài trước query/mapping.
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanText (value) {
  // Làm sạch text nghiệp vụ đầu vào, không dùng để sanitize diagnostic provider.
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCode (value) {
  // Chuẩn hóa catalog/status code cho so khớp deterministic.
  return typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 40) : ''
}

function safeText (value, maxLength) {
  // Cắt và redact text provider trước khi đưa vào response/audit.
  const text = cleanText(value)
  return text.slice(0, maxLength)
}

module.exports = {
  SMART_ASSIGNMENT_PROVIDER_DEADLINE_MS,
  explainSmartAssignment,
  buildAssignmentExplanations,
  buildProviderInput
}
