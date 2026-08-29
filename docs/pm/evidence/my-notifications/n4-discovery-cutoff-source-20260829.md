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
