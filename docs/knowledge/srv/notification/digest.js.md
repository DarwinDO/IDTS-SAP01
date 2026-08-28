# Knowledge: `srv/notification/digest.js`

## English

This module is the N4 weekday digest boundary. It reads the current actionable Bug state for active PM, Developer, or Tester recipients, renders a safe snapshot of at most 20 items, and stores that snapshot in `NotificationDigestDeliveries`. Bug candidates are read in deterministic keyset pages of 500; the schedule path shares the paged Bug/HistoryLog read and one ownership index across all recipient pages. The module does not create an in-app notification, send mail directly, or create another worker. The existing email worker later claims the stored row and sends the frozen text/HTML through the existing provider.

`buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit: 20 })` resolves the recipient from the authoritative `Users` row, reads only non-Closed Bugs created no later than the snapshot, and applies the role policy from the delivery design. PMs receive Pending Assignment, overdue, SLA-breached, and unresolved Critical/Blocker work. Pending Assignment SLA age uses the latest immutable `HistoryLogs` transition, with Bug creation only as a legacy fallback. Developers and Testers receive only role-aligned overdue/actionable Bugs: Developer technical ownership requires an active DeveloperProfile, Tester ownership never uses a DeveloperProfile, and retest ownership is accepted only for aligned `RETEST_REQUIRED` Tester action. The persisted `digestType` is a fixed allowlisted `DAILY_PM`, `DAILY_DEVELOPER`, or `DAILY_TESTER` value that binds the snapshot persona. A Bug is represented once even when several reasons apply.

Items are ordered by priority, severity, due-date urgency, creation time, and ID for deterministic output. All dynamic text is escaped in HTML. Each item link and the `and N more` queue link are built under the allowlisted Bug Management application path; the queue link uses the existing ListReport filters (`exclude_closed=true`, plus the current action-owner UUID for Developer/Tester), and an invalid or missing configured base URL falls back to the relative application path. A missing item set returns `null`, so the scheduler never creates an empty digest. The returned window is Bangkok midnight through `snapshotAt`, and the body is the immutable payload persisted for retry.

`scheduleNotificationDigests({ tx, now })` runs only during the Bangkok-local 08:00–08:59 Monday-Friday recovery hour. It enumerates every active business-role user in stable ID pages of 100, builds one shared Bug/HistoryLog ownership index, checks the unique recipient/date/type key before building a snapshot, and inserts one `PENDING` row only when work exists. Recipient locking and a second key check serialize normal races. A remaining race is idempotent only when the database code/constraint identifies the exact digest unique key; a context-bearing conflict read uses a fresh CAP root transaction and unrelated database errors propagate. Re-running the same schedule therefore reuses the existing snapshot instead of rebuilding it after Bug state changes.

`processNotificationDigestDeliveries({ tx, config, sendMail, now, workerID })` follows the existing outbox pattern: the configured batch is clamped to a HANA-safe maximum of 100, candidate read and recipient `IN` resolution use that bound, compare-and-set claim uses a lock token, attempts are timestamped, one provider call uses the supplied shared `sendMail`, transport errors are mapped safely, exponential backoff is retained, and final state is `SENT`/`FAILED`/`SKIPPED`. It sends the stored body rather than rebuilding a snapshot. Future-dated rows are not sent early; the allowlisted stored `digestType` must match the current PM/Developer/Tester role, Developers must have an active linked profile, and PM/Tester checks count only active profiles so inactive historical profiles do not block a valid current persona. Invalid/inactive recipients are skipped safely; no failure notification is created for the end user.

### Important source anchors

- **Location**: `srv/notification/digest.js:31`, `buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit })`.
  **IDTS concept**: Builds one role-scoped, current-state digest snapshot from authoritative Bugs and active recipient identity.
  **Impact if broken**: PMs can miss SLA/assignment risk, or Developers/Testers can see another persona’s work; completed or future work could be mailed.
  **Must check together**: `db/schema.cds:432-457` (`NotificationDigestDeliveries`), the daily-digest policy in `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md:283-292`, and `test-my-notifications-digest.js`.
- **Location**: `srv/notification/digest.js:48-74,426-487`, paged Bug query, history anchors and `digestItemFor`.
  **IDTS concept**: Excludes `CLOSED` and post-snapshot rows, applies PM versus Developer/Tester ownership rules, and deduplicates multiple reasons for one Bug.
  **Impact if broken**: A digest can resurrect completed work, leak PM-only work to a personal recipient, or duplicate one Bug in the same email.
  **Must check together**: `db/schema.cds:168-188` Bug ownership associations, `srv/service.cds` Bug status projections, and scheduled discovery’s current-state revalidation.
- **Location**: `srv/notification/digest.js:75-116,525-541`, rendering and allowlisted links.
  **IDTS concept**: Stores a bounded top-20 safe HTML/text snapshot plus a filtered queue link for the remainder.
  **Impact if broken**: Long queues can produce oversized mail, untrusted Bug titles can inject HTML, or links can leave the IDTS application boundary.
  **Must check together**: `srv/email/template.js:69-136` (`escapeHtml`/`buildBugLink`), `srv/email/config.js`, and the safe-HTML/more-than-20 assertions in digest QA.
