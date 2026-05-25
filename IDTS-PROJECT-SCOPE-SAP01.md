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

## **Role 1: Tester / Admin / Reporter**

Role này đại diện cho người phát hiện, ghi nhận, kiểm tra và quản lý bug ở mức cơ bản.

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
* Reject assigned bug nếu bug sai module hoặc không phù hợp.  
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
* Reporter information  
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
* Từ chối bug nếu bug bị assign sai module.  
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

