# DatDT Knowledge Gate Progress

## 2026-08-08 Assignment capacity + Dashboard monitoring

- Questions: 7/7 Y/N recognition (100%).
- Critical: PASS.
- Debug: PASS — assigning another Bug to a Developer already owning 3 non-Closed Bugs must be rejected without changing the target Bug or creating assignment History/Notification.
- Teach-back: PASS — DatDT explained that the backend is the final authority for business decisions and clear authorization enforcement.
- Result: PASS.
- Vietnamese evidence: DatDT xác nhận backend là nơi quyết định cuối cùng cho nghiệp vụ/phân quyền; hard cap phải được enforce ở CAP, không chỉ khóa nút UI.

## English

Effective date: 2026-07-13 (Asia/Bangkok). Initial historical debt: 0.

| Date | Flow | Base | Inactive-day | Additional flow | Score | Critical | Debug | Teach-back | Result | Evidence |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 2026-07-24 | AI assistance | 3 | 4 | 0 | 7/7 (100%) | PASS | PASS | PASS | PASS | Traced `ClassificationReview.js` -> `service.cds` -> `service.js` -> `classification-suggestion.js` -> provider/fallback -> `audit.js`; confirmed suggestion-only behavior, safe failure, CAP authorization/validation, forbidden-data boundary, and `AiSuggestions` audit insert without direct `Bugs` mutation. |
| 2026-08-02 | AI assistance | 3 | 4 | 0 | 7/7 after guided corrections (100% final retest) | PASS | PASS | PASS | PASS | DatDT correctly identified the minimum-allowlist/no-secret provider boundary, backend-owned OData/audit flow, post-request side-effect checks, suggestion-only behavior and safe provider-unavailable handling. Two initial Y/N mistakes (direct UI audit write and timeout negative-case outcome) were corrected after hints. Controlled debug: provider timeout after call, `Bugs` unchanged, no invalid audit row, structured `unavailable` response and manual workflow continuation. Teach-back: AI is optional advisory support and never replaces the user's final decision. |
| 2026-08-06 | Dashboard / UI bootstrap | 3 | 1 | 0 | 5/5 Y/N recognition (100%) | PASS | NOT ASSESSED | NOT ASSESSED | INCOMPLETE | DatDT affirmed the dashboard/read-model, History paging, derived overdue field, Network-first diagnosis, and UI mapping/formatter statements. The sixth Y/N answer approved the English-only UI5 bootstrap fix plan. This is supervised-task evidence only, not a Knowledge Gate PASS, because no controlled debug execution or own-words teach-back was completed. |
| 2026-08-06 | Assignment / collaboration additional flow | 3 | 0 | 2 | 6/6 after one critical retest (100% final) | PASS | PASS | PASS | PASS | DatDT correctly traced CAP-owned assignment, explicit Comment/History behavior, required side-effect readback, no random AI assignment, and the Resubmit red/green evidence. After a hint and source/breakpoint anchor, DatDT passed the equivalent critical retest: attachment metadata remains in CAP persistence while binary goes through the storage adapter to S3/object storage, with `prepareAttachmentWrite` as a safety breakpoint. Controlled debug evidence: pre-fix IDTS-89 found one automatic Comment; post-fix found zero Comments while retaining the History reason. Teach-back correctly stated that Resubmit is an audit note and must not synthesize a Comment. |

## 2026-08-07 Authentication Gate

English: DatDT passed 5/5 (100%). Critical, controlled debug and teach-back
results are PASS. DatDT distinguished the OData contract from its handler,
rejected HTTP-only verification, identified safe login breakpoints and token
forwarding, and required safe denial without secret or stack disclosure. The
debug answer confirmed that XSUAA logout clears browser state and navigates to
AppRouter `/do/logout` instead of calling custom logout. DatDT explained that a
separate signed-out page keeps the flow understandable and avoids unreliable
immediate re-entry to SAP login.

