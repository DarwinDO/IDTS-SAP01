# IDTS-108 screen and collaboration candidate package

## Control status

| Item | Value |
| --- | --- |
| Owner | SangVN |
| Support | DonHV for database and provider-side evidence |
| Baseline | `5807313` (`origin/dev`, 2026-07-31) |
| Package state | Ready for handoff with documented blockers; not full PASS/Done and not approved |
| Human briefing acknowledgment | `READ` — Jira IDTS-108 comment `10780` and repository acknowledgment row verified |
| Final integration owner | DonHV through IDTS-112 |
| Artifact policy | English-only SAP490 submission; official template unchanged |

This package is structured source for review. It does not modify runtime UI, CAP
behavior, the official Technical Specification workbook, or Google Drive. SangVN
has personally acknowledged the briefing and must separately approve the exact
candidate before integration. An agent must not sign either human gate. SangVN may
complete and hand off all currently executable Developer/source work while the
Tester/PM account captures and DonHV-owned database/provider evidence remain
explicit external blockers; that handoff is not a full PASS/Done claim.

## Tool and source baseline

- OfficeCLI preflight: `officecli --version` -> `1.0.143`.
- OfficeCLI limitation: this file is Markdown; OfficeCLI does not edit or validate
  Markdown, so repository-native text checks are used here. XLSX validation belongs
  to the later IDTS-112 integration.
- CAP MCP confirmed `AuthService`, `BugService`, the Bug entity metadata, bound Bug
  actions, AI actions, and collaboration entities after locked dependencies were
  installed in the isolated worktree.
- Fiori/UI5 MCP namespaces were not exposed in this session. Manifest, annotations,
  XML fragments, controllers, i18n, and CAP source are therefore the current evidence
  baseline for those layers.
- Primary source paths:
  - `app/bug-management-ui/webapp/manifest.json`
  - `app/bug-management-ui/annotations/`
  - `app/bug-management-ui/webapp/ext/`
  - `srv/service.cds`
  - `srv/service.js`
  - `srv/bug-service/`
  - `srv/ai/`

## 1. Screen Layout inventory

Natural numbers are the mentor-visible identifiers. Technical routes, actions, and
source symbols remain separate trace columns.

