'use strict'

const assert = require('node:assert/strict')

const {
  buildArgs,
  VIEW_FILES
} = require('../btp/gate5-business-catalog-view-hdi-command')
const {
  buildRollbackArgs
} = require('../btp/gate5-business-catalog-view-hdi-rollback-command')

const expectedFiles = [
  'src/gen/UserAdministrationService.CatalogSAPModules.hdbview',
  'src/gen/UserAdministrationService.CatalogApplicationComponents.hdbview',
  'src/gen/UserAdministrationService.CatalogDefectCategories.hdbview',
  'src/gen/UserAdministrationService.CatalogComponentCategories.hdbview'
]

assert.deepEqual(VIEW_FILES, expectedFiles)

for (const mode of ['simulate', 'migrate']) {
  const args = buildArgs(mode)

  for (const flag of [
    '--exit',
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services'
  ]) assert.equal(args.filter(value => value === flag).length, 1, `${mode}: ${flag}`)

  for (const option of ['--working-set', '--include-filter', '--deploy']) {
    const start = args.indexOf(option)
    assert.notEqual(start, -1, `${mode}: ${option}`)
    assert.deepEqual(args.slice(start + 1, start + 1 + expectedFiles.length), expectedFiles)
  }

  assert.equal(args.includes('--simulate-make'), mode === 'simulate')
  assert.equal(args.includes('--undeploy'), false)
  assert.equal(args.some(value => /\.hdb(table|index)$|\.csv$|\.hdbtabledata$/i.test(value)), false)
}

assert.throws(() => buildArgs('unsupported'), /Unsupported Gate 5 catalog-view HDI mode/)

const rollbackArgs = buildRollbackArgs()
const undeploy = rollbackArgs.indexOf('--undeploy')
assert.notEqual(undeploy, -1)
assert.deepEqual(rollbackArgs.slice(undeploy + 1), expectedFiles)
assert.equal(rollbackArgs.includes('--deploy'), false)
assert.equal(rollbackArgs.some(value => /\.hdb(table|index)$|\.csv$|\.hdbtabledata$/i.test(value)), false)

console.log('Gate 5 Business Catalog exact four-view HDI command: PASS')
