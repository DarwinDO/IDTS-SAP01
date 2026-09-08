'use strict'

const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const generator = require('./generate-idts110-evidence')
const cards = require('./generate-idts110-mentor-cards')

const BASELINE = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const catalogPath = path.join(root, 'docs/qa/idts-110-unit-test-catalog.json')
const numberMapPath = path.join(root, 'docs/qa/idts-110-case-number-map.json')
const approvalPath = path.join(root, 'docs/pm/evidence/idts-110/catalog-approval.json')
const ledgerPath = path.join(root, 'docs/pm/evidence/idts-110/source-result-ledger.json')
const canonicalUnitRoot = path.join(root, 'docs/pm/evidence/idts-110/unit')
const canonicalCardRoot = path.join(root, 'docs/pm/evidence/idts-110/cards')
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'idts110-evidence-contract-'))
let unitRoot = path.join(temporaryRoot, 'unit')
let cardRoot = path.join(temporaryRoot, 'cards')
const sourcePaths = [
  path.join(root, '.tmp/idts-110/review-round3-fresh.json'),
  path.join(root, '.tmp/idts-110/task5-fix-round1-review.json'),
  path.join(root, '.tmp/idts-110/ui-results.json'),
  path.join(root, '.tmp/idts-110/f224-fix-round1.json'),
  path.join(root, '.tmp/idts-110/review-task7-fix3-results.json'),
  path.join(root, '.tmp/idts-110/review-task8-fix2-results.json')
]

function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sha256 (file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function pngSignature (file) {
  return fs.readFileSync(file).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
}

function treeSha256 (directory) {
  const files = []
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) visit(target)
      else if (entry.isFile()) files.push(target)
    }
  }
  visit(directory)
  return crypto.createHash('sha256').update(files.map(file => `${path.relative(directory, file).replaceAll(path.sep, '/')}:${sha256(file)}`).sort().join('\n') + '\n').digest('hex')
}