| No. | Screen or dialog | Route / trigger | Page type and main areas | Roles | Navigation / result | Source trace | Evidence state |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Sign In | `login.html` | SAPUI5 login form, email, password, safe message strip, Sign In | Anonymous | Success opens `index.html`; failure remains on form | `login-page.js`; `srv/auth.cds`; `srv/auth.js` | MISSING EVIDENCE — sanitized before/error/after and Network capture |
| 2 | Signed-in shell and profile | App bootstrap and profile button | User name/role, dashboard navigation, sign out | Tester, Developer, PM | Sign out clears browser session and invokes Auth logout | `Component.js`; `auth-guard.js`; `ext/login/ProfileShell.js` | MISSING EVIDENCE — role-specific shell and logout request |
| 3 | Role Dashboard | `dashboard.html` or Open Dashboard | Role-specific KPI tiles, focus list, developer workload, PM AI activity | Tester, Developer, PM; AI activity PM only | Focus item opens Bug Object Page; back opens List Report | `dashboard-page.js`; `BugService.DeveloperWorkloads`; `readAiOperationalMetrics` | MISSING EVIDENCE — one screenshot per role plus PM metrics dialog |
| 4 | Bug List Report | `index.html`, route `BugsList` | Filter bar, six view tabs, grid table, Dashboard and Create actions | All authenticated; Create only Tester/PM | Row opens Object Page; Create opens new draft page | `manifest.json`; `annotations/list-report.cds`; `annotations/pm-monitoring.cds`; `BugListActions.js` | MISSING EVIDENCE — role variants, tabs, filters and navigation |
| 5 | Create Bug | Fiori Create action, new draft Object Page | General, supporting, classification, reproduction, planning, Smart Assign, pending attachments | Tester, PM | Save activates Bug; cancel discards draft; assignee empty produces Pending Assignment | `BugListActions.createBug`; `object-page.cds`; `drafts.js`; `bug-write.js` | UI PASS — screenshots 29–33 prove empty/validation/Pending Assignment create and reload; screenshots 35–38 prove the Assigned create and reload variant with SangVN ownership. Network and database traces remain separate evidence gaps |
| 6 | Bug Object Page | Route `Bugs({key})` | Header, summary, classification/planning, reproduction, Smart Assign, comments, attachments, history, notifications, lifecycle toolbar | Tester, Developer, PM with backend ownership checks | Edit/save, actions and child sections refresh through OData side effects | `manifest.json`; `object-page.cds`; `actions.cds`; `service.cds` | MISSING EVIDENCE — display/edit and three role variants |
| 7 | Similar Bugs review | Open Similar Bugs in General Information | Candidate list, score/reason, selection, Accept/Reject/Ignore, Confirm Duplicate | Tester/PM for confirmation; authenticated review subject to backend guard | Suggestion review persists audit; confirm creates DuplicateLink only after accepted review | `SimilarBugReviewField.fragment.xml`; `DuplicateReview.js`; `duplicate-detection.js`; `duplicate-confirmation.js` | PARTIAL — screenshot 34 proves the normal suggestion dialog with ranked candidates, match scores/reasons and review controls. No decision/confirm mutation, fallback case, audit persistence or Network capture was executed |
| 8 | Classification review | Open Classification Suggestions after classification fields | Suggested values, confidence/reason, Accept/Reject/Ignore, Apply | Tester/PM apply; backend review authorization | Apply changes classification only for accepted current suggestion | `ClassificationReviewField.fragment.xml`; `ClassificationReview.js`; `classification-suggestion.js`; `classification-apply.js` | MISSING EVIDENCE — review/apply and stale-conflict case |
| 9 | Assignment and Smart Assign | Smart Assignment custom section and developer picker | Assignee input, candidate search/list, workload/availability, explanation, review buttons, Assign | Tester/PM assign; explanation remains advisory | Assign invokes bound action; empty selection is not auto-assigned | `SmartAssignmentSection.fragment.xml`; `SmartAssignDeveloper.js`; `AssignableDevelopers`; `assignment-explanation.js` | MISSING EVIDENCE — candidates, explanation review, assign and invalid assignee |
| 10 | Move to Pending Assignment | Object Page action dialog | Optional Reason | Tester/PM; visibility from `canMoveToPending` | Clears assignee, sets Pending Assignment and next processor | `actions.cds`; `service.js`; `actions.js` | MISSING EVIDENCE — request/result/history |
| 11 | Mark In Review | Object Page action dialog | Optional Developer Note | Assigned Developer or Tester/PM | Status becomes In Review | Same sources; `markInReview` | MISSING EVIDENCE — request/result/history |
| 12 | Request More Information | Object Page action dialog | Required Reason | Assigned Developer or Tester/PM | Status becomes Need More Information; Tester/PM becomes next actor | Same sources; `requestMoreInformation` | MISSING EVIDENCE — required-field failure and success |
| 13 | Resubmit to Developer | Object Page action dialog | Required Update Summary | Tester/PM | Status returns to Assigned; comment/history/notification are written | `actions.cds`; `actions.js::resubmitToDeveloper` | MISSING EVIDENCE — failure without summary and success |
| 14 | Reject Bug | Object Page action dialog | Required Rejection Reason | Assigned Developer or Tester/PM | Status becomes Rejected with follow-up owner | `actions.cds`; `service.js`; `actions.js::transitionBug` | MISSING EVIDENCE — required-field failure and success |
| 15 | Start Progress | Object Page action dialog | Optional Developer Note | Assigned Developer or Tester/PM | Status becomes In Progress | Same sources; `startProgress` | MISSING EVIDENCE — request/result/history |
| 16 | Resolve Bug | Object Page action dialog | Required Developer Note | Assigned Developer or Tester/PM | Status becomes Resolved; Tester/PM follow-up | Same sources; `resolveBug` | MISSING EVIDENCE — required-field failure and success |
| 17 | Send to Retest | Object Page action dialog | Optional Developer Note | Tester/PM | Status becomes Retest Required | Same sources; `sendToRetest` | MISSING EVIDENCE — request/result/history |
| 18 | Close Bug | Object Page action dialog | Optional Developer Note | Tester/PM | Status becomes Closed; no next processor | Same sources; `closeBug` | MISSING EVIDENCE — request/result/history |
| 19 | Reopen Bug | Object Page action dialog | Required Reason for Reopening | Tester/PM | Status becomes Reopened and processing ownership resumes | Same sources; `reopenBug` | MISSING EVIDENCE — required-field failure and success |
| 20 | Comments | Object Page Comments section | Comment input, Post, comment list | Tester, Developer, PM; active Bug only | Add Comment refreshes Bug/comments/history | `CommentsSection.fragment.xml`; `BugCollaboration.onAddComment`; `BugService.addComment` | MISSING EVIDENCE — hidden-on-create, empty failure, post and reload |
| 21 | Evidence / Attachments | Object Page Attachments section | File picker, pending list, uploaded table, Download, Delete | Tester, Developer, PM subject to backend access | New-draft files queue in browser; active upload persists metadata/binary | `AttachmentsSection.fragment.xml`; `BugCollaboration.js`; `content.js`; attachment model annotations | MISSING EVIDENCE — select, upload, reload, download/hash, delete and error cases |
| 22 | History Timeline | Object Page History section | Handoff action, growing event list, nested change table, reason/status | Authenticated Bug viewer | Show More pages immutable events; no mutation | `HistoryTimeline.fragment.xml`; `history-read-models.js`; `history.js` | MISSING EVIDENCE — initial five events, Show More and nested changes |
| 23 | Handoff Summary review | Open from History section | Grounded summary, status/owner, missing info, comments/events, Accept/Reject/Ignore | Authenticated eligible reviewer | Review updates AiSuggestion audit only; Bug workflow is unchanged | `HandoffSummaryReview.js`; `bug-summary.js`; `review.js` | MISSING EVIDENCE — grounded output, fallback, review and no-mutation |
| 24 | Notifications | Object Page Notifications facet | Event, recipient, channel, delivery status and timestamps | Authenticated Bug viewer under service authorization | Read-only display; email delivery remains separate outbox state | `history-notifications.cds`; `service.cds::Notifications` | MISSING EVIDENCE — list, refresh and delivery-state distinction |
| 25 | AI Activity metrics | PM Dashboard action | Feature totals, success/failure/timeout/unavailable, review counts, latency | PM only | Read-only aggregate; close returns to dashboard | `dashboard-page.js::openAiActivity`; `readAiOperationalMetrics`; `metrics.js` | MISSING EVIDENCE — authorized PM and denied non-PM |
| 26 | Operational evidence surfaces | External tools only when proving integration | PostgreSQL viewer, object storage, Brevo/inbox and Render state; not IDTS runtime screens | DonHV / authorized operator | Evidence is linked to the matching runtime flow | IDTS-100 evidence plus DonHV-provided IDTS-108 database/provider evidence | MISSING EVIDENCE — owner action required |

## 2. Screen Definition inventory

### 2.1 Shared Bug fields

