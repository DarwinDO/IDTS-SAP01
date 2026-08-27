# My Notifications N1 source evidence

## Scope and identity

- Owner: DonHV.
- Branch: `feature/wp7-notifications-inbox-service-donhv`.
- Exact base/origin-dev/merge-base at start: `8ac9327b93b70633e96d2b6f09bb379a5afb681f`.
- Planning dependency: PR #360 merged at the same base; Gate 6.5 anchors were re-proven before mutation.
- Source scope: persistence, caller-only read/count, optimistic read state, and dry-run-first 30-day Bug backfill.

## TDD evidence

- Task 1 RED: missing `UserNotificationInboxEntries`; Task 2 GREEN: model contract plus HANA/EDMX compile.
- Task 3 RED: missing `NotificationService`; GREEN: caller scope, bounded paging, stable ties, safe DTO, two source reads, inactive/unmapped deny and XSUAA role-alignment coverage.
- Task 4 RED: missing read actions/backfill module; GREEN: two-tab idempotency, stale conflict, cross-user non-disclosure, snapshot race, XOR, cutoff, rerun no-op, zero access/email inserts.
- Privacy remediation RED reproduced raw audit summary exposure; GREEN removes the audit detail from the source query and uses event-allowlisted copy.

## Mutation and release boundary

- One local dependency junction points to the exact lock-parity dependency tree; no install, upgrade or lockfile change.
- No HANA/HDI migration, backfill execution against a real database, deploy, provider/real email, user/role/data, Jira/Drive, Ready, merge, N2 or cleanup mutation.
- Canonical business documents remain unchanged because N1 implements the already-approved design without changing role, workflow, channel policy or product scope.

## Verification state

Fresh remediation matrix on 2026-08-27: model/service/backfill, Bug email outbox, immediate kick, access notifications, XSUAA 13/13, secret scan, agent rules 8/8, QA-depth 15/15, AI DevKit 5/5, EDMX/HANA compile and diff/mirror/scope checks pass. The only compiler warning is the pre-existing attachment `NonUpdateableProperties` warning. HTTP 401/400/404 logs are expected negative-test outcomes, not failed assertions.

The completed independent review of `be56f788d874e356b2d6fa4129d06c3a9e930e62` returned NO-GO: 0 Critical / 1 Major / 4 Important / 0 Minor. Remediation restores normal historical backfill regardless of existing email delivery, uses the existing draft-aware Bug link builder, excludes private sourceKey from the old wildcard service projection, gives unsupported access states an unavailable response, and localizes generated DTO copy with CAP English/Vietnamese bundles. No ordinary Bug read policy changed.

Added evidence: four SQLite uniqueness constraints reject duplicates while nullable legacy source keys remain valid; loopback HTTP verifies anonymous denial, paging rejection, Vietnamese copy, cross-user action denial and read-state reload; real service requests verify XSUAA identity/role mismatch and PM self-only behavior. Hydration handles invalid XOR/recipient safely, and the backfill checks frozen upper/lower dates plus 500-row batches. Browser/BTP/HANA runtime acceptance is not claimed.

Same-reviewer re-review is pending. Draft PR/push is additionally held for current human Ownership Knowledge Gate evidence: the repository contains an older notification assessment dated 2026-08-12, not a current N1 assessment. No score, teach-back or approval has been fabricated.

## Tooling and simplicity

OfficeCLI `1.0.145` was used for mandatory preflight (Markdown editing unsupported). Skills/workflows: TDD, systematic debugging, receiving/requesting review, verification-before-completion, Ponytail, native CAP routing, API testing, AI DevKit dev-lifecycle/document-code/verify, and context-reentry. CAP MCP was not callable; compiler/runtime tests and official CAP CDL guidance were used. No native security connector, provider, Gmail or Jira/Drive tool was used. Ponytail reused CAP CQL/i18n and the existing Bug link/identity helpers; no broker, worker, preference framework or dependency was added.

## Tiếng Việt

N1 thuộc DonHV, branch `feature/wp7-notifications-inbox-service-donhv`, base `8ac9327b93b70633e96d2b6f09bb379a5afb681f`. Gate 6.5 và planning PR #360 đã merge trước khi tạo worktree. Scope chỉ gồm persistence, API caller-only, read-state optimistic và backfill Bug 30 ngày mặc định dry-run.

Task 1–4 có RED/GREEN; review đầu tại `be56f788d874e356b2d6fa4129d06c3a9e930e62` kết luận NO-GO với 0 Critical / 1 Major / 4 Important / 0 Minor. Đã sửa: không bỏ source đã gửi email khi backfill, link Bug có active key, loại sourceKey khỏi API cũ, không báo access thành công khi chưa APPLIED, localize text bằng bundle CAP Anh/Việt. Không đổi quyền đọc Bug thông thường.

Matrix mới ngày 27/08/2026 PASS: model/service/backfill, outbox Bug, immediate kick, access notifications, XSUAA 13/13, secret scan, rules 8/8, depth 15/15, AI DevKit 5/5, EDMX/HANA, diff/mirror/scope. Warning compiler duy nhất là attachment có sẵn. Log HTTP 401/400/404 là case negative mong đợi. Test chứng minh unique constraint, nullable source key cũ, HTTP locale/auth/paging/read-reload, XSUAA qua service, PM chỉ inbox của mình, XOR/recipient an toàn và backfill 500 row/batch với cutoff hai đầu.

Đang chờ cùng reviewer kiểm lại. Chưa push/PR vì còn cần evidence Ownership Knowledge Gate N1 hiện tại; repo chỉ có assessment notification cũ ngày 12/08. Không tự ghi điểm, teach-back hoặc approval. Không migrate HANA/HDI, chạy backfill thật, deploy, gửi mail/provider, sửa user/role/data, Jira/Drive hoặc mở N2. Giữ junction dependency đã kiểm lock parity; không install/upgrade/đổi lockfile. Canonical business docs giữ nguyên vì không đổi quyết định đã duyệt.

OfficeCLI 1.0.145 chỉ preflight Markdown; dùng TDD/debug/review/verify/Ponytail/CAP/API testing/AI DevKit và context-reentry. CAP MCP không gọi được; dùng compiler, test runtime và tài liệu CDL chính thức. Không dùng security connector, provider, Gmail, Jira/Drive. Tái sử dụng CAP CQL/i18n và helper identity/link, không thêm hạ tầng.
