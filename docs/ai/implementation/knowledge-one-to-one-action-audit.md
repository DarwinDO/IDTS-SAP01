# IDTS-89: One-to-one workflow action audit

## Purpose

Each public OData workflow command that changes a Bug now writes a dedicated `HistoryEvents.actionType_code`. A reviewer can identify the command from the event without inferring it from the target status or field-level logs.

`addComment` is intentionally outside this workflow-command contract. It is a collaboration action, not a lifecycle transition, and continues to use the generic `EDIT` audit category. AI suggestion actions remain outside this model because they use `AiSuggestions` and do not mutate the Bug workflow.

## Command mapping

| OData action | Handler | Exact ActionType | Allowed roles |
| --- | --- | --- | --- |
| `assignToDeveloper` | `actions.assignToDeveloper` | `ASSIGN_TO_DEVELOPER` | Tester, PM |
| `moveToPendingAssignment` | `transitionBug` | `MOVE_TO_PENDING_ASSIGNMENT` | Tester, PM |
| `markInReview` | `transitionBug` | `MARK_IN_REVIEW` | Assigned Developer, Tester, PM |
| `requestMoreInformation` | `transitionBug` | `REQUEST_MORE_INFORMATION` | Assigned Developer, Tester, PM |
| `resubmitToDeveloper` | `actions.resubmitToDeveloper` | `RESUBMIT_TO_DEVELOPER` | Tester, PM |
| `rejectBug` | `transitionBug` | `REJECT_BUG` | Assigned Developer, Tester, PM |
| `startProgress` | `transitionBug` | `START_PROGRESS` | Assigned Developer, Tester, PM |
| `resolveBug` | `transitionBug` | `RESOLVE_BUG` | Assigned Developer, Tester, PM |
| `sendToRetest` | `transitionBug` | `SEND_TO_RETEST` | Tester, PM |
| `closeBug` | `transitionBug` | `CLOSE_BUG` | Tester, PM |
| `reopenBug` | `transitionBug` | `REOPEN_BUG` | Tester, PM |

Legacy codes such as `ASSIGN`, `REASSIGN`, `STATUS_CHANGE`, `REQUEST_INFO`, `REJECT`, `RESOLVE`, `RETEST`, `CLOSE`, and `REOPEN` remain in the code list. Existing history is not rewritten. Generic direct Bug edits may still use these categories because they are not a named workflow-command invocation.

## Request lifecycle

1. Fiori or an API client calls the bound action declared in `srv/service.cds`.
2. `srv/service.js` maps the action name to its dedicated `ACTION` constant.
3. `actions.js` or `transitionBug` reads the current Bug.
4. `permissions.js` resolves the trusted backend actor and checks coordinator or assigned-Developer authorization.
5. `bug-write.js` validates the unchanged status state machine and calculates the next processor.
6. The request transaction updates the Bug.
7. `history.js` writes one `HistoryEvents` row and its `HistoryLogs` rows with the same exact ActionType, actor, readable summary, and reason when applicable.
8. If history persistence fails, the Bug update rolls back with the request transaction.
9. Timeline reads resolve `actionTypeName` from `ActionTypes`; the UI does not need to display the raw code.

## Debug breakpoint order

Start at the `this.on('<action>')` registration in `srv/service.js`, then move through:

1. `assignToDeveloper`, `resubmitToDeveloper`, or `transitionBug` in `srv/bug-service/actions.js`.
2. `enforceActionPermission` in `permissions.js`.
3. `validateTransition` and `determineNextProcessor` in `bug-write.js`.
4. The Bug `UPDATE`.
5. `actorForAction`, `buildHistorySummary`, and `writeHistoryEvent` in `history.js`.
6. The `HistoryEvents` and `HistoryLogs` rows.

Inspect `req.event`, `req.user`, `options.actionType`, old/new status, assignee, next processor, actor ID, summary, and transaction result in that order.

## Database rollout

Local/test database creation loads `db/data/idts.cap-ActionTypes.csv`. An existing PostgreSQL environment must not be reset or redeployed merely to add code-list rows. Use the dry-run-first idempotent UPSERT described in `docs/deployment/action-type-upsert.md`.

## Verification

`npm run qa:idts89:one-to-one-action-audit` directly dispatches all 11 OData actions and checks exact event/log codes, summaries, actors, permissions, state, next processor, timeline labels, rollback, and idempotent code-list UPSERT. Existing history regression separately checks readable payloads and legacy compatibility.

## Tóm tắt tiếng Việt

Mỗi OData workflow action của Bug có một `ActionType` riêng. Luồng debug là action OData → mapping trong `service.js` → kiểm quyền → kiểm transition → update Bug → ghi `HistoryEvents`/`HistoryLogs` trong cùng transaction. Mã cũ vẫn được giữ để đọc lịch sử cũ; không migrate lại history cũ. `addComment` và AI action không thuộc contract workflow 1–1 này.