| No. | Screen | Label / action | Binding or operation | I/O | Type | Required / read-only | Role and visibility | Validation and failure behavior |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Create/Object Page | Bug Number | `Bugs.bugNumber` | O | String | Read-only; hidden for unsaved new draft | All viewers | Generated by backend; never accepted as client authority |
| 2 | Create/Object Page | Title | `Bugs.title` | I/O | String(255) | Required | Tester/PM create; permitted edit path | CAP rejects blank value and targets `title` |
| 3 | Create/Object Page | Description | `Bugs.description` | I/O | LargeString | Required, multiline | Same as Title | CAP rejects blank value and targets `description` |
| 4 | Object Page | Status | `Bugs.status_code` / `status.name` | O | Association | Read-only | All viewers | Changed only by validated workflow action |
| 5 | Create/Object Page | Priority | `Bugs.priority_code` | I/O | Fixed value help | Required | Permitted editors | Active catalog validation; invalid/inactive code rejected |
| 6 | Create/Object Page | Severity | `Bugs.severity_code` | I/O | Fixed value help | Required | Permitted editors | Active catalog validation; invalid/inactive code rejected |
| 7 | Create/Object Page | Environment | `Bugs.environment_code` | I/O | Fixed value help | Optional in current model | Permitted editors | Selected catalog value must be active |
| 8 | Create/Object Page | Environment Detail | `Bugs.environmentDetail` | I/O | String(255) | Optional | Permitted editors | Safe length/normal CAP validation |
| 9 | Create/Object Page | SAP Module | `Bugs.sapModule_ID` | I/O | Value help | Optional | Permitted editors | Active module only; also filters assignment context |
| 10 | Create/Object Page | Application Component | `Bugs.applicationComponent_ID` | I/O | Value help | Required | Permitted editors | Active component required; participates in component-category consistency |
| 11 | Create/Object Page | Defect Category | `Bugs.defectCategory_ID` | I/O | Dependent value help | Required | Permitted editors | Filtered by Application Component; invalid pair rejected |
| 12 | Create/Object Page | Component Category | `Bugs.componentCategory_ID` | O/system | Association | Derived/read-only in normal UI | All viewers when surfaced | CAP derives or validates component/category pair |
| 13 | Create/Object Page | Steps to Reproduce | `Bugs.stepsToReproduce` | I/O | LargeString | Required, multiline | Permitted editors | Blank value blocks activation |
| 14 | Create/Object Page | Actual Result | `Bugs.actualResult` | I/O | LargeString | Required, multiline | Permitted editors | Blank value blocks activation |
| 15 | Create/Object Page | Expected Result | `Bugs.expectedResult` | I/O | LargeString | Required, multiline | Permitted editors | Blank value blocks activation |
| 16 | Create/Object Page | Test Case Reference | `Bugs.testCaseRef` | I/O | String | Optional | Permitted editors | Lightweight reference only |
| 17 | Create/Object Page | Test Run Reference | `Bugs.testRunRef` | I/O | String | Optional | Permitted editors | Lightweight reference only |
| 18 | Create/Object Page | Planned Completion Date | `Bugs.plannedCompletionDate` | I/O | Date | Optional | Tester/PM planning | CAP date validation; no speculative planning module |
| 19 | Create/Object Page | Due Date | `Bugs.dueDate` | I/O | Date | Optional | Tester/PM planning | Drives overdue read model; invalid payload rejected |
| 20 | Create/Object Page | Estimated Effort Hours | `Bugs.estimatedEffortHours` | I/O | Decimal | Optional | Tester/PM planning | Numeric boundary validation in CAP/model |
| 21 | Create/Object Page | Assignee | `Bugs.assignee_ID` / `AssignableDevelopers.developerProfileID` | I/O | Value help / picker | Optional; empty means Pending Assignment | Tester/PM | Backend validates active, available and responsibility match; invalid choice rejected |
| 22 | Object Page | Assignee (Technical Owner) | `assigneeDisplayName` | O | String | Read-only | All viewers | Derived from current developer profile |
| 23 | Object Page | Current Action Owner | `currentActionOwnerDisplayName` | O | String | Read-only | All viewers | Derived from next user/role and workflow state |
| 24 | Object Page | Action Owner Role | `nextProcessorRoleName` | O | String | Read-only | All viewers | Derived; never editable through UI |
| 25 | Object Page | Latest Rejection Reason | `rejectionReason` | O | LargeString | Read-only outside Reject action | Visible for Rejected follow-up | Reject requires a reason; later valid transition may clear it |
| 26 | Object Page | Reporter | `reporterDisplayName` | O | String | Read-only | All viewers | Set from authenticated creator, not client-provided identity |
| 27 | Object Page | Created At / Updated At | `createdAt`, `modifiedAt` | O | Timestamp | Read-only | All viewers | CAP managed timestamps |

### 2.2 Actions and collaboration controls

