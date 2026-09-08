# IDTS-110 Task 5 report — My Notifications service atomic execution

## Authoritative summary

- Parent/source starting head: `95586d87cee19f3dd3e39d07d72c25ac70857b9d`.
- Required execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Authoritative service batch: `idts110-1788605529048-b10e4ed483f1b188966f9114a25a9dc3`.
- Matrix: **7 total — 7 PASS, 0 FAIL, 0 BLOCKED**.
- All seven results are `LOCAL_ATOMIC`, retain `PENDING_DONHV_REVIEW`, and have
  exactly one case-bound `*-RESULT` evidence ID.
- Final Task 5 commit head is recorded after the authorized commit is created.
- Scope is limited to `scripts/qa/test-my-notifications-service.js` and this
  report. No product source, catalog, workbook/template, database/schema/seed,
  dependency, BTP/HANA, provider, email, Drive, Jira, or other external state
  was changed.

## RED → GREEN evidence

### RED

The selector contract was added before the seven handlers. The first selected
run failed before CAP fixture setup because the dispatch map was empty:

```text
node scripts/qa/test-my-notifications-service.js --idts110-case=IDTS110-F232 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted
exit 1
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal
actual: []
expected: IDTS110-F232, IDTS110-F233, IDTS110-F234, IDTS110-F235, IDTS110-F235I, IDTS110-F235C, IDTS110-F236
```

### GREEN

The runner now dispatches exactly the approved seven selectors through the
shared atomic protocol. Each selected case deploys an isolated in-memory CAP
SQLite fixture, executes only its own NotificationService assertion, captures
sanitized state snapshots, and emits one marker. No email, provider, BTP, or
live data path is used.

| Case | Assertion covered | Result | Evidence |
| --- | --- | --- | --- |
| `IDTS110-F232` | Caller-only search, bounded category/read filters, occurredAt-desc plus ID-desc ordering, and non-overlapping snapshot pages | PASS | `IDTS110-F232-RESULT` |
| `IDTS110-F233` | Mixed Bug/access hydration, safe DTO fields, wrong-recipient/dual-source/unsupported/missing-source `UNAVAILABLE` boundaries | PASS | `IDTS110-F233-RESULT` |
| `IDTS110-F234` | Active-caller unread counts, cross-recipient isolation, inactive and unmapped denial | PASS | `IDTS110-F234-RESULT` |
| `IDTS110-F235` | Current `modifiedAt` mark-read and persisted reload state | PASS | `IDTS110-F235-RESULT` |
| `IDTS110-F235I` | Repeat mark-read idempotency with unchanged `readAt` and `modifiedAt` | PASS | `IDTS110-F235I-RESULT` |
| `IDTS110-F235C` | Stale `modifiedAt` returns `NOTIFICATION_VERSION_CONFLICT` without mutation | PASS | `IDTS110-F235C-RESULT` |
| `IDTS110-F236` | Caller-only mark-all honors `throughOccurredAt`; later and other-caller rows remain unread | PASS | `IDTS110-F236-RESULT` |

## Authoritative batch result

