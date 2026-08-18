# **Business Rules \- Issue and Defect Tracking System in SAP**

## One-to-one workflow audit rule

Every public Bug workflow OData action that changes workflow state or ownership and writes History must persist its own dedicated `HistoryEvents.actionType_code`. Different named commands must not share a generic code such as `STATUS_CHANGE` or `REASSIGN`. The same exact code is copied to child `HistoryLogs`; the readable timeline label comes from `ActionTypes`. Legacy codes remain valid for existing history and generic non-command edits, and existing History rows are not rewritten.

Vietnamese: Mỗi OData workflow action công khai của Bug có thay đổi workflow/ownership và ghi History phải lưu một `HistoryEvents.actionType_code` riêng. Không được gom nhiều command có tên khác nhau vào mã chung như `STATUS_CHANGE` hoặc `REASSIGN`. `HistoryLogs` con dùng cùng mã chính xác, còn timeline lấy nhãn dễ đọc từ `ActionTypes`. Mã legacy vẫn được giữ để đọc lịch sử cũ và audit edit chung; không rewrite History cũ.

## **1\. Phạm vi nghiệp vụ của hệ thống**

Hệ thống tập trung vào việc **ghi nhận, báo cáo, phân công và theo dõi lỗi/vấn đề** trong quá trình kiểm thử phần mềm.

Hệ thống **không phải** là nơi Developer sửa code trực tiếp. Developer chỉ dùng hệ thống để xem bug, phản hồi, yêu cầu thêm thông tin, ghi chú kỹ thuật và cập nhật trạng thái xử lý.

## **2\. Roles trong hệ thống**

Hệ thống có **3 role chính**:

| Role | Mục đích chính |
| ----- | ----- |
| **Tester** | Phát hiện, ghi nhận, cập nhật, assign/reassign, bổ sung thông tin, retest/close/reopen và theo dõi bug |
| **Developer** | Xem bug được assign hoặc bug team-visible, review thông tin, thảo luận/comment, phản hồi và cập nhật trạng thái trong phạm vi được phép |
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

## **BR-02 \- Developer có thể xem/thảo luận bug trong team nhưng chỉ xử lý workflow khi được phép**

Developer không bị giới hạn chỉ được nhìn thấy bug đang assign cho mình. Trong MVP, Developer có thể xem bug detail và tham gia thảo luận/comment nếu bug thuộc cùng project/team hoặc nếu Developer có project-level visibility.

Tuy nhiên, quyền **xử lý workflow chính** vẫn phải được kiểm soát. Developer chỉ được thực hiện các action xử lý chính khi:

* Developer là assignee hiện tại của bug; hoặc
* Developer có quyền xử lý được cấp rõ ràng bởi rule authorization sau này.

Developer được phép:

* View assigned bugs  
* View team-visible bugs trong cùng project/team
* View bug details  
* Review bug information  
* Request more information khi bug thiếu thông tin
* Add developer note khi cần ghi nhận phân tích kỹ thuật
* Update processing status trong phạm vi được phép
* Reject bug nếu bug sai module/category, sai assignment hoặc không phù hợp; phải có lý do reject và follow-up owner/action
* Comment trong bug report để thảo luận và làm rõ thông tin

Developer **không phải người tạo bug chính** và **không trực tiếp sửa code trong hệ thống**.

**English clarification:** Developers may view and discuss bugs within the same project/team when they have visibility permission, but primary lifecycle-changing actions remain limited to the assigned Developer or an explicitly authorized role.

## **BR-02A - Authentication source and session rule**

SAP BTP uses AppRouter/XSUAA platform authentication and maps the authenticated SAP identity to the active IDTS user/role. Local and Render/integration profiles use the custom CAP Node.js login.

Rules:

* `Users` is the internal source for profile, email, active flag and MVP business role.
* A linked SAP identity is authoritative by the unique hash of provider origin, issuer, and stable subject. Email/display name are mutable attributes and never authorize a complete external identity. Legacy rows keep nullable identity fields for a controlled link/backfill; local/custom-auth profiles may still resolve by internal ID/email when no complete external tuple is present.
* Passwords must be stored only as hashes in `Users.passwordHash`; plaintext passwords must not be committed or logged.
* Successful login creates a server-side `AuthSessions` record and returns a bearer token.
* The database stores only the token hash, not the raw bearer token.
* Authenticated OData requests must map back to `cds.User` with `authenticated-user` plus the IDTS role (`TESTER`, `DEVELOPER`, or `PM`).
* Inactive users must not be allowed to log in even if a password hash exists.

