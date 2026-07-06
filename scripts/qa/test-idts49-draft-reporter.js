/**
 * IDTS-49 draft reporter regression.
 *
 * This test protects the smallest risky backend boundary:
 * - creation permission must resolve to a real active IDTS actor;
 * - Fiori draft NEW must set reporter_ID from that actor;
 * - draft SAVE must fill reporter_ID for older incomplete drafts before
 *   required-field validation rejects the activation.
 *
 * The shared Render smoke after merge verifies the full HTTP NEW -> SAVE path.
 */

'use strict'

const {
  assertBugCreatePermission
} = require('../../srv/bug-service/permissions')
const {
  ensureDraftReporterForSave,
  prepareDraftNew
} = require('../../srv/bug-service/drafts')

const RESULTS = []
const EXPECTED_CHECKS = 10
const DONHV_ID = '10000000-0000-0000-0000-000000000001'
const NHANT_ID = '10000000-0000-0000-0000-000000000004'
const DEVELOPER_ID = '10000000-0000-0000-0000-000000000002'

function request (data = {}) {
  return {
    data,
    reject (code, message, target) {
      const error = new Error(message)
      error.code = code
      error.statusCode = code
      error.target = target
      throw error
    }
  }
}

function actor (id, roleCode) {
  return { ID: id, role_code: roleCode }
}

function record (label, pass, detail = '') {
  RESULTS.push({ label, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` | ${detail}` : ''}`)
}

async function expectReject (label, action, expectedCode, expectedTarget) {
  try {
    await action()
    record(label, false, 'request unexpectedly succeeded')
  } catch (error) {
    const code = Number(error.code || error.statusCode || error.status)
    const target = error.target || error.details?.[0]?.target
    record(label, code === expectedCode && target === expectedTarget, `code=${code} target=${target || 'n/a'}`)
  }
}

async function main () {
  console.log('\n==============================================')
  console.log(' IDTS-49 Draft Reporter Regression')
  console.log(` ${new Date().toISOString()}`)
  console.log('==============================================')

  record(
    'draft reporter helpers are exported',
    typeof prepareDraftNew === 'function' && typeof ensureDraftReporterForSave === 'function'
  )

  await expectReject(
    'unmapped create identity is rejected safely',
    () => assertBugCreatePermission(request(), null),
    403,
    'reporter_ID'
  )

  await expectReject(
    'Developer cannot start bug creation',
    () => assertBugCreatePermission(request(), actor(DEVELOPER_ID, 'DEVELOPER')),
    403,
    undefined
  )

  record(
    'Tester can start bug creation and returns actor',
    assertBugCreatePermission(request(), actor(NHANT_ID, 'TESTER'))?.ID === NHANT_ID
  )

  record(
    'PM can start bug creation and returns actor',
    assertBugCreatePermission(request(), actor(DONHV_ID, 'PM'))?.ID === DONHV_ID
  )

  const pmNew = request({ ID: '49000000-0000-0000-0000-000000000001' })
  await prepareDraftNew(pmNew, actor(DONHV_ID, 'PM'))
  record('draft NEW derives reporter from authenticated actor', pmNew.data.reporter_ID === DONHV_ID)

  const testerNew = request({
    ID: '49000000-0000-0000-0000-000000000002',
    reporter_ID: DONHV_ID
  })
  await prepareDraftNew(testerNew, actor(NHANT_ID, 'TESTER'))
  record('draft NEW overwrites client-supplied reporter', testerNew.data.reporter_ID === NHANT_ID)

  const missingReporterDraft = { ID: '49000000-0000-0000-0000-000000000003', reporter_ID: null }
  await ensureDraftReporterForSave(request(), null, missingReporterDraft, actor(DONHV_ID, 'PM'))
  record('draft SAVE fallback fills reporter for older incomplete draft', missingReporterDraft.reporter_ID === DONHV_ID)

  const existingReporterDraft = { ID: '49000000-0000-0000-0000-000000000004', reporter_ID: NHANT_ID }
  await ensureDraftReporterForSave(request(), null, existingReporterDraft, actor(DONHV_ID, 'PM'))
  record('draft SAVE preserves an existing reporter', existingReporterDraft.reporter_ID === NHANT_ID)

  await expectReject(
    'draft SAVE rejects missing reporter when actor cannot be resolved',
    () => ensureDraftReporterForSave(request(), null, { ID: '49000000-0000-0000-0000-000000000005' }, null),
    403,
    'reporter_ID'
  )

  if (RESULTS.length !== EXPECTED_CHECKS) {
    record(
      'completion guard reached every planned assertion',
      false,
      `expected=${EXPECTED_CHECKS} actual=${RESULTS.length}`
    )
  }

  const failures = RESULTS.filter(result => !result.pass)
  console.log(`\nChecks: ${RESULTS.length} | Passed: ${RESULTS.length - failures.length} | Failed: ${failures.length}`)
  if (failures.length) process.exitCode = 1
}

main().catch(error => {
  console.error('RESULT: FAIL')
  console.error(error?.stack || error)
  process.exitCode = 1
})
