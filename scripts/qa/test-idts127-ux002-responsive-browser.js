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

process.env.CDS_LOG_LEVEL = process.env.CDS_LOG_LEVEL || 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.CDS_TEST_FAKE = 'true'
process.env.CDS_PLUGIN_UI5_ACTIVE = 'false'

const cds = require('@sap/cds')
const cdsTest = require('@cap-js/cds-test')

const { DELETE, INSERT } = cds.ql
const { createSessionToken, hashToken, addMinutes } = require('../../srv/auth/passwords')
const { createHarness } = require('./lib/browser-harness')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const LOCAL_BASE_URL_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i
const VIEWPORT = { width: 834, height: 1112 }
const AMBIENT_BASE_URL = String(process.env.IDTS_QA_BASE_URL || '').replace(/\/+$/, '')

let BASE_URL
let APP_URL

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

function assertAmbientBaseUrlIsolation (serverUrl) {
  assert.match(serverUrl, LOCAL_BASE_URL_PATTERN, 'cds-test must provide a localhost fixture URL')
  if (AMBIENT_BASE_URL && !LOCAL_BASE_URL_PATTERN.test(AMBIENT_BASE_URL)) {
    assert.notStrictEqual(serverUrl, AMBIENT_BASE_URL)
  }
  pass('ambient IDTS_QA_BASE_URL cannot override the deterministic localhost fixture target')
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

async function withTimeout (label, operation, timeoutMs = 15000) {
  let timer
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function closeServer (server) {
  if (!server?.listening) return
  await withTimeout('CAP server shutdown', () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  }))
  if (server.listening) throw new Error('CAP server remains listening after shutdown')
}

async function cleanup (db, bugID, sessionID) {
  const failures = []
  const attempt = async (label, operation) => {
    try {
      await withTimeout(label, operation)
    } catch (error) {
      failures.push({ label, error })
    }
  }

  if (db && bugID) {
    await attempt('AiSuggestions fixture deletion', () => db.run(DELETE.from('idts.cap.AiSuggestions').where({ bug_ID: bugID })))
    await attempt('Bug fixture deletion', () => db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })))
  }
  if (db && sessionID) {
    await attempt('AuthSessions fixture deletion', () => db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })))
  }
  if (failures.length) {
    const error = new Error(`CLEANUP FAILED: ${failures.map(failure => `${failure.label}: ${failure.error?.message || failure.error}`).join('; ')}`)
    error.failures = failures
    throw error
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

function controlledSimilar () {
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
  await page.route(/\/odata\/v4\/bug\/suggestSimilarBugs/i, route => route.fulfill(json(controlledSimilar())))
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
    function nearestScrollContainer (node) {
      let ancestor = node.parentElement
      while (ancestor) {
        const style = window.getComputedStyle(ancestor)
        const scrollableY = /^(auto|scroll|overlay)$/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 1
        const scrollableX = /^(auto|scroll|overlay)$/.test(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1
        if (scrollableY || scrollableX) {
          const rect = ancestor.getBoundingClientRect()
          return {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            clientHeight: ancestor.clientHeight,
            scrollHeight: ancestor.scrollHeight,
            clientWidth: ancestor.clientWidth,
            scrollWidth: ancestor.scrollWidth,
            overflowY: style.overflowY,
            overflowX: style.overflowX
          }
        }
        ancestor = ancestor.parentElement
      }
      return null
    }

    const nodes = [...new Set(selectorList.flatMap(selector => [...element.querySelectorAll(selector)]))]
    return nodes.map(node => {
      const style = window.getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim()
      const container = nearestScrollContainer(node)
      const fullyVisibleInViewport = rect.top >= -1 && rect.bottom <= window.innerHeight + 1 && rect.left >= -1 && rect.right <= window.innerWidth + 1
      const intersectsContainer = Boolean(container && rect.bottom > container.top + 1 && rect.top < container.bottom - 1 && rect.right > container.left + 1 && rect.left < container.right - 1)
      const partiallyClippedByContainer = Boolean(container && intersectsContainer && (
        rect.top < container.top - 1 || rect.bottom > container.bottom + 1 || rect.left < container.left - 1 || rect.right > container.right + 1
      ))
      return {
        textLength: text.length,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        whiteSpace: style.whiteSpace,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        fullyVisibleInViewport,
        container,
        partiallyClippedByContainer
      }
    }).filter(item => item.textLength >= min)
  }, { selectors, minimumLength })
}

