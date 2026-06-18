# WP2 - Service and Value Help

Status: Completed for Sprint 1 MVP, refined in Sprint 2
Owner workstream: Backend CAP
Last updated: 2026-06-18

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

- WP2-T01 hoan thanh: da review projection hien tai cua `BugService` va giu service tap trung vao entity cua IDTS.
- WP2-T02 hoan thanh: Bugs, child entities, master data, responsibilities, history, notification va duplicate link van duoc expose qua OData V4.
- WP2-T03 hoan thanh: da them Fiori value help annotation cho status, priority, severity, environment, SAP module, application component, defect category, reporter, assignee va next processor role.
- WP2-T04 hoan thanh o muc MVP: da them bound OData actions tren `Bugs` chi cho cac action that trong vong doi bug.
- WP2-T05 hoan thanh: `cds compile srv app/bug-management-ui --to edmx` pass va metadata co `Common.ValueList` cung bound action definitions.

## 2026-06-18 Sprint 2 Refinement

English:

- `AssignableDevelopers` no longer exposes duplicate rows from `DeveloperResponsibilities`. The service now serves a deduplicated read model so value help shows one row per real developer.
- The assignee value help now receives both `componentCategory_ID` and `sapModule_ID` as input context, reducing mismatch between frontend selection and backend assignment validation.
- `assignee_ID` is exposed for both create draft and edit draft. The active Object Page still shows `assigneeDisplayName` as read-only display text.
- `Planning` fields are now visible again on the Object Page and are no longer annotation-locked as permanently read-only.

Vietnamese:

- `AssignableDevelopers` khong con bi duplicate do lay truc tiep tu `DeveloperResponsibilities`. Service gio phuc vu mot read model da deduplicate de value help chi hien mot dong cho moi developer thuc te.
- Value help cua assignee gio nhan ca `componentCategory_ID` va `sapModule_ID` lam input context, giup giam truong hop frontend chon duoc dev nhung backend lai tu choi vi scope khong khop.
- `assignee_ID` duoc expose cho ca create draft va edit draft. Active Object Page van hien `assigneeDisplayName` o che do read-only.
- Cac field `Planning` da duoc mo hien lai tren Object Page va khong con bi annotation khoa read-only mot cach co dinh.

## Remaining Notes

English:

- Backend validation remains the final source of truth for assignment scope.
- Browser automation still needs a clean auth-capable runtime path before this Sprint 2 refinement can be called fully UI-reverified.

Vietnamese:

- Backend validation van la nguon kiem tra cuoi cung cho assignment scope.
- Browser automation van can mot runtime path on dinh co auth de co the goi refinement Sprint 2 nay la da duoc UI reverify day du.

## Definition of Done

- Service metadata exposes required entities and associations.
- Value helps can support dependent Fiori selection.
- No unnecessary generic workflow APIs are added.
- Rejected follow-up paths are visible in the service contract where required by the Fiori UI and CAP handlers.

Vietnamese:

- Service contract phai du de UI va handler xu ly flow `Rejected`: reject kem ly do, hien thi nguoi xu ly tiep, va dua bug ve `Assigned` hoac `Pending Assignment` sau follow-up.
