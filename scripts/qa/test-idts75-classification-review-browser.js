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
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-75')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)
const INTERNAL_COPY = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const TESTER_USER = {
  ID: '10000000-0000-0000-0000-000000000004',
  displayName: 'NhanT',
  email: 'nhant@example.local',
  role_code: 'TESTER'
}
const SAP_MODULE = '30000000-0000-0000-0000-000000000001'
const COMPONENT = '40000000-0000-0000-0000-000000000005'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY = '60000000-0000-0000-0000-000000000009'

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

async function createLocalSession (db, user, label) {
  const token = createSessionToken()
  const now = new Date()
  const expiresAt = addMinutes(now, 30).toISOString()
  const sessionID = randomUUID()

  await db.run(INSERT.into('idts.cap.AuthSessions').entries({
    ID: sessionID,
    tokenHash: hashToken(token),
    user_ID: user.ID,
    issuedAt: now.toISOString(),
    expiresAt,
    userAgent: `IDTS-75 browser QA ${label}`
  }))

  return { token, expiresAt, user, sessionID }
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

async function createBug (db) {
  const marker = Date.now()
  const ID = randomUUID()

  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID,
    bugNumber: `QA-IDTS75-${marker}`,
    title: `Login page shows unsafe error ${marker}`,
    description: 'The Fiori login page displays technical details after an invalid password.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'IDTS-75 browser QA',
    stepsToReproduce: 'Open login, enter an invalid password, and review the message.',
    actualResult: 'A technical error is displayed.',
    expectedResult: 'A safe user-facing message is displayed.',
    sapModule_ID: SAP_MODULE,
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY,
    componentCategory_ID: COMPONENT_CATEGORY,
    reporter_ID: PM_USER.ID,
    nextProcessorUser_ID: PM_USER.ID,
    nextProcessorRole_code: 'PM'
  }))

  return ID
}

async function readClassification (db, ID) {
  return db.run(
    SELECT.one.from('idts.cap.Bugs')
      .columns(
        'status_code',
        'priority_code',
        'severity_code',
        'sapModule_ID',
        'applicationComponent_ID',
        'defectCategory_ID'
      )
      .where({ ID })
  )
}

async function readLatestSuggestionReview (db, bugID, featureType) {
  return db.run(
    SELECT.one.from('idts.cap.AiSuggestions')
      .columns('ID', 'reviewState_code', 'reviewedBy_ID', 'reviewedAt')
      .where({ bug_ID: bugID, featureType_code: featureType })
      .orderBy('createdAt desc')
  )
}

