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

### Fix round 2

Scoped re-review of fix head `bfd8bf1773278edd25201e4b2c0b069f0cd7b958` found one new Important query-amplification gap: HistoryLogs and Overdue recipient reads had become per-candidate. RED was witnessed with a full 500-candidate page and two recipients per candidate; `npm run qa:my-notifications:scheduled` failed at `history anchors are resolved in a bounded number of page bulk queries`.

GREEN now retains one lock-time Bug re-read per candidate, then resolves latest status/due-date anchors with bounded aggregate HistoryLogs reads and overdue profiles/users with one bounded bulk query per page. Those bulk reads remain lock-free to preserve the existing assignment path's `DeveloperProfile -> Bug` order; the existing per-recipient User lock/revalidation remains immediately before the writer, so a preloaded active recipient that becomes inactive cannot pass. The focused query-count assertions prove 500 candidate re-reads, at most three bounded history queries, one profile query and one recipient-user query for the full page; immutable anchors, keyset paging, source keys and prompt/digest separation remain unchanged.

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

### Fix round 2

Scoped re-review của fix head `bfd8bf1773278edd25201e4b2c0b069f0cd7b958` tìm thấy một Important mới về query amplification: HistoryLogs và recipient Overdue bị đọc từng candidate. RED được witness bằng page đủ 500 candidate và hai recipient mỗi candidate; `npm run qa:my-notifications:scheduled` fail tại `history anchors are resolved in a bounded number of page bulk queries`.

GREEN nay vẫn giữ một lock-time Bug re-read cho từng candidate, sau đó resolve anchor status/due-date mới nhất bằng aggregate HistoryLogs bounded và profile/user Overdue bằng một bulk query bounded mỗi page. Bulk read không lock để giữ đúng thứ tự lock hiện có của assignment `DeveloperProfile -> Bug`; lock/revalidate User từng recipient ngay trước writer vẫn giữ nguyên, nên recipient đã preload active nhưng chuyển inactive không thể pass. Assertion query-count focused chứng minh 500 candidate re-read, tối đa ba history query bounded, một profile query và một recipient-user query cho page đủ; anchor bất biến, keyset paging, source key và tách prompt/digest vẫn giữ nguyên.

## Addendum / Phụ lục — fix rounds 3 and 4

### Fix round 3

Scoped re-review found that page-level `forUpdate()` profile/user reads after Bug locks could invert the existing assignment order. The fix kept profile/user bulk reads lock-free and retained final per-recipient User locking, preserving `DeveloperProfile -> Bug` assignment ordering while keeping page bounds. Focused full-page QA asserted profile/user query shape and final User revalidation.

### Fix round 4

The scoped re-review then found that lock-free DeveloperProfile eligibility could become stale if profile deactivation committed after the bulk read. TDD RED was witnessed against `b11649896235f604aebaee5a4963a35becc9d728` by a real SQLite fixture that deactivated the persisted profile after its bulk preload and observed one stale technical-assignee notification (`1 !== 0`, exit 1). GREEN preloads profile-to-user pairs, locks candidate Users and then candidate profile IDs once per page before any Bug row (`User -> DeveloperProfile -> Bug`), then performs one page-bounded active-profile/User recheck after Bug lock-time revalidation and accepts only IDs from the prelocked sets. The focused fixture now rejects the deactivated profile while preserving active current-action-owner handling, keyset paging, immutable anchors, source-key idempotency, bounded reads and final User locks. SQLite verifies persisted stale-state behavior but cannot prove HANA row-lock/concurrency semantics; maximum HANA `IN` cardinality remains unverified.

### Fix round 3

Scoped re-review nhận thấy profile/user read page-level bằng `forUpdate()` sau Bug lock có thể đảo thứ tự lock hiện có của assignment. Fix giữ bulk profile/user read lock-free và giữ User lock cuối theo recipient, bảo toàn thứ tự assignment `DeveloperProfile -> Bug` trong khi vẫn bounded theo page. QA full-page focused assert query shape profile/user và final User revalidation.

### Fix round 4

Scoped re-review sau đó nhận thấy eligibility DeveloperProfile lock-free có thể stale nếu profile deactivate commit sau bulk read. RED TDD được witness tại `b11649896235f604aebaee5a4963a35becc9d728` bằng fixture SQLite thật: deactivate profile persisted sau preload bulk và thấy một notification stale cho technical assignee (`1 !== 0`, exit 1). GREEN preload cặp profile-user, lock User candidate rồi lock DeveloperProfile candidate một lần bounded theo page trước mọi Bug row (`User -> DeveloperProfile -> Bug`), sau đó recheck profile/User active một lần bounded theo page sau Bug revalidation và chỉ nhận ID thuộc set đã prelock. Fixture focused nay reject profile đã deactivate, đồng thời giữ current-action-owner active, keyset paging, anchor bất biến, source-key idempotency, bounded read và final User lock. SQLite verify stale state persisted nhưng không chứng minh row-lock/concurrency HANA; cardinality `IN` tối đa trên HANA vẫn chưa verify.

