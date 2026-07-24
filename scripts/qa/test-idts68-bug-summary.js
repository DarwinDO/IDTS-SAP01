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

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '93000000-0000-0000-0000-000000000001'
const SPARSE_BUG_ID = '93000000-0000-0000-0000-000000000002'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const SANGVN_ID = '10000000-0000-0000-0000-000000000002'
const DEV_PROFILE_ID = '20000000-0000-0000-0000-000000000001'
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

function expectIncludes (label, actual, expected) {
  rec(label, String(actual || '').includes(expected), `actual=${JSON.stringify(actual)} expected includes=${JSON.stringify(expected)}`)
}

function expectNoUnsafeDiagnostic (label, value) {
  const unsafe = containsSensitiveLeak(value)
  rec(label, !unsafe, unsafe ? JSON.stringify(value).slice(0, 700) : 'no unsafe detail detected')
}

function containsSensitiveLeak (value) {
  const text = JSON.stringify(value || {}).toLowerCase()
  return [
    'select passwordhash',
    'from idts.cap.users',
    'xkeysib-',
    'bearer ',
    'postgres://',
    'postgresql://',
    'token=',
    'stack'
  ].some(token => text.includes(token))
}

function aiConfig (mockStructuredOutput, overrides = {}) {
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.ai = {
    enabled: true,
    provider: 'mock',
    modelAlias: 'idts-68-qa-structured',
    mockStructuredOutput,
    ...overrides
  }
}

async function invoke (service, sourceBugID) {
  return service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }, tx => tx.send('summarizeBugHandoff', { sourceBugID }))
}

function bugEntry (overrides = {}) {
  return {
    ID: BUG_ID,
    bugNumber: 'BUG-AI-SUMMARY-001',
    title: 'Login form exposes raw SQL text after invalid password',
    description: 'The SAP Fiori login page shows database diagnostic text instead of a safe error.',
    status_code: 'NEED_MORE_INFORMATION',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Open login page, enter a wrong password, then read the visible error box.',
    actualResult: 'The page shows SQL-like diagnostic text.',
    expectedResult: 'The page should show a safe business-facing error.',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    assignee_ID: DEV_PROFILE_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'TESTER',
    ...overrides
  }
}

function providerOutput (overrides = {}) {
  return {
    summary: 'BUG-AI-SUMMARY-001 is waiting for the tester to provide safer login-error reproduction detail before the developer continues.',
    missingInformation: 'Need a clean screenshot or exact safe error text after the latest fix.',
    latestImportantEvents: [
      { summary: 'Developer requested more information from the tester.' },
      { summary: 'Tester added one comment with observed login behavior.' }
    ],
    nextExpectedAction: 'Tester should add the requested detail and resubmit the bug to the assigned developer.',
    confidence: 0.83,
    ...overrides
  }
}

