#!/usr/bin/env node
'use strict'

/**
 * IDTS-127 UAT-UX-002 deterministic tablet responsive browser check.
 *
 * Requires a running local CAP/Fiori server. AI action responses are routed to
 * controlled local payloads so the check does not call a provider or shared QA.
 */

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { chromium } = require('playwright')
const cds = require('@sap/cds')

const { DELETE, INSERT } = cds.ql
const { createSessionToken, hashToken, addMinutes } = require('../../srv/auth/passwords')
const { createHarness } = require('./lib/browser-harness')

const BASE_URL = String(process.env.IDTS_QA_BASE_URL || 'http://localhost:4004').replace(/\/+$/, '')
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)
const VIEWPORT = { width: 834, height: 1112 }

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY = '60000000-0000-0000-0000-000000000001'
const PROFILE_ONE = '20000000-0000-0000-0000-000000000001'
const PROFILE_TWO = '20000000-0000-0000-0000-000000000002'
const SUGGESTION_SIMILAR = '70000000-0000-0000-0000-000000000001'
const SUGGESTION_CLASSIFICATION = '70000000-0000-0000-0000-000000000002'
const SUGGESTION_ASSIGNMENT = '70000000-0000-0000-0000-000000000003'

const SIMILAR_REASON = [
  'This candidate matches the payment approval symptom, reproduction path, and QA environment. ',
  'Review the shared invoice-submit timing and the different approval state before deciding whether the records describe one defect. ',
  'The displayed evidence is a review aid only and does not confirm a duplicate link.'
].join('')
const CLASSIFICATION_REASON = [
  'The suggested catalog value matches the payment approval wording and the supplied reproduction details. ',
  'Compare the current Bug context with this proposal manually because the suggestion is advisory and must not change classification automatically. ',
  'The reason remains intentionally long so tablet wrapping is exercised.'
].join('')
const ASSIGNMENT_EXPLANATION_ONE = [
  'This developer has the configured component and category responsibility, is available, and has room under the current workload limit. ',
  'The explanation is a review aid based on the supplied capability and capacity facts; choose the assignee explicitly after checking the Bug details. '
].join('')
const ASSIGNMENT_EXPLANATION_TWO = [
  'This developer matches the configured component and category responsibility and can review the same payment flow. ',
  'The current capacity state is busy, so review the workload warning and any competing work before making a manual assignment decision. '
].join('')
const ASSIGNMENT_WARNING_TWO = [
  'This developer is marked Busy. Assignment is allowed, but capacity should be checked against current work and due dates before confirmation. ',
  'Review the open Bug count, priority, and planned completion dates together so the manual decision remains explicit and does not silently overcommit the developer.'
].join('')
const HANDOFF_SUMMARY = [
  'The Bug remains in Pending Assignment after the payment approval failure was reproduced in the QA environment. ',
  'The next reviewer should compare the shared submit sequence, confirm the relevant classification, and choose a suitable developer after reviewing the verified records. ',
  'This summary is advisory and does not change ownership or workflow state.'
].join('')
const HANDOFF_MISSING = [
  'The exact authorization response from the payment service, the browser timestamp of the unsuccessful submit, and confirmation of whether the approval state changed after a retry are still missing. ',
  'Add those details before treating the handoff as complete.'
].join('')
const HANDOFF_COMMENT_SUMMARY = [
  'Stored comments confirm that the tester reproduced the failure after entering valid payment details and that the approval control stayed unavailable. ',
  'No additional comment establishes the external authorization response or proves that a duplicate record should be linked.'
].join('')
const HANDOFF_COMMENTS = [
  '[2026-09-12T08:00:00.000Z] NhanT (Tester) — Commented: Tester reproduced the payment approval failure after entering valid details and requested a review of the response. ',
  '[2026-09-12T08:05:00.000Z] DonHV (PM) — Commented: PM requested the exact authorization response and a confirmation of the retry result before assignment.'
].join('\n')
const HANDOFF_EVENTS = [
  '[2026-09-12T08:10:00.000Z] DonHV (PM) — Requested information: The authorization response and retry observation are still required before the next handoff. ',
  '[2026-09-12T08:15:00.000Z] NhanT (Tester) — Updated Bug: Reproduction details were reviewed; workflow remains Pending Assignment while the missing evidence is collected.'
].join('\n')

