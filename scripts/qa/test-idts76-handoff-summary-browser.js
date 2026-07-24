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
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-76')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)
const INTERNAL_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const DEVELOPER_USER = '10000000-0000-0000-0000-000000000002'
const DEVELOPER_PROFILE = '20000000-0000-0000-0000-000000000002'
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY = '60000000-0000-0000-0000-000000000001'

function pass (label) {
  console.log(`  PASS  ${label}`)
}

async function launchBrowser () {
  const headless = !/^false$/i.test(process.env.IDTS_QA_HEADLESS || '')
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless })
    } catch (error) {
      void error
    }
  }
  return chromium.launch({ headless })
}

async function createLocalSession (db) {
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
    userAgent: 'IDTS-76 browser QA'
  }))

  return { token, expiresAt, user: PM_USER, sessionID }
}

async function injectSession (context, session) {
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

async function createBugFixture (db) {
  const marker = Date.now()
  const bugID = randomUUID()
  const eventID = randomUUID()
  const now = new Date().toISOString()

  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: bugID,
    bugNumber: `QA-IDTS76-${marker}`,
    title: `Checkout handoff review ${marker}`,
    description: 'Payment checkout fails after tester enters a valid card in the QA environment.',
    status_code: 'NEED_MORE_INFORMATION',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Open checkout, enter valid payment details, submit.',
    actualResult: 'The page returns an authorization error.',
    expectedResult: 'The order is created or a safe user message is displayed.',
    reporter_ID: PM_USER.ID,
    assignee_ID: DEVELOPER_PROFILE,
    nextProcessorUser_ID: PM_USER.ID,
    nextProcessorRole_code: 'TESTER',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY,
    componentCategory_ID: COMPONENT_CATEGORY
  }))

  await db.run(INSERT.into('idts.cap.Comments').entries({
    ID: randomUUID(),
    bug_ID: bugID,
    author_ID: PM_USER.ID,
    authorRole_code: 'PM',
    content: 'Tester confirmed the error happens only after the payment submit step.',
    createdAt: now
  }))

  await db.run(INSERT.into('idts.cap.HistoryEvents').entries({
    ID: eventID,
    bug_ID: bugID,
    actor_ID: DEVELOPER_USER,
    actorRole_code: 'DEVELOPER',
    actionType_code: 'REQUEST_INFO',
    summary: 'Requested more information from tester.',
    reason: 'Need payment authorization response details.',
    createdAt: now
  }))

  return bugID
}

async function readBugState (db, bugID) {
  return db.run(
    SELECT.one.from('idts.cap.Bugs')
      .columns('status_code', 'assignee_ID', 'nextProcessorUser_ID', 'modifiedAt')
      .where({ ID: bugID })
  )
}

async function waitForReviewState (db, bugID, featureType, expectedState) {
  let review
  for (let attempt = 0; attempt < 30; attempt += 1) {
    review = await db.run(
      SELECT.one.from('idts.cap.AiSuggestions')
        .columns('reviewState_code', 'reviewedBy_ID', 'reviewedAt')
        .where({ bug_ID: bugID, featureType_code: featureType })
        .orderBy('createdAt desc')
    )
    if (
      review?.reviewState_code === expectedState &&
      review?.reviewedBy_ID === PM_USER.ID &&
      review?.reviewedAt
    ) {
      return review
    }
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  return review
}

async function cleanup (db, bugID, sessionID) {
  await db.run(DELETE.from('idts.cap.AiSuggestions').where({ bug_ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.HistoryEvents').where({ bug_ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Comments').where({ bug_ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
}

async function closeDialog (dialog) {
  await dialog.getByRole('button', { name: /^Close$/i }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 15000 })
}

async function captureMobileDialog (browser, session, bugID) {
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
  })
  await injectSession(mobileContext, session)
  const mobilePage = await mobileContext.newPage()
  const mobileHarness = await createHarness(mobilePage, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })

  try {
    await mobilePage.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })
    const mobileButton = mobilePage.getByRole('button', { name: /^Review Handoff Summary$/i }).first()
    await mobileButton.waitFor({ state: 'visible', timeout: 90000 })
    await mobileButton.click()
    const mobileDialog = mobilePage.getByRole('dialog', { name: /^Handoff Summary$/i }).first()
    await mobileDialog.waitFor({ state: 'visible', timeout: 30000 })
    await mobileDialog.getByRole('button', { name: /^Accept$/i }).waitFor({ state: 'visible', timeout: 30000 })
    await mobileHarness.assertNoBlockingSignals('mobile Handoff Summary dialog')
    await mobileHarness.screenshot('idts94_handoff_summary_mobile')
  } finally {
    await mobileContext.close().catch(() => {})
  }
}

