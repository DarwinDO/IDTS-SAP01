# My Notifications N4 Task 11 source evidence

## English

### Scope and source identity

- Member: `donhv`
- Worktree: `E:\IDTS-SAP01-worktrees\wp7-notifications-sla-digest-donhv`
- Branch: `feature/wp7-notifications-sla-digest-donhv`
- Frozen base/origin-dev/merge-base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`
- Preserved Task 10 prerequisite head before this Task 11 commit: `9018873998d6d223576a458cd6e5364b14037b51`
- Task 11 implementation commit: `22edfa1d7b84b512ac42178e3daf237b325de786 feat: add weekday notification digest`.
- Fix round 1 commit: `3c11fd0172fd1c488013e74e84f1b7147f327975 fix: harden weekday notification digest` (the exact final head is recorded in `task-11-report.md`).
- Stop boundary: source-only N4. No schema/dependency/lockfile/MTA/XSUAA/live schedule/provider/data/user/role/email/deployment mutation, N5, push, PR, Ready or merge.

### Recovery and prerequisite evidence

The three pre-existing dirty files were preserved without reset, overwrite or discard:

- `srv/notification/scheduled.js` now creates a fresh `{ tenant, user }` context for every detached page callback rather than caching a CAP context that CAP marks `_txed_before`.
- `scripts/qa/test-my-notifications-scheduled.js` contains context-bearing 501-row page and page-2 rollback fixtures. The protected request path invokes both pages, commits page one before page two, preserves tenant/user context, and rolls back only the failing page.
- `docs/pm/status/donhv.md` records the original breaker ruling, expected RED, fixture corrections and evidence.

### Task 11 TDD evidence

Before creating the digest production module, the new test was run:

```text
npm run qa:my-notifications:digest
Error: Cannot find module '../../srv/notification/digest'
exit_code=1
```

This was the expected feature-missing RED and was logged in `docs/pm/status/donhv.md` before implementation.

The GREEN digest suite covers:

- Bangkok `Asia/Bangkok` 07:59/08:00 boundary, Monday-Friday rule and weekend exclusion;
- no empty digest for an active recipient with no actionable work;
- PM versus Developer/Tester role and ownership isolation;
- current-state exclusion for `CLOSED` and post-snapshot rows;
- priority/severity ordering;
- top 20 items plus exact remainder and allowlisted queue link;
- one unique `recipient + businessDate + digestType` row on schedule rerun;
- exact digest unique-conflict re-read/reuse while propagating an unrelated insert error;
- stored text/HTML retry after the underlying Bug title changes;
- escaped unsafe Bug text in HTML; and
- one sender-backed `sendMail` closure and one sender close across Bug/access/digest worker processors.

### Implementation

- `srv/notification/digest.js`: role-scoped current-state snapshot, Bangkok weekday schedule helper, exact unique insert/reuse, stored snapshot delivery with existing lock/claim/backoff/sanitizer conventions.
- `srv/notification/scheduled.js`: invokes digest generation only at the weekday Bangkok 08:00 boundary in a fresh detached CAP root after scheduled discovery.
- `srv/email/worker.js`: injects `processDigests` into the existing batch and aggregates counts while retaining one sender lifecycle.
- `scripts/qa/test-my-notifications-digest.js`: focused RED/GREEN digest contract and retry/safety/sender fixtures.
- `scripts/qa/test-email-immediate-kick.js`: updated shared-batch contract to include the digest processor.
- `package.json`: adds `qa:my-notifications:digest` and includes it in `qa:my-notifications:scheduled`.
- `docs/knowledge/srv/notification/digest.js.md`, `scheduled.js.md`, `email/worker.js.md`: bilingual source mirrors and cross-layer anchors.

### Verification snapshot

Focused evidence already green before final matrix:

- `npm run qa:my-notifications:digest` — PASS.
- `npm run qa:my-notifications:scheduled` — PASS (prerequisite scheduled suite plus digest suite).
- `npm run qa:email-immediate:programmatic` — PASS.
- `npm run qa:email-outbox:programmatic` — PASS.
- `node --check srv/notification/digest.js` — PASS.
- `node --check srv/notification/scheduled.js` — PASS.
- `node --check srv/email/worker.js` — PASS.
- `officecli --version` — `1.0.145`; Markdown is outside OfficeCLI native editing, so repository-native `apply_patch` plus diff/keyword checks were used.

The full N4 matrix, CAP EDMX/HANA compile, secret/rules/depth checks, affected notification/email/user-access/assignment/auth regressions, diff guards and exact final SHA are recorded in `task-11-report.md`. CAP/UI5/Fiori MCP tools were unavailable; no MCP or live acceptance claim is made. CAP compilation retains the known pre-existing attachment `NonUpdateableProperties` vocabulary warning.

## Tiếng Việt

### Phạm vi và source identity

- Member: `donhv`
- Worktree: `E:\IDTS-SAP01-worktrees\wp7-notifications-sla-digest-donhv`
- Branch: `feature/wp7-notifications-sla-digest-donhv`
- Frozen base/origin-dev/merge-base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`
- Head Task 10 prerequisite được giữ nguyên trước commit Task 11: `9018873998d6d223576a458cd6e5364b14037b51`
- Commit Task 11: `22edfa1d7b84b512ac42178e3daf237b325de786 feat: add weekday notification digest`; Fix round 1: `3c11fd0172fd1c488013e74e84f1b7147f327975 fix: harden weekday notification digest` (SHA cuối chính xác được ghi trong `task-11-report.md`).
- Boundary dừng: N4 source-only. Không mutation schema/dependency/lockfile/MTA/XSUAA/live schedule/provider/data/user/role/email/deployment, N5, push, PR, Ready hoặc merge.

