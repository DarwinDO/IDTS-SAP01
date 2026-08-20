# Gate 5 Business Catalogs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe PM + UserAdmin administration for SAP Modules, Application Components, Defect Categories, and Component Categories without hard deletion or historical-data breakage.

**Architecture:** Reuse existing managed catalog entities through dedicated User Administration service projections. Use native CAP CREATE/UPDATE with server authorization, validation, ETags, no DELETE, read-only impact analysis, and a new append-only catalog audit table. Deliver the read-only explorer before enabling mutations.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4 managed projections, HANA/SQLite-compatible constraints and transactions, SAPUI5 1.148.x, additive HDI migration.

**Spec:** `docs/superpowers/specs/2026-08-20-gate-5-business-catalog-administration-design.md`

## Global Constraints

- Start only after Gate 4 is merged; freeze current `origin/dev`.
- Branch: `feature/wp8-admin-business-catalogs-donhv`.
- Gate 5 may be deferred for funding without blocking Gates 2–4.
- No hard delete, CSV/seed replacement, generic entity editor, direct SQL/HANA UI, mass import, or automatic Bug/Responsibility migration.
- PM + UserAdmin authorization is enforced on every catalog read/write administration endpoint.
- IDs are immutable; codes normalize uppercase and trim; historical referenced rows remain readable.
- No framework/dependency upgrade.
- HDI changes are additive only and require simulation plus separate mutation approval.
- Executor stops at Draft PR; no schema migration, catalog write, deployment, merge, or Gate 6 work.
- After merge, remove the clean gate worktree and prune; never force-remove.

---

### Task 1: Audit catalogs, references, and native CAP guidance

**Files:**
- Read catalog entities and references in `db/schema.cds`.
- Read Bug/Developer validation handlers.
- Read User Administration service/UI.
- Read generated HANA artifacts after a clean compile.

- [ ] **Step 1: Freeze source and run baseline**

```powershell
git fetch origin --prune
git rev-parse origin/dev
git status --short --branch
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
npm run qa:user-admin-ui:programmatic
```

- [ ] **Step 2: Query MCP**

Use CAP MCP for writable projections, `@odata.etag`, uniqueness, CREATE/UPDATE/DELETE interception, and transactions. Use UI5/Fiori guidance for editable tables, forms, confirmation, value states, and object status. Record exact guidance and syntax constraints.

- [ ] **Step 3: Record the current reference matrix**

At minimum map:

- `Bugs.sapModule` → SAP Modules.
- `Bugs.applicationComponent` → Application Components.
- `Bugs.defectCategory` → Defect Categories.
- `Bugs.componentCategory` and Developer Responsibilities → Component Categories.
- Component Categories → Application Component + Defect Category.

### Task 2: Add catalog uniqueness and audit model with red tests

**Files:**
- Create: `scripts/qa/test-user-admin-catalog-model.js`
- Modify: `package.json`
- Modify: `db/schema.cds`

**Interfaces:**
- Produces database uniqueness and `CatalogAdministrationAuditEvents`.

- [ ] **Step 1: Write RED model checks**

Require:

```text
SAPModules.code unique
ApplicationComponents.code unique
DefectCategories.code unique
ComponentCategories(component, defectCategory) unique
CatalogAdministrationAuditEvents append-only fields
```

Audit fields:

```cds
entity CatalogAdministrationAuditEvents : cuid, managed {
  actor         : Association to Users not null;
  catalogType   : String(30) not null;
  targetID      : UUID not null;
  action        : String(30) not null;
  result        : String(30) not null;
  beforeSummary : String(500);
  afterSummary  : String(500);
  reason        : String(500);
  correlationId : UUID not null;
}
```

No composition from catalogs; audit survives catalog deactivation.

- [ ] **Step 2: Add npm command and prove RED**

```json
"qa:user-admin-catalogs:programmatic": "node scripts/qa/test-user-admin-catalog-model.js && node scripts/qa/test-user-admin-catalogs.js"
```

