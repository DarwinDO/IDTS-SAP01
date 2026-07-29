# IDTS-114 SAP BTP deployment verification — 2026-07-30

## Baseline

- Pull request: https://github.com/DarwinDO/IDTS-SAP01/pull/225
- Merge commit: `d12ceef22ce8cae62987430a08fca4f11a5af088`
- Feature commit: `a6642f235316b4778f19477f6f4e610b58f2f4d3`
- SAP BTP applications: `idts-sap01-srv`, `idts-sap01-approuter`

## Build evidence

- MTAR: `idts-sap01-idts114-review-d12ceef.mtar`
- Size: `33,982,575 bytes`
- SHA-256: `1AECBED10B58E782FA2CE618117DEEE6BAD81108B51BFFDD264944162A17B5D9`
- MBT build result: PASS
- Known limitation: dependency installation reported the existing npm audit baseline. No dependency upgrade was mixed into this focused UI/CAP change.

## Selective deployment

- MTA operation ID: `0246e01f-8b80-11f1-abdb-eeee0a953fee`
- Deployment result: PASS
- Updated modules: service runtime and application content only.
- Database deployer: not selected.
- Broad `cds deploy`: not run.
- HANA schema/data migration: not run.

## Post-deployment checks

| Check | Result |
| --- | --- |
| `idts-sap01-srv` | Started, 1/1 instance |
| `idts-sap01-approuter` | Started, 1/1 instance |
| Service health | HTTP 200 |
| Protected OData without authentication | HTTP 401, expected |
| AppRouter without authentication | HTTP 302 to XSUAA, expected |
| Recent service error-log scan | No new matching error entry |
| `commentSummary` in deployed OData metadata | PASS; read-only CF task 79 succeeded |
| Active MTA operation after rollout | None |

## Acceptance truth

- Local CAP/UI5/regression and security gates passed before merge.
- The new transient `commentSummary` contract is present in the deployed service metadata.
- Browser visual, interaction, reload and no-mutation verification is still required after this deployment.
- Tester/Developer role-matrix evidence remains deferred to the member-owned SAP identities.
- This deployment evidence alone does not close IDTS-114 or IDTS-115.

## Security

This evidence contains no API key, password, bearer token, cookie, database URL, private binding credential, raw prompt, raw model response or full private email address.
