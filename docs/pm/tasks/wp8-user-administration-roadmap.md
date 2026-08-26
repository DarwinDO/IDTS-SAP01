# WP8 — User Administration Roadmap

## Owner

- Primary: DonHV.
- Executor model after plan approval: `gpt-5.6-luna` with reasoning `max`.
- Reviewer and diagnostic owner: coordinating DonHV task.

## Objective

Deliver the post-PR-318 administration roadmap through sequential, independently reviewable gates: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalogs, and Operations/Audit.

## Current status

`GATE 6.4 COMPLETE — SOURCE/VERSION PRS MERGED, SELECTIVE CAP + CONTENT ROLLOUT COMPLETE, PM SAME-SESSION ROUND-TRIP PASS; GATE 6.5 NOT STARTED`

- Gates 1–3B are merged, deployed and accepted. Gate 3 browser closure is recorded by PR #325 at `04643e12727290f2f35fd56e9c3d2a8df4cbcdbc`.
- Gate 4 branch `feature/wp8-admin-developer-pilot-donhv` is frozen from that exact base.
- The cross-layer contract reuses the real onboarding, profile administration, provider-proof completion, Smart Assign and User Administration UI suites. It proves incomplete local completion remains non-active, repeated completion creates no duplicate profile/responsibility rows, deactivate/reactivate changes new assignment eligibility, and existing Bug assignees remain unchanged.
- The audit found test fixtures that used a Developer Profile ID as a User ID and a display name as the actor. Fixtures now use exact seeded `Users.ID` values; production fail-closed identity/authorization behavior remains unchanged.
- The reproducible product gap was in Manage Responsibilities UI: no explicit no-auto-reassignment confirmation and no state-bound duplicate-submit guard. UI version `1.0.10` adds confirmation, impact copy, busy/disabled state and reload through existing actions; CAP contracts and schema remain unchanged.
- PR #335 passed CI and merged at `7bf7609ca070fae0d467c4964051eee0956828ad`; User Administration UI `1.0.10` was selectively deployed.
- The controlled non-member Developer pilot reached `ACTIVE`, immutable identity link `Yes`, readiness `Ready`, one active responsibility and successful Bug Management access in a fresh session.
- Automatic `sap.default` shadow-user creation is enabled for this POC; authorization still requires the allowlisted broker-assigned IDTS Role Collection and CAP readback.
- Gate 5 source was independently reviewed with zero findings and merged through PR #337 at `eb0c5d1bc6c92557a7d41e45008240e1e929bc44`.
- The rollout then completed the checksum-bound encrypted backup/restore rehearsal, exact five-artifact real migration and additive four-view recovery. Counts and digests remained identical, duplicate groups and new audit rows were zero, and no seed, `.hdbtabledata` or catalog-row DML ran.
- Selective CAP rollout and controlled PM catalog lifecycle acceptance passed for create, edit, deactivate, reactivate, impact/audit handling and zero hard delete. All four controlled rows ended inactive and final readiness was `DEMO READY`.
- PR #338 records the Gate 5 rollout evidence. Exact-head review/CI passed, and a controlled TESTER session proved Bug Management access while direct User Administration navigation returned `Forbidden`.
- Gate 6 Operations/Audit and the Gate 6.1 navigation/action-clarity follow-up are historical merged increments. Their executor dependency junctions were local-only implementation aids and are not part of the current planning worktree or product design.
- Gates 1–6.2 are now present in refreshed `origin/dev` at planning baseline `170f0646e73db82451126891b4665e69a90b0aa0`.
- DonHV approved the post-Gate-6 design direction on 2026-08-25: isolate Developer and Business Catalog UI state, regroup the six top-level areas into five business-owned areas, reuse the existing read-only BugService workload model, add exact Bug drill-down and same-origin cross-app navigation, and add email only after material access changes complete.
- The approved design is recorded in `docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md`. Gate 6.2 is complete; its obsolete pre-implementation plan is removed. The retained Gate 6.3–6.5 plans authorize only their bounded source gates, while deployment, email delivery, provider/user/role/data mutation, merge and release remain separate decisions.
- DonHV approved the Gate 6.5 outbox amendment: keep Bug, invitation and access-change delivery storage domain-specific while sharing one worker/transport/provider/retry pipeline and one User Administration Delivery view. Gate 6.5 therefore includes an additive access-delivery table and a separate HANA migration gate.

## Gate 6 source handoff

