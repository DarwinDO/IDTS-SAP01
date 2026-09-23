# IDTS-90 Evidence

## Local verification

- `npm run db:developer-demo:cleanup` — guarded cleanup preflight; no database changed without `--execute`.
- `npm run qa:idts90:developer-demo-data` — seed counts, references, varied data, idempotency, password preservation and CAP read models.
- CAP compile, existing workload/Smart Assign regression, secret scan and repository gates are required before PR.

## Expected totals

| Entity | Before | Added | After |
| --- | ---: | ---: | ---: |
| Users | 4 | 10 | 14 |
| Developer users | 2 | 10 | 12 |
| DeveloperProfiles | 2 | 10 | 12 |
| DeveloperResponsibilities | 8 | 22 | 30 |

## Shared QA rule

The ten synthetic IDTS-90 identities are retired from the canonical seed. Use `node scripts/db/remove-developer-demo-data.js` for a read-only preflight and add `--execute` only after the exact target rows and reference checks have been verified. Do not run broad `cds deploy`.

No database URL, password, token, private email or Render credential may be stored here.

## Shared QA result — 2026-07-23

- PR #165: merged; QA Depth Gate PASS.
- Narrow PostgreSQL transaction: `INSERT 0 10`, `INSERT 0 10`, `INSERT 0 22`, `COMMIT`.
- Final totals: 14 Users, 12 Developer users, 12 DeveloperProfiles and 30 DeveloperResponsibilities.
- Integrity: zero orphan responsibility rows.
- Authenticated PM OData: login PASS; AssignableDevelopers = 12; DeveloperWorkloads = 12.
- The historical availability evidence is retained for traceability; the synthetic identities are no longer seeded or expected in the live User Administration list.
- Runtime deployment was intentionally not triggered. Current Render deploy remains live and unchanged because the service code/contract did not need a new runtime process to read the new database rows.
