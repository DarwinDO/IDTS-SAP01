'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const childProcess = require('node:child_process')

const {
  BASELINE_SHA,
  assertNoReparseAncestors,
  parseAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  screenshotProof,
  matchesInvocationMetadata,
  validateAtomicResult,
  writeAtomicBatch
} = require('./idts110-atomic-runner')

const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_CATALOG = path.join(ROOT, 'docs/qa/idts-110-unit-test-catalog.json')
const DEFAULT_EXTENSION = path.join(ROOT, 'docs/qa/idts-110-extension-cases.json')
const DEFAULT_NUMBER_MAP = path.join(ROOT, 'docs/qa/idts-110-case-number-map.json')
const DEFAULT_APPROVAL = path.join(ROOT, 'docs/pm/evidence/idts-110/catalog-approval.json')
const EXISTING_CASE_COUNT = 188
const NEW_CASE_COUNT = 90
const DEFAULT_TIMEOUT_MS = 120000
// Allow only small scheduler/child-clock skew around this invocation window.
const CLOCK_TOLERANCE_MS = 5000
const CHILD_ENV_KEYS = [
  'PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP',
  'NODE_ENV', 'CDS_ENV', 'CDS_LOG_LEVEL', 'CDS_TEST_FAKE', 'CDS_PLUGIN_UI5_ACTIVE',
  'CI', 'NO_COLOR', 'FORCE_COLOR'
]
const INVOCATION_ENV_KEYS = {
  runId: 'IDTS110_RUN_ID',
  nonce: 'IDTS110_NONCE',
  caseKey: 'IDTS110_CASE_KEY',
  baselineSha: 'IDTS110_BASELINE_SHA'
}
const APPROVED_INPUT_HASHES = {
  catalog: '7f9d68d2185e95b166befb928069d6dfbcaffae563667692a1c319755c88e253',
  extension: '6d04a936c8678cdda93324be1ee810cc5acb6e5f5eb50213796df43b1e0135c2',
  numberMap: '90e90685483ec33ed7651c4343060374933c5e21f79cb9816093d1b0a58941b1',
  approval: 'b987130188a6b0bcee4bf6dce734435b84b4de137ab1bec43f8c2b4f267e5606'
}
const VISUAL_CASES = new Set([
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F239H',
  'IDTS110-F239D'
])

function definitionRequiresExternal (definition) {
  const executionModes = [definition.environment, definition.testLevel, definition.acceptanceMode, definition.providerMode, definition.provider, definition.executionMode]
    .filter(value => typeof value === 'string')
    .map(value => value.toUpperCase())
  return executionModes.some(value => /BTP|PROVIDER[_-]?LIVE|LIVE(?:[_-]|$)|EXTERNAL/.test(value)) || definition.providerLive === true || definition.live === true
}

function hasScreenshotProof (value, caseKey, invocation = null) {
  return screenshotProof(value, caseKey, invocation) !== null
}

function assertDefinitionEvidence (marker, definition, invocation = null) {
  if (marker.status !== 'PASS') return
  const requirements = Array.isArray(definition.evidenceRequirements) ? definition.evidenceRequirements.join(' ') : ''
  const required = {
    beforeState: /before(?:[-/ ]state|[-/ ]database)/i.test(requirements),
    afterState: /after(?:[-/ ]state|[-/ ]database)/i.test(requirements),
    reloadState: /reload|readback|persistence/i.test(requirements)
  }
  for (const [field, isRequired] of Object.entries(required)) {
    if (isRequired && (!marker[field] || typeof marker[field] !== 'object' || Object.keys(marker[field]).length === 0)) fail(`${field} evidence must be a non-empty object for ${definition.caseId}`)
  }
  if (definitionRequiresVisual(definition) && !hasScreenshotProof(marker.runtimeEvidence, definition.caseId, invocation)) fail(`rendered screenshot proof is required for ${definition.caseId}`)
}

function definitionRequiresVisual (definition) {
  const requirements = Array.isArray(definition.evidenceRequirements) ? definition.evidenceRequirements.join(' ') : ''
  return definition.acceptanceMode === 'UI_RUNTIME_VISUAL' || /browser\/runtime|rendered UI|screenshot|UI runtime/i.test(requirements)
}

