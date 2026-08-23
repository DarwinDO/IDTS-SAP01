'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql

const IDS = {
  admin: '85000000-0000-4000-8000-000000000001',
  developer: '85000000-0000-4000-8000-000000000002',
  profile: '85100000-0000-4000-8000-000000000001',
  module: '85200000-0000-4000-8000-000000000001',
  component: '85300000-0000-4000-8000-000000000001',
  defect: '85400000-0000-4000-8000-000000000001',
  pair: '85500000-0000-4000-8000-000000000001',
  moduleComponent: '85600000-0000-4000-8000-000000000001',
  responsibility: '85700000-0000-4000-8000-000000000001',
  bug: '85800000-0000-4000-8000-000000000001'
}

const CATALOGS = [
  ['CatalogSAPModules', ['ID', 'code', 'name', 'active', 'createdAt', 'modifiedAt']],
  ['CatalogApplicationComponents', ['ID', 'code', 'name', 'componentType', 'active', 'createdAt', 'modifiedAt']],
  ['CatalogDefectCategories', ['ID', 'code', 'name', 'categoryType', 'active', 'createdAt', 'modifiedAt']],
  ['CatalogComponentCategories', ['ID', 'component_ID', 'defectCategory_ID', 'active', 'createdAt', 'modifiedAt']]
]

function user (roles) {
  return new cds.User({ id: 'catalog.admin@example.invalid', roles: ['authenticated-user', ...roles] })
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && (!code || error?.code === code))
}

