# IDTS-110 Atomic Execution and Workbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ( - [ ] ) syntax for tracking.

**Goal:** Extend the approved 188-case IDTS-110 Unit Test catalog to a deterministic 278-case candidate, execute each new case atomically where its fixture permits, generate number-only mentor evidence, and produce a validated candidate workbook from the official Unit_Test.xlsx template.

**Architecture:** A frozen extension manifest joins the approved gap matrix and feature inventory to the existing catalog. One shared atomic-result protocol adds case selectors to existing QA runners, one new UserAdmin role runner, and one browser runner; an orchestrator invokes each case independently and never promotes suite mapping to PASS. Evidence cards and the workbook are pure projections of structured results and the compact number map.

**Tech Stack:** Node.js 22.20.0, Node assert/fs/child_process, SAP CAP test fixtures, installed Playwright, bundled `@oai/artifact-tool`, OfficeCLI 1.0.147, LibreOffice, Git.

**Spec:** docs/superpowers/specs/2026-09-05-idts-110-atomic-execution-and-workbook-design.md

## Global Constraints

- Execute and record new source claims against 6eb6f73840d7150598a993f8656d2b44e5b0cd4b, the PR #388 merge SHA.
- Preserve the historical gap-package base 9d5aad699662bde65a747de4c0d631678de639e4 and catalog generator base bc0c47e522ae208384d4b23dda21535dcc683683 as explicit metadata.
- Produce 278 definitions as 188 existing cases plus 10 retained Task 2 cases plus 80 Task 3 feature candidates.
- Compact visible numbering is 1..278: existing cases 1..188, retained cases 189..198, and feature candidates 199..278. Source proposal sequences and internal keys remain repository-only.
- Every new definition starts NOT_RUN. Existing 40 candidate PASS, 135 mapping-only, and 13 BTP-blocked records remain separate truth and are never auto-promoted.
- User Administration has 45 new rows with the approved adapter accounting: 11 existing exact, 33 additions to existing runners, and one new role runner.
- The Notification slice has 45 new rows; eight Notification rows require rendered browser/runtime screenshots. User Administration F224 is the ninth visual case in the complete 90-row package.
- A suite exit code, static UI check, FakeControl result, generated card, empty-state image, or command-only link is not atomic PASS evidence.
- Provider-live, SAP identity, email-send, S3, Job Scheduler, HANA, and BTP claims remain BLOCKED without an authorized fixture, exact source/deploy baseline, sanitized readback, and explicit DonHV approval.
- Do not edit product source, CDS, seed data, dependency manifests, lockfiles, HANA/BTP state, Drive, Jira, or the official template during this implementation.
- Do not create one script per case. Reuse existing runners through one selector protocol, one shared helper, one new role runner, one browser runner, one evidence/card path, and one workbook generator/validator.
- Do not edit docs/sap490/templates/Deliverable_template/Unit_Test.xlsx. Output only a candidate workbook with a candidate suffix.
- The local official template’s 13 broken defined names and two Histories overflow warnings are authority baseline issues. Candidate validation fails on introduced issues, not unchanged authority warnings.
- Every task ends with its own focused test, git diff --check, and a review checkpoint before the next task.

---

### Task 1: Freeze the approved extension manifest and compact number map

**Files:**

- Create: docs/qa/idts-110-extension-cases.json
- Create: docs/qa/idts-110-case-number-map.json
- Create: docs/pm/evidence/idts-110/catalog-approval.json
- Create: scripts/qa/test-idts110-extension-manifest.js
- Read-only inputs: docs/qa/idts-110-unit-test-catalog.json, docs/pm/evidence/idts-110/catalog-gap-matrix.json, docs/pm/evidence/idts-110/new-feature-coverage-gaps.json, docs/pm/evidence/idts-110/catalog-gap-review.md

**Interfaces:**

- Consumes: the 188 existing catalog rows, the ten matrix rows whose decision is KEEP or REWRITE, and the 80 feature inventory rows.
- Produces: extension rows with complete test definitions and the immutable mapping { mentorNumber, internalCaseKey, sourceProposalSequence, candidateOrigin }.
- Adapter accounting fields are adapterClass: EXISTING_EXACT, ADD_TO_EXISTING, or NEW_ROLE_RUNNER and plannedTestFile.

- [ ] **Step 1: Write the failing manifest contract**

Create scripts/qa/test-idts110-extension-manifest.js with:

~~~js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const extension = readJson('docs/qa/idts-110-extension-cases.json')
const numberMap = readJson('docs/qa/idts-110-case-number-map.json')

assert.equal(extension.schemaVersion, '1.0')
assert.equal(extension.sourceBaselineSha, '6eb6f73840d7150598a993f8656d2b44e5b0cd4b')
assert.deepEqual(extension.approvalReference, {
  pullRequest: 388,
  mergeSha: '6eb6f73840d7150598a993f8656d2b44e5b0cd4b'
})
const approval = readJson('docs/pm/evidence/idts-110/catalog-approval.json')
assert.equal(approval.status, 'APPROVED_FOR_EXECUTION')
assert.equal(approval.approvedBy, 'DonHV')
assert.equal(approval.approvedCatalogCount, 278)
assert.equal(extension.retainedTask2.length, 10)
assert.equal(extension.featureCandidates.length, 80)
assert.equal(numberMap.entries.length, 278)
assert.deepEqual(numberMap.entries.map(row => row.mentorNumber), Array.from({ length: 278 }, (_, i) => i + 1))
assert.equal(new Set(numberMap.entries.map(row => row.internalCaseKey)).size, 278)
~~~

- [ ] **Step 2: Run the contract to verify RED**

~~~powershell
node scripts/qa/test-idts110-extension-manifest.js
~~~

Expected: FAIL because the two new JSON files do not exist.

- [ ] **Step 3: Record the catalog approval receipt**

