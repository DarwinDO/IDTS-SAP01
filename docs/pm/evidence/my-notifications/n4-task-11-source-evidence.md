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
- Fix round 2 commit: `6894cb42660a6375aa76731781b2171d0d6d17a7 fix: bind digest snapshot persona` (the exact final head is recorded in `task-11-report.md`).
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
- Commit Task 11: `22edfa1d7b84b512ac42178e3daf237b325de786 feat: add weekday notification digest`; Fix round 1: `3c11fd0172fd1c488013e74e84f1b7147f327975 fix: harden weekday notification digest`; Fix round 2: `6894cb42660a6375aa76731781b2171d0d6d17a7 fix: bind digest snapshot persona` (SHA cuối chính xác được ghi trong `task-11-report.md`).
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

### Fix round 2 evidence (English)

The scoped re-review of fix round 1 left one Important. The real-CAP transition matrix added PM→Tester, PM→Developer, Developer→Tester/PM, Tester→Developer/PM and a valid current PM with only an inactive historical DeveloperProfile. Before production changes, PM→Tester and Tester→PM rows were sent while the valid inactive-profile PM was skipped. Fix round 2 persists `DAILY_PM`, `DAILY_DEVELOPER` or `DAILY_TESTER` in the existing `digestType`, requires the stored persona to match the current role at send time, and filters profile authorization to active linked profiles. The focused suite is green; retry still sends stored text/HTML only when persona remains authorized.

### Evidence Fix round 2 (Tiếng Việt)

Scoped re-review của fix round 1 còn một Important. Ma trận transition CAP thật thêm PM→Tester, PM→Developer, Developer→Tester/PM, Tester→Developer/PM và PM hiện tại hợp lệ chỉ có DeveloperProfile lịch sử inactive. Trước khi sửa production, row PM→Tester và Tester→PM bị gửi còn PM hợp lệ có profile inactive bị skip. Fix round 2 persist `DAILY_PM`, `DAILY_DEVELOPER` hoặc `DAILY_TESTER` trong field `digestType` hiện có, yêu cầu persona đã lưu khớp role hiện tại lúc send, và lọc authorization profile chỉ theo profile active link đúng user. Focused suite đã GREEN; retry vẫn chỉ gửi text/HTML đã lưu khi persona còn được phép.

### Final fix wave — four Important findings (English)

The final whole-branch review at exact head `7e00b3ed2bed88e83a8800b59feea94347e0989a` found four Important findings. One and only one final fix wave was executed in the preserved `donhv` worktree; the coordinator's status-only NO-GO entry remains intact.

TDD RED fixtures were added before the production changes and run against the reviewed source.

- shared PM and personal ownership indexes changed from PM→Tester and Developer→PM between index construction and `buildDigestSnapshot()`; the old code persisted one row under the new persona (`1 !== 0` at `scripts/qa/test-my-notifications-digest.js:775`);
- three real stored deliveries were changed after claim (User deactivation, role change and active DeveloperProfile deactivation); the old code sent two stale rows (`2 !== 0` at `:862`);
- a target-style `23505` unique error aborted an outer transaction and rejected a later query (`query after simulated 23505` at `:947`); and
- a 201-recipient run failed at a late page and produced zero earlier committed snapshots (`0 !== 100` at `:1000`).

The scheduled PM bound RED was `node scripts/qa/test-my-notifications-scheduled.js` failing `active PM discovery reads bounded keyset pages` at the focused assertion. Harness-only corrections were logged immediately when the new page-root and point-read design changed legacy assumptions; no deferred Minor was changed.

The GREEN implementation is deliberately bounded and source-only:

- `scheduleNotificationDigests()` processes stable 100-user pages, retains only current-page profile rows and count/top-20 accumulators, streams Bugs/HistoryLogs in 500-row keyset pages, returns page snapshots, commits the page read root, then inserts each snapshot through a discardable root. The same fixed `snapshotAt` and Bangkok `businessDate` flow through every page. `_itemsRole` and the locked User role check fail closed on a transition.
- `processNotificationDigestDeliveries()` removes stale recipient/profile batch maps. After each CAS claim it locks and re-reads the authoritative User and active linked Profile in `User -> Profile` order; these locks stay in the worker transaction through provider send and `SENT`/`FAILED`/`SKIPPED` finalization.
- `insertDigestDelivery()` performs the exact key insert in an isolated root. A recognized SQLite/PostgreSQL/HANA exact unique error is thrown out so CAP discards the aborted root; the exact winner is read through a healthy root. Unrelated errors propagate. The first page remains committed after a later page failure, and rerun reuses it.
- `discoverScheduledNotifications()` resolves PM recipients through 500-row `ID > lastID` pages without retaining an unbounded active-PM array.

Fresh focused evidence from the exact worktree:

```text
node scripts/qa/test-my-notifications-scheduled.js
IDTS My Notifications scheduled discovery contract: PASS
exit_code=0

node scripts/qa/test-my-notifications-digest.js
IDTS My Notifications digest contract: PASS
exit_code=0
```

The final wave changed only `srv/notification/digest.js`, `srv/notification/scheduled.js`, the two focused QA scripts, the matching bilingual knowledge mirrors, this evidence, the roadmap, the preserved member status log, and the Task 11 report. `officecli --version` returned `1.0.145`; OfficeCLI does not edit Markdown, so Markdown remained repo-native `apply_patch` with `git diff --check` verification. No schema, dependency, lockfile, MTA/XSUAA, live provider/schedule, data, user/role, deployment, N5, push, PR, Ready or merge action occurred.

### Đợt final fix — bốn finding Important (Tiếng Việt)

Review whole-branch tại exact head `7e00b3ed2bed88e83a8800b59feea94347e0989a` phát hiện bốn Important. Chỉ một final fix wave duy nhất được chạy trong worktree `donhv` đã bảo toàn; entry NO-GO status-only của coordinator vẫn giữ nguyên.

Fixture TDD RED được thêm và chạy trước production fix trên source đã review:

- ownership index PM và personal đổi PM→Tester và Developer→PM giữa lúc dựng index và `buildDigestSnapshot()`; code cũ persist một row dưới persona mới (`1 !== 0` tại `scripts/qa/test-my-notifications-digest.js:775`);
- ba delivery đã lưu bị đổi sau claim (deactivate User, đổi role và deactivate DeveloperProfile active); code cũ gửi hai row stale (`2 !== 0` tại `:862`);
- lỗi unique `23505` kiểu target làm outer transaction abort rồi query sau đó bị reject (`query after simulated 23505` tại `:947`); và
- run 201 recipient fail tại page muộn nhưng không có snapshot page trước đã commit (`0 !== 100` tại `:1000`).

RED bound PM scheduler là `node scripts/qa/test-my-notifications-scheduled.js` fail ở assertion `active PM discovery reads bounded keyset pages`. Các correction chỉ cho harness được log ngay khi page-root và point-read design thay đổi assumption cũ; không thay đổi Minor defer.

GREEN bounded/source-only:

- `scheduleNotificationDigests()` xử lý page ổn định 100 user, chỉ giữ profile và accumulator count/top-20 của page hiện tại, stream Bug/HistoryLog bằng keyset page 500, trả snapshot của page, commit read root rồi insert từng snapshot qua root discardable. Mọi page dùng cùng `snapshotAt` và Bangkok `businessDate`; `_itemsRole` và User lock fail-closed khi role đổi.
- `processNotificationDigestDeliveries()` bỏ batch map recipient/profile stale. Sau mỗi CAS claim, lock và re-read User authoritative cùng Profile active link theo thứ tự `User -> Profile`; lock giữ trong worker transaction qua provider send và finalize `SENT`/`FAILED`/`SKIPPED`.
- `insertDigestDelivery()` insert exact key trong root isolated. Unique error exact kiểu SQLite/PostgreSQL/HANA được throw ra để CAP discard root aborted; winner exact được đọc qua root healthy. Error khác vẫn propagate. Page đầu vẫn commit khi page muộn fail, rerun reuse page đó.
- `discoverScheduledNotifications()` resolve PM qua page 500 `ID > lastID`, không giữ array PM active unbounded.

