# IDTS PM Delivery Pack

This folder is the project management working area for IDTS. It turns the BA baseline in `docs/ba/` into executable delivery scope, work packages, sprint planning, status tracking, risks, and decisions.

## Reading Order

1. `current-status.md` - start here in every new chat thread or handover.
2. `task-board.md` - current work state by work package.
3. `status/` - member-specific updates that reduce merge conflicts.
4. `01-mvp-scope-freeze.md` - agreed MVP boundary.
5. `02-work-breakdown-structure.md` - delivery work packages and dependencies.
6. `03-delivery-roadmap.md` - recommended delivery sequence.
7. `04-mvp-release-plan.md` - MVP release content and demo scenario.
8. `05-definition-of-done.md` - completion criteria by artifact type.
9. `06-sprint-1-plan.md` - first implementation sprint.
10. `risk-decision-log.md` - durable risks and decisions.

## Collaboration Rules

- Treat `current-status.md` as the short handover file, not a detailed task log.
- At the start of a new chat thread or handover, identify the active team member: `donhv`, `sangvn`, `datdt`, or `nhant`.
- Update only your member status file under `status/`.
- Update task details in the matching file under `tasks/`.
- Do not overwrite another member's status file unless you are explicitly coordinating that work or DonHV is consolidating/supporting the work.
- Each member status update must clearly record what was done, what is completed, blockers, bugs/errors found, fix status, verification evidence, and next handoff.
- DonHV consolidates weekly or group-session updates into shared docs, SAP490 deliverables, Google Sheets, and Excel files.
- Record durable scope, flow, or ownership decisions in `risk-decision-log.md`.
- If a decision changes business meaning, update the canonical business files listed in `AGENTS.md`.

Vietnamese:

- Khi bắt đầu thread mới hoặc handover mới, xác định thành viên đang làm việc: `donhv`, `sangvn`, `datdt`, hoặc `nhant`.
- Chỉ cập nhật file status của chính thành viên đó trong `status/`.
- Cập nhật chi tiết task trong file tương ứng dưới `tasks/`.
- Không ghi đè file status của thành viên khác trừ khi đang phối hợp rõ ràng hoặc DonHV đang tổng hợp/hỗ trợ.
- Mỗi status update phải ghi rõ đã làm gì, hoàn thành phần nào, blocker, bug/error phát hiện, trạng thái fix, bằng chứng verify và handoff tiếp theo.
- DonHV tổng hợp cập nhật theo tuần hoặc theo phiên làm việc nhóm vào tài liệu chung, deliverable SAP490, Google Sheets và file Excel.

## Member Responsibilities

| Member | Status file | Main responsibility |
| --- | --- | --- |
| DonHV | `status/donhv.md` | Leader, BA/PM, SAP490 deliverables, weekly consolidation, cross-workstream support |
| SangVN | `status/sangvn.md` | Backend CAP primary; may also receive Fiori/UI5 or QA tasks as assigned |
| DatDT | `status/datdt.md` | Fiori/UI5 primary; may also receive Backend CAP or QA tasks as assigned |
| NhanT | `status/nhant.md` | QA/Verification primary; may also receive Backend CAP or Fiori/UI5 tasks as assigned |

Vietnamese:

| Thành viên | File status | Trách nhiệm chính |
| --- | --- | --- |
| DonHV | `status/donhv.md` | Leader, BA/PM, deliverable SAP490, tổng hợp hằng tuần, hỗ trợ cross-workstream |
| SangVN | `status/sangvn.md` | Phụ trách chính Backend CAP; có thể nhận thêm Fiori/UI5 hoặc QA khi được phân công |
| DatDT | `status/datdt.md` | Phụ trách chính Fiori/UI5; có thể nhận thêm Backend CAP hoặc QA khi được phân công |
| NhanT | `status/nhant.md` | Phụ trách chính QA/Verification; có thể nhận thêm Backend CAP hoặc Fiori/UI5 khi được phân công |

## Current Delivery Principle

Build the smallest maintainable MVP that supports the documented IDTS core flows. Do not expand the product into Jira, SAP Cloud ALM, SAP Solution Manager, CI/CD, code review, or source code management.
