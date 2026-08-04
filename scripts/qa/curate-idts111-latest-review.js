'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const evidenceRoot = path.resolve('docs/pm/evidence/idts-111/uat')
const summaryPath = path.resolve('docs/pm/evidence/idts-111/latest-review-summary.json')
const reviewCommentId = '10962'
const reviewDate = '2026-08-04'
const checkOnly = process.argv.includes('--check')

const stalePrerequisite = new Set(['UAT-AI-007', 'UAT-ATT-002', 'UAT-ATT-003'])
const historicalOldRuntime = new Set()
const defectRecheck = new Set()
const currentRuntimePositive = new Set(['UAT-AUTH-005', 'UAT-COM-001', 'UAT-COM-004'])
const currentRuntimeNegative = new Set(['UAT-COM-003'])
const fixtureProvenanceBlocked = new Set(['UAT-ATT-001'])
const currentRuntimeDefect = new Set(['UAT-BUG-008'])
const currentRuntimePartial = new Set(['UAT-UX-002'])
const semanticCorrection = new Set(['UAT-AI-008', 'UAT-AI-010', 'UAT-AI-014', 'UAT-AI-015', 'UAT-LIFE-014'])
const aiDiagnostic = new Set(['UAT-AI-005', 'UAT-AI-009'])
const physicalKeyboard = new Set(['UAT-UX-003'])

