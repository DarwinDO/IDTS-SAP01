'use strict'

const cds = require('@sap/cds')
const { SELECT } = cds.ql

const CATALOG_ENTITIES = Object.freeze([
  'CatalogSAPModules',
  'CatalogApplicationComponents',
  'CatalogDefectCategories',
  'CatalogComponentCategories'
])

const CATALOGS = Object.freeze({
  SAP_MODULE: {
    entity: 'idts.cap.SAPModules',
    bugField: 'sapModule_ID',
    responsibilityMode: 'sapModule',
    children: [['idts.cap.SAPModuleComponents', 'sapModule_ID']]
  },
  APPLICATION_COMPONENT: {
    entity: 'idts.cap.ApplicationComponents',
    bugField: 'applicationComponent_ID',
    responsibilityMode: 'component',
    children: [
      ['idts.cap.ComponentCategories', 'component_ID'],
      ['idts.cap.SAPModuleComponents', 'component_ID']
    ]
  },
  DEFECT_CATEGORY: {
    entity: 'idts.cap.DefectCategories',
    bugField: 'defectCategory_ID',
    responsibilityMode: 'defectCategory',
    children: [['idts.cap.ComponentCategories', 'defectCategory_ID']]
  },
  COMPONENT_CATEGORY: {
    entity: 'idts.cap.ComponentCategories',
    bugField: 'componentCategory_ID',
    responsibilityMode: 'componentCategory',
    children: []
  }
})

function registerCatalogHandlers (service, { authorize }) {
  service.before('READ', CATALOG_ENTITIES, req => authorize(req))
  service.before(['CREATE', 'UPDATE', 'DELETE'], CATALOG_ENTITIES, async req => {
    await authorize(req)
    throw catalogError(405, 'CATALOG_READ_ONLY', 'Catalog changes are not enabled yet.')
  })
  service.on('readCatalogImpact', req => readCatalogImpact(req, { authorize }))
}

async function readCatalogImpact (req, { authorize }) {
  const tx = cds.tx(req)
  await authorize(req, tx)

  const catalogType = String(req.data.catalogType || '').trim().toUpperCase()
  const catalog = CATALOGS[catalogType]
  if (!catalog) throw catalogError(400, 'INVALID_CATALOG_TYPE', 'Catalog type is invalid.')

  const catalogID = String(req.data.catalogID || '').trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(catalogID)) {
    throw catalogError(400, 'INVALID_CATALOG_ID', 'Catalog ID is invalid.')
  }

  const target = await tx.run(SELECT.one.from(catalog.entity).columns('ID').where({ ID: catalogID }))
  if (!target) throw catalogError(404, 'CATALOG_NOT_FOUND', 'Catalog item was not found.')

  const bugReferenceCount = await countRows(tx, 'idts.cap.Bugs', { [catalog.bugField]: catalogID })
  const activeResponsibilityCount = await countResponsibilities(tx, catalog, catalogID)
  let activeChildReferenceCount = 0
  for (const [entity, field] of catalog.children) {
    activeChildReferenceCount += await countRows(tx, entity, { active: true, [field]: catalogID })
  }

  return { catalogType, catalogID, bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount }
}

async function countResponsibilities (tx, catalog, catalogID) {
  if (catalog.responsibilityMode === 'sapModule') {
    return countRows(tx, 'idts.cap.DeveloperResponsibilities', { active: true, sapModule_ID: catalogID })
  }
  if (catalog.responsibilityMode === 'componentCategory') {
    return countRows(tx, 'idts.cap.DeveloperResponsibilities', { active: true, componentCategory_ID: catalogID })
  }

  const field = catalog.responsibilityMode === 'component' ? 'component_ID' : 'defectCategory_ID'
  const pairs = await tx.run(SELECT.from('idts.cap.ComponentCategories').columns('ID').where({ [field]: catalogID }))
  if (pairs.length === 0) return 0
  return countRows(tx, 'idts.cap.DeveloperResponsibilities', {
    active: true,
    componentCategory_ID: { in: pairs.map(row => row.ID) }
  })
}

async function countRows (tx, entity, where) {
  const row = await tx.run(SELECT.one.from(entity).columns('count(*) as count').where(where))
  return Number(row?.count || 0)
}

function catalogError (status, code, message) {
  return Object.assign(new Error(message), { status, statusCode: status, code })
}

module.exports = {
  CATALOG_ENTITIES,
  registerCatalogHandlers,
  readCatalogImpact
}
