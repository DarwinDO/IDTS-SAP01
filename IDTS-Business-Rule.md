# **Business Rules \- Issue and Defect Tracking System in SAP**

## **1\. Phạm vi nghiệp vụ của hệ thống**

Hệ thống tập trung vào việc **ghi nhận, báo cáo, phân công và theo dõi lỗi/vấn đề** trong quá trình kiểm thử phần mềm.

Hệ thống **không phải** là nơi Developer sửa code trực tiếp. Developer chỉ dùng hệ thống để xem bug, phản hồi, yêu cầu thêm thông tin, ghi chú kỹ thuật và cập nhật trạng thái xử lý.

## **2\. Roles trong hệ thống**

Hệ thống có **3 role chính**:

| Role | Mục đích chính |
| ----- | ----- |
| **Tester** | Phát hiện, ghi nhận, cập nhật, assign/reassign, bổ sung thông tin, retest/close/reopen và theo dõi bug |
| **Developer** | Tiếp nhận bug, review thông tin, phản hồi và cập nhật trạng thái |
| **PM** | Theo dõi tổng quan tiến độ, workload, overdue bugs và báo cáo |

---

# **A. Business Rules về Role và quyền hạn**

## **BR-01 \- Tester có quyền ghi nhận bug**

Tester được phép:

* Detect bug  
* Check existing bug  
* Create bug report  
* Add bug description  
* Set priority, severity, module/category  
* Upload screenshot/evidence  
* Submit bug report  
* Edit submitted bug report  
* Assign bug cho Developer  
* Reassign bug cho Developer khác  
* Add comment/feedback  
* Track bug status

Trong MVP hiện tại, `Reporter` không tách thành role riêng vì Tester là người chính phát hiện và báo cáo bug nội bộ. `Admin` cũng chưa tách thành role riêng vì chưa có workflow admin chuyên biệt; các trách nhiệm quản trị nhẹ như sửa phân loại, duy trì master data hoặc điều phối reassignment sẽ do Tester hoặc PM xử lý theo quyền được cấp.

---

## **BR-02 \- Developer chỉ xử lý bug được assign hoặc bug có quyền xem**

Developer được phép:

* View assigned bugs  
* View bug details  
* Review bug information  
* Request more information  
* Add developer note  
* Update bug status  
* Reject assigned bug nếu bug sai module hoặc thông tin không phù hợp; phải có lý do reject và follow-up owner
* Comment trong bug report

Developer **không phải người tạo bug chính** và **không trực tiếp sửa code trong hệ thống**.

---

## **BR-03 \- PM có quyền giám sát, không trực tiếp xử lý bug**

PM được phép:

* View all bug reports  
* View bug details  
* Search/filter bugs  
* Track bug status  
* View bug history  
* Monitor developer workload  
* View overdue bugs  
* View dashboard/report  
* Receive escalation notification  
* Request reassignment when needed

PM không phải người trực tiếp tạo bug, fix bug hoặc cập nhật technical note thay Developer.

---

# **B. Business Rules về tạo và ghi nhận bug**

## **BR-04 \- Tester phải kiểm tra bug đã tồn tại trước khi tạo bug mới**

Trước khi tạo bug mới, Tester cần kiểm tra trong hệ thống xem bug tương tự đã tồn tại chưa.

| Điều kiện | Hành động |
| ----- | ----- |
| Bug đã tồn tại và vẫn đang mở | Follow existing bug report |
| Bug đã tồn tại nhưng đã đóng | Update hoặc Reopen existing bug |
| Bug chưa tồn tại | Create new bug report |

Mục tiêu là giảm bug trùng lặp và giữ dữ liệu bug sạch hơn.

---

## **BR-05 \- Bug report phải có thông tin bắt buộc trước khi submit**

Một bug report chỉ được phép gửi khi tất cả thông tin bắt buộc đã được điền đầy đủ.

Nếu thiếu bất kỳ field bắt buộc nào, hệ thống phải chặn việc submit và hiển thị thông báo lỗi cho Tester.

