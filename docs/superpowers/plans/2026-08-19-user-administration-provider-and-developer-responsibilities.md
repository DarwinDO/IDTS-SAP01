# User Administration Provider Recovery and Developer Responsibilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover safe SAP Role Collection provisioning and extend User Administration so PM + UserAdmin can configure and maintain assignment-ready Developer profiles and responsibilities.

**Architecture:** Execute two separately reviewable tracks. Track A adds safe provider PATCH classification, deploys only the broker, then completes one controlled TESTER operation through the journal. Track B adds normalized desired Developer profile data, CAP administration actions and a conditional UI5 profile editor; schema and live rollout remain separately gated.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, SAPUI5 1.148.x, SAP HANA/HDI, XSUAA, SAP Authorization and Trust Management REST API, Node.js 22.

**Spec:** `docs/superpowers/specs/2026-08-19-user-administration-provider-and-developer-responsibilities-design.md`

## Global Constraints

- Preserve `Makefile_20260818121902.mta` and unrelated user changes.
- Do not retry the current provider PATCH before Track A source/deployment acceptance.
- Do not run DB deploy, seed, `.hdbtabledata`, XSUAA update or main-app deployment during source-only tasks.
- PM + UserAdmin and exact-one business-role alignment are mandatory for administration actions.
- Never log or persist provider tokens, URLs, response bodies, user/group IDs or immutable identity fields.
- `ACTIVE` requires provider readback and complete local business state.
- No automatic Bug reassignment and no hard deletion of profile/responsibility history.

---

### Task 1: Safe provider PATCH error classification

**Files:**
- Modify: `broker/lib/sap-authorization-api-client.js`
- Modify: `broker/lib/access-provisioning.js`
- Modify: `scripts/qa/test-user-access-broker-runtime.js`
- Modify: `scripts/qa/test-provisioning-broker-programmatic.js`
- Modify: `docs/knowledge/broker/lib/sap-authorization-api-client.js.md` or create it if absent
- Modify: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: `createSapAuthorizationApiClient({ apiUrl, tokenProvider, fetchImpl, timeoutMs, minIntervalMs })`.
- Produces: the safe codes and retryability matrix frozen in the design spec.

- [ ] Write RED tests that mock HTTP 400, 401, 403, 404, 409, 412, 429, 500, timeout, network failure and invalid JSON.
- [ ] Assert each test exposes only `error.code`; scan serialized errors/logs for body, URL, token, ID and headers.
- [ ] Run `npm run qa:user-access-broker:programmatic`; expected RED because 400/5xx/timeout currently collapse to `PROVIDER_UNAVAILABLE`.
- [ ] Implement `statusError`, timeout/network and JSON-parse classification without adding an HTTP retry loop.
- [ ] Update `safeProvisioningFailure` so only 429, timeout, network and 5xx are retryable; 400/identity/group/contract failures are permanent/manual-review outcomes.
- [ ] Run `npm run qa:user-access-broker:programmatic && npm run qa:user-access:programmatic`; expected PASS.
- [ ] Run `npm run qa:secret-scan && git diff --check`; expected exit 0.
- [ ] Commit only Track A source/tests/knowledge/status as `fix: classify user access provider patch failures`.

### Task 2: Broker-only build and deployment gate

**Files:**
- Modify: `docs/pm/evidence/user-administration/ua-provider-patch-recovery.md`
- Reuse: broker-only deployment descriptor and prior broker rollback artifact.

**Interfaces:**
- Consumes: exact Task 1 commit and broker tests.
- Produces: one checksum-reviewed broker MTAR and prior-artifact rollback checksum.

