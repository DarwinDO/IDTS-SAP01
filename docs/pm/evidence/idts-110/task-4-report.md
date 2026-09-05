# IDTS-110 Task 4 report — User Administration atomic execution

## Scope and source boundary

- Task: integrate the retained User Administration programmatic selectors and
  the approved User Administration feature-family selectors into the atomic
  result protocol.
- Parent/source starting head: `fb23f4aa06d2cec28200239ae6f8af10cc843fc7`.
- Required execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Protocol ruling commit: `e69cb118a698e1d1a71a45939dd6750a7cf24cf5`.
- User Administration adapter commit: `4afa4cf7248872a4d62aee53c6dd99ed19aa8d87`.
- The temporary orchestrator output is `.tmp/idts-110/user-admin-results.json`
  and is ignored; it is not committed.
- No product source, catalog, workbook/template, database/schema/seed,
  dependency, BTP/HANA, provider, email, Drive, Jira, or other external state
  was changed.

## RED → GREEN evidence

### Protocol RED

The Task 3 breaker tests were extended before the minimal protocol fix. The
first run stopped at the local-definition evidence binding gap:

```text
node scripts/qa/test-idts110-atomic-runner.js
AssertionError: runtime deployed SHA requires authorizedFixture=true
```

The RED coverage also included an indexed PNG without `PLTE`, an unknown
critical PNG chunk, and a forged local marker carrying BTP evidence. These
cases proved that a local runner could not self-label external evidence and
that the PNG proof parser needed the two additional structural checks.

### Adapter RED

Before the catalog-family corrections, the selected User Administration
orchestrator run produced only 13 PASS records, 31 no-marker FAIL records, and
one F224 BLOCKED record. The orchestrator therefore rejected suite-only exits;
no broad suite result was promoted to PASS. After the coherent adapter family
was completed, the same run produced the result counts below.

### GREEN

The protocol contract is green:

```text
node scripts/qa/test-idts110-atomic-runner.js
IDTS-110 atomic runner contract PASS: marker, schema, sanitization, status, batch, and orchestrator continuation.
```

The protocol ruling now requires indexed PNG `PLTE`, rejects unknown critical
PNG chunks, and derives `evidenceKind` and authorization from the case
definition. LOCAL cases cannot carry BTP/provider evidence or a deployed SHA;
visual cases still require UI-runtime screenshot evidence; external evidence
is available only to an approved external definition.

## Implemented atomic selectors

Each selector accepts the existing explicit baseline/executor options, runs one
case through `runAtomicCase` with assertion ID `<caseKey>-A1`, uses an isolated
fixture or pure contract fixture, emits one case-bound marker, and preserves
the runner's no-argument regression path.

| Runner | Implemented keys | Evidence boundary |
| --- | --- | --- |
| `test-user-admin-developer-profile-actions.js` | P189, P190, F219 | isolated SQLite read/update and reload assertions |
| `test-user-admin-role-contract.js` | P191 | pure role-boundary checks; no persistence mutation |
| `test-user-admin-catalogs.js` | P194, P195, P196, P197, F225, F226, F227, F228, F228E, F229, F230, F231, F231R | isolated SQLite catalog authorization, identity, ETag, impact, and persistence checks |
| `test-developer-workload-programmatic.js` | P202, F221, F223 | isolated SQLite workload/readiness/filter checks |
| `test-user-admin-access-lifecycle.js` | F212, F213 | isolated SQLite suspend/reactivate and audit/session checks |
| `test-existing-user-identity-link.js` | F214 | existing exact identity-link assertion with isolated fixture/readback |
| `test-user-admin-developer-profile.js` | F220D, F220R, F220N | pure profile duplicate/role-boundary assertions |
| `test-user-admin-workload.js` | F224 precheck only | programmatic/native-control precheck; UI result remains Task 6-owned |

The selected rows return real sanitized state snapshots where the definition
requires persistence or reload proof. F224 deliberately returns BLOCKED with a
safe limitation and both result/visual evidence IDs; it does not claim a
rendered screenshot.

## Authoritative orchestrator result

Command:

```powershell
node scripts/qa/run-idts110-new-cases.js --scope=USER_ADMIN_PROGRAMMATIC --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/user-admin-results.json
```

Run ID: `idts110-1788595861299-44f8256d1ce44798c3089720ec61d8f7`.

| Status | Count | Meaning |
| --- | ---: | --- |
| PASS | 26 | authoritative local atomic results |
| FAIL | 18 | selected child emitted no atomic marker because its selector is not implemented in Task 4 |
| BLOCKED | 1 | F224 programmatic precheck only; authoritative UI-runtime result belongs to Task 6 |
| HELD | 0 | none |
| NOT_RUN | 0 | none |
| **Total** | **45** | 44 authoritative slots plus the F224 precheck |

PASS keys:

```text
P189, P190, P191, P194, P195, P196, P197, P202,
F212, F213, F214, F219, F220D, F220R, F220N, F221, F223,
F225, F226, F227, F228, F228E, F229, F230, F231, F231R
```

## Remaining keys and concerns

The following 18 keys are exact blockers for completing the 45-row Task 4
matrix. They remain truthful FAIL records because their runners do not yet emit
case-bound markers:

