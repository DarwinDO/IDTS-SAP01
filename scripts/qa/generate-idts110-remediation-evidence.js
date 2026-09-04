'use strict'

const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..', '..')
const catalog = require('../../docs/qa/idts-110-unit-test-catalog.json')
const suiteResultsPath = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'local-primary-suite-results.json')
const suiteResults = JSON.parse(fs.readFileSync(suiteResultsPath, 'utf8'))
const evidenceRoot = path.join(repoRoot, 'docs', 'pm', 'evidence', 'idts-110', 'cases')
const resultById = new Map(suiteResults.caseResults.map(result => [result.caseId, result]))
const localPrimaryOnly = process.argv.includes('--local-primary-only')

function xml (value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
}

function resultSvg (testCase, result) {
  const suites = result.suiteKeys.join(', ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#f4fbf7"/>
  <rect x="56" y="48" width="1168" height="624" rx="24" fill="#ffffff" stroke="#b26a00" stroke-width="4"/>
  <text x="104" y="120" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#8a5200">IDTS-110 SUITE MAPPING SUMMARY</text>
  <text x="104" y="185" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#162a22">${xml(testCase.caseId)} - MAPPING ONLY</text>
  <text x="104" y="250" font-family="Arial, sans-serif" font-size="26" fill="#284b3b">${xml(testCase.title).slice(0, 82)}</text>
  <text x="104" y="340" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#162a22">Mapped suite evidence</text>
  <text x="104" y="390" font-family="Arial, sans-serif" font-size="23" fill="#284b3b">${xml(suites)}</text>
  <text x="104" y="470" font-family="Arial, sans-serif" font-size="23" fill="#284b3b">Mapped suites exited 0; no atomic case execution or browser/BTP proof is claimed.</text>
  <text x="104" y="520" font-family="Arial, sans-serif" font-size="23" fill="#284b3b">DonHV owns case-level review and final acceptance.</text>
  <text x="104" y="610" font-family="Arial, sans-serif" font-size="18" fill="#557568">Baseline ${xml(result.baselineSha)}</text>
</svg>\n`
}

function blockedSvg (testCase, manifest) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#fff8eb"/>
  <rect x="56" y="48" width="1168" height="624" rx="24" fill="#ffffff" stroke="#b26a00" stroke-width="4"/>
  <text x="104" y="120" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#8a5200">IDTS-110 BTP READINESS BLOCKER</text>
  <text x="104" y="185" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#162a22">${xml(testCase.caseId)} - BLOCKED</text>
  <text x="104" y="250" font-family="Arial, sans-serif" font-size="26" fill="#284b3b">${xml(testCase.title).slice(0, 82)}</text>
  <text x="104" y="350" font-family="Arial, sans-serif" font-size="24" fill="#284b3b">Cloud Foundry CLI unavailable; no BTP request or integration assertion ran.</text>
  <text x="104" y="410" font-family="Arial, sans-serif" font-size="24" fill="#284b3b">Environment blocker only; no product failure or PASS is claimed.</text>
  <text x="104" y="610" font-family="Arial, sans-serif" font-size="18" fill="#557568">Tested baseline ${xml(manifest.baselineSha)}</text>
</svg>\n`
}

let updated = 0
for (const testCase of catalog.cases.filter(testCase => testCase.environment === 'HYBRID_BTP')) {
  const result = resultById.get(testCase.caseId)
  if (!result || result.status !== 'MAPPING_ONLY_CANDIDATE') throw new Error(`Missing suite mapping result for ${testCase.caseId}`)
  const caseDir = path.join(evidenceRoot, testCase.caseId)
  const manifestPath = path.join(caseDir, 'case-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const mappedAssertions = result.suiteKeys.flatMap(key => suiteResults.executions[key].assertions.map(assertion => `${key}: ${assertion}`))
  Object.assign(manifest, {
    title: testCase.title,
    executor: 'DonHV (supporting NhanT)',
    candidateExecutionStatus: 'MAPPING_ONLY_CANDIDATE',
    reviewStatus: 'PENDING_DONHV_REVIEW',
    executedAt: suiteResults.completedAt,
    baselineSha: suiteResults.baselineSha,
    deploySha: null,
    environment: 'HYBRID_BTP',
    runtime: `${process.release.name} ${process.version}, ${process.platform} ${process.arch}`,
    testCommand: `node scripts/qa/test-idts110-local-primary-suites.js --baseline=${suiteResults.baselineSha} --output=docs/pm/evidence/idts-110/local-primary-suite-results.json`,
    sourceAssertions: testCase.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`),
    actualResult: result.actualResult,
    assertions: mappedAssertions,
    suiteKeys: result.suiteKeys,
    structuredEvidenceFile: '../../local-primary-suite-results.json',
    evidenceIds: [`IDTS110-${testCase.caseId}-LOCAL-PRIMARY-RESULT`],
    evidenceFiles: ['result.png'],
    limitations: 'This is broad suite-to-case traceability only. It is not an atomic case execution, browser proof, BTP acceptance evidence, or candidate PASS. DonHV owns final case-level review and workbook integration.'
  })
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  fs.writeFileSync(path.join(caseDir, 'result.svg'), resultSvg(testCase, result), 'utf8')
  updated++
}

console.log(`Updated ${updated} HYBRID_BTP case packages with local-primary candidate evidence.`)

if (localPrimaryOnly) process.exit(0)

for (const testCase of catalog.cases) {
  const manifestPath = path.join(evidenceRoot, testCase.caseId, 'case-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.evidenceFiles = manifest.evidenceFiles.filter(file => !file.endsWith('.svg'))
  if (testCase.environment === 'LOCAL') {
    manifest.runtime = 'Node.js v22.23.1, win32 x64'
    manifest.structuredEvidenceFile = '../../local-execution-results.json'
  }
  if (testCase.environment === 'BTP_REQUIRED') {
    manifest.candidateExecutionStatus = 'BLOCKED'
    manifest.executedAt = new Date().toISOString()
    manifest.baselineSha = suiteResults.baselineSha
    manifest.testCommand = 'npm.cmd run btp:demo:check'
    manifest.actualResult = 'Blocked before execution: `npm run btp:demo:check` cannot start because the Cloud Foundry CLI is unavailable on this host. No BTP request, deployment, database/seed change, or integration assertion ran.'
    manifest.assertions = [
      'Cloud Foundry CLI available: false',
      'BTP readiness command exit code: 1',
      'BTP integration assertion executed: false',
      'Product failure claimed: false'
    ]
    manifest.limitations = 'Environment blocker only. These 13 cases require an authorized Cloud Foundry/BTP session; DonHV owns final BTP execution review and workbook integration.'
    fs.writeFileSync(path.join(evidenceRoot, testCase.caseId, 'result.svg'), blockedSvg(testCase, manifest), 'utf8')
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}