Các field nên bắt buộc gồm:

| Field | Bắt buộc? | Lý do |
| ----- | ----- | ----- |
| **Tiêu đề bug** | Có | Để nhận diện ngắn gọn lỗi |
| **Mô tả bug** | Có | Để mô tả lỗi xảy ra như thế nào |
| **Module / Category** | Có | Để phân loại bug và lọc Developer phù hợp |
| **Priority / Severity** | Có | Để xác định mức độ ảnh hưởng của bug |
| **Các bước tái hiện lỗi** | Có | Để Developer biết cách tái hiện bug |
| **Kết quả thực tế** | Có | Để biết hệ thống đang hoạt động sai như thế nào |
| **Kết quả mong đợi** | Có | Để biết kết quả đúng phải là gì |
| **Developer phụ trách** | Có | Tester phải chọn Developer cụ thể hoặc chọn “Chưa có Developer phù hợp”. Nếu chọn Developer cụ thể, bug có status Assigned. Nếu chọn “Chưa có Developer phù hợp”, bug có status Pending Assignment.  |

Các field có thể để không bắt buộc: 

| Field | Bắt buộc? | Ghi chú |
| ----- | ----- | ----- |
| **Screenshot / Evidence** | Không bắt buộc | Nên có, nhưng không phải bug nào cũng cần |
| **Attachment / Log file** | Không bắt buộc | Chỉ cần khi có file/log liên quan |
| **Comment** | Không bắt buộc | Dùng để bổ sung thông tin thêm |
| **Environment** | Có thể bắt buộc hoặc không | Nếu muốn chặt chẽ thì nên bắt buộc |

Với field **Environment**, nếu muốn hệ thống rõ hơn thì nên bắt buộc, ví dụ:

* Trình duyệt  
* Thiết bị  
* Hệ điều hành  
* Môi trường test  
* SAP system/client nếu có

---

## **BR-06 \- Screenshot/evidence là thông tin hỗ trợ, không luôn bắt buộc**

Tester có thể upload:

* Screenshot  
* Log file  
* Video ngắn  
* Error message  
* Other evidence

Tuy nhiên, evidence có thể là optional, trừ khi nhóm quy định một số loại bug bắt buộc phải có bằng chứng.

Ví dụ:

| Loại bug | Evidence |
| ----- | ----- |
| UI bug | Nên có screenshot |
| System error | Nên có error message/log |
| Performance issue | Nên có thông tin thời gian/phản hồi |
| Functional bug | Nên có steps to reproduce |

---

## **BR-07 \- Bug phải được phân loại theo module/category**

Khi tạo bug, Tester cần chọn module/category liên quan.

Ví dụ:

* Login  
* User Management  
* Defect Management  
* Notification  
* Workflow  
* Dashboard  
* SAP Integration

Module/category được dùng để hỗ trợ việc assign Developer phù hợp.

---

# **C. Business Rules về assign và reassign bug**

## **BR-08 \- Tester có quyền assign bug cho Developer**

Sau khi submit bug report, Tester có thể assign bug cho Developer xử lý.

Luồng nghiệp vụ:

Tester creates bug report  
→ Tester selects module/category  
→ System lists Developers by selected module  
→ Tester assigns bug to a Developer

---

## **BR-09 \- Danh sách Developer nên được lọc theo module/category**

Sau khi Tester chọn module/category, hệ thống chỉ nên hiển thị Developer phù hợp với module đó.

Ví dụ:

| Category | Developer được hiển thị |
| ----- | ----- |
| UI/Fiori | Developer thuộc UI/Fiori |
| Backend/CAP | Developer thuộc CAP/backend |
| Database | Developer thuộc HANA/data, PostgreSQL |
| Workflow | Developer thuộc workflow/process |

Rule này giúp giảm việc assign sai Developer.

---

## **BR-10 \- Hệ thống hoặc Tester cần kiểm tra workload/availability trước khi assign**

