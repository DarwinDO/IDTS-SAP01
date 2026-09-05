const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const BASELINE = '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
const GAP_BASELINE = '9d5aad699662bde65a747de4c0d631678de639e4'
const CATALOG_BASELINE = 'bc0c47e522ae208384d4b23dda21535dcc683683'
const APPROVAL = { pullRequest: 388, mergeSha: BASELINE }

const paths = {
  catalog: 'docs/qa/idts-110-unit-test-catalog.json',
  matrix: 'docs/pm/evidence/idts-110/catalog-gap-matrix.json',
  inventory: 'docs/pm/evidence/idts-110/new-feature-coverage-gaps.json',
  extension: 'docs/qa/idts-110-extension-cases.json',
  numberMap: 'docs/qa/idts-110-case-number-map.json',
  approval: 'docs/pm/evidence/idts-110/catalog-approval.json'
}

const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const writeJson = (relative, value) => {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n')
}
const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1)
const unique = values => [...new Set(values)]

const visualKeys = new Set([
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F239H',
  'IDTS110-F239D'
])
const pureReadbackKeys = new Set([
  'IDTS110-P189', 'IDTS110-P191', 'IDTS110-P200', 'IDTS110-F220',
  'IDTS110-F220D', 'IDTS110-F220R', 'IDTS110-F220N', 'IDTS110-F227',
  'IDTS110-F247S', 'IDTS110-F247SS'
])
const securityKeys = new Set([
  'IDTS110-F205', 'IDTS110-F207', 'IDTS110-F208', 'IDTS110-F209',
  'IDTS110-F243M', 'IDTS110-F244', 'IDTS110-F250R'
])
const positiveKeys = new Set([
  'IDTS110-P189', 'IDTS110-P194', 'IDTS110-P195', 'IDTS110-F210',
  'IDTS110-F233', 'IDTS110-F239', 'IDTS110-F239P', 'IDTS110-F240R'
])
const boundaryKeys = new Set([
  'IDTS110-P190', 'IDTS110-P197', 'IDTS110-P200', 'IDTS110-F220',
  'IDTS110-F220D', 'IDTS110-F223', 'IDTS110-F239H', 'IDTS110-F239D',
  'IDTS110-F241', 'IDTS110-F249', 'IDTS110-F249K', 'IDTS110-F249T'
])
const pureUnitKeys = new Set(['IDTS110-F220', 'IDTS110-F220D', 'IDTS110-F220R', 'IDTS110-F220N'])
const odataKeys = new Set(['IDTS110-F227', 'IDTS110-F232', 'IDTS110-F233', 'IDTS110-F234', 'IDTS110-F235', 'IDTS110-F235I', 'IDTS110-F235C', 'IDTS110-F236'])

const familyPolicy = {
  USER_ACCESS: {
    domain: 'User Administration access',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-FR-AUDIT-001'],
    roles: ['PM']
  },
  USER_PROFILE: {
    domain: 'User Administration profile',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-005', 'SRS-FR-AUDIT-001'],
    roles: ['PM']
  },
  DEVELOPER_WORKLOAD: {
    domain: 'Developer workload',
    requirementIds: ['SRS-FR-PM-001', 'SRS-FR-PM-002', 'SRS-FR-PM-003'],
    roles: ['PM', 'DEVELOPER']
  },
  BUSINESS_CATALOGS: {
    domain: 'Business catalogs',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-004', 'SRS-FR-AUDIT-001'],
    roles: ['PM']
  },
  MY_NOTIFICATIONS: {
    domain: 'My Notifications',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-FR-NOTIF-001', 'SRS-DATA-008'],
    roles: ['TESTER', 'DEVELOPER', 'PM']
  },
  ACCESS_EMAIL: {
    domain: 'Access email delivery',
    requirementIds: ['SRS-FR-NOTIF-001', 'SRS-FR-NOTIF-002', 'SRS-FR-DELIVERY-001'],
    roles: ['TESTER', 'DEVELOPER', 'PM']
  },
  BUG_EMAIL: {
    domain: 'Bug email delivery',
    requirementIds: ['SRS-FR-NOTIF-001', 'SRS-FR-NOTIF-002', 'SRS-FR-DELIVERY-001'],
    roles: ['TESTER', 'DEVELOPER', 'PM']
  }
}

