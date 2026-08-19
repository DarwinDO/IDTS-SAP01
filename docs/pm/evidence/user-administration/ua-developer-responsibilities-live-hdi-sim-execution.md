# UA Developer Responsibilities — Live HDI Simulation Execution

Date: 2026-08-19
Owner: DonHV
Artifact SHA-256: `b0ae552d9f4a11ee266d1c7d2f38e7bf7cd8936c63a19ffda2a3f5aaa4986dda`

## Attempt 1 — stopped before simulation

Temporary app: `idts-ua-developer-hdi-sim-20260819`.

Preflight passed: authenticated exact target, `DEMO READY`, artifact/plan hashes, collision zero, one succeeded managed HDI service, application-instance headroom 13, and frozen main app baselines.

Mutation/readback ledger:

| Step | Result |
| --- | --- |
| D01 no-start/no-route push | PASS; app STOPPED, routes 0, bindings 0, one READY package |
| D02 exact HDI bind | PASS; exactly one intended binding |
| D03 stage-package | CLI session exceeded Codex's 30-second execution window; no second stage was run |
| HDI simulation task | NOT CREATED |
| HDI make/DDL/DML/seed | 0 |
| Cleanup unbind | command exit 0; bounded readback reached binding count 0 |
| Cleanup app delete | PASS; app count 0 |

Final readback preserved:

- HDI service count 1, last operation succeeded;
- main CAP revision 7 fingerprint `e37d6313c61f`, routes 1, bindings 7, instances 1/1;
- main AppRouter revision 11 fingerprint `5d91742def41`, routes 1, bindings 3, instances 1/1;
- `npm run btp:demo:check` = `DEMO READY`.

Root cause: Codex invoked the long-running CLI inside a 30-second tool window and emitted only stdout, losing the returned session identifier needed to poll the same process. The immediate build readback also used an unproven `app_guids` filter. This is a tooling/orchestration failure, not an HDI simulation failure.

## Corrective attempt 2 delta

Attempt 2 uses the unique app `idts-ua-developer-hdi-sim-20260819-r2`; every original preflight, mutation ceiling, allowlist, task, cleanup and stop condition remains unchanged.

Corrections only:

1. Invoke `cf stage-package` with a tool call that preserves the process session ID.
2. Poll that same session; never launch a second staging command.
3. After terminal CLI completion, resolve the build through the exact READY package GUID and require exactly one build whose package relationship matches.
4. Require build state and owned droplet state `STAGED` before the one set-droplet mutation.
5. Any nonzero, timeout beyond the documented staging bound, multiple/absent owned builds, or package/droplet mismatch triggers exact cleanup with no task.

This delta does not authorize new services, routes, app start, DB deployer, real make, data mutation, or a second simulation task.

## Attempt 2 — simulation command failed before HDI make

Temporary app: `idts-ua-developer-hdi-sim-20260819-r2`.

The fresh preflight, unique-name collision check, no-start/no-route push, exact HDI binding, persistent `stage-package` polling, owned-build readback, staged-droplet ownership check and exact `set-droplet` all passed. The build readback correction used the V3 build's top-level package GUID plus its app relationship; no second staging command was issued.

The one authorized task then failed once with sanitized class `MODULE_NOT_FOUND`. It did not reach HDI make: make completion was false, deployer completion was false, and no CSV or table-data artifact was referenced. Root cause is local command resolution: the resolver eagerly evaluated the optional `@sap/cds-dk` fallback even though the packaged payload already contained direct `@sap/hdi-deploy@5.7.0`.

Cleanup followed read-before-action discipline. The interrupted unbind output was not retried blindly; readback first proved binding count zero and no running task. The exact temporary app was then deleted once. The HDI service and main applications were not deleted, restarted or changed.

Attempt 2 result: `FAILED_BEFORE_HDI_MAKE`. The current artifact is rejected for further execution. The next step is TDD for direct-dependency-first resolution, followed by a new staging root, new artifact name/checksum and fresh preflight.

## Corrective artifact R3

- TDD reproduced the failure when a direct HDI deployer existed but the optional `@sap/cds-dk` fallback was absent.
- The resolver now checks the direct `@sap/hdi-deploy` dependency first and evaluates the `@sap/cds-dk` fallback only after direct lookup fails.
- New archive: `mta_archives/idts-ua-developer-hdi-sim-r3c.zip`.
- SHA-256: `c6dd8612d9be1f35832825db8ac11355ca7bca5defed09c734d9e505d4917a2f`; size `8,333` bytes; exactly 14 files.
- Simulation runner SHA-256: `0874a8ca0ba85af9da6d604b3c467360bc0513941b5d1e987f90a2fa9c4896b8`.
- Isolated `npm ci`, npm audit zero, packaged default resolver, schema parity, forbidden-artifact scan and archive entry checks pass.
- Two abandoned partial local staging directories contain no archive and are never execution inputs.

The old `b0ae552...` archive and both prior temporary app/task names remain `REJECTED / NEVER RUN AGAIN`.

## Attempt 3 — missing HANA driver peer dependency

