# Knowledge: `ActiveUserDetails.fragment.xml`

## 2026-09-03 profile action / Action hồ sơ 2026-09-03

Active User details exposes `Edit user information` as a separate profile action. It does not reuse Change Role, identity link, or Developer Responsibility actions and cannot edit email. The dialog is loaded by `Main.controller.js`, while CAP remains the authorization authority.

Active User details hiển thị `Chỉnh sửa thông tin người dùng` như một action hồ sơ riêng. Action không dùng chung Change Role, identity link hoặc Developer Responsibility và không thể sửa email. `Main.controller.js` mở dialog, còn CAP vẫn quyết định phân quyền.

## English

The details action row uses a native wrapping `HBox`, so lifecycle buttons move to another line instead of being clipped in a narrow dialog. It exposes `Link existing identity` only when `activeUsers>/details/linkEligible` is true. Existing lifecycle buttons remain separate. No provider, Role Collection, JWT, platform ID, or identity tuple is rendered.

## Tiếng Việt

Hàng action trong details dùng `HBox` native có wrap, nên các nút lifecycle sẽ xuống dòng thay vì bị cắt khi dialog hẹp. Hàng này chỉ hiện `Link existing identity` khi `activeUsers>/details/linkEligible` là true. Các nút lifecycle hiện có vẫn tách biệt. UI không render provider, Role Collection, JWT, platform ID hoặc identity tuple.
## Gate 6.2 lifecycle ownership / Ownership lifecycle Gate 6.2

Active User details is the lifecycle action owner. It keeps Change Role, Suspend, Reactivate and Revoke under their existing state guards. Manage Responsibilities remains only on the Developer Responsibilities table, avoiding a duplicate action inside the details dialog. Request rows no longer duplicate lifecycle actions.

Active User details là nơi sở hữu action lifecycle. Dialog giữ Change Role, Suspend, Reactivate và Revoke theo guard state hiện có. Manage Responsibilities chỉ còn ở bảng Developer Responsibilities để tránh action trùng trong dialog details. Dòng request không còn lặp action lifecycle.
