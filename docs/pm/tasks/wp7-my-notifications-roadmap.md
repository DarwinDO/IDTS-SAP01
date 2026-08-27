# WP7 My Notifications Roadmap

## English

### Status

`N1/N2 MERGED — N3 IN PROGRESS; SOURCE-ONLY DRAFT PR BOUNDARY`

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

N1 #361 and N2 #362 are merged; N3 froze exact base `c722c355df5ff786d372002e20ab10864b4780ab`. Tasks 7–9 are implemented and task-reviewed at `459782b660df938e99da5f3c3913d573166d03e8`: lifecycle/channel policy, selected mentions, upward escalation and final access indexing. Fresh integrated verification is green. Existing Knowledge Gate PASS is reused by DonHV confirmation. One final bounded whole-branch review, any required fix and one Draft PR remain. No Ready, merge, deployment, migration, backfill, live email or N4 is authorized. Live UI remains rolled back pending the coordinated rollout; source completion is not runtime acceptance.

## Tiếng Việt

### Trạng thái

`N1/N2 ĐÃ MERGE — N3 ĐANG LÀM; BOUNDARY CHỈ SOURCE VÀ DRAFT PR`

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

N1 #361 và N2 #362 đã merge; N3 freeze base `c722c355df5ff786d372002e20ab10864b4780ab`. Tasks 7–9 đã implement/task-review tại `459782b660df938e99da5f3c3913d573166d03e8`: lifecycle/kênh gửi, mention được chọn, escalation tăng mức và access index cuối. Full verification mới GREEN. Dùng lại Knowledge Gate PASS theo xác nhận DonHV. Còn final review toàn branch, fix nếu cần và một Draft PR. Không Ready, merge, deploy, migration, backfill, email thật hoặc N4. UI live vẫn rollback chờ rollout phối hợp; source xong không phải runtime acceptance.
