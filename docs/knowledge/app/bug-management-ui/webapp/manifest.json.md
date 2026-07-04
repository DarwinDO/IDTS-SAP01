# Knowledge: `app/bug-management-ui/webapp/manifest.json`

## English

### What this file is for

The main Fiori Elements application descriptor. It configures the app bootstrap, OData service connection, routing between List Report and Object Page, models, List Report monitoring tabs, and custom Object Page sections.

### IDTS flow

Browser loads the app → UI5 reads this file → connects to `/odata/v4/bug/` → Fiori Elements generates List Report (for bugs) and Object Page (for single bug) based on `contextPath: /Bugs`.

All custom IDTS behavior (buttons, facets, value helps, and the grouped history timeline section) is added on top via annotations and manifest page configuration.

### Important source anchors

- `dataSources.mainService.uri`: "/odata/v4/bug/"
  **IDTS concept**: Points to the BugService. Everything (entities, actions, virtuals) comes from here.

- `sap.ui5.routing` with targets for ListReport and ObjectPage using `contextPath: "/Bugs"`.
  **IDTS concept**: Binds the generated pages to the Bugs collection and single instance.

- `BugsList.options.settings.views.paths`
  **IDTS concept**: Preserves WP6 PM monitoring tabs: All Bugs, Pending Assignment, Rejected Follow-up, Retest Required, Overdue, and PM Action Queue.
  **Why this matters**: In this OData V4 Fiori Elements app, the PM monitoring tabs are configured as List Report `views.paths` at page settings level. Do not move them into table `quickVariantSelection`, because that can change the already verified PM monitoring tab behavior.

- `BugsObjectPage.options.settings.content.body.sections.HistoryTimeline`
  **IDTS concept**: Injects the custom grouped history timeline fragment before Notifications so users can read event-level audit history on the Object Page.

- i18n and compact/cozy densities.
  **IDTS concept**: Standard Fiori setup for professional enterprise look.

### Cross-folder

- Links to `srv/service.cds`
- Annotations merged via `app/services.cds`
- OPA/browser checks rely on the routes and PM monitoring tab configuration defined here
- The History timeline section depends on `webapp/ext/fragment/HistoryTimeline.fragment.xml`

## Vietnamese

### File này dùng để làm gì

File mô tả ứng dụng Fiori Elements. Cấu hình kết nối OData, routing List ↔ Object Page, model, tab monitoring của List Report, và custom section của Object Page.

### Flow IDTS

Load app → kết nối service → sinh List Report và Object Page cho Bugs.

Hành vi IDTS tùy chỉnh được thêm qua annotation và cấu hình page trong manifest.

### Các điểm neo quan trọng

- URI service
- Routing với contextPath /Bugs
- `views.paths` giữ các tab monitoring WP6 cho PM
- Lưu ý quan trọng: app này đang dùng Fiori Elements OData V4 và các tab PM monitoring đã được verify bằng cấu hình `views.paths` ở page settings. Không chuyển phần này vào `tableSettings.quickVariantSelection`, vì có thể làm thay đổi hành vi tab monitoring đã ổn định.
- `HistoryTimeline` chèn fragment timeline lịch sử vào Object Page
- i18n

### Liên kết

srv/service.cds, annotations, OPA/browser test, fragment HistoryTimeline.

## IDTS-43 update - custom Create Bug and single History section

### English

IDTS-43 changes two visible Fiori behaviors in this file.

First, the List Report gets a custom header action named `Create Bug`. The standard framework Create is hidden by `app/bug-management-ui/annotations/capabilities.cds`, so this custom action becomes the intended create entry point. It calls `idts.bugmanagementui.ext.actions.BugListActions.createBug` and uses `isCreateVisible` for visibility/enabled state.

Second, the custom Object Page history section is keyed as `History` instead of `HistoryTimeline`, and the raw generated History table facet is removed from `object-page.cds`. This keeps one user-facing History section while preserving backend audit data.

Important anchors:

- Location: `BugsList.options.settings.content.header.actions.CreateBug`
  - IDTS concept: Role-aware create entry point for Tester/PM.
  - Impact if broken: Users may lose the create entry point or Developer users may see a misleading create button.
  - Must check together: `app/bug-management-ui/webapp/ext/actions/BugListActions.js`, `app/bug-management-ui/annotations/capabilities.cds`, `srv/service.js`, and `srv/bug-service/permissions.js`.

