# Debug Lab: Notifications and Email Outbox

## English

### Goal and mental model

The bug transaction records that an email should be sent; a separate worker sends it later. Therefore a provider outage changes delivery status but does not undo assignment, comment, or lifecycle work.

### Step 1 — Use a safe local configuration

Use email disabled mode or a local SMTP test server. Do not edit Render/Brevo secrets. Place breakpoints at:

1. a lifecycle function in `srv/bug-service/actions.js`, such as `transitionBug`;
2. `srv/email/outbox.js:writeNotificationRecord`;
3. `srv/email/worker.js:startEmailWorker` and its `cds.spawn` callback;
4. `srv/email/outbox.js:processEmailDeliveries`;
5. `srv/email/sender.js:createEmailSender` and the selected sender function.

### Step 2 — Record notification intent

Perform one Bug action. In `transitionBug`, inspect the Bug update and actor. History/notification helpers call `writeNotificationRecord(cds.tx(req), ...)` with the same CAP request transaction. Inspect notification ID, Bug ID, recipient decision, channel, template key, and config status. The database side effects are an in-app `Notifications` row and at most one EMAIL `NotificationDeliveries` row.

If email is disabled, recipient is missing/inactive, or configuration is incomplete, the delivery becomes `SKIPPED`. The Bug/history transaction still commits.

### Step 3 — Worker processes committed rows

`srv/service.js:init` calls `startEmailWorker()` after CAP initialization. `cds.spawn` starts independent transactions on a polling interval. At `processEmailDeliveries`, inspect selected `PENDING`/retryable `FAILED` rows, lock token, `attemptCount`, and `nextAttemptAt`. The sender boundary chooses SMTP or Brevo API from private config.

Success updates the same row to `SENT` with `sentAt` and provider message ID. Failure stores a sanitized summary, `FAILED`, retry timing, and incremented attempt count. It must never throw back into the already-finished Bug request.

### Failure exercise

Use a controlled local sender failure. Confirm: Bug status/history committed; delivery is `FAILED`; no secret/host/raw provider payload appears in UI or evidence; restoring the test sender lets a retry reach `SENT` without creating a duplicate delivery.

### Teach-back

Explain the transaction boundary, why `cds.spawn` is separate, and what PostgreSQL stores before and after a successful send.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

Transaction của Bug chỉ ghi nhận rằng cần gửi email; worker riêng gửi sau. Vì vậy provider bị lỗi chỉ làm đổi delivery status, không được hoàn tác assignment, comment hoặc lifecycle đã xong.

### Bước 1 — Dùng cấu hình local an toàn

Dùng email disabled hoặc local SMTP test server. Không sửa secret Render/Brevo. Đặt breakpoint:

1. một lifecycle function trong `srv/bug-service/actions.js`, ví dụ `transitionBug`;
2. `srv/email/outbox.js:writeNotificationRecord`;
3. `srv/email/worker.js:startEmailWorker` và callback `cds.spawn`;
4. `srv/email/outbox.js:processEmailDeliveries`;
5. `srv/email/sender.js:createEmailSender` và sender function được chọn.

### Bước 2 — Ghi ý định notification

Thực hiện một Bug action. Trong `transitionBug`, xem Bug update và actor. Helper history/notification gọi `writeNotificationRecord(cds.tx(req), ...)` bằng cùng CAP request transaction. Xem notification ID, Bug ID, recipient decision, channel, template key và trạng thái config. Side effect database là một row `Notifications` trong app và tối đa một row EMAIL `NotificationDeliveries`.

Nếu email tắt, recipient thiếu/inactive hoặc config chưa đủ thì delivery thành `SKIPPED`. Transaction Bug/history vẫn commit.

### Bước 3 — Worker xử lý row đã commit

`srv/service.js:init` gọi `startEmailWorker()` sau khi CAP init. `cds.spawn` mở transaction riêng theo poll interval. Tại `processEmailDeliveries`, xem row `PENDING`/`FAILED` còn retry, lock token, `attemptCount`, `nextAttemptAt`. Sender boundary chọn SMTP hoặc Brevo API từ private config.

Thành công update chính row đó thành `SENT`, có `sentAt` và provider message ID. Thất bại ghi summary đã sanitize, `FAILED`, lịch retry và tăng attempt count. Lỗi không được throw ngược vào Bug request đã hoàn tất.

### Bài lỗi

Dùng sender local cố ý fail. Xác nhận: Bug status/history vẫn commit; delivery là `FAILED`; UI/evidence không lộ secret/host/raw provider payload; khôi phục sender test thì retry thành `SENT` mà không tạo delivery trùng.

### Teach-back

Giải thích transaction boundary, vì sao `cds.spawn` chạy riêng và PostgreSQL lưu gì trước/sau khi gửi thành công.
