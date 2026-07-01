# WP4 - Fiori Elements UX

Status: Completed
Owner workstream: Fiori/UI5
Primary member: DatDT
Support: DonHV, NhanT
Last updated: 2026-06-18

Vietnamese: WP4 Ä‘ang thá»±c hiá»‡n - ÄÃ£ hoÃ n thÃ nh Option B táº¡o bug sáº¡ch sáº½ vÃ  verify thá»±c táº¿; cÃ¡c pháº§n khÃ¡c cá»§a WP4 Ä‘ang tiáº¿p tá»¥c.

## Goal

Build the main IDTS List Report/Object Page experience using Fiori Elements where possible.

Vietnamese: XÃ¢y dá»±ng tráº£i nghiá»‡m chÃ­nh cá»§a IDTS báº±ng Fiori Elements List Report/Object Page náº¿u annotation cÃ³ thá»ƒ Ä‘Ã¡p á»©ng.

## Inputs

- `docs/ba/07-fiori-ux-requirements.md`
- WP1 data model.
- WP2 service contract.
- `app/bug-management-ui/`
- DatDT UI reference repo: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Integration review: `docs/knowledge/datdt-sap-fe-integration-review.md`

Vietnamese:

- `docs/ba/07-fiori-ux-requirements.md`
- WP1 data model.
- WP2 service contract.
- `app/bug-management-ui/`
- Repo UI tham kháº£o cá»§a DatDT: `https://github.com/dangthanhdat-hehe/Sap_FE.git`
- Review tÃ­ch há»£p: `docs/knowledge/datdt-sap-fe-integration-review.md`

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP4-T01 | Review generated Fiori app structure and DatDT `Sap_FE` reference. | Completed |
| WP4-T02 | Configure list report filters and table columns. | Completed for MVP; GridTable refinement applied |
| WP4-T03 | Configure object page sections for details, classification, assignment, comments, history, notifications. | Completed initial annotation pass |
| WP4-T04 | Add dependent value-help behavior where supported by annotations/service. | Completed for MVP annotation support; deeper UX QA pending |
| WP4-T05 | Add semantic status display. | Completed for MVP; semantic colors kept without default icons |
| WP4-T06 | Add visible Rejected follow-up information: rejection reason, nextProcessor/queue, and allowed follow-up actions. | Completed for MVP; fields and Object Page actions available |
| WP4-T07 | Verify UI with local preview and relevant lint/tooling. | Completed; browser smoke tests verified on local server |
| WP4-T08 | Compare the standard full-page create flow (Option B) with a custom guided create page (Option C). | Option B finalized and verified; Option C kept as reference prototype |

Vietnamese:

| ID | CÃ´ng viá»‡c | Tráº¡ng thÃ¡i |
| --- | --- | --- |
| WP4-T01 | Review cáº¥u trÃºc app Fiori generated vÃ  repo tham kháº£o `Sap_FE` cá»§a DatDT. | HoÃ n thÃ nh |
| WP4-T02 | Cáº¥u hÃ¬nh filter vÃ  cá»™t table cho List Report. | HoÃ n thÃ nh má»©c MVP; Ä‘Ã£ tinh chá»‰nh GridTable |
| WP4-T03 | Cáº¥u hÃ¬nh cÃ¡c section Object Page cho detail, classification, assignment, comments, history, notifications. | HoÃ n thÃ nh annotation ban Ä‘áº§u |
| WP4-T04 | ThÃªm dependent value-help khi annotation/service há»— trá»£. | HoÃ n thÃ nh support annotation má»©c MVP; QA sÃ¢u cÃ²n chá» |
| WP4-T05 | ThÃªm hiá»ƒn thá»‹ semantic status. | HoÃ n thÃ nh má»©c MVP; giá»¯ mÃ u semantic nhÆ°ng bá» icon máº·c Ä‘á»‹nh |
| WP4-T06 | Hiá»ƒn thá»‹ Rejected follow-up: rejection reason, nextProcessor/queue, vÃ  action tiáº¿p theo. | HoÃ n thÃ nh má»©c MVP; field vÃ  action Ä‘Ã£ cÃ³ |
| WP4-T07 | Verify UI báº±ng local preview vÃ  lint/tooling phÃ¹ há»£p. | HoÃ n thÃ nh; kiá»ƒm tra browser smoke Ä‘Ã£ xÃ¡c nháº­n |
| WP4-T08 | So sÃ¡nh create flow full-page chuáº©n (Option B) vá»›i custom guided create page (Option C). | Option B Ä‘Ã£ hoÃ n thÃ nh, lÃ m sáº¡ch vÃ  verify; Option C giá»¯ lÃ m prototype tham kháº£o |