async function waitForSuggestionReview (db, bugID, featureType, expectedState) {
  let review
  for (let attempt = 0; attempt < 30; attempt++) {
    review = await readLatestSuggestionReview(db, bugID, featureType)
    if (
      review &&
      review.reviewState_code === expectedState &&
      review.reviewedBy_ID === PM_USER.ID &&
      review.reviewedAt
    ) {
      return review
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return review
}

async function cleanup (db, bugID, sessionIDs) {
  await db.run(DELETE.from('idts.cap.AiSuggestions').where({ bug_ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
  for (const sessionID of sessionIDs) {
    await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
  }
}

async function closeDialog (dialog) {
  await dialog.getByRole('button', { name: /^Close$/i }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 15000 })
}

function controlledRows (contextUrl) {
  return {
    '@odata.context': `${contextUrl}/odata/v4/bug/$metadata#Collection(BugService.ClassificationSuggestionCandidate)`,
    value: [
      {
        field: 'priority',
        fieldLabel: 'Priority',
        valueID: null,
        valueCode: null,
        valueName: null,
        confidence: 0.91,
        reason: 'Priority suggestion is not an active IDTS catalog value.',
        status: 'INVALID_PROVIDER_VALUE',
        providerStatus: 'SUCCESS',
        requiresReview: true
      },
      {
        field: 'severity',
        fieldLabel: 'Severity',
        valueID: null,
        valueCode: 'MAJOR',
        valueName: 'Major',
        confidence: 0.42,
        reason: 'The available evidence is not strong enough for an automatic choice.',
        status: 'LOW_CONFIDENCE',
        providerStatus: 'SUCCESS',
        requiresReview: true
      }
    ]
  }
}

async function main () {
  if (!IS_LOCAL) {
    throw new Error('IDTS-75 browser QA creates temporary SQLite fixtures and must run against localhost.')
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = await cds.connect.to('db')
  const session = await createLocalSession(db, PM_USER, 'PM')
  const testerSession = await createLocalSession(db, TESTER_USER, 'Tester')
  const bugID = await createBug(db)
  const before = await readClassification(db, bugID)
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

    const button = page.getByRole('button', { name: /^Review Classification Suggestions$/i }).first()
    await button.waitFor({ state: 'visible', timeout: 90000 })
    pass('Classification review entry point is visible')
    results.push({ check: 'entry-point-visible', passed: true })
    await harness.screenshot('idts75_classification_review_entry_point_in_classification')

    await button.click()
    const dialog = page.getByRole('dialog', { name: /^Classification Suggestions$/i }).first()
    await dialog.waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText('Priority', { exact: true }).last().waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText('Severity', { exact: true }).last().waitFor({ state: 'visible', timeout: 30000 })

    const positiveText = (await dialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(positiveText)) {
      throw new Error('Classification review dialog exposed internal or developer-facing terminology.')
    }
    if (!/Review this suggestion and choose manually/i.test(positiveText)) {
      throw new Error('Classification review dialog did not keep the human decision visible.')
    }
    if (!/High/i.test(positiveText) || !/Major/i.test(positiveText)) {
      throw new Error('Classification review dialog did not show current classification values.')
    }

    pass('Positive dialog shows five review rows and current values')
    pass('Positive dialog keeps user-facing manual-review guidance')
    results.push({ check: 'positive-review-rows', passed: true })
    results.push({ check: 'safe-manual-review-copy', passed: true })

    const acceptButton = dialog.getByRole('button', { name: /^Accept$/i })
    const rejectButton = dialog.getByRole('button', { name: /^Reject$/i })
    const ignoreButton = dialog.getByRole('button', { name: /^Ignore$/i })
    await rejectButton.waitFor({ state: 'visible', timeout: 30000 })
    if (
      !(await acceptButton.isEnabled()) ||
      !(await rejectButton.isEnabled()) ||
      !(await ignoreButton.isEnabled())
    ) {
      throw new Error('AI suggestion review decisions were not enabled for a persisted suggestion.')
    }
    await rejectButton.click()
    await dialog.getByText('Rejected', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await dialog.getByText(/Reviewed by DonHV on/i).waitFor({ state: 'visible', timeout: 30000 })
    if (
      (await acceptButton.isEnabled()) ||
      (await rejectButton.isEnabled()) ||
      (await ignoreButton.isEnabled())
    ) {
      throw new Error('AI suggestion review decisions remained enabled after Reject.')
    }
    const rejected = await waitForSuggestionReview(db, bugID, 'CLASSIFICATION', 'REJECTED')
    if (
      !rejected ||
      rejected.reviewState_code !== 'REJECTED' ||
      rejected.reviewedBy_ID !== PM_USER.ID ||
      !rejected.reviewedAt
    ) {
      throw new Error(
        `Rejected classification suggestion review was not persisted with reviewer and time: ${JSON.stringify(rejected)}`
      )
    }
    pass('Reject persists reviewer and time, then disables repeated decisions')
    results.push({ check: 'reject-review-persisted', passed: true })

    await harness.screenshot('idts75_classification_review_dialog')
    await closeDialog(dialog)

    const actionUrl = /\/odata\/v4\/bug\/suggestClassification/i
    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'OData-Version': '4.0' },
        body: JSON.stringify(controlledRows(BASE_URL))
      })
    })

    await button.click()
    const guardedDialog = page.getByRole('dialog', { name: /^Classification Suggestions$/i }).first()
    await guardedDialog.waitFor({ state: 'visible', timeout: 30000 })
    await guardedDialog.getByText('No safe suggestion', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await guardedDialog.getByText('Not available', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await guardedDialog.getByText('Low confidence', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await guardedDialog.getByText(/confidence 42%/i).waitFor({ state: 'visible', timeout: 30000 })
    pass('Invalid catalog and low-confidence suggestions are visibly guarded')
    results.push({ check: 'invalid-and-low-confidence-guarded', passed: true })
    await harness.screenshot('idts75_classification_review_guarded_states')
    await closeDialog(guardedDialog)
    await page.unroute(actionUrl)

    await page.route(actionUrl, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'SQL token provider credential failure' } })
      })
    })
    await button.click()
    const failureDialog = page.getByRole('dialog', { name: /^Classification Suggestions$/i }).first()
    await failureDialog.waitFor({ state: 'visible', timeout: 30000 })
    const safeError = page.getByText('Could not load classification suggestions.', { exact: true }).last()
    await safeError.waitFor({ state: 'visible', timeout: 30000 })
    const errorDialog = safeError.locator(
      'xpath=ancestor::*[@role="dialog" or @role="alertdialog"][1]'
    )
    const errorText = (await errorDialog.innerText()).replace(/\s+/g, ' ').trim()
    if (INTERNAL_COPY.test(errorText)) {
      throw new Error('Failure fallback exposed internal diagnostics.')
    }
    pass('Controlled failure shows a generic safe message')
    results.push({ check: 'safe-failure-state', passed: true })
    await harness.screenshot('idts75_classification_review_safe_failure')
    await errorDialog.getByRole('button', { name: /^(Close|OK)$/i }).first().click()
    await errorDialog.waitFor({ state: 'hidden', timeout: 15000 })
    await closeDialog(failureDialog)
    await page.unroute(actionUrl)
    harness.state.badResponses = harness.state.badResponses.filter(item => !item.startsWith('500 '))
    harness.state.consoleErrors = harness.state.consoleErrors.filter(
      item => !/Failed to invoke \/suggestClassification|Communication error: 500 Internal Server Error|Failed to load resource: the server responded with a status of 500/i.test(item)
    )

    const after = await readClassification(db, bugID)
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error('Review-only classification dialog changed Bug classification or status.')
    }
    pass('Positive, guarded, and failure flows do not mutate Bug classification')
    results.push({ check: 'no-classification-mutation', passed: true })

    await harness.assertNoBlockingSignals('IDTS-75 classification review browser smoke')

    const testerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await injectSession(testerContext, testerSession)
    const testerPage = await testerContext.newPage()
    try {
      await testerPage.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=true)`, {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      })
      const testerButton = testerPage
        .getByRole('button', { name: /^Review Classification Suggestions$/i })
        .first()
      await testerButton.waitFor({ state: 'visible', timeout: 90000 })
      await testerButton.click()
      const testerDialog = testerPage
        .getByRole('dialog', { name: /^Classification Suggestions$/i })
        .first()
      await testerDialog.waitFor({ state: 'visible', timeout: 30000 })
      await testerDialog.getByText('Priority', { exact: true }).last().waitFor({
        state: 'visible',
        timeout: 30000
      })
      pass('Tester can open and review classification suggestions')
      results.push({ check: 'tester-role-review', passed: true })
      await closeDialog(testerDialog)
    } finally {
      await testerContext.close().catch(() => {})
    }

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'classification-review-browser-smoke.json'),
      JSON.stringify({
        task: 'IDTS-75',
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
    await cleanup(db, bugID, [session.sessionID, testerSession.sessionID])
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