Create `docs/pm/evidence/idts-110/catalog-approval.json` with the exact approval
date `2026-09-05`, approver `DonHV`, status `APPROVED_FOR_EXECUTION`, approved
catalog count `278`, PR `388`, merge SHA
`6eb6f73840d7150598a993f8656d2b44e5b0cd4b`, and an explicit statement that
this authorizes definitions and execution but does not pre-approve any result.

- [ ] **Step 4: Create the retained rows**

Create complete definitions for these exact retained keys in matrix order:

~~~text
IDTS110-P189, IDTS110-P190, IDTS110-P191, IDTS110-P194, IDTS110-P195,
IDTS110-P196, IDTS110-P197, IDTS110-P200, IDTS110-P202, IDTS110-P203
~~~

Use sourceProposalSequence values 189, 190, 191, 194, 195, 196, 197, 200,
202, and 203. Use mentorNumber values 189 through 198. Set P191’s
plannedTestFile to scripts/qa/test-user-admin-role-contract.js. Set all other
plannedTestFile, sourceTrace, roleBoundary, executionBoundary, requirementIds,
preconditions, input, steps, expectedResult, and evidenceRequirements from the
approved matrix and its named source files. Set candidateStatus and
reviewStatus to NOT_RUN and PENDING_DONHV_REVIEW.

- [ ] **Step 5: Create the feature rows**

Copy the 80 approved feature rows in inventory order, retaining their internal
keys and sourceProposalSequence values:

~~~text
USER_ACCESS: F204 F205 F206 F207 F208 F209 F210 F210S F211 F212 F213 F214 F215 F216 F216R
USER_PROFILE: F217 F218 F219 F220 F220D F220R F220N
DEVELOPER_WORKLOAD: F221 F222 F223 F224
BUSINESS_CATALOGS: F225 F226 F227 F228 F228E F229 F230 F231 F231R
MY_NOTIFICATIONS: F232 F233 F234 F235 F235I F235C F236 F237 F238 F238E F238L F239 F239P F239H F239D
ACCESS_EMAIL: F240 F240R F241 F243 F243M F244 F245 F246 F246R F246B
BUG_EMAIL: F247 F247S F247SS F248 F248C F248N F249 F249K F249T F250 F250L F250M F250Q F250R F251 F251R F252 F252R F252P F253
~~~

Assign compact mentor numbers 199 through 278. Every row has exactly one
planned assertion ID of the form internalCaseKey + -A1, a nonempty source
trace, an existing planned test file, and candidateStatus NOT_RUN. Do not
invent F242.

- [ ] **Step 6: Record the adapter ledger**

Set adapterClass values exactly as follows:

~~~text
EXISTING_EXACT:
  IDTS110-F212, IDTS110-F213, IDTS110-F214, IDTS110-F219,
  IDTS110-F220D, IDTS110-F220R, IDTS110-F220N,
  IDTS110-P202, IDTS110-F221, IDTS110-F223, IDTS110-F224
ADD_TO_EXISTING:
  IDTS110-P189, IDTS110-P190, IDTS110-P194, IDTS110-P195,
  IDTS110-P196, IDTS110-P197, IDTS110-P200, IDTS110-P203,
  IDTS110-F204..IDTS110-F211, IDTS110-F210S,
  IDTS110-F215, IDTS110-F216, IDTS110-F216R,
  IDTS110-F217, IDTS110-F218, IDTS110-F220, IDTS110-F222,
  IDTS110-F225, IDTS110-F226, IDTS110-F227, IDTS110-F228, IDTS110-F228E,
  IDTS110-F229, IDTS110-F230, IDTS110-F231, IDTS110-F231R
NEW_ROLE_RUNNER:
  IDTS110-P191
~~~

The validator must count 11, 33, and 1 respectively. This count is row-based,
not a count of distinct files.

- [ ] **Step 7: Run the contract to verify GREEN**

~~~powershell
node scripts/qa/test-idts110-extension-manifest.js
git diff --check
~~~

Expected: IDTS-110 extension manifest PASS with 10 retained, 80 feature, 90
total, and a compact 278-entry map.

- [ ] **Step 8: Commit the manifest only**

~~~powershell
git add docs/qa/idts-110-extension-cases.json docs/qa/idts-110-case-number-map.json docs/pm/evidence/idts-110/catalog-approval.json scripts/qa/test-idts110-extension-manifest.js
git commit -m "test: freeze IDTS-110 atomic extension manifest"
~~~

Review checkpoint: verify all 90 rows against the approved matrix/inventory and
confirm no catalog, source, runtime, workbook, or external state changed.

### Task 2: Merge the extension into the generated 278-case catalog

**Files:**

- Modify: scripts/qa/generate-idts110-unit-test-catalog.js
- Modify: docs/qa/idts-110-unit-test-catalog.json
- Modify: scripts/qa/test-idts110-extension-manifest.js
- Create: scripts/qa/test-idts110-extended-catalog.js

**Interfaces:**

- Generator input: docs/qa/idts-110-extension-cases.json and the existing 188 in generator order.
- Generator output: docs/qa/idts-110-unit-test-catalog.json with 278 rows, stable existing keys, and new rows all NOT_RUN.
- Catalog metadata: sourceBaselineSha, historicalCatalogBaselineSha, approvalReference, mentorNumbering, and extensionSummary.

- [ ] **Step 1: Write the failing extended-catalog test**

~~~js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-unit-test-catalog.json'), 'utf8'))
const extension = JSON.parse(fs.readFileSync(path.join(root, 'docs/qa/idts-110-extension-cases.json'), 'utf8'))
const keys = new Set(catalog.cases.map(row => row.caseId))

