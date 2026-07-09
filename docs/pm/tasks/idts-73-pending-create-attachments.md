# IDTS-73 - FE pending attachments during Create Bug

## Summary

Implement create-time attachment selection for the Bug Object Page and hide the Comments section during Create Bug.

Jira: `IDTS-73`

Branch: `feature/idts-73-pending-create-attachments-donhv`

## Scope

- Allow users to select evidence files while creating a new bug.
- Keep selected files in browser memory only while the bug is still a create draft.
- After Save creates the active bug, upload the pending files through the existing CAP draft attachment flow.
- Hide the Comments custom section on create draft pages.
- Do not add a temporary S3 object, temporary backend table, or public temporary upload API.

## Out of scope

- Rich attachment manager.
- Background/resumable upload.
- S3 pre-signed direct browser upload.
- Comment creation before the bug exists.

## Implementation notes

- `BugCollaboration.js` owns the pending browser-file queue and reuses the saved-bug upload sequence.
- `BugCollaborationSection.js` detects create draft context using public SAPUI5 binding context and hides/flushed custom sections without DOM selectors.
- `AttachmentsSection.fragment.xml` enables the uploader on create drafts and shows selected pending file names.
- `CommentsSection.fragment.xml` marks the section as hidden on create drafts.

## Verification

- `npm run qa:idts73:programmatic`
- `npx ui5 build --config ui5.yaml --dest ..\..\temp\ui5-build-idts73` from `app/bug-management-ui`
- `npx cds compile srv --to edmx -s all` pass with existing attachment warning.
- `npm run qa:comments-attachments:programmatic`
- `npm run qa:secret-scan`
- `git diff --check`
- UI5 MCP manifest validation and linter pass.
- Render deploy `dep-d97jml8k1i2s73e8p77g` reached `live` on commit `2f600d4437df3b059878eb61554ff212a6bbd750`.
- Shared QA API smoke passed: auth metadata `200`, wrong password `401`, valid login token returned, anonymous protected OData `401`, authenticated Bugs read OK.
- Shared QA browser smoke passed for create draft: Comments hidden, Evidence/Attachments uploader visible/enabled, selected pending file appears before Save.

## Evidence

- `docs/pm/evidence/idts-73/create-attachment-static-check.json`
- `docs/pm/evidence/idts-73/render-create-page-smoke.json`
- `docs/pm/evidence/idts-73/render-create-page-smoke.png`
- `docs/pm/evidence/idts-73/render-create-page-pending-file-selected.json`
- `docs/pm/evidence/idts-73/render-create-page-pending-file-selected.png`

## Current status

Done. PR #123 merged into `dev`, Render shared QA deployed the merged commit, Jira evidence comment `10445` was added, and Jira `IDTS-73` was transitioned to Done.
