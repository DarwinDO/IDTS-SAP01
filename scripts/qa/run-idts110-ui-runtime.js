'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const childProcess = require('node:child_process')
const { chromium } = require('playwright')
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  validateAtomicResult,
  writeAtomicBatch,
  redactText,
  assertNoReparseAncestors
} = require('./idts110-atomic-runner')

const ROOT = path.resolve(__dirname, '../..')
const CATALOG_PATH = path.join(ROOT, 'docs/qa/idts-110-unit-test-catalog.json')
const APPROVAL_PATH = path.join(ROOT, 'docs/pm/evidence/idts-110/catalog-approval.json')
const ATOMIC_OUTPUT_ROOT = path.join(ROOT, '.tmp', 'idts-110')
const DEFAULT_OUTPUT = path.join('.tmp', 'idts-110', 'ui-results.json')
const DEFAULT_TIMEOUT_MS = 45000
const VIEWPORT = Object.freeze({ width: 1280, height: 900 })
const VISUAL_CASES = new Set([
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P',
  'IDTS110-F239H', 'IDTS110-F239D'
])
const SCENARIOS = Object.freeze({
  'IDTS110-F224': 'workload-drilldown',
  'IDTS110-F237': 'populated-bug',
  'IDTS110-F238': 'empty',
  'IDTS110-F238E': 'error-retry',
  'IDTS110-F238L': 'loading',
  'IDTS110-F239': 'visible-signal',
  'IDTS110-F239P': 'visible-poll',
  'IDTS110-F239H': 'hidden-stop',
  'IDTS110-F239D': 'destroy'
})
const PRECHECK_RUNNERS = Object.freeze({
  notifications: 'scripts/qa/test-my-notifications-shell.js',
  workload: 'scripts/qa/test-user-admin-workload.js'
})

function isVisualCase (caseKey) {
  return VISUAL_CASES.has(caseKey)
}

function parseFlag (argv, name) {
  const prefix = `--${name}`
  const index = argv.findIndex(argument => argument === prefix || argument.startsWith(`${prefix}=`))
  if (index < 0) return undefined
  const argument = argv[index]
  return argument.startsWith(`${prefix}=`) ? argument.slice(prefix.length + 1) : argv[index + 1]
}

function requiredToken (value, field, fallback = null) {
  const token = value === undefined || value === null || value === '' ? fallback : String(value)
  if (!token || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(token)) throw new Error(`IDTS-110 UI runtime: ${field} must be a safe invocation token`)
  return token
}

function newRunId () {
  return `idts110-ui-${Date.now()}-${crypto.randomBytes(12).toString('hex')}`
}

function newNonce () {
  return crypto.randomBytes(16).toString('hex')
}

function atomicArgs (argv) {
  return argv.map(argument => argument.startsWith('--case=')
    ? `--idts110-case=${argument.slice('--case='.length)}`
    : argument)
}

