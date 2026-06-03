# Risk and Decision Log

Last updated: 2026-06-03

## Decisions

| ID | Date | Decision | Reason | Impact |
| --- | --- | --- | --- | --- |
| DEC-001 | 2026-05-28 | Use a split classification model: optional SAP Module, required Application Component, required Defect Category, inferred Component Category. | Avoid mixing SAP business modules with IDTS application features. | Data model and Fiori value helps must support dependent selection. |
| DEC-002 | 2026-05-28 | Use Developer Responsibility as the assignment mapping. | Assignment should be based on capability, not only a free-text developer field. | Assignee value help must filter by Component Category and optional SAP Module. |
| DEC-003 | 2026-05-28 | Keep `nextProcessor` as an automatically maintained action owner or queue. | PM and users need to know who must act next without changing the assignee concept. | CAP handlers must update nextProcessor and history logs on key actions. |
| DEC-004 | 2026-05-28 | Include `Retest Required` in the core status lifecycle. | Resolved does not always mean verified and closed. | Fiori actions and backend transitions must support retest pass/fail. |
| DEC-005 | 2026-05-28 | Split PM status to avoid one shared status file. | Multiple people may work concurrently and should not overwrite one shared status file. | Superseded by DEC-016, which uses member-owned status files instead of workstream-owned files. |
| DEC-006 | 2026-05-28 | Do not expand MVP into Jira, SAP Cloud ALM, SAP Solution Manager, CI/CD, source code management, or code review. | Keep scope aligned with the educational IDTS project. | Advanced enterprise features stay out of scope unless explicitly approved later. |
| DEC-007 | 2026-05-28 | Use SAP490 school deliverable templates as the external reporting baseline, but adapt ABAP-centric sections to SAP CAP/Fiori with supervisor confirmation. | The official SAP490 guide expects SAP configuration and SAP coding, while IDTS is implemented with SAP CAP Node.js and Fiori. | Final report and test evidence must map IDTS CAP/Fiori artifacts back to the required SAP490 chapters and templates. |
| DEC-008 | 2026-06-01 | Keep `Rejected` as a valid bug status, but define it as a follow-up status rather than a final state. | Mentor confirmed rejection is acceptable only when the following steps and responsible owner are explicit. | CAP handlers, Fiori actions, status matrix, and PM monitoring must require rejection reason, nextProcessor, and follow-up transition. |
| DEC-009 | 2026-06-01 | Use Product Discovery as the intake workflow for unclear IDTS requirements before BRD/SRS/FRS, diagrams, or implementation. | The team needs a repeatable BA method to avoid solution bias and scope creep. | New or unclear requirements should create discovery findings under `docs/ba/discovery/` before being promoted into specs or implementation tasks. |
| DEC-010 | 2026-06-01 | Store formal BRD/SRS/FRS deliverables in separate folders with separate English and Vietnamese markdown and DOCX files. | The team wants formal documents to be easier to review, submit, and maintain by language. | BRD uses `docs/ba/brd/`; SRS and FRS should follow the same folder and file pattern later. |
| DEC-011 | 2026-06-01 | Use SAP490 hybrid style for BRD/SRS/FRS: BRD stays business-first with light SAP implementation context, while SRS/FRS carry detailed technical and functional behavior. | The mentor needs SAP relevance, but BRD should not become a technical design document. | BRD v1.1 reduces technical depth and adds stakeholder needs, KPI, RACI, NFR, glossary, approval, and traceability. |
| DEC-012 | 2026-06-02 | Use `idts-ba-docx-deliverables` as the primary routing skill for IDTS BRD/SRS/FRS Markdown and DOCX work; use external document skills only as secondary references. | The team installed multiple external document skills, but IDTS needs SAP490 hybrid, language-split, and project-specific scope control. | Future BRD/SRS/FRS work should start with the IDTS skill, then selectively use `brd-creation`, `srs-documentation`, `frs-creation`, `docx`, and `docx-manipulation`. |
| DEC-013 | 2026-06-02 | Use a traditional SRS outline aligned with ISO/IEC/IEEE 29148-style requirement quality, and use FRS as the detailed functional workflow specification with diagrams and traceability. | The project needs mentor-readable documents while avoiding obsolete IEEE 830-only framing and keeping implementation details structured. | SRS v1.0 and FRS v1.0 become the requirement baseline for Sprint 1 planning, QA test design, and CAP/Fiori implementation traceability. |
| DEC-014 | 2026-06-03 | Use three active MVP roles: Tester, Developer, and PM. Reporter and Admin are not separate MVP roles. | The project is internal, Tester is the primary person who finds/reports bugs, and no dedicated Admin workflow is currently planned. | Canonical docs, BRD/SRS/FRS, BA support docs, diagrams, authorization rules, and PM handover must use Tester/Developer/PM as active roles. Reporter and Admin can be reconsidered after MVP if external reporting or formal admin flows are added. |
| DEC-015 | 2026-06-03 | Use `gws` as the preferred repeatable automation layer for SAP490 Google Drive/Docs/Sheets sync after installation and configuration; keep the Google Drive connector as the interactive Codex fallback. | The team has multiple developers and needs repeatable commands that can run outside one chat thread. | Repository Markdown remains the source of truth; DOCX/XLSX are generated local artifacts; Google Docs/Sheets are review copies. Sync rules are documented in `docs/sap490/sync-workflow.md`. |
| DEC-016 | 2026-06-03 | Use member-owned PM status files: DonHV, SangVN, DatDT, and NhanT. | The team wants each member to update their own work log to reduce merge conflicts and make weekly consolidation easier. | New threads must ask the user identity first, then read/update the matching file under `docs/pm/status/`. DonHV owns BA/PM consolidation and may support other lanes. |

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-001 | Current CAP model is too small for MVP. | High | High | Start Sprint 1 with CDS model foundation before Fiori work. |
| RISK-002 | Team may confuse SAP Module with IDTS feature/module. | Medium | High | Use glossary, data dictionary, and UI labels consistently. |
| RISK-003 | nextProcessor may be misunderstood as a second assignee. | Medium | Medium | Keep UI and docs clear: assignee owns technical work, nextProcessor shows the next action owner. |
| RISK-004 | Parallel edits may create merge conflicts in status docs. | Medium | Medium | Use one status file per member, one task file per work package, and DonHV-only consolidation for shared docs/Sheets/Excel. |
| RISK-005 | Fiori work may start before model/service value helps are stable. | Medium | High | Gate Fiori implementation behind WP1 and WP2. |
| RISK-006 | Overengineering could turn IDTS into a full ITSM or Jira clone. | Medium | High | Check changes against BA scope and out-of-scope list before implementation. |
| RISK-007 | SAP490 guide may be interpreted as requiring classic SAP configuration and ABAP deliverables, while IDTS is a SAP CAP/Fiori project. | Medium | High | Confirm with supervisor that SAP BTP/CAP/Fiori artifacts satisfy SAP Coding, and add a mapping table from SAP490 sections to IDTS deliverables. |
| RISK-008 | Rejected bugs may be left without a clear owner or next action. | Medium | High | Enforce rejection reason, nextProcessor, notification, history log, and allowed follow-up transitions in backend and UI. |
| RISK-009 | Product Discovery may slow down simple confirmed work if applied too heavily. | Low | Medium | Use it for new, unclear, or business-impacting requests; skip it for trivial factual answers and already-confirmed implementation tasks. |
| RISK-010 | Google Docs/Sheets review copies may drift from repository Markdown if feedback is edited directly in Google Workspace and not synced back. | Medium | High | Update repository Markdown first, regenerate local DOCX/XLSX, then sync Google copies. Use `docs/sap490/sync-workflow.md` and avoid committing local Google credentials or Drive IDs. |

