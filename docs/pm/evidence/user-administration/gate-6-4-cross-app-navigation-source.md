# WP8 Gate 6.4 — Safe Cross-App Navigation Source Evidence

## English

### Exact scope and baseline

- Owner: DonHV. Branch: `feature/wp8-cross-app-user-admin-navigation-donhv`.
- Frozen base, initial HEAD, `origin/dev`, and merge-base: `99b100bdb07d599df17dbb2295c70384d04d1883`.
- Reviewed source head before documentation-only closure: `4a15dc31042c3a1ed410c9ed790f0f229748255e`.
- Scope: safe `AuthUser.canAdministerUsers` hint, Bug Management → User Administration action, User Administration → Bug Management action, focused TDD, bilingual knowledge mirrors, and one Draft PR.
- Out of scope: schema/HANA/HDI, XSUAA descriptor or Role Collection changes, AppRouter routes, dependencies/lockfiles, platform/provider/user/role/data/email mutation, deployment, Ready, merge, Gate 6.5, and worktree cleanup.

### Implemented contract

- `AuthService.AuthUser.canAdministerUsers` is true only after an XSUAA identity resolves to an active internal PM, passes exact platform-role alignment, and has `UserAdmin`. Custom auth, PM without the capability, Tester/Developer, mismatched roles, multiple business roles, and unresolved identity remain false or fail closed.
- The public profile exposes no provider scopes, Role Collections, immutable identity tuple/hash, token, endpoint, or provider detail. The Boolean is UX-only; AppRouter and CAP remain authoritative.
- Bug Management copies only strict Boolean `true` into `session>/canAdministerUsers`. The manifest action binds both visibility and enablement to that state, and the click handler rechecks the safe profile before navigating to `/idtsuseradministrationui/index.html`.
- User Administration adds a transparent localized Back action before the emphasized Invite User action. Its guarded handler navigates to `/idtsbugmanagementui/index.html`.
- Both directions use `window.location.assign` in the same tab and same AppRouter session. No domain, query, fragment, token, `returnTo`, new window, router framework, or new authentication flow is introduced.

### TDD and review evidence

- Task 1 RED was `31 PASS / 6 FAIL / 37`; GREEN was `37/0`. Independent review found one Important missing alignment-regression case. Controlled alignment bypass then produced RED `37/2`; restored source passed `39/0`, and scoped re-review marked the finding addressed with no new Critical/Major/Important issue.
- Task 2 RED failed on the missing Bug Management capability/action contract; GREEN was `16/0`, and production UI5 build passed. Review returned Spec PASS / Quality Approved with zero Critical/Major/Important.
- Task 3 RED failed because the header had only one action; GREEN passed, User Administration lint/build passed, and review returned Spec PASS / Quality Approved with zero Critical/Major/Important.
- Deferred Minor test observations are recorded in the ignored SDD ledger for final branch review. They do not represent a known product or security defect.

### Fresh verification matrix

| Check | Result |
| --- | --- |
| `officecli --version` | `1.0.144`; Markdown is outside OfficeCLI native editing, so repository patching was used. |
| `npm run qa:auth:programmatic` | `39 PASS / 0 FAIL`. |
| `npm run qa:idts43:programmatic` | `16 PASS / 0 FAIL`. |
| `npm run qa:user-admin-ui:programmatic` | PASS. |
| `npm run qa:secret-scan` | PASS. |
| `npm run qa:agent-rules` | PASS, 8 required rules. |
| `npm run qa:depth:self-test` | `15 PASS / 0 FAIL`. |
| `npx cds compile srv -s all --to edmx` | Exit 0; only the pre-existing attachment `NonUpdateableProperties` warning remains. |
| `npx cds compile db/schema.cds --to hana` | Exit 0. |
| `npm run lint --prefix app/user-administration-ui` | Exit 0. |
| Both UI production builds | Exit 0. Bug Management has no baseline lint alias; focused `qa:idts43` plus production build are used instead. |
| Diff/prohibited-path checks | Exit 0; no `db`, lockfile, XSUAA, MTA, or AppRouter route diff. |

### Security and tooling limitations

