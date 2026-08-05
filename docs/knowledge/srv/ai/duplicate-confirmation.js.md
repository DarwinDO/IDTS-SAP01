# `srv/ai/duplicate-confirmation.js`

## IDTS-122 guard

Duplicate confirmation cannot create a link from a Closed source Bug. Existing links remain readable; the source Bug must be Reopened before confirmation.

## English

This module implements IDTS-95. `confirmDuplicateSuggestion(suggestionID, candidateBugID)` creates one `DuplicateLink` only after a Tester or PM has explicitly accepted a current `DUPLICATE_DETECTION` suggestion.

Execution flow:

1. Validate the two UUID parameters and resolve the authenticated IDTS user.
2. Require a Tester or PM coordinator role.
3. Load the persisted suggestion in the CAP request transaction.
4. Require feature type `DUPLICATE_DETECTION`, review state `ACCEPTED`, and a non-expired suggestion.
5. Verify both Bugs exist and reject a self-link.
6. Parse the stored safe payload and require the requested candidate to be present there.
7. Resolve the relation type only from that stored candidate and verify its catalog row is active.
8. Reject an existing link in either direction.
9. Insert and return one `DuplicateLink` in the same request transaction.

The link ID is deterministic for the unordered pair of Bug IDs. It supplements the existing pair lookup so two concurrent confirmations target the same database key instead of creating two random rows. A constraint conflict is returned as HTTP 409.

Primary owner: SangVN. Backup: DonHV. Flow: accepted Similar Bugs suggestion to confirmed duplicate relationship. Start debugging at `confirmDuplicateSuggestion()`, then inspect the actor, suggestion state/type, stored `candidates`, active relation type, existing pair query, and insert.

Linked files: `srv/ai/duplicate-detection.js`, `srv/ai/review.js`, `srv/ai/index.js`, `srv/service.cds`, `srv/service.js`, `db/schema.cds`, and `scripts/qa/test-idts95-confirm-duplicate-suggestion.js`.

Safe-editing rules:

- Never accept candidate details or relation type from the client.
- Never create a link from a pending, rejected, ignored, expired, or wrong-feature suggestion.
- Never change either Bug's status, assignee, ownership, or lifecycle.
- Preserve reverse-direction duplicate detection and transaction rollback.
- Keep the action restricted to Tester/PM unless the business rule changes explicitly.

## Vietnamese

Module này triển khai IDTS-95. `confirmDuplicateSuggestion(suggestionID, candidateBugID)` chỉ tạo một `DuplicateLink` sau khi Tester hoặc PM đã Accept rõ ràng một suggestion `DUPLICATE_DETECTION` còn hiệu lực.

Luồng thực thi:

1. Kiểm tra hai UUID và resolve user IDTS đã xác thực.
2. Chỉ cho role điều phối Tester hoặc PM.
3. Đọc suggestion đã persist trong transaction của CAP request.
4. Bắt buộc feature `DUPLICATE_DETECTION`, state `ACCEPTED` và suggestion chưa hết hạn.
5. Kiểm tra hai Bug tồn tại và chặn self-link.
6. Parse safe payload đã lưu và bắt buộc candidate được yêu cầu phải có trong payload đó.
7. Chỉ lấy relation type từ candidate đã lưu và kiểm tra catalog còn active.
8. Chặn link đã tồn tại theo cả hai chiều.
9. Insert và trả về một `DuplicateLink` trong cùng transaction request.

ID của link được tạo deterministic từ cặp Bug ID không phân biệt thứ tự. Cách này bổ sung cho bước tìm pair đã có: hai request đồng thời sẽ ghi cùng database key thay vì hai ID ngẫu nhiên. Conflict constraint được trả về HTTP 409.

Owner chính: SangVN. Backup: DonHV. Flow: Similar Bugs suggestion đã Accept thành quan hệ duplicate được xác nhận. Khi debug, bắt đầu tại `confirmDuplicateSuggestion()`, sau đó xem actor, state/type của suggestion, `candidates` đã lưu, relation type active, query pair đã có và lệnh insert.

File liên quan: `srv/ai/duplicate-detection.js`, `srv/ai/review.js`, `srv/ai/index.js`, `srv/service.cds`, `srv/service.js`, `db/schema.cds` và `scripts/qa/test-idts95-confirm-duplicate-suggestion.js`.

Quy tắc sửa an toàn:

- Không bao giờ nhận candidate detail hoặc relation type từ client.
- Không tạo link từ suggestion pending, rejected, ignored, hết hạn hoặc sai feature.
- Không đổi status, assignee, ownership hoặc lifecycle của hai Bug.
- Giữ kiểm tra duplicate theo chiều ngược và rollback transaction.
- Giữ action chỉ cho Tester/PM trừ khi business rule được thay đổi rõ ràng.
