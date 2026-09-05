'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

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
  assert.equal(external.evidenceKind, 'BTP_INTEGRATION')

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
    definition({ caseId: 'IDTS110-F233', mentorNumber: 235, title: 'safe second case' })
  ]
  const malformedBatch = await orchestrator.runNewCases({
    definitions: malformedDefinitions,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: (file, args) => args.includes('--idts110-case=IDTS110-F232')
      ? { status: 0, stdout: `${formatAtomicMarker(childPass)}\n`, stderr: '' }
      : { status: 0, stdout: 'suite PASS', stderr: '' }
  })
  assert.equal(malformedBatch.results.length, 2)
  assert.equal(malformedBatch.results[0].status, 'FAIL')
  assert.equal(malformedBatch.results[1].status, 'FAIL')

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

  const missingSnapshots = { ...childPass, beforeState: null, afterState: null, reloadState: null }
  const snapshotBatch = await orchestrator.runNewCases({
    definitions: [definitions[0]],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker(missingSnapshots)}\n`, stderr: '' })
  })
  assert.equal(snapshotBatch.results[0].status, 'FAIL', 'orchestrator must independently require catalog persistence snapshots')

  const visualDefinition = approvedDefinitions.find(current => current.caseId === 'IDTS110-F224')
  const visualResult = await runAtomicCase({
    definition: visualDefinition,
    assertionId: visualDefinition.assertionId,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
      assertionPassed: true,
      actualResult: visualDefinition.expectedResult,
      runtimeEvidence: { screenshotPath: 'F224.png', screenshotSha256: 'b'.repeat(64) },
      evidenceIds: ['IDTS110-F224-RESULT']
    })
  })
  const visualBatch = await orchestrator.runNewCases({
    definitions: [visualDefinition],
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    spawnSync: () => ({ status: 0, stdout: `${formatAtomicMarker({ ...visualResult, runtimeEvidence: null })}\n`, stderr: '' })
  })
  assert.equal(visualBatch.results[0].status, 'FAIL', 'orchestrator must independently require rendered screenshot proof')

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

  console.log('IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.')
}

main().catch(error => {
  console.error('IDTS-110 atomic runner contract FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
})
