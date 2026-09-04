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
const { INSERT, SELECT } = cds.ql
const { createAiSuggestion } = require('../../srv/ai')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '94000000-0000-0000-0000-000000000091'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
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

function bugEntry () {
  return {
    ID: BUG_ID,
    bugNumber: 'BUG-AI-REVIEW-091',
    title: 'Review AI suggestion safely',
    description: 'A persisted bug used to verify explicit human review actions.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Generate a suggestion and review it.',
    actualResult: 'The review state is pending.',
    expectedResult: 'Only one explicit human decision is persisted.',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

function reviewer (id = 'DonHV', roles = ['PM', 'authenticated-user']) {
  return fixtureUser(cds, id, roles)
}

async function invoke (service, action, suggestionID, user = reviewer()) {
  return service.tx({ user }, tx => tx.send(action, { suggestionID }))
}

async function createSuggestion (db, featureType = 'CLASSIFICATION') {
  return createAiSuggestion(db, {
    bugID: BUG_ID,
    requestedByID: DONHV_ID,
    featureType,
    providerAlias: 'mock',
    modelAlias: 'idts-91-test',
    confidence: 0.82,
    summary: 'Suggestion awaiting explicit human review.',
    suggestionPayload: featureType === 'CLASSIFICATION'
      ? {
          providerStatus: 'SUCCESS',
          suggestions: [
            {
              field: 'priority',
              valueCode: 'HIGH',
              valueName: 'High',
              confidence: 0.82,
              status: 'SUGGESTED',
              reason: 'Review-safe test suggestion.'
            }
          ]
        }
      : {
          candidateCount: 1,
          candidates: [{
            bugID: '90000000-0000-0000-0000-000000000002',
            suggestedRelationTypeCode: 'SIMILAR',
            score: 0.82
          }]
        }
  })
}

function bugSnapshotQuery () {
  return SELECT.one.from('idts.cap.Bugs')
    .columns(
      'status_code',
      'assignee_ID',
      'sapModule_ID',
      'applicationComponent_ID',
      'defectCategory_ID',
      'componentCategory_ID',
      'priority_code',
      'severity_code'
    )
    .where({ ID: BUG_ID })
}

async function main () {
  console.log('')
  console.log('========================================================')
  console.log(' IDTS-91 AI Suggestion Review Actions Verification')
  console.log(' ' + new Date().toISOString())
  console.log('========================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)
  await db.run(INSERT.into('idts.cap.Bugs').entries(bugEntry()))

  const beforeBug = await db.run(bugSnapshotQuery())
  const acceptedSuggestion = await createSuggestion(db)
  const accepted = await invoke(service, 'acceptAiSuggestion', acceptedSuggestion.ID)
  expectEqual('accept returns the reviewed suggestion ID', accepted?.suggestionID, acceptedSuggestion.ID)
  expectEqual('accept returns ACCEPTED state', accepted?.reviewStateCode, 'ACCEPTED')
  expectEqual('accept returns reviewer display name', accepted?.reviewedByDisplayName, 'DonHV')
  expectTruthy('accept returns review timestamp', accepted?.reviewedAt)

  const persistedAccepted = await db.run(
    SELECT.one.from('idts.cap.AiSuggestions')
      .columns('reviewState_code', 'reviewedBy_ID', 'reviewedAt')
      .where({ ID: acceptedSuggestion.ID })
  )
  expectEqual('accept persists ACCEPTED state', persistedAccepted?.reviewState_code, 'ACCEPTED')
  expectEqual('accept persists authenticated reviewer', persistedAccepted?.reviewedBy_ID, DONHV_ID)
  expectTruthy('accept persists reviewedAt', persistedAccepted?.reviewedAt)
  expectEqual('review action does not mutate Bug business data', JSON.stringify(await db.run(bugSnapshotQuery())), JSON.stringify(beforeBug))

  await expectRejected(
    'a second decision on the same suggestion is rejected safely',
    () => invoke(service, 'rejectAiSuggestion', acceptedSuggestion.ID),
    409
  )
  expectEqual(
    'repeat decision keeps the original state',
    (await db.run(SELECT.one.from('idts.cap.AiSuggestions').columns('reviewState_code').where({ ID: acceptedSuggestion.ID })))?.reviewState_code,
    'ACCEPTED'
  )

  const rejectedSuggestion = await createSuggestion(db, 'DUPLICATE_DETECTION')
  const rejected = await invoke(
    service,
    'rejectAiSuggestion',
    rejectedSuggestion.ID,
    reviewer('DatDT', ['DEVELOPER', 'authenticated-user'])
  )
  expectEqual('reject persists REJECTED state', rejected?.reviewStateCode, 'REJECTED')
  expectEqual('Developer can review a readable suggestion', rejected?.reviewedByDisplayName, 'DatDT')
  expectEqual('Developer review uses authenticated reviewer ID', rejected?.reviewedByID, '10000000-0000-0000-0000-000000000003')

  const ignoredSuggestion = await createSuggestion(db)
  const ignored = await invoke(service, 'ignoreAiSuggestion', ignoredSuggestion.ID)
  expectEqual('ignore persists IGNORED state', ignored?.reviewStateCode, 'IGNORED')

  await expectRejected(
    'missing suggestion returns safe 404',
    () => invoke(service, 'acceptAiSuggestion', '94000000-0000-0000-0000-000000000999'),
    404
  )
  await expectRejected(
    'missing suggestion ID returns 400',
    () => invoke(service, 'acceptAiSuggestion', null),
    400
  )
  const unauthorizedSuggestion = await createSuggestion(db)
  await expectRejected(
    'unknown authenticated identity cannot review suggestions',
    () => invoke(service, 'acceptAiSuggestion', unauthorizedSuggestion.ID, reviewer('UnknownReviewer', ['authenticated-user'])),
    403
  )

  const rollbackSuggestion = await createSuggestion(db)
  service.after('acceptAiSuggestion', result => {
    if (result?.suggestionID === rollbackSuggestion.ID) {
      throw Object.assign(new Error('Forced post-handler failure for rollback verification.'), { statusCode: 500 })
    }
  })
  await expectRejected(
    'post-handler failure rejects the action',
    () => invoke(service, 'acceptAiSuggestion', rollbackSuggestion.ID),
    500
  )
  expectEqual(
    'failed request rolls review update back to PENDING',
    (await db.run(SELECT.one.from('idts.cap.AiSuggestions').columns('reviewState_code').where({ ID: rollbackSuggestion.ID })))?.reviewState_code,
    'PENDING'
  )

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
