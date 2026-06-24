/**
 * IDTS-23 Unified Regression: Ownership, History, and Monitoring
 *
 * Verifies that after each lifecycle action, ownership mapping
 * (currentActionOwnerDisplayName), history event readability
 * (groupedChangeContext / changeCount / summary), and PM monitoring
 * flags (isOverdue, isPendingAssignment, isRejectedFollowUp,
 * isRetestRequired) remain consistent.
 *
 * Pattern: direct CDS handler dispatch with in-memory SQLite.
 * No HTTP server required.
 */

'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

/* Block cds-plugin-ui5 from loading during tests */
const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const {
  enrichBugDisplayFields,
  ensureCapabilitySelectDependencies
} = require('../../srv/bug-service/read-models')

const {
  ensureHistoryEventSelectDependencies,
  enrichHistoryEventPayload
} = require('../../srv/bug-service/history-read-models')

/* ── Test harness ── */

const RESULTS = []
let PASS = 0
let FAIL = 0

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectOneOf (label, actual, allowedValues) {
  const pass = allowedValues.includes(actual)
  rec(label, pass, `actual=${JSON.stringify(actual)} allowed=${JSON.stringify(allowedValues)}`)
}

function expectTruthy (label, value, detail = '') {
  rec(label, !!value, detail || `value=${JSON.stringify(value)}`)
}

function expectContains (label, haystack, needle) {
  const found = typeof haystack === 'string' && haystack.includes(needle)
  rec(label, found, `haystack=${JSON.stringify(haystack)} needle=${JSON.stringify(needle)}`)
}

/* ── Known UUIDs from seed data ── */

const BUG_SEED = '90000000-0000-0000-0000-000000000001'    // BUG-0001 Pending Assignment
const DEV_SANG = '20000000-0000-0000-0000-000000000001'    // DeveloperProfile SangVN
const DEV_DAT  = '20000000-0000-0000-0000-000000000002'    // DeveloperProfile DatDT
const USER_NHANT = '10000000-0000-0000-0000-000000000004'  // User NhanT (Tester)
const USER_SANG  = '10000000-0000-0000-0000-000000000002'  // User SangVN

/* ── Mock users ── */

function tester ()   { return new cds.User({ id: 'alice', roles: ['TESTER',    'authenticated-user'] }) }
function developer (name) { return new cds.User({ id: name || 'alice', roles: ['DEVELOPER', 'authenticated-user'] }) }
function pm ()       { return new cds.User({ id: 'alice', roles: ['PM',        'authenticated-user'] }) }

/* ── Helpers ── */

