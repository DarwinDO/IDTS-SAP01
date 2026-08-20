# Gate 2 Active Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PM + UserAdmin read-only Active Users tab that returns one safe row per IDTS user and separates current access from invitation history.

**Architecture:** Extend `UserAdministrationService` with two read-only custom actions backed by a focused `srv/user-admin/active-users.js` module. Reuse existing Users, onboarding requests, operations, and Developer profile data; add no schema. Extend the existing custom SAPUI5 application with an `IconTabBar`, dedicated JSON model, responsive table, and details dialog.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, CQL, SAPUI5 1.148.x, QUnit-style repository Node contract tests, SQLite in-memory test database, SAP HANA compile target.

**Spec:** `docs/superpowers/specs/2026-08-20-gate-2-active-users-design.md`

## Global Constraints

- Start from a freshly fetched `origin/dev` after the planning package is merged.
- Branch: `feature/wp8-admin-active-users-donhv`.
- No `db/schema.cds`, CSV, HDI, XSUAA, broker, provider, user-role, session, BTP, Jira, or Drive mutation.
- Reuse `requireActiveUserAdministrator`; UI visibility never authorizes a read.
- Return no origin, issuer, subject, identity hash, platform user ID, idempotency key, lease token/hash, provider correlation hash, raw provider result, credential, endpoint, or JWT.
- Keep SAPUI5 framework version unchanged; do not add dependencies.
- Preserve the shared Bug Management UI content package.
- The executor stops at a Draft PR. Deployment and merge require separate DonHV decisions.
- After merge, remove the exact clean worktree and prune worktree metadata; never force-remove it.

---

### Task 1: Create the isolated gate branch and prove the baseline

**Files:**
- Read: `AGENTS.md`
- Read: `docs/project-context.md`
- Read: `docs/pm/tasks/wp8-user-administration-roadmap.md`
- Read: `docs/superpowers/specs/2026-08-20-user-administration-roadmap-master-design.md`
- Read: `docs/superpowers/specs/2026-08-20-gate-2-active-users-design.md`

**Interfaces:**
- Consumes: merged `origin/dev` and the approved design package.
- Produces: clean isolated branch and baseline evidence.

- [ ] **Step 1: Freeze the base**

```powershell
git fetch origin --prune
git rev-parse origin/dev
git status --short --branch
```

Expected: clean worktree; record the exact base SHA in the task handoff.

- [ ] **Step 2: Query required SAP guidance**

Use CAP MCP for custom actions, request transactions, explicit-column CQL, and authorization. Use UI5 MCP guidelines/project info and Fiori documentation for `IconTabBar`, responsive tables, busy/error messaging, and accessibility. Record guidance and limitations without modifying source.

- [ ] **Step 3: Run the current focused baseline**

```powershell
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npx cds compile srv/user-admin.cds --to edmx
npx cds compile db/schema.cds --to hana
```

Expected: all commands exit 0; the pre-existing attachment vocabulary warning may be recorded but no new warning is accepted.

### Task 2: Define the Active Users OData contract with a red test

**Files:**
- Create: `scripts/qa/test-user-admin-active-users.js`
- Modify: `package.json`
- Modify: `srv/user-admin.cds`

**Interfaces:**
- Consumes: existing `UserAdministrationService` and UUID types.
- Produces: `searchActiveUsers` and `readActiveUserDetails` action signatures plus result types.

- [ ] **Step 1: Write static contract assertions**

The test reads `srv/user-admin.cds` and requires these exact names:

```js
const required = [
  'type ActiveUserSummary',
  'type ActiveUserDetails',
  'action searchActiveUsers(',
  'action readActiveUserDetails('
]
for (const marker of required) assert.ok(cdsSource.includes(marker), marker)
```

It also rejects forbidden output fields:

```js
for (const forbidden of ['identityOrigin', 'identityIssuer', 'identitySubject', 'identityKeyHash', 'identityPlatformUserId']) {
  assert.ok(!activeUserContract.includes(forbidden), forbidden)
}
```

- [ ] **Step 2: Add the npm command and prove RED**

Add:

```json
"qa:user-admin-active-users:programmatic": "node scripts/qa/test-user-admin-active-users.js"
```

