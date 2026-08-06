#!/usr/bin/env node
'use strict'

const assert = require('node:assert/strict')
const cds = require('@sap/cds')
require('@cap-js/attachments')

const EXPECTED_TEXT_PATHS = {
  status_code: 'status/name',
  priority_code: 'priority/name',
  severity_code: 'severity/name',
  environment_code: 'environment/name',
  sapModule_ID: 'sapModule/name',
  applicationComponent_ID: 'applicationComponent/name',
  defectCategory_ID: 'defectCategory/name',
  reporter_ID: 'reporter/displayName',
  assignee_ID: 'assigneeDisplayName',
  nextProcessorUser_ID: 'nextProcessorUser/displayName',
  nextProcessorRole_code: 'nextProcessorRole/name'
}

function annotationBlock (edmx, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = edmx.match(new RegExp(`<Annotations Target="BugService\\.Bugs/${escaped}">([\\s\\S]*?)<\\/Annotations>`))
  assert.ok(match, `Missing EDMX annotation block for BugService.Bugs/${property}`)
  return match[1]
}

async function main () {
  const model = await cds.load('*')
  const edmx = cds.compile.to.edmx(model, { service: 'BugService' })

  for (const [property, textPath] of Object.entries(EXPECTED_TEXT_PATHS)) {
    const block = annotationBlock(edmx, property)
    assert.match(
      block,
      new RegExp(`<Annotation Term="Common\\.Text" Path="${textPath.replace('/', '\\/')}">`),
      `${property} must display business text from ${textPath} while retaining its technical filter key`
    )
    assert.match(
      block,
      /<Annotation Term="UI\.TextArrangement" EnumMember="UI\.TextArrangementType\/TextOnly"\/>/,
      `${property} must render text only instead of UUID/code plus text`
    )
  }

  console.log(`TOTAL: ${Object.keys(EXPECTED_TEXT_PATHS).length} PASS / ${Object.keys(EXPECTED_TEXT_PATHS).length} filter-token metadata checks`)
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
