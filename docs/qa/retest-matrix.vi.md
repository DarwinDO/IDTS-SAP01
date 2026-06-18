# Ma trận Retest IDTS

Last updated: 2026-06-18
Owner: DonHV

## Mục Đích

Đây là nguồn lập kế hoạch retest hiện tại cho Sprint 02 sau khi backend được siết lại, comment/attachment đã hoàn thiện, và phần audit/UI đã được refine thêm.

Tài liệu này dùng để dẫn hướng cho:

- kiểm thử backend local,
- kiểm thử HTTP cho attachment/comment,
- chuẩn bị walkthrough demo với mentor,
- cập nhật ngược lại các file SAP490 `Unit_Test`, `Functional_Test`, và test report chính thức.

## Các Lớp Kiểm Thử

| Lớp | Phạm vi | Cách chạy ưu tiên |
| --- | --- | --- |
| Backend programmatic | status transition, validation rule, derived field, side effect của history/notification | `node scripts/qa/test-idts6-programmatic.js` |
| HTTP integration | upload/download attachment draft, action comment, persistence sau activate | `powershell -ExecutionPolicy Bypass -File scripts/qa/test-comments-attachments.ps1` |
| Fiori UI thủ công | create page flow, value help, action visibility, table rendering, chất lượng UX | Browser QA trên local stack; cần rerun sau mỗi lần chỉnh FE/UI |
| Static UI audit | review annotation/layout về discoverability và UX consistency | đọc code local trong `annotations.cds`, `manifest.json`, `service.cds` |

## Ma trận Scenario

| Scenario | Persona | Phạm vi | Verify bằng | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| SC-01 | Tester | Tạo bug không có assignee | programmatic + manual UI | lưu bug thành công với `PENDING_ASSIGNMENT` |
| SC-02 | Tester | Tạo bug có assignee | programmatic + manual UI | lưu bug thành công với `ASSIGNED` |
| SC-03 | Tester | Upload attachment draft | HTTP + manual UI | attachment thấy trước khi save, còn sau activate, download được |
| SC-04 | Tester / PM / Developer | Add comment | HTTP + manual UI | có comment row với author name dễ đọc và có history |
| SC-05 | Tester / PM | Assign Developer | programmatic + manual UI | assignee đổi, status thành `ASSIGNED`, có notification |
| SC-06 | Developer được assign | Mark In Review | programmatic + manual UI | status thành `IN_REVIEW` |
| SC-07 | Developer được assign | Start Progress | programmatic + manual UI | status thành `IN_PROGRESS` |
| SC-08 | Developer được assign / Tester | Request More Information và Resubmit | programmatic + manual UI | nhánh request-info chuyển sang `NEED_MORE_INFORMATION`; nhánh resubmit đưa bug về lại `ASSIGNED` kèm comment/notification follow-up |
| SC-09 | Developer được assign | Reject Bug | programmatic + manual UI | có reason: `REJECTED`; không có reason: reject |
| SC-10 | Tester / PM | Move to Pending Assignment | programmatic + manual UI | clear assignee và status thành `PENDING_ASSIGNMENT` |
| SC-11 | Developer được assign | Resolve Bug | programmatic + manual UI | có note: `RESOLVED`; không có note: reject |
| SC-12 | Tester / PM | Send to Retest hoặc Close | programmatic + manual UI | có thể chuyển bug sang `RETEST_REQUIRED` hoặc đóng trực tiếp từ `RESOLVED` |
| SC-13 | Tester / PM | Reopen Bug | programmatic + manual UI | có reason: `REOPENED`; không có reason: reject |
| SC-14 | Bất kỳ role hợp lệ | Verify audit và notification | programmatic + HTTP + manual UI | grouped history và notification dễ đọc tồn tại cho event quan trọng |

## Các Test Case Chi Tiết

