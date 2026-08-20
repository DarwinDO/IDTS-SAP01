# Gate 3 Access Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe PM + UserAdmin role/capability changes, local suspension, provider-verified reactivation, and revoke lifecycle controls to Active Users.

**Architecture:** Reuse the existing operation journal, `requestRoleChange`, `requestRevoke`, broker reconciliation, session revocation, and audit. Add explicit suspend/reactivate actions and one `SUSPENDED` status; suspension is local-only while reactivation requires provider readback. Keep provider writes exclusively in the broker.

**Tech Stack:** SAP CAP Node.js transactions/CQL, CDS/OData V4 actions, SQLite/HANA-compatible model, SAPUI5 1.148.x, XSUAA/AppRouter, existing provisioning broker.

**Spec:** `docs/superpowers/specs/2026-08-20-gate-3-access-lifecycle-design.md`

## Global Constraints

- Start only after Gate 2 is merged and freeze the new `origin/dev` SHA.
- Branch: `feature/wp8-admin-access-lifecycle-donhv`.
- Exactly one business role; UserAdmin only with PM; protect final active PM + UserAdmin.
- Suspend/revoke revoke local sessions before external reconciliation.
- Suspend performs no provider write; reactivate activates only after exact readback.
- Never delete SAP ID, BTP shadow user, internal user, request, operation, audit, or Bug assignment.
- No client-selected Role Collection, IdP, endpoint, subaccount, external user ID, or provider method.
- No blind retry; stale versions and ambiguous outcomes fail closed.
- No dependency/framework upgrade.
- Executor stops at Draft PR; all status initialization, rollout, live role/session mutation, merge, and cleanup are coordinator gates.
- After merge, remove the exact clean worktree and prune metadata; never force-remove.

---

### Task 1: Freeze Gate 2 baseline and run security guidance

**Files:**
- Read the master design, Gate 3 design, WP8 work package, `srv/user-admin.js`, `srv/provisioning-broker.js`, `broker/lib/access-provisioning.js`, `db/schema.cds`, and status catalog CSV.

- [ ] **Step 1: Freeze source and verify clean branch**

```powershell
git fetch origin --prune
git rev-parse origin/dev
git status --short --branch
```

- [ ] **Step 2: Query CAP/UI5 guidance**

Query CAP MCP for request transactions, concurrent row locks, actions, and optimistic concurrency. Query UI5 MCP/Fiori docs for confirmation dialogs, destructive actions, busy states, messages, and semantic status. Record exact results.

- [ ] **Step 3: Run baseline suites**

```powershell
npm run qa:user-admin-active-users:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:user-admin-ui:programmatic
npx cds compile srv/user-admin.cds --to edmx
npx cds compile db/schema.cds --to hana
```

Expected: PASS/exit 0 before edits.

### Task 2: Add lifecycle status/action contracts with TDD

**Files:**
- Create: `scripts/qa/test-user-admin-access-lifecycle.js`
- Modify: `package.json`
- Modify: `db/data/idts.cap-UserOnboardingStatuses.csv`
- Modify: `srv/user-admin.cds`

**Interfaces:**
- Produces: `requestSuspend` and `requestReactivate` actions and `SUSPENDED` status.
- Reuses: `requestRoleChange` for business-role and UserAdmin capability changes; `requestRevoke` for permanent access removal.

- [ ] **Step 1: Write red static and catalog tests**

Require exact action signatures:

```cds
action requestSuspend(userID : UUID, reason : String(500), expectedVersion : Integer) returns OnboardingResult;
action requestReactivate(userID : UUID, reason : String(500), expectedVersion : Integer) returns OnboardingResult;
```

Require one active `SUSPENDED` catalog row and reject replacement/removal of existing 14 rows.

- [ ] **Step 2: Add npm command and prove RED**

```json
"qa:user-admin-access-lifecycle:programmatic": "node scripts/qa/test-user-admin-access-lifecycle.js"
```

```powershell
npm run qa:user-admin-access-lifecycle:programmatic
```

Expected: FAIL on absent actions/status.

- [ ] **Step 3: Add minimal CDS and additive CSV row**

Use sort order `105` for `SUSPENDED`, active `true`, warning criticality, placing it after `ACTIVE` and before failure states. Do not renumber or rewrite existing rows.

- [ ] **Step 4: Prove GREEN and compile**

