# IDTS-86 Material Quality Validation

## English

Date: 2026-07-18 (Asia/Bangkok)

Reviewer: DonHV delegated the IDTS-86 material-review work to the Codex agent. This report is agent-assisted QA evidence. It is not a fabricated NhanT sign-off and it does not replace any member's personal Knowledge Gate or teach-back.

### Result

**Material QA: PASS.** The 72-file beginner-learning baseline is structurally complete, the sampled explanations match real source symbols, and the three owner flows can be followed with working breakpoint orders.

**IDTS-86 closure: still open.** The Jira issue also requires personal gate/debug/teach-back evidence. Those human results are not asserted in this report.

### Structural coverage

| Batch | Runtime source | Matching mirror | PR gate |
| --- | ---: | ---: | --- |
| DonHV backend/data — PR #158 | 35 | 35 | PASS |
| DatDT shell/dashboard/AI UI — PR #159 | 22 | 22 | PASS |
| SangVN Object Page/collaboration — PR #160 | 15 | 15 | PASS |
| Total | 72 | 72 | PASS |

Additional checks:

- all 152 inspected source, mirror, Debug Lab, and governance files passed fatal UTF-8 decoding;
- all comment-capable runtime files had more than a generic header-only marker;
- 21/21 symbols used by the three deep traces exist in the stated physical source files;
- PR #158 and #160 had no non-comment runtime diff line; four initially suspicious PR #159 lines were text inside XML comments;
- no OData contract, schema behavior, route, dependency, or runtime statement was introduced by the three material PRs.

### Deep trace 1 — DonHV create and lifecycle

Expected execution order:

1. `BugListActions.createBug()` asks the supported Fiori Elements edit flow to create `/Bugs`.
2. The browser sends draft `NEW`; `srv/service.js` runs the root-draft permission hook.
3. `enforceBugCreatePermission()` rejects Developer and returns the authenticated actor for Tester/PM.
4. `prepareDraftNew()` assigns the trusted reporter; later field edits reach `prepareDraftPatch()`.
5. `prepareBugWrite()` and catalog validators reject invalid, inactive, wrong-case, numeric-like, or whitespace codes.
6. Draft activation reaches `handleDraftSave()`; validation runs before `next()`, CAP persistence occurs at `next()`, and post-save history/attachment work runs only afterwards.
7. A later bound lifecycle action is wired in `srv/service.js` and reaches `transitionBug()`, which checks actor, permission, source/destination status and reason before updating the Bug and writing history/notification side effects.

Breakpoint order: `createBug` → browser Network `NEW/PATCH/SAVE` → `enforceBugCreatePermission` → `prepareDraftNew`/`prepareDraftPatch` → `handleDraftSave` before and after `next()` → `transitionBug` for a later action.

Observed evidence: auth 28/28 PASS; catalog/draft authorization 18/18 PASS; CAP compile exit 0.

### Deep trace 2 — DatDT dashboard and history

Expected execution order:

1. `dashboard.html` loads the guarded SAPUI5 page and `dashboard-page.js`.
2. `loadDashboard()` reads the safe login session and starts OData reads for `Bugs` and `DeveloperWorkloads`.
3. `fetchOData()` rejects failed HTTP responses; `buildDashboardModel()` selects the Tester, Developer, or PM view model.
4. Backend `READ DeveloperWorkloads` is routed by `srv/service.js` to `readDeveloperWorkloads()`, which computes read-only workload aggregates without changing ownership.
5. The History fragment reads persisted `HistoryEvents`. `ensureHistoryEventSelectDependencies()` adds dependencies required by virtual display fields and `enrichHistoryEventPayload()` builds readable response fields without updating audit rows.
6. `HistoryTimeline.fragment.xml` uses `growingThreshold="5"`; older events remain available through the explicit load-more behavior.

Breakpoint order: `loadDashboard` → each `fetchOData` response → `buildDashboardModel` → `readDeveloperWorkloads`; for History, before-READ dependency enrichment → after-READ payload enrichment → fragment binding.

Observed evidence: DeveloperWorkloads 36/36 PASS; all seven History contract scenarios PASS with zero failures; UI5 build exit 0.

### Deep trace 3 — SangVN assignment, comments, and attachments

Expected execution order:

1. Assignee value help opens Smart Assign, then `readCandidates()` reads `AssignableDevelopers`.
2. `readAssignmentExplanations()` may request review-only AI explanations. It does not select or assign a Developer.
3. The user selects a row; `executeAssignment()` chooses the draft or active path, and CAP remains the final permission/candidate/availability validator.
4. Posting a comment calls `BugCollaboration.onAddComment()` → the bound `addComment` OData action → backend action logic → persisted comment/history → context refresh.
5. A file selected before first Save stays only in browser memory. After the Bug is active, `uploadFilesToSavedBug()` creates metadata and uploads binary content.
6. `prepareAttachmentWrite()` validates the authenticated actor and safe metadata. PostgreSQL stores metadata/storage reference; the configured storage adapter sends binary content to S3.

