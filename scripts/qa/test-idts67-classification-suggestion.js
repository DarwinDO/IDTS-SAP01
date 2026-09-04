#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { fixtureUser } = require('./idts-test-users')
const { INSERT, SELECT, UPDATE } = cds.ql
const { buildClassificationSuggestions } = require('../../srv/ai')
const {
  buildClassificationOutputSchema,
  buildProviderCatalogInput
} = require('../../srv/ai/classification-suggestion')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '92000000-0000-0000-0000-000000000001'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const SAP_MODULE_ID = '30000000-0000-0000-0000-000000000001'
const COMPONENT_ID = '40000000-0000-0000-0000-000000000005'
const CATEGORY_ID = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY_ID = '60000000-0000-0000-0000-000000000009'

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectTruthy (label, actual) {
  rec(label, Boolean(actual), `actual=${JSON.stringify(actual)}`)
}

function expectNoUnsafeDiagnostic (label, value) {
  const unsafe = containsUnsafeDiagnosticText(value)
  rec(label, !unsafe, unsafe ? JSON.stringify(value).slice(0, 500) : 'no unsafe detail detected')
}

function aiConfig (mockStructuredOutput, overrides = {}) {
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.ai = {
    enabled: true,
    provider: 'mock',
    modelAlias: 'idts-67-qa-structured',
    mockStructuredOutput,
    ...overrides
  }
}

async function invoke (service, data) {
  return service.tx({
    user: fixtureUser(cds, 'DonHV', ['PM', 'authenticated-user'])
  }, tx => tx.send('suggestClassification', data))
}