## IDTS-54 update - dashboard entry action

### English

IDTS-54 adds the List Report header action `OpenDashboard`. The dashboard itself is a protected standalone SAPUI5 page at `dashboard.html`, so the manifest only owns the user entry point from the generated bug list.

Important anchors:

- Location: `BugsList.options.settings.content.header.actions.OpenDashboard`
  - IDTS concept: user-facing entry point from bug list to dashboard.
  - Impact if broken: dashboard may exist but users cannot find it.
  - Must check together: i18n key `dashboardOpenAction`, `webapp/ext/actions/BugListActions.js`, `webapp/dashboard.html`, `webapp/dashboard-page.js`, and browser smoke after login.

### Vietnamese

IDTS-54 thêm List Report header action `OpenDashboard`. Dashboard là một standalone SAPUI5 page được bảo vệ tại `dashboard.html`, nên manifest chỉ quản lý điểm vào từ bug list generated.

Các anchor quan trọng:

- Vị trí: `BugsList.options.settings.content.header.actions.OpenDashboard`
  - Khái niệm IDTS: điểm vào dashboard dành cho user từ bug list.
  - Ảnh hưởng nếu sai: dashboard tồn tại nhưng user không tìm thấy.
  - Phải kiểm tra cùng: i18n key `dashboardOpenAction`, `webapp/ext/actions/BugListActions.js`, `webapp/dashboard.html`, `webapp/dashboard-page.js`, và browser smoke sau login.

- Location: `BugsObjectPage.options.settings.content.body.sections.History`
  - IDTS concept: One readable history/timeline section on the Object Page.
  - Impact if broken: The Object Page can show no history or duplicate history sections.
  - Must check together: `app/bug-management-ui/annotations/object-page.cds`, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, and history entities in `srv/service.cds`.

### Vietnamese

IDTS-43 thay đổi hai hành vi Fiori nhìn thấy được trong file này.

Thứ nhất, List Report có custom header action tên `Create Bug`. Nút Create chuẩn của framework đã bị ẩn trong `app/bug-management-ui/annotations/capabilities.cds`, nên custom action này trở thành điểm vào chính thức để tạo bug. Nó gọi `idts.bugmanagementui.ext.actions.BugListActions.createBug` và dùng `isCreateVisible` để quyết định visible/enabled.

Thứ hai, custom section History trên Object Page dùng key `History` thay vì `HistoryTimeline`, và raw generated History table facet bị bỏ khỏi `object-page.cds`. Cách này giữ một section History dễ đọc cho user nhưng không xóa dữ liệu audit backend.

Điểm neo quan trọng:

- Vị trí: `BugsList.options.settings.content.header.actions.CreateBug`
  - Khái niệm IDTS: Điểm tạo bug theo role cho Tester/PM.
  - Ảnh hưởng nếu sai: User có thể mất điểm tạo bug, hoặc Developer có thể thấy nút create gây hiểu nhầm.
  - Phải kiểm tra cùng: `app/bug-management-ui/webapp/ext/actions/BugListActions.js`, `app/bug-management-ui/annotations/capabilities.cds`, `srv/service.js`, và `srv/bug-service/permissions.js`.

- Vị trí: `BugsObjectPage.options.settings.content.body.sections.History`
  - Khái niệm IDTS: Một section history/timeline dễ đọc trên Object Page.
  - Ảnh hưởng nếu sai: Object Page có thể không hiện history hoặc hiện trùng nhiều section history.
  - Phải kiểm tra cùng: `app/bug-management-ui/annotations/object-page.cds`, `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, và các history entity trong `srv/service.cds`.

## Metadata

- Source file: `app/bug-management-ui/webapp/manifest.json`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/manifest.json.md`
- Source layer: `app`
- Last reviewed: 2026-07-01

## IDTS-55 runtime fix note

### English

The Comments and Evidence sections are custom Object Page sections under `BugsObjectPage.options.settings.content.body.sections`.

For OData V4 Fiori Elements, the section entry must point to the fragment module path and preserve a stable section key:

- `IdtsCommentsCustom`
- `IdtsAttachmentsCustom`

These keys are also used as anchors and stable generated IDs. If either key changes, check the fragment IDs, browser smoke locators, and knowledge mirrors together.