| No. | Screen | Label / control | Binding or operation | Input | Role / visibility | Validation and failure behavior |
| ---: | --- | --- | --- | --- | --- | --- |
| 28 | List Report | Open Dashboard | `BugListActions.openDashboard` | None | All authenticated | Navigates to dashboard; auth guard remains active |
| 29 | List Report | Create Bug | `BugListActions.createBug` | None | Tester/PM only | Backend rechecks create permission even if UI action is hidden |
| 30 | Smart Assignment | Search / candidate filters | `AssignableDevelopers` read model | Search text and Bug classification | Tester/PM | Empty or invalid classification yields no assignable result / safe guidance |
| 31 | Smart Assignment | Explain assignment | `explainSmartAssignment` | Bug, component category, optional SAP module, limit | Authenticated eligible user; advisory | Failure returns unavailable explanation and does not block manual assignment |
| 32 | Smart Assignment | Accept / Reject / Ignore explanation | `acceptAiSuggestion`, `rejectAiSuggestion`, `ignoreAiSuggestion` | Suggestion ID | Authorized reviewer | Only current Pending audit row can transition; repeat review returns conflict |
| 33 | Smart Assignment | Assign | Bound `assignToDeveloper` | Required assignee ID, optional note | Tester/PM | Invalid/missing assignee -> 400; unauthorized -> 403; success refreshes history/notifications |
| 34 | Similar Bugs | Find Similar Bugs | `suggestSimilarBugs` | Bug context or pre-create text/classification | Authenticated | Missing meaningful input -> 400; provider failure uses safe fallback |
| 35 | Similar Bugs | Accept / Reject / Ignore | AI review actions | Suggestion ID | Authorized reviewer | Review changes audit only |
| 36 | Similar Bugs | Confirm Duplicate | `confirmDuplicateSuggestion` | Suggestion ID and candidate Bug ID | Tester/PM | Requires accepted current suggestion and listed candidate; duplicate/self links rejected |
| 37 | Classification | Suggest Classification | `suggestClassification` | Bug text/reproduction/classification context | Authenticated | Missing context -> 400; provider failure remains non-blocking |
| 38 | Classification | Accept / Reject / Ignore | AI review actions | Suggestion ID | Authorized reviewer | Review changes audit only |
| 39 | Classification | Apply | `applyClassificationSuggestion` | Suggestion ID | Tester/PM | Requires accepted current suggestion and unchanged Bug classification |
| 40 | Object Page | Move to Pending Assignment | Bound action | Optional reason | Tester/PM when `canMoveToPending` | Clears assignee; invalid transition or role rejected |
| 41 | Object Page | Mark In Review | Bound action | Optional developer note | Assigned Developer or Tester/PM when `canMarkInReview` | Requires assignee and valid source status |
| 42 | Object Page | Request More Information | Bound action | Required reason | Assigned Developer or Tester/PM when `canRequestMoreInfo` | Blank reason -> 400 targeted to Reason |
| 43 | Object Page | Resubmit to Developer | Bound action | Required update summary | Tester/PM when `canResubmit` | Requires existing assignee and valid Need More Information state |
| 44 | Object Page | Reject Bug | Bound action | Required rejection reason | Assigned Developer or Tester/PM when `canReject` | Blank reason or invalid transition rejected |
| 45 | Object Page | Start Progress | Bound action | Optional developer note | Assigned Developer or Tester/PM when `canStartProgress` | Requires assignee and valid transition |
| 46 | Object Page | Resolve Bug | Bound action | Required developer note | Assigned Developer or Tester/PM when `canResolve` | Blank note, missing assignee or invalid transition rejected |
| 47 | Object Page | Send to Retest | Bound action | Optional developer note | Tester/PM when `canSendToRetest` | Invalid transition rejected |
| 48 | Object Page | Close Bug | Bound action | Optional developer note | Tester/PM when `canClose` | Invalid transition rejected; next processor cleared |
| 49 | Object Page | Reopen Bug | Bound action | Required reason | Tester/PM when `canReopen` | Blank reason or invalid transition rejected |
| 50 | Comments | Comment input / Post | Bound `addComment` | Comment text | Tester, Developer, PM on active Bug | Empty text -> 400; unauthorized -> 403; create-draft section hidden |
| 51 | Attachments | Select file | `onAttachmentSelected` | File | Tester, Developer, PM | Client and attachment annotations enforce allowed type/10 MB; create draft queues locally |
| 52 | Attachments | Download | `onDownloadAttachment` | Attachment row | Authorized Bug viewer | Missing/failed stream shows safe error; no metadata mutation |
| 53 | Attachments | Delete | `onDeleteAttachment` | Attachment row plus confirmation | Authorized participant | Cancel performs no mutation; failure keeps row and shows safe message |
| 54 | History | Show More | Growing OData list | Paging request | Authenticated Bug viewer | Read-only; failed page request must not mutate history |
| 55 | History | Generate Handoff Summary | `summarizeBugHandoff` | Source Bug ID | Authenticated eligible user | Missing/not-found source -> 400/404; provider failure produces safe result |
| 56 | Handoff Summary | Accept / Reject / Ignore | AI review actions | Suggestion ID | Authorized reviewer | Review updates audit only; repeated review returns conflict |
| 57 | Notifications | Notification list | `Bugs.notifications` | None | Authenticated Bug viewer | Read-only projection excludes secret email bodies/configuration |
| 58 | Dashboard | AI Activity | `readAiOperationalMetrics` | Window days | PM only | Non-PM denied by CAP; provider/raw prompt/error detail not returned |
| 59 | Shell | Sign Out | `AuthService.logout` plus local session clear | None | Authenticated | Network failure still clears local session safely |

## 3. Technical Implementation trace candidate

The HTTP/OData column records the source contract. A browser Network capture is still
required before the row can be accepted as executed evidence.

