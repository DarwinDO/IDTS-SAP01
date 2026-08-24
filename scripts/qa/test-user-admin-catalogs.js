'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const { DELETE, INSERT, SELECT, UPDATE } = cds.ql
const { assertActivePairParents, assertCatalogTargetIdentity } = require('../../srv/user-admin/catalogs')

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
  ['CatalogSAPModules', ['ID', 'code', 'name', 'active', 'administrationReason', 'createdAt', 'modifiedAt']],
  ['CatalogApplicationComponents', ['ID', 'code', 'name', 'componentType', 'active', 'administrationReason', 'createdAt', 'modifiedAt']],
  ['CatalogDefectCategories', ['ID', 'code', 'name', 'categoryType', 'active', 'administrationReason', 'createdAt', 'modifiedAt']],
  ['CatalogComponentCategories', ['ID', 'component', 'defectCategory', 'active', 'administrationReason', 'createdAt', 'modifiedAt']]
]

function user (roles) {
  return new cds.User({ id: 'catalog.admin@example.invalid', roles: ['authenticated-user', ...roles] })
}

async function expectRejected (operation, status, code) {
  await assert.rejects(operation, error => Number(error?.status || error?.statusCode) === status && (!code || error?.code === code))
}

function createCatalog (service, entity, data, administrator) {
  return service.send({
    event: 'CREATE',
    data: { ...data },
    query: INSERT.into(`UserAdministrationService.${entity}`).entries({ ...data }),
    user: administrator
  })
}

function updateCatalog (service, entity, ID, data, administrator, headers) {
  return service.send({
    event: 'UPDATE',
    data: { ID, ...data },
    query: UPDATE(`UserAdministrationService.${entity}`).set({ ...data }).where({ ID }),
    headers,
    user: administrator
  })
}

