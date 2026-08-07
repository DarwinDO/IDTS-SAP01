# Knowledge: `srv/bug-service/constants.js`

## IDTS-122 lifecycle meaning

`CLOSED` remains terminal for all ordinary transition/action paths. Reopen is the explicit lifecycle exception; PM retest-owner reassignment is an ownership action that keeps status Closed and does not alter Developer assignee.

## IDTS-89 action constants

`ACTION` contains both legacy audit categories and 11 exact workflow-command codes. Do not remove `ASSIGN`, `REASSIGN`, `STATUS_CHANGE`, or the other legacy values because stored history and generic direct edits may still reference them. `DEVELOPER_ACTIONS` contains only the exact commands an assigned Developer may execute; assignment, pending-queue, resubmit, retest, close, and reopen remain coordinator-only.

## Beginner-first constant map (2026-07-18)

### English

This file is shared vocabulary, not execution code. `STATUS/USER_ROLE/PROCESSOR_ROLE/ACTION` are stored/runtime codes. `ALLOWED_TRANSITIONS` is the lifecycle state machine. Coordinator/comment/attachment/developer Sets are authorization allow-lists. `DEVELOPER_STATUSES/TESTER_STATUSES` route the next action owner. `CAPABILITY_FIELDS/FIELD_CONTROL` support Fiori action/field UX, while `READ_ONLY_ENTITY_NAMES` feeds guards. Follow a code from this file to its seed catalog in `db/data`, association in `schema.cds`, rule in `permissions/bug-write/actions`, and label/action in Fiori. A code rename is a coordinated migration, not a local text edit.

### Vietnamese

File này là từ vựng dùng chung, không phải code thực thi. `STATUS/USER_ROLE/PROCESSOR_ROLE/ACTION` là code lưu/runtime. `ALLOWED_TRANSITIONS` là state machine lifecycle. Các Set coordinator/comment/attachment/developer là allow-list quyền. `DEVELOPER_STATUSES/TESTER_STATUSES` định tuyến người cần hành động tiếp. `CAPABILITY_FIELDS/FIELD_CONTROL` phục vụ UX action/field Fiori, còn `READ_ONLY_ENTITY_NAMES` cấp danh sách cho guards. Hãy lần một code từ file này sang catalog seed trong `db/data`, association trong `schema.cds`, rule trong `permissions/bug-write/actions`, rồi label/action Fiori. Đổi code là migration phối hợp nhiều lớp, không phải sửa text cục bộ.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: all workflow/business codes. Use this file when a status/action/role branch does not match seed data. A code rename must be reviewed with schema, CSV seed, service action, validation, and Fiori labels.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: mọi workflow/business code. Dùng file này khi branch status/action/role không khớp seed data. Đổi code phải review cùng schema, CSV seed, service action, validation và Fiori label.

## English

### What this file is for

Central definition of all IDTS status values, roles, allowed transitions, action types, and capability flags used by the BugService.

This file is the single source of truth for the business rules that control:
- Which statuses exist and which transitions are legal.
- Which roles (Tester, Developer, PM) are allowed to perform which actions.
- Which virtual capability fields (`canResolve`, `canReject`...) the UI uses to show or hide buttons.
- Labels used when writing human-readable history.

### Beginner explanation

In IDTS the lifecycle of a bug is very strict. You cannot go from "Resolved" directly to "Closed" without going through "Retest Required", a Developer cannot reject a bug without providing a reason, only the assigned Developer (or Tester/PM) can change certain statuses, etc.

Instead of hard-coding strings like `'ASSIGNED'` everywhere in the code (which is error-prone), we define them once here as constants. Every other handler (`bug-write.js`, `actions.js`, `permissions.js`, read-models, etc.) imports from this file.

This makes the status machine, role-based permissions, and UI button visibility consistent and easy to change in one place.

### IDTS flow

- When a bug is created or its status is changed, `prepareBugWrite` and `validateTransition` use `ALLOWED_TRANSITIONS` and the various `*STATUSES` sets to decide if the change is legal.
- `enforceActionPermission` and `enforceBugWritePermission` use `COORDINATOR_ROLES`, `DEVELOPER_ACTIONS`, `DEVELOPER_DIRECT_STATUSES`, `TESTER_STATUSES` to decide who is allowed to do what.
- The `CAPABILITY_FIELDS` set is used to compute the `can*` virtual fields that Fiori annotations rely on to hide/show action buttons.
- `HISTORY_FIELD_LABELS` is used when building readable history summaries for the Object Page.
- `READ_ONLY_ENTITY_NAMES` tells the guards which entities must never be written through the main service.

