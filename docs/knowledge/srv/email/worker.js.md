# Knowledge: `srv/email/worker.js`

## Immediate post-commit kick (2026-08-12)

### English

`writeNotificationAndSchedule()` keeps the durable outbox write inside the Bug request transaction. When that write returns `PENDING`, `scheduleImmediateEmailOutbox()` registers one `req.on('succeeded')` handler for the whole request. Only after commit does the handler start a privileged one-shot `cds.spawn()` transaction and process the due batch. A `WeakSet` prevents multiple notification writes in one request from registering duplicate kicks. `SKIPPED` deliveries and failed/rolled-back requests never start the kick. The periodic worker or SAP Job Scheduler remains the recovery path if the one-shot process is interrupted.

### Vietnamese

`writeNotificationAndSchedule()` vẫn ghi durable outbox bên trong transaction của Bug request. Khi kết quả ghi là `PENDING`, `scheduleImmediateEmailOutbox()` đăng ký đúng một handler `req.on('succeeded')` cho toàn request. Chỉ sau khi commit, handler mới tạo một transaction `cds.spawn()` đặc quyền chạy một lần và xử lý batch đến hạn. `WeakSet` ngăn nhiều notification trong cùng request đăng ký kick trùng. Delivery `SKIPPED` và request fail/rollback không chạy kick. Periodic worker hoặc SAP Job Scheduler vẫn là đường recovery nếu one-shot process bị gián đoạn.

## IDTS-113 SAP BTP scheduling mode

### English

Render still uses the in-process polling loop. SAP BTP sets
`IDTS_EMAIL_WORKER_MODE=scheduler`, so `shouldStartEmailWorker()` returns
`false` and no duplicate timer starts inside the CAP process. SAP Job
Scheduling Service instead calls the protected `processEmailOutbox` OData
action. That action calls `processEmailOutboxBatch({ tx })`, which creates one
sender, processes one due batch with the current CAP transaction, and closes
the sender. Debug in this order: Job Scheduler run log -> HTTP action request
-> `srv/service.js` action registration -> `processEmailOutboxBatch()` ->
`processEmailDeliveries()`.

### Vietnamese

Render vẫn dùng vòng lặp polling bên trong process. Trên SAP BTP,
`IDTS_EMAIL_WORKER_MODE=scheduler` làm `shouldStartEmailWorker()` trả về
`false`, vì vậy CAP không tự tạo timer trùng lặp. SAP Job Scheduling Service
sẽ gọi OData action được bảo vệ `processEmailOutbox`. Action này gọi
`processEmailOutboxBatch({ tx })` để tạo sender, xử lý một batch đến hạn trong
transaction CAP hiện tại rồi đóng sender. Thứ tự debug: Job Scheduler run log
-> HTTP action request -> đăng ký action trong `srv/service.js` ->
`processEmailOutboxBatch()` -> `processEmailDeliveries()`.

## Beginner-first execution map (2026-07-18)

### English

`srv/service.js` calls `startEmailWorker` once after service initialization. The function loads config/sender and uses `cds.spawn` to poll on a configured interval, opening a fresh transaction for each run and delegating delivery work to outbox. Disabled/incomplete config should avoid unsafe sending; a processing error is sanitized/logged and the next poll continues. Break at worker startup → scheduled callback → transaction → `processEmailDeliveries`. This worker is background runtime infrastructure, not an OData endpoint and not part of the Bug action transaction.

### Vietnamese

`srv/service.js` gọi `startEmailWorker` một lần sau khi service khởi động. Hàm tải config/sender và dùng `cds.spawn` poll theo interval, mở transaction mới cho mỗi lượt rồi giao xử lý delivery cho outbox. Config tắt/thiếu phải tránh gửi không an toàn; lỗi xử lý được sanitize/log và lượt poll sau vẫn tiếp tục. Break theo worker startup → scheduled callback → transaction → `processEmailDeliveries`. Worker là hạ tầng nền, không phải OData endpoint và không nằm trong transaction của Bug action.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: committed delivery row -> scheduled worker -> sender. Break inside the `cds.spawn` callback for pending/failed delivery diagnosis. The worker transaction is intentionally separate from a Bug workflow transaction.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: committed delivery row -> scheduled worker -> sender. Đặt breakpoint trong callback `cds.spawn` khi chẩn đoán delivery pending/failed. Worker transaction cố ý tách khỏi Bug workflow transaction.

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

### IDTS-48 update: provider-neutral worker

The worker no longer says "SMTP" for every runtime path. It now asks `sender.js` for `createEmailSender(config)`. That selector can return either the old SMTP sender or the new Brevo API sender.

The worker still has the same responsibilities:

1. Do nothing when email is disabled.
2. Refuse to start when provider config is incomplete.
3. Poll the outbox with `cds.spawn`.
4. Log only counts and provider name, never email body or credentials.
5. Close the sender on shutdown.

This separation matters because Render shared QA can switch from SMTP to Brevo API by changing private environment variables, without changing bug workflow code.

### Cap nhat IDTS-48: worker khong phu thuoc provider

Worker khong con mac dinh goi moi duong gui email la "SMTP". No goi `createEmailSender(config)` trong `sender.js`. Selector nay co the tra ve SMTP sender cu hoac Brevo API sender moi.

Worker van giu dung cac trach nhiem cu:

1. Khong lam gi khi email disabled.
2. Khong start neu provider config chua day du.
3. Poll outbox bang `cds.spawn`.
4. Chi log so luong va ten provider, khong log body email hay credential.
5. Dong sender khi shutdown.

Tach nhu vay giup Render shared QA doi tu SMTP sang Brevo API chi bang private environment variables, khong phai sua code workflow bug.

## Metadata

- Source: `srv/email/worker.js`
- Related task: IDTS-36, IDTS-48
- Last reviewed: 2026-08-12
