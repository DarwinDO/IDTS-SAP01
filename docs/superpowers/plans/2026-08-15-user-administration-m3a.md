# User Administration M3A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a zero-platform-mutation, exact-diff and checksummed predeployment package for IDTS User Administration.

**Architecture:** Verify the existing candidate as four bounded units: additive persistence, CAP orchestration, XSUAA overlay/technical authority, and SAPUI5. Apply only source-local validation fixes, then package evidence for separate M3B/M3C/M3D approvals.

**Tech Stack:** SAP CAP Node.js, CDS/OData V4, SAP HANA HDI build artifacts, XSUAA, SAPUI5 1.148, Node.js 22, MTA/MBT.

## Global Constraints

- External platform, HANA, identity, role, Jira and Drive mutation count is zero.
- Do not run `cf deploy`, `cf push`, `cf update-service`, `cf set-env`, `cf restart`, `cf restage`, `cds deploy`, HDI simulate/make, seed or SQL/DML.
- Keep the deployed broker disabled and no-route.
- Never print or persist credentials, tokens, raw JWTs, cookies, private endpoints, full personal data or raw provider bodies.
- `PM`, `TESTER`, `DEVELOPER` remain the only business roles; `UserAdmin` is a PM-only overlay.

---

### Task 1: Freeze and inventory the exact candidate

**Files:**
- Read: `db/schema.cds`
- Read: `srv/user-admin.cds`
- Read: `srv/user-admin.js`
- Read: `xs-security.json`
- Read: `mta.yaml`
- Read: `app/user-administration-ui/**`
- Read: `broker/**`

**Interfaces:**
- Consumes: feature HEAD and `origin/dev`.
- Produces: allowlisted path inventory and source hash manifest.

- [ ] Run `git status --short`, `git rev-parse HEAD`, `git rev-parse origin/dev`, and `git merge-base HEAD origin/dev`; require a clean tree before source remediation.
- [ ] Run bounded `git diff --name-status origin/dev...HEAD -- db/schema.cds srv/user-admin.cds srv/user-admin.js xs-security.json mta.yaml app/user-administration-ui broker`.
- [ ] Hash every allowlisted source file with SHA-256 and write only relative paths plus hashes to M3A evidence.
- [ ] Stop if the merge base differs from current `origin/dev` or an unrelated runtime file appears.

### Task 2: Close UI5 validation findings

**Files:**
- Modify: `app/user-administration-ui/webapp/fragment/ManageAccess.fragment.xml`
- Modify: `scripts/qa/test-user-admin-ui.js`
- Modify: `docs/knowledge/app/user-administration-ui.md`

**Interfaces:**
- Consumes: UI5 MCP finding that `sap.m.Dialog.stretchOnPhone` is deprecated.
- Produces: responsive dialog without deprecated API and a regression assertion.

- [ ] Add a focused assertion that `ManageAccess.fragment.xml` contains no `stretchOnPhone` property.
- [ ] Run `node scripts/qa/test-user-admin-ui.js`; require the new assertion to fail before the fix.
- [ ] Remove only `stretchOnPhone="true"`; retain the existing responsive dialog sizing and business controls.
- [ ] Run UI5 MCP linter and manifest validation; require zero errors and a valid manifest.
- [ ] Run `npm test` in `app/user-administration-ui`; require exit 0.
- [ ] Update the UI knowledge mirror with the responsive-dialog decision.

### Task 3: Verify CAP identity, authorization and state machine

**Files:**
- Read/modify only if a focused test proves a defect: `srv/user-admin.cds`, `srv/user-admin.js`, `srv/auth/identity-map.js`, `srv/auth/platform-role.js`
- Test: `scripts/qa/test-user-onboarding-contract.js`
- Test: `scripts/qa/test-user-onboarding-programmatic.js`
- Test: `scripts/qa/test-user-access-provisioning-contract.js`
- Test: `scripts/qa/test-provisioning-broker-programmatic.js`
- Test: `scripts/qa/test-immutable-identity-mapping.js`

**Interfaces:**
- Consumes: validated XSUAA `origin`, `issuer`, `payload.user_uuid`, `payload.user_id`.
- Produces: PM+UserAdmin protected versioned operations and sanitized broker contract.

