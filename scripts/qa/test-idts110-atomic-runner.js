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
  return {
    caseId: 'IDTS110-F232',
    mentorNumber: 234,
    title: 'My Notifications search is caller-scoped and stably ordered',
    preconditions: 'Use an isolated local fixture.',
    input: 'Search one caller-owned notification set.',
    expectedResult: 'expected result',
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
}

async function passedResult (overrides = {}) {
  return runAtomicCase({
    definition: definition(overrides),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
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
  assert.equal(schema.required.includes('beforeState'), true)
  assert.equal(schema.required.includes('runtimeEvidence'), true)
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
  assert.equal(result.caseKey, 'IDTS110-F232')
  assert.equal(result.assertionId, 'IDTS110-F232-A1')
  assert.equal(result.sourceBaselineSha, BASELINE_SHA)
  assert.equal(result.deployedSha, null)
  assert.equal(result.reviewStatus, 'PENDING_DONHV_REVIEW')
  assert.ok(Date.parse(result.startedAt) <= Date.parse(result.completedAt))
  assert.doesNotMatch(JSON.stringify(result), /undefined|MAPPING_ONLY|password=|Bearer\s+abc|postgresql:\/\//i)
  validateAtomicResult(result)

  const mismatch = await runAtomicCase({
    definition: definition(),
    assertionId: 'IDTS110-F232-A1',
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    execute: async () => ({
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
    execute: async () => ({ actualResult: 'expected result', evidenceIds: ['IDTS110-F232-RESULT'] })
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
  const batchPath = path.join(tempDirectory, 'batch.json')
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
    results: [result, result]
  }, path.join(tempDirectory, 'duplicate.json')), /duplicate/i)

  const definitions = [
    definition({ caseId: 'IDTS110-F232', mentorNumber: 234 }),
    definition({ caseId: 'IDTS110-F233', mentorNumber: 235, title: 'second case' }),
    definition({ caseId: 'IDTS110-F234', mentorNumber: 236, title: 'third case' }),
    definition({ caseId: 'IDTS110-F235', mentorNumber: 237, title: 'fourth case' })
  ]
  const childPass = await runAtomicCase({
    definition: definitions[0], assertionId: 'IDTS110-F232-A1', baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted', execute: async () => ({ actualResult: 'expected result', beforeState: { rows: 1 }, afterState: { rows: 1 }, reloadState: { rows: 1 }, evidenceIds: ['IDTS110-F232-RESULT'] })
  })
  const childFail = await runAtomicCase({
    definition: definitions[1], assertionId: 'IDTS110-F233-A1', baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted', execute: async () => ({ actualResult: 'different', beforeState: { rows: 1 }, afterState: { rows: 2 }, reloadState: { rows: 2 }, evidenceIds: ['IDTS110-F233-RESULT'] })
  })
  const calls = []
  const orchestrated = await orchestrator.runNewCases({
    definitions,
    baselineSha: BASELINE_SHA,
    executor: 'Codex-agent-assisted',
    outputPath: path.join(tempDirectory, 'orchestrated.json'),
    runId: 'idts110-orchestrator-contract',
    catalogSha: crypto.createHash('sha256').update('catalog').digest('hex'),
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

  console.log('IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.')
}

main().catch(error => {
  console.error('IDTS-110 atomic runner contract FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
})
