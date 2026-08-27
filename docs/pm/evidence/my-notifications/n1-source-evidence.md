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

Focused Task 4 matrix is green. The final full matrix, independent exact-head review, published Draft PR readback and CI evidence are appended only after they complete.
