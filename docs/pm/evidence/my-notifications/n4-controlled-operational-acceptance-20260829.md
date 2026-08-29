# N4 controlled operational acceptance — 2026-08-29

## English

### Outcome

The bounded N4 scheduler/provider and HANA idempotency acceptance is complete. One controlled `UPDATED` notification for `BUG-0014` was created for the approved `donhvse` Tester account, processed by the existing SAP Job Scheduling recovery job and delivered by Brevo. Replaying the exact source key created no second notification, inbox row, delivery or provider request.

The N4 scheduled-discovery job is prepared but intentionally inactive. The live Job Scheduling instance is on the `free` plan, whose minimum recurring frequency is one hour rather than five minutes. More importantly, the current live Bug set contains pre-existing Pending Assignment/Overdue candidates; activating discovery without a separately reviewed baseline would create historical notifications. No historical replay was authorized or performed.

### Readiness and pre-state

- The first `npm run btp:demo:check` found the trial CAP/AppRouter stopped. Exactly one `npm run btp:demo:prepare` restarted the existing apps; an independent check then returned CAP/AppRouter `1/1`, health/ready `200`, anonymous protected API `401`, Web `200`, and `DEMO READY`.
- Read-only CF task `n4-acceptance-preflight-4f4b0ab38f` proved zero `PENDING`/`FAILED` rows across Bug notification, onboarding, access and digest delivery outboxes, and proved the acceptance source key absent.
- Read-only task `n4-user-shape-99aed0b2b0` proved the approved recipient is an active `TESTER` and `BUG-0014` exists in `IN_PROGRESS`.
- Four earlier bounded diagnostic tasks failed before any accepted write because of CAP model/harness mistakes. The first write attempt also stopped before its transaction because `STATUS_CHANGE` is not a valid event code. These failures are not product failures and produced no notification/provider mutation.

### Controlled provider delivery

- Source key: `N4_ACCEPTANCE:DONHVSE:20260829`.
- The accepted catalog event is `UPDATED`; no Bug field, status, assignment, comment, user or role was changed.
- The writer committed exactly one Notification, one unread inbox row and one `PENDING` email delivery. A same-key rerun before delivery returned the same IDs and counts.
- A temporary active one-time schedule on existing job `3252425` invoked `/odata/v4/bug/processEmailOutbox`. Run `57a2723e-5989-46e0-a9b6-7bcd6fb68232` completed `SUCCESS`, HTTP `200`, with `sent=1`, `failed=0`, `skipped=0` between `2026-08-29 01:41:51` and `01:41:53` UTC.
- HANA readback returned delivery `SENT`, attempt count `1`, non-null sent timestamp and provider message ID, no error code, one unread inbox row and zero remaining pending Bug deliveries.
- Brevo reported one request at `2026-08-29T08:41:53.356+07:00` and one delivered event at `08:41:54`, with the same provider message ID and subject `[IDTS] BUG-0014 - Updated`.
- A post-send same-source replay still returned exactly one Notification, one delivery, one inbox row and attempt count `1`; Brevo still exposed exactly one request event.
- Both temporary one-time schedules were removed after verification. The original active one-hour recovery schedule remains unchanged.

### HANA concurrency and cleanup

- CF tasks `n4-concurrency-a-636d3245` and `n4-concurrency-b-c43cfc6b` concurrently called the production writer with source key `N4_CONCURRENCY:DONHVSE:20260829` and `emailRequired=false`.
- Both completed successfully and returned the same Notification ID with `IN_APP_ONLY`; no delivery was created.
- Guarded cleanup task `n4-concurrency-cleanup-c5f3c3506f` first proved exactly one source row, one inbox row and zero deliveries, then deleted only those two test rows. Readback proved the concurrency source count returned to zero. The provider-delivery acceptance record remains retained.

### Scheduler configuration boundary

- The live instance rejected `repeatInterval=5 minutes` with the explicit service-plan error: the `free` plan minimum is one hour; five minutes requires the `standard` plan.
- Job `3368450`, `IDTSNotificationSchedulesHourly`, is staged against `/odata/v4/notification/processNotificationSchedules` with one `1 hour` schedule. Both job and schedule are inactive.
- Activation is held to prevent unreviewed historical Pending Assignment/Overdue replay. Prompt Bug/access email does not depend on this cadence; its post-commit immediate worker remains the normal low-latency path, while Job Scheduler is recovery/discovery/digest infrastructure.

