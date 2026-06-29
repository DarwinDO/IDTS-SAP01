# Knowledge: `db/schema.cds`

## English

### What this file is for

This file defines the persistent CAP data model for IDTS.

In CAP, the `db/` layer describes the data that can be stored. `srv/service.cds` later projects selected parts of this model into OData, and Fiori consumes that OData metadata. So this file is the database blueprint behind the whole bug tracking application.

For a new SAP/CAP/Fiori learner, think of this file as the list of business nouns and relationships that IDTS stores: Bugs, Users, DeveloperProfiles, ComponentCategories, DeveloperResponsibilities, Comments, HistoryEvents, HistoryLogs, Notifications, DuplicateLinks, and Attachments.

### Beginner explanation

The main idea is that IDTS is not just a single `Bugs` table. A bug is the central record, but many other records explain or support it:

- Code lists store reusable values such as status, priority, severity, processor role, action type, and notification status.
- Users and DeveloperProfiles separate a person from their developer capacity and availability.
- Application Component + Defect Category combine into Component Category, which is the assignment key.
- DeveloperResponsibilities map a Developer to the component/category work they can handle, optionally scoped by SAP Module.
- Comments, attachments, history, notifications, and duplicate links are child/supporting records under a bug.

This model is the reason the backend can validate assignment, track lifecycle history, show PM monitoring, and support Fiori value helps.

### IDTS flow

1. CAP compiles `db/schema.cds` into database tables for local SQLite and later PostgreSQL/HANA-compatible targets.
2. CSV files in `db/data/` load seed rows into many of these entities.
3. `srv/service.cds` projects the model into `BugService`.
4. `srv/service.js` and modules under `srv/bug-service/` validate and update data based on this schema.
5. Fiori reads the service metadata generated from this model and displays fields, value helps, child tables, and actions.

### Important source anchors

- **Location**: `db/schema.cds:6`
  `aspect BugAttachments : ManagedAttachments { fileSize : Integer64 @readonly; }`
  **IDTS concept**: Attachment metadata model. IDTS uses `@cap-js/attachments` so bug evidence can be handled through the SAP-supported attachment pattern.
  **Impact if broken**: Attachment upload/download, file-size handling, external object-store acceptance, and Object Page attachment display can fail.
  **Must check together**: `srv/service.cds:4` `Bugs` projection, Object Page attachment facet, IDTS-31 attachment verification, object-store configuration docs.

- **Location**: `db/schema.cds:10`
  `aspect CodeList { key code, name, descr, sortOrder, active, criticality }`
  **IDTS concept**: Shared value-list shape. Statuses, priorities, severities, roles, action types, and notification values use the same code/name/criticality structure.
  **Impact if broken**: Fiori value helps and semantic colors can become inconsistent, and backend logic comparing status/action codes can stop matching seed data.
  **Must check together**: `db/data/idts.cap-*Values.csv`, `srv/bug-service/constants.js`, value-help annotations, List Report/Object Page criticality fields.

- **Location**: `db/schema.cds:40`
  `entity DeveloperProfiles : cuid, managed { ... availabilityStatus, workloadLimit, active }`
  **IDTS concept**: Developer capacity profile. A User becomes assignable as a Developer through a DeveloperProfile, with availability and workload data.
  **Impact if broken**: Assignee value help, workload monitoring, and assignment validation can show or accept wrong developers.
  **Must check together**: `srv/bug-service/bug-write.js:138`, `srv/bug-service/read-models.js:31`, `srv/bug-service/monitoring.js`, developer seed CSVs.

- **Location**: `db/schema.cds:73`
  `entity ComponentCategories : cuid, managed { component; defectCategory; active }`
  **IDTS concept**: Assignment key. It connects Application Component and Defect Category into the pair used for Developer responsibility matching.
  **Impact if broken**: IDTS cannot reliably derive who should fix a bug. Bugs may be assigned to unsuitable developers or remain pending assignment.
  **Must check together**: `srv/bug-service/bug-write.js:109`, `srv/service.cds:160` `ValidDefectCategories`, `db/data/idts.cap-ComponentCategories.csv`, Fiori dependent value helps.

- **Location**: `db/schema.cds:79`
  `entity DeveloperResponsibilities : cuid, managed { developerProfile; componentCategory; sapModule; responsibilityLevel; active }`
  **IDTS concept**: Developer matching rule. This maps Developers to the component/category work they can handle, optionally scoped by SAP Module.
  **Impact if broken**: Assignment validation and AssignableDevelopers value help lose business meaning; workload can look correct while bugs are assigned to the wrong person.
  **Must check together**: `srv/bug-service/bug-write.js:138`, `srv/bug-service/read-models.js:31`, `db/data/idts.cap-DeveloperResponsibilities.csv`, Assignee value help annotations.

- **Location**: `db/schema.cds:87`
  `entity Bugs : cuid, managed { ... }`
  **IDTS concept**: Central aggregate. This is the main bug record and stores classification, ownership, lifecycle, planning, test context, and links to child records.
  **Impact if broken**: Create/edit flow, OData metadata, Fiori screens, backend handlers, history, notification, duplicate tracking, and PM monitoring can all break.
  **Must check together**: `srv/service.cds:4`, `srv/service.js`, `srv/bug-service/*`, `app/bug-management-ui/annotations/object-page.cds`, `db/data/idts.cap-Bugs.csv`.

- **Location**: `db/schema.cds:114-118`
  `comments`, `attachments`, `historyEvents`, `notifications`, `duplicateLinks` compositions
  **IDTS concept**: Bug-owned supporting data. These records belong to a bug lifecycle and are displayed as child sections or supporting audit data.
  **Impact if broken**: Object Page child tables can disappear, audit history can detach from bugs, and attachment/notification records can become inconsistent.
  **Must check together**: `srv/service.cds` child projections, `history-notifications.cds`, Object Page facets, comment/attachment/history tests.

- **Location**: `db/schema.cds:128` and `:151`
  `entity HistoryEvents` and `entity HistoryLogs`
  **IDTS concept**: Two-layer audit model. `HistoryEvents` gives user-readable timeline entries; `HistoryLogs` stores detailed field-level changes.
  **Impact if broken**: PM and testers lose reliable evidence of who changed what and why; SAP490 Test And Fix Bug evidence becomes weaker.
  **Must check together**: `srv/bug-service/history.js`, `srv/bug-service/history-read-models.js`, history Object Page annotations, SAP490 bug staging process.

### Cross-folder impact

- `srv/service.cds` projects this schema into `BugService`; service fields and actions depend on these entity names and associations.
- `srv/bug-service/bug-write.js` uses this model to validate required bug data, derive component category, validate assignee, and set next processor.
- `srv/bug-service/actions.js` updates fields from this model when lifecycle buttons are clicked.
- Fiori annotations under `app/bug-management-ui/annotations/` bind to fields that originate here through the service layer.
- CSV seed files under `db/data/` must match the entity fields and IDs defined here.

### Safe editing checklist

- Do not rename fields casually; service projections, handlers, annotations, tests, and seed data can all depend on them.
- Keep the model portable across SQLite, PostgreSQL, and future HANA-compatible deployment; avoid vendor-specific SQL assumptions.
- When changing `Bugs`, check create/update validation, lifecycle actions, Object Page annotations, List Report filters, and SAP490 tests.
- When changing code lists, check seed CSV values and backend constants that compare codes.
- Keep English and Vietnamese explanations equivalent.

## Vietnamese

### File này dùng để làm gì

File này định nghĩa data model lưu trữ của CAP cho IDTS.

Trong CAP, lớp `db/` mô tả dữ liệu nào có thể được lưu. Sau đó `srv/service.cds` project một phần model này ra OData, và Fiori dùng metadata OData đó. Vì vậy file này là bản thiết kế database phía sau toàn bộ ứng dụng bug tracking.

