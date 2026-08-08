# WP3 - Handler Rules and Validation

## 2026-08-08 Developer capacity hard cap

- Added backend-authoritative assignment capacity: all assigned non-Closed Bugs count, including Rejected; 0-1 is Available, 2 is Busy, and 3+ blocks another assignment.
- Capacity is checked only for a new/changed assignee. Existing lifecycle actions remain available at the cap, and failed assignment writes no Bug, History, or Notification side effect.
- The DeveloperProfile row is locked before count validation to serialize concurrent assignments where the database supports row locking.
- PR #312 merged normally at `ccb2fd102b2daacaa3685bcfe671e0772ef1bbc4` and the exact SHA was selectively deployed to the CAP service. Capacity, workload and impacted assignment regressions pass; no DB deployer, schema, seed, SQL or business-data mutation ran.

Status: Completed for Sprint 1 MVP; Sprint 02 backend refinements and SAP490 test evidence added
Owner workstream: Backend CAP
Last updated: 2026-06-21

## Goal

Implement backend rules that protect business-critical transitions and ownership changes.

## Inputs

- `docs/ba/03-status-transition-matrix.md`
- `docs/ba/04-requirement-backlog.md`
- WP1 data model.
- WP2 service contract.

## Tasks

| ID | Task | Status |
| --- | --- | --- |
| WP3-T01 | Implement create/update validation for required fields and classification. | Completed |
| WP3-T02 | Implement assignment filtering/validation using Developer Responsibility. | Completed |
| WP3-T03 | Implement status transition validation. | Completed |
| WP3-T04 | Implement nextProcessor auto-update rules. | Completed |
| WP3-T05 | Create history logs for important changes. | Completed |
| WP3-T06 | Enforce Rejected follow-up rules: rejection reason, nextProcessor, allowed follow-up transitions. | Completed |
| WP3-T07 | Add focused backend tests or repeatable manual verification. | Completed repeatable programmatic verification |

## 2026-06-04 Implementation Update

English:

- Added `srv/service.js` as the CAP Node.js implementation for `BugService`.
- Implemented create/update validation for required fields, valid Component Category derivation, assignment responsibility, status transitions, and rejected follow-up reason.
- Added automatic `nextProcessorUser_ID` and `nextProcessorRole_code` calculation.
- Added lifecycle bound actions for assignment, pending assignment, developer review, information request, reject, progress, resolve, retest, close, and reopen.
- Added HistoryLog creation for create, assignment, status changes, classification/ownership changes, and rejection reason changes.
- Added Notification record creation for Assigned, Need More Information, Rejected, and Closed events.
- Verified action behavior with OData calls: `resolveBug` succeeds for a valid transition, invalid `RESOLVED -> IN_PROGRESS` transition is rejected with HTTP 400, create derives `componentCategory_ID`, and `assignToDeveloper` writes history/notification.

Vietnamese:

- Đã thêm `srv/service.js` làm CAP Node.js implementation cho `BugService`.
- Đã implement validation khi create/update cho required fields, derive Component Category hợp lệ, assignment responsibility, status transition và rejected follow-up reason.
- Đã tự động tính `nextProcessorUser_ID` và `nextProcessorRole_code`.
- Đã thêm lifecycle bound actions cho assignment, pending assignment, developer review, request information, reject, progress, resolve, retest, close và reopen.
- Đã thêm ghi HistoryLog cho create, assignment, status change, classification/ownership change và rejection reason change.
- Đã thêm tạo Notification record cho các event Assigned, Need More Information, Rejected và Closed.
- Đã verify bằng OData calls: `resolveBug` pass với transition hợp lệ, transition sai `RESOLVED -> IN_PROGRESS` bị reject HTTP 400, create tự derive `componentCategory_ID`, và `assignToDeveloper` ghi history/notification.

## 2026-06-10 Sprint 02 Backend Refinement

English:

- Added request-user-aware processing permission to `srv/service.js`.
- Developers keep team-visible access and can discuss bugs, but workflow processing is enforced for the assigned Developer, Tester, or PM when the request user maps to an active IDTS user.
- Added comment create handling so authenticated Tester, Developer, or PM users cannot create comments on behalf of someone else.
- Bound action transitions now write HistoryLogs for `nextProcessorUser` and `nextProcessorRole` changes.
- Added in-app notification records for `Resolved`, `Retest Required`, and `Reopened` follow-up using the existing `UPDATED` notification event type.
- Jira `IDTS-2` and `IDTS-4` were moved to Done after verification; Jira `IDTS-5` remains In Progress for new backend QA bugs.
- Added explicit `resubmitToDeveloper(note)` recovery flow for `Need More Information`: Tester or PM must provide an update summary, the bug returns to `Assigned`, `nextProcessor` resets to the assigned Developer, and the action creates grouped history, a follow-up comment, and an in-app notification.
- Tightened the transition matrix so `Rejected` no longer routes back through `Need More Information` in the current MVP; follow-up must be correction/reassignment or move to `Pending Assignment`.

Vietnamese:

- Đã thêm kiểm soát quyền xử lý dựa trên request user trong `srv/service.js`.
- Developer vẫn có thể xem và thảo luận bug trong team, nhưng thao tác xử lý workflow sẽ được kiểm soát cho Developer được assign, Tester hoặc PM khi request user map được vào active user của IDTS.
- Đã thêm xử lý create comment để user Tester, Developer hoặc PM đã xác thực không thể tạo comment thay người khác.
- Bound action transition hiện ghi HistoryLogs cho thay đổi `nextProcessorUser` và `nextProcessorRole`.
- Đã thêm notification record in-app cho follow-up của `Resolved`, `Retest Required`, và `Reopened` bằng event type hiện có là `UPDATED`.
- Jira `IDTS-2` và `IDTS-4` đã chuyển Done sau khi verify; Jira `IDTS-5` vẫn In Progress để nhận bug backend mới từ QA.
- Đã thêm flow phục hồi tường minh `resubmitToDeveloper(note)` cho `Need More Information`: Tester hoặc PM phải nhập update summary, bug quay về `Assigned`, `nextProcessor` trả về Developer được assign, đồng thời action tạo grouped history, follow-up comment và notification in-app.
- Đã siết transition matrix để `Rejected` không quay lại qua nhánh `Need More Information` trong MVP hiện tại; hướng follow-up phải là sửa phân loại/ngữ cảnh, reassign hoặc chuyển về `Pending Assignment`.

## Remaining Notes

English: This is an MVP backend rule layer. It now has request-user-aware permission checks for local mocked/basic-auth and future authenticated runtime plus a repeatable direct-service QA script, but it does not yet implement real XSUAA role collections, external notification delivery, binary attachment storage, or a CI-integrated automated test suite.

Vietnamese: Đây là lớp backend rule mức MVP. Hiện đã có kiểm tra quyền dựa trên request user cho mocked/basic-auth local và runtime xác thực sau này, đồng thời có QA script gọi service trực tiếp để chạy lặp lại; tuy nhiên chưa implement XSUAA role collection thật, gửi notification ra kênh ngoài, binary attachment storage hoặc automated test suite tích hợp CI.

## 2026-06-15 SAP490 Test Evidence

English:

- At the time of the SAP490 v0.1 evidence pack, `scripts/qa/test-idts6-programmatic.js` verified 21 backend happy-flow and negative cases with 21 PASS / 0 FAIL.
- Added separate English and Vietnamese template-filled SAP490 workbooks for Test Scenario, Unit Test, and Test and Fix Bug under `docs/sap490/generated/`.
- The workbooks record 12 lifecycle scenarios, all 21 executed cases, evidence links, and the fixed `IDTS-5` SC-01a direct CREATE harness issue.

Vietnamese:

- `scripts/qa/test-idts6-programmatic.js` verify 21 case backend happy flow và negative với kết quả 21 PASS / 0 FAIL.
- Đã thêm các workbook SAP490 Test Scenario, Unit Test và Test and Fix Bug tách riêng tiếng Anh/tiếng Việt, được copy/fill từ template trong `docs/sap490/generated/`.
- Các workbook ghi 12 lifecycle scenario, toàn bộ 21 case đã chạy, link bằng chứng và lỗi harness direct CREATE SC-01a của `IDTS-5` đã được sửa.

## 2026-06-17 Resubmit Flow Test Expansion

English:

- `scripts/qa/test-idts6-programmatic.js` now covers 26 cases with 26 PASS / 0 FAIL after adding the `Need More Information -> Resubmit to Developer -> Assigned` path and the `REJECTED -> NEED_MORE_INFORMATION` negative check.
- SAP490 workbook sync for the new 26-case baseline is still pending and should be done only after the team confirms the updated happy-flow demo pack.

Vietnamese:

- `scripts/qa/test-idts6-programmatic.js` hiện bao phủ 26 case với kết quả 26 PASS / 0 FAIL sau khi thêm nhánh `Need More Information -> Resubmit to Developer -> Assigned` và negative check `REJECTED -> NEED_MORE_INFORMATION`.
- Việc sync workbook SAP490 lên baseline 26 case vẫn đang chờ và chỉ nên làm sau khi team chốt được gói happy-flow demo đã cập nhật.

## 2026-06-17 Status Entry and Generic Audit Coverage Expansion

English:

- The current MVP create path is now explicitly treated as `Assigned` or `Pending Assignment` on submit; `New` is retained only for legacy/import compatibility and controlled transitions. The canonical IDTS docs and lifecycle diagrams were updated accordingly.
- `importantChanges()` in `srv/service.js` now tracks generic content edits as auditable changes, including `title`, `description`, reproduction/result fields, environment fields, test references, and planning fields.
- Repeatable backend verification was expanded to 30 PASS / 0 FAIL in `scripts/qa/test-idts6-programmatic.js`, including explicit checks that editing `title` and `description` writes `HistoryLogs`.

Vietnamese:

- Luồng create MVP hiện được chốt là khi submit sẽ persist `Assigned` hoặc `Pending Assignment`; `New` chỉ còn giữ cho mục đích tương thích dữ liệu cũ/import và các controlled transition. Các tài liệu canonical và lifecycle diagram đã được đồng bộ theo quyết định này.
- `importantChanges()` trong `srv/service.js` hiện đã track thêm các thay đổi nội dung chung để ghi audit, gồm `title`, `description`, các field tái hiện/kết quả, environment, test reference và planning fields.
- Bộ verify backend lặp lại đã được mở rộng thành 30 PASS / 0 FAIL trong `scripts/qa/test-idts6-programmatic.js`, bao gồm kiểm tra rõ rằng sửa `title` và `description` sẽ ghi `HistoryLogs`.

## 2026-06-18 Direct Assignee Draft Save Fix

English:

- Fixed the draft-edit assignment path so changing `assignee_ID` directly through the Object Page `Assignee` field is treated as the official assignment/reassignment flow.
- `prepareBugWrite()` now derives `status_code = ASSIGNED` when an assignee is selected on update and `PENDING_ASSIGNMENT` when the assignee is cleared.
- Draft activation side effects now compare the active bug before/after `SAVE` on `Bugs.drafts`, then create grouped `HistoryEvents` / `HistoryLogs` and notification records for assignment and reassignment.
- Added repeatable HTTP regression script `scripts/qa/test-direct-assignee-draft-save.ps1`, exposed as `npm run qa:direct-assignee:http`.

Vietnamese:

- Đã sửa luồng assign khi edit draft để việc đổi field `Assignee` trực tiếp trên Object Page trở thành luồng assign/reassign chính thức.
- Khi chọn developer, backend tự chuyển status sang `Assigned`; khi xóa assignee, backend chuyển về `Pending Assignment`.
- Khi activate draft, backend so sánh bug active trước/sau save rồi ghi `HistoryEvents` / `HistoryLogs` dạng grouped và tạo notification cho Developer.
- Đã thêm script regression HTTP `scripts/qa/test-direct-assignee-draft-save.ps1`, chạy qua `npm run qa:direct-assignee:http` khi có CAP server local tương ứng.

