# IDTS-100 — SAP490 Mentor-Ready Acceptance and Drive Synchronization

## English

- Owner: DonHV
- Status: In Progress — conditionally ready for mentor review
- Due date: 2026-07-25
- Jira: `IDTS-100`

### Scope completed

- Curated documentation changes were merged first and local `dev` was fast-forwarded to `origin/dev` without destructive Git commands.
- A fresh worktree was created from the synchronized baseline.
- Current SAP490 sources, generated artifacts, diagrams, test pack, PM matrices, and Final Project Report draft were regenerated and verified.
- Shared QA lifecycle, AI fallback/no-mutation, PostgreSQL persistence, S3 attachment persistence, and Brevo delivery evidence were refreshed.
- Google Drive artifacts were updated in place with ID, parent, MIME type, and permissions preserved.

### Current truth and remaining work

- 27 planned cases: 21 Passed, 6 UAT Prepared.
- Human Tester, Developer, PM, and DonHV sign-off is still required for the six UAT cases.
- OpenAI live provider is disabled and is not accepted as a live integration.
- Mentor approval/signature fields remain blank.
- `IDTS-45` remains open for the PostgreSQL migration/upgrade decision.

### Evidence

- `docs/pm/evidence/idts-100/shared-qa-acceptance-summary-20260724.md`
- `docs/pm/evidence/idts-100/drive-sync-verification-20260724.md`
- `docs/pm/evidence/idts-100/visual-review-20260724.md`
- `docs/pm/evidence/idts-100/integration-evidence-index.md`
- `docs/pm/evidence/idts-100/test-pack-evidence-remediation-20260724.md`

### Test pack evidence remediation

- Functional Test EN/VI v0.3 now uses the official result block without an unused blank block before generated runs.
- Unit Test EN/VI v0.4 now has one complete Evidence row per case and correct internal links.
- Test Report EN/VI v0.4 now uses valid internal links and template styling for non-linked text.
- Integration Evidence Index v0.1 is available in the Drive Integration Test folder with public read-by-link access.
- The repository validator now rejects broken/empty links, cosmetic blue text, placeholder baselines, command-only evidence, and template-font drift.
- Six human UAT cases and mentor approval remain pending; this remediation does not change those statuses.

## Vietnamese

- Owner: DonHV
- Trạng thái: In Progress — đủ điều kiện có giới hạn để mentor review
- Hạn: 25/07/2026
- Jira: `IDTS-100`

### Phạm vi đã hoàn thành

- Đã merge có chọn lọc nhánh tài liệu trước, sau đó fast-forward local `dev` theo `origin/dev` mà không dùng lệnh Git phá dữ liệu.
- Đã tạo worktree sạch từ baseline mới.
- Đã regenerate và verify nguồn SAP490, artifact sinh ra, diagram, test pack, PM matrix và bản nháp Final Project Report.
- Đã làm mới evidence Shared QA cho lifecycle, AI fallback/không mutate workflow, PostgreSQL persistence, S3 attachment persistence và Brevo delivery.
- Đã update artifact Google Drive tại chỗ, giữ nguyên ID, parent, MIME type và quyền truy cập.

### Sự thật hiện tại và phần còn lại

- 27 test case dự kiến: 21 Passed, 6 UAT Prepared.
- Sáu UAT vẫn cần con người thực hiện và sign-off theo vai trò Tester, Developer, PM và DonHV.
- OpenAI live provider đang tắt và không được tính là tích hợp live đã nghiệm thu.
- Trường mentor approval/signature vẫn để trống.
- `IDTS-45` vẫn mở để chốt hướng migrate/upgrade PostgreSQL.

### Evidence

- `docs/pm/evidence/idts-100/shared-qa-acceptance-summary-20260724.md`
- `docs/pm/evidence/idts-100/drive-sync-verification-20260724.md`
- `docs/pm/evidence/idts-100/visual-review-20260724.md`
- `docs/pm/evidence/idts-100/integration-evidence-index.md`
- `docs/pm/evidence/idts-100/test-pack-evidence-remediation-20260724.md`

### Sửa Test Pack và evidence

- Functional Test EN/VI v0.3 dùng đúng block kết quả chính thức, không còn khoảng trống giả trước dữ liệu run.
- Unit Test EN/VI v0.4 có một dòng Evidence đầy đủ cho từng case và link nội bộ đúng.
- Test Report EN/VI v0.4 có link nội bộ hợp lệ; text không có link giữ style template.
- Integration Evidence Index v0.1 đã nằm trong folder Integration Test trên Drive và có quyền đọc bằng link.
- Validator đã chặn link hỏng/ô đích trống, text xanh giả, baseline placeholder, evidence chỉ có command và font lệch template.
- Sáu UAT con người và mentor approval vẫn đang chờ; remediation này không thay đổi trạng thái đó.
