# IDTS-85 Ownership Knowledge Gate — SangVN — 2026-07-26

## English

### Result

- Member: SangVN
- Ownership flow: Assignment, Comments, and Attachments
- Deterministic selection command: `npm run learning:gate -- sangvn assignment 2026-07-26 2026-07-24`
- Question count: 4 (`3` base, `1` inactive-day, `0` additional-flow)
- Final assessed score: **4/4 (100%)** after focused mentoring and equivalent retests
- Critical authorization and data-integrity answers: **PASS**
- Controlled debug exercise: **PASS** after an equivalent retest
- Teach-back: **PASS** after an equivalent retest
- Overall result: **PASS**

### Assessed understanding

1. **Assignment data and side effects — PASS after correction.** SangVN identified the intended Bug changes (`status_code`, `assignee_ID`, `nextProcessorUser_ID`, `nextProcessorRole_code`, and rejection-reason clearing), then added history and notification side effects and confirmed unrelated Bug, classification, and collaboration data must remain unchanged.
2. **Caller and callee — PASS after hint.** SangVN traced `SmartAssignDeveloper.js` / `executeAssignment()` through the `service.cds` action contract and the `service.js` `this.on(...)` route to `srv/bug-service/actions.js` / `assignToDeveloper()`.
3. **One-minute teach-back — PASS after equivalent authorization retest.** SangVN explained that candidate selection is temporary UI state until confirmation, then distinguished actor permission (Tester/PM) from selected-Developer validation (active, available, matching responsibility). SangVN confirmed a `400` or `403` stops before `UPDATE` and preserves the database.
4. **Smart Assign trace — PASS after correction.** SangVN identified `/selectedCandidate` and `/selectedCandidateId`, the bound `BugService.assignToDeveloper(...)` action, the `assigneeID` and `note` parameters, backend validation, successful Bug/history/notification effects, and safe failure behavior.

### Controlled debug exercise

The first scenario used an active but unavailable Developer. SangVN correctly concluded HTTP `400`, no Bug update, no history/notification, and unchanged database state, but initially placed the stop at status validation. Mentoring clarified that the valid `PENDING_ASSIGNMENT` to `ASSIGNED` transition passes and the request stops inside `validateAssignee()` at the availability check.

The equivalent retest used an active, available Developer with `responsibilities = []`. SangVN correctly evaluated `hasMatchingResponsibility = false`, located the stop in `validateAssignee()` at `if (!hasMatchingResponsibility)`, concluded HTTP `400`, no `UPDATE`, no history/notification, and unchanged database state, and explained that the Developer lacks responsibility for the Bug's Component Category and SAP Module scope.

### Attachment security understanding

SangVN explained that the database stores attachment metadata and storage reference, while S3/cloud storage holds the binary bytes. The safe browser breakpoint is at `xhr.onload` / `xhr.onerror`; inspect method, endpoint, and HTTP status without logging authorization tokens, binary content, credentials, or private storage URLs.

### Evidence safety

This evidence contains no password, token, API key, private endpoint, attachment content, credential, or full personal data.

## Tiếng Việt

### Kết quả

- Thành viên: SangVN
- Flow ownership: Assignment, Comments và Attachments
- Lệnh chọn câu hỏi cố định: `npm run learning:gate -- sangvn assignment 2026-07-26 2026-07-24`
- Số câu: 4 (`3` câu cơ bản, `1` câu do ngày không code, `0` câu flow bổ sung)
- Điểm đánh giá cuối: **4/4 (100%)** sau mentoring tập trung và equivalent retest
- Câu critical về authorization và data integrity: **PASS**
- Controlled debug exercise: **PASS** sau equivalent retest
- Teach-back: **PASS** sau equivalent retest
- Kết quả chung: **PASS**

### Kiến thức đã đánh giá

1. **Dữ liệu và side effect của assignment — PASS sau correction.** SangVN xác định đúng các thay đổi có chủ đích trên Bug (`status_code`, `assignee_ID`, `nextProcessorUser_ID`, `nextProcessorRole_code` và xóa rejection reason), sau đó bổ sung history/notification và xác nhận dữ liệu Bug, classification và collaboration không liên quan phải giữ nguyên.
2. **Caller và callee — PASS sau hint.** SangVN trace từ `SmartAssignDeveloper.js` / `executeAssignment()` qua action contract trong `service.cds`, routing `this.on(...)` trong `service.js`, đến `srv/bug-service/actions.js` / `assignToDeveloper()`.
3. **Teach-back một phút — PASS sau equivalent authorization retest.** SangVN giải thích candidate chỉ nằm ở UI state tạm cho tới khi xác nhận, phân biệt quyền actor (Tester/PM) với validation Developer được chọn (active, available, responsibility phù hợp), và xác nhận lỗi `400` hoặc `403` dừng trước `UPDATE`, database giữ nguyên.
4. **Trace Smart Assign — PASS sau correction.** SangVN xác định `/selectedCandidate`, `/selectedCandidateId`, bound action `BugService.assignToDeveloper(...)`, parameters `assigneeID` và `note`, backend validation, các thay đổi Bug/history/notification khi thành công, và hành vi an toàn khi thất bại.

### Controlled debug exercise

Scenario đầu dùng Developer active nhưng unavailable. SangVN kết luận đúng HTTP `400`, không update Bug, không tạo history/notification và database giữ nguyên, nhưng ban đầu đặt sai điểm dừng ở status validation. Mentoring làm rõ transition `PENDING_ASSIGNMENT` sang `ASSIGNED` hợp lệ và request dừng trong `validateAssignee()` tại kiểm tra availability.

Equivalent retest dùng Developer active, available nhưng `responsibilities = []`. SangVN đánh giá đúng `hasMatchingResponsibility = false`, xác định request dừng trong `validateAssignee()` tại `if (!hasMatchingResponsibility)`, trả HTTP `400`, không `UPDATE`, không tạo history/notification, database giữ nguyên, và giải thích Developer thiếu responsibility phù hợp với Component Category cùng phạm vi SAP Module của Bug.

### Hiểu biết bảo mật attachment

SangVN giải thích database lưu metadata attachment và storage reference, còn S3/cloud storage giữ binary bytes. Breakpoint trình duyệt an toàn nằm ở `xhr.onload` / `xhr.onerror`; chỉ kiểm method, endpoint và HTTP status, không log authorization token, binary content, credential hoặc private storage URL.

### An toàn evidence

Evidence này không chứa password, token, API key, private endpoint, nội dung attachment, credential hoặc dữ liệu cá nhân đầy đủ.
