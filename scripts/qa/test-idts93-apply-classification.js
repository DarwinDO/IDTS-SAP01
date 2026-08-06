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
const { INSERT, SELECT, UPDATE } = cds.ql
const { createAiSuggestion } = require('../../srv/ai')

const RESULTS = []
let PASS = 0
let FAIL = 0

const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const SOURCE = Object.freeze({
  sapModuleID: '30000000-0000-0000-0000-000000000001',
  applicationComponentID: '40000000-0000-0000-0000-000000000005',
  defectCategoryID: '50000000-0000-0000-0000-000000000001',
  componentCategoryID: '60000000-0000-0000-0000-000000000013',
  priorityCode: 'HIGH',
  severityCode: 'MAJOR'
})
const TARGET = Object.freeze({
  sapModuleID: '30000000-0000-0000-0000-000000000002',
  applicationComponentID: '40000000-0000-0000-0000-000000000006',
  defectCategoryID: '50000000-0000-0000-0000-000000000002',
  componentCategoryID: '60000000-0000-0000-0000-000000000011',
  priorityCode: 'CRITICAL',
  severityCode: 'BLOCKER'
})

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

function errorStatus (error) {
  return Number(error?.code || error?.statusCode || error?.status)
}

async function expectRejected (label, action, expectedStatus) {
  try {
    await action()
    rec(label, false, `expected status ${expectedStatus}, action resolved`)
  } catch (error) {
    rec(label, errorStatus(error) === expectedStatus, `status=${errorStatus(error)} message=${error.message}`)
  }
}

function requestUser (id, role) {
  return new cds.User({ id, roles: [role, 'authenticated-user'] })
}

async function invoke (service, action, suggestionID, id = 'DonHV', role = 'PM') {
  return service.tx({ user: requestUser(id, role) }, tx => tx.send(action, { suggestionID }))
}

