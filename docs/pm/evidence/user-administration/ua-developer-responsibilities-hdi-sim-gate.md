# UA Developer Responsibilities — HDI Simulation Gate

Date: 2026-08-19
Owner: DonHV
Status: `LOCAL DELTA PASS / LIVE SIMULATION NO-GO UNDER READ-ONLY APPROVAL`

## Frozen inputs

- Deployed-schema source baseline used for comparison: `71c8a836d1952c9ce781b3f6d457d49c0a36ad81`.
- Developer Responsibilities source candidate: `21ce395ceb44c5a8ad913e98d4fd7169c787c2d3`.
- `origin/dev` observed at gate start: `0b694c4284e6a6b838ba3a2511d755bd01265a73`.
- Historical untracked `Makefile_20260818121902.mta` was excluded.

Both commits were exported into clean Windows Temp trees and compiled independently with the installed CAP toolchain. Repository `node_modules` was referenced by contained junctions; no package install or dependency mutation occurred.

## Exact generated delta

- Baseline generated file count: `229`.
- Candidate generated file count: `235`.
- Added: `6`.
- Changed: `3`.
- Removed: `0`.
- CSV or `.hdbtabledata` delta: `0`.
- `DROP`, `TRUNCATE` or `DELETE` text hits: `0`.
- Canonical nine-file allowlist manifest SHA-256: `8f6c0734d76faa2445557f30a45c333f7e1a2bae3d7ee56d6cb08b64603c0d64`.

### Added

1. `src/gen/idts.cap.UserOnboardingDeveloperResponsibilities.hdbtable`
2. `src/gen/idts.cap.UserOnboardingDeveloperResponsibilities.onboardingDeveloperScope.hdbindex`
3. `src/gen/UserAdministrationService.AvailabilityStatuses.hdbview`
4. `src/gen/UserAdministrationService.ComponentCategories.hdbview`
5. `src/gen/UserAdministrationService.ResponsibilityLevels.hdbview`
6. `src/gen/UserAdministrationService.SAPModules.hdbview`

### Changed

1. `src/gen/idts.cap.DeveloperProfiles.hdbtable`
   - Adds `administrationVersion INTEGER NOT NULL DEFAULT 0`.
2. `src/gen/idts.cap.UserOnboardingRequests.hdbtable`
   - Adds nullable `developerAvailabilityStatus_code NVARCHAR(40)`.
   - Adds nullable `developerWorkloadLimit INTEGER`.
3. `src/gen/BugService.DeveloperProfiles.hdbview`
   - View refresh caused by the new profile column.

The new request-owned table contains only its generated ID/audit columns plus onboarding request, Component Category, optional SAP Module, and responsibility level keys. Its unique inverted index covers onboarding request, Component Category, and optional SAP Module.

## Simulation command contract

The new command candidate is `scripts/btp/ua-developer-hdi-simulate-command.js`. It pins the exact nine files above as identical `working-set`, `include-filter`, and explicit deploy sets, and includes:

- `--exit`;
- `--simulate-make`;
- both warning-as-error flags;
- `--no-auto-undeploy`;
- `--no-trace-vcap-services`;
- no undeploy, CSV, or `.hdbtabledata` argument.

Command SHA-256: `acb9566deaf9d1337ebdc48320e46b2f3937518d4318c27e002ae026c1935467`.
Contract-test SHA-256: `533437a950f68db0d97d64532a612c3f8756168b206775b761c5a7e5b2d1d836`.

The local command contract passes and resolves the installed `@sap/hdi-deploy/deploy.js`. The deployer was **not invoked** against HANA in this gate.

## Why live simulation stopped

Installed HDI deployer guidance and prior project evidence establish that `--simulate-make` can still execute pre-make work such as grants. It is therefore an external operation with possible mutation, not a read-only command. The approved gate required zero platform/data mutation, so running it would exceed the exact approval.

Fresh installed-help readback states that simulation skips post-make activities while pre-make activities still take effect, with grants as the example. This help call was local and did not connect to HANA.

## Mutation ledger

| Class | Count |
| --- | ---: |
| HANA/HDI task or make | 0 |
| DB deployer / broad `cds deploy` | 0 |
| CSV / `.hdbtabledata` / seed | 0 |
| DDL / DML / business-row mutation | 0 |
| CAP/UI/AppRouter deployment | 0 |
| Provider/user/role/XSUAA mutation | 0 |
| Git remote mutation during this gate | 0 |

Two local harness issues and one policy-blocked Temp cleanup attempt are recorded in `docs/pm/status/donhv.md`. They did not reach SAP BTP or HANA.

## Verdict

- Generated additive delta: **PASS**.
- Nine-file simulation command contract: **PASS**.
- Live HDI `simulate-make`: **NO-GO under the current read-only approval**.
- Real schema migration: **NO-GO** until a successful separately approved live simulation, exact pre/post aggregate checks, and rollback/recovery evidence are reviewed.

## Local live-simulation package

The follow-up local packaging gate created `mta_archives/idts-ua-developer-hdi-sim-c39bdbe.zip` without executing it:

- SHA-256 `b0ae552d9f4a11ee266d1c7d2f38e7bf7cd8936c63a19ffda2a3f5aaa4986dda`;
- `8,243` bytes;
- exactly `14` files: the 9 schema/view artifacts, 2 HDI metadata files, one safe simulation command, `package.json`, and `package-lock.json`;
- zero `node_modules`, CSV, `.hdbtabledata`, unsafe path, sensitive-content hit, or staging/archive mismatch;
- exact Node `22.x` and `@sap/hdi-deploy@5.7.0` lock; npm audit `0` vulnerabilities.

The future forward/cleanup plan is frozen in `ua-developer-responsibilities-live-hdi-sim-plan.md`. No CF/HANA command was executed while creating this package.

Exact future-plan SHA-256: `92bc5a5314225907ae3371cb7a59ffeec56795929dc0dad41e2235ef87997c9e`.

OfficeCLI preflight: `1.0.144`; it cannot validate Markdown semantics, so exact hashes, CAP builds, and programmatic checks remain authoritative.

## R5 safety supersession

The earlier nine-file delta is historical and must not be used for real migration because live simulation proved that changing `UserOnboardingRequests.hdbtable` pulled an existing table-data/CSV dependency into the make graph.

R5 supersedes that package by storing the desired invitation profile in a new request-owned table. Exact generated comparison against baseline `71c8a836...` is now 227 baseline files / 235 candidate files, with 8 added, 2 changed and 0 removed. `UserOnboardingRequests.hdbtable` is unchanged and the generated diff contains zero CSV or `.hdbtabledata` files. The eligible simulation allowlist is the exact ten added/changed HANA artifacts recorded in the R5 plan; all older archives are rejected.

R6 further supersedes R5 after simulation showed the changed seeded `DeveloperProfiles` table still caused one dependent data expansion. Moving the optimistic version to `DeveloperProfileAdministrationStates` produces 11 added, 0 changed and 0 removed HANA artifacts. No existing table, CSV or `.hdbtabledata` appears in the exact diff or R6 archive. Only the R6 plan/hash is eligible for the final live simulation.
