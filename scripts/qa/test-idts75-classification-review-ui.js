/**
 * IDTS-75 classification suggestion review UI verification.
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

const controller = read('app/bug-management-ui/webapp/ext/actions/ClassificationReview.js')
const fragment = read('app/bug-management-ui/webapp/ext/fragment/ClassificationReviewField.fragment.xml')

assert(controller.includes('"sap/m/ExpandableText"'), 'classification reason must use SAPUI5 ExpandableText')
assert(controller.includes('classificationReviewConfidenceColumn'), 'classification table must expose a dedicated confidence column')
assert(controller.includes('autoPopinMode: true'), 'classification table must automatically adapt columns to available width')
assert(controller.includes('horizontalScrolling: false'), 'classification dialog must not allow horizontal scrolling')
assert(!controller.includes('contentWidth: "58rem"'), 'classification dialog must not keep the old fixed width')
assert(!/new Text\(\{ text: "\{classificationReview>decisionHint\}"/.test(controller), 'classification rows must not repeat generic review guidance')
assert(!/decisionHint:\s*review\.decisionHint/.test(controller), 'classification rows must not keep dead per-row review guidance state')
assert(!/minScreenWidth\s*:/.test(controller), 'auto pop-in must own responsive breakpoints instead of ignored manual widths')
assert(!/demandPopin\s*:/.test(controller), 'auto pop-in must own demand-pop-in behavior')
assert(
  /function loadSuggestions\(\)\s*\{[\s\S]{0,650}?setProperty\("\/rows", \[\]\)[\s\S]{0,650}?setProperty\("\/suggestionID", null\)[\s\S]{0,650}?setProperty\("\/reviewActionEnabled", false\)[\s\S]{0,650}?setProperty\("\/applyActionEnabled", false\)/.test(controller),
  'classification reload must clear stale suggestions and review/apply actions before a retry'
)
const manifest = JSON.parse(read('app/bug-management-ui/webapp/manifest.json'))
const i18nFiles = [
  'app/bug-management-ui/webapp/i18n/i18n.properties',
  'app/bug-management-ui/webapp/i18n/i18n_en.properties'
]
const forbiddenUserCopy = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint|XSUAA|BTP)\b/i
const section = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.content.body.sections

const checks = [
  expectIncludes('classification review field opens the review dialog', fragment, 'ClassificationReview.openDialog'),
  expectIncludes('classification review field loads the UI5 action module', fragment, 'idts/bugmanagementui/ext/actions/ClassificationReview'),
  expectIncludes('classification review calls the existing CAP action', controller, '/suggestClassification(...)'),
  expectIncludes('classification review supports persisted bugs', controller, 'operation.setParameter("sourceBugID"'),
  expectIncludes('classification review supports pre-create bug details', controller, 'operation.setParameter("title"'),
  expectIncludes('classification review sends current classification context', controller, 'operation.setParameter("priorityCode"'),
  expectIncludes('classification review uses reusable AI review mapping', controller, 'AiReviewUi.decorateResult'),
  expectIncludes('classification review renders a SAPUI5 Dialog', controller, '"sap/m/Dialog"'),
  expectIncludes('classification review renders a responsive Table', controller, '"sap/m/Table"'),
  expectIncludes('classification review shows current values', controller, 'currentValue'),
  expectIncludes('classification review shows suggested values', controller, 'suggestedValue'),
  expectIncludes('classification review shows confidence metadata', controller, 'confidenceText'),
  expectIncludes('classification review keeps one dialog-level manual decision guidance', controller, 'classificationReviewIntroMessage'),
  expectNotMatches(
    'classification review has no OData update request',
    controller,
    /(bugContext|model)\.setProperty\s*\(|\.submitBatch\s*\(|method\s*:\s*["']PATCH["']/i
  ),
  expectNotMatches('classification review has no apply action', controller, /\bapplySuggestion\b/i),
  expectNotMatches('classification review does not expose caught error messages', controller, /MessageBox\.error\([^)]*error\.message/i),
  expectNotMatches('classification review controller does not embed raw HTML', controller, /<(div|span|style|table)\b/i)
]

const fields = manifest['sap.ui5'].routing.targets.BugsObjectPage.options.settings.controlConfiguration['@com.sap.vocabularies.UI.v1.FieldGroup#Classification'].fields
assert(fields.IdtsClassificationReview, 'manifest must register IdtsClassificationReview inside Classification FieldGroup')
checks.push({ label: 'manifest registers classification review inside Classification FieldGroup', pass: true })
assert.strictEqual(
  fields.IdtsClassificationReview.template,
  'idts.bugmanagementui.ext.fragment.ClassificationReviewField'
)
checks.push({ label: 'manifest uses the classification review field fragment', pass: true })
assert.strictEqual(
  fields.IdtsClassificationReview.visible,
  '{= ${IsActiveEntity} === true || ${HasActiveEntity} === true }'
)
checks.push({ label: 'manifest hides the complete classification custom field on a root create draft', pass: true })
assert.deepStrictEqual(fields.IdtsClassificationReview.position, { anchor: 'DataField::defectCategory_ID', placement: 'After' })
checks.push({ label: 'classification review is positioned after Defect Category inside Classification', pass: true })
assert(!section.IdtsClassificationAssistance, 'manifest must not register standalone IdtsClassificationAssistance section')
checks.push({ label: 'manifest does not register the old standalone classification assistance section', pass: true })
assert.strictEqual(section.IdtsSmartAssignment.position.anchor, 'ClassificationAndAssignment')
checks.push({ label: 'assignment remains after Classification and Planning', pass: true })

const requiredI18nKeys = [
  'classificationReviewFieldLabel',
  'classificationReviewOpenButton',
  'classificationReviewDialogTitle',
  'classificationReviewIntroMessage',
  'classificationReviewFieldColumn',
  'classificationReviewCurrentColumn',
  'classificationReviewSuggestedColumn',
  'classificationReviewReviewColumn',
  'classificationReviewNotSet',
  'classificationReviewNoSafeSuggestion',
  'classificationReviewNoRows',
  'classificationReviewLoadFailed',
  'classificationReviewCloseButton',
  'classificationReviewStatusSuggested',
  'classificationReviewStatusLowConfidence',
  'classificationReviewStatusInvalid',
  'classificationReviewStatusNoSuggestion',
  'classificationReviewStatusUnavailable',
  'classificationReviewStatusReview',
  'classificationReviewConfidence'
]

for (const file of i18nFiles) {
  const content = read(file)
  for (const key of requiredI18nKeys) {
    checks.push(expectIncludes(`${path.basename(file)} has ${key}`, content, `${key}=`))
  }

  for (const row of parseProperties(file).filter(row => row.key.startsWith('classificationReview'))) {
    checks.push(expectNotMatches(`${path.basename(file)} ${row.key} is user-facing`, row.value, forbiddenUserCopy))
  }
}

const evidenceDir = path.join(root, 'docs', 'pm', 'evidence', 'idts-75')
fs.mkdirSync(evidenceDir, { recursive: true })
fs.writeFileSync(
  path.join(evidenceDir, 'classification-review-ui-static-check.json'),
  JSON.stringify({
    task: 'IDTS-75',
    checkedAt: new Date().toISOString(),
    checks
  }, null, 2)
)

console.log(`IDTS-75 classification review UI checks passed (${checks.length}).`)