## Current Implementation Notes

- DatDT's generated app was not copied directly because it targets a mock `Defects` service and placeholder URL.
- Useful UI ideas were translated into CAP CDS annotations for the existing `BugService.Bugs` service.
- Attachment upload is now implemented in the IDTS flow with backend stream handling; the DatDT fragment was still not copied directly because it is static and tied to a different service structure.
- The current UI remains annotation-driven Fiori Elements; no custom SAPUI5 controller or fragment was added in this pass.
- Four IDTS-aligned demo bugs were added under `db/data/idts.cap-Bugs.csv` so the List Report shows data during local review.

Vietnamese:

- KhÃ´ng copy nguyÃªn app generated cá»§a DatDT vÃ¬ app Ä‘Ã³ trá» tá»›i mock service `Defects` vÃ  URL placeholder.
- CÃ¡c Ã½ tÆ°á»Ÿng UI há»¯u Ã­ch Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn thÃ nh CAP CDS annotation cho service hiá»‡n táº¡i `BugService.Bugs`.
- Attachment upload nay Ä‘Ã£ Ä‘Æ°á»£c implement trong flow IDTS vá»›i backend stream handling; fragment cá»§a DatDT váº«n khÃ´ng copy trá»±c tiáº¿p vÃ¬ nÃ³ static vÃ  gáº¯n vá»›i service structure khÃ¡c.
- UI hiá»‡n táº¡i váº«n theo hÆ°á»›ng Fiori Elements annotation-driven; chÆ°a thÃªm custom SAPUI5 controller hoáº·c fragment trong láº§n nÃ y.
- ÄÃ£ thÃªm bá»‘n bug demo phÃ¹ há»£p vá»›i IDTS trong `db/data/idts.cap-Bugs.csv` Ä‘á»ƒ List Report cÃ³ dá»¯ liá»‡u khi review local.

## Definition of Done

- The user can inspect, create, and work with bug records through Fiori UI.
- UX follows SAP Fiori terminology and status semantics.
- Custom UI5 is used only when annotations are insufficient.
- Rejected bugs show why they were rejected and who must act next.
- Dependent value help and assignment candidate behavior are aligned with WP2/WP3 service logic.

Vietnamese:

- User cÃ³ thá»ƒ xem, táº¡o, vÃ  thao tÃ¡c vá»›i bug record thÃ´ng qua Fiori UI.
- UX dÃ¹ng thuáº­t ngá»¯ SAP Fiori vÃ  semantic status.
- Chá»‰ dÃ¹ng custom UI5 khi annotation khÃ´ng Ä‘á»§ Ä‘Ã¡p á»©ng.
- Bug `Rejected` pháº£i lÃ m rÃµ lÃ½ do reject vÃ  ai cáº§n xá»­ lÃ½ tiáº¿p; khÃ´ng Ä‘á»ƒ user hiá»ƒu nháº§m `Rejected` lÃ  Ä‘Ã£ káº¿t thÃºc.
- Dependent value help vÃ  assignment candidate behavior pháº£i khá»›p vá»›i logic service WP2/WP3.

## 2026-07-01 IDTS-43 Fiori UX Cleanup

English:

- Applied the IDTS-32 UX findings that belong in the Fiori layer: Priority, Severity, and Environment now use fixed value-list hints; the standard generated Create entry is hidden; a role-aware `Create Bug` header action is available only for Tester/PM; the raw History table facet is removed; and Reopen wording is clearer.
- The role-aware Create action still relies on backend authorization as the security boundary. The UI only removes confusing entry points for Developer users.
- Fixed a runtime integration issue found by browser smoke: manifest-based Fiori action handlers do not receive a normal controller `this.getView()` context. `BugListActions.js` now handles the observed Fiori action context and still uses `editFlow.createDocument(...)` for draft creation.
- Verification evidence: `npm run qa:idts43:programmatic` passed 11/11, CAP compile passed with the existing attachment warning only, UI5 build passed, auth regression passed 23/23, browser smoke passed Developer hidden / Tester visible / PM click create, AI DevKit lint passed, diff check passed with Windows line-ending warnings only, and secret scan found no credential-like key patterns.

