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

## Gate 6.5 local suspend completion / Completion suspend local Gate 6.5

### English

`requestSuspend` normalizes one request timestamp, applies local deactivation/session revocation, persists the original `REQUEST_SUSPEND/QUEUED` audit and a final `SUSPEND/APPLIED` audit in chronological order, then creates the access delivery from that final audit in the same transaction. Only a `PENDING` row registers the existing post-commit kick. Reactivation remains queued and sends nothing until broker readback finishes with `APPLIED`.

- **Location**: `srv/user-admin/access-lifecycle.js:19-80` — local suspend timestamp, audits, delivery, and kick.
  **IDTS concept**: local suspend is already final locally, while reactivation is not final until provider proof.
  **Impact if broken**: users can receive premature reactivation mail, miss a completed suspend notice, or see inverted audit timestamps.
  **Must check together**: `srv/user-admin.js:935-969`, `srv/user-admin/access-delivery.js:63-107`, and lifecycle chronology tests.

### Tiếng Việt

`requestSuspend` normalize một request timestamp, apply deactivation local/revoke session, persist audit gốc `REQUEST_SUSPEND/QUEUED` và audit cuối `SUSPEND/APPLIED` theo đúng thứ tự thời gian, rồi tạo access delivery từ audit cuối trong cùng transaction. Chỉ row `PENDING` mới đăng ký post-commit kick hiện có. Reactivation vẫn queued và không gửi gì cho tới khi broker readback hoàn tất với `APPLIED`.

- **Vị trí**: `srv/user-admin/access-lifecycle.js:19-80` — timestamp, audit, delivery và kick của suspend local.
  **Khái niệm IDTS**: suspend local đã final tại local, còn reactivate chỉ final sau provider proof.
  **Ảnh hưởng nếu sai**: user có thể nhận email reactivate sớm, mất thông báo suspend đã hoàn tất hoặc thấy timestamp audit đảo thứ tự.
  **Phải kiểm tra cùng**: `srv/user-admin.js:935-969`, `srv/user-admin/access-delivery.js:63-107` và test chronology lifecycle.

**Safe editing / Sửa an toàn:** Preserve lock/version/final-admin/session-revocation guards and the one transaction. Do not send directly here. / Giữ guard lock/version/final-admin/revoke-session và một transaction. Không gửi trực tiếp tại đây.
