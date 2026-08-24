# Knowledge: `OperationDetails.fragment.xml`

## English / Tiếng Việt

The Gate 6 provisioning dialog shows safe operation type/state, safe actor and target display, bounded result summary, and attempt count. Labels after the first field use the native `sapUiSmallMarginTop` spacing pattern from `ActiveUserDetails`; no custom CSS is needed. Retry and reconcile buttons are not invented here; the list controller reuses the existing server-authorized access-operation actions and eligibility flags.

Dialog provisioning Gate 6 hiện operation type/state an toàn, actor và target display an toàn, result summary bounded và số lần thử. Các label sau field đầu dùng spacing native `sapUiSmallMarginTop` theo pattern `ActiveUserDetails`, không cần CSS custom. Dialog không tự tạo retry/reconcile; controller list dùng lại action access operation hiện có và flag eligibility do server trả.

**Source anchor:** `OperationDetails.fragment.xml:1-23`; verify with `srv/user-admin/operations-audit.js` and the existing Retry/Reconcile guards.

**Safe editing:** Do not bind provider IDs, raw errors, identity hashes, leases, locks, idempotency keys, tokens, or credentials. Ambiguous outcome remains reconcile-only; permanent failure remains actionless.

**Sửa an toàn:** Không bind provider ID, raw error, identity hash, lease, lock, idempotency key, token hoặc credential. Outcome ambiguous chỉ reconcile; permanent failure không có action.
