# WP7 My Notifications Roadmap

## English

### Status

`N1/N2 MERGED — N3 MERGED — N4 TASK 11 FIX ROUND 1 COMMITTED; LOCAL SOURCE BOUNDARY`

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

N1 #361 and N2 #362 are merged; N3 is the merged predecessor at the frozen Task 10 base `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`. N4 Tasks 10 and 11 are locally source-complete on `feature/wp7-notifications-sla-digest-donhv`: bounded Pending Assignment/SLA/Overdue discovery, fresh request-derived page contexts, source-key idempotency, protected `NotificationService.processNotificationSchedules`, Bangkok weekday 08:00 digest snapshots, exact digest uniqueness reuse, stored-snapshot retry and one shared worker sender. The requested local commit is the only mutation; no PR, Ready, merge, deployment, migration, backfill, live email, provider, user/role/data or N5 action is claimed. Live UI remains rolled back; source completion is not runtime acceptance.

Fix round 1 addresses the exact-head review's nine Important findings: installed-CAP context-bearing page commit/rollback evidence; the full Bangkok 08:00–08:59 recovery hour; immutable HistoryLogs SLA anchoring; keyset Bug paging beyond 5,000 IDs; shared role/ownership indexing across all recipient pages; HANA-safe delivery batches; target-aware unique-race reuse; role/status/profile and send-time persona fail-closed checks; and ListReport-compatible queue filters. Focused QA is green for each finding. Scoped re-review is still required before any PR, Ready, merge or rollout boundary.

Fix round 2 removes the scoped re-review's query-amplification finding: after lock-time candidate revalidation, latest status/due-date anchors and Overdue recipient eligibility are bulk-resolved with bounded per-page CQN reads, while each recipient retains a final locked revalidation before writing. Full-page query-count QA covers 500 candidates, multiple recipients and a preloaded recipient becoming inactive. Scoped re-review remains required before any PR, Ready, merge or rollout boundary.

Fix round 3 removes the lock-order deadlock risk identified in the next scoped review: page-level profile/user eligibility reads are bounded but lock-free, preserving the existing assignment `DeveloperProfile -> Bug` order; final recipient User validation remains locked immediately before the writer. Focused QA asserts this order and the stale-recipient rejection. Scoped re-review remains required before any PR, Ready, merge or rollout boundary.

## Addendum — N4 Task 11 fix round 1

The bounded review of local Task 11 head `22edfa1d7b84b512ac42178e3daf237b325de786` found nine Important findings. Fix round 1 is committed locally at `3c11fd0172fd1c488013e74e84f1b7147f327975` (`fix: harden weekday notification digest`) in the same protected worktree: real installed-CAP request/page commit/rollback evidence; full Bangkok 08:00–08:59 recovery-hour handling; immutable Pending Assignment HistoryLog anchors; keyset digest Bug pages beyond 5,000 IDs; shared role/ownership indexing across all recipient pages; HANA-safe digest delivery batches; target-aware unique-race reuse; role/status/profile and send-time persona fail-closed checks; and ListReport-compatible queue filters. The two review Minors remain deferred. No PR/Ready/merge/deploy/live schedule/provider/data/user/role/email/schema/dependency/lockfile/N5 action is claimed.

## Tiếng Việt

### Trạng thái

`N1/N2 ĐÃ MERGE — N3 ĐÃ MERGE — N4 TASK 11 FIX ROUND 1 ĐÃ COMMIT; BOUNDARY SOURCE LOCAL`

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

N1 #361 và N2 #362 đã merge; N3 là predecessor đã merge tại frozen base Task 10 `90fa1ffddced13c54b2daec852dbaadf90ddf7dc`. N4 Tasks 10 và 11 đã hoàn tất source cục bộ trên `feature/wp7-notifications-sla-digest-donhv`: discovery Pending Assignment/SLA/Overdue bounded, context request mới cho từng page, idempotency source key, protected `NotificationService.processNotificationSchedules`, digest snapshot 08:00 weekday Bangkok, reuse unique exact, retry snapshot đã lưu và một sender worker dùng chung. Chỉ mutation commit local được yêu cầu; không claim PR, Ready, merge, deploy, migration, backfill, email thật, provider, user/role/data hay N5. UI live vẫn rollback; source xong không phải runtime acceptance.

