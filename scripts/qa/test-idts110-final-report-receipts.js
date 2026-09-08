#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { verifyReceipts } = require('./generate-idts110-final-report.js')

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase()
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-final-report-receipts-'))
try {
  const candidate = path.join(temporary, 'candidate.xlsx')
  const template = path.join(temporary, 'template.xlsx')
  const reviewArtifact = path.join(temporary, 'independent-review.md')
  const pdf = path.join(temporary, 'candidate.pdf')
  const workbookReceipt = path.join(temporary, 'workbook-receipt.json')
  const reviewReceipt = path.join(temporary, 'review-receipt.json')
  fs.writeFileSync(candidate, 'candidate-workbook')
  fs.writeFileSync(template, 'official-template')
  fs.writeFileSync(reviewArtifact, '# Independent review\n')
  fs.writeFileSync(pdf, 'candidate-pdf')
  fs.writeFileSync(workbookReceipt, JSON.stringify({
    kind: 'idts-110-workbook-validation-receipt',
    schemaVersion: 1,
    reviewedHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    worktreeClean: true,
    candidate: { fileSha256: sha256(candidate), fileSizeBytes: fs.statSync(candidate).size },
    template: { fileSha256: sha256(template) },
    statuses: { 'Candidate PASS': 265, Blocked: 13 },
    hyperlinks: { ut: 278, evidence: 0 },
    officeCli: { introducedIssues: [], baselineIssues: 15, candidateIssues: 15, validation: 'PASS' },
    fidelity: { status: 'PASS' },
    pdf: { fileSha256: sha256(pdf), fileSizeBytes: fs.statSync(pdf).size, pageCount: 391, evidencePages: 278, otherSheetPages: 113 },
    findings: []
  }, null, 2))
  fs.writeFileSync(reviewReceipt, JSON.stringify({
    kind: 'idts-110-workbook-v06-independent-review-receipt',
    schemaVersion: 1,
    reviewedHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    candidate: { sha256: sha256(candidate), sizeBytes: fs.statSync(candidate).size },
    pdf: { sha256: sha256(pdf), sizeBytes: fs.statSync(pdf).size, pageCount: 391, evidencePages: 278, otherSheetPages: 113 },
    validationReceipt: { sha256: sha256(workbookReceipt) },
    reports: { priorGoReportSha256: sha256(reviewArtifact) },
    severityCounts: { Critical: 0, Major: 0, Important: 0 },
    verdict: 'GO'
  }, null, 2))

  const receiptHashes = { workbook: sha256(workbookReceipt), review: sha256(reviewReceipt) }
  const verified = verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes })
  assert.deepEqual(verified.workbook.statuses, { candidatePass: 265, mappingOnly: 0, blocked: 13, total: 278 })
  assert.deepEqual(verified.review.counts, { critical: 0, major: 0, important: 0, deferredMinors: 0 })

  assert.throws(
    () => verifyReceipts({ workbook: template, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes }),
    /candidate workbook SHA/i,
    'a substituted official template must be rejected'
  )

  const originalReviewBytes = fs.readFileSync(reviewReceipt)
  const mappingOnly = JSON.parse(fs.readFileSync(workbookReceipt, 'utf8'))
  mappingOnly.statuses['Mapping Only'] = 1
  mappingOnly.statuses['Candidate PASS'] = 264
  fs.writeFileSync(workbookReceipt, JSON.stringify(mappingOnly, null, 2))
  const mappingReview = JSON.parse(originalReviewBytes)
  mappingReview.validationReceipt.sha256 = sha256(workbookReceipt)
  fs.writeFileSync(reviewReceipt, JSON.stringify(mappingReview, null, 2))
  const mappingOnlyHashes = { workbook: sha256(workbookReceipt), review: sha256(reviewReceipt) }
  assert.throws(
    () => verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes: mappingOnlyHashes }),
    /mapping|265\/0\/13/i,
    'a v0.6 receipt with a remaining Mapping Only result must be rejected'
  )
  mappingOnly.statuses = { 'Candidate PASS': 265, Blocked: 13 }
  fs.writeFileSync(workbookReceipt, JSON.stringify(mappingOnly, null, 2))
  fs.writeFileSync(reviewReceipt, originalReviewBytes)

  const tampered = JSON.parse(fs.readFileSync(reviewReceipt, 'utf8'))
  tampered.severityCounts.Important = 1
  fs.writeFileSync(reviewReceipt, JSON.stringify(tampered, null, 2))
  assert.throws(
    () => verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes }),
    /review receipt SHA/i,
    'a modified review receipt must be rejected before its claims are trusted'
  )

  tampered.reviewedHead = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  tampered.severityCounts.Important = 0
  fs.writeFileSync(reviewReceipt, JSON.stringify(tampered, null, 2))
  const mismatchedHeadHashes = { workbook: sha256(workbookReceipt), review: sha256(reviewReceipt) }
  assert.throws(
    () => verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes: mismatchedHeadHashes, expectedReviewedHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }),
    /reviewed head/i,
    'a hash-valid receipt for a different reviewed head must be rejected'
  )
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

console.log('IDTS-110 final-report receipt contract: PASS')