function classify (manifest) {
  const id = manifest.caseId
  if (currentRuntimePositive.has(id)) return ['CURRENT_RUNTIME_POSITIVE', 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW']
  if (fixtureProvenanceBlocked.has(id)) return ['FIXTURE_PROVENANCE_INCONSISTENT', 'BLOCKED_FIXTURE_PROVENANCE_INCONSISTENT']
  if (currentRuntimeNegative.has(id)) return ['CURRENT_RUNTIME_NEGATIVE', 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW']
  if (currentRuntimeDefect.has(id)) return ['CONFIRMED_DEFECT_RECHECK', 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW']
  if (currentRuntimePartial.has(id)) return ['CURRENT_RUNTIME_PARTIAL_RECHECK', 'CURRENT_RUNTIME_PARTIAL_RECHECK_NEEDS_CANDIDATE_FIXTURE']
  if (stalePrerequisite.has(id)) return ['STALE_PREREQUISITE_RERUN_REQUIRED', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (historicalOldRuntime.has(id)) return ['HISTORICAL_OLD_RUNTIME_NEGATIVE', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (defectRecheck.has(id)) return ['CONFIRMED_DEFECT_RECHECK', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (semanticCorrection.has(id)) return ['CATALOG_SEMANTIC_CORRECTION', 'REVIEW_CORRECTION_REQUIRED']
  if (aiDiagnostic.has(id)) return ['AI_DIAGNOSTIC_RERUN', 'RERUN_REQUIRES_IMMUTABLE_ID_NETWORK_AUDIT']
  if (physicalKeyboard.has(id)) return ['PHYSICAL_KEYBOARD_LIMITATION', 'MEMBER_MANUAL_CONFIRMATION_REQUIRED']
  if (manifest.candidateExecutionStatus === 'EXECUTION_BLOCKED_PENDING_PRECONDITION') return ['VALID_PRECONDITION_BLOCKER', 'BLOCKED']
  if (manifest.candidateOutcome === 'MEETS_EXPECTED_RESULT') return ['RETAINED_TRUTHFUL_POSITIVE', 'CANDIDATE_EVIDENCE_RETAINED']
  throw new Error(`Unclassified manifest: ${id}`)
}

const caseDirectories = fs.readdirSync(evidenceRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
const manifests = caseDirectories.map(entry => path.join(evidenceRoot, entry.name, 'manifest.json'))

if (manifests.length !== 57) throw new Error(`Manifest count: expected 57, got ${manifests.length}`)
for (const manifestPath of manifests) {
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest: ${path.relative(process.cwd(), manifestPath)}`)
}

const counts = {}
const candidateDisposition = {}
const caseIds = new Set()
const evidenceHashes = new Set()
let evidenceReferences = 0
for (const manifestPath of manifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (!manifest.caseId || caseIds.has(manifest.caseId)) throw new Error(`Duplicate or missing Case ID: ${manifest.caseId || manifestPath}`)
  caseIds.add(manifest.caseId)
  const rawCandidateStatus = manifest.candidateOutcome || manifest.candidateExecutionStatus
  const candidateStatus = rawCandidateStatus === 'NOT_EXECUTABLE_WITH_CURRENT_PRECONDITION' ||
    rawCandidateStatus === 'EXECUTION_BLOCKED_PENDING_PRECONDITION'
    ? 'BLOCKED'
    : rawCandidateStatus
  if (!candidateStatus) throw new Error(`Missing candidate disposition: ${manifest.caseId}`)
  candidateDisposition[candidateStatus] = (candidateDisposition[candidateStatus] || 0) + 1

  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : []
  evidenceReferences += evidence.length
  for (const item of evidence) {
    const evidencePath = path.join(path.dirname(manifestPath), item.file || '')
    if (!item.file || !fs.existsSync(evidencePath)) throw new Error(`Missing evidence for ${manifest.caseId}: ${item.file || '<empty>'}`)
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex').toUpperCase()
    const declaredHash = String(item.sha256 || '').toUpperCase()
    if (actualHash !== declaredHash) throw new Error(`Evidence SHA-256 mismatch: ${manifest.caseId}/${item.file}`)
    evidenceHashes.add(actualHash)
  }
  const [category, currentStatus] = classify(manifest)
  const expectedReview = {
    jiraCommentId: reviewCommentId,
    reviewDate,
    category,
    currentStatus,
    preservesHistoricalCandidateTruth: true,
    finalPassApproved: false
  }
  if (expectedReview.finalPassApproved !== false) throw new Error(`Final PASS is forbidden in candidate package: ${manifest.caseId}`)
  if (historicalOldRuntime.has(manifest.caseId)) expectedReview.historicalEvidenceOnly = true
  if (checkOnly) {
    if (JSON.stringify(manifest.donhvLatestReview) !== JSON.stringify(expectedReview)) {
      throw new Error(`Review metadata mismatch: ${manifest.caseId}`)
    }
  } else {
    manifest.donhvLatestReview = expectedReview
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }
  counts[category] = (counts[category] || 0) + 1
}

const expected = {
  RETAINED_TRUTHFUL_POSITIVE: 19,
  VALID_PRECONDITION_BLOCKER: 20,
  STALE_PREREQUISITE_RERUN_REQUIRED: 3,
  CONFIRMED_DEFECT_RECHECK: 1,
  CATALOG_SEMANTIC_CORRECTION: 5,
  PHYSICAL_KEYBOARD_LIMITATION: 1,
  AI_DIAGNOSTIC_RERUN: 2,
  CURRENT_RUNTIME_POSITIVE: 3,
  CURRENT_RUNTIME_NEGATIVE: 1,
  FIXTURE_PROVENANCE_INCONSISTENT: 1,
  CURRENT_RUNTIME_PARTIAL_RECHECK: 1
}

for (const [category, expectedCount] of Object.entries(expected)) {
  if (counts[category] !== expectedCount) throw new Error(`${category}: expected ${expectedCount}, got ${counts[category] || 0}`)
}

const expectedDisposition = {
  MEETS_EXPECTED_RESULT: 22,
  DOES_NOT_MEET_EXPECTED_RESULT: 12,
  BLOCKED: 23
}
for (const [status, expectedCount] of Object.entries(expectedDisposition)) {
  if (candidateDisposition[status] !== expectedCount) throw new Error(`${status}: expected ${expectedCount}, got ${candidateDisposition[status] || 0}`)
}
if (evidenceReferences !== 77) throw new Error(`Evidence references: expected 77, got ${evidenceReferences}`)
if (evidenceHashes.size !== 64) throw new Error(`Unique evidence hashes: expected 64, got ${evidenceHashes.size}`)

const attachmentManifest = JSON.parse(fs.readFileSync(path.join(evidenceRoot, 'UAT-ATT-001', 'manifest.json'), 'utf8'))
const attachmentText = JSON.stringify(attachmentManifest)
if (attachmentManifest.testRecord?.sizeBytes !== 44 || !attachmentText.includes('54-byte') || !attachmentText.includes('47-byte')) {
  throw new Error('UAT-ATT-001 fixture provenance no longer exposes the preserved 44/54/47-byte inconsistency')
}

const summary = {
  jiraCommentId: reviewCommentId,
  reviewDate,
  curatedAtBaselineHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  manifests: manifests.length,
  evidenceReferences,
  uniqueEvidenceHashes: evidenceHashes.size,
  currentDisposition: expectedDisposition,
  counts,
  runtimeRerunPerformed: true,
  runtimeRerunLimitation: 'AI immutable suggestion IDs and sanitized Network responses remain unavailable; UAT-UX-002 candidate-row wrapping still needs a matching fixture and UAT-UX-003 still needs NhanT physical-keyboard confirmation.',
  workbookAndDriveChanged: false
}

if (!checkOnly) fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ ...summary, mode: checkOnly ? 'CHECK_ONLY' : 'WRITE' }))