function parseUiOptions (argv = process.argv.slice(2)) {
  if (!Array.isArray(argv)) throw new Error('IDTS-110 UI runtime: argv must be an array')
  const atomic = readAtomicOptions(atomicArgs(argv))
  const explicitCase = parseFlag(argv, 'case') ?? parseFlag(argv, 'idts110-case')
  const caseKey = explicitCase === undefined ? null : String(explicitCase).trim()
  if (caseKey !== null && !isVisualCase(caseKey)) throw new Error(`IDTS-110 UI runtime: case ${caseKey} is not an approved visual case`)
  const scope = String(parseFlag(argv, 'scope') || (caseKey ? 'CASE' : 'VISUAL')).toUpperCase()
  if (!['VISUAL', 'CASE'].includes(scope)) throw new Error('IDTS-110 UI runtime: scope must be VISUAL')
  if (scope === 'CASE' && !caseKey) throw new Error('IDTS-110 UI runtime: CASE scope requires --case=<visual case>')
  if (scope === 'VISUAL' && caseKey) throw new Error('IDTS-110 UI runtime: VISUAL scope cannot be combined with --case; use CASE scope')
  if (!atomic.baselineSha) throw new Error('IDTS-110 UI runtime: --baseline=<exact source SHA> is required')
  if (!atomic.executor) throw new Error('IDTS-110 UI runtime: --executor=<explicit identity> is required')
  const suppliedUrl = parseFlag(argv, 'url')
  if (typeof suppliedUrl !== 'string' || !suppliedUrl.trim()) throw new Error('IDTS-110 UI runtime: --url=<fixture URL> is required')
  let url
  try {
    url = new URL(suppliedUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('unsupported URL')
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('loopback fixture required')
  } catch {
    throw new Error('IDTS-110 UI runtime: --url must be a loopback HTTP(S) fixture URL without credentials')
  }
  const outputPath = parseFlag(argv, 'output') || DEFAULT_OUTPUT
  const runId = requiredToken(parseFlag(argv, 'idts110-run-id'), 'runId', newRunId())
  const nonce = requiredToken(parseFlag(argv, 'idts110-nonce'), 'nonce', newNonce())
  const timeoutValue = parseFlag(argv, 'timeout-ms')
  const timeoutMs = timeoutValue === undefined ? DEFAULT_TIMEOUT_MS : Number(timeoutValue)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) throw new Error('IDTS-110 UI runtime: timeout-ms must be an integer from 1000 through 600000')
  return {
    caseKey,
    scope,
    baselineSha: atomic.baselineSha,
    executor: atomic.executor,
    url: url.toString(),
    outputPath,
    runId,
    nonce,
    timeoutMs
  }
}