- CAP/Fiori/UI5 MCP namespaces were not callable in this session. Repository-local SAP skills, focused contracts, CAP compile, UI lint/build, and independent reviews supplied the local source evidence.
- Codex Security diff launch was attempted twice as instructed, but both pre-scan selections failed with the same HEAD-change rejection before returning a scan ID. No Codex Security PASS is claimed. Fresh secret scan, deterministic authorization tests, task reviews, and one final exact-diff independent review remain the accepted coverage.
- The Superpowers SDD Bash helper could not run because the Windows shim has no `/bin/bash`; the equivalent plan-scoped ignored ledger was maintained without installing WSL.

### Manual acceptance plan — not executed

After separate rollout approval: verify PM + UserAdmin sees the Bug Management action and crosses both directions without a second login; PM without UserAdmin, Tester, and Developer do not see the action; direct unauthorized User Administration remains Forbidden; back navigation preserves the session; sign-out behavior is unchanged. Source tests do not claim this browser/runtime evidence.

### Mutation ledger

- Source, focused tests, mirrors, PM evidence/status, Git branch/commits, push, and one Draft PR are the only authorized repository mutations.
- Three local-only NTFS junctions expose exact locked root and two UI dependency trees from `E:\IDTS-SAP01`; lockfile SHA parity was proven before creation. No install, upgrade, audit-fix, package declaration, or lockfile write ran.
- No deployment, platform/provider/user/role/data/email/Jira/Drive/schema/HANA/HDI mutation occurred.

## Tiếng Việt

### Scope và baseline chính xác

- Owner: DonHV. Branch: `feature/wp8-cross-app-user-admin-navigation-donhv`.
- Base frozen, HEAD ban đầu, `origin/dev` và merge-base: `99b100bdb07d599df17dbb2295c70384d04d1883`.
- Source head đã review trước closure chỉ-documentation: `4a15dc31042c3a1ed410c9ed790f0f229748255e`.
- Scope gồm hint an toàn `AuthUser.canAdministerUsers`, điều hướng hai chiều, TDD tập trung, knowledge mirror song ngữ và một Draft PR. Không gồm schema/HANA/HDI, XSUAA/Role Collection, AppRouter route, dependency/lockfile, platform/provider/user/role/data/email, deploy, Ready, merge, Gate 6.5 hoặc cleanup.

### Contract đã triển khai

- `canAdministerUsers` chỉ true khi identity XSUAA map đúng PM nội bộ đang active, platform role khớp chính xác và có `UserAdmin`. Custom auth, PM thiếu capability, Tester/Developer, role lệch, nhiều business role và identity không resolve đều false hoặc fail closed.
- Public profile không expose provider scope, Role Collection, immutable identity tuple/hash, token, endpoint hoặc provider detail. Boolean chỉ phục vụ UX; AppRouter và CAP vẫn quyết định quyền.
- Bug Management bind cả visible/enabled vào Boolean nghiêm ngặt và handler kiểm tra lại profile lúc bấm trước khi đi tới `/idtsuseradministrationui/index.html`.
- User Administration thêm action Back dạng transparent trước Invite User emphasized và đi tới `/idtsbugmanagementui/index.html`.
- Cả hai chiều dùng `window.location.assign` trong cùng tab/session; không có domain, query, fragment, token, `returnTo`, new window, router framework hoặc auth flow mới.

### TDD, verification và limitation

- Task 1 có RED `31/6`, GREEN `37/0`; review tìm một Important về coverage alignment. Controlled bypass tạo RED `37/2`, restore tạo GREEN `39/0`, re-review xác nhận đã xử lý. Task 2 GREEN `16/0`; Task 3 UI contract PASS; cả hai review đều zero Critical/Major/Important.
- Full matrix mới PASS: Auth `39/0`, Bug UI `16/0`, User Admin UI, secret scan, agent rules 8, QA-depth `15/0`, EDMX/HANA compile, User Admin lint và hai production build. Warning attachment cũ vẫn được ghi rõ.
- MCP CAP/Fiori/UI5 không callable. Codex Security diff launcher thất bại hai lần trước khi tạo scan ID, nên không tuyên bố Security PASS. Coverage thay thế gồm secret scan, auth matrix deterministic, review từng task và final independent exact-diff review.
- Manual browser/role/session acceptance chưa chạy và cần approval rollout riêng. Không có deploy hoặc mutation dữ liệu thật trong source gate này.
