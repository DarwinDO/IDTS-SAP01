/**
 * IDTS-6 Happy-Flow Backend Verification - Direct CDS API Test
 * Bypasses HTTP server entirely: calls service handlers directly via cds.run()
 * No cds.test(), no HTTP, no UI5 plugin issues
 * NhanT - 2026-06-13
 */

'use strict'

// Suppress non-essential output
process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

// Temporarily suppress require of cds-plugin-ui5
const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')

const RESULTS = []
let PASS = 0, FAIL = 0

const BUG1 = '90000000-0000-0000-0000-000000000001'  // PENDING_ASSIGNMENT
const BUG3 = '90000000-0000-0000-0000-000000000003'  // IN_PROGRESS w/ SangVN assignee
const BUG_CREATE = '90000000-0000-0000-0000-000000000099'
const BUG_CREATE_ASSIGNED = '90000000-0000-0000-0000-000000000097'
const DEV_SANG = '20000000-0000-0000-0000-000000000001'
const DEV_DAT  = '20000000-0000-0000-0000-000000000002'
const COMP_1   = '40000000-0000-0000-0000-000000000001'
const CAT_1    = '50000000-0000-0000-0000-000000000001'
const COMP_6   = '40000000-0000-0000-0000-000000000006'
const CAT_2    = '50000000-0000-0000-0000-000000000002'
const REPORTER = '10000000-0000-0000-0000-000000000004'

