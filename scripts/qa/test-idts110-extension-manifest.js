const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const generator = path.join(root, 'scripts/qa/generate-idts110-extension.js')
assert.equal(fs.existsSync(generator), true, 'deterministic extension generator is required')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const extension = readJson('docs/qa/idts-110-extension-cases.json')
const numberMap = readJson('docs/qa/idts-110-case-number-map.json')
const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const gapMatrix = readJson('docs/pm/evidence/idts-110/catalog-gap-matrix.json')
const featureInventory = readJson('docs/pm/evidence/idts-110/new-feature-coverage-gaps.json')

assert.equal(extension.schemaVersion, '1.0')
assert.equal(extension.sourceBaselineSha, '6eb6f73840d7150598a993f8656d2b44e5b0cd4b')
assert.deepEqual(extension.approvalReference, {
  pullRequest: 388,
  mergeSha: '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
})
const approval = readJson('docs/pm/evidence/idts-110/catalog-approval.json')
assert.equal(approval.status, 'APPROVED_FOR_EXECUTION')
assert.equal(approval.approvedBy, 'DonHV')
assert.equal(approval.approvedCatalogCount, 278)
assert.equal(extension.retainedTask2.length, 10)
assert.equal(extension.featureCandidates.length, 80)
assert.equal(numberMap.entries.length, 278)
assert.deepEqual(numberMap.entries.map(row => row.mentorNumber), Array.from({ length: 278 }, (_, i) => i + 1))
assert.equal(new Set(numberMap.entries.map(row => row.internalCaseKey)).size, 278)

const retainedKeys = [
  'IDTS110-P189', 'IDTS110-P190', 'IDTS110-P191', 'IDTS110-P194', 'IDTS110-P195',
  'IDTS110-P196', 'IDTS110-P197', 'IDTS110-P200', 'IDTS110-P202', 'IDTS110-P203'
]
const featureKeys = [
  'IDTS110-F204', 'IDTS110-F205', 'IDTS110-F206', 'IDTS110-F207', 'IDTS110-F208',
  'IDTS110-F209', 'IDTS110-F210', 'IDTS110-F210S', 'IDTS110-F211', 'IDTS110-F212',
  'IDTS110-F213', 'IDTS110-F214', 'IDTS110-F215', 'IDTS110-F216', 'IDTS110-F216R',
  'IDTS110-F217', 'IDTS110-F218', 'IDTS110-F219', 'IDTS110-F220', 'IDTS110-F220D',
  'IDTS110-F220R', 'IDTS110-F220N', 'IDTS110-F221', 'IDTS110-F222', 'IDTS110-F223',
  'IDTS110-F224', 'IDTS110-F225', 'IDTS110-F226', 'IDTS110-F227', 'IDTS110-F228',
  'IDTS110-F228E', 'IDTS110-F229', 'IDTS110-F230', 'IDTS110-F231', 'IDTS110-F231R',
  'IDTS110-F232', 'IDTS110-F233', 'IDTS110-F234', 'IDTS110-F235', 'IDTS110-F235I',
  'IDTS110-F235C', 'IDTS110-F236', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F239H', 'IDTS110-F239D',
  'IDTS110-F240', 'IDTS110-F240R', 'IDTS110-F241', 'IDTS110-F243', 'IDTS110-F243M',
  'IDTS110-F244', 'IDTS110-F245', 'IDTS110-F246', 'IDTS110-F246R', 'IDTS110-F246B',
  'IDTS110-F247', 'IDTS110-F247S', 'IDTS110-F247SS', 'IDTS110-F248', 'IDTS110-F248C',
  'IDTS110-F248N', 'IDTS110-F249', 'IDTS110-F249K', 'IDTS110-F249T', 'IDTS110-F250',
  'IDTS110-F250L', 'IDTS110-F250M', 'IDTS110-F250Q', 'IDTS110-F250R', 'IDTS110-F251',
  'IDTS110-F251R', 'IDTS110-F252', 'IDTS110-F252R', 'IDTS110-F252P', 'IDTS110-F253'
]
const rows = [...extension.retainedTask2, ...extension.featureCandidates]
assert.deepEqual(extension.retainedTask2.map(row => row.internalCaseKey), retainedKeys)
assert.deepEqual(extension.featureCandidates.map(row => row.internalCaseKey), featureKeys)
assert.deepEqual(extension.retainedTask2.map(row => row.mentorNumber), Array.from({ length: 10 }, (_, i) => i + 189))
assert.deepEqual(extension.featureCandidates.map(row => row.mentorNumber), Array.from({ length: 80 }, (_, i) => i + 199))
assert.equal(rows.some(row => row.internalCaseKey === 'IDTS110-F242'), false)
assert.deepEqual(extension.retainedTask2.map(row => row.sourceProposalSequence), [189, 190, 191, 194, 195, 196, 197, 200, 202, 203])
assert.deepEqual(extension.featureCandidates.map(row => row.sourceProposalSequence), Array.from({ length: 80 }, (_, i) => i + 204))

