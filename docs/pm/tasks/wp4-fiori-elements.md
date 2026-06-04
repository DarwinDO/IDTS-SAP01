# WP4 - Fiori Elements UX

Status: In Progress - core screens updated for WP2/WP3
Owner workstream: Fiori/UI5
Primary member: DatDT
Support: DonHV, NhanT
Last updated: 2026-06-04

Vietnamese: WP4 đang ở trạng thái In Progress. DatDT phụ trách chính Fiori/UI5; DonHV và NhanT hỗ trợ/review khi cần.

## Goal

Build the main IDTS List Report/Object Page experience using Fiori Elements where possible.

Vietnamese: Xây dựng trải nghiệm chính của IDTS bằng Fiori Elements List Report/Object Page nếu annotation có thể đáp ứng.

## Inputs

- `docs/ba/07-fiori-ux-requirements.md`
- WP1 data model.
- WP2 service contract.
- `app/bug-management-ui/`
- DatDT UI reference repo: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Integration review: `docs/knowledge/datdt-sap-fe-integration-review.md`

Vietnamese:

- `docs/ba/07-fiori-ux-requirements.md`
- WP1 data model.
- WP2 service contract.
- `app/bug-management-ui/`
- Repo UI tham khảo của DatDT: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Review tích hợp: `docs/knowledge/datdt-sap-fe-integration-review.md`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP4-T01 | Review generated Fiori app structure and DatDT `Sap_FE` reference. | Completed |
| WP4-T02 | Configure list report filters and table columns. | Completed for MVP; GridTable refinement applied |
| WP4-T03 | Configure object page sections for details, classification, assignment, comments, history, notifications. | Completed initial annotation pass |
| WP4-T04 | Add dependent value-help behavior where supported by annotations/service. | Completed for MVP annotation support; deeper UX QA pending |
| WP4-T05 | Add semantic status display. | Completed for MVP; semantic colors kept without default icons |
| WP4-T06 | Add visible Rejected follow-up information: rejection reason, nextProcessor/queue, and allowed follow-up actions. | Completed for MVP; fields and Object Page actions available |
| WP4-T07 | Verify UI with local preview and relevant lint/tooling. | Compile/build verification completed; browser smoke in progress |

Vietnamese:

| ID | Công việc | Trạng thái |
| --- | --- | --- |
| WP4-T01 | Review cấu trúc app Fiori generated và repo tham khảo `Sap_FE` của DatDT. | Hoàn thành |
| WP4-T02 | Cấu hình filter và cột table cho List Report. | Hoàn thành mức MVP; đã tinh chỉnh GridTable |
| WP4-T03 | Cấu hình các section Object Page cho detail, classification, assignment, comments, history, notifications. | Hoàn thành annotation ban đầu |
| WP4-T04 | Thêm dependent value-help khi annotation/service hỗ trợ. | Hoàn thành support annotation mức MVP; QA sâu còn chờ |
| WP4-T05 | Thêm hiển thị semantic status. | Hoàn thành mức MVP; giữ màu semantic nhưng bỏ icon mặc định |
| WP4-T06 | Hiển thị Rejected follow-up: rejection reason, nextProcessor/queue, và action tiếp theo. | Hoàn thành mức MVP; field và action đã có |
| WP4-T07 | Verify UI bằng local preview và lint/tooling phù hợp. | Đã hoàn thành compile/build verification; browser smoke đang kiểm tra |

## Current Implementation Notes

- DatDT's generated app was not copied directly because it targets a mock `Defects` service and placeholder URL.
- Useful UI ideas were translated into CAP CDS annotations for the existing `BugService.Bugs` service.
- Attachment upload was not copied because the DatDT fragment is static and the IDTS backend does not yet have a complete upload/storage flow.
- The current UI remains annotation-driven Fiori Elements; no custom SAPUI5 controller or fragment was added in this pass.
- Four IDTS-aligned demo bugs were added under `db/data/idts.cap-Bugs.csv` so the List Report shows data during local review.

Vietnamese:

- Không copy nguyên app generated của DatDT vì app đó trỏ tới mock service `Defects` và URL placeholder.
- Các ý tưởng UI hữu ích đã được chuyển thành CAP CDS annotation cho service hiện tại `BugService.Bugs`.
- Chưa copy attachment upload vì fragment của DatDT là static và backend IDTS chưa có flow upload/storage hoàn chỉnh.
- UI hiện tại vẫn theo hướng Fiori Elements annotation-driven; chưa thêm custom SAPUI5 controller hoặc fragment trong lần này.
- Đã thêm bốn bug demo phù hợp với IDTS trong `db/data/idts.cap-Bugs.csv` để List Report có dữ liệu khi review local.

## Definition of Done

- The user can inspect, create, and work with bug records through Fiori UI.
- UX follows SAP Fiori terminology and status semantics.
- Custom UI5 is used only when annotations are insufficient.
- Rejected bugs show why they were rejected and who must act next.
- Dependent value help and assignment candidate behavior are aligned with WP2/WP3 service logic.

Vietnamese:

- User có thể xem, tạo, và thao tác với bug record thông qua Fiori UI.
- UX dùng thuật ngữ SAP Fiori và semantic status.
- Chỉ dùng custom UI5 khi annotation không đủ đáp ứng.
- Bug `Rejected` phải làm rõ lý do reject và ai cần xử lý tiếp; không để user hiểu nhầm `Rejected` là đã kết thúc.
- Dependent value help và assignment candidate behavior phải khớp với logic service WP2/WP3.

## 2026-06-04 Implementation Update

English:

- Added Object Page action annotations for Assign Developer, Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug, and Reopen Bug.
- Added value help annotations so Create/Edit forms and filter fields can use meaningful value lists instead of raw IDs.
- Hid `componentCategory` from the main form because it is an internal assignment key derived by the backend from Application Component + Defect Category.
- Added value-help dialog table annotations for master data and Developer Responsibilities.
- Verified List Report renders through the direct app URL and Object Page route shows Bug Details, Assignment and Follow-up, Comments, Attachments, History, and Notifications sections.

Vietnamese:

- Đã thêm Object Page action annotations cho Assign Developer, Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug và Reopen Bug.
- Đã thêm value help annotations để form Create/Edit và filter field dùng value list có ý nghĩa thay vì raw ID.
- Đã ẩn `componentCategory` khỏi form chính vì đây là assignment key nội bộ được backend derive từ Application Component + Defect Category.
- Đã thêm annotation cột cho value-help dialog của master data và Developer Responsibilities.
- Đã verify List Report render qua direct app URL và Object Page route hiển thị các section Bug Details, Assignment and Follow-up, Comments, Attachments, History và Notifications.

## 2026-06-04 UI Refinement Update

English:

- Changed the List Report table from `ResponsiveTable` to `GridTable` to better use desktop width for the bug worklist.
- Changed create behavior from `NewPage` to `CreationDialog` and added `UI.FieldGroup#CreateBug` for the Create Bug dialog fields.
- Enabled CAP/Fiori draft support on `BugService.Bugs` with `@odata.draft.enabled` so SAP Fiori Elements OData V4 can show the standard Create button.
- Kept semantic criticality colors for Status, Priority, and Severity, but set `CriticalityRepresentation : #WithoutIcon` to remove distracting default icons.
- Added i18n text `C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE=Create Bug`.

Vietnamese:

- Đã đổi table List Report từ `ResponsiveTable` sang `GridTable` để tận dụng chiều ngang desktop tốt hơn cho bug worklist.
- Đã đổi create behavior từ `NewPage` sang `CreationDialog` và thêm `UI.FieldGroup#CreateBug` cho các field của dialog Create Bug.
- Đã bật CAP/Fiori draft support trên `BugService.Bugs` bằng `@odata.draft.enabled` để SAP Fiori Elements OData V4 hiển thị standard Create button.
- Vẫn giữ màu semantic criticality cho Status, Priority và Severity, nhưng thêm `CriticalityRepresentation : #WithoutIcon` để bỏ icon mặc định gây nhiễu.
- Đã thêm text i18n `C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE=Create Bug`.

## Remaining Notes

English: WP4 remains open for deeper browser QA, action usability tuning, and future attachment upload behavior. The current UI remains annotation-driven Fiori Elements; no custom UI5 controller or fragment was added.

Vietnamese: WP4 vẫn còn mở cho browser QA sâu hơn, tinh chỉnh usability của action và attachment upload thật sau này. UI hiện tại vẫn theo hướng Fiori Elements annotation-driven; chưa thêm custom UI5 controller hoặc fragment.
