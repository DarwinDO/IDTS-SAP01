# IDTS-122 Edit and Create-Role Release Evidence

## Baseline

- Source baseline: `717741be061dcd52cc9afb59a3b064afa4a77aea`
- BTP service: `idts-sap01-srv`
- BTP AppRouter: `idts-sap01-approuter`
- Scope: restore two generated service views and make the List Report Create action reflect the authenticated IDTS role.

## Read-only preflight

- HANA mentor baseline before the view repair: 6 Bugs, 14 Users and 12 DeveloperProfiles.
- Active and draft Bugs tables already contained `RETESTOWNER_ID`.
- The deployed `BUGSERVICE_BUGS` view was stale and `BUGSERVICE_ACTIVETESTERS` was missing.
- No business-row mutation was required.

## Exact HDI view repair

- Simulation used an exact two-file working set and include filter.
- Approved execution task: `idts122-view-deploy-exact-012300`.
- Result: 2 effective `.hdbview` deploys, 0 effective undeploys and 0 dependent-file redeploys.
- Included artifacts:
  - `BugService.Bugs.hdbview`
  - `BugService.ActiveTesters.hdbview`
- Excluded: tables, tabledata, grants, seed, DML, schema migration and broad `cds deploy`.

## Local verification

- CAP compile: AuthService PASS; BugService PASS.
- `qa:idts122:programmatic`: 53/53 PASS.
- `qa:idts122:closed`: PASS.
- `qa:draft-reporter:programmatic`: 10/10 PASS.
- `qa:idts43:programmatic`: 12/12 PASS.
- UI5 production build: PASS.
- Secret scan: PASS.
- Agent rules: PASS.
- QA Depth self-test: 15/15 PASS.
- AI DevKit lint: PASS.
- `git diff --check`: PASS; line-ending warnings only.

## BTP readiness after view repair

- HANA/HDI: READY.
- CAP: 1/1.
- AppRouter: 1/1.
- `/health`: HTTP 200.
- `/ready`: HTTP 200.
- Anonymous protected API: HTTP 401.
- Web entry: HTTP 200.

## Remaining signed-in acceptance

- PM opens Edit for `BUG-0001` without HTTP 500, then discards the test draft.
- Active Tester value help loads.
- PM and Developer do not see Create Bug.
- Tester sees Create Bug and can create through the supported flow.
- PM and Developer direct OData create remain denied by CAP with HTTP 403.

## Merged UI release and selective BTP deployment

- PR: `#294`.
- Post-deployment evidence follow-up: PR `#295`.
- Merge SHA: `1a7964d8112594b7ea0e98b1d6112ad80b312659`.
- Merge method: normal merge after the exact-head QA Depth Gate passed; no administrative bypass.
- MTA archive was built from a detached fresh worktree at the merge SHA.
- Cloud Foundry deployment operation: `65425b7e-911e-11f1-9066-eeee0a8e28f9`.
- Deployed content module: `idts-sap01-app-content` only.
- Not deployed: `idts-sap01-db-deployer`, `idts-sap01-srv` and the AppRouter application.
- No database deploy, seed, tabledata, schema migration, DDL or DML ran in this UI rollout.

## Post-deployment readiness

- HANA/HDI readiness: HTTP 200 through `/ready`.
- CAP: 1/1.
- AppRouter: 1/1.
- `/health`: HTTP 200.
- `/ready`: HTTP 200.
- Anonymous protected API: HTTP 401, as expected.
- Web entry: HTTP 200.

## Acceptance boundary

- Local role-state tests and the deployed content operation prove that the new UI bundle was built and published.
- CAP remains the authoritative create boundary and continues to deny non-Tester create requests.
- Signed-in visual acceptance is still required for PM-hidden, Developer-hidden and Tester-visible behavior, and for opening/discarding Edit on `BUG-0001`.
- The current Codex session did not expose browser-control tooling and the running Edge instance did not expose a DevTools port. No signed-in browser result is inferred from CLI readiness.
- The local Cloud Foundry CLI does not have the `html5-list` plugin, so content-repository listing was not used as evidence. The successful content-module deploy operation and HTTP readiness are retained instead.

No password, token, cookie, API key, private endpoint or personal payload is stored in this evidence.
