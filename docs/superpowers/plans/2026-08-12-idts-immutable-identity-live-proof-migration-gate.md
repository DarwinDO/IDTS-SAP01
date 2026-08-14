# IDTS Immutable Identity Live-Proof and Migration Gate Implementation Plan

> For agentic workers: execute this plan one checkpoint at a time. Never combine approval checkpoints, and never infer approval for a later checkpoint from approval of an earlier one.

**Goal:** Prove the immutable SAP identity tuple in the live `sap.default` path, prepare an additive HANA migration, and link one explicitly approved bootstrap PM without locking out the existing IDTS users or exposing identity/credential material.

**Architecture:** Use a temporary, read-only CAP compatibility probe on top of the currently deployed runtime before enabling immutable identity enforcement. The probe returns only booleans and a short SHA-256 fingerprint prefix derived from `origin + issuer + user_uuid`. After two fresh-session proofs pass, deploy additive HDI schema artifacts while the legacy runtime remains active, link one approved PM through a one-time self-link action, and only then consider deploying the immutable runtime. IAS administration, IPS, Role Collection automation, and the full onboarding pilot remain separate gates.

**Tech Stack:** SAP CAP Node.js, XSUAA, AppRouter, SAP HANA Cloud HDI, SAP BTP Cloud Foundry, OData V4, Node.js QA scripts, MTA/MBT.

**Global Constraints:**

- Current source checkpoint: `417e26044ed47cd8f07aafd660afce6ec85908f9` on `feature/wp7-user-onboarding-donhv`.
- Current `origin/dev` observed during planning: `88ac00a44af000c34a83dfac0f2b057f0712f603`; refresh it at execution time.
- Never deploy the whole feature branch merely to inspect claims. It contains onboarding, UI, XSUAA, and schema changes beyond this gate.
- Never run broad `cds deploy`, DB seed loading, CSV/table-data import, HDI repair, schema recreation, destructive SQL, or business-data backfill.
- Never print or persist a raw JWT, bearer token, cookie, password, OTP, activation URL, service binding, private endpoint, full email, raw `origin`, raw issuer, raw `user_uuid`, or full external-identity hash in evidence.
- Every external mutation requires a new exact DonHV approval. Source-only preparation does not authorize deployment.
- `PM`, `TESTER`, and `DEVELOPER` remain the only business roles. `UserAdmin` remains an overlay and is not part of this gate.
- Keep `sap.default` active, available for user logon, and default. Do not update/delete trust, IAS objects, groups, users, Role Collections, mappings, or XSUAA in this gate.
- Do not use a real team member as the controlled onboarding test identity. The one-time bootstrap link for the existing PM is a different, separately approved administrative operation.
- Any ambiguity is a stop condition; do not retry a mutation until readback proves whether the first attempt succeeded.

## 1. Why the rollout must be split

The current immutable source resolves XSUAA users only by a hash of the JSON-encoded tuple `[origin, issuer, user_uuid]`. Existing `Users` rows are deliberately nullable and unlinked. Deploying that runtime before linking at least one authorized PM will fail closed and can lock every legacy user out.

The safe dependency chain is therefore:

```text
Read-only deployed-state freeze
  -> temporary read-only claim probe under legacy auth
  -> two fresh-session stability proofs
  -> additive identity schema + audit table
  -> one approved PM self-link under legacy auth
  -> immutable-runtime canary
  -> later onboarding / provisioning pilot
```

No step may be skipped or reordered.

## 2. Evidence basis and limitations

### Verified in source

- `db/schema.cds` defines nullable private identity fields and a unique hash for `Users`.
- `srv/auth/identity-map.js` currently pins the subject name to `user_uuid` but reads it, origin, and issuer from `req.user.attr`. Exact CAP 9.9.2 middleware-source review proved this location assumption is wrong for top-level XSUAA claims; commit `417e260` is therefore a deployment `NO-GO` until CP-G2A source remediation passes.
- `srv/auth.js`, `srv/bug-service/helpers.js`, and `srv/user-admin.js` use the shared resolver.
- Public service projections do not expose the private `Users` identity fields.
- The full source slice has static/focused test evidence, but it has not been deployed to BTP/HANA.

### Must be refreshed live

- Exact deployed application revision and source provenance.
- Current BTP readiness and current trust/default-provider state.
- Exact HANA catalog state and live `Users` aggregate counts.
- Presence and stability of `origin`, issuer, and `user_uuid` in this exact XSUAA trust path.
- Whether the previously observed legacy-user count remains unchanged.

### SAP-supported basis

