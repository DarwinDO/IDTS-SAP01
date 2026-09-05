'use strict'

const assert = require('node:assert/strict')

// This contract is intentionally independent of a live CAP/BTP target.  The
// implementation must drive a real browser page for every case listed here;
// FakeControl/native-control assertions are only prechecks in the existing
// runners.
const uiRuntime = require('./run-idts110-ui-runtime')

const expectedVisualCases = [
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P',
  'IDTS110-F239H', 'IDTS110-F239D'
]

assert.deepEqual([...uiRuntime.VISUAL_CASES], expectedVisualCases)
assert.equal(uiRuntime.VISUAL_CASES.size, 9)
assert.equal(expectedVisualCases.filter(key => key.startsWith('IDTS110-F23')).length, 8)
assert.deepEqual(Object.fromEntries(expectedVisualCases.map(key => [key, uiRuntime.SCENARIOS[key]])), {
  'IDTS110-F224': 'workload-drilldown',
  'IDTS110-F237': 'populated-bug',
  'IDTS110-F238': 'empty',
  'IDTS110-F238E': 'error-retry',
  'IDTS110-F238L': 'loading',
  'IDTS110-F239': 'visible-signal',
  'IDTS110-F239P': 'visible-poll',
  'IDTS110-F239H': 'hidden-stop',
  'IDTS110-F239D': 'destroy'
})

const baseline = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const parsed = uiRuntime.parseUiOptions([
  '--case=IDTS110-F237',
  `--baseline=${baseline}`,
  '--executor=Codex-agent-assisted',
  '--url=http://127.0.0.1:12345/idtsbugmanagementui/index.html',
  '--output=.tmp/idts-110/ui-results.json',
  '--idts110-run-id=run-1',
  '--idts110-nonce=nonce-1'
])
assert.equal(parsed.caseKey, 'IDTS110-F237')
assert.equal(parsed.baselineSha, baseline)
assert.equal(parsed.executor, 'Codex-agent-assisted')
assert.equal(parsed.outputPath, '.tmp/idts-110/ui-results.json')
assert.equal(parsed.runId, 'run-1')
assert.equal(parsed.nonce, 'nonce-1')
assert.throws(
  () => uiRuntime.parseUiOptions(['--scope=VISUAL', `--baseline=${baseline}`, '--executor=Codex-agent-assisted', '--output=.tmp/idts-110/ui-results.json']),
  /url/i
)
assert.throws(
  () => uiRuntime.parseUiOptions(['--case=IDTS110-F242', `--baseline=${baseline}`, '--executor=Codex-agent-assisted', '--url=http://127.0.0.1:12345/']),
  /visual|case/i
)
assert.throws(
  () => uiRuntime.parseUiOptions(['--case=IDTS110-F237', `--baseline=${baseline}`, '--executor=Codex-agent-assisted', '--url=https://example.com/idtsbugmanagementui/index.html']),
  /loopback|fixture|local/i
)

assert.equal(uiRuntime.isVisualCase('IDTS110-F224'), true)
assert.equal(uiRuntime.isVisualCase('IDTS110-F232'), false)
assert.equal(typeof uiRuntime.formatCaseOutput, 'function')

console.log('IDTS-110 UI runtime contract PASS: visual case set, scenario map, options, and boundaries')
