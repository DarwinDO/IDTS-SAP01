#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const repoRoot = path.resolve(__dirname, '..', '..')
const catalogPath = path.join(repoRoot, 'docs', 'qa', 'idts-110-unit-test-catalog.json')
const evidenceRoot = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'cases')

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

if (process.argv.includes('--blocked-btp')) {
  writeBlockedBtpEvidence()
} else if (process.argv.includes('--local-results')) {
  const index = process.argv.indexOf('--local-results')
  if (!process.argv[index + 1]) throw new Error('--local-results requires a JSON file path')
  writeLocalEvidence(process.argv[index + 1])
} else {
  console.error('Usage: node scripts/qa/generate-idts110-evidence.js --blocked-btp | --local-results <summary.json>')
  process.exitCode = 1
}
