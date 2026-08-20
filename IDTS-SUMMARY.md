---

## One-to-one workflow action audit

The Bug workflow is command-traceable: `assignToDeveloper`, `moveToPendingAssignment`, `markInReview`, `requestMoreInformation`, `resubmitToDeveloper`, `rejectBug`, `startProgress`, `resolveBug`, `sendToRetest`, `closeBug`, and `reopenBug` each persist a distinct ActionType in `HistoryEvents` and `HistoryLogs`. This improves audit meaning only; it does not rename OData actions, change the status lifecycle, change roles, or rewrite legacy history.

Vietnamese: 11 workflow command của Bug được trace 1–1 bằng ActionType riêng trong `HistoryEvents` và `HistoryLogs`. Thay đổi này chỉ làm rõ audit; không đổi endpoint OData, status lifecycle, role hoặc lịch sử cũ.

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
* Tester có thể chỉnh sửa/bổ sung bug report sau khi submit nếu bug chưa closed. Closed Bug là read-only aggregate; muốn xử lý tiếp phải Reopen trước.
* PM theo dõi tiến độ, workload, overdue bugs và báo cáo.  
* Developer capacity dùng tất cả Bug còn assignee và chưa `Closed`: 0-1 là Available, 2 là Busy nhưng vẫn nhận Bug thứ ba, từ 3 là Unavailable và backend chặn assignment mới. `Rejected` vẫn được tính; nếu không còn Developer phù hợp thì dùng `Pending Assignment`, không có PM override.
* Comment giữa Tester, Developer và PM trong từng bug report.  
* Notification cho các sự kiện quan trọng.  
* Lưu history/audit log cho các thay đổi quan trọng.
* AI hỗ trợ dạng suggestion-only cho tìm bug trùng/tương tự, gợi ý phân loại, tóm tắt bug/handoff (bao gồm tóm tắt comment có căn cứ) và giải thích Smart Assign. Mọi kết quả phải được người dùng review; AI không tự thay đổi dữ liệu hoặc workflow.

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
* AI Root Cause Analysis bắt buộc hoặc autonomous agent tự assign, reject, close hay đổi status.

**English clarification:** AI assistance is optional and advisory. CAP validation, role authorization, and explicit human actions remain authoritative. AI failure must not block the normal IDTS workflow. Persisted `AiSuggestions` are audit/review records only; they do not mean AI has applied a workflow decision.

**Runtime model-routing clarification (2026-08-03):** SAP BTP uses feature-specific Vercel Gateway models to reduce shared-model rate-limit contention: Qwen embeddings for Similar Bugs, GPT-5.4 Nano for Classification, MiniMax M2.5 for Handoff Summary, and Z.AI GLM 4.7 Flash for Smart Assign/general structured output. Handoff may use Grok once for an eligible model-route failure, timeout, network error, or HTTP 5xx. HTTP 429 and generic HTTP 403 never trigger another model. This routing is a technical resilience decision and does not change the advisory-only business contract.

**Tiếng Việt:** AI là tính năng hỗ trợ tùy chọn. Validation CAP, phân quyền role và hành động rõ ràng của người dùng vẫn là nguồn quyết định cuối. AI lỗi không được chặn workflow IDTS bình thường.

**IDTS-66 runtime clarification:** Duplicate/similar checking is exposed as an authenticated suggestion action. It ranks existing bugs using text, classification context, and embeddings when available; deterministic fallback remains available when AI is disabled or fails. The action never confirms a duplicate or writes `DuplicateLinks` automatically.

**Làm rõ runtime IDTS-66:** Kiểm tra bug trùng/tương tự được expose dưới dạng action gợi ý có yêu cầu đăng nhập. Backend xếp hạng bug hiện có bằng text, classification context và embedding khi dùng được; nếu AI tắt hoặc lỗi thì vẫn có deterministic fallback. Action không tự xác nhận bug trùng và không tự ghi `DuplicateLinks`.

Nói ngắn gọn với mentor:

Hệ thống của nhóm em không phải là nơi sửa lỗi trực tiếp, mà là hệ thống hỗ trợ ghi nhận, phân công, theo dõi và quản lý trạng thái bug trong môi trường SAP.

