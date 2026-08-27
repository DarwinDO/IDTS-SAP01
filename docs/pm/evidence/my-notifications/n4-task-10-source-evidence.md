# My Notifications N4 Task 10 source evidence

## English

- Owner/member: DonHV.
- Branch: `feature/wp7-notifications-sla-digest-donhv`.
- Frozen base/origin-dev/merge-base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`.
- Scope: idempotent scheduled Pending Assignment/SLA/Overdue discovery only. Digest generation, Operations diagnostics, retention, migration, deployment, live schedule/provider/email, user/role/data mutation and N5 are out of scope.
- Source head: the Task 10 local commit containing this evidence; exact SHA is recorded in the Task 10 report after commit.

### TDD and implementation

- RED was witnessed before creating `srv/notification/scheduled.js`: `npm run qa:my-notifications:scheduled` exited `1` with `MODULE_NOT_FOUND` for the intentionally absent production module.
- GREEN adds `discoverScheduledNotifications({ tx, now })`, protected `NotificationService.processNotificationSchedules(now:Timestamp)`, 500-row candidate paging, active PM/current-owner/assignee resolution, fixed 4-hour Critical/Blocker and 24-hour standard thresholds, due-date cycle keys, closed exclusion, and reuse of `writeNotificationRecord()` for atomic source/inbox/delivery writes.
- Critical/Blocker Pending Assignment/SLA events create prompt email outbox rows; standard SLA and all Overdue events are inbox/digest policy only. `processEmailOutbox` remains a separate BugService action/worker path.

### Verification and boundaries

- PASS: `npm run qa:my-notifications:scheduled`; `npm run qa:pm-monitoring:programmatic` (20/20); `npm run qa:idts113:outbox-scheduler` (6/6); focused JS syntax checks; `npx cds compile srv -s all --to edmx` (exit 0).
- The CAP compile emits only the pre-existing attachment `NonUpdateableProperties` vocabulary warning. CAP/UI5 MCP tools were not callable, so no MCP PASS is claimed; local CAP compilation and SQLite QA are the evidence used.
- OfficeCLI preflight `officecli --version` returned `1.0.145`; Markdown was edited with repository-native tooling because OfficeCLI does not edit Markdown.
- No database schema, lockfile, dependency, MTA/XSUAA, provider, runtime, user/role/data, deployment, junction, push, PR or N5 mutation was performed.

### Fix round 1

The exact-head review found four Important correctness gaps. Fix-round RED was witnessed by extending the focused suite with regressions for an edited Pending Assignment Bug, lock-time close/assignment/due-date revalidation, 501-row keyset continuation and due-date reversion. The first run failed at the edited-Bug assertion because mutable `modifiedAt` suppressed the required SLA event; a grouped CQN portability error encountered during the fix was also logged and corrected before GREEN.

GREEN now derives Pending Assignment age from the latest immutable status `HistoryLogs.createdAt` (legacy fallback to Bug `createdAt`), locks/re-reads each candidate before deriving events, re-checks active recipients in the same transaction, uses `ID > lastID` keyset pages of 500, and adds the immutable due-date HistoryEvent identity to the Overdue source key. The existing transactional writer and email/outbox separation remain unchanged.

## Tiếng Việt

- Owner/member: DonHV.
- Branch: `feature/wp7-notifications-sla-digest-donhv`.
- Frozen base/origin-dev/merge-base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`.
- Phạm vi: chỉ discovery Pending Assignment/SLA/Overdue theo lịch, idempotent. Tạo digest, diagnostic Operations, retention, migration, deploy, schedule/provider/email thật, mutation user/role/data và N5 nằm ngoài scope.
- Source head: commit local Task 10 chứa evidence này; SHA chính xác được ghi trong report Task 10 sau khi commit.

### TDD và implementation

- Đã witness RED trước khi tạo `srv/notification/scheduled.js`: `npm run qa:my-notifications:scheduled` exit `1` với `MODULE_NOT_FOUND` cho module production cố ý chưa tồn tại.
- GREEN thêm `discoverScheduledNotifications({ tx, now })`, `NotificationService.processNotificationSchedules(now:Timestamp)` được bảo vệ, paging candidate 500 row, resolve PM/current owner/assignee active, threshold cố định Critical/Blocker 4 giờ và standard 24 giờ, key cycle theo due date, loại Bug đóng, và reuse `writeNotificationRecord()` để write source/inbox/delivery atomic.
- Event Pending Assignment/SLA Critical/Blocker tạo row email outbox prompt; SLA standard và mọi Overdue theo policy inbox/digest. `processEmailOutbox` vẫn là action/worker BugService tách riêng.

### Verification và boundary

- PASS: `npm run qa:my-notifications:scheduled`; `npm run qa:pm-monitoring:programmatic` (20/20); `npm run qa:idts113:outbox-scheduler` (6/6); kiểm syntax JS focused; `npx cds compile srv -s all --to edmx` (exit 0).
- CAP compile chỉ còn warning vocabulary attachment `NonUpdateableProperties` đã có từ trước. CAP/UI5 MCP không callable, nên không claim MCP PASS; evidence dùng local CAP compile và SQLite QA.
- Preflight OfficeCLI `officecli --version` trả `1.0.145`; Markdown được sửa bằng tooling native của repo vì OfficeCLI không edit Markdown.
- Không thực hiện mutation schema database, lockfile, dependency, MTA/XSUAA, provider, runtime, user/role/data, deploy, junction, push, PR hoặc N5.

### Fix round 1

Review exact-head tìm thấy bốn Important gap về correctness. RED fix round được witness bằng cách mở rộng focused suite cho Bug Pending Assignment bị edit, revalidate close/assignment/due-date ngay lúc lock, tiếp nối keyset 501 row và due-date revert. Lần chạy đầu fail ở assertion Bug bị edit vì `modifiedAt` mutable đã suppress SLA event bắt buộc; một lỗi portability CQN group gặp trong lúc fix cũng đã được log và sửa trước GREEN.

GREEN nay derive tuổi Pending Assignment từ `HistoryLogs.createdAt` bất biến của status (fallback `Bug.createdAt` cho legacy), lock/đọc lại từng candidate trước khi derive event, kiểm tra lại recipient active trong cùng transaction, dùng page keyset `ID > lastID` tối đa 500, và thêm identity `HistoryEvent` bất biến của due-date vào source key Overdue. Writer transactional hiện có và tách email/outbox vẫn giữ nguyên.
