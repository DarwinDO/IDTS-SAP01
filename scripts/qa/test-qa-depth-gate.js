'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { validatePullRequestBody } = require('./check-pr-depth')
const { isAllowedLocalPreviewResponse, isUnexpectedConsoleError } = require('./lib/browser-harness')

function section(name, body) {
  return `## ${name}\n\n${body}\n`
}

function validBody() {
  return [
    section('Summary', 'Implements a focused QA gate for IDTS pull requests.'),
    section('Positive Evidence', '`npm run qa:idts43:programmatic` passed 11/11.'),
    section('Negative Evidence', 'Tried missing sections and bare N/A; gate failed as expected.'),
    section('Edge/Boundary Evidence', 'Checked empty body, unknown headings, whitespace-only content, and Known Gaps value None.'),
    section('Roles/Authorization', 'N/A - documentation-only gate has no runtime role behavior.'),
    section('Persistence/Reload', 'N/A - no database state is changed by this documentation/tooling gate.'),
    section('UI/UX Review', 'N/A - no user-facing screen is changed by this gate.'),
    section('Ponytail Simplicity', 'Used ponytail; kept the gate dependency-free and did not add a separate validation framework.'),
    section('Known Gaps', 'None'),
    section('Jira/Evidence Links', 'Jira: IDTS-42. Evidence: local self-test output.')
  ].join('\n')
}

function main() {
  let result = validatePullRequestBody(validBody(), { ownershipGateRequired: true })
  assert.strictEqual(result.pass, true, result.errors.join('\n'))
  assert.strictEqual(result.checkedSections, 10)
  console.log('  PASS  valid PR body needs no Knowledge Gate')

  result = validatePullRequestBody(`\uFEFF${validBody()}`, { ownershipGateRequired: true })
  assert.strictEqual(result.pass, true, result.errors.join('\n'))
  console.log('  PASS  valid PR body with UTF-8 BOM passes')

  result = validatePullRequestBody(section('Summary', 'Only summary is present.'), { ownershipGateRequired: true })
  assert.strictEqual(result.pass, false)
  assert(result.errors.some(error => /Missing required section: Positive Evidence/.test(error)))
  console.log('  PASS  missing QA Depth sections fail')

  const bareNa = validBody().replace(
    section('Roles/Authorization', 'N/A - documentation-only gate has no runtime role behavior.'),
    section('Roles/Authorization', 'N/A')
  )
  result = validatePullRequestBody(bareNa, { ownershipGateRequired: true })
  assert.strictEqual(result.pass, false)
  assert(result.errors.some(error => /N\/A must include a reason/.test(error)))
  console.log('  PASS  bare N/A fails')

  const legacyLearningSection = validBody() + section('Ownership Knowledge Gate', [
    'Member: HistoricalMember',
    'Score: 10%',
    'Result: FAIL'
  ].join('\n'))
  result = validatePullRequestBody(legacyLearningSection, { ownershipGateRequired: true })
  assert.strictEqual(result.pass, true, result.errors.join('\n'))
  console.log('  PASS  legacy Knowledge Gate text no longer blocks PR validation')

  const template = fs.readFileSync(path.join(__dirname, '../../.github/pull_request_template.md'), 'utf8')
  assert.doesNotMatch(template, /^## Ownership Knowledge Gate$/m)
  assert.doesNotMatch(template, /^## Learning Material Bootstrap$/m)
  assert.doesNotMatch(template, /completed the Ownership Knowledge Gate/i)
  console.log('  PASS  PR template contains no mandatory learning gate')

  assert.strictEqual(
    isAllowedLocalPreviewResponse(404, 'http://localhost:4004/bug-management-ui/webapp/Component-preload.js'),
    true
  )
  assert.strictEqual(
    isAllowedLocalPreviewResponse(500, 'http://localhost:4004/odata/v4/bug/Bugs'),
    false
  )
  console.log('  PASS  browser harness response classifier distinguishes preview fallback from 5xx')

  assert.strictEqual(isUnexpectedConsoleError('TypeError: this.getView is not a function'), true)
  assert.strictEqual(isUnexpectedConsoleError('Failed to load resource: the server responded with a status of 404'), false)
  console.log('  PASS  browser harness console classifier keeps runtime TypeError blocking')

  console.log('\nQA Depth Gate self-test: 8 PASS / 0 FAIL')
}

try {
  main()
} catch (error) {
  console.error('QA Depth Gate self-test: FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
}
