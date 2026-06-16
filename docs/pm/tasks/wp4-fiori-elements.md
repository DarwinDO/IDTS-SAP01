# WP4 - Fiori Elements UX

Status: In Progress - Option B Create Flow completed, other WP4 elements in progress
Owner workstream: Fiori/UI5
Primary member: DatDT
Support: DonHV, NhanT
Last updated: 2026-06-16

Vietnamese: WP4 đang thực hiện - Đã hoàn thành Option B tạo bug sạch sẽ và verify thực tế; các phần khác của WP4 đang tiếp tục.

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
| WP4-T07 | Verify UI with local preview and relevant lint/tooling. | Completed; browser smoke tests verified on local server |
| WP4-T08 | Compare the standard full-page create flow (Option B) with a custom guided create page (Option C). | Option B finalized and verified; Option C kept as reference prototype |

Vietnamese:

| ID | Công việc | Trạng thái |
| --- | --- | --- |
| WP4-T01 | Review cấu trúc app Fiori generated và repo tham khảo `Sap_FE` của DatDT. | Hoàn thành |
| WP4-T02 | Cấu hình filter và cột table cho List Report. | Hoàn thành mức MVP; đã tinh chỉnh GridTable |
| WP4-T03 | Cấu hình các section Object Page cho detail, classification, assignment, comments, history, notifications. | Hoàn thành annotation ban đầu |
| WP4-T04 | Thêm dependent value-help khi annotation/service hỗ trợ. | Hoàn thành support annotation mức MVP; QA sâu còn chờ |
| WP4-T05 | Thêm hiển thị semantic status. | Hoàn thành mức MVP; giữ màu semantic nhưng bỏ icon mặc định |
| WP4-T06 | Hiển thị Rejected follow-up: rejection reason, nextProcessor/queue, và action tiếp theo. | Hoàn thành mức MVP; field và action đã có |
| WP4-T07 | Verify UI bằng local preview và lint/tooling phù hợp. | Hoàn thành; kiểm tra browser smoke đã xác nhận |
| WP4-T08 | So sánh create flow full-page chuẩn (Option B) với custom guided create page (Option C). | Option B đã hoàn thành, làm sạch và verify; Option C giữ làm prototype tham khảo |

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

## 2026-06-15 Selective Remake_UI Integration

English:

- Reviewed DatDT's `Remake_UI` branch and applied only the changes that fit the current CAP/Fiori contract.
- Moved `Assignment and Follow-up` above `Bug Details` on the Object Page so assignee, next processor user, and next processor role are visible earlier.
- Made `HistoryLogs` read-only through OData capability annotations: insert, update, and delete are disabled for the History child table.
- Changed create behavior from `CreationDialog` to `NewPage` because the create bug form has many required fields and the old dialog was too crowded.
- Preserved all required bug fields, `nextProcessorRole`, supporting info, and Object Page lifecycle actions.
- Browser smoke on the feature branch showed 4 bug rows in the List Report, Object Page sections in the intended order, and no create/edit/delete action in the History table.
- Remaining QA: manually complete a real create-save happy path in the browser and check whether row text navigation should be improved or documented as GridTable behavior.

Vietnamese:

- Đã review branch `Remake_UI` của DatDT và chỉ áp dụng các thay đổi phù hợp với contract CAP/Fiori hiện tại.
- Đưa section `Assignment and Follow-up` lên trước `Bug Details` trên Object Page để assignee, next processor user và next processor role dễ thấy hơn.
- Đặt `HistoryLogs` read-only bằng OData capability annotations: không cho insert, update và delete trong bảng History.
- Đổi create behavior từ `CreationDialog` sang `NewPage` vì form tạo bug có nhiều field bắt buộc và dialog cũ quá chật.
- Giữ nguyên toàn bộ required bug fields, `nextProcessorRole`, supporting info và các lifecycle actions trên Object Page.
- Browser smoke trên feature branch đã thấy 4 bug rows ở List Report, section Object Page đúng thứ tự mong muốn, và bảng History không có action create/edit/delete.
- QA còn lại: kiểm tra thủ công happy path tạo và save bug thật trên browser, đồng thời xem có cần cải thiện navigation khi bấm vào text trong GridTable hay chỉ cần ghi nhận là hành vi của GridTable.