Vietnamese:

- Da ap dung cac finding UX cua IDTS-32 thuoc layer Fiori: Priority, Severity va Environment dung fixed value-list hint; nut Create chuan do Fiori sinh ra duoc an; custom action `Create Bug` chi hien voi Tester/PM; raw History table facet duoc bo; wording Reopen ro hon.
- Role-aware Create van chi la lop UX. Backend authorization van la lop bao ve du lieu that; UI chi giup Developer khong thay duong tao bug gay roi.
- Da fix loi runtime do browser smoke phat hien: handler action khai bao trong manifest khong nhan context controller co `this.getView()`. `BugListActions.js` hien xu ly dung context Fiori action quan sat duoc va van dung `editFlow.createDocument(...)` de tao draft.
- Evidence verify: `npm run qa:idts43:programmatic` pass 11/11, CAP compile pass chi con warning attachment cu, UI5 build pass, auth regression pass 23/23, browser smoke pass Developer hidden / Tester visible / PM click create, AI DevKit lint pass, diff check pass chi co Windows line-ending warnings, va secret scan khong thay pattern credential-like key.

## 2026-06-04 Implementation Update

English:

- Added Object Page action annotations for Assign Developer, Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug, and Reopen Bug.
- Added value help annotations so Create/Edit forms and filter fields can use meaningful value lists instead of raw IDs.
- Hid `componentCategory` from the main form because it is an internal assignment key derived by the backend from Application Component + Defect Category.
- Added value-help dialog table annotations for master data and Developer Responsibilities.
- Verified List Report renders through the direct app URL and Object Page route shows Bug Details, Assignment and Follow-up, Comments, Attachments, History, and Notifications sections.

Vietnamese:

- ÄÃ£ thÃªm Object Page action annotations cho Assign Developer, Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug vÃ  Reopen Bug.
- ÄÃ£ thÃªm value help annotations Ä‘á»ƒ form Create/Edit vÃ  filter field dÃ¹ng value list cÃ³ Ã½ nghÄ©a thay vÃ¬ raw ID.
- ÄÃ£ áº©n `componentCategory` khá»i form chÃ­nh vÃ¬ Ä‘Ã¢y lÃ  assignment key ná»™i bá»™ Ä‘Æ°á»£c backend derive tá»« Application Component + Defect Category.
- ÄÃ£ thÃªm annotation cá»™t cho value-help dialog cá»§a master data vÃ  Developer Responsibilities.
- ÄÃ£ verify List Report render qua direct app URL vÃ  Object Page route hiá»ƒn thá»‹ cÃ¡c section Bug Details, Assignment and Follow-up, Comments, Attachments, History vÃ  Notifications.

## 2026-06-04 UI Refinement Update

English:

- Changed the List Report table from `ResponsiveTable` to `GridTable` to better use desktop width for the bug worklist.
- Changed create behavior from `NewPage` to `CreationDialog` and added `UI.FieldGroup#CreateBug` for the Create Bug dialog fields.
- Enabled CAP/Fiori draft support on `BugService.Bugs` with `@odata.draft.enabled` so SAP Fiori Elements OData V4 can show the standard Create button.
- Kept semantic criticality colors for Status, Priority, and Severity, but set `CriticalityRepresentation : #WithoutIcon` to remove distracting default icons.
- Added i18n text `C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE=Create Bug`.

Vietnamese:

- ÄÃ£ Ä‘á»•i table List Report tá»« `ResponsiveTable` sang `GridTable` Ä‘á»ƒ táº­n dá»¥ng chiá»u ngang desktop tá»‘t hÆ¡n cho bug worklist.
- ÄÃ£ Ä‘á»•i create behavior tá»« `NewPage` sang `CreationDialog` vÃ  thÃªm `UI.FieldGroup#CreateBug` cho cÃ¡c field cá»§a dialog Create Bug.
- ÄÃ£ báº­t CAP/Fiori draft support trÃªn `BugService.Bugs` báº±ng `@odata.draft.enabled` Ä‘á»ƒ SAP Fiori Elements OData V4 hiá»ƒn thá»‹ standard Create button.
- Váº«n giá»¯ mÃ u semantic criticality cho Status, Priority vÃ  Severity, nhÆ°ng thÃªm `CriticalityRepresentation : #WithoutIcon` Ä‘á»ƒ bá» icon máº·c Ä‘á»‹nh gÃ¢y nhiá»…u.
- ÄÃ£ thÃªm text i18n `C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE=Create Bug`.

