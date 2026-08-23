# Gate 5 Business Catalogs — Logical Recovery and Migration

Date: 2026-08-24
Owner: DonHV
Status: `LOGICAL RECOVERY PASS / REAL MIGRATION PASS / CAP-UI ROLLOUT NO-GO`

## Approval and boundary

DonHV approved Gate 5R-2 after the warning-free five-artifact live simulation. The authorized chain is:

1. create one encrypted logical backup of the four existing catalog tables;
2. restore the in-memory rows into session-local HANA temporary tables and prove exact count/digest equality;
3. freeze an exact five-artifact schema rollback command;
4. run the real additive five-artifact HDI make only when every recovery check passes;
5. prove the four catalog tables retain exact pre-migration counts/digests and the new audit table is empty.

This is a bounded POC recovery mechanism for `hana-free`; it is not SAP-native backup/recovery and is not a production-suitability claim.

## Frozen source and schema allowlist

- Rollout branch: `chore/wp8-gate5-business-catalog-rollout-donhv`.
- Pre-recovery head: `9bd5fa297fb0ee7d96cb9f8401927d47c0b66934`.
- Prior simulation archive: `19CB2D25210B6200067B61B9F9F5495FEFDC2BC6DD70841BEC583304C79BE9E3`.
- Schema allowlist remains exactly:
  - `src/gen/idts.cap.CatalogAdministrationAuditEvents.hdbtable`;
  - `src/gen/idts.cap.ApplicationComponents.catalogCode.hdbindex`;
  - `src/gen/idts.cap.ComponentCategories.catalogPair.hdbindex`;
  - `src/gen/idts.cap.DefectCategories.catalogCode.hdbindex`;
  - `src/gen/idts.cap.SAPModules.catalogCode.hdbindex`.

No CSV, `.hdbtabledata`, seed, full DB deployer, catalog-row update, CAP deployment or UI deployment is authorized in this chain.

## Recovery design

- Read exactly the existing rows and exact allowlisted columns from `SAPModules`, `ApplicationComponents`, `DefectCategories` and `ComponentCategories` through one existing HDI binding.
- Canonicalize the four datasets in fixed order, with rows ordered by `ID`.
- Encrypt the canonical JSON with AES-256-GCM and wrap the random data key with an ephemeral RSA-3072 public key using RSA-OAEP-SHA256.
- Protect the private key using Windows DPAPI CurrentUser in an ACL-restricted directory outside Git.
- Persist only the encrypted envelope and protected private-key blob outside Git.
- Recreate all four datasets in local temporary column tables in the same HANA session and require exact full-document digest/count equality.
- Local verification decrypts the envelope and independently confirms the total and per-table counts plus digest prefix without emitting row content.

## Exact rollback boundary

The rollback command can undeploy only the same five schema artifacts. It may be executed only when ownership is exact, the four catalog digests still match the encrypted pre-state and `CatalogAdministrationAuditEvents` is empty. It never deletes the HDI service and never performs DML restoration automatically. If catalog data differs, preserve the encrypted backup and stop for a separate exact restore approval.

## Mutation ledger before live recovery

| Mutation | Count |
| --- | ---: |
| Encrypted backup / temporary-table rehearsal task | 0 |
| Real five-artifact HDI make | 0 |
| Exact schema rollback | 0 |
| Catalog/business-row DML | 0 |
| CAP/UI deployment | 0 |
| Main app/XSUAA/provider/user/role/email/Jira/Drive mutation | 0 |

## Execution result

- R3 SHA-256 `BE6E767D8409EC4A050EE39FC3B9E41877B6338F9C4DFC1303B7A3102A4B8C24` passed its original 18-file inspection but is `REJECTED / NEVER RUN`: it did not yet make the audit-table-empty postcondition executable.
- The post-migration inspector now requires `CatalogAdministrationAuditEvents` row count zero and fails closed otherwise.
- Eligible and executed R4 archive: `mta_archives/idts-gate5-business-catalog-hdi-recovery-r4.zip`.
- R4 SHA-256: `B1B22487369434F9670716577667F306E1BE30A45B0B85B309ED50B7E4CD2EA7`.
- R4 size: `17,751` bytes; entries: exactly `18`.
- R4 inspection: exact allowlist, source parity mismatch `0`, unsafe/private/CSV/`.hdbtabledata`/`node_modules` count `0`, Node `22.x`, direct dependencies exact `@sap/hdi-deploy@5.7.0` and `hdb@2.29.6`, npm audit vulnerabilities `0`.

