# WP7 - Notifications and Attachments

Status: Completed
Owner workstream: Backend CAP / Fiori UI5
Last updated: 2026-06-18

## Goal

Support MVP notification records and real attachment upload/download handling without hardcoding external delivery or storage services.

## Inputs

- WP1 `Notifications` and `Attachments` metadata entities.
- WP3 handler events.
- WP4 object page layout.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP7-T01 | Create notification records for important assignment/status events. | Completed |
| WP7-T02 | Create notification records for Rejected bugs that identify the follow-up owner or queue. | Completed |
| WP7-T03 | Display notification records where useful for users or PM. | Completed |
| WP7-T04 | Support attachment metadata display and real upload/download handling. | Completed |
| WP7-T05 | Keep external delivery/storage integration out of MVP unless separately approved. | Deferred |

## Definition of Done

- Important events can create in-app notification records.
- Notification list displays should prefer business-friendly recipient/event/status names over UUID/code values.
- Attachments can be uploaded and downloaded through the MVP flow without committing private storage endpoints or credentials.
- Rejected notifications make the next responsible person or queue clear.
- 2026-06-17 follow-up: attachment create was re-enabled in the UI annotations after the draft conflict fix so upload is visible again on the Object Page.
- 2026-06-17 follow-up 2: `Attachments @UI.LineItem` now includes the `content` stream field itself, aligned with Fiori OData V4 upload-table guidance. CAP compile and EDMX verification passed; browser retest is still required to confirm the earlier `404 ... /content` upload failure is resolved.
- 2026-06-17 follow-up 3: shell QA on a file-based local SQLite database (`db.sqlite`) first proved that comments and attachment metadata survive CAP server restart, then exposed a custom-backend bug where `PUT /Attachments(...,IsActiveEntity=false)/content` did not populate `req.data.content` for the draft child entity. `srv/service.js` now copies the incoming media body into `req.data.content` for `/content` requests, and post-fix verification confirmed that comment rows, attachment metadata, and attachment binary content all survive CAP restart. Jira `IDTS-5` now contains both the bug report and fix evidence.
- 2026-06-17 follow-up 4: fresh browser rerun on `localhost:4012` confirmed that create-draft attachment upload is visible before save, remains visible on the active Object Page immediately after create, and still persists in DB/API after activation.
- 2026-06-17 follow-up 5: the earlier WP7 FE refresh concern is now closed.
- 2026-06-17 follow-up 6: attachment history now also persists correctly in the supported CAP root-draft flow. `srv/service.js` wraps `SAVE` on `Bugs.drafts`, compares active attachments before/after activation, and writes grouped `HistoryLogs` / `HistoryEvents` for newly added attachments. Shell HTTP QA against a clean local CAP server passed comment history plus attachment upload/download/history end to end.
- 2026-06-18 follow-up 7: the attachment/comment evidence is now reflected in the refreshed SAP490 review pack (`Functional Specification` v0.2, `Unit Test` v0.2, `Functional Test` v0.1, `Test and Fix Bug` v0.3, and `Test Report` v0.1) plus `docs/qa/retest-matrix.en.md` / `.vi.md`.
- 2026-06-18 follow-up 8: the former cross-WP4 note about the Assign Developer selected-text issue is now closed by live browser re-verification on `localhost:4004`, so no outstanding mentor-flow polish item remains open from the WP7 dependency view.

Vietnamese:

- Notification cho bug `Rejected` phải giúp Tester hoặc PM biết họ cần follow-up, không chỉ thông báo rằng Developer đã reject.
