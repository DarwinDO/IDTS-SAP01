'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')

const projectRoot = process.cwd()
const evidenceRoot = path.join(projectRoot, 'docs/pm/evidence/idts-111/uat')
const realUxManifestPath = path.join(evidenceRoot, 'UAT-UX-003/manifest.json')
const realUxManifest = JSON.parse(fs.readFileSync(realUxManifestPath, 'utf8'))
const historicalEvidence = realUxManifest.historicalAutomationLimitation?.evidence?.[0] || realUxManifest.evidence[0]
const BASELINE_SOURCE_HEAD = '4ab336388fb744b82abdfe6ef8f7c334b4075428'
const historicalRecord = realUxManifest.historicalAutomationLimitation || {
  executor: realUxManifest.executor,
  candidateExecutionStatus: realUxManifest.candidateExecutionStatus,
  executedAt: realUxManifest.executedAt,
  candidateOutcome: realUxManifest.candidateOutcome,
  actualResult: realUxManifest.actualResult,
  reviewBoundary: realUxManifest.reviewBoundary,
  keyboardTrace: realUxManifest.keyboardTrace,
  limitation: realUxManifest.limitations[0]
}
const currentSourceHead = '4ab336388fb744b82abdfe6ef8f7c334b4075428'
const deployedRuntimeSha = realUxManifest.deployedRuntimeSha

