# 06 - Authorization Matrix

Status: BA baseline draft v2  
Last updated: 2026-06-03

## Role Summary

| Role | Main responsibility |
| --- | --- |
| Tester | Create, classify, update, assign/reassign, provide information, retest, close/reopen where allowed. |
| Developer | Review assigned bugs, request information, reject unsuitable bugs, progress, resolve, comment. |
| PM | Monitor all bugs, workload, overdue, escalation, comment, request reassignment, optionally perform reassignment if authorized. |

Reporter and Admin are not separate MVP roles. Tester handles internal bug reporting responsibilities. Lightweight administrative responsibilities are handled by Tester or PM where authorized.

Vietnamese:

Reporter và Admin không phải role tách riêng trong MVP. Tester đảm nhiệm trách nhiệm báo cáo bug nội bộ. Các trách nhiệm quản trị nhẹ do Tester hoặc PM xử lý theo quyền được cấp.

## Action Matrix

| Action | Tester | Developer | PM | Notes |
| --- | --- | --- | --- | --- |
| View own/reported bugs | Yes | Yes if assigned/authorized | Yes | PM can view all. |
| View all bugs | Optional | No by default | Yes | Depends on project visibility rule. |
| Create bug | Yes | Optional/No | Optional/No | MVP main creator is Tester. |
| Edit open bug details | Yes | Limited notes/comments | Comment/monitor only | Closed bugs should not be freely edited. |
| Search duplicate bugs | Yes | Yes | Yes | Search/filter available to all roles. |
| Select SAP Module/Application Component/Defect Category | Yes | Suggest via reject/comment | Optional | Tester owns classification. |
| Assign Developer | Yes | No | Request or Yes if authorized | PM direct assignment must be explicit. |
| Reassign Developer | Yes | No | Request or Yes if authorized | Always log reason. |
| Submit as Pending Assignment | Yes | No | Optional | Used when no suitable Developer exists. |
| Start review | No | Yes | No | Assigned -> In Review. |
| Request more information | No | Yes | No | Reason required. |
| Provide requested information | Yes | No | Optional comment | Returns bug to Developer. |
| Reject assignment/classification | No | Yes | No | Reason and nextProcessor required; Rejected must be followed up. |
| Move to In Progress | No | Yes | No | Developer processing. |
| Mark Resolved | No | Yes | No | Developer provides result/response. |
| Move to Retest Required | Yes/System | No | Yes | Verification stage. |
| Close bug | Yes | No | Yes | Tester/PM confirms. |
| Reopen bug | Yes | No | Yes | Reason required. |
| Add comment | Yes | Yes | Yes | Comment does not change status directly. |
| Upload evidence | Yes | Optional | Optional | Depends on attachment policy. |
| View history | Yes | Yes | Yes | PM all, others scoped. |
| View PM dashboard | No | No | Yes | Tester/Developer may have limited lists. |
| Override nextProcessor | No | No | Yes | Escalation or exceptional reassignment only. |

## Status Transition Ownership

| Transition | Main actor | Backup/exception |
| --- | --- | --- |
| New -> Assigned | Tester | PM if authorized |
| New -> Pending Assignment | Tester | PM if authorized |
| Pending Assignment -> Assigned | Tester | PM if authorized |
| Assigned -> In Review | Developer | None |
| In Review -> Need More Information | Developer | None |
| Need More Information -> Assigned/In Review | Tester/System | PM can comment/escalate |
| In Review -> In Progress | Developer | None |
| In Progress -> Resolved | Developer | None |
| Resolved -> Retest Required | Tester/System | PM |
| Retest Required -> Closed | Tester/PM | None |
| Retest Required -> Reopened | Tester/PM | None |
| Assigned/In Review -> Rejected | Developer | None |
| Rejected -> Assigned | Tester | PM if authorized |
| Rejected -> Pending Assignment | Tester | PM if authorized |
| Closed -> Reopened | Tester/PM | PM escalation if needed |

## Authorization Assumptions

- PM can monitor all bugs.
- PM can request reassignment by default; direct reassignment can be enabled if the team wants stronger PM control.
- Developer cannot close bugs directly in the recommended MVP.
- Developer can only update technical handling fields/status for assigned or authorized bugs.
- Tester owns classification and bug content quality.
- Backend must enforce authorization and transition rules, not only Fiori button visibility.

English:

- `Rejected` does not close the bug. After a Developer rejects it, Tester or PM owns the follow-up, corrects the needed data, and moves the bug to Assigned or Pending Assignment.

Vietnamese:

- `Rejected` không kết thúc bug. Sau khi Developer reject, Tester hoặc PM là người chịu trách nhiệm follow-up, sửa dữ liệu cần thiết và đưa bug về Assigned hoặc Pending Assignment.
