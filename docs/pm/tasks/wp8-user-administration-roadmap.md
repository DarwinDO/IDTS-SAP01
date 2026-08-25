# WP8 — User Administration Roadmap

## Owner

- Primary: DonHV.
- Executor model after plan approval: `gpt-5.6-luna` with reasoning `max`.
- Reviewer and diagnostic owner: coordinating DonHV task.

## Objective

Deliver the post-PR-318 administration roadmap through sequential, independently reviewable gates: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalogs, and Operations/Audit.

## Current status

`IN PROGRESS — GATE 6 DRAFT PR #339`

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
- Gate 6 source candidate is isolated on `feature/wp8-admin-operations-audit-donhv` from exact `aae01e375a15d7664281b8cee35ac16727e696cf`. It adds safe bounded Operations/Audit DTO actions, persisted-state readiness, state-valid onboarding-delivery retry, Operations/Audit UI tabs, focused tests and bilingual knowledge mirrors. No schema/index or dependency/lockfile change is proposed.
- The only local dependency-visibility workaround is two NTFS junctions to the exact clean root `E:\IDTS-SAP01` locked dependency trees, verified by package-lock SHA parity and target absence before creation. They are excluded from Git and must not be reproduced as repository artifacts.

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

## Bàn giao source Gate 6.1 — làm rõ navigation và action

- Base frozen: `3f3efc113a4ebd708d3f88a314941e51817eb843`.
- Branch executor: `fix/wp8-user-admin-navigation-action-ux-donhv`.
- Source commit: `66bb31fa4824511204893c52d4e39377df2e8fff`; commit documentation/evidence cuối và readback Draft PR vẫn do coordinator handoff.
- Scope: chỉ UI, gồm thay icon invalid, responsive native cho sáu tab, tooltip tab/action đã localize và hướng dẫn trong Change Role. Không mutation backend, schema, dependency, lockfile, provider, user/role, data, deploy, merge, Ready hoặc cleanup.
- UI contract tập trung, onboarding suite, app lint/build, secret scan, agent rules, QA-depth self-test, Operations/Audit suite và diff check đều pass. Lỗi fixture date hard-code có sẵn đã được fix test-only và merge riêng qua PR #341 trước khi refresh branch Gate 6.1.
- Exact-diff review của coordinator có zero Critical/Major/Important/Minor. Draft PR #340 vẫn mở để chạy CI mới và thực hiện visual acceptance/release sau đó.
