# Paste-Ready Prompt — User Administration and My Notifications

## English

You are continuing the IDTS-SAP01 project for DonHV. First read:

1. AGENTS.md and docs/project-context.md.
2. docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md.
3. docs/pm/current-status.md, docs/pm/task-board.md, docs/pm/status/donhv.md,
   and the relevant WP7/WP8 roadmap.

Treat the handoff as the authoritative summary of only merged-and-live User
Administration and My Notifications work through 2026-08-29. Refresh origin/dev before
any task; do not assume its recorded SHA is still current.

Important live baseline:

- User Administration is complete through Gate 6.5: controlled access onboarding,
  Active Users, lifecycle, identity link, Developer Responsibilities, Business
  Catalogs, Operations/Audit, workload/Bug drill-down, safe cross-app navigation and
  eligible access-change delivery/email.
- My Notifications N1–N5-Lite is live: caller-only inbox, native bell/badge UI,
  event coverage including selected mentions/material escalation, immediate prompt
  email for eligible events, hourly recovery/discovery, SLA reminders, weekday Digest
  and read-only Digest diagnostics in User Administration Operations.

Do not replay historical email, activate a new scheduler policy, create synthetic
business data, change BTP/user/role/provider state, or write to Google Drive without
a fresh explicit DonHV approval. Repository Markdown is canonical; the Google Drive
folder named GSU26SAP01 is only a later collaboration/review destination.

Ask DonHV for one bounded next outcome if it has not already been stated. Then plan
and execute it with a fresh baseline, dedicated worktree/branch, tests and evidence.

## Tiếng Việt

Bạn đang tiếp tục dự án IDTS-SAP01 cho DonHV. Trước hết hãy đọc:

1. AGENTS.md và docs/project-context.md.
2. docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md.
3. docs/pm/current-status.md, docs/pm/task-board.md, docs/pm/status/donhv.md
   và roadmap WP7/WP8 liên quan.

Xem handoff là bản tóm tắt authority của chỉ những phần đã merge và live thuộc User
Administration và My Notifications đến 2026-08-29. Phải refresh origin/dev trước mọi
task; không được giả định SHA ghi trong handoff luôn mới.

Baseline live quan trọng:

- User Administration đã hoàn tất đến Gate 6.5: onboarding access có kiểm soát,
  Active Users, lifecycle, identity link, Developer Responsibilities, Business
  Catalogs, Operations/Audit, workload/Bug drill-down, safe cross-app navigation và
  delivery/email cho access change đủ điều kiện.
- My Notifications N1–N5-Lite đã live: inbox caller-only, UI bell/badge native,
  event coverage gồm selected mention/material escalation, prompt email immediate cho
  event đủ điều kiện, recovery/discovery hourly, SLA reminder, Digest ngày thường và
  Digest diagnostic read-only trong User Administration Operations.

Không replay email lịch sử, không bật policy scheduler mới, không tạo business data
giả, không đổi BTP/user/role/provider và không ghi Google Drive nếu chưa có approval
mới rõ ràng của DonHV. Markdown trong repo là canonical; thư mục Google Drive tên
GSU26SAP01 chỉ là đích collaboration/review ở bước sau.

Nếu DonHV chưa nêu rõ, hãy hỏi một kết quả kế tiếp có phạm vi hẹp. Sau đó mới lập kế
hoạch và thực hiện với baseline mới, worktree/branch riêng, test và evidence.