- CAP deploys HANA design-time artifacts through HDI, and additive nullable fields are a compatible schema evolution pattern. Broad `cds deploy --to hana` is not selected because it can also generate/import CSV-backed table data and can create/use database service credentials: <https://cap.cloud.sap/docs/guides/databases/hana>.
- SAP documents `user_uuid` as the global user identifier in the default Identity Authentication application mapping, but its actual presence still must be proven in this tenant and token path: <https://help.sap.com/docs/btp/sap-business-technology-platform/default-configuration-of-identity-authentication-application>.
- XSUAA validates and exposes claims from the trusted authorization server; no code in this gate parses or logs a raw bearer token: <https://help.sap.com/docs/BTP/65de2977205c403bbc107264b8eccf4b/649961f8d4ad463daca33b3a20deba4c.html>.
- The provider origin identifies the identity-provider trust configuration and must remain part of the authority tuple: <https://help.sap.com/docs/cloud-identity-services/cloud-identity-services/target-configure-single-and-multiple-origins>.

## 3. Approval checkpoints

| Checkpoint | Scope | Maximum external mutations | Exit criterion |
| --- | --- | ---: | --- |
| CP-G2A | Read-only discovery plus local source-only compatibility package | 0 | Exact deployed baseline, exact schema delta, probe code/tests, migration artifact diff, and rollback package are reviewable |
| CP-G2B-R | Rehearse exact module-scoped forward/rollback deployments in a disposable space | 2 disposable application revisions | Route/binding/resource behavior and lower-version rollback are proven with exact checksums; no shared-QA mutation |
| CP-G2B | Deploy only the temporary CAP claim-probe compatibility release | 1 shared-QA application revision | Runtime ready; legacy login unchanged; probe is PM-only and returns sanitized fields only |
| CP-G2C | Human executes two fresh-session claim proofs | 0 data/config mutations | Complete tuple exists and the fingerprint prefix is stable across two full re-authentications |
| CP-G2D | Additive identity schema/audit migration and local bootstrap-release preparation | 1 HDI migration | Four nullable columns, one unique constraint/index, one empty audit table, no seed/data loss; bootstrap artifact is checksum-reviewed but not deployed |
| CP-G2E | Temporarily deploy bootstrap release, link exactly one approved existing PM, then remove the action | 2 application revisions + 1 `Users` row update + 1 append-only audit insert | Idempotent self-link readback succeeds; no role/email/active flag changes; bootstrap route/property is absent afterward |
| CP-G2F | Deploy immutable runtime canary | 1 application revision | Linked PM works; all negative direct API cases fail closed; rollback artifact remains usable |

Approval of CP-G2A does not authorize CP-G2B. Each later row requires a new explicit DonHV GO containing the exact artifact checksum and before/after state.

## 4. CP-G2A — read-only discovery and source-only preparation

### Task 4.1: Freeze repository and deployed runtime state

**Files:** no source mutation; evidence remains sanitized in the gate report.

- [ ] Run `git fetch origin dev` without merge/switch, then record `git rev-parse origin/dev` and `git rev-parse HEAD`.
- [ ] Confirm the implementation worktree remains `feature/wp7-user-onboarding-donhv` and that the generated `.wp7-user-onboarding-donhv_mta_build_tmp/` directory is not staged or packaged.
- [ ] Run `npm run btp:demo:check`. Do not run recovery unless the output is not READY and a still-valid DonHV recovery approval covers only starting existing CAP/AppRouter and waking existing HANA.
- [ ] Read `cf apps`, `cf services`, and sanitized application metadata. Do not run `cf env`, download droplets, or expose service-binding values.
- [ ] Record CAP/AppRouter instance counts and `/health`, `/ready`, anonymous protected API, and Web results without private URLs.
- [ ] Re-read trust/settings in read-only mode and confirm `sap.default` remains active/default/user-logon enabled. Record only allowlisted provider label, origin label, state booleans, and protocol.
- [ ] Determine deployed source provenance from an existing release label/build metadata. If no trustworthy SHA exists, report `UNKNOWN`; do not infer that deployed runtime equals `origin/dev`.

**Stop:** runtime unhealthy, trust/default state changed, deployed provenance ambiguous in a way that prevents building a rollback artifact, or any command requests credentials beyond the existing authenticated operator session.

### Task 4.2: Inventory HANA using aggregate-only evidence

**Create locally:**

- `scripts/db/inspect-user-identity-hana.js`
- `scripts/qa/test-user-identity-hana-inspector.js`
- `docs/knowledge/scripts/db/inspect-user-identity-hana.js.md`
- `package.json` scripts:
  - `db:user-identity:inspect`
  - `qa:user-identity:inspector`

**Inspector contract:**

- [ ] Default mode is read-only and refuses any `--execute` flag.
- [ ] Resolve exactly one HDI binding from in-process `VCAP_SERVICES`; never print credentials, schema name, host, port, certificate, or endpoint.
- [ ] Require SAP HANA; reject SQLite/PostgreSQL/unknown drivers.
- [ ] Resolve physical table/column/index names from `SYS.TABLES`, `SYS.TABLE_COLUMNS`, and allowlisted index/constraint catalog views.
- [ ] Emit only: table-present booleans, column-present booleans, constraint/index-present booleans, total row counts, null/non-null hash counts, duplicate non-null hash count, duplicate normalized-email count, and onboarding-table row counts.
- [ ] Never select or emit email, display name, UUID, raw external claim, full hash, password hash, token, recipient, error body, or business row.
- [ ] Exit nonzero on duplicate non-null hashes, more than one matching physical table, unexpected non-null external identity fields, or inconsistent columns/constraint state.
- [ ] Explicitly prove in the generated HANA artifact/test database that the nullable unique hash permits all existing null legacy rows while rejecting duplicate non-null hashes. If this behavior differs in the deployed HANA revision, stop before migration.
- [ ] Unit-test the SQL allowlist and output allowlist with a fake HANA adapter. The test must reject any output key containing credential/PII-shaped names.