Changing anything here immediately affects create flow, assignment, developer review, rejection follow-up, PM monitoring, and UI button visibility.

### Important source anchors

- **Location**: `srv/bug-service/constants.js:1-12`
  `const STATUS = { NEW, PENDING_ASSIGNMENT, ASSIGNED, ..., CLOSED }`
  **IDTS concept**: The complete list of statuses in the bug lifecycle. `REJECTED` is intentionally not a final state (see ALLOWED_TRANSITIONS).
  **Impact if broken**: Invalid statuses appear in the database or UI, transition validation fails, history and monitoring queries break.
  **Must check together**: `srv/service.cds` (virtual status flags), `db/data/idts.cap-StatusValues.csv`, `bug-write.js` (validateTransition), Fiori status value help and criticality annotations.

- **Location**: `srv/bug-service/constants.js:96-121`
  `const ALLOWED_TRANSITIONS = { ... }`
  **IDTS concept**: The state machine for bug status. Defines exactly which statuses can legally move to which other statuses (core business rule for the whole system).
  **Impact if broken**: Bugs can jump to illegal states (e.g. Resolved → Closed without Retest), or valid transitions are blocked for users.
  **Must check together**: `bug-write.js:validateTransition`, `actions.js:transitionBug`, `srv/service.cds` actions that pass target status, any test that asserts status flows.

- **Location**: `srv/bug-service/constants.js:123-136`
  `DEVELOPER_STATUSES`, `TESTER_STATUSES`, `COORDINATOR_ROLES`
  **IDTS concept**: Role-based permission groups. Defines which statuses a Developer is allowed to set directly, and which roles (Tester + PM) are "coordinators" that have broader rights (create, assign, resubmit after rejection).
  **Impact if broken**: Wrong people can change status, or the assigned Developer is blocked from legitimate work.
  **Must check together**: `permissions.js` (enforce*Permission functions), `actions.js` (resubmitToDeveloper, etc.).

- **Location**: `srv/bug-service/constants.js:137-151`
  `CAPABILITY_FIELDS` + `FIELD_CONTROL`
  **IDTS concept**: The list of virtual boolean fields (`canResolve`, `canReject`...) that drive dynamic button visibility on the Fiori Object Page.
  **Impact if broken**: All action buttons may be shown to the wrong roles, or useful buttons disappear.
  **Must check together**: `read-models.js` (enrichBugCapabilities), `srv/service.cds` (virtual can* declarations), `app/.../annotations/capabilities.cds` and `actions.cds`.

### Cross-folder dependency map

- **Constants → every handler in `srv/bug-service/`**: Almost every file imports STATUS, ACTION, ALLOWED_TRANSITIONS, COORDINATOR_ROLES etc. Changing a constant usually requires checking permissions, actions, bug-write, and read-models.
- **Constants → `srv/service.cds`**: The virtual capability fields and action parameters are exposed to Fiori based on the concepts defined here.
- **Constants → `db/schema.cds` + seed data**: The `StatusValues`, `UserRoles`, `ProcessorRoleValues` seed data and entity definitions must stay in sync with the codes here.
- **Constants → Fiori annotations + tests**: Button visibility, value helps for status, and OPA tests all depend on the exact status codes and capability names defined here.

### Safe editing checklist

- Never invent a new status code without also updating ALLOWED_TRANSITIONS, the relevant *STATUSES sets, seed data, service.cds virtuals, history labels, and Fiori annotations.
- When tightening or relaxing a transition, also update or add tests and the corresponding action in actions.js.
- After changes, run the backend status transition tests and at least one full happy-flow browser check.
- Update this mirror and any other mirror that mentions the changed constant.

## Vietnamese

### File này dùng để làm gì

File định nghĩa tập trung tất cả giá trị trạng thái, vai trò, transition được phép, loại action và cờ khả năng dùng trong BugService cho IDTS.

Đây là nguồn sự thật duy nhất cho các quy tắc nghiệp vụ kiểm soát:
- Trạng thái nào tồn tại và chuyển đổi nào là hợp lệ.
- Vai trò nào (Tester, Developer, PM) được làm hành động nào.
- Các virtual field khả năng (`canResolve`, `canReject`...) mà UI dùng để hiện/ẩn nút.
- Nhãn dùng khi ghi lịch sử dễ đọc.

### Giải thích cho người mới

