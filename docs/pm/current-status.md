# Current Project Status

Last updated: 2026-06-10

## Snapshot

| Field | Current value |
| --- | --- |
| Project phase | Sprint 02 implementation underway after mentor feedback; WP1, WP2, and WP3 MVP implementation completed; WP4 core Fiori screens updated |
| Product baseline | BA documentation completed; CAP data model foundation now implemented beyond the initial scaffold |
| Current sprint | Sprint 02 focuses on mentor feedback, happy flow demo, backend note/reason validation, and Bug Detail UI refinements |
| Recommended next action | Continue NhanT `IDTS-3` validation, FE Bug Detail tasks for DatDT/SangVN, and use DonHV `IDTS-5` for backend QA bug fixes |
| Main implementation risk | Fiori screens and backend handlers now exist, but deeper browser QA, real attachment upload, external notification delivery, production XSUAA authorization, and automated tests are still incomplete |

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
- Optional Learning Recap / Mentor Mode is available through `.agents/skills/learning-recap` and AGENTS.md routing for nontrivial tasks.
- SRS/FRS embedded Mermaid diagrams were extracted into `docs/diagrams/07-srs-system-context.md` and `docs/diagrams/08-frs-functional-workflows.md`.
- Database modeling support is available through `.agents/skills/idts-database-modeling` and installed `database-schema-design`; the current model review is documented in `docs/ba/09-database-model-review.md`.
- WP1 database modeling decisions DB-Q01 to DB-Q08 are baselined in `docs/ba/09-database-model-review.md` and synced to the canonical IDTS docs.
- WP1 Data Model Foundation is implemented in `db/schema.cds`, `srv/service.cds`, and `db/data/`; CAP compile and SQLite in-memory deploy both pass.
- WP2 Service and Value Help is implemented for Sprint 1 MVP: bound bug lifecycle actions and Fiori value help annotations are exposed in OData V4 metadata.
- WP3 Handler Rules and Validation is implemented for Sprint 1 MVP: create/update validation, assignment responsibility checks, status transition validation, nextProcessor automation, history logs, and notification records are handled in `srv/service.js`.
- DatDT's `Sap_FE` reference repo was reviewed and useful List Report/Object Page ideas were integrated into the existing CAP/Fiori app.
- WP4 Fiori Elements core screens are updated: list filters/table columns, object page sections, value helps, object page actions, semantic criticality, rejected follow-up fields, and child sections for comments, attachments, history, and notifications.
- Four IDTS-aligned demo bug records were added under `db/data/idts.cap-Bugs.csv`, and browser smoke verification shows the List Report rendering 4 rows after pressing `Go`.
- Mentor feedback for Sprint 02 is baselined: developers may view/discuss team-visible bugs, primary lifecycle actions remain controlled, developer notes are optional by default, selected transitions require note/reason, and Bug Detail UI should prioritize assignee/status and key input fields.
- Sprint 02 plan is documented in `docs/pm/07-sprint-2-plan.md`. Jira issues `IDTS-1` to `IDTS-12` are assigned: DonHV owns Backend CAP lead/bug fixing, NhanT owns validation/QA/demo smoke testing, DatDT owns core Bug Detail layout/input usability, and SangVN owns status value help plus supporting field/comment usability.
- Sprint 02 backend implementation has started. Jira `IDTS-2` and `IDTS-4` are Done; Jira `IDTS-5` is In Progress as the backend QA bug-fix bucket.
- `srv/service.js` now keeps developer view/discussion open while enforcing processing actions for assigned Developer, Tester, or PM when request user is known.
- Bound action side effects now log `nextProcessorUser` and `nextProcessorRole` changes and create in-app notification records for resolved, retest-required, and reopened follow-up.

Vietnamese:

- WP1 Data Model Foundation đã được implement trong `db/schema.cds`, `srv/service.cds` và `db/data/`; CAP compile và SQLite in-memory deploy đều pass.
- WP2 Service và Value Help đã hoàn thành ở mức Sprint 1 MVP: OData V4 metadata có bound lifecycle actions và Fiori value help annotations.
- WP3 Handler Rules và Validation đã hoàn thành ở mức Sprint 1 MVP: `srv/service.js` xử lý create/update validation, assignment responsibility checks, status transition validation, nextProcessor automation, history logs và notification records.
- WP4 core Fiori screens đã cập nhật: List Report, Object Page, Create metadata, Assignment value help/actions, Developer Review actions, Rejected follow-up, History và Notifications sections.
- Feedback mentor cho Sprint 02 đã được baseline: developer có thể xem/thảo luận bug trong team, lifecycle action chính vẫn kiểm soát, developer note mặc định optional, một số transition bắt buộc note/reason, và Bug Detail UI cần ưu tiên assignee/status cùng các field nhập quan trọng.
- Sprint 02 plan được ghi tại `docs/pm/07-sprint-2-plan.md`. Jira issues `IDTS-1` đến `IDTS-12` đã được assign: DonHV phụ trách Backend CAP lead/bug fixing, NhanT phụ trách validation/QA/demo smoke test, DatDT phụ trách core Bug Detail layout/input usability, và SangVN phụ trách status value help cùng supporting field/comment usability.
- Sprint 02 backend implementation đã bắt đầu. Jira `IDTS-2` và `IDTS-4` đã Done; Jira `IDTS-5` đang In Progress như bucket bug-fix backend từ QA.
- `srv/service.js` hiện vẫn cho developer xem/thảo luận bug trong team, nhưng kiểm soát action xử lý workflow cho Developer được assign, Tester hoặc PM khi xác định được request user.
- Side effect của bound action hiện ghi log thay đổi `nextProcessorUser` và `nextProcessorRole`, đồng thời tạo notification record cho follow-up của resolved, retest-required và reopened.

- Trạng thái PM hiện dùng file theo từng thành viên: `status/donhv.md`, `status/sangvn.md`, `status/datdt.md`, và `status/nhant.md`.
- Inventory template SAP490 đã được ghi tại `docs/sap490/template-inventory.en.md` và `docs/sap490/template-inventory.vi.md`.
- SAP490 Blueprint draft v0.1 đã có thành hai file DOCX copy từ template Blueprint của trường rồi fill trực tiếp: `docs/sap490/generated/Blueprint_IDTS_SAP01_en_v0.1.docx` và `docs/sap490/generated/Blueprint_IDTS_SAP01_vi_v0.1.docx`.
- Learning Recap / Mentor Mode tùy chọn đã có trong `.agents/skills/learning-recap` và được route trong AGENTS.md cho các task không tầm thường.

- Mermaid diagram nhúng trong SRS/FRS đã được tách ra `docs/diagrams/07-srs-system-context.md` và `docs/diagrams/08-frs-functional-workflows.md`.
- Hỗ trợ database modeling đã có qua `.agents/skills/idts-database-modeling` và `database-schema-design` đã cài; review model hiện tại được ghi trong `docs/ba/09-database-model-review.md`.
- Các quyết định database DB-Q01 đến DB-Q08 cho WP1 đã được baseline trong `docs/ba/09-database-model-review.md` và sync vào các IDTS canonical docs.

## What Is Not Started

- Real attachment upload/storage behavior.
- External notification delivery beyond persisted notification records.
- Production XSUAA role collections and deployment-level authorization hardening.
- Deeper QA scenarios and automated verification beyond compile/build/API/browser smoke checks.

## Member Status Links

| Member | Primary responsibility | Status |
| --- | --- | --- |
| DonHV | Leader, Backend CAP lead for Sprint 02, backend bug fixing, weekly consolidation, cross-workstream support | `status/donhv.md` |
| SangVN | Fiori/UI5 support for Sprint 02, with shared delivery support when assigned | `status/sangvn.md` |
| DatDT | Fiori/UI5 primary, with shared delivery support when assigned | `status/datdt.md` |
| NhanT | Backend verification and QA primary for Sprint 02, with shared delivery support when assigned | `status/nhant.md` |

Vietnamese:

| Thành viên | Trách nhiệm chính | Status |
| --- | --- | --- |
| DonHV | Leader, Backend CAP lead cho Sprint 02, backend bug fixing, tổng hợp hằng tuần, hỗ trợ cross-workstream | `status/donhv.md` |
| SangVN | Hỗ trợ Fiori/UI5 cho Sprint 02, có thể hỗ trợ delivery chung khi được phân công | `status/sangvn.md` |
| DatDT | Phụ trách chính Fiori/UI5, có thể hỗ trợ delivery chung khi được phân công | `status/datdt.md` |
| NhanT | Phụ trách backend verification và QA cho Sprint 02, có thể hỗ trợ delivery chung khi được phân công | `status/nhant.md` |

## Current Decisions