```text
node scripts/qa/run-idts110-new-cases.js --scope=MY_NOTIFICATIONS_SERVICE --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/notification-service-results.json
runId: idts110-1788605529048-b10e4ed483f1b188966f9114a25a9dc3
total: 7
PASS: 7
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

The batch verifies one result per selected key, exact `*-A1` assertion IDs,
the exact source baseline, canonical title/test-file/source-trace bindings,
required before/after/reload snapshots, and no broad-suite exit promotion.

## Fix round 1/5 — review-gap RED → GREEN

The review gaps were verified against the service code before changing the
runner: F235I did not prove the first read transition before its repeat;
F234 lacked the anonymous, PM/UserAdmin non-owner, and safe-error matrix; F233
did not enforce the complete public DTO allowlist; and F232–F234 emitted
hard-coded snapshot summaries.

### RED mutation checks

Three temporary test-only mutations failed at the new assertions, then were
restored before the authoritative rerun:

| Mutation | Observed failure |
| --- | --- |
| Remove F235I's first `markMyNotificationRead` call | Exit 1, atomic `FAIL`: `the first mark-read call transitions the DTO to read` |
| Add an `unsafeField` to an F233 DTO row | Exit 1, atomic `FAIL`: exact safe-field allowlist reported `unsafeField` |
| Route the F234 PM count through caller A instead of the PM fixture | Exit 1, atomic `FAIL`: expected PM-owned count `0`, observed caller-A count `2` |

### GREEN corrections

- F235I now proves the initial DTO is unread, the first result and persisted
  row are read, a separate reload remains read before the repeat, and the
  repeated result/reload preserve both `readAt` and `modifiedAt`.
- F234 now covers service-level anonymous `401`, an authenticated unmapped
  anonymous principal `403`, inactive `403`, unmapped `403`, PM-only scope,
  and PM+UserAdmin overlay scope with no recipient-owned rows. Denied errors
  have no payload/PII fields, and a full inbox readback is unchanged.
- F233 now requires exactly the 13 documented `NotificationSummary` fields
  and derives expected DTO cardinality and source counts from actual SQLite
  queries/readback.
- F232 covers both PM and PM+UserAdmin overlay readers without recipient-owned
  rows, and F232/F234 derive before/reload counts and row snapshots from the
  fixture database; F236 also proves PM/UserAdmin mark-all counts are zero.

The fresh authoritative batch after these corrections is the 7/7 PASS run
recorded above. No product source or external state changed.

## Unknown-selector boundary

```text
node scripts/qa/test-my-notifications-service.js --idts110-case=IDTS110-UNKNOWN --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted
exit: 1
markers: 1
status: BLOCKED
actual: ATOMIC_ADAPTER_UNAVAILABLE: selector IDTS110-UNKNOWN is not owned by this runner.
```

The unknown selector is rejected before CAP fixture deployment and cannot be
treated as a broad service-suite result.

## Verification checks

| Command | Result |
| --- | --- |
| `node scripts/qa/test-my-notifications-service.js` | PASS; exit 0; existing broad caller-only service contract remains unchanged |
| Seven direct atomic selector commands | PASS; each exit 0 and emitted one case marker |
| `node scripts/qa/run-idts110-new-cases.js --scope=MY_NOTIFICATIONS_SERVICE ...` | PASS; 7/7 authoritative local atomic results |
| `node scripts/qa/test-idts110-atomic-runner.js` | PASS; shared marker/schema/sanitization/orchestrator contract |
| `node --check` on service runner, atomic helper, and orchestrator | PASS |
| `git diff --check` | PASS; Git emitted only the standard LF-to-CRLF advisory |
| `node scripts/qa/secret-scan.js` | PASS; no credential-like key patterns found |
| `officecli --version` | `1.0.147`; Markdown is unsupported, so repository-native patching was used |

## Concerns and handoff boundary

- These are local in-memory SQLite atomic candidate results, not browser,
  provider, BTP, email, deployment, release, or live-runtime evidence.
- Results remain `PENDING_DONHV_REVIEW`; `PASS` here means the selected local
  assertion and atomic evidence contract passed, not human approval or an
  official SAP490 workbook PASS.
- Task 5 covers only the seven service/read-model keys. Notification UI cases
  `F237`, `F238`, `F238E`, `F238L`, `F239`, `F239P`, `F239H`, and `F239D` remain
  owned by Task 6. Access-email and Bug-email cases remain outside this task.
- The earlier Task 4 concern is unchanged: `IDTS110-F224` remains BLOCKED for
  Task 6 rendered UI evidence.
- CAP deployment prints the known attachment-data initialization lines; this
  is local fixture setup and did not alter tracked or external state.
- The service-level anonymous guard correctly returns `401`; the internal
  caller-resolution boundary returns sanitized `403` for authenticated but
  unmapped/inactive identities. This distinction is intentional and covered.

Task 5 stops at the committed service adapter and candidate report. It does not
push, merge, deploy, update Drive/Jira, send email, mutate BTP/HANA, or remove
the worktree.
