# Debug Lab: QA, Release Evidence, and a Safe Failure

## English

### Goal

Learn to prove a claim instead of declaring “works on my machine.” A QA PASS needs positive, negative, edge/boundary, role/authorization, persistence/reload, failure/recovery, and UI/UX evidence when applicable.

### Safe setup and checkpoints

Work in a fresh worktree. Start with `npm run qa:depth:self-test`, then run the focused script for the changed flow. For browser work, use the shared browser harness and record only sanitized screenshots/checkpoints in `docs/pm/evidence/<jira-key>/`; raw temporary output may remain under `scripts/qa/uat-evidence/`.

### Expected execution order

1. Read the Jira acceptance criteria and identify the expected success and expected denial paths.
2. Run programmatic tests before browser testing. A 400/401/403 can be a correct negative test; an unexpected 5xx, raw error, console error, or SAP error dialog is a failure.
3. Use the browser to verify what a real role sees, save/reload behavior, keyboard/focus basics, and a deliberately inconvenient action such as double click, refresh, or invalid input.
4. Store selected evidence, reference it in the PR body, and complete the Ownership Knowledge Gate.
5. Only after all required checks PASS may the PR be reviewed/merged and Jira transitioned to Done.

### Failure exercise and teach-back

Make a copy of a valid PR body and change `Score: 100%` to `Score: 60%`; `qa:depth:self-test`/the validator must fail. Explain why this protects learning evidence but cannot technically stop an administrator from manually changing a Jira status, and what the team must do operationally in that case.

## Vietnamese

### Mục tiêu

Học cách chứng minh claim thay vì nói “máy em chạy”. QA PASS cần evidence positive, negative, edge/boundary, role/authorization, persistence/reload, failure/recovery và UI/UX khi phù hợp.

### Chuẩn bị và checkpoint

Làm trong fresh worktree. Bắt đầu bằng `npm run qa:depth:self-test`, rồi chạy focused script cho flow đã đổi. Với browser, dùng shared browser harness và chỉ lưu screenshot/checkpoint đã sanitize vào `docs/pm/evidence/<jira-key>/`; output thô tạm thời có thể nằm tại `scripts/qa/uat-evidence/`.

### Thứ tự chạy mong đợi

1. Đọc Jira acceptance criteria và xác định success path cùng denial path mong đợi.
2. Chạy programmatic test trước browser. 400/401/403 có thể là negative test đúng; 5xx, raw error, console error hoặc SAP error dialog không mong đợi là failure.
3. Dùng browser để kiểm tra role thật nhìn thấy gì, save/reload, keyboard/focus cơ bản và một hành động gây khó như double click, refresh hoặc input sai.
4. Lưu evidence được chọn, dẫn nó trong PR body và hoàn tất Ownership Knowledge Gate.
5. Chỉ khi mọi check yêu cầu PASS mới review/merge PR và chuyển Jira sang Done.

### Bài lỗi và giải thích lại

Copy valid PR body rồi đổi `Score: 100%` thành `Score: 60%`; validator phải fail. Giải thích vì sao điều này bảo vệ learning evidence nhưng không thể kỹ thuật chặn administrator tự đổi Jira status, và team cần làm gì về mặt quy trình nếu điều đó xảy ra.
