# UA-R3C M3B HDI Schema-Only Simulation Evidence

Status: `AMBIGUOUS / NO-GO` for real HDI migration. This evidence does not authorize a real make, status initialization, CAP/UI deployment or broker enablement.

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

The single task used:

- `--simulate-make`;
- `--treat-warnings-as-errors`;
- `--no-auto-undeploy`;
- `--no-trace-vcap-services`;
- `try_fast_table_migration=true`;
- exact identical 13-file `working-set`, `include-filter` and explicit deploy sets.

Sanitized task evidence:

- task-create attempts: `1`;
- HDI binding count for the helper app: `1` during the task;
- files scheduled for deploy: `13`;
- files scheduled for undeploy: `0`;
- HDI connection: reached;
- container lock: reached;
- make log: reached `ok`;
- task process exit: absent after the bounded 20-minute wait;
- final CF task state before containment: `RUNNING`;
- task termination attempts/successes: `1/1`;
- simulation retry attempts: `0`.

The deployer logged skipped deleted files because the positive package intentionally omitted the baseline database tree. Those files were not in the working/deploy set, and the scheduled undeploy count remained zero.

## Cleanup ledger

- temporary app create/stage: `1`;
- temporary HDI bind: `1`;
- first exact app-delete attempt: nonzero; no blind retry;
- readback after the first delete: exact app present, routes `0`, task no longer running, HDI binding `0`;
- second exact app-delete after ownership readback: success;
- final temporary app count: `0`;
- final temporary binding count: `0`.

The HDI service itself, main CAP, main AppRouter, shared XSUAA, HANA business rows, IAS/IPS, trust, Jira and Drive were not targeted by cleanup.

## Verdict

The simulated make plan was correctly narrowed to `13 deploy / 0 undeploy`, but the task process did not produce a successful terminal state. Therefore this gate is `AMBIGUOUS`, not PASS.

Hard stops:

1. Do not run the simulation again blindly.
2. Do not run real HDI make/deploy.
3. Do not initialize the 14 `UserOnboardingStatuses` rows.
4. Diagnose the post-make process hang locally or with a bounded SAP-supported task contract, then obtain a new exact approval.
5. Preserve the separation between schema migration and the 14-row initialization gate.
