# Knowledge: `db/data/idts.cap-DeveloperResponsibilities.csv`

## English

### What this file is for

This file answers: “For which component/category and optional SAP module is a Developer suitable?” One DeveloperProfile can have several rows. That is why the backend deduplicates candidates before Fiori displays them.

IDTS-90 adds 22 rows across ten synthetic profiles. The data includes `PRIMARY`, `BACKUP` and `EXPERT` examples and covers Fiori, CAP, database, assignment and integration categories.

IDTS-122 adds eight active, ANY-module rows for the four AI classification pairs. The stable matrix maps `CAP_BACKEND`, `INTEGRATION`, `PERFORMANCE`, and `DATA_QUALITY` to ComponentCategory UUIDs ending in `028`, `029`, `030`, and `031`, respectively. Each pair has a primary and a backup candidate; these rows deliberately do not create another user or developer profile.

### Assignment flow

1. A bug receives an Application Component and Defect Category.
2. Backend derives/validates one `ComponentCategory`.
3. `readAssignableDevelopers` filters active responsibilities by that category and optional SAP module.
4. Smart Assign presents suitable candidates and supporting explanation.
5. When the user submits an assignee, `validateAssignee` checks the persisted responsibility again. The UI suggestion is not the security/integrity boundary.

### Column walkthrough

- `ID`: stable responsibility-row UUID.
- `developerProfile_ID`: the technical assignee profile.
- `componentCategory_ID`: assignment key combining application component and defect category.
- `sapModule_ID`: optional module scope. Empty means the responsibility is not restricted to one module.
- `responsibilityLevel_code`: `PRIMARY`, `BACKUP` or `EXPERT`; this helps explain suitability but does not auto-assign.
- `active`: only active rows participate in normal matching.

### Cross-folder links

- `db/schema.cds`: defines DeveloperResponsibilities and its associations.
- `srv/bug-service/read-models.js`, `readAssignableDevelopers`: filters and deduplicates these rows.
- `srv/bug-service/bug-write.js`, `validateAssignee`: rejects an unsuitable submitted assignee.
- `srv/service.cds`, `AssignableDevelopers`: safe read-model contract exposed to Fiori.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`: displays capability and availability; it must not auto-select a candidate.

### Safe editing checklist

- Every foreign key must exist in Profiles, ComponentCategories and optional SAPModules.
- Every new profile should have at least two meaningful rows.
- Avoid duplicate responsibility tuples that add no meaning.
- Do not treat responsibility level as permission to bypass backend checks.
- Test filtered and unfiltered Smart Assign, invalid assignee rejection and workload reads.

## Vietnamese

### File này dùng để làm gì

File này trả lời câu hỏi: “Developer phù hợp với component/category nào và có bị giới hạn theo SAP module không?” Một DeveloperProfile có thể có nhiều dòng. Vì vậy backend phải deduplicate candidate trước khi Fiori hiển thị.

IDTS-90 thêm 22 dòng cho mười profile giả lập. Dữ liệu có đủ ví dụ `PRIMARY`, `BACKUP`, `EXPERT` và bao phủ nhóm Fiori, CAP, database, assignment, integration.

IDTS-122 thêm tám dòng active, ANY-module cho bốn cặp phân loại AI. Stable matrix ánh xạ `CAP_BACKEND`, `INTEGRATION`, `PERFORMANCE`, và `DATA_QUALITY` tới ComponentCategory UUID có bốn chữ số cuối lần lượt là `028`, `029`, `030`, và `031`. Mỗi cặp có một candidate primary và một candidate backup; các dòng này không tạo thêm user hoặc developer profile.

### Luồng assignment

1. Bug được chọn Application Component và Defect Category.
2. Backend derive hoặc validate một `ComponentCategory`.
3. `readAssignableDevelopers` lọc responsibility active theo category đó và SAP module nếu có.
4. Smart Assign trình bày candidate phù hợp cùng lời giải thích.
5. Khi user submit assignee, `validateAssignee` kiểm tra lại responsibility đã persist. Gợi ý UI không phải ranh giới bảo vệ dữ liệu.

### Giải thích từng cột

- `ID`: UUID ổn định của một dòng responsibility.
- `developerProfile_ID`: profile kỹ thuật dùng làm assignee.
- `componentCategory_ID`: khóa assignment kết hợp application component và defect category.
- `sapModule_ID`: phạm vi module tùy chọn. Để trống nghĩa là responsibility không bị giới hạn vào một module.
- `responsibilityLevel_code`: `PRIMARY`, `BACKUP` hoặc `EXPERT`; dùng để giải thích độ phù hợp, không tự động assign.
- `active`: chỉ dòng active tham gia matching bình thường.

### Liên kết với file ở folder khác

- `db/schema.cds`: định nghĩa DeveloperResponsibilities và association.
- `srv/bug-service/read-models.js`, `readAssignableDevelopers`: filter và deduplicate các dòng này.
- `srv/bug-service/bug-write.js`, `validateAssignee`: từ chối assignee được submit nếu không phù hợp.
- `srv/service.cds`, `AssignableDevelopers`: contract read model an toàn cho Fiori.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`: hiển thị capability và availability; không được tự chọn candidate.

### Checklist sửa an toàn

- Mọi foreign key phải tồn tại trong Profiles, ComponentCategories và SAPModules nếu có.
- Mỗi profile mới nên có ít nhất hai responsibility có ý nghĩa.
- Tránh tuple responsibility trùng lặp nhưng không thêm ý nghĩa.
- Không xem responsibility level là quyền bỏ qua backend validation.
- Test Smart Assign có/không filter, từ chối assignee sai và workload read.

## Metadata

- Source: `db/data/idts.cap-DeveloperResponsibilities.csv`
- Rows after IDTS-122 catalog integration: 38
- Last reviewed: 2026-08-06
