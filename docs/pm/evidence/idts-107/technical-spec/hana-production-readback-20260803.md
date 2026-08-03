# IDTS-107 SAP HANA production metadata readback

## Scope and safety

- Date: 2026-08-03 (Asia/Bangkok).
- Repository baseline: `a24f00db67340746fd6b96276f4c5a10f36190b0`.
- Cloud Foundry app: `idts-sap01-srv`.
- Read-only task: `idts107-hana-metadata-20260803`, task ID `23`.
- Query scope: HANA `SYS.TABLE_COLUMNS` for the current bound HDI schema.
- Output allowlist: physical table name and column count only.
- No business rows, schema credentials, endpoint, token, prompt, seed, migration or database deployment were read or written.

## Readiness before readback

`npm run btp:demo:check` returned:

| Check | Result |
| --- | --- |
| CAP application | PASS, `1/1` |
| AppRouter | PASS, `1/1` |
| `/health` | HTTP 200 |
| `/ready` / HANA binding | HTTP 200 |
| Protected API without session | HTTP 401, expected |
| Web entry | HTTP 200 |
| Overall | `DEMO READY` |

No recovery command was needed.

## HANA reconciliation result

| Metric | Production build | Live HANA | Result |
| --- | ---: | ---: | --- |
| Physical tables | 48 | 48 | MATCH |
| Column declarations | 578 | 578 | MATCH |

The live task returned `matchesProductionBuild: true`. The readback includes:

- 35 direct database/package tables with 326 columns.
- Nine `BugService.*_drafts` tables.
- `DRAFT.DraftAdministrativeData`.
- `BugService.AssignableDevelopers` and `BugService.DeveloperWorkloads`.
- CAP `cds.outbox.Messages`.

Selected control counts:

| Physical table | Live columns |
| --- | ---: |
| `BUGSERVICE_AISUGGESTIONS_DRAFTS` | 26 |
| `BUGSERVICE_ASSIGNABLEDEVELOPERS` | 13 |
| `BUGSERVICE_BUGS_ATTACHMENTS_DRAFTS` | 19 |
| `BUGSERVICE_BUGS_DRAFTS` | 38 |
| `BUGSERVICE_DEVELOPERWORKLOADS` | 22 |
| `BUGSERVICE_NOTIFICATIONDELIVERIES_DRAFTS` | 20 |
| `CDS_OUTBOX_MESSAGES` | 11 |
| `DRAFT_DRAFTADMINISTRATIVEDATA` | 12 |
| `IDTS_CAP_BUGS_ATTACHMENTS` | 15 |
| `IDTS_CAP_NOTIFICATIONDELIVERIES` | 22 |

The complete 48-table/578-column mapping is in
[`database-dictionary.en.csv`](database-dictionary.en.csv). The generated DDL
and live metadata now agree. DonHV subsequently approved the IDTS-107 Gate 2
candidate at content head `4cca4c0bc575469810c881b1757e6eb3f519437c`.
Official workbook/template/Drive acceptance remains part of IDTS-112.
