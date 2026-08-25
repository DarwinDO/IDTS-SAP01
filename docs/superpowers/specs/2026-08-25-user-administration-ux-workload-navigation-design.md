# IDTS User Administration — UX, Workload, and Cross-App Navigation Design

## Status and authority

- Design owner: DonHV.
- Approved in chat: 2026-08-25; Gate 6.5 outbox amendment approved later the same day.
- Planning baseline: `origin/dev` at `b2d56f95c65106b8e59583e4b8b0775d2c3588bf`.
- Planning branch: `docs/wp8-user-admin-ux-architecture-donhv`.
- This document authorizes implementation planning only. It does not authorize source changes, HANA/HDI changes, deployment, provider/user/role mutation, email delivery, merge, or release.

## Purpose

Finish the User Administration information architecture after Gates 1–6 by:

1. fixing the intermittent Developer/Business Catalog loading conflict;
2. placing access and Developer actions in the screens that own those concepts;
3. adding a read-only Developer workload view that shows which Bugs are assigned to each Developer;
4. adding safe navigation between Bug Management and User Administration; and
5. notifying affected users after material access changes complete.

The design reuses existing CAP, BugService workload, AppRouter, email transport, worker orchestration, and SAPUI5 patterns. It does not add a new database, workload snapshot table, router framework, Launchpad, message queue, provider integration, or separate email worker. Gate 6.5 adds one additive delivery table because the existing Bug and invitation delivery tables have incompatible lifecycle and uniqueness contracts.

## Current verified foundations

The merged source already contains:

- `BugService.DeveloperWorkloads`, a virtual read model calculated from Developer Profiles and non-Closed Bugs.
- Workload fields for open owned Bugs, overdue Bugs, current Developer action items, per-status counts, total estimated effort, workload limit, and overload state.
- PM Dashboard and Smart Assign consumers of the same workload meaning.
- User Administration Active Users, Developer Responsibilities, Operations, Audit, and Business Catalogs.
- AppRouter paths for both HTML5 applications under one authenticated origin.
- Exact Bug Object Page deep links in the form `/idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)`.
- PM + UserAdmin server-side authorization for User Administration.
- The existing notification/email outbox and immediate post-commit kick.

The design must reuse these foundations rather than recalculate or persist equivalent state.

## Problems to close

### P0 — shared catalog state is order-dependent

Developer value helps and Business Catalog administration currently share one `catalogs` JSON model and one `loaded` flag. Opening either area first can mark the other area loaded or replace its state. Observable outcomes include empty Developer dropdowns and intermittent Business Catalog load errors.

The implementation must use two independent models and load guards:

- `developerCatalogs` for availability, responsibility levels, SAP Modules, and Component Categories used by Developer forms.
- `businessCatalogs` for selected catalog type, complete item collection, search, inactive visibility, and catalog mutations.

No flag or collection may be shared between the two models.

### P0 — actions are attached to the wrong business object

The Access Requests table currently doubles as invitation history and active-access administration. This makes active-user actions appear beside historical requests and encourages users to treat a request row as the user account.

Ownership after this design:

| Area | Owned actions |
| --- | --- |
| Access Requests | Invite, Cancel open invitation, Retry delivery, Retry provisioning when eligible, Reconcile ambiguous result, View request timeline |
| Active Users | View access details, Change Role, Suspend, Reactivate, Revoke |
| Developers | View Workload, Manage Responsibilities |
| Operations | Delivery/provisioning diagnosis and state-valid Retry/Reconcile |
| Business Catalogs | Create, edit, deactivate, reactivate catalog rows |
| Audit | Read-only search and details |

### P0 — Change Role duplicates profile administration

Change Role currently displays Developer Profile and Responsibility controls for an already-Developer user even before a different target role is selected.

Rules:

- Same-role submission is not a role change and remains rejected.
- Existing Developer availability, workload, and responsibility edits use Manage Responsibilities.
- Change Role displays Developer Profile input only for a real non-Developer to Developer transition.
- Developer to PM/Tester does not request a Developer Profile and preserves historical profile rows as inactive after successful completion according to the existing lifecycle contract.
- The UI message must explain that access is suspended while an external role change is reconciled.

