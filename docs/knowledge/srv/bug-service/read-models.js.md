# Knowledge: `srv/bug-service/read-models.js`

## English

### What this file is for

Contains the logic that enriches Bug data for the UI (display names for reporter/assignee/nextProcessor) and computes the dynamic `can*` capability flags that control which action buttons are visible on the Object Page.

Also implements the `AssignableDevelopers` value help used when assigning a bug.

### IDTS flow

After every READ of Bugs (or drafts), `enrichBugDisplayFields` and `enrichBugCapabilities` are called.

`readAssignableDevelopers` powers the filtered value help that only shows developers responsible for the selected componentCategory (and optionally SAP Module).

### Important source anchors

- `enrichBugCapabilities` + `CAPABILITY_FIELDS` from constants.
  **IDTS concept**: Calculates per-bug boolean flags (`canResolve`, `canReject`, `canClose`...) based on current status, who the actor is, and whether they are the assignee or a coordinator. These flags are used by Fiori annotations to hide or show action buttons.
  **Impact if broken**: Wrong buttons are shown to the wrong roles; developers see actions they cannot actually perform (or cannot see legitimate ones).
  **Must check together**: `srv/service.cds` (virtual can* fields), `annotations/actions.cds` and `capabilities.cds`, `permissions.js`, `constants.js`.

- `readAssignableDevelopers`.
  **IDTS concept**: The custom read that implements the smart assignee value help. Filters DeveloperResponsibilities by the bug's componentCategory and (optionally) sapModule.
  **Impact if broken**: Tester cannot find suitable developers; assignment uses the wrong list.
  **Must check together**: `srv/service.cds` (AssignableDevelopers entity), `db/schema.cds` (DeveloperResponsibilities + ComponentCategories), Fiori value-helps annotation.

### Cross-folder dependency map

- Called from `srv/service.js` after READ and on specific READ handlers.
- Depends on constants for status/role sets and capability list.
- Feeds virtual fields declared in `srv/service.cds`.
- The value help is consumed by `app/.../annotations/value-helps.cds` and the Assign action in Fiori.

### Safe editing checklist

When adding a new action or changing when a transition is allowed, update both the capability calculation here and the corresponding `@UI.Hidden` annotation. Test the button visibility in the real browser for all three roles.

## Vietnamese

### File này dùng để làm gì

Chứa logic làm giàu dữ liệu Bug cho UI (tên reporter/assignee/nextProcessor) và tính toán các cờ `can*` động để điều khiển nút action trên Object Page.

Đồng thời implement value help `AssignableDevelopers`.

### Flow hoạt động trong IDTS

Sau mỗi READ Bugs, các hàm enrich được gọi. `readAssignableDevelopers` cung cấp value help đã lọc theo componentCategory (và SAP Module nếu có).

### Các điểm neo quan trọng

- `enrichBugCapabilities`: tính cờ can* dựa trên trạng thái, actor và quyền.
- `readAssignableDevelopers`: value help phân công thông minh theo responsibility.

### Liên kết

Gọi từ service.js. Dựa constants. Cung cấp virtual field cho service.cds. Dùng bởi annotation value-helps và action.

### Checklist sửa an toàn

Thêm action hoặc thay đổi transition → cập nhật cả capability ở đây và annotation UI. Test visibility cho 3 vai trò trên browser thật.

## Metadata

- Source file: `srv/bug-service/read-models.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/read-models.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22