function readJson (filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readDefinition (caseKey) {
  const catalog = readJson(CATALOG_PATH)
  const definition = Array.isArray(catalog.cases) ? catalog.cases.find(row => row.caseId === caseKey) : null
  if (!definition) throw new Error(`IDTS-110 UI runtime: catalog definition not found for ${caseKey}`)
  return definition
}

function catalogSha () {
  return crypto.createHash('sha256').update(JSON.stringify(readJson(CATALOG_PATH))).digest('hex')
}

function approvalReference () {
  return readJson(APPROVAL_PATH).approvalReference
}

function isWithin (target, parent) {
  const resolvedTarget = path.resolve(target)
  const resolvedParent = path.resolve(parent)
  return resolvedTarget === resolvedParent || resolvedTarget.startsWith(`${resolvedParent}${path.sep}`)
}

function outputInfo (outputPath) {
  const supplied = path.isAbsolute(outputPath) ? path.resolve(outputPath) : path.resolve(ROOT, outputPath)
  const outputRoot = path.resolve(ATOMIC_OUTPUT_ROOT)
  if (!isWithin(supplied, outputRoot)) throw new Error('IDTS-110 UI runtime: output must stay inside .tmp/idts-110')
  const isJsonFile = path.extname(supplied).toLowerCase() === '.json'
  const root = isJsonFile ? path.dirname(supplied) : supplied
  if (!isWithin(root, outputRoot)) throw new Error('IDTS-110 UI runtime: output directory must stay inside .tmp/idts-110')
  assertNoReparseAncestors(outputRoot)
  fs.mkdirSync(root, { recursive: true })
  assertNoReparseAncestors(root)
  return { root, batchPath: isJsonFile ? supplied : path.join(root, 'ui-results.json') }
}

function prepareCaseDirectory (root, caseKey) {
  const caseDirectory = path.resolve(root, caseKey)
  if (!isWithin(caseDirectory, root) || !isVisualCase(caseKey)) throw new Error('IDTS-110 UI runtime: invalid case artifact directory')
  assertNoReparseAncestors(root)
  try {
    const stat = fs.lstatSync(caseDirectory)
    if (stat.isSymbolicLink()) fs.unlinkSync(caseDirectory)
    else if (stat.isDirectory()) fs.rmSync(caseDirectory, { recursive: true, force: true })
    else fs.unlinkSync(caseDirectory)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  fs.mkdirSync(caseDirectory, { recursive: true })
  assertNoReparseAncestors(caseDirectory)
  return caseDirectory
}

function normalizeRelative (filePath) {
  return path.relative(ATOMIC_OUTPUT_ROOT, filePath).replace(/\\/g, '/')
}

function caseUrl (base, caseKey, options) {
  const url = new URL(base)
  url.pathname = caseKey === 'IDTS110-F224'
    ? '/idtsuseradministrationui/index.html'
    : '/idtsbugmanagementui/index.html'
  url.searchParams.set('idts110-case', caseKey)
  url.searchParams.set('idts110-run-id', options.runId)
  url.searchParams.set('idts110-nonce', options.nonce)
  url.searchParams.set('idts110-baseline', options.baselineSha)
  return url.toString()
}

function safeDiagnostic (value) {
  const text = value && typeof value === 'object' && value.message ? value.message : String(value || '')
  return redactText(text).replace(/\s+/g, ' ').slice(0, 400)
}

function childEnv () {
  const keys = ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'NODE_ENV', 'CDS_ENV', 'CDS_LOG_LEVEL', 'CI', 'NO_COLOR', 'FORCE_COLOR']
  return Object.fromEntries(keys.filter(key => typeof process.env[key] === 'string').map(key => [key, process.env[key]]))
}

function runPrecheck (caseKey, timeoutMs) {
  const runner = caseKey === 'IDTS110-F224' ? PRECHECK_RUNNERS.workload : PRECHECK_RUNNERS.notifications
  let child
  try {
    child = childProcess.spawnSync(process.execPath, [path.join(ROOT, runner)], {
      cwd: ROOT,
      env: childEnv(),
      encoding: 'utf8',
      timeout: Math.min(timeoutMs, 120000),
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true
    })
  } catch (error) {
    return { runner, passed: false, status: 'BLOCKED', exitCode: null, reason: safeDiagnostic(error) }
  }
  const timedOut = child.error?.code === 'ETIMEDOUT' || child.signal
  const passed = !timedOut && child.status === 0
  return {
    runner,
    passed,
    status: passed ? 'PASS' : 'BLOCKED',
    exitCode: Number.isInteger(child.status) ? child.status : null,
    reason: passed ? 'Programmatic/native-control precheck passed.' : 'Programmatic/native-control precheck was unavailable; no visual acceptance is inferred.'
  }
}

function attachDiagnostics (page, diagnostics) {
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) diagnostics.consoleErrors.push(safeDiagnostic(message.text()))
  })
  page.on('pageerror', error => diagnostics.consoleErrors.push(safeDiagnostic(error)))
  page.on('requestfailed', request => diagnostics.networkErrors.push(safeDiagnostic(request.failure()?.errorText || 'network request failed')))
  page.on('response', response => {
    if (response.status() >= 400 && response.url().split('?')[0].endsWith('/favicon.ico') === false) diagnostics.networkErrors.push(`HTTP ${response.status()} fixture response`)
  })
}

async function visibleText (page, text, timeout) {
  const locator = page.getByText(text, { exact: true }).first()
  await locator.waitFor({ state: 'visible', timeout })
  return locator
}

async function clickBell (page, timeout) {
  const bell = page.locator('#idtsNotificationShellHost .sapMBtn').first()
  await bell.waitFor({ state: 'visible', timeout })
  await bell.click()
  await page.locator('.sapMPopover').first().waitFor({ state: 'visible', timeout })
}

async function readMetrics (page) {
  return page.evaluate(() => {
    const metrics = window.__IDTS110_METRICS__ || {}
    return {
      unreadCalls: Number(metrics.unreadCalls || 0),
      searchCalls: Number(metrics.searchCalls || 0),
      timerDelay: Number(metrics.timerDelay || 0),
      timerCallbacks: Number(metrics.timerCallbacks || 0),
      clearCalls: Number(metrics.clearCalls || 0),
      listenersAdded: Number(metrics.listenersAdded || 0),
      listenersRemoved: Number(metrics.listenersRemoved || 0)
    }
  })
}

async function notificationScenario (page, caseKey, timeout) {
  await page.locator('#idtsNotificationShellHost .sapMTB').first().waitFor({ state: 'visible', timeout })
  if (caseKey === 'IDTS110-F237') {
    await clickBell(page, timeout)
    await visibleText(page, 'BUG-0017 — Compact notification title', timeout)
    const dom = await page.evaluate(() => {
      const popover = [...document.querySelectorAll('.sapMPopover')].find(node => getComputedStyle(node).display !== 'none')
      const list = popover?.querySelector('.sapMList') || null
      const bodyText = popover?.innerText || ''
      const row = [...(list?.querySelectorAll('.sapMLIB') || [])].find(node => node.textContent.includes('BUG-0017')) || null
      const widths = [popover, list].filter(Boolean).map(node => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
      return {
        titleVisible: bodyText.includes('BUG-0017 — Compact notification title'),
        unreadVisible: bodyText.includes('Unread'),
        timestampVisible: bodyText.includes('Occurred'),
        iconCount: row ? row.querySelectorAll('.sapUiIcon').length : 0,
        descriptionVisible: /description|private fixture detail/i.test(bodyText),
        horizontalOverflow: widths.some(size => size.scrollWidth > size.clientWidth + 1) || document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        rowCount: list ? list.querySelectorAll('.sapMLIB').length : 0
      }
    })
    const passed = dom.titleVisible && dom.unreadVisible && dom.timestampVisible && dom.iconCount === 0 && !dom.descriptionVisible && !dom.horizontalOverflow
    return { passed, dom, before: { shell: 'rendered', popover: 'closed' }, after: dom, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'notification' } }
  }
  if (caseKey === 'IDTS110-F238') {
    await clickBell(page, timeout)
    await visibleText(page, 'No notifications to show.', timeout)
    const dom = await page.evaluate(() => {
      const popover = [...document.querySelectorAll('.sapMPopover')].find(node => getComputedStyle(node).display !== 'none')
      const list = popover?.querySelector('.sapMList')
      const rows = list ? [...list.querySelectorAll('.sapMLIB')].filter(node => !node.classList.contains('sapMListNoData')) : []
      return { emptyVisible: (popover?.innerText || '').includes('No notifications to show.'), rowCount: rows.length, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
    })
    return { passed: dom.emptyVisible && dom.rowCount === 0 && !dom.horizontalOverflow, dom, before: { shell: 'rendered', rows: 0 }, after: dom, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'empty' } }
  }
  if (caseKey === 'IDTS110-F238E') {
    await clickBell(page, timeout)
    await visibleText(page, 'Notifications are temporarily unavailable. Try again.', timeout)
    await visibleText(page, 'Retry', timeout)
    const dom = await page.evaluate(() => {
      const popover = [...document.querySelectorAll('.sapMPopover')].find(node => getComputedStyle(node).display !== 'none')
      const list = popover?.querySelector('.sapMList')
      const text = popover?.innerText || ''
      const rows = list ? [...list.querySelectorAll('.sapMLIB')].filter(node => !node.classList.contains('sapMListNoData')) : []
      return { errorVisible: text.includes('Notifications are temporarily unavailable. Try again.'), retryVisible: text.includes('Retry'), rowCount: rows.length, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }
    })
    return { passed: dom.errorVisible && dom.retryVisible && dom.rowCount === 0 && !dom.horizontalOverflow, dom, before: { shell: 'rendered', rows: 0 }, after: dom, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'error-retry' } }
  }
  if (caseKey === 'IDTS110-F238L') {
    await clickBell(page, timeout)
    await visibleText(page, 'Loading notifications…', timeout)
    const dom = await page.evaluate(() => {
      const popover = [...document.querySelectorAll('.sapMPopover')].find(node => getComputedStyle(node).display !== 'none')
      const text = popover?.innerText || ''
      const visible = value => [...(popover?.querySelectorAll('*') || [])].some(node => node.textContent.trim() === value && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden')
      return { loadingVisible: visible('Loading notifications…'), emptyVisible: visible('No notifications to show.'), errorVisible: visible('Notifications are temporarily unavailable. Try again.'), retryVisible: visible('Retry'), text }
    })
    return { passed: dom.loadingVisible && !dom.emptyVisible && !dom.errorVisible && !dom.retryVisible, dom, before: { shell: 'rendered', request: 'pending' }, after: dom, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'loading' } }
  }
  const initialMetrics = await readMetrics(page)
  if (caseKey === 'IDTS110-F239') {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('idts:notification-change')))
    await page.waitForFunction(before => Number(window.__IDTS110_METRICS__?.unreadCalls || 0) > before, initialMetrics.unreadCalls, { timeout })
    await page.waitForTimeout(50)
    const metrics = await readMetrics(page)
    return { passed: metrics.unreadCalls === initialMetrics.unreadCalls + 1, dom: { signalDispatched: true, unreadCallsBefore: initialMetrics.unreadCalls, unreadCallsAfter: metrics.unreadCalls }, before: initialMetrics, after: metrics, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'visible-signal' } }
  }
  if (caseKey === 'IDTS110-F239P') {
    await page.evaluate(() => {
      const metrics = window.__IDTS110_METRICS__
      if (typeof metrics.intervalCallback === 'function') metrics.intervalCallback()
    })
    await page.waitForFunction(before => Number(window.__IDTS110_METRICS__?.unreadCalls || 0) > before, initialMetrics.unreadCalls, { timeout })
    await page.waitForTimeout(50)
    const metrics = await readMetrics(page)
    return { passed: metrics.timerDelay === 30000 && metrics.timerCallbacks === 1 && metrics.unreadCalls === initialMetrics.unreadCalls + 1, dom: { visible: true, pollingIntervalMs: metrics.timerDelay }, before: initialMetrics, after: metrics, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'visible-poll' } }
  }
  if (caseKey === 'IDTS110-F239H') {
    await page.evaluate(() => {
      window.__IDTS110_VISIBILITY__ = 'hidden'
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForFunction(before => Number(window.__IDTS110_METRICS__?.clearCalls || 0) > before, initialMetrics.clearCalls, { timeout })
    const metrics = await page.evaluate(async () => {
      const before = Number(window.__IDTS110_METRICS__?.unreadCalls || 0)
      if (typeof window.__IDTS110_METRICS__?.intervalCallback === 'function') window.__IDTS110_METRICS__.intervalCallback()
      await new Promise(resolve => setTimeout(resolve, 0))
      return { ...window.__IDTS110_METRICS__, unreadCallsBeforeCallback: before }
    })
    const safeMetrics = { unreadCalls: Number(metrics.unreadCalls || 0), unreadCallsBeforeCallback: Number(metrics.unreadCallsBeforeCallback || 0), timerDelay: Number(metrics.timerDelay || 0), timerCallbacks: Number(metrics.timerCallbacks || 0), clearCalls: Number(metrics.clearCalls || 0), listenersAdded: Number(metrics.listenersAdded || 0), listenersRemoved: Number(metrics.listenersRemoved || 0) }
    return { passed: safeMetrics.clearCalls > initialMetrics.clearCalls && safeMetrics.unreadCalls === safeMetrics.unreadCallsBeforeCallback, dom: { visibilityState: 'hidden', pollingStopped: safeMetrics.clearCalls > initialMetrics.clearCalls }, before: initialMetrics, after: safeMetrics, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'hidden-stop' } }
  }
  if (caseKey === 'IDTS110-F239D') {
    await page.evaluate(() => window.__IDTS110_FIXTURE_SHELL__?.destroy())
    await page.waitForFunction(() => {
      const host = document.getElementById('idtsNotificationShellHost')
      const metrics = window.__IDTS110_METRICS__ || {}
      return (!host || !host.querySelector('.sapMTB')) && Number(metrics.clearCalls || 0) > 0 && Number(metrics.listenersRemoved || 0) >= 3
    }, null, { timeout })
    const metrics = await readMetrics(page)
    const dom = await page.evaluate(() => { const hostHasToolbar = Boolean(document.querySelector('#idtsNotificationShellHost .sapMTB')); return { hostHasToolbar, destroyed: !hostHasToolbar } })
    return { passed: dom.destroyed && metrics.clearCalls > 0 && metrics.listenersRemoved >= 3, dom, before: initialMetrics, after: metrics, reload: { route: '/idtsbugmanagementui/index.html', fixture: 'destroy' } }
  }
  throw new Error(`IDTS-110 UI runtime: unsupported notification scenario ${caseKey}`)
}

