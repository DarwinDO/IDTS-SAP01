// Học nhanh (DonHV): tìm duplicate/similar theo bounded candidate scan + fallback. Kết quả chỉ để human review, không tạo DuplicateLink tự động.
'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const { FEATURE_TYPES, createAiSuggestion } = require('./audit')
const { createAiProvider } = require('./provider')
const { resolveRequestUser } = require('../bug-service/helpers')

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 10
const DEFAULT_MIN_SCORE = 0.35
const MAX_CANDIDATES = 50
const EMBEDDING_CONCURRENCY = 4
const MAX_SEARCH_TEXT = 8000

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is',
  'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with',
  'bug', 'defect', 'error', 'issue'
])

// Breakpoint ở đây để kiểm tra input/candidate/providerStatus khi UI Similar Bugs ra kết quả lạ hoặc rỗng.
async function suggestSimilarBugs (req, entities, dependencies = {}) {
  const tx = cds.tx(req)
  const provider = dependencies.provider || createAiProvider()
  const input = await resolveSearchInput(tx, req, req.data || {})

  if (!input.title && !input.description) {
    return req.reject(400, 'Provide a bug title or description to search for similar bugs.')
  }

  const candidates = await tx.run(
    SELECT.from('idts.cap.Bugs')
      .columns(
        'ID',
        'bugNumber',
        'title',
        'description',
        'status_code',
        'sapModule_ID',
        'applicationComponent_ID',
        'defectCategory_ID',
        'componentCategory_ID'
      )
      .orderBy('modifiedAt desc')
      .limit(MAX_CANDIDATES)
  )
  await enrichSemanticContext(tx, input, candidates)

  const ranking = await rankSimilarBugCandidates({
    input,
    candidates: candidates.filter(candidate => candidate.ID !== input.sourceBugID),
    provider,
    limit: normalizeLimit(req.data?.limit),
    minScore: normalizeMinScore(req.data?.minScore)
  })
  const ranked = ranking.candidates

  const statusNames = await readStatusNames(tx, ranked.map(candidate => candidate.statusCode))
  const result = ranked.map((candidate, index) => ({
    rank: index + 1,
    bugID: candidate.bugID,
    bugNumber: candidate.bugNumber,
    title: candidate.title,
    statusCode: candidate.statusCode,
    statusName: statusNames.get(candidate.statusCode) || candidate.statusCode,
    score: candidate.score.toFixed(4),
    suggestedRelationTypeCode: candidate.suggestedRelationTypeCode,
    reason: candidate.reason,
    providerStatus: candidate.providerStatus,
    embeddingUsed: candidate.embeddingUsed
  }))

  await recordSuggestionAudit({ req, tx, entities, input, result, ranked, ranking, provider })
  return result
}

async function resolveSearchInput (tx, req, data) {
  const sourceBugID = cleanId(data.sourceBugID)
  let persisted = null
  if (sourceBugID) {
    persisted = await tx.run(
      SELECT.one.from('idts.cap.Bugs')
        .columns(
          'ID',
          'title',
          'description',
          'status_code',
          'sapModule_ID',
          'applicationComponent_ID',
          'defectCategory_ID',
          'componentCategory_ID'
        )
        .where({ ID: sourceBugID })
    )
    if (!persisted) {
      return req.reject(404, 'The source bug does not exist.')
    }
  }

  return {
    sourceBugID,
    title: cleanText(data.title, 255) || persisted?.title || null,
    description: cleanText(data.description, MAX_SEARCH_TEXT) || cleanText(persisted?.description, MAX_SEARCH_TEXT),
    statusCode: cleanText(data.statusCode) || persisted?.status_code || null,
    sapModuleID: cleanId(data.sapModuleID) || persisted?.sapModule_ID || null,
    applicationComponentID: cleanId(data.applicationComponentID) || persisted?.applicationComponent_ID || null,
    defectCategoryID: cleanId(data.defectCategoryID) || persisted?.defectCategory_ID || null,
    componentCategoryID: cleanId(data.componentCategoryID) || persisted?.componentCategory_ID || null
  }
}