- [ ] Build from a clean export of the exact Task 1 commit; pin only broker runtime Node engine to `22.x`.
- [ ] Deep-inspect: one no-route broker module, dedicated broker XSUAA and existing API-access UPS only; no CAP/UI/AppRouter/HDI resources.
- [ ] Run isolated `npm ci --omit=dev --ignore-scripts`, `npm audit --omit=dev`, focused tests and secret scan.
- [ ] Record MTAR SHA-256, inner payload manifest, source parity and rollback MTAR SHA-256.
- [ ] Obtain exact deployment approval; without it, stop at local artifact acceptance.
- [ ] Re-freeze CF target, broker app/routes/bindings, main app revisions/bindings and `npm run btp:demo:check`.
- [ ] Deploy exactly the broker MTAR; do not change env, routes, services or main applications.
- [ ] Verify broker `1/1`, zero routes, two expected bindings and main binding counts unchanged.
- [ ] On ambiguous deployment, perform readback before any retry. Roll back using the exact prior broker artifact only.

### Task 3: One controlled TESTER journal reconciliation

**Files:**
- Modify: `docs/pm/evidence/user-administration/ua-provider-patch-recovery.md`
- Modify: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: deployed Task 2 broker and the existing controlled TESTER operation.
- Produces: either verified `ACTIVE` or one precise safe blocker code.

- [ ] Read back exact target user, zero current Role Collections, exact `IDTS_TESTER` group and operation state/version without printing identity values.
- [ ] Queue exactly one journal reconciliation using the existing PM UI action; no direct diagnostic PATCH.
- [ ] Observe broker claim/completion once and read BTP state once.
- [ ] If readback proves exactly `IDTS_TESTER`, require CAP request `ACTIVE`, linked active User and immutable identity match.
- [ ] If a safe failure code returns, apply the design matrix and stop; no second retry.
- [ ] Run `npm run btp:demo:check`; require HANA/CAP/AppRouter/health/ready/Auth/Web all healthy.
- [ ] Record mutation ledger and sanitize evidence.

### Task 4: Developer desired-profile CDS model

**Files:**
- Modify: `db/schema.cds`
- Modify: `srv/user-admin.cds`
- Modify: `scripts/qa/test-user-access-provisioning-contract.js`
- Modify: `scripts/qa/test-user-onboarding-programmatic.js`
- Modify: `docs/knowledge/db/schema.cds.md`
- Modify: `docs/knowledge/srv/user-admin.cds.md`

**Interfaces:**
- Produces: `DeveloperResponsibilityInput`, `DeveloperProfileInput`, `DeveloperProfileResult`, request-owned desired responsibilities and `DeveloperProfiles.administrationVersion`.

- [ ] Write RED CDS/static tests for the exact entities, associations, composition, version field and action parameters in the spec.
- [ ] Run `npm run qa:user-access:programmatic`; expected RED on missing model/service contract.
- [ ] Add `UserOnboardingDeveloperResponsibilities`, request profile fields/composition and `administrationVersion` exactly as specified.
- [ ] Add the four OData action contracts. `developerProfile` is required by handler validation only when desired role is `DEVELOPER`.
- [ ] Compile `npx cds compile '*' --to json` and `npx cds compile srv --to edmx -s all`.
- [ ] Compile HANA artifacts and inspect generated delta: additive table/columns/indexes only; no drops and no `.hdbtabledata`.
- [ ] Run focused tests and `git diff --check`; expected PASS.
- [ ] Commit as `feat: model developer onboarding responsibilities`.

### Task 5: CAP validation and desired-set transaction

**Files:**
- Create: `srv/user-admin/developer-profile.js`
- Modify: `srv/user-admin.js`
- Modify: `scripts/qa/test-user-onboarding-programmatic.js`
- Create: `scripts/qa/test-user-admin-developer-profile.js`
- Create: `docs/knowledge/srv/user-admin/developer-profile.js.md`

**Interfaces:**
- Produces:
  - `validateDeveloperProfileInput(tx, role, input)`
  - `materializeDeveloperProfile(tx, options)`
  - `replaceDeveloperResponsibilities(tx, options)`
  - `readDeveloperProfileResult(tx, userID)`

