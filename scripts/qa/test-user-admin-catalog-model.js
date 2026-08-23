'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')

const EXPECTED_UNIQUES = {
  'idts.cap.SAPModules': ['code'],
  'idts.cap.ApplicationComponents': ['code'],
  'idts.cap.DefectCategories': ['code'],
  'idts.cap.ComponentCategories': ['component', 'defectCategory']
}

async function main () {
  const model = await cds.load('db/schema.cds')

  for (const [entityName, expectedElements] of Object.entries(EXPECTED_UNIQUES)) {
    const definition = model.definitions[entityName]
    assert.ok(definition, `${entityName} exists`)
    const unique = Object.entries(definition)
      .find(([name]) => name.startsWith('@assert.unique.catalog'))?.[1]
    assert.deepEqual(
      unique?.map(item => item['=']),
      expectedElements,
      `${entityName} has the approved catalog uniqueness boundary`
    )
  }

  const audit = model.definitions['idts.cap.CatalogAdministrationAuditEvents']
  assert.ok(audit, 'CatalogAdministrationAuditEvents exists')
  assert.equal(audit.elements.ID?.key, true, 'catalog audit has a cuid key')
  for (const managedField of ['createdAt', 'createdBy', 'modifiedAt', 'modifiedBy']) {
    assert.ok(audit.elements[managedField], `catalog audit has managed field ${managedField}`)
  }

  const expectedFields = {
    actor: ['idts.cap.Users', true],
    catalogType: ['cds.String', true, 30],
    targetID: ['cds.UUID', true],
    action: ['cds.String', true, 30],
    result: ['cds.String', true, 30],
    beforeSummary: ['cds.String', false, 500],
    afterSummary: ['cds.String', false, 500],
    reason: ['cds.String', false, 500],
    correlationId: ['cds.UUID', true]
  }

  for (const [name, [typeOrTarget, notNull, length]] of Object.entries(expectedFields)) {
    const element = audit.elements[name]
    assert.ok(element, `catalog audit field ${name} exists`)
    assert.equal(element.target || element.type, typeOrTarget, `catalog audit field ${name} type`)
    assert.equal(element.notNull === true, notNull, `catalog audit field ${name} nullability`)
    if (length !== undefined) assert.equal(element.length, length, `catalog audit field ${name} length`)
  }

  console.log('IDTS User Administration catalog model contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