### Evidence recovery và prerequisite

Ba file dirty có sẵn được giữ nguyên, không reset, overwrite hoặc discard:

- `srv/notification/scheduled.js` giờ tạo context `{ tenant, user }` mới cho từng callback page detached thay vì cache context CAP bị CAP đánh dấu `_txed_before`.
- `scripts/qa/test-my-notifications-scheduled.js` có fixture page 501 row có context và rollback page 2. Protected request path gọi đủ hai page, commit page một trước page hai, giữ tenant/user context và chỉ rollback page lỗi.
- `docs/pm/status/donhv.md` ghi breaker ruling ban đầu, RED dự kiến, các correction của fixture và evidence.

### Evidence TDD Task 11

Trước khi tạo production module digest, test mới đã chạy:

```text
npm run qa:my-notifications:digest
Error: Cannot find module '../../srv/notification/digest'
exit_code=1
```

Đây là RED thiếu feature dự kiến và đã được ghi trong `docs/pm/status/donhv.md` trước implementation.

GREEN digest suite cover:

- boundary Bangkok `Asia/Bangkok` 07:59/08:00, rule Monday-Friday và loại weekend;
- không tạo digest rỗng cho recipient active không có work cần xử lý;
- isolation role và ownership PM so với Developer/Tester;
- loại state hiện tại `CLOSED` và row tạo sau snapshot;
- order theo priority/severity;
- top 20 cộng remainder chính xác và queue link allowlist;
- đúng một row unique `recipient + businessDate + digestType` khi schedule chạy lại;
- chỉ re-read/reuse exact unique conflict của digest, còn lỗi insert khác phải propagate;
- retry dùng text/HTML snapshot đã lưu sau khi title Bug nguồn đổi;
- escape text Bug unsafe trong HTML; và
- một closure `sendMail` dùng chung cùng một lần close sender qua processor Bug/access/digest.

### Implementation

- `srv/notification/digest.js`: snapshot current-state theo role, helper schedule weekday Bangkok, insert/reuse unique chính xác và delivery snapshot đã lưu theo convention lock/claim/backoff/sanitize hiện có.
- `srv/notification/scheduled.js`: chỉ gọi generation digest tại boundary weekday 08:00 Bangkok trong root CAP detached mới sau scheduled discovery.
- `srv/email/worker.js`: inject `processDigests` vào batch hiện có và cộng count, vẫn giữ một vòng đời sender.
- `scripts/qa/test-my-notifications-digest.js`: contract digest focused RED/GREEN cùng fixture retry/safety/sender.
- `scripts/qa/test-email-immediate-kick.js`: cập nhật contract batch dùng chung để bao gồm digest processor.
- `package.json`: thêm `qa:my-notifications:digest` và gộp vào `qa:my-notifications:scheduled`.
- `docs/knowledge/srv/notification/digest.js.md`, `scheduled.js.md`, `email/worker.js.md`: mirror source song ngữ và anchor liên kết giữa các layer.

### Tóm tắt verification

Evidence focused đã GREEN trước matrix cuối:

- `npm run qa:my-notifications:digest` — PASS.
- `npm run qa:my-notifications:scheduled` — PASS (scheduled prerequisite cộng digest suite).
- `npm run qa:email-immediate:programmatic` — PASS.
- `npm run qa:email-outbox:programmatic` — PASS.
- `node --check srv/notification/digest.js` — PASS.
- `node --check srv/notification/scheduled.js` — PASS.
- `node --check srv/email/worker.js` — PASS.
- `officecli --version` — `1.0.145`; Markdown không được OfficeCLI native edit nên dùng `apply_patch` của repository cùng diff/keyword check.

Matrix N4 đầy đủ, compile CAP EDMX/HANA, check secret/rules/depth, regressions notification/email/user-access/assignment/auth, diff guard và SHA cuối chính xác được ghi trong `task-11-report.md`. CAP/UI5/Fiori MCP không khả dụng; không claim MCP hoặc live acceptance. CAP compile vẫn có warning vocabulary attachment `NonUpdateableProperties` đã có từ trước.

### Fix round 1 evidence (English)

The bounded review of head `22edfa1d7b84b512ac42178e3daf237b325de786` identified nine Important findings. The working-tree fix round adds real behavior coverage and addresses them without schema or deployment mutation:

- the scheduled request fixture now uses isolated installed CAP `service.tx({ tenant, user }, callback)` roots and real callback commit/rollback, not a handwritten `_txed_before` simulation;
- the digest schedule accepts all Bangkok weekday minutes in 08:00–08:59 while the unique key keeps reruns no-op;
- Pending Assignment SLA uses the latest immutable `HistoryLogs` status transition, with legacy `Bugs.createdAt` fallback;
- Bug reads and Pending Assignment anchors use 500-row `ID > lastID` pages, with no global 5,000-row truncation;
- recipient pages are 100 users, one shared Bug/HistoryLog ownership index is built for the schedule, and all recipient pages continue past 1,000;
- delivery batches and recipient `IN` predicates clamp to the documented HANA-safe bound of 100;
- recipient row locking/recheck, target-aware exact unique detection and a fresh CAP root conflict read preserve idempotency while unrelated insert errors propagate;
- status/`nextProcessorRole_code`/profile ownership is aligned, Tester never uses DeveloperProfile assignment, stray retest ownership is rejected, and send-time role/profile changes fail closed; and
- remainder links use the existing ListReport `exclude_closed=true` and current-action-owner filters, not unknown digest tokens.

The grouped RED/GREEN evidence and final fix-round command matrix are appended to the ignored `task-11-report.md`; the production fix is committed at the exact fix-round head above. The original Task 10 prerequisite remains preserved.

### Evidence Fix round 1 (Tiếng Việt)

Review bounded của head `22edfa1d7b84b512ac42178e3daf237b325de786` phát hiện chín Important. Fix round trong working tree thêm coverage real behavior và xử lý toàn bộ mà không mutation schema/deploy:

- fixture request scheduler dùng root CAP `service.tx({ tenant, user }, callback)` installed thật trong database tách biệt, commit/rollback callback thật, không handwritten `_txed_before` simulation;
- schedule digest nhận mọi phút trong 08:00–08:59 ngày thường Bangkok, còn unique key giữ rerun no-op;
- SLA Pending Assignment lấy transition status bất biến mới nhất trong `HistoryLogs`, fallback `Bugs.createdAt` chỉ cho legacy;
- read Bug và anchor Pending Assignment dùng page `ID > lastID` 500 row, không còn global truncation 5.000;
- recipient page 100 user, schedule dựng một ownership index Bug/HistoryLog dùng chung, tiếp tục qua mốc 1.000 recipient;
- delivery batch và recipient `IN` clamp về bound HANA-safe document 100;
- lock/recheck recipient, detect exact unique target-aware và conflict read bằng CAP root mới giữ idempotency, còn insert error không liên quan vẫn propagate;
- align status/`nextProcessorRole_code`/profile ownership, Tester không dùng DeveloperProfile assignment, retest owner stray bị reject, thay đổi role/profile lúc send fail-closed; và
- link remainder dùng filter ListReport hiện có `exclude_closed=true` và current-action-owner, không dùng token digest lạ.

Evidence RED/GREEN theo nhóm và matrix command fix round cuối được append trong `task-11-report.md` ignored; production fix đã commit ở exact fix-round head trên. Prerequisite Task 10 ban đầu vẫn được preserve.
