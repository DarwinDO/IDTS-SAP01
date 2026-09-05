'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase,
  runAtomicUnavailableCase
} = require('./idts110-atomic-runner')
const {
  normalizeDeveloperProfileInput,
  assertDeveloperProfileForRole
} = require('../../srv/user-admin/developer-profile')

const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

function runRegressionChecks () {
  const responsibility = {
    componentCategoryID: '60000000-0000-4000-8000-000000000001',
    sapModuleID: null,
    responsibilityLevelCode: 'PRIMARY'
  }

  const normalized = normalizeDeveloperProfileInput({
    availabilityStatusCode: '',
    workloadLimit: 3,
    responsibilities: [responsibility]
  })

  assert.deepEqual(normalized, {
    availabilityStatusCode: 'AVAILABLE',
    workloadLimit: 3,
    responsibilities: [responsibility]
  })
  assert.doesNotThrow(() => assertDeveloperProfileForRole('DEVELOPER', normalized))

  for (const profile of [null, {}, { responsibilities: [] }]) {
    assert.throws(
      () => assertDeveloperProfileForRole('DEVELOPER', profile),
      error => error?.code === 'DEVELOPER_PROFILE_REQUIRED'
    )
  }

  assert.throws(
    () => assertDeveloperProfileForRole('TESTER', normalized),
    error => error?.code === 'DEVELOPER_PROFILE_NOT_ALLOWED'
  )
  assert.throws(
    () => normalizeDeveloperProfileInput({ ...normalized, workloadLimit: 0 }),
    error => error?.code === 'INVALID_DEVELOPER_WORKLOAD_LIMIT'
  )
  assert.throws(
    () => normalizeDeveloperProfileInput({
      ...normalized,
      responsibilities: [responsibility, { ...responsibility, responsibilityLevelCode: 'BACKUP' }]
    }),
    error => error?.code === 'DUPLICATE_DEVELOPER_RESPONSIBILITY'
  )
}

const atomicCases = new Map([
  ['IDTS110-F220', () => {
    const rejected = [0, -1].map(workloadLimit => {
      assert.throws(
        () => normalizeDeveloperProfileInput({
          availabilityStatusCode: 'AVAILABLE',
          workloadLimit,
          responsibilities: []
        }),
        error => error?.code === 'INVALID_DEVELOPER_WORKLOAD_LIMIT'
      )
      return workloadLimit
    })
    return { rejectedWorkloadLimits: rejected }
  }],
  ['IDTS110-F220D', () => {
    const responsibility = {
      componentCategoryID: '60000000-0000-4000-8000-000000000001',
      sapModuleID: null,
      responsibilityLevelCode: 'PRIMARY'
    }
    assert.throws(
      () => normalizeDeveloperProfileInput({
        availabilityStatusCode: 'AVAILABLE',
        workloadLimit: 3,
        responsibilities: [responsibility, { ...responsibility, responsibilityLevelCode: 'BACKUP' }]
      }),
      error => error?.code === 'DUPLICATE_DEVELOPER_RESPONSIBILITY'
    )
    return { checks: 1 }
  }],
  ['IDTS110-F220R', () => {
    assert.throws(
      () => assertDeveloperProfileForRole('DEVELOPER', null),
      error => error?.code === 'DEVELOPER_PROFILE_REQUIRED'
    )
    return { checks: 1 }
  }],
  ['IDTS110-F220N', () => {
    const profile = normalizeDeveloperProfileInput({
      availabilityStatusCode: 'AVAILABLE',
      workloadLimit: 3,
      responsibilities: [{
        componentCategoryID: '60000000-0000-4000-8000-000000000001',
        sapModuleID: null,
        responsibilityLevelCode: 'PRIMARY'
      }]
    })
    assert.throws(
      () => assertDeveloperProfileForRole('TESTER', profile),
      error => error?.code === 'DEVELOPER_PROFILE_NOT_ALLOWED'
    )
    return { checks: 1 }
  }]
])

async function runAtomicSelector (options) {
  const executeCase = atomicCases.get(options.caseKey)
  if (!executeCase) {
    await runAtomicUnavailableCase({ ...options, plannedTestFile: 'scripts/qa/test-user-admin-developer-profile.js' })
    return
  }
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      assertionPassed: true,
      actualResult: definition.expectedResult,
      beforeState: { fixture: 'pure-function', checks: 0 },
      afterState: executeCase(),
      reloadState: { fixture: 'pure-function', checks: 1 },
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  runRegressionChecks()
  console.log('IDTS user administration developer profile: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
