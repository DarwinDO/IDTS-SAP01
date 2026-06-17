# WP5 - Comments and History

Status: Completed, with grouped history-event read model added
Owner workstream: Backend CAP / Fiori UI5
Last updated: 2026-06-17

## Goal

Make comments and audit history useful in both backend behavior and Fiori display.

## Inputs

- WP1 child entities.
- WP3 handler behavior.
- WP4 object page layout.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP5-T01 | Confirm comment creation rules and visibility. | Completed |
| WP5-T02 | Confirm history log event set. | Completed |
| WP5-T03 | Display comments and history on Object Page. | Completed |
| WP5-T04 | Verify important actions create readable audit entries. | Completed |

## Definition of Done

- Users can understand the discussion and lifecycle history of a bug.
- Comments are available through a bound action and remain auditable through history logs.
- Object Page history is allowed to use grouped `HistoryEvents` for readability, while `HistoryLogs` remains the field-level audit source.
- Important status, assignment, and nextProcessor changes are auditable.
- 2026-06-17 follow-up: direct `Bugs.historyLogs` ownership was removed to avoid draft duplicate conflicts; history stays grouped by `HistoryEvents`.

## 2026-06-17 Follow-up

- Added a defensive backend guard so `BugService` rejects write attempts on `Users`, `DeveloperProfiles`, code lists, `HistoryEvents`, `HistoryLogs`, `Notifications`, and other system-managed/read-model entities.
- Added flattened display properties on `BugService.Bugs` (`reporterDisplayName`, `assigneeDisplayName`, `nextProcessorUserDisplayName`, `nextProcessorRoleName`) so Object Page read-only fields no longer depend on editable navigation-path bindings.
- Restored the corrupted local `NhanT` display name in `db.sqlite` after verifying that live user-master drift had propagated retroactively into history/comment/reporter displays.
- Remaining optional improvement: if audit text must stay immutable even when user master data legitimately changes later, snapshot actor/author display names into history/comment records instead of resolving them live from `Users`.