- Source head `a9f0896edf8694b2a9a485ad96f52205bfee2df6` is pushed on `feature/wp8-admin-operations-audit-donhv`; Draft PR #339 targets `dev` and GitHub `qa-depth-gate` passed.
- The one independent review returned 0 Critical/Major and 2 Important findings. The executor remediated both (seven-day persisted readiness freshness and unexpired `INVITED` parent delivery retry) and reran the focused/full source matrix. The coordinator owns exact-head review of the remediation delta and all later rollout/acceptance/merge decisions.

## Gate sequence

1. Gate 2 — Active Users read-only list and details.
2. Gate 3 — Role/capability change, suspend, reactivate, revoke.
3. Gate 3B — Existing legacy TESTER/DEVELOPER identity link and assignment-readiness correction.
4. Gate 4 — Developer Responsibilities controlled pilot.
5. Gate 5 — Business Catalog Administration.
6. Gate 6 — Operations and Audit usability.
7. Gate 6.2 — UI state isolation, navigation regrouping and action ownership — COMPLETE.
8. Gate 6.3 — Developer workload and assigned-Bug drill-down — COMPLETE. PR #351 fixed the live 8-column/9-cell mismatch, HTML5 content `1.0.15` was deployed content-only, and PM reacceptance passed for Workload status, View workload, details ownership fields and exact Bug Object Page navigation.
9. Gate 6.4 — Safe cross-app navigation — COMPLETE. Source PR #353 and cache-identity PR #354 are merged; selective CAP/content rollout and PM + UserAdmin same-tab round-trip acceptance passed at final merge `2993c707f7369e46c45ec2b105c30f9786f0d859`.
10. Gate 6.5 — Post-completion access-change email notifications.

## Delivery rules

- One gate, branch, Draft PR, and Luna Max task at a time.
- Every gate freezes a fresh `origin/dev` SHA after the prior merge.
- Executor tasks cannot merge or perform platform/HANA/user/role mutations.
- The coordinating task independently reviews exact diffs and verification evidence.
- Platform mutation requires a separate DonHV approval with exact before-state, checksum, rollback, and stop conditions.
- Gate 5 is deferrable when funding is constrained.
- After each gate merges and exact reachability/cleanliness checks pass, remove that gate's worktree from outside its path with `git worktree remove`, then run `git worktree prune`; never force-remove a dirty or unmerged worktree.

## Evidence expectation

Each gate records source tests, CAP/Fiori/UI5 MCP guidance, security review, artifact checksums where applicable, role matrix, persistence/reload, UI/UX evidence, mutation ledger, rollback verification, and remaining limitations.

## Gate 6 handoff boundary

The executor may complete source/tests/docs/evidence commits, push the exact branch, open exactly one Draft PR, read back GitHub QA, and report the mutation ledger. The coordinator owns the independent exact-head review, selective rollout/manual acceptance, Ready/merge, and any provider/data/user/role/HANA/HDI/deployment action. Do not manufacture an outage or remove this worktree before coordinator feedback.

## Gate 6.1 source handoff — navigation and action clarity

- Frozen base: `3f3efc113a4ebd708d3f88a314941e51817eb843`.
- Executor branch: `fix/wp8-user-admin-navigation-action-ux-donhv`.
- Source commit: `66bb31fa4824511204893c52d4e39377df2e8fff`; the final documentation/evidence commit and Draft PR readback remain coordinator handoff items.
- Scope: UI-only replacement of invalid icons, native six-tab responsiveness, localized tab/action tooltips, and Change Role guidance. No backend, schema, dependency, lockfile, provider, user/role, data, deployment, merge, Ready, or cleanup mutation.
- Focused UI contract, onboarding suite, app lint/build, secret scan, agent rules, QA-depth self-test, Operations/Audit suite, and diff checks pass. The pre-existing hard-coded date-fixture issue was fixed test-only and merged separately through PR #341 before the Gate 6.1 branch refresh.
- Coordinator exact-diff review found zero Critical/Major/Important/Minor. Draft PR #340 remains open for refreshed CI and later visual acceptance/release decisions.

## Gate 6.2 completed — state and action ownership

- Frozen base: `b2d56f95c65106b8e59583e4b8b0775d2c3588bf`.
- Branch: `fix/wp8-user-admin-state-action-ownership-donhv`.
- The implementation separates Developer value-help state from Business Catalog administration state, groups the UI into five business-owned areas, removes lifecycle/profile actions from Access Request rows and keeps them on Active Users/Developers.
- Change Role collects a Developer profile only for a real non-Developer to Developer transition and rejects a same-role submit before any action request.
- Scope remains source-only. The independent review required one minimal safe CAP DTO addition, `ActiveUserDetails.accessRequestVersion`, so lifecycle actions use the server-selected request instead of the filtered Requests table. There is no database schema, dependency, lockfile, platform, provider, user/role, data or deployment mutation.

