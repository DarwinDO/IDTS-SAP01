'use strict'

const fs = require('fs')
const path = require('path')

const KNOWN_LOCAL_PREVIEW_404 = [
  /Component-preload\.js/i,
  /\/lrep\//i,
  /\/flex\//i,
  /sap-ui-version/i,
  /i18n_[a-z]{2}_[A-Z]{2}\.properties/i
]

const KNOWN_LOCAL_CONSOLE_NOISE = [
  /Failed to load resource: the server responded with a status of 404/i,
  /failed to load JavaScript resource: .*Component-preload\.js/i,
  /Refused to execute script.*Component-preload/i,
  /LREP/i,
  /S\/CUBE/i,
  /pseudo module/i,
  /livereload/i
]

function isAllowedLocalPreviewResponse(status, url) {
  if (status < 400) return true
  if (status === 401 && /\/odata\/v4\/auth\/me/i.test(url)) return true
  if (status === 404 && KNOWN_LOCAL_PREVIEW_404.some(pattern => pattern.test(url))) return true
  return false
}

function isUnexpectedConsoleError(text) {
  return !KNOWN_LOCAL_CONSOLE_NOISE.some(pattern => pattern.test(text))
}

function normalizeCheckpoint(checkpoint) {
  return String(checkpoint || 'checkpoint')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'checkpoint'
}

async function createHarness(page, options = {}) {
  const evidenceDir = options.evidenceDir || path.join(process.cwd(), 'scripts', 'qa', 'uat-evidence')
  fs.mkdirSync(evidenceDir, { recursive: true })

  const state = {
    pageErrors: [],
    consoleErrors: [],
    badResponses: []
  }

  page.on('pageerror', error => {
    state.pageErrors.push(error.message || String(error))
  })

  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (isUnexpectedConsoleError(text)) state.consoleErrors.push(text)
  })

  page.on('response', response => {
    const status = response.status()
    const url = response.url()
    if (!isAllowedLocalPreviewResponse(status, url)) {
      state.badResponses.push(`${status} ${url}`)
    }
  })

  async function screenshot(checkpoint) {
    const fileName = `${normalizeCheckpoint(checkpoint)}.png`
    const target = path.join(evidenceDir, fileName)
    await page.screenshot({ path: target, fullPage: true }).catch(() => {})
    return target
  }

  async function assertNoBlockingSignals(checkpoint) {
    const dialogTexts = await page.locator('[role="dialog"], .sapMDialog, .sapMMessageBox').evaluateAll(nodes =>
      nodes
        .filter(node => {
          const style = window.getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
        })
        .map(node => node.textContent || '')
    ).catch(() => [])

    const blockingDialogs = dialogTexts
      .map(text => text.replace(/\s+/g, ' ').trim())
      .filter(text => /error|failed|exception|no such table|sqlite|cannot/i.test(text))

    const failures = []
    if (state.pageErrors.length) failures.push(`page errors: ${state.pageErrors.join(' | ')}`)
    if (state.consoleErrors.length) failures.push(`console errors: ${state.consoleErrors.slice(0, 5).join(' | ')}`)
    if (state.badResponses.length) failures.push(`bad HTTP responses: ${state.badResponses.slice(0, 8).join(' | ')}`)
    if (blockingDialogs.length) failures.push(`visible SAP error dialogs: ${blockingDialogs.slice(0, 3).join(' | ')}`)

    if (failures.length) {
      const evidencePath = await screenshot(`error_${checkpoint}`)
      throw new Error(`${checkpoint}: ${failures.join('; ')}; screenshot=${evidencePath}`)
    }
  }

  async function clickAndCheck(locator, checkpoint) {
    await locator.click()
    await page.waitForLoadState('domcontentloaded').catch(() => {})
    await page.waitForTimeout(options.settleMs || 750)
    await assertNoBlockingSignals(checkpoint)
  }

  async function saveReloadAndCheck(readBack, checkpoint) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(options.settleMs || 750)
    await assertNoBlockingSignals(`${checkpoint} reload`)
    const result = await readBack()
    if (!result) {
      const evidencePath = await screenshot(`missing_${checkpoint}`)
      throw new Error(`${checkpoint}: persistence/read-back check failed; screenshot=${evidencePath}`)
    }
  }

  return {
    state,
    screenshot,
    assertNoBlockingSignals,
    clickAndCheck,
    saveReloadAndCheck
  }
}

module.exports = {
  createHarness,
  isAllowedLocalPreviewResponse,
  isUnexpectedConsoleError,
  normalizeCheckpoint
}
