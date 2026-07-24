# `srv/ai/review.js`

## English

This module implements the IDTS-91 human-review boundary for persisted `AiSuggestions`. `acceptAiSuggestion`, `rejectAiSuggestion`, and `ignoreAiSuggestion` all call one guarded function that resolves the authenticated IDTS user, verifies the linked Bug is readable, requires a current `PENDING` suggestion, and conditionally updates only the review state, reviewer, and review time.

Primary owner: DonHV. Backup: DatDT. Flow: AI suggestion review. Start debugging at `reviewAiSuggestion()`, then inspect the resolved actor, suggestion state, linked Bug, and affected-row count from the conditional update.

Linked files:

- `srv/service.cds` declares the three OData actions and safe result type.
- `srv/service.js` registers the handlers.
- `srv/ai/audit.js` owns feature/review state codes and safe audit persistence.
- `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js` and `ClassificationReview.js` invoke these actions.
- `scripts/qa/test-idts91-ai-review-actions.js` verifies authorization, persistence, conflict handling, rollback, and no Bug mutation.

Safe editing impact:

- Never take reviewer identity from the client payload.
- Never mutate `Bugs`, assignment, workflow status, or `DuplicateLinks` in review actions.
- Keep the conditional `PENDING` update so concurrent or repeated decisions return 409.
- Keep errors generic; do not expose provider payloads, tokens, emails, endpoints, or database details.

## Tiếng Việt

Module này triển khai ranh giới human review của IDTS-91 cho `AiSuggestions` đã lưu. Ba action `acceptAiSuggestion`, `rejectAiSuggestion` và `ignoreAiSuggestion` đều gọi một hàm có guard chung: resolve user IDTS đã xác thực, kiểm Bug liên kết còn đọc được, yêu cầu suggestion hiện vẫn `PENDING`, rồi chỉ cập nhật trạng thái review, reviewer và thời gian review.

Owner chính: DonHV. Backup: DatDT. Flow: review AI suggestion. Khi debug, bắt đầu tại `reviewAiSuggestion()`, sau đó xem actor đã resolve, trạng thái suggestion, Bug liên kết và số row bị tác động bởi conditional update.

File liên kết:

- `srv/service.cds` khai báo ba OData action và result type an toàn.
- `srv/service.js` đăng ký handler.
- `srv/ai/audit.js` quản lý code feature/review và persistence audit an toàn.
- `DuplicateReview.js` và `ClassificationReview.js` gọi các action này.
- `scripts/qa/test-idts91-ai-review-actions.js` kiểm quyền, persistence, conflict, rollback và không sửa Bug.

Ảnh hưởng khi sửa:

- Không lấy reviewer identity từ payload client.
- Không sửa `Bugs`, assignment, workflow status hoặc `DuplicateLinks` trong review action.
- Giữ conditional update trên `PENDING` để quyết định đồng thời/lặp lại nhận 409.
- Giữ lỗi chung, không lộ provider payload, token, email, endpoint hoặc chi tiết database.
