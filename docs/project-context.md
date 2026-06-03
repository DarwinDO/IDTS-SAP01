# Project Context: Issue and Defect Tracking System in SAP

## Summary

IDTS is a SAP CAP + Fiori Elements/SAPUI5 application for tracking bugs and defects in an SAP software testing environment. The system supports reporting, duplicate checking, classification by SAP module, application component, and defect category, assignment to a suitable developer, developer review, retest before closure, comments, notifications, audit/history logs, and PM monitoring.

This is not a full Jira replacement and not a source-code workflow system. Developers use IDTS to review assigned bugs, request information, reject wrong assignments, add notes, and update statuses. A rejected bug must continue to a clear follow-up owner and action through `nextProcessor`; rejection is not a silent final state. Code fixes, CI/CD, code review, sprint planning, and mandatory AI root cause analysis are outside the current scope.

Vietnamese: IDTS không phải Jira đầy đủ và không phải hệ thống quản lý source code. Developer dùng IDTS để review bug được assign, request thêm thông tin, reject assignment/phân loại sai, ghi chú và cập nhật status. Bug ở trạng thái `Rejected` vẫn phải có người xử lý tiếp và action tiếp theo rõ ràng thông qua `nextProcessor`; reject không phải trạng thái kết thúc im lặng.

## Stack

- Backend: SAP CAP Node.js
- API: OData V4
- Frontend: SAP Fiori Elements / SAPUI5
- Local database: SQLite
- Future deployment database: SAP HANA Cloud or PostgreSQL
- Current Fiori app: `app/bug-management-ui`
- Current service: `BugService` at `/odata/v4/bug/`

## Roles

| Role | Responsibility |
| --- | --- |
| Tester | Detect bugs, create and update bug reports, check duplicates, classify bugs, assign/reassign developers, provide requested information, retest, close or reopen when needed, comment, and track status |
| Developer | View assigned bugs, review bug details, request more information, reject wrong classification or unsuitable assignment with reason, add developer notes, update processing status |
| PM | Monitor all bugs, workload, overdue bugs, status progress, history, reports, and escalation notifications |

MVP role baseline: IDTS currently uses three active roles only: Tester, Developer, and PM. `Reporter` is not a separate MVP role because the project is internal and Testers are the primary people who find and report bugs. `Admin` is not a separate MVP role because no dedicated admin workflow is planned yet; lightweight administrative responsibilities such as master-data upkeep, classification correction, and reassignment coordination are handled by Tester or PM where authorized.

Vietnamese: Baseline role của MVP hiện chỉ có ba role active: Tester, Developer và PM. `Reporter` không tách thành role riêng trong MVP vì dự án dùng nội bộ và Tester là người chính phát hiện, báo cáo bug. `Admin` cũng chưa tách thành role riêng vì hiện chưa có workflow admin chuyên biệt; các trách nhiệm quản trị nhẹ như duy trì master data, sửa phân loại và điều phối reassignment sẽ do Tester hoặc PM xử lý theo quyền được cấp.

## Main Entities

Expected domain entities:

- `Bugs`
- `Developers`
- `SAPModules`
- `ApplicationComponents`
- `DefectCategories`
- `ComponentCategories`
- `DeveloperResponsibilities`
- `Comments`
- `Attachments`
- `HistoryLogs`
- `Notifications`

Potential support entities:

- `Users` or role mapping, if needed later
- `DeveloperResponsibilities` for developer capability matching by component/category and optional SAP module scope
- `StatusValues`, `PriorityValues`, `SeverityValues`, if the model needs managed value lists
- Optional test context fields on `Bugs`, such as `testCaseRef`, `testRunRef`, and `environment`, without building a full test management module
- Optional planning/ownership fields on `Bugs`, such as `plannedCompletionDate`, `dueDate`, `estimatedEffortHours`, and `nextProcessor`

## Main Statuses

