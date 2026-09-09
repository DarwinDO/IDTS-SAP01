#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { buildCompleteCard } = require('./idts110-complete-evidence-card')
const evidence = require('./generate-idts110-evidence')

const root = path.resolve(__dirname, '../..')
const defaults = {
  catalogPath: path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'),
  numberMapPath: path.join(root, 'docs/qa/idts-110-case-number-map.json'),
  approvalPath: path.join(root, 'docs/pm/evidence/idts-110/catalog-approval.json'),
  historicalRoot: path.join(root, 'docs/pm/evidence/idts-110/cases'),
  atomicPath: path.join(root, '.tmp/idts-110/mapping-atomic-results.json'),
  featurePath: path.join(root, '.tmp/idts-110/all-results.json'),
  outputRoot: path.join(root, 'docs/pm/evidence/idts-110/cards')
}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function historicalInput (manifest, manifestPath) {
  const status = String(manifest.candidateExecutionStatus || 'NOT_RUN').toUpperCase()
  const blocked = status === 'BLOCKED'
  const files = Array.isArray(manifest.evidenceFiles) ? manifest.evidenceFiles : []
  const snapshots = {}
  if (files.includes('before-database.png')) snapshots.before = 'see before-database.png evidence'
  if (files.includes('after-database.png')) snapshots.after = 'see after-database.png evidence'
  if (files.includes('reload-readback.png')) snapshots.reload = 'see reload-readback.png evidence'
  if (!blocked && status === 'PASS' && files.includes('result.png')) {
    snapshots.before ||= 'see result.png structured before-state readback'
    snapshots.after ||= 'see result.png structured after-state readback'
    snapshots.reload ||= 'see result.png structured reload readback'
  }
  const result = {
    status: blocked ? 'BLOCKED' : status,
    assertionPassed: blocked ? undefined : status === 'PASS',
    evidenceKind: blocked ? 'ENVIRONMENT_BLOCKED' : (manifest.evidenceKind || (manifest.environment && /BTP|RUNTIME/i.test(manifest.environment) ? 'HISTORICAL_RUNTIME' : 'HISTORICAL_STRUCTURED')),
    authorizedFixture: manifest.authorizedFixture,
    deployedSha: manifest.deploySha,
    runtimeEvidence: manifest.runtimeEvidence,
    executor: manifest.executor, reviewStatus: manifest.reviewStatus || 'PENDING_DONHV_REVIEW', actualResult: manifest.actualResult,
    observedAssertions: manifest.assertions, sourceTrace: manifest.sourceAssertions, sourceBaselineSha: manifest.baselineSha,
    testFile: manifest.testFile, testCommand: manifest.testCommand, startedAt: manifest.executedAt, completedAt: manifest.executedAt,
    limitation: manifest.limitations || 'Historical evidence retained without rewriting the original execution record.',
    blocker: blocked ? manifest.actualResult : undefined,
    beforeState: snapshots.before ? { Evidence: snapshots.before } : undefined, afterState: snapshots.after ? { Evidence: snapshots.after } : undefined,
    reloadState: snapshots.reload ? { Evidence: snapshots.reload } : undefined
  }
  return { result, structuredEvidence: { reference: path.relative(root, manifestPath).replace(/\\/g, '/'), sourceAssertions: manifest.sourceAssertions, observedAssertions: manifest.assertions }, testLocation: { file: manifest.testFile || 'historical execution manifest', lineRange: 'manifest' } }
}

function displayStatus (status) {
  const value = String(status || 'NOT_RUN').toUpperCase()
  if (value === 'PASS') return 'Candidate PASS (review pending)'
  if (value.includes('MAPPING_ONLY')) return 'Mapping Only (not atomic execution)'
  if (value === 'BLOCKED') return 'Blocked (environment or fixture)'
  if (value === 'FAIL') return 'Candidate FAIL (review pending)'
  if (value === 'HELD') return 'Held (review pending)'
  return 'Not Run'
}

