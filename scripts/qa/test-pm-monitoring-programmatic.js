/**
 * IDTS-21 PM Monitoring Backend Verification - Direct CDS/Read-Model Test
 * Verifies filterable monitoring flags on BugService.Bugs and the
 * currentActionOwnerDisplayName read-model enrichment contract.
 */

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
const { INSERT, SELECT } = cds.ql

const {
  enrichBugDisplayFields,
  ensureCapabilitySelectDependencies
} = require('../../srv/bug-service/read-models')

const RESULTS = []
let PASS = 0
let FAIL = 0

const BUG_PENDING = 'BUG-0001'
const BUG_IN_PROGRESS = 'BUG-0003'
const BUG_REJECTED = 'BUG-0004'
const BUG_CLOSED = 'BUG-QA-CLOSED-001'

function rec (label, pass, detail = '') {
  const icon = pass ? 'PASS' : 'FAIL'
  if (pass) PASS++; else FAIL++
  console.log(`  ${icon}  ${label}${detail ? ' | ' + detail : ''}`)
  RESULTS.push({ label, pass, detail })
}

function expectEqual (label, actual, expected) {
  rec(label, actual === expected, `actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`)
}

function expectArrayEqual (label, actual, expected) {
  const actualText = JSON.stringify(actual)
  const expectedText = JSON.stringify(expected)
  rec(label, actualText === expectedText, `actual=${actualText} expected=${expectedText}`)
}

