#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'
process.env.CDS_PLUGIN_UI5_ACTIVE = 'false'
process.env.CDS_TEST_FAKE = 'true'

const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const path = require('node:path')
const Module = require('node:module')

const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { hashPassword } = require('../../srv/auth/passwords')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const BUG_ID = '90000000-0000-0000-0000-000000000001'
const TEST_EMAIL = 'nhant@example.local'
const PM_EMAIL = 'donhv@example.local'
const TEST_PASSWORD = `idts127-${randomUUID()}`
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const DAT_PROFILE_ID = '20000000-0000-0000-0000-000000000002'
const FIORI_PROFILE_ID = '20000000-0000-0000-0000-000000000003'
const DAT_USER_ID = '10000000-0000-0000-0000-000000000003'
const FIORI_USER_ID = '10000000-0000-0000-0000-000000000005'

async function json (url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = { text } }
  return { status: response.status, body }
}

async function makeDeveloperAssignable (db, userID, email, marker) {
  const identityKeyHash = marker.repeat(64)
  await db.run(cds.ql.UPDATE('idts.cap.Users').set({ externalIdentityKeyHash: identityKeyHash }).where({ ID: userID }))
  await db.run(cds.ql.INSERT.into('idts.cap.UserOnboardingRequests').entries({
    ID: cds.utils.uuid(),
    targetEmailNormalized: email,
    requestedRole_code: 'DEVELOPER',
    userAdminRequested: false,
    status_code: 'ACTIVE',
    requestedBy_ID: '10000000-0000-0000-0000-000000000001',
    expiresAt: '2099-01-01T00:00:00.000Z',
    tokenNonce: `idts127-${marker}`,
    tokenHash: identityKeyHash,
    identityKeyHash,
    identityEmailNormalized: email,
    activeUser_ID: userID,
    provisioningVersion: 1,
    correlationId: cds.utils.uuid()
  }))
}