Breakpoint order: `readCandidates` → `readAssignmentExplanations` → selected row → `executeAssignment`; then `onAddComment` → Network/action handler; attachment queue → `uploadFilesToSavedBug` → `prepareAttachmentWrite` → storage boundary.

Observed evidence: Smart Assign 13/13 PASS; comments persisted after reconnect; attachment programmatic test correctly delegates real binary/draft coverage to the dedicated HTTP/browser flow.

### Negative and falsification evidence

- The QA Depth Gate self-test passed 15/15, including missing sections, bare `N/A`, low score, failed teach-back, invalid bootstrap/runtime claims, browser 5xx and runtime `TypeError` blockers.
- The Ownership Gate runner passed 5/5, including invalid member/flow/future-date rejection and deterministic question selection.
- Direct Developer draft creation returned expected 403; invalid catalog values returned field-targeted 400 and did not persist.
- Invalid Smart Assign candidates were rejected by backend validation.
- An incorrect UI5 build working directory and two guessed paths were detected, logged, corrected, and fully rerun; no product failure was inferred from those tooling mistakes.

### Known limitations and next gate

- CAP compile keeps the pre-existing `NonUpdateableProperties` warning for attachments.
- `npm ci` keeps the known 14 dependency vulnerabilities tracked outside this documentation QA.
- Material QA proves that the explanations can drive a trace. It does not prove that DonHV, DatDT, SangVN, or NhanT can independently explain the flow.
- Next: resume DonHV `create-lifecycle`, DatDT `dashboard-history`, SangVN `assignment-comments-attachments`, and NhanT `qa-release-evidence` Knowledge Gates. Do not merge the governance PR while its Ownership Knowledge Gate remains `PAUSED`.

## Vietnamese

Ngày: 18/07/2026 (Asia/Bangkok)

Người review: DonHV ủy quyền phần review material của IDTS-86 cho Codex agent. Báo cáo này là evidence QA có agent hỗ trợ. Nó không giả mạo xác nhận của NhanT và không thay thế Knowledge Gate hoặc teach-back cá nhân của bất kỳ thành viên nào.

### Kết quả

**QA chất lượng material: PASS.** Baseline học tập 72 file đã đủ về cấu trúc, phần giải thích được lấy mẫu khớp với symbol thật, và ba luồng theo owner có thể trace bằng thứ tự breakpoint thực tế.

**Đóng IDTS-86: vẫn chưa đủ điều kiện.** Jira task còn yêu cầu evidence gate/debug/teach-back cá nhân. Báo cáo này không tự ghi các kết quả của con người.

### Coverage cấu trúc

| Batch | Runtime source | Mirror tương ứng | PR gate |
| --- | ---: | ---: | --- |
| Backend/data DonHV — PR #158 | 35 | 35 | PASS |
| Shell/dashboard/AI UI DatDT — PR #159 | 22 | 22 | PASS |
| Object Page/collaboration SangVN — PR #160 | 15 | 15 | PASS |
| Tổng | 72 | 72 | PASS |

Các kiểm tra bổ sung:

- toàn bộ 152 source, mirror, Debug Lab và governance file được kiểm đều decode UTF-8 nghiêm ngặt thành công;
- mọi runtime file hỗ trợ comment đều có nhiều hơn một comment đầu file chung chung;
- 21/21 symbol dùng trong ba trace sâu tồn tại trong đúng source file vật lý đã ghi;
- PR #158 và #160 không có runtime diff line ngoài comment; bốn dòng PR #159 bị nghi ngờ ban đầu thực tế nằm bên trong XML comment;
- ba PR material không thêm OData contract, thay đổi schema behavior, route, dependency hoặc runtime statement.

### Trace sâu 1 — DonHV: create và lifecycle

Thứ tự chạy mong đợi:

1. `BugListActions.createBug()` nhờ edit flow chuẩn của Fiori Elements tạo `/Bugs`.
2. Browser gửi draft `NEW`; `srv/service.js` chạy hook kiểm quyền root draft.
3. `enforceBugCreatePermission()` chặn Developer và trả authenticated actor cho Tester/PM.
4. `prepareDraftNew()` gắn reporter đáng tin; các lần sửa field sau đó vào `prepareDraftPatch()`.
5. `prepareBugWrite()` và catalog validator chặn code sai, inactive, sai hoa/thường, giống số hoặc chỉ có khoảng trắng.
6. Khi activate draft, request vào `handleDraftSave()`; validate chạy trước `next()`, CAP persist tại `next()`, còn history/attachment sau save chỉ chạy sau đó.
7. Action lifecycle tiếp theo được nối trong `srv/service.js` và vào `transitionBug()`. Hàm kiểm actor, quyền, status nguồn/đích và reason trước khi update Bug và ghi history/notification.

