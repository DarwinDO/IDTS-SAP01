# WP7 My Notifications Roadmap

## English

### Status

`DESIGN APPROVED — IMPLEMENTATION PLAN NOT STARTED`

### Authority

- Owner: DonHV.
- Design baseline: `origin/dev` `e355f95d7d0eb61e2bd675a35709270454e62276`.
- Authoritative design: `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.
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

DonHV reviews the written design spec. After approval, create a detailed implementation plan; do not start N1 source work in the planning branch.

## Tiếng Việt

### Trạng thái

`ĐÃ DUYỆT THIẾT KẾ — CHƯA BẮT ĐẦU IMPLEMENTATION PLAN`

### Thẩm quyền

- Owner: DonHV.
- Baseline thiết kế: `origin/dev` `e355f95d7d0eb61e2bd675a35709270454e62276`.
- Thiết kế authority: `docs/superpowers/specs/2026-08-26-my-notifications-and-delivery-design.md`.
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

DonHV review design spec đã viết. Sau khi duyệt mới tạo implementation plan chi tiết; không bắt đầu source N1 trong planning branch.
