# **Project Scope \- Issue and Defect Tracking System in SAP**

## Audit traceability baseline

In scope, every named public Bug workflow OData action that writes History has one dedicated ActionType. `HistoryEvents.actionType_code` identifies the initiating command directly, and child `HistoryLogs` use the same code. Preserving legacy ActionTypes and historical rows is also in scope. Renaming endpoints, changing the lifecycle/role model, migrating old history, or applying this contract to read-only AI suggestion actions is out of scope.

Vietnamese: Trong scope, mỗi OData workflow action công khai của Bug có ghi History dùng một ActionType riêng; nhìn `HistoryEvents.actionType_code` phải nhận ra ngay command. Giữ mã và dữ liệu lịch sử cũ là bắt buộc. Không đổi endpoint, lifecycle, role, không migrate History cũ và không áp dụng contract này cho AI action chỉ đọc/suggestion.

## **1\. Tên dự án**

**English:** Issue and Defect Tracking System in SAP  
**Vietnamese:** Hệ thống Quản lý và Theo dõi Vấn đề và Lỗi trong SAP

Dự án tập trung vào việc **ghi nhận, quản lý, phân loại, phân công và theo dõi trạng thái lỗi/vấn đề** trong quá trình kiểm thử phần mềm trên nền tảng SAP.

---

# **2\. Mục tiêu chính của hệ thống**

Hệ thống được xây dựng để hỗ trợ quy trình quản lý bug/defect từ lúc được phát hiện cho đến khi được Developer tiếp nhận và cập nhật trạng thái xử lý.

Mục tiêu chính gồm:

* Số hóa quy trình ghi nhận bug/defect.  
* Chỉ cho phép Tester tạo bug report đầy đủ thông tin; PM và Developer không tạo Bug mới.
* Hỗ trợ kiểm tra bug đã tồn tại hay chưa.  
* Cho phép Tester assign bug cho Developer phù hợp.  
* Cho phép Developer xem bug được giao, phản hồi và cập nhật trạng thái.  
* Theo dõi lịch sử thay đổi, comment, feedback và trạng thái bug.  
* Hỗ trợ notification khi có thay đổi quan trọng.  
* Có thể mở rộng thêm workflow hoặc dashboard nếu còn thời gian.

---

# **3\. Role trong hệ thống**

Theo hướng mentor muốn đơn giản hóa, hệ thống nên có **3 role chính**:

## **Role 1: Tester**

Role này đại diện cho người phát hiện, ghi nhận, kiểm tra và quản lý bug ở mức cơ bản. Trong MVP hiện tại, `Reporter` không tách thành role riêng vì dự án dùng nội bộ và Tester là người chính phát hiện/báo cáo bug. `Admin` cũng chưa tách thành role riêng vì chưa có workflow admin chuyên biệt; các trách nhiệm quản trị nhẹ sẽ do Tester hoặc PM xử lý theo quyền được cấp.

Các quyền chính:

* Detect bug.  
* Check existing bug.  
* Create bug report.  
* Add description, priority, severity, module/category.  
* Upload screenshot/evidence.  
* Submit bug report.  
* Edit hoặc bổ sung thông tin sau khi submit.  
* Assign bug cho Developer.  
* Reassign bug nếu Developer không phù hợp hoặc workload quá cao.  
* Track bug status.  
* Add comment/feedback.

## **Role 2: Developer**

Role này là người tiếp nhận bug, có thể xem/thảo luận bug thuộc cùng project/team khi có quyền visibility, và cập nhật trạng thái xử lý trong phạm vi được phép.

Các quyền chính:

* View assigned bugs.  
* View team-visible bugs trong cùng project/team khi có quyền visibility.
* View bug details.  
* Review bug information.  
* Request more information nếu bug report chưa rõ.  
* Reject bug nếu bug sai module/category, sai assignment hoặc không phù hợp; phải có lý do reject và follow-up owner/action.
* Add developer note khi cần; developer note mặc định optional trừ các transition bắt buộc reason/note.
* Update processing status nếu là assignee hoặc role được phép.

