# Current Project Status

Last updated: 2026-06-03

## Snapshot

| Field | Current value |
| --- | --- |
| Project phase | BRD v1.2, SRS v1.1, and FRS v1.2 SAP490 hybrid deliverables updated with MVP role baseline; ready for mentor review before Sprint 1 |
| Product baseline | BA documentation completed; implementation not started beyond the initial minimal CAP/Fiori scaffold |
| Current sprint | Sprint 1 is planned but not started |
| Recommended next action | Review BRD, SRS, FRS, and the three-role MVP baseline with mentor, resolve open issues, then start Sprint 1 Data Model Foundation |
| Main implementation risk | Current `db/schema.cds` and `srv/service.cds` are far smaller than the agreed MVP domain model |

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
- SAP490 Google Workspace sync workflow is documented in `docs/sap490/sync-workflow.md`; `@googleworkspace/cli` is installed as a dev dependency, safe check/dry-run scripts are available, and OAuth authentication has been verified on the current machine. Other developers still need to run their own local `gws` authentication before sync work.
- Safe `gws` review upload script is available for BRD/SRS/FRS DOCX files. The script creates new timestamped review copies and does not overwrite existing Drive files.
- Safe `gws` Google Sheets review script is available. It creates a new timestamped workbook with Requirement Backlog, Traceability Matrix, Business Rule Matrix, Risk Decision Log, and Open Questions tabs.
- PM status tracking now uses member-owned files: `status/donhv.md`, `status/sangvn.md`, `status/datdt.md`, and `status/nhant.md`.
- SAP490 template inventory is documented in `docs/sap490/template-inventory.md`.

Vietnamese:

- Trạng thái PM hiện dùng file theo từng thành viên: `status/donhv.md`, `status/sangvn.md`, `status/datdt.md`, và `status/nhant.md`.
- Inventory template SAP490 đã được ghi tại `docs/sap490/template-inventory.md`.

## What Is Not Started

- CAP domain model expansion.
- CAP service projections and value helps.
- CAP handler validations for assignment, status transition, nextProcessor, and history logs.
- Fiori Elements annotation and page behavior updates.
- QA test scenarios and automated verification beyond compile/lint checks.

## Member Status Links

| Member | Primary responsibility | Status |
| --- | --- | --- |
| DonHV | Leader, BA/PM, SAP490 deliverables, weekly consolidation, cross-workstream support | `status/donhv.md` |
| SangVN | Backend CAP primary, with shared delivery support when assigned | `status/sangvn.md` |
| DatDT | Fiori/UI5 primary, with shared delivery support when assigned | `status/datdt.md` |
| NhanT | QA/Verification primary, with shared delivery support when assigned | `status/nhant.md` |

Vietnamese:

| Thành viên | Trách nhiệm chính | Status |
| --- | --- | --- |
| DonHV | Leader, BA/PM, deliverable SAP490, tổng hợp hằng tuần, hỗ trợ cross-workstream | `status/donhv.md` |
| SangVN | Phụ trách chính Backend CAP, có thể hỗ trợ delivery chung khi được phân công | `status/sangvn.md` |
| DatDT | Phụ trách chính Fiori/UI5, có thể hỗ trợ delivery chung khi được phân công | `status/datdt.md` |
| NhanT | Phụ trách chính QA/Verification, có thể hỗ trợ delivery chung khi được phân công | `status/nhant.md` |

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
| SRS style | Uses a traditional SRS outline, with requirement quality, traceability, and verification aligned to ISO/IEC/IEEE 29148-style discipline. |
| FRS style | Uses function-detail specifications with workflow diagrams, validations, status effects, history/notification effects, acceptance criteria, and traceability to SRS. |

Vietnamese:

- `Rejected` vẫn là status hợp lệ nhưng không phải final status. Mỗi bug bị Rejected phải có lý do reject, nextProcessor và action tiếp theo rõ ràng.
- Product Discovery đã được thêm như bước BA trước khi viết BRD/SRS/FRS hoặc xử lý requirement chưa rõ.
- BRD v1.2 đang được duy trì trong `docs/ba/brd/` theo hướng SAP490 hybrid, với bản tiếng Anh và tiếng Việt tách riêng, gồm cả Markdown và DOCX.
- Routing cho BA/DOCX deliverable của IDTS đã có tại `.agents/skills/idts-ba-docx-deliverables`, với các external document skills được dùng như nguồn tham khảo phụ.
- Helper fallback Markdown-to-DOCX local hiện giữ Markdown table thành bảng Word thật có thể chỉnh sửa cho các deliverable BA chính thức.

- SRS v1.1 đang được duy trì trong `docs/ba/srs/`; FRS v1.2 đang được duy trì trong `docs/ba/frs/`, với bản tiếng Anh/tiếng Việt tách riêng, gồm cả Markdown và DOCX.
- FRS v1.1 đã sửa lỗi Mermaid syntax ở rejected follow-up sequence và bổ sung workflow diagrams còn thiếu cho create/assign, developer review, request information, retest/closure và PM monitoring.
- BRD v1.2, SRS v1.1 và FRS v1.2 đã cập nhật MVP role baseline thành ba role active: Tester, Developer và PM. Reporter và Admin chưa tách thành role riêng trong MVP.
- Các file DOCX của BRD/SRS/FRS đã được regenerate từ Markdown mới và smoke-test bằng LibreOffice conversion trong thư mục tạm.
- SRS/FRS DOCX đã được smoke-test bằng LibreOffice convert trong thư mục tạm, không tạo PDF trong repo.
- Workflow sync SAP490 Google Workspace đã được document tại `docs/sap490/sync-workflow.md`; `@googleworkspace/cli` đã được cài làm dev dependency, các script check/dry-run an toàn đã có, và OAuth authentication đã verify trên máy hiện tại. Các developer khác vẫn cần tự authenticate `gws` ở local trước khi làm sync.
- Script upload review an toàn bằng `gws` đã có cho các file DOCX BRD/SRS/FRS. Script tạo bản review mới có timestamp và không overwrite file Drive hiện có.
- Script Google Sheets review an toàn bằng `gws` đã có. Script tạo workbook mới có timestamp gồm các tab Requirement Backlog, Traceability Matrix, Business Rule Matrix, Risk Decision Log và Open Questions.

## Next Handover Instruction

Any new agent or developer should identify their member name first, then read this file, `task-board.md`, the relevant member file under `status/*.md`, and the relevant `tasks/*.md` before making changes.

Vietnamese: Agent hoặc developer mới phải xác định tên thành viên trước, sau đó đọc file này, `task-board.md`, file status thành viên tương ứng trong `status/*.md`, và file `tasks/*.md` liên quan trước khi chỉnh sửa.
