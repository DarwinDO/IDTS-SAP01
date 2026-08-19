# User Administration Provider Recovery and Developer Responsibilities Design

## Status and baseline

- Design status: approved conversational baseline, implementation not started.
- Source context: branch `feature/wp7-user-onboarding-donhv`, HEAD `55be9805077aaf14eedb2d0905f3a70de1b7b497` at design freeze.
- Upstream reference: `origin/dev` at `0b694c4284e6a6b838ba3a2511d755bd01265a73` at design freeze.
- Preserve the untracked historical `Makefile_20260818121902.mta`.
- The current controlled TESTER has no Role Collection. A single approved PATCH returned `PROVIDER_UNAVAILABLE`; immediate readback proved no partial assignment.

## Goals

1. Make provider PATCH failures diagnostically safe and actionable without exposing SAP responses, tokens, endpoints or identifiers.
2. Complete TESTER provisioning only through the operation journal and read-after-write verification.
3. Require a complete Developer assignment profile when onboarding or changing a user to `DEVELOPER`.
4. Allow PM + UserAdmin to maintain Developer availability, workload and responsibilities after activation.
5. Keep existing Bug assignments stable when a responsibility is deactivated; prevent only new unsuitable assignments.

## Non-goals

- No automatic Bug reassignment.
- No autonomous Smart Assign decision.
- No hard deletion of Developer profiles, responsibilities or audit history.
- No IAS/IPS group provisioning.
- No arbitrary BTP Role Collection, IdP, endpoint or subaccount supplied by the client.
- No provider token, raw response or platform identifier in API responses, logs or evidence.

## Track A: provider PATCH recovery

The existing broker read path is verified: token acquisition, `/Users`, `/Users/{Id}`, `/Groups`, exact `IDTS_TESTER` lookup and live/source contract parity all pass. The unresolved boundary is the provider PATCH request/response.

The API client must retain only an allowlisted semantic classification:

| Condition | Safe code | Retryable |
| --- | --- | --- |
| HTTP 400 | `PROVIDER_REQUEST_INVALID` | No |
| HTTP 401 | `PROVIDER_AUTHENTICATION_FAILED` | No; refresh only in a later bounded gate |
| HTTP 403 with an allowlisted SAP scope | `PROVIDER_SCOPE_MISSING` | No |
| Other HTTP 403 | `PROVIDER_FORBIDDEN` | No |
| HTTP 404 | `PROVIDER_RESOURCE_NOT_FOUND` | No |
| HTTP 409/412 | `PROVIDER_CONFLICT` | No; reconcile first |
| HTTP 429 | `PROVIDER_RATE_LIMITED` | Yes |
| HTTP 500-599 | `PROVIDER_UPSTREAM_5XX` | Yes |
| Abort timeout | `PROVIDER_TIMEOUT` | Yes |
| Network failure | `PROVIDER_NETWORK_FAILURE` | Yes |
| Invalid/missing JSON on a JSON response | `PROVIDER_RESPONSE_INVALID` | No |

No code may persist or return the provider body, URL, token, user ID, group ID or response headers. For HTTP 403, the client may inspect only the schema-defined `scope` field and may recognize it only when it exactly matches one of the seven reviewed SAP API scopes; the scope value itself is never returned or persisted. A PATCH must never be retried inside the HTTP client. Ambiguous outcomes move to reconciliation; the operation journal remains authoritative.

After a broker-only deployment, one controlled operation may be reconciled. If the PATCH succeeds, the broker reads the user again, proves exactly one `IDTS_TESTER`, and CAP sets `ACTIVE`. If it fails, the new safe code determines the next gate; no blind retry is permitted.

## Track B: Developer onboarding and maintenance

### Business rule

`DEVELOPER` is an access role, not an assignment profile. A Developer is assignment-ready only when all conditions hold:

1. BTP readback contains exactly `IDTS_DEVELOPER` and no conflicting IDTS business Role Collection.
2. The linked IDTS `Users` row is active with business role `DEVELOPER`.
3. One active `DeveloperProfiles` row exists for that User.
4. At least one active `DeveloperResponsibilities` row exists.
5. Every responsibility refers to one active `ComponentCategories` pair, an optional active SAP Module, and an active Responsibility Level.

The invite and role-change UI must collect at least one responsibility before submitting a desired `DEVELOPER` state. Non-Developer roles must reject Developer profile input.

### Data model

Add a request-owned composition for desired onboarding responsibility rows:

```cds
entity UserOnboardingDeveloperResponsibilities : cuid, managed {
  onboardingRequest    : Association to UserOnboardingRequests not null;
  componentCategory    : Association to ComponentCategories not null;
  sapModule             : Association to SAPModules;
  responsibilityLevel  : Association to ResponsibilityLevels not null;
}
```

Add to `UserOnboardingRequests`:

```cds
developerAvailabilityStatus : Association to AvailabilityStatuses;
developerWorkloadLimit       : Integer;
developerResponsibilities    : Composition of many UserOnboardingDeveloperResponsibilities
  on developerResponsibilities.onboardingRequest = $self;
```

