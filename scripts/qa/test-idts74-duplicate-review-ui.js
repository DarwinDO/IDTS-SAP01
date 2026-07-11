/**
 * IDTS-74 duplicate/similar bug review UI verification.
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

const controller = read('app/bug-management-ui/webapp/ext/actions/DuplicateReview.js')
const fragment = read('app/bug-management-ui/webapp/ext/fragment/SimilarBugReviewField.fragment.xml')
const i18nFiles = [
  'app/bug-management-ui/webapp/i18n/i18n.properties',
  'app/bug-management-ui/webapp/i18n/i18n_en.properties'
]
const forbiddenUserCopy = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint|XSUAA|BTP)\b/i

function controllerStringLiterals (source) {
  return [...source.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g)]
    .map(match => match[1] || match[2] || '')
    .filter(text => text && !text.startsWith('sap/') && !text.startsWith('../') && !text.startsWith('/'))
}

const checks = [
  expectIncludes('Similar bug review field opens duplicate review from product UI', fragment, 'DuplicateReview.openDialog'),
  expectIncludes('Similar bug review field loads DuplicateReview UI5 module', fragment, 'idts/bugmanagementui/ext/actions/DuplicateReview'),
  expectIncludes('Similar bug review field uses the user-facing action label', fragment, 'duplicateReviewOpenButton'),
  expectIncludes('duplicate review controller calls existing CAP action', controller, '/suggestSimilarBugs(...)'),
  expectIncludes('duplicate review sends source bug id when available', controller, 'operation.setParameter("sourceBugID"'),
  expectIncludes('duplicate review uses reusable AI review copy/state mapping', controller, 'AiReviewUi.decorateResult'),
  expectIncludes('duplicate review renders SAPUI5 Dialog', controller, '"sap/m/Dialog"'),
  expectIncludes('duplicate review renders SAPUI5 responsive Table', controller, '"sap/m/Table"'),
  expectIncludes('duplicate review keeps human decision explicit', controller, 'decisionHint'),
  expectNotMatches('duplicate review does not show raw caught error messages', controller, /MessageBox\.error\([^)]*error\.message/i),
  expectNotMatches('duplicate review controller does not embed raw HTML', controller, /<(div|span|style|table)\b/i)
]

for (const literal of controllerStringLiterals(controller)) {
  checks.push(expectNotMatches(`controller literal "${literal}" is not dev-facing copy`, literal, forbiddenUserCopy))
}

const requiredI18nKeys = [
  'similarBugReviewFieldLabel',
  'duplicateReviewOpenButton',
  'duplicateReviewDialogTitle',
  'duplicateReviewIntroMessage',
  'duplicateReviewBugColumn',
  'duplicateReviewStatusColumn',
  'duplicateReviewMatchColumn',
  'duplicateReviewReasonColumn',
  'duplicateReviewScore',
  'duplicateReviewNoCandidates',
  'duplicateReviewLoadFailed',
  'duplicateReviewCloseButton'
]

for (const file of i18nFiles) {
  const content = read(file)
  for (const key of requiredI18nKeys) {
    checks.push(expectIncludes(`${path.basename(file)} has ${key}`, content, `${key}=`))
  }

  for (const row of parseProperties(file).filter(row => row.key.startsWith('duplicateReview'))) {
    checks.push(expectNotMatches(`${path.basename(file)} ${row.key} has user-facing copy`, row.value, forbiddenUserCopy))
  }
}

const evidenceDir = path.join(root, 'docs', 'pm', 'evidence', 'idts-74')
fs.mkdirSync(evidenceDir, { recursive: true })
fs.writeFileSync(
  path.join(evidenceDir, 'duplicate-review-ui-static-check.json'),
  JSON.stringify({
    task: 'IDTS-74',
    checkedAt: new Date().toISOString(),
    checks
  }, null, 2)
)

console.log(`IDTS-74 duplicate review UI checks passed (${checks.length}).`)
