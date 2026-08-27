# WP7 My Notifications Roadmap

## English

### Status

`N1 MERGED — N2 SOURCE REVIEW GO; DRAFT PR HANDOFF NEXT`

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

N1 PR #361 merged at `e35d09c0deef129f0d986457c847fe7fc28b90d4`; this is the exact N2 base. N2 Tasks 5–6 are locally verified: OData client, native bell/badge/popover, filters, paging, read actions, safe deep link, i18n, lifecycle cleanup, responsive browser and focused lint/build. Existing PASS remains reused by DonHV confirmation. One bounded exact-head review and one Draft N2 PR remain. Migration, backfill execution, deployment, Ready/merge and N3 are unapproved.

## Tiếng Việt

### Trạng thái

`N1 ĐÃ MERGE — SOURCE N2 REVIEW GO; TIẾP THEO BÀN GIAO DRAFT PR`

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

N1 PR #361 đã merge tại `e35d09c0deef129f0d986457c847fe7fc28b90d4`, là base N2 chính xác. N2 Tasks 5–6 đã verify local: client OData, chuông/badge/popover native, filter, paging, read action, deep link an toàn, i18n, cleanup lifecycle, browser responsive và lint/build tập trung. Tiếp tục dùng PASS cũ theo xác nhận DonHV. Còn một review exact-head có giới hạn và một Draft N2 PR. Chưa duyệt migration, chạy backfill, deploy, Ready/merge hoặc N3.
