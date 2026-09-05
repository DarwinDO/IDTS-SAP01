'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

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

const workloadFixtureSource = fs.readFileSync(path.join(__dirname, 'serve-my-notifications-ui.js'), 'utf8')
const productionWorkloadControllerSource = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'user-administration-ui', 'webapp', 'controller', 'Main.controller.js'), 'utf8')
assert.match(workloadFixtureSource, /idts\/useradministrationui\/controller\/Main\.controller/, 'F224 fixture must load the production User Administration controller module')
assert.match(workloadFixtureSource, /_loadDeveloperWorkloadBugs/, 'F224 fixture must invoke the production workload loader')
assert.match(workloadFixtureSource, /_bugObjectPageUrl/, 'F224 fixture must exercise the production Bug object-page URL helper')
assert.match(workloadFixtureSource, /openBugInManagement/, 'F224 fixture must exercise the production navigation method')
assert.match(workloadFixtureSource, /bindList/, 'F224 fixture must observe the OData list binding used by production')
assert.match(workloadFixtureSource, /__IDTS110_WORKLOAD_PRODUCTION__/, 'F224 fixture must publish production-path runtime evidence')
assert.doesNotMatch(workloadFixtureSource, /requestFilter\s*:\s*["'`]assignee_ID/, 'F224 fixture must not preload a copied request filter')
assert.match(productionWorkloadControllerSource, /_loadDeveloperWorkloadBugs\s*:/, 'production workload loader method is required')
assert.match(productionWorkloadControllerSource, /_bugObjectPageUrl\s*:/, 'production Bug object-page URL helper is required')
assert.match(productionWorkloadControllerSource, /window\.location\.assign\s*\(/, 'production navigation must remain observable')
assert.match(productionWorkloadControllerSource, /assignee_ID eq \$\{sProfileID\} and status_code ne 'CLOSED'/, 'production non-Closed workload filter is required')
assert.match(productionWorkloadControllerSource, /idtsbugmanagementui\/index\.html#\/Bugs\(ID=/, 'production Bug Management route is required')

console.log('IDTS-110 UI runtime contract PASS: visual case set, scenario map, options, and boundaries')
