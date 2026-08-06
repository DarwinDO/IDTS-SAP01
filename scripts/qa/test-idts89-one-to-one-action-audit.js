'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cds = require('@sap/cds')

const { DELETE, SELECT, UPDATE } = cds.ql

const BUG_ID = '90000000-0000-0000-0000-000000000003'
const SANG_DEVELOPER_ID = '20000000-0000-0000-0000-000000000001'
const SANG_USER_ID = '10000000-0000-0000-0000-000000000002'
const NHAN_USER_ID = '10000000-0000-0000-0000-000000000004'
const DON_USER_ID = '10000000-0000-0000-0000-000000000001'

const workflowContract = [
  {
    action: 'assignToDeveloper',
    actionType: 'ASSIGN_TO_DEVELOPER',
    from: 'PENDING_ASSIGNMENT',
    data: { assigneeID: SANG_DEVELOPER_ID, note: 'IDTS-89 assign verification' },
    user: ['DonHV', ['PM', 'authenticated-user']],
    expected: { status: 'ASSIGNED', assignee: SANG_DEVELOPER_ID, nextUser: SANG_USER_ID, actor: DON_USER_ID, summary: 'Assigned bug to' }
  },
  {
    action: 'moveToPendingAssignment',
    actionType: 'MOVE_TO_PENDING_ASSIGNMENT',
    from: 'ASSIGNED',
    data: {},
    user: ['NhanT', ['TESTER', 'authenticated-user']],
    expected: { status: 'PENDING_ASSIGNMENT', assignee: null, nextUser: DON_USER_ID, actor: NHAN_USER_ID, summary: 'Moved bug to Pending Assignment.' }
  },
  {
    action: 'markInReview',
    actionType: 'MARK_IN_REVIEW',
    from: 'ASSIGNED',
    data: {},
    user: ['SangVN', ['DEVELOPER', 'authenticated-user']],
    expected: { status: 'IN_REVIEW', assignee: SANG_DEVELOPER_ID, nextUser: SANG_USER_ID, actor: SANG_USER_ID, summary: 'Marked bug as In Review.' }
  },
  {
    action: 'requestMoreInformation',
    actionType: 'REQUEST_MORE_INFORMATION',
    from: 'IN_PROGRESS',
    data: { reason: 'Need exact reproduction evidence.' },
    user: ['SangVN', ['DEVELOPER', 'authenticated-user']],
    expected: { status: 'NEED_MORE_INFORMATION', assignee: SANG_DEVELOPER_ID, nextUser: NHAN_USER_ID, actor: SANG_USER_ID, summary: 'Requested more information.' }
  },
  {
    action: 'resubmitToDeveloper',
    actionType: 'RESUBMIT_TO_DEVELOPER',
    from: 'NEED_MORE_INFORMATION',
    data: { note: 'Added the requested exact reproduction evidence.' },
    user: ['NhanT', ['TESTER', 'authenticated-user']],
    expected: { status: 'ASSIGNED', assignee: SANG_DEVELOPER_ID, nextUser: SANG_USER_ID, actor: NHAN_USER_ID, summary: 'Resubmitted bug to the assigned developer' }
  },
  {
    action: 'rejectBug',
    actionType: 'REJECT_BUG',
    from: 'ASSIGNED',
    data: { reason: 'Classification does not match the responsibility area.' },
    user: ['SangVN', ['DEVELOPER', 'authenticated-user']],
    expected: { status: 'REJECTED', assignee: SANG_DEVELOPER_ID, nextUser: NHAN_USER_ID, actor: SANG_USER_ID, summary: 'Rejected bug for follow-up.' }
  },
  {
    action: 'startProgress',
    actionType: 'START_PROGRESS',
    from: 'IN_REVIEW',
    data: {},
    user: ['SangVN', ['DEVELOPER', 'authenticated-user']],
    expected: { status: 'IN_PROGRESS', assignee: SANG_DEVELOPER_ID, nextUser: SANG_USER_ID, actor: SANG_USER_ID, summary: 'Started progress on the bug.' }
  },
  {
    action: 'resolveBug',
    actionType: 'RESOLVE_BUG',
    from: 'IN_PROGRESS',
    data: { note: 'Implemented and verified the correction.' },
    user: ['SangVN', ['DEVELOPER', 'authenticated-user']],
    expected: { status: 'RESOLVED', assignee: SANG_DEVELOPER_ID, nextUser: NHAN_USER_ID, actor: SANG_USER_ID, summary: 'Marked bug as resolved.' }
  },
  {
    action: 'sendToRetest',
    actionType: 'SEND_TO_RETEST',
    from: 'RESOLVED',
    data: {},
    user: ['NhanT', ['TESTER', 'authenticated-user']],
    expected: { status: 'RETEST_REQUIRED', assignee: SANG_DEVELOPER_ID, nextUser: NHAN_USER_ID, actor: NHAN_USER_ID, summary: 'Sent bug to retest.' }
  },
  {
    action: 'closeBug',
    actionType: 'CLOSE_BUG',
    from: 'RESOLVED',
    data: {},
    user: ['NhanT', ['TESTER', 'authenticated-user']],
    expected: { status: 'CLOSED', assignee: SANG_DEVELOPER_ID, nextUser: null, actor: NHAN_USER_ID, summary: 'Closed bug.' }
  },
  {
    action: 'reopenBug',
    actionType: 'REOPEN_BUG',
    from: 'CLOSED',
    data: { reason: 'Regression reproduced after closure.' },
    user: ['NhanT', ['TESTER', 'authenticated-user']],
    expected: { status: 'REOPENED', assignee: SANG_DEVELOPER_ID, nextUser: SANG_USER_ID, actor: NHAN_USER_ID, summary: 'Reopened bug.' }
  }
]

