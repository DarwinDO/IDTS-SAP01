# IDTS-30 - PostgreSQL Local Proof and Attachment Storage Decision

Status: In Progress / Phase 2 blocked by draft-media issue  
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

## Phase 3 Plan

1. Decide the target:
   - demo-only SQLite remains enough, or
   - PostgreSQL becomes a supported team dev/test profile, or
   - production-style HANA/PostgreSQL portability is required.

2. Decide attachment architecture:
   - keep DB binary with strict upload size limits, or
   - move to metadata in DB + external storage pointer, or
   - defer attachment support in PostgreSQL until a storage adapter is built.

3. If choosing external storage:
   - keep `Attachments` metadata in CDS,
   - remove or stop using `content` as persisted DB binary for production profile,
   - add a storage adapter in `srv/bug-service/`,
   - stream upload/download through CAP service handlers,
   - keep attachment history/audit unchanged.

4. Make QA profile-aware:
   - preserve fast SQLite in-memory tests,
   - add PostgreSQL live HTTP regression,
   - only mark PostgreSQL support complete when draft activate, direct assignee draft save, comments, attachment upload/download, history, and PM monitoring all pass.

5. Update canonical business/architecture docs after the storage decision is approved.