function assertNoSecret (value) {
  assert.doesNotMatch(JSON.stringify(value), /(?:password|passwd|pwd|token|api[-_ ]?key|secret)\s*[:=]\s*[^,}\s]+|Bearer\s+[^\s"']+|postgres(?:ql)?:\/\//i)
}

;(async () => {
  const catalog = readJson(catalogPath)
  const numberMap = readJson(numberMapPath)
  const approval = readJson(approvalPath)
  const canonicalBefore = { unit: treeSha256(canonicalUnitRoot), cards: treeSha256(canonicalCardRoot) }

  assert.equal(typeof generator.aggregateAtomicResults, 'function')
  assert.equal(typeof generator.writeAtomicEvidence, 'function')
  assert.equal(typeof generator.validatePackagedAtomicResult, 'function')
  assert.equal(typeof cards.buildCardModels, 'function')
  const ledger = readJson(ledgerPath)
  assert.equal(ledger.schemaVersion, '1.0')
  assert.equal(ledger.sourceBaselineSha, BASELINE)
  assert.equal(ledger.catalogSha, '16603bec649c4e6a09e907b2c7a1fc2b21c393befe7bd5c99b76aea75bb60e30')
  assert.equal(ledger.sourceCatalogSha, '7f9d68d2185e95b166befb928069d6dfbcaffae563667692a1c319755c88e253')
  assert.deepEqual(ledger.approvalReference, approval.approvalReference)
  assert.equal(ledger.entries.length, 6)
  assert.equal(ledger.entries.reduce((sum, entry) => sum + entry.selectedCaseKeys.length, 0), 90)

  const batch = generator.aggregateAtomicResults({
    inputPaths: sourcePaths,
    catalogPath,
    numberMapPath,
    approvalPath
  })

assert.equal(batch.sourceBaselineSha, BASELINE)
assert.deepEqual(batch.approvalReference, approval.approvalReference)
assert.equal(batch.results.length, 90)
assert.equal(new Set(batch.results.map(row => row.caseKey)).size, 90)
assert.deepEqual(
  batch.results.map(row => row.caseKey),
  catalog.cases.slice(188).map(row => row.caseId)
)
for (const row of batch.results) {
  assert.equal(row.assertionId, `${row.caseKey}-A1`)
  assert.notEqual(row.status, 'MAPPING_ONLY')
  assert.equal(row.sourceBaselineSha, BASELINE)
  assert.equal(row.reviewStatus, 'PENDING_DONHV_REVIEW')
  assertNoSecret(row)
}
assert.equal(batch.results.find(row => row.caseKey === 'IDTS110-F224').evidenceKind, 'UI_RUNTIME')
assert.equal(batch.results.find(row => row.caseKey === 'IDTS110-F224').status, 'PASS')

assert.throws(
  () => generator.aggregateAtomicResults({
    inputPaths: [...sourcePaths, path.join(root, '.tmp/idts-110/user-admin-results-fix-round2-final.json')],
    catalogPath,
    numberMapPath,
    approvalPath
  }),
  /duplicate|exactly 90|historical|selected/i
)

  const tamperedSourcePath = sourcePaths[0]
  const originalSourceBytes = fs.readFileSync(tamperedSourcePath)
  try {
    const tampered = readJson(tamperedSourcePath)
    tampered.results[0].actualResult = 'same run ID but tampered source bytes'
    fs.writeFileSync(tamperedSourcePath, `${JSON.stringify(tampered, null, 2)}\n`, 'utf8')
    assert.throws(
      () => generator.aggregateAtomicResults({ inputPaths: sourcePaths, catalogPath, numberMapPath, approvalPath }),
      /sha-256|hash|ledger/i
    )
  } finally {
    fs.writeFileSync(tamperedSourcePath, originalSourceBytes)
  }

  await generator.writeAtomicEvidence({ batch, catalogPath, numberMapPath, approvalPath, evidenceRoot: unitRoot, skipPackagedValidation: true })
  const models = cards.buildCardModels({ catalogPath, numberMapPath, approvalPath, results: batch, evidenceRoot: unitRoot })
assert.equal(models.length, 278)
for (const model of models) {
  assert.match(model.visibleText, /^Case \d+\n/)
  assert.doesNotMatch(model.visibleText, /IDTS110-|UT-[A-Z]+-/)
  assert.doesNotMatch(model.visibleText, /undefined/i)
  assertNoSecret({ visibleText: model.visibleText })
  assert.doesNotMatch(model.visibleText, /MAPPING_ONLY.*PASS|PASS.*MAPPING_ONLY/i)
}
assert.equal(models.filter(model => model.mentorNumber <= 188 && model.status.startsWith('Candidate PASS')).length, 40)
assert.equal(models.filter(model => model.mentorNumber <= 188 && model.status.startsWith('Mapping Only')).length, 135)
assert.equal(models.filter(model => model.mentorNumber <= 188 && model.status.startsWith('Blocked')).length, 13)

const newKeys = new Set(batch.results.map(row => row.caseKey))
assert.deepEqual(
  fs.readdirSync(unitRoot).filter(name => fs.statSync(path.join(unitRoot, name)).isDirectory()).sort(),
  [...newKeys].sort()
)
  for (const row of batch.results) {
  const dir = path.join(unitRoot, row.caseKey)
  const resultPath = path.join(dir, 'result.json')
  const manifestPath = path.join(dir, 'case-manifest.json')
  assert.ok(fs.existsSync(resultPath), `${row.caseKey} result.json`)
  assert.ok(fs.existsSync(manifestPath), `${row.caseKey} case-manifest.json`)
  const result = readJson(resultPath)
  const manifest = readJson(manifestPath)
  assert.equal(manifest.caseKey, row.caseKey)
  assert.equal(manifest.resultSha256, sha256(resultPath))
  assertNoSecret(manifest)
  for (const file of manifest.evidenceFiles) {
    const artifact = path.join(dir, file)
    assert.ok(fs.existsSync(artifact), `${row.caseKey}/${file}`)
    assert.ok(pngSignature(artifact), `${row.caseKey}/${file} PNG signature`)
    assert.equal(manifest.artifactHashes[file], sha256(artifact), `${row.caseKey}/${file} hash`)
  }
  assert.deepEqual(
    fs.readdirSync(dir).filter(file => file.endsWith('.png')).sort(),
    [...manifest.evidenceFiles].sort(),
    `${row.caseKey} has no orphan PNGs`
  )
  if (row.evidenceKind === 'UI_RUNTIME') {
    assert.ok(manifest.evidenceFiles.includes('runtime.png'))
    assert.equal(result.runtimeEvidence.screenshotPath, `unit/${row.caseKey}/runtime.png`)
    assert.equal(result.runtimeEvidence.manifestPath, `unit/${row.caseKey}/case-manifest.json`)
  } else {
    assert.ok(manifest.evidenceFiles.includes('result.png'))
  }
  }

  const packagedUiRow = batch.results.find(row => row.evidenceKind === 'UI_RUNTIME')
  const packagedUiResult = readJson(path.join(unitRoot, packagedUiRow.caseKey, 'result.json'))
  assert.throws(
    () => generator.validatePackagedAtomicResult({
      ...packagedUiResult,
      runtimeEvidence: { ...packagedUiResult.runtimeEvidence, screenshotPath: '../runtime.png' }
    }, { evidenceRoot: path.join(unitRoot, packagedUiRow.caseKey), allowTemporaryEvidenceRoot: true, temporaryEvidenceRoot: unitRoot }),
    /packaged|visual|path|evidence|traversal/i,
    'temporary packaged validator must reject UI traversal'
  )

  await cards.writeCards({ models, outputRoot: cardRoot })
  const cardFiles = fs.readdirSync(cardRoot).filter(name => /^Case-\d{3}\.png$/.test(name))
assert.equal(cardFiles.length, 278)
for (const file of cardFiles) {
  assert.ok(pngSignature(path.join(cardRoot, file)), `${file} PNG signature`)
  assert.ok(fs.statSync(path.join(cardRoot, file)).size > 100, `${file} is not empty`)
  }

  assert.deepEqual({ unit: treeSha256(canonicalUnitRoot), cards: treeSha256(canonicalCardRoot) }, canonicalBefore, 'temporary generation must not mutate canonical evidence')

  console.log('IDTS-110 evidence contract PASS: 90 selected atomic results, 90 case packages, 278 number-only cards, and valid PNG hashes.')
})().then(() => fs.rmSync(temporaryRoot, { recursive: true, force: true })).catch(error => {
  fs.rmSync(temporaryRoot, { recursive: true, force: true })
  console.error(error.stack || error)
  process.exitCode = 1
})
