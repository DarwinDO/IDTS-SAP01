# Gate 6 Operations and Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PM + UserAdmin operational visibility for invitation delivery, access operations, and append-only audit, with only state-valid bounded retry/reconcile actions.

**Architecture:** Build explicit safe DTO actions over existing `UserOnboardingDeliveries`, `UserAccessOperations`, and `UserIdentityAuditEvents`. Use server-side masking, fixed allowlists, bounded pagination, and existing retry/reconcile state guards. Add one onboarding-delivery retry action that resets only retry-safe delivery state and schedules the existing immediate outbox kick after commit.

**Tech Stack:** SAP CAP Node.js/CQL, CDS/OData V4 actions, existing email worker/outbox, SAPUI5 1.148.x, existing HANA entities; no new runtime service or dependency.

**Spec:** `docs/superpowers/specs/2026-08-20-gate-6-operations-audit-design.md`

## Global Constraints

- Start from refreshed `origin/dev` after required earlier gates merge.
- Branch: `feature/wp8-admin-operations-audit-donhv`.
- PM + UserAdmin only; exact-one PM business role.
- Return no message body, HTML, raw email where not needed, provider message ID, lock token, lease token/hash, idempotency key, provider correlation hash, identity before/after hash, endpoint, credential, JWT, or raw error.
- Server pagination maximum is 100 rows; default is 25.
- Permanent failures cannot Retry; ambiguous provider outcomes expose Reconcile only; no blind retry.
- No BTP health probing, binding/env inspection, log streaming, service restart, or infrastructure control.
- No schema change unless measured query performance later proves an index is required; indexes are not speculative Gate 6 scope.
- Executor stops at Draft PR; no delivery/provider mutation, deployment, merge, or later feature work.
- After merge, remove the exact clean worktree and prune; never force-remove.

---

### Task 1: Freeze baseline and map safe operational fields

**Files:**
- Read `db/schema.cds` delivery/operation/audit entities.
- Read `srv/user-admin.js`, `srv/user-admin/delivery.js`, `srv/email/worker.js`, and UI controller.

- [ ] **Step 1: Freeze and baseline**

```powershell
git fetch origin --prune
git rev-parse origin/dev
git status --short --branch
npm run qa:user-onboarding:programmatic
npm run qa:user-access:programmatic
npm run qa:user-admin-ui:programmatic
```

- [ ] **Step 2: Query MCP/UI guidance**

Use CAP MCP for actions, explicit projections, pagination, transactions, and authorization. Use UI5/Fiori guidance for operational tables, filters, semantic statuses, MessageBox/MessageToast, busy/error handling, and accessibility.

- [ ] **Step 3: Freeze field allowlists**

Create test constants for Delivery, Operation, and Audit safe output fields before implementing handlers. Anything not allowlisted is rejected from serialized result snapshots.

### Task 2: Define Operations/Audit OData DTOs and actions with RED tests

**Files:**
- Create: `scripts/qa/test-user-admin-operations-audit.js`
- Modify: `package.json`
- Modify: `srv/user-admin.cds`

**Interfaces:**
- Produces:

```text
searchOnboardingDeliveries(status, query, skip, top)
searchAccessOperations(state, operationType, skip, top)
searchAccessAuditEvents(action, result, from, to, skip, top)
readAdministrationReadiness()
retryOnboardingDelivery(deliveryID, expectedModifiedAt)
```

- [ ] **Step 1: Write red contract tests**

Require exact type/action names, `top <= 100`, safe result fields, and absence of forbidden persistence fields. `expectedModifiedAt` is `Timestamp` and becomes the optimistic-concurrency token for delivery retry.

- [ ] **Step 2: Add npm command and prove RED**

```json
"qa:user-admin-operations:programmatic": "node scripts/qa/test-user-admin-operations-audit.js"
```

```powershell
npm run qa:user-admin-operations:programmatic
```

Expected: FAIL on missing contracts.

- [ ] **Step 3: Add DTO/action definitions**

