# Knowledge: `srv/user-admin/access-lifecycle.js`

## English

This module owns the Gate 3 local access lifecycle actions registered by `srv/user-admin.js`. It does not call SAP or the external provisioning provider.

`requestSuspend(req, dependencies)` reuses the existing PM + `UserAdmin` authorization boundary, validates a bounded reason and optimistic `expectedVersion`, then locks the target user/request rows in the same CAP transaction. It rejects an already inactive user and rechecks the final active-administrator invariant while holding the relevant locks. On success it sets `Users.active=false`, revokes active `AuthSessions`, changes the request to `SUSPENDED`, increments the request version, records `REQUEST_SUSPEND`, and returns only the sanitized onboarding result. Suspension creates no `UserAccessOperations` row and makes no provider write.

`requestReactivate(req, dependencies)` accepts only an inactive provisioned user with a `SUSPENDED` request. It locks and version-checks the request, creates one `REACTIVATE` operation using the current desired fixed role/capability snapshot, increments the request version, records `REQUEST_REACTIVATE`, and leaves the local user inactive. The broker must later prove provider readback before CAP activates the user. A stale version, missing request, invalid state, missing immutable link, or duplicate open operation fails safely.

The shared final-administrator guard is also used by role/capability removal and revoke. UI action visibility is only a convenience; direct CAP calls still pass through the authorization and concurrency checks.

## Tiếng Việt

Module này quản lý local access lifecycle của Gate 3 và được đăng ký từ `srv/user-admin.js`. Module không gọi SAP hoặc external provisioning provider.

`requestSuspend` dùng lại boundary PM + `UserAdmin`, kiểm tra reason có giới hạn và `expectedVersion`, rồi lock các row user/request trong cùng CAP transaction. Handler từ chối user đã inactive và kiểm tra lại invariant administrator cuối cùng trong lúc giữ lock. Khi thành công, handler đặt `Users.active=false`, revoke `AuthSessions` active, đổi request thành `SUSPENDED`, tăng version, ghi `REQUEST_SUSPEND`, và chỉ trả kết quả onboarding đã sanitize. Suspend không tạo `UserAccessOperations` và không ghi provider.

`requestReactivate` chỉ nhận user đã provisioned, đang inactive và request `SUSPENDED`. Handler lock/version-check request, tạo một operation `REACTIVATE` với snapshot role/capability cố định hiện tại, tăng version, ghi `REQUEST_REACTIVATE`, và giữ user local inactive. Broker phải chứng minh provider readback trước khi CAP activate user. Version cũ, request thiếu, state sai, immutable link thiếu hoặc operation mở trùng đều fail safely.

## Debug / Verification

Inspect the request version, request state, latest operation, active session count, and audit events together. A successful local suspend must have no new provider operation; a successful reactivation request must have exactly one `REACTIVATE` operation and must not make the user active. Focused coverage is in `scripts/qa/test-user-admin-access-lifecycle.js`.
