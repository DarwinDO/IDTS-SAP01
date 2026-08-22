# Knowledge: `srv/bug-service/read-models.js`

## 2026-08-08 effective availability

English: `AssignableDevelopers` exposes the derived workload count and effective availability from the shared capacity helper. Vietnamese: `AssignableDevelopers` expose workload count và effective availability từ capacity helper dùng chung.

## IDTS-122 UI capability truth

Read models expose state-aware capabilities: Closed Bugs are not editable, cannot accept comments or ordinary assignment, and expose PM retest-owner reassignment as a separate capability. These fields guide Fiori affordances; direct OData protection still lives in backend guards.

## Beginner-first execution map (2026-07-18)

### English

This module has two flows. Assignable Developers: READ handler extracts CQN criteria, joins profile/user/responsibility/workload, picks the best responsibility per candidate, filters/searches/pages and exposes only public fields; assignment is still revalidated by `bug-write.js`. Bug enrichment: after READ, display helpers fill names/current action owner, while capability helpers calculate virtual `can*`/field-control values from actor, status and ownership. Before READ, `ensureCapabilitySelectDependencies` prevents narrow `$select` from hiding required keys. Debug value help at `readAssignableDevelopers`; debug missing labels/buttons at `enrichBugDisplayFields/enrichBugCapabilities`. These virtual fields alter response UX, not persisted Bug rows or backend authorization.

### Vietnamese

Module có hai flow. Assignable Developers: READ handler lấy criteria CQN, join profile/user/responsibility/workload, chọn responsibility phù hợp nhất cho từng candidate, filter/search/page và chỉ expose field public; `bug-write.js` vẫn validate lại lúc assign. Bug enrichment: sau READ, display helper điền tên/current action owner, còn capability helper tính virtual `can*`/field-control từ actor, status và ownership. Trước READ, `ensureCapabilitySelectDependencies` tránh `$select` hẹp làm thiếu key cần thiết. Debug value help tại `readAssignableDevelopers`; debug thiếu label/nút tại `enrichBugDisplayFields/enrichBugCapabilities`. Virtual field chỉ đổi response UX, không persist Bug hay thay backend authorization.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: Bug read -> display names/capabilities/value help. Break on Bug READ enrichment when Fiori sees UUIDs, stale labels, or the wrong action visibility. Check corresponding annotations and session role.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: Bug read -> display names/capabilities/value help. Đặt breakpoint tại Bug READ enrichment khi Fiori thấy UUID, label cũ hoặc visibility action sai. Kiểm tra annotation tương ứng và session role.

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
## IDTS-125 split capabilities (2026-08-05)

**English.** `applyBugCapabilities` independently derives comment, edit-shell, attachment and dynamic field-control values. Non-assignee Developers get comment-only; assignees get the edit shell plus attachment mutations while required/optional Bug fields stay read-only; coordinators receive normal mandatory/optional controls.

**Tiếng Việt.** `applyBugCapabilities` tính riêng capability comment, edit shell, attachment và dynamic field control. Developer không phải assignee chỉ có comment; assignee có edit shell và attachment mutation nhưng field Bug bắt buộc/tùy chọn vẫn read-only; coordinator nhận control mandatory/optional bình thường.
## Gate 3B Smart Assign identity filtering / Loc identity Smart Assign Gate 3B

`buildAssignableDeveloperRows` resolves each Developer Profile to its internal User, applies the shared exact active-identity predicate, and filters unlinked Developers before public candidate rows are returned. The internal User ID is removed from the public row; only safe candidate/profile/capacity fields remain. Existing Bug assignee rows are not rewritten by this read model.

`buildAssignableDeveloperRows` map moi Developer Profile toi User noi bo, ap dung predicate active-identity exact va loc Developer chua link truoc khi tra candidate public. User ID noi bo bi loai khoi public row; chi giu field candidate/profile/capacity an toan. Read model khong viet lai assignee cua Bug hien co.
