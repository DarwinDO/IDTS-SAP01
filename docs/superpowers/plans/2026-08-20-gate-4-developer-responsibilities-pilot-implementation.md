# Gate 4 Developer Responsibilities Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the merged Developer onboarding/profile/responsibility foundation is complete and execute one controlled non-member Developer pilot without automatic Bug reassignment.

**Architecture:** Add a focused cross-layer acceptance contract around existing Developer provisioning, atomic profile materialization, optimistic administration, and Smart Assign filtering. Fix only reproducible source gaps. The live pilot uses the standard invitation and operation journal; no direct role assignment or database write is permitted.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, existing provisioning broker, SAPUI5 administration UI, HANA/HDI already migrated by Gate 1, BTP CLI/CF read-only evidence, existing Smart Assign service.

**Spec:** `docs/superpowers/specs/2026-08-20-gate-4-developer-responsibilities-pilot-design.md`

## Global Constraints

- Start only after Gate 3 is merged and deployed; freeze fresh `origin/dev` and runtime provenance.
- Branch: `feature/wp8-admin-developer-pilot-donhv`.
- Use one controlled non-member SAP ID; never DonHV or an existing member identity.
- No direct BTP role assignment, HANA DML, seed reload, shadow-user creation/deletion, arbitrary group/role mutation, or email/credential output.
- A Developer is `ACTIVE` only after exact provider readback and active profile with at least one valid active responsibility.
- Existing Bug assignees never change automatically.
- Source changes require a failing test; if all new tests pass on baseline, the source deliverable is tests/evidence only.
- Executor cannot run live invitation/provider mutation, deploy, merge, or start Gate 5.
- After merge/completion, remove the clean gate worktree and prune; never force-remove.

---

### Task 1: Freeze baseline and audit the existing Developer flow

**Files:**
- Read: `db/schema.cds`
- Read: `srv/user-admin.cds`
- Read: `srv/user-admin.js`
- Read: `srv/user-admin/developer-profile.js`
- Read: `srv/bug-service/helpers.js`
- Read: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Read Developer fragments and existing Developer QA scripts.

- [ ] **Step 1: Freeze source and query MCP**

```powershell
git fetch origin --prune
git rev-parse origin/dev
git status --short --branch
```

Query CAP MCP for atomic transactions, compositions/associations, and explicit read models; UI5 MCP for form validation, table edits, dialogs, and message handling.

- [ ] **Step 2: Run existing Developer foundation tests**

```powershell
node scripts/qa/test-user-admin-developer-profile.js
node scripts/qa/test-user-admin-developer-profile-actions.js
node scripts/qa/test-developer-provisioning-completion.js
npm run qa:user-onboarding:programmatic
npm run qa:user-access:programmatic
npm run qa:user-admin-ui:programmatic
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
```

Expected: PASS before new acceptance coverage.

### Task 2: Add the cross-layer Developer pilot contract

**Files:**
- Create: `scripts/qa/test-developer-responsibility-pilot-contract.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing Developer invitation, provisioning completion, profile update, and Smart Assign functions.
- Produces: one command proving all source invariants needed before live mutation.

- [ ] **Step 1: Add the npm command**

```json
"qa:developer-pilot:programmatic": "node scripts/qa/test-developer-responsibility-pilot-contract.js"
```

- [ ] **Step 2: Write the acceptance assertions**

The test must execute real exported/pure source paths or in-memory CAP handlers and prove:

1. Standard `DEVELOPER` verification auto-queues provisioning without `PENDING_APPROVAL`.
2. Zero responsibilities, inactive catalog, invalid level, invalid workload, and duplicate scope fail before queue/completion.
3. Provider success plus local completion atomically creates/reactivates one profile and unique responsibilities before `ACTIVE`.
4. Repeated completion is idempotent and creates no duplicate rows.
5. Local completion failure after provider success leaves request non-active and user unavailable for assignment.
6. Active responsibility includes the Developer in matching assignment candidates.
7. Inactive responsibility excludes the Developer from new candidates.
8. Existing Bug assignee stays unchanged through deactivate/reactivate fixtures.
9. Stale administration version conflicts without writes.

- [ ] **Step 3: Run the new contract on unmodified source**

```powershell
npm run qa:developer-pilot:programmatic
```

If PASS, do not modify product code. If FAIL, record the exact failing invariant and continue only with the matching task below; do not generalize the fix.

- [ ] **Step 4: Commit the acceptance harness**

```powershell
git add package.json scripts/qa/test-developer-responsibility-pilot-contract.js
git diff --cached --check
git commit -m "test: define developer responsibility pilot contract"
```

### Task 3: Fix only a proven backend completion/readiness gap

**Files if the new test proves a gap:**
- Modify: `srv/user-admin.js`
- Modify: `srv/user-admin/developer-profile.js`
- Modify: `srv/bug-service/helpers.js`
- Extend: the failing focused test only.

**Interfaces:**
- Reuses existing `normalizeDeveloperProfileInput`, catalog validation, materialization, readiness calculation, and assignment candidate logic.
- Produces no new public action unless the approved spec cannot be met with existing actions.

- [ ] **Step 1: Capture RED evidence**

Run the single failing test and record its exact assertion. Do not edit code before this evidence exists.

- [ ] **Step 2: Implement the smallest shared-root fix**

Examples of allowed fixes are one transaction boundary correction, one idempotent upsert guard, or one shared readiness predicate used by both User Administration and Smart Assign. Do not create a second Developer profile engine.

- [ ] **Step 3: Prove RED/GREEN regression**

Run the focused test with the fix, temporarily verify the test fails against the parent implementation without committing a revert, restore the fix, and rerun PASS.

- [ ] **Step 4: Run affected suites and commit only if source changed**

```powershell
npm run qa:developer-pilot:programmatic
node scripts/qa/test-developer-provisioning-completion.js
node scripts/qa/test-user-admin-developer-profile-actions.js
npm run qa:user-access:programmatic
git add srv scripts/qa
git diff --cached --check
git commit -m "fix: enforce developer assignment readiness"
```

If no source gap exists, skip the commit; the test commit remains the deliverable.

### Task 4: Harden Manage Responsibilities UI acceptance

**Files:**
- Extend: `scripts/qa/test-user-admin-ui.js`
- Modify UI/controller/fragment/i18n only if a red test proves a gap.

- [ ] **Step 1: Add UI contract checks**

Require availability/workload, add/edit/deactivate/reactivate responsibility, active catalog value helps, reason/confirmation, impact count, version parameter, duplicate-submit guard, reload refresh, and no automatic reassignment copy.

- [ ] **Step 2: Run the current UI test**

```powershell
npm run qa:user-admin-ui:programmatic
```

If PASS, keep UI source unchanged. If FAIL, implement only the missing approved behavior.

- [ ] **Step 3: Verify and commit**

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git add scripts/qa/test-user-admin-ui.js app/user-administration-ui
git diff --cached --check
git commit -m "test: cover developer responsibility administration"
```

