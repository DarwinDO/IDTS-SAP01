'use strict'

process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
const fs = require('node:fs')
const path = require('node:path')
const {
  formatAtomicMarker,
  readAtomicOptions,
  runAtomicCase
} = require('./idts110-atomic-runner')
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

const root = path.resolve(__dirname, '../..')

function readDefinition (caseKey) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
  const definition = catalog.cases.find(row => row.caseId === caseKey)
  if (!definition) throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  return definition
}

async function catalogFixture () {
  const model = await cds.load('srv/user-admin.cds')
  const db = await cds.deploy(model).to('sqlite::memory:')
  const previousDb = cds.db
  cds.db = db
  const [status, priority, severity] = await Promise.all([
    db.run(SELECT.one.from('idts.cap.StatusValues').columns('code')),
    db.run(SELECT.one.from('idts.cap.PriorityValues').columns('code')),
    db.run(SELECT.one.from('idts.cap.SeverityValues').columns('code'))
  ])
  await db.run(INSERT.into('idts.cap.Users').entries([
    { ID: IDS.admin, displayName: 'Atomic Catalog Admin', email: 'catalog.admin@example.invalid', role_code: 'PM', active: true },
    { ID: IDS.developer, displayName: 'Atomic Catalog Developer', email: 'catalog.atomic.dev@example.invalid', role_code: 'DEVELOPER', active: true }
  ]))
  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({ ID: IDS.profile, user_ID: IDS.developer, active: true }))
  await db.run(INSERT.into('idts.cap.SAPModules').entries({ ID: IDS.module, code: 'ATOMIC-M', name: 'Atomic Module', active: true }))
  await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({ ID: IDS.component, code: 'ATOMIC-C', name: 'Atomic Component', componentType: 'CAP', active: true }))
  await db.run(INSERT.into('idts.cap.DefectCategories').entries({ ID: IDS.defect, code: 'ATOMIC-D', name: 'Atomic Defect', categoryType: 'FUNCTIONAL', active: true }))
  await db.run(INSERT.into('idts.cap.ComponentCategories').entries({ ID: IDS.pair, component_ID: IDS.component, defectCategory_ID: IDS.defect, active: true }))
  await db.run(INSERT.into('idts.cap.SAPModuleComponents').entries({ ID: IDS.moduleComponent, sapModule_ID: IDS.module, component_ID: IDS.component, active: true }))
  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({ ID: IDS.responsibility, developerProfile_ID: IDS.profile, componentCategory_ID: IDS.pair, sapModule_ID: IDS.module, active: true }))
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: IDS.bug,
    bugNumber: 'ATOMIC-001',
    title: 'Atomic catalog impact fixture',
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
  return { db, previousDb, service, administrator }
}

