# IDTS User Administration Roadmap — Master Design

## Status and authority

- Design owner: DonHV.
- Approved roadmap date: 2026-08-20.
- Baseline: `origin/dev` at merge commit `5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5`.
- Gate 1, the original User Administration branch and PR #318, is complete.
- This document authorizes planning only. It does not authorize source implementation, HDI migration, BTP deployment, user/role mutation, Jira/Drive mutation, or merge of a future gate.

## Business goal

Turn the current onboarding-request table into a bounded IDTS administration workspace where an authorized PM with the UserAdmin capability can distinguish requests from active users, manage access safely, maintain Developer assignment readiness, administer IDTS business catalogs, and diagnose delivery/provisioning outcomes without using BTP Cockpit credentials or raw provider data.

## Current baseline

The merged foundation already provides:

- Controlled SAP ID invitation and identity verification.
- Immutable identity linkage.
- PM + UserAdmin server-side authorization.
- `UserOnboardingRequests`, `UserAccessOperations`, and append-only `UserIdentityAuditEvents`.
- Broker-mediated provisioning with read-before/write/read-after reconciliation.
- Role change and revoke requests.
- Developer Profile and Developer Responsibilities source foundations.
- Read-only catalog projections.
- A SAPUI5 administration console that currently mixes access requests, active users, historical failures, and actions in one table.

The roadmap must extend this foundation rather than replace it.

## Product information architecture

The target navigation is:

```text
User Administration
├── Access Requests
├── Active Users
├── Developer Responsibilities
├── Business Catalogs
├── Operations
└── Audit
```

The first three areas form the operational MVP. Business Catalogs, Operations, and Audit are separate later increments so lack of funding can pause them without weakening core access control.

## Global business invariants

1. Every user has exactly one business role: `TESTER`, `DEVELOPER`, or `PM`.
2. `UserAdmin` is a capability overlay and is valid only for `PM`.
3. IDTS must never remove or disable the final active PM + UserAdmin.
4. UI visibility is not authorization; CAP enforces every read and mutation.
5. UI never calls SAP Authorization APIs or receives provider credentials.
6. The broker accepts only fixed server-side Role Collection mappings.
7. Local access is suspended and sessions are revoked before destructive provider work.
8. `ACTIVE` is impossible before exact provider readback and successful local completion.
9. No blind provider retry follows a timeout or ambiguous result.
10. SAP ID, BTP shadow users, audit history, and referenced business catalog rows are never hard-deleted by this workspace.
11. Raw JWTs, credentials, provider bodies, private endpoints, immutable identity tuples, and unrestricted role inventories never appear in UI, logs, evidence, or persisted safe summaries.
12. Every state-changing administration action produces an append-only audit event.

## Delivery sequence

| Gate | Deliverable | Priority | Depends on |
| --- | --- | --- | --- |
| 1 | Merge existing User Administration foundation | Complete | None |
| 2 | Active Users read-only list and details | P0 | Gate 1 |
| 3 | Role/capability change, suspend, reactivate, revoke | P0 | Gate 2 |
| 4 | Controlled Developer Responsibilities pilot | P1 | Gate 3 |
| 5 | Business Catalog Administration | P1, deferrable | Gate 4 |
| 6 | Operations and Audit usability | P2 | Gate 3; may follow Gate 4 or 5 |

No later gate branches before the previous required gate is merged and a fresh `origin/dev` SHA is frozen.

## Cost-controlled execution model

Use one user-visible executor task per remaining gate. The requested `gpt-5.6-luna ultra` configuration is unavailable; use `gpt-5.6-luna` with reasoning `max`, the highest supported Luna setting.

Each task receives only:

- The exact base SHA.
- This master design and its gate-specific design.
- The gate-specific implementation plan after DonHV approves it.
- Allowed files, prohibited files, verification commands, stop conditions, and mutation budget.

Each executor task must stop after producing a Draft PR and report:

```text
OUTCOME
BASE SHA
EXACT HEAD
FILES CHANGED
TEST RESULTS
MCP AND SKILLS USED
SECURITY FINDINGS
KNOWN GAPS
PLATFORM MUTATIONS
GIT MUTATIONS
PR URL
RECOMMENDED NEXT GATE
```

The coordinating task independently fetches and reviews the exact diff, runs verification, diagnoses failures, validates PR evidence, and requests DonHV's merge or mutation decision. Executor tasks never merge, deploy shared BTP, run HDI, mutate users/roles, or start the next gate on their own.

## Branch and artifact policy

Recommended branch names:

- `feature/wp8-admin-active-users-donhv`
- `feature/wp8-admin-access-lifecycle-donhv`
- `feature/wp8-admin-developer-pilot-donhv`
- `feature/wp8-admin-business-catalogs-donhv`
- `feature/wp8-admin-operations-audit-donhv`

Every gate has one design, one implementation plan, focused knowledge mirrors, test evidence, a Draft PR, and a separate mutation approval when platform or HANA state is affected.

## Release policy

Source completion, schema completion, deployment completion, and manual acceptance are distinct claims. A gate is complete only when its defined source tests, exact artifact checks, rollout readbacks, role matrix, persistence/reload evidence, rollback verification, and DonHV-owned manual evidence all pass. A narrow PASS never closes a broader gate.

## Deferred and prohibited scope

The roadmap does not add password reset, OTP/MFA/passkey management, IAS/IPS administration, trust configuration, arbitrary Role Collection assignment, API credential management, CF/HANA operations, raw security-token inspection, mass elevation, or SAP ID creation. Those remain platform responsibilities.
