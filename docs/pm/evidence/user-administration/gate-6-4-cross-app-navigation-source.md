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

### Final independent review

- One bounded independent review covered all 30 changed files at exact range `99b100bdb07d599df17dbb2295c70384d04d1883..3a2edd85729d70fd75b32c70b057e3c4a400009f` and returned GO with `0 Critical / 0 Major / 0 Important / 3 Minor`.
- The three retained Minors are test-hardening only: instantiate the Bug Component session model instead of source-text assertion, read both Bug i18n bundles directly, and bind the User Administration Invite handler assertion to the second header button. Current source and localized bundles are correct; no known product/security defect remains.
- Ponytail verdict: `Lean already. Ship.` The GO permits push and exactly one Draft PR only; it is not rollout, Ready, merge, deployment, or Gate 6.5 approval.

### Manual acceptance plan — not executed

After separate rollout approval: verify PM + UserAdmin sees the Bug Management action and crosses both directions without a second login; PM without UserAdmin, Tester, and Developer do not see the action; direct unauthorized User Administration remains Forbidden; back navigation preserves the session; sign-out behavior is unchanged. Source tests do not claim this browser/runtime evidence.

### Mutation ledger

- Source, focused tests, mirrors, PM evidence/status, Git branch/commits, push, and one Draft PR are the only authorized repository mutations.
- Three local-only NTFS junctions expose exact locked root and two UI dependency trees from `E:\IDTS-SAP01`; lockfile SHA parity was proven before creation. No install, upgrade, audit-fix, package declaration, or lockfile write ran.
- No deployment, platform/provider/user/role/data/email/Jira/Drive/schema/HANA/HDI mutation occurred.

### Release-version follow-up

- After merge, readiness was `DEMO READY`, but both changed HTML5 apps still used the identities already deployed by Gate 6.3 (`0.0.5` and `1.0.15`). The rollout stopped before artifact creation or deployment.
- The version-only follow-up starts from merged Gate 6.4 commit `3cee05aef400845cda520a8aa79d2c73227adcea` on `fix/wp8-gate64-ui-release-version-donhv`. RED reproduced `0.0.5 !== 0.0.6` and `1.0.15 !== 1.0.16`; GREEN aligns each package, lockfile root, and manifest at Bug `0.0.6` and User Administration `1.0.16`.
- Dependencies, build commands, application behavior, CAP, schema, XSUAA, AppRouter routes, data and platform state are unchanged by this source follow-up. A separate PR/merge is required before packaging.

### Follow-up version release / Phiên bản follow-up

- Sau merge, readiness là `DEMO READY` nhưng hai HTML5 app đã đổi vẫn dùng identity đang deploy từ Gate 6.3 (`0.0.5` và `1.0.15`). Rollout dừng trước khi tạo artifact hoặc deploy.
- Follow-up chỉ-version bắt đầu từ merge commit Gate 6.4 `3cee05aef400845cda520a8aa79d2c73227adcea` trên `fix/wp8-gate64-ui-release-version-donhv`. RED reproduce `0.0.5 !== 0.0.6` và `1.0.15 !== 1.0.16`; GREEN đồng bộ package, lockfile root và manifest ở Bug `0.0.6`, User Administration `1.0.16`.
- Follow-up source này không đổi dependency, build command, behavior app, CAP, schema, XSUAA, AppRouter route, dữ liệu hoặc platform. Phải có PR/merge riêng trước packaging.

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
- Final review độc lập có giới hạn trên exact range `99b100bdb07d599df17dbb2295c70384d04d1883..3a2edd85729d70fd75b32c70b057e3c4a400009f` trả GO với `0 Critical / 0 Major / 0 Important / 3 Minor`. Ba Minor chỉ là hardening test tĩnh, source/bundle hiện tại đúng; không còn product/security defect đã biết. Ponytail kết luận `Lean already. Ship.`
- Manual browser/role/session acceptance chưa chạy và cần approval rollout riêng. Không có deploy hoặc mutation dữ liệu thật trong source gate này.

## Selective rollout closure / Closure rollout chọn lọc

### Release identity and artifacts

