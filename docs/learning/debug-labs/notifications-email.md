# Debug Lab: Notifications and Email Outbox

## English

### Goal

Understand why a bug action must commit even if email delivery is unavailable. IDTS writes notification intent in the request transaction, then an independent worker delivers email later.

### Safe setup and breakpoints

Use local configuration with email disabled or a local test SMTP server. Do not change Render/Brevo credentials for this lab. Set breakpoints in a lifecycle action in `srv/bug-service/actions.js`, notification creation in `srv/bug-service/notifications.js`, `srv/email/outbox.js:processEmailDeliveries`, and `srv/email/worker.js:startEmailWorker`.

### Expected execution order

1. A bug action validates and updates Bug state inside its CAP transaction.
2. The same transaction writes `Notifications` and one `NotificationDeliveries` row for channel EMAIL.
3. If email is disabled, missing, inactive, or no recipient exists, delivery is marked `SKIPPED`; the Bug change still commits.
4. If configuration is ready, the worker started by `startEmailWorker` uses `cds.spawn` on its own schedule, claims pending rows, and calls the configured sender.
5. A success writes `SENT`, `sentAt`, attempt count, and provider message ID. A failure records a sanitized `FAILED` state and retry timing; it never rolls back the already-completed workflow.

### Inspect and failure exercise

Inspect Notification ID, delivery status, `attemptCount`, `nextAttemptAt`, and sanitized error summary. Simulate a sender failure locally. Verify the bug status/history is still committed, then verify the delivery moves through retry rather than duplicating a sent row.

### Teach-back

Explain why the email worker cannot run inside `assignToDeveloper`'s transaction and why raw SMTP/API errors must not be copied to the user interface or Jira evidence.

## Vietnamese

### Mục tiêu

Hiểu vì sao bug action vẫn phải commit khi email không gửi được. IDTS ghi ý định notification trong transaction request, sau đó worker riêng mới gửi email.

### Chuẩn bị và breakpoint

Dùng config local tắt email hoặc local test SMTP server. Không đổi credential Render/Brevo trong lab. Đặt breakpoint tại lifecycle action trong `srv/bug-service/actions.js`, phần tạo notification trong `srv/bug-service/notifications.js`, `srv/email/outbox.js:processEmailDeliveries`, `srv/email/worker.js:startEmailWorker`.

### Thứ tự chạy mong đợi

1. Bug action validate và update Bug state trong CAP transaction.
2. Cùng transaction đó ghi `Notifications` và một `NotificationDeliveries` row cho channel EMAIL.
3. Nếu email tắt, config thiếu, user inactive hoặc không có recipient, delivery thành `SKIPPED`; Bug change vẫn commit.
4. Nếu config đủ, worker từ `startEmailWorker` dùng `cds.spawn` chạy theo lịch riêng, claim row pending và gọi sender đã cấu hình.
5. Thành công ghi `SENT`, `sentAt`, số lần thử và provider message ID. Thất bại ghi `FAILED` đã sanitize cùng thời điểm retry; không rollback workflow đã xong.

### Cần quan sát và bài lỗi

Quan sát Notification ID, delivery status, `attemptCount`, `nextAttemptAt` và error summary đã sanitize. Mô phỏng sender fail ở local. Xác nhận bug status/history vẫn commit, sau đó delivery retry thay vì tạo một sent row trùng.

### Giải thích lại

Giải thích vì sao email worker không chạy trong transaction của `assignToDeveloper` và vì sao raw SMTP/API error không được xuất hiện trên UI hoặc Jira evidence.
