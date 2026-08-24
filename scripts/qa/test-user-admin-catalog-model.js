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
  const [model, serviceModel] = await Promise.all([
    cds.load('db/schema.cds'),
    cds.load('srv/user-admin.cds')
  ])

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

  for (const entityName of [
    'UserAdministrationService.CatalogSAPModules',
    'UserAdministrationService.CatalogApplicationComponents',
    'UserAdministrationService.CatalogDefectCategories',
    'UserAdministrationService.CatalogComponentCategories'
  ]) {
    const id = serviceModel.definitions[entityName]?.elements?.ID
    assert.equal(id?.['@Core.Immutable'], true, `${entityName}.ID remains immutable`)
    assert.equal(id?.['@Core.Computed'], true, `${entityName}.ID is server-generated for OData clients`)
    assert.equal(
      serviceModel.definitions[entityName]?.elements?.administrationReason?.['@Core.Computed'],
      false,
      `${entityName}.administrationReason remains a writable transient command field`
    )
  }

  const componentCategoryProjection = serviceModel.definitions['UserAdministrationService.CatalogComponentCategories']
  const projectedReferences = componentCategoryProjection.projection.columns.map(column => column.ref).filter(Boolean)
  assert.ok(
    projectedReferences.some(reference => reference.length === 1 && reference[0] === 'component'),
    'Component Category exposes the writable component association'
  )
  assert.ok(
    projectedReferences.some(reference => reference.length === 1 && reference[0] === 'defectCategory'),
    'Component Category exposes the writable defect-category association'
  )
  assert.equal(
    projectedReferences.some(reference => reference.length > 1 && reference.at(-1) === 'ID'),
    false,
    'Component Category avoids read-only association-path aliases for foreign-key writes'
  )

  console.log('IDTS User Administration catalog model contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
