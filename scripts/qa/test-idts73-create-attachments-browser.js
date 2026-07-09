#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = process.env.CDS_LOG_LEVEL || 'warn'

const fs = require('fs')
const path = require('path')
const { createHash, randomUUID } = require('crypto')
const { chromium } = require('playwright')
const cds = require('@sap/cds')

const { DELETE, INSERT } = cds.ql
const { createSessionToken, hashToken, addMinutes } = require('../../srv/auth/passwords')
const { createHarness } = require('./lib/browser-harness')

const ROOT = path.resolve(__dirname, '..', '..')
const BASE_URL = String(process.env.IDTS_QA_BASE_URL || 'http://localhost:4004').replace(/\/+$/, '')
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR ||
  path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-73')
const ALLOW_MUTATION = /^true$/i.test(process.env.IDTS_QA_ALLOW_MUTATION || '')
const FULL_UPLOAD = !/^false$/i.test(process.env.IDTS_QA_UPLOAD_FULL_E2E || '')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const SAFE_ERROR_PATTERN = /could not be uploaded|upload it again|not supported|too large/i
const UNSAFE_ERROR_PATTERN = /\b(stack|sql|select\s+|passwordhash|tokenhash|credential|secret|access key|postgresql?:\/\/)\b/i

function pass(label) {
  console.log(`  PASS  ${label}`)
}

async function launchBrowser() {
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
    userAgent: 'IDTS-73 browser QA'
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

function bugPayload(bugID, label) {
  return {
    ID: bugID,
    title: `IDTS-73 browser QA ${label} ${Date.now()}`,
    description: 'Verify evidence can be selected before a new bug is saved.',
    stepsToReproduce: 'Create a bug, choose evidence files, then save.',
    actualResult: 'Pending evidence must remain visible before save.',
    expectedResult: 'The bug saves first and selected evidence uploads to the saved bug.',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'Browser QA',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY
  }
}

async function createDraft(page, token, bugID, label) {
  const response = await page.request.post(`${BASE_URL}/odata/v4/bug/Bugs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: bugPayload(bugID, label)
  })
  if (!response.ok()) {
    throw new Error(`Create QA draft failed with HTTP ${response.status()}: ${(await response.text()).slice(0, 300)}`)
  }
  return response.json()
}

async function readActiveBug(page, token, bugID) {
  const response = await page.request.get(
    `${BASE_URL}/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)?$select=ID,bugNumber&$expand=attachments($select=ID,filename,mimeType,fileSize)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return {
    status: response.status(),
    ok: response.ok(),
    body: response.ok() ? await response.json() : null
  }
}

async function waitForActiveAttachments(page, token, bugID, expectedNames, timeout = 60000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const result = await readActiveBug(page, token, bugID)
    const names = (result.body?.attachments || []).map(item => item.filename)
    if (result.ok && expectedNames.every(name => names.includes(name))) return result.body
    await page.waitForTimeout(750)
  }
  throw new Error(`Saved bug did not expose expected attachments: ${expectedNames.join(', ')}`)
}

function uploader(page) {
  return page.locator('input[type="file"][id*="idtsAttachmentUploader"]').first()
}

async function assertCreateSections(page) {
  const attachmentHeading = page.getByRole('heading', { name: /Evidence \/ Attachments/i }).first()
  await attachmentHeading.waitFor({ state: 'visible', timeout: 90000 })

  const commentHeading = page.getByRole('heading', { name: /^Comments$/i }).first()
  if (await commentHeading.isVisible().catch(() => false)) {
    throw new Error('Comments section is visible while creating a new bug.')
  }
  if (await page.locator('textarea[id*="idtsCommentTextArea"]').count()) {
    throw new Error('Comment input exists while creating a new bug.')
  }

  const fileInput = uploader(page)
  await fileInput.waitFor({ state: 'attached', timeout: 30000 })
  if (await fileInput.isDisabled()) throw new Error('Evidence uploader is disabled on Create Bug.')

  pass('Comments are hidden while creating a bug')
  pass('Evidence / Attachments remains visible and enabled on Create Bug')
}

async function selectPendingFiles(page, files) {
  await uploader(page).setInputFiles(files)
  for (const file of files) {
    await page.getByText(file.name, { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 })
  }
}

async function clickSave(page) {
  const save = page.getByRole('button', { name: /^(Create|Save)$/i }).first()
  await save.waitFor({ state: 'visible', timeout: 30000 })
  await save.click()
}

