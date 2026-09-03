# Knowledge: `app/user-administration-ui/webapp/fragment/DeveloperWorkloadDetails.fragment.xml`

## Container-aware pop-in / Pop-in theo container

The Bug table uses `autoPopinMode="true"` with `contextualWidth="Auto"`. Bug number, Title and Actions are high importance, so the dialog preserves identification and navigation while lower-priority Bug metadata moves into the native pop-in when the stretched dialog is narrower than the browser viewport. / Table Bug dùng `autoPopinMode="true"` cùng `contextualWidth="Auto"`. Bug number, Title và Actions có importance cao để dialog giữ định danh và điều hướng, còn metadata Bug ưu tiên thấp hơn chuyển vào pop-in native khi dialog stretch hẹp hơn viewport browser.

## English

This fragment is the read-only detail dialog opened from a Developer Workload row. It shows a bounded summary of open assigned Bugs and a responsive table with Bug number, title, status, priority, severity, due date, technical assignee, Current Action Owner, estimated effort, overdue state, and an `Open Bug` action. The dialog never exposes description, comments, attachments, identity/provider data, or audit fields.

### Runtime flow

`Main.controller.js:onOpenDeveloperWorkload` puts the selected normalized workload row into the `workload` JSONModel, loads this fragment once, opens it, and calls `_loadDeveloperWorkloadBugs`. The table binds to `workload>/bugs`; `bugsBusy` and `bugsError` are independent from the aggregate workload list state. The `Open Bug` button calls `openBugInManagement`, which accepts only a valid UUID and uses the exact relative Object Page route. Assignment, status, comment, attachment, and other Bug lifecycle actions remain in Bug Management.

### Important source anchors

- **Location**: `DeveloperWorkloadDetails.fragment.xml:Dialog` and the `VBox class="sapUiSmallMargin"` content.
  **IDTS concept**: A responsive, readable PM detail surface with summary counts and a separate safe error state.
  **Impact if broken**: Narrow screens can clip the details, or a Bug read failure can be confused with a workload aggregate failure.
  **Must check together**: `Main.controller.js:onOpenDeveloperWorkload`/`_loadDeveloperWorkloadBugs`, `Main.view.xml` Workload table, and UI5 MCP lint/build.

- **Location**: `DeveloperWorkloadDetails.fragment.xml` ownership columns and `openBugInManagement` button.
  **IDTS concept**: `Technical Assignee` identifies the technical `assignee`; `Current Action Owner` identifies the person or queue expected to perform the next workflow step. The link is same-origin and read-only.
  **Impact if broken**: PM may route work to the wrong owner or believe User Administration can change Bug lifecycle state.
  **Must check together**: `srv/service.cds:Bugs`, `srv/bug-service/monitoring.js`, `_bugObjectPageUrl`, and the current-owner/deep-link contract assertions.

### Safe editing

Keep the fragment bound only to normalized `workload` safe rows. Use `sapUiSmallMargin`, native responsive table pop-in behavior, local `core:require` for the formatter, and no deprecated Dialog properties. Any new detail field must first be added to the approved Bug `$select` allowlist and the privacy-focused test.

## Tiếng Việt

Fragment này là dialog detail chỉ đọc mở từ một row Developer Workload. Dialog hiển thị summary bounded của Bug đang mở được giao và table responsive gồm Bug number, title, status, priority, severity, due date, technical assignee, Current Action Owner, effort ước tính, state overdue và action `Open Bug`. Dialog không expose description, comment, attachment, identity/provider data hoặc audit field.

### Luồng runtime

`Main.controller.js:onOpenDeveloperWorkload` đưa workload row đã normalize vào JSONModel `workload`, load fragment một lần, mở dialog rồi gọi `_loadDeveloperWorkloadBugs`. Table bind vào `workload>/bugs`; `bugsBusy` và `bugsError` độc lập với state của aggregate workload list. Button `Open Bug` gọi `openBugInManagement`, chỉ nhận UUID hợp lệ và dùng exact relative Object Page route. Assignment, status, comment, attachment và các action lifecycle Bug khác vẫn thuộc Bug Management.

### Important source anchors / Anchor source quan trọng

- **Vị trí**: `DeveloperWorkloadDetails.fragment.xml:Dialog` và content `VBox class="sapUiSmallMargin"`.
  **Khái niệm IDTS**: Surface detail responsive, dễ đọc cho PM với summary count và error state riêng.
  **Ảnh hưởng nếu sai**: Màn hình hẹp có thể bị cắt nội dung hoặc lỗi đọc Bug bị nhầm với lỗi aggregate workload.
  **Phải kiểm tra cùng**: `Main.controller.js:onOpenDeveloperWorkload`/`_loadDeveloperWorkloadBugs`, table Workload trong `Main.view.xml` và UI5 MCP lint/build.

- **Vị trí**: column ownership và button `openBugInManagement` trong `DeveloperWorkloadDetails.fragment.xml`.
  **Khái niệm IDTS**: `Technical Assignee` là `assignee` kỹ thuật; `Current Action Owner` là người hoặc queue dự kiến xử lý workflow tiếp theo. Link cùng origin và chỉ đọc.
  **Ảnh hưởng nếu sai**: PM có thể route công việc tới nhầm owner hoặc tưởng User Administration có thể đổi lifecycle Bug.
  **Phải kiểm tra cùng**: `srv/service.cds:Bugs`, `srv/bug-service/monitoring.js`, `_bugObjectPageUrl` và assertion current-owner/deep-link.

### Sửa an toàn

Giữ fragment chỉ bind vào safe row đã normalize của `workload`. Dùng `sapUiSmallMargin`, responsive table pop-in native, `core:require` local cho formatter và không dùng property Dialog deprecated. Field detail mới phải được thêm vào allowlist Bug `$select` đã duyệt và privacy-focused test trước.
