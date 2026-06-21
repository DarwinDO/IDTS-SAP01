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

## 2026-06-21 Acceptance Follow-up

Attempted final target-profile readiness check after the implementation was merged to `dev`.

Result:

- CAP profile `integration` resolves to PostgreSQL.
- `requires.attachments` resolves to the `@cap-js/attachments` standard provider with `objectStore.kind = shared`.
- `.cdsrc-private.json` is present but does not contain integration PostgreSQL credentials or object-store binding.
- `default-env.json` is not present.
- `cf` CLI is not available on this machine.
- Jira `IDTS-31` received blocker comment `10159`.

Decision:

- Do not move `IDTS-31` to Done yet.
- The next required action is environment provisioning/binding, not product-code change.
- After shared PostgreSQL and shared object storage are provided, rerun the HTTP attachment acceptance under profile `integration` and verify that file bytes are not stored in PostgreSQL metadata tables.

## 2026-06-21 MinIO Compatibility Spike

The short MinIO spike used the stock `@cap-js/attachments 3.12.2` S3 adapter without modifying plugin or application code.

Result:

- MinIO started locally and the `idts-attachments` bucket was created.
- CAP deployed successfully to a clean PostgreSQL database and connected with `attachments.kind=s3`.
- Comment creation, history, draft edit, and attachment metadata creation passed.
- Binary upload failed with HTTP 500 and `getaddrinfo ENOTFOUND idts-attachments.localhost`.
- The AWS SDK endpoint override reached MinIO, but the adapter used virtual-hosted bucket addressing. Local MinIO requires path-style addressing or matching wildcard DNS, while the stock plugin does not expose `forcePathStyle`.
- The spike environment, MinIO container, and temporary PostgreSQL database were removed after the failed proof.

Decision:

- Stop the MinIO spike; do not build or maintain a custom storage adapter for IDTS.
- Treat this as provider/environment compatibility, not a product-flow defect.
- Cloudflare R2 is also S3-compatible but requires a custom endpoint, so it must pass a focused compatibility check before being accepted with the stock plugin.
- Prefer a supported SAP Object Store, AWS S3, Azure Blob Storage, or GCP Cloud Storage binding for final acceptance.
- Jira evidence: `IDTS-31#10161`.

## Completion Plan

1. Environment owner selects and provisions one supported external object-store provider. SAP BTP Object Store is preferred when available; native AWS S3, Azure Blob Storage, or GCP Cloud Storage is acceptable without an SAP BTP account.
2. Create a clean shared PostgreSQL database/schema or take an approved backup/export of legacy attachment rows before deployment. Do not bypass CAP's destructive-drop protection.
3. Supply PostgreSQL and object-store credentials only through ignored private CAP configuration or service binding; verify `cds env requires.db --profile integration` and `cds env requires.attachments --profile integration`.
4. Deploy and run the application under profile `integration`; execute attachment upload, draft activation, download, delete/cleanup, MIME/size validation, authorization, and history regression.
5. Query PostgreSQL attachment tables to prove metadata/reference is present while binary content is absent, and verify the corresponding object exists in external storage.
6. Run the existing CAP/UI5/backend regression suites, attach evidence to Jira, update PM/status/risk documents, move IDTS-31 to Done, and regenerate the affected SAP490 test/fix artifacts.