- [ ] Run all five focused test files and capture exact pass counts/exit codes.
- [ ] Verify static allowlists for business roles, PM-only UserAdmin, safe retry/reconciliation states and no client-selected Role Collection/subaccount/IdP/endpoint.
- [ ] Run `npx cds compile srv --to edmx -s all`; require exit 0 for all four services.
- [ ] Run `npx cds compile db/schema.cds --to hana`; require exit 0.
- [ ] If a test fails, record the issue immediately, add the smallest regression assertion, apply the smallest shared-root fix, and rerun the focused set.

### Task 4: Prove the additive HANA candidate offline

**Files:**
- Generate only under ignored temporary roots: `.tmp/user-admin-m3a/baseline`, `.tmp/user-admin-m3a/candidate`
- Create: `docs/pm/evidence/user-administration/ua-r3c-m3a-exact-diff.md`

**Interfaces:**
- Consumes: exact `origin/dev` clean tree and exact candidate clean tree.
- Produces: generated-artifact allowlist and checksums; no HDI execution.

- [ ] Build the exact baseline and candidate with `npx cds build --production` into separate empty temporary roots.
- [ ] Compare `gen/db/src/gen` file names and normalized generated definitions.
- [ ] Require the candidate delta to correspond only to `Users` external identity columns, `UserOnboardingStatuses`, `UserOnboardingRequests`, `UserOnboardingDeliveries`, `UserAccessOperations`, `UserIdentityAuditEvents` and their approved constraints.
- [ ] Reject any `.hdbtabledata`, seed, drop/delete/truncate, unrelated entity or destructive-conversion evidence.
- [ ] Record SHA-256 for normalized delta evidence and label it `OFFLINE GENERATED DIFF / NOT HDI SIMULATION`.

### Task 5: Verify XSUAA and deployment topology candidates

**Files:**
- Read: `xs-security.json`
- Read: `mta.yaml`
- Read: `mta.user-access-broker-r3b.yaml`
- Update evidence only: `docs/pm/evidence/user-administration/ua-r3c-m3a-exact-diff.md`

**Interfaces:**
- Consumes: current production descriptor and feature candidate.
- Produces: semantic XSUAA diff, future forward/rollback checksums and module/resource boundary.

- [ ] Parse both XSUAA descriptors and prove the semantic additions are exactly scopes `UserAdmin` and `ProvisioningBroker`, role template `UserAdmin`, and Role Collection `IDTS_USER_ADMIN`.
- [ ] Prove `UserAdmin` is absent from the three-business-role invariant and the broker authority grant targets only the dedicated broker application.
- [ ] Prove the main MTA adds only the User Administration HTML5 content/module and the reviewed XSUAA descriptor delta; record that DB deployer and main app deployment remain forbidden in M3A.
- [ ] Record source descriptor SHA-256 and full candidate SHA-256 for later M3B rollback review.

### Task 6: Run the complete M3A local gate

**Files:**
- Update: `docs/pm/evidence/user-administration/ua-r3c-m3a-exact-diff.md`
- Update: `docs/pm/status/donhv.md`

**Interfaces:**
- Consumes: Tasks 1-5 evidence.
- Produces: M3A PASS/FAIL matrix and exact M3B proposal.

- [ ] Run `npm run qa:user-onboarding:programmatic`.
- [ ] Run `npm run qa:user-onboarding-page:programmatic`.
- [ ] Run `npm run qa:user-admin-ui:programmatic`.
- [ ] Run `npm run qa:user-access:programmatic`.
- [ ] Run `npm run qa:user-access-broker:programmatic`.
- [ ] Run `npm run qa:immutable-identity:programmatic`.
- [ ] Run `npm run qa:secret-scan`, `npm run qa:agent-rules`, `npm run qa:depth:self-test`, and `git diff --check`.
- [ ] Run `npm run btp:demo:check` read-only and require `DEMO READY`; do not recover under M3A.
- [ ] Record every command, exit code, pass/fail, warning, artifact hash and limitation; set every prohibited mutation counter to zero.
- [ ] Commit and push only after exact diff review confirms no generated/temp artifact, secret or unrelated file is staged.