| No. | Function | UI / frontend | HTTP or OData contract | CAP handler / validation | Data and result | Evidence state |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Sign in | `login-page.js::submitLogin` | `POST /odata/v4/auth/login` | `srv/auth.js::login`; active user and password hash checks | Reads Users, creates AuthSessions, returns raw token once | MISSING EVIDENCE — sanitized request/response and signed-in shell |
| 2 | Create Bug draft | List Create -> Fiori new page | OData V4 draft `NEW`, `PATCH`, `SAVE` | `prepareDraftNew`, `prepareDraftPatch`, `handleDraftSave`, `prepareBugWrite` | Activates Bug as Assigned or Pending Assignment; history/notification follow | MISSING EVIDENCE — draft and active requests plus result |
| 3 | Classification value help | Fiori generated inputs | Reads SAPModules, ApplicationComponents, ValidDefectCategories | CAP projections and active-pair validation | Returns active values; invalid pair blocks save | MISSING EVIDENCE — dependent value help request/result |
| 4 | Similar Bugs suggestion | `DuplicateReview.openDialog` | Unbound `suggestSimilarBugs` | `duplicate-detection.js`; safe input and source checks | Returns ranked candidates; optional safe AiSuggestions audit; no DuplicateLink | MISSING EVIDENCE — normal and fallback |
| 5 | Confirm duplicate | Duplicate review Confirm | Unbound `confirmDuplicateSuggestion` | `duplicate-confirmation.js`; role, accepted state, membership, duplicate checks | Inserts one DuplicateLink or rejects atomically | MISSING EVIDENCE — accepted flow and conflict |
| 6 | Classification suggestion | `ClassificationReview.openDialog` | Unbound `suggestClassification` | `classification-suggestion.js`; context/source validation | Returns reviewable candidate rows; no automatic Bug mutation | MISSING EVIDENCE — normal and unavailable |
| 7 | Apply classification | Classification Apply | Unbound `applyClassificationSuggestion` | `classification-apply.js`; Tester/PM, accepted/current, stale-state checks | Updates validated classification and audit/history in controlled transaction | MISSING EVIDENCE — before/request/after/history |
| 8 | Explain Smart Assign | `SmartAssignDeveloper` | Unbound `explainSmartAssignment` | `assignment-explanation.js`; classification and source checks | Returns explanation/warnings only; manual picker remains available | MISSING EVIDENCE — normal and provider failure |
| 9 | Assign Developer | Smart Assign button | Bound `BugService.assignToDeveloper` | `assignToDeveloper` -> `transitionBug`; coordinator role and assignee validation | Updates assignee/status/next processor/history/notification | MISSING EVIDENCE — UI, request, result and history |
| 10 | Move to Pending Assignment | Fiori action dialog | Bound `moveToPendingAssignment` | `transitionBug`; role and transition checks | Clears assignee; writes dedicated audit and notification | MISSING EVIDENCE — request/result/history |
| 11 | Mark In Review | Fiori action dialog | Bound `markInReview` | `transitionBug`; assigned Developer or coordinator, assignee required | Status In Review; dedicated audit/notification | MISSING EVIDENCE — request/result/history |
| 12 | Request More Information | Fiori action dialog | Bound `requestMoreInformation` | `transitionBug`; reason and assignee required | Status Need More Information; next processor changes | MISSING EVIDENCE — negative and positive |
| 13 | Resubmit to Developer | Fiori action dialog | Bound `resubmitToDeveloper` | Dedicated handler; Tester/PM, note and assignee required | Status Assigned; adds comment, history and notification | MISSING EVIDENCE — negative and positive |
| 14 | Reject Bug | Fiori action dialog | Bound `rejectBug` | `transitionBug`; assigned Developer/coordinator; reason required | Status Rejected; reason and follow-up owner persisted | MISSING EVIDENCE — negative and positive |
| 15 | Start Progress | Fiori action dialog | Bound `startProgress` | `transitionBug`; assignee and transition checks | Status In Progress; dedicated audit/notification | MISSING EVIDENCE — request/result/history |
| 16 | Resolve Bug | Fiori action dialog | Bound `resolveBug` | `transitionBug`; note and assignee required | Status Resolved; Tester/PM follow-up | MISSING EVIDENCE — negative and positive |
| 17 | Send to Retest | Fiori action dialog | Bound `sendToRetest` | `transitionBug`; coordinator role and transition check | Status Retest Required; audit/notification | MISSING EVIDENCE — request/result/history |
| 18 | Close Bug | Fiori action dialog | Bound `closeBug` | `transitionBug`; coordinator role and transition check | Status Closed; next processor cleared | MISSING EVIDENCE — request/result/history |
| 19 | Reopen Bug | Fiori action dialog | Bound `reopenBug` | `transitionBug`; coordinator role and reason required | Status Reopened; processing ownership resumes | MISSING EVIDENCE — negative and positive |
| 20 | Add Comment | `BugCollaboration.onAddComment` | Bound `BugService.addComment` | `actions.js::addComment`; participant role and nonblank content | Inserts Comment and HistoryEvent; refreshes Object Page | MISSING EVIDENCE — empty failure, post and reload |
| 21 | Queue attachment on create | `onAttachmentSelected` | Client memory only before activation | Client checks plus attachment metadata contract | No database/S3 write until active Bug exists | MISSING EVIDENCE — pending list and no upload request |
| 22 | Upload attachment | Pending flush or active selection | Attachment metadata plus binary stream request | `prepareAttachmentWrite`; attachment plugin validation | Persists metadata and binary; row appears after refresh | MISSING EVIDENCE — Network, DB evidence from DonHV, storage result |
| 23 | Download attachment | `onDownloadAttachment` | Attachment content stream GET | Attachment authorization/plugin | Returns binary with safe filename; no write | MISSING EVIDENCE — download/hash |
| 24 | Delete attachment | `onDeleteAttachment` after confirm | Attachment DELETE | Attachment authorization/plugin | Deletes metadata/object without deleting Bug | MISSING EVIDENCE — before/request/after/reload |
| 25 | Read history | History fragment growing list | Read `HistoryEvents` and nested `HistoryLogs` | `history-read-models.js` enriches paged read model | Returns immutable grouped events; Show More requests next page | MISSING EVIDENCE — initial and next page |
| 26 | Generate Handoff Summary | `HandoffSummaryReview.openDialog` | Unbound `summarizeBugHandoff` | `bug-summary.js`; source, grounding and safe provider boundary | Returns grounded summary and writes safe review audit only | MISSING EVIDENCE — output, review and no-mutation |
| 27 | Review AI suggestion | Shared Accept/Reject/Ignore controls | Unbound review action | `review.js`; permission and Pending/current checks | Updates AiSuggestions review fields only | MISSING EVIDENCE — each decision and repeat conflict |
| 28 | Read notifications | Object Page Notifications facet | OData navigation read | Read-only service projection | Returns safe in-app/delivery status fields | MISSING EVIDENCE — refresh and email-state comparison |
| 29 | Read role dashboard | `dashboard-page.js::loadDashboard` | Reads Bugs and DeveloperWorkloads | CAP read models and auth | Builds role-specific tiles/focus rows without mutation | MISSING EVIDENCE — Tester, Developer and PM |
| 30 | Read AI activity | PM dashboard dialog | Function `readAiOperationalMetrics` | `metrics.js`; PM requirement and allowlisted aggregates | Returns counts/latency only; no raw provider payload | MISSING EVIDENCE — PM success and non-PM denial |

### 3.1 Line-level source verification — 2026-08-01

The trace above was rechecked against the current candidate worktree. These
anchors verify that the named UI operations, OData contracts and CAP handlers
exist in the current source; they do not replace the separate runtime evidence
state recorded in the final column.

