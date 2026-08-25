# Gate 6.4 Safe Cross-App Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Let an authorized PM move between Bug Management and User Administration in the same AppRouter session while keeping unauthorized users hidden and fail-closed.

**Architecture:** Extend the safe AuthService profile with one server-derived canAdministerUsers Boolean. Bind a Bug Management header action to that Boolean and add a User Administration Back action. Use same-origin relative paths; AppRouter/XSUAA and CAP remain the authorization boundary.

**Tech Stack:** CAP Node.js AuthService, CDS OData V4 type, Fiori Elements manifest action, SAPUI5 controller action, AppRouter HTML5 paths.

**Spec:** docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md

## Global Constraints

- Start from merged Gate 6.3 origin/dev on branch feature/wp8-cross-app-user-admin-navigation-donhv.
- Expose no scope list, Role Collection, immutable identity, token, endpoint or provider detail.
- canAdministerUsers is UX-only; direct URL security remains AppRouter + CAP.
- No schema/HANA, XSUAA descriptor, role assignment, dependency/lockfile, platform, data, deployment or email mutation.
- Stop at one Draft PR.

---

### Task 1: Define the safe AuthService capability contract

**Files:**
- Modify: srv/auth.cds
- Modify: srv/auth.js
- Modify: scripts/qa/test-auth-foundation-programmatic.js
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces AuthUser.canAdministerUsers : Boolean.
- Rule: true only for XSUAA request + internal active PM + req.user.is("UserAdmin").

- [ ] Add RED assertions for these cases:
  - XSUAA internal PM and UserAdmin => true.
  - XSUAA PM without UserAdmin => false.
  - XSUAA Tester/Developer with accidental UserAdmin => false.
  - local/custom-auth PM => false.
  - response contains no roles/scopes/identity/provider fields.
- [ ] Run npm run qa:auth:programmatic. Expected: FAIL because AuthUser lacks the field.
- [ ] Add canAdministerUsers : Boolean to AuthUser in srv/auth.cds.
- [ ] Change publicUser signature to publicUser(tx, user, options = {}) and return Boolean(options.canAdministerUsers).
- [ ] In btpUserProfile call:

~~~js
return publicUser(tx, alignedUser, {
  canAdministerUsers: alignedUser.role_code === "PM" && req.user.is("UserAdmin")
});
~~~

- [ ] Keep custom me/login calls on the default false value.
- [ ] Run npm run qa:auth:programmatic and CAP EDMX compile. Expected: exit 0.
- [ ] Commit:

~~~powershell
git add srv/auth.cds srv/auth.js scripts/qa/test-auth-foundation-programmatic.js scripts/qa/test-user-admin-ui.js
git commit -m "feat: expose safe user admin navigation capability"
~~~

### Task 2: Add Bug Management → User Administration

**Files:**
- Modify: app/bug-management-ui/webapp/Component.js
- Modify: app/bug-management-ui/webapp/manifest.json
- Modify: app/bug-management-ui/webapp/ext/actions/BugListActions.js
- Modify: app/bug-management-ui/webapp/i18n/i18n.properties
- Modify: app/bug-management-ui/webapp/i18n/i18n_en.properties
- Create/Modify: focused Bug Management UI contract test selected by existing package scripts.

**Interfaces:**
- Consumes AuthUser.canAdministerUsers.
- Produces session>/canAdministerUsers and BugListActions.openUserAdministration().

- [ ] Add RED UI assertions for a header action UserAdministration with visible/enabled bound to session>/canAdministerUsers and press openUserAdministration.
- [ ] In Component.js add canAdministerUsers: Boolean(user && user.canAdministerUsers === true) to the existing session JSONModel.
- [ ] Add manifest header action beside OpenDashboard:

~~~json
"UserAdministration": {
  "press": "idts.bugmanagementui.ext.actions.BugListActions.openUserAdministration",
  "visible": "{session>/canAdministerUsers}",
  "enabled": "{session>/canAdministerUsers}",
  "text": "{i18n>openUserAdministration}"
}
~~~

- [ ] Implement:

~~~js
openUserAdministration: function () {
  var user = LoginSession.getUser();
  if (!user || user.canAdministerUsers !== true) {
    return Promise.reject(new Error("Current user cannot administer IDTS users."));
  }
  window.location.assign("/idtsuseradministrationui/index.html");
}
~~~

- [ ] Add localized EN/default label and tooltip. Do not include tenant/domain.
- [ ] Test PM+UserAdmin visible/navigation and all false cases hidden/no navigation.
- [ ] Run the focused Bug UI test, app lint and build. Expected: exit 0.
- [ ] Commit:

~~~powershell
git add app/bug-management-ui scripts/qa
git commit -m "feat: link bug management to user administration"
~~~

### Task 3: Add User Administration → Bug Management

**Files:**
- Modify: app/user-administration-ui/webapp/view/Main.view.xml
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/i18n/i18n.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_en.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_vi.properties
- Modify: scripts/qa/test-user-admin-ui.js

**Interfaces:**
- Produces onOpenBugManagement() with fixed relative path.

- [ ] Add RED assertion requiring a header Back to Bug Management action and no http/cfapps string.
- [ ] Add a transparent header button before Invite User, using localized text and navigation icon.
- [ ] Implement:

~~~js
onOpenBugManagement: function () {
  window.location.assign("/idtsbugmanagementui/index.html");
}
~~~

- [ ] Test exact path, same tab, no query token/returnTo, no new window and no domain.
- [ ] Run user-admin UI test, lint and build. Expected: exit 0.
- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-ui.js
git commit -m "feat: link user administration back to bug management"
~~~

### Task 4: Authorization, mirrors and Draft PR

**Files:**
- Modify: matching docs/knowledge/srv/auth.cds.md and auth.js.md.
- Modify: matching docs/knowledge/app mirrors for changed UI source.
- Create: docs/pm/evidence/user-administration/gate-6-4-cross-app-navigation-source.md
- Modify: docs/pm/tasks/wp8-user-administration-roadmap.md
- Modify: docs/pm/status/donhv.md

**Interfaces:** Produces exact source and manual role-matrix handoff.

- [ ] Run officecli --version; record Markdown limitation.
- [ ] Document that canAdministerUsers is a safe UI hint and not authorization.
- [ ] Run:

~~~powershell
npm run qa:auth:programmatic
npm run qa:user-admin-ui:programmatic
npm run qa:secret-scan
npm run qa:agent-rules
npm run qa:depth:self-test
npx cds compile srv -s all --to edmx
npx cds compile db/schema.cds --to hana
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
npm run lint --prefix app/bug-management-ui
npm run build --prefix app/bug-management-ui
git diff --check origin/dev...HEAD
git diff --exit-code origin/dev...HEAD -- db package-lock.json xs-security.json mta.yaml app/router/xs-app.json
~~~

Expected: all exit 0; no schema/XSUAA/AppRouter route diff.

- [ ] Manual plan after separately approved selective UI/CAP rollout:
  - PM + UserAdmin sees button and crosses both directions without a second login.
  - PM without UserAdmin, Tester and Developer do not see the button.
  - direct User Administration URL remains Forbidden for all unauthorized cases.
  - sign-out/session behavior remains unchanged.
- [ ] Commit docs/evidence, push exact branch, open one Draft PR, read checks and stop before rollout or Gate 6.5.
