# IDTS-110 Catalog Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a source-backed approval package that classifies the 15 workbook proposals and identifies missing Unit Test coverage for the merged/live User Administration and My Notifications scope.

**Architecture:** Keep the approved 188-case catalog immutable during analysis. Store workbook proposals, source-backed gap decisions, and mentor-visible sequence numbers in structured JSON; validate them with one deterministic Node.js contract and generate one Markdown review table. Technical case keys remain internal and never appear in mentor-facing labels.

**Tech Stack:** Node.js 22, repository JSON/Markdown, existing IDTS QA scripts, Git, SAP CAP and SAPUI5 source inspection.

**Spec:** `docs/superpowers/specs/2026-09-04-idts-110-unit-test-completion-design.md`

## Global Constraints

- Authoritative base is `origin/dev@9d5aad699662bde65a747de4c0d631678de639e4`.
- Do not edit the supplied `E:\Downloads\SU26SAP01_GSU26SAP01_Unit_Test (1).xlsx`.
- Do not mutate `docs/qa/idts-110-unit-test-catalog.json` during this plan.
- Do not add, remove, or renumber approved cases during analysis.
- Mentor-facing labels use only integer sequence numbers and `Case <number>`; they never display `UT-*` identifiers.
- Internal technical keys may remain in repository JSON for stable joins.
- No product source, HANA, BTP, Jira, Google Drive, email, dependency, lockfile, or deployment mutation.
- A proposal may not be marked PASS. Allowed decisions are `KEEP`, `REWRITE`, `MERGE`, and `DROP`.
- A `KEEP` or `REWRITE` decision requires an implemented source trace and an explicit future atomic test/evidence boundary.

---

### Task 1: Freeze and validate the 15 supplied proposals

**Files:**
- Create: `docs/pm/evidence/idts-110/catalog-gap-proposal-input.json`
- Create: `scripts/qa/test-idts110-catalog-gap.js`

**Interfaces:**
- Consumes: the read-only workbook rows `UT!B196:B210`, `UT!E196:E210`, and `UT!Y196:Y210`.
- Produces: `proposalInput.proposals[]` with `{ sourceNumber, title, precondition, action, expectedResult, suppliedResult }`.

- [ ] **Step 1: Write the failing proposal-input contract**

Create `scripts/qa/test-idts110-catalog-gap.js` with these initial assertions:

```js
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const proposalInput = readJson('docs/pm/evidence/idts-110/catalog-gap-proposal-input.json')

assert.equal(proposalInput.sourceWorkbook, 'SU26SAP01_GSU26SAP01_Unit_Test (1).xlsx')
assert.equal(proposalInput.sourceBaseline, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(proposalInput.proposals.length, 15)
assert.deepEqual(proposalInput.proposals.map(row => row.sourceNumber), Array.from({ length: 15 }, (_, index) => index + 189))
for (const proposal of proposalInput.proposals) {
  assert.equal(Number.isInteger(proposal.sourceNumber), true)
  assert.equal(typeof proposal.title, 'string')
  assert.equal(typeof proposal.precondition, 'string')
  assert.equal(typeof proposal.action, 'string')
  assert.equal(typeof proposal.expectedResult, 'string')
  assert.equal(proposal.suppliedResult, 'O')
}
console.log('IDTS-110 catalog gap contract: PASS')
```

- [ ] **Step 2: Run the contract to verify RED**

Run:

```powershell
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: FAIL with `ENOENT` for `catalog-gap-proposal-input.json`.

- [ ] **Step 3: Create the immutable proposal input**

Create `docs/pm/evidence/idts-110/catalog-gap-proposal-input.json` with:

```json
{
  "schemaVersion": "1.0",
  "sourceWorkbook": "SU26SAP01_GSU26SAP01_Unit_Test (1).xlsx",
  "sourceBaseline": "9d5aad699662bde65a747de4c0d631678de639e4",
  "workbookClaimedCaseCount": 203,
  "approvedCatalogCaseCount": 188,
  "proposals": []
}
```

Populate `proposals` exactly from source numbers 189–203. Normalize only the obvious `PPrecondition` and leading-space transcription defects; preserve the supplied title, action, expected result, and supplied `O` value as evidence of the rejected workbook state.

- [ ] **Step 4: Run the contract to verify GREEN**

Run:

```powershell
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: `IDTS-110 catalog gap contract: PASS`.

- [ ] **Step 5: Commit the frozen input and contract**

```powershell
git add docs/pm/evidence/idts-110/catalog-gap-proposal-input.json scripts/qa/test-idts110-catalog-gap.js
git commit -m "test: freeze IDTS-110 catalog gap input"
```

---