---

# **2\. Roles trong hệ thống**

Hệ thống có **3 role chính**:

| Role | Mục đích chính |
| ----- | ----- |
| **Tester** | Phát hiện, ghi nhận, cập nhật, assign/reassign, bổ sung thông tin, retest/close/reopen và theo dõi bug |
| **Developer** | Tiếp nhận bug, review thông tin, phản hồi và cập nhật trạng thái |
| **PM** | Theo dõi tổng quan tiến độ, workload, overdue bugs và báo cáo |

## **Role 1: Tester**

Role này là người trực tiếp phát hiện lỗi, tạo bug report và phân công bug. Trong MVP hiện tại, `Reporter` không tách thành role riêng vì hệ thống dùng nội bộ và Tester là người chính báo cáo bug. `Admin` cũng chưa tách thành role riêng vì chưa có workflow admin chuyên biệt; các việc quản trị nhẹ sẽ do Tester hoặc PM xử lý theo quyền được cấp.

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

Role này là người tiếp nhận bug được phân công, có thể xem/thảo luận bug thuộc cùng project/team khi có quyền visibility, và cập nhật trạng thái xử lý trong phạm vi được phép.

Các nhiệm vụ chính:

* View assigned bugs.  
* View team-visible bugs trong cùng project/team khi có quyền visibility.
* View bug details.  
* Review bug information.  
* Request more information nếu bug report chưa rõ.  
* Add developer note khi cần; developer note mặc định optional trừ các transition bắt buộc reason/note.
* Update processing status nếu là assignee hoặc role được phép.
* Reject bug nếu bug sai module/category, sai assignment hoặc không phù hợp; phải có lý do reject và người follow-up tiếp theo.
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
| Trạng thái `New` | **Legacy / import compatibility only** | Giữ lại để tương thích dữ liệu cũ hoặc dữ liệu import; không phải trạng thái submit chuẩn của happy flow hiện tại |

Nếu bug có Developer phù hợp, bug được ghi nhận trực tiếp ở trạng thái **Assigned**. Nếu chưa có Developer phù hợp, bug được ghi nhận ở trạng thái **Pending Assignment** để PM hoặc Tester theo dõi và phân công sau. Trong create happy flow hiện tại, backend không persist `New`; `New` chỉ còn để tương thích dữ liệu cũ/import.

**English clarification:** Only a Tester can create a new Bug. IDTS must not automatically pick a Developer during create. If the Tester does not explicitly select an assignee, the bug starts as `Pending Assignment`.

**Tiếng Việt:** Chỉ Tester được tạo Bug mới. IDTS không được tự chọn Developer khi tạo bug. Nếu Tester không chủ động chọn assignee, bug sẽ bắt đầu ở `Pending Assignment`.

Cách này giữ được logic chặt chẽ nhưng vẫn thực tế, vì trong một số trường hợp chưa có Developer phù hợp hoặc Developer đang quá tải.

---

## **3.4. Developer Review**

Sau khi bug được assign, Developer có thể:

* Xem bug được giao.  
* Review thông tin bug.  
* Kiểm tra module/category có phù hợp không.  
* Yêu cầu Tester bổ sung thông tin nếu bug chưa rõ.  
* Reject bug nếu bug không thuộc phạm vi xử lý; phải ghi rõ lý do và follow-up owner.
* Add developer note.  
* Update bug status.

Các case chính:

| Trường hợp | Hành động |
| ----- | ----- |
| Bug rõ ràng và phù hợp | Developer review và cập nhật status |
| Bug thiếu thông tin | Developer request more information |
| Bug sai module/category hoặc assignee không phù hợp | Developer reject kèm lý do; Tester hoặc PM follow-up để sửa phân loại/ngữ cảnh, có thể bổ sung supporting information, reassign hoặc đưa về Pending Assignment |
| Bug cần chuyển người khác | Tester reassign bug |

---

## **3.5. Comment / Feedback**

Comment là nơi trao đổi giữa các role trong từng bug report.

Người có thể tham gia comment:

