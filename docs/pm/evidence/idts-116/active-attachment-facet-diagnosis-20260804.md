# IDTS-116 Active Attachment Facet Diagnosis

## Baseline

- Source baseline: `e0a3796838173e360306a48b2198b35cd7bc12e2`.
- Test record: `BUG-0019` (`19567605-6e37-4524-9b40-e499fd625de9`).
- Scope: read-only diagnosis plus UI metadata correction. No HDI, database deploy, seed load, schema migration or S3 data mutation was used for diagnosis.

## Observed result

Draft upload and parent activation completed. The active Object Page initially showed both controlled attachment rows, but a hard reload later showed an empty attachment facet.

## Persistence and API falsification

The following authenticated, sanitized OData reads returned HTTP 200 with the same two attachment rows:

1. Active Bug navigation to `attachments` with metadata fields.
2. The Fiori-shaped navigation select/expand used by the generated table.
3. Parent Bug read with an `attachments` expansion.

HANA metadata and S3-backed content were therefore still present. Attachment scan state did not filter metadata reads; scan policy applies to binary content access.

## UI request evidence

Sanitized Cloud Foundry access logs showed:

- Active Object Page reload requested the root active Bug and comments.
- That reload did not initiate the active `attachments` navigation request.
- The draft attachment section did initiate its draft `attachments` request.
- Later active attachment requests came from the controlled diagnostic client, not from the generated active-page facet.

## Root cause

The application explicitly declared a `UI.ReferenceFacet` targeting `attachments/@UI.LineItem` and added a manifest table override for the same target.

`@cap-js/attachments` checks whether that target already exists. If it does, the plugin skips generation of its standard facet:

- ID: `attachments_attachments`.
- Target: `attachments/@UI.LineItem`.
- Label: `{i18n>Attachments}`.

The correction removes the competing application facet and table override so the attachment plugin owns the generated facet lifecycle.

## Red/green verification

- RED: focused IDTS-116 test failed while the application-owned facet remained.
- GREEN: compiled BugService metadata exposes exactly one attachment facet with ID `attachments_attachments`.
- `qa:idts116:programmatic`: PASS.
- `qa:idts73:programmatic`: PASS.
- `qa:comments-attachments:programmatic`: PASS.
- CAP compile: PASS.
- UI5 production build: PASS.
- UI5 manifest schema validation: PASS.

## Remaining acceptance

After normal merge and selective UI/app-content deployment, rerun:

1. Open/create a controlled draft Bug.
2. Upload two controlled files.
3. Activate/save the parent Bug.
4. Hard reload the active Object Page.
5. Verify both filenames render in the standard attachment facet.
6. Download and verify SHA-256.
7. Delete through the supported draft flow, save, and verify absence after active reload.

IDTS-116 remains In Progress until this BTP browser acceptance passes.