function writeJson (filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function rawSha256 (filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase()
}

function buildAttestation () {
  return {
    schemaVersion: '1.0',
    caseId: 'UAT-UX-003',
    manualVerifier: 'DonHV',
    evidencePreparer: 'NhanT (DonHV support)',
    date: '2026-09-12',
    outcomes: {
      visibleFocus: true,
      tabReachesFindSimilarBugsAndCoreControls: true,
      enterOpensSimilarBugs: true,
      arrowKeysNavigateCompositeList: true,
      tabReachesDialogActions: true,
      escapeClosesDialog: true,
      focusReturnsToTrigger: true
    },
    result: 'PASS',
    sourceHead: currentSourceHead,
    deployedRuntimeTruth: {
      deployedRuntimeSha,
      source: 'existing UAT-UX-003 baseline manifest; no new deployment claimed'
    },
    evidenceReference: {
      file: historicalEvidence.file,
      sha256: historicalEvidence.sha256
    },
    limitation: 'The physical keyboard sequence is human-attested; no browser automation, simulated key events, device, timestamp, or raw keylog is claimed.'
  }
}

function buildFinalManifest (attestationHash) {
  return {
    ...realUxManifest,
    candidateExecutionStatus: 'PASS',
    executor: 'DonHV',
    manualVerifier: 'DonHV',
    evidencePreparer: 'NhanT (DonHV support)',
    catalogMergeSha: realUxManifest.catalogMergeSha,
    executionBaselineSha: realUxManifest.executionBaselineSha,
    deployedRuntimeSha,
    currentSourceHead,
    expectedResult: realUxManifest.expectedResult,
    actualResult: 'DonHV physically executed the seven-step keyboard sequence and observed visible focus, control-to-control Tab navigation, Enter dialog opening, arrow-key composite-list navigation, dialog-action reachability, Escape close, and focus return to the trigger.',
    candidateOutcome: 'MEETS_EXPECTED_RESULT',
    reviewBoundary: 'Final PASS approved under the parent-authorized physical-keyboard attestation; the historical Browser automation limitation remains preserved.',
    evidence: [historicalEvidence, {
      id: 'UAT-UX-003-E02',
      file: '02-manual-physical-keyboard-attestation.json',
      description: 'DonHV human attestation of the physical keyboard sequence; no simulated browser key result is claimed.',
      sha256: attestationHash
    }],
    historicalAutomationLimitation: {
      preserved: true,
      executor: historicalRecord.executor,
      candidateExecutionStatus: historicalRecord.candidateExecutionStatus,
      executedAt: historicalRecord.executedAt,
      candidateOutcome: historicalRecord.candidateOutcome,
      actualResult: historicalRecord.actualResult,
      reviewBoundary: historicalRecord.reviewBoundary,
      keyboardTrace: historicalRecord.keyboardTrace,
      evidenceReference: historicalEvidence,
      limitation: historicalRecord.limitation
    },
    limitations: [buildAttestation().limitation],
    donhvLatestReview: {
      jiraCommentId: '10962',
      reviewDate: '2026-09-12',
      category: 'CURRENT_RUNTIME_POSITIVE',
      currentStatus: 'FINAL_PASS_APPROVED',
      preservesHistoricalCandidateTruth: true,
      finalPassApproved: true
    }
  }
}

function loadCheckerInTempRepo () {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'idts111-ux003-curation-'))
  const temporaryEvidenceRoot = path.join(temporary, 'docs/pm/evidence/idts-111/uat')
  fs.cpSync(evidenceRoot, temporaryEvidenceRoot, { recursive: true })
  fs.mkdirSync(path.join(temporary, 'scripts/qa'), { recursive: true })
  const sourceScript = path.join(projectRoot, 'scripts/qa/curate-idts111-latest-review.js')
  const temporaryScript = path.join(temporary, 'scripts/qa/curate-idts111-latest-review.js')
  fs.copyFileSync(sourceScript, temporaryScript)

  const git = args => {
    const result = spawnSync('git', args, { cwd: temporary, encoding: 'utf8' })
    assert.equal(result.status, 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`)
  }
  git(['init', '--quiet'])
  git(['config', 'user.email', 'idts111-ux003-test@example.invalid'])
  git(['config', 'user.name', 'IDTS-111 UX003 regression'])
  git(['add', '.'])
  git(['commit', '--quiet', '-m', 'temporary curation fixture'])

  const previousCwd = process.cwd()
  const previousArgv = process.argv
  process.chdir(temporary)
  process.argv = [process.execPath, temporaryScript, '--check']
  try {
    delete require.cache[require.resolve(temporaryScript)]
    return { temporary, checker: require(temporaryScript), temporaryEvidenceRoot, temporaryScript }
  } finally {
    process.argv = previousArgv
    process.chdir(previousCwd)
  }
}

const failures = []
function check (name, callback) {
  try {
    callback()
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
  }
}

const fixture = loadCheckerInTempRepo()
const { checker, temporary, temporaryEvidenceRoot, temporaryScript } = fixture
const { expectedReviewFor, finalApprovedCaseIds, validateUx003FinalApproval, hashEvidence } = checker

check('UX003 final approval is allowlisted', () => {
  assert.equal(finalApprovedCaseIds.has('UAT-UX-003'), true)
})

check('exact baseline checker does not allowlist UX003 while current source does', () => {
  let baselineSource
  try {
    baselineSource = execFileSync('git', ['show', `${BASELINE_SOURCE_HEAD}:scripts/qa/curate-idts111-latest-review.js`], { encoding: 'utf8' })
  } catch (error) {
    throw new Error(`Baseline checker unavailable at ${BASELINE_SOURCE_HEAD}: ${error.message}`)
  }
  assert.match(baselineSource, /const finalApprovedCaseIds = new Set\(\['UAT-COM-003'\]\)/)
  assert.equal(finalApprovedCaseIds.has('UAT-UX-003'), true)
})

check('UX003 validator is exported', () => {
  assert.equal(typeof validateUx003FinalApproval, 'function')
})

check('JSON LF and CRLF hashes are identical while PNG remains raw-byte hashed', () => {
  const hashRoot = fs.mkdtempSync(path.join(temporary, 'hash-'))
  const lf = path.join(hashRoot, 'evidence.json')
  const crlf = path.join(hashRoot, 'evidence-crlf.json')
  const pngLf = path.join(hashRoot, 'evidence.png')
  const pngCrLf = path.join(hashRoot, 'evidence-crlf.png')
  fs.writeFileSync(lf, '{"ok":true}\n', 'utf8')
  fs.writeFileSync(crlf, '{"ok":true}\r\n', 'utf8')
  fs.writeFileSync(pngLf, Buffer.from([0x7b, 0x0a]))
  fs.writeFileSync(pngCrLf, Buffer.from([0x7b, 0x0d, 0x0a]))
  assert.equal(hashEvidence(lf), hashEvidence(crlf))
  assert.notEqual(hashEvidence(pngLf), hashEvidence(pngCrLf))
})

const attestationRoot = fs.mkdtempSync(path.join(temporary, 'ux003-'))
const attestationPath = path.join(attestationRoot, '02-manual-physical-keyboard-attestation.json')
const manifestPath = path.join(attestationRoot, 'manifest.json')
const attestation = buildAttestation()
fs.copyFileSync(path.join(evidenceRoot, 'UAT-UX-003/01-focus-return-after-keyboard-dialog.png'), path.join(attestationRoot, historicalEvidence.file))
writeJson(attestationPath, attestation)
const attestationHash = rawSha256(attestationPath)
const finalManifest = buildFinalManifest(attestationHash)
writeJson(manifestPath, finalManifest)

check('UX003 final manifest satisfies the exact approval contract', () => {
  assert.doesNotThrow(() => validateUx003FinalApproval(finalManifest, manifestPath))
})

check('expectedReviewFor dispatches UX003 to final approval', () => {
  assert.deepEqual(expectedReviewFor(finalManifest, manifestPath), finalManifest.donhvLatestReview)
})

function withAttestationVariant (mutate, assertion) {
  const variant = structuredClone(attestation)
  mutate(variant)
  writeJson(attestationPath, variant)
  const variantManifest = structuredClone(finalManifest)
  variantManifest.evidence.find(item => item.file === '02-manual-physical-keyboard-attestation.json').sha256 = rawSha256(attestationPath)
  try {
    assertion(variantManifest)
  } finally {
    writeJson(attestationPath, attestation)
  }
}

check('false attestation outcome is rejected', () => {
  withAttestationVariant(variant => {
    variant.outcomes.arrowKeysNavigateCompositeList = false
  }, variantManifest => {
    assert.throws(() => validateUx003FinalApproval(variantManifest, manifestPath), /attestation\.outcomes/)
  })
})

check('pending current review boundary is rejected', () => {
  const variantManifest = structuredClone(finalManifest)
  variantManifest.reviewBoundary = 'Final PASS approved; pending DonHV review'
  assert.throws(() => validateUx003FinalApproval(variantManifest, manifestPath), /manifest\.currentPass/)
})

check('malformed attestation hash is rejected', () => {
  const variantManifest = structuredClone(finalManifest)
  variantManifest.evidence.find(item => item.file === '02-manual-physical-keyboard-attestation.json').sha256 = '0'.repeat(64)
  assert.throws(() => validateUx003FinalApproval(variantManifest, manifestPath), /evidence\.attestation\.sha256/)
})

check('malformed attestation content is rejected', () => {
  fs.writeFileSync(attestationPath, '{', 'utf8')
  try {
    assert.throws(() => validateUx003FinalApproval(finalManifest, manifestPath), /Final approval receipt mismatch: UAT-UX-003: JSON/)
  } finally {
    writeJson(attestationPath, attestation)
  }
})

check('write mode fails before UX003 review normalization', () => {
  const temporaryUxManifestPath = path.join(temporaryEvidenceRoot, 'UAT-UX-003/manifest.json')
  const temporaryAttestationPath = path.join(temporaryEvidenceRoot, 'UAT-UX-003/02-manual-physical-keyboard-attestation.json')
  writeJson(temporaryAttestationPath, attestation)
  const temporaryAttestationHash = rawSha256(temporaryAttestationPath)
  const invalidManifest = buildFinalManifest(temporaryAttestationHash)
  invalidManifest.donhvLatestReview.finalPassApproved = false
  writeJson(temporaryUxManifestPath, invalidManifest)
  const before = fs.readFileSync(temporaryUxManifestPath)
  const result = spawnSync(process.execPath, [temporaryScript], { cwd: temporary, encoding: 'utf8' })
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.deepEqual(fs.readFileSync(temporaryUxManifestPath), before)
})

try {
  fs.rmSync(temporary, { recursive: true, force: true })
} catch (error) {
  failures.push(`temporary fixture cleanup: ${error.message}`)
}

if (failures.length > 0) {
  console.error('IDTS-111 UX003 final-approval regression RED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('IDTS-111 UX003 final-approval regression: PASS')
}