Với người mới học SAP/CAP/Fiori, hãy hiểu file này như danh sách các “danh từ nghiệp vụ” và quan hệ mà IDTS lưu: Bugs, Users, DeveloperProfiles, ComponentCategories, DeveloperResponsibilities, Comments, HistoryEvents, HistoryLogs, Notifications, DuplicateLinks và Attachments.

### Giải thích cho người mới

Ý chính là IDTS không chỉ có một bảng `Bugs`. Bug là record trung tâm, nhưng nhiều record khác giải thích hoặc hỗ trợ nó:

- Code lists lưu các giá trị dùng lại như status, priority, severity, processor role, action type và notification status.
- Users và DeveloperProfiles tách “người dùng” khỏi “năng lực Developer” và availability.
- Application Component + Defect Category kết hợp thành Component Category, là khóa phân công.
- DeveloperResponsibilities map Developer với component/category mà họ có thể xử lý, có thể giới hạn thêm theo SAP Module.
- Comments, attachments, history, notifications và duplicate links là dữ liệu con hoặc dữ liệu hỗ trợ bên dưới bug.

Model này là lý do backend có thể validate assignment, ghi lifecycle history, hiển thị PM monitoring và hỗ trợ Fiori value helps.

### Flow hoạt động trong IDTS

1. CAP compile `db/schema.cds` thành database tables cho SQLite local và các target tương thích PostgreSQL/HANA sau này.
2. Các file CSV trong `db/data/` load seed rows vào nhiều entity.
3. `srv/service.cds` project model này thành `BugService`.
4. `srv/service.js` và các module trong `srv/bug-service/` validate và update dữ liệu dựa trên schema này.
5. Fiori đọc service metadata sinh từ model này và hiển thị fields, value helps, child tables và actions.

### Important source anchors

- **Vị trí**: `db/schema.cds:6`
  `aspect BugAttachments : ManagedAttachments { fileSize : Integer64 @readonly; }`
  **Khái niệm IDTS**: Model metadata cho attachment. IDTS dùng `@cap-js/attachments` để xử lý evidence file theo pattern attachment được SAP/CAP hỗ trợ.
  **Ảnh hưởng nếu sai**: Upload/download attachment, file-size handling, external object-store acceptance và attachment display trên Object Page có thể fail.
  **Phải kiểm tra cùng**: `srv/service.cds:4` projection `Bugs`, attachment facet trên Object Page, verification IDTS-31, tài liệu cấu hình object store.

- **Vị trí**: `db/schema.cds:10`
  `aspect CodeList { key code, name, descr, sortOrder, active, criticality }`
  **Khái niệm IDTS**: Shape dùng chung cho value list. Status, priority, severity, role, action type và notification values dùng cùng cấu trúc code/name/criticality.
  **Ảnh hưởng nếu sai**: Fiori value helps và semantic colors có thể không nhất quán, backend logic so sánh status/action codes có thể không khớp seed data.
  **Phải kiểm tra cùng**: `db/data/idts.cap-*Values.csv`, `srv/bug-service/constants.js`, value-help annotations, các field criticality trên List Report/Object Page.

- **Vị trí**: `db/schema.cds:40`
  `entity DeveloperProfiles : cuid, managed { ... availabilityStatus, workloadLimit, active }`
  **Khái niệm IDTS**: Hồ sơ năng lực Developer. Một User chỉ trở thành Developer có thể assign khi có DeveloperProfile, availability và workload data.
  **Ảnh hưởng nếu sai**: Assignee value help, workload monitoring và assignment validation có thể hiện hoặc chấp nhận sai Developer.
  **Phải kiểm tra cùng**: `srv/bug-service/bug-write.js:138`, `srv/bug-service/read-models.js:31`, `srv/bug-service/monitoring.js`, các CSV seed Developer.

