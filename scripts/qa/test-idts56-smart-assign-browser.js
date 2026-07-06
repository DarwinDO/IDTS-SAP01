/**
 * IDTS-56 browser verification for the Smart Assign developer dialog.
 *
 * Requires a running local CAP/Fiori server:
 *   npm run watch-bug-management-ui
 */

'use strict'

process.env.CDS_LOG_LEVEL = process.env.CDS_LOG_LEVEL || 'warn'

const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const { chromium } = require('playwright')
const cds = require('@sap/cds')

const { DELETE, INSERT, SELECT, UPDATE } = cds.ql
const { createSessionToken, hashToken, addMinutes } = require('../../srv/auth/passwords')
const { createHarness } = require('./lib/browser-harness')

const BASE_URL = process.env.IDTS_UAT_BASE_URL || 'http://localhost:4004'
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
const EVIDENCE_DIR = path.join(process.cwd(), 'docs', 'pm', 'evidence', 'idts-56')

const USERS = {
  PM: {
    ID: '10000000-0000-0000-0000-000000000001',
    displayName: 'DonHV',
    email: 'donhv@example.local',
    role_code: 'PM'
  },
  TESTER: {
    ID: '10000000-0000-0000-0000-000000000004',
    displayName: 'NhanT',
    email: 'nhant@example.local',
    role_code: 'TESTER'
  }
}

const DEV_SANG = '20000000-0000-0000-0000-000000000001'
const DEV_DAT = '20000000-0000-0000-0000-000000000002'
const DEV_MISSING = '20000000-0000-0000-0000-000000009999'
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY = '60000000-0000-0000-0000-000000000001'

function logPass(label) {
  console.log(`  PASS  ${label}`)
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true })
  } catch (edgeError) {
    try {
      return await chromium.launch({ channel: 'chrome', headless: true })
    } catch (chromeError) {
      return chromium.launch({ headless: true })
    }
  }
}

async function createAuthSession(db, user) {
  const token = createSessionToken()
  const now = new Date()
  const expiresAt = addMinutes(now, 30).toISOString()
  await db.run(
    INSERT.into('idts.cap.AuthSessions').entries({
      ID: randomUUID(),
      tokenHash: hashToken(token),
      user_ID: user.ID,
      issuedAt: now.toISOString(),
      expiresAt,
      userAgent: 'IDTS-56 browser QA'
    })
  )

  return { token, expiresAt, user }
}

async function prepareFixture(db) {
  const fixture = {
    bugID: randomUUID(),
    responsibilityID: randomUUID(),
    runId: Date.now(),
    originalSangAvailability: null
  }

  const sangProfile = await db.run(
    SELECT.one.from('idts.cap.DeveloperProfiles')
      .columns('availabilityStatus_code')
      .where({ ID: DEV_SANG })
  )
  fixture.originalSangAvailability = sangProfile?.availabilityStatus_code || 'AVAILABLE'

  try {
    await db.run(
      UPDATE('idts.cap.DeveloperProfiles')
        .set({ availabilityStatus_code: 'BUSY' })
        .where({ ID: DEV_SANG })
    )

    await db.run(
      INSERT.into('idts.cap.DeveloperResponsibilities').entries({
        ID: fixture.responsibilityID,
        developerProfile_ID: DEV_SANG,
        componentCategory_ID: COMPONENT_CATEGORY,
        sapModule_ID: null,
        responsibilityLevel_code: 'BACKUP',
        active: 1
      })
    )

    await db.run(
      INSERT.into('idts.cap.Bugs').entries({
        ID: fixture.bugID,
        bugNumber: `QA-IDTS56-${fixture.runId}`,
        title: `IDTS-56 Smart Assign Browser QA ${fixture.runId}`,
        description: 'Browser fixture for Smart Assign dialog verification.',
        status_code: 'PENDING_ASSIGNMENT',
        priority_code: 'HIGH',
        severity_code: 'MAJOR',
        environment_code: 'QAS',
        environmentDetail: 'Local CAP SQLite browser QA',
        stepsToReproduce: 'Open Object Page and use Smart Assign.',
        actualResult: 'Smart Assign should show searchable developer candidates.',
        expectedResult: 'PM can assign a valid developer and backend blocks invalid assignment.',
        applicationComponent_ID: COMPONENT,
        defectCategory_ID: CATEGORY,
        componentCategory_ID: COMPONENT_CATEGORY,
        reporter_ID: USERS.TESTER.ID,
        nextProcessorUser_ID: USERS.PM.ID,
        nextProcessorRole_code: 'PM'
      })
    )
  } catch (error) {
    await cleanupFixture(db, fixture)
    throw error
  }

  return fixture
}

async function cleanupFixture(db, fixture) {
  await db.run(
    UPDATE('idts.cap.DeveloperProfiles')
      .set({ availabilityStatus_code: fixture.originalSangAvailability })
      .where({ ID: DEV_SANG })
  ).catch(() => {})

  await db.run(
    DELETE.from('idts.cap.DeveloperResponsibilities')
      .where({ ID: fixture.responsibilityID })
  ).catch(() => {})

  await db.run(
    DELETE.from('idts.cap.Bugs')
      .where({ ID: fixture.bugID })
  ).catch(() => {})
}