function controlledSummary (status, summary) {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#BugService.BugHandoffSummaryResult`,
    bugID: randomUUID(),
    bugNumber: 'QA-IDTS76-CONTROLLED',
    generatedAt: new Date().toISOString(),
    label: 'Handoff summary for review',
    summary,
    currentStatus: 'Need More Information',
    currentActionOwner: 'DonHV',
    missingInformation: 'Payment authorization response details are still missing.',
    latestImportantEvents: 'Developer requested more information from tester.',
    nextExpectedAction: 'Tester should add the missing payment response details.',
    groundingStatus: status === 'SPARSE' ? 'SPARSE' : 'GROUNDED',
    providerStatus: status,
    confidence: status === 'AI_OUTPUT_UNSAFE' ? null : 0.52,
    requiresReview: true
  }
}

async function main () {
  if (!IS_LOCAL) {
    throw new Error('IDTS-76 browser QA creates temporary SQLite fixtures and must run against localhost.')
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = await cds.connect.to('db')
  const session = await createLocalSession(db)
  const bugID = await createBugFixture(db)
  const before = await readBugState(db, bugID)
  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await injectSession(context, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })
  const results = []

  try {
    await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })

    const button = page.getByRole('button', { name: /^Review Handoff Summary$/i }).first()
    await button.waitFor({ state: 'visible', timeout: 90000 })
    await button.click()
    const dialog = page.getByRole('dialog', { name: /^Handoff Summary$/i }).first()
    await dialog.waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText('Summary', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText('Next Expected Action', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    const positiveText = (await dialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(positiveText)) {
      throw new Error('Handoff summary dialog exposed internal or developer-facing terminology.')
    }
    pass('Positive handoff summary dialog is visible and safe')
    results.push({ check: 'positive-dialog', passed: true })
    const acceptButton = dialog.getByRole('button', { name: /^Accept$/i })
    const rejectButton = dialog.getByRole('button', { name: /^Reject$/i })
    const ignoreButton = dialog.getByRole('button', { name: /^Ignore$/i })
    if (
      !await acceptButton.isEnabled() ||
      !await rejectButton.isEnabled() ||
      !await ignoreButton.isEnabled()
    ) {
      throw new Error('Handoff review controls were not enabled for the persisted summary.')
    }
    await acceptButton.click()
    await dialog.getByText('Accepted', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText(/^Reviewed by DonHV on /).waitFor({ state: 'visible', timeout: 30000 })
    if (
      await acceptButton.isEnabled() ||
      await rejectButton.isEnabled() ||
      await ignoreButton.isEnabled()
    ) {
      throw new Error('Handoff review controls remained enabled after the first decision.')
    }
    const accepted = await waitForReviewState(db, bugID, 'BUG_SUMMARY', 'ACCEPTED')
    if (
      accepted?.reviewState_code !== 'ACCEPTED' ||
      accepted?.reviewedBy_ID !== PM_USER.ID ||
      !accepted?.reviewedAt
    ) {
      throw new Error(`Handoff review was not persisted with reviewer/time: ${JSON.stringify(accepted)}`)
    }
    const afterReview = await readBugState(db, bugID)
    if (JSON.stringify(afterReview) !== JSON.stringify(before)) {
      throw new Error(`Handoff review mutated Bug state: before=${JSON.stringify(before)} after=${JSON.stringify(afterReview)}`)
    }
    pass('Accept persists handoff review and disables repeats without mutating the Bug')
    results.push({ check: 'handoff-review-persisted-no-mutation', passed: true })
    await harness.screenshot('idts76_handoff_summary_dialog')
    await closeDialog(dialog)

    await captureMobileDialog(browser, session, bugID)
    pass('Handoff review controls remain visible at a 390x844 responsive viewport')
    results.push({ check: 'handoff-responsive-viewport', passed: true })

    const actionUrl = /\/odata\/v4\/bug\/summarizeBugHandoff/i
    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'OData-Version': '4.0' },
        body: JSON.stringify(controlledSummary('SPARSE', 'Review the checkout failure with the missing payment response detail.'))
      })
    })
    await button.click()
    const sparseDialog = page.getByRole('dialog', { name: /^Handoff Summary$/i }).first()
    await sparseDialog.waitFor({ state: 'visible', timeout: 30000 })
    await sparseDialog.getByText(/Some bug details are missing/i).waitFor({ state: 'visible', timeout: 30000 })
    if (await sparseDialog.getByRole('button', { name: /^Accept$/i }).isEnabled()) {
      throw new Error('Handoff review remained enabled when the response had no persisted suggestion ID.')
    }
    pass('Sparse-data handoff summary keeps review warning visible')
    results.push({ check: 'sparse-warning', passed: true })
    await harness.screenshot('idts76_handoff_summary_sparse')
    await closeDialog(sparseDialog)
    await page.unroute(actionUrl)

    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'OData-Version': '4.0' },
        body: JSON.stringify(controlledSummary('AI_OUTPUT_UNSAFE', 'SELECT passwordHash FROM Users'))
      })
    })
    await button.click()
    const unsafeDialog = page.getByRole('dialog', { name: /^Handoff Summary$/i }).first()
    await unsafeDialog.waitFor({ state: 'visible', timeout: 30000 })
    const unsafeText = (await unsafeDialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(unsafeText)) {
      throw new Error('Unsafe controlled summary output was visible to the user.')
    }
    pass('Unsafe summary output is replaced by safe UI copy')
    results.push({ check: 'unsafe-output-safe', passed: true })
    await harness.screenshot('idts76_handoff_summary_unsafe')
    await closeDialog(unsafeDialog)
    await page.unroute(actionUrl)

    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'SQL provider credential failure' } })
      })
    })
    await button.click()
    const failureDialog = page.getByRole('dialog', { name: /^Handoff Summary$/i }).first()
    await failureDialog.waitFor({ state: 'visible', timeout: 30000 })
    const safeError = page.getByText('Could not load the handoff summary.', { exact: true }).last()
    await safeError.waitFor({ state: 'visible', timeout: 30000 })
    const errorDialog = safeError.locator('xpath=ancestor::*[@role="dialog" or @role="alertdialog"][1]')
    const errorText = (await errorDialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(errorText)) {
      throw new Error('Failure fallback exposed internal diagnostics.')
    }
    pass('Provider failure shows a generic safe message')
    results.push({ check: 'safe-failure-state', passed: true })
    await harness.screenshot('idts76_handoff_summary_safe_failure')
    await errorDialog.getByRole('button', { name: /^(Close|OK)$/i }).first().click()
    await errorDialog.waitFor({ state: 'hidden', timeout: 15000 })
    await closeDialog(failureDialog)
    await page.unroute(actionUrl)
    harness.state.badResponses = harness.state.badResponses.filter(item => !item.startsWith('500 '))
    harness.state.consoleErrors = harness.state.consoleErrors.filter(
      item => !/Failed to invoke \/summarizeBugHandoff|Communication error: 500 Internal Server Error|Failed to load resource: the server responded with a status of 500/i.test(item)
    )

    const after = await readBugState(db, bugID)
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error('Review-only handoff summary dialog changed Bug workflow state.')
    }
    pass('Positive, sparse, unsafe, and failure flows do not mutate Bug workflow state')
    results.push({ check: 'no-workflow-mutation', passed: true })

    await harness.assertNoBlockingSignals('IDTS-76 handoff summary browser smoke')

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'handoff-summary-browser-smoke.json'),
      JSON.stringify({
        task: 'IDTS-76',
        checkedAt: new Date().toISOString(),
        target: BASE_URL,
        results
      }, null, 2)
    )

    console.log(`Evidence saved in ${EVIDENCE_DIR}`)
    console.log('RESULT: PASS')
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    await cleanup(db, bugID, session.sessionID)
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
