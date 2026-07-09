#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = process.env.CDS_LOG_LEVEL || 'warn'

const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const { chromium } = require('playwright')
const cds = require('@sap/cds')

const { DELETE, INSERT, SELECT } = cds.ql
const { createSessionToken, hashToken, addMinutes } = require('../../srv/auth/passwords')
const { createHarness } = require('./lib/browser-harness')

const ROOT = path.resolve(__dirname, '..', '..')
const BASE_URL = String(process.env.IDTS_QA_BASE_URL || 'http://localhost:4004').replace(/\/+$/, '')
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR ||
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-72')
const EXPECT_AI_ENABLED = /^true$/i.test(process.env.IDTS_QA_EXPECT_AI_ENABLED || '')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY = '60000000-0000-0000-0000-000000000001'
const INTERNAL_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

function pass(label) {
  console.log(`  PASS  ${label}`)
}

async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({
        channel,
        headless: !/^false$/i.test(process.env.IDTS_QA_HEADLESS || '')
      })
    } catch (error) {
      void error
    }
  }
  return chromium.launch({ headless: !/^false$/i.test(process.env.IDTS_QA_HEADLESS || '') })
}

async function createLocalSession(db) {
  const token = createSessionToken()
  const now = new Date()
  const expiresAt = addMinutes(now, 30).toISOString()
  const sessionID = randomUUID()

  await db.run(INSERT.into('idts.cap.AuthSessions').entries({
    ID: sessionID,
    tokenHash: hashToken(token),
    user_ID: PM_USER.ID,
    issuedAt: now.toISOString(),
    expiresAt,
    userAgent: 'IDTS-72 browser QA'
  }))

  return { token, expiresAt, user: PM_USER, sessionID }
}