| Trace area | Current source anchors | Verification result |
| --- | --- | --- |
| Authentication | `app/bug-management-ui/webapp/login-page.js:148`; `srv/auth.cds:24-27`; `srv/auth.js:28-36,95` | Login/logout UI and CAP action trace confirmed |
| Bug draft/create | `srv/service.js:87-95,148-150`; `srv/bug-service/drafts.js:23,53,90`; `srv/bug-service/bug-write.js:33` | NEW/PATCH/SAVE preparation and final validation trace confirmed |
| Lifecycle and assignment | `srv/service.cds:197,234-243`; `srv/service.js:154-207`; `srv/bug-service/actions.js:32,49` | Bound action contracts and handler registration trace confirmed |
| Similar Bugs | `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js:119,206,470-516`; `srv/service.cds:112,151-156`; `srv/ai/duplicate-detection.js:26`; `srv/ai/duplicate-confirmation.js:13` | Suggest/review/confirm trace confirmed |
| Classification | `app/bug-management-ui/webapp/ext/actions/ClassificationReview.js:142,247,583-634`; `srv/service.cds:125,151-154`; `srv/ai/classification-suggestion.js:63`; `srv/ai/classification-apply.js:57` | Suggest/review/apply trace confirmed |
| Smart Assign | `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js:287,381,662-838`; `srv/service.cds:143,197`; `srv/ai/assignment-explanation.js:21`; `srv/bug-service/actions.js:32` | Explain/review/manual assign trace confirmed |
| Handoff summary | `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js:119,388-444`; `srv/service.cds:139,151-153`; `srv/ai/bug-summary.js:28`; `srv/ai/review.js:18-26` | Generate and shared review trace confirmed |
| Comments and attachments | `app/bug-management-ui/webapp/ext/sections/BugCollaboration.js:351,388,427,451`; `srv/service.js:104`; `srv/bug-service/content.js:60` | UI collaboration handlers and attachment validation hook confirmed |
| History and notifications | `srv/service.js:125`; `srv/bug-service/history-read-models.js:75`; `app/bug-management-ui/annotations/history-notifications.cds:30-47` | Read-only history enrichment and Fiori annotation trace confirmed |
| Dashboard and AI metrics | `app/bug-management-ui/webapp/dashboard-page.js:213,221,314`; `srv/service.js:130-131,146`; `srv/ai/metrics.js:141` | Role dashboard reads and PM AI-metrics function trace confirmed |

## 4. Evidence register

| Evidence ID | Required capture | Owner | Security treatment | State |
| --- | --- | --- | --- | --- |
| EVID-108-UI-LOGIN | Before, validation error, successful sign-in and shell | SangVN | Mask email; no password/token | UI PASS / NETWORK OPEN — sanitized SAP Identity and IDTS login/validation states, the post-switch failure, direct Tester shells, and fresh Tester→Developer→Tester role-shell/dashboard evidence are captured. Both account-switch directions now pass at UI level. Direct `AuthService.me` Network 200 JSON remains DonHV/runtime evidence before IDTS-117 closure |
| EVID-108-UI-ROLES | List/Object Page/dashboard for Tester, Developer and PM | SangVN | Use demo users; avoid full private email | PARTIAL — Developer and Tester List Report, dashboard and Object Page ownership/action states captured through the SAP BTP/approuter flow; PM remains missing |
| EVID-108-UI-CREATE | New draft, required-field error, Assigned save, Pending Assignment save | SangVN | Sanitize Bug text | UI PASS — screenshots 29–33 prove empty draft, nine required-field messages, valid value-help selection, BUG-0023 Pending Assignment creation and reload persistence. Screenshots 35–38 prove BUG-0024 creation as Assigned with SangVN as technical/current owner and the same ID/status/ownership after full reload |
| EVID-108-UI-LIFECYCLE | Each of 11 actions with dialog, request, result and history | SangVN | Sanitize notes/reasons | PARTIAL — Developer visibility/dialogs captured for Request More Information, Reject Bug and Resolve Bug; Tester visibility/dialogs captured for Close Bug and Reopen Bug for Further Work. All dialogs were dismissed without submission, so request/result/history evidence remains missing |
| EVID-108-UI-COLLAB | Comment, attachment queue/upload/download/delete/reload, history paging | SangVN | No attachment secrets or raw private logs | PARTIAL / OPEN DEFECTS — Developer enabled/disabled states and negative comment/upload attempts captured. Comment posting failed twice and is tracked by IDTS-116. The native picker accepted a safe `.txt`, but upload failed before persistence and is tracked in IDTS-113; download/delete/reload proof is therefore unavailable |
| EVID-108-UI-AI | Similar, classification, handoff and Smart Assign review/apply/confirm/no-mutation | SangVN | No raw prompt/provider payload or private endpoint | PARTIAL — screenshot 34 proves Similar Bugs; screenshot 42 proves Classification Suggestions; screenshot 45 proves Handoff Summary; screenshot 47 proves the filtered Smart Assign candidate explanation with capability, availability, confidence and manual-choice controls. All remained read-only with no Accept/Reject/Ignore/Apply/Assign/Confirm Duplicate action. Fallback, review persistence/no-mutation and AI Network evidence remain missing |
| EVID-108-NETWORK | Sanitized OData request/response for every traced function | SangVN | Remove bearer token, cookie, private host and full email | PARTIAL — screenshots 39–40 prove the authenticated BUG-0024 reload/read through `POST /odata/v4/bug/$batch` with outer and inner HTTP 200. The response contains BUG-0024, `ASSIGNED`, SangVN technical/current owner, Developer next role and `IsActiveEntity:true`. No Cookie, Authorization, token, password or email is visible. Remaining traced functions still require sanitized request/response evidence |
| EVID-108-DATABASE | Bug, history, comment, notification, attachment metadata and duplicate/classification side effects | DonHV | No DB URL/credential; use selected rows only | DEFERRED OWNER ACTION — DonHV supplies sanitized selected-row evidence before final integration/acceptance |
| EVID-108-PROVIDER | S3/object storage and email/provider result where applicable | DonHV | No bucket secret, SMTP/API key, private endpoint or recipient list | DEFERRED OWNER ACTION — DonHV supplies sanitized object-store/email evidence where applicable before final integration/acceptance |

### 4.1 Captured Developer evidence — 2026-07-31

