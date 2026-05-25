---

# **1\. Scope hệ thống**

Tên dự án:

**Issue and Defect Tracking System in SAP**  
**Hệ thống Quản lý và Theo dõi Vấn đề và Lỗi trong SAP**

Phạm vi chính của hệ thống là hỗ trợ quy trình **ghi nhận, báo cáo, phân công và theo dõi lỗi/vấn đề** trong quá trình kiểm thử phần mềm. Hệ thống tập trung vào việc giúp Tester ghi nhận bug rõ ràng, phân loại bug theo module/category, phân công bug cho Developer phù hợp, theo dõi trạng thái xử lý và hỗ trợ PM giám sát tiến độ tổng quan. Scope này cũng đang khớp với phần BR hiện có trong tài liệu, nơi hệ thống được mô tả là tập trung vào ghi nhận, báo cáo, phân công và theo dõi lỗi/vấn đề, không phải nơi Developer sửa code trực tiếp.

## **In scope**

Hệ thống bao gồm các phạm vi sau:

* Ghi nhận bug/defect report.  
* Kiểm tra bug đã tồn tại trước khi tạo bug mới.  
* Phân loại bug theo module/category.  
* Điền thông tin bug: title, description, priority/severity, steps to reproduce, actual result, expected result, evidence nếu có.  
* Assign bug cho Developer phù hợp.  
* Trường hợp chưa có Developer phù hợp thì bug có thể ở trạng thái **Pending Assignment**.  
* Developer xem bug được giao, review thông tin, yêu cầu bổ sung thông tin, ghi chú và cập nhật trạng thái.  
* Tester có thể chỉnh sửa/bổ sung bug report sau khi submit nếu bug chưa closed.  
* PM theo dõi tiến độ, workload, overdue bugs và báo cáo.  
* Comment giữa Tester, Developer và PM trong từng bug report.  
* Notification cho các sự kiện quan trọng.  
* Lưu history/audit log cho các thay đổi quan trọng.

## **Out of scope**

Hệ thống **không tập trung vào**:

* Developer sửa code trực tiếp trong hệ thống.  
* Deploy fix.  
* Code review.  
* Quản lý source code.  
* CI/CD.  
* Sprint planning.  
* Thay thế hoàn toàn Jira, SAP Solution Manager hoặc ServiceNow.  
* Full project management system.  
* Complex approval workflow nhiều cấp.  
* AI Root Cause Analysis bắt buộc.

Nói ngắn gọn với mentor:

Hệ thống của nhóm em không phải là nơi sửa lỗi trực tiếp, mà là hệ thống hỗ trợ ghi nhận, phân công, theo dõi và quản lý trạng thái bug trong môi trường SAP.

---

# **2\. Roles trong hệ thống**

Hệ thống có **3 role chính**:

| Role | Mục đích chính |
| ----- | ----- |
| **Tester / Admin / Reporter** | Phát hiện, ghi nhận, cập nhật, assign/reassign và theo dõi bug |
| **Developer** | Tiếp nhận bug, review thông tin, phản hồi và cập nhật trạng thái |
| **PM** | Theo dõi tổng quan tiến độ, workload, overdue bugs và báo cáo |

## **Role 1: Tester / Admin / Reporter**

Role này là người trực tiếp phát hiện lỗi, tạo bug report và phân công bug.

Các nhiệm vụ chính:

* Detect bug.  
* Check existing bug.  
* Create bug report.  
* Add bug description.  
* Set priority/severity.  
* Select module/category.  
* Upload screenshot/evidence nếu có.  
* Submit bug report.  
* Assign bug cho Developer.  
* Reassign bug cho Developer khác nếu cần.  
* Edit submitted bug report nếu bug chưa closed.  
* Add comment/feedback.  
* Track bug status.  
* Reopen bug nếu bug cũ cần mở lại.

## **Role 2: Developer**

Role này là người tiếp nhận bug được phân công và cập nhật trạng thái xử lý.

Các nhiệm vụ chính:

* View assigned bugs.  
* View bug details.  
* Review bug information.  
* Request more information nếu bug report chưa rõ.  
* Add developer note.  
* Update bug status.  
* Reject assigned bug nếu bug sai module/category hoặc không phù hợp.  
* Comment trong bug report.  
* Không trực tiếp đóng vai trò sửa code trong hệ thống.

## **Role 3: PM**

Role này là người theo dõi tổng quan tiến độ và tình trạng xử lý bug.

Các nhiệm vụ chính:

* View all bug reports.  
* View bug details.  
* Search/filter bugs.  
* Track bug status.  
* View bug history.  
* Monitor developer workload.  
* View overdue bugs.  
* View dashboard/report.  
* Receive escalation notification.  
* Request reassignment when needed.  
* Tham gia comment trong bug report để nhắc tiến độ, hỏi tình trạng hoặc yêu cầu cập nhật.

Điểm cần chốt rõ với mentor:

PM không thay Developer để ghi technical note, không thay Tester để xác nhận nội dung bug, nhưng PM có thể tham gia comment để theo dõi và điều phối tiến độ.

---

# **3\. Main features của hệ thống**

Ở giai đoạn này, nhóm nên chốt feature ở mức tổng thể trước, chưa cần ràng rule quá chi tiết.

## **3.1. Bug Reporting**

Tester có thể tạo bug report với các thông tin chính:

* Bug title  
* Bug description  
* Module/category  
* Priority/severity  
* Steps to reproduce  
* Actual result  
* Expected result  
* Screenshot/evidence nếu có  
* Attachment/log file nếu có  
* Comment nếu cần

Trước khi tạo bug mới, Tester cần kiểm tra xem bug tương tự đã tồn tại chưa.

Các case chính:

| Trường hợp | Hành động |
| ----- | ----- |
| Bug đã tồn tại và đang mở | Follow existing bug report |
| Bug đã tồn tại nhưng đã closed | Update hoặc reopen existing bug |
| Bug chưa tồn tại | Create new bug report |

---

## **3.2. Developer Selection Based on Affected Area / Responsible Area** 

Khi tạo bug report, Tester cần xác định **khu vực chịu ảnh hưởng** của bug trước khi assign Developer. Việc này giúp hệ thống lọc ra danh sách Developer phù hợp và hạn chế assign sai người.

Trong hệ thống, khu vực chịu ảnh hưởng không chỉ được hiểu là “SAP module” theo nghĩa hẹp, mà có thể bao gồm:

* **SAP Functional Module**: FI, CO, MM, SD, PP, HCM, v.v.  
* **Technical Component**: Fiori/UI5, SAP CAP, HANA Database, Workflow, Integration, Authorization, v.v.  
* **Custom Application Area**: các chức năng riêng của hệ thống Issue and Defect Tracking System như Bug Report, Assignment, Comment, Notification, Dashboard, v.v.

Ví dụ:

| Affected Area / Responsible Area | Ý nghĩa | Developer được hiển thị |
| ----- | ----- | ----- |
| **SAP FI** | Lỗi liên quan đến tài chính/kế toán | Developer phụ trách FI |
| **SAP MM** | Lỗi liên quan đến quản lý vật tư/mua hàng | Developer phụ trách MM |
| **SAP SD** | Lỗi liên quan đến bán hàng/phân phối | Developer phụ trách SD |
| **Fiori/UI5** | Lỗi giao diện, màn hình, form, layout | Developer phụ trách UI/Fiori |
| **SAP CAP Backend** | Lỗi service, logic xử lý, validation backend | Developer phụ trách CAP/backend |
| **SAP HANA Database, PostgreSQL** | Lỗi lưu trữ, truy vấn, data model | Developer phụ trách database |
| **Workflow / Process Automation** | Lỗi luồng xử lý, approval, trạng thái | Developer phụ trách workflow |
| **Integration / Notification** | Lỗi email, webhook, notification, API bên ngoài | Developer phụ trách integration |
| **Authorization / Security** | Lỗi phân quyền, truy cập, role | Developer phụ trách security |
| **Dashboard / Reporting** | Lỗi báo cáo, biểu đồ, workload, overdue | Developer phụ trách dashboard/reporting |
| **Other / Unknown** | Chưa xác định rõ khu vực lỗi | Chọn “Chưa có Developer phù hợp” hoặc PM theo dõi |

