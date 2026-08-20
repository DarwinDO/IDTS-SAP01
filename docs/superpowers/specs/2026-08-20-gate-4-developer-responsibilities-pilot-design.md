# Gate 4 — Developer Responsibilities Controlled Pilot Design

## Goal

Close the remaining live acceptance gap for Developer provisioning and prove that active responsibilities control new assignment eligibility without changing existing Bug assignees.

## Reuse baseline

The merged source already contains desired Developer profiles on invitations/role changes, `DeveloperProfiles`, optimistic administration state, `DeveloperResponsibilities`, catalog validation, profile update actions, UI dialogs, additive HANA artifacts, and Smart Assign integration. Gate 4 begins with a gap audit and changes source only when a reproducible gap exists.

## Controlled identity

Use one controlled non-member SAP ID that is not DonHV and is not an existing team member account. Before invitation, prove there is no conflicting internal identity, active onboarding request, shadow-user ownership ambiguity, or IDTS business Role Collection. Never print or persist credentials, raw principal values, JWTs, or private login URLs.

## Pilot flow

1. PM + UserAdmin opens Invite User and selects `DEVELOPER`.
2. PM sets availability, workload limit, and at least one responsibility.
3. Responsibility uses an active Component Category, optional active SAP Module, and `PRIMARY`, `BACKUP`, or `EXPERT` level.
4. Invitation email is delivered and the controlled user verifies SAP identity.
5. Standard Developer onboarding auto-queues without a second PM approval.
6. Broker applies/readbacks only `IDTS_DEVELOPER`.
7. CAP atomically links/creates the internal user, activates the Developer profile, materializes responsibilities, appends audit, and finally sets the request `ACTIVE`.
8. The controlled Developer signs in to the Bug Management UI.

## Assignment readiness

A Developer is ready only when:

- Internal user is active with role `DEVELOPER`.
- Provider readback contains exactly `IDTS_DEVELOPER` and no PM/Tester/UserAdmin collection.
- Active Developer profile exists.
- At least one active valid responsibility exists.
- Referenced catalogs are active.

Incomplete readiness denies assignment eligibility even if provider role assignment succeeded.

## Manage Responsibilities acceptance

PM + UserAdmin must prove:

- Availability/workload update.
- Add responsibility.
- Update optional module or level.
- Deactivate responsibility with reason and impact count.
- Reactivate the same responsibility without duplicates.
- Optimistic conflict on stale administration version.
- Persistence after reload.

Deactivation removes the Developer from new matching assignment candidates. Existing Bugs retain the assignee and appear only in the impact count for separate PM action.

## Failure and reconciliation

If provider role succeeds but local completion fails, the request is not `ACTIVE`. Reconciliation repeats local completion idempotently and does not create duplicate profile/responsibility rows. If provider access is absent or mismatched, local user remains inactive.

## Verification

- Zero-responsibility and inactive-catalog rejection.
- Duplicate `(profile, component category, optional module)` rejection.
- Invalid workload/level rejection.
- Exactly-one Developer Role Collection.
- Profile/readiness and Smart Assign positive fixture.
- Inactive responsibility Smart Assign negative fixture.
- Existing Bug assignee preservation.
- Reload and audit evidence.
- Full role/authorization matrix.
- Final demo readiness.

## Rollback

Rollback removes only the pilot's IDTS Role Collection assignment through the operation journal, disables the controlled internal user, revokes sessions, and preserves audit. It never deletes the SAP ID or performs broad user/catalog cleanup.

## Out of scope

No automatic Bug reassignment, capacity optimizer, mass responsibility import, or mandatory AI assignment.