async function main () {
  const model = await cds.load('srv/user-admin.cds')
  assert.ok(model.definitions.UserAdministrationService, 'UserAdministrationService exists')

  for (const [entityName, safeFields] of CATALOGS) {
    const definition = model.definitions[`UserAdministrationService.${entityName}`]
    assert.ok(definition, `${entityName} is exposed`)
    assert.equal(definition['@cds.query.limit.max'], 100, `${entityName} caps reads at 100 rows`)
    assert.deepEqual(Object.keys(definition.elements).sort(), safeFields.sort(), `${entityName} exposes only safe fields`)
    assert.equal(definition.elements.modifiedAt['@odata.etag'], true, `${entityName} uses modifiedAt as ETag`)
  }

  assert.ok(model.definitions['UserAdministrationService.readCatalogImpact'], 'readCatalogImpact is exposed')

  const db = await cds.deploy(model).to('sqlite::memory:')
  cds.db = db
  const [status, priority, severity] = await Promise.all([
    db.run(SELECT.one.from('idts.cap.StatusValues').columns('code')),
    db.run(SELECT.one.from('idts.cap.PriorityValues').columns('code')),
    db.run(SELECT.one.from('idts.cap.SeverityValues').columns('code'))
  ])

  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: IDS.admin, displayName: 'Catalog Admin', email: 'catalog.admin@example.invalid', role_code: 'PM', active: true },
    { ID: IDS.developer, displayName: 'Catalog Developer', email: 'catalog.developer@example.invalid', role_code: 'DEVELOPER', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({ ID: IDS.profile, user_ID: IDS.developer, active: true }))
  await db.run(INSERT.into('idts.cap.SAPModules').entries({ ID: IDS.module, code: 'G5M', name: 'Gate 5 Module', active: true }))
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({ ID: IDS.component, code: 'G5C', name: 'Gate 5 Component', componentType: 'CAP', active: true }))
  await db.run(INSERT.into('idts.cap.DefectCategories').entries({ ID: IDS.defect, code: 'G5D', name: 'Gate 5 Defect', categoryType: 'FUNCTIONAL', active: true }))
  await db.run(INSERT.into('idts.cap.ComponentCategories').entries({ ID: IDS.pair, component_ID: IDS.component, defectCategory_ID: IDS.defect, active: true }))
  await db.run(INSERT.into('idts.cap.SAPModuleComponents').entries({ ID: IDS.moduleComponent, sapModule_ID: IDS.module, component_ID: IDS.component, active: true }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({ ID: IDS.responsibility, developerProfile_ID: IDS.profile, componentCategory_ID: IDS.pair, sapModule_ID: IDS.module, active: true }))
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: IDS.bug,
    bugNumber: 'GATE5-001',
    title: 'Gate 5 impact fixture',
    description: 'Catalog impact fixture.',
    status_code: status.code,
    priority_code: priority.code,
    severity_code: severity.code,
    stepsToReproduce: 'Open the fixture.',
    actualResult: 'Fixture exists.',
    expectedResult: 'Fixture remains readable.',
    sapModule_ID: IDS.module,
    applicationComponent_ID: IDS.component,
    defectCategory_ID: IDS.defect,
    componentCategory_ID: IDS.pair,
    reporter_ID: IDS.admin
  }))

  const service = await cds.serve('UserAdministrationService').from('srv/user-admin.cds')
  const administrator = user(['PM', 'UserAdmin'])

  const modules = await service.send({
    event: 'READ',
    query: SELECT.from('UserAdministrationService.CatalogSAPModules').where({ ID: IDS.module }),
    user: administrator
  })
  assert.equal(modules.length, 1, 'PM and UserAdmin can read catalog rows')

  const inactive = await service.send({
    event: 'READ',
    query: SELECT.from('UserAdministrationService.CatalogSAPModules').where({ active: false }),
    user: administrator
  })
  assert.ok(Array.isArray(inactive), 'active state can be filtered explicitly')

  for (const roles of [[], ['TESTER'], ['DEVELOPER'], ['PM'], ['PM', 'UserAdmin', 'TESTER']]) {
    await expectRejected(service.send({
      event: 'READ',
      query: SELECT.from('UserAdministrationService.CatalogSAPModules'),
      user: user(roles)
    }), 403)
  }

  const expectedImpacts = [
    ['SAP_MODULE', IDS.module, 1, 1, 1],
    ['APPLICATION_COMPONENT', IDS.component, 1, 1, 2],
    ['DEFECT_CATEGORY', IDS.defect, 1, 1, 1],
    ['COMPONENT_CATEGORY', IDS.pair, 1, 1, 0]
  ]
  for (const [catalogType, catalogID, bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount] of expectedImpacts) {
    const result = await service.send({ event: 'readCatalogImpact', data: { catalogType, catalogID }, user: administrator })
    assert.deepEqual(
      { bugReferenceCount: result.bugReferenceCount, activeResponsibilityCount: result.activeResponsibilityCount, activeChildReferenceCount: result.activeChildReferenceCount },
      { bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount },
      `${catalogType} returns bounded impact counts`
    )
  }

  await expectRejected(service.send({ event: 'readCatalogImpact', data: { catalogType: 'USERS', catalogID: IDS.module }, user: administrator }), 400, 'INVALID_CATALOG_TYPE')
  await expectRejected(service.send({ event: 'readCatalogImpact', data: { catalogType: 'SAP_MODULE', catalogID: 'not-a-uuid' }, user: administrator }), 400, 'INVALID_CATALOG_ID')
  await expectRejected(service.send({ event: 'readCatalogImpact', data: { catalogType: 'SAP_MODULE', catalogID: '85900000-0000-4000-8000-000000000099' }, user: administrator }), 404, 'CATALOG_NOT_FOUND')

  for (const [event, query] of [
    ['CREATE', INSERT.into('UserAdministrationService.CatalogSAPModules').entries({ code: 'NOPE', name: 'Nope', active: true })],
    ['UPDATE', UPDATE('UserAdministrationService.CatalogSAPModules').set({ name: 'Nope' }).where({ ID: IDS.module })],
    ['DELETE', DELETE.from('UserAdministrationService.CatalogSAPModules').where({ ID: IDS.module })]
  ]) {
    await expectRejected(service.send({ event, query, user: administrator }), 405, 'CATALOG_READ_ONLY')
  }

  console.log('IDTS User Administration catalog read contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