async function main () {
  console.log('')
  console.log('==============================================')
  console.log(' IDTS-21 PM Monitoring Backend Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)

  const srv = await cds.serve('BugService').from(csn)
  const entities = srv.entities

  await db.run(
    INSERT.into('idts.cap.Bugs').entries({
      ID: '90000000-0000-0000-0000-000000000090',
      bugNumber: BUG_CLOSED,
      title: 'QA closed bug for overdue filter verification',
      description: 'Used to verify that closed bugs do not appear as overdue.',
      status_code: 'CLOSED',
      priority_code: 'LOW',
      severity_code: 'MINOR',
      environment_code: 'QAS',
      environmentDetail: 'Local CAP SQLite QA',
      stepsToReproduce: 'Not applicable',
      actualResult: 'Not applicable',
      expectedResult: 'Not applicable',
      applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
      defectCategory_ID: '50000000-0000-0000-0000-000000000001',
      componentCategory_ID: '60000000-0000-0000-0000-000000000001',
      reporter_ID: '10000000-0000-0000-0000-000000000004',
      assignee_ID: null,
      nextProcessorUser_ID: null,
      nextProcessorRole_code: 'NONE',
      plannedCompletionDate: '2026-06-09',
      dueDate: '2026-06-10',
      estimatedEffortHours: '1.00'
    })
  )

  const monitoringRows = await db.run(
    SELECT.from('BugService.Bugs')
      .columns('bugNumber', 'isOverdue', 'isPendingAssignment', 'isRejectedFollowUp', 'isRetestRequired')
      .where({ bugNumber: { in: [BUG_PENDING, BUG_IN_PROGRESS, BUG_REJECTED, BUG_CLOSED] } })
      .orderBy('bugNumber')
  )
  const byBugNumber = new Map(monitoringRows.map(row => [row.bugNumber, row]))

  expectEqual(`${BUG_PENDING} isOverdue`, byBugNumber.get(BUG_PENDING)?.isOverdue, true)
  expectEqual(`${BUG_PENDING} isPendingAssignment`, byBugNumber.get(BUG_PENDING)?.isPendingAssignment, true)
  expectEqual(`${BUG_PENDING} isRejectedFollowUp`, byBugNumber.get(BUG_PENDING)?.isRejectedFollowUp, false)
  expectEqual(`${BUG_PENDING} isRetestRequired`, byBugNumber.get(BUG_PENDING)?.isRetestRequired, false)

  expectEqual(`${BUG_IN_PROGRESS} isOverdue`, byBugNumber.get(BUG_IN_PROGRESS)?.isOverdue, true)
  expectEqual(`${BUG_IN_PROGRESS} isPendingAssignment`, byBugNumber.get(BUG_IN_PROGRESS)?.isPendingAssignment, false)
  expectEqual(`${BUG_IN_PROGRESS} isRejectedFollowUp`, byBugNumber.get(BUG_IN_PROGRESS)?.isRejectedFollowUp, false)

  expectEqual(`${BUG_REJECTED} isRejectedFollowUp`, byBugNumber.get(BUG_REJECTED)?.isRejectedFollowUp, true)
  expectEqual(`${BUG_REJECTED} isPendingAssignment`, byBugNumber.get(BUG_REJECTED)?.isPendingAssignment, false)

  expectEqual(`${BUG_CLOSED} closed bug isOverdue=false`, byBugNumber.get(BUG_CLOSED)?.isOverdue, false)
  expectEqual(`${BUG_CLOSED} closed bug isPendingAssignment=false`, byBugNumber.get(BUG_CLOSED)?.isPendingAssignment, false)

  const overdueBugNumbers = (await db.run(
    SELECT.from('BugService.Bugs')
      .columns('bugNumber')
      .where({ isOverdue: true })
      .orderBy('bugNumber')
  )).map(row => row.bugNumber)
  expectArrayEqual('Filter isOverdue=true', overdueBugNumbers, [BUG_PENDING, 'BUG-0002', BUG_IN_PROGRESS, BUG_REJECTED])

  const pendingBugNumbers = (await db.run(
    SELECT.from('BugService.Bugs')
      .columns('bugNumber')
      .where({ isPendingAssignment: true })
      .orderBy('bugNumber')
  )).map(row => row.bugNumber)
  expectArrayEqual('Filter isPendingAssignment=true', pendingBugNumbers, [BUG_PENDING, 'BUG-0002'])

  const rejectedBugNumbers = (await db.run(
    SELECT.from('BugService.Bugs')
      .columns('bugNumber')
      .where({ isRejectedFollowUp: true })
      .orderBy('bugNumber')
  )).map(row => row.bugNumber)
  expectArrayEqual('Filter isRejectedFollowUp=true', rejectedBugNumbers, [BUG_REJECTED])

  const retestBugNumbers = (await db.run(
    SELECT.from('BugService.Bugs')
      .columns('bugNumber')
      .where({ isRetestRequired: true })
      .orderBy('bugNumber')
  )).map(row => row.bugNumber)
  expectArrayEqual('Filter isRetestRequired=true', retestBugNumbers, [])

  const req = {
    query: {
      SELECT: {
        columns: [
          { ref: ['currentActionOwnerDisplayName'] }
        ]
      }
    }
  }
  ensureCapabilitySelectDependencies(req)
  const selectedRefs = req.query.SELECT.columns
    .map(column => Array.isArray(column?.ref) ? column.ref.join('/') : null)
    .filter(Boolean)
    .sort()
  expectArrayEqual(
    'READ dependency injection for currentActionOwnerDisplayName',
    selectedRefs,
    [
      'ID',
      'assignee_ID',
      'currentActionOwnerDisplayName',
      'nextProcessorRole_code',
      'nextProcessorUser_ID',
      'reporter_ID',
      'status_code'
    ]
  )

  const sparseRows = await db.run(
    SELECT.from('BugService.Bugs')
      .columns('ID', 'bugNumber')
      .where({ bugNumber: { in: [BUG_PENDING, BUG_IN_PROGRESS, BUG_REJECTED, BUG_CLOSED] } })
      .orderBy('bugNumber')
  )
  await enrichBugDisplayFields(
    sparseRows,
    { user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] }) },
    entities
  )
  const actionOwnerByBugNumber = new Map(sparseRows.map(row => [row.bugNumber, row.currentActionOwnerDisplayName]))

  expectEqual(`${BUG_PENDING} currentActionOwnerDisplayName`, actionOwnerByBugNumber.get(BUG_PENDING), 'Project Manager')
  expectEqual(`${BUG_IN_PROGRESS} currentActionOwnerDisplayName`, actionOwnerByBugNumber.get(BUG_IN_PROGRESS), 'SangVN')
  expectEqual(`${BUG_REJECTED} currentActionOwnerDisplayName`, actionOwnerByBugNumber.get(BUG_REJECTED), 'NhanT')
  expectEqual(`${BUG_CLOSED} currentActionOwnerDisplayName`, actionOwnerByBugNumber.get(BUG_CLOSED), null)

  console.log('')
  console.log('==============================================')
  console.log(` TOTAL: ${PASS} PASS  |  ${FAIL} FAIL  |  ${RESULTS.length} checks`)
  console.log('==============================================')

  if (FAIL > 0) {
    console.log('\nFAILED:')
    for (const result of RESULTS.filter(row => !row.pass)) {
      console.log(`  FAIL  ${result.label}`)
      if (result.detail) console.log(`        ${result.detail}`)
    }
    process.exit(1)
  }
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 1000))
  process.exit(1)
})
