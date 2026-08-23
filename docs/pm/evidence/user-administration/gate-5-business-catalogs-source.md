# Gate 5 Business Catalogs — Source Evidence

## Scope

- Frozen base: `fd6870585d72ca63e55b744708960b417a2795b9`.
- Branch: `feature/wp8-admin-business-catalogs-donhv`.
- Source-only candidate. No HDI, HANA data, BTP, catalog, provider, user, role, Jira, Drive, deployment, merge, or Gate 6 mutation.

## Delivered contract

- Exact active PM + UserAdmin authorization on every catalog read/write/impact path.
- Four bounded projections: SAP Module, Application Component, Defect Category, Component Category.
- Query cap 100, normalized code/pair uniqueness, active-parent checks, ETag concurrency, and no DELETE.
- Count-only impact read; dependency-aware deactivate with reason; historical Bugs are not rewritten.
- Append-only sanitized success/rejection audit; no raw request, identity, provider, endpoint, token, or credential data.
- Responsive User Administration UI `1.0.11` with search, inactive filter, Add/Edit/Activate/Deactivate, impact dialog, busy/error/empty states, and double-submit guard.

## Focused evidence

- Catalog model/behavior TDD: RED on missing uniqueness/projection/mutation, then GREEN.
- Developer regression fixture corrected to use its own unique Component Category pair; production uniqueness was retained.
- `qa:user-admin-catalogs:programmatic`: PASS.
- `qa:user-onboarding:programmatic`: PASS.
- `qa:developer-pilot:programmatic`: PASS.
- `qa:user-admin-ui:programmatic`: PASS.
- CAP EDMX and HANA compile: PASS with the pre-existing attachments annotation warning only.
- UI lint: PASS with zero warnings; UI build: PASS.

## Known unrelated baseline limitation

The implementation plan named a nonexistent `qa:idts6:programmatic` npm alias. The maintained `scripts/qa/test-idts6-programmatic.js` was run directly and remains red on the current immutable-identity authorization baseline before reaching Gate 5 catalog behavior. It is not claimed PASS and is not hidden by this gate.

## Approval boundary

This evidence supports one Draft PR for exact-diff review only. HDI simulation/migration, selective CAP/UI rollout, live catalog acceptance, merge, and Gate 6 require separate approvals.
