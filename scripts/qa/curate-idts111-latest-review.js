'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')

const evidenceRoot = path.resolve('docs/pm/evidence/idts-111/uat')
const summaryPath = path.resolve('docs/pm/evidence/idts-111/latest-review-summary.json')
const reviewCommentId = '10962'
const reviewDate = '2026-08-04'
const checkOnly = process.argv.includes('--check')
const finalApprovedCaseIds = new Set(['UAT-COM-003', 'UAT-UX-003'])
const finalApprovalContract = {
  sourceHead: 'e3c8977cbdd981c90133e8e4c27fc8d7b6f44d34',
  executor: 'NhanT (DonHV support)',
  mergeSha: '54ad1b824d74f57e5d1a6e9dbd6208cd80768d8b',
  bugId: '029435e3-abb7-4079-826a-394709f9eb50',
  bugNumber: 'BUG-0021',
  actorRole: 'Project Manager',
  environment: 'SAP BTP AppRouter + XSUAA + SAP HANA Cloud',
  uiVersion: '0.0.16',
  uiArtifactSha256: 'F7949863FAD1677878B5E649155586FA8526683DCEDD7720213E0CC88FBB7AF4',
  reviewBoundary: 'Final PASS approved under the parent-authorized user decision; no Jira approval or Jira mutation is claimed.'
}

const stalePrerequisite = new Set(['UAT-AI-007', 'UAT-ATT-002', 'UAT-ATT-003'])
const historicalOldRuntime = new Set()
const defectRecheck = new Set()
const currentRuntimePositive = new Set(['UAT-AUTH-005', 'UAT-COM-001', 'UAT-COM-004'])
const fixtureProvenanceBlocked = new Set(['UAT-ATT-001'])
const currentRuntimeDefect = new Set(['UAT-BUG-008'])
const currentRuntimePartial = new Set(['UAT-UX-002'])
const semanticCorrection = new Set(['UAT-AI-008', 'UAT-AI-010', 'UAT-AI-014', 'UAT-AI-015', 'UAT-LIFE-014'])
const aiDiagnostic = new Set(['UAT-AI-005', 'UAT-AI-009'])

function hashEvidence (filePath) {
  const bytes = fs.readFileSync(filePath)
  const content = path.extname(filePath).toLowerCase() === '.json'
    ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')
    : bytes
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase()
}