async function readButtonGeometry (page, locator, label, requireEnabled) {
  const issues = []
  const count = await locator.count()
  if (!count) return [`${label}: button is missing`]
  const viewportWidth = page.viewportSize()?.width || VIEWPORT.width
  const viewportHeight = page.viewportSize()?.height || VIEWPORT.height

  for (let index = 0; index < count; index += 1) {
    const button = locator.nth(index)
    if (!await button.isVisible().catch(() => false)) {
      issues.push(`${label}[${index}]: button is not visible`)
      continue
    }
    const box = await button.boundingBox()
    if (!box || box.width <= 0 || box.height <= 0) {
      issues.push(`${label}[${index}]: button has no reachable box`)
      continue
    }
    if (box.left < -1 || box.right > viewportWidth + 1) {
      issues.push(`${label}[${index}]: button bounds ${Math.round(box.left)}..${Math.round(box.right)} exceed ${viewportWidth}`)
    }
    if (box.top < -1 || box.bottom > viewportHeight + 1) {
      issues.push(`${label}[${index}]: button vertical bounds ${Math.round(box.top)}..${Math.round(box.bottom)} exceed viewport`)
    }
    const geometry = await button.evaluate(element => {
      function nearestScrollContainer (node) {
        let ancestor = node.parentElement
        while (ancestor) {
          const style = window.getComputedStyle(ancestor)
          const scrollableY = /^(auto|scroll|overlay)$/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 1
          const scrollableX = /^(auto|scroll|overlay)$/.test(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1
          if (scrollableY || scrollableX) {
            const rect = ancestor.getBoundingClientRect()
            return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
          }
          ancestor = ancestor.parentElement
        }
        return null
      }
      const rect = element.getBoundingClientRect()
      const container = nearestScrollContainer(element)
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        container,
        fullyWithinContainer: !container || (rect.top >= container.top - 1 && rect.bottom <= container.bottom + 1 && rect.left >= container.left - 1 && rect.right <= container.right + 1)
      }
    }).catch(() => null)
    if (geometry?.container && !geometry.fullyWithinContainer) {
      issues.push(`${label}[${index}]: button bounds ${Math.round(geometry.left)}..${Math.round(geometry.right)} / ${Math.round(geometry.top)}..${Math.round(geometry.bottom)} exceed nearest scroll container`)
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
    const visibleMatches = matches.filter(match => match.visible && match.fullyVisibleInViewport && !match.partiallyClippedByContainer)
    if (visibleMatches.length < (options.text.minimumVisibleMatches || 1)) {
      issues.push(`${options.text.label}: no representative long text row is currently fully visible in the viewport`)
    }
    for (const [index, match] of matches.entries()) {
      if (!match.visible) {
        issues.push(`${options.text.label}[${index}]: long text row has no rendered box`)
        continue
      }
      if (match.scrollWidth > match.clientWidth + 1) {
        issues.push(`${options.text.label}[${index}]: scrollWidth ${match.scrollWidth} exceeds clientWidth ${match.clientWidth}`)
      }
      if (match.scrollHeight > match.clientHeight + 1) {
        issues.push(`${options.text.label}[${index}]: vertical scrollHeight ${match.scrollHeight} exceeds clientHeight ${match.clientHeight}`)
      }
      if (match.whiteSpace === 'nowrap') {
        issues.push(`${options.text.label}[${index}]: computed whiteSpace is nowrap`)
      }
      if (match.partiallyClippedByContainer) {
        const container = match.container
        issues.push(`${options.text.label}[${index}]: text bounds ${Math.round(match.top)}..${Math.round(match.bottom)} are partially clipped by container ${Math.round(container.top)}..${Math.round(container.bottom)}`)
      } else if (!match.container && !match.fullyVisibleInViewport) {
        issues.push(`${options.text.label}[${index}]: text bounds ${Math.round(match.top)}..${Math.round(match.bottom)} exceed viewport`)
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
    text.style.cssText = 'display:block;width:calc(100vw + 24px);height:8px;overflow:hidden;white-space:nowrap;'
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
  assert.match(failure.message, /vertical scrollHeight/)
  assert.match(failure.message, /whiteSpace is nowrap/)
  pass('negative control fails as expected for document overflow, vertical clipping, and nowrap text')

  const clippingControlID = `${controlID}-clipping`
  await page.evaluate(id => {
    const dialog = document.createElement('div')
    dialog.id = id
    dialog.style.cssText = 'position:fixed;left:20px;top:80px;width:320px;height:100px;overflow:auto;contain:layout;background:#fff;'
    const rowText = 'A long responsive row must remain readable inside the bounded dialog content viewport.'
    for (const text of [rowText, `${rowText} A second row is intentionally positioned below the current viewport.`]) {
      const row = document.createElement('div')
      row.dataset.idtsLongRow = 'true'
      row.style.cssText = 'display:block;width:300px;height:80px;line-height:18px;overflow:visible;white-space:normal;'
      row.textContent = text
      dialog.append(row)
    }
    const button = document.createElement('button')
    button.textContent = 'Clipped action'
    button.style.cssText = 'display:block;margin-top:8px;'
    dialog.append(button)
    document.body.append(dialog)
    dialog.scrollTop = 30
  }, clippingControlID)

  let clippingFailure
  try {
    await assertResponsiveLayout(page, {
      label: 'negative clipping control',
      buttons: [{ locator: page.locator(`#${clippingControlID} button`), label: 'Clipped action' }],
      text: {
        root: page.locator(`#${clippingControlID}`),
        selectors: ['[data-idts-long-row]'],
        minimumLength: 40,
        minimumMatches: 2,
        label: 'clipped dialog rows'
      }
    })
  } catch (error) {
    clippingFailure = error
  } finally {
    await page.evaluate(id => document.getElementById(id)?.remove(), clippingControlID)
  }

  if (!clippingFailure) throw new Error('negative clipping control unexpectedly passed row/button visibility checks')
  assert.match(clippingFailure.message, /partially clipped|container vertical bounds/i)
  assert.match(clippingFailure.message, /button bounds .*exceed nearest scroll container/i)
  pass('negative control fails as expected for clipped dialog rows and an unscrolled action')
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

async function waitForObjectPageTrigger (page, trigger, label, harness) {
  try {
    await trigger.waitFor({ state: 'visible', timeout: 90000 })
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const bodyText = document.body?.innerText || ''
      const buttonLabels = [...document.querySelectorAll('button')]
        .map(button => (button.innerText || button.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 40)
      const controls = Object.values(window.sap?.ui?.getCore?.().mElements || {})
        .map(control => {
          let text = ''
          try { text = control.getText?.() || control.getTitle?.() || '' } catch {}
          return { text: String(text).replace(/\s+/g, ' ').trim(), visible: control.getVisible?.() }
        })
        .filter(control => /Similar Bugs|Classification Suggestions|Handoff Summary/i.test(control.text))
      return {
        url: location.href,
        bodyTextLength: bodyText.length,
        hasSimilarLabel: /Find Similar Bugs/i.test(bodyText),
        hasClassificationLabel: /Review Classification Suggestions/i.test(bodyText),
        hasHandoffLabel: /Review Handoff Summary/i.test(bodyText),
        buttonLabels,
        matchingControls: controls
      }
    }).catch(() => ({ url: page.url(), bodyTextLength: -1, buttonLabels: [], matchingControls: [] }))
    console.error(`OBJECT PAGE DIAGNOSTICS ${JSON.stringify({ label, ...diagnostic, consoleErrorCount: harness.state.consoleErrors.length })}`)
    throw error
  }
}

async function inspectCurrentButtons (page, buttons, label) {
  for (const button of buttons) {
    await button.locator.scrollIntoViewIfNeeded()
    await assertResponsiveLayout(page, {
      label: `${label}: ${button.label}`,
      buttons: [{ locator: button.locator, label: button.label, requireEnabled: button.requireEnabled === true }]
    })
  }
}

async function runCleanupNegativeControl () {
  let timeoutFailure
  try {
    await withTimeout('synthetic cleanup timeout', () => new Promise(resolve => setTimeout(resolve, 25)), 5)
  } catch (error) {
    timeoutFailure = error
  }
  assert.match(timeoutFailure?.message || '', /synthetic cleanup timeout timed out/)

  let operationFailure
  try {
    await withTimeout('synthetic cleanup error', () => {
      throw new Error('synthetic cleanup error')
    }, 50)
  } catch (error) {
    operationFailure = error
  }
  assert.match(operationFailure?.message || '', /synthetic cleanup error/)
  pass('cleanup timeout and operation errors remain observable')
}

function assertDatabaseUnavailable (db) {
  if (!db) return
  const poolCount = Object.keys(db.pools || {}).length
  if (db.dbc || poolCount) throw new Error(`in-memory database remains available after shutdown (pools=${poolCount})`)
}

async function main () {
  await runCleanupNegativeControl()
  cds.env.requires.db = { impl: '@cap-js/sqlite', kind: 'sqlite', credentials: { url: ':memory:' } }
  cds.env.requires.malwareScanner = { kind: 'malwareScanner-mocked', model: '@cap-js/attachments/srv/malware-scanner/malwareScanner-mocked' }
  const test = cdsTest('serve', 'srv/service.cds', 'srv/auth.cds', 'srv/notification.cds', 'app/bug-management-ui/annotations.cds', '@sap/cds/srv/outbox', '@cap-js/attachments/srv/malware-scanner/malwareScanner-mocked', '--in-memory?').in(PROJECT_ROOT)
  let db
  let evidenceDir
  let bugID
  let session
  let browser
  let context
  let runError
  let testServer

  try {
    const started = await test
    testServer = started?.server
    assert.ok(testServer?.listening, 'cds-test must start a listening in-process CAP server')
    BASE_URL = String(started?.url || '').replace(/\/+$/, '')
    assertAmbientBaseUrlIsolation(BASE_URL)
    APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
    db = cds.db
    assert.ok(db?.isDatabaseService, 'cds-test must expose its isolated database service')
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
    for (const [label, trigger] of [
      ['Find Similar Bugs', similarTrigger],
      ['Review Classification Suggestions', classificationTrigger],
      ['Review Handoff Summary', handoffTrigger],
      ['Smart Assign value help', smartTrigger]
    ]) {
      await waitForObjectPageTrigger(page, trigger, label, harness)
    }
    await waitForPageReady(page)
    await inspectCurrentButtons(page, [
      { locator: similarTrigger, label: 'Find Similar Bugs trigger', requireEnabled: true },
      { locator: classificationTrigger, label: 'Classification trigger', requireEnabled: true },
      { locator: handoffTrigger, label: 'Handoff Summary trigger', requireEnabled: true },
      { locator: smartTrigger, label: 'Smart Assign value-help trigger', requireEnabled: true }
    ], 'Object Page primary triggers')
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

    await inspectCurrentButtons(page, [
      { locator: similarTrigger, label: 'Find Similar Bugs trigger', requireEnabled: true },
      { locator: classificationTrigger, label: 'Classification trigger', requireEnabled: true },
      { locator: handoffTrigger, label: 'Handoff Summary trigger', requireEnabled: true },
      { locator: smartTrigger, label: 'Smart Assign value-help trigger', requireEnabled: true }
    ], 'Object Page after dialog cleanup')
    await harness.assertNoBlockingSignals('IDTS-127 UAT-UX-002 responsive browser completion')
    console.log('RESULT: PASS')
  } catch (error) {
    runError = error
    throw error
  } finally {
    const cleanupFailures = []
    const attemptCleanup = async (label, operation) => {
      try {
        await withTimeout(label, operation)
      } catch (error) {
        cleanupFailures.push({ label, error })
      }
    }
    await attemptCleanup('browser context close', () => context?.close())
    await attemptCleanup('browser close', () => browser?.close())
    await attemptCleanup('fixture cleanup', () => cleanup(db, bugID, session?.sessionID))
    await attemptCleanup('CAP server close', () => closeServer(testServer))
    await attemptCleanup('CAP runtime shutdown', () => {
      if (!testServer) return
      if (typeof cds.shutdown !== 'function') throw new Error('CAP runtime shutdown is unavailable')
      return cds.shutdown()
    })
    await attemptCleanup('in-memory DB disconnect', () => db?.disconnect?.())
    await attemptCleanup('in-memory DB shutdown check', () => assertDatabaseUnavailable(db))
    await attemptCleanup('temporary evidence cleanup', async () => {
      if (!evidenceDir) return
      await fs.promises.rm(evidenceDir, { recursive: true, force: true })
      if (fs.existsSync(evidenceDir)) throw new Error('temporary evidence directory still exists')
    })
    if (cleanupFailures.length) {
      const cleanupError = new Error(`CLEANUP FAILED: ${cleanupFailures.map(failure => `${failure.label}: ${failure.error?.message || failure.error}`).join('; ')}`)
      cleanupError.failures = cleanupFailures
      console.error(`CLEANUP FAIL: ${cleanupError.message}`)
      if (runError) throw new AggregateError([runError, cleanupError], 'IDTS-127 test and cleanup failed')
      throw cleanupError
    }
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error?.stack || error)
  for (const nested of error?.errors || []) console.error(`CAUSE: ${nested?.stack || nested}`)
  process.exit(1)
})