### Fresh preflight

- Target assertion: `PASS` for the reviewed org and `dev` space.
- Final R4 checksum: `PASS`.
- Temporary app collision: `0`.
- Existing `idts-sap01-db`: exact count `1`, managed, last operation succeeded.
- Main CAP: `1/1`, routes `1`, bindings `7`, revisions `7`.
- Main AppRouter: `1/1`, routes `1`, bindings `3`, revisions `11`.
- `npm run btp:demo:check`: `DEMO READY`; CAP/AppRouter `1/1`, liveness/readiness `200`, anonymous protected API `401`, Web `200`.

### Logical backup and restore rehearsal

- One exact no-start/no-route temporary app was pushed, bound only to `idts-sap01-db`, staged once and assigned its one owned staged droplet. It remained stopped and had zero routes.
- RSA-3072 public/private key generation: `PASS`; the private key exists only as a DPAPI CurrentUser blob in an ACL-restricted directory outside Git.
- Live backup task: `SUCCEEDED`.
- Source and temporary-table restore counts: SAP Modules `4`, Application Components `8`, Defect Categories `8`, Component Categories `31`; total `51`.
- Duplicate groups: `0` for all four catalogs.
- HANA session-local restore full digest: exact match.
- Local DPAPI decrypt total, per-table counts and digest prefix: exact match.
- Encrypted envelope and safe metadata were written outside Git; no plaintext row, catalog label, private key, credential, endpoint or full digest was written to repository evidence.

### Real additive make

- One real migration task ran with the exact five-artifact `migrate` command and reached `SUCCEEDED`.
- The command retained warning-as-error, deployer-warning-as-error, `--no-auto-undeploy`, `--no-trace-vcap-services`, exact working/include/deploy sets and no table-data input.
- Task-log classification found all five artifact names, successful deployment markers, five-deployed markers, zero-undeployed markers and no CSV/`.hdbtabledata`.
- Real make attempts/succeeded: `1/1`; schema rollback attempts: `0`.

### Post-migration recovery proof

- A second backup/rehearsal task reached `SUCCEEDED`.
- All four pre/post dataset digest prefixes and the full-document digest prefix matched.
- Counts remained exact `4 / 8 / 8 / 31`; total `51`; duplicate groups remained `0`.
- `CatalogAdministrationAuditEvents` exists and has exactly `0` rows.
- No catalog/business-row DML, seed or `.hdbtabledata` ran.

### Cleanup and final state

- All five temporary tasks were terminal before cleanup.
- Exact HDI unbind attempts/succeeded: `1/1`; relationship readback reached zero without a retry.
- Exact temporary app delete attempts/succeeded: `1/1`; remaining exact/casefold app count `0`.
- Existing HDI service remains exact count `1`, last operation succeeded.
- Main CAP remains `1/1`, routes `1`, bindings `7`, revisions `7`.
- Main AppRouter remains `1/1`, routes `1`, bindings `3`, revisions `11`.
- Final `npm run btp:demo:check`: `DEMO READY` with liveness/readiness `200`, anonymous protected API `401`, Web `200`.

## Final mutation ledger

| Mutation | Attempted / confirmed |
| --- | --- |
| Temporary app push | `1 / 1` |
| Exact HDI bind | `1 / 1` |
| Package stage | `1 / 1` |
| Owned droplet assignment | `1 / 1` |
| Backup/rehearsal tasks | `2 / 2` |
| Aggregate pre/post inspector tasks | `2 / 2` |
| Real five-artifact HDI make task | `1 / 1` |
| Exact HDI unbind | `1 / 1` |
| Exact temporary app delete | `1 / 1` |
| Schema rollback | `0 / 0` |
| Catalog/business-row DML or seed | `0 / 0` |
| CAP/UI deployment | `0 / 0` |
| Main app/XSUAA/provider/user/role/email/Jira/Drive mutation | `0 / 0` |

## Verdict

- Encrypted logical recovery prerequisite: **PASS** for this exact additive POC migration.
- Real five-artifact Gate 5 HDI migration: **PASS**.
- Catalog data preservation: **PASS**.
- Rollback package: frozen but not executed because all postconditions passed.
- Selective CAP/UI deployment and live browser acceptance: **NO-GO under this approval**; they require the next separately frozen rollout gate.
