# 03 - Status Transition Matrix

Status: BA baseline draft v2  
Last updated: 2026-06-03

## Primary Statuses

| Status | Main owner | Next processor rule |
| --- | --- | --- |
| New | Tester/System | Tester |
| Pending Assignment | Tester/PM | PM queue or Tester |
| Assigned | Tester/System | Assigned Developer |
| In Review | Developer | Assigned Developer |
| Need More Information | Developer/Tester | Tester |
| In Progress | Developer | Assigned Developer |
| Resolved | Developer | Tester/PM |
| Retest Required | Tester/PM | Tester/PM |
| Rejected | Developer/Tester/PM | Tester or PM; follow-up required |
| Reopened | Tester | Assigned Developer or Tester depending on reassignment need |
| Closed | Tester/PM | None |

## Allowed Transitions

| From | To | Actor | Reason required? | History log? | Notes |
| --- | --- | --- | --- | --- | --- |
| New | Assigned | Tester | No | Yes | Used when a suitable Developer is selected. |
| New | Pending Assignment | Tester | No | Yes | Used when no suitable Developer is selected. |
| Pending Assignment | Assigned | Tester/PM if authorized | Optional | Yes | PM may request or perform assignment depending on authorization. |
| Assigned | In Review | Developer | No | Yes | Developer starts review. |
| Assigned | Rejected | Developer | Yes | Yes | Wrong assignment/classification; follow-up owner required. |
| Assigned | Assigned | Tester/PM if authorized | Yes | Yes | Reassign action, not a status change in meaning. |
| In Review | Need More Information | Developer | Yes | Yes | Tester must provide missing information. |
| Need More Information | Assigned | Tester | Optional | Yes | Information added, ready for Developer. |
| Need More Information | In Review | Tester/System | Optional | Yes | Return directly to review when assignee stays the same. |
| In Review | In Progress | Developer | Optional | Yes | Information is valid and handling begins. |
| In Review | Rejected | Developer | Yes | Yes | Wrong classification confirmed; follow-up owner required. |
| In Progress | Resolved | Developer | Optional | Yes | Developer provides response/resolution. |
| Resolved | Retest Required | Tester/System | Optional | Yes | Verification is needed. |
| Resolved | Closed | Tester/PM | Optional | Yes | Allowed only when no retest is needed and result is accepted. |
| Resolved | Reopened | Tester/PM | Yes | Yes | Issue still exists before formal retest. |
| Retest Required | Closed | Tester/PM | Optional | Yes | Retest passed. |
| Retest Required | Reopened | Tester/PM | Yes | Yes | Retest failed. |
| Reopened | Assigned | Tester | Optional | Yes | Reassign or send back to existing Developer. |
| Rejected | Assigned | Tester/PM if authorized | Yes | Yes | Classification/info/assignee corrected and suitable Developer selected. |
| Rejected | Pending Assignment | Tester/PM if authorized | Yes | Yes | Classification or information corrected but no suitable Developer is available. |
| Closed | Reopened | Tester/PM | Yes | Yes | Bug should not be edited freely after closure. |

## Blocked or Discouraged Transitions

| From | To | Why blocked or discouraged |
| --- | --- | --- |
| New | In Progress | Skips assignment and Developer review. |
| Pending Assignment | In Review | No Developer is assigned yet. |
| Need More Information | Resolved | Tester must return information to Developer first. |
| In Progress | Closed | Developer should not bypass Tester/PM confirmation. |
| Retest Required | In Progress | Use Reopened first to record failed verification. |
| Closed | In Progress | Use Reopened to preserve audit trail. |

## nextProcessor Automation

| Event | nextProcessor should become |
| --- | --- |
| Bug assigned to Developer | Assigned Developer |
| Submitted with no suitable Developer | PM queue or Tester |
| Developer requests more information | Tester |
| Tester adds requested information | Assigned Developer |
| Developer rejects bug | Tester or PM |
| Developer marks Resolved | Tester/PM |
| Bug moves to Retest Required | Tester/PM |
| Bug is Closed | Empty |

## BA Notes

- Backend must validate critical transitions. UI-only validation is not enough.
- Every transition should write a history log with actor, timestamp, old status, new status, and reason when required.
- Comments can explain a decision but do not directly change status.
- `Reassigned` is logged as an assignment action, not a primary status.
- `Rejected` is not final. It must have a rejection reason, nextProcessor, and a follow-up transition to Assigned or Pending Assignment after correction.

Vietnamese:

- `Rejected` không phải trạng thái kết thúc. Bug bị reject phải có lý do, nextProcessor và transition follow-up sang Assigned hoặc Pending Assignment sau khi đã được xử lý/correct.
