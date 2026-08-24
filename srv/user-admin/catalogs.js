'use strict'

const crypto = require('node:crypto')
const cds = require('@sap/cds')
const { INSERT, SELECT } = cds.ql

const CATALOG_ENTITIES = Object.freeze([
  'CatalogSAPModules',
  'CatalogApplicationComponents',
  'CatalogDefectCategories',
  'CatalogComponentCategories'
])

const CATALOGS = Object.freeze({
  SAP_MODULE: {
    serviceEntity: 'CatalogSAPModules',
    entity: 'idts.cap.SAPModules',
    codeLength: 20,
    fields: ['code', 'name', 'active', 'administrationReason'],
    bugField: 'sapModule_ID',
    responsibilityMode: 'sapModule',
    children: [['idts.cap.SAPModuleComponents', 'sapModule_ID']]
  },
  APPLICATION_COMPONENT: {
    serviceEntity: 'CatalogApplicationComponents',
    entity: 'idts.cap.ApplicationComponents',
    codeLength: 40,
    fields: ['code', 'name', 'componentType', 'active', 'administrationReason'],
    bugField: 'applicationComponent_ID',
    responsibilityMode: 'component',
    children: [
      ['idts.cap.ComponentCategories', 'component_ID'],
      ['idts.cap.SAPModuleComponents', 'component_ID']
    ]
  },
  DEFECT_CATEGORY: {
    serviceEntity: 'CatalogDefectCategories',
    entity: 'idts.cap.DefectCategories',
    codeLength: 40,
    fields: ['code', 'name', 'categoryType', 'active', 'administrationReason'],
    bugField: 'defectCategory_ID',
    responsibilityMode: 'defectCategory',
    children: [['idts.cap.ComponentCategories', 'defectCategory_ID']]
  },
  COMPONENT_CATEGORY: {
    serviceEntity: 'CatalogComponentCategories',
    entity: 'idts.cap.ComponentCategories',
    fields: ['component_ID', 'defectCategory_ID', 'active', 'administrationReason'],
    bugField: 'componentCategory_ID',
    responsibilityMode: 'componentCategory',
    children: []
  }
})

const CATALOG_BY_SERVICE_ENTITY = Object.freeze(Object.fromEntries(
  Object.entries(CATALOGS).map(([catalogType, catalog]) => [catalog.serviceEntity, { ...catalog, catalogType }])
))

function registerCatalogHandlers (service, { authorize }) {
  service.before('READ', CATALOG_ENTITIES, req => authorize(req))
  service.before('CREATE', CATALOG_ENTITIES, req => prepareCatalogCreate(req, { authorize }))
  service.after('CREATE', CATALOG_ENTITIES, (data, req) => recordCatalogAudit(data, req))
  service.before('UPDATE', CATALOG_ENTITIES, req => prepareCatalogUpdate(req, { authorize }))
  service.after('UPDATE', CATALOG_ENTITIES, (data, req) => recordCatalogAudit(data, req))
  service.before('DELETE', CATALOG_ENTITIES, async req => {
    await authorize(req)
    throw catalogError(405, 'CATALOG_DELETE_FORBIDDEN', 'Catalog items cannot be deleted.')
  })
  service.on('readCatalogImpact', req => readCatalogImpact(req, { authorize }))
}