Vietnamese:

Tren SAP BTP, IDTS dung AppRouter/XSUAA va map SAP identity toi user/role IDTS dang active. Local va Render/integration dung custom login trong CAP Node.js.

Rule:

* `Users` la nguon noi bo cho profile, email, active flag va MVP business role.
* SAP identity da link dung unique hash cua provider origin, issuer va stable subject lam authority. Email/display name co the thay doi va khong duoc dung de authorize external identity day du. Row legacy de nullable cho link/backfill co kiem soat; local/custom-auth chi fallback ID/email khi request khong co du external tuple.
* Password chi duoc luu dang hash trong `Users.passwordHash`; khong commit hoac log plaintext password.
* Login thanh cong tao `AuthSessions` phia server va tra bearer token.
* Database chi luu token hash, khong luu raw bearer token.
* Request OData da login phai map lai thanh `cds.User` voi `authenticated-user` cong role IDTS (`TESTER`, `DEVELOPER`, hoac `PM`).
* User inactive khong duoc login du co password hash.

## **BR-02B - Controlled user onboarding and UserAdmin overlay**

* The only business roles remain `PM`, `TESTER`, and `DEVELOPER`; every active user has exactly one business role.
* `UserAdmin` is an XSUAA capability overlay, not a fourth business role, and may be assigned only to selected PM users.
* The backend requires both PM and UserAdmin plus a matching active internal PM for every user-administration read or action. PM without UserAdmin, inactive/unmapped PM, Tester, Developer, and direct API callers without the complete contract receive 403.
* An invitation specifies exactly one allowlisted business role. UserAdmin may be requested only together with PM.
* Invitation links are signed, one-time, expiring, and length-bounded. Email transports the token in a URL fragment for a callback page to exchange by POST, keeping it out of HTTP requests and referrers. IDTS stores the token hash and nonce but never stores or logs the signing key, SAP password, OTP, passkey, recovery code, cookie, bearer token, or raw provider error.
* The signed-in SAP identity email must match the normalized invitation email. IDTS records origin, issuer, and subject for later immutable mapping; email remains a mutable attribute.
* No active `Users` row, BTP Role Collection assignment, or provisioning success is created before identity verification completes.
* The PM confirmation that sends an invitation is sufficient approval for TESTER and DEVELOPER. After successful identity verification, these standard roles enter the provisioning queue automatically. PM access and any UserAdmin overlay require a second version-matched human approval. `ACTIVE` is set only after the separate broker reads back the exact desired Role Collection state.
* Role change and revoke fail closed: IDTS disables the local user and revokes active `AuthSessions` before external reconciliation. UserAdmin remains valid only with PM, multiple business roles are rejected, and the last active UserAdmin cannot be removed.
* A retry is available only for a provider result classified as retryable. An ambiguous provider result moves to `BLOCKED_MANUAL_REVIEW` and may continue only after a PM+UserAdmin explicitly requests reconciliation; the broker must read current provider state before applying a bounded allowlisted delta.
* CAP stores the operation journal and append-only safe audit events, but never the SAP administration credential or raw provider response. A separate least-privilege broker owns the external authorization API call and accepts only server-side allowlisted roles.
* Repeated invitation use, concurrent duplicate open invitations, external-identity collisions, multiple business roles, and non-PM UserAdmin requests must fail closed and be auditable.

Vietnamese:

* Business role van chi gom `PM`, `TESTER`, `DEVELOPER`; moi active user co dung mot business role.
* `UserAdmin` la capability overlay cua XSUAA, khong phai business role thu tu, va chi gan cho mot so PM duoc chon.
* Backend bat buoc dong thoi co PM va UserAdmin cho moi API quan tri user.
* Link moi co chu ky, chi dung mot lan va co han; IDTS chi luu hash/nonce, khong luu secret hoac credential SAP.
* Chi sau khi SAP identity duoc xac minh moi chuyen sang provisioning; email khong phai immutable authority duy nhat.
* TESTER/DEVELOPER dung confirmation luc PM gui invitation lam approval; sau identity verification se tu queue provisioning. PM hoac UserAdmin van can approval thu hai. `ACTIVE` chi duoc set sau broker readback dung exact Role Collection; role change/revoke khoa local access va revoke session truoc de fail closed.

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

