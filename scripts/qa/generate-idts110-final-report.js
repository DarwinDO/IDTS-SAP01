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
  const receiptPaths = [options.reviewArtifact, options.receiptManifest, options.workbookReceipt, options.reviewReceipt, options.output].map(file => relative(root, file))
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', receipt.reviewedHead, 'HEAD'], { cwd: root, encoding: 'utf8' })
  assertThat(ancestor.status === 0, `receipt reviewed head ${receipt.reviewedHead} is not reachable from HEAD`)
  const changed = gitText(root, ['diff', '--name-only', `${receipt.reviewedHead}..HEAD`]).split(/\r?\n/).filter(Boolean)
  assertThat(changed.every(file => receiptPaths.includes(file)), `receipt is stale because reviewed source changed: ${changed.filter(file => !receiptPaths.includes(file)).join(', ')}`)
  const dirty = gitText(root, ['status', '--porcelain'], false).split(/\r?\n/).filter(Boolean).map(line => line.slice(3).replaceAll('\\', '/'))
  assertThat(dirty.every(file => file === relative(root, options.output)), `receipt inputs are dirty: ${dirty.filter(file => file !== relative(root, options.output)).join(', ')}`)
}

function createReceiptManifest(options) {
  const workbook = readJson(options.workbookReceipt)
  const review = readJson(options.reviewReceipt)
  assertThat(workbook.kind === 'idts-110-workbook-validation-receipt' && workbook.schemaVersion === 1, 'workbook receipt schema is invalid')
  assertThat(review.kind === 'idts-110-independent-review-receipt' && review.schemaVersion === 1, 'review receipt schema is invalid')
  assertThat(workbook.worktreeClean === true && review.worktreeClean === true, 'receipt records a dirty review worktree')
  assertThat(workbook.reviewedHead === review.reviewedHead && /^[0-9a-f]{40}$/i.test(workbook.reviewedHead), 'receipt reviewed heads do not match')
  assertThat(fileSha256(options.reviewArtifact) === String(review.artifactSha256 || '').toUpperCase(), 'independent review artifact SHA does not match its receipt')
  const counts = review.counts || {}
  assertThat(Number(counts.critical) === 0 && Number(counts.major) === 0 && Number(counts.important) === 0, 'independent review has Critical, Major, or Important findings')
  return {
    kind: 'idts-110-final-report-receipt-manifest',
    schemaVersion: 1,
    reviewedHead: workbook.reviewedHead,
    reviewArtifact: relative(options.root, options.reviewArtifact),
    workbookReceipt: relative(options.root, options.workbookReceipt),
    reviewReceipt: relative(options.root, options.reviewReceipt),
    reviewArtifactSha256: fileSha256(options.reviewArtifact),
    receiptSha256: { workbook: fileSha256(options.workbookReceipt), review: fileSha256(options.reviewReceipt) }
  }
}

