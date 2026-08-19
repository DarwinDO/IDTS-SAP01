# Knowledge: `db/schema.cds`

## User-admin Developer profile additions / Bổ sung Developer profile cho User Admin

`DeveloperProfiles.administrationVersion` supports optimistic PM updates. `UserOnboardingRequests` owns one `UserOnboardingDeveloperProfiles` header and many `UserOnboardingDeveloperResponsibilities`. Together they form the desired availability/workload and Component Category, optional SAP Module, and responsibility-level snapshot used only after provider readback. Keeping the desired profile in new request-owned tables avoids changing the existing onboarding table and its seed-data dependency during the additive HANA migration.

`DeveloperProfiles.administrationVersion` hỗ trợ optimistic update của PM. `UserOnboardingRequests` sở hữu một header `UserOnboardingDeveloperProfiles` và nhiều `UserOnboardingDeveloperResponsibilities`. Hai phần tạo snapshot availability/workload, Component Category, SAP Module tùy chọn và responsibility level chỉ materialize sau provider readback. Tách profile mong muốn sang các bảng request-owned mới giúp migration HANA additive không sửa bảng onboarding cũ và không kéo theo seed-data dependency.

## Controlled user onboarding (2026-08-12)

`UserOnboardingRequests` stores the requested PM/Tester/Developer role, optional PM-only UserAdmin overlay, requester, state, expiry, token hash/nonce, correlation ID, and the verified external identity snapshot. A fixed 64-character `identityKeyHash` enforces external-identity uniqueness without creating a long cross-database index over issuer and subject strings. `identityPlatformUserId` separately stores the CAP/XSUAA-validated `payload.user_id` needed to address the exact SCIM shadow user; it is not part of the immutable Global User ID hash and is not exposed by the public service projection. A nullable 64-character `openRequestKey` hashes the normalized target email and prevents concurrent live invitations; a later terminal-state transition must clear it. `UserOnboardingDeliveries` is a separate retry/lock record that does not store the raw signed URL or provider credential. These entities are additive; existing `Users` rows remain compatible and are not backfilled by this source change.

`UserIdentityAuditEvents.onboardingRequest` is nullable only for the controlled legacy-PM bootstrap, where no invitation exists. Bootstrap rows require `action=BOOTSTRAP_LINK`, one actor/target user, before/after identity-state hashes and a unique `(correlationId, action)` pair. Normal provisioning audit rows continue to reference their onboarding request. This relaxation does not expose the audit entity through a public service.

`UserAccessOperations` is the versioned, idempotent operation journal for provision, role change and revoke. It stores only desired allowlisted access, lease hash/timestamps, bounded retry state, safe result codes and a provider-correlation hash. `UserIdentityAuditEvents` is append-only administration evidence separate from Bug history. Neither entity stores an OAuth token, API credential, raw provider response, endpoint, or full provider payload. These are source candidates only until the additive HANA migration is reviewed and approved.

`Users.externalIdentityOrigin`, `externalIdentityIssuer`, `externalIdentitySubject`, and the unique `externalIdentityKeyHash` are nullable for the existing legacy rows. Once a row is linked, the hash is the mapping authority. Email and display name can still change for communication/display, but cannot match over a different non-null identity hash. No automatic backfill or HANA migration is performed by the source change.

Rollout order is mandatory: migrate the nullable columns/constraint, prove the live `user_uuid` claim, audit collisions, and link controlled rows before deploying the immutable runtime. Deploying the runtime first intentionally fails closed and would deny every existing BTP row whose hash is still null.

## IDTS-122 retest ownership

`Bugs.retestOwner` is a nullable association to `Users`. It stores the durable Tester responsible for retest across close/reopen and is deliberately separate from Developer `assignee` and current-action `nextProcessorUser`. HANA rollout is additive and requires a controlled migration for active and draft artifacts; never use broad deploy/seed to introduce this column.

## IDTS-97 operational fields

`AiSuggestions.operationStatus` and `latencyMs` persist only a normalized provider outcome and non-negative duration. They support privacy-safe reliability aggregation; they must never be replaced with raw errors, prompts, responses, endpoints, or credentials. Missing latency remains null and is excluded from averages.