- Version-only PR #354 advanced Bug Management to `0.0.6` and User Administration to `1.0.16`. Its exact reviewed head was `465f8e8738126402271480152b2f5611cbd10f0a`; independent review returned `0 Critical / 0 Major / 0 Important / 0 Minor`, GitHub `qa-depth-gate` passed, and the PR merged at `2993c707f7369e46c45ec2b105c30f9786f0d859`.
- CAP ZIP `idts-gate64-cap-2993c707.zip`: SHA-256 `45D3186D851990390941BBEC2521F5BFFB39AEE699507FDC622DECBD8C4FDFC9`, 348,468 bytes, Node `22.x`, 110 archive entries including directories, zero `node_modules`, DB/HDI, environment or credential payload; packaged `srv/auth.js` matches the exact generated source.
- UI MTAR `idts-user-admin-ui-gate64-2993c707.mtar`: SHA-256 `C09E9EDB14A9E36B0C4E09635E1012E3B67AD8A524CB65F4AAE3CB52400DDEC2`, 323,001 bytes. Deep inspection found exactly one application-content module, one existing HTML5 repository host, and nested `bug-management-ui.zip` / `user-administration-ui.zip` at `0.0.6` / `1.0.16`; no CAP, DB/HDI, AppRouter, managed-service, route or `node_modules` payload.
- Full Windows `mbt build` was rejected after its CAP `data.zip` remained zero bytes for several minutes. No full MTAR was accepted or deployed. CAP therefore used the previously validated direct package/stage/owned-droplet path; UI used the dedicated content-only descriptor.

### Platform execution and final readiness

- Preflight and both post-deployment gates returned `DEMO READY`: CAP/AppRouter `1/1`, liveness/readiness `200`, protected anonymous API `401`, Web `200`. The approved check-only workflow never ran prepare/recovery.
- CAP rollout counts: create package `1`, stage `1`, set owned droplet `1`, restart `1`, rollback `0`. The new droplet fingerprint is `239c70d4-3de`; CAP retained one route and seven bindings. AppRouter retained one route, three bindings, and its original droplet fingerprint `ed1f1d34-32f`.
- UI content operation `c752eeef-a107-11f1-8c0e-eeee0a892136` selected only `idts-user-admin-ui-r3c-content`, finished successfully, retained exactly one healthy existing HTML5 repository host, and left zero active MTA operations.
- No DB deployer, HDI make, schema, migration, seed, DDL/DML, AppRouter deployment, route/binding, XSUAA, provider/email, user/role, Jira or Drive mutation ran.

### Browser acceptance

- The existing authenticated PM + `UserAdmin` session loaded the newly deployed User Administration header with visible/enabled `Back to Bug Management`, then opened the exact `/idtsbugmanagementui/index.html` path. Bug Management rendered visible/enabled `Open User Administration`, which returned to exact `/idtsuseradministrationui/index.html` in the same tab. Tab count stayed unchanged and no second login or business write occurred.
- A preexisting tab initially rendered cached Gate 6.3 content; one exact cache-busted reload exposed the new Gate 6.4 action. This is why both HTML5 cache identities were advanced before rollout.
- There was no independent Tester/Developer browser session available at exact runtime. No account, role or session was mutated to manufacture that evidence. Negative authorization remains covered by the source/runtime auth matrix `39/0`; the prior controlled Tester `Forbidden` screenshot is historical and is not misrepresented as exact-head reacceptance.
- Five framework-level console debt entries remained (Lrep fallback, S/CUBE, deprecated SAPUI5 pseudo-module and future-fatal listener warning). Both applications rendered and the exact navigation actions succeeded; no Gate 6.4 source stack or failed navigation was observed.

### Bản tóm tắt tiếng Việt

- PR version-only #354 merge tại `2993c707f7369e46c45ec2b105c30f9786f0d859`; review độc lập zero finding và CI xanh. Artifact CAP/UI được khóa hash và deep-inspect đúng scope; UI chứa đúng version `0.0.6` / `1.0.16`.
- CAP deploy qua đúng một package/stage/set-droplet/restart; UI deploy đúng một content operation `c752eeef-a107-11f1-8c0e-eeee0a892136`. Không DB/HDI/schema/migration/seed/data/user/role/provider/email mutation.
- Readiness cuối là `DEMO READY`. Session PM + UserAdmin đi hai chiều Bug Management ↔ User Administration đúng exact path, cùng tab, không login lại và không submit write action.
- Không có session Tester/Developer độc lập ở runtime exact; không đổi role/user để tạo evidence. Negative vẫn được khóa bằng auth matrix `39/0` và limitation được báo trung thực.
