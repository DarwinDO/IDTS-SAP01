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
  const workbookReceipt = path.join(temporary, 'workbook-receipt.json')
  const reviewReceipt = path.join(temporary, 'review-receipt.json')
  fs.writeFileSync(candidate, 'candidate-workbook')
  fs.writeFileSync(template, 'official-template')
  fs.writeFileSync(reviewArtifact, '# Independent review\n')
  fs.writeFileSync(workbookReceipt, JSON.stringify({
    kind: 'idts-110-workbook-validation-receipt',
    schemaVersion: 1,
    reviewedHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    worktreeClean: true,
    candidate: { fileSha256: sha256(candidate) },
    template: { fileSha256: sha256(template) },
    statuses: { 'Candidate PASS': 130, 'Mapping Only': 135, Blocked: 13 },
    hyperlinks: { ut: 278, evidence: 278 },
    officeCli: { introducedIssues: [], baselineIssues: 15, candidateIssues: 15, validation: 'PASS' },
    fidelity: { status: 'PASS' },
    findings: []
  }, null, 2))
  fs.writeFileSync(reviewReceipt, JSON.stringify({
    kind: 'idts-110-independent-review-receipt',
    schemaVersion: 1,
    reviewedHead: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    worktreeClean: true,
    artifactSha256: sha256(reviewArtifact),
    counts: { critical: 0, major: 0, important: 0, deferredMinors: 2 }
  }, null, 2))

  const receiptHashes = { workbook: sha256(workbookReceipt), review: sha256(reviewReceipt) }
  const verified = verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes })
  assert.deepEqual(verified.workbook.statuses, { candidatePass: 130, mappingOnly: 135, blocked: 13, total: 278 })
  assert.deepEqual(verified.review.counts, { critical: 0, major: 0, important: 0, deferredMinors: 2 })

  assert.throws(
    () => verifyReceipts({ workbook: template, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes }),
    /candidate workbook SHA/i,
    'a substituted official template must be rejected'
  )

  const tampered = JSON.parse(fs.readFileSync(reviewReceipt, 'utf8'))
  tampered.counts.important = 0
  tampered.worktreeClean = false
  fs.writeFileSync(reviewReceipt, JSON.stringify(tampered, null, 2))
  assert.throws(
    () => verifyReceipts({ workbook: candidate, template, reviewArtifact, workbookReceipt, reviewReceipt, receiptHashes }),
    /review receipt SHA/i,
    'a modified review receipt must be rejected before its claims are trusted'
  )

  tampered.worktreeClean = true
  tampered.reviewedHead = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
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
