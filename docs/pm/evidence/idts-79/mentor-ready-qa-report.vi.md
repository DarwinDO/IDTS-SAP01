# IDTS-79 — Báo cáo acceptance Shared QA trước mentor review

**Thời điểm:** 11/07/2026

**Môi trường:** Render Shared QA (bản `dev` đã được deploy thủ công và đạt trạng thái `live`)
**Nguyên tắc dữ liệu:** Không reset database; không chạy `cds deploy` lên Shared QA; không lưu token, mật khẩu, API key, database URL hoặc email đầy đủ vào evidence.

## Kết luận ngắn

Nền tảng Shared QA hiện hoạt động cho các kiểm tra trọng tâm về auth và bốn capability AI. Vòng kiểm tra mới đã chứng minh rằng các action AI chỉ hỗ trợ người dùng xem xét, không tự thay đổi bug workflow hoặc assignee.

Tuy nhiên, **chưa được gọi là full sign-off cho toàn bộ hệ thống**. Các phần cần human sign-off trước mentor review vẫn là: lifecycle thủ công theo từng role, upload/download S3 thực tế sau restart, và xác nhận email thật trong inbox của từng role. Đây là các bước cần có người dùng thật xác nhận hoặc sẽ tạo dữ liệu UAT mới trên Shared QA.

## Baseline môi trường

| Hạng mục | Kết quả | Evidence |
| --- | --- | --- |
| Render deploy | PASS — service `live` trên commit `dev` hiện tại | Render deploy record đã kiểm tra trong session IDTS-79 |
| Auth metadata | PASS — HTTP 200 | `render-ai-smoke.json` |
| OData anonymous | PASS — HTTP 401 là hành vi mong đợi | `render-ai-smoke.json` |
| Đăng nhập Shared QA | PASS — private credential không bị ghi vào evidence | `render-ai-smoke.json`, `render-ai-dialog-smoke.json` |

## Kết quả kiểm thử mới

| Capability | Positive / workflow | Negative / security | Kết quả |
| --- | --- | --- | --- |
| Custom auth | Login hợp lệ, token/session, OData authenticated | Sai password, inactive/revoked session, lỗi nội bộ được sanitize | PASS — `qa:auth:programmatic` 28/28 và Render API smoke |
| AI Similar Bugs | Mở action và dialog trên Object Page | Không lộ SQL/credential/stack; dialog đóng an toàn; không tự mutate | PASS — Render browser smoke mới |
| AI Classification | Mở dialog review trên Object Page | Nội dung user-facing; không tự đổi classification/workflow | PASS — Render browser smoke mới |
| AI Handoff Summary | Mở dialog review trong History | Không lộ diagnostic; không tự đổi workflow | PASS — Render browser smoke mới |
| Smart Assign explanation | Mở Smart Assign, có candidate manual review, Cancel | AI disabled/unavailable fallback an toàn; không auto-assign | PASS — `idts72-ai-browser.json` |
| AI API / audit | Classification, duplicate, handoff, assignment explanation và audit rows | Anonymous bị chặn; prompt-injection-like text được sanitize; không mutate bug | PASS — Render API smoke 25/25 |
| Email outbox module | Brevo API contract và SMTP delivery behavior | Provider failure thành `FAILED`, workflow không rollback | PASS local integration; live inbox confirmation còn chờ |
| QA Depth Gate | Các section mandatory, N/A, browser-harness classifier | Thiếu section / N/A trần bị fail | PASS 6/6 |
| Secret scan | Scan repo/evidence chọn lọc | Không phát hiện key-like pattern | PASS |

## Evidence chọn lọc trong repo

- `render-ai-smoke.json`: 25/25 check API trên Render, không lộ secret và không mutate bug.
- `idts72-ai-browser.json` + `idts72_smart_assign_ai_review.png`: Smart Assign review-only browser smoke.
- `render-ai-dialog-smoke.json`: 32 checks cho Similar Bugs, Classification Suggestions và Handoff Summary trên UI Render.
- `render-similar-bugs-dialog.png`, `render-classification-dialog.png`, `render-handoff-dialog.png`: screenshot dialog Render hiện tại.
- `render-object-page-action-discovery.png`: minh chứng ba action hiện diện trên Object Page.
- `idts79-shared-human-acceptance.json`: kết quả role lifecycle, attachment hash và cleanup flow đã redacted.
- `mentor-qa-lifecycle-closed-before-restart.png`, `mentor-qa-attachment-deleted.png`: screenshot Shared QA của record controlled trước restart và sau delete attachment.
- `idts79-inbox-confirmation.vi.md`: kết quả Gmail Inbox đã redacted, kèm finding deep-link `IDTS-81`.

**Việc DonHV cần tự làm sau khi review evidence:** chọn các file phù hợp trong thư mục này và đính kèm thủ công vào Jira `IDTS-79`; không upload token, database URL, log thô hoặc thông tin cá nhân đầy đủ.

## Acceptance thực tế đã chạy lại trên Shared QA

