# IDTS-89 Runtime Release Verification — 2026-07-23

## Verdict

Runtime release: **PASS**.

Authenticated exact-action Shared QA smoke: **PENDING — approved login/session
required**.

Jira IDTS-89 remains In Progress.

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

## Remaining verification

No authenticated IDTS Shared QA tab or approved QA credential was available.
The available browser state only exposed `Sign In - IDTS`. No credential,
session storage, password, authentication bypass, or synthetic cloud-user
mutation was used.

With an approved PM/Tester or Developer session, execute one reversible
workflow action and verify:

1. `HistoryEvents.actionType_code` equals the exact OData action code.
2. Summary and actor are correct.
3. HistoryLogs contain the expected field changes.
4. Status, assignee, and next processor match the workflow contract.
5. The action is authorized for the selected role and assignment.

Jira comment `10576` records the live release and this remaining blocker
without secrets or private connection details.