async function loginRemote() {
  const email = process.env.IDTS_QA_EMAIL
  const password = process.env.IDTS_QA_PASSWORD
  if (!email || !password) {
    throw new Error('Remote browser QA requires private IDTS_QA_EMAIL and IDTS_QA_PASSWORD.')
  }

  const response = await fetch(`${BASE_URL}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error(`Remote QA login failed with HTTP ${response.status}.`)

  const body = await response.json()
  const result = body?.value || body
  if (!result?.token || !result?.user) throw new Error('Remote QA login returned an incomplete safe session.')
  return {
    token: result.token,
    expiresAt: result.expiresAt || '',
    user: result.user
  }
}

async function prepareLocalFixture(db) {
  const bugID = randomUUID()
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: bugID,
    bugNumber: `QA-IDTS72-${Date.now()}`,
    title: 'AI review browser acceptance',
    description: 'Verify that Smart Assign explanations remain reviewable and manual.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'Local browser QA',
    stepsToReproduce: 'Open the Assignee value help and inspect suggestions.',
    actualResult: 'The user needs safe, reviewable assignment guidance.',
    expectedResult: 'Suggestion text is safe and the user remains in control.',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY,
    componentCategory_ID: COMPONENT_CATEGORY,
    reporter_ID: PM_USER.ID,
    nextProcessorUser_ID: PM_USER.ID,
    nextProcessorRole_code: 'PM'
  }))
  return bugID
}

async function injectSession(context, session) {
  await context.addInitScript(({ token, user, expiresAt }) => {
    sessionStorage.setItem('idts_auth_token', token)
    sessionStorage.setItem('idts_auth_user', JSON.stringify(user))
    sessionStorage.setItem('idts_auth_expires', expiresAt)
  }, {
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt
  })
}

async function readBug(page, token, bugID) {
  const response = await page.request.get(
    `${BASE_URL}/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)?$select=ID,status_code,assignee_ID`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!response.ok()) throw new Error(`Could not read AI QA source bug: HTTP ${response.status()}.`)
  return response.json()
}

function assigneeValueHelp(page) {
  return page
    .locator('.sapMInputBase:has(input[placeholder="Choose a developer"])')
    .first()
    .locator('.sapMInputValHelp, [role="button"][aria-label*="Value Help"], [title*="Value Help"]')
    .first()
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = IS_LOCAL ? await cds.connect.to('db') : null
  const session = IS_LOCAL ? await createLocalSession(db) : await loginRemote()
  const bugID = IS_LOCAL
    ? await prepareLocalFixture(db)
    : process.env.IDTS_QA_BUG_ID

  if (!bugID) {
    throw new Error('Remote browser QA requires IDTS_QA_BUG_ID for a review-safe Pending Assignment bug.')
  }

  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await injectSession(context, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })
  const results = []

  try {
    const before = await readBug(page, session.token, bugID)
    await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })

    const valueHelp = assigneeValueHelp(page)
    await valueHelp.waitFor({ state: 'visible', timeout: 90000 })
    await harness.assertNoBlockingSignals('IDTS-72 source bug load')
    pass('Smart Assign entry is available to the PM reviewer')
    results.push({ check: 'smart-assign-entry', passed: true })

    await valueHelp.click()
    const dialog = page.getByRole('dialog', { name: /Smart Assign Developer/i }).first()
    await dialog.waitFor({ state: 'visible', timeout: 30000 })
    await dialog.locator('.sapMListTblRow').first().waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(1500)

    const dialogText = (await dialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(dialogText)) {
      throw new Error('Smart Assign dialog exposed internal or developer-facing AI terminology.')
    }
    pass('AI review copy contains no internal implementation terms')
    results.push({ check: 'safe-user-facing-copy', passed: true })

    const hasReadyState = /Ready for review|Review carefully/i.test(dialogText)
    const hasUnavailableState = /Suggestion support is currently unavailable|Suggestion could not be prepared|Suggestion details are unavailable/i.test(dialogText)
    if (!hasReadyState && !hasUnavailableState) {
      throw new Error('Smart Assign dialog did not show a recognized review or safe fallback state.')
    }
    if (EXPECT_AI_ENABLED && !hasReadyState) {
      throw new Error('IDTS_QA_EXPECT_AI_ENABLED=true but no reviewable AI result was visible.')
    }
    pass(hasReadyState ? 'reviewable AI explanation state is visible' : 'disabled/unavailable AI fallback is safe')
    results.push({
      check: 'ai-review-state',
      passed: true,
      state: hasReadyState ? 'REVIEWABLE' : 'SAFE_FALLBACK'
    })

    const assignButton = dialog.getByRole('button', { name: /^Assign$/i })
    const candidateRows = dialog.locator('.sapMListTblRow')
    let assignableCandidateFound = false
    for (let index = 0; index < await candidateRows.count(); index += 1) {
      await candidateRows.nth(index).click()
      await page.waitForTimeout(150)
      if (await assignButton.isEnabled()) {
        assignableCandidateFound = true
        break
      }
    }
    if (!assignableCandidateFound) {
      throw new Error('Smart Assign dialog did not expose any assignable candidate for manual review.')
    }
    pass('manual candidate selection remains available')
    results.push({ check: 'manual-review-control', passed: true })

    await harness.screenshot('idts72_smart_assign_ai_review')
    await dialog.getByRole('button', { name: /^Cancel$/i }).click()
    await dialog.waitFor({ state: 'hidden', timeout: 15000 })

    const after = await readBug(page, session.token, bugID)
    if (before.status_code !== after.status_code || before.assignee_ID !== after.assignee_ID) {
      throw new Error('Review-only browser flow changed the source bug without user confirmation.')
    }
    pass('cancelled AI review did not mutate workflow or assignment')
    results.push({ check: 'no-unconfirmed-mutation', passed: true })

    await harness.assertNoBlockingSignals('IDTS-72 browser completion')
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'idts72-ai-browser.json'),
      JSON.stringify({
        task: 'IDTS-72',
        checkedAt: new Date().toISOString(),
        target: IS_LOCAL ? 'local' : 'shared-qa',
        expectedAiEnabled: EXPECT_AI_ENABLED,
        results
      }, null, 2)
    )

    console.log(`Evidence saved in ${EVIDENCE_DIR}`)
    console.log('RESULT: PASS')
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    if (db && bugID) {
      await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
    }
    if (db && session.sessionID) {
      await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: session.sessionID })).catch(() => {})
    }
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