| Hạng mục | Kết quả mới | Evidence an toàn |
| --- | --- | --- |
| PM / Developer / Tester lifecycle | PASS — ba phiên đăng nhập đúng role; chạy thực tế Assign → In Review → In Progress → Need More Information → Resubmit → Resolve → Retest → Close → Reopen → Close. Record demo cuối ở trạng thái `Closed`. | `idts79-shared-human-acceptance.json`, `mentor-qa-lifecycle-closed-before-restart.png` |
| S3 attachment + PostgreSQL persistence | PASS — upload file text trong draft, activate, tải xuống và so SHA-256; restart đúng service Render; tải lại sau restart vẫn khớp hash. Sau đó delete attachment và đọc content trả trạng thái không còn tồn tại như mong đợi. | `idts79-shared-human-acceptance.json`, `idts79-attachment-delete-browser-smoke.json`, `mentor-qa-attachment-deleted.png` |
| Email delivery/outbox | PASS — tất cả delivery mới của record UAT đều là `SENT`, có provider message ID, không rollback lifecycle. | `idts79-email-delivery-api.json` |
| Inbox/spam thật | PASS một mailbox đã kết nối — nhiều mail mới của record UAT xuất hiện trong **Inbox**; không chỉ có dữ liệu outbox. | Gmail connector read-only; chỉ lưu kết luận redacted, không lưu recipient/message ID/redirect URL vào repo. |
| Email deep link | **FAIL / product defect** — email mới vẫn có fallback link dùng route UI cũ. Flow email vẫn gửi thành công nhưng click có thể đi tới `Cannot GET`. Đã tạo [IDTS-81](https://dutassociation.atlassian.net/browse/IDTS-81), liên kết với IDTS-79 và IDTS-50. | Nội dung inbox đã được kiểm tra read-only; không copy raw email hoặc URL redirect vào evidence. |

**Kết luận cập nhật:** lifecycle, S3 persistence và việc mail thật vào Inbox đã có fresh evidence. Tuy nhiên **không được gọi là full acceptance PASS** cho email UX/deep link cho đến khi `IDTS-81` được fix và một email mới được click xác nhận đến đúng Object Page. Một record UAT partial từ lần assertion đầu còn tồn tại vì active Bug DELETE được chặn đúng theo policy; không dùng SQL trực tiếp để xóa nó.

## Known gaps / rủi ro minh bạch

1. **AI provider trên Render hiện trả safe fallback (`AI_DISABLED`) trong smoke.** Điều này chứng minh UI/API fallback an toàn và human-review-only, nhưng chưa phải evidence của output từ provider AI thật. Không được nói quá thành “AI model production đã trả kết quả thật”.
2. **Console baseline ngoài SAP Launchpad:** có các 404 đã biết liên quan Component-preload/i18n/flexibility. Chúng không tạo HTTP 5xx, không làm lỗi flow đã kiểm tra, nhưng nên được giữ là follow-up UI runtime; không đưa 404 mới vào allow-list một cách mù quáng.
3. **IDTS-45 vẫn mở:** cần quyết định backup/migration PostgreSQL trước deadline Render; không block demo hôm nay nhưng phải nêu minh bạch nếu mentor hỏi deployment continuity.
4. **Không dùng Chrome-extension evidence cho vòng này:** extension điều khiển Chrome timeout khi lấy DOM Object Page lớn. Đây là tooling issue; cùng flow đã được kiểm lại bằng Playwright headless trên Render.
5. **IDTS-80 đang mở:** local auth QA có một diagnostic in token tạm ra terminal. Token đó không nằm trong evidence/Jira, nhưng test harness phải được redact trước khi chia sẻ raw local log.

## Bước human sign-off còn lại trước 14:00

| Người | Việc cần làm | Evidence tối thiểu |
| --- | --- | --- |
| SangVN (Tester) | Create + validation + attachment-before-save; comment sau save; resubmit/retest/close/reopen; xác nhận một email inbox/spam | 1 screenshot an toàn + short note PASS/FAIL trên IDTS-79 |
| DatDT (Developer) | In Review/In Progress; request more information; resolve; kiểm tra comment/evidence | short note role sign-off + email inbox/spam nếu có |
| NhanT (PM / falsification) | Dashboard/monitoring, history pagination, assignment/reassign, refresh/double-click/back-forward/invalid fields, responsive UI | checklist PASS/FAIL, lỗi UX phải có Jira bug riêng |
| DonHV | Chọn một bug demo sạch, kiểm tra PostgreSQL + S3 persistence sau restart/redeploy cùng commit; dọn UAT records không cần giữ | bug number/hash chỉ trong private note, screenshot đã redacted nếu đưa Jira |

## Điều kiện báo mentor

Có thể demo ngay theo luồng: **login → dashboard → create + attachment → assign/smart assign → request information → resubmit → history + AI review actions → email → close/reopen**.

Khi báo cáo, dùng câu chính xác: “Các capability backend, auth và AI review UI đã có evidence mới trên Render; phần provider AI thật đang ở safe fallback, còn S3/email inbox/lifecycle role sign-off là acceptance manual đang hoàn tất.”