function expectedEvidenceKind (definition, marker) {
  if (definitionRequiresVisual(definition)) return 'UI_RUNTIME'
  if (definitionRequiresExternal(definition) && marker.authorizedFixture === true) return 'BTP_INTEGRATION'
  return 'LOCAL_ATOMIC'
}

function assertExternalProof (marker, definition) {
  if (!definitionRequiresExternal(definition) || marker.status !== 'PASS') return
  if (marker.authorizedFixture !== true) fail(`external execution is not authorized for ${definition.caseId}`)
  if (typeof marker.deployedSha !== 'string' || !/^[a-f0-9]{40}$/i.test(marker.deployedSha)) fail(`external execution has no exact deployed SHA for ${definition.caseId}`)
  if (!marker.runtimeEvidence || typeof marker.runtimeEvidence !== 'object' || marker.runtimeEvidence.deployedSha !== marker.deployedSha || Object.keys(marker.runtimeEvidence).length < 2) fail(`external execution runtime proof does not match deployed SHA for ${definition.caseId}`)
}

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
  return crypto.createHash('sha256').update(JSON.stringify(readJson(catalogPath))).digest('hex')
}

function loadCatalog (catalogPath = DEFAULT_CATALOG) {
  const catalog = readJson(catalogPath)
  if (!Array.isArray(catalog.cases)) fail('catalog.cases must be an array')
  return catalog
}

function validateApprovedInputs (catalog, catalogPath = DEFAULT_CATALOG) {
  if (path.resolve(catalogPath) !== path.resolve(DEFAULT_CATALOG)) fail('catalog path must be the approved repository catalog file')
  if (catalogSha(catalogPath) !== APPROVED_INPUT_HASHES.catalog) fail('catalog content hash does not match the approved 278-case input')
  if (catalogSha(DEFAULT_EXTENSION) !== APPROVED_INPUT_HASHES.extension) fail('extension content hash does not match the approved input')
  if (catalogSha(DEFAULT_NUMBER_MAP) !== APPROVED_INPUT_HASHES.numberMap) fail('number-map content hash does not match the approved input')
  if (catalogSha(DEFAULT_APPROVAL) !== APPROVED_INPUT_HASHES.approval) fail('approval receipt content hash does not match the approved input')
  const extension = readJson(DEFAULT_EXTENSION)
  const numberMap = readJson(DEFAULT_NUMBER_MAP)
  const approval = readJson(DEFAULT_APPROVAL)
  if (extension.schemaVersion !== '1.0' || extension.jiraKey !== 'IDTS-110' || extension.sourceBaselineSha !== BASELINE_SHA) fail('extension input is not bound to the approved IDTS-110 baseline')
  if (extension.approvalReference?.pullRequest !== 388 || extension.approvalReference?.mergeSha !== BASELINE_SHA) fail('extension approval reference is invalid')
  if (extension.extensionSummary?.existing !== 188 || extension.extensionSummary?.retainedTask2 !== 10 || extension.extensionSummary?.featureCandidates !== 80 || extension.extensionSummary?.total !== 90 || extension.extensionSummary?.candidateCatalogTotal !== 278) fail('extension count summary is not the approved 188/10/80/90 plus 278 catalog set')
  if (!Array.isArray(extension.retainedTask2) || extension.retainedTask2.length !== 10 || !Array.isArray(extension.featureCandidates) || extension.featureCandidates.length !== 80) fail('extension rows do not contain the approved 10 retained and 80 feature definitions')
  if (extension.adapterSummary?.EXISTING_EXACT !== 11 || extension.adapterSummary?.ADD_TO_EXISTING !== 33 || extension.adapterSummary?.NEW_ROLE_RUNNER !== 1) fail('extension adapter ledger counts are not 11/33/1')
  if (!Array.isArray(numberMap.entries) || numberMap.entries.length !== 278) fail('approved number map must contain 278 entries')
  if (approval.schemaVersion !== '1.0' || approval.jiraKey !== 'IDTS-110' || approval.status !== 'APPROVED_FOR_EXECUTION' || approval.approvedBy !== 'DonHV' || approval.approvedCatalogCount !== 278 || approval.resultsPreApproved !== false) fail('approval receipt is not the approved DonHV execution receipt')
  if (approval.approvalReference?.pullRequest !== 388 || approval.approvalReference?.mergeSha !== BASELINE_SHA) fail('approval receipt reference is invalid')
  if (catalog.sourceBaselineSha !== BASELINE_SHA || catalog.approvalReference?.pullRequest !== 388 || catalog.approvalReference?.mergeSha !== BASELINE_SHA || catalog.extensionSummary?.total !== 278) fail('catalog metadata is not bound to the approved baseline and receipt')
  const extensionKeys = [...extension.retainedTask2, ...extension.featureCandidates].map(row => row.internalCaseKey)
  const catalogKeys = catalog.cases.slice(EXISTING_CASE_COUNT).map(row => row.caseId)
  if (JSON.stringify(extensionKeys) !== JSON.stringify(catalogKeys)) fail('catalog new-case order does not match the approved extension')
  if (JSON.stringify(numberMap.entries.map(row => row.internalCaseKey)) !== JSON.stringify(catalog.cases.map(row => row.caseId))) fail('number map is not bijective with the approved catalog')
  return { extension, numberMap, approval }
}