**Live execution path:** Prefer an already authorized read-only HANA Database Explorer session. If no such session exists, package the inspector with CP-G2B and run it as one bounded Cloud Foundry task after separate approval. Do not create a service key merely to run the inspector.

### Task 4.3: Correct the validated-token extractor and build a temporary claim-probe compatibility release

Create a separate worktree/branch from the exact deployed source SHA, not from `417e260`:

`chore/wp7-identity-live-proof-donhv`

**Create in that branch only:**

- `srv/identity-proof.cds`
- `srv/identity-proof.js`
- `scripts/qa/test-identity-claim-proof.js`
- `docs/knowledge/srv/identity-proof.cds.md`
- `docs/knowledge/srv/identity-proof.js.md`
- `package.json` script `qa:identity-claim-proof`

Also remediate the source-only immutable implementation on `feature/wp7-user-onboarding-donhv` before any rollout candidate is built:

- `srv/auth/identity-map.js`
- `srv/user-admin/invitations.js`
- `scripts/qa/test-immutable-identity-mapping.js`
- `scripts/qa/test-user-onboarding-contract.js`
- `scripts/qa/test-user-onboarding-programmatic.js`
- matching knowledge mirrors

**Validated-token extraction contract:**

- [ ] In XSUAA runtime, require `req.user.authInfo.token` created by the validated CAP/XSUAA middleware; never decode the Authorization header again.
- [ ] Read `origin` from the public validated getter `token.origin` and issuer from `token.issuer`.
- [ ] Read the pinned subject specifically from validated `token.payload.user_uuid`. Do not use `token.userId`, because `XsuaaToken.userId` falls back to `sub` when `user_uuid` is absent.
- [ ] Treat absent/invalid `authInfo`, token, origin, issuer, or `payload.user_uuid` as incomplete and fail closed.
- [ ] Never return, log, clone, serialize, or persist the complete token payload. The extractor returns only bounded origin/issuer/subject to the internal hash function; public evidence remains booleans/prefix only.
- [ ] Local/custom auth retains its separate deterministic internal-ID/unique-email path and must never manufacture a fake XSUAA `authInfo`.
- [ ] Tests must use a middleware-shaped fake `authInfo.token` with public getters and a validated payload shape; fixtures that place top-level claims in `req.user.attr` are invalid.

**Exact service contract:**

```cds
service IdentityProofService @(requires: 'PM') {
  type IdentityProofResult {
    originPresent             : Boolean;
    issuerPresent             : Boolean;
    userUuidPresent           : Boolean;
    complete                  : Boolean;
    subjectSource             : String(20);
    authorityFingerprintPrefix: String(12);
  }
  action probeCurrentSapIdentity() returns IdentityProofResult;
}
```

**Handler rules:**

- [ ] Require authenticated XSUAA runtime and the existing `PM` role server-side; UI visibility is irrelevant.
- [ ] Call the existing `platformBusinessRoles(req)` helper and require the exact array `['PM']`; a token containing PM plus Tester/Developer is invalid even though CDS `@(requires: 'PM')` is satisfied.
- [ ] Use the shared validated-token extractor; do not independently read claim locations in the probe.
- [ ] Hash `JSON.stringify([origin, issuer, userUuid])` with SHA-256 and return only the first 12 lowercase hex characters.
- [ ] Return `subjectSource = 'user_uuid'` only when the tuple is complete; otherwise return a safe incomplete result and HTTP 409 `IDENTITY_CLAIMS_INCOMPLETE`.
- [ ] Never return/log raw attributes, raw JWT, email, `sub`, `req.user.id`, full hash, tenant hostname, or error stack.
- [ ] Never query or mutate HANA business rows.
- [ ] Never fall back to email, `sub`, display name, or `req.user.id`.
- [ ] Add safe structured audit logging only for `event`, boolean completeness, a generated correlation ID, and the 12-character prefix; no full identity material.

**Tests:**

- [ ] PM + complete tuple: 200 and exact allowlisted response.
- [ ] PM + missing each individual claim: 409 and no fingerprint.
- [ ] Tester/Developer/authenticated-without-PM: 403.
- [ ] PM+Tester, PM+Developer, and PM+Tester+Developer: 403.
- [ ] Anonymous/direct OData: 401/403.
- [ ] Different tuple: different prefix.
- [ ] Same tuple: stable prefix.
- [ ] Adversarial delimiters/NUL characters cannot collide because hashing uses structured JSON.
- [ ] Raw claims/JWT/email/full hash never appear in response or captured logs.
- [ ] The service compiles on SQLite and HANA profiles without changing `db/schema.cds`, `xs-security.json`, `mta.yaml`, routes, Role Collections, or trust.

