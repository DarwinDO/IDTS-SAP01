#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..', '..')
const catalogPath = path.join(repoRoot, 'docs', 'qa', 'idts-110-unit-test-catalog.json')
const candidateRootArg = process.argv.find(argument => argument.startsWith('--candidate-root='))

if (!candidateRootArg) {
  throw new Error('Missing --candidate-root=<path-to-pr-269-worktree>')
}

const candidateRoot = path.resolve(candidateRootArg.slice('--candidate-root='.length))
const candidateCasesRoot = path.join(candidateRoot, 'docs', 'pm', 'evidence', 'idts-110', 'cases')
const outputPath = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'donhv-case-taxonomy.json')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))

const localLevels = new Set(['PURE_UNIT', 'UI_COMPONENT', 'CAP_COMPONENT', 'ODATA_CONTRACT'])
const heldCases = new Set(['UT-ATT-007', 'UT-ATT-008'])

function reviewerDisposition(testCase, manifest) {
  if (heldCases.has(testCase.caseId)) {
    return {
      decision: 'HELD_FOR_EXACT_HEAD_ACCEPTANCE',
      rationale: 'Preserve NhanT\'s historical deployed-control candidate PASS, but do not accept it as exact-head proof until the generated attachment control is rerun on the intended deployed head.'
    }
  }
  if (manifest.candidateExecutionStatus === 'PASS') {
    return {
      decision: 'ACCEPTED_CANDIDATE',
      rationale: 'DonHV accepted the candidate assertion and its case-specific evidence for documentation integration; this does not update the approved workbook or make a final project acceptance claim.'
    }
  }
  if (manifest.candidateExecutionStatus === 'MAPPING_ONLY_CANDIDATE') {
    return {
      decision: 'MAPPING_ONLY_NOT_PASS',
      rationale: 'The record proves suite-to-case traceability only. It is not an atomic execution, browser proof, BTP proof, or PASS result.'
    }
  }
  return {
    decision: 'BLOCKED_PENDING_MEMBER_EVIDENCE',
    rationale: 'The assertion still requires member-owned SAP BTP/HANA/XSUAA/external-service evidence and remains blocked.'
  }
}

const cases = catalog.cases.map(testCase => {
  const manifestPath = path.join(candidateCasesRoot, testCase.caseId, 'case-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing candidate manifest for ${testCase.caseId}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const primaryExecutionBoundary = localLevels.has(testCase.testLevel)
    ? testCase.testLevel
    : 'BTP_REQUIRED'
  const review = reviewerDisposition(testCase, manifest)
  const evidenceNature = heldCases.has(testCase.caseId)
    ? 'GENERATED_TRACE_SUMMARY_PLUS_HISTORICAL_DEPLOYED_CONTROL'
    : 'GENERATED_TRACE_SUMMARY'

  return {
    caseId: testCase.caseId,
    testLevel: testCase.testLevel,
    catalogEnvironment: testCase.environment,
    primaryExecutionBoundary,
    requiredEnvironment: primaryExecutionBoundary === 'BTP_REQUIRED' ? 'SAP_BTP' : 'LOCAL',
    candidateStatus: manifest.candidateExecutionStatus,
    reviewDecision: review.decision,
    reviewRationale: review.rationale,
    evidenceFiles: manifest.evidenceFiles,
    evidenceNature,
    humanReviewer: 'DonHV'
  }
})

const counts = cases.reduce((summary, testCase) => {
  summary.byTestLevel[testCase.testLevel] = (summary.byTestLevel[testCase.testLevel] || 0) + 1
  summary.byCandidateStatus[testCase.candidateStatus] = (summary.byCandidateStatus[testCase.candidateStatus] || 0) + 1
  summary.byRequiredEnvironment[testCase.requiredEnvironment] = (summary.byRequiredEnvironment[testCase.requiredEnvironment] || 0) + 1
  summary.byReviewDecision[testCase.reviewDecision] = (summary.byReviewDecision[testCase.reviewDecision] || 0) + 1
  return summary
}, {
  total: cases.length,
  byTestLevel: {},
  byCandidateStatus: {},
  byRequiredEnvironment: {},
  byReviewDecision: {}
})

const output = {
  schemaVersion: '1.0',
  jiraKey: 'IDTS-110',
  reviewedPullRequest: 269,
  reviewedCandidateHeadSha: '8fd55bc00199ded91ce294eedc3b4113292fd6ee',
  integratedOriginDevSha: 'e55a863d0cc4ada6c421ce940c1986162756c176',
  reviewPolicy: {
    primaryResultOwner: 'DonHV',
    candidateExecutor: 'NhanT (agent-assisted)',
    generatedCardsAreRuntimeProof: false,
    candidateExecutionFieldsAreImmutable: true,
    reviewerTotalsAreSeparateFromCandidateTotals: true,
    latestBriefingAcknowledgementRequired: true
  },
  counts,
  cases
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Generated ${path.relative(repoRoot, outputPath)}: ${cases.length} cases`)
console.log(JSON.stringify(counts, null, 2))
