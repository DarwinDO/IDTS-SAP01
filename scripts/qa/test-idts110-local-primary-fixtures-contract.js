'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const identityBoundSuites = [
  'scripts/qa/test-idts6-programmatic.js',
  'scripts/qa/test-idts23-regression.js',
  'scripts/qa/test-idts66-duplicate-detection.js',
  'scripts/qa/test-idts67-classification-suggestion.js',
  'scripts/qa/test-idts68-bug-summary.js',
  'scripts/qa/test-idts69-assignment-explanation.js',
  'scripts/qa/test-idts71-ai-security-review.js',
  'scripts/qa/test-idts91-ai-review-actions.js',
  'scripts/qa/test-idts93-apply-classification.js',
  'scripts/qa/test-idts95-confirm-duplicate-suggestion.js'
]

for (const relativePath of identityBoundSuites) {
  assert.doesNotMatch(
    read(relativePath),
    /new cds\.User\(\{\s*id:\s*'(?:DonHV|NhanT|DatDT|SangVN)'/,
    `${relativePath} must use an immutable ID or exact fixture email, not a display name`
  )
}

for (const relativePath of [
  'scripts/qa/test-idts6-programmatic.js',
  'scripts/qa/test-idts23-regression.js',
  'scripts/qa/test-idts69-assignment-explanation.js',
  'scripts/qa/test-idts71-ai-security-review.js'
]) {
  assert.match(
    read(relativePath),
    /seedActiveDeveloperIdentityAccess/,
    `${relativePath} must seed ACTIVE identity access before testing assignment readiness`
  )
}

assert.match(
  read('scripts/qa/idts-test-users.js'),
  /UserOnboardingRequests/,
  'the shared fixture helper must persist ACTIVE identity access'
)
assert.match(
  read('scripts/qa/test-idts6-programmatic.js'),
  /eventType_code === 'RESUBMITTED'/,
  'the lifecycle suite must assert the current resubmit notification event type'
)

const runner = read('scripts/qa/test-idts110-local-primary-suites.js')
assert.match(runner, /bug:\s*\[\s*\[/, 'bug mapping must declare independent commands')
assert.match(runner, /lifecycle:\s*\[\s*\[/, 'lifecycle mapping must declare independent commands')
assert.match(runner, /for \(const command of commands\)/, 'every declared suite command must execute')

console.log('IDTS-110 local-primary fixture contract: PASS')