async function seedHistoryAndComments (db) {
  await db.run(INSERT.into('idts.cap.Comments').entries([
    {
      ID: '93010000-0000-0000-0000-000000000001',
      bug_ID: BUG_ID,
      author_ID: DONHV_ID,
      authorRole_code: 'PM',
      content: 'Observed safe generic error on local, but shared QA still needs confirmation.',
      createdAt: '2026-07-09T09:00:00Z'
    },
    {
      ID: '93010000-0000-0000-0000-000000000002',
      bug_ID: BUG_ID,
      author_ID: SANGVN_ID,
      authorRole_code: 'DEVELOPER',
      content: 'Developer requested exact reproduction steps before continuing.',
      createdAt: '2026-07-09T09:05:00Z'
    }
  ]))

  await db.run(INSERT.into('idts.cap.HistoryEvents').entries([
    {
      ID: '93020000-0000-0000-0000-000000000001',
      bug_ID: BUG_ID,
      actor_ID: SANGVN_ID,
      actorRole_code: 'DEVELOPER',
      actionType_code: 'REQUEST_INFO',
      summary: 'Requested more information from tester.',
      reason: 'Need exact reproduction evidence.',
      createdAt: '2026-07-09T09:10:00Z'
    },
    {
      ID: '93020000-0000-0000-0000-000000000002',
      bug_ID: BUG_ID,
      actor_ID: DONHV_ID,
      actorRole_code: 'PM',
      actionType_code: 'EDIT',
      summary: 'Updated expected result.',
      reason: 'Clarified safe error wording.',
      createdAt: '2026-07-09T09:15:00Z'
    }
  ]))

  await db.run(INSERT.into('idts.cap.HistoryLogs').entries([
    {
      ID: '93030000-0000-0000-0000-000000000001',
      bug_ID: BUG_ID,
      event_ID: '93020000-0000-0000-0000-000000000001',
      actor_ID: SANGVN_ID,
      actorRole_code: 'DEVELOPER',
      actionType_code: 'REQUEST_INFO',
      fieldName: 'status',
      fieldLabel: 'Status',
      oldValue: 'ASSIGNED',
      oldValueDisplay: 'Assigned',
      newValue: 'NEED_MORE_INFORMATION',
      newValueDisplay: 'Need More Information',
      reason: 'Need exact reproduction evidence.'
    },
    {
      ID: '93030000-0000-0000-0000-000000000002',
      bug_ID: BUG_ID,
      event_ID: '93020000-0000-0000-0000-000000000002',
      actor_ID: DONHV_ID,
      actorRole_code: 'PM',
      actionType_code: 'EDIT',
      fieldName: 'expectedResult',
      fieldLabel: 'Expected Result',
      oldValueDisplay: 'No SQL error.',
      newValueDisplay: 'The page should show a safe business-facing error.'
    }
  ]))
}