* Tester
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
| **New** | Trạng thái tương thích dữ liệu cũ/import; không phải trạng thái khởi tạo chuẩn của create happy flow hiện tại |
| **Pending Assignment** | Bug đã submit nhưng chưa có Developer phù hợp |
| **Assigned** | Bug đã được assign cho Developer |
| **In Review** | Developer đang review thông tin bug |
| **Need More Information** | Developer yêu cầu Tester bổ sung thông tin |
| **In Progress** | Developer đang xử lý/theo dõi xử lý |
| **Resolved** | Developer đã cập nhật kết quả xử lý |
| **Rejected** | Developer từ chối vì sai module/category hoặc assignee không phù hợp; đây là status cần follow-up, không phải final status |
| **Reopened** | Bug được mở lại |
| **Closed** | Bug đã đóng và aggregate chuyển thành read-only; chỉ Reopen hoặc PM reassign retest owner là ngoại lệ |

### **Retest ownership and Closed behavior**

`retestOwner` lưu Tester chịu trách nhiệm xác nhận kết quả. Giá trị ban đầu là Tester tạo Bug; giá trị có thể đổi khi Tester khác thực hiện retest/reopen hoặc khi PM dùng action điều phối riêng. Nó độc lập với Developer `assignee` và `nextProcessor`.

Closed Bug không cho edit, assign/reassign Developer, comment, attachment mutation, AI mutation hoặc lifecycle action khác. Existing evidence vẫn đọc/download được. Người dùng phải Reopen trước khi tiếp tục xử lý nghiệp vụ.

Bug record không được hard delete ở bất kỳ trạng thái nào; lifecycle và audit history là cơ chế kiểm soát vòng đời chính thức.

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
* Developer reject bug và hệ thống cần xác định follow-up owner.
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
→ Bug status = Need More Information
→ Tester hoặc PM bổ sung thông tin qua edit/comment/attachment
→ Tester hoặc PM dùng `Resubmit to Developer` kèm update summary
→ Bug status quay về `Assigned`
→ Hệ thống giữ update summary trong history, gửi notification và trả `nextProcessor` về Developer được assign; chỉ tạo comment khi user chủ động dùng Add Comment
→ Developer review lại

Nếu bug sai module/category hoặc assignee không phù hợp:

Developer reject bug kèm lý do
→ Bug status = Rejected
→ Hệ thống lưu rejection reason, history log và `nextProcessor`
→ Tester hoặc PM follow-up
→ Tester hoặc PM cập nhật module/category, bổ sung thông tin hoặc đổi assignee nếu cần
→ Reassign cho Developer khác hoặc đưa bug về Pending Assignment nếu chưa có Developer phù hợp

**English clarification:** `Rejected` is not the end of the bug lifecycle. It is a follow-up status that must identify who acts next and what correction is required.

**Tiếng Việt:** `Rejected` không kết thúc vòng đời bug. Đây là status cần xử lý tiếp và phải xác định rõ ai xử lý tiếp, cần sửa gì hoặc cần phân công lại như thế nào.

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


---

# **5. Current BA Baseline Alignment**

Mục này là baseline hiện hành để đồng bộ với `docs/project-context.md`, diagram BA, và các quyết định đã chốt trước khi code CAP/Fiori.

## **5.1. Classification Model**

**Approved classification catalog baseline (IDTS-122):** the catalog contains 8 Application Components, 8 Defect Categories, and 31 active valid Component Category pairs. `IDTS AI Advisory` is a distinct Application Component for defects in AI advisory orchestration; it supports CAP Backend, Integration, Performance, and Data Quality categories. `DeveloperResponsibilities` supplies eligible human candidates for each pair and never authorizes AI to assign a developer automatically.

Từ giờ không gộp tất cả vào một khái niệm `module/category` chung nữa. Khi triển khai, hệ thống dùng các khái niệm rõ hơn:

| Khái niệm | Ý nghĩa | Ví dụ |
| ----- | ----- | ----- |
| **SAP Module** | Bối cảnh nghiệp vụ SAP thật sự | FI, MM, SD, CO, PP, HCM |
| **Application Component** | Màn hình, app, service, hoặc khu vực chức năng nơi bug xuất hiện | IDTS Bug Report, Assignment, Notification, Dashboard, Custom Fiori App |
| **Defect Category** | Loại lỗi hoặc tầng kỹ thuật của lỗi | Fiori/UI5, SAP CAP Backend, Database, Authorization, Integration, Workflow |
| **Component Category** | Cặp hợp lệ giữa Application Component và Defect Category | IDTS Bug Report + Fiori/UI5 |
| **Developer Responsibility** | Mapping Developer với Component Category, có thể giới hạn thêm theo SAP Module | Dev A xử lý IDTS Bug Report + Fiori/UI5 trong FI |