PM không phải người trực tiếp tạo bug, fix bug hoặc cập nhật technical note thay Developer. Bug report mới chỉ được tạo bởi Tester; quyền PM không được dùng để bỏ qua rule này.

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

Capacity được tính theo tất cả Bug còn assignee và có status khác `Closed`; `Rejected`, `Resolved`, `Retest Required` và các status chưa đóng khác vẫn được tính.

| Số Bug chưa `Closed` | Effective availability | Có thể nhận thêm Bug? |
| ----- | ----- | ----- |
| 0-1 | Available | Có |
| 2 | Busy | Có, được nhận Bug thứ ba |
| 3 trở lên | Unavailable | Không |

Khi Developer đã có 3 Bug chưa `Closed`, backend phải từ chối assignment mới. Tester hoặc PM chọn Developer khác; nếu không còn Developer phù hợp, Bug giữ/chuyển sang `Pending Assignment`. PM không được override hard cap. Availability thủ công `Unavailable` (ví dụ nghỉ phép) luôn có hiệu lực dù workload thấp. Khi Bug được close, bỏ assignee hoặc reassign, effective availability được tính lại; hệ thống không ghi đè availability thủ công.

**English clarification:** Capacity counts every assigned Bug whose status is not `Closed`, including `Rejected`. Zero or one is Available, two is Busy but can receive the third Bug, and three or more is Unavailable and blocks another assignment. There is no PM override; use another suitable Developer or `Pending Assignment`.

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

**English clarification:** `Rejected` is a follow-up status, not a final status. Every rejected bug must have a reason, a next processor, and a clear next action such as reclassification, optional supporting-information update, reassignment, or Pending Assignment. In the current MVP, `Rejected` does not return through `Need More Information`.

**Giải thích tiếng Việt:** `Rejected` là trạng thái cần xử lý tiếp, không phải trạng thái kết thúc. Mỗi bug bị reject phải có lý do, người xử lý tiếp, và hành động tiếp theo rõ ràng như sửa phân loại/ngữ cảnh, có thể bổ sung supporting information, reassign hoặc chuyển về Pending Assignment. Ở MVP hiện tại, `Rejected` không quay lại qua nhánh `Need More Information`.

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

**English clarification:** IDTS must not automatically pick a Developer during create. Only a Tester can create a new Bug. If the Tester does not explicitly select an assignee, the bug starts as `Pending Assignment`.

**Giải thích tiếng Việt:** IDTS không được tự chọn Developer khi tạo bug. Chỉ Tester được tạo Bug mới. Nếu Tester không chủ động chọn assignee, bug sẽ bắt đầu ở `Pending Assignment`.

---

## **BR-15A - Retest owner phải được lưu bền vững**

Mỗi Bug phải có `retestOwner` để xác định Tester chịu trách nhiệm xác nhận kết quả. Khi Tester tạo Bug, hệ thống khởi tạo `retestOwner` bằng chính Tester đó. Khi một Tester khác thực hiện retest/reopen hoặc PM điều phối thay đổi người retest, hệ thống cập nhật `retestOwner` theo action được phép và ghi history. `retestOwner` không thay thế Developer `assignee` và không thay thế `nextProcessor`; ba khái niệm này có trách nhiệm khác nhau.

PM được phép dùng action riêng `Reassign Retest Owner` khi Tester hiện tại không còn khả dụng. Việc đổi retest owner không tự đổi status, Developer assignee hoặc lifecycle.

---

## **BR-15B - Closed Bug là read-only aggregate**

Khi Bug ở trạng thái `Closed`, toàn bộ aggregate nghiệp vụ được khóa đối với mutation thông thường. Người dùng không được edit Bug, assign/reassign Developer, thêm comment, upload/update/delete attachment, chạy hoặc review/apply AI suggestion, hay gọi lifecycle action khác. Dữ liệu comment, attachment, history và AI audit cũ vẫn được đọc; attachment cũ vẫn có thể download.

Bug record không hỗ trợ hard delete ở bất kỳ trạng thái nào vì phải bảo toàn trace và audit; người dùng phải dùng lifecycle action phù hợp để kết thúc hoặc mở lại xử lý.