const retainedPolicy = {
  'IDTS110-P189': {
    domain: 'User Administration',
    title: 'active Developer profile read returns availability and readiness',
    classification: 'POSITIVE',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-005', 'SRS-FR-PM-002'],
    roles: ['PM'],
    coverage: ['POSITIVE']
  },
  'IDTS110-P190': {
    domain: 'User Administration',
    title: 'inactive Developer profile read returns no profile data',
    classification: 'BOUNDARY',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-005', 'SRS-FR-PM-002'],
    roles: ['PM'],
    coverage: ['BOUNDARY', 'PERSISTENCE']
  },
  'IDTS110-P191': {
    domain: 'User Administration',
    title: 'request role matrix allows valid business roles and the PM UserAdmin overlay',
    classification: 'ROLE',
    testLevel: 'PURE_UNIT',
    requirementIds: ['SRS-FR-AUTH-002'],
    roles: ['TESTER', 'DEVELOPER', 'PM'],
    coverage: ['ROLE', 'ROLE', 'SANITIZATION']
  },
  'IDTS110-P194': {
    domain: 'User Administration',
    title: 'PM creates an Application Component catalog row',
    classification: 'POSITIVE',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-004', 'SRS-FR-AUDIT-001'],
    roles: ['PM'],
    coverage: ['POSITIVE', 'PERSISTENCE']
  },
  'IDTS110-P195': {
    domain: 'User Administration',
    title: 'PM creates a Defect Category catalog row',
    classification: 'POSITIVE',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-004', 'SRS-FR-AUDIT-001'],
    roles: ['PM'],
    coverage: ['POSITIVE', 'PERSISTENCE']
  },
  'IDTS110-P196': {
    domain: 'User Administration',
    title: 'non-PM callers cannot modify catalog entities',
    classification: 'ROLE',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-004', 'SRS-FR-AUDIT-001'],
    roles: ['TESTER', 'DEVELOPER', 'PM'],
    coverage: ['ROLE', 'ROLE', 'PERSISTENCE']
  },
  'IDTS110-P197': {
    domain: 'User Administration',
    title: 'inactive catalog parent blocks Component Category creation',
    classification: 'BOUNDARY',
    requirementIds: ['SRS-FR-AUTH-002', 'SRS-DATA-004', 'SRS-FR-AUDIT-001'],
    roles: ['PM'],
    coverage: ['BOUNDARY', 'PERSISTENCE']
  },
  'IDTS110-P200': {
    domain: 'PM monitoring',
    title: 'overdue monitoring uses the due-date boundary and excludes Closed Bugs',
    classification: 'BOUNDARY',
    requirementIds: ['SRS-FR-PM-001', 'SRS-FR-PM-003'],
    roles: ['PM'],
    coverage: ['BOUNDARY']
  },
  'IDTS110-P202': {
    domain: 'PM monitoring',
    title: 'Developer workload filters remain caller-scoped',
    classification: 'ROLE',
    requirementIds: ['SRS-FR-PM-001', 'SRS-FR-PM-002'],
    roles: ['PM', 'DEVELOPER'],
    coverage: ['ROLE', 'ROLE', 'PERSISTENCE']
  },
  'IDTS110-P203': {
    domain: 'PM monitoring',
    title: 'PM-only status metrics enforce the authorization boundary',
    classification: 'ROLE',
    requirementIds: ['SRS-FR-PM-001', 'SRS-FR-AUTH-002'],
    roles: ['PM', 'TESTER', 'DEVELOPER'],
    coverage: ['ROLE', 'ROLE', 'PERSISTENCE']
  }
}

