# Knowledge: `srv/bug-service/helpers.js`

## Beginner-first symbol map (2026-07-18)

### English

Helpers are grouped by purpose. Request/data helpers: `readBug`, `bugIDFrom`, `trimToNull`. Identity helpers: `requestUserCandidates` → `activeUserFromCandidate` → `resolveRequestUser`; this chain creates the trusted actor used by permissions/history. Display helpers map status, role, user, developer, catalog and component/category IDs to readable labels. Routing helpers `nextBugNumber`, `firstUserByRole`, and `userIDForDeveloper` support create and next-owner logic. `reasonTarget/toHistoryValue` normalize UI error/audit values. Break in the caller first, then the exact helper; inspect input IDs/entity and transaction result. Helpers normally return data and do not persist, except their caller writes the returned value.

### Vietnamese

Helper được chia theo mục đích. Nhóm request/data: `readBug`, `bugIDFrom`, `trimToNull`. Nhóm identity: `requestUserCandidates` → `activeUserFromCandidate` → `resolveRequestUser`; chuỗi này tạo actor đáng tin cho permission/history. Nhóm display map status, role, user, developer, catalog và component/category ID thành label dễ đọc. Nhóm định tuyến `nextBugNumber`, `firstUserByRole`, `userIDForDeveloper` phục vụ create và next owner. `reasonTarget/toHistoryValue` chuẩn hóa lỗi UI/giá trị audit. Break ở caller trước rồi đúng helper; xem input ID/entity và kết quả transaction. Helper thường chỉ return dữ liệu, caller mới persist giá trị đó.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: shared Bug/user lookup and input normalization. Step here when two action modules see a different Bug or actor than expected. Keep feature-specific rules out of helpers.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: shared Bug/user lookup và input normalization. Step vào đây khi hai action module nhìn thấy Bug hoặc actor khác mong đợi. Không đưa rule riêng của feature vào helper.

## English

### What this file is for

Common utility functions used throughout the BugService for reading bugs, resolving the current user (actor), and turning code values into human-readable names for the UI.

### Beginner explanation

When a request arrives, CAP gives us `req.user`, but in this project we support both real authentication and local mock users. This file contains the logic to turn whatever is in `req.user` (id, email, name, etc.) into a real row from the Users table.

It also provides small "display" helpers so that instead of showing raw UUIDs or codes in history and lists, Fiori shows "Nguyen Van A", "Assigned", "PM", etc.

### IDTS flow

- Every time we need to know "who is doing this action?", `resolveRequestUser` is called.
- When writing history or enriching reads, the display* functions turn codes into names using the value list entities.
- `readBug` is a small helper used by many transition and write functions so they don't repeat the same SELECT.

These utilities are used by permissions, actions, bug-write, history, read-models, etc.

### Important source anchors

- **Location**: `srv/bug-service/helpers.js:10` (resolveRequestUser + activeUserFromCandidate)
  **IDTS concept**: Resolves the acting user from multiple possible attributes in the request (supports local mock auth and real user info). This is the foundation of all role and "is assigned" checks.
  **Impact if broken**: Permissions stop working (everyone treated as anonymous or wrong person), history shows wrong actor, notifications go to the wrong user.
  **Must check together**: `permissions.js`, `actions.js`, `bug-write.js`, `history.js`, `srv/service.js`.

- **Location**: display* functions (displayStatus, displayUserName, displayDeveloperName, displayCodeListName)
  **IDTS concept**: Turn internal codes (status, role, user ID, developer profile) into the names shown in Fiori history, lists, and Object Page.
  **Impact if broken**: UI shows codes or empty values instead of readable text; history becomes hard to understand for Tester/Developer/PM.
  **Must check together**: `srv/service.cds` (virtual displayName fields), Fiori annotations and i18n, history-read-models.

### Cross-folder dependency map

- Used by almost every module under `srv/bug-service/`.
- Feeds display fields declared as virtuals in `srv/service.cds`.
- Depends on the Users, DeveloperProfiles, and CodeList entities from `db/schema.cds`.

### Safe editing checklist

- Changes to user resolution logic affect every permission and history entry.
- Display helpers must stay in sync with the virtual fields and the value list entities.
- Test with both the bundled mock users and (if available) real auth.

## Vietnamese

### File này dùng để làm gì

Các hàm tiện ích chung dùng trong BugService để đọc bug, xác định người dùng hiện tại (actor), và chuyển mã code thành tên dễ đọc cho UI.

### Giải thích cho người mới

Khi request đến, CAP cung cấp `req.user`, nhưng project hỗ trợ cả auth thật và user mock local. File này chuyển thông tin đó thành record thật trong bảng Users.

Nó cũng cung cấp các hàm "hiển thị" để thay vì hiện UUID hoặc code thì Fiori hiện tên người, tên trạng thái, vai trò rõ ràng.

### Flow hoạt động trong IDTS

Mỗi khi cần biết "ai đang làm hành động này?" thì gọi resolveRequestUser. Khi ghi history hoặc làm giàu dữ liệu đọc, các hàm display* chuyển code thành tên. readBug là helper nhỏ dùng lại ở nhiều nơi.

Các hàm này được permissions, actions, bug-write, history, read-models gọi chung.

### Các điểm neo quan trọng trong source

- resolveRequestUser + activeUserFromCandidate: giải quyết actor từ nhiều thuộc tính request (hỗ trợ mock + auth thật). Nền tảng của mọi kiểm tra quyền.
- Các hàm display*: chuyển code thành text hiển thị trong history, list, Object Page.

### Liên kết với file/folder khác

Được dùng bởi hầu hết module bug-service. Cung cấp dữ liệu cho virtual displayName ở service.cds. Phụ thuộc Users, DeveloperProfiles, CodeList entities ở db/schema.

### Checklist sửa an toàn

Thay đổi logic resolve user ảnh hưởng toàn bộ permission và history. Display helpers phải khớp virtual field và value list. Test với mock users.

## Metadata

- Source file: `srv/bug-service/helpers.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/helpers.js.md`
- Source layer: `srv`
- Source type: `.js`
- Documentation style: learning-oriented explanation
- Last reviewed: 2026-06-22