const legacyActionTypes = [
  'CREATE', 'EDIT', 'ASSIGN', 'REASSIGN', 'STATUS_CHANGE',
  'REQUEST_INFO', 'REJECT', 'RESOLVE', 'RETEST', 'CLOSE', 'REOPEN'
]

function requestUser ([id, roles]) {
  return new cds.User({ id, roles })
}

async function callAction (service, testCase, userOverride) {
  return service.dispatch(new cds.Request({
    method: 'POST',
    event: testCase.action,
    params: [{ ID: BUG_ID, IsActiveEntity: true }],
    data: testCase.data,
    user: userOverride || requestUser(testCase.user)
  }))
}

async function resetBug (db, entities, testCase) {
  await db.run(DELETE.from(entities.HistoryLogs).where({ bug_ID: BUG_ID }))
  await db.run(DELETE.from(entities.HistoryEvents).where({ bug_ID: BUG_ID }))
  await db.run(DELETE.from(entities.Comments).where({ bug_ID: BUG_ID }))

  const hasAssignee = testCase.from !== 'PENDING_ASSIGNMENT'
  const developerOwned = ['ASSIGNED', 'IN_REVIEW', 'IN_PROGRESS', 'REOPENED'].includes(testCase.from)
  const testerOwned = ['NEED_MORE_INFORMATION', 'REJECTED', 'RESOLVED', 'RETEST_REQUIRED'].includes(testCase.from)

  await db.run(UPDATE(entities.Bugs).set({
    status_code: testCase.from,
    assignee_ID: hasAssignee ? SANG_DEVELOPER_ID : null,
    reporter_ID: NHAN_USER_ID,
    nextProcessorUser_ID: developerOwned ? SANG_USER_ID : (testerOwned ? NHAN_USER_ID : DON_USER_ID),
    nextProcessorRole_code: developerOwned ? 'DEVELOPER' : (testerOwned ? 'TESTER' : 'PM'),
    rejectionReason: testCase.from === 'REJECTED' ? 'Fixture rejection reason' : null
  }).where({ ID: BUG_ID }))
}

async function latestEventWithLogs (db, entities) {
  const event = await db.run(
    SELECT.one.from(entities.HistoryEvents)
      .where({ bug_ID: BUG_ID })
      .orderBy('createdAt desc')
  )
  const logs = event
    ? await db.run(SELECT.from(entities.HistoryLogs).where({ event_ID: event.ID }))
    : []
  return { event, logs }
}