R3 passed the fresh target/readiness/hash/collision checks, no-start/no-route push, exact HDI binding, one persistent stage, exact package/build/droplet ownership and one `set-droplet`. The one authorized task then failed once before simulation because the minimal package contained `@sap/hdi-deploy` but neither supported HANA driver peer dependency. No simulation/make, DDL, DML, seed, CSV or `.hdbtabledata` action began.

Result: `FAILED_BEFORE_HDI_SIMULATION`. The R3 archive is rejected and must not be retried. The smallest remediation is to add one exact supported HANA driver to a fresh package, run isolated install/audit and build one new checksum-bound artifact before another unique-app attempt.

## Corrective artifact R4

R4 follows the repository's existing HANA deployer contract: exact `hdb@2.29.6` plus the explicit `--use-hdb` flag. The reproducible package template is source-controlled; the runtime package lock is freshly generated with scripts disabled.

- Archive SHA-256: `9e56a32153be90592ec8aaad6b34e821ce7abe7b47ba1d0e0aaee7623cbe1360`; size `8,847` bytes; exactly 14 files.
- Package/lock/runner SHA-256: `536780c...c840` / `14a82d...bed1` / `595c9c...7ba0`.
- Lock v3 has 30 entries with exact direct dependencies `@sap/hdi-deploy@5.7.0` and `hdb@2.29.6`; missing integrity, local/git resolution and lifecycle-script flags are zero.
- Isolated install, audit zero, packaged resolver, schema parity, unsafe-path, forbidden-artifact and sensitive-content checks pass.

R4 is the only eligible simulation input. R3 and all older archives remain rejected.

## Attempt 4 — simulation succeeded, migration boundary failed

The exact one-shot R4 task completed `SUCCEEDED` with process exit zero. It scheduled all nine approved deploy files, started the make with nine deploy and zero undeploy inputs, reported zero make warnings, and ended with an explicit successful-simulation marker.

The dependent-artifact trace is not acceptable for real migration: HDI simulated dependent indexes plus an expanded `.hdbtabledata` source and its CSV insert path for the changed onboarding table. These were simulation messages only; no real DDL, DML, seed or table-data operation was applied. Nevertheless, the result violates the approved `no .hdbtabledata / no CSV / no unrelated dependent artifact` acceptance contract.

Verdict:

- live `simulate-make` execution: `PASS`;
- additive real-migration safety: `NO-GO`;
- real HDI make: prohibited until the table-data dependency is removed or a separately reviewed exact data-safe migration strategy proves no business/catalog row mutation.

## R5 additive-schema isolation

The desired invitation profile header now lives in the new request-owned `UserOnboardingDeveloperProfiles` entity instead of two new columns on the existing `UserOnboardingRequests` table. Responsibilities remain request-owned. This preserves the public business contract while removing the old onboarding table and its status-table-data dependency from the migration.

Exact build comparison against deployed-source baseline `71c8a836...`:

- generated HANA artifacts: 227 baseline / 235 candidate;
- added 8, changed 2, removed 0;
- `UserOnboardingRequests.hdbtable` changed: false;
- CSV/`.hdbtabledata` diff: 0;
- changed artifacts are only `DeveloperProfiles.hdbtable` and its BugService view;
- added artifacts are two request-owned Developer tables, two unique indexes and four read-only catalog views.

R5 archive SHA-256 is `1b6ad9dee97cc91512f604a6e3fd1636ad3067ebec79e9c0ed4c6938b16f12e8`; it contains exactly the ten changed/added artifacts plus two HDI metadata files, runner, package and lock. R4 and older inputs remain rejected.

## Attempt 5 — second seeded-table dependency found

The exact R5 task completed `SUCCEEDED`, scheduled ten deploy and zero undeploy files, reported zero make warnings and an explicit successful-simulation marker. The onboarding status seed dependency was eliminated, but HDI still simulated one dependent table-data/CSV expansion for the changed seeded `DeveloperProfiles` table.

No real row or schema mutation occurred. Real migration remains `NO-GO`. R5 is rejected for real make; the remaining safe refactor is to move `administrationVersion` to a new one-to-one administration-state table so every migration artifact is additive and no existing seeded table is altered.

## R6 fully additive isolation

`administrationVersion` now lives in the new one-to-one `DeveloperProfileAdministrationStates` entity. Legacy profiles without a state row read as version zero; their first successful PM update creates the row. The public UI/CAP version contract is unchanged.

Exact generated comparison against baseline `71c8a836...` is now:

- 227 baseline / 238 candidate artifacts;
- 11 added / 0 changed / 0 removed;
- existing table changes: 0;
- CSV/`.hdbtabledata` diff: 0.

R6 archive SHA-256 `4014eec047f1e971fb6c52fb2d02c60ab7992fd696b93c9c8bbbb2dedc9ca6aa` contains exactly those eleven additive artifacts, two HDI metadata files, runner, package and lock. Exact forbidden existing-table entries are zero; secret/table-data scan, isolated install and audit pass. All older simulation archives are rejected.
