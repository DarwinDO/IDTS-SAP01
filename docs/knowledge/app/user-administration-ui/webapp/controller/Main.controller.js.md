# Knowledge: `app/user-administration-ui/webapp/controller/Main.controller.js`

## English

The controller keeps the existing Active Users detail flow and adds a state-bound existing-identity link dialog. `onOpenExistingIdentityLink` trusts only the safe server `linkEligible` flag, passes the safe current `businessRole` into the read-only dialog, and never passes provider/identity internals. `onConfirmExistingIdentityLink` validates the email, lowercases the action payload, prevents double submit, sends exactly `userID` and `email`, reloads Requests and Active Users through the shared action helper, and reports only queued status.

## Tiếng Việt

Controller giữ flow details Active Users hiện có và thêm dialog link identity theo state. `onOpenExistingIdentityLink` chỉ tin Boolean `linkEligible` an toàn do server trả, truyền `businessRole` hiện tại an toàn vào dialog read-only và không truyền provider/identity internals. `onConfirmExistingIdentityLink` validate email, lowercase payload action, chặn double submit, chỉ gửi `userID` và `email`, reload Requests và Active Users qua action helper dùng chung, và chỉ báo trạng thái queued.
