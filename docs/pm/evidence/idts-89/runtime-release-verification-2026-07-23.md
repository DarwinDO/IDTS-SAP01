# IDTS-89 Runtime Release Verification — 2026-07-23

## Verdict

Runtime release: **PASS**.

Authenticated exact-action Shared QA smoke: **PASS**.

The Jira issue can be closed after this evidence is synchronized.

## Protected merge and deploy

- Knowledge Gate: 90% — PASS.
- Required `qa-depth-gate`: completed successfully for PR head `a41dbd2` in
  workflow run `29993826931`, attempt 2.
- PR #163 merged normally without admin bypass.
- Merge SHA:
  `97792e8135dec0d8581126713f5725d6eeb068fd`.
- Manual runtime-only deploy: `dep-d9gtkhrrjlhs73d4mhqg`.
- Render terminal status: `live`.
- Deployed commit equals the merge SHA.

## Release guard

- Workspace: `IDTS_GSUSAP01`.
- Service: `idts-sap01-qa`.
- Branch: `dev`.
- Auto-deploy: `no`.
- Auto-deploy trigger: `off`.
- Pre-deploy command: `true`.
- Build command: `npm ci --include=dev`.
- Start command: `npm start`.
- Health path: `/odata/v4/auth/$metadata`.
- Broad `cds-deploy` was not run and was not restored.

## Post-deploy verification

| Check | Result |
| --- | --- |
| Auth metadata | HTTP 200 |
| BugService metadata without token | HTTP 401 |
| Render error logs since deploy start | No entries returned |
| Bugs | 12 |
| HistoryEvents | 62 |
| HistoryLogs | 122 |
| Users | 4 |
| Exact ActionTypes | 11/11 |
| Legacy ActionTypes | 11/11 |

The business, history, and user counts match the pre-release baseline. The
database readback was SELECT-only.

## Authenticated exact-action Shared QA smoke

The smoke used the approved private PM QA login from environment variables.
No password or bearer token was printed, persisted, or added to this evidence.

The test selected `BUG-0009`, which was already `ASSIGNED`, and performed a
reversible pair of authorized OData actions:

1. `moveToPendingAssignment` returned HTTP 200.
2. The Bug changed to `PENDING_ASSIGNMENT` and its assignee was cleared.
3. The latest HistoryEvent persisted
   `actionType_code = MOVE_TO_PENDING_ASSIGNMENT`.
4. The event contained a user-facing Pending Assignment summary and a resolved
   actor.
5. HistoryLogs used the same exact ActionType and contained changes for
   `status`, `assignee`, `nextProcessorUser`, and `nextProcessorRole`.
6. `assignToDeveloper` returned HTTP 200 and restored the original developer.
7. Final readback returned `ASSIGNED`, the original assignee, and
   `nextProcessorRole = DEVELOPER`.

The smoke exited with code 0 and left the Bug in its original business state.

## Remaining risk

This smoke proves one deployed exact-action path plus restoration. The local
IDTS-89 suite remains the broad proof for all 11 action mappings, direct
authorization, rollback, actor, next-processor, HistoryEvent, and HistoryLog
contracts.
