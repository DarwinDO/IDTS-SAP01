# 09 - Database Model Review

Status: BA/technical review draft v2  
Last updated: 2026-06-04  
Scope: Review only. This document does not implement the CDS model.

Implementation note - 2026-06-04:

WP1 Data Model Foundation has now implemented the recommended baseline in CAP CDS, service projections, and CAP CSV seed data. Keep this review as the decision rationale for DB-Q01 to DB-Q08; use the current `db/schema.cds` and `srv/service.cds` as the implemented source of truth.

Vietnamese: Ghi chú implementation - 2026-06-04: WP1 Data Model Foundation đã implement baseline khuyến nghị trong CAP CDS, service projections và CAP CSV seed data. Giữ review này làm lý do quyết định cho DB-Q01 đến DB-Q08; dùng `db/schema.cds` và `srv/service.cds` hiện tại là source of truth đã implement.

## English

This document reviews the current IDTS database and CAP CDS model from the perspective of a senior database designer. The goal is to identify what is safe, what is missing, and what must be clarified before WP1 Data Model Foundation starts.

## Vietnamese

Tài liệu này review database và CAP CDS model hiện tại của IDTS dưới góc nhìn của một người thiết kế database lâu năm. Mục tiêu là xác định phần nào ổn, phần nào còn thiếu, và phần nào cần làm rõ trước khi bắt đầu WP1 Data Model Foundation.

## 1. Review Inputs

## English

| Input | Why it matters |
| --- | --- |
| `db/schema.cds` | Shows the current persistence model. |
| `srv/service.cds` | Shows the current OData service exposure. |
| `docs/project-context.md` | Defines the confirmed IDTS domain and scope. |
| `docs/ba/05-data-dictionary.md` | Defines the target conceptual data dictionary. |
| `docs/ba/08-implementation-gap-analysis.md` | Defines known implementation gaps and recommended phases. |
| `docs/diagrams/05-conceptual-data-model.md` | Defines the conceptual ERD and main relationships. |
| BRD/SRS/FRS | Define the business and functional behavior that the model must support. |

## Vietnamese

| Input | Vì sao quan trọng |
| --- | --- |
| `db/schema.cds` | Cho biết persistence model hiện tại. |
| `srv/service.cds` | Cho biết OData service hiện tại đang expose gì. |
| `docs/project-context.md` | Xác định domain và scope đã chốt của IDTS. |
| `docs/ba/05-data-dictionary.md` | Xác định data dictionary conceptual target. |
| `docs/ba/08-implementation-gap-analysis.md` | Xác định gap implementation đã biết và phase khuyến nghị. |
| `docs/diagrams/05-conceptual-data-model.md` | Xác định ERD conceptual và các relationship chính. |
| BRD/SRS/FRS | Xác định hành vi nghiệp vụ và functional mà model phải hỗ trợ. |

## 2. Current Model Assessment

## English

The current CAP model is a scaffold, not an MVP-ready database model. `db/schema.cds` contains only one `Bugs` entity with primitive fields: title, description, status, priority, severity, category, and createdAt. `srv/service.cds` exposes only a projection of that entity.

This is acceptable as an initial generated or learning scaffold, but it is not sufficient for the agreed IDTS scope. It cannot yet support classification, assignment, developer responsibility, nextProcessor, comments, history, notification records, duplicate links, retest, or PM monitoring.

## Vietnamese

CAP model hiện tại chỉ là scaffold, chưa phải database model sẵn sàng cho MVP. `db/schema.cds` chỉ có một entity `Bugs` với các field primitive: title, description, status, priority, severity, category và createdAt. `srv/service.cds` chỉ expose projection của entity đó.

Điều này chấp nhận được ở giai đoạn generated/learning scaffold ban đầu, nhưng chưa đủ cho scope IDTS đã chốt. Model hiện tại chưa hỗ trợ classification, assignment, developer responsibility, nextProcessor, comments, history, notification records, duplicate links, retest hoặc PM monitoring.