const adapterOrder = {
  EXISTING_EXACT: [
    'IDTS110-F212', 'IDTS110-F213', 'IDTS110-F214', 'IDTS110-F219',
    'IDTS110-F220D', 'IDTS110-F220R', 'IDTS110-F220N', 'IDTS110-P202',
    'IDTS110-F221', 'IDTS110-F223', 'IDTS110-F224'
  ],
  ADD_TO_EXISTING: [
    'IDTS110-P189', 'IDTS110-P190', 'IDTS110-P194', 'IDTS110-P195',
    'IDTS110-P196', 'IDTS110-P197', 'IDTS110-P200', 'IDTS110-P203',
    'IDTS110-F204', 'IDTS110-F205', 'IDTS110-F206', 'IDTS110-F207',
    'IDTS110-F208', 'IDTS110-F209', 'IDTS110-F210', 'IDTS110-F210S',
    'IDTS110-F211', 'IDTS110-F215', 'IDTS110-F216', 'IDTS110-F216R',
    'IDTS110-F217', 'IDTS110-F218', 'IDTS110-F220', 'IDTS110-F222',
    'IDTS110-F225', 'IDTS110-F226', 'IDTS110-F227', 'IDTS110-F228',
    'IDTS110-F228E', 'IDTS110-F229', 'IDTS110-F230', 'IDTS110-F231',
    'IDTS110-F231R'
  ],
  NEW_ROLE_RUNNER: ['IDTS110-P191']
}

const adapterClassByKey = new Map(Object.entries(adapterOrder).flatMap(([adapterClass, keys]) => keys.map(key => [key, adapterClass])))

const fullEvidence = ['case-specific atomic result record', 'sanitized case manifest', 'before-state, after-state, and reload/readback snapshots']
const pureEvidence = ['case-specific atomic result record', 'sanitized case manifest', 'sanitized isolated fixture or pure-function readback']
const visualEvidence = [
  'Run the existing programmatic/native-control harness as a precheck only; harness output cannot establish visual acceptance.',
  'Execute the application in a browser/runtime with the rendered UI for this case.',
  'Capture at least one case-specific screenshot of the rendered UI state and retain the runtime URL/route context.'
]

const classify = key => securityKeys.has(key) ? 'SECURITY' : positiveKeys.has(key) ? 'POSITIVE' : boundaryKeys.has(key) ? 'BOUNDARY' : 'ROLE'
const testLevel = key => visualKeys.has(key) ? 'UI_COMPONENT' : pureUnitKeys.has(key) ? 'PURE_UNIT' : odataKeys.has(key) ? 'ODATA_CONTRACT' : 'CAP_COMPONENT'
const coverageFor = (key, classification) => {
  if (visualKeys.has(key)) return classification === 'ROLE' ? ['ROLE', 'ROLE', 'UI_RUNTIME', 'PERSISTENCE'] : [classification, 'UI_RUNTIME', 'PERSISTENCE']
  if (securityKeys.has(key)) return ['SECURITY', 'SANITIZATION', 'PERSISTENCE']
  if (positiveKeys.has(key)) return ['POSITIVE', 'PERSISTENCE']
  if (pureUnitKeys.has(key) && classification === 'BOUNDARY') return ['BOUNDARY']
  if (boundaryKeys.has(key)) return ['BOUNDARY', 'PERSISTENCE']
  return ['ROLE', 'ROLE', 'PERSISTENCE']
}