Vòng đời bug trong IDTS rất nghiêm ngặt. Không thể từ "Resolved" nhảy thẳng sang "Closed" mà phải qua "Retest Required", Developer không được reject mà không có lý do, chỉ Developer được assign (hoặc Tester/PM) mới được đổi một số trạng thái nhất định, v.v.

Thay vì viết chuỗi cứng `'ASSIGNED'` lung tung trong code (dễ sai), ta định nghĩa một lần ở đây. Mọi handler khác đều import từ file này.

Nhờ đó máy trạng thái, phân quyền theo vai trò và việc hiện nút trên UI luôn nhất quán và dễ thay đổi ở một chỗ.

### Flow hoạt động trong IDTS

- Khi tạo bug hoặc đổi trạng thái, `prepareBugWrite` và `validateTransition` dùng `ALLOWED_TRANSITIONS` và các set `*STATUSES` để quyết định thay đổi có hợp lệ không.
- `enforceActionPermission` và `enforceBugWritePermission` dùng `COORDINATOR_ROLES`, `DEVELOPER_*`, `TESTER_STATUSES` để quyết định ai được làm gì.
- `CAPABILITY_FIELDS` được dùng để tính các virtual `can*` mà annotation Fiori dựa vào để ẩn/hiện nút action.
- `HISTORY_FIELD_LABELS` dùng khi xây dựng lịch sử dễ đọc cho Object Page.
- `READ_ONLY_ENTITY_NAMES` báo cho guard biết entity nào chỉ được đọc.

Mọi thay đổi ở đây đều ảnh hưởng ngay đến luồng tạo, phân công, review của developer, follow-up reject, theo dõi PM và hiển thị nút UI.

### Các điểm neo quan trọng trong source

- **Vị trí**: `srv/bug-service/constants.js:1-12`
  `const STATUS = { ... }`
  **Khái niệm IDTS**: Danh sách đầy đủ trạng thái vòng đời bug. `REJECTED` cố tình không phải trạng thái cuối (xem ALLOWED_TRANSITIONS).
  **Ảnh hưởng nếu sai**: Trạng thái không hợp lệ xuất hiện trong DB hoặc UI, kiểm tra transition thất bại, truy vấn history và monitoring hỏng.
  **Phải kiểm tra cùng**: `srv/service.cds`, seed StatusValues, bug-write.js, annotation trạng thái.

- **Vị trí**: `srv/bug-service/constants.js:96-121`
  `const ALLOWED_TRANSITIONS = { ... }`
  **Khái niệm IDTS**: Máy trạng thái của bug. Quy định chính xác trạng thái nào được chuyển sang trạng thái nào (quy tắc nghiệp vụ cốt lõi).
  **Ảnh hưởng nếu sai**: Bug nhảy sang trạng thái sai quy tắc hoặc transition hợp lệ bị chặn.
  **Phải kiểm tra cùng**: validateTransition, transitionBug, service.cds, test flow.

- **Vị trí**: Các set vai trò và trạng thái cho Developer/Tester
  **Khái niệm IDTS**: Nhóm phân quyền theo vai trò. Xác định Developer được set trực tiếp trạng thái nào, ai là coordinator (Tester + PM) có quyền rộng hơn.
  **Ảnh hưởng nếu sai**: Sai người đổi trạng thái hoặc Developer bị chặn làm việc hợp lệ.
  **Phải kiểm tra cùng**: permissions.js, actions.js.

- **Vị trí**: `CAPABILITY_FIELDS`
  **Khái niệm IDTS**: Danh sách các virtual boolean dùng để điều khiển nút trên Fiori Object Page.
  **Ảnh hưởng nếu sai**: Nút hiện sai vai trò hoặc biến mất.
  **Phải kiểm tra cùng**: read-models (enrichBugCapabilities), service.cds, annotations/capabilities + actions.

### Liên kết với file/folder khác

- Constants → hầu hết handler trong `srv/bug-service/`: gần như mọi file import STATUS, ACTION, ALLOWED_TRANSITIONS...
- Constants → `srv/service.cds`: các virtual capability và action được expose dựa trên khái niệm ở đây.
- Constants → `db/schema.cds` + seed: dữ liệu seed StatusValues, UserRoles... phải khớp code ở đây.
- Constants → Fiori annotations + test: việc ẩn/hiện nút, value help trạng thái, OPA test đều phụ thuộc vào code và tên được định nghĩa ở đây.

### Checklist sửa an toàn