## 3. Critical Findings

## English

| Severity | Finding | Impact | Recommendation |
| --- | --- | --- | --- |
| High | `category` is a free-text field on `Bugs`. | It mixes Application Component, Defect Category, and possibly SAP Module into one field. This breaks filtering, assignment, reporting, and Fiori value helps. | Replace it with associations to Application Component, Defect Category, and a derived or selected Component Category. Keep SAP Module as optional context. |
| High | Status, priority, and severity are free-text strings. | Users or handlers can create inconsistent values, and status transition validation becomes fragile. | Use stable value-list entities or controlled codes for status, priority, severity, environment, notification status, and action type. |
| High | No user/developer model exists. | The system cannot distinguish Tester, Developer, PM, assignee, reporter, or nextProcessor. | Add `Users` and `DeveloperProfiles`, then associate Bugs, Comments, HistoryLogs, Notifications, and DeveloperResponsibilities to those entities. |
| High | No Developer Responsibility model exists. | Assignment cannot be filtered by capability and can only become manual free-text assignment. | Add `DeveloperResponsibilities` mapped to `DeveloperProfiles`, `ComponentCategories`, and optional `SAPModules`. |
| High | No audit/history model exists. | Important changes cannot be traced, which conflicts with the IDTS audit requirement. | Add append-only `HistoryLogs` as bug-owned records with actor, action type, old value, new value, reason, and timestamp. |
| High | No nextProcessor representation exists. | Rejected and Need More Information flows may leave bugs without a clear owner. | Add `nextProcessor` as a user association or define a queue model before coding handler rules. |
| Medium | No comments, attachments, notifications, or duplicate links exist. | Core collaboration and review support is missing. | Add them as child entities or related entities based on lifecycle ownership. |
| Medium | No uniqueness or active/inactive master-data strategy is documented in the CDS model yet. | Future value-help data can duplicate or disappear after use. | Use stable `code` fields, unique constraints where practical, and `active` flags instead of deleting referenced master data. |
| Medium | No index strategy is captured. | PM monitoring and common Fiori filters may become slow as data grows. | Plan indexes on status, priority, severity, assignee, nextProcessor, component/category, dueDate, and createdAt after CDS shape is stable. |

## Vietnamese

| Mức độ | Phát hiện | Ảnh hưởng | Khuyến nghị |
| --- | --- | --- | --- |
| Cao | `category` là free-text field trên `Bugs`. | Nó trộn Application Component, Defect Category, và có thể cả SAP Module vào một field. Điều này làm hỏng filter, assignment, reporting và Fiori value help. | Thay bằng association tới Application Component, Defect Category, và Component Category được chọn hoặc suy ra. Giữ SAP Module là context tùy chọn. |
| Cao | Status, priority và severity là string tự do. | User hoặc handler có thể tạo value không nhất quán, làm status transition validation dễ lỗi. | Dùng value-list entity hoặc controlled code ổn định cho status, priority, severity, environment, notification status và action type. |
| Cao | Chưa có model user/developer. | Hệ thống không phân biệt được Tester, Developer, PM, assignee, reporter hoặc nextProcessor. | Thêm `Users` và `DeveloperProfiles`, sau đó associate Bugs, Comments, HistoryLogs, Notifications và DeveloperResponsibilities tới các entity này. |
| Cao | Chưa có Developer Responsibility model. | Assignment không thể filter theo năng lực và sẽ chỉ còn gán thủ công/free-text. | Thêm `DeveloperResponsibilities` map tới `DeveloperProfiles`, `ComponentCategories`, và `SAPModules` tùy chọn. |
| Cao | Chưa có audit/history model. | Các thay đổi quan trọng không trace được, mâu thuẫn với yêu cầu audit của IDTS. | Thêm `HistoryLogs` append-only thuộc Bug, gồm actor, action type, old value, new value, reason và timestamp. |
| Cao | Chưa có nextProcessor. | Flow Rejected và Need More Information có thể khiến bug không có owner xử lý tiếp. | Thêm `nextProcessor` là association tới user hoặc chốt queue model trước khi code handler. |
| Trung bình | Chưa có comments, attachments, notifications hoặc duplicate links. | Thiếu hỗ trợ collaboration và review cốt lõi. | Thêm dưới dạng child entity hoặc related entity tùy theo lifecycle ownership. |
| Trung bình | Chưa có chiến lược uniqueness hoặc active/inactive master data trong CDS model. | Dữ liệu value-help sau này có thể bị duplicate hoặc bị xóa khi đã được tham chiếu. | Dùng `code` ổn định, unique constraint khi phù hợp, và `active` flag thay vì xóa master data đã được reference. |
| Trung bình | Chưa có index strategy. | PM monitoring và Fiori filter phổ biến có thể chậm khi dữ liệu tăng. | Lập kế hoạch index trên status, priority, severity, assignee, nextProcessor, component/category, dueDate và createdAt sau khi CDS shape ổn định. |

