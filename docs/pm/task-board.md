# IDTS Task Board

Last updated: 2026-06-05

Use this board for high-level movement only. Detailed task notes belong in the matching file under `docs/pm/tasks/`.

Vietnamese: Chỉ dùng board này để theo dõi trạng thái cấp cao. Chi tiết công việc phải ghi trong file tương ứng dưới `docs/pm/tasks/`.

## Done

| ID | Task | Output |
| --- | --- | --- |
| PM-001 | Create PM delivery pack | `docs/pm/` structure, status files, work packages, Sprint 1 plan |
| BA-001 | Create BA documentation pack | `docs/ba/` baseline |
| BA-002 | Create BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx` |
| BA-003 | Create SRS and FRS deliverables | `docs/ba/srs/`, `docs/ba/frs/` Markdown and DOCX files |
| BA-004 | Align MVP role baseline | Canonical docs, BRD/SRS/FRS, BA support docs, diagrams, and PM handover updated to Tester/Developer/PM |
| WP1 | Data Model Foundation | Expanded CAP CDS model, service projections, and seed data under `db/data/` |
| WP2 | Service and Value Help | OData V4 service actions, value help annotations, and metadata compile completed |
| WP3 | Handler Rules and Validation | CAP handler rules for create/update, assignment, status transition, nextProcessor, history, and notifications completed |

Vietnamese:

| ID | Công việc | Kết quả |
| --- | --- | --- |
| PM-001 | Tạo bộ tài liệu PM | Cấu trúc `docs/pm/`, status files, work packages, kế hoạch Sprint 1 |
| BA-001 | Tạo bộ tài liệu BA | Baseline trong `docs/ba/` |
| BA-002 | Tạo BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx` |
| BA-003 | Tạo SRS và FRS deliverables | Markdown và DOCX trong `docs/ba/srs/`, `docs/ba/frs/` |
| BA-004 | Chốt baseline role MVP | Canonical docs, BRD/SRS/FRS, BA docs, diagrams, và PM handover đã cập nhật về Tester/Developer/PM |
| WP1 | Nền tảng Data Model | CAP CDS model, service projections, và seed data trong `db/data/` |
| WP2 | Service và Value Help | Đã hoàn thành OData V4 service actions, value help annotations và metadata compile |
| WP3 | Handler Rules và Validation | Đã hoàn thành CAP handler rules cho create/update, assignment, status transition, nextProcessor, history và notifications |

## Ready

| ID | Task | Primary member | Support / review | Detail file |
| --- | --- | --- | --- | --- |
| WP5 | Comments and History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |
| WP7 | Notifications and Attachments | SangVN, DatDT | DonHV, NhanT | `tasks/wp7-notification-attachments.md` |
| SP2 | Sprint 02 Mentor Feedback and Happy Flow Demo | DonHV, DatDT | NhanT, SangVN | `07-sprint-2-plan.md` |

Vietnamese:

| ID | Công việc | Thành viên chính | Hỗ trợ / review | File chi tiết |
| --- | --- | --- | --- | --- |
| WP5 | Comments và History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |
| WP7 | Notifications và Attachments | SangVN, DatDT | DonHV, NhanT | `tasks/wp7-notification-attachments.md` |
| SP2 | Sprint 02 Mentor Feedback và Happy Flow Demo | DonHV, DatDT | NhanT, SangVN | `07-sprint-2-plan.md` |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| WP4 | Fiori Elements UX | DatDT | Core List/Object/Create/Assignment/Developer Review metadata is updated; GridTable and draft-enabled Create Bug dialog refinement applied. Deeper QA and attachment upload remain. |

Vietnamese:

| ID | Công việc | Thành viên chính | Ghi chú |
| --- | --- | --- | --- |
| WP4 | Fiori Elements UX | DatDT | Metadata cho List/Object/Create/Assignment/Developer Review đã cập nhật; đã tinh chỉnh GridTable và dialog Create Bug bằng draft. Vẫn còn QA sâu và attachment upload. |

## Blocked

| ID | Task | Blocker | Required decision |
| --- | --- | --- | --- |
| None | None | None | None |

Vietnamese:

| ID | Công việc | Blocker | Quyết định cần có |
| --- | --- | --- | --- |
| None | None | None | None |

## Update Rules

- Move a work package here only after updating its `tasks/*.md` file.
- Keep this board short; avoid detailed implementation logs.
- If multiple developers work at the same time, each should update the matching work package and their own member status file under `status/`.
- DonHV consolidates member updates into shared PM/SAP490 docs after the group work session or weekly review.

Vietnamese:

- Chỉ chuyển trạng thái work package trên board sau khi đã cập nhật file `tasks/*.md` tương ứng.
- Giữ board ngắn gọn, không ghi log implementation chi tiết ở đây.
- Nếu nhiều developer làm cùng lúc, mỗi người cập nhật work package liên quan và file status của chính mình trong `status/`.
- DonHV tổng hợp cập nhật của từng thành viên vào tài liệu PM/SAP490 sau phiên làm việc nhóm hoặc buổi review hằng tuần.
