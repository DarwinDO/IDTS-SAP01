# WP7 My Notifications Roadmap

## English

### Status

`N1/N2 MERGED — N3 MERGED — N4 TASK 10 SOURCE COMPLETE; LOCAL COMMIT BOUNDARY`

### Authority

- Owner: DonHV.
- Original design baseline: `origin/dev` `e355f95d7d0eb61e2bd675a35709270454e62276`; refreshed Gate 6.5 dependency baseline: `origin/dev` `308aa847711e969cc770453f375bb5dbcf25a612`.
- Authoritative design: `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.
- Authoritative implementation plan: `docs/superpowers/plans/2026-08-26-my-notifications-and-prompt-email-implementation.md`.
- This roadmap does not authorize source/schema/runtime/external mutations.

### Sequence

1. N1 — persistence, caller-only service, read state, idempotency, 30-day Bug backfill.
2. N2 — native SAPUI5 inbox, badge, filtering, deep links, responsive/accessibility.
3. N3 — lifecycle/ownership/mention/escalation coverage and prompt immediate email.
4. N4 — Pending Assignment/Overdue, 4/24-hour SLA and weekday 08:00 digest.
5. N5 — Operations digest diagnostics, retry/idempotency and 90-day index retention.
6. N6 — separately approved additive migration, rollout, timestamped acceptance and rollback evidence.

Each gate freezes a fresh base, uses a dedicated worktree/branch, TDD, exact scope guards, one bounded independent review and one Draft PR, then stops before Ready/merge/deploy unless separately approved.

### Next boundary

N1 #361 and N2 #362 are merged; N3 is the merged predecessor at the frozen Task 10 base `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`. N4 Task 10 is locally source-complete on `feature/wp7-notifications-sla-digest-donhv`: bounded Pending Assignment/SLA/Overdue discovery, source-key idempotency, protected `NotificationService.processNotificationSchedules`, focused fixed-clock QA, and bilingual mirrors. The local commit is the only requested mutation; no PR, Ready, merge, deployment, migration, backfill, live email, provider, user/role/data or N5 action is claimed. Task 11 digest remains pending. Live UI remains rolled back; source completion is not runtime acceptance.

Fix round 1 addresses the exact-head review's four Important scheduler findings: immutable HistoryLogs SLA anchoring, lock/re-read state and recipient revalidation before writes, stable keyset paging, and immutable due-date cycle identity. Focused QA covers close/assignment/due-date candidate races and due-date reuse. Scoped re-review is still required before any PR, Ready, merge or rollout boundary.

## Tiếng Việt

### Trạng thái

`N1/N2 ĐÃ MERGE — N3 ĐÃ MERGE — N4 TASK 10 HOÀN TẤT SOURCE; BOUNDARY COMMIT LOCAL`

### Thẩm quyền

- Owner: DonHV.
- Baseline thiết kế ban đầu: `origin/dev` `e355f95d7d0eb61e2bd675a35709270454e62276`; baseline dependency Gate 6.5 đã refresh: `origin/dev` `308aa847711e969cc770453f375bb5dbcf25a612`.
- Thiết kế authority: `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.
- Implementation plan authority: `docs/superpowers/plans/2026-08-26-my-notifications-and-prompt-email-implementation.md`.
- Roadmap này không cho phép mutation source/schema/runtime/hệ thống ngoài.

### Thứ tự

1. N1 — persistence, service caller-only, read state, idempotency, backfill Bug 30 ngày.
2. N2 — inbox SAPUI5 native, badge, filter, deep link, responsive/accessibility.
3. N3 — lifecycle/ownership/mention/escalation và email nhanh bằng immediate kick.
4. N4 — Pending Assignment/Overdue, SLA 4/24 giờ và digest 08:00 ngày thường.
5. N5 — digest diagnostic trong Operations, retry/idempotency và retention index 90 ngày.
6. N6 — additive migration, rollout, acceptance timestamp và rollback evidence được duyệt riêng.

Mỗi gate freeze base mới, dùng worktree/branch riêng, TDD, exact scope guard, một independent review có giới hạn và một Draft PR, rồi dừng trước Ready/merge/deploy nếu chưa được duyệt riêng.

### Boundary tiếp theo

N1 #361 và N2 #362 đã merge; N3 là predecessor đã merge tại frozen base Task 10 `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`. N4 Task 10 đã hoàn tất source cục bộ trên `feature/wp7-notifications-sla-digest-donhv`: discovery Pending Assignment/SLA/Overdue bounded, idempotency source key, protected `NotificationService.processNotificationSchedules`, QA clock cố định và mirror song ngữ. Chỉ mutation commit local được yêu cầu; không claim PR, Ready, merge, deploy, migration, backfill, email thật, provider, user/role/data hay N5. Digest Task 11 vẫn pending. UI live vẫn rollback; source xong không phải runtime acceptance.

Fix round 1 xử lý bốn finding Important của review exact-head: anchor SLA bằng HistoryLogs bất biến, lock/đọc lại state và recipient trước khi write, paging keyset ổn định và identity cycle due date bất biến. QA focused cover race candidate khi close/assign/đổi due date và reuse due date. Vẫn cần scoped re-review trước boundary PR, Ready, merge hoặc rollout.
