'use strict'

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const fs = require('fs')
const path = require('path')
const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds')
const { SELECT, UPDATE } = cds.ql
const { applyBugCapabilities } = require('../../srv/bug-service/read-models')
const { assertAttachmentPermission } = require('../../srv/bug-service/content')

const DAT_BUG_ID = '90000000-0000-0000-0000-000000000004'
const SANG_BUG_ID = '90000000-0000-0000-0000-000000000003'
const RESULTS = []

function user (name, role) {
  return new cds.User({ id: name, roles: [role, 'authenticated-user'] })
}

const sang = () => user('SangVN', 'DEVELOPER')
const dat = () => user('DatDT', 'DEVELOPER')
const tester = () => user('NhanT', 'TESTER')

function record (label, pass, detail = '') {
  RESULTS.push({ label, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

function permissionRequest () {
  return {
    reject (code, message) {
      const error = new Error(message)
      error.code = code
      throw error
    }
  }
}

async function expectReject (label, action, expectedCode) {
  try {
    await action()
    record(label, false, 'request unexpectedly succeeded')
  } catch (error) {
    const code = Number(error.code || error.statusCode || error.status)
    record(label, code === expectedCode, `code=${code}`)
  }
}

async function dispatchUpdate (service, id, patch, requestUser) {
  const req = new cds.Request({
    method: 'PATCH',
    event: 'UPDATE',
    target: service.entities.Bugs,
    query: UPDATE.entity(service.entities.Bugs).set(patch).where({ ID: id }),
    params: [{ ID: id, IsActiveEntity: true }],
    data: { ID: id, ...patch },
    user: requestUser
  })
  return service.dispatch(req)
}

async function main () {
  console.log('\n==============================================')
  console.log(' IDTS-125 Bug Mutation Authorization Regression')
  console.log(` ${new Date().toISOString()}`)
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)

  const original = await db.run(SELECT.one.from('idts.cap.Bugs').columns('title').where({ ID: DAT_BUG_ID }))
  await expectReject(
    'non-assignee Developer cannot change DatDT Bug fields',
    () => dispatchUpdate(service, DAT_BUG_ID, { title: 'Unauthorized SangVN edit' }, sang()),
    403
  )
  const afterRejectedUpdate = await db.run(SELECT.one.from('idts.cap.Bugs').columns('title').where({ ID: DAT_BUG_ID }))
  record('rejected non-assignee update leaves data unchanged', afterRejectedUpdate?.title === original?.title)

  await expectReject(
    'assigned Developer cannot directly change Bug business fields',
    () => dispatchUpdate(service, SANG_BUG_ID, { title: 'Assigned developer field edit' }, sang()),
    403
  )

  const sangViewOfDatBug = applyBugCapabilities({}, { actorRole: 'DEVELOPER', actorDeveloperProfileID: 'sang-profile', status: 'REJECTED', assigneeID: 'dat-profile' })
  record('non-assignee Developer receives comment-only capability', sangViewOfDatBug?.canAddComment === true && sangViewOfDatBug?.canEdit === false && sangViewOfDatBug?.canManageAttachments === false)

  const datViewOfDatBug = applyBugCapabilities({}, { actorRole: 'DEVELOPER', actorDeveloperProfileID: 'dat-profile', status: 'REJECTED', assigneeID: 'dat-profile' })
  record('assignee Developer receives attachment edit shell only', datViewOfDatBug?.canEdit === true && datViewOfDatBug?.canManageAttachments === true && datViewOfDatBug?.bugRequiredFieldControl === 1 && datViewOfDatBug?.bugOptionalFieldControl === 1)

  const testerView = applyBugCapabilities({}, { actorRole: 'TESTER', actorDeveloperProfileID: null, status: 'REJECTED', assigneeID: 'dat-profile' })
  record('Tester retains Bug editing and attachment capabilities', testerView?.canEdit === true && testerView?.canManageAttachments === true && testerView?.bugRequiredFieldControl === 7 && testerView?.bugOptionalFieldControl === 3)

  await expectReject(
    'unmapped authenticated identity cannot mutate attachments',
    () => assertAttachmentPermission(permissionRequest(), null, false),
    403
  )
  await expectReject(
    'non-assignee Developer attachment mutation is rejected',
    () => assertAttachmentPermission(permissionRequest(), { role_code: 'DEVELOPER' }, false),
    403
  )
  assertAttachmentPermission(permissionRequest(), { role_code: 'DEVELOPER' }, true)
  record('assigned Developer attachment mutation is allowed', true)
  assertAttachmentPermission(permissionRequest(), { role_code: 'TESTER' }, false)
  record('Tester attachment mutation remains allowed', true)

  const labels = fs.readFileSync(path.join(process.cwd(), 'app', 'bug-management-ui', 'annotations', 'labels.cds'), 'utf8')
  const capabilities = fs.readFileSync(path.join(process.cwd(), 'app', 'bug-management-ui', 'annotations', 'capabilities.cds'), 'utf8')
  record('Fiori Bug fields use dynamic role field controls', /bugRequiredFieldControl/.test(labels) && /bugOptionalFieldControl/.test(labels))
  record('Fiori attachment mutations use dedicated capability', /attachments[\s\S]*canManageAttachments/.test(capabilities))

  const expectedChecks = 12
  if (RESULTS.length !== expectedChecks) record('completion guard reached every planned assertion', false, `expected=${expectedChecks} actual=${RESULTS.length}`)
  const failures = RESULTS.filter(result => !result.pass)
  console.log(`\nChecks: ${RESULTS.length} | Passed: ${RESULTS.length - failures.length} | Failed: ${failures.length}`)
  if (failures.length) process.exitCode = 1

  if (typeof service.disconnect === 'function') await service.disconnect()
  if (typeof db.disconnect === 'function') await db.disconnect()
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error?.stack || error)
  process.exitCode = 1
})
