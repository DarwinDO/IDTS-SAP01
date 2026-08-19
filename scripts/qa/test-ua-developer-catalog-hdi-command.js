'use strict'

const assert = require('node:assert/strict')
const { buildArgs, CATALOG_VIEWS } = require('../btp/ua-developer-catalog-hdi-command')

assert.equal(CATALOG_VIEWS.length, 2)
assert.equal(buildArgs().filter(value => value === '--simulate-make').length, 1)
assert.equal(buildArgs('migrate').includes('--simulate-make'), false)
for (const mode of ['simulate', 'migrate']) {
  const args = buildArgs(mode)
  for (const option of ['--working-set', '--include-filter', '--deploy']) {
    const start = args.indexOf(option)
    assert.deepEqual(args.slice(start + 1, start + 3), CATALOG_VIEWS)
  }
  assert.equal(args.includes('--undeploy'), false)
  assert.equal(args.some(value => /\.csv$|\.hdbtabledata$|\.hdbtable$/i.test(value)), false)
}
assert.throws(() => buildArgs('unknown'), /Unsupported catalog HDI mode/)

console.log('UA Developer catalog HDI command: PASS')
