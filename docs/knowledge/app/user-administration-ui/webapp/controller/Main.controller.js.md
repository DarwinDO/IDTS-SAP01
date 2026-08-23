# Knowledge: `app/user-administration-ui/webapp/controller/Main.controller.js`

## English

The controller keeps the existing Active Users detail flow and adds a state-bound existing-identity link dialog. `onOpenExistingIdentityLink` trusts only the safe server `linkEligible` flag, passes the safe current `businessRole` into the read-only dialog, and never passes provider/identity internals. `onConfirmExistingIdentityLink` validates the email, lowercases the action payload, prevents double submit, sends exactly `userID` and `email`, reloads Requests and Active Users through the shared action helper, and reports only queued status.

## Tiếng Việt

Controller giữ flow details Active Users hiện có và thêm dialog link identity theo state. `onOpenExistingIdentityLink` chỉ tin Boolean `linkEligible` an toàn do server trả, truyền `businessRole` hiện tại an toàn vào dialog read-only và không truyền provider/identity internals. `onConfirmExistingIdentityLink` validate email, lowercase payload action, chặn double submit, chỉ gửi `userID` và `email`, reload Requests và Active Users qua action helper dùng chung, và chỉ báo trạng thái queued.

## Gate 4 Developer responsibility administration

`onConfirmDeveloperProfile` requires a reason and one explicit confirmation before calling the existing optimistic `updateDeveloperProfile` action. A synchronous controller guard and the `developer>/submitting` state prevent double submit across the asynchronous confirmation/action boundary. Success reloads Access Requests and Active Users so readiness and impact counts do not stay stale; CAP remains authoritative for validation, version conflicts, persistence and assignment eligibility.

`onConfirmDeveloperProfile` yêu cầu reason và một confirmation rõ ràng trước khi gọi action optimistic `updateDeveloperProfile` hiện có. Guard đồng bộ ở controller cùng state `developer>/submitting` chặn double submit xuyên qua boundary confirm/action bất đồng bộ. Khi thành công, UI reload Access Requests và Active Users để readiness/impact count không bị cũ; CAP vẫn là nguồn chính cho validation, version conflict, persistence và assignment eligibility.