### Vietnamese

Comments và Evidence là custom Object Page sections dưới `BugsObjectPage.options.settings.content.body.sections`.

Với Fiori Elements OData V4, section entry phải trỏ đúng module path của fragment và giữ key ổn định:

- `IdtsCommentsCustom`
- `IdtsAttachmentsCustom`

Các key này đồng thời được dùng làm anchor và stable generated ID. Nếu đổi key, phải kiểm tra fragment IDs, browser smoke locators và knowledge mirrors cùng lúc.

## IDTS-55 update - custom Comments and Evidence sections

### English

IDTS-55 adds two custom Object Page sections under `BugsObjectPage.options.settings.content.body.sections`:

- `IdtsCommentsCustom`
- `IdtsAttachmentsCustom`

These sections keep the generated Fiori Elements Object Page, but replace the old raw comments/attachments facets with clearer custom SAPUI5 fragments. The manifest is the layer that tells Fiori Elements where those fragments appear. The behavior itself is in `BugCollaboration.js`.

Important anchors:

- **Location**: `app/bug-management-ui/webapp/manifest.json:52`
  `"sap.ui.unified": {}`
  **IDTS concept**: Enables the FileUploader control used by the Evidence / Attachments section.
  **Impact if broken**: The custom attachment section can fail to load because `sap.ui.unified.FileUploader` is not available.
  **Must check together**: `AttachmentsSection.fragment.xml`, UI5 build, and browser smoke on the Object Page.

- **Location**: `app/bug-management-ui/webapp/manifest.json:205`
  `IdtsCommentsCustom`
  **IDTS concept**: Inserts the custom comment feed after the reproduction/test context area.
  **Impact if broken**: Users may lose the improved comments UX or see the section in the wrong place.
  **Must check together**: `CommentsSection.fragment.xml`, `BugCollaboration.js`, `object-page.cds`, and `srv/service.cds:addComment`.

- **Location**: `app/bug-management-ui/webapp/manifest.json:214`
  `IdtsAttachmentsCustom`
  **IDTS concept**: Inserts the custom evidence upload/list section directly after comments.
  **Impact if broken**: Users may lose upload/download/delete UX or see duplicate attachment sections.
  **Must check together**: `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, `object-page.cds`, `db/schema.cds` attachments, and `scripts/qa/test-comments-attachments.ps1`.

### Vietnamese

IDTS-55 thêm hai custom section vào Object Page dưới `BugsObjectPage.options.settings.content.body.sections`:

- `IdtsCommentsCustom`
- `IdtsAttachmentsCustom`

Hai section này vẫn giữ Object Page generated của Fiori Elements, nhưng thay phần comments/attachments raw facet cũ bằng fragment SAPUI5 dễ dùng hơn. Manifest chỉ quyết định các fragment được chèn vào đâu; hành vi bấm nút và gọi backend nằm trong `BugCollaboration.js`.

Các anchor quan trọng:

- **Vị trí**: `app/bug-management-ui/webapp/manifest.json:52`
  `"sap.ui.unified": {}`
  **Khái niệm IDTS**: Bật thư viện chứa FileUploader dùng cho section Evidence / Attachments.
  **Ảnh hưởng nếu sai**: Custom attachment section có thể không load vì thiếu `sap.ui.unified.FileUploader`.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, UI5 build, và browser smoke trên Object Page.

- **Vị trí**: `app/bug-management-ui/webapp/manifest.json:205`
  `IdtsCommentsCustom`
  **Khái niệm IDTS**: Chèn comment feed custom ngay sau phần reproduction/test context.
  **Ảnh hưởng nếu sai**: User mất UX comment mới hoặc section nằm sai vị trí.
  **Phải kiểm tra cùng**: `CommentsSection.fragment.xml`, `BugCollaboration.js`, `object-page.cds`, và action `addComment` trong `srv/service.cds`.

- **Vị trí**: `app/bug-management-ui/webapp/manifest.json:214`
  `IdtsAttachmentsCustom`
  **Khái niệm IDTS**: Chèn section evidence upload/list ngay sau comments.
  **Ảnh hưởng nếu sai**: User mất UX upload/download/delete hoặc thấy trùng nhiều section attachment.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, `object-page.cds`, attachments trong `db/schema.cds`, và `scripts/qa/test-comments-attachments.ps1`.
