#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const { createHarness } = require('./lib/browser-harness')

const BASE_URL = String(process.env.IDTS_QA_BASE_URL || 'https://idts-sap01-qa.onrender.com').replace(/\/+$/, '')
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
const EMAIL = process.env.IDTS_QA_EMAIL
const PASSWORD = process.env.IDTS_QA_PASSWORD
const BUG_ID = process.env.IDTS_QA_BUG_ID
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR ||
  path.join(process.cwd(), 'docs', 'pm', 'evidence', 'idts-100', 'shared-qa-ai-browser', 'all-review-actions')
const INTERNAL_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

const results = []

function pass (label) {
  results.push({ check: label, passed: true })
  console.log(`  PASS  ${label}`)
}

async function launchBrowser () {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }) } catch { /* try next */ }
  }
  return chromium.launch({ headless: true })
}

async function login () {
  const response = await fetch(`${BASE_URL}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })
  if (!response.ok) throw new Error(`Shared QA login failed with HTTP ${response.status}.`)
  const body = await response.json()
  const result = body?.value || body
  if (!result?.token || !result?.user) throw new Error('Shared QA login returned no safe session.')
  return result
}

async function readBugState (token) {
  const query = new URLSearchParams({
    '$select': 'ID,bugNumber,status_code,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code',
    '$filter': `ID eq ${BUG_ID} and IsActiveEntity eq true`,
    '$top': '1'
  }).toString().replace(/\+/g, '%20')
  const response = await fetch(`${BASE_URL}/odata/v4/bug/Bugs?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error(`Could not read review-safe Bug. HTTP ${response.status}.`)
  const body = await response.json()
  if (!body.value?.[0]) throw new Error('IDTS_QA_BUG_ID is not an active Shared QA Bug.')
  return body.value[0]
}

async function closeDialog (dialog) {
  await dialog.getByRole('button', { name: /^(Close|OK|Cancel)$/i }).last().click()
  await dialog.waitFor({ state: 'hidden', timeout: 20000 })
}

async function reviewAction (page, harness, config) {
  const button = page.getByRole('button', { name: config.button }).first()
  await button.waitFor({ state: 'visible', timeout: 90000 })
  pass(`${config.name} entry point is visible in its business section`)
  await harness.screenshot(`${config.prefix}_entry_point`)

  await button.click()
  const dialog = page.getByRole('dialog', { name: config.dialog }).first()
  await dialog.waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(1200)
  const text = (await dialog.innerText()).replace(/\s+/g, ' ').trim()
  if (!text) throw new Error(`${config.name} dialog is empty.`)
  if (INTERNAL_COPY.test(text)) throw new Error(`${config.name} dialog exposes internal/developer-facing copy.`)
  if (!/review|choose manually|suggestion|summary|no similar bugs/i.test(text)) {
    throw new Error(`${config.name} dialog does not explain the human review decision.`)
  }
  pass(`${config.name} dialog is readable, safe and review-only`)
  await harness.screenshot(`${config.prefix}_dialog`)
  await closeDialog(dialog)
}

async function main () {
  if (!EMAIL || !PASSWORD || !BUG_ID) {
    throw new Error('Set private IDTS_QA_EMAIL, IDTS_QA_PASSWORD and IDTS_QA_BUG_ID.')
  }
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const session = await login()
  const before = await readBugState(session.token)
  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.addInitScript(({ token, user, expiresAt }) => {
    sessionStorage.setItem('idts_auth_token', token)
    sessionStorage.setItem('idts_auth_user', JSON.stringify(user))
    sessionStorage.setItem('idts_auth_expires', expiresAt || '')
  }, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })

  try {
    await page.goto(`${APP_URL}#/Bugs(ID=${BUG_ID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })
    await reviewAction(page, harness, {
      name: 'Similar Bugs', prefix: '01_similar_bugs',
      button: /^Find Similar Bugs$/i, dialog: /^Similar Bugs$/i
    })
    await reviewAction(page, harness, {
      name: 'Classification Suggestions', prefix: '02_classification',
      button: /^Review Classification Suggestions$/i, dialog: /^Classification Suggestions$/i
    })
    await reviewAction(page, harness, {
      name: 'Handoff Summary', prefix: '03_handoff',
      button: /^Review Handoff Summary$/i, dialog: /^Handoff Summary$/i
    })

    const after = await readBugState(session.token)
    const stable = ['status_code', 'assignee_ID', 'nextProcessorUser_ID', 'nextProcessorRole_code']
      .every(field => (before[field] || null) === (after[field] || null))
    if (!stable) throw new Error('AI review actions changed Bug workflow ownership or status.')
    pass('All three AI review actions leave workflow and ownership unchanged')
    await harness.assertNoBlockingSignals('IDTS-100 Shared QA AI review actions')

    fs.writeFileSync(path.join(EVIDENCE_DIR, 'shared-qa-ai-browser.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      target: 'Render Shared QA',
      bug: { ID: before.ID, bugNumber: before.bugNumber },
      providerAcceptance: 'NOT ACCEPTED — live provider disabled by decision',
      results
    }, null, 2) + '\n')
    console.log(`Evidence saved in ${EVIDENCE_DIR}`)
    console.log(`RESULT: PASS (${results.length}/${results.length})`)
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch(error => {
  console.error(`RESULT: FAIL — ${String(error.message || error).replace(/[\w.+-]+@[\w.-]+/g, '[email-redacted]')}`)
  process.exit(1)
})
