# WP5 - Comments and History

Status: Completed for Sprint 2 baseline, with Sprint 3 grouped history-event payload refinement added
Owner workstream: Backend CAP / Fiori UI5
Last updated: 2026-06-21

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

## 2026-06-21 Sprint 3 History Timeline Payload Support

English:

- Added read-only virtual fields `groupedChangeContext` and `changeCount` to `BugService.HistoryEvents` so FE/UI5 can render event-first history without scanning raw `HistoryLogs`.
- Added `srv/bug-service/history-read-models.js` to inject sparse-read dependencies and enrich `HistoryEvents` rows from `HistoryLogs` at read time.
- Normalized key action summaries and grouped context across assign, resubmit, reject, pending-assignment, close, and generic edit flows; `HistoryLogs` remains the raw field-level audit detail source.
- Added repeatable verification in `scripts/qa/test-history-events-programmatic.js` and npm alias `qa:history-events:programmatic`.
- Verify limitation noted for handoff: direct service-level sparse `READ` proof in the in-memory harness can hit CAP auth guarding before proving the virtual-field enrichment path, so product evidence uses read-model verification plus full backend regression rather than treating the harness behavior as a product defect.

Vietnamese:

- Đã thêm hai field ảo chỉ-đọc `groupedChangeContext` và `changeCount` vào `BugService.HistoryEvents` để FE/UI5 có thể render timeline theo event mà không phải lấy `HistoryLogs` thô làm bề mặt chính.
- Đã thêm `srv/bug-service/history-read-models.js` để tự bổ sung dependency cho sparse-read và enrich dữ liệu `HistoryEvents` từ `HistoryLogs` ở thời điểm đọc.
- Đã chuẩn hóa summary và grouped context cho các flow assign, resubmit, reject, move to pending assignment, close và generic edit; `HistoryLogs` vẫn là audit detail thô ở mức field.
- Đã thêm verify lặp lại được tại `scripts/qa/test-history-events-programmatic.js` và npm alias `qa:history-events:programmatic`.
- Có một hạn chế verify cần bàn giao rõ: khi chứng minh sparse `READ` trực tiếp qua service trong harness in-memory, CAP auth guard có thể chặn trước khi đi vào đường enrich field ảo; vì vậy bằng chứng sản phẩm dùng verify read-model cộng với regression backend đầy đủ, không xem đây là lỗi product.