- **Location**: `srv/notification/digest.js:125-211,329-387`, schedule, shared ownership index and exact unique-key insert.
  **IDTS concept**: One stored `recipient + businessDate + digestType` snapshot per weekday schedule, with narrow race-safe idempotency.
  **Impact if broken**: Scheduler retries could send different snapshots or duplicate the same daily digest, while unrelated database failures could be hidden.
  **Must check together**: `db/schema.cds:456-457` unique annotation, CAP SQLite/HANA unique error behavior, and schedule-rerun/unique-error QA.
- **Location**: `srv/notification/digest.js:213-328`, `processNotificationDigestDeliveries`.
  **IDTS concept**: Digest rows use the existing at-least-once outbox claim/lock/retry/sanitizer contract and the body saved at snapshot time.
  **Impact if broken**: Provider retries can rebuild changed work, race with another worker, leak raw transport errors, or leave rows permanently locked.
  **Must check together**: `srv/email/outbox.js:148-263`, `srv/email/worker.js:23-69`, `srv/email/sender.js`, and email/digest retry QA.
- **Location**: `srv/notification/digest.js:498-524`, `isDigestScheduleDue`/Bangkok date helpers.
  **IDTS concept**: The 08:00 Monday-Friday boundary and business date are derived from `Asia/Bangkok`, independent of host UTC/local settings.
  **Impact if broken**: A digest can run on weekends, at the wrong local hour, or under the wrong business date near midnight.
  **Must check together**: `srv/notification/scheduled.js:23-34`, Job Scheduler configuration owned by N6, and fixed-clock boundary QA.

## Tiếng Việt

Module này là boundary digest ngày thường của N4. Module đọc trạng thái Bug hiện đang cần xử lý cho PM, Developer hoặc Tester active, dựng snapshot an toàn tối đa 20 item và lưu snapshot đó vào `NotificationDigestDeliveries`. Candidate Bug được đọc bằng keyset deterministic page 500; schedule dùng chung read Bug/HistoryLog đã page và một ownership index cho toàn bộ recipient page. Module không tạo in-app notification, không gửi mail trực tiếp và không tạo worker mới. Email worker hiện có sẽ claim row đã lưu rồi gửi text/HTML bất biến qua provider hiện có.

`buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit: 20 })` resolve recipient từ row `Users` authoritative, chỉ đọc Bug chưa `Closed` và có thời điểm tạo không muộn hơn snapshot, sau đó áp policy role trong delivery design. PM nhận Pending Assignment, overdue, SLA đã vượt và Critical/Blocker chưa xử lý; SLA Pending Assignment lấy transition `HistoryLogs` bất biến mới nhất, chỉ fallback createdAt cho legacy. Developer và Tester chỉ nhận Bug actionable đúng role: technical ownership Developer cần DeveloperProfile active, Tester không dùng DeveloperProfile, retest owner chỉ nhận khi action Tester `RETEST_REQUIRED` aligned. `digestType` được persist bằng giá trị allowlist cố định `DAILY_PM`, `DAILY_DEVELOPER` hoặc `DAILY_TESTER` để bind persona snapshot. Một Bug chỉ xuất hiện một lần dù có nhiều lý do.

Item được sắp xếp theo priority, severity, mức khẩn cấp do due date, thời điểm tạo và ID để output ổn định. Mọi text động được escape trong HTML. Link từng item và link queue `and N more` đều được dựng dưới path ứng dụng Bug Management allowlist; queue dùng filter ListReport hiện consume (`exclude_closed=true`, cộng UUID current action owner cho Developer/Tester), base URL thiếu hoặc sai fallback về path tương đối của ứng dụng. Không có item thì trả `null`, vì vậy scheduler không tạo digest rỗng. Window trả về là từ nửa đêm Bangkok tới `snapshotAt`, còn body là payload bất biến được persist để retry.

`scheduleNotificationDigests({ tx, now })` chỉ chạy trong hour recovery 08:00–08:59 thứ Hai–thứ Sáu theo giờ Bangkok. Module đọc toàn bộ user active thuộc role nghiệp vụ theo page ID ổn định 100, dựng một ownership index Bug/HistoryLog dùng chung, kiểm tra unique recipient/date/type trước khi dựng snapshot và chỉ insert một row `PENDING` khi có work. Lock recipient và key check lần hai serialize race bình thường. Race còn lại chỉ idempotent khi code/constraint database xác định đúng digest unique key; conflict trong context request được đọc qua CAP root mới, lỗi database khác phải propagate. Chạy lại cùng schedule vì vậy reuse snapshot cũ thay vì dựng lại sau khi Bug đã đổi.

