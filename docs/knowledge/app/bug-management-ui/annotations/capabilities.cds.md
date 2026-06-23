# Knowledge: `app/bug-management-ui/annotations/capabilities.cds`

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

## Metadata

- Source file: `app/bug-management-ui/annotations/capabilities.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/capabilities.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-22