| Decision | Current position |
| --- | --- |
| MVP scope | Focus on bug creation, classification, assignment, developer review, status lifecycle, comments, history, notifications records, and PM monitoring. |
| SAP Module | Optional business context, not the same as an IDTS feature/module. |
| Application Component | Required place where the bug appears. |
| Defect Category | Required defect type or technical layer. |
| Component Category | Valid pair of Application Component and Defect Category. |
| Developer Responsibility | Maps Developer to Component Category, optionally scoped by SAP Module. |
| nextProcessor | System-maintained current action owner or queue; not a second assignee. |
| Retest Required | Kept as a core status between Resolved and Closed when verification is needed. |
| Rejected | Kept as a valid follow-up status; must have rejection reason, nextProcessor, and next action. |
| MVP roles | Three active roles: Tester, Developer, and PM. Reporter and Admin are not separate MVP roles. |
| Developer visibility | Developers may view and discuss team-visible bugs, but workflow processing is restricted to assigned Developer, Tester, or PM when request user is known. |
| SRS style | Uses a traditional SRS outline, with requirement quality, traceability, and verification aligned to ISO/IEC/IEEE 29148-style discipline. |
| FRS style | Uses function-detail specifications with workflow diagrams, validations, status effects, history/notification effects, acceptance criteria, and traceability to SRS. |
| WP1-WP3 implementation | CAP model foundation, service/value help, and MVP runtime business validation are complete. |

Vietnamese:

- `Rejected` vẫn là status hợp lệ nhưng không phải final status. Mỗi bug bị Rejected phải có lý do reject, nextProcessor và action tiếp theo rõ ràng.
- Developer có thể xem và thảo luận bug trong team, nhưng action xử lý workflow vẫn bị giới hạn cho Developer được assign, Tester hoặc PM khi xác định được request user.
- Product Discovery đã được thêm như bước BA trước khi viết BRD/SRS/FRS hoặc xử lý requirement chưa rõ.
- BRD v1.2 đang được duy trì trong `docs/ba/brd/` theo hướng SAP490 hybrid, với bản tiếng Anh và tiếng Việt tách riêng, gồm cả Markdown và DOCX.
- Routing cho BA/DOCX deliverable của IDTS đã có tại `.agents/skills/idts-ba-docx-deliverables`, với các external document skills được dùng như nguồn tham khảo phụ.
- Helper fallback Markdown-to-DOCX local hiện giữ Markdown table thành bảng Word thật có thể chỉnh sửa cho các deliverable BA chính thức.

- SRS v1.1 đang được duy trì trong `docs/ba/srs/`; FRS v1.2 đang được duy trì trong `docs/ba/frs/`, với bản tiếng Anh/tiếng Việt tách riêng, gồm cả Markdown và DOCX.
- FRS v1.1 đã sửa lỗi Mermaid syntax ở rejected follow-up sequence và bổ sung workflow diagrams còn thiếu cho create/assign, developer review, request information, retest/closure và PM monitoring.
- BRD v1.2, SRS v1.1 và FRS v1.2 đã cập nhật MVP role baseline thành ba role active: Tester, Developer và PM. Reporter và Admin chưa tách thành role riêng trong MVP.
- Các file DOCX của BRD/SRS/FRS đã được regenerate từ Markdown mới và smoke-test bằng LibreOffice conversion trong thư mục tạm.
- SRS/FRS DOCX đã được smoke-test bằng LibreOffice convert trong thư mục tạm, không tạo PDF trong repo.
- Workflow sync SAP490 Google Workspace đã được document tại `docs/sap490/sync-workflow.en.md` và `docs/sap490/sync-workflow.vi.md`; `@googleworkspace/cli` đã được cài làm dev dependency, các script check/dry-run an toàn đã có, và OAuth authentication đã verify trên máy hiện tại. Các developer khác vẫn cần tự authenticate `gws` ở local trước khi làm sync.
- Script upload review an toàn bằng `gws` đã có cho các file DOCX BRD/SRS/FRS. Script tạo bản review mới có timestamp và không overwrite file Drive hiện có.
- Script Google Sheets review an toàn bằng `gws` đã có. Script tạo workbook mới có timestamp gồm các tab Requirement Backlog, Traceability Matrix, Business Rule Matrix, Risk Decision Log và Open Questions.

## WP4 Current Note

DatDT's `Sap_FE` reference repo has been reviewed. The current IDTS Fiori app now has MVP annotation-driven List Report/Object Page integration, value help, Object Page actions, GridTable list layout, draft-enabled standard Create, and Create Bug dialog support. Deeper browser QA and real attachment upload remain open.

Vietnamese: Đã review repo tham khảo `Sap_FE` của DatDT. App Fiori hiện tại của IDTS đã có tích hợp List Report/Object Page bằng annotation ở mức MVP, value help, Object Page actions, layout List Report dạng GridTable, standard Create đã bật bằng draft, và hỗ trợ dialog Create Bug. Browser QA sâu hơn và upload attachment thật vẫn còn mở.

## Next Handover Instruction

Any new agent or developer should identify their member name first, then read this file, `task-board.md`, the relevant member file under `status/*.md`, and the relevant `tasks/*.md` before making changes.

Vietnamese: Agent hoặc developer mới phải xác định tên thành viên trước, sau đó đọc file này, `task-board.md`, file status thành viên tương ứng trong `status/*.md`, và file `tasks/*.md` liên quan trước khi chỉnh sửa.