### Task 4.4: Generate and inspect the future additive HDI delta

Prepare this as an offline candidate only. Build two clean source trees: the exact deployed baseline and a candidate that adds only the identity fields/audit entity.

**Candidate schema delta:**

```cds
extend idts.cap.Users with {
  externalIdentityOrigin  : String(120);
  externalIdentityIssuer  : String(500);
  externalIdentitySubject : String(255);
  externalIdentityKeyHash : String(64);
}

annotate idts.cap.Users with @assert.unique.userExternalIdentity:
  [ externalIdentityKeyHash ];
```

Also add one append-only `UserIdentityAuditEvents` entity containing only:

- `actorUser` and `targetUser` associations;
- allowlisted `action` (`BOOTSTRAP_LINK`, `LINK_NOOP`, `LINK_REJECTED`, `BOOTSTRAP_UNLINK_ROLLBACK`);
- correlation ID;
- private 64-character before/after identity-key hashes for exact reconciliation/rollback matching; public APIs, logs, and evidence expose only their 12-character prefixes;
- result code and managed timestamps;
- no email, role mutation payload, raw claims, token, credential, provider body, or full identity hash other than the two private reconciliation fields defined above. Those two fields must be excluded from every service projection, response, log, and public evidence artifact.

Add a composite unique constraint on audit `(correlationId, action)`. A bootstrap correlation may contain one `BOOTSTRAP_LINK` and one later `BOOTSTRAP_UNLINK_ROLLBACK`, but never duplicate the same action; rejected attempts use a new correlation and never reuse a successful link correlation.

**Files in the migration candidate branch:**

- `db/schema.cds`
- `docs/knowledge/db/schema.cds.md`
- `scripts/qa/test-user-identity-schema-contract.js`

**Prepare a non-routed rollback task in both compatibility packages:**

- `srv/identity-bootstrap/rollback-task.js`
- `scripts/qa/test-identity-bootstrap-rollback.js`
- `docs/knowledge/srv/identity-bootstrap/rollback-task.js.md`

The task defaults to dry-run and rejects execution unless both `--execute` and an explicitly approved correlation ID are present. It resolves the original `BOOTSTRAP_LINK` audit row, performs one conditional `Users` update only when the current full hash exactly equals the private audited after-hash and all four fields remain populated, and appends `BOOTSTRAP_UNLINK_ROLLBACK` in the same transaction. It never accepts email, role, target user ID, raw claims, or credentials as input. It emits only status, affected-row count, correlation ID, and 12-character prefixes. Packaging the non-routed task does not authorize running it.

**Build/inspection commands:**

1. `npx cds build --production` in the clean deployed-baseline worktree.
2. `npx cds build --production` in the candidate worktree.
3. Diff only generated `gen/db/src/gen` and HDI configuration artifacts.
4. Search both outputs for `.hdbtabledata`, `.csv`, `DROP`, `TRUNCATE`, destructive table recreation, and unrelated entity deltas.

**Acceptable delta:** four nullable columns on `Users`, one nullable-unique constraint/index, one new empty audit table and its generated constraints. No onboarding table, seed, code-list, view, unrelated column, data import, delete, drop, or destructive conversion is allowed in CP-G2D.

If the HDI build cannot produce this exact additive delta, stop. Do not replace it with ad-hoc DDL against HDI-owned objects without a separate architecture approval.

Before M-G2D-01, run the exact candidate package against the live container using the installed `@sap/hdi-deploy@5.7.0 --simulate-make` capability under a separate approval. Use `--simulate-make`, both warning-as-error options, `--no-trace-vcap-services`, no general `--trace`, and the exact allowlisted working set. Simulation skips make/post-make but its help states that pre-make activities such as grants can still take effect; therefore record it as M-G2D-00, not as read-only. Capture only sanitized planned artifact/action classes. Stop if the server rejects simulation, emits warnings, touches unrelated artifacts, or the plan is ambiguous.

Read back existing HANA backup/recovery coverage before simulation. If the trial tenant has no SAP-supported restore path available to the operator, M-G2D-01 remains `NO-GO`; aggregate counts are evidence, not a substitute for recoverability.

### Task 4.5: Prepare immutable rollout artifacts but do not deploy them