## **Role 3: PM**

Role này là người **theo dõi tổng quan tiến độ xử lý bug và quản lý tình trạng workload của nhóm**.

Nhiệm vụ chính:

* View all bug reports  
* View bug details  
* Search and filter bugs  
* Track bug status  
* View bug history  
* Monitor developer workload  
* View overdue bugs  
* View dashboard or report  
* Receive escalation notification  
* Request bug reassignment when needed  
* Monitor overall defect tracking progress

---

# **4\. In Scope** 

## **4.1. Bug Reporting**

Hệ thống cho phép Tester ghi nhận bug mới với các thông tin:

* Bug title  
* Description  
* Steps to reproduce  
* Expected result  
* Actual result  
* Priority / Severity  
* Module / Category  
* Screenshot / Evidence  
* Tester / created-by information
* Created date

## **4.2. Existing Bug Checking**

Trước khi tạo bug mới, Tester có thể kiểm tra bug đã tồn tại hay chưa.

Các case chính:

* Bug đã tồn tại và vẫn đang mở → follow existing bug.  
* Bug đã tồn tại nhưng đã đóng → update/reopen existing bug.  
* Bug chưa tồn tại → create new bug report.

## **4.3. Bug Information Validation**

Trước khi submit, hệ thống kiểm tra thông tin bắt buộc.

Ví dụ:

* Title không được rỗng.  
* Description phải có.  
* Module/category phải được chọn.  
* Priority/severity phải được chọn.  
* Steps to reproduce nên có nếu bug cần tái hiện.

Nếu thiếu thông tin, Tester phải bổ sung trước khi submit.

---

## **4.4. Bug Assignment**

Sau khi submit, Tester có thể assign bug cho Developer.

Logic :

Tester chọn module/category  
→ Hệ thống hiển thị danh sách Developer thuộc module đó  
→ Tester chọn Developer phù hợp hoặc chủ động để bug ở `Pending Assignment` khi chưa có Developer phù hợp
→ Hệ thống kiểm tra workload/availability nếu có  
→ Assign bug cho Developer

**English clarification:** Only a Tester can create a new Bug. IDTS must not automatically pick a Developer during create. If the Tester does not explicitly select an assignee, the bug starts as `Pending Assignment`.

**Tiếng Việt:** Chỉ Tester được tạo Bug mới. IDTS không được tự chọn Developer khi tạo bug. Nếu Tester không chủ động chọn assignee, bug sẽ bắt đầu ở `Pending Assignment`.

Nếu Developer đang bận hoặc workload không phù hợp:

Tester reassign bug cho Developer khác

---

## **4.5. Developer Review**

Developer sau khi nhận bug có thể:

* Xem chi tiết bug.  
* Kiểm tra thông tin bug có đủ rõ không.  
* Yêu cầu Tester hoặc PM bổ sung thông tin.
* Kiểm tra module có đúng không.  
* Từ chối bug nếu bug bị assign sai module; phải ghi rõ lý do và người follow-up tiếp theo.
* Thêm technical note.  
* Cập nhật status.

---

## **4.6. Edit Submitted Bug Report**

Tester có thể chỉnh sửa hoặc bổ sung bug report sau khi đã submit.

Business rule là:

Tester can edit or add information to a submitted bug report  
as long as the bug is not closed.

Closed Bug là read-only aggregate: không edit Bug, đổi Developer, thêm comment, mutation attachment, mutation AI hoặc gọi lifecycle action khác. Existing comments/attachments/history vẫn đọc được và attachment cũ vẫn download được. Muốn tiếp tục xử lý phải dùng `Reopen Bug`; PM chỉ có thêm ngoại lệ điều phối `Reassign Retest Owner`.