async function main () {
  let queryActive = false
  const singleConnectionTx = {
    async run () {
      assert.equal(queryActive, false, 'pair-parent reads do not overlap on one database connection')
      queryActive = true
      await new Promise(resolve => setImmediate(resolve))
      queryActive = false
      return { ID: IDS.component }
    }
  }
  await assertActivePairParents(singleConnectionTx, IDS.component, IDS.defect)
  assert.doesNotThrow(() => assertCatalogTargetIdentity(IDS.module, IDS.module), 'the same normalized target key is harmless')
  assert.throws(
    () => assertCatalogTargetIdentity(IDS.module, IDS.component),
    error => error.code === 'CATALOG_ID_IMMUTABLE',
    'a mismatched route and payload key is rejected'
  )

  const model = await cds.load('srv/user-admin.cds')
  assert.ok(model.definitions.UserAdministrationService, 'UserAdministrationService exists')

  for (const [entityName, safeFields] of CATALOGS) {
    const definition = model.definitions[`UserAdministrationService.${entityName}`]
    assert.ok(definition, `${entityName} is exposed`)
    assert.equal(definition['@cds.query.limit.max'], 100, `${entityName} caps reads at 100 rows`)
    assert.deepEqual(Object.keys(definition.elements).sort(), safeFields.sort(), `${entityName} exposes only safe fields`)
    assert.equal(definition.elements.modifiedAt['@odata.etag'], true, `${entityName} uses modifiedAt as ETag`)
    assert.equal(definition['@Capabilities.DeleteRestrictions.Deletable'], false, `${entityName} metadata forbids DELETE`)
    assert.equal(definition.elements.ID['@Core.Immutable'], true, `${entityName} metadata marks ID immutable`)
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

  const created = await createCatalog(service, 'CatalogSAPModules', { code: '  g5-new  ', name: '  Gate 5 New Module  ', active: true }, administrator)
  assert.equal(created.code, 'G5-NEW', 'CREATE normalizes catalog codes')
  assert.equal(created.name, 'Gate 5 New Module', 'CREATE trims catalog names')

  const clientSuppliedID = '85200000-0000-4000-8000-000000000099'
  const serverOwnedID = await createCatalog(service, 'CatalogSAPModules', {
    ID: clientSuppliedID,
    code: 'G5-CLIENT-ID',
    name: 'Client ID must be replaced'
  }, administrator)
  assert.notEqual(serverOwnedID.ID, clientSuppliedID, 'CREATE always replaces a client or framework supplied ID')
  assert.equal(
    await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: clientSuppliedID })),
    undefined,
    'client-supplied catalog IDs never become persisted rows'
  )

  const createAudit = await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({
    targetID: created.ID,
    catalogType: 'SAP_MODULE',
    action: 'CREATE',
    result: 'SUCCEEDED'
  }))
  assert.equal(createAudit.actor_ID, IDS.admin, 'CREATE records the authorized actor')
  assert.equal(createAudit.afterSummary, 'G5-NEW: Gate 5 New Module', 'CREATE audit stores only the safe display summary')

  const updated = await updateCatalog(service, 'CatalogSAPModules', created.ID, { name: '  Updated Gate 5 Module  ' }, administrator)
  assert.equal(updated.name, 'Updated Gate 5 Module', 'UPDATE trims catalog names')
  const persistedUpdate = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))
  assert.equal(persistedUpdate.code, 'G5-NEW', 'UPDATE preserves an omitted catalog code')

  const sameIDUpdate = await service.send({
    event: 'UPDATE',
    data: { ID: created.ID, name: 'Framework-normalized ID update' },
    query: UPDATE('UserAdministrationService.CatalogSAPModules')
      .set({ ID: created.ID, name: 'Framework-normalized ID update' })
      .where({ ID: created.ID }),
    user: administrator
  })
  assert.equal(
    (await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))).name,
    sameIDUpdate.name,
    'a framework-normalized key equal to the route key does not retarget the row'
  )

  await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'bad code!', name: 'Bad' }, administrator), 400, 'INVALID_CATALOG_CODE')
  const rejectedAudit = await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({
    catalogType: 'SAP_MODULE',
    action: 'CREATE',
    result: 'REJECTED',
    reason: 'INVALID_CATALOG_CODE'
  }))
  assert.equal(rejectedAudit.actor_ID, IDS.admin, 'authorized validation rejection records a safe audit event')
  assert.equal(rejectedAudit.beforeSummary, null, 'rejection audit does not persist request payloads')
  assert.equal(rejectedAudit.afterSummary, null, 'rejection audit does not persist request payloads')
  await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'G5-NAME', name: '   ' }, administrator), 400, 'INVALID_CATALOG_NAME')
  await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'g5-new', name: 'Duplicate' }, administrator), 409, 'CATALOG_CODE_EXISTS')
  await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'G5-EXTRA', name: 'Extra', createdBy: 'client' }, administrator), 400)
  await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'G5-DENIED', name: 'Denied' }, user(['TESTER'])), 403)

  const alternate = await createCatalog(service, 'CatalogSAPModules', { code: 'G5-ALT', name: 'Alternate Module' }, administrator)
  await expectRejected(updateCatalog(service, 'CatalogSAPModules', alternate.ID, { code: ' g5-new ' }, administrator), 409, 'CATALOG_CODE_EXISTS')
  await expectRejected(updateCatalog(service, 'CatalogSAPModules', alternate.ID, {
    name: 'Stale write must fail'
  }, administrator, { 'if-match': 'W/"1900-01-01T00:00:00.0000000Z"' }), 412)

  await expectRejected(createCatalog(service, 'CatalogComponentCategories', {
    component_ID: IDS.component,
    defectCategory_ID: IDS.defect,
    active: true
  }, administrator), 409, 'CATALOG_PAIR_EXISTS')

  const inactiveComponentID = '85300000-0000-4000-8000-000000000099'
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({
    ID: inactiveComponentID,
    code: 'G5-INACTIVE',
    name: 'Inactive component',
    active: false
  }))
  await expectRejected(createCatalog(service, 'CatalogComponentCategories', {
    component_ID: inactiveComponentID,
    defectCategory_ID: IDS.defect,
    active: true
  }, administrator), 409, 'INACTIVE_CATALOG_PARENT')

  await expectRejected(updateCatalog(service, 'CatalogSAPModules', IDS.module, {
    active: false,
    administrationReason: 'This referenced module must remain active.'
  }, administrator), 409, 'CATALOG_HAS_ACTIVE_DEPENDENCIES')
  await expectRejected(updateCatalog(service, 'CatalogSAPModules', created.ID, { active: false }, administrator), 400, 'CATALOG_REASON_REQUIRED')

  await updateCatalog(service, 'CatalogSAPModules', created.ID, {
    active: false,
    administrationReason: 'Retired after impact review.'
  }, administrator)
  assert.equal((await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))).active, false, 'safe deactivation persists')
  const deactivateAudit = await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({
    targetID: created.ID,
    action: 'DEACTIVATE'
  }))
  assert.equal(deactivateAudit.reason, 'Retired after impact review.', 'deactivation audit records the bounded reason')

  await updateCatalog(service, 'CatalogSAPModules', created.ID, { active: true }, administrator)
  assert.equal((await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))).active, true, 'reactivation persists')
  assert.ok(await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({ targetID: created.ID, action: 'REACTIVATE' })), 'reactivation is audited')

  const beforeAuditFailure = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: alternate.ID }))
  await db.run(`CREATE TRIGGER fail_gate5_catalog_audit BEFORE INSERT ON idts_cap_CatalogAdministrationAuditEvents BEGIN SELECT RAISE(ABORT, 'forced audit failure'); END`)
  await assert.rejects(updateCatalog(service, 'CatalogSAPModules', alternate.ID, { name: 'Must roll back' }, administrator))
  const afterAuditFailure = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: alternate.ID }))
  assert.equal(afterAuditFailure.name, beforeAuditFailure.name, 'audit failure rolls back the catalog update')
  await db.run('DROP TRIGGER fail_gate5_catalog_audit')

  await assert.rejects(service.send({
    event: 'DELETE',
    data: { ID: IDS.module },
    query: DELETE.from('UserAdministrationService.CatalogSAPModules').where({ ID: IDS.module }),
    user: administrator
  }), error => Number(error?.status || error?.statusCode) === 405 || error?.code === 'CATALOG_DELETE_FORBIDDEN' || error?.code === 'ENTITY_IS_NOT_CRUD' || error?.message === 'ENTITY_IS_NOT_CRUD' || error?.cause?.code === 'ENTITY_IS_NOT_CRUD' || error?.cause?.message === 'ENTITY_IS_NOT_CRUD')

  console.log('IDTS User Administration catalog administration contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
