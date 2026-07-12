# IDTS Ownership and Debug Learning

## English

This folder is the team's practical learning layer. It does not replace source code, tests, or the knowledge mirrors. It tells each member what they own, how an IDTS flow runs, where to stop the debugger, and how learning evidence is recorded.

Start with `ownership-map.md`, then the Debug Lab for the flow you are working on. Record each task-start Knowledge Gate in your own file under `progress/`.

Debug Labs: `debug-labs/authentication-session.md`, `debug-labs/create-and-lifecycle.md`, `debug-labs/assignment-comments-attachments.md`, `debug-labs/dashboard-history.md`, `debug-labs/notifications-email.md`, `debug-labs/ai-assistance.md`, and `debug-labs/qa-release-evidence.md`. Member learning pages are under `members/`.

The 72-file source-comment rollout is listed in `runtime-comment-retrofit.md`; it is deliberately split by owner so the explanation remains a learning exercise, not a copied answer.

### First-day procedure from 2026-07-13

1. For an initial ownership area without beginner comments/mirrors yet, the agent first prepares a comment-only Learning Material Bootstrap PR. The member is not assessed before this material exists.
2. Read `ownership-map.md`, the merged/bootstrap material, and the relevant Debug Lab before changing behavior.
3. Run `npm run learning:gate -- <member> <flow> 2026-07-13 [last-activity|-] [additional]`.
4. Answer before asking for hints; then complete one real or controlled debugger exercise and a teach-back.
5. Record the assessed result in `progress/<member>.md`. Only a human/agent assessment can write `PASS`.
6. On `FAIL`, learn and code with supervision, then retest. Do not merge a behavior-changing PR or transition Jira to Done before the retest passes.

## Vietnamese

Folder này là lớp học thực hành của team. Nó không thay source code, test hoặc knowledge mirror. Nó nói rõ mỗi member sở hữu gì, một flow IDTS chạy thế nào, nên dừng debugger ở đâu và lưu bằng chứng học tập ra sao.

Hãy bắt đầu từ `ownership-map.md`, sau đó đọc Debug Lab của flow đang làm. Mỗi Knowledge Gate đầu task phải được ghi vào file riêng của member trong `progress/`.

Các Debug Lab: `debug-labs/authentication-session.md`, `debug-labs/create-and-lifecycle.md`, `debug-labs/assignment-comments-attachments.md`, `debug-labs/dashboard-history.md`, `debug-labs/notifications-email.md`, `debug-labs/ai-assistance.md` và `debug-labs/qa-release-evidence.md`. Learning page của từng member nằm trong `members/`.

Đợt source comment 72 file nằm trong `runtime-comment-retrofit.md`; cố ý chia theo owner để phần giải thích vẫn là bài học, không phải câu trả lời copy sẵn.

### Quy trình ngày đầu tiên từ 13/07/2026

1. Nếu một ownership area chưa có comment/mirror beginner-first, agent phải tạo trước một PR Learning Material Bootstrap chỉ có comment/mirror. Không đánh giá member khi tài liệu đó chưa tồn tại.
2. Đọc `ownership-map.md`, material đã merge/đang bootstrap và Debug Lab liên quan trước khi sửa behavior.
3. Chạy `npm run learning:gate -- <member> <flow> 2026-07-13 [last-activity|-] [additional]`.
4. Tự trả lời trước khi xin gợi ý; sau đó làm một debugger exercise thật hoặc có kiểm soát và teach-back.
5. Ghi kết quả đã được đánh giá vào `progress/<member>.md`. Chỉ đánh giá của người/agent mới được ghi `PASS`.
6. Nếu `FAIL`, member vẫn được học và code dưới supervision, sau đó retest. Không merge PR có đổi behavior hoặc chuyển Jira Done trước khi retest pass.
