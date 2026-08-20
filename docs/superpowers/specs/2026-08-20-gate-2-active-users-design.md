# Gate 2 — Active Users Read Model and Details Design

## Goal

Separate current user access from invitation history and present one authoritative read-only row per IDTS user to PM + UserAdmin.

## Current problem

`searchOnboarding` returns request rows. Multiple expired or failed invitations for the same email appear beside the active request, so the table is not a user directory and management actions are attached to historical requests.

## Scope

Gate 2 adds an `Active Users` tab and read-only details. It performs no role, access, provider, session, schema, seed, or business-data mutation.

## CAP contract

Add structured result types and two parameterless/server-filtered actions to `UserAdministrationService`:

```text
searchActiveUsers(query, includeNonActive) returns many ActiveUserSummary
readActiveUserDetails(userID) returns ActiveUserDetails
```

`ActiveUserSummary` contains only:

- Internal `userID` for subsequent server actions.
- Display name and normalized contact email already visible to authorized administrators.
- Business role code.
- UserAdmin capability derived from the reconciled active request.
- Derived access state.
- Immutable-link completeness boolean, never the tuple/hash.
- Developer-profile readiness and active responsibility count.
- Latest pending operation type/state and last safe result code.
- Last successful reconciliation timestamp.

`ActiveUserDetails` adds request/audit counts and Developer profile summary, but no raw provider identifier, identity tuple, credential, recipient delivery payload, or full provider inventory.

## Read-model derivation

The service joins existing `Users`, the latest reconciled `UserOnboardingRequests`, latest `UserAccessOperations`, and Developer profile aggregates. No new database entity or column is introduced.

Derived access states are:

- `ACTIVE`: internal user active and latest request `ACTIVE`.
- `SUSPENDED`: internal user inactive while role/revoke/reactivation work is queued, processing, retryable, or under review.
- `REVOKED`: latest reconciled request `REVOKED`.
- `INCOMPLETE`: no unique reconciled request or identity link is incomplete; details stay read-only and safe.

Search is case-insensitive over authorized display fields. Default results exclude `REVOKED`; `includeNonActive=true` includes suspended, revoked, and incomplete rows. Pagination and stable ordering are required.

## Authorization

Both actions call the existing `requireActiveUserAdministrator` boundary. Anonymous, Tester, Developer, PM without UserAdmin, multi-business-role identities, inactive users, and incomplete XSUAA identities are denied. Tests must prove backend denial independently of UI tabs.

## UI design

Replace the single-table layout with an `IconTabBar` containing:

1. Access Requests — existing request table and actions unchanged.
2. Active Users — new read-only table.
3. Developer Responsibilities — entry point to existing Developer profile details; mutations remain gated by later acceptance.

Active Users columns:

- User.
- Business Role.
- User Administration capability.
- Access State.
- Identity Link.
- Developer Readiness.
- Pending Operation.
- Last Reconciled.
- View Details.

The details dialog uses display-only fields. No role-change, suspend, reactivate, or revoke action is enabled in Gate 2.

## UX requirements

- Use friendly status text and semantic `ObjectStatus` colors.
- Preserve selected tab and filters across refresh in the current browser session.
- Provide busy, empty, error, and retry-load states.
- Do not load all audit rows or provider inventories when opening the list.
- Responsive pop-in behavior must preserve role, state, and action clarity.

## Verification

- One active user with multiple request rows appears once.
- Default/include-non-active filtering is deterministic.
- Latest-operation aggregation does not select a stale operation.
- Identity completeness is boolean only.
- Role authorization matrix returns 401/403 as appropriate.
- Empty and inconsistent fixtures fail closed without selecting an arbitrary request.
- Reload returns the same rows and details.
- CAP JSON/EDMX and HANA compile.
- UI lint/build and focused controller/formatter tests pass.
- Secret/PII-surface and `git diff --check` pass.

## Rollout and acceptance

Gate 2 uses a selective CAP and shared UI-content deployment after exact artifact review. It does not deploy DB artifacts. Manual acceptance requires PM positive list/details, Tester negative access, deduplicated active user rows, reload persistence, and unchanged Bug Management UI content.

## Out of scope

No access mutations, bulk export, provider queries per row, arbitrary sorting on hidden identifiers, or audit explorer.