## 4. Recommended Target Model Shape

## English

The target model should be normalized around these groups:

| Group | Entities | Design intent |
| --- | --- | --- |
| People and roles | `Users`, `DeveloperProfiles` | Represent the real people who create, work on, verify, and monitor bugs. |
| Classification master data | `SAPModules`, `ApplicationComponents`, `DefectCategories`, `ComponentCategories` | Keep SAP business context separate from where the defect appears and what type of defect it is. |
| Assignment rules | `DeveloperResponsibilities` | Map Developer capability to valid Component Category and optional SAP Module. |
| Transaction core | `Bugs` | Store the main defect record and current lifecycle state. |
| Collaboration and evidence | `Comments`, `Attachments`, `DuplicateLinks` | Support communication, evidence, and duplicate/similar bug relationships. |
| Audit and notification | `HistoryLogs`, `Notifications` | Track important changes and generated notification events. |

The `Bugs` entity should not duplicate all names from master data. It should store associations and only denormalize values when there is a clear audit or reporting reason.

## Vietnamese

Target model nên được chuẩn hóa quanh các nhóm sau:

| Nhóm | Entity | Ý nghĩa thiết kế |
| --- | --- | --- |
| Con người và role | `Users`, `DeveloperProfiles` | Biểu diễn người thật tạo, xử lý, verify và monitor bug. |
| Master data classification | `SAPModules`, `ApplicationComponents`, `DefectCategories`, `ComponentCategories` | Tách SAP business context khỏi nơi defect xuất hiện và loại defect. |
| Rule assignment | `DeveloperResponsibilities` | Map năng lực Developer với Component Category hợp lệ và SAP Module tùy chọn. |
| Transaction core | `Bugs` | Lưu defect chính và trạng thái lifecycle hiện tại. |
| Collaboration và evidence | `Comments`, `Attachments`, `DuplicateLinks` | Hỗ trợ trao đổi, bằng chứng và quan hệ duplicate/similar bug. |
| Audit và notification | `HistoryLogs`, `Notifications` | Theo dõi thay đổi quan trọng và notification event được sinh ra. |

Entity `Bugs` không nên duplicate tất cả tên của master data. Nó nên lưu association và chỉ denormalize value khi có lý do audit hoặc reporting rõ ràng.

## 5. Relationship Recommendations

## English

