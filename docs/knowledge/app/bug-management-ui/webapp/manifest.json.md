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
