# Debug Lab: Create Bug and Lifecycle

## English

### Goal

Trace a bug from a Fiori create draft to an active Bug, then through one controlled status transition. This shows why authorization and validation live in CAP, not only in the screen.

### Safe setup and breakpoints

Log in as Tester or PM. In `srv/service.js`, break at the `NEW` handler for `Bugs.drafts` (line 64), `prepareDraftNew`, `prepareDraftPatch`, `handleDraftSave`, and `transitionBug` in `srv/bug-service/actions.js`. Use a harmless title beginning with `LEARN-` and delete it afterwards.

### Expected execution order

1. The Fiori create flow calls draft `NEW`; `enforceBugCreatePermission` rejects Developer before a draft exists.
2. `prepareDraftNew` records the current actor for the draft.
3. Every field change causes a draft PATCH; `prepareDraftPatch` and `prepareBugWrite` validate catalog values and trim unsafe/blank input.
4. Save calls `SAVE` for `Bugs.drafts`; `handleDraftSave` activates the draft inside CAP's request transaction.
5. `recordCreateSideEffects` writes history/notification records only after a successful create.
6. A lifecycle action, for example `requestMoreInformation`, enters `transitionBug`. It validates the actor, source status, destination status, required reason, and action owner before recording history and notification side effects.

### Inspect

Compare `req.user`, `req.data`, the draft ID, and `status_code` before and after Save. Confirm that a Developer's direct OData draft request receives 403, rather than relying on a hidden UI button. For a rejected invalid catalog code, prove no bad value appears after reload.

### Failure exercise and teach-back

Try whitespace-only input or an inactive catalog value. Explain which handler rejects it and why the UI must display the backend's field-specific 400 message. Then narrate the state and data changes for `Assigned -> Need More Information -> Assigned`.

## Vietnamese

### Mục tiêu

Lần theo một bug từ Fiori create draft thành Bug active, rồi đi qua một status transition có kiểm soát. Lab này cho thấy authorization và validation phải nằm ở CAP, không chỉ nằm ở màn hình.

### Chuẩn bị và breakpoint

Login bằng Tester hoặc PM. Trong `srv/service.js`, đặt breakpoint tại handler `NEW` của `Bugs.drafts` (dòng 64), `prepareDraftNew`, `prepareDraftPatch`, `handleDraftSave`, và `transitionBug` trong `srv/bug-service/actions.js`. Dùng title vô hại bắt đầu bằng `LEARN-`, sau đó xóa bug.

### Thứ tự chạy mong đợi

1. Fiori create flow gọi draft `NEW`; `enforceBugCreatePermission` chặn Developer trước khi draft được tạo.
2. `prepareDraftNew` ghi actor hiện tại cho draft.
3. Mỗi lần đổi field sẽ có draft PATCH; `prepareDraftPatch` và `prepareBugWrite` kiểm tra catalog và loại input blank/không an toàn.
4. Save gọi `SAVE` cho `Bugs.drafts`; `handleDraftSave` activate draft trong transaction của request CAP.
5. `recordCreateSideEffects` chỉ ghi history/notification sau create thành công.
6. Lifecycle action như `requestMoreInformation` vào `transitionBug`. Hàm kiểm tra actor, status nguồn/đích, reason bắt buộc và action owner trước khi ghi history và notification.

### Cần quan sát

So sánh `req.user`, `req.data`, draft ID và `status_code` trước/sau Save. Xác nhận direct OData draft request của Developer nhận 403, không chỉ là nút UI bị ẩn. Với catalog code sai bị reject, reload để chứng minh dữ liệu sai không được lưu.

### Bài lỗi và giải thích lại

Thử input chỉ có khoảng trắng hoặc catalog value inactive. Giải thích handler nào reject và vì sao UI phải hiển thị lỗi 400 theo đúng field từ backend. Sau đó kể lại state và dữ liệu đổi thế nào ở `Assigned -> Need More Information -> Assigned`.