Bug record không hỗ trợ hard delete ở bất kỳ trạng thái nào; việc kết thúc hoặc tiếp tục xử lý phải đi qua lifecycle action để giữ audit trace.

Nếu bug đã assign cho Developer rồi, sau khi Tester chỉnh sửa thông tin, hệ thống nên notify Developer.

---

## **4.7. Status Tracking**

Hệ thống cần theo dõi trạng thái bug.

Bộ status đơn giản nên dùng:

New (legacy/import compatibility only)
Assigned  
In Review  
Need More Information  
Reassigned  
In Progress  
Resolved  
Closed  
Rejected  
Reopened

Hệ thống lưu `retestOwner` riêng để giữ Tester chịu trách nhiệm retest qua các lần close/reopen. `retestOwner` không phải Developer assignee và không phải current action owner. PM có thể reassign retest owner nếu Tester hiện tại không còn khả dụng mà không tự đổi status hoặc assignee.

---

## **4.8. Comment / Feedback**

Tester và Developer có thể trao đổi trong bug report.

Ví dụ:

* Tester hoặc PM bổ sung thông tin rồi dùng `Resubmit to Developer`.
* Developer hỏi thêm dữ liệu.  
* Developer ghi chú kỹ thuật.  
* Tester phản hồi lại nếu cần.  
* PM có thể tham gia trao đổi

---

## **4.9. Notification**

Notification nên để là một module hỗ trợ, không cần khóa cứng vào một công nghệ duy nhất.

The system can send notifications through SAP BTP services or third-party channels such as Email, Microsoft Teams, Slack, or Telegram.

Các trigger notification:

* Bug được assign cho Developer.  
* Bug được reassign.  
* Developer yêu cầu thêm thông tin.  
* Tester cập nhật bug report đã submit.  
* Developer cập nhật trạng thái bug.

**Approved email-delivery baseline / Baseline gửi email đã duyệt:**

* `Notifications` là source event hiển thị trong IDTS; email không thay thế notification trong app.
* SAP BTP dùng private provider configuration cho Brevo API; local/integration profile vẫn có thể chọn SMTP/Nodemailer. Credential không nằm trong source hoặc tài liệu.
* Mỗi email có outbox/delivery status riêng: `PENDING`, `SENT`, `FAILED`, `SKIPPED`.
* SAP Job Scheduling Service gọi protected CAP outbox-processing endpoint; provider fail chỉ đổi delivery status và không được rollback action xử lý Bug đã commit.
* Core scope không bao gồm message broker riêng như Redis, RabbitMQ hoặc BullMQ; CAP database outbox là đủ cho v1.

**Approved AI assistance baseline / Baseline AI assistance đã duyệt:**

* AI v1 chỉ hỗ trợ tìm bug trùng/tương tự, gợi ý phân loại, tạo bug/handoff summary và giải thích Smart Assign.
* AI chỉ đưa ra suggestion; người dùng phải review và chủ động apply, ignore hoặc reject.
* AI không được tự assign, tạo duplicate link, sửa classification, close, reject hoặc chuyển status.
* CAP validation, role authorization và workflow hiện tại vẫn là lớp quyết định cuối.
* Local/default profile có thể tắt AI hoặc dùng mock; SAP BTP hiện bật Vercel AI Gateway theo route từng feature. Lỗi provider, timeout hoặc output sai không được làm hỏng workflow không dùng AI.
* Không gửi credential, token, email private, private endpoint, attachment content hoặc dữ liệu không cần thiết cho AI provider.
* Duplicate/similar detection v1 dùng OData action suggestion-only với hybrid text/classification/embedding scoring và fallback deterministic. Runtime candidate không tự persist vào `DuplicateLinks`; chỉ check gắn với bug đã lưu mới ghi `AiSuggestions` audit row an toàn.
* Duplicate/similar detection v1 uses a suggestion-only OData action with hybrid text/classification/embedding scoring and deterministic fallback. Runtime candidates are never auto-persisted as `DuplicateLinks`; only a check linked to a persisted source bug writes a safe `AiSuggestions` audit row.

