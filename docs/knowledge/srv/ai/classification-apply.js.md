# `srv/ai/classification-apply.js`

## IDTS-122 guard

Applying a classification suggestion is rejected for a Closed Bug before field updates. The user must Reopen and still pass the existing role, freshness, review-state, and catalog validation.

## English

This module implements IDTS-93. `applyClassificationSuggestion(suggestionID)` is the only AI-specific path that may change Bug classification, and only after an authorized Tester or PM has accepted a current classification suggestion.

Execution flow:

1. Resolve the authenticated actor and require the Tester/PM coordinator role.
2. Read the suggestion and linked Bug in the request transaction.
3. Require feature `CLASSIFICATION`, review state `ACCEPTED`, and a non-expired audit row.
4. Parse the sanitized payload, reject unsupported/duplicate fields, and resolve every proposed value against active catalogs.
5. Re-derive the active Component Category and reuse Bug code-list, permission, and assignee validation.
6. Return idempotently if the allowed target values are already present.
7. Compare the saved source-classification snapshot with the current Bug and conditionally update only classification fields.
8. Write one grouped history event in the same transaction.

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: accepted classification application. Start debugging at `applyClassificationSuggestion()`, then inspect actor role, audit state, parsed payload, grounded patch, source snapshot comparison, affected-row count, and grouped history write.

Linked files: `srv/ai/classification-suggestion.js`, `srv/ai/review.js`, `srv/bug-service/bug-write.js`, `srv/bug-service/history.js`, `srv/service.cds`, `srv/service.js`, and `scripts/qa/test-idts93-apply-classification.js`.

Safe editing impact:

- Keep the field allow-list limited to SAP Module, Application Component, Defect Category, Priority, Severity, and the derived Component Category.
- Do not change status, assignee, reporter, next processor, comments, attachments, or duplicate links.
- Do not trust the old provider result at apply time; validate the current catalog again.
- Preserve stale-write protection, idempotency, and same-transaction history/rollback.

## Tiếng Việt

Module này triển khai IDTS-93. `applyClassificationSuggestion(suggestionID)` là đường AI duy nhất được phép đổi classification của Bug, và chỉ chạy sau khi Tester hoặc PM có quyền đã Accept một classification suggestion còn hiệu lực.

Flow thực thi:

1. Resolve actor đã xác thực và yêu cầu role điều phối Tester/PM.
2. Đọc suggestion và Bug liên kết trong transaction của request.
3. Yêu cầu feature `CLASSIFICATION`, trạng thái `ACCEPTED` và audit chưa hết hạn.
4. Parse payload đã sanitize, chặn field không hỗ trợ/trùng lặp và resolve mọi giá trị qua catalog active.
5. Derive lại Component Category active và tái sử dụng validation code-list, quyền ghi Bug và assignee.
6. Trả kết quả idempotent nếu các giá trị đích đã có sẵn.
7. So snapshot classification lúc tạo suggestion với Bug hiện tại và chỉ update có điều kiện các field classification.
8. Ghi một history event được nhóm trong cùng transaction.

Owner chính: DonHV. Backup: DatDT/NhanT. Flow: áp dụng classification đã Accept. Khi debug, bắt đầu tại `applyClassificationSuggestion()`, rồi xem role actor, trạng thái audit, payload đã parse, patch đã grounded, so sánh snapshot, số row update và grouped history.

File liên kết: `srv/ai/classification-suggestion.js`, `srv/ai/review.js`, `srv/bug-service/bug-write.js`, `srv/bug-service/history.js`, `srv/service.cds`, `srv/service.js` và `scripts/qa/test-idts93-apply-classification.js`.

Ảnh hưởng khi sửa:

- Giữ allow-list chỉ gồm SAP Module, Application Component, Defect Category, Priority, Severity và Component Category được derive.
- Không đổi status, assignee, reporter, next processor, comment, attachment hoặc duplicate link.
- Không tin lại provider output cũ khi apply; phải kiểm catalog hiện tại.
- Giữ stale-write protection, idempotency và history/rollback cùng transaction.
