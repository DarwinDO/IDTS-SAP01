# IDTS PostgreSQL Proof and Attachment Storage Notes

Last updated: 2026-06-21

## Summary

IDTS can deploy the current CAP model and seed data to local PostgreSQL with `@cap-js/postgres`, but the current draft-enabled attachment design is not ready to treat PostgreSQL as a supported runtime profile.

The blocker found during the first PostgreSQL proof is tied to draft activation with media content:

```text
function decode(bytea, unknown) does not exist
```

The generated SQL tries to run `DECODE(..., 'base64')` on an attachment `content` value that PostgreSQL already treats as `bytea`. This happens during `draftActivate` for `BugService.Bugs`, because `Bugs` owns `attachments` and `Attachments.content` is a media `LargeBinary`.

## What was proven

- Docker PostgreSQL 16 starts and accepts connections.
- CAP `cds env requires.db --profile postgres` resolves to `@cap-js/postgres` when `.cdsrc-private.json` supplies explicit `host`, `port`, `database`, `user`, and `password`.
- CAP `cds deploy --profile postgres` deploys the model and loads CSV seed data.
- CAP server starts on PostgreSQL and exposes `$metadata`.
- Read-only OData reads work for `Bugs` and `DeveloperWorkloads`.
- Bound action `addComment` works against PostgreSQL in the HTTP comments/attachments script before the attachment draft activation step.

## What failed

Two HTTP regression flows failed on PostgreSQL:

- `scripts/qa/test-direct-assignee-draft-save.ps1`
- `scripts/qa/test-comments-attachments.ps1`

Both failed during `BugService.draftActivate` with:

```text
function decode(bytea, unknown) does not exist
```

The server log showed generated SQL similar to:

```sql
UPDATE idts_cap_Attachments AS active
SET content = DECODE((SELECT ... draft.content ...), 'base64')
...
```

PostgreSQL `decode(text, text)` expects text input, but the draft attachment content column is already `bytea`. That makes this a portability issue around CAP draft/media handling, not a business-rule bug.

## Why `Attachments.content : LargeBinary` can make PostgreSQL grow quickly

`Attachments.content` stores the actual file bytes inside the relational database. In PostgreSQL this maps to binary storage (`bytea` in the current generated tables).

This is simple for MVP, but it has scaling costs:

- Every uploaded screenshot, PDF, ZIP, or evidence file increases database size.
- Backups include the binary payload, so backup/restore time grows with attachments.
- Draft-enabled flows can temporarily duplicate content between draft and active tables.
- Query/table maintenance such as vacuum, storage bloat, and backup retention becomes more expensive.
- Application-level streams avoid loading large binaries by default, but the database still stores all bytes.

The PostgreSQL proof showed this early: after a tiny 42-byte draft attachment upload, PostgreSQL already had separate active/draft attachment tables and the draft table stored the binary payload. With real screenshots or PDFs, this effect becomes much larger.

## Options

| Option | Description | Pros | Cons | Fit for IDTS |
| --- | --- | --- | --- | --- |
| Keep binary in DB | Keep `Attachments.content : LargeBinary` and store file bytes in PostgreSQL. | Simplest CAP/OData model; one backup contains metadata and content; good for small demo/MVP files. | DB grows with files; draft activation currently fails on PostgreSQL; backups/restores slow down; not ideal for large or many files. | Acceptable only for SQLite/demo and possibly HANA/PostgreSQL after the draft/media blocker is solved and upload size limits are strict. |
| Metadata in DB + object/file storage | Store `fileName`, `mediaType`, `fileSize`, `storageRef` in DB; store bytes outside DB in local filesystem, S3-compatible storage, SAP Object Store, or later BTP storage. | Keeps DB small; better backup strategy; can scan/version/expire files separately; aligns with production storage patterns. | More implementation work; needs secure storage, signed access or controlled streaming; must handle delete/cleanup consistency. | Best long-term direction if attachments matter beyond small demo files. |
| PostgreSQL large object style | Use PostgreSQL-specific large object storage and keep an object ID/reference in DB. | Better for large binaries inside PostgreSQL ecosystem; avoids huge row values. | PostgreSQL-specific; less portable to HANA; CAP does not model this as cleanly as normal CDS `LargeBinary`; adds raw DB coupling. | Not recommended for IDTS while portability to HANA/PostgreSQL remains a goal. |
| Hybrid threshold | Store small files in DB, large files externally based on size limit. | Simple small-file path; prevents very large DB growth. | Two storage paths to test; more edge cases; migration complexity. | Viable later, but more complex than IDTS needs right now. |

## Recommendation

For the current IDTS MVP:

1. Keep SQLite as the default local development DB.
2. Do not promote PostgreSQL as a supported runtime profile until the draft/media activation blocker is resolved.
3. Keep `Attachments.content : LargeBinary` for the current demo only if the team accepts small test files and SQLite-focused evidence.
4. For PostgreSQL/HANA production-style readiness, prefer moving toward metadata-in-DB plus external object/file storage.

## Phase 3 plan

Phase 3 should be a decision and implementation-planning phase, not an immediate migration.

1. Confirm target deployment posture:
   - Demo-only local development.
   - PostgreSQL as team dev/test profile.
   - HANA/PostgreSQL production-style portability.

2. Decide attachment storage:
   - Keep DB binary temporarily with file-size limits.
   - Move to metadata + external storage.
   - Defer external storage and mark PostgreSQL as blocked for attachment draft flows.

3. Create a focused technical spike if external storage is selected:
   - Add a storage adapter boundary in `srv/bug-service/`.
   - Keep `Attachments` metadata in CAP CDS.
   - Store only `storageRef`, `fileName`, `mediaType`, and `fileSize` in DB.
   - Stream upload/download through CAP handlers.
   - Preserve history/audit for attachment upload.

4. Add PostgreSQL-aware regression:
   - Keep SQLite in-memory tests for fast local development.
   - Add HTTP-based profile tests for PostgreSQL.
   - Avoid claiming PostgreSQL support unless draft create/edit/activate and attachment upload/download pass.

5. Update canonical docs only after the storage decision changes business/architecture meaning.

## Commands used in the proof

```powershell
docker run --name idts-postgres `
  -e POSTGRES_USER=idts `
  -e POSTGRES_PASSWORD=idts_dev `
  -e POSTGRES_DB=idts `
  -p 5432:5432 `
  -d postgres:16

node .\node_modules\@sap\cds-dk\bin\cds.js env requires.db --profile postgres
node .\node_modules\@sap\cds-dk\bin\cds.js deploy --profile postgres
node .\node_modules\@sap\cds-dk\bin\cds.js serve all --profile postgres --port 4105
powershell -ExecutionPolicy Bypass -File scripts/qa/test-direct-assignee-draft-save.ps1 -BaseUrl http://localhost:4105/odata/v4/bug
powershell -ExecutionPolicy Bypass -File scripts/qa/test-comments-attachments.ps1 -BaseUrl http://localhost:4105/odata/v4/bug -BugId 90000000-0000-0000-0000-000000000001
```