Trước khi bug được assign chính thức, cần kiểm tra Developer có phù hợp không.

| Điều kiện | Hành động |
| ----- | ----- |
| Developer available và workload phù hợp | Assign bug |
| Developer đang bận hoặc workload cao | Reassign sang Developer khác |
| Không có Developer phù hợp | Giữ trạng thái Pending Assignment hoặc báo PM |

Nếu nhóm chưa làm tự động workload, có thể để việc kiểm tra này ở mức thủ công.

---

## **BR-11 \- Tester có thể reassign bug sang Developer khác**

Tester có thể reassign bug trong các trường hợp:

* Developer đang bận  
* Workload không phù hợp  
* Developer reject bug và cần follow-up/reassign
* Bug bị phân sai module  
* PM yêu cầu reassign  
* Developer không cập nhật trong thời gian dài

Khi reassign, hệ thống nên lưu lại lịch sử:

* Bug từng được assign cho ai  
* Ai thực hiện reassign  
* Lý do reassign  
* Thời gian reassign

---

## **BR-12 \- Developer có thể reject assigned bug nếu bug không phù hợp**

Developer được phép reject bug nếu:

* Bug không thuộc module Developer phụ trách  
* Bug bị phân loại sai category  
* Bug description không liên quan đến phạm vi xử lý  
* Bug cần chuyển sang Developer khác

Sau khi Developer reject, status của bug có thể là `Rejected`, nhưng `Rejected` không được xem là trạng thái kết thúc. Hệ thống bắt buộc phải:

* Lưu rejection reason
* Ghi history log
* Set `nextProcessor` là Tester hoặc PM
* Xác định action follow-up tiếp theo

Sau khi Developer reject, Tester hoặc PM phải follow up để:

* Update module/category  
* Bổ sung thông tin  
* Reassign cho Developer khác
* Hoặc đưa bug về `Pending Assignment` nếu chưa có Developer phù hợp

**English clarification:** `Rejected` is a follow-up status, not a final status. Every rejected bug must have a reason, a next processor, and a clear next action such as reclassification, additional information, reassignment, or Pending Assignment.

**Giải thích tiếng Việt:** `Rejected` là trạng thái cần xử lý tiếp, không phải trạng thái kết thúc. Mỗi bug bị reject phải có lý do, người xử lý tiếp, và hành động tiếp theo rõ ràng như sửa phân loại, bổ sung thông tin, reassign hoặc chuyển về Pending Assignment.

---

# **D. Business Rules về chỉnh sửa bug report**

## **BR-13 \- Tester có thể chỉnh sửa bug report sau khi submit**

Tester có thể edit hoặc bổ sung thông tin sau khi bug đã được submit nếu bug chưa đóng.

Tester có thể chỉnh:

* Description  
* Steps to reproduce  
* Expected result  
* Actual result  
* Module/category  
* Priority/severity  
* Evidence/screenshot  
* Comment/feedback

---

## **BR-14 \- Nếu bug đã assign, chỉnh sửa bug phải notify Developer**

Nếu bug đã được assign cho Developer, sau khi Tester chỉnh sửa hoặc bổ sung thông tin, hệ thống cần thông báo cho Developer.

Ví dụ notification:

Bug report has been updated with additional information.

Điều này giúp Developer không xử lý dựa trên thông tin cũ.

---

## **BR-15 \- Phải assign Developer trước khi gửi Bug**

Bug report **không được gửi** nếu chưa chọn Developer phụ trách.

Tester phải chọn module/category trước. Sau đó, hệ thống sẽ hiển thị danh sách Developer phù hợp với module/category đó. Tester bắt buộc phải chọn một Developer trước khi nhấn nút **Submit Bug**.

Nếu không có Developer phù hợp, hoặc tất cả Developer phù hợp đang có workload quá cao, hệ thống cho phép Tester chọn tùy chọn **“Chưa có Developer phù hợp”** ở cuối danh sách Developer.