assert.equal(catalog.cases.length, 278)
assert.equal(catalog.sourceBaselineSha, '6eb6f73840d7150598a993f8656d2b44e5b0cd4b')
assert.equal(catalog.historicalCatalogBaselineSha, 'bc0c47e522ae208384d4b23dda21535dcc683683')
assert.equal(catalog.cases.slice(0, 188).length, 188)
for (const row of [...extension.retainedTask2, ...extension.featureCandidates]) {
  assert.equal(keys.has(row.internalCaseKey), true)
  const definition = catalog.cases.find(item => item.caseId === row.internalCaseKey)
  assert.equal(definition.mentorNumber, row.mentorNumber)
  assert.equal(definition.execution.status, 'NOT_RUN')
  assert.equal(definition.assertionId, row.assertionId)
}
assert.deepEqual(catalog.cases.slice(0, 188).map(row => row.caseId), catalog.existingCaseOrder)
~~~

- [ ] **Step 2: Run it to verify RED**

~~~powershell
node scripts/qa/test-idts110-extended-catalog.js
~~~

Expected: FAIL because the current generated catalog has 188 rows and lacks
the extension metadata.

- [ ] **Step 3: Add the minimal generator merge**

Add a source-baseline option that accepts only the exact 40-character SHA,
loads the extension manifest, converts each row to the existing catalog
definition shape, and appends retained rows followed by feature rows. Preserve
the existing first 188 serialized definitions and order. Do not read execution
manifests or import old status/result fields. Include:

~~~js
catalog.sourceBaselineSha = sourceBaselineSha
catalog.historicalCatalogBaselineSha = BASELINE_SHA
catalog.approvalReference = extension.approvalReference
catalog.mentorNumbering = 'SEQUENTIAL_ONLY'
catalog.extensionSummary = { existing: 188, retainedTask2: 10, featureCandidates: 80, total: 278 }
~~~

Add each new definition’s mentorNumber, candidateOrigin, sourceProposalSequence,
assertionId, acceptanceMode, plannedTestFile, roleBoundary, executionBoundary,
and evidenceRequirements without changing the existing execution object shape.

- [ ] **Step 4: Generate and verify the catalog**

~~~powershell
node scripts/qa/generate-idts110-unit-test-catalog.js --extended --source-baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b
node scripts/qa/generate-idts110-unit-test-catalog.js --check
node scripts/qa/test-idts110-extended-catalog.js
node scripts/qa/test-idts110-catalog-gap.js
~~~

Expected: the extended catalog test and existing gap contract pass; the gap
contract still reports 7 KEEP, 3 REWRITE, 3 MERGE, 2 DROP, 10 retained, 80
feature candidates, and 278 proposed final rows.

- [ ] **Step 5: Commit the catalog merge**

~~~powershell
git add scripts/qa/generate-idts110-unit-test-catalog.js docs/qa/idts-110-unit-test-catalog.json scripts/qa/test-idts110-extended-catalog.js
git commit -m "feat: extend IDTS-110 catalog to 278 cases"
~~~

Review checkpoint: inspect the first and last five rows, all compact-number
boundaries, and the serialized diff. No result record or evidence directory may
change in this task.

### Task 3: Implement and test the atomic-result protocol

**Files:**

- Create: docs/qa/idts-110-atomic-result.schema.json
- Create: scripts/qa/idts110-atomic-runner.js
- Create: scripts/qa/run-idts110-new-cases.js
- Create: scripts/qa/test-idts110-atomic-runner.js

**Interfaces:**

- readAtomicOptions(argv) -> { caseKey, baselineSha, executor, mode, outputPath }.
- runAtomicCase({ definition, assertionId, baselineSha, executor, execute }) -> Promise<AtomicResult>.
- writeAtomicBatch({ runId, sourceBaselineSha, catalogSha, approvalReference, results }, outputPath) -> void.
- run-idts110-new-cases.js --baseline=<sha> --executor=<identity> --output=<json> invokes exactly one child command per new case and parses one marker.

- [ ] **Step 1: Write the failing protocol contract**

~~~js
const assert = require('node:assert/strict')
const { redactText, parseAtomicMarker } = require('./idts110-atomic-runner')

assert.deepEqual(parseAtomicMarker([
  'noise',
  'IDTS110_ATOMIC_RESULT {"caseKey":"IDTS110-F232","assertionId":"IDTS110-F232-A1","status":"PASS"}'
]), {
  caseKey: 'IDTS110-F232',
  assertionId: 'IDTS110-F232-A1',
  status: 'PASS'
})
assert.throws(() => parseAtomicMarker([
  'IDTS110_ATOMIC_RESULT {"caseKey":"A"}',
  'IDTS110_ATOMIC_RESULT {"caseKey":"B"}'
]), /exactly one/)
assert.equal(redactText('Bearer abc password=secret postgresql://u:p@h/db').includes('secret'), false)
~~~

- [ ] **Step 2: Run it to verify RED**

~~~powershell
node scripts/qa/test-idts110-atomic-runner.js
~~~

Expected: FAIL because the shared helper does not exist.

- [ ] **Step 3: Implement the smallest shared helper**

Use only Node built-ins. Enforce:

~~~text
PASS requires one matching assertion ID, expected-result match, required state snapshots, and required evidence.
FAIL is an executed assertion mismatch.
BLOCKED is an unavailable fixture, browser, provider, BTP, or authorized target.
HELD is a reviewer hold after execution; it is never synthesized by the runner.
NOT_RUN is allowed only before a case is invoked.
MAPPING_ONLY is rejected for new rows.
~~~

The helper validates a 40-character baseline SHA, requires a nonempty explicit
executor, redacts password/token/API-key/Bearer/database-URL patterns, rejects
undefined and unresolved placeholder text, and emits one JSON marker beginning
with IDTS110_ATOMIC_RESULT.

- [ ] **Step 4: Implement the orchestrator**

Load the 90 new definitions and their plannedTestFile values. For each case,
spawn:

~~~text
node scripts/qa/<plannedTestFile> --idts110-case=<internalCaseKey> --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=<explicit-identity> --output=<per-case-output>
~~~

Reject a child exit with no marker, multiple markers, a marker for another
case, a wrong assertion ID, a wrong baseline, or a suite-only total. Write one
batch object containing 90 result objects, one per internal key.

