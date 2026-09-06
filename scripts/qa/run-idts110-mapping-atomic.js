#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..', '..')
const lockedNodeModules = path.join(root, '..', 'idts-110-local-primary-harness-donhv', 'node_modules')
if (!process.env.NODE_PATH && fs.existsSync(lockedNodeModules)) process.env.NODE_PATH = lockedNodeModules
const manifest = require('../../docs/qa/idts-110-mapping-atomic-manifest.json')
const execution = require('./test-idts110-mapping-atomic-execution.js')
const atomic = require('./idts110-atomic-runner')

const OUTPUT = path.join(root, '.tmp', 'idts-110', 'mapping-atomic-results.json')
const EXECUTOR = process.env.IDTS110_EXECUTOR || 'Luna-Max'
const BASELINE = manifest.sourceBaselineSha
const CHILD_TIMEOUT_MS = 120000

function sha256File (file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function safeFailureMessage (message) {
  return String(message || 'The selected atomic child process did not emit a result marker.')
    .replace(/\bundefined\b/gi, '[UNSPECIFIED]')
    .replace(/MAPPING_ONLY/gi, '[FORBIDDEN_STATUS]')
    .slice(0, 1000)
}

async function fallbackResult (entry, message) {
  const definition = execution.definitionForRunner(entry)
  return atomic.runAtomicCase({
    definition,
    assertionId: `${entry.internalCaseKey}-A1`,
    baselineSha: BASELINE,
    executor: EXECUTOR,
    execute: async () => ({
      status: 'FAIL',
      assertionPassed: false,
      actualResult: safeFailureMessage(message),
      beforeState: null,
      afterState: null,
      reloadState: null,
      evidenceIds: [`${entry.internalCaseKey}-RESULT`],
      limitation: 'The isolated child process failed or timed out before emitting a case result; no suite result was substituted.',
      testCommand: `node scripts/qa/test-idts110-mapping-atomic-execution.js --idts110-case=${entry.internalCaseKey} --baseline=${BASELINE} --executor=${EXECUTOR}`
    })
  })
}

function childResult (entry) {
  const args = [
    path.join(__dirname, 'test-idts110-mapping-atomic-execution.js'),
    `--idts110-case=${entry.internalCaseKey}`,
    `--baseline=${BASELINE}`,
    `--executor=${EXECUTOR}`
  ]
  const env = {
    ...process.env,
    NODE_PATH: process.env.NODE_PATH || lockedNodeModules,
    CDS_TEST_FAKE: 'true',
    CDS_PLUGIN_UI5_ACTIVE: 'false',
    CDS_LOG_LEVEL: 'warn',
    NODE_ENV: 'test',
    CDS_ENV: 'test'
  }
  const child = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: CHILD_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true
  })
  const output = `${child.stdout || ''}\n${child.stderr || ''}`
  let result
  try {
    result = atomic.parseAtomicMarker(output)
    atomic.validateAtomicResult(result)
  } catch (error) {
    const timeout = child.error?.code === 'ETIMEDOUT' || child.signal
    result = null
    return { result, message: timeout ? `Child selector timed out after ${CHILD_TIMEOUT_MS} ms.` : safeFailureMessage(error.message || error) }
  }
  return { result, message: child.status === 0 ? null : `Child selector exited ${child.status} with a case result of ${result.status}.` }
}

async function main () {
  const results = []
  const startedAt = new Date().toISOString()
  for (const [index, entry] of manifest.entries.entries()) {
    const child = childResult(entry)
    const result = child.result || await fallbackResult(entry, child.message)
    results.push(result)
    process.stdout.write(`[${index + 1}/${manifest.entries.length}] ${entry.internalCaseKey} ${result.status}\n`)
  }
  const batch = atomic.writeAtomicBatch({
    runId: `idts110-mapping-${Date.now()}`,
    sourceBaselineSha: BASELINE,
    catalogSha: sha256File(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json')),
    approvalReference: manifest.authorization,
    results
  }, OUTPUT)
  const totals = batch.totals
  process.stdout.write(`IDTS-110 mapping atomic batch: ${JSON.stringify(totals)}\n`)
  if (totals.FAIL || totals.BLOCKED || totals.HELD || totals.NOT_RUN || totals.PASS !== manifest.entries.length) process.exitCode = 1
}

main().catch(error => {
  process.stderr.write(`${safeFailureMessage(error.stack || error)}\n`)
  process.exitCode = 1
})