`processNotificationDigestDeliveries({ tx, config, sendMail, now, workerID })` theo đúng pattern outbox hiện có: batch config được clamp tối đa 100 theo bound HANA-safe, candidate read và recipient `IN` dùng bound đó, claim compare-and-set bằng lock token, ghi thời điểm attempt, gọi provider một lần qua `sendMail` chung được inject, map lỗi transport an toàn, backoff, rồi cập nhật `SENT`/`FAILED`/`SKIPPED`. Processor gửi body đã lưu thay vì dựng snapshot mới. Row có business date tương lai không gửi sớm; `digestType` allowlist phải khớp role hiện tại, Developer cần profile active được link đúng user, còn PM/Tester chỉ đếm profile active nên profile lịch sử inactive không chặn persona hợp lệ; recipient inactive/sai persona/email bị skip an toàn. Lỗi không tạo failure notification cho end user.

### Các điểm neo quan trọng

- **Vị trí**: `srv/notification/digest.js:31`, `buildDigestSnapshot({ tx, recipient, businessDate, snapshotAt, limit })`.
  **Khái niệm IDTS**: Dựng một snapshot theo role từ Bug authoritative và identity recipient active.
  **Ảnh hưởng nếu sai**: PM có thể bỏ sót rủi ro SLA/assignment, hoặc Developer/Tester nhìn thấy work của persona khác; work đã hoàn thành hoặc work tương lai có thể bị gửi.
  **Phải kiểm tra cùng**: `db/schema.cds:432-457` (`NotificationDigestDeliveries`), policy daily digest trong `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md:655-664` và `test-my-notifications-digest.js`.
- **Vị trí**: `srv/notification/digest.js:48-74,426-487`, query Bug page, history anchor và `digestItemFor`.
  **Khái niệm IDTS**: Loại `CLOSED` và row sau snapshot, áp ownership PM so với Developer/Tester và gộp nhiều reason của một Bug.
  **Ảnh hưởng nếu sai**: Digest có thể khôi phục work đã đóng, lộ work PM-only cho recipient cá nhân hoặc lặp một Bug trong cùng email.
  **Phải kiểm tra cùng**: association ownership Bug tại `db/schema.cds:168-188`, projection status Bug trong `srv/service.cds` và lock-time current-state revalidation của scheduled discovery.
- **Vị trí**: `srv/notification/digest.js:75-116,525-541`, phần render và link allowlist.
  **Khái niệm IDTS**: Lưu snapshot text/HTML bounded top-20 an toàn và link queue filtered cho phần còn lại.
  **Ảnh hưởng nếu sai**: Queue dài tạo email quá lớn, title Bug không tin cậy chèn HTML, hoặc link thoát khỏi boundary ứng dụng IDTS.
  **Phải kiểm tra cùng**: `srv/email/template.js:69-136` (`escapeHtml`/`buildBugLink`), `srv/email/config.js` và assertion safe-HTML/more-than-20 trong QA digest.
- **Vị trí**: `srv/notification/digest.js:125-211,329-387`, schedule, ownership index và insert unique chính xác.
  **Khái niệm IDTS**: Mỗi schedule ngày thường chỉ có một snapshot theo `recipient + businessDate + digestType`, với idempotency hẹp cho race.
  **Ảnh hưởng nếu sai**: Scheduler retry có thể gửi snapshot khác hoặc gửi trùng digest trong ngày, còn lỗi database không liên quan có thể bị che mất.
  **Phải kiểm tra cùng**: unique annotation `db/schema.cds:456-457`, behavior lỗi unique CAP SQLite/HANA và QA schedule-rerun/unique-error.
- **Vị trí**: `srv/notification/digest.js:213-328`, `processNotificationDigestDeliveries`.
  **Khái niệm IDTS**: Digest row dùng chung contract claim/lock/retry/sanitize at-least-once hiện có và body đã lưu tại snapshot.
  **Ảnh hưởng nếu sai**: Retry provider có thể dựng lại work đã đổi, race với worker khác, lộ raw transport error hoặc để lock kẹt vĩnh viễn.
  **Phải kiểm tra cùng**: `srv/email/outbox.js:148-263`, `srv/email/worker.js:23-69`, `srv/email/sender.js` và QA retry email/digest.
- **Vị trí**: `srv/notification/digest.js:498-524`, `isDigestScheduleDue`/helper ngày Bangkok.
  **Khái niệm IDTS**: Boundary 08:00 thứ Hai–thứ Sáu và business date lấy theo `Asia/Bangkok`, không phụ thuộc UTC/local timezone của host.
  **Ảnh hưởng nếu sai**: Digest có thể chạy cuối tuần, sai giờ local hoặc sai business date gần nửa đêm.
  **Phải kiểm tra cùng**: `srv/notification/scheduled.js:23-34`, cấu hình Job Scheduler thuộc N6 và QA boundary clock cố định.

## Safe editing / Sửa an toàn

Keep digest generation and delivery separate: snapshot code may read current Bugs and insert only the digest delivery row; it must not send mail, create Bug Notifications, mutate Bug ownership/status, expose raw provider fields, or add a second scheduler/worker/provider. / Giữ tách generation và delivery digest: code snapshot chỉ được đọc Bug hiện tại và insert digest delivery row; không được gửi mail, tạo Bug Notification, đổi ownership/status Bug, expose field provider thô hoặc thêm scheduler/worker/provider thứ hai.
