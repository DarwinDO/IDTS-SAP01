# Gate 3B Existing User Identity Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link a selected legacy TESTER/DEVELOPER to a verified FPT SAP identity by updating the same internal user row, while preserving Developer Profiles, Bug assignments, history, and provider state.

**Architecture:** Add one explicit existing-user link association and one source-email snapshot to the existing onboarding request. Reuse signed invitations, immediate email delivery, the operation journal, and the broker; `LINK_EXISTING` performs provider readback only, then CAP atomically updates the selected legacy `Users` row. A shared identity/access-readiness predicate blocks unlinked Developers from new assignment without changing existing Bug assignees.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, SAPUI5 1.148, SQLite test runtime, SAP HANA Cloud/HDI, existing no-route provisioning broker and SAP Authorization API adapter.

**Spec:** `docs/superpowers/specs/2026-08-21-gate-3b-existing-user-identity-link-design.md`

## Global Constraints

- Freeze a fresh clean `origin/dev`; branch `feature/wp8-existing-user-identity-link-donhv` from that exact SHA in a dedicated worktree.
- Preserve the selected `Users.ID`, Developer Profile, responsibilities, existing Bug assignees, comments, notifications, and history.
- Scope targets active legacy TESTER/DEVELOPER rows only; PM/UserAdmin linking is forbidden.
- The client may send only target internal `userID` and new email. Role, provider, Role Collection, origin, platform ID, and endpoint remain server-owned.
- `LINK_EXISTING` is provider read-only: zero assign/unassign/PATCH calls.
- No mutable-email fallback for XSUAA authentication and no automatic matching by name/email similarity.
- Additive schema only: two nullable request columns/association artifacts; no `.hdbtabledata`, drop, delete, seed, or unrelated HDI artifact.
- Source executor stops at a Draft PR. HDI, deployment, provider execution, invitations, user/email/identity mutation, merge, and later gates require separate approvals.
- After merge and exact reachability/cleanliness proof, remove the exact gate worktree from outside it and run `git worktree prune`; never use `--force`.

## Planned file map

- `db/schema.cds`: add `linkTargetUser` and `linkSourceEmailNormalized` to onboarding requests.
- `srv/user-admin.cds`: expose the new action; keep link internals out of public projections.
- `srv/user-admin/existing-identity-link.js`: authorize and create link invitations using existing invitation/delivery primitives.
- `srv/user-admin.js`: register the action and route verified link requests into `LINK_EXISTING` operations.
- `srv/access/identity-readiness.js`: one pure identity/access predicate shared by read models and assignment paths.
- `srv/user-admin/active-users.js`: expose link eligibility and use the shared readiness predicate.
- `srv/provisioning-broker.js`: claim/complete `LINK_EXISTING` and atomically update the selected existing user.
- `broker/lib/access-provisioning.js`: add read-only exact-role verification for `LINK_EXISTING`.
- `broker/worker.js`: map `LINK_EXISTING` to the new read-only broker action.
- `srv/bug-service/bug-write.js` and Smart Assign candidate source discovered in Task 1: exclude unlinked/non-active-access Developers from new assignment.
- `app/user-administration-ui/webapp/fragment/ActiveUserDetails.fragment.xml`: show the link action only for eligible rows.
- `app/user-administration-ui/webapp/fragment/LinkExistingIdentity.fragment.xml`: collect the new email and explain preservation semantics.
- `app/user-administration-ui/webapp/controller/Main.controller.js`: invoke the action and reload state.
- both UI i18n bundles: safe user-facing copy.
- focused QA scripts and package commands: TDD and cross-layer regression.
- knowledge mirrors, canonical docs, WP8 status, evidence, and risk decision: exact handoff.

---

### Task 1: Freeze baseline and create the failing contract

**Files:**
- Create: `scripts/qa/test-existing-user-identity-link.js`
- Modify: `package.json`
- Read: files listed in the planned file map.

**Interfaces:**
- Consumes: existing PM+UserAdmin authorization, invitation token/delivery, identity mapper, operation journal, Active Users and broker APIs.
- Produces: `npm run qa:existing-user-identity-link:programmatic` as the source gate for later tasks.

- [ ] **Step 1: Create the isolated worktree from current upstream**

```powershell
git fetch origin --prune
$base = (git rev-parse origin/dev).Trim()
git status --porcelain -uall
git worktree add E:\IDTS-SAP01-worktrees\wp8-existing-user-identity-link-donhv -b feature/wp8-existing-user-identity-link-donhv $base
```