Luồng chọn trên Fiori nên là:

Tester chọn `SAP Module` nếu liên quan -> hệ thống lọc `Application Component` -> Tester chọn `Defect Category` hợp lệ -> hệ thống lọc Developer theo `Developer Responsibility`.

Với bug thuần IDTS, `SAP Module` nên để trống. Không dùng giá trị giả như `Not Applicable`. Không được gọi các chức năng IDTS như Bug Report, Assignment, Notification là SAP Module.

## **5.2. Current Status Set**

Bộ status hiện hành:

| Status | Ý nghĩa |
| ----- | ----- |
| **New** | Trạng thái tương thích dữ liệu cũ/import; không phải trạng thái khởi tạo chuẩn của create happy flow hiện tại |
| **Pending Assignment** | Bug đã submit nhưng chưa có Developer phù hợp |
| **Assigned** | Bug đã được assign cho một Developer chính |
| **In Review** | Developer đang review thông tin bug |
| **Need More Information** | Developer yêu cầu Tester bổ sung thông tin |
| **In Progress** | Developer đang xử lý hoặc theo dõi xử lý ngoài IDTS |
| **Resolved** | Developer đã cung cấp kết quả xử lý/phản hồi |
| **Retest Required** | Tester/PM cần kiểm tra lại trước khi đóng |
| **Rejected** | Developer từ chối vì sai phân loại hoặc assign không phù hợp; đây là status cần follow-up, không phải final status |
| **Reopened** | Bug được mở lại vì vấn đề vẫn còn |
| **Closed** | Bug đã được xác nhận hoàn tất |

`Reassigned` không phải status chính. Reassign là một action và phải được ghi vào history log.

## **5.2.1. Rejected Follow-up Rule**

**English:** `Rejected` is allowed as a bug status, but it is not a final state. When a bug becomes `Rejected`, the system must store a rejection reason, set `nextProcessor`, and make the next responsible party clear. The follow-up owner is normally Tester or PM. In the MVP, the next action should be to correct classification/context, optionally add supporting information, reassign to another Developer, or move the bug back to `Pending Assignment` when no suitable Developer is available. `Rejected` does not go directly to `Need More Information`.

**Tiếng Việt:** `Rejected` được phép là status của bug, nhưng không phải trạng thái kết thúc. Khi bug chuyển sang `Rejected`, hệ thống phải lưu lý do reject, set `nextProcessor`, và xác định rõ ai chịu trách nhiệm xử lý tiếp. Người follow-up thường là Tester hoặc PM. Ở MVP, hướng xử lý tiếp theo là sửa phân loại/ngữ cảnh, có thể bổ sung thêm thông tin hỗ trợ, reassign cho Developer khác, hoặc đưa bug về `Pending Assignment` nếu chưa có Developer phù hợp. `Rejected` không đi trực tiếp sang `Need More Information`.

## **5.3. Resolve and Retest Flow**

Flow xử lý cuối nên là:

Developer xử lý hoặc phản hồi xong -> status `Resolved` -> nếu cần xác minh thì chuyển `Retest Required` -> Tester/PM retest -> nếu pass thì `Closed`, nếu fail thì `Reopened`.

Không nên cho Developer tự đóng bug trực tiếp nếu team muốn Tester hoặc PM là người xác nhận cuối cùng.

## **5.4. Next Processor**

`nextProcessor` không phải role mới và không thay thế `assignee`.

- `assignee`: Developer chính chịu trách nhiệm kỹ thuật.
- `nextProcessor`: người hiện tại cần thực hiện hành động tiếp theo.
- UI wording baseline: show `Assignee (Technical Owner)` for the developer owner and `Current Action Owner` for the person or queue that must act now.

Ví dụ:

| Status | Next processor hợp lý |
| ----- | ----- |
| **Pending Assignment** | PM queue hoặc Tester |
| **Assigned / In Review / In Progress** | Developer được assign |
| **Need More Information** | Tester (PM có thể hỗ trợ coordination và resubmit) |
| **Rejected** | Tester hoặc PM để sửa phân loại/ngữ cảnh, có thể bổ sung thêm supporting information, reassign, hoặc đưa về Pending Assignment |
| **Resolved / Retest Required** | Tester/PM |
| **Closed** | Không cần next processor |

`nextProcessor` nên được hệ thống set tự động theo status/action. Trong MVP, chỉ PM nên override thủ công trong trường hợp escalation hoặc ngoại lệ.

## **5.5. Lightweight Test Context and Planning**

IDTS nên lưu thêm thông tin test context ở mức nhẹ:

* `environment`: môi trường phát hiện lỗi, ví dụ DEV, QAS, UAT, browser, device, SAP client nếu có.
* `testCaseRef`: mã hoặc link tham chiếu test case nếu bug phát sinh từ test case.
* `testRunRef`: mã hoặc link tham chiếu lần chạy test.

Các field này giúp trace bug tốt hơn nhưng không biến IDTS thành full test management system.

PM monitoring nên có thêm các field như:

* `plannedCompletionDate`
* `dueDate`
* `estimatedEffortHours`
* `nextProcessor`

## **5.6. Database Modeling Baseline for WP1**

**English:** WP1 Data Model Foundation follows `docs/ba/09-database-model-review.md`. The Bug model keeps UUID as the technical key and adds readable `bugNumber`. Tester selects Application Component and Defect Category; the system derives or validates Component Category for assignment. SAP Module is optional context. `nextProcessor` is a lightweight hybrid ownership concept with a role/queue code and a specific user when known. Rejected bugs keep the latest rejection reason on Bug and preserve prior reasons through service-managed HistoryLogs. User-facing history is grouped as readable `HistoryEvents`, while `HistoryLogs` is the raw append-only field audit by service behavior; no database immutability constraint is claimed. Attachments use the SAP-supported `@cap-js/attachments` composition. SQLite is local, SAP BTP persists metadata/reference in HANA/HDI with binary content in bound external object storage, and PostgreSQL remains rollback/integration reference. Duplicate checking stores confirmed Duplicate/Similar/Related links, not every runtime candidate.

**Vietnamese:** WP1 Data Model Foundation đi theo `docs/ba/09-database-model-review.md`. Bug model giữ UUID làm technical key và thêm `bugNumber` dễ đọc. Tester chọn Application Component và Defect Category; hệ thống derive hoặc validate Component Category để assignment. SAP Module là context tùy chọn. `nextProcessor` gồm role/queue code và user cụ thể khi biết rõ. Bug Rejected lưu reason mới nhất trên Bug; service bảo toàn reason cũ qua `HistoryLogs`. `HistoryEvents` nhóm lịch sử dễ đọc, còn `HistoryLogs` là field audit append-only theo service behavior; không tuyên bố có database immutability constraint. Attachment dùng `@cap-js/attachments`; local dùng SQLite, BTP lưu metadata/reference trong HANA/HDI và binary trong external object storage, PostgreSQL chỉ là rollback/integration reference. Duplicate checking chỉ lưu link đã xác nhận.

## **5.7. SAP Tooling Reference**

Baseline này mượn các điểm phù hợp từ SAP Cloud ALM và Focused Build:

* Defect có thể liên quan test run/test case.
* Có vòng xử lý resolved -> retest -> close.
* Có người chịu trách nhiệm bước tiếp theo.
* PM cần dữ liệu planning và overdue rõ ràng.

Không áp dụng các phần quá nặng như full ALM, ITSM, transport/release management, CI/CD, code review, source-code management, hoặc full Jira replacement.

## **5.8. Authentication Baseline**

**English:** SAP BTP uses AppRouter/XSUAA platform authentication; CAP maps the SAP identity to the active `Users` row and enforces platform/business-role alignment. Linked users are resolved by a unique hash of identity-provider origin, issuer, and subject; email is mutable and never authorizes a complete external identity. Existing legacy rows remain nullable for controlled link/backfill. Local and Render/integration profiles retain custom CAP authentication with `Users.passwordHash`, `AuthSessions` and bearer-token mapping, including internal ID/email compatibility when no complete external tuple is present. Plaintext passwords, raw tokens, auth secrets, SMTP credentials, and private endpoints must not be committed.

