# IDTS-30 - PostgreSQL Local Proof and Attachment Storage Decision

Status: Done / implementation handed off to `IDTS-31`
Owner: DonHV  
Jira: `IDTS-30`  
Last updated: 2026-06-21

## Goal

Run a controlled PostgreSQL proof for IDTS without replacing SQLite as the default local database, then decide how attachment binary storage should evolve before PostgreSQL becomes a supported runtime profile.

## Phase 1 Result - PostgreSQL local proof

Phase 1 passed.

Evidence:

- Docker Desktop was started successfully.
- PostgreSQL 16 container `idts-postgres` was created and accepted connections.
- CAP private profile configuration was supplied through ignored local `.cdsrc-private.json`.
- `cds env requires.db --profile postgres` resolved `@cap-js/postgres`.
- `cds deploy --profile postgres` deployed the CAP model and loaded seed CSV data.
- PostgreSQL check confirmed seeded bugs:

```text
select count(*) as bugs from idts_cap_bugs;
bugs = 4
```

Important implementation note:

- URL-only credentials (`postgres://...`) caused `cds deploy` to fail with `ResourceRequest timed out` and `deployment to undefined:5432`.
- Explicit credentials (`host`, `port`, `database`, `user`, `password`) worked.

## Phase 2 Result - Regression on PostgreSQL

Phase 2 is blocked for draft/media flows.

Passed:

- CAP server started with `--profile postgres`.
- `$metadata` returned HTTP 200.
- OData read for `Bugs` returned data.
- OData read for `DeveloperWorkloads` returned data.
- `addComment` action passed inside the comments/attachments HTTP script before attachment draft activation.

Failed:

- `scripts/qa/test-direct-assignee-draft-save.ps1 -BaseUrl http://localhost:4105/odata/v4/bug`
- `scripts/qa/test-comments-attachments.ps1 -BaseUrl http://localhost:4105/odata/v4/bug -BugId 90000000-0000-0000-0000-000000000001`

Failure:

```text
draftActivate failed. HTTP 500 Internal Server Error
function decode(bytea, unknown) does not exist
```

Root-cause direction:

- The active and draft attachment tables map `content` to PostgreSQL `bytea`.
- CAP draft activation generated SQL that calls `DECODE(..., 'base64')` on `draft.content`.
- PostgreSQL has `decode(text, text)`, not `decode(bytea, text)`.
- The issue appears tied to draft-enabled media handling for `Attachments.content : LargeBinary`, not to IDTS business validation.

## Regression script portability finding

Most programmatic suites are still SQLite/in-memory-specific:

- `scripts/qa/test-idts6-programmatic.js`
- `scripts/qa/test-history-events-programmatic.js`
- `scripts/qa/test-pm-monitoring-programmatic.js`
- `scripts/qa/test-developer-workload-programmatic.js`
- `scripts/qa/test-comments-attachments-programmatic.js`

They use explicit SQLite `:memory:` or SQLite file connections, so they do not prove PostgreSQL runtime compatibility. PostgreSQL verification must use either live HTTP tests or new profile-aware test harnesses.

## Attachment storage recommendation

Do not make PostgreSQL the default runtime yet.

Recommended next direction:

1. Keep SQLite as the default local profile.
2. Keep PostgreSQL as a spike/profile only until draft create/edit/activate and attachment upload/download pass.
3. Treat `Attachments.content : LargeBinary` as acceptable for demo-only small files, but not as the long-term storage design.
4. Prefer metadata-in-DB plus external object/file storage before production-style PostgreSQL/HANA deployment.

Detailed storage analysis is documented in:

- `docs/knowledge/idts-postgresql-attachment-storage.md`

## Phase 3 Decision Result

DonHV approved the long-term direction:

- Keep attachment metadata/reference in CAP persistence.
- Move file bytes to external object storage.
- Prefer the SAP-supported `@cap-js/attachments` plugin over a custom generic storage adapter.
- Preserve SQLite as the local default.
- Do not promote PostgreSQL until attachment draft activation passes with a non-DB storage target.

Compatibility investigation confirmed:

- `@sap/cds 9.9.1`, `@sap/cds-dk 9.9.2`, and `@cap-js/postgres 2.3.0` are already the latest available versions at investigation time.
- `@cap-js/attachments 3.12.2` supports the current CAP runtime and provides Fiori draft support, streaming, validation, and object-store providers.
- Local plugin fallback still stores bytes in the database, so it does not by itself prove the target PostgreSQL architecture.

Implementation is tracked in Jira `IDTS-31` and `docs/pm/tasks/idts-31-object-store-attachments.md`.
