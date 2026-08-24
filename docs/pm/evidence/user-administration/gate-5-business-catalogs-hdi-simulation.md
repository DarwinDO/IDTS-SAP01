# Gate 5 Business Catalogs — HDI Simulation Execution

Date: 2026-08-23
Owner: DonHV
Status: `LIVE SIMULATION PASS / REAL MIGRATION NO-GO`

## Frozen source and artifact

- Merged source and `origin/dev`: `eb0c5d1bc6c92557a7d41e45008240e1e929bc44`.
- Rollout branch: `chore/wp8-gate5-business-catalog-rollout-donhv`.
- Eligible local archive: `mta_archives/idts-gate5-business-catalog-hdi-sim-r2.zip`.
- Archive SHA-256: `19CB2D25210B6200067B61B9F9F5495FEFDC2BC6DD70841BEC583304C79BE9E3`.
- Archive size: `13,007` bytes; entries: exactly `14`.
- Node engine: exact `22.x`.
- Direct dependencies: exact `@sap/hdi-deploy@5.7.0` and `hdb@2.29.6`.
- Lockfile v3: `30` package entries, zero missing non-root integrity, local/Git resolution, lifecycle-script flag or audit vulnerability.
- Archive/payload mismatch, unsafe path, symlink, `node_modules`, CSV, `.hdbtabledata` and forbidden artifact count: `0`.
- R1 SHA-256 `5DDD34AEFFDE9743B0395AF270136ABC084057026AC2B487B604461E4EAE2826` is `REJECTED / NEVER RUN` because it predates the duplicate-state hard stop.

## Exact schema allowlist

| Artifact | SHA-256 |
| --- | --- |
| `src/gen/idts.cap.CatalogAdministrationAuditEvents.hdbtable` | `83ADD6805C03A5B8348737EAE739567A2E41C1AB7367F367ABBC763057B142C2` |
| `src/gen/idts.cap.ApplicationComponents.catalogCode.hdbindex` | `16741531E6925D14031C19C50236783A0C0F2113E9AA7ACF0169FDFC84384263` |
| `src/gen/idts.cap.ComponentCategories.catalogPair.hdbindex` | `272351CC08A63AAA01CF1A1E7D3CAA1AE5625C86D768EDD1BD36D97E9E1CD54E` |
| `src/gen/idts.cap.DefectCategories.catalogCode.hdbindex` | `07473870D1BEE92118827CB0C00A563F7E0D20A708A3018133CBCB9134769E8A` |
| `src/gen/idts.cap.SAPModules.catalogCode.hdbindex` | `1D858598C568E14A7B76235DCBB32C25AC5032DCD1A94DF495E0D095B4EAF004` |

The command uses identical explicit working, include and deploy sets, warning-as-error flags, `--no-auto-undeploy`, `--no-trace-vcap-services`, `--use-hdb` and `--simulate-make`. It never supplies undeploy, CSV or table-data inputs.

## Sanitized live preflight

- Target assertion: `PASS` for the reviewed CF API, organization and `dev` space.
- `npm run btp:demo:check`: `DEMO READY`; CAP/AppRouter `1/1`, liveness/readiness `200`, anonymous protected API `401`, Web `200`.
- Temporary app exact/casefold collision: `0/0`.
- Existing `idts-sap01-db`: exact/casefold `1/1`, type managed, last operation succeeded.
- Main CAP: revision count/max `7/7`, instances `1/1`, routes `1`, bindings `7`.
- Main AppRouter: revision count/max `11/11`, instances `1/1`, routes `1`, bindings `3`.
- App-instance quota/headroom: `20/13`; route quota/headroom: `10/5`.

## Recovery boundary

The exact tenant uses `hana-free`. Project evidence and SAP guidance already recorded in the repository state that native backup/recovery and storage snapshots are unavailable on this plan. Gate 5 changes are locally proven additive-only, but that does not replace a supported recovery path.

Consequences:

- One live `--simulate-make` is authorized by DonHV and may execute pre-make grants.
- Real HDI make remains `NO-GO` after simulation until a separately reviewed rollback/recovery strategy is approved.
- No baseline catalog, Bug, Developer Responsibility or business row may be edited to prepare the simulation.

## One-shot simulation sequence

Temporary app: `idts-gate5-catalog-hdi-sim-20260823-r2`.
Temporary task: `idts-gate5-catalog-hdi-sim-run-20260823-r2`.

