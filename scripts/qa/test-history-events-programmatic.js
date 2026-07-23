'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const Module = require('module')
const _originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return _originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')

const { INSERT, SELECT, UPDATE } = cds.ql
const {
  ensureHistoryEventSelectDependencies,
  enrichHistoryEventPayload
} = require('../../srv/bug-service/history-read-models')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG1 = '90000000-0000-0000-0000-000000000001'
const BUG3 = '90000000-0000-0000-0000-000000000003'
const DEV_SANG = '20000000-0000-0000-0000-000000000001'
const DEV_DAT = '20000000-0000-0000-0000-000000000002'
const SCENARIO = (process.argv[2] || 'all').trim().toLowerCase()

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS += 1
  else FAIL += 1
  console.log(`  ${icon}  ${label}${detail ? ` | ${detail}` : ''}`)
  RESULTS.push({ label, pass, detail })
}

function user (id, roles) {
  return new cds.User({ id, roles })
}

async function callAction (srv, bugID, actionName, data = {}, requestUser = user('NhanT', ['TESTER', 'authenticated-user'])) {
  const req = new cds.Request({
    method: 'POST',
    event: actionName,
    params: [{ ID: bugID, IsActiveEntity: true }],
    data,
    user: requestUser
  })
  return srv.dispatch(req)
}

async function updateBug (srv, bugID, patch, requestUser = user('NhanT', ['TESTER', 'authenticated-user'])) {
  const req = new cds.Request({
    method: 'PATCH',
    event: 'UPDATE',
    target: srv.entities.Bugs,
    query: UPDATE.entity(srv.entities.Bugs).set(patch).where({ ID: bugID }),
    params: [{ ID: bugID, IsActiveEntity: true }],
    data: { ID: bugID, ...patch },
    user: requestUser
  })
  return srv.dispatch(req)
}

async function latestHistoryEvent (srv, bugID, actionType) {
  const req = {
    query: {
      SELECT: {
        columns: [
          { ref: ['summary'] },
          { ref: ['reason'] },
          { ref: ['groupedChangeContext'] },
          { ref: ['changeCount'] },
          { ref: ['actionType_code'] }
        ]
      }
    }
  }
  ensureHistoryEventSelectDependencies(req)

  const requestedColumns = req.query.SELECT.columns
    .map(column => column?.ref?.[0])
    .filter(Boolean)
  if (!requestedColumns.includes('ID')) {
    throw new Error('History event dependency enrichment did not append ID for sparse reads.')
  }

  const rows = await cds.tx(req).run(
    SELECT.from(srv.entities.HistoryEvents)
      .columns('ID', 'summary', 'reason', 'actionType_code', 'createdAt')
      .where({ bug_ID: bugID, actionType_code: actionType })
      .orderBy('createdAt desc')
      .limit(1)
  )
  await enrichHistoryEventPayload(rows, req, srv.entities)
  return rows?.[0] || null
}

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(` IDTS History Event Contract Verification (${SCENARIO})`)
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const srv = await cds.serve('BugService').from(csn)

  try {
    if (SCENARIO === 'assign' || SCENARIO === 'all') {
      await verifyAssignScenario(srv)
    }

    if (SCENARIO === 'resubmit' || SCENARIO === 'all') {
      await verifyResubmitScenario(srv)
    }

    if (SCENARIO === 'reject' || SCENARIO === 'all') {
      await verifyRejectScenario(srv)
    }

    if (SCENARIO === 'pending' || SCENARIO === 'all') {
      await verifyPendingScenario(srv)
    }

    if (SCENARIO === 'close' || SCENARIO === 'all') {
      await verifyCloseScenario(srv)
    }

    if (SCENARIO === 'edit' || SCENARIO === 'all') {
      await verifyEditScenario(srv)
    }

    if (SCENARIO === 'legacy-labels' || SCENARIO === 'all') {
      await verifyLegacyHistoryLabelNormalization(srv)
    }
  } catch (error) {
    const detail = error?.stack || error?.message || JSON.stringify(error) || 'unknown error'
    rec('HE-00 verification flow bootstraps successfully', false, detail)
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
}

