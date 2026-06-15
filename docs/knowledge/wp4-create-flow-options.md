# WP4 Create Flow Options

## English

### Why the modal appeared

The List Report already used `creationMode.name = NewPage`. However, the service metadata also exposed `Capabilities.InsertRestrictions.RequiredProperties`. SAP Fiori elements treated those properties as initial create parameters and opened a prefill dialog before navigating to the draft Object Page.

### Option B: Standard Fiori Elements Create Page

Option B keeps the standard draft-enabled Fiori Elements flow:

1. The user selects Create.
2. Fiori Elements creates an empty draft.
3. The app navigates directly to the Bugs Object Page in create mode.
4. Mandatory fields show an asterisk through `Common.FieldControl/Mandatory`.
5. CAP validates mandatory values when the draft is activated.

`RequiredProperties` and `FieldControl/Mandatory` have different responsibilities:

| Annotation | Purpose |
| --- | --- |
| `Capabilities.InsertRestrictions.RequiredProperties` | Declares values required as part of the initial insert/create request and can cause initial-value collection. |
| `Common.FieldControl/Mandatory` | Marks a form field as mandatory and lets Fiori display the required indicator and validation target. |

Option B is the preferred MVP direction because it uses the existing Object Page, draft handling, annotations, value helps, and CAP validation without adding custom UI5 code.

### Option C: Custom Guided Create Page

Option C uses a custom Fiori page through the Flexible Programming Model. It can provide custom grouping, step-by-step guidance, progressive disclosure, and a tailored summary before submission.

Its tradeoffs are additional XML/controller code, custom validation and navigation responsibilities, more testing, and a higher maintenance cost than the standard Object Page.

## Tiếng Việt

### Vì sao modal xuất hiện

List Report đã dùng `creationMode.name = NewPage`. Tuy nhiên metadata của service còn expose `Capabilities.InsertRestrictions.RequiredProperties`. SAP Fiori elements xem các property này là tham số khởi tạo và mở prefill dialog trước khi navigate tới draft Object Page.

### Option B: Create Page chuẩn của Fiori Elements

Option B giữ flow draft chuẩn của Fiori Elements:

1. Người dùng chọn Create.
2. Fiori Elements tạo draft rỗng.
3. App navigate thẳng tới Bugs Object Page ở create mode.
4. Field bắt buộc hiển thị dấu sao thông qua `Common.FieldControl/Mandatory`.
5. CAP validate dữ liệu bắt buộc khi draft được activate.

`RequiredProperties` và `FieldControl/Mandatory` có trách nhiệm khác nhau:

| Annotation | Mục đích |
| --- | --- |
| `Capabilities.InsertRestrictions.RequiredProperties` | Khai báo giá trị cần có trong request insert/create ban đầu và có thể làm phát sinh bước thu thập giá trị khởi tạo. |
| `Common.FieldControl/Mandatory` | Đánh dấu field trên form là bắt buộc để Fiori hiển thị dấu bắt buộc và target validation. |

Option B là hướng ưu tiên cho MVP vì tái sử dụng Object Page, draft handling, annotation, value help và CAP validation hiện có mà không thêm custom UI5 code.

### Option C: Custom Guided Create Page

Option C dùng custom Fiori page thông qua Flexible Programming Model. Hướng này cho phép tùy chỉnh grouping, hướng dẫn theo bước, progressive disclosure và màn hình summary trước khi submit.

Đổi lại, team phải duy trì thêm XML/controller code, custom validation, navigation, nhiều test hơn và chi phí bảo trì cao hơn Object Page chuẩn.
