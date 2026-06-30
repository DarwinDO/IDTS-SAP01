# Knowledge: `srv/email/worker.js`

## English

### What this file is for

This file starts and stops the background loop that processes pending email deliveries.

### Beginner explanation

An outbox row does nothing by itself. A worker must periodically ask the database for due rows. CAP's `cds.spawn` runs that work outside the original browser request and gives each run its own transaction. This is why a temporary SMTP outage cannot turn a successful bug action into an HTTP failure.

### IDTS flow

`srv/service.js` calls `startEmailWorker` once after BugService initialization. The worker stays off when email is disabled or incomplete. When ready, it creates one pooled sender and polls the outbox. Shutdown clears the timer and closes SMTP connections.

### Important source anchors

- **Location**: `srv/email/worker.js:13`
  `startEmailWorker()`
  **IDTS concept**: Single guarded startup for the email delivery subsystem.
  **Impact if broken**: Multiple workers may start in one process, disabled environments may contact SMTP, or no delivery processing occurs.
  **Must check together**: `srv/service.js:156`, `srv/email/config.js`, package defaults.

- **Location**: `srv/email/worker.js:29`
  `cds.spawn({ user: cds.User.privileged, every: ... }, ...)`
  **IDTS concept**: Detached technical job with its own CAP transaction.
  **Impact if broken**: SMTP work may accidentally share request context, lack database access, or block the original workflow.
  **Must check together**: `srv/email/outbox.js:110`, CAP transaction guidance, worker tests.

- **Location**: `srv/email/worker.js:47`
  `cds.once('shutdown', ...)`
  **IDTS concept**: Clean worker and connection-pool shutdown.
  **Impact if broken**: Development restarts and deployments can leave timers or sockets open.
  **Must check together**: `srv/email/sender.js` `close()`.

### Cross-folder impact

- `srv/service.js` owns worker startup because BugService is the application service that produces notifications.
- `package.json` supplies safe worker interval and batch defaults.
- Runtime private config decides whether this module actually contacts SMTP.
- PM/QA evidence should show statuses, not private worker configuration.

### Safe editing checklist

- Keep the worker disabled unless configuration is explicitly enabled and complete.
- Do not log recipient bodies, credentials, or raw errors.
- Keep one job/sender per process.
- Use `cds.spawn`; do not attach SMTP sending to the original request transaction.

## Vietnamese

### File này dùng để làm gì

File này khởi động và dừng vòng lặp nền dùng để xử lý email delivery đang chờ.

### Giải thích cho người mới

Một dòng outbox tự nó không thể gửi email. Cần một worker định kỳ hỏi database xem delivery nào đã đến lúc xử lý. `cds.spawn` của CAP chạy công việc đó bên ngoài browser request ban đầu và tạo transaction riêng cho mỗi lượt. Vì vậy SMTP tạm ngừng không biến một action bug đã thành công thành HTTP error.

### Flow hoạt động trong IDTS

`srv/service.js` gọi `startEmailWorker` một lần sau khi BugService khởi tạo. Worker không chạy nếu email đang tắt hoặc thiếu cấu hình. Khi sẵn sàng, nó tạo một sender có pool và poll outbox. Khi ứng dụng shutdown, timer được dừng và connection SMTP được đóng.

### Important source anchors

- **Vị trí**: `srv/email/worker.js:13`
  `startEmailWorker()`
  **Khái niệm IDTS**: Điểm khởi động duy nhất có guard cho email delivery subsystem.
  **Ảnh hưởng nếu sai**: Một process có thể chạy nhiều worker, môi trường disabled vẫn kết nối SMTP hoặc delivery không bao giờ được xử lý.
  **Phải kiểm tra cùng**: `srv/service.js:156`, `srv/email/config.js`, package defaults.

- **Vị trí**: `srv/email/worker.js:29`
  `cds.spawn({ user: cds.User.privileged, every: ... }, ...)`
  **Khái niệm IDTS**: Technical job tách biệt, có CAP transaction riêng.
  **Ảnh hưởng nếu sai**: SMTP có thể dùng nhầm request context, thiếu quyền DB hoặc chặn workflow ban đầu.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:110`, hướng dẫn transaction CAP, worker tests.

- **Vị trí**: `srv/email/worker.js:47`
  `cds.once('shutdown', ...)`
  **Khái niệm IDTS**: Dừng worker và connection pool sạch khi ứng dụng tắt.
  **Ảnh hưởng nếu sai**: Dev restart hoặc deployment có thể để timer/socket còn mở.
  **Phải kiểm tra cùng**: `close()` trong `srv/email/sender.js`.

### Liên kết với folder khác

- `srv/service.js` chịu trách nhiệm start worker vì BugService là application service tạo notification.
- `package.json` cung cấp default an toàn cho interval và batch.
- Private config runtime quyết định module này có thật sự kết nối SMTP hay không.
- PM/QA evidence chỉ nên ghi status, không ghi cấu hình worker private.

### Lưu ý khi sửa

- Giữ worker tắt nếu cấu hình chưa được bật rõ ràng và chưa đầy đủ.
- Không log recipient body, credential hoặc raw error.
- Chỉ có một job/sender trong mỗi process.
- Dùng `cds.spawn`; không gắn SMTP sending vào request transaction ban đầu.

## Metadata

- Source: `srv/email/worker.js`
- Related task: IDTS-36
- Last reviewed: 2026-06-30
