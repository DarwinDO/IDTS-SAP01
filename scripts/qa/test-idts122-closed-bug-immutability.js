'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql

const BUG_ID = '90000000-0000-0000-0000-000000000003'
const ATTACHMENT_ID = '92000000-0000-0000-0000-000000000122'
const COMMENT_ID = '93000000-0000-0000-0000-000000000122'
const NHAN_USER_ID = '10000000-0000-0000-0000-000000000004'
const BACKUP_TESTER_ID = '10000000-0000-0000-0000-000000000122'
const DON_USER_ID = '10000000-0000-0000-0000-000000000001'
const TMP_DIR = path.join(process.cwd(), '.tmp')
const DB_FILE = path.join(TMP_DIR, 'qa-idts122-closed.sqlite')

function user (id, role) {
  return new cds.User({ id, roles: [role, 'authenticated-user'] })
}

function request ({ event, target, actor, data = {}, params = [{ ID: BUG_ID, IsActiveEntity: true }], query }) {
  return new cds.Request({
    method: event === 'DELETE' ? 'DELETE' : (event === 'PUT' ? 'PUT' : (event === 'UPDATE' || event === 'PATCH' ? 'PATCH' : 'POST')),
    event,
    target,
    params,
    data,
    query,
    user: actor
  })
}

async function expect409 (label, action) {
  await assert.rejects(action, error => {
    if (Number(error.code || error.statusCode || error.status) !== 409) {
      console.error(`  DIAGNOSTIC ${label}:`, error.code || error.statusCode || error.status, error.message)
    }
    assert.equal(Number(error.code || error.statusCode || error.status), 409, `${label} must return HTTP 409`)
    assert.match(String(error.message), /Closed bugs are read-only/i)
    return true
  })
  console.log(`  PASS  ${label}`)
}

async function expectDraftRootRejection (label, action) {
  await assert.rejects(action, error => {
    assert.equal(Number(error.code || error.statusCode || error.status), 422)
    assert.match(String(error.message), /DRAFT_MODIFICATION_ONLY_VIA_ROOT/i)
    return true
  })
  console.log(`  PASS  ${label}`)
}

async function expectStatus (label, expectedStatus, action) {
  await assert.rejects(action, error => {
    assert.equal(Number(error.code || error.statusCode || error.status), expectedStatus, `${label} must return HTTP ${expectedStatus}`)
    return true
  })
  console.log(`  PASS  ${label}`)
}