Run:

```powershell
npm run qa:user-admin-active-users:programmatic
```

Expected: FAIL because the types/actions are absent.

- [ ] **Step 3: Add the minimum CDS contract**

Add fields specified by the design. Exact action signatures:

```cds
action searchActiveUsers(query : String(255), includeNonActive : Boolean) returns many ActiveUserSummary;
action readActiveUserDetails(userID : UUID) returns ActiveUserDetails;
```

Use `accessState`, `identityLinked`, `developerReady`, `activeResponsibilityCount`, `pendingOperationType`, `pendingOperationState`, `lastSafeResultCode`, and `lastReconciledAt`. Details add counts, not raw rows.

- [ ] **Step 4: Prove GREEN and compile**

```powershell
npm run qa:user-admin-active-users:programmatic
npx cds compile srv/user-admin.cds --to edmx
```

Expected: PASS and exit 0.

- [ ] **Step 5: Commit the contract**

```powershell
git add srv/user-admin.cds scripts/qa/test-user-admin-active-users.js package.json
git diff --cached --check
git commit -m "feat: define active user administration read model"
```

### Task 3: Implement deterministic Active User aggregation

**Files:**
- Create: `srv/user-admin/active-users.js`
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-user-admin-active-users.js`

**Interfaces:**
- Consumes: `{ authorize, tx, query, includeNonActive }` and existing persisted entities.
- Produces: `registerActiveUserHandlers(service, dependencies)`, `searchActiveUsers`, `readActiveUserDetails`, and pure `deriveAccessState` for tests.

- [ ] **Step 1: Add red fixtures**

Cover:

- One user with active plus two expired request rows returns one row.
- Latest request uses deterministic `modifiedAt desc, ID desc` ordering.
- Latest operation is selected only for the chosen request.
- Incomplete identity returns `identityLinked=false` and no tuple.
- Revoked rows are excluded by default and included when requested.
- Role/status search is case-insensitive and query length is bounded.
- Ambiguous duplicate active requests return `INCOMPLETE`, not an arbitrary winner.

Run and require failure before implementation.

- [ ] **Step 2: Implement explicit-column CQL**

Create the module with request-local state only. Use explicit columns and request transaction; do not cache rows in module scope. Export:

```js
function registerActiveUserHandlers (service, { authorize })
async function searchActiveUsers (req, { authorize })
async function readActiveUserDetails (req, { authorize })
function deriveAccessState ({ userActive, requestStatus })
```

`registerActiveUserHandlers` attaches both action handlers. `authorize(req, tx)` runs before every query.

- [ ] **Step 3: Register the focused module**

In `UserAdministrationService.init`, call:

```js
registerActiveUserHandlers(this, { authorize: requireActiveUserAdministrator })
```

Do not move unrelated onboarding logic from `srv/user-admin.js`.

- [ ] **Step 4: Run focused and affected backend tests**

```powershell
npm run qa:user-admin-active-users:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-access:programmatic
npx cds compile srv/user-admin.cds --to edmx
npx cds compile db/schema.cds --to hana
```

Expected: all PASS; no schema diff.

- [ ] **Step 5: Commit backend behavior**

```powershell
git add srv/user-admin.js srv/user-admin/active-users.js scripts/qa/test-user-admin-active-users.js
git diff --cached --check
git commit -m "feat: add active user administration queries"
```

### Task 4: Add the Active Users UI tab and details dialog

**Files:**
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: `app/user-administration-ui/webapp/model/formatter.js`
- Create: `app/user-administration-ui/webapp/fragment/ActiveUserDetails.fragment.xml`
- Modify: `app/user-administration-ui/webapp/i18n/i18n.properties`
- Modify: `app/user-administration-ui/webapp/i18n/i18n_en.properties`
- Extend: `scripts/qa/test-user-admin-ui.js`

**Interfaces:**
- Consumes: `/searchActiveUsers(...)` and `/readActiveUserDetails(...)`.
- Produces: `activeUsers` JSON model, `onActiveUsersSearch`, `onOpenActiveUserDetails`, and read-only details dialog.

- [ ] **Step 1: Write red UI contract checks**

Require:

- `IconTabBar` with keys `requests`, `activeUsers`, and `developerResponsibilities`.
- Dedicated `activeUsers` model; request model remains separate.
- Friendly status formatter; raw identity fields absent.
- Details dialog contains no mutation buttons.
- New i18n keys exist in both property files.

- [ ] **Step 2: Run RED**

```powershell
npm run qa:user-admin-ui:programmatic
```

Expected: FAIL on missing tab/model/dialog.

- [ ] **Step 3: Implement view and controller**

Initialize:

```js
this.setModel(new JSONModel({ items: [], query: "", includeNonActive: false, loaded: false }), "activeUsers");
```

Load only when the tab first activates. Bind the responsive table to `activeUsers>/items`. Use `ObjectStatus`, explicit column headers, busy state, no-data copy, accessible button text/tooltip, and one View Details action.

- [ ] **Step 4: Prove UI GREEN**

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
```