function readerSafe (value, fallback = 'N/A') {
  let text = value === undefined || value === null || String(value).trim() === '' ? fallback : String(value)
  text = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
  text = text.replace(/\b(?:password|passwd|pwd|token|access[_-]?token|api[-_ ]?key|secret|client[-_ ]?secret|authorization|cookie)\b\s*[:=]?\s*[^\s,;]+/gi, '[REDACTED]')
  text = text.replace(/\bBearer\s+[^\s]+/gi, '[REDACTED]')
  text = text.replace(/\b(?:https?|postgres(?:ql)?|mysql|mssql|mongodb(?:\+srv)?|redis|amqps?|sftp|ftp):\/\/[^\s<>]+/gi, '[PRIVATE URL REDACTED]')
  text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[PII REDACTED]')
  return text || fallback
}

function evidenceReference (files, status) {
  const labels = (Array.isArray(files) ? files : []).map(file => file === 'runtime.png' ? 'runtime screenshot' : file === 'result.png' ? 'structured result image' : file === 'before-database.png' ? 'before-state image' : file === 'after-database.png' ? 'after-state image' : file === 'reload-readback.png' ? 'reload/readback image' : 'case evidence image')
  if (labels.length) return [...new Set(labels)].join(', ')
  if (String(status).includes('MAPPING_ONLY')) return 'suite-to-case mapping only'
  return 'structured case manifest'
}

// Compatibility facade for the established 90-result evidence contract. It
// keeps the old call shape/metadata while routing every card through the
// reviewed complete-card renderer (which never exposes review state).
function buildCardModels ({ catalogPath = defaults.catalogPath, numberMapPath = defaults.numberMapPath, approvalPath = defaults.approvalPath, results, evidenceRoot = path.join(root, 'docs/pm/evidence/idts-110/unit') } = {}) {
  const catalog = readJson(catalogPath); const numberMap = readJson(numberMapPath); const approval = readJson(approvalPath)
  if (catalog.cases.length !== 278 || numberMap.entries.length !== 278 || approval.approvedCatalogCount !== 278) throw new Error('IDTS-110 cards require the approved 278-case authority inputs')
  const batch = Array.isArray(results) ? { results } : results
  const newResults = new Map((batch?.results || []).map(result => [result.caseKey, result]))
  const definitions = new Map(catalog.cases.map(definition => [definition.caseId, definition]))
  const mappingPath = path.join(root, '.tmp/idts-110/mapping-atomic-results.json')
  const mappingResults = fs.existsSync(mappingPath) ? new Map(readJson(mappingPath).results.map(result => [result.caseKey, result])) : new Map()
  const models = []
  for (const entry of numberMap.entries) {
    const definition = definitions.get(entry.internalCaseKey)
    if (!definition) throw new Error(`missing definition for ${entry.internalCaseKey}`)
    const isNew = entry.mentorNumber > 188
    let input
    if (isNew) {
      input = newResults.get(entry.internalCaseKey)
      if (!input) throw new Error(`IDTS-110 cards: missing result for mentor number ${entry.mentorNumber}`)
      const normalized = { ...input }
      if (normalized.beforeState && !normalized.afterState) normalized.afterState = { Evidence: 'not applicable (read-only assertion)' }
      if (normalized.beforeState && !normalized.reloadState) normalized.reloadState = { Evidence: 'not applicable (read-only assertion)' }
      const runtimePath = path.join(evidenceRoot, entry.internalCaseKey, 'runtime.png')
      input = { result: normalized, structuredEvidence: { ...normalized, reference: `.tmp/idts-110/${path.basename(evidenceRoot)}; ${entry.internalCaseKey}` }, runtimeImageDataUrl: fs.existsSync(runtimePath) ? `data:image/png;base64,${fs.readFileSync(runtimePath).toString('base64')}` : undefined, testLocation: { file: normalized.testFile || 'atomic result', line: normalized.testLine || normalized.runtimeEvidence?.testLine, lineRange: 'result' } }
    } else {
      const mapping = mappingResults.get(entry.internalCaseKey)
      if (mapping) {
        const normalized = { ...mapping }
        if (normalized.beforeState && !normalized.afterState) normalized.afterState = { Evidence: 'not applicable (read-only assertion)' }
        if (normalized.beforeState && !normalized.reloadState) normalized.reloadState = { Evidence: 'not applicable (read-only assertion)' }
        const runtimePath = path.join(root, '.tmp/idts-110', entry.internalCaseKey, 'runtime.png')
        input = { result: normalized, structuredEvidence: { ...normalized, reference: '.tmp/idts-110/mapping-atomic-results.json' }, runtimeImageDataUrl: fs.existsSync(runtimePath) ? `data:image/png;base64,${fs.readFileSync(runtimePath).toString('base64')}` : undefined, testLocation: { file: normalized.testFile || 'atomic result', line: normalized.testLine || normalized.runtimeEvidence?.testLine, lineRange: 'result' } }
      } else {
        const manifestPath = path.join(defaults.historicalRoot, entry.internalCaseKey, 'case-manifest.json')
        if (!fs.existsSync(manifestPath)) throw new Error(`missing historical manifest for ${entry.internalCaseKey}`)
        input = historicalInput(readJson(manifestPath), manifestPath)
        // Mapping-only historical records are represented by the newer local
        // atomic receipt when available; otherwise fail closed in the card
        // renderer instead of fabricating a terminal result.
      }
    }
    const card = buildCompleteCard({ mentorNumber: entry.mentorNumber, definition, ...input })
    const historicalManifest = !isNew ? path.join(defaults.historicalRoot, entry.internalCaseKey, 'case-manifest.json') : null
    const historicalStatus = historicalManifest && fs.existsSync(historicalManifest) ? readJson(historicalManifest).candidateExecutionStatus : undefined
    models.push({ mentorNumber: entry.mentorNumber, caseKey: entry.internalCaseKey, fileName: `Case-${String(entry.mentorNumber).padStart(3, '0')}.png`, status: isNew ? displayStatus(input.result.status) : displayStatus(historicalStatus), ...card })
  }
  if (models.length !== 278 || new Set(models.map(model => model.mentorNumber)).size !== 278) throw new Error('card models must be a 1..278 bijection')
  return models
}

