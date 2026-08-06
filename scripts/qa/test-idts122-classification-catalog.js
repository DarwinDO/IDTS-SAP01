'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '../..')
const COMPONENTS_FILE = path.join(ROOT, 'db/data/idts.cap-ApplicationComponents.csv')
const DEFECT_CATEGORIES_FILE = path.join(ROOT, 'db/data/idts.cap-DefectCategories.csv')
const COMPONENT_CATEGORIES_FILE = path.join(ROOT, 'db/data/idts.cap-ComponentCategories.csv')

const COMPONENT_IDS = Array.from({ length: 8 }, (_, index) => `40000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`)
const DEFECT_CATEGORY_IDS = Array.from({ length: 8 }, (_, index) => `50000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`)
const COMPONENT_CATEGORY_IDS = Array.from({ length: 31 }, (_, index) => `60000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`)

const BASELINE_COMPONENTS = [
  ['40000000-0000-0000-0000-000000000001', 'IDTS_BUG_REPORT', 'IDTS Bug Report', 'IDTS_APP', 'true'],
  ['40000000-0000-0000-0000-000000000002', 'IDTS_ASSIGNMENT', 'IDTS Assignment', 'IDTS_APP', 'true'],
  ['40000000-0000-0000-0000-000000000003', 'IDTS_NOTIFICATIONS', 'IDTS Notifications', 'IDTS_APP', 'true'],
  ['40000000-0000-0000-0000-000000000004', 'IDTS_PM_MONITORING', 'IDTS PM Monitoring', 'IDTS_APP', 'true'],
  ['40000000-0000-0000-0000-000000000005', 'IDTS_FIORI_UI', 'IDTS Fiori UI', 'FIORI_APP', 'true'],
  ['40000000-0000-0000-0000-000000000006', 'IDTS_CAP_SERVICE', 'IDTS CAP Service', 'CAP_SERVICE', 'true'],
  ['40000000-0000-0000-0000-000000000007', 'IDTS_DB_MODEL', 'IDTS Database Model', 'DATABASE', 'true']
]

