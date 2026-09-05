#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const evidence = require('./generate-idts110-evidence')

const root = path.resolve(__dirname, '../..')
const catalogPath = path.join(root, 'docs/qa/idts-110-unit-test-catalog.json')
const numberMapPath = path.join(root, 'docs/qa/idts-110-case-number-map.json')
const approvalPath = path.join(root, 'docs/pm/evidence/idts-110/catalog-approval.json')
const historicalRoot = path.join(root, 'docs/pm/evidence/idts-110/cases')
const defaultOutputRoot = path.join(root, 'docs/pm/evidence/idts-110/cards')

function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
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

function sourceTestFile (manifest) {
  if (typeof manifest.testFile === 'string' && manifest.testFile.trim()) return manifest.testFile.trim()
  const command = typeof manifest.testCommand === 'string' ? manifest.testCommand : ''
  const match = command.match(/(?:^|\s)(scripts\/qa\/[^\s]+\.m?js)(?:\s|$)/)
  if (match) return match[1]
  if (/btp:demo:check/i.test(command)) return 'scripts/qa/btp-demo-readiness-check'
  return 'historical execution runner'
}

function evidenceReference (files, status) {
  const labels = (Array.isArray(files) ? files : []).map(file => {
    if (file === 'runtime.png') return 'runtime screenshot'
    if (file === 'result.png') return 'structured result image'
    if (file === 'before-database.png') return 'before-state image'
    if (file === 'after-database.png') return 'after-state image'
    if (file === 'reload-readback.png') return 'reload/readback image'
    return 'case evidence image'
  })
  if (labels.length) return [...new Set(labels)].join(', ')
  if (String(status).includes('MAPPING_ONLY')) return 'suite-to-case mapping only'
  return 'structured case manifest'
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

function evidenceKindForHistorical (manifest) {
  if (String(manifest.candidateExecutionStatus || '').includes('MAPPING_ONLY')) return 'MAPPING_ONLY'
  if (manifest.evidenceFiles?.includes('runtime-generated-control.png') || /BTP|UAT|runtime/i.test(String(manifest.environment || ''))) return 'HISTORICAL_RUNTIME'
  if (manifest.candidateExecutionStatus === 'BLOCKED') return 'ENVIRONMENT_BLOCKED'
  return 'HISTORICAL_STRUCTURED'
}

function buildVisibleText (model) {
  return [
    `Case ${model.mentorNumber}`,
    readerSafe(model.title),
    `Status: ${readerSafe(model.status)}`,
    `Evidence kind: ${readerSafe(model.evidenceKind)}`,
    `Test file: ${readerSafe(model.testFile)}`,
    `Source baseline: ${readerSafe(model.sourceBaseline)}`,
    `Deploy baseline: ${readerSafe(model.deployBaseline)}`,
    `Execution window: ${readerSafe(model.executionWindow)}`,
    `Evidence refs: ${readerSafe(model.evidenceRefs)}`,
    `Review status: ${readerSafe(model.reviewStatus)}`,
    `Limitation: ${readerSafe(model.limitation)}`
  ].join('\n')
}

function cardHtml (visibleText, status) {
  const lines = visibleText.split('\n')
  const accent = /Blocked|Mapping Only|Held/i.test(status) ? '#f0a000' : /FAIL/i.test(status) ? '#ff8792' : '#35d399'
  return evidence.renderHtml(lines, accent)
}

function buildCardModels ({ catalogPath: sourceCatalogPath = catalogPath, numberMapPath: sourceNumberMapPath = numberMapPath, approvalPath: sourceApprovalPath = approvalPath, results, evidenceRoot = path.join(root, 'docs/pm/evidence/idts-110/unit') }) {
  const authority = evidence.loadAuthority({ catalogPath: sourceCatalogPath, numberMapPath: sourceNumberMapPath, approvalPath: sourceApprovalPath })
  const batch = Array.isArray(results) ? { results } : results
  const newResults = new Map((batch?.results || []).map(result => [result.caseKey, result]))
  const newDefinitions = new Set(authority.catalog.cases.slice(188).map(row => row.caseId))
  if (newResults.size !== 90 || [...newResults.keys()].some(key => !newDefinitions.has(key))) throw new Error('IDTS-110 cards: exactly 90 new atomic results are required')
  const definitions = new Map(authority.catalog.cases.map(row => [row.caseId, row]))
  const models = []
  for (const entry of authority.numberMap.entries) {
    const definition = definitions.get(entry.internalCaseKey)
    if (!definition) throw new Error(`IDTS-110 cards: missing definition for mentor number ${entry.mentorNumber}`)
    const isNew = entry.mentorNumber > 188
    let model
    if (isNew) {
      const result = newResults.get(entry.internalCaseKey)
      if (!result) throw new Error(`IDTS-110 cards: missing result for mentor number ${entry.mentorNumber}`)
      const packageManifestPath = path.join(evidenceRoot, entry.internalCaseKey, 'case-manifest.json')
      const packageManifest = fs.existsSync(packageManifestPath) ? readJson(packageManifestPath) : null
      const evidenceFiles = packageManifest?.evidenceFiles || (result.evidenceKind === 'UI_RUNTIME' ? ['runtime.png'] : ['result.png'])
      model = {
        mentorNumber: entry.mentorNumber,
        title: result.title,
        status: displayStatus(result.status),
        evidenceKind: result.evidenceKind,
        testFile: result.testFile,
        sourceBaseline: result.sourceBaselineSha,
        deployBaseline: result.deployedSha || 'N/A',
        executionWindow: `${result.startedAt} to ${result.completedAt}`,
        evidenceRefs: evidenceReference(evidenceFiles, result.status),
        reviewStatus: result.reviewStatus,
        limitation: result.limitation
      }
    } else {
      const manifestPath = path.join(historicalRoot, entry.internalCaseKey, 'case-manifest.json')
      if (!fs.existsSync(manifestPath)) throw new Error(`IDTS-110 cards: missing historical manifest for ${entry.internalCaseKey}`)
      const manifest = readJson(manifestPath)
      const historicalStatus = manifest.candidateExecutionStatus
      model = {
        mentorNumber: entry.mentorNumber,
        title: definition.title,
        status: displayStatus(historicalStatus),
        evidenceKind: evidenceKindForHistorical(manifest),
        testFile: sourceTestFile(manifest),
        sourceBaseline: manifest.baselineSha || 'N/A',
        deployBaseline: manifest.deploySha || 'N/A',
        executionWindow: manifest.executedAt || 'Historical execution timestamp not recorded',
        evidenceRefs: evidenceReference(manifest.evidenceFiles, historicalStatus),
        reviewStatus: manifest.reviewStatus || 'PENDING_DONHV_REVIEW',
        limitation: String(manifest.limitations || 'Historical evidence retained without rewriting the original execution record.')
          .replace(/\bcandidate PASS\b/gi, 'accepted result')
      }
    }
    model.fileName = `Case-${String(model.mentorNumber).padStart(3, '0')}.png`
    model.visibleText = buildVisibleText(model)
    model.html = cardHtml(model.visibleText, model.status)
    models.push(model)
  }
  return models
}

async function writeCards ({ models, outputRoot = defaultOutputRoot }) {
  if (!Array.isArray(models) || models.length !== 278) throw new Error('IDTS-110 cards: expected 278 card models')
  fs.mkdirSync(outputRoot, { recursive: true })
  const items = models.map(model => ({ outputPath: path.join(outputRoot, model.fileName), html: model.html }))
  await evidence.renderPngFiles(items)
  return { cardCount: items.length, outputRoot }
}

function parseFlag (argv, name) {
  const prefix = `--${name}`
  const index = argv.findIndex(argument => argument === prefix || argument.startsWith(`${prefix}=`))
  if (index < 0) return undefined
  return argv[index].startsWith(`${prefix}=`) ? argv[index].slice(prefix.length + 1) : argv[index + 1]
}

async function main () {
  const resultsPath = parseFlag(process.argv.slice(2), 'results')
  const outputPath = parseFlag(process.argv.slice(2), 'output') || defaultOutputRoot
  if (!resultsPath) throw new Error('Usage: node scripts/qa/generate-idts110-mentor-cards.js --results=<batch.json> --output=<cards-directory>')
  const batch = readJson(path.resolve(resultsPath))
  const models = buildCardModels({ results: batch })
  await writeCards({ models, outputRoot: path.resolve(outputPath) })
  console.log(`IDTS-110 mentor cards generated: ${models.length} number-only PNG cards.`)
}

if (require.main === module) main().catch(error => { console.error(`IDTS-110 mentor cards BLOCKED: ${error.message}`); process.exitCode = 1 })

module.exports = { buildCardModels, writeCards, displayStatus, evidenceReference, readerSafe }
