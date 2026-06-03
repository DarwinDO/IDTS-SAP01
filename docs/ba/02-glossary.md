# 02 - Glossary

Status: BA baseline draft v1  
Last updated: 2026-05-28

## Core Terms

| Term | Definition | Example | Implementation note |
| --- | --- | --- | --- |
| Bug / Defect | A reported issue found during testing or use of the SAP-related application. | UI validation fails, wrong backend status update, notification not sent. | Main business entity: `Bugs`. |
| Tester | MVP user who detects, records, classifies, updates, assigns, retests, closes, or reopens bugs. | Tester creates BUG-0001. | `Reporter` is not a separate MVP role; Tester performs reporting responsibilities. |
| Developer | User who receives assigned bugs and updates technical handling status. | Dev A handles CAP backend defects. | Can be a `User` with `DeveloperProfile`. |
| PM | User who monitors progress, workload, overdue cases, and escalation. | PM checks dashboard for Pending Assignment. | Can see broad monitoring views. |
| Assignee | Main Developer assigned to technically handle the bug. | Dev A is assignee for BUG-0001. | Does not always equal next processor. |
| Next Processor | Person or queue expected to take the next action. | Tester must add missing information. | Auto-updated by backend status/action rules. |
| Pending Assignment | Status when a valid bug exists but no suitable Developer is selected yet. | No CAP developer available. | Appears in PM/Tester queue. |
| Retest Required | Status after resolution when Tester/PM must verify before closure. | Dev marks Resolved, tester retests in QAS. | Added to keep closure controlled. |

## Classification Terms

| Term | Definition | Example | Relationship |
| --- | --- | --- | --- |
| SAP Module | SAP business/functional context. Optional for pure IDTS bugs. | FI, MM, SD, CO, PP, HCM. | Can filter available Application Components. |
| Application Component | App, screen, service, or feature area where the bug appears. | IDTS Bug Report, Assignment, Notification, Dashboard, Custom Fiori App. | Required classification dimension. |
| Defect Category | Type or technical layer of the defect. | Fiori/UI5, SAP CAP Backend, Database, Authorization, Integration, Workflow. | Required classification dimension. |
| Component Category | Valid pair of Application Component and Defect Category. | IDTS Bug Report + Fiori/UI5. | Used as the main assignment key. |
| Developer Responsibility | Mapping that says which Developer can handle which Component Category, optionally scoped by SAP Module. | Dev A handles FI + IDTS Bug Report + Fiori/UI5. | Filters assignee value help. |

## Test and Planning Terms

| Term | Definition | MVP handling |
| --- | --- | --- |
| Environment | Context where the bug was found. | Store text/value list such as DEV, QAS, UAT, browser, device, SAP client. |
| Test Case Reference | Link or code of a test case where the defect was found. | Store as optional `testCaseRef`; no full test module. |
| Test Run Reference | Link or code of a test execution run. | Store as optional `testRunRef`; no full test module. |
| Planned Completion Date | Date the team expects the defect to be handled. | Used for PM planning. |
| Due Date | Deadline used to calculate overdue. | Used for dashboard/filtering. |
| Estimated Effort Hours | Rough effort estimate if the team needs workload planning. | Optional for MVP. |

## Status Terms

| Status | Meaning |
| --- | --- |
| New | Bug is newly recorded or being submitted. |
| Pending Assignment | Bug has no suitable Developer assigned. |
| Assigned | Bug has one main Developer assignee. |
| In Review | Developer is checking information, classification, evidence, and comments. |
| Need More Information | Developer needs more details from Tester. |
| In Progress | Developer is handling or tracking the resolution outside IDTS. |
| Resolved | Developer has provided a resolution result or response. |
| Retest Required | Tester/PM must verify the result before closure. |
| Rejected | Developer rejects because classification or assignment is unsuitable. This is a follow-up status, not a final status. |
| Reopened | Bug is opened again because the problem still exists. |
| Closed | Bug is accepted as complete and should not be freely edited. |

## Terms to Avoid or Use Carefully

| Term | Guidance |
| --- | --- |
| Module / Category | Too vague for implementation. Replace with SAP Module, Application Component, and Defect Category. |
| Affected Area | Useful as business language, but implementation should map it to Application Component and Defect Category. |
| Responsible Area | Useful as business language, but implementation should use Developer Responsibility. |
| Reassigned | Do not use as primary status. Treat as action/history event. |
| Fix Bug | Do not model as direct code-fixing inside IDTS. Use Developer Review, In Progress, Resolved. |

Vietnamese:

- `Rejected` là status cho biết bug cần được Tester hoặc PM xử lý tiếp sau khi Developer reject. Đây không phải final status; bug phải có rejection reason, nextProcessor và action kế tiếp như sửa phân loại, bổ sung thông tin, reassign hoặc Pending Assignment.