## Target information architecture

Use five top-level areas so labels remain readable and the navigation does not grow beyond the current screen width:

```text
User Administration
├── Access
│   ├── Requests
│   └── Active Users
├── Developers
│   ├── Workload
│   └── Responsibilities
├── Operations
│   ├── Delivery
│   └── Provisioning
├── Business Catalogs
└── Audit
```

Use native SAPUI5 tab/overflow behavior. Do not add custom horizontal scrolling, custom navigation frameworks, CSS-only hidden tabs, or duplicated mobile pages. Tooltips and visible labels remain localized.

## Developer workload design

### Source of truth

Add a named read-only `bugApi` OData V4 model to User Administration that points to `/odata/v4/bug/`. The User Administration HTML5 route already requires `UserAdmin`; BugService and the internal user mapping remain authoritative for PM business authorization.

Read:

- `DeveloperWorkloads` for aggregate rows.
- `Bugs` for a selected Developer's bounded drill-down list.

Do not:

- add workload columns or snapshot tables;
- calculate workload from rows already rendered in the browser;
- copy the aggregation into UserAdministrationService;
- change assignments from the Workload screen; or
- let workload data authorize any mutation.

### Workload semantics

The UI must keep these concepts distinct:

- **Open assigned Bugs**: non-Closed Bugs whose technical `assignee_ID` is the Developer Profile.
- **Needs Developer action**: Bugs where the Developer is both technical assignee and exact current `nextProcessor`.
- **Overdue assigned Bugs**: non-Closed assigned Bugs whose due date is before the current UTC date.
- **Workload limit**: configured Developer Profile limit used by existing assignment validation.
- **Estimated effort**: total allowlisted estimated hours for open assigned Bugs.

`Assignee` is the technical owner. `Current Action Owner` is the person or queue expected to perform the next workflow step. They must never be presented as synonyms.

### Workload overview

Each row contains:

- Developer display name and contact email;
- identity-link/access readiness;
- availability;
- open assigned count and workload limit as `open / limit`;
- current action count;
- overdue count;
- estimated effort total;
- overloaded state; and
- `View workload`.

Default ordering is overloaded first, then overdue count descending, then Developer name. Search covers safe Developer name/email. A future larger-volume optimization may move all filtering and paging into SQL, but this gate must retain the existing bounded OData contract and `top <= 100` behavior.

### Workload detail

The selected Developer detail shows only non-Closed assigned Bugs by default:

- Bug Number;
- Title;
- Status;
- Priority and Severity;
- Due Date;
- Technical Assignee;
- Current Action Owner;
- Estimated Effort;
- overdue indicator; and
- `Open Bug`.

`Open Bug` navigates to:

```text
/idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true)
```

The detail is read-only. Assignment, reassignment, status changes, comments, and attachments remain in Bug Management.

## Cross-application navigation

### Safe capability hint

Extend the safe AuthService profile with a server-derived Boolean `canAdministerUsers`. It is true only when the current request maps to:

- an active internal user;
- exact business role `PM`; and
- the XSUAA `UserAdmin` capability.

The Boolean is a UX hint only. It exposes no Role Collection, scope list, identity tuple, or provider detail. AppRouter and CAP continue to reject unauthorized direct access.

### Bug Management to User Administration

Add a header action beside Open Dashboard:

```text
User Administration
```

Visibility binds to `canAdministerUsers`. It navigates with a same-origin relative path:

```text
/idtsuseradministrationui/index.html
```

Do not hardcode the Cloud Foundry domain or open a new authentication flow.

### User Administration to Bug Management

Add a `Back to Bug Management` header action that navigates to:

```text
/idtsbugmanagementui/index.html
```

Workload Bug links use the exact Object Page deep-link shape above. No `returnTo` parameter or cross-app history service is required in this increment.

## Material access-change notifications

