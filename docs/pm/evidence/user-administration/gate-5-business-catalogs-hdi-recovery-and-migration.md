# Gate 5 Business Catalogs — Logical Recovery and Migration

Date: 2026-08-23
Owner: DonHV
Status: `IN PROGRESS — RECOVERY PREFLIGHT`

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
- Pending R4 build/inspection, live topology freeze, encrypted backup/rehearsal, real make and post-readback.
