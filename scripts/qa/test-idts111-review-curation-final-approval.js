'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const result = spawnSync(process.execPath, ['scripts/qa/curate-idts111-latest-review.js', '--check'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

const manifestPath = path.join('docs/pm/evidence/idts-111/uat/UAT-COM-003/manifest.json')
const approvedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const otherManifest = JSON.parse(fs.readFileSync('docs/pm/evidence/idts-111/uat/UAT-COM-001/manifest.json', 'utf8'))
const previousArgv = process.argv
process.argv = [process.execPath, path.resolve('scripts/qa/curate-idts111-latest-review.js'), '--check']
const { expectedReviewFor, finalApprovedCaseIds } = require('./curate-idts111-latest-review')
process.argv = previousArgv

assert.deepEqual([...finalApprovedCaseIds], ['UAT-COM-003'])
assert.deepEqual(expectedReviewFor(approvedManifest), approvedManifest.donhvLatestReview)
assert.equal(expectedReviewFor(otherManifest).finalPassApproved, false)

const unallowlistedFinal = {
  ...otherManifest,
  candidateExecutionStatus: 'PASS',
  candidateOutcome: 'MEETS_EXPECTED_RESULT',
  donhvLatestReview: {
    ...otherManifest.donhvLatestReview,
    currentStatus: 'FINAL_PASS_APPROVED',
    finalPassApproved: true
  }
}
assert.throws(() => expectedReviewFor(unallowlistedFinal), /Final approval is not allowlisted: UAT-COM-001/)

const mismatchedApproved = {
  ...approvedManifest,
  candidateOutcome: 'DOES_NOT_MEET_EXPECTED_RESULT'
}
assert.throws(() => expectedReviewFor(mismatchedApproved), /Final approval metadata mismatch: UAT-COM-003/)

const wrongExecutor = structuredClone(approvedManifest)
wrongExecutor.executor = 'Someone Else'
assert.throws(() => expectedReviewFor(wrongExecutor), /Final approval contract mismatch: UAT-COM-003: executor/)

const wrongBugId = structuredClone(approvedManifest)
wrongBugId.testRecord.bugId = '00000000-0000-0000-0000-000000000000'
assert.throws(() => expectedReviewFor(wrongBugId), /Final approval contract mismatch: UAT-COM-003: testRecord\.bugId/)

const missingReadback = structuredClone(approvedManifest)
delete missingReadback.liveAcceptance.oneThousand.reloadResult
assert.throws(() => expectedReviewFor(missingReadback), /Final approval contract mismatch: UAT-COM-003: liveAcceptance\.oneThousand\.reloadResult/)

const wrongReadbackCount = structuredClone(approvedManifest)
wrongReadbackCount.liveAcceptance.oneThousandOne.commentListCountBefore = 4
wrongReadbackCount.liveAcceptance.oneThousandOne.commentListCountAfterReload = 4
assert.throws(() => expectedReviewFor(wrongReadbackCount), /Final approval contract mismatch: UAT-COM-003: liveAcceptance\.oneThousandOne\.commentListCountBefore/)

const missingCapReason = structuredClone(approvedManifest)
delete missingCapReason.liveAcceptance.oneThousandOne.capReason
assert.throws(() => expectedReviewFor(missingCapReason), /Final approval contract mismatch: UAT-COM-003: liveAcceptance\.oneThousandOne\.capReason/)

const brokenHistoricalPreservation = structuredClone(approvedManifest)
brokenHistoricalPreservation.historicalFailure.preserved = false
assert.throws(() => expectedReviewFor(brokenHistoricalPreservation), /Final approval contract mismatch: UAT-COM-003: historicalFailure\.preserved/)

console.log('IDTS-111 final-approval curation regression: PASS')
