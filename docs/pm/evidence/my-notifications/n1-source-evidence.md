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

Same-reviewer re-review completed at `7dad8f18e148568d83380cabf2deba80eb432398`: GO for N1 source, 0 Critical / 0 Major / 0 Important / 0 Minor. All five previous findings are closed. The reviewer reran static JS/compiler/model/diff checks and inspected, but did not rerun, runtime suites; the executor's fresh matrix above is the runtime evidence.

The prior human Knowledge Gate HOLD is superseded by DonHV's explicit confirmation and GO to reuse already-agreed PASS evidence for this N1 Draft handoff. The original notification/email gate remains dated 2026-08-12 (interactive assessment completed 2026-08-13), score 100%, with Critical/Debug/Teach-back PASS: `docs/pm/evidence/idts-82/knowledge-gate-donhv-email-2026-08-12.md`. Supplementary authorization/access coverage is the existing 2026-08-20 composite, conservative score 90%: `docs/pm/evidence/user-administration/knowledge-gate-donhv-composite-2026-08-20.md`. This is user-authorized reuse, not a new assessment or a changed score/date; no new progress PASS is fabricated. The process correction after the reviewed source changes documentation only. Push and exactly one Draft PR are authorized; Ready, merge, deployment and N2 are not.

## Tooling and simplicity

Draft handoff: exactly one PR was created, [#361](https://github.com/DarwinDO/IDTS-SAP01/pull/361), OPEN/Draft targeting `dev`, initially pushed at `f77dad37e37c00b133d7d49a54bb52185159943e`. The post-creation closure is documentation-only. The full explicit matrix was rerun successfully before push; the PR body validator passed all 11 required sections. Final exact-head CI/readback belongs to the PR checks and handoff report, not a fabricated runtime acceptance. The worktree/dependency junction stays preserved.

OfficeCLI `1.0.145` was used for mandatory preflight (Markdown editing unsupported). Skills/workflows: TDD, systematic debugging, receiving/requesting review, verification-before-completion, Ponytail, native CAP routing, API testing, AI DevKit dev-lifecycle/document-code/verify, and context-reentry. CAP MCP was not callable; compiler/runtime tests and official CAP CDL guidance were used. No native security connector, provider, Gmail or Jira/Drive tool was used. Ponytail reused CAP CQL/i18n and the existing Bug link/identity helpers; no broker, worker, preference framework or dependency was added.

## Tiếng Việt

N1 thuộc DonHV, branch `feature/wp7-notifications-inbox-service-donhv`, base `8ac9327b93b70633e96d2b6f09bb379a5afb681f`. Gate 6.5 và planning PR #360 đã merge trước khi tạo worktree. Scope chỉ gồm persistence, API caller-only, read-state optimistic và backfill Bug 30 ngày mặc định dry-run.

Task 1–4 có RED/GREEN; review đầu tại `be56f788d874e356b2d6fa4129d06c3a9e930e62` kết luận NO-GO với 0 Critical / 1 Major / 4 Important / 0 Minor. Đã sửa: không bỏ source đã gửi email khi backfill, link Bug có active key, loại sourceKey khỏi API cũ, không báo access thành công khi chưa APPLIED, localize text bằng bundle CAP Anh/Việt. Không đổi quyền đọc Bug thông thường.

Matrix mới ngày 27/08/2026 PASS: model/service/backfill, outbox Bug, immediate kick, access notifications, XSUAA 13/13, secret scan, rules 8/8, depth 15/15, AI DevKit 5/5, EDMX/HANA, diff/mirror/scope. Warning compiler duy nhất là attachment có sẵn. Log HTTP 401/400/404 là case negative mong đợi. Test chứng minh unique constraint, nullable source key cũ, HTTP locale/auth/paging/read-reload, XSUAA qua service, PM chỉ inbox của mình, XOR/recipient an toàn và backfill 500 row/batch với cutoff hai đầu.

Cùng reviewer đã kiểm lại source `7dad8f18e148568d83380cabf2deba80eb432398` và trả GO với 0 Critical / 0 Major / 0 Important / 0 Minor. Reviewer tự chạy static JS/compiler/model/diff và chỉ đọc runtime suite; runtime evidence là matrix executor đã chạy mới ở trên. Commit closure sau SHA review chỉ đổi docs.

HOLD Knowledge Gate trước đó được thay thế bởi xác nhận và GO rõ ràng của DonHV để tái sử dụng evidence PASS đã thống nhất cho Draft N1. Gate notification/email giữ nguyên ngày 12/08/2026 (đánh giá tương tác hoàn tất 13/08), điểm 100%, Critical/Debug/Teach-back PASS tại `docs/pm/evidence/idts-82/knowledge-gate-donhv-email-2026-08-12.md`. Coverage authorization/access bổ sung dùng composite 20/08 đã có, điểm bảo thủ 90%, tại `docs/pm/evidence/user-administration/knowledge-gate-donhv-composite-2026-08-20.md`. Đây là tái sử dụng theo xác nhận của user, không phải bài đánh giá mới, không sửa điểm/ngày hay tạo PASS mới trong progress. Correction chỉ đổi docs sau source đã review. Được push và mở đúng một Draft PR, không Ready/merge/deploy/N2. Không migrate HANA/HDI, chạy backfill thật, gửi mail/provider, sửa user/role/data hoặc Jira/Drive. Giữ junction dependency đã kiểm lock parity; không install/upgrade/đổi lockfile. Canonical business docs giữ nguyên vì không đổi quyết định đã duyệt.

OfficeCLI 1.0.145 chỉ preflight Markdown; dùng TDD/debug/review/verify/Ponytail/CAP/API testing/AI DevKit và context-reentry. CAP MCP không gọi được; dùng compiler, test runtime và tài liệu CDL chính thức. Không dùng security connector, provider, Gmail, Jira/Drive. Tái sử dụng CAP CQL/i18n và helper identity/link, không thêm hạ tầng.

Bàn giao Draft: đã tạo đúng một PR [#361](https://github.com/DarwinDO/IDTS-SAP01/pull/361), OPEN/Draft vào `dev`, head push đầu là `f77dad37e37c00b133d7d49a54bb52185159943e`. Closure sau khi tạo PR chỉ đổi docs. Đã chạy lại full matrix thành công trước push; validator PR body PASS đủ 11 section. CI/readback exact head cuối nằm ở PR checks và báo cáo bàn giao, không được xem là runtime acceptance. Giữ worktree/junction dependency.
