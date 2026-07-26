#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const service = read('srv/service.cds')
const duplicateBackend = read('srv/ai/duplicate-detection.js')
const classificationBackend = read('srv/ai/classification-suggestion.js')
const duplicateUi = read('app/bug-management-ui/webapp/ext/actions/DuplicateReview.js')
const classificationUi = read('app/bug-management-ui/webapp/ext/actions/ClassificationReview.js')
const reviewUi = read('app/bug-management-ui/webapp/ext/ai/AiSuggestionReview.js')
const i18nFiles = [
  read('app/bug-management-ui/webapp/i18n/i18n.properties'),
  read('app/bug-management-ui/webapp/i18n/i18n_en.properties')
]

const checks = []

function includes (label, content, expected) {
  assert(content.includes(expected), `${label} must include ${expected}`)
  checks.push(label)
}

function notMatches (label, content, pattern) {
  assert(!pattern.test(content), `${label} must not match ${pattern}`)
  checks.push(label)
}

includes('similar candidate contract returns audit ID', service, 'suggestionID     : UUID;')
includes('classification candidate contract returns audit ID', service, 'suggestionID     : UUID;')
includes('duplicate backend attaches persisted audit ID', duplicateBackend, 'suggestionID')
includes('classification backend attaches persisted audit ID', classificationBackend, 'suggestionID')

for (const [name, controller] of [
  ['duplicate', duplicateUi],
  ['classification', classificationUi]
]) {
  includes(`${name} UI imports shared review helper`, controller, '../ai/AiSuggestionReview')
  includes(`${name} UI delegates review decisions`, controller, 'AiSuggestionReview.submit')
  includes(`${name} UI invokes accept action`, controller, '"acceptAiSuggestion"')
  includes(`${name} UI invokes reject action`, controller, '"rejectAiSuggestion"')
  includes(`${name} UI invokes ignore action`, controller, '"ignoreAiSuggestion"')
  includes(`${name} UI renders Accept button`, controller, 'aiSuggestionAcceptButton')
  includes(`${name} UI renders Reject button`, controller, 'aiSuggestionRejectButton')
  includes(`${name} UI renders Ignore button`, controller, 'aiSuggestionIgnoreButton')
  includes(`${name} UI shows persisted review state`, controller, 'reviewStateText')
  includes(`${name} UI shows reviewer and review time`, controller, 'reviewedByText')
  includes(`${name} UI disables repeated decisions`, controller, 'reviewActionEnabled')
  notMatches(`${name} UI does not expose caught backend detail`, controller, /MessageBox\.error\([^)]*(error|reason)\.(message|stack)/i)
}

includes('shared review helper binds explicit CAP action dynamically', reviewUi, '"/" + actionName + "(...)"')
includes('shared review helper formats review time with UI5 locale', reviewUi, 'DateFormat.getDateTimeInstance')
includes('shared review helper clears busy state after decision', reviewUi, '.finally(function ()')
includes('shared review helper uses generic review failure copy', reviewUi, 'aiSuggestionReviewFailed')
notMatches('shared review helper does not expose caught backend detail', reviewUi, /MessageBox\.error\([^)]*(error|reason)\.(message|stack)/i)

const requiredKeys = [
  'aiSuggestionAcceptButton',
  'aiSuggestionRejectButton',
  'aiSuggestionIgnoreButton',
  'aiSuggestionReviewPending',
  'aiSuggestionReviewAfterSave',
  'aiSuggestionReviewedBy',
  'aiSuggestionReviewFailed'
]
for (const content of i18nFiles) {
  for (const key of requiredKeys) {
    includes(`i18n contains ${key}`, content, `${key}=`)
  }
}

console.log(`IDTS-92 AI review UI checks passed (${checks.length}).`)
