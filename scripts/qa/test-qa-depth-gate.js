'use strict'

const assert = require('assert')
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
    section('Known Gaps', 'None'),
    section('Jira/Evidence Links', 'Jira: IDTS-42. Evidence: local self-test output.')
  ].join('\n')
}

function main() {
  let result = validatePullRequestBody(validBody())
  assert.strictEqual(result.pass, true, result.errors.join('\n'))
  console.log('  PASS  valid PR body passes')

  result = validatePullRequestBody(`\uFEFF${validBody()}`)
  assert.strictEqual(result.pass, true, result.errors.join('\n'))
  console.log('  PASS  valid PR body with UTF-8 BOM passes')

  result = validatePullRequestBody(section('Summary', 'Only summary is present.'))
  assert.strictEqual(result.pass, false)
  assert(result.errors.some(error => /Missing required section: Positive Evidence/.test(error)))
  console.log('  PASS  missing required sections fail')

  const bareNa = validBody().replace(
    section('Roles/Authorization', 'N/A - documentation-only gate has no runtime role behavior.'),
    section('Roles/Authorization', 'N/A')
  )
  result = validatePullRequestBody(bareNa)
  assert.strictEqual(result.pass, false)
  assert(result.errors.some(error => /N\/A must include a reason/.test(error)))
  console.log('  PASS  bare N/A fails')

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

  console.log('\nQA Depth Gate self-test: 6 PASS / 0 FAIL')
}

try {
  main()
} catch (error) {
  console.error('QA Depth Gate self-test: FAIL')
  console.error(error.stack || error)
  process.exitCode = 1
}
