# WP4 Fiori Elements Code Explanation

## English

This note explains the current Fiori Elements implementation for IDTS before WP2/WP3/WP4 is extended further.

### What Fiori Elements Means Here

Fiori Elements is a metadata-driven SAP UI approach. Instead of manually coding every page with XML views and controllers, the app reads OData V4 metadata and annotations from the CAP service. SAPUI5 then generates standard enterprise screens such as List Report, Object Page, and Create Page.

In this project, the main UI is:

- List Report: a table-based entry screen for bug records.
- Object Page: a detail page for one bug.
- Create Dialog: the standard Fiori Elements OData V4 dialog flow for creating a new bug in the List Report.

This is why the current implementation mostly changes CDS annotations and `manifest.json`, not custom UI5 controllers.

### `app/bug-management-ui/annotations.cds`

This file tells Fiori Elements how to render the `BugService.Bugs` OData entity.

Important annotation terms:

- `UI.HeaderInfo`: defines the title and subtitle of a bug object. IDTS uses `bugNumber` as the object title and `title` as the description.
- `UI.SelectionFields`: defines fields shown in the List Report filter bar, such as status, priority, severity, SAP module, application component, defect category, assignee, next processor role, and due date.
- `UI.LineItem`: defines the List Report table columns.
- `UI.Facets`: defines Object Page sections and subsections.
- `UI.FieldGroup`: groups fields into forms inside Object Page sections.
- `UI.MultiLineText`: tells Fiori Elements to render long text fields as multi-line text areas.
- `Common.Label`: gives user-facing labels to fields and associations.

The current Object Page is organized around IDTS business work:

- Bug details.
- Classification.
- Reproduction and results.
- Assignment and follow-up.
- Rejected follow-up.
- Planning.
- Comments.
- Attachments.
- History.
- Notifications.

### `app/bug-management-ui/webapp/manifest.json`

This file is the SAPUI5 application descriptor. It tells UI5:

- The app ID: `idts.bugmanagementui`.
- The OData service URL: `/odata/v4/bug/`.
- The app uses OData V4.
- The root page is a Fiori Elements List Report bound to `/Bugs`.
- The detail page is a Fiori Elements Object Page bound to `/Bugs`.
- Create mode uses `CreationDialog`, meaning Create opens a compact dialog directly from the List Report.
- The table type is `GridTable`, which fits a desktop-heavy enterprise bug worklist with many columns better than `ResponsiveTable`.
- `condensedTableLayout` is enabled so the table is denser in compact mode.
- Table personalization is enabled for column, sort, and filter settings.
- `enhanceI18n` points to `i18n/i18n.properties` so Fiori Elements can use app-level text overrides for framework dialogs such as the create dialog.

### `app/bug-management-ui/webapp/i18n/i18n_en.properties`

This file contains English UI texts used by the app descriptor, such as:

- `appTitle`
- `appDescription`

For SAPUI5/Fiori apps, user-facing text should be kept in i18n files rather than hardcoded in UI code. This supports translation later.

### `db/data/idts.cap-Bugs.csv`

This CSV file seeds local demo bug data into the CAP SQLite in-memory database. The four records are not production data. They exist so the mentor/team can open the List Report and immediately see meaningful IDTS rows.

The seed records also demonstrate different states:

- New.
- Pending Assignment.
- In Progress.
- Rejected.

### Why Annotation-Driven UI Is Preferred for IDTS MVP

For this project stage, annotation-driven Fiori Elements is better than custom SAPUI5 for the main screens because:

- It is faster for a beginner SAP team.
- It follows SAP standard layout and behavior.
- It reduces custom controller code.
- It keeps UI behavior close to the CAP OData model.
- It is easier to verify through metadata compilation.

Custom SAPUI5 should be added only when annotations cannot support a required interaction, such as a complex assignment wizard or a real attachment upload flow.

### 2026-06-04 UI Refinement: List Report Layout, Create Bug, and Semantic Icons

The List Report was refined after visual review:

- The table changed from `ResponsiveTable` to `GridTable` because IDTS is mainly a desktop enterprise worklist. A grid table uses the available horizontal space more predictably and reduces the large empty area seen on the right side of the bug list.
- The create behavior changed from `NewPage` to `CreationDialog`. This creates bugs through a focused dialog.
- `BugService.Bugs` is now draft-enabled with `@odata.draft.enabled`. This is important because SAP Fiori Elements OData V4 uses draft choreography for standard create/edit scenarios. Without draft support, the toolbar Create button did not appear even though the CAP service could accept manual OData POST requests.
- The create dialog uses `UI.FieldGroup#CreateBug`. It includes scalar fields and foreign-key fields such as `priority_code`, `severity_code`, `applicationComponent_ID`, and `defectCategory_ID`. Fiori creation dialogs do not support navigation-property paths as input fields, so the dialog must use these direct properties.
- `Status`, `Priority`, and `Severity` still use semantic criticality colors, but now use `CriticalityRepresentation : #WithoutIcon`. This keeps SAP semantic meaning while removing distracting default status icons.
- The toolbar standard action still shows the framework label **Create**, while the dialog title is overridden to **Create Bug** through Fiori Elements i18n enhancement.

Important tradeoff: the `CreationDialog` is good for an MVP/demo, but a future full create experience may need a dedicated Object Page or custom wizard because bug reports have many long-text fields.

### What WP2/WP3 Add Next

WP2 adds value help annotations and service contract refinements so users can choose valid values from Fiori dropdown/value-help dialogs.

WP3 adds backend handlers so users cannot bypass business rules by editing raw OData payloads. For example, WP3 should validate assignment, status transitions, `nextProcessor`, rejection reason, history logs, and notifications.

WP4 then uses WP2/WP3 outputs to show better Create, Assignment, Developer Review, and follow-up actions in Fiori.

## Vietnamese

Ghi chú này giải thích phần Fiori Elements hiện tại của IDTS trước khi mở rộng tiếp WP2/WP3/WP4.

### Fiori Elements Nghĩa Là Gì Trong Dự Án Này

Fiori Elements là cách xây UI SAP dựa trên metadata. Thay vì tự code từng màn hình bằng XML view và controller, app đọc metadata OData V4 và annotation từ CAP service. SAPUI5 sau đó tự sinh các màn hình chuẩn doanh nghiệp như List Report, Object Page và Create Page.

Trong dự án này, UI chính gồm:

- List Report: màn hình danh sách dạng bảng để xem bug.
- Object Page: màn hình chi tiết của một bug.
- Create Dialog: dialog tạo bug chuẩn của Fiori Elements OData V4 ngay trên List Report.

Vì vậy implementation hiện tại chủ yếu sửa CDS annotation và `manifest.json`, không viết custom UI5 controller.

### `app/bug-management-ui/annotations.cds`

File này nói cho Fiori Elements biết cách render entity OData `BugService.Bugs`.

Các annotation quan trọng:

- `UI.HeaderInfo`: định nghĩa tiêu đề và mô tả của một bug. IDTS dùng `bugNumber` làm tiêu đề object và `title` làm mô tả.
- `UI.SelectionFields`: định nghĩa các field xuất hiện trên filter bar của List Report, như status, priority, severity, SAP module, application component, defect category, assignee, next processor role và due date.
- `UI.LineItem`: định nghĩa các cột bảng của List Report.
- `UI.Facets`: định nghĩa các section/subsection trên Object Page.
- `UI.FieldGroup`: nhóm các field thành form trong Object Page.
- `UI.MultiLineText`: yêu cầu Fiori Elements render các field text dài thành ô nhập nhiều dòng.
- `Common.Label`: đặt nhãn hiển thị cho field và association.

Object Page hiện tại được chia theo nghiệp vụ IDTS:

- Thông tin bug.
- Phân loại.
- Bước tái hiện và kết quả.
- Assignment và follow-up.
- Follow-up khi bị Rejected.
- Planning.
- Comments.
- Attachments.
- History.
- Notifications.

### `app/bug-management-ui/webapp/manifest.json`

File này là application descriptor của SAPUI5. Nó khai báo:

- App ID: `idts.bugmanagementui`.
- URL OData service: `/odata/v4/bug/`.
- App dùng OData V4.
- Trang chính là Fiori Elements List Report bind với `/Bugs`.
- Trang chi tiết là Fiori Elements Object Page bind với `/Bugs`.
- Create mode dùng `CreationDialog`, nghĩa là thao tác Create mở một dialog gọn ngay từ List Report.
- Table type là `GridTable`, phù hợp hơn với màn hình bug worklist dùng nhiều trên desktop và có nhiều cột.
- `condensedTableLayout` được bật để bảng gọn hơn trong compact mode.
- Table personalization được bật cho column, sort và filter.
- `enhanceI18n` trỏ tới `i18n/i18n.properties` để Fiori Elements có thể dùng text override của app cho các dialog framework như create dialog.

