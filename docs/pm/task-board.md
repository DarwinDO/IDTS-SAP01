# IDTS Task Board

Last updated: 2026-06-03

Use this board for high-level movement only. Detailed task notes belong in the matching file under `tasks/`.

## Done

| ID | Task | Output |
| --- | --- | --- |
| PM-001 | Create PM delivery pack | `docs/pm/` structure, status files, work packages, Sprint 1 plan |
| BA-001 | Create BA documentation pack | `docs/ba/` baseline |
| BA-002 | Create BRD deliverables | `docs/ba/brd/brd.en.md`, `docs/ba/brd/brd.vi.md`, `docs/ba/brd/brd.en.docx`, `docs/ba/brd/brd.vi.docx` |
| BA-003 | Create SRS and FRS deliverables | `docs/ba/srs/`, `docs/ba/frs/` Markdown and DOCX files |
| BA-004 | Align MVP role baseline | Canonical docs, BRD/SRS/FRS, BA support docs, diagrams, and PM handover updated to Tester/Developer/PM |

## Ready

| ID | Task | Primary member | Support / review | Detail file |
| --- | --- | --- | --- | --- |
| WP1 | Data Model Foundation | SangVN | DonHV, NhanT | `tasks/wp1-data-model.md` |
| WP2 | Service and Value Help | SangVN | DatDT, DonHV, NhanT | `tasks/wp2-service-value-help.md` |
| WP3 | Handler Rules and Validation | SangVN | DonHV, NhanT | `tasks/wp3-handlers-validation.md` |
| WP4 | Fiori Elements UX | DatDT | DonHV, NhanT | `tasks/wp4-fiori-elements.md` |
| WP5 | Comments and History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |
| WP7 | Notifications and Attachments | SangVN, DatDT | DonHV, NhanT | `tasks/wp7-notification-attachments.md` |

Vietnamese:

| ID | Công việc | Thành viên chính | Hỗ trợ / review | File chi tiết |
| --- | --- | --- | --- | --- |
| WP1 | Nền tảng Data Model | SangVN | DonHV, NhanT | `tasks/wp1-data-model.md` |
| WP2 | Service và Value Help | SangVN | DatDT, DonHV, NhanT | `tasks/wp2-service-value-help.md` |
| WP3 | Handler Rules và Validation | SangVN | DonHV, NhanT | `tasks/wp3-handlers-validation.md` |
| WP4 | Fiori Elements UX | DatDT | DonHV, NhanT | `tasks/wp4-fiori-elements.md` |
| WP5 | Comments và History | SangVN, DatDT | DonHV, NhanT | `tasks/wp5-comments-history.md` |
| WP6 | PM Monitoring | DatDT, SangVN | DonHV, NhanT | `tasks/wp6-pm-monitoring.md` |
| WP7 | Notifications và Attachments | SangVN, DatDT | DonHV, NhanT | `tasks/wp7-notification-attachments.md` |

## In Progress

| ID | Task | Primary member | Note |
| --- | --- | --- | --- |
| None | None | None | Start WP1 after PM pack review. |

## Blocked

| ID | Task | Blocker | Required decision |
| --- | --- | --- | --- |
| None | None | None | None |

## Update Rules

- Move a work package here only after updating its `tasks/*.md` file.
- Keep this board short; avoid detailed implementation logs.
- If multiple developers work at the same time, each should update the matching work package and their own member status file under `status/`.
- DonHV consolidates member updates into shared PM/SAP490 docs after the group work session or weekly review.

Vietnamese:

- Chỉ chuyển work package trên board sau khi đã cập nhật file `tasks/*.md` tương ứng.
- Giữ board ngắn gọn, không ghi log implementation chi tiết ở đây.
- Nếu nhiều developer làm cùng lúc, mỗi người cập nhật work package liên quan và file status của chính mình trong `status/`.
- DonHV tổng hợp cập nhật của từng thành viên vào tài liệu PM/SAP490 sau phiên làm việc nhóm hoặc buổi review hằng tuần.