### Gate 6.2 dialog action-layout follow-up

- Active User details uses a native wrapping action row so Change Role, Suspend/Reactivate and Revoke remain fully reachable at narrow dialog widths.
- Manage Responsibilities is owned only by the Developer Responsibilities table and is not duplicated inside Active User details.
- The source fix is UI-only and advances the HTML5 cache identity to `1.0.13`; selective content rollout and read-only visual acceptance remain separate release evidence.
- PR `#346` merged and the checksum-reviewed `1.0.13` content-only MTAR was deployed once. Normal-viewport PM acceptance proved complete lifecycle actions without horizontal overflow, no duplicate details Manage action, and the retained outer Developer Manage action; no lifecycle mutation was submitted.

## Gate 6.3 next source gate — Developer workload and Bug drill-down

- Authoritative plan: `docs/superpowers/plans/2026-08-25-gate-6-3-developer-workload-bug-drilldown.md`.
- Start only from fresh `origin/dev` after this planning package merges; planned branch is `feature/wp8-user-admin-developer-workload-donhv`.
- Reuse the existing read-only `BugService.DeveloperWorkloads` aggregate and bounded `Bugs` fields. Add no workload table, duplicated aggregation, assignment/status mutation, or backend authorization shortcut.
- Add Developers → Workload overview, assigned non-Closed Bug details, and exact same-origin Bug Object Page deep links. Stop at one Draft PR before runtime rollout or Gate 6.4.

## Gate 6.3 source implementation handoff

- Branch `feature/wp8-user-admin-developer-workload-donhv` started from exact `d53f402ab92215e44d29da2e1d3da73a576fffd3` (`origin/dev`, local `dev`, and merge-base).
- Source commits add the named read-only `bugApi` model, server-ordered/paged workload state, Developers → Workload overview, bounded assigned non-Closed Bug details, exact same-origin Bug Object Page links, focused TDD and bilingual UI copy/mirrors. DonHV then authorized the smallest server fix in `srv/bug-service/monitoring.js`: resolve active internal identity/platform-role alignment, PM all rows, Developer own `developerUserID` row(s), and fail-closed other roles before client filter/order/page/count. No `db/`, schema, ordinary `BugService.Bugs` read-policy, dependency or lockfile change is present.
- Focused source GREEN for the authorization delta was `49/0`, with the original UI/Active Users/User Access contracts preserved. The readiness remediation adds a server-derived `identityAccessReady` Boolean using the existing identity-readiness invariant and focused GREEN is now `61/0`. Secret scan, agent rules, QA-depth self-test, CAP EDMX/HANA compile, UI5 MCP lint/manifest validation, UI lint/build and prohibited-file diff gates remain required post-remediation checks. Existing attachment `NonUpdateableProperties` compile warning remains unrelated and documented.
- Evidence: `docs/pm/evidence/user-administration/gate-6-3-developer-workload-source.md`. Draft PR #349 targets `dev`, remote body validation passed and GitHub `qa-depth-gate` passed. Manual/browser acceptance, rollout, merge, Ready and Gate 6.4 remain separate boundaries.

### Gate 6.3 authorization remediation handoff — 2026-08-26

- The prior exact-head review found one Major authorization/privacy gap specifically on `DeveloperWorkloads`; ordinary `BugService.Bugs` reads were not newly attributed to Gate 6.3. The auth-only remediation re-review returned zero findings at every severity; a later coordinator diff scan identified a separate readiness state-misrepresentation finding described below.
- DonHV authorized the narrow server scope. `readDeveloperWorkloads` now calls `resolveRequestUser`, permits active PM all rows without `UserAdmin`, scopes active Developers to resolved `developerUserID` before all client query semantics, and rejects Tester, UserAdmin without PM, inactive, unmapped and misaligned callers with 403.
- TDD RED was observed as `39 PASS / 10 FAIL / 49 checks`; GREEN is `49 PASS / 0 FAIL / 49 checks`. Exactly one Draft PR `#349` is open at initial head `0ac4e23a3ff2c2ba427eac8f7d23000a5e79115f`; remote body validation and `qa-depth-gate` passed.

### Gate 6.3 identity-access readiness remediation — 2026-08-26