async function workloadScenario (page, timeout) {
  await page.waitForFunction(() => window.__IDTS110_WORKLOAD_READY__ === true, null, { timeout })
  await page.getByText('Technical Developer', { exact: true }).first().waitFor({ state: 'visible', timeout })
  await page.getByText('Current Action Owner', { exact: true }).first().waitFor({ state: 'visible', timeout })
  await page.getByText('Open Bug', { exact: true }).first().click()
  await page.waitForFunction(() => typeof window.__IDTS110_WORKLOAD_LAST_LINK__ === 'string', null, { timeout })
  const dom = await page.evaluate(() => {
    const bodyText = document.body.innerText || ''
    const fixture = window.__IDTS110_WORKLOAD_FIXTURE__ || {}
    const links = Array.isArray(window.__IDTS110_WORKLOAD_LINKS__) ? window.__IDTS110_WORKLOAD_LINKS__ : []
    const validLink = value => /^\/idtsbugmanagementui\/index\.html#\/Bugs\(ID=[0-9a-f-]{36},IsActiveEntity=true\)$/i.test(value)
    const deepLinksValid = links.length > 0 && links.every(validLink) && validLink(window.__IDTS110_WORKLOAD_LAST_LINK__)
    return {
      workloadRendered: bodyText.includes('Technical Developer'),
      actionOwnerRendered: bodyText.includes('Current Action Owner'),
      nonClosedRendered: !bodyText.includes('Closed fixture row'),
      openBugActionRendered: bodyText.includes('Open Bug'),
      requestFilter: fixture.requestFilter || '',
      selectedProfile: fixture.selectedProfile || '',
      deepLinksValid,
      clickedDeepLink: window.__IDTS110_WORKLOAD_LAST_LINK__ || '',
      sourceClosedRows: Number(fixture.sourceClosedRows || 0),
      renderedBugRows: Number(fixture.renderedBugRows || 0),
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    }
  })
  const passed = dom.workloadRendered && dom.actionOwnerRendered && dom.nonClosedRendered && dom.openBugActionRendered && dom.requestFilter.includes("status_code ne 'CLOSED'") && dom.selectedProfile && dom.deepLinksValid && dom.sourceClosedRows >= 1 && dom.renderedBugRows === 1 && !dom.documentOverflow
  return { passed, dom, before: { dialog: 'opening', selectedProfile: dom.selectedProfile }, after: dom, reload: { route: '/idtsuseradministrationui/index.html', fixture: 'workload-drilldown' } }
}