Use structured types rather than exposing persistence entities. Return safe actor/target display strings and a 12-character correlation fingerprint, never raw UUID/hash.

- [ ] **Step 4: Compile and commit**

```powershell
npm run qa:user-admin-operations:programmatic
npx cds compile srv/user-admin.cds --to edmx
git add package.json srv/user-admin.cds scripts/qa/test-user-admin-operations-audit.js
git diff --cached --check
git commit -m "feat: define administration operations read models"
```

### Task 3: Implement safe read models and bounded pagination

**Files:**
- Create: `srv/user-admin/operations-audit.js`
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-user-admin-operations-audit.js`

**Interfaces:**
- Produces `registerOperationsAuditHandlers(service, dependencies)` and pure helpers `clampPage`, `maskRecipient`, `correlationFingerprint`, and safe DTO mappers.
- Consumes existing `requireActiveUserAdministrator`.

- [ ] **Step 1: Write red behavior tests**

Cover authorization matrix, default/max page, stable `createdAt desc, ID desc` ordering, filters, recipient masking, safe mapping, no forbidden fields, empty results, invalid date range, and audit immutability.

- [ ] **Step 2: Implement pure safe helpers**

```js
function clampPage (skip, top) {
  const safeSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0
  const safeTop = Number.isInteger(top) && top > 0 ? Math.min(top, 100) : 25
  return { skip: safeSkip, top: safeTop }
}
```

Mask recipient display server-side. Generate correlation fingerprint with SHA-256 over the UUID and return only the first 12 lowercase hex characters; never log the input or full hash.

- [ ] **Step 3: Implement explicit-column queries**

Read only allowlisted columns and associations needed for authorized actor/target display. `readAdministrationReadiness` derives from persisted recent outcomes; it performs no network/binding/env call.

- [ ] **Step 4: Register handlers and prove GREEN**

```powershell
npm run qa:user-admin-operations:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-access:programmatic
npx cds compile srv/user-admin.cds --to edmx
```

- [ ] **Step 5: Commit read models**

```powershell
git add srv/user-admin.js srv/user-admin/operations-audit.js scripts/qa/test-user-admin-operations-audit.js
git diff --cached --check
git commit -m "feat: add safe administration operations views"
```

### Task 4: Add state-valid onboarding-delivery retry

**Files:**
- Modify: `srv/user-admin/operations-audit.js`
- Modify: `srv/email/worker.js` only if a test proves the existing `scheduleImmediateEmailOutbox` interface cannot be reused.
- Extend: `scripts/qa/test-user-admin-operations-audit.js`
- Extend existing email immediate-kick tests.

- [ ] **Step 1: Write red retry tests**

Cover:

- Only `FAILED` with an allowlisted retryable code may reset.
- `SENT`, `PENDING`, permanent failure, exhausted attempt ceiling, stale `modifiedAt`, locked row, and duplicate click reject without writes.
- Reset exactly: status `PENDING`, `nextAttemptAt=now`, `lastErrorCode=null`, `lastErrorSummary=null`, `lockedUntil=null`, `lockToken=null`.
- Preserve recipient/template/body/provider history fields.
- Append audit in the same transaction.
- Schedule immediate outbox only after commit; provider is not called in the request transaction.

- [ ] **Step 2: Implement optimistic update**

Use a single UPDATE predicate containing ID, current status, attempt ceiling, lock availability, and expected `modifiedAt`. `affectedRows=1` is success; zero requires sanitized readback and conflict/not-eligible classification, never blind retry.

- [ ] **Step 3: Reuse the existing immediate kick**

Call `scheduleImmediateEmailOutbox` only after the transaction resolves successfully. The hourly scheduler remains recovery. Do not introduce another worker/queue.

- [ ] **Step 4: Run email/access regressions and commit**

```powershell
npm run qa:user-admin-operations:programmatic
node scripts/qa/test-email-immediate-kick.js
npm run qa:user-onboarding:programmatic
npm run qa:user-access:programmatic
git add srv scripts/qa
git diff --cached --check
git commit -m "feat: retry onboarding delivery safely"
```

### Task 5: Build Operations and Audit UI tabs

**Files:**
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Create: `app/user-administration-ui/webapp/fragment/OperationDetails.fragment.xml`
- Create: `app/user-administration-ui/webapp/fragment/AuditDetails.fragment.xml`
- Modify formatter and both i18n files.
- Extend: `scripts/qa/test-user-admin-ui.js`

- [ ] **Step 1: Write red UI contract**

Require Delivery/Provisioning subtabs, Audit tab, status/date/type filters, growing/pagination behavior, safe details, readiness summary, state-driven action visibility, no raw fields, responsive pop-ins, busy/empty/error states, and accessible text/tooltips.

- [ ] **Step 2: Implement lazy models**

Create separate `deliveries`, `operations`, `audit`, and `adminReadiness` JSON models. Load only the selected tab. Do not merge operational rows into Access Requests or Active Users models.

- [ ] **Step 3: Wire bounded actions**

Delivery retry invokes `retryOnboardingDelivery`. Provisioning Retry/Reconcile reuse existing actions. Disable controls while submitting; display queued/reconciliation copy and reload the affected row/list.

- [ ] **Step 4: Verify and commit**

```powershell
npm run qa:user-admin-ui:programmatic
npm run qa:user-admin-operations:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git add app/user-administration-ui scripts/qa/test-user-admin-ui.js
git diff --cached --check
git commit -m "feat: add operations and audit administration views"
```

### Task 6: Documentation, security snapshots, and Draft PR

**Files:**
- Update user-admin, email-worker, and UI knowledge mirrors.
- Update WP8/current/member status and risk decision when safe operational visibility becomes durable behavior.
- Create: `docs/pm/evidence/user-administration/gate-6-operations-audit-source.md`.

- [ ] **Step 1: OfficeCLI and docs**

```powershell
officecli --version
```

Canonical docs need only surgical updates for PM operational visibility and retry/audit rules; do not describe infrastructure control.

- [ ] **Step 2: Add forbidden-field response/log snapshot checks**

The focused test scans DTO snapshots, EDMX, UI source, and captured log records for token, credential, endpoint, raw email body, lock/lease/idempotency/provider hashes, and private identity fields.

- [ ] **Step 3: Run final source gate**

```powershell
npm run qa:user-admin-operations:programmatic
npm run qa:user-admin-active-users:programmatic
npm run qa:user-admin-access-lifecycle:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npm run qa:user-access-broker:programmatic
npm run qa:immutable-identity:programmatic
node scripts/qa/test-email-immediate-kick.js
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git diff --check origin/dev...HEAD
```

- [ ] **Step 4: Commit, push Draft PR, and stop**

Push `feature/wp8-admin-operations-audit-donhv`, create a complete Draft PR, and return the required report. No live retry/reconcile, deployment, merge, or new feature.

### Task 7: Coordinator-only rollout, acceptance, merge, and cleanup

- [ ] **Step 1: Independent exact-head/security review**

Require zero Critical/Major and prove no schema/artifact drift beyond CAP/UI source.

- [ ] **Step 2: Selective rollout approval**

Deploy only checksum-reviewed CAP/shared UI artifacts. Preserve both HTML5 apps and all main bindings/routes. No DB/broker deployment unless exact diff proves it necessary.

- [ ] **Step 3: Controlled acceptance**

Use existing sanitized failed/completed rows where possible. Prove PM positive, negative roles, filters/pagination, safe details, reload, permanent/ambiguous action hiding, one bounded retry only when approved, audit append, and no secret/provider output. Do not manufacture a real outage.

- [ ] **Step 4: Merge and remove worktree**

After DonHV approval and exact-head CI/runtime PASS, merge, then run from the gate worktree:

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

Require empty status and merge-base exit 0. Never force-remove.
