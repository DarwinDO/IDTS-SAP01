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
const dispositions = {
  'UT-AUTH-004': {
    decision: 'CATALOG_EXPECTATION_MISMATCH',
    rationale: 'A non-string password is rejected by the CDS type boundary before the login handler. Expect a safe 400-style validation response; retain 401 for a wrong string credential.'
  },
  'UT-VAL-REPORTER': {
    decision: 'CATALOG_EXPECTATION_MISMATCH',
    rationale: 'reporter_ID is server-owned and derived from the authenticated actor before required-field validation. Omission by the client is valid when the actor resolves.'
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
  const review = dispositions[testCase.caseId] || {
    decision: manifest.candidateExecutionStatus === 'BLOCKED'
      ? (primaryExecutionBoundary === 'BTP_REQUIRED' ? 'RERUN_ON_BTP' : 'RERUN_AT_LOCAL_PRIMARY_BOUNDARY')
      : 'REVIEW_CANDIDATE_RESULT',
    rationale: manifest.candidateExecutionStatus === 'BLOCKED'
      ? (primaryExecutionBoundary === 'BTP_REQUIRED'
          ? 'The assertion depends on live HANA, XSUAA, S3, Job Scheduler, or deployed-provider behavior.'
          : 'The approved test level is locally executable; HYBRID_BTP confirmation is not a prerequisite for the primary unit/component/contract result.')
      : 'Retain the candidate result only after DonHV verifies the assertion and case-specific evidence.'
  }

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
    evidenceNature: 'GENERATED_RESULT_CARD',
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
  reviewedHeadSha: '8957cbaa20f9c629818901f9b988884337a7ff82',
  reviewPolicy: {
    primaryResultOwner: 'DonHV',
    candidateExecutor: 'NhanT (agent-assisted)',
    generatedCardsAreRuntimeProof: false,
    latestBriefingAcknowledgementRequired: true
  },
  counts,
  cases
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Generated ${path.relative(repoRoot, outputPath)}: ${cases.length} cases`)
console.log(JSON.stringify(counts, null, 2))
