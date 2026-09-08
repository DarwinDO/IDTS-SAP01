# IDTS-110 Atomic Execution and Workbook Design

## Decision status

This design is approved by DonHV on 2026-09-05 for continuous Subagent-Driven execution through the
candidate final report. It is an execution and artifact design, not execution
evidence and not approval to merge, deploy, mutate BTP/HANA, send mail, or
replace a Drive file.

The implementation starts from the exact worktree base
6eb6f73840d7150598a993f8656d2b44e5b0cd4b, which is the merge commit of PR
#388 and the current origin/dev head at planning time. DonHV's explicit chat
approval authorizes the 278-case catalog definition and local/candidate
execution workflow. It does not pre-approve any execution result as PASS.

## Authority and current truth

| Authority | Exact value | Use |
| --- | --- | --- |
| Execution source base | 6eb6f73840d7150598a993f8656d2b44e5b0cd4b | Every new source claim, local run, result record, and candidate workbook metadata field. |
| Approval/reference | PR #388 merge at 6eb6f73840d7150598a993f8656d2b44e5b0cd4b | Binds the approved gap package to the execution plan; it is not a human sign-off substitute. |
| Human catalog approval | DonHV, 2026-09-05, explicit approval in the coordinating Codex task | Authorizes the 278 definitions and execution planning; individual result review remains pending. |
| Gap-package analysis base | 9d5aad699662bde65a747de4c0d631678de639e4 | Historical input base recorded by the approved proposal, matrix, and feature inventory. |
| Existing catalog baseline | bc0c47e522ae208384d4b23dda21535dcc683683 | Historical generator baseline retained for the 188 definitions; it must not be confused with the current execution source base. |
| Approved gap input | docs/pm/evidence/idts-110/catalog-gap-proposal-input.json | Fifteen supplied workbook proposals, source numbers 189–203. |
| Approved gap matrix | docs/pm/evidence/idts-110/catalog-gap-matrix.json | Seven KEEP, three REWRITE, three MERGE, and two DROP dispositions. |
| Approved feature inventory | docs/pm/evidence/idts-110/new-feature-coverage-gaps.json | Eighty implemented-but-missing atomic candidates in seven feature families. |
| Approved report | docs/pm/evidence/idts-110/catalog-gap-review.md | Human-readable reconciliation and source-backed scope. |
| Approved catalog input | docs/qa/idts-110-unit-test-catalog.json | The current 188 definitions and their stable internal case keys. |
| Official local workbook template | docs/sap490/templates/Deliverable_template/Unit_Test.xlsx | Read-only structural and visual authority for the candidate workbook. |
| Mentor briefing | docs/sap490/mentor-review-technical-spec-and-test-requirements.vi.md | Per-case actual-result, image, ownership, English-only, and approval rules. |

The current 188-case evidence package remains separate from the new execution
package. Its truthful review state is:

| Existing 188 layer | Count | Meaning |
| --- | ---: | --- |
| Candidate atomic PASS | 40 | Existing candidate evidence only; pending DonHV review and not an official PASS. |
| Mapping-only candidate | 135 | Suite-to-case traceability; never an atomic PASS. |
| BTP/environment blocked | 13 | No authorized CF/BTP target or live integration fixture; not a product failure. |
| Candidate FAIL | 0 | No existing candidate failure is being invented by this plan. |

All 188 current case manifests remain pending review. Their existing evidence
is not silently rewritten, promoted, or replaced by the 90 new results.

The mandatory OfficeCLI preflight was run before this planning work:

~~~text
officecli --version
1.0.147
~~~

OfficeCLI describes itself as an Office document CLI for DOCX, XLSX, and PPTX;
it does not author repository Markdown. Repository-native patching is therefore
the correct authoring path for this design and plan. Read-only inspection of the
official Unit_Test.xlsx template found four sheets in this order:
Cover, Histories, UT, Evidence. It also found fifteen authority-template
issues: thirteen broken defined names with #REF! bodies and two Histories
overflow warnings. The candidate process records this exact baseline and fails
on newly introduced issues; it does not silently repair or delete authority
template objects.

## Scope

The execution package covers:

1. A deterministic extension of the approved 188 definitions with ten retained
   Task 2 rows and eighty Task 3 feature candidates.
2. A compact visible mentor map numbered 1 through 278 while technical case
   keys remain repository-only.
