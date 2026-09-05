'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const BASELINE_SHA = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const MARKER_PREFIX = 'IDTS110_ATOMIC_RESULT '
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const ATOMIC_OUTPUT_ROOT = path.join(PROJECT_ROOT, '.tmp', 'idts-110')
const RESULT_STATUSES = ['PASS', 'FAIL', 'BLOCKED', 'HELD', 'NOT_RUN']
const EVIDENCE_KINDS = ['LOCAL_ATOMIC', 'UI_RUNTIME', 'BTP_INTEGRATION']
const MAX_SAFE_STRING_LENGTH = 2000
const MAX_SAFE_ARRAY_ITEMS = 64
const MAX_SAFE_OBJECT_PROPERTIES = 32
const MAX_SAFE_DEPTH = 4
const REQUIRED_RESULT_FIELDS = [
  'schemaVersion', 'jiraKey', 'caseKey', 'mentorNumber', 'assertionId', 'title',
  'status', 'assertionPassed', 'authorizedFixture', 'evidenceKind', 'executor', 'startedAt', 'completedAt',
  'sourceBaselineSha', 'deployedSha', 'testFile', 'testCommand', 'preconditions',
  'input', 'expectedResult', 'actualResult', 'sourceTrace', 'beforeState',
  'afterState', 'reloadState', 'runtimeEvidence', 'evidenceIds', 'limitation',
  'reviewStatus'
]

const SENSITIVE_ASSIGNMENT = /["']?(?:password|passwd|pwd|token|access[_-]?token|api[_-]?key|secret|client[_-]?secret|authorization|cookie|private[_-]?key)["']?\s*[:=]\s*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^\s,;}]+)/gi
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+\-/=]+/gi
const PRIVATE_URL = /\b(?:https?|postgres(?:ql)?|mysql|mssql|mongodb(?:\+srv)?|redis|amqps?|sftp|ftp):\/\/[^\s"'<>]+/gi
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PLACEHOLDER = /\b(?:TBD|TODO|PLACEHOLDER|TO\s+BE\s+(?:DETERMINED|FILLED)|UNRESOLVED_PLACEHOLDER)\b|\$\{[^}]+\}|<\s*(?:TBD|TODO|PLACEHOLDER)\s*>/i
const RAW_SECRET = [SENSITIVE_ASSIGNMENT, BEARER_TOKEN, PRIVATE_URL, EMAIL]

function fail (message) {
  throw new Error(`IDTS-110 atomic protocol: ${message}`)
}

function isObject (value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSensitiveKey (key) {
  return /(?:password|passwd|pwd|token|access[_-]?token|api[_-]?key|secret|authorization|cookie|private[_-]?key|endpoint|database[_-]?url|connection[_-]?string)/i.test(key)
}

function isPiiKey (key) {
  return /^(?:email|mail|phone|telephone|mobile|display[_-]?name|user[_-]?name|recipient|address)$/i.test(key)
}

function normalizeEscapedStructuredText (value) {
  let normalized = String(value)
  for (let pass = 0; pass < 3; pass += 1) normalized = normalized.replace(/\\(["'{}[\],:=/])/g, '$1')
  return normalized
}

function containsRawSecret (text) {
  const candidates = [String(text), normalizeEscapedStructuredText(text)]
  return candidates.some(candidate => RAW_SECRET.some(pattern => {
    pattern.lastIndex = 0
    return pattern.test(candidate)
  }))
}

function redactText (value) {
  if (value === null || value === undefined) return value
  let text = String(value)
  for (const pattern of RAW_SECRET) text = text.replace(pattern, '[REDACTED]')
  if (containsRawSecret(text)) return '[REDACTED]'
  return text.replace(/\r?\n/g, ' ').trim()
}

function hasRawSecret (text) {
  return containsRawSecret(text)
}

function hasPlaceholder (text) {
  return PLACEHOLDER.test(text)
}

function assertNoUndefined (value, location = 'value', seen = new Set()) {
  if (value === undefined) fail(`undefined value at ${location}`)
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) fail(`cyclic value at ${location}`)
  seen.add(value)
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail(`undefined array entry at ${location}[${index}]`)
      assertNoUndefined(value[index], `${location}[${index}]`, seen)
    }
  } else {
    for (const [key, item] of Object.entries(value)) assertNoUndefined(item, `${location}.${key}`, seen)
  }
  seen.delete(value)
}

function sanitizeValue (value, location = 'value', seen = new Set(), depth = 0) {
  assertNoUndefined(value, location)
  if (value === null) return null
  if (typeof value === 'string') {
    const sanitized = redactText(value)
    if (sanitized.length > MAX_SAFE_STRING_LENGTH) fail(`string length exceeds ${MAX_SAFE_STRING_LENGTH} characters at ${location}`)
    return sanitized
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`non-finite number at ${location}`)
    return value
  }
  if (typeof value === 'boolean') return value
  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') fail(`unsupported value at ${location}`)
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) fail(`invalid date at ${location}`)
    return value.toISOString()
  }
  if (seen.has(value)) fail(`cyclic value at ${location}`)
  if (depth > MAX_SAFE_DEPTH) fail(`value exceeds depth ${MAX_SAFE_DEPTH} at ${location}`)
  seen.add(value)
  let output
  if (Array.isArray(value)) {
    if (value.length > MAX_SAFE_ARRAY_ITEMS) fail(`array length exceeds ${MAX_SAFE_ARRAY_ITEMS} items at ${location}`)
    output = value.map((item, index) => sanitizeValue(item, `${location}[${index}]`, seen, depth + 1))
  } else {
    if (Object.keys(value).length > MAX_SAFE_OBJECT_PROPERTIES) fail(`object exceeds ${MAX_SAFE_OBJECT_PROPERTIES} properties at ${location}`)
    output = {}
    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveKey(key) || isPiiKey(key) || key.toLowerCase() === 'stack') continue
      output[key] = sanitizeValue(item, `${location}.${key}`, seen, depth + 1)
    }
  }
  seen.delete(value)
  return output
}