- [ ] **Step 5: Run the protocol test and syntax checks**

~~~powershell
node scripts/qa/test-idts110-atomic-runner.js
node --check scripts/qa/idts110-atomic-runner.js
node --check scripts/qa/run-idts110-new-cases.js
git diff --check
~~~

- [ ] **Step 6: Commit the protocol**

~~~powershell
git add docs/qa/idts-110-atomic-result.schema.json scripts/qa/idts110-atomic-runner.js scripts/qa/run-idts110-new-cases.js scripts/qa/test-idts110-atomic-runner.js
git commit -m "test: add IDTS-110 atomic result protocol"
~~~

Review checkpoint: independently inspect marker parsing and secret redaction.
No adapter may write PASS based only on a broad suite exit code.

### Task 4: Execute the four User Administration backend families

**Files:**

- Modify: scripts/qa/test-user-onboarding-contract.js
- Modify: scripts/qa/test-user-onboarding-programmatic.js
- Modify: scripts/qa/test-user-admin-access-lifecycle.js
- Modify: scripts/qa/test-existing-user-identity-link.js
- Modify: scripts/qa/test-user-admin-active-users.js
- Modify: scripts/qa/test-user-admin-developer-profile-actions.js
- Modify: scripts/qa/test-user-admin-developer-profile.js
- Modify: scripts/qa/test-developer-workload-programmatic.js
- Modify: scripts/qa/test-user-admin-workload.js
- Modify: scripts/qa/test-user-admin-catalogs.js
- Modify: scripts/qa/test-pm-monitoring-programmatic.js
- Create: scripts/qa/test-user-admin-role-contract.js
- Test: scripts/qa/test-idts110-atomic-runner.js

**Interfaces:**

- Existing runners keep their no-argument regression behavior.
- With --idts110-case=<key>, each runner initializes an isolated fixture and
  calls runAtomicCase exactly once with assertion ID <key>-A1.
- The new role runner owns IDTS110-P191 and has no provider or persistence mutation.
- F224 emits only a sanitized programmatic precheck in this task. Task 6 owns
  its sole authoritative UI-runtime atomic result.

- [ ] **Step 1: Add selector RED checks without changing broad behavior**

For each existing runner, add a test-visible dispatch map:

~~~js
const atomicCases = new Map([
  ['IDTS110-F217', runDisplayNameUpdateCase],
  ['IDTS110-F218', runDisplayNameVersionConflictCase]
])
~~~

When the selector is absent, invoke the current main path. When present, reject
unknown keys before database setup, run only the selected case, emit one
atomic marker, and exit 1 for FAIL or BLOCKED.

- [ ] **Step 2: Implement the retained and UserAdmin case mappings**

~~~text
test-user-admin-developer-profile-actions.js:
  P189 P190 F219
test-user-admin-catalogs.js:
  P194 P195 P196 P197 F225 F226 F227 F228 F228E F229 F230 F231 F231R
test-pm-monitoring-programmatic.js:
  P200 P203
test-developer-workload-programmatic.js:
  P202 F221 F222 F223
test-user-onboarding-contract.js:
  F204 F207 F208
test-user-onboarding-programmatic.js:
  F205 F206 F209 F210 F210S F211 F215 F216 F216R
test-user-admin-access-lifecycle.js:
  F212 F213
test-existing-user-identity-link.js:
  F214
test-user-admin-active-users.js:
  F217 F218
test-user-admin-developer-profile.js:
  F220 F220D F220R F220N
test-user-admin-workload.js:
  F224
test-user-admin-role-contract.js:
  P191
~~~

The exact existing rows are F212, F213, F214, F219, F220D, F220R, F220N,
P202, F221, F223, and F224. The other 33 additions add one named assertion to an
existing runner. F224 still needs the separate rendered UI evidence in Task 6.
P191’s runner checks TESTER, DEVELOPER, and PM allowlisting,
the PM-only UserAdmin overlay, and rejection before persistence.

- [ ] **Step 3: Add case-specific persistence and authorization assertions**

Each case follows the inventory’s single planned assertion. For persisted cases,
capture before, after, and reload snapshots. For rejection cases, assert the
status/code and unchanged relevant rows. Keep current action owner separate from
technical assignee in F224. Do not use a shared mutable database between cases.

- [ ] **Step 4: Run the UserAdmin matrix**

~~~powershell
$baseline = "6eb6f73840d7150598a993f8656d2b44e5b0cd4b"
node scripts/qa/test-user-admin-role-contract.js --idts110-case=IDTS110-P191 --baseline=$baseline --executor=Codex-agent-assisted
node scripts/qa/run-idts110-new-cases.js --scope=USER_ADMIN_PROGRAMMATIC --baseline=$baseline --executor=Codex-agent-assisted --output=.tmp/idts-110/user-admin-results.json
~~~

Expected: 44 authoritative result records plus one F224 programmatic precheck,
every selected programmatic key present once, no MAPPING_ONLY status, and no
browser/provider claim. Task 6 consumes the F224 precheck and emits the one
authoritative result for that case.

- [ ] **Step 5: Run focused source suites**

~~~powershell
node scripts/qa/test-user-admin-developer-profile.js
node scripts/qa/test-user-admin-developer-profile-actions.js
node scripts/qa/test-user-admin-active-users.js
node scripts/qa/test-user-admin-catalog-model.js
node scripts/qa/test-user-admin-catalogs.js
node scripts/qa/test-user-admin-access-lifecycle.js
node scripts/qa/test-existing-user-identity-link.js
node scripts/qa/test-developer-workload-programmatic.js
node scripts/qa/test-user-admin-workload.js
node scripts/qa/test-pm-monitoring-programmatic.js
node scripts/qa/test-user-onboarding-contract.js
node scripts/qa/test-user-onboarding-programmatic.js
git diff --check
~~~

- [ ] **Step 6: Commit the UserAdmin adapters**

