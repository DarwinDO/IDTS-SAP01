#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql
const { createAiSuggestion, serializeSuggestionPayload } = require('../../srv/ai')
const { containsUnsafeDiagnosticText } = require('../../srv/ai/safety')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_ID = '90000000-0000-0000-0000-000000000001'
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

function expectTruthy (label, actual) {
  rec(label, Boolean(actual), `actual=${JSON.stringify(actual)}`)
}

function expectNoUnsafeDiagnostic (label, value) {
  rec(label, !containsUnsafeDiagnosticText(value), containsUnsafeDiagnosticText(value) ? JSON.stringify(value) : 'no unsafe detail detected')
}

async function main () {
  console.log('')
  console.log('====================================================')
  console.log(' IDTS-65 AI Suggestion Audit Verification')
  console.log(' ' + new Date().toISOString())
  console.log('====================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)

  const featureTypes = await db.run(SELECT.from('idts.cap.AiSuggestionFeatureTypes').columns('code').orderBy('sortOrder'))
  expectEqual('AI feature type seed count', featureTypes.length, 4)
  expectEqual('first feature type is duplicate detection', featureTypes[0]?.code, 'DUPLICATE_DETECTION')

  const reviewStates = await db.run(SELECT.from('idts.cap.AiSuggestionReviewStates').columns('code').orderBy('sortOrder'))
  expectEqual('AI review state seed count', reviewStates.length, 5)
  expectEqual('first review state is pending', reviewStates[0]?.code, 'PENDING')

  const payloadText = serializeSuggestionPayload({
    summary: 'Looks similar to BUG-0002.',
    rawPrompt: 'DO NOT STORE THIS PROMPT',
    messages: [{ role: 'user', content: 'DO NOT STORE RAW CHAT MESSAGE' }],
    diagnostic: `token Bearer ${'a'.repeat(40)} xkeysib-${'1'.repeat(30)}`
  })
  expectTruthy('serialized payload keeps safe summary', payloadText.includes('Looks similar to BUG-0002.'))
  expectEqual('serialized payload drops rawPrompt key', payloadText.includes('rawPrompt'), false)
  expectEqual('serialized payload drops messages key', payloadText.includes('messages'), false)
  expectEqual('serialized payload redacts provider-like secrets', payloadText.includes('xkeysib-'), false)

  const auditRow = await createAiSuggestion(db, {
    bugID: BUG_ID,
    featureType: 'duplicate_detection',
    requestedByID: DONHV_ID,
    providerAlias: 'mock',
    modelAlias: 'qa-mock',
    confidence: 0.87654,
    suggestionPayload: {
      candidateBugNumber: 'BUG-0002',
      explanation: 'Both bugs describe assignment routing.',
      apiKey: 'should-not-be-stored',
      token: `Bearer ${'b'.repeat(40)}`
    },
    summary: 'Potential duplicate candidate found.',
    correlationId: 'idts-65-smoke'
  })
  expectTruthy('backend writer creates audit row ID', auditRow?.ID)
  expectEqual('backend writer normalizes feature type', auditRow?.featureType_code, 'DUPLICATE_DETECTION')
  expectEqual('backend writer defaults review state to PENDING', auditRow?.reviewState_code, 'PENDING')
  expectEqual('backend writer clamps confidence to four decimals', Number(auditRow?.confidence), 0.8765)
  expectNoUnsafeDiagnostic('backend writer stores only sanitized suggestion payload', JSON.parse(auditRow.suggestionPayload))

  const readableRows = await srv.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  }).run(
    SELECT.from('BugService.AiSuggestions')
      .columns('ID', 'featureTypeName', 'reviewStateName', 'requestedByDisplayName', 'summary')
      .where({ ID: auditRow.ID })
  )
  expectEqual('BugService exposes audit row read-only projection', readableRows.length, 1)
  expectEqual('projection resolves feature type display name', readableRows[0]?.featureTypeName, 'Duplicate Detection')
  expectEqual('projection resolves review state display name', readableRows[0]?.reviewStateName, 'Pending Review')
  expectEqual('projection resolves requester display name', readableRows[0]?.requestedByDisplayName, 'DonHV')

  let rejectedDirectWrite = false
  try {
    await srv.tx({
      user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
    }, tx => tx.create(srv.entities.AiSuggestions).entries({
        bug_ID: BUG_ID,
        featureType_code: 'BUG_SUMMARY',
        requestedBy_ID: DONHV_ID,
        suggestionPayload: '{"summary":"client write should fail"}',
        reviewState_code: 'PENDING'
      }))
  } catch (error) {
    rejectedDirectWrite = Number(error.code || error.statusCode || error.status) === 405 ||
      /read-only|DRAFT_MODIFICATION_ONLY_VIA_ROOT/i.test(error.message || String(error))
  }
  expectEqual('client write to BugService.AiSuggestions is rejected', rejectedDirectWrite, true)

  let rejectedInactiveCode = false
  await db.run(INSERT.into('idts.cap.AiSuggestionFeatureTypes').entries({
    code: 'INACTIVE_AI_TEST',
    name: 'Inactive AI Test',
    active: false
  }))
  try {
    await createAiSuggestion(db, {
      bugID: BUG_ID,
      featureType: 'INACTIVE_AI_TEST',
      requestedByID: DONHV_ID,
      suggestionPayload: { summary: 'Should fail' }
    })
  } catch (error) {
    rejectedInactiveCode = Number(error.statusCode) === 400
  }
  expectEqual('backend writer rejects inactive feature type', rejectedInactiveCode, true)

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