Create the second test file with an initial expected failure marker for missing service behavior, then run the command and require FAIL.

- [ ] **Step 3: Add the minimal additive model**

Add `@assert.unique` annotations and the audit entity. Do not change existing catalog IDs/columns or CSV data.

- [ ] **Step 4: Compile and inspect generated delta**

```powershell
npx cds compile db/schema.cds --to hana
npm run qa:user-admin-catalogs:programmatic
```

The model portion passes; behavior portion remains red. Generated delta must contain only unique constraints/indexes and the new audit table.

- [ ] **Step 5: Commit model**

```powershell
git add db/schema.cds package.json scripts/qa/test-user-admin-catalog-model.js scripts/qa/test-user-admin-catalogs.js
git diff --cached --check
git commit -m "feat: define safe catalog administration model"
```

### Task 3: Expose authorized catalog projections and impact analysis

**Files:**
- Modify: `srv/user-admin.cds`
- Create: `srv/user-admin/catalogs.js`
- Modify: `srv/user-admin.js`
- Extend: `scripts/qa/test-user-admin-catalogs.js`

**Interfaces:**
- Produces projections `CatalogSAPModules`, `CatalogApplicationComponents`, `CatalogDefectCategories`, `CatalogComponentCategories`.
- Produces `readCatalogImpact(catalogType, catalogID)` returning Bug, responsibility, and child-reference counts.

- [ ] **Step 1: Write red authorization/read tests**

Cover PM + UserAdmin positive, all negative roles, active/inactive filtering, explicit safe columns, impact counts for all four types, invalid type/ID, and bounded pagination. Require raw DELETE to return 405.

- [ ] **Step 2: Add service projections**

Expose IDs, codes/names/type fields, active, managed timestamps, and Component Category associations needed for UI. Do not expose unrestricted navigation into Bugs/Users.

Annotate each projection's `modifiedAt` as OData ETag after CAP MCP syntax confirmation.

- [ ] **Step 3: Implement focused handlers**

`registerCatalogHandlers(service, { authorize })` attaches:

- authorization before READ/CREATE/UPDATE/DELETE;
- explicit DELETE rejection;
- impact action with a fixed catalog-type allowlist;
- server-side explicit-count queries.

No mutation behavior is implemented yet beyond denial.

- [ ] **Step 4: Run read-only tests and commit**

```powershell
npm run qa:user-admin-catalogs:programmatic
npm run qa:user-onboarding:programmatic
npx cds compile srv/user-admin.cds --to edmx
git add srv scripts/qa/test-user-admin-catalogs.js
git diff --cached --check
git commit -m "feat: add catalog administration read models"
```

### Task 4: Implement CREATE/UPDATE, validation, and append-only audit

**Files:**
- Modify: `srv/user-admin/catalogs.js`
- Extend: `scripts/qa/test-user-admin-catalogs.js`

- [ ] **Step 1: Add red mutation tests**

Cover normalized code, case-insensitive duplicate, required/length validation, valid create/update, immutable ID/code policy chosen by spec, stale ETag, inactive-parent pair, duplicate pair, deactivate impact rejection, safe deactivate/reactivate, audit success/rejection, rollback on audit failure, and no DELETE.

- [ ] **Step 2: Implement server normalization and validation**

Normalize codes with:

```js
function normalizeCatalogCode (value, maxLength) {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return code && code.length <= maxLength && /^[A-Z0-9._-]+$/.test(code) ? code : null
}
```

Use entity-specific allowed fields; reject extra/immutable fields instead of spreading request payloads.

- [ ] **Step 3: Enforce impact/deactivation rules in one transaction**

Lock the target, check ETag/modifiedAt, count active dependents, update, append one audit row, and commit. Any failure rolls back both update and audit.

- [ ] **Step 4: Run focused and Bug/Developer regressions**

```powershell
npm run qa:user-admin-catalogs:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:developer-pilot:programmatic
npm run qa:idts6:programmatic
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
```

