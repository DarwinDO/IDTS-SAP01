# 05 - Data Dictionary

Status: BA baseline draft v1  
Last updated: 2026-06-01

This document is a BA blueprint for the target conceptual model. It is not the current implemented CDS schema.

## Entity Summary

| Entity | Purpose | MVP priority |
| --- | --- | --- |
| Users | People using the system across Tester, Developer, and PM roles. | P0 |
| DeveloperProfiles | Developer-specific assignment metadata. | P0 |
| SAPModules | SAP business/functional contexts. | P0 |
| ApplicationComponents | App/system areas where bugs appear. | P0 |
| SAPModuleComponents | Optional mapping to filter components by SAP Module. | P1 |
| DefectCategories | Technical/defect type categories. | P0 |
| ComponentCategories | Valid Application Component + Defect Category pairs. | P0 |
| DeveloperResponsibilities | Developer capability/responsibility mapping. | P0 |
| Bugs | Main defect record. | P0 |
| Comments | Discussion attached to a bug. | P0 |
| Attachments | Evidence file metadata. | P1 |
| HistoryLogs | Audit trail of important changes. | P0 |
| Notifications | Notification event records. | P1 |
| DuplicateLinks | Links between similar/duplicate bugs. | P1 |

## Users

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| displayName | String | Yes | Name shown in UI. |
| email | String | Yes | Used for identity/notification. |
| role | String or association | Yes | Tester, Developer, PM. Can become role mapping later. Reporter and Admin are not separate MVP roles. |
| active | Boolean | Yes | Inactive users should not be selectable for new assignments. |

## DeveloperProfiles

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| user | Association to Users | Yes | Developer user. |
| availabilityStatus | String | Optional | Available, Busy, Unavailable. |
| workloadLimit | Integer | Optional | Used for workload warning. |
| active | Boolean | Yes | Only active profiles are assignable. |

## SAPModules

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| code | String | Yes | FI, MM, SD, CO, PP, HCM, NA. |
| name | String | Yes | Human-readable module name. |
| active | Boolean | Yes | Controls value help visibility. |

## ApplicationComponents

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| code | String | Yes | Stable code for value help. |
| name | String | Yes | User-facing name. |
| componentType | String | Optional | IDTS, Custom Fiori App, CAP Service, Dashboard, Integration. |
| active | Boolean | Yes | Controls value help visibility. |

## DefectCategories

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| code | String | Yes | UI5, CAP, DB, AUTH, INT, WF, PERF. |
| name | String | Yes | User-facing name. |
| categoryType | String | Optional | Technical, Functional, Integration, Security. |
| active | Boolean | Yes | Controls value help visibility. |

## ComponentCategories

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| component | Association to ApplicationComponents | Yes | Where bug appears. |
| defectCategory | Association to DefectCategories | Yes | What type of defect. |
| active | Boolean | Yes | Only active pairs are selectable. |

## DeveloperResponsibilities

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| developerProfile | Association to DeveloperProfiles | Yes | Developer capability owner. |
| componentCategory | Association to ComponentCategories | Yes | Required assignment dimension. |
| sapModule | Association to SAPModules | Optional | Restricts responsibility to one SAP Module when needed. |
| responsibilityLevel | String | Optional | Primary, Backup, Expert. |
| active | Boolean | Yes | Only active mappings filter into assignee value help. |