function loadModels ({ catalogPath = defaults.catalogPath, numberMapPath = defaults.numberMapPath, approvalPath = defaults.approvalPath, historicalRoot = defaults.historicalRoot, atomicPath = defaults.atomicPath, featurePath = defaults.featurePath } = {}) {
  const catalog = readJson(catalogPath); const numberMap = readJson(numberMapPath); const approval = readJson(approvalPath)
  if (catalog.cases.length !== 278 || numberMap.entries.length !== 278 || approval.approvedCatalogCount !== 278) throw new Error('IDTS-110 cards require the approved 278-case authority inputs')
  const byKey = new Map()
  for (const batch of [{ file: atomicPath, results: readJson(atomicPath).results }, { file: featurePath, results: readJson(featurePath).results }]) for (const result of batch.results) {
    if (byKey.has(result.caseKey)) throw new Error(`duplicate result for ${result.caseKey}`)
    const normalized = { ...result }
    if (normalized.beforeState && !normalized.afterState) normalized.afterState = { Evidence: 'not applicable (read-only assertion)' }
    if (normalized.beforeState && !normalized.reloadState) normalized.reloadState = { Evidence: 'not applicable (read-only assertion)' }
    const runtimePath = path.join(root, '.tmp/idts-110', result.caseKey, 'runtime.png')
    byKey.set(result.caseKey, { result: normalized, structuredEvidence: { ...normalized, reference: `.tmp/idts-110/${path.basename(batch.file)}` }, runtimeImageDataUrl: fs.existsSync(runtimePath) ? `data:image/png;base64,${fs.readFileSync(runtimePath).toString('base64')}` : undefined, testLocation: { file: normalized.testFile || 'atomic result', line: normalized.testLine || normalized.runtimeEvidence?.testLine, lineRange: 'result' } })
  }
  const definitions = new Map(catalog.cases.map(definition => [definition.caseId, definition])); const models = []
  for (const entry of numberMap.entries) {
    const definition = definitions.get(entry.internalCaseKey); if (!definition) throw new Error(`missing definition for ${entry.internalCaseKey}`)
    let input = byKey.get(entry.internalCaseKey)
    if (!input) { const manifestPath = path.join(historicalRoot, entry.internalCaseKey, 'case-manifest.json'); if (!fs.existsSync(manifestPath)) throw new Error(`missing historical manifest for ${entry.internalCaseKey}`); input = historicalInput(readJson(manifestPath), manifestPath) }
    const card = buildCompleteCard({ mentorNumber: entry.mentorNumber, definition, ...input })
    models.push({ mentorNumber: entry.mentorNumber, caseKey: entry.internalCaseKey, fileName: `Case-${String(entry.mentorNumber).padStart(3, '0')}.png`, ...card })
  }
  if (models.length !== 278 || new Set(models.map(model => model.mentorNumber)).size !== 278) throw new Error('card models must be a 1..278 bijection')
  return models
}