```powershell
npm run qa:user-admin-access-lifecycle:programmatic
npx cds compile srv/user-admin.cds --to edmx
npx cds compile db/schema.cds --to hana
```

- [ ] **Step 5: Commit contract**

```powershell
git add package.json db/data/idts.cap-UserOnboardingStatuses.csv srv/user-admin.cds scripts/qa/test-user-admin-access-lifecycle.js
git diff --cached --check
git commit -m "feat: define access suspension lifecycle"
```

### Task 3: Implement local suspension and last-admin protection

**Files:**
- Create: `srv/user-admin/access-lifecycle.js`
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-user-admin-access-lifecycle.js`

**Interfaces:**
- Produces: `requestSuspend(req, dependencies)`, `assertNotFinalAdministrator(tx, targetUserID)`, and `revokeActiveSessions(tx, userID, at)`.
- Consumes: existing `requireActiveUserAdministrator`, transaction, active user/request resolution, and audit table.

- [ ] **Step 1: Write red transaction tests**

Cover:

- Valid non-final user suspension.
- Same-transaction `Users.active=false`, active `AuthSessions.revokedAt`, request `SUSPENDED`, version increment, and audit insert.
- No `UserAccessOperations` provider-write operation for suspend.
- Last PM + UserAdmin rejection.
- Two concurrent last-admin attempts cannot both succeed.
- Stale version/no reason/already revoked/inactive target rejection.

- [ ] **Step 2: Implement the focused module**

Use row locks on the target and active PM administration candidates, then re-count inside the transaction. Register from `UserAdministrationService.init` with dependencies instead of duplicating authorization.

Core transition shape:

```js
await tx.run(UPDATE(Users).set({ active: false }).where({ ID: user.ID, active: true }))
await tx.run(UPDATE(AuthSessions).set({ revokedAt: now }).where({ user_ID: user.ID, revokedAt: null }))
await tx.run(UPDATE(UserOnboardingRequests).set({ status_code: 'SUSPENDED', provisioningVersion: version + 1 }).where({ ID: request.ID, provisioningVersion: version }))
```

Require affected-row checks before audit/commit.

- [ ] **Step 3: Run backend regression**

```powershell
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:user-access:programmatic
npm run qa:immutable-identity:programmatic
npm run qa:user-onboarding:programmatic
```

- [ ] **Step 4: Commit suspension**

```powershell
git add srv/user-admin.js srv/user-admin/access-lifecycle.js scripts/qa/test-user-admin-access-lifecycle.js
git diff --cached --check
git commit -m "feat: suspend IDTS access safely"
```

### Task 4: Implement provider-verified reactivation

**Files:**
- Modify: `srv/user-admin/access-lifecycle.js`
- Modify: `srv/provisioning-broker.js`
- Modify: `broker/lib/access-provisioning.js`
- Modify: `broker/lib/sap-user-management-contract.js`
- Extend: `scripts/qa/test-user-admin-access-lifecycle.js`
- Extend: `scripts/qa/test-provisioning-broker-programmatic.js`
- Extend: `scripts/qa/test-user-access-broker-runtime.js`

**Interfaces:**
- Produces operation type `REACTIVATE` that permits read/reconcile but no provider PATCH.
- Broker returns `APPLIED` only when exact current role/capability state already matches desired state.

- [ ] **Step 1: Write red reconciliation tests**

Cover exact provider match, missing business role, extra business role, wrong UserAdmin overlay, immutable-user mismatch, timeout/read failure, idempotent repeated completion, and local activation only after `APPLIED` readback.

- [ ] **Step 2: Queue reactivation safely**

`requestReactivate` creates one operation with desired current reconciled role/capability, leaves `Users.active=false`, increments version, and audits `REQUEST_REACTIVATE`. It does not call provider directly.

- [ ] **Step 3: Extend broker allowlist**

For `REACTIVATE`, execute read-before and exact comparison, skip PATCH, return sanitized semantic result. Reject any contract containing a client-selected group or provider method.

- [ ] **Step 4: Complete local activation idempotently**

CAP sets request `ACTIVE` and user `active=true` in one transaction only after broker result/readback. Existing revoked sessions stay revoked; next login creates a new session.

- [ ] **Step 5: Run focused suites**

```powershell
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
```

- [ ] **Step 6: Commit reactivation**

```powershell
git add srv broker scripts/qa
git diff --cached --check
git commit -m "feat: reactivate access after provider readback"
```

### Task 5: Harden role/capability change and revoke invariants

**Files:**
- Modify: `srv/user-admin.js`
- Modify: `srv/user-admin/access-lifecycle.js`
- Extend: `scripts/qa/test-user-admin-access-lifecycle.js`
- Extend: `scripts/qa/test-user-access-provisioning-contract.js`

- [ ] **Step 1: Add red invariant tests**

Prove final-admin protection applies to role change, UserAdmin disable, suspend, and revoke; role change revokes sessions before queuing; capability-only PM changes use existing `requestRoleChange`; revoke preserves the internal user/audit and keeps local access denied on provider failure.

- [ ] **Step 2: Reuse one shared guard**

Call `assertNotFinalAdministrator` from every mutation that can remove active PM + UserAdmin authority. Do not add four independent counts.

- [ ] **Step 3: Run affected suites and commit**

```powershell
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:user-access:programmatic
npm run qa:user-onboarding:programmatic
git add srv scripts/qa
git diff --cached --check
git commit -m "fix: enforce access lifecycle invariants"
```

### Task 6: Add Active Users lifecycle UI

**Files:**
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify: `app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml`
- Create: `app/user-administration-ui/webapp/fragment/ConfirmAccessLifecycle.fragment.xml`
- Modify both i18n property files
- Extend: `scripts/qa/test-user-admin-ui.js`

- [ ] **Step 1: Write red UI tests**

Require state-driven actions, reason/confirmation, no duplicate submit, queued copy instead of success copy, no action on incomplete rows, and no client group/provider fields.

- [ ] **Step 2: Implement actions**

Change role/capability invokes existing `requestRoleChange`; suspend/reactivate/revoke invoke exact actions. Reload Active Users and Requests after a successful queue/transaction result. Use MessageBox only for interruption/confirmation and MessageToast only for acknowledged queued outcomes.

- [ ] **Step 3: Run UI verification**

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
```

