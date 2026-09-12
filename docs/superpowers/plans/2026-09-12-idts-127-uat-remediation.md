# IDTS-127 UAT Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Subagents are not used because the current repository instructions reserve delegation for explicitly authorized, disjoint work and these CAP flows share one write scope.

## English

**Goal:** Close the source-remediation portion of IDTS-127 with focused regression tests, then classify the remaining UAT cases truthfully as retest, fixture, direct-request, or business-decision work.

**Architecture:** Keep CAP authoritative at every trust boundary. Reuse the existing comment, draft-save history, attachment, AI-review, and classification handlers; add only the smallest missing guards or UI feedback. Do not change the data model, role model, workflow, dependency graph, provider configuration, deployment, HANA data, official workbook, or Drive artifact in this source gate.

**Tech Stack:** SAP CAP Node.js 9.9.2, OData V4 draft flow, SAP Fiori Elements/SAPUI5, SQLite programmatic QA, existing repository scripts.

**Spec:** Jira IDTS-127 and `docs/pm/tasks/idts-111-uat-en.md`.

### Global Constraints

- Baseline is `origin/dev` commit `e019f7799fd30a419fafb048b41653d72a837083`.
- Work only on `fix/idts-127-uat-remediation-donhv` in the isolated worktree.
- Test first and observe the intended RED failure before production changes.
- No schema, seed, dependency, provider, BTP, HANA, workbook, or Drive mutation.
- Update the bilingual knowledge mirror for every changed file under `app/`, `srv/`, or `db/`.
- Negative UAT cases pass only when both the expected HTTP rejection and no-mutation readback are proven.

---

### Task 1: Enforce the comment length boundary in CAP

**Files:**
- Modify: `scripts/qa/test-comments-attachments-programmatic.js`
- Modify: `srv/bug-service/content.js`
- Modify: `srv/bug-service/actions.js`
- Modify: `docs/knowledge/srv/bug-service/content.js.md`
- Modify: `docs/knowledge/srv/bug-service/actions.js.md`

**Interfaces:**
- Consumes: `prepareCommentCreate(req, entities)` and `addComment(req, entities)`.
- Produces: both comment entry paths reject content longer than 1000 characters with HTTP 400 before persistence, history, or notification side effects.

- [x] Add literal 1000/1001-character cases for the supported bound `addComment` action, and prove direct composition-child CREATE remains protocol-blocked without mutation.
- [x] Run `npm run qa:comments-attachments:programmatic` and confirm the 1001-character case fails because the current backend accepts it.
- [x] Add one shared `MAX_COMMENT_LENGTH = 1000` guard in the existing backend module and reuse it from both entry paths without a new dependency or abstraction layer.
- [x] Rerun the focused test and confirm boundary acceptance plus no partial rows at 1001 characters.
- [x] Update both knowledge mirrors with the backend trust-boundary rule and must-check-together UI `maxLength="1000"` reference.

### Task 2: Prove and remove duplicate draft-Save history

**Files:**
- Modify or create focused coverage under: `scripts/qa/`
- Modify only if RED reproduces: `srv/bug-service/drafts.js`, `srv/bug-service/history.js`, or `srv/service.js`
- Modify matching knowledge mirror for each changed runtime source file.

**Interfaces:**
- Consumes: Fiori Edit draft PATCH followed by `SAVE` on `Bugs.drafts`.
- Produces: one active Bug change and exactly one grouped Edit `HistoryEvent`, with no duplicate notification.

- [x] Reproduce the exact active-Bug Edit → draft PATCH → SAVE flow against isolated SQLite and count HistoryEvents/HistoryLogs before and after.
- [x] Confirm RED only if one Save creates more than one equivalent Edit event; the RED run reproduced two equivalent Edit events.
- [x] Trace the duplicate through active `after UPDATE` plus `SAVE`; keep active UPDATE as the single Bug-field history owner while SAVE retains attachment audit.
- [x] Rerun the exact draft flow, generic active UPDATE history test, attachment-save audit test, and lifecycle audit test.

### Task 3: Make oversized attachment rejection understandable

**Files:**
- Inspect first: `db/schema.cds`, current Fiori attachment annotations/configuration, and `@cap-js/attachments` integration points.
- Modify only the smallest existing UI/CAP hook required by the reproduced failure.
- Modify matching i18n and knowledge mirror files if UI source changes.

**Interfaces:**
- Consumes: native attachment selection/upload for a file larger than 10 MB.
- Produces: a user-facing 10 MB message and zero attachment metadata or storage object.

- [x] Characterize the current local contract for 10 MB + 1 byte without creating live data.
- [x] Confirm CAP and `@cap-js/attachments` return HTTP 413 with the filename and configured 10 MB limit before active persistence.
- [x] Add a focused HTTP boundary test that proves the response and zero active attachment metadata.
- [x] Do not add speculative UI code: the remaining question is native Fiori message propagation and must be retested after deployment with an oversized disposable file.

### Task 4: Reclassify already-implemented AI and lifecycle cases

**Files:**
- No production source change unless a fresh focused regression fails.
- Update task/status/evidence documentation only after fresh results exist.

- [x] Run AI review persistence, classification apply/stale-source, grounded handoff, Smart Assign, and required lifecycle-reason suites.
- [x] Map each result to `UAT-AI-005/008/009/010/014/015` and `UAT-LIFE-014` without claiming BTP acceptance from SQLite.
- [x] Keep any case requiring a live identity/provider/role fixture out of PASS until deployed evidence exists.