### Task 2: Classify the 15 proposals against current catalog and source

**Files:**
- Create: `docs/pm/evidence/idts-110/catalog-gap-matrix.json`
- Modify: `scripts/qa/test-idts110-catalog-gap.js`

**Interfaces:**
- Consumes: `proposalInput.proposals[]`, `docs/qa/idts-110-unit-test-catalog.json`, current merged source and QA files.
- Produces: `gapMatrix.proposals[]` with `{ sourceNumber, internalProposalKey, decision, rationale, overlaps, sourceTrace, roleBoundary, executionBoundary, plannedTestFile, plannedAssertions }`.

- [ ] **Step 1: Extend the contract for complete dispositions**

Add these assertions before the PASS output:

```js
const catalog = readJson('docs/qa/idts-110-unit-test-catalog.json')
const gapMatrix = readJson('docs/pm/evidence/idts-110/catalog-gap-matrix.json')
const allowedDecisions = new Set(['KEEP', 'REWRITE', 'MERGE', 'DROP'])

assert.equal(catalog.cases.length, 188)
assert.equal(gapMatrix.baseSha, '9d5aad699662bde65a747de4c0d631678de639e4')
assert.equal(gapMatrix.proposals.length, 15)
assert.deepEqual(gapMatrix.proposals.map(row => row.sourceNumber), proposalInput.proposals.map(row => row.sourceNumber))
for (const row of gapMatrix.proposals) {
  assert.equal(allowedDecisions.has(row.decision), true)
  assert.equal(typeof row.rationale, 'string')
  assert.ok(row.rationale.length >= 24)
  assert.equal(Array.isArray(row.overlaps), true)
  assert.equal(Array.isArray(row.sourceTrace), true)
  for (const trace of row.sourceTrace) assert.equal(fs.existsSync(path.join(root, trace.file)), true)
  assert.equal(/^Case \d+$/.test(row.mentorLabel), true)
  assert.doesNotMatch(row.mentorLabel, /UT-/)
  if (row.decision === 'KEEP' || row.decision === 'REWRITE') {
    assert.ok(row.sourceTrace.length > 0)
    assert.ok(row.roleBoundary)
    assert.ok(row.executionBoundary)
    assert.ok(row.plannedTestFile)
    assert.ok(row.plannedAssertions.length > 0)
  }
  if (row.decision === 'MERGE') assert.ok(row.overlaps.length > 0)
}
```

- [ ] **Step 2: Run the contract to verify RED**

Run:

```powershell
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: FAIL with `ENOENT` for `catalog-gap-matrix.json`.

- [ ] **Step 3: Review User Administration proposals 189–198**

Use these exact source and test surfaces:

```text
srv/user-admin.cds
srv/user-admin.js
srv/user-admin/active-users.js
srv/user-admin/developer-profile.js
srv/user-admin/catalogs.js
srv/bug-service/monitoring.js
scripts/qa/test-user-admin-active-users.js
scripts/qa/test-user-admin-developer-profile.js
scripts/qa/test-user-admin-developer-profile-actions.js
scripts/qa/test-user-admin-catalogs.js
scripts/qa/test-user-admin-catalog-model.js
scripts/qa/test-developer-workload-programmatic.js
```

For each proposal, compare its behavior against all 188 catalog titles, preconditions, actions, expected results, and source traces. Record the exact overlapping internal keys. Do not treat a different title as proof of a new behavior.

- [ ] **Step 4: Review monitoring proposals 199–203**

Use these exact source and test surfaces:

```text
srv/bug-service/monitoring.js
srv/bug-service/status-metrics.js
scripts/qa/test-pm-monitoring-programmatic.js
scripts/qa/test-pm-monitoring-http.js
scripts/qa/test-developer-workload-programmatic.js
scripts/qa/test-developer-capacity-programmatic.js
```

Separate Developer workload from PM monitoring. Record whether the behavior is already covered, whether it is implemented but missing an atomic case, or whether the proposal asserts an unsupported calculation.

- [ ] **Step 5: Create the 15-row gap matrix**

Create `docs/pm/evidence/idts-110/catalog-gap-matrix.json` with:

```json
{
  "schemaVersion": "1.0",
  "baseSha": "9d5aad699662bde65a747de4c0d631678de639e4",
  "approvedCatalogCount": 188,
  "mentorNumbering": "SEQUENTIAL_ONLY",
  "proposals": []
}
```

Use internal proposal keys only inside JSON. Set `mentorLabel` to `Case 189` through `Case 203`. Do not carry the supplied `O` result into any disposition.

- [ ] **Step 6: Run the contract to verify GREEN**

Run:

```powershell
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: PASS with 15 valid dispositions and no missing source path.

