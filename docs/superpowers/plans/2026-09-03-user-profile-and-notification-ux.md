# User Profile and Notification UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a readable My Notifications popover and authoritative UserAdmin-managed display names while explicitly holding unsupported SAP login-email mutation.

**Architecture:** Keep the notification service untouched and reshape only its SAPUI5 presentation. Extend the existing onboarding persistence and Active Users service with the smallest server-authoritative display-name contracts; keep identity-provider ownership outside IDTS until a suitable provider API is approved.

**Tech Stack:** SAP CAP Node.js 9.9, CDS/OData V4, SAPUI5 1.148, SQLite tests, HANA compile.

**Spec:** `docs/superpowers/specs/2026-09-03-user-profile-and-notification-ux-design.md`

## Global Constraints

- Only an active PM with `UserAdmin` may mutate display names.
- Never expose or mutate immutable identity fields, credentials, tokens, or provider internals.
- Do not implement login-email mutation against the Role Collection-only broker contract.
- No new dependency, custom CSS, live data mutation, provider call, deployment, or automatic backfill.

---

### Task 1: Notification presentation

**Files:**
- Modify: `app/bug-management-ui/webapp/ext/notification/NotificationShell.js`
- Modify: `scripts/qa/test-my-notifications-shell.js`
- Modify: matching knowledge mirror

**Interfaces:**
- Consumes: existing notification DTO and `NotificationClient`.
- Produces: separated, responsive native SAPUI5 row hierarchy.

- [ ] Add RED assertions for metadata/title/summary/time separation, spacing classes, unread highlight, and compact filter semantics.
- [ ] Run `npm run qa:my-notifications:ui` and confirm the new assertions fail.
- [ ] Apply the minimal native-control layout.
- [ ] Re-run the suite and confirm PASS.
- [ ] Commit the self-contained gate.

### Task 2: Invitation display name

**Files:**
- Modify: `db/schema.cds`
- Modify: `srv/user-admin.cds`
- Modify: `srv/user-admin.js`
- Modify: `srv/provisioning-broker.js`
- Modify: `app/user-administration-ui/webapp/fragment/InviteUser.fragment.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: i18n and matching knowledge mirrors
- Test: onboarding, provisioning, and UI contract scripts

**Interfaces:**
- Produces: `requestOnboarding(displayName, email, requestedRole, userAdminRequested, developerProfile)` and persisted `requestedDisplayName`.

- [ ] Add RED tests for validation, persistence, retry survival, provisioning, controller payload, and i18n.
- [ ] Run focused suites and confirm feature-missing failures.
- [ ] Add the CDS field/action parameter and minimal UI/controller plumbing.
- [ ] Use `requestedDisplayName` during `PROVISION`; preserve existing-link names.
- [ ] Re-run focused suites and commit.

### Task 3: Edit active-user display name

**Files:**
- Modify: `srv/user-admin.cds`
- Modify: `srv/user-admin/active-users.js`
- Create: `app/user-administration-ui/webapp/fragment/EditUserInformation.fragment.xml`
- Modify: `app/user-administration-ui/webapp/fragment/ActiveUserDetails.fragment.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: i18n and matching knowledge mirrors
- Test: Active Users and UI contract scripts

**Interfaces:**
- Produces: `updateActiveUserDisplayName(userID, displayName, reason, expectedModifiedAt)` returning refreshed safe details.

- [ ] Add RED tests for UserAdmin success, unauthorized callers, invalid/stale input, one-field update, and audit append.
- [ ] Run focused suites and confirm feature-missing failures.
- [ ] Implement CAP validation, optimistic conflict check, update, and audit.
- [ ] Add the UserAdmin dialog/action under Active User details.
- [ ] Re-run focused suites and commit.

### Task 4: Login-email provider hold

**Files:**
- Modify: PM evidence/status and relevant canonical context only.

**Interfaces:**
- Produces: explicit NO-GO evidence, not executable email mutation.

- [ ] Record that current SAP broker owns Role Collection membership only.
- [ ] Record the future prerequisites for an IdP-owned login-email workflow.
- [ ] Assert no `Change login email` action or provider user-email PATCH entered the diff.

### Task 5: Full verification and handoff

- [ ] Run all focused and adjacent regression suites.
- [ ] Compile CAP to EDMX and HANA.
- [ ] Run both UI lint/build commands.
- [ ] Run secret scan, agent rules, QA-depth self-test, and `git diff --check`.
- [ ] Perform bounded security and simplicity reviews.
- [ ] Update evidence/status, commit, push one branch, and open one Draft PR only if no Critical/Major/Important issue remains.
- [ ] Stop before Ready, merge, deployment, provider/data/user mutation, or worktree cleanup.
