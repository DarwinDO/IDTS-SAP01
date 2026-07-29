#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

const manifest = JSON.parse(read('app/bug-management-ui/webapp/manifest.json'))
const valueHelps = read('app/bug-management-ui/annotations/value-helps.cds')
const drafts = read('srv/bug-service/drafts.js')

const defectCategoryBlock = valueHelps.match(
  /annotate service\.Bugs:defectCategory\.ID[\s\S]*?annotate service\.Bugs:assignee\.ID/
)?.[0] || ''

assert(defectCategoryBlock, 'Defect Category value-help annotation must exist')
assert(
  !/Common\.ValueListParameterOut[\s\S]*?LocalDataProperty\s*:\s*componentCategory_ID/.test(defectCategoryBlock),
  'Defect Category value help must not write the backend-derived componentCategory_ID'
)

assert(
  /SELECT\.one\.from\(entities\.ComponentCategories\)[\s\S]*?component_ID\s*:\s*merged\.applicationComponent_ID[\s\S]*?defectCategory_ID\s*:\s*merged\.defectCategory_ID[\s\S]*?req\.data\.componentCategory_ID\s*=\s*componentCategory\.ID/.test(drafts),
  'Draft PATCH must derive componentCategory_ID from the selected active component/category pair'
)

assert(
  !manifest['sap.ui5']?.extends?.extensions?.['sap.ui.controllerExtensions']
    ?.['sap.fe.templates.ObjectPage.ObjectPageController']
    ?.controllerName?.includes('BugObjectPageExt'),
  'Create flow must not add a runtime controller workaround for an off-screen browser-harness action'
)

console.log('IDTS-115 Create Bug annotation and source-of-truth checks passed (4).')
