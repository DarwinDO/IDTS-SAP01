/**
 * IDTS-22 Developer Workload Backend Verification
 * Verifies the read-only DeveloperWorkloads aggregate contract for PM monitoring.
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

const RESULTS = []
let PASS = 0
let FAIL = 0

const USERS = {
  ZERO: '10000000-0000-0000-0000-000000000005',
  LEGACY: '10000000-0000-0000-0000-000000000006',
  IDLE_INACTIVE: '10000000-0000-0000-0000-000000000007',
  SANG: '10000000-0000-0000-0000-000000000002',
  NHANT: '10000000-0000-0000-0000-000000000004'
}

const PROFILES = {
  SANG: '20000000-0000-0000-0000-000000000001',
  DAT: '20000000-0000-0000-0000-000000000002',
  ZERO: '20000000-0000-0000-0000-000000000003',
  LEGACY: '20000000-0000-0000-0000-000000000004',
  IDLE_INACTIVE: '20000000-0000-0000-0000-000000000005'
}

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
  console.log(' IDTS Developer Workload Backend Verification')
  console.log(' ' + new Date().toISOString())
  console.log('==============================================')

  const csn = await cds.load('srv/service.cds')
  const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
  await cds.deploy(csn).to(db)
  const srv = await cds.serve('BugService').from(csn)

  await seedWorkloadScenario(db)

  const pmTx = srv.tx({
    user: new cds.User({ id: 'DonHV', roles: ['PM', 'authenticated-user'] })
  })

  const allRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .orderBy('developerName')
  )
  const byDeveloperName = new Map(allRows.map(row => [row.developerName, row]))

  expectEqual('DeveloperWorkloads row count', allRows.length, 4)
  expectArrayEqual(
    'DeveloperWorkloads names',
    allRows.map(row => row.developerName),
    ['DatDT', 'LegacyDev', 'SangVN', 'ZeroDev']
  )

  const sang = byDeveloperName.get('SangVN')
  expectEqual('SangVN openOwnedBugCount', sang?.openOwnedBugCount, 6)
  expectEqual('SangVN overdueOwnedBugCount', sang?.overdueOwnedBugCount, 4)
  expectEqual('SangVN currentActionItemCount', sang?.currentActionItemCount, 4)
  expectEqual('SangVN assignedCount', sang?.assignedCount, 1)
  expectEqual('SangVN inReviewCount', sang?.inReviewCount, 1)
  expectEqual('SangVN inProgressCount', sang?.inProgressCount, 1)
  expectEqual('SangVN reopenedCount', sang?.reopenedCount, 1)
  expectEqual('SangVN needMoreInformationCount', sang?.needMoreInformationCount, 1)
  expectEqual('SangVN resolvedCount', sang?.resolvedCount, 1)
  expectEqual('SangVN retestRequiredCount', sang?.retestRequiredCount, 0)
  expectEqual('SangVN rejectedCount', sang?.rejectedCount, 0)
  expectEqual('SangVN estimatedEffortHoursTotal', Number(sang?.estimatedEffortHoursTotal), 19.5)
  expectEqual('SangVN isOverloaded', sang?.isOverloaded, true)

  const dat = byDeveloperName.get('DatDT')
  expectEqual('DatDT openOwnedBugCount', dat?.openOwnedBugCount, 1)
  expectEqual('DatDT overdueOwnedBugCount', dat?.overdueOwnedBugCount, 1)
  expectEqual('DatDT currentActionItemCount', dat?.currentActionItemCount, 0)
  expectEqual('DatDT rejectedCount', dat?.rejectedCount, 1)
  expectEqual('DatDT estimatedEffortHoursTotal', Number(dat?.estimatedEffortHoursTotal), 3.5)

  const legacy = byDeveloperName.get('LegacyDev')
  expectEqual('LegacyDev active=false still visible with backlog', legacy?.active, false)
  expectEqual('LegacyDev openOwnedBugCount', legacy?.openOwnedBugCount, 1)
  expectEqual('LegacyDev currentActionItemCount', legacy?.currentActionItemCount, 1)
  expectEqual('LegacyDev isOverloaded', legacy?.isOverloaded, false)

  const zero = byDeveloperName.get('ZeroDev')
  expectEqual('ZeroDev active=true visible with zero load', zero?.active, true)
  expectEqual('ZeroDev openOwnedBugCount', zero?.openOwnedBugCount, 0)
  expectEqual('ZeroDev isOverloaded', zero?.isOverloaded, false)

  rec(
    'IdleInactiveDev omitted when inactive and zero backlog',
    !byDeveloperName.has('IdleInactiveDev'),
    `names=${JSON.stringify([...byDeveloperName.keys()])}`
  )

  const overloadedRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .columns('developerName')
      .where({ isOverloaded: true })
      .orderBy('developerName')
  )
  expectArrayEqual('Filter isOverloaded=true', overloadedRows.map(row => row.developerName), ['SangVN'])

  const activeRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .columns('developerName')
      .where({ active: true })
      .orderBy('developerName')
  )
  expectArrayEqual('Filter active=true', activeRows.map(row => row.developerName), ['DatDT', 'SangVN', 'ZeroDev'])

  const inactiveRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .columns('developerName')
      .where({ active: false })
      .orderBy('developerName')
  )
  expectArrayEqual('Filter active=false', inactiveRows.map(row => row.developerName), ['LegacyDev'])

  const searchQuery = SELECT.from('BugService.DeveloperWorkloads')
    .columns('developerName')
    .orderBy('developerName')
  searchQuery.SELECT.search = [{ val: 'legacy' }]
  const searchRows = await pmTx.run(searchQuery)
  expectArrayEqual('Search legacy', searchRows.map(row => row.developerName), ['LegacyDev'])

  const byProfileRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .columns('developerName', 'openOwnedBugCount')
      .where({ developerProfileID: PROFILES.SANG })
  )
  expectArrayEqual(
    'Filter developerProfileID=SangVN',
    byProfileRows.map(row => `${row.developerName}:${row.openOwnedBugCount}`),
    ['SangVN:6']
  )

  const pagedRows = await pmTx.run(
    SELECT.from('BugService.DeveloperWorkloads')
      .columns('developerName')
      .orderBy('developerName')
      .limit(2, 1)
  )
  expectArrayEqual('Limit 2 offset 1', pagedRows.map(row => row.developerName), ['LegacyDev', 'SangVN'])

  const countQuery = SELECT.from('BugService.DeveloperWorkloads').columns('developerName')
  countQuery.SELECT.count = true
  const countRows = await pmTx.run(countQuery)
  expectEqual('DeveloperWorkloads $count=true', countRows.$count, 4)

  const projection = await pmTx.run(
    SELECT.one.from('BugService.DeveloperWorkloads')
      .columns('developerName', 'openOwnedBugCount', 'isOverloaded')
      .where({ developerName: 'SangVN' })
  )
  expectArrayEqual(
    'Projection keeps only selected fields',
    Object.keys(projection || {}).sort(),
    ['developerName', 'isOverloaded', 'openOwnedBugCount']
  )

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

async function seedWorkloadScenario (db) {
  await db.run(INSERT.into('idts.cap.Users').entries([
    {
      ID: USERS.ZERO,
      displayName: 'ZeroDev',
      email: 'zerodev@example.local',
      role_code: 'DEVELOPER',
      active: true
    },
    {
      ID: USERS.LEGACY,
      displayName: 'LegacyDev',
      email: 'legacydev@example.local',
      role_code: 'DEVELOPER',
      active: false
    },
    {
      ID: USERS.IDLE_INACTIVE,
      displayName: 'IdleInactiveDev',
      email: 'idleinactive@example.local',
      role_code: 'DEVELOPER',
      active: false
    }
  ]))

  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries([
    {
      ID: PROFILES.ZERO,
      user_ID: USERS.ZERO,
      availabilityStatus_code: 'AVAILABLE',
      workloadLimit: 3,
      active: true
    },
    {
      ID: PROFILES.LEGACY,
      user_ID: USERS.LEGACY,
      availabilityStatus_code: 'AVAILABLE',
      workloadLimit: 2,
      active: false
    },
    {
      ID: PROFILES.IDLE_INACTIVE,
      user_ID: USERS.IDLE_INACTIVE,
      availabilityStatus_code: 'AVAILABLE',
      workloadLimit: 2,
      active: false
    }
  ]))

  await db.run(INSERT.into('idts.cap.Bugs').entries([
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000091',
      bugNumber: 'BUG-WL-001',
      status_code: 'ASSIGNED',
      assignee_ID: PROFILES.SANG,
      nextProcessorUser_ID: USERS.SANG,
      nextProcessorRole_code: 'DEVELOPER',
      dueDate: '2026-06-19',
      estimatedEffortHours: '2.00'
    }),
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000092',
      bugNumber: 'BUG-WL-002',
      status_code: 'IN_REVIEW',
      assignee_ID: PROFILES.SANG,
      nextProcessorUser_ID: USERS.SANG,
      nextProcessorRole_code: 'DEVELOPER',
      dueDate: '2026-06-21',
      estimatedEffortHours: '1.50'
    }),
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000093',
      bugNumber: 'BUG-WL-003',
      status_code: 'REOPENED',
      assignee_ID: PROFILES.SANG,
      nextProcessorUser_ID: USERS.SANG,
      nextProcessorRole_code: 'DEVELOPER',
      dueDate: '2026-06-20',
      estimatedEffortHours: '1.00'
    }),
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000094',
      bugNumber: 'BUG-WL-004',
      status_code: 'NEED_MORE_INFORMATION',
      assignee_ID: PROFILES.SANG,
      nextProcessorUser_ID: USERS.NHANT,
      nextProcessorRole_code: 'TESTER',
      dueDate: '2026-06-18',
      estimatedEffortHours: '4.00'
    }),
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000095',
      bugNumber: 'BUG-WL-005',
      status_code: 'RESOLVED',
      assignee_ID: PROFILES.SANG,
      nextProcessorUser_ID: USERS.NHANT,
      nextProcessorRole_code: 'TESTER',
      dueDate: '2026-06-17',
      estimatedEffortHours: '3.00'
    }),
    bugEntry({
      ID: '90000000-0000-0000-0000-000000000096',
      bugNumber: 'BUG-WL-LEGACY',
      status_code: 'ASSIGNED',
      assignee_ID: PROFILES.LEGACY,
      nextProcessorUser_ID: USERS.LEGACY,
      nextProcessorRole_code: 'DEVELOPER',
      dueDate: '2026-06-25',
      estimatedEffortHours: '2.25'
    })
  ]))
}

function bugEntry (overrides) {
  return {
    title: `Workload seed for ${overrides.bugNumber}`,
    description: 'Used to verify DeveloperWorkloads aggregate behavior.',
    priority_code: 'MEDIUM',
    severity_code: 'MAJOR',
    environment_code: 'QAS',
    environmentDetail: 'Local CAP SQLite workload QA',
    stepsToReproduce: 'Open PM monitoring workload summary.',
    actualResult: 'Aggregate must reflect developer workload counts.',
    expectedResult: 'Developer workload row is accurate and filterable.',
    applicationComponent_ID: '40000000-0000-0000-0000-000000000001',
    defectCategory_ID: '50000000-0000-0000-0000-000000000001',
    componentCategory_ID: '60000000-0000-0000-0000-000000000001',
    reporter_ID: USERS.NHANT,
    plannedCompletionDate: '2026-06-24',
    testCaseRef: null,
    testRunRef: null,
    rejectionReason: null,
    ...overrides
  }
}

main().catch(err => {
  console.error('FATAL:', err.message)
  console.error(err.stack?.substring(0, 1000))
  process.exit(1)
})