async function prepareCatalogCreate (req, { authorize }) {
  const tx = cds.tx(req)
  const actor = await authorize(req, tx)
  const catalog = catalogFromRequest(req)
  const targetID = crypto.randomUUID()
  req._catalogRejection = { actorID: actor.ID, catalog, targetID }
  registerCatalogRejectionAudit(req, 'CREATE')
  delete req.data.ID
  assertAllowedFields(req.data, catalog.fields)

  req.data.ID = targetID
  const administrationReason = normalizeOptionalText(
    req.data.administrationReason ?? req.query?.INSERT?.entries?.[0]?.administrationReason,
    500
  )
  delete req.data.administrationReason
  req.data.active = req.data.active !== false

  if (catalog.codeLength) {
    req.data.code = normalizeCatalogCode(req.data.code, catalog.codeLength)
    if (!req.data.code) throw catalogError(400, 'INVALID_CATALOG_CODE', 'Catalog code is invalid.')
    req.data.name = normalizeRequiredText(req.data.name, 120, 'INVALID_CATALOG_NAME', 'Catalog name is invalid.')
    if (Object.hasOwn(req.data, 'componentType')) req.data.componentType = normalizeOptionalText(req.data.componentType, 60)
    if (Object.hasOwn(req.data, 'categoryType')) req.data.categoryType = normalizeOptionalText(req.data.categoryType, 60)
    const duplicate = await tx.run(SELECT.one.from(catalog.entity).columns('ID').where({ code: req.data.code }))
    if (duplicate) throw catalogError(409, 'CATALOG_CODE_EXISTS', 'Catalog code already exists.')
  } else {
    assertUuid(req.data.component_ID, 'INVALID_COMPONENT_ID')
    assertUuid(req.data.defectCategory_ID, 'INVALID_DEFECT_CATEGORY_ID')
    await assertActivePairParents(tx, req.data.component_ID, req.data.defectCategory_ID)
    const duplicate = await tx.run(SELECT.one.from(catalog.entity).columns('ID').where({
      component_ID: req.data.component_ID,
      defectCategory_ID: req.data.defectCategory_ID
    }))
    if (duplicate) throw catalogError(409, 'CATALOG_PAIR_EXISTS', 'Component Category already exists.')
  }

  if (req.query?.INSERT?.entries?.[0]) req.query.INSERT.entries[0] = { ...req.data }
  req._catalogAdministration = { action: 'CREATE', actorID: actor.ID, catalog, administrationReason }
}