async function rankSimilarBugCandidates ({ input, candidates, provider, limit = DEFAULT_LIMIT, minScore = DEFAULT_MIN_SCORE }) {
  const sourceText = embeddingText(input)
  const sourceEmbeddingResult = await provider.embedding({
    featureType: FEATURE_TYPES.DUPLICATE_DETECTION,
    text: sourceText
  })
  const sourceEmbedding = validEmbedding(sourceEmbeddingResult?.data?.embedding)
  const providerStatus = sourceEmbeddingResult?.status || 'AI_PROVIDER_ERROR'

  let candidateEmbeddings = []
  if (sourceEmbedding) {
    candidateEmbeddings = await mapWithConcurrency(candidates, EMBEDDING_CONCURRENCY, async candidate => {
      const response = await provider.embedding({
        featureType: FEATURE_TYPES.DUPLICATE_DETECTION,
        correlationId: sourceEmbeddingResult.correlationId,
        text: embeddingText(candidate)
      })
      return {
        embedding: validEmbedding(response?.data?.embedding),
        status: response?.status || 'AI_PROVIDER_ERROR'
      }
    })
  }

  const ranked = candidates
    .map((candidate, index) => scoreCandidate({
      input,
      candidate,
      sourceEmbedding,
      candidateEmbedding: candidateEmbeddings[index]?.embedding,
      providerStatus: candidateEmbeddings[index]?.status || providerStatus
    }))
    .filter(candidate => candidate.score >= minScore)
    .sort((left, right) => right.score - left.score || String(left.bugNumber).localeCompare(String(right.bugNumber)))
    .slice(0, limit)

  return {
    candidates: ranked,
    providerStatus: sourceEmbedding ? providerStatus : fallbackProviderStatus(providerStatus),
    correlationId: sourceEmbeddingResult?.correlationId || null,
    providerAlias: sourceEmbeddingResult?.providerAlias || provider?.config?.provider || null,
    modelAlias: sourceEmbeddingResult?.modelAlias || provider?.config?.embeddingModelAlias || provider?.config?.modelAlias || null
  }
}

function scoreCandidate ({ input, candidate, sourceEmbedding, candidateEmbedding, providerStatus }) {
  const titleSimilarity = tokenSimilarity(input.title, candidate.title)
  const descriptionSimilarity = tokenSimilarity(input.description, candidate.description)
  const lexicalScore = (titleSimilarity * 0.72) + (descriptionSimilarity * 0.28)
  const classification = classificationSimilarity(input, candidate)
  const embeddingScore = cosineSimilarity(sourceEmbedding, candidateEmbedding)
  const embeddingUsed = embeddingScore !== null
  const score = embeddingUsed
    ? (lexicalScore * 0.60) + (classification.score * 0.15) + (embeddingScore * 0.25)
    : (lexicalScore * 0.80) + (classification.score * 0.20)
  const normalizedScore = roundScore(score)

  return {
    bugID: candidate.ID,
    bugNumber: candidate.bugNumber,
    title: candidate.title,
    statusCode: candidate.status_code,
    score: normalizedScore,
    suggestedRelationTypeCode: relationTypeFor(normalizedScore),
    reason: buildReason({ titleSimilarity, descriptionSimilarity, matchedFields: classification.matchedFields }),
    providerStatus: embeddingUsed ? providerStatus : fallbackProviderStatus(providerStatus),
    embeddingUsed
  }
}

function classificationSimilarity (input, candidate) {
  const comparisons = [
    ['SAP module', input.sapModuleID, candidate.sapModule_ID],
    ['application component', input.applicationComponentID, candidate.applicationComponent_ID],
    ['defect category', input.defectCategoryID, candidate.defectCategory_ID],
    ['component/category combination', input.componentCategoryID, candidate.componentCategory_ID]
  ].filter(([, expected]) => Boolean(expected))
  const matchedFields = comparisons
    .filter(([, expected, actual]) => expected === actual)
    .map(([label]) => label)

  return {
    score: comparisons.length ? matchedFields.length / comparisons.length : 0,
    matchedFields
  }
}