function rec(label, pass, code, exp, detail='') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label} [HTTP ${code} exp ${exp}]${detail?' | '+detail:''}`)
  RESULTS.push({ label, pass, code, exp, detail })
}

async function runSrv(srv) {
  // Helper: call a bound action
  async function action(entity, id, actionName, data={}) {
    const req = new cds.Request({
      method: 'POST',
      target: srv.entities[entity],
      params: [{ ID: id, IsActiveEntity: true }],
      data,
      user: new cds.User({ id: 'alice', roles: ['BugManager'] })
    })
    return srv.dispatch(req)
  }

  // Helper: send a service request via tx
  async function read(entity, filter) {
    return cds.tx({}, tx => tx.run(SELECT.from(srv.entities[entity]).where(filter).limit(5)))
  }

  async function create(entity, data) {
    return cds.tx({}, tx => tx.run(INSERT.into(srv.entities[entity]).entries(data)))
  }

  async function updateBug(bugID, patch) {
    const req = new cds.Request({
      method: 'PATCH',
      event: 'UPDATE',
      target: srv.entities.Bugs,
      query: UPDATE.entity(srv.entities.Bugs).set(patch).where({ ID: bugID }),
      params: [{ ID: bugID, IsActiveEntity: true }],
      data: { ID: bugID, ...patch },
      user: new cds.User({ id: 'alice', roles: ['BugManager'] })
    })
    return srv.dispatch(req)
  }

  console.log('')

  // ----------------------------------------------------------------
  // SC-01: Create Bug (test before/CREATE handler validation)
  // ----------------------------------------------------------------
  console.log('SC-01: Create Bug')
  try {
    const createData = {
      ID: BUG_CREATE,
      title: 'QA-IDTS6 Happy Flow Test Bug',
      description: 'Created by NhanT for IDTS-6 QA verification run',
      stepsToReproduce: '1. Open bug list  2. Click create  3. Fill form',
      actualResult: 'Bug creation form not validated',
      expectedResult: 'All required fields validated',
      priority_code: 'HIGH', severity_code: 'MAJOR', environment_code: 'QAS',
      applicationComponent_ID: COMP_6, defectCategory_ID: CAT_2, reporter_ID: REPORTER
    }
    const req1a = new cds.Request({
      method: 'POST', event: 'CREATE',
      target: srv.entities.Bugs,
      query: INSERT.into(srv.entities.Bugs).entries(createData),
      data: createData,
      user: new cds.User({ id: 'NhanT', roles: ['TESTER', 'authenticated-user'] })
    })
    const createdBug = await srv.dispatch(req1a)
    rec(
      'SC-01a Create bug all required fields',
      createdBug?.status_code === 'PENDING_ASSIGNMENT',
      201,
      201,
      `status=${createdBug?.status_code || 'n/a'}`
    )
  } catch(e) {
    const code = e.code || e.statusCode || 500
    rec('SC-01a Create bug all required fields', false, code, 201, e.message?.substring(0,80)||'unknown')
  }

  try {
    const missingTitleData = {
      ID: '90000000-0000-0000-0000-000000000098',
      description: 'no title', stepsToReproduce: 'x', actualResult: 'x', expectedResult: 'x',
      priority_code: 'HIGH', severity_code: 'MAJOR', environment_code: 'QAS',
      applicationComponent_ID: COMP_6, defectCategory_ID: CAT_2, reporter_ID: REPORTER
    }
    const req1b = new cds.Request({
      method: 'POST', event: 'CREATE',
      target: srv.entities.Bugs,
      query: INSERT.into(srv.entities.Bugs).entries(missingTitleData),
      data: missingTitleData,
      user: new cds.User({ id: 'NhanT', roles: ['TESTER', 'authenticated-user'] })
    })
    await srv.dispatch(req1b)
    rec('SC-01b Create missing title -> 400', false, 200, 400, 'Should have rejected')
  } catch(e) {
    const code = e.code || e.statusCode || 500
    rec('SC-01b Create missing title -> 400', code===400, code, 400, e.message?.substring(0,60)||'')
  }

  try {
    const createAssignedData = {
      ID: BUG_CREATE_ASSIGNED,
      title: 'QA-IDTS6 Create Assigned Bug',
      description: 'Created with a valid pre-selected developer for status verification',
      stepsToReproduce: '1. Open create page  2. Fill data  3. Pick developer  4. Submit',
      actualResult: 'Need to verify initial persisted status',
      expectedResult: 'Status should be ASSIGNED on create when assignee is selected',
      priority_code: 'HIGH',
      severity_code: 'MAJOR',
      environment_code: 'QAS',
      applicationComponent_ID: COMP_1,
      defectCategory_ID: CAT_1,
      assignee_ID: DEV_DAT,
      reporter_ID: REPORTER
    }
    const req1c = new cds.Request({
      method: 'POST',
      event: 'CREATE',
      target: srv.entities.Bugs,
      query: INSERT.into(srv.entities.Bugs).entries(createAssignedData),
      data: createAssignedData,
      user: new cds.User({ id: 'NhanT', roles: ['TESTER', 'authenticated-user'] })
    })
    const createdAssignedBug = await srv.dispatch(req1c)
    rec(
      'SC-01c Create bug with assignee -> ASSIGNED',
      createdAssignedBug?.status_code === 'ASSIGNED',
      201,
      201,
      `status=${createdAssignedBug?.status_code || 'n/a'}`
    )
  } catch (e) {
    const code = e.code || e.statusCode || 500
    rec('SC-01c Create bug with assignee -> ASSIGNED', false, code, 201, e.message?.substring(0, 80) || 'unknown')
  }

  console.log('')

  // ----------------------------------------------------------------
  // SC-02 to SC-12: Test action handlers via transitionBug logic directly
  // Since HTTP is blocked, we test via srv.dispatch with action requests
  // ----------------------------------------------------------------

  // Helper to call a bound action and get result
  async function callAction(bugID, actionName, data={}) {
    try {
      const req = new cds.Request({
        method: 'POST',
        event: actionName,
        params: [{ ID: bugID, IsActiveEntity: true }],
        data,
        user: new cds.User({ id: 'alice' })
      })
      const result = await srv.dispatch(req)
      return { ok: true, code: 200, data: result }
    } catch(e) {
      return { ok: false, code: e.code || e.statusCode || 500, msg: e.message?.substring(0,100)||'' }
    }
  }

  console.log('SC-02: Assign to Developer')
  const r2a = await callAction(BUG1, 'assignToDeveloper', { assigneeID: DEV_DAT, note: 'Assigned by QA test' })
  rec('SC-02a Assign BUG-0001 to DatDT', r2a.ok, r2a.code, 200, r2a.data?.status_code||r2a.msg)

  const r2b = await callAction(BUG1, 'assignToDeveloper', { note: 'no assigneeID' })
  rec('SC-02b Assign without assigneeID -> 400', !r2b.ok && r2b.code===400, r2b.code, 400, r2b.msg)

  console.log('')
  console.log('SC-03: Mark In Review')
  const r3a = await callAction(BUG1, 'markInReview', { note: '' })
  rec('SC-03a markInReview ASSIGNED -> IN_REVIEW', r3a.ok, r3a.code, 200, r3a.data?.status_code||r3a.msg)

  console.log('')
  console.log('SC-04: Start Progress')
  const r4a = await callAction(BUG1, 'startProgress', { note: 'Starting work' })
  rec('SC-04a startProgress IN_REVIEW -> IN_PROGRESS', r4a.ok, r4a.code, 200, r4a.data?.status_code||r4a.msg)

  console.log('')
  console.log('SC-05: Request More Information')
  const r5a = await callAction(BUG1, 'requestMoreInformation', { reason: 'Need error logs' })
  rec('SC-05a requestMoreInfo with reason', r5a.ok, r5a.code, 200, r5a.data?.status_code||r5a.msg)

  const r5b = await callAction(BUG1, 'requestMoreInformation', { reason: '' })
  rec('SC-05b requestMoreInfo empty reason -> 400', !r5b.ok && r5b.code===400, r5b.code, 400, r5b.msg)

  const r5c = await callAction(BUG1, 'resubmitToDeveloper', { note: 'Updated steps and attached the missing evidence.' })
  rec('SC-05c resubmitToDeveloper NEED_MORE_INFORMATION -> ASSIGNED', r5c.ok, r5c.code, 200, r5c.data?.status_code||r5c.msg)

  const bug1Comments = await cds.tx({}, tx => tx.run(
    SELECT.from(srv.entities.Comments).where({ bug_ID: BUG1 }).orderBy('createdAt desc').limit(1)
  ))
  const latestBug1Comment = bug1Comments?.[0]
  rec(
    'SC-05d resubmitToDeveloper creates follow-up comment',
    !!latestBug1Comment?.content && latestBug1Comment.content.includes('Resubmitted after information request:'),
    200,
    200,
    latestBug1Comment?.content || 'no comment found'
  )

  const bug1Notifications = await cds.tx({}, tx => tx.run(
    SELECT.from(srv.entities.Notifications).where({ bug_ID: BUG1 }).orderBy('createdAt desc').limit(2)
  ))
  const resubmitNotification = bug1Notifications.find(notification =>
    notification.eventType_code === 'UPDATED' &&
    notification.message?.includes('resubmitted with additional information')
  )
  rec(
    'SC-05e resubmitToDeveloper creates developer notification',
    !!resubmitNotification,
    200,
    200,
    resubmitNotification?.message || 'no resubmit notification found'
  )

  console.log('')
  console.log('SC-06: Reject Bug')
  const r6a = await callAction(BUG3, 'rejectBug', { reason: 'Wrong classification - UI category' })
  rec('SC-06a rejectBug with reason', r6a.ok, r6a.code, 200, r6a.data?.status_code||r6a.msg)

  const r6b = await callAction(BUG3, 'rejectBug', { reason: '' })
  rec('SC-06b rejectBug empty reason -> 400', !r6b.ok && r6b.code===400, r6b.code, 400, r6b.msg)

  const r6c = await callAction(BUG3, 'requestMoreInformation', { reason: 'Rejected bugs should not request more info directly' })
  rec('SC-06c requestMoreInfo on REJECTED -> 400', !r6c.ok && r6c.code===400, r6c.code, 400, r6c.msg)

  console.log('')
  console.log('SC-07: Move to Pending Assignment')
  const r7a = await callAction(BUG3, 'moveToPendingAssignment', { reason: 'Awaiting reclassification' })
  rec('SC-07a moveToPendingAssignment after REJECTED', r7a.ok, r7a.code, 200, r7a.data?.status_code||r7a.msg)

  console.log('')
  console.log('SC-08: Resolve Bug [IDTS-3 FIX VERIFICATION]')
  // Prep: assign BUG3 -> inReview -> inProgress
  const prep1 = await callAction(BUG3, 'assignToDeveloper', { assigneeID: DEV_SANG, note: 'Re-assign' })
  rec('SC-08-prep1 Assign BUG3 to SangVN', prep1.ok, prep1.code, 200, prep1.data?.status_code||prep1.msg)
  const prep2 = await callAction(BUG3, 'markInReview', {})
  rec('SC-08-prep2 markInReview BUG3', prep2.ok, prep2.code, 200, prep2.data?.status_code||prep2.msg)
  const prep3 = await callAction(BUG3, 'startProgress', {})
  rec('SC-08-prep3 startProgress BUG3', prep3.ok, prep3.code, 200, prep3.data?.status_code||prep3.msg)

  // 8b: resolve NO note -> must 400 (IDTS-3 fix)
  const r8b = await callAction(BUG3, 'resolveBug', { note: '' })
  rec('SC-08b resolveBug NO note -> 400 [IDTS-3]', !r8b.ok && r8b.code===400, r8b.code, 400, r8b.msg)

  // 8a: resolve WITH note -> must 200
  const r8a = await callAction(BUG3, 'resolveBug', { note: 'Root cause fixed: corrected category mapping' })
  rec('SC-08a resolveBug WITH note -> 200 [IDTS-3]', r8a.ok, r8a.code, 200, r8a.data?.status_code||r8a.msg)

  console.log('')
  console.log('SC-09: Send to Retest')
  const r9a = await callAction(BUG3, 'sendToRetest', { note: 'Please retest in QAS' })
  rec('SC-09a sendToRetest on RESOLVED', r9a.ok, r9a.code, 200, r9a.data?.status_code||r9a.msg)

  console.log('')
  console.log('SC-10: Reopen Bug')
  const r10a = await callAction(BUG3, 'reopenBug', { reason: 'Issue still reproducible' })
  rec('SC-10a reopenBug with reason', r10a.ok, r10a.code, 200, r10a.data?.status_code||r10a.msg)

  const r10b = await callAction(BUG3, 'reopenBug', { reason: '' })
  rec('SC-10b reopenBug empty reason -> 400', !r10b.ok && r10b.code===400, r10b.code, 400, r10b.msg)

  console.log('')
  console.log('SC-11: Close Bug')
  // Prep: assign -> inReview -> progress -> resolve -> close
  await callAction(BUG3, 'assignToDeveloper', { assigneeID: DEV_SANG })
  await callAction(BUG3, 'markInReview', {})
  await callAction(BUG3, 'startProgress', {})
  await callAction(BUG3, 'resolveBug', { note: 'Fixed for close test' })
  const r11a = await callAction(BUG3, 'closeBug', { note: 'QA verified and closed' })
  rec('SC-11a closeBug on RESOLVED', r11a.ok, r11a.code, 200, r11a.data?.status_code||r11a.msg)

  console.log('')
  console.log('SC-12: History Logs recorded')
  try {
    const histLogs = await cds.tx({}, tx => tx.run(
      SELECT.from(srv.entities.HistoryLogs).where({ bug_ID: BUG3 }).orderBy('createdAt desc').limit(5)
    ))
    const count = histLogs?.length || 0
    rec('SC-12a HistoryLogs for BUG-0003', count > 0, 200, 200, `entries found: ${count}`)
    if (count > 0) {
      console.log('         Sample entries:')
      histLogs.slice(0,3).forEach(h => {
        console.log(`           ${h.actionType_code} | ${h.fieldName} | ${h.oldValue} -> ${h.newValue}`)
      })
    }

    const histEvents = await cds.tx({}, tx => tx.run(
      SELECT.from(srv.entities.HistoryEvents).where({ bug_ID: BUG3 }).orderBy('createdAt desc').limit(3)
    ))
    const eventCount = histEvents?.length || 0
    rec('SC-12b HistoryEvents for BUG-0003', eventCount > 0, 200, 200, `events found: ${eventCount}`)
    if (eventCount > 0) {
      console.log('         Sample events:')
      histEvents.slice(0, 2).forEach(event => {
        console.log(`           ${event.actionType_code} | ${event.summary}`)
      })
    }
  } catch(e) {
    rec('SC-12a HistoryLogs for BUG-0003', false, 500, 200, e.message)
    rec('SC-12b HistoryEvents for BUG-0003', false, 500, 200, e.message)
  }

  console.log('')
  console.log('SC-13: Generic edit history coverage')
  try {
    const updatedTitle = `QA title update ${Date.now()}`
    const updatedDescription = `QA description update ${Date.now()}`
    const updatedBug = await updateBug(BUG1, {
      title: updatedTitle,
      description: updatedDescription
    })
    rec('SC-13a updateBug title/description', !!updatedBug?.ID, 200, 200, updatedBug?.title || 'no payload')

    const contentHistory = await cds.tx({}, tx => tx.run(
      SELECT.from(srv.entities.HistoryLogs)
        .columns('fieldName', 'newValue')
        .where({ bug_ID: BUG1, fieldName: { in: ['title', 'description'] } })
        .orderBy('createdAt desc')
        .limit(10)
    ))
    const titleLogged = contentHistory.some(row => row.fieldName === 'title' && row.newValue === updatedTitle)
    const descriptionLogged = contentHistory.some(row => row.fieldName === 'description' && row.newValue === updatedDescription)
    rec('SC-13b title edit writes history', titleLogged, 200, 200, JSON.stringify(contentHistory[0] || {}))
    rec('SC-13c description edit writes history', descriptionLogged, 200, 200, JSON.stringify(contentHistory[1] || {}))
  } catch (e) {
    const code = e.code || e.statusCode || 500
    rec('SC-13a updateBug title/description', false, code, 200, e.message?.substring(0, 100) || 'unknown')
    rec('SC-13b title edit writes history', false, code, 200, e.message?.substring(0, 100) || 'unknown')
    rec('SC-13c description edit writes history', false, code, 200, e.message?.substring(0, 100) || 'unknown')
  }

  console.log('')
  console.log('SC-14: Attachment draft flow note')
  console.log('  INFO  Attachment create/history is verified by the HTTP draft-flow QA script because direct child writes on draft compositions are intentionally rejected outside the root draft path.')
}

async function main() {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-6 Happy-Flow Backend Verification')
  console.log(' Direct CDS Service Handler Test')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  // Boot CDS with SQLite in-memory
  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const srv = await cds.serve('BugService').from(csn)

  await runSrv(srv)

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} tests`)
  console.log('==============================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    RESULTS.filter(r => !r.pass).forEach(r => {
      console.log(`  FAIL  ${r.label}`)
      if (r.detail) console.log(`        ${r.detail}`)
    })
  }

  process.exit(FAIL > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 500))
  process.exit(1)
})
