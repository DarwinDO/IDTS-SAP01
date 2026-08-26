# IDTS My Notifications and Prompt Email Delivery Design

## English

### 1. Status and authority

- Design owner: DonHV.
- Approved interactively: 2026-08-26, Asia/Bangkok.
- Frozen planning baseline: `origin/dev` at `e355f95d7d0eb61e2bd675a35709270454e62276`.
- Planning branch: `docs/wp8-my-notifications-design-donhv`.
- This document approves architecture and implementation planning only. It does not authorize product source changes, schema deployment, HANA/HDI migration, provider calls, real email, user/role/data mutation, Ready, merge, rollout, or release.

### 2. Business problem and goals

IDTS currently persists Bug notifications and email delivery rows, but it has no personal cross-domain inbox or persisted read state. Bug notifications are mainly visible inside one Bug Object Page. Email recovery on SAP BTP uses Job Scheduler, and a one-hour recovery interval can be mistaken for the normal delivery path.

The target outcome is:

1. one personal `My Notifications` inbox for Bug and material User Access events;
2. prompt email after important Bug status/ownership events, using the existing post-commit immediate worker kick;
3. scheduled work only for digest generation, SLA/overdue discovery, retry, and recovery;
4. server-authoritative recipient isolation and read state;
5. one shared email worker/transport/provider/retry pipeline rather than separate delivery systems.

Success means a normal important Bug event is queued in the business transaction and picked up within seconds after commit. It must not wait for the next hourly Job Scheduler run. If the immediate kick fails, the persisted outbox remains recoverable by Job Scheduler without losing the business change.

### 3. Current foundations to reuse

The baseline already has:

- Bug-bound `Notifications` as persisted in-app source events;
- `NotificationDeliveries` as the Bug email outbox;
- safe delivery status, attempts, retry time, sanitized failure details, and worker locks;
- `writeNotificationAndSchedule()` and `scheduleImmediateEmailOutbox()` for a one-shot post-commit kick;
- protected `processEmailOutbox()` for SAP Job Scheduler recovery;
- shared provider configuration and sender creation;
- User Administration access audit and the separately planned `UserAccessNotificationDeliveries` contract;
- same-origin Bug Management and User Administration navigation.

The design reuses these. It does not add Redis, RabbitMQ, BullMQ, SAP Event Mesh, a second worker, a second provider adapter, or a general workflow engine.

### 4. Chosen architecture

Use a federated inbox index rather than replacing the existing domain records.

```text
Bug event --------------------> Notifications --------------------> NotificationDeliveries
                                     |
                                     +----> UserNotificationInboxEntries

Material access audit event --> UserAccessAuditEvents -----------> UserAccessNotificationDeliveries
                                     |
                                     +----> UserNotificationInboxEntries

PENDING email delivery --post-commit immediate kick--> shared email worker --> provider
PENDING/retry delivery ----Job Scheduler recovery----> shared email worker --> provider
Scheduled due/SLA scan -------------------------------> inbox/outbox source records
Scheduled daily digest -------------------------------> NotificationDigestDeliveries
```

The domain event remains authoritative. `UserNotificationInboxEntries` stores recipient/read-state/index information and references exactly one source. It must not duplicate raw audit payloads or provider diagnostics.

### 5. Persistence design

#### 5.1 `UserNotificationInboxEntries`

Required fields:

- `ID` using CAP `cuid`;
- CAP `managed` timestamps;
- `recipient` association to `Users`, required;
- nullable association to one Bug `Notification` source;
- nullable association to one access audit source;
- `occurredAt`, required and copied from the source event time;
- `readAt`, nullable.

Invariants:

- exactly one source association is populated;
- recipient equals the source event recipient determined by CAP;
- one unique inbox entry per Bug notification;
- one unique inbox entry per eligible access audit event;
- clients cannot choose or change recipient/source/occurred time;
- deletion of an inbox index must not delete Bug history, Bug notification, access audit, or delivery history.

Do not add `dismissedAt`, snooze, per-event preferences, archive folders, or push tokens in the first release.

#### 5.2 `Notifications.sourceKey`

Add a nullable unique `sourceKey` for new idempotent producers. Historical rows may remain null. Examples:

- `STATUS:<historyEventID>:<recipientID>`;
- `MENTION:<commentID>:<recipientID>`;
- `OVERDUE:<bugID>:<dueDate>:<recipientID>`;
- `PENDING_ASSIGNMENT:<bugID>:<recipientID>`;
- `SLA:<bugID>:<threshold>:<recipientID>`.

The business transaction creates the event and delivery once. Immediate processing and recovery must reuse that delivery; they never create a replacement event merely because sending failed.

#### 5.3 `NotificationDigestDeliveries`

Digest delivery is one email containing multiple current work items, so it requires its own delivery row rather than pretending to be a single Bug notification.

Required fields:

- recipient;
- business date and digest type;
- window start, window end, and snapshot timestamp;
- item count;
- safe rendered subject, text, and HTML snapshot;
- status, attempt count, next attempt time;
- bounded lock fields and sanitized provider result fields compatible with the existing worker convention.

Unique key: `recipient + businessDate + digestType`.

Re-running the same schedule returns/reuses the existing row. Retry sends the stored snapshot and does not rebuild a different digest under the same key.

#### 5.4 Backfill and retention

- Backfill at most 30 days of existing Bug `Notifications` into inbox index rows.
- Do not generate new domain events or email deliveries during backfill.
- Do not backfill historical User Access audit events because old audit rows may not meet the new recipient/channel contract.
- Retain inbox index/read state for 90 days.
- Cleanup removes only expired index rows. Source Bug history, notifications, access audits, and business records remain governed by their own retention.

### 6. Service and authorization design

Create `NotificationService` at `/odata/v4/notification/`.

Every operation must:

1. require an authenticated session;
2. resolve exactly one active internal `Users` row;
3. preserve platform-role/business-role alignment;
4. scope by the resolved recipient before filtering, ordering, paging, counting, or mutation.

PM and UserAdmin do not receive authority to open another user's personal inbox. Delivery diagnostics remain in PM/UserAdmin Operations under their existing safe contract.

#### 6.1 API contract

`searchMyNotifications(category, readState, skip, top)`:

- category: `ALL`, `BUG`, or `ACCESS`;
- read state: `ALL`, `UNREAD`, or `READ`;
- default `top = 25`, maximum `100`;
- maximum `skip = 10000`;
- stable order: `occurredAt desc`, then `notificationID desc`;
- no free-text search in the first release because cross-source search would be incomplete or expensive.

`getMyUnreadNotificationCount()` returns only the caller's count.

`markMyNotificationRead(notificationID, expectedModifiedAt)`:

- lock the caller-owned row;
- use optimistic concurrency;
- return success idempotently when already read;
- return safe `404/403` semantics that do not reveal another user's notification;
- return `409` for a stale version when a state-changing update is still required.

`markAllMyNotificationsRead(throughOccurredAt)` marks only caller-owned unread rows at or before the UI snapshot. A notification arriving after the snapshot remains unread.

#### 6.2 Safe DTO

Expose only:

- notification ID;
- category and event type;
- localized title/summary inputs;
- priority and `actionRequired`;
- `occurredAt`, `readAt`, and `modifiedAt`;
- allowlisted `targetPath`.

Never expose raw audit IDs/details, recipient email, provider body/ID, HTML body, lock/lease/idempotency internals, identity hashes, tokens, credentials, endpoints, or raw errors.

#### 6.3 Bounded reads and deep links

- Read one bounded page of inbox entries.
- Bulk-read referenced Bug notifications once and referenced access audits once; no N+1 query per row.
- Bug target paths must match the allowlisted same-origin active Object Page route.
- Access role-change/reactivation entries may link to the appropriate safe Bug Management or User Administration landing route available to that user.
- Reject stored or client-provided external URLs and unsupported routes.

### 7. Notification and channel policy

Principles:

- action-required event: inbox plus prompt email;
- informational event: inbox;
- repetitive current-work reminder: inbox plus digest;
- technical delivery failure: Operations only;
- email failure never rolls back the committed Bug/access action or removes the inbox item.

#### 7.1 Bug lifecycle matrix

| Event | Recipient | In-app | Prompt email |
| --- | --- | --- | --- |
| Assigned or reassigned | New Developer | Yes | Yes |
| Assignment removed | Previous Developer | Yes | No |
| Need More Information | Reporter/current action owner | Yes | Yes |
| Resubmitted | Assigned Developer | Yes | Yes |
| Rejected | Current follow-up owner | Yes | Yes |
| Resolved | Tester/retest owner | Yes | Yes |
| Retest Required | Retest owner | Yes | Yes |
| Reopened | Assigned/current owner | Yes | Yes |
| Closed | Reporter | Yes | Yes |
| In Review/In Progress without owner change | None | No | No |
| In Review/In Progress with owner change | New current owner | Yes | Yes |

The prompt email uses the post-commit immediate kick and normally starts within seconds. It must not wait for the hourly recovery schedule.

Use specific stable event codes for new producers: `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED`, `COMMENT_MENTIONED`, `PRIORITY_ESCALATED`, `SEVERITY_ESCALATED`, `PENDING_ASSIGNMENT`, and `OVERDUE`. Preserve legacy codes for historical rows.

#### 7.2 Comment mention

- `@mention` creates in-app notification plus prompt email.
- The comment author is excluded.
- Duplicate mentions of the same user create one recipient event.
- UI sends selected internal `mentionedUserIDs`; CAP revalidates active identity and permission to read the Bug.
- Do not parse display names or emails from arbitrary comment text as authorization.
- Email includes only a safe excerpt capped at 200 characters and an allowlisted Bug link.
- A separate `CommentMentions` table is not required in the first release unless implementation evidence shows the source key is insufficient.

