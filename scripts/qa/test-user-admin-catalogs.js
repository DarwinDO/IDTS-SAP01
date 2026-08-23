'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')

async function main () {
  const model = await cds.load('srv/user-admin.cds')
  const service = model.definitions.UserAdministrationService
  assert.ok(service, 'UserAdministrationService exists')

  for (const entity of [
    'CatalogSAPModules',
    'CatalogApplicationComponents',
    'CatalogDefectCategories',
    'CatalogComponentCategories'
  ]) {
    assert.ok(model.definitions[`UserAdministrationService.${entity}`], `${entity} is exposed`)
  }

  assert.ok(model.definitions['UserAdministrationService.readCatalogImpact'], 'readCatalogImpact is exposed')
  console.log('IDTS User Administration catalog service contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