async function captureRuntimeEvidence (page, caseDirectory, caseKey, options, definition, scenarioResult, diagnostics) {
  const screenshotFile = path.join(caseDirectory, 'runtime.png')
  await page.screenshot({ path: screenshotFile, fullPage: true })
  const screenshotSha256 = crypto.createHash('sha256').update(fs.readFileSync(screenshotFile)).digest('hex')
  const createdAt = new Date().toISOString()
  const screenshotPath = normalizeRelative(screenshotFile)
  const manifestFile = path.join(caseDirectory, 'case-manifest.json')
  const manifestPath = normalizeRelative(manifestFile)
  const pathMetadata = { caseKey, runId: options.runId, nonce: options.nonce, baseline: options.baselineSha, createdAt }
  const manifest = {
    schemaVersion: '1.0',
    caseKey,
    assertionId: `${caseKey}-A1`,
    runId: options.runId,
    nonce: options.nonce,
    baseline: options.baselineSha,
    createdAt,
    pathMetadata,
    screenshotPath,
    screenshotSha256,
    evidenceIds: [`${caseKey}-VISUAL`],
    expectedResult: definition.expectedResult,
    actualResult: scenarioResult.passed ? definition.expectedResult : 'Rendered state did not meet the selected visual assertion.',
    reviewStatus: 'PENDING_DONHV_REVIEW',
    scenario: SCENARIOS[caseKey]
  }
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  return {
    browser: 'Playwright Chromium',
    scenario: SCENARIOS[caseKey],
    route: caseKey === 'IDTS110-F224' ? '/idtsuseradministrationui/index.html' : '/idtsbugmanagementui/index.html',
    viewport: VIEWPORT,
    screenshotPath,
    screenshotSha256,
    manifestPath,
    caseKey,
    runId: options.runId,
    nonce: options.nonce,
    baseline: options.baselineSha,
    createdAt,
    pathMetadata,
    domChecks: scenarioResult.dom,
    consoleErrors: diagnostics.consoleErrors.slice(0, 16),
    networkErrors: diagnostics.networkErrors.slice(0, 16),
    precheck: scenarioResult.precheck || null
  }
}

