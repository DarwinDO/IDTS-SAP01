'use strict'

const assert = require('node:assert/strict')
const { SCHEMA_FILES } = require('../btp/gate65-access-hdi-command')
const { buildRollbackArgs } = require('../btp/gate65-access-hdi-rollback-command')

const args = buildRollbackArgs()
for (const flag of [
  '--exit',
  '--use-hdb',
  '--treat-warnings-as-errors',
  '--treat-deployer-warnings-as-errors',
  '--no-auto-undeploy',
  '--no-trace-vcap-services'
]) assert.equal(args.filter(value => value === flag).length, 1, flag)

const undeploy = args.indexOf('--undeploy')
assert.notEqual(undeploy, -1)
assert.deepEqual(args.slice(undeploy + 1), SCHEMA_FILES)
assert.equal(args.includes('--deploy'), false)
assert.equal(args.some(value => /\.csv$|\.hdbtabledata$|seed/i.test(value)), false)

console.log('Gate 6.5 access exact rollback command: PASS')