#### 7.3 Priority/severity escalation

- Create an inbox event only when priority or severity moves upward.
- Recipients are assignee and current action owner, deduplicated.
- Send prompt email only when resulting priority is Critical or severity is Critical/Blocker.
- Active PM recipients also receive the Critical/Blocker event unless already included.
- Downgrades and same-level edits produce no escalation event.

#### 7.4 Pending Assignment, SLA, and Overdue

- Pending Assignment creates an immediate inbox event for active PM recipients.
- Critical/Blocker Pending Assignment sends prompt email; normal levels appear in digest.
- SLA reminder thresholds are four hours for Critical/Blocker and 24 hours for other levels.
- One source-keyed SLA email is sent at the threshold; subsequent reminders remain in digest unless a materially new escalation occurs.
- Overdue creates an inbox item for the current action owner. A different assignee also receives an inbox-only item. PM receives digest coverage.
- Overdue does not send a separate email per Bug.
- A changed due date establishes a new overdue cycle and therefore a new source key.

#### 7.5 User Access and onboarding

- Applied role change and successful reactivation: inbox plus prompt email.
- Suspend and revoke: email only, because the affected user may no longer be able to open the inbox.
- Invitations: email only.
- Responsibility-only profile edits: audit only; do not generate notification spam.
- Delivery/provisioning failures and retries: safe Operations diagnostics only.

### 8. Email execution and scheduling

#### 8.1 Prompt path is primary

```text
business transaction
  -> persist source event + PENDING delivery
  -> commit succeeds
  -> scheduleImmediateEmailOutbox()
  -> shared worker claims due row
  -> shared provider sends
```

The immediate kick is best-effort orchestration after commit. Its failure must be logged safely and leave the durable outbox row recoverable.

#### 8.2 Job Scheduler duties

Job Scheduler is not the normal status-email latency mechanism. It is used for:

- recovery of due `PENDING`/retryable deliveries;
- discovery of Pending Assignment SLA breaches;
- discovery of new Overdue cycles;
- daily digest generation;
- retention cleanup.

The existing recovery cadence may remain one hour because the immediate path handles normal prompt delivery. Acceptance must prove this separation with timestamps.

#### 8.3 Concurrency and at-least-once behavior

- Immediate and scheduled workers may overlap.
- Existing claim/lock/status checks must ensure only one worker owns a due row at a time.
- A provider timeout after acceptance may still cause an at-least-once duplicate; do not claim exactly-once delivery without provider-supported idempotency.
- A business event is never duplicated merely to retry delivery.

### 9. Daily digest

- Generate at 08:00, Monday through Friday, in `Asia/Bangkok`.
- Do not send an empty digest.
- PM digest: Pending Assignment, Overdue, SLA breached, and unresolved Critical/Blocker items.
- Developer/Tester digest: overdue assigned/action-owned Bugs and items awaiting that user.
- Render at most 20 highest-priority items, followed by `and N more` with an allowlisted filtered queue link.
- Read current actionable state at snapshot time; completed items are excluded.
- Prompt emails remain independent. A Critical/Blocker or mention email is not delayed or suppressed merely because the item can also appear in a digest.
- Retry uses the stored digest snapshot. Failure appears in Operations as type `Digest` and never creates an end-user failure notification.

### 10. My Notifications UX

- Add a notification bell to the authenticated Bug Management header.
- Badge shows caller unread count, capped visually at `99+`.
- Desktop opens a native `ResponsivePopover`; narrow screens use its full-screen dialog behavior.
- Default page size is 25 with `Load More`.
- Filters: `All/Unread/Read` and `All/Bug/Access`.
- Each item shows category/event icon, title, safe summary, occurrence time, unread state, and `Action required` where applicable.
- Unread meaning must not rely on color alone.
- Selecting an item attempts mark-read and then opens the allowlisted target. A transient mark-read failure must not trap the user or hide a target they are authorized to open.
- `Mark all as read` uses the current snapshot timestamp.
- Preserve list filters, scroll, and route state when returning from a target.
- Refresh after the caller completes a relevant action, when the app/tab becomes visible, and poll unread count every 30 seconds only while visible.
- Do not add WebSocket, browser push, service worker push, or user notification preferences in the first release.

Accessibility acceptance includes keyboard operation, visible focus, correct focus return to the bell, accessible icon/button names, polite unread-count announcements, no unsolicited focus movement, WCAG AA contrast, 200% zoom, NVDA smoke, and layouts at 375, 768, 1366, and 1920 pixels.

### 11. Failure handling