- Coordinator Codex Security diff scan on exact head `50b68701da8a650917a0a0d218f50632820950fc` reported one medium/high-confidence finding, not zero: `csf_80d41b36a850713c6bbc2a4c`, occurrence `occ_52dec5bce30b309ab47d3757`, rule `ui-readiness.misrepresentation`. The scan report is recorded in the Gate 6.3 evidence and DonHV status; TAC was unavailable.
- Root cause was browser inference of readiness from active profile plus `developerUserID`. The approved fix adds read-only `DeveloperWorkloads.identityAccessReady`, populated server-side with one bounded `readActiveIdentityAccessByUser` call plus `hasActiveIdentityAccess`; it is false for unlinked, inactive/suspended, missing/mismatched hash, duplicate matching ACTIVE requests and unknown legacy backlog rows. Assignment readiness/counts remain separate.
- Intentional RED was `56 PASS / 5 FAIL / 61 checks`; focused GREEN is `61 PASS / 0 FAIL / 61 checks`, and the UI workload contract passes with active-profile-plus-user-ID-only normalization false. Ordinary `BugService.Bugs` read policy remains unchanged and is not described as newly exposed by Gate 6.3.
- The first exact-head review found one Important `WORKLOAD_SELECT` omission; RED failed, the smallest fix added `identityAccessReady` to the select list, and the full matrix was rerun green. Fresh review of `44f3a34902f1f3e1b521f7a6f2c0c280b60f0d6d` returned `GO — 0 Critical / 0 Major / 0 Important / 0 Minor`. Push/remote Draft PR readback is the next boundary; do not advance Ready, merge, deploy, mutate data/provider/user/role/email, start Gate 6.4 or clean the worktree.

### Gate 6.3 live Actions-column remediation — 2026-08-26

- English: post-rollout PM acceptance proved workload rows and server-derived Access readiness render, but the table declared eight columns for nine row cells. The workload-state cell consumed `Actions`, UI5 omitted the extra `View workload` button cell, and details/deep-link acceptance was blocked.
- English: the approved minimal source fix adds one localized `Workload status` column before `Actions`, retains the existing button/handler, adds an exact 9-column/9-cell regression, and advances only the User Administration HTML5 cache identity to `1.0.15`. Backend, schema, dependency graph and business data remain unchanged.
- Vietnamese: acceptance PM sau rollout xác nhận row workload và Access readiness do server tính đã render, nhưng table khai báo tám cột cho chín cell. Cell trạng thái workload chiếm `Actions`, UI5 bỏ cell nút `View workload` bị dư, nên acceptance details/deep-link bị chặn.
- Vietnamese: fix source tối thiểu đã duyệt chỉ thêm cột i18n `Trạng thái workload` trước `Actions`, giữ button/handler hiện có, thêm regression exact 9 cột/9 cell và chỉ tăng cache identity HTML5 User Administration lên `1.0.15`. Backend, schema, dependency graph và dữ liệu nghiệp vụ không đổi.

- English closure: PR #351 passed `qa-depth-gate` and merged at `5812b29f49a8a00ff79a877a347b911b0a851858`. Shared content artifact SHA-256 `86BBEE7EF590707D7A8DC30BCBD145855AD43570E13F8E7A06F3132368A1BD34` contained exactly Bug Management `0.0.5` plus User Administration `1.0.15`, no `node_modules`, and was deployed once through content operation `a738f1e0-a0f3-11f1-8b5a-eeee0a9eb3ea`. Final readiness was `DEMO READY`.
- English live reacceptance: the PM session rendered one Workload status header and 13 View workload buttons. DatDT details showed two assigned non-Closed Bugs, separate Technical Assignee and Current Action Owner columns, and two Open Bug actions; selecting the first opened the exact Bug Object Page for `BUG-0008`. No write action was submitted.
- Vietnamese closure: PR #351 PASS `qa-depth-gate` và merge tại `5812b29f49a8a00ff79a877a347b911b0a851858`. Artifact shared content SHA-256 `86BBEE7EF590707D7A8DC30BCBD145855AD43570E13F8E7A06F3132368A1BD34` chứa đúng Bug Management `0.0.5` cùng User Administration `1.0.15`, không có `node_modules`, và được deploy đúng một lần qua operation content `a738f1e0-a0f3-11f1-8b5a-eeee0a9eb3ea`. Readiness cuối là `DEMO READY`.
- Vietnamese live reacceptance: session PM render một header Workload status và 13 nút View workload. Details DatDT hiện hai Bug non-Closed được assign, tách cột Technical Assignee và Current Action Owner, cùng hai action Open Bug; chọn action đầu đã mở đúng Bug Object Page của `BUG-0008`. Không submit write action.