function bugEntry (ID, suffix) {
  return {
    ID,
    bugNumber: `BUG-AI-APPLY-${suffix}`,
    title: `Apply accepted classification suggestion ${suffix}`,
    description: 'A persisted bug used to verify guarded application of an accepted AI suggestion.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: SOURCE.priorityCode,
    severity_code: SOURCE.severityCode,
    environment_code: 'QAS',
    stepsToReproduce: 'Accept a grounded suggestion and apply it through the explicit CAP action.',
    actualResult: 'The source classification is still present.',
    expectedResult: 'Only allowed grounded fields are changed with one history event.',
    sapModule_ID: SOURCE.sapModuleID,
    applicationComponent_ID: SOURCE.applicationComponentID,
    defectCategory_ID: SOURCE.defectCategoryID,
    componentCategory_ID: SOURCE.componentCategoryID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

function sourceClassification (overrides = {}) {
  return {
    sapModuleID: SOURCE.sapModuleID,
    applicationComponentID: SOURCE.applicationComponentID,
    defectCategoryID: SOURCE.defectCategoryID,
    priorityCode: SOURCE.priorityCode,
    severityCode: SOURCE.severityCode,
    ...overrides
  }
}

function validSuggestions () {
  return [
    {
      field: 'sapModule',
      valueID: TARGET.sapModuleID,
      valueCode: 'MM',
      valueName: 'Materials Management',
      status: 'SUGGESTED'
    },
    {
      field: 'applicationComponent',
      valueID: TARGET.applicationComponentID,
      valueCode: 'IDTS_CAP_SERVICE',
      valueName: 'IDTS CAP Service',
      status: 'SUGGESTED'
    },
    {
      field: 'defectCategory',
      valueID: TARGET.defectCategoryID,
      valueCode: 'CAP_BACKEND',
      valueName: 'SAP CAP Backend',
      status: 'SUGGESTED'
    },
    {
      field: 'priority',
      valueID: null,
      valueCode: TARGET.priorityCode,
      valueName: 'Critical',
      status: 'SUGGESTED'
    },
    {
      field: 'severity',
      valueID: null,
      valueCode: TARGET.severityCode,
      valueName: 'Blocker',
      status: 'LOW_CONFIDENCE'
    }
  ]
}

async function createSuggestion (db, bugID, options = {}) {
  return createAiSuggestion(db, {
    bugID,
    requestedByID: DONHV_ID,
    featureType: options.featureType || 'CLASSIFICATION',
    providerAlias: 'mock',
    modelAlias: 'idts-93-test',
    confidence: 0.87,
    summary: 'Grounded classification suggestion for explicit human application.',
    suggestionPayload: options.payload || {
      providerStatus: 'SUCCESS',
      sourceClassification: sourceClassification(options.sourceOverrides),
      suggestions: options.suggestions || validSuggestions()
    },
    reviewState: options.reviewState,
    reviewedByID: options.reviewedByID,
    reviewedAt: options.reviewedAt,
    expiresAt: options.expiresAt
  })
}

async function acceptedSuggestion (service, db, bugID, options = {}) {
  const suggestion = await createSuggestion(db, bugID, options)
  await invoke(service, 'acceptAiSuggestion', suggestion.ID)
  return suggestion
}

function classificationQuery (bugID) {
  return SELECT.one.from('idts.cap.Bugs')
    .columns(
      'ID',
      'status_code',
      'assignee_ID',
      'sapModule_ID',
      'applicationComponent_ID',
      'defectCategory_ID',
      'componentCategory_ID',
      'priority_code',
      'severity_code'
    )
    .where({ ID: bugID })
}

async function historyCounts (db, bugID) {
  const events = await db.run(
    SELECT.from('idts.cap.HistoryEvents').columns('ID', 'summary').where({ bug_ID: bugID })
  )
  const logs = await db.run(
    SELECT.from('idts.cap.HistoryLogs').columns('ID', 'fieldName').where({ bug_ID: bugID })
  )
  return { events, logs }
}

async function main () {
  console.log('')
  console.log('========================================================')
  console.log(' IDTS-93 Apply Accepted Classification Verification')
  console.log(' ' + new Date().toISOString())
  console.log('========================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  const ids = {
    positive: '95000000-0000-0000-0000-000000000001',
    pending: '95000000-0000-0000-0000-000000000002',
    rejected: '95000000-0000-0000-0000-000000000003',
    ignored: '95000000-0000-0000-0000-000000000004',
    wrongType: '95000000-0000-0000-0000-000000000005',
    malformed: '95000000-0000-0000-0000-000000000006',
    unknownField: '95000000-0000-0000-0000-000000000007',
    inactive: '95000000-0000-0000-0000-000000000008',
    stale: '95000000-0000-0000-0000-000000000009',
    unauthorized: '95000000-0000-0000-0000-000000000010',
    rollback: '95000000-0000-0000-0000-000000000011',
    expired: '95000000-0000-0000-0000-000000000012',
    noValues: '95000000-0000-0000-0000-000000000013',
    mismatch: '95000000-0000-0000-0000-000000000014',
    invalidPair: '95000000-0000-0000-0000-000000000015',
    incompleteSource: '95000000-0000-0000-0000-000000000016'
  }
  await db.run(INSERT.into('idts.cap.Bugs').entries(
    Object.entries(ids).map(([suffix, ID]) => bugEntry(ID, suffix))
  ))

  const positive = await acceptedSuggestion(service, db, ids.positive)
  const applied = await invoke(service, 'applyClassificationSuggestion', positive.ID, 'NhanT', 'TESTER')
  expectEqual('Tester can apply an accepted classification suggestion', applied?.ID, ids.positive)
  const updated = await db.run(classificationQuery(ids.positive))
  expectEqual('applies SAP Module from grounded suggestion', updated?.sapModule_ID, TARGET.sapModuleID)
  expectEqual('applies Application Component from grounded suggestion', updated?.applicationComponent_ID, TARGET.applicationComponentID)
  expectEqual('applies Defect Category from grounded suggestion', updated?.defectCategory_ID, TARGET.defectCategoryID)
  expectEqual('derives matching Component Category', updated?.componentCategory_ID, TARGET.componentCategoryID)
  expectEqual('applies Priority code', updated?.priority_code, TARGET.priorityCode)
  expectEqual('applies Severity code', updated?.severity_code, TARGET.severityCode)
  expectEqual('does not change workflow status', updated?.status_code, 'PENDING_ASSIGNMENT')
  expectEqual('does not assign the Bug', updated?.assignee_ID, null)

  const positiveHistory = await historyCounts(db, ids.positive)
  expectEqual('writes one grouped history event', positiveHistory.events.length, 1)
  expectEqual('writes one history log per changed classification field', positiveHistory.logs.length, 6)
  expectTruthy(
    'history summary identifies accepted classification application',
    /accepted classification suggestion/i.test(positiveHistory.events[0]?.summary)
  )

  const repeated = await invoke(service, 'applyClassificationSuggestion', positive.ID)
  expectEqual('PM repeat application is idempotent', repeated?.ID, ids.positive)
  const repeatedHistory = await historyCounts(db, ids.positive)
  expectEqual('idempotent repeat does not duplicate history', repeatedHistory.events.length, 1)

  const pending = await createSuggestion(db, ids.pending)
  await expectRejected(
    'pending suggestion cannot be applied',
    () => invoke(service, 'applyClassificationSuggestion', pending.ID),
    409
  )

  const rejected = await createSuggestion(db, ids.rejected)
  await invoke(service, 'rejectAiSuggestion', rejected.ID)
  await expectRejected(
    'rejected suggestion cannot be applied',
    () => invoke(service, 'applyClassificationSuggestion', rejected.ID),
    409
  )

  const ignored = await createSuggestion(db, ids.ignored)
  await invoke(service, 'ignoreAiSuggestion', ignored.ID)
  await expectRejected(
    'ignored suggestion cannot be applied',
    () => invoke(service, 'applyClassificationSuggestion', ignored.ID),
    409
  )

  const wrongType = await acceptedSuggestion(service, db, ids.wrongType, {
    featureType: 'DUPLICATE_DETECTION',
    payload: { candidateCount: 0, candidates: [] }
  })
  await expectRejected(
    'non-classification suggestion cannot be applied',
    () => invoke(service, 'applyClassificationSuggestion', wrongType.ID),
    400
  )

  const malformed = await acceptedSuggestion(service, db, ids.malformed, {
    payload: { providerStatus: 'SUCCESS', suggestions: 'not-an-array' }
  })
  await expectRejected(
    'malformed suggestion payload is rejected',
    () => invoke(service, 'applyClassificationSuggestion', malformed.ID),
    400
  )

  const unknownField = await acceptedSuggestion(service, db, ids.unknownField, {
    suggestions: [{ field: 'status', valueCode: 'CLOSED', status: 'SUGGESTED' }]
  })
  await expectRejected(
    'field outside the classification allow-list is rejected',
    () => invoke(service, 'applyClassificationSuggestion', unknownField.ID),
    400
  )

  const inactive = await acceptedSuggestion(service, db, ids.inactive)
  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: false }).where({ code: TARGET.priorityCode }))
  await expectRejected(
    'inactive catalog target is rejected at apply time',
    () => invoke(service, 'applyClassificationSuggestion', inactive.ID),
    400
  )
  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: true }).where({ code: TARGET.priorityCode }))

  const stale = await acceptedSuggestion(service, db, ids.stale)
  await db.run(UPDATE('idts.cap.Bugs').set({ priority_code: 'LOW' }).where({ ID: ids.stale }))
  await expectRejected(
    'stale source classification is not overwritten',
    () => invoke(service, 'applyClassificationSuggestion', stale.ID),
    409
  )
  expectEqual(
    'stale rejection preserves the later manual value',
    (await db.run(classificationQuery(ids.stale)))?.priority_code,
    'LOW'
  )

  const unauthorized = await acceptedSuggestion(service, db, ids.unauthorized)
  await expectRejected(
    'Developer cannot apply classification suggestion',
    () => invoke(service, 'applyClassificationSuggestion', unauthorized.ID, 'DatDT', 'DEVELOPER'),
    403
  )
  expectEqual(
    'unauthorized request leaves classification unchanged',
    (await db.run(classificationQuery(ids.unauthorized)))?.priority_code,
    SOURCE.priorityCode
  )

  await expectRejected(
    'missing suggestion returns safe 404',
    () => invoke(service, 'applyClassificationSuggestion', '95000000-0000-0000-0000-000000000999'),
    404
  )
  await expectRejected(
    'invalid suggestion ID returns 400',
    () => invoke(service, 'applyClassificationSuggestion', 'not-a-suggestion-id'),
    400
  )

  const expired = await createSuggestion(db, ids.expired, {
    reviewState: 'ACCEPTED',
    reviewedByID: DONHV_ID,
    reviewedAt: '2026-07-20T00:00:00.000Z',
    expiresAt: '2026-07-21T00:00:00.000Z'
  })
  await expectRejected(
    'expired accepted suggestion cannot be applied',
    () => invoke(service, 'applyClassificationSuggestion', expired.ID),
    409
  )

  const noValues = await acceptedSuggestion(service, db, ids.noValues, {
    suggestions: validSuggestions().map(row => ({
      field: row.field,
      valueID: null,
      valueCode: null,
      status: 'NO_SUGGESTION'
    }))
  })
  await expectRejected(
    'accepted payload without applicable values is rejected',
    () => invoke(service, 'applyClassificationSuggestion', noValues.ID),
    400
  )

  const mismatchedRows = validSuggestions()
  mismatchedRows[0] = { ...mismatchedRows[0], valueCode: 'FI' }
  const mismatch = await acceptedSuggestion(service, db, ids.mismatch, {
    suggestions: mismatchedRows
  })
  await expectRejected(
    'catalog ID and code mismatch is rejected',
    () => invoke(service, 'applyClassificationSuggestion', mismatch.ID),
    400
  )

  const invalidPairRows = validSuggestions().filter(row =>
    row.field === 'applicationComponent' || row.field === 'defectCategory'
  )
  invalidPairRows[1] = {
    ...invalidPairRows[1],
    valueID: '50000000-0000-0000-0000-000000000001',
    valueCode: 'FIORI_UI5',
    valueName: 'SAP Fiori UI5'
  }
  const invalidPair = await acceptedSuggestion(service, db, ids.invalidPair, {
    suggestions: invalidPairRows
  })
  await expectRejected(
    'active but invalid component/category pair is rejected',
    () => invoke(service, 'applyClassificationSuggestion', invalidPair.ID),
    400
  )

  const incompleteSource = await acceptedSuggestion(service, db, ids.incompleteSource, {
    payload: {
      providerStatus: 'SUCCESS',
      sourceClassification: { priorityCode: SOURCE.priorityCode },
      suggestions: validSuggestions()
    }
  })
  await expectRejected(
    'incomplete source snapshot is rejected as malformed',
    () => invoke(service, 'applyClassificationSuggestion', incompleteSource.ID),
    400
  )

  const rollback = await acceptedSuggestion(service, db, ids.rollback)
  service.after('applyClassificationSuggestion', () => {
    throw Object.assign(new Error('Forced post-handler failure for rollback verification.'), { statusCode: 500 })
  })
  await expectRejected(
    'post-handler failure rejects apply action',
    () => invoke(service, 'applyClassificationSuggestion', rollback.ID),
    500
  )
  const rolledBack = await db.run(classificationQuery(ids.rollback))
  expectEqual('failed request rolls Bug classification back', rolledBack?.priority_code, SOURCE.priorityCode)
  expectEqual('failed request rolls history back', (await historyCounts(db, ids.rollback)).events.length, 0)

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

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1200))
  process.exit(1)
})