function testCommand (caseKey, definition, options) {
  return `node ${definition.plannedTestFile} --idts110-case=${caseKey} --baseline=${options.baselineSha} --executor=${options.executor} --idts110-run-id=${options.runId} --idts110-nonce=${options.nonce}`
}

function unavailableOutcome (caseKey, definition, options, precheck, reason) {
  return {
    status: 'BLOCKED',
    assertionPassed: false,
    actualResult: reason,
    beforeState: { precheck: precheck?.status || 'not-run' },
    afterState: { browser: 'unavailable' },
    reloadState: { route: caseKey === 'IDTS110-F224' ? '/idtsuseradministrationui/index.html' : '/idtsbugmanagementui/index.html', readback: 'not-run' },
    evidenceIds: [`${caseKey}-RESULT`, `${caseKey}-VISUAL`],
    limitation: 'The controlled fixture or installed Chromium browser was unavailable; no visual PASS is claimed.',
    testCommand: testCommand(caseKey, definition, options)
  }
}

async function runVisualCase ({ caseKey, options, outputRoot, browser, precheck }) {
  if (!isVisualCase(caseKey)) throw new Error(`IDTS-110 UI runtime: unsupported visual case ${caseKey}`)
  const definition = readDefinition(caseKey)
  const caseDirectory = prepareCaseDirectory(outputRoot, caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => {
      if (!precheck?.passed) return unavailableOutcome(caseKey, definition, options, precheck, 'The programmatic/native-control precheck was unavailable; the rendered case is blocked.')
      if (!browser) return unavailableOutcome(caseKey, definition, options, precheck, 'The installed Chromium browser could not start; the rendered case is blocked.')
      const diagnostics = { consoleErrors: [], networkErrors: [] }
      let context
      let page
      try {
        context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'en-US' })
        page = await context.newPage()
        attachDiagnostics(page, diagnostics)
        await page.goto(caseUrl(options.url, caseKey, options), { waitUntil: 'domcontentloaded', timeout: options.timeoutMs })
        const scenarioResult = caseKey === 'IDTS110-F224'
          ? await workloadScenario(page, options.timeoutMs)
          : await notificationScenario(page, caseKey, options.timeoutMs)
        scenarioResult.precheck = { runner: precheck.runner, status: precheck.status }
        const runtimeEvidence = await captureRuntimeEvidence(page, caseDirectory, caseKey, options, definition, scenarioResult, diagnostics)
        const actualResult = scenarioResult.passed ? definition.expectedResult : `Rendered ${SCENARIOS[caseKey]} state did not satisfy the exact visual assertion.`
        return {
          status: scenarioResult.passed ? 'PASS' : 'FAIL',
          assertionPassed: scenarioResult.passed,
          actualResult,
          beforeState: scenarioResult.before,
          afterState: scenarioResult.after,
          reloadState: scenarioResult.reload,
          runtimeEvidence,
          evidenceIds: [`${caseKey}-RESULT`, `${caseKey}-VISUAL`],
          limitation: 'Rendered in a deterministic fixture with installed Playwright Chromium; no provider or live platform state was used.',
          testCommand: testCommand(caseKey, definition, options)
        }
      } catch (error) {
        return unavailableOutcome(caseKey, definition, options, precheck, `The rendered fixture could not reach a truthful state: ${safeDiagnostic(error)}`)
      } finally {
        if (context) await context.close().catch(() => {})
      }
    }
  })
  validateAtomicResult(result)
  fs.writeFileSync(path.join(caseDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  return result
}

async function runVisualBatch (options) {
  const output = outputInfo(options.outputPath)
  const caseKeys = options.caseKey ? [options.caseKey] : [...VISUAL_CASES]
  if (caseKeys.length !== (options.caseKey ? 1 : 9)) throw new Error('IDTS-110 UI runtime: visual scope must select exactly nine cases')
  const precheckByType = {}
  precheckByType.notifications = runPrecheck('IDTS110-F237', options.timeoutMs)
  precheckByType.workload = runPrecheck('IDTS110-F224', options.timeoutMs)
  let browser = null
  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    browser = null
  }
  const results = []
  for (const caseKey of caseKeys) {
    const precheck = caseKey === 'IDTS110-F224' ? precheckByType.workload : precheckByType.notifications
    results.push(await runVisualCase({ caseKey, options, outputRoot: output.root, browser, precheck }))
  }
  if (browser) await browser.close().catch(() => {})
  return writeAtomicBatch({
    runId: options.runId,
    sourceBaselineSha: options.baselineSha,
    catalogSha: catalogSha(),
    approvalReference: approvalReference(),
    results
  }, output.batchPath)
}

function exitCodeForBatch (batch) {
  return Array.isArray(batch?.results) && batch.results.length > 0 && batch.results.every(result => result.status === 'PASS') ? 0 : 1
}

function formatCaseOutput (result) {
  return formatAtomicMarker(result)
}

async function main () {
  const options = parseUiOptions()
  const batch = await runVisualBatch(options)
  if (options.caseKey) {
    console.log(formatCaseOutput(batch.results[0]))
  } else {
    console.log(JSON.stringify({ runId: batch.runId, scope: options.scope, total: batch.results.length, statusCounts: batch.totals }))
  }
  process.exitCode = exitCodeForBatch(batch)
}

if (require.main === module) {
  main().catch(error => {
    console.error(`IDTS-110 UI runtime BLOCKED: ${safeDiagnostic(error)}`)
    process.exitCode = 1
  })
}

module.exports = {
  ROOT,
  VIEWPORT,
  VISUAL_CASES,
  SCENARIOS,
  isVisualCase,
  parseUiOptions,
  outputInfo,
  caseUrl,
  runVisualCase,
  runVisualBatch,
  formatCaseOutput,
  exitCodeForBatch
}
