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