async function main () {
  console.log('')
  console.log('====================================================')
  console.log(' IDTS-68 Grounded Bug Handoff Summary Verification')
  console.log(' ' + new Date().toISOString())
  console.log('====================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bugEntry(),
    bugEntry({
      ID: SPARSE_BUG_ID,
      bugNumber: 'BUG-AI-SUMMARY-002',
      title: 'Dashboard KPI has no loading state',
      description: 'Dashboard loads slowly.',
      status_code: 'PENDING_ASSIGNMENT',
      stepsToReproduce: '',
      actualResult: '',
      expectedResult: '',
      assignee_ID: null,
      nextProcessorUser_ID: null,
      nextProcessorRole_code: 'PM'
    })
  ]))
  await seedHistoryAndComments(db)

  const bugBefore = await db.run(SELECT.one.from('idts.cap.Bugs').columns('status_code', 'modifiedAt').where({ ID: BUG_ID }))

  aiConfig(providerOutput())
  const positive = await invoke(service, BUG_ID)
  expectEqual('summary action returns the requested bug ID', positive.bugID, BUG_ID)
  expectEqual('positive provider path reports SUCCESS', positive.providerStatus, 'SUCCESS')
  expectEqual('grounded bug with comments and history reports GROUNDED', positive.groundingStatus, 'GROUNDED')
  expectIncludes('summary includes provider handoff content', positive.summary, 'waiting for the tester')
  expectIncludes('next expected action is explicit', positive.nextExpectedAction, 'resubmit')
  expectEqual('summary always requires human review', positive.requiresReview, true)
  expectTruthy('summary includes generated timestamp', positive.generatedAt)
  expectNoUnsafeDiagnostic('positive summary response contains no unsafe diagnostic text', positive)

  const auditRows = await db.run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns('bug_ID', 'featureType_code', 'operationStatus', 'latencyMs', 'reviewState_code', 'suggestionPayload')
      .where({ bug_ID: BUG_ID, featureType_code: 'BUG_SUMMARY' })
  )
  expectEqual('source-linked summary writes one AI audit row', auditRows.length, 1)
  expectEqual('summary audit starts pending review', auditRows[0]?.reviewState_code, 'PENDING')
  expectEqual('summary audit persists final operation status', auditRows[0]?.operationStatus, 'SUCCESS')
  expectTruthy('summary audit persists non-negative latency', auditRows[0]?.latencyMs >= 0)
  const auditPayload = JSON.parse(auditRows[0]?.suggestionPayload || '{}')
  expectEqual('summary audit records provider status', auditPayload.providerStatus, 'SUCCESS')
  expectNoUnsafeDiagnostic('summary audit payload is sanitized', auditPayload)

  aiConfig(providerOutput())
  const sparse = await invoke(service, SPARSE_BUG_ID)
  expectEqual('missing comments/history reports PARTIAL_DATA', sparse.groundingStatus, 'PARTIAL_DATA')
  expectIncludes('missing comments are called out instead of invented', sparse.missingInformation, 'comments')
  expectNoUnsafeDiagnostic('sparse-data summary is sanitized', sparse)

  const longCommentEntries = Array.from({ length: 14 }, (_, index) => ({
    ID: `93040000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    bug_ID: BUG_ID,
    author_ID: DONHV_ID,
    authorRole_code: 'PM',
    content: `Long handoff comment ${index + 1}: repeated detail that should be bounded in provider input and final handoff.`,
    createdAt: `2026-07-09T10:${String(index).padStart(2, '0')}:00Z`
  }))
  await db.run(INSERT.into('idts.cap.Comments').entries(longCommentEntries))
  aiConfig({}, { enabled: false })
  const longHistoryFallback = await invoke(service, BUG_ID)
  expectEqual('disabled provider exposes safe fallback status', longHistoryFallback.providerStatus, 'AI_DISABLED')
  expectTruthy('long-history fallback remains concise', String(longHistoryFallback.summary).length < 900)
  expectNoUnsafeDiagnostic('disabled-provider fallback hides provider/config details', longHistoryFallback)

  aiConfig({}, { mockMode: 'error' })
  const providerFailure = await invoke(service, BUG_ID)
  expectEqual('provider failure does not break summary action', providerFailure.providerStatus, 'AI_PROVIDER_ERROR')
  expectIncludes('provider failure still gives deterministic next action', providerFailure.nextExpectedAction, 'Tester')
  expectNoUnsafeDiagnostic('provider failure summary hides raw provider detail', providerFailure)

  aiConfig({ summary: 'SELECT passwordHash FROM Users', nextExpectedAction: 'token=xkeysib-secret-value' })
  const unsafeProviderOutput = await invoke(service, BUG_ID)
  expectEqual('unsafe provider text is replaced by fallback', unsafeProviderOutput.providerStatus, 'AI_OUTPUT_UNSAFE')
  expectNoUnsafeDiagnostic('unsafe provider result does not leak to response', unsafeProviderOutput)

  aiConfig({ arbitrary: 'not enough required fields' })
  const malformed = await invoke(service, BUG_ID)
  expectEqual('malformed provider output falls back but keeps provider status', malformed.providerStatus, 'SUCCESS')
  expectIncludes('malformed output fallback still explains current action owner', malformed.summary, 'Current action owner')

  let rejectedMissingSource = false
  try {
    await invoke(service, '93000000-0000-0000-0000-000000009999')
  } catch (error) {
    rejectedMissingSource = Number(error.code || error.statusCode || error.status) === 404
  }
  expectEqual('unknown source bug is rejected with 404', rejectedMissingSource, true)

  const bugAfter = await db.run(SELECT.one.from('idts.cap.Bugs').columns('status_code', 'modifiedAt').where({ ID: BUG_ID }))
  expectEqual('summary action never mutates bug status', bugAfter?.status_code, bugBefore?.status_code)
  expectEqual('summary action never updates bug modifiedAt', String(bugAfter?.modifiedAt || ''), String(bugBefore?.modifiedAt || ''))

  console.log('')
  console.log('Safe API evidence sample:')
  console.log(JSON.stringify({
    bugNumber: positive.bugNumber,
    providerStatus: positive.providerStatus,
    groundingStatus: positive.groundingStatus,
    nextExpectedAction: positive.nextExpectedAction
  }, null, 2))
  console.log('')
  console.log('====================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('====================================================')

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