Stop if the source worktree is dirty, the exact directory/branch already exists, or the base differs from the recorded handoff SHA.

- [ ] **Step 2: Query SAP guidance and record limitations**

Query CAP MCP for request transactions, conditional updates, associations, and locking; UI5 MCP for dialogs, bindings, i18n, and message behavior. If CAP model search again fails on `@cap-js/attachments`, record the tooling issue and use `db/schema.cds` plus supported local CAP compile as authority.

- [ ] **Step 3: Add the npm command**

```json
"qa:existing-user-identity-link:programmatic": "node scripts/qa/test-existing-user-identity-link.js"
```

- [ ] **Step 4: Write RED assertions before production edits**

The test must assert these exact contracts:

```js
assert.match(schema, /linkTargetUser\s*:\s*Association to Users/)
assert.match(schema, /linkSourceEmailNormalized\s*:\s*String\(255\)/)
assert.match(service, /action requestExistingUserIdentityLink\([\s\S]*userID\s*:\s*UUID[\s\S]*email\s*:\s*String\(255\)/)
assert.match(provisioning, /operation\.operationType === 'LINK_EXISTING'/)
assert.match(accessProvisioning, /'LINK_EXISTING'/)
assert.doesNotMatch(publicProjection, /linkSourceEmailNormalized|identityOrigin|identityIssuer|identitySubject|identityKeyHash/)
```

Then use an in-memory SQLite CAP service fixture to prove the behavioral cases enumerated in Tasks 2–7. The first run must fail because the action/fields do not exist.

- [ ] **Step 5: Run and retain RED evidence**

```powershell
npm run qa:existing-user-identity-link:programmatic
```

Expected: nonzero exit on the first missing contract assertion; no platform call or data outside the ephemeral SQLite fixture.

- [ ] **Step 6: Commit only the red contract**

```powershell
git add package.json scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "test: define existing identity link contract"
```

### Task 2: Add the minimal request schema and OData action

**Files:**
- Modify: `db/schema.cds`
- Modify: `srv/user-admin.cds`
- Extend: `scripts/qa/test-existing-user-identity-link.js`

**Interfaces:**
- Produces persistence fields `linkTargetUser_ID`, `linkSourceEmailNormalized` and action `requestExistingUserIdentityLink(userID, email)`.
- Does not expose either link-internal field through `OnboardingRequests` or response types.

- [ ] **Step 1: Extend the request entity**

Insert exactly:

```cds
  linkTargetUser            : Association to Users;
  linkSourceEmailNormalized : String(255);
```

No new entity, code list, seed row, or status is added.

- [ ] **Step 2: Add the public action**

```cds
  action requestExistingUserIdentityLink(
    userID : UUID,
    email  : String(255)
  ) returns OnboardingResult;
```

- [ ] **Step 3: Assert privacy and generated schema shape**

Extend the test so `OnboardingResult`, `OnboardingRequestSummary`, and the `OnboardingRequests` projection contain none of:

```text
linkTargetUser
linkSourceEmailNormalized
identityOrigin
identityIssuer
identitySubject
identityPlatformUserId
identityKeyHash
```

- [ ] **Step 4: Compile and run the focused contract**

```powershell
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm run qa:existing-user-identity-link:programmatic
```

Expected: compile PASS; behavioral tests may still fail only at the missing handler.

- [ ] **Step 5: Commit**

```powershell
git add db/schema.cds srv/user-admin.cds scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "feat: model existing user identity links"
```

### Task 3: Create one authorized link invitation for the selected legacy row

**Files:**
- Create: `srv/user-admin/existing-identity-link.js`
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-existing-user-identity-link.js`

**Interfaces:**
- Produces: `requestExistingUserIdentityLink(req)`.
- Reuses: `assertUserAdministrator`, `createInvitationToken`, `normalizeEmail`, invitation config, existing delivery outbox and immediate kick.

- [ ] **Step 1: Export the existing safe email normalizer**

Add `normalizeEmail` to `srv/user-admin/invitations.js` exports; do not create a second email parser.

- [ ] **Step 2: Implement the action handler**

Use this server-owned decision structure:

```js
async function requestExistingUserIdentityLink (req) {
  const tx = cds.tx(req)
  const administrator = await requireActiveUserAdministrator(req, tx)
  const targetEmail = normalizeEmail(req.data.email)
  if (!targetEmail) throw serviceError(400, 'INVALID_INVITATION_EMAIL', 'A valid invitation email is required.')

  const target = await tx.run(SELECT.one.from(USERS).columns(
    'ID', 'email', 'role_code', 'active',
    'externalIdentityOrigin', 'externalIdentityIssuer',
    'externalIdentitySubject', 'externalIdentityKeyHash'
  ).where({ ID: req.data.userID }))

  assertEligibleLegacyTarget(target)
  await assertEmailAvailable(tx, target.ID, targetEmail)
  await expireStaleLinkRequest(tx, target.ID, req.timestamp || new Date())
  await assertNoOpenLinkRequest(tx, target.ID)

  return createExistingLinkRequest(tx, {
    administratorID: administrator.ID,
    target,
    targetEmail,
    now: req.timestamp || new Date(),
    req
  })
}
```

`assertEligibleLegacyTarget` must require active TESTER/DEVELOPER, `.example.local`, and all four identity fields null. It must reject PM, inactive, partially linked, fully linked, missing, or non-legacy rows with fixed safe codes.

- [ ] **Step 3: Insert the request with server-derived values**

The inserted values must include:

```js
{
  targetEmailNormalized: targetEmail,
  openRequestKey: sha256(JSON.stringify(['LINK_EXISTING', target.ID])),
  requestedRole_code: target.role_code,
  userAdminRequested: false,
  status_code: 'INVITED',
  requestedBy_ID: administratorID,
  linkTargetUser_ID: target.ID,
  linkSourceEmailNormalized: normalizeEmail(target.email),
  tokenNonce,
  tokenHash,
  expiresAt,
  correlationId
}
```

Create one delivery with template `IDTS_EXISTING_USER_IDENTITY_LINK_V1`, reuse `scheduleImmediateEmailOutbox(req)`, and return the standard safe `OnboardingResult`.

- [ ] **Step 4: Register the handler**

In `srv/user-admin.js`:

```js
this.on('requestExistingUserIdentityLink', req => requestExistingUserIdentityLink(req))
```

- [ ] **Step 5: Prove authorization/concurrency negatives**

Tests must reject anonymous, Tester, Developer, PM without UserAdmin, multi-business-role PM, PM target, inactive target, linked/partial target, non-legacy target, duplicate normalized FPT email, and concurrent open link. Two concurrent calls must produce exactly one request and one delivery.

- [ ] **Step 6: Run and commit**

```powershell
npm run qa:existing-user-identity-link:programmatic
npm run qa:user-onboarding:programmatic
git add srv/user-admin.js srv/user-admin/existing-identity-link.js srv/user-admin/invitations.js scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "feat: request legacy user identity links"
```

### Task 4: Verify the invited identity and queue a read-only link operation

**Files:**
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-existing-user-identity-link.js`

**Interfaces:**
- Consumes: `linkTargetUser_ID`, source email snapshot, validated identity snapshot.
- Produces: one `LINK_EXISTING` operation at version 2 with server-derived role and `desiredUserAdmin=false`.

- [ ] **Step 1: Branch only after the common token/identity checks**

After computing the validated identity/hash, detect:

```js
const isExistingLink = Boolean(invitation.linkTargetUser_ID)
```

For that branch, re-read the target and require ID, role, active state, source email, and all-null identity fields to match the invitation snapshot. Email/identity collision checks must exclude only this exact target ID and must reject every other match.

- [ ] **Step 2: Queue without a second approval**

For `isExistingLink`, set:

```js
const nextStatus = 'PROVISION_QUEUED'
const nextVersion = 2
const operationType = 'LINK_EXISTING'
```

Use `insertAccessOperation` with role derived from the target/request, never request payload. Insert audit action `QUEUE_LINK_EXISTING` with no email or identity value in `detailsSummary`.

- [ ] **Step 3: Preserve normal onboarding behavior**

Existing TESTER/DEVELOPER `PROVISION`, PM/UserAdmin approval, replay, expiry, and email-mismatch tests must remain unchanged. Do not overload normal onboarding when `linkTargetUser_ID` is null.

- [ ] **Step 4: Verify and commit**

```powershell
npm run qa:existing-user-identity-link:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:immutable-identity:programmatic
git add srv/user-admin.js scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "feat: queue verified existing identity links"
```

### Task 5: Add read-only provider verification for LINK_EXISTING

**Files:**
- Modify: `broker/lib/access-provisioning.js`
- Modify: `broker/worker.js`
- Modify: `broker/server.js`
- Extend: `scripts/qa/test-user-access-broker-runtime.js`
- Extend: `scripts/qa/test-existing-user-identity-link.js`

**Interfaces:**
- Produces broker action `LINK_EXISTING` that requires only `provider.listRoleCollections`.
- Returns existing safe results; no new provider response shape.

- [ ] **Step 1: Reuse the exact readback predicate**

Refactor the existing `REACTIVATE` branch into one helper:

```js
function assertExactDesiredAccess (current, desired) {
  assertValidUserAdminOverlay(current)
  const currentIDTS = current.filter(value => IDTS_ACCESS_COLLECTIONS.has(value))
  if (currentIDTS.length !== desired.length || desired.some(value => !currentIDTS.includes(value))) {
    throw brokerError('PROVISIONING_READBACK_MISMATCH', 'The current access state does not match the requested IDTS access.')
  }
}
```

Use it for `REACTIVATE` and `LINK_EXISTING`. `assertProvider` must require only `listRoleCollections` for both actions.

- [ ] **Step 2: Map operation to broker action**

In `broker/worker.js` use:

```js
if (operation.operationType === 'LINK_EXISTING') return 'LINK_EXISTING'
```

Do not map it to `ASSIGN` or `CHANGE_ROLE`.

- [ ] **Step 3: Prove zero writes**

The test provider exposes only `listRoleCollections`. Exact role returns `NOOP_ALREADY_DESIRED`; missing/extra/multiple role and UserAdmin overlay mismatch fail safely. Track calls and assert:

```js
assert.deepEqual(calls, ['listRoleCollections'])
```

No `assignRoleCollection`, `unassignRoleCollection`, HTTP PATCH, or compensation call may occur.

- [ ] **Step 4: Extend safe server status**

If the broker health/logger status allowlist needs the successful link status, use existing `ACTIVE`; do not expose `LINK_EXISTING` or identity details in logs.

- [ ] **Step 5: Verify and commit**

```powershell
npm run qa:user-access-broker:programmatic
npm run qa:existing-user-identity-link:programmatic
git add broker/lib/access-provisioning.js broker/worker.js broker/server.js scripts/qa/test-user-access-broker-runtime.js scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "feat: verify existing access without provider writes"
```

### Task 6: Complete the link atomically on the same user row

**Files:**
- Modify: `srv/provisioning-broker.js`
- Extend: `scripts/qa/test-provisioning-broker-programmatic.js`
- Extend: `scripts/qa/test-existing-user-identity-link.js`

**Interfaces:**
- Consumes successful `LINK_EXISTING` result and the exact link target/snapshots.
- Produces the same user ID with new email/identity, request `ACTIVE`, operation `SUCCEEDED`, and safe audit.

- [ ] **Step 1: Add state mapping**

```js
if (operationType === 'LINK_EXISTING') return 'PROVISIONING'
```

for processing and:

```js
if (operationType === 'LINK_EXISTING') return 'PROVISION_QUEUED'
```

for queued state.

- [ ] **Step 2: Implement exact conditional completion**

Before update, reject any other user that owns the target normalized email or identity hash. Load the exact target by `request.linkTargetUser_ID`. Then implement two accepted states:

```js
const unlinked = target.active === true &&
  target.role_code === operation.desiredRole_code &&
  normalizedEmail(target.email) === request.linkSourceEmailNormalized &&
  [target.externalIdentityOrigin, target.externalIdentityIssuer,
    target.externalIdentitySubject, target.externalIdentityKeyHash].every(value => value == null)

const alreadyLinked = target.active === true &&
  target.role_code === operation.desiredRole_code &&
  normalizedEmail(target.email) === request.targetEmailNormalized &&
  target.externalIdentityOrigin === request.identityOrigin &&
  target.externalIdentityIssuer === request.identityIssuer &&
  target.externalIdentitySubject === request.identitySubject &&
  target.externalIdentityKeyHash === request.identityKeyHash
```

If `unlinked`, perform one conditional update of only email plus four identity fields. If `alreadyLinked`, continue idempotently. Otherwise return a provider/local conflict without choosing another row.

- [ ] **Step 3: Finalize request/operation/audit in the same transaction**

Set:

```js
{
  status_code: 'ACTIVE',
  activeUser_ID: request.linkTargetUser_ID,
  provisioningVersion: request.provisioningVersion + 1,
  provisionedAt: nowIso,
  lastErrorCode: null,
  lastErrorSummary: null
}
```

Mark the operation `SUCCEEDED` and append action `LINK_EXISTING`. Do not change display name, role, active flag, password fields, profile, responsibilities, or Bugs.

- [ ] **Step 4: Prove transaction rollback and preservation**

Fixtures must snapshot user ID, Developer Profile ID, responsibility IDs, Bug assignee IDs, comments/history counts, and role before completion. After success all remain byte-equal except email/four identity fields. Inject failure after user update but before request update and prove the whole transaction rolls back.

- [ ] **Step 5: Prove idempotency/collision negatives**

Test repeated success, partial tuple, changed legacy email, inactive target, changed role, duplicate new email, duplicate hash, different exact tuple, wrong link target, and concurrent completion. Exactly one path may reach `ACTIVE`.

- [ ] **Step 6: Verify and commit**

```powershell
npm run qa:existing-user-identity-link:programmatic
node scripts/qa/test-provisioning-broker-programmatic.js
npm run qa:user-access:programmatic
git add srv/provisioning-broker.js scripts/qa/test-provisioning-broker-programmatic.js scripts/qa/test-existing-user-identity-link.js
git diff --cached --check
git commit -m "feat: link verified identity to existing users"
```

### Task 7: Make assignment readiness require immutable active access

**Files:**
- Create: `srv/access/identity-readiness.js`
- Modify: `srv/user-admin/active-users.js`
- Modify: `srv/bug-service/bug-write.js`
- Modify: the actual Smart Assign candidate source located with `rg -n "DeveloperResponsibilities|smart.*assign|assignment candidate" srv`
- Extend: `scripts/qa/test-user-admin-active-users.js`
- Extend: assignment and Smart Assign focused tests.

**Interfaces:**
- Produces pure `hasActiveIdentityAccess(user, requests)` and database helper `readActiveIdentityAccessByUser(tx, userIDs)`.
- All three consumers use the same exact active-link rule.

- [ ] **Step 1: Implement the pure predicate**

```js
function hasActiveIdentityAccess (user, requests) {
  if (!user || user.active !== true || !user.externalIdentityKeyHash) return false
  const matches = (requests || []).filter(request =>
    request.activeUser_ID === user.ID &&
    request.status_code === 'ACTIVE' &&
    request.identityKeyHash === user.externalIdentityKeyHash
  )
  return matches.length === 1
}
```

Ambiguous multiple active matches fail closed.

- [ ] **Step 2: Use it in Active Users**

Replace the local identity-link calculation and require the result in `developerReady`:

```js
const developerReady = identityLinked &&
  user.role_code === 'DEVELOPER' &&
  profile?.active === true &&
  activeResponsibilityCount > 0
```

Add `linkEligible` to `ActiveUserSummary/Details` only if the UI cannot derive it safely; if added, compute it server-side and expose only a Boolean.

- [ ] **Step 3: Enforce direct assignment**

After reading the Developer Profile, read its user plus relevant active request and reject unless `hasActiveIdentityAccess` is true. Keep the existing availability, capacity, and responsibility checks after this guard.

- [ ] **Step 4: Enforce Smart Assign candidate filtering**

Filter candidates using the same helper before scoring/explanation. Do not modify existing Bug assignees or historical suggestions.

- [ ] **Step 5: Test the exact transition**

Prove an unlinked legacy Developer:

- is `INCOMPLETE` and `developerReady=false`;
- is rejected for a new direct assignment;
- is absent from Smart Assign candidates;
- retains every existing Bug assignee relationship.

After the same user receives an exact completed link, prove it becomes ready/eligible without copying or reassigning any Bug.

- [ ] **Step 6: Verify and commit**

```powershell
npm run qa:user-admin-active-users:programmatic
npm run qa:existing-user-identity-link:programmatic
node scripts/qa/test-user-admin-developer-profile.js
node scripts/qa/test-user-admin-developer-profile-actions.js
npm run qa:user-access:programmatic
git add srv/access/identity-readiness.js srv/user-admin/active-users.js srv/bug-service scripts/qa
git diff --cached --check
git commit -m "fix: require linked access for developer assignment"
```

Use the exact available package-script names discovered from `package.json`; do not invent an alias if the repository already has an equivalent focused command.

### Task 8: Add the PM link action to Active Users

**Files:**
- Modify: `srv/user-admin.cds` only if `linkEligible` Boolean is needed.
- Modify: `app/user-administration-ui/webapp/fragment/ActiveUserDetails.fragment.xml`
- Create: `app/user-administration-ui/webapp/fragment/LinkExistingIdentity.fragment.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: `app/user-administration-ui/webapp/i18n/i18n.properties`
- Modify: `app/user-administration-ui/webapp/i18n/i18n_en.properties`
- Extend: `scripts/qa/test-user-admin-ui.js`

**Interfaces:**
- Consumes: selected safe Active User details.
- Invokes: `requestExistingUserIdentityLink(userID, email)`.
- Produces no provider or identity detail in the UI.

- [ ] **Step 1: Add the state-bound button**

Show `Link SAP identity` only when server-safe details establish an eligible unlinked TESTER/DEVELOPER. It must remain absent for linked, PM, inactive/revoked, pending-operation, or non-legacy rows.

- [ ] **Step 2: Add the dialog**

Use `sap.m.Dialog`, `VBox`, `ObjectIdentifier`, read-only `ObjectStatus` for role, `Label`, and `Input type="Email"`. Bind all visible copy through i18n. The dialog has `Send link invitation` and `Cancel`; no identity-provider or Role Collection input exists.

- [ ] **Step 3: Invoke the exact action**

Controller code must set only:

```js
oOperation.setParameter('userID', oDetails.userID)
oOperation.setParameter('email', sEmail.trim().toLowerCase())
```

After success, close the dialog, show `Identity-link invitation was queued.`, reload Requests and Active Users, and do not show `Active` or `Linked` before provider completion.

- [ ] **Step 4: Add UI negative/persistence tests**

Test visibility matrix, invalid/empty email, double-submit guard, exact two-parameter payload, safe error message, successful reload, and no raw identity/provider fields. Both i18n bundles must contain the same keys.

- [ ] **Step 5: Verify and commit**

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git add srv/user-admin.cds app/user-administration-ui scripts/qa/test-user-admin-ui.js
git diff --cached --check
git commit -m "feat: link legacy identities from active users"
```

### Task 9: Update knowledge, security evidence, and Draft PR

**Files:**
- Update: `docs/knowledge/srv/user-admin.js.md`
- Create: `docs/knowledge/srv/user-admin/existing-identity-link.js.md`
- Update: `docs/knowledge/srv/user-admin/active-users.js.md`
- Update: `docs/knowledge/srv/provisioning-broker.js.md`
- Update: `docs/knowledge/broker/access-provisioning.md`
- Update: `docs/knowledge/app/user-administration-ui.md`
- Update: `docs/pm/tasks/wp8-user-administration-roadmap.md`
- Update: `docs/pm/status/donhv.md`
- Update: `docs/pm/risk-decision-log.md`
- Create: `docs/pm/evidence/user-administration/gate-3b-existing-user-identity-link-source.md`

- [ ] **Step 1: Run OfficeCLI preflight and document its limit**

```powershell
officecli --version
```

Expected: version output; note that OfficeCLI does not semantically validate Markdown.

- [ ] **Step 2: Run the complete source gate**

```powershell
npm run qa:existing-user-identity-link:programmatic
npm run qa:user-admin-active-users:programmatic
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:immutable-identity:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git diff --check origin/dev...HEAD
```

If a listed npm alias differs, use the exact equivalent from `package.json` and record both the intended suite and actual command.

- [ ] **Step 3: Run focused secret/privacy scans**

Reject raw JWT, token, cookie, password, OTP, provider body, live email, platform ID, endpoint, full identity hash, `.env`, or credentials in source/evidence. Fixture emails must use reserved invalid/example domains.

- [ ] **Step 4: Independent exact-head review**

Require `0 Critical / 0 Major`, exact HEAD, clean worktree, schema delta inventory, public API allowlist, zero provider writes for `LINK_EXISTING`, and preservation tests. Any Major returns to the failing task; no self-approval.

- [ ] **Step 5: Push one Draft PR and stop**

Push `feature/wp8-existing-user-identity-link-donhv`, create/update one Draft PR with complete QA Depth evidence, and stop. Do not merge, deploy, migrate, invite a user, alter email/identity, or start Gate 4/5 work.

