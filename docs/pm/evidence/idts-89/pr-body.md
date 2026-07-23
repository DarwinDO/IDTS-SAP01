## Summary

Implements Jira IDTS-89: each of the 11 public Bug workflow OData actions now persists a dedicated ActionType in `HistoryEvents` and `HistoryLogs`. Legacy codes and history remain readable. No endpoint, lifecycle, role, Fiori button, AI feature, or existing history row is changed.

### Action mapping

| Action | Previous | Exact |
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

## Positive Evidence

- `npm run qa:idts89:one-to-one-action-audit`: 11/11 exact command mappings PASS.
- Existing HistoryEvents scenarios PASS.
- IDTS-6 lifecycle regression: 30/30 PASS.
- IDTS-23 ownership/history/monitoring: 46/46 PASS.
- Auth 28/28, PM monitoring 20/20, email outbox PASS.
- CAP compile, UI5 build, syntax checks, secret scan, AI DevKit lint, and `git diff --check` PASS.

## Negative Evidence

- Wrong Developer and unassigned Developer receive 403 on direct OData developer actions.
- Developer receives 403 for direct assignment and Move to Pending Assignment.
- Injected HistoryEvent insertion failure rejects the action and rolls the Bug update back.
- Existing invalid transition and missing-reason regression cases remain rejected.

## Edge/Boundary Evidence

- Running the ActionType UPSERT twice leaves exactly 11 new rows and no duplicates.
- Existing generic `EDIT` history remains readable.
- All 11 legacy ActionType codes remain in the catalog; no history migration is performed.
- Timeline projection returns a user-facing `actionTypeName`, not the raw exact code.

## Roles/Authorization

Tester/PM retain coordinator access. Only the assigned Developer can Mark In Review, Request More Information, Reject, Start Progress, or Resolve. Wrong/unassigned Developer and coordinator-only action negatives are verified by direct service dispatch.

## Persistence/Reload

Each action is read back from in-memory SQLite and verifies the persisted Bug state, `HistoryEvents`, child `HistoryLogs`, actor, summary, ActionType, assignee, and next processor. The repeated code-list UPSERT and rollback path are also read back.

## UI/UX Review

N/A - no `app/`, Fiori annotation, action metadata, button behavior, or UI5 source changed. UI5 build passes, and the HistoryEvents projection test confirms user-facing ActionType labels remain available.

## Ponytail Simplicity

Used `ponytail` during design and `ponytail-review` before PR. The implementation adds constants, direct handler mappings, explicit summary/actor groups, one CAP UPSERT script, and one focused integration suite. It adds no framework, dependency, endpoint, migration framework, or speculative abstraction. Duplicate legacy/exact summary branches were collapsed where wording is identical.

## Ownership Knowledge Gate

Member: DonHV

Date: 2026-07-23

Ownership flow: Bug workflow action → CAP handler → permission/transition → HistoryEvent/HistoryLogs

Base questions: handled in dedicated learning thread

Inactive-day questions: handled in dedicated learning thread

Additional-flow questions: handled in dedicated learning thread

Score: IN PROGRESS

Critical questions: handled in dedicated learning thread

Debug exercise: handled in dedicated learning thread

Teach-back: handled in dedicated learning thread

Evidence: dedicated learning thread

Result: IN PROGRESS — handled in dedicated learning thread

## Known Gaps

- This PR must remain draft/unmerged while the separate Knowledge Gate is In Progress.
- Shared QA PostgreSQL was not changed. After review, the environment owner must run the documented idempotent UPSERT with the approved private binding and perform before/after checks.
- The known unrelated attachment `NonUpdateableProperties` vocabulary warning remains.
- Pre-existing dependency audit findings remain outside this dependency-free change.

## Jira/Evidence Links

- Jira: IDTS-89; relates to IDTS-82 and IDTS-17.
- Evidence: `docs/pm/evidence/idts-89/README.md` and `verification.md`.
- Deployment instruction: `docs/deployment/action-type-upsert.md`.
- Do not upload secrets or raw private environment output.

## Checklist

- [x] I tested at least one non-happy path.
- [x] I checked role/authorization behavior.
- [x] I checked persistence/reload behavior.
- [x] I checked UI/UX consistency or explained why it is N/A.
- [x] I applied the required Ponytail skills.
- [ ] Ownership Knowledge Gate remains In Progress in the dedicated learning thread.
- [x] I recorded actionable defects and test/tooling issues in the DonHV status log.
