#!/usr/bin/env node
'use strict'

// Shared-QA acceptance helper. It intentionally requires all identities from
// private environment variables and records only aliases, HTTP outcomes, and
// cryptographic hashes in the checked-in evidence.

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const EVIDENCE_DIR = process.env.IDTS_QA_EVIDENCE_DIR || path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-79')
const STATE_FILE = path.join(EVIDENCE_DIR, 'idts79-shared-human-acceptance-state.json')
const RESULT_FILE = path.join(EVIDENCE_DIR, 'idts79-shared-human-acceptance.json')
const BASE_URL = String(process.env.IDTS_QA_BASE_URL || '').replace(/\/+$/, '')
const PHASE = process.argv[2] || 'create'

const COMPONENT = '40000000-0000-0000-0000-000000000001'
const CATEGORY = '50000000-0000-0000-0000-000000000001'
const DATDT_PROFILE = '20000000-0000-0000-0000-000000000002'

function required (name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing private environment variable: ${name}.`)
  return value
}

function account (alias, emailVariable) {
  return { alias, email: required(emailVariable), password: required('IDTS_QA_SHARED_PASSWORD') }
}

function redactResult (result) {
  return {
    alias: result.alias,
    role: result.role,
    loginStatus: result.loginStatus,
    tokenReceived: result.tokenReceived
  }
}

async function login (definition) {
  const response = await fetch(`${BASE_URL}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: definition.email, password: definition.password })
  })
  if (!response.ok) throw new Error(`${definition.alias} login failed with HTTP ${response.status}.`)
  const payload = await response.json()
  const value = payload?.value || payload
  if (!value?.token || !value?.user) throw new Error(`${definition.alias} login returned an incomplete session.`)
  return {
    alias: definition.alias,
    role: value.user.role_code || value.user.roleCode || 'UNKNOWN',
    loginStatus: response.status,
    tokenReceived: true,
    token: value.token
  }
}

async function request (session, method, suffix, body, options = {}) {
  const headers = { authorization: `Bearer ${session.token}` }
  if (body !== undefined) headers['content-type'] = options.contentType || 'application/json'
  const response = await fetch(`${BASE_URL}${suffix}`, { method, headers, body })
  const raw = await response.text()
  let json = null
  try { json = raw ? JSON.parse(raw) : null } catch (_) {}
  return { response, json, raw }
}

function expectStatus (label, result, expected) {
  if (result.response.status !== expected) {
    const safeDetail = String(result.raw || '').replace(/postgres(?:ql)?:\/\/[^\s]+/ig, '[redacted]')
    throw new Error(`${label} expected HTTP ${expected}, received ${result.response.status}: ${safeDetail.slice(0, 240)}`)
  }
}

function expectStatusOneOf (label, result, expectedStatuses) {
  if (expectedStatuses.includes(result.response.status)) return
  const safeDetail = String(result.raw || '').replace(/postgres(?:ql)?:\/\/[^\s]+/ig, '[redacted]')
  throw new Error(`${label} expected HTTP ${expectedStatuses.join(' or ')}, received ${result.response.status}: ${safeDetail.slice(0, 240)}`)
}

function actionPath (bugID, action) {
  return `/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=true)/BugService.${action}`
}

async function action (session, bugID, name, body, expectedStatus = 200) {
  const result = await request(session, 'POST', actionPath(bugID, name), JSON.stringify(body || {}))
  expectStatus(`${session.alias} ${name}`, result, expectedStatus)
  const value = result.json?.value || result.json || {}
  return { name, actor: session.alias, status: value.status_code || null }
}

async function readAttachment (session, attachmentID) {
  const result = await request(session, 'GET', `/odata/v4/bug/Bugs_attachments(ID=${attachmentID},IsActiveEntity=true)/content`)
  return { status: result.response.status, bytes: Buffer.from(result.raw, 'binary') }
}

function sha256 (value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function writeJson (file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(body, null, 2))
}