Thứ tự breakpoint: `createBug` → Network `NEW/PATCH/SAVE` → `enforceBugCreatePermission` → `prepareDraftNew`/`prepareDraftPatch` → `handleDraftSave` trước và sau `next()` → `transitionBug` cho action sau đó.

Evidence: auth 28/28 PASS; catalog/draft authorization 18/18 PASS; CAP compile exit 0.

### Trace sâu 2 — DatDT: dashboard và history

Thứ tự chạy mong đợi:

1. `dashboard.html` tải trang SAPUI5 đã có auth guard và `dashboard-page.js`.
2. `loadDashboard()` đọc login session an toàn rồi bắt đầu OData read `Bugs` và `DeveloperWorkloads`.
3. `fetchOData()` chặn HTTP response lỗi; `buildDashboardModel()` chọn model cho Tester, Developer hoặc PM.
4. Backend `READ DeveloperWorkloads` được `srv/service.js` chuyển vào `readDeveloperWorkloads()`. Hàm tính aggregate chỉ đọc và không đổi ownership.
5. History fragment đọc `HistoryEvents` đã persist. `ensureHistoryEventSelectDependencies()` bổ sung dependency cho virtual display field; `enrichHistoryEventPayload()` tạo response dễ đọc mà không update audit row.
6. `HistoryTimeline.fragment.xml` dùng `growingThreshold="5"`; event cũ vẫn xem được qua hành vi tải thêm rõ ràng.

Thứ tự breakpoint: `loadDashboard` → response của từng `fetchOData` → `buildDashboardModel` → `readDeveloperWorkloads`; với History là before-READ dependency enrichment → after-READ payload enrichment → fragment binding.

Evidence: DeveloperWorkloads 36/36 PASS; bảy scenario History đều PASS và không có failure; UI5 build exit 0.

### Trace sâu 3 — SangVN: assignment, comment và attachment

Thứ tự chạy mong đợi:

1. Value help Assignee mở Smart Assign, rồi `readCandidates()` đọc `AssignableDevelopers`.
2. `readAssignmentExplanations()` có thể lấy AI explanation chỉ để review. Nó không tự chọn hoặc assign Developer.
3. User chọn một dòng; `executeAssignment()` chọn đường draft hoặc active. CAP vẫn là lớp cuối kiểm quyền, candidate và availability.
4. Post comment gọi `BugCollaboration.onAddComment()` → bound action OData `addComment` → backend action → persist comment/history → refresh context.
5. File chọn trước lần Save đầu chỉ nằm trong browser memory. Khi Bug đã active, `uploadFilesToSavedBug()` tạo metadata rồi upload binary.
6. `prepareAttachmentWrite()` kiểm actor và metadata an toàn. PostgreSQL giữ metadata/storage reference; storage adapter gửi binary lên S3.

Thứ tự breakpoint: `readCandidates` → `readAssignmentExplanations` → row được chọn → `executeAssignment`; tiếp theo là `onAddComment` → Network/action handler; attachment queue → `uploadFilesToSavedBug` → `prepareAttachmentWrite` → storage boundary.

Evidence: Smart Assign 13/13 PASS; comment vẫn tồn tại sau reconnect; test programmatic attachment chuyển đúng phần binary/draft thật sang HTTP/browser flow chuyên dụng.

### Evidence negative và falsification

- QA Depth Gate self-test PASS 15/15, gồm các case thiếu section, `N/A` trống, score thấp, teach-back fail, bootstrap khai runtime sai, browser 5xx và runtime `TypeError`.
- Ownership Gate runner PASS 5/5, gồm reject member/flow/ngày tương lai không hợp lệ và chọn câu hỏi deterministic.
- Developer gọi tạo draft trực tiếp nhận 403 như mong đợi; catalog sai nhận 400 đúng field và không persist.
- Candidate Smart Assign sai bị backend reject.
- Sai working directory UI5 và hai path đoán sai đã được phát hiện, ghi log, sửa và chạy lại đầy đủ; không suy diễn chúng thành lỗi sản phẩm.

### Giới hạn còn lại và gate tiếp theo

- CAP compile giữ warning có sẵn về `NonUpdateableProperties` của attachment.
- `npm ci` giữ 14 dependency vulnerability đã biết và được track ngoài task QA tài liệu này.
- Material QA chứng minh tài liệu đủ để dẫn đường trace. Nó không chứng minh DonHV, DatDT, SangVN hoặc NhanT tự giải thích được luồng.
- Bước tiếp theo: chạy lại Knowledge Gate `create-lifecycle` cho DonHV, `dashboard-history` cho DatDT, `assignment-comments-attachments` cho SangVN và `qa-release-evidence` cho NhanT. Không merge governance PR khi Ownership Knowledge Gate vẫn là `PAUSED`.
