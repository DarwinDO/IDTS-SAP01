'use strict'

const { createHash } = require('node:crypto')
const {
  decryptCanonicalDocument,
  encryptCanonicalDocument
} = require('./user-admin-logical-backup-contract')

const MANAGED = Object.freeze([
  ['ID', 'ID'],
  ['createdAt', 'CREATEDAT'],
  ['createdBy', 'CREATEDBY'],
  ['modifiedAt', 'MODIFIEDAT'],
  ['modifiedBy', 'MODIFIEDBY']
])

const CATALOGS = Object.freeze([
  {
    key: 'sapModules',
    table: 'IDTS_CAP_SAPMODULES',
    tempTable: '#IDTS_G5_SAPMODULES_RESTORE',
    columns: Object.freeze([...MANAGED, ['code', 'CODE'], ['name', 'NAME'], ['active', 'ACTIVE']]),
    tempColumns: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "code" NVARCHAR(20) NOT NULL, "name" NVARCHAR(120) NOT NULL, "active" BOOLEAN'
  },
  {
    key: 'applicationComponents',
    table: 'IDTS_CAP_APPLICATIONCOMPONENTS',
    tempTable: '#IDTS_G5_APPLICATIONCOMPONENTS_RESTORE',
    columns: Object.freeze([...MANAGED, ['code', 'CODE'], ['name', 'NAME'], ['componentType', 'COMPONENTTYPE'], ['active', 'ACTIVE']]),
    tempColumns: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "code" NVARCHAR(40) NOT NULL, "name" NVARCHAR(120) NOT NULL, "componentType" NVARCHAR(60), "active" BOOLEAN'
  },
  {
    key: 'defectCategories',
    table: 'IDTS_CAP_DEFECTCATEGORIES',
    tempTable: '#IDTS_G5_DEFECTCATEGORIES_RESTORE',
    columns: Object.freeze([...MANAGED, ['code', 'CODE'], ['name', 'NAME'], ['categoryType', 'CATEGORYTYPE'], ['active', 'ACTIVE']]),
    tempColumns: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "code" NVARCHAR(40) NOT NULL, "name" NVARCHAR(120) NOT NULL, "categoryType" NVARCHAR(60), "active" BOOLEAN'
  },
  {
    key: 'componentCategories',
    table: 'IDTS_CAP_COMPONENTCATEGORIES',
    tempTable: '#IDTS_G5_COMPONENTCATEGORIES_RESTORE',
    columns: Object.freeze([...MANAGED, ['component_ID', 'COMPONENT_ID'], ['defectCategory_ID', 'DEFECTCATEGORY_ID'], ['active', 'ACTIVE']]),
    tempColumns: '"ID" NVARCHAR(36) NOT NULL, "createdAt" TIMESTAMP, "createdBy" NVARCHAR(255), "modifiedAt" TIMESTAMP, "modifiedBy" NVARCHAR(255), "component_ID" NVARCHAR(36) NOT NULL, "defectCategory_ID" NVARCHAR(36) NOT NULL, "active" BOOLEAN'
  }
])

function normalizeValue (value) {
  return value instanceof Date ? value.toISOString() : value
}

function canonicalizeRows (catalog, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${catalog.key} requires a non-empty row set.`)
  const expected = catalog.columns.map(([logical]) => logical).sort()
  const normalized = rows.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Row does not satisfy the exact catalog column contract.')
    const keys = Object.keys(row).sort()
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
      throw new Error('Row does not satisfy the exact catalog column contract.')
    }
    return Object.fromEntries(catalog.columns.map(([logical]) => {
      if (typeof row[logical] === 'undefined') throw new Error('Row does not satisfy the exact catalog column contract.')
      return [logical, normalizeValue(row[logical])]
    }))
  }).sort((left, right) => left.ID.localeCompare(right.ID))
  if (new Set(normalized.map(row => row.ID)).size !== normalized.length) throw new Error(`${catalog.key} contains duplicate IDs.`)
  return normalized
}

function canonicalizeCatalogDocument (source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Catalog backup source is invalid.')
  const keys = Object.keys(source).sort()
  const expected = CATALOGS.map(({ key }) => key).sort()
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error('Catalog backup source is invalid.')
  }

  const datasets = CATALOGS.map(catalog => ({ key: catalog.key, rows: canonicalizeRows(catalog, source[catalog.key]) }))
  const document = { version: 1, datasets }
  const json = JSON.stringify(document)
  return {
    document,
    json,
    sha256: createHash('sha256').update(json, 'utf8').digest('hex'),
    totalRowCount: datasets.reduce((total, dataset) => total + dataset.rows.length, 0),
    counts: Object.fromEntries(datasets.map(dataset => [dataset.key, dataset.rows.length])),
    digestPrefixes: Object.fromEntries(datasets.map(dataset => [
      dataset.key,
      createHash('sha256').update(JSON.stringify(dataset.rows), 'utf8').digest('hex').slice(0, 12)
    ]))
  }
}

function encryptCatalogBackup (source, publicKey) {
  return encryptCanonicalDocument(canonicalizeCatalogDocument(source).json, publicKey)
}

function decryptCatalogBackup (envelope, privateKey) {
  const document = decryptCanonicalDocument(envelope, privateKey)
  if (document?.version !== 1 || !Array.isArray(document.datasets)) throw new Error('Catalog backup document is invalid.')
  const source = Object.fromEntries(document.datasets.map(dataset => [dataset.key, dataset.rows]))
  return canonicalizeCatalogDocument(source)
}

module.exports = {
  CATALOGS,
  canonicalizeCatalogDocument,
  decryptCatalogBackup,
  encryptCatalogBackup
}
