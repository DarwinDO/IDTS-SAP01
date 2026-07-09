#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR ||
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-72')
const RUN_RENDER = /^true$/i.test(process.env.IDTS_QA_RUN_RENDER_AI || '')

const suites = [
  ['IDTS-66 duplicate and similar bug detection', 'scripts/qa/test-idts66-duplicate-detection.js'],
  ['IDTS-67 classification suggestion', 'scripts/qa/test-idts67-classification-suggestion.js'],
  ['IDTS-68 grounded bug and handoff summary', 'scripts/qa/test-idts68-bug-summary.js'],
  ['IDTS-69 Smart Assign explanation', 'scripts/qa/test-idts69-assignment-explanation.js'],
  ['IDTS-70 reusable Fiori AI review states', 'scripts/qa/test-idts70-ai-review-ui.js'],
  ['IDTS-71 AI safety and misuse review', 'scripts/qa/test-idts71-ai-security-review.js']
]

if (RUN_RENDER) {
  suites.push(['IDTS-71 shared-QA Render AI smoke', 'scripts/qa/test-idts71-render-ai-smoke.js'])
}

function sanitizeOutput(value) {
  return String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/xkeysib-[A-Za-z0-9_-]+/gi, 'xkeysib-[REDACTED]')
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, 'postgresql://[REDACTED]')
    .replace(/("?(?:password|token|apiKey|secretAccessKey)"?\s*[:=]\s*)[^\s,;}]+/gi, '$1[REDACTED]')
}

function runSuite([name, relativeScript]) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, [relativeScript], {
    cwd: ROOT,
    env: {
      ...process.env,
      ...(relativeScript.includes('render-ai-smoke')
        ? { IDTS_QA_EVIDENCE_DIR: EVIDENCE_DIR }
        : {})
    },
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  })
  const stdout = sanitizeOutput(result.stdout)
  const stderr = sanitizeOutput(result.stderr)
  const passed = result.status === 0
  const totalLines = stdout.match(/TOTAL:[^\r\n]*/g) || []
  const summary = totalLines.at(-1) || `${passed ? 'PASS' : 'FAIL'} (exit ${result.status})`

  process.stdout.write(`\n--- ${name} ---\n`)
  process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
  process.stdout.write(`  ${passed ? 'PASS' : 'FAIL'}  ${name} (exit ${result.status})\n`)

  return {
    name,
    script: relativeScript,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status,
    passed,
    summary,
    errorSummary: passed ? '' : stderr.slice(-2000)
  }
}

function main() {
  if (RUN_RENDER && (!process.env.IDTS_QA_EMAIL || !process.env.IDTS_QA_PASSWORD)) {
    throw new Error(
      'IDTS_QA_RUN_RENDER_AI=true requires private IDTS_QA_EMAIL and IDTS_QA_PASSWORD.'
    )
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const startedAt = new Date().toISOString()
  const results = suites.map(runSuite)
  const failed = results.filter(result => !result.passed)

  const evidence = {
    task: 'IDTS-72',
    purpose: 'Final AI acceptance across four suggestion flows, review UI states, and safety behavior.',
    startedAt,
    finishedAt: new Date().toISOString(),
    renderSmokeRequested: RUN_RENDER,
    renderSmokeStatus: RUN_RENDER ? (failed.some(item => item.script.includes('render-ai-smoke')) ? 'FAIL' : 'PASS') : 'NOT_RUN',
    totals: {
      suites: results.length,
      passed: results.length - failed.length,
      failed: failed.length
    },
    results
  }

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'idts72-ai-acceptance.json'),
    JSON.stringify(evidence, null, 2)
  )

  console.log('')
  console.log('==============================================')
  console.log(` IDTS-72 acceptance: ${evidence.totals.passed}/${evidence.totals.suites} suites passed`)
  console.log(` Render smoke: ${evidence.renderSmokeStatus}`)
  console.log(` Evidence: ${path.join(EVIDENCE_DIR, 'idts72-ai-acceptance.json')}`)
  console.log('==============================================')

  if (failed.length) process.exit(1)
}

try {
  main()
} catch (error) {
  console.error('RESULT: FAIL')
  console.error(error && error.message ? error.message : error)
  process.exit(1)
}
