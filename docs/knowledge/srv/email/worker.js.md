# Knowledge: `srv/email/worker.js`

## Immediate post-commit kick (2026-08-12)

### English

`writeNotificationAndSchedule()` keeps the durable outbox write inside the Bug request transaction. When that write returns `PENDING`, `scheduleImmediateEmailOutbox()` registers one `req.on('succeeded')` handler for the whole request. Only after commit does the handler start a privileged one-shot `cds.spawn()` transaction and process the due batch. A `WeakSet` prevents multiple notification writes in one request from registering duplicate kicks. `SKIPPED` deliveries and failed/rolled-back requests never start the kick. The periodic worker or SAP Job Scheduler remains the recovery path if the one-shot process is interrupted.

`cds.spawn` is a receiver-dependent CAP method. If it is saved in a local variable, it must be bound to `cds`; calling an unbound reference makes the runtime treat the wrong object as the CAP facade and the detached transaction cannot start. The focused test exercises the real default `cds.spawn`, not only an injected fake.

The same batch now also processes eligible `UserOnboardingDeliveries` when private invitation configuration is complete. Missing invitation configuration does not block ordinary Bug notification delivery.

### Vietnamese

`writeNotificationAndSchedule()` vẫn ghi durable outbox bên trong transaction của Bug request. Khi kết quả ghi là `PENDING`, `scheduleImmediateEmailOutbox()` đăng ký đúng một handler `req.on('succeeded')` cho toàn request. Chỉ sau khi commit, handler mới tạo một transaction `cds.spawn()` đặc quyền chạy một lần và xử lý batch đến hạn. `WeakSet` ngăn nhiều notification trong cùng request đăng ký kick trùng. Delivery `SKIPPED` và request fail/rollback không chạy kick. Periodic worker hoặc SAP Job Scheduler vẫn là đường recovery nếu one-shot process bị gián đoạn.

`cds.spawn` là method phụ thuộc receiver của CAP. Nếu lưu method này vào biến local thì phải bind lại với `cds`; gọi một reference bị tách khỏi receiver làm runtime dùng nhầm object thay cho CAP facade và không thể mở detached transaction. Focused test phải chạy đường `cds.spawn` mặc định thật, không chỉ fake được inject.

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

## Gate 6 immediate-kick reuse / Tái sử dụng immediate-kick Gate 6

### English

Gate 6 reuses `scheduleImmediateEmailOutbox(req)` at `srv/email/worker.js:48-82`. The new delivery retry only registers this existing request `succeeded` listener; it does not call a provider inside the administration request, create another queue, or change the scheduler recovery loop. The worker remains the single place that claims and sends pending deliveries.

- **IDTS concept**: post-commit responsiveness and durable polling recovery are one shared email boundary.
- **Impact if broken**: a new retry-specific sender could double-send invitations or expose provider failure in the user-administration transaction.
- **Must check together**: `srv/user-admin/operations-audit.js:188-286`, `srv/user-admin/delivery.js`, and `scripts/qa/test-email-immediate-kick.js`.

### Tiếng Việt

Gate 6 tái sử dụng `scheduleImmediateEmailOutbox(req)` tại `srv/email/worker.js:48-82`. Retry delivery mới chỉ đăng ký listener `succeeded` hiện có của request; nó không gọi provider trong request administration, không tạo queue thứ hai và không đổi scheduler recovery loop. Worker vẫn là nơi duy nhất claim và send delivery pending.

- **Khái niệm IDTS**: responsiveness sau commit và polling recovery bền vững dùng chung một boundary email.
- **Ảnh hưởng nếu sai**: sender riêng cho retry có thể gửi invitation hai lần hoặc đưa provider failure vào transaction user-administration.
- **Phải kiểm tra cùng**: `srv/user-admin/operations-audit.js:188-286`, `srv/user-admin/delivery.js` và `scripts/qa/test-email-immediate-kick.js`.

## Gate 6.5 one-batch access processor / Processor access trong một batch Gate 6.5

### English

`processEmailOutboxBatch` now invokes `processUserAccessDeliveries` after the existing Bug and invitation processors and adds its `sent`, `failed`, and `skipped` counts to the same result. It creates one sender, closes it once in `finally`, and retains one scheduler/immediate-kick entrypoint.

