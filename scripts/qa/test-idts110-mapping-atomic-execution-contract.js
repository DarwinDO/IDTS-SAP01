#!/usr/bin/env node
'use strict'

// Contract-first guard for the case-specific IDTS-110 mapping runner.
// This file intentionally loads only the runner's pure planning helpers; CAP
// and the locked dependency tree are required only when a selected case runs.

const assert = require('node:assert/strict')
const path = require('node:path')
const manifest = require('../../docs/qa/idts-110-mapping-atomic-manifest.json')
const atomic = require('./idts110-atomic-runner')

const execution = require('./test-idts110-mapping-atomic-execution.js')

assert.equal(manifest.entries.length, 135)
assert.equal(new Set(manifest.entries.map(entry => entry.selector)).size, 135)
assert.equal(typeof execution.selectDefinition, 'function')
assert.equal(typeof execution.parseSelectedCase, 'function')
assert.equal(typeof execution.validateExecutionEvidence, 'function')
assert.equal(typeof execution.planForDefinition, 'function')
assert.equal(typeof execution.assertCoreOutcome, 'function')
assert.equal(typeof execution.assertAttachmentReadback, 'function')
assert.equal(typeof execution.assertNoAttachmentBeforeSave, 'function')
assert.equal(typeof execution.assertSafeProviderFailure, 'function')
assert.equal(typeof execution.assertSafeProviderMetric, 'function')
assert.equal(typeof execution.assertReadOnlyGuardOutcome, 'function')
assert.equal(typeof execution.assertAiReviewReadback, 'function')
assert.equal(typeof execution.assertAiHttpBoundary, 'function')
assert.equal(typeof execution.assertAiSuccessPayloadAndParity, 'function')
assert.equal(typeof execution.attachmentHttpBoundary, 'function')

const attachmentBoundary = execution.attachmentHttpBoundary(201, [
  { method: 'POST', path: '/odata/v4/bug/Bugs(...)/attachments', status: 201 },
  { method: 'PUT', path: '/odata/v4/bug/Bugs_attachments(...)/content', status: 204 }
])
assert.deepEqual(attachmentBoundary, {
  transport: 'node:http',
  status: 201,
  stepCount: 2,
  steps: 'POST /odata/v4/bug/Bugs(...)/attachments -> 201; PUT /odata/v4/bug/Bugs_attachments(...)/content -> 204'
})
const attachmentBatchResult = {
  schemaVersion: '1.0', jiraKey: 'IDTS-110', caseKey: 'UT-ATT-001', mentorNumber: 112,
  assertionId: 'UT-ATT-001-A1', title: 'Attachment boundary', status: 'PASS', assertionPassed: true,
  authorizedFixture: false, evidenceKind: 'LOCAL_ATOMIC', executor: 'Terra-High',
  startedAt: '2026-09-07T00:00:00.000Z', completedAt: '2026-09-07T00:00:01.000Z',
  sourceBaselineSha: manifest.sourceBaselineSha, deployedSha: null,
  testFile: 'scripts/qa/test-idts110-mapping-atomic-execution.js', testCommand: 'node scripts/qa/test-idts110-mapping-atomic-execution.js',
  preconditions: 'Use an isolated local fixture.', input: 'Upload a safe attachment.', expectedResult: 'Attachment boundary passed.', actualResult: 'Attachment boundary passed.',
  sourceTrace: [{ file: 'srv/service.cds', symbol: 'attachments' }], beforeState: { Attachments: 0 }, afterState: { Attachments: 1 }, reloadState: { Attachments: 1 },
  runtimeEvidence: { observedAssertions: ['attachment readback passed'], testLine: 1, executionMode: 'LOCAL_ISOLATED', httpBoundary: attachmentBoundary },
  evidenceIds: ['UT-ATT-001-RESULT'], limitation: 'Local isolated fixture only.', reviewStatus: 'PENDING_DONHV_REVIEW'
}
assert.doesNotThrow(() => atomic.writeAtomicBatch({
  runId: 'idts110-attachment-boundary-contract', sourceBaselineSha: manifest.sourceBaselineSha,
  catalogSha: 'a'.repeat(64), approvalReference: manifest.authorization, results: [attachmentBatchResult]
}, path.join(__dirname, '../../.tmp/idts-110/attachment-boundary-contract.json')))

