# IDTS-31 - Object-Store-Backed Attachments

Status: In Progress / plugin migration verified, shared object-store acceptance pending
Owner: DonHV
Jira: `IDTS-31`
Dependency: `IDTS-30`
Last updated: 2026-06-21

## Goal

Replace the active custom binary-in-database attachment path with the SAP-supported `@cap-js/attachments` plugin while preserving the IDTS bug workflow, authorization, Fiori UX, and audit/history behavior.

## Approved Architecture

- CAP/CDS remains the source of truth for attachment metadata and parent-child relationships.
- File bytes are stored in bound external object storage for PostgreSQL/HANA production-style profiles.
- `@cap-js/attachments` supplies draft-aware upload/download streaming and storage-provider integration.
- SQLite remains the default local development database.
- Local plugin database fallback is allowed only for fast development; it is not acceptance evidence for the target architecture.
- Object-store credentials, endpoints, and private bindings must not be committed.

## Implementation Sequence

### Step 1 - Model and Event Mapping

- Compare plugin attachment fields with the existing custom `Attachments` entity.
- Map current `uploadedBy`, filename, MIME type, size, storage reference, scan status, and timestamps.
- Identify plugin lifecycle events/handlers needed to preserve role checks and attachment history.
- Confirm how the generated Fiori attachment facet replaces or coexists with current annotations.

### Step 2 - Controlled Plugin Integration

- Add `@cap-js/attachments`.
- Replace the active `Bugs.attachments` composition with the plugin aspect.
- Apply the current accepted MIME types and a project-approved file-size limit.
- Remove or isolate custom binary extraction and `db://attachments/...` behavior from the active flow.
- Keep unrelated bug, comment, history, and notification behavior unchanged.

### Step 3 - Storage Configuration

- Configure private/hybrid object-store binding using CAP service bindings.
- Use `kind: standard` unless the deployment environment requires an explicit `s3`, `azure`, or `gcp` provider.
- Document local fallback behavior and productive binding prerequisites.
- Keep malware scanning optional until a service instance and deployment requirement are confirmed.

### Step 4 - History and Authorization

- Preserve Tester, Developer, and PM attachment permissions.
- Record successful attachment create/delete events in `HistoryEvents` and `HistoryLogs`.
- Avoid recording or exposing storage credentials, signed URLs, or private provider details.
- Define cleanup behavior for failed uploads and deleted metadata.

### Step 5 - Migration and Regression

- Define handling for existing rows in the custom attachment table before schema removal.
- Keep fast SQLite tests.
- Add PostgreSQL HTTP regression with a non-DB attachment storage target/test provider.
- Verify create/edit draft, upload, activate, download, delete/cleanup, history, and authorization.

## Acceptance Gate

- CAP model and OData metadata compile.
- Fiori attachment flow works on the draft-enabled Bug Object Page.
- PostgreSQL draft activation no longer executes the legacy custom `LargeBinary` path.
- File bytes are absent from the relational attachment metadata table in the target profile.
- MIME and size limits are enforced.
- History and role restrictions pass.
- No credentials or provider endpoints are committed.

## Open Deployment Input

The implementation can start with plugin/model integration, but final target-profile verification requires one approved object-store environment or a controlled provider test setup. SAP Object Store binding with `kind: standard` is the preferred deployment-neutral option.

## Implementation Result

Completed:

- Installed `@cap-js/attachments 3.12.2`.
- Replaced the custom `idts.cap.Attachments` entity with the plugin-managed `Bugs.attachments` composition.
- Added `fileSize`, 10 MB maximum, and the existing accepted MIME types.
- Removed the legacy `cds.fiori.move_media_data_in_db=true` setting that caused PostgreSQL `decode(bytea, unknown)`.
- Preserved Tester/Developer/PM upload authorization.
- Adapted attachment history to plugin fields `up__ID` and `filename`.
- Updated the HTTP regression to use `BugService.Bugs_attachments`.
- Added profile `integration`, shared PostgreSQL config template, npm commands, and team setup documentation.

Verified:

- SQLite HTTP draft upload/activate/download/history: PASS.
- PostgreSQL clean-database DB-fallback draft upload/activate/download/history: PASS.
- PostgreSQL direct-assignee draft regression: PASS.
- CAP compile and UI5 build: PASS.
- Backend suites: happy flow `30/30`, history `13/13`, PM monitoring `20/20`, workload `36/36`, comments persistence PASS.

Pending:

- Provision or bind the shared object store.
- Run the same HTTP attachment acceptance with `attachments.kind=standard`.
- Confirm binary content is not stored in the PostgreSQL metadata table.
- Decide the backup/export procedure for any legacy attachment rows before deploying to a database that contains the old tables.