| Relationship | Recommended shape | Notes |
| --- | --- | --- |
| Bug to SAP Module | Optional association | SAP Module is business context, not the application component itself. Use `NA` or null when not applicable. |
| Bug to Application Component | Required association, or through required Component Category | The UI can show Module, then Component, then Category. Backend should validate the final pair. |
| Bug to Defect Category | Required association, or through required Component Category | The category explains defect type or technical layer, not the place where it appears. |
| Component Category | Association pair between Application Component and Defect Category | This is the valid pairing used by assignment. |
| Developer Responsibility | DeveloperProfile + ComponentCategory + optional SAPModule | This is the main filter for eligible assignees. |
| Bug to assignee | Optional association to DeveloperProfile | Empty assignee means Pending Assignment. |
| Bug to nextProcessor | Association to User or queue | Must be clarified before implementation. If using queues, add a `ProcessorQueues` model. |
| Bug to child records | Composition for Comments, Attachments metadata, HistoryLogs, Notifications when lifecycle-owned | Keep children tied to a Bug and expose through Object Page sections later. |
| DuplicateLinks | Separate relationship entity between two Bugs | Better than a single `duplicateOf` when the team needs Similar or Related, not only Duplicate. |

## Vietnamese

| Relationship | Hình dạng khuyến nghị | Ghi chú |
| --- | --- | --- |
| Bug tới SAP Module | Association tùy chọn | SAP Module là business context, không phải application component. Dùng `NA` hoặc null khi không áp dụng. |
| Bug tới Application Component | Association bắt buộc, hoặc đi qua Component Category bắt buộc | UI có thể cho chọn Module, rồi Component, rồi Category. Backend phải validate pair cuối cùng. |
| Bug tới Defect Category | Association bắt buộc, hoặc đi qua Component Category bắt buộc | Category mô tả loại defect hoặc technical layer, không phải nơi defect xuất hiện. |
| Component Category | Pair association giữa Application Component và Defect Category | Đây là cặp hợp lệ dùng cho assignment. |
| Developer Responsibility | DeveloperProfile + ComponentCategory + SAPModule tùy chọn | Đây là filter chính cho assignee hợp lệ. |
| Bug tới assignee | Association tùy chọn tới DeveloperProfile | Assignee rỗng nghĩa là Pending Assignment. |
| Bug tới nextProcessor | Association tới User hoặc queue | Cần làm rõ trước implementation. Nếu dùng queue, thêm model `ProcessorQueues`. |
| Bug tới child records | Composition cho Comments, metadata Attachments, HistoryLogs, Notifications khi thuộc lifecycle của Bug | Giữ child record gắn với một Bug và expose qua Object Page section sau này. |
| DuplicateLinks | Entity relationship riêng giữa hai Bugs | Tốt hơn một field `duplicateOf` nếu team cần Similar hoặc Related, không chỉ Duplicate. |

## 6. CAP/CDS Implementation Guidance

## English

Recommended CDS direction for WP1:

- Use `using { cuid, managed } from '@sap/cds/common';`.
- Apply `cuid` and `managed` to core entities where appropriate.
- Use `LargeString` or `String` with sensible lengths for long user input such as description, reproduction steps, actual result, expected result, and reasons.
- Use associations for master data and compositions for bug-owned records.
- Use stable `code` and user-facing `name` on value lists and master data.
- Add `active : Boolean default true` on selectable master data.
- Avoid database-specific SQL, triggers, generated columns, and vendor-only data types in WP1.
- Keep handler-dependent logic out of CDS when it needs transaction-aware validation, history writing, or nextProcessor updates.

## Vietnamese

Hướng CDS khuyến nghị cho WP1:

- Dùng `using { cuid, managed } from '@sap/cds/common';`.
- Áp dụng `cuid` và `managed` cho core entity khi phù hợp.
- Dùng `LargeString` hoặc `String` với độ dài hợp lý cho input dài như description, reproduction steps, actual result, expected result và reason.
- Dùng association cho master data và composition cho record thuộc Bug.
- Dùng `code` ổn định và `name` hiển thị cho value list/master data.
- Thêm `active : Boolean default true` cho master data có thể chọn.
- Tránh SQL riêng của database, trigger, generated column và datatype phụ thuộc vendor trong WP1.
- Không nhồi logic cần handler vào CDS nếu logic đó cần validation theo transaction, ghi history hoặc update nextProcessor.