1. Reassert target, readiness, collisions, main baselines and archive checksum.
2. Push the exact archive with `--no-manifest --no-start --no-route`, memory `256M`, disk `512M`, buildpack `nodejs_buildpack`.
3. Bind only existing `idts-sap01-db`.
4. Stage the exact READY package once, resolve its owned STAGED droplet in memory and set it once. Never start the app.
5. Run exactly one task: aggregate-only catalog duplicate/row-count inspector first, then the exact HDI simulation only when every duplicate-group count is zero.
6. Require terminal success, exact five deploy files, zero undeploy, zero warnings, and no CSV/`.hdbtabledata`/seed/unrelated dependent artifact.
7. After terminal readback, unbind and delete only the exact temporary app. Never delete the HDI service.
8. Recheck main baselines and `DEMO READY`.

Timeout or ambiguity requires one sanitized readback and no blind retry. Cleanup stops on ownership, binding or running-task ambiguity.

## Mutation ledger before execution

| Mutation | Count |
| --- | ---: |
| Temporary app push/bind/stage/set-droplet | 0 |
| HDI simulation task | 0 |
| Real HDI make / DDL / DML / seed | 0 |
| Catalog/business-row mutation | 0 |
| Main app/XSUAA/provider/user/role/email/Jira/Drive mutation | 0 |

OfficeCLI preflight: `1.0.144`. OfficeCLI does not validate Markdown semantics; exact hashes, programmatic contracts, sanitized platform readback and terminal task evidence remain authoritative.

## Live execution result

The one authorized R2 simulation chain completed without a retry:

| Step | Result |
| --- | --- |
| D01 exact no-start/no-route push | PASS; app STOPPED, routes 0, bindings 0, one READY package |
| D02 HDI bind | PASS; exact binding set `{ idts-sap01-db }` |
| D03 package stage | PASS; one build owned the exact READY package |
| D04 set droplet | PASS; one owned STAGED droplet selected; app remained STOPPED |
| D05 aggregate precheck | PASS; row counts `4 / 8 / 8 / 31`, duplicate groups `0` |
| D05 HDI simulation | PASS; task SUCCEEDED, exit 0 |
| Cleanup | PASS; zero running tasks, unbound once, deleted exact app once |

Sanitized HDI result:

- exact deploy set: all five allowlisted artifacts;
- make result: `5` deployed effective `5`, `0` undeployed effective `0`;
- warnings: `0`;
- dependent redeploy: `0`;
- CSV, `.hdbtabledata`, seed or unrelated artifact: `0`;
- explicit successful-simulation marker: present;
- real HDI make, DDL, DML and catalog/business-row mutation: `0`.

One `npm` peer-dependency warning appeared only in staging logs, not in the HDI task/make. A diagnostic sanitizer briefly emitted a technical container identifier; that line is rejected as evidence and is not persisted here. The first post-unbind readback still showed one relationship, but one read-only poll reached zero; unbind was never retried.

Final readback:

- temporary app/task/binding/route: absent;
- main CAP: `1/1`, revisions `7/7`, routes `1`, bindings `7`;
- main AppRouter: `1/1`, revisions `11/11`, routes `1`, bindings `3`;
- existing HDI service: count `1`, last operation succeeded;
- final `npm run btp:demo:check`: `DEMO READY`.

## Final mutation ledger

| Mutation | Attempted / confirmed |
| --- | --- |
| Temporary app push | `1 / 1` |
| Exact HDI bind | `1 / 1` |
| Package stage | `1 / 1` |
| Set owned droplet | `1 / 1` |
| HDI simulation task | `1 / 1` |
| Exact unbind | `1 / 1` |
| Exact temporary app delete | `1 / 1` |
| Real HDI make / DDL / DML / seed | `0 / 0` |
| Catalog/business-row mutation | `0 / 0` |
| Main app/XSUAA/provider/user/role/email/Jira/Drive mutation | `0 / 0` |

## Verdict

- Gate 5 live HDI simulation: **PASS**.
- Additive five-artifact plan: **PASS**.
- Real schema migration: **NO-GO** until DonHV separately approves a recovery/rollback strategy appropriate for the `hana-free` target.
- CAP/UI deployment and live catalog acceptance: **NO-GO** until the schema migration gate passes.
