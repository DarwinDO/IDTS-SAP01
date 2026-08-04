# DatDT Knowledge Gate Progress

## English

Effective date: 2026-07-13 (Asia/Bangkok). Initial historical debt: 0.

| Date | Flow | Base | Inactive-day | Additional flow | Score | Critical | Debug | Teach-back | Result | Evidence |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 2026-07-24 | AI assistance | 3 | 4 | 0 | 7/7 (100%) | PASS | PASS | PASS | PASS | Traced `ClassificationReview.js` -> `service.cds` -> `service.js` -> `classification-suggestion.js` -> provider/fallback -> `audit.js`; confirmed suggestion-only behavior, safe failure, CAP authorization/validation, forbidden-data boundary, and `AiSuggestions` audit insert without direct `Bugs` mutation. |
| 2026-08-02 | AI assistance | 3 | 4 | 0 | 7/7 after guided corrections (100% final retest) | PASS | PASS | PASS | PASS | DatDT correctly identified the minimum-allowlist/no-secret provider boundary, backend-owned OData/audit flow, post-request side-effect checks, suggestion-only behavior and safe provider-unavailable handling. Two initial Y/N mistakes (direct UI audit write and timeout negative-case outcome) were corrected after hints. Controlled debug: provider timeout after call, `Bugs` unchanged, no invalid audit row, structured `unavailable` response and manual workflow continuation. Teach-back: AI is optional advisory support and never replaces the user's final decision. |

## Vietnamese

Ngày hiệu lực: 13/07/2026 (Asia/Bangkok). Nợ lịch sử ban đầu: 0.

| Ngày | Flow | Cơ bản | Ngày không code | Flow thêm | Điểm | Critical | Debug | Teach-back | Kết quả | Evidence |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 2026-07-24 | AI assistance | 3 | 4 | 0 | 7/7 (100%) | PASS | PASS | PASS | PASS | Đã trace `ClassificationReview.js` -> `service.cds` -> `service.js` -> `classification-suggestion.js` -> provider/fallback -> `audit.js`; xác nhận AI chỉ gợi ý, lỗi provider an toàn, CAP tự kiểm tra quyền/dữ liệu, không gửi dữ liệu bị cấm, và chỉ ghi audit `AiSuggestions` thay vì tự sửa `Bugs`. |
| 2026-08-02 | AI assistance | 3 | 4 | 0 | 7/7 sau khi sửa theo gợi ý (100% ở retest cuối) | PASS | PASS | PASS | PASS | DatDT xác định đúng payload AI phải tối thiểu/không chứa secret, UI phải đi qua OData/CAP và backend sở hữu audit flow, cần kiểm tra side effect sau request, AI chỉ gợi ý và provider unavailable phải fail an toàn. Hai câu Y/N ban đầu sai (UI ghi audit trực tiếp và kết quả negative case timeout) đã được sửa sau gợi ý. Debug có kiểm soát: provider timeout sau call, `Bugs` không đổi, không có audit row sai, backend trả `unavailable` có cấu trúc và workflow thủ công tiếp tục. Teach-back: AI là hỗ trợ tùy chọn, không thay quyết định cuối của người dùng. |
