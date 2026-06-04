# WP2 - Service and Value Help

Status: Completed for Sprint 1 MVP
Owner workstream: Backend CAP
Last updated: 2026-06-04

## Goal

Expose a clean OData V4 service contract for IDTS and provide value-help-ready projections for Fiori.

## Inputs

- WP1 data model.
- `docs/ba/07-fiori-ux-requirements.md`
- `srv/service.cds`
- `app/bug-management-ui/annotations.cds`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP2-T01 | Review current service projections. | Completed |
| WP2-T02 | Expose Bugs and required child entities. | Completed |
| WP2-T03 | Expose master data value helps for status, priority, severity, SAP Module, Application Component, Defect Category, and Developers. | Completed |
| WP2-T04 | Add OData actions/functions only where needed for real user actions, including reject/follow-up actions if annotations alone are not enough. | Completed |
| WP2-T05 | Compile service metadata. | Completed |

## 2026-06-04 Implementation Update

English:

- WP2-T01 completed: reviewed the current `BugService` projections and kept the service focused on IDTS entities.
- WP2-T02 completed: existing Bugs, child entities, master data, responsibilities, history, notification, and duplicate link projections remain exposed through OData V4.
- WP2-T03 completed: added Fiori value help annotations for status, priority, severity, environment, SAP module, application component, defect category, reporter, assignee, and next processor role.
- WP2-T04 completed for MVP: added bound OData actions on `Bugs` only for real bug lifecycle actions.
- WP2-T05 completed: `cds compile srv app/bug-management-ui --to edmx` passes and metadata contains `Common.ValueList` and bound action definitions.

Vietnamese:

- WP2-T01 hoàn thành: đã review projection hiện tại của `BugService` và giữ service tập trung vào entity của IDTS.
- WP2-T02 hoàn thành: Bugs, child entities, master data, responsibilities, history, notification và duplicate link vẫn được expose qua OData V4.
- WP2-T03 hoàn thành: đã thêm Fiori value help annotation cho status, priority, severity, environment, SAP module, application component, defect category, reporter, assignee và next processor role.
- WP2-T04 hoàn thành ở mức MVP: đã thêm bound OData actions trên `Bugs` chỉ cho các action thật trong vòng đời bug.
- WP2-T05 hoàn thành: `cds compile srv app/bug-management-ui --to edmx` pass và metadata có `Common.ValueList` cùng bound action definitions.

## Remaining Notes

English: Dependent assignee value help is annotation-supported after `componentCategory_ID` exists. During initial create, CAP derives and validates `componentCategory_ID` on save. Backend validation remains the final source of truth.

Vietnamese: Dependent assignee value help được hỗ trợ bằng annotation sau khi bug đã có `componentCategory_ID`. Khi create ban đầu, CAP derive và validate `componentCategory_ID` lúc save. Backend validation vẫn là nguồn kiểm tra cuối cùng.

## Definition of Done

- Service metadata exposes required entities and associations.
- Value helps can support dependent Fiori selection.
- No unnecessary generic workflow APIs are added.
- Rejected follow-up paths are visible in the service contract where required by the Fiori UI and CAP handlers.

Vietnamese:

- Service contract phải đủ để UI và handler xử lý flow `Rejected`: reject kèm lý do, hiển thị người xử lý tiếp, và đưa bug về `Assigned` hoặc `Pending Assignment` sau follow-up.
