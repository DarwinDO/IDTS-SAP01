#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const classification = read('app/bug-management-ui/webapp/ext/actions/ClassificationReview.js')
const duplicate = read('app/bug-management-ui/webapp/ext/actions/DuplicateReview.js')
const smartAssign = read('app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js')
const classificationField = read('app/bug-management-ui/webapp/ext/fragment/ClassificationReviewField.fragment.xml')
const similarBugField = read('app/bug-management-ui/webapp/ext/fragment/SimilarBugReviewField.fragment.xml')
const reviewHelper = read('app/bug-management-ui/webapp/ext/ai/AiSuggestionReview.js')
const dashboard = read('app/bug-management-ui/webapp/dashboard-page.js')
const manifest = read('app/bug-management-ui/webapp/manifest.json')
const service = read('srv/service.cds')
const i18n = [
  read('app/bug-management-ui/webapp/i18n/i18n.properties'),
  read('app/bug-management-ui/webapp/i18n/i18n_en.properties')
]

const checks = []

function includes (label, content, expected) {
  assert(content.includes(expected), `${label} must include ${expected}`)
  checks.push(label)
}

function notIncludes (label, content, unexpected) {
  assert(!content.includes(unexpected), `${label} must not include ${unexpected}`)
  checks.push(label)
}

function matches (label, content, pattern) {
  assert(pattern.test(content), `${label} must match ${pattern}`)
  checks.push(label)
}

includes('classification keeps Apply inside its review dialog', classification, 'classificationApplyButton')
includes('classification invokes the existing CAP apply action', classification, 'applyClassificationSuggestion')
includes('classification requires an accepted review before Apply', classification, 'reviewStateCode === "ACCEPTED"')
includes('classification gates the button to PM or Tester', classification, 'isPmOrTester')
includes('classification prevents repeated Apply', classification, '/applyActionEnabled')
includes('classification distinguishes an applied mutation from a refresh failure', classification, 'var applyCompleted = false')
includes('classification restores retry only before the mutation succeeds', classification, 'if (!applyCompleted)')
includes('classification reports refresh failure without replaying Apply', classification, 'applyCompleted ? "classificationRefreshFailed"')
includes(
  'classification field hides AI on a root create draft',
  classificationField,
  'visible="{= ${IsActiveEntity} === true || ${HasActiveEntity} === true }"'
)
includes(
  'classification has a defensive persisted-source guard',
  classification,
  'hasPersistedBugSource'
)
includes(
  'classification normalizes the direct invocation result before reading the result context',
  classification,
  'invocationResult'
)
includes(
  'classification distinguishes missing context from a load failure',
  classification,
  'classificationReviewMissingContext'
)
includes(
  'classification exposes a safe retry action for retryable load failures',
  classification,
  'classificationReviewRetryButton'
)

includes('similar bugs uses single selection', duplicate, 'mode: "SingleSelectMaster"')
includes('similar bugs stores the selected candidate', duplicate, '/selectedCandidateBugID')
includes('similar bugs keeps Confirm inside its review dialog', duplicate, 'duplicateConfirmButton')
includes('similar bugs invokes the existing CAP confirm action', duplicate, 'confirmDuplicateSuggestion')
includes('similar bugs requires accepted review before Confirm', duplicate, 'reviewStateCode === "ACCEPTED"')
includes('similar bugs gates confirmation to PM or Tester', duplicate, 'isPmOrTester')
includes('similar bugs prevents repeated confirmation', duplicate, '/confirmActionEnabled')
matches(
  'similar bugs recomputes retry state after clearing busy',
  duplicate,
  /duplicateRefreshFailed[\s\S]{0,500}?\.finally\(function \(\) \{\s*state\.setProperty\("\/busy", false\);\s*updateConfirmEnabled\(\);\s*\}\)/
)
includes('similar bugs distinguishes confirmation from refresh failure', duplicate, 'duplicateRefreshFailed')
includes(
  'similar bugs field hides AI on a root create draft',
  similarBugField,
  'visible="{= ${IsActiveEntity} === true || ${HasActiveEntity} === true }"'
)
includes(
  'similar bugs sends a source ID only for an active bug or its edit draft',
  duplicate,
  'hasPersistedBugSource(bug) ? bug.ID : null'
)
includes(
  'similar bugs has a defensive persisted-source guard',
  duplicate,
  'hasPersistedBugSource'
)