- Source event/inbox write failure inside the business transaction fails that transaction rather than leaving a misleading partial state.
- Provider failure updates delivery state but never rolls back the committed business workflow.
- Inbox source hydration failure returns a safe row-level unavailable summary or safe service error; it must not expose another user's data.
- Invalid/stale read-state updates are idempotent or return a safe conflict.
- Scheduler repetition, timeout, or restart must not create duplicate source events/digests.
- Deep-link authorization is re-evaluated by the target CAP service; hiding a link in UI is not authorization.

### 12. Verification strategy

Each implementation gate must use TDD and include:

- positive event/channel behavior;
- wrong-role, inactive, unmapped, and cross-user access denial;
- paging, count, filter, ordering, and query-bypass resistance;
- duplicate producer and concurrent immediate/scheduled worker checks;
- optimistic read-state conflict and two-tab idempotency;
- mark-all snapshot race;
- provider failure/retry without business rollback;
- immediate-path timestamps proving status email does not wait for the hourly schedule;
- digest empty/weekend/time-zone/boundary/more-than-20/retry cases;
- persistence/reload, deep-link, responsive, keyboard, zoom, screen-reader, and user-facing-copy review;
- CAP EDMX/HANA compile, focused UI lint/build, secret scan, agent rules, QA-depth self-test, and exact diff guards.

No source gate advances while a Critical, Major, or Important review finding remains open.

### 13. Delivery sequence

Use provisional labels until each gate freezes its fresh `origin/dev` baseline:

1. **N1 — Persistence and service:** inbox index, authorization, read state, paging, source-key idempotency, 30-day Bug backfill.
2. **N2 — Inbox UI:** bell, badge, popover/dialog, filters, mark-read, deep links, responsive/accessibility.
3. **N3 — Event coverage:** lifecycle matrix, ownership changes, mentions, escalation, prompt immediate email kick.
4. **N4 — SLA and digest:** Pending Assignment/Overdue discovery, 4/24-hour SLA, weekday 08:00 digest.
5. **N5 — Operations and retention:** digest diagnostics/retry, duplicate protection, 90-day inbox-index cleanup.
6. **N6 — Controlled rollout:** additive migration approval, deployment, role/session browser acceptance, timestamped prompt-delivery acceptance, digest schedule acceptance, rollback evidence.

Every N-gate uses a dedicated branch/worktree, focused implementation plan, TDD, one bounded independent review, one Draft PR, and a stop before Ready/merge/deploy unless DonHV separately authorizes the next boundary.

### 14. Explicitly out of scope

- SAP Build Work Zone Notification Center integration;
- SAP Alert Notification as the user inbox;
- mobile/browser push notifications;
- WebSocket/SSE real-time infrastructure;
- per-user channel preferences, snooze, dismissal, archive folders, notification rules editor;
- third-party chat/webhook channels;
- general workflow/task engine;
- new provider SDK, message broker, scheduler service, or email worker;
- rewriting or emailing historical access events;
- exposing provider, identity, credential, lock, raw audit, or internal implementation details.

### 15. Open implementation checks, not design decisions

- Confirm the exact native SAPUI5 controls and supported APIs through UI5/Fiori MCP at the N2 baseline.
- Confirm the final CAP constraint syntax and HANA-portable indexes through CAP MCP at N1.
- Measure the deployed immediate-kick latency and worker overlap before choosing operational alert thresholds.
- Confirm whether the existing recovery cadence remains one hour after production evidence; changing it is not required for prompt delivery.

These checks may refine implementation mechanics but must not reverse the approved business/channel policy without a new DonHV decision.

---

## Tiếng Việt

### 1. Trạng thái và thẩm quyền

- Chủ sở hữu thiết kế: DonHV.
- Được duyệt trong trao đổi: 2026-08-26, Asia/Bangkok.
- Baseline planning đã đóng băng: `origin/dev` tại `e355f95d7d0eb61e2bd675a35709270454e62276`.
- Branch planning: `docs/wp8-my-notifications-design-donhv`.
- Tài liệu này chỉ duyệt kiến trúc và bước lập implementation plan. Nó không cho phép sửa source sản phẩm, deploy schema, migrate HANA/HDI, gọi provider, gửi email thật, mutate user/role/data, chuyển Ready, merge, rollout hoặc release.

### 2. Vấn đề nghiệp vụ và mục tiêu

IDTS hiện đã persist Bug notification và email delivery row nhưng chưa có inbox cá nhân liên domain hoặc read state được lưu. Bug notification chủ yếu chỉ thấy trong Object Page của từng Bug. SAP BTP dùng Job Scheduler để recovery email và khoảng chạy một giờ dễ bị hiểu nhầm là đường gửi bình thường.

Kết quả mục tiêu:

1. một inbox cá nhân `My Notifications` cho Bug và sự kiện User Access quan trọng;
2. email nhanh sau event status/ownership Bug quan trọng bằng immediate worker kick sau commit hiện có;
3. chỉ dùng lịch cho digest, phát hiện SLA/overdue, retry và recovery;
4. recipient isolation và read state do server làm authority;
5. dùng chung một pipeline worker/transport/provider/retry thay vì tách nhiều hệ thống gửi.

