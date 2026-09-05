'use strict'

const assert = require('node:assert/strict')
const Ajv = require('ajv')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const zlib = require('node:zlib')

const {
  BASELINE_SHA,
  MARKER_PREFIX,
  parseAtomicMarker,
  redactText,
  readAtomicOptions,
  runAtomicCase,
  validateAtomicResult,
  writeAtomicBatch,
  formatAtomicMarker
} = require('./idts110-atomic-runner')
const orchestrator = require('./run-idts110-new-cases')
const schemaPath = path.join(__dirname, '../../docs/qa/idts-110-atomic-result.schema.json')

const sourceTrace = [{ file: 'srv/notification/inbox.js', symbol: 'searchMyNotifications' }]

function pngCrc32 (buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk (type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.length)
  chunk.writeUInt32BE(data.length, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(pngCrc32(chunk.subarray(4, 8 + data.length)), 8 + data.length)
  return chunk
}

function makePng ({ width = 1, height = 1, bitDepth = 8, colorType = 6, scanlines = [0, 0, 0, 0, 0], interlace = 0 }) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = bitDepth
  ihdr[9] = colorType
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = interlace
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.from(scanlines))),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

function definition (overrides = {}) {
  const current = {
    caseId: 'IDTS110-F232',
    mentorNumber: 234,
    title: 'My Notifications search is caller-scoped and stably ordered',
    assertionId: 'IDTS110-F232-A1',
    preconditions: 'Use an isolated local fixture.',
    input: 'Search one caller-owned notification set.',
    expectedResult: 'expected result',
    plannedAssertions: ['expected result'],
    plannedTestFile: 'scripts/qa/test-my-notifications-service.js',
    sourceTrace,
    evidenceRequirements: [
      'case-specific atomic result record',
      'before-state, after-state, and reload/readback snapshots'
    ],
    acceptanceMode: 'PROGRAMMATIC_ATOMIC',
    reviewStatus: 'PENDING_DONHV_REVIEW',
    ...overrides
  }
  if (!Object.hasOwn(overrides, 'assertionId')) current.assertionId = `${current.caseId}-A1`
  return current
}