function assertSafeValue (value, location = 'value', seen = new Set(), depth = 0) {
  if (value === undefined) fail(`undefined value at ${location}`)
  if (typeof value === 'string') {
    if (hasRawSecret(value)) fail(`unsanitized secret, PII, or private endpoint at ${location}`)
    if (hasPlaceholder(value)) fail(`unresolved placeholder at ${location}`)
    if (value.length > MAX_SAFE_STRING_LENGTH) fail(`string length exceeds ${MAX_SAFE_STRING_LENGTH} characters at ${location}`)
    return
  }
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) fail(`cyclic value at ${location}`)
  if (depth > MAX_SAFE_DEPTH) fail(`value exceeds depth ${MAX_SAFE_DEPTH} at ${location}`)
  seen.add(value)
  if (Array.isArray(value)) {
    if (value.length > MAX_SAFE_ARRAY_ITEMS) fail(`array length exceeds ${MAX_SAFE_ARRAY_ITEMS} items at ${location}`)
    for (let index = 0; index < value.length; index += 1) assertSafeValue(value[index], `${location}[${index}]`, seen, depth + 1)
  } else {
    if (Object.keys(value).length > MAX_SAFE_OBJECT_PROPERTIES) fail(`object exceeds ${MAX_SAFE_OBJECT_PROPERTIES} properties at ${location}`)
    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveKey(key) || isPiiKey(key) || key.toLowerCase() === 'stack') fail(`sensitive or PII key at ${location}.${key}`)
      assertSafeValue(key, `${location}.<key>`, seen)
      assertSafeValue(item, `${location}.${key}`, seen, depth + 1)
    }
  }
  seen.delete(value)
}

function parseFlag (argv, name) {
  const prefix = `--${name}`
  const index = argv.findIndex(argument => argument === prefix || argument.startsWith(`${prefix}=`))
  if (index < 0) return undefined
  const argument = argv[index]
  if (argument.startsWith(`${prefix}=`)) return argument.slice(prefix.length + 1)
  return argv[index + 1]
}

