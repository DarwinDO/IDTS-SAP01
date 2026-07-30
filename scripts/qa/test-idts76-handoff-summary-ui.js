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
const timelinePatternLiteral = controller.match(/var TIMELINE_PREFIX_PATTERN = (\/.*\/);/)
assert(timelinePatternLiteral, 'handoff controller must declare TIMELINE_PREFIX_PATTERN')
const timelinePrefixPattern = Function(`return ${timelinePatternLiteral[1]}`)()
for (const row of [
  '[2026-07-11T10:25:35.913Z] DonHV (PM): Updated the bug.',
  '- [2026-07-11T10:25:35.913Z] DonHV (PM): Updated the bug.',
  '1. [2026-07-11T10:25:35.913Z] DonHV (PM): Updated the bug.'
]) {
  const match = row.match(timelinePrefixPattern)
  assert(match, `handoff timeline must parse ${row}`)
  assert.strictEqual(match[1], '2026-07-11T10:25:35.913Z')
}

const checks = [
  { label: 'handoff timestamp parser accepts plain, bullet and numbered rows', pass: true },
  expectIncludes('history section opens the handoff review dialog', fragment, 'HandoffSummaryReview.openDialog'),
  expectIncludes('history section loads the UI5 action module', fragment, 'idts/bugmanagementui/ext/actions/HandoffSummaryReview'),
  expectIncludes('handoff review calls the existing CAP action', controller, '/summarizeBugHandoff(...)'),
  expectIncludes('handoff review sends source bug ID', controller, 'operation.setParameter("sourceBugID"'),
  expectIncludes('handoff review uses reusable AI review mapping', controller, 'AiReviewUi.decorateResult'),
  expectIncludes('handoff review renders a SAPUI5 Dialog', controller, '"sap/m/Dialog"'),
  expectIncludes('handoff review renders safe status', controller, '"sap/m/ObjectStatus"'),
  expectIncludes('handoff review uses SAPUI5 lists for comments and events', controller, '"sap/m/List"'),
  expectIncludes('handoff review uses expandable text for long content', controller, '"sap/m/ExpandableText"'),
  expectIncludes('handoff review uses the locale-aware UI5 date formatter', controller, '"sap/ui/core/format/DateFormat"'),
  expectIncludes('handoff dialog prevents horizontal scrolling', controller, 'horizontalScrolling: false'),
  expectIncludes('handoff timeline converts stored timestamps to locale display', controller, 'formatTimelineItems'),
  expectIncludes('handoff timeline accepts bullet-prefixed stored rows', controller, 'TIMELINE_PREFIX_PATTERN'),
  expectNotMatches('handoff timeline does not render dates through the browser native formatter', controller, /\.toLocaleString\s*\(/),
  expectIncludes('handoff timeline separates actor metadata from event detail', controller, 'handoffSummary>actor'),
  expectIncludes('handoff timeline shows localized time separately', controller, 'handoffSummary>time'),
  expectIncludes('handoff review shows summary', controller, 'handoffSummarySummaryLabel'),
  expectIncludes('handoff review shows missing information', controller, 'handoffSummaryMissingLabel'),
  expectIncludes('handoff review shows grounded comment summary', controller, 'handoffSummaryCommentsLabel'),
  expectIncludes('handoff list keeps backend-sanitized technical terms as business data', controller, 'String(value || "").trim()'),
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
assert.strictEqual(section.IdtsSmartAssignment.position.anchor, 'ClassificationAndAssignment')
checks.push({ label: 'smart assignment appears after Classification and Planning', pass: true })

const requiredI18nKeys = [
  'handoffSummarySectionHint',
  'handoffSummaryOpenButton',
  'handoffSummaryDialogTitle',
  'handoffSummaryIntroMessage',
  'handoffSummarySummaryLabel',
  'handoffSummaryStatusLabel',
  'handoffSummaryOwnerLabel',
  'handoffSummaryMissingLabel',
  'handoffSummaryCommentsLabel',
  'handoffSummaryNoComments',
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