| Case ID | Scenario | Điều kiện trước | Cách test | Kết quả mong đợi |
| --- | --- | --- | --- | --- |
| SC-01a | Tạo bug không có assignee | cặp component/category hợp lệ, không chọn assignee | backend + UI | status lưu xuống là `PENDING_ASSIGNMENT` |
| SC-01b | Tạo bug thiếu title | đã điền các trường bắt buộc khác | backend + UI | request bị reject với lỗi validation |
| SC-02a | Tạo bug có assignee | assignee hợp lệ map đúng classification | backend + UI | status lưu xuống là `ASSIGNED` |
| SC-03a | Tạo metadata attachment draft | đã có draft bug | HTTP + UI | có row attachment trong draft |
| SC-03b | Upload binary attachment | đã có metadata attachment | HTTP + UI | upload stream thành công |
| SC-03c | Activate draft có attachment | draft đã có file upload | HTTP + UI | attachment vẫn còn sau activate |
| SC-03d | Download attachment active | bug active đã có attachment | HTTP | bytes tải về khớp với nội dung upload |
| SC-04a | Add comment | đã có bug active | HTTP + UI | xuất hiện row comment |
| SC-04b | Verify history của comment | comment vừa được thêm | HTTP | history có entry comment dễ đọc |
| SC-05a | Assign developer | bug đang `PENDING_ASSIGNMENT` hoặc ở context cho phép assign | backend + UI | lưu assignee, đổi status, có notification |
| SC-05b | Assign thiếu parameter | gọi action không có assignee ID | backend | request bị reject |
| SC-06a | Mark In Review | bug đang `ASSIGNED` | backend + UI | status thành `IN_REVIEW` |
| SC-07a | Start Progress | bug đang `IN_REVIEW` | backend + UI | status thành `IN_PROGRESS` |
| SC-08a | Request more info có reason | bug ở nhánh developer hợp lệ | backend + UI | status thành `NEED_MORE_INFORMATION` |
| SC-08b | Request more info không reason | giống trên | backend | request bị reject |
| SC-08c | Resubmit về developer | bug đang `NEED_MORE_INFORMATION` | backend + UI | status quay lại `ASSIGNED` |
| SC-08d | Verify side effect của resubmit | vừa chạy resubmit xong | backend + UI | tồn tại cả comment follow-up và notification cho developer |
| SC-09a | Reject có reason | bug ở nhánh developer hợp lệ | backend + UI | status thành `REJECTED` |
| SC-09b | Reject không reason | giống trên | backend | request bị reject |
| SC-10a | Move to pending assignment | bug đang `REJECTED` | backend + UI | status thành `PENDING_ASSIGNMENT`, assignee bị xóa |
| SC-11a | Resolve có note | bug đang `IN_PROGRESS` | backend + UI | status thành `RESOLVED` |
| SC-11b | Resolve không note | giống trên | backend | request bị reject |
| SC-12a | Send to retest | bug đang `RESOLVED` | backend + UI | status thành `RETEST_REQUIRED` |
| SC-12b | Close bug | bug đang `RESOLVED` | backend + UI | status thành `CLOSED` |
| SC-13a | Reopen có reason | bug ở nhánh close/retest | backend + UI | status thành `REOPENED` |
| SC-13b | Reopen không reason | giống trên | backend | request bị reject |
| SC-14a | Verify grouped history | đã chạy create, assign, comment, attachment, lifecycle action | HTTP + UI | history hiển thị actor/field/value dễ đọc và read-only |
| SC-14b | Verify notifications | đã chạy nhánh assign / reject / request-info | HTTP + UI | notification hiển thị recipient và event name dạng nghiệp vụ |

## Checklist Manual UI/UX

Các mục này cần retest bằng browser, không thể chỉ dựa vào backend verification.

| ID | Mục kiểm tra | Mong đợi |
| --- | --- | --- |
| UX-01 | Thứ tự section ở create page | Bug Summary -> Classification and Assignment -> Reproduction and Test Context -> Evidence / Attachments |
| UX-02 | Dấu hiệu trường bắt buộc | mọi field bắt buộc trên create đều có tín hiệu rõ |
| UX-03 | Assignee value help | các dòng hiển thị dễ đọc và đúng classification |
| UX-04 | Discoverability của attachment | upload control nhìn thấy rõ trong create flow |
| UX-05 | Discoverability của comment | người dùng dễ tìm được cách thêm comment |
| UX-06 | Độ gọn của header action | chỉ hiện các action hợp lệ theo role/status |
| UX-07 | Khóa read-only | các field hệ thống không edit được ở edit mode thông thường |
| UX-08 | Độ dễ đọc của history | actor, field, old/new value, reason phải đọc được như nghiệp vụ |
| UX-09 | Độ dễ đọc của notification | recipient và event label phải dễ hiểu |

## Trạng Thái UX Hiện Tại

| Gap | Trạng thái | Bước tiếp theo khuyến nghị |
| --- | --- | --- |
| Dialog parameter của Assign Developer | Fixed (`IDTS-9`) | chỉ giữ như regression check; runtime hiện tại đã hiển thị tên developer được chọn (`DatDT`) |
| `Add Comment` ngay trong section Comments | Fixed (`IDTS-11`) | chỉ giữ như regression check; không cần action thêm nếu CTA vẫn hiển thị đúng |

## Ghi Chú Lần Chạy Browser Gần Nhất

Ngày chạy: 2026-06-18 tại `http://localhost:4004/idts.bugmanagementui/index.html?sap-ui-xx-viewCache=false`

- PASS: List Report tải được và thấy row demo sau khi bấm `Go`.
- PASS: Trang Create Bug `NewPage` mở đúng với thứ tự section mong muốn.
- PASS: Việc chọn classification bằng value help hợp lệ hoạt động đúng.
- PASS: Upload file thật trong lúc create vẫn còn hiển thị sau khi save ở active Object Page.
- PASS: Add Comment persist thành công và hiển thị author dễ đọc.
- PASS: Comments section đã có local `Add Comment` CTA gần bảng và mở đúng action dialog.
- PASS: Việc tách action theo role cho Tester, Developer, PM đang đúng.
- PASS: Action `Start Progress` đổi được state ở backend và Object Page refresh ngay để hiển thị status/action mới.
- PASS: Browser probe riêng cho create/classification không còn tái hiện warning `componentCategory_ID` sau khi bỏ side effect derive dư thừa.
- PASS: Ô parameter của Assign Developer hiện đã hiển thị tên developer được chọn thay vì UUID trên runtime đã verify.

## Rule Sync Sang SAP490

Sau khi chạy retest xong:

1. cập nhật lại matrix này nếu flow thay đổi,
2. điền `Unit_Test` với evidence đã chạy,
3. điền workbook test report SAP490 chính thức với pass/fail thực tế,
4. thêm defect mới vào `Test_And_Fix_Bug`,
5. cập nhật PM status và handover docs.
