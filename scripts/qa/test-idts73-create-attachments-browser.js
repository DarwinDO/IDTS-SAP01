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
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR || path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-116')
const ALLOW_MUTATION = /^true$/i.test(process.env.IDTS_QA_ALLOW_MUTATION || '')
const IS_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(BASE_URL)

const PM_USER = {
  ID: '10000000-0000-0000-0000-000000000001',
  displayName: 'DonHV',
  email: 'donhv@example.local',
  role_code: 'PM'
}
const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'

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
    userAgent: 'IDTS-116 standard attachment browser QA'
  }))
  return { token, expiresAt, user: PM_USER, sessionID }
}

async function loginRemote () {
  const email = process.env.IDTS_QA_EMAIL
  const password = process.env.IDTS_QA_PASSWORD
  if (!email || !password) throw new Error('Remote browser QA requires private IDTS_QA_EMAIL and IDTS_QA_PASSWORD.')
  const response = await fetch(`${BASE_URL}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error(`Remote QA login failed with HTTP ${response.status}.`)
  const body = await response.json()
  const result = body?.value || body
  if (!result?.token || !result?.user) throw new Error('Remote QA login returned an incomplete safe session.')
  return { token: result.token, expiresAt: result.expiresAt || '', user: result.user }
}

async function injectSession (context, session) {
  await context.addInitScript(({ token, user, expiresAt }) => {
    sessionStorage.setItem('idts_auth_token', token)
    sessionStorage.setItem('idts_auth_user', JSON.stringify(user))
    sessionStorage.setItem('idts_auth_expires', expiresAt)
  }, session)
}

async function createDraft (page, token, bugID) {
  const response = await page.request.post(`${BASE_URL}/odata/v4/bug/Bugs`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      ID: bugID,
      title: `IDTS-116 standard attachment QA ${Date.now()}`,
      description: 'Verify the generated CAP attachment facet follows the parent Bug draft lifecycle.',
      stepsToReproduce: 'Create the Bug draft, upload evidence, and save.',
      actualResult: 'The standard attachment control stores the draft attachment.',
      expectedResult: 'Save activates the Bug and its attachment without a custom browser queue.',
      priority_code: 'HIGH',
      severity_code: 'MAJOR',
      environment_code: 'QAS',
      environmentDetail: 'Browser QA',
      applicationComponent_ID: COMPONENT,
      defectCategory_ID: CATEGORY
    }
  })
  if (!response.ok()) throw new Error(`Create QA draft failed with HTTP ${response.status()}.`)
}

async function readActiveBug (page, token, bugID) {
  const response = await page.request.get(
    `${BASE_URL}/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)?$select=ID,bugNumber&$expand=attachments($select=ID,filename,mimeType,fileSize)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return { ok: response.ok(), body: response.ok() ? await response.json() : null }
}

async function waitForActiveAttachment (page, token, bugID, filename) {
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    const result = await readActiveBug(page, token, bugID)
    const attachment = result.body?.attachments?.find(item => item.filename === filename)
    if (result.ok && attachment) return attachment
    await page.waitForTimeout(750)
  }
  throw new Error(`Saved Bug did not expose ${filename}.`)
}

async function cleanupLocal (db, bugID, sessionID) {
  await db.run(DELETE.from('idts.cap.Bugs.attachments.drafts').where({ up__ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Bugs.attachments').where({ up__ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Bugs.drafts').where({ ID: bugID })).catch(() => {})
  await db.run(DELETE.from('idts.cap.Bugs').where({ ID: bugID })).catch(() => {})
  if (sessionID) await db.run(DELETE.from('idts.cap.AuthSessions').where({ ID: sessionID })).catch(() => {})
}

async function main () {
  if (!ALLOW_MUTATION) throw new Error('Set IDTS_QA_ALLOW_MUTATION=true to create the controlled QA Bug.')

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const db = IS_LOCAL ? await cds.connect.to('db') : null
  const session = IS_LOCAL ? await createLocalSession(db) : await loginRemote()
  const bugID = randomUUID()
  const browser = await launchBrowser()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await injectSession(context, session)
  const page = await context.newPage()
  const harness = await createHarness(page, { evidenceDir: EVIDENCE_DIR, settleMs: 1200 })

  try {
    await createDraft(page, session.token, bugID)
    await page.goto(`${APP_URL}#/Bugs(ID=${bugID},IsActiveEntity=false)`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.getByRole('heading', { name: /Evidence \/ Attachments/i }).first().waitFor({ state: 'visible', timeout: 90000 })
    if (await page.getByRole('heading', { name: /^Comments$/i }).first().isVisible().catch(() => false)) {
      throw new Error('Comments must remain hidden on a new Bug draft.')
    }

    const file = {
      name: `idts116-evidence-${Date.now()}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from('IDTS-116 SAP-standard draft attachment evidence', 'utf8')
    }
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.waitFor({ state: 'attached', timeout: 30000 })
    await fileInput.setInputFiles(file)
    await page.getByText(file.name, { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
    await harness.screenshot('idts116_standard_attachment_in_draft')

    const save = page.getByRole('button', { name: /^(Create|Save)$/i }).first()
    await save.click()
    const attachment = await waitForActiveAttachment(page, session.token, bugID, file.name)
    const download = await page.request.get(
      `${BASE_URL}/odata/v4/bug/Bugs_attachments(ID=${attachment.ID},IsActiveEntity=true)/content`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    )
    if (!download.ok()) throw new Error(`Attachment download failed with HTTP ${download.status()}.`)
    const actualHash = createHash('sha256').update(await download.body()).digest('hex')
    const expectedHash = createHash('sha256').update(file.buffer).digest('hex')
    if (actualHash !== expectedHash) throw new Error('Downloaded attachment SHA-256 does not match the uploaded bytes.')

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.getByText(file.name, { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
    await harness.assertNoBlockingSignals('IDTS-116 standard attachment completion')
    await harness.screenshot('idts116_standard_attachment_after_reload')
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'idts116-standard-attachment-browser.json'), JSON.stringify({
      task: 'IDTS-116',
      checkedAt: new Date().toISOString(),
      target: IS_LOCAL ? 'local' : 'shared-qa',
      result: 'PASS',
      checks: ['generated facet visible', 'draft upload visible', 'save activation', 'reload persistence', 'download hash']
    }, null, 2))
    console.log('RESULT: PASS')
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    if (db) await cleanupLocal(db, bugID, session.sessionID)
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error && error.stack ? error.stack : error)
  process.exit(1)
})