async function passedResult (overrides = {}) {
  return runAtomicCase({
    definition: definition(overrides),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: 'expected result',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
}

async function main () {
  assert.equal(BASELINE_SHA, '6eb6f73840d7150598a993f8656d2b44e5b0cd4b')
  assert.equal(fs.existsSync(schemaPath), true, 'atomic result JSON schema is required')
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
  const validateSchema = new Ajv().compile(schema)
  assert.equal(schema.$id, 'idts-110-atomic-result.schema.json')
  assert.equal(schema.properties.sourceBaselineSha.const, BASELINE_SHA)
  assert.deepEqual(schema.properties.status.enum, ['PASS', 'FAIL', 'BLOCKED', 'HELD', 'NOT_RUN'])
  assert.equal(schema.required.includes('actualResult'), true)
  assert.equal(schema.required.includes('assertionPassed'), true)
  assert.equal(schema.required.includes('beforeState'), true)
  assert.equal(schema.required.includes('runtimeEvidence'), true)
  const stateSchema = schema.$defs.safeObject
  assert.equal(typeof stateSchema.maxProperties, 'number')
  assert.equal(typeof stateSchema.propertyNames, 'object')
  assert.equal(stateSchema.maxProperties, 32)
  assert.equal(schema.$defs.safeValue.maxLength, 2000)
  assert.equal(schema.$defs.safeArray.maxItems, 64)
  assert.match(schema.$defs.safeObject.$comment, /maxDepth=4/)
  assert.deepEqual(parseAtomicMarker([
    'noise',
    `${MARKER_PREFIX}{"caseKey":"IDTS110-F232","assertionId":"IDTS110-F232-A1","status":"PASS"}`
  ]), {
    caseKey: 'IDTS110-F232',
    assertionId: 'IDTS110-F232-A1',
    status: 'PASS'
  })
  assert.throws(() => parseAtomicMarker([
    `${MARKER_PREFIX}{"caseKey":"A"}`,
    `${MARKER_PREFIX}{"caseKey":"B"}`
  ]), /exactly one/)
  assert.throws(() => parseAtomicMarker(['suite PASS']), /exactly one/)

  const redacted = redactText('Bearer abc password=secret postgresql://u:p@h/db alice@example.com')
  assert.doesNotMatch(redacted, /abc|secret|postgresql|alice@example\.com/i)
  const escapedSecret = '\\{\\"password\\":\\"secret\\"\\}'
  assert.doesNotMatch(redactText(escapedSecret), /password|secret/i, 'escaped JSON assignments must be redacted')

  assert.deepEqual(readAtomicOptions([
    '--idts110-case=IDTS110-F232',
    `--baseline=${BASELINE_SHA}`,
    '--executor=Codex-agent-assisted',
    '--mode=local',
    '--output=.tmp/result.json'
  ]), {
    caseKey: 'IDTS110-F232',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    mode: 'local',
    outputPath: '.tmp/result.json'
  })
  assert.throws(() => readAtomicOptions(['--idts110-case=IDTS110-F232', '--baseline=bad', '--executor=agent']), /baseline/i)
  assert.throws(() => readAtomicOptions([`--idts110-case=IDTS110-F232`, `--baseline=${BASELINE_SHA}`]), /executor/i)

  const result = await passedResult()
  assert.equal(result.status, 'PASS')
  assert.equal(result.assertionPassed, true)
  assert.equal(result.caseKey, 'IDTS110-F232')
  assert.equal(result.assertionId, 'IDTS110-F232-A1')
  assert.equal(result.sourceBaselineSha, BASELINE_SHA)
  assert.equal(result.deployedSha, null)
  assert.equal(result.reviewStatus, 'PENDING_DONHV_REVIEW')
  assert.ok(Date.parse(result.startedAt) <= Date.parse(result.completedAt))
  assert.doesNotMatch(JSON.stringify(result), /undefined|MAPPING_ONLY|password=|Bearer\s+abc|postgresql:\/\//i)
  validateAtomicResult(result)
  assert.equal(validateSchema(result), true, 'the canonical result must satisfy the JSON schema')
  assert.equal(validateSchema({ ...result, status: 'PASS', assertionPassed: false }), false, 'schema must reject PASS without assertionPassed=true')
  assert.equal(validateSchema({ ...result, authorizedFixture: true, deployedSha: null }), false, 'schema must reject authorized fixture without deployed SHA')
  assert.equal(validateSchema({ ...result, authorizedFixture: false, deployedSha: 'a'.repeat(40) }), false, 'schema must reject an unbound deployed SHA')
  assert.equal(validateSchema({ ...result, status: 'PASS', evidenceKind: 'BTP_INTEGRATION', authorizedFixture: false, deployedSha: null }), false, 'schema must reject an external PASS without authorization')
  assert.equal(validateSchema({ ...result, status: 'FAIL', assertionPassed: false, evidenceKind: 'BTP_INTEGRATION', authorizedFixture: false, deployedSha: null }), false, 'schema must reject any unbound BTP evidence kind')
  assert.equal(validateSchema({ ...result, testFile: 'scripts/qa/../evil.js' }), false, 'schema must reject parent traversal in testFile')
  assert.equal(validateSchema({ ...result, status: 'PASS', assertionPassed: true, actualResult: 'not expected' }), true, 'schema leaves actual/expected equality to the runtime invariant')
  assert.throws(() => validateAtomicResult({ ...result, status: 'PASS', assertionPassed: true, actualResult: 'not expected' }), /actualResult|expectedResult|match/i, 'runtime must reject PASS when actualResult differs from expectedResult')
  assert.throws(() => validateAtomicResult({ ...result, evidenceKind: 'BTP_INTEGRATION', authorizedFixture: false, deployedSha: null }), /BTP|authorized|evidenceKind/i, 'runtime must bind BTP evidence to an authorized fixture')
  assert.throws(() => validateAtomicResult({ ...result, status: 'FAIL', assertionPassed: false, evidenceKind: 'BTP_INTEGRATION', authorizedFixture: false, deployedSha: null }), /BTP|authorized|evidenceKind/i, 'runtime must bind BTP evidence to an authorized fixture for non-PASS results')
  assert.throws(() => validateAtomicResult({ ...result, evidenceKind: 'LOCAL_ATOMIC', authorizedFixture: true, deployedSha: 'a'.repeat(40), runtimeEvidence: { deployedSha: 'a'.repeat(40), checked: true } }), /BTP|authorized|evidenceKind/i, 'runtime must bind authorized fixtures to BTP evidence')
  assert.equal(validateSchema({ ...result, evidenceIds: ['IDTS110-F232-RESULT', 'IDTS110-F232-RESULT'] }), false, 'schema must reject duplicate evidence IDs')
  assert.throws(() => validateAtomicResult({ ...result, evidenceIds: ['IDTS110-F232-RESULT', 'IDTS110-F232-RESULT'] }), /duplicate|unique/i, 'runtime must reject duplicate evidence IDs')
  assert.throws(() => validateAtomicResult({ ...result, beforeState: { rows: Number.NaN } }), /finite|number/i, 'runtime must reject non-finite numbers before serialization')
  await assert.rejects(() => runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: 'expected result',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT', 'IDTS110-F232-RESULT']
    })
  }), /duplicate|unique/i, 'atomic execution must not silently deduplicate evidence IDs')
  assert.equal(validateSchema({ ...result, evidenceKind: 'BTP_INTEGRATION', authorizedFixture: true, deployedSha: 'a'.repeat(40), runtimeEvidence: { deployedSha: 'a'.repeat(40), checked: true } }), true, 'schema must accept a structurally authorized external result')

  const implicitPass = await runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      status: 'PASS',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
  assert.equal(implicitPass.status, 'FAIL', 'caller-supplied PASS without explicit assertion success must fail')
  assert.notEqual(implicitPass.actualResult, implicitPass.expectedResult)

  const encodedSecrets = await runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: 'expected result',
      beforeState: { encoded: '{"password":"secret","nested":{"token":"abc"}}', nested: { password: 'secret', email: 'private@example.test' } },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
  assert.equal(encodedSecrets.status, 'PASS')
  assert.doesNotMatch(JSON.stringify(encodedSecrets), /secret|abc|private@example\.test/i)
  assert.doesNotMatch(formatAtomicMarker({ ...result, beforeState: { nested: { password: 'secret' } } }), /secret/i)

  const mismatch = await runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: 'different result',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
  assert.equal(mismatch.status, 'FAIL')

  const missingEvidence = await runAtomicCase({
    definition: definition({
      acceptanceMode: 'UI_RUNTIME_VISUAL',
      evidenceRequirements: ['case-specific atomic result record', 'browser/runtime rendered UI screenshot']
    }),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({ assertionPassed: true, actualResult: 'expected result', evidenceIds: ['IDTS110-F232-RESULT'] })
  })
  assert.equal(missingEvidence.status, 'FAIL')
  assert.match(missingEvidence.actualResult, /screenshot|evidence/i)

  const blocked = await runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => {
      const error = new Error('authorized fixture unavailable')
      error.status = 'BLOCKED'
      throw error
    }
  })
  assert.equal(blocked.status, 'BLOCKED')
  assert.match(blocked.actualResult, /fixture unavailable/)

  const external = await runAtomicCase({
    definition: definition({ environment: 'BTP', acceptanceMode: 'PROGRAMMATIC_ATOMIC' }),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: 'expected result',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      runtimeEvidence: { checked: true },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
  assert.equal(external.status, 'BLOCKED', 'BTP/provider/live cases need an authorized fixture and deployed proof')
  assert.equal(external.evidenceKind, 'LOCAL_ATOMIC', 'unauthorized external attempts are blocked without claiming BTP integration evidence')

  const externalSha = 'a'.repeat(40)
  const authorizedExternal = await runAtomicCase({
    definition: definition({ environment: 'BTP', acceptanceMode: 'PROGRAMMATIC_ATOMIC' }),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      authorizedFixture: true,
      deployedSha: externalSha,
      actualResult: 'expected result',
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      runtimeEvidence: { deployedSha: externalSha, checked: true },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  })
  assert.equal(authorizedExternal.status, 'PASS')

  await assert.rejects(() => runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      actualResult: undefined,
      beforeState: { rows: 1 },
      afterState: { rows: 1 },
      reloadState: { rows: 1 },
      evidenceIds: ['IDTS110-F232-RESULT']
    })
  }), /undefined/i)

  assert.throws(() => validateAtomicResult({ ...result, status: 'MAPPING_ONLY' }), /MAPPING_ONLY|status/i)
  assert.throws(() => validateAtomicResult({ ...result, sourceBaselineSha: '0'.repeat(40) }), /baseline/i)
  assert.throws(() => validateAtomicResult({ ...result, beforeState: { escaped: escapedSecret } }), /secret|sensitive|sanit/i)

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-atomic-contract-'))
  const batchPath = path.join(process.cwd(), '.tmp', 'idts-110', 'batch-contract.json')
  const batch = writeAtomicBatch({
    runId: 'idts110-contract-run',
    sourceBaselineSha: BASELINE_SHA,
    catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
    approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
    results: [result]
  }, batchPath)
  assert.equal(batch.results.length, 1)
  assert.deepEqual(JSON.parse(fs.readFileSync(batchPath, 'utf8')), batch)

  const atomicWritePath = path.join(process.cwd(), '.tmp', 'idts-110', 'atomic-write-contract.json')
  const realWriteSync = fs.writeSync
  let partialWriteCalls = 0
  fs.writeSync = (fd, buffer, offset, length, position) => {
    partialWriteCalls += 1
    return realWriteSync(fd, buffer, offset, Math.max(1, Math.floor(length / 2)), position)
  }
  let partialBatch
  try {
    partialBatch = writeAtomicBatch({
      runId: 'idts110-partial-write-contract',
      sourceBaselineSha: BASELINE_SHA,
      catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
      approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
      results: [result]
    }, atomicWritePath)
  } finally {
    fs.writeSync = realWriteSync
  }
  assert.ok(partialWriteCalls > 1, 'batch writing must handle a short write to the contained temp file')
  assert.deepEqual(JSON.parse(fs.readFileSync(atomicWritePath, 'utf8')), partialBatch)

  const realRenameSync = fs.renameSync
  let renameAttempts = 0
  fs.renameSync = () => {
    renameAttempts += 1
    throw new Error('simulated atomic rename failure')
  }
  try {
    assert.throws(() => writeAtomicBatch({
      runId: 'idts110-rename-failure-contract',
      sourceBaselineSha: BASELINE_SHA,
      catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
      approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
      results: [result]
    }, atomicWritePath), /rename failure/i)
  } finally {
    fs.renameSync = realRenameSync
  }
  assert.equal(renameAttempts, 1, 'batch writes must finish through one atomic rename')
  assert.deepEqual(JSON.parse(fs.readFileSync(atomicWritePath, 'utf8')), partialBatch, 'rename failure must preserve the prior destination')
  assert.equal(fs.readdirSync(path.dirname(atomicWritePath)).some(name => name.includes('atomic-write-contract') && name !== path.basename(atomicWritePath)), false, 'failed atomic writes must remove temporary files')

  assert.throws(() => writeAtomicBatch({
    runId: 'idts110-contract-run',
    sourceBaselineSha: BASELINE_SHA,
    catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
    approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
    results: [result]
  }, path.join(os.tmpdir(), 'idts110-outside-batch.json')), /boundary/i)
  assert.throws(() => writeAtomicBatch({
    runId: 'idts110-contract-run',
    sourceBaselineSha: BASELINE_SHA,
    catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
    approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
    results: [result, result]
  }, path.join(tempDirectory, 'duplicate.json')), /duplicate/i)
  const outputEscapePath = path.join(process.cwd(), '.tmp', 'idts-110', 'escape-link')
  let outputEscapeCreated = false
  try {
    fs.symlinkSync(tempDirectory, outputEscapePath, 'junction')
    outputEscapeCreated = true
  } catch {}
  if (outputEscapeCreated) {
    try {
      assert.throws(() => writeAtomicBatch({
        runId: 'idts110-contract-run',
        sourceBaselineSha: BASELINE_SHA,
        catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
        approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
        results: [result]
      }, path.join(outputEscapePath, 'escape.json')), /symlink|canonical|boundary/i)
    } finally {
      fs.unlinkSync(outputEscapePath)
    }
  }

  const outputInRepoRedirect = path.join(process.cwd(), '.tmp', 'idts-110', 'in-repo-output-redirect')
  let outputInRepoRedirectCreated = false
  try {
    fs.symlinkSync(path.join(process.cwd(), '.tmp', 'idts-110'), outputInRepoRedirect, 'junction')
    outputInRepoRedirectCreated = true
  } catch {}
  if (outputInRepoRedirectCreated) {
    try {
      assert.throws(() => orchestrator.resolveOutputPath(path.join(outputInRepoRedirect, 'in-repo.json'), process.cwd()), /reparse|symlink|canonical|redirect|boundary/i)
    } finally {
      fs.unlinkSync(outputInRepoRedirect)
    }
  }

  const repositoryRedirect = path.join(process.cwd(), '.tmp', 'idts-110', 'repository-redirect')
  let repositoryRedirectCreated = false
  try {
    fs.symlinkSync(process.cwd(), repositoryRedirect, 'junction')
    repositoryRedirectCreated = true
  } catch {}
  if (repositoryRedirectCreated) {
    try {
      assert.throws(() => orchestrator.resolveOutputPath('.tmp/idts-110/repository-redirect.json', repositoryRedirect), /reparse|symlink|canonical|redirect|boundary/i)
    } finally {
      fs.unlinkSync(repositoryRedirect)
    }
  }

  const runnerInRepoRedirect = path.join(process.cwd(), 'scripts', 'qa', 'idts110-runner-redirect')
  let runnerInRepoRedirectCreated = false
  try {
    fs.symlinkSync(path.join(process.cwd(), 'scripts', 'qa'), runnerInRepoRedirect, 'junction')
    runnerInRepoRedirectCreated = true
  } catch {}
  if (runnerInRepoRedirectCreated) {
    try {
      await assert.rejects(() => orchestrator.runOneCase(definition({ plannedTestFile: 'scripts/qa/idts110-runner-redirect/test.js' }), {
        baselineSha: BASELINE_SHA,
        executor: 'Codex-agent-assisted',
        outputPath: null,
        root: process.cwd(),
        timeoutMs: 1000,
        spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
      }), /reparse|symlink|canonical|redirect|outside/i)
    } finally {
      fs.unlinkSync(runnerInRepoRedirect)
    }
  }

  const approvedDefinitions = orchestrator.loadNewDefinitions()
  const definitions = ['IDTS110-F232', 'IDTS110-F233', 'IDTS110-F234', 'IDTS110-F235']
    .map(caseKey => approvedDefinitions.find(current => current.caseId === caseKey))
  const childPass = await runAtomicCase({
    definition: definitions[0], assertionId: 'IDTS110-F232-A1', baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted', execute: async () => ({ assertionPassed: true, actualResult: definitions[0].expectedResult, beforeState: { rows: 1 }, afterState: { rows: 1 }, reloadState: { rows: 1 }, evidenceIds: ['IDTS110-F232-RESULT'] })
  })
  const childFail = await runAtomicCase({
    definition: definitions[1], assertionId: 'IDTS110-F233-A1', baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted', execute: async () => ({ assertionPassed: true, actualResult: 'different', beforeState: { rows: 1 }, afterState: { rows: 2 }, reloadState: { rows: 2 }, evidenceIds: ['IDTS110-F233-RESULT'] })
  })
  const calls = []
  const orchestratedPath = path.join(process.cwd(), '.tmp', 'idts-110', 'orchestrated-contract.json')
  const orchestrated = await orchestrator.runNewCases({
    definitions,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    outputPath: orchestratedPath,
    runId: 'idts110-orchestrator-contract',
    catalogSha: orchestrator.catalogSha(),
    approvalReference: { pullRequest: 388, mergeSha: BASELINE_SHA },
    spawnSync: (file, args) => {
      calls.push({ file, args })
      const caseKey = args.find(value => value.startsWith('--idts110-case=')).slice('--idts110-case='.length)
      if (caseKey === 'IDTS110-F232') return { status: 0, stdout: `${formatAtomicMarker(childPass)}\n`, stderr: '' }
      if (caseKey === 'IDTS110-F233') return { status: 1, stdout: `${formatAtomicMarker(childFail)}\n`, stderr: '' }
      if (caseKey === 'IDTS110-F234') return { status: 0, stdout: 'broad suite PASS\n', stderr: '' }
      return { status: null, stdout: '', stderr: '', error: Object.assign(new Error('runner missing'), { code: 'ENOENT' }) }
    }
  })
  assert.equal(calls.length, definitions.length)
  assert.equal(orchestrated.results.length, definitions.length)
  assert.deepEqual(orchestrated.results.map(item => item.status), ['PASS', 'FAIL', 'FAIL', 'BLOCKED'])
  assert.ok(calls.every(call => call.args.includes(`--baseline=${BASELINE_SHA}`)))
  assert.ok(calls.every(call => call.args.some(arg => arg.startsWith('--idts110-case='))))
  assert.doesNotMatch(JSON.stringify(orchestrated), /broad suite PASS.*status.*PASS/i)

  const forged = { ...childPass, expectedResult: 'forged expected result', actualResult: 'forged expected result' }
  const forgedBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(forged)}\n`, stderr: '' })
  })
  assert.equal(forgedBatch.results[0].status, 'FAIL', 'marker expected/actual must be bound to the catalog definition')

  const heldBatch = { results: [{ status: 'HELD' }] }
  const notRunBatch = { results: [{ status: 'NOT_RUN' }] }
  assert.equal(orchestrator.exitCodeForBatch({ results: [{ status: 'PASS' }] }), 0)
  assert.equal(orchestrator.exitCodeForBatch(heldBatch), 1)
  assert.equal(orchestrator.exitCodeForBatch(notRunBatch), 1)

  await assert.rejects(() => orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    catalogSha: 'f'.repeat(64),
    spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
  }), /catalog/i, 'caller-supplied catalog hash must not override the approved file')

  const alteredCatalogPath = path.join(tempDirectory, 'altered-catalog.json')
  const alteredCatalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  alteredCatalog.extensionSummary.total = 279
  fs.writeFileSync(alteredCatalogPath, `${JSON.stringify(alteredCatalog)}\n`)
  assert.throws(() => orchestrator.loadNewDefinitions(alteredCatalogPath), /approved|hash|278/i)

  assert.throws(() => orchestrator.resolveOutputPath(path.join(os.tmpdir(), 'outside.json'), process.cwd()), /boundary/i)
  const secretName = 'IDTS110_ATOMIC_CONTRACT_SECRET'
  process.env[secretName] = 'not-forwarded'
  let childEnv
  await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: (file, args, childOptions) => {
      childEnv = childOptions.env
      return { status: 0, stdout: 'suite PASS', stderr: '' }
    }
  })
  delete process.env[secretName]
  assert.equal(Object.hasOwn(childEnv, secretName), false, 'child environment must not inherit arbitrary process secrets')

  const malformedDefinitions = [
    definition({ caseId: 'IDTS110-F232', title: undefined }),
    definition({ caseId: 'IDTS110-F233', mentorNumber: 235, title: undefined })
  ]
  await assert.rejects(() => orchestrator.runNewCases({
    definitions: malformedDefinitions,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: (file, args) => args.includes('--idts110-case=IDTS110-F232')
      ? { status: 0, stdout: `${formatAtomicMarker(childPass)}\n`, stderr: '' }
      : { status: 0, stdout: 'suite PASS', stderr: '' }
  }), /deep-equal|approved/i, 'known malformed definitions must be rejected rather than canonicalized')

  await assert.rejects(() => orchestrator.runNewCases({
    definitions: [definition({ caseId: 'IDTS110-CUSTOM1' })],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
  }), /approved|unknown/i, 'custom or unknown case keys must be rejected')
  await assert.rejects(() => orchestrator.runNewCases({
    definitions: [null],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
  }), /approved|unknown|definition/i, 'null definitions must be rejected')
  await assert.rejects(() => orchestrator.runNewCases({
    definitions: [{ ...definitions[0], title: 'forged known-case definition' }],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
  }), /approved|exact|definition/i, 'known case definitions must be deep-equal to the approved definition')

  const missingSnapshots = { ...childPass, beforeState: null, afterState: null, reloadState: null }
  const snapshotBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(missingSnapshots)}\n`, stderr: '' })
  })
  assert.equal(snapshotBatch.results[0].status, 'FAIL', 'orchestrator must independently require catalog persistence snapshots')

  const visualDefinition = approvedDefinitions.find(current => current.caseId === 'IDTS110-F224')
  const visualDirectory = path.join(process.cwd(), '.tmp', 'idts-110', 'contract-assets')
  const visualCaseDirectory = path.join(visualDirectory, 'IDTS110-F224')
  const screenshotPath = path.join(visualCaseDirectory, 'result.png')
  const manifestPath = path.join(visualCaseDirectory, 'case-manifest.json')
  const screenshotBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  const atomicOutputRoot = path.join(process.cwd(), '.tmp', 'idts-110')
  const relativeScreenshotPath = path.relative(atomicOutputRoot, screenshotPath).replace(/\\/g, '/')
  const relativeManifestPath = path.relative(atomicOutputRoot, manifestPath).replace(/\\/g, '/')
  fs.mkdirSync(visualCaseDirectory, { recursive: true })
  fs.writeFileSync(screenshotPath, screenshotBytes)
  const screenshotSha256 = crypto.createHash('sha256').update(screenshotBytes).digest('hex')
  const writeVisualManifest = hash => fs.writeFileSync(manifestPath, `${JSON.stringify({
    caseKey: 'IDTS110-F224',
    evidenceId: 'IDTS110-F224-VISUAL',
    screenshotPath: relativeScreenshotPath,
    screenshotSha256: hash
  })}\n`)
  writeVisualManifest(screenshotSha256)
  const visualResult = await runAtomicCase({
    definition: visualDefinition,
    assertionId: visualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: visualDefinition.expectedResult,
      runtimeEvidence: { screenshotPath: relativeScreenshotPath, screenshotSha256, manifestPath: relativeManifestPath },
      evidenceIds: ['IDTS110-F224-RESULT', 'IDTS110-F224-VISUAL']
    })
  })

  const runVisualBytes = async bytes => {
    fs.writeFileSync(screenshotPath, bytes)
    const hash = crypto.createHash('sha256').update(bytes).digest('hex')
    writeVisualManifest(hash)
    return runAtomicCase({
      definition: visualDefinition,
      assertionId: visualDefinition.assertionId,
      baselineSha: BASELINE_SHA,
      executor: 'Codex-agent-assisted',
      execute: async () => ({
        assertionPassed: true,
        actualResult: visualDefinition.expectedResult,
        runtimeEvidence: { screenshotPath: relativeScreenshotPath, screenshotSha256: hash, manifestPath: relativeManifestPath },
        evidenceIds: ['IDTS110-F224-RESULT', 'IDTS110-F224-VISUAL']
      })
    })
  }

  const malformedRgba = await runVisualBytes(makePng({ colorType: 6, scanlines: [0] }))
  assert.equal(malformedRgba.status, 'FAIL', 'a 1x1 RGBA PNG must contain the complete filtered scanline')
  const illegalColorDepth = await runVisualBytes(makePng({ colorType: 2, bitDepth: 4, scanlines: [0, 0] }))
  assert.equal(illegalColorDepth.status, 'FAIL', 'PNG must reject illegal color-type/bit-depth combinations')
  const invalidFilter = await runVisualBytes(makePng({ colorType: 6, scanlines: [5, 0, 0, 0, 0] }))
  assert.equal(invalidFilter.status, 'FAIL', 'PNG must reject filter bytes outside 0 through 4')
  const truncatedScanline = await runVisualBytes(makePng({ colorType: 6, scanlines: [0, 0, 0, 0] }))
  assert.equal(truncatedScanline.status, 'FAIL', 'PNG must reject truncated scanline data')
  const extraScanline = await runVisualBytes(makePng({ colorType: 6, scanlines: [0, 0, 0, 0, 0, 0] }))
  assert.equal(extraScanline.status, 'FAIL', 'PNG must reject extra scanline data')
  const unreasonableDimensions = await runVisualBytes(makePng({ width: 100000, scanlines: [0] }))
  assert.equal(unreasonableDimensions.status, 'FAIL', 'PNG must reject unreasonable dimensions/output bounds')

  fs.writeFileSync(screenshotPath, Buffer.from('not a PNG'))
  const invalidPngSha256 = crypto.createHash('sha256').update(fs.readFileSync(screenshotPath)).digest('hex')
  writeVisualManifest(invalidPngSha256)
  const invalidPngResult = await runAtomicCase({
    definition: visualDefinition,
    assertionId: visualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: visualDefinition.expectedResult,
      runtimeEvidence: { screenshotPath: relativeScreenshotPath, screenshotSha256: invalidPngSha256, manifestPath: relativeManifestPath },
      evidenceIds: ['IDTS110-F224-RESULT', 'IDTS110-F224-VISUAL']
    })
  })
  assert.equal(invalidPngResult.status, 'FAIL', 'visual proof must validate PNG signature and basic structure')

  fs.writeFileSync(screenshotPath, screenshotBytes)
  writeVisualManifest(screenshotSha256)
  fs.unlinkSync(manifestPath)
  const missingManifestResult = await runAtomicCase({
    definition: visualDefinition,
    assertionId: visualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: visualDefinition.expectedResult,
      runtimeEvidence: { screenshotPath: relativeScreenshotPath, screenshotSha256, manifestPath: relativeManifestPath },
      evidenceIds: ['IDTS110-F224-RESULT', 'IDTS110-F224-VISUAL']
    })
  })
  assert.equal(missingManifestResult.status, 'FAIL', 'visual proof must use a case-bound manifest')
  writeVisualManifest(screenshotSha256)

  const secondScreenshotPath = path.join(visualCaseDirectory, 'runtime.png')
  const secondScreenshotBytes = fs.readFileSync(path.join(process.cwd(), 'docs', 'diagrams', 'rendered', 'png', '07-developer-review.png'))
  fs.writeFileSync(secondScreenshotPath, secondScreenshotBytes)
  const secondScreenshotSha256 = crypto.createHash('sha256').update(fs.readFileSync(secondScreenshotPath)).digest('hex')
  const crossPairResult = await runAtomicCase({
    definition: visualDefinition,
    assertionId: visualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: visualDefinition.expectedResult,
      runtimeEvidence: {
        screenshotPath: relativeScreenshotPath,
        screenshotSha256: secondScreenshotSha256,
        alternateScreenshotPath: path.relative(atomicOutputRoot, secondScreenshotPath).replace(/\\/g, '/'),
        alternateScreenshotSha256: screenshotSha256,
        manifestPath: relativeManifestPath
      },
      evidenceIds: ['IDTS110-F224-RESULT', 'IDTS110-F224-VISUAL']
    })
  })
  assert.equal(crossPairResult.status, 'FAIL', 'visual proof must not pair a path with another screenshot hash')

  const visualBatch = await orchestrator.runNewCases({
    definitions: [visualDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${MARKER_PREFIX}${JSON.stringify({ ...visualResult, runtimeEvidence: null })}\n`, stderr: '' })
  })
  assert.equal(visualBatch.results[0].status, 'FAIL', 'orchestrator must independently require rendered screenshot proof')

  const secondVisualDefinition = approvedDefinitions.find(current => current.caseId === 'IDTS110-F237')
  const secondVisualDirectory = path.join(visualDirectory, 'IDTS110-F237')
  const secondVisualPath = path.join(secondVisualDirectory, 'result.png')
  const secondVisualManifest = path.join(secondVisualDirectory, 'case-manifest.json')
  fs.mkdirSync(secondVisualDirectory, { recursive: true })
  fs.writeFileSync(secondVisualPath, screenshotBytes)
  const secondVisualRelativePath = path.relative(atomicOutputRoot, secondVisualPath).replace(/\\/g, '/')
  const secondVisualRelativeManifest = path.relative(atomicOutputRoot, secondVisualManifest).replace(/\\/g, '/')
  fs.writeFileSync(secondVisualManifest, `${JSON.stringify({
    caseKey: 'IDTS110-F237',
    evidenceId: 'IDTS110-F237-VISUAL',
    screenshotPath: secondVisualRelativePath,
    screenshotSha256
  })}\n`)
  const secondVisualResult = await runAtomicCase({
    definition: secondVisualDefinition,
    assertionId: secondVisualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: secondVisualDefinition.expectedResult,
      runtimeEvidence: { screenshotPath: secondVisualRelativePath, screenshotSha256, manifestPath: secondVisualRelativeManifest },
      evidenceIds: ['IDTS110-F237-RESULT', 'IDTS110-F237-VISUAL']
    })
  })
  fs.rmSync(visualCaseDirectory, { recursive: true, force: true })
  fs.rmSync(secondVisualDirectory, { recursive: true, force: true })
  const reuseRunId = 'idts110-reuse-run'
  const reuseNonce = 'idts110-reuse-nonce'
  const reusedScreenshotBatch = await orchestrator.runNewCases({
    definitions: [visualDefinition, secondVisualDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    runId: reuseRunId,
    nonce: reuseNonce,
    spawnSync: (file, args) => {
      const isFirst = args.some(value => value === '--idts110-case=IDTS110-F224')
      const currentDefinition = isFirst ? visualDefinition : secondVisualDefinition
      const currentDirectory = isFirst ? visualCaseDirectory : secondVisualDirectory
      const currentScreenshotPath = isFirst ? screenshotPath : secondVisualPath
      const currentManifestPath = isFirst ? manifestPath : secondVisualManifest
      const currentRelativeScreenshotPath = isFirst ? relativeScreenshotPath : secondVisualRelativePath
      const currentRelativeManifestPath = isFirst ? relativeManifestPath : secondVisualRelativeManifest
      const currentResult = isFirst ? visualResult : secondVisualResult
      const createdAt = new Date().toISOString()
      const metadata = {
        caseKey: currentDefinition.caseId,
        runId: reuseRunId,
        nonce: reuseNonce,
        baseline: BASELINE_SHA,
        createdAt,
        pathMetadata: { caseKey: currentDefinition.caseId, runId: reuseRunId, nonce: reuseNonce, baseline: BASELINE_SHA, createdAt }
      }
      fs.mkdirSync(currentDirectory, { recursive: true })
      fs.writeFileSync(currentScreenshotPath, screenshotBytes)
      fs.writeFileSync(currentManifestPath, `${JSON.stringify({ ...metadata, evidenceId: `${currentDefinition.caseId}-VISUAL`, screenshotPath: currentRelativeScreenshotPath, screenshotSha256 })}\n`)
      const marker = {
        ...currentResult,
        startedAt: createdAt,
        completedAt: createdAt,
        runtimeEvidence: { ...metadata, screenshotPath: currentRelativeScreenshotPath, screenshotSha256, manifestPath: currentRelativeManifestPath }
      }
      return { status: 0, stdout: `${formatAtomicMarker(marker)}\n`, stderr: '' }
    }
  })
  assert.deepEqual(reusedScreenshotBatch.results.map(item => item.status), ['PASS', 'FAIL'], 'orchestrator must reject screenshot reuse across case results')

  const invocationDefinition = approvedDefinitions.find(current => current.caseId === 'IDTS110-F238')
  const invocationCaseDirectory = path.join(visualDirectory, invocationDefinition.caseId)
  const invocationScreenshotPath = path.join(invocationCaseDirectory, 'result.png')
  const invocationManifestPath = path.join(invocationCaseDirectory, 'case-manifest.json')
  const invocationRelativeScreenshotPath = path.relative(atomicOutputRoot, invocationScreenshotPath).replace(/\\/g, '/')
  const invocationRelativeManifestPath = path.relative(atomicOutputRoot, invocationManifestPath).replace(/\\/g, '/')
  const invocationMetadata = ({ runId, nonce, createdAt }) => ({
    caseKey: invocationDefinition.caseId,
    runId,
    nonce,
    baseline: BASELINE_SHA,
    createdAt,
    pathMetadata: { caseKey: invocationDefinition.caseId, runId, nonce, baseline: BASELINE_SHA, createdAt }
  })
  const invocationMarker = ({ runId, nonce, createdAt, screenshotSha256 }) => ({
    ...visualResult,
    caseKey: invocationDefinition.caseId,
    mentorNumber: invocationDefinition.mentorNumber,
    assertionId: invocationDefinition.assertionId,
    title: invocationDefinition.title,
    testFile: invocationDefinition.plannedTestFile,
    sourceTrace: invocationDefinition.sourceTrace,
    expectedResult: invocationDefinition.expectedResult,
    actualResult: invocationDefinition.expectedResult,
    startedAt: createdAt,
    completedAt: createdAt,
    testCommand: `node ${invocationDefinition.plannedTestFile} --idts110-case=${invocationDefinition.caseId} --baseline=${BASELINE_SHA}`,
    runtimeEvidence: {
      ...invocationMetadata({ runId, nonce, createdAt }),
      screenshotPath: invocationRelativeScreenshotPath,
      screenshotSha256,
      manifestPath: invocationRelativeManifestPath
    },
    evidenceIds: [`${invocationDefinition.caseId}-RESULT`, `${invocationDefinition.caseId}-VISUAL`]
  })
  fs.rmSync(invocationCaseDirectory, { recursive: true, force: true })
  let invocationArgs
  let invocationEnv
  const freshInvocationBatch = await orchestrator.runNewCases({
    definitions: [invocationDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: (file, args, childOptions) => {
      invocationArgs = args
      invocationEnv = childOptions.env
      const runId = args.find(value => value.startsWith('--idts110-run-id='))?.slice('--idts110-run-id='.length) || 'missing-run-id'
      const nonce = args.find(value => value.startsWith('--idts110-nonce='))?.slice('--idts110-nonce='.length) || 'missing-nonce'
      const createdAt = new Date().toISOString()
      fs.mkdirSync(invocationCaseDirectory, { recursive: true })
      fs.writeFileSync(invocationScreenshotPath, screenshotBytes)
      const screenshotSha256 = crypto.createHash('sha256').update(screenshotBytes).digest('hex')
      fs.writeFileSync(invocationManifestPath, `${JSON.stringify({
        ...invocationMetadata({ runId, nonce, createdAt }),
        evidenceId: `${invocationDefinition.caseId}-VISUAL`,
        screenshotPath: invocationRelativeScreenshotPath,
        screenshotSha256
      })}\n`)
      return { status: 0, stdout: `${formatAtomicMarker(invocationMarker({ runId, nonce, createdAt, screenshotSha256 }))}\n`, stderr: '' }
    }
  })
  assert.equal(freshInvocationBatch.results[0].status, 'PASS', 'fresh visual evidence created by the child must be accepted')
  assert.ok(invocationArgs.some(value => value.startsWith('--idts110-run-id=')), 'child must receive an unpredictable runId')
  assert.ok(invocationArgs.some(value => value.startsWith('--idts110-nonce=')), 'child must receive an unpredictable nonce')
  assert.ok(invocationEnv && invocationEnv.IDTS110_RUN_ID, 'child must receive a safe runId environment value')
  assert.ok(invocationEnv && invocationEnv.IDTS110_NONCE, 'child must receive a safe nonce environment value')

  const staleRunId = 'idts110-stale-run'
  const staleNonce = 'idts110-stale-nonce'
  const staleCreatedAt = new Date().toISOString()
  fs.rmSync(invocationCaseDirectory, { recursive: true, force: true })
  fs.mkdirSync(invocationCaseDirectory, { recursive: true })
  fs.writeFileSync(invocationScreenshotPath, screenshotBytes)
  const staleScreenshotSha256 = crypto.createHash('sha256').update(screenshotBytes).digest('hex')
  fs.writeFileSync(invocationManifestPath, `${JSON.stringify({
    ...invocationMetadata({ runId: staleRunId, nonce: staleNonce, createdAt: staleCreatedAt }),
    evidenceId: `${invocationDefinition.caseId}-VISUAL`,
    screenshotPath: invocationRelativeScreenshotPath,
    screenshotSha256: staleScreenshotSha256
  })}\n`)
  const staleBatch = await orchestrator.runNewCases({
    definitions: [invocationDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    runId: staleRunId,
    nonce: staleNonce,
    spawnSync: () => ({
      status: 0,
      stdout: `${formatAtomicMarker(invocationMarker({ runId: staleRunId, nonce: staleNonce, createdAt: staleCreatedAt, screenshotSha256: staleScreenshotSha256 }))}\n`,
      stderr: ''
    })
  })
  assert.equal(staleBatch.results[0].status, 'FAIL', 'a pre-existing same-case screenshot and manifest must not be accepted as fresh evidence')

  const emptySnapshots = { ...childPass, beforeState: {}, afterState: {}, reloadState: {} }
  const emptySnapshotBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(emptySnapshots)}\n`, stderr: '' })
  })
  assert.equal(emptySnapshotBatch.results[0].status, 'FAIL', 'required snapshots must contain evidence content')

  const badEvidenceIds = { ...childPass, evidenceIds: ['arbitrary-evidence'] }
  const badEvidenceBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${MARKER_PREFIX}${JSON.stringify(badEvidenceIds)}\n`, stderr: '' })
  })
  assert.equal(badEvidenceBatch.results[0].status, 'FAIL', 'case evidence ID must be exact')

  const badScreenshotPath = path.join(visualDirectory, 'missing.png')
  const badScreenshotResult = { ...visualResult, runtimeEvidence: { screenshotPath: badScreenshotPath, screenshotSha256 } }
  const badScreenshotBatch = await orchestrator.runNewCases({
    definitions: [visualDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${MARKER_PREFIX}${JSON.stringify(badScreenshotResult)}\n`, stderr: '' })
  })
  assert.equal(badScreenshotBatch.results[0].status, 'FAIL', 'visual proof must reference an existing PNG')
  const badScreenshotHashResult = { ...visualResult, runtimeEvidence: { screenshotPath, screenshotSha256: 'a'.repeat(64) } }
  const badScreenshotHashBatch = await orchestrator.runNewCases({
    definitions: [visualDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${MARKER_PREFIX}${JSON.stringify(badScreenshotHashResult)}\n`, stderr: '' })
  })
  assert.equal(badScreenshotHashBatch.results[0].status, 'FAIL', 'visual proof must match PNG bytes')

  const externalDefinition = definition({ environment: 'BTP' })
  const externalMarker = await runAtomicCase({
    definition: externalDefinition,
    assertionId: externalDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({ assertionPassed: true, actualResult: externalDefinition.expectedResult, evidenceIds: ['IDTS110-F232-RESULT'] })
  })
  const forgedExternalMarker = {
    ...externalMarker,
    status: 'PASS',
    assertionPassed: true,
    actualResult: externalDefinition.expectedResult,
    authorizedFixture: false,
    deployedSha: null,
    runtimeEvidence: null
  }
  const externalRun = await orchestrator.runOneCase(externalDefinition, {
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    outputPath: null,
    root: process.cwd(),
    timeoutMs: 1000,
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(forgedExternalMarker)}\n`, stderr: '' })
  })
  assert.equal(externalRun.status, 'BLOCKED', 'orchestrator must not accept external PASS without marker authorization proof')

  await assert.rejects(() => runAtomicCase({
    definition: definition(), assertionId: 'IDTS110-F232-A1', baselineSha: BASELINE_SHA, executor: 'Codex-agent-assisted',
    execute: async () => ({ assertionPassed: true, actualResult: 'expected result', beforeState: { tooLong: 'x'.repeat(2001) }, afterState: { rows: 1 }, reloadState: { rows: 1 }, evidenceIds: ['IDTS110-F232-RESULT'] })
  }), /length|bounded/i)
  await assert.rejects(() => runAtomicCase({
    definition: definition(), assertionId: 'IDTS110-F232-A1', baselineSha: BASELINE_SHA, executor: 'Codex-agent-assisted',
    execute: async () => ({ assertionPassed: true, actualResult: 'expected result', beforeState: { tooMany: Array.from({ length: 65 }, () => 'x') }, afterState: { rows: 1 }, reloadState: { rows: 1 }, evidenceIds: ['IDTS110-F232-RESULT'] })
  }), /length|bounded/i)
  await assert.rejects(() => runAtomicCase({
    definition: definition(), assertionId: 'IDTS110-F232-A1', baselineSha: BASELINE_SHA, executor: 'Codex-agent-assisted',
    execute: async () => ({ assertionPassed: true, actualResult: 'expected result', beforeState: { a: { b: { c: { d: { e: 1 } } } } }, afterState: { rows: 1 }, reloadState: { rows: 1 }, evidenceIds: ['IDTS110-F232-RESULT'] })
  }), /depth|bounded/i)
  assert.throws(() => validateAtomicResult({ ...result, beforeState: { PaSsWoRd: 'secret' } }), /sensitive|PII/i)

  const futureStart = new Date(Date.now() + 60000).toISOString()
  const futureMarker = { ...childPass, startedAt: futureStart, completedAt: futureStart }
  const futureBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(futureMarker)}\n`, stderr: '' })
  })
  assert.equal(futureBatch.results[0].status, 'FAIL', 'far-future marker timestamps must be rejected')

  const escapeName = 'idts110-contract-escape.js'
  const escapePath = path.join(process.cwd(), 'scripts/qa', escapeName)
  let symlinkCreated = false
  try {
    fs.symlinkSync(process.execPath, escapePath, 'file')
    symlinkCreated = true
  } catch {}
  if (symlinkCreated) {
    try {
      await assert.rejects(() => orchestrator.runOneCase(definition({ plannedTestFile: `scripts/qa/${escapeName}` }), {
        baselineSha: BASELINE_SHA,
        executor: 'Codex-agent-assisted',
        outputPath: null,
        root: process.cwd(),
        timeoutMs: 1000,
        spawnSync: () => ({ status: 0, stdout: 'suite PASS', stderr: '' })
      }), /outside|symlink/i)
    } finally {
      fs.unlinkSync(escapePath)
    }
  }
  if (fs.existsSync(orchestratedPath)) fs.unlinkSync(orchestratedPath)
  if (fs.existsSync(screenshotPath)) fs.unlinkSync(screenshotPath)
  if (fs.existsSync(secondScreenshotPath)) fs.unlinkSync(secondScreenshotPath)
  if (fs.existsSync(secondVisualPath)) fs.unlinkSync(secondVisualPath)
  if (fs.existsSync(invocationCaseDirectory)) fs.rmSync(invocationCaseDirectory, { recursive: true, force: true })
  if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath)
  if (fs.existsSync(secondVisualManifest)) fs.unlinkSync(secondVisualManifest)
  if (fs.existsSync(secondVisualDirectory)) fs.rmdirSync(secondVisualDirectory)
  if (fs.existsSync(visualCaseDirectory)) fs.rmdirSync(visualCaseDirectory)
  if (fs.existsSync(visualDirectory)) fs.rmdirSync(visualDirectory)
  if (fs.existsSync(atomicWritePath)) fs.unlinkSync(atomicWritePath)
  if (fs.existsSync(tempDirectory)) fs.rmSync(tempDirectory, { recursive: true, force: true })

  console.log('IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.')
}

main().catch(error => {
  console.error('IDTS-110 atomic runner contract FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
})