### Task 5: Prepare source evidence and Draft PR

**Files:**
- Update matching knowledge mirrors only when source changes.
- Modify: `docs/pm/status/donhv.md`
- Modify: `docs/pm/tasks/wp8-user-administration-roadmap.md`
- Create: `docs/pm/evidence/user-administration/gate-4-developer-pilot-source.md`

- [ ] **Step 1: Run OfficeCLI and document truth**

```powershell
officecli --version
```

Clearly state whether product source changed or the merged foundation already met the strengthened contract. Do not claim live Developer acceptance.

- [ ] **Step 2: Run final source gate**

```powershell
npm run qa:developer-pilot:programmatic
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

- [ ] **Step 3: Push Draft PR and stop**

Push `feature/wp8-admin-developer-pilot-donhv`, create a Draft PR, report exact head/tests/gaps, and stop. No invitation, email, provider call, BTP mutation, merge, or Gate 5 work.

### Task 6: Coordinator-only controlled pilot preflight

- [ ] **Step 1: Review source and runtime provenance**

Require zero Critical/Major, exact deployed source/artifact parity, `DEMO READY`, broker 1/1 zero-route, and unchanged trust/default provider.

- [ ] **Step 2: Prove controlled identity ownership privately**

Require one non-member SAP ID chosen by DonHV, no conflicting internal identity/request/IDTS role assignment, and no credential/PII output. If no suitable identity exists, mark the pilot `BLOCKED_IDENTITY` and stop without mutation.

- [ ] **Step 3: Freeze catalog inputs**

Read active availability, workload rule, Component Category, optional SAP Module, and responsibility level. Record only sanitized labels/fingerprints in evidence.

### Task 7: Coordinator-only live pilot and acceptance

- [ ] **Step 1: DonHV submits one Developer invitation**

Use the UI and exact desired profile. Verify one request and one delivery; no duplicate invitation.

- [ ] **Step 2: Controlled user verifies identity**

The user uses the official SAP flow. Do not capture password, OTP, cookie, JWT, callback code, or raw identity tuple.

- [ ] **Step 3: Observe operation journal to completion**

No direct PATCH. On timeout/ambiguity, read back before any action. PASS requires exactly `IDTS_DEVELOPER`, internal active Developer, ready profile, unique responsibilities, request `ACTIVE`, and sanitized audit.

- [ ] **Step 4: Prove Manage Responsibilities and Smart Assign**

DonHV updates profile, deactivates/reactivates one responsibility with impact readback, reloads, and verifies matching/nonmatching Smart Assign behavior. Existing Bug assignees must remain unchanged.

- [ ] **Step 5: Final readiness and evidence**

```powershell
npm run btp:demo:check
```

Record positive, negative, persistence/reload, role, audit, and no-auto-reassignment evidence.

### Task 8: Merge/closure and worktree removal

- [ ] **Step 1: Merge only after DonHV approval and green exact-head CI**

If the branch contains tests/docs only, merge still requires normal review. If it contains source, require exact rollout evidence first.

- [ ] **Step 2: Prove merge and worktree cleanliness**

Refresh `origin/dev`; prove the feature HEAD is an ancestor; require zero modified/untracked files.

- [ ] **Step 3: Remove from outside the worktree**

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

Require empty status output and merge-base exit 0 before removal. Stop on any dirty/unmerged ambiguity and never use `--force`.