~~~powershell
git add scripts/qa/test-user-onboarding-contract.js scripts/qa/test-user-onboarding-programmatic.js scripts/qa/test-user-admin-access-lifecycle.js scripts/qa/test-existing-user-identity-link.js scripts/qa/test-user-admin-active-users.js scripts/qa/test-user-admin-developer-profile-actions.js scripts/qa/test-user-admin-developer-profile.js scripts/qa/test-developer-workload-programmatic.js scripts/qa/test-user-admin-workload.js scripts/qa/test-user-admin-catalogs.js scripts/qa/test-pm-monitoring-programmatic.js scripts/qa/test-user-admin-role-contract.js
git commit -m "test: add atomic User Administration cases"
~~~

Review checkpoint: verify the 11/33/1 ledger and inspect a positive, negative,
optimistic-concurrency, persistence, and role-boundary result.

### Task 5: Execute My Notifications service/read-model cases

**Files:**

- Modify: scripts/qa/test-my-notifications-service.js
- Test: scripts/qa/run-idts110-new-cases.js

**Interfaces:**

- The service runner exposes selectors for F232, F233, F234, F235, F235I,
  F235C, and F236.
- Each selector runs an isolated CAP NotificationService fixture and emits one
  result object; no email/provider call is allowed.

- [ ] **Step 1: Write selector contract tests**

~~~js
assert.deepEqual([...atomicCases.keys()], [
  'IDTS110-F232', 'IDTS110-F233', 'IDTS110-F234', 'IDTS110-F235',
  'IDTS110-F235I', 'IDTS110-F235C', 'IDTS110-F236'
])
~~~

- [ ] **Step 2: Implement the seven atomic assertions**

Cover caller-only scope and occurredAt-desc/ID-desc ordering (F232), mixed Bug
and applied-access hydration with UNAVAILABLE boundaries (F233), active-caller
unread isolation (F234), current-version read persistence (F235), repeated
read idempotency (F235I), stale-version rejection (F235C), and frozen
throughOccurredAt mark-all behavior (F236). Each mutation reads back the row
after reload.

- [ ] **Step 3: Run the service batch**

~~~powershell
$baseline = "6eb6f73840d7150598a993f8656d2b44e5b0cd4b"
node scripts/qa/run-idts110-new-cases.js --scope=MY_NOTIFICATIONS_SERVICE --baseline=$baseline --executor=Codex-agent-assisted --output=.tmp/idts-110/notification-service-results.json
node scripts/qa/test-my-notifications-service.js
~~~

Expected: seven case records and no result promoted from the broad contract
total. A failed local assertion is FAIL; unavailable integration is BLOCKED.

- [ ] **Step 4: Commit the service adapters**

~~~powershell
git add scripts/qa/test-my-notifications-service.js
git commit -m "test: add atomic My Notifications service cases"
~~~

Review checkpoint: verify no cross-recipient row is readable or mutable and no
raw access-audit details enter DTO or evidence.

### Task 6: Add the rendered UI-runtime harness and nine visual cases

**Files:**

- Modify: scripts/qa/test-my-notifications-shell.js
- Modify: scripts/qa/serve-my-notifications-ui.js
- Modify: scripts/qa/test-user-admin-workload.js
- Create: scripts/qa/run-idts110-ui-runtime.js
- Create: scripts/qa/test-idts110-ui-runtime.js

**Interfaces:**

- Programmatic prechecks use existing shell/workload runners and are not visual acceptance.
- run-idts110-ui-runtime.js --case=<key> --baseline=<sha> --executor=<identity> --url=<url> --output=<dir> launches Playwright, reaches the rendered state, captures one screenshot, and emits one atomic result.
- Visual cases are F224, F237, F238, F238E, F238L, F239, F239P, F239H, and F239D. Exactly eight belong to Notifications.

- [ ] **Step 1: Write the browser contract**

~~~js
const assert = require('node:assert/strict')
const visualKeys = new Set([
  'IDTS110-F224', 'IDTS110-F237', 'IDTS110-F238', 'IDTS110-F238E',
  'IDTS110-F238L', 'IDTS110-F239', 'IDTS110-F239P',
  'IDTS110-F239H', 'IDTS110-F239D'
])
assert.equal(visualKeys.size, 9)
assert.equal([...visualKeys].filter(key => key.startsWith('IDTS110-F23')).length, 8)
~~~

- [ ] **Step 2: Implement deterministic browser scenarios**

Use the local fixture/server with real SAPUI5 controls and DOM. A route
intercept may supply deterministic fixture payloads, but it must not replace
the rendered control with FakeControl. Use separate scenario names for
populated, empty, failed/retry, loading, visible-signal, visible-poll,
hidden-stop, destroy, and workload drill-down.

- [ ] **Step 3: Implement screenshot and console/error evidence**

Write one PNG per case, compute its SHA-256, record URL and viewport, and
collect sanitized console/network errors. Reject PASS when the screenshot is
missing, the rendered state is absent, or a credential/token/private endpoint
appears. Do not use an empty live inbox as populated-row proof.

- [ ] **Step 4: Run visual prechecks and browser cases**

~~~powershell
node scripts/qa/test-my-notifications-shell.js --idts110-case=IDTS110-F237 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted
node scripts/qa/test-user-admin-workload.js --idts110-case=IDTS110-F224 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted
node scripts/qa/run-idts110-ui-runtime.js --scope=VISUAL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --url=http://127.0.0.1:PORT/idtsbugmanagementui/index.html --output=.tmp/idts-110/ui-results.json
node scripts/qa/test-idts110-ui-runtime.js
~~~

Expected: one result per visual key. If browser control or authorized runtime
cannot start, preserve precheck evidence and emit BLOCKED with the exact
tool limitation.

- [ ] **Step 5: Commit the UI harness**