Khi Tester chọn **“Chưa có Developer phù hợp”** và submit bug, bug sẽ được ghi nhận với trạng thái **Pending Assignment**. Bug ở trạng thái này chưa được chuyển sang Developer review và cần được PM hoặc Tester theo dõi để assign Developer phù hợp sau đó.

| Trường hợp | Hành động | Trạng thái sau khi submit |
| ----- | ----- | ----- |
| Tester chọn Developer cụ thể | Submit bug và assign cho Developer đó | Assigned |
| Tester chọn “Chưa có Developer phù hợp” | Submit bug để ghi nhận, chưa assign Developer | Pending Assignment |

---

# **E. Business Rules về Developer review bug**

## **BR-16 \- Developer phải review thông tin bug sau khi nhận bug**

Sau khi nhận bug, Developer cần xem:

* Title  
* Description  
* Steps to reproduce  
* Expected result  
* Actual result  
* Module/category  
* Priority/severity  
* Evidence  
* Comments/history

---

## **BR-17 \- Developer có thể yêu cầu thêm thông tin nếu bug chưa rõ**

Nếu thông tin bug chưa đủ rõ, Developer có thể chuyển bug sang trạng thái cần bổ sung thông tin.

Các trường hợp phổ biến:

* Thiếu steps to reproduce  
* Không có actual result  
* Expected result không rõ  
* Screenshot không đủ thông tin  
* Module/category có thể sai  
* Không mô tả được điều kiện xảy ra lỗi

Luồng:

Developer requests more information  
→ Tester adds more information  
→ Developer reviews bug again

---

## **BR-18 \- Developer có thể thêm developer note**

Developer có thể thêm ghi chú kỹ thuật vào bug report.

Ví dụ:

* Initial analysis  
* Possible cause  
* Related module  
* Suggested next action  
* Reason for status update  
* Reason for rejection

Developer note giúp tăng tính traceability của bug.

---

## **BR-19 \- Developer có thể cập nhật trạng thái bug**

Developer được phép cập nhật trạng thái bug theo phạm vi xử lý.

Ví dụ:

* Assigned  
* In Review  
* Need More Information  
* In Progress  
* Resolved  
* Rejected

Developer không nên tự ý đóng bug nếu nhóm muốn Tester hoặc PM xác nhận cuối cùng.

---

# **F. Business Rules về PM**

## **BR-20 \- PM có quyền xem toàn bộ bug report**

PM có thể xem tất cả bug trong hệ thống để theo dõi tổng quan tiến độ.

PM có thể filter theo:

* Status  
* Priority/severity  
* Module/category  
* Developer  
* Created date  
* Updated date  
* Overdue status

---

## **BR-21 \- PM theo dõi workload của Developer**

PM có thể xem số lượng bug đang được assign cho từng Developer.

Ví dụ:

| Developer | Assigned Bugs | In Progress | Need More Information | Overdue |
| ----- | ----- | ----- | ----- | ----- |
| Dev A | 5 | 2 | 1 | 1 |
| Dev B | 8 | 4 | 2 | 3 |

PM dùng thông tin này để đánh giá việc phân công có hợp lý không.

---

## **BR-22 \- PM có thể yêu cầu reassign bug**

PM không nhất thiết trực tiếp reassign, nhưng có thể yêu cầu Tester reassign trong các trường hợp:

* Developer quá tải  
* Bug overdue  
* Bug lâu không cập nhật  
* Bug bị assign sai module  
* Bug có priority cao cần người khác xử lý nhanh hơn

Nếu nhóm muốn PM có quyền mạnh hơn, PM có thể được phép trực tiếp reassign bug, nhưng cần ghi rõ trong authorization rule.

---

## **BR-23 \- PM nhận escalation notification**

PM nên nhận thông báo khi có tình huống cần chú ý.

Ví dụ:

* Bug priority high/critical chưa được assign  
* Bug overdue  
* Bug bị reassign nhiều lần  
* Developer reject bug và hệ thống đã xác định follow-up owner
* Bug bị giữ ở Need More Information quá lâu  
* Bug không được cập nhật trong thời gian quy định

---

# **G. Business Rules về status flow**

## **BR-24 \- Bug cần có trạng thái rõ ràng**

Bộ status đề xuất:

| Status | Ý nghĩa |
| ----- | ----- |
| **New** | Bug mới được tạo |
| **Assigned** | Bug đã được assign cho Developer |
| **Need More Information** | Developer yêu cầu Tester bổ sung thông tin |
| **In Review** | Developer đang review thông tin bug |
| **In Progress** | Developer đang xử lý/đang theo dõi xử lý |
| **Resolved** | Developer đánh dấu đã xử lý xong hoặc đã có phản hồi xử lý |
| **Reopened** | Bug được mở lại sau khi phát hiện vẫn còn vấn đề |
| **Rejected** | Developer từ chối vì sai module/category hoặc assignee không phù hợp; đây là status cần follow-up, không phải final status |
| **Closed** | Bug được đóng |
| **Pending Assignment** | Bug đã submit nhưng chưa assign Developer |

---

## **BR-25 \- Status transition phải có kiểm soát**

Một số transition hợp lý:

| From | To | Người thực hiện |
| ----- | ----- | ----- |
| New | Pending Assignment | Tester |
| Pending Assignment | Assigned | Tester |
| Assigned | In Review | Developer |
| In Review | Need More Information | Developer |
| Need More Information | Assigned/In Review | Tester sau khi bổ sung |
| In Review | In Progress | Developer |
| In Progress | Resolved | Developer |
| Resolved | Closed | Tester hoặc PM tùy rule |
| Resolved | Reopened | Tester |
| Reopened | Assigned | Tester |
| Assigned | Rejected | Developer |
| Rejected | Assigned | Tester hoặc PM sau khi sửa thông tin hoặc chọn Developer phù hợp |
| Rejected | Pending Assignment | Tester hoặc PM nếu chưa có Developer phù hợp |
| Assigned | Assigned | Tester reassign |

**English clarification:** `Rejected` must not be used as a silent terminal state. A transition to `Rejected` requires a rejection reason, history log, `nextProcessor`, and an allowed follow-up transition.

**Giải thích tiếng Việt:** `Rejected` không được dùng như trạng thái kết thúc im lặng. Mọi transition sang `Rejected` phải có lý do reject, history log, `nextProcessor` và transition follow-up hợp lệ.

---

## **BR-26 \- Closed bug không nên được chỉnh sửa tự do**

Khi bug đã Closed:

* Không nên cho sửa trực tiếp nội dung chính  
* Nếu phát hiện lỗi vẫn còn, nên tạo hành động Reopen  
* Mọi thay đổi sau khi Closed phải được ghi lại trong history

---

# **H. Business Rules về comment và feedback**

## **BR-27 \- Tester, Developer và PM có thể trao đổi qua comment** 

* Tester, Developer và PM có thể tham gia trao đổi trong phần comment của từng bug report.  
* Comment dùng để hỗ trợ việc làm rõ thông tin, theo dõi tiến độ và ghi nhận trao đổi liên quan đến bug.  
* Các quyền comment theo từng role:

| Role | Quyền comment |
| ----- | ----- |
| **Tester** | Bổ sung thông tin, trả lời yêu cầu từ Developer, thêm feedback, cập nhật bằng chứng hoặc mô tả thêm về bug |
| **Developer** | Hỏi thêm thông tin, ghi chú phân tích kỹ thuật, giải thích lý do cập nhật trạng thái, phản hồi về bug được assign |
| **PM** | Theo dõi trao đổi, nhắc nhở tiến độ, hỏi thêm tình trạng xử lý, yêu cầu cập nhật thông tin hoặc đề xuất reassign nếu cần |

