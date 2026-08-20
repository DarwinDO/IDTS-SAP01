# WP8 — User Administration Roadmap

## Owner

- Primary: DonHV.
- Executor model after plan approval: `gpt-5.6-luna` with reasoning `max`.
- Reviewer and diagnostic owner: coordinating DonHV task.

## Objective

Deliver the post-PR-318 administration roadmap through sequential, independently reviewable gates: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalogs, and Operations/Audit.

## Current status

`IN PROGRESS — IMPLEMENTATION PLAN REVIEW`

- Gate 1 foundation is merged through PR #318 at `5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5`.
- Master design and Gate 2–6 designs are prepared on `docs/wp8-admin-roadmap-planning-donhv`.
- DonHV approved the written designs. Five detailed implementation plans are prepared for review; executor tasks remain blocked until DonHV approves the plan package.

## Gate sequence

1. Gate 2 — Active Users read-only list and details.
2. Gate 3 — Role/capability change, suspend, reactivate, revoke.
3. Gate 4 — Developer Responsibilities controlled pilot.
4. Gate 5 — Business Catalog Administration.
5. Gate 6 — Operations and Audit usability.

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

DonHV reviews the five implementation plans under `docs/superpowers/plans/`. After approval, open only the Gate 2 Luna Max executor task with the exact merged planning SHA; Gates 3–6 remain unopened.