Evidence focused mới tại exact worktree:

```text
node scripts/qa/test-my-notifications-scheduled.js
IDTS My Notifications scheduled discovery contract: PASS
exit_code=0

node scripts/qa/test-my-notifications-digest.js
IDTS My Notifications digest contract: PASS
exit_code=0
```

Final wave chỉ đổi `srv/notification/digest.js`, `srv/notification/scheduled.js`, hai QA script focused, hai knowledge mirror song ngữ tương ứng, evidence này, roadmap, status thành viên đã preserve và Task 11 report. `officecli --version` trả `1.0.145`; OfficeCLI không edit Markdown nên Markdown dùng `apply_patch` repo-native và verify `git diff --check`. Không mutation schema, dependency, lockfile, MTA/XSUAA, live provider/schedule, data, user/role, deploy, N5, push, PR, Ready hoặc merge.

## Additional narrow F4 remediation / Remediation F4 hẹp bổ sung

DonHV explicitly authorized one additional narrow Luna/max remediation after the exhausted final-wave cap. The scope is only the two residual parts of F4: remove unbounded aggregate DeveloperProfile retention while preserving complete active ownership/persona validation, and bound active-PM User/Bug write locks plus rollback/restart per PM page. No schema, dependency, lockfile, config, provider, live schedule, data, user/role, deployment, N5, push, PR, Ready, merge or cleanup action is included.

TDD RED was witnessed before the production edits with real installed-CAP SQLite behavior:

- `npm run qa:my-notifications:digest` failed the high-cardinality profile fixture because the old profile query returned inactive historical rows (`scripts/qa/test-my-notifications-digest.js:1096`); the fixture had 700 inactive historical profiles per Developer and active profiles referenced by Bugs.
- `npm run qa:my-notifications:scheduled` failed the >500 active-PM late-page fixture because page-one PM writes disappeared with the later failing page (`scripts/qa/test-my-notifications-scheduled.js:545`, then `:551`, `0 !== 1`).

GREEN is the minimal bounded correction:

- `scheduleNotificationDigests()` keeps only fixed per-Developer count/hash profile fingerprints across bounded keyset reads and resolves active profile IDs only for the current 500-row Bug page. The current Bug-page mapping is discarded after each callback; before/after fingerprints preserve active Developer profile validation without relying on a profile-per-user schema bound. All active ownership remains complete beyond historical/inactive rows and beyond 5,000 Bugs.
- `discoverScheduledNotifications()` captures each candidate page's immutable Pending Assignment anchors before opening PM work, then commits the candidate read root. Each active-PM page is processed in a fresh CAP root: at most 500 PM IDs are locked first, current pending Bugs are then locked/re-read, the captured anchors and role/status eligibility are reused/evaluated, and source/inbox/prompt writes commit as one PM-page unit. The keyset advances only after commit; a late page rolls back alone and a rerun reuses earlier source keys. A Bug closed or moved to a non-PM `nextProcessorRole` between PM units emits no stale PM event. Overdue processing remains a separate bounded `User -> DeveloperProfile -> Bug` root.

Fresh focused GREEN from the exact worktree:

```text
npm run qa:my-notifications:digest
IDTS My Notifications digest contract: PASS
exit_code=0

npm run qa:my-notifications:scheduled
IDTS My Notifications scheduled discovery contract: PASS
IDTS My Notifications digest contract: PASS
exit_code=0
```

The new fixtures assert actual persisted outcomes, bounded query/page shapes, independent CAP commit/rollback roots, source-key restart completeness, per-root User/Bug lock bounds, closure/role revalidation, and all active profile ownership. HANA/PostgreSQL live lock/isolation/cardinality and live scheduler/provider acceptance remain unverified. The pre-existing CAP attachment vocabulary warning and unrelated `qa:idts122:closed` authorization/test-harness concern remain unchanged. The Draft PR boundary remains NO-GO until one fresh scoped F4 review returns zero Critical/Major/Important.