## Remaining Notes

English: WP4 remains open for deeper browser QA and action usability tuning. Attachment upload behavior is already implemented in the current FE flow. The current UI remains annotation-driven Fiori Elements; no custom UI5 controller or fragment was added.

Vietnamese: WP4 váº«n cÃ²n má»Ÿ cho browser QA sÃ¢u hÆ¡n vÃ  tinh chá»‰nh usability cá»§a action. Attachment upload Ä‘Ã£ Ä‘Æ°á»£c implement trong flow FE hiá»‡n táº¡i. UI hiá»‡n táº¡i váº«n theo hÆ°á»›ng Fiori Elements annotation-driven; chÆ°a thÃªm custom UI5 controller hoáº·c fragment.

## 2026-06-15 Selective Remake_UI Integration

English:

- Reviewed DatDT's `Remake_UI` branch and applied only the changes that fit the current CAP/Fiori contract.
- Moved `Assignment and Follow-up` above `Bug Details` on the Object Page so assignee, next processor user, and next processor role are visible earlier.
- Made `HistoryLogs` read-only through OData capability annotations: insert, update, and delete are disabled for the History child table.
- Refined the history read model so the Object Page can show grouped `HistoryEvents` with readable summaries, while `HistoryLogs` remains the raw field-level audit trail.
- Changed create behavior from `CreationDialog` to `NewPage` because the create bug form has many required fields and the old dialog was too crowded.
- Preserved all required bug fields, `nextProcessorRole`, supporting info, and Object Page lifecycle actions.
- Browser smoke on the feature branch showed 4 bug rows in the List Report, Object Page sections in the intended order, and no create/edit/delete action in the History table.
- Remaining QA: manually complete a real create-save happy path in the browser and check whether row text navigation should be improved or documented as GridTable behavior.

Vietnamese:

- ÄÃ£ review branch `Remake_UI` cá»§a DatDT vÃ  chá»‰ Ã¡p dá»¥ng cÃ¡c thay Ä‘á»•i phÃ¹ há»£p vá»›i contract CAP/Fiori hiá»‡n táº¡i.
- ÄÆ°a section `Assignment and Follow-up` lÃªn trÆ°á»›c `Bug Details` trÃªn Object Page Ä‘á»ƒ assignee, next processor user vÃ  next processor role dá»… tháº¥y hÆ¡n.
- Äáº·t `HistoryLogs` read-only báº±ng OData capability annotations: khÃ´ng cho insert, update vÃ  delete trong báº£ng History.
- Äá»•i create behavior tá»« `CreationDialog` sang `NewPage` vÃ¬ form táº¡o bug cÃ³ nhiá»u field báº¯t buá»™c vÃ  dialog cÅ© quÃ¡ cháº­t.
- Giá»¯ nguyÃªn toÃ n bá»™ required bug fields, `nextProcessorRole`, supporting info vÃ  cÃ¡c lifecycle actions trÃªn Object Page.
- Browser smoke trÃªn feature branch Ä‘Ã£ tháº¥y 4 bug rows á»Ÿ List Report, section Object Page Ä‘Ãºng thá»© tá»± mong muá»‘n, vÃ  báº£ng History khÃ´ng cÃ³ action create/edit/delete.
- QA cÃ²n láº¡i: kiá»ƒm tra thá»§ cÃ´ng happy path táº¡o vÃ  save bug tháº­t trÃªn browser, Ä‘á»“ng thá»i xem cÃ³ cáº§n cáº£i thiá»‡n navigation khi báº¥m vÃ o text trong GridTable hay chá»‰ cáº§n ghi nháº­n lÃ  hÃ nh vi cá»§a GridTable.

## 2026-06-15 Create Flow Option B

English:

- Removed `Capabilities.InsertRestrictions.RequiredProperties` while keeping List Report creation mode as `NewPage`.
- Added `Common.FieldControl/Mandatory` to nine user-entered mandatory fields.
- Kept CAP handler validation and database constraints unchanged.
- Verified an empty draft activation returns HTTP 400 with mandatory-field errors.
- Verified a complete draft activation returns HTTP 201, generates a bug number, derives Component Category, assigns the fallback Tester reporter, and starts in `Pending Assignment`.
- Branch: `feature/idts-create-flow-option-b-donhv`.