3. One atomic result record per new case, using existing runners through
   case-selectable adapters wherever possible.
4. User Administration execution in the approved 45-case slice:
   11 existing exact adapter assertions, 33 additions to existing runners, and
   one new role-contract runner.
5. Notification execution for all 45 new Notification, access-email, and
   Bug-email cases. Eight Notification cases require rendered UI evidence.
6. One additional rendered UI case for the User Administration workload
   drill-down, making nine visual cases across the new 90-case package.
7. Structured case evidence, generated mentor cards, and a candidate Unit Test
   workbook made by copying the official Unit_Test.xlsx template.
8. Deterministic structural, content, security, evidence, OfficeCLI, and
   cross-render validation followed by one independent review and a final
   candidate report.

The package does not include:

- Product source, CDS model, service behavior, UI behavior, package manifests,
  lockfiles, seed data, HANA schema/data, deployment, or runtime configuration
  changes.
- Provider-live, email-send, SAP identity, Role Collection, S3, Job Scheduler,
  BTP, or HANA mutation without a separately authorized and disposable fixture.
- Reuse of the supplied 203-case workbook as a data source or repair of that
  workbook.
- Drive, Jira, branch merge, release, or official workbook replacement.
- A PASS claim from a suite exit code, a static UI check, a generated card, an
  empty-state screenshot, or a command-only link.
- A new test script for every case. The implementation uses one shared result
  helper, case-selectable existing runners, one role runner, one UI runner, one
  evidence/card path, and one workbook generator/validator.

## Catalog and numbering model

The final candidate catalog has exactly 278 definitions:

| Ordered section | Source rows/keys | Compact mentor numbers | Initial state |
| --- | --- | ---: | --- |
| Existing catalog | Existing 188 case definitions in current array order | 1–188 | Preserve existing catalog definition and execution truth; do not import result status into the definition. |
| Retained Task 2 | IDTS110-P189, P190, P191, P194, P195, P196, P197, P200, P202, P203 in matrix order | 189–198 | NOT_RUN |
| Task 3 USER_ACCESS | IDTS110-F204 through F216 and F216R in inventory order | 199–213 | NOT_RUN |
| Task 3 USER_PROFILE | IDTS110-F217, F218, F219, F220, F220D, F220R, F220N | 214–220 | NOT_RUN |
| Task 3 DEVELOPER_WORKLOAD | IDTS110-F221, F222, F223, F224 | 221–224 | NOT_RUN |
| Task 3 BUSINESS_CATALOGS | IDTS110-F225, F226, F227, F228, F228E, F229, F230, F231, F231R | 225–233 | NOT_RUN |
| Task 3 MY_NOTIFICATIONS | IDTS110-F232, F233, F234, F235, F235I, F235C, F236, F237, F238, F238E, F238L, F239, F239P, F239H, F239D | 234–248 | NOT_RUN |
| Task 3 ACCESS_EMAIL | IDTS110-F240, F240R, F241, F243, F243M, F244, F245, F246, F246R, F246B | 249–258 | NOT_RUN |
| Task 3 BUG_EMAIL | IDTS110-F247, F247S, F247SS, F248, F248C, F248N, F249, F249K, F249T, F250, F250L, F250M, F250Q, F250R, F251, F251R, F252, F252R, F252P, F253 | 259–278 | NOT_RUN |

Source proposal sequences remain available in repository-only metadata for
traceability. They are not the final visible numbers. For example,
IDTS110-F204 retains source sequence 204 but is displayed as Case 199, while
IDTS110-F253 retains source sequence 283 but is displayed as Case 278.
MERGE and DROP rows do not receive a catalog entry or a visible number.

The number map is generated, never hand-maintained:

~~~text
existing.cases.map((caseDefinition, index) => {
  mentorNumber: index + 1
})
retainedRows.map((row, index) => {
  mentorNumber: 189 + index
})
featureRows.map((row, index) => {
  mentorNumber: 199 + index
})
~~~

The validator requires a contiguous 1..278 sequence, unique internal keys,
unique source references for new rows, stable existing-case order, and a
bijective number-to-key map. The workbook and mentor cards receive only
mentorNumber and the reader-facing title. Internal keys, source proposal
sequences, and repository-only evidence paths never appear in visible text.

## Extension definition contract

