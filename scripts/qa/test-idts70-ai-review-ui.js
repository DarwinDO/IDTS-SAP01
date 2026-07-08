/**
 * IDTS-70 reusable AI review UI pattern verification.
 */

'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = process.cwd()
const APP = path.join(ROOT, 'app', 'bug-management-ui')
const HELPER = path.join(APP, 'webapp', 'ext', 'ai', 'AiReviewUi.js')
const SMART_ASSIGN = path.join(APP, 'webapp', 'ext', 'actions', 'SmartAssignDeveloper.js')
const I18N = [
  path.join(APP, 'webapp', 'i18n', 'i18n.properties'),
  path.join(APP, 'webapp', 'i18n', 'i18n_en.properties')
]

const FORBIDDEN_UI_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

let pass = 0
let fail = 0

function rec(label, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`  PASS  ${label}${detail ? ' | ' + detail : ''}`)
  } else {
    fail += 1
    console.log(`  FAIL  ${label}${detail ? ' | ' + detail : ''}`)
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function loadAiReviewUi() {
  let module
  const sandbox = {
    sap: {
      ui: {
        define(dependencies, factory) {
          assert.strictEqual(dependencies.length, 0)
          module = factory()
        }
      }
    }
  }
  vm.runInNewContext(read(HELPER), sandbox)
  return module
}

function textProvider(key, args = []) {
  const values = {
    aiReviewLoading: 'Preparing suggestion...',
    aiReviewExplanationUnavailable: 'Suggestion details are unavailable. Review the standard details before deciding.',
    aiReviewStatusReady: 'Ready for review',
    aiReviewStatusLowConfidence: 'Review carefully',
    aiReviewStatusDisabled: 'Suggestion support is currently unavailable',
    aiReviewStatusUnavailable: 'Suggestion could not be prepared',
    aiReviewStatusReviewRequired: 'Review required',
    aiReviewConfidence: `${args[1]} - confidence ${args[0]}%`,
    aiReviewDecisionHint: 'Review this suggestion and choose manually.'
  }
  return values[key] || key
}

function assertNoInternalCopy(label, value) {
  assert(!FORBIDDEN_UI_COPY.test(String(value || '')), `${label} contains internal/dev-facing copy: ${value}`)
}

function parseProperties(file) {
  return read(file)
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

function verifyHelperStates() {
  const AiReviewUi = loadAiReviewUi()

  const loading = AiReviewUi.loading(textProvider)
  assert.strictEqual(loading.state, 'Information')
  assert.strictEqual(loading.requiresReview, true)
  assertNoInternalCopy('loading explanation', loading.explanation)
  rec('helper exposes loading state with review-required semantics', true)

  const ready = AiReviewUi.decorateResult({
    explanation: 'Matches this component and has available capacity.',
    providerStatus: 'SUCCESS',
    confidence: 0.82,
    requiresReview: true
  }, textProvider)
  assert.strictEqual(ready.state, 'Information')
  assert(ready.meta.includes('Ready for review'))
  assert(ready.meta.includes('82%'))
  assert.strictEqual(ready.requiresReview, true)
  rec('helper maps successful suggestion to ready-for-review state', true)

  const lowConfidence = AiReviewUi.decorateResult({
    explanation: 'Candidate partly matches the classification.',
    providerStatus: 'SUCCESS',
    confidence: 0.42,
    requiresReview: true
  }, textProvider)
  assert.strictEqual(lowConfidence.state, 'Warning')
  assert(lowConfidence.meta.includes('Review carefully'))
  rec('helper maps low confidence to warning state', true)

  const disabled = AiReviewUi.decorateResult({
    explanation: 'Fallback details are available.',
    providerStatus: 'AI_DISABLED',
    confidence: null,
    requiresReview: true
  }, textProvider)
  assert.strictEqual(disabled.state, 'Information')
  assert.strictEqual(disabled.meta, 'Suggestion support is currently unavailable')
  assertNoInternalCopy('disabled meta', disabled.meta)
  rec('helper maps disabled state to non-technical user copy', true)

  const unsafe = AiReviewUi.decorateResult({
    explanation: 'provider stack token sql debug detail',
    providerStatus: 'AI_PROVIDER_ERROR',
    confidence: null,
    requiresReview: true
  }, textProvider)
  assert.strictEqual(unsafe.explanation, 'Suggestion details are unavailable. Review the standard details before deciding.')
  assert.strictEqual(unsafe.state, 'Warning')
  assertNoInternalCopy('unsafe fallback explanation', unsafe.explanation)
  rec('helper replaces internal/provider-like copy with safe fallback', true)
}

function verifySmartAssignUsesPattern() {
  const source = read(SMART_ASSIGN)
  assert(source.includes('../ai/AiReviewUi'))
  assert(source.includes('AiReviewUi.decorateResult'))
  assert(source.includes('AiReviewUi.loading'))
  assert(source.includes('aiDecisionHint'))
  assert(!/<(div|span|style)\b/i.test(source), 'Smart Assign must not embed raw HTML/CSS')
  rec('Smart Assign uses reusable AI review helper without raw HTML/CSS', true)
}

function verifyI18nCopy() {
  const requiredKeys = [
    'aiReviewLoading',
    'aiReviewExplanationUnavailable',
    'aiReviewStatusReady',
    'aiReviewStatusLowConfidence',
    'aiReviewStatusDisabled',
    'aiReviewStatusUnavailable',
    'aiReviewStatusReviewRequired',
    'aiReviewConfidence',
    'aiReviewDecisionHint'
  ]

  for (const file of I18N) {
    const source = read(file)
    for (const key of requiredKeys) {
      assert(source.includes(`${key}=`), `${path.basename(file)} missing ${key}`)
    }

    const aiRows = parseProperties(file).filter(row => /^(aiReview|smartAssignAi)/.test(row.key))
    for (const row of aiRows) {
      assertNoInternalCopy(`${path.basename(file)} ${row.key}`, row.value)
    }
  }
  rec('i18n has reusable AI review keys with no internal/dev-facing copy', true)
}

function main() {
  console.log('')
  console.log('==================================================')
  console.log(' IDTS-70 AI Review UI Pattern Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==================================================')

  try {
    verifyHelperStates()
    verifySmartAssignUsesPattern()
    verifyI18nCopy()
  } catch (error) {
    rec('unhandled verification error', false, error && error.stack ? error.stack : String(error))
  }

  console.log('')
  console.log('==================================================')
  console.log(` TOTAL: ${pass} PASS  |  ${fail} FAIL`)
  console.log('==================================================')

  process.exit(fail > 0 ? 1 : 0)
}

main()
