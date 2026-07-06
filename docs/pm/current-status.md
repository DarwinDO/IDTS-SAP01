# Current Project Status

Last updated: 2026-07-06

## Snapshot

| Field | Current value |
| --- | --- |
| Project phase | Sprint 02 baseline is stable in `dev`; Sprint 03 integration is preparing a shared Render QA environment after the merged auth, login UI, SMTP/outbox, and QA-depth-gate slices |
| Product baseline | BA documentation completed; CAP data model foundation now implemented beyond the initial scaffold |
| Current sprint | Sprint 03 custom authentication, login UI, SMTP/outbox, and QA Depth Gate are merged; `IDTS-44` is preparing Render deployment config/docs so the team can test on one shared QA URL |
| Recommended next action | Finish and merge `IDTS-44`, then DonHV creates the Render Blueprint, enters secrets in Dashboard, deploys PostgreSQL schema, sets QA passwords, and runs shared endpoint verification. |
| Main implementation risk | Shared QA deploy depends on private Render/Brevo/AWS/PostgreSQL environment variables staying out of repo/Jira/logs and on the first PostgreSQL schema/password setup being run in the right environment. |

## What Is Already Done

- Business baseline exists in the three IDTS markdown files and `docs/project-context.md`.
- BA pack exists under `docs/ba/`.
- Core domain terms are clarified: SAP Module, Application Component, Defect Category, Component Category, Developer Responsibility, assignee, and nextProcessor.
- Status lifecycle includes `Retest Required`.
- Assignment and nextProcessor behavior are documented at business level.
- PM execution docs are created under `docs/pm/`.
- Product Discovery workflow is available under `.agents/skills/product-discovery` and `docs/ba/discovery/`.
- BRD v1.2 markdown and DOCX deliverables are maintained under `docs/ba/brd/`.
- SRS v1.1 markdown and DOCX deliverables are maintained under `docs/ba/srs/`.
- FRS v1.2 markdown and DOCX deliverables are maintained under `docs/ba/frs/`.
- FRS v1.1 fixed Mermaid syntax in the rejected follow-up sequence and added the missing workflow diagrams for create/assign, developer review, request information, retest/closure, and PM monitoring.
- BRD v1.2, SRS v1.1, and FRS v1.2 update the MVP role baseline to three active roles: Tester, Developer, and PM. Reporter and Admin are deferred as separate roles.
- BRD/SRS/FRS DOCX files were regenerated from the updated Markdown sources and smoke-tested through LibreOffice conversion in a temporary folder.
- IDTS BA/DOCX deliverable routing is available under `.agents/skills/idts-ba-docx-deliverables`, with external document skills installed as secondary references.
- The local Markdown-to-DOCX fallback helper now keeps Markdown tables as real editable Word tables for formal BA deliverables.
- FRS Mermaid diagrams were rendered successfully through Mermaid CLI, and SRS/FRS DOCX files were smoke-tested by opening/converting through LibreOffice in a temporary folder.
- SAP490 Google Workspace sync workflow is documented in `docs/sap490/sync-workflow.en.md` and `docs/sap490/sync-workflow.vi.md`; `@googleworkspace/cli` is installed as a dev dependency, safe check/dry-run scripts are available, and OAuth authentication has been verified on the current machine. Other developers still need to run their own local `gws` authentication before sync work.
- Safe `gws` review upload script is available for BRD/SRS/FRS DOCX files. The script creates new timestamped review copies and does not overwrite existing Drive files.
- Safe `gws` Google Sheets review script is available. It creates a new timestamped workbook with Requirement Backlog, Traceability Matrix, Business Rule Matrix, Risk Decision Log, and Open Questions tabs.
- PM status tracking now uses member-owned files: `status/donhv.md`, `status/sangvn.md`, `status/datdt.md`, and `status/nhant.md`.
- SAP490 template inventory is documented in `docs/sap490/template-inventory.en.md` and `docs/sap490/template-inventory.vi.md`.
- SAP490 Blueprint draft v0.1 is available as two template-filled DOCX files copied from the school Blueprint template: `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.1.docx` and `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.1.docx`.
- SAP490 review workbooks were refreshed on 2026-06-18 as separate English and Vietnamese copies from the school templates: `Functional_Specification_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Test_Scenario_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Unit_Test_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Functional_Test_IDTS_SAP01_{en,vi}_v0.1.xlsx`, `Test_And_Fix_Bug_IDTS_SAP01_{en,vi}_v0.3.xlsx`, and `Test_Report_IDTS_SAP01_{en,vi}_v0.1.xlsx`.
- The refreshed SAP490 pack now reflects the current Sprint 02 create/assignment/lifecycle/audit baseline, the `30 PASS / 0 FAIL` backend retest suite, the HTTP attachment/comment verification pass, and the currently known browser/UI polish gaps.
- A new retest planning source exists under `docs/qa/retest-matrix.en.md` and `docs/qa/retest-matrix.vi.md`. It is now the primary test-planning reference for Sprint 02 instead of the older `21/21` checklist.
- A real browser QA pass on `localhost:4004` has now validated the create path, real draft attachment retention after save, Add Comment flow, role-based action visibility, developer lifecycle entry path, and immediate Object Page refresh after lifecycle submit once the final side-effect annotation fix was applied. A focused follow-up browser probe also no longer reproduces the earlier `componentCategory_ID` drill-down warning during create.
- A dedicated mentor demo script for the happy-flow walkthrough now exists at `docs/pm/tasks/wp4-mentor-demo-script.md`, aligned with the verified Sprint 02 flow.
- Optional Learning Recap / Mentor Mode is available through `.agents/skills/learning-recap` and AGENTS.md routing for nontrivial tasks.
- SRS/FRS embedded Mermaid diagrams were extracted into `docs/diagrams/07-srs-system-context.md` and `docs/diagrams/08-frs-functional-workflows.md`.
- Database modeling support is available through `.agents/skills/idts-database-modeling` and installed `database-schema-design`; the current model review is documented in `docs/ba/09-database-model-review.md`.
- WP1 database modeling decisions DB-Q01 to DB-Q08 are baselined in `docs/ba/09-database-model-review.md` and synced to the canonical IDTS docs.
- WP1 Data Model Foundation is implemented in `db/schema.cds`, `srv/service.cds`, and `db/data/`; CAP compile and SQLite in-memory deploy both pass.
- WP2 Service and Value Help is implemented for Sprint 1 MVP: bound bug lifecycle actions and Fiori value help annotations are exposed in OData V4 metadata.
- WP3 Handler Rules and Validation is implemented for Sprint 1 MVP: create/update validation, assignment responsibility checks, status transition validation, nextProcessor automation, history logs, and notification records are handled in `srv/service.js`.
- DatDT's `Sap_FE` reference repo was reviewed and useful List Report/Object Page ideas were integrated into the existing CAP/Fiori app.
- WP4 Fiori Elements core screens are updated: list filters/table columns, object page sections, value helps, object page actions, semantic criticality, rejected follow-up fields, and child sections for comments, attachments, history, and notifications.
- Comment creation and attachment upload/download persistence are implemented for the MVP flow on local file-based SQLite. Shell verification proved that comment rows, attachment metadata, and attachment binary content survive CAP restart, and fresh browser retest proved the attachment row is persisted in DB/API after create-draft activation.
- Four IDTS-aligned demo bug records were added under `db/data/idts.cap-Bugs.csv`, and browser smoke verification shows the List Report rendering 4 rows after pressing `Go`.
- Mentor feedback for Sprint 02 is baselined: developers may view/discuss team-visible bugs, primary lifecycle actions remain controlled, developer notes are optional by default, selected transitions require note/reason, and Bug Detail UI should prioritize assignee/status and key input fields.
- Sprint 02 plan is documented in `docs/pm/07-sprint-2-plan.md`. Jira issues `IDTS-1` to `IDTS-12` are assigned: DonHV owns Backend CAP lead/bug fixing, NhanT owns validation/QA/demo smoke testing, DatDT owns core Bug Detail layout/input usability, and SangVN owns status value help plus supporting field/comment usability.
- Sprint 02 backend implementation has started. Jira `IDTS-2`, `IDTS-4`, and `IDTS-5` are Done; future backend QA defects should use a new Sprint 3 bug-fix issue instead of reopening the Sprint 02 bucket.
- `srv/service.js` now keeps developer view/discussion open while enforcing processing actions for assigned Developer, Tester, or PM when request user is known.
- Bound action side effects now log `nextProcessorUser` and `nextProcessorRole` changes and create in-app notification records for resolved, retest-required, and reopened follow-up.
- `Need More Information` now has an explicit recovery action: Tester or PM uses `Resubmit to Developer` with an update summary, the bug returns to `Assigned`, `nextProcessor` goes back to the assigned Developer, and the system writes history/comment/notification side effects.
- History now has a two-layer read model: `HistoryEvents` provides readable Object Page history summaries, while `HistoryLogs` keeps the raw append-only field audit; child tables also have flattened display-name fields to avoid UUID-heavy UI output.
- Current MVP create flow now explicitly persists `Assigned` or `Pending Assignment` on submit; `New` is retained only for legacy/import compatibility and controlled transition handling, and the canonical IDTS docs/diagrams were aligned to that rule.
- Backend audit coverage now includes generic content edits such as `title` and `description`, and the repeatable direct-service suite was expanded to 30 PASS / 0 FAIL.
- Real draft attachment upload now writes attachment history correctly through the root draft-save flow. Shell HTTP QA against a clean local CAP server verified comment history, attachment upload/download, and attachment history end to end.
- A repeatable SAP490 generator script now exists at `scripts/sap490/generate-retest-aligned-artifacts.py`, exposed through `npm run sap490:generate:retest-pack`, so the review workbooks can be regenerated from one source after future retest cycles.
- DatDT's `IDTS-29` annotation refactor was reviewed and integrated selectively: the 1,365-line `annotations.cds` is now an import hub for eight feature-scoped annotation files. The compiled normalized CSN is identical to the pre-split baseline, generated `gen/srv` build output was excluded, `gen/` is now ignored, fresh UI5/browser/backend verification passed, Jira `IDTS-29` is Done, and late-created GitHub PR #4 was closed as superseded by the reviewed integration.
- The `IDTS-5` backend hardening stream has now been merged into `dev`. Remaining remote branches outside `origin/dev` are `origin/Feat/fe-Fix_UI_datdt`, `origin/Remake_UI`, and `origin/feature/idts-create-flow-option-c-donhv`; they are currently treated as stale UI/prototype branches and should be re-reviewed before any merge or deletion.
- Jira/GitHub audit on 2026-06-15 found six completed Jira tasks: `IDTS-2`, `IDTS-3`, `IDTS-4`, `IDTS-6`, `IDTS-7`, and `IDTS-9`.
- GitHub PR #1 (`IDTS-3`/`IDTS-6`) and PR #2 (`IDTS-8`/`IDTS-10`/`IDTS-11`) were integrated into `dev` together with DonHV's backend and SAP490 documentation branches.
- DatDT's `Remake_UI` branch was reviewed selectively. Accepted items are Assignment-first Object Page ordering, read-only History table capabilities, and create flow evaluation; rejected items are relaxed required fields, removed `nextProcessorRole`, removed lifecycle actions, and removed supporting info.
- Configured development-only local mock authentication users (`DonHV`, `SangVN`, `DatDT`, `NhanT`) in `package.json` and optimized backend capability calculations from O(N) queries to O(1) query to resolve the N+1 performance issue.
- `BugService` now requires `authenticated-user`, so anonymous access is blocked while local mock users still work for role-based QA.
- Created the Sprint 02 Walkthrough & Demo Script inside the repository at `docs/pm/tasks/wp4-walkthrough.md`.
- Fresh browser rerun on `localhost:4004` now confirms the workflow path HF-01 to HF-11 at product level: create page open, dependent category filtering, real attachment retention after save, readable comment author, correct tester/developer/PM action separation, and active Object Page attachment visibility.
- A follow-up Fiori annotation refinement now exposes a local `Add Comment` CTA inside the Comments section itself, and a fresh browser verification on `localhost:4018` confirmed that the section-level action is visible and opens the `Add Comment` dialog successfully.
- A follow-up annotation-only candidate fix was added for the Assign Developer selected-text issue: `service.AssignableDevelopers.developerProfileID` now carries `@Common.Text : developerName` with `#TextOnly`, and a focused live browser re-verification on `localhost:4004` confirmed the dialog now renders the selected developer name (`DatDT`) instead of the UUID, so `IDTS-9` is now treated as closed at PM/QA handover level.
- The separate `Assign Developer` Object Page buttons have now been removed from the Fiori UI. Assignment/reassignment uses the editable `Assignee` field and its filtered value help as the single UI path; the backend `assignToDeveloper` action remains available for API/test compatibility. HTTP draft regression now verifies `draftEdit -> PATCH assignee_ID -> draftActivate` persists the assignee, sets status to `Assigned`, recalculates `nextProcessor`, writes grouped history, and creates developer notification records.
- WP6 backend support now exposes filterable monitoring fields on `BugService.Bugs` (`isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`), adds `nextProcessorUser` filter support for PM monitoring, and keeps `currentActionOwnerDisplayName` readable even on sparse READ selections. Fresh programmatic verification passed `20 PASS / 0 FAIL` on the new PM monitoring suite while the existing backend suite stayed `30 PASS / 0 FAIL`.
- WP6 backend now also exposes a read-only `BugService.DeveloperWorkloads` aggregate for PM monitoring. The new service contract is assignee-based, keeps active zero-load developers visible, retains inactive developers only while they still own open bugs, and passed fresh programmatic verification with `36 PASS / 0 FAIL`.
- `HistoryEvents` now also exposes read-only grouped timeline support for Sprint 3 (`groupedChangeContext`, `changeCount`) while `HistoryLogs` remains the raw field-level audit detail source. Fresh programmatic verification passed `13 PASS / 0 FAIL` across assign, resubmit, reject, pending-assignment, close, and generic edit scenarios.
- IDTS-28 service refactor is merged into `dev` through GitHub PR #5 at merge commit `9129ae8bb3fb22502260b3a435ad5df14fdf8108`. Local verification passed syntax checks, CAP compile, UI5 build, backend happy-flow, history-events, PM monitoring, developer workload, comments/attachments, and `git diff --check`. Jira `IDTS-28` remains In Progress only until IDTS-23 and IDTS-24 retest closure evidence is attached.
- IDTS-31 is Done. The implementation uses `@cap-js/attachments`, removes the legacy `move_media_data_in_db` path, preserves 10 MB/MIME/role/history rules, and passes SQLite, PostgreSQL DB-fallback, and native AWS S3 acceptance. The final proof confirmed PostgreSQL stores metadata/reference with `content = NULL`, AWS S3 stores the binary object, and deletion cleans both stores. Jira evidence is recorded in comment `10162`.
- Source-code knowledge mirrors now exist for every tracked file under `app/`, `srv/`, and `db`. Future changes in those folders must update the matching note under `docs/knowledge/app/`, `docs/knowledge/srv/`, or `docs/knowledge/db/`, including explicit cross-folder links.
- Sprint 3 integration update on 2026-06-28: PR #18 (`IDTS-19` grouped history timeline), PR #20 (`IDTS-13` Object Page side-effect refresh), and PR #24 (`IDTS-24` browser UAT evidence script) were reviewed, fixed where needed, merged into `dev`, and moved to Done in Jira. As of the 2026-06-29 Jira live check, `IDTS-33` is Done; remaining manual workflow/history follow-up is `IDTS-32` plus PM/SAP490 consolidation under `IDTS-27`.
- Jira live-state sync on 2026-06-29 originally confirmed: `IDTS-33` is Done; `IDTS-1` is still To Do; `IDTS-25`, `IDTS-27`, and `IDTS-28` are still In Progress; `IDTS-36` is To Do. Later on 2026-06-29, `IDTS-34` was implemented, merged into `dev` through PR #28, and moved out of the active queue.
- IDTS-36 is merged into `dev` through GitHub PR #29 at merge commit `5356a7ffc962ca0545218f9c920503c28492f98b` and is Done in Jira. The implementation uses Nodemailer plus `NotificationDeliveries` outbox tracking, with SMTP credentials kept in private config. Private Brevo SMTP smoke verification passed on 2026-06-30 without printing credentials, recipient data, or provider message-id.
- IDTS-42 is merged into `dev` through GitHub PR #38. The repository now has a mandatory QA Depth Gate baseline: PR evidence template, `qa-depth-gate` workflow, PR-body validator, reusable browser harness, secret scan, and documented falsification-first QA rules. GitHub branch protection for `dev` now requires the `qa-depth-gate` status check.
- IDTS-56 Smart Assign developer UI is implemented on the Bug Object Page. The dialog uses SAPUI5/Fiori controls, supports search by developer/module/capability, shows availability states including Busy warnings, keeps CAP backend validation as the final enforcement layer, and has programmatic plus browser QA evidence under `docs/pm/evidence/idts-56/`.
- IDTS-34 is merged into `dev` through GitHub PR #28 at merge commit `52432e35c66a3c0137ed5b7c96c9f57d93409fc5`. Backend custom login now exposes `AuthService.login/logout/me`, stores only password hashes, creates server-side `AuthSessions`, maps Bearer tokens to `cds.User`, keeps `BugService` protected, and passes focused auth verification (`23 PASS / 0 FAIL`) plus CAP compile on `dev`.
- QA/testing skill support for IDTS-36/IDTS-38 is now installed and routed: `backend-testing`, `api-testing-patterns`, `integration-testing`, `qa-report`, and `qa-test-plan` exist under repo-local `.agents/skills/` and external backup `C:\Users\LapHub\.agents\skills\`. `backend-testing`, `api-testing-patterns`, and `integration-testing` are the primary implementation-test support skills; `qa-report` and `qa-test-plan` are secondary planning/reporting helpers.

Vietnamese:

- IDTS-42 da merge vao `dev` qua GitHub PR #38. Repo hien co baseline QA Depth Gate bat buoc: PR evidence template, workflow `qa-depth-gate`, validator PR body, browser harness dung lai, secret scan va rule QA falsification-first. GitHub branch protection cua `dev` hien da yeu cau status check `qa-depth-gate`.

- Source-code knowledge mirror đã có cho mọi file đang được Git track trong `app/`, `srv/`, và `db`. Sau này khi sửa các folder này, thành viên phải cập nhật note tương ứng trong `docs/knowledge/app/`, `docs/knowledge/srv/`, hoặc `docs/knowledge/db/`, bao gồm liên kết chéo giữa các folder.
- Sprint 3 integration update ngày 2026-06-28: PR #18 (`IDTS-19` grouped history timeline), PR #20 (`IDTS-13` Object Page side-effect refresh), và PR #24 (`IDTS-24` browser UAT evidence script) đã được review, fix khi cần, merge vào `dev`, và chuyển Done trên Jira. Manual UAT follow-up còn lại được tách giữa `IDTS-32` của SangVN và `IDTS-33` của DatDT.
- WP1 Data Model Foundation Ä‘Ã£ Ä‘Æ°á»£c implement trong `db/schema.cds`, `srv/service.cds` vÃ  `db/data/`; CAP compile vÃ  SQLite in-memory deploy Ä‘á»u pass.
- WP2 Service vÃ  Value Help Ä‘Ã£ hoÃ n thÃ nh á»Ÿ má»©c Sprint 1 MVP: OData V4 metadata cÃ³ bound lifecycle actions vÃ  Fiori value help annotations.
- WP3 Handler Rules vÃ  Validation Ä‘Ã£ hoÃ n thÃ nh á»Ÿ má»©c Sprint 1 MVP: `srv/service.js` xá»­ lÃ½ create/update validation, assignment responsibility checks, status transition validation, nextProcessor automation, history logs vÃ  notification records.
- WP4 core Fiori screens Ä‘Ã£ cáº­p nháº­t: List Report, Object Page, Create metadata, Assignment value help/actions, Developer Review actions, Rejected follow-up, History vÃ  Notifications sections.
- Viá»‡c táº¡o comment vÃ  upload/download attachment Ä‘Ã£ cháº¡y Ä‘Æ°á»£c trÃªn SQLite file local cho MVP. Shell verification Ä‘Ã£ xÃ¡c nháº­n comment, metadata attachment, vÃ  binary content cá»§a attachment váº«n cÃ²n sau khi restart CAP.
- Feedback mentor cho Sprint 02 Ä‘Ã£ Ä‘Æ°á»£c baseline: developer cÃ³ thá»ƒ xem/tháº£o luáº­n bug trong team, lifecycle action chÃ­nh váº«n kiá»ƒm soÃ¡t, developer note máº·c Ä‘á»‹nh optional, má»™t sá»‘ transition báº¯t buá»™c note/reason, vÃ  Bug Detail UI cáº§n Æ°u tiÃªn assignee/status cÃ¹ng cÃ¡c field nháº­p quan trá»ng.
- Sprint 02 plan Ä‘Æ°á»£c ghi táº¡i `docs/pm/07-sprint-2-plan.md`. Jira issues `IDTS-1` Ä‘áº¿n `IDTS-12` Ä‘Ã£ Ä‘Æ°á»£c assign: DonHV phá»¥ trÃ¡ch Backend CAP lead/bug fixing, NhanT phá»¥ trÃ¡ch validation/QA/demo smoke test, DatDT phá»¥ trÃ¡ch core Bug Detail layout/input usability, vÃ  SangVN phá»¥ trÃ¡ch status value help cÃ¹ng supporting field/comment usability.
- Sprint 02 backend implementation Ä‘Ã£ báº¯t Ä‘áº§u. Jira `IDTS-2`, `IDTS-4`, vÃ  `IDTS-5` Ä‘Ã£ Done; bug backend má»›i nÃªn Ä‘Æ°á»£c theo dÃµi báº±ng issue Sprint 3 riÃªng.
- `srv/service.js` hiá»‡n váº«n cho developer xem/tháº£o luáº­n bug trong team, nhÆ°ng kiá»ƒm soÃ¡t action xá»­ lÃ½ workflow cho Developer Ä‘Æ°á»£c assign, Tester hoáº·c PM khi xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c request user.
- Side effect cá»§a bound action hiá»‡n ghi log thay Ä‘á»•i `nextProcessorUser` vÃ  `nextProcessorRole`, Ä‘á»“ng thá»i táº¡o notification record cho follow-up cá»§a resolved, retest-required vÃ  reopened.
- Audit Jira/GitHub ngÃ y 2026-06-15 ghi nháº­n sÃ¡u Jira task Ä‘Ã£ hoÃ n thÃ nh: `IDTS-2`, `IDTS-3`, `IDTS-4`, `IDTS-6`, `IDTS-7`, vÃ  `IDTS-9`.
- GitHub PR #1 (`IDTS-3`/`IDTS-6`) vÃ  PR #2 (`IDTS-8`/`IDTS-10`/`IDTS-11`) Ä‘Ã£ Ä‘Æ°á»£c tÃ­ch há»£p vÃ o `dev` cÃ¹ng hai branch backend vÃ  SAP490 documentation cá»§a DonHV.
- Branch `Remake_UI` cá»§a DatDT Ä‘Ã£ Ä‘Æ°á»£c review chá»n lá»c. CÃ¡c pháº§n Ä‘Æ°á»£c nháº­n lÃ  Ä‘Æ°a Assignment lÃªn Ä‘áº§u Object Page, Ä‘áº·t báº£ng History read-only, vÃ  Ä‘Ã¡nh giÃ¡ láº¡i create flow; cÃ¡c pháº§n khÃ´ng nháº­n lÃ  giáº£m required fields, xÃ³a `nextProcessorRole`, xÃ³a lifecycle actions, vÃ  xÃ³a supporting info.

- Tráº¡ng thÃ¡i PM hiá»‡n dÃ¹ng file theo tá»«ng thÃ nh viÃªn: `status/donhv.md`, `status/sangvn.md`, `status/datdt.md`, vÃ  `status/nhant.md`.
- Inventory template SAP490 Ä‘Ã£ Ä‘Æ°á»£c ghi táº¡i `docs/sap490/template-inventory.en.md` vÃ  `docs/sap490/template-inventory.vi.md`.
- SAP490 Blueprint draft v0.1 Ä‘Ã£ cÃ³ thÃ nh hai file DOCX copy tá»« template Blueprint cá»§a trÆ°á»ng rá»“i fill trá»±c tiáº¿p: `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.1.docx` vÃ  `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.1.docx`.
- SAP490 Test Scenario, Unit Test vÃ  Test and Fix Bug v0.1 Ä‘Ã£ cÃ³ báº£n tiáº¿ng Anh vÃ  tiáº¿ng Viá»‡t riÃªng, Ä‘Æ°á»£c copy/fill trá»±c tiáº¿p tá»« template trÆ°á»ng. Bá»™ file ghi 12 happy-flow scenario backend, 21 programmatic test case pass vÃ  lá»—i QA harness SC-01a cá»§a `IDTS-5` Ä‘Ã£ Ä‘Æ°á»£c sá»­a.
- Bá»™ workbook review SAP490 Ä‘Ã£ Ä‘Æ°á»£c lÃ m má»›i ngÃ y 2026-06-18 thÃ nh cÃ¡c báº£n tiáº¿ng Anh vÃ  tiáº¿ng Viá»‡t tÃ¡ch riÃªng, copy/fill trá»±c tiáº¿p tá»« template trÆ°á»ng: `Functional_Specification_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Test_Scenario_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Unit_Test_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Functional_Test_IDTS_SAP01_{en,vi}_v0.1.xlsx`, `Test_And_Fix_Bug_IDTS_SAP01_{en,vi}_v0.3.xlsx`, vÃ  `Test_Report_IDTS_SAP01_{en,vi}_v0.1.xlsx`.
- Bộ SAP490 mới đã phản ánh baseline hiện tại của Sprint 02 cho create/assignment/lifecycle/audit, kết quả retest backend `30 PASS / 0 FAIL`, kết quả HTTP pass cho attachment/comment, và xác nhận browser QA mới nhất rằng dialog Assign Developer hiện hiển thị tên developer đúng trên runtime đã verify.
- Bá»™ tÃ i liá»‡u láº­p káº¿ hoáº¡ch retest má»›i náº±m táº¡i `docs/qa/retest-matrix.en.md` vÃ  `docs/qa/retest-matrix.vi.md`. ÄÃ¢y lÃ  nguá»“n planning test chÃ­nh cho Sprint 02, thay cho checklist cÅ© `21/21`.
- Learning Recap / Mentor Mode tÃ¹y chá»n Ä‘Ã£ cÃ³ trong `.agents/skills/learning-recap` vÃ  Ä‘Æ°á»£c route trong AGENTS.md cho cÃ¡c task khÃ´ng táº§m thÆ°á»ng.

- Mermaid diagram nhÃºng trong SRS/FRS Ä‘Ã£ Ä‘Æ°á»£c tÃ¡ch ra `docs/diagrams/07-srs-system-context.md` vÃ  `docs/diagrams/08-frs-functional-workflows.md`.
- Há»— trá»£ database modeling Ä‘Ã£ cÃ³ qua `.agents/skills/idts-database-modeling` vÃ  `database-schema-design` Ä‘Ã£ cÃ i; review model hiá»‡n táº¡i Ä‘Æ°á»£c ghi trong `docs/ba/09-database-model-review.md`.
- CÃ¡c quyáº¿t Ä‘á»‹nh database DB-Q01 Ä‘áº¿n DB-Q08 cho WP1 Ä‘Ã£ Ä‘Æ°á»£c baseline trong `docs/ba/09-database-model-review.md` vÃ  sync vÃ o cÃ¡c IDTS canonical docs.
- ÄÃ£ cáº¥u hÃ¬nh mock users local (`DonHV`, `SangVN`, `DatDT`, `NhanT`) trong `package.json` vÃ  tá»‘i Æ°u hÃ³a backend capability calculation tá»« O(N) queries vá» O(1) query Ä‘á»ƒ loáº¡i bá» váº¥n Ä‘á» hiá»‡u nÄƒng N+1.
- ÄÃ£ táº¡o tÃ i liá»‡u Walkthrough & Demo Script chÃ­nh thá»©c cá»§a Sprint 02 trong repo táº¡i `docs/pm/tasks/wp4-walkthrough.md`.

## What Is Not Started

- Frontend readability for email delivery status (`IDTS-37`) and broader auth/email regression QA (`IDTS-38`) are not started yet; they are now unblocked by merged IDTS-36.
- Production XSUAA role collections and deployment-level authorization hardening remain out of the near-term custom-login path.
- Deeper QA scenarios and automated verification beyond compile/build/API/browser smoke checks.

## Member Status Links

| Member | Primary responsibility | Status |
| --- | --- | --- |
| DonHV | Leader, Backend CAP lead for Sprint 02, backend bug fixing, weekly consolidation, cross-workstream support | `status/donhv.md` |
| SangVN | Fiori/UI5 support for Sprint 02, with shared delivery support when assigned | `status/sangvn.md` |
| DatDT | Fiori/UI5 primary, with shared delivery support when assigned | `status/datdt.md` |
| NhanT | Backend verification and QA primary for Sprint 02, with shared delivery support when assigned | `status/nhant.md` |

Vietnamese:

| ThÃ nh viÃªn | TrÃ¡ch nhiá»‡m chÃ­nh | Status |
| --- | --- | --- |
| DonHV | Leader, Backend CAP lead cho Sprint 02, backend bug fixing, tá»•ng há»£p háº±ng tuáº§n, há»— trá»£ cross-workstream | `status/donhv.md` |
| SangVN | Há»— trá»£ Fiori/UI5 cho Sprint 02, cÃ³ thá»ƒ há»— trá»£ delivery chung khi Ä‘Æ°á»£c phÃ¢n cÃ´ng | `status/sangvn.md` |
| DatDT | Phá»¥ trÃ¡ch chÃ­nh Fiori/UI5, cÃ³ thá»ƒ há»— trá»£ delivery chung khi Ä‘Æ°á»£c phÃ¢n cÃ´ng | `status/datdt.md` |
| NhanT | Phá»¥ trÃ¡ch backend verification vÃ  QA cho Sprint 02, cÃ³ thá»ƒ há»— trá»£ delivery chung khi Ä‘Æ°á»£c phÃ¢n cÃ´ng | `status/nhant.md` |

## Current Decisions

| Decision | Current position |
| --- | --- |
| MVP scope | Focus on bug creation, classification, assignment, developer review, status lifecycle, comments, history, notifications records, and PM monitoring. |
| SAP Module | Optional business context, not the same as an IDTS feature/module. |
| Application Component | Required place where the bug appears. |
| Defect Category | Required defect type or technical layer. |
| Component Category | Valid pair of Application Component and Defect Category. |
| Developer Responsibility | Maps Developer to Component Category, optionally scoped by SAP Module. |
| Ownership wording | `Assignee` = Technical Owner. `Current Action Owner` = person or queue that must act now. |
| nextProcessor | System-maintained current action owner or queue; not a second assignee. |
| Retest Required | Kept as a core status between Resolved and Closed when verification is needed. |
| Rejected | Kept as a valid follow-up status; must have rejection reason, nextProcessor, and next action. |
| Cancel status | Not added in Sprint 3 by default; keep as discovery-only unless a later explicit decision approves it. |
| MVP roles | Three active roles: Tester, Developer, and PM. Reporter and Admin are not separate MVP roles. |
| Developer visibility | Developers may view and discuss team-visible bugs, but workflow processing is restricted to assigned Developer, Tester, or PM when request user is known. |
| SRS style | Uses a traditional SRS outline, with requirement quality, traceability, and verification aligned to ISO/IEC/IEEE 29148-style discipline. |
| FRS style | Uses function-detail specifications with workflow diagrams, validations, status effects, history/notification effects, acceptance criteria, and traceability to SRS. |
| WP1-WP3 implementation | CAP model foundation, service/value help, and MVP runtime business validation are complete. |
| Current work order | `IDTS-34` backend auth, `IDTS-35` FE login, and `IDTS-36` SMTP/outbox delivery are merged; next is `IDTS-37` notification readability and `IDTS-38` regression QA. |
| IDTS-36 email library | Nodemailer is selected for v1 because IDTS needs SMTP portability, simple Node.js integration, and no provider lock-in. `@opencoredev/email-sdk` remains a future reference only because it is AGPL-3.0-only and heavier than needed for this slice. |

Vietnamese:

- `Rejected` váº«n lÃ  status há»£p lá»‡ nhÆ°ng khÃ´ng pháº£i final status. Má»—i bug bá»‹ Rejected pháº£i cÃ³ lÃ½ do reject, nextProcessor vÃ  action tiáº¿p theo rÃµ rÃ ng.
- Developer cÃ³ thá»ƒ xem vÃ  tháº£o luáº­n bug trong team, nhÆ°ng action xá»­ lÃ½ workflow váº«n bá»‹ giá»›i háº¡n cho Developer Ä‘Æ°á»£c assign, Tester hoáº·c PM khi xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c request user.
- Product Discovery Ä‘Ã£ Ä‘Æ°á»£c thÃªm nhÆ° bÆ°á»›c BA trÆ°á»›c khi viáº¿t BRD/SRS/FRS hoáº·c xá»­ lÃ½ requirement chÆ°a rÃµ.
- BRD v1.2 Ä‘ang Ä‘Æ°á»£c duy trÃ¬ trong `docs/ba/brd/` theo hÆ°á»›ng SAP490 hybrid, vá»›i báº£n tiáº¿ng Anh vÃ  tiáº¿ng Viá»‡t tÃ¡ch riÃªng, gá»“m cáº£ Markdown vÃ  DOCX.
- Routing cho BA/DOCX deliverable cá»§a IDTS Ä‘Ã£ cÃ³ táº¡i `.agents/skills/idts-ba-docx-deliverables`, vá»›i cÃ¡c external document skills Ä‘Æ°á»£c dÃ¹ng nhÆ° nguá»“n tham kháº£o phá»¥.
- Helper fallback Markdown-to-DOCX local hiá»‡n giá»¯ Markdown table thÃ nh báº£ng Word tháº­t cÃ³ thá»ƒ chá»‰nh sá»­a cho cÃ¡c deliverable BA chÃ­nh thá»©c.

- SRS v1.1 Ä‘ang Ä‘Æ°á»£c duy trÃ¬ trong `docs/ba/srs/`; FRS v1.2 Ä‘ang Ä‘Æ°á»£c duy trÃ¬ trong `docs/ba/frs/`, vá»›i báº£n tiáº¿ng Anh/tiáº¿ng Viá»‡t tÃ¡ch riÃªng, gá»“m cáº£ Markdown vÃ  DOCX.
- FRS v1.1 Ä‘Ã£ sá»­a lá»—i Mermaid syntax á»Ÿ rejected follow-up sequence vÃ  bá»• sung workflow diagrams cÃ²n thiáº¿u cho create/assign, developer review, request information, retest/closure vÃ  PM monitoring.
- BRD v1.2, SRS v1.1 vÃ  FRS v1.2 Ä‘Ã£ cáº­p nháº­t MVP role baseline thÃ nh ba role active: Tester, Developer vÃ  PM. Reporter vÃ  Admin chÆ°a tÃ¡ch thÃ nh role riÃªng trong MVP.
- CÃ¡c file DOCX cá»§a BRD/SRS/FRS Ä‘Ã£ Ä‘Æ°á»£c regenerate tá»« Markdown má»›i vÃ  smoke-test báº±ng LibreOffice conversion trong thÆ° má»¥c táº¡m.
- SRS/FRS DOCX Ä‘Ã£ Ä‘Æ°á»£c smoke-test báº±ng LibreOffice convert trong thÆ° má»¥c táº¡m, khÃ´ng táº¡o PDF trong repo.
- Workflow sync SAP490 Google Workspace Ä‘Ã£ Ä‘Æ°á»£c document táº¡i `docs/sap490/sync-workflow.en.md` vÃ  `docs/sap490/sync-workflow.vi.md`; `@googleworkspace/cli` Ä‘Ã£ Ä‘Æ°á»£c cÃ i lÃ m dev dependency, cÃ¡c script check/dry-run an toÃ n Ä‘Ã£ cÃ³, vÃ  OAuth authentication Ä‘Ã£ verify trÃªn mÃ¡y hiá»‡n táº¡i. CÃ¡c developer khÃ¡c váº«n cáº§n tá»± authenticate `gws` á»Ÿ local trÆ°á»›c khi lÃ m sync.
- Script upload review an toÃ n báº±ng `gws` Ä‘Ã£ cÃ³ cho cÃ¡c file DOCX BRD/SRS/FRS. Script táº¡o báº£n review má»›i cÃ³ timestamp vÃ  khÃ´ng overwrite file Drive hiá»‡n cÃ³.
- Script Google Sheets review an toÃ n báº±ng `gws` Ä‘Ã£ cÃ³. Script táº¡o workbook má»›i cÃ³ timestamp gá»“m cÃ¡c tab Requirement Backlog, Traceability Matrix, Business Rule Matrix, Risk Decision Log vÃ  Open Questions.

## WP4 Current Note

The Fiori Elements UI for the Bug Creation flow (Option B) is implemented and re-verified on a real browser path. Child facets (History, Comments, Notifications) and system fields are dynamically hidden during creation using draft-state OData expressions, while the attachment facet remains visible during create as Option A. Dependent filtering between Application Component and Defect Category now works, the attachment row remains visible right after create, role-based action visibility is correct for Tester, Developer, and PM, the `Start Progress` lifecycle submit now refreshes the Object Page state immediately after the side-effect fix, the earlier `componentCategory_ID` create warning is no longer reproduced after removing the redundant derivation side effect, the Comments section now exposes a local `Add Comment` CTA inside the section itself, and assignment/reassignment now uses the filtered `Assignee` field instead of a competing `Assign Developer` action dialog.

Vietnamese: Giao diá»‡n Fiori Elements cho luá»“ng táº¡o bug (Option B) Ä‘Ã£ hoÃ n thÃ nh vÃ  Ä‘Æ°á»£c kiá»ƒm thá»­ thÃ nh cÃ´ng. CÃ¡c tab phá»¥ (Lá»‹ch sá»­, BÃ¬nh luáº­n, ÄÃ­nh kÃ¨m, ThÃ´ng bÃ¡o) vÃ  trÆ°á»ng há»‡ thá»‘ng Ä‘Æ°á»£c áº©n Ä‘á»™ng khi táº¡o má»›i nhá» biá»ƒu thá»©c draft OData, nhÆ°ng váº«n hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ á»Ÿ cháº¿ Ä‘á»™ xem/sá»­a bug cÅ©. TrÆ°á»ng Assignee cÃ³ thá»ƒ chá»n qua Value Help. Backend Ä‘Ã£ Ä‘Æ°á»£c tháº¯t cháº·t báº£o máº­t Ä‘á»ƒ ghi Ä‘Ã¨ bugNumber, status_code vÃ  reporter_ID. Browser smoke test báº±ng Playwright Ä‘Ã£ xÃ¡c nháº­n giao diá»‡n sáº¡ch sáº½ vÃ  lookup cháº¡y tá»‘t.

Vietnamese clean note: Trường Assignee hiện chọn được qua value help, popup hiển thị cột nghiệp vụ, và trên runtime đã verify thì ô input của action `Assign Developer` hiện hiển thị tên developer đã chọn thay vì UUID. Các popup value list phổ biến cũng đã có label nghiệp vụ, ví dụ `Priority Code` và `Priority`. Lần verify này dùng Playwright CLI, không dùng Playwright MCP.

Vietnamese clean note: Nút `Assign Developer` riêng đã được bỏ khỏi Object Page để tránh hai luồng assign cạnh tranh nhau. User assign/reassign bằng field `Assignee`; khi save draft, backend tự chuyển status sang `Assigned`, cập nhật `nextProcessor`, ghi history và tạo notification.

## Next Handover Instruction

Any new agent or developer should identify their member name first, then read this file, `task-board.md`, the relevant member file under `status/*.md`, and the relevant `tasks/*.md` before making changes.

Vietnamese: Agent hoáº·c developer má»›i pháº£i xÃ¡c Ä‘á»‹nh tÃªn thÃ nh viÃªn trÆ°á»›c, sau Ä‘Ã³ Ä‘á»c file nÃ y, `task-board.md`, file status thÃ nh viÃªn tÆ°Æ¡ng á»©ng trong `status/*.md`, vÃ  file `tasks/*.md` liÃªn quan trÆ°á»›c khi chá»‰nh sá»­a.