## Beginner-first data map (2026-07-18)

### English

#### How to read this file

An `entity` becomes persisted database structure; an `Association` stores/uses a foreign-key link; a `Composition` means the child belongs to the parent aggregate; `cuid` adds UUID ID and `managed` adds created/modified audit fields. `srv/service.cds` projects selected entities to OData, and JavaScript handlers enforce rules before/after persistence.

#### Entity groups and boundaries

- `CodeList` and its children store stable codes/labels/active flags used by value helps and backend validation.
- `Users/AuthSessions` own custom authentication. Password/token raw values are never columns; only hashes are stored.
- `DeveloperProfiles` extends a User for assignment. `ComponentCategories` bridges component/category; `DeveloperResponsibilities` links a DeveloperProfile to that bridge and optional SAP module.
- `Bugs` is the aggregate root. Reporter, assignee and next processor are different concepts. Comments, attachments, history, notifications, duplicate links and AI suggestions are child/related records.
- Attachment metadata/storage reference is database data, while binary content is managed by the attachment storage adapter (S3 in Shared QA).
- Attachment `content` uses `@Core.ContentDisposition.Type: 'attachment'` so the standard plugin facet downloads evidence files instead of previewing raw content inline.
- `HistoryEvents/HistoryLogs` are immutable audit meaning: one event per user action, child logs per changed field.
- `Notifications/NotificationDeliveries` separate business notification from provider delivery/outbox retry.
- `DuplicateLinks` records a human-confirmed relation; `AiSuggestions` records review evidence. Neither is the AI model itself.

#### Create request and data effects

Draft NEW creates a draft Bugs row and sets reporter. PATCH updates draft fields/child attachments. SAVE activates the Bugs row; compositions become attached to the active Bug. Backend code derives componentCategory/status/next processor and later inserts history/notification rows. Follow a bad value from this field definition → projection in `srv/service.cds` → handler in `srv/service.js`/`bug-service` → OData payload/UI annotation.

#### Debug and safe editing

For missing/wrong data, inspect the entity field and generated foreign-key name, then the active/draft database row, then the handler that writes it. Do not compare Users.ID with DeveloperProfiles.ID. Schema changes require migration/deploy and synchronized projections, handlers, annotations, tests and mirror updates. Do not run a seed-loading deploy on Shared QA without a data-preservation plan.

### Vietnamese

#### Cách đọc file này

Một `entity` trở thành cấu trúc được persist trong database; `Association` lưu/dùng liên kết foreign key; `Composition` nghĩa là child thuộc aggregate cha; `cuid` thêm UUID ID và `managed` thêm field audit created/modified. `srv/service.cds` projection các entity cần thiết ra OData, còn JavaScript handler áp rule trước/sau persist.

#### Các nhóm entity và ranh giới

- `CodeList` và entity con lưu code/label/active ổn định cho value help và backend validation.
- `Users/AuthSessions` giữ custom authentication. Password/token thô không bao giờ là cột; chỉ lưu hash.
- `DeveloperProfiles` mở rộng User cho assignment. `ComponentCategories` nối component/category; `DeveloperResponsibilities` nối DeveloperProfile với bridge đó và SAP module tùy chọn.
- `Bugs` là aggregate root. Reporter, assignee và next processor là ba khái niệm khác nhau. Comment, attachment, history, notification, duplicate link và AI suggestion là dữ liệu con/liên quan.
- Metadata/storage reference attachment nằm trong database, còn binary content do attachment storage adapter quản lý (S3 trên Shared QA).
- `content` của attachment dùng `@Core.ContentDisposition.Type: 'attachment'` để facet chuẩn của plugin tải evidence file thật thay vì preview raw content inline.
- `HistoryEvents/HistoryLogs` là audit bất biến về ý nghĩa: một event cho một thao tác user, child log cho từng field đổi.
- `Notifications/NotificationDeliveries` tách notification nghiệp vụ khỏi provider delivery/outbox retry.
- `DuplicateLinks` ghi quan hệ đã được người dùng xác nhận; `AiSuggestions` ghi evidence review. Không entity nào là AI model.