All captures below came from the current SAP BTP approuter in a Developer session.
Login images use an empty field or the non-personal placeholder
`developer@example.invalid`; no password, token, or real account identifier is
visible. A controlled comment post and safe text-file upload were attempted with
SangVN's explicit approval; both failed without persistence. Lifecycle dialogs
were opened only for evidence and dismissed without submission. BUG-0003 remained
`In Progress`.

| File | Evidence shown | Remaining limitation |
| --- | --- | --- |
| `screenshots/01-developer-list-report.png` | Developer List Report, filters, monitoring tabs and visible Bug rows | Does not prove Tester/PM variants or Network calls |
| `screenshots/02-developer-dashboard.png` | Developer KPI tiles and needs-attention list | Does not prove Tester/PM dashboards |
| `screenshots/03-developer-object-page-header.png` | BUG-0011 header, technical owner SangVN and current action owner NhanT | Read-only visibility state only |
| `screenshots/04-developer-comments.png` | Existing comments and disabled post state while the current edit is unresolved | No comment mutation/reload proof |
| `screenshots/05-developer-attachments.png` | Attachment section, empty state and disabled upload state | No upload/download/delete proof |
| `screenshots/06-developer-history.png` | Existing immutable lifecycle/edit events and Show Details controls | No paging or expanded-detail proof |
| `screenshots/07-developer-notifications.png` | Five in-app notifications and event/channel columns | No delivery/provider proof |
| `screenshots/08-developer-lifecycle-actions.png` | BUG-0003 with SangVN as technical/current owner and visible Request More Information, Reject Bug and Resolve Bug actions | Visibility only; no effect executed |
| `screenshots/09-developer-comments-enabled.png` | BUG-0003 enabled Comment and Upload Evidence controls for the current Developer | Pre-action state only |
| `screenshots/10-developer-comment-post-failed.png` | First authorized Developer comment attempt returned the safe UI error and left no comment row | Negative UI evidence; no Network payload captured |
| `screenshots/11-developer-comment-retry-failed.png` | One refresh/retry returned the same error and still did not persist the comment | Open IDTS-116; no third attempt made |
| `screenshots/12-developer-attachment-upload-failed.png` | Native picker accepted a sanitized `.txt`, but application upload failed and the attachment table remained empty | Open IDTS-113; download, delete and persistence checks were impossible |
| `screenshots/13-developer-request-more-information-no-dialog.png` | First semantic click left BUG-0003 unchanged and no dialog visible | Browser-automation checkpoint only; superseded by the successful DOM-control capture below |
| `screenshots/14-developer-request-more-information-dialog.png` | Request More Information dialog with required Reason field | Dialog only; Cancel used, no action request submitted |
| `screenshots/15-developer-reject-bug-dialog.png` | Reject Bug dialog with required Rejection Reason field | Dialog only; automation timed out on Cancel, so the page was safely reloaded; status remained In Progress |
| `screenshots/16-developer-resolve-bug-dialog.png` | Resolve Bug dialog with required Developer Note field | Dialog only; page reloaded without submission; status remained In Progress |
| `screenshots/17-developer-login-empty.png` | SAP Identity identifier step with a non-personal placeholder | Sanitized identity-provider state; not the IDTS application login form |
| `screenshots/18-developer-login-validation.png` | SAP Identity safe authentication error with a non-personal placeholder and empty password | Negative identity-provider state only; no password was entered |
| `screenshots/19-developer-idts-login-empty.png` | Blank IDTS login form with Email and Password fields | Pre-action application login state |
| `screenshots/20-developer-idts-login-validation.png` | IDTS required-field errors for empty Email and Password | Negative client validation; no credential submitted |
| `screenshots/21-developer-idts-login-failed.png` | Sanitized generic IDTS sign-in failure after BTP Identity authentication | Open IDTS-117; fresh successful shell transition is missing |
| `screenshots/22-tester-list-report.png` | Authenticated Tester List Report with monitoring tabs and Bug rows | No PM variant or Network evidence |
| `screenshots/23-tester-dashboard.png` | Tester KPI tiles for reported bugs, input queue and retest queue | No PM dashboard; counts are point-in-time BTP data |
| `screenshots/24-tester-object-page-actions.png` | BUG-0011 in `Retest Required`, technical owner SangVN, current action owner NhanT, and Tester-visible Close/Reopen actions | Visibility only; no action submitted |
| `screenshots/25-tester-close-bug-dialog.png` | Tester Close Bug dialog and Developer Note field | Dialog only; Cancel used and no status change submitted |
| `screenshots/26-tester-reopen-dialog.png` | Tester Reopen Bug for Further Work dialog and required reason field | Dialog only; Cancel used and no status change submitted |
| `screenshots/27-tester-post-rollout-access-blocker.png` | Post-IDTS-117-rollout protected Tester entry displays the safe access alert instead of the Fiori shell | Regression evidence only; IDTS-117 comment `10806`, issue reopened In Progress; no application mutation submitted |
| `screenshots/28-tester-post-fix-list-report.png` | Fresh direct Tester BTP entry renders the role List Report and NhanT profile shell | Direct-entry success only; does not close the cross-account IDTS-117 path |
| `screenshots/29-tester-create-bug-empty-form.png` | New Bug draft before values are entered | Draft state only; no active Bug yet |
| `screenshots/30-tester-create-bug-required-validation.png` | Empty Create attempt exposes nine required-field messages | Negative validation evidence; draft remains open |
| `screenshots/31-tester-create-bug-valid-form.png` | Sanitized required reproduction/test-context values are present and the Create action is enabled | Pre-create state; value-help selections were verified separately in the UI |
| `screenshots/32-tester-bug-0023-created.png` | Active BUG-0023 after Object created, with sanitized reproduction/test context | Pending Assignment result; no comment, attachment, assignment or lifecycle mutation |
| `screenshots/33-tester-bug-0023-reload-persistence.png` | BUG-0023 remains active with the same title and Pending Assignment state after full reload | Proves UI persistence; database-row evidence remains DonHV-owned |
| `screenshots/34-tester-similar-bugs-suggestions.png` | BUG-0023 Similar Bugs dialog with ranked candidates, match scores, safe reasons and review controls | Read-only suggestion evidence; dialog closed without review or duplicate-confirmation mutation; fallback/Network/audit persistence remain missing |
| `screenshots/35-tester-assigned-bug-valid-form.png` | Assigned-variant draft with sanitized title, Priority MEDIUM and Severity MAJOR before activation | Pre-create field evidence; classification and assignee are shown separately because the Fiori Object Page scrolls by section |
| `screenshots/36-tester-assigned-bug-assignee.png` | Assigned-variant draft with SangVN selected as Assignee (Technical Owner) | Pre-create ownership evidence; no active Bug existed yet |
| `screenshots/37-tester-bug-0024-assigned-created.png` | Active BUG-0024 after Create with status Assigned and Current Action Owner SangVN | UI creation result; database-row evidence remains DonHV-owned |
| `screenshots/38-tester-bug-0024-assigned-reload.png` | BUG-0024 after full reload with the same ID, title, Assigned status, Technical Owner SangVN and Current Action Owner SangVN | UI persistence PASS; Network and database proof remain separate evidence items |
| `screenshots/39-network-bug-0024-response.png` | User-captured Edge DevTools `$batch` response beside BUG-0024, showing inner HTTP 200 and the OData entity response | Proves `BUG-0024`, `ASSIGNED`, SangVN ownership, Developer next role and `IsActiveEntity:true`; copied from the authorized Tester session; no credential header is visible |
| `screenshots/40-network-bug-0024-batch-headers.png` | User-captured Edge DevTools Headers General view for `POST /odata/v4/bug/$batch` with status `200 OK` beside BUG-0024 | Request Headers are not expanded to any Cookie/Authorization value; full endpoint and correlation IDs remain repository-only evidence and must not be pasted raw into Jira |
| `screenshots/41-tester-fresh-btp-login-role-shell.png` | Fresh direct SAP BTP Tester session rendered the Bugs List Report with 27 items | The screenshot does not expose a private identifier; DOM separately confirmed profile `NhanT`. Direct entry does not close cross-account IDTS-117 |
| `screenshots/42-tester-classification-suggestions-review.png` | BUG-0024 Classification Suggestions dialog with five current/suggested fields, rationale, confidence and review controls | Read-only visibility evidence; no Accept/Reject/Ignore/Apply action submitted. Handoff, Smart Assign, fallback, audit persistence and Network remain open |
| `screenshots/43-developer-cross-account-login-role-shell.png` | Tester→Developer switch returned to the Bugs List Report; DOM confirmed profile SangVN | Screenshot contains no private identifier; role-specific Dashboard evidence is captured separately |
| `screenshots/44-developer-cross-account-dashboard.png` | Developer dashboard after the cross-account switch with Assigned to me, In progress and Information requested tiles plus SangVN-owned work | UI role-shell evidence only; direct `AuthService.me` Network response remains outside this capture |
| `screenshots/45-developer-handoff-summary-review.png` | Completed BUG-0024 Handoff Summary with grounded advisory, verified status/current owner, risks, comment insight, next action, source sections and review controls | Read-only normal-result evidence; no Accept/Reject/Ignore action. Fallback, audit persistence and Network remain open |
| `screenshots/46-tester-cross-account-dashboard.png` | Developer→Tester switch returned to the Tester dashboard with Created by me, Need my input and Retest required tiles | Completes the reverse UI direction; no credential page or private identifier captured |
| `screenshots/47-tester-smart-assign-review.png` | Filtered Smart Assign Developer dialog with current assignee, advisory/review notices, demo candidate capability, availability, AI explanation, confidence, Assign and Cancel | Safe demo-only capture; the real private email row was excluded before capture. Cancel and Discard Draft were used; no review, selection or assignment persisted |

