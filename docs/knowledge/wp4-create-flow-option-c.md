# WP4 Create Flow Option C - Guided Custom Page

## English

### Purpose

Option C is a guided three-step bug creation page implemented as a custom SAPUI5 view inside the Fiori Elements application:

1. Classification.
2. Bug details.
3. Reproduction and results.

The standard Fiori Elements `Create` action remains available. The List Report also exposes `Guided Create Bug`, so Option B and Option C can be compared without replacing each other.

### Files

| File | Responsibility |
| --- | --- |
| `webapp/manifest.json` | Registers the custom route, FPM page target, List Report action, controller extension, and UI5 libraries. |
| `webapp/ext/controller/BugsListExtension.controller.js` | Opens the guided page from the List Report toolbar. |
| `webapp/ext/view/GuidedCreateBug.view.xml` | Defines the wizard, forms, fields, footer, and responsive layout. |
| `webapp/ext/view/GuidedCreateBug.controller.js` | Manages local form state, dependent dropdowns, validation, draft creation, activation, and navigation. |
| `webapp/i18n/i18n*.properties` | Stores labels and messages instead of hardcoding user-facing text. |

### Controller Logic

- `PageController` keeps the page compatible with the Fiori Flexible Programming Model.
- The named `form` JSON model stores temporary input independently from the OData entity.
- `onSAPModuleChange` clears stale component/category values and filters `SAPModuleComponents`.
- `onApplicationComponentChange` clears the old category and filters `ComponentCategories`.
- `sap.ui.model.Sorter` instances are used in JavaScript bindings because OData V4 requires real sorter objects.
- `_validateRequiredFields` distinguishes `sap.m.ComboBox` from text controls. This avoids reading `sap.m.Input#getSelectedKey`, which exists for suggestions but is not the text value.
- `_payload` sends only business fields accepted by `BugService.Bugs`. The backend derives status, reporter, component-category mapping, assignment state, and next processor.
- `onCreate` follows CAP draft choreography:
  1. `POST /Bugs` through `ListBinding#create`.
  2. Execute `BugService.draftActivate(...)` on the draft context.
  3. Create an active entity context and navigate to the standard Bug Object Page.

### UX Decisions

- Priority and Severity do not default to the first value. The reporter must choose them explicitly.
- Environment remains optional.
- Application Component is available without selecting a SAP Module, but selecting a module narrows the component list.
- Defect Category remains disabled until an Application Component is selected.
- The Create button is enabled after the wizard reaches its review state, and required fields are validated again before persistence.
- Desktop and mobile layouts have no horizontal overflow.

### Verification

- Guided action visible and enabled on the List Report.
- Module to component and component to category filtering verified in the browser.
- Required-field validation verified.
- Full draft create and activation verified.
- Created bug navigated to the active Object Page with `PENDING_ASSIGNMENT` and PM as next processor.
- Test records created during browser verification were deleted afterward.

### Known Limitation

The local Fiori development runtime logs a non-blocking `DraftMessages` request against the static `/guided-create` route because the FPM target has `contextPath: /Bugs`. Removing `contextPath` replaces this with metadata-context warnings. The page, dependent value lists, draft activation, and navigation still work. This is a prototype risk and another reason Option B remains the safer MVP default.

### Option B Versus Option C

| Criterion | Option B: Standard NewPage | Option C: Guided Custom Page |
| --- | --- | --- |
| Fiori standard behavior | Strongest | Partial |
| Custom code ownership | Low | High |
| Guided onboarding | Limited | Strong |
| Dependent classification | Annotation/service driven | Explicit controller logic |
| Upgrade and regression risk | Lower | Higher |
| Recommended use | MVP production baseline | Prototype or future enhancement after usability evidence |

## Tiếng Việt

### Mục đích

Option C là trang tạo bug theo wizard ba bước, được xây bằng custom SAPUI5 view bên trong ứng dụng Fiori Elements:

1. Phân loại.
2. Chi tiết bug.
3. Các bước tái hiện và kết quả.

Action `Create` chuẩn của Fiori Elements vẫn được giữ lại. List Report có thêm `Guided Create Bug`, nhờ đó có thể so sánh Option B và Option C mà không thay thế lẫn nhau.