assert(SIMILAR_REASON.length > 220, 'controlled Similar Bugs reason must exceed 220 characters')
assert(CLASSIFICATION_REASON.length > 180, 'controlled Classification reason must exceed 180 characters')
assert(ASSIGNMENT_EXPLANATION_ONE.length > 220, 'controlled Smart Assignment explanation must be long')
assert(ASSIGNMENT_EXPLANATION_TWO.length > 220, 'controlled Smart Assignment warning explanation must be long')
assert(ASSIGNMENT_WARNING_TWO.length > 180, 'controlled Smart Assignment warning must be long')
assert(HANDOFF_SUMMARY.length > 300, 'controlled Handoff summary must be long')
assert(HANDOFF_MISSING.length > 220, 'controlled Handoff missing-information text must be long')
assert(HANDOFF_COMMENTS.length > 220 && HANDOFF_EVENTS.length > 220, 'controlled Handoff timeline text must be long')

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
    userAgent: 'IDTS-127 UAT-UX-002 browser QA'
  }))

  return { token, expiresAt, user: PM_USER, sessionID }
}

async function injectSession (context, session) {
  await context.addInitScript(({ token, user, expiresAt }) => {
    sessionStorage.setItem('idts_auth_token', token)
    sessionStorage.setItem('idts_auth_user', JSON.stringify(user))
    sessionStorage.setItem('idts_auth_expires', expiresAt)
  }, session)
}

async function createBugFixture (db) {
  const ID = randomUUID()
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID,
    bugNumber: `QA-IDTS127-${Date.now()}`,
    title: 'Payment approval remains unavailable after valid submission',
    description: 'The payment approval control remains unavailable after a valid invoice submission in QA.',
    status_code: 'PENDING_ASSIGNMENT',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'IDTS-127 deterministic responsive browser QA',
    stepsToReproduce: 'Submit valid payment details and inspect the approval control.',
    actualResult: 'The approval control remains unavailable after the submit step.',
    expectedResult: 'The approval control should become available or show a clear user-facing result.',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY,
    componentCategory_ID: COMPONENT_CATEGORY,
    reporter_ID: PM_USER.ID,
    nextProcessorUser_ID: PM_USER.ID,
    nextProcessorRole_code: 'PM'
  }))
  return ID
}

async function cleanup (db, bugID, sessionID) {
  if (bugID) {
    await db.run(DELETE.from('idts.cap.AiSuggestions').where({ bug_ID: bugID })).catch(() => {})
    await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
  }
  if (sessionID) {
    await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
  }
}

function json (body) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: { 'OData-Version': '4.0' },
    body: JSON.stringify(body)
  }
}

function controlledSimilar (bugID) {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#Collection(BugService.SimilarBugCandidate)`,
    value: [
      {
        suggestionID: SUGGESTION_SIMILAR,
        rank: 1,
        bugID: '90000000-0000-0000-0000-000000000001',
        bugNumber: 'BUG-CONTROL-001',
        title: 'Payment approval remains unavailable after invoice submit',
        statusCode: 'IN_PROGRESS',
        statusName: 'In Progress',
        score: 0.86,
        suggestedRelationTypeCode: 'SIMILAR',
        reason: SIMILAR_REASON,
        providerStatus: 'SUCCESS',
        embeddingUsed: false
      },
      {
        suggestionID: SUGGESTION_SIMILAR,
        rank: 2,
        bugID: '90000000-0000-0000-0000-000000000002',
        bugNumber: 'BUG-CONTROL-002',
        title: 'Approval state is unchanged after payment retry',
        statusCode: 'NEED_MORE_INFORMATION',
        statusName: 'Need More Information',
        score: 0.68,
        suggestedRelationTypeCode: 'SIMILAR',
        reason: SIMILAR_REASON,
        providerStatus: 'SUCCESS',
        embeddingUsed: false
      }
    ]
  }
}

function controlledClassification () {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#Collection(BugService.ClassificationSuggestionCandidate)`,
    value: [
      {
        suggestionID: SUGGESTION_CLASSIFICATION,
        field: 'priority',
        fieldLabel: 'Priority',
        valueID: '80000000-0000-0000-0000-000000000001',
        valueCode: 'HIGH',
        valueName: 'High',
        confidence: 0.88,
        reason: CLASSIFICATION_REASON,
        status: 'SUGGESTED',
        suggestionSource: 'AI',
        providerStatus: 'SUCCESS',
        requiresReview: true
      },
      {
        suggestionID: SUGGESTION_CLASSIFICATION,
        field: 'severity',
        fieldLabel: 'Severity',
        valueID: '80000000-0000-0000-0000-000000000002',
        valueCode: 'MAJOR',
        valueName: 'Major',
        confidence: 0.74,
        reason: CLASSIFICATION_REASON,
        status: 'SUGGESTED',
        suggestionSource: 'AI',
        providerStatus: 'SUCCESS',
        requiresReview: true
      }
    ]
  }
}