- **Vị trí**: `db/schema.cds:73`
  `entity ComponentCategories : cuid, managed { component; defectCategory; active }`
  **Khái niệm IDTS**: Khóa phân công. Nó nối Application Component và Defect Category thành cặp dùng để match Developer responsibility.
  **Ảnh hưởng nếu sai**: IDTS không derive được ai phù hợp để fix bug. Bug có thể bị assign sai Developer hoặc kẹt ở Pending Assignment.
  **Phải kiểm tra cùng**: `srv/bug-service/bug-write.js:109`, `srv/service.cds:160` `ValidDefectCategories`, `db/data/idts.cap-ComponentCategories.csv`, các dependent value helps của Fiori.

- **Vị trí**: `db/schema.cds:79`
  `entity DeveloperResponsibilities : cuid, managed { developerProfile; componentCategory; sapModule; responsibilityLevel; active }`
  **Khái niệm IDTS**: Rule match Developer. Entity này map Developer với component/category họ có thể xử lý, có thể giới hạn thêm theo SAP Module.
  **Ảnh hưởng nếu sai**: Assignment validation và AssignableDevelopers value help mất ý nghĩa nghiệp vụ; workload có thể nhìn đúng nhưng bug lại assign sai người.
  **Phải kiểm tra cùng**: `srv/bug-service/bug-write.js:138`, `srv/bug-service/read-models.js:31`, `db/data/idts.cap-DeveloperResponsibilities.csv`, Assignee value help annotations.

- **Vị trí**: `db/schema.cds:87`
  `entity Bugs : cuid, managed { ... }`
  **Khái niệm IDTS**: Aggregate trung tâm. Đây là bug record chính, lưu classification, ownership, lifecycle, planning, test context và liên kết tới dữ liệu con.
  **Ảnh hưởng nếu sai**: Create/edit flow, OData metadata, Fiori screens, backend handlers, history, notification, duplicate tracking và PM monitoring đều có thể hỏng.
  **Phải kiểm tra cùng**: `srv/service.cds:4`, `srv/service.js`, `srv/bug-service/*`, `app/bug-management-ui/annotations/object-page.cds`, `db/data/idts.cap-Bugs.csv`.

- **Vị trí**: `db/schema.cds:114-118`
  `comments`, `attachments`, `historyEvents`, `notifications`, `duplicateLinks` compositions
  **Khái niệm IDTS**: Dữ liệu hỗ trợ thuộc về bug. Các record này đi theo lifecycle của bug và được hiển thị như child sections hoặc audit data.
  **Ảnh hưởng nếu sai**: Child tables trên Object Page có thể biến mất, audit history có thể rời khỏi bug, attachment/notification records có thể không nhất quán.
  **Phải kiểm tra cùng**: Child projections trong `srv/service.cds`, `history-notifications.cds`, Object Page facets, comment/attachment/history tests.

- **Vị trí**: `db/schema.cds:128` và `:151`
  `entity HistoryEvents` và `entity HistoryLogs`
  **Khái niệm IDTS**: Audit model hai lớp. `HistoryEvents` tạo timeline dễ đọc cho user; `HistoryLogs` lưu thay đổi chi tiết từng field.
  **Ảnh hưởng nếu sai**: PM và Tester mất bằng chứng đáng tin về ai đã đổi gì và vì sao; evidence cho SAP490 Test And Fix Bug yếu đi.
  **Phải kiểm tra cùng**: `srv/bug-service/history.js`, `srv/bug-service/history-read-models.js`, history Object Page annotations, quy trình staging bug SAP490.

### Liên kết với file khác

- `srv/service.cds` project schema này thành `BugService`; service fields và actions phụ thuộc tên entity và associations ở đây.
- `srv/bug-service/bug-write.js` dùng model này để validate dữ liệu bug bắt buộc, derive component category, validate assignee và set next processor.
- `srv/bug-service/actions.js` cập nhật các field của model này khi user bấm lifecycle buttons.
- Fiori annotations trong `app/bug-management-ui/annotations/` bind vào các field bắt nguồn từ đây thông qua service layer.
- CSV seed files trong `db/data/` phải khớp entity fields và IDs được định nghĩa ở đây.

