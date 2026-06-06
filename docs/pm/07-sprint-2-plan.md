# Sprint 02 Plan - Mentor Feedback and Happy Flow Demo

Last updated: 2026-06-06

## English

## Sprint Goal

Deliver a mentor-demo-ready happy flow for one bug after the latest mentor feedback: create a bug, classify it, assign it, allow team-visible discussion, update status through controlled backend rules, require note/reason only where needed, and improve the Bug Detail UI for practical use.

## Sprint Window

Planned duration: 2 weeks.

Suggested calendar: 2026-06-05 to 2026-06-18.

## Mentor Feedback Baseline

The mentor has accepted the core rules and diagrams, so Sprint 02 should focus on implementation instead of redrawing accepted analysis artifacts.

Confirmed changes:

- Developers may view and discuss bugs in the same project/team when they have visibility permission.
- Bugs should not be private only to the assigned developer.
- Primary lifecycle-changing actions remain controlled by the assignee or an authorized role.
- Developer note is optional by default.
- Note/reason is required only for selected transitions:
  - `Assigned` / `In Review` / `In Progress` -> `Need More Information`.
  - `Assigned` / `In Review` / `In Progress` -> `Rejected`.
  - `In Progress` -> `Resolved`.
  - `Resolved` -> `Reopened`.
- Bug Detail UI should prioritize assignee and status, use dropdown/value help for status editing, group important fields for fast entry, and move severity/environment to a supporting or right-side area where possible.

## Team Allocation

| Member | Sprint 02 Role | Main Responsibility | Secondary Responsibility |
| --- | --- | --- | --- |
| DonHV | Backend CAP lead | Backend business rules, CAP service/handler updates, backend bug fixing, Jira/PM coordination | Support BA/PM documentation sync when mentor feedback changes business meaning |
| NhanT | Backend verification / QA | API/manual verification, regression checks, test data, bug reporting with evidence | Support backend validation review |
| DatDT | Fiori/UI5 lead | Bug Detail layout redesign, Object Page/Create/Edit usability, Fiori Elements annotations | Browser smoke test for UI flows |
| SangVN | Fiori/UI5 support | Status dropdown/value help UX, comment/developer note usability, UI issue fixing support | Support FE regression and demo polish |

## Work Breakdown

| ID | Work Item | Owner | Support | Output |
| --- | --- | --- | --- | --- |
| S2-BE-01 | Refine developer visibility and processing permission model | DonHV | NhanT | Backend rule design for view/discuss vs process actions |
| S2-BE-02 | Implement mandatory note/reason validation for selected transitions | NhanT | DonHV | CAP handler validates required reasons only for mentor-confirmed transitions |
| S2-BE-03 | Ensure history, nextProcessor, and notification side effects remain correct | DonHV | NhanT | Status changes produce correct audit/history and next owner |
| S2-BE-04 | Fix backend bugs found during Sprint 02 QA | DonHV | NhanT | Backend bug fixes with evidence in DonHV status file |
| S2-QA-01 | Create happy-flow verification checklist | NhanT | DonHV | Checklist for create -> assign -> review -> request/reject/resolve |
| S2-QA-02 | Execute backend/API regression checks | NhanT | DonHV | Pass/fail evidence and bug reports for DonHV |
| S2-FE-01 | Redesign Bug Detail field layout | DatDT | SangVN | Assignee/status prioritized; important fields grouped |
| S2-FE-02 | Make editable status a dropdown/value help | SangVN | DatDT | No free-text status editing in edit mode |
| S2-FE-03 | Improve input usability for important fields | DatDT | SangVN | Title, status, assignee, priority, application component, defect category, steps/actual/expected easy to enter |
| S2-FE-04 | Move severity and environment to supporting area | SangVN | DatDT | Layout is more balanced and easier to scan |
| S2-FE-05 | Improve comments/developer note section usability | SangVN | DatDT | Discussion and optional developer note are usable from Bug Detail |
| S2-DEMO-01 | Prepare mentor demo script and final smoke test | NhanT | DonHV, DatDT, SangVN | Demo flow, screenshots, and final known-issue list |

## Week 1 Plan

