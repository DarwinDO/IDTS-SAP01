# 04 - Requirement Backlog

Status: BA baseline draft v1  
Last updated: 2026-05-28

## Priority Legend

| Priority | Meaning |
| --- | --- |
| P0 | Required for first usable MVP. |
| P1 | Important after core MVP works. |
| P2 | Optional or later enhancement. |

## MVP Requirements

### REQ-BUG-001 - Create Bug Report

Priority: P0  
Primary role: Tester

As a Tester, I want to create a bug report with complete defect information so that the team can track and process it.

Acceptance criteria:

- Tester can enter title, description, priority, severity, environment, steps to reproduce, actual result, expected result, SAP Module if relevant, Application Component, Defect Category, and optional evidence/test references.
- Required fields are validated before submit.
- System creates a unique bug number/ID.
- System writes a create history log.

### REQ-BUG-002 - Check Existing Bugs Before Creation

Priority: P0  
Primary role: Tester

As a Tester, I want to search existing bugs before creating a new bug so that duplicates are reduced.

Acceptance criteria:

- Tester can search/filter by title, status, priority, severity, SAP Module, Application Component, Defect Category, assignee, and keyword.
- If a similar open bug exists, Tester can follow/comment/update that bug instead of creating a duplicate.
- If a similar closed bug exists, Tester can reopen or update according to authorization.

### REQ-CLS-001 - Classify Bug by SAP Module, Application Component, and Defect Category

Priority: P0  
Primary role: Tester

As a Tester, I want classification fields to be clear and dependent so that I can describe where the bug appears and what type of defect it is.

Acceptance criteria:

- SAP Module is optional and represents business context such as FI/MM/SD.
- Application Component is required.
- Defect Category is required.
- Application Component value help can be filtered by SAP Module when configured.
- Defect Category value help can be filtered by Application Component.
- Pure IDTS bugs can use empty/Not Applicable SAP Module.

### REQ-ASSIGN-001 - Filter Developers by Responsibility

Priority: P0  
Primary role: Tester

As a Tester, I want the assignee list to show suitable Developers based on selected classification so that assignment is less likely to be wrong.

Acceptance criteria:

- System resolves the selected Application Component + Defect Category into a Component Category.
- System filters Developers by active Developer Responsibility.
- If SAP Module is selected, responsibility can be restricted by that SAP Module.
- If no Developer matches, Tester can choose "No suitable developer".

### REQ-ASSIGN-002 - Submit as Assigned or Pending Assignment

Priority: P0  
Primary role: Tester

As a Tester, I want to submit a bug even when no suitable Developer exists so that valid defects are not lost.

Acceptance criteria:

- If a Developer is selected, status becomes Assigned.
- If "No suitable developer" is selected, status becomes Pending Assignment.
- Assignment decision is written to history log.
- Assigned Developer receives notification trigger.
- Pending Assignment appears in PM/Tester monitoring.

### REQ-DEV-001 - Developer Review

Priority: P0  
Primary role: Developer

As a Developer, I want to review assigned bugs so that I can decide whether I can process them.

Acceptance criteria:

- Developer can view assigned bugs and bug details.
- Developer can move Assigned to In Review.
- Developer can add developer note/comment.
- Developer can request more information with reason.
- Developer can reject wrong classification or unsuitable assignment with reason.

### REQ-INFO-001 - Request More Information

Priority: P0  
Primary role: Developer

As a Developer, I want to request missing information so that I do not process unclear bugs.

Acceptance criteria:

- Developer can set status to Need More Information.
- Reason is required.
- nextProcessor becomes Tester.
- Tester receives notification trigger.
- Tester can add information and return bug to Assigned/In Review.

### REQ-REJECT-001 - Reject and Reassign

Priority: P0  
Primary role: Developer, Tester, PM

As a Developer, I want to reject wrongly classified or unsuitable bugs so that the Tester can correct them.

Acceptance criteria:

- Developer can reject with required reason.
- Status becomes Rejected.
- nextProcessor becomes Tester or PM.
- Rejected is not final; Tester or PM must perform the next action.
- Tester can update classification and reassign.
- Tester or PM can move the bug from Rejected to Assigned when a suitable Developer is selected.
- Tester or PM can move the bug from Rejected to Pending Assignment when no suitable Developer is available.
- Reassignment is logged as action/history, not as a separate status.