## 2026-06-20 IDTS-28 Service Refactor

English:

- Split the monolithic `srv/service.js` into focused backend modules under `srv/bug-service/`: `constants.js`, `helpers.js`, `history.js`, `read-models.js`, `guards.js`, `permissions.js`, `bug-write.js`, `actions.js`, `content.js`, and `drafts.js`.
- Kept business behavior in the same CAP service boundary; `srv/service.js` is now a thin orchestration layer that registers hooks and action handlers. After the follow-up Sprint 3 `HistoryEvents` read-model hook additions, the file remains thin at 148 lines in the current branch.
- GitHub PR #5 merged the refactor into `dev` at merge commit `9129ae8bb3fb22502260b3a435ad5df14fdf8108`; Jira `IDTS-28` was updated with evidence comment `10154`.
- Fresh backend verification passed with syntax checks, `cds compile srv/service.cds app/bug-management-ui/annotations.cds --to edmx`, `scripts/qa/test-idts6-programmatic.js` (`30 PASS / 0 FAIL`), `scripts/qa/test-pm-monitoring-programmatic.js` (`20 PASS / 0 FAIL`), `scripts/qa/test-developer-workload-programmatic.js` (`36 PASS / 0 FAIL`), and `scripts/qa/test-comments-attachments-programmatic.js` (`RESULT: PASS`).
- A non-product verify issue was found: running the PM monitoring and developer workload suites in parallel can hit duplicate seed initialization (`UNIQUE constraint failed: idts_cap_Users.ID`). Rerunning `test-pm-monitoring-programmatic.js` sequentially passes, so this is treated as a harness/isolation limitation rather than a backend regression.
- During the final `dev` sync, the developer-workload QA fixture was hardened because absolute due dates made `SangVN overdueOwnedBugCount` change from `4` to `5` on 2026-06-21. The test now clears seeded SangVN due dates in the in-memory DB and uses date-relative fixture due dates, restoring deterministic `36 PASS / 0 FAIL` evidence without changing product logic.
- The earlier runtime blocker still applies for bundled Codex Node: `better-sqlite3.node` in `node_modules` targets `NODE_MODULE_VERSION 127`, while the bundled desktop runtime is `NODE_MODULE_VERSION 137`. Current verification therefore uses official Node.js `v22.23.0` (module version `127`).
- Sprint 3 cross-ticket closure is now complete at Jira handoff level: `IDTS-28` was moved to Done on 2026-07-03 after the refactor had already merged into `dev` and later Sprint 3 regression/QA work validated the affected backend flows.

Vietnamese:

- Đã tách `srv/service.js` dài thành các module backend rõ trách nhiệm trong `srv/bug-service/`: `constants.js`, `helpers.js`, `history.js`, và `read-models.js`.
- Giữ nguyên boundary nghiệp vụ trong cùng CAP service; `srv/service.js` hiện chủ yếu còn phần đăng ký hooks cùng các workflow handlers, validation, và next-processor rules.
- Verify cấu trúc đã pass với syntax checks và `cds compile srv/service.cds app/bug-management-ui/annotations.cds --to edmx`.
- Regression backend programmatic đầy đủ ban đầu bị chặn do lệch runtime local: `better-sqlite3.node` trong `node_modules` được build cho `NODE_MODULE_VERSION 127`, trong khi bundled Codex desktop Node runtime là `NODE_MODULE_VERSION 137`. Blocker này đã được gỡ bằng cách chạy lại suite với Node.js chính thức `v22.23.0` (modules `127`), và `scripts/qa/test-idts6-programmatic.js` đã pass `30 PASS / 0 FAIL`.

## 2026-06-24 IDTS-25 PM Monitoring Filter Runtime Fix

English:

- Browser UAT failure from PR #16 was reproduced through OData on the persistent local `db.sqlite`: filtering `BugService.Bugs` by `isOverdue` returned HTTP 500 with `no such column: $B.isOverdue`.
- The CAP service contract itself was not missing the fields. A clean in-memory deployment and the existing direct CDS tests filtered all four monitoring fields correctly.
- Root cause was a stale persisted SQLite service view. `BugService_Bugs` was still the older view containing legacy `assigneeDisplayName` and did not contain the four monitoring columns generated by the current `srv/service.cds`.
- Added `scripts/dev/refresh-sqlite-service-views.js` and npm command `dev:sqlite:refresh-views`. The utility compiles the current CAP model, verifies that target objects are views, and transactionally recreates only generated views without dropping business tables.
- Added `scripts/qa/test-pm-monitoring-http.js` and npm command `qa:pm-monitoring:http` to verify the real OData filter path used by Fiori.
- Expected-failure proof on a copied stale database produced HTTP 500. After running the view refresh on the same copy, the HTTP suite passed `8 PASS / 0 FAIL`.

Vietnamese:

- Lỗi browser UAT từ PR #16 đã được tái hiện qua OData trên `db.sqlite` persistent: filter `BugService.Bugs` theo `isOverdue` trả HTTP 500 với lỗi `no such column: $B.isOverdue`.
- CAP service contract không thiếu các field này. Database in-memory sạch và direct CDS tests đều filter đúng cả bốn monitoring fields.
- Root cause là SQLite service view persistent đã cũ. `BugService_Bugs` vẫn là view cũ có `assigneeDisplayName` và chưa có bốn monitoring columns do `srv/service.cds` hiện tại sinh ra.
- Đã thêm `scripts/dev/refresh-sqlite-service-views.js` và command `dev:sqlite:refresh-views`. Utility compile model CAP hiện tại, xác nhận object mục tiêu thực sự là view, rồi recreate generated views trong transaction mà không drop business table.
- Đã thêm `scripts/qa/test-pm-monitoring-http.js` và command `qa:pm-monitoring:http` để kiểm tra đúng OData filter path mà Fiori sử dụng.
- Bằng chứng expected failure trên bản copy DB stale trả HTTP 500; sau khi refresh view trên chính bản copy đó, HTTP suite pass `8 PASS / 0 FAIL`.

## 2026-07-01 - IDTS-41 catalog and draft-create hardening

English:

- Added backend validation for Priority, Severity, and Environment across active create/update and shared draft validation paths.
- Unknown, inactive, wrong-case, non-string, and whitespace-only catalog values return HTTP 400 with a field-specific target and are not persisted.
- Added CAP `@assert.target` constraints as the referential-integrity layer; active-state checks remain in the Node.js handler.
- Registered create-role enforcement on the CAP draft `NEW` event so Developer is blocked at the start of root draft creation.
- Focused in-memory SQLite verification: `npm run qa:idts41:programmatic` ran 18 checks with 18 PASS / 0 FAIL.

Vietnamese:

- Đã thêm backend validation cho Priority, Severity và Environment ở active create/update và các đường draft dùng chung.
- Code không tồn tại, inactive, sai hoa/thường, không phải string và chỉ có khoảng trắng đều trả HTTP 400 đúng target field và không được persist.
- Đã thêm `@assert.target` làm lớp toàn vẹn tham chiếu; kiểm tra trạng thái active vẫn nằm trong handler Node.js.
- Đã đăng ký rule quyền create ở event draft `NEW` của CAP để chặn Developer ngay khi bắt đầu root draft.
- Verify SQLite in-memory tập trung: `npm run qa:idts41:programmatic` chạy 18 check, 18 PASS / 0 FAIL.

## Definition of Done

- Invalid transitions are rejected in backend.
- nextProcessor is not manually required for normal flow.
- Assignment rules are enforced beyond the UI.
- Important changes are auditable.
- Rejected bugs cannot remain without reason, owner, and next action.

Vietnamese:

- Backend phải chặn trường hợp bug chuyển sang `Rejected` mà không có lý do, owner xử lý tiếp và action tiếp theo.