**Vietnamese:** Tren SAP BTP, IDTS dung AppRouter/XSUAA, map SAP identity toi `Users` dang active va kiem tra platform role khop business role. User da link duoc map bang hash duy nhat cua origin, issuer va subject; email la attribute co the doi va khong authorize mot external identity day du. User legacy de nullable cho link/backfill co kiem soat. Local va Render/integration van dung custom CAP authentication voi `Users.passwordHash`, `AuthSessions` va bearer token, gom compatibility ID/email khi request khong co du external tuple. Khong commit plaintext password, raw token, auth secret, SMTP credential hoac private endpoint.

### **5.8.1. Controlled User Onboarding**

**English:** User administration is a separate capability overlay. An administrator must have exactly one PM business role plus `UserAdmin` and still map to an active internal PM; Tester, Developer, inactive/unmapped PM, and PM without `UserAdmin` are denied server-side. A controlled onboarding request stores the requested business role, optional PM-only UserAdmin overlay, inviter, expiry, audit correlation ID, token hash, concurrent-open-request key, and safe delivery state. The invitation email contains `Continue with SAP` and transports a bounded token in a URL fragment for the callback page to exchange by POST; IDTS never collects the SAP password, OTP, passkey, or recovery code. The callback records the SAP identity origin, issuer, subject, and normalized email only after the signed one-time invitation is validated. No active `Users` row or BTP Role Collection assignment is created before the external identity is verified.

**Vietnamese:** Quan tri user la capability overlay rieng. Administrator phai co dung mot business role PM kem `UserAdmin` va van map toi internal PM dang active; Tester, Developer, PM inactive/khong map va PM khong co `UserAdmin` bi chan o backend. Request onboarding co kiem soat luu role yeu cau, UserAdmin overlay chi cho PM, nguoi moi, han dung, correlation ID audit, token hash, key chan request dong thoi va delivery state an toan. Email co nut `Continue with SAP`, mang bounded token trong URL fragment de callback page doi qua POST; IDTS khong bao gio thu password, OTP, passkey hoac recovery code cua SAP. Callback chi ghi origin, issuer, subject va email da normalize sau khi signed one-time invitation hop le. Khong tao active `Users` row hoac gan BTP Role Collection truoc khi external identity duoc xac minh.

**Source-candidate extension:** The PM confirmation that sends a TESTER or DEVELOPER invitation is the single human approval; successful SAP identity verification atomically queues provisioning. PM access and any UserAdmin overlay retain a second version-matched approval. CAP creates a durable access-operation journal and append-only safe audit event; a separate broker is the only component permitted to reconcile allowlisted BTP Role Collections. `ACTIVE` is committed only after broker readback proves the exact desired state. Role change and revoke first disable the local user and revoke active sessions. A retry is allowed only for an explicitly retryable failure; an ambiguous provider outcome requires a separate human-confirmed reconciliation action that reads provider state before applying any missing delta. Invitation email also links to SAP's official account portal and Universal ID registration page; IDTS does not expose an account-existence lookup. The broker and its privileged credential are excluded from the ordinary application MTA and have a separate deployment lifecycle.

**Developer administration extension:** A DEVELOPER invitation or role change includes availability, workload limit, and one or more Component Category responsibilities. SAP Module is optional. Provider role readback and local profile/responsibility materialization complete in one CAP transaction before the request becomes `ACTIVE`. PM+UserAdmin can manage these responsibilities with optimistic versioning and soft deactivation; existing Bug assignees remain unchanged and are reported as impact for a separate reassignment decision.

### **5.8.2. Email Delivery Baseline**

**English:** IDTS stores the in-app notification as the source event and creates a separate database outbox row for email delivery. SAP BTP selects the Brevo API through private provider configuration; local/integration profiles may use provider-portable SMTP through Nodemailer. A post-commit kick processes due mail immediately, while SAP Job Scheduling Service remains the durable recovery path. The worker changes each delivery through `PENDING`, `SENT`, `FAILED`, or `SKIPPED`. Provider failure never rolls back the Bug workflow. Public OData exposes safe operational fields rather than credentials, raw errors, worker locks, or HTML bodies.