### Domain storage with one delivery pipeline

Keep three domain-owned delivery stores because their source contracts differ:

```text
Bug event          -> NotificationDeliveries
Invitation event   -> UserOnboardingDeliveries
Access audit event -> UserAccessNotificationDeliveries
                           |
                           v
            one worker / transport / provider / retry policy
```

`NotificationDeliveries` requires a Bug notification. `UserOnboardingDeliveries` has one unique invitation delivery per onboarding request. Reusing either for repeatable access-change events would overwrite history, weaken foreign-key meaning, or require broad changes to the stable Bug email flow.

Add `UserAccessNotificationDeliveries` with:

- a required association to the append-only access audit event that caused the email;
- recipient email snapshot;
- allowlisted access event type;
- template key and sanitized subject/text/HTML snapshots;
- delivery status, attempt count, retry timestamps and provider message ID;
- lock token/expiry and sanitized failure code/summary; and
- a unique constraint on the source audit event so one business event cannot create duplicate email deliveries.

Do not add a separate `UserAccessNotifications` intent entity. The existing append-only access audit event is the business intent and idempotency source.

The existing scheduler entrypoint calls the Bug, invitation, and access delivery processors. They reuse one provider configuration, transport adapter, retry/backoff convention, error sanitizer and readiness calculation. Do not add another scheduler, service binding, credential, queue or provider.

### Completion timing

Create the access delivery in the same final local transaction that appends the successful access audit event, then schedule the existing post-commit worker kick.

Send a safe notification for:

- business role changed;
- access suspended;
- access reactivated; and
- access revoked.

Do not send success mail when an operation is only queued, when provider readback is pending, or when completion fails. The email contains the action, effective IDTS role/access state, safe timestamp, and relative application link. It contains no Role Collection inventory, identity tuple, provider response, token, endpoint, or credential.

Responsibility-only availability/workload/scope edits write Audit and update UI but do not send email in this increment. This avoids notification spam. A later user-notification preference feature may revisit that decision.

### Unified Operations presentation

Operations -> Delivery remains one table. Add an allowlisted `deliveryType` with `INVITATION` and `ACCESS_CHANGE`, and one filter for All, Invitation and Access change. Normalize both tables into the same masked safe DTO. Do not create separate Invitation Delivery and Access Delivery tabs.

Bug notification delivery remains in the Bug Management domain and is not added to User Administration in this increment. A future system-wide operations console would require a separate design.

## Related UX corrections and guardrails

1. Historical Expired/Cancelled/Failed requests are collapsed behind `Show history`; current/open requests appear first.
2. Technical codes remain in backend DTOs but UI labels use friendly text. Support fingerprints remain available only in safe details.
3. Details dialogs use consistent content padding, field spacing, minimum width, responsive height, and keyboard focus. Empty optional values display an em dash rather than leaving ambiguous blank rows.
4. Every independent tab has its own loading, empty, error, and retry state. A failure in Business Catalogs cannot clear Developer value helps or Workload.
5. List state survives opening and closing a detail dialog. Explicit Refresh reloads only the selected area unless a completed mutation affects another area.
6. State-changing buttons remain guarded against double submission and use optimistic version/ETag contracts where already defined.
7. No bulk role change, bulk suspend/revoke, CSV import, arbitrary audit export, or user-selected provider field is added.

## Security and privacy

- Every administration read/mutation remains PM + UserAdmin server-authorized.
- UI visibility does not replace AppRouter or CAP authorization.
- Workload is read-only and cannot bypass BugService assignment authorization.
- Bug drill-down returns only business fields already available to an authorized PM; it excludes attachment content, raw comments, identity data, provider state, and credentials.
- Search and details must not expose raw immutable identity hashes, provider identifiers, JWTs, tokens, binding values, private endpoints, or Role Collection inventories.
- Audit remains append-only.
- Email delivery uses sanitized payload snapshots and existing retry/locking policy.

## Delivery gates

### Gate 6.2 — state isolation and action ownership

