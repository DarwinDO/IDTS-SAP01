/**
 * IDTS-76 handoff summary review UI verification.
 */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function expectIncludes (label, content, expected) {
  assert(content.includes(expected), `${label} must include ${expected}`)
  return { label, pass: true }
}

function expectNotMatches (label, content, pattern) {
  assert(!pattern.test(content), `${label} must not match ${pattern}`)
  return { label, pass: true }
}

function parseProperties (relativePath) {
  return read(relativePath)
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=')
      return {
        key: line.slice(0, index).trim(),
        value: line.slice(index + 1).trim()
      }
    })
}

const controller = read('app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js')
const fragment = read('app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml')
const manifest = JSON.parse(read('app/bug-management-ui/webapp/manifest.json'))
const i18nFiles = [
  'app/bug-management-ui/webapp/i18n/i18n.properties',
  'app/bug-management-ui/webapp/i18n/i18n_en.properties'
]
const forbiddenUserCopy = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint|XSUAA|BTP)\b/i
const section = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content.body.sections

const checks = [
  expectIncludes('history section opens the handoff review dialog', fragment, 'HandoffSummaryReview.openDialog'),
  expectIncludes('history section loads the UI5 action module', fragment, 'idts/bugmanagementui/ext/actions/HandoffSummaryReview'),
  expectIncludes('handoff review calls the existing CAP action', controller, '/summarizeBugHandoff(...)'),
  expectIncludes('handoff review sends source bug ID', controller, 'operation.setParameter("sourceBugID"'),
  expectIncludes('handoff review uses reusable AI review mapping', controller, 'AiReviewUi.decorateResult'),
  expectIncludes('handoff review renders a SAPUI5 Dialog', controller, '"sap/m/Dialog"'),
  expectIncludes('handoff review renders safe status', controller, '"sap/m/ObjectStatus"'),
  expectIncludes('handoff review shows summary', controller, 'handoffSummarySummaryLabel'),
  expectIncludes('handoff review shows missing information', controller, 'handoffSummaryMissingLabel'),
  expectIncludes('handoff review shows important events', controller, 'handoffSummaryEventsLabel'),
  expectIncludes('handoff review shows next action', controller, 'handoffSummaryNextActionLabel'),
  expectIncludes('handoff review keeps manual decision guidance', controller, 'decisionHint'),
  expectIncludes('handoff review protects user copy', controller, 'INTERNAL_COPY_PATTERN'),
  expectNotMatches(
    'handoff review has no OData update request',
    controller,
    /(bugContext|model)\.setProperty\s*\(|\.submitBatch\s*\(|method\s*:\s*["']PATCH["']/i
  ),
  expectNotMatches('handoff review has no comment write path', controller, /(addComment\s*\(|bindContext\(["']\/Comments|bindList\(["']\/Comments|commentContent\s*:)/i),
  expectNotMatches('handoff review has no workflow transition call', controller, /(resolveBug|rejectBug|requestMoreInformation|reopenBug|startProgress|markInReview)/i),
  expectNotMatches('handoff review does not expose caught error messages', controller, /MessageBox\.error\([^)]*error\.message/i),
  expectNotMatches('handoff review controller does not embed raw HTML', controller, /<(div|span|style|table)\b/i)
]

assert(!section.IdtsHandoffSummary, 'manifest must not register standalone IdtsHandoffSummary section')
checks.push({ label: 'manifest no longer registers standalone handoff summary section', pass: true })
assert.strictEqual(section.IdtsSmartAssignment.position.anchor, 'IdtsClassificationActionRow')
checks.push({ label: 'smart assignment appears after classification action row', pass: true })

const requiredI18nKeys = [
  'handoffSummarySectionHint',
  'handoffSummaryOpenButton',
  'handoffSummaryDialogTitle',
  'handoffSummaryIntroMessage',
  'handoffSummarySummaryLabel',
  'handoffSummaryStatusLabel',
  'handoffSummaryOwnerLabel',
  'handoffSummaryMissingLabel',
  'handoffSummaryEventsLabel',
  'handoffSummaryNextActionLabel',
  'handoffSummaryUnknownBug',
  'handoffSummaryNoDetails',
  'handoffSummaryNoMissingInfo',
  'handoffSummaryNoEvents',
  'handoffSummaryNoNextAction',
  'handoffSummarySparseWarning',
  'handoffSummaryLoading',
  'handoffSummaryLoadFailed',
  'handoffSummaryCloseButton'
]

for (const file of i18nFiles) {
  const content = read(file)
  for (const key of requiredI18nKeys) {
    checks.push(expectIncludes(`${path.basename(file)} has ${key}`, content, `${key}=`))
  }

  for (const row of parseProperties(file).filter(row => row.key.startsWith('handoffSummary'))) {
    checks.push(expectNotMatches(`${path.basename(file)} ${row.key} is user-facing`, row.value, forbiddenUserCopy))
  }
}

const evidenceDir = path.join(root, 'docs', 'pm', 'evidence', 'idts-76')
fs.mkdirSync(evidenceDir, { recursive: true })
fs.writeFileSync(
  path.join(evidenceDir, 'handoff-summary-ui-static-check.json'),
  JSON.stringify({
    task: 'IDTS-76',
    checkedAt: new Date().toISOString(),
    checks
  }, null, 2)
)

console.log(`IDTS-76 handoff summary UI checks passed (${checks.length}).`)
