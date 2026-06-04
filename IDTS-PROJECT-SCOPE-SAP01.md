# **Project Scope \- Issue and Defect Tracking System in SAP**

## **1\. Tên dự án**

**English:** Issue and Defect Tracking System in SAP  
**Vietnamese:** Hệ thống Quản lý và Theo dõi Vấn đề và Lỗi trong SAP

Dự án tập trung vào việc **ghi nhận, quản lý, phân loại, phân công và theo dõi trạng thái lỗi/vấn đề** trong quá trình kiểm thử phần mềm trên nền tảng SAP.

---

# **2\. Mục tiêu chính của hệ thống**

Hệ thống được xây dựng để hỗ trợ quy trình quản lý bug/defect từ lúc được phát hiện cho đến khi được Developer tiếp nhận và cập nhật trạng thái xử lý.

Mục tiêu chính gồm:

* Số hóa quy trình ghi nhận bug/defect.  
* Cho phép Tester tạo bug report đầy đủ thông tin.  
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

Role này là người tiếp nhận bug và cập nhật trạng thái xử lý.

Các quyền chính:

* View assigned bugs.  
* View bug details.  
* Review bug information.  
* Request more information nếu bug report chưa rõ.  
* Reject assigned bug nếu bug sai module hoặc không phù hợp; phải có lý do reject và follow-up owner.
* Add developer note.  
* Update bug status.

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
→ Tester chọn Developer phù hợp  
→ Hệ thống kiểm tra workload/availability nếu có  
→ Assign bug cho Developer

Nếu Developer đang bận hoặc workload không phù hợp:

Tester reassign bug cho Developer khác

---

## **4.5. Developer Review**

Developer sau khi nhận bug có thể:

* Xem chi tiết bug.  
* Kiểm tra thông tin bug có đủ rõ không.  
* Yêu cầu Tester bổ sung thông tin.  
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

Nếu bug đã assign cho Developer rồi, sau khi Tester chỉnh sửa thông tin, hệ thống nên notify Developer.

---

## **4.7. Status Tracking**

Hệ thống cần theo dõi trạng thái bug.

Bộ status đơn giản nên dùng:

New  
Assigned  
In Review  
Need More Information  
Reassigned  
In Progress  
Resolved  
Closed  
Rejected  
Reopened

---

## **4.8. Comment / Feedback**

Tester và Developer có thể trao đổi trong bug report.

Ví dụ:

* Tester bổ sung thông tin.  
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
* AI Root Cause Analysis bắt buộc.  
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
| Authentication | XSUAA, optional depending on implementation |

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
* PM monitoring theo workload, overdue, status, next processor và planning fields.

## **7.2. Classification model**

Không nên dùng một field `Module / Category` chung cho mọi tình huống khi code chính thức.

Mô hình đúng:

| Khái niệm | Mục đích |
| ----- | ----- |
| **SAP Module** | Bối cảnh nghiệp vụ SAP như FI, MM, SD; optional nếu bug không thuộc SAP functional module |
| **Application Component** | Khu vực app/system nơi bug xuất hiện, ví dụ IDTS Bug Report, Dashboard, Custom Fiori App |
| **Defect Category** | Loại lỗi/tầng kỹ thuật như Fiori/UI5, SAP CAP Backend, Database, Authorization |
| **Component Category** | Cặp hợp lệ giữa Application Component và Defect Category |
| **Developer Responsibility** | Mapping Developer có thể xử lý Component Category nào, optional theo SAP Module |

## **7.3. Status scope**

Bộ status trong MVP:

* New
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

`Reassigned` là action, không phải status chính.

`Rejected` là status hợp lệ nhưng không phải final status. Khi bug bị `Rejected`, hệ thống phải có rejection reason, history log, `nextProcessor` và follow-up action rõ ràng như sửa phân loại, bổ sung thông tin, reassign hoặc chuyển về `Pending Assignment`.

**English clarification:** `Rejected` is a valid follow-up status, not a terminal state. A rejected bug must always have a rejection reason, a next processor, and a clear next action.

**Giải thích tiếng Việt:** `Rejected` là status cần xử lý tiếp, không phải trạng thái kết thúc. Bug bị reject luôn phải có lý do reject, người xử lý tiếp, và hành động kế tiếp rõ ràng.

## **7.4. Retest and closure**

IDTS không nên đóng bug ngay khi Developer mark `Resolved`.

Flow hiện hành:

Developer mark `Resolved` -> Tester/PM xác định có cần retest không -> nếu cần thì `Retest Required` -> retest pass thì `Closed`, retest fail thì `Reopened`.

## **7.5. nextProcessor and PM monitoring**

`nextProcessor` là người hoặc queue cần hành động tiếp theo trên bug. Nó không thay thế Developer `assignee`.

Hệ thống nên tự động cập nhật `nextProcessor` theo status/action:

* Assigned/In Review/In Progress -> assigned Developer.
* Need More Information -> Tester.
* Pending Assignment -> PM queue hoặc Tester.
* Rejected -> Tester hoặc PM để xử lý follow-up.
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

**English:** The implementation model for WP1 must follow `docs/ba/09-database-model-review.md`. This keeps IDTS aligned with SAP CAP/CDS and avoids turning the data model into a generic issue tracker. The core baseline is: UUID remains the technical key; `bugNumber` is added for readable tracking; Application Component and Defect Category are selected by users; Component Category is derived or validated for assignment; SAP Module is optional; `nextProcessor` supports role/queue ownership and specific user ownership when known; Rejected bugs store both latest display reason and historical audit reason; attachments store metadata and reference only; duplicate checking stores confirmed links only.

**Vietnamese:** Implementation model cho WP1 phải đi theo `docs/ba/09-database-model-review.md`. Điều này giữ IDTS đúng hướng SAP CAP/CDS và tránh biến data model thành issue tracker generic. Baseline chính là: UUID vẫn là technical key; thêm `bugNumber` để tracking dễ đọc; Application Component và Defect Category do user chọn; Component Category được derive hoặc validate để assignment; SAP Module là optional; `nextProcessor` hỗ trợ ownership theo role/queue và user cụ thể khi biết rõ; bug Rejected lưu cả reason mới nhất để hiển thị và reason lịch sử để audit; attachment chỉ lưu metadata/reference; duplicate checking chỉ lưu link đã xác nhận.

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