Thành công nghĩa là event Bug quan trọng bình thường được queue trong transaction nghiệp vụ và worker nhận trong vài giây sau commit. Nó không được chờ lần Job Scheduler một giờ tiếp theo. Nếu immediate kick lỗi, outbox đã persist vẫn được Job Scheduler recovery mà không làm mất thay đổi nghiệp vụ.

### 3. Nền tảng hiện có cần tái sử dụng

Baseline đã có:

- `Notifications` gắn với Bug làm source event in-app đã persist;
- `NotificationDeliveries` làm Bug email outbox;
- delivery status, số lần thử, thời gian retry, lỗi đã sanitize và worker lock;
- `writeNotificationAndSchedule()` cùng `scheduleImmediateEmailOutbox()` để kick một lần sau commit;
- `processEmailOutbox()` được bảo vệ cho SAP Job Scheduler recovery;
- provider config và sender dùng chung;
- User Administration access audit cùng contract `UserAccessNotificationDeliveries` đã được plan riêng;
- route cùng origin giữa Bug Management và User Administration.

Thiết kế tái sử dụng các phần này. Không thêm Redis, RabbitMQ, BullMQ, SAP Event Mesh, worker thứ hai, provider adapter thứ hai hoặc workflow engine tổng quát.

### 4. Kiến trúc được chọn

Dùng inbox index liên kết nhiều nguồn thay vì thay thế record theo domain.

```text
Bug event --------------------> Notifications --------------------> NotificationDeliveries
                                     |
                                     +----> UserNotificationInboxEntries

Access audit quan trọng ------> UserAccessAuditEvents -----------> UserAccessNotificationDeliveries
                                     |
                                     +----> UserNotificationInboxEntries

PENDING email --immediate kick sau commit--> worker dùng chung --> provider
PENDING/retry --Job Scheduler recovery-----> worker dùng chung --> provider
Quét due/SLA theo lịch ---------------------> source inbox/outbox
Daily digest theo lịch ---------------------> NotificationDigestDeliveries
```

Domain event vẫn là authority. `UserNotificationInboxEntries` chỉ giữ recipient/read-state/index và tham chiếu đúng một source; không duplicate raw audit payload hoặc provider diagnostic.

### 5. Thiết kế persistence

#### 5.1 `UserNotificationInboxEntries`

Field bắt buộc:

- `ID` dùng CAP `cuid`;
- timestamp của CAP `managed`;
- association `recipient` bắt buộc tới `Users`;
- association nullable tới một source Bug `Notification`;
- association nullable tới một source access audit;
- `occurredAt` bắt buộc, copy từ thời gian source event;
- `readAt` nullable.

Invariant:

- đúng một source association có giá trị;
- recipient khớp recipient source event do CAP quyết định;
- mỗi Bug notification chỉ có một inbox entry;
- mỗi access audit event đủ điều kiện chỉ có một inbox entry;
- client không được chọn hoặc sửa recipient/source/occurred time;
- xóa inbox index không được xóa Bug history, Bug notification, access audit hoặc delivery history.

Release đầu không thêm `dismissedAt`, snooze, preference theo event, archive folder hoặc push token.

#### 5.2 `Notifications.sourceKey`

Thêm `sourceKey` nullable và unique cho producer mới cần idempotency. Row lịch sử có thể tiếp tục null. Ví dụ:

- `STATUS:<historyEventID>:<recipientID>`;
- `MENTION:<commentID>:<recipientID>`;
- `OVERDUE:<bugID>:<dueDate>:<recipientID>`;
- `PENDING_ASSIGNMENT:<bugID>:<recipientID>`;
- `SLA:<bugID>:<threshold>:<recipientID>`.

Transaction nghiệp vụ tạo event và delivery đúng một lần. Immediate processing và recovery tái sử dụng delivery đó; không tạo event thay thế chỉ vì gửi thất bại.

#### 5.3 `NotificationDigestDeliveries`

Digest là một email chứa nhiều current work item nên có delivery row riêng, không giả thành notification của một Bug.

Field bắt buộc:

- recipient;
- business date và digest type;
- window start, window end và snapshot timestamp;
- item count;
- snapshot subject, text và HTML an toàn đã render;
- status, attempt count, next attempt time;
- field lock có giới hạn và provider result đã sanitize, tương thích convention worker hiện có.

Unique key: `recipient + businessDate + digestType`.

Chạy lại cùng lịch sẽ trả về/tái sử dụng row hiện có. Retry gửi snapshot đã lưu, không dựng digest khác dưới cùng key.

#### 5.4 Backfill và retention

- Backfill tối đa 30 ngày `Notifications` Bug hiện có sang inbox index.
- Không tạo domain event hoặc email delivery mới khi backfill.
- Không backfill access audit lịch sử vì row cũ có thể không đáp ứng contract recipient/channel mới.
- Giữ inbox index/read state trong 90 ngày.
- Cleanup chỉ xóa index row hết hạn. Bug history, notification nguồn, access audit và business record theo retention riêng.

### 6. Thiết kế service và authorization

Tạo `NotificationService` tại `/odata/v4/notification/`.

Mọi operation phải:

1. yêu cầu session đã xác thực;
2. resolve đúng một `Users` internal active;
3. giữ platform-role/business-role alignment;
4. scope theo recipient đã resolve trước filter, order, page, count hoặc mutation.

PM và UserAdmin không được mở inbox cá nhân của user khác. Delivery diagnostic vẫn nằm trong Operations PM/UserAdmin theo contract an toàn hiện có.

#### 6.1 API contract

`searchMyNotifications(category, readState, skip, top)`:

- category: `ALL`, `BUG` hoặc `ACCESS`;
- read state: `ALL`, `UNREAD` hoặc `READ`;
- mặc định `top = 25`, tối đa `100`;
- `skip` tối đa `10000`;
- order ổn định: `occurredAt desc`, rồi `notificationID desc`;
- release đầu không có free-text search vì search nhiều source có thể thiếu hoặc quá tốn.

`getMyUnreadNotificationCount()` chỉ trả count của caller.

`markMyNotificationRead(notificationID, expectedModifiedAt)`:

- lock row thuộc caller;
- dùng optimistic concurrency;
- trả success idempotent nếu đã đọc;
- dùng semantics `404/403` an toàn, không tiết lộ notification của user khác;
- trả `409` cho version stale nếu vẫn cần state-changing update.

`markAllMyNotificationsRead(throughOccurredAt)` chỉ đánh dấu row chưa đọc của caller tại hoặc trước snapshot UI. Notification đến sau snapshot vẫn chưa đọc.

#### 6.2 DTO an toàn

Chỉ expose:

- notification ID;
- category và event type;
- input title/summary đã localize;
- priority và `actionRequired`;
- `occurredAt`, `readAt`, `modifiedAt`;
- `targetPath` theo allowlist.

Không expose raw audit ID/detail, recipient email, provider body/ID, HTML body, lock/lease/idempotency internal, identity hash, token, credential, endpoint hoặc raw error.

#### 6.3 Read có giới hạn và deep link

- Đọc một page inbox entry có giới hạn.
- Bulk-read Bug notification tham chiếu đúng một lần và access audit tham chiếu đúng một lần; không N+1 theo row.
- Bug target path phải khớp route Object Page active cùng origin được allowlist.
- Access role-change/reactivation có thể link tới landing route Bug Management hoặc User Administration an toàn mà user đó có quyền mở.
- Reject URL ngoài và route không hỗ trợ được lưu hoặc gửi từ client.

### 7. Chính sách notification và channel

Nguyên tắc:

- event cần hành động: inbox cộng email nhanh;
- event chỉ cung cấp thông tin: inbox;
- nhắc current work lặp lại: inbox cộng digest;
- lỗi delivery kỹ thuật: chỉ Operations;
- email lỗi không rollback Bug/access action đã commit hoặc xóa inbox item.

#### 7.1 Matrix vòng đời Bug

| Event | Recipient | In-app | Email nhanh |
| --- | --- | --- | --- |
| Assign hoặc reassign | Developer mới | Có | Có |
| Bỏ assignment | Developer cũ | Có | Không |
| Need More Information | Reporter/current action owner | Có | Có |
| Resubmit | Developer được assign | Có | Có |
| Rejected | Current follow-up owner | Có | Có |
| Resolved | Tester/retest owner | Có | Có |
| Retest Required | Retest owner | Có | Có |
| Reopened | Assigned/current owner | Có | Có |
| Closed | Reporter | Có | Có |
| In Review/In Progress không đổi owner | Không ai | Không | Không |
| In Review/In Progress có đổi owner | Current owner mới | Có | Có |

Email nhanh dùng post-commit immediate kick và bình thường bắt đầu trong vài giây. Nó không được chờ lịch recovery một giờ.

Dùng stable event code cụ thể cho producer mới: `RESOLVED`, `RETEST_REQUIRED`, `REOPENED`, `RESUBMITTED`, `REASSIGNED`, `RETEST_OWNER_CHANGED`, `COMMENT_MENTIONED`, `PRIORITY_ESCALATED`, `SEVERITY_ESCALATED`, `PENDING_ASSIGNMENT`, `OVERDUE`. Giữ code legacy cho row lịch sử.

#### 7.2 Mention trong comment

- `@mention` tạo in-app notification cộng email nhanh.
- Loại tác giả comment khỏi recipient.
- Mention lặp cùng user chỉ tạo một recipient event.
- UI gửi internal `mentionedUserIDs` đã chọn; CAP revalidate identity active và quyền đọc Bug.
- Không parse display name hoặc email tùy ý từ comment text để làm authorization.
- Email chỉ có excerpt an toàn tối đa 200 ký tự và link Bug allowlist.
- Release đầu không cần bảng `CommentMentions` riêng trừ khi evidence implementation cho thấy source key không đủ.

#### 7.3 Escalation priority/severity

- Chỉ tạo inbox event khi priority hoặc severity tăng.
- Recipient là assignee và current action owner, đã dedupe.
- Chỉ gửi email nhanh nếu priority mới là Critical hoặc severity mới là Critical/Blocker.
- PM active cũng nhận event Critical/Blocker trừ khi đã nằm trong recipient.
- Downgrade hoặc cùng level không tạo escalation event.

#### 7.4 Pending Assignment, SLA và Overdue

- Pending Assignment tạo inbox event ngay cho PM active.
- Pending Assignment Critical/Blocker gửi email nhanh; mức thường vào digest.
- Ngưỡng nhắc SLA là bốn giờ cho Critical/Blocker và 24 giờ cho mức khác.
- Gửi đúng một SLA email có source key tại threshold; nhắc sau đó chỉ nằm trong digest trừ khi có escalation mới có ý nghĩa.
- Overdue tạo inbox item cho current action owner. Nếu assignee khác người đó thì assignee nhận thêm inbox-only item. PM theo dõi qua digest.
- Overdue không gửi email riêng cho từng Bug.
- Due date thay đổi tạo overdue cycle mới và source key mới.

#### 7.5 User Access và onboarding

- Role change đã Applied và reactivation thành công: inbox cộng email nhanh.
- Suspend và revoke: chỉ email vì user bị ảnh hưởng có thể không còn mở được inbox.
- Invitation: chỉ email.
- Chỉ sửa profile responsibility: chỉ audit, không tạo notification spam.
- Delivery/provisioning fail và retry: chỉ diagnostic an toàn trong Operations.

### 8. Thực thi email và scheduling

#### 8.1 Đường gửi nhanh là chính

```text
transaction nghiệp vụ
  -> persist source event + PENDING delivery
  -> commit thành công
  -> scheduleImmediateEmailOutbox()
  -> worker dùng chung claim row đến hạn
  -> provider dùng chung gửi
```

Immediate kick là orchestration best-effort sau commit. Nếu nó lỗi thì phải log an toàn và giữ outbox row bền vững để recovery.

#### 8.2 Nhiệm vụ của Job Scheduler

Job Scheduler không phải cơ chế latency email status bình thường. Nó dùng cho:

- recovery delivery `PENDING`/retryable đã đến hạn;
- phát hiện Pending Assignment vượt SLA;
- phát hiện overdue cycle mới;
- tạo daily digest;
- cleanup retention.

Recovery cadence hiện có có thể giữ một giờ vì immediate path xử lý prompt delivery bình thường. Acceptance phải chứng minh sự tách biệt này bằng timestamp.

#### 8.3 Concurrency và at-least-once

- Immediate worker và scheduled worker có thể chạy trùng thời điểm.
- Claim/lock/status hiện có phải bảo đảm chỉ một worker sở hữu row đến hạn tại một thời điểm.
- Provider timeout sau khi provider đã nhận có thể vẫn gây duplicate theo at-least-once; không tuyên bố exactly-once nếu chưa có provider idempotency.
- Không tạo lại business event chỉ để retry delivery.

### 9. Daily digest

- Tạo lúc 08:00 từ thứ Hai đến thứ Sáu theo `Asia/Bangkok`.
- Không gửi digest rỗng.
- Digest PM: Pending Assignment, Overdue, vượt SLA và Critical/Blocker chưa xử lý.
- Digest Developer/Tester: Bug overdue được assign/action-owned và item đang chờ chính user đó.
- Render tối đa 20 item ưu tiên cao nhất, sau đó ghi `và N mục khác` với link queue đã filter theo allowlist.
- Đọc trạng thái cần hành động hiện tại tại thời điểm snapshot; item đã hoàn thành bị loại.
- Email nhanh vẫn độc lập. Critical/Blocker hoặc mention không bị trì hoãn/bỏ chỉ vì item cũng có thể vào digest.
- Retry dùng snapshot digest đã lưu. Lỗi hiện trong Operations với type `Digest` và không tạo failure notification cho end user.

### 10. UX My Notifications

- Thêm chuông notification vào header Bug Management sau đăng nhập.
- Badge hiện unread count của caller, tối đa trực quan `99+`.
- Desktop mở `ResponsivePopover` native; màn hẹp dùng hành vi dialog toàn màn hình.
- Page mặc định 25 item và có `Load More`.
- Filter: `All/Unread/Read` và `All/Bug/Access`.
- Mỗi item có icon category/event, title, summary an toàn, thời gian xảy ra, unread state và `Action required` khi phù hợp.
- Không chỉ dùng màu để biểu diễn unread.
- Chọn item sẽ thử mark-read rồi mở target allowlist. Lỗi mark-read tạm thời không được giữ user lại hoặc giấu target mà họ có quyền mở.
- `Mark all as read` dùng snapshot timestamp hiện tại.
- Giữ filter, scroll và route state khi quay về từ target.
- Refresh sau action liên quan của caller, khi app/tab visible lại, và poll unread count mỗi 30 giây chỉ lúc visible.
- Release đầu không thêm WebSocket, browser push, service-worker push hoặc notification preference.

Acceptance accessibility gồm vận hành bàn phím, focus rõ, trả focus về chuông khi đóng, tên accessible cho icon/button, thông báo unread count ở mức polite, không tự giật focus, tương phản WCAG AA, zoom 200%, smoke NVDA và layout tại 375, 768, 1366, 1920 pixel.

### 11. Xử lý lỗi

- Lỗi ghi source event/inbox trong transaction nghiệp vụ làm transaction đó fail thay vì để partial state gây hiểu nhầm.
- Lỗi provider chỉ cập nhật delivery state, không rollback workflow nghiệp vụ đã commit.
- Lỗi hydrate source inbox trả summary unavailable an toàn theo row hoặc service error an toàn; không lộ dữ liệu user khác.
- Update read-state sai/stale phải idempotent hoặc trả conflict an toàn.
- Scheduler lặp, timeout hoặc restart không tạo trùng source event/digest.
- Target CAP service kiểm tra lại quyền deep link; ẩn link trong UI không phải authorization.

### 12. Chiến lược kiểm định

Mỗi implementation gate dùng TDD và bao gồm:

- hành vi event/channel positive;
- deny wrong-role, inactive, unmapped và cross-user;
- paging, count, filter, order và chống query bypass;
- duplicate producer cùng concurrency immediate/scheduled worker;
- optimistic read-state conflict và idempotency hai tab;
- race của mark-all snapshot;
- provider failure/retry không rollback business;
- timestamp immediate path chứng minh status email không chờ lịch một giờ;
- case digest empty/weekend/time-zone/boundary/hơn 20/retry;
- persistence/reload, deep-link, responsive, keyboard, zoom, screen reader và review user-facing copy;
- CAP EDMX/HANA compile, UI lint/build tập trung, secret scan, agent rules, QA-depth self-test và exact diff guard.

Không source gate nào được đi tiếp nếu còn finding Critical, Major hoặc Important.

### 13. Thứ tự delivery

Dùng label tạm cho tới khi mỗi gate freeze baseline `origin/dev` mới:

1. **N1 — Persistence và service:** inbox index, authorization, read state, paging, source-key idempotency, backfill Bug 30 ngày.
2. **N2 — Inbox UI:** chuông, badge, popover/dialog, filter, mark-read, deep link, responsive/accessibility.
3. **N3 — Event coverage:** lifecycle matrix, ownership change, mention, escalation, email nhanh bằng immediate kick.
4. **N4 — SLA và digest:** phát hiện Pending Assignment/Overdue, SLA 4/24 giờ, digest 08:00 ngày thường.
5. **N5 — Operations và retention:** digest diagnostic/retry, chống trùng, cleanup inbox index 90 ngày.
6. **N6 — Controlled rollout:** duyệt additive migration, deploy, acceptance browser theo role/session, acceptance timestamp prompt delivery, acceptance lịch digest và bằng chứng rollback.

Mỗi N-gate có branch/worktree riêng, implementation plan tập trung, TDD, một independent review có giới hạn, một Draft PR và dừng trước Ready/merge/deploy nếu DonHV chưa duyệt boundary tiếp theo.

### 14. Ngoài phạm vi rõ ràng

- tích hợp SAP Build Work Zone Notification Center;
- dùng SAP Alert Notification làm inbox user;
- push notification mobile/browser;
- hạ tầng realtime WebSocket/SSE;
- preference channel theo user, snooze, dismiss, archive folder, notification rules editor;
- channel chat/webhook bên thứ ba;
- workflow/task engine tổng quát;
- provider SDK, message broker, scheduler service hoặc email worker mới;
- rewrite hoặc email access event lịch sử;
- expose provider, identity, credential, lock, raw audit hoặc chi tiết implementation internal.

### 15. Check implementation còn mở, không phải quyết định thiết kế

- Xác nhận chính xác SAPUI5 native control/API được hỗ trợ qua UI5/Fiori MCP tại baseline N2.
- Xác nhận constraint syntax CAP và index portable HANA qua CAP MCP tại N1.
- Đo latency immediate kick và overlap worker sau deploy trước khi chọn operational alert threshold.
- Xác nhận recovery cadence hiện có có tiếp tục một giờ sau evidence production; không cần đổi cadence để có prompt delivery.

Các check này có thể tinh chỉnh mechanics implementation nhưng không được đảo chính sách business/channel đã duyệt nếu chưa có quyết định DonHV mới.
