'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const proposalInput = readJson('docs/pm/evidence/idts-110/catalog-gap-proposal-input.json')

const proposalInputFields = [
  'schemaVersion',
  'sourceWorkbook',
  'sourceBaseline',
  'workbookClaimedCaseCount',
  'approvedCatalogCaseCount',
  'proposals'
]
const proposalFields = [
  'sourceNumber',
  'title',
  'precondition',
  'action',
  'expectedResult',
  'suppliedResult'
]
const expectedProposalSnapshots = [
  {
    sourceNumber: 189,
    title: 'read active Developer profiles returns accurate availability',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Query active Developers.',
    expectedResult: 'Active profiles and true availability statuses are returned.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 190,
    title: 'read inactive user returns no profile data',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Query inactive users.',
    expectedResult: 'No profile data is exposed.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 191,
    title: 'user role check strictly validates TESTER',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Verify TESTER role.',
    expectedResult: 'Only valid TESTER users return true.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 192,
    title: 'user role check strictly validates DEVELOPER',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Verify DEVELOPER role.',
    expectedResult: 'Only valid DEVELOPER users return true.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 193,
    title: 'user role check strictly validates PM',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Verify PM role.',
    expectedResult: 'Only valid PM users return true.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 194,
    title: 'create Application Component requires PM role',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Create component as PM.',
    expectedResult: 'Component is created successfully.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 195,
    title: 'create Defect Category requires PM role',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Create category as PM.',
    expectedResult: 'Category is created successfully.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 196,
    title: 'non-PM role cannot modify catalog entities',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Create component as TESTER.',
    expectedResult: 'HTTP 403 is returned.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 197,
    title: 'active pair bridge validation applies across entities',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Validate active pair.',
    expectedResult: 'Active pair bridge is strictly validated.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 198,
    title: 'inactive catalog item blocks new classification',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Classify using inactive item.',
    expectedResult: 'HTTP 400 is returned.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 199,
    title: 'workload dashboard calculates active bugs correctly',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Read PM monitoring dashboard.',
    expectedResult: 'Active bugs per developer are calculated correctly.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 200,
    title: 'overdue bugs reflect accurate SLA thresholds',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Read SLA metrics.',
    expectedResult: 'Overdue bugs reflect accurate SLA.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 201,
    title: 'closed bugs are excluded from active workload',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Read PM monitoring dashboard.',
    expectedResult: 'Closed bugs are excluded.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 202,
    title: 'developer filter isolated accurately',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Filter dashboard by developer.',
    expectedResult: 'Metrics correspond strictly to the developer.',
    suppliedResult: 'O'
  },
  {
    sourceNumber: 203,
    title: 'PM operational metrics enforce access controls',
    precondition: 'Use an isolated fixture at baseline bc0c47e522ae; capture the relevant before-state.',
    action: 'Read monitoring as Developer.',
    expectedResult: 'HTTP 403 is returned.',
    suppliedResult: 'O'
  }
]

assert.deepEqual(Object.keys(proposalInput).sort(), proposalInputFields.sort())
assert.equal(proposalInput.schemaVersion, '1.0')
assert.equal(proposalInput.workbookClaimedCaseCount, 203)
assert.equal(proposalInput.approvedCatalogCaseCount, 188)
assert.deepEqual(proposalInput.proposals, expectedProposalSnapshots)

