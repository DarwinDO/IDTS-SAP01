#!/usr/bin/env node

'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { buildCompleteCard, redactSecrets } = require('./idts110-complete-evidence-card')

const ONE_PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function fixture (overrides = {}) {
  return {
    mentorNumber: 42,
    definition: {
      caseId: 'IDTS110-UT-AUTH-001',
      title: 'Valid local login normalizes the email and creates exactly one session.',
      precondition: 'Fresh isolated authentication fixture with zero AuthSessions.',
      action: 'Call AuthService.login with a valid mixed-case, padded email and password.',
      expectedResult: 'Return one transient bearer token and persist only its hash in exactly one session.',
      sourceTrace: [{ file: 'srv/auth.js', symbol: 'login' }, { file: 'srv/auth.js', symbol: 'me' }]
    },
    result: {
      caseKey: 'IDTS110-UT-AUTH-001',
      status: 'PASS',
      assertionPassed: true,
      reviewStatus: 'PENDING_DONHV_REVIEW',
      executor: 'NhanT, agent-assisted',
      evidenceKind: 'LOCAL_ATOMIC',
      actualResult: 'Email normalization passed. Exactly one hashed session was created.',
      observedAssertions: [
        'Email normalization passed.',
        'Exactly one hashed session was created.',
        'Reload preserved the single session row.'
      ],
      beforeState: { AuthSessions: 0, Bugs: 4 },
      afterState: { AuthSessions: 1, Bugs: 4 },
      reloadState: { AuthSessions: 1 },
      testFile: 'scripts/qa/test-idts110-local-exact.js',
      testCommand: 'node scripts/qa/test-idts110-local-exact.js --idts110-case=IDTS110-UT-AUTH-001 --baseline=7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a',
      sourceBaselineSha: '7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a',
      startedAt: '2026-09-06T03:00:00.000Z',
      completedAt: '2026-09-06T03:00:01.000Z',
      limitation: 'Isolated local evidence only. No SAP BTP acceptance is claimed.',
      structuredEvidenceRef: 'docs/pm/evidence/idts-110/local-execution-results.json -> IDTS110-UT-AUTH-001',
      hostile: '<script>alert("x")</script> Bearer topSecret password=topSecret alice@example.com postgresql://u:p@private.example/db xkeysib-123456789012345678901234567890'
    },
    testLocation: { file: 'scripts/qa/test-idts110-local-exact.js', startLine: 223, endLine: 229 },
      structuredEvidence: {
      observedAssertions: [
        'Raw bearer token was not persisted.',
        'Observed literal <script>alert("x")</script>.'
      ],
      sourceAssertions: ['srv/auth.js#login'],
      snapshots: {
        AuthSessions: { before: 0, after: 1, reload: 1 },
        Bugs: { before: 4, after: 4 }
      },
      reference: 'docs/pm/evidence/idts-110/local-execution-results.json -> IDTS110-UT-AUTH-001'
    },
    runtimeImageDataUrl: ONE_PIXEL_PNG,
    ...overrides
  }
}

const complete = buildCompleteCard(fixture())
assert.equal(typeof complete.html, 'string')
assert.equal(typeof complete.visibleText, 'string')
assert.match(complete.visibleText, /^Case 42\n/)
assert.match(complete.visibleText, /Valid local login normalizes the email/)
assert.match(complete.visibleText, /Result: PASS/)
assert.equal(complete.reviewStatus, 'PENDING_DONHV_REVIEW', 'review status remains available as repository metadata')
assert.doesNotMatch(complete.visibleText, /Review:\s*PENDING_DONHV_REVIEW/, 'review status is not mentor-visible text')
assert.doesNotMatch(complete.html, /PENDING_DONHV_REVIEW/, 'review status is not rendered in card HTML')
assert.match(complete.visibleText, /Executor: NhanT, agent-assisted/)
assert.match(complete.visibleText, /Evidence kind: LOCAL_ATOMIC/)

for (const section of ['Test definition', 'Observed assertions', 'Persistence readback', 'Provenance', 'Source assertions', 'Structured evidence', 'Limitation']) {
  assert.match(complete.visibleText, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${section} section is present`)
  assert.match(complete.html, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${section} HTML is present`)
}

