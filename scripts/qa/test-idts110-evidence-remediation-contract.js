'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const runner = fs.readFileSync(path.join(root, 'scripts/qa/test-idts110-local-primary-suites.js'), 'utf8')
const task = fs.readFileSync(path.join(root, 'docs/pm/tasks/idts-110-unit-test-en.md'), 'utf8')
const srs = fs.readFileSync(path.join(root, 'docs/ba/srs/srs.en.md'), 'utf8')

assert.match(
  runner,
  /const outputPath = outputArg \? path\.resolve\(outputArg\.slice\('--output='\.length\)\) : null/,
  'the evidence runner must not write a tracked file unless --output is explicit'
)

const startedIndex = runner.indexOf('const startedAt = new Date().toISOString()')
const executionIndex = runner.indexOf('const executions = {}')
const completedIndex = runner.indexOf('const completedAt = new Date().toISOString()')
assert.ok(startedIndex >= 0 && startedIndex < executionIndex, 'startedAt must be captured before suite execution')
assert.ok(completedIndex > executionIndex, 'completedAt must be captured after suite execution')
assert.match(runner, /durationMs = Date\.now\(\) - startTimeMs/, 'durationMs must measure the suite run')

for (const unapprovedPrefix of ['UT-USR-', 'UT-CAT-', 'UT-OPS-']) {
  assert.ok(!task.includes(unapprovedPrefix), `${unapprovedPrefix} candidates must stay out until a separate gap review approves them`)
}

const requirementIds = [...task.matchAll(/SRS-FR-[A-Z]+-\d+/g)].map(match => match[0])
for (const requirementId of new Set(requirementIds)) {
  assert.ok(srs.includes(requirementId), `task references missing SRS requirement ${requirementId}`)
}

console.log('IDTS-110 evidence remediation contract: PASS')
