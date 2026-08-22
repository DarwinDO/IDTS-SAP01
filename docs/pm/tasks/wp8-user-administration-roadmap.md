# WP8 — User Administration Roadmap

## Owner

- Primary: DonHV.
- Executor model after plan approval: `gpt-5.6-luna` with reasoning `max`.
- Reviewer and diagnostic owner: coordinating DonHV task.

## Objective

Deliver the post-PR-318 administration roadmap through sequential, independently reviewable gates: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalogs, and Operations/Audit.

## Current status

`IN PROGRESS — GATE 3B EXISTING USER IDENTITY LINK SOURCE IMPLEMENTATION / DRAFT PR PENDING`

- Gate 1 foundation is merged through PR #318 at `5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5`.
- Master design and Gate 2–6 designs are prepared on `docs/wp8-admin-roadmap-planning-donhv`.
- DonHV approved the written designs and five detailed implementation plans.
- Gate 2 is merged at `f89eacc1ef2eed6767395b1b5bc6c97ff0d6c7f5`. Gate 3 executor branch `feature/wp8-admin-access-lifecycle-donhv` is frozen from that exact base and contains source/documentation through `ad7e3d4`; the final source gate passes.
- Gate 3 source covers local `SUSPENDED` suspension, final-administrator protection, atomic session revocation, queued `REACTIVATE`, readback-only broker proof, CAP completion, state-bound UI actions, focused TDD, and source knowledge mirrors. The final source gate and Draft PR creation remain next.
- Gate 3 remains source-only. Manual browser acceptance, coordinator exact-diff review, merge, deployment, and any SAP user/Role Collection/provider mutation remain outside this executor handoff.
- Gate 3B is an approved transition insert before the next controlled Developer pilot. The bounded re-review at `95772d7` found one recovery-correlation Important and two evidence Minors; narrow source fix `734d625` binds retry/reconcile/expired-lease correlations for `LINK_EXISTING` on `feature/wp8-existing-user-identity-link-donhv` from frozen base `44b89db5db22e2ea65d4a85d746f57ad3a8f840e`. Coordinator final exact-delta review remains before any Draft PR. It links one selected legacy TESTER/DEVELOPER to a verified SAP identity by preserving the same internal user/profile/Bug relationships, uses provider readback only, and applies the fail-closed assignment-readiness guard. The source gate remains separate from CAP runtime/live provider acceptance, deployment, merge, and Ready transition. Design and implementation plan remain frozen under `docs/superpowers/specs/2026-08-21-gate-3b-existing-user-identity-link-design.md` and `docs/superpowers/plans/2026-08-21-gate-3b-existing-user-identity-link-implementation.md`.

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

## Next handoff

DonHV/coordinator runs the final source gate, reviews the exact Gate 3 Draft PR diff, and separately owns manual browser acceptance. Keep Gates 4–6 unopened until Gate 3 review and approval are complete.
