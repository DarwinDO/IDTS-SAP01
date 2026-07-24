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
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql
const { createAiSuggestion } = require('../../srv/ai')
const { duplicateLinkID } = require('../../srv/ai/duplicate-confirmation')

const RESULTS = []
let PASS = 0
let FAIL = 0

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

function requestUser (id, role) {
  return new cds.User({ id, roles: [role, 'authenticated-user'] })
}

async function invoke (
  service,
  action,
  suggestionID,
  candidateBugID,
  id = 'DonHV',
  role = 'PM'
) {
  const data = { suggestionID }
  if (action === 'confirmDuplicateSuggestion') data.candidateBugID = candidateBugID
  return service.tx({ user: requestUser(id, role) }, tx =>
    tx.send(action, data)
  )
}

function bugEntry (ID, suffix) {
  return {
    ID,
    bugNumber: `BUG-AI-DUPLICATE-${suffix}`,
    title: `Confirm accepted similar Bug ${suffix}`,
    description: 'A persisted Bug used to verify explicit human duplicate confirmation.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Accept a grounded Similar Bugs suggestion and confirm one stored candidate.',
    actualResult: 'No duplicate link exists yet.',
    expectedResult: 'Exactly one authorized and grounded duplicate link is created.',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    nextProcessorUser_ID: DONHV_ID,
    nextProcessorRole_code: 'PM'
  }
}

async function createSuggestion (db, sourceBugID, candidateBugID, options = {}) {
  return createAiSuggestion(db, {
    bugID: sourceBugID,
    requestedByID: DONHV_ID,
    featureType: options.featureType || 'DUPLICATE_DETECTION',
    providerAlias: 'mock',
    modelAlias: 'idts-95-test',
    confidence: 0.88,
    summary: 'Grounded Similar Bugs suggestion for explicit human confirmation.',
    suggestionPayload: options.payload || {
      providerStatus: 'SUCCESS',
      candidateCount: 1,
      candidates: [{
        bugID: candidateBugID,
        bugNumber: 'BUG-AI-DUPLICATE-CANDIDATE',
        suggestedRelationTypeCode: options.relationTypeCode || 'SIMILAR',
        score: 0.88,
        reason: 'Stored candidate used by the focused test.'
      }]
    },
    reviewState: options.reviewState,
    reviewedByID: options.reviewedByID,
    reviewedAt: options.reviewedAt,
    expiresAt: options.expiresAt
  })
}

async function acceptedSuggestion (service, db, sourceBugID, candidateBugID, options = {}) {
  const suggestion = await createSuggestion(db, sourceBugID, candidateBugID, options)
  await invoke(service, 'acceptAiSuggestion', suggestion.ID, candidateBugID)
  return suggestion
}

async function linkRows (db, firstBugID, secondBugID) {
  const rows = await db.run(
    SELECT.from('idts.cap.DuplicateLinks')
      .columns('ID', 'sourceBug_ID', 'targetBug_ID', 'relationType_code')
      .where({
        sourceBug_ID: { in: [firstBugID, secondBugID] },
        targetBug_ID: { in: [firstBugID, secondBugID] }
      })
  )
  return rows.filter(row =>
    (row.sourceBug_ID === firstBugID && row.targetBug_ID === secondBugID) ||
    (row.sourceBug_ID === secondBugID && row.targetBug_ID === firstBugID)
  )
}