async function verifyAssignScenario (srv) {
    await callAction(srv, BUG1, 'assignToDeveloper', { assigneeID: DEV_DAT, note: 'Assign for history payload test' })
    const assignEvent = await latestHistoryEvent(srv, BUG1, 'ASSIGN_TO_DEVELOPER')
    rec('HE-01 assign summary is readable', assignEvent?.summary?.includes('Assigned bug to DatDT.'), assignEvent?.summary || 'missing summary')
    rec(
      'HE-02 assign grouped context is event-first readable',
      assignEvent?.groupedChangeContext?.includes('Status:') &&
        assignEvent?.groupedChangeContext?.includes('Assignee:') &&
        assignEvent?.groupedChangeContext?.includes('Current Action Owner:') &&
        !assignEvent?.groupedChangeContext?.includes('Next Processor'),
      assignEvent?.groupedChangeContext || 'missing groupedChangeContext'
    )
    rec('HE-03 assign change count is populated', Number(assignEvent?.changeCount) >= 2, `changeCount=${assignEvent?.changeCount ?? 'n/a'}`)
}

async function verifyResubmitScenario (srv) {
    await callAction(srv, BUG1, 'assignToDeveloper', { assigneeID: DEV_DAT, note: 'Prepare resubmit flow' })
    await callAction(srv, BUG1, 'markInReview', {}, user('DatDT', ['DEVELOPER', 'authenticated-user']))
    await callAction(srv, BUG1, 'startProgress', {}, user('DatDT', ['DEVELOPER', 'authenticated-user']))
    await callAction(srv, BUG1, 'requestMoreInformation', { reason: 'Need more browser evidence for timeline check' }, user('DatDT', ['DEVELOPER', 'authenticated-user']))
    await callAction(srv, BUG1, 'resubmitToDeveloper', { note: 'Tester updated the missing details and evidence.' })
    const resubmitEvent = await latestHistoryEvent(srv, BUG1, 'RESUBMIT_TO_DEVELOPER')
    rec(
      'HE-04 resubmit summary stays readable',
      resubmitEvent?.summary?.includes('Resubmitted bug to the assigned developer'),
      resubmitEvent?.summary || 'missing summary'
    )
    rec(
      'HE-05 resubmit grouped context is present on sparse READ',
      !!resubmitEvent?.groupedChangeContext && resubmitEvent.groupedChangeContext.includes('Status:'),
      resubmitEvent?.groupedChangeContext || 'missing groupedChangeContext'
    )
}

async function verifyRejectScenario (srv) {
    await callAction(srv, BUG3, 'rejectBug', { reason: 'Wrong classification for backend timeline contract test' }, user('SangVN', ['DEVELOPER', 'authenticated-user']))
    const rejectEvent = await latestHistoryEvent(srv, BUG3, 'REJECT_BUG')
    rec('HE-06 reject summary is readable', rejectEvent?.summary?.includes('Rejected bug for follow-up.'), rejectEvent?.summary || 'missing summary')
    rec('HE-07 reject reason remains on event payload', rejectEvent?.reason === 'Wrong classification for backend timeline contract test', rejectEvent?.reason || 'missing reason')
    rec(
      'HE-08 reject grouped context remains readable',
      !!rejectEvent?.groupedChangeContext && rejectEvent.groupedChangeContext.includes('Status:'),
      rejectEvent?.groupedChangeContext || 'missing groupedChangeContext'
    )
}