The implementation adds one structured extension input,
docs/qa/idts-110-extension-cases.json, plus the approval receipt
docs/pm/evidence/idts-110/catalog-approval.json.

Every retained or feature row contains:

- internalCaseKey, candidateOrigin, sourceProposalSequence, and mentorNumber;
- domain, title, objective, classification, priority, testLevel, environment,
  requirementIds, roles, coverage, preconditions, input, steps, and
  expectedResult;
- sourceTrace entries with exact file and symbol values;
- plannedTestFile, assertionId, acceptanceMode, roleBoundary,
  executionBoundary, and evidenceRequirements;
- candidateStatus set to NOT_RUN and reviewStatus set to
  PENDING_DONHV_REVIEW.

The ten retained rows are complete definitions derived from the gap matrix:
P189 and P190 are Developer Profile reads; P191 is the role-boundary matrix;
P194–P197 cover catalog creation/authorization/parent-boundary behavior; P200
is the due-date overdue boundary; P202 is Developer workload filter isolation;
P203 is the PM-only status-metrics boundary. The three MERGE rows and two DROP
rows are retained only in the existing gap report and never enter the
extension file.

The eighty feature rows are copied from the approved feature inventory and
completed with explicit test-level, input, expected-result, role, and evidence
fields. No generic default may turn a missing requirement or source trace into
a valid case. The extension validator rejects an empty requirement, missing
source symbol, duplicate internal key, duplicate mentor number, missing
planned assertion, or candidate status other than NOT_RUN.

## Atomic result contract

The result record is the execution authority. A card or workbook is derived
from it and cannot change its status.

The shared JavaScript helper exposes these exact interfaces:

~~~js
readAtomicOptions(argv) -> {
  caseKey: string,
  baselineSha: string,
  executor: string,
  mode: 'local' | 'ui-runtime' | 'btp',
  outputPath: string | null
}

runAtomicCase({
  definition,
  assertionId,
  baselineSha,
  executor,
  execute: async () => {
    beforeState: object | null,
    afterState: object | null,
    reloadState: object | null,
    runtimeEvidence: object | null
  }
}) -> Promise<AtomicResult>

writeAtomicBatch({
  runId,
  sourceBaselineSha,
  catalogSha,
  approvalReference,
  results
}, outputPath) -> void
~~~

Each final-result adapter accepts:

~~~text
node scripts/qa/<runner>.js --idts110-case=<internalCaseKey> --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=<actual-executor> --output=<ignored-or-selected-result-path>
~~~

Without the selector, an existing runner keeps its current broad regression
behavior. With the selector, it executes one named assertion and emits exactly
one machine-readable line:

~~~text
IDTS110_ATOMIC_RESULT {"schemaVersion":"1.0","caseKey":"...","assertionId":"...","status":"PASS|FAIL|BLOCKED","..."}
~~~

The orchestrator rejects missing markers, more than one marker, a mismatched
case key, an unknown assertion ID, a baseline mismatch, or a suite-only result.

The result object has these required fields:

~~~json
{
  "schemaVersion": "1.0",
  "jiraKey": "IDTS-110",
  "caseKey": "IDTS110-F232",
  "mentorNumber": 234,
  "assertionId": "IDTS110-F232-A1",
  "title": "My Notifications search is caller-scoped and stably ordered",
  "status": "PASS",
  "evidenceKind": "LOCAL_ATOMIC",
  "executor": "explicit runtime identity",
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "sourceBaselineSha": "6eb6f73840d7150598a993f8656d2b44e5b0cd4b",
  "deployedSha": null,
  "testFile": "scripts/qa/test-my-notifications-service.js",
  "testCommand": "node scripts/qa/test-my-notifications-service.js --idts110-case=IDTS110-F232 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=...",
  "preconditions": "case definition preconditions",
  "input": "case definition input",
  "expectedResult": "case definition expected result",
  "actualResult": "sanitized observed outcome",
  "sourceTrace": [{"file": "srv/notification/inbox.js", "symbol": "searchMyNotifications"}],
  "beforeState": {"sanitized": "snapshot or null"},
  "afterState": {"sanitized": "snapshot or null"},
  "reloadState": {"sanitized": "snapshot or null"},
  "runtimeEvidence": null,
  "evidenceIds": ["IDTS110-F232-RESULT"],
  "limitation": "No provider or live BTP state used.",
  "reviewStatus": "PENDING_DONHV_REVIEW"
}
~~~

