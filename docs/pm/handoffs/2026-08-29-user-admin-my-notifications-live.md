# User Administration and My Notifications — Merged and Live Handoff

## English

### Purpose and snapshot

This is the canonical handoff for a fresh IDTS chat session. It covers only the
User Administration and My Notifications capabilities that have both merged into
dev and been accepted as live on SAP BTP.

- Snapshot date: 2026-08-29 (Asia/Bangkok).
- Authoring baseline: origin/dev 1eb2d40050fcc19df5b84c1b41075e35485b46d3.
- User Administration through Gate 6.5 is merged, deployed, accepted and DEMO READY.
- My Notifications N1, N2, N3, N4 and N5-Lite are live; N5-Lite is closed.

This file is context, not authorization to modify source, deploy, send email, change a
user or role, run a scheduler, or update Drive. A future session must refresh the
current baseline before it acts.

### Read first in a new session

1. [Project context](../../project-context.md) and [AGENTS.md](../../../AGENTS.md).
2. [Current project status](../current-status.md), [task board](../task-board.md)
   and [DonHV status](../status/donhv.md).
3. This handoff, then [WP8 User Administration](../tasks/wp8-user-administration-roadmap.md)
   or [WP7 My Notifications](../tasks/wp7-my-notifications-roadmap.md).
4. The evidence path for the exact feature being changed.
5. Run git fetch origin --prune and record the new origin/dev SHA and merge-base.

Identify the member as donhv. Ask for one bounded next task when the user has not
already named it. A completed gate does not automatically authorize a later gate.

### User Administration — merged and live

| Area | What is live now | Merge anchor | Read before changing it |
| --- | --- | --- | --- |
| Foundation and Access Requests | PM + UserAdmin use a dedicated app for controlled invitation/onboarding and access provisioning. CAP remains authoritative; UI is not an authorization shortcut. | PR #318, 5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5 | [Manual acceptance](../evidence/user-administration/manual-acceptance-donhv-2026-08-20.md), [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md) |
| Active Users | Searchable, bounded list/details show safe access, identity link, readiness, pending operation and Developer-profile information. PM + UserAdmin are required; Testers are denied. | Gate 2 | [Gate 2 rollout](../evidence/user-administration/gate-2-active-users-rollout.md) |
| Lifecycle and legacy linking | Change Role, Suspend, Reactivate, Revoke and one-time Tester/Developer identity linking fail closed. Suspend blocks local access; Reactivate waits for provider readback. Existing internal Users.ID relationships remain intact. | Gates 3 and 3B | [Gate 3 rollout](../evidence/user-administration/gate-3-access-lifecycle-rollout.md), [Gate 3B evidence](../evidence/user-administration/gate-3b-existing-user-identity-link-source.md) |
| Developer Responsibilities | Developer profiles have availability, workload limit and responsibilities. The dedicated manage flow confirms impact, prevents duplicate submit and preserves existing Bug assignments. | PR #335, 7bf7609ca070fae0d467c4964051eee0956828ad | [CAP rollout](../evidence/user-administration/ua-developer-responsibilities-cap-rollout.md), [UI rollout](../evidence/user-administration/ua-developer-responsibilities-ui-rollout.md) |
| Business Catalogs | PM + UserAdmin manage four Bug/Developer classification catalogs with create, edit, deactivate/reactivate, impact check and audit. Hard delete is intentionally unavailable. | PR #337, eb0c5d1bc6c92557a7d41e45008240e1e929bc44 | [Gate 5 acceptance](../evidence/user-administration/gate-5-business-catalogs-live-acceptance-20260824.md) |
| Operations and Audit | A safe, bounded surface exposes masked Delivery, Provisioning and Audit summaries. It supports state-valid onboarding-delivery retry only, not raw provider, credential, identity or persistence data. | PR #339, 3f3efc113a4ebd708d3f88a314941e51817eb843 | [Gate 6 evidence](../evidence/user-administration/gate-6-operations-audit-source.md) |
| Navigation and action ownership | Five top-level areas are Access, Developers, Operations, Audit and Business Catalogs. Native UI isolates state, gives localized action help, wraps narrow dialog actions and keeps profile-only change in the Developer manage flow. | PR #340 and #346 | [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md) |
| Developer Workload and Bug drill-down | Developers to Workload is read-only and server-authorized: active PM sees permitted rows, a Developer sees only its own row, and other callers fail closed. Details split Technical Assignee from Current Action Owner, show non-Closed Bugs and deep-link to the exact Bug Object Page. identityAccessReady is server-derived. | PR #351, 5812b29f49a8a00ff79a877a347b911b0a851858 | [Gate 6.3 evidence](../evidence/user-administration/gate-6-3-developer-workload-source.md) |
| Cross-app navigation | Bug Management routes to User Administration and back in the same origin. UI visibility is a hint; AppRouter/CAP authorization remains authoritative. | PR #353 and #354, final 2993c707f7369e46c45ec2b105c30f9786f0d859 | [Gate 6.4 evidence](../evidence/user-administration/gate-6-4-cross-app-navigation-source.md) |
| Access-change email | Only eligible final APPLIED Role Change, Suspend, Reactivate or Revoke outcomes create access delivery. Responsibility-only, queued, failure, ambiguous and NOOP_ALREADY_DESIRED outcomes do not. Delivery is visible in unified Operations. | PR #358, e587aa5b1603d32c89ce01b4bcab9854f07eb157 | [Gate 6.5 rollout](../evidence/user-administration/gate-6-5-access-change-notifications-rollout.md) |

The controlled Gate 6.5 acceptance proved one eligible Suspend delivery/email.
Its Reactivate was a provider-side verified no-op, so it correctly made no second
delivery/email. Do not manufacture another real access change just to test an
alternate template.

### My Notifications — merged and live

| Increment | What is live now | Merge anchor | Read before changing it |
| --- | --- | --- | --- |
| N1 — caller-only inbox | Safe caller-only inbox rows, unread count/read state, idempotency and bounded 30-day Bug-notification backfill. Backfill never replays historical email. | PR #361, e35d09c0deef129f0d986457c847fe7fc28b90d4 | [N1 evidence](../evidence/my-notifications/n1-source-evidence.md), [WP7 roadmap](../tasks/wp7-my-notifications-roadmap.md) |
| N2 — inbox UI | Native SAPUI5 bell, badge, responsive popover, filters, paging, mark-read actions and safe Bug deep links. It preserves server order and polls only while visible. | PR #362, c722c355df5ff786d372002e20ab10864b4780ab | [N2 evidence](../evidence/my-notifications/n2-source-evidence.md) |
| N3 — event coverage and prompt email | Important lifecycle/ownership events, selected internal comment mentions, material Critical/Blocker escalation and selected final access-audit events reach the caller inbox. Eligible handoffs, mentions and material events use the existing post-commit immediate email kick. | PR #364, 90fa1ffddced13c54b2daec852dbaadf90ddf7dc | [N3 evidence](../evidence/my-notifications/n3-source-evidence.md), final [WP7 status](../tasks/wp7-my-notifications-roadmap.md) |
| N4 — discovery, SLA and Digest | Recovery/discovery adds Pending Assignment, Overdue and SLA reminders. Critical/Blocker reminders use four hours; normal reminders use 24 hours. Weekday 08:00 Asia/Bangkok Digest is supported. The free scheduler runs discovery hourly; event email stays immediate. | PR #365 and #367, N4 final 3e944e55c2a18fdcbeb7b00215c517fab3d92148 | [N4 acceptance](../evidence/my-notifications/n4-controlled-operational-acceptance-20260829.md) |
| N5-Lite — Digest diagnostics | PM + UserAdmin can filter read-only Digest delivery rows in User Administration → Operations → Delivery by Daily digest. The table has safe Type/Event/status/attempt/timestamp/error summaries; Digest rows cannot retry. Privileged search is capped at 20,000 candidates per request. | PR #368, 68f9cba580e4e5e69425ec02ab1b4361468fbb46 | [N5-Lite acceptance](../evidence/my-notifications/n5-lite-rollout-acceptance-20260829.md) |

The live N4 hourly discovery has a private no-replay cutoff. It intentionally ignores
historical Pending Assignment, SLA and Overdue cycles before activation. This does not
delay normal event-triggered prompt email.

### Evidence and terminology guardrails

- In-app notification is a persisted personal inbox event; it is not an email delivery.
- Email delivery is a separate safe outbox record using the shared provider, worker
  and retry/recovery path. Bug, invitation and access-change storage stay
  domain-specific.
- Immediate kick is the post-commit normal path for eligible urgent Bug/access email.
  The scheduler is recovery/discovery/digest infrastructure, not normal low latency.
- DEMO READY separately checks CAP, AppRouter, health, readiness, expected anonymous
  protected API denial and Web entry. It is not a blanket proof of every old browser path.

Primary evidence is the [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md),
the [User Administration evidence folder](../evidence/user-administration/), the
[WP7 roadmap](../tasks/wp7-my-notifications-roadmap.md), and the
[My Notifications evidence folder](../evidence/my-notifications/).

### Deliberate deferrals and evidence limits

- N6 is not open; any migration/rollout/rollback gate needs new approval.
- Manual Digest retry and automated retention cleanup are not implemented. N5-Lite
  intentionally keeps Digest rows read-only.
- Historical email replay is prohibited. Do not backfill/schedule old access audits or
  old Bug events just to create email.
- No synthetic live Digest row was created. N5-Lite live acceptance proves filter and
  reload; detail masking and no-Retry behavior are supported by source/contract evidence
  until a natural row exists.
- N2 has keyboard/focus/accessibility-tree evidence. A human NVDA speech-listening pass
  is optional and was not fabricated.
- Gate 6.4 has PM + UserAdmin round-trip acceptance. Independent current-session
  Tester/Developer browser recheck was unavailable; no user/role mutation was used to
  fabricate it.

### Safe continuation

1. Treat this handoff as context, not automatic new-feature authorization.
2. Freeze a fresh base and use a dedicated worktree/branch before nontrivial work.
3. Keep CAP authorization server-authoritative, maintain i18n and knowledge mirrors,
   add focused tests first, and separate source, PR, deployment and runtime claims.
4. Repository Markdown is canonical. The Google Drive folder named GSU26SAP01 is only a
   collaboration/review destination. Update/review Markdown first, then inspect the
   target folder and obtain explicit DonHV approval before any Drive write.
5. Do not change existing schedule activation/cutoff or create a test email/notification
   merely to make a screen look populated.

First question for the new session: Which single next outcome should we work on — a
User Administration capability, a My Notifications improvement, or a repository-first
documentation improvement for GSU26SAP01?

## Tiếng Việt

### Mục đích và snapshot

Đây là handoff canonical cho session chat IDTS mới. Nó chỉ bao gồm capability User
Administration và My Notifications đã vừa merge vào dev vừa được acceptance là live
trên SAP BTP.

- Ngày snapshot: 2026-08-29 (Asia/Bangkok).
- Baseline lúc viết: origin/dev 1eb2d40050fcc19df5b84c1b41075e35485b46d3.
- User Administration đã hoàn tất đến Gate 6.5, đã merge, deploy, acceptance và DEMO READY.
- My Notifications N1, N2, N3, N4 và N5-Lite đã live; N5-Lite đã đóng.

File này là context, không phải quyền tự động sửa source, deploy, gửi email, đổi
user/role, chạy scheduler hay cập nhật Drive. Session sau phải refresh baseline hiện
tại trước khi hành động.

### Bắt buộc đọc trước ở session mới

1. [Project context](../../project-context.md) và [AGENTS.md](../../../AGENTS.md).
2. [Current project status](../current-status.md), [task board](../task-board.md)
   và [DonHV status](../status/donhv.md).
3. Handoff này, rồi [WP8 User Administration](../tasks/wp8-user-administration-roadmap.md)
   hoặc [WP7 My Notifications](../tasks/wp7-my-notifications-roadmap.md).
4. Evidence path của đúng tính năng định sửa.
5. Chạy git fetch origin --prune rồi ghi lại SHA origin/dev và merge-base mới.

Xác định thành viên là donhv. Nếu user chưa nêu rõ, hỏi một task kế tiếp có phạm vi
hẹp. Gate đã xong không tự động cho phép mở gate sau.

### User Administration — đã merge và live

| Khu vực | Hành vi đang live | Merge anchor | Cần đọc trước khi sửa |
| --- | --- | --- | --- |
| Nền tảng và Access Requests | PM + UserAdmin có app riêng để onboarding/invite có kiểm soát và provision access. CAP vẫn là authority; UI không là đường tắt authorization. | PR #318, 5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5 | [Manual acceptance](../evidence/user-administration/manual-acceptance-donhv-2026-08-20.md), [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md) |
| Active Users | Danh sách/details Active Users có search/bounded hiển thị access, identity link, readiness, pending operation và Developer profile an toàn. Cần PM + UserAdmin; Tester bị từ chối. | Gate 2 | [Gate 2 rollout](../evidence/user-administration/gate-2-active-users-rollout.md) |
| Lifecycle và legacy linking | Change Role, Suspend, Reactivate, Revoke và link identity Tester/Developer có sẵn một lần đều fail-closed. Suspend chặn local access; Reactivate chờ provider readback. Quan hệ internal Users.ID vẫn được giữ. | Gate 3 và 3B | [Gate 3 rollout](../evidence/user-administration/gate-3-access-lifecycle-rollout.md), [Gate 3B evidence](../evidence/user-administration/gate-3b-existing-user-identity-link-source.md) |
| Developer Responsibilities | Developer profile có availability, workload limit và responsibility. Manage flow riêng có impact confirmation, guard submit trùng và giữ Bug assignment hiện có. | PR #335, 7bf7609ca070fae0d467c4964051eee0956828ad | [CAP rollout](../evidence/user-administration/ua-developer-responsibilities-cap-rollout.md), [UI rollout](../evidence/user-administration/ua-developer-responsibilities-ui-rollout.md) |
| Business Catalogs | PM + UserAdmin quản lý bốn catalog phân loại Bug/Developer bằng create, edit, deactivate/reactivate, impact check và audit. Hard delete được cố ý không hỗ trợ. | PR #337, eb0c5d1bc6c92557a7d41e45008240e1e929bc44 | [Gate 5 acceptance](../evidence/user-administration/gate-5-business-catalogs-live-acceptance-20260824.md) |
| Operations và Audit | Bề mặt bounded/an toàn hiển thị Delivery, Provisioning và Audit đã mask. Chỉ retry onboarding delivery đúng state, không expose provider, credential, identity hay persistence thô. | PR #339, 3f3efc113a4ebd708d3f88a314941e51817eb843 | [Gate 6 evidence](../evidence/user-administration/gate-6-operations-audit-source.md) |
| Navigation và ownership action | Năm khu vực top-level là Access, Developers, Operations, Audit và Business Catalogs. UI native giữ state tách, action help localized, wrap action ở dialog hẹp và để profile-only change trong manage flow Developer. | PR #340 và #346 | [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md) |
| Developer Workload và Bug drill-down | Developers to Workload read-only/server-authorized: PM active xem row được phép, Developer chỉ xem row mình, caller khác fail closed. Details tách Technical Assignee và Current Action Owner, show Bug non-Closed và deep-link đúng Bug Object Page. identityAccessReady do server derive. | PR #351, 5812b29f49a8a00ff79a877a347b911b0a851858 | [Gate 6.3 evidence](../evidence/user-administration/gate-6-3-developer-workload-source.md) |
| Cross-app navigation | Bug Management route sang User Administration và ngược lại trong cùng origin. UI visibility chỉ là hint; authorization AppRouter/CAP vẫn là authority. | PR #353 và #354, final 2993c707f7369e46c45ec2b105c30f9786f0d859 | [Gate 6.4 evidence](../evidence/user-administration/gate-6-4-cross-app-navigation-source.md) |
| Email thay đổi access | Chỉ Role Change, Suspend, Reactivate hoặc Revoke cuối cùng đủ điều kiện APPLIED mới tạo access delivery. Responsibility-only, queued, failure, ambiguous và NOOP_ALREADY_DESIRED không tạo. Delivery nằm trong Operations hợp nhất. | PR #358, e587aa5b1603d32c89ce01b4bcab9854f07eb157 | [Gate 6.5 rollout](../evidence/user-administration/gate-6-5-access-change-notifications-rollout.md) |

Acceptance Gate 6.5 chứng minh đúng một delivery/email Suspend đủ điều kiện. Reactivate
là provider-side no-op đã verify nên đúng ra không có delivery/email thứ hai. Không tự
tạo access change thật chỉ để test email template còn lại.

### My Notifications — đã merge và live

| Increment | Hành vi đang live | Merge anchor | Cần đọc trước khi sửa |
| --- | --- | --- | --- |
| N1 — inbox caller-only | Inbox row caller-only an toàn, unread count/read state, idempotency và Bug-notification backfill bounded 30 ngày. Backfill không replay email lịch sử. | PR #361, e35d09c0deef129f0d986457c847fe7fc28b90d4 | [N1 evidence](../evidence/my-notifications/n1-source-evidence.md), [WP7 roadmap](../tasks/wp7-my-notifications-roadmap.md) |
| N2 — inbox UI | Bell, badge, popover responsive, filter, paging, mark-read và deep link Bug an toàn bằng SAPUI5 native. Giữ server order và chỉ poll khi visible. | PR #362, c722c355df5ff786d372002e20ab10864b4780ab | [N2 evidence](../evidence/my-notifications/n2-source-evidence.md) |
| N3 — event coverage và email nhanh | Event lifecycle/ownership quan trọng, selected internal comment mention, Critical/Blocker escalation material và selected access-audit event cuối vào inbox caller. Handoff, mention và material event đủ điều kiện dùng immediate email kick sau commit. | PR #364, 90fa1ffddced13c54b2daec852dbaadf90ddf7dc | [N3 evidence](../evidence/my-notifications/n3-source-evidence.md), final [WP7 status](../tasks/wp7-my-notifications-roadmap.md) |
| N4 — discovery, SLA và Digest | Recovery/discovery có Pending Assignment, Overdue và SLA reminder. Critical/Blocker dùng bốn giờ; normal dùng 24 giờ. Có Digest 08:00 ngày thường Asia/Bangkok. Free scheduler chạy discovery hourly; event email vẫn immediate. | PR #365 và #367, N4 final 3e944e55c2a18fdcbeb7b00215c517fab3d92148 | [N4 acceptance](../evidence/my-notifications/n4-controlled-operational-acceptance-20260829.md) |
| N5-Lite — Digest diagnostics | PM + UserAdmin filter Digest delivery read-only trong User Administration → Operations → Delivery theo Daily digest. Bảng có Type/Event/status/attempt/timestamp/error an toàn; Digest row không retry được. Search đặc quyền capped 20.000 candidate/request. | PR #368, 68f9cba580e4e5e69425ec02ab1b4361468fbb46 | [N5-Lite acceptance](../evidence/my-notifications/n5-lite-rollout-acceptance-20260829.md) |

Hourly discovery N4 live có private no-replay cutoff. Nó cố ý bỏ qua Pending
Assignment, SLA và Overdue lịch sử trước activation. Điều này không làm chậm email
nhanh event-triggered thông thường.

### Guardrail evidence và thuật ngữ

- In-app notification là event inbox cá nhân đã persist; nó không giống email delivery.
- Email delivery là outbox record an toàn riêng, dùng chung provider, worker và
  retry/recovery path. Storage Bug, invitation và access-change vẫn domain-specific.
- Immediate kick là đường bình thường sau commit cho email Bug/access khẩn cấp đủ điều
  kiện. Scheduler là hạ tầng recovery/discovery/digest, không phải đường low latency.
- DEMO READY kiểm riêng CAP, AppRouter, health, readiness, expected anonymous protected
  API denial và Web entry; nó không phải bằng chứng chung cho mọi browser path cũ.

Evidence authority là [WP8 roadmap](../tasks/wp8-user-administration-roadmap.md),
[User Administration evidence](../evidence/user-administration/),
[WP7 roadmap](../tasks/wp7-my-notifications-roadmap.md) và
[My Notifications evidence](../evidence/my-notifications/).

### Defer có chủ đích và giới hạn evidence

- N6 chưa mở; migration/rollout/rollback gate mới cần approval mới.
- Retry Digest thủ công và retention cleanup tự động chưa implement. N5-Lite cố ý giữ
  Digest row read-only.
- Cấm replay email lịch sử. Không backfill/schedule access audit cũ hoặc Bug event cũ
  chỉ để tạo email.
- Không tạo Digest row live giả. N5-Lite live acceptance chứng minh filter/reload;
  detail masking/no-Retry được support bằng source/contract cho đến khi có row tự nhiên.
- N2 có keyboard/focus/accessibility-tree evidence. Human NVDA speech-listening pass
  là tùy chọn và không bịa PASS.
- Gate 6.4 có PM + UserAdmin round-trip acceptance. Tester/Developer browser recheck
  session hiện tại không có; không dùng user/role mutation để tạo ra nó.

### Session mới tiếp tục an toàn

1. Xem handoff là context, không là quyền tự động mở feature.
2. Freeze base mới và dùng worktree/branch riêng trước task không tầm thường.
3. Giữ CAP authorization server-authoritative, cập nhật i18n/knowledge mirror, viết
   focused test trước và tách claim source/PR/deploy/runtime.
4. Markdown repo là canonical. Thư mục Google Drive tên GSU26SAP01 chỉ là đích
   collaboration/review. Update/review Markdown trước, inspect folder và lấy approval
   DonHV mới trước mọi Drive write.
5. Không đổi schedule activation/cutoff hiện có hoặc tạo test email/notification chỉ để
   màn hình trông có dữ liệu.

Câu hỏi đầu tiên cho session mới: Kết quả kế tiếp duy nhất cần làm là gì — một
capability User Administration, cải thiện My Notifications, hay cải thiện tài liệu
repo-first cho GSU26SAP01?