## Gate 6.4 source implementation handoff — safe cross-app navigation

- **English:** Branch `feature/wp8-cross-app-user-admin-navigation-donhv` starts from exact merged Gate 6.3 baseline `99b100bdb07d599df17dbb2295c70384d04d1883`. Source head `4a15dc31042c3a1ed410c9ed790f0f229748255e` adds the server-derived `canAdministerUsers` hint and same-origin navigation in both directions. UI visibility remains a hint; AppRouter and CAP authorization are unchanged and authoritative.
- **English:** Auth TDD finishes at `39/0` after an independent Important alignment-test finding was remediated and re-reviewed. Bug UI is `16/0`; User Administration UI, secret scan, agent rules, QA-depth, EDMX/HANA compile, User Admin lint and both UI builds pass. Codex Security launcher remained unavailable before scan ID creation and is not reported as PASS; final independent exact-diff review is still required before the Draft PR handoff.
- **Tiếng Việt:** Branch `feature/wp8-cross-app-user-admin-navigation-donhv` bắt đầu từ baseline Gate 6.3 đã merge `99b100bdb07d599df17dbb2295c70384d04d1883`. Source head `4a15dc31042c3a1ed410c9ed790f0f229748255e` thêm hint server-derived `canAdministerUsers` và navigation cùng origin theo hai chiều. Visibility UI chỉ là hint; authorization AppRouter/CAP không đổi và vẫn là lớp quyết định.
- **Tiếng Việt:** Auth TDD kết thúc `39/0` sau khi finding Important về test alignment được fix và re-review. Bug UI `16/0`; User Admin UI, secret scan, agent rules, QA-depth, compile EDMX/HANA, lint User Admin và cả hai UI build đều pass. Codex Security launcher không tạo được scan ID nên không báo PASS; còn cần final independent exact-diff review trước handoff Draft PR.
- Evidence: `docs/pm/evidence/user-administration/gate-6-4-cross-app-navigation-source.md`. Runtime rollout, browser role/session acceptance, Ready, merge, Gate 6.5 và cleanup là các approval boundary riêng.
- Final independent review of exact source/evidence head `3a2edd85729d70fd75b32c70b057e3c4a400009f` returned GO with `0 Critical / 0 Major / 0 Important / 3 Minor`; the retained Minors are test-hardening only. Push and one Draft PR are authorized; rollout, browser acceptance, Ready, merge, Gate 6.5 and cleanup remain separate.
- Final review độc lập trên source/evidence head chính xác `3a2edd85729d70fd75b32c70b057e3c4a400009f` trả GO với `0 Critical / 0 Major / 0 Important / 3 Minor`; các Minor giữ lại chỉ là hardening test. Được push và mở một Draft PR; rollout, browser acceptance, Ready, merge, Gate 6.5 và cleanup vẫn tách riêng.
- **Closure:** Source PR #353 merged, version-only PR #354 merged at `2993c707f7369e46c45ec2b105c30f9786f0d859`, CAP direct package rollout and content-only operation `c752eeef-a107-11f1-8c0e-eeee0a892136` completed, final readiness is `DEMO READY`, and PM + UserAdmin round-trip navigation passed in one tab without a write. Exact-runtime Tester/Developer browser recheck remains unavailable because no independent session was present; no role/user mutation was used to manufacture it. Gate 6.5 remains unopened.

## Bàn giao source Gate 6.1 — làm rõ navigation và action

- Base frozen: `3f3efc113a4ebd708d3f88a314941e51817eb843`.
- Branch executor: `fix/wp8-user-admin-navigation-action-ux-donhv`.
- Source commit: `66bb31fa4824511204893c52d4e39377df2e8fff`; commit documentation/evidence cuối và readback Draft PR vẫn do coordinator handoff.
- Scope: chỉ UI, gồm thay icon invalid, responsive native cho sáu tab, tooltip tab/action đã localize và hướng dẫn trong Change Role. Không mutation backend, schema, dependency, lockfile, provider, user/role, data, deploy, merge, Ready hoặc cleanup.
- UI contract tập trung, onboarding suite, app lint/build, secret scan, agent rules, QA-depth self-test, Operations/Audit suite và diff check đều pass. Lỗi fixture date hard-code có sẵn đã được fix test-only và merge riêng qua PR #341 trước khi refresh branch Gate 6.1.
- Exact-diff review của coordinator có zero Critical/Major/Important/Minor. Draft PR #340 vẫn mở để chạy CI mới và thực hiện visual acceptance/release sau đó.
