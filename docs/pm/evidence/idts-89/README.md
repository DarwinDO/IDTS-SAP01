# IDTS-89 evidence index

Jira: `IDTS-89`

Branch: `refactor/idts-89-one-to-one-action-audit-donhv`

Owner: DonHV

Support: NhanT

Knowledge Gate: `IN PROGRESS — handled in dedicated learning thread`

## Scope inventory

The bound Bug actions declared in `srv/service.cds` are the 11 workflow commands below plus `addComment`. `addComment` remains outside the one-to-one workflow contract because it is a collaboration action and does not change workflow state or ownership. The unbound AI actions use the separate `AiSuggestions` audit model and remain out of scope.

| Public OData action | Previous ActionType | New exact ActionType |
| --- | --- | --- |
| `assignToDeveloper` | `ASSIGN` | `ASSIGN_TO_DEVELOPER` |
| `moveToPendingAssignment` | `REASSIGN` | `MOVE_TO_PENDING_ASSIGNMENT` |
| `markInReview` | `STATUS_CHANGE` | `MARK_IN_REVIEW` |
| `requestMoreInformation` | `REQUEST_INFO` | `REQUEST_MORE_INFORMATION` |
| `resubmitToDeveloper` | `STATUS_CHANGE` | `RESUBMIT_TO_DEVELOPER` |
| `rejectBug` | `REJECT` | `REJECT_BUG` |
| `startProgress` | `STATUS_CHANGE` | `START_PROGRESS` |
| `resolveBug` | `RESOLVE` | `RESOLVE_BUG` |
| `sendToRetest` | `RETEST` | `SEND_TO_RETEST` |
| `closeBug` | `CLOSE` | `CLOSE_BUG` |
| `reopenBug` | `REOPEN` | `REOPEN_BUG` |

## Test-first evidence

The first focused run failed for the expected product reason:

```text
FAIL: Missing ACTION.ASSIGN_TO_DEVELOPER.
```

After the minimal mapping, summary, permission, actor, and code-list changes, the same suite reports:

```text
PASS: 11/11 workflow actions have unique persisted ActionTypes.
PASS: direct authorization, HistoryLogs, actor, state, next processor, rollback, and idempotent upsert contracts verified.
```

The focused suite dispatches the OData action handlers directly and checks:

- Exact `HistoryEvents.actionType_code`.
- The same exact code on every child `HistoryLogs` row.
- Command-specific readable summary.
- Current actor and fallback actor resolution.
- Status, assignee, and next processor.
- Tester/PM and assigned-Developer positive paths.
- Wrong Developer, unassigned Developer, and developer assignment/pending-queue 403 paths.
- Timeline `actionTypeName` exists and is not the raw technical code.
- Bug update rollback when the HistoryEvent insert is intentionally rejected.
- Two consecutive `UPSERT` runs leave exactly 11 new code-list rows.

## Database rollout

`npm run db:action-types:upsert` is dry-run-only by default and changed no database during this task. The approved execution form is:

```powershell
npm run db:action-types:upsert -- --execute
```

The script uses CAP `UPSERT`, inserts or updates only the 11 exact `ActionTypes`, and never deletes legacy code-list or business rows. No destructive `cds deploy` was run against Shared QA. Operator instructions are in `docs/deployment/action-type-upsert.md`.

## Files DonHV should upload to Jira

- `docs/pm/evidence/idts-89/README.md`
- `docs/pm/evidence/idts-89/verification.md`

Do not upload secrets, private database bindings, real recipient data, or raw auth test output.