## 5. Review and approval checklist

- [x] Candidate package is based on current `origin/dev` baseline `5807313`.
- [x] Runtime `app/`, `srv/`, and `db/` are unchanged by this task.
- [x] Natural numbering is used for mentor-visible entries.
- [x] Screen Layout inventory covers runtime pages, dialogs, sections and necessary
  operational evidence surfaces.
- [x] Initial Screen Definition separates fields/actions and records binding, type,
  I/O, role, validation and failure behavior.
- [x] Technical Implementation records one function/action per row.
- [x] SangVN personally acknowledges the mandatory briefing in Jira and repo evidence (`IDTS-108` comment `10780`; briefing commit `4b4c93c1d8b45024677653e1f890d52e742b2aaf`).
- [ ] SangVN captures and sanitizes the UI/network evidence listed above.
- [ ] DonHV supplies the database/provider evidence listed above.
- [ ] Source paths and symbols receive final line-level review against the merge
  baseline used by IDTS-112.
- [ ] SangVN records explicit candidate-package approval in Jira and the repository.
- [ ] IDTS-112 integrator maps approved rows into a fresh official Technical
  Specification template copy and runs OfficeCLI, visual, secret and source-trace
  verification.

## 6. Known gaps and handoff

1. SangVN briefing acknowledgment is `READ` in Jira comment `10780` and the
   repository acknowledgment register. Candidate approval remains separate and
   Pending until the evidence/review gates below are resolved.
2. The current generated v0.7 workbook has representative screenshots and a compact
   definition table, but it is not the final source for this expanded inventory.
3. Fiori/UI5 MCP read-only verification is unavailable in this session. IDTS-112
   should rerun those servers if exposed, plus UI5 manifest validation and lint.
4. Every `MISSING EVIDENCE` row must be either filled with a sanitized artifact or
   explicitly accepted as a documented external blocker by the human owner.
5. SangVN can hand off the current package after completing the remaining executable
   trace/review work. Tester evidence now uses the SAP BTP/approuter authentication
   flow; PM captures still require an authorized account. DonHV owns the
   deferred database/provider evidence. Until these gaps and IDTS-113/116/117 are
   supplied, retested, or explicitly accepted, the package remains ready with
   blockers rather than full PASS/Done.
6. Canonical business documents are unchanged because this package records existing
   runtime behavior and does not change business meaning or scope.
