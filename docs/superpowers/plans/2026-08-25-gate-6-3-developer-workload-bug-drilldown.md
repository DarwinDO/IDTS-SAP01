# Gate 6.3 Developer Workload and Bug Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add a read-only Developers → Workload view that reuses BugService workload truth, explains technical ownership versus current action ownership, and opens assigned Bugs in Bug Management.

**Architecture:** Add a named OData V4 bugApi model in User Administration. Read DeveloperWorkloads for summaries and bounded Bugs queries for details. Keep assignment/status mutation exclusively in Bug Management and add no database/schema/backend workload implementation.

**Tech Stack:** SAPUI5 1.148, OData V4 named model, BugService virtual DeveloperWorkloads, XML view/fragment, Node.js programmatic tests.

**Spec:** docs/superpowers/specs/2026-08-25-user-administration-ux-workload-navigation-design.md

## Global Constraints

- Start from merged Gate 6.2 origin/dev on branch feature/wp8-user-admin-developer-workload-donhv.
- No db/srv/schema/HANA/HDI, dependency/lockfile, assignment/status, platform/provider/user/role/data/email/deployment mutation.
- Workload is read-only; Bug Management remains the only place for assignment and lifecycle actions.
- Page size maximum is 100; stable ordering and no duplicate rows.
- Stop at one Draft PR.

---

### Task 1: Define workload and deep-link contracts

**Files:**
- Modify: scripts/qa/test-user-admin-ui.js
- Create: scripts/qa/test-user-admin-workload.js
- Modify: package.json

**Interfaces:**
- Produces npm script qa:user-admin-workload:programmatic.
- Defines helper outputs buildBugObjectPageUrl(bugID) and normalized workload/detail row shapes.

- [ ] Add RED manifest assertions requiring dataSource bugService with URI /odata/v4/bug/ and named model bugApi.
- [ ] Add RED source assertions requiring Developers child keys developerWorkload and developerResponsibilities, a workload JSONModel, no create/update/delete calls through bugApi, and exact same-origin Bug deep links.
- [ ] Add pure behavior tests for:
  - open/limit formatting;
  - overloaded and overdue ordering;
  - Open assigned versus Needs Developer action labels;
  - invalid/empty UUID returning null instead of a broken link;
  - exact URL /idtsbugmanagementui/index.html#/Bugs(ID=<uuid>,IsActiveEntity=true).
- [ ] Add package script:

~~~json
"qa:user-admin-workload:programmatic": "node scripts/qa/test-user-admin-workload.js"
~~~

- [ ] Run npm run qa:user-admin-workload:programmatic. Expected: FAIL because bugApi/workload helpers do not exist.
- [ ] Commit the RED contract.

### Task 2: Add the named BugService model and workload state

**Files:**
- Modify: app/user-administration-ui/webapp/manifest.json
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: scripts/qa/test-user-admin-workload.js

**Interfaces:**
- Consumes BugService.DeveloperWorkloads.
- Produces workload JSONModel:

~~~js
{
  items: [], query: "", nextSkip: 0, pageSize: 100,
  hasMore: false, loaded: false, busy: false, error: false,
  selectedDeveloper: null, bugs: [], bugsBusy: false, bugsError: false
}
~~~

- [ ] Add manifest dataSource bugService and named model bugApi with OData V4 operationMode Server, autoExpandSelect true and earlyRequests false.
- [ ] Add the workload JSONModel above in onInit and selectedDeveloperTab session state.
- [ ] Implement _loadDeveloperWorkloads(query, append) using bugApi.bindList("/DeveloperWorkloads") with top <= 100 and stable order requested from the service. Normalize numeric counts and retain developerProfileID/userID only in model state, never render internal IDs.
- [ ] Sort presentation rows overloaded first, overdue descending, then developer name only after each bounded service page is read. De-duplicate by developerProfileID on append.
- [ ] Implement search, refresh and Load More guards; one failed workload read sets only workload.error.
- [ ] Run npm run qa:user-admin-workload:programmatic and npm run qa:user-admin-ui:programmatic. Expected: exit 0.
- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp/manifest.json app/user-administration-ui/webapp/controller/Main.controller.js scripts/qa/test-user-admin-workload.js package.json
git commit -m "feat: add read-only developer workload model"
~~~

### Task 3: Build the Workload overview

**Files:**
- Modify: app/user-administration-ui/webapp/view/Main.view.xml
- Modify: app/user-administration-ui/webapp/model/formatter.js
- Modify: app/user-administration-ui/webapp/i18n/i18n.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_en.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_vi.properties
- Modify: scripts/qa/test-user-admin-workload.js

**Interfaces:**
- Consumes workload.items.
- Produces Developers → Workload table and View workload action.

- [ ] Add developerWorkload before developerResponsibilities in the nested Developers IconTabBar.
- [ ] Add search, Refresh, independent MessageStrip/error, responsive Table and Load More.
- [ ] Show Developer, availability, Access/readiness, Open/Limit, Needs action, Overdue, Estimated effort and state.
- [ ] Format Open/Limit as openOwnedBugCount + " / " + workloadLimit; missing limit displays an em dash.
- [ ] Use semantic states: overloaded Error, overdue Warning, otherwise Success/None. Do not infer access authorization from color.
- [ ] Add localized explanatory copy:
  - Open assigned Bugs are non-Closed technical assignments.
  - Needs Developer action means the workflow currently waits for that Developer.
- [ ] Add View workload button passing the workload row context.
- [ ] Run UI contract, workload test, UI lint and build. Expected: all exit 0.
- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-workload.js
git commit -m "feat: show developer workload overview"
~~~

### Task 4: Add bounded assigned-Bug details and exact navigation

**Files:**
- Create: app/user-administration-ui/webapp/fragment/DeveloperWorkloadDetails.fragment.xml
- Modify: app/user-administration-ui/webapp/controller/Main.controller.js
- Modify: app/user-administration-ui/webapp/i18n/i18n.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_en.properties
- Modify: app/user-administration-ui/webapp/i18n/i18n_vi.properties
- Modify: scripts/qa/test-user-admin-workload.js

**Interfaces:**
- Consumes selected developerProfileID and BugService.Bugs.
- Produces workload.bugs safe rows and openBugInManagement(bugID).

- [ ] On View workload, bind BugService /Bugs with filters assignee_ID equals developerProfileID and status_code not equal CLOSED, stable order dueDate ascending then bugNumber ascending, top 100.
- [ ] Select only ID, bugNumber, title, status_code, priority_code, severity_code, dueDate, estimatedEffortHours, assigneeDisplayName and currentActionOwnerDisplayName.
- [ ] Map each row to overdue Boolean using UTC date-only semantics. Do not read description, comments, attachments, identity, provider or audit fields.
- [ ] Build a responsive dialog with consistent sapUiSmallMargin content, summary counts, independent busy/error state and table columns defined by the spec.
- [ ] Implement:

~~~js
_bugObjectPageUrl: function (bugID) {
  return /^[0-9a-f-]{36}$/i.test(String(bugID || ""))
    ? "/idtsbugmanagementui/index.html#/Bugs(ID=" + encodeURIComponent(bugID) + ",IsActiveEntity=true)"
    : null;
}
~~~

- [ ] Open with window.location.assign only when the helper returns a URL. Do not hardcode domain or open a new authentication flow.
- [ ] Test zero Bugs, 100 Bugs, closed exclusion, current owner different from assignee, overdue boundary, malformed ID, and exact URL.
- [ ] Run:

~~~powershell
npm run qa:user-admin-workload:programmatic
npm run qa:user-admin-ui:programmatic
npm run lint --prefix app/user-administration-ui
npm run build --prefix app/user-administration-ui
~~~

Expected: all exit 0.

- [ ] Commit:

~~~powershell
git add app/user-administration-ui/webapp scripts/qa/test-user-admin-workload.js
git commit -m "feat: add assigned bug workload drill-down"
~~~

### Task 5: Mirrors, security verification and Draft PR

**Files:**
- Create/Modify: matching docs/knowledge/app mirrors.
- Create: docs/pm/evidence/user-administration/gate-6-3-developer-workload-source.md
- Modify: docs/pm/tasks/wp8-user-administration-roadmap.md
- Modify: docs/pm/status/donhv.md

**Interfaces:** Produces source-only evidence with explicit no-mutation claim.

- [ ] Run officecli --version and document Markdown limitation.
- [ ] Explain named OData model, workload semantics, bounded Bug fields, privacy and deep-link behavior in bilingual mirrors.
- [ ] Run:

~~~powershell
npm run qa:user-admin-workload:programmatic
npm run qa:user-admin-ui:programmatic
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
git diff --exit-code origin/dev...HEAD -- db srv package-lock.json mta.yaml xs-security.json
~~~

Expected: all exit 0; schema/backend diff empty.

- [ ] Add a browser plan for PM+UserAdmin workload parity against known Bug assignments, deep-link navigation, Tester/Developer Forbidden, responsive dialog and no mutation.
- [ ] Commit docs/evidence, push exact branch, open one Draft PR, read CI and stop before rollout or Gate 6.4.