| Day | DonHV | NhanT | DatDT | SangVN |
| --- | --- | --- | --- | --- |
| Day 1 | Sync mentor delta to docs and backlog; inspect backend handlers | Define QA checklist and happy-flow scenarios | Inspect current Bug Detail/Object Page layout | Inspect current status/value help behavior |
| Day 2 | Design/implement view-discuss vs process permission behavior | Review backend validation cases | Move assignee/status to priority area | Implement or refine status dropdown/value help behavior |
| Day 3 | Support note/reason validation design and backend review | Implement/test transition validation cases | Regroup important fields for create/edit/detail | Tune semantic display and field usability |
| Day 4 | Verify history/nextProcessor/notification side effects | Prepare seed/test data and API evidence | Support layout review | Move severity/environment to supporting area and improve comments/developer note usability |
| Day 5 | Fix backend bugs from QA | Execute backend regression and report bugs | Browser smoke test layout | Browser smoke test dropdown/note behavior |

## Week 2 Plan

| Day | DonHV | NhanT | DatDT | SangVN |
| --- | --- | --- | --- | --- |
| Day 6 | Fix backend bugs from Week 1 QA | Verify backend fixes | Fix layout issues from QA | Fix status/note UI issues |
| Day 7 | Align service contract with FE needs | Re-run transition checks | Polish Object Page/Create/Edit | Polish comment/developer note UX |
| Day 8 | Prepare backend demo evidence | Verify history/notification records | Browser walkthrough | Browser walkthrough |
| Day 9 | Consolidate open bugs and blockers | Regression test | Final FE cleanup | Final FE cleanup |
| Day 10 | Jira/status coordination and backend evidence | Demo script, final smoke test, and QA sign-off notes | UI demo ready | UI demo ready |

## Acceptance Criteria

- `cds compile srv app/bug-management-ui --to edmx` passes.
- App can run with `cds watch` or `npm run watch-bug-management-ui`.
- Bug Detail shows the refined layout.
- Status edit uses dropdown/value help, not free text.
- Developers with project/team visibility can view and discuss bugs.
- Primary lifecycle actions remain controlled by assignee or authorized role.
- Developer note is optional by default.
- Note/reason is required only for the confirmed transitions.
- Happy flow can be demonstrated end-to-end on the UI.
- All bugs/errors found during the work are recorded in the relevant member status file under `docs/pm/status/`, whether fixed or still open.

## Jira Backlog Mapping

Use one Epic:

- `Sprint 02 - Mentor Feedback and Happy Flow Demo`

Suggested Jira issues:

| Jira Summary | Type | Owner |
| --- | --- | --- |
| Update developer visibility and processing permission model | Task | DonHV |
| Implement mandatory note/reason validation for selected transitions | Task | NhanT |
| Verify history, nextProcessor, and notification side effects | Task | DonHV |
| Fix backend bugs found during Sprint 02 QA | Task | DonHV |
| Create and execute happy-flow backend verification checklist | Task | NhanT |
| Redesign Bug Detail field layout | Task | DatDT |
| Make editable status use dropdown/value help | Task | SangVN |
| Improve important field input usability | Task | DatDT |
| Move severity and environment to supporting area | Task | SangVN |
| Improve comments and developer note usability | Task | SangVN |
| Prepare mentor demo script and final smoke test | Task | NhanT |

## Vietnamese

## Mục Tiêu Sprint

Hoàn thành happy flow cho một bug để sẵn sàng demo mentor sau feedback mới nhất: tạo bug, phân loại, assign, cho phép thảo luận trong team, cập nhật status qua rule backend có kiểm soát, chỉ bắt buộc note/reason ở những chỗ cần, và cải thiện Bug Detail UI để dễ dùng hơn.

## Thời Gian Sprint

Thời lượng dự kiến: 2 tuần.

Lịch gợi ý: 2026-06-05 đến 2026-06-18.

## Baseline Feedback Mentor

Mentor đã chấp nhận rule và diagram cốt lõi, nên Sprint 02 tập trung implementation thay vì vẽ lại các artifact phân tích đã được chốt.

Cập nhật đã chốt:

- Developer có thể xem và thảo luận bug trong cùng project/team khi có quyền visibility.
- Bug không nên private chỉ cho developer được assign.
- Action đổi lifecycle chính vẫn do assignee hoặc role được phép thực hiện.
- Developer note mặc định là optional.
- Note/reason chỉ bắt buộc ở một số transition:
  - `Assigned` / `In Review` / `In Progress` -> `Need More Information`.
  - `Assigned` / `In Review` / `In Progress` -> `Rejected`.
  - `In Progress` -> `Resolved`.
  - `Resolved` -> `Reopened`.
- Bug Detail UI cần ưu tiên assignee và status, status edit bằng dropdown/value help, field quan trọng được nhóm để nhập nhanh, và severity/environment chuyển sang vùng thông tin phụ hoặc bên phải khi có thể.

## Phân Công Team

| Thành viên | Vai trò Sprint 02 | Trách nhiệm chính | Trách nhiệm phụ |
| --- | --- | --- | --- |
| DonHV | Backend CAP lead | Business rule backend, CAP service/handler, backend bug fixing, Jira/PM coordination | Hỗ trợ sync tài liệu BA/PM khi feedback mentor làm đổi nghiệp vụ |
| NhanT | Backend verification / QA | API/manual verification, regression check, test data, ghi bug kèm evidence | Hỗ trợ review backend validation |
| DatDT | Fiori/UI5 lead | Redesign Bug Detail layout, Object Page/Create/Edit usability, Fiori Elements annotations | Browser smoke test cho UI flow |
| SangVN | Fiori/UI5 support | Status dropdown/value help UX, comment/developer note usability, hỗ trợ fix UI issue | Hỗ trợ FE regression và demo polish |

## Work Breakdown

| ID | Công việc | Owner | Hỗ trợ | Output |
| --- | --- | --- | --- | --- |
| S2-BE-01 | Làm rõ quyền developer view/discuss và quyền xử lý chính | DonHV | NhanT | Rule backend cho view/discuss vs process action |
| S2-BE-02 | Implement validation note/reason bắt buộc cho selected transitions | NhanT | DonHV | CAP handler chỉ bắt reason ở transition đã chốt |
| S2-BE-03 | Đảm bảo history, nextProcessor và notification side effect đúng | DonHV | NhanT | Status change ghi đúng audit/history và next owner |
| S2-BE-04 | Fix backend bug phát hiện trong Sprint 02 QA | DonHV | NhanT | Backend bug fix có evidence trong status DonHV |
| S2-QA-01 | Tạo checklist verify happy flow | NhanT | DonHV | Checklist create -> assign -> review -> request/reject/resolve |
| S2-QA-02 | Chạy backend/API regression checks | NhanT | DonHV | Evidence pass/fail và bug report cho DonHV |
| S2-FE-01 | Redesign layout field Bug Detail | DatDT | SangVN | Assignee/status được ưu tiên; field quan trọng được nhóm |
| S2-FE-02 | Status edit bằng dropdown/value help | SangVN | DatDT | Không còn edit status bằng free text |
| S2-FE-03 | Cải thiện input usability cho field quan trọng | DatDT | SangVN | Title, status, assignee, priority, application component, defect category, steps/actual/expected dễ nhập |
| S2-FE-04 | Chuyển severity và environment sang vùng phụ | SangVN | DatDT | Layout cân hơn và dễ scan hơn |
| S2-FE-05 | Cải thiện comments/developer note section | SangVN | DatDT | Thảo luận và developer note optional dùng được từ Bug Detail |
| S2-DEMO-01 | Chuẩn bị demo script và final smoke test | NhanT | DonHV, DatDT, SangVN | Demo flow, screenshot và danh sách known issue cuối |

## Acceptance Criteria

- `cds compile srv app/bug-management-ui --to edmx` pass.
- App chạy được bằng `cds watch` hoặc `npm run watch-bug-management-ui`.
- Bug Detail hiển thị layout mới.
- Status edit dùng dropdown/value help, không nhập text tự do.
- Developer có quyền project/team visibility có thể xem và thảo luận bug.
- Lifecycle action chính vẫn do assignee hoặc role được phép thực hiện.
- Developer note mặc định optional.
- Note/reason chỉ bắt buộc ở transition đã chốt.
- Happy flow demo được end-to-end trên UI.
- Mọi bug/error phát hiện trong quá trình làm đều được ghi vào đúng member status file trong `docs/pm/status/`, dù đã fix hay còn mở.