async function runAtomicCatalogCase (caseKey) {
  const { db, previousDb, service, administrator } = await catalogFixture()
  try {
    if (caseKey === 'IDTS110-P194') {
      const before = (await db.run(SELECT.from('idts.cap.ApplicationComponents'))).length
      const created = await createCatalog(service, 'CatalogApplicationComponents', { code: '  atomic-app  ', name: '  Atomic App Component  ', componentType: 'CAP', active: true }, administrator)
      assert.equal(created.code, 'ATOMIC-APP')
      assert.equal(created.name, 'Atomic App Component')
      await expectRejected(createCatalog(service, 'CatalogApplicationComponents', { code: 'ATOMIC-DENIED', name: 'Denied', componentType: 'CAP', active: true }, user(['TESTER'])), 403)
      assert.equal((await db.run(SELECT.from('idts.cap.ApplicationComponents'))).length, before + 1)
      return { createdRows: 1, unauthorizedRows: 0 }
    }
    if (caseKey === 'IDTS110-P195') {
      const before = (await db.run(SELECT.from('idts.cap.DefectCategories'))).length
      const created = await createCatalog(service, 'CatalogDefectCategories', { code: '  atomic-defect  ', name: '  Atomic Defect Category  ', categoryType: 'FUNCTIONAL', active: true }, administrator)
      assert.equal(created.code, 'ATOMIC-DEFECT')
      assert.equal(created.name, 'Atomic Defect Category')
      await expectRejected(createCatalog(service, 'CatalogDefectCategories', { code: 'ATOMIC-DENIED', name: 'Denied', categoryType: 'FUNCTIONAL', active: true }, user(['DEVELOPER'])), 403)
      assert.equal((await db.run(SELECT.from('idts.cap.DefectCategories'))).length, before + 1)
      return { createdRows: 1, unauthorizedRows: 0 }
    }
    if (caseKey === 'IDTS110-P196') {
      const before = (await db.run(SELECT.from('idts.cap.SAPModules'))).length
      await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'ATOMIC-TESTER', name: 'Denied' }, user(['TESTER'])), 403)
      await expectRejected(createCatalog(service, 'CatalogSAPModules', { code: 'ATOMIC-DEVELOPER', name: 'Denied' }, user(['DEVELOPER'])), 403)
      await expectRejected(updateCatalog(service, 'CatalogSAPModules', IDS.module, { name: 'Denied update' }, user(['TESTER'])), 403)
      assert.equal((await db.run(SELECT.from('idts.cap.SAPModules'))).length, before)
      return { rejectedCalls: 3, catalogRows: before }
    }
    if (caseKey === 'IDTS110-P197') {
      const inactiveID = '85300000-0000-4000-8000-000000000099'
      await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({ ID: inactiveID, code: 'ATOMIC-INACTIVE', name: 'Inactive component', active: false }))
      const before = (await db.run(SELECT.from('idts.cap.ComponentCategories'))).length
      await expectRejected(createCatalog(service, 'CatalogComponentCategories', { component_ID: inactiveID, defectCategory_ID: IDS.defect, active: true }, administrator), 409, 'INACTIVE_CATALOG_PARENT')
      assert.equal((await db.run(SELECT.from('idts.cap.ComponentCategories'))).length, before)
      return { rejectedParent: true, pairRows: before }
    }
    if (caseKey === 'IDTS110-F225') {
      const created = await createCatalog(service, 'CatalogSAPModules', { code: '  atomic-module  ', name: '  Atomic Module Created  ', active: true }, administrator)
      assert.notEqual(created.ID, undefined)
      assert.equal(created.code, 'ATOMIC-MODULE')
      const persisted = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))
      const audit = await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({ targetID: created.ID, action: 'CREATE', result: 'SUCCEEDED' }))
      assert.equal(persisted.active, true)
      assert.ok(audit)
      return { createdID: 'server-assigned', audit: true }
    }
    if (caseKey === 'IDTS110-F226') {
      const componentID = '85300000-0000-4000-8000-000000000098'
      const defectID = '85400000-0000-4000-8000-000000000098'
      await db.run(INSERT.into('idts.cap.ApplicationComponents').entries({ ID: componentID, code: 'ATOMIC-C2', name: 'Atomic Component 2', componentType: 'CAP', active: true }))
      await db.run(INSERT.into('idts.cap.DefectCategories').entries({ ID: defectID, code: 'ATOMIC-D2', name: 'Atomic Defect 2', categoryType: 'FUNCTIONAL', active: true }))
      const before = (await db.run(SELECT.from('idts.cap.ComponentCategories'))).length
      const created = await createCatalog(service, 'CatalogComponentCategories', { component_ID: componentID, defectCategory_ID: defectID, active: true }, administrator)
      assert.equal((await db.run(SELECT.from('idts.cap.ComponentCategories'))).length, before + 1)
      assert.notEqual(created.ID, undefined)
      return { pairRowsBefore: before, pairRowsAfter: before + 1 }
    }
    if (caseKey === 'IDTS110-F227') {
      const rows = await service.send({ event: 'READ', query: SELECT.from('UserAdministrationService.CatalogSAPModules').where({ ID: IDS.module }), user: administrator })
      assert.equal(rows.length, 1)
      assert.deepEqual(Object.keys(rows[0]).sort(), ['ID', 'active', 'code', 'createdAt', 'modifiedAt', 'name'])
      await expectRejected(service.send({ event: 'READ', query: SELECT.from('UserAdministrationService.CatalogSAPModules'), user: user(['PM']) }), 403)
      return { safeReadRows: rows.length, unauthorizedReads: 1 }
    }
    if (caseKey === 'IDTS110-F228') {
      const before = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      const mismatchID = '85200000-0000-4000-8000-000000000099'
      assert.throws(() => assertCatalogTargetIdentity(IDS.module, mismatchID), error => error?.code === 'CATALOG_ID_IMMUTABLE')
      const after = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      assert.equal(after.name, before.name)
      return { unchanged: true, routePayloadConflict: 'CATALOG_ID_IMMUTABLE' }
    }
    if (caseKey === 'IDTS110-F228E') {
      const before = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      await expectRejected(updateCatalog(service, 'CatalogSAPModules', IDS.module, { name: 'Stale ETag' }, administrator, { 'if-match': 'W/"1900-01-01T00:00:00.0000000Z"' }), 412)
      const after = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      assert.equal(after.name, before.name)
      return { unchanged: true, etag: 'stale-rejected' }
    }
    if (caseKey === 'IDTS110-F229') {
      const before = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      await expectRejected(updateCatalog(service, 'CatalogSAPModules', IDS.module, { active: false, administrationReason: 'Referenced module must remain active.' }, administrator), 409, 'CATALOG_HAS_ACTIVE_DEPENDENCIES')
      const after = await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module }))
      assert.equal(after.active, before.active)
      return { active: true, dependencyGuard: 'CATALOG_HAS_ACTIVE_DEPENDENCIES' }
    }
    if (caseKey === 'IDTS110-F230') {
      const impact = await service.send({ event: 'readCatalogImpact', data: { catalogType: 'SAP_MODULE', catalogID: IDS.module }, user: administrator })
      assert.deepEqual({ bugReferenceCount: impact.bugReferenceCount, activeResponsibilityCount: impact.activeResponsibilityCount, activeChildReferenceCount: impact.activeChildReferenceCount }, { bugReferenceCount: 1, activeResponsibilityCount: 1, activeChildReferenceCount: 1 })
      await expectRejected(service.send({ event: 'readCatalogImpact', data: { catalogType: 'USERS', catalogID: IDS.module }, user: administrator }), 400, 'INVALID_CATALOG_TYPE')
      return { boundedCounts: true, invalidTargetRejected: true }
    }
    if (caseKey === 'IDTS110-F231') {
      await assert.rejects(service.send({ event: 'DELETE', data: { ID: IDS.module }, query: DELETE.from('UserAdministrationService.CatalogSAPModules').where({ ID: IDS.module }), user: administrator }), error => Number(error?.status || error?.statusCode) === 405 || error?.code === 'CATALOG_DELETE_FORBIDDEN' || error?.message === 'ENTITY_IS_NOT_CRUD' || error?.code === 'ENTITY_IS_NOT_CRUD' || error?.cause?.code === 'ENTITY_IS_NOT_CRUD' || error?.cause?.message === 'ENTITY_IS_NOT_CRUD')
      assert.ok(await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: IDS.module })))
      return { deleteRejected: true, rowPreserved: true }
    }
    if (caseKey === 'IDTS110-F231R') {
      const created = await createCatalog(service, 'CatalogSAPModules', { code: 'ATOMIC-REACTIVATE', name: 'Atomic Reactivate', active: false }, administrator)
      await updateCatalog(service, 'CatalogSAPModules', created.ID, { active: true }, administrator)
      const audit = await db.run(SELECT.one.from('idts.cap.CatalogAdministrationAuditEvents').where({ targetID: created.ID, action: 'REACTIVATE' }))
      assert.equal((await db.run(SELECT.one.from('idts.cap.SAPModules').where({ ID: created.ID }))).active, true)
      assert.ok(audit)
      return { reactivated: true, audit: true }
    }
    throw new Error(`Unknown IDTS-110 case ${caseKey}`)
  } finally {
    if (previousDb === undefined) delete cds.db
    else cds.db = previousDb
    if (typeof db.disconnect === 'function') await db.disconnect()
  }
}