## 2026-06-15 Create Flow Option B

English:

- Removed `Capabilities.InsertRestrictions.RequiredProperties` while keeping List Report creation mode as `NewPage`.
- Added `Common.FieldControl/Mandatory` to nine user-entered mandatory fields.
- Kept CAP handler validation and database constraints unchanged.
- Verified an empty draft activation returns HTTP 400 with mandatory-field errors.
- Verified a complete draft activation returns HTTP 201, generates a bug number, derives Component Category, assigns the fallback Tester reporter, and starts in `Pending Assignment`.
- Branch: `feature/idts-create-flow-option-b-donhv`.

## 2026-06-16 Assignee Value Help Display Fix

English:

- Added a dedicated `AssignableDevelopers` value-help projection so the Assignee picker shows developer name, email, availability, application component, defect category, SAP module scope, and responsibility level instead of technical database columns.
- Added `assigneeDisplayName` enrichment for both active `Bugs` and `Bugs.drafts`, allowing Fiori draft side-effect reads to show `DatDT` instead of the raw developer UUID after selection.
- Added property-level labels for common value-list entities so representative popups such as Priority show `Priority Code` and `Priority` instead of `code` and `name`.
- Verified with Playwright CLI only; Playwright MCP was not used.

Vietnamese:

- Thêm projection value help riêng `AssignableDevelopers` để popup chọn Assignee hiển thị tên developer, email, availability, application component, defect category, SAP module scope và responsibility level thay vì cột kỹ thuật trong database.
- Thêm enrichment `assigneeDisplayName` cho cả active `Bugs` và `Bugs.drafts`, giúp Fiori draft side-effect read hiển thị `DatDT` thay vì UUID của developer sau khi chọn.
- Thêm label ở property-level cho các value-list entity phổ biến để các popup đại diện như Priority hiển thị `Priority Code` và `Priority` thay vì `code` và `name`.
- Đã verify chỉ bằng Playwright CLI; không dùng Playwright MCP.

## 2026-06-16 SAP490 Functional/Test Deliverable Update

English:

- Generated SAP490 Functional Specification v0.1 as separate English and Vietnamese workbooks from the school `Functional_Specification.xlsx` template.
- Generated SAP490 Test and Fix Bug v0.2 as separate English and Vietnamese workbooks from the school `Test_And_Fix_Bug.xlsx` template.
- Functional Specification records the target C-prime Create/Object Page flow for WP4: General Information first, Classification and Assignment second, and Reproduction/Test Context third.
- Test and Fix Bug v0.2 records the fixed Assignee value help issues and the remaining layout refinement decision.

Vietnamese:

- Đã generate SAP490 Functional Specification v0.1 thành hai workbook tiếng Anh và tiếng Việt riêng từ template `Functional_Specification.xlsx` của trường.
- Đã generate SAP490 Test and Fix Bug v0.2 thành hai workbook tiếng Anh và tiếng Việt riêng từ template `Test_And_Fix_Bug.xlsx` của trường.
- Functional Specification ghi target flow C-prime cho Create/Object Page của WP4: General Information trước, Classification and Assignment thứ hai, và Reproduction/Test Context thứ ba.
- Test and Fix Bug v0.2 ghi các lỗi Assignee value help đã fix và decision refine layout còn lại.

Vietnamese:

- Bỏ `Capabilities.InsertRestrictions.RequiredProperties` và vẫn giữ creation mode của List Report là `NewPage`.
- Thêm `Common.FieldControl/Mandatory` cho chín field bắt buộc do người dùng nhập.
- Không thay đổi CAP handler validation và database constraint.
- Đã verify activate draft rỗng trả HTTP 400 cùng lỗi field bắt buộc.
- Đã verify draft đầy đủ activate thành công với HTTP 201, sinh bug number, derive Component Category, gán Tester reporter mặc định và bắt đầu ở `Pending Assignment`.
- Branch: `feature/idts-create-flow-option-b-donhv`.

## 2026-06-16 Option B Refinement and Backend Hardening

English:

- Refined Fiori annotations to dynamically hide child facets (Comments, Attachments, History, Notifications, Planning, and Rejected Follow-up) and system-managed fields (Bug Number, Status, Reporter, Created/Modified dates, Next Processor) during bug creation.
- Used OData V4 EDM JSON expressions based on `IsActiveEntity = false and HasActiveEntity = false` to target new creation drafts specifically, preventing layout disruption when editing existing bugs.
- Fixed the Assignee selection field by binding it directly to `assignee_ID` with Value Help, making it fully editable during creation.
- Hardened backend handlers in `srv/service.js` to always overwrite `bugNumber`, `reporter_ID` (with actual logged-in user ID), and `status_code` on bug creation, blocking client-side parameter injection.
- Verified using a Playwright browser subagent that the create page has a clean layout, hidden tables/planning/rejection facets, and a functional Assignee lookup.

Vietnamese:

- Tinh chỉnh annotations để ẩn động các child facets (Comments, Attachments, History, Notifications, Planning và Rejected Follow-up) cùng các field do hệ thống quản lý (Bug Number, Status, Reporter, Ngày tạo/cập nhật, Next Processor) khi tạo mới bug.
- Sử dụng biểu thức EDM JSON dựa trên `IsActiveEntity = false and HasActiveEntity = false` để ẩn chỉ trong quá trình tạo mới bản ghi nháp (creation draft), giữ nguyên giao diện đầy đủ khi chỉnh sửa hoặc xem bug cũ.
- Sửa lỗi gán Assignee bằng cách đổi binding trường hiển thị sang `assignee_ID` đi kèm Value Help, giúp trường này có thể nhập/chọn trên màn hình tạo.
- Thắt chặt bảo mật backend trong `srv/service.js` để luôn ghi đè `bugNumber`, `reporter_ID` (gán bằng user đang đăng nhập thực tế) và `status_code` khi tạo mới, chặn đứng việc client gửi tham số tùy tiện.
- Verify thực tế bằng Playwright browser subagent trên môi trường local, xác nhận màn hình tạo bug cực kỳ sạch sẽ, ẩn toàn bộ tab/field không liên quan và Value Help chọn Assignee chạy tốt.

## 2026-06-16 Role Action Visibility and Status Editability Fix

English:

- Fixed a backend read-gap in `srv/service.js`: Fiori Elements sometimes requests `canAssign`, `canResolve`, and related virtual capability flags without selecting `status_code` or `assignee_ID`.
- `enrichBugCapabilities` now loads missing `status_code` and `assignee_ID` by bug ID before computing action booleans, so capability flags no longer fall back to `false` incorrectly.
- Kept the Object Page `Status` field bound to `status.name` and explicitly marked both the rendered `UI.DataField` and `status_code` metadata as `Common.FieldControlType/ReadOnly`.
- This keeps workflow transitions on the approved bound actions instead of allowing users to open a generic status value help and hit backend transition errors.
- Added a case-insensitive fallback in `resolveRequestUser` for local dev, so mock logins like `donhv` still map to the IDTS user `DonHV` and show the correct action set.
- Verified in live `$metadata` that `BugService.Bugs/status_code` is now read-only and the `Status` field on the Object Page carries a read-only `Common.FieldControl` annotation.

Vietnamese:

- Đã sửa một lỗ hổng khi đọc dữ liệu trong `srv/service.js`: Fiori Elements đôi khi request các cờ ảo như `canAssign`, `canResolve` nhưng lại không select `status_code` hoặc `assignee_ID`.
- `enrichBugCapabilities` giờ sẽ tự đọc bù `status_code` và `assignee_ID` theo bug ID trước khi tính quyền action, nên các cờ capability không còn bị rơi sai về `false`.
- Giữ field `Status` trên Object Page bind tới `status.name` và khóa rõ ràng cả `UI.DataField` hiển thị lẫn metadata `status_code` bằng `Common.FieldControlType/ReadOnly`.
- Cách này buộc các chuyển trạng thái đi qua bound actions đã được duyệt, thay vì để user mở generic status value help rồi gặp lỗi transition từ backend.
- Đã thêm fallback không phân biệt hoa/thường trong `resolveRequestUser` cho local dev, nên mock login kiểu `donhv` vẫn map được tới user IDTS `DonHV` và hiển thị đúng bộ action.
- Đã verify trên `$metadata` thực tế rằng `BugService.Bugs/status_code` đã là read-only và DataField `Status` trên Object Page cũng mang annotation `Common.FieldControl` dạng read-only.