function controlledAssignable () {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#Collection(BugService.AssignableDeveloper)`,
    value: [
      {
        ID: PROFILE_ONE,
        developerProfileID: PROFILE_ONE,
        developerName: 'SangVN',
        developerEmail: 'sangvn@example.local',
        availabilityStatusName: 'Available',
        availabilityCriticality: 3,
        applicationComponentName: 'Finance',
        defectCategoryName: 'Payment',
        sapModuleName: 'SAP FI',
        responsibilityLevelName: 'Primary',
        active: true
      },
      {
        ID: PROFILE_TWO,
        developerProfileID: PROFILE_TWO,
        developerName: 'DatDT',
        developerEmail: 'datdt@example.local',
        availabilityStatusName: 'Busy',
        availabilityCriticality: 2,
        applicationComponentName: 'Finance',
        defectCategoryName: 'Payment',
        sapModuleName: 'SAP FI',
        responsibilityLevelName: 'Backup',
        active: true
      }
    ]
  }
}

function controlledAssignment () {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#Collection(BugService.SmartAssignmentExplanationCandidate)`,
    value: [
      {
        suggestionID: SUGGESTION_ASSIGNMENT,
        developerProfileID: PROFILE_ONE,
        developerName: 'SangVN',
        explanation: ASSIGNMENT_EXPLANATION_ONE,
        warnings: '',
        confidence: 0.82,
        status: 'EXPLAINED',
        explanationSource: 'AI',
        providerStatus: 'SUCCESS',
        groundingStatus: 'GROUNDED',
        workloadOpenCount: 1,
        workloadLimit: 5,
        isOverloaded: false,
        requiresReview: true
      },
      {
        suggestionID: SUGGESTION_ASSIGNMENT,
        developerProfileID: PROFILE_TWO,
        developerName: 'DatDT',
        explanation: ASSIGNMENT_EXPLANATION_TWO,
        warnings: ASSIGNMENT_WARNING_TWO,
        confidence: 0.61,
        status: 'REVIEW_RECOMMENDED',
        explanationSource: 'AI',
        providerStatus: 'SUCCESS',
        groundingStatus: 'PARTIAL_DATA',
        workloadOpenCount: 4,
        workloadLimit: 5,
        isOverloaded: false,
        requiresReview: true
      }
    ]
  }
}

function controlledHandoff (bugID) {
  return {
    '@odata.context': `${BASE_URL}/odata/v4/bug/$metadata#BugService.BugHandoffSummaryResult`,
    suggestionID: SUGGESTION_ASSIGNMENT,
    bugID,
    bugNumber: 'QA-IDTS127-CONTROLLED',
    generatedAt: '2026-09-12T08:20:00.000Z',
    label: 'Handoff summary for review',
    summary: HANDOFF_SUMMARY,
    currentStatus: 'Pending Assignment',
    currentActionOwner: 'DonHV',
    missingInformation: HANDOFF_MISSING,
    commentSummary: HANDOFF_COMMENT_SUMMARY,
    verifiedComments: HANDOFF_COMMENTS,
    latestImportantEvents: HANDOFF_EVENTS,
    nextExpectedAction: 'Tester should add the missing authorization response and retry observation, then the PM should review the assignment queue.',
    groundingStatus: 'GROUNDED',
    providerStatus: 'SUCCESS',
    confidence: 0.79,
    requiresReview: true
  }
}

async function installControlledResponses (page, bugID) {
  await page.route(/\/odata\/v4\/bug\/AssignableDevelopers/i, route => route.fulfill(json(controlledAssignable())))
  await page.route(/\/odata\/v4\/bug\/suggestSimilarBugs/i, route => route.fulfill(json(controlledSimilar(bugID))))
  await page.route(/\/odata\/v4\/bug\/suggestClassification/i, route => route.fulfill(json(controlledClassification())))
  await page.route(/\/odata\/v4\/bug\/explainSmartAssignment/i, route => route.fulfill(json(controlledAssignment())))
  await page.route(/\/odata\/v4\/bug\/summarizeBugHandoff/i, route => route.fulfill(json(controlledHandoff(bugID))))
}