- [ ] **Step 7: Commit the source-backed dispositions**

```powershell
git add docs/pm/evidence/idts-110/catalog-gap-matrix.json scripts/qa/test-idts110-catalog-gap.js
git commit -m "docs: classify IDTS-110 workbook proposals"
```

---

### Task 3: Inventory missing coverage for merged/live features

**Files:**
- Create: `docs/pm/evidence/idts-110/new-feature-coverage-gaps.json`
- Modify: `scripts/qa/test-idts110-catalog-gap.js`

**Interfaces:**
- Consumes: the approved 188-case catalog plus current User Administration and My Notifications source/tests.
- Produces: `featureCoverage.features[]`, each with implemented behaviors, existing cases, and proposed additions.

- [ ] **Step 1: Extend the contract for feature-family completeness**

Add:

```js
const featureCoverage = readJson('docs/pm/evidence/idts-110/new-feature-coverage-gaps.json')
const requiredFamilies = new Set([
  'USER_ACCESS',
  'USER_PROFILE',
  'DEVELOPER_WORKLOAD',
  'BUSINESS_CATALOGS',
  'MY_NOTIFICATIONS',
  'ACCESS_EMAIL',
  'BUG_EMAIL'
])

assert.deepEqual(new Set(featureCoverage.features.map(row => row.family)), requiredFamilies)
for (const feature of featureCoverage.features) {
  assert.ok(feature.sourceTrace.length > 0)
  assert.ok(feature.currentTests.length > 0)
  assert.equal(Array.isArray(feature.existingCaseKeys), true)
  assert.equal(Array.isArray(feature.proposedCases), true)
  for (const proposal of feature.proposedCases) {
    assert.equal(Number.isInteger(proposal.proposedSequence), true)
    assert.equal(/^Case \d+$/.test(proposal.mentorLabel), true)
    assert.doesNotMatch(proposal.mentorLabel, /UT-/)
    assert.ok(proposal.plannedTestFile)
    assert.ok(proposal.plannedAssertions.length > 0)
    assert.ok(proposal.roleBoundary)
    assert.ok(proposal.executionBoundary)
  }
}
```

- [ ] **Step 2: Run the contract to verify RED**

Expected: FAIL because `new-feature-coverage-gaps.json` does not exist.

- [ ] **Step 3: Audit User Administration coverage**

Inspect:

```text
srv/user-admin.cds
srv/user-admin/*.js
app/user-administration-ui/webapp/controller/Main.controller.js
app/user-administration-ui/webapp/view/Main.view.xml
app/user-administration-ui/webapp/fragment/*.fragment.xml
scripts/qa/test-user-admin-*.js
scripts/qa/test-user-access-*.js
scripts/qa/test-existing-user-identity-link.js
scripts/qa/test-developer-workload-programmatic.js
```

Record implemented happy, negative, role, persistence, reload, and navigation behaviors. Match each behavior to an existing 188-case internal key or create one proposed sequential case.

- [ ] **Step 4: Audit My Notifications and email coverage**

Inspect:

```text
srv/notification.cds
srv/notification.js
srv/notification/inbox.js
srv/notification/scheduled.js
srv/notification/digest.js
app/bug-management-ui/webapp/ext/notification/NotificationClient.js
app/bug-management-ui/webapp/ext/notification/NotificationShell.js
scripts/qa/test-my-notifications-*.js
scripts/qa/test-user-access-notifications.js
scripts/qa/test-email-immediate-kick.js
scripts/qa/test-email-outbox-programmatic.js
```

Distinguish in-app inbox, immediate email kick, scheduled discovery, digest, retry, caller isolation, read state, deep-link, and empty/error UI behaviors. Do not merge these into one broad proposed case.

- [ ] **Step 5: Create the feature coverage inventory**

Create `docs/pm/evidence/idts-110/new-feature-coverage-gaps.json`. Begin proposed sequence numbers after the highest retained 15-row proposal number; the final generator may compact only after DonHV approves the dispositions. Every proposal starts with `candidateStatus: "NOT_RUN"`.

- [ ] **Step 6: Run the contract to verify GREEN**

Run:

```powershell
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: PASS for all seven feature families, source traces, test files, role boundaries, and sequential mentor labels.

- [ ] **Step 7: Commit the feature coverage inventory**

```powershell
git add docs/pm/evidence/idts-110/new-feature-coverage-gaps.json scripts/qa/test-idts110-catalog-gap.js
git commit -m "docs: inventory IDTS-110 new feature coverage"
```

---

### Task 4: Generate and verify the DonHV approval report

**Files:**
- Create: `scripts/qa/generate-idts110-gap-report.js`
- Create: `docs/pm/evidence/idts-110/catalog-gap-review.md`
- Modify: `scripts/qa/test-idts110-catalog-gap.js`
- Modify: `docs/pm/tasks/idts-110-unit-test-en.md`
- Modify: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: all three structured gap JSON files.
- Produces: a deterministic Markdown report with exact disposition totals, proposed final catalog count, and a visible sequential numbering preview.

- [ ] **Step 1: Add report consistency assertions**

Add assertions that recompute:

```js
const retained = gapMatrix.proposals.filter(row => row.decision === 'KEEP' || row.decision === 'REWRITE')
const proposed = featureCoverage.features.flatMap(row => row.proposedCases)
const finalCount = 188 + retained.length + proposed.length
assert.equal(gapMatrix.summary.keep + gapMatrix.summary.rewrite + gapMatrix.summary.merge + gapMatrix.summary.drop, 15)
assert.equal(featureCoverage.summary.proposedCaseCount, proposed.length)
assert.equal(featureCoverage.summary.proposedFinalCatalogCount, finalCount)
```

Also assert that `catalog-gap-review.md` contains the exact base SHA, all 15 source numbers, every required feature family, exact totals, and no mentor-visible `UT-*` token inside its `Mentor-facing preview` section.

- [ ] **Step 2: Run the contract to verify RED**

Expected: FAIL because the report and summary fields do not yet exist.

- [ ] **Step 3: Implement the deterministic report generator**

Create `scripts/qa/generate-idts110-gap-report.js` with two modes:

```text
node scripts/qa/generate-idts110-gap-report.js
node scripts/qa/generate-idts110-gap-report.js --check
```

Default mode writes `catalog-gap-review.md`. Check mode renders in memory and exits nonzero if the committed file differs. The report must contain:

1. frozen base and constraints;
2. 15-row `KEEP/REWRITE/MERGE/DROP` table;
3. current-feature coverage table;
4. exact count reconciliation;
5. mentor-facing sequential-number preview;
6. execution/evidence work deferred until catalog approval;
7. explicit approval choices for DonHV.

- [ ] **Step 4: Generate the report and verify GREEN**

Run:

```powershell
node scripts/qa/generate-idts110-gap-report.js
node scripts/qa/generate-idts110-gap-report.js --check
node scripts/qa/test-idts110-catalog-gap.js
```

Expected: all commands PASS and the approved catalog remains byte-identical to `origin/dev`.

- [ ] **Step 5: Update task and status truth**

Append one dated entry to `docs/pm/tasks/idts-110-unit-test-en.md` and `docs/pm/status/donhv.md` recording:

- PR #387 merge SHA `9d5aad699662bde65a747de4c0d631678de639e4`;
- the 15 proposal disposition counts;
- the number of newly identified feature gaps;
- the proposed final catalog count;
- mentor-facing sequential-only numbering;
- no canonical catalog, workbook, Drive, Jira, BTP, product source, or live-data mutation;
- the explicit DonHV approval boundary.

- [ ] **Step 6: Run final verification**

```powershell
node scripts/qa/generate-idts110-unit-test-catalog.js --check
node scripts/qa/generate-idts110-gap-report.js --check
node scripts/qa/test-idts110-catalog-gap.js
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
git diff --check origin/dev...HEAD
git diff --quiet origin/dev...HEAD -- docs/qa/idts-110-unit-test-catalog.json
git diff --quiet origin/dev...HEAD -- app srv db package.json package-lock.json mta.yaml xs-security.json
```

Expected: all checks PASS; both prohibited diff commands exit 0.

- [ ] **Step 7: Commit the approval package**

```powershell
git add scripts/qa/generate-idts110-gap-report.js scripts/qa/test-idts110-catalog-gap.js docs/pm/evidence/idts-110/catalog-gap-review.md docs/pm/tasks/idts-110-unit-test-en.md docs/pm/status/donhv.md
git commit -m "docs: prepare IDTS-110 catalog gap approval"
```

- [ ] **Step 8: Independent review and Draft PR**

Request one bounded read-only review of `9d5aad699662bde65a747de4c0d631678de639e4..HEAD`. Critical, Major, and Important findings must be zero before push. Push `docs/idts-110-catalog-gap-donhv`, create exactly one Draft PR to `dev`, wait for `qa-depth-gate`, and stop without Ready, merge, catalog mutation, test implementation, workbook generation, Drive upload, or live execution.

- [ ] **Step 9: DonHV catalog decision checkpoint**

Present `catalog-gap-review.md` and ask DonHV to approve or revise the disposition set and proposed final catalog count. The next implementation plan may be written only after this decision.