## 7. Recommended Database Decision Baseline

## English

The following answers are the recommended baseline for WP1 unless the mentor or team explicitly changes the decision before coding.

| ID | Decision | Why this is recommended | Advantages | Tradeoffs / risks | WP1 implementation note |
| --- | --- | --- | --- | --- | --- |
| DB-Q01 | Use a lightweight hybrid `nextProcessor`: store an optional specific user and a required role/queue code such as Tester, Developer, PM, or Unassigned Queue. Do not create a separate queue master table in MVP unless needed later. | Some steps have a known person, such as the assigned Developer. Other steps only know the responsible role, such as PM queue for Pending Assignment. | Flexible enough for Rejected, Need More Information, Pending Assignment, and PM monitoring without overengineering. | CAP handlers must keep user and role/queue consistent. A future enterprise queue model may require migration. | Model `nextProcessor` as current action owner concept; exact CDS can use `nextProcessorUser` plus `nextProcessorRole` or similar names. |
| DB-Q02 | Do not ask users to select `ComponentCategory` directly. Let users select Application Component and Defect Category; backend derives or validates the matching Component Category. | This matches how Testers think: where the defect appears and what kind of defect it is. | Fiori UX is easier to understand, while assignment still gets a precise key. | Requires backend validation when the selected pair is invalid or inactive. | Fiori value helps should filter categories by selected component where possible; CAP must enforce the final pair. |
| DB-Q03 | Store `applicationComponent`, `defectCategory`, and `componentCategory` on Bug. Treat `componentCategory` as the assignment key and validate consistency. | Fiori filtering and reporting benefit from direct component/category fields, while assignment needs the validated pair. | Better List Report filters, PM reporting, and developer assignment queries. | This introduces controlled redundancy. CAP handlers must prevent inconsistent combinations. | On create/update, derive or validate `componentCategory` from `applicationComponent` + `defectCategory`. |
| DB-Q04 | Store both the latest `rejectionReason` on Bug and immutable rejection reasons in `HistoryLogs.reason`. | Object Page needs quick access to the current rejection reason; audit needs every historical reason. | Clear UX for Tester/PM and strong audit traceability. | Data is duplicated intentionally. Both records must be written in the same transaction. | `rejectionReason` shows current/latest reason; `HistoryLogs` remains the source for full history. |
| DB-Q05 | Store attachment metadata and `storageRef` only in MVP. Do not store binary content directly in the database yet. | This keeps SQLite local development simple and avoids early storage/security decisions. | Smaller DB, easier portability to HANA/PostgreSQL, safer MVP scope. | Real file storage must be designed before production deployment. | Add `Attachments` metadata with filename, MIME type, size if useful, uploader, timestamp, and storage reference. |
| DB-Q06 | Add a human-readable `bugNumber` in addition to UUID. UUID remains the technical primary key. | Users, screenshots, mentor review, and test reports need IDs that are easy to read and discuss. | Better communication and traceability in SAP490 deliverables. | Requires generation logic and uniqueness handling. | Use UUID as key; generate `BUG-YYYY-NNNN` or `BUG-NNNN` in a CAP handler later. |
| DB-Q07 | Keep SAP Module optional. Use it as context and optional assignment filter. Do not make SAP Module mandatory for MVP. | Many IDTS defects are technical or app-specific and may not belong to FI/MM/SD/etc. | Avoids confusing SAP functional modules with IDTS application components. | Reporting by SAP Module may be incomplete if users leave it blank. | Include `SAPModules` and optional SAP Module references. Make `SAPModuleComponents` P1 unless mentor wants module-driven filtering in MVP. |
| DB-Q08 | Store only confirmed duplicate/similar/related links in `DuplicateLinks` for MVP. Do not store every search candidate. | Candidate duplicate search can be computed at runtime and does not need persistent records yet. | Keeps model simple and avoids noisy data. | The system will not remember ignored candidate matches. | Add `DuplicateLinks` for confirmed relationships; candidate tracking can be P1/P2 if needed. |

