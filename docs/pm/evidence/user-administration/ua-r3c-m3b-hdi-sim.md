# UA-R3C M3B HDI Schema-Only Simulation Evidence

Status: `SIMULATION PASS / NO-GO REAL MIGRATION`. The exact schema-only simulation completed successfully. Real migration remains blocked because the live `hana-free` plan has no SAP-supported backup, recovery or snapshot capability.

## Frozen context

- Feature source HEAD before this evidence update: `ee034b134ffa135edc31629c61cca13cd4b0219c`.
- `origin/dev`: `0b694c4284e6a6b838ba3a2511d755bd01265a73`.
- Runtime preflight: `DEMO READY`.
- HDI deployer: exact `@sap/hdi-deploy` `5.7.0`.
- Temporary task app: unique, no route, stopped web instances, and deleted after the bounded run.

## Local schema-only package

- Baseline generated artifacts: `212`.
- Candidate generated artifacts: `226`.
- Delta: `14` added, `0` removed, `1` changed (`idts.cap.Users.hdbtable`).
- Simulation deploy allowlist: exactly `13` schema artifacts: the 12 non-data additions plus the changed `Users` table.
- Required HDI metadata files: `.hdiconfig` and `.hdinamespace`.
- CSV count: `0`.
- `.hdbtabledata` count: `0`.
- Source package files: `15` total (`2` metadata + `13` schema).
- Node engine: exact `22.x`.
- `package.json` SHA-256: `b30a77dbd19857543997b6e36fb16154a469795014e507f1fe67aa56d0e50f58`.
- `package-lock.json` SHA-256: `59c8d65ee137e9d21b247df3dddd57b338584ca94967bc1e9494007ab5f67867`.
- Schema allowlist manifest SHA-256: `2e70f0c14dbe6025532acb0e5ef7d4c68819dd09c9f6691057f3ba1164c90d05`.
- Dependency audit: `0` vulnerabilities.
- Sensitive-content scan: `0` hits.

The first local staging candidate was rejected before platform use because it still contained pre-existing CSV/tabledata outside the working set. It is `REJECTED / NEVER RUN`. Only the positive-allowlist v2 payload was staged.

## Exact simulation boundary

The corrected R3 task used:

- `--exit`;
- `--simulate-make`;
- `--treat-warnings-as-errors`;
- `--treat-deployer-warnings-as-errors`;
- `--no-auto-undeploy`;
- `--no-trace-vcap-services`;
- exact identical 13-file `working-set`, `include-filter` and explicit deploy sets.

Sanitized R3 task evidence:

- task-create attempts: `1`;
- HDI binding count for the helper app: `1` during the task;
- task terminal state: `SUCCEEDED`;
- CLI exit: `0`;
- files scheduled for deploy: `13`;
- effective files deployed: `13`;
- files scheduled for undeploy: `0`;
- effective files undeployed: `0`;
- dependent files redeployed: `8`;
- server warnings: `0`;
- HDI connection: reached;
- container lock: reached;
- make log: `Make succeeded`;
- deployer completion: reached;
- task process exit: present.

The dependent redeploy log named seven direct views of `Users`: `ActiveTesters`, `AiSuggestions`, `Comments`, `HistoryEvents`, `HistoryLogs`, `Notifications`, and `Users`. Local generated-source inspection found exactly those seven direct `Users` dependencies. The HDI server summary counted eight dependency redeploy operations; no unrelated dependency name was observed. The deployer also logged omitted baseline files because the positive package intentionally excluded the baseline database tree. Those files were not in the working/deploy set, and the scheduled undeploy count remained zero.

Two failed precursors are retained as diagnostic evidence and were never blindly retried:

- R1 reached a successful simulated make but lacked `--exit`, so the process idled until the bounded containment action. Root cause is the documented deployer default.
- R2 proved `--exit` by terminating promptly, but failed because `try_fast_table_migration` is not a valid parameter for this HDI server. TDD removed only that unsupported pair before R3.

## Cleanup ledger

- R3 temporary app package restage: `1`;
- R3 task create: `1`;
- first exact app-delete attempt after R3: nonzero; no blind retry;
- readback after the first delete: exact app present, routes `0`, running task count `0`, HDI binding `0`;
- second exact app-delete after target/ownership readback: exit `0`;
- final temporary app count: `0`;
- final temporary binding count: `0`.

The HDI service itself, main CAP, main AppRouter, shared XSUAA, HANA business rows, IAS/IPS, trust, Jira and Drive were not targeted by cleanup.

## Recovery blocker

Read-only CF service inventory identifies the database service plan as exact `hana-free`. SAP HANA Cloud documentation states that free tier has these restrictions:

- backup and recovery are not available;
- storage snapshots are not supported.

Official source: <https://help.sap.com/docs/hana-cloud/sap-hana-cloud-administration-guide/sap-hana-database-license>

This is an exact hard stop from the approved migration plan. A successful simulation does not replace recoverability.

## Verdict

The schema-only simulation is PASS: `13 effective deploy / 0 undeploy / 8 dependent redeploy / 0 warnings`, terminal task `SUCCEEDED`, and runtime cleanup restored `DEMO READY`.

Hard stops:

1. Do not run real HDI make/deploy on `hana-free` without a separately approved and verified logical recovery mechanism or an environment with SAP-supported backup/recovery.
2. Do not initialize the 14 `UserOnboardingStatuses` rows before schema migration PASS.
3. Do not deploy CAP/UI or enable the broker before schema and status initialization PASS.
4. Preserve the separation between schema migration and the 14-row initialization gate.