function bugEntry () {
  return {
    ID: BUG_ID,
    bugNumber: 'BUG-AI-CLASSIFY-001',
    title: 'Login page shows a raw SQL error after invalid password',
    description: 'The Fiori login screen displays a database column name and SQL fragment instead of a safe error message.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Open login page, enter invalid credentials, then inspect the error message.',
    actualResult: 'Raw SQL text is visible to the user.',
    expectedResult: 'A safe generic login error should be shown.',
    sapModule_ID: SAP_MODULE_ID,
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

function validProviderOutput (overrides = {}) {
  return {
    sapModule: { catalogRef: 'SM1', code: 'FI', confidence: 0.81, reason: 'Financial approval context is mentioned.' },
    applicationComponent: { catalogRef: 'AC1', code: 'IDTS_FIORI_UI', confidence: 0.88, reason: 'The issue is visible on a Fiori screen.' },
    defectCategory: { catalogRef: 'DC1', code: 'FIORI_UI5', confidence: 0.86, reason: 'The failure is UI-facing.' },
    priority: { catalogRef: 'P1', code: 'HIGH', confidence: 0.83, reason: 'Login impact is serious for QA.' },
    severity: { catalogRef: 'S1', code: 'MAJOR', confidence: 0.84, reason: 'The defect blocks a normal user flow.' },
    ...overrides
  }
}

async function main () {
  console.log('')
  console.log('========================================================')
  console.log(' IDTS-67 AI Classification Suggestion Verification')
  console.log(' ' + new Date().toISOString())
  console.log('========================================================')

  const schemaCatalogs = buildProviderCatalogInput({
    sapModules: [{ code: 'FI', name: 'Financial Accounting', active: true }],
    applicationComponents: [{ code: 'IDTS_UI', name: 'IDTS UI', active: true }],
    defectCategories: [{ code: 'UI', name: 'UI defect', active: true }],
    priorityValues: [{ code: 'HIGH', name: 'High', active: true }],
    severityValues: [{ code: 'MAJOR', name: 'Major', active: true }]
  })
  const classificationSchema = buildClassificationOutputSchema(schemaCatalogs)
  expectEqual('classification schema requires all five grounded fields', classificationSchema.required.length, 5)
  expectEqual('classification schema constrains SAP Module to a short catalog reference', classificationSchema.properties.sapModule.properties.catalogRef.enum[0], 'SM1')
  expectEqual('classification schema does not expose catalog UUIDs', JSON.stringify(classificationSchema).includes(SAP_MODULE_ID), false)

  const rateLimitedRows = buildClassificationSuggestions({
    input: {},
    catalogs: {
      sapModules: [],
      applicationComponents: [],
      defectCategories: [],
      priorityValues: [],
      severityValues: []
    },
    providerResult: { ok: false, status: 'AI_RATE_LIMITED' }
  })
  expectEqual('rate-limited classification uses explicit safe local fallback wording', rateLimitedRows.every(row => row.reason === 'AI is temporarily busy. Safe local suggestions are shown. Try again later.'), true)
  expectNoUnsafeDiagnostic('rate-limited classification wording contains no provider diagnostic', rateLimitedRows)

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  await db.run(INSERT.into('idts.cap.Bugs').entries([bugEntry()]))

  aiConfig(validProviderOutput())
  const positive = await invoke(service, { sourceBugID: BUG_ID })
  expectEqual('classification action returns five review rows', positive.length, 5)
  expectEqual('provider-backed priority suggestion uses active catalog code', positive.find(row => row.field === 'priority')?.valueCode, 'HIGH')
  expectEqual('provider-backed severity suggestion uses active catalog code', positive.find(row => row.field === 'severity')?.valueCode, 'MAJOR')
  expectEqual('provider-backed component suggestion resolves catalog ID', positive.find(row => row.field === 'applicationComponent')?.valueID, COMPONENT_ID)
  expectEqual('high-confidence valid provider suggestion status', positive.find(row => row.field === 'defectCategory')?.status, 'SUGGESTED')
  expectEqual('provider-backed rows are explicitly labelled as AI suggestions', positive.every(row => row.suggestionSource === 'AI'), true)
  expectEqual('classification suggestions always require human review', positive.every(row => row.requiresReview === true), true)
  expectTruthy('persisted source classification returns suggestion audit ID', positive[0]?.suggestionID)
  expectEqual('all classification rows share one review audit ID', positive.every(row => row.suggestionID === positive[0]?.suggestionID), true)
  expectNoUnsafeDiagnostic('positive response contains no unsafe diagnostic text', positive)

  const auditRows = await db.run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns('ID', 'bug_ID', 'featureType_code', 'operationStatus', 'latencyMs', 'reviewState_code', 'suggestionPayload')
      .where({ bug_ID: BUG_ID, featureType_code: 'CLASSIFICATION' })
  )
  expectEqual('source-linked classification writes one AI audit row', auditRows.length, 1)
  expectEqual('classification review ID matches persisted audit row', positive[0]?.suggestionID, auditRows[0]?.ID)
  expectEqual('classification audit starts pending review', auditRows[0]?.reviewState_code, 'PENDING')
  expectEqual('classification audit persists final operation status', auditRows[0]?.operationStatus, 'SUCCESS')
  expectTruthy('classification audit persists non-negative latency', auditRows[0]?.latencyMs >= 0)
  const auditPayload = JSON.parse(auditRows[0]?.suggestionPayload || '{}')
  expectEqual('classification audit records provider status', auditPayload.providerStatus, 'SUCCESS')
  expectEqual(
    'classification audit snapshots source values for stale-apply protection',
    JSON.stringify(auditPayload.sourceClassification),
    JSON.stringify({
      sapModuleID: SAP_MODULE_ID,
      applicationComponentID: COMPONENT_ID,
      defectCategoryID: CATEGORY_ID,
      priorityCode: 'HIGH',
      severityCode: 'MAJOR'
    })
  )
  expectNoUnsafeDiagnostic('classification audit payload is sanitized', auditPayload)

  const bugBeforeInvalid = await db.run(SELECT.one.from('idts.cap.Bugs').columns('priority_code').where({ ID: BUG_ID }))
  aiConfig(validProviderOutput({ priority: { code: 'NOT_A_REAL_PRIORITY', confidence: 0.91, reason: 'Provider invented a value.' } }))
  const invalid = await invoke(service, {
    title: 'Login failure exposes SQL on screen',
    description: 'Invalid password shows SQL details to the user.'
  })
  const invalidPriority = invalid.find(row => row.field === 'priority')
  expectEqual('unknown provider priority is rejected as invalid', invalidPriority?.status, 'INVALID_PROVIDER_VALUE')
  expectEqual('unknown provider priority is not echoed as catalog value', invalidPriority?.valueCode, null)
  const bugAfterInvalid = await db.run(SELECT.one.from('idts.cap.Bugs').columns('priority_code').where({ ID: BUG_ID }))
  expectEqual('classification suggestion never mutates the bug record', bugAfterInvalid?.priority_code, bugBeforeInvalid?.priority_code)

  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: false }).where({ code: 'LOW' }))
  aiConfig(validProviderOutput({ priority: { code: 'LOW', confidence: 0.9, reason: 'Provider suggested inactive value.' } }))
  const inactive = await invoke(service, {
    title: 'Minor layout issue',
    description: 'A cosmetic typo appears on the login card.'
  })
  expectEqual('inactive provider priority is rejected', inactive.find(row => row.field === 'priority')?.status, 'INVALID_PROVIDER_VALUE')

  aiConfig(validProviderOutput({ severity: { code: 'MAJOR', confidence: 0.42, reason: 'Weak signal.' } }))
  const lowConfidence = await invoke(service, {
    title: 'Possible Fiori screen issue',
    description: 'The issue might be frontend related but needs review.'
  })
  expectEqual('low-confidence provider value is explicit', lowConfidence.find(row => row.field === 'severity')?.status, 'LOW_CONFIDENCE')

  aiConfig({}, { enabled: false })
  const disabled = await invoke(service, { sourceBugID: BUG_ID })
  expectEqual('disabled provider is exposed as safe provider status', disabled[0]?.providerStatus, 'AI_DISABLED')
  expectEqual('disabled provider rows are explicitly labelled as rules-based fallback', disabled.every(row => row.suggestionSource === 'RULES'), true)
  expectTruthy('disabled provider still returns review-safe fallback rows', disabled.length)
  expectNoUnsafeDiagnostic('disabled provider response has no unsafe diagnostic text', disabled)

  aiConfig({}, { mockMode: 'error' })
  const providerFailure = await invoke(service, { sourceBugID: BUG_ID })
  expectEqual('provider failure does not break action', providerFailure[0]?.providerStatus, 'AI_PROVIDER_ERROR')
  expectNoUnsafeDiagnostic('provider failure response hides raw provider details', providerFailure)

  const auditAfterPreCreate = await db.run(
    SELECT.one.from('idts.cap.AiSuggestions').columns('count(*) as count').where({ featureType_code: 'CLASSIFICATION' })
  )
  aiConfig(validProviderOutput())
  const preCreate = await invoke(service, {
    title: 'Create form classification suggestion before save',
    description: 'The user wants classification help before the bug is persisted.'
  })
  expectEqual('pre-create classification has no persisted review ID', preCreate.every(row => !row.suggestionID), true)
  const auditAfterPreCreateAgain = await db.run(
    SELECT.one.from('idts.cap.AiSuggestions').columns('count(*) as count').where({ featureType_code: 'CLASSIFICATION' })
  )
  expectEqual('pre-create suggestion does not invent audit bug link', Number(auditAfterPreCreateAgain?.count), Number(auditAfterPreCreate?.count))

  console.log('')
  console.log('========================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('========================================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(row => !row.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 1000))
  process.exit(1)
})
