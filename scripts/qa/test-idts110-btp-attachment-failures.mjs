import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const base = process.env.IDTS110_SHADOW_BASE
if (!base) throw new Error('IDTS110_SHADOW_BASE is required')

const auth = `Basic ${Buffer.from('nhant@example.local:').toString('base64')}`
const commonHeaders = { authorization: auth, accept: 'application/json' }

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...commonHeaders, ...(options.headers || {}) }
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { status: response.status, body }
}

async function json(path, method = 'GET', body) {
  return request(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
}

async function count(entity, bugID) {
  const result = await json(`/${entity}?$filter=bug_ID%20eq%20${bugID}&$count=true&$top=0`)
  assert.equal(result.status, 200, `${entity} count read failed`)
  return Number(result.body?.['@odata.count'] || 0)
}

async function bugState(bugID) {
  const [bug, history, notifications] = await Promise.all([
    json(`/Bugs(ID=${bugID},IsActiveEntity=true)?$select=ID,status_code`),
    count('HistoryEvents', bugID),
    count('Notifications', bugID)
  ])
  assert.equal(bug.status, 200, 'Bug read failed')
  return {
    status: bug.body.status_code,
    history,
    notifications
  }
}

async function readAttachment(id, active) {
  return json(`/Bugs_attachments(ID=${id},IsActiveEntity=${active})?$select=ID,url,filename,mimeType`)
}

async function beginCase(bugID, filename) {
  const before = await bugState(bugID)
  const existingDraft = await json(`/Bugs(ID=${bugID},IsActiveEntity=false)?$select=ID`)
  if (existingDraft.status === 404) {
    const edit = await json(`/Bugs(ID=${bugID},IsActiveEntity=true)/BugService.draftEdit`, 'POST', { PreserveChanges: true })
    assert.ok(edit.status >= 200 && edit.status < 300, `draftEdit failed: ${edit.status}`)
  } else {
    assert.equal(existingDraft.status, 200, `draft read failed: ${existingDraft.status}`)
  }

  const listed = await json(`/Bugs(ID=${bugID},IsActiveEntity=false)/attachments?$select=ID,filename&$filter=filename%20eq%20'${filename}'`)
  assert.equal(listed.status, 200, 'draft attachment list failed')
  const attachmentID = listed.body?.value?.[0]?.ID || randomUUID()
  if (listed.body?.value?.length) return { before, attachmentID }
  const metadata = await json(`/Bugs(ID=${bugID},IsActiveEntity=false)/attachments`, 'POST', {
    ID: attachmentID,
    filename,
    mimeType: 'text/plain',
    fileSize: 24
  })
  assert.ok(metadata.status >= 200 && metadata.status < 300, `metadata create failed: ${metadata.status}`)
  return { before, attachmentID }
}

function assertBugUnchanged(before, after) {
  assert.deepEqual(after, before, 'Bug workflow/history/notifications changed')
}

async function uploadFailure() {
  const bugID = '90000000-0000-0000-0000-000000000001'
  const { before, attachmentID } = await beginCase(bugID, 'ut-att-010.txt')
  const upload = await request(`/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)/content`, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain', 'content-disposition': 'attachment; filename="ut-att-010.txt"' },
    body: 'controlled upload failure'
  })
  assert.ok(upload.status >= 400, `expected upload failure, got ${upload.status}`)
  const [draft, active, after] = await Promise.all([
    readAttachment(attachmentID, false),
    readAttachment(attachmentID, true),
    bugState(bugID)
  ])
  assert.equal(draft.status, 200, 'prepared draft metadata must remain retryable')
  assert.equal(active.status, 404, 'failed upload must not create active metadata')
  assertBugUnchanged(before, after)
  return {
    caseId: 'UT-ATT-010', result: 'PASS', failureHttpStatus: upload.status,
    readback: { draftMetadata: 'RETRYABLE', activeMetadata: 'ABSENT', bugWorkflow: 'UNCHANGED', history: `${before.history}->${after.history}`, notifications: `${before.notifications}->${after.notifications}` }
  }
}

async function downloadFailure() {
  const bugID = '90000000-0000-0000-0000-000000000002'
  const { before, attachmentID } = await beginCase(bugID, 'ut-att-011.txt')
  const download = await request(`/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)/content`)
  assert.ok(download.status >= 400, `expected download failure, got ${download.status}`)
  const [draft, active, after] = await Promise.all([
    readAttachment(attachmentID, false),
    readAttachment(attachmentID, true),
    bugState(bugID)
  ])
  assert.equal(draft.status, 200, 'download failure must preserve draft metadata')
  assert.equal(active.status, 404, 'download failure must not create active metadata')
  assertBugUnchanged(before, after)
  return {
    caseId: 'UT-ATT-011', result: 'PASS', failureHttpStatus: download.status,
    readback: { draftMetadata: 'PRESERVED', activeMetadata: 'ABSENT', bugWorkflow: 'UNCHANGED', history: `${before.history}->${after.history}`, notifications: `${before.notifications}->${after.notifications}` }
  }
}

async function deleteFailure() {
  const bugID = '90000000-0000-0000-0000-000000000003'
  const { before, attachmentID } = await beginCase(bugID, 'ut-att-012.txt')
  const preparedUrl = await request(`/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)/content`, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain', 'content-disposition': 'attachment; filename="ut-att-012.txt"' },
    body: 'prepare controlled delete failure'
  })
  assert.ok(preparedUrl.status >= 400, `expected fixture upload failure, got ${preparedUrl.status}`)
  const deletion = await json(`/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)`, 'DELETE')
  assert.equal(deletion.status, 204, `transactional outbox delete must acknowledge metadata deletion: ${deletion.status}`)
  const [draft, active, after] = await Promise.all([
    readAttachment(attachmentID, false),
    readAttachment(attachmentID, true),
    bugState(bugID)
  ])
  assert.equal(draft.status, 404, 'acknowledged delete must remove draft metadata')
  assert.equal(active.status, 404, 'draft delete must not affect active metadata')
  assertBugUnchanged(before, after)
  return {
    caseId: 'UT-ATT-012', result: 'PASS', deleteHttpStatus: deletion.status,
    readback: { draftMetadata: 'DELETED', activeMetadata: 'ABSENT', bugWorkflow: 'UNCHANGED', history: `${before.history}->${after.history}`, notifications: `${before.notifications}->${after.notifications}`, objectDelete: 'TRANSACTIONAL_OUTBOX_READBACK_REQUIRED' }
  }
}

const startedAt = new Date().toISOString()
const cases = []
for (const run of [uploadFailure, downloadFailure, deleteFailure]) {
  cases.push(await run())
}

console.log(JSON.stringify({
  baselineSha: process.env.IDTS110_BASELINE_SHA,
  environment: 'BTP_SHADOW_HANA_INVALID_S3',
  startedAt,
  finishedAt: new Date().toISOString(),
  cases
}, null, 2))