---

# **5\. Out of Scope** 

Để scope không bị quá rộng, mình khuyên **không nên đưa các phần sau vào core scope**:

* Hệ thống tự động fix bug.  
* Developer sửa code trực tiếp trong hệ thống.  
* CI/CD deployment.  
* Code review.  
* Quản lý source code.  
* Quản lý task/project kiểu Jira đầy đủ.  
* Admin quản lý user phức tạp.  
* Approval workflow nhiều cấp.  
* AI Root Cause Analysis bắt buộc hoặc AI agent tự thực hiện workflow action.
* Dashboard KPI nâng cao nếu chưa đủ thời gian.  
* Tích hợp sâu với hệ thống SAP thật bên ngoài.  
* Thay thế hoàn toàn Jira, SAP Solution Manager hoặc ServiceNow.

---

# **6\. Tech Scope**

| Layer | Technology |
| :---- | :---- |
| Platform | SAP BTP |
| Frontend | SAP Fiori Elements / SAPUI5 |
| Backend | SAP CAP |
| Database | SAP HANA Cloud / PostgreSQL |
| API Exposure | CAP Service APIs |
| Workflow | SAP Build Process Automation, optional |
| Notification | SAP BTP services / third-party webhook integration |
| Authentication | SAP BTP AppRouter/XSUAA with SAP identity-to-IDTS-role alignment; custom `AuthService`/`AuthSessions` bearer authentication remains for local and Render/integration profiles. |

---

# **7. Current MVP Baseline Alignment**

Mục này đồng bộ project scope với các quyết định BA hiện hành trong `docs/project-context.md`, diagram BA, và business rules cập nhật.

## **7.1. Scope hiện hành**

IDTS là defect tracking system cho môi trường SAP testing. Hệ thống tập trung vào:

* Ghi nhận bug/defect.
* Kiểm tra bug trùng trước khi tạo mới.
* Phân loại bug theo SAP Module, Application Component và Defect Category.
* Assign Developer phù hợp theo Developer Responsibility.
* Cho phép `Pending Assignment` khi chưa có Developer phù hợp.
* Developer review, request more information, reject sai phân loại hoặc sai assignee, update status và note.
* Tester/PM xác nhận kết quả xử lý thông qua bước retest trước khi close nếu cần.
* Comment, attachment/evidence, notification, audit/history log.
* User-facing history may be summarized per business event, while raw field-level history logs remain available for audit.
* Lich su tren UI co the duoc nhom theo business event de doc nhanh, trong khi history log chi tiet van duoc giu cho audit.
* PM monitoring theo workload, overdue, status, next processor và planning fields.

## **7.2. Classification model**

Không nên dùng một field `Module / Category` chung cho mọi tình huống khi code chính thức.

Mô hình đúng:

| Khái niệm | Mục đích |
| ----- | ----- |
| **SAP Module** | Bối cảnh nghiệp vụ SAP như FI, MM, SD; optional nếu bug không thuộc SAP functional module, khi đó để trống |
| **Application Component** | Khu vực app/system nơi bug xuất hiện, ví dụ IDTS Bug Report, Dashboard, Custom Fiori App |
| **Defect Category** | Loại lỗi/tầng kỹ thuật như Fiori/UI5, SAP CAP Backend, Database, Authorization |
| **Component Category** | Cặp hợp lệ giữa Application Component và Defect Category |
| **Developer Responsibility** | Mapping Developer có thể xử lý Component Category nào, optional theo SAP Module |

## **7.3. Status scope**

Current master-data scope is 8 Application Components, 8 Defect Categories, and 31 active valid Component Category pairs. It includes `IDTS AI Advisory` with CAP Backend, Integration, Performance, and Data Quality. This taxonomy supports classification and Smart Assign candidate filtering; it does not extend scope to autonomous AI assignment.

Bộ status trong MVP:

* New (legacy/import compatibility only)
* Pending Assignment
* Assigned
* In Review
* Need More Information
* In Progress
* Resolved
* Retest Required
* Rejected
* Reopened
* Closed

`Reassigned` là action, không phải status chính. Trong create happy flow hiện tại, backend persist `Assigned` hoặc `Pending Assignment` ngay khi submit; `New` chỉ còn để tương thích dữ liệu cũ/import và các transition được kiểm soát.

`Rejected` là status hợp lệ nhưng không phải final status. Khi bug bị `Rejected`, hệ thống phải có rejection reason, history log, `nextProcessor` và follow-up action rõ ràng như sửa phân loại/ngữ cảnh, có thể bổ sung supporting information, reassign hoặc chuyển về `Pending Assignment`. Ở MVP, `Rejected` không đi trực tiếp sang `Need More Information`.

**English clarification:** `Rejected` is a valid follow-up status, not a terminal state. A rejected bug must always have a rejection reason, a next processor, and a clear next action.

**Giải thích tiếng Việt:** `Rejected` là status cần xử lý tiếp, không phải trạng thái kết thúc. Bug bị reject luôn phải có lý do reject, người xử lý tiếp, và hành động kế tiếp rõ ràng.

## **7.4. Retest and closure**

IDTS không nên đóng bug ngay khi Developer mark `Resolved`.

Flow hiện hành:

Developer mark `Resolved` -> Tester/PM xác định có cần retest không -> nếu cần thì `Retest Required` -> retest pass thì `Closed`, retest fail thì `Reopened`.

## **7.5. nextProcessor and PM monitoring**

`nextProcessor` là người hoặc queue cần hành động tiếp theo trên bug. Nó không thay thế Developer `assignee`.

UI wording baseline: show `Assignee (Technical Owner)` for the developer owner and `Current Action Owner` for the person or queue that must act now.

Hệ thống nên tự động cập nhật `nextProcessor` theo status/action:

* Assigned/In Review/In Progress -> assigned Developer.
* Need More Information -> Tester. PM có thể hỗ trợ follow-up và dùng `Resubmit to Developer` khi cần.
* Pending Assignment -> PM queue hoặc Tester.
* Rejected -> Tester hoặc PM để xử lý follow-up theo hướng sửa phân loại/ngữ cảnh, reassign hoặc đưa về `Pending Assignment`.
* Resolved/Retest Required -> Tester/PM.
* Closed -> không còn next processor.

PM dashboard nên hỗ trợ nhìn bug theo `assignee`, `nextProcessor`, overdue, priority/severity, SAP Module, Application Component và Defect Category.

## **7.6. Lightweight test context**

MVP có thể lưu reference nhẹ đến test context:

* `environment`
* `testCaseRef`
* `testRunRef`

Không xây full test management module trong scope hiện tại.

## **7.7. Database modeling baseline for WP1**

**English:** The implementation model for WP1 must follow `docs/ba/09-database-model-review.md`. This keeps IDTS aligned with SAP CAP/CDS and avoids turning the data model into a generic issue tracker. The core baseline is: UUID remains the technical key; `bugNumber` is added for readable tracking; Application Component and Defect Category are selected by users; Component Category is derived or validated for assignment; SAP Module is optional; `nextProcessor` supports role/queue ownership and specific user ownership when known; Rejected bugs store both latest display reason and historical audit reason; attachment handling uses `@cap-js/attachments`, with SQLite locally, SAP HANA/HDI on BTP, PostgreSQL for rollback/integration, and bound external object storage for binary content; duplicate checking stores confirmed links only.

**Vietnamese:** Implementation model cho WP1 phải đi theo `docs/ba/09-database-model-review.md`. Baseline chính là UUID + `bugNumber`, Component Category được derive/validate, SAP Module optional, `nextProcessor` hỗ trợ role/queue và user, attachment dùng `@cap-js/attachments`; local dùng SQLite, BTP dùng SAP HANA/HDI, PostgreSQL chỉ cho rollback/integration, còn binary nằm trong external object storage. Duplicate checking chỉ lưu link đã xác nhận.