function classify (manifest) {
  const id = manifest.caseId
  if (finalApprovedCaseIds.has(id)) return ['CURRENT_RUNTIME_POSITIVE', 'FINAL_PASS_APPROVED']
  if (currentRuntimePositive.has(id)) return ['CURRENT_RUNTIME_POSITIVE', 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW']
  if (fixtureProvenanceBlocked.has(id)) return ['FIXTURE_PROVENANCE_INCONSISTENT', 'BLOCKED_FIXTURE_PROVENANCE_INCONSISTENT']
  if (currentRuntimeDefect.has(id)) return ['CONFIRMED_DEFECT_RECHECK', 'CURRENT_RUNTIME_RERUN_COMPLETE_PENDING_DONHV_REVIEW']
  if (currentRuntimePartial.has(id)) return ['CURRENT_RUNTIME_PARTIAL_RECHECK', 'CURRENT_RUNTIME_PARTIAL_RECHECK']
  if (stalePrerequisite.has(id)) return ['STALE_PREREQUISITE_RERUN_REQUIRED', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (historicalOldRuntime.has(id)) return ['HISTORICAL_OLD_RUNTIME_NEGATIVE', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (defectRecheck.has(id)) return ['CONFIRMED_DEFECT_RECHECK', 'RERUN_REQUIRED_CURRENT_RUNTIME']
  if (semanticCorrection.has(id)) return ['CATALOG_SEMANTIC_CORRECTION', 'REVIEW_CORRECTION_REQUIRED']
  if (aiDiagnostic.has(id)) return ['AI_DIAGNOSTIC_RERUN', 'RERUN_REQUIRES_IMMUTABLE_ID_NETWORK_AUDIT']
  if (manifest.candidateExecutionStatus === 'EXECUTION_BLOCKED_PENDING_PRECONDITION') return ['VALID_PRECONDITION_BLOCKER', 'BLOCKED']
  if (manifest.candidateOutcome === 'MEETS_EXPECTED_RESULT') return ['RETAINED_TRUTHFUL_POSITIVE', 'CANDIDATE_EVIDENCE_RETAINED']
  throw new Error(`Unclassified manifest: ${id}`)
}

function validateFinalApprovalReceipt (manifest, manifestPath, requireContract) {
  const resolvedManifestPath = manifestPath
    ? path.resolve(manifestPath)
    : path.join(evidenceRoot, manifest.caseId, 'manifest.json')
  const receiptPath = path.join(path.dirname(resolvedManifestPath), '05-live-readback-receipt.json')
  if (!fs.existsSync(receiptPath)) throw new Error(`Missing final approval receipt: ${manifest.caseId}`)
  let receipt
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
  } catch {
    throw new Error(`Final approval receipt mismatch: ${manifest.caseId}: JSON`)
  }

  const receiptContract = (field, actual, expected) => requireContract(`receipt.${field}`, actual === expected)
  receiptContract('receiptType', receipt.receiptType, 'IDTS-111-UAT-COM-003-live-readback')
  receiptContract('caseId', receipt.caseId, manifest.caseId)
  receiptContract('approvedSourceHead', receipt.approvedSourceHead, finalApprovalContract.sourceHead)
  receiptContract('approvedMergeSha', receipt.approvedMergeSha, manifest.sourceMergeSha)
  receiptContract('deployedRuntimeSha', receipt.deployedRuntimeSha, manifest.deployedRuntimeSha)
  receiptContract('runtimeUiVersion', receipt.runtimeUiVersion, manifest.testRecord?.uiVersion)
  receiptContract('runtimeUiArtifactSha256', receipt.runtimeUiArtifactSha256, manifest.testRecord?.uiArtifactSha256)

  const current = receipt.currentReadOnlyReload
  receiptContract('currentReadOnlyReload.bugId', current?.bugId, manifest.testRecord?.bugId)
  receiptContract('currentReadOnlyReload.bugNumber', current?.bugNumber, manifest.testRecord?.bugNumber)
  receiptContract('currentReadOnlyReload.actor', current?.actor, manifest.testRecord?.actorDisplayName)
  receiptContract('currentReadOnlyReload.actorRole', current?.actorRole, manifest.testRecord?.actorRole)
  receiptContract('currentReadOnlyReload.commentListCount', current?.commentListCount, manifest.liveAcceptance?.oneThousand?.commentListCountAfterReload)
  receiptContract('currentReadOnlyReload.markerCounts.1000', current?.markerCounts?.['UAT-COM-003-1000|'], manifest.liveAcceptance?.oneThousand?.markerCountAfterReload)
  receiptContract('currentReadOnlyReload.markerCounts.1001', current?.markerCounts?.['UAT-COM-003-1001|'], manifest.liveAcceptance?.oneThousandOne?.markerCountAfterReload)

  const boundary = receipt.liveAcceptanceReference
  receiptContract('liveAcceptanceReference.oneThousand.inputLength', boundary?.oneThousand?.inputLength, manifest.liveAcceptance?.oneThousand?.inputLength)
  receiptContract('liveAcceptanceReference.oneThousand.markerCountAfterReload', boundary?.oneThousand?.markerCountAfterReload, manifest.liveAcceptance?.oneThousand?.markerCountAfterReload)
  receiptContract('liveAcceptanceReference.oneThousand.commentListCountAfterReload', boundary?.oneThousand?.commentListCountAfterReload, manifest.liveAcceptance?.oneThousand?.commentListCountAfterReload)
  receiptContract('liveAcceptanceReference.oneThousandOne.inputLength', boundary?.oneThousandOne?.inputLength, manifest.liveAcceptance?.oneThousandOne?.inputLength)
  receiptContract('liveAcceptanceReference.oneThousandOne.markerCountAfterReload', boundary?.oneThousandOne?.markerCountAfterReload, manifest.liveAcceptance?.oneThousandOne?.markerCountAfterReload)
  receiptContract('liveAcceptanceReference.oneThousandOne.commentListCountBefore', boundary?.oneThousandOne?.commentListCountBefore, manifest.liveAcceptance?.oneThousandOne?.commentListCountBefore)
  receiptContract('liveAcceptanceReference.oneThousandOne.commentListCountAfterReload', boundary?.oneThousandOne?.commentListCountAfterReload, manifest.liveAcceptance?.oneThousandOne?.commentListCountAfterReload)
  receiptContract('liveAcceptanceReference.oneThousandOne.httpStatus', boundary?.oneThousandOne?.httpStatus, manifest.liveAcceptance?.oneThousandOne?.httpStatus)
  receiptContract('liveAcceptanceReference.oneThousandOne.capReason', boundary?.oneThousandOne?.capReason, manifest.liveAcceptance?.oneThousandOne?.capReason)
  receiptContract('liveAcceptanceReference.oneThousandOne.partialOrTruncatedCommentStored', boundary?.oneThousandOne?.partialOrTruncatedCommentStored, manifest.liveAcceptance?.oneThousandOne?.partialOrTruncatedCommentStored)

  const rejection = receipt.priorRecordedRejection
  receiptContract('priorRecordedRejection.inputLength', rejection?.inputLength, 1001)
  receiptContract('priorRecordedRejection.httpStatus', rejection?.httpStatus, 400)
  receiptContract('priorRecordedRejection.capReason', rejection?.capReason, 'Comment cannot exceed 1000 characters.')
  receiptContract('priorRecordedRejection.partialOrTruncatedCommentStored', rejection?.partialOrTruncatedCommentStored, false)

  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : []
  const receiptEvidence = evidence.find(item => item.file === '05-live-readback-receipt.json')
  receiptContract('evidence.05-live-readback-receipt.json', Boolean(receiptEvidence), true)
  if (receiptEvidence) {
    const actualReceiptHash = hashEvidence(receiptPath)
    receiptContract('evidence.05-live-readback-receipt.json.sha256', String(receiptEvidence.sha256 || '').toUpperCase(), actualReceiptHash)
  }
  const screenshotReferences = Array.isArray(receipt.screenshotReferences) ? receipt.screenshotReferences : []
  for (const file of ['03-live-1000-pass.png', '04-live-1001-rejected.png']) {
    const manifestEvidence = evidence.find(item => item.file === file)
    const receiptEvidence = screenshotReferences.find(item => item.file === file)
    receiptContract(`screenshotReferences.${file}`, Boolean(manifestEvidence && receiptEvidence && receiptEvidence.sha256 === manifestEvidence.sha256), true)
  }
}

function validateUx003FinalApproval (manifest, manifestPath) {
  const requireContract = (field, condition) => {
    if (!condition) throw new Error(`Final approval contract mismatch: ${manifest.caseId}: ${field}`)
  }
  const resolvedManifestPath = manifestPath ? path.resolve(manifestPath) : path.join(evidenceRoot, manifest.caseId, 'manifest.json')
  const attestationPath = path.join(path.dirname(resolvedManifestPath), '02-manual-physical-keyboard-attestation.json')
  requireContract('attestation.exists', fs.existsSync(attestationPath))
  let attestation
  try {
    attestation = JSON.parse(fs.readFileSync(attestationPath, 'utf8'))
  } catch {
    throw new Error(`Final approval receipt mismatch: ${manifest.caseId}: JSON`)
  }
  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : []
  const attestationEvidence = evidence.find(item => item.file === '02-manual-physical-keyboard-attestation.json')
  requireContract('evidence.attestation', Boolean(attestationEvidence))
  if (attestationEvidence) requireContract('evidence.attestation.sha256', String(attestationEvidence.sha256 || '').toUpperCase() === hashEvidence(attestationPath))
  requireContract('attestation.fields', JSON.stringify(Object.keys(attestation).sort()) === JSON.stringify(['caseId', 'date', 'deployedRuntimeTruth', 'evidencePreparer', 'evidenceReference', 'limitation', 'manualVerifier', 'outcomes', 'result', 'schemaVersion', 'sourceHead'].sort()))
  requireContract('attestation.schema/case', attestation.schemaVersion === '1.0' && attestation.caseId === manifest.caseId)
  requireContract('attestation.verifier/preparer/date', attestation.manualVerifier === 'DonHV' && manifest.manualVerifier === 'DonHV' && attestation.evidencePreparer === 'NhanT (DonHV support)' && manifest.evidencePreparer === attestation.evidencePreparer && attestation.date === '2026-09-12')
  const outcomes = attestation.outcomes || {}
  const outcomeFields = ['visibleFocus', 'tabReachesFindSimilarBugsAndCoreControls', 'enterOpensSimilarBugs', 'arrowKeysNavigateCompositeList', 'tabReachesDialogActions', 'escapeClosesDialog', 'focusReturnsToTrigger']
  requireContract('attestation.outcomes', Object.keys(outcomes).length === outcomeFields.length && outcomeFields.every(field => outcomes[field] === true))
  requireContract('attestation.result/sourceHead', attestation.result === 'PASS' && attestation.sourceHead === '4ab336388fb744b82abdfe6ef8f7c334b4075428' && manifest.currentSourceHead === attestation.sourceHead)
  requireContract('attestation.deployedRuntimeTruth', attestation.deployedRuntimeTruth?.deployedRuntimeSha === manifest.deployedRuntimeSha && attestation.deployedRuntimeTruth?.deployedRuntimeSha === '67b1bf86169e9696c9365ef4846b99ffae30d4e2' && attestation.deployedRuntimeTruth?.source === 'existing UAT-UX-003 baseline manifest; no new deployment claimed')
  requireContract('attestation.evidenceReference', attestation.evidenceReference?.file === '01-focus-return-after-keyboard-dialog.png' && attestation.evidenceReference?.sha256 === '4493FF9E511A68DEBF408285F96555F73C5AFDB0FE0D02AD1D83AF6479E984E9')
  const e01Path = path.join(path.dirname(resolvedManifestPath), attestation.evidenceReference?.file || '')
  requireContract('attestation.evidenceReference.file/hash', fs.existsSync(e01Path) && hashEvidence(e01Path) === attestation.evidenceReference.sha256)
  requireContract('attestation.limitation', attestation.limitation === 'The physical keyboard sequence is human-attested; no browser automation, simulated key events, device, timestamp, or raw keylog is claimed.')
  const historical = manifest.historicalAutomationLimitation
  requireContract('historicalAutomationLimitation', historical?.preserved === true && historical.executor === 'NhanT' && historical.candidateExecutionStatus === 'EXECUTED_PENDING_DONHV_REVIEW' && historical.candidateOutcome === 'DOES_NOT_MEET_EXPECTED_RESULT' && historical.evidenceReference?.id === 'UAT-UX-003-E01' && historical.evidenceReference.file === '01-focus-return-after-keyboard-dialog.png' && historical.evidenceReference.sha256 === attestation.evidenceReference.sha256)
  requireContract('historicalAutomationLimitation.failure', typeof historical.actualResult === 'string' && /Tab.*did not advance/i.test(historical.actualResult) && /Browser.*physical keyboard/i.test(historical.limitation || ''))
  requireContract('manifest.currentPass', manifest.candidateExecutionStatus === 'PASS' && manifest.candidateOutcome === 'MEETS_EXPECTED_RESULT' && manifest.executor === 'DonHV' && typeof manifest.reviewBoundary === 'string' && !/\b(?:pending|candidate|not final|unapproved|await(?:ing)?|needs?)\b/i.test(manifest.reviewBoundary))
  const expectedReview = { jiraCommentId: reviewCommentId, reviewDate: '2026-09-12', category: 'CURRENT_RUNTIME_POSITIVE', currentStatus: 'FINAL_PASS_APPROVED', preservesHistoricalCandidateTruth: true, finalPassApproved: true }
  requireContract('donhvLatestReview', JSON.stringify(manifest.donhvLatestReview) === JSON.stringify(expectedReview))
  return expectedReview
}

function validateUx002PartialEvidence (manifest, manifestPath) {
  const requireContract = (field, condition) => {
    if (!condition) throw new Error(`UAT-UX-002 evidence contract mismatch: ${field}`)
  }
  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : []
  const currentFiles = [
    '02-live-classification-review.jpg',
    'ux002-receipt.json'
  ]
  for (const file of currentFiles) {
    const item = evidence.find(entry => entry.file === file)
    requireContract(`currentEvidence.${file}`, Boolean(item && item.historical === false))
  }

  const historicalFiles = [
    '01-tablet-list-report.png',
    '02-tablet-object-page.png',
    '03-tablet-ai-dialog.png'
  ]
  const historicalEvidence = Array.isArray(manifest.historicalEvidence) ? manifest.historicalEvidence : []
  requireContract('historicalEvidence.files', historicalEvidence.length === historicalFiles.length && historicalFiles.every(file => {
    const item = historicalEvidence.find(entry => entry.file === file)
    const topLevel = evidence.find(entry => entry.file === file)
    return Boolean(item && item.historical === true && topLevel && topLevel.historical === true && item.sha256 === topLevel.sha256)
  }))

  const receiptPath = path.join(path.dirname(path.join(evidenceRoot, manifest.caseId, 'manifest.json')), 'ux002-receipt.json')
  requireContract('receipt.exists', fs.existsSync(receiptPath))
  let receipt
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
  } catch {
    throw new Error('UAT-UX-002 evidence contract mismatch: receipt.JSON')
  }
  const review = manifest.donhvLatestReview || {}
  requireContract('manifest.result', manifest.currentResult === 'PARTIAL' && manifest.result === 'PARTIAL')
  requireContract('manifest.candidateOutcome', manifest.candidateOutcome === 'DOES_NOT_MEET_EXPECTED_RESULT')
  requireContract('manifest.reviewMetadata', review.finalPassApproved === false && review.currentStatus === 'CURRENT_RUNTIME_PARTIAL_RECHECK')
  requireContract('manifest.reviewBoundary', typeof manifest.reviewBoundary === 'string' && !/\b(?:pending|final[\s-]?pass|final-approved|await(?:ing)?|needs?)\b/i.test(manifest.reviewBoundary))
  requireContract('manifest.localRegression', manifest.localDeterministicRegression?.result === 'PASS' && manifest.localDeterministicRegression?.commit === '88a553d9c3e514a1d5fd2e35c5a3587b3d69c6c6')
  requireContract('manifest.bugIdentity', manifest.liveRecheck?.bug?.id === 'fe16378d-88fe-4f70-8301-5cbcea4f3d6a' && manifest.liveRecheck?.bug?.number === 'BUG-0016')
  requireContract('receipt.result', receipt.result === 'PARTIAL' && /fewer than 2 candidates/i.test(receipt.resultReason || ''))
  requireContract('receipt.bugIdentity', receipt.operator?.exactBugId === manifest.liveRecheck?.bug?.id && receipt.operator?.bugNumber === manifest.liveRecheck?.bug?.number)
  requireContract('receipt.viewport', receipt.operator?.viewport?.width === 834 && receipt.operator?.viewport?.height === 1112)
  const ledger = receipt.callLedger
  const expectedFeatures = ['Similar Bugs', 'Classification Review', 'Smart Assignment explanation', 'Handoff Summary']
  requireContract('receipt.callLedgerShape', Array.isArray(ledger) && ledger.length === 4 && ledger.every((entry, index) => entry.ordinal === index + 1) && new Set(ledger.map(entry => entry.ordinal)).size === 4 && ledger.map(entry => entry.feature).every((feature, index) => feature === expectedFeatures[index]))
  requireContract('receipt.providerCallSum', ledger.reduce((sum, entry) => sum + entry.providerCalls, 0) === 4)
  requireContract('receipt.authorization', receipt.authorization?.totalProviderCalls === 4 && receipt.authorization?.duplicateSimilarCallMade === false)
  requireContract('receipt.similarBugs', ledger[0]?.providerCalls === 1 && ledger[0]?.candidateCount === 5 && ledger[0]?.source === 'prior owner; not reinvoked')
  requireContract('receipt.classification', ledger[1]?.providerCalls === 1 && ledger[1]?.uiSuggestionRowCount === 5 && ledger[1]?.httpStatus === 200)
  requireContract('receipt.smartAssignment', ledger[2]?.providerCalls === 1 && ledger[2]?.candidateCount === 1 && ledger[2]?.noRetry === true && ledger[2]?.status === 'PARTIAL')
  requireContract('receipt.handoffTelemetry', ledger[3]?.providerCalls === 1 && ledger[3]?.status === 'PASS_UI_TELEMETRY_GAP' && ledger[3]?.uiSettled === true && ledger[3]?.networkMatchingEventsObserved === 0 && ledger[3]?.browserActionAttempts === 2 && /timeout/i.test(ledger[3]?.firstClickOutcome || '') && /no dialog\/network/i.test(ledger[3]?.firstClickOutcome || '') && /settled/i.test(ledger[3]?.secondClickOutcome || '') && ledger[3]?.transportEventStatus === 'UNAVAILABLE_NOT_OBSERVED')
  requireContract('receipt.forbiddenActions', Array.isArray(receipt.authorization?.forbiddenActionsInvoked) && receipt.authorization.forbiddenActionsInvoked.length === 0)
  const receiptInvariants = receipt.businessSnapshot?.invariants || {}
  const manifestMutation = manifest.liveRecheck?.businessMutation || {}
  const invariantFields = ['statusUnchanged', 'assigneeUnchanged', 'ownerUnchanged', 'commentsUnchanged', 'attachmentsUnchanged']
  requireContract('receipt.businessInvariants', invariantFields.every(field => receiptInvariants[field] === true))
  const manifestInvariantFields = ['statusUnchanged', 'assigneeUnchanged', 'currentOwnerUnchanged', 'commentsUnchanged', 'attachmentsUnchanged']
  requireContract('manifest.businessInvariants', manifestMutation.forbiddenActionsInvoked?.length === 0 && manifestInvariantFields.every(field => manifestMutation[field] === true) && manifestMutation.aiSuggestionsCountDelta === null)
  requireContract('receipt.noAuditDeltaClaim', receipt.audit?.delta === null && receipt.audit?.aiSuggestionsBeforeCount === null && receipt.audit?.aiSuggestionsAfterCount === null && receipt.audit?.originalPreCallCountCaptured === false)
  requireContract('receipt.localRegression', receipt.provenance?.localDeterministicRegression?.result === 'PASS' && receipt.provenance?.localDeterministicRegression?.commit === '88a553d9c3e514a1d5fd2e35c5a3587b3d69c6c6')
  const receiptText = fs.readFileSync(receiptPath, 'utf8')
  requireContract('receipt.sanitized', !/(?:[A-Z]:[\\/]|\.staging|tabId|sessionId|freshTabId|@|donhv|nhant|sangvn|datdt|smart-assignment\.png|01-live-before\.jpg|03-live-handoff-summary-top\.jpg|04-live-final\.jpg)/i.test(receiptText))
  requireContract('receipt.screenshotAllowlist', receipt.artifacts?.screenshots?.length === 1 && receipt.artifacts.screenshots[0]?.path === 'uat/UAT-UX-002/02-live-classification-review.jpg' && receipt.artifacts.screenshots[0]?.encoding === 'jpeg' && receipt.artifacts.screenshots[0]?.bytes === 111931 && receipt.artifacts.screenshots[0]?.sha256 === evidence.find(item => item.file === '02-live-classification-review.jpg')?.sha256)
  const receiptEvidence = evidence.find(entry => entry.file === 'ux002-receipt.json')
  requireContract('receipt.sha256', Boolean(receiptEvidence) && String(receiptEvidence.sha256).toUpperCase() === hashEvidence(receiptPath))
}

function expectedReviewFor (manifest, manifestPath) {
  const [category, currentStatus] = classify(manifest)
  if (manifest.caseId === 'UAT-COM-003') {
    const requireContract = (field, condition) => {
      if (!condition) throw new Error(`Final approval contract mismatch: ${manifest.caseId}: ${field}`)
    }
    requireContract('executor', manifest.executor === finalApprovalContract.executor)
    for (const field of ['sourceMergeSha', 'executionBaselineSha', 'deployedRuntimeSha']) {
      requireContract(field, manifest[field] === finalApprovalContract.mergeSha)
    }
    requireContract('testRecord.bugId', manifest.testRecord?.bugId === finalApprovalContract.bugId)
    requireContract('testRecord.bugNumber', manifest.testRecord?.bugNumber === finalApprovalContract.bugNumber)
    requireContract('testRecord.actorRole', manifest.testRecord?.actorRole === finalApprovalContract.actorRole)
    requireContract('testRecord.environment', manifest.testRecord?.environment === finalApprovalContract.environment)
    requireContract('testRecord.uiVersion', manifest.testRecord?.uiVersion === finalApprovalContract.uiVersion)
    requireContract('testRecord.uiArtifactSha256', manifest.testRecord?.uiArtifactSha256 === finalApprovalContract.uiArtifactSha256)
    requireContract('reviewBoundary', manifest.reviewBoundary === finalApprovalContract.reviewBoundary && !/\b(?:pending|candidate|not final|unapproved|await(?:ing)?|needs?)\b/i.test(manifest.reviewBoundary || ''))
    const oneThousand = manifest.liveAcceptance?.oneThousand
    const oneThousandOne = manifest.liveAcceptance?.oneThousandOne
    requireContract('liveAcceptance.oneThousand.inputLength', oneThousand?.inputLength === 1000)
    requireContract('liveAcceptance.oneThousand.markerPrefix', oneThousand?.markerPrefix === 'UAT-COM-003-1000|')
    requireContract('liveAcceptance.oneThousand.markerCountAfterReload', oneThousand?.markerCountAfterReload === 1)
    requireContract('liveAcceptance.oneThousand.commentListCountAfterReload', oneThousand?.commentListCountAfterReload === 2)
    requireContract('liveAcceptance.oneThousand.reloadResult', typeof oneThousand?.reloadResult === 'string' && oneThousand.reloadResult.length > 0)
    requireContract('liveAcceptance.oneThousandOne.inputLength', oneThousandOne?.inputLength === 1001)
    requireContract('liveAcceptance.oneThousandOne.markerPrefix', oneThousandOne?.markerPrefix === 'UAT-COM-003-1001|')
    requireContract('liveAcceptance.oneThousandOne.markerCountAfterReload', oneThousandOne?.markerCountAfterReload === 0)
    requireContract('liveAcceptance.oneThousandOne.httpStatus', oneThousandOne?.httpStatus === 400)
    requireContract('liveAcceptance.oneThousandOne.commentListCountBefore', oneThousandOne?.commentListCountBefore === 2)
    requireContract('liveAcceptance.oneThousandOne.commentListCountAfterReload', oneThousandOne?.commentListCountAfterReload === 2)
    requireContract('liveAcceptance.oneThousandOne.capReason', oneThousandOne?.capReason === 'Comment cannot exceed 1000 characters.')
    requireContract('liveAcceptance.oneThousandOne.partialOrTruncatedCommentStored', oneThousandOne?.partialOrTruncatedCommentStored === false)
    requireContract('liveAcceptance.oneThousandOne.textAreaRetainedOnError', oneThousandOne?.textAreaRetainedOnError === true)
    requireContract('historicalFailure.preserved', manifest.historicalFailure?.preserved === true)
    requireContract('historicalFailure.candidateOutcome', manifest.historicalFailure?.candidateOutcome === 'DOES_NOT_MEET_EXPECTED_RESULT')
    requireContract('historicalFailure.actualResult', typeof manifest.historicalFailure?.actualResult === 'string' && /1006-character.*accepted.*remained listed after reload/i.test(manifest.historicalFailure.actualResult))
    const declaredEvidence = new Set((Array.isArray(manifest.evidence) ? manifest.evidence : []).map(item => `${item.id}:${item.file}`))
    requireContract('evidence', declaredEvidence.has('UAT-COM-003-E03:03-live-1000-pass.png'))
    requireContract('evidence', declaredEvidence.has('UAT-COM-003-E04:04-live-1001-rejected.png'))
    requireContract('evidence', declaredEvidence.has('UAT-COM-003-E05:05-live-readback-receipt.json'))
    validateFinalApprovalReceipt(manifest, manifestPath, requireContract)
    if (manifest.candidateExecutionStatus !== 'PASS' ||
      manifest.candidateOutcome !== 'MEETS_EXPECTED_RESULT' ||
      manifest.donhvLatestReview?.currentStatus !== 'FINAL_PASS_APPROVED' ||
      manifest.donhvLatestReview?.finalPassApproved !== true) {
      throw new Error(`Final approval metadata mismatch: ${manifest.caseId}`)
    }
    const expectedReview = {
      jiraCommentId: reviewCommentId,
      reviewDate,
      category,
      currentStatus,
      preservesHistoricalCandidateTruth: true,
      finalPassApproved: true
    }
    if (JSON.stringify(manifest.donhvLatestReview) !== JSON.stringify(expectedReview)) {
      throw new Error(`Final approval metadata mismatch: ${manifest.caseId}`)
    }
    return expectedReview
  }

  if (manifest.caseId === 'UAT-UX-003') return validateUx003FinalApproval(manifest, manifestPath)
  if (manifest.caseId === 'UAT-UX-002') validateUx002PartialEvidence(manifest, manifestPath)

  if (manifest.donhvLatestReview?.currentStatus === 'FINAL_PASS_APPROVED' ||
    manifest.donhvLatestReview?.finalPassApproved === true) {
    throw new Error(`Final approval is not allowlisted: ${manifest.caseId}`)
  }

  return {
    jiraCommentId: reviewCommentId,
    reviewDate,
    category,
    currentStatus,
    preservesHistoricalCandidateTruth: true,
    finalPassApproved: false
  }
}

const caseDirectories = fs.readdirSync(evidenceRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
const manifests = caseDirectories.map(entry => path.join(evidenceRoot, entry.name, 'manifest.json'))

if (manifests.length !== 57) throw new Error(`Manifest count: expected 57, got ${manifests.length}`)
for (const manifestPath of manifests) {
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest: ${path.relative(process.cwd(), manifestPath)}`)
}

const counts = {}
const candidateDisposition = {}
const caseIds = new Set()
const evidenceHashes = new Set()
let evidenceReferences = 0
for (const manifestPath of manifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (!manifest.caseId || caseIds.has(manifest.caseId)) throw new Error(`Duplicate or missing Case ID: ${manifest.caseId || manifestPath}`)
  caseIds.add(manifest.caseId)
  const rawCandidateStatus = manifest.candidateOutcome || manifest.candidateExecutionStatus
  const candidateStatus = rawCandidateStatus === 'NOT_EXECUTABLE_WITH_CURRENT_PRECONDITION' ||
    rawCandidateStatus === 'EXECUTION_BLOCKED_PENDING_PRECONDITION'
    ? 'BLOCKED'
    : rawCandidateStatus
  if (!candidateStatus) throw new Error(`Missing candidate disposition: ${manifest.caseId}`)
  candidateDisposition[candidateStatus] = (candidateDisposition[candidateStatus] || 0) + 1

  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : []
  evidenceReferences += evidence.length
  for (const item of evidence) {
    const evidencePath = path.join(path.dirname(manifestPath), item.file || '')
    if (!item.file || !fs.existsSync(evidencePath)) throw new Error(`Missing evidence for ${manifest.caseId}: ${item.file || '<empty>'}`)
    const actualHash = hashEvidence(evidencePath)
    const declaredHash = String(item.sha256 || '').toUpperCase()
    if (actualHash !== declaredHash) throw new Error(`Evidence SHA-256 mismatch: ${manifest.caseId}/${item.file}`)
    evidenceHashes.add(actualHash)
  }
  const expectedReview = expectedReviewFor(manifest, manifestPath)
  if (historicalOldRuntime.has(manifest.caseId)) expectedReview.historicalEvidenceOnly = true
  if (checkOnly) {
    if (JSON.stringify(manifest.donhvLatestReview) !== JSON.stringify(expectedReview)) {
      throw new Error(`Review metadata mismatch: ${manifest.caseId}`)
    }
  } else {
    manifest.donhvLatestReview = expectedReview
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }
  counts[expectedReview.category] = (counts[expectedReview.category] || 0) + 1
}

const expected = {
  RETAINED_TRUTHFUL_POSITIVE: 19,
  VALID_PRECONDITION_BLOCKER: 20,
  STALE_PREREQUISITE_RERUN_REQUIRED: 3,
  CONFIRMED_DEFECT_RECHECK: 1,
  CATALOG_SEMANTIC_CORRECTION: 5,
  PHYSICAL_KEYBOARD_LIMITATION: 0,
  AI_DIAGNOSTIC_RERUN: 2,
  CURRENT_RUNTIME_POSITIVE: 5,
  CURRENT_RUNTIME_NEGATIVE: 0,
  FIXTURE_PROVENANCE_INCONSISTENT: 1,
  CURRENT_RUNTIME_PARTIAL_RECHECK: 1
}

for (const [category, expectedCount] of Object.entries(expected)) {
  if ((counts[category] || 0) !== expectedCount) throw new Error(`${category}: expected ${expectedCount}, got ${counts[category] || 0}`)
}

const expectedDisposition = {
  MEETS_EXPECTED_RESULT: 24,
  DOES_NOT_MEET_EXPECTED_RESULT: 10,
  BLOCKED: 23
}
for (const [status, expectedCount] of Object.entries(expectedDisposition)) {
  if (candidateDisposition[status] !== expectedCount) throw new Error(`${status}: expected ${expectedCount}, got ${candidateDisposition[status] || 0}`)
}
if (evidenceReferences !== 81) throw new Error(`Evidence references: expected 81, got ${evidenceReferences}`)
if (evidenceHashes.size !== 68) throw new Error(`Unique evidence hashes: expected 68, got ${evidenceHashes.size}`)

const attachmentManifest = JSON.parse(fs.readFileSync(path.join(evidenceRoot, 'UAT-ATT-001', 'manifest.json'), 'utf8'))
const attachmentText = JSON.stringify(attachmentManifest)
if (attachmentManifest.testRecord?.sizeBytes !== 44 || !attachmentText.includes('54-byte') || !attachmentText.includes('47-byte')) {
  throw new Error('UAT-ATT-001 fixture provenance no longer exposes the preserved 44/54/47-byte inconsistency')
}

const summary = {
  jiraCommentId: reviewCommentId,
  reviewDate,
  curatedAtBaselineHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  manifests: manifests.length,
  evidenceReferences,
  uniqueEvidenceHashes: evidenceHashes.size,
  currentDisposition: expectedDisposition,
  counts,
  runtimeRerunPerformed: true,
  runtimeRerunLimitation: 'AI immutable suggestion IDs and sanitized Network responses remain unavailable; UAT-UX-002 Smart Assignment returned one candidate with no retry and Handoff matching transport telemetry was unavailable. UAT-UX-003 physical-keyboard evidence is human-attested and its historical Browser limitation remains preserved.',
  finalApprovals: {
    'UAT-COM-003': {
      status: 'FINAL_PASS_APPROVED',
      historicalFailurePreserved: true,
      receipt: 'uat/UAT-COM-003/05-live-readback-receipt.json'
    },
    'UAT-UX-003': {
      status: 'FINAL_PASS_APPROVED',
      historicalFailurePreserved: true,
      receipt: 'uat/UAT-UX-003/02-manual-physical-keyboard-attestation.json'
    }
  },
  workbookAndDriveChanged: false
}

if (!checkOnly) fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ ...summary, mode: checkOnly ? 'CHECK_ONLY' : 'WRITE' }))

module.exports = { classify, expectedReviewFor, finalApprovedCaseIds, validateUx003FinalApproval, validateUx002PartialEvidence, hashEvidence }
