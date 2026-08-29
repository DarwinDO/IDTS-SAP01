# User Administration and My Notifications Live Handoff Plan

## English

**Goal:** publish one reliable new-session handoff package for the User
Administration and My Notifications functionality that is already merged and live.

**Frozen authoring baseline:** `origin/dev` and this branch point to
`1eb2d40050fcc19df5b84c1b41075e35485b46d3` at plan creation. The finished handoff
will instruct future work to refresh that baseline before making any change.

### Step 1 — Build the evidence inventory

Read the WP8 and WP7 roadmaps, selected rollout/acceptance evidence, task board,
current status, and DonHV status. Record only capability statements supported by both
merge and live/acceptance evidence. Label planned/source-only or deferred material as
non-claims.

**Verification:** each summary item has at least one linked evidence path; no private
value is copied.

### Step 2 — Write the canonical handoff

Create `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md` in
English-first/Vietnamese-matching form. Include read order, User Administration,
My Notifications, evidence map, deferrals, guardrails, Drive boundary, and next
session checklist.

**Verification:** inspect headings, relative links, bilingual equivalence, and exact
claims against the inventory.

### Step 3 — Write the paste-ready prompt

Create `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live-prompt.md`.
Keep it short enough to paste into a fresh chat and require reading the canonical
handoff before any implementation or Drive operation.

**Verification:** the prompt contains no stale action authorization and no copied
credential/Drive ID/private endpoint.

### Step 4 — Register the durable handoff

Add surgical bilingual pointers to the two relevant work-package roadmaps and one
short DonHV session-status entry. Update `current-status.md` only if the added
handoff is useful at project-level handover scope; do not rewrite historical entries
or change task-board status because WP7/WP8 are already closed.

**Verification:** changed pointers resolve to the new canonical handoff and no work
package state is falsely changed.

### Step 5 — Documentation verification and handoff boundary

Run the smallest documentation checks: Markdown link/path scan, secret scan,
`git diff --check`, `npx ai-devkit@latest lint --json` if available for project
artifacts, and exact diff review. Commit only the handoff/docs delta, then report the
branch, commit, checks and untouched runtime boundaries. A Draft PR is a separate
decision unless explicitly requested after the documentation review.

## Tiếng Việt

**Mục tiêu:** xuất bản một gói handoff đáng tin cậy cho session mới, chỉ về User
Administration và My Notifications đã merge và live.

**Baseline lúc viết plan:** `origin/dev` và branch này cùng trỏ đến
`1eb2d40050fcc19df5b84c1b41075e35485b46d3`. Handoff hoàn chỉnh sẽ yêu cầu công việc
tương lai refresh baseline này trước khi thay đổi bất kỳ thứ gì.

### Bước 1 — Lập inventory evidence

Đọc roadmap WP8/WP7, evidence rollout/acceptance đã chọn, task board, current status
và DonHV status. Chỉ ghi capability có cả bằng chứng merge lẫn live/acceptance. Nội
dung planned/source-only hoặc đã defer được gắn nhãn non-claim.

**Kiểm tra:** mỗi summary item có ít nhất một evidence path được link; không copy giá
trị private.

### Bước 2 — Viết canonical handoff

Tạo `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live.md` theo dạng
tiếng Anh trước/tiếng Việt tương ứng. Bao gồm thứ tự đọc, User Administration, My
Notifications, evidence map, defer, guardrail, boundary Drive và checklist session
mới.

**Kiểm tra:** xem heading, relative link, tính tương đương song ngữ và đối chiếu claim
chính xác với inventory.

### Bước 3 — Viết prompt có thể dán ngay

Tạo `docs/pm/handoffs/2026-08-29-user-admin-my-notifications-live-prompt.md`.
Giữ prompt đủ ngắn để dán vào chat mới và bắt buộc đọc canonical handoff trước mọi
implementation hoặc thao tác Drive.

**Kiểm tra:** prompt không chứa quyền hành động đã cũ và không copy credential/Drive
ID/endpoint private.

### Bước 4 — Ghi nhận handoff bền vững

Thêm pointer song ngữ nhỏ vào hai roadmap work package liên quan và một entry status
ngắn của DonHV. Chỉ update `current-status.md` nếu handoff mới hữu ích ở mức dự án;
không rewrite lịch sử hay thay task-board status vì WP7/WP8 đã đóng.

**Kiểm tra:** pointer đã đổi trỏ đúng canonical handoff mới và không làm sai trạng
thái work package.

### Bước 5 — Verify tài liệu và boundary bàn giao

Chạy các check tài liệu nhỏ nhất: scan link/path Markdown, secret scan,
`git diff --check`, `npx ai-devkit@latest lint --json` nếu áp dụng cho artifact dự án,
và review exact diff. Chỉ commit delta handoff/docs rồi báo branch, commit, check và
runtime boundary không bị chạm. Draft PR là quyết định riêng trừ khi được yêu cầu rõ
sau khi review tài liệu.
