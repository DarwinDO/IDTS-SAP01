#!/usr/bin/env node
'use strict'

// Contract for the DonHV-approved conversion of the 135 historical
// suite-to-case mappings into independently executed local cases.

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))

const manifest = readJson('docs/qa/idts-110-mapping-atomic-manifest.json')
const taxonomy = readJson('docs/pm/evidence/idts-110/donhv-case-taxonomy.json')
const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const numberMap = readJson('docs/qa/idts-110-case-number-map.json')
const approval = readJson('docs/pm/evidence/idts-110/catalog-approval.json')

const approved = taxonomy.cases.filter(item => item.reviewDecision === 'MAPPING_ONLY_NOT_PASS')
const catalogById = new Map(catalog.cases.map(item => [item.caseId, item]))
const numberById = new Map(numberMap.entries.map(item => [item.internalCaseKey, item.mentorNumber]))
const expectedOrder = approved
  .map(item => item.caseId)
  .sort((left, right) => numberById.get(left) - numberById.get(right))

assert.equal(approval.status, 'APPROVED_FOR_EXECUTION')
assert.equal(approval.approvedBy, 'DonHV')
assert.equal(approval.approvedCatalogCount, 278)
assert.equal(manifest.schemaVersion, '1.0')
assert.equal(manifest.jiraKey, 'IDTS-110')
assert.equal(manifest.authorization.approvedBy, 'DonHV')
assert.equal(manifest.authorization.approvalAlreadyGranted, true)
assert.equal(manifest.authorization.resultsPreApproved, false)
assert.equal(manifest.entries.length, 135)
assert.deepEqual(manifest.entries.map(item => item.internalCaseKey), expectedOrder)

assert.equal(new Set(manifest.entries.map(item => item.mentorNumber)).size, 135)
assert.equal(new Set(manifest.entries.map(item => item.internalCaseKey)).size, 135)
assert.equal(new Set(manifest.entries.map(item => item.selector)).size, 135)
assert.equal(manifest.entries.filter(item => item.testLevel === 'CAP_COMPONENT').length, 121)
assert.equal(manifest.entries.filter(item => item.testLevel === 'ODATA_CONTRACT').length, 14)

const domainCounts = Object.fromEntries(
  Object.entries(manifest.domainCounts).sort(([left], [right]) => left.localeCompare(right))
)
assert.deepEqual(domainCounts, {
  AI: 22,
  Assignment: 11,
  Attachment: 2,
  Authentication: 4,
  Bug: 11,
  Comment: 5,
  History: 7,
  Lifecycle: 45,
  Monitoring: 7,
  Notification: 9,
  Security: 8,
  Validation: 4
})

for (const entry of manifest.entries) {
  const definition = catalogById.get(entry.internalCaseKey)
  assert.ok(definition, `Missing catalog definition for ${entry.internalCaseKey}`)
  assert.equal(entry.mentorNumber, numberById.get(entry.internalCaseKey))
  assert.equal(entry.catalogEnvironment, 'HYBRID_BTP')
  assert.equal(entry.executionEnvironment, 'LOCAL')
  assert.equal(entry.selector, `--idts110-case=${entry.internalCaseKey}`)
  assert.equal(entry.testFile, 'scripts/qa/test-idts110-mapping-atomic-execution.js')
  assert.deepEqual(entry.allowedTerminalStatuses, ['PASS', 'FAIL'])
  assert.equal(entry.allowedTerminalStatuses.some(status => /MAPPING_ONLY/.test(status)), false)
  assert.equal(entry.precondition, definition.preconditions)
  assert.equal(entry.action, definition.input)
  assert.equal(entry.expectedResult, definition.expectedResult)
  assert.deepEqual(entry.sourceAssertions, definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`))
  assert.ok(entry.sourceAssertions.length > 0, `${entry.internalCaseKey} needs source assertions`)
  assert.equal(entry.evidenceRequirements.includes('case-specific result image'), true)
  assert.equal(entry.evidenceRequirements.includes('sanitized case manifest'), true)
}

console.log('IDTS-110 mapping atomic manifest: PASS — 135 local cases, 121 CAP + 14 OData, zero mapping-only terminal status.')