assert.match(complete.visibleText, /File\/line: scripts\/qa\/test-idts110-local-exact\.js:223[–-]229/)
assert.match(complete.visibleText, /Source assertions: srv\/auth\.js#login; srv\/auth\.js#me/)
assert.match(complete.visibleText, /Entity \| Before \| After \| Reload/)
assert.match(complete.visibleText, /AuthSessions\s+\|\s+0\s+\|\s+1\s+\|\s+1/)
assert.match(complete.visibleText, /Bugs\s+\|\s+4\s+\|\s+4\s+\|\s+N\/A/)
assert.match(complete.html, /data:image\/png;base64,/)

assert.doesNotMatch(complete.html, /<script[\s>]/i, 'hostile HTML must be escaped')
assert.match(complete.html, /&lt;script&gt;/i, 'escaped hostile HTML remains visible as text')
for (const secret of ['topSecret', 'alice@example.com', 'postgresql://', 'xkeysib-123456789012345678901234567890']) {
  assert.doesNotMatch(complete.visibleText, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${secret} is absent from visible text`)
  assert.doesNotMatch(complete.html, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${secret} is absent from HTML`)
}
assert.match(complete.visibleText, /AuthService\.login/)
assert.match(complete.visibleText, /srv\/auth\.js/)
assert.doesNotMatch(complete.visibleText, /IDTS110-|UT-[A-Z]+-/)

assert.doesNotMatch(complete.visibleText, /--idts110-case=IDTS110-UT-AUTH-001/)
assert.match(complete.visibleText, /Batch command \(case selector omitted for mentor view\):/)

for (const command of [
  'node scripts/qa/test-idts110-local-exact.js --selector=UT-VAL-TITLE --baseline=7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a',
  'node scripts/qa/test-idts110-local-exact.js --selector UT-VAL-TITLE --baseline=7c02c56daa7f46661b4d2f778a7a0b2a77d88b8a'
]) {
  const selectorCard = buildCompleteCard(fixture({ result: { ...fixture().result, testCommand: command } }))
  assert.match(selectorCard.visibleText, /Batch command \(case selector omitted for mentor view\):/)
  assert.doesNotMatch(selectorCard.visibleText, /UT-VAL-TITLE/)
}

const redactedCredentials = redactSecrets('Authorization: Bearer topSecret privateKey=privateValue private-key: anotherValue {"privateKey":"jsonValue","authorization":"Bearer jsonToken"} -----BEGIN PRIVATE KEY-----abc-----END PRIVATE KEY-----')
assert.doesNotMatch(redactedCredentials, /topSecret|privateValue|anotherValue|BEGIN PRIVATE KEY|abc/i)
assert.doesNotMatch(redactedCredentials, /jsonValue|jsonToken/i)

assert.throws(() => buildCompleteCard(fixture({
  result: {
    status: 'PASS',
    executor: 'agent',
    evidenceKind: 'LOCAL_ATOMIC',
    testCommand: 'node scripts/qa/test-idts110-local-exact.js --idts110-case=IDTS110-UT-AUTH-001'
  },
  structuredEvidence: {},
  runtimeImageDataUrl: 'https://example.invalid/runtime.png'
})), /PASS.*(?:observed|provenance|evidence|assertion)|complete card/i, 'PASS without complete evidence must fail closed')

const truthfulMissing = buildCompleteCard({ mentorNumber: 43, definition: {}, result: {} })
assert.match(truthfulMissing.visibleText, /Result: N\/A/)
assert.match(truthfulMissing.visibleText, /Observed assertions\n- N\/A \(no observed assertions supplied\)/)
assert.match(truthfulMissing.visibleText, /Readback\s+\|\s+N\/A\s+\|\s+N\/A\s+\|\s+N\/A/)
assert.doesNotMatch(truthfulMissing.visibleText, /Accepted candidate|Accepted by DonHV/i)

assert.throws(() => buildCompleteCard(fixture({
  result: { ...fixture().result, status: 'PASS', evidenceKind: 'UI_RUNTIME' },
  runtimeImageDataUrl: 'https://example.invalid/runtime.png'
})), /UI_RUNTIME.*PNG|runtime.*PNG|screenshot/i, 'UI_RUNTIME requires a valid PNG data URI')

assert.throws(() => buildCompleteCard(fixture({
  result: { ...fixture().result, status: 'BLOCKED', evidenceKind: 'ENVIRONMENT_BLOCKED', actualResult: 'Blocked before execution.' },
  structuredEvidence: {},
  runtimeImageDataUrl: undefined
})), /missing precondition|blocked.*precondition/i, 'blocked cards require a named missing precondition')

assert.throws(() => buildCompleteCard(fixture({
  definition: { ...fixture().definition, evidenceRequirements: ['before/after database image', 'reload/readback image'] },
  result: { ...fixture().result, beforeState: { AuthSessions: 0 }, afterState: { AuthSessions: 1 }, reloadState: {} },
  structuredEvidence: { reference: 'docs/pm/evidence/idts-110/local-execution-results.json' }
})), /reload readback|required/i, 'mutation PASS requires every declared readback phase')

assert.throws(() => buildCompleteCard(fixture({
  result: { ...fixture().result, evidenceKind: 'BTP_INTEGRATION', authorizedFixture: false, deployedSha: null }
})), /BTP_INTEGRATION|authorized fixture|deployed SHA/i, 'BTP evidence requires an authorized fixture and deployed SHA')

for (const status of ['MAPPING_ONLY', 'MAPPING_ONLY_CANDIDATE', 'Mapping Only']) {
  assert.throws(() => buildCompleteCard(fixture({ result: { ...fixture().result, status } })), /mapping[ _-]*only/i, `${status} must be rejected`)
}

const differentKeys = buildCompleteCard(fixture({
  result: {
    ...fixture().result,
    status: 'FAIL',
    assertionPassed: false,
    reviewStatus: 'PENDING_DONHV_REVIEW',
    executor: 'agent',
    evidenceKind: 'LOCAL_ATOMIC',
    actualResult: 'Observed failure is recorded.',
    beforeState: { rowCount: 0 },
    afterState: { rowCount: 2 },
    reloadState: { readback: true }
  },
  structuredEvidence: { reference: 'docs/pm/evidence/idts-110/local-execution-results.json' }
}))
assert.match(differentKeys.visibleText, /rowCount\s+\|\s+0\s+\|\s+2\s+\|\s+N\/A/)
assert.match(differentKeys.visibleText, /readback\s+\|\s+N\/A\s+\|\s+N\/A\s+\|\s+true/)
assert.match(differentKeys.visibleText, /Result: FAIL/)
assert.doesNotMatch(differentKeys.visibleText, /Observed outcome: PASS|Accepted candidate/i)

const historicalStrings = buildCompleteCard(fixture({
  result: {
    ...fixture().result,
    assertions: ['historical assertion string is retained', 'second assertion has <b>HTML</b> text'],
    actualResult: 'Historical observed result is retained.',
    sourceAssertions: ['srv/historical.js#assertCase']
  },
  structuredEvidence: {
    reference: 'docs/pm/evidence/idts-110/local-execution-results.json -> IDTS110-UT-AI-019A-LOCAL-PRIMARY-RESULT',
    sourceAssertions: ['srv/structured.js#assertStructured']
  }
}))
assert.match(historicalStrings.visibleText, /Observed assertions[\s\S]*historical assertion string is retained/)
assert.match(historicalStrings.visibleText, /Source assertions: srv\/historical\.js#assertCase/)
assert.match(historicalStrings.visibleText, /srv\/structured\.js#assertStructured/)
assert.doesNotMatch(historicalStrings.visibleText, /IDTS110-|UT-[A-Z0-9]+(?:-[A-Z0-9]+)*/)

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
for (const [index, definition] of catalog.cases.entries()) {
  const card = buildCompleteCard({
    mentorNumber: index + 1,
    definition,
    result: { status: 'BLOCKED', actualResult: `Blocked before execution: missing precondition for ${definition.caseId}.` },
    structuredEvidence: {}
  })
  assert.doesNotMatch(card.visibleText, /IDTS110-|\bUT-[A-Z0-9]+(?:-[A-Z0-9]+)*/i, `${definition.caseId} must not appear in mentor text`)
}

console.log('IDTS-110 complete evidence card contract: PASS')
