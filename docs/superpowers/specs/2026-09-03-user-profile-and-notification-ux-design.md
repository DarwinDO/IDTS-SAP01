# User Profile and Notification UX Design

## Goal

Make My Notifications readable and let authorized User Administrators maintain a person's display name without confusing profile data with SAP login identity.

## Confirmed scope

- Replace the crowded notification row layout with a native, responsive SAPUI5 hierarchy.
- Require a display name when a User Administrator sends a new invitation.
- Persist the requested display name through asynchronous provisioning and use it when creating `Users`.
- Let only an active PM with `UserAdmin` update an existing user's display name from Active User details.
- Record a safe append-only audit event for a display-name change.
- Do not guess names from email addresses or rewrite existing rows automatically.

## Login-email feasibility result

The deployed BTP flow authenticates through XSUAA and maps an IDTS user by the immutable hash of `origin`, `issuer`, and `user_uuid`. The existing broker's reviewed SAP User Management contract can read a shadow user and change only allowlisted Role Collection membership. It does not own the upstream SAP Universal ID or Identity Authentication login identifier.

Therefore IDTS must not offer a `Change login email` action on the current provider contract. Updating `Users.email`, or PATCHing a BTP shadow-user email, would not prove that the person's SAP login identifier changed. A future login-email gate requires a separately bound and reviewed Identity Authentication/SAP account administration API, ownership approval for that identity store, mailbox verification, provider readback, session revocation, and rollback evidence.

## Notification UX

Keep `ResponsivePopover`, the existing caller-only API, polling, paging, read actions, and safe deep links. Use a compact filter block and render each row with separate metadata, title, summary, and timestamp regions. An unread item receives a native highlight and semantic status; category, action-required state, and event type remain distinct controls with spacing. Long text wraps and the row remains keyboard actionable. No custom CSS or new dependency is needed.

## Display-name data flow

`InviteUser` sends a normalized display name with the existing onboarding action. `UserOnboardingRequests.requestedDisplayName` stores the value until the broker completes provisioning. `completeSuccess(PROVISION)` writes that value to `Users.displayName`. Existing-user linking preserves the existing user's display name.

The Active User detail action accepts `userID`, `displayName`, `reason`, and `expectedModifiedAt`. CAP re-authorizes the caller, validates all inputs, locks/compares the target row, updates only `displayName`, and appends `USER_PROFILE_UPDATED` to `UserIdentityAuditEvents`. Email, role, access state, external identity fields, password data, and Developer Profile are unchanged.

## Validation and failure behavior

- Display name is trimmed, must be 1-120 characters, and must not contain control characters.
- Reason follows the existing bounded single-line 1-500 character rule.
- Stale `expectedModifiedAt` returns `409`; missing/invalid users return safe `400`/`404` responses.
- UI failure keeps the dialog open and displays localized safe text.
- No email is sent for a display-name-only change.
- Provider or notification delivery behavior is unchanged.

## Verification

Use RED/GREEN focused contracts for notification layout, onboarding persistence/provisioning, UserAdmin-only display-name mutation, stale update rejection, audit creation, controller parameters, i18n parity, and forbidden identity exposure. Then run CAP compile, HANA compile, UI lint/build, relevant regression suites, secret scan, agent rules, QA-depth self-test, `git diff --check`, and a bounded security review.