DonHV đã duyệt đúng một remediation hẹp thêm bằng Luna/max sau khi hết cap final wave. Scope chỉ gồm hai phần F4 còn lại: bỏ retained DeveloperProfile aggregate unbounded nhưng giữ complete active ownership/persona validation, và giới hạn User/Bug lock cùng rollback/restart của active-PM theo từng page. Không gồm schema, dependency, lockfile, config, provider, live schedule, data, user/role, deploy, N5, push, PR, Ready, merge hoặc cleanup.

RED TDD được witness trước production edit bằng behavior real-CAP SQLite:

- `npm run qa:my-notifications:digest` fail fixture profile cardinality cao vì query cũ trả cả profile lịch sử inactive (`scripts/qa/test-my-notifications-digest.js:1096`); fixture có 700 profile lịch sử inactive cho mỗi Developer và profile active được Bug tham chiếu.
- `npm run qa:my-notifications:scheduled` fail fixture >500 PM active khi page muộn fail vì write PM page đầu biến mất cùng page sau (`scripts/qa/test-my-notifications-scheduled.js:545`, rồi `:551`, `0 !== 1`).

GREEN bounded tối thiểu:

- `scheduleNotificationDigests()` chỉ giữ fingerprint count/hash cố định theo từng Developer qua keyset read bounded và resolve profile ID active chỉ trong Bug page 500 hiện tại. Mapping Bug page được bỏ sau callback; fingerprint trước/sau giữ validation profile active mà không dựa vào schema unique profile/user. Mọi ownership active vẫn đầy đủ qua profile lịch sử/inactive bất kỳ và hơn 5.000 Bug.
- `discoverScheduledNotifications()` capture một lần anchor Pending Assignment bất biến của mỗi candidate page trước khi mở PM work rồi commit root candidate chỉ đọc. Mỗi page PM active chạy trong CAP root mới: lock tối đa 500 PM ID trước, lock/đọc lại Bug pending hiện tại, reuse anchor đã capture và kiểm role/status rồi commit source/inbox/prompt của page như một unit. Chỉ advance keyset sau commit; page lỗi muộn rollback riêng và rerun reuse source key cũ. Bug đóng hoặc đổi `nextProcessorRole` không còn là PM giữa các PM unit sẽ không sinh event PM stale. Overdue vẫn ở root bounded riêng theo `User -> DeveloperProfile -> Bug`.

Các fixture mới assert outcome persisted thật, query/page shape bounded, CAP root commit/rollback độc lập, restart đầy đủ qua source key, giới hạn User/Bug lock theo root, revalidation close/role, immutable anchor reuse across PM roots và complete active profile ownership. Lock/isolation/cardinality HANA/PostgreSQL live và acceptance scheduler/provider live vẫn chưa verify. Warning vocabulary attachment CAP và concern `qa:idts122:closed` 403 authorization/test-harness có trước giữ nguyên. Boundary Draft PR vẫn NO-GO tới khi một scoped F4 review mới trả zero Critical/Major/Important.

The additional anchor witness was intentionally RED before this final correction: a late HistoryLog inserted before PM page 2 made the prior per-page anchor read omit page-two SLA. After capturing Pending Assignment anchors in the bounded candidate root, `node scripts/qa/test-my-notifications-scheduled.js` is GREEN and both PM pages use the same immutable SLA clock. / Witness anchor bổ sung đã RED có chủ đích trước correction cuối: HistoryLog muộn trước PM page 2 làm cách đọc anchor theo từng page cũ bỏ SLA page 2. Sau khi capture anchor Pending Assignment trong root candidate bounded, `node scripts/qa/test-my-notifications-scheduled.js` GREEN và mọi PM page dùng cùng clock SLA bất biến.