The actual fields use real values; ISO-8601 and explicit runtime identity are
schema descriptions, not strings written into a result.

Allowed result statuses are PASS, FAIL, BLOCKED, HELD, and NOT_RUN. MAPPING_ONLY
is forbidden for new rows. A new PASS requires the selected assertion to run,
the expected result to match, required persistence/reload state to match, and
the evidence contract to be complete. A UI visual case additionally requires a
browser/runtime screenshot. A BTP or provider-live result without an authorized
fixture is BLOCKED, not PASS. A generated card can never turn BLOCKED,
MAPPING_ONLY, or NOT_RUN into PASS.

State snapshots are sanitized summaries: row counts, stable fixture IDs,
status codes, safe result codes, and hashes of binary content are allowed.
Passwords, tokens, cookies, provider payloads, database URLs, private
endpoints, full private emails, raw SQL, and stack traces are removed before
serialization. Any result containing undefined, a secret pattern, or
unresolved placeholder text is rejected.

## Execution topology

### Existing 188 baseline

The current local-exact result and local-primary mapping result remain separate:

- Local exact runner output remains 40 case-level candidate results, with the
  two static attachment controls blocked for lack of rendered runtime proof.
- Local-primary output remains 135 MAPPING_ONLY_CANDIDATE records and zero
  failed mappings. It is not passed into the new atomic result path.
- The thirteen BTP-required cases remain environment BLOCKED until a separately
  authorized target, fixture, and rollback plan exist.
- Existing cards/manifests retain their historical evidence baseline and review
  status. A new number map may create reader-facing cards, but it must preserve
  the historical status label and limitation.

### User Administration slice

The 45 new User Administration-related execution rows are:

- Retained Task 2: P189, P190, P191, P194, P195, P196, P197, P200, P202,
  P203.
- Feature additions: F204–F238 in the approved inventory, including the
  suffixed keys F210S, F216R, F220D, F220R, F220N, F228E, and F231R.

The adapter ledger has the audit-approved accounting:

| Adapter class | Count | Exact rows |
| --- | ---: | --- |
| Existing exact | 11 | F212, F213, F214, F219, F220D, F220R, F220N, P202, F221, F223, F224. |
| Add to existing | 33 | P189, P190, P194, P195, P196, P197, P200, P203, F204–F211, F210S, F215, F216, F216R, F217, F218, F220, F222, and F225–F231R. |
| New role runner | 1 | P191, the all-allowed-roles plus UserAdmin-overlay request-boundary matrix. |

The eleven existing runner files used by this slice are:

1. scripts/qa/test-user-onboarding-contract.js
2. scripts/qa/test-user-onboarding-programmatic.js
3. scripts/qa/test-user-admin-access-lifecycle.js
4. scripts/qa/test-existing-user-identity-link.js
5. scripts/qa/test-user-admin-active-users.js
6. scripts/qa/test-user-admin-developer-profile-actions.js
7. scripts/qa/test-user-admin-developer-profile.js
8. scripts/qa/test-developer-workload-programmatic.js
9. scripts/qa/test-user-admin-workload.js
10. scripts/qa/test-user-admin-catalogs.js
11. scripts/qa/test-pm-monitoring-programmatic.js

The one new runner is scripts/qa/test-user-admin-role-contract.js. The adapter
ledger is validated independently of file count so that the 11/33/1 audit
conclusion cannot drift when one runner owns several cases.

### Notification slice

All 45 new Notification, access-email, and Bug-email rows require one atomic
result:

| Existing runner | Case keys |
| --- | --- |
| test-my-notifications-service.js | F232, F233, F234, F235, F235I, F235C, F236 |
| test-my-notifications-shell.js | F237, F238, F238E, F238L, F239, F239P, F239H, F239D |
| test-user-access-notifications.js | F240, F240R, F241 |
| test-user-onboarding-programmatic.js | F243, F243M, F244, F245 |
| test-email-immediate-kick.js | F246, F246R, F246B |
| test-my-notifications-scheduled.js | F247, F247S, F247SS, F248, F248C, F248N, F249, F249K, F249T |
| test-my-notifications-digest.js | F250, F250L, F250M, F250Q, F250R, F251, F251R, F252, F252R, F252P, F253 |