## 2026-06-16 Assignee Value Help Display Fix

English:

- Added a dedicated `AssignableDevelopers` value-help projection so the Assignee picker shows developer name, email, availability, application component, defect category, SAP module scope, and responsibility level instead of technical database columns.
- Added `assigneeDisplayName` enrichment for both active `Bugs` and `Bugs.drafts`, allowing Fiori draft side-effect reads to show `DatDT` instead of the raw developer UUID after selection.
- Added property-level labels for common value-list entities so representative popups such as Priority show `Priority Code` and `Priority` instead of `code` and `name`.
- Verified with Playwright CLI only; Playwright MCP was not used.

## 2026-06-18 Retest Planning Alignment

English:

- WP4 browser retest should now follow `docs/qa/retest-matrix.en.md` and `docs/qa/retest-matrix.vi.md`.
- No product-blocking UI-only gap remains open on the currently verified runtime.
- The previously open lifecycle-refresh defect is now closed by annotation-only side-effect changes; the next browser pass should treat immediate post-action refresh as a regression check, not an open blocker.
- The earlier create-time `componentCategory_ID` warning is no longer reproduced after removing the redundant derivation side effect; treat it as closed unless a future browser rerun proves otherwise.
- The Assign Developer selected-text issue is now also closed at WP4 handover level: a focused live browser re-verification on `localhost:4004` confirmed the dialog shows the selected developer name instead of the UUID.
- Backend and HTTP layers are already stable enough for mentor-demo happy flow; remaining WP4 work is limited to regression checking during the final demo rerun and downstream documentation sync.

## 2026-06-18 Comments Section CTA Fix

English:

- Removed the global header `Add Comment` action from `UI.Identification` and moved it into the `Comments` section itself.
- Implemented the section-level CTA through `UI.CollectionFacet` + `UI.ReferenceFacet` pointing to `@UI.Identification#CommentAction`, so the Comments area now has its own contextual entry point.
- Re-verified on a live CAP server (`localhost:4018`) that the local `Add Comment` button is visible in the Comments section and opens the `Add Comment` dialog successfully.
- `IDTS-11` / `TMP-BUG-23` should now be treated as closed at WP4 level.

## 2026-06-18 Assign Developer Selected-Text Re-Verification

English:

- Re-verified the `Assign Developer` action dialog on the live local stack at `localhost:4004`.
- Confirmed the selected assignee value now renders the readable developer name (`DatDT`) instead of the technical UUID in the action parameter input.
- `IDTS-9` is now treated as closed at WP4 handover level; keep it only as a regression check for future FE changes.

## 2026-06-18 Direct Assignee Field Assignment

English:

- Removed the `Assign Developer` action button from both the Object Page header action area and the Assignment section.
- Kept the backend `assignToDeveloper` action for API/test compatibility, but the Fiori UI now uses the `Assignee` field and its filtered value help as the single assignment/reassignment path.
- Added dynamic field control through `assigneeFieldControl`: Tester/PM can edit Assignee when the current status allows assignment, while Developer users see it as read-only.
- Verified the annotation contract by CAP compile/CSN inspection: `BugService.assignToDeveloper` is no longer exposed by `UI.Identification` or `UI.FieldGroup#Assignment`, while `Assignee` uses dynamic `Common.FieldControl`.

Vietnamese:

- Đã bỏ nút `Assign Developer` khỏi header Object Page và khỏi section Assignment.
- Backend action `assignToDeveloper` vẫn được giữ để không phá API/test cũ, nhưng Fiori UI chỉ dùng field `Assignee` và value help đã lọc đúng làm đường assign/reassign.
- Thêm dynamic field control qua `assigneeFieldControl`: Tester/PM được edit Assignee khi status cho phép assign, còn Developer chỉ xem read-only.
- Đã verify bằng CAP compile/CSN: `BugService.assignToDeveloper` không còn được expose trong `UI.Identification` hoặc `UI.FieldGroup#Assignment`; `Assignee` dùng `Common.FieldControl` động.

Vietnamese:

- ?? b? action `Add Comment` kh?i v?ng header generic v? chuy?n n? v?o ngay trong section `Comments`.
- ?? implement CTA theo h??ng annotation-only b?ng `UI.CollectionFacet` + `UI.ReferenceFacet` tr? t?i `@UI.Identification#CommentAction`, gi?p khu v?c Comments c? entry point theo ng? c?nh ri?ng.
- ?? verify l?i tr?n CAP server ch?y th?t (`localhost:4018`) r?ng n?t `Add Comment` hi?n th? ngay trong section Comments v? m? ???c dialog `Add Comment`.
- `IDTS-11` / `TMP-BUG-23` c? th? xem l? ?? ??ng ? m?c WP4.