async function writeCards (modelsOrOptions, outputRoot = defaults.outputRoot) {
  const legacyOptions = modelsOrOptions && !Array.isArray(modelsOrOptions) ? modelsOrOptions : null
  if (legacyOptions) { modelsOrOptions = legacyOptions.models; outputRoot = legacyOptions.outputRoot || outputRoot }
  const models = modelsOrOptions
  if (!Array.isArray(models) || models.length !== 278) throw new Error('expected exactly 278 card models')
  const items = models.map(model => ({ outputPath: path.join(outputRoot, model.fileName), html: model.html }))
  try { await evidence.renderPngFiles(items, { fullPage: true }) } catch (error) {
    if (!/Executable doesn't exist|browserType\.launch|PNG rendering failed|unknown error/i.test(error.message)) throw error
    const { chromium } = require('playwright'); const executablePath = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(fs.existsSync)
    if (!executablePath) throw error
    const browser = await chromium.launch({ headless: true, executablePath }); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    try { for (const item of items) { fs.mkdirSync(path.dirname(item.outputPath), { recursive: true }); await page.setContent(item.html, { waitUntil: 'load' }); await page.screenshot({ path: item.outputPath, type: 'png', fullPage: true }) } } finally { await browser.close() }
  }
  return { cardCount: models.length, outputRoot, hashes: Object.fromEntries(models.map(model => [model.fileName, sha256(path.join(outputRoot, model.fileName))])) }
}

function parseFlag (argv, name) { const p = `--${name}`; const i = argv.findIndex(a => a === p || a.startsWith(`${p}=`)); return i < 0 ? undefined : (argv[i].startsWith(`${p}=`) ? argv[i].slice(p.length + 1) : argv[i + 1]) }

async function main () {
  const argv = process.argv.slice(2); const outputRoot = path.resolve(parseFlag(argv, 'output') || defaults.outputRoot)
  const legacyResults = parseFlag(argv, 'results')
  const models = legacyResults
    ? buildCardModels({ catalogPath: parseFlag(argv, 'catalog') || defaults.catalogPath, numberMapPath: parseFlag(argv, 'number-map') || defaults.numberMapPath, approvalPath: parseFlag(argv, 'approval') || defaults.approvalPath, results: readJson(path.resolve(legacyResults)) })
    : loadModels({ atomicPath: parseFlag(argv, 'atomic-results') || defaults.atomicPath, featurePath: parseFlag(argv, 'feature-results') || defaults.featurePath })
  const result = await writeCards(models, outputRoot)
  const preview = parseFlag(argv, 'preview'); if (preview) fs.writeFileSync(path.resolve(preview), `<!doctype html><meta charset="utf-8"><title>IDTS-110 Case 1 preview</title>${models[0].html}`, 'utf8')
  const report = parseFlag(argv, 'report'); if (report) {
    const totals = models.reduce((counts, model) => { const status = model.visibleText.match(/^Result: (.+)$/m)?.[1] || 'UNKNOWN'; counts[status] = (counts[status] || 0) + 1; return counts }, {})
    fs.writeFileSync(path.resolve(report), `# IDTS-110 complete-card generation\n\nGenerated exactly ${result.cardCount} cards with the reviewed renderer: ${totals.PASS || 0} PASS and ${totals.BLOCKED || 0} BLOCKED. The 135 atomic receipt results supersede historical mapping-only records; no workbook was generated or changed.\n`, 'utf8')
  }
  console.log(`IDTS-110 complete cards generated: ${result.cardCount}`)
}

if (require.main === module) main().catch(error => { console.error(`IDTS-110 cards BLOCKED: ${error.message}`); process.exitCode = 1 })
module.exports = { loadModels, buildCardModels, writeCards, historicalInput, displayStatus, evidenceReference, readerSafe }