## **7.8. Still out of scope**

Các phần sau vẫn nằm ngoài scope:

* Direct code fixing inside IDTS.
* Source code management.
* CI/CD.
* Code review workflow.
* Sprint planning.
* Transport/release management.
* Full SAP Cloud ALM, SAP Solution Manager, Jira hoặc ServiceNow replacement.
* Mandatory AI Root Cause Analysis.
* Autonomous AI assignment, duplicate confirmation, classification persistence, or lifecycle transitions.

## **7.9. Mentor-confirmed Sprint 02 implementation scope**

**English:**

After the latest mentor meeting, the team should not spend the next sprint redrawing the already accepted rules and diagrams. Sprint 02 should focus on implementing and demonstrating the happy flow for one bug, with the following scope refinements:

- Developers may view and discuss bugs in the same project/team when they have visibility permission.
- Bugs are not private to only the assigned developer, but primary processing actions remain controlled by assignee or authorized roles.
- Developer note is optional by default.
- Note/reason is mandatory only for specific transitions that need an explicit explanation: request more information, reject, resolve, and reopen.
- Fiori Bug Detail must prioritize the assignee and status fields, use dropdown/value help for status editing, make important input fields easy to use, and move severity/environment to a supporting or right-side information area where possible.
- DonHV is now Backend CAP lead and owner of backend bug fixing. NhanT supports backend verification and QA. DatDT leads Fiori/UI5. SangVN supports Fiori/UI5.

**Vietnamese:**

Sau buổi họp mentor gần nhất, team không nên dành sprint tiếp theo để vẽ lại rule và diagram đã được chấp nhận. Sprint 02 nên tập trung implement và demo happy flow cho một bug, với các điều chỉnh scope sau:

- Developer có thể xem và thảo luận bug trong cùng project/team khi có quyền visibility.
- Bug không private chỉ cho developer được assign, nhưng action xử lý chính vẫn do assignee hoặc role được phép thực hiện.
- Developer note mặc định là optional.
- Note/reason chỉ bắt buộc ở các transition cần giải thích rõ: request more information, reject, resolve và reopen.
- Fiori Bug Detail phải ưu tiên assignee và status, status edit bằng dropdown/value help, field quan trọng phải dễ nhập, và severity/environment nên nằm ở vùng thông tin phụ hoặc bên phải khi có thể.
- DonHV hiện là Backend CAP lead và owner phần backend bug fixing. NhanT hỗ trợ backend verification và QA. DatDT lead Fiori/UI5. SangVN hỗ trợ Fiori/UI5.
## IDTS-125 Role and assignee mutation boundary

**English:** A Developer who is not the assignee may read and comment only. The assigned Developer may comment, upload/update attachments, and use permitted lifecycle actions, but may not edit Bug business fields. On an open Bug, PM may delete any attachment; Tester or Developer may delete only an attachment that they uploaded. A committed deletion creates one sanitized business-history event and one field-level log at draft SAVE. Fiori may open an edit shell for supported attachment work, while CAP independently validates the persisted parent Bug and uploader metadata. CLOSED remains read-only.

**Tiếng Việt:** Developer không phải assignee chỉ được đọc và comment. Developer assignee được comment, upload/update attachment và dùng lifecycle action được phép nhưng không được sửa field nghiệp vụ Bug. Trên Bug đang mở, PM được xóa mọi attachment; Tester hoặc Developer chỉ được xóa attachment do chính mình upload. Delete đã commit tạo một business-history event đã sanitize và một field-level log tại draft SAVE. Fiori có thể mở edit shell cho attachment work được hỗ trợ, còn CAP kiểm tra độc lập Bug cha và uploader metadata đã persist. CLOSED vẫn read-only.