There is deliberately no F242. The implementation must not invent a case to
make a numerical sequence look continuous.

F224 first emits a programmatic precheck record only; its authoritative atomic
result is emitted by the UI-runtime lane. This prevents duplicate final results.

The eight Notification UI visual rows are F237, F238, F238E, F238L, F239,
F239P, F239H, and F239D. The remaining 37 Notification rows use local
CAP/service fixtures or injected sender failures and do not claim browser
appearance. F224 is the ninth new visual row and belongs to the User
Administration workload drill-down.

## UI-runtime acceptance

The single browser runner is
scripts/qa/run-idts110-ui-runtime.js. It uses the installed Playwright package
and the existing local fixture/server path. It runs one case at a time and
accepts an explicit case key, baseline, executor, URL, and output directory.
The runner must load real SAPUI5 controls and the rendered application DOM; a
FakeControl test, source regex, or controller-only assertion is a precheck
only.

For F224, the screenshot must show the rendered Developer Workload drill-down
with non-Closed filtering, the technical assignee/current action owner
distinction, and only valid deep links. For F237, the populated row must show
bugNumber — bugTitle, unread state, and timestamp without an icon,
description region, or horizontal scrolling. F238, F238E, and F238L capture
empty, error/retry, and loading states. F239, F239P, F239H, and F239D capture
visible-change refresh, visible polling, hidden stop, and teardown behavior.

A browser case can be PASS only when:

1. The programmatic/native-control precheck passes.
2. The real rendered state is reached in the browser.
3. At least one case-specific screenshot is written and hash-recorded.
4. The screenshot contains no credential, token, private endpoint, or
   fabricated live-data claim.
5. The URL/runtime baseline and limitation are recorded.

If the browser cannot start, the result is BLOCKED with the precheck evidence
and an explicit browser-control limitation. An empty live inbox is evidence of
an empty state only; it is not substituted for a populated-row claim.

## Evidence and mentor-card design

Evidence is stored under:

~~~text
docs/pm/evidence/idts-110/unit/<internal-case-key>/
~~~

Each new case package contains:

- result.json with the exact atomic result;
- case-manifest.json with baseline, executor, expected, actual, assertion ID,
  review status, and sanitized evidence references;
- result.png or runtime.png, as appropriate;
- before-database.png, after-database.png, and reload-readback.png when the
  definition requires persistence;
- sanitized HTTP/provider/platform readback only when the case's level requires
  it and an authorized fixture exists.

Generated cards are stored under:

~~~text
docs/pm/evidence/idts-110/cards/Case-001.png ... Case-278.png
~~~

The card generator consumes only result records and the number map. It writes
Case N, title, candidate status, evidence kind, test file, source baseline,
deploy baseline when applicable, execution window, evidence references, review
status, and limitation. It never writes an internal key, raw selector command, source proposal
number, stale undefined value, secret, PII, or a PASS label for mapping-only
evidence.

The 188 historical cards are either retained in their existing repository-only
paths or regenerated into number-only reader cards. Regeneration must preserve
their original evidence baseline as historical metadata and retain the
candidate/mapping-only/blocked distinction. It cannot overwrite the original
execution record.

## Candidate workbook design

The workbook generator is
scripts/sap490/generate-idts110-unit-test-workbook.mjs. It loads
docs/sap490/templates/Deliverable_template/Unit_Test.xlsx with the bundled
`@oai/artifact-tool` and exports a candidate-only
output such as:

~~~text
docs/sap490/generated/Unit_Test_IDTS_SAP01_en_v0.5_candidate.xlsx
~~~

It does not read the supplied 203-case workbook, overwrite the official
template, overwrite the existing v0.4 artifact, or write Drive.

The generator preserves:

- Sheet names and order: Cover, Histories, UT, Evidence.
- Template merges, dimensions, fonts, fills, borders, alignments, validations,
  print areas, landscape setup, gridline visibility, and page scaling.
- The thirteen broken defined-name issues and two Histories overflow warnings
  as an authority baseline unless a separately approved template repair is
  provided. It records these issues in the candidate manifest and fails on any
  newly introduced issue.
- Official English-only labels and the existing Unit Test section geometry.

The generated visible fields are:

| Sheet | Visible content |
| --- | --- |
| Cover | Unit Test, IDTS module/function, version, creation/update date, creator, and blank approval fields until a human fills them. |
| Histories | Candidate v0.5 description, exact source/approval metadata, date, and author; this is workbook change history, not runtime history. |
| UT | B: mentor number; E: requirement/function, precondition, input, and steps; Y: expected and actual result; AX: executor; BD: execution date; BJ: truthful result; BL: hyperlink to the number-only card. |
| Evidence | One row per case with EVD-001 through EVD-278, Case number, run ID, exact command, source baseline, deploy SHA or N/A, environment/executor/time, result, actual, limitation, and card/runtime artifact hyperlink. |

The technical case key may exist in the repository-only structured result and
manifest, but no workbook cell, card, hyperlink label, or image caption exposes
it. The workbook result value is:

- Candidate PASS for an executed result pending DonHV review;
- Passed only after the case has an accepted atomic result and human review;
- Failed for an executed failed assertion;
- Blocked for an environment or fixture blocker;
- Held for a review hold;
- Mapping Only for the existing 135 mapping rows;
- Not Run for the remaining unexecuted rows.

No new row may be rendered as Passed merely because its runner exited zero.

The generator writes one cloned official data-row block per case, beginning at
UT row 8, and shifts the official B:D, E:AW, AX:BC, BD:BI, BJ:BK, and BL:BR
merges without global autofit or restyling. Evidence rows are styled from the
template-compatible review row and have no worksheet AutoFilter. Any case
that cannot fit without changing the template geometry stops generation and
requires a design decision.

## Validation and release boundary

The candidate gate has independent layers:

1. Extension and number-map contracts verify 10 retained plus 80 feature rows,
   compact 1..278 numbering, source traces, and no status import.
2. Atomic-result contract verifies one result per new case, one assertion ID,
   exact baseline, truthful status, complete evidence, and no mapping-only
   promotion.
3. Adapter checks verify the User Administration 11/33/1 ledger and all
   Notification 45 rows, including eight UI visual rows.
4. Evidence/card validation verifies one manifest and one reader card per case,
   image/hash existence, sanitized text, and no orphan or stale artifact.
5. Workbook validation verifies sheets, count, row order, visible numbering,
   no internal keys in visible cells, truthful result mapping, hyperlinks,
   formulas, merges, styles, defined-name baseline, print setup, and no new
   OfficeCLI issues.
6. The SAP490 fidelity validator compares the candidate to the frozen official
   template and reports baseline versus introduced warnings.
7. LibreOffice PDF render and OfficeCLI screenshot/text inspection cover every
   sheet at normal review scale. Excel interactive appearance remains a human
   review item when the local Excel surface is available.
8. One independent review must find zero Critical, Major, and Important
   findings before the candidate report is emitted.

Provider-live, BTP, and external-service claims remain BLOCKED without all of:
an authorized target, explicit allowlist, disposable or reversible fixture,
frozen source/deploy SHA, sanitized readback, and DonHV approval for any
mutation. No local mock, deterministic fallback, or provider-error test is
renamed primary-provider PASS.

The final artifact is a candidate report with exact source base, catalog/hash,
result totals, evidence/card/workbook hashes, validation output, known
baseline limitations, and remaining blockers. It ends at DonHV review and
candidate release; it does not merge, deploy, upload, or self-approve.

## Acceptance criteria

The plan is implemented only when:

- The catalog generator produces 278 definitions from the frozen 188 catalog,
  10 retained rows, and 80 feature rows, with compact visible numbers 1..278.
- All 90 new rows start NOT_RUN and receive one explicit assertion ID before
  execution.
- User Administration reports exactly 45 rows with adapter accounting 11
  existing exact, 33 additions, and one new role runner.
- Notifications reports exactly 45 atomic result records, with exactly eight
  rendered Notification UI cases plus the separate F224 workload screenshot.
- Existing 40/135/13 truth remains visibly distinct and no mapping-only or
  BTP-blocked row becomes PASS.
- Every executed new PASS has case-specific structured evidence; every UI
  visual PASS has a browser/runtime screenshot; blocked provider/BTP rows have
  truthful blockers.
- The candidate workbook is generated from the official template, contains
  278 visible sequential cases, contains no internal key in visible content,
  and passes all candidate validators with no newly introduced template issue.
- The final report records exact base/head, commands, counts, hashes, review
  result, known limitations, and the fact that no external state changed.
