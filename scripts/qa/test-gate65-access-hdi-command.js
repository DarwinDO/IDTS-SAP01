'use strict'

const assert = require('node:assert/strict')

const {
  SCHEMA_FILES,
  buildArgs
} = require('../btp/gate65-access-hdi-command')

const expectedFiles = [
  'src/gen/idts.cap.UserAccessNotificationDeliveries.hdbtable',
  'src/gen/idts.cap.UserAccessNotificationDeliveries.accessAuditDelivery.hdbindex'
]

assert.deepEqual(SCHEMA_FILES, expectedFiles)

const common = [
  '--exit',
  '--use-hdb',
  '--treat-warnings-as-errors',
  '--treat-deployer-warnings-as-errors',
  '--no-auto-undeploy',
  '--no-trace-vcap-services',
  '--working-set', ...expectedFiles,
  '--include-filter', ...expectedFiles,
  '--deploy', ...expectedFiles
]

assert.deepEqual(buildArgs('simulate'), ['--exit', '--simulate-make', ...common.slice(1)])
assert.deepEqual(buildArgs('migrate'), common)
assert.throws(() => buildArgs('rollback'), /Unsupported Gate 6\.5 HDI mode/)

for (const args of [buildArgs('simulate'), buildArgs('migrate')]) {
  assert.equal(args.includes('--auto-undeploy'), false)
  assert.equal(args.includes('--undeploy'), false)
  assert.equal(args.some(value => /csv|hdbtabledata|seed/i.test(value)), false)
}

console.log('Gate 6.5 access HDI command contract: PASS')
