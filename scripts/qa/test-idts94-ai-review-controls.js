#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
// Normalize Windows line endings so contract checks validate CDS content, not checkout formatting.
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/\r\n/g, '\n')

const service = read('srv/service.cds')
const summaryBackend = read('srv/ai/bug-summary.js')
const assignmentBackend = read('srv/ai/assignment-explanation.js')
const handoffUi = read('app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js')
const assignmentUi = read('app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js')
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

includes('handoff contract returns audit ID', service, 'type BugHandoffSummaryResult {\n    suggestionID')
includes('assignment explanation contract returns audit ID', service, 'type SmartAssignmentExplanationCandidate {\n    suggestionID')
includes('summary backend returns the persisted audit ID', summaryBackend, 'suggestionID: audit?.ID || null')
includes('assignment backend returns the persisted audit ID', assignmentBackend, 'suggestionID: audit?.ID || null')

for (const [name, controller] of [
  ['handoff', handoffUi],
  ['assignment', assignmentUi]
]) {
  includes(`${name} UI imports shared review helper`, controller, '../ai/AiSuggestionReview')
  includes(`${name} UI delegates decisions`, controller, 'AiSuggestionReview.submit')
  includes(`${name} UI invokes accept`, controller, '"acceptAiSuggestion"')
  includes(`${name} UI invokes reject`, controller, '"rejectAiSuggestion"')
  includes(`${name} UI invokes ignore`, controller, '"ignoreAiSuggestion"')
  includes(`${name} UI renders Accept`, controller, 'aiSuggestionAcceptButton')
  includes(`${name} UI renders Reject`, controller, 'aiSuggestionRejectButton')
  includes(`${name} UI renders Ignore`, controller, 'aiSuggestionIgnoreButton')
  includes(`${name} UI shows persisted state`, controller, 'reviewStateText')
  includes(`${name} UI shows reviewer/time`, controller, 'reviewedByText')
  includes(`${name} UI disables repeat decisions`, controller, 'reviewActionEnabled')
  notMatches(`${name} UI hides caught backend internals`, controller, /MessageBox\.error\([^)]*(error|reason)\.(message|stack)/i)
}

includes('handoff copy says accepting does not change workflow', i18nFiles[0], 'handoffSummaryReviewNotice=')
includes('assignment copy distinguishes review from assignment', i18nFiles[0], 'smartAssignReviewNotice=')
for (const content of i18nFiles) {
  includes('i18n has unavailable review state', content, 'aiSuggestionReviewUnavailable=')
}

console.log(`IDTS-94 AI review control checks passed (${checks.length}).`)
