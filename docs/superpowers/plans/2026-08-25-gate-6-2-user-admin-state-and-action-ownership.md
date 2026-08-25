# Gate 6.2 User Administration State and Action Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Isolate Developer and Business Catalog state, group navigation by business ownership, place actions on their owning screens, and show Developer Profile input only for a real transition into Developer.

**Architecture:** Keep the existing SAPUI5 app and CAP contracts. Replace the shared catalogs JSON state with developerCatalogs and businessCatalogs, use five native top-level areas, and reuse Active User details for lifecycle actions. This gate changes no backend, schema, dependency, provider, data, or deployment artifact.

**Tech Stack:** SAPUI5 1.148, XML views/fragments, JSONModel, OData V4 client, Node.js programmatic tests.

**Spec:** docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md

## Global Constraints

- Freeze fresh origin/dev; use branch fix/wp8-user-admin-state-action-ownership-donhv in an isolated worktree.
- No dependency/lockfile, db, srv, HANA/HDI, platform, provider, user/role, data, email, deployment, Ready or merge mutation.
- Preserve CAP PM + UserAdmin, optimistic-version, state, final-admin and duplicate-submit guards.
- Update matching bilingual docs/knowledge/app mirrors.
- Stop at one Draft PR.

---

### Task 1: Define the RED UI contract

**Files:**
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Consumes: Main.controller.js, Main.view.xml and current fragment text.
- Produces: failing assertions for two catalog models, five top-level areas, action ownership and role-transition behavior.

- [ ] Add assertions requiring getModel("developerCatalogs") in _ensureDeveloperCatalogs and getModel("businessCatalogs") in _loadCatalogs; reject getModel("catalogs").
- [ ] Require top-level keys access, developers, operations, businessCatalogs and audit; require nested keys requests, activeUsers and developerResponsibilities.
- [ ] Assert the request-row action cell has no onOpenRoleChange, onOpenDeveloperProfile or onOpenRevoke; ActiveUserDetails retains lifecycle actions and the Developers area owns onOpenDeveloperProfile.
- [ ] Add controller fixtures proving opening Change Role for an existing Developer does not read a Developer Profile, non-Developer to Developer creates one profile, and same-role confirm never invokes requestRoleChange.
- [ ] Run npm run qa:user-admin-ui:programmatic. Expected: FAIL on the first new shared-model assertion.
- [ ] Commit:

~~~powershell
git add scripts/qa/test-user-admin-ui.js
git commit -m "test: define user admin state ownership UX"
~~~

### Task 2: Split catalog state and loading

**Files:**
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/view/Main.view.xml
- Modify: app/user-administration-ui/webapp/fragment/InviteUser.fragment.xml
- Modify: app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml
- Modify: app/user-administration-ui/webapp/fragment/ManageDeveloperProfile.fragment.xml
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces developerCatalogs = availabilityStatuses, responsibilityLevels, sapModules, componentCategories, loaded, busy, error.
- Produces businessCatalogs = selectedType, allItems, items, query, includeInactive, loaded, busy, error, componentOptions, defectOptions, edit, impact.

- [ ] Replace the one catalogs JSONModel in onInit with exactly the two shapes above.
- [ ] Make _ensureDeveloperCatalogs read/write only developerCatalogs.
- [ ] Make _loadCatalogs, _applyCatalogFilters and catalog create/edit/impact/retry handlers read/write only businessCatalogs.
- [ ] Change Developer form bindings to developerCatalogs>; change Business Catalog view/fragment bindings to businessCatalogs>.
- [ ] Add both opening-order tests:

~~~js
await instance._ensureDeveloperCatalogs();
assert.equal(developerCatalogs.loaded, true);
assert.equal(businessCatalogs.loaded, false);
await instance._loadCatalogs();
assert.equal(businessCatalogs.loaded, true);
assert.equal(developerCatalogs.componentCategories.length > 0, true);
~~~

- [ ] Repeat in reverse order. Prove a Developer load error does not alter Business Catalog rows and a Business Catalog error does not alter Developer value helps.
- [ ] Run:

~~~powershell
npm run qa:user-admin-ui:programmatic
npm run lint --prefix app/user-administration-ui
~~~

Expected: both exit 0.

- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-ui.js
git commit -m "fix: isolate user admin catalog state"
~~~

### Task 3: Group navigation and move actions

**Files:**
- Modify: app/user-administration-ui/webapp/view/Main.view.xml
- Modify: app/user-administration-ui/webapp/fragment/ActiveUserDetails.fragment.xml
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/i18n/i18n.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_en.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_vi.properties
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces top-level view keys access, developers, operations, businessCatalogs, audit.
- Produces view state selectedAccessTab and selectedDeveloperTab.

- [ ] Build a top IconTabBar with the five keys. Inside Access use an inline compact IconTabBar for Requests and Active Users. Inside Developers use an inline compact child for Responsibilities; Gate 6.3 adds Workload there.
- [ ] Keep request-row buttons only for approve, cancel, retry and reconcile according to request state.
- [ ] Keep Change Role, Suspend, Reactivate and Revoke in ActiveUserDetails with existing visibility expressions.
- [ ] Add Manage Responsibilities to ActiveUserDetails only for active Developers and to the Developer table as an explicit action beside View access details.
- [ ] Persist selectedAccessTab and selectedDeveloperTab; nested selection loads only its area and reuses the existing guarded Active Users promise.
- [ ] Add key-identical English/default/Vietnamese labels and tooltips.
- [ ] Run:

~~~powershell
npm run qa:user-admin-ui:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-active-users:programmatic
~~~

Expected: all exit 0.

- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-ui.js
git commit -m "refactor: align user admin actions with business ownership"
~~~

### Task 4: Restrict Change Role to real transitions

**Files:**
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces access.currentRole, access.role and nullable access.developerProfile.

- [ ] Initialize Change Role from Active User details with currentRole and role equal to businessRole, developerProfile null, and no profile read.
- [ ] In onAccessRoleChange, create _emptyDeveloperProfile only when currentRole is not DEVELOPER and target role becomes DEVELOPER; otherwise set it to null.
- [ ] Before confirmation, reject equal currentRole/role with localized roleChangeRequiresDifferentRole and no OData action invocation.
- [ ] Show the Developer profile VBox only when transitioning from non-Developer to Developer.
- [ ] Bind confirm enabled to a different role, bounded reason and a ready profile only for transition into Developer.
- [ ] Cover PM→Developer, Tester→Developer, Developer→Tester, Developer→PM and same-role.
- [ ] Run:

~~~powershell
npm run qa:user-admin-ui:programmatic
npm run qa:user-access:programmatic
~~~

Expected: both exit 0; CAP same-role rejection remains authoritative.

- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-ui.js
git commit -m "fix: limit developer profile input to role transitions"
~~~

### Task 5: Mirrors, verification and Draft PR

**Files:**
- Modify: matching docs/knowledge/app/user-administration-ui/webapp mirrors.
- Create: docs/pm/evidence/user-administration/gate-6-2-state-action-ownership-source.md
- Modify: docs/pm/tasks/wp8-user-administration-roadmap.md
- Modify: docs/pm/status/donhv.md

**Interfaces:** Produces a source-only handoff; no runtime claim.

- [ ] Run officecli --version and record the Markdown limitation.
- [ ] Update bilingual mirrors with model ownership, nested tabs, action ownership and Change Role rules.
- [ ] Run:

~~~powershell
npm run qa:user-admin-ui:programmatic
npm run qa:user-onboarding:programmatic
npm run qa:user-admin-active-users:programmatic
npm run qa:user-access:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
git diff --check origin/dev...HEAD
git diff --exit-code origin/dev...HEAD -- db srv package.json package-lock.json mta.yaml xs-security.json
~~~

Expected: all exit 0; report only the pre-existing attachment warning if present.

- [ ] Commit docs/evidence, push exact branch, open exactly one Draft PR, read back base/head/body/checks, and stop before rollout or Gate 6.3.