- New
- Pending Assignment
- Assigned
- In Review
- Need More Information
- In Progress
- Resolved
- Retest Required
- Rejected
- Reopened
- Closed

## Main Flows

### Create Bug

1. Tester detects a bug.
2. Tester checks for an existing similar bug.
3. Tester creates a bug report if no suitable open bug exists.
4. Tester enters title, description, SAP module if relevant, application component, defect category, priority, severity, environment, steps to reproduce, actual result, expected result, optional test case/test run references, and optional evidence.
5. System validates mandatory fields.
6. System creates a unique bug ID and writes audit history.

### Assign Bug

1. Tester selects SAP module if relevant, application component, and defect category.
2. System filters suitable developers by component/category and optional SAP module scope.
3. Tester selects a developer or "No suitable developer".
4. If a developer is selected, status becomes Assigned.
5. If no suitable developer is selected, status becomes Pending Assignment.
6. System records assignment history and sends notification when applicable.

### Developer Review

1. Developer opens assigned bug.
2. Developer reviews details, evidence, comments, and history.
3. Developer moves status to In Review or In Progress when appropriate.
4. Developer can request more information if the bug is unclear.
5. Developer can reject if the bug classification or assignment is unsuitable.
6. Developer adds notes and status updates; the system writes history entries.

### Request More Information

1. Developer changes status to Need More Information and adds a reason.
2. Tester receives notification.
3. Tester updates the bug report or comments with missing information.
4. Bug returns to Assigned or In Review.

### Reject and Reassign

1. Developer rejects a bug with a reason when classification or assignment is wrong.
2. System sets status to Rejected and sets nextProcessor to Tester or PM.
3. Tester or PM reviews the rejection reason.
4. Tester or PM updates SAP module, application component, defect category, missing information, or assignee if needed.
5. Tester or PM reassigns to a suitable developer or moves it to Pending Assignment.
6. Rejected is not a final status; it must lead to a follow-up action and history log.

Vietnamese:

1. Developer reject bug kèm lý do khi phân loại hoặc assignee không phù hợp.
2. Hệ thống chuyển status sang Rejected và set nextProcessor là Tester hoặc PM.
3. Tester hoặc PM xem lại lý do reject.
4. Tester hoặc PM sửa SAP module, application component, defect category, thông tin thiếu hoặc assignee nếu cần.
5. Tester hoặc PM reassign cho Developer phù hợp hoặc chuyển về Pending Assignment.
6. Rejected không phải final status; nó phải dẫn tới follow-up action và history log.

### Resolve, Retest, Close, and Reopen

1. Developer marks bug as Resolved and adds a note.
2. System or Tester moves the bug to Retest Required when verification is needed.
3. Tester or PM verifies the result.
4. Bug is Closed when accepted.
5. Tester can Reopen if the issue still exists.

### Next Processor Ownership

1. The system maintains `nextProcessor` as the person or queue expected to take the next action.
2. `nextProcessor` does not replace `assignee`; `assignee` remains the main Developer responsible for technical handling.
3. CAP handlers should update `nextProcessor` automatically when status, assignee, or assignment decision changes.
4. Common mappings:
   - Assigned, In Review, In Progress: assigned Developer.
   - Need More Information: Tester.
   - Pending Assignment: PM queue or Tester.
   - Rejected: Tester or PM must correct classification, add information, reassign, or move to Pending Assignment.
   - Resolved and Retest Required: Tester or PM.
   - Closed: no next processor.
5. Manual override should be limited to PM escalation or exceptional reassignment in the MVP.
6. Every important `nextProcessor` change should be written to history logs.

### PM Monitoring

1. PM views all bug reports and filters by status, priority, severity, SAP module, application component, defect category, assignee, next processor, created date, updated date, and overdue state.
2. PM monitors developer workload and overdue bugs.
3. PM receives escalation notifications for high-priority unassigned bugs, overdue bugs, repeated reassignments, rejected bugs, and stale updates.
4. PM can comment or request reassignment without replacing Developer or Tester responsibilities.