async function prepareCatalogUpdate (req, { authorize }) {
  const tx = cds.tx(req)
  const actor = await authorize(req, tx)
  const catalog = catalogFromRequest(req)
  assertAllowedFields(req.data, [...catalog.fields, 'ID'])

  const routeID = String(req.params?.[0]?.ID || '').trim().toLowerCase()
  const payloadID = String(req.data?.ID || '').trim().toLowerCase()
  assertCatalogTargetIdentity(routeID, payloadID)
  const targetID = routeID || payloadID
  assertUuid(targetID, 'INVALID_CATALOG_ID')
  req._catalogRejection = { actorID: actor.ID, catalog, targetID }
  registerCatalogRejectionAudit(req, 'UPDATE')
  const current = await tx.run(SELECT.one.from(catalog.entity).where({ ID: targetID }).forUpdate())
  if (!current) throw catalogError(404, 'CATALOG_NOT_FOUND', 'Catalog item was not found.')
  assertCurrentEtag(req.headers?.['if-match'], current.modifiedAt)

  const administrationReason = normalizeOptionalText(
    req.data.administrationReason ?? req.query?.UPDATE?.data?.administrationReason,
    500
  )
  delete req.data.administrationReason
  delete req.data.ID

  if (Object.hasOwn(req.data, 'active') && typeof req.data.active !== 'boolean') {
    throw catalogError(400, 'INVALID_CATALOG_ACTIVE', 'Catalog active state is invalid.')
  }

  if (catalog.codeLength) {
    if (Object.hasOwn(req.data, 'code')) {
      req.data.code = normalizeCatalogCode(req.data.code, catalog.codeLength)
      if (!req.data.code) throw catalogError(400, 'INVALID_CATALOG_CODE', 'Catalog code is invalid.')
      const duplicate = await tx.run(SELECT.one.from(catalog.entity).columns('ID').where({ code: req.data.code, ID: { '!=': targetID } }))
      if (duplicate) throw catalogError(409, 'CATALOG_CODE_EXISTS', 'Catalog code already exists.')
    }
    if (Object.hasOwn(req.data, 'name')) {
      req.data.name = normalizeRequiredText(req.data.name, 120, 'INVALID_CATALOG_NAME', 'Catalog name is invalid.')
    }
    if (Object.hasOwn(req.data, 'componentType')) req.data.componentType = normalizeOptionalText(req.data.componentType, 60)
    if (Object.hasOwn(req.data, 'categoryType')) req.data.categoryType = normalizeOptionalText(req.data.categoryType, 60)
  } else {
    const componentID = req.data.component_ID || current.component_ID
    const defectCategoryID = req.data.defectCategory_ID || current.defectCategory_ID
    if (Object.hasOwn(req.data, 'component_ID')) assertUuid(componentID, 'INVALID_COMPONENT_ID')
    if (Object.hasOwn(req.data, 'defectCategory_ID')) assertUuid(defectCategoryID, 'INVALID_DEFECT_CATEGORY_ID')
    if (Object.hasOwn(req.data, 'component_ID') || Object.hasOwn(req.data, 'defectCategory_ID') || req.data.active === true) {
      await assertActivePairParents(tx, componentID, defectCategoryID)
    }
    if (Object.hasOwn(req.data, 'component_ID') || Object.hasOwn(req.data, 'defectCategory_ID')) {
      const duplicate = await tx.run(SELECT.one.from(catalog.entity).columns('ID').where({
        component_ID: componentID,
        defectCategory_ID: defectCategoryID,
        ID: { '!=': targetID }
      }))
      if (duplicate) throw catalogError(409, 'CATALOG_PAIR_EXISTS', 'Component Category already exists.')
    }
  }

  let action = 'UPDATE'
  if (current.active === true && req.data.active === false) {
    if (!administrationReason) throw catalogError(400, 'CATALOG_REASON_REQUIRED', 'A reason is required to deactivate a catalog item.')
    const impact = await readCatalogImpactCounts(tx, catalog, targetID)
    if (impact.activeResponsibilityCount > 0 || impact.activeChildReferenceCount > 0) {
      throw catalogError(409, 'CATALOG_HAS_ACTIVE_DEPENDENCIES', 'Active catalog dependencies must be resolved first.')
    }
    action = 'DEACTIVATE'
  } else if (current.active === false && req.data.active === true) {
    action = 'REACTIVATE'
  }

  if (req.query?.UPDATE?.data) req.query.UPDATE.data = { ...req.data }
  req._catalogAdministration = {
    action,
    actorID: actor.ID,
    catalog,
    targetID,
    beforeSummary: catalogSummary(current, catalog),
    administrationReason
  }
}

function registerCatalogRejectionAudit (req, action) {
  req.on('failed', async error => {
    const context = req._catalogRejection
    if (!context || !context.actorID || !context.targetID || !context.catalog) return
    const safeCode = String(error?.code || 'CATALOG_CHANGE_REJECTED').replace(/[^A-Z0-9_]/g, '').slice(0, 80) || 'CATALOG_CHANGE_REJECTED'
    await cds.tx({ tenant: req.tenant, user: req.user }, tx => tx.run(INSERT.into('idts.cap.CatalogAdministrationAuditEvents').entries({
      ID: crypto.randomUUID(),
      actor_ID: context.actorID,
      catalogType: context.catalog.catalogType,
      targetID: context.targetID,
      action,
      result: 'REJECTED',
      beforeSummary: null,
      afterSummary: null,
      reason: safeCode,
      correlationId: crypto.randomUUID()
    })))
  })
}

async function recordCatalogAudit (data, req) {
  const context = req._catalogAdministration
  if (!context) return
  const targetID = data?.ID || context.targetID
  const persisted = await cds.tx(req).run(SELECT.one.from(context.catalog.entity).where({ ID: targetID }))
  await cds.tx(req).run(INSERT.into('idts.cap.CatalogAdministrationAuditEvents').entries({
    ID: crypto.randomUUID(),
    actor_ID: context.actorID,
    catalogType: context.catalog.catalogType,
    targetID,
    action: context.action,
    result: 'SUCCEEDED',
    beforeSummary: context.beforeSummary || null,
    afterSummary: catalogSummary(persisted, context.catalog),
    reason: context.administrationReason,
    correlationId: crypto.randomUUID()
  }))
}