- **Location**: `srv/email/worker.js:28-61` — `processEmailOutboxBatch`.
  **IDTS concept**: three domain-owned outboxes share one transport, provider configuration, scheduler, and recovery loop.
  **Impact if broken**: access rows can remain unprocessed, counts can misreport readiness, or a second worker/provider lifecycle can double-send.
  **Must check together**: `srv/user-admin/access-delivery.js:110-176`, `srv/user-admin/delivery.js:14-160`, `srv/email/outbox.js`, and `scripts/qa/test-email-immediate-kick.js`.

### Tiếng Việt

`processEmailOutboxBatch` giờ gọi `processUserAccessDeliveries` sau processor Bug và invitation hiện có, rồi cộng `sent`, `failed`, `skipped` vào cùng kết quả. Batch tạo một sender, close đúng một lần trong `finally`, và giữ một entrypoint scheduler/immediate kick.

- **Vị trí**: `srv/email/worker.js:28-61` — `processEmailOutboxBatch`.
  **Khái niệm IDTS**: ba outbox theo domain dùng chung một transport, cấu hình provider, scheduler và recovery loop.
  **Ảnh hưởng nếu sai**: row access có thể không được xử lý, count readiness sai hoặc vòng đời worker/provider thứ hai gây gửi trùng.
  **Phải kiểm tra cùng**: `srv/user-admin/access-delivery.js:110-176`, `srv/user-admin/delivery.js:14-160`, `srv/email/outbox.js` và `scripts/qa/test-email-immediate-kick.js`.

**Safe editing / Sửa an toàn:** Add processors only through dependency injection and aggregate safe counts; never send inside CAP business transactions. / Chỉ thêm processor qua dependency injection và gộp count an toàn; không gửi bên trong transaction nghiệp vụ CAP.

## N4 weekday digest processor / Processor digest ngày thường N4

### English

`processEmailOutboxBatch()` now invokes `processNotificationDigestDeliveries()` after the Bug, invitation, and access processors. The digest processor receives the same `sendMail` closure backed by the one batch sender, plus the batch `now` and `workerID`; its configured batch is clamped to the digest module's documented HANA-safe bound of 100. It claims and sends only stored `NotificationDigestDeliveries` snapshots, revalidating recipient persona before send; it does not call `buildDigestSnapshot()` during retry. The batch still creates one sender and closes it once in `finally`, so digest delivery cannot introduce a second provider connection, timer, or worker.

- **Location**: `srv/email/worker.js:31-69` — `processDigests` injection and count aggregation.
  **IDTS concept**: Bug, onboarding, access, and digest outboxes share one provider lifecycle and at-least-once worker boundary.
  **Impact if broken**: digest rows can remain pending, counts can misreport the worker result, or a separate sender can create inconsistent retry/connection behavior.
  **Must check together**: `srv/notification/digest.js:148-250`, `srv/email/outbox.js:148-263`, `srv/user-admin/delivery.js`, `srv/user-admin/access-delivery.js`, and the shared-sender QA.

### Tiếng Việt

`processEmailOutboxBatch()` giờ gọi `processNotificationDigestDeliveries()` sau processor Bug, invitation và access. Digest processor nhận cùng closure `sendMail` gắn với một sender của batch, cùng `now` và `workerID` của batch; batch config được clamp về bound HANA-safe 100 của digest. Processor chỉ claim và gửi snapshot `NotificationDigestDeliveries` đã lưu, revalidate persona recipient trước send; retry không gọi lại `buildDigestSnapshot()`. Batch vẫn tạo một sender và close một lần trong `finally`, nên digest không thêm connection provider, timer hoặc worker thứ hai.

- **Vị trí**: `srv/email/worker.js:31-69` — inject `processDigests` và cộng count.
  **Khái niệm IDTS**: Outbox Bug, onboarding, access và digest dùng chung vòng đời provider và boundary worker at-least-once.
  **Ảnh hưởng nếu sai**: digest row có thể kẹt Pending, count worker báo sai hoặc sender riêng tạo behavior retry/connection không nhất quán.
  **Phải kiểm tra cùng**: `srv/notification/digest.js:148-250`, `srv/email/outbox.js:148-263`, `srv/user-admin/delivery.js`, `srv/user-admin/access-delivery.js` và QA shared-sender.

**Safe editing / Sửa an toàn:** Keep `processDigests` injected beside the existing processors and pass the shared `sendMail`; do not create a timer, provider, or sender in digest code. / Giữ `processDigests` inject cạnh các processor hiện có và truyền `sendMail` dùng chung; không tạo timer, provider hoặc sender trong digest code.