### Task 10: Coordinator-only additive HDI and selective rollout gates

**Files/artifacts:**
- Generate checksum-frozen schema-only, CAP-only, broker-only, UI-content-only, and rollback artifacts from the exact reviewed head.
- Create sanitized rollout evidence under `docs/pm/evidence/user-administration/` only after each approved gate.

- [ ] **Step 1: Simulate the exact schema delta**

Require generated HDI delta to contain only two nullable request columns/association support. Reject `.hdbtabledata`, seed, unrelated artifact, drop, truncate, delete, conversion, or data rewrite.

- [ ] **Step 2: Migrate schema separately**

Freeze table row counts and recovery authority, perform one approved additive migration, then prove all legacy users, Bugs, profiles, responsibilities, requests, operations, deliveries, and audit counts unchanged.

- [ ] **Step 3: Deploy selective runtime artifacts**

Deploy CAP, broker, and UI only through separately checksum-approved commands. Prove broker 1/1 no-route with exact two bindings, main CAP/AppRouter 1/1, no unexpected route/binding, and `npm run btp:demo:check` returns `DEMO READY`.

- [ ] **Step 4: Stop before data migration**

No invitation or user/email/identity mutation is authorized by schema/runtime rollout approval.

### Task 11: Coordinator-only one-member-at-a-time acceptance

- [ ] **Step 1: Freeze one target privately**

Start with SangVN. Privately prove one active legacy row, expected role DEVELOPER, all four identity fields null, one Developer Profile, responsibility/Bug ID fingerprints, no FPT email collision, no identity collision, exact BTP role state, and zero open link request. Do not print or persist raw personal identity values in public evidence.

- [ ] **Step 2: PM sends one link invitation**

Use the Active Users details action. Prove one request and one pending/sent delivery. No direct DB write or BTP role command is allowed.

- [ ] **Step 3: Member verifies once**

The member clicks `Continue with SAP` and signs in through the official SAP ID flow. Never capture password, OTP, callback code, cookie, JWT, raw tuple, or platform ID.

- [ ] **Step 4: Observe the journal**

Require `LINK_EXISTING`, provider readback only, exact role, request `ACTIVE`, same user/profile/Bug fingerprints, new email, complete immutable identity, and no provider PATCH. On timeout/ambiguity, read back before any action and do not blind retry.

- [ ] **Step 5: Functional acceptance**

Prove the linked member can sign in with the FPT SAP ID, sees the correct IDTS role, receives a controlled new notification at the new email, and existing Bugs remain assigned to the same profile. Prove a still-unlinked Developer cannot receive a new assignment.

- [ ] **Step 6: Repeat only after PASS**

Repeat the exact gate for DatDT, then NhanT after DonHV privately confirms NhanT's exact FPT email. Any failure stops before the next member.

### Task 12: Merge, closure, and worktree removal

- [ ] **Step 1: Merge only after exact approval**

Require green exact-head CI, source review, schema/runtime rollout evidence, controlled acceptance, final readiness, and DonHV merge approval.

- [ ] **Step 2: Prove reachability and cleanliness**

```powershell
git fetch origin --prune
$featureHead = (git rev-parse feature/wp8-existing-user-identity-link-donhv).Trim()
git merge-base --is-ancestor $featureHead origin/dev
git -C E:\IDTS-SAP01-worktrees\wp8-existing-user-identity-link-donhv status --porcelain -uall
```

Require merge-base exit 0 and empty status.

- [ ] **Step 3: Remove from outside the gate worktree**

```powershell
Set-Location E:\IDTS-SAP01
git worktree remove E:\IDTS-SAP01-worktrees\wp8-existing-user-identity-link-donhv
git worktree prune
git worktree list --porcelain
```

Stop on any dirty/unmerged/locked ambiguity; never use `--force` or manually delete the directory.

## Self-review result

- Spec coverage: authorization, data model, invitation, immutable verification, provider readback, atomic same-row completion, readiness, UI, audit/privacy, rollback, rollout, and per-member acceptance are each mapped to a task.
- Placeholder policy: runtime identifiers/signatures and the worktree path are exact. Rollout artifacts are generated and checksum-frozen by their owning gate before mutation.
- Type consistency: `linkTargetUser`, `linkSourceEmailNormalized`, `requestExistingUserIdentityLink`, and `LINK_EXISTING` use the same names across schema, service, CAP, broker, UI, tests, and evidence.