### Catalog corrections confirmed during remediation

- [x] Correct `UAT-BUG-010` to PM denial because the canonical role model, UI binding, and CAP guard all define Tester-only Bug creation.
- [x] Correct `UAT-UX-003` to SAPUI5 composite-widget keyboard semantics: Tab moves between controls, while arrow keys move within a list.
- [x] Preserve historical UAT evidence unchanged; only the forward planning catalog is regenerated.

### Task 5: Verify and prepare the source gate

- [x] Run focused positive, negative, boundary, authorization, persistence/reload, and falsification checks.
- [x] Run `npx cds compile srv -s all --to edmx`, relevant UI lint/build when UI changes, `npm run qa:secret-scan`, `npm run qa:agent-rules`, `npm run qa:depth:self-test`, AI DevKit lint, and `git diff --check`.
- [x] Review the exact diff for scope and Ponytail simplicity; independent re-review found no remaining Critical, Major, or Important issue and returned Draft PR GO. Do not merge, deploy, mutate Jira status, or update the official workbook in this gate.

## Tiếng Việt

**Mục tiêu:** Đóng phần sửa source của IDTS-127 bằng regression test tập trung, sau đó phân loại trung thực các UAT case còn lại thành retest, fixture, direct-request hoặc quyết định nghiệp vụ.

**Kiến trúc:** Giữ CAP là lớp có thẩm quyền tại mọi trust boundary. Tái sử dụng handler comment, draft-save history, attachment, AI review và classification hiện có; chỉ thêm guard hoặc phản hồi UI nhỏ nhất còn thiếu. Không đổi data model, role model, workflow, dependency graph, provider config, deployment, dữ liệu HANA, workbook chính thức hoặc Drive trong source gate này.

**Công nghệ:** SAP CAP Node.js 9.9.2, OData V4 draft flow, SAP Fiori Elements/SAPUI5, SQLite programmatic QA và script hiện có của repository.

**Đặc tả:** Jira IDTS-127 và `docs/pm/tasks/idts-111-uat-en.md`.

### Ràng buộc chung

- Baseline là `origin/dev` commit `e019f7799fd30a419fafb048b41653d72a837083`.
- Chỉ làm trên `fix/idts-127-uat-remediation-donhv` trong worktree cô lập.
- Viết test trước và phải nhìn thấy RED đúng nguyên nhân trước khi sửa production code.
- Không đổi schema, seed, dependency, provider, BTP, HANA, workbook hoặc Drive.
- Mọi file đổi dưới `app/`, `srv/`, `db/` phải cập nhật knowledge mirror song ngữ tương ứng.
- Negative UAT chỉ PASS khi chứng minh cả HTTP rejection mong đợi và readback không có mutation.

### Task 1: Bắt buộc giới hạn độ dài comment tại CAP

- Bổ sung case 1000/1001 ký tự cho bound action `addComment` được hỗ trợ, đồng thời chứng minh direct CREATE composition child vẫn bị protocol chặn và không mutation.
- Chạy test để xác nhận 1001 ký tự RED vì backend hiện còn chấp nhận.
- Dùng một guard `MAX_COMMENT_LENGTH = 1000` chung trong backend hiện có; không thêm dependency hoặc abstraction mới.
- Rerun để chứng minh 1000 được nhận, 1001 bị 400 và không có comment/history/notification dở dang.
- Cập nhật mirror `content.js.md` và `actions.js.md`, nối rõ với UI `maxLength="1000"`.

### Task 2: Chứng minh và loại duplicate history khi draft Save

- Tái hiện đúng luồng Edit active Bug → PATCH draft → SAVE bằng SQLite cô lập và đếm HistoryEvents/HistoryLogs trước-sau.
- Chỉ sửa runtime nếu RED tạo hơn một Edit event tương đương; nếu source hiện PASS thì ghi IDTS-119 là đã có fix trong source nhưng còn cần deployed retest.
- Nếu RED, trace đường ghi trùng qua active `after UPDATE` và `SAVE`, rồi chặn đúng một đường duplicate tại transaction boundary dùng chung.
- Rerun draft flow, generic active UPDATE, attachment-save audit và lifecycle audit.

### Task 3: Làm lỗi attachment quá dung lượng dễ hiểu

- Characterize file 10 MB và 10 MB + 1 byte mà không tạo dữ liệu live.
- Xác định thông báo bị mất tại native UI validation, propagation của CAP response hay storage plugin.
- Viết test RED nhỏ nhất cho đúng boundary đã xác nhận.
- Chỉ bổ sung message propagation hoặc validation guard còn thiếu, sau đó chạy attachment authorization/draft-save regression và UI lint/build.

### Task 4: Phân loại lại nhóm AI và lifecycle đã có implementation

- Chạy lại AI review persistence, classification apply/stale source, grounded handoff, Smart Assign và required-reason lifecycle.
- Map kết quả vào `UAT-AI-005/008/009/010/014/015` và `UAT-LIFE-014`; không dùng SQLite để tuyên bố BTP acceptance.
- Case cần identity/provider/role fixture live vẫn chưa PASS cho đến khi có deployed evidence.

### Task 5: Verify và chuẩn bị source gate

- Chạy positive, negative, boundary, authorization, persistence/reload và falsification checks tập trung.
- Chạy CAP compile, UI lint/build nếu có đổi UI, secret/rule/depth checks, AI DevKit lint và `git diff --check`.
- Review exact diff về scope và Ponytail; dừng trước merge, deploy, Jira status mutation và workbook chính thức.
