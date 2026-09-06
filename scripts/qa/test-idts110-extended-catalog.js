const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const extension = readJson('docs/qa/idts-110-extension-cases.json')
const numberMap = readJson('docs/qa/idts-110-case-number-map.json')
const newRows = [...extension.retainedTask2, ...extension.featureCandidates]

const sourceBaselineSha = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const historicalCatalogBaselineSha = 'bc0c47e522ae208384d4b23dda21535dcc683683'

assert.equal(catalog.cases.length, 278)
assert.equal(catalog.sourceBaselineSha, sourceBaselineSha)
assert.equal(catalog.historicalCatalogBaselineSha, historicalCatalogBaselineSha)
assert.deepEqual(catalog.approvalReference, extension.approvalReference)
assert.equal(catalog.mentorNumbering, 'SEQUENTIAL_ONLY')
assert.deepEqual(catalog.extensionSummary, {
  existing: 188,
  retainedTask2: 10,
  featureCandidates: 80,
  total: 278
})
assert.equal(Array.isArray(catalog.existingCaseOrder), true)
assert.equal(catalog.existingCaseOrder.length, 188)
assert.equal(catalog.cases.slice(0, 188).length, 188)
assert.deepEqual(catalog.cases.slice(0, 188).map(row => row.caseId), catalog.existingCaseOrder)
assert.equal(
  crypto.createHash('sha256').update(JSON.stringify(catalog.cases.slice(0, 188))).digest('hex'),
  'fb88127158ab2cf9bd3d8d9095f1c3a60869e1489b19b786d79fdf5127d191da'
)

const catalogByKey = new Map(catalog.cases.map(row => [row.caseId, row]))
assert.equal(catalogByKey.size, catalog.cases.length)
for (const row of newRows) {
  const definition = catalogByKey.get(row.internalCaseKey)
  assert.ok(definition, `${row.internalCaseKey} missing from extended catalog`)
  assert.equal(definition.mentorNumber, row.mentorNumber)
  assert.equal(definition.candidateOrigin, row.candidateOrigin)
  assert.equal(definition.sourceProposalSequence, row.sourceProposalSequence)
  assert.equal(definition.assertionId, row.assertionId)
  assert.equal(definition.acceptanceMode, row.acceptanceMode)
  assert.equal(definition.plannedTestFile, row.plannedTestFile)
  assert.deepEqual(definition.plannedAssertions, row.plannedAssertions)
  assert.equal(definition.plannedAssertion, row.plannedAssertion)
  assert.equal(definition.roleBoundary, row.roleBoundary)
  assert.equal(definition.executionBoundary, row.executionBoundary)
  assert.deepEqual(definition.evidenceRequirements, row.evidenceRequirements)
  assert.equal(definition.candidateStatus, 'NOT_RUN')
  assert.equal(definition.reviewStatus, 'PENDING_DONHV_REVIEW')
  assert.equal(definition.execution.status, 'NOT_RUN')
  assert.equal(definition.execution.executor, null)
  assert.equal(definition.execution.executedAt, null)
  assert.equal(definition.execution.baselineSha, null)
  assert.equal(definition.execution.deploySha, null)
  assert.equal(definition.execution.actualResult, null)
  assert.deepEqual(definition.execution.evidenceIds, [])
}

assert.deepEqual(catalog.cases.slice(188).map(row => row.caseId), newRows.map(row => row.internalCaseKey))
assert.deepEqual(numberMap.entries.map(row => row.mentorNumber), Array.from({ length: 278 }, (_, index) => index + 1))
assert.deepEqual(numberMap.entries.map(row => row.internalCaseKey), catalog.cases.map(row => row.caseId))
assert.deepEqual(numberMap.entries.map(row => row.sourceProposalSequence), [
  ...Array(188).fill(null),
  ...newRows.map(row => row.sourceProposalSequence)
])
assert.deepEqual(numberMap.entries.map(row => row.candidateOrigin), [
  ...Array(188).fill('EXISTING_CATALOG'),
  ...newRows.map(row => row.candidateOrigin)
])
assert.equal(numberMap.sourceBaselineSha, sourceBaselineSha)
assert.equal(numberMap.historicalCatalogBaselineSha, historicalCatalogBaselineSha)
assert.deepEqual(numberMap.approvalReference, extension.approvalReference)
assert.equal(numberMap.numbering, 'SEQUENTIAL_ONLY')

console.log('IDTS-110 extended catalog PASS: 188 existing + 10 retained + 80 feature = 278 NOT_RUN cases.')