- [ ] Record SHA-256 checksums for the previous approved rollback MTAR, compatibility-probe MTAR, additive-schema MTAR, bootstrap-release MTAR, and immutable-canary MTAR.
- [ ] If the previous runnable MTAR cannot be identified and checksum-verified, CP-G2B is `NO-GO`.
- [ ] Run `cf deploy --help` and record the installed MultiApps plugin syntax. The intended operation must target only the named module; if this plugin version cannot scope deployment safely, stop rather than issuing a broad MTA deployment.
- [ ] Installed help observed during planning: CF CLI `8.7.11`, MultiApps plugin `3.11.1`, and MBT `1.2.47`; module scoping uses `-m`, while the supported strategies are `default`, `blue-green`, and `incremental-blue-green`.
- [ ] Candidate forward command class, still subject to disposable rehearsal: `cf deploy <checksum-verified-forward-mtar> -m idts-sap01-srv --strategy blue-green --version-rule ALL --retries 0 --abort-on-error`.
- [ ] Candidate rollback command class, also requiring disposable rehearsal: `cf deploy <checksum-verified-prior-mtar> -m idts-sap01-srv --strategy blue-green --version-rule ALL --retries 0 --abort-on-error`.
- [ ] Do not use the experimental `--backup-previous-version` flag. Rollback must use the independently checksum-verified prior MTAR.
- [ ] Do not execute any deploy command in CP-G2A.

### Task 4.6: CP-G2A verification

Run individually and record native exit codes:

- `npm run qa:identity-claim-proof`
- `npm run qa:user-identity:inspector`
- `npx cds compile srv --to json`
- `npx cds compile srv --to hana`
- `npm run qa:secret-scan`
- `npm run qa:agent-rules`
- `npm run qa:depth:self-test`
- `npm run qa:depth:pr-body` only after a PR workflow is separately approved and an actual review body has been prepared
- `git diff --check`
- focused search proving no raw-claim/JWT/full-hash logging
- exact generated HDI artifact diff review

Request one independent read-only IAM/security falsification review and one exact-head review. Zero Critical/Major findings are required before requesting CP-G2B.

## 5. CP-G2B-R — disposable deployment and rollback rehearsal

This checkpoint is not approved by the current planning request. It is mandatory before shared-QA CP-G2B.

- Use a disposable CF space or equivalent isolated SAP-supported environment approved by DonHV; do not create it implicitly.
- Build a minimal compatibility descriptor containing only the CAP probe module and references to pre-existing test services. Do not reuse the full production MTAR with DB deployer, XSUAA update, UI content, or service-resource mutations.
- Inspect the exact archive deployment descriptor and checksums before deployment.
- Run the candidate forward command with zero retries, verify temporary/live app names, routes, bindings, provided dependencies, MTA metadata and health.
- Run the exact rollback command using the prior artifact and `--version-rule ALL`; verify the original route/bindings/revision and absence of the probe.
- Delete/clean the disposable rehearsal only under its own approved cleanup action; do not infer cleanup authorization.
- If no disposable environment is available, CP-G2B remains `NO-GO`; do not use shared QA as the rehearsal target.

## 6. CP-G2B — temporary compatibility-probe deployment

This checkpoint is not approved by the current planning request.

### Exact mutation M-G2B-01

| Field | Value |
| --- | --- |
| System | SAP BTP Cloud Foundry, existing `idts-sap01-srv` application only |
| Before | Current healthy CAP revision; current schema/XSUAA/trust unchanged |
| Change | Deploy checksum-verified compatibility MTAR containing only `IdentityProofService` and the read-only inspector |
| Permission | Existing CF SpaceDeveloper/operator session; no new credential/service key |
| Idempotency | Compare MTAR checksum and current application revision before deploy; never retry on timeout before readback |
| Verification | instance count, `/health`, `/ready`, anonymous 401/403, normal IDTS login, PM probe route, existing bug flows smoke test |
| Rollback | redeploy the checksum-verified previous MTAR to the same service module; verify readiness and legacy login |
| Stop | deployment touches DB deployer, XSUAA, AppRouter, UI content, routes, services, trust, or more than the one CAP module |

After deployment, run the aggregate-only inspector as a bounded task only if Database Explorer could not provide the inventory. Task creation is operational state, not database mutation; it must still be listed in the mutation ledger.

## 7. CP-G2C — two fresh-session live claim proofs

This checkpoint is a human-assisted verification, not an account/role mutation.

### Proof procedure

1. DonHV opens a clean private browser session and chooses the existing `sap.default` login path.
2. DonHV completes SAP authentication personally; Codex never sees password, OTP, passkey, cookie, token, email, or raw claims.
3. Call `IdentityProofService.probeCurrentSapIdentity` once through AppRouter.
4. Record only the three presence booleans, `complete`, `subjectSource`, 12-character fingerprint prefix, correlation ID, timestamp, and HTTP result.
5. Fully sign out from IDTS/SAP session and close the private window.
6. Open a new private session, authenticate again, and repeat.
7. Compare prefixes. They must match exactly and both responses must say complete with `subjectSource=user_uuid`.

### PASS/FAIL

| Check | PASS | FAIL/STOP |
| --- | --- | --- |
| `origin` | present | missing/oversized |
| issuer | present | missing/oversized |
| `user_uuid` | present | missing/oversized |
| stability | same prefix across two full re-authentications | prefix changes or cannot prove fresh session |
| privacy | no raw claim/JWT/email/full hash in UI/log/evidence | any sensitive identity material appears |
| auth | PM allowed; non-PM/direct anonymous denied | route callable without PM |