## Bugs

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| bugNumber | String | Yes | Human-readable unique number such as BUG-0001. |
| title | String | Yes | Short summary. |
| description | Large String | Yes | Detailed defect description. |
| status | String/value list | Yes | Must follow status transition matrix. |
| priority | String/value list | Yes | Low, Medium, High, Critical. |
| severity | String/value list | Yes | Minor, Major, Critical, Blocker. |
| environment | String/value list | Optional/P0 | DEV, QAS, UAT, browser, device, SAP client. |
| stepsToReproduce | Large String | Yes | Reproduction steps. |
| actualResult | Large String | Yes | Current wrong behavior. |
| expectedResult | Large String | Yes | Expected correct behavior. |
| sapModule | Association to SAPModules | Optional | Business context; can be empty/NA. |
| applicationComponent | Association to ApplicationComponents | Yes | Where the defect appears. Stored directly for Fiori filtering and PM reporting. |
| defectCategory | Association to DefectCategories | Yes | What type or technical layer of defect it is. Stored directly for Fiori filtering and PM reporting. |
| componentCategory | Association to ComponentCategories | Yes | Main classification key. |
| reporter | Association to Users | Yes | User who created the bug. |
| assignee | Association to DeveloperProfiles | Optional | Empty for Pending Assignment. |
| nextProcessor | Association to Users | Optional | Auto-updated current action owner; required by rule when status is Rejected unless represented by a queue rule. |
| rejectionReason | Large String | Required when Rejected | Reason supplied when Developer rejects wrong classification or unsuitable assignment. Can also be stored through history reason if the team avoids a duplicate field. |
| testCaseRef | String | Optional | Lightweight test case reference. |
| testRunRef | String | Optional | Lightweight test run reference. |
| plannedCompletionDate | Date | Optional | PM planning. |
| dueDate | Date | Optional | Overdue calculation. |
| estimatedEffortHours | Decimal | Optional | Workload estimate. |
| createdAt | Timestamp | Yes | Creation timestamp. |
| updatedAt | Timestamp | Yes | Last update timestamp. |

## Comments

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| bug | Association/Composition to Bugs | Yes | Parent bug. |
| author | Association to Users | Yes | Comment author. |
| authorRole | String | Yes | Role at time of comment. |
| content | Large String | Yes | Comment text. |
| createdAt | Timestamp | Yes | Creation timestamp. |

## Attachments

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| bug | Association/Composition to Bugs | Yes | Parent bug. |
| uploadedBy | Association to Users | Yes | Uploader. |
| fileName | String | Yes | Original/display file name. |
| mediaType | String | Optional | MIME type. |
| storageRef | String | Yes | Storage pointer, not hardcoded external endpoint. |
| createdAt | Timestamp | Yes | Upload timestamp. |

## HistoryLogs

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| bug | Association/Composition to Bugs | Yes | Parent bug. |
| actor | Association to Users | Yes | User who performed action. |
| actorRole | String | Yes | Actor role at action time. |
| actionType | String | Yes | Create, Edit, Assign, Reassign, StatusChange, RequestInfo, Reject, Resolve, Close, Reopen. |
| oldValue | String | Optional | Previous value when applicable. |
| newValue | String | Optional | New value when applicable. |
| reason | String | Optional/required by rule | Required for reject, reopen, request info, some reassignment. For reject, the reason must support follow-up action. |
| timestamp | Timestamp | Yes | Action time. |

## Notifications

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| bug | Association/Composition to Bugs | Yes | Related bug. |
| recipient | Association to Users | Yes | User who should receive notification. |
| eventType | String | Yes | Assigned, NeedMoreInfo, Updated, Rejected, Overdue, Closed. |
| channel | String | Optional | InApp, Email, SAPBTP, Teams, Slack. |
| deliveryStatus | String | Yes | Pending, Sent, Failed, Skipped. |
| createdAt | Timestamp | Yes | Event timestamp. |

Vietnamese:

- Khi status là `Rejected`, hệ thống phải lưu được lý do reject và xác định nextProcessor. Có thể dùng field riêng `rejectionReason` hoặc dùng `HistoryLogs.reason`, miễn là UI và audit log vẫn truy xuất được lý do reject rõ ràng.
- Bug lưu cả `applicationComponent`, `defectCategory` và `componentCategory`. Hai field đầu giúp Fiori filter/report rõ ràng; `componentCategory` là cặp hợp lệ dùng cho assignment và phải được CAP handler validate consistency.

## DuplicateLinks

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| ID | UUID | Yes | Primary key. |
| sourceBug | Association to Bugs | Yes | Bug being created or linked from. |
| targetBug | Association to Bugs | Yes | Existing related bug. |
| relationType | String | Yes | Duplicate, Similar, Related. |
| createdAt | Timestamp | Yes | Link timestamp. |

## Modeling Notes for CAP

- Use UUID primary keys for Fiori Elements friendliness.
- Use CAP `cuid` and `managed` aspects where consistent with implementation style.
- Use compositions for bug-owned child records: Comments, Attachments, HistoryLogs, Notifications.
- Use associations for reusable master data: Users, Developers, SAPModules, ApplicationComponents, DefectCategories.
- Backend validation must enforce status transitions and assignment rules.
