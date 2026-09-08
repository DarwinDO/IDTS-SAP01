#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { execFileSync, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { buildReport, createReceiptManifest, defaults } = require('./generate-idts110-final-report.js')

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase()
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

const sourceRoot = path.resolve(__dirname, '..', '..')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-final-report-default-'))
const clone = path.join(temporary, 'repo')
try {
  execFileSync('git', ['clone', '--local', '--no-hardlinks', sourceRoot, clone], { stdio: 'pipe' })
  git(clone, ['config', 'user.email', 'idts110-test@example.invalid'])
  git(clone, ['config', 'user.name', 'IDTS-110 receipt lifecycle test'])
  if (git(sourceRoot, ['status', '--porcelain', '--', 'scripts/qa/generate-idts110-final-report.js'])) {
    fs.copyFileSync(path.join(sourceRoot, 'scripts', 'qa', 'generate-idts110-final-report.js'), path.join(clone, 'scripts', 'qa', 'generate-idts110-final-report.js'))
    git(clone, ['add', 'scripts/qa/generate-idts110-final-report.js'])
    git(clone, ['commit', '-m', 'test: stage current final report generator'])
  }
  fs.mkdirSync(path.join(clone, '.tmp', 'idts-110'), { recursive: true })
  fs.copyFileSync(path.join(sourceRoot, '.tmp', 'idts-110', 'all-results.json'), path.join(clone, '.tmp', 'idts-110', 'all-results.json'))
  fs.copyFileSync(path.join(sourceRoot, '.tmp', 'idts-110', 'mapping-atomic-results.json'), path.join(clone, '.tmp', 'idts-110', 'mapping-atomic-results.json'))
  fs.copyFileSync(path.join(sourceRoot, 'docs', 'qa', 'idts-110-unit-test-catalog.json'), path.join(clone, 'docs', 'qa', 'idts-110-unit-test-catalog.json'))
  fs.cpSync(path.join(sourceRoot, 'docs', 'pm', 'evidence', 'idts-110', 'cards'), path.join(clone, 'docs', 'pm', 'evidence', 'idts-110', 'cards'), { recursive: true, force: true })

  const config = defaults(clone)
  fs.mkdirSync(path.dirname(config.reviewArtifact), { recursive: true })
  fs.copyFileSync(path.join(sourceRoot, '.tmp', 'idts-110', 'workbook-v06-final-rereview.md'), config.reviewArtifact)
  fs.copyFileSync(path.join(sourceRoot, 'docs', 'pm', 'evidence', 'idts-110', 'mapping-execution-receipt.json'), config.mappingReceipt)
  fs.copyFileSync(path.join(sourceRoot, 'docs', 'pm', 'evidence', 'idts-110', 'source-result-ledger.json'), config.ledger)
  git(clone, ['add', '--force', path.relative(clone, config.reviewArtifact), path.relative(clone, config.mappingReceipt), path.relative(clone, config.ledger), 'docs/qa/idts-110-unit-test-catalog.json', 'docs/pm/evidence/idts-110/cards'])
  git(clone, ['commit', '-m', 'test: add v0.6 mapping fixtures'])
  const reviewedHead = git(clone, ['rev-parse', 'HEAD'])
  const workbookReceipt = JSON.parse(fs.readFileSync(config.workbookReceipt, 'utf8'))
  workbookReceipt.reviewedHead = reviewedHead
  workbookReceipt.worktreeClean = true
  workbookReceipt.validatorSha256 = sha256(config.workbookValidator)
  writeJson(config.workbookReceipt, workbookReceipt)
  const reviewReceipt = {
    kind: 'idts-110-workbook-v06-independent-review-receipt',
    schemaVersion: 1,
    reviewedHead,
    candidate: { sha256: workbookReceipt.candidate.fileSha256, sizeBytes: workbookReceipt.candidate.fileSizeBytes },
    pdf: { sha256: workbookReceipt.pdf.fileSha256, sizeBytes: workbookReceipt.pdf.fileSizeBytes, pageCount: workbookReceipt.pdf.pageCount, evidencePages: workbookReceipt.pdf.evidencePages, otherSheetPages: workbookReceipt.pdf.otherSheetPages },
    validationReceipt: { sha256: sha256(config.workbookReceipt) },
    reports: { priorGoReportSha256: sha256(config.reviewArtifact) },
    severityCounts: { Critical: 0, Major: 0, Important: 0 },
    verdict: 'GO'
  }
  writeJson(config.reviewReceipt, reviewReceipt)
  writeJson(config.receiptManifest, createReceiptManifest(config))
  git(clone, ['add', '--force', path.relative(clone, config.workbookReceipt), path.relative(clone, config.reviewReceipt), path.relative(clone, config.receiptManifest)])
  git(clone, ['commit', '-m', 'test: add receipt lifecycle fixtures'])

  fs.rmSync(config.output, { force: true })
  assert.equal(fs.existsSync(config.output), false, 'default report output must not preexist the CLI invocation')
  const generated = spawnSync(process.execPath, ['scripts/qa/generate-idts110-final-report.js'], { cwd: clone, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr || generated.stdout)
  assert.equal(fs.existsSync(config.output), true, 'default generator CLI must write its default report output')
  const report = JSON.parse(generated.stdout)
  const markdown = fs.readFileSync(config.output, 'utf8')
  assert.equal(report.output, 'docs/pm/evidence/idts-110/final-execution-report.md')
  assert.equal(report.authority.reviewHead, reviewedHead)
  assert.deepEqual({
    candidatePass: report.workbook.candidatePass,
    mappingOnly: report.workbook.mappingOnly,
    blocked: report.workbook.blocked,
    total: report.workbook.total,
    utEvidenceLinks: report.workbook.utEvidenceLinks,
    evidenceCardLinks: report.workbook.evidenceCardLinks
  }, { candidatePass: 265, mappingOnly: 0, blocked: 13, total: 278, utEvidenceLinks: 278, evidenceCardLinks: 0 })
  assert.match(markdown, /Candidate-only handoff\. Result review is \*\*PENDING_DONHV_REVIEW\*\*/)
  assert.ok(markdown.includes(`| Independent review head | \`${reviewedHead}\` |`))
  assert.match(markdown, /265 Candidate PASS \/ 13 Blocked \/ 278 total/)

  assert.throws(() => buildReport({ ...config, workbook: config.template }), /candidate workbook SHA/i, 'official template substitution must fail')

  const firstCard = path.join(config.cards, 'Case-001.png')
  fs.renameSync(firstCard, `${firstCard}.missing`)
  assert.throws(() => buildReport(config), /card|range|incomplete/i, 'a missing evidence card must fail the final-report gate')
  fs.renameSync(`${firstCard}.missing`, firstCard)

  const originalCard = fs.readFileSync(firstCard)
  fs.appendFileSync(firstCard, 'receipt lifecycle card substitution')
  assert.throws(() => buildReport(config), /receipt inputs are dirty/i, 'a modified canonical card must fail the dirty-worktree boundary')
  fs.writeFileSync(firstCard, originalCard)

  const unitResult = path.join(config.evidence, 'IDTS110-P189', 'result.json')
  const originalUnitResult = fs.readFileSync(unitResult)
  fs.appendFileSync(unitResult, '\nreceipt lifecycle unit substitution\n')
  assert.throws(() => buildReport(config), /receipt inputs are dirty/i, 'a substituted canonical unit artifact must fail the dirty-worktree boundary')
  fs.writeFileSync(unitResult, originalUnitResult)

  fs.renameSync(config.receiptManifest, `${config.receiptManifest}.missing`)
  assert.throws(() => buildReport(config), /missing input/i, 'missing manifest must fail')
  fs.renameSync(`${config.receiptManifest}.missing`, config.receiptManifest)

  const allowedFixture = path.join(clone, 'scripts', 'qa', 'test-idts110-complete-card-contract.js')
  fs.appendFileSync(allowedFixture, '\n// receipt lifecycle allowed fixture drift\n')
  assert.doesNotThrow(() => buildReport(config), 'the exact allowed PEM-redaction fixture may be dirty')
  fs.truncateSync(allowedFixture, fs.statSync(allowedFixture).size - '\n// receipt lifecycle allowed fixture drift\n'.length)

  const unrelatedDirty = path.join(clone, 'receipt-lifecycle-unrelated.txt')
  fs.writeFileSync(unrelatedDirty, 'unrelated dirty file\n')
  assert.throws(() => buildReport(config), /receipt inputs are dirty/i, 'an unrelated dirty path must fail closed')
  fs.rmSync(unrelatedDirty)

  fs.appendFileSync(config.reviewArtifact, '\nreceipt test tamper\n')
  assert.throws(() => buildReport(config), /review artifact SHA/i, 'tampered review artifact must fail')
  fs.truncateSync(config.reviewArtifact, fs.statSync(config.reviewArtifact).size - '\nreceipt test tamper\n'.length)

  const alteredReview = JSON.parse(fs.readFileSync(config.reviewReceipt, 'utf8'))
  alteredReview.severityCounts.Important = 1
  writeJson(config.reviewReceipt, alteredReview)
  assert.throws(() => buildReport(config), /review receipt SHA/i, 'tampered review receipt must fail')
  writeJson(config.reviewReceipt, reviewReceipt)

  const manifest = JSON.parse(fs.readFileSync(config.receiptManifest, 'utf8'))
  manifest.receiptSha256.review = '0'.repeat(64)
  writeJson(config.receiptManifest, manifest)
  assert.throws(() => buildReport(config), /review receipt SHA/i, 'tampered manifest must fail')
  writeJson(config.receiptManifest, { ...manifest, receiptSha256: { ...manifest.receiptSha256, workbook: sha256(config.workbookReceipt), review: sha256(config.reviewReceipt) } })

  fs.appendFileSync(path.join(clone, 'README.md'), '\nreceipt lifecycle source drift\n')
  git(clone, ['add', 'README.md'])
  git(clone, ['commit', '-m', 'test: introduce unrelated source drift'])
  assert.throws(() => buildReport(config), /receipt is stale/i, 'unrelated post-review source drift must fail')
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

console.log('IDTS-110 default final-report receipt lifecycle: PASS')
