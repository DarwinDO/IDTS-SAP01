# UA Developer Responsibilities — Additive HDI Migration Plan

Date: 2026-08-19
Owner: DonHV
Status: `EXACT ADDITIVE PLAN / STANDING DONHV GO / STOP ON DRIFT`

## Boundary

The migration contains exactly eleven artifacts that the successful R6 simulation proved are all new: three request/profile administration tables, three unique indexes, and five read-only views. Generated comparison against deployed-source baseline `71c8a836...` is 11 added, 0 changed, 0 removed, with no CSV or `.hdbtabledata`.

No existing table, seed artifact, CAP app, UI, AppRouter, XSUAA, provider role, user, trust, IAS, IPS or business row may be changed by this gate.

Frozen artifact:

- archive `mta_archives/idts-ua-developer-hdi-migrate-r7.zip`;
- SHA-256 `3f5204f3ae086ef65054f0a750b5e879ef11943571bd8a84088c360683794298`;
- 9,921 bytes and exactly 17 safe entries;
- migration runner SHA-256 `93d04959d0ec8fbd4f684a6c493b888a04bda38ee1d0ed41c9d85a38448c32c1`;
- simulation runner SHA-256 `74ed1347bf77c49db596ea5cef53702508d0567843afa17e9039e57f7abb94da`;
- isolated install/audit, no-install-script lock, exact-entry allowlist and secret/table-data scans PASS.

## Forward

Use a unique no-route/no-start helper app bound only to existing `idts-sap01-db`. Stage and select only its exact owned droplet. Run exactly one task:

```text
node scripts/btp/ua-developer-hdi-migrate-command.js
```

The command uses `@sap/hdi-deploy@5.7.0`, `hdb@2.29.6`, warning-as-error, no auto-undeploy, no VCAP tracing, and the exact eleven-file working/include/deploy allowlist. It does not include `--simulate-make`, `--undeploy`, CSV, `.hdbtabledata` or a broad generated directory.

## Acceptance

- terminal task `SUCCEEDED`, exit zero;
- make reports 11 deployed, 0 undeployed, 0 warnings;
- no CSV/`.hdbtabledata` or unexpected dependent artifact;
- all three new tables exist and each has row count zero;
- no pre-existing table row count is changed;
- temporary app/binding removed;
- main app topology unchanged and `npm run btp:demo:check` remains `DEMO READY`.

## Rollback authority

Before any CAP/UI deployment can write the new tables, a failed postcheck may rollback only the exact eleven new artifacts through an exact separately reviewed undeploy task. Rollback is allowed only when all three new tables have zero rows and ownership is unambiguous. Never delete the HDI service or run a full DB deployer. If row state, ownership or task outcome is ambiguous, preserve state and stop.

The successful R6 simulation is the forward preflight and proves the eleven artifacts were not part of the deployed HDI state. Any source/artifact/hash/topology drift invalidates this plan.
