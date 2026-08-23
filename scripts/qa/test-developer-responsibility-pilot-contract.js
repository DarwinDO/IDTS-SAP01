'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const repositoryRoot = path.resolve(__dirname, '..', '..')
const suites = [
  ['profile validation', 'test-user-admin-developer-profile.js'],
  ['profile administration', 'test-user-admin-developer-profile-actions.js'],
  ['provider-proof completion', 'test-developer-provisioning-completion.js'],
  ['standard onboarding', 'test-user-onboarding-programmatic.js'],
  ['assignment readiness', 'test-idts56-smart-assign.js'],
  ['administration UI', 'test-user-admin-ui.js']
]

for (const [label, script] of suites) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test', CDS_ENV: 'test' }
  })

  if (result.status !== 0) {
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
  }
  assert.equal(result.status, 0, `${label} contract failed`)
  console.log(`  PASS ${label}`)
}

console.log('IDTS Developer responsibility pilot contract: PASS')