const definition = ({ key, origin, sequence, mentorNumber, source, family, retained }) => {
  const policy = retained || familyPolicy[family]
  assert(policy, 'Missing policy for ' + key)
  const title = retained ? policy.title : source.title
  const assertions = source.plannedAssertions
  assert(Array.isArray(assertions) && assertions.length > 0, key + ' must have planned assertions')
  const classification = retained ? policy.classification : classify(key)
  const level = retained ? (policy.testLevel || 'CAP_COMPONENT') : testLevel(key)
  const mode = visualKeys.has(key) ? 'UI_RUNTIME_VISUAL' : 'PROGRAMMATIC_ATOMIC'
  const expectedResult = assertions.join(' ')
  const row = {
    internalCaseKey: key,
    candidateOrigin: origin,
    sourceProposalSequence: sequence,
    mentorNumber,
    domain: policy.domain,
    title,
    objective: 'Verify ' + titleCase(title) + '.',
    classification,
    priority: 'HIGH',
    testLevel: level,
    environment: 'LOCAL',
    requirementIds: policy.requirementIds,
    roles: retained ? policy.roles : (family === 'USER_PROFILE' && key.startsWith('IDTS110-F220') ? ['DEVELOPER'] : policy.roles),
    coverage: unique(retained ? policy.coverage : coverageFor(key, classification)),
    preconditions: 'Use an isolated ' + policy.domain.toLowerCase() + ' fixture at source baseline ' + BASELINE + '; capture the relevant before-state.',
    input: assertions[0],
    steps: [
      'Prepare the isolated fixture at source baseline ' + BASELINE + '.',
      'Run the selected assertion from ' + source.plannedTestFile + '.',
      'Assert the expected result: ' + (/[.!?]$/.test(expectedResult) ? expectedResult : expectedResult + '.'),
      'Capture the required sanitized state and runtime evidence, then reload/read back when required.'
    ],
    expectedResult,
    sourceTrace: source.sourceTrace,
    plannedTestFile: source.plannedTestFile,
    plannedAssertions: assertions,
    assertionId: key + '-A1',
    plannedAssertion: expectedResult,
    acceptanceMode: mode,
    roleBoundary: source.roleBoundary,
    executionBoundary: source.executionBoundary,
    evidenceRequirements: visualKeys.has(key) ? visualEvidence : pureReadbackKeys.has(key) ? pureEvidence : fullEvidence,
    candidateStatus: 'NOT_RUN',
    reviewStatus: 'PENDING_DONHV_REVIEW',
    execution: {
      status: 'NOT_RUN',
      executor: null,
      executedAt: null,
      baselineSha: null,
      deploySha: null,
      actualResult: null,
      evidenceIds: []
    }
  }
  const adapterClass = adapterClassByKey.get(key)
  if (adapterClass) row.adapterClass = adapterClass
  return row
}

const validateTrace = row => {
  for (const trace of row.sourceTrace) {
    const target = path.join(root, trace.file)
    assert(fs.existsSync(target), row.internalCaseKey + ' missing ' + trace.file)
    assert(fs.readFileSync(target, 'utf8').includes(trace.symbol), row.internalCaseKey + ' missing symbol ' + trace.symbol)
  }
}