~~~powershell
git add scripts/qa/test-my-notifications-shell.js scripts/qa/serve-my-notifications-ui.js scripts/qa/test-user-admin-workload.js scripts/qa/run-idts110-ui-runtime.js scripts/qa/test-idts110-ui-runtime.js
git commit -m "test: add IDTS-110 rendered UI evidence harness"
~~~

Review checkpoint: inspect F237 populated row, empty state, and one
hidden/polling state. Confirm no source-only or FakeControl result is visual PASS.

### Task 7: Execute access-email and immediate-kick cases

**Files:**

- Modify: scripts/qa/test-user-access-notifications.js
- Modify: scripts/qa/test-user-onboarding-programmatic.js
- Modify: scripts/qa/test-email-immediate-kick.js
- Test: scripts/qa/run-idts110-new-cases.js

**Interfaces:**

- Access selectors: F240, F240R, F241.
- Invitation selectors: F243, F243M, F244, F245.
- Immediate-kick selectors: F246, F246R, F246B.
- All cases use isolated fixtures and injected senders. No real mail is sent.

- [ ] **Step 1: Add the selector contract**

~~~text
IDTS110-F240 IDTS110-F240R IDTS110-F241
IDTS110-F243 IDTS110-F243M IDTS110-F244 IDTS110-F245
IDTS110-F246 IDTS110-F246R IDTS110-F246B
~~~

- [ ] **Step 2: Implement one assertion per key**

Verify applied CHANGE_ROLE/REACTIVATE indexing versus REVOKE email-only
delivery (F240/F240R), invalid URL safe skip with no sender (F241), missing or
expired invitation skip (F243), token mismatch FAILED with bounded retry
(F243M), HTTPS fragment/security link construction (F244), cancelled
invitation no-send (F245), one post-commit kick (F246), duplicate kick
idempotency (F246R), and rollback with no provider work (F246B).

- [ ] **Step 3: Run the batch and focused suites**

~~~powershell
$baseline = "6eb6f73840d7150598a993f8656d2b44e5b0cd4b"
node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=$baseline --executor=Codex-agent-assisted --output=.tmp/idts-110/access-email-results.json
node scripts/qa/test-user-access-notifications.js
node scripts/qa/test-user-onboarding-programmatic.js
node scripts/qa/test-email-immediate-kick.js
~~~

Expected: ten atomic records and no SMTP/Brevo network calls. Provider
exception handling is a local injected failure result, not provider-live PASS.

- [ ] **Step 4: Commit the access-email adapters**

~~~powershell
git add scripts/qa/test-user-access-notifications.js scripts/qa/test-user-onboarding-programmatic.js scripts/qa/test-email-immediate-kick.js
git commit -m "test: add atomic access email cases"
~~~

Review checkpoint: inspect F243M, F246R, and F246B evidence for retry,
idempotency, and rollback truth.

### Task 8: Execute scheduled discovery and digest cases

**Files:**

- Modify: scripts/qa/test-my-notifications-scheduled.js
- Modify: scripts/qa/test-my-notifications-digest.js
- Test: scripts/qa/run-idts110-new-cases.js

**Interfaces:**

- Scheduled selectors: F247, F247S, F247SS, F248, F248C, F248N, F249, F249K, F249T.
- Digest selectors: F250, F250L, F250M, F250Q, F250R, F251, F251R, F252, F252R, F252P, F253.
- Each selector runs one isolated database transaction and emits one result.

- [ ] **Step 1: Add the selector contract**

~~~js
assert.equal(scheduledAtomicCases.size, 9)
assert.equal(digestAtomicCases.size, 11)
assert.equal([...scheduledAtomicCases, ...digestAtomicCases].includes('IDTS110-F242'), false)
~~~

- [ ] **Step 2: Implement scheduled assertions**

Cover Pending Assignment, four-hour Critical/Blocker SLA, 24-hour standard
SLA, overdue recipient safety and Closed exclusion, same-source idempotency,
new due-date source key, activation cutoff, ID-keyset paging, and cursor
rollback. Keep scheduler authorization and page transaction behavior explicit.

- [ ] **Step 3: Implement digest assertions**

Cover persona-scoped actionable snapshot, deterministic ordering, render limit
with full itemCount, allowlisted Bug/queue links, raw-field omission, one
recipient/date/type row, page-failure resume, inactive/changed-role/missing
Developer Profile send-time skips, and sanitized provider failure with bounded
retry and unchanged snapshot.

- [ ] **Step 4: Run the batch**

~~~powershell
$baseline = "6eb6f73840d7150598a993f8656d2b44e5b0cd4b"
node scripts/qa/run-idts110-new-cases.js --scope=BUG_EMAIL --baseline=$baseline --executor=Codex-agent-assisted --output=.tmp/idts-110/bug-email-results.json
node scripts/qa/test-my-notifications-scheduled.js
node scripts/qa/test-my-notifications-digest.js
~~~

Expected: 20 atomic records; no provider/live/BTP mutation. A locally injected
sender failure is recorded as FAILED, not successful provider delivery.

- [ ] **Step 5: Commit the scheduled/digest adapters**

~~~powershell
git add scripts/qa/test-my-notifications-scheduled.js scripts/qa/test-my-notifications-digest.js
git commit -m "test: add atomic scheduled and digest email cases"
~~~

Review checkpoint: inspect same-source versus new-cycle keys, cursor rollback,
persona revalidation, and sanitized failure result.

### Task 9: Generate case evidence and number-only mentor cards

**Files:**

- Modify: scripts/qa/generate-idts110-evidence.js
- Create: scripts/qa/generate-idts110-mentor-cards.js
- Create: scripts/qa/test-idts110-evidence-contract.js
- Generated candidate output: docs/pm/evidence/idts-110/unit/ and docs/pm/evidence/idts-110/cards/

**Interfaces:**

- Evidence input: 278 catalog rows, compact number map, existing 188 manifests, and the 90-case atomic result batch.
- Card input: only structured results and number map.
- Card output: cards/Case-001.png through cards/Case-278.png.