### Lưu ý khi sửa file này

- Không đổi tên field tùy tiện; service projections, handlers, annotations, tests và seed data đều có thể phụ thuộc vào chúng.
- Giữ model portable giữa SQLite, PostgreSQL và deployment target tương thích HANA sau này; tránh giả định SQL riêng của một vendor.
- Khi đổi `Bugs`, kiểm tra create/update validation, lifecycle actions, Object Page annotations, List Report filters và SAP490 tests.
- Khi đổi code lists, kiểm tra seed CSV values và backend constants đang so sánh code.
- Giữ English và Vietnamese tương đương nhau.

## IDTS-34 Auth Model Update

### English

- `Users.passwordHash` and `Users.passwordChangedAt` support custom email/password login. `Users` remains the internal business profile and role source; the password is never stored as plaintext.
- `AuthSessions` stores server-side login sessions. The browser receives a bearer token, while the database stores only `tokenHash`, user reference, expiry, revoke time, and user-agent metadata.
- `BugService.Users` must hide `passwordHash`; otherwise a normal OData user read could leak credential material.
- Check this model together with `srv/auth.cds`, `srv/auth.js`, `srv/auth/custom-auth.js`, `srv/auth/passwords.js`, and `scripts/qa/test-auth-foundation-programmatic.js`.

Important anchors:

- **Location**: `db/schema.cds`, `Users.passwordHash`
  **IDTS concept**: Login credential hash for custom auth.
  **Impact if broken**: Active users cannot log in, or sensitive hash material could leak.
  **Must check together**: `srv/auth.js`, `srv/auth/passwords.js`, `srv/service.cds`.

- **Location**: `db/schema.cds`, `AuthSessions.tokenHash`
  **IDTS concept**: Server-side session record for bearer-token auth.
  **Impact if broken**: Token lookup, logout, expiry checks, and request-user mapping fail.
  **Must check together**: `srv/auth/custom-auth.js`, `srv/auth.js`, auth QA script.

### Vietnamese

- `Users.passwordHash` va `Users.passwordChangedAt` ho tro custom login bang email/password. `Users` van la nguon profile va role noi bo; password that khong bao gio duoc luu plaintext.
- `AuthSessions` luu session login phia server. Browser nhan bearer token, con database chi luu `tokenHash`, user reference, thoi diem het han, thoi diem revoke va user-agent metadata.
- `BugService.Users` phai an `passwordHash`; neu khong, OData read binh thuong co the lam lo credential material.
- Khi sua phan nay phai kiem tra cung `srv/auth.cds`, `srv/auth.js`, `srv/auth/custom-auth.js`, `srv/auth/passwords.js`, va `scripts/qa/test-auth-foundation-programmatic.js`.

Anchor quan trong:

- **Vi tri**: `db/schema.cds`, `Users.passwordHash`
  **Khai niem IDTS**: Hash credential cho custom auth.
  **Anh huong neu sai**: User active khong login duoc, hoac hash nhay cam bi lo.
  **Phai kiem tra cung**: `srv/auth.js`, `srv/auth/passwords.js`, `srv/service.cds`.

- **Vi tri**: `db/schema.cds`, `AuthSessions.tokenHash`
  **Khai niem IDTS**: Session record phia server cho bearer-token auth.
  **Anh huong neu sai**: Lookup token, logout, check het han, va map request user se fail.
  **Phai kiem tra cung**: `srv/auth/custom-auth.js`, `srv/auth.js`, auth QA script.

## Metadata

- Source file: `db/schema.cds`
- Knowledge mirror: `docs/knowledge/db/schema.cds.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-06-22
