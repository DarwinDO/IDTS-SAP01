# Knowledge: `app/user-administration-ui/webapp/fragment/EditUserInformation.fragment.xml`

## English

This native SAPUI5 dialog lets an authorized User Administrator edit only an existing user's display name and provide a required audit reason. It binds transient state under `activeUsers>/editProfile`; it never exposes editable email, role, access, password, or identity-provider fields. `Main.controller.js` validates client input for usability and invokes `updateActiveUserDisplayName`, while `srv/user-admin/active-users.js` repeats validation and authorization server-side.

Important source anchors: the `displayName` input is capped at 120 characters; the reason is capped at 500; the emphasized Save button depends on `canSubmit`. Check the controller, `srv/user-admin.cds`, the Active Users handler, and all three i18n bundles together. If the backend action changes, the UI must still send `expectedModifiedAt` so stale dialogs cannot overwrite a newer profile.

## Tiếng Việt

Dialog SAPUI5 native này cho phép User Administrator hợp lệ chỉ sửa tên hiển thị của user hiện có và nhập lý do audit bắt buộc. Dialog bind state tạm ở `activeUsers>/editProfile`; không expose email, role, access, password hoặc field identity provider dưới dạng có thể sửa. `Main.controller.js` validate ở client để hỗ trợ UX và gọi `updateActiveUserDisplayName`, còn `srv/user-admin/active-users.js` lặp lại validation và authorization ở server.

Anchor quan trọng: input `displayName` giới hạn 120 ký tự; reason giới hạn 500; nút Save nhấn mạnh phụ thuộc `canSubmit`. Phải kiểm tra cùng controller, `srv/user-admin.cds`, handler Active Users và cả ba bundle i18n. Nếu backend action thay đổi, UI vẫn phải gửi `expectedModifiedAt` để dialog cũ không ghi đè hồ sơ mới hơn.