Hai ngoại lệ có kiểm soát là `Reopen Bug` và PM `Reassign Retest Owner`. Sau khi reopen thành công, các mutation bình thường mới được phép trở lại theo role và status hiện hành. Email outbox đã commit trước đó vẫn có thể hoàn thành vì đây là xử lý hạ tầng, không phải mutation mới của Closed Bug.

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

Developer có thể thêm ghi chú kỹ thuật vào bug report để tăng traceability và giúp Tester/PM hiểu quá trình xử lý.

Developer note **mặc định là optional**. Không bắt buộc Developer phải ghi note cho mọi lần đổi status.

Developer note hoặc reason chỉ bắt buộc khi transition cần lý do rõ ràng, quyết định nghiệp vụ, hoặc kết quả xử lý kỹ thuật:

| Transition / action | Note hoặc reason bắt buộc |
| ----- | ----- |
| `Assigned` / `In Review` / `In Progress` -> `Need More Information` | Bắt buộc reason mô tả đang thiếu thông tin gì. |
| `Need More Information` -> `Assigned` | Bắt buộc update summary khi Tester hoặc PM dùng `Resubmit to Developer`. |
| `Assigned` / `In Review` / `In Progress` -> `Rejected` | Bắt buộc rejection reason và follow-up owner/action. |
| `In Progress` -> `Resolved` | Bắt buộc resolution note hoặc kết quả xử lý. |
| `Resolved` -> `Reopened` | Bắt buộc reopen reason, thường do Tester hoặc PM ghi nhận. |
| Transition bình thường như `Assigned` -> `In Review` hoặc `In Review` -> `In Progress` | Developer note optional. |

Ví dụ:

* Initial analysis  
* Possible cause  
* Related module  
* Suggested next action  
* Reason for status update  
* Reason for rejection

**English clarification:** Developer notes are optional by default. Required note/reason cases must be handled by the status action rule, not by making every developer status update require a note.

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
| **New** | Trạng thái tương thích dữ liệu cũ/import; không phải trạng thái khởi tạo chuẩn của create happy flow hiện tại |
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
| Assigned | Need More Information | Developer |
| Assigned | Rejected | Developer |
| In Review | Need More Information | Developer |
| Need More Information | Assigned | Tester hoặc PM dùng `Resubmit to Developer` sau khi bổ sung |
| In Review | In Progress | Developer |
| In Review | Rejected | Developer |
| In Progress | Need More Information | Developer |
| In Progress | Resolved | Developer |
| In Progress | Rejected | Developer |
| Resolved | Closed | Tester hoặc PM tùy rule |
| Resolved | Retest Required | Tester hoặc PM |
| Resolved | Reopened | Tester |
| Retest Required | Closed | Tester hoặc PM |
| Retest Required | Reopened | Tester hoặc PM |
| Reopened | Assigned | Tester |
| Rejected | Assigned | Tester hoặc PM sau khi sửa thông tin hoặc chọn Developer phù hợp |
| Rejected | Pending Assignment | Tester hoặc PM nếu chưa có Developer phù hợp |
| Assigned | Assigned | Tester reassign |

**English clarification:** `Rejected` must not be used as a silent terminal state. A transition to `Rejected` requires a rejection reason, history log, `nextProcessor`, and an allowed follow-up transition. In the MVP, `Rejected` does not return through `Need More Information`; the follow-up path is correction/reassignment or move to `Pending Assignment`.

**Giải thích tiếng Việt:** `Rejected` không được dùng như trạng thái kết thúc im lặng. Mọi transition sang `Rejected` phải có lý do reject, history log, `nextProcessor` và transition follow-up hợp lệ. Ở MVP, `Rejected` không quay về bằng nhánh `Need More Information`; hướng follow-up là sửa phân loại/ngữ cảnh, reassign hoặc chuyển về `Pending Assignment`.

Các transition cần note hoặc reason bắt buộc:

| Transition / action | Required note or reason |
| ----- | ----- |
| `Assigned` / `In Review` / `In Progress` -> `Need More Information` | Required reason describing what information is missing. |
| `Need More Information` -> `Assigned` | Required update summary when Tester or PM uses `Resubmit to Developer`. |
| `Assigned` / `In Review` / `In Progress` -> `Rejected` | Required rejection reason and follow-up owner/action. |
| `In Progress` -> `Resolved` | Required resolution note or processing result. |
| `Resolved` -> `Reopened` | Required reopen reason, usually from Tester or PM. |
| Normal transitions such as `Assigned` -> `In Review` or `In Review` -> `In Progress` | Developer note is optional. |