async function runHappyFlow(page, harness, session, bugIDs, results) {
  const bugID = randomUUID()
  bugIDs.push(bugID)
  await createDraft(page, session.token, bugID, 'happy-flow')
  await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=false)`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  })
  await assertCreateSections(page)
  await harness.assertNoBlockingSignals('IDTS-73 create draft load')

  const files = [
    {
      name: `idts73-evidence-a-${Date.now()}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from('IDTS-73 pending attachment browser evidence A', 'utf8')
    },
    {
      name: `idts73-evidence-b-${Date.now()}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from('IDTS-73 pending attachment browser evidence B', 'utf8')
    }
  ]

  await selectPendingFiles(page, files)
  await harness.screenshot('idts73_create_pending_files')
  pass('two selected files remain visible in the pending list before save')
  results.push({ check: 'pending-files-before-save', passed: true, count: files.length })

  await uploader(page).setInputFiles({
    name: 'blocked-evidence.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('blocked', 'utf8')
  })
  await page.waitForTimeout(800)
  if (await page.getByText('blocked-evidence.exe', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Unsupported file type was added to pending evidence.')
  }
  pass('unsupported file type is not added to pending evidence')
  results.push({ check: 'unsupported-file-rejected', passed: true })

  await uploader(page).setInputFiles({
    name: 'oversized-evidence.txt',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65)
  })
  await page.waitForTimeout(800)
  if (await page.getByText('oversized-evidence.txt', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Oversized file was added to pending evidence.')
  }
  pass('file above 10 MB is not added to pending evidence')
  results.push({ check: 'oversized-file-rejected', passed: true })

  if (!FULL_UPLOAD) return

  await clickSave(page)
  const active = await waitForActiveAttachments(page, session.token, bugID, files.map(file => file.name))
  const activeNames = active.attachments.map(item => item.filename)
  for (const file of files) {
    const metadata = active.attachments.find(item => item.filename === file.name)
    const download = await page.request.get(
      `${BASE_URL}/odata/v4/bug/Bugs_attachments(ID=${metadata.ID},IsActiveEntity=true)/content`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    )
    if (!download.ok()) throw new Error(`Attachment download failed with HTTP ${download.status()}.`)
    const actualHash = createHash('sha256').update(await download.body()).digest('hex')
    const expectedHash = createHash('sha256').update(file.buffer).digest('hex')
    if (actualHash !== expectedHash) throw new Error(`Downloaded content hash mismatch for ${file.name}.`)
  }
  pass('saved bug contains both uploaded evidence files with matching SHA-256')
  results.push({ check: 'post-save-upload-and-hash', passed: true, files: activeNames.length })

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.getByRole('heading', { name: /^Comments$/i }).first().waitFor({ state: 'visible', timeout: 30000 })
  for (const file of files) {
    await page.getByText(file.name, { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
  }
  await harness.assertNoBlockingSignals('IDTS-73 saved bug reload')
  await harness.screenshot('idts73_saved_attachments_and_comments')
  pass('Comments and saved evidence are visible after reload')
  results.push({ check: 'post-save-reload', passed: true })
}

async function runSafeFailureFlow(page, harness, session, bugIDs, results) {
  if (!FULL_UPLOAD) return

  const bugID = randomUUID()
  bugIDs.push(bugID)
  await createDraft(page, session.token, bugID, 'failure-recovery')
  await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=false)`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  })
  await assertCreateSections(page)

  const file = {
    name: `idts73-failure-${Date.now()}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from('IDTS-73 controlled upload failure', 'utf8')
  }
  await selectPendingFiles(page, [file])

  await page.route(/\/Bugs_attachments\(ID=.*IsActiveEntity=false\)\/content/i, async route => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'controlled QA failure' } })
      })
      return
    }
    await route.continue()
  })

  await clickSave(page)
  const safeError = page.getByText(SAFE_ERROR_PATTERN).first()
  await safeError.waitFor({ state: 'visible', timeout: 60000 })
  const errorText = (await safeError.innerText()).replace(/\s+/g, ' ').trim()
  if (UNSAFE_ERROR_PATTERN.test(errorText)) {
    throw new Error('Controlled upload failure exposed an unsafe diagnostic.')
  }

  const active = await readActiveBug(page, session.token, bugID)
  if (!active.ok) throw new Error('Bug did not remain saved after the controlled attachment upload failure.')

  await harness.screenshot('idts73_safe_upload_failure')
  pass('controlled upload failure keeps the bug saved and shows a safe recovery message')
  results.push({ check: 'safe-upload-failure', passed: true })
  await page.unroute(/\/Bugs_attachments\(ID=.*IsActiveEntity=false\)\/content/i)

  const expectedDialog = page
    .locator('[role="dialog"], .sapMDialog, .sapMMessageBox')
    .filter({ hasText: SAFE_ERROR_PATTERN })
    .first()
  const close = expectedDialog.getByRole('button', { name: /^(Close|OK)$/i }).first()
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await expectedDialog.waitFor({ state: 'hidden', timeout: 15000 })
  }
  harness.state.badResponses = harness.state.badResponses.filter(item => !item.startsWith('503 '))
  harness.state.consoleErrors = harness.state.consoleErrors.filter(
    item => !/Failed to load resource: the server responded with a status of 503/i.test(item)
  )
}

async function cleanupLocal(db, bugIDs, sessionID) {
  for (const bugID of bugIDs) {
    await db.run(DELETE.from('idts.cap.Bugs.attachments.drafts').where({ up__ID: bugID })).catch(() => {})
    await db.run(DELETE.from('idts.cap.Bugs.attachments').where({ up__ID: bugID })).catch(() => {})
    await db.run(DELETE.from('idts.cap.Bugs.drafts').where({ ID: bugID })).catch(() => {})
    await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
  }
  if (sessionID) {
    await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
  }
}

async function main() {
  if (!ALLOW_MUTATION) {
    throw new Error(
      'IDTS-73 browser QA creates controlled bug records. Set IDTS_QA_ALLOW_MUTATION=true to run it.'
    )
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = IS_LOCAL ? await cds.connect.to('db') : null
  const session = IS_LOCAL ? await createLocalSession(db) : await loginRemote()
  const bugIDs = []
  const results = []
  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await injectSession(context, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })

  try {
    await runHappyFlow(page, harness, session, bugIDs, results)
    await runSafeFailureFlow(page, harness, session, bugIDs, results)
    await harness.assertNoBlockingSignals('IDTS-73 browser completion')

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'idts73-create-attachments-browser.json'),
      JSON.stringify({
        task: 'IDTS-73',
        checkedAt: new Date().toISOString(),
        target: IS_LOCAL ? 'local' : 'shared-qa',
        fullUpload: FULL_UPLOAD,
        results
      }, null, 2)
    )

    console.log(`Evidence saved in ${EVIDENCE_DIR}`)
    console.log('RESULT: PASS')
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    if (db) await cleanupLocal(db, bugIDs, session.sessionID)
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