#### Request Create và ảnh hưởng dữ liệu

Draft NEW tạo draft Bugs row và gắn reporter. PATCH cập nhật field draft/attachment con. SAVE activate Bugs row; composition được gắn vào Bug active. Backend suy ra componentCategory/status/next processor rồi insert history/notification. Hãy lần giá trị sai từ field tại đây → projection trong `srv/service.cds` → handler trong `srv/service.js`/`bug-service` → OData payload/UI annotation.

#### Debug và sửa an toàn

Khi dữ liệu thiếu/sai, xem field entity và tên foreign key generated, rồi row active/draft trong DB, rồi handler ghi nó. Không so Users.ID với DeveloperProfiles.ID. Đổi schema cần migration/deploy và đồng bộ projection, handler, annotation, test, mirror. Không chạy deploy nạp seed lên Shared QA nếu chưa có kế hoạch giữ dữ liệu.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: every persisted IDTS flow. Start debugging at the entity and association used by the failing request, then trace to `srv/service.cds` and the matching `srv/` handler. Changing a field, association, composition, or constraint can affect OData metadata, validation, Fiori bindings, and seed data together.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: mọi luồng IDTS có persist. Khi debug, bắt đầu từ entity/association của request lỗi, rồi lần sang `srv/service.cds` và handler `srv/` tương ứng. Đổi field, association, composition hoặc constraint có thể đồng thời ảnh hưởng OData metadata, validation, Fiori binding và seed data.

## 2026-07-01 update: catalog referential integrity

### English

The `priority`, `severity`, and `environment` associations on `Bugs` now use `@assert.target`. CAP therefore confirms that the referenced catalog row exists; a client cannot store a made-up code such as `1` merely because it fits the database column type.

`@assert.target` protects existence. The Node.js write validator additionally protects `active=true`, because a catalog row can exist but be retired from business use.

- **Location**: `Bugs.priority`, `Bugs.severity`, and `Bugs.environment`
  **IDTS concept**: Classification fields point to controlled master data.
  **Impact if broken**: Reports, criticality colors, and value helps can contain orphaned or retired values.
  **Must check together**: catalog CSV files, `bug-write.js`, draft validation, and Fiori fixed value lists.

### Vietnamese

Ba association `priority`, `severity` và `environment` của `Bugs` hiện dùng `@assert.target`. CAP vì vậy phải xác nhận dòng catalog được tham chiếu tồn tại; client không thể lưu code tự chế như `1` chỉ vì giá trị đó vẫn vừa kiểu cột database.

`@assert.target` bảo vệ việc target tồn tại. Validator Node.js bảo vệ thêm `active=true`, vì một dòng catalog có thể còn trong database nhưng đã ngừng dùng trong nghiệp vụ.

- **Vị trí**: `Bugs.priority`, `Bugs.severity` và `Bugs.environment`
  **Khái niệm IDTS**: Field phân loại phải trỏ đến master data có kiểm soát.
  **Ảnh hưởng nếu sai**: Report, màu criticality và value help có thể chứa giá trị mồ côi hoặc đã ngừng dùng.
  **Phải kiểm tra cùng**: các file CSV catalog, `bug-write.js`, draft validation và fixed value list của Fiori.

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

## IDTS-36 Notification Delivery Model Update

### English

`Notifications` now remains the source event shown inside IDTS, while `NotificationDeliveries` records the separate attempt to deliver that event by email. This separation matters: a bug assignment can be committed even when SMTP is unavailable, and the team can still see whether the email is pending, sent, failed, or skipped.

- **Location**: `db/schema.cds:178-186`
  `Notifications` and its `deliveries` composition
  **IDTS concept**: One business event can own one or more channel-specific delivery records. The current source notification is `IN_APP/SENT`; email has its own lifecycle.
  **Impact if broken**: In-app notification state and SMTP state become mixed together, making UI status and troubleshooting misleading.
  **Must check together**: `srv/email/outbox.js`, `srv/service.cds:99-126`, notification UI annotations.

- **Location**: `db/schema.cds:189-207`
  `entity NotificationDeliveries : cuid, managed`
  **IDTS concept**: Durable email outbox containing the frozen recipient/payload, attempt counters, retry timing, safe error summary, provider message ID, and worker lock.
  **Impact if broken**: Email can be lost, retried forever, duplicated by concurrent workers, or become impossible to diagnose.
  **Must check together**: All modules under `srv/email/`, IDTS-36 tests, delivery-status code-list seed.

- **Location**: `db/schema.cds:209`
  `@assert.unique.notificationChannel: [ notification, channel ]`
  **IDTS concept**: At most one EMAIL delivery row per source notification.
  **Impact if broken**: Re-running notification creation can enqueue duplicate email for the same event.
  **Must check together**: `writeNotificationRecord` and unique-constraint test.

Existing historical notification rows are not automatically converted into email outbox rows and are not resent. This prevents IDTS-36 deployment from emailing old events unexpectedly.

### Vietnamese

`Notifications` tiếp tục là source event hiển thị trong IDTS, còn `NotificationDeliveries` ghi riêng kết quả giao event đó qua email. Việc tách này rất quan trọng: action assign bug vẫn commit được khi SMTP ngừng hoạt động, đồng thời team vẫn biết email đang chờ, đã gửi, bị lỗi hay bị bỏ qua.

- **Vị trí**: `db/schema.cds:178-186`
  `Notifications` và composition `deliveries`
  **Khái niệm IDTS**: Một business event có thể sở hữu delivery record riêng theo từng channel. Notification nguồn hiện là `IN_APP/SENT`; email có lifecycle riêng.
  **Ảnh hưởng nếu sai**: Trạng thái notification trong app và trạng thái SMTP bị trộn, làm UI và việc điều tra lỗi trở nên sai lệch.
  **Phải kiểm tra cùng**: `srv/email/outbox.js`, `srv/service.cds:99-126`, annotation notification UI.

- **Vị trí**: `db/schema.cds:189-207`
  `entity NotificationDeliveries : cuid, managed`
  **Khái niệm IDTS**: Email outbox bền vững, lưu snapshot recipient/payload, số lần thử, lịch retry, lỗi an toàn, provider message ID và worker lock.
  **Ảnh hưởng nếu sai**: Email có thể bị mất, retry vô hạn, bị nhiều worker gửi trùng hoặc không còn đủ dữ liệu để điều tra.
  **Phải kiểm tra cùng**: Toàn bộ module trong `srv/email/`, test IDTS-36, seed delivery-status.

- **Vị trí**: `db/schema.cds:209`
  `@assert.unique.notificationChannel: [ notification, channel ]`
  **Khái niệm IDTS**: Mỗi source notification chỉ có tối đa một EMAIL delivery.
  **Ảnh hưởng nếu sai**: Chạy lại bước tạo notification có thể enqueue hai email cho cùng event.
  **Phải kiểm tra cùng**: `writeNotificationRecord` và unique-constraint test.

Notification lịch sử không tự được tạo outbox và không được gửi lại. Rule này tránh việc deploy IDTS-36 vô tình gửi hàng loạt event cũ.

## IDTS-65 AI Suggestion Audit Model

### English

IDTS-65 adds a small audit model for AI suggestions. The new persistence entity is `AiSuggestions`, and it is attached to `Bugs` through `Bugs.aiSuggestions`.

The important idea is that an AI result is not stored as a final decision. It is stored as a suggestion that belongs to a source bug and has a human review state. This supports the approved AI guardrail: AI may help, but it cannot assign, classify, confirm duplicates, or change workflow state by itself.

Important anchors:

- **Location**: `db/schema.cds`, `entity AiSuggestionFeatureTypes : CodeList {}`
  **IDTS concept**: Allowed AI feature types.
  **Impact if broken**: Future AI features may write inconsistent type codes, making filtering and review unreliable.
  **Must check together**: `db/data/idts.cap-AiSuggestionFeatureTypes.csv`, `srv/ai/audit.js`.