const requiredFields = [
  'internalCaseKey', 'candidateOrigin', 'sourceProposalSequence', 'mentorNumber',
  'domain', 'title', 'objective', 'classification', 'priority', 'testLevel',
  'environment', 'requirementIds', 'roles', 'coverage', 'preconditions', 'input',
  'steps', 'expectedResult', 'sourceTrace', 'plannedTestFile', 'plannedAssertions',
  'assertionId', 'plannedAssertion', 'acceptanceMode', 'roleBoundary',
  'executionBoundary', 'evidenceRequirements', 'candidateStatus', 'reviewStatus'
]
for (const row of rows) {
  for (const field of requiredFields) {
    assert.notEqual(row[field], undefined, row.internalCaseKey + ' missing ' + field)
    if (typeof row[field] === 'string') assert.ok(row[field].trim(), row.internalCaseKey + ' empty ' + field)
    if (Array.isArray(row[field])) assert.ok(row[field].length > 0, row.internalCaseKey + ' empty ' + field)
  }
  assert.equal(row.assertionId, row.internalCaseKey + '-A1')
  assert.equal(row.candidateStatus, 'NOT_RUN')
  assert.equal(row.reviewStatus, 'PENDING_DONHV_REVIEW')
  assert.equal(row.execution.status, 'NOT_RUN')
  assert.equal(row.execution.executor, null)
  assert.equal(row.execution.executedAt, null)
  assert.equal(row.execution.baselineSha, null)
  assert.equal(row.execution.deploySha, null)
  assert.equal(row.execution.actualResult, null)
  assert.deepEqual(row.execution.evidenceIds, [])
  assert.equal(row.sourceProposalSequence > 0, true)
  assert.equal(Number.isInteger(row.mentorNumber), true)
  assert.equal(new Set(row.coverage).size, row.coverage.length, row.internalCaseKey + ' duplicate coverage tag')
  assert.equal(row.plannedAssertions.length >= 1, true)
  assert.equal(row.sourceTrace.every(trace => typeof trace.file === 'string' && typeof trace.symbol === 'string'), true)
  for (const trace of row.sourceTrace) {
    const sourcePath = path.join(root, trace.file)
    assert.equal(fs.existsSync(sourcePath), true, row.internalCaseKey + ' missing ' + trace.file)
    assert.equal(fs.readFileSync(sourcePath, 'utf8').includes(trace.symbol), true, row.internalCaseKey + ' missing symbol ' + trace.symbol)
  }
}

const matrixRetained = new Map(gapMatrix.proposals
  .filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE')
  .map(row => [row.internalProposalKey, row]))
for (const row of extension.retainedTask2) {
  const source = matrixRetained.get(row.internalCaseKey)
  assert.ok(source)
  assert.deepEqual(row.sourceTrace, source.sourceTrace)
  assert.equal(row.plannedTestFile, source.plannedTestFile)
  assert.deepEqual(row.plannedAssertions, source.plannedAssertions)
  assert.equal(row.roleBoundary, source.roleBoundary)
  assert.equal(row.executionBoundary, source.executionBoundary)
}
const matrixKeys = gapMatrix.proposals.filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE').map(row => row.internalProposalKey)
assert.deepEqual(matrixKeys, retainedKeys)

const inventoryCases = new Map(featureInventory.features.flatMap(family => family.proposedCases.map(row => [row.internalProposalKey, row])))
for (const row of extension.featureCandidates) {
  const source = inventoryCases.get(row.internalCaseKey)
  assert.ok(source)
  assert.equal(source.candidateStatus, 'NOT_RUN')
  assert.deepEqual(row.sourceTrace, source.sourceTrace)
  assert.equal(row.plannedTestFile, source.plannedTestFile)
  assert.deepEqual(row.plannedAssertions, source.plannedAssertions)
  assert.equal(row.roleBoundary, source.roleBoundary)
  assert.equal(row.executionBoundary, source.executionBoundary)
  if (source.acceptanceMode) {
    assert.equal(row.acceptanceMode, source.acceptanceMode)
    assert.deepEqual(row.evidenceRequirements, source.evidenceRequirements)
  }
}
assert.equal(fs.existsSync(path.join(root, 'scripts/qa/test-user-admin-role-contract.js')), false)
for (const row of rows) {
  if (row.internalCaseKey !== 'IDTS110-P191') assert.equal(fs.existsSync(path.join(root, row.plannedTestFile)), true)
}