---

## **3.3. Submit Bug**

Sau khi Tester hoàn tất việc nhập thông tin bug report, hệ thống sẽ thực hiện bước **Submit Bug** để chính thức ghi nhận bug vào hệ thống.

Mục đích của bước này là đảm bảo bug report được lưu lại một cách đầy đủ, có thể theo dõi, có trạng thái ban đầu rõ ràng và có thể tiếp tục xử lý trong các bước tiếp theo.

Trước khi cho phép submit, hệ thống cần kiểm tra các thông tin bắt buộc của bug report, bao gồm:

* Tiêu đề bug  
* Mô tả bug  
* Affected Area / Responsible Area  
* Priority / Severity  
* Steps to reproduce  
* Actual result  
* Expected result  
* Screenshot / Evidence nếu được yêu cầu theo loại bug  
* Assignment option nếu hệ thống yêu cầu chọn người xử lý hoặc chọn trạng thái chờ phân công

Sau khi submit thành công, hệ thống sẽ:

* Tạo một **Bug ID** duy nhất cho bug report  
* Lưu toàn bộ thông tin bug vào hệ thống  
* Ghi nhận người tạo bug và thời gian tạo bug  
* Thiết lập trạng thái ban đầu cho bug  
* Ghi lại lịch sử tạo bug trong audit/history log  
* Gửi notification nếu có sự kiện cần thông báo  
* Cho phép bug tiếp tục đi vào luồng review, assignment hoặc tracking

Trạng thái ban đầu của bug sau khi submit có thể phụ thuộc vào tình huống thực tế: 

| Trường hợp | Trạng thái sau khi submit | Ý nghĩa |
| ----- | ----- | ----- |
| Bug đã có Developer phụ trách | **Assigned** | Bug đã được ghi nhận và có người chịu trách nhiệm xử lý |
| Bug chưa xác định được Developer phù hợp | **Pending Assignment** | Bug đã được ghi nhận nhưng cần được phân công sau |
| Bug được tạo nhưng cần kiểm tra thêm thông tin | **New** hoặc **Need Review** | Bug đã được ghi nhận nhưng cần được kiểm tra lại trước khi xử lý |

Nếu bug có Developer phù hợp, bug có thể chuyển sang trạng thái **Assigned**. Nếu chưa có Developer phù hợp, bug vẫn được ghi nhận nhưng ở trạng thái **Pending Assignment** để PM hoặc Tester/Admin/Reporter theo dõi và phân công sau. 

Cách này giữ được logic chặt chẽ nhưng vẫn thực tế, vì trong một số trường hợp chưa có Developer phù hợp hoặc Developer đang quá tải.

---

## **3.4. Developer Review**

Sau khi bug được assign, Developer có thể:

* Xem bug được giao.  
* Review thông tin bug.  
* Kiểm tra module/category có phù hợp không.  
* Yêu cầu Tester bổ sung thông tin nếu bug chưa rõ.  
* Reject bug nếu bug không thuộc phạm vi xử lý.  
* Add developer note.  
* Update bug status.

Các case chính:

| Trường hợp | Hành động |
| ----- | ----- |
| Bug rõ ràng và phù hợp | Developer review và cập nhật status |
| Bug thiếu thông tin | Developer request more information |
| Bug sai module/category | Developer reject bug |
| Bug cần chuyển người khác | Tester reassign bug |

---

## **3.5. Comment / Feedback**

Comment là nơi trao đổi giữa các role trong từng bug report.

Người có thể tham gia comment:

* Tester / Admin / Reporter  
* Developer chịu trách nhiệm cho bug  
* PM phụ trách dự án/team

Mục đích comment:

* Tester bổ sung thông tin.  
* Developer hỏi thêm thông tin.  
* Developer ghi chú phân tích.  
* Tester feedback.  
* PM nhắc tiến độ hoặc hỏi tình trạng xử lý.  
* PM yêu cầu cập nhật hoặc đề xuất reassign nếu cần.

Rule quan trọng:

Comment không trực tiếp thay đổi trạng thái bug. Nếu có thay đổi status, hệ thống cần ghi nhận bằng status update và history log riêng.

---

## **3.6. Status Tracking**

Hệ thống cần có trạng thái rõ ràng cho bug.

Bộ status nên giữ:

| Status | Ý nghĩa |
| ----- | ----- |
| **New** | Bug mới được tạo hoặc đang ở trạng thái ghi nhận ban đầu |
| **Pending Assignment** | Bug đã submit nhưng chưa có Developer phù hợp |
| **Assigned** | Bug đã được assign cho Developer |
| **In Review** | Developer đang review thông tin bug |
| **Need More Information** | Developer yêu cầu Tester bổ sung thông tin |
| **In Progress** | Developer đang xử lý/theo dõi xử lý |
| **Resolved** | Developer đã cập nhật kết quả xử lý |
| **Rejected** | Developer từ chối vì sai module/không phù hợp |
| **Reopened** | Bug được mở lại |
| **Closed** | Bug đã đóng |

---

## **3.7. PM Monitoring**

PM có thể theo dõi:

* Tất cả bug report.  
* Bug theo status.  
* Bug theo priority/severity.  
* Bug theo module/category.  
* Bug theo Developer.  
* Developer workload.  
* Bug overdue.  
* Bug bị reject nhiều lần.  
* Bug bị pending assignment lâu.  
* Bug lâu chưa cập nhật.

PM có thể nhận escalation notification khi:

* Bug high/critical chưa được assign.  
* Bug bị overdue.  
* Bug pending assignment quá lâu.  
* Developer reject bug.  
* Bug bị reassign nhiều lần.  
* Bug không được cập nhật trong thời gian quy định.

---

# **4\. Flow tổng thể của hệ thống**

Đây là flow tổng thể nên báo cáo mentor trước khi siết business rules.

## **Main Flow**

Tester phát hiện bug  
→ Tester kiểm tra bug đã tồn tại chưa  
→ Nếu bug đã tồn tại và đang mở: follow existing bug  
→ Nếu bug đã tồn tại nhưng đã closed: update/reopen existing bug  
→ Nếu bug chưa tồn tại: create new bug report  
→ Tester điền thông tin bug  
→ Tester chọn module/category  
→ Hệ thống hiển thị Developer theo module/category  
→ Tester chọn Developer cụ thể hoặc chọn “Chưa có Developer phù hợp”  
→ Tester submit bug

Sau khi submit:

Nếu chọn Developer cụ thể  
→ Bug status \= Assigned  
→ Developer nhận bug  
→ Developer review bug

Nếu chọn “Chưa có Developer phù hợp”  
→ Bug status \= Pending Assignment  
→ PM được notify hoặc theo dõi  
→ Tester/PM tìm Developer phù hợp  
→ Reassign/assign bug sau

## **Developer Flow**

Developer nhận bug được assign  
→ Developer xem bug details  
→ Developer kiểm tra thông tin bug  
→ Nếu thông tin chưa rõ: Request More Information  
→ Tester bổ sung thông tin  
→ Developer review lại

Nếu bug sai module/category:

Developer reject bug  
→ Bug quay lại Tester  
→ Tester cập nhật module/category nếu cần  
→ Tester reassign cho Developer khác

Nếu bug hợp lệ:

Developer cập nhật status  
→ Add developer note nếu cần  
→ Bug chuyển qua các trạng thái phù hợp

## **PM Monitoring Flow**

PM xem dashboard/report  
→ PM theo dõi workload và overdue bugs  
→ Nếu bug pending assignment quá lâu hoặc overdue  
→ PM comment/nhắc tiến độ hoặc request reassignment

---

	