- [ ] Write RED tests: Developer requires at least one row; Tester/PM reject profile input; inactive/missing catalogs fail; invalid workload fails; duplicate tuples fail.
- [ ] Add positive tests for optional SAP Module and `PRIMARY/BACKUP/EXPERT` active levels.
- [ ] Implement catalog validation using active `ComponentCategories`, active parent component/category, optional active SAP Module and active Responsibility Level.
- [ ] Lock the exact DeveloperProfile row with `forUpdate()` before duplicate/diff/version checks.
- [ ] Implement desired-set diff: reuse matching rows, reactivate previously inactive rows, update level, deactivate removed rows; never hard-delete.
- [ ] Increment `administrationVersion` once per successful transaction and append allowlisted audit events.
- [ ] Run `node scripts/qa/test-user-admin-developer-profile.js` and onboarding/access suites; expected PASS.
- [ ] Commit as `feat: validate and persist developer responsibility sets`.

### Task 6: Integrate profile materialization with provisioning completion

**Files:**
- Modify: `srv/provisioning-broker.js`
- Modify: `srv/user-admin.js`
- Modify: `scripts/qa/test-provisioning-broker-programmatic.js`
- Modify: `scripts/qa/test-user-onboarding-programmatic.js`
- Modify: `scripts/qa/test-immutable-identity-mapping.js`

**Interfaces:**
- Consumes: Task 5 profile helpers.
- Produces: idempotent completion where provider access and local Developer readiness jointly control `ACTIVE`.

- [ ] Write RED tests for provider success followed by atomic User link + profile + responsibility + audit + `ACTIVE`.
- [ ] Add regression: local completion throws after provider success; request does not become `ACTIVE`, linked access fails closed, and reconciliation can repeat completion without duplicate profile/responsibility rows.
- [ ] Add role-change-to-Developer test requiring desired profile input.
- [ ] Add role-change-away/revoke tests that deactivate profile/responsibilities, revoke sessions, preserve Bugs and return open-Bug impact count.
- [ ] Implement minimal calls to Task 5 helpers inside the existing CAP completion transaction.
- [ ] Run onboarding, access, broker, immutable identity, developer workload and Smart Assign suites.
- [ ] Commit as `feat: complete developer provisioning with assignment profile`.

### Task 7: Developer profile administration API

**Files:**
- Modify: `srv/user-admin.cds`
- Modify: `srv/user-admin.js`
- Modify: `srv/user-admin/developer-profile.js`
- Modify: `scripts/qa/test-user-admin-developer-profile.js`

**Interfaces:**
- Produces: `readDeveloperProfile` and `updateDeveloperProfile` actions from the spec.

- [ ] Write RED authorization tests for anonymous, Tester, Developer, PM without UserAdmin, PM+extra business role and exact PM+UserAdmin.
- [ ] Write RED version-conflict, concurrent-update, last-responsibility removal, open-Bug impact and reload tests.
- [ ] Implement active PM + UserAdmin guard, expected-version check, profile lock and desired-set transaction.
- [ ] Require a non-empty reason when rows are removed/deactivated or profile availability becomes `UNAVAILABLE`.
- [ ] Return only safe profile/catalog fields and counts; do not expose external identity/provider values.
- [ ] Run `node scripts/qa/test-user-admin-developer-profile.js`, CAP compile and secret scan.
- [ ] Commit as `feat: add developer responsibility administration actions`.

### Task 8: UI5 invite and Manage Responsibilities dialogs

**Files:**
- Modify: `app/user-administration-ui/webapp/controller/Main.controller.js`
- Modify: `app/user-administration-ui/webapp/view/Main.view.xml`
- Modify: `app/user-administration-ui/webapp/fragment/InviteUser.fragment.xml`
- Modify: `app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml`
- Create: `app/user-administration-ui/webapp/fragment/ManageDeveloperProfile.fragment.xml`
- Modify: `app/user-administration-ui/webapp/i18n/i18n.properties`
- Modify: `app/user-administration-ui/webapp/i18n/i18n_en.properties`
- Modify: `scripts/qa/test-user-admin-ui.js`
- Modify: `docs/knowledge/app/user-administration-ui.md`