function tokenSimilarity (left, right) {
  const leftTokens = tokenize(left)
  const rightTokens = tokenize(right)
  if (!leftTokens.size || !rightTokens.size) return 0
  let intersection = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1
  }
  return (2 * intersection) / (leftTokens.size + rightTokens.size)
}

function tokenize (value) {
  return new Set(
    String(value || '').slice(0, MAX_SEARCH_TEXT)
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9\p{L}]+/gu, ' ')
      .split(/\s+/)
      .map(token => token.trim())
      .filter(token => token.length > 1 && !STOP_WORDS.has(token))
  )
}

function cosineSimilarity (left, right) {
  if (!left || !right || left.length !== right.length) return null
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] ** 2
    rightMagnitude += right[index] ** 2
  }
  if (!leftMagnitude || !rightMagnitude) return null
  const cosine = dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
  return Math.max(0, Math.min(1, (cosine + 1) / 2))
}

function validEmbedding (value) {
  if (!Array.isArray(value) || value.length < 2) return null
  const numbers = value.map(Number)
  return numbers.every(Number.isFinite) ? numbers : null
}

function embeddingText (bug) {
  return [
    `Title: ${cleanText(bug.title) || ''}`,
    `Description: ${cleanText(bug.description) || ''}`,
    `Status: ${cleanText(bug.statusContext || bug.statusCode || bug.status_code) || 'not provided'}`,
    `SAP module: ${cleanText(bug.sapModuleContext) || 'not provided'}`,
    `Application component: ${cleanText(bug.applicationComponentContext) || 'not provided'}`,
    `Defect category: ${cleanText(bug.defectCategoryContext) || 'not provided'}`,
    `Component category: ${cleanText(bug.componentCategoryContext) || 'not provided'}`
  ].join('\n')
}

async function enrichSemanticContext (tx, input, candidates) {
  const definitions = [
    {
      entity: 'idts.cap.SAPModules',
      inputID: 'sapModuleID',
      candidateID: 'sapModule_ID',
      context: 'sapModuleContext'
    },
    {
      entity: 'idts.cap.ApplicationComponents',
      inputID: 'applicationComponentID',
      candidateID: 'applicationComponent_ID',
      context: 'applicationComponentContext'
    },
    {
      entity: 'idts.cap.DefectCategories',
      inputID: 'defectCategoryID',
      candidateID: 'defectCategory_ID',
      context: 'defectCategoryContext'
    }
  ]

  for (const definition of definitions) {
    const ids = [
      input[definition.inputID],
      ...candidates.map(candidate => candidate[definition.candidateID])
    ].filter(Boolean)
    const names = await readNamesByID(tx, definition.entity, ids)
    input[definition.context] = names.get(input[definition.inputID]) || null
    for (const candidate of candidates) {
      candidate[definition.context] = names.get(candidate[definition.candidateID]) || null
    }
  }

  const statusNames = await readStatusNames(tx, [
    input.statusCode,
    ...candidates.map(candidate => candidate.status_code)
  ])
  input.statusContext = contextLabel(input.statusCode, statusNames.get(input.statusCode))
  for (const candidate of candidates) {
    candidate.statusContext = contextLabel(candidate.status_code, statusNames.get(candidate.status_code))
    candidate.componentCategoryContext = [
      candidate.applicationComponentContext,
      candidate.defectCategoryContext
    ].filter(Boolean).join(' / ') || null
  }
  input.componentCategoryContext = [
    input.applicationComponentContext,
    input.defectCategoryContext
  ].filter(Boolean).join(' / ') || null
}

async function readNamesByID (tx, entityName, ids) {
  const uniqueIds = [...new Set(ids)]
  if (!uniqueIds.length) return new Map()
  const rows = await tx.run(
    SELECT.from(entityName)
      .columns('ID', 'code', 'name')
      .where({ ID: { in: uniqueIds } })
  )
  return new Map(rows.map(row => [row.ID, contextLabel(row.code, row.name)]))
}

