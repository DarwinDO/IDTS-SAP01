#!/usr/bin/env node
'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('assert')
const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT } = cds.ql
const { effectiveCapacity } = require('../../srv/bug-service/capacity')

const DEV_DAT = '20000000-0000-0000-0000-000000000002'
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const COMPONENT_ID = '40000000-0000-0000-0000-000000000001'
const CATEGORY_ID = '50000000-0000-0000-0000-000000000001'
const COMPONENT_CATEGORY_ID = '60000000-0000-0000-0000-000000000001'

const BUGS = {
  ASSIGNED: '97000000-0000-0000-0000-000000000001',
  REJECTED: '97000000-0000-0000-0000-000000000002',
  THIRD: '97000000-0000-0000-0000-000000000003',
  FOURTH: '97000000-0000-0000-0000-000000000004',
  CLOSED: '97000000-0000-0000-0000-000000000005'
}

function bug (ID, number, status, assigneeID = null) {
  return {
    ID,
    bugNumber: number,
    title: `Capacity fixture ${number}`,
    description: 'Developer capacity boundary verification.',
    status_code: status,
    priority_code: 'MEDIUM',
    severity_code: 'MINOR',
    environment_code: 'QAS',
    stepsToReproduce: 'Assign bugs until the configured capacity boundary is reached.',
    actualResult: 'Capacity is evaluated by the backend.',
    expectedResult: 'The fourth open assignment is rejected.',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    componentCategory_ID: COMPONENT_CATEGORY_ID,
    reporter_ID: DONHV_ID,
    assignee_ID: assigneeID,
    nextProcessorUser_ID: assigneeID ? DONHV_ID : DONHV_ID,
    nextProcessorRole_code: assigneeID ? 'DEVELOPER' : 'PM',
    rejectionReason: status === 'REJECTED' ? 'Capacity test keeps rejected bugs in workload.' : null
  }
}

async function callAssign (service, bugID) {
  const req = new cds.Request({
    method: 'POST',
    event: 'assignToDeveloper',
    target: service.entities.Bugs,
    params: [{ ID: bugID, IsActiveEntity: true }],
    data: { assigneeID: DEV_DAT, note: 'Capacity boundary verification' },
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  })
  return service.dispatch(req)
}

async function callMarkInReview (service, bugID) {
  const req = new cds.Request({
    method: 'POST',
    event: 'markInReview',
    target: service.entities.Bugs,
    params: [{ ID: bugID, IsActiveEntity: true }],
    data: {},
    user: new cds.User({ id: 'DatDT', roles: ['DEVELOPER', 'authenticated-user'] })
  })
  return service.dispatch(req)
}

async function main () {
  assert.deepStrictEqual(effectiveCapacity('AVAILABLE', 0).availabilityStatusCode, 'AVAILABLE')
  assert.deepStrictEqual(effectiveCapacity('AVAILABLE', 1).availabilityStatusCode, 'AVAILABLE')
  assert.deepStrictEqual(effectiveCapacity('AVAILABLE', 2).availabilityStatusCode, 'BUSY')
  assert.deepStrictEqual(effectiveCapacity('AVAILABLE', 3).availabilityStatusCode, 'UNAVAILABLE')
  assert.deepStrictEqual(effectiveCapacity('UNAVAILABLE', 0).availabilityStatusCode, 'UNAVAILABLE')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  for (const entity of [
    'idts.cap.NotificationDeliveries',
    'idts.cap.Notifications',
    'idts.cap.HistoryLogs',
    'idts.cap.HistoryEvents',
    'idts.cap.Comments',
    'idts.cap.Bugs'
  ]) {
    await db.run(DELETE.from(entity))
  }

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bug(BUGS.ASSIGNED, 'BUG-CAP-001', 'ASSIGNED', DEV_DAT),
    bug(BUGS.REJECTED, 'BUG-CAP-002', 'REJECTED', DEV_DAT),
    bug(BUGS.THIRD, 'BUG-CAP-003', 'PENDING_ASSIGNMENT'),
    bug(BUGS.FOURTH, 'BUG-CAP-004', 'PENDING_ASSIGNMENT'),
    bug(BUGS.CLOSED, 'BUG-CAP-005', 'CLOSED', DEV_DAT)
  ]))

  const third = await callAssign(service, BUGS.THIRD)
  assert.strictEqual(third.status_code, 'ASSIGNED')
  assert.strictEqual(third.assignee_ID, DEV_DAT)

  const inReview = await callMarkInReview(service, BUGS.THIRD)
  assert.strictEqual(inReview.status_code, 'IN_REVIEW')
  assert.strictEqual(inReview.assignee_ID, DEV_DAT)

  const beforeHistory = await db.run(SELECT.from('idts.cap.HistoryEvents'))
  const beforeNotifications = await db.run(SELECT.from('idts.cap.Notifications'))

  await assert.rejects(
    callAssign(service, BUGS.FOURTH),
    error => error.code === 400 && /3 or more non-Closed bugs/.test(error.message)
  )

  const fourth = await db.run(SELECT.one.from('idts.cap.Bugs').where({ ID: BUGS.FOURTH }))
  assert.strictEqual(fourth.status_code, 'PENDING_ASSIGNMENT')
  assert.strictEqual(fourth.assignee_ID, null)
  assert.strictEqual((await db.run(SELECT.from('idts.cap.HistoryEvents'))).length, beforeHistory.length)
  assert.strictEqual((await db.run(SELECT.from('idts.cap.Notifications'))).length, beforeNotifications.length)

  console.log('PASS: 0-1 Available, 2 Busy, 3+ Unavailable; rejected counts, closed does not, existing lifecycle continues, and the fourth assignment has no side effects.')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
