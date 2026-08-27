# Current Project Status

Last updated: 2026-08-27

## 2026-08-27 My Notifications N2 source candidate

- N1 PR #361 is merged at `e35d09c0deef129f0d986457c847fe7fc28b90d4`. N2 uses that exact base on `feature/wp7-notifications-inbox-ui-donhv`; Tasks 5–6 are locally green for the dedicated OData client, native SAPUI5 inbox, i18n, lifecycle cleanup, responsive/keyboard checks and focused lint/build.
- Final independent exact-head review and one Draft N2 PR remain. No migration/backfill execution, deployment, provider/email/data/user/role change, Ready/merge or N3. Detailed evidence: `docs/pm/evidence/my-notifications/n2-source-evidence.md`.
- Tiếng Việt: N1 #361 đã merge tại SHA trên; N2 dùng base đó và candidate Tasks 5–6 đã GREEN local. Còn review exact-head cùng một Draft N2 PR; không migration/backfill thật/deploy/email-data-role/N3.

## 2026-08-27 My Notifications N1 merged baseline

- N1 Tasks 1–4 were source-verified in PR [#361](https://github.com/DarwinDO/IDTS-SAP01/pull/361) and merged at `e35d09c0deef129f0d986457c847fe7fc28b90d4`. Fresh caller-only API, persistence/backfill and email regressions passed; exact-source review at `7dad8f18e148568d83380cabf2deba80eb432398` had zero Critical/Major/Important/Minor findings.
- DonHV reaffirmed existing Knowledge Gate PASS without inventing a new assessment. N1 merge authorizes the N2 source baseline only; no N1 deployment/live migration/backfill was performed. See `docs/pm/evidence/my-notifications/n1-source-evidence.md`.
- Tiếng Việt: source N1 Tasks 1–4 đã kiểm định và merge qua #361 tại SHA trên. Dùng PASS đã có theo DonHV, không tạo bài thi mới. Merge N1 chỉ tạo baseline source N2; chưa deploy/migration/backfill thật.

## 2026-08-27 WP8 Gate 6.5 live closure

- Source PR #358 merged into `dev` at `e587aa5b1603d32c89ce01b4bcab9854f07eb157`. The additive HANA migration created only `UserAccessNotificationDeliveries` and its unique source-audit index; existing aggregate counts and the protected Users digest were preserved.
- CAP and User Administration `1.0.17` were deployed selectively. Final CAP/AppRouter state is `1/1`, health/readiness/web are `200`, anonymous protected API is `401` as expected, and the final check reports `DEMO READY`.
- DonHV approved one controlled Tester Suspend -> Reactivate acceptance. Suspend produced one persisted `Sent` delivery and one mailbox-confirmed email. Reactivate completed after the broker verified the provider already had the desired role collections, so `NOOP_ALREADY_DESIRED` correctly produced no second delivery/email. Final Tester state is `Active`, identity-linked, and has no pending operation.
- The rollout evidence branch is documentation/tooling only. Its next boundary is one Draft PR; it does not authorize another deployment, role change, historical replay, merge, or worktree cleanup.

## Snapshot

| Field | Current value |
| --- | --- |
| Shared QA email routing | DonHV approved `GO EMAIL ROUTING` on 2026-08-08. The existing BTP external-services binding changed only `email.testMode` from `true` to `false`; SMTP provider fields and `defaultTestRecipient` were preserved for rollback. CAP restarted at `1/1`; `/health` and `/ready` returned HTTP 200. No email replay/send-smoke, DB deployer, SQL, seed or schema operation ran. |
| Repository hygiene | IDTS-104 is Done through PR #187 at merge commit `7d5ffa0`. Historical SAP490 binaries are preserved by tag `sap490-generated-archive-20260726` and a hash/blob manifest; current tree keeps only approved latest artifacts. Local temp/log/raw-UAT output was cleaned after useful screenshots were curated and labeled. Drive and runtime are unchanged. |
| Project phase | Sprint 5 is active and currently At Risk. Jira Epic `IDTS-88` now consolidates all 11 current Sprint 5 issues for mentor readiness, Shared QA/infrastructure closure, security follow-up, and ownership governance. |
| Product baseline | CAP/Fiori MVP, attachment/audit/notification/PM flows, and advisory-AI review baseline are implemented; BRD v1.5, SRS v1.4, and FRS v1.5 EN/VI are synchronized to the AuthService/AuthSessions, Render/PostgreSQL, attachment/S3, notification outbox, and human-reviewed AiSuggestions baseline. |
| IDTS-111 NhanT handoff | NhanT's Tester allocation is packaged 57/57: 22 candidate MEETS, 12 candidate DOES_NOT_MEET and 23 BLOCKED, with 77 hash-verified PNG references (64 unique hashes) and 0 missing/hash mismatch. ATT-001 is reviewer-blocked because its preserved fixture provenance is inconsistent. AI-005/009 diagnostics, UX-002 matching fixture and UX-003 physical-Tab proof remain explicit gaps. The approved 90-case catalog and final UAT workbook/Drive remain unchanged. |
| Current sprint | `IDTS Sprint 5`: 11 issues as of 2026-07-22 — 5 In Progress, 6 To Do, 0 Done, and 5 overdue before the report date. All 11 are children of Epic `IDTS-88`; DonHV owns 9 and SangVN owns 2, so capacity and status reconciliation are immediate risks. |
| Recommended next action | Have SangVN, DatDT and NhanT complete one interactive SAP-identity sign-in each, then capture the live Developer/Tester authorization matrix and rerun the native Fiori attachment picker when Chrome upload permission is available. Their BTP users, role collections and HANA business identities are already aligned and verified. The BTP Technical Specification delta is prepared for IDTS-112 but must still pass its named-member approval workflow. OpenAI live remains disabled and must not be presented as accepted. |
| Active implementation note | IDTS-72 visual evidence audit has repository evidence merged through PR #126. IDTS-74 is complete and deployed. IDTS-75 is complete at implementation, PR, Render, and shared-QA evidence level. IDTS-76 is complete at implementation, PR, Render, and shared-QA evidence level: it reuses `summarizeBugHandoff` and `AiReviewUi`, adds a review-only Handoff Summary Object Page section/dialog, and has local plus shared-QA evidence for positive, sparse-data, unsafe-output, safe-failure, no-workflow-mutation, deployed API smoke, and deployed browser smoke. |
| Completed DatDT AI review foundation | IDTS-91/92/93 merged through PR #167 at `442b958b28ff268920260bbdef8bd94dc56f9341`. Explicit suggestion review, persisted Similar Bugs/Classification controls, and validated Tester/PM classification apply passed the integrated regression and fresh GitHub gate. Jira comments `10676`–`10678` record closure evidence; all three issues are Done. |
| Completed SangVN AI review controls | IDTS-94 merged through PR #168 at `9e041dac56f9adfd9294521d5c2e7e8f3c1597cb`. Handoff Summary and Smart Assign explanation persist review decisions without workflow/assignee mutation; focused, desktop/mobile browser, build and gate evidence passed. SangVN's 3/3 Knowledge Gate remains linked; Jira comment `10679` records closure and the issue is Done. |
| Active SangVN duplicate confirmation | IDTS-95 is technically verified on PR #172. The Tester/PM action confirms only an accepted stored Similar Bugs candidate, rejects self/reverse/repeated links, uses the request transaction, and does not mutate Bug lifecycle. DonHV approved an emergency deadline exception for the still-missing dedicated Knowledge Gate; the exception is recorded transparently and is not a fabricated PASS. |
| Active SangVN AI operational metrics | IDTS-97 adds allowlisted best-effort operation status/latency fields and a PM-only bounded aggregate without exposing prompts, responses, raw errors, emails, endpoints or secrets. DonHV approved the same emergency deadline exception for the missing metrics/privacy Knowledge Gate; the exception is not a learner PASS. |
| Main implementation risk | Shared QA still depends on private Render/Brevo/AWS/PostgreSQL environment variables staying out of repo, Jira, and logs. The Render PostgreSQL free-instance expiry remains the main time-bound infrastructure risk; IDTS-45 now documents a private logical-backup helper and recommends upgrading Render PostgreSQL before expiry if shared QA remains needed. Sprint 04 is tracked both through the real Jira sprint `IDTS Sprint 4` and planning epic `IDTS-51`; `IDTS-40` remains a deferred AWS-native follow-up rather than a blocker for Render QA. |
| Knowledge readiness | `IDTS-82` is In Progress. From 2026-07-13, every member must pass the ownership Knowledge Gate before nontrivial work and before PR merge/Jira Done. Debug Labs, a progress register, and a PR-body validator are being added; source-comment retrofit is split into IDTS-83 to IDTS-85 and QA validation is IDTS-86. |
| My Notifications delivery | Planning #360 and N1 #361 are merged. N2 UI source candidate is locally verified from exact N1 merge base `e35d09c0`; independent review and one Draft N2 PR remain. Job Scheduler remains recovery/SLA/Overdue/digest/retention, not normal prompt-email latency. No deployment or migration is implied. |
| Active audit refactor | `IDTS-89` is complete: Knowledge Gate 90% PASS; PR #163 merged normally and runtime-only deploy `dep-d9gtkhrrjlhs73d4mhqg` is live at merge SHA `97792e8`. Database preservation, 11/11 exact ActionTypes, 11/11 legacy ActionTypes, health, protected-route, error-log, and authenticated reversible exact-action smoke checks pass. Auto-deploy remains off and pre-deploy remains `true`. |
| Developer demo pool | `IDTS-90` is complete: PR #165 merged, Shared QA was updated by a narrow transaction only, and authenticated OData now exposes 12 Developer profiles with varied availability/workload plus 30 responsibility rows. No runtime deploy or broad seed reload was used. |

## What Is Already Done

- Business baseline exists in the three IDTS markdown files and `docs/project-context.md`.
- BA pack exists under `docs/ba/`.
- Core domain terms are clarified: SAP Module, Application Component, Defect Category, Component Category, Developer Responsibility, assignee, and nextProcessor.
- Status lifecycle includes `Retest Required`.
- Assignment and nextProcessor behavior are documented at business level.
- PM execution docs are created under `docs/pm/`.
- Product Discovery workflow is available under `.agents/skills/product-discovery` and `docs/ba/discovery/`.
- BRD v1.3 markdown and DOCX deliverables are maintained under `docs/ba/brd/`.
- SRS v1.2 markdown and DOCX deliverables are maintained under `docs/ba/srs/`.
- FRS v1.3 markdown and DOCX deliverables are maintained under `docs/ba/frs/`.
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
- The historical Blueprint v0.1 files are retained for traceability but are not current mentor candidates. Local v0.3 review candidates now fill fresh copies of the official school Blueprint template: `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.3.docx` and `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.3.docx`. They have not yet replaced the existing Drive binaries.
- SAP490 review workbooks were refreshed on 2026-06-18 as separate English and Vietnamese copies from the school templates: `Functional_Specification_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Test_Scenario_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Unit_Test_IDTS_SAP01_{en,vi}_v0.2.xlsx`, `Functional_Test_IDTS_SAP01_{en,vi}_v0.1.xlsx`, `Test_And_Fix_Bug_IDTS_SAP01_{en,vi}_v0.3.xlsx`, and `Test_Report_IDTS_SAP01_{en,vi}_v0.1.xlsx`.
- SAP490 review sync on 2026-07-10 uploaded 36 timestamped EN/VI review artifacts to the `SAP490 Review` Drive folder: BRD/SRS/FRS, Blueprint, Functional/Technical Specifications, Configuration Note, change tracker, Test Scenario/Unit/Functional/Test Report, product-only Test & Fix Bug, prepared UAT plan, Workshop deck, and Review Readiness register. The v0.4 defect workbook contains only 12 confirmed product defects; member status files retain non-product issues and the full issue log. Final Project Report and real UAT sign-off remain intentionally pending.
- SAP490 mentor-readiness remediation on 2026-07-22 preserved all 113 original Drive file IDs, added one native Mentor Index, and normalized the complete tree so 48/48 folders and 114/114 files comply with the `SU26SAP01_GSU26SAP01` naming convention. The root now contains only the fully prefixed current, templates, and archive folders; no delete/copy operation was used.
- Independent SAP490 recheck findings were closed on 2026-07-23 at the existing Drive IDs: Test Report EN/VI use the exact v0.3 header with no broken defined names, Diagram 07 no longer shows Request More Information after retest, and Blueprint EN/VI are 20 pages each. A second active verification confirms the artifact verdict remains CONDITIONALLY READY: the reproducible Office composition is 27 local artifacts + one Drive-only XLSX + three native Sheet exports = 31/31 PASS/zero issues; the diagram manifest is 21/21, native Slides are 46/46/46 with zero legacy, Workshop metadata is unchanged, and runtime diff is empty. Governance closeout is not complete because IDTS-78 is Done without the required `Ownership Knowledge Gate: PASS`; the task must be reopened until real gate evidence exists. Contextual `TBD` approval dates and revision-history references to removed placeholders are not unresolved defects.
- SAP490 test-documentation remediation on 2026-07-23 created one canonical catalog for 32 requirements, 27 cases, six fresh execution runs, and 12 real defects; regenerated all 12 current EN/VI workbooks; and updated their existing Drive IDs in place. Final gates: content validator 12/12 PASS with zero warning/error, OfficeCLI 12/12 PASS with zero issues, EN/VI parity PASS, full cross-renderer visual review PASS, Google Sheets 12/12 open/render PASS, and Mentor Index readback/visual PASS. Verdict: `CONDITIONALLY READY — UAT execution and mentor sign-off pending`.
- Blueprint official-template/content remediation is verified locally: both v0.3 candidates start from the exact tracked template and retain 3 sections, 8 body tables, matching section geometry/link configuration, 161 style signatures, numbering sets and the official cover/control layout. BP-13 now matches the runtime's `PENDING` audit-only behavior, VI prose is formally localized, date/history wording is truthful, dead legacy generator code is removed, and all 37 final rendered pages (19 EN + 18 VI) pass visual review. Drive remains unchanged pending DonHV review; evidence is `docs/pm/evidence/sap490-blueprint-template-remediation-20260723.md`.
- DonHV's template-fidelity P1 was closed on 2026-07-23: the generator now fills the official SAP490 sheets instead of replacing them, a dedicated fidelity regression test protects sheet/merge/image/print contracts, and the Google Sheets duplicate-percent defect in Test Report EN/VI is fixed at source. The final 12 same-ID Drive binaries pass fidelity, content, OfficeCLI, LibreOffice and Google Sheets gates; evidence is `docs/pm/evidence/sap490-test-template-restoration-20260723.md`.
- The follow-up font/readability P1 was closed on 2026-07-23: all 2,934 populated cells in the 12 current test workbooks are now at least 12pt, no populated cell is rotated, `Passed` no longer wraps by character, and the official-template pack passes template fidelity, content validation, OfficeCLI 12/12 zero issues, LibreOffice visual review 94/94 pages, and Google Sheets critical-view inspection 12/12. Same Drive IDs and parents were preserved; evidence is `docs/pm/evidence/sap490-test-font12-format-reaudit-20260723.md`.
- The four official Functional Specification v0.4 and Technical Specification v0.2 raw XLSX files were subsequently repaired with OfficeCLI and replaced in place at their existing Drive review IDs. The final local OfficeCLI validation and format/content scans are clean; the live Drive review confirms the corrected technical cover and readable horizontal Screen Layout table. This is presentation/documentation remediation only and adds no Test & Fix Bug row.
- Release handover on 2026-07-11 merged the agent-rule routing, disabled-by-default OpenAI provider, and SAP490 review traceability PRs into `dev` at `d97ae6d`. Render service `idts-sap01-qa` deploy `dep-d98jk5cs728c73di5g0g` is live and `/odata/v4/auth/$metadata` returned HTTP 200; no private AI key/model was added and AI remains disabled by default.
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
- `Need More Information` has an explicit recovery action: Tester or PM uses `Resubmit to Developer` with an update summary, the bug returns to `Assigned`, `nextProcessor` goes back to the assigned Developer, and the system writes history/notification side effects. Resubmit no longer creates an automatic Comment; discussion comments remain explicit user actions.
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
- IDTS-34 is merged into `dev` through GitHub PR #28 at merge commit `52432e35c66a3c0137ed5b7c96c9f57d93409fc5`. Backend custom login now exposes `AuthService.login/logout/me`, stores only password hashes, creates server-side `AuthSessions`, maps Bearer tokens to `cds.User`, keeps `BugService` protected, and passes focused auth verification (`23 PASS / 0 FAIL`) plus CAP compile on `dev`.
- QA/testing skill support for IDTS-36/IDTS-38 is now installed and routed: `backend-testing`, `api-testing-patterns`, `integration-testing`, `qa-report`, and `qa-test-plan` exist under repo-local `.agents/skills/` and external backup `C:\Users\LapHub\.agents\skills\`. `backend-testing`, `api-testing-patterns`, and `integration-testing` are the primary implementation-test support skills; `qa-report` and `qa-test-plan` are secondary planning/reporting helpers.
- IDTS-39, IDTS-52, and IDTS-53 are complete at implementation handoff level. Login/auth unexpected errors are sanitized, the custom login page now uses SAPUI5 controls with SAP Horizon styling, and the authenticated app now exposes a visible profile/sign-out popover.
- IDTS-67 is Done. PR #113 was squash-merged into `dev` at `d167613`; backend QA passed IDTS-64 `26/0`, IDTS-65 `19/0`, IDTS-66 `30/0`, and IDTS-67 `22/0`; Jira comments `10428`, `10429`, and `10430` record implementation, check pass, and closure.
- IDTS-68 is Done at repository handoff level. PR #115 was squash-merged into `dev` at `d5e4297`; backend action `summarizeBugHandoff`, grounded bug/comment/history context, provider/fallback handling, sanitized `BUG_SUMMARY` audit, knowledge mirrors, and focused QA evidence `28/0` are merged. Jira evidence comment is `10431`; Jira closure transition is handled after this closure sync.

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
| Current work order | `IDTS-34`, `IDTS-35`, `IDTS-36`, `IDTS-39`, `IDTS-44`, `IDTS-46`, `IDTS-47`, `IDTS-48`, `IDTS-49`, `IDTS-52`, `IDTS-53`, `IDTS-74`, `IDTS-75`, and `IDTS-76` have implementation/verification completed and are merged or closed as applicable. AI visual acceptance is now unblocked for `IDTS-72` closure because Smart Assign, duplicate/similar, classification, and handoff summary all have product-UI evidence. Other practical work: `IDTS-45` Render PostgreSQL expiry/backup decision, `IDTS-59`/`IDTS-60` UI/UX QA follow-up, then the remaining `IDTS-57` final regression coverage. |
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

## 2026-07-25 SAP490 specification remediation

- `IDTS-101` regenerated eight Blueprint, Functional Specification, Technical Specification, and Configuration Note EN/VI artifacts from their official templates.
- OfficeCLI, strict template/content validation, complete sheet coverage, EN/VI parity, and 105/105-page visual review passed.
- All eight existing Drive files were updated in place with IDs, parents, MIME types, and sharing preserved; raw-byte readback matched local artifacts.
- Blueprint Drive preview now reports 26 EN pages and 25 VI pages with matching `Confidential current/total` footers. Mentor review/approval remains Pending and live OpenAI remains disabled/not accepted.

## 2026-07-25 SAP490 specification quality follow-up

- `IDTS-102` corrected runtime traceability, content completeness, and formal layout findings discovered after the IDTS-101 merge.
- Eight specification artifacts were regenerated from official templates and updated at their existing Drive IDs. OfficeCLI 8/8, strict specification validation, and visual review of 102/102 rendered pages pass.
- No runtime files changed. Six human UAT cases, mentor approval/signature, and live OpenAI acceptance remain open and are not claimed as PASS.
- PR #181 passed the required QA Depth Gate and merged normally into `dev` at `3d4e2d0c50156ecc2d7b53643caedbb5945c5d8a`.

## 2026-07-25 SAP490 formal specification table follow-up

- `IDTS-103` is complete: PR #183 merged at `5092035`, and Functional Specification EN/VI v0.7 plus Technical Specification EN/VI v0.6 were updated in place at their existing Drive IDs.
- OfficeCLI 4/4, strict structural/source/message/parity validation, 50/50-page local visual review, exact-byte Drive readback, and representative Functional 9/9-tab plus Technical 12/12-tab Drive previews pass. Mentor approval/signature and live OpenAI acceptance remain external pending gates.

## 2026-07-25 NhanT AI QA PR review

- IDTS-96 is Done through deeper current-dev IDTS-68/69/91/93/95 regression coverage, and stale PR #177 was closed without merge. IDTS-99 is Done as an explicitly superseded Render/OpenAI-era task; current SAP BTP/provider acceptance remains under IDTS-114/115. IDTS-98 remains In Progress, but stale PR #178 was closed without merge and any retained evaluation scope must be rebuilt from current `dev` with actual feature logic and sanitized evidence.
- GitHub and Jira disposition comments were posted. PR #177 and PR #178 are closed without merge; PR #179 remains a historical disabled-provider candidate and is not approved for merge into the SAP BTP baseline.

## 2026-07-27 SAP490 EN-only mentor remediation

- `IDTS-105` is In Progress. The Vietnamese internal briefing now captures the mentor feedback, exact purpose of all 12 Technical Specification tabs, SAP/CAP equivalents, official-template rules, numbering, evidence rules, ownership, and the three human-approval gates.
- Jira tasks `IDTS-106`–`IDTS-112` exist with explicit dependencies. They remain blocked until the committed briefing is personally acknowledged by the relevant members.
- The official SAP490 submission direction is English-only. Vietnamese learning/briefing documents remain allowed, but no new VI submission artifact may be generated or synchronized.
- No member acknowledgment, candidate approval, Unit/UAT result, Drive Trash operation, or mentor-ready completion has been fabricated or claimed.

## 2026-08-03 IDTS-106 EN-only cleanup execution

- DonHV's briefing READ and the approved/merged IDTS-107 Gate 2 removed the two cleanup prerequisites.
- IDTS-106 backed up and hashed 13 VI Drive artifacts, moved exactly those files to Trash without emptying it, and verified all EN counterparts remain present.
- The repository EN-only pipeline retires 11 generated VI artifacts while preserving internal Vietnamese material and historical Git/archive truth.
- The Mentor Index is EN-only and records the current versions and truthful ownership/test limitations. PR #264 passed the fresh gate and merged normally at `cd03aedde4fa2d3d146b54ec76d400e4de3f670b`; Jira IDTS-106 is Done with evidence comment `10882`.

## 2026-07-28 isolated SAP BTP Cloud Foundry POC

- `IDTS-113` deployed an isolated CAP copy to SAP BTP Trial Cloud Foundry with SAP HANA Cloud and a dedicated HDI container. The app is running and health, public auth metadata, anonymous denial, authenticated read, logout, and revoked-token checks pass.
- Render Shared QA, Render PostgreSQL, AWS S3, Brevo, OpenAI configuration, and real user data were not changed or copied.
- This result proves technical deployability only. XSUAA/AppRouter adoption, provider integration, migration, and production readiness remain separate decisions.

## 2026-07-28 SAP BTP migration acceptance increment

- `IDTS-113` now runs the migrated CAP service and AppRouter on SAP BTP Cloud
  Foundry with HANA data, XSUAA PM access, retained AWS S3, retained Brevo and
  SAP Job Scheduling Service.
- `IDTS-114` is in progress: PR #211 is merged at
  `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa` and SAP BTP uses Qwen structured
  generation/embeddings with one bounded OpenAI fallback. Live synthetic BTP
  tasks and 169 local regression checks passed; Ling plain chat passed but its
  JSON-Schema structured request returned HTTP 400. PM browser acceptance
  verified Similar Bugs, Classification review, Handoff Summary and Smart
  Assign no-mutation/audit persistence, but later sanitized gateway 429/400
  responses mean stable provider-live feature success is not claimed.
- Runtime SHA `3504931d2689e4d56c0de3f5977342fc7cf57e4a` is deployed. PM browser
  assignment/history/notification smoke, S3 adapter upload/download/hash/delete
  and a fresh Scheduler-driven Brevo SENT delivery passed.
- IDTS-115 PR #214 is merged and selectively deployed at
  `ae209c8f82227e4dedca09247db96c0b47097d92` without running the DB deployer.
  PM browser acceptance passed Apply Classification, Confirm Duplicate and
  PM-only AI Activity. HANA readback confirms the `BUG-0019` to `BUG-0020`
  duplicate relationship; review/apply operations did not change status,
  assignee or next processor unexpectedly. Evidence is under
  `docs/pm/evidence/idts-115/`.
- Full AI acceptance remains open. Qwen embedding produced observed `SUCCESS`,
  but recent structured Classification, Handoff and Smart Assign audits are
  safe fallback/provider-error outcomes. Tester/Developer interactive browser
  role evidence is also pending member-owned sign-in. The controlled create
  flow emitted binding errors for off-screen fields and `componentCategory_ID`;
  both QA bugs were eventually created, but the console finding requires
  follow-up before a clean-browser claim.
- The Render rollback platform-readiness drill is documented and fresh route
  checks pass. Render is a previous baseline, not a synchronized HANA replica;
  a lossless return requires manual HANA-delta reconciliation.
- Full cutover is not yet signed off: the Tester/Developer identities and role
  collections are provisioned, but each member still needs one interactive
  sign-in/authorization check. Native browser file-picker evidence and the
  final Technical Specification EN integration under IDTS-112 also remain
  open.

## 2026-08-01 SAP BTP explicit re-login follow-up

- `IDTS-117` is complete. PR #254 merged at `d733771`; the exact release was
  selectively deployed to the standalone AppRouter without an HDI/database
  deployment.
- The public signed-out page and protected `/login.html` bridge passed two
  consecutive browser round trips through XSUAA back to the Fiori application.
  Both final `AuthService.me` checks returned HTTP 200 JSON and parsed cleanly.
- The fix does not add custom BTP credentials or change local/Render auth,
  HANA users, role collections, OData contracts, schema or business data.
- Evidence is in `docs/pm/evidence/idts-117/btp-rollout/`. IDTS-108 can now be
  reconsidered without the IDTS-117 blocker.

## Next Handover Instruction

Any new agent or developer should identify their member name first, then read this file, `task-board.md`, the relevant member file under `status/*.md`, and the relevant `tasks/*.md` before making changes.

Vietnamese: Agent hoáº·c developer má»›i pháº£i xÃ¡c Ä‘á»‹nh tÃªn thÃ nh viÃªn trÆ°á»›c, sau Ä‘Ã³ Ä‘á»c file nÃ y, `task-board.md`, file status thÃ nh viÃªn tÆ°Æ¡ng á»©ng trong `status/*.md`, vÃ  file `tasks/*.md` liÃªn quan trÆ°á»›c khi chá»‰nh sá»­a.

## 2026-08-20 WP8 User Administration roadmap

- PR #318 is merged into `dev` at `5e99aa0beed6ed877b8b9d53b42b878e1c16fbf5`; local `dev` and `origin/dev` were synchronized.
- DonHV approved a sequential post-merge roadmap: Active Users, access lifecycle, Developer Responsibilities controlled pilot, Business Catalog Administration, and Operations/Audit.
- DonHV approved the master and five gate designs. Five detailed implementation plans are prepared for review; Luna Max executor tasks, source changes, and platform mutations have not started.
- Cost control uses one Luna Max task per gate, no full-chat context fork, and coordinating-task review before the next gate.

## 2026-08-20 WP8 Gate 2 Active Users executor handoff

- The isolated branch `feature/wp8-admin-active-users-donhv` started at the required base `96746fef148d6d6b9627ed1e8b9be5b28eb94e81` and contains the Gate 2 contract, deterministic read model, Active Users UI tab/details, focused TDD, and source evidence package.
- No schema, CSV, database, provider, BTP, role, user, session, Jira, Drive, deployment, merge, Ready transition, or Gate 3 mutation occurred.
- The executor stops after final source gates and a Draft PR to `dev`; DonHV/coordinator owns exact-diff review and manual browser acceptance.

## 2026-08-20 WP8 Gate 3 Access Lifecycle executor handoff

- Gate 2 is merged at `f89eacc1ef2eed6767395b1b5bc6c97ff0d6c7f5`; this isolated Gate 3 branch `feature/wp8-admin-access-lifecycle-donhv` is based exactly on that commit.
- Source implementation and documentation are present through `ad7e3d4` (local suspend, queued reactivation, broker readback proof, state-bound Active Users actions, focused TDD, canonical rules, PM evidence, and knowledge mirrors). The final source gate is PASS; Draft PR push/readback remains next.
- Suspension is IDTS-local and fail-closed: it protects the final PM + UserAdmin, revokes active sessions atomically, records `SUSPENDED`, and performs no provider write. Reactivation keeps local access disabled until exact immutable-principal and Role Collection readback proof.
- No BTP, HANA/HDI, schema, seed, provider, SAP user, Role Collection, session outside the local transaction, Jira, Drive, deployment, merge, or Ready transition mutation occurred in Gate 3. The executor stops at Draft PR; coordinator exact-diff review and any later deployment/acceptance remain separate approvals.

## 2026-08-23 WP8 Gate 5 Business Catalog remediation

- Gate 5 is source-only on `feature/wp8-admin-business-catalogs-gate5-luna-donhv`, frozen from `origin/dev` `fd6870585d72ca63e55b744708960b417a2795b9`; execution started at candidate `346a1cfaca800f566b2a1ed102608a65537f7bdd` after the coordinator returned 0 Critical / 1 Major / 5 Important findings.
- Remediation closes the OData V4 `$top`/complete-result gap, awaits inner PATCH/POST promises after `submitBatch`, exposes `componentType`/`categoryType` with value states, rejects raw client catalog IDs, makes DELETE restrictions/immutable IDs explicit in service metadata, and expands anchored bilingual knowledge mirrors.
- Focused catalog/UI contracts, CAP EDMX/HANA compile, UI5 MCP supported-resource lint, UI lint and UI build are fresh source evidence. No HDI/HANA/data/catalog/provider/user/role/email/Jira/Drive/deployment/merge/Ready/Gate 6 mutation has occurred. Final exact head, security scan, Draft PR and `qa-depth-gate` readback remain handoff steps.

## 2026-08-15 User Administration M3D broker enablement

- The isolated `idts-user-access-broker` is STARTED `1/1`, no-route, bound only to its dedicated XSUAA and broker-only API-access UPS, and its fresh empty-queue poll is `IDLE`.
- The cross-XSUAA authority defect was corrected by replacing the constructed main app ID with `$XSSERVICENAME(idts-sap01-auth).ProvisioningBroker`; focused tests and live scope/audience/CAP-claim checks pass without exposing auth material.
- No SAP provider, user or Role Collection mutation ran. End-to-end acceptance remains blocked on one controlled non-member SAP ID test identity and an exact assign/readback/revoke/cleanup gate.
## 2026-07-23 SAP490 test-sheet filter correction

- The 12 current test workbooks were regenerated from the official-template generator with all unintended AutoFilters removed: 36 before, 0 after across 48 sheets.
- Content/template/12pt/OfficeCLI/94-page visual gates PASS; all 12 Drive binaries were updated in place with IDs, prefixed names, MIME types, and parents preserved.
- Evidence: `docs/pm/evidence/sap490-test-filter-removal-20260723.md`.
- Verdict remains `CONDITIONALLY READY — UAT execution and mentor sign-off pending` because UAT execution/sign-off is still pending.
- Knowledge Gate remains `IN PROGRESS — handled in dedicated learning thread`.
## 2026-08-05 IDTS-125 handover

- SangVN implemented the role/assignee Bug-mutation boundary on `fix/idts-125-bug-mutation-authorization-sangvn`: non-assignee Developer is read/comment only; assigned Developer can comment, manage attachments and use permitted lifecycle actions while Bug fields stay read-only; Tester/PM retain documented edit/coordination permissions. Focused and impacted local verification passed. Ownership Knowledge Gate retest passed 6/6 on 2026-08-06; Jira remains In Progress pending normal PR review, merge and final evidence.

- Vietnamese: SangVN đã implement boundary mutate Bug theo role/assignee trên branch IDTS-125. Focused và impacted local verification đã pass; Knowledge Gate retest PASS 6/6 ngày 2026-08-06. Jira vẫn In Progress để chờ PR review, merge và final evidence.

## 2026-08-08 IDTS-81 / IDTS-115 / Developer capacity release

- PR #310 (SangVN email BTP deep-link), PR #311 (DonHV Classification Apply feedback) and PR #312 (DatDT Developer capacity) merged normally and were selectively deployed from exact SHA `ccb2fd102b2daacaa3685bcfe671e0772ef1bbc4`.
- CAP/AppRouter/readiness/Web checks pass and effective email routing remains `testMode=false`. No DB deployer, schema, seed, SQL, send-smoke or historical email replay ran.
- IDTS-81 remains In Progress for a fresh authorized email click-test. IDTS-115 remains In Progress for the controlled signed-in mismatch case and previously documented role/browser gaps. Evidence: `docs/pm/evidence/idts-81-115-312/release-20260808.md`.
## 2026-08-22 WP8 Gate 3B source handoff

- The source-only Gate 3B branch `feature/wp8-existing-user-identity-link-donhv` is based exactly on `44b89db5db22e2ea65d4a85d746f57ad3a8f840e`. The bounded re-review at `95772d7` found one recovery-correlation Important and two evidence Minors; source fix `734d625` binds retry/reconcile/expired-lease correlations for `LINK_EXISTING` while preserving ordinary operation behavior. The branch preserves the selected `Users.ID`, profile/responsibility/Bug relationships, and adds provider-read-only `LINK_EXISTING` proof plus fail-closed assignment readiness.
- Runtime CAP/SQLite, full broker/UI dependencies, CAP EDMX/HANA compile, UI lint/build and live provider acceptance remain unverified or environment-blocked. No platform, HANA/HDI, data, provider, email, invitation, user, identity, Role Collection, deployment, merge or Ready mutation occurred.
- Coordinator next approval: read back the exact clean head and review only the `95772d7..new-head` recovery delta. No additional reviewer or Draft PR is authorized in this executor turn; runtime/live Gate 3B acceptance, merge, deployment and Ready remain separate. Gate 4/5 remain unopened.

## Bàn giao source WP8 Gate 3B 2026-08-22

- Branch source-only `feature/wp8-existing-user-identity-link-donhv` dựa chính xác trên `44b89db5db22e2ea65d4a85d746f57ad3a8f840e`. Bounded re-review tại `95772d7` phát hiện 1 Important recovery-correlation và 2 Minor evidence; source fix `734d625` bind correlation retry/reconcile/expired lease cho `LINK_EXISTING` và giữ behavior operation khác. Branch giữ nguyên `Users.ID` được chọn, quan hệ profile/responsibility/Bug và thêm proof `LINK_EXISTING` chỉ đọc provider cùng assignment readiness fail-closed.
- CAP/SQLite runtime, dependency broker/UI đầy đủ, compile CAP EDMX/HANA, UI lint/build và acceptance provider live vẫn chưa verify hoặc đang bị block môi trường. Không có mutation platform, HANA/HDI, data, provider, email, invitation, user, identity, Role Collection, deploy, merge hoặc Ready.
- Approval tiếp theo của coordinator: đọc exact clean head và chỉ review delta `95772d7..new-head`; executor không spawn reviewer thêm và chưa được tạo Draft PR. Runtime/live Gate 3B, merge, deploy và Ready vẫn là bước riêng. Gate 4/5 vẫn chưa mở.

## 2026-08-23 WP8 Gate 4 Developer Responsibilities source gate

- Gate 4 is isolated on `feature/wp8-admin-developer-pilot-donhv` from exact merged Gate 3 evidence base `04643e12727290f2f35fd56e9c3d2a8df4cbcdbc`.
- The source gate reuses the real onboarding, profile-administration, provider-proof completion, Smart Assign and User Administration UI paths. It proves Developer activation stays fail-closed without a complete profile, repeated completion is idempotent, inactive responsibilities disappear from new assignment candidates, and existing Bug assignees are preserved.
- The only product change is User Administration UI hardening: an explicit preservation confirmation, impact copy and a state-bound duplicate-submit guard. The UI content version advances from `1.0.9` to `1.0.10`; no CAP/schema/provider contract changes are added by this Gate 4 delta.
- Next boundary: exact source review, PR/CI/merge, selective User Administration content rollout, then one controlled non-member Developer pilot. Gate 5 remains unopened and no live Developer identity is selected in source evidence.

## 2026-08-23 WP8 Gate 4 live closure

- PR #335 passed CI and merged to `dev` at `7bf7609ca070fae0d467c4964051eee0956828ad`; reviewed User Administration HTML5 content version `1.0.10` was deployed selectively.
- `sap.default` automatic shadow-user creation is enabled with the trust still active and available for user logon. This removes per-user manual shadow creation while Role Collection assignment and CAP activation remain fail-closed.
- The controlled non-member Developer reached ACTIVE with identity link, Ready profile, one responsibility and successful Bug Management access in a fresh session. Repository evidence omits the raw account identifier.
- Gate 4 is complete. Gate 5 Business Catalog Administration remains unopened pending a separate DonHV decision.

## 2026-08-23 WP8 Gate 5 source candidate

- Gate 5 is open source-only from exact `origin/dev` `fd6870585d72ca63e55b744708960b417a2795b9` on `feature/wp8-admin-business-catalogs-donhv`.
- The candidate adds bounded PM + UserAdmin administration for four IDTS business catalogs, optimistic ETags, normalized uniqueness, impact/deactivation guards, no DELETE, sanitized append-only audit, and User Administration UI `1.0.11`.

## 2026-08-23 WP8 Gate 5 HDI simulation

- Gate 5 source merged through PR #337 at `eb0c5d1bc6c92557a7d41e45008240e1e929bc44`.
- Exact archive `19CB2D25210B6200067B61B9F9F5495FEFDC2BC6DD70841BEC583304C79BE9E3` ran one warning-as-error HDI simulation after aggregate duplicate groups returned zero. The terminal make simulated exactly five effective deploy files, zero undeploy, zero warnings, zero dependent redeploy and no CSV/`.hdbtabledata`.
- The exact temporary app/binding/task were cleaned up; main CAP/AppRouter/HDI topology remained unchanged and final readiness was `DEMO READY`.
- The later checksum-bound recovery gate completed the encrypted four-catalog backup/restore rehearsal, exact five-artifact real make and additive four-view recovery. Counts remained `4 / 8 / 8 / 31`, every pre/post digest matched, duplicate groups and new audit rows were zero, and no seed, `.hdbtabledata` or catalog-row DML ran.
- Selective CAP rollout and controlled PM Business Catalog acceptance passed. Four unique rows were created; the Component Category was updated, deactivated, reactivated and finally deactivated; the three parent rows were finally deactivated; zero hard deletes occurred. Final readiness was `DEMO READY`.
- PR #338 records the exact migration and live-acceptance evidence. Exact-head review returned zero Critical/Major/Important/Minor, GitHub QA passed, and a controlled TESTER session proved Bug Management access while direct User Administration navigation returned `Forbidden`. Gate 5 is ready for PR integration; Gate 6 has not opened.

## 2026-08-24 WP8 Gate 6 Operations and Audit source candidate

- Gate 6 is source-only on `feature/wp8-admin-operations-audit-donhv`, frozen from `origin/dev`, local `dev`, and merge-base `aae01e375a15d7664281b8cee35ac16727e696cf`.
- The candidate adds explicit safe delivery, access-operation, audit, and persisted-readiness DTO actions; bounded server paging; safe display masking; 12-character correlation fingerprints; a state-valid optimistic onboarding-delivery retry; and Operations/Audit UI tabs with lazy models and bilingual copy. Existing access Retry/Reconcile guards remain in use.
- No `db/schema.cds` change, generated schema artifact, dependency/version/lockfile change, provider/email outage, provider/data/user/role/credential/Jira/Drive/BTP/HANA/HDI/deployment/merge/Ready mutation occurred. The only local environment workaround is two untracked/excluded NTFS junctions to the exact clean locked root dependency trees; their checksums and targets are recorded in the Gate 6 evidence.
- Root onboarding/access/UI contracts, Gate 6 operations contract, CAP EDMX/HANA compile, UI5 MCP lint, UI lint/build, immediate-kick/source regressions, secret scan, agent rules and QA-depth self-test all pass. The single bounded independent source/security review found 0 Critical/Major and 2 Important findings; both were remediated and covered by fresh focused regressions. Draft PR #339 is open from source head `a9f0896edf8694b2a9a485ad96f52205bfee2df6`; GitHub `qa-depth-gate` passed. Final coordinator exact-head review, later acceptance/rollout, Ready, merge and cleanup remain separate.

## 2026-08-25 WP8 Gate 6.3 Developer workload source handoff

- Gate 6.3 is source-only on `feature/wp8-user-admin-developer-workload-donhv`, frozen from exact `d53f402ab92215e44d29da2e1d3da73a576fffd3` shared by `origin/dev`, local `dev`, merge-base and the initial clean checkout.
- The candidate adds the named read-only BugService `bugApi` model, server-ordered workload paging with global duplicate protection, Developers → Workload overview, bounded assigned non-Closed Bug detail rows, UTC overdue semantics, separate technical/current-action ownership labels, and exact same-origin Bug Object Page links. No `db/`, `srv/`, schema, dependency/lockfile, provider, user/role, data, email or deployment change is included.
- Fresh workload/UI/Active Users/User Access contracts, reused DeveloperWorkloads backend `39/0`, secret scan, agent rules, QA-depth self-test, CAP EDMX/HANA compile, UI5 MCP lint/manifest validation, UI lint/build and prohibited-file diff guards pass. The existing attachment capability warning remains documented and unrelated.
- Source evidence and bilingual mirrors are present. Independent exact-head source/security review, exactly one Draft PR/CI readback, manual/browser acceptance, rollout, Ready, merge and Gate 6.4 remain separate decisions.

## 2026-08-26 WP8 Gate 6.3 authorization remediation handoff

- DonHV authorized a narrow scope expansion after the bounded review found a Major authorization/privacy gap specifically on `DeveloperWorkloads`; ordinary `BugService.Bugs` reads remain outside the finding and remediation.
- `srv/bug-service/monitoring.js` now resolves the active internal actor through existing `resolveRequestUser` and platform-role alignment, gives active PM all rows without `UserAdmin`, scopes active Developers to their resolved `developerUserID` before client search/filter/order/page/count, and fails closed for Tester, UserAdmin without PM, inactive, unmapped and misaligned callers.
- Focused GREEN: `49 PASS / 0 FAIL`. The branch remains source-only from exact `d53f402ab92215e44d29da2e1d3da73a576fffd3`; no db/schema/ordinary Bugs-policy/dependency/lockfile/platform/provider/user/role/data/email/deployment mutation occurred.
- Handoff complete at source/PR boundary: final bounded exact-head review returned `0 Critical / 0 Major / 0 Important / 0 Minor`; branch was pushed, exactly one Draft PR `#349` targets `dev`, remote body validation passed, and GitHub `qa-depth-gate` passed. Runtime/browser acceptance, Ready, merge, rollout, cleanup and Gate 6.4 remain blocked by the explicit stop boundary.

## 2026-08-26 WP8 Gate 6.3 identity-access readiness remediation

- Coordinator Codex Security diff scan on prior exact head `50b68701da8a650917a0a0d218f50632820950fc` reported one medium/high-confidence finding, not zero: `csf_80d41b36a850713c6bbc2a4c`, occurrence `occ_52dec5bce30b309ab47d3757`, rule `ui-readiness.misrepresentation`. The report path, affected lines and TAC-unavailable limitation are recorded in the Gate 6.3 evidence and DonHV status.
- Root cause: browser `Main.controller.js` inferred readiness from active profile plus `developerUserID`. Remediation adds read-only `DeveloperWorkloads.identityAccessReady`, computed server-side through one bounded `readActiveIdentityAccessByUser` call plus `hasActiveIdentityAccess`; exact linked is true, while unlinked, inactive/suspended, missing/mismatched hash, duplicate matching ACTIVE request and unknown legacy rows are false. This remains separate from assignment/workload readiness.
- TDD RED was `56 PASS / 5 FAIL / 61 checks`; focused GREEN is `61 PASS / 0 FAIL / 61 checks`; the UI workload contract, Node syntax and CAP EDMX compile pass. Coordinator’s earlier `49/49` workload-auth, `13/13` XSUAA and UI workload PASS were preserved but did not cover this identity-access invariant.
- The first exact-head review also caught an Important UI contract omission: `WORKLOAD_SELECT` did not request `identityAccessReady`. RED failed, the smallest select-list fix was committed, and the full matrix was rerun green. Fresh review of `44f3a34902f1f3e1b521f7a6f2c0c280b60f0d6d` returned `GO — 0 Critical / 0 Major / 0 Important / 0 Minor`.
- Ordinary `BugService.Bugs` reads are not newly attributed to Gate 6.3 and were not changed. The branch remains source-only; authorized push/PR readback and stop-at-Draft are the remaining boundary. No Ready, merge, deploy, data/provider/user/role/email/Jira/Drive mutation, Gate 6.4 or cleanup.

## 2026-08-26 WP8 Gate 6.3 live Actions-column closure

- English: post-rollout acceptance found an eight-column/nine-cell mismatch that hid `View workload`. PR #351 added the missing localized Workload status column, preserved the existing read-only action and advanced the HTML5 release to `1.0.15`; CI passed and the merge commit is `5812b29f49a8a00ff79a877a347b911b0a851858`.
- English: the checksum-reviewed shared two-app MTAR deployed content-only once. Final readiness is `DEMO READY`; PM browser reacceptance passed for 13 View workload actions, details ownership columns and exact Bug Object Page navigation. No write action or CAP/AppRouter/HANA/provider/user/role/data mutation occurred. Gate 6.3 is complete; Gate 6.4 remains unopened pending new approval.
- Vietnamese: acceptance sau rollout phát hiện mismatch tám cột/chín cell làm ẩn `View workload`. PR #351 thêm cột i18n Workload status còn thiếu, giữ action chỉ đọc hiện có và tăng release HTML5 lên `1.0.15`; CI PASS và merge commit là `5812b29f49a8a00ff79a877a347b911b0a851858`.
- Vietnamese: MTAR shared hai app đã review checksum được deploy content-only đúng một lần. Readiness cuối là `DEMO READY`; browser reacceptance PM PASS cho 13 action View workload, các cột ownership trong details và navigation chính xác tới Bug Object Page. Không có write action hoặc mutation CAP/AppRouter/HANA/provider/user/role/data. Gate 6.3 hoàn tất; Gate 6.4 chưa mở và cần approval mới.
