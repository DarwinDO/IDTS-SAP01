'use strict'

const assert = require('node:assert/strict')

const {
  normalizeDeveloperProfileInput,
  assertDeveloperProfileForRole
} = require('../../srv/user-admin/developer-profile')

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

console.log('IDTS user administration developer profile: PASS')
