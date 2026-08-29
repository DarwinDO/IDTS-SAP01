# N4 scheduler discovery activation cutoff — source evidence

## English

### Scope

This bounded remediation adds one optional `discoveryFrom` timestamp to the protected `NotificationService.processNotificationSchedules` action. It prevents the first scheduler activation from converting pre-activation Pending Assignment, SLA and Overdue cycles into new inbox/email records. It changes no database schema, Bug data, role, recipient selection, source-key format, digest snapshot policy, immediate email path, dependency, lockfile or MTA descriptor.

### Anchor policy

- Pending Assignment and SLA use the latest immutable status-entry `HistoryLogs.createdAt`, with immutable Bug `createdAt` only for legacy rows without that audit.
- Overdue uses the matching latest due-date HistoryLog timestamp for the current due-date cycle, with immutable Bug `createdAt` only for legacy rows without due-date history.
- Cycles before the cutoff are skipped; cycles exactly at or after it use the existing source-keyed transactional writer.
- Missing or invalid anchor timestamps fail closed when a cutoff is present. Invalid/blank cutoffs return `INVALID_DISCOVERY_CUTOFF` before discovery. Private server configuration `IDTS_NOTIFICATION_DISCOVERY_FROM` is authoritative in production and technical request data cannot override it.
- Omitting the parameter preserves existing explicitly controlled calls and regression behavior.

### TDD and verification

- RED: focused scheduled QA failed because the CDS action had no `discoveryFrom` parameter.
- GREEN: scheduled discovery and digest contracts pass with before/equal/after cutoff fixtures for Pending Assignment and due-date HistoryLog Overdue cycles, blank/invalid-input coverage and server-config precedence.
- Regression PASS: caller-only notification service, lifecycle event matrix, notification UI/shell, email outbox, immediate email kick and user-access notification suites.
- Static/security PASS: JavaScript syntax, CAP EDMX and HANA compile, secret scan, agent rules `8/8`, QA-depth self-test `15/15`, and `git diff --check`.
- CAP MCP was not callable in this session; the installed locked CAP compiler/runtime and real-CAP SQLite suites are the source evidence.

### Simplicity and boundaries

Ponytail selected the smallest shared-boundary change: one protected action parameter, two anchor comparisons and no new persistence/config subsystem. Canonical business documents remain unchanged because business notification policy, recipients, roles and lifecycle meaning are unchanged. Runtime rollout, scheduler configuration and live no-replay readback remain separate operational evidence.

## Tiếng Việt

### Phạm vi

Remediation bounded này thêm một timestamp tùy chọn `discoveryFrom` cho action được bảo vệ `NotificationService.processNotificationSchedules`. Nó ngăn lần bật scheduler đầu tiên biến cycle Pending Assignment, SLA và Overdue trước thời điểm kích hoạt thành inbox/email mới. Không đổi schema database, dữ liệu Bug, role, cách chọn recipient, format source key, policy snapshot digest, đường email immediate, dependency, lockfile hoặc MTA descriptor.

### Policy anchor

- Pending Assignment và SLA dùng `HistoryLogs.createdAt` bất biến mới nhất lúc vào status; chỉ fallback về Bug `createdAt` bất biến cho row legacy thiếu audit.
- Overdue dùng timestamp HistoryLog đổi due-date mới nhất khớp cycle due-date hiện tại; chỉ fallback về Bug `createdAt` bất biến cho row legacy thiếu due-date history.
- Cycle trước cutoff bị skip; cycle đúng hoặc sau cutoff đi qua writer transactional source-key hiện có.
- Khi có cutoff, anchor thiếu hoặc sai bị fail-closed. Cutoff sai/blank trả `INVALID_DISCOVERY_CUTOFF` trước discovery. Private server config `IDTS_NOTIFICATION_DISCOVERY_FROM` là authority ở production và technical request không override được.
- Không truyền tham số vẫn giữ behavior cũ của call vận hành đã kiểm soát và regression hiện có.

### TDD và verify

- RED: QA scheduled focused fail vì action CDS chưa có tham số `discoveryFrom`.
- GREEN: contract scheduled discovery/digest PASS với fixture trước/đúng/sau cutoff cho Pending Assignment và cycle Overdue có due-date HistoryLog, input blank/sai cùng precedence của server config.
- Regression PASS: notification caller-only service, lifecycle event matrix, UI/shell, email outbox, immediate email kick và user-access notification.
- Static/security PASS: syntax JavaScript, compile CAP EDMX/HANA, secret scan, agent rules `8/8`, QA-depth `15/15`, `git diff --check`.
- CAP MCP không callable trong session; compiler/runtime CAP khóa sẵn và real-CAP SQLite suite là evidence source.