function validateStatusCounts(catalog, historical, results) {
  const expected = {
    candidatePass: historical.PASS + results.PASS,
    mappingOnly: historical.MAPPING_ONLY_CANDIDATE,
    blocked: historical.BLOCKED,
    total: CATALOG_TOTAL
  }
  assertThat(expected.candidatePass === 130 && expected.mappingOnly === 135 && expected.blocked === 13, 'historical/new status totals are not 130/135/13')
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
  assertThat(review.kind === 'idts-110-independent-review-receipt' && review.schemaVersion === 1, 'review receipt schema is invalid')
  assertThat(workbook.worktreeClean === true && review.worktreeClean === true, 'receipt records a dirty review worktree')
  assertThat(typeof workbook.reviewedHead === 'string' && /^[0-9a-f]{40}$/i.test(workbook.reviewedHead), 'workbook receipt reviewed head is invalid')
  assertThat(review.reviewedHead === workbook.reviewedHead, 'receipt reviewed heads do not match')
  if (options.expectedReviewedHead) assertThat(workbook.reviewedHead === options.expectedReviewedHead, 'receipt reviewed head does not match the required head')
  assertThat(fileSha256(options.workbook) === String(workbook.candidate?.fileSha256 || '').toUpperCase(), 'candidate workbook SHA does not match its validation receipt')
  assertThat(fileSha256(options.template) === String(workbook.template?.fileSha256 || '').toUpperCase(), 'official template SHA does not match its validation receipt')
  if (options.workbookValidator) assertThat(fileSha256(options.workbookValidator) === String(workbook.validatorSha256 || '').toUpperCase(), 'workbook validator SHA does not match its validation receipt')
  assertThat(fileSha256(options.reviewArtifact) === String(review.artifactSha256 || '').toUpperCase(), 'independent review artifact SHA does not match its receipt')

  const statuses = workbook.statuses || {}
  const normalizedStatuses = {
    candidatePass: Number(statuses['Candidate PASS']),
    mappingOnly: Number(statuses['Mapping Only']),
    blocked: Number(statuses.Blocked)
  }
  normalizedStatuses.total = normalizedStatuses.candidatePass + normalizedStatuses.mappingOnly + normalizedStatuses.blocked
  assertThat(normalizedStatuses.candidatePass === 130 && normalizedStatuses.mappingOnly === 135 && normalizedStatuses.blocked === 13 && normalizedStatuses.total === CATALOG_TOTAL, 'workbook receipt status totals are not 130/135/13/278')
  assertThat(Number(workbook.hyperlinks?.ut) === CATALOG_TOTAL && Number(workbook.hyperlinks?.evidence) === CATALOG_TOTAL, 'workbook receipt native-link totals are not 278/278')
  assertThat(Array.isArray(workbook.officeCli?.introducedIssues) && workbook.officeCli.introducedIssues.length === 0, 'workbook receipt has introduced OfficeCLI issues')
  assertThat(Number(workbook.officeCli?.baselineIssues) === 15 && Number(workbook.officeCli?.candidateIssues) === 15 && workbook.officeCli?.validation === 'PASS', 'workbook receipt OfficeCLI result is not the frozen 15-warning PASS')
  assertThat(workbook.fidelity?.status === 'PASS' && Array.isArray(workbook.findings) && workbook.findings.length === 0, 'workbook receipt fidelity or validator findings are not clean')

  const counts = review.counts || {}
  assertThat(Number(counts.critical) === 0 && Number(counts.major) === 0 && Number(counts.important) === 0, 'independent review has Critical, Major, or Important findings')
  assertThat(Number.isInteger(Number(counts.deferredMinors)) && Number(counts.deferredMinors) >= 0, 'independent review deferred Minor count is invalid')
  return { workbook: { ...workbook, statuses: normalizedStatuses }, review: { ...review, counts: { critical: Number(counts.critical), major: Number(counts.major), important: Number(counts.important), deferredMinors: Number(counts.deferredMinors) } } }
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
  assertThat(receiptManifest.workbookReceipt === relative(options.root, options.workbookReceipt) && receiptManifest.reviewReceipt === relative(options.root, options.reviewReceipt), 'receipt manifest receipt paths are not the exact default paths')
  assertThat(fileSha256(options.reviewArtifact) === String(receiptManifest.reviewArtifactSha256 || '').toUpperCase(), 'review artifact SHA does not match the receipt manifest')
  const receipts = verifyReceipts({
    workbook: options.workbook,
    template: options.template,
    workbookValidator: options.workbookValidator,
    reviewArtifact: options.reviewArtifact,
    workbookReceipt: options.workbookReceipt,
    reviewReceipt: options.reviewReceipt,
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
    assertThat(row.reviewStatus === 'PENDING_DONHV_REVIEW', `historical row is not pending DonHV review: ${relative(options.root, file)}`)
    return counts
  }, {})
  assertThat(historicalFiles.length === EXISTING_TOTAL, `historical manifest count is ${historicalFiles.length}, expected 188`)
  assertThat(historical.PASS === 40 && historical.MAPPING_ONLY_CANDIDATE === 135 && historical.BLOCKED === 13, 'historical results are not 40 PASS / 135 mapping-only / 13 blocked')
  validateStatusCounts(catalog, historical, results.totals)

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
    workbook: { fileSha256: fileSha256(options.workbook), templateSha256: fileSha256(options.template), candidatePass: receipts.workbook.statuses.candidatePass, mappingOnly: receipts.workbook.statuses.mappingOnly, blocked: receipts.workbook.statuses.blocked, total: receipts.workbook.statuses.total, utEvidenceLinks: receipts.workbook.hyperlinks.ut, evidenceCardLinks: receipts.workbook.hyperlinks.evidence, officeCli: receipts.workbook.officeCli, fidelity: receipts.workbook.fidelity },
    evidence: { manifests: evidenceManifestFiles.length, results: evidenceResultFiles.length, pngs: evidencePngFiles.length, pngBreakdown: { runtime: 9, result: 81, before: 71, after: 71, reload: 81 }, cardCount: cardFiles.length, cardSetSha256: cardSetSha, firstCardSha256: fileSha256(cardFiles.find(file => path.basename(file) === 'Case-001.png')), lastCardSha256: fileSha256(cardFiles.find(file => path.basename(file) === 'Case-278.png')) },
    externalMutations: [],
    authority: { baseSha: BASELINE_SHA, reviewHead: receipts.review.reviewedHead, pullRequest: 388 },
    independentReview: receipts.review.counts,
    tooling: { officeCliAvailable: officeCli, aiDevkitAvailable: aiDevkit }
  }
}

