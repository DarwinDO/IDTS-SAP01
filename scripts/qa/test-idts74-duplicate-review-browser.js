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
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-74')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)
const INTERNAL_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
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
    userAgent: 'IDTS-74 browser QA'
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

async function createBugPair (db) {
  const marker = Date.now()
  const sourceID = randomUUID()
  const targetID = randomUUID()
  const shared = {
    description: 'Payment approval button stays disabled after invoice submission in QA.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'IDTS-74 browser QA',
    stepsToReproduce: 'Submit an invoice and inspect the approval button.',
    actualResult: 'Approval button remains disabled.',
    expectedResult: 'Approval button becomes available.',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY,
    componentCategory_ID: COMPONENT_CATEGORY,
    reporter_ID: PM_USER.ID,
    nextProcessorUser_ID: PM_USER.ID,
    nextProcessorRole_code: 'PM'
  }

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    Object.assign({}, shared, {
      ID: sourceID,
      bugNumber: `QA-IDTS74-SRC-${marker}`,
      title: `IDTS-74 duplicate review source ${marker}`
    }),
    Object.assign({}, shared, {
      ID: targetID,
      bugNumber: `QA-IDTS74-DUP-${marker}`,
      title: `IDTS-74 duplicate review source ${marker} duplicate`
    })
  ]))

  return { sourceID, targetID, targetNumber: `QA-IDTS74-DUP-${marker}` }
}

async function cleanup (db, ids, sessionID) {
  for (const ID of ids) {
    await db.run(DELETE.from('idts.cap.AiSuggestions').where({ bug_ID: ID })).catch(() => {})
    await db.run(DELETE.from('idts.cap.Bugs').where({ ID })).catch(() => {})
  }
  if (sessionID) {
    await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
  }
}

async function readReviewState (db, sourceID) {
  const bug = await db.run(
    SELECT.one.from('idts.cap.Bugs')
      .columns('status_code', 'assignee_ID')
      .where({ ID: sourceID })
  )
  const links = await db.run(
    SELECT.from('idts.cap.DuplicateLinks')
      .columns('ID')
      .where({ sourceBug_ID: sourceID })
  )

  return {
    statusCode: bug && bug.status_code,
    assigneeID: bug && bug.assignee_ID,
    duplicateLinkCount: links.length
  }
}

async function closeDialog (dialog) {
  await dialog.getByRole('button', { name: /^Close$/i }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 15000 })
}

async function main () {
  if (!IS_LOCAL) {
    throw new Error('IDTS-74 browser QA creates temporary SQLite fixtures and must run against localhost.')
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = await cds.connect.to('db')
  const session = await createLocalSession(db)
  const pair = await createBugPair(db)
  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await injectSession(context, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })
  const results = []

  try {
    const before = await readReviewState(db, pair.sourceID)
    await page.goto(`${APP_URL}#/Bugs(ID=${pair.sourceID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })

    const button = page.getByRole('button', { name: /^Find Similar Bugs$/i }).first()
    await button.waitFor({ state: 'visible', timeout: 90000 })
    pass('Find Similar Bugs is visible on the product Object Page')
    results.push({ check: 'entry-point-visible', passed: true })

    await button.click()
    const dialog = page.getByRole('dialog', { name: /^Similar Bugs$/i }).first()
    await dialog.waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText(pair.targetNumber, { exact: false }).waitFor({ state: 'visible', timeout: 30000 })

    const dialogText = (await dialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(dialogText)) {
      throw new Error('Duplicate review dialog exposed internal or developer-facing terminology.')
    }
    if (!/Review this suggestion and choose manually/i.test(dialogText)) {
      throw new Error('Duplicate review dialog did not keep the human review decision visible.')
    }

    pass('Similar bug candidate is visible in the dialog')
    pass('Dialog copy stays user-facing and review-only')
    results.push({ check: 'candidate-visible', passed: true })
    results.push({ check: 'safe-review-copy', passed: true })

    await harness.screenshot('idts74_duplicate_review_dialog')
    await closeDialog(dialog)

    const actionUrl = /\/odata\/v4\/bug\/suggestSimilarBugs/i
    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'OData-Version': '4.0' },
        body: JSON.stringify({
          '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#Collection(BugService.SimilarBugCandidate)`,
          value: []
        })
      })
    })
    await button.click()
    const emptyDialog = page.getByRole('dialog', { name: /^Similar Bugs$/i }).first()
    await emptyDialog.waitFor({ state: 'visible', timeout: 30000 })
    await emptyDialog
      .getByText('No similar bugs were found for this bug.', { exact: true })
      .waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(300)
    await emptyDialog.locator('.sapUiLocalBusyIndicator').waitFor({
      state: 'hidden',
      timeout: 30000
    })
    await harness.screenshot('idts74_duplicate_review_empty_state')
    pass('No-result response shows a readable empty state')
    results.push({ check: 'no-result-state', passed: true })
    await closeDialog(emptyDialog)
    await page.unroute(actionUrl)

    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'SQL token provider credential failure' } })
      })
    })
    await button.click()
    const failureDialog = page.getByRole('dialog', { name: /^Similar Bugs$/i }).first()
    await failureDialog.waitFor({ state: 'visible', timeout: 30000 })
    const safeError = page.getByText('Could not load similar bugs.', { exact: true }).last()
    await safeError.waitFor({ state: 'visible', timeout: 30000 })
    const errorDialog = safeError.locator(
      'xpath=ancestor::*[@role="dialog" or @role="alertdialog"][1]'
    )
    const errorText = (await errorDialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(errorText)) {
      throw new Error('Failure fallback exposed internal provider diagnostics.')
    }
    await harness.screenshot('idts74_duplicate_review_safe_failure')
    pass('Controlled failure shows a generic safe message')
    results.push({ check: 'safe-failure-state', passed: true })
    await errorDialog.getByRole('button', { name: /^(Close|OK)$/i }).first().click()
    await errorDialog.waitFor({ state: 'hidden', timeout: 15000 })
    await closeDialog(failureDialog)
    await page.unroute(actionUrl)
    harness.state.badResponses = harness.state.badResponses.filter(item => !item.startsWith('500 '))
    harness.state.consoleErrors = harness.state.consoleErrors.filter(
      item => !/Failed to invoke \/suggestSimilarBugs|Communication error: 500 Internal Server Error|Failed to load resource: the server responded with a status of 500/i.test(item)
    )

    const after = await readReviewState(db, pair.sourceID)
    if (
      before.statusCode !== after.statusCode ||
      before.assigneeID !== after.assigneeID ||
      before.duplicateLinkCount !== after.duplicateLinkCount
    ) {
      throw new Error('Review-only dialog changed workflow, assignment, or duplicate links.')
    }
    pass('Review, empty, and failure flows do not mutate workflow or duplicate links')
    results.push({ check: 'no-workflow-mutation', passed: true })

    await harness.assertNoBlockingSignals('IDTS-74 duplicate review browser smoke')

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'duplicate-review-browser-smoke.json'),
      JSON.stringify({
        task: 'IDTS-74',
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
    await cleanup(db, [pair.sourceID, pair.targetID], session.sessionID)
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