Add `administrationVersion : Integer default 0 not null` to `DeveloperProfiles` for optimistic concurrency. Duplicate active responsibility tuples are prevented by locking the profile row and checking `(developerProfile, componentCategory, sapModule)` in the same CAP transaction. This avoids nullable composite-unique differences between SQLite and HANA.

Use the existing append-only `UserIdentityAuditEvents` with new allowlisted actions:

- `DEVELOPER_PROFILE_CREATED`
- `DEVELOPER_PROFILE_UPDATED`
- `DEVELOPER_RESPONSIBILITY_ADDED`
- `DEVELOPER_RESPONSIBILITY_UPDATED`
- `DEVELOPER_RESPONSIBILITY_DEACTIVATED`
- `DEVELOPER_PROFILE_DEACTIVATED`

Audit summaries contain only safe catalog codes/labels, reason and counts; no email, immutable external identity or provider payload.

### CAP service contract

```cds
type DeveloperResponsibilityInput {
  componentCategoryID   : UUID;
  sapModuleID            : UUID;
  responsibilityLevelCode : String(40);
}

type DeveloperProfileInput {
  availabilityStatusCode : String(40);
  workloadLimit           : Integer;
  responsibilities        : many DeveloperResponsibilityInput;
}

type DeveloperProfileResult {
  userID                : UUID;
  developerProfileID    : UUID;
  administrationVersion: Integer;
  ready                 : Boolean;
  activeResponsibilityCount : Integer;
  openBugImpactCount    : Integer;
}

action requestOnboarding(
  email: String(255),
  requestedRole: String(40),
  userAdminRequested: Boolean,
  developerProfile: DeveloperProfileInput
) returns OnboardingResult;

action requestRoleChange(
  userID: UUID,
  requestedRole: String(40),
  userAdminRequested: Boolean,
  developerProfile: DeveloperProfileInput,
  reason: String(500),
  expectedVersion: Integer
) returns OnboardingResult;

action readDeveloperProfile(userID: UUID) returns DeveloperProfileResult;

action updateDeveloperProfile(
  userID: UUID,
  desiredProfile: DeveloperProfileInput,
  reason: String(500),
  expectedVersion: Integer
) returns DeveloperProfileResult;
```

Every action requires an active internal `PM`, the `UserAdmin` capability and exact-one business-role alignment. Client-supplied user IDs, catalog IDs and versions are validated server-side.

### Completion order and fail-closed behavior

For a new Developer:

1. Persist desired profile/responsibilities with the invitation.
2. Verify SAP identity.
3. Queue broker operation.
4. Broker assigns and reads back `IDTS_DEVELOPER`.
5. CAP completion transaction creates/links User, creates or reactivates DeveloperProfile, materializes desired responsibilities, writes audits and finally sets request `ACTIVE`.

If step 5 fails after BTP success, CAP authentication still fails closed because no complete active linked Developer exists. The next broker reconciliation observes the already-desired BTP state and retries only the local completion transaction idempotently.

For role change away from Developer, existing fail-closed suspension/session revocation runs first. After provider readback, CAP changes the User role and deactivates the DeveloperProfile/responsibilities without deleting them. Existing Bugs keep their assignee and are reported as impact requiring PM reassignment.

For responsibility edits on an active Developer, no BTP mutation is needed. CAP locks the profile, validates expected version and catalogs, computes the desired-set diff, inserts/updates/deactivates rows, writes audit events and increments `administrationVersion` atomically.

### UI behavior

- Invite dialog conditionally displays a mandatory Developer Profile section when role is `DEVELOPER`.
- Role-change dialog uses the same profile editor when changing to `DEVELOPER`.
- Active Developer rows show `Manage Responsibilities`.
- Profile editor uses standard UI5 data binding and a responsive table with Add, Edit and Deactivate actions.
- Application Component and Defect Category are displayed from the selected active `ComponentCategory`; the client never creates arbitrary pairs.
- Deactivation displays the open-Bug impact count and requires a reason plus confirmation.
- Developer users may read their profile in a later read-only view, but cannot mutate it.

## Security and privacy

- No provider or platform identifiers in the UI.
- No email in responsibility audit summaries.
- Backend authorization on every action; UI visibility is not authorization.
- Optimistic version plus profile row lock prevents lost updates.
- No hard delete and no automatic reassignment.
- Provider PATCH remains in the broker only; the UI and main CAP never receive the API credential.

## Acceptance

- Controlled TESTER reaches `ACTIVE` only after exact provider readback.
- Developer invitation cannot submit with zero or invalid responsibilities.
- Developer becomes `ACTIVE` only after BTP role and local profile/responsibilities both exist.
- Manage Responsibilities supports add/update/deactivate and survives reload.
- Duplicate responsibility, inactive catalog, stale version, non-PM, PM without UserAdmin and multi-role identities are rejected.
- Deactivation removes the Developer from future Smart Assign candidates but preserves existing Bug assignees and audit history.