## 2026-06-16 SAP490 Functional/Test Deliverable Update

English:

- Generated SAP490 Functional Specification v0.1 as separate English and Vietnamese workbooks from the school `Functional_Specification.xlsx` template.
- Generated SAP490 Test and Fix Bug v0.2 as separate English and Vietnamese workbooks from the school `Test_And_Fix_Bug.xlsx` template.
- Functional Specification records the target C-prime Create/Object Page flow for WP4: General Information first, Classification and Assignment second, and Reproduction/Test Context third.
- Test and Fix Bug v0.2 records the fixed Assignee value help issues and the remaining layout refinement decision.

Vietnamese:

- ÄÃ£ generate SAP490 Functional Specification v0.1 thÃ nh hai workbook tiáº¿ng Anh vÃ  tiáº¿ng Viá»‡t riÃªng tá»« template `Functional_Specification.xlsx` cá»§a trÆ°á»ng.
- ÄÃ£ generate SAP490 Test and Fix Bug v0.2 thÃ nh hai workbook tiáº¿ng Anh vÃ  tiáº¿ng Viá»‡t riÃªng tá»« template `Test_And_Fix_Bug.xlsx` cá»§a trÆ°á»ng.
- Functional Specification ghi target flow C-prime cho Create/Object Page cá»§a WP4: General Information trÆ°á»›c, Classification and Assignment thá»© hai, vÃ  Reproduction/Test Context thá»© ba.
- Test and Fix Bug v0.2 ghi cÃ¡c lá»—i Assignee value help Ä‘Ã£ fix vÃ  decision refine layout cÃ²n láº¡i.

Vietnamese:

- Bá» `Capabilities.InsertRestrictions.RequiredProperties` vÃ  váº«n giá»¯ creation mode cá»§a List Report lÃ  `NewPage`.
- ThÃªm `Common.FieldControl/Mandatory` cho chÃ­n field báº¯t buá»™c do ngÆ°á»i dÃ¹ng nháº­p.
- KhÃ´ng thay Ä‘á»•i CAP handler validation vÃ  database constraint.
- ÄÃ£ verify activate draft rá»—ng tráº£ HTTP 400 cÃ¹ng lá»—i field báº¯t buá»™c.
- ÄÃ£ verify draft Ä‘áº§y Ä‘á»§ activate thÃ nh cÃ´ng vá»›i HTTP 201, sinh bug number, derive Component Category, gÃ¡n Tester reporter máº·c Ä‘á»‹nh vÃ  báº¯t Ä‘áº§u á»Ÿ `Pending Assignment`.
- Branch: `feature/idts-create-flow-option-b-donhv`.

## 2026-06-16 Option B Refinement and Backend Hardening

English:

- Refined Fiori annotations to dynamically hide child facets (Comments, Attachments, History, Notifications, Planning, and Rejected Follow-up) and system-managed fields (Bug Number, Status, Reporter, Created/Modified dates, Next Processor) during bug creation.
- Used OData V4 EDM JSON expressions based on `IsActiveEntity = false and HasActiveEntity = false` to target new creation drafts specifically, preventing layout disruption when editing existing bugs.
- Fixed the Assignee selection field by binding it directly to `assignee_ID` with Value Help, making it fully editable during creation.
- Hardened backend handlers in `srv/service.js` to always overwrite `bugNumber`, `reporter_ID` (with actual logged-in user ID), and `status_code` on bug creation, blocking client-side parameter injection.
- Verified using a Playwright browser subagent that the create page has a clean layout, hidden tables/planning/rejection facets, and a functional Assignee lookup.

Vietnamese:

- Tinh chá»‰nh annotations Ä‘á»ƒ áº©n Ä‘á»™ng cÃ¡c child facets (Comments, Attachments, History, Notifications, Planning vÃ  Rejected Follow-up) cÃ¹ng cÃ¡c field do há»‡ thá»‘ng quáº£n lÃ½ (Bug Number, Status, Reporter, NgÃ y táº¡o/cáº­p nháº­t, Next Processor) khi táº¡o má»›i bug.
- Sá»­ dá»¥ng biá»ƒu thá»©c EDM JSON dá»±a trÃªn `IsActiveEntity = false and HasActiveEntity = false` Ä‘á»ƒ áº©n chá»‰ trong quÃ¡ trÃ¬nh táº¡o má»›i báº£n ghi nhÃ¡p (creation draft), giá»¯ nguyÃªn giao diá»‡n Ä‘áº§y Ä‘á»§ khi chá»‰nh sá»­a hoáº·c xem bug cÅ©.
- Sá»­a lá»—i gÃ¡n Assignee báº±ng cÃ¡ch Ä‘á»•i binding trÆ°á»ng hiá»ƒn thá»‹ sang `assignee_ID` Ä‘i kÃ¨m Value Help, giÃºp trÆ°á»ng nÃ y cÃ³ thá»ƒ nháº­p/chá»n trÃªn mÃ n hÃ¬nh táº¡o.
- Tháº¯t cháº·t báº£o máº­t backend trong `srv/service.js` Ä‘á»ƒ luÃ´n ghi Ä‘Ã¨ `bugNumber`, `reporter_ID` (gÃ¡n báº±ng user Ä‘ang Ä‘Äƒng nháº­p thá»±c táº¿) vÃ  `status_code` khi táº¡o má»›i, cháº·n Ä‘á»©ng viá»‡c client gá»­i tham sá»‘ tÃ¹y tiá»‡n.
- Verify thá»±c táº¿ báº±ng Playwright browser subagent trÃªn mÃ´i trÆ°á»ng local, xÃ¡c nháº­n mÃ n hÃ¬nh táº¡o bug cá»±c ká»³ sáº¡ch sáº½, áº©n toÃ n bá»™ tab/field khÃ´ng liÃªn quan vÃ  Value Help chá»n Assignee cháº¡y tá»‘t.

## 2026-06-17 Need More Information Resubmit CTA

English:

- Added a dedicated Object Page action `Resubmit to Developer` for the `Need More Information` follow-up path instead of relying on generic edit/comment plus another workflow action.
- The action is shown only when the bug is in `Need More Information`, an assignee already exists, and the current user is Tester or PM.
- The action parameter requires an `Update Summary` so the follow-up reason is explicit in the product and auditable in backend history.
- Action side effects refresh comments, history, notifications, and capability flags so the page reflects the returned `Assigned` state immediately after execution.

Vietnamese:

- ÄÃ£ thÃªm action riÃªng trÃªn Object Page lÃ  `Resubmit to Developer` cho nhÃ¡nh follow-up cá»§a `Need More Information`, thay vÃ¬ buá»™c user pháº£i edit/comment rá»“i káº¿t há»£p thÃªm má»™t action khÃ¡c.
- Action nÃ y chá»‰ hiá»‡n khi bug Ä‘ang á»Ÿ `Need More Information`, Ä‘Ã£ cÃ³ assignee, vÃ  user hiá»‡n táº¡i lÃ  Tester hoáº·c PM.
- Param cá»§a action báº¯t buá»™c nháº­p `Update Summary` Ä‘á»ƒ lÃ½ do follow-up Ä‘Æ°á»£c thá»ƒ hiá»‡n rÃµ trÃªn sáº£n pháº©m vÃ  audit Ä‘Æ°á»£c á»Ÿ backend history.
- Side effect cá»§a action refresh comments, history, notifications vÃ  capability flags Ä‘á»ƒ page pháº£n Ã¡nh ngay tráº¡ng thÃ¡i `Assigned` sau khi thá»±c thi.

## 2026-06-16 Role Action Visibility and Status Editability Fix

English:

- Fixed a backend read-gap in `srv/service.js`: Fiori Elements sometimes requests `canAssign`, `canResolve`, and related virtual capability flags without selecting `status_code` or `assignee_ID`.
- `enrichBugCapabilities` now loads missing `status_code` and `assignee_ID` by bug ID before computing action booleans, so capability flags no longer fall back to `false` incorrectly.
- Kept the Object Page `Status` field bound to `status.name` and explicitly marked both the rendered `UI.DataField` and `status_code` metadata as `Common.FieldControlType/ReadOnly`.
- This keeps workflow transitions on the approved bound actions instead of allowing users to open a generic status value help and hit backend transition errors.
- Added a case-insensitive fallback in `resolveRequestUser` for local dev, so mock logins like `donhv` still map to the IDTS user `DonHV` and show the correct action set.
- Verified in live `$metadata` that `BugService.Bugs/status_code` is now read-only and the `Status` field on the Object Page carries a read-only `Common.FieldControl` annotation.

