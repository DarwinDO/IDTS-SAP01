# IDTS-108 SangVN Ownership Knowledge Gate — Assignment and collaboration

Date: 2026-08-02

Member: SangVN

Flow: Assignment, comments, and attachments

Result: PASS

Score: 7/7 (100%) after mentoring and equivalent retests

Critical questions: PASS

Debug exercise: PASS

Teach-back: PASS

## English evidence

The deterministic runner selected seven questions with three base questions and
four inactivity questions:

```text
npm run learning:gate -- sangvn assignment 2026-08-02 2026-07-25
```

SangVN answered in their own words and completed equivalent retests after
beginner-first mentoring:

1. Traced Assign from `SmartAssignDeveloper.js:executeAssignment` through the
   bound `BugService.assignToDeveloper` action, `srv/service.js`, and
   `srv/bug-service/actions.js:assignToDeveloper`.
2. Distinguished the Developer assignee/technical owner from the current action
   owner, including the Request More Information case where the Developer remains
   assignee while the Tester becomes the current actor.
3. Traced an attachment from browser-memory staging through metadata POST,
   binary PUT, CAP validation, database metadata, storage reference, and S3/cloud
   binary storage; reload was identified as persistence/read-back evidence.
4. Explained Smart Assign as a human-controlled flow: `AssignableDevelopers`
   supplies candidates, AI remains advisory, and Tester/PM confirms the choice.
5. Identified assignment read-back checks for assignee, current action owner,
   status, history, notification, and reload persistence.
6. Explained why random or AI-autonomous assignment would bypass responsibility,
   availability, authorization, and human accountability controls.
7. Traced `candidate.developerProfileID` to the `assigneeID` action parameter and
   the backend validation/update pipeline for assignee, status, and next processor.

Critical security and data-integrity assessment:

- Backend authorization remains authoritative even when the UI exposes Assign or
  Comment controls.
- AI candidate explanations cannot choose or assign a Developer.
- Comment author identity comes from the authenticated user/session, not a client
  author field; backend rejects missing Bug, unauthorized role, and blank content.
- Invalid, unavailable, or responsibility-mismatched assignees are rejected before
  Bug, status, or history mutation.
- Attachment metadata is stored by the CAP database while binary content is stored
  through the attachment storage adapter; reload proves the data is not only in
  browser memory.

Controlled debug exercise:

- At `executeAssignment`, the controlled candidate used
  `candidate.developerProfileID = "DP-SANGVN"` on an active Bug.
- At the backend handler, `req.data.assigneeID = "DP-SANGVN"` and the authenticated
  actor role was Tester.
- SangVN correctly identified the outgoing `assigneeID` parameter, Developer ID,
  availability, and responsibility checks, and added the backend role boundary
  after mentor feedback.
- For a nonexistent or unavailable candidate, SangVN correctly expected HTTP 400
  and no change to `assignee_ID`, status, or History because validation stops before
  the update transaction.

Teach-back result:

SangVN independently explained candidate selection, advisory AI, the UI-to-CAP
assignment trace, assignee versus current action owner, authenticated comment
validation/persistence with history, attachment metadata versus S3 binary content,
and why reload is required to prove persistence.

No credential, token, private endpoint, private email, attachment content, or
storage key is recorded in this evidence.

## Bằng chứng tiếng Việt

Runner deterministic đã chọn bảy câu gồm ba câu cơ bản và bốn câu do thời gian
không có ownership-code activity:

```text
npm run learning:gate -- sangvn assignment 2026-08-02 2026-07-25
```

SangVN trả lời bằng lời của mình và hoàn thành các bài retest tương đương sau phần
hướng dẫn beginner-first:

1. Trace nút Assign từ `SmartAssignDeveloper.js:executeAssignment` qua bound action
   `BugService.assignToDeveloper`, `srv/service.js`, rồi tới
   `srv/bug-service/actions.js:assignToDeveloper`.
2. Phân biệt Developer assignee/technical owner với current action owner, gồm tình
   huống Request More Information: Developer vẫn là assignee nhưng Tester trở thành
   người cần hành động hiện tại.
3. Trace attachment từ browser memory qua POST metadata, PUT binary, CAP validation,
   metadata trong database, storage reference và binary trên S3/cloud storage;
   reload là bằng chứng persist/read-back.
4. Giải thích Smart Assign là flow do con người kiểm soát: `AssignableDevelopers`
   cung cấp candidate, AI chỉ tư vấn, Tester/PM xác nhận lựa chọn.
5. Nêu đúng các điểm read-back sau assignment: assignee, current action owner,
   status, history, notification và persistence sau reload.
6. Giải thích vì sao random assignment hoặc AI tự assign sẽ bỏ qua responsibility,
   availability, authorization và trách nhiệm quyết định của con người.
7. Trace `candidate.developerProfileID` thành parameter `assigneeID` và qua pipeline
   backend kiểm tra/cập nhật assignee, status, next processor.

Đánh giá critical về security và toàn vẹn dữ liệu:

- Backend authorization là lớp quyết định cuối dù UI có hiện nút Assign hoặc Comment.
- AI explanation không được chọn hoặc tự assign Developer.
- Danh tính người comment lấy từ user/session đã xác thực, không tin author do client
  gửi; backend chặn Bug không tồn tại, role không hợp lệ và nội dung rỗng.
- Assignee không tồn tại, unavailable hoặc không khớp responsibility bị reject trước
  khi thay đổi Bug, status hoặc History.
- CAP database giữ attachment metadata, storage adapter giữ binary; reload chứng minh
  dữ liệu không còn chỉ nằm trong browser memory.

Bài debug có kiểm soát:

- Tại `executeAssignment`, candidate dùng
  `candidate.developerProfileID = "DP-SANGVN"` trên một Bug active.
- Tại backend handler, `req.data.assigneeID = "DP-SANGVN"` và actor đã xác thực có
  role Tester.
- SangVN xác định đúng parameter `assigneeID`, các kiểm tra ID, availability và
  responsibility; sau mentor feedback đã bổ sung boundary kiểm tra role backend.
- Với candidate không tồn tại hoặc unavailable, SangVN kết luận đúng: HTTP 400,
  không đổi `assignee_ID`, status hoặc History vì validation dừng trước transaction
  update.

Kết quả teach-back:

SangVN tự giải thích được candidate selection, AI advisory, trace assignment từ UI
tới CAP, assignee khác current action owner, comment dùng authenticated actor và ghi
database/history, attachment metadata khác binary trên S3, cùng lý do reload để chứng
minh persistence.

Evidence này không chứa credential, token, endpoint private, email private, nội dung
attachment hoặc storage key.