Vietnamese: DatDT đạt 5/5 (100%). Critical, debug có kiểm soát và teach-back
đều PASS. DatDT phân biệt đúng contract OData và handler, không chấp nhận chỉ
kiểm tra HTTP 200, xác định breakpoint login an toàn và nơi gắn bearer token,
đồng thời yêu cầu từ chối truy cập mà không lộ secret hoặc stack. Câu debug xác
nhận logout XSUAA phải xóa browser state rồi điều hướng tới AppRouter
`/do/logout`, không gọi custom logout. DatDT giải thích rằng trang signed-out
riêng giúp luồng dễ hiểu và tránh việc chuyển ngay về SAP login gây hành vi
không ổn định.

## Vietnamese

Ngày hiệu lực: 13/07/2026 (Asia/Bangkok). Nợ lịch sử ban đầu: 0.

| Ngày | Flow | Cơ bản | Ngày không code | Flow thêm | Điểm | Critical | Debug | Teach-back | Kết quả | Evidence |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 2026-07-24 | AI assistance | 3 | 4 | 0 | 7/7 (100%) | PASS | PASS | PASS | PASS | Đã trace `ClassificationReview.js` -> `service.cds` -> `service.js` -> `classification-suggestion.js` -> provider/fallback -> `audit.js`; xác nhận AI chỉ gợi ý, lỗi provider an toàn, CAP tự kiểm tra quyền/dữ liệu, không gửi dữ liệu bị cấm, và chỉ ghi audit `AiSuggestions` thay vì tự sửa `Bugs`. |
| 2026-08-02 | AI assistance | 3 | 4 | 0 | 7/7 sau khi sửa theo gợi ý (100% ở retest cuối) | PASS | PASS | PASS | PASS | DatDT xác định đúng payload AI phải tối thiểu/không chứa secret, UI phải đi qua OData/CAP và backend sở hữu audit flow, cần kiểm tra side effect sau request, AI chỉ gợi ý và provider unavailable phải fail an toàn. Hai câu Y/N ban đầu sai (UI ghi audit trực tiếp và kết quả negative case timeout) đã được sửa sau gợi ý. Debug có kiểm soát: provider timeout sau call, `Bugs` không đổi, không có audit row sai, backend trả `unavailable` có cấu trúc và workflow thủ công tiếp tục. Teach-back: AI là hỗ trợ tùy chọn, không thay quyết định cuối của người dùng. |
| 2026-08-06 | Dashboard / UI bootstrap | 3 | 1 | 0 | Nhận diện Y/N 5/5 (100%) | PASS | CHƯA ĐÁNH GIÁ | CHƯA ĐÁNH GIÁ | CHƯA HOÀN TẤT | DatDT xác nhận đúng các statement về dashboard/read model, paging History, field overdue được derive, chẩn đoán Network trước và phân biệt lỗi mapping/formatter UI. Câu Y/N thứ sáu duyệt kế hoạch sửa UI5 English-only. Evidence này chỉ dùng cho task có giám sát, không phải Knowledge Gate PASS vì chưa có debug execution và teach-back bằng lời của DatDT. |
| 2026-08-06 | Assignment / collaboration flow bổ sung | 3 | 0 | 2 | 6/6 sau một critical retest (100% cuối) | PASS | PASS | PASS | PASS | DatDT trace đúng assignment do CAP kiểm soát, Comment/History tách biệt, cần readback side effect, AI không được assign ngẫu nhiên và bằng chứng red/green của Resubmit. Sau hint cùng source/breakpoint anchor, DatDT pass critical retest tương đương: metadata attachment nằm trong CAP persistence, binary đi qua storage adapter tới S3/object storage và `prepareAttachmentWrite` là breakpoint an toàn. Debug có kiểm soát: trước fix IDTS-89 thấy một automatic Comment; sau fix có 0 Comment nhưng History reason vẫn còn. Teach-back đúng rằng Resubmit là audit note và không được tự tạo Comment. |