Recommended default for WP1: implement the data model according to these decisions, then validate the CDS with `cds compile srv --to edmx` before service and Fiori work.

## Vietnamese

Các câu trả lời dưới đây là baseline khuyến nghị cho WP1, trừ khi mentor hoặc team đổi quyết định rõ ràng trước khi code.

| ID | Quyết định | Vì sao chọn | Ưu điểm | Nhược điểm / rủi ro | Ghi chú implement WP1 |
| --- | --- | --- | --- | --- | --- |
| DB-Q01 | Dùng `nextProcessor` dạng hybrid nhẹ: lưu user cụ thể nếu có và lưu role/queue code bắt buộc như Tester, Developer, PM hoặc Unassigned Queue. Chưa tạo bảng queue riêng trong MVP nếu chưa cần. | Có bước biết người cụ thể, ví dụ Developer được assign. Có bước chỉ biết role chịu trách nhiệm, ví dụ PM queue cho Pending Assignment. | Đủ linh hoạt cho Rejected, Need More Information, Pending Assignment và PM monitoring mà không overengineer. | CAP handler phải giữ user và role/queue nhất quán. Nếu sau này cần queue enterprise thì có thể phải migrate. | Có thể model bằng `nextProcessorUser` và `nextProcessorRole` hoặc tên tương tự. |
| DB-Q02 | Không bắt user chọn `ComponentCategory` trực tiếp. User chọn Application Component và Defect Category; backend derive hoặc validate Component Category tương ứng. | Đúng cách Tester suy nghĩ: lỗi xảy ra ở đâu và thuộc loại gì. | UX Fiori dễ hiểu, nhưng assignment vẫn có key chính xác. | Cần backend validation khi cặp chọn không hợp lệ hoặc inactive. | Value help Fiori nên filter category theo component nếu có thể; CAP phải enforce pair cuối cùng. |
| DB-Q03 | Lưu `applicationComponent`, `defectCategory` và `componentCategory` trên Bug. `componentCategory` là key cho assignment và phải validate consistency. | Fiori filter/report cần component/category trực tiếp, còn assignment cần pair đã validate. | List Report, PM reporting và query assignment dễ hơn. | Có redundancy có kiểm soát. CAP handler phải chặn tổ hợp không nhất quán. | Khi create/update, derive hoặc validate `componentCategory` từ `applicationComponent` + `defectCategory`. |
| DB-Q04 | Lưu cả `rejectionReason` mới nhất trên Bug và reason bất biến trong `HistoryLogs.reason`. | Object Page cần xem nhanh lý do reject hiện tại; audit cần toàn bộ lịch sử. | UX rõ cho Tester/PM và audit trace tốt. | Dữ liệu bị lặp có chủ đích. Phải ghi cả hai trong cùng transaction. | `rejectionReason` hiển thị lý do mới nhất; `HistoryLogs` là nguồn đầy đủ cho lịch sử. |
| DB-Q05 | MVP chỉ lưu metadata attachment và `storageRef`. Chưa lưu binary trực tiếp trong database. | Giữ SQLite local đơn giản và tránh quyết định storage/security quá sớm. | DB nhỏ hơn, portable sang HANA/PostgreSQL, đúng scope MVP. | Trước production phải thiết kế storage thật. | Thêm `Attachments` metadata gồm filename, MIME type, size nếu cần, uploader, timestamp và storage reference. |
| DB-Q06 | Thêm `bugNumber` dễ đọc ngoài UUID. UUID vẫn là primary key kỹ thuật. | User, screenshot, mentor review và test report cần mã dễ đọc để trao đổi. | Giao tiếp và traceability trong SAP490 deliverables tốt hơn. | Cần logic generate số và xử lý uniqueness. | Dùng UUID làm key; generate `BUG-YYYY-NNNN` hoặc `BUG-NNNN` bằng CAP handler sau. |
| DB-Q07 | SAP Module là optional. Dùng như context và filter assignment tùy chọn. Không bắt buộc SAP Module trong MVP. | Nhiều defect của IDTS là technical/app-specific và không thuộc FI/MM/SD rõ ràng. | Tránh nhầm SAP functional module với Application Component của IDTS. | Report theo SAP Module có thể không đầy đủ nếu user bỏ trống. | Có `SAPModules` và SAP Module reference optional. `SAPModuleComponents` để P1 trừ khi mentor muốn module-driven filtering trong MVP. |
| DB-Q08 | MVP chỉ lưu duplicate/similar/related link đã xác nhận trong `DuplicateLinks`. Không lưu mọi candidate search. | Candidate duplicate search có thể tính lúc chạy và chưa cần persist. | Model đơn giản, tránh dữ liệu nhiễu. | Hệ thống không nhớ candidate nào user từng bỏ qua. | Thêm `DuplicateLinks` cho quan hệ đã xác nhận; candidate tracking để P1/P2 nếu cần. |

