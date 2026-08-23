# WP8 — User Administration Roadmap

## Owner

- Primary: DonHV.
- Executor model after plan approval: `gpt-5.6-luna` with reasoning `max`.
- Reviewer and diagnostic owner: coordinating DonHV task.

## Objective

Deliver the post-PR-318 administration roadmap through sequential, independently reviewable gates: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalogs, and Operations/Audit.

## Current status

`IN PROGRESS — GATE 4 SOURCE COMPLETE / CONTROLLED DEVELOPER PILOT PENDING`

- Gates 1–3B are merged, deployed and accepted. Gate 3 browser closure is recorded by PR #325 at `04643e12727290f2f35fd56e9c3d2a8df4cbcdbc`.
- Gate 4 branch `feature/wp8-admin-developer-pilot-donhv` is frozen from that exact base.
- The cross-layer contract reuses the real onboarding, profile administration, provider-proof completion, Smart Assign and User Administration UI suites. It proves incomplete local completion remains non-active, repeated completion creates no duplicate profile/responsibility rows, deactivate/reactivate changes new assignment eligibility, and existing Bug assignees remain unchanged.
- The audit found test fixtures that used a Developer Profile ID as a User ID and a display name as the actor. Fixtures now use exact seeded `Users.ID` values; production fail-closed identity/authorization behavior remains unchanged.
- The reproducible product gap was in Manage Responsibilities UI: no explicit no-auto-reassignment confirmation and no state-bound duplicate-submit guard. UI version `1.0.10` adds confirmation, impact copy, busy/disabled state and reload through existing actions; CAP contracts and schema remain unchanged.
- Source review/PR/merge and selective UI rollout remain before the controlled non-member Developer pilot. The pilot requires one SAP ID that is not DonHV or an existing team member.

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

DonHV/coordinator runs the Gate 4 final source gate, reviews/merges the exact PR, deploys only the changed User Administration content, then performs the controlled non-member Developer pilot. Gate 5 remains unopened.