function requireNonEmptyString (value, field) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} is required`)
  return value.trim()
}

function assertBaseline (value) {
  const baselineSha = requireNonEmptyString(value, 'baseline')
  if (!/^[a-f0-9]{40}$/i.test(baselineSha)) fail('baseline must be a 40-character SHA-1')
  if (baselineSha.toLowerCase() !== BASELINE_SHA) fail(`baseline must equal ${BASELINE_SHA}`)
  return baselineSha.toLowerCase()
}

function readAtomicOptions (argv = process.argv.slice(2)) {
  if (!Array.isArray(argv)) fail('argv must be an array')
  const caseKeyValue = parseFlag(argv, 'idts110-case')
  const baselineValue = parseFlag(argv, 'baseline')
  const executorValue = parseFlag(argv, 'executor')
  const modeValue = parseFlag(argv, 'mode')
  const outputValue = parseFlag(argv, 'output')
  const caseKey = caseKeyValue === undefined ? null : requireNonEmptyString(caseKeyValue, 'case')
  if (caseKey !== null && !/^IDTS110-[A-Z0-9]+$/.test(caseKey)) fail('case must be a safe IDTS-110 internal key')
  const baselineSha = baselineValue === undefined ? null : assertBaseline(baselineValue)
  const executor = executorValue === undefined ? null : redactText(requireNonEmptyString(executorValue, 'executor'))
  const mode = modeValue === undefined ? 'local' : requireNonEmptyString(modeValue, 'mode')
  if (!['local', 'ui-runtime', 'btp'].includes(mode)) fail('mode must be local, ui-runtime, or btp')
  const outputPath = outputValue === undefined ? null : requireNonEmptyString(outputValue, 'output')
  if (caseKey !== null) {
    if (baselineSha === null) fail('atomic case selection requires an explicit baseline')
    if (executor === null) fail('atomic case selection requires an explicit executor')
  }
  return { caseKey, baselineSha, executor, mode, outputPath }
}

function caseKeyFor (definition) {
  const key = definition?.caseId || definition?.internalCaseKey || definition?.caseKey
  return requireNonEmptyString(key, 'definition.caseId')
}

function expectedAssertionId (caseKey) {
  return `${caseKey}-A1`
}

function textResult (value, field, fallback = null) {
  if (value === undefined) return fallback
  if (value === null) return fallback
  const sanitized = sanitizeValue(value, field)
  const text = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized)
  if (!text || !text.trim()) fail(`${field} must be non-empty`)
  return text.trim()
}

function normalizeComparable (value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ')
  return JSON.stringify(value)
}

function hasSnapshotRequirement (definition, kind) {
  const requirements = Array.isArray(definition.evidenceRequirements) ? definition.evidenceRequirements.join(' ') : ''
  const patterns = {
    before: /before(?:[-/ ]state|[-/ ]database)/i,
    after: /after(?:[-/ ]state|[-/ ]database)/i,
    reload: /reload|readback|persistence/i
  }
  return patterns[kind].test(requirements)
}

function needsVisualEvidence (definition) {
  if (definition.acceptanceMode === 'UI_RUNTIME_VISUAL') return true
  const requirements = Array.isArray(definition.evidenceRequirements) ? definition.evidenceRequirements.join(' ') : ''
  return /browser\/runtime|rendered UI|screenshot|UI runtime/i.test(requirements)
}

function needsAuthorizedExternal (definition) {
  const executionModes = [definition.environment, definition.testLevel, definition.acceptanceMode, definition.providerMode, definition.provider, definition.executionMode]
    .filter(value => typeof value === 'string')
    .map(value => value.toUpperCase())
  return executionModes.some(value => /BTP|PROVIDER[_-]?LIVE|LIVE(?:[_-]|$)|EXTERNAL/.test(value)) || definition.providerLive === true || definition.live === true
}

function hasAuthorizedExternal (outcome) {
  const deployedSha = outcome.deployedSha
  return outcome.authorizedFixture === true &&
    typeof deployedSha === 'string' &&
    /^[a-f0-9]{40}$/i.test(deployedSha) &&
    isObject(outcome.runtimeEvidence) &&
    outcome.runtimeEvidence.deployedSha === deployedSha &&
    Object.keys(outcome.runtimeEvidence).length > 1
}

function hasScreenshotEvidence (value) {
  if (!value || typeof value !== 'object') return false
  const screenshotPaths = []
  const screenshotHashes = []
  const visit = current => {
    if (!current || typeof current !== 'object') return
    for (const [key, item] of Object.entries(current)) {
      if (/screenshot|runtime(?:Image|Evidence)|imagePath/i.test(key)) {
        if (typeof item === 'string' && item.trim()) {
          if (/sha|hash/i.test(key) && /^[a-f0-9]{64}$/i.test(item.trim())) screenshotHashes.push(item.trim().toLowerCase())
          else screenshotPaths.push(item.trim())
        } else if (item && typeof item === 'object') visit(item)
      } else if (item && typeof item === 'object') visit(item)
    }
  }
  visit(value)
  return screenshotPaths.some(screenshotPath => screenshotHashes.some(screenshotHash => screenshotFileMatches(screenshotPath, screenshotHash)))
}

function screenshotFileMatches (screenshotPath, expectedHash) {
  if (typeof screenshotPath !== 'string' || typeof expectedHash !== 'string') return false
  const outputRoot = path.resolve(ATOMIC_OUTPUT_ROOT)
  const lexical = path.isAbsolute(screenshotPath)
    ? path.resolve(screenshotPath)
    : path.resolve(outputRoot, screenshotPath)
  if (!isWithin(lexical, outputRoot) || path.extname(lexical).toLowerCase() !== '.png') return false
  if (!fs.existsSync(lexical)) return false
  const stat = fs.lstatSync(lexical)
  if (!stat.isFile() || stat.isSymbolicLink()) return false
  const actual = fs.realpathSync.native(lexical)
  if (!isWithin(actual, outputRoot)) return false
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(actual)).digest('hex')
  return actualHash === expectedHash.toLowerCase()
}

function statusFromError (error) {
  const status = String(error?.atomicStatus || error?.status || '').toUpperCase()
  if (status === 'BLOCKED' || error?.blocked === true || error?.code === 'ATOMIC_BLOCKED') return 'BLOCKED'
  return 'FAIL'
}

function safeErrorMessage (error) {
  const message = error && typeof error.message === 'string' ? error.message : String(error || 'Atomic assertion failed.')
  return redactText(message).slice(0, 1000) || 'Atomic assertion failed.'
}

function buildResult ({ definition, assertionId, baselineSha, executor, startedAt, completedAt, outcome, statusOverride }) {
  const caseKey = caseKeyFor(definition)
  const expected = textResult(definition.expectedResult, 'definition.expectedResult', 'The selected atomic assertion completes.')
  const actualProvided = Object.hasOwn(outcome, 'actualResult')
  if (actualProvided && outcome.actualResult === undefined) fail('execute.actualResult cannot be undefined')
  const actual = textResult(actualProvided ? outcome.actualResult : undefined, 'actualResult', 'Atomic assertion did not provide an actual result.')
  const actualMatches = actualProvided && normalizeComparable(actual) === normalizeComparable(expected)
  const explicitSuccess = outcome.assertionPassed === true
  const requestedStatus = outcome.status ? String(outcome.status).toUpperCase() : null
  const resultStatus = statusOverride || (requestedStatus && requestedStatus !== 'PASS' ? requestedStatus : null) || (
    explicitSuccess && actualMatches && outcome.expectedResultMatched !== false ? 'PASS' : 'FAIL'
  )
  if (!RESULT_STATUSES.includes(resultStatus)) fail(`unsupported result status: ${resultStatus}`)
  if (resultStatus === 'MAPPING_ONLY') fail('MAPPING_ONLY is forbidden for new atomic results')
  if (resultStatus === 'HELD') fail('HELD is a reviewer status and cannot be synthesized by the runner')
  if (resultStatus === 'NOT_RUN') fail('NOT_RUN cannot be emitted after invoking an atomic case')

  const beforeState = Object.hasOwn(outcome, 'beforeState') ? outcome.beforeState : null
  const afterState = Object.hasOwn(outcome, 'afterState') ? outcome.afterState : null
  const reloadState = Object.hasOwn(outcome, 'reloadState') ? outcome.reloadState : null
  const runtimeEvidence = Object.hasOwn(outcome, 'runtimeEvidence') ? outcome.runtimeEvidence : null
  for (const [field, value] of Object.entries({ beforeState, afterState, reloadState, runtimeEvidence })) {
    if (value === undefined) fail(`execute.${field} cannot be undefined`)
  }
  let finalStatus = resultStatus
  let finalActual = actual
  let authorizedExternal = false
  if (needsAuthorizedExternal(definition)) {
    authorizedExternal = hasAuthorizedExternal(outcome)
    if (!authorizedExternal) {
      finalStatus = 'BLOCKED'
      finalActual = 'BTP, provider-live, or other external execution requires authorizedFixture=true, an exact deployed SHA, and matching runtime evidence.'
    }
  }
  const evidenceKind = definition.acceptanceMode === 'UI_RUNTIME_VISUAL'
    ? 'UI_RUNTIME'
    : needsAuthorizedExternal(definition)
      ? 'BTP_INTEGRATION'
      : 'LOCAL_ATOMIC'
  const safeBeforeState = sanitizeValue(beforeState, 'beforeState')
  const safeAfterState = sanitizeValue(afterState, 'afterState')
  const safeReloadState = sanitizeValue(reloadState, 'reloadState')
  const safeRuntimeEvidence = sanitizeValue(runtimeEvidence, 'runtimeEvidence')
  const requiredEvidenceIds = [`${caseKey}-RESULT`]
  if (evidenceKind === 'UI_RUNTIME') requiredEvidenceIds.push(`${caseKey}-VISUAL`)
  const suppliedEvidenceIds = Object.hasOwn(outcome, 'evidenceIds') ? outcome.evidenceIds : requiredEvidenceIds
  if (suppliedEvidenceIds === undefined) fail('execute.evidenceIds cannot be undefined')
  const sanitizedEvidenceIds = sanitizeValue(suppliedEvidenceIds, 'evidenceIds')
  const safeEvidenceIds = Array.isArray(sanitizedEvidenceIds)
    ? [...new Set(sanitizedEvidenceIds.filter(id => typeof id === 'string' && requiredEvidenceIds.includes(id)))]
    : []
  const missingEvidenceIds = requiredEvidenceIds.filter(id => !safeEvidenceIds.includes(id))
  if (missingEvidenceIds.length || !Array.isArray(sanitizedEvidenceIds) || safeEvidenceIds.length !== sanitizedEvidenceIds.length) {
    finalStatus = 'FAIL'
    finalActual = `Atomic assertion ran without the required case evidence ID(s): ${missingEvidenceIds.join(', ') || `${caseKey}-RESULT`}.`
    for (const id of requiredEvidenceIds) if (!safeEvidenceIds.includes(id)) safeEvidenceIds.push(id)
  }
  if (resultStatus === 'PASS') {
    const missing = []
    if (hasSnapshotRequirement(definition, 'before') && (!isObject(safeBeforeState) || Object.keys(safeBeforeState).length === 0)) missing.push('before-state')
    if (hasSnapshotRequirement(definition, 'after') && (!isObject(safeAfterState) || Object.keys(safeAfterState).length === 0)) missing.push('after-state')
    if (hasSnapshotRequirement(definition, 'reload') && (!isObject(safeReloadState) || Object.keys(safeReloadState).length === 0)) missing.push('reload/readback')
    if (needsVisualEvidence(definition) && !hasScreenshotEvidence(safeRuntimeEvidence)) missing.push('browser/runtime screenshot and SHA-256')
    if (missing.length && finalStatus !== 'BLOCKED') {
      finalStatus = 'FAIL'
      finalActual = `Atomic assertion ran but required evidence is missing: ${missing.join(', ')}.`
    }
  }
  const result = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    caseKey,
    mentorNumber: definition.mentorNumber,
    assertionId,
    title: textResult(definition.title, 'definition.title'),
    status: finalStatus,
    assertionPassed: finalStatus === 'PASS',
    authorizedFixture: authorizedExternal,
    evidenceKind,
    executor: textResult(executor, 'executor'),
    startedAt,
    completedAt,
    sourceBaselineSha: baselineSha,
    deployedSha: authorizedExternal ? outcome.deployedSha : null,
    testFile: textResult(definition.plannedTestFile, 'definition.plannedTestFile'),
    testCommand: textResult(outcome.testCommand, 'testCommand', `node ${definition.plannedTestFile} --idts110-case=${caseKey} --baseline=${baselineSha} --executor=${executor}`),
    preconditions: textResult(definition.preconditions, 'definition.preconditions', 'Use the isolated fixture defined for this case.'),
    input: textResult(definition.input, 'definition.input', 'Use the case-specific input defined by the catalog.'),
    expectedResult: expected,
    actualResult: finalActual,
    sourceTrace: sanitizeValue(definition.sourceTrace || [], 'definition.sourceTrace'),
    beforeState: safeBeforeState,
    afterState: safeAfterState,
    reloadState: safeReloadState,
    runtimeEvidence: safeRuntimeEvidence,
    evidenceIds: safeEvidenceIds,
    limitation: textResult(outcome.limitation, 'limitation', definition.environment === 'BTP_REQUIRED'
      ? 'BTP or provider-live evidence requires a separately authorized target and fixture.'
      : 'No provider or live BTP state used.'),
    reviewStatus: textResult(outcome.reviewStatus, 'reviewStatus', 'PENDING_DONHV_REVIEW')
  }
  validateAtomicResult(result)
  return result
}

async function runAtomicCase ({ definition, assertionId, baselineSha, executor, execute }) {
  if (!isObject(definition)) fail('definition must be an object')
  const caseKey = caseKeyFor(definition)
  const expectedId = expectedAssertionId(caseKey)
  if (assertionId !== expectedId) fail(`assertionId must equal ${expectedId}`)
  if (definition.assertionId !== undefined && definition.assertionId !== expectedId) fail(`definition.assertionId must equal ${expectedId}`)
  const sourceBaseline = assertBaseline(baselineSha)
  const explicitExecutor = textResult(executor, 'executor')
  if (typeof execute !== 'function') fail('execute must be a function')
  const startedAt = new Date().toISOString()
  let outcome
  let statusOverride
  try {
    outcome = await execute()
    if (!isObject(outcome)) {
      const error = new Error('atomic execute must return a result object')
      statusOverride = 'FAIL'
      outcome = { actualResult: error.message }
    }
  } catch (error) {
    statusOverride = statusFromError(error)
    outcome = {
      actualResult: safeErrorMessage(error),
      beforeState: error?.beforeState ?? null,
      afterState: error?.afterState ?? null,
      reloadState: error?.reloadState ?? null,
      runtimeEvidence: error?.runtimeEvidence ?? null,
      evidenceIds: error?.evidenceIds ?? [`${caseKey}-RESULT`],
      limitation: statusOverride === 'BLOCKED' ? 'The authorized fixture, browser, provider, BTP target, or runner was unavailable.' : undefined
    }
  }
  const completedAt = new Date().toISOString()
  return buildResult({ definition, assertionId, baselineSha: sourceBaseline, executor: explicitExecutor, startedAt, completedAt, outcome, statusOverride })
}

function validateTimestamp (value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail(`${field} must be a safe ISO-8601 UTC timestamp`)
}

function validateAtomicResult (result) {
  if (!isObject(result)) fail('atomic result must be an object')
  assertNoUndefined(result)
  for (const field of REQUIRED_RESULT_FIELDS) if (!Object.hasOwn(result, field)) fail(`result missing ${field}`)
  for (const field of Object.keys(result)) if (!REQUIRED_RESULT_FIELDS.includes(field)) fail(`result contains unsupported field ${field}`)
  if (result.schemaVersion !== '1.0') fail('result schemaVersion must be 1.0')
  if (result.jiraKey !== 'IDTS-110') fail('result jiraKey must be IDTS-110')
  if (typeof result.caseKey !== 'string' || !/^IDTS110-[A-Z0-9]+$/.test(result.caseKey)) fail('result caseKey is invalid')
  if (!Number.isInteger(result.mentorNumber) || result.mentorNumber < 1 || result.mentorNumber > 278) fail('result mentorNumber is invalid')
  if (result.assertionId !== expectedAssertionId(result.caseKey)) fail('result assertionId must be <caseKey>-A1')
  for (const field of ['title', 'executor', 'testFile', 'testCommand', 'preconditions', 'input', 'expectedResult', 'actualResult', 'limitation', 'reviewStatus']) {
    if (typeof result[field] !== 'string' || !result[field].trim()) fail(`result ${field} must be non-empty`)
  }
  if (!RESULT_STATUSES.includes(result.status) || result.status === 'MAPPING_ONLY') fail('result status is invalid; MAPPING_ONLY is forbidden')
  if (typeof result.assertionPassed !== 'boolean') fail('result assertionPassed must be boolean')
  if (typeof result.authorizedFixture !== 'boolean') fail('result authorizedFixture must be boolean')
  if (result.status === 'PASS' && result.assertionPassed !== true) fail('PASS requires explicit assertionPassed=true')
  if (result.status !== 'PASS' && result.assertionPassed !== false) fail('non-PASS results require assertionPassed=false')
  if (!EVIDENCE_KINDS.includes(result.evidenceKind)) fail('result evidenceKind is invalid')
  validateTimestamp(result.startedAt, 'startedAt')
  validateTimestamp(result.completedAt, 'completedAt')
  if (Date.parse(result.completedAt) < Date.parse(result.startedAt)) fail('completedAt cannot precede startedAt')
  if (result.sourceBaselineSha !== BASELINE_SHA) fail(`result sourceBaselineSha must equal ${BASELINE_SHA}`)
  if (result.deployedSha !== null && (typeof result.deployedSha !== 'string' || !/^[a-f0-9]{40}$/i.test(result.deployedSha))) fail('result deployedSha must be null or a 40-character SHA-1')
  if (result.authorizedFixture && result.deployedSha === null) fail('authorizedFixture requires a deployedSha')
  if (!result.authorizedFixture && result.deployedSha !== null) fail('deployedSha requires authorizedFixture=true')
  if (typeof result.testFile !== 'string' || !/^scripts\/qa\/[^\s]+\.m?js$/.test(result.testFile) || result.testFile.includes('..')) fail('result testFile must be a repository QA runner path')
  if (!Array.isArray(result.sourceTrace) || result.sourceTrace.length === 0 || result.sourceTrace.some(trace => !isObject(trace) || typeof trace.file !== 'string' || typeof trace.symbol !== 'string' || !trace.file.trim() || !trace.symbol.trim())) fail('result sourceTrace must contain file and symbol entries')
  for (const state of ['beforeState', 'afterState', 'reloadState', 'runtimeEvidence']) if (state !== 'runtimeEvidence' && result[state] !== null && !isObject(result[state])) fail(`result ${state} must be an object or null`)
  if (result.runtimeEvidence !== null && !isObject(result.runtimeEvidence)) fail('result runtimeEvidence must be an object or null')
  if (result.authorizedFixture && (!isObject(result.runtimeEvidence) || result.runtimeEvidence.deployedSha !== result.deployedSha)) fail('authorizedFixture requires runtimeEvidence.deployedSha to match deployedSha')
  const requiredEvidenceId = `${result.caseKey}-RESULT`
  const visualEvidenceId = `${result.caseKey}-VISUAL`
  const allowedEvidenceIds = result.evidenceKind === 'UI_RUNTIME' ? [requiredEvidenceId, visualEvidenceId] : [requiredEvidenceId]
  if (!Array.isArray(result.evidenceIds) || result.evidenceIds.length === 0 || result.evidenceIds.some(id => typeof id !== 'string' || !id.trim() || !allowedEvidenceIds.includes(id)) || !result.evidenceIds.includes(requiredEvidenceId)) fail('result evidenceIds must contain the exact case result ID')
  if (result.status === 'PASS' && result.evidenceKind === 'UI_RUNTIME' && !result.evidenceIds.includes(visualEvidenceId)) fail('visual PASS requires the exact case visual evidence ID')
  if (result.status === 'PASS' && result.evidenceKind === 'UI_RUNTIME' && !hasScreenshotEvidence(result.runtimeEvidence)) fail('visual PASS requires an existing PNG screenshot with a matching SHA-256')
  const serialized = JSON.stringify(result)
  if (/MAPPING_ONLY|\bundefined\b/i.test(serialized)) fail('result contains forbidden MAPPING_ONLY or undefined text')
  assertSafeValue(result)
  return result
}

function parseAtomicMarker (output) {
  const lines = Array.isArray(output) ? output : String(output ?? '').split(/\r?\n/)
  const markerLines = lines.map(line => String(line).trim()).filter(line => line.startsWith(MARKER_PREFIX))
  if (markerLines.length !== 1) fail(`expected exactly one ${MARKER_PREFIX.trim()} marker, found ${markerLines.length}`)
  const payload = markerLines[0].slice(MARKER_PREFIX.length).trim()
  if (!payload) fail('atomic marker payload is empty')
  try {
    const parsed = JSON.parse(payload)
    if (!isObject(parsed)) fail('atomic marker payload must be an object')
    return parsed
  } catch (error) {
    if (error.message.startsWith('IDTS-110 atomic protocol:')) throw error
    fail('atomic marker JSON is invalid')
  }
}

function formatAtomicMarker (result) {
  const sanitized = sanitizeValue(result, 'result')
  validateAtomicResult(sanitized)
  return `${MARKER_PREFIX}${JSON.stringify(sanitized)}`
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
  const resolvedTarget = path.resolve(target)
  const resolvedParent = path.resolve(parent)
  return resolvedTarget === resolvedParent || resolvedTarget.startsWith(`${resolvedParent}${path.sep}`)
}

function samePath (left, right) {
  const normalize = value => path.resolve(value)
  const a = normalize(left)
  const b = normalize(right)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}

function assertNoSymlinkAncestors (targetRoot) {
  const safeRoot = fs.realpathSync.native(PROJECT_ROOT)
  const resolvedTarget = path.resolve(targetRoot)
  if (!isWithin(resolvedTarget, safeRoot)) fail('target root is outside the repository')
  let current = safeRoot
  for (const segment of path.relative(safeRoot, resolvedTarget).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    let stat
    try {
      stat = fs.lstatSync(current)
    } catch (error) {
      if (error.code === 'ENOENT') break
      throw error
    }
    if (stat.isSymbolicLink()) fail('output root contains a symlink or reparse point')
    if (!stat.isDirectory()) fail('output root contains a non-directory ancestor')
    if (!samePath(fs.realpathSync.native(current), current)) fail('output root canonical ancestor differs from the intended path')
  }
}

function atomicOutputPath (outputPath) {
  if (typeof outputPath !== 'string' || !outputPath.trim()) fail('outputPath is required')
  const safeRoot = fs.realpathSync.native(PROJECT_ROOT)
  const outputRoot = path.join(safeRoot, '.tmp', 'idts-110')
  assertNoSymlinkAncestors(outputRoot)
  const actualOutputRoot = path.resolve(outputRoot)
  if (!isWithin(actualOutputRoot, safeRoot)) fail('atomic output root has a symlink escape')
  const lexical = path.resolve(outputPath)
  if (!isWithin(lexical, outputRoot)) fail('outputPath must stay inside the approved .tmp/idts-110 boundary')
  if (fs.existsSync(lexical) && fs.lstatSync(lexical).isSymbolicLink()) fail('outputPath cannot be a symlink')
  assertNoSymlinkAncestors(path.dirname(lexical))
  fs.mkdirSync(path.dirname(lexical), { recursive: true })
  assertNoSymlinkAncestors(path.dirname(lexical))
  const actualParent = fs.realpathSync.native(path.dirname(lexical))
  if (!samePath(actualParent, path.dirname(lexical)) || !isWithin(actualParent, actualOutputRoot)) fail('outputPath parent has a symlink escape outside .tmp/idts-110')
  const actual = realPathWithMissingTail(lexical)
  if (!isWithin(actual, actualOutputRoot)) fail('outputPath has a symlink escape outside .tmp/idts-110')
  return actual
}

function writeAtomicBatch ({ runId, sourceBaselineSha, catalogSha, approvalReference, results }, outputPath) {
  const safeRunId = requireNonEmptyString(runId, 'runId')
  const safeBaseline = assertBaseline(sourceBaselineSha)
  const safeCatalogSha = requireNonEmptyString(catalogSha, 'catalogSha')
  if (!/^[a-f0-9]{64}$/i.test(safeCatalogSha)) fail('catalogSha must be a 64-character SHA-256')
  if (!isObject(approvalReference)) fail('approvalReference is required')
  const safeApproval = sanitizeValue(approvalReference, 'approvalReference')
  if (safeApproval.mergeSha !== BASELINE_SHA) fail('approvalReference.mergeSha must equal the execution baseline')
  if (!Array.isArray(results) || results.length === 0) fail('results must be a non-empty array')
  const safeResults = results.map(result => validateAtomicResult(result))
  const keys = safeResults.map(result => result.caseKey)
  if (new Set(keys).size !== keys.length) fail('results contain a duplicate caseKey')
  const startedAt = safeResults.map(result => Date.parse(result.startedAt)).reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY)
  const completedAt = safeResults.map(result => Date.parse(result.completedAt)).reduce((max, value) => Math.max(max, value), 0)
  const batch = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    runId: safeRunId,
    sourceBaselineSha: safeBaseline,
    catalogSha: safeCatalogSha,
    approvalReference: safeApproval,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date(completedAt).toISOString(),
    results: safeResults,
    totals: Object.fromEntries(RESULT_STATUSES.map(status => [status, safeResults.filter(result => result.status === status).length]))
  }
  assertNoUndefined(batch)
  assertSafeValue(batch)
  const target = atomicOutputPath(outputPath)
  fs.writeFileSync(target, `${JSON.stringify(batch, null, 2)}\n`, 'utf8')
  return batch
}

module.exports = {
  BASELINE_SHA,
  MARKER_PREFIX,
  RESULT_STATUSES,
  MAX_SAFE_STRING_LENGTH,
  MAX_SAFE_ARRAY_ITEMS,
  MAX_SAFE_OBJECT_PROPERTIES,
  MAX_SAFE_DEPTH,
  redactText,
  parseAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  validateAtomicResult,
  formatAtomicMarker,
  writeAtomicBatch,
  sanitizeValue,
  assertSafeValue
}
