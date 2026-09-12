'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const result = spawnSync(process.execPath, ['scripts/qa/curate-idts111-latest-review.js', '--check'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

const manifestPath = path.join('docs/pm/evidence/idts-111/uat/UAT-COM-003/manifest.json')
const approvedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const approvedReceiptPath = path.resolve('docs/pm/evidence/idts-111/uat/UAT-COM-003/05-live-readback-receipt.json')
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

const wrongActorRole = structuredClone(approvedManifest)
wrongActorRole.testRecord.actorRole = 'Tester'
assert.throws(() => expectedReviewFor(wrongActorRole), /Final approval contract mismatch: UAT-COM-003: testRecord\.actorRole/)

const wrongEnvironment = structuredClone(approvedManifest)
wrongEnvironment.testRecord.environment = 'Local SQLite'
assert.throws(() => expectedReviewFor(wrongEnvironment), /Final approval contract mismatch: UAT-COM-003: testRecord\.environment/)

const pendingBoundary = structuredClone(approvedManifest)
pendingBoundary.reviewBoundary = 'Final PASS approved; pending DonHV review'
assert.throws(() => expectedReviewFor(pendingBoundary), /Final approval contract mismatch: UAT-COM-003: reviewBoundary/)

function sha256 (file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase()
}

function withReceiptVariant (mutateReceipt, assertion) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts111-final-receipt-'))
  try {
    const manifestPath = path.join(temporary, 'manifest.json')
    const receiptPath = path.join(temporary, '05-live-readback-receipt.json')
    const receipt = JSON.parse(fs.readFileSync(approvedReceiptPath, 'utf8'))
    mutateReceipt(receipt)
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
    const manifest = structuredClone(approvedManifest)
    manifest.evidence.find(item => item.file === '05-live-readback-receipt.json').sha256 = sha256(receiptPath)
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    assertion(manifest, manifestPath)
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}

withReceiptVariant(receipt => {
  receipt.approvedMergeSha = '0000000000000000000000000000000000000000'
}, (manifest, manifestPath) => {
  assert.throws(() => expectedReviewFor(manifest, manifestPath), /Final approval contract mismatch: UAT-COM-003: receipt\.approvedMergeSha/)
})

withReceiptVariant(receipt => {
  delete receipt.currentReadOnlyReload
}, (manifest, manifestPath) => {
  assert.throws(() => expectedReviewFor(manifest, manifestPath), /Final approval contract mismatch: UAT-COM-003: receipt\.currentReadOnlyReload/)
})

{
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts111-final-receipt-missing-'))
  try {
    const manifestPath = path.join(temporary, 'manifest.json')
    fs.writeFileSync(manifestPath, `${JSON.stringify(approvedManifest, null, 2)}\n`, 'utf8')
    assert.throws(() => expectedReviewFor(approvedManifest, manifestPath), /Missing final approval receipt: UAT-COM-003/)
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}

{
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts111-final-write-'))
  try {
    const evidencePath = path.join(process.cwd(), 'docs/pm/evidence/idts-111/uat')
    const temporaryEvidencePath = path.join(temporary, 'docs/pm/evidence/idts-111/uat')
    fs.cpSync(evidencePath, temporaryEvidencePath, { recursive: true })
    const temporarySummaryPath = path.join(temporary, 'docs/pm/evidence/idts-111/latest-review-summary.json')
    fs.copyFileSync(path.join(process.cwd(), 'docs/pm/evidence/idts-111/latest-review-summary.json'), temporarySummaryPath)
    const git = args => {
      const result = spawnSync('git', args, { cwd: temporary, encoding: 'utf8' })
      assert.equal(result.status, 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
    }
    git(['init'])
    git(['config', 'user.email', 'idts111-test@example.invalid'])
    git(['config', 'user.name', 'IDTS-111 curation regression'])
    git(['add', '.'])
    git(['commit', '-m', 'test fixture'])
    const malformedPath = path.join(temporaryEvidencePath, 'UAT-COM-003', 'manifest.json')
    const malformed = JSON.parse(fs.readFileSync(malformedPath, 'utf8'))
    malformed.donhvLatestReview.currentStatus = 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW'
    malformed.donhvLatestReview.finalPassApproved = false
    fs.writeFileSync(malformedPath, `${JSON.stringify(malformed, null, 2)}\n`, 'utf8')
    const writeResult = spawnSync(process.execPath, [path.resolve('scripts/qa/curate-idts111-latest-review.js')], {
      cwd: temporary,
      encoding: 'utf8'
    })
    assert.notEqual(writeResult.status, 0, `${writeResult.stdout}\n${writeResult.stderr}`)
    assert.match(`${writeResult.stdout}\n${writeResult.stderr}`, /Final approval metadata mismatch: UAT-COM-003/)
    const afterWrite = JSON.parse(fs.readFileSync(malformedPath, 'utf8'))
    assert.equal(afterWrite.donhvLatestReview.currentStatus, 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW')
    assert.equal(afterWrite.donhvLatestReview.finalPassApproved, false)
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}

const brokenHistoricalPreservation = structuredClone(approvedManifest)
brokenHistoricalPreservation.historicalFailure.preserved = false
assert.throws(() => expectedReviewFor(brokenHistoricalPreservation), /Final approval contract mismatch: UAT-COM-003: historicalFailure\.preserved/)

console.log('IDTS-111 final-approval curation regression: PASS')
