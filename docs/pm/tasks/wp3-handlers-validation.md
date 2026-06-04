# WP3 - Handler Rules and Validation

Status: Completed for Sprint 1 MVP
Owner workstream: Backend CAP
Last updated: 2026-06-04

## Goal

Implement backend rules that protect business-critical transitions and ownership changes.

## Inputs

- `docs/ba/03-status-transition-matrix.md`
- `docs/ba/04-requirement-backlog.md`
- WP1 data model.
- WP2 service contract.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP3-T01 | Implement create/update validation for required fields and classification. | Completed |
| WP3-T02 | Implement assignment filtering/validation using Developer Responsibility. | Completed |
| WP3-T03 | Implement status transition validation. | Completed |
| WP3-T04 | Implement nextProcessor auto-update rules. | Completed |
| WP3-T05 | Create history logs for important changes. | Completed |
| WP3-T06 | Enforce Rejected follow-up rules: rejection reason, nextProcessor, allowed follow-up transitions. | Completed |
| WP3-T07 | Add focused backend tests or repeatable manual verification. | Completed manual/API verification |

## 2026-06-04 Implementation Update

English:

- Added `srv/service.js` as the CAP Node.js implementation for `BugService`.
- Implemented create/update validation for required fields, valid Component Category derivation, assignment responsibility, status transitions, and rejected follow-up reason.
- Added automatic `nextProcessorUser_ID` and `nextProcessorRole_code` calculation.
- Added lifecycle bound actions for assignment, pending assignment, developer review, information request, reject, progress, resolve, retest, close, and reopen.
- Added HistoryLog creation for create, assignment, status changes, classification/ownership changes, and rejection reason changes.
- Added Notification record creation for Assigned, Need More Information, Rejected, and Closed events.
- Verified action behavior with OData calls: `resolveBug` succeeds for a valid transition, invalid `RESOLVED -> IN_PROGRESS` transition is rejected with HTTP 400, create derives `componentCategory_ID`, and `assignToDeveloper` writes history/notification.

Vietnamese:

- Đã thêm `srv/service.js` làm CAP Node.js implementation cho `BugService`.
- Đã implement validation khi create/update cho required fields, derive Component Category hợp lệ, assignment responsibility, status transition và rejected follow-up reason.
- Đã tự động tính `nextProcessorUser_ID` và `nextProcessorRole_code`.
- Đã thêm lifecycle bound actions cho assignment, pending assignment, developer review, request information, reject, progress, resolve, retest, close và reopen.
- Đã thêm ghi HistoryLog cho create, assignment, status change, classification/ownership change và rejection reason change.
- Đã thêm tạo Notification record cho các event Assigned, Need More Information, Rejected và Closed.
- Đã verify bằng OData calls: `resolveBug` pass với transition hợp lệ, transition sai `RESOLVED -> IN_PROGRESS` bị reject HTTP 400, create tự derive `componentCategory_ID`, và `assignToDeveloper` ghi history/notification.

## Remaining Notes

English: This is an MVP backend rule layer. It does not yet implement real authorization/XSUAA, external notification delivery, binary attachment storage, or automated test files.

Vietnamese: Đây là lớp backend rule mức MVP. Chưa implement authorization/XSUAA thật, gửi notification ra kênh ngoài, binary attachment storage hoặc automated test files.

## Definition of Done

- Invalid transitions are rejected in backend.
- nextProcessor is not manually required for normal flow.
- Assignment rules are enforced beyond the UI.
- Important changes are auditable.
- Rejected bugs cannot remain without reason, owner, and next action.

Vietnamese:

- Backend phải chặn trường hợp bug chuyển sang `Rejected` mà không có lý do, owner xử lý tiếp và action tiếp theo.