const selected = execution.selectDefinition('--idts110-case=UT-AUTH-007')
assert.equal(selected.internalCaseKey, 'UT-AUTH-007')
assert.equal(execution.planForDefinition(selected).length, 1)

assert.throws(
  () => execution.selectDefinition('--idts110-case=UT-AUTH-999'),
  /unknown IDTS-110 case selector/i
)
assert.throws(
  () => execution.parseSelectedCase(['--idts110-case=UT-AUTH-007', '--idts110-case=UT-AUTH-008']),
  /exactly one case selector/i
)
assert.throws(
  () => execution.parseSelectedCase([]),
  /exactly one case selector/i
)

const mutationDefinition = execution.selectDefinition('--idts110-case=UT-BUG-001')
assert.throws(
  () => execution.validateExecutionEvidence(mutationDefinition, {
    assertionPassed: true,
    beforeState: { Bugs: 0 },
    afterState: null,
    reloadState: null,
    actualAssertions: ['draft created']
  }),
  /afterState|reloadState|required state/i
)

const odataDefinition = execution.selectDefinition('--idts110-case=UT-AUTH-007')
assert.equal(odataDefinition.testLevel, 'ODATA_CONTRACT')
assert.throws(
  () => execution.validateExecutionEvidence(odataDefinition, {
    assertionPassed: true,
    actualAssertions: ['observed response status'],
    httpBoundary: { transport: 'service.dispatch', status: 200 }
  }),
  /real local HTTP boundary/i
)
assert.doesNotThrow(() => execution.validateExecutionEvidence(odataDefinition, {
  assertionPassed: true,
  actualAssertions: ['observed response status'],
  httpBoundary: { transport: 'node:http', status: 200, request: 'GET /odata/v4/auth/me' }
}))

const attachmentBytes = Buffer.from('atomic attachment bytes', 'utf8')
const attachmentSha256 = require('node:crypto').createHash('sha256').update(attachmentBytes).digest('hex')
assert.doesNotThrow(() => execution.assertAttachmentReadback({
  metadata: { filename: 'atomic-safe.txt', mimeType: 'text/plain', fileSize: attachmentBytes.length },
  bytes: attachmentBytes,
  expected: { filename: 'atomic-safe.txt', mimeType: 'text/plain', sha256: attachmentSha256 }
}))
assert.throws(() => execution.assertAttachmentReadback({
  metadata: { filename: 'atomic-safe.txt', mimeType: 'text/plain', fileSize: attachmentBytes.length },
  bytes: Buffer.from('tampered bytes', 'utf8'),
  expected: { filename: 'atomic-safe.txt', mimeType: 'text/plain', sha256: attachmentSha256 }
}), /hash|byte|size/i)

assert.doesNotThrow(() => execution.assertNoAttachmentBeforeSave({
  before: { Attachments: 0 },
  draft: { attachments: [] }
}))
assert.throws(() => execution.assertNoAttachmentBeforeSave({
  before: { Attachments: 1 },
  draft: { attachments: [] }
}), /attachment|save/i)
assert.throws(() => execution.assertNoAttachmentBeforeSave({
  before: { Attachments: 0 },
  draft: { attachments: [{ ID: 'unexpected' }] }
}), /attachment|save/i)

assert.doesNotThrow(() => execution.assertSafeProviderFailure({
  ok: false,
  status: 'AI_PROVIDER_ERROR',
  error: { code: 'AI_PROVIDER_ERROR', summary: 'AI provider request failed.', retryable: false }
}))
assert.throws(() => execution.assertSafeProviderFailure({
  ok: false,
  status: 'AI_PROVIDER_ERROR',
  error: { code: 'AI_PROVIDER_ERROR', summary: 'Bearer leaked-token provider.example', retryable: false }
}), /unsafe|provider failure/i)

