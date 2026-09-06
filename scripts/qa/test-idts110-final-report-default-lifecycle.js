#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
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
  fs.mkdirSync(path.join(clone, '.tmp', 'idts-110'), { recursive: true })
  fs.copyFileSync(path.join(sourceRoot, '.tmp', 'idts-110', 'all-results.json'), path.join(clone, '.tmp', 'idts-110', 'all-results.json'))

  const config = defaults(clone)
  const reviewedHead = git(clone, ['rev-parse', 'HEAD'])
  fs.mkdirSync(path.dirname(config.reviewArtifact), { recursive: true })
  fs.copyFileSync(path.join(sourceRoot, '.superpowers', 'sdd', '2026-09-05-idts-110-atomic-execution-and-workbook', 'task-11-independent-review.md'), config.reviewArtifact)
  const workbookReceipt = JSON.parse(fs.readFileSync(config.workbookReceipt, 'utf8'))
  workbookReceipt.reviewedHead = reviewedHead
  workbookReceipt.worktreeClean = true
  workbookReceipt.validatorSha256 = sha256(config.workbookValidator)
  writeJson(config.workbookReceipt, workbookReceipt)
  const reviewReceipt = {
    kind: 'idts-110-independent-review-receipt',
    schemaVersion: 1,
    reviewedHead,
    worktreeClean: true,
    artifactSha256: sha256(config.reviewArtifact),
    counts: { critical: 0, major: 0, important: 0, deferredMinors: 2 }
  }
  writeJson(config.reviewReceipt, reviewReceipt)
  writeJson(config.receiptManifest, createReceiptManifest(config))
  git(clone, ['add', '--force', path.relative(clone, config.reviewArtifact), path.relative(clone, config.workbookReceipt), path.relative(clone, config.reviewReceipt), path.relative(clone, config.receiptManifest)])
  git(clone, ['commit', '-m', 'test: add receipt lifecycle fixtures'])

  const report = buildReport(config)
  assert.equal(report.authority.reviewHead, reviewedHead)
  assert.equal(fs.existsSync(config.output), true, 'default generator must write its default report output')

  assert.throws(() => buildReport({ ...config, workbook: config.template }), /candidate workbook SHA/i, 'official template substitution must fail')

  fs.renameSync(config.receiptManifest, `${config.receiptManifest}.missing`)
  assert.throws(() => buildReport(config), /missing input/i, 'missing manifest must fail')
  fs.renameSync(`${config.receiptManifest}.missing`, config.receiptManifest)

  fs.appendFileSync(config.reviewArtifact, '\nreceipt test tamper\n')
  assert.throws(() => buildReport(config), /review artifact SHA/i, 'tampered review artifact must fail')
  fs.truncateSync(config.reviewArtifact, fs.statSync(config.reviewArtifact).size - '\nreceipt test tamper\n'.length)

  const alteredReview = JSON.parse(fs.readFileSync(config.reviewReceipt, 'utf8'))
  alteredReview.counts.important = 1
  writeJson(config.reviewReceipt, alteredReview)
  assert.throws(() => buildReport(config), /review receipt SHA/i, 'tampered review receipt must fail')
  writeJson(config.reviewReceipt, reviewReceipt)

  const manifest = JSON.parse(fs.readFileSync(config.receiptManifest, 'utf8'))
  manifest.receiptSha256.review = '0'.repeat(64)
  writeJson(config.receiptManifest, manifest)
  assert.throws(() => buildReport(config), /review receipt SHA/i, 'tampered manifest must fail')
  writeJson(config.receiptManifest, { ...manifest, receiptSha256: { workbook: sha256(config.workbookReceipt), review: sha256(config.reviewReceipt) } })

  fs.appendFileSync(path.join(clone, 'README.md'), '\nreceipt lifecycle source drift\n')
  git(clone, ['add', 'README.md'])
  git(clone, ['commit', '-m', 'test: introduce unrelated source drift'])
  assert.throws(() => buildReport(config), /receipt is stale/i, 'unrelated post-review source drift must fail')
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

console.log('IDTS-110 default final-report receipt lifecycle: PASS')