```text
P200, P203,
F204, F205, F206, F207, F208, F209, F210, F210S, F211,
F215, F216, F216R, F217, F218, F220, F222
```

F224 is not a failure of the programmatic precheck; it is intentionally
BLOCKED until Task 6 captures the required rendered UI screenshot and runtime
evidence. No browser, provider, BTP, or live execution was claimed in this
task.

## Focused verification

The required no-argument focused runners all passed:

| Check | Result |
| --- | --- |
| `test-user-admin-developer-profile.js` | PASS |
| `test-user-admin-developer-profile-actions.js` | PASS |
| `test-user-admin-active-users.js` | PASS |
| `test-user-admin-catalog-model.js` | PASS |
| `test-user-admin-catalogs.js` | PASS |
| `test-user-admin-access-lifecycle.js` | PASS |
| `test-existing-user-identity-link.js` | PASS |
| `test-developer-workload-programmatic.js` | PASS — 61/61 |
| `test-user-admin-workload.js` | PASS |
| `test-pm-monitoring-programmatic.js` | PASS — 20/20 |
| `test-user-onboarding-contract.js` | PASS |
| `test-user-onboarding-programmatic.js` | PASS |
| `node --check` on all changed runners/helper/orchestrator/contract | PASS |
| `git diff --check` | PASS |

## Status and handoff boundary

Overall Task 4 status: **DONE_WITH_CONCERNS — BLOCKED FOR REMAINING KEYS**.

This task delivers 26 authoritative local atomic PASS results and one explicit
F224 precheck BLOCKED result. It does not claim an overall matrix PASS, merge,
deployment, release, browser acceptance, provider/BTP evidence, or DonHV
review approval. The final report commit SHA and final branch head are stated
in the handoff after this report-only commit.

## Fix round 1/5 — complete selectors and evidence-strengthening review

- Fix-round starting head: `029bf316a43796849ed398ba3315dfe17cce4a5a`.
- Fix-round implementation commit: `32752d4091021646b23d468ad65fb06e84833165`.

### RED checks

The protocol contract was extended before implementation. The missing-marker
classification assertion failed as expected because the orchestrator still
returned `FAIL` for a child that emitted no atomic marker:

```text
node scripts/qa/test-idts110-atomic-runner.js
AssertionError: Expected values to be strictly deep-equal
actual:   PASS, FAIL, FAIL, BLOCKED
expected: PASS, FAIL, BLOCKED, BLOCKED
```

The adapter review assertions were then run before their corrections. They
exposed the service-route ID conflict not reaching the handler, and the
incorrect expectation that rejected catalog operations would not create the
separate allowed `REJECTED` audit record. F231 also demonstrated that CAP's
DELETE capability precheck can return `ENTITY_IS_NOT_CRUD` before the registered
handler; the fix invokes the registered DELETE boundary directly and requires
the product's exact `CATALOG_DELETE_FORBIDDEN` error.

### GREEN changes

- Added P200 and P203 PM monitoring selectors.
- Added F204–F211, including F210S, F215, F216, and F216R onboarding selectors.
- Added F217 and F218 active-user display-name selectors.
- Added F220 workload-limit and F222 decimal-effort selectors.
- Bound F214 to its single planned identity-link assertion instead of the full
  broad identity-link suite.
- Strengthened P194/P195 active-state and success-audit checks; P196 now covers
  both TESTER and DEVELOPER updates with successful-audit immutability; F219
  proves the persisted/reloaded workload limit; and F225–F231R now cover the
  reviewed name, audit, route, ETag, dependency-count, immutability, delete,
  and reactivation requirements.
- Added `runAtomicUnavailableCase`; every adapter runner now rejects an
  unknown selector before broad setup, emits exactly one BLOCKED marker, and
  exits nonzero. Missing-marker children are BLOCKED with explicit
  `ATOMIC_ADAPTER_UNAVAILABLE` actual/limitation text; executed assertion
  mismatches remain FAIL.

The complete User Administration matrix now passes every executable selector:

```text
node scripts/qa/run-idts110-new-cases.js --scope=USER_ADMIN_PROGRAMMATIC --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/user-admin-results-fix-round-final.json
runId: idts110-1788599271216-7b817f21a63870e7e0cc5105aafb637e
total: 45
PASS: 44
FAIL: 0
BLOCKED: 1 (IDTS110-F224 only; Task 6 UI-runtime ownership)
```

The post-fix focused no-argument suite, protocol contract, syntax checks, and
`git diff --check` all pass. A separate unknown-selector sweep across all 12
adapter runners recorded exit 1 and exactly one `BLOCKED` marker per runner.

### Fix-round status

Task 4 has no remaining unimplemented selector keys. The only remaining
concern is the intentional F224 UI-runtime boundary: Task 4 supplies the
programmatic/native-control precheck, while Task 6 must capture its rendered
screenshot and authoritative UI result. This remains
**DONE_WITH_CONCERNS — F224 BLOCKED FOR TASK 6 UI EVIDENCE**; the 44 local
programmatic results are PASS, but the 45-row batch is not an overall PASS until
the UI lane replaces the precheck record.
