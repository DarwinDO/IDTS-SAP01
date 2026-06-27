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

- `BugsList.options.settings.controlConfiguration["@com.sap.vocabularies.UI.v1.LineItem"].tableSettings.quickVariantSelection`
  **IDTS concept**: Preserves WP6 PM monitoring tabs: All Bugs, Pending Assignment, Rejected Follow-up, Retest Required, Overdue, and PM Action Queue.

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
- `quickVariantSelection` giữ các tab monitoring WP6 cho PM
- `HistoryTimeline` chèn fragment timeline lịch sử vào Object Page
- i18n

### Liên kết

srv/service.cds, annotations, OPA/browser test, fragment HistoryTimeline.

## Metadata

- Source file: `app/bug-management-ui/webapp/manifest.json`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/manifest.json.md`
- Source layer: `app`
- Last reviewed: 2026-06-27
