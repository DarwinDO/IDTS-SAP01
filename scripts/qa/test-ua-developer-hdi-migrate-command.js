'use strict'

const assert = require('node:assert/strict')
const { SCHEMA_FILES } = require('../btp/ua-developer-hdi-simulate-command')
const { buildMigrationArgs } = require('../btp/ua-developer-hdi-migrate-command')

const args = buildMigrationArgs()
assert.equal(SCHEMA_FILES.length, 11)
for (const flag of ['--exit', '--use-hdb', '--treat-warnings-as-errors', '--treat-deployer-warnings-as-errors', '--no-auto-undeploy', '--no-trace-vcap-services']) {
  assert.equal(args.filter(value => value === flag).length, 1, `${flag} must occur exactly once`)
}
for (const option of ['--working-set', '--include-filter', '--deploy']) {
  const start = args.indexOf(option)
  assert.notEqual(start, -1)
  assert.deepEqual(args.slice(start + 1, start + 1 + SCHEMA_FILES.length), SCHEMA_FILES)
}
assert.equal(args.includes('--simulate-make'), false)
assert.equal(args.includes('--undeploy'), false)
assert.equal(args.some(value => /\.csv$|\.hdbtabledata$/i.test(value)), false)

console.log('UA Developer additive HDI migration command: PASS')
