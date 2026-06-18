# CAP Draft Note: Direct Assignee Save

Date: 2026-06-18

## Plain-language summary

In a CAP draft-enabled Fiori Elements Object Page, editing a field does not immediately update the active database row. The user edits a draft copy first. The final active row is changed only when the draft is activated, usually through `draftActivate` after Save.

For IDTS assignment, this means the `Assignee` field must be treated as a real assignment path during draft activation, not only during the separate backend action `assignToDeveloper`.

## IDTS implementation rule

- Keep the Object Page `Assignee` field as the single Fiori UI path for assignment/reassignment.
- Do not expose a competing `Assign Developer` action button in Fiori annotations.
- Backend compatibility action `assignToDeveloper` may remain in the OData service for tests or API callers.
- When `assignee_ID` changes:
  - set status to `ASSIGNED` when a developer is selected;
  - set status to `PENDING_ASSIGNMENT` when the developer is cleared;
  - recalculate `nextProcessorUser` and `nextProcessorRole`;
  - record grouped history;
  - send assignment notification to the new developer.

## QA script gotchas

For draft-enabled entities, HTTP `POST /Bugs` creates a draft first. A regression script that needs an active bug should activate that draft before starting an edit/draft-save flow.

Use a unique QA bug per run when testing against persistent `db.sqlite`; otherwise stale draft rows or prior assignment state can produce misleading `DRAFT_ALREADY_EXISTS` / 409 results.