Fiori Bug Detail UI implications:

* Bug status must be edited through a dropdown or value help, not free text.
* Assignee should be placed in the top/high-priority area of the Bug Detail page.
* Important input fields should be grouped for fast entry and review: title, status, assignee, priority, application component, defect category, steps to reproduce, actual result, and expected result.
* Severity and environment should be placed in a supporting/right-side information area or secondary group where possible.
* UI validation must make required note/reason fields visible and clear only for transitions where they are required.

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
* Developer có thể comment trong bug thuộc cùng project/team hoặc bug mà Developer có quyền visibility, không chỉ bug đang assign cho mình.
* Comment không đồng nghĩa với quyền xử lý workflow. Developer có thể tham gia thảo luận, nhưng lifecycle action chính vẫn phải tuân theo BR-02 và BR-25.
* Các quyền comment theo từng role:

| Role | Quyền comment |
| ----- | ----- |
| **Tester** | Bổ sung thông tin, trả lời yêu cầu từ Developer, thêm feedback, cập nhật bằng chứng hoặc mô tả thêm về bug |
| **Developer** | Hỏi thêm thông tin, chia sẻ phân tích kỹ thuật, giải thích lý do cập nhật trạng thái khi được phép xử lý, và phản hồi trong bug có quyền visibility |
| **PM** | Theo dõi trao đổi, nhắc nhở tiến độ, hỏi thêm tình trạng xử lý, yêu cầu cập nhật thông tin hoặc đề xuất reassign nếu cần |

PM được phép comment vào bug nếu bug đó thuộc phạm vi dự án/team mà PM phụ trách. PM không thay thế Developer trong việc ghi developer note, và không thay thế Tester trong việc xác nhận thông tin bug. 

**English clarification:** Comments are for collaboration and traceability. They do not grant workflow-processing permission by themselves.

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

### **BR-30A - Email delivery phải tách khỏi bug workflow**

**English:** IDTS keeps the in-app `Notifications` record as the source event. Email delivery uses a separate `NotificationDeliveries` outbox record with `PENDING`, `SENT`, `FAILED`, or `SKIPPED` status. The notification and outbox instruction are stored with the business change, but SMTP network sending runs later in a background worker. An SMTP failure must not roll back assignment, status change, comment, or other bug workflow work. Disabled/incomplete SMTP configuration, inactive recipients, and missing/invalid recipient email are recorded as `SKIPPED`. SMTP credentials and raw transport errors must not be stored in business data or exposed through OData.

**Vietnamese:** IDTS giữ `Notifications` trong app làm source event. Việc gửi email dùng record outbox `NotificationDeliveries` riêng với status `PENDING`, `SENT`, `FAILED` hoặc `SKIPPED`. Notification và outbox instruction được lưu cùng thay đổi nghiệp vụ, nhưng kết nối SMTP được worker nền xử lý sau. Lỗi SMTP không được rollback assignment, thay đổi status, comment hoặc workflow bug khác. SMTP bị tắt/thiếu cấu hình, recipient inactive hoặc email recipient thiếu/sai phải được ghi `SKIPPED`. SMTP credential và raw transport error không được lưu vào dữ liệu nghiệp vụ hoặc expose qua OData.

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

The approved IDTS-122 baseline has 8 Application Components, 8 Defect Categories, and 31 active valid pairs. The `IDTS AI Advisory` component is paired only with CAP Backend, Integration, Performance, and Data Quality. A selected pair must be active together with both referenced master-data rows. Developer Responsibility narrows the candidate list; the authenticated user still makes the assignment decision.

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

Với bug thuần IDTS, `SAP Module` nên để trống. Không dùng giá trị giả như `Not Applicable`.

## **BR-43 - Bộ status chính phải bao gồm Retest Required**

Bộ status chính của IDTS:

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
| **Rejected** | Developer từ chối vì sai phân loại hoặc assign không phù hợp; đây là trạng thái cần follow-up, không phải trạng thái kết thúc |
| **Reopened** | Bug được mở lại vì vấn đề vẫn còn |
| **Closed** | Bug đã được xác nhận hoàn tất |

`Reassigned` không phải status chính. Reassign là action và phải được ghi nhận trong history log.

