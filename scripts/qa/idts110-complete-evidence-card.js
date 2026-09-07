#!/usr/bin/env node

'use strict'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const NOT_AVAILABLE = 'N/A'
const MENTOR_EXECUTOR_LABEL = 'NhanT (DonHV support)'

function isObject (value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasValue (value) {
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')
}

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function redactSecrets (value) {
  return String(value)
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi, '[REDACTED PRIVATE KEY]')
    .replace(/\b(?:password|passwd|pwd|passphrase|token|access[_-]?token|api[-_ ]?key|secret|client[-_ ]?secret|authorization|cookie|private[_ -]?key)\b["']?\s*[:=]\s*(?:["'][\s\S]*?["']|Bearer\s+[^\s,;"']+|[^\s,;"']+)/gi, '[REDACTED]')
    .replace(/\bBearer\s+[^\s,;"']+/gi, '[REDACTED]')
    .replace(/\b(?:xkeysib-[A-Za-z0-9_-]{12,}|(?:AKIA|ASIA)[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{12,})\b/g, '[REDACTED]')
    .replace(/\b(?:https?|postgres(?:ql)?|mysql|mssql|mongodb(?:\+srv)?|redis|amqps?|sftp|ftp):\/\/[^\s<>"']+/gi, '[PRIVATE URL REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[PII REDACTED]')
}

function omitInternalCaseIds (value) {
  return String(value)
    .replace(/\bIDTS110-(?:UT-)?(?=[A-Z0-9-]*\d)[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi, '[repository-only case key omitted]')
    .replace(/\bUT-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi, '[repository-only case key omitted]')
}

function asText (value, fallback = NOT_AVAILABLE, { source = false } = {}) {
  if (!hasValue(value)) return fallback
  let text
  if (typeof value === 'string') text = value
  else if (typeof value === 'number' || typeof value === 'boolean') text = String(value)
  else {
    try { text = JSON.stringify(value) } catch { text = String(value) }
  }
  text = redactSecrets(text).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
  text = omitInternalCaseIds(text)
  return text || fallback
}

function asHtml (value, fallback = NOT_AVAILABLE, options) {
  return escapeHtml(asText(value, fallback, options))
}

function firstValue (...values) {
  return values.find(hasValue)
}

function arrayValues (value) {
  if (!hasValue(value)) return []
  if (Array.isArray(value)) return value.flatMap(item => arrayValues(item))
  if (isObject(value)) return Object.entries(value).map(([key, item]) => `${key}: ${formatValue(item)}`)
  return [String(value)]
}

function formatValue (value) {
  if (!hasValue(value)) return NOT_AVAILABLE
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try { return JSON.stringify(value) } catch { return String(value) }
}

function sourceFunctionEntries (definition, result, structuredEvidence) {
  const entries = []
  const add = value => {
    if (!hasValue(value)) return
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (isObject(item)) {
        const file = firstValue(item.file, item.path, item.sourceFile)
        const symbol = firstValue(item.symbol, item.function, item.name, item.sourceFunction)
        if (file || symbol) entries.push(`${asText(file, NOT_AVAILABLE, { source: true })}#${asText(symbol, NOT_AVAILABLE, { source: true })}`)
      } else entries.push(asText(item, NOT_AVAILABLE, { source: true }))
    }
  }
  for (const value of [result.sourceTrace, result.sourceFunctions, result.sourceAssertions]) add(value)
  for (const value of [definition.sourceTrace, definition.sourceFunctions, definition.sourceAssertions]) add(value)
  for (const value of [structuredEvidence.sourceTrace, structuredEvidence.sourceFunctions, structuredEvidence.sourceFunctionsUsed, structuredEvidence.sourceAssertions]) add(value)
  return [...new Set(entries.filter(entry => entry !== NOT_AVAILABLE && entry !== `${NOT_AVAILABLE}#${NOT_AVAILABLE}`))]
}

function observedAssertions (definition, result, structuredEvidence) {
  const values = []
  const add = value => {
    for (const item of arrayValues(value)) {
      const text = asText(item)
      if (text !== NOT_AVAILABLE && text) values.push(text)
    }
  }
  for (const source of [definition, result, structuredEvidence]) {
    const explicit = [source.observedAssertions, source.actualAssertions, source.observed, source.actual]
      .filter(hasValue)
    add(source.observedAssertions)
    add(source.actualAssertions)
    add(source.observed)
    add(source.actual)
    if (!explicit.length) add(source.actualResult)
    if (Array.isArray(source.assertions)) {
      for (const assertion of source.assertions) {
        if (isObject(assertion)) add(firstValue(assertion.observed, assertion.actual, assertion.observedResult, assertion.actualResult))
        else add(assertion)
      }
    }
  }
  return [...new Set(values)]
}

function addSnapshotCell (rows, entity, phase, value) {
  if (!hasValue(entity) || !['before', 'after', 'reload'].includes(phase) || !hasValue(value)) return
  const key = String(entity)
  const row = rows.get(key) || { entity: key, before: undefined, after: undefined, reload: undefined }
  row[phase] = value
  rows.set(key, row)
}

function addState (rows, phase, state) {
  if (!hasValue(state)) return
  if (Array.isArray(state)) {
    for (const item of state) {
      if (!isObject(item)) {
        addSnapshotCell(rows, 'Readback', phase, item)
        continue
      }
      const entity = firstValue(item.entity, item.name, item.table, item.key, item.label, item.metric)
      if (entity) {
        const value = firstValue(item[phase], item.value, item.count, item.rows, item.readback)
        addSnapshotCell(rows, entity, phase, value)
      } else {
        for (const [key, value] of Object.entries(item)) addSnapshotCell(rows, key, phase, value)
      }
    }
    return
  }
  if (!isObject(state)) {
    addSnapshotCell(rows, 'Readback', phase, state)
    return
  }
  for (const [key, value] of Object.entries(state)) {
    if (key === 'before' || key === 'after' || key === 'reload') continue
    addSnapshotCell(rows, key, phase, value)
  }
}

function addSnapshotContainer (rows, value) {
  if (!hasValue(value)) return
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isObject(item)) continue
      const entity = firstValue(item.entity, item.name, item.table, item.key, item.label, item.metric)
      if (!entity) continue
      for (const phase of ['before', 'after', 'reload']) addSnapshotCell(rows, entity, phase, item[phase])
    }
    return
  }
  if (!isObject(value)) return
  for (const [entity, item] of Object.entries(value)) {
    if (!isObject(item) || !(['before', 'after', 'reload'].some(phase => Object.hasOwn(item, phase)))) {
      addSnapshotCell(rows, entity, 'before', item)
      continue
    }
    for (const phase of ['before', 'after', 'reload']) addSnapshotCell(rows, entity, phase, item[phase])
  }
}

function snapshotRows (result, structuredEvidence) {
  const rows = new Map()
  for (const state of [result.beforeState, result.beforeSnapshot, result.beforeDatabase, result.before, structuredEvidence.beforeState, structuredEvidence.beforeSnapshot, structuredEvidence.beforeDatabase, structuredEvidence.before]) addState(rows, 'before', state)
  for (const state of [result.afterState, result.afterSnapshot, result.afterDatabase, result.after, structuredEvidence.afterState, structuredEvidence.afterSnapshot, structuredEvidence.afterDatabase, structuredEvidence.after]) addState(rows, 'after', state)
  for (const state of [result.reloadState, result.reloadSnapshot, result.reloadReadback, result.reload, structuredEvidence.reloadState, structuredEvidence.reloadSnapshot, structuredEvidence.reloadReadback, structuredEvidence.reload, structuredEvidence.readbackState, structuredEvidence.readback]) addState(rows, 'reload', state)
  for (const snapshots of [result.snapshots, structuredEvidence.snapshots, result.persistence, structuredEvidence.persistence, structuredEvidence.readback]) addSnapshotContainer(rows, snapshots)
  if (!rows.size) rows.set('Readback', { entity: 'Readback', before: undefined, after: undefined, reload: undefined })
  return [...rows.values()].map(row => ({
    entity: asText(row.entity),
    before: asText(row.before),
    after: asText(row.after),
    reload: asText(row.reload)
  }))
}

function formatFileLine (testLocation, result, definition) {
  const location = typeof testLocation === 'string' ? { file: testLocation } : (isObject(testLocation) ? testLocation : {})
  const file = firstValue(location.file, location.path, result.testFile, definition.plannedTestFile, definition.testFile)
  const start = firstValue(location.startLine, location.lineStart, location.line, result.testLine, result.line)
  const end = firstValue(location.endLine, location.lineEnd, start)
  const lineRange = firstValue(location.lineRange, result.lineRange)
  const fileText = asText(file, NOT_AVAILABLE, { source: true })
  if (lineRange && fileText !== NOT_AVAILABLE) return `${fileText}:${asText(lineRange, NOT_AVAILABLE)}`
  if (!hasValue(start)) return fileText
  const range = hasValue(end) && String(end) !== String(start) ? `${start}–${end}` : String(start)
  return `${fileText}:${range}`
}

function readerCommand (testLocation, result, structuredEvidence) {
  const location = typeof testLocation === 'string' ? { command: testLocation } : (isObject(testLocation) ? testLocation : {})
  const raw = firstValue(location.command, location.batchCommand, result.testCommand, structuredEvidence.command, structuredEvidence.batchCommand)
  if (!hasValue(raw)) return NOT_AVAILABLE
  const text = redactSecrets(String(raw)).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
  const selector = /(^|\s)--(?:idts110-case|selector|case(?:-key)?|internal-case(?:-key)?)(?:=|\s+)(?:"[^"]+"|'[^']+'|[^\s]+)/gi
  const hasSelector = selector.test(text)
  selector.lastIndex = 0
  const stripped = text.replace(selector, ' ').replace(/\s+/g, ' ').trim()
  const withoutInternalIds = omitInternalCaseIds(stripped)
  if (hasSelector || withoutInternalIds !== stripped) {
    return `Batch command (case selector omitted for mentor view): ${withoutInternalIds || NOT_AVAILABLE}`
  }
  return withoutInternalIds || NOT_AVAILABLE
}

function validPngDataUri (value) {
  if (typeof value !== 'string') return null
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || match[1].length > 8 * 1024 * 1024 || match[1].length % 4 !== 0) return null
  let bytes
  try { bytes = Buffer.from(match[1], 'base64') } catch { return null }
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null
  return value
}

function executionWindow (result, structuredEvidence) {
  const explicit = firstValue(result.executionWindow, structuredEvidence.executionWindow)
  if (explicit) return asText(explicit)
  const start = firstValue(result.startedAt, result.started, result.executedAt, structuredEvidence.startedAt, structuredEvidence.executedAt)
  const end = firstValue(result.completedAt, result.completed, structuredEvidence.completedAt)
  if (start && end) return `${asText(start)}–${asText(end)}`
  return asText(firstValue(start, end))
}

function statusKey (value) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function validSha (value) {
  return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value.trim())
}

function hasReadbackValue (rows, phase) {
  return rows.some(row => row[phase] !== NOT_AVAILABLE)
}

function requiresReadback (definition, result, structuredEvidence) {
  const values = [
    definition.evidenceRequirements,
    definition.coverage,
    result.evidenceRequirements,
    result.coverage,
    structuredEvidence.evidenceRequirements,
    structuredEvidence.coverage
  ]
  const text = values.flatMap(value => Array.isArray(value) ? value : [value]).filter(hasValue).join(' ')
  return /before|after|reload|readback|persistence|database|mutation|unchanged/i.test(text) || [
    result.beforeState, result.afterState, result.reloadState,
    structuredEvidence.beforeState, structuredEvidence.afterState, structuredEvidence.reloadState
  ].some(hasValue)
}

function missingFields (model, result, definition, structuredEvidence) {
  const missing = []
  if (model.result === NOT_AVAILABLE) missing.push('result')
  if (model.evidenceKind === NOT_AVAILABLE) missing.push('evidence kind')
  if (model.review === NOT_AVAILABLE) missing.push('review status')
  if (model.executor === NOT_AVAILABLE) missing.push('executor')
  if (model.title === NOT_AVAILABLE) missing.push('definition title')
  if (model.precondition === NOT_AVAILABLE) missing.push('precondition')
  if (model.action === NOT_AVAILABLE) missing.push('action')
  if (model.expected === NOT_AVAILABLE) missing.push('expected result')
  if (!model.observed.length) missing.push('observed assertions')
  if (!hasValue(firstValue(result.actualResult, result.actual, structuredEvidence.actualResult, structuredEvidence.actual))) missing.push('actual result')
  if (model.fileLine === NOT_AVAILABLE || !/:\S/.test(model.fileLine)) missing.push('test file/line')
  if (model.command === NOT_AVAILABLE) missing.push('execution command')
  if (model.sourceFunctions === NOT_AVAILABLE) missing.push('source assertions')
  if (!validSha(firstValue(result.sourceBaselineSha, result.baselineSha, result.baseline, structuredEvidence.sourceBaselineSha, structuredEvidence.baselineSha))) missing.push('source baseline SHA')
  if (model.executionWindow === NOT_AVAILABLE) missing.push('execution time')
  if (model.structuredReference === NOT_AVAILABLE || /^N\/A\s*\(/i.test(model.structuredReference)) missing.push('structured evidence reference')
  if (model.limitation === NOT_AVAILABLE) missing.push('limitation')
  if (requiresReadback(definition, result, structuredEvidence)) {
    for (const phase of ['before', 'after', 'reload']) if (!hasReadbackValue(model.snapshots, phase)) missing.push(`${phase} readback`)
  }
  return missing
}

function validateCompleteInput ({ definition, result, structuredEvidence, model }) {
  const statusRaw = firstValue(result.status, result.result, result.candidateExecutionStatus)
  const status = statusKey(statusRaw)
  if (!status) return
  if (/MAPPING[_ -]*ONLY/i.test(String(statusRaw))) throw new Error('complete card rejects Mapping Only results before rendering')
  if (status === 'NOT_RUN') throw new Error('complete card requires a terminal execution result; NOT_RUN is not renderable')
  const allowedEvidenceKinds = new Set(['LOCAL_ATOMIC', 'UI_RUNTIME', 'BTP_INTEGRATION', 'ENVIRONMENT_BLOCKED', 'HISTORICAL_RUNTIME', 'HISTORICAL_STRUCTURED'])
  if (model.evidenceKind !== NOT_AVAILABLE && !allowedEvidenceKinds.has(model.evidenceKind)) throw new Error(`unsupported evidence kind: ${model.evidenceKind}`)
  if (model.evidenceKind === 'ENVIRONMENT_BLOCKED' && status !== 'BLOCKED') throw new Error('ENVIRONMENT_BLOCKED evidence requires status BLOCKED')
  if (['PASS', 'FAIL'].includes(status) && typeof result.assertionPassed !== 'boolean') throw new Error(`${status} requires an explicit assertionPassed boolean`)
  if (status === 'PASS' && result.assertionPassed !== true) throw new Error('PASS requires assertionPassed=true')
  if (status === 'FAIL' && result.assertionPassed !== false) throw new Error('FAIL requires assertionPassed=false')
  if (status === 'BLOCKED') {
    const blocker = firstValue(result.missingPrecondition, result.blocker, result.blockedReason, result.actualResult, result.limitation, result.limitations, structuredEvidence.missingPrecondition, structuredEvidence.blocker)
    if (!hasValue(blocker) || !/(missing|unavailable|not available|cannot|precondition|required|no authorized|cloud foundry|target)/i.test(String(blocker))) throw new Error('BLOCKED card requires a named missing precondition')
    return
  }
  if (!['PASS', 'FAIL', 'HELD'].includes(status)) return
  const missing = missingFields(model, result, definition, structuredEvidence)
  if (missing.length) throw new Error(`${status} complete card missing required ${missing.join(', ')}`)
  if (/UI[_ -]?RUNTIME/i.test(model.evidenceKind) && status !== 'BLOCKED' && !model.runtimeImage) throw new Error('UI_RUNTIME card requires a valid PNG runtime screenshot data URI')
  if (/BTP[_ -]?INTEGRATION/i.test(model.evidenceKind)) {
    const deployedSha = firstValue(result.deployedSha, result.deploySha, structuredEvidence.deployedSha)
    const runtimeEvidence = firstValue(result.runtimeEvidence, structuredEvidence.runtimeEvidence)
    if (result.authorizedFixture !== true || !validSha(deployedSha) || !isObject(runtimeEvidence) || Object.keys(runtimeEvidence).length < 2) throw new Error('BTP_INTEGRATION card requires authorized fixture, deployed SHA, and runtime evidence')
    if (hasValue(runtimeEvidence.deployedSha) && runtimeEvidence.deployedSha !== deployedSha) throw new Error('BTP_INTEGRATION runtime evidence deployed SHA must match the result')
  }
}

function buildViewModel ({ mentorNumber, definition = {}, result = {}, testLocation = {}, structuredEvidence = {}, runtimeImageDataUrl } = {}) {
  if (!Number.isInteger(mentorNumber) || mentorNumber < 1 || mentorNumber > 278) throw new Error('mentorNumber must be an integer from 1 through 278')
  if (!isObject(definition)) definition = {}
  if (!isObject(result)) result = {}
  if (!isObject(structuredEvidence)) structuredEvidence = {}
  const sourceFunctions = sourceFunctionEntries(definition, result, structuredEvidence)
  const observed = observedAssertions(definition, result, structuredEvidence)
  const locationSourceFunctions = isObject(testLocation) ? firstValue(testLocation.sourceFunctions, testLocation.functions, testLocation.sourceAssertions) : undefined
  const evidenceKind = firstValue(result.evidenceKind, result.kind, structuredEvidence.evidenceKind, /BTP_REQUIRED|BTP/i.test(String(firstValue(result.environment, definition.environment, structuredEvidence.environment) || '')) ? 'ENVIRONMENT_BLOCKED' : undefined)
  const runtimeImage = validPngDataUri(firstValue(runtimeImageDataUrl, result.runtimeImageDataUrl, structuredEvidence.runtimeImageDataUrl, result.runtimeEvidence?.imageDataUrl, result.runtimeEvidence?.screenshotDataUrl))
  const rawExecutor = asText(firstValue(result.executor, structuredEvidence.executor))
  const model = {
    mentorNumber,
    title: asText(firstValue(definition.title, result.title)),
    result: asText(firstValue(result.status, result.result, result.candidateExecutionStatus)),
    review: asText(firstValue(result.reviewStatus, result.review, structuredEvidence.reviewStatus)),
    executor: MENTOR_EXECUTOR_LABEL,
    rawExecutor,
    evidenceKind: asText(evidenceKind),
    precondition: asText(firstValue(definition.precondition, definition.preconditions, result.precondition, result.preconditions)),
    action: asText(firstValue(definition.action, definition.input, result.action, result.input)),
    expected: asText(firstValue(definition.expectedResult, definition.expected, result.expectedResult)),
    observed,
    snapshots: snapshotRows(result, structuredEvidence),
    fileLine: formatFileLine(testLocation, result, definition),
    command: readerCommand(testLocation, result, structuredEvidence),
    sourceFunctions: sourceFunctions.length ? sourceFunctions.join('; ') : asText(locationSourceFunctions, NOT_AVAILABLE, { source: true }),
    baseline: asText(firstValue(result.sourceBaselineSha, result.baselineSha, result.baseline, structuredEvidence.sourceBaselineSha, structuredEvidence.baselineSha)),
    executionWindow: executionWindow(result, structuredEvidence),
    structuredReference: asText(firstValue(structuredEvidence.reference, structuredEvidence.path, structuredEvidence.file, structuredEvidence.resultRef, result.structuredEvidenceRef, result.structuredEvidencePath, result.structuredEvidenceFile, structuredEvidence.structuredEvidenceFile), isObject(structuredEvidence) && Object.keys(structuredEvidence).length ? 'N/A (structured evidence supplied without a reader reference)' : NOT_AVAILABLE),
    limitation: asText(firstValue(result.limitation, result.limitations, structuredEvidence.limitation, definition.limitation)),
    runtimeImage
  }
  validateCompleteInput({ definition, result, structuredEvidence, model })
  return model
}

function metadataHtml (label, value, strong = false) {
  return `<dl><dt>${escapeHtml(label)}</dt><dd>${strong ? `<strong>${asHtml(value)}</strong>` : asHtml(value)}</dd></dl>`
}

function buildVisibleText (model) {
  const lines = [
    `Case ${model.mentorNumber}`,
    model.title,
    '',
    `Result: ${model.result}`,
    `Executor: ${model.executor}`,
    `Evidence kind: ${model.evidenceKind}`,
    '',
    'Test definition',
    `Precondition: ${model.precondition}`,
    `Action: ${model.action}`,
    `Expected result: ${model.expected}`,
    '',
    'Observed assertions'
  ]
  if (model.observed.length) lines.push(...model.observed.map(item => `- ${item}`))
  else lines.push('- N/A (no observed assertions supplied)')
  lines.push('', 'Persistence readback', 'Entity | Before | After | Reload')
  for (const row of model.snapshots) lines.push(`${row.entity} | ${row.before} | ${row.after} | ${row.reload}`)
  lines.push('', 'Provenance', `File/line: ${model.fileLine}`, `Command: ${model.command}`, `Source assertions: ${model.sourceFunctions}`, `Source baseline: ${model.baseline}`, `Execution time: ${model.executionWindow}`, `Structured evidence: ${model.structuredReference}`, '', `Runtime screenshot: ${model.runtimeImage ? 'embedded PNG supplied' : 'N/A (valid PNG data URI not supplied)'}`, `Limitation: ${model.limitation}`)
  return lines.join('\n')
}

function buildHtml (model) {
  const status = model.result
  const accent = /blocked|mapping|held/i.test(status) ? '#f0a000' : /fail/i.test(status) ? '#d94f5c' : /pass/i.test(status) ? '#2b88d9' : '#8a8f98'
  const observedHtml = model.observed.length
    ? `<ul>${model.observed.map(item => `<li>${asHtml(item)}</li>`).join('')}</ul>`
    : `<p class="evidence-unavailable">N/A (no observed assertions supplied)</p>`
  const rowsHtml = model.snapshots.map(row => `<tr><td>${asHtml(row.entity)}</td><td class="text-end">${asHtml(row.before)}</td><td class="text-end">${asHtml(row.after)}</td><td class="text-end">${asHtml(row.reload)}</td></tr>`).join('')
  const runtimeHtml = model.runtimeImage
    ? `<p class="runtime-image-note">Embedded PNG evidence supplied by the execution input.</p><img class="runtime-image" alt="Runtime evidence screenshot" src="${model.runtimeImage}">`
    : `<p class="evidence-unavailable">N/A (valid PNG data URI not supplied)</p>`
  return `<div id="idts-complete-evidence">
  <style>
    #idts-complete-evidence { color: #172b4d; font-family: Arial, sans-serif; font-feature-settings: "kern" 1, "liga" 1; text-rendering: optimizeLegibility; max-width: 920px; margin: 0 auto; }
    #idts-complete-evidence .card { background: #f3f3f3; border-radius: 14px; padding: 14px 20px 18px; box-sizing: border-box; }
    #idts-complete-evidence .evidence-topline, #idts-complete-evidence .evidence-meta, #idts-complete-evidence .evidence-definition { display: grid; gap: 12px 24px; }
    #idts-complete-evidence .evidence-topline { grid-template-columns: 1fr auto; align-items: center; border-top: 3px solid ${accent}; padding-top: 1px; }
    #idts-complete-evidence .evidence-meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    #idts-complete-evidence .evidence-definition { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    #idts-complete-evidence h2, #idts-complete-evidence h3, #idts-complete-evidence p, #idts-complete-evidence dl, #idts-complete-evidence ul, #idts-complete-evidence table { margin-top: 0; }
    #idts-complete-evidence h2 { margin-bottom: 6px; font-size: 20px; }
    #idts-complete-evidence h3 { margin-top: 24px; margin-bottom: 10px; font-size: 16px; }
    #idts-complete-evidence .evidence-title { max-width: 65ch; margin-bottom: 18px; }
    #idts-complete-evidence dt { color: #6c7788; margin-bottom: 3px; font-size: 12px; }
    #idts-complete-evidence dd { margin-left: 0; margin-bottom: 12px; overflow-wrap: anywhere; }
    #idts-complete-evidence .evidence-definition > div { min-width: 0; }
    #idts-complete-evidence ul { padding-left: 22px; margin-bottom: 0; }
    #idts-complete-evidence li + li { margin-top: 6px; }
    #idts-complete-evidence code { overflow-wrap: anywhere; background: #e1e3e6; border-radius: 5px; padding: 2px 4px; }
    #idts-complete-evidence .evidence-note, #idts-complete-evidence .evidence-unavailable, #idts-complete-evidence .runtime-image-note { color: #6c7788; max-width: 75ch; margin-bottom: 0; }
    #idts-complete-evidence .text-small { color: #6c7788; font-size: 12px; }
    #idts-complete-evidence hr { border: 0; border-top: 1px solid #d9d9d9; margin: 18px 0 0; }
    #idts-complete-evidence .table-responsive { overflow-x: auto; }
    #idts-complete-evidence table { border-collapse: collapse; width: 100%; }
    #idts-complete-evidence th, #idts-complete-evidence td { border-bottom: 1px solid #d9d9d9; padding: 7px 0; text-align: left; vertical-align: top; }
    #idts-complete-evidence .text-end { text-align: right; }
    #idts-complete-evidence .runtime-image { display: block; max-width: 100%; height: auto; margin-top: 10px; border: 1px solid #d9d9d9; }
    @media (max-width: 640px) { #idts-complete-evidence .evidence-meta, #idts-complete-evidence .evidence-definition, #idts-complete-evidence .evidence-topline { grid-template-columns: 1fr; } }
  </style>
  <section class="card" aria-labelledby="idts-evidence-title">
    <div class="evidence-topline"><span class="text-small">Complete atomic evidence</span></div>
    <h2 id="idts-evidence-title">Case ${model.mentorNumber}</h2>
    <p class="evidence-title">${asHtml(model.title)}</p>
    <div class="evidence-meta">${metadataHtml('Result', model.result, true)}${metadataHtml('Executor', model.executor)}</div>
    <hr>
    <h3>Test definition</h3>
    <div class="evidence-definition"><div>${metadataHtml('Precondition', model.precondition)}</div><div>${metadataHtml('Action', model.action)}</div><div>${metadataHtml('Expected result', model.expected)}</div></div>
    <h3>Observed assertions</h3>${observedHtml}
    <h3>Persistence readback</h3>
    <div class="table-responsive"><table><thead><tr><th>Entity</th><th class="text-end">Before</th><th class="text-end">After</th><th class="text-end">Reload</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
    <h3>Provenance</h3>
    <div class="provenance">${metadataHtml('Evidence kind', model.evidenceKind)}${metadataHtml('Test file / line', model.fileLine)}${metadataHtml('Execution command', model.command)}${metadataHtml('Source assertions', model.sourceFunctions)}${metadataHtml('Source baseline SHA', model.baseline)}${metadataHtml('Execution time', model.executionWindow)}${metadataHtml('Structured evidence', model.structuredReference)}</div>
    <h3>Runtime screenshot</h3>${runtimeHtml}
    <p class="evidence-note"><strong>Limitation:</strong> ${asHtml(model.limitation)}</p>
  </section>
</div>`
}

function buildCompleteCard (input) {
  const model = buildViewModel(input)
  return { html: buildHtml(model), visibleText: buildVisibleText(model), reviewStatus: model.review, rawExecutor: model.rawExecutor }
}

module.exports = { buildCompleteCard, escapeHtml, redactSecrets, validPngDataUri, MENTOR_EXECUTOR_LABEL }
