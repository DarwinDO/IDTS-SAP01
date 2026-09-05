# IDTS-110 Task 7 report — access-email and immediate-kick atomic execution

## Scope and authority

- Source/execution baseline: `6eb6f73840d7150598a993f8656d2b44e5b0cd4b`.
- Parent source head at Task 7 start: `7b4773186d5ef8f56804a3911d8a46bd512f53bb`.
- Changed source files: `scripts/qa/test-user-access-notifications.js`, `scripts/qa/test-user-onboarding-programmatic.js`, and `scripts/qa/test-email-immediate-kick.js`.
- The approved catalog and atomic protocol were read-only inputs. No product source, schema, dependency, lockfile, BTP/HANA, provider, real email, Jira, Drive, or other external state changed.
- All results are local `LOCAL_ATOMIC` candidate evidence with `PENDING_DONHV_REVIEW`; they are not provider delivery, deployment, release, merge, or human approval evidence.

## TDD RED → GREEN

The pre-change batch was run before adding the adapters:

```text
node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/task7-red-access-email-results.json
total: 10
statusCounts: {"BLOCKED":10}
```

This was the expected RED: the selected runners had no accepted atomic markers. A first F244 fixture attempt also failed because a `DEVELOPER` invitation lacked the required responsibility; the fixture was corrected to a valid `TESTER` invitation. No product defect or external call was involved.

The final batch is:

```text
node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/access-email-results.json
runId: idts110-1788612727356-c42b0f3c3aa7b2c4820183cea882bd22
total: 10
PASS: 10
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Batch output SHA-256: `92d0d273bf479ad7c89cda14e84e7b527918ab9ca20bdaebdea040d114860b85`.

## Atomic selector coverage

| Runner | Selectors | Verified behavior |
| --- | --- | --- |
| `test-user-access-notifications.js` | `F240`, `F240R`, `F241` | Applied `CHANGE_ROLE`/`REACTIVATE` creates one delivery plus one inbox index; applied `REVOKE` creates one email-only delivery; invalid URL is `SKIPPED` with `EMAIL_BASE_URL_INVALID` and zero sender calls. |
| `test-user-onboarding-programmatic.js` | `F243`, `F243M`, `F244`, `F245` | Missing/expired invitation skips with safe codes and zero sender calls; token mismatch records `FAILED` with `INVITATION_TOKEN_MISMATCH`, one bounded retry, and zero sender calls; invitation message keeps HTTPS fragment and official SAP links without query-token credentials; cancellation preserves `INVITATION_CANCELLED`, skips delivery, and sends nothing. |
| `test-email-immediate-kick.js` | `F246`, `F246R`, `F246B` | Successful request kicks once after commit; repeated registration is idempotent; failed request does not start provider work. |

Each selected case emitted exactly one `<caseKey>-A1` marker, used an isolated SQLite fixture or pure injected dependency fixture, and supplied non-empty before/after/reload snapshots. F243M is a candidate `PASS` because the expected failure/retry behavior passed; it is not a successful provider-delivery claim.

## Selector boundary and regression evidence

Unknown-selector sweep:

```text
test-user-access-notifications.js       exit=1  markers=1  status=BLOCKED
test-user-onboarding-programmatic.js    exit=1  markers=1  status=BLOCKED
test-email-immediate-kick.js            exit=1  markers=1  status=BLOCKED
```

Unknown selectors are rejected before each runner creates its case fixture. Existing Task4 onboarding selectors were spot-checked (`F205`, `F209`, `F216R`) and remained `PASS` with one marker each.

Fresh no-argument and protocol checks:

```text
node scripts/qa/test-user-access-notifications.js       exit=0  PASS
node scripts/qa/test-user-onboarding-programmatic.js    exit=0  PASS
node scripts/qa/test-email-immediate-kick.js            exit=0  PASS
node scripts/qa/test-idts110-atomic-runner.js           exit=0  PASS
node --check scripts/qa/test-user-access-notifications.js       exit=0
node --check scripts/qa/test-user-onboarding-programmatic.js    exit=0
node --check scripts/qa/test-email-immediate-kick.js            exit=0
git diff --check                                            exit=0
node scripts/qa/secret-scan.js                              exit=0  PASS
```

OfficeCLI documentation preflight was run as required: `officecli --version` returned `1.0.147`. OfficeCLI does not author repository Markdown, so this report uses repository-native patching; no workbook operation was attempted.

## Handoff

Task 7 is complete at the requested source-only handoff boundary. The coordinator should verify the post-commit branch head and review the ten candidate records, with particular attention to F243M retry truth, F246R duplicate registration, and F246B rollback/no-provider evidence. Do not push, merge, deploy, send real mail, update Drive/Jira, or promote these candidate results without DonHV review.

## Fix round 1/5 — Important-gap strengthening

- Fix-round starting head: `1ebdfcc68130717988c97ede3881619e8a930fd7`.
- RED contract: `node .tmp/idts-110/task7-fix-round1-red.js` failed before the fixes at the missing F240 failed-audit assertion (`actual: undefined`, `expected: true`).
- F240 now persists a `FAILED` audit and proves it creates no delivery, binds each delivery’s `sourceAuditEvent_ID` to the two applied audits, binds each `targetUser_ID` to the fixture user, and leaves exactly one inbox index after duplicate delivery registration.
- F244 now checks both text and HTML for query-token and credential patterns, verifies exactly one fragment-token link plus the two official SAP links, verifies HTML role/expiry content, and checks HTML escaping with hostile role/expiry text.
- F246 and F246R now call the real `writeNotificationAndSchedule` path in an isolated SQLite transaction. The path creates one real `PENDING` `NotificationDeliveries` row; F246 kicks exactly once after commit, while F246R writes the same source-key delivery twice and records `REGISTERED` then `DUPLICATE_IGNORED` with one kick.
- F246B writes the same candidate delivery inside a real transaction, throws, confirms both notification and delivery rows are absent after rollback, and confirms zero detached worker/provider calls.

The strengthened contract and authoritative batch passed:

```text
node .tmp/idts-110/task7-fix-round1-red.js
Task7 fix round 1 strengthening contract: PASS