- **Location**: `db/schema.cds`, `entity AiSuggestionReviewStates : CodeList {}`
  **IDTS concept**: Human review state for each AI suggestion.
  **Impact if broken**: The system may lose the difference between pending, accepted, rejected, ignored, and expired AI output.
  **Must check together**: `db/data/idts.cap-AiSuggestionReviewStates.csv`, future IDTS-70 review UI.

- **Location**: `db/schema.cds`, `Bugs.aiSuggestions`
  **IDTS concept**: AI suggestion ownership by source bug.
  **Impact if broken**: A suggestion may lose the bug context needed for review, reporting, and audit.
  **Must check together**: `entity AiSuggestions`, `srv/service.cds` `BugService.AiSuggestions`.

- **Location**: `db/schema.cds`, `entity AiSuggestions`
  **IDTS concept**: Persisted safe suggestion record.
  **Impact if broken**: Future AI feature tasks may have no durable, reviewable audit trail or may store unsafe provider data elsewhere.
  **Must check together**: `srv/ai/audit.js`, `srv/service.cds`, IDTS-65 QA script.

Safe editing checklist:

- Keep `AiSuggestions` tied to `Bugs`; IDTS v1 AI suggestions are bug-context suggestions, not global AI records.
- Do not add raw prompt, raw provider response, credential, attachment content, or storage reference fields.
- Keep review state as an association to a code list so UI and reporting can show readable labels.

### Vietnamese

IDTS-65 thêm model audit nhỏ cho AI suggestion. Entity lưu thật là `AiSuggestions`, và nó được gắn với `Bugs` qua `Bugs.aiSuggestions`.

Ý chính là kết quả AI không được lưu như quyết định cuối. Nó được lưu như suggestion thuộc một bug nguồn và có trạng thái review bởi con người. Điều này khớp guardrail AI đã duyệt: AI có thể hỗ trợ, nhưng không được tự assign, tự phân loại, tự xác nhận duplicate hoặc tự đổi workflow state.

Important anchors:

- **Vị trí**: `db/schema.cds`, `entity AiSuggestionFeatureTypes : CodeList {}`
  **Khái niệm IDTS**: Các loại AI feature được phép.
  **Ảnh hưởng nếu sai**: Feature AI sau này có thể ghi type code không nhất quán, làm filter và review không đáng tin.
  **Phải kiểm tra cùng**: `db/data/idts.cap-AiSuggestionFeatureTypes.csv`, `srv/ai/audit.js`.

- **Vị trí**: `db/schema.cds`, `entity AiSuggestionReviewStates : CodeList {}`
  **Khái niệm IDTS**: Trạng thái human review cho từng AI suggestion.
  **Ảnh hưởng nếu sai**: Hệ thống có thể mất khả năng phân biệt AI output đang pending, accepted, rejected, ignored hoặc expired.
  **Phải kiểm tra cùng**: `db/data/idts.cap-AiSuggestionReviewStates.csv`, UI review tương lai IDTS-70.

- **Vị trí**: `db/schema.cds`, `Bugs.aiSuggestions`
  **Khái niệm IDTS**: AI suggestion thuộc về bug nguồn.
  **Ảnh hưởng nếu sai**: Suggestion có thể mất context bug cần cho review, reporting và audit.
  **Phải kiểm tra cùng**: `entity AiSuggestions`, `srv/service.cds` `BugService.AiSuggestions`.

- **Vị trí**: `db/schema.cds`, `entity AiSuggestions`
  **Khái niệm IDTS**: Record suggestion an toàn được lưu bền vững.
  **Ảnh hưởng nếu sai**: Các task AI sau này có thể không có audit trail để review hoặc lưu dữ liệu provider không an toàn ở nơi khác.
  **Phải kiểm tra cùng**: `srv/ai/audit.js`, `srv/service.cds`, QA script IDTS-65.

Lưu ý khi sửa:

- Giữ `AiSuggestions` gắn với `Bugs`; AI suggestion v1 của IDTS là suggestion theo context bug, không phải record AI global.
- Không thêm field raw prompt, raw provider response, credential, attachment content hoặc storage reference.
- Giữ review state là association tới code list để UI và report hiển thị label dễ đọc.
