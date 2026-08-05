# Knowledge: `app/bug-management-ui/annotations/capabilities.cds`

## IDTS-122 update

The standard Edit/create affordances now follow current role and status rules: only Tester receives Create Bug, and a Closed Bug is not editable. Comment, attachment, assignment, and AI affordances also consume state-aware capabilities. Reopen and PM retest-owner reassignment remain the explicit exceptions.

> **Ownership / debug anchor:** SangVN owns this Fiori affordance metadata (backup: DatDT). If an action is hidden or visible unexpectedly, check this file and then confirm the backend has the same authorization rule.
> **Ownership / điểm debug:** SangVN sở hữu metadata affordance Fiori này (backup: DatDT). Nếu action ẩn/hiện sai, kiểm file này rồi xác nhận backend có cùng rule quyền.

## English

### What this file is for

Fiori annotation module that uses the backend-computed `can*` virtual fields to dynamically hide or show action buttons on the Object Page.

### IDTS flow

Every lifecycle action (Mark In Review, Resolve, Reject, Close, Assign, etc.) is annotated with `@UI.Hidden` expressions based on `canMarkInReview`, `canResolve`, `canReject`, etc.

This ensures that:
- A Developer only sees actions they are allowed to perform on their assigned bugs.
- Coordinators (Tester/PM) see broader actions.
- Context-aware visibility (e.g. cannot resolve without being in the right status).

### Important source anchors

- Multiple `@UI.Hidden : {$edmJson : {$Not : {$Path : 'canXXX' } } }` on DataFieldForAction.
  **IDTS concept**: Directly implements role + state based action control for the bug lifecycle.
  **Impact if broken**: Users see buttons they cannot use (or miss legitimate ones), breaking UX and potentially security expectations.

### Cross-folder

- `srv/service.cds` (declares the virtual can* fields)
- `srv/bug-service/read-models.js` (computes the values)
- `permissions.js` and `constants.js` (the rules behind the flags)
- `actions.cds` (defines the actual buttons)

## Vietnamese

### File này dùng để làm gì

Annotation dùng các virtual `can*` từ backend để ẩn/hiện nút action động trên Object Page.

### Flow IDTS

Mỗi action lifecycle được gắn `@UI.Hidden` dựa trên canXXX tương ứng.

Đảm bảo Developer chỉ thấy action hợp lệ, Coordinator thấy rộng hơn.

### Các điểm neo quan trọng

Các annotation `@UI.Hidden` theo canXXX.

### Liên kết

service.cds, read-models, permissions, actions.cds.

## IDTS-43 update - hide the standard Create action

### English

IDTS-43 adds `UI.CreateHidden : true`.

This is not a backend permission rule. It is a Fiori UI rule that hides the generated standard Create button. IDTS now uses a custom List Report action named `Create Bug`, because create visibility depends on the logged-in role from the custom login session. Tester and PM can see the custom action; Developer should not see it.

The backend remains the security boundary. Even if a user manipulates browser storage or calls OData directly, `srv/bug-service/permissions.js` and `srv/service.js` must still reject unauthorized create/draft-create attempts.

Important anchor:

- Location: `UI.CreateHidden : true`
  - IDTS concept: Create Bug is role-aware. It is allowed for Tester/PM and hidden from Developer.
  - Impact if broken: The standard Create button can appear to Developer users, causing a confusing UI/backend mismatch.
  - Must check together: `app/bug-management-ui/webapp/manifest.json` custom `CreateBug` action, `app/bug-management-ui/webapp/ext/actions/BugListActions.js`, `srv/service.js` `NEW` draft guard, and `srv/bug-service/permissions.js`.

### Vietnamese

IDTS-43 thêm `UI.CreateHidden : true`.

Đây không phải rule phân quyền backend. Đây là rule UI của Fiori để ẩn nút Create chuẩn do framework tự sinh. IDTS hiện dùng một custom action ở List Report tên là `Create Bug`, vì việc nút tạo bug có hiện hay không phụ thuộc vào role của user trong custom login session. Tester và PM được thấy custom action; Developer không nên thấy.

Backend vẫn là lớp bảo vệ thật. Kể cả khi user sửa browser storage hoặc gọi OData trực tiếp, `srv/bug-service/permissions.js` và `srv/service.js` vẫn phải chặn create/draft-create không hợp lệ.

Điểm neo quan trọng:

- Vị trí: `UI.CreateHidden : true`
  - Khái niệm IDTS: Create Bug phải theo role. Tester/PM được tạo, Developer bị ẩn.
  - Ảnh hưởng nếu sai: Nút Create chuẩn có thể hiện cho Developer, làm UI và backend lệch nhau.
  - Phải kiểm tra cùng: custom action `CreateBug` trong `app/bug-management-ui/webapp/manifest.json`, `app/bug-management-ui/webapp/ext/actions/BugListActions.js`, draft guard `NEW` trong `srv/service.js`, và `srv/bug-service/permissions.js`.

## Metadata

- Source file: `app/bug-management-ui/annotations/capabilities.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/capabilities.cds.md`
- Source layer: `app`
- Last reviewed: 2026-07-01

## Execution map / Sơ đồ thực thi (2026-07-18)

**English.** Compilation publishes insert/update/delete restrictions to Fiori. Standard Create is hidden so the manifest action calls `BugListActions.createBug()` and Fiori EditFlow. These flags improve UX only; direct OData/draft requests still reach backend authorization. If Developer sees Create, inspect metadata and custom action visibility; if a direct request succeeds incorrectly, debug CAP permissions instead.

**Tiếng Việt.** Khi compile, restriction insert/update/delete được đưa vào metadata Fiori. Standard Create bị ẩn để action trong manifest gọi `BugListActions.createBug()` và Fiori EditFlow. Các cờ chỉ cải thiện UX; request OData/draft trực tiếp vẫn phải qua authorization backend. Developer thấy Create thì kiểm metadata/visibility; direct request sai mà vẫn thành công thì debug CAP permission.