const BASELINE_COMPONENT_CATEGORIES = [
  ['60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'true'],
  ['60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'true'],
  ['60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'true'],
  ['60000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'true'],
  ['60000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 'true'],
  ['60000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 'true'],
  ['60000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'true'],
  ['60000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000006', 'true'],
  ['60000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'true'],
  ['60000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'true'],
  ['60000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'true'],
  ['60000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'true'],
  ['60000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000003', 'true']
]

const EXPECTED_PAIRS = {
  IDTS_BUG_REPORT: ['FIORI_UI5', 'CAP_BACKEND', 'DATABASE', 'WORKFLOW', 'DATA_QUALITY'],
  IDTS_ASSIGNMENT: ['FIORI_UI5', 'CAP_BACKEND', 'WORKFLOW', 'AUTH', 'DATA_QUALITY'],
  IDTS_NOTIFICATIONS: ['CAP_BACKEND', 'INTEGRATION', 'PERFORMANCE'],
  IDTS_PM_MONITORING: ['FIORI_UI5', 'CAP_BACKEND', 'DATABASE', 'PERFORMANCE'],
  IDTS_FIORI_UI: ['FIORI_UI5', 'AUTH', 'PERFORMANCE'],
  IDTS_CAP_SERVICE: ['CAP_BACKEND', 'AUTH', 'INTEGRATION', 'PERFORMANCE'],
  IDTS_DB_MODEL: ['DATABASE', 'DATA_QUALITY', 'PERFORMANCE'],
  IDTS_AI_ADVISORY: ['CAP_BACKEND', 'INTEGRATION', 'PERFORMANCE', 'DATA_QUALITY']
}

function fail (code, message) {
  const error = new Error(message)
  error.code = code
  throw error
}

function parseCsv (file, headers) {
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/)
  assert.deepEqual(lines.shift().split(','), headers, `${path.basename(file)} headers changed`)
  return lines.map((line, index) => {
    const values = line.split(',')
    assert.equal(values.length, headers.length, `${path.basename(file)} row ${index + 2} column count changed`)
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]))
  })
}

function requireCount (rows, count, code, label) {
  if (rows.length !== count) fail(code, `${label} count is ${rows.length}, expected ${count}`)
}

function requireUnique (values, code, label) {
  if (new Set(values).size !== values.length) fail(code, `${label} contains duplicates`)
}

function requireSameValues (actual, expected, code, label) {
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    fail(code, `${label} do not match the deterministic baseline`)
  }
}

function assertRow (row, expected, headers, code) {
  const actual = headers.map(header => row?.[header])
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(code, `immutable row ${expected[0]} changed or is missing`)
}

function assertCatalog (components, defectCategories, componentCategories) {
  requireCount(components, 8, 'CATALOG_COMPONENT_COUNT', 'application component')
  requireCount(defectCategories, 8, 'CATALOG_DEFECT_CATEGORY_COUNT', 'defect category')
  requireCount(componentCategories, 31, 'CATALOG_COMPONENT_CATEGORY_COUNT', 'component category')
  requireUnique(components.map(row => row.code), 'CATALOG_DUPLICATE_COMPONENT_CODE', 'application component code')
  requireUnique(componentCategories.map(row => `${row.component_ID}|${row.defectCategory_ID}`), 'CATALOG_DUPLICATE_COMPONENT_CATEGORY_PAIR', 'component/category pair')
  requireSameValues(components.map(row => row.ID), COMPONENT_IDS, 'CATALOG_COMPONENT_IDS_NONDETERMINISTIC', 'application component IDs')
  requireSameValues(defectCategories.map(row => row.ID), DEFECT_CATEGORY_IDS, 'CATALOG_DEFECT_CATEGORY_IDS_NONDETERMINISTIC', 'defect category IDs')
  requireSameValues(componentCategories.map(row => row.ID), COMPONENT_CATEGORY_IDS, 'CATALOG_COMPONENT_CATEGORY_IDS_NONDETERMINISTIC', 'component category IDs')

  for (const expected of BASELINE_COMPONENTS) {
    assertRow(components.find(row => row.ID === expected[0]), expected, ['ID', 'code', 'name', 'componentType', 'active'], 'CATALOG_BASELINE_COMPONENT_CHANGED')
  }
  for (const expected of BASELINE_COMPONENT_CATEGORIES) {
    assertRow(componentCategories.find(row => row.ID === expected[0]), expected, ['ID', 'component_ID', 'defectCategory_ID', 'active'], 'CATALOG_BASELINE_COMPONENT_CATEGORY_CHANGED')
  }

  const aiComponent = components.find(row => row.ID === '40000000-0000-0000-0000-000000000008')
  assertRow(aiComponent, ['40000000-0000-0000-0000-000000000008', 'IDTS_AI_ADVISORY', 'IDTS AI Advisory', 'AI_SERVICE', 'true'], ['ID', 'code', 'name', 'componentType', 'active'], 'CATALOG_AI_COMPONENT_FIELDS_INVALID')

  const componentIds = new Set(components.map(row => row.ID))
  const defectCategoryIds = new Set(defectCategories.map(row => row.ID))
  for (const row of componentCategories) {
    if (!componentIds.has(row.component_ID) || !defectCategoryIds.has(row.defectCategory_ID)) {
      fail('CATALOG_COMPONENT_CATEGORY_FK_INVALID', `broken catalog foreign key at ${row.ID}`)
    }
    if (row.active !== 'true') fail('CATALOG_COMPONENT_CATEGORY_ACTIVE_INVALID', `component category ${row.ID} must be active`)
  }

  const componentCodes = new Map(components.map(row => [row.ID, row.code]))
  const defectCategoryCodes = new Map(defectCategories.map(row => [row.ID, row.code]))
  const actualPairs = componentCategories.map(row => `${componentCodes.get(row.component_ID)}|${defectCategoryCodes.get(row.defectCategory_ID)}`)
  const expectedPairs = Object.entries(EXPECTED_PAIRS).flatMap(([component, categories]) => categories.map(category => `${component}|${category}`))
  requireSameValues(actualPairs, expectedPairs, 'CATALOG_MATRIX_MISMATCH', 'component/category matrix')
}

function expectFailure (label, code, mutate, catalogs) {
  const [components, defectCategories, componentCategories] = structuredClone(catalogs)
  mutate(components, defectCategories, componentCategories)
  assert.throws(() => assertCatalog(components, defectCategories, componentCategories), error => error.code === code, label)
  console.log(`PASS  ${label}`)
}

function main () {
  const catalogs = [
    parseCsv(COMPONENTS_FILE, ['ID', 'code', 'name', 'componentType', 'active']),
    parseCsv(DEFECT_CATEGORIES_FILE, ['ID', 'code', 'name', 'categoryType', 'active']),
    parseCsv(COMPONENT_CATEGORIES_FILE, ['ID', 'component_ID', 'defectCategory_ID', 'active'])
  ]

  assert.doesNotThrow(() => assertCatalog(...catalogs))
  console.log('PASS  approved 8/8/31 classification catalog matrix')

  expectFailure('component count regression is rejected', 'CATALOG_COMPONENT_COUNT', components => components.pop(), catalogs)
  expectFailure('defect category count regression is rejected', 'CATALOG_DEFECT_CATEGORY_COUNT', (_, categories) => categories.pop(), catalogs)
  expectFailure('component category count regression is rejected', 'CATALOG_COMPONENT_CATEGORY_COUNT', (_, __, pairs) => pairs.pop(), catalogs)
  expectFailure('duplicate component code is rejected', 'CATALOG_DUPLICATE_COMPONENT_CODE', components => { components[7].code = components[0].code }, catalogs)
  expectFailure('duplicate component/category pair is rejected', 'CATALOG_DUPLICATE_COMPONENT_CATEGORY_PAIR', (_, __, pairs) => { pairs[30].component_ID = pairs[0].component_ID; pairs[30].defectCategory_ID = pairs[0].defectCategory_ID }, catalogs)
  expectFailure('broken component/category FK is rejected', 'CATALOG_COMPONENT_CATEGORY_FK_INVALID', (_, __, pairs) => { pairs[30].component_ID = '40000000-0000-0000-0000-000000009999' }, catalogs)
  expectFailure('existing ComponentCategory row changes are rejected', 'CATALOG_BASELINE_COMPONENT_CATEGORY_CHANGED', (_, __, pairs) => { pairs[0].active = 'false' }, catalogs)
  expectFailure('non-deterministic component IDs are rejected', 'CATALOG_COMPONENT_IDS_NONDETERMINISTIC', components => { components[7].ID = '40000000-0000-0000-0000-000000000099' }, catalogs)
  expectFailure('non-deterministic ComponentCategory IDs are rejected', 'CATALOG_COMPONENT_CATEGORY_IDS_NONDETERMINISTIC', (_, __, pairs) => { pairs[30].ID = '60000000-0000-0000-0000-000000000099' }, catalogs)
  expectFailure('incorrect AI component fields are rejected', 'CATALOG_AI_COMPONENT_FIELDS_INVALID', components => { components[7].name = 'IDTS AI Assistant' }, catalogs)
  expectFailure('wrong approved matrix is rejected', 'CATALOG_MATRIX_MISMATCH', (_, __, pairs) => { pairs[30].defectCategory_ID = '50000000-0000-0000-0000-000000000001' }, catalogs)
}

main()
