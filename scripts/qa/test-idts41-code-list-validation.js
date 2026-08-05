/**
 * IDTS-41 catalog validation and draft-create authorization verification.
 *
 * Runs against an isolated in-memory SQLite database. No real credentials,
 * SMTP server, or developer database is used.
 */

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

const cds = require('@sap/cds')
const { INSERT, SELECT, UPDATE } = cds.ql

const { assertBugCreatePermission } = require('../../srv/bug-service/permissions')
const { validateActiveCodeLists } = require('../../srv/bug-service/bug-write')

const RESULTS = []
const BASE_ID = '41000000-0000-0000-0000-000000000000'
const COMPONENT_ID = '40000000-0000-0000-0000-000000000006'
const CATEGORY_ID = '50000000-0000-0000-0000-000000000002'

function user (email, role) {
  return new cds.User({ id: email, roles: [role, 'authenticated-user'] })
}

const pm = () => user('donhv@example.local', 'PM')
const tester = () => user('nhant@example.local', 'TESTER')

function record (label, pass, detail = '') {
  RESULTS.push({ label, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

async function expectReject (label, expectedCode, action, expectedTarget) {
  try {
    await action()
    record(label, false, 'request unexpectedly succeeded')
  } catch (error) {
    const code = Number(error.code || error.statusCode || error.status)
    const target = error.target || error.details?.[0]?.target
    const targetMatches = !expectedTarget || target === expectedTarget
    record(label, code === expectedCode && targetMatches, `code=${code} target=${target || 'n/a'}`)
  }
}

function bugData (id, overrides = {}) {
  return {
    ID: id,
    title: `IDTS-41 validation ${id.slice(-4)}`,
    description: 'Catalog validation integration test.',
    stepsToReproduce: 'Submit a bug with controlled catalog values.',
    actualResult: 'The request is evaluated by the backend.',
    expectedResult: 'Only active catalog values are accepted.',
    priority_code: 'HIGH',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    applicationComponent_ID: COMPONENT_ID,
    defectCategory_ID: CATEGORY_ID,
    ...overrides
  }
}

async function dispatchCreate (service, data, requestUser = tester()) {
  const request = new cds.Request({
    method: 'POST',
    event: 'CREATE',
    target: service.entities.Bugs,
    query: INSERT.into(service.entities.Bugs).entries(data),
    data,
    user: requestUser
  })
  return service.dispatch(request)
}

async function dispatchUpdate (service, id, patch, requestUser = pm()) {
  const request = new cds.Request({
    method: 'PATCH',
    event: 'UPDATE',
    target: service.entities.Bugs,
    query: UPDATE.entity(service.entities.Bugs).set(patch).where({ ID: id }),
    params: [{ ID: id, IsActiveEntity: true }],
    data: { ID: id, ...patch },
    user: requestUser
  })
  return service.dispatch(request)
}

function permissionRequest () {
  return {
    reject (code, message, target) {
      const error = new Error(message)
      error.code = code
      error.target = target
      throw error
    }
  }
}

async function main () {
  console.log('\n==============================================')
  console.log(' IDTS-41 Catalog + Draft Authorization QA')
  console.log(` ${new Date().toISOString()}`)
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const service = await cds.serve('BugService').from(csn)
  const entities = service.entities

  const valid = await dispatchCreate(service, bugData(`${BASE_ID.slice(0, -1)}1`))
  record('valid active catalog codes create a bug', valid?.priority_code === 'HIGH')

  const invalidCases = [
    ['numeric-like priority is rejected', 'priority_code', '1', 'priority_code'],
    ['unknown severity is rejected', 'severity_code', 'NOT_A_SEVERITY', 'severity_code'],
    ['wrong-case environment is rejected', 'environment_code', 'qas', 'environment_code'],
    ['whitespace priority is rejected', 'priority_code', '   ', 'priority_code'],
    ['whitespace optional environment is rejected when supplied', 'environment_code', '  ', 'environment_code']
  ]

  let suffix = 2
  for (const [label, field, value, target] of invalidCases) {
    const id = `${BASE_ID.slice(0, -1)}${suffix++}`
    await expectReject(label, 400, () => dispatchCreate(service, bugData(id, { [field]: value })), target)
    const persisted = await db.run(SELECT.one.from('idts.cap.Bugs').columns('ID').where({ ID: id }))
    record(`${label}: invalid row is not persisted`, !persisted)
  }

  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: false }).where({ code: 'LOW' }))
  const inactiveID = `${BASE_ID.slice(0, -1)}7`
  await expectReject(
    'inactive priority is rejected',
    400,
    () => dispatchCreate(service, bugData(inactiveID, { priority_code: 'LOW' })),
    'priority_code'
  )
  await db.run(UPDATE('idts.cap.PriorityValues').set({ active: true }).where({ code: 'LOW' }))

  const updateID = `${BASE_ID.slice(0, -1)}8`
  await dispatchCreate(service, bugData(updateID))
  await expectReject(
    'active bug update rejects unknown priority',
    400,
    () => dispatchUpdate(service, updateID, { priority_code: 'UNKNOWN' }),
    'priority_code'
  )
  const unchanged = await db.run(SELECT.one.from('idts.cap.Bugs').columns('priority_code').where({ ID: updateID }))
  record('rejected update leaves persisted priority unchanged', unchanged?.priority_code === 'HIGH')

  const draftValidationRequest = new cds.Request({ user: pm() })
  await expectReject(
    'draft validation rejects invalid severity before save',
    400,
    () => validateActiveCodeLists(draftValidationRequest, entities, bugData('draft', { severity_code: '1' })),
    'severity_code'
  )

  await expectReject(
    'Developer is denied at root draft creation',
    403,
    () => assertBugCreatePermission(permissionRequest(), { role_code: 'DEVELOPER' })
  )

  assertBugCreatePermission(permissionRequest(), { role_code: 'TESTER' })
  record('Tester is allowed to start root draft creation', true)
  await expectReject(
    'PM is denied at root draft creation',
    403,
    () => assertBugCreatePermission(permissionRequest(), { role_code: 'PM' })
  )

  const expectedChecks = 18
  if (RESULTS.length !== expectedChecks) {
    record('completion guard ran every planned check', false, `actual=${RESULTS.length} expected=${expectedChecks}`)
  }
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
