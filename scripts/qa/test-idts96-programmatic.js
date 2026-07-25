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
const { createAiSuggestion } = require('../../srv/ai')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '96000000-0000-0000-0000-000000000096'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function bugEntry () {
  return {
    ID: BUG_ID,
    bugNumber: 'BUG-AI-REVIEW-096',
    title: 'Review AI suggestion safely',
    description: 'A persisted bug used to verify explicit human review actions.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Test steps',
    actualResult: 'Test actual',
    expectedResult: 'Test expected',
    applicationComponent_ID: '40000000-0000-0000-0000-000000000005',
    defectCategory_ID: '50000000-0000-0000-0000-000000000001',
    componentCategory_ID: '60000000-0000-0000-0000-000000000009',
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

function reviewer (id = 'DonHV', roles = ['PM', 'authenticated-user']) {
  return new cds.User({ id, roles })
}

async function invoke (service, action, suggestionID, user = reviewer()) {
  return service.tx({ user }, tx => tx.send(action, { suggestionID }))
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

async function run () {
  console.log('')
  console.log('========================================================')
  console.log(' IDTS-96 AI Suggestion Handoff & Smart Assign Regression')
  console.log(' ' + new Date().toISOString())
  console.log('========================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  await db.run(INSERT.into('idts.cap.Bugs').entries(bugEntry()))
  const beforeBug = await db.run(bugSnapshotQuery())
  const initialHistory = await db.run(SELECT.from('idts.cap.HistoryLogs').where({ bug_ID: BUG_ID }))

  // 1. Handoff Summary Review Test
  let suggestion1 = await createAiSuggestion(db, {
    bugID: BUG_ID,
    requestedByID: DONHV_ID,
    featureType: 'BUG_SUMMARY',
    providerAlias: 'mock',
    modelAlias: 'mock-model',
    confidence: 0.95,
    summary: 'Mock handoff summary',
    suggestionPayload: { summary: 'Mock handoff summary payload' }
  })
  
  await invoke(service, 'acceptAiSuggestion', suggestion1.ID)
  
  let suggestionReload1 = await db.run(SELECT.one.from('idts.cap.AiSuggestions').where({ ID: suggestion1.ID }))
  expectEqual('Handoff Summary: state reloads as ACCEPTED', suggestionReload1.reviewState_code, 'ACCEPTED')
  
  const currentBug1 = await db.run(bugSnapshotQuery())
  const currentHistory1 = await db.run(SELECT.from('idts.cap.HistoryLogs').where({ bug_ID: BUG_ID }))
  expectEqual('Handoff Summary: review does not mutate workflow state', JSON.stringify(currentBug1), JSON.stringify(beforeBug))
  expectEqual('Handoff Summary: no unintended history logs created', currentHistory1.length, initialHistory.length)

  // 2. Smart Assign Review Test
  let suggestion2 = await createAiSuggestion(db, {
    bugID: BUG_ID,
    requestedByID: DONHV_ID,
    featureType: 'ASSIGNMENT_EXPLANATION',
    providerAlias: 'mock',
    modelAlias: 'mock-model',
    confidence: 0.85,
    summary: 'Mock assignment explanation',
    suggestionPayload: { assignee: 'developer_uuid', explanation: 'Good match' }
  })
  
  await invoke(service, 'rejectAiSuggestion', suggestion2.ID)
  
  let suggestionReload2 = await db.run(SELECT.one.from('idts.cap.AiSuggestions').where({ ID: suggestion2.ID }))
  expectEqual('Smart Assign: state reloads as REJECTED', suggestionReload2.reviewState_code, 'REJECTED')
  
  const currentBug2 = await db.run(bugSnapshotQuery())
  const currentHistory2 = await db.run(SELECT.from('idts.cap.HistoryLogs').where({ bug_ID: BUG_ID }))
  expectEqual('Smart Assign: review does not mutate workflow state', JSON.stringify(currentBug2), JSON.stringify(beforeBug))
  expectEqual('Smart Assign: no unintended history logs created', currentHistory2.length, initialHistory.length)

  console.log('')
  console.log('========================================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${PASS + FAIL} checks`)
  console.log('========================================================')

  if (FAIL > 0) process.exit(1)
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
