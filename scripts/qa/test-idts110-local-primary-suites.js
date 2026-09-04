'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const catalog = require('../../docs/qa/idts-110-unit-test-catalog.json')
const outputArg = process.argv.find(argument => argument.startsWith('--output='))
const outputPath = outputArg ? path.resolve(outputArg.slice('--output='.length)) : null
const baselineSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

const suites = {
  auth: [['test-auth-foundation-programmatic.js']],
  bug: [['test-idts6-programmatic.js'], ['test-idts23-regression.js']],
  classification: [['test-idts41-code-list-validation.js']],
  assignment: [['test-idts56-smart-assign.js']],
  lifecycle: [['test-idts6-programmatic.js'], ['test-idts23-regression.js'], ['test-history-events-programmatic.js', 'all']],
  collaboration: [['test-comments-attachments-programmatic.js']],
  history: [['test-history-events-programmatic.js', 'all']],
  notification: [['test-email-outbox-programmatic.js']],
  monitoring: [['test-pm-monitoring-programmatic.js']],
  aiDuplicate: [['test-idts66-duplicate-detection.js']],
  aiClassification: [['test-idts67-classification-suggestion.js']],
  aiSummary: [['test-idts68-bug-summary.js']],
  aiAssignment: [['test-idts69-assignment-explanation.js']],
  aiReview: [['test-idts91-ai-review-actions.js']],
  aiApply: [['test-idts93-apply-classification.js']],
  aiDuplicateConfirm: [['test-idts95-confirm-duplicate-suggestion.js']],
  aiMetrics: [['test-idts97-ai-operational-metrics.js']],
  securityAi: [['test-idts71-ai-security-review.js']],
  audit: [['test-idts65-ai-suggestion-audit.js']]
}

function suiteKeysForCase (testCase) {
  const id = testCase.caseId
  if (id.startsWith('UT-AUTH-')) return ['auth']
  if (id.startsWith('UT-BUG-')) return ['bug']
  if (id.startsWith('UT-VAL-PAIR-')) return ['classification']
  if (id.startsWith('UT-ASN-')) return ['assignment']
  if (id.startsWith('UT-LC-')) return ['lifecycle']
  if (id.startsWith('UT-CMT-') || ['UT-ATT-001', 'UT-ATT-002'].includes(id)) return ['collaboration']
  if (id.startsWith('UT-HIS-')) return ['history']
  if (id.startsWith('UT-NTF-')) return ['notification']
  if (/^UT-MON-00[1-6]$/.test(id)) return ['monitoring']
  if (id === 'UT-MON-007' || id === 'UT-AI-026') return ['aiMetrics']
  if (['UT-AI-008', 'UT-AI-009'].includes(id)) return ['aiDuplicate']
  if (['UT-AI-010', 'UT-AI-011'].includes(id)) return ['aiClassification']
  if (['UT-AI-012', 'UT-AI-013'].includes(id)) return ['aiSummary']
  if (['UT-AI-014', 'UT-AI-015'].includes(id)) return ['aiAssignment']
  if (/^UT-AI-01(6|7|8|9[A-C])$/.test(id) || id === 'UT-AI-020') return ['aiReview']
  if (['UT-AI-021', 'UT-AI-022'].includes(id)) return ['aiApply']
  if (['UT-AI-023', 'UT-AI-024', 'UT-AI-025A', 'UT-AI-025B'].includes(id)) return ['aiDuplicateConfirm']
  if (id === 'UT-SEC-001' || id === 'UT-SEC-005') return ['auth']
  if (id === 'UT-SEC-002') return ['bug']
  if (id === 'UT-SEC-003') return ['classification']
  if (id === 'UT-SEC-004') return ['audit']
  if (id === 'UT-SEC-006') return ['bug']
  if (id === 'UT-SEC-007') return ['securityAi']
  if (id === 'UT-SEC-008') return ['history']
  return []
}

function sanitizeLine (line) {
  return line
    .replace(/(password|token|api[-_ ]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]')
    .trim()
    .slice(0, 1000)
}

const executions = {}
for (const [suiteKey, commands] of Object.entries(suites)) {
  const results = []
  for (const command of commands) {
    const [script, ...args] = command
    results.push(spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      timeout: 120000,
      maxBuffer: 16 * 1024 * 1024
    }))
  }
  const combined = results.map(result => `${result.stdout || ''}\n${result.stderr || ''}`).join('\n')
  const assertions = combined.split(/\r?\n/).map(sanitizeLine).filter(line => /\bPASS\b/.test(line))
  const totals = combined.split(/\r?\n/).map(sanitizeLine).filter(line => /TOTAL:|PASS.*FAIL|checks$/.test(line)).slice(-3)
  executions[suiteKey] = {
    commands: commands.map(([script, ...args]) => [process.execPath, path.join('scripts', 'qa', script), ...args]),
    exitCodes: results.map(result => result.status),
    signals: results.map(result => result.signal),
    passed: results.every(result => result.status === 0),
    assertions,
    totals,
    outputSha256: crypto.createHash('sha256').update(combined).digest('hex')
  }
}

const hybridCases = catalog.cases.filter(testCase => testCase.environment === 'HYBRID_BTP')
const caseResults = hybridCases.map(testCase => {
  const suiteKeys = suiteKeysForCase(testCase)
  assert.ok(suiteKeys.length, `Missing local-primary suite mapping for ${testCase.caseId}`)
  const passed = suiteKeys.every(key => executions[key]?.passed)
  return {
    caseId: testCase.caseId,
    status: passed ? 'MAPPING_ONLY_CANDIDATE' : 'MAPPING_FAILED',
    suiteKeys,
    actualResult: passed
      ? 'The mapped local-primary domain suite(s) completed with exit code 0. This is broad suite-to-case traceability only, not an atomic case execution or candidate PASS.'
      : 'At least one mapped local-primary domain suite failed or timed out.',
    baselineSha
  }
})

const output = {
  schemaVersion: '1.0',
  jiraKey: 'IDTS-110',
  purpose: 'Fresh local-primary domain-suite rerun evidence for the 135 HYBRID_BTP cases corrected by DonHV.',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  baselineSha,
  policy: {
    mappingOnlyIsAtomicExecution: false,
    humanReviewer: 'DonHV',
    btpConfirmationIsOptionalForPrimaryAssertion: true
  },
  executions,
  caseResults,
  totals: {
    total: caseResults.length,
    mappingOnly: caseResults.filter(result => result.status === 'MAPPING_ONLY_CANDIDATE').length,
    failedMappings: caseResults.filter(result => result.status === 'MAPPING_FAILED').length
  }
}

assert.equal(output.totals.total, 135)
if (outputPath) fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(output.totals))
if (output.totals.failedMappings) process.exitCode = 1