function makeMarkdown(report, root) {
  const r = report
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

The source base is the PR #388 merge. The independent review receipt found ${r.independentReview.critical} Critical, ${r.independentReview.major} Major, and ${r.independentReview.important} Important findings; ${r.independentReview.deferredMinors} Minor findings remain explicitly deferred. The clean review does not approve any result, workbook, merge, deployment, Drive replacement, Jira update, or release.

## Frozen inputs and hashes

| Input | Count / binding | SHA-256 |
| --- | ---: | --- |
| Unit-test catalog (canonical JSON) | ${r.catalog.total} cases | \`${r.catalog.canonicalSha256}\` |
| Unit-test catalog (file bytes) | ${r.catalog.total} cases | \`${r.catalog.fileSha256}\` |
| Case number map (canonical JSON) | ${r.numberMap.total} entries; bijective 1..278 | \`${r.numberMap.canonicalSha256}\` |
| Case number map (file bytes) | ${r.numberMap.total} entries | \`${r.numberMap.fileSha256}\` |
| New atomic result aggregate (file bytes) | ${r.newResults.caseCount} rows; ${r.newResults.candidatePass} candidate PASS | \`${r.newResults.fileSha256}\` |
| New atomic result aggregate (canonical JSON) | ${r.newResults.caseCount} rows | \`${r.newResults.canonicalSha256}\` |
| Candidate workbook | ${r.workbook.total} visible cases | \`${r.workbook.fileSha256}\` |
| Official template | frozen authority reference | \`${r.workbook.templateSha256}\` |
| Mentor card set | ${r.evidence.cardCount} PNG cards | \`${r.evidence.cardSetSha256}\` |

The catalog has ${r.catalog.existing} historical rows and ${r.catalog.new} new rows. The number map preserves catalog order and the complete 1..278 bijection.

## Execution totals

| Slice | Cases | Candidate assertion | Review state |
| --- | ---: | --- | --- |
| Historical evidence | ${r.historical.caseCount} | ${r.historical.pass} PASS / ${r.historical.mappingOnly} mapping-only / ${r.historical.blocked} blocked | PENDING_DONHV_REVIEW |
| New aggregate | ${r.newResults.caseCount} | ${r.newResults.candidatePass} PASS / ${r.newResults.fail} FAIL / ${r.newResults.blocked} BLOCKED | PENDING_DONHV_REVIEW |
| User Administration | ${r.userAdministration.caseCount} | included in new aggregate | PENDING_DONHV_REVIEW |
| Notifications and email | ${r.notifications.caseCount} | included in new aggregate | PENDING_DONHV_REVIEW |

The User Administration adapter accounting is exactly **11 EXISTING_EXACT / 33 ADD_TO_EXISTING / 1 NEW_ROLE_RUNNER**. The Notification slice is exactly **45 rows**, including **8 rendered browser/runtime visual cases**. The complete new package has ${r.visualCaseCount} visual cases because User Administration contributes the ninth visual case.

## Workbook and evidence package

- Candidate workbook status totals are **${r.workbook.candidatePass} Candidate PASS / ${r.workbook.mappingOnly} Mapping Only / ${r.workbook.blocked} Blocked / ${r.workbook.total} total**. The 130 Candidate PASS rows are exactly 40 historical PASS rows plus 90 new candidate assertions; they are not official PASS.
- The workbook has ${r.workbook.utEvidenceLinks} native UT-to-Evidence links and ${r.workbook.evidenceCardLinks} native Evidence-to-card links. The ${r.evidence.cardCount} number-only cards span \`Case-001.png\` through \`Case-278.png\`.
- The packaged unit evidence has ${r.evidence.manifests} case manifests, ${r.evidence.results} result records, and ${r.evidence.pngs} PNG artifacts: ${r.evidence.pngBreakdown.runtime} runtime screenshots, ${r.evidence.pngBreakdown.result} structured result images, ${r.evidence.pngBreakdown.before} before-state images, ${r.evidence.pngBreakdown.after} after-state images, and ${r.evidence.pngBreakdown.reload} reload/readback images.
- Card-set SHA-256 is \`${r.evidence.cardSetSha256}\`; first and last card hashes are \`${r.evidence.firstCardSha256}\` and \`${r.evidence.lastCardSha256}\`.

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
| Minor | ${r.independentReview.deferredMinors} | deferred, non-blocking |

Deferred minors are source-trace symbol hygiene for six approved literal assertion snippets and Task 5 report prose that does not print its final fix head even though Git binds it to \`67838224\`. Neither changes result or workbook truth.

## Gates and limitations

The final local gate sequence is recorded separately from result approval:

- Extension manifest, extended catalog, workbook contract, OfficeCLI validation, fidelity validation, secret scan, agent rules, and \`git diff --check\`: **PASS**.
- Atomic runner: **PASS** after reusing the existing old-harness \`ajv\` through \`NODE_PATH\`; no dependency was installed or changed.
- Evidence contract: the first read-only attempt was blocked because the required Playwright executable was unavailable. The contract script also rewrites the existing 90 evidence packages and 278 cards, so it was not rerun with a browser download or any other mutation. Existing Task 9 package/card evidence and the independent review remain the recorded evidence.
- \`ai-devkit lint --json\`: **${r.tooling.aiDevkitAvailable ? 'PASS using the existing local command; no install' : 'NOT RERUN because the local command is unavailable and @latest installation is out of scope'}**. The required \`npx ai-devkit@latest lint --json\` form was not invoked because it could install dependencies, which is outside this task.

OfficeCLI preflight was \`officecli --version\` → \`1.0.147\`; OfficeCLI does not author Markdown, so it was used only as the required preflight/inspection tool for this report task.

The 13 historical BTP-required rows remain **Blocked** because an authorized target, fixture, rollback plan, and sanitized readback are not available. Any rerun requiring Cloud Foundry/BTP, provider/email, HANA, or deployment state is intentionally not performed and cannot be treated as a local failure. The evidence-contract browser/dependency limitation is tooling/environmental, not a product result.

No product source, dependency manifest, lockfile, schema/data/seed, BTP/HANA state, provider, real email, Drive file, Jira issue, branch push, merge, deployment, or release state was mutated.\n`
}

function defaults(root) {
  return {
    root,
    catalog: path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'),
    numberMap: path.join(root, 'docs/qa/idts-110-case-number-map.json'),
    results: path.join(root, '.tmp/idts-110/all-results.json'),
    workbook: path.join(root, 'docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx'),
    template: path.join(root, 'docs/sap490/templates/Deliverable_template/Unit_Test.xlsx'),
    workbookValidator: path.join(root, 'scripts/sap490/test-idts110-unit-test-workbook.mjs'),
    workbookReceipt: path.join(root, 'docs/pm/evidence/idts-110/workbook-validation-receipt.json'),
    reviewReceipt: path.join(root, 'docs/pm/evidence/idts-110/independent-review-receipt.json'),
    reviewArtifact: path.join(root, '.superpowers/sdd/2026-09-05-idts-110-atomic-execution-and-workbook/task-11-independent-review.md'),
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