Expected: PASS, exit 0.

- [ ] **Step 5: Commit UI**

```powershell
git add app/user-administration-ui scripts/qa/test-user-admin-ui.js
git diff --cached --check
git commit -m "feat: separate active users from access requests"
```

### Task 5: Synchronize knowledge and release evidence

**Files:**
- Modify: `docs/knowledge/srv/user-admin.cds.md`
- Modify: `docs/knowledge/srv/user-admin.js.md`
- Create: `docs/knowledge/srv/user-admin/active-users.js.md`
- Modify: `docs/knowledge/app/user-administration-ui.md`
- Modify: `docs/pm/status/donhv.md`
- Modify: `docs/pm/tasks/wp8-user-administration-roadmap.md`
- Create: `docs/pm/evidence/user-administration/gate-2-active-users-source.md`

**Interfaces:**
- Consumes: exact implementation/test results.
- Produces: reviewable source evidence without runtime claims.

- [ ] **Step 1: Run OfficeCLI preflight**

```powershell
officecli --version
```

- [ ] **Step 2: Update mirrors and evidence**

Document the deduplication rule, safe fields, authorization boundary, current limitations, commands and exact results. State that Gate 2 does not change canonical business rules, schema, or platform state.

- [ ] **Step 3: Run final source gate**

```powershell
npm run qa:user-admin-active-users:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npm run qa:immutable-identity:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv/user-admin.cds --to edmx
npx cds compile db/schema.cds --to hana
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git diff --check origin/dev...HEAD
```

Expected: all exit 0; schema inventory unchanged.

- [ ] **Step 4: Commit evidence**

```powershell
git add docs
git diff --cached --check
git commit -m "docs: record active users source gate"
```

### Task 6: Push a Draft PR and stop for coordinator review

- [ ] **Step 1: Push the exact branch**

```powershell
git push -u origin feature/wp8-admin-active-users-donhv
```

- [ ] **Step 2: Create a Draft PR against `dev`**

The PR body must include all QA Depth sections, exact commands, no-schema/no-platform mutation statement, MCP/skill results, known warnings, and Gate 2 manual acceptance still pending.

- [ ] **Step 3: Return the required executor report**

Stop. Do not deploy, mark Ready, merge, or start Gate 3.

### Task 7: Coordinator-only rollout, merge, and worktree cleanup

- [ ] **Step 1: Independent exact-head review**

The coordinator fetches the branch, reviews the full diff, reruns source gates, and requires zero Critical/Major findings.

- [ ] **Step 2: Request separate rollout approval**

The rollout may update only CAP and the shared UI content after exact artifact review. It must prove both Bug Management and User Administration UI content remain packaged. No DB deploy is allowed.

- [ ] **Step 3: Complete manual acceptance**

PM + UserAdmin positive, Tester negative, deduplicated row, details, reload persistence, and unchanged Bug UI must pass.

- [ ] **Step 4: Merge only after DonHV approval**

Refresh `origin/dev`, prove the merge commit includes the feature HEAD, and sync clean local `dev` with `--ff-only`.

- [ ] **Step 5: Remove the gate worktree**

From outside the worktree:

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

Require empty status output and merge-base exit 0 before changing directory. Stop instead of removal if the worktree is dirty, the head is not merged, or any untracked user file exists. Never use `--force`.