On FAIL, rollback the compatibility probe or leave it disabled according to the approved rollback choice. Do not migrate schema, link users, or switch subject authority to `sub`/email.

## 8. CP-G2D — additive schema and bootstrap-release preparation

This checkpoint requires a new exact DonHV approval after CP-G2C PASS.

### Mutation M-G2D-01: additive HDI migration

- Deploy only the checksum-verified HDI delta reviewed in CP-G2A.
- Before/after counts must be identical for every pre-existing table.
- All existing `Users.externalIdentity*` fields must remain null.
- `UserIdentityAuditEvents` must exist and contain zero rows.
- No onboarding tables, status seed, CSV/table data, or business-row DML is included.
- If HDI proposes drop/recreate/table-copy with unproven rollback, stop before final deployment confirmation.

### Source-only preparation: bootstrap compatibility service

Add to the compatibility release:

- `srv/identity-bootstrap.cds`
- `srv/identity-bootstrap.js`
- `scripts/qa/test-identity-bootstrap.js`
- knowledge mirrors for both service files

**Exact action:** `bootstrapCurrentIdentityLink()` takes no target user, email, role, or capability parameter.

**Server-side contract:**

- Existing legacy auth must resolve exactly one active PM, and `platformBusinessRoles(req)` must return exactly `['PM']`.
- The request must contain the complete live tuple proven in CP-G2C.
- A private deployment setting must contain only the SHA-256 of the approved internal `Users.ID`, never the raw ID/email/credential, and must not be committed. The handler hashes the resolved current user's internal ID and compares in constant time.
- The selected row must have all four external identity fields null, or already equal the same tuple/hash for an idempotent no-op.
- Reject inactive rows, non-PM rows, zero/multiple legacy matches, any existing hash collision, partially populated identity fields, multiple business roles, any role/capability change, or a target other than the current requester.
- In one transaction, update only the four identity fields and append one sanitized audit event.
- Perform one atomic conditional update whose `WHERE` clause requires the approved `Users.ID` and all four identity fields to be null; require exactly one affected row for `LINKED`.
- If the conditional update affects zero rows, re-read in the same transaction: return `NO_OP` only when all four fields already equal the same tuple/hash and the unique prior audit is consistent; otherwise reject as collision/partial state.
- Enforce the composite audit `(correlationId, action)` constraint so the same approval cannot create two successful link events while a later rollback event can remain in the same correlation chain.
- Return only `LINKED` or `NO_OP`, correlation ID, and 12-character fingerprint prefix.
- Do not change email, display name, `role_code`, active state, password data, Role Collection, XSUAA, trust, or any other user.
- The private bootstrap hash is injected only into the checksum-reviewed bootstrap application revision and is removed by the immutable/rollback application revision; do not use an additional unledgered `cf set-env` mutation.

Build, test, checksum, and review this release locally, but do not deploy it in CP-G2D. The action therefore remains technically inaccessible until CP-G2E approval.

## 9. CP-G2E — one existing-PM self-link

This checkpoint authorizes exactly two checksum-verified application revisions and two transactional database writes:

1. Deploy the temporary bootstrap compatibility release with the private hashed-user allowlist.
2. Update the four external identity fields on one explicitly approved active PM row.
3. Insert one `BOOTSTRAP_LINK` audit row in the same transaction.
4. Immediately redeploy the checksum-verified probe/legacy compatibility release, removing the bootstrap action and private hash property.

### Before mutation

- Read aggregate collision counts: zero non-null duplicate hash; unique legacy PM match.
- Confirm the target row has four null identity fields, is active, and has exactly `PM` as business role.
- Confirm the action has no target/role/capability input.
- DonHV reviews the sanitized 12-character fingerprint prefix from CP-G2C.

### After mutation

- Read back only booleans for all four populated fields, the same 12-character prefix, unchanged role/active/email-hash booleans, and one matching audit event.
- Call the action a second time only if explicitly included in the approval; expected result is `NO_OP` with no second update. An audit `LINK_NOOP` row is optional only if approved in the exact diff.
- Redeploy the probe/legacy compatibility MTAR and verify the bootstrap endpoint is absent/404, the private bootstrap property is absent, normal readiness is healthy, and the linked row/audit remain unchanged.

### Rollback

Before immutable runtime deployment, rollback may clear exactly those four fields only when the same correlation ID/full private hash is still current and no downstream onboarding/provisioning operation references the link. Execute the checksum-reviewed non-routed rollback task only under a separate emergency GO; its conditional clear and `BOOTSTRAP_UNLINK_ROLLBACK` insert must commit in one transaction. Do not delete audit. If these conditions are not provable, do not clear data—redeploy the legacy runtime and reconcile manually.