**English clarification:** `Rejected` remains in the main status list, but it must always lead to a follow-up step. It must not be used as a silent terminal state.

**Giải thích tiếng Việt:** `Rejected` vẫn nằm trong bộ status chính, nhưng luôn phải dẫn tới một bước xử lý tiếp theo. Không được dùng `Rejected` như trạng thái kết thúc im lặng.

**Current MVP clarification:** The normal create happy flow does not persist `New`. When a Tester submits a new bug, the backend writes `Assigned` if a suitable Developer is selected, or `Pending Assignment` if no suitable Developer is selected. `New` remains only for legacy/import compatibility and controlled transition handling.

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

UI wording baseline: show `Assignee (Technical Owner)` for the developer owner and `Current Action Owner` for the person or queue that must act now.

| Status / Action | nextProcessor hợp lý |
| ----- | ----- |
| Bug được assign | Developer được assign |
| Không có Developer phù hợp | PM queue hoặc Tester |
| Developer request more information | Tester |
| Tester hoặc PM dùng `Resubmit to Developer` | Developer được assign |
| Developer reject bug | Tester hoặc PM để sửa phân loại/ngữ cảnh, có thể bổ sung supporting information, reassign, hoặc đưa về Pending Assignment |
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

## **BR-47 - WP1 database model must follow the confirmed modeling baseline**

**English:** WP1 must follow the database baseline in `docs/ba/09-database-model-review.md`. The Bug entity should use UUID as the technical key and a readable `bugNumber` for users. Application Component and Defect Category are user-facing selections; Component Category is the validated assignment key. SAP Module is optional context and optional assignment filter, not a mandatory field for every bug. `nextProcessor` should support both a role/queue code and a specific user when known. Rejected bugs must store the latest rejection reason for display and immutable rejection reasons in HistoryLogs. User-facing history should be grouped in `HistoryEvents`, while `HistoryLogs` remains the raw field-level audit under each event. Attachment handling uses `@cap-js/attachments`; local DB fallback is allowed for development, while the integration/deployment target stores bytes in bound external object storage and metadata in CAP persistence. DuplicateLinks should store confirmed duplicate/similar/related relationships only.

**Vietnamese clarification:** Lich su hien cho nguoi dung nen duoc nhom theo `HistoryEvents` de doc nhanh, con `HistoryLogs` van la audit trail append-only o muc field cho tung event.

**Vietnamese:** WP1 phải đi theo database baseline trong `docs/ba/09-database-model-review.md`. Entity Bug dùng UUID làm technical key và có `bugNumber` dễ đọc cho người dùng. Application Component và Defect Category là lựa chọn user-facing; Component Category là assignment key đã validate. SAP Module là context tùy chọn và filter assignment tùy chọn, không bắt buộc cho mọi bug. `nextProcessor` nên hỗ trợ cả role/queue code và user cụ thể khi biết rõ. Bug bị Rejected phải lưu rejection reason mới nhất để hiển thị và lưu reason bất biến trong HistoryLogs. Attachment dùng `@cap-js/attachments`; local development được phép dùng DB fallback, còn integration/deployment target lưu file bytes ở external object storage và metadata trong CAP persistence. DuplicateLinks chỉ lưu quan hệ duplicate/similar/related đã xác nhận.

## **BR-48 - AI chỉ được hỗ trợ quyết định, không được sở hữu workflow**

IDTS có thể dùng AI cho bốn khả năng đã duyệt: tìm bug trùng/tương tự, gợi ý phân loại, tạo bug/handoff summary và giải thích Smart Assign.

Các rule bắt buộc:

* Mọi output AI phải được ghi và hiển thị như một suggestion chưa xác nhận.
* Người dùng phải chủ động accept, reject, ignore hoặc apply suggestion.
* AI không được tự assign Developer, tự tạo `DuplicateLinks`, tự sửa classification, tự close/reject bug hoặc tự đổi status.
* CAP validation và role authorization vẫn là lớp quyết định cuối, kể cả khi UI đã ẩn hoặc cho phép một lựa chọn.
* AI disabled, timeout, rate limit, malformed output hoặc provider failure không được chặn create/edit/comment/assignment/lifecycle flow bình thường.
* Chỉ gửi dữ liệu tối thiểu đã allowlist và làm sạch. Cấm gửi password, hash, token, credential, private endpoint, email private, attachment content hoặc storage reference.
* Chỉ lưu suggestion đã chuẩn hóa và trạng thái review cần cho audit; không lưu raw prompt, raw provider response hoặc hidden reasoning.