Mặc định khuyến nghị cho WP1: implement data model theo các quyết định này, sau đó validate CDS bằng `cds compile srv --to edmx` trước khi làm service và Fiori.

## 8. Original Questions Kept for Traceability

## English

These decisions should be clarified before implementing WP1:

| ID | Question | Why it matters |
| --- | --- | --- |
| DB-Q01 | Is `nextProcessor` always a user, or can it be a role/queue such as Tester Queue or PM Queue? | Determines whether the model needs `nextProcessor : Association to Users` only, or a queue model. |
| DB-Q02 | Should `ComponentCategory` be directly selected by the user or derived from selected Application Component + Defect Category? | Affects Fiori UI, value help, and CAP validation. |
| DB-Q03 | Should Bug store both `applicationComponent` and `defectCategory`, or only `componentCategory`? | Storing both improves Fiori filtering but needs consistency validation. |
| DB-Q04 | Should `rejectionReason` be a field on Bugs, only a HistoryLogs reason, or both? | Affects Object Page display, audit clarity, and duplication of data. |
| DB-Q05 | Should attachment binary content be stored in the database or only metadata with external/local storage reference? | Affects security, DB size, backup, and deployment design. |
| DB-Q06 | Is a human-readable `bugNumber` required in addition to UUID? | Usually useful for mentor demos, screenshots, and user communication. |
| DB-Q07 | Are SAP Modules only optional context, or should they filter Application Components in Fiori for MVP? | Determines whether `SAPModuleComponents` is P0 or P1. |
| DB-Q08 | Should duplicate detection store only confirmed links, or also candidate matches generated during creation? | Determines whether `DuplicateLinks` is enough or whether a candidate table is needed later. |

## Vietnamese

Các quyết định sau nên được làm rõ trước khi implement WP1:

| ID | Câu hỏi | Vì sao quan trọng |
| --- | --- | --- |
| DB-Q01 | `nextProcessor` luôn là user, hay có thể là role/queue như Tester Queue hoặc PM Queue? | Quyết định model chỉ cần `nextProcessor : Association to Users`, hay cần thêm queue model. |
| DB-Q02 | `ComponentCategory` do user chọn trực tiếp hay suy ra từ Application Component + Defect Category đã chọn? | Ảnh hưởng Fiori UI, value help và CAP validation. |
| DB-Q03 | Bug nên lưu cả `applicationComponent` và `defectCategory`, hay chỉ lưu `componentCategory`? | Lưu cả hai giúp Fiori filter tốt hơn nhưng cần validation consistency. |
| DB-Q04 | `rejectionReason` nên là field trên Bugs, chỉ là reason trong HistoryLogs, hay cả hai? | Ảnh hưởng Object Page display, audit clarity và duplication dữ liệu. |
| DB-Q05 | Attachment binary content lưu trong database hay chỉ lưu metadata với storage reference local/external? | Ảnh hưởng security, DB size, backup và deployment design. |
| DB-Q06 | Có cần `bugNumber` dễ đọc ngoài UUID không? | Thường hữu ích cho demo mentor, screenshot và giao tiếp giữa user. |
| DB-Q07 | SAP Module chỉ là context tùy chọn, hay cần filter Application Components trên Fiori ngay trong MVP? | Quyết định `SAPModuleComponents` là P0 hay P1. |
| DB-Q08 | Duplicate detection chỉ lưu link đã xác nhận, hay lưu cả candidate match sinh ra lúc tạo bug? | Quyết định `DuplicateLinks` đã đủ hay sau này cần thêm candidate table. |

