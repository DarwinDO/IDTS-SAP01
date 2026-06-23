# NhanT Status - QA/Verification Primary

Last updated: 2026-06-17

Vietnamese: Trạng thái của NhanT - phụ trách chính QA/Verification.

## Member Identity

| Field | Value |
| --- | --- |
| Member | NhanT |
| Primary lane | QA/Verification |
| Shared delivery responsibility | May receive Backend CAP, Fiori/UI5, or QA/Verification tasks as assigned, but QA/Verification is the primary focus |
| Leader support | DonHV can support or unblock this lane when needed |

Vietnamese:

| Trường | Giá trị |
| --- | --- |
| Thành viên | NhanT |
| Mảng chính | QA/Verification |
| Trách nhiệm delivery chung | Có thể nhận task Backend CAP, Fiori/UI5 hoặc QA/Verification khi được phân công, nhưng QA/Verification là trọng tâm chính |
| Leader hỗ trợ | DonHV có thể hỗ trợ hoặc gỡ blocker cho mảng này khi cần |

## Current Focus

IDTS-23: Expand automated regression for ownership, history, and monitoring.

Vietnamese: IDTS-23: Mở rộng kiểm thử hồi quy tự động cho ownership, history, và monitoring.

## Latest Updates

- **2026-06-21**: Thực hiện task IDTS-23: Expand automated regression for ownership, history, and monitoring.
  - Tạo script `scripts/qa/test-idts23-regression.js` chạy hồi quy toàn diện lifecycle ownership, history, và giám sát.
  - Fix lỗi test harness: cài package `@cap-js/attachments` thiếu do dependency của service.
  - Fix lỗi treo `callAction` / deadlock `cds.tx()` pattern trong test-idts23 bằng cách chuyển đổi sang sử dụng promise với `srv.dispatch(req)` và xử lý `catch` mà không wrap bằng timeout không cần thiết.
  - Fix lỗi runtime: Test ownership PASS hoàn toàn `(12/12)`, Test history PASS hoàn toàn `(1/1)`, Test monitoring PASS hoàn toàn `(16/16)`.
  - Tổng cộng 29/29 checks PASS. Test chạy thành công bằng lệnh `node scripts/qa/test-idts23-regression.js`.

- **2026-06-17**: Đã verify toàn bộ PM Monitoring Flags theo checklist manual. Mọi chức năng `isOverdue`, `isRejectedFollowUp`, `isPendingAssignment`, `isRetestRequired` hiển thị và hoạt động đúng với UI List Report. Test manual thành công!

## Remaining Blockers

- None. Tạm thời không có blocker nào cho script regression này.

Vietnamese: Không có blocker. Script chạy thành công.

## Provisional Status / Bug Staging

- **Bug 1 (Fix tại chỗ)**: Lỗi `NOT NULL constraint failed: idts_cap_Bugs.stepsToReproduce` khi gọi `assignToDeveloper` từ test programmatic, do req truyền qua dispatch kích hoạt hook UPDATE nhưng bị thiếu data do CDS test model tự validate strict field constraint, fix bằng việc truyền đúng structure.
- **Bug 2 (Fix tại chỗ)**: Lỗi deadlock và timeout khi gọi `assignToDeveloper`, nguyên nhân do `callAction` tự wrap `timeout` và treo Promise khi lỗi xảy ra bên trong service (VD sai authorization role do test data), fix bằng cách check try-catch cho Promise `srv.dispatch`.

Vietnamese:
- **Bug 1**: `NOT NULL constraint failed: idts_cap_Bugs.stepsToReproduce` khi update bằng `assignToDeveloper` vì data test model update bằng db.run bị thiếu. Đã fix.
- **Bug 2**: Deadlock timeout test script. Đã fix cách handle Promise catch. bug, assign, pending assignment, developer review, request information, reject, resolve, retest, close, reopen, comments, history, and PM monitoring.

## Done

- Definition of Done is documented in `docs/pm/05-definition-of-done.md`.
- Sprint 1 verification commands are documented.

Vietnamese:

- Definition of Done đã được ghi trong `docs/pm/05-definition-of-done.md`.
- Các lệnh verification cho Sprint 1 đã được document.

## In Progress

- IDTS-12: Demo script created, final smoke test re-confirmed (21/21 PASS), pending team evidence and commit.

Vietnamese: IDTS-12: Demo script đã tạo, final smoke test xác nhận lại (21/21 PASS), chờ evidence từ team và commit.

## Next

- For WP1, verify CDS model compilation and schema alignment with the BA data dictionary.
- For later work, create scenario checks for create bug, assign, pending assignment, developer review, request information, reject, resolve, retest, close, reopen, comments, history, and PM monitoring.