### Final verification

- PASS: My Notifications model, caller-only service, backfill, lifecycle event matrix, scheduled discovery, digest, UI client and shell contracts on exact merged source `f79d4a7b9dbdac496db953be3b6cfce60c913b96`.
- PASS: secret scan; agent rules `8/8`; QA-depth self-test `15/15`; documentation `git diff --check`.
- PASS: final `npm run btp:demo:check` with CAP/AppRouter `1/1`, liveness/readiness `200`, protected anonymous API `401`, Web `200`, `DEMO READY`.
- Tooling note: the first CAP-test invocation from the evidence-only worktree failed with `MODULE_NOT_FOUND @sap/cds` because that worktree has no dependency junction. The same suites were rerun from the clean deployment worktree at the exact merge commit where the locked dependency tree is available; all passed. No install, package or lockfile mutation was performed.

## Tiếng Việt

### Kết quả

Acceptance N4 có kiểm soát cho scheduler/provider và idempotency HANA đã hoàn tất. Một notification `UPDATED` duy nhất cho `BUG-0014` được tạo cho tài khoản Tester `donhvse` đã duyệt, được SAP Job Scheduling gọi qua recovery job hiện hữu và Brevo giao thành công. Chạy lại cùng source key không tạo notification, inbox, delivery hay provider request thứ hai.

Job discovery N4 đã được chuẩn bị nhưng cố ý giữ inactive. Job Scheduling live đang dùng plan `free`, chỉ cho recurring tối thiểu một giờ thay vì năm phút. Đồng thời live đang có Bug Pending Assignment/Overdue cũ; bật discovery ngay sẽ tạo notification lịch sử chưa được duyệt. Không có historical replay nào được thực hiện.

### Bằng chứng chính

- Sau đúng một prepare khôi phục trial app, check độc lập đạt CAP/AppRouter `1/1`, health/ready `200`, Auth anonymous `401`, Web `200`, `DEMO READY`.
- Preflight chứng minh bốn outbox không có `PENDING`/`FAILED`, source acceptance chưa tồn tại; recipient active role `TESTER`; `BUG-0014` ở `IN_PROGRESS`.
- Source key `N4_ACCEPTANCE:DONHVSE:20260829` tạo đúng một source, một inbox unread và một email delivery. Không đổi Bug/user/role/comment/assignment.
- Job run one-time `57a2723e-5989-46e0-a9b6-7bcd6fb68232` trả HTTP `200`, `sent=1`, `failed=0`, `skipped=0`. HANA trả `SENT`, attempt `1`, có sentAt/providerMessageId, không error và không còn pending.
- Brevo ghi đúng một request và một delivered, cùng message ID, subject `[IDTS] BUG-0014 - Updated`. Replay sau gửi vẫn giữ count `1` và Brevo không có request thứ hai.
- Hai schedule one-time tạm đã xóa; recurring recovery một giờ cũ giữ nguyên.
- Hai task concurrency cùng source key trả cùng Notification ID; readback đúng một source + một inbox + không delivery. Cleanup có guard đã xóa đúng hai test row concurrency và xác nhận source test về zero; record acceptance gửi mail vẫn giữ lại.
- Job `3368450` (`IDTSNotificationSchedulesHourly`) đã stage với action `/odata/v4/notification/processNotificationSchedules`, một schedule `1 hour`, nhưng job/schedule đều inactive để tránh replay backlog cũ. Email prompt nhanh vẫn đi bằng worker immediate sau commit, không chờ job hourly.
- Matrix cuối PASS: model/service/backfill/events/scheduled/digest/UI/shell, secret scan, agent rules `8/8`, QA-depth `15/15`, `git diff --check`; final BTP check đạt `DEMO READY`. Lần chạy CAP test đầu từ evidence worktree thiếu dependency và fail `MODULE_NOT_FOUND @sap/cds`; chạy lại đúng merge SHA từ deployment worktree có dependency khóa sẵn đã PASS, không install hay đổi lockfile.