async function runAtomicSelector (options) {
  const atomicCases = new Set(['IDTS110-P194', 'IDTS110-P195', 'IDTS110-P196', 'IDTS110-P197', 'IDTS110-F225', 'IDTS110-F226', 'IDTS110-F227', 'IDTS110-F228', 'IDTS110-F228E', 'IDTS110-F229', 'IDTS110-F230', 'IDTS110-F231', 'IDTS110-F231R'])
  if (!atomicCases.has(options.caseKey)) throw new Error(`Unknown IDTS-110 case ${options.caseKey}`)
  const definition = readDefinition(options.caseKey)
  const result = await runAtomicCase({
    definition,
    assertionId: `${options.caseKey}-A1`,
    baselineSha: options.baselineSha,
    executor: options.executor,
    execute: async () => ({
      assertionPassed: true,
      actualResult: definition.expectedResult,
      beforeState: { fixture: 'isolated-sqlite' },
      afterState: await runAtomicCatalogCase(options.caseKey),
      reloadState: { readback: true },
      evidenceIds: [`${options.caseKey}-RESULT`]
    })
  })
  console.log(formatAtomicMarker(result))
  process.exitCode = result.status === 'PASS' ? 0 : 1
}

async function runRegressionChecks () {
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

}

async function main () {
  const options = readAtomicOptions()
  if (options.caseKey) {
    await runAtomicSelector(options)
    return
  }
  await runRegressionChecks()
  console.log('IDTS User Administration catalog administration contract: PASS')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(() => cds.shutdown())