## 9. Recommended WP1 Sequence

## English

Implement the model in this order:

1. Add shared code/value entities: Status, Priority, Severity, Environment, ActionType, NotificationStatus if using value-list entities.
2. Add `Users` and `DeveloperProfiles`.
3. Add classification master data: `SAPModules`, `ApplicationComponents`, `DefectCategories`, `ComponentCategories`, optional `SAPModuleComponents`.
4. Add `DeveloperResponsibilities`.
5. Expand `Bugs` with reproduction, classification, assignment, nextProcessor, due dates, effort, test references, and reason fields.
6. Add child records: `Comments`, `HistoryLogs`, `Notifications`, `Attachments`.
7. Add `DuplicateLinks`.
8. Add seed data under CAP-supported `db/data/`.
9. Update `srv/service.cds` projections and value-help exposure.
10. Run `cds compile srv --to edmx`.

Do not implement all CAP handlers in the same change as the first CDS expansion. The safer sequence is model first, compile, then service/value help, then handlers.

## Vietnamese

Nên implement model theo thứ tự:

1. Thêm shared code/value entities: Status, Priority, Severity, Environment, ActionType, NotificationStatus nếu dùng value-list entity.
2. Thêm `Users` và `DeveloperProfiles`.
3. Thêm classification master data: `SAPModules`, `ApplicationComponents`, `DefectCategories`, `ComponentCategories`, `SAPModuleComponents` tùy chọn.
4. Thêm `DeveloperResponsibilities`.
5. Mở rộng `Bugs` với reproduction, classification, assignment, nextProcessor, due date, effort, test reference và reason fields.
6. Thêm child records: `Comments`, `HistoryLogs`, `Notifications`, `Attachments`.
7. Thêm `DuplicateLinks`.
8. Thêm seed data dưới vị trí CAP hỗ trợ `db/data/`.
9. Cập nhật projection và value-help exposure trong `srv/service.cds`.
10. Chạy `cds compile srv --to edmx`.

Không nên implement toàn bộ CAP handlers trong cùng change với lần mở rộng CDS đầu tiên. Thứ tự an toàn hơn là model trước, compile, sau đó service/value help, rồi mới handler.

## 10. Verdict

## English

The current database model is not wrong as a starting scaffold, but it is not acceptable as the implementation model for the documented MVP. The biggest risk is not syntax. The biggest risk is semantic loss: important business concepts are currently compressed into strings or missing entirely.

Before coding Fiori or handler logic, the team should stabilize WP1 Data Model Foundation using the decision baseline above. After that, CAP service projections and Fiori value helps will have a stable base.

## Vietnamese

Database model hiện tại không sai nếu xem là scaffold ban đầu, nhưng chưa thể dùng làm implementation model cho MVP đã document. Rủi ro lớn nhất không phải syntax. Rủi ro lớn nhất là mất ý nghĩa nghiệp vụ: các khái niệm quan trọng hiện bị nén vào string hoặc chưa tồn tại.

Trước khi code Fiori hoặc handler logic, team nên ổn định WP1 Data Model Foundation theo decision baseline ở trên. Sau đó CAP service projection và Fiori value help mới có nền tảng ổn định.