### Các file

| File | Trách nhiệm |
| --- | --- |
| `webapp/manifest.json` | Đăng ký route, FPM page target, List Report action, controller extension và thư viện UI5. |
| `webapp/ext/controller/BugsListExtension.controller.js` | Mở guided page từ toolbar của List Report. |
| `webapp/ext/view/GuidedCreateBug.view.xml` | Khai báo wizard, form, field, footer và responsive layout. |
| `webapp/ext/view/GuidedCreateBug.controller.js` | Quản lý dữ liệu form tạm, dropdown phụ thuộc, validation, tạo draft, activate và navigation. |
| `webapp/i18n/i18n*.properties` | Lưu label và message, tránh hardcode text hiển thị. |

### Logic controller

- `PageController` giữ custom page tương thích với Fiori Flexible Programming Model.
- JSON model có tên `form` lưu dữ liệu nhập tạm, tách khỏi OData entity.
- `onSAPModuleChange` xóa component/category cũ và lọc `SAPModuleComponents`.
- `onApplicationComponentChange` xóa category cũ và lọc `ComponentCategories`.
- Binding JavaScript dùng instance thật của `sap.ui.model.Sorter` vì OData V4 không chấp nhận sorter object thường trong trường hợp này.
- `_validateRequiredFields` phân biệt `sap.m.ComboBox` với text control. Việc này tránh đọc nhầm `sap.m.Input#getSelectedKey`, là API cho suggestion chứ không phải giá trị text.
- `_payload` chỉ gửi các business field mà `BugService.Bugs` nhận. Backend tự suy ra status, reporter, component-category mapping, assignment state và next processor.
- `onCreate` đi theo CAP draft choreography:
  1. Tạo draft bằng `ListBinding#create`.
  2. Gọi bound action `BugService.draftActivate(...)`.
  3. Tạo context active và điều hướng sang Bug Object Page chuẩn.

### Quyết định UX

- Priority và Severity không tự lấy giá trị đầu tiên; reporter phải chọn rõ ràng.
- Environment vẫn là field tùy chọn.
- Có thể chọn Application Component khi chưa chọn SAP Module; nếu chọn module thì danh sách component được thu hẹp.
- Defect Category bị disable cho tới khi chọn Application Component.
- Nút Create được enable khi wizard tới bước review, sau đó required field vẫn được validate lại trước khi lưu.
- Layout desktop và mobile không bị overflow ngang.

### Kết quả kiểm tra

- Guided action hiển thị và enabled trên List Report.
- Đã kiểm tra lọc Module -> Component và Component -> Category trên browser.
- Đã kiểm tra validation field bắt buộc.
- Đã kiểm tra đầy đủ create draft và activate.
- Bug được tạo đã điều hướng tới active Object Page với trạng thái `PENDING_ASSIGNMENT` và PM là next processor.
- Các record test sinh ra trong quá trình browser verification đã được xóa sau khi kiểm tra.

### Hạn chế đã biết

Fiori development runtime local ghi một console error không chặn do FPM thử đọc `DraftMessages` tại route tĩnh `/guided-create` khi target có `contextPath: /Bugs`. Nếu bỏ `contextPath`, framework lại ghi metadata-context warning. Page, dependent value list, draft activation và navigation vẫn hoạt động. Đây là rủi ro của prototype và là một lý do Option B vẫn phù hợp hơn làm MVP mặc định.

### So sánh Option B và Option C

| Tiêu chí | Option B: Standard NewPage | Option C: Guided Custom Page |
| --- | --- | --- |
| Mức độ theo chuẩn Fiori | Cao nhất | Một phần |
| Lượng custom code phải bảo trì | Thấp | Cao |
| Hướng dẫn người dùng | Hạn chế | Tốt |
| Phân loại phụ thuộc | Dựa vào annotation/service | Controller xử lý trực tiếp |
| Rủi ro upgrade và regression | Thấp hơn | Cao hơn |
| Khuyến nghị | Baseline MVP | Prototype hoặc enhancement sau khi có bằng chứng usability |