Vietnamese:

- ÄÃ£ sá»­a má»™t lá»— há»•ng khi Ä‘á»c dá»¯ liá»‡u trong `srv/service.js`: Fiori Elements Ä‘Ã´i khi request cÃ¡c cá» áº£o nhÆ° `canAssign`, `canResolve` nhÆ°ng láº¡i khÃ´ng select `status_code` hoáº·c `assignee_ID`.
- `enrichBugCapabilities` giá» sáº½ tá»± Ä‘á»c bÃ¹ `status_code` vÃ  `assignee_ID` theo bug ID trÆ°á»›c khi tÃ­nh quyá»n action, nÃªn cÃ¡c cá» capability khÃ´ng cÃ²n bá»‹ rÆ¡i sai vá» `false`.
- Giá»¯ field `Status` trÃªn Object Page bind tá»›i `status.name` vÃ  khÃ³a rÃµ rÃ ng cáº£ `UI.DataField` hiá»ƒn thá»‹ láº«n metadata `status_code` báº±ng `Common.FieldControlType/ReadOnly`.
- CÃ¡ch nÃ y buá»™c cÃ¡c chuyá»ƒn tráº¡ng thÃ¡i Ä‘i qua bound actions Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t, thay vÃ¬ Ä‘á»ƒ user má»Ÿ generic status value help rá»“i gáº·p lá»—i transition tá»« backend.
- ÄÃ£ thÃªm fallback khÃ´ng phÃ¢n biá»‡t hoa/thÆ°á»ng trong `resolveRequestUser` cho local dev, nÃªn mock login kiá»ƒu `donhv` váº«n map Ä‘Æ°á»£c tá»›i user IDTS `DonHV` vÃ  hiá»ƒn thá»‹ Ä‘Ãºng bá»™ action.
- ÄÃ£ verify trÃªn `$metadata` thá»±c táº¿ ráº±ng `BugService.Bugs/status_code` Ä‘Ã£ lÃ  read-only vÃ  DataField `Status` trÃªn Object Page cÅ©ng mang annotation `Common.FieldControl` dáº¡ng read-only.

## 2026-06-21 - IDTS-29 modular annotation integration

English:

- Reviewed DatDT's `fix/fe-Refactor_annotation.cds_datdt` branch because no DatDT pull request targeted `dev`.
- Accepted the refactor that turns `app/bug-management-ui/annotations.cds` into a small import hub and moves annotations into eight feature-scoped files.
- Compared normalized compiled CSN before and after the split; both produced SHA-256 `bc04ad74370d83b916b7f14d8778df302d740293dafeb6edf5ee4110995271c7`.
- Rejected 49 tracked `gen/srv` build artifacts from the integration and added `gen/` to `.gitignore`.
- Fresh verification passed: CAP compile, UI5 build, `30 PASS / 0 FAIL` backend regression, comments/attachments programmatic QA, direct-assignee HTTP QA, comments/attachments HTTP QA, and Playwright UAT for the List Report plus all expected Object Page sections.

Vietnamese:

- Review nhánh `fix/fe-Refactor_annotation.cds_datdt` của DatDT vì không có PR DatDT nào target `dev`.
- Nhận phần refactor biến `app/bug-management-ui/annotations.cds` thành import hub nhỏ và tách annotation vào 8 file theo feature.
- So sánh normalized compiled CSN trước/sau khi tách; cả hai có SHA-256 `bc04ad74370d83b916b7f14d8778df302d740293dafeb6edf5ee4110995271c7`.
- Không nhận 49 build artifact bị track trong `gen/srv` và thêm `gen/` vào `.gitignore`.
- Verification mới đã pass: CAP compile, UI5 build, backend regression `30 PASS / 0 FAIL`, programmatic QA comments/attachments, HTTP QA direct-assignee, HTTP QA comments/attachments, và Playwright UAT cho List Report cùng toàn bộ section Object Page mong đợi.
- Jira `IDTS-29` was moved to Done after evidence comment `10153`.
- GitHub PR #4 appeared after the direct branch review and was closed as superseded because the reviewed source changes were already in `dev` and the PR still contained generated `gen/srv` artifacts.