assert.doesNotThrow(() => execution.assertSafeProviderMetric({
  featureType: 'GENERAL', operation: 'chat', providerAlias: 'mock', modelAlias: 'idts110-atomic', status: 'AI_PROVIDER_ERROR', outcome: 'OTHER_FAILURE', latencyMs: 1
}))
assert.throws(() => execution.assertSafeProviderMetric({
  featureType: 'GENERAL', operation: 'chat', providerAlias: 'mock', modelAlias: 'idts110-atomic', status: 'AI_PROVIDER_ERROR', outcome: 'OTHER_FAILURE', latencyMs: 1, rawError: 'Bearer leaked-token'
}), /allowlist|unsafe/i)

const readOnlyState = { Bugs: 4, Notifications: 0, HistoryEvents: 0 }
const readOnlyRecord = { ID: 'atomic-notification', message: 'before' }
assert.doesNotThrow(() => execution.assertReadOnlyGuardOutcome({ status: 405, before: readOnlyState, after: { ...readOnlyState }, reload: { ...readOnlyState }, beforeRecord: readOnlyRecord, afterRecord: { ...readOnlyRecord } }))
assert.throws(() => execution.assertReadOnlyGuardOutcome({ status: 422, before: readOnlyState, after: { ...readOnlyState }, reload: { ...readOnlyState } }), /405|guard/i)
assert.throws(() => execution.assertReadOnlyGuardOutcome({ status: 405, before: readOnlyState, after: { ...readOnlyState, Notifications: 1 }, reload: { ...readOnlyState, Notifications: 1 } }), /unchanged|mutation/i)
assert.throws(() => execution.assertReadOnlyGuardOutcome({ status: 405, before: readOnlyState, after: { ...readOnlyState }, reload: { ...readOnlyState }, beforeRecord: readOnlyRecord, afterRecord: { ...readOnlyRecord, message: 'changed' } }), /record|mutation/i)

const aiBug = { status_code: 'PENDING_ASSIGNMENT', assignee_ID: null, nextProcessorUser_ID: 'pm', nextProcessorRole_code: 'PM', priority_code: 'HIGH', severity_code: 'MAJOR' }
assert.doesNotThrow(() => execution.assertAiReviewReadback({ beforeBug: aiBug, afterBug: { ...aiBug }, suggestion: { reviewState_code: 'ACCEPTED', reviewedBy_ID: 'reviewer', reviewedAt: '2026-08-03T00:00:00.000Z' }, expectedState: 'ACCEPTED' }))
assert.throws(() => execution.assertAiReviewReadback({ beforeBug: aiBug, afterBug: { ...aiBug, assignee_ID: 'mutated' }, suggestion: { reviewState_code: 'ACCEPTED', reviewedBy_ID: 'reviewer', reviewedAt: '2026-08-03T00:00:00.000Z' }, expectedState: 'ACCEPTED' }), /must not mutate/i)
assert.throws(() => execution.assertAiReviewReadback({ beforeBug: aiBug, afterBug: { ...aiBug }, suggestion: { reviewState_code: 'ACCEPTED', reviewedBy_ID: 'reviewer', reviewedAt: null }, expectedState: 'ACCEPTED' }), /timestamp/i)
assert.doesNotThrow(() => execution.assertAiHttpBoundary({ result: { status: 409 }, expectedStatus: 409, pathName: '/odata/v4/bug/action' }))
assert.throws(() => execution.assertAiHttpBoundary({ result: { status: 200 }, expectedStatus: 409, pathName: '/odata/v4/bug/action' }), /must return 409/i)

