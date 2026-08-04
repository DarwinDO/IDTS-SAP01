'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const evidenceRoot = path.resolve('docs/pm/evidence/idts-111/uat')
const summaryPath = path.resolve('docs/pm/evidence/idts-111/latest-review-summary.json')
const reviewCommentId = '10942'
const reviewDate = '2026-08-04'
const checkOnly = process.argv.includes('--check')

const stalePrerequisite = new Set(['UAT-AI-007', 'UAT-ATT-002', 'UAT-ATT-003', 'UAT-COM-003', 'UAT-COM-004'])
const historicalOldRuntime = new Set(['UAT-ATT-001', 'UAT-COM-001'])
const defectRecheck = new Set(['UAT-AUTH-005', 'UAT-BUG-008', 'UAT-UX-002'])
const semanticCorrection = new Set(['UAT-AI-008', 'UAT-AI-010', 'UAT-AI-014', 'UAT-AI-015', 'UAT-LIFE-014'])
const aiDiagnostic = new Set(['UAT-AI-005', 'UAT-AI-009'])
const physicalKeyboard = new Set(['UAT-UX-003'])

function classify (manifest) {
  const id = manifest.caseId
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

const manifests = fs.readdirSync(evidenceRoot)
  .map(caseId => path.join(evidenceRoot, caseId, 'manifest.json'))
  .filter(fs.existsSync)

const counts = {}
for (const manifestPath of manifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const [category, currentStatus] = classify(manifest)
  const expectedReview = {
    jiraCommentId: reviewCommentId,
    reviewDate,
    category,
    currentStatus,
    preservesHistoricalCandidateTruth: true,
    finalPassApproved: false
  }
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
  STALE_PREREQUISITE_RERUN_REQUIRED: 5,
  CONFIRMED_DEFECT_RECHECK: 3,
  CATALOG_SEMANTIC_CORRECTION: 5,
  PHYSICAL_KEYBOARD_LIMITATION: 1,
  AI_DIAGNOSTIC_RERUN: 2,
  HISTORICAL_OLD_RUNTIME_NEGATIVE: 2
}

for (const [category, expectedCount] of Object.entries(expected)) {
  if (counts[category] !== expectedCount) throw new Error(`${category}: expected ${expectedCount}, got ${counts[category] || 0}`)
}

const summary = {
  jiraCommentId: reviewCommentId,
  reviewDate,
  curatedAtHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  manifests: manifests.length,
  counts,
  runtimeRerunPerformed: false,
  runtimeRerunLimitation: 'The required Browser control tool is unavailable in this Codex session; historical evidence is preserved and no result is promoted.',
  workbookAndDriveChanged: false
}

if (!checkOnly) fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ ...summary, mode: checkOnly ? 'CHECK_ONLY' : 'WRITE' }))
