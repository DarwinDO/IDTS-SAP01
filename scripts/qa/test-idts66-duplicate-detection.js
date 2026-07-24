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
const { INSERT, SELECT } = cds.ql
const {
  createAiProvider,
  normalizeAiConfig,
  rankSimilarBugCandidates
} = require('../../srv/ai')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

const RESULTS = []
let PASS = 0
let FAIL = 0

const SOURCE_ID = '91000000-0000-0000-0000-000000000001'
const SIMILAR_ID = '91000000-0000-0000-0000-000000000002'
const UNRELATED_ID = '91000000-0000-0000-0000-000000000003'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const COMPONENT_ID = '40000000-0000-0000-0000-000000000001'
const CATEGORY_ID = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY_ID = '60000000-0000-0000-0000-000000000001'

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
  rec(label, !unsafe, unsafe ? JSON.stringify(value) : 'no unsafe detail detected')
}

function aiConfig (overrides = {}) {
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.ai = {
    enabled: true,
    provider: 'mock',
    embeddingModelAlias: 'idts-66-qa-embedding',
    mockEmbeddingDimensions: 12,
    ...overrides
  }
}

async function invoke (service, data) {
  return service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }, tx => tx.send('suggestSimilarBugs', data))
}

function bugEntry ({ ID, bugNumber, title, description, componentID = COMPONENT_ID, categoryID = CATEGORY_ID, componentCategoryID = COMPONENT_CATEGORY_ID }) {
  return {
    ID,
    bugNumber,
    title,
    description,
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Submit the form and inspect the resulting screen.',
    actualResult: 'The observed result does not match the expected behavior.',
    expectedResult: 'The operation should complete successfully.',
    applicationComponent_ID: componentID,
    defectCategory_ID: categoryID,
    componentCategory_ID: componentCategoryID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

async function main () {
  console.log('')
  console.log('=====================================================')
  console.log(' IDTS-66 Duplicate/Similar Detection Verification')
  console.log(' ' + new Date().toISOString())
  console.log('=====================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bugEntry({
      ID: SOURCE_ID,
      bugNumber: 'BUG-AI-001',
      title: 'Payment approval button remains disabled after valid invoice submission',
      description: 'A tester submits a valid supplier invoice but the payment approval button remains disabled on the object page.'
    }),
    bugEntry({
      ID: SIMILAR_ID,
      bugNumber: 'BUG-AI-002',
      title: 'Payment approval button stays disabled after invoice submission',
      description: 'After a valid supplier invoice is submitted, the approval button is still disabled on the payment object page.'
    }),
    bugEntry({
      ID: UNRELATED_ID,
      bugNumber: 'BUG-AI-003',
      title: 'Dashboard chart uses an incorrect color palette',
      description: 'The monthly workload chart should use semantic colors for overdue and completed items.',
      componentID: '40000000-0000-0000-0000-000000000002',
      categoryID: '50000000-0000-0000-0000-000000000004',
      componentCategoryID: '60000000-0000-0000-0000-000000000005'
    })
  ]))

  const linksBefore = await db.run(SELECT.one.from('idts.cap.DuplicateLinks').columns('count(*) as count'))

  aiConfig()
  const positive = await invoke(service, {
    sourceBugID: SOURCE_ID,
    limit: 5,
    minScore: 0.35
  })
  expectTruthy('positive search returns at least one candidate', positive.length)
  expectEqual('similar seeded bug is ranked first', positive[0]?.bugID, SIMILAR_ID)
  expectTruthy('top candidate has a bounded score', Number(positive[0]?.score) >= 0.35 && Number(positive[0]?.score) <= 1)
  expectTruthy('top candidate includes a concise human-review reason', /human review/i.test(positive[0]?.reason || ''))
  expectEqual('successful provider path uses an embedding', positive[0]?.embeddingUsed, true)
  expectEqual('successful provider path reports SUCCESS', positive[0]?.providerStatus, 'SUCCESS')
  expectTruthy('persisted source search returns suggestion audit ID', positive[0]?.suggestionID)
  expectEqual('all similar candidates share one review audit ID', positive.every(row => row.suggestionID === positive[0]?.suggestionID), true)
  expectEqual('source bug is excluded from its own candidates', positive.some(row => row.bugID === SOURCE_ID), false)
  expectNoUnsafeDiagnostic('positive response contains no unsafe diagnostic text', positive)

  const unrelated = positive.find(row => row.bugID === UNRELATED_ID)
  rec(
    'unrelated bug is absent or remains below similar confidence',
    !unrelated || Number(unrelated.score) < 0.55,
    unrelated ? `score=${unrelated.score}` : 'not returned'
  )

  const auditRows = await db.run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns('ID', 'bug_ID', 'featureType_code', 'confidence', 'suggestionPayload', 'reviewState_code')
      .where({ bug_ID: SOURCE_ID, featureType_code: 'DUPLICATE_DETECTION' })
  )
  expectEqual('source-linked search writes one audit row', auditRows.length, 1)
  expectEqual('candidate review ID matches persisted audit row', positive[0]?.suggestionID, auditRows[0]?.ID)
  expectEqual('audit row starts in pending review', auditRows[0]?.reviewState_code, 'PENDING')
  const positiveAuditPayload = JSON.parse(auditRows[0]?.suggestionPayload || '{}')
  expectEqual('audit payload records provider status', positiveAuditPayload.providerStatus, 'SUCCESS')
  expectNoUnsafeDiagnostic('audit payload contains no prompt, credential, or raw provider response', positiveAuditPayload)

  const preCreateAuditCount = auditRows.length
  const preCreate = await invoke(service, {
    title: 'Payment approval button disabled after supplier invoice submission',
    description: 'The approval button remains disabled after a valid invoice is submitted.',
    applicationComponentID: COMPONENT_ID,
    defectCategoryID: CATEGORY_ID,
    componentCategoryID: COMPONENT_CATEGORY_ID
  })
  expectTruthy('pre-create search works without a persisted source bug', preCreate.length)
  expectEqual('pre-create search has no persisted review ID', preCreate.every(row => !row.suggestionID), true)
  const auditAfterPreCreate = await db.run(
    SELECT.one.from('idts.cap.AiSuggestions').columns('count(*) as count').where({ featureType_code: 'DUPLICATE_DETECTION' })
  )
  expectEqual('pre-create search does not invent an audit bug link', Number(auditAfterPreCreate?.count), preCreateAuditCount)

  aiConfig({ enabled: false })
  const disabled = await invoke(service, { sourceBugID: SOURCE_ID })
  expectTruthy('disabled provider falls back to deterministic matching', disabled.length)
  expectEqual('disabled provider exposes a safe status', disabled[0]?.providerStatus, 'AI_DISABLED')
  expectEqual('disabled provider marks embedding as unused', disabled[0]?.embeddingUsed, false)

  aiConfig({ mockMode: 'error' })
  const providerFailure = await invoke(service, { sourceBugID: SOURCE_ID })
  expectTruthy('provider failure falls back without breaking the action', providerFailure.length)
  expectEqual('provider failure is reported generically', providerFailure[0]?.providerStatus, 'AI_PROVIDER_ERROR')
  expectNoUnsafeDiagnostic('provider failure response excludes raw SQL and secrets', providerFailure)

  const fallbackAuditRows = await db.run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns('suggestionPayload')
      .where({ bug_ID: SOURCE_ID, featureType_code: 'DUPLICATE_DETECTION' })
  )
  const fallbackStatuses = fallbackAuditRows.map(row => JSON.parse(row.suggestionPayload).providerStatus)
  expectTruthy('audit records disabled-provider fallback status', fallbackStatuses.includes('AI_DISABLED'))
  expectTruthy('audit records provider-error fallback status', fallbackStatuses.includes('AI_PROVIDER_ERROR'))

  aiConfig()
  const noResult = await invoke(service, {
    title: 'Quantum telemetry satellite orbit synchronization',
    description: 'A telescope calibration sequence for deep space navigation.',
    minScore: 0.9
  })
  expectEqual('unrelated high-threshold search returns no misleading result', noResult.length, 0)

  const malformedProvider = {
    embedding: async () => ({
      ok: true,
      status: 'SUCCESS',
      data: { embedding: ['not-a-number'] }
    })
  }
  const malformedRanking = await rankSimilarBugCandidates({
    input: {
      title: 'Payment approval button remains disabled',
      description: 'Valid invoice submission keeps the approval button disabled.',
      applicationComponentID: COMPONENT_ID,
      defectCategoryID: CATEGORY_ID,
      componentCategoryID: COMPONENT_CATEGORY_ID
    },
    candidates: [{
      ID: SIMILAR_ID,
      bugNumber: 'BUG-AI-002',
      title: 'Payment approval button stays disabled',
      description: 'The approval button stays disabled after invoice submission.',
      status_code: 'PENDING_ASSIGNMENT',
      applicationComponent_ID: COMPONENT_ID,
      defectCategory_ID: CATEGORY_ID,
      componentCategory_ID: COMPONENT_CATEGORY_ID
    }],
    provider: malformedProvider,
    minScore: 0.35
  })
  const malformed = malformedRanking.candidates
  expectTruthy('malformed embedding output falls back to lexical matching', malformed.length)
  expectEqual('malformed embedding is not treated as used', malformed[0]?.embeddingUsed, false)
  expectEqual('malformed embedding status is explicit and safe', malformed[0]?.providerStatus, 'AI_EMBEDDING_INVALID')

  let rejectedEmptyInput = false
  try {
    await invoke(service, {})
  } catch (error) {
    rejectedEmptyInput = Number(error.code || error.statusCode || error.status) === 400
  }
  expectEqual('empty search input is rejected with 400', rejectedEmptyInput, true)

  let rejectedUnknownSource = false
  try {
    await invoke(service, { sourceBugID: '91000000-0000-0000-0000-000000000099' })
  } catch (error) {
    rejectedUnknownSource = Number(error.code || error.statusCode || error.status) === 404
  }
  expectEqual('unknown source bug is rejected with 404', rejectedUnknownSource, true)

  const linksAfter = await db.run(SELECT.one.from('idts.cap.DuplicateLinks').columns('count(*) as count'))
  expectEqual('suggestions never create DuplicateLinks automatically', Number(linksAfter?.count), Number(linksBefore?.count))

  console.log('')
  console.log('Safe API evidence sample:')
  console.log(JSON.stringify({ topCandidate: positive[0], noResultCount: noResult.length }, null, 2))
  console.log('')
  console.log('=====================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('=====================================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(row => !row.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }
}

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1000))
  process.exit(1)
})