matches(
  'Smart Assign waits for pending draft PATCH requests before checking the derived mapping',
  smartAssign,
  /updateGroupId\.charAt\(0\) !== "\$"[\s\S]*?submitBatch\(updateGroupId\)[\s\S]*?waitForAutoSubmit/
)
notIncludes(
  'Smart Assign never submits the reserved auto group manually',
  smartAssign,
  'submitBatch(model.getUpdateGroupId())'
)
includes(
  'Smart Assign refreshes the Bug context before re-reading componentCategory_ID',
  smartAssign,
  'requestRefresh'
)
includes(
  'Smart Assign distinguishes an incomplete classification pair',
  smartAssign,
  'smartAssignIncompleteClassification'
)
includes(
  'Smart Assign distinguishes an invalid active mapping',
  smartAssign,
  'smartAssignInvalidClassificationMapping'
)
matches(
  'Smart Assign catches synchronization failures at both entry points',
  smartAssign,
  /openAssigneePicker[\s\S]*?\.catch\(function \(\) \{[\s\S]*?smartAssignLoadFailed[\s\S]*?openDialog[\s\S]*?\.catch\(function \(\) \{[\s\S]*?smartAssignLoadFailed/
)
includes(
  'classification recognizes only the exact missing-context backend message',
  classification,
  'Provide a bug title, description, reproduction context, or source bug'
)
includes(
  'classification retries only transient load statuses',
  classification,
  'status === 408 || status === 429 || status >= 500'
)

includes('review helper tracks whether the backend decision completed', reviewHelper, 'var reviewCompleted = false')
includes('review helper marks completion only after action invocation', reviewHelper, 'reviewCompleted = true')
matches(
  'review helper restores retry only before the backend decision completes',
  reviewHelper,
  /\.catch\(function \(\) \{\s*if \(!reviewCompleted\) \{\s*state\.setProperty\("\/reviewActionEnabled", true\);\s*\}/
)

includes('dashboard exposes one PM-only AI Activity action', dashboard, 'dashboardAiActivityButton')
includes('dashboard reads the existing operational metrics function', dashboard, 'readAiOperationalMetrics(windowDays=30)')
includes('dashboard checks the PM role', dashboard, 'role_code === "PM"')
includes('dashboard aggregates metrics by capability', dashboard, 'aggregateAiMetrics')
includes('dashboard uses the supported responsive Device flag', dashboard, '"sap/ui/Device"')
includes('dashboard stretches the metrics dialog only on phones', dashboard, 'stretch: Device.system.phone')
notIncludes('dashboard avoids deprecated stretchOnPhone', dashboard, 'stretchOnPhone')
includes('dashboard uses the backend inclusive failure count once', dashboard, 'group.unavailableCount += Number(row.failureCount || 0)')
notIncludes('dashboard does not double count unavailable failures', dashboard, 'Number(row.unavailableCount || 0) + Number(row.failureCount || 0)')
notIncludes('manifest has no standalone AI metrics page or section', manifest, 'IdtsAiOperationalMetrics')

const idts115I18nKeys = [
  'classificationApplyButton',
  'classificationApplyConfirm',
  'classificationApplySuccess',
  'classificationApplyFailed',
  'classificationRefreshFailed',
  'classificationReviewMissingContext',
  'classificationReviewRetryButton',
  'classificationReviewRetryableLoadFailed',
  'duplicateReviewAfterSave',
  'smartAssignIncompleteClassification',
  'smartAssignInvalidClassificationMapping',
  'duplicateConfirmButton',
  'duplicateConfirmPrompt',
  'duplicateConfirmSuccess',
  'duplicateConfirmFailed',
  'duplicateRefreshFailed',
  'dashboardAiActivityButton',
  'dashboardAiActivityTitle',
  'dashboardAiActivityCapability',
  'dashboardAiActivityRequests',
  'dashboardAiActivitySuccessful',
  'dashboardAiActivityUnavailable',
  'dashboardAiActivityAverageLatency',
  'dashboardAiActivityReviewDecisions',
  'dashboardAiActivityNoData',
  'dashboardAiActivityLoadFailed',
  'dashboardAiActivityClose',
  'dashboardAiActivitySimilarBugs',
  'dashboardAiActivityClassification',
  'dashboardAiActivityHandoff',
  'dashboardAiActivitySmartAssign',
  'dashboardAiActivityOther',
  'dashboardAiActivityLatency',
  'dashboardAiActivityNoLatency',
  'dashboardAiActivityReviewCounts'
]

for (const content of i18n) {
  for (const key of idts115I18nKeys) {
    includes(`i18n contains ${key}`, content, `${key}=`)
  }
}

includes('CAP keeps classification Apply contract', service, 'action applyClassificationSuggestion')
includes('CAP keeps duplicate confirmation contract', service, 'action confirmDuplicateSuggestion')
matches(
  'CAP keeps PM-only metrics contract on the metrics function',
  service,
  /@\(requires:\s*'PM'\)\s*function\s+readAiOperationalMetrics/
)

for (const [bundleIndex, content] of i18n.entries()) {
  for (const key of idts115I18nKeys) {
    const line = content.split(/\r?\n/).find(entry => entry.startsWith(`${key}=`)) || ''
    assert(!/\b(sql|stack|token|provider|endpoint|credential|api key|database url)\b/i.test(line), `bundle ${bundleIndex} ${key} must be user-safe`)
    checks.push(`bundle ${bundleIndex} ${key} is user-safe`)
  }
}

console.log(`IDTS-115 AI Fiori entry-point checks passed (${checks.length}).`)