const classificationBefore = { ID: 'ai-classification-bug', status_code: 'PENDING_ASSIGNMENT', assignee_ID: null, nextProcessorUser_ID: 'pm', nextProcessorRole_code: 'PM', sapModule_ID: 'sap-before', applicationComponent_ID: 'component-before', defectCategory_ID: 'category-before', componentCategory_ID: 'pair-before', priority_code: 'HIGH', severity_code: 'MAJOR' }
const classificationAfter = { ...classificationBefore, priority_code: 'LOW' }
assert.doesNotThrow(() => execution.assertAiSuccessPayloadAndParity({ kind: 'classification', response: { ID: classificationBefore.ID, priority_code: 'LOW' }, bugID: classificationBefore.ID, beforeBug: classificationBefore, afterBug: classificationAfter, allowedPatch: { priority_code: 'LOW' } }))
assert.throws(() => execution.assertAiSuccessPayloadAndParity({ kind: 'classification', response: { ID: classificationBefore.ID, priority_code: 'HIGH' }, bugID: classificationBefore.ID, beforeBug: classificationBefore, afterBug: classificationAfter, allowedPatch: { priority_code: 'LOW' } }), /response priority/i)
assert.throws(() => execution.assertAiSuccessPayloadAndParity({ kind: 'classification', response: { ID: classificationBefore.ID, priority_code: 'LOW' }, bugID: classificationBefore.ID, beforeBug: classificationBefore, afterBug: { ...classificationAfter, severity_code: 'BLOCKER' }, allowedPatch: { priority_code: 'LOW' } }), /parity|unchanged/i)

const duplicateResponse = { ID: 'normalized-link', sourceBug_ID: 'source-bug', targetBug_ID: 'target-bug', relationType_code: 'SIMILAR' }
assert.doesNotThrow(() => execution.assertAiSuccessPayloadAndParity({ kind: 'duplicate', response: duplicateResponse, expectedLink: duplicateResponse }))
assert.throws(() => execution.assertAiSuccessPayloadAndParity({ kind: 'duplicate', response: { ...duplicateResponse, relationType_code: 'DUPLICATE' }, expectedLink: duplicateResponse }), /response relation/i)
assert.throws(() => execution.assertAiSuccessPayloadAndParity({ kind: 'duplicate', response: { ...duplicateResponse, targetBug_ID: 'other-target' }, expectedLink: duplicateResponse }), /response target/i)

const testFile = path.join(__dirname, 'test-idts110-mapping-atomic-execution.js')
assert.equal(path.basename(testFile), 'test-idts110-mapping-atomic-execution.js')
assert.doesNotThrow(() => execution.assertCoreOutcome('UT-BUG-008', { omitted: { description: 'x', reporter: 'a' }, before: { description: 'x', reporter: 'a' } }))
assert.throws(() => execution.assertCoreOutcome('UT-BUG-008', { omitted: { description: 'changed' }, before: { description: 'x' } }))
assert.doesNotThrow(() => execution.assertCoreOutcome('UT-CMT-007', { nextProcessor: { user: 'u', role: 'PM' }, beforeNextProcessor: { user: 'u', role: 'PM' } }))
assert.throws(() => execution.assertCoreOutcome('UT-CMT-007', { nextProcessor: { user: 'u', role: 'PM' }, beforeNextProcessor: { user: null, role: 'PM' } }))
assert.doesNotThrow(() => execution.assertCoreOutcome('UT-HIS-004', { rows: [{ createdAt: 2, summary: 'Resolved', groupedChangeContext: 'Status: Resolved' }, { createdAt: 1, summary: 'Bug', groupedChangeContext: 'Title: Bug' }] }))
assert.throws(() => execution.assertCoreOutcome('UT-HIS-004', { rows: [{ createdAt: 1, summary: 'Resolved', groupedChangeContext: 'Status: Resolved' }, { createdAt: 2, summary: 'Bug', groupedChangeContext: 'Title: Bug' }] }))
assert.doesNotThrow(() => execution.assertCoreOutcome('UT-MON-001', { openDelta: 3, overdueDelta: 1 }))
assert.throws(() => execution.assertCoreOutcome('UT-MON-001', { openDelta: 4, overdueDelta: 1 }))

console.log('IDTS-110 mapping atomic execution contract: PASS')
