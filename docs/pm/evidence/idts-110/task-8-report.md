# IDTS-110 Task 8 report — scheduled discovery and digest atomic execution

## Scope and authority

- Worktree branch: `test/idts-110-unit-test-execution-donhv`.
- Parent/source starting head: `207c433ab2d4723dbc302d512beab226409dbaf1`.
- Required execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Changed files are limited to `scripts/qa/test-my-notifications-scheduled.js`,
  `scripts/qa/test-my-notifications-digest.js`, and this report.
- No product source, CDS model, catalog, workbook/template, dependency,
  lockfile, BTP/HANA, provider, real email, Drive, Jira, or other external
  state was changed.
- All results are local `LOCAL_ATOMIC` candidate evidence with
  `PENDING_DONHV_REVIEW`; they are not live scheduler, provider, email,
  deployment, release, merge, or human-approval evidence.

## TDD RED → GREEN

Before implementation, the existing selected invocations ran the broad
no-argument contracts and emitted zero atomic markers. The temporary selector
contract then failed at the expected missing dispatch map:

```text
node .tmp/idts-110/task8-red-selector-contract.js
AssertionError: The input did not match /const scheduledAtomicCases = new Map\(\[/
exit: 1
```

The two runners now parse the shared atomic options before fixture setup,
reject unknown selectors through one `BLOCKED` marker, and retain their
existing broad `main()` path when no selector is supplied. Each supported key
loads its catalog definition and calls `runAtomicCase` exactly once.

## Selector coverage

| Runner | Atomic selectors | Clauses exercised |
| --- | --- | --- |
| `test-my-notifications-scheduled.js` | `F247`, `F247S`, `F247SS`, `F248`, `F248C`, `F248N`, `F249`, `F249K`, `F249T` | Pending Assignment recipient role and OutboxProcessor authorization; four-hour Critical/Blocker and 24-hour standard SLA boundaries; overdue current-owner/technical-assignee safety and Closed exclusion; same-cycle idempotency; new due-date source keys; activation cutoff; bounded ID-keyset paging; page transaction/cursor rollback. |
| `test-my-notifications-digest.js` | `F250`, `F250L`, `F250M`, `F250Q`, `F250R`, `F251`, `F251R`, `F252`, `F252R`, `F252P`, `F253` | PM/Developer/Tester persona snapshots; deterministic ordering; render limit with full `itemCount`; allowlisted Bug/queue links; raw-field omission and HTML escaping; exact unique conflict reuse; bounded page failure/resume; inactive/changed-role/missing active Developer Profile send-time checks; sanitized injected sender failure, bounded retry, cleared locks, and unchanged snapshot body. |

Every selector uses a fresh isolated CAP/SQLite fixture. Page, unique-conflict,
send-time race, and sender failure cases use injected local transactions or
senders while executing the real scheduled/digest source functions. Atomic
fixture setup clears only seeded domain rows from the in-memory database and
retains code-list data; this prevents repository seed rows from contaminating
case-specific readback.

## Authoritative BUG_EMAIL batch

Command:

```text
node scripts/qa/run-idts110-new-cases.js --scope=BUG_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/bug-email-results.json
```

```text
runId: idts110-1788620050494-2e67257b05ab700814a14d30c94f4201
scope: BUG_EMAIL
total: 20
PASS: 20
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Batch SHA-256: `CBB7C4A249DC2AA6B2AE86F410C3848743BB59BA3B0689E69329F526B25C5715`.

Each row has one matching `<caseKey>-A1` assertion and one exact
`<caseKey>-RESULT` evidence ID. The F253 row is a local candidate PASS for
correct handling of an injected sender exception; it explicitly does not
claim successful provider delivery.

## Selector boundary and regression evidence

Unknown-selector checks:

```text
test-my-notifications-scheduled.js: exit 1, markers 1, status BLOCKED, fixture setup lines 0
test-my-notifications-digest.js:     exit 1, markers 1, status BLOCKED, fixture setup lines 0
```

Focused no-argument runners:

```text
node scripts/qa/test-my-notifications-scheduled.js
exit: 0 — IDTS My Notifications scheduled discovery contract: PASS

