# Gate 3B Existing User Identity Link Design

## Classification

This is a transition and identity-migration increment inside WP8 User Administration. It does not introduce a new business role, identity provider, role collection, or generic migration framework.

## Problem

The shared HANA database still contains legacy team profiles whose contact email ends in `example.local` and whose four immutable SAP identity fields are null. Their Developer Profiles, responsibilities, existing Bug assignments, history, and notification relationships already point to the correct internal `Users.ID`. Normal onboarding cannot safely solve this because successful `PROVISION` creates a new `Users` row, which would split the old business history from the new SAP identity.

Legacy unlinked Developers can also remain eligible for new assignment because current readiness checks do not consistently require a completed immutable identity link and an `ACTIVE` access request.

## Goal

Allow an active PM with the `UserAdmin` capability to send a one-time SAP identity-link invitation for an existing legacy TESTER or DEVELOPER. After the member signs in with the invited SAP ID and the broker proves the exact existing IDTS Role Collection set, CAP updates the same `Users.ID` with the new contact email and immutable identity tuple. Existing Developer Profile, responsibilities, Bugs, history, comments, and audit relationships remain unchanged.

## Non-goals

- No automatic match by display name, legacy email, FPT email pattern, or similar string.
- No new `Users` row and no reassignment or copying of existing Bugs.
- No PM/UserAdmin migration through this action; the existing controlled PM bootstrap remains the authority for that case.
- No provider role assignment, removal, trust change, shadow-user creation, or user deletion in this link flow.
- No bulk-import framework. The initial UI links one selected legacy user per request.
- No mutable-email fallback in XSUAA authentication.

## Actors and authorization

- Initiator: one active internal PM whose platform business role is exactly `PM` and who has `UserAdmin`.
- Target: one active legacy internal user whose role is exactly `TESTER` or `DEVELOPER`, whose four external identity fields are all null, and who has no open identity-link request.
- Verifier: the SAP identity that receives the invitation and signs in through the existing validated XSUAA callback.
- Broker: the existing no-route provisioning broker, performing read-only Role Collection verification for this operation.

All authorization remains server-side. The client supplies only `userID` and the intended new contact email; it cannot supply role, provider, origin, Role Collection, endpoint, or target platform ID.

## Data model

Add two nullable fields to `UserOnboardingRequests`:

```cds
linkTargetUser            : Association to Users;
linkSourceEmailNormalized : String(255);
```

`linkTargetUser_ID != null` identifies an existing-user link request. A separate request-kind table or generic migration entity is deliberately not added.

The request continues to use:

- `targetEmailNormalized` for the new FPT/SAP ID email;
- the existing signed token, nonce, expiry, delivery outbox, status, immutable identity snapshot, version, operation, and audit fields;
- `activeUser_ID` only after successful completion.

The open-request key is:

```text
sha256(JSON.stringify(["LINK_EXISTING", linkTargetUser_ID]))
```

This prevents concurrent link invitations for the same legacy user even if different emails are supplied.

## Public CAP contract

Add:

```cds
action requestExistingUserIdentityLink(
  userID : UUID,
  email  : String(255)
) returns OnboardingResult;
```

The action derives the role from the locked target row. It creates one normal signed invitation and one existing delivery row with template key `IDTS_EXISTING_USER_IDENTITY_LINK_V1`.

No raw identity field, platform user ID, provider response, old email, token, or full hash is added to any public result or projection.

## Request creation rules

Within the CAP request transaction:

1. Require active PM + UserAdmin and exactly one business role.
2. Normalize and validate the requested email.
3. Read the target user and require `active=true`, role TESTER/DEVELOPER, and all four external identity fields null.
4. Require the current normalized target email to end in the approved legacy suffix `.example.local` for this migration increment.
5. Require no other user to own the requested normalized email.
6. Expire a stale open link request for this target before checking for a new open request.
7. Insert one request containing the server-derived role, `userAdminRequested=false`, `linkTargetUser_ID`, and `linkSourceEmailNormalized`.
8. Persist the existing invitation delivery and schedule the existing immediate outbox kick after commit.

## Verification and operation journal

The existing `verifySapIdentity` callback keeps its signed-token, expiry, email-match, immutable-claim completeness, and collision checks. For a link request it additionally:

1. Re-reads the target user.
2. Requires the role and original normalized email to match the request snapshot.
3. Requires all four external identity fields to remain null, or recognizes only the exact already-completed tuple as an idempotent continuation.
4. Rejects any other user with the same normalized FPT email, identity hash, or platform identity.
5. Queues operation type `LINK_EXISTING` without a second PM approval.

The request uses existing states `INVITED -> PROVISION_QUEUED -> PROVISIONING -> ACTIVE`. No new lifecycle code-list row is required.

## Broker behavior

`LINK_EXISTING` is read-only at the SAP Authorization provider:

1. Read the verified shadow user and current direct Role Collections.
2. Require the exact desired IDTS business Role Collection derived from the legacy row.
3. Require zero other IDTS business Role Collections.
4. Require no `IDTS_USER_ADMIN` overlay because this flow excludes PM.
5. Preserve and ignore non-IDTS Role Collections.
6. Return `NOOP_ALREADY_DESIRED` on exact match.

