# 07 - Fiori UX Requirements

Status: BA baseline draft v1  
Last updated: 2026-05-28

## UX Approach

Use Fiori Elements List Report/Object Page as the default implementation. Prefer annotations and value helps before custom SAPUI5 extensions.

## List Report

### Main Columns

| Column | Purpose | Priority |
| --- | --- | --- |
| Bug Number | Human-readable bug ID. | P0 |
| Title | Short bug summary. | P0 |
| Status | Current lifecycle status with semantic color. | P0 |
| Priority | Business urgency. | P0 |
| Severity | Technical/user impact. | P0 |
| SAP Module | Optional SAP business context. | P0 |
| Application Component | Where bug appears. | P0 |
| Defect Category | Type/layer of defect. | P0 |
| Assignee | Main Developer. | P0 |
| Next Processor | Person/queue expected to act next. | P0 |
| Due Date | Overdue monitoring. | P0 |
| Updated At | Stale bug detection. | P1 |
| Created At | Audit/filtering. | P1 |

### Filter Bar

| Filter | Requirement |
| --- | --- |
| Status | Multi-select value help. |
| Priority | Multi-select value help. |
| Severity | Multi-select value help. |
| SAP Module | Optional value help. |
| Application Component | Value help; can be filtered by SAP Module. |
| Defect Category | Value help; can be filtered by Application Component. |
| Assignee | Developer value help. |
| Next Processor | User/queue filter. |
| Overdue | Boolean or derived filter. |
| Created Date / Updated Date | Date range. |

### Suggested Tabs or Views

| View | Filter |
| --- | --- |
| All Bugs | No special filter. |
| My Action Items | nextProcessor = current user or role queue. |
| My Assigned Bugs | assignee = current Developer. |
| Pending Assignment | status = Pending Assignment. |
| Need More Information | status = Need More Information. |
| Retest Required | status = Retest Required. |
| Overdue | dueDate < today and status not Closed. |

## Object Page

### Header

| Header field | Purpose |
| --- | --- |
| Bug Number | Stable identifier. |
| Title | Main object title. |
| Status | Semantic status indicator. |
| Priority / Severity | Risk scanning. |
| Assignee | Current Developer. |
| Next Processor | Current action owner. |

### Sections

| Section | Fields/content |
| --- | --- |
| Bug Details | Title, description, priority, severity, environment, reporter, created/updated timestamps. |
| Classification | SAP Module, Application Component, Defect Category, Component Category. |
| Assignment | Assignee, nextProcessor, Developer Responsibility context, due date, planned completion date, estimated effort. |
| Reproduction | Steps to reproduce, actual result, expected result, testCaseRef, testRunRef. |
| Comments | Comment table/list with author, role, timestamp, content. |
| Attachments | Evidence metadata and links/download action when implemented. |
| History | Timeline/table of status, assignment, classification, and important changes. |
| Notifications | Notification records if implemented. |
| PM Monitoring | Overdue indicator, stale update indicator, repeated reassign/reject counts when available. |

## Create/Edit Form Flow

1. Tester enters basic bug details.
2. Tester selects SAP Module if relevant; pure IDTS bug can use empty/Not Applicable.
3. Tester selects Application Component; value help is filtered by SAP Module when configured.
4. Tester selects Defect Category; value help is filtered by Application Component.
5. System resolves Component Category.
6. Tester selects Assignee; value help is filtered by Developer Responsibility and optional SAP Module.
7. If no suitable Developer exists, Tester selects "No suitable developer".
8. Submit creates status Assigned or Pending Assignment.

## Object Page Actions

| Action | Visible for | Main status condition |
| --- | --- | --- |
| Submit Bug | Tester | Draft/New form. |
| Assign | Tester/PM if authorized | New, Pending Assignment, Rejected, Reopened. |
| Reassign | Tester/PM if authorized | Assigned, In Review, In Progress, Rejected, Reopened. |
| Start Review | Developer | Assigned. |
| Request More Information | Developer | Assigned, In Review. |
| Reject | Developer | Assigned, In Review; reason required and nextProcessor must become Tester or PM. |
| Move to In Progress | Developer | In Review. |
| Mark Resolved | Developer | In Progress. |
| Send to Retest | Tester/System/PM | Resolved. |
| Close | Tester/PM | Resolved, Retest Required. |
| Reopen | Tester/PM | Resolved, Retest Required, Closed. |
| Add Comment | Authorized users | Any non-restricted status. |

## Semantic Status Colors

| Status | Semantic color guidance |
| --- | --- |
| Resolved, Closed | Positive. |
| Pending Assignment, Need More Information, Retest Required, Overdue | Critical. |
| Rejected | Negative. |
| New, Assigned, In Review, In Progress, Reopened | Neutral/Information. |

## Message Handling

- Use inline value states for missing required fields.
- Use Message Popover for multiple validation issues.
- Use confirmation dialog only for interrupting actions such as Reject, Reopen, Close, or destructive attachment removal.
- Backend validation errors must be shown as actionable messages.
- After Reject, Object Page must show rejection reason, nextProcessor, and follow-up actions for Tester or PM.

Vietnamese:

- Sau khi Reject, Object Page phải hiển thị lý do reject, nextProcessor và các action follow-up cho Tester hoặc PM như sửa phân loại, bổ sung thông tin, reassign hoặc chuyển về Pending Assignment.

## Accessibility and Usability

- Avoid hiding required fields behind rarely used sections.
- Keep create flow sequential and dependent value helps clear.
- Use concise labels: SAP Module, Application Component, Defect Category, Assignee, Next Processor.
- Do not overload PM dashboard with Jira-like project management metrics in MVP.