Vietnamese:

- Quyết định DEC-008: giữ `Rejected` là status hợp lệ, nhưng đây là trạng thái cần follow-up, không phải trạng thái kết thúc.
- Rủi ro RISK-008: bug bị Rejected có thể bị bỏ lửng nếu không có owner/action tiếp theo; cần enforce reason, nextProcessor, notification, history log và transition follow-up.
- Quyết định DEC-009: dùng Product Discovery làm workflow intake cho requirement chưa rõ trước khi viết BRD/SRS/FRS, diagram hoặc implementation.
- Rủi ro RISK-009: Product Discovery có thể làm chậm việc đơn giản nếu dùng quá nặng; chỉ dùng cho request mới, chưa rõ hoặc có tác động nghiệp vụ.
- Quyết định DEC-010: BRD/SRS/FRS được lưu trong folder riêng, tách file tiếng Anh và tiếng Việt, đồng thời có DOCX khi được yêu cầu.
- Quyết định DEC-011: BRD/SRS/FRS dùng hướng SAP490 hybrid; BRD ưu tiên nghiệp vụ và chỉ giữ bối cảnh SAP ngắn gọn, còn SRS/FRS sẽ chứa hành vi functional/technical chi tiết.
- Quyết định DEC-012: dùng `idts-ba-docx-deliverables` làm skill routing chính cho BRD/SRS/FRS Markdown và DOCX của IDTS; các external document skills chỉ là nguồn tham khảo phụ.

- Quyết định DEC-013: dùng cấu trúc SRS truyền thống nhưng chất lượng requirement, traceability và verification theo hướng ISO/IEC/IEEE 29148; dùng FRS làm đặc tả functional workflow chi tiết có diagram và traceability để chuẩn bị Sprint 1, QA test design và CAP/Fiori implementation.
- Quyết định DEC-014: MVP chỉ dùng ba role active là Tester, Developer và PM. Reporter và Admin chưa tách thành role riêng vì dự án dùng nội bộ, Tester là người chính báo cáo bug và hiện chưa có workflow Admin chuyên biệt.
- Quyết định DEC-015: dùng `gws` làm lớp automation sync SAP490 Google Drive/Docs/Sheets khi đã cài và cấu hình; Google Drive connector vẫn là fallback tương tác trong Codex.
- Rủi ro RISK-010: Google Docs/Sheets có thể lệch source trong repo nếu mentor/team sửa trực tiếp mà không sync ngược về Markdown; cần cập nhật Markdown trước, regenerate DOCX/XLSX rồi mới sync lại bản Google.

- Quyết định DEC-016: dùng file PM status theo từng thành viên gồm DonHV, SangVN, DatDT và NhanT. Thread mới phải hỏi user là thành viên nào trước, sau đó đọc/cập nhật đúng file trong `docs/pm/status/`. DonHV chịu trách nhiệm tổng hợp BA/PM và có thể hỗ trợ các mảng khác.
- Rủi ro RISK-004: nhiều người chỉnh song song có thể gây conflict; giảm rủi ro bằng file status theo từng thành viên, file task theo từng work package và để DonHV tổng hợp tài liệu/shared Sheets/Excel.

## Decision Update Rule

Record a new decision here when it changes scope, ownership, entity meaning, status lifecycle, assignment behavior, or delivery plan. If the decision changes business meaning, also update the canonical business documents required by `AGENTS.md`.