const expectedAdapterRows = {
  EXISTING_EXACT: ['IDTS110-F212', 'IDTS110-F213', 'IDTS110-F214', 'IDTS110-F219', 'IDTS110-F220D', 'IDTS110-F220R', 'IDTS110-F220N', 'IDTS110-P202', 'IDTS110-F221', 'IDTS110-F223', 'IDTS110-F224'],
  ADD_TO_EXISTING: ['IDTS110-P189', 'IDTS110-P190', 'IDTS110-P194', 'IDTS110-P195', 'IDTS110-P196', 'IDTS110-P197', 'IDTS110-P200', 'IDTS110-P203', 'IDTS110-F204', 'IDTS110-F205', 'IDTS110-F206', 'IDTS110-F207', 'IDTS110-F208', 'IDTS110-F209', 'IDTS110-F210', 'IDTS110-F210S', 'IDTS110-F211', 'IDTS110-F215', 'IDTS110-F216', 'IDTS110-F216R', 'IDTS110-F217', 'IDTS110-F218', 'IDTS110-F220', 'IDTS110-F222', 'IDTS110-F225', 'IDTS110-F226', 'IDTS110-F227', 'IDTS110-F228', 'IDTS110-F228E', 'IDTS110-F229', 'IDTS110-F230', 'IDTS110-F231', 'IDTS110-F231R'],
  NEW_ROLE_RUNNER: ['IDTS110-P191']
}
assert.equal(extension.adapterLedger.length, 45)
for (const [adapterClass, keys] of Object.entries(expectedAdapterRows)) {
  assert.deepEqual(extension.adapterLedger.filter(row => row.adapterClass === adapterClass).map(row => row.internalCaseKey), keys)
  for (const key of keys) assert.equal(rows.find(row => row.internalCaseKey === key).adapterClass, adapterClass)
}
for (const row of extension.featureCandidates.filter(row => row.mentorNumber >= 234)) assert.equal(Object.hasOwn(row, 'adapterClass'), false)

const visualKeys = new Set(['IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E', 'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F239H', 'IDTS110-F239D'])
assert.equal([...visualKeys].filter(key => key.startsWith('IDTS110-F23')).length, 8)
for (const row of rows) assert.equal(row.acceptanceMode === 'UI_RUNTIME_VISUAL', visualKeys.has(row.internalCaseKey))
for (const row of rows.filter(row => visualKeys.has(row.internalCaseKey))) {
  const evidenceText = row.evidenceRequirements.join(' ')
  assert.match(evidenceText, /programmatic.*precheck/i)
  assert.match(evidenceText, /browser\/runtime.*rendered UI/i)
  assert.match(evidenceText, /screenshot/i)
}

assert.deepEqual(numberMap.entries.map(row => row.internalCaseKey), catalog.cases.map(row => row.caseId))
assert.deepEqual(numberMap.entries.slice(188).map(row => row.internalCaseKey), rows.map(row => row.internalCaseKey))
assert.deepEqual(numberMap.entries.slice(188).map(row => row.mentorNumber), rows.map(row => row.mentorNumber))
assert.deepEqual(numberMap.entries.slice(188).map(row => row.sourceProposalSequence), rows.map(row => row.sourceProposalSequence))
assert.deepEqual(numberMap.entries.slice(188).map(row => row.candidateOrigin), rows.map(row => row.candidateOrigin))
assert.equal(new Set(rows.map(row => row.sourceProposalSequence)).size, 90)

assert.equal(extension.adapterSummary.EXISTING_EXACT, 11)
assert.equal(extension.adapterSummary.ADD_TO_EXISTING, 33)
assert.equal(extension.adapterSummary.NEW_ROLE_RUNNER, 1)
assert.equal(extension.statusPolicy.initialCandidateStatus, 'NOT_RUN')
assert.equal(extension.statusPolicy.resultPreApproval, false)
assert.match(approval.authorizationStatement, /does not pre-approve any execution result/i)
assert.deepEqual(approval.approvalReference, extension.approvalReference)
assert.equal(approval.approvalDate, '2026-09-05')
assert.equal(approval.resultsPreApproved, false)

const generatorCheck = childProcess.spawnSync(process.execPath, [generator, '--check'], {
  cwd: root,
  encoding: 'utf8'
})
assert.equal(generatorCheck.status, 0, generatorCheck.stderr || generatorCheck.stdout)

console.log('IDTS-110 extension manifest PASS: 10 retained, 80 feature, 90 total; compact 278-entry map; adapters 11/33/1.')