async function createPhase () {
  if (!BASE_URL) throw new Error('IDTS_QA_BASE_URL is required for Shared QA acceptance.')
  const pm = await login(account('PM', 'IDTS_QA_PM_EMAIL'))
  const developer = await login(account('Developer', 'IDTS_QA_DEVELOPER_EMAIL'))
  const tester = await login(account('Tester', 'IDTS_QA_TESTER_EMAIL'))
  const startedAt = new Date().toISOString()
  const marker = `UAT-MENTOR-20260711-${Date.now()}`
  const bugID = crypto.randomUUID()
  const attachmentID = crypto.randomUUID()
  const attachmentBytes = Buffer.from(`${marker}: safe text attachment used for Shared QA persistence proof.`, 'utf8')
  const filename = `${marker.toLowerCase()}-attachment.txt`

  const create = await request(pm, 'POST', '/odata/v4/bug/Bugs', JSON.stringify({
    ID: bugID,
    title: `${marker} lifecycle and attachment acceptance`,
    description: 'Controlled Shared QA acceptance record. It contains no production data.',
    stepsToReproduce: 'Run the approved PM, Developer, and Tester lifecycle acceptance flow.',
    actualResult: 'Acceptance evidence should remain available after the service restarts.',
    expectedResult: 'Workflow, attachment persistence, email delivery, and deletion behave safely.',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'Shared QA acceptance',
    applicationComponent_ID: COMPONENT,
    defectCategory_ID: CATEGORY
  }))
  expectStatus('PM creates the controlled acceptance bug', create, 201)

  // CAP draft activation is required only when the direct create endpoint
  // returned a draft representation. This keeps the helper compatible with
  // the deployed service’s draft behavior without guessing it.
  const created = create.json?.value || create.json || {}
  const isDraft = created.IsActiveEntity === false
  if (!isDraft) throw new Error('Shared QA create did not return an editable draft; attachment-before-save acceptance cannot continue safely.')

  const metadata = await request(pm, 'POST', `/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=false)/attachments`, JSON.stringify({
    ID: attachmentID,
    filename,
    mimeType: 'text/plain',
    fileSize: attachmentBytes.length
  }))
  expectStatus('PM creates draft attachment metadata', metadata, 201)

  const upload = await request(pm, 'PUT', `/odata/v4/bug/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)/content`, attachmentBytes, {
    contentType: 'text/plain'
  })
  expectStatus('PM uploads draft attachment', upload, 204)

  const activate = await request(pm, 'POST', `/odata/v4/bug/Bugs(ID=${bugID},IsActiveEntity=false)/BugService.draftActivate`, JSON.stringify({}))
  // CAP draft activation may return either 200 or 201 depending on the OData
  // adapter response shape. Both mean the active entity was created safely.
  expectStatusOneOf('PM activates draft', activate, [200, 201])

  const beforeRestart = await readAttachment(pm, attachmentID)
  if (beforeRestart.status !== 200 || sha256(beforeRestart.bytes) !== sha256(attachmentBytes)) {
    throw new Error('Attachment cannot be read back with the expected SHA-256 before restart.')
  }

  const steps = []
  steps.push(await action(pm, bugID, 'assignToDeveloper', { assigneeID: DATDT_PROFILE, note: 'Controlled mentor acceptance assignment.' }))
  steps.push(await action(developer, bugID, 'markInReview', { note: 'Developer reviewed the controlled acceptance bug.' }))
  steps.push(await action(developer, bugID, 'startProgress', { note: 'Developer started the controlled acceptance work.' }))
  steps.push(await action(developer, bugID, 'requestMoreInformation', { reason: 'Controlled request: confirm the reproduction detail.' }))
  steps.push(await action(tester, bugID, 'resubmitToDeveloper', { note: 'Tester confirmed the reproduction detail for acceptance.' }))
  steps.push(await action(developer, bugID, 'markInReview', { note: 'Developer reviewed the resubmission.' }))
  steps.push(await action(developer, bugID, 'startProgress', { note: 'Developer resumed work.' }))
  steps.push(await action(developer, bugID, 'resolveBug', { note: 'Developer resolved the controlled acceptance record.' }))
  steps.push(await action(tester, bugID, 'sendToRetest', { note: 'Tester requested the controlled retest.' }))
  steps.push(await action(tester, bugID, 'closeBug', { note: 'Tester closed the controlled acceptance record.' }))
  steps.push(await action(pm, bugID, 'reopenBug', { reason: 'Controlled reopen verifies the final lifecycle branch.' }))
  steps.push(await action(developer, bugID, 'markInReview', { note: 'Developer reviewed after controlled reopen.' }))
  steps.push(await action(developer, bugID, 'startProgress', { note: 'Developer resumed after controlled reopen.' }))
  steps.push(await action(developer, bugID, 'resolveBug', { note: 'Developer resolved after controlled reopen.' }))
  steps.push(await action(tester, bugID, 'closeBug', { note: 'Tester closed the clean mentor demo record.' }))

  const state = {
    task: 'IDTS-79',
    marker,
    createdAt: startedAt,
    bugID,
    attachmentID,
    attachmentSha256: sha256(attachmentBytes),
    filename,
    roleLogins: [pm, developer, tester].map(redactResult),
    lifecycle: steps,
    expectedAfterRestart: 'closed record and attachment still readable before controlled delete'
  }
  writeJson(STATE_FILE, state)
  writeJson(RESULT_FILE, { ...state, phase: 'create', result: 'PASS', checkedAt: new Date().toISOString() })
  console.log('RESULT: PASS create/lifecycle/attachment-before-restart')
}

async function verifyDeletePhase () {
  if (!fs.existsSync(STATE_FILE)) throw new Error(`Missing state file: ${STATE_FILE}`)
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  const pm = await login(account('PM', 'IDTS_QA_PM_EMAIL'))
  const beforeDelete = await readAttachment(pm, state.attachmentID)
  if (beforeDelete.status !== 200 || sha256(beforeDelete.bytes) !== state.attachmentSha256) {
    throw new Error('Post-restart attachment persistence/hash proof failed.')
  }

  const remove = await request(pm, 'DELETE', `/odata/v4/bug/Bugs_attachments(ID=${state.attachmentID},IsActiveEntity=true)`)
  expectStatus('PM deletes the controlled attachment', remove, 204)
  const afterDelete = await readAttachment(pm, state.attachmentID)
  if (![404, 410].includes(afterDelete.status)) {
    throw new Error(`Deleted attachment content should be unavailable, received HTTP ${afterDelete.status}.`)
  }

  const result = {
    ...state,
    phase: 'post-restart-verify-delete',
    checkedAt: new Date().toISOString(),
    postRestartHashMatched: true,
    attachmentDeleteStatus: remove.response.status,
    postDeleteReadStatus: afterDelete.status,
    result: 'PASS'
  }
  writeJson(RESULT_FILE, result)
  console.log('RESULT: PASS post-restart persistence and delete')
}

if (PHASE === 'create') {
  createPhase().catch(error => { console.error(`RESULT: FAIL ${error.message}`); process.exit(1) })
} else if (PHASE === 'verify-delete') {
  verifyDeletePhase().catch(error => { console.error(`RESULT: FAIL ${error.message}`); process.exit(1) })
} else {
  console.error('Usage: node scripts/qa/test-idts79-shared-human-acceptance.js <create|verify-delete>')
  process.exit(2)
}