async function verifyCloseScenario (srv) {
    await callAction(srv, BUG3, 'resolveBug', { note: 'Resolved before close event verification' }, user('SangVN', ['DEVELOPER', 'authenticated-user']))
    await callAction(srv, BUG3, 'closeBug', { note: 'PM verified and closed for timeline contract test' })
    const closeEvent = await latestHistoryEvent(srv, BUG3, 'CLOSE_BUG')
    rec('HE-10 close summary is readable', closeEvent?.summary?.includes('Closed bug.'), closeEvent?.summary || 'missing summary')
    rec(
      'HE-11 close grouped context is readable',
      !!closeEvent?.groupedChangeContext && closeEvent.groupedChangeContext.includes('Status:'),
      closeEvent?.groupedChangeContext || 'missing groupedChangeContext'
    )
}

async function verifyPendingScenario (srv) {
    await callAction(srv, BUG3, 'rejectBug', { reason: 'Prepare pending-assignment summary normalization test' }, user('SangVN', ['DEVELOPER', 'authenticated-user']))
    await callAction(srv, BUG3, 'moveToPendingAssignment', { reason: 'Return to PM queue before reassignment' })
    const movedPendingEvent = await latestHistoryEvent(srv, BUG3, 'MOVE_TO_PENDING_ASSIGNMENT')
    rec(
      'HE-09 pending-assignment summary is normalized',
      movedPendingEvent?.summary === 'Moved bug to Pending Assignment.',
      movedPendingEvent?.summary || 'missing summary'
    )
}

async function verifyEditScenario (srv) {
    const newTitle = `History payload title ${Date.now()}`
    const newDescription = `History payload description ${Date.now()}`
    await updateBug(srv, BUG1, { title: newTitle, description: newDescription })
    const editEvent = await latestHistoryEvent(srv, BUG1, 'EDIT')
    rec(
      'HE-12 generic edit summary remains readable',
      !!editEvent?.summary && editEvent.summary.includes('Updated Title'),
      editEvent?.summary || 'missing summary'
    )
    rec(
      'HE-13 generic edit grouped context explains the change',
      !!editEvent?.groupedChangeContext && editEvent.groupedChangeContext.includes('Title:'),
      editEvent?.groupedChangeContext || 'missing groupedChangeContext'
    )
}

async function verifyLegacyHistoryLabelNormalization (srv) {
    const legacyEvent = {
      ID: '99999999-9999-9999-9999-999999999999',
      logs: [
        {
          ID: '99999999-9999-9999-9999-999999999991',
          fieldName: 'nextProcessorUser',
          fieldLabel: 'Next Processor User',
          oldValueDisplay: 'DonHV',
          newValueDisplay: 'DatDT',
          createdAt: '2026-07-02T00:00:00.000Z'
        },
        {
          ID: '99999999-9999-9999-9999-999999999992',
          fieldName: 'nextProcessorRole',
          fieldLabel: 'Next Processor Role',
          oldValueDisplay: 'Tester',
          newValueDisplay: 'Developer',
          createdAt: '2026-07-02T00:00:01.000Z'
        }
      ]
    }

    await enrichHistoryEventPayload([legacyEvent], { user: user('DonHV', ['PM', 'authenticated-user']) }, srv.entities)

    const labels = legacyEvent.logs.map(log => log.fieldLabel)
    rec(
      'HE-14 legacy nextProcessor user label is normalized for expanded logs',
      labels.includes('Current Action Owner') && !labels.includes('Next Processor User'),
      labels.join(', ')
    )
    rec(
      'HE-15 legacy nextProcessor role label is normalized for expanded logs',
      labels.includes('Action Owner Role') && !labels.includes('Next Processor Role'),
      labels.join(', ')
    )
    rec(
      'HE-16 legacy nextProcessor labels are absent from grouped context',
      !!legacyEvent.groupedChangeContext && !legacyEvent.groupedChangeContext.includes('Next Processor'),
      legacyEvent.groupedChangeContext || 'missing groupedChangeContext'
    )
}

main().catch(error => {
  console.error('FATAL:', error.message)
  process.exit(1)
})