async function main () {
  fs.mkdirSync(TMP_DIR, { recursive: true })
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE)

  console.log('\n================================================')
  console.log(' IDTS-122 Closed Bug Aggregate Immutability')
  console.log('================================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: DB_FILE } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)
  const Bugs = srv.entities.Bugs
  const Comments = srv.entities.Comments
  const Attachments = srv.entities['Bugs.attachments']
  const PhysicalAttachments = 'idts.cap.Bugs.attachments'
  const PhysicalComments = 'idts.cap.Comments'
  const PhysicalUsers = 'idts.cap.Users'
  const HistoryEvents = 'idts.cap.HistoryEvents'
  const HistoryLogs = 'idts.cap.HistoryLogs'
  const Notifications = 'idts.cap.Notifications'
  const Deliveries = 'idts.cap.NotificationDeliveries'

  await db.run(DELETE.from(PhysicalUsers).where({ ID: BACKUP_TESTER_ID }))
  await db.run(INSERT.into(PhysicalUsers).entries({
    ID: BACKUP_TESTER_ID,
    displayName: 'Backup Retest Tester',
    email: 'backup.retest@example.local',
    role_code: 'TESTER',
    active: true
  }))

  await db.run(UPDATE(Bugs).set({
    status_code: 'CLOSED',
    reporter_ID: NHAN_USER_ID,
    retestOwner_ID: NHAN_USER_ID,
    nextProcessorUser_ID: null,
    nextProcessorRole_code: 'NONE'
  }).where({ ID: BUG_ID }))
  await db.run(DELETE.from(PhysicalAttachments).where({ ID: ATTACHMENT_ID }))
  await db.run(INSERT.into(PhysicalAttachments).entries({
    ID: ATTACHMENT_ID,
    up__ID: BUG_ID,
    filename: 'closed-proof.txt',
    mimeType: 'text/plain',
    fileSize: 12
  }))
  await db.run(DELETE.from(PhysicalComments).where({ ID: COMMENT_ID }))
  await db.run(INSERT.into(PhysicalComments).entries({
    ID: COMMENT_ID,
    bug_ID: BUG_ID,
    author_ID: NHAN_USER_ID,
    authorRole_code: 'TESTER',
    content: 'Existing closed comment'
  }))

  const tester = user('NhanT', 'TESTER')
  const developer = user('SangVN', 'DEVELOPER')
  const pm = user('DonHV', 'PM')
  const blockedAttachmentID = cds.utils.uuid()
  const before = await snapshot(db, Bugs, Comments, HistoryEvents)

  await expect409('draft EDIT is blocked before draft creation', () => srv.dispatch(request({ event: 'EDIT', target: Bugs, actor: tester })))
  await expect409('active UPDATE is blocked', () => srv.dispatch(request({
    event: 'UPDATE',
    target: Bugs,
    actor: pm,
    data: { title: 'must not persist' },
    query: UPDATE(Bugs).set({ title: 'must not persist' }).where({ ID: BUG_ID })
  })))
  await expect409('active DELETE is blocked', () => srv.dispatch(request({
    event: 'DELETE',
    target: Bugs,
    actor: pm,
    query: DELETE.from(Bugs).where({ ID: BUG_ID })
  })))
  await expect409('Developer assignment is blocked', () => srv.dispatch(request({
    event: 'assignToDeveloper',
    target: Bugs,
    actor: pm,
    data: { assigneeID: '20000000-0000-0000-0000-000000000001', note: 'blocked' }
  })))
  await expect409('bound comment is blocked', () => srv.dispatch(request({
    event: 'addComment',
    target: Bugs,
    actor: tester,
    data: { content: 'must not persist' }
  })))
  assert.equal(
    (await db.run(SELECT.one.from(PhysicalComments).where({ ID: COMMENT_ID })))?.content,
    'Existing closed comment',
    'Rejected comment mutation must preserve existing content'
  )
  console.log('  PASS  existing comment content is preserved; mutation-route proof remains a browser/API acceptance item')
  await expect409('attachment delete is blocked for a Closed Bug', () => srv.dispatch(request({
    event: 'DELETE',
    target: Attachments,
    actor: tester,
    params: [{ ID: BUG_ID }, { ID: ATTACHMENT_ID }],
    data: { ID: ATTACHMENT_ID },
    query: DELETE.from(Attachments).where({ ID: ATTACHMENT_ID })
  })))
  await expect409('repeated close action is blocked', () => srv.dispatch(request({
    event: 'closeBug',
    target: Bugs,
    actor: tester
  })))

  const afterBlocked = await snapshot(db, Bugs, Comments, HistoryEvents)
  assert.deepEqual(afterBlocked, before, 'Rejected Closed mutations must not change Bug, comments or history totals')
  assert.ok(await db.run(SELECT.one.from(PhysicalAttachments).where({ ID: ATTACHMENT_ID })), 'Rejected attachment delete must preserve metadata')
  assert.equal((await db.run(SELECT.from(Bugs.drafts).where({ ID: BUG_ID }))).length, 0, 'Rejected EDIT must not create a draft')
  console.log('  PASS  rejected operations leave aggregate state unchanged')

  await expectStatus('Tester cannot reassign retest owner', 403, () => srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: tester,
    data: { retestOwnerID: BACKUP_TESTER_ID, reason: 'Not authorized' }
  })))
  await expectStatus('Developer cannot reassign retest owner', 403, () => srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: developer,
    data: { retestOwnerID: BACKUP_TESTER_ID, reason: 'Not authorized' }
  })))
  await expectStatus('blank reassignment reason is rejected', 400, () => srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: pm,
    data: { retestOwnerID: BACKUP_TESTER_ID, reason: '   ' }
  })))
  await expectStatus('non-Tester reassignment target is rejected', 400, () => srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: pm,
    data: { retestOwnerID: DON_USER_ID, reason: 'Invalid target role' }
  })))
  await expectStatus('same retest owner is rejected', 409, () => srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: pm,
    data: { retestOwnerID: NHAN_USER_ID, reason: 'No-op is not allowed' }
  })))

  await db.run(UPDATE(Bugs).set({
    status_code: 'RETEST_REQUIRED',
    retestOwner_ID: NHAN_USER_ID,
    nextProcessorUser_ID: NHAN_USER_ID,
    nextProcessorRole_code: 'TESTER'
  }).where({ ID: BUG_ID }))
  await srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: pm,
    data: { retestOwnerID: BACKUP_TESTER_ID, reason: 'Retest handover check' }
  }))
  const afterRetestReassign = await db.run(SELECT.one.from(Bugs).where({ ID: BUG_ID }))
  assert.equal(afterRetestReassign.status_code, 'RETEST_REQUIRED')
  assert.equal(afterRetestReassign.retestOwner_ID, BACKUP_TESTER_ID)
  assert.equal(afterRetestReassign.nextProcessorUser_ID, BACKUP_TESTER_ID)
  assert.equal(afterRetestReassign.nextProcessorRole_code, 'TESTER')
  console.log('  PASS  PM reassignment at RETEST_REQUIRED persists owner and next processor')

  await db.run(UPDATE(Bugs).set({
    status_code: 'CLOSED',
    retestOwner_ID: NHAN_USER_ID,
    nextProcessorUser_ID: null,
    nextProcessorRole_code: 'NONE'
  }).where({ ID: BUG_ID }))

  await srv.dispatch(request({
    event: 'reassignRetestOwner',
    target: Bugs,
    actor: pm,
    data: { retestOwnerID: BACKUP_TESTER_ID, reason: 'Tester continuity check' }
  }))
  const afterReassign = await db.run(SELECT.one.from(Bugs).where({ ID: BUG_ID }))
  assert.equal(afterReassign.status_code, 'CLOSED')
  assert.equal(afterReassign.retestOwner_ID, BACKUP_TESTER_ID)
  assert.equal(afterReassign.nextProcessorUser_ID, null)
  const ownerEvent = await db.run(SELECT.one.from(HistoryEvents).where({
    bug_ID: BUG_ID,
    actionType_code: 'REASSIGN_RETEST_OWNER'
  }))
  assert.ok(ownerEvent, 'Reassignment must have a dedicated history event')
  const ownerLog = await db.run(SELECT.one.from(HistoryLogs).where({ event_ID: ownerEvent.ID, fieldName: 'retestOwner' }))
  assert.equal(ownerLog?.oldValueDisplay, 'NhanT')
  assert.equal(ownerLog?.newValueDisplay, 'Backup Retest Tester')
  const notification = await db.run(SELECT.one.from(Notifications).where({
    bug_ID: BUG_ID,
    recipient_ID: BACKUP_TESTER_ID,
    eventType_code: 'UPDATED'
  }))
  assert.ok(notification, 'Target Tester must receive an in-app notification record')
  assert.ok(await db.run(SELECT.one.from(Deliveries).where({ notification_ID: notification.ID })), 'Notification must create one delivery outbox row')
  console.log('  PASS  PM retest-owner reassignment is the narrow Closed exception')

  const backupTester = user('Backup Retest Tester', 'TESTER')
  await srv.dispatch(request({ event: 'reopenBug', target: Bugs, actor: backupTester, data: { reason: 'Regression reproduced' } }))
  await srv.dispatch(request({
    event: 'UPDATE',
    target: Bugs,
    actor: pm,
    data: { environmentDetail: 'Updated after reopen' },
    query: UPDATE(Bugs).set({ environmentDetail: 'Updated after reopen' }).where({ ID: BUG_ID })
  }))
  const reopened = await db.run(SELECT.one.from(Bugs).where({ ID: BUG_ID }))
  assert.equal(reopened.status_code, 'REOPENED')
  assert.equal(reopened.environmentDetail, 'Updated after reopen')
  console.log('  PASS  reopen restores ordinary mutation flow')

  console.log('\nRESULT: PASS')
}

async function snapshot (db, Bugs, Comments, HistoryEvents) {
  const bug = await db.run(SELECT.one.from(Bugs).where({ ID: BUG_ID }))
  const comments = await db.run(SELECT.from(Comments).where({ bug_ID: BUG_ID }))
  const history = await db.run(SELECT.from(HistoryEvents).where({ bug_ID: BUG_ID }))
  return {
    bug: {
      title: bug.title,
      status_code: bug.status_code,
      assignee_ID: bug.assignee_ID,
      reporter_ID: bug.reporter_ID,
      retestOwner_ID: bug.retestOwner_ID,
      nextProcessorUser_ID: bug.nextProcessorUser_ID,
      nextProcessorRole_code: bug.nextProcessorRole_code,
      modifiedAt: bug.modifiedAt
    },
    commentCount: comments.length,
    historyCount: history.length
  }
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error?.stack || error)
  process.exitCode = 1
})
