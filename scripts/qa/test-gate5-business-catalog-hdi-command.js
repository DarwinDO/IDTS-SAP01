'use strict'

const assert = require('node:assert/strict')

const {
  buildArgs,
  SCHEMA_FILES
} = require('../btp/gate5-business-catalog-hdi-command')

const expectedFiles = [
  'src/gen/idts.cap.CatalogAdministrationAuditEvents.hdbtable',
  'src/gen/idts.cap.ApplicationComponents.catalogCode.hdbindex',
  'src/gen/idts.cap.ComponentCategories.catalogPair.hdbindex',
  'src/gen/idts.cap.DefectCategories.catalogCode.hdbindex',
  'src/gen/idts.cap.SAPModules.catalogCode.hdbindex'
]

assert.deepEqual(SCHEMA_FILES, expectedFiles)

for (const mode of ['simulate', 'migrate']) {
  const args = buildArgs(mode)

  for (const flag of [
    '--exit',
    '--use-hdb',
    '--treat-warnings-as-errors',
    '--treat-deployer-warnings-as-errors',
    '--no-auto-undeploy',
    '--no-trace-vcap-services'
  ]) {
    assert.equal(args.filter(value => value === flag).length, 1, `${mode}: ${flag}`)
  }

  for (const option of ['--working-set', '--include-filter', '--deploy']) {
    const start = args.indexOf(option)
    assert.notEqual(start, -1, `${mode}: ${option}`)
    assert.deepEqual(args.slice(start + 1, start + 1 + expectedFiles.length), expectedFiles)
  }

  assert.equal(args.includes('--simulate-make'), mode === 'simulate')
  assert.equal(args.includes('--undeploy'), false)
  assert.equal(args.some(value => /\.csv$|\.hdbtabledata$/i.test(value)), false)
}

assert.throws(() => buildArgs('unsupported'), /Unsupported Gate 5 HDI mode/)

console.log('Gate 5 Business Catalog additive HDI command: PASS')