const build = () => {
  const catalog = readJson(paths.catalog)
  const matrix = readJson(paths.matrix)
  const inventory = readJson(paths.inventory)
  assert.equal(catalog.cases.length, 188)
  assert.equal(matrix.baseSha, GAP_BASELINE)
  assert.equal(matrix.proposals.length, 15)
  assert.equal(inventory.baseSha, GAP_BASELINE)
  assert.equal(inventory.summary.proposedCaseCount, 80)

  const retainedRows = matrix.proposals.filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE')
  assert.deepEqual(retainedRows.map(row => row.internalProposalKey), Object.keys(retainedPolicy))
  const featureRows = inventory.features.flatMap(family => family.proposedCases.map(row => ({ ...row, family: family.family })))
  assert.equal(featureRows.length, 80)
  assert.equal(featureRows.some(row => row.internalProposalKey === 'IDTS110-F242'), false)

  const retained = retainedRows.map((source, index) => definition({
    key: source.internalProposalKey,
    origin: 'RETAINED_TASK_2',
    sequence: source.sourceNumber,
    mentorNumber: 189 + index,
    source: { ...source, plannedTestFile: source.plannedTestFile, plannedAssertions: source.plannedAssertions },
    retained: retainedPolicy[source.internalProposalKey]
  }))
  const features = featureRows.map((source, index) => definition({
    key: source.internalProposalKey,
    origin: 'TASK_3_FEATURE',
    sequence: source.proposedSequence,
    mentorNumber: 199 + index,
    source,
    family: source.family
  }))
  const rows = [...retained, ...features]
  rows.forEach(validateTrace)
  assert.equal(rows.length, 90)
  assert.equal(new Set(rows.map(row => row.internalCaseKey)).size, 90)
  assert.equal(new Set(rows.map(row => row.sourceProposalSequence)).size, 90)

  const adapterLedger = Object.entries(adapterOrder).flatMap(([adapterClass, keys]) => keys.map(internalCaseKey => ({
    internalCaseKey,
    adapterClass,
    plannedTestFile: rows.find(row => row.internalCaseKey === internalCaseKey).plannedTestFile
  })))
  assert.equal(adapterLedger.length, 45)
  assert.deepEqual(Object.fromEntries(Object.entries(adapterOrder).map(([name, keys]) => [name, keys.length])), {
    EXISTING_EXACT: 11,
    ADD_TO_EXISTING: 33,
    NEW_ROLE_RUNNER: 1
  })

  const extension = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    sourceBaselineSha: BASELINE,
    historicalGapPackageBaseSha: GAP_BASELINE,
    historicalCatalogBaselineSha: CATALOG_BASELINE,
    approvalReference: APPROVAL,
    sourceReferences: {
      existingCatalog: paths.catalog,
      gapMatrix: paths.matrix,
      featureInventory: paths.inventory,
      gapReview: 'docs/pm/evidence/idts-110/catalog-gap-review.md'
    },
    numbering: {
      scheme: 'SEQUENTIAL_ONLY',
      existingRange: [1, 188],
      retainedTask2Range: [189, 198],
      featureRange: [199, 278],
      total: 278
    },
    extensionSummary: {
      existing: 188,
      retainedTask2: retained.length,
      featureCandidates: features.length,
      total: rows.length,
      candidateCatalogTotal: 278
    },
    adapterSummary: {
      EXISTING_EXACT: 11,
      ADD_TO_EXISTING: 33,
      NEW_ROLE_RUNNER: 1
    },
    adapterLedger,
    retainedTask2: retained,
    featureCandidates: features,
    statusPolicy: {
      initialCandidateStatus: 'NOT_RUN',
      reviewStatus: 'PENDING_DONHV_REVIEW',
      resultPreApproval: false
    },
    externalMutations: []
  }
  const entries = catalog.cases.map((row, index) => ({
    mentorNumber: index + 1,
    internalCaseKey: row.caseId,
    sourceProposalSequence: null,
    candidateOrigin: 'EXISTING_CATALOG'
  })).concat(rows.map(row => ({
    mentorNumber: row.mentorNumber,
    internalCaseKey: row.internalCaseKey,
    sourceProposalSequence: row.sourceProposalSequence,
    candidateOrigin: row.candidateOrigin
  })))
  const numberMap = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    sourceBaselineSha: BASELINE,
    historicalGapPackageBaseSha: GAP_BASELINE,
    historicalCatalogBaselineSha: CATALOG_BASELINE,
    approvalReference: APPROVAL,
    numbering: 'SEQUENTIAL_ONLY',
    entries
  }
  const approval = {
    schemaVersion: '1.0',
    jiraKey: 'IDTS-110',
    approvalDate: '2026-09-05',
    approvedAt: '2026-09-05',
    approvedBy: 'DonHV',
    status: 'APPROVED_FOR_EXECUTION',
    approvedCatalogCount: 278,
    approvalReference: APPROVAL,
    authorizationStatement: 'DonHV approval authorizes the 278 catalog definitions and the local or candidate execution workflow. It does not pre-approve any execution result as PASS.',
    resultsPreApproved: false,
    resultReviewStatus: 'PENDING_DONHV_REVIEW',
    externalMutations: []
  }
  return { extension, numberMap, approval }
}

const checkOrWrite = (relative, value, checkOnly) => {
  if (checkOnly) {
    assert.deepEqual(readJson(relative), value, relative + ' is not reproducible from approved inputs')
  } else {
    writeJson(relative, value)
  }
}

const checkOnly = process.argv.includes('--check')
const output = build()
checkOrWrite(paths.extension, output.extension, checkOnly)
checkOrWrite(paths.numberMap, output.numberMap, checkOnly)
checkOrWrite(paths.approval, output.approval, checkOnly)
console.log('IDTS-110 extension generated: 10 retained, 80 feature, 90 total; map 278; adapters 11/33/1.' + (checkOnly ? ' reproducible.' : ''))