**Interfaces:**
- Consumes: Tasks 4 and 7 OData actions/types.
- Produces: conditional invite/profile editor and active-row Manage Responsibilities action.

- [ ] Write RED controller/view tests for role-conditional visibility, mandatory rows, catalog bindings, add/edit/deactivate, expected version and safe error messages.
- [ ] Extend invite/access JSON models with `developerProfile` containing availability, workload and responsibility rows.
- [ ] Add a bound responsive table editor; use existing active ComponentCategory choices so Application Component and Defect Category remain a valid pair.
- [ ] Disable confirmation for Developer until the profile is valid; clear profile input when switching away from Developer.
- [ ] Add `Manage Responsibilities` only for active Developer rows and confirmation showing open-Bug impact before deactivation.
- [ ] Update both i18n bundles; no provider/internal terminology in user-facing messages.
- [ ] Run `npm run qa:user-admin-ui:programmatic`, UI package lint/build, UI5 MCP manifest validation and UI5 linter.
- [ ] Commit as `feat: manage developer responsibilities in user administration`.

### Task 9: Full source acceptance and independent review

**Files:**
- Modify: canonical business docs because the role/profile business meaning changes:
  - `IDTS-SUMMARY.md`
  - `IDTS-Business-Rule.md`
  - `IDTS-PROJECT-SCOPE-SAP01.md`
  - `docs/project-context.md`
- Modify: relevant PM task/status/risk records.

- [ ] Run all focused suites from Tasks 1-8.
- [ ] Run CAP JSON/EDMX/HANA compile, UI lint/build, `npm run qa:secret-scan`, `npm run qa:agent-rules`, `npm run qa:depth:self-test`, and `git diff --check`.
- [ ] Verify generated HDI delta contains only approved additive artifacts and excludes all seed/table-data files.
- [ ] Run independent security/exact-head review; require zero Critical and zero Major.
- [ ] Commit synchronized business/knowledge/evidence docs as `docs: define developer responsibility administration`.

### Task 10: Separate live rollout gates

**Files:**
- Create: `docs/pm/evidence/user-administration/ua-developer-responsibility-rollout.md`

- [ ] Gate HDI simulation separately; warning, destructive/unrelated artifact or table data is an immediate stop.
- [ ] Gate additive schema migration separately; record pre/post row counts and preserve all existing profiles/responsibilities.
- [ ] Build selective CAP and UI artifacts from the exact reviewed commit with checksums and prior rollback artifacts.
- [ ] Deploy CAP/UI without changing XSUAA, broker credential, HANA business rows or main AppRouter unless separately approved.
- [ ] Use one controlled non-member Developer test identity supplied and approved for this pilot.
- [ ] Execute: invite with two responsibilities, email/login, broker role readback, local profile materialization, `ACTIVE`, Smart Assign eligibility, edit responsibility, deactivate one row, reload persistence, role-change/revoke and session rejection.
- [ ] Prove existing Bug assignees remain unchanged when a responsibility is deactivated and the Developer is excluded from new unsuitable assignment.
- [ ] Run final `npm run btp:demo:check` and record mutation/rollback ledger.

## Mandatory stop conditions

- Provider PATCH safe classification remains ambiguous.
- Any command would print or persist credential, token, URL, user/group ID or provider body.
- Schema diff includes drop, destructive conversion, seed or `.hdbtabledata`.
- Duplicate/invalid responsibility can reach persistence.
- A Developer reaches `ACTIVE` without an active profile and responsibility.
- Main app/XSUAA/HANA baseline drifts before a mutation gate.
- Controlled Developer identity is unavailable for live acceptance.