node scripts/qa/test-my-notifications-digest.js
exit: 0 — IDTS My Notifications digest contract: PASS
```

Additional focused gates:

```text
node scripts/qa/test-idts110-atomic-runner.js  # exit 0
node --check scripts/qa/test-my-notifications-scheduled.js  # exit 0
node --check scripts/qa/test-my-notifications-digest.js  # exit 0
node scripts/qa/secret-scan.js  # exit 0 — no credential-like key patterns
git diff --check  # exit 0
```

OfficeCLI documentation preflight was run as required:
`officecli --version` → `1.0.147`; `officecli help` confirms it supports DOCX,
XLSX, and PPTX, not repository Markdown, so this report uses repository-native
patching and no Office artifact operation was attempted.

## Handoff boundary and concerns

- The temporary `.tmp/idts-110` logs and batch are run outputs; they are not
  committed as Task 8 source artifacts.
- Two harness-only red signals were corrected during TDD: seeded domain rows
  were cleared from atomic in-memory fixtures, and the F250 evidence summary
  was flattened to the protocol's bounded state depth. Neither signal was a
  product or external-service failure.
- The 20 results are local candidate records pending DonHV review. They do not
  promote the 278-case catalog, alter the official workbook, or establish live
  scheduler/provider/email/BTP evidence.
- The digest failure selector records retry metadata and unchanged stored
  snapshot content after a locally injected sender exception. Local injected
  failure is intentionally not equated with live provider delivery.
- No `IDTS110-F242` selector was added.

Task 8 stops at the requested committed runners and report. Do not push, merge,
deploy, send real mail, update Drive/Jira, mutate BTP/HANA, or remove the
worktree as part of this task.

## Fix round 1/5 — review findings addressed

The review RED contract was rerun against the committed Task 8 implementation
and failed before the fix on the missing retry/resume, PM-page, safe-item, and
winner-row assertions. The focused GREEN selectors then passed:

```text
IDTS110-F248   PASS — inactive, stale, unmapped, and invalid-profile overdue targets are absent; active owner/assignee remain
IDTS110-F249K  PASS — 501 candidate rows and 501 active PM rows are read exactly once through separate two-page ID keysets
IDTS110-F249T  PASS — page-two failure rolls back 0 page-two writes, retries the same cursor/page, and leaves 501 unique source rows
IDTS110-F250R  PASS — snapshot.items has exactly the eight-field safe allowlist and contains no raw keys/values
IDTS110-F251   PASS — exact pre-existing winner ID and unchanged row are reused; later recipient has one row
IDTS110-F251R  PASS — failed recipient page leaves no rows and the same source page is read on resume without duplicates
```

F249K now uses 500 overdue candidates with no mapped owner plus one pending
candidate, and 501 active PMs, so both candidate and PM streams cross their
bounded page limits without producing a notification cross-product. F249T
uses real SQLite candidate queries and a one-shot injected page-two exception;
the retry executes the real scheduler again and reads back persisted rows and
the unchanged keyset cursor. F248 now includes all unsafe recipient shapes and
deactivates the stale owner only after the real eligibility read. F250M/Q/R,
F251, and F251R use fresh database/source queries for before, after, and reload
state; F250Q binds each rendered item to its exact Bug Object Page link, and
F250R asserts the exact safe item projection.

Fresh authoritative batch after the fix:

```text
runId: idts110-1788622556261-f0b0f10e37ece75d3a2bf539e1ee2fd4
scope: BUG_EMAIL
total: 20
PASS: 20
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
Batch SHA-256: D80E3068E2A17454BF46D150EA85DD73A5EEEACB73E7985FB381AFF98CEAB405
```

No-argument scheduled and digest suites remain `PASS`. No product source or
external state changed; all provider behavior remains locally injected and is
not live-delivery evidence.
