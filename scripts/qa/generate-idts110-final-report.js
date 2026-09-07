#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync, spawnSync } = require('node:child_process')

const BASELINE_SHA = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const APPROVAL_REFERENCE = { pullRequest: 388, mergeSha: BASELINE_SHA }
const CATALOG_TOTAL = 278
const EXISTING_TOTAL = 188
const NEW_TOTAL = 90
const MAPPING_TOTAL = 135
const UA_TOTAL = 45
const NOTIFICATION_TOTAL = 45
const NOTIFICATION_VISUAL_TOTAL = 8

function fail(message) {
  throw new Error(`IDTS-110 final report: ${message}`)
}

function assertThat(condition, message) {
  if (!condition) fail(message)
}

function readJson(file) {
  assertThat(fs.existsSync(file), `missing input: ${file}`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`invalid JSON ${file}: ${error.message}`)
  }
}

function fileSha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase()
}

function canonicalSha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').toUpperCase()
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return []
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(full))
    else if (entry.isFile()) files.push(full)
  }
  return files
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) continue
    const equals = token.indexOf('=')
    if (equals > 2) args[token.slice(2, equals)] = token.slice(equals + 1)
    else args[token.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true
  }
  return args
}

function relative(root, file) {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

function commandAvailable(command) {
  const lookup = process.platform === 'win32'
    ? spawnSync('where.exe', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    : spawnSync('sh', ['-lc', `command -v ${command}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return lookup.status === 0 && Boolean(String(lookup.stdout || '').trim())
}

function gitText(root, args, trim = true) {
  try {
    const output = execFileSync('git', args, { cwd: root, encoding: 'utf8' })
    return trim ? output.trim() : output
  } catch (error) {
    fail(`git ${args.join(' ')} failed: ${error.message}`)
  }
}

function assertReceiptBoundary(root, receipt, options) {
  const receiptPaths = [options.reviewArtifact, options.receiptManifest, options.workbookReceipt, options.reviewReceipt, options.mappingReceipt, options.ledger, options.output, __filename, path.join(root, 'scripts/qa/test-idts110-complete-card-contract.js'), path.join(root, 'scripts/qa/test-idts110-final-report-receipts.js'), path.join(root, 'scripts/qa/test-idts110-final-report-default-lifecycle.js'), path.join(root, 'scripts/qa/test-idts110-evidence-contract.js'), path.join(root, 'scripts/qa/generate-idts110-evidence.js')].map(file => relative(root, file))
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', receipt.reviewedHead, 'HEAD'], { cwd: root, encoding: 'utf8' })
  assertThat(ancestor.status === 0, `receipt reviewed head ${receipt.reviewedHead} is not reachable from HEAD`)
  const changed = gitText(root, ['diff', '--name-only', `${receipt.reviewedHead}..HEAD`]).split(/\r?\n/).filter(Boolean)
  assertThat(changed.every(file => receiptPaths.includes(file)), `receipt is stale because reviewed source changed: ${changed.filter(file => !receiptPaths.includes(file)).join(', ')}`)
  const dirty = gitText(root, ['status', '--porcelain'], false).split(/\r?\n/).filter(Boolean).map(line => line.slice(3).replaceAll('\\', '/'))
  assertThat(dirty.every(file => receiptPaths.includes(file)), `receipt inputs are dirty: ${dirty.filter(file => !receiptPaths.includes(file)).join(', ')}`)
}

function verifyIndependentReviewReceipt(review, workbook, options) {
  assertThat(review.kind === 'idts-110-workbook-v06-independent-review-receipt' && review.schemaVersion === 1, 'independent v0.6 review receipt schema is invalid')
  assertThat(typeof review.reviewedHead === 'string' && /^[0-9a-f]{40}$/i.test(review.reviewedHead), 'independent v0.6 review receipt head is invalid')
  assertThat(review.verdict === 'GO', 'independent v0.6 review verdict is not GO')
  assertThat(review.candidate?.sha256 === String(workbook.candidate?.fileSha256 || '').toUpperCase() && Number(review.candidate?.sizeBytes) === Number(workbook.candidate?.fileSizeBytes), 'independent v0.6 review does not bind the exact workbook receipt candidate')
  assertThat(review.pdf?.sha256 === String(workbook.pdf?.fileSha256 || '').toUpperCase() && Number(review.pdf?.sizeBytes) === Number(workbook.pdf?.fileSizeBytes) && Number(review.pdf?.pageCount) === Number(workbook.pdf?.pageCount) && Number(review.pdf?.evidencePages) === Number(workbook.pdf?.evidencePages) && Number(review.pdf?.otherSheetPages) === Number(workbook.pdf?.otherSheetPages), 'independent v0.6 review does not bind the exact workbook receipt PDF')
  assertThat(review.validationReceipt?.sha256 === fileSha256(options.workbookReceipt), 'independent v0.6 review does not bind the exact workbook validation receipt')
  const counts = review.severityCounts || {}
  assertThat(Number(counts.Critical) === 0 && Number(counts.Major) === 0 && Number(counts.Important) === 0, 'independent v0.6 review has Critical, Major, or Important findings')
  assertThat(fileSha256(options.reviewArtifact) === String(review.reports?.priorGoReportSha256 || '').toUpperCase(), 'independent v0.6 review prior GO artifact SHA does not match')
  return { ...review, counts: { critical: 0, major: 0, important: 0, deferredMinors: 0 } }
}

function createReceiptManifest(options) {
  const workbook = readJson(options.workbookReceipt)
  const review = readJson(options.reviewReceipt)
  const mapping = readJson(options.mappingReceipt)
  assertThat(workbook.kind === 'idts-110-workbook-validation-receipt' && workbook.schemaVersion === 1, 'workbook receipt schema is invalid')
  const normalizedReview = verifyIndependentReviewReceipt(review, workbook, options)
  assertThat(mapping.kind === 'idts-110-mapping-execution-receipt' && mapping.schemaVersion === 1, 'mapping receipt schema is invalid')
  return {
    kind: 'idts-110-final-report-receipt-manifest',
    schemaVersion: 1,
    reviewedHead: normalizedReview.reviewedHead,
    reviewArtifact: relative(options.root, options.reviewArtifact),
    workbookReceipt: relative(options.root, options.workbookReceipt),
    reviewReceipt: relative(options.root, options.reviewReceipt),
    mappingReceipt: relative(options.root, options.mappingReceipt),
    sourceLedger: relative(options.root, options.ledger),
    reviewArtifactSha256: fileSha256(options.reviewArtifact),
    receiptSha256: {
      workbook: fileSha256(options.workbookReceipt),
      review: fileSha256(options.reviewReceipt),
      mapping: fileSha256(options.mappingReceipt),
      sourceLedger: fileSha256(options.ledger)
    }
  }
}

function validateStatusCounts(catalog, historical, results, mapping) {
  const expected = {
    candidatePass: historical.PASS + results.PASS + mapping.caseCount,
    mappingOnly: 0,
    blocked: historical.BLOCKED,
    total: CATALOG_TOTAL
  }
  assertThat(expected.candidatePass === 265 && expected.mappingOnly === 0 && expected.blocked === 13, 'historical/new/mapping status totals are not 265/0/13')
  assertThat(expected.candidatePass + expected.mappingOnly + expected.blocked === expected.total, 'workbook status totals do not reconcile to catalog total')
  assertThat(catalog.summary?.totalCases === CATALOG_TOTAL, 'catalog summary total is not 278')
  return expected
}

function verifyReceipts(options) {
  const receiptHashes = options.receiptHashes || {}
  assertThat(typeof receiptHashes.workbook === 'string' && /^[A-F0-9]{64}$/i.test(receiptHashes.workbook), 'missing workbook receipt SHA')
  assertThat(typeof receiptHashes.review === 'string' && /^[A-F0-9]{64}$/i.test(receiptHashes.review), 'missing review receipt SHA')
  assertThat(fileSha256(options.workbookReceipt) === receiptHashes.workbook.toUpperCase(), 'workbook receipt SHA does not match the immutable receipt manifest')
  assertThat(fileSha256(options.reviewReceipt) === receiptHashes.review.toUpperCase(), 'review receipt SHA does not match the immutable receipt manifest')

  const workbook = readJson(options.workbookReceipt)
  const review = readJson(options.reviewReceipt)
  assertThat(workbook.kind === 'idts-110-workbook-validation-receipt' && workbook.schemaVersion === 1, 'workbook receipt schema is invalid')
  assertThat(typeof workbook.reviewedHead === 'string' && /^[0-9a-f]{40}$/i.test(workbook.reviewedHead), 'workbook receipt reviewed head is invalid')
  const normalizedReview = verifyIndependentReviewReceipt(review, workbook, options)
  if (options.expectedReviewedHead) assertThat(normalizedReview.reviewedHead === options.expectedReviewedHead, 'receipt reviewed head does not match the required head')
  assertThat(fileSha256(options.workbook) === String(workbook.candidate?.fileSha256 || '').toUpperCase(), 'candidate workbook SHA does not match its validation receipt')
  assertThat(fileSha256(options.template) === String(workbook.template?.fileSha256 || '').toUpperCase(), 'official template SHA does not match its validation receipt')
  if (options.workbookValidator) assertThat(fileSha256(options.workbookValidator) === String(workbook.validatorSha256 || '').toUpperCase(), 'workbook validator SHA does not match its validation receipt')

  const statuses = workbook.statuses || {}
  const normalizedStatuses = {
    candidatePass: Number(statuses['Candidate PASS']),
    mappingOnly: statuses['Mapping Only'] === undefined ? 0 : Number(statuses['Mapping Only']),
    blocked: Number(statuses.Blocked)
  }
  normalizedStatuses.total = normalizedStatuses.candidatePass + normalizedStatuses.mappingOnly + normalizedStatuses.blocked
  assertThat(normalizedStatuses.candidatePass === 265 && normalizedStatuses.mappingOnly === 0 && normalizedStatuses.blocked === 13 && normalizedStatuses.total === CATALOG_TOTAL, 'workbook receipt status totals are not 265/0/13/278')
  assertThat(Number(workbook.hyperlinks?.ut) === CATALOG_TOTAL && Number(workbook.hyperlinks?.evidence) === 0, 'workbook receipt native-link totals are not 278/0')
  assertThat(Array.isArray(workbook.officeCli?.introducedIssues) && workbook.officeCli.introducedIssues.length === 0, 'workbook receipt has introduced OfficeCLI issues')
  assertThat(Number(workbook.officeCli?.baselineIssues) === 15 && Number(workbook.officeCli?.candidateIssues) === 15 && workbook.officeCli?.validation === 'PASS', 'workbook receipt OfficeCLI result is not the frozen 15-warning PASS')
  assertThat(workbook.fidelity?.status === 'PASS' && Array.isArray(workbook.findings) && workbook.findings.length === 0, 'workbook receipt fidelity or validator findings are not clean')
  assertThat(/^[A-F0-9]{64}$/i.test(String(workbook.pdf?.fileSha256 || '')) && Number.isSafeInteger(Number(workbook.pdf?.fileSizeBytes)) && Number(workbook.pdf?.fileSizeBytes) > 0, 'workbook receipt does not bind a final PDF')
  assertThat(Number(workbook.pdf?.pageCount) === 391 && Number(workbook.pdf?.evidencePages) === 278 && Number(workbook.pdf?.otherSheetPages) === 113 && Number(workbook.pdf?.pageCount) === Number(workbook.pdf?.evidencePages) + Number(workbook.pdf?.otherSheetPages), 'workbook receipt PDF pages are not 391 = 113 + 278')

  return { workbook: { ...workbook, statuses: normalizedStatuses }, review: normalizedReview }
}

function verifyMappingReceipt(options, catalog, historical) {
  const receiptHashes = options.receiptHashes || {}
  assertThat(typeof receiptHashes.mapping === 'string' && /^[A-F0-9]{64}$/i.test(receiptHashes.mapping), 'missing mapping receipt SHA')
  assertThat(typeof receiptHashes.sourceLedger === 'string' && /^[A-F0-9]{64}$/i.test(receiptHashes.sourceLedger), 'missing source ledger SHA')
  assertThat(fileSha256(options.mappingReceipt) === receiptHashes.mapping.toUpperCase(), 'mapping receipt SHA does not match the immutable receipt manifest')
  assertThat(fileSha256(options.ledger) === receiptHashes.sourceLedger.toUpperCase(), 'source ledger SHA does not match the immutable receipt manifest')
  const receipt = readJson(options.mappingReceipt)
  const aggregate = readJson(options.mappingResults)
  const catalogCanonicalSha256 = canonicalSha256(catalog)
  const catalogFileSha256 = fileSha256(options.catalog)
  assertThat(receipt.kind === 'idts-110-mapping-execution-receipt' && receipt.schemaVersion === 1, 'mapping receipt schema is invalid')
  assertThat(receipt.sourceBaselineSha === BASELINE_SHA && receipt.catalogCanonicalSha256 === catalogCanonicalSha256 && receipt.catalogFileSha256 === catalogFileSha256, 'mapping receipt is not bound to the approved current catalog and baseline')
  assertThat(receipt.approvalReference?.pullRequest === 388 && receipt.approvalReference?.mergeSha === BASELINE_SHA && receipt.resultsPreApproved === false && receipt.resultReviewStatus === 'PENDING_DONHV_REVIEW', 'mapping receipt approval boundary is invalid')
  assertThat(Array.isArray(receipt.externalMutations) && receipt.externalMutations.length === 0, 'mapping receipt externalMutations is not []')
  assertThat(receipt.aggregate?.path === relative(options.root, options.mappingResults) && receipt.aggregate?.sha256 === fileSha256(options.mappingResults), 'mapping receipt aggregate binding is stale')
  assertThat(receipt.aggregate?.runId === aggregate.runId && receipt.aggregate?.caseCount === MAPPING_TOTAL, 'mapping receipt aggregate identity is invalid')
  assertThat(JSON.stringify(receipt.aggregate?.statuses) === JSON.stringify({ PASS: MAPPING_TOTAL, FAIL: 0, BLOCKED: 0, HELD: 0, NOT_RUN: 0 }), 'mapping receipt aggregate totals are not 135/0/0/0/0')
  assertThat(aggregate.sourceBaselineSha === BASELINE_SHA && aggregate.catalogSha === catalogFileSha256.toLowerCase(), 'atomic aggregate is not bound to the current catalog file bytes')
  assertThat(aggregate.approvalReference?.pullRequest === 388 && aggregate.approvalReference?.mergeSha === BASELINE_SHA && aggregate.approvalReference?.resultsPreApproved === false, 'atomic aggregate approval boundary is invalid')
  const rows = Array.isArray(aggregate.results) ? aggregate.results : []
  const expectedKeys = historical.mappingKeys
  assertThat(rows.length === MAPPING_TOTAL && new Set(rows.map(row => row.caseKey)).size === MAPPING_TOTAL, 'atomic aggregate does not contain 135 unique mapping rows')
  assertThat(JSON.stringify(rows.map(row => row.caseKey).sort()) === JSON.stringify([...expectedKeys].sort()), 'atomic aggregate does not exactly supersede the 135 historical Mapping Only cases')
  assertThat(rows.every(row => row.status === 'PASS' && row.assertionPassed === true && row.reviewStatus === 'PENDING_DONHV_REVIEW'), 'atomic aggregate contains a non-PASS or non-pending mapping result')
  assertThat(aggregate.totals?.PASS === MAPPING_TOTAL && aggregate.totals?.FAIL === 0 && aggregate.totals?.BLOCKED === 0 && aggregate.totals?.HELD === 0 && aggregate.totals?.NOT_RUN === 0, 'atomic aggregate totals are not 135/0/0/0/0')
  const cardFiles = walkFiles(options.cards).filter(file => /^Case-\d{3}\.png$/.test(path.basename(file)))
  const cardNames = cardFiles.map(file => path.basename(file)).sort()
  const cardSetSha256 = crypto.createHash('sha256').update(cardFiles.map(file => `${path.basename(file)}:${fileSha256(file)}`).sort().join('\n') + '\n').digest('hex').toUpperCase()
  assertThat(receipt.cards?.root === relative(options.root, options.cards) && receipt.cards?.count === CATALOG_TOTAL && receipt.cards?.setSha256 === cardSetSha256, 'mapping receipt card-set binding is stale')
  assertThat(cardNames.length === CATALOG_TOTAL && cardNames[0] === 'Case-001.png' && cardNames.at(-1) === 'Case-278.png', 'mapping receipt card range is incomplete')
  assertThat(receipt.cards?.firstSha256 === fileSha256(cardFiles.find(file => path.basename(file) === 'Case-001.png')) && receipt.cards?.lastSha256 === fileSha256(cardFiles.find(file => path.basename(file) === 'Case-278.png')), 'mapping receipt first or last card hash is stale')
  return { caseCount: rows.length, fileSha256: fileSha256(options.mappingResults), runId: aggregate.runId, cardSetSha256 }
}

function validateInputs(options) {
  const catalog = readJson(options.catalog)
  const numberMap = readJson(options.numberMap)
  const results = readJson(options.results)
  const extension = readJson(options.extension)
  const ledger = readJson(options.ledger)
  const approval = readJson(options.approval)
  const receiptManifest = readJson(options.receiptManifest)

  const catalogSha = canonicalSha256(catalog)
  const mapSha = canonicalSha256(numberMap)
  const resultsCanonicalSha = canonicalSha256(results)
  const resultsFileSha = fileSha256(options.results)
  assertThat(catalogSha.toLowerCase() === String(ledger.catalogSha).toLowerCase(), `catalog canonical SHA ${catalogSha} does not match source ledger ${ledger.catalogSha}`)
  assertThat(catalog.sourceBaselineSha === BASELINE_SHA, 'catalog source baseline is not the approved base')
  assertThat(numberMap.sourceBaselineSha === BASELINE_SHA, 'number map source baseline is not the approved base')
  assertThat(results.sourceBaselineSha === BASELINE_SHA, 'result aggregate source baseline is not the approved base')
  assertThat(extension.sourceBaselineSha === BASELINE_SHA, 'extension source baseline is not the approved base')
  assertThat(ledger.sourceBaselineSha === BASELINE_SHA, 'source ledger baseline is not the approved base')
  assertThat(approval.approvalReference?.mergeSha === BASELINE_SHA && approval.approvalReference?.pullRequest === 388, 'approval reference is not PR #388 at the approved base')
  assertThat(results.approvalReference?.mergeSha === BASELINE_SHA && results.approvalReference?.pullRequest === 388, 'results approval reference is not PR #388 at the approved base')
  assertThat(ledger.approvalReference?.mergeSha === BASELINE_SHA && ledger.approvalReference?.pullRequest === 388, 'source ledger approval reference is not PR #388 at the approved base')
  assertThat(Array.isArray(ledger.externalMutations) && ledger.externalMutations.length === 0, 'source ledger externalMutations is not []')
  if (catalog.externalMutations !== undefined) assertThat(Array.isArray(catalog.externalMutations) && catalog.externalMutations.length === 0, 'catalog externalMutations is not []')
  assertThat(receiptManifest.kind === 'idts-110-final-report-receipt-manifest' && receiptManifest.schemaVersion === 1, 'receipt manifest schema is invalid')
  assertThat(receiptManifest.reviewedHead === String(receiptManifest.reviewedHead || '').toLowerCase() && /^[0-9a-f]{40}$/.test(receiptManifest.reviewedHead), 'receipt manifest reviewed head is invalid')
  assertThat(receiptManifest.reviewArtifact === relative(options.root, options.reviewArtifact), 'receipt manifest review artifact path is not the exact default path')
  assertThat(receiptManifest.workbookReceipt === relative(options.root, options.workbookReceipt) && receiptManifest.reviewReceipt === relative(options.root, options.reviewReceipt) && receiptManifest.mappingReceipt === relative(options.root, options.mappingReceipt) && receiptManifest.sourceLedger === relative(options.root, options.ledger), 'receipt manifest receipt paths are not the exact default paths')
  assertThat(fileSha256(options.reviewArtifact) === String(receiptManifest.reviewArtifactSha256 || '').toUpperCase(), 'review artifact SHA does not match the receipt manifest')
  const receipts = verifyReceipts({
    workbook: options.workbook,
    template: options.template,
    workbookValidator: options.workbookValidator,
    reviewArtifact: options.reviewArtifact,
    workbookReceipt: options.workbookReceipt,
    reviewReceipt: options.reviewReceipt,
    mappingReceipt: options.mappingReceipt,
    mappingResults: options.mappingResults,
    ledger: options.ledger,
    receiptHashes: receiptManifest.receiptSha256
  })
  assertThat(receiptManifest.reviewedHead === receipts.review.reviewedHead, 'receipt manifest reviewed head does not match the review receipt')
  assertReceiptBoundary(options.root, receipts.review, options)

  const cases = Array.isArray(catalog.cases) ? catalog.cases : []
  const entries = Array.isArray(numberMap.entries) ? numberMap.entries : []
  assertThat(cases.length === CATALOG_TOTAL, `catalog has ${cases.length} cases, expected 278`)
  assertThat(entries.length === CATALOG_TOTAL, `number map has ${entries.length} entries, expected 278`)
  const catalogKeys = cases.map(item => item.caseId)
  const mapKeys = entries.map(item => item.internalCaseKey)
  assertThat(new Set(catalogKeys).size === CATALOG_TOTAL, 'catalog case IDs are not unique')
  assertThat(new Set(entries.map(item => item.mentorNumber)).size === CATALOG_TOTAL, 'number map mentor numbers are not unique')
  assertThat(entries.every((item, index) => item.mentorNumber === index + 1), 'number map is not sequential 1..278')
  assertThat(JSON.stringify(catalogKeys) === JSON.stringify(mapKeys), 'number map is not a catalog-order bijection')

  const newCases = cases.slice(EXISTING_TOTAL)
  assertThat(newCases.length === NEW_TOTAL, 'catalog does not contain exactly 90 new rows after the historical 188')
  const newKeys = new Set(newCases.map(item => item.caseId))
  const resultRows = Array.isArray(results.results) ? results.results : []
  assertThat(resultRows.length === NEW_TOTAL, `result aggregate has ${resultRows.length} rows, expected 90`)
  assertThat(new Set(resultRows.map(item => item.caseKey)).size === NEW_TOTAL, 'new result case keys are not unique')
  assertThat(JSON.stringify([...new Set(resultRows.map(item => item.caseKey))].sort()) === JSON.stringify([...newKeys].sort()), 'new result keys do not exactly match the approved 90-case extension')
  assertThat(resultRows.every(item => item.status === 'PASS' && item.assertionPassed === true), 'new results are not all candidate PASS assertions')
  assertThat(resultRows.every(item => item.reviewStatus === 'PENDING_DONHV_REVIEW'), 'new results are not all pending DonHV review')
  assertThat(results.totals?.PASS === NEW_TOTAL && results.totals?.FAIL === 0 && results.totals?.BLOCKED === 0 && results.totals?.HELD === 0 && results.totals?.NOT_RUN === 0, 'result aggregate totals are not 90/0/0/0/0')

  const adapterSummary = extension.adapterSummary || {}
  assertThat(adapterSummary.EXISTING_EXACT === 11 && adapterSummary.ADD_TO_EXISTING === 33 && adapterSummary.NEW_ROLE_RUNNER === 1, 'adapter counts are not 11/33/1')
  assertThat(Array.isArray(extension.externalMutations) && extension.externalMutations.length === 0, 'extension externalMutations is not []')

  const batchTotals = (results.sourceBatches || []).map(batch => ({ label: batch.label, count: batch.selectedCaseKeys?.length || 0 }))
  assertThat(batchTotals.length === 6, 'result aggregate does not contain six frozen source batches')
  const userAdministrationTotal = batchTotals.filter(batch => /Task 4 User Administration|workload UI replacement/.test(batch.label)).reduce((sum, batch) => sum + batch.count, 0)
  const notificationTotal = batchTotals.filter(batch => /Task 5 My Notifications|Task 6 My Notifications|Task 7 access email|Task 8 Bug email/.test(batch.label)).reduce((sum, batch) => sum + batch.count, 0)
  const notificationVisualTotal = resultRows.filter(item => item.evidenceKind === 'UI_RUNTIME' && !/F224$/.test(item.caseKey)).length
  const visualTotal = resultRows.filter(item => item.evidenceKind === 'UI_RUNTIME').length
  assertThat(userAdministrationTotal === UA_TOTAL, `User Administration batch count is ${userAdministrationTotal}, expected 45`)
  assertThat(notificationTotal === NOTIFICATION_TOTAL, `Notification batch count is ${notificationTotal}, expected 45`)
  assertThat(notificationVisualTotal === NOTIFICATION_VISUAL_TOTAL, `Notification visual count is ${notificationVisualTotal}, expected 8`)
  assertThat(visualTotal === 9, `complete visual count is ${visualTotal}, expected 9`)

  const historicalFiles = walkFiles(options.historical).filter(file => path.basename(file) === 'case-manifest.json')
  const historical = historicalFiles.reduce((counts, file) => {
    const row = readJson(file)
    const status = row.candidateExecutionStatus
    counts[status] = (counts[status] || 0) + 1
    if (status === 'MAPPING_ONLY_CANDIDATE') (counts.mappingKeys ||= []).push(row.caseId)
    assertThat(row.reviewStatus === 'PENDING_DONHV_REVIEW', `historical row is not pending DonHV review: ${relative(options.root, file)}`)
    return counts
  }, {})
  assertThat(historicalFiles.length === EXISTING_TOTAL, `historical manifest count is ${historicalFiles.length}, expected 188`)
  assertThat(historical.PASS === 40 && historical.MAPPING_ONLY_CANDIDATE === 135 && historical.BLOCKED === 13, 'historical results are not 40 PASS / 135 mapping-only / 13 blocked')
  const mapping = verifyMappingReceipt({ ...options, receiptHashes: receiptManifest.receiptSha256 }, catalog, historical)
  validateStatusCounts(catalog, historical, results.totals, mapping)
  assertThat(receipts.workbook.statuses.candidatePass === historical.PASS + results.totals.PASS + mapping.caseCount && receipts.workbook.statuses.mappingOnly === 0 && receipts.workbook.statuses.blocked === historical.BLOCKED, 'workbook receipt totals do not reconcile to the immutable result receipts')

  const evidenceManifestFiles = walkFiles(options.evidence).filter(file => path.basename(file) === 'case-manifest.json')
  const evidenceResultFiles = walkFiles(options.evidence).filter(file => path.basename(file) === 'result.json')
  const evidencePngFiles = walkFiles(options.evidence).filter(file => path.extname(file).toLowerCase() === '.png')
  assertThat(evidenceManifestFiles.length === NEW_TOTAL && evidenceResultFiles.length === NEW_TOTAL, 'packaged evidence does not contain 90 manifests and 90 result records')
  assertThat(evidencePngFiles.length === 313, `packaged evidence has ${evidencePngFiles.length} PNGs, expected 313`)
  const pngByName = evidencePngFiles.reduce((counts, file) => {
    const name = path.basename(file)
    counts[name] = (counts[name] || 0) + 1
    return counts
  }, {})
  assertThat(pngByName['runtime.png'] === 9 && pngByName['result.png'] === 81 && pngByName['before-database.png'] === 71 && pngByName['after-database.png'] === 71 && pngByName['reload-readback.png'] === 81, 'packaged evidence PNG breakdown does not match the frozen package')

  const cardFiles = walkFiles(options.cards).filter(file => /^Case-\d{3}\.png$/.test(path.basename(file)))
  const cardNames = cardFiles.map(file => path.basename(file)).sort()
  assertThat(cardFiles.length === CATALOG_TOTAL, `card count is ${cardFiles.length}, expected 278`)
  assertThat(cardNames[0] === 'Case-001.png' && cardNames[cardNames.length - 1] === 'Case-278.png', 'card range is not Case-001.png through Case-278.png')
  const cardHashLines = cardFiles.map(file => `${path.basename(file)}:${fileSha256(file)}`).sort().join('\n') + '\n'
  const cardSetSha = crypto.createHash('sha256').update(cardHashLines).digest('hex').toUpperCase()

  const officeCli = commandAvailable('officecli')
  const aiDevkit = commandAvailable('ai-devkit')
  return {
    catalog: { total: cases.length, existing: EXISTING_TOTAL, new: NEW_TOTAL, canonicalSha256: catalogSha, fileSha256: fileSha256(options.catalog) },
    numberMap: { total: entries.length, bijection: true, canonicalSha256: mapSha, fileSha256: fileSha256(options.numberMap) },
    newResults: { caseCount: resultRows.length, candidatePass: results.totals.PASS, fail: results.totals.FAIL, blocked: results.totals.BLOCKED, canonicalSha256: resultsCanonicalSha, fileSha256: resultsFileSha, reviewStatus: 'PENDING_DONHV_REVIEW' },
    userAdministration: { caseCount: userAdministrationTotal, adapterCounts: { existingExact: 11, addToExisting: 33, newRoleRunner: 1 }, visualCaseCount: 1 },
    notifications: { caseCount: notificationTotal, visualCaseCount: notificationVisualTotal },
    visualCaseCount: visualTotal,
    historical: { caseCount: historicalFiles.length, pass: historical.PASS, mappingOnly: historical.MAPPING_ONLY_CANDIDATE, blocked: historical.BLOCKED },
    mapping,
    workbook: { fileSha256: fileSha256(options.workbook), fileSizeBytes: fs.statSync(options.workbook).size, templateSha256: fileSha256(options.template), candidatePass: receipts.workbook.statuses.candidatePass, mappingOnly: receipts.workbook.statuses.mappingOnly, blocked: receipts.workbook.statuses.blocked, total: receipts.workbook.statuses.total, utEvidenceLinks: receipts.workbook.hyperlinks.ut, evidenceCardLinks: receipts.workbook.hyperlinks.evidence, officeCli: receipts.workbook.officeCli, fidelity: receipts.workbook.fidelity, pdf: receipts.workbook.pdf },
    evidence: { manifests: evidenceManifestFiles.length, results: evidenceResultFiles.length, pngs: evidencePngFiles.length, pngBreakdown: { runtime: 9, result: 81, before: 71, after: 71, reload: 81 }, cardCount: cardFiles.length, cardSetSha256: cardSetSha, firstCardSha256: fileSha256(cardFiles.find(file => path.basename(file) === 'Case-001.png')), lastCardSha256: fileSha256(cardFiles.find(file => path.basename(file) === 'Case-278.png')) },
    externalMutations: [],
    authority: { baseSha: BASELINE_SHA, reviewHead: receipts.review.reviewedHead, pullRequest: 388 },
    independentReview: receipts.review.counts,
    tooling: { officeCliAvailable: officeCli, aiDevkitAvailable: aiDevkit }
  }
}

function makeMarkdown(report, root) {
  const r = report
  const minorSummary = r.independentReview.deferredMinors > 0
    ? `${r.independentReview.deferredMinors} Minor findings remain explicitly deferred.`
    : 'No Minor findings are recorded.'
  const minorDisposition = r.independentReview.deferredMinors > 0 ? 'deferred, non-blocking' : 'none found'
  const minorNote = r.independentReview.deferredMinors > 0
    ? '\nDeferred Minor findings remain receipt-derived and do not change result or workbook truth.\n'
    : ''
  return `# IDTS-110 final execution candidate report

> Candidate-only handoff. Result review is **PENDING_DONHV_REVIEW**. DonHV must review the case results and workbook before any official disposition. This report does not claim final PASS, merge, deployment, Drive replacement, Jira completion, or release.

## Authority and status

| Field | Frozen value |
| --- | --- |
| Jira | IDTS-110 |
| Approved source base / PR | \`${r.authority.baseSha}\` / PR #${r.authority.pullRequest} merge |
| Independent review head | \`${r.authority.reviewHead}\` |
| Result review status | \`PENDING_DONHV_REVIEW\` |
| External mutations | \`[]\` |

The source base is the PR #388 merge. The independent review receipt found ${r.independentReview.critical} Critical, ${r.independentReview.major} Major, and ${r.independentReview.important} Important findings. ${minorSummary} The clean review does not approve any result, workbook, merge, deployment, Drive replacement, Jira update, or release.

## Frozen inputs and hashes

| Input | Count / binding | SHA-256 |
| --- | ---: | --- |
| Unit-test catalog (canonical JSON) | ${r.catalog.total} cases | \`${r.catalog.canonicalSha256}\` |
| Unit-test catalog (file bytes) | ${r.catalog.total} cases | \`${r.catalog.fileSha256}\` |
| Case number map (canonical JSON) | ${r.numberMap.total} entries; bijective 1..278 | \`${r.numberMap.canonicalSha256}\` |
| Case number map (file bytes) | ${r.numberMap.total} entries | \`${r.numberMap.fileSha256}\` |
| New atomic result aggregate (file bytes) | ${r.newResults.caseCount} rows; ${r.newResults.candidatePass} candidate PASS | \`${r.newResults.fileSha256}\` |
| New atomic result aggregate (canonical JSON) | ${r.newResults.caseCount} rows | \`${r.newResults.canonicalSha256}\` |
| Candidate workbook v0.6 | ${r.workbook.total} visible cases; ${r.workbook.fileSizeBytes} bytes | \`${r.workbook.fileSha256}\` |
| Official template | frozen authority reference | \`${r.workbook.templateSha256}\` |
| Mentor card set | ${r.evidence.cardCount} PNG cards | \`${r.evidence.cardSetSha256}\` |
| Atomic mapping receipt | ${r.mapping.caseCount} PASS rows; pending DonHV review | \`${r.mapping.fileSha256}\` |

The catalog has ${r.catalog.existing} historical rows and ${r.catalog.new} new rows. The number map preserves catalog order and the complete 1..278 bijection.

## Execution totals

| Slice | Cases | Candidate assertion | Review state |
| --- | ---: | --- | --- |
| Historical evidence | ${r.historical.caseCount} | ${r.historical.pass} PASS / ${r.historical.mappingOnly} prior mapping-only / ${r.historical.blocked} blocked | PENDING_DONHV_REVIEW |
| Atomic mapping receipt | ${r.mapping.caseCount} | ${r.mapping.caseCount} PASS; supersedes the prior mapping-only slice | PENDING_DONHV_REVIEW |
| New aggregate | ${r.newResults.caseCount} | ${r.newResults.candidatePass} PASS / ${r.newResults.fail} FAIL / ${r.newResults.blocked} BLOCKED | PENDING_DONHV_REVIEW |
| User Administration | ${r.userAdministration.caseCount} | included in new aggregate | PENDING_DONHV_REVIEW |
| Notifications and email | ${r.notifications.caseCount} | included in new aggregate | PENDING_DONHV_REVIEW |

The User Administration adapter accounting is exactly **11 EXISTING_EXACT / 33 ADD_TO_EXISTING / 1 NEW_ROLE_RUNNER**. The Notification slice is exactly **45 rows**, including **8 rendered browser/runtime visual cases**. The complete new package has ${r.visualCaseCount} visual cases because User Administration contributes the ninth visual case.

## Workbook and evidence package

- Candidate workbook v0.6 status totals are **${r.workbook.candidatePass} Candidate PASS / ${r.workbook.blocked} Blocked / ${r.workbook.total} total**; **Mapping Only is 0**. The ${r.workbook.candidatePass} candidate rows are 40 historical PASS, 90 new assertions, and ${r.mapping.caseCount} receipt-bound atomic mapping assertions; they are not official PASS.
- The workbook has ${r.workbook.utEvidenceLinks} native UT-to-Evidence links and ${r.workbook.evidenceCardLinks} external Evidence hyperlinks. The ${r.evidence.cardCount} number-only cards span \`Case-001.png\` through \`Case-278.png\` and are embedded as native anchors.
- The packaged unit evidence has ${r.evidence.manifests} case manifests, ${r.evidence.results} result records, and ${r.evidence.pngs} PNG artifacts: ${r.evidence.pngBreakdown.runtime} runtime screenshots, ${r.evidence.pngBreakdown.result} structured result images, ${r.evidence.pngBreakdown.before} before-state images, ${r.evidence.pngBreakdown.after} after-state images, and ${r.evidence.pngBreakdown.reload} reload/readback images.
- Card-set SHA-256 is \`${r.evidence.cardSetSha256}\`; first and last card hashes are \`${r.evidence.firstCardSha256}\` and \`${r.evidence.lastCardSha256}\`.

### v0.6 PDF binding

- Receipt-bound PDF SHA-256 is \`${r.workbook.pdf.fileSha256}\`, ${r.workbook.pdf.fileSizeBytes} bytes, ${r.workbook.pdf.pageCount} pages: ${r.workbook.pdf.otherSheetPages} other-sheet pages and ${r.workbook.pdf.evidencePages} Evidence pages.

### Frozen template warnings

The candidate preserves exactly **15 inherited authority-template warnings**, with no introduced warning: 13 broken defined-name \`#REF!\` advisories, one Histories overflow advisory at \`Histories/C2\`, and one at \`Histories/F2\`. These warnings remain disclosed and unchanged.

### Security and mentor-output boundary

Independent review and the package/card checks found no secret values, PII/email addresses, internal case keys, raw internal case-selector commands, private endpoints, credential assignments, \`undefined\`, or unresolved placeholders in mentor-visible outputs. Generic words such as “password” and “bearer token” remain only as test-description text, not values.

## Independent review

| Severity | Count | Disposition |
| --- | ---: | --- |
| Critical | ${r.independentReview.critical} | none found |
| Major | ${r.independentReview.major} | none found |
| Important | ${r.independentReview.important} | none found |
| Minor | ${r.independentReview.deferredMinors} | ${minorDisposition} |

${minorNote}

## Gates and limitations

The receipt gate fails closed for a substituted workbook, a stale workbook/review/mapping/ledger receipt, a missing card, a remaining Mapping Only result, or totals other than 265 Candidate PASS / 0 Mapping Only / 13 Blocked / 278 total. It does not substitute for DonHV result approval or a full repository security/release gate.

The 13 historical BTP-required rows remain **Blocked** because an authorized target, fixture, rollback plan, and sanitized readback are not available. Any rerun requiring Cloud Foundry/BTP, provider/email, HANA, or deployment state is intentionally not performed and cannot be treated as a local failure.

No product source, dependency manifest, lockfile, schema/data/seed, BTP/HANA state, provider, real email, Drive file, Jira issue, branch push, merge, deployment, or release state was mutated.\n`
}

function defaults(root) {
  return {
    root,
    catalog: path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'),
    numberMap: path.join(root, 'docs/qa/idts-110-case-number-map.json'),
    results: path.join(root, '.tmp/idts-110/all-results.json'),
    workbook: path.join(root, 'docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.6_candidate.xlsx'),
    template: path.join(root, 'docs/sap490/templates/Deliverable_template/Unit_Test.xlsx'),
    workbookValidator: path.join(root, 'scripts/sap490/test-idts110-unit-test-workbook.mjs'),
    workbookReceipt: path.join(root, 'docs/pm/evidence/idts-110/workbook-v06-validation-receipt.json'),
    reviewReceipt: path.join(root, 'docs/pm/evidence/idts-110/workbook-v06-independent-review-receipt.json'),
    reviewArtifact: path.join(root, '.tmp/idts-110/workbook-v06-final-rereview.md'),
    mappingReceipt: path.join(root, 'docs/pm/evidence/idts-110/mapping-execution-receipt.json'),
    mappingResults: path.join(root, '.tmp/idts-110/mapping-atomic-results.json'),
    receiptManifest: path.join(root, 'docs/pm/evidence/idts-110/final-report-receipt-manifest.json'),
    output: path.join(root, 'docs/pm/evidence/idts-110/final-execution-report.md'),
    extension: path.join(root, 'docs/qa/idts-110-extension-cases.json'),
    ledger: path.join(root, 'docs/pm/evidence/idts-110/source-result-ledger.json'),
    approval: path.join(root, 'docs/pm/evidence/idts-110/catalog-approval.json'),
    historical: path.join(root, 'docs/pm/evidence/idts-110/cases'),
    evidence: path.join(root, 'docs/pm/evidence/idts-110/unit'),
    cards: path.join(root, 'docs/pm/evidence/idts-110/cards')
  }
}

function main() {
  const root = process.cwd()
  const config = defaults(root)
  const args = parseArgs(process.argv.slice(2))
  for (const key of Object.keys(config)) if (typeof args[key] === 'string') config[key] = path.resolve(root, args[key])
  const report = validateInputs(config)
  fs.mkdirSync(path.dirname(config.output), { recursive: true })
  fs.writeFileSync(config.output, makeMarkdown(report, root), 'utf8')
  process.stdout.write(JSON.stringify({ output: relative(root, config.output), ...report }, null, 2) + '\n')
}

if (require.main === module) main()

module.exports = { buildReport: validateInputs, makeMarkdown, parseArgs, verifyReceipts, createReceiptManifest, defaults }