### Fix round 5 — cross-page CAP transaction lock lifetime

Scoped re-review of fix head `d4fced648c1dfb190d71a4155d05dbb1b084e610` found that page-level `User -> DeveloperProfile -> Bug` locks remained held by the single caller-owned scheduler transaction while keyset paging advanced. Because the existing assignment path locks `DeveloperProfile -> Bug`, a later-page Profile lock could wait behind an assignment that was waiting for an earlier-page Bug. The fix keeps each bounded page's candidate read, lock/revalidation and source/inbox/delivery writes in one detached CAP root transaction, commits that page before requesting the next keyset page, and carries only the caller tenant/user context. The public `discoverScheduledNotifications({ tx, now })` signature remains unchanged; this is an explicit transaction-scope ruling because `cds.tx(req)` is nested and cannot release row locks per page, while this background maintenance action has no caller business writes to combine.

The new TDD RED used a real CAP `db.tx(fn)` runner around a 501-row keyset fixture. Against `d4fced648c1dfb190d71a4155d05dbb1b084e610`, no detached page transaction was opened: `npm run qa:my-notifications:scheduled` exited `1` at `scripts/qa/test-my-notifications-scheduled.js:267` with actual committed-before sequence `[]` instead of `[0, 1]`. GREEN passes the same fixture with CAP page starts `[0, 1]` and commits `[1, 2]`, proving the second page begins only after the first root transaction has committed. CAP source inspection confirms `db.tx(fn)` starts/commits a root transaction around its callback, while `cds.tx(req)` is nested and retains `forUpdate()` locks until the root commit. Page writes still use the existing `writeNotificationRecord()` in the page transaction, so each source event, inbox index row and optional prompt outbox row remains atomic; a page failure rolls back its complete unit.

The page-boundary fix does not change candidate scope/keyset paging, immutable SLA/due-cycle anchors, bounded history/profile/user reads, final active eligibility, source-key idempotency, prompt/digest separation, `processEmailOutbox`, assignment behavior, schema, dependencies, deployment or live schedules. SQLite/focused QA proves the CAP root callback boundary but does not emulate HANA blocking/isolation or maximum `IN` cardinalities; live concurrency remains a deployment acceptance concern.

### Fix round 5 — cross-page CAP transaction lock lifetime (Tiếng Việt)

Scoped re-review của fix head `d4fced648c1dfb190d71a4155d05dbb1b084e610` phát hiện lock `User -> DeveloperProfile -> Bug` theo page vẫn bị giữ trong một scheduler transaction do caller sở hữu khi keyset tiến sang page sau. Vì assignment hiện có lock theo `DeveloperProfile -> Bug`, lock Profile ở page sau có thể chờ assignment đang chờ Bug ở page trước.

QA TDD thêm fixture keyset 501 row với page runner CAP `db.tx(fn)` thật. Tại exact head d4fced64, scheduler không mở detached page transaction nên RED là `npm run qa:my-notifications:scheduled` exit `1` tại `scripts/qa/test-my-notifications-scheduled.js:267`, với committed-before thực tế `[]` thay vì `[0, 1]`. GREEN dùng cùng fixture và đạt committed-before `[0, 1]`, committed pages `[1, 2]`; page thứ hai chỉ bắt đầu sau root transaction page đầu commit. Source CAP runtime cho thấy `cds.tx(req)` là nested giữ lock `forUpdate()` tới root commit, còn `db.tx(fn)` là root detached tự commit sau callback.

`discoverScheduledNotifications({ tx, now })` vẫn giữ nguyên signature. Module derive service database gốc và tenant/user context của caller, chạy candidate read, lock/revalidation và write source/inbox/delivery của từng page trong root detached bounded riêng, rồi commit trước khi lấy page keyset kế tiếp. Đây là ruling transaction-scope rõ ràng vì scheduler background không có business write của caller cần gộp; không commit transaction caller âm thầm. `writeNotificationRecord()` vẫn chạy cùng page root nên source event, inbox index và delivery prompt của mỗi event atomic, page lỗi rollback trọn unit đó. Candidate scope, keyset, anchor bất biến, bounded read, fail-closed eligibility, source key, prompt/digest, `processEmailOutbox`, assignment behavior và mọi boundary schema/deploy/live schedule không đổi.

SQLite/focused QA chứng minh root callback start/commit thực tế nhưng không mô phỏng blocking/isolation HANA hoặc cardinality `IN` tối đa; concurrency live vẫn là acceptance concern.
