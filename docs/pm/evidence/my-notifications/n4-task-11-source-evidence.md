# My Notifications N4 Task 11 source evidence

## English

### Scope and source identity

- Member: `donhv`
- Worktree: `E:\IDTS-SAP01-worktrees\wp7-notifications-sla-digest-donhv`
- Branch: `feature/wp7-notifications-sla-digest-donhv`
- Frozen base/origin-dev/merge-base: `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`
- Preserved Task 10 prerequisite head before this Task 11 commit: `9018873998d6d223576a458cd6e5364b14037b51`
- Requested local commit: `feat: add weekday notification digest` (exact final SHA is recorded in `task-11-report.md` after commit).
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
- Commit local được yêu cầu: `feat: add weekday notification digest` (SHA cuối chính xác được ghi trong `task-11-report.md` sau commit).
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