function loadNewDefinitions (catalogPath = DEFAULT_CATALOG) {
  const catalog = loadCatalog(catalogPath)
  validateApprovedInputs(catalog, catalogPath)
  const existingCount = Array.isArray(catalog.existingCaseOrder) ? catalog.existingCaseOrder.length : EXISTING_CASE_COUNT
  if (existingCount !== EXISTING_CASE_COUNT) fail(`expected ${EXISTING_CASE_COUNT} existing catalog cases`)
  const definitions = catalog.cases.slice(existingCount)
  if (definitions.length !== NEW_CASE_COUNT) fail(`expected ${NEW_CASE_COUNT} new definitions, found ${definitions.length}`)
  const keys = definitions.map(definition => definition.caseId)
  if (new Set(keys).size !== keys.length || keys.some(key => typeof key !== 'string' || !key.startsWith('IDTS110-'))) fail('new definitions must have unique IDTS-110 case keys')
  for (const definition of definitions) {
    if (!Number.isInteger(definition.mentorNumber) || definition.mentorNumber < 189 || definition.mentorNumber > 278) fail(`${definition.caseId} has an invalid mentor number`)
    if (definition.assertionId !== `${definition.caseId}-A1`) fail(`${definition.caseId} has an invalid assertion ID`)
    if (!Array.isArray(definition.plannedAssertions) || definition.plannedAssertions.length === 0) fail(`${definition.caseId} has no planned assertion`)
    if (definition.candidateStatus !== 'NOT_RUN' || definition.reviewStatus !== 'PENDING_DONHV_REVIEW' || definition.execution?.status !== 'NOT_RUN') fail(`${definition.caseId} has non-fresh execution state`)
  }
  return definitions
}

function isUsableDefinition (definition) {
  return definition !== null && typeof definition === 'object' &&
    typeof definition.caseId === 'string' && /^IDTS110-[A-Z0-9]+$/.test(definition.caseId) &&
    Number.isInteger(definition.mentorNumber) &&
    typeof definition.title === 'string' && definition.title.trim() &&
    typeof definition.expectedResult === 'string' && definition.expectedResult.trim() &&
    typeof definition.plannedTestFile === 'string' && definition.plannedTestFile.trim() &&
    definition.assertionId === `${definition.caseId}-A1` &&
    Array.isArray(definition.plannedAssertions) && definition.plannedAssertions.length > 0 &&
    Array.isArray(definition.sourceTrace) && definition.sourceTrace.length > 0
}

function isExactApprovedDefinition (definition, approvedDefinition) {
  return isUsableDefinition(definition) && JSON.stringify(definition) === JSON.stringify(approvedDefinition)
}