Vietnamese:

- Với WP1, verify CDS model compile và đối chiếu schema với BA data dictionary.
- Với các phần sau, tạo scenario check cho create bug, assign, pending assignment, developer review, request information, reject, resolve, retest, close, reopen, comments, history và PM monitoring.

## Blockers

- Waiting for implementation work to begin.

Vietnamese: Đang chờ implementation bắt đầu.

## Session Log

| Date | Task/WP | What was done | Completed part | Issues/Bugs found | Fix status | Evidence/Commands | Next handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | Status setup | Member status file created from previous QA/Verification status | QA/Verification status ownership assigned to NhanT | None | Fixed | `rg`, `git diff --check` | Prepare WP1 verification when implementation starts |
| 2026-06-09 | IDTS-3 | Read AGENTS.md, project-context.md, service.js; identified missing `requireReason: true` on `resolveBug` handler; applied surgical fix; ran Node.js syntax check and logic test | Fix applied to `srv/service.js` line 137; all 10 validation scenarios PASS; CDS compile OK | **Bug:** `resolveBug` (`In Progress → Resolved`) was missing `requireReason: true` — note was silently optional, violating mentor-confirmed business rule | Fixed ✅ | `node --check srv/service.js` → SYNTAX OK; `cds compile srv --to edmx` (via cds.ps1) → EDMX output no errors; logic test 10/10 PASS | DonHV to review `srv/service.js` diff and do Jira update/close IDTS-3 |
| 2026-06-13 | IDTS-6 | Read task, seed data, service.js; created `docs/qa/idts6-happy-flow-checklist.md`; wrote `scripts/qa/test-idts6-programmatic.js`; ran test via direct CDS handler dispatch (bypass UI5 plugin issue); all action handlers tested | Checklist file + test script created; IDTS-3 fix re-confirmed (resolveBug empty note=400, with note=200); HistoryLogs 5 entries verified | Initial SC-01a direct CREATE request lacked a generic query and was treated as an environment skip | Fixed during DonHV integration on 2026-06-15 by adding an `INSERT` query and deterministic test UUIDs | `node scripts/qa/test-idts6-programmatic.js` → 21 PASS 0 FAIL; `node --check srv/service.js` OK | IDTS-6 is ready for final merge verification |
| 2026-06-18 | Git Sync | Merged latest `dev` branch changes into personal branch `feat/idts12-mentor-demo-nhant` and pushed to origin | Local branch updated with latest changes | None | N/A | `git checkout feat/idts12-mentor-demo-nhant`, `git merge dev`, `git push origin feat/idts12-mentor-demo-nhant` | Ready for Sprint 2 demo |
| 2026-06-21 | Git Sync | Merged latest `dev` branch changes into personal branch `feat/idts12-mentor-demo-nhant` and pushed to origin | Local branch updated with latest changes (including new service module refactoring) | None | N/A | `git merge origin/dev`, `git push origin HEAD` | Ready for Sprint 2 demo |
| 2026-06-23 | IDTS-23 | Fix regression script issues according to DoNHV's review. Wrapped callAction in mustCallAction to throw on failure. Fixed implicit SQLite deadlocks caused by uncommitted ad-hoc read transactions. Replaced weak assertions with strict strings. Added GUARD checks. | All 5 review comments addressed. Regression checks run to 45/45 PASS. | SQLite deadlock occurred due to nested `cds.tx()` leak in mock read endpoints. | Fixed ✅ | `node scripts/qa/test-idts23-regression.js` -> 45 PASS | Wait for PR merge |

| 2026-06-17 | IDTS-12 | Created `docs/demo/sprint02-demo-script.md` with 10-scene demo flow, backend verification commands, known issues list, and deliverables summary; re-ran final smoke test; ran CDS compile check | Demo script created; smoke test re-confirmed 21/21 PASS; CDS compile EDMX OK; 6 known issues documented honestly | None new | All items completed | `node scripts/qa/test-idts6-programmatic.js` → 21 PASS 0 FAIL; `cds compile srv app/bug-management-ui --to edmx` → EDMX OK | DonHV/DatDT/SangVN to add their evidence before mentor meeting; commit and close IDTS-12 |

Vietnamese:

| Ngày | Task/WP | Đã làm gì | Phần đã xong | Khó khăn/Bug phát hiện | Trạng thái fix | Bằng chứng/Lệnh đã chạy | Handoff tiếp theo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-03 | Status setup | Tạo file status thành viên từ status QA/Verification cũ | Đã giao ownership QA/Verification cho NhanT | Không có | Đã xử lý | `rg`, `git diff --check` | Chuẩn bị verification cho WP1 khi implementation bắt đầu |
| 2026-06-09 | IDTS-3 | Đọc AGENTS.md, project-context.md, service.js; phát hiện thiếu `requireReason: true` ở handler `resolveBug`; áp dụng fix surgical; chạy Node.js syntax check và logic test | Fix đã áp dụng vào `srv/service.js` dòng 137; 10/10 validation scenario PASS; CDS compile OK | **Bug:** `resolveBug` (`In Progress → Resolved`) thiếu `requireReason: true` — note đang optional âm thầm, vi phạm business rule mentor đã xác nhận | Đã fix ✅ | `node --check srv/service.js` → SYNTAX OK; `cds compile srv --to edmx` (qua cds.ps1) → EDMX output không lỗi; logic test 10/10 PASS | DonHV review diff `srv/service.js` và cập nhật/đóng Jira IDTS-3 |
| 2026-06-13 | IDTS-6 | Đọc task, seed data, service.js; tạo `docs/qa/idts6-happy-flow-checklist.md`; viết `scripts/qa/test-idts6-programmatic.js`; chạy test qua direct CDS handler dispatch (bypass vấn đề UI5 plugin); kiểm tra toàn bộ action handler | File checklist + test script đã tạo; IDTS-3 fix xác nhận lại (resolveBug note rỗng=400, có note=200); HistoryLogs 5 entries đã verify | Request CREATE trực tiếp của SC-01a ban đầu thiếu generic query và bị xem nhầm là giới hạn môi trường | Đã fix khi DonHV integration ngày 2026-06-15 bằng cách thêm `INSERT` query và UUID test cố định | `node scripts/qa/test-idts6-programmatic.js` → 21 PASS 0 FAIL; `node --check srv/service.js` OK | IDTS-6 sẵn sàng cho final merge verification |
| 2026-06-18 | Git Sync | Merge code mới từ nhánh `dev` vào nhánh cá nhân `feat/idts12-mentor-demo-nhant` và push lên origin | Cập nhật nhánh cá nhân thành công với code mới nhất | Không có | N/A | `git checkout feat/idts12-mentor-demo-nhant`, `git merge dev`, `git push origin feat/idts12-mentor-demo-nhant` | Sẵn sàng demo Sprint 2 |
| 2026-06-21 | Git Sync | Merge code mới từ nhánh `dev` vào nhánh cá nhân `feat/idts12-mentor-demo-nhant` và push lên origin | Cập nhật nhánh cá nhân thành công với code mới nhất (bao gồm refactoring module service lớn) | Không có | N/A | `git merge origin/dev`, `git push origin HEAD` | Sẵn sàng demo Sprint 2 |
| 2026-06-23 | IDTS-23 | Sửa script hồi quy IDTS-23 theo review của DoNHV. Dùng mustCallAction, sửa lỗi SQLite deadlock do rò rỉ uncommitted transaction `cds.tx()` từ mock read, chuyển truthy assertion sang check string strict. Thêm GUARD check. | Xử lý xong 5 comment review. Script chạy đủ 45/45 PASS. | SQLite bị deadlock do gọi nested cds.tx từ read endpoint. Đã đổi qua binding chuẩn request. | Đã fix ✅ | `node scripts/qa/test-idts23-regression.js` -> 45 PASS | Chờ merge PR |

| 2026-06-17 | IDTS-12 | Tạo `docs/demo/sprint02-demo-script.md` gồm 10 scene demo, lệnh verify backend, danh sách known issues, và tổng hợp deliverables; chạy lại final smoke test; chạy CDS compile check | Demo script đã tạo; smoke test xác nhận lại 21/21 PASS; CDS compile EDMX OK; 6 known issues ghi nhận trung thực | Không có mới | Tất cả đã hoàn thành | `node scripts/qa/test-idts6-programmatic.js` → 21 PASS 0 FAIL; `cds compile srv app/bug-management-ui --to edmx` → EDMX OK | DonHV/DatDT/SangVN bổ sung evidence trước buổi mentor; commit và đóng IDTS-12 |

## Update Rule

- NhanT updates this file after each work session.
- Record what was tested, what passed, what failed, bugs/errors found, whether they were fixed, and evidence commands/results.
- Do not edit other members' status files unless coordinating with DonHV.

Vietnamese:

- NhanT cập nhật file này sau mỗi phiên làm việc.
- Ghi rõ đã test gì, pass phần nào, fail phần nào, bug/error phát hiện, đã fix hay chưa và bằng chứng command/kết quả.
- Không chỉnh file status của thành viên khác trừ khi phối hợp với DonHV.