function verifyStaticContract () {
  const actionTypes = workflowContract.map(item => item.actionType)
  assert.equal(new Set(actionTypes).size, workflowContract.length, 'Each workflow action must have a unique ActionType.')

  const constants = require('../../srv/bug-service/constants')
  for (const item of workflowContract) {
    assert.equal(constants.ACTION[item.actionType], item.actionType, `Missing ACTION.${item.actionType}.`)
  }

  const csv = fs.readFileSync(path.join(__dirname, '../../db/data/idts.cap-ActionTypes.csv'), 'utf8')
  for (const code of [...legacyActionTypes, ...actionTypes]) {
    assert.match(csv, new RegExp(`^${code},`, 'm'), `ActionTypes CSV must preserve or add ${code}.`)
  }
}

async function verifyWorkflowActions (service, db, entities) {
  for (const testCase of workflowContract) {
    await resetBug(db, entities, testCase)
    await callAction(service, testCase)

    const bug = await db.run(SELECT.one.from(entities.Bugs).where({ ID: BUG_ID }))
    const { event, logs } = await latestEventWithLogs(db, entities)
    const timelineEvent = await db.run(
      SELECT.one.from(service.entities.HistoryEvents)
        .columns('actionType_code', 'actionTypeName')
        .where({ ID: event.ID })
    )

    assert.equal(event?.actionType_code, testCase.actionType, `${testCase.action} must persist its exact ActionType.`)
    assert.ok(timelineEvent?.actionTypeName, `${testCase.action} must expose a user-facing ActionType label.`)
    assert.notEqual(timelineEvent?.actionTypeName, testCase.actionType, `${testCase.action} timeline must not display the raw technical code as its label.`)
    assert.ok(event?.summary?.includes(testCase.expected.summary), `${testCase.action} summary must identify the command.`)
    assert.equal(event?.actor_ID, testCase.expected.actor, `${testCase.action} must persist the resolved actor.`)
    assert.ok(logs.length > 0, `${testCase.action} must persist HistoryLogs.`)
    assert.ok(logs.every(log => log.actionType_code === testCase.actionType), `${testCase.action} HistoryLogs must use the exact ActionType.`)
    assert.equal(bug.status_code, testCase.expected.status, `${testCase.action} must preserve its status transition.`)
    assert.equal(bug.assignee_ID, testCase.expected.assignee, `${testCase.action} must preserve assignee behavior.`)
    assert.equal(bug.nextProcessorUser_ID, testCase.expected.nextUser, `${testCase.action} must preserve next-processor behavior.`)

    if (testCase.action === 'resubmitToDeveloper') {
      const comments = await db.run(SELECT.from(entities.Comments).where({ bug_ID: BUG_ID }))
      assert.equal(comments.length, 0, 'resubmitToDeveloper must not create an automatic Comment.')
      assert.equal(event.reason, testCase.data.note, 'resubmitToDeveloper must keep the update summary in History.')
    }
  }
}

async function verifyDirectAuthorization (service, db, entities) {
  const markInReview = workflowContract.find(item => item.action === 'markInReview')
  await resetBug(db, entities, markInReview)

  await assert.rejects(
    callAction(service, markInReview, requestUser(['DatDT', ['DEVELOPER', 'authenticated-user']])),
    error => error.code === 403,
    'A developer who is not assigned must be rejected by the direct OData action.'
  )

  await db.run(UPDATE(entities.Bugs).set({ assignee_ID: null }).where({ ID: BUG_ID }))
  await assert.rejects(
    callAction(service, markInReview, requestUser(['SangVN', ['DEVELOPER', 'authenticated-user']])),
    error => error.code === 403,
    'A developer must be rejected when the bug has no assignee.'
  )

  const movePending = workflowContract.find(item => item.action === 'moveToPendingAssignment')
  await resetBug(db, entities, movePending)
  await assert.rejects(
    callAction(service, movePending, requestUser(['SangVN', ['DEVELOPER', 'authenticated-user']])),
    error => error.code === 403,
    'A developer must not gain coordinator-only Move to Pending Assignment permission.'
  )

  const assign = workflowContract.find(item => item.action === 'assignToDeveloper')
  await resetBug(db, entities, assign)
  await assert.rejects(
    callAction(service, assign, requestUser(['SangVN', ['DEVELOPER', 'authenticated-user']])),
    error => error.code === 403,
    'A developer must not gain coordinator-only assignment permission.'
  )
}