async function loginAs (baseUrl, email) {
  const login = await json(`${baseUrl}/odata/v4/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: TEST_PASSWORD })
  })
  assert.equal(login.status, 200, `${email} login must succeed`)
  return {
    authorization: `Bearer ${login.body.token}`,
    'content-type': 'application/json'
  }
}

async function main () {
  const cdsTest = require('@cap-js/cds-test')
  cds.env.requires.db = { impl: '@cap-js/sqlite', kind: 'sqlite', credentials: { url: ':memory:' } }
  cds.env.requires.malwareScanner = { kind: 'malwareScanner-mocked', model: '@cap-js/attachments/srv/malware-scanner/malwareScanner-mocked' }
  const test = cdsTest('serve', 'srv/service.cds', 'srv/auth.cds', '@sap/cds/srv/outbox', '@cap-js/attachments/srv/malware-scanner/malwareScanner-mocked', '--in-memory?').in(PROJECT_ROOT)
  await test

  try {
    const db = cds.db || await cds.connect.to('db')
    await db.run(cds.ql.UPDATE('idts.cap.Users').set({
      passwordHash: await hashPassword(TEST_PASSWORD),
      passwordChangedAt: '2026-09-12T00:00:00.000Z'
    }).where({ email: { in: [TEST_EMAIL, PM_EMAIL] } }))
    await makeDeveloperAssignable(db, DAT_USER_ID, 'datdt@example.local', 'd')
    await makeDeveloperAssignable(db, FIORI_USER_ID, 'dev.fiori01@example.local', 'f')

    const headers = await loginAs(test.url, TEST_EMAIL)
    const pmHeaders = await loginAs(test.url, PM_EMAIL)

    const existingDraft = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)`, { headers })
    if (existingDraft.status === 200) {
      const discarded = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)`, {
        method: 'DELETE',
        headers
      })
      assert.equal(discarded.status, 204, 'existing draft cleanup must succeed')
    } else {
      assert.equal(existingDraft.status, 404, 'draft preflight must return 200 or 404')
    }

    const beforeEvents = await db.run(cds.ql.SELECT.from('idts.cap.HistoryEvents').columns('ID').where({
      bug_ID: BUG_ID,
      actionType_code: 'EDIT'
    }))
    const beforeNotifications = await db.run(cds.ql.SELECT.from('idts.cap.Notifications').columns('ID').where({ bug_ID: BUG_ID }))

    const draftEdit = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=true)/BugService.draftEdit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ PreserveChanges: true })
    })
    assert.ok(draftEdit.status >= 200 && draftEdit.status < 300, `draftEdit returned ${draftEdit.status}`)

    const title = `IDTS-127 single audit ${Date.now()}`
    const patch = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title })
    })
    assert.ok(patch.status >= 200 && patch.status < 300, `draft PATCH returned ${patch.status}`)

    const activate = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)/BugService.draftActivate`, {
      method: 'POST',
      headers,
      body: '{}'
    })
    assert.ok(activate.status >= 200 && activate.status < 300, `draftActivate returned ${activate.status}`)

    const active = await db.run(cds.ql.SELECT.one.from('idts.cap.Bugs').columns('title').where({ ID: BUG_ID }))
    const afterEvents = await db.run(cds.ql.SELECT.from('idts.cap.HistoryEvents').columns('ID', 'summary', 'reason').where({
      bug_ID: BUG_ID,
      actionType_code: 'EDIT'
    }))
    const newEventIDs = afterEvents.filter(event => !beforeEvents.some(before => before.ID === event.ID)).map(event => event.ID)
    const logs = newEventIDs.length
      ? await db.run(cds.ql.SELECT.from('idts.cap.HistoryLogs').columns('event_ID', 'fieldName', 'newValue').where({ event_ID: { in: newEventIDs } }))
      : []
    const afterNotifications = await db.run(cds.ql.SELECT.from('idts.cap.Notifications').columns('ID').where({ bug_ID: BUG_ID }))

    assert.equal(active.title, title, 'draft Save must persist the intended title')
    assert.equal(newEventIDs.length, 1, `one draft Save must create exactly one grouped EDIT history event; observed=${JSON.stringify(afterEvents.filter(event => newEventIDs.includes(event.ID)))}`)
    assert.deepEqual(logs.map(log => log.fieldName), ['title'], 'the grouped event must contain only the intended title change')
    assert.equal(afterNotifications.length, beforeNotifications.length, 'title-only Save must not create a workflow notification')

    console.log('PASS UAT-BUG-008 local draft protocol')
    console.log(`History delta: ${newEventIDs.length}; fields: ${logs.map(log => log.fieldName).join(', ')}`)
    console.log(`Notification delta: ${afterNotifications.length - beforeNotifications.length}`)

    const initialAssign = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=true)/BugService.assignToDeveloper`, {
      method: 'POST',
      headers: pmHeaders,
      body: JSON.stringify({ assigneeID: DAT_PROFILE_ID, note: 'IDTS-127 initial assignment fixture' })
    })
    assert.equal(initialAssign.status, 200, `initial assignment returned ${initialAssign.status}`)

    const beforeReassignEvents = await db.run(cds.ql.SELECT.from('idts.cap.HistoryEvents').columns('ID').where({
      bug_ID: BUG_ID,
      actionType_code: 'ASSIGN_TO_DEVELOPER'
    }))
    const beforeReassignNotifications = await db.run(cds.ql.SELECT.from('idts.cap.Notifications').columns('ID').where({ bug_ID: BUG_ID }))
    const reassign = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=true)/BugService.assignToDeveloper`, {
      method: 'POST',
      headers: pmHeaders,
      body: JSON.stringify({ assigneeID: FIORI_PROFILE_ID, note: 'IDTS-127 controlled reassignment' })
    })
    assert.equal(reassign.status, 200, `reassignment returned ${reassign.status}`)

    const reassignedBug = await db.run(cds.ql.SELECT.one.from('idts.cap.Bugs').columns('assignee_ID', 'nextProcessorUser_ID').where({ ID: BUG_ID }))
    const afterReassignEvents = await db.run(cds.ql.SELECT.from('idts.cap.HistoryEvents').columns('ID').where({
      bug_ID: BUG_ID,
      actionType_code: 'ASSIGN_TO_DEVELOPER'
    }))
    const newReassignEventIDs = afterReassignEvents.filter(event => !beforeReassignEvents.some(before => before.ID === event.ID)).map(event => event.ID)
    const reassignLogs = await db.run(cds.ql.SELECT.from('idts.cap.HistoryLogs').columns('fieldName', 'oldValue', 'newValue').where({ event_ID: { in: newReassignEventIDs } }))
    const afterReassignNotifications = await db.run(cds.ql.SELECT.from('idts.cap.Notifications').columns('ID', 'recipient_ID', 'eventType_code').where({ bug_ID: BUG_ID }))
    const newReassignNotifications = afterReassignNotifications.filter(notification => !beforeReassignNotifications.some(before => before.ID === notification.ID))

    assert.equal(reassignedBug.assignee_ID, FIORI_PROFILE_ID, 'reassignment must persist the selected Developer profile')
    assert.equal(reassignedBug.nextProcessorUser_ID, FIORI_USER_ID, 'reassignment must persist the new Developer as current action owner')
    assert.equal(newReassignEventIDs.length, 1, 'one reassignment must create exactly one assignment history event')
    assert.ok(reassignLogs.some(log => log.fieldName === 'assignee' && log.oldValue === DAT_PROFILE_ID && log.newValue === FIORI_PROFILE_ID), 'history must record the exact old and new assignee')
    assert.deepEqual(newReassignNotifications.map(notification => ({ recipientID: notification.recipient_ID, eventType: notification.eventType_code })), [
      { recipientID: FIORI_USER_ID, eventType: 'REASSIGNED' }
    ], 'one reassignment must create exactly one REASSIGNED notification for the new Developer')

    console.log('PASS UAT-ASG-007 local reassignment side effects')
    console.log(`History delta: ${newReassignEventIDs.length}; notification delta: ${newReassignNotifications.length}; event: ${newReassignNotifications[0].eventType_code}`)

    const attachmentDraft = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=true)/BugService.draftEdit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ PreserveChanges: true })
    })
    assert.ok(attachmentDraft.status >= 200 && attachmentDraft.status < 300, `attachment draftEdit returned ${attachmentDraft.status}`)

    const attachmentID = cds.utils.uuid()
    const filename = 'idts127-over-limit.txt'
    const metadata = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)/attachments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ID: attachmentID, filename, mimeType: 'text/plain', fileSize: MAX_ATTACHMENT_BYTES + 1 })
    })
    assert.equal(metadata.status, 201, 'draft metadata preparation must succeed before content upload')

    const oversized = await json(`${test.url}/odata/v4/bug/Bugs_attachments(ID=${attachmentID},IsActiveEntity=false)/content`, {
      method: 'PUT',
      headers: {
        authorization: headers.authorization,
        'content-type': 'text/plain',
        'content-disposition': `attachment; filename="${filename}"`
      },
      body: Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 97)
    })
    const oversizedMessage = JSON.stringify(oversized.body)
    assert.equal(oversized.status, 413, '10 MB + 1 byte must return HTTP 413')
    assert.match(oversizedMessage, /exceeds the maximum allowed limit/i, '413 response must explain that the size exceeds the limit')
    assert.match(oversizedMessage, /10MB/i, '413 response must name the 10 MB limit')

    const activeAttachment = await db.run(cds.ql.SELECT.one.from('idts.cap.Bugs.attachments').columns('ID').where({ ID: attachmentID }))
    assert.equal(activeAttachment, undefined, 'failed oversized upload must not create active attachment metadata')
    const discard = await json(`${test.url}/odata/v4/bug/Bugs(ID=${BUG_ID},IsActiveEntity=false)`, {
      method: 'DELETE',
      headers
    })
    assert.equal(discard.status, 204, 'oversized-upload draft must remain safely discardable')

    console.log('PASS UAT-ATT-005 backend boundary')
    console.log('HTTP 413 includes the file-size explanation and 10 MB limit; active attachment delta: 0')
  } finally {
    if (test.server?.listening) await new Promise(resolve => test.server.close(resolve))
  }
}

main().catch(error => {
  console.error('FAIL IDTS-127 focused HTTP verification')
  console.error(error.message)
  process.exit(1)
})