node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/access-email-results.json
runId: idts110-1788614317516-3d2e101a52770fc85135494df8ecdb63
total: 10
PASS: 10
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Fix-round batch output SHA-256: `63d5ada6c9e673f4bb8b30455512ffe2a54733cedccb68b8535ed8e3a736f5cf`.

Fresh no-argument suites, atomic protocol, syntax checks, secret scan, and `git diff --check` all exited `0`. Unknown-selector checks still emitted exactly one `BLOCKED` marker and exit `1` for each of the three adapters. The result set remains local candidate evidence with `PENDING_DONHV_REVIEW`; no real provider/email or external state was used.

Final rerun after the direct F244 HTML assertions:

```text
node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/access-email-results.json
runId: idts110-1788614468502-e3aa9776098f128ba421fec17d15b322
total: 10
PASS: 10
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Final batch output SHA-256: `7259a9920ab0e45ae6e213a1c08aa848f555a2db111b105fac1ef9e9b90217fe`.

## Fix round 2/5 — F244 exact-link and expiry proof

- Fix-round starting head: `5ba5cc666e066af7b07327617fc4e8e8bc796b81`.
- RED contract: the strengthened selector contract failed before this fix at the missing exact text-URL proof (`textOfficialSapUrls` was `undefined`).
- F244 now extracts the text-body SAP URLs and requires exactly `https://account.sap.com/` and `https://account.sap.com/registration/` in that order. It extracts the HTML expiry paragraph and compares its value exactly with `invitation.row.expiresAt` after applying the same HTML escaping rules used for rendered content. The HTML role, single fragment-token link, official links, query-token/credential omission, and hostile-value escaping checks remain active.

Fresh targeted F244 and full-batch evidence:

```text
node .tmp/idts-110/task7-fix-round1-red.js
Task7 fix round 2 F244 contract: PASS

node scripts/qa/test-user-onboarding-programmatic.js --idts110-case=IDTS110-F244 --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted
status: PASS

node scripts/qa/run-idts110-new-cases.js --scope=ACCESS_EMAIL --baseline=6eb6f73840d7150598a993f8656d2b44e5b0cd4b --executor=Codex-agent-assisted --output=.tmp/idts-110/access-email-results.json
runId: idts110-1788615031594-3b60d9bc789fe3973d1ca9c9ab43e247
total: 10
PASS: 10
FAIL: 0
BLOCKED: 0
HELD: 0
NOT_RUN: 0
```

Final fix-round batch output SHA-256: `d2b26fccb3ec17bde3f209eb815404517bf3013d7e09fec8bd3851b3e2663563`.

Fresh no-argument suites, atomic protocol, syntax checks, secret scan, and `git diff --check` all exited `0`; no provider, email, BTP/HANA, or other external mutation occurred.