- Không tự bịa status code mới mà không cập nhật ALLOWED_TRANSITIONS, các set *STATUSES, seed data, virtual trong service.cds, nhãn history và annotation Fiori.
- Khi siết hoặc nới transition thì phải cập nhật test và action tương ứng.
- Sau khi sửa chạy test chuyển trạng thái backend và ít nhất một happy flow browser.
- Cập nhật mirror của file này và các mirror liên quan.

## Metadata

- Source file: `srv/bug-service/constants.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/constants.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: 207
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## IDTS History Wording Update

### English

The history label constants for the runtime owner fields now use the same user-facing language as the Object Page ownership section:

- `nextProcessorUser` is displayed as `Current Action Owner`.
- `nextProcessorRole` is displayed as `Action Owner Role`.

This matters because history records are not only audit data. They are also read by the Fiori History section. If these labels stay as `Next Processor User` and `Next Processor Role`, the UI teaches the old internal implementation wording instead of the clearer business wording.

- **Location**: `srv/bug-service/constants.js:64-65`
  **IDTS concept**: `nextProcessor*` is the backend storage name, but the business meaning is “who must act now”.
  **Impact if broken**: New history rows continue to show old wording in the timeline summary and expanded field-change table.
  **Must check together**: `srv/bug-service/history-read-models.js`, `srv/bug-service/history.js`, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, ownership labels in Fiori annotations.

### Vietnamese

Các label history cho nhóm field người/vai trò đang xử lý hiện dùng cùng ngôn ngữ hiển thị với phần ownership trên Object Page:

- `nextProcessorUser` được hiển thị là `Current Action Owner`.
- `nextProcessorRole` được hiển thị là `Action Owner Role`.

Điểm quan trọng là history không chỉ là dữ liệu audit nội bộ. Fiori History section cũng đọc trực tiếp các label này để hiển thị cho người dùng. Nếu vẫn giữ `Next Processor User` và `Next Processor Role`, UI sẽ tiếp tục dạy người dùng thuật ngữ kỹ thuật cũ thay vì thuật ngữ nghiệp vụ dễ hiểu hơn.

- **Vị trí**: `srv/bug-service/constants.js:64-65`
  **Khái niệm IDTS**: `nextProcessor*` là tên lưu trữ nội bộ ở backend, còn ý nghĩa nghiệp vụ là “người hoặc vai trò cần xử lý hiện tại”.
  **Ảnh hưởng nếu sai**: Các history row mới vẫn hiển thị wording cũ trong timeline summary và bảng chi tiết khi mở rộng.
  **Phải kiểm tra cùng**: `srv/bug-service/history-read-models.js`, `srv/bug-service/history.js`, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, các annotation label ownership của Fiori.

## IDTS-36 Read-Only Guard Update

### English

`NotificationDeliveries` is included in `READ_ONLY_ENTITY_NAMES`. The email worker writes the persistence entity internally, but OData clients must not create, edit, retry, or delete delivery records.

- **Location**: `srv/bug-service/constants.js:186`
  `'NotificationDeliveries'`
  **IDTS concept**: Delivery state is system-managed operational evidence.
  **Impact if broken**: A client could forge `SENT`, erase failure evidence, or enqueue an email outside the approved notification flow.
  **Must check together**: `srv/bug-service/guards.js`, `srv/service.cds:108`, API write-denial test.

### Vietnamese

`NotificationDeliveries` được thêm vào `READ_ONLY_ENTITY_NAMES`. Email worker được phép ghi persistence entity ở backend, nhưng OData client không được tạo, sửa, retry hoặc xóa delivery record.

- **Vị trí**: `srv/bug-service/constants.js:186`
  `'NotificationDeliveries'`
  **Khái niệm IDTS**: Delivery status là operational evidence do hệ thống quản lý.
  **Ảnh hưởng nếu sai**: Client có thể giả `SENT`, xóa bằng chứng lỗi hoặc enqueue email ngoài notification flow đã duyệt.
  **Phải kiểm tra cùng**: `srv/bug-service/guards.js`, `srv/service.cds:108`, API write-denial test.
## IDTS-125 capability constants (2026-08-05)

**English.** Capability dependencies now include `canManageAttachments` and two Bug field-control values. SAP Common.FieldControl numeric values are ReadOnly=1, Optional=3 and Mandatory=7.

**Tiếng Việt.** Dependency capability thêm `canManageAttachments` và hai giá trị field-control của Bug. Giá trị số SAP Common.FieldControl là ReadOnly=1, Optional=3 và Mandatory=7.