The provider implementation must not call assign or unassign for this operation. Missing, extra, ambiguous, inactive, timed-out, or malformed provider state fails closed through the existing safe result classification.

## Atomic local completion

After provider success, CAP updates the existing target row rather than inserting a user.

The first completion path conditionally updates exactly one row when:

- `Users.ID` equals `linkTargetUser_ID`;
- `active=true`;
- `role_code` equals the operation's server-derived desired role;
- normalized current email equals `linkSourceEmailNormalized`;
- all four external identity fields are null;
- no different user owns the new normalized email or identity hash.

The update changes only:

- `email` to `targetEmailNormalized`;
- `externalIdentityOrigin`;
- `externalIdentityIssuer`;
- `externalIdentitySubject`;
- `externalIdentityKeyHash`.

It does not change `Users.ID`, display name, role, active flag, password fields, Developer Profile, responsibilities, Bug assignee, comments, notifications, or history.

An idempotent continuation is allowed only when the same target row already contains the exact email and four-field tuple from the request and the operation/request correlation is consistent. Any partial or different state becomes a conflict; CAP never chooses another user.

User update, request `ACTIVE`, operation `SUCCEEDED`, `activeUser_ID`, and append-only `LINK_EXISTING` audit commit in one transaction.

## Assignment readiness correction

A Developer is eligible for a new assignment only when all are true:

- internal user is active and role is `DEVELOPER`;
- a complete immutable identity hash is present;
- exactly one matching `ACTIVE` onboarding/access request references the same `Users.ID` and identity hash;
- Developer Profile is active;
- availability/capacity checks pass;
- at least one active responsibility matches the Bug classification and optional SAP Module.

The same identity/access predicate must feed Active Users readiness, direct assignee validation, and Smart Assign candidate filtering. Existing Bugs retain their current assignee even while the legacy user is ineligible for new assignments.

## UI behavior

For an Active Users row with `accessState=INCOMPLETE`, `identityLinked=false`, role TESTER/DEVELOPER, and a legacy email, the details dialog shows `Link SAP identity`.

The confirmation dialog shows:

- selected display name;
- current business role as read-only;
- editable new email;
- explicit text that existing Bugs/Profile/history remain attached to the same user;
- one `Send link invitation` action.

After success, UI reports only that the invitation was queued and reloads Requests/Active Users. It does not claim that access is active. Existing lifecycle buttons remain hidden until the link request becomes `ACTIVE`.

## Audit and privacy

Use action `LINK_EXISTING` for the completed link audit. The audit may store target user association, request/operation association, correlation ID, safe result, state transition, and private before/after identity hashes already defined by the model.

Do not store or log raw JWT, token, cookie, password, OTP, provider body, endpoint, platform ID, old/new email in audit summary, or full identity tuple. Existing request/delivery business fields remain the authorized location for the invited email.

## Rollback and recovery

Normal rollback is source/application rollback; additive nullable columns remain harmless.

A live data unlink is an emergency operation and requires a separate mutation approval. A non-routed bounded task may restore the request's `linkSourceEmailNormalized` and clear exactly the four identity fields only when:

- correlation and `LINK_EXISTING` audit uniquely identify the operation;
- current user ID is the exact original target;
- current email and full identity hash exactly match the completed request;
- no later access operation or identity audit depends on the link;
- no other user owns the legacy email;
- update and `LINK_EXISTING_ROLLBACK` audit commit atomically.

The task never accepts email, role, user ID, raw claim, or target identity as command input; it accepts only the approved correlation ID and defaults to inspect-only.

## Rollout sequence

1. Source-only tests and implementation.
2. Independent exact-diff security review.
3. Additive HDI simulation: exactly two nullable request columns and association/index artifacts only; no tabledata.
4. Schema migration with pre/post counts and recovery evidence.
5. Selective CAP/broker/UI deployment with checksums and rollback artifacts.
6. Link one legacy member at a time: SangVN, then DatDT, then NhanT after the exact FPT address is privately confirmed.
7. After each link, prove immutable login, exact role readback, unchanged user/profile/Bug IDs, direct notification routing to the new email, and final `DEMO READY` before proceeding.

## Acceptance criteria

- Same `Users.ID`, Developer Profile ID, responsibility IDs, Bug assignee IDs, comments, history, and existing audit counts remain linked.
- `Users.email` becomes the verified FPT address and the four immutable fields are complete.
- Exactly one matching access request is `ACTIVE`; exactly one business Role Collection is present.
- No provider PATCH occurs during `LINK_EXISTING`.
- Legacy unlinked Developers disappear from new assignment/Smart Assign candidates but retain current Bugs.
- Duplicate email, duplicate identity, partial identity, stale source email, wrong role, PM target, repeated token, and concurrent link request all fail closed without partial writes.
- No secret, raw claim, platform ID, provider payload, or full identity hash appears in public API, UI, logs, evidence, or Git.
