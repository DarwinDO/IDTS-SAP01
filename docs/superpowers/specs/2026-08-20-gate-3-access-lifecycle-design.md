# Gate 3 — Access Lifecycle Management Design

## Goal

Allow PM + UserAdmin to change role/capability, suspend, reactivate, and revoke IDTS access while preserving last-admin safety, session revocation, provider reconciliation, and append-only audit.

## Reuse baseline

Reuse `requestRoleChange`, `requestRevoke`, `UserAccessOperations`, broker mappings, optimistic `provisioningVersion`, session revocation, provider readback, and `UserIdentityAuditEvents`. Do not introduce a generic workflow engine or UI-to-provider calls.

## Semantics

### Change Business Role or UserAdmin capability

Reuse `requestRoleChange`. A PM capability-only change is represented by the same desired role `PM` plus a changed `desiredUserAdmin`. The provider must finish with exactly one business Role Collection and zero or one approved UserAdmin overlay.

### Suspend

Add `requestSuspend(userID, reason, expectedVersion)`. Suspend is an IDTS-local emergency/temporary lock:

- Lock the target row.
- Protect the final PM + UserAdmin.
- Set internal user inactive.
- Revoke all active `AuthSessions` in the same transaction.
- Set the latest request to `SUSPENDED`.
- Append audit.
- Do not remove SAP ID, shadow user, or BTP Role Collections.

Add `SUSPENDED` to the onboarding status catalog through a separate exact initializer/data gate; do not replace existing catalog rows.

### Reactivate

Add `requestReactivate(userID, reason, expectedVersion)`. Reactivation never flips `active=true` blindly. It creates a read-only reconciliation operation; the broker confirms the current approved Role Collection set and immutable principal. CAP activates the user only after exact readback and appends audit.

### Revoke

Reuse `requestRevoke`. Local access is disabled and sessions are revoked before provider mutation. Provider failure leaves local access denied. Provider success/readback transitions to `REVOKED`; IDTS does not delete the SAP ID, shadow user, internal user, or audit.

## Safety invariants

- The requester cannot remove the final active PM + UserAdmin.
- Concurrent last-admin mutations use row locks plus a transaction-wide count recheck.
- Self-suspend/revoke is rejected when it would remove the final administrator.
- UserAdmin is rejected for Tester/Developer.
- Stale `expectedVersion` returns conflict without writes.
- Repeated commands are idempotent or conflict safely.
- Provider timeout/ambiguous response requires readback before any retry.
- `ACTIVE` and reactivation require provider proof.
- UI never accepts Role Collection names, IdP, subaccount, endpoint, or external user IDs.

## UI design

Active Users details exposes:

- Change Business Role / UserAdmin capability.
- Suspend Access.
- Reactivate Access only for `SUSPENDED`.
- Revoke Access.
- View pending operation and audit summary.

Destructive actions require reason and confirmation. A queued result is displayed as queued, not success. Buttons disable during submission and remain state-driven after reload.

## Status copy

Technical operation states map to friendly copy. Safe result codes remain available in details for support but raw provider errors stay hidden.

## Verification

- Tester→Developer, Developer→Tester, and PM capability-only fixtures.
- Invalid UserAdmin overlay rejection.
- Last-admin protection, including concurrent attempts.
- Suspend revokes local sessions atomically and performs no provider write.
- Reactivate fails closed when provider readback differs.
- Revoke keeps local access denied on provider failure.
- Provider timeout, 4xx, 429, 5xx, invalid response, conflict, and idempotent NOOP.
- Reload reflects queued/processing/suspended/revoked states.
- Existing Bug assignees remain unchanged.
- No secret/raw provider surface.

## Rollout

Source review precedes any catalog/status initialization, CAP/UI deployment, broker deployment, or controlled identity mutation. Each platform step has an exact checksum, before-state, one mutation attempt, readback, and rollback. Manual acceptance uses controlled identities and never the final PM account for destructive tests.

## Out of scope

No SAP password/MFA management, shadow-user deletion, arbitrary role assignment, mass operation, or automatic Bug reassignment.