- Split `developerCatalogs` and `businessCatalogs` models/load guards.
- Group the top navigation into Access, Developers, Operations, Business Catalogs, and Audit.
- Move lifecycle actions to Active Users.
- Move Manage Responsibilities to Developers.
- Restrict Change Role Developer Profile input to a real transition into Developer.
- Preserve all existing CAP authorization/state/version guards.
- No schema, HANA, provider, user, role, or email mutation.

### Gate 6.3 — Developer workload and Bug drill-down

- Add named read-only BugService model.
- Add Developers → Workload overview and details.
- Reuse `DeveloperWorkloads` without schema changes.
- Add exact Object Page deep links.
- Verify workload semantics, paging, permissions, empty/error states, and no mutation.

### Gate 6.4 — cross-app navigation

- Add server-derived `canAdministerUsers` to the safe auth profile.
- Add Bug Management → User Administration action.
- Add User Administration → Bug Management action.
- Verify PM + UserAdmin positive, PM without UserAdmin hidden/direct 403, Tester/Developer hidden, and same-session navigation.

### Gate 6.5 — access-change email notifications

- Add the additive `UserAccessNotificationDeliveries` table and exact generated HANA artifact review.
- Queue emails only after verified completion of role change, suspend, reactivate, and revoke.
- Reuse the existing worker entrypoint, transport, provider configuration, masking, retry policy and readiness approach.
- Present Invitation and Access-change delivery rows in one normalized Operations table with a type filter.
- Verify success/failure/duplicate/idempotency cases and ensure no responsibility-edit spam.

Each gate requires a fresh `origin/dev` baseline after the previous gate merge, one isolated branch/worktree, focused TDD, exact source review, one Draft PR, separate rollout approval, manual role/browser acceptance, and safe worktree cleanup after merge.

## Verification strategy

### Source tests

- Catalog model isolation in both opening orders.
- Independent error/retry state for Developer and Business Catalog areas.
- Navigation grouping, localized labels/tooltips, overflow, keyboard focus, and responsive behavior.
- Action placement and visibility by access state/business role.
- Change Role transition matrix including same-role rejection and non-Developer to Developer profile requirement.
- Workload aggregate parity with BugService and >100-row bounded paging behavior.
- Open/Closed, assignee/current-action-owner, overdue, limit, overload, and effort edge cases.
- Safe Bug deep-link generation.
- `canAdministerUsers` positive/negative authorization matrix.
- Access-delivery audit-event uniqueness, post-completion timing, idempotency, safe payload, failure/retry, unified Operations projection, and no responsibility-edit delivery.
- Additive HANA generation: exactly the new access-delivery table/index artifacts, zero destructive changes and no `.hdbtabledata`.
- Secret/privacy scan, agent rules, QA-depth self-test, CAP EDMX/HANA compile, UI lint/build, and `git diff --check`.

### Manual acceptance

- PM + UserAdmin can move between both apps without a second sign-in.
- PM without UserAdmin, Tester, and Developer cannot enter User Administration.
- Workload numbers match known controlled Bug assignments.
- Opening a workload Bug reaches the exact Bug Object Page.
- Catalog and Developer dropdown data remain stable regardless of opening order and page reload.
- Material access-change email arrives only after the final state is applied.
- Details dialogs are readable at desktop and narrow widths.

## Out of scope

- New workload persistence or analytics history.
- Automatic Bug assignment/reassignment.
- Bulk access operations.
- Password, MFA, SAP ID, IAS/IPS, trust, Role Collection, credential, CF, HANA, or HDI administration.
- Generic Launchpad/unified-shell replacement.
- User-configurable email preferences.
- Historical workload charts or exported reports.
- A system-wide email operations console that combines Bug notifications with User Administration delivery rows.

## Success criteria

The design is complete when an authorized PM can reliably find a user, distinguish access/request/Developer concepts, see accurate current workload and assigned Bugs, navigate between administration and Bug Management, and receive safe post-completion access notifications without introducing duplicated workload logic, new schema, or weaker authorization.