Vietnamese:

- `Rejected` không phải final status. Sau khi reject, Tester hoặc PM phải xử lý tiếp bằng cách sửa phân loại, bổ sung thông tin, reassign sang Developer phù hợp hoặc chuyển về Pending Assignment nếu chưa có Developer phù hợp.

### REQ-STATUS-001 - Resolve, Retest, Close, and Reopen

Priority: P0  
Primary role: Developer, Tester/PM

As the team, we need a controlled closure flow so that a bug is not closed before verification.

Acceptance criteria:

- Developer can move In Progress to Resolved.
- Tester/System can move Resolved to Retest Required when verification is needed.
- Tester/PM can close when accepted.
- Tester/PM can reopen when the issue still exists.
- Closed bugs are not freely edited; Reopen is used to continue processing.

### REQ-NEXTP-001 - Maintain Next Processor

Priority: P0  
Primary role: System

As the system, I want to maintain nextProcessor automatically so that users and PM know who must act next.

Acceptance criteria:

- nextProcessor changes based on status/action rules.
- nextProcessor does not replace assignee.
- Closed bugs have no nextProcessor.
- Important nextProcessor changes are logged.
- PM can filter/monitor by nextProcessor or inferred queue.

### REQ-COMMENT-001 - Add Comments

Priority: P0  
Primary role: Tester, Developer, PM

As a user, I want to comment on a bug so that discussions stay attached to the defect record.

Acceptance criteria:

- Tester, assigned Developer, and PM can comment according to authorization.
- Comment stores content, author, author role, timestamp, and bug reference.
- Comment does not directly change status.

### REQ-HISTORY-001 - Audit and History Log

Priority: P0  
Primary role: System

As the system, I want to log important changes so that defect handling is traceable.

Acceptance criteria:

- Log create, edit, assign, reassign, status change, request more information, reject, resolve, retest, close, reopen, attachment, and key notification events.
- History records actor, role, timestamp, action type, old value, new value, and reason when available.

### REQ-PM-001 - PM Monitoring

Priority: P0  
Primary role: PM

As a PM, I want to monitor workload, overdue bugs, pending assignment, and status progress so that I can manage delivery risk.

Acceptance criteria:

- PM can see all bugs.
- PM can filter by status, priority, severity, SAP Module, Application Component, Defect Category, assignee, nextProcessor, created date, updated date, and overdue state.
- PM can see workload by Developer.
- PM can see Pending Assignment and overdue bugs.
- PM can comment or request reassignment without replacing Developer responsibilities.

## P1 Requirements

| ID | Requirement | Summary |
| --- | --- | --- |
| REQ-ATT-001 | Attachment metadata | Store file name, media type, storage reference, uploader, and timestamp. |
| REQ-NOTIF-001 | Notification records | Store notification event, recipient, channel, delivery status, and timestamp. |
| REQ-WORKLOAD-001 | Workload warning | Warn Tester/PM when Developer is overloaded. |
| REQ-DUP-001 | Duplicate links | Record source/target bug duplicate relationships. |
| REQ-VALUE-001 | Managed value lists | Use controlled values for priority, severity, status, SAP Module, Application Component, and Defect Category. |

## P2 Requirements

| ID | Requirement | Summary |
| --- | --- | --- |
| REQ-NOTIF-002 | External notification adapter | Add email/SAP BTP/third-party delivery later without hardcoding endpoints. |
| REQ-REPORT-001 | Advanced analytics | Add trend charts and SLA analytics after MVP. |
| REQ-WATCH-001 | Watchers/collaborators | Allow non-assignee users to follow a bug. |

## Excluded Requirements

| Excluded item | Reason |
| --- | --- |
| Direct code fixing | Outside IDTS scope. |
| Code review workflow | Outside MVP and would turn IDTS into development workflow tooling. |
| CI/CD | Outside defect tracking. |
| Full test management | Only lightweight `testCaseRef` and `testRunRef` are needed. |
| Mandatory AI Root Cause Analysis | Not required and may overcomplicate MVP. |
