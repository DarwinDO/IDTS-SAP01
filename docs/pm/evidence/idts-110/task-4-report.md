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