async function verifyRollback (service, db, entities) {
  const testCase = workflowContract.find(item => item.action === 'markInReview')
  await resetBug(db, entities, testCase)
  let injectFailure = true
  db.before('CREATE', entities.HistoryEvents, req => {
    if (injectFailure) req.reject(500, 'IDTS-89 injected HistoryEvents failure')
  })

  await assert.rejects(callAction(service, testCase), /IDTS-89 injected HistoryEvents failure/)
  injectFailure = false

  const bug = await db.run(SELECT.one.from(entities.Bugs).where({ ID: BUG_ID }))
  const events = await db.run(SELECT.from(entities.HistoryEvents).where({ bug_ID: BUG_ID }))
  assert.equal(bug.status_code, testCase.from, 'Bug update must roll back when HistoryEvents insertion fails.')
  assert.equal(events.length, 0, 'A failed HistoryEvents insertion must not leave a partial event.')
}

async function verifyIdempotentCodeListUpsert (db) {
  const {
    ACTION_TYPE_ROWS,
    upsertActionTypes
  } = require('../db/upsert-workflow-action-types')

  await upsertActionTypes(db)
  await upsertActionTypes(db)

  const codes = ACTION_TYPE_ROWS.map(row => row.code)
  const rows = await db.run(SELECT.from('idts.cap.ActionTypes').where({ code: { in: codes } }))
  assert.equal(rows.length, workflowContract.length, 'Running the code-list upsert twice must not create duplicates.')
  assert.deepEqual(
    new Set(rows.map(row => row.code)),
    new Set(codes),
    'The idempotent upsert must provide every exact workflow ActionType.'
  )
}

async function verifyActorFallbacks (service, db, entities) {
  const { actorForAction } = require('../../srv/bug-service/history')
  const req = new cds.Request({ user: requestUser(['anonymous', []]) })
  const bug = await db.run(SELECT.one.from(entities.Bugs).where({ ID: BUG_ID }))

  const developerActor = await actorForAction(req, service.entities, {
    ...bug,
    assignee_ID: SANG_DEVELOPER_ID
  }, 'START_PROGRESS')
  assert.equal(developerActor, SANG_USER_ID, 'Developer-command fallback must resolve the assignee user.')

  const coordinatorActor = await actorForAction(req, service.entities, {
    ...bug,
    nextProcessorUser_ID: DON_USER_ID,
    reporter_ID: NHAN_USER_ID
  }, 'MOVE_TO_PENDING_ASSIGNMENT')
  assert.equal(coordinatorActor, DON_USER_ID, 'Coordinator-command fallback must preserve next-processor precedence.')
}

async function main () {
  console.log('IDTS-89 one-to-one workflow ActionType contract')
  verifyStaticContract()

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)
  const entities = {
    Bugs: service.entities.Bugs,
    Comments: service.entities.Comments,
    HistoryEvents: service.entities.HistoryEvents,
    HistoryLogs: service.entities.HistoryLogs
  }

  await verifyWorkflowActions(service, db, entities)
  await verifyDirectAuthorization(service, db, entities)
  await verifyRollback(service, db, entities)
  await verifyIdempotentCodeListUpsert(db)
  await verifyActorFallbacks(service, db, entities)

  console.log(`PASS: ${workflowContract.length}/11 workflow actions have unique persisted ActionTypes.`)
  console.log('PASS: direct authorization, HistoryLogs, actor, state, next processor, rollback, and idempotent upsert contracts verified.')
}

main().catch(error => {
  console.error(`FAIL: ${error.stack || error.message}`)
  process.exit(1)
})
