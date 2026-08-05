# IDTS-122 ActionType Repair — 2026-08-06

## Scope

Add the missing code-list row required by the merged retest-owner reassignment audit contract:

```text
code        = REASSIGN_RETEST_OWNER
name        = Reassign Retest Owner
sortOrder   = 45
active      = true
criticality = 1
```

This operation did not deploy HDI artifacts, import seed data, change schema, or mutate Bugs, Users, DeveloperProfiles or drafts.

## Safety gates

- Local focused repair suite: PASS for dry-run, rollback rehearsal, execute and idempotent rerun.
- Live dry-run: row reported `MISSING`; no mutation.
- Live transaction rehearsal: insert completed and rolled back; no persisted row.
- DonHV exact-row decision: GO.
- Cloud Foundry transport probe: quote-free loader marker PASS before the valid execute attempt.

Three earlier task launches were transport-only failures before CAP/HANA connection. They produced no database mutation and are recorded in `docs/pm/status/donhv.md`.

## Execute evidence

- Cloud Foundry app: `idts-sap01-srv`.
- Task: `idts122-action-execute-000358` (task 74).
- Required marker: `IDTS122_ACTION_REPAIR_EXECUTE_COMPLETE`.
- Result: `before=MISSING`, `exactMatchAfter=true`, `rolledBack=false`.

## Independent readback

- Task: `idts122-action-postverify-000641` (task 75).
- Required marker: `IDTS122_ACTION_POSTVERIFY_COMPLETE`.

| Check | Result |
| --- | ---: |
| Bugs | 6 |
| Users | 14 |
| DeveloperProfiles | 12 |
| Matching ActionType rows | 1 |
| Exact canonical value | PASS |
| Active | PASS |
| Bugs draft rows | 1 |
| HistoryEvents draft rows | 1 |
| HistoryLogs draft rows | 3 |
| DraftAdministrativeData rows | 1 |

The draft rows represent one currently open aggregate and were intentionally preserved.

## Security and limitations

- No token, password, service binding, private endpoint or personal identifier is stored in this evidence.
- This evidence proves the narrow code-list repair only. Selective deployment and signed-in PM/Tester/Developer acceptance remain separate gates.