async function main () {
  console.log('')
  console.log('========================================================')
  console.log(' IDTS-95 Confirm Duplicate Suggestion Verification')
  console.log(' ' + new Date().toISOString())
  console.log('========================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  const ids = {
    source: '97000000-0000-0000-0000-000000000001',
    candidate: '97000000-0000-0000-0000-000000000002',
    outside: '97000000-0000-0000-0000-000000000003',
    reverseSource: '97000000-0000-0000-0000-000000000004',
    reverseTarget: '97000000-0000-0000-0000-000000000005',
    pending: '97000000-0000-0000-0000-000000000006',
    rejected: '97000000-0000-0000-0000-000000000007',
    ignored: '97000000-0000-0000-0000-000000000008',
    wrongType: '97000000-0000-0000-0000-000000000009',
    unauthorized: '97000000-0000-0000-0000-000000000010',
    missingCandidate: '97000000-0000-0000-0000-000000000011',
    malformed: '97000000-0000-0000-0000-000000000012',
    inactiveRelation: '97000000-0000-0000-0000-000000000013',
    expired: '97000000-0000-0000-0000-000000000014',
    rollbackSource: '97000000-0000-0000-0000-000000000015',
    rollbackTarget: '97000000-0000-0000-0000-000000000016'
  }
  expectEqual(
    'the same Bug pair always receives the same link ID',
    duplicateLinkID(ids.source, ids.candidate),
    duplicateLinkID(ids.source, ids.candidate)
  )
  expectEqual(
    'pair identity is independent of source/target direction',
    duplicateLinkID(ids.source, ids.candidate),
    duplicateLinkID(ids.candidate, ids.source)
  )
  await db.run(
    INSERT.into('idts.cap.Bugs').entries(
      Object.entries(ids)
        .map(([suffix, ID]) => bugEntry(ID, suffix))
    )
  )

  const beforeSource = await db.run(
    SELECT.one.from('idts.cap.Bugs').columns('status_code', 'assignee_ID').where({ ID: ids.source })
  )
  const positive = await acceptedSuggestion(service, db, ids.source, ids.candidate)
  const confirmed = await invoke(
    service,
    'confirmDuplicateSuggestion',
    positive.ID,
    ids.candidate,
    'NhanT',
    'TESTER'
  )
  expectTruthy('Tester confirmation returns a DuplicateLink ID', confirmed?.ID)
  expectEqual('link uses the suggestion source Bug', confirmed?.sourceBug_ID, ids.source)
  expectEqual('link uses the stored candidate Bug', confirmed?.targetBug_ID, ids.candidate)
  expectEqual('link uses the stored relation type', confirmed?.relationType_code, 'SIMILAR')
  expectEqual('positive confirmation persists exactly one link', (await linkRows(db, ids.source, ids.candidate)).length, 1)
  expectEqual(
    'confirmation preserves the accepted suggestion audit state',
    (await db.run(
      SELECT.one.from('idts.cap.AiSuggestions')
        .columns('reviewState_code')
        .where({ ID: positive.ID })
    ))?.reviewState_code,
    'ACCEPTED'
  )
  expectEqual(
    'confirmation does not change Bug status or assignee',
    JSON.stringify(await db.run(
      SELECT.one.from('idts.cap.Bugs').columns('status_code', 'assignee_ID').where({ ID: ids.source })
    )),
    JSON.stringify(beforeSource)
  )
  await expectRejected(
    'client cannot inject an arbitrary relation type',
    () => service.tx({ user: requestUser('DonHV', 'PM') }, tx =>
      tx.send('confirmDuplicateSuggestion', {
        suggestionID: positive.ID,
        candidateBugID: ids.candidate,
        relationTypeCode: 'DUPLICATE'
      })
    ),
    400
  )

  await expectRejected(
    'repeated confirmation is rejected safely',
    () => invoke(service, 'confirmDuplicateSuggestion', positive.ID, ids.candidate),
    409
  )
  expectEqual('repeated confirmation leaves one link', (await linkRows(db, ids.source, ids.candidate)).length, 1)

  const outsideSuggestion = await acceptedSuggestion(service, db, ids.outside, ids.candidate)
  await expectRejected(
    'candidate outside the stored suggestion is rejected',
    () => invoke(service, 'confirmDuplicateSuggestion', outsideSuggestion.ID, ids.source),
    400
  )
  expectEqual('outside-candidate rejection writes no link', (await linkRows(db, ids.outside, ids.source)).length, 0)

  const selfSuggestion = await acceptedSuggestion(service, db, ids.outside, ids.outside)
  await expectRejected(
    'self-link is rejected',
    () => invoke(service, 'confirmDuplicateSuggestion', selfSuggestion.ID, ids.outside),
    400
  )

  await db.run(
    INSERT.into('idts.cap.DuplicateLinks').entries({
      ID: '97000000-0000-0000-0000-000000000099',
      sourceBug_ID: ids.reverseTarget,
      targetBug_ID: ids.reverseSource,
      relationType_code: 'RELATED'
    })
  )
  const reverseSuggestion = await acceptedSuggestion(service, db, ids.reverseSource, ids.reverseTarget)
  await expectRejected(
    'an existing reverse-direction link is treated as repeated',
    () => invoke(service, 'confirmDuplicateSuggestion', reverseSuggestion.ID, ids.reverseTarget),
    409
  )

  const pending = await createSuggestion(db, ids.pending, ids.candidate)
  await expectRejected(
    'pending suggestion cannot be confirmed',
    () => invoke(service, 'confirmDuplicateSuggestion', pending.ID, ids.candidate),
    409
  )

  const rejected = await createSuggestion(db, ids.rejected, ids.candidate)
  await invoke(service, 'rejectAiSuggestion', rejected.ID, ids.candidate)
  await expectRejected(
    'rejected suggestion cannot be confirmed',
    () => invoke(service, 'confirmDuplicateSuggestion', rejected.ID, ids.candidate),
    409
  )

  const ignored = await createSuggestion(db, ids.ignored, ids.candidate)
  await invoke(service, 'ignoreAiSuggestion', ignored.ID, ids.candidate)
  await expectRejected(
    'ignored suggestion cannot be confirmed',
    () => invoke(service, 'confirmDuplicateSuggestion', ignored.ID, ids.candidate),
    409
  )

  const wrongType = await acceptedSuggestion(service, db, ids.wrongType, ids.candidate, {
    featureType: 'CLASSIFICATION',
    payload: {
      providerStatus: 'SUCCESS',
      sourceClassification: {},
      suggestions: []
    }
  })
  await expectRejected(
    'non-Similar-Bugs suggestion cannot be confirmed',
    () => invoke(service, 'confirmDuplicateSuggestion', wrongType.ID, ids.candidate),
    400
  )

  const unauthorized = await acceptedSuggestion(service, db, ids.unauthorized, ids.candidate)
  await expectRejected(
    'Developer cannot confirm a duplicate suggestion',
    () => invoke(
      service,
      'confirmDuplicateSuggestion',
      unauthorized.ID,
      ids.candidate,
      'SangVN',
      'DEVELOPER'
    ),
    403
  )
  expectEqual('unauthorized request writes no link', (await linkRows(db, ids.unauthorized, ids.candidate)).length, 0)

  const missingCandidate = await acceptedSuggestion(service, db, ids.missingCandidate, ids.candidate)
  await db.run(DELETE.from('idts.cap.Bugs').where({ ID: ids.missingCandidate }))
  await expectRejected(
    'missing source Bug returns safe 404',
    () => invoke(service, 'confirmDuplicateSuggestion', missingCandidate.ID, ids.candidate),
    404
  )

  const missingCandidateSuggestion = await acceptedSuggestion(
    service,
    db,
    ids.malformed,
    ids.missingCandidate
  )
  await expectRejected(
    'missing candidate Bug returns safe 404',
    () => invoke(service, 'confirmDuplicateSuggestion', missingCandidateSuggestion.ID, ids.missingCandidate),
    404
  )

  const malformed = await acceptedSuggestion(service, db, ids.malformed, ids.candidate, {
    payload: { providerStatus: 'SUCCESS', candidates: 'not-an-array' }
  })
  await expectRejected(
    'malformed persisted payload is rejected',
    () => invoke(service, 'confirmDuplicateSuggestion', malformed.ID, ids.candidate),
    400
  )

  const inactiveRelation = await acceptedSuggestion(service, db, ids.inactiveRelation, ids.candidate)
  await db.run(UPDATE('idts.cap.DuplicateRelationTypes').set({ active: false }).where({ code: 'SIMILAR' }))
  await expectRejected(
    'inactive stored relation type is rejected',
    () => invoke(service, 'confirmDuplicateSuggestion', inactiveRelation.ID, ids.candidate),
    400
  )
  await db.run(UPDATE('idts.cap.DuplicateRelationTypes').set({ active: true }).where({ code: 'SIMILAR' }))

  const expired = await createSuggestion(db, ids.expired, ids.candidate, {
    reviewState: 'ACCEPTED',
    reviewedByID: DONHV_ID,
    reviewedAt: '2026-07-20T00:00:00.000Z',
    expiresAt: '2026-07-21T00:00:00.000Z'
  })
  await expectRejected(
    'expired accepted suggestion cannot be confirmed',
    () => invoke(service, 'confirmDuplicateSuggestion', expired.ID, ids.candidate),
    409
  )

  const rollback = await acceptedSuggestion(service, db, ids.rollbackSource, ids.rollbackTarget)
  service.after('confirmDuplicateSuggestion', result => {
    if (result?.sourceBug_ID === ids.rollbackSource) {
      throw Object.assign(new Error('Forced post-handler failure for rollback verification.'), { statusCode: 500 })
    }
  })
  await expectRejected(
    'post-handler failure rejects confirmation',
    () => invoke(service, 'confirmDuplicateSuggestion', rollback.ID, ids.rollbackTarget),
    500
  )
  expectEqual(
    'failed request rolls DuplicateLink insert back',
    (await linkRows(db, ids.rollbackSource, ids.rollbackTarget)).length,
    0
  )

  await expectRejected(
    'invalid suggestion ID returns 400',
    () => invoke(service, 'confirmDuplicateSuggestion', 'not-a-suggestion-id', ids.candidate),
    400
  )
  await expectRejected(
    'invalid candidate Bug ID returns 400',
    () => invoke(service, 'confirmDuplicateSuggestion', positive.ID, 'not-a-bug-id'),
    400
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