- [ ] **Step 1: Write the failing evidence contract**

~~~js
const assert = require('node:assert/strict')
const assertNoSecret = value => assert.doesNotMatch(JSON.stringify(value), /password|Bearer |api[-_ ]?key|postgresql:\/\//i)

for (const row of results.results) {
  assert.equal(row.assertionId, row.caseKey + '-A1')
  assert.notEqual(row.status, 'MAPPING_ONLY')
  assertNoSecret(row)
}
assert.equal(new Set(results.results.map(row => row.caseKey)).size, 90)
~~~

- [ ] **Step 2: Generate per-case manifests**

Extend generate-idts110-evidence.js with an atomic-results mode that writes
result.json and case-manifest.json under docs/pm/evidence/idts-110/unit/<key>/.
Require one case-specific result artifact for every new case, state artifacts
for persistence cases, and runtime PNG for UI cases. Preserve the existing
188 cases/ directory and do not overwrite historical manifests.

- [ ] **Step 3: Generate number-only cards**

The card renderer reads the result and map, writes one PNG per mentor number,
and displays only Case N, title, candidate status, evidence kind, test file,
source baseline, deploy SHA or N/A, execution window, evidence reference,
reviewStatus, and limitation. It must not display internal keys, source
proposal sequences, secrets, PII, undefined, or MAPPING_ONLY as PASS.

- [ ] **Step 4: Run evidence and card validation**

~~~powershell
node scripts/qa/generate-idts110-evidence.js --atomic-results=.tmp/idts-110/all-results.json --number-map=docs/qa/idts-110-case-number-map.json
node scripts/qa/generate-idts110-mentor-cards.js --catalog=docs/qa/idts-110-unit-test-catalog.json --results=.tmp/idts-110/all-results.json --number-map=docs/qa/idts-110-case-number-map.json --output=docs/pm/evidence/idts-110/cards
node scripts/qa/test-idts110-evidence-contract.js
~~~

Expected: 90 new manifests, 278 reader cards, one card per compact number,
zero orphan/missing image references, and no new status promotion.

- [ ] **Step 5: Commit evidence generators and selected evidence**

~~~powershell
git add scripts/qa/generate-idts110-evidence.js scripts/qa/generate-idts110-mentor-cards.js scripts/qa/test-idts110-evidence-contract.js docs/pm/evidence/idts-110/unit docs/pm/evidence/idts-110/cards
git commit -m "docs: generate IDTS-110 atomic evidence cards"
~~~

Review checkpoint: inspect cards for Case 1, Case 188, Case 189, Case 199,
Case 234, Case 241, and Case 278. Confirm no internal key is visible.

### Task 10: Generate a candidate workbook from the official Unit_Test.xlsx template

**Files:**

- Create: scripts/sap490/generate-idts110-unit-test-workbook.mjs
- Create: scripts/sap490/test-idts110-unit-test-workbook.mjs
- Create: docs/pm/evidence/idts-110/workbook-template-baseline.json
- Generated candidate only: docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx

**Interfaces:**

- Inputs: official Unit_Test.xlsx, 278 catalog rows, compact number map, all atomic results, unit evidence, and number-only cards.
- Output: one candidate XLSX with Cover, Histories, UT, Evidence sheets.
- Validator output: structural/content/style/evidence findings and baseline versus introduced OfficeCLI issues.

- [ ] **Step 1: Record the read-only template contract**

~~~powershell
officecli --version
officecli view "docs/sap490/templates/Deliverable_template/Unit_Test.xlsx" outline
officecli view "docs/sap490/templates/Deliverable_template/Unit_Test.xlsx" issues
~~~

Record sheet order, dimensions, merge ranges, row heights, column widths, print
areas, page setup, gridline state, defined names, validation, and the exact 15
authority issues in docs/pm/evidence/idts-110/workbook-template-baseline.json.

- [ ] **Step 2: Load the Spreadsheet runtime and mark the edit**

Use `codex_app.load_workspace_dependencies` to resolve the bundled
`@oai/artifact-tool` runtime. Read its API quick start, style guidelines, and
existing-file edit workflow completely. Before the first authoring command,
run exactly once:

~~~powershell
node container_tools/mark_artifact_operation_started.mjs --operation-kind edit --expected-output-count 1 --output-format xlsx
~~~

Create only a task-local dependency junction to the returned runtime. Do not
install a package or modify any dependency directory or lockfile.

- [ ] **Step 3: Write the failing workbook validator**

~~~js
assert.deepEqual(sheetNames, ['Cover', 'Histories', 'UT', 'Evidence'])
assert.deepEqual(visibleCaseNumbers, Array.from({ length: 278 }, (_, i) => i + 1))
assert.equal(new Set(visibleCaseNumbers).size, 278)
assert.equal(internalKeys.some(key => visibleText.includes(key)), false)
assert.deepEqual(evidenceCaseNumbers, visibleCaseNumbers)
assert.deepEqual(introducedOfficeCliIssues, [])
~~~

Also check one row per case, card/runtime hyperlink presence, no orphan
evidence section, no formula error, no unauthorized Vietnamese submission text,
no AutoFilter, no broken new hyperlink, and truthful result labels.

- [ ] **Step 4: Implement template-first row cloning**

Load the official template with `SpreadsheetFile.importXlsx`, then clone the official UT row-8 style and
its B:D, E:AW, AX:BC, BD:BI, BJ:BK, and BL:BR merges for rows 8 through 285.
Populate only:

~~~text
UT B = mentor number
UT E = requirement/function, precondition, input, and numbered steps
UT Y = expected result plus actual result and limitation
UT AX = executor
UT BD = execution timestamp
UT BJ = Candidate PASS / Passed / Failed / Blocked / Held / Mapping Only / Not Run
UT BL = hyperlink label Case N and link to the number-only card
Evidence A:K = EVD-N, Case N, run ID, test file plus reader-facing assertion label,
  source baseline, deploy SHA/N/A,
  environment/executor/time, result, actual, limitation, artifact hyperlink
~~~

The workbook must not display a raw `--idts110-case=<internal-key>` command.
The complete command remains in repository-only `result.json` for auditability.

Fill Cover and Histories with IDTS-SAP490-UNIT, IDTS-110 atomic execution,
version v0.5 candidate, exact source/approval metadata, creation date, and
creator. Leave approver/reviewer fields blank unless a human later supplies
them. Preserve official style and layout; do not globally autofit, restyle,
unmerge, remove defined names, or disable gridlines.

- [ ] **Step 5: Generate the candidate**

~~~powershell
node scripts/sap490/generate-idts110-unit-test-workbook.mjs --template=docs/sap490/templates/Deliverable_template/Unit_Test.xlsx --catalog=docs/qa/idts-110-unit-test-catalog.json --number-map=docs/qa/idts-110-case-number-map.json --results=.tmp/idts-110/all-results.json --evidence-root=docs/pm/evidence/idts-110 --output=docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx
~~~

Expected: the supplied 203-case workbook and existing v0.4 workbook are not
read as inputs, and only the candidate output is created.

- [ ] **Step 6: Run structural, OfficeCLI, fidelity, and render checks**

~~~powershell
node scripts/sap490/test-idts110-unit-test-workbook.mjs --template=docs/sap490/templates/Deliverable_template/Unit_Test.xlsx --candidate=docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx --baseline=docs/pm/evidence/idts-110/workbook-template-baseline.json
officecli view "docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx" issues
officecli validate "docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx"
python .agents/skills/idts-sap490-xlsx-fidelity/scripts/audit_xlsx_fidelity.py validate --reference docs/sap490/templates/Deliverable_template/Unit_Test.xlsx --candidate docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx --policy .tmp/idts-110/unit-test-policy.json
soffice --headless --convert-to pdf --outdir .tmp/idts-110/render docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx
git diff --check
~~~

Expected: candidate validator PASS, OfficeCLI schema validation with no
introduced issue, fidelity PASS, PDF generated, and no new page/layout drift.
Unchanged authority-template warnings are reported, not deleted.

- [ ] **Step 7: Commit the candidate generator and candidate workbook**

~~~powershell
git add scripts/sap490/generate-idts110-unit-test-workbook.mjs scripts/sap490/test-idts110-unit-test-workbook.mjs docs/pm/evidence/idts-110/workbook-template-baseline.json docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx
git commit -m "docs: generate IDTS-110 Unit Test workbook candidate"
~~~

Review checkpoint: inspect Cover, first and last UT rows, one blocked row, one
mapping-only legacy row, one new Candidate PASS row, and Evidence at normal zoom
and in the PDF render.

### Task 11: Final review, candidate report, and release handoff

**Files:**

- Create: scripts/qa/generate-idts110-final-report.js
- Create: docs/pm/evidence/idts-110/final-execution-report.md
- Read-only review: all task outputs, exact Git head, and current worktree status

**Interfaces:**

- Report input: catalog, number map, all atomic results, evidence manifests, card hashes, workbook hash, validator output, and OfficeCLI/fidelity results.
- Report output: candidate-only status with exact base/head, counts, hashes, review findings, limitations, and unchanged external-state statement.

- [ ] **Step 1: Write the failing report contract**

~~~js
assert.equal(report.catalog.total, 278)
assert.equal(report.newResults.caseCount, 90)
assert.deepEqual(report.userAdministration.adapterCounts, {
  existingExact: 11,
  addToExisting: 33,
  newRoleRunner: 1
})
assert.equal(report.notifications.caseCount, 45)
assert.equal(report.notifications.visualCaseCount, 8)
assert.equal(report.externalMutations.length, 0)
~~~

- [ ] **Step 2: Run one independent review**

Review the full diff and generated candidate artifacts for Critical, Major, and
Important findings. Verify exact source base 6eb6f73840d7150598a993f8656d2b44e5b0cd4b,
PR #388 reference, number-map bijection, status truth, evidence links,
template baseline warnings, and no secret/PII. Resolve every finding before
report generation; do not self-approve the workbook.

- [ ] **Step 3: Run the final repository gates**

~~~powershell
node scripts/qa/test-idts110-extension-manifest.js
node scripts/qa/test-idts110-extended-catalog.js
node scripts/qa/test-idts110-atomic-runner.js
node scripts/qa/test-idts110-evidence-contract.js
node scripts/sap490/test-idts110-unit-test-workbook.mjs --template=docs/sap490/templates/Deliverable_template/Unit_Test.xlsx --candidate=docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx --baseline=docs/pm/evidence/idts-110/workbook-template-baseline.json
node scripts/qa/generate-idts110-final-report.js --catalog=docs/qa/idts-110-unit-test-catalog.json --number-map=docs/qa/idts-110-case-number-map.json --results=.tmp/idts-110/all-results.json --workbook=docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx --output=docs/pm/evidence/idts-110/final-execution-report.md
node scripts/qa/secret-scan.js
node scripts/qa/check-agent-rules.js
npx ai-devkit@latest lint --json
git diff --check
git status --short --branch
~~~

Expected: every required gate exits 0; the report says candidate review
pending, not final PASS, merge, deploy, Drive replacement, or Jira completion.

- [ ] **Step 4: Commit the final report only after review**

~~~powershell
git add scripts/qa/generate-idts110-final-report.js docs/pm/evidence/idts-110/final-execution-report.md
git commit -m "docs: publish IDTS-110 execution candidate report"
~~~

- [ ] **Step 5: Stop at the approved handoff boundary**

Report exact final commit SHA, candidate workbook SHA-256, result totals, known
blockers, and evidence paths to DonHV. Do not push, merge, deploy, update Drive,
update Jira, send email, mutate BTP/HANA, or remove the worktree as part of this
plan.
