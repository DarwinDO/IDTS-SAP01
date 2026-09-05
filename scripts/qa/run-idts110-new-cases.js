'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const childProcess = require('node:child_process')

const {
  BASELINE_SHA,
  parseAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  validateAtomicResult,
  writeAtomicBatch
} = require('./idts110-atomic-runner')

const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_CATALOG = path.join(ROOT, 'docs/qa/idts-110-unit-test-catalog.json')
const EXISTING_CASE_COUNT = 188
const NEW_CASE_COUNT = 90
const DEFAULT_TIMEOUT_MS = 120000
const VISUAL_CASES = new Set([
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F239H',
  'IDTS110-F239D'
])

function fail (message) {
  throw new Error(`IDTS-110 new-case orchestrator: ${message}`)
}

function readJson (filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function parseFlag (argv, name) {
  const prefix = `--${name}`
  const index = argv.findIndex(argument => argument === prefix || argument.startsWith(`${prefix}=`))
  if (index < 0) return undefined
  const argument = argv[index]
  return argument.startsWith(`${prefix}=`) ? argument.slice(prefix.length + 1) : argv[index + 1]
}

function catalogSha (catalogPath = DEFAULT_CATALOG) {
  return crypto.createHash('sha256').update(fs.readFileSync(catalogPath)).digest('hex')
}

function loadCatalog (catalogPath = DEFAULT_CATALOG) {
  const catalog = readJson(catalogPath)
  if (!Array.isArray(catalog.cases)) fail('catalog.cases must be an array')
  return catalog
}

function loadNewDefinitions (catalogPath = DEFAULT_CATALOG) {
  const catalog = loadCatalog(catalogPath)
  const existingCount = Array.isArray(catalog.existingCaseOrder) ? catalog.existingCaseOrder.length : EXISTING_CASE_COUNT
  if (existingCount !== EXISTING_CASE_COUNT) fail(`expected ${EXISTING_CASE_COUNT} existing catalog cases`)
  const definitions = catalog.cases.slice(existingCount)
  if (definitions.length !== NEW_CASE_COUNT) fail(`expected ${NEW_CASE_COUNT} new definitions, found ${definitions.length}`)
  const keys = definitions.map(definition => definition.caseId)
  if (new Set(keys).size !== keys.length || keys.some(key => typeof key !== 'string' || !key.startsWith('IDTS110-'))) fail('new definitions must have unique IDTS-110 case keys')
  return definitions
}

function filterDefinitions (definitions, scope = 'ALL') {
  const normalized = String(scope || 'ALL').toUpperCase()
  if (normalized === 'ALL' || normalized === 'NEW_CASES') return definitions
  if (normalized === 'USER_ADMIN_PROGRAMMATIC') return definitions.filter(definition => definition.mentorNumber >= 189 && definition.mentorNumber <= 233)
  if (normalized === 'MY_NOTIFICATIONS_SERVICE') return definitions.filter(definition => /^IDTS110-F23[2-6]$/.test(definition.caseId) || ['IDTS110-F235I', 'IDTS110-F235C'].includes(definition.caseId))
  if (normalized === 'VISUAL') return definitions.filter(definition => VISUAL_CASES.has(definition.caseId))
  if (normalized === 'ACCESS_EMAIL') return definitions.filter(definition => definition.domain === 'Access email delivery')
  if (normalized === 'BUG_EMAIL') return definitions.filter(definition => definition.domain === 'Bug email delivery')
  fail(`unknown scope ${scope}`)
}

function runnerPath (definition, root = ROOT) {
  if (typeof definition.plannedTestFile !== 'string' || !/^scripts\/qa\/[^\s]+\.m?js$/.test(definition.plannedTestFile) || definition.plannedTestFile.includes('..')) fail(`${definition.caseId} has an unsafe plannedTestFile`)
  const scriptsRoot = path.resolve(root, 'scripts/qa') + path.sep
  const resolved = path.resolve(root, definition.plannedTestFile)
  if (!resolved.startsWith(scriptsRoot)) fail(`${definition.caseId} plannedTestFile is outside scripts/qa`)
  return resolved
}

function perCaseOutputPath (outputPath, caseKey) {
  const safeKey = String(caseKey).replace(/[^A-Za-z0-9_-]/g, '_')
  return `${path.resolve(outputPath || path.join(ROOT, '.tmp/idts-110/atomic-results.json'))}.${safeKey}.json`
}

function commandStatus (child) {
  if (child?.error || child?.signal || child?.status === null || child?.status === undefined) return 'BLOCKED'
  return null
}

async function fallbackResult (definition, options, status, message) {
  return runAtomicCase({
    definition,
    assertionId: `${definition.caseId}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => {
      const error = new Error(message)
      error.atomicStatus = status
      throw error
    }
  })
}

function markerOutput (child) {
  return `${child?.stdout || ''}\n${child?.stderr || ''}`
}

function assertMarkerMatches (marker, definition, baselineSha) {
  validateAtomicResult(marker)
  if (marker.caseKey !== definition.caseId) fail(`marker case key mismatch for ${definition.caseId}`)
  if (marker.assertionId !== `${definition.caseId}-A1`) fail(`marker assertion ID mismatch for ${definition.caseId}`)
  if (marker.sourceBaselineSha !== baselineSha) fail(`marker baseline mismatch for ${definition.caseId}`)
  if (marker.mentorNumber !== definition.mentorNumber) fail(`marker mentor number mismatch for ${definition.caseId}`)
  if (marker.title !== definition.title) fail(`marker title mismatch for ${definition.caseId}`)
  if (marker.testFile !== definition.plannedTestFile) fail(`marker test file mismatch for ${definition.caseId}`)
  if (marker.status === 'NOT_RUN') fail(`marker cannot report NOT_RUN after invoking ${definition.caseId}`)
  return marker
}

async function runOneCase (definition, options) {
  const executable = runnerPath(definition, options.root)
  const childArgs = [
    executable,
    `--idts110-case=${definition.caseId}`,
    `--baseline=${options.baselineSha}`,
    `--executor=${options.executor}`,
    `--output=${perCaseOutputPath(options.outputPath, definition.caseId)}`
  ]
  let child
  try {
    child = options.spawnSync(process.execPath, childArgs, {
      cwd: options.root,
      encoding: 'utf8',
      env: process.env,
      timeout: options.timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    })
  } catch (error) {
    return fallbackResult(definition, options, 'BLOCKED', 'Atomic child process could not start; the runner is unavailable.')
  }

  const commandFailure = commandStatus(child)
  if (commandFailure) {
    const detail = child.error?.code === 'ETIMEDOUT' || child.signal
      ? 'Atomic child process timed out before producing a result marker; browser or fixture execution is blocked.'
      : 'Atomic child process could not start; the planned runner or fixture is unavailable.'
    return fallbackResult(definition, options, 'BLOCKED', detail)
  }

  let marker
  try {
    marker = parseAtomicMarker(markerOutput(child))
    assertMarkerMatches(marker, definition, options.baselineSha)
  } catch (error) {
    const detail = error.message.includes('exactly one')
      ? `Atomic child did not emit exactly one case marker for ${definition.caseId}; suite-only output is not atomic evidence.`
      : `Atomic child emitted an invalid result for ${definition.caseId}; no PASS was inferred from its exit code.`
    return fallbackResult(definition, options, 'FAIL', detail)
  }

  if (child.status !== 0 && marker.status === 'PASS') {
    return fallbackResult(definition, options, 'FAIL', `Atomic child exited with code ${child.status} after claiming PASS; the result is not accepted.`)
  }
  return marker
}

async function runNewCases ({
  definitions = loadNewDefinitions(),
  baselineSha,
  executor,
  outputPath = null,
  runId = `idts110-${Date.now()}-${process.pid}`,
  catalogSha: suppliedCatalogSha,
  approvalReference,
  scope = 'ALL',
  root = ROOT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  spawnSync = childProcess.spawnSync,
  catalogPath = DEFAULT_CATALOG
}) {
  const parsed = readAtomicOptions([
    `--baseline=${baselineSha || ''}`,
    `--executor=${executor || ''}`
  ])
  const selectedDefinitions = filterDefinitions(definitions, scope)
  if (!selectedDefinitions.length) fail('scope selected no new cases')
  const catalog = loadCatalog(catalogPath)
  const results = []
  for (const definition of selectedDefinitions) {
    try {
      results.push(await runOneCase(definition, {
        baselineSha: parsed.baselineSha,
        executor: parsed.executor,
        outputPath,
        root,
        timeoutMs,
        spawnSync
      }))
    } catch (error) {
      results.push(await fallbackResult(definition, {
        baselineSha: parsed.baselineSha,
        executor: parsed.executor,
        outputPath,
        root,
        timeoutMs,
        spawnSync
      }, 'FAIL', 'Atomic orchestrator rejected the child result; no PASS was inferred.'))
    }
  }
  const batch = {
    runId,
    sourceBaselineSha: parsed.baselineSha,
    catalogSha: suppliedCatalogSha || catalogSha(catalogPath),
    approvalReference: approvalReference || catalog.approvalReference || { pullRequest: 388, mergeSha: BASELINE_SHA },
    results
  }
  return outputPath ? writeAtomicBatch(batch, outputPath) : batch
}

function parseOrchestratorOptions (argv = process.argv.slice(2)) {
  const atomic = readAtomicOptions(argv)
  const scope = parseFlag(argv, 'scope') || 'ALL'
  if (!atomic.baselineSha) fail('orchestrator requires --baseline=<exact source SHA>')
  if (!atomic.executor) fail('orchestrator requires --executor=<explicit runtime identity>')
  if (!atomic.outputPath) fail('orchestrator requires --output=<batch JSON>')
  const timeoutValue = parseFlag(argv, 'timeout-ms')
  const timeoutMs = timeoutValue === undefined ? DEFAULT_TIMEOUT_MS : Number(timeoutValue)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600000) fail('timeout-ms must be an integer from 1 through 600000')
  return { scope, baselineSha: atomic.baselineSha, executor: atomic.executor, outputPath: atomic.outputPath, timeoutMs }
}

async function main () {
  const options = parseOrchestratorOptions()
  const batch = await runNewCases(options)
  const statusCounts = Object.fromEntries(Object.entries(batch.totals).filter(([, count]) => count > 0))
  console.log(JSON.stringify({ runId: batch.runId, scope: options.scope, total: batch.results.length, statusCounts }))
  if (batch.results.some(result => ['FAIL', 'BLOCKED'].includes(result.status))) process.exitCode = 1
}

if (require.main === module) {
  main().catch(error => {
    console.error(`IDTS-110 new-case orchestrator BLOCKED: ${String(error.message || error).replace(/\r?\n/g, ' ').slice(0, 1000)}`)
    process.exitCode = 1
  })
}

module.exports = {
  ROOT,
  loadCatalog,
  loadNewDefinitions,
  filterDefinitions,
  parseOrchestratorOptions,
  runNewCases,
  runOneCase
}