async function injectSession(context, session) {
  await context.addInitScript(({ token, user, expiresAt }) => {
    window.sessionStorage.setItem('idts_auth_token', token)
    window.sessionStorage.setItem('idts_auth_user', JSON.stringify(user))
    window.sessionStorage.setItem('idts_auth_expires', expiresAt)
  }, {
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt
  })
}

async function waitForVisible(locator, label, timeout = 90000) {
  await locator.waitFor({ state: 'visible', timeout }).catch(async error => {
    throw new Error(`${label} was not visible: ${error.message}`)
  })
}

function smartAssignAction(page) {
  return page.locator([
    '.sapMBtn:has-text("Smart Assign"):visible',
    'button:has-text("Smart Assign"):visible',
    '[role="button"]:has-text("Smart Assign"):visible'
  ].join(', ')).first()
}

async function runBrowserFlow(db, fixture, session) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

  const browser = await launchBrowser()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  })
  await injectSession(context, session)

  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })

  try {
    const objectPageUrl = `${APP_URL}#/Bugs(ID=${fixture.bugID},IsActiveEntity=true)`
    await page.goto(objectPageUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })
    const smartAssign = smartAssignAction(page)
    await waitForVisible(smartAssign, 'Smart Assign action')
    await harness.assertNoBlockingSignals('object page load')
    logPass('fixture Object Page loaded with Smart Assign action')

    await smartAssign.click()
    await page.waitForTimeout(1500)
    await harness.screenshot('debug_after_smart_assign_click')
    await harness.assertNoBlockingSignals('open Smart Assign dialog')
    await waitForVisible(page.getByRole('dialog', { name: /Smart Assign Developer/i }).first(), 'Smart Assign dialog')
    await waitForVisible(page.getByText('DatDT').first(), 'DatDT candidate')
    await waitForVisible(page.getByText('SangVN').first(), 'SangVN candidate')
    await waitForVisible(page.getByText('Busy').first(), 'Busy availability warning state')
    await harness.screenshot('01_smart_assign_dialog_multiple_states')
    logPass('dialog shows multiple developer states')

    await page.getByPlaceholder(/Search developer/i).fill('busy backup')
    await waitForVisible(page.getByText('SangVN').first(), 'search result by busy backup')
    await harness.screenshot('02_smart_assign_search_busy_backup')
    logPass('search filters by availability and responsibility capability')

    await page.getByPlaceholder(/Search developer/i).fill('DatDT')
    await waitForVisible(page.getByText('DatDT').first(), 'DatDT search result')
    await page.getByText('DatDT').first().click()
    await page.getByRole('button', { name: /^Assign$/i }).click()
    await page.waitForTimeout(2500)
    await harness.assertNoBlockingSignals('positive Smart Assign submit')

    const assigned = await db.run(
      SELECT.one.from('idts.cap.Bugs')
        .columns('assignee_ID', 'status_code')
        .where({ ID: fixture.bugID })
    )
    if (assigned?.assignee_ID !== DEV_DAT || assigned?.status_code !== 'ASSIGNED') {
      throw new Error(`Expected assigned DatDT/ASSIGNED, got ${JSON.stringify(assigned)}`)
    }
    await harness.screenshot('03_smart_assign_after_valid_assign')
    logPass('positive browser assignment persisted through backend action')

    const negativeResponse = await page.request.post(
      `${BASE_URL}/odata/v4/bug/Bugs(ID=${fixture.bugID},IsActiveEntity=true)/BugService.assignToDeveloper`,
      {
        headers: { Authorization: `Bearer ${session.token}` },
        data: {
          assigneeID: DEV_MISSING,
          note: 'IDTS-56 browser negative invalid assignee check'
        }
      }
    )
    if (negativeResponse.ok() || negativeResponse.status() < 400) {
      throw new Error(`Invalid assignee should be rejected, received HTTP ${negativeResponse.status()}`)
    }
    logPass(`negative invalid assignee blocked with HTTP ${negativeResponse.status()}`)

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 })
    await waitForVisible(page.getByText(/DatDT/i).first(), 'DatDT after reload')
    await harness.assertNoBlockingSignals('reload persistence check')
    await harness.screenshot('04_smart_assign_reload_persistence')
    logPass('assigned developer remains visible after reload')
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function main() {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-56 Smart Assign Browser Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const db = await cds.connect.to('db')
  const fixture = await prepareFixture(db)

  try {
    const session = await createAuthSession(db, USERS.PM)
    await runBrowserFlow(db, fixture, session)
    console.log('')
    console.log(`Evidence saved in ${EVIDENCE_DIR}`)
    console.log('RESULT: PASS')
  } finally {
    await cleanupFixture(db, fixture)
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