function filterDefinitions (definitions, scope = 'ALL') {
  if (!Array.isArray(definitions)) fail('definitions must be an array')
  const normalized = String(scope || 'ALL').toUpperCase()
  if (normalized === 'ALL' || normalized === 'NEW_CASES') return definitions
  if (normalized === 'USER_ADMIN_PROGRAMMATIC') return definitions.filter(definition => definition?.mentorNumber >= 189 && definition?.mentorNumber <= 233)
  if (normalized === 'MY_NOTIFICATIONS_SERVICE') return definitions.filter(definition => /^IDTS110-F23[2-6]$/.test(definition?.caseId || '') || ['IDTS110-F235I', 'IDTS110-F235C'].includes(definition?.caseId))
  if (normalized === 'VISUAL') return definitions.filter(definition => VISUAL_CASES.has(definition?.caseId))
  if (normalized === 'ACCESS_EMAIL') return definitions.filter(definition => definition?.domain === 'Access email delivery')
  if (normalized === 'BUG_EMAIL') return definitions.filter(definition => definition?.domain === 'Bug email delivery')
  fail(`unknown scope ${scope}`)
}

function realPathWithMissingTail (target) {
  let current = path.resolve(target)
  const missing = []
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current)
    if (parent === current) return current
    missing.unshift(path.basename(current))
    current = parent
  }
  return path.join(fs.realpathSync.native(current), ...missing)
}

function isWithin (target, parent) {
  const normalize = value => {
    const resolved = path.resolve(value)
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved
  }
  const normalizedTarget = normalize(target)
  const normalizedParent = normalize(parent)
  return normalizedTarget === normalizedParent || normalizedTarget.startsWith(`${normalizedParent}${path.sep}`)
}

function samePath (left, right) {
  const normalize = value => {
    const resolved = path.resolve(value)
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved
  }
  return normalize(left) === normalize(right)
}

function repositoryRoot (root = ROOT) {
  const intended = path.resolve(root)
  assertNoReparseAncestors(intended)
  let stat
  try {
    stat = fs.lstatSync(intended)
  } catch (error) {
    if (error.code === 'ENOENT') fail('repository root does not exist')
    throw error
  }
  if (!stat.isDirectory()) fail('repository root is not a directory')
  if (path.resolve(fs.realpathSync.native(intended)) !== intended && process.platform !== 'win32') fail('repository root canonical path differs from the intended path')
  const scriptsQa = path.join(intended, 'scripts', 'qa')
  assertNoReparseAncestors(scriptsQa)
  if (!fs.existsSync(scriptsQa) || !fs.statSync(scriptsQa).isDirectory()) fail('repository root is missing scripts/qa')
  return intended
}