async function callAction (srv, bugID, actionName, data = {}, requestUser = tester()) {
  try {
    const req = new cds.Request({
      method: 'POST',
      event: actionName,
      params: [{ ID: bugID, IsActiveEntity: true }],
      data,
      user: requestUser
    })
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${actionName} hung for 5s (likely SQLite deadlock)`)), 5000)
    )
    const result = await Promise.race([srv.dispatch(req), timeout])
    return { ok: true, code: 200, data: result }
  } catch (e) {
    return { ok: false, code: e.code || e.statusCode || 500, msg: e.message?.substring(0, 200) || '' }
  }
}

async function mustCallAction (srv, bugID, actionName, data = {}, requestUser = tester()) {
  const res = await callAction(srv, bugID, actionName, data, requestUser)
  if (!res.ok) {
    const detail = `${actionName} failed: code=${res.code} msg=${res.msg}`
    rec(`ACTION ${actionName} must succeed`, false, detail)
    throw new Error(detail)
  }
  return res
}

async function readBugOwnership (srv, bugID, entities) {
  const req = new cds.Request({ method: 'GET', event: 'READ', user: pm() })
  return cds.tx(req, async tx => {
    const rows = await tx.run(
      SELECT.from(entities.Bugs)
        .columns('ID', 'bugNumber', 'status_code', 'reporter_ID', 'assignee_ID',
          'nextProcessorUser_ID', 'nextProcessorRole_code')
        .where({ ID: bugID })
    )
    await enrichBugDisplayFields(rows, req, entities)
    return rows[0] || null
  })
}

async function readBugMonitoring (srv, bugID) {
  const req = new cds.Request({ method: 'GET', event: 'READ', user: pm() })
  return cds.tx(req, async tx => {
    const rows = await tx.run(
      SELECT.from('BugService.Bugs')
        .columns('ID', 'isOverdue', 'isPendingAssignment', 'isRejectedFollowUp', 'isRetestRequired')
        .where({ ID: bugID })
    )
    return rows[0] || null
  })
}

async function latestHistoryEvent (srv, bugID, actionType, entities) {
  const req = new cds.Request({ method: 'GET', event: 'READ', user: pm() })
  return cds.tx(req, async tx => {
    ensureHistoryEventSelectDependencies(req)

    const rows = await tx.run(
      SELECT.from(srv.entities.HistoryEvents)
        .columns('ID', 'summary', 'reason', 'actionType_code', 'createdAt')
        .where({ bug_ID: bugID, actionType_code: actionType })
        .orderBy('createdAt desc')
        .limit(1)
    )
    await enrichHistoryEventPayload(rows, req, entities)
    return rows[0] || null
  })
}

async function createTestBug (db, overrides = {}) {
  const bugID = overrides.ID || 'A0000000-0000-0000-0000-000000000001'
  await db.run(
    INSERT.into('idts.cap.Bugs').entries({
      ID: bugID,
      bugNumber: overrides.bugNumber || 'BUG-REG-001',
      title: overrides.title || 'IDTS-23 regression test bug',
      description: overrides.description || 'Bug for automated ownership/history/monitoring regression.',
      status_code: overrides.status_code || 'PENDING_ASSIGNMENT',
      priority_code: overrides.priority_code || 'HIGH',
      severity_code: overrides.severity_code || 'MAJOR',
      environment_code: overrides.environment_code || 'QAS',
      environmentDetail: 'IDTS-23 regression',
      stepsToReproduce: 'Automated regression test step.',
      actualResult: 'To be verified.',
      expectedResult: 'Consistent ownership, history, and monitoring.',
      applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
      defectCategory_ID: '50000000-0000-0000-0000-000000000002',
      componentCategory_ID: '60000000-0000-0000-0000-000000000002',
      reporter_ID: USER_NHANT,
      assignee_ID: overrides.assignee_ID || null,
      nextProcessorUser_ID: overrides.nextProcessorUser_ID || null,
      nextProcessorRole_code: overrides.nextProcessorRole_code || 'PM',
      plannedCompletionDate: overrides.plannedCompletionDate || '2026-06-28',
      dueDate: overrides.dueDate || '2026-06-30',
      estimatedEffortHours: overrides.estimatedEffortHours || '2.00',
      ...overrides
    })
  )
  return bugID
}

/* ══════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════ */

const EXPECTED_MIN_CHECKS = 45 // Ownership(14) + History(16) + Monitoring(15) = 45

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-23 Unified Regression: Ownership · History · Monitoring')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)
  const entities = srv.entities

  try {
    /* Create a fresh bug for full lifecycle */
    const BUG = await createTestBug(db)

    await sectionOwnershipLifecycle(srv, entities, BUG)
    await sectionHistoryLifecycle(srv, entities, BUG)

    /* Create a second fresh bug for monitoring flags */
    const BUG_MON = await createTestBug(db, {
      ID: 'A0000000-0000-0000-0000-000000000002',
      bugNumber: 'BUG-REG-MON',
      title: 'IDTS-23 monitoring regression bug',
      dueDate: dateOffset(-3) // overdue
    })
    await sectionMonitoringFlags(srv, entities, BUG_MON)
  } catch (error) {
    const detail = error?.stack || error?.message || JSON.stringify(error) || 'unknown error'
    rec('REG-00 regression flow crashed', false, detail)
  }

  /* Guard: script must not exit 0 if sections were skipped */
  if (RESULTS.length < EXPECTED_MIN_CHECKS) {
    rec(
      `REG-GUARD expected >= ${EXPECTED_MIN_CHECKS} checks but only ran ${RESULTS.length}`,
      false,
      'Sections were skipped or crashed early'
    )
  }

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('==============================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(item => !item.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }

  console.log('\nAll checks passed.')
}

/* ══════════════════════════════════════════
   SECTION 1: Ownership Lifecycle Regression
   ══════════════════════════════════════════ */

async function sectionOwnershipLifecycle (srv, entities, bugID) {
  console.log('\n── Section 1: Ownership Lifecycle ──')

  /* OWN-01 Initial state: Pending Assignment → owner = PM queue */
  let bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-01 Pending Assignment owner = Project Manager', bug?.currentActionOwnerDisplayName, 'Project Manager')

  /* OWN-02 Assign developer → owner = SangVN */
  await mustCallAction(srv, bugID, 'assignToDeveloper', { assigneeID: DEV_SANG, note: 'Assign for ownership regression' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-02 Assigned owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-03 Mark In Review → owner still = SangVN */
  await mustCallAction(srv, bugID, 'markInReview', {}, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-03 In Review owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-04 Start Progress → owner still = SangVN */
  await mustCallAction(srv, bugID, 'startProgress', {}, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-04 In Progress owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-05 Request More Information → owner = Tester (NhanT) */
  await mustCallAction(srv, bugID, 'requestMoreInformation', { reason: 'Need more logs for regression test' }, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-05 Need More Info owner = NhanT', bug?.currentActionOwnerDisplayName, 'NhanT')

  /* OWN-06 Resubmit to Developer → owner = SangVN */
  await mustCallAction(srv, bugID, 'resubmitToDeveloper', { note: 'Logs attached, resubmitting for regression test' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-06 Resubmitted owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-07 Mark In Review again → owner = SangVN */
  await mustCallAction(srv, bugID, 'markInReview', {}, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-07 In Review again owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-08 Start Progress again → owner = SangVN */
  await mustCallAction(srv, bugID, 'startProgress', {}, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-08 In Progress again owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-09 Resolve → owner = NhanT (reporter/tester) */
  await mustCallAction(srv, bugID, 'resolveBug', { note: 'Fixed for regression test' }, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-09 Resolved owner = NhanT', bug?.currentActionOwnerDisplayName, 'NhanT')

  /* OWN-10 Send to Retest → owner = NhanT (reporter/tester) */
  await mustCallAction(srv, bugID, 'sendToRetest', { note: 'Retest needed for regression verification' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-10 Retest Required owner = NhanT', bug?.currentActionOwnerDisplayName, 'NhanT')

  /* OWN-11 Close → owner = null */
  await mustCallAction(srv, bugID, 'closeBug', { note: 'Verified and closing for regression test' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-11 Closed owner = null', bug?.currentActionOwnerDisplayName, null)

  /* OWN-12 Reopen → owner = SangVN (assigned developer, REOPENED is DEVELOPER_STATUS) */
  await mustCallAction(srv, bugID, 'reopenBug', { reason: 'Reopening for additional regression checks' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-12 Reopened owner = SangVN', bug?.currentActionOwnerDisplayName, 'SangVN')

  /* OWN-13 Reject → owner = NhanT (reporter/tester) */
  await mustCallAction(srv, bugID, 'assignToDeveloper', { assigneeID: DEV_SANG, note: 'Re-assign for reject test' })
  await mustCallAction(srv, bugID, 'rejectBug', { reason: 'Wrong classification for regression test' }, developer('SangVN'))
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-13 Rejected owner = NhanT', bug?.currentActionOwnerDisplayName, 'NhanT')

  /* OWN-14 Move to Pending Assignment → owner = PM queue */
  await mustCallAction(srv, bugID, 'moveToPendingAssignment', { reason: 'Move to queue for regression test' })
  bug = await readBugOwnership(srv, bugID, entities)
  expectEqual('OWN-14 Pending Assignment owner = Project Manager', bug?.currentActionOwnerDisplayName, 'Project Manager')
}

/* ══════════════════════════════════════════
   SECTION 2: History Event Lifecycle Regression
   ══════════════════════════════════════════ */

async function sectionHistoryLifecycle (srv, entities, bugID) {
  console.log('\n── Section 2: History Event Lifecycle ──')

  /* Events already created during ownership lifecycle above.
     Now verify history events for key transitions. */

  /* HIS-01 Assign event */
  let event = await latestHistoryEvent(srv, bugID, 'ASSIGN', entities)
  expectTruthy('HIS-01 Assign event exists', event, event?.summary || 'missing')
  expectContains('HIS-02 Assign grouped context has Status', event?.groupedChangeContext, 'Status:')
  rec('HIS-03 Assign changeCount >= 1', Number(event?.changeCount) >= 1, `changeCount=${event?.changeCount}`)

  /* HIS-04 Status change events (markInReview / startProgress are STATUS_CHANGE) */
  event = await latestHistoryEvent(srv, bugID, 'STATUS_CHANGE', entities)
  expectTruthy('HIS-04 Status change event exists', event, event?.summary || 'missing')
  expectContains('HIS-05 Status change grouped context has Status', event?.groupedChangeContext, 'Status:')

  /* HIS-06 Request More Information event */
  event = await latestHistoryEvent(srv, bugID, 'REQUEST_INFO', entities)
  expectTruthy('HIS-06 Request Info event exists', event, event?.summary || 'missing')
  expectTruthy('HIS-07 Request Info reason is present', event?.reason, event?.reason || 'missing reason')

  /* HIS-08 Resolve event */
  event = await latestHistoryEvent(srv, bugID, 'RESOLVE', entities)
  expectTruthy('HIS-08 Resolve event exists', event, event?.summary || 'missing')
  expectContains('HIS-09 Resolve grouped context has Status', event?.groupedChangeContext, 'Status:')

  /* HIS-10 Retest event */
  event = await latestHistoryEvent(srv, bugID, 'RETEST', entities)
  expectTruthy('HIS-10 Retest event exists', event, event?.summary || 'missing')

  /* HIS-11 Close event */
  event = await latestHistoryEvent(srv, bugID, 'CLOSE', entities)
  expectTruthy('HIS-11 Close event exists', event, event?.summary || 'missing')
  expectContains('HIS-12 Close grouped context has Status', event?.groupedChangeContext, 'Status:')

  /* HIS-13 Reopen event */
  event = await latestHistoryEvent(srv, bugID, 'REOPEN', entities)
  expectTruthy('HIS-13 Reopen event exists', event, event?.summary || 'missing')
  expectTruthy('HIS-14 Reopen reason is present', event?.reason, event?.reason || 'missing reason')

  /* HIS-15 Reject event */
  event = await latestHistoryEvent(srv, bugID, 'REJECT', entities)
  expectTruthy('HIS-15 Reject event exists', event, event?.summary || 'missing')
  expectTruthy('HIS-16 Reject reason is present', event?.reason, event?.reason || 'missing reason')
}

/* ══════════════════════════════════════════
   SECTION 3: Monitoring Flag Lifecycle Regression
   ══════════════════════════════════════════ */

async function sectionMonitoringFlags (srv, entities, bugID) {
  console.log('\n── Section 3: Monitoring Flag Lifecycle ──')

  /* MON-01 Initial: Pending Assignment, overdue dueDate */
  let mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-01 Pending Assignment isPendingAssignment=true', mon?.isPendingAssignment, true)
  expectEqual('MON-02 Pending Assignment isRejectedFollowUp=false', mon?.isRejectedFollowUp, false)
  expectEqual('MON-03 Pending Assignment isOverdue=true (past due)', mon?.isOverdue, true)

  /* MON-04 Assign → no longer pending */
  await mustCallAction(srv, bugID, 'assignToDeveloper', { assigneeID: DEV_SANG, note: 'Assign for monitoring regression' })
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-04 Assigned isPendingAssignment=false', mon?.isPendingAssignment, false)
  expectEqual('MON-05 Assigned isRejectedFollowUp=false', mon?.isRejectedFollowUp, false)

  /* MON-06 Reject → isRejectedFollowUp=true */
  await mustCallAction(srv, bugID, 'rejectBug', { reason: 'Wrong category for monitoring regression' }, developer('SangVN'))
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-06 Rejected isRejectedFollowUp=true', mon?.isRejectedFollowUp, true)
  expectEqual('MON-07 Rejected isPendingAssignment=false', mon?.isPendingAssignment, false)

  /* MON-08 Move to Pending → isPendingAssignment=true, isRejectedFollowUp=false */
  await mustCallAction(srv, bugID, 'moveToPendingAssignment', { reason: 'Move to queue for monitoring regression' })
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-08 Pending isPendingAssignment=true', mon?.isPendingAssignment, true)
  expectEqual('MON-09 Pending isRejectedFollowUp=false', mon?.isRejectedFollowUp, false)

  /* Re-assign and drive to Resolved */
  await mustCallAction(srv, bugID, 'assignToDeveloper', { assigneeID: DEV_SANG, note: 'Re-assign for resolve path' })
  await mustCallAction(srv, bugID, 'startProgress', {}, developer('SangVN'))
  await mustCallAction(srv, bugID, 'resolveBug', { note: 'Fixed for monitoring regression' }, developer('SangVN'))

  /* MON-10 Resolved → isRetestRequired=false */
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-10 Resolved isRetestRequired=false', mon?.isRetestRequired, false)

  /* MON-11 Send to Retest → isRetestRequired=true */
  await mustCallAction(srv, bugID, 'sendToRetest', { note: 'Retest needed for monitoring regression' })
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-11 Retest Required isRetestRequired=true', mon?.isRetestRequired, true)

  /* MON-12 Close → all flags false */
  await callAction(srv, bugID, 'closeBug', { note: 'Closing for monitoring regression' })
  mon = await readBugMonitoring(srv, bugID)
  expectEqual('MON-12 Closed isPendingAssignment=false', mon?.isPendingAssignment, false)
  expectEqual('MON-13 Closed isRejectedFollowUp=false', mon?.isRejectedFollowUp, false)
  expectEqual('MON-14 Closed isRetestRequired=false', mon?.isRetestRequired, false)
  expectEqual('MON-15 Closed isOverdue=false', mon?.isOverdue, false)
}

/* ── Utility ── */

function dateOffset (days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

main().catch(error => {
  console.error('FATAL:', error.message)
  console.error(error.stack?.substring(0, 1500))
  process.exit(1)
})