**Candidate emergency command class:** `cf run-task idts-sap01-srv --command "node srv/identity-bootstrap/rollback-task.js --execute --correlation-id <approved-correlation-id>"`. Refresh `cf run-task --help`, verify the packaged path and current app revision, and show the sanitized dry-run result before DonHV approves the final task creation. The correlation ID is pseudonymous operational metadata, not a credential, but it must still be redacted outside the private evidence package.

## 10. CP-G2F — immutable runtime canary

Only after CP-G2E PASS may DonHV consider deploying immutable enforcement.

The first canary must contain the smallest runtime diff required for immutable identity resolution. Build it from the exact deployed baseline plus the already-migrated identity schema, then apply only `srv/auth/identity-map.js`, the identity-resolution portions of `srv/auth.js` and `srv/bug-service/helpers.js`, their focused tests, and matching knowledge mirrors. Do not cherry-pick the entire `417e260` commit because it also contains onboarding-dependent files. Do not combine the canary with UserAdmin XSUAA deployment, onboarding UI content, IAS groups, Role Collection mapping, email invitation, IPS, or broker deployment.

### Acceptance matrix

| Actor/state | Expected result |
| --- | --- |
| Linked active PM, matching fresh SAP identity | existing PM functions allowed |
| Same email, different immutable tuple | 403 |
| Matching tuple, renamed email | maps to same user |
| Missing `user_uuid`, origin, or issuer | 403/fail closed |
| Unlinked legacy user | 403; no email fallback in XSUAA |
| Inactive linked user | 403 |
| Duplicate/colliding hash fixture | rejected; no user selected |
| Anonymous/direct API | 401/403 |
| PM without future `UserAdmin` | no user-administration API; this gate does not grant it |

### Rollback

Redeploy the checksum-verified compatibility/legacy MTAR. Do not clear the linked identity merely to roll back runtime. Verify readiness, legacy login, protected API behavior, and unchanged HANA counts. Do not perform DB down-migration while nullable columns/audit table are harmless and unused.

## 11. Exact mutation ledger template

| ID | Action | Before | After | Permission | Exposure | Idempotency/readback | Rollback order | Approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M-G2B-01 | Deploy claim-probe CAP module | healthy legacy CAP | same runtime + read-only probe | CF SpaceDeveloper | app revision only | checksum + app revision + readiness | redeploy prior MTAR | CP-G2B |
| M-G2B-02 | Optional one-off inspector task | no task | one completed read-only task | CF task permission | aggregate catalog counts | inspect task status; never retry before status readback | no data rollback; task expires | CP-G2B |
| M-G2D-00 | HDI simulated make | reviewed local candidate | sanitized live server plan; no make/post-make | HDI deploy permission | HDI staging/pre-make may change grants | server support + warning-free planned action readback | stop; inspect pre-make state, no blind rerun | CP-G2D |
| M-G2D-01 | Additive HDI artifacts | no identity fields/audit table | four nullable fields + unique index + empty audit table | HDI deploy permission | schema only | catalog/count readback | stop; deploy prior runtime, no destructive down migration | CP-G2D |
| M-G2E-00 | Deploy temporary bootstrap module with private hashed-user allowlist | probe runtime | bootstrap action gated to one resolved user | CF SpaceDeveloper | app revision + non-PII hash property | checksum + readiness + property-presence boolean | immediately redeploy probe MTAR | CP-G2E |
| M-G2E-01 | Self-link approved PM | four fields null | four fields populated | exact PM plus private allowlist | one user row | conditional update, hash collision check | guarded clear only before downstream use | CP-G2E |
| M-G2E-02 | Append bootstrap audit | no event | one immutable event | same transaction | sanitized audit | correlation ID uniqueness | never delete | CP-G2E |
| M-G2E-03 | Remove bootstrap action/property | temporary bootstrap runtime | probe/legacy compatibility runtime | CF SpaceDeveloper | app revision only | endpoint absent + readiness + link unchanged | redeploy same probe MTAR on ambiguous state only after readback | CP-G2E |
| M-G2E-R00 | Emergency rollback task creation | compatibility runtime contains dormant task | one bounded task process | CF task permission | task process only | dry-run/readback before execute; no blind retry | task exits; inspect state | separate emergency GO |
| M-G2E-R01 | Conditional unlink + rollback audit | exact linked row + link audit | four identity fields null + one rollback audit | HDI-bound task | one user row + sanitized audit | exact correlation/full-hash match, affected rows = 1 | no automatic redo; retain audit and reconcile | separate emergency GO |
| M-G2F-01 | Deploy immutable canary | legacy mapper | immutable mapper | CF SpaceDeveloper | app revision only | checksum + live role matrix | redeploy compatibility MTAR | CP-G2F |

All IAS, IPS, trust, group, Role Collection, XSUAA, email delivery, invitation, new user, Jira, Drive, and seed mutations remain zero throughout G2.

## 12. Hard stop conditions

Stop before the next mutation if any one occurs:

- exact deployed SHA/rollback artifact cannot be proven;
- BTP readiness is not healthy;
- `sap.default` is not active/default/user-logon enabled;
- the live tuple lacks `origin`, issuer, or `user_uuid`;
- the fingerprint changes across two fresh sessions;
- raw JWT/claim/email/full hash/credential appears in evidence or logs;
- HANA has unexpected non-null identity fields, duplicate normalized emails affecting bootstrap resolution, duplicate hashes, partial schema, or unexplained drift;
- HDI artifact diff includes unrelated tables, onboarding entities, CSV/table data, drop/truncate/delete, destructive conversion, or seed import;
- live HDI simulation is unsupported/ambiguous, has warnings, or performs unreviewed pre-make activity;
- no SAP-supported HANA recovery path is verified for the exact trial container;
- the deploy command cannot target exactly the approved module;
- disposable forward/rollback rehearsal is unavailable or fails to preserve routes, bindings, resources, MTA metadata, and prior version behavior;
- a timeout/ambiguous response occurs and readback cannot determine the result;
- bootstrap would accept target ID/email/role/capability input, would update more than one row, or lacks same-transaction audit;
- rollback depends on deleting business/audit data or on a missing previous MTAR;
- any step requests a new credential, service key, technical client, private browser endpoint, broad admin grant, or undocumented API.

## 13. Security risk register

| Risk | Likelihood | Impact | Prevention | Detection | Rollback/owner |
| --- | --- | --- | --- | --- | --- |
| All legacy users locked out | High if order is wrong | Critical | probe -> schema -> one PM link -> enforcement | canary login/403 matrix | redeploy compatibility MTAR; DonHV |
| Mutable identity collision | Medium | Critical | no email authority in XSUAA; unique hash; unique legacy bootstrap match | aggregate collision audit | stop/reconcile; DonHV + backend owner |
| Missing/unstable `user_uuid` | Medium | High | two fresh-session proof | prefix comparison | abandon this authority; architecture review |
| Claim/credential leakage | Low with controls | Critical | return booleans/prefix only; no raw auth info/logging | response/log secret scan | remove probe, rotate only if actual secret leaked; Security owner |
| HDI data loss/seed overwrite | Medium with broad deploy | Critical | exact additive artifact diff; no `cds deploy`; no `.hdbtabledata` delta | pre/post counts, HDI plan review | stop, restore from approved backup only; DevOps/DB owner |
| Bootstrap self-elevation | Low with no-input action | Critical | PM-only, private user-ID allowlist, no role fields | before/after role comparison, audit | redeploy legacy; investigate; Security owner |
| Partial schema migration | Medium | High | catalog preflight, idempotent additive artifacts, sequential readback | field/index/table state matrix | leave additive fields; do not down-migrate blindly |
| Ambiguous deploy timeout | Medium | High | no blind retry; revision/checksum readback | CF operation/app revision | stop and inspect operation; DevOps owner |
| Last-admin dependency | Medium | High | preserve legacy rollback runtime; link one bootstrap PM before enforcement | admin-canary test | redeploy legacy; future multi-admin gate |
| Cross-region/trial instability | Medium | Medium/High | treat USA IAS/Singapore BTP as POC only | readiness/trust checks | pause pilot; no production claim |

## 14. Deliverables at CP-G2A

- [ ] Exact source/deployed SHA matrix with unknowns labeled.
- [ ] BTP readiness and trust/default matrix.
- [ ] Aggregate-only HANA schema/collision inventory or an explicit reason it remains blocked until CP-G2B.
- [ ] Temporary probe source diff, tests, response allowlist, and logs allowlist.
- [ ] Exact baseline-vs-candidate HDI artifact diff.
- [ ] Checksummed forward and rollback MTAR inventory.
- [ ] Independent IAM/security falsification and exact-head review.
- [ ] PASS/FAIL/UNKNOWN readiness matrix for CP-G2B.
- [ ] Exact mutation ledger showing zero external mutations during CP-G2A.
- [ ] A new DonHV approval request limited to M-G2B-01 and, only if necessary, M-G2B-02.

## 15. Recommendation and next approval prompt

**Recommendation:** `CONDITIONAL GO` for CP-G2A only. `NO-GO` for CP-G2B and later until the validated-token defect is fixed and CP-G2B-R proves forward/rollback behavior. Schema mutation, PM link, immutable runtime deployment, UserAdmin/XSUAA, Role Collections, onboarding identities, and provisioning remain prohibited until their preceding checkpoints pass.

**Exact next GO prompt:**

> GO CP-G2A — DonHV approves read-only deployed-state/HANA discovery and local source-only preparation of the temporary PM-only identity claim probe, aggregate-only HANA inspector, additive HDI candidate diff, tests, rollback artifacts, and independent read-only security review. Maximum external platform mutations: zero. Do not deploy, migrate schema, update any Users row, change XSUAA/trust/Role Collections/IAS/IPS, create users/groups/credentials, send invitations, or begin CP-G2B+. Stop with exact diffs, checksums, readiness matrix, mutation ledger, blockers, and the proposed CP-G2B command.