### Tối giản và boundary

Ponytail chọn thay đổi nhỏ nhất tại shared boundary: một tham số action được bảo vệ, hai phép so anchor và không thêm persistence/config subsystem. Canonical business docs không đổi vì policy notification, recipient, role và ý nghĩa lifecycle không đổi. Rollout runtime, cấu hình scheduler và readback live không-replay là evidence vận hành riêng.

## Live rollout and closure / Rollout live và đóng gate

- The private live cutoff is `2026-08-29T02:43:41.368Z`. The generated CAP artifact was staged without DB/schema deployment; artifact-only Node `22.x` and `fast-xml-parser` `5.11.1` lock corrections left repository manifests and lockfiles unchanged.
- The first acceptance accidentally executed the previously assigned droplet, not the staged cutoff build. Run `1952a17c-db2f-4149-ba80-2a13d411be19` created 24 inbox/source rows and six unsent delivery rows. Discovery job `3368450` was deactivated immediately; no outbox worker/provider send ran. Guarded rollback task `n4-cutoff-rollback-0f2a41733f` deleted exactly those 24 inbox rows, 24 source rows and six attempt-zero `PENDING` deliveries, then proved zero remaining run sources.
- Root cause was corrected by assigning droplet `c2be63c9-4f4c-43a1-8de9-40e9b2862dd4` and restarting CAP. `npm run btp:demo:check` returned `DEMO READY` with CAP/AppRouter `1/1`, health/ready `200`, anonymous protected API `401` and Web `200`.
- Successful controlled run `a9b908bf-541e-48f3-bfb7-7672ba1178ba` returned HTTP `200`, `candidates=11`, `created=0`, `pendingAssignment=0`, `sla=0`, `overdue=0`, `skipped=16`. Poststate remained zero for all three historical source families and zero pending/failed deliveries.
- Job `3368450` is active with hourly schedule `0282b016-79d1-450b-a2df-b302a76f9245` on the BTP trial/free minimum cadence. Five-minute discovery still requires a paid scheduler plan; immediate event-triggered email remains independent.
- Codex Security exact-diff scan `26e165a9-e55d-4fbb-82c3-7af0d1f5383a` completed with zero findings across both executable review surfaces. The preceding scan failed only because its canonical artifact draft was absent and is not used as security evidence. TAC remained unavailable.

- Cutoff private trên live là `2026-08-29T02:43:41.368Z`. Artifact CAP generated được stage mà không deploy DB/schema; chỉnh Node `22.x` và lock `fast-xml-parser` `5.11.1` chỉ nằm trong artifact, không đổi manifest/lockfile repository.
- Acceptance đầu tiên đã chạy nhầm droplet cũ đang được assign, không phải build cutoff mới. Run `1952a17c-db2f-4149-ba80-2a13d411be19` tạo 24 row inbox/source và sáu delivery chưa gửi. Job discovery `3368450` được deactivate ngay; không chạy outbox worker/provider. Task rollback có guard `n4-cutoff-rollback-0f2a41733f` xóa đúng 24 inbox, 24 source và sáu delivery `PENDING` attempt-zero rồi chứng minh không còn source của run.
- Đã sửa root cause bằng cách assign droplet `c2be63c9-4f4c-43a1-8de9-40e9b2862dd4` và restart CAP. `npm run btp:demo:check` trả `DEMO READY` với CAP/AppRouter `1/1`, health/ready `200`, anonymous API bảo vệ `401`, Web `200`.
- Run kiểm soát thành công `a9b908bf-541e-48f3-bfb7-7672ba1178ba` trả HTTP `200`, `candidates=11`, `created=0`, ba bucket lịch sử đều bằng `0`, `skipped=16`. Poststate vẫn zero cho ba họ source lịch sử và zero delivery pending/failed.
- Job `3368450` đang active với lịch hourly `0282b016-79d1-450b-a2df-b302a76f9245`, đúng cadence tối thiểu của plan trial/free. Discovery năm phút vẫn cần plan scheduler trả phí; email immediate theo event không phụ thuộc lịch này.
- Codex Security scan exact diff `26e165a9-e55d-4fbb-82c3-7af0d1f5383a` hoàn tất với zero finding trên hai surface executable. Scan trước lỗi do thiếu canonical artifact draft và không được dùng làm security evidence. TAC vẫn không khả dụng.