- [ ] **Step 5: Commit mutation behavior**

```powershell
git add srv/user-admin/catalogs.js scripts/qa/test-user-admin-catalogs.js
git diff --cached --check
git commit -m "feat: manage IDTS business catalogs safely"
```

### Task 5: Build Business Catalogs UI in read-first increments

**Files:**
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Create: `app/user-administration-ui/webapp/fragment/EditCatalogItem.fragment.xml`
- Create: `app/user-administration-ui/webapp/fragment/CatalogImpact.fragment.xml`
- Modify formatter and both i18n property files.
- Extend: `scripts/qa/test-user-admin-ui.js`

- [ ] **Step 1: Write red UI contract**

Require Business Catalogs tab, four subtabs, active filter, search, busy/empty/error states, impact preview before deactivate, ETag propagation, validation value states, confirmation/reason, no Delete button, one emphasized primary dialog action, and responsive tables.

- [ ] **Step 2: Implement read-only explorer first**

Load each projection only when selected. Provide counts and impact dialog. Run UI tests/build and commit the read-only increment.

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git add app/user-administration-ui scripts/qa/test-user-admin-ui.js
git commit -m "feat: add business catalog explorer"
```

- [ ] **Step 3: Add bounded edit actions**

Bind native OData create/update with ETag, explicit fields, and backend error mapping. Deactivation always opens impact then confirmation. Reload only the affected catalog after success.

- [ ] **Step 4: Verify and commit UI mutation increment**

```powershell
npm run qa:user-admin-ui:programmatic
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git add app/user-administration-ui scripts/qa/test-user-admin-ui.js
git diff --cached --check
git commit -m "feat: edit business catalogs with impact review"
```

### Task 6: Documentation and exact source/schema gate

**Files:**
- Update four canonical business documents because catalog ownership and deactivation rules change business meaning.
- Update schema/service/UI knowledge mirrors.
- Update WP8 PM files and decision/risk log.
- Create: `docs/pm/evidence/user-administration/gate-5-business-catalogs-source.md`
- Create: `docs/pm/evidence/user-administration/gate-5-business-catalogs-hdi-plan.md`

- [ ] **Step 1: OfficeCLI and documentation sync**

```powershell
officecli --version
```

- [ ] **Step 2: Generate and review exact HANA delta**

Build clean baseline/candidate generated trees. Require only the audit table and intended unique constraints/indexes. Reject table/column removal, data conversion, seed, unrelated artifacts, and all `.hdbtabledata`.

- [ ] **Step 3: Run final source gate**

```powershell
npm run qa:user-admin-catalogs:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:developer-pilot:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv --to edmx
npx cds compile db/schema.cds --to hana
npm --prefix app/user-administration-ui run lint
npm --prefix app/user-administration-ui run build
git diff --check origin/dev...HEAD
```

- [ ] **Step 4: Commit docs, push Draft PR, and stop**

Push `feature/wp8-admin-business-catalogs-donhv`, create Draft PR, and return exact report. No HDI simulation/make, catalog mutation, deployment, merge, or Gate 6 work.

### Task 7: Coordinator-only migration, rollout, acceptance, and cleanup

- [ ] **Step 1: Independent exact-head/security/schema review**

Require zero Critical/Major and exact source/generated artifact hashes.

- [ ] **Step 2: Separate HDI simulation and additive migration approvals**

Simulation first; warning/unrelated/destructive output is a hard stop. Real migration requires backup/recovery path and exact post-readback.

- [ ] **Step 3: Deploy selective CAP/shared UI and run controlled catalog acceptance**

Use one disposable new catalog item/pair owned by this gate, prove create/edit/deactivate/reactivate, negative roles, conflict, impact, reload, value help, audit, and no historical breakage. Do not alter baseline catalogs for convenience.

- [ ] **Step 4: Merge and remove worktree**

After DonHV approval and green CI/runtime evidence, merge, then run from the gate worktree:

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