### `app/bug-management-ui/webapp/i18n/i18n_en.properties`

File này chứa text tiếng Anh dùng bởi app descriptor, ví dụ:

- `appTitle`
- `appDescription`

Với SAPUI5/Fiori, text hiển thị cho người dùng nên để trong i18n thay vì hardcode trong UI code. Điều này giúp dịch thuật sau này dễ hơn.

### `db/data/idts.cap-Bugs.csv`

File CSV này seed dữ liệu bug demo vào SQLite in-memory database của CAP. Bốn record này không phải dữ liệu production. Chúng giúp mentor/team mở List Report là thấy ngay dữ liệu IDTS có ý nghĩa.

Các record demo cũng thể hiện nhiều trạng thái khác nhau:

- New.
- Pending Assignment.
- In Progress.
- Rejected.

### Vì Sao MVP IDTS Nên Ưu Tiên Annotation-Driven UI

Ở giai đoạn hiện tại, Fiori Elements theo annotation phù hợp hơn custom SAPUI5 cho màn hình chính vì:

- Nhanh hơn cho team mới học SAP.
- Theo layout và hành vi chuẩn SAP.
- Giảm custom controller code.
- Giữ logic UI gần với CAP OData model.
- Dễ verify bằng compile metadata.

Custom SAPUI5 chỉ nên thêm khi annotation không đáp ứng được tương tác bắt buộc, ví dụ wizard assign phức tạp hoặc flow upload attachment thật.

### 2026-06-04 Cải Tiến UI: Layout List Report, Create Bug Và Icon Semantic

List Report đã được chỉnh sau khi review giao diện:

- Table đổi từ `ResponsiveTable` sang `GridTable` vì IDTS chủ yếu là worklist doanh nghiệp dùng trên desktop. Grid table dùng chiều ngang ổn định hơn và giảm khoảng trống lớn bên phải của danh sách bug.
- Create behavior đổi từ `NewPage` sang `CreationDialog`. Cách này giúp tạo bug bằng dialog tập trung.
- `BugService.Bugs` đã được bật draft bằng `@odata.draft.enabled`. Điều này quan trọng vì SAP Fiori Elements OData V4 dùng draft choreography cho các kịch bản create/edit chuẩn. Nếu không bật draft, toolbar Create button không xuất hiện dù CAP service vẫn nhận được OData POST thủ công.
- Create dialog dùng `UI.FieldGroup#CreateBug`. FieldGroup này gồm các field trực tiếp và field khóa ngoại như `priority_code`, `severity_code`, `applicationComponent_ID`, và `defectCategory_ID`. Fiori creation dialog không hỗ trợ navigation-property path làm input, nên dialog phải dùng các property trực tiếp này.
- `Status`, `Priority`, và `Severity` vẫn dùng màu semantic theo criticality, nhưng thêm `CriticalityRepresentation : #WithoutIcon`. Cách này giữ ý nghĩa màu SAP nhưng bỏ các icon mặc định gây nhiễu.
- Standard action trên toolbar vẫn hiển thị label framework **Create**, còn title của dialog đã được override thành **Create Bug** qua Fiori Elements i18n enhancement.

Tradeoff quan trọng: `CreationDialog` phù hợp cho MVP/demo, nhưng về sau nếu form tạo bug cần đầy đủ và nhiều field text dài hơn, dự án có thể cần dedicated Object Page hoặc custom wizard.

### WP2/WP3 Sẽ Bổ Sung Gì Tiếp Theo

WP2 bổ sung value help annotation và service contract để user chọn đúng value hợp lệ từ dropdown/value-help dialog của Fiori.

WP3 bổ sung backend handler để user không thể bypass business rule bằng cách sửa raw OData payload. Ví dụ WP3 cần validate assignment, status transition, `nextProcessor`, rejection reason, history log và notification.

WP4 sau đó dùng output của WP2/WP3 để hoàn thiện Create, Assignment, Developer Review và follow-up action trên Fiori.

## 2026-06-15 Selective Remake_UI Integration

English:

This update selectively reused safe ideas from DatDT's `Remake_UI` branch instead of merging the whole branch.

### What Changed

- The Object Page section `Assignment and Follow-up` was moved above `Bug Details`.
- `HistoryLogs` was annotated with `Insertable : false`, `Updatable : false`, and `Deletable : false`.
- The List Report create mode was changed from `CreationDialog` to `NewPage`.

