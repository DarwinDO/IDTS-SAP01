# Knowledge: `srv/notification/digest.js`

## English

This module is the N4 weekday digest boundary. It reads the current actionable Bug state for one active PM, Developer, or Tester, renders a safe snapshot of at most 20 items, and stores that snapshot in `NotificationDigestDeliveries`. The module does not create an in-app notification, send mail directly, or create another worker. The existing email worker later claims the stored row and sends the frozen text/HTML through the existing provider.

`buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit: 20 })` resolves the recipient from the authoritative `Users` row, reads only non-Closed Bugs created no later than the snapshot, and applies the role policy from the delivery design. PMs receive Pending Assignment, overdue, SLA-breached, and unresolved Critical/Blocker work. Developers and Testers receive overdue Bugs assigned to their active DeveloperProfile plus Bugs whose next action or retest ownership is theirs. A Bug is represented once even when several reasons apply.

Items are ordered by priority, severity, due-date urgency, creation time, and ID for deterministic output. All dynamic text is escaped in HTML. Each item link and the `and N more` queue link are built under the allowlisted Bug Management application path; an invalid or missing configured base URL falls back to the relative application path. A missing item set returns `null`, so the scheduler never creates an empty digest. The returned window is Bangkok midnight through `snapshotAt`, and the body is the immutable payload persisted for retry.

`scheduleNotificationDigests({ tx, now })` runs only when the Bangkok-local time is 08:00 Monday-Friday. It enumerates active business-role users in stable ID order, checks the unique recipient/date/type key before building a snapshot, and inserts one `PENDING` row only when work exists. A race that reaches INSERT is idempotent only when the database error is the exact digest unique-key conflict and the authoritative row can be re-read; unrelated database errors propagate. Re-running the same schedule therefore reuses the existing snapshot instead of rebuilding it after Bug state changes.

`processNotificationDigestDeliveries({ tx, config, sendMail, now, workerID })` follows the existing outbox pattern: bounded candidate read, compare-and-set claim with a lock token, attempt timestamp, one provider call using the supplied shared `sendMail`, safe transport-error mapping, exponential backoff, and final `SENT`/`FAILED`/`SKIPPED` state. It sends the stored body rather than rebuilding a snapshot. Future-dated rows are not sent early, inactive or invalid recipients are skipped safely, and no failure notification is created for the end user.

### Important source anchors

- **Location**: `srv/notification/digest.js:31`, `buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit })`.
  **IDTS concept**: Builds one role-scoped, current-state digest snapshot from authoritative Bugs and active recipient identity.
  **Impact if broken**: PMs can miss SLA/assignment risk, or Developers/Testers can see another persona’s work; completed or future work could be mailed.
  **Must check together**: `db/schema.cds:432-457` (`NotificationDigestDeliveries`), the daily-digest policy in `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md:283-292`, and `test-my-notifications-digest.js`.
- **Location**: `srv/notification/digest.js:47-55,298-320`, Bug query and `digestItemFor`.
  **IDTS concept**: Excludes `CLOSED` and post-snapshot rows, applies PM versus Developer/Tester ownership rules, and deduplicates multiple reasons for one Bug.
  **Impact if broken**: A digest can resurrect completed work, leak PM-only work to a personal recipient, or duplicate one Bug in the same email.
  **Must check together**: `db/schema.cds:168-188` Bug ownership associations, `srv/service.cds` Bug status projections, and scheduled discovery’s current-state revalidation.
- **Location**: `srv/notification/digest.js:59-100,371-384`, rendering and allowlisted links.
  **IDTS concept**: Stores a bounded top-20 safe HTML/text snapshot plus a filtered queue link for the remainder.
  **Impact if broken**: Long queues can produce oversized mail, untrusted Bug titles can inject HTML, or links can leave the IDTS application boundary.
  **Must check together**: `srv/email/template.js:69-136` (`escapeHtml`/`buildBugLink`), `srv/email/config.js`, and the safe-HTML/more-than-20 assertions in digest QA.