**Vietnamese:** IDTS lưu notification trong app làm source event và tạo database outbox row riêng cho email delivery. SAP BTP chọn Brevo API qua private provider config; local/integration có thể dùng SMTP/Nodemailer. Job Scheduling Service gọi protected CAP endpoint để worker xử lý `PENDING`, `SENT`, `FAILED`, `SKIPPED`; lỗi provider không rollback Bug workflow. OData chỉ expose field vận hành an toàn, không expose credential, raw error, worker lock hoặc HTML body.

## **5.9. Mentor-confirmed Sprint 02 rule delta**

**English:**

The mentor confirmed that the current business rules and diagrams are settled enough for the next development phase. The next focus is implementation, especially the happy flow for one bug and the Bug Detail UI refinements needed for mentor demo.

Confirmed updates:

- Developers may view and discuss bugs in the same project/team when they have visibility permission. Bugs should not be private to only the assigned developer.
- Primary processing actions remain controlled: the assignee or an authorized role should perform lifecycle-changing actions such as request information, reject, resolve, or main status processing.
- Developer note is optional by default.
- Note/reason is mandatory only for specific transitions: request more information, reject, resolve, and reopen.
- Bug Detail UI should place assignee near the top, make status editable through dropdown/value help, group important input fields for fast use, and move severity/environment to a supporting or right-side area when possible.
- DonHV shifts from BA/PM primary execution to Backend CAP lead and backend bug fixing. NhanT supports backend verification and QA. DatDT leads Fiori/UI5. SangVN supports Fiori/UI5.

**Vietnamese:**

Mentor đã chốt rằng business rules và diagrams hiện tại đã đủ ổn để chuyển sang giai đoạn development tiếp theo. Trọng tâm tiếp theo là implementation, đặc biệt là happy flow cho một bug và các chỉnh sửa Bug Detail UI cần thiết để demo với mentor.

Cập nhật đã chốt:

- Developer có thể xem và thảo luận bug trong cùng project/team khi có quyền visibility. Bug không nên bị private chỉ cho developer được assign.
- Action xử lý chính vẫn phải được kiểm soát: assignee hoặc role được phép mới nên thực hiện các action đổi lifecycle như request information, reject, resolve hoặc xử lý status chính.
- Developer note mặc định là optional.
- Note/reason chỉ bắt buộc ở các transition cụ thể: request more information, reject, resolve và reopen.
- Bug Detail UI cần đưa assignee lên gần đầu, status phải edit bằng dropdown/value help, field quan trọng phải được nhóm để nhập nhanh, và severity/environment nên chuyển sang vùng phụ hoặc bên phải khi có thể.
- DonHV chuyển từ vai trò thực thi BA/PM chính sang Backend CAP lead và backend bug fixing. NhanT hỗ trợ backend verification và QA. DatDT lead Fiori/UI5. SangVN hỗ trợ Fiori/UI5.
## IDTS-125 authorization baseline / Baseline phân quyền IDTS-125

**English.** Developers have team-visible read/comment access. Non-assignees cannot mutate Bug fields or upload/update attachments. The assigned Developer can use approved lifecycle actions and upload/update attachments, but Bug business fields remain read-only. On an open Bug, PM may delete any attachment; Tester or Developer may delete only their own upload. A committed deletion is recorded once at draft SAVE with sanitized attachment metadata. CAP is the security boundary across active and draft writes.

**Tiếng Việt.** Developer có quyền đọc/comment Bug nhìn thấy trong team. Developer không phải assignee không được mutate field Bug hoặc upload/update attachment. Developer assignee được dùng lifecycle action đã duyệt và upload/update attachment nhưng field nghiệp vụ Bug vẫn read-only. Trên Bug mở, PM được xóa mọi attachment; Tester hoặc Developer chỉ được xóa file do mình upload. Delete đã commit được ghi một lần tại draft SAVE bằng metadata đã sanitize. CAP là security boundary cho cả active và draft write.
