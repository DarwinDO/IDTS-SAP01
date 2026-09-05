#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const atomic = require('./idts110-atomic-runner')

const repoRoot = path.resolve(__dirname, '..', '..')
const catalogPath = path.join(repoRoot, 'docs', 'qa', 'idts-110-unit-test-catalog.json')
const evidenceRoot = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'cases')
const unitEvidenceRoot = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'unit')
const numberMapPath = path.join(repoRoot, 'docs', 'qa', 'idts-110-case-number-map.json')
const approvalPath = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'catalog-approval.json')
const sourceLedgerPath = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'source-result-ledger.json')
const BASELINE_SHA = atomic.BASELINE_SHA
const NEW_CASE_START = 188
const NEW_CASE_COUNT = 90
const CATALOG_COUNT = 278
const APPROVAL_REFERENCE = { pullRequest: 388, mergeSha: BASELINE_SHA }
const RESULT_INPUT_ROOT = path.join(repoRoot, '.tmp', 'idts-110')

// ponytail: the source ledger is deliberately explicit. Directory discovery would
// make an old candidate result look current merely because it is still on disk.
const DEFAULT_SOURCE_SPECS = [
  {
    label: 'Task 4 User Administration programmatic',
    path: '.tmp/idts-110/review-round3-fresh.json',
    runId: 'idts110-1788602696225-662da0865fbc466327dc2088771beb25',
    expectedCount: 45,
    excludeCaseKeys: ['IDTS110-F224']
  },
  {
    label: 'Task 5 My Notifications service',
    path: '.tmp/idts-110/task5-fix-round1-review.json',
    runId: 'idts110-1788605749451-2365f5b068e7f3cc11aa9ab1457f38e2',
    expectedCount: 7
  },
  {
    label: 'Task 6 My Notifications UI',
    path: '.tmp/idts-110/ui-results.json',
    runId: 'idts110-ui-1788609025467-971346abf2c775b094e8645f',
    expectedCount: 9,
    excludeCaseKeys: ['IDTS110-F224']
  },
  {
    label: 'Task 6 User Administration workload UI replacement',
    path: '.tmp/idts-110/f224-fix-round1.json',
    runId: 'idts110-f224-fix-r1-20260905e',
    expectedCount: 1,
    includeCaseKeys: ['IDTS110-F224']
  },
  {
    label: 'Task 7 access email',
    path: '.tmp/idts-110/review-task7-fix3-results.json',
    runId: 'idts110-1788615735629-d086b0bacdf397d2fbc5218ab91b1a3c',
    expectedCount: 10
  },
  {
    label: 'Task 8 Bug email',
    path: '.tmp/idts-110/review-task8-fix2-results.json',
    runId: 'idts110-1788623942723-a9f74045042c5a6fe9764e4d1cda6a42',
    expectedCount: 20
  }
]

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrap(value, max = 70) {
  const words = String(value).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function resultSvg(testCase, baselineSha, executedAt) {
  const titleLines = wrap(testCase.title)
  const titleText = titleLines
    .map((line, index) => `<text x="104" y="${210 + index * 38}" class="title">${xml(line)}</text>`)
    .join('\n  ')
  const reasonY = 350 + Math.max(0, titleLines.length - 1) * 38
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <style>
    .bg { fill: #101b30; }
    .frame { fill: none; stroke: #f0a000; stroke-width: 3; }
    .eyebrow { fill: #ffc83d; font: 28px 'Segoe UI', Arial, sans-serif; }
    .case { fill: #ffffff; font: 700 44px 'Segoe UI', Arial, sans-serif; }
    .title { fill: #d7deeb; font: 28px 'Segoe UI', Arial, sans-serif; }
    .status { fill: #ffffff; font: 700 26px 'Segoe UI', Arial, sans-serif; }
    .body { fill: #d7deeb; font: 23px Consolas, monospace; }
    .meta { fill: #9aa9bf; font: 19px 'Segoe UI', Arial, sans-serif; }
  </style>
  <rect class="bg" width="1280" height="720"/>
  <rect class="frame" x="63" y="55" width="1154" height="610" rx="25"/>
  <text x="104" y="125" class="eyebrow">IDTS-110 · ${xml(testCase.environment)} EXECUTION EVIDENCE</text>
  <text x="104" y="180" class="case">${xml(testCase.caseId)}</text>
  ${titleText}
  <rect x="104" y="${reasonY}" width="210" height="58" rx="29" fill="#9a5b00"/>
  <text x="150" y="${reasonY + 39}" class="status">BLOCKED</text>
  <text x="104" y="${reasonY + 105}" class="body">No authorized BTP target/session is available.</text>
  <text x="104" y="${reasonY + 145}" class="body">CF CLI: unavailable · BTP/QA target variables: absent</text>
  <text x="104" y="${reasonY + 205}" class="meta">Baseline ${xml(baselineSha.slice(0, 12))} · ${xml(executedAt)}</text>
  <text x="104" y="${reasonY + 245}" class="meta">Truthful blocker record — no local result is promoted to BTP acceptance</text>
</svg>
`
}

function localResultSvg(testCase, result) {
  const titleLines = wrap(testCase.title)
  const actualLines = wrap(result.actualResult.replace(/\s+/g, ' '), 78)
  const titleText = titleLines
    .map((line, index) => `<text x="104" y="${210 + index * 38}" class="title">${xml(line)}</text>`)
    .join('\n  ')
  const statusY = 350 + Math.max(0, titleLines.length - 1) * 38
  const actualText = actualLines
    .map((line, index) => `<text x="104" y="${statusY + 115 + index * 34}" class="body">${xml(line)}</text>`)
    .join('\n  ')
  const pass = result.status === 'PASS'
  const blocked = result.status === 'BLOCKED'
  const accent = pass ? '#35d399' : blocked ? '#f0a000' : '#ff5c6c'
  const badge = pass ? '#176b37' : blocked ? '#9a5b00' : '#9f2430'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <style>
    .bg { fill: #101b30; }
    .frame { fill: none; stroke: ${accent}; stroke-width: 3; }
    .eyebrow { fill: ${pass ? '#6ee7b7' : blocked ? '#ffc83d' : '#ff8792'}; font: 28px 'Segoe UI', Arial, sans-serif; }
    .case { fill: #ffffff; font: 700 44px 'Segoe UI', Arial, sans-serif; }
    .title { fill: #d7deeb; font: 28px 'Segoe UI', Arial, sans-serif; }
    .status { fill: #ffffff; font: 700 26px 'Segoe UI', Arial, sans-serif; }
    .body { fill: #d7deeb; font: 22px Consolas, monospace; }
    .meta { fill: #9aa9bf; font: 19px 'Segoe UI', Arial, sans-serif; }
  </style>
  <rect class="bg" width="1280" height="720"/>
  <rect class="frame" x="63" y="55" width="1154" height="610" rx="25"/>
  <text x="104" y="125" class="eyebrow">IDTS-110 · LOCAL EXACT-CASE EVIDENCE</text>
  <text x="104" y="180" class="case">${xml(testCase.caseId)}</text>
  ${titleText}
  <rect x="104" y="${statusY}" width="210" height="58" rx="29" fill="${badge}"/>
  <text x="${pass ? 150 : blocked ? 140 : 158}" y="${statusY + 39}" class="status">${xml(result.status)}</text>
  ${actualText}
  <text x="104" y="${statusY + 245}" class="meta">Node.js 22.23.2 · ${xml(result.completedAt)} · Baseline ${xml(result.baselineSha.slice(0, 12))}</text>
  <text x="104" y="${statusY + 285}" class="meta">Candidate result — pending DonHV evidence and catalog review</text>
</svg>
`
}

function stateSvg(testCase, label, state, result) {
  const entries = Object.entries(state || {})
  const rows = entries
    .map(([key, value], index) => `<text x="104" y="${250 + index * 42}" class="body">${xml(key.padEnd(24))} ${xml(value)}</text>`)
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <style>
    .bg { fill: #101b30; }
    .frame { fill: none; stroke: #9f83ff; stroke-width: 3; }
    .eyebrow { fill: #c4b5fd; font: 28px 'Segoe UI', Arial, sans-serif; }
    .title { fill: #ffffff; font: 700 40px 'Segoe UI', Arial, sans-serif; }
    .body { fill: #d7deeb; font: 24px Consolas, monospace; }
    .meta { fill: #9aa9bf; font: 19px 'Segoe UI', Arial, sans-serif; }
  </style>
  <rect class="bg" width="1280" height="720"/>
  <rect class="frame" x="63" y="55" width="1154" height="610" rx="25"/>
  <text x="104" y="125" class="eyebrow">${xml(testCase.caseId)} · ${xml(label)}</text>
  <text x="104" y="185" class="title">Sanitized database row counts</text>
  ${rows}
  <text x="104" y="610" class="meta">Isolated in-memory CAP/SQLite fixture · ${xml(result.completedAt)}</text>
</svg>
`
}

function writeLocalEvidence(resultsPath) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  const summary = JSON.parse(fs.readFileSync(path.resolve(resultsPath), 'utf8'))
  const localCases = catalog.cases.filter(testCase => testCase.environment === 'LOCAL')
  const resultById = new Map(summary.results.map(result => [result.caseId, result]))
  if (resultById.size !== localCases.length) {
    throw new Error(`Expected ${localCases.length} LOCAL results, found ${resultById.size}`)
  }

  let created = 0
  for (const testCase of localCases) {
    const result = resultById.get(testCase.caseId)
    if (!result) throw new Error(`Missing LOCAL result: ${testCase.caseId}`)
    const caseDir = path.join(evidenceRoot, testCase.caseId)
    fs.mkdirSync(caseDir, { recursive: true })
    const needsState = testCase.evidenceRequirements.some(item => /before\/after database|reload\/readback/.test(item))
    const evidenceFiles = ['result.png']
    const evidenceIds = [`IDTS110-${testCase.caseId}-RESULT`]
    if (needsState) {
      for (const [name, label, state] of [
        ['before-database', 'BEFORE DATABASE STATE', result.beforeState],
        ['after-database', 'AFTER DATABASE STATE', result.afterState],
        ['reload-readback', 'RELOAD / READBACK STATE', result.reloadState]
      ]) {
        if (!state) throw new Error(`Missing ${label} for ${testCase.caseId}`)
        fs.writeFileSync(path.join(caseDir, `${name}.svg`), stateSvg(testCase, label, state, result), 'utf8')
        evidenceFiles.push(`${name}.png`)
        evidenceIds.push(`IDTS110-${testCase.caseId}-${name.toUpperCase()}`)
      }
    }
    const manifest = {
      caseId: testCase.caseId,
      title: testCase.title,
      candidateExecutionStatus: result.status,
      reviewStatus: 'PENDING_DONHV_REVIEW',
      executor: 'NhanT (agent-assisted)',
      executedAt: result.completedAt,
      baselineSha: result.baselineSha,
      deploySha: null,
      environment: 'LOCAL',
      runtime: `Node.js ${process.version}, ${process.platform} ${process.arch}`,
      testCommand: 'node scripts/qa/test-idts110-local-exact.js --output docs/pm/evidence/idts-110/local-execution-results.json',
      sourceAssertions: result.sourceAssertions,
      actualResult: result.actualResult,
      assertions: result.assertions,
      evidenceIds,
      evidenceFiles,
      limitations: result.status === 'PASS'
        ? 'Uses isolated deterministic local fixtures. No BTP acceptance is claimed. Final catalog/workbook integration belongs to DonHV.'
        : result.status === 'BLOCKED'
          ? 'Static UI guards were verified, but browser runtime evidence is unavailable because the approved browser surface could not start. No runtime UI PASS is claimed.'
          : 'Observed behavior does not match the approved expected result. DonHV must triage the product/security boundary or catalog expectation before acceptance.'
    }
    fs.writeFileSync(path.join(caseDir, 'case-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(caseDir, 'result.svg'), localResultSvg(testCase, result), 'utf8')
    created += 1
  }
  console.log(`IDTS-110 LOCAL evidence created: ${created} case packages (${summary.totals.passed} PASS, ${summary.totals.failed} FAIL, ${summary.totals.blocked || 0} BLOCKED)`)
}

function writeBlockedBtpEvidence() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  const cases = catalog.cases.filter(testCase => testCase.environment !== 'LOCAL')
  const baselineSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim()
  const executedAt = new Date().toISOString()
  let created = 0

  for (const testCase of cases) {
    const caseDir = path.join(evidenceRoot, testCase.caseId)
    const manifestPath = path.join(caseDir, 'case-manifest.json')
    if (fs.existsSync(manifestPath)) {
      throw new Error(`Refusing to overwrite existing case package: ${testCase.caseId}`)
    }
    fs.mkdirSync(caseDir, { recursive: true })
    const actualResult = testCase.environment === 'HYBRID_BTP'
      ? 'Blocked before final acceptance: the required BTP/HANA repeat cannot run because this workspace has no authorized BTP target, Cloud Foundry session, or target configuration. No local-only result is promoted to PASS.'
      : 'Blocked before execution: this case requires a bound SAP BTP or live external service, but this workspace has no authorized BTP target, Cloud Foundry session, or target configuration.'
    const manifest = {
      caseId: testCase.caseId,
      title: testCase.title,
      candidateExecutionStatus: 'BLOCKED',
      reviewStatus: 'PENDING_DONHV_REVIEW',
      executor: 'NhanT (agent-assisted)',
      executedAt,
      baselineSha,
      deploySha: null,
      environment: testCase.environment,
      runtime: `${process.release.name} ${process.version}, ${process.platform} ${process.arch}`,
      testCommand: null,
      sourceAssertions: [],
      actualResult,
      assertions: [
        'Cloud Foundry CLI available: false',
        'Authorized BTP/QA target configuration available: false',
        'BTP execution attempted: false (target unavailable)',
        'Local-only result promoted to BTP acceptance: false'
      ],
      evidenceIds: [`IDTS110-${testCase.caseId}-BLOCKER`],
      evidenceFiles: ['result.png'],
      limitations: 'Environment blocker only; this is not a product failure. DonHV must provide an authorized BTP target/session before the case can be executed and accepted.'
    }
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    fs.writeFileSync(path.join(caseDir, 'result.svg'), resultSvg(testCase, baselineSha, executedAt), 'utf8')
    created += 1
  }

  console.log(`IDTS-110 BTP blocker evidence created: ${created} case packages at ${executedAt}`)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function canonicalSha(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function fileSha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function failEvidence(message) {
  throw new Error(`IDTS-110 evidence: ${message}`)
}

function posixRelative(file) {
  return path.relative(path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110'), file).replace(/\\/g, '/')
}

function sameApproval(left, right) {
  return left && right && left.pullRequest === right.pullRequest && left.mergeSha === right.mergeSha
}

function loadAuthority(options = {}) {
  const selectedCatalogPath = path.resolve(options.catalogPath || catalogPath)
  const selectedNumberMapPath = path.resolve(options.numberMapPath || numberMapPath)
  const selectedApprovalPath = path.resolve(options.approvalPath || approvalPath)
  if (selectedCatalogPath !== path.resolve(catalogPath)) failEvidence('catalog path must be the approved repository catalog file')
  if (selectedNumberMapPath !== path.resolve(numberMapPath)) failEvidence('number-map path must be the approved repository number map')
  if (selectedApprovalPath !== path.resolve(approvalPath)) failEvidence('approval path must be the approved DonHV receipt')

  const catalog = readJson(selectedCatalogPath)
  const numberMap = readJson(selectedNumberMapPath)
  const approval = readJson(selectedApprovalPath)
  if (!Array.isArray(catalog.cases) || catalog.cases.length !== CATALOG_COUNT) failEvidence(`approved catalog must contain ${CATALOG_COUNT} cases`)
  if (catalog.schemaVersion !== '1.0' || catalog.jiraKey !== 'IDTS-110' || catalog.language !== 'EN') failEvidence('catalog identity or language is not approved')
  if (catalog.sourceBaselineSha !== BASELINE_SHA || catalog.approvalReference?.pullRequest !== APPROVAL_REFERENCE.pullRequest || catalog.approvalReference?.mergeSha !== BASELINE_SHA) failEvidence('catalog is not bound to the execution baseline and approval reference')
  if (catalog.extensionSummary?.total !== CATALOG_COUNT) failEvidence('catalog extension summary is not 278')
  if (approval.schemaVersion !== '1.0' || approval.jiraKey !== 'IDTS-110' || approval.status !== 'APPROVED_FOR_EXECUTION' || approval.approvedBy !== 'DonHV' || approval.approvedCatalogCount !== CATALOG_COUNT || approval.resultsPreApproved !== false) failEvidence('catalog approval receipt is not the approved DonHV execution receipt')
  if (!sameApproval(approval.approvalReference, APPROVAL_REFERENCE)) failEvidence('approval receipt reference is invalid')
  if (!Array.isArray(numberMap.entries) || numberMap.entries.length !== CATALOG_COUNT) failEvidence('number map must contain 278 entries')
  const catalogKeys = catalog.cases.map(row => row.caseId)
  const mapKeys = numberMap.entries.map(row => row.internalCaseKey)
  if (JSON.stringify(catalogKeys) !== JSON.stringify(mapKeys)) failEvidence('number map is not a bijection in catalog order')
  if (numberMap.entries.some((row, index) => row.mentorNumber !== index + 1)) failEvidence('number map mentor numbers are not contiguous 1..278')
  const catalogSha = canonicalSha(catalog)
  const sourceLedger = loadSourceLedger({ catalog, catalogSha, approval })
  return { catalog, numberMap, approval, catalogSha, sourceLedger }
}

function loadSourceLedger({ catalog, catalogSha, approval }) {
  if (!fs.existsSync(sourceLedgerPath)) failEvidence('committed source-result-ledger.json is required')
  const ledger = readJson(sourceLedgerPath)
  if (ledger.schemaVersion !== '1.0' || ledger.jiraKey !== 'IDTS-110' || ledger.sourceBaselineSha !== BASELINE_SHA || ledger.catalogSha !== catalogSha || !sameApproval(ledger.approvalReference, APPROVAL_REFERENCE)) failEvidence('source-result-ledger is not bound to the approved catalog, baseline, and approval')
  if (!Array.isArray(ledger.entries) || ledger.entries.length !== 6 || ledger.selectedCaseCount !== NEW_CASE_COUNT || !Array.isArray(ledger.externalMutations) || ledger.externalMutations.length !== 0) failEvidence('source-result-ledger has an invalid entry count or mutation ledger')
  const expectedKeys = catalog.cases.slice(NEW_CASE_START).map(row => row.caseId)
  const allSelected = ledger.entries.flatMap(entry => entry.selectedCaseKeys || [])
  if (new Set(allSelected).size !== allSelected.length || JSON.stringify([...allSelected].sort()) !== JSON.stringify([...expectedKeys].sort())) failEvidence('source-result-ledger selected keys do not exactly match the approved 90-case extension')
  const seenPaths = new Set()
  const seenRuns = new Set()
  const normalizedEntries = ledger.entries.map((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || typeof entry.runId !== 'string' || !/^[a-f0-9]{64}$/i.test(entry.sha256 || '') || !Number.isInteger(entry.rawResultCount) || !Array.isArray(entry.selectedCaseKeys) || !Array.isArray(entry.excludedCaseKeys)) failEvidence(`source-result-ledger entry ${index + 1} is incomplete`)
    const relativePath = entry.path.replace(/\\/g, '/')
    const resolvedPath = path.resolve(repoRoot, relativePath)
    if (!resolvedPath.startsWith(`${RESULT_INPUT_ROOT}${path.sep}`) || path.isAbsolute(entry.path) || relativePath.split('/').includes('..')) failEvidence(`source-result-ledger entry ${entry.path} escapes .tmp/idts-110`)
    if (seenPaths.has(resolvedPath) || seenRuns.has(entry.runId)) failEvidence('source-result-ledger contains duplicate source paths or run IDs')
    seenPaths.add(resolvedPath)
    seenRuns.add(entry.runId)
    if (entry.rawResultCount !== entry.selectedCaseKeys.length + entry.excludedCaseKeys.length) failEvidence(`source-result-ledger count mismatch for ${entry.path}`)
    if (entry.selectedCaseKeys.some(key => !expectedKeys.includes(key)) || entry.excludedCaseKeys.some(key => !expectedKeys.includes(key)) || entry.selectedCaseKeys.some(key => entry.excludedCaseKeys.includes(key))) failEvidence(`source-result-ledger has an unknown or overlapping case set for ${entry.path}`)
    return { ...entry, path: relativePath, expectedCount: entry.rawResultCount }
  })
  const excludedF224 = normalizedEntries.filter(entry => entry.excludedCaseKeys.includes('IDTS110-F224'))
  if (excludedF224.length !== 2 || normalizedEntries.filter(entry => entry.selectedCaseKeys.includes('IDTS110-F224')).length !== 1) failEvidence('source-result-ledger must exclude superseded F224 twice and select one fix-round replacement')
  return { ...ledger, entries: normalizedEntries }
}

function approvedSourceSpec(file, specs) {
  const resolved = path.resolve(repoRoot, file)
  return specs.find(spec => path.resolve(repoRoot, spec.path) === resolved) || null
}

function normalizeSourceSpecs(inputPaths, sourceLedger) {
  const values = inputPaths && inputPaths.length ? inputPaths : sourceLedger.entries
  return values.map(value => {
    const source = typeof value === 'string' ? { path: value } : { ...value }
    if (!source.path) failEvidence('each result source must have a path')
    const approved = approvedSourceSpec(source.path, sourceLedger.entries)
    if (approved) {
      for (const field of ['runId', 'sha256', 'rawResultCount', 'expectedCount', 'selectedCaseKeys', 'excludedCaseKeys']) {
        if (source[field] !== undefined && JSON.stringify(source[field]) !== JSON.stringify(approved[field])) failEvidence(`source ${source.path} does not match the committed source-result-ledger for ${field}`)
      }
      return approved
    }
    failEvidence(`source ${source.path} is not in the approved latest-reviewed result ledger; historical candidate promotion is disabled`)
  })
}

function validateSourceBatch(spec, authority) {
  const sourceFile = path.resolve(repoRoot, spec.path)
  if (!sourceFile.startsWith(`${RESULT_INPUT_ROOT}${path.sep}`)) failEvidence(`result source must be inside .tmp/idts-110: ${spec.path}`)
  if (!fs.existsSync(sourceFile)) failEvidence(`missing result source: ${spec.path}`)
  const sourceSha256 = fileSha(sourceFile)
  if (sourceSha256.toLowerCase() !== String(spec.sha256).toLowerCase()) failEvidence(`source SHA-256 mismatch for ${spec.path}; committed source-result-ledger is stale or the .tmp result was replaced`)
  const batch = readJson(sourceFile)
  if (batch.schemaVersion !== '1.0' || batch.jiraKey !== 'IDTS-110' || !Array.isArray(batch.results)) failEvidence(`source is not an atomic result batch: ${spec.path}`)
  if (batch.sourceBaselineSha !== BASELINE_SHA) failEvidence(`source baseline mismatch in ${spec.path}`)
  if (batch.catalogSha !== authority.catalogSha) failEvidence(`catalog hash mismatch in ${spec.path}`)
  if (!sameApproval(batch.approvalReference, APPROVAL_REFERENCE)) failEvidence(`approval reference mismatch in ${spec.path}`)
  if (spec.runId && batch.runId !== spec.runId) failEvidence(`source ${spec.path} is not the approved latest reviewed run`)
  if (spec.expectedCount !== undefined && batch.results.length !== spec.expectedCount) failEvidence(`source ${spec.path} expected ${spec.expectedCount} rows, found ${batch.results.length}`)

  const newKeys = new Set(authority.catalog.cases.slice(NEW_CASE_START).map(row => row.caseId))
  const excluded = new Set(spec.excludedCaseKeys || [])
  const rawKeys = batch.results.map(row => row.caseKey)
  if (new Set(rawKeys).size !== rawKeys.length) failEvidence(`source ${spec.path} contains duplicate case keys`)
  for (const result of batch.results) {
    if (!newKeys.has(result.caseKey)) failEvidence(`source ${spec.path} contains a non-new or unknown case: ${result.caseKey}`)
    // The Task 6 F224 row in the broad UI batch is intentionally superseded by
    // the separate fix-round artifact and may no longer match its overwritten
    // source-side screenshot manifest. It is excluded before promotion.
    if (excluded.has(result.caseKey)) continue
    try {
      atomic.validateAtomicResult(result)
    } catch (error) {
      failEvidence(`${spec.path} contains an invalid atomic result: ${error.message}`)
    }
    if (result.status === 'MAPPING_ONLY' || result.status === 'NOT_RUN' || result.status === 'HELD') failEvidence(`${spec.path} contains a non-executable result status: ${result.status}`)
    if (result.reviewStatus !== 'PENDING_DONHV_REVIEW') failEvidence(`${spec.path} result ${result.caseKey} is not pending DonHV review`)
  }

  const included = new Set(spec.selectedCaseKeys || batch.results.map(row => row.caseKey).filter(key => !excluded.has(key)))
  const selected = batch.results.filter(row => !excluded.has(row.caseKey) && included.has(row.caseKey))
  if (selected.length !== included.size || JSON.stringify(selected.map(row => row.caseKey)) !== JSON.stringify(spec.selectedCaseKeys)) failEvidence(`source ${spec.path} selection does not match its committed case set`)
  if (batch.results.some(row => !excluded.has(row.caseKey) && !included.has(row.caseKey))) failEvidence(`source ${spec.path} has an undeclared selected key`)
  return {
    spec,
    file: sourceFile,
    batch,
    selected,
    selectedCaseKeys: selected.map(row => row.caseKey),
    excludedCaseKeys: [...excluded],
    sourceSha256
  }
}

function aggregateAtomicResults(options = {}) {
  const authority = loadAuthority(options)
  const specs = normalizeSourceSpecs(options.inputPaths, authority.sourceLedger)
  const sources = specs.map(spec => validateSourceBatch(spec, authority))
  const results = sources.flatMap(source => source.selected)
  const expectedKeys = authority.catalog.cases.slice(NEW_CASE_START).map(row => row.caseId)
  const expectedSet = new Set(expectedKeys)
  const resultKeys = results.map(row => row.caseKey)
  if (results.length !== NEW_CASE_COUNT) failEvidence(`expected exactly ${NEW_CASE_COUNT} selected atomic results, found ${results.length}`)
  if (new Set(resultKeys).size !== resultKeys.length) failEvidence('selected result sources contain duplicate case keys')
  if (JSON.stringify([...new Set(resultKeys)].sort()) !== JSON.stringify([...expectedSet].sort())) failEvidence('selected result keys do not exactly match the approved 90-case extension')

  const definitions = new Map(authority.catalog.cases.slice(NEW_CASE_START).map(row => [row.caseId, row]))
  for (const result of results) {
    const definition = definitions.get(result.caseKey)
    if (result.mentorNumber !== definition.mentorNumber || result.assertionId !== definition.assertionId || result.title !== definition.title || result.testFile !== definition.plannedTestFile) failEvidence(`result ${result.caseKey} does not match the approved catalog definition`)
    const visual = definition.acceptanceMode === 'UI_RUNTIME_VISUAL'
    if ((result.evidenceKind === 'UI_RUNTIME') !== visual) failEvidence(`result ${result.caseKey} evidence kind does not match the approved acceptance mode`)
    if (result.sourceBaselineSha !== BASELINE_SHA) failEvidence(`result ${result.caseKey} source baseline is not approved`)
  }
  results.sort((left, right) => left.mentorNumber - right.mentorNumber)
  const sourceDigest = canonicalSha(sources.map(source => ({
    path: source.spec.path,
    runId: source.batch.runId,
    sourceSha256: source.sourceSha256,
    selectedCaseKeys: source.selectedCaseKeys,
    excludedCaseKeys: source.excludedCaseKeys
  })))
  const statuses = ['PASS', 'FAIL', 'BLOCKED', 'HELD', 'NOT_RUN']
  return {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    runId: `idts110-aggregate-${sourceDigest.slice(0, 24)}`,
    sourceBaselineSha: BASELINE_SHA,
    catalogSha: authority.catalogSha,
    approvalReference: authority.approval.approvalReference,
    startedAt: new Date(Math.min(...results.map(row => Date.parse(row.startedAt)))).toISOString(),
    completedAt: new Date(Math.max(...results.map(row => Date.parse(row.completedAt)))).toISOString(),
    sourceBatches: sources.map(source => ({
      label: source.spec.label || path.basename(source.file),
      path: source.spec.path,
      runId: source.batch.runId,
      sourceSha256: source.sourceSha256,
      selectedCaseKeys: source.selectedCaseKeys,
      excludedCaseKeys: source.excludedCaseKeys
    })),
    results,
    totals: Object.fromEntries(statuses.map(status => [status, results.filter(row => row.status === status).length]))
  }
}

function htmlText(value) {
  return xml(String(value ?? '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim())
}

function renderHtml(lines, accent = '#35d399') {
  const body = lines.map(line => `<p>${htmlText(line)}</p>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1280px;height:720px;background:#101b30;color:#d7deeb;font-family:Segoe UI,Arial,sans-serif}
    body{box-sizing:border-box;padding:52px 64px}
    main{box-sizing:border-box;width:1152px;height:616px;border:3px solid ${accent};border-radius:24px;padding:38px 40px;background:#101b30;overflow:hidden}
    p{margin:0 0 17px;line-height:1.25;font-size:22px;white-space:normal;overflow-wrap:anywhere}
    p:first-child{font-size:30px;font-weight:700;color:#fff;margin-bottom:24px}
    p:nth-child(2){font-size:27px;font-weight:600;color:#eef2ff;margin-bottom:22px}
    p:nth-child(3){font-size:24px;font-weight:700;color:${accent}}
  </style></head><body><main>${body}</main></body></html>`
}

async function renderPngFiles(items) {
  if (!items.length) return
  let chromium
  try {
    ({ chromium } = require('playwright'))
  } catch (error) {
    failEvidence(`Playwright is required to render evidence PNGs: ${error.message}`)
  }
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
    for (const item of items) {
      fs.mkdirSync(path.dirname(item.outputPath), { recursive: true })
      await page.setContent(item.html, { waitUntil: 'load' })
      await page.screenshot({ path: item.outputPath, type: 'png' })
    }
  } catch (error) {
    failEvidence(`PNG rendering failed: ${error.message}`)
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

function needsEvidenceState(definition, state) {
  const requirements = Array.isArray(definition.evidenceRequirements) ? definition.evidenceRequirements.join(' ') : ''
  if (state === 'before') return /before(?:[-/ ]state|[-/ ]database)/i.test(requirements)
  if (state === 'after') return /after(?:[-/ ]state|[-/ ]database)/i.test(requirements)
  if (state === 'reload') return /reload|readback|persistence/i.test(requirements)
  return false
}

function stateLabel(state) {
  return state === 'before' ? 'before-database.png' : state === 'after' ? 'after-database.png' : 'reload-readback.png'
}

function stateValueLines(state) {
  return Object.entries(state || {}).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
}

function resolveAtomicArtifact(value) {
  if (typeof value !== 'string' || !value.trim()) failEvidence('visual evidence path is missing')
  const normalized = value.replace(/\\/g, '/')
  if (path.isAbsolute(value) || normalized.split('/').includes('..')) failEvidence('visual evidence path must be relative to .tmp/idts-110')
  const resolved = path.resolve(RESULT_INPUT_ROOT, normalized)
  if (!resolved.startsWith(`${RESULT_INPUT_ROOT}${path.sep}`)) failEvidence('visual evidence path escapes .tmp/idts-110')
  return resolved
}

function copyVisualArtifact(result, caseDir) {
  if (!result.runtimeEvidence || typeof result.runtimeEvidence !== 'object') failEvidence(`UI result ${result.caseKey} has no runtime evidence`)
  const sourceScreenshot = resolveAtomicArtifact(result.runtimeEvidence.screenshotPath)
  const sourceManifest = resolveAtomicArtifact(result.runtimeEvidence.manifestPath)
  if (!fs.existsSync(sourceScreenshot) || !fs.existsSync(sourceManifest)) failEvidence(`UI result ${result.caseKey} references a missing runtime artifact`)
  const screenshotBytes = fs.readFileSync(sourceScreenshot)
  const screenshotHash = fileSha(sourceScreenshot)
  if (screenshotHash !== String(result.runtimeEvidence.screenshotSha256 || '').toLowerCase()) failEvidence(`UI result ${result.caseKey} screenshot hash does not match the source record`)
  const sourceManifestJson = readJson(sourceManifest)
  if (sourceManifestJson.caseKey !== result.caseKey || sourceManifestJson.screenshotPath !== result.runtimeEvidence.screenshotPath || String(sourceManifestJson.screenshotSha256 || '').toLowerCase() !== screenshotHash || !Array.isArray(sourceManifestJson.evidenceIds) || !sourceManifestJson.evidenceIds.includes(`${result.caseKey}-VISUAL`)) failEvidence(`UI result ${result.caseKey} runtime manifest is not bound to its source result`)
  const targetScreenshot = path.join(caseDir, 'runtime.png')
  fs.writeFileSync(targetScreenshot, screenshotBytes)
  return { file: 'runtime.png', hash: fileSha(targetScreenshot), sourceManifest: result.runtimeEvidence.manifestPath }
}

function buildAtomicManifest({ result, definition, batch, evidenceFiles, artifactHashes }) {
  const manifest = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    caseKey: result.caseKey,
    mentorNumber: result.mentorNumber,
    title: result.title,
    candidateExecutionStatus: result.status,
    reviewStatus: result.reviewStatus,
    evidenceKind: result.evidenceKind,
    executor: result.executor,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    sourceBaselineSha: result.sourceBaselineSha,
    deployedSha: result.deployedSha,
    catalogSha: batch.catalogSha,
    approvalReference: batch.approvalReference,
    assertionId: result.assertionId,
    testFile: result.testFile,
    testCommand: result.testCommand,
    preconditions: result.preconditions,
    input: result.input,
    expectedResult: result.expectedResult,
    actualResult: result.actualResult,
    sourceTrace: result.sourceTrace,
    beforeState: result.beforeState,
    afterState: result.afterState,
    reloadState: result.reloadState,
    runtimeEvidence: result.runtimeEvidence,
    evidenceIds: result.evidenceIds,
    evidenceFiles,
    artifactHashes,
    resultSha256: null,
    limitation: result.limitation,
    acceptanceMode: definition.acceptanceMode,
    sourceBatchRunId: batch.runId
  }
  if (result.evidenceKind === 'UI_RUNTIME') {
    manifest.screenshotPath = 'runtime.png'
    manifest.screenshotSha256 = artifactHashes['runtime.png']
    manifest.manifestPath = 'case-manifest.json'
  }
  return manifest
}

function samePath(left, right) {
  const normalize = value => path.resolve(value)
  const a = normalize(left)
  const b = normalize(right)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

function assertRegularPackagePath(target, label) {
  atomic.assertNoReparseAncestors(target)
  const stat = fs.lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink() || !samePath(fs.realpathSync.native(target), target)) failEvidence(`${label} must be a regular non-reparse file`)
}

function validatePackagedAtomicResult(result, options = {}) {
  if (!result || typeof result !== 'object' || typeof result.caseKey !== 'string') failEvidence('packaged atomic result must contain a caseKey')
  if (typeof options.evidenceRoot !== 'string' || !path.isAbsolute(options.evidenceRoot)) failEvidence(`packaged evidence root must be an absolute resolved path for ${result.caseKey}`)
  const packageDir = path.resolve(options.evidenceRoot)
  if (!samePath(path.dirname(packageDir), unitEvidenceRoot) || path.basename(packageDir) !== result.caseKey) failEvidence(`packaged evidence root must be docs/pm/evidence/idts-110/unit/${result.caseKey}`)
  atomic.assertNoReparseAncestors(packageDir)
  const dirStat = fs.lstatSync(packageDir)
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink() || !samePath(fs.realpathSync.native(packageDir), packageDir)) failEvidence(`packaged evidence root is not a regular directory for ${result.caseKey}`)
  const resultPath = path.join(packageDir, 'result.json')
  const manifestPath = path.join(packageDir, 'case-manifest.json')
  assertRegularPackagePath(resultPath, `${result.caseKey}/result.json`)
  assertRegularPackagePath(manifestPath, `${result.caseKey}/case-manifest.json`)

  try {
    atomic.validateAtomicResult(result, { packageMode: true, evidenceRoot: packageDir })
  } catch (error) {
    failEvidence(`${result.caseKey} packaged atomic validation failed: ${error.message}`)
  }
  const manifest = readJson(manifestPath)
  const approvedCatalogSha = canonicalSha(readJson(catalogPath))
  if (manifest.schemaVersion !== '1.0' || manifest.jiraKey !== 'IDTS-110' || manifest.caseKey !== result.caseKey || manifest.mentorNumber !== result.mentorNumber || manifest.assertionId !== result.assertionId || manifest.sourceBaselineSha !== BASELINE_SHA || manifest.catalogSha !== approvedCatalogSha || (result.catalogSha !== undefined && result.catalogSha !== approvedCatalogSha) || !sameApproval(manifest.approvalReference, APPROVAL_REFERENCE) || manifest.resultSha256 !== fileSha(resultPath)) failEvidence(`${result.caseKey} packaged manifest is not bound to result, baseline, or approval`)
  if (manifest.candidateExecutionStatus !== result.status || manifest.reviewStatus !== result.reviewStatus || manifest.evidenceKind !== result.evidenceKind || manifest.testFile !== result.testFile || manifest.expectedResult !== result.expectedResult || manifest.actualResult !== result.actualResult) failEvidence(`${result.caseKey} packaged manifest does not mirror the atomic result`)
  if (!Array.isArray(manifest.evidenceFiles) || !manifest.artifactHashes || !Array.isArray(manifest.evidenceIds)) failEvidence(`${result.caseKey} packaged manifest has incomplete artifact metadata`)
  for (const file of manifest.evidenceFiles) {
    if (typeof file !== 'string' || path.basename(file) !== file || !/^[A-Za-z0-9._-]+\.png$/.test(file)) failEvidence(`${result.caseKey} packaged evidence file is unsafe: ${file}`)
    const artifact = path.join(packageDir, file)
    assertRegularPackagePath(artifact, `${result.caseKey}/${file}`)
    if (fileSha(artifact) !== manifest.artifactHashes[file]) failEvidence(`${result.caseKey}/${file} packaged hash mismatch`)
  }
  if (result.evidenceKind === 'UI_RUNTIME') {
    const expectedScreenshotPath = `unit/${result.caseKey}/runtime.png`
    const expectedManifestPath = `unit/${result.caseKey}/case-manifest.json`
    if (!result.runtimeEvidence || result.runtimeEvidence.screenshotPath !== expectedScreenshotPath || result.runtimeEvidence.manifestPath !== expectedManifestPath) failEvidence(`${result.caseKey} packaged UI paths must be portable repo-relative package paths`)
    if (!manifest.evidenceFiles.includes('runtime.png') || manifest.screenshotPath !== 'runtime.png' || manifest.manifestPath !== 'case-manifest.json' || manifest.screenshotSha256 !== manifest.artifactHashes['runtime.png']) failEvidence(`${result.caseKey} packaged UI screenshot metadata is incomplete`)
  }
  return true
}

async function writeAtomicEvidence({ batch, catalogPath: sourceCatalogPath = catalogPath, numberMapPath: sourceNumberMapPath = numberMapPath, approvalPath: sourceApprovalPath = approvalPath, evidenceRoot: targetRoot = unitEvidenceRoot }) {
  const authority = loadAuthority({ catalogPath: sourceCatalogPath, numberMapPath: sourceNumberMapPath, approvalPath: sourceApprovalPath })
  if (!batch || batch.sourceBaselineSha !== BASELINE_SHA || batch.catalogSha !== authority.catalogSha || !sameApproval(batch.approvalReference, APPROVAL_REFERENCE) || !Array.isArray(batch.results) || batch.results.length !== NEW_CASE_COUNT) failEvidence('atomic batch is not the approved 90-case aggregate')
  const definitions = new Map(authority.catalog.cases.slice(NEW_CASE_START).map(row => [row.caseId, row]))
  const renderItems = []
  const packageRows = []
  for (const result of batch.results) {
    const definition = definitions.get(result.caseKey)
    if (!definition) failEvidence(`atomic batch contains an unknown case: ${result.caseKey}`)
    atomic.validateAtomicResult(result)
    const caseDir = path.join(targetRoot, result.caseKey)
    fs.mkdirSync(caseDir, { recursive: true })
    const evidenceFiles = []
    const artifactHashes = {}
    let packagedResult = JSON.parse(JSON.stringify(result))
    if (result.evidenceKind === 'UI_RUNTIME') {
      const visual = copyVisualArtifact(result, caseDir)
      evidenceFiles.push(visual.file)
      artifactHashes[visual.file] = visual.hash
      const relativeScreenshot = posixRelative(path.join(caseDir, visual.file))
      const relativeManifest = posixRelative(path.join(caseDir, 'case-manifest.json'))
      packagedResult.runtimeEvidence.screenshotPath = relativeScreenshot
      packagedResult.runtimeEvidence.manifestPath = relativeManifest
    } else {
      const resultFile = path.join(caseDir, 'result.png')
      evidenceFiles.push('result.png')
      renderItems.push({ outputPath: resultFile, html: renderHtml([
        `Case ${result.mentorNumber}`,
        result.title,
        `Candidate ${result.status} · ${result.evidenceKind}`,
        `Assertion: ${result.expectedResult}`,
        `Observed: ${result.actualResult}`,
        `Source baseline: ${result.sourceBaselineSha}`,
        `Review: ${result.reviewStatus}`,
        `Limitation: ${result.limitation}`
      ], result.status === 'PASS' ? '#35d399' : result.status === 'BLOCKED' ? '#f0a000' : '#ff8792') })
    }
    for (const state of ['before', 'after', 'reload']) {
      if (!needsEvidenceState(definition, state)) continue
      const value = packagedResult[`${state}State`]
      if (!value || typeof value !== 'object' || Object.keys(value).length === 0) failEvidence(`atomic result ${result.caseKey} is missing required ${state} state`)
      const file = stateLabel(state)
      evidenceFiles.push(file)
      renderItems.push({ outputPath: path.join(caseDir, file), html: renderHtml([
        `Case ${result.mentorNumber}`,
        `Sanitized ${state} state`,
        ...stateValueLines(value),
        `Source baseline: ${result.sourceBaselineSha}`,
        `Execution: ${result.completedAt}`
      ], '#9f83ff') })
    }
    packageRows.push({ result, definition, caseDir, evidenceFiles, artifactHashes, packagedResult })
  }
  await renderPngFiles(renderItems)
  for (const row of packageRows) {
    for (const file of row.evidenceFiles) row.artifactHashes[file] = fileSha(path.join(row.caseDir, file))
    const resultPath = path.join(row.caseDir, 'result.json')
    fs.writeFileSync(resultPath, `${JSON.stringify(row.packagedResult, null, 2)}\n`, 'utf8')
    const manifest = buildAtomicManifest({ result: row.packagedResult, definition: row.definition, batch, evidenceFiles: row.evidenceFiles, artifactHashes: row.artifactHashes })
    manifest.resultSha256 = fileSha(resultPath)
    fs.writeFileSync(path.join(row.caseDir, 'case-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    validatePackagedAtomicResult(row.packagedResult, { evidenceRoot: row.caseDir })
  }
  return { caseCount: packageRows.length, renderCount: renderItems.length, evidenceRoot: targetRoot }
}

function parseFlag(argv, name) {
  const prefix = `--${name}`
  const index = argv.findIndex(argument => argument === prefix || argument.startsWith(`${prefix}=`))
  if (index < 0) return undefined
  return argv[index].startsWith(`${prefix}=`) ? argv[index].slice(prefix.length + 1) : argv[index + 1]
}

function repeatedFlag(argv, name) {
  const prefix = `--${name}`
  const values = []
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith(`${prefix}=`)) values.push(argv[index].slice(prefix.length + 1))
    else if (argv[index] === prefix && argv[index + 1]) values.push(argv[index + 1])
  }
  return values
}

function writeAggregateBatch(batch, outputPath) {
  const target = path.resolve(repoRoot, outputPath)
  if (!target.startsWith(`${RESULT_INPUT_ROOT}${path.sep}`)) failEvidence('aggregate output must stay inside .tmp/idts-110')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `${JSON.stringify(batch, null, 2)}\n`, 'utf8')
  return target
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes('--blocked-btp')) {
    writeBlockedBtpEvidence()
    return
  }
  if (argv.includes('--local-results')) {
    const value = parseFlag(argv, 'local-results')
    if (!value) throw new Error('--local-results requires a JSON file path')
    writeLocalEvidence(value)
    return
  }
  if (argv.some(argument => argument === '--atomic-results' || argument.startsWith('--atomic-results='))) {
    const outputPath = parseFlag(argv, 'atomic-results')
    const inputPaths = repeatedFlag(argv, 'source').concat(repeatedFlag(argv, 'atomic-source'))
    const batch = aggregateAtomicResults({ inputPaths: inputPaths.length ? inputPaths : undefined })
    const target = writeAggregateBatch(batch, outputPath)
    await writeAtomicEvidence({ batch })
    console.log(`IDTS-110 atomic evidence generated: ${batch.results.length} case packages; aggregate ${target}`)
    return
  }
  throw new Error('Usage: node scripts/qa/generate-idts110-evidence.js --blocked-btp | --local-results <summary.json> | --atomic-results=<aggregate.json> [--source=<batch.json>]')
}

if (require.main === module) main().catch(error => { console.error(`IDTS-110 evidence BLOCKED: ${error.message}`); process.exitCode = 1 })

module.exports = {
  aggregateAtomicResults,
  loadAuthority,
  renderHtml,
  renderPngFiles,
  validatePackagedAtomicResult,
  writeAtomicEvidence,
  DEFAULT_SOURCE_SPECS,
  BASELINE_SHA,
  sourceLedgerPath
}
