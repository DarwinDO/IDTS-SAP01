# Debug Lab: Assignment, Comments, and Attachments

## English

### Goal and mental model

The browser helps a human choose and upload; CAP remains the authority. `assignee` is the technical developer assigned to the bug, while `current action owner` is the person expected to act now. Attachment metadata lives in PostgreSQL/SQLite; binary content is handled by the storage adapter such as S3.

### Step 1 — Smart Assign request path

Open a saved Bug as Tester or PM and Browser Network. Place breakpoints at:

1. `SmartAssignDeveloper.js:readCandidates`;
2. `SmartAssignDeveloper.js:readAssignmentExplanations`;
3. `SmartAssignDeveloper.js:executeAssignment`;
4. `srv/service.js` registration for `assignToDeveloper`;
5. `srv/bug-service/actions.js:assignToDeveloper`.

Opening the value help reads `AssignableDevelopers`, then optionally calls `explainSmartAssignment`. Inspect candidate `developerProfileID`, availability/workload, warnings, and explanation. Nothing is assigned yet. Selecting a row makes `executeAssignment` invoke the bound OData action with `assigneeID`. CAP validates role, candidate existence/availability, and Bug state before updating `assignee_ID`, status/current owner, history, and notifications.

### Step 2 — Comment request path

Place breakpoints at `BugCollaboration.js:onAddComment`, `srv/service.js` action registration, and `srv/bug-service/actions.js:addComment`. Enter a comment on a saved Bug. Network shows the bound `addComment` action. Inspect context Bug ID, text, actor, and permission. The database side effect is a `Comments` row plus history/notification where applicable. During create, the Comments section is hidden because no active Bug ID exists for a durable comment relationship.

### Step 3 — Attachment selected before Save

While creating a new Bug, selecting a file puts a temporary object only in browser memory managed by `BugCollaboration.js`; no S3 object or attachment row exists yet. Break at `uploadFilesToSavedBug`. After Bug activation provides a real ID, the function creates/activates attachment data through OData. CAP reaches `srv/bug-service/content.js:prepareAttachmentWrite`, validates file name/type/size/authorization, persists metadata, and delegates binary content to the configured storage adapter. Reload/download proves the file left browser memory.

### Failure exercises

- Send an invalid `assigneeID` directly: expected 4xx and no owner/history mutation.
- Double-click assignment: at most one valid state change; investigate duplicate request/history if present.
- Add blank comment: expected validation error and no row.
- Upload invalid/oversized file: both early UI feedback and backend rejection; no orphan metadata/binary.

### Teach-back

Explain the difference between assignee and current action owner, why AI only explains candidates, where a pre-save file exists, and how metadata differs from S3 binary content.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

Browser giúp con người chọn và upload; CAP mới là lớp có quyền quyết định. `assignee` là developer chịu trách nhiệm kỹ thuật với bug, còn `current action owner` là người đang cần hành động ở bước hiện tại. Metadata attachment nằm trong PostgreSQL/SQLite; nội dung binary do storage adapter như S3 giữ.

### Bước 1 — Đường đi Smart Assign

Mở Bug đã lưu bằng Tester hoặc PM và mở Browser Network. Đặt breakpoint:

1. `SmartAssignDeveloper.js:readCandidates`;
2. `SmartAssignDeveloper.js:readAssignmentExplanations`;
3. `SmartAssignDeveloper.js:executeAssignment`;
4. chỗ đăng ký `assignToDeveloper` trong `srv/service.js`;
5. `srv/bug-service/actions.js:assignToDeveloper`.

Mở value help sẽ đọc `AssignableDevelopers`, rồi có thể gọi `explainSmartAssignment`. Xem `developerProfileID`, availability/workload, warning và explanation. Lúc này chưa assign ai. Chọn một dòng làm `executeAssignment` gọi bound OData action với `assigneeID`. CAP kiểm role, candidate tồn tại/available và Bug state trước khi đổi `assignee_ID`, status/current owner, history và notification.

### Bước 2 — Đường đi comment

Đặt breakpoint tại `BugCollaboration.js:onAddComment`, chỗ đăng ký action trong `srv/service.js` và `srv/bug-service/actions.js:addComment`. Nhập comment trên Bug đã lưu. Network hiện bound action `addComment`. Xem Bug ID, text, actor và permission. Side effect database là một row `Comments`, kèm history/notification nếu flow yêu cầu. Lúc create, Comments bị ẩn vì chưa có active Bug ID để tạo quan hệ comment bền vững.

### Bước 3 — Attachment chọn trước Save

Khi create Bug mới, file vừa chọn chỉ là object tạm trong browser memory do `BugCollaboration.js` quản lý; chưa có S3 object hoặc attachment row. Dừng ở `uploadFilesToSavedBug`. Sau khi Bug activate và có ID thật, hàm tạo/activate attachment qua OData. CAP vào `srv/bug-service/content.js:prepareAttachmentWrite`, kiểm tên/type/size/quyền, persist metadata và giao binary cho storage adapter. Reload/download chứng minh file không còn chỉ nằm trong browser.

### Bài lỗi

- Gửi trực tiếp `assigneeID` sai: phải 4xx, không đổi owner/history.
- Double-click assign: tối đa một state change hợp lệ; nếu có request/history trùng phải điều tra.
- Comment rỗng: phải lỗi validation, không có row.
- File sai/oversize: UI cảnh báo sớm và backend vẫn reject; không để metadata/binary mồ côi.

### Teach-back

Giải thích assignee khác current action owner thế nào, vì sao AI chỉ giải thích candidate, file pre-save nằm ở đâu và metadata khác binary S3 ra sao.
