/*
 * Generate the deterministic IDTS-110 catalog-gap approval report.
 *
 * This report is a planning and approval artifact. It never changes the
 * approved catalog, executes a case, or promotes a candidate to PASS.
 */
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..', '..')
const OUTPUT = path.join(ROOT, 'docs', 'pm', 'evidence', 'idts-110', 'catalog-gap-review.md')
const BASELINE_SHA = '9d5aad699662bde65a747de4c0d631678de639e4'
const REQUIRED_FAMILIES = [
  'USER_ACCESS',
  'USER_PROFILE',
  'DEVELOPER_WORKLOAD',
  'BUSINESS_CATALOGS',
  'MY_NOTIFICATIONS',
  'ACCESS_EMAIL',
  'BUG_EMAIL'
]

function readJson (relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'))
}

function cell (value) {
  const text = value === undefined || value === null || value === '' ? '—' : String(value)
  return text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
}

function table (headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`
  ]
  for (const row of rows) lines.push(`| ${row.map(cell).join(' | ')} |`)
  return lines
}

function sequenceRange (sequences) {
  if (sequences.length === 0) return '—'
  if (sequences.length === 1) return `Case ${sequences[0]}`
  return `Case ${sequences[0]} – Case ${sequences[sequences.length - 1]}`
}

function assertInputs (proposalInput, gapMatrix, featureCoverage) {
  assert.equal(proposalInput.sourceBaseline, BASELINE_SHA)
  assert.equal(proposalInput.approvedCatalogCaseCount, 188)
  assert.equal(proposalInput.proposals.length, 15)
  assert.equal(gapMatrix.baseSha, BASELINE_SHA)
  assert.equal(gapMatrix.approvedCatalogCount, 188)
  assert.equal(gapMatrix.proposals.length, 15)
  assert.equal(featureCoverage.baseSha, BASELINE_SHA)
  assert.equal(featureCoverage.approvedCatalogCount, 188)
  assert.deepEqual(featureCoverage.features.map(feature => feature.family), REQUIRED_FAMILIES)

  const retained = gapMatrix.proposals.filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE')
  const proposed = featureCoverage.features.flatMap(feature => feature.proposedCases)
  const counts = gapMatrix.proposals.reduce((result, row) => {
    result[row.decision] = (result[row.decision] || 0) + 1
    return result
  }, {})
  assert.deepEqual(counts, { KEEP: 7, REWRITE: 3, DROP: 2, MERGE: 3 })
  assert.equal(retained.length, 10)
  assert.equal(featureCoverage.summary.proposedCaseCount, proposed.length)
  assert.equal(featureCoverage.summary.retainedProposalCount, retained.length)
  assert.equal(featureCoverage.summary.proposedFinalCatalogCount, 188 + retained.length + proposed.length)
  assert.equal(proposed.length, 80)
  assert.equal(featureCoverage.summary.proposedFinalCatalogCount, 278)
  assert.deepEqual(
    proposed.map(row => row.proposedSequence),
    Array.from({ length: 80 }, (_, index) => 204 + index)
  )
}

function renderReport () {
  const proposalInput = readJson('docs/pm/evidence/idts-110/catalog-gap-proposal-input.json')
  const gapMatrix = readJson('docs/pm/evidence/idts-110/catalog-gap-matrix.json')
  const featureCoverage = readJson('docs/pm/evidence/idts-110/new-feature-coverage-gaps.json')
  assertInputs(proposalInput, gapMatrix, featureCoverage)

  const retained = gapMatrix.proposals.filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE')
  const proposed = featureCoverage.features.flatMap(feature => feature.proposedCases)
  const counts = gapMatrix.proposals.reduce((result, row) => {
    result[row.decision] = (result[row.decision] || 0) + 1
    return result
  }, {})
  const finalCount = 188 + retained.length + proposed.length
  const retainedLabels = retained.map(row => row.mentorLabel).join(', ')

  const lines = [
    '# IDTS-110 Catalog Gap Review',
    '',
    '> Candidate approval package only. This document is not an execution report and does not change the official Unit Test catalog.',
    '',
    '## Frozen baseline and constraints',
    '',
    `- Authoritative source baseline: \`origin/dev@${BASELINE_SHA}\`.`,
    '- The approved catalog remains 188 cases and is unchanged during this analysis.',
    '- The supplied workbook is review input only; it is not the official final workbook.',
    '- Task 2 classifies source rows 189–203. A proposal is not PASS: allowed decisions are KEEP, REWRITE, MERGE, and DROP.',
    '- MERGE rows reuse the named existing atomic boundary and do not add a catalog row.',
    '- Task 3 identifies implemented-but-missing atomic cases. Every one of its 80 candidates starts as NOT_RUN.',
    '- Technical case keys remain internal to repository artifacts. Mentor-facing labels use sequential `Case N` wording only.',
    '- No canonical catalog, workbook, Drive, Jira, BTP, product source, live data, dependency, lockfile, email, or deployment mutation is part of this package.',
    '',
    '## Task 2 proposal dispositions',
    '',
    'The table preserves all 15 supplied source rows so that dropped and merged input is auditable. Internal keys are shown here for repository traceability; they are omitted from the mentor-facing preview below.',
    '',
    ...table(
      ['Source number', 'Decision', 'Internal proposal key', 'Mentor label', 'Exact overlap', 'Rationale'],
      gapMatrix.proposals.map(row => [
        row.sourceNumber,
        row.decision,
        row.internalProposalKey,
        row.mentorLabel,
        row.overlaps.join(', '),
        row.rationale
      ])
    ),
    '',
    '## Disposition and catalog reconciliation',
    '',
    ...table(
      ['Measure', 'Count', 'Meaning'],
      [
        ['KEEP', counts.KEEP, 'New source-backed behavior candidate.'],
        ['REWRITE', counts.REWRITE, 'Valid gap, but the supplied wording must be narrowed before execution.'],
        ['MERGE', counts.MERGE, 'Already covered by an existing atomic case; no new row.'],
        ['DROP', counts.DROP, 'Duplicate, unsupported, or not a separately testable requirement.'],
        ['Retained Task 2 candidates', retained.length, 'KEEP + REWRITE only.'],
        ['Task 3 candidate cases', proposed.length, 'All are NOT_RUN and require a later approved execution plan.'],
        ['Current canonical catalog count', 188, 'Unchanged in this package.'],
        ['Candidate final catalog count', finalCount, '188 + 10 retained Task 2 candidates + 80 Task 3 candidates.']
      ]
    ),
    '',
    'The candidate final count is 278. It is a proposal for approval, not a catalog update.',
    '',
    '## Current-feature coverage',
    '',
    'Each family below is backed by the source traces and current test files recorded in `new-feature-coverage-gaps.json`. Existing case keys and retained Task 2 links are reused where they already cover the behavior; only implemented gaps become candidates.',
    '',
    ...table(
      ['Feature family', 'Implemented behaviors', 'Existing 188-case keys', 'Retained Task 2 links', 'New candidates', 'Candidate sequence'],
      featureCoverage.features.map(feature => {
        const behaviors = feature.implementedBehaviors || []
        const existing = new Set(feature.existingCaseKeys)
        const retainedLinks = new Set(behaviors.flatMap(behavior => behavior.retainedProposalKeys || []))
        const sequences = feature.proposedCases.map(proposal => proposal.proposedSequence)
        return [
          feature.family,
          behaviors.length,
          existing.size,
          retainedLinks.size,
          feature.proposedCases.length,
          sequenceRange(sequences)
        ]
      })
    ),
    '',
    '| Total feature families | 7 | — | — | 80 | Case 204 – Case 283 |',
    '',
    '### Candidate ownership by family',
    '',
    ...table(
      ['Feature family', 'Candidate labels', 'Candidate state', 'Execution boundary'],
      featureCoverage.features.map(feature => [
        feature.family,
        sequenceRange(feature.proposedCases.map(proposal => proposal.proposedSequence)),
        'NOT_RUN',
        'Local isolated fixtures and the exact test file recorded in the structured inventory; no live mutation.'
      ])
    ),
    '',
    '## Mentor-facing preview',
    '',
    'This is the only numbering style intended for the mentor-facing workbook and evidence cards. Technical keys and source-only proposal identifiers are intentionally omitted from this section.',
    '',
    ...table(
      ['Candidate area', 'Sequential labels', 'Status'],
      [
        ['Approved existing catalog', 'Case 1 … Case 188', 'Approved baseline; unchanged.'],
        ['Retained Task 2 candidates', retainedLabels, 'Candidate; NOT_RUN; pending catalog approval.'],
        ['Task 3 feature candidates', 'Case 204 … Case 283', 'Candidate; NOT_RUN; pending catalog approval.'],
        ['Candidate merged catalog', '278 cases', 'Candidate total only; not yet official.']
      ]
    ),
    '',
    'Dropped and merged source rows do not create new candidate labels. Any final compacting or append-only number-to-key mapping happens only after DonHV approves the catalog.',
    '',
    '## Execution and evidence boundary',
    '',
    '- No retained or proposed row is marked PASS by this report.',
    '- Atomic execution, persistence/reload checks, UI runtime captures, BTP evidence, and reviewer acceptance remain future work.',
    '- A later execution package must emit one result per approved internal case key, keep the sequential mentor label, and preserve the distinction between PASS, FAIL, HELD, MAPPING ONLY, BLOCKED, and NOT_RUN.',
    '- A suite exit code or generated card alone cannot promote a row to PASS.',
    '',
    '## DonHV approval checkpoint',
    '',
    'Please approve or revise these decisions before a catalog-extension or execution plan is written:',
    '',
    '1. The 15-row disposition set: 7 KEEP, 3 REWRITE, 3 MERGE, and 2 DROP.',
    '2. The seven feature families and their 80 implemented-but-missing atomic candidates.',
    '3. The candidate final count of 278, with MERGE rows reusing existing boundaries and no canonical catalog mutation yet.',
    '4. The sequential-only mentor presentation and the rule that technical keys remain repository-internal.',
    '',
    'Until that approval is recorded, keep the official catalog, workbook, Drive artifact, and all runtime data unchanged.',
    ''
  ]
  return lines.join('\n')
}

function main () {
  const expected = renderReport()
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUTPUT)) {
      console.error(`IDTS-110 gap report check: missing ${OUTPUT}`)
      process.exitCode = 1
      return
    }
    const current = fs.readFileSync(OUTPUT, 'utf8')
    if (current !== expected) {
      console.error('IDTS-110 gap report check: FAIL (committed report differs from deterministic output)')
      process.exitCode = 1
      return
    }
    console.log('IDTS-110 gap report check: PASS')
    return
  }

  fs.writeFileSync(OUTPUT, expected, 'utf8')
  console.log(`IDTS-110 gap report generated: ${path.relative(ROOT, OUTPUT)}`)
}

main()