function runnerPath (definition, root = ROOT) {
  if (typeof definition.plannedTestFile !== 'string' || !/^scripts\/qa\/[^\s]+\.m?js$/.test(definition.plannedTestFile) || definition.plannedTestFile.includes('..')) fail(`${definition.caseId} has an unsafe plannedTestFile`)
  const safeRoot = repositoryRoot(root)
  const scriptsRoot = path.join(safeRoot, 'scripts/qa')
  assertNoReparseAncestors(scriptsRoot)
  if (!isWithin(scriptsRoot, safeRoot)) fail('scripts/qa resolves outside the repository root')
  const lexical = path.resolve(safeRoot, definition.plannedTestFile)
  if (!isWithin(lexical, scriptsRoot)) fail(`${definition.caseId} plannedTestFile has a symlink escape outside scripts/qa`)
  assertNoReparseAncestors(path.dirname(lexical))
  const resolved = realPathWithMissingTail(lexical)
  if (!samePath(resolved, lexical) || !isWithin(resolved, scriptsRoot)) fail(`${definition.caseId} plannedTestFile has a reparse or symlink redirect outside its intended path`)
  if (fs.existsSync(lexical)) {
    const stat = fs.lstatSync(lexical)
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${definition.caseId} plannedTestFile is not a regular file`)
  }
  return lexical
}

function resolveOutputPath (outputPath, root = ROOT) {
  if (typeof outputPath !== 'string' || !outputPath.trim()) fail('output path is required')
  const safeRoot = repositoryRoot(root)
  const tmpRoot = path.join(safeRoot, '.tmp')
  const atomicRoot = path.join(tmpRoot, 'idts-110')
  assertNoReparseAncestors(tmpRoot)
  assertNoReparseAncestors(atomicRoot)
  const lexical = path.resolve(safeRoot, outputPath)
  if (!isWithin(lexical, tmpRoot)) fail('output path must stay inside the repository .tmp boundary')
  assertNoReparseAncestors(path.dirname(lexical))
  fs.mkdirSync(path.dirname(lexical), { recursive: true })
  assertNoReparseAncestors(path.dirname(lexical))
  const actual = realPathWithMissingTail(lexical)
  if (!samePath(actual, lexical) || !isWithin(actual, tmpRoot)) fail('output path has a symlink or reparse redirect outside the repository .tmp boundary')
  try {
    const stat = fs.lstatSync(lexical)
    if (stat.isSymbolicLink()) fail('output path cannot be a symlink or reparse point')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  return lexical
}

function perCaseOutputPath (outputPath, caseKey, root = ROOT) {
  const safeKey = String(caseKey).replace(/[^A-Za-z0-9_-]/g, '_')
  const base = resolveOutputPath(outputPath || path.join('.tmp', 'idts-110', 'atomic-results.json'), root)
  return resolveOutputPath(`${base}.${safeKey}.json`, root)
}

function invocationToken (value, field, generated) {
  if (value === undefined || value === null) return generated
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) fail(`${field} must be a safe invocation token`)
  return value
}

function newInvocationRunId () {
  return `idts110-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`
}

function newInvocationNonce () {
  return crypto.randomBytes(16).toString('hex')
}

function normalizedPath (value) {
  const resolved = path.resolve(value)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function snapshotOutputFiles (root) {
  const files = new Set()
  if (!fs.existsSync(root)) return files
  const visit = directory => {
    assertNoReparseAncestors(directory)
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name)
      const stat = fs.lstatSync(target)
      if (stat.isSymbolicLink()) fail(`output evidence tree contains a symlink or reparse point: ${target}`)
      if (stat.isDirectory()) visit(target)
      else if (stat.isFile()) files.add(normalizedPath(target))
    }
  }
  visit(root)
  return files
}

function childEnvironment (source = process.env, invocation = null) {
  const environment = Object.fromEntries(CHILD_ENV_KEYS.filter(key => typeof source[key] === 'string').map(key => [key, source[key]]))
  if (invocation) {
    for (const [field, key] of Object.entries(INVOCATION_ENV_KEYS)) {
      if (typeof invocation[field] === 'string' && invocation[field]) environment[key] = invocation[field]
    }
  }
  return environment
}

function commandStatus (child) {
  if (child?.error || child?.signal || child?.status === null || child?.status === undefined) return 'BLOCKED'
  return null
}

function fallbackDefinition (definition, index = 0) {
  const caseKey = typeof definition?.caseId === 'string' && /^IDTS110-[A-Z0-9]+$/.test(definition.caseId)
    ? definition.caseId
    : `IDTS110-INVALID${index + 1}`
  const mentorNumber = Number.isInteger(definition?.mentorNumber) && definition.mentorNumber >= 1 && definition.mentorNumber <= 278
    ? definition.mentorNumber
    : Math.min(278, 189 + index)
  return {
    caseId: caseKey,
    mentorNumber,
    assertionId: `${caseKey}-A1`,
    title: 'Malformed IDTS-110 case definition',
    preconditions: 'Definition validation failed before execution.',
    input: 'No case input was executed.',
    expectedResult: 'The malformed case is recorded as a safe failure.',
    plannedTestFile: 'scripts/qa/run-idts110-new-cases.js',
    sourceTrace: [{ file: 'scripts/qa/run-idts110-new-cases.js', symbol: 'runOneCase' }],
    evidenceRequirements: [],
    acceptanceMode: 'PROGRAMMATIC_ATOMIC',
    environment: 'LOCAL',
    reviewStatus: 'PENDING_DONHV_REVIEW'
  }
}

async function fallbackResult (definition, options, status, message, index = 0) {
  const target = definition && definition.caseId ? definition : fallbackDefinition(definition, index)
  try {
    return await runAtomicCase({
      definition: target,
      assertionId: `${target.caseId}-A1`,
      baselineSha: options.baselineSha,
      executor: options.executor,
      execute: async () => {
        const error = new Error(message)
        error.atomicStatus = status
        throw error
      }
    })
  } catch {
    const safeDefinition = fallbackDefinition(definition, index)
    return runAtomicCase({
      definition: safeDefinition,
      assertionId: `${safeDefinition.caseId}-A1`,
      baselineSha: options.baselineSha,
      executor: options.executor,
      execute: async () => {
        const error = new Error(message)
        error.atomicStatus = status
        throw error
      }
    })
  }
}

function markerOutput (child) {
  return `${child?.stdout || ''}\n${child?.stderr || ''}`
}

function assertMarkerMatches (marker, definition, baselineSha, invocationWindow = null) {
  validateAtomicResult(marker)
  if (marker.caseKey !== definition.caseId) fail(`marker case key mismatch for ${definition.caseId}`)
  if (definition.assertionId !== `${definition.caseId}-A1` || marker.assertionId !== definition.assertionId) fail(`marker assertion ID mismatch for ${definition.caseId}`)
  if (!Array.isArray(definition.plannedAssertions) || definition.plannedAssertions.length === 0) fail(`definition has no planned assertion for ${definition.caseId}`)
  if (marker.sourceBaselineSha !== baselineSha) fail(`marker baseline mismatch for ${definition.caseId}`)
  if (marker.mentorNumber !== definition.mentorNumber) fail(`marker mentor number mismatch for ${definition.caseId}`)
  if (marker.title !== definition.title) fail(`marker title mismatch for ${definition.caseId}`)
  if (marker.testFile !== definition.plannedTestFile) fail(`marker test file mismatch for ${definition.caseId}`)
  if (JSON.stringify(marker.sourceTrace) !== JSON.stringify(definition.sourceTrace)) fail(`marker source trace mismatch for ${definition.caseId}`)
  if (marker.evidenceKind !== expectedEvidenceKind(definition, marker)) fail(`marker evidence kind is not permitted by the case definition for ${definition.caseId}`)
  if (!definitionRequiresExternal(definition) && (marker.authorizedFixture !== false || marker.deployedSha !== null)) fail(`LOCAL or UI case cannot claim an authorized fixture or deployed SHA for ${definition.caseId}`)
  if (marker.expectedResult.trim().replace(/\s+/g, ' ') !== String(definition.expectedResult).trim().replace(/\s+/g, ' ')) fail(`marker expected result mismatch for ${definition.caseId}`)
  if (marker.status === 'PASS' && (marker.assertionPassed !== true || marker.actualResult.trim().replace(/\s+/g, ' ') !== marker.expectedResult.trim().replace(/\s+/g, ' '))) fail(`marker PASS proof mismatch for ${definition.caseId}`)
  const requiredEvidenceIds = [`${definition.caseId}-RESULT`]
  if (definitionRequiresVisual(definition)) requiredEvidenceIds.push(`${definition.caseId}-VISUAL`)
  if (requiredEvidenceIds.some(id => !marker.evidenceIds.includes(id))) fail(`marker evidence IDs are not case-bound for ${definition.caseId}`)
  if (marker.evidenceIds.some(id => !requiredEvidenceIds.includes(id))) fail(`marker contains arbitrary evidence IDs for ${definition.caseId}`)
  if (marker.status === 'PASS' && (!marker.testCommand.includes(`--idts110-case=${definition.caseId}`) || !marker.testCommand.includes(`--baseline=${baselineSha}`))) fail(`marker command proof mismatch for ${definition.caseId}`)
  if (marker.reviewStatus !== 'PENDING_DONHV_REVIEW') fail(`marker review status must remain pending for ${definition.caseId}`)
  if (marker.status === 'NOT_RUN') fail(`marker cannot report NOT_RUN after invoking ${definition.caseId}`)
  if (marker.status === 'PASS' && definitionRequiresVisual(definition) && !matchesInvocationMetadata(marker.runtimeEvidence, definition.caseId, invocationWindow)) fail(`marker runtimeEvidence is not bound to the current invocation for ${definition.caseId}`)
  assertDefinitionEvidence(marker, definition, invocationWindow)
  assertExternalProof(marker, definition)
  if (invocationWindow && marker.status === 'PASS') {
    const startedAt = Date.parse(marker.startedAt)
    const completedAt = Date.parse(marker.completedAt)
    if (startedAt < invocationWindow.startedAt - CLOCK_TOLERANCE_MS || completedAt > invocationWindow.completedAt + CLOCK_TOLERANCE_MS) fail(`marker timestamp is outside the invocation window for ${definition.caseId}`)
  }
  return marker
}

async function runOneCase (definition, options) {
  const invocationRunId = invocationToken(options.runId, 'runId', newInvocationRunId())
  const invocationNonce = invocationToken(options.nonce, 'nonce', newInvocationNonce())
  const executable = runnerPath(definition, options.root)
  const childArgs = [
    executable,
    `--idts110-case=${definition.caseId}`,
    `--baseline=${options.baselineSha}`,
    `--executor=${options.executor}`,
    `--idts110-run-id=${invocationRunId}`,
    `--idts110-nonce=${invocationNonce}`,
    `--output=${perCaseOutputPath(options.outputPath, definition.caseId)}`
  ]
  let child
  const invocationStartedAt = Date.now()
  const preexistingPaths = definitionRequiresVisual(definition)
    ? snapshotOutputFiles(path.join(options.root, '.tmp', 'idts-110'))
    : null
  try {
    child = options.spawnSync(process.execPath, childArgs, {
      cwd: options.root,
      encoding: 'utf8',
      env: childEnvironment(process.env, {
        caseKey: definition.caseId,
        runId: invocationRunId,
        nonce: invocationNonce,
        baselineSha: options.baselineSha
      }),
      timeout: options.timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    })
  } catch (error) {
    return fallbackResult(definition, options, 'BLOCKED', 'Atomic child process could not start; the runner is unavailable.', options.index)
  }
  const invocationCompletedAt = Date.now()

  const commandFailure = commandStatus(child)
  if (commandFailure) {
    const detail = child.error?.code === 'ETIMEDOUT' || child.signal
      ? 'Atomic child process timed out before producing a result marker; browser or fixture execution is blocked.'
      : 'Atomic child process could not start; the planned runner or fixture is unavailable.'
    return fallbackResult(definition, options, 'BLOCKED', detail, options.index)
  }

  let marker
  try {
    marker = parseAtomicMarker(markerOutput(child))
    assertMarkerMatches(marker, definition, options.baselineSha, {
      startedAt: invocationStartedAt,
      completedAt: invocationCompletedAt,
      runId: invocationRunId,
      nonce: invocationNonce,
      baselineSha: options.baselineSha,
      clockToleranceMs: CLOCK_TOLERANCE_MS,
      preexistingPaths
    })
  } catch (error) {
    const detail = error.message.includes('exactly one')
      ? `Atomic child did not emit exactly one case marker for ${definition.caseId}; suite-only output is not atomic evidence.`
      : `Atomic child emitted an invalid result for ${definition.caseId}; no PASS was inferred from its exit code.`
    return fallbackResult(definition, options, definitionRequiresExternal(definition) ? 'BLOCKED' : 'FAIL', detail, options.index)
  }

  if (child.status !== 0 && marker.status === 'PASS') {
    return fallbackResult(definition, options, 'FAIL', `Atomic child exited with code ${child.status} after claiming PASS; the result is not accepted.`, options.index)
  }
  if (marker.status === 'PASS' && definitionRequiresVisual(definition) && options.usedVisualEvidence) {
    const proof = screenshotProof(marker.runtimeEvidence, definition.caseId)
    if (!proof) fail(`rendered screenshot proof is required for ${definition.caseId}`)
    if (options.usedVisualEvidence.has(proof.hash)) fail(`screenshot evidence is reused across case results for ${definition.caseId}`)
    options.usedVisualEvidence.add(proof.hash)
  }
  return marker
}

async function runNewCases ({
  definitions = null,
  baselineSha,
  executor,
  outputPath = null,
  runId = null,
  nonce = null,
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
  const invocationRunId = invocationToken(runId, 'runId', newInvocationRunId())
  const invocationNonce = invocationToken(nonce, 'nonce', newInvocationNonce())
  const safeRoot = repositoryRoot(root)
  const safeOutputPath = outputPath ? resolveOutputPath(outputPath, safeRoot) : null
  const catalog = loadCatalog(catalogPath)
  const approved = validateApprovedInputs(catalog, catalogPath)
  const approvedDefinitions = loadNewDefinitions(catalogPath)
  if (definitions !== null && !Array.isArray(definitions)) fail('definitions must be an array')
  const requestedDefinitions = definitions === null ? approvedDefinitions : definitions
  const approvedByKey = new Map(approvedDefinitions.map(definition => [definition.caseId, definition]))
  for (const definition of requestedDefinitions) {
    if (!definition || typeof definition !== 'object' || typeof definition.caseId !== 'string' || !approvedByKey.has(definition.caseId)) fail('definitions may contain only approved IDTS-110 case definitions')
    const approvedDefinition = approvedByKey.get(definition.caseId)
    if (!isExactApprovedDefinition(definition, approvedDefinition)) fail('known IDTS-110 definitions must be deep-equal to the approved catalog definition')
  }
  const selectedDefinitions = filterDefinitions(requestedDefinitions, scope).map(definition => {
    const approvedDefinition = approvedByKey.get(definition?.caseId)
    return approvedDefinition && isExactApprovedDefinition(definition, approvedDefinition) ? approvedDefinition : definition
  })
  if (!selectedDefinitions.length) fail('scope selected no new cases')
  if (new Set(selectedDefinitions.map(definition => definition.caseId)).size !== selectedDefinitions.length) fail('definitions contain a duplicate approved case key')
  const actualCatalogSha = catalogSha(catalogPath)
  if (suppliedCatalogSha !== undefined && suppliedCatalogSha !== actualCatalogSha) fail('caller catalogSha does not match the approved catalog file')
  if (approvalReference !== undefined && JSON.stringify(approvalReference) !== JSON.stringify(approved.approval.approvalReference)) fail('caller approvalReference does not match the approved receipt file')
  const results = []
  const usedVisualEvidence = new Set()
  for (const [index, definition] of selectedDefinitions.entries()) {
    try {
      results.push(await runOneCase(definition, {
        baselineSha: parsed.baselineSha,
        executor: parsed.executor,
        outputPath: safeOutputPath,
        root: safeRoot,
        timeoutMs,
        spawnSync,
        index,
        usedVisualEvidence,
        runId: invocationRunId,
        nonce: invocationNonce
      }))
    } catch (error) {
      results.push(await fallbackResult(definition, {
        baselineSha: parsed.baselineSha,
        executor: parsed.executor,
        outputPath: safeOutputPath,
          root: safeRoot,
          timeoutMs,
          spawnSync,
          index,
          runId: invocationRunId,
          nonce: invocationNonce
        }, 'FAIL', 'Atomic orchestrator rejected the child result; no PASS was inferred.', index))
    }
  }
  const batch = {
    runId: invocationRunId,
    sourceBaselineSha: parsed.baselineSha,
    catalogSha: actualCatalogSha,
    approvalReference: approved.approval.approvalReference,
    results
  }
  return safeOutputPath ? writeAtomicBatch(batch, safeOutputPath) : batch
}

function exitCodeForBatch (batch) {
  return Array.isArray(batch?.results) && batch.results.length > 0 && batch.results.every(result => result.status === 'PASS') ? 0 : 1
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
  process.exitCode = exitCodeForBatch(batch)
}

if (require.main === module) {
  main().catch(error => {
    console.error(`IDTS-110 new-case orchestrator BLOCKED: ${String(error.message || error).replace(/\r?\n/g, ' ').slice(0, 1000)}`)
    process.exitCode = 1
  })
}

module.exports = {
  ROOT,
  catalogSha,
  loadCatalog,
  validateApprovedInputs,
  loadNewDefinitions,
  filterDefinitions,
  resolveOutputPath,
  childEnvironment,
  parseOrchestratorOptions,
  exitCodeForBatch,
  runNewCases,
  runOneCase
}