Fix round 1 xử lý chín finding Important của review exact-head: evidence commit/rollback page có context từ CAP installed thật; recovery hour Bangkok đầy đủ 08:00–08:59; anchor SLA bằng HistoryLogs bất biến; paging Bug keyset qua 5.000 ID; ownership index role dùng chung qua mọi recipient page; delivery batch HANA-safe; reuse unique-race target-aware; guard role/status/profile và persona fail-closed lúc send; và queue filter tương thích ListReport. QA focused cho từng finding đã PASS. Vẫn cần scoped re-review trước boundary PR, Ready, merge hoặc rollout.

Fix round 2 xử lý finding query amplification của scoped re-review: sau khi revalidate candidate tại lock-time, anchor status/due-date mới nhất và eligibility recipient Overdue được bulk-resolve bằng CQN bounded theo page, đồng thời từng recipient vẫn được lock/revalidate cuối trước write. QA query-count page đủ cover 500 candidate, nhiều recipient và recipient preload chuyển inactive. Vẫn cần scoped re-review trước boundary PR, Ready, merge hoặc rollout.

Fix round 3 xử lý rủi ro deadlock lock-order của scoped review tiếp theo: read eligibility profile/user theo page vẫn bounded nhưng lock-free, giữ thứ tự assignment hiện có `DeveloperProfile -> Bug`; validation User cuối cho từng recipient vẫn lock ngay trước writer. QA focused assert thứ tự này và reject recipient stale. Vẫn cần scoped re-review trước boundary PR, Ready, merge hoặc rollout.

## Phụ lục — N4 Task 11 fix round 1

Review bounded của head Task 11 local `22edfa1d7b84b512ac42178e3daf237b325de786` phát hiện chín Important. Fix round 1 đã commit local tại `3c11fd0172fd1c488013e74e84f1b7147f327975` (`fix: harden weekday notification digest`) trong worktree được bảo vệ: evidence CAP installed thật cho request/page commit/rollback; recovery hour Bangkok đầy đủ 08:00–08:59; anchor HistoryLog Pending Assignment bất biến; page keyset Bug qua mốc 5.000; ownership index dùng chung qua mọi recipient page; digest delivery batch HANA-safe; unique-race reuse target-aware; guard role/status/profile và persona fail-closed lúc send; queue filter tương thích ListReport. Hai Minor của review vẫn defer. Chưa claim PR/Ready/merge/deploy/live schedule/provider/data/user/role/email/schema/dependency/lockfile/N5.

## Addendum / Phụ lục — fix round 4

### Fix round 4 — profile eligibility race remediation

The next scoped re-review found that an unlocked DeveloperProfile eligibility snapshot could race with profile deactivation. Fix round 4 adds a real SQLite stale-profile regression: after the persisted profile is returned by the page preload, the fixture deactivates it before notification write and asserts no technical-assignee event is persisted. Candidate profile-to-user pairs are preloaded, recipient Users and then DeveloperProfiles are locked once per page before Bug locks, preserving `User -> DeveloperProfile -> Bug` and the existing assignment/deactivation `DeveloperProfile -> Bug` suffix; after Bug revalidation, a second bounded active-profile/User read accepts only the prelocked IDs. Final per-recipient User locks remain immediately before writing. SQLite cannot prove HANA lock/isolation behavior and maximum HANA `IN` cardinality remains unverified; these remain explicit review concerns.

### Fix round 4 — remediation race eligibility profile (Tiếng Việt)

Scoped re-review tiếp theo phát hiện snapshot eligibility DeveloperProfile lock-free có thể race với deactivation profile. Fix round 4 thêm regression stale-profile SQLite thật: sau khi profile persisted được trả về từ page preload, fixture deactivate profile trước notification write và assert không persist event cho technical assignee. Scheduler preload cặp profile-user, lock User recipient rồi lock DeveloperProfile candidate một lần mỗi page trước Bug lock, giữ thứ tự `User -> DeveloperProfile -> Bug` cùng suffix assignment/deactivation `DeveloperProfile -> Bug`; sau Bug revalidation, đọc lại profile/User active một lần bounded và chỉ nhận ID đã prelock. User lock cuối theo recipient vẫn ngay trước write. SQLite không chứng minh lock/isolation HANA; cardinality `IN` tối đa HANA vẫn chưa verify và được giữ như review concern rõ ràng.