async function closeDialog (dialog, buttonName = /^Close$/i) {
  const button = dialog.getByRole('button', { name: buttonName }).last()
  await button.click()
  await dialog.waitFor({ state: 'hidden', timeout: 15000 })
}

async function readDocumentGeometry (page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0)
    return { viewportWidth, documentWidth, overflow: documentWidth - viewportWidth }
  })
}

async function readTextGeometry (root, selectors, minimumLength) {
  return root.evaluate((element, { selectors: selectorList, minimumLength: min }) => {
    const nodes = [...new Set(selectorList.flatMap(selector => [...element.querySelectorAll(selector)]))]
    return nodes.map(node => {
      const style = window.getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim()
      return {
        textLength: text.length,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        whiteSpace: style.whiteSpace,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
      }
    }).filter(item => item.visible && item.textLength >= min)
  }, { selectors, minimumLength })
}

async function readButtonGeometry (page, locator, label, requireEnabled) {
  const issues = []
  const count = await locator.count()
  if (!count) return [`${label}: button is missing`]
  const viewportWidth = page.viewportSize()?.width || VIEWPORT.width

  for (let index = 0; index < count; index += 1) {
    const button = locator.nth(index)
    if (!await button.isVisible().catch(() => false)) {
      issues.push(`${label}[${index}]: button is not visible`)
      continue
    }
    await button.scrollIntoViewIfNeeded().catch(() => {})
    const box = await button.boundingBox()
    if (!box || box.width <= 0 || box.height <= 0) {
      issues.push(`${label}[${index}]: button has no reachable box`)
      continue
    }
    if (box.left < -1 || box.right > viewportWidth + 1) {
      issues.push(`${label}[${index}]: button bounds ${Math.round(box.left)}..${Math.round(box.right)} exceed ${viewportWidth}`)
    }
    const reachable = await button.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return target === element || element.contains(target)
    }).catch(() => false)
    if (!reachable) issues.push(`${label}[${index}]: button center is obscured or unreachable`)
    if (requireEnabled && !await button.isEnabled().catch(() => false)) {
      issues.push(`${label}[${index}]: primary button is disabled`)
    }
  }
  return issues
}

async function assertResponsiveLayout (page, options) {
  const issues = []
  const documentGeometry = await readDocumentGeometry(page)
  if (documentGeometry.overflow > 1) {
    issues.push(`${options.label}: document overflow ${documentGeometry.documentWidth - documentGeometry.viewportWidth}px`)
  }

  for (const button of options.buttons || []) {
    issues.push(...await readButtonGeometry(page, button.locator, button.label, button.requireEnabled === true))
  }

  if (options.text) {
    const matches = await readTextGeometry(options.text.root, options.text.selectors, options.text.minimumLength || 80)
    if (matches.length < (options.text.minimumMatches || 1)) {
      issues.push(`${options.text.label}: fewer than ${options.text.minimumMatches || 1} long text containers were rendered`)
    }
    for (const [index, match] of matches.entries()) {
      if (match.scrollWidth > match.clientWidth + 1) {
        issues.push(`${options.text.label}[${index}]: scrollWidth ${match.scrollWidth} exceeds clientWidth ${match.clientWidth}`)
      }
      if (match.whiteSpace === 'nowrap') {
        issues.push(`${options.text.label}[${index}]: computed whiteSpace is nowrap`)
      }
    }
  }

  if (issues.length) throw new Error(issues.join('; '))
}

async function runNegativeControl (page) {
  const controlID = 'idts127-ux002-negative-control'
  await page.evaluate(id => {
    const host = document.createElement('div')
    host.id = id
    host.style.cssText = 'position:absolute;left:0;top:0;width:calc(100vw + 24px);height:40px;pointer-events:none;'
    const text = document.createElement('span')
    text.dataset.idtsLongText = 'true'
    text.style.cssText = 'display:block;width:calc(100vw + 24px);white-space:nowrap;'
    text.textContent = 'This synthetic negative control intentionally overflows the viewport and forbids wrapping so the geometry assertion must fail.'
    host.append(text)
    document.body.append(host)
  }, controlID)

  let failure
  try {
    await assertResponsiveLayout(page, {
      label: 'negative control',
      text: {
        root: page.locator(`#${controlID}`),
        selectors: ['[data-idts-long-text]'],
        minimumLength: 40,
        minimumMatches: 1,
        label: 'negative control text'
      }
    })
  } catch (error) {
    failure = error
  } finally {
    await page.evaluate(id => document.getElementById(id)?.remove(), controlID)
  }

  if (!failure) throw new Error('negative control unexpectedly passed nowrap/overflow geometry checks')
  assert.match(failure.message, /document overflow/)
  assert.match(failure.message, /whiteSpace is nowrap/)
  pass('negative control fails as expected for document overflow and nowrap text')
}