- [ ] **Step 4: Commit UI**

```powershell
git add app/user-administration-ui scripts/qa/test-user-admin-ui.js
git diff --cached --check
git commit -m "feat: manage active user access lifecycle"
```

### Task 7: Documentation, final source gate, and Draft PR

**Files:**
- Update matching `docs/knowledge/` mirrors.
- Update canonical business docs because suspend/reactivate and last-admin rules change business meaning.
- Update WP8 task/status/decision evidence.
- Create `docs/pm/evidence/user-administration/gate-3-access-lifecycle-source.md`.

- [ ] **Step 1: Run OfficeCLI and synchronize docs**

```powershell
officecli --version
```

Update `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, and `docs/project-context.md` surgically with the approved semantics.

- [ ] **Step 2: Run final exact source gate**

```powershell
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
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git diff --check origin/dev...HEAD
```

- [ ] **Step 3: Commit, push, and create Draft PR**

Commit docs/evidence separately, push `feature/wp8-admin-access-lifecycle-donhv`, create a Draft PR with full QA Depth evidence, and stop. No status initialization, deployment, live session/role mutation, Ready transition, merge, or Gate 4 work.

### Task 8: Coordinator-only initialization, rollout, acceptance, merge, and cleanup

- [ ] **Step 1: Review exact source and generated schema delta**

Require zero Critical/Major, additive status row only, no unrelated `.hdbtabledata`, exact artifact hashes, and rollback package.

- [ ] **Step 2: Obtain separate approvals**

Split status initialization, CAP/UI/broker deployment, and each controlled user/session mutation. No executor self-approval.

- [ ] **Step 3: Run controlled acceptance**

Prove role/capability change, suspend, old-session denial, provider-verified reactivate, revoke fail-closed, last-admin negatives, persistence/reload, audit, and final readiness. Do not use the only PM for destructive positive tests.

- [ ] **Step 4: Merge and clean worktree**

After DonHV merge approval, run from the exact gate worktree:

```powershell
$gateWorktree = (git rev-parse --show-toplevel).Trim()
$featureHead = (git rev-parse HEAD).Trim()
git status --porcelain -uall
git fetch origin --prune
git merge-base --is-ancestor $featureHead origin/dev
Set-Location E:\IDTS-SAP01
git worktree remove $gateWorktree
git worktree prune
```

Require empty status output and merge-base exit 0 before removal. Stop on dirty/untracked/unmerged state and never use `--force`.
