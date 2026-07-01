# Knowledge: `srv/bug-service/permissions.js`

## English

### What this file is for

Role and ownership permission enforcement for all write operations and workflow actions on Bugs, Comments, and Attachments.

This is the backend gatekeeper. Even if the Fiori UI hides a button, a direct OData call will still be checked here.

### Beginner explanation

In IDTS the system deliberately limits who can do what:
- Only Tester or PM (coordinator roles) can create bugs or (re)assign them.
- Only the currently assigned Developer (plus coordinators) can move the bug through the developer-controlled statuses.
- When a bug is Rejected, only coordinators can correct it.
- A Developer can only act on bugs currently assigned to them.

This file implements these rules at the service level so they are enforced even for direct API calls.

### IDTS flow

When any write or action happens:
1. `srv/service.js` calls the permission functions (through prepareBugWrite or the action handlers).
2. The actor is resolved.
3. Role and "is assigned developer" checks are performed using the sets from constants.
4. Unauthorized requests are rejected with 403 before any data changes.

This is how the project enforces that primary lifecycle actions remain controlled.

### Important source anchors

- **Location**: `srv/bug-service/permissions.js:13`
  `async function enforceBugWritePermission(...)`
  **IDTS concept**: Protects create and direct status/assignee changes. Only coordinators can assign; only assigned Developer + coordinators can drive developer statuses.
  **Impact if broken**: Unauthorized assignment or status moves; nextProcessor and history become inconsistent.
  **Must check together**: `bug-write.js`, `constants.js` (roles and status sets), `srv/service.js` before hooks.

- **Location**: `srv/bug-service/permissions.js:46`
  `async function enforceActionPermission(...)`
  **IDTS concept**: Checks for all workflow actions (assign, resolve, reject, request info, etc.).
  **Impact if broken**: Wrong roles can execute privileged actions; Developer can act on unassigned bugs.
  **Must check together**: `actions.js`, `constants.js`, `srv/service.js` on handlers, Fiori action annotations.

- **Location**: `isAssignedDeveloper` helper
  **IDTS concept**: Verifies the acting user is the technical owner (assignee) of the bug.
  **Impact if broken**: Access control for Developer self-service status changes fails.
  **Must check together**: `helpers.js`, constants DEVELOPER_DIRECT_STATUSES.

### Cross-folder dependency map

- Permissions logic is called from `srv/service.js` and the action/bug-write modules.
- The rules here must stay in sync with capability virtual fields exposed in `srv/service.cds` and hidden by annotations in the Fiori app.
- Relies on role_code and assignee_ID from the data model.

### Safe editing checklist

- Change to permission rules requires coordinated update in constants, this file, actions, capability calculation, and Fiori annotations.
- Test both allowed and forbidden cases.
- Backend is authoritative.

## Vietnamese

### File này dùng để làm gì

Thực thi phân quyền theo vai trò và quyền sở hữu cho mọi thao tác ghi và action trên bug, comment, attachment.

Đây là lớp kiểm soát ở backend. UI có ẩn nút thì gọi OData trực tiếp vẫn bị chặn ở đây.

### Giải thích cho người mới

Hệ thống giới hạn rõ ràng:
- Chỉ Tester/PM mới được tạo bug hoặc gán/re-assign.
- Chỉ Developer được assign (và coordinator) mới được đẩy trạng thái developer-controlled.
- Bug Rejected chỉ coordinator mới được sửa.
- Developer chỉ tác động được bug đang assign cho mình.

File này hiện thực hóa các quy tắc đó.

### Flow hoạt động trong IDTS

Mọi write/action đều đi qua các hàm permission trước khi thay đổi dữ liệu. Actor được giải quyết, role + assigned check được thực hiện, request không hợp lệ bị reject 403.

Đây là cách project đảm bảo "primary lifecycle actions remain controlled".

### Các điểm neo quan trọng trong source

- `enforceBugWritePermission`: bảo vệ create và thay đổi trực tiếp assignee/status.
- `enforceActionPermission`: bảo vệ các action workflow.
- `isAssignedDeveloper`: xác nhận Developer là owner hiện tại.

### Liên kết với file/folder khác

Gọi từ service.js, actions.js, bug-write.js. Phải khớp với virtual can* ở service.cds và annotation UI. Dựa vào dữ liệu role và assignee trong schema.

### Checklist sửa an toàn

- Thay đổi permission → cập nhật đồng bộ constants + actions + capability + annotation Fiori.
- Test cả case được phép và bị chặn.
- Backend là nguồn sự thật.

## Metadata

- Source file: `srv/bug-service/permissions.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/permissions.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: 74
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## 2026-07-01 update: create permission at draft start

### English

Bug creation permission is now expressed once in `enforceBugCreatePermission()` and `assertBugCreatePermission()`. Both active CREATE and Fiori draft `NEW` reuse the rule. CAP emits `NEW` when a user starts a new root draft; waiting for activation would let Developer enter a create flow that can never be completed.

- **Location**: `enforceBugCreatePermission()` / `assertBugCreatePermission()`
  **IDTS concept**: Only Tester and PM create Bug reports; Developer processes assigned work.
  **Impact if broken**: Developer can start an unauthorized create session, leaving UI visibility as the only apparent protection.
  **Must check together**: `srv/service.js` `before NEW`, Fiori Create visibility, login role mapping, and direct authorization tests.

Hiding Create in Fiori is useful UX, but browser state is not a security boundary; this backend check remains mandatory.

### Vietnamese

Quyền tạo Bug hiện được gom vào `enforceBugCreatePermission()` và `assertBugCreatePermission()`. Cả active CREATE lẫn event draft `NEW` của Fiori đều dùng cùng rule. CAP phát `NEW` khi user bắt đầu root draft; nếu chờ đến activation mới chặn thì Developer vẫn vào một create flow mà họ không bao giờ được phép hoàn tất.

- **Vị trí**: `enforceBugCreatePermission()` / `assertBugCreatePermission()`
  **Khái niệm IDTS**: Chỉ Tester và PM tạo Bug report; Developer xử lý công việc đã được giao.
  **Ảnh hưởng nếu sai**: Developer có thể bắt đầu phiên create trái quyền, khiến việc ẩn nút trên UI trở thành lớp bảo vệ duy nhất nhìn thấy được.
  **Phải kiểm tra cùng**: `before NEW` trong `srv/service.js`, visibility của Fiori Create, mapping role khi login và test authorization trực tiếp.

Ẩn Create trên Fiori là UX cần thiết, nhưng trạng thái trình duyệt không phải ranh giới bảo mật; backend check này vẫn bắt buộc.