PM được phép comment vào bug nếu bug đó thuộc phạm vi dự án/team mà PM phụ trách. PM không thay thế Developer trong việc ghi developer note, và không thay thế Tester trong việc xác nhận thông tin bug. 

---

## **BR-28 \- Comment phải gắn với bug cụ thể**

Mỗi comment cần lưu:

* Comment content  
* Người tạo comment  
* Role của người tạo  
* Thời gian tạo  
* Bug liên quan

Comment không được dùng để thay đổi trạng thái bug trực tiếp. Nếu nội dung comment dẫn đến thay đổi trạng thái, hệ thống cần ghi nhận thay đổi đó bằng status update và history log riêng. 

---

# **I. Business Rules về notification**

## **BR-29 \- Notification được gửi khi có sự kiện quan trọng**

Các trigger notification nên có:

| Sự kiện | Người nhận |
| ----- | ----- |
| Bug assigned | Developer |
| Bug reassigned | Developer mới, có thể PM |
| Developer requests more information | Tester |
| Tester updates submitted bug | Developer |
| Developer updates status | Tester, PM nếu cần |
| Bug overdue | PM |
| Developer rejects bug | Tester hoặc PM để follow-up |
| Bug closed | Tester, Developer, PM nếu cần |

---

## **BR-30 \- Notification có thể dùng SAP BTP service hoặc bên thứ ba**

Notification module không nên khóa cứng vào một công nghệ duy nhất.

Có thể dùng:

* SAP Build Process Automation Notification  
* SAP Alert Notification Service  
* Email  
* Microsoft Teams  
* Slack  
* Telegram  
* Third-party webhook

---

# **J. Business Rules về audit/history**

## **BR-31 \- Hệ thống phải lưu lịch sử thay đổi của bug**

Mỗi thay đổi quan trọng nên được ghi vào history.

Ví dụ:

* Create bug  
* Edit bug information  
* Assign bug  
* Reassign bug  
* Change status  
* Add comment  
* Upload evidence  
* Request more information  
* Reject bug  
* Close bug  
* Reopen bug

---

## **BR-32 \- Bug history phải thể hiện ai làm gì và khi nào**

Mỗi history log nên có:

* Bug ID  
* Action type  
* Old value  
* New value  
* Người thực hiện  
* Role  
* Timestamp  
* Note/reason nếu có

Ví dụ:

Bug \#102 changed status from Assigned to Need More Information  
by Developer A at 10:30 AM  
Reason: Missing steps to reproduce

---

# **K. Business Rules về dữ liệu**

## **BR-33 \- Bug ID phải là duy nhất**

Mỗi bug report cần có một mã định danh duy nhất.

Ví dụ:

BUG-0001  
BUG-0002  
BUG-0003

Bug ID được dùng để search, track history, comment và assignment.

---

## **BR-34 \- Một bug chỉ nên có một Developer chính tại một thời điểm**

Tại một thời điểm, bug nên có một assignee chính để tránh mơ hồ trách nhiệm.

Nếu cần nhiều người xem hoặc hỗ trợ, có thể thêm watchers/collaborators sau.

---

## **BR-35 \- Một Developer có thể được assign nhiều bug**

Developer có thể có nhiều bug cùng lúc, nhưng hệ thống hoặc PM cần theo dõi workload để tránh quá tải.

---

## **BR-36 \- Bug có thể có nhiều comment, attachment và history logs**

Quan hệ dữ liệu nên là:

Bug 1 \- N Comments  
Bug 1 \- N Attachments  
Bug 1 \- N History Logs  
Bug N \- 1 Developer  
Bug N \- 1 Module  
Bug N \- 1 Status

---

# **L. Business Rules về search/filter**

## **BR-37 \- Người dùng có thể search/filter bug theo thông tin chính**

Tester, Developer và PM có thể search/filter theo:

* Bug ID  
* Title  
* Status  
* Priority/severity  
* Module/category  
* Assignee  
* Created by / Tester
* Created date  
* Updated date

PM có thêm nhu cầu filter theo:

* Overdue bugs  
* Developer workload  
* Bugs by module  
* Bugs by status

---

# **M. Business Rules về overdue/escalation**

## **BR-38 \- Bug có thể bị đánh dấu overdue**

Một bug có thể được xem là overdue nếu:

* Quá thời gian xử lý dự kiến  
* Không được cập nhật trong một khoảng thời gian nhất định  
* Priority cao nhưng chưa được assign  
* Developer chưa phản hồi sau khi được assign

Thời gian overdue có thể tùy nhóm quy định.

Ví dụ:

| Priority | Suggested SLA |
| ----- | ----- |
| High | 1–2 ngày |
| Medium | 3–5 ngày |
| Low | 5–7 ngày |

---

## **BR-39 \- Overdue bug nên notify PM**

Khi bug bị overdue, hệ thống gửi notification cho PM để PM theo dõi hoặc yêu cầu reassign.

---

# **N. Business Rules về scope giới hạn**

## **BR-40 \- Hệ thống không xử lý việc sửa code trực tiếp**

Developer có thể update status và note trong hệ thống, nhưng việc sửa code xảy ra ngoài hệ thống.

Do đó, use case **Fix Bug** không nên đặt là chức năng chính của hệ thống.

Nên dùng:

* Review Bug Information  
* Update Bug Status  
* Add Developer Note  
* Request More Information

thay vì:

* Fix Bug  
* Deploy Fix  
* Code Review

---

## **BR-41 \- Hệ thống không thay thế Jira hoặc SAP Solution Manager hoàn chỉnh**

Hệ thống chỉ tập trung vào quy trình defect reporting/tracking trong phạm vi đồ án.

Không bao gồm:

* Full project management  
* Sprint planning  
* CI/CD  
* Source code integration  
* Complex approval workflow  
* Full enterprise incident management

---

# **O. Business Rules cập nhật theo BA baseline hiện hành**

Các rule dưới đây làm rõ baseline hiện hành để đồng bộ với `docs/project-context.md` và các diagram BA. Nếu nội dung cũ dùng cách gọi `module/category` chung, khi code nên áp dụng cách gọi chi tiết trong các rule này.

## **BR-42 - Bug classification phải tách SAP Module, Application Component và Defect Category**

Khi tạo hoặc cập nhật bug, hệ thống không nên gộp mọi thứ vào một field `module/category` mơ hồ.

Mô hình phân loại hiện hành:

| Khái niệm | Bắt buộc? | Ý nghĩa |
| ----- | ----- | ----- |
| **SAP Module** | Optional theo ngữ cảnh | Bối cảnh nghiệp vụ SAP như FI, MM, SD, CO, PP, HCM |
| **Application Component** | Bắt buộc | App, màn hình, service hoặc khu vực chức năng nơi bug xuất hiện |
| **Defect Category** | Bắt buộc | Loại lỗi hoặc tầng kỹ thuật như Fiori/UI5, SAP CAP Backend, Database, Authorization |
| **Component Category** | Do hệ thống suy ra | Cặp hợp lệ giữa Application Component và Defect Category |
| **Developer Responsibility** | Dữ liệu cấu hình | Mapping Developer với Component Category, có thể giới hạn theo SAP Module |

Luồng lọc trên Fiori:

Tester chọn `SAP Module` nếu liên quan -> hệ thống lọc `Application Component` -> hệ thống lọc `Defect Category` hợp lệ -> hệ thống lọc Developer theo `Developer Responsibility`.

Với bug thuần IDTS, `SAP Module` có thể để trống hoặc chọn `Not Applicable`.

## **BR-43 - Bộ status chính phải bao gồm Retest Required**

Bộ status chính của IDTS:

| Status | Ý nghĩa |
| ----- | ----- |
| **New** | Bug mới được ghi nhận hoặc đang ở bước submit ban đầu |
| **Pending Assignment** | Bug đã submit nhưng chưa có Developer phù hợp |
| **Assigned** | Bug đã được assign cho một Developer chính |
| **In Review** | Developer đang review thông tin bug |
| **Need More Information** | Developer yêu cầu Tester bổ sung thông tin |
| **In Progress** | Developer đang xử lý hoặc theo dõi xử lý ngoài IDTS |
| **Resolved** | Developer đã cung cấp kết quả xử lý/phản hồi |
| **Retest Required** | Tester/PM cần kiểm tra lại trước khi đóng |
| **Rejected** | Developer từ chối vì sai phân loại hoặc assign không phù hợp; đây là trạng thái cần follow-up, không phải trạng thái kết thúc |
| **Reopened** | Bug được mở lại vì vấn đề vẫn còn |
| **Closed** | Bug đã được xác nhận hoàn tất |

`Reassigned` không phải status chính. Reassign là action và phải được ghi nhận trong history log.

**English clarification:** `Rejected` remains in the main status list, but it must always lead to a follow-up step. It must not be used as a silent terminal state.

**Giải thích tiếng Việt:** `Rejected` vẫn nằm trong bộ status chính, nhưng luôn phải dẫn tới một bước xử lý tiếp theo. Không được dùng `Rejected` như trạng thái kết thúc im lặng.

## **BR-44 - Resolve phải đi qua bước xác nhận hoặc retest trước khi Closed**

Developer có thể chuyển bug sang `Resolved` khi đã có kết quả xử lý hoặc phản hồi xử lý.

Sau `Resolved`:

| Tình huống | Hành động |
| ----- | ----- |
| Cần kiểm tra lại | Chuyển sang `Retest Required` |
| Retest pass | Chuyển sang `Closed` |
| Retest fail | Chuyển sang `Reopened` |
| Không cần retest và Tester/PM chấp nhận | Chuyển thẳng `Closed` nếu rule cho phép |

Developer không nên tự đóng bug nếu quy trình yêu cầu Tester/PM xác nhận cuối cùng.

## **BR-45 - nextProcessor phải được hệ thống cập nhật theo hành động tiếp theo**

`nextProcessor` là người cần thực hiện bước tiếp theo trên bug. Đây không phải role mới và không thay thế `assignee`.

| Status / Action | nextProcessor hợp lý |
| ----- | ----- |
| Bug được assign | Developer được assign |
| Không có Developer phù hợp | PM queue hoặc Tester |
| Developer request more information | Tester |
| Tester bổ sung thông tin xong | Developer được assign |
| Developer reject bug | Tester hoặc PM để sửa phân loại, bổ sung thông tin, reassign, hoặc đưa về Pending Assignment |
| Developer mark Resolved | Tester/PM |
| Bug vào Retest Required | Tester/PM |
| Bug Closed | Không cần nextProcessor |

Backend CAP handler nên tự động cập nhật `nextProcessor` khi status, assignee hoặc assignment decision thay đổi. Mọi thay đổi quan trọng phải ghi history log.

## **BR-46 - Bug nên có lightweight test context và planning fields**

Để tăng traceability nhưng không xây full test management module, bug nên có các field optional:

| Field | Ý nghĩa |
| ----- | ----- |
| **environment** | Môi trường phát hiện lỗi như DEV, QAS, UAT, browser, device, SAP client nếu có |
| **testCaseRef** | Mã hoặc link tham chiếu test case |
| **testRunRef** | Mã hoặc link tham chiếu test run |

Để hỗ trợ PM monitoring, bug nên có thêm:

| Field | Ý nghĩa |
| ----- | ----- |
| **plannedCompletionDate** | Ngày dự kiến hoàn thành |
| **dueDate** | Ngày đến hạn để tính overdue |
| **estimatedEffortHours** | Ước lượng effort nếu nhóm cần |
| **nextProcessor** | Người hoặc queue đang cần xử lý bước tiếp theo |

Các field này không được dùng để mở rộng IDTS thành Jira, SAP Cloud ALM, SAP Solution Manager hoặc hệ thống test management đầy đủ.
