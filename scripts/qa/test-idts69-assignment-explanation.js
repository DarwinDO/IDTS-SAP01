#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('assert')

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const BUG_ID = '94000000-0000-0000-0000-000000000001'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const DEV_DAT = '20000000-0000-0000-0000-000000000002'
const DEV_MISSING = '20000000-0000-0000-0000-000000009999'
const COMPONENT_ID = '40000000-0000-0000-0000-000000000001'
const CATEGORY_ID = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY_ID = '60000000-0000-0000-0000-000000000001'

let pass = 0
let fail = 0

function rec (label, ok, detail = '') {
  if (ok) pass += 1
  else fail += 1
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' | ' + detail : ''}`)
}

function aiConfig (mockStructuredOutput, overrides = {}) {
  cds.env.idts = cds.env.idts || {}
  cds.env.idts.ai = {
    enabled: true,
    provider: 'mock',
    modelAlias: 'idts-69-qa-structured',
    mockStructuredOutput,
    ...overrides
  }
}

async function invokeExplanation (service, payload) {
  return service.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }, tx => tx.send('explainSmartAssignment', payload))
}

async function callAssignAction (service, assigneeID) {
  const req = new cds.Request({
    method: 'POST',
    event: 'assignToDeveloper',
    target: service.entities.Bugs,
    params: [{ ID: BUG_ID, IsActiveEntity: true }],
    data: { assigneeID, note: 'IDTS-69 QA validation guard' },
    user: new cds.User({ id: 'DonHV', roles: ['authenticated-user'] })
  })
  return service.dispatch(req)
}

async function main () {
  console.log('')
  console.log('===================================================')
  console.log(' IDTS-69 Smart Assignment Explanation Verification')
  console.log(' ' + new Date().toISOString())
  console.log('===================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: BUG_ID,
    bugNumber: 'BUG-AI-ASSIGN-001',
    title: 'Smart Assign needs reviewable candidate explanations',
    description: 'Tester wants to understand why a developer candidate is suggested.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'MEDIUM',
    severity_code: 'MINOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Open the assignee value help on a bug with classification.',
    actualResult: 'Candidate list has limited reasoning.',
    expectedResult: 'Candidate list explains fit and warnings for manual review.',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }))

  aiConfig({
    candidates: [
      {
        developerProfileID: DEV_DAT,
        explanation: 'Provider explanation: matches this component/category and has available capacity.',
        confidence: 0.84
      }
    ]
  })
  const positive = await invokeExplanation(service, {
    sourceBugID: BUG_ID,
    componentCategoryID: COMPONENT_CATEGORY_ID,
    limit: 10
  })
  assert(positive.some(row => row.developerProfileID === DEV_DAT))
  const dat = positive.find(row => row.developerProfileID === DEV_DAT)
  assert.strictEqual(dat.providerStatus, 'SUCCESS')
  assert(dat.explanation.includes('Provider explanation') || dat.explanation.includes('Matches'))
  assert.strictEqual(dat.requiresReview, true)
  rec('provider success returns reviewable explanation for assignable candidate', true)

  const auditRows = await db.run(
    SELECT.from('idts.cap.AiSuggestions')
      .columns('featureType_code', 'reviewState_code', 'suggestionPayload')
      .where({ bug_ID: BUG_ID, featureType_code: 'ASSIGNMENT_EXPLANATION' })
  )
  assert.strictEqual(auditRows.length, 1)
  assert.strictEqual(auditRows[0].reviewState_code, 'PENDING')
  const auditPayload = JSON.parse(auditRows[0].suggestionPayload)
  assert.strictEqual(auditPayload.providerStatus, 'SUCCESS')
  rec('source-linked assignment explanation writes sanitized AI audit row', true)

  aiConfig({}, { enabled: false })
  const disabled = await invokeExplanation(service, {
    sourceBugID: BUG_ID,
    componentCategoryID: COMPONENT_CATEGORY_ID,
    limit: 10
  })
  assert(disabled.length > 0)
  assert(disabled.every(row => row.providerStatus === 'AI_DISABLED'))
  assert(disabled.every(row => row.explanation && row.requiresReview === true))
  rec('disabled AI provider falls back without breaking Smart Assign', true)

  let rejectedMissingClassification = false
  try {
    await invokeExplanation(service, { limit: 10 })
  } catch (error) {
    rejectedMissingClassification = Number(error.code || error.statusCode || error.status) === 400
  }
  assert.strictEqual(rejectedMissingClassification, true)
  rec('missing classification is rejected with a safe 400 message', true)

  await assert.rejects(() => callAssignAction(service, DEV_MISSING), /does not exist|not active|not responsible/)
  rec('invalid assignee remains blocked by existing backend validation', true)

  const bugAfter = await db.run(SELECT.one.from('idts.cap.Bugs').columns('status_code', 'assignee_ID').where({ ID: BUG_ID }))
  assert.strictEqual(bugAfter.status_code, 'PENDING_ASSIGNMENT')
  assert.strictEqual(bugAfter.assignee_ID, null)
  rec('assignment explanation action does not mutate bug workflow state', true)

  console.log('')
  console.log('Safe evidence sample:')
  console.log(JSON.stringify({
    candidateCount: positive.length,
    providerStatus: dat.providerStatus,
    groundingStatus: dat.groundingStatus,
    requiresReview: dat.requiresReview
  }, null, 2))
  console.log('')
  console.log('===================================================')
  console.log(` TOTAL: ${pass} PASS  |  ${fail} FAIL`)
  console.log('===================================================')

  process.exit(fail > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.slice(0, 1000))
  process.exit(1)
})