function contextLabel (code, name) {
  return [code, name].filter(Boolean).join(' - ') || null
}

function buildReason ({ titleSimilarity, descriptionSimilarity, matchedFields }) {
  const reasons = []
  if (titleSimilarity >= 0.6) reasons.push('Very similar title')
  else if (titleSimilarity >= 0.25) reasons.push('Some title terms match')
  if (descriptionSimilarity >= 0.5) reasons.push('similar description')
  else if (descriptionSimilarity >= 0.2) reasons.push('some description terms match')
  if (matchedFields.length) reasons.push(`same ${matchedFields.join(', ')}`)
  return `${reasons.length ? reasons.join('; ') : 'Semantic similarity only'}. This is a suggestion for human review.`.slice(0, 500)
}

function relationTypeFor (score) {
  if (score >= 0.78) return 'DUPLICATE'
  if (score >= 0.55) return 'SIMILAR'
  return 'RELATED'
}

function fallbackProviderStatus (status) {
  if (status === 'SUCCESS') return 'AI_EMBEDDING_INVALID'
  return status || 'AI_PROVIDER_ERROR'
}

async function recordSuggestionAudit ({ req, tx, entities, input, result, ranked, ranking, provider }) {
  if (!input.sourceBugID) return
  const requester = await resolveRequestUser(req, entities)
  if (!requester) return
  const best = ranked[0]
  await createAiSuggestion(tx, {
    bugID: input.sourceBugID,
    requestedByID: requester.ID,
    featureType: FEATURE_TYPES.DUPLICATE_DETECTION,
    providerAlias: ranking.providerAlias || provider?.config?.provider || null,
    modelAlias: ranking.modelAlias || provider?.config?.embeddingModelAlias || provider?.config?.modelAlias || null,
    confidence: best?.score ?? null,
    correlationId: ranking.correlationId || req.id,
    summary: result.length
      ? `${result.length} possible duplicate or similar bug candidate(s) suggested for human review.`
      : 'No sufficiently similar bug candidate was found.',
    suggestionPayload: {
      candidateCount: result.length,
      providerStatus: ranking.providerStatus,
      embeddingUsedCount: result.filter(candidate => candidate.embeddingUsed).length,
      candidates: result.map(candidate => ({
        bugID: candidate.bugID,
        bugNumber: candidate.bugNumber,
        score: Number(candidate.score),
        suggestedRelationTypeCode: candidate.suggestedRelationTypeCode,
        reason: candidate.reason,
        providerStatus: candidate.providerStatus,
        embeddingUsed: candidate.embeddingUsed
      }))
    }
  })
}

async function readStatusNames (tx, codes) {
  const uniqueCodes = [...new Set(codes.filter(Boolean))]
  if (!uniqueCodes.length) return new Map()
  const rows = await tx.run(
    SELECT.from('idts.cap.StatusValues')
      .columns('code', 'name')
      .where({ code: { in: uniqueCodes } })
  )
  return new Map(rows.map(row => [row.code, row.name]))
}

async function mapWithConcurrency (items, concurrency, mapper) {
  const result = new Array(items.length)
  let cursor = 0
  async function worker () {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      result[index] = await mapper(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return result
}

function normalizeLimit (value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

function normalizeMinScore (value) {
  if (value === undefined || value === null || value === '') return DEFAULT_MIN_SCORE
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_SCORE
  return Math.min(1, Math.max(0, parsed))
}

function cleanText (value, maxLength = MAX_SEARCH_TEXT) {
  if (value === undefined || value === null) return null
  const text = String(value).slice(0, maxLength).trim()
  return text || null
}

function cleanId (value) {
  const text = cleanText(value)
  return text ? text.slice(0, 36) : null
}

function roundScore (value) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4))
}

module.exports = {
  suggestSimilarBugs,
  rankSimilarBugCandidates,
  tokenSimilarity,
  cosineSimilarity,
  relationTypeFor,
  validEmbedding
}