- **Location**: `srv/notification/digest.js:104-146,253-282`, schedule and exact unique-key insert.
  **IDTS concept**: One stored `recipient + businessDate + digestType` snapshot per weekday schedule, with narrow race-safe idempotency.
  **Impact if broken**: Scheduler retries could send different snapshots or duplicate the same daily digest, while unrelated database failures could be hidden.
  **Must check together**: `db/schema.cds:456-457` unique annotation, CAP SQLite/HANA unique error behavior, and schedule-rerun/unique-error QA.
- **Location**: `srv/notification/digest.js:148-250`, `processNotificationDigestDeliveries`.
  **IDTS concept**: Digest rows use the existing at-least-once outbox claim/lock/retry/sanitizer contract and the body saved at snapshot time.
  **Impact if broken**: Provider retries can rebuild changed work, race with another worker, leak raw transport errors, or leave rows permanently locked.
  **Must check together**: `srv/email/outbox.js:148-263`, `srv/email/worker.js:23-69`, `srv/email/sender.js`, and email/digest retry QA.
- **Location**: `srv/notification/digest.js:356-369`, `isDigestScheduleDue`/Bangkok date helpers.
  **IDTS concept**: The 08:00 Monday-Friday boundary and business date are derived from `Asia/Bangkok`, independent of host UTC/local settings.
  **Impact if broken**: A digest can run on weekends, at the wrong local hour, or under the wrong business date near midnight.
  **Must check together**: `srv/notification/scheduled.js:23-34`, Job Scheduler configuration owned by N6, and fixed-clock boundary QA.

## Tiếng Việt

Module này là boundary digest ngày thường của N4. Module đọc trạng thái Bug hiện đang cần xử lý cho một PM, Developer hoặc Tester active, dựng snapshot an toàn tối đa 20 item và lưu snapshot đó vào `NotificationDigestDeliveries`. Module không tạo in-app notification, không gửi mail trực tiếp và không tạo worker mới. Email worker hiện có sẽ claim row đã lưu rồi gửi text/HTML bất biến qua provider hiện có.

`buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit: 20 })` resolve recipient từ row `Users` authoritative, chỉ đọc Bug chưa `Closed` và có thời điểm tạo không muộn hơn snapshot, sau đó áp policy role trong delivery design. PM nhận Pending Assignment, overdue, SLA đã vượt và Critical/Blocker chưa xử lý. Developer và Tester nhận Bug overdue được giao cho DeveloperProfile active của mình cùng Bug có next action hoặc retest owner là chính user đó. Một Bug chỉ xuất hiện một lần dù có nhiều lý do.

Item được sắp xếp theo priority, severity, mức khẩn cấp do due date, thời điểm tạo và ID để output ổn định. Mọi text động được escape trong HTML. Link từng item và link queue `and N more` đều được dựng dưới path ứng dụng Bug Management allowlist; base URL thiếu hoặc sai fallback về path tương đối của ứng dụng. Không có item thì trả `null`, vì vậy scheduler không tạo digest rỗng. Window trả về là từ nửa đêm Bangkok tới `snapshotAt`, còn body là payload bất biến được persist để retry.

`scheduleNotificationDigests({ tx, now })` chỉ chạy lúc 08:00 thứ Hai–thứ Sáu theo giờ Bangkok. Module đọc user active thuộc role nghiệp vụ theo ID ổn định, kiểm tra unique recipient/date/type trước khi dựng snapshot và chỉ insert một row `PENDING` khi có work. Race đi tới INSERT chỉ được idempotent khi lỗi database đúng là conflict unique của digest và có thể đọc lại row authoritative; lỗi database khác phải propagate. Chạy lại cùng schedule vì vậy reuse snapshot cũ thay vì dựng lại sau khi Bug đã đổi.

`processNotificationDigestDeliveries({ tx, config, sendMail, now, workerID })` theo đúng pattern outbox hiện có: đọc candidate bounded, claim compare-and-set bằng lock token, ghi thời điểm attempt, gọi provider một lần qua `sendMail` chung được inject, map lỗi transport an toàn, backoff, rồi cập nhật `SENT`/`FAILED`/`SKIPPED`. Processor gửi body đã lưu thay vì dựng snapshot mới. Row có business date tương lai không gửi sớm; recipient inactive hoặc email sai bị skip an toàn; lỗi không tạo failure notification cho end user.

### Các điểm neo quan trọng