**English clarification:** AI remains advisory. Human review and CAP enforcement are mandatory for every AI-assisted feature, and the non-AI workflow must remain available when AI is disabled or fails. Persisted `AiSuggestions` are review/audit records only; clients must not write them directly.

**Duplicate/similar implementation rule:** `suggestSimilarBugs` may return ranked candidates and a suggested relation label, but these values are review hints only. It must exclude the source bug, tolerate disabled/failed/malformed embedding output through deterministic fallback, and must not create `DuplicateLinks` or block create/edit/lifecycle actions. A persisted source-bug check may create a sanitized `AiSuggestions` audit row; a pre-create check must not invent a persisted bug reference.

**Quy tắc triển khai duplicate/similar:** `suggestSimilarBugs` có thể trả danh sách ứng viên đã xếp hạng và nhãn relation gợi ý, nhưng đây chỉ là thông tin hỗ trợ review. Action phải loại bug nguồn, chịu được AI bị tắt/lỗi/embedding sai bằng deterministic fallback, và không được tạo `DuplicateLinks` hoặc chặn create/edit/lifecycle. Check trên bug đã lưu có thể tạo `AiSuggestions` audit row đã sanitize; check trước create không được tạo bug reference giả.
## IDTS-125 Bug mutation authorization clarification / Làm rõ quyền sửa Bug

**English.** Team-visible Developer access is read-and-discuss access, not generic Bug editing. A non-assignee Developer may read and comment but may not change Bug fields, enter the edit draft, or upload/update/delete attachments. The assigned Developer may comment, manage attachments, and invoke only the lifecycle actions explicitly allowed for the current status; opening the Fiori edit shell solely for attachment upload does not grant Bug-field mutation. Tester and PM retain their documented coordination/edit permissions. CAP enforces this matrix on active UPDATE, draft EDIT/PATCH/SAVE, and attachment mutations; Fiori capabilities are guidance only. Closed aggregate immutability remains unchanged.

**Tiếng Việt.** Quyền Developer xem Bug trong team là quyền đọc và thảo luận, không phải quyền Edit Bug chung. Developer không phải assignee chỉ được đọc/comment; không được sửa field Bug, mở edit draft hoặc upload/update/delete attachment. Developer assignee được comment, quản lý attachment và chỉ gọi lifecycle action đã được cho phép theo status; việc mở edit shell của Fiori chỉ để upload attachment không cấp quyền sửa field Bug. Tester và PM giữ quyền edit/điều phối đã được mô tả. CAP chặn đồng nhất ở active UPDATE, draft EDIT/PATCH/SAVE và mutation attachment; capability Fiori chỉ là hướng dẫn UX. Closed aggregate vẫn immutable.

## BR-51 - Attachment deletion follows uploader ownership and committed audit

On an open Bug, PM may delete any attachment. A Tester or Developer may delete only an attachment that they uploaded. Authorization uses the persisted attachment parent and uploader metadata; a client-supplied parent ID cannot grant permission. A denied delete must not change attachment metadata or history.

When deletion is committed through draft SAVE, the system writes exactly one readable `HistoryEvent` and one field-level `HistoryLog` using only sanitized attachment ID/filename metadata. Discarding the draft creates no deletion history. CLOSED Bugs continue to reject attachment mutation. Physical object deletion may complete asynchronously through the SAP attachment outbox; history represents the committed business deletion, not proof of immediate S3 removal.

Trên Bug đang mở, PM được xóa mọi attachment. Tester hoặc Developer chỉ được xóa attachment do chính mình upload. Phân quyền phải dùng Bug cha và uploader metadata đã persist; parent ID do client gửi không được dùng để cấp quyền. Delete bị từ chối không được thay đổi metadata hoặc history.

Khi delete được commit qua draft SAVE, hệ thống ghi đúng một `HistoryEvent` dễ đọc và một `HistoryLog` ở mức field, chỉ dùng attachment ID/filename đã sanitize. Discard draft không tạo lịch sử xóa. Bug CLOSED tiếp tục chặn attachment mutation. Việc xóa object vật lý có thể hoàn tất bất đồng bộ qua SAP attachment outbox; history phản ánh business deletion đã commit, không phải bằng chứng S3 đã xóa ngay lập tức.
