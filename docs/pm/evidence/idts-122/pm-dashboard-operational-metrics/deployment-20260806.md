# IDTS-122 PM Dashboard deployment evidence — 2026-08-06

## Baseline

- PR: `#296`
- Merge/deploy SHA: `f6d06bc8b7e4cb4b190362d4449b2c5d1e257498`
- MTAR: `idts-sap01-dashboard-f6d06bc8.mtar`
- Cloud Foundry operation: `9b0887e7-9129-11f1-8bbb-eeee0a8a84c5`

## Selective deployment

The deployment selected only these application modules:

- `idts-sap01-srv`
- `idts-sap01-app-content`

The operation did not run `idts-sap01-db-deployer`, seed data, table data, DDL, DML, or a schema migration. The MTA controller processed existing service resources and bindings as part of the selected-module deployment; it did not mutate IDTS business rows.

The downloaded Cloud Foundry operation log confirms:

- `modulesForDeployment = idts-sap01-srv,idts-sap01-app-content`.
- The processed deployment model contains only `idts-sap01-app-content` and `idts-sap01-srv`.
- Module logs exist only for `idts-sap01-srv` and `idts-sap01-app-content`.
- `idts-sap01-db-deployer` and `idts-sap01-approuter` appear only in the full MTAR descriptor/current deployed-state comparison; neither was selected as a module to deploy.

For future reruns, use two explicit module flags (`-m idts-sap01-srv -m idts-sap01-app-content`) to remove any CLI-parsing ambiguity even though this operation recorded the intended comma-separated selection correctly.

The packaged HTML5 content was inspected after the operation. The nested `bug-management-ui.zip` contains `Component.js`, `Component-preload.js`, `dashboard.html`, `dashboard-page.js`, `manifest.json`, and `index.html`.

## Fresh post-deployment readiness

`npm run btp:demo:check` returned `DEMO READY`:

| Check | Result |
| --- | --- |
| HANA/HDI readiness | HTTP 200 through `/ready` |
| CAP | `1/1` running |
| AppRouter | `1/1` running |
| `/health` | HTTP 200 |
| `/ready` | HTTP 200 |
| Anonymous protected API | HTTP 401, expected |
| Web entry | HTTP 200 |

No DB deploy, seed, or migration was run during the readiness check.

The SAP trial runtime later stopped both CAP and AppRouter. `npm run btp:demo:prepare` restarted the existing applications without deploying artifacts or touching HANA data. A fresh check after recovery again returned CAP/AppRouter `1/1`, `/health` 200, `/ready` 200, anonymous Auth 401 and Web 200. This is an operational free/trial-runtime limitation, not a schema or business-data incident.

## Verification already accepted on the exact implementation head

- Dashboard focused suite: 10/10.
- IDTS-122 programmatic suite: 53/53.
- Closed aggregate suite: PASS.
- Draft reporter suite: 10/10.
- PM monitoring suite: 20/20.
- CAP compile: PASS.
- UI5 production build and manifest validation: PASS.
- Secret scan, agent rules, QA Depth self-test and fresh PR QA Depth: PASS.

## Browser acceptance status

Signed-in browser acceptance could not be completed by Codex automation in this run. Both the connected Edge session and the isolated in-app browser returned `ERR_BLOCKED_BY_CLIENT` when the automation attempted to open the BTP AppRouter URL. This is classified as a browser-control tooling blocker, not as proof of a BTP or application outage.

Before the browser-control block, Edge recorded an inconsistent page load where `Component.js` and `Component-preload.js` were not fetched. The exact MTAR readback contains both files, and BTP health/readiness remained green. Therefore the observation is retained as unresolved browser evidence and is not reported as a missing package asset.

Required remaining manual/signed-in checks:

1. PM sees all ten canonical status tiles and no `NEW` tile.
2. Zero-count statuses remain visible.
3. Each tile applies the matching List Report `status_code` filter.
4. AI Activity shows semantic success/failure and review-decision counters without raw provider data.
5. Tester and Developer cannot call PM-only status/AI metric functions (local backend 403 coverage already passes; deployed identity evidence remains open).

## Completion claim

Deployment and non-browser release gates are PASS. Full feature acceptance remains **PARTIAL** until the signed-in tile, filter, responsive UI, and three-role checks above are captured.

## Independent review disposition

The read-only release-falsification subagent correctly warned that the full MTAR contains a DB deployer payload and therefore must never be deployed broadly for this work item. That risk is accepted and retained as a future rollout guardrail.

Its preliminary concern that the comma-separated `-m` value might have selected an invalid single module is rejected for this completed operation because the controller's official log records the intended two-module selection and generated logs only for those two modules. No repeat deployment was performed merely to change syntax.
