# Debug Lab: Assignment, Comments, and Attachments

## English

### Goal

Debug the collaboration flow without confusing a browser-side convenience with the backend authority. The user chooses an assignee; IDTS never auto-assigns from an AI explanation.

### Safe setup and breakpoints

Open a saved bug as Tester or PM. Set breakpoints in `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` at `readCandidates`, `readAssignmentExplanations`, and `executeAssignment`; then in `srv/service.js` at `assignToDeveloper`. For collaboration, add breakpoints at `BugCollaboration.js:onAddComment`, `uploadFilesToSavedBug`, `srv/bug-service/content.js:prepareAttachmentWrite`, and `srv/bug-service/actions.js:addComment`.

### Expected execution order

1. The picker reads `AssignableDevelopers`; UI search/filter and AI explanation only help a human choose.
2. The selected `developerProfileID` is sent to `BugService.assignToDeveloper`.
3. CAP verifies role, developer availability, and valid assignee; it changes the bug status/owner and creates history/notification side effects.
4. Comments are disabled while a bug is being created because there is no active bug ID yet. After save, `addComment` validates the actor and writes a `Comments` row.
5. Files selected during create are held only in browser memory. After the Bug is saved, `BugCollaboration.js` creates/activates the attachment draft and CAP writes metadata while the storage adapter stores binary content. Refresh proves the file is no longer only in the browser.

### Inspect and failure exercise

Inspect `candidate.developerProfileID`, the action parameter `assigneeID`, bug `assignee_ID`, and the created history event. Try an invalid assignee ID through a direct request: it must fail. Try uploading an invalid/oversized file: the client may give early feedback, but `prepareAttachmentWrite` remains the final safety check.

### Teach-back

Explain why the AI explanation must not perform assignment, why comment input is hidden during create, and where a pre-save attachment exists before the bug becomes active.

## Vietnamese

### Mục tiêu

Debug luồng collaboration mà không nhầm tiện ích browser với quyền quyết định của backend. User tự chọn assignee; IDTS không auto-assign theo AI explanation.

### Chuẩn bị và breakpoint

Mở một bug đã save bằng Tester hoặc PM. Đặt breakpoint trong `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` tại `readCandidates`, `readAssignmentExplanations`, `executeAssignment`; sau đó tại `assignToDeveloper` trong `srv/service.js`. Với collaboration, đặt breakpoint tại `BugCollaboration.js:onAddComment`, `uploadFilesToSavedBug`, `srv/bug-service/content.js:prepareAttachmentWrite`, `srv/bug-service/actions.js:addComment`.

### Thứ tự chạy mong đợi

1. Picker đọc `AssignableDevelopers`; search/filter UI và AI explanation chỉ hỗ trợ con người chọn.
2. `developerProfileID` được chọn được gửi tới `BugService.assignToDeveloper`.
3. CAP kiểm tra role, availability và assignee hợp lệ; sau đó đổi owner/status và tạo history/notification side effect.
4. Comment bị disable khi đang create vì chưa có active bug ID. Sau Save, `addComment` kiểm tra actor rồi ghi một row `Comments`.
5. File chọn lúc create chỉ nằm tạm trong browser memory. Sau khi Bug save, `BugCollaboration.js` tạo/activate attachment draft; CAP lưu metadata còn storage adapter lưu binary. Refresh chứng minh file không còn chỉ ở browser.

### Cần quan sát và bài lỗi

Quan sát `candidate.developerProfileID`, action parameter `assigneeID`, `assignee_ID` của bug và history event mới. Thử direct request với assignee ID sai: phải fail. Thử file sai/oversize: client có thể báo sớm, nhưng `prepareAttachmentWrite` vẫn là lớp kiểm tra cuối.

### Giải thích lại

Giải thích vì sao AI explanation không được tự assign, vì sao comment bị ẩn khi create và attachment trước Save đang nằm ở đâu trước khi bug thành active.