assert.equal(proposalInput.sourceWorkbook, 'SU26SAP01_GSU26SAP01_Unit_Test (1).xlsx')
assert.equal(proposalInput.sourceBaseline, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(proposalInput.proposals.length, 15)
assert.deepEqual(proposalInput.proposals.map(row => row.sourceNumber), Array.from({ length: 15 }, (_, index) => index + 189))
for (const proposal of proposalInput.proposals) {
  assert.deepEqual(Object.keys(proposal).sort(), proposalFields.sort())
  assert.equal(Number.isInteger(proposal.sourceNumber), true)
  assert.equal(typeof proposal.title, 'string')
  assert.equal(typeof proposal.precondition, 'string')
  assert.equal(typeof proposal.action, 'string')
  assert.equal(typeof proposal.expectedResult, 'string')
  assert.equal(proposal.suppliedResult, 'O')
}

const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const gapMatrix = readJson('docs/pm/evidence/idts-110/catalog-gap-matrix.json')
const allowedDecisions = new Set(['KEEP', 'REWRITE', 'MERGE', 'DROP'])
const catalogCaseIDs = new Set(catalog.cases.map(row => row.caseId))
const gapMatrixFields = [
  'sourceNumber',
  'internalProposalKey',
  'decision',
  'rationale',
  'overlaps',
  'sourceTrace',
  'roleBoundary',
  'executionBoundary',
  'plannedTestFile',
  'plannedAssertions',
  'mentorLabel'
]
const sourceTraceFields = ['file', 'symbol']

assert.deepEqual(Object.keys(gapMatrix).sort(), [
  'schemaVersion',
  'baseSha',
  'approvedCatalogCount',
  'mentorNumbering',
  'proposals'
].sort())
assert.equal(gapMatrix.schemaVersion, '1.0')
assert.equal(gapMatrix.mentorNumbering, 'SEQUENTIAL_ONLY')
assert.equal(gapMatrix.approvedCatalogCount, 188)
assert.equal(catalog.cases.length, 188)
assert.equal(gapMatrix.baseSha, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(gapMatrix.proposals.length, 15)
assert.deepEqual(gapMatrix.proposals.map(row => row.sourceNumber), proposalInput.proposals.map(row => row.sourceNumber))
for (const row of gapMatrix.proposals) {
  assert.deepEqual(Object.keys(row).sort(), gapMatrixFields.sort())
  assert.equal(row.internalProposalKey, `IDTS110-P${row.sourceNumber}`)
  assert.equal(allowedDecisions.has(row.decision), true)
  assert.equal(typeof row.rationale, 'string')
  assert.ok(row.rationale.length >= 24)
  assert.equal(Array.isArray(row.overlaps), true)
  assert.equal(Array.isArray(row.sourceTrace), true)
  for (const overlap of row.overlaps) {
    assert.equal(typeof overlap, 'string')
    assert.equal(catalogCaseIDs.has(overlap), true)
  }
  for (const trace of row.sourceTrace) {
    assert.deepEqual(Object.keys(trace).sort(), sourceTraceFields.sort())
    assert.equal(typeof trace.file, 'string')
    assert.equal(typeof trace.symbol, 'string')
    const sourcePath = path.join(root, trace.file)
    assert.equal(fs.existsSync(sourcePath), true)
    assert.equal(fs.readFileSync(sourcePath, 'utf8').includes(trace.symbol), true)
  }
  assert.equal(/^Case \d+$/.test(row.mentorLabel), true)
  assert.doesNotMatch(row.mentorLabel, /UT-/)
  assert.equal(row.mentorLabel, `Case ${row.sourceNumber}`)
  assert.equal(typeof row.roleBoundary, 'string')
  assert.equal(typeof row.executionBoundary, 'string')
  assert.equal(row.plannedTestFile === null || typeof row.plannedTestFile === 'string', true)
  assert.equal(Array.isArray(row.plannedAssertions), true)
  assert.equal(JSON.stringify(row).includes('suppliedResult'), false)
  assert.equal(JSON.stringify(row).includes('PASS'), false)
  if (row.decision === 'KEEP' || row.decision === 'REWRITE') {
    assert.ok(row.sourceTrace.length > 0)
    assert.ok(row.roleBoundary)
    assert.ok(row.executionBoundary)
    assert.ok(row.plannedTestFile)
    assert(row.plannedAssertions.length > 0)
  }
  if (row.decision === 'MERGE') {
    assert.ok(row.overlaps.length > 0)
    assert.ok(row.plannedTestFile)
    assert.equal(fs.existsSync(path.join(root, row.plannedTestFile)), true)
    assert.ok(row.plannedAssertions.length > 0)
    const inheritedBoundary = row.plannedAssertions.join(' ')
    assert.match(inheritedBoundary, /atomic/i)
    assert.match(inheritedBoundary, /evidence/i)
    assert.match(row.executionBoundary, /inherit|reuse/i)
    for (const overlap of row.overlaps) {
      assert.match(inheritedBoundary, new RegExp(overlap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      assert.equal(
        fs.existsSync(path.join(root, 'docs/pm/evidence/idts-110/cases', overlap, 'case-manifest.json')),
        true
      )
    }
  }
  if (row.sourceNumber === 197) {
    assert.equal(row.decision, 'REWRITE')
    assert.equal(row.plannedAssertions.length, 1)
    assert.doesNotMatch(row.plannedAssertions[0], /Bug classification/i)
  }
}

const featureCoverage = readJson('docs/pm/evidence/idts-110/new-feature-coverage-gaps.json')
const requiredFamilies = new Set([
  'USER_ACCESS',
  'USER_PROFILE',
  'DEVELOPER_WORKLOAD',
  'BUSINESS_CATALOGS',
  'MY_NOTIFICATIONS',
  'ACCESS_EMAIL',
  'BUG_EMAIL'
])

assert.equal(featureCoverage.schemaVersion, '1.0')
assert.equal(featureCoverage.baseSha, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(featureCoverage.approvedCatalogCount, 188)
assert.equal(featureCoverage.mentorNumbering, 'SEQUENTIAL_ONLY')
assert.equal(Array.isArray(featureCoverage.features), true)
assert.deepEqual(new Set(featureCoverage.features.map(row => row.family)), requiredFamilies)

const featureSourceTraceFields = ['file', 'symbol']
const catalogCaseKeys = new Set(catalog.cases.map(row => row.caseId))
const proposedKeys = new Set()
const proposedSequences = []
for (const feature of featureCoverage.features) {
  assert.ok(feature.sourceTrace.length > 0)
  assert.ok(feature.currentTests.length > 0)
  assert.equal(Array.isArray(feature.existingCaseKeys), true)
  assert.equal(Array.isArray(feature.proposedCases), true)
  for (const existingCaseKey of feature.existingCaseKeys) {
    assert.equal(catalogCaseKeys.has(existingCaseKey), true)
  }
  for (const trace of feature.sourceTrace) {
    assert.deepEqual(Object.keys(trace).sort(), featureSourceTraceFields.sort())
    assert.equal(typeof trace.file, 'string')
    assert.equal(typeof trace.symbol, 'string')
    const sourcePath = path.join(root, trace.file)
    assert.equal(fs.existsSync(sourcePath), true)
    assert.equal(fs.readFileSync(sourcePath, 'utf8').includes(trace.symbol), true)
  }
  for (const proposal of feature.proposedCases) {
    assert.equal(Number.isInteger(proposal.proposedSequence), true)
    proposedSequences.push(proposal.proposedSequence)
    assert.equal(proposal.proposedSequence > 203, true)
    assert.equal(/^Case \d+$/.test(proposal.mentorLabel), true)
    assert.doesNotMatch(proposal.mentorLabel, /UT-/)
    assert.equal(proposal.mentorLabel, `Case ${proposal.proposedSequence}`)
    assert.equal(typeof proposal.internalProposalKey, 'string')
    assert.doesNotMatch(proposal.internalProposalKey, /^Case /)
    assert.equal(proposedKeys.has(proposal.internalProposalKey), false)
    proposedKeys.add(proposal.internalProposalKey)
    assert.equal(proposal.candidateStatus, 'NOT_RUN')
    assert.ok(proposal.plannedTestFile)
    assert.equal(fs.existsSync(path.join(root, proposal.plannedTestFile)), true)
    assert.ok(proposal.plannedAssertions.length > 0)
    assert.ok(proposal.roleBoundary)
    assert.ok(proposal.executionBoundary)
    assert.equal(Array.isArray(proposal.sourceTrace), true)
    assert.ok(proposal.sourceTrace.length > 0)
    for (const trace of proposal.sourceTrace) {
      assert.deepEqual(Object.keys(trace).sort(), featureSourceTraceFields.sort())
      assert.equal(fs.existsSync(path.join(root, trace.file)), true)
      assert.equal(fs.readFileSync(path.join(root, trace.file), 'utf8').includes(trace.symbol), true)
    }
  }
}
assert.deepEqual(
  [...proposedSequences].sort((left, right) => left - right),
  Array.from({ length: proposedSequences.length }, (_, index) => 204 + index)
)
console.log('IDTS-110 catalog gap contract: PASS')