### Why Assignment Is First

In SAP Fiori Elements Object Page, the order of `UI.Facets` controls the order of sections on the page.

For IDTS, assignee and next processor are operationally important because users often need to know:

- Who is currently responsible for the bug.
- Which role or user must act next.
- Whether the bug is waiting for a developer, tester, or PM.

Putting Assignment first makes the Bug Detail screen closer to the mentor feedback: assignee/status should be easy to see before reading all supporting details.

### Why History Is Read-Only

`HistoryLogs` is an audit trail. Users should not manually create, edit, or delete audit records from the UI.

The backend creates history records when a lifecycle action changes status, assignee, next processor, reason, or other tracked fields. Fiori reads the OData capability annotations and hides or disables create/edit/delete behavior for the History table.

### Why NewPage Replaced CreationDialog

The previous Create Bug dialog was too crowded because a valid bug has many required fields: title, description, priority, severity, steps to reproduce, actual result, expected result, application component, and defect category.

SAP Fiori guidance treats creation dialogs as better for small create forms. For IDTS, a create page is more appropriate because the user needs enough space to write clear defect information.

Important behavior: with OData V4 Fiori Elements and draft create, `NewPage` can still show an initial prefill dialog for required fields before continuing to the new object page. This is expected framework behavior. It is still better than a large 12-field dialog because optional fields such as environment, SAP module, and due date are no longer forced into the first dialog.

### What Was Intentionally Not Adopted

- Required fields were not reduced to only `title`.
- `nextProcessorRole` was not removed.
- Object Page action annotations were not removed.
- The Supporting Info section was not removed.

These rejected changes would weaken IDTS business behavior or make the UI less aligned with backend rules.

Vietnamese:

Bản cập nhật này chỉ chọn lọc những ý tưởng an toàn từ branch `Remake_UI` của DatDT, không merge nguyên branch.

### Đã Thay Đổi Gì

- Section `Assignment and Follow-up` trong Object Page được đưa lên trước `Bug Details`.
- `HistoryLogs` được annotation là không cho tạo, sửa, xóa từ UI.
- Chế độ tạo bug của List Report được đổi từ `CreationDialog` sang `NewPage`.

### Vì Sao Đưa Assignment Lên Đầu

Trong SAP Fiori Elements Object Page, thứ tự của `UI.Facets` quyết định thứ tự các section trên màn hình.

Với IDTS, assignee và next processor rất quan trọng trong vận hành vì user cần biết nhanh:

- Ai đang chịu trách nhiệm bug.
- Role hoặc user nào cần xử lý tiếp theo.
- Bug đang chờ developer, tester hay PM.

Đưa Assignment lên đầu giúp màn hình Bug Detail sát hơn với feedback mentor: assignee/status phải dễ thấy trước khi đọc các thông tin phụ.

### Vì Sao History Phải Read-Only

`HistoryLogs` là audit trail. User không nên tự tạo, sửa hoặc xóa record lịch sử từ giao diện.

Backend sẽ tạo history record khi lifecycle action làm thay đổi status, assignee, next processor, reason hoặc field cần audit khác. Fiori đọc capability annotation từ OData metadata và ẩn hoặc disable hành vi create/edit/delete cho bảng History.

### Vì Sao Đổi Từ CreationDialog Sang NewPage

Dialog Create Bug cũ bị quá chật vì một bug hợp lệ cần nhiều field bắt buộc: title, description, priority, severity, steps to reproduce, actual result, expected result, application component và defect category.

Theo hướng dẫn SAP Fiori, creation dialog phù hợp hơn với form tạo nhỏ. Với IDTS, create page hợp lý hơn vì tester cần đủ không gian để viết thông tin defect rõ ràng.

Lưu ý quan trọng: với Fiori Elements OData V4 và draft create, `NewPage` vẫn có thể hiện một prefill dialog ban đầu cho các required field trước khi vào trang tạo mới. Đây là hành vi framework bình thường. Cách này vẫn tốt hơn dialog 12 field trước đó vì các field optional như environment, SAP module và due date không còn bị ép vào bước đầu tiên.

### Những Gì Cố Ý Không Lấy Từ Remake_UI

- Không giảm required fields xuống chỉ còn `title`.
- Không xóa `nextProcessorRole`.
- Không xóa Object Page action annotations.
- Không xóa section Supporting Info.

Các thay đổi bị loại này có thể làm yếu business behavior của IDTS hoặc khiến UI không còn khớp backend rules.