- **Vị trí**: `srv/notification/digest.js:31`, `buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit })`.
  **Khái niệm IDTS**: Dựng một snapshot theo role từ Bug authoritative và identity recipient active.
  **Ảnh hưởng nếu sai**: PM có thể bỏ sót rủi ro SLA/assignment, hoặc Developer/Tester nhìn thấy work của persona khác; work đã hoàn thành hoặc work tương lai có thể bị gửi.
  **Phải kiểm tra cùng**: `db/schema.cds:432-457` (`NotificationDigestDeliveries`), policy daily digest trong `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md:655-664` và `test-my-notifications-digest.js`.
- **Vị trí**: `srv/notification/digest.js:47-55,298-320`, query Bug và `digestItemFor`.
  **Khái niệm IDTS**: Loại `CLOSED` và row sau snapshot, áp ownership PM so với Developer/Tester và gộp nhiều reason của một Bug.
  **Ảnh hưởng nếu sai**: Digest có thể khôi phục work đã đóng, lộ work PM-only cho recipient cá nhân hoặc lặp một Bug trong cùng email.
  **Phải kiểm tra cùng**: association ownership Bug tại `db/schema.cds:168-188`, projection status Bug trong `srv/service.cds` và lock-time current-state revalidation của scheduled discovery.
- **Vị trí**: `srv/notification/digest.js:59-100,371-384`, phần render và link allowlist.
  **Khái niệm IDTS**: Lưu snapshot text/HTML bounded top-20 an toàn và link queue filtered cho phần còn lại.
  **Ảnh hưởng nếu sai**: Queue dài tạo email quá lớn, title Bug không tin cậy chèn HTML, hoặc link thoát khỏi boundary ứng dụng IDTS.
  **Phải kiểm tra cùng**: `srv/email/template.js:69-136` (`escapeHtml`/`buildBugLink`), `srv/email/config.js` và assertion safe-HTML/more-than-20 trong QA digest.
- **Vị trí**: `srv/notification/digest.js:104-146,253-282`, schedule và insert unique chính xác.
  **Khái niệm IDTS**: Mỗi schedule ngày thường chỉ có một snapshot theo `recipient + businessDate + digestType`, với idempotency hẹp cho race.
  **Ảnh hưởng nếu sai**: Scheduler retry có thể gửi snapshot khác hoặc gửi trùng digest trong ngày, còn lỗi database không liên quan có thể bị che mất.
  **Phải kiểm tra cùng**: unique annotation `db/schema.cds:456-457`, behavior lỗi unique CAP SQLite/HANA và QA schedule-rerun/unique-error.
- **Vị trí**: `srv/notification/digest.js:148-250`, `processNotificationDigestDeliveries`.
  **Khái niệm IDTS**: Digest row dùng chung contract claim/lock/retry/sanitize at-least-once hiện có và body đã lưu tại snapshot.
  **Ảnh hưởng nếu sai**: Retry provider có thể dựng lại work đã đổi, race với worker khác, lộ raw transport error hoặc để lock kẹt vĩnh viễn.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:148-263`, `srv/email/worker.js:23-69`, `srv/email/sender.js` và QA retry email/digest.
- **Vị trí**: `srv/notification/digest.js:356-369`, `isDigestScheduleDue`/helper ngày Bangkok.
  **Khái niệm IDTS**: Boundary 08:00 thứ Hai–thứ Sáu và business date lấy theo `Asia/Bangkok`, không phụ thuộc UTC/local timezone của host.
  **Ảnh hưởng nếu sai**: Digest có thể chạy cuối tuần, sai giờ local hoặc sai business date gần nửa đêm.
  **Phải kiểm tra cùng**: `srv/notification/scheduled.js:23-34`, cấu hình Job Scheduler thuộc N6 và QA boundary clock cố định.

## Safe editing / Sửa an toàn

Keep digest generation and delivery separate: snapshot code may read current Bugs and insert only the digest delivery row; it must not send mail, create Bug Notifications, mutate Bug ownership/status, expose raw provider fields, or add a second scheduler/worker/provider. / Giữ tách generation và delivery digest: code snapshot chỉ được đọc Bug hiện tại và insert digest delivery row; không được gửi mail, tạo Bug Notification, đổi ownership/status Bug, expose field provider thô hoặc thêm scheduler/worker/provider thứ hai.
