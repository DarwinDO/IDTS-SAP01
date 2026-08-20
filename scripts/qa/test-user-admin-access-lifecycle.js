'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const serviceSource = fs.readFileSync(path.join(root, 'srv/user-admin.cds'), 'utf8')
const statusSource = fs.readFileSync(path.join(root, 'db/data/idts.cap-UserOnboardingStatuses.csv'), 'utf8')

assert.match(
  serviceSource,
  /action\s+requestSuspend\(\s*userID\s*:\s*UUID,\s*reason\s*:\s*String\(500\),\s*expectedVersion\s*:\s*Integer\s*\)\s*returns\s+OnboardingResult\s*;/
)
assert.match(
  serviceSource,
  /action\s+requestReactivate\(\s*userID\s*:\s*UUID,\s*reason\s*:\s*String\(500\),\s*expectedVersion\s*:\s*Integer\s*\)\s*returns\s+OnboardingResult\s*;/
)

const rows = statusSource.trim().split(/\r?\n/).slice(1).map(line => {
  const [code, name, descr, sortOrder, active, criticality] = line.split(',')
  return { code, name, descr, sortOrder: Number(sortOrder), active, criticality: Number(criticality) }
})
const existingCodes = new Set([
  'INVITED',
  'IDENTITY_VERIFIED',
  'PENDING_APPROVAL',
  'PROVISION_QUEUED',
  'PROVISIONING',
  'ROLE_CHANGE_QUEUED',
  'ROLE_CHANGING',
  'REVOKE_QUEUED',
  'REVOKING',
  'ACTIVE',
  'RETRYABLE_FAILURE',
  'BLOCKED_MANUAL_REVIEW',
  'FAILED',
  'REVOKED'
])
assert.equal(rows.length, existingCodes.size + 1)
assert.deepEqual(new Set(rows.filter(row => row.code !== 'SUSPENDED').map(row => row.code)), existingCodes)
assert.deepEqual(rows.filter(row => row.code === 'SUSPENDED'), [{
  code: 'SUSPENDED',
  name: 'Suspended',
  descr: 'IDTS-local access is suspended pending an explicit reactivation.',
  sortOrder: 105,
  active: 'true',
  criticality: 1
}])
assert.equal(rows.filter(row => row.code === 'SUSPENDED' && row.active === 'true').length, 1)
assert.equal(rows.find(row => row.code === 'ACTIVE').sortOrder < rows.find(row => row.code === 'SUSPENDED').sortOrder, true)
assert.equal(rows.find(row => row.code === 'SUSPENDED').sortOrder < rows.find(row => row.code === 'RETRYABLE_FAILURE').sortOrder, true)

console.log('IDTS access lifecycle contract: PASS')