function catalogFromRequest (req) {
  const name = String(req.target?.name || '').split('.').pop()
  const catalog = CATALOG_BY_SERVICE_ENTITY[name]
  if (!catalog) throw catalogError(400, 'INVALID_CATALOG_TYPE', 'Catalog type is invalid.')
  return catalog
}

function assertAllowedFields (data, fields) {
  const unexpected = Object.keys(data || {}).filter(field => field !== 'ID' && !fields.includes(field))
  if (unexpected.length) throw catalogError(400, 'CATALOG_FIELDS_INVALID', 'Catalog payload contains unsupported fields.')
}

function normalizeCatalogCode (value, maxLength) {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return code && code.length <= maxLength && /^[A-Z0-9._-]+$/.test(code) ? code : null
}

function normalizeRequiredText (value, maxLength, code, message) {
  const normalized = normalizeOptionalText(value, maxLength)
  if (!normalized) throw catalogError(400, code, message)
  return normalized
}

function normalizeOptionalText (value, maxLength) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function assertUuid (value, code) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw catalogError(400, code, 'Catalog reference is invalid.')
  }
}

function assertCatalogTargetIdentity (routeID, payloadID) {
  if (routeID && payloadID && routeID !== payloadID) {
    throw catalogError(400, 'CATALOG_ID_IMMUTABLE', 'Catalog ID cannot be changed.')
  }
}

async function assertActivePairParents (tx, componentID, defectCategoryID) {
  const component = await tx.run(SELECT.one.from('idts.cap.ApplicationComponents').columns('ID').where({ ID: componentID, active: true }))
  const defectCategory = await tx.run(SELECT.one.from('idts.cap.DefectCategories').columns('ID').where({ ID: defectCategoryID, active: true }))
  if (!component || !defectCategory) {
    throw catalogError(409, 'INACTIVE_CATALOG_PARENT', 'Component Category parents must be active.')
  }
}

function catalogSummary (data, catalog) {
  if (catalog.codeLength) return `${data.code}: ${data.name}`.slice(0, 500)
  return `${data.component_ID} / ${data.defectCategory_ID}`.slice(0, 500)
}

function assertCurrentEtag (header, modifiedAt) {
  if (!header || header === '*') return
  const raw = String(header).trim().replace(/^W\//i, '').replace(/^"|"$/g, '')
  const expected = new Date(modifiedAt).getTime()
  const actual = new Date(raw).getTime()
  if (!Number.isFinite(expected) || !Number.isFinite(actual) || expected !== actual) {
    throw catalogError(412, 'CATALOG_ETAG_MISMATCH', 'Catalog item changed; reload before saving.')
  }
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

  const { bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount } = await readCatalogImpactCounts(tx, catalog, catalogID)

  return { catalogType, catalogID, bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount }
}

async function readCatalogImpactCounts (tx, catalog, catalogID) {
  const bugReferenceCount = await countRows(tx, 'idts.cap.Bugs', { [catalog.bugField]: catalogID })
  const activeResponsibilityCount = await countResponsibilities(tx, catalog, catalogID)
  let activeChildReferenceCount = 0
  for (const [entity, field] of catalog.children) {
    activeChildReferenceCount += await countRows(tx, entity, { active: true, [field]: catalogID })
  }
  return { bugReferenceCount, activeResponsibilityCount, activeChildReferenceCount }
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
  assertActivePairParents,
  assertCatalogTargetIdentity,
  CATALOG_ENTITIES,
  registerCatalogHandlers,
  readCatalogImpact
}
