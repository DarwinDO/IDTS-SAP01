'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const removedCaseIds = [
  'UAT-AI-011',
  'UAT-AI-012',
  'UAT-AI-014',
  'UAT-AI-015',
  'UAT-AI-016',
  'UAT-ATT-004',
  'UAT-ATT-005',
  'UAT-AUD-003',
  'UAT-AUTH-002',
  'UAT-AUTH-003',
  'UAT-AUTH-004',
  'UAT-BUG-005',
  'UAT-CLS-003'
]

const catalogPath = path.resolve('docs/qa/idts-111-uat-catalog.json')
const evidenceRoot = path.resolve('docs/pm/evidence/idts-111/uat')
const summaryPath = path.resolve('docs/pm/evidence/idts-111/latest-review-summary.json')

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
assert.equal(catalog.cases.length, 77, 'official catalog must contain 77 retained cases')
assert.equal(catalog.executionTruth.prepared, 77, 'prepared count must match retained catalog')
assert.deepEqual(catalog.cases.map(item => item.displayNumber), Array.from({ length: 77 }, (_, index) => String(index + 1)))
assert.deepEqual(catalog.cases.filter(item => removedCaseIds.includes(item.caseId)), [])

const manifestDirectories = fs.readdirSync(evidenceRoot, { withFileTypes: true }).filter(item => item.isDirectory())
assert.equal(manifestDirectories.length, 44, 'review package must contain 44 retained manifests')
for (const caseId of removedCaseIds) assert.equal(fs.existsSync(path.join(evidenceRoot, caseId)), false, `${caseId} evidence directory must be removed`)

const ai010 = JSON.parse(fs.readFileSync(path.join(evidenceRoot, 'UAT-AI-010', 'manifest.json'), 'utf8'))
assert.deepEqual(ai010.consolidatedDecisionVariants?.map(item => item.decision), ['Reject', 'Ignore'])
assert.equal(ai010.evidence.some(item => item.file === '01-decision-before-reload.png'), true)
assert.equal(ai010.evidence.some(item => item.file === 'ignore-03-pending-again-after-reload.png'), true)

const curation = spawnSync(process.execPath, ['scripts/qa/curate-idts111-latest-review.js', '--check'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})
assert.equal(curation.status, 0, `${curation.stdout}\n${curation.stderr}`)

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
assert.equal(summary.manifests, 44)
assert.deepEqual(summary.currentDisposition, {
  MEETS_EXPECTED_RESULT: 24,
  DOES_NOT_MEET_EXPECTED_RESULT: 8,
  BLOCKED: 12
})
assert.equal(summary.evidenceReferences, 76)
assert.equal(summary.uniqueEvidenceHashes, 66)
assert.equal(summary.latestEvidenceUpdate?.caseId, 'UAT-UX-002')
assert.equal(summary.latestEvidenceUpdate?.result, 'PARTIAL')
assert.equal(summary.latestEvidenceUpdate?.finalPassApproved, false)

console.log('IDTS-127 UAT catalog reduction regression: PASS')