async function waitForDialog (page, title) {
  const dialog = page.getByRole('dialog', { name: title }).first()
  await dialog.waitFor({ state: 'visible', timeout: 30000 })
  return dialog
}

async function waitForPageReady (page) {
  await page.locator('.sapUiPlaceholder').first().waitFor({ state: 'hidden', timeout: 90000 })
}

function discardKnownUi5Warning (harness) {
  const knownWarning = /\[FUTURE FATAL\] sap\.fe\.templates\.ListReport\.ListReportController: The registered Event Listener 'onAfterRendering' must not have a return value\./i
  harness.state.consoleErrors = harness.state.consoleErrors.filter(message => !knownWarning.test(message))
}

async function main () {
  if (!IS_LOCAL) throw new Error('IDTS-127 UAT-UX-002 browser QA requires localhost and temporary SQLite fixtures.')

  const db = await cds.connect.to('db')
  let evidenceDir
  let bugID
  let session
  let browser
  let context

  try {
    evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idts127-ux002-responsive-'))
    session = await createLocalSession(db)
    bugID = await createBugFixture(db)
    browser = await launchBrowser()
    context = await browser.newContext({ viewport: VIEWPORT })
    await injectSession(context, session)
    const page = await context.newPage()
    const harness = await createHarness(page, { evidenceDir, settleMs: 1000 })
    await runNegativeControl(page)
    await installControlledResponses(page, bugID)

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 90000 })
    const goButton = page.getByRole('button', { name: /^Go$/i }).first()
    await goButton.waitFor({ state: 'visible', timeout: 90000 })
    await waitForPageReady(page)
    discardKnownUi5Warning(harness)
    await assertResponsiveLayout(page, {
      label: 'List Report shell',
      buttons: [{ locator: goButton, label: 'List Report Go trigger', requireEnabled: true }]
    })
    await harness.assertNoBlockingSignals('List Report shell')
    pass('List Report shell and Go trigger stay within the tablet viewport')
    await goButton.click()
    await page.waitForTimeout(800)

    await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=true)`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })
    const similarTrigger = page.getByRole('button', { name: /^Find Similar Bugs$/i }).first()
    const classificationTrigger = page.getByRole('button', { name: /^Review Classification Suggestions$/i }).first()
    const handoffTrigger = page.getByRole('button', { name: /^Review Handoff Summary$/i }).first()
    const smartTrigger = page
      .locator('.sapMInputBase:has(input[placeholder="Choose a developer"])')
      .first()
      .locator('.sapMInputValHelp, [role="button"][aria-label*="Value Help"], [title*="Value Help"]')
      .first()
    for (const trigger of [similarTrigger, classificationTrigger, handoffTrigger, smartTrigger]) {
      await trigger.waitFor({ state: 'visible', timeout: 90000 })
    }
    await waitForPageReady(page)
    await assertResponsiveLayout(page, {
      label: 'Object Page primary triggers',
      buttons: [
        { locator: similarTrigger, label: 'Find Similar Bugs trigger', requireEnabled: true },
        { locator: classificationTrigger, label: 'Classification trigger', requireEnabled: true },
        { locator: handoffTrigger, label: 'Handoff Summary trigger', requireEnabled: true },
        { locator: smartTrigger, label: 'Smart Assign value-help trigger', requireEnabled: true }
      ]
    })
    await harness.assertNoBlockingSignals('Object Page shell')
    pass('Object Page shell and all AI primary triggers stay visible and reachable')

    await similarTrigger.click()
    const similarDialog = await waitForDialog(page, /^Similar Bugs$/i)
    const similarRows = similarDialog.locator('.sapMListItems > li')
    await similarRows.nth(1).waitFor({ state: 'visible', timeout: 30000 })
    if (await similarRows.count() < 2) throw new Error('Similar Bugs did not render two controlled candidates')
    await assertResponsiveLayout(page, {
      label: 'Similar Bugs dialog',
      buttons: [{ locator: similarDialog.getByRole('button', { name: /^(Accept|Reject|Ignore|Confirm Duplicate|Close)$/i }), label: 'Similar Bugs footer actions' }],
      text: {
        root: similarDialog,
        selectors: ['.sapMExText'],
        minimumLength: 80,
        minimumMatches: 2,
        label: 'Similar Bugs reasons'
      }
    })
    await harness.assertNoBlockingSignals('Similar Bugs responsive dialog')
    pass('Similar Bugs renders two long reasons without document overflow or nowrap')
    await closeDialog(similarDialog)

    await classificationTrigger.click()
    const classificationDialog = await waitForDialog(page, /^Classification Suggestions$/i)
    const classificationRows = classificationDialog.locator('.sapMListTblRow')
    await classificationRows.nth(1).waitFor({ state: 'visible', timeout: 30000 })
    if (await classificationRows.count() < 2) throw new Error('Classification Suggestions did not render two controlled rows')
    await assertResponsiveLayout(page, {
      label: 'Classification Suggestions dialog',
      buttons: [{ locator: classificationDialog.getByRole('button', { name: /^(Accept|Reject|Ignore|Apply Classification|Close)$/i }), label: 'Classification footer actions' }],
      text: {
        root: classificationDialog,
        selectors: ['.sapMExText'],
        minimumLength: 80,
        minimumMatches: 2,
        label: 'Classification reasons'
      }
    })
    await harness.assertNoBlockingSignals('Classification Suggestions responsive dialog')
    pass('Classification Suggestions renders two long reasons without document overflow or nowrap')
    await closeDialog(classificationDialog)

    await smartTrigger.click()
    const smartDialog = await waitForDialog(page, /Smart Assign Developer/i)
    const smartRows = smartDialog.locator('.sapMListTblRow')
    await smartRows.nth(1).waitFor({ state: 'visible', timeout: 30000 })
    if (await smartRows.count() < 2) throw new Error('Smart Assign did not render two controlled candidates')
    await assertResponsiveLayout(page, {
      label: 'Smart Assign dialog',
      buttons: [{ locator: smartDialog.getByRole('button', { name: /^(Accept|Reject|Ignore|Assign|Cancel)$/i }), label: 'Smart Assign actions' }],
      text: {
        root: smartDialog,
        selectors: ['.sapMText'],
        minimumLength: 80,
        minimumMatches: 3,
        label: 'Smart Assign explanations and warnings'
      }
    })
    await harness.assertNoBlockingSignals('Smart Assign responsive dialog')
    pass('Smart Assign renders two long explanations and a long warning without document overflow or nowrap')
    await closeDialog(smartDialog, /^Cancel$/i)

    await handoffTrigger.click()
    const handoffDialog = await waitForDialog(page, /^Handoff Summary$/i)
    await handoffDialog.getByText('Next Expected Action', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
    await assertResponsiveLayout(page, {
      label: 'Handoff Summary dialog',
      buttons: [{ locator: handoffDialog.getByRole('button', { name: /^(Accept|Reject|Ignore|Close)$/i }), label: 'Handoff footer actions' }],
      text: {
        root: handoffDialog,
        selectors: ['.sapMExText', '.sapMText', '.sapMMsgStripMessage'],
        minimumLength: 80,
        minimumMatches: 5,
        label: 'Handoff summary, missing-info, and timeline text'
      }
    })
    await harness.assertNoBlockingSignals('Handoff Summary responsive dialog')
    pass('Handoff Summary renders long summary, missing information, and timeline content without document overflow or nowrap')
    await closeDialog(handoffDialog)

    await assertResponsiveLayout(page, {
      label: 'Object Page after dialog cleanup',
      buttons: [
        { locator: similarTrigger, label: 'Find Similar Bugs trigger', requireEnabled: true },
        { locator: classificationTrigger, label: 'Classification trigger', requireEnabled: true },
        { locator: handoffTrigger, label: 'Handoff Summary trigger', requireEnabled: true },
        { locator: smartTrigger, label: 'Smart Assign value-help trigger', requireEnabled: true }
      ]
    })
    await harness.assertNoBlockingSignals('IDTS-127 UAT-UX-002 responsive browser completion')
    console.log('RESULT: PASS')
  } finally {
    await context?.close().catch(() => {})
    await browser?.close().catch(() => {})
    await cleanup(db, bugID, session?.sessionID)
    if (evidenceDir) fs.rmSync(evidenceDir, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error?.stack || error)
  process.exit(1)
})
