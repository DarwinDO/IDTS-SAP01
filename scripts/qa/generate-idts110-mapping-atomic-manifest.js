#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))

const taxonomy = readJson('docs/pm/evidence/idts-110/donhv-case-taxonomy.json')
const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const numberMap = readJson('docs/qa/idts-110-case-number-map.json')
const approval = readJson('docs/pm/evidence/idts-110/catalog-approval.json')
const outputArg = process.argv.find(argument => argument.startsWith('--output='))
const outputPath = path.resolve(root, outputArg ? outputArg.slice('--output='.length) : 'docs/qa/idts-110-mapping-atomic-manifest.json')

const catalogById = new Map(catalog.cases.map(item => [item.caseId, item]))
const numberById = new Map(numberMap.entries.map(item => [item.internalCaseKey, item.mentorNumber]))

function domainFor (caseId) {
  const prefix = caseId.split('-')[1]
  return ({
    AUTH: 'Authentication',
    BUG: 'Bug',
    VAL: 'Validation',
    ASN: 'Assignment',
    LC: 'Lifecycle',
    CMT: 'Comment',
    ATT: 'Attachment',
    HIS: 'History',
    NTF: 'Notification',
    MON: 'Monitoring',
    AI: 'AI',
    SEC: 'Security'
  })[prefix]
}

const entries = taxonomy.cases
  .filter(item => item.reviewDecision === 'MAPPING_ONLY_NOT_PASS')
  .map(item => {
    const definition = catalogById.get(item.caseId)
    if (!definition) throw new Error(`Missing catalog definition for ${item.caseId}`)
    const mentorNumber = numberById.get(item.caseId)
    if (!Number.isInteger(mentorNumber)) throw new Error(`Missing mentor number for ${item.caseId}`)
    const evidenceRequirements = [...new Set([
      ...definition.evidenceRequirements,
      'case-specific result image',
      'sanitized case manifest'
    ])]
    return {
      mentorNumber,
      internalCaseKey: item.caseId,
      domain: domainFor(item.caseId),
      title: definition.title,
      testLevel: item.testLevel,
      catalogEnvironment: definition.environment,
      executionEnvironment: 'LOCAL',
      selector: `--idts110-case=${item.caseId}`,
      testFile: 'scripts/qa/test-idts110-mapping-atomic-execution.js',
      precondition: definition.preconditions,
      action: definition.input,
      expectedResult: definition.expectedResult,
      sourceAssertions: definition.sourceTrace.map(trace => `${trace.file}#${trace.symbol}`),
      evidenceRequirements,
      fixturePolicy: evidenceRequirements.some(value => /before\/after database|reload\/readback/i.test(value))
        ? 'ISOLATED_WITH_STATE_READBACK'
        : 'ISOLATED',
      allowedTerminalStatuses: ['PASS', 'FAIL']
    }
  })
  .sort((left, right) => left.mentorNumber - right.mentorNumber)

const domainCounts = entries.reduce((counts, entry) => {
  counts[entry.domain] = (counts[entry.domain] || 0) + 1
  return counts
}, {})

const manifest = {
  schemaVersion: '1.0',
  jiraKey: 'IDTS-110',
  purpose: 'DonHV-approved atomic local execution manifest for the 135 historical suite-to-case mappings.',
  sourceBaselineSha: numberMap.sourceBaselineSha,
  authorization: {
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    approvalAlreadyGranted: approval.status === 'APPROVED_FOR_EXECUTION',
    approvedCatalogCount: approval.approvedCatalogCount,
    resultsPreApproved: approval.resultsPreApproved,
    pullRequest: approval.approvalReference.pullRequest,
    mergeSha: approval.approvalReference.mergeSha
  },
  executionContract: {
    caseSpecificSelectorRequired: true,
    suiteExitCannotFanOut: true,
    mappingOnlyForbidden: true,
    failureRemainsFailure: true,
    externalMutations: []
  },
  counts: {
    total: entries.length,
    capComponent: entries.filter(item => item.testLevel === 'CAP_COMPONENT').length,
    odataContract: entries.filter(item => item.testLevel === 'ODATA_CONTRACT').length
  },
  domainCounts,
  entries
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.log(`Wrote ${path.relative(root, outputPath)} with ${entries.length} approved atomic cases.`)
