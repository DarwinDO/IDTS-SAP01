# WP7 My Notifications Roadmap

## English

### Status

`N1 SOURCE VERIFIED — DRAFT PR #361 OPEN; STOP BEFORE MERGE/DEPLOY/N2`

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

Planning PR #360 and Gate 6.5 are merged. N1 uses exact base `8ac9327b93b70633e96d2b6f09bb379a5afb681f`; Tasks 1–4 and the fresh full matrix are complete. Same-reviewer re-review at `7dad8f18e148568d83380cabf2deba80eb432398` returned zero Critical/Major/Important/Minor. DonHV reaffirmed existing PASS and authorized push plus one Draft N1 PR. Reuse the original notification gate dated 2026-08-12 (100%) and 2026-08-20 composite (90%) linked in `docs/pm/evidence/my-notifications/n1-source-evidence.md`; this supersedes the mistaken daily-assessment HOLD, not a new assessment or source-derived human PASS. Migration, backfill execution, deployment and N2 remain unapproved.

## Tiếng Việt

### Trạng thái

`SOURCE N1 ĐÃ KIỂM ĐỊNH — DRAFT PR #361 ĐÃ MỞ; DỪNG TRƯỚC MERGE/DEPLOY/N2`

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

Planning PR #360 và Gate 6.5 đã merge. N1 dùng base chính xác `8ac9327b93b70633e96d2b6f09bb379a5afb681f`; Tasks 1–4 và full matrix mới đã hoàn tất. Cùng reviewer kiểm lại tại `7dad8f18e148568d83380cabf2deba80eb432398` với 0 Critical/Major/Important/Minor. DonHV xác nhận lại PASS đã có và duyệt push cùng một Draft PR N1. Tái sử dụng gate notification ngày 12/08/2026 (100%) và composite 20/08 (90%) được dẫn trong `docs/pm/evidence/my-notifications/n1-source-evidence.md`; thay thế HOLD đánh giá theo ngày đã ghi nhầm, không phải bài đánh giá mới hay human PASS suy từ review source. Migration, chạy backfill, deploy và N2 vẫn chưa được duyệt.
