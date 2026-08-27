# Knowledge: `app/bug-management-ui/webapp/manifest.json`

## IDTS-115 root-create AI label guard

### English

Fiori Elements renders a custom field label separately from the fragment content. Hiding only `SimilarBugReviewField.fragment.xml` or `ClassificationReviewField.fragment.xml` therefore leaves an empty label on a brand-new draft. The two custom-field `label` bindings now use the same persisted-source condition as their content: the label is present for an active Bug or an edit draft with an active source, and resolves to an empty string for a root create draft.

Debug order: inspect `IsActiveEntity` and `HasActiveEntity` on the Object Page context, then inspect the custom field `label` binding, and finally inspect the fragment wrapper `visible` binding. Do not use DOM hiding or CSS selectors; those approaches bypass Fiori Elements form and accessibility behavior.

### Vietnamese

Fiori Elements sinh label của custom field tách riêng khỏi nội dung fragment. Vì vậy, nếu chỉ ẩn `SimilarBugReviewField.fragment.xml` hoặc `ClassificationReviewField.fragment.xml`, màn hình tạo Bug mới vẫn còn label rỗng. Hai binding `label` giờ dùng cùng điều kiện nguồn đã lưu như nội dung: label hiện với Bug active hoặc edit draft có active source, và trở thành chuỗi rỗng với root create draft.

Thứ tự debug: xem `IsActiveEntity` và `HasActiveEntity` trên Object Page context, xem binding `label` của custom field, rồi xem binding `visible` của fragment wrapper. Không ẩn bằng DOM hoặc CSS selector vì sẽ đi vòng qua form/accessibility của Fiori Elements.

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

## IDTS-73 update - Comments section hidden during Create Bug

### English

IDTS-73 adds a visibility rule to the `IdtsCommentsCustom` Object Page section. This prevents the Comments section from appearing in the Object Page navigation while the user is creating a brand-new bug. The section remains available for active bugs and edit drafts of existing bugs.

### Vietnamese

IDTS-73 thêm visibility rule cho Object Page section `IdtsCommentsCustom`. Rule này ngăn Comments section xuất hiện trên navigation của Object Page khi user đang tạo bug mới. Section vẫn hiện với bug active và edit draft của bug đã tồn tại.

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

## IDTS-56 update - Smart Assign Object Page action

### English

IDTS-56 adds the `SmartAssignDeveloper` custom header action to the Bugs Object Page. The manifest only wires the action into Fiori Elements. The actual dialog behavior lives in `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, and the final assignment rule still lives in the CAP backend.

Important anchors:

- **Location**: `BugsObjectPage.options.settings.content.header.actions.SmartAssignDeveloper`
  **IDTS concept**: Gives Tester/PM users a clearer way to select a suitable developer from filtered assignment candidates.
  **Impact if broken**: Users may lose the Smart Assign entry point, or the button may call the wrong extension handler.
  **Must check together**: `SmartAssignDeveloper.js`, `i18n.properties`, `BugService.AssignableDevelopers`, `BugService.assignToDeveloper`, and the IDTS-56 QA scripts.

### Vietnamese

IDTS-56 thêm custom header action `SmartAssignDeveloper` vào Bugs Object Page. Manifest chỉ có nhiệm vụ gắn action này vào Fiori Elements. Hành vi mở dialog nằm trong `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, còn luật assign cuối cùng vẫn nằm ở backend CAP.

Điểm neo quan trọng:

- **Vị trí**: `BugsObjectPage.options.settings.content.header.actions.SmartAssignDeveloper`
  **Khái niệm IDTS**: Cho Tester/PM một cách rõ ràng hơn để chọn developer phù hợp từ danh sách candidate đã filter.
  **Ảnh hưởng nếu sai**: User có thể mất nút Smart Assign, hoặc nút gọi nhầm extension handler.
  **Phải kiểm tra cùng**: `SmartAssignDeveloper.js`, `i18n.properties`, `BugService.AssignableDevelopers`, `BugService.assignToDeveloper`, và các QA script IDTS-56.

## IDTS-61 update - Smart Assign moved into the Assignee field

### English

IDTS-61 removes the separate Object Page header action `SmartAssignDeveloper`. The Smart Assign flow is now entered from the Assignee field itself.

The manifest adds a custom Object Page body section:

- `IdtsSmartAssignment`

This section renders `SmartAssignmentSection.fragment.xml`, which contains an Assignee input with a value-help icon. When the user presses that value-help icon, the app opens the Smart Assign dialog. This keeps the user workflow closer to normal Fiori assignment behavior: the user thinks "I am choosing an assignee", not "I am running a separate tool".

Important anchors:

- **Location**: `sap.ui5.dependencies.libs.sap.ui.layout`
  **IDTS concept**: Enables the form layout used by the custom Assignment section.
  **Impact if broken**: The Assignment section fragment may fail to load because `sap.ui.layout.form.Form` is missing.
  **Must check together**: `SmartAssignmentSection.fragment.xml`, UI5 build, and browser smoke.

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsSmartAssignment`
  **IDTS concept**: Inserts the custom Assignee picker section on the Object Page.
  **Impact if broken**: Users may lose the Smart Assign entry point or see it in a confusing place.
  **Must check together**: `ownership-assignment.cds`, `SmartAssignmentSection.fragment.xml`, `SmartAssignDeveloper.js`, and the IDTS-56/61 browser QA script.

- **Location**: removed `BugsObjectPage.options.settings.content.header.actions.SmartAssignDeveloper`
  **IDTS concept**: Prevents two competing assignment entry points.
  **Impact if broken**: Users can again see a separate Smart Assign button while Assignee also has a picker, which makes the flow inconsistent.
  **Must check together**: Object Page browser smoke and Jira task IDTS-61 acceptance criteria.

### Vietnamese

IDTS-61 bo nut `SmartAssignDeveloper` rieng tren header cua Object Page. Luong Smart Assign bay gio duoc mo tu chinh field Assignee.

Manifest them custom body section:

- `IdtsSmartAssignment`

Section nay render `SmartAssignmentSection.fragment.xml`, trong do co input Assignee va icon value-help. Khi user bam icon value-help, app mo dialog Smart Assign. Cach nay gan voi hanh vi Fiori hon: user hieu la minh dang chon Assignee, khong phai dang bam mot cong cu rieng.

Anchor quan trong:

- **Vi tri**: `sap.ui5.dependencies.libs.sap.ui.layout`
  **Khai niem IDTS**: Bat thu vien form layout cho custom Assignment section.
  **Anh huong neu sai**: Fragment Assignment co the khong load vi thieu `sap.ui.layout.form.Form`.
  **Phai kiem tra cung**: `SmartAssignmentSection.fragment.xml`, UI5 build va browser smoke.

- **Vi tri**: `BugsObjectPage.options.settings.content.body.sections.IdtsSmartAssignment`
  **Khai niem IDTS**: Chen custom Assignee picker section vao Object Page.
  **Anh huong neu sai**: User mat diem vao Smart Assign hoac section nam sai cho, gay kho hieu.
  **Phai kiem tra cung**: `ownership-assignment.cds`, `SmartAssignmentSection.fragment.xml`, `SmartAssignDeveloper.js`, va browser QA script IDTS-56/61.

- **Vi tri**: da bo `BugsObjectPage.options.settings.content.header.actions.SmartAssignDeveloper`
  **Khai niem IDTS**: Tranh hai diem assign canh tranh nhau.
  **Anh huong neu sai**: User lai thay ca nut Smart Assign rieng va field Assignee co picker, lam flow khong nhat quan.
  **Phai kiem tra cung**: Object Page browser smoke va acceptance criteria cua Jira IDTS-61.

## IDTS-75 update - Classification Assistance section

### English

The Object Page now inserts `IdtsClassificationAssistance` immediately after the standard `ClassificationAndAssignment` section. The existing `IdtsSmartAssignment` section is anchored after this new section so the page order remains:

1. standard classification and planning fields;
2. classification suggestion review;
3. assignment.

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsClassificationAssistance`
  **IDTS concept**: Gives users a visible Fiori entry point to review the existing classification suggestion action.
  **Impact if broken**: IDTS-75 may disappear from the Object Page or Assignment may appear in the wrong order.
  **Must check together**: `ClassificationAssistanceSection.fragment.xml`, `ClassificationReview.js`, i18n files, and IDTS-75 browser evidence.

### Vietnamese

Object Page hien chen `IdtsClassificationAssistance` ngay sau section chuan `ClassificationAndAssignment`. Section `IdtsSmartAssignment` duoc anchor sau section moi de thu tu trang van la:

1. cac field classification va planning chuan;
2. review goi y classification;
3. assignment.

- **Vi tri**: `BugsObjectPage.options.settings.content.body.sections.IdtsClassificationAssistance`
  **Khai niem IDTS**: Tao diem vao Fiori ro rang de user review action goi y classification da co.
  **Anh huong neu sai**: IDTS-75 co the bien mat khoi Object Page hoac Assignment hien sai thu tu.
  **Phai kiem tra cung**: `ClassificationAssistanceSection.fragment.xml`, `ClassificationReview.js`, cac file i18n va browser evidence IDTS-75.

## IDTS-76 update - Handoff Summary review section

### English

The Object Page now inserts `IdtsHandoffSummary` after `IdtsClassificationAssistance`. The existing `IdtsSmartAssignment` section is anchored after `IdtsHandoffSummary`, so the AI review sections stay together before the assignment section.

This is intentionally a manifest-only page placement change. The backend action already exists in `srv/service.cds`; the UI only adds a visible review entry point.

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **IDTS concept**: Gives users a visible place to open the existing handoff summary review.
  **Impact if broken**: IDTS-76 may not appear on the Object Page, or the page order may become confusing.
  **Must check together**: `HandoffSummarySection.fragment.xml`, `HandoffSummaryReview.js`, i18n files, and IDTS-76 browser evidence.

- **Location**: `IdtsSmartAssignment.position.anchor = IdtsHandoffSummary`
  **IDTS concept**: Keeps the page order as classification assistance, handoff summary, then assignment.
  **Impact if broken**: Assignment may appear before the handoff summary, making the review helpers harder to find.
  **Must check together**: Object Page browser smoke and manifest JSON parse.

### Vietnamese

Object Page hien chen `IdtsHandoffSummary` sau `IdtsClassificationAssistance`. Section `IdtsSmartAssignment` duoc anchor sau `IdtsHandoffSummary`, nen cac section AI review nam gan nhau truoc section assignment.

Day la thay doi vi tri trang trong manifest. Backend action da co trong `srv/service.cds`; UI chi them mot entry point de user review.

- **Vi tri**: `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **Khai niem IDTS**: Tao diem vao ro rang de user mo handoff summary review da co.
  **Anh huong neu sai**: IDTS-76 co the khong hien tren Object Page, hoac thu tu trang gay kho hieu.
  **Phai kiem tra cung**: `HandoffSummarySection.fragment.xml`, `HandoffSummaryReview.js`, cac file i18n va browser evidence IDTS-76.

- **Vi tri**: `IdtsSmartAssignment.position.anchor = IdtsHandoffSummary`
  **Khai niem IDTS**: Giu thu tu trang la classification assistance, handoff summary, roi assignment.
  **Anh huong neu sai**: Assignment co the hien truoc handoff summary, lam user kho thay cac helper review.
  **Phai kiem tra cung**: Object Page browser smoke va manifest JSON parse.

## IDTS-77 update - AI review action section placement

### English

IDTS-77 corrects the Object Page custom section order for AI review actions.

The important rule is semantic placement:

- `IdtsSimilarBugCheck` appears after `BugDetails`, because duplicate/similar review is about the bug summary itself.
- `IdtsClassificationAssistance` stays after `ClassificationAndAssignment`, because classification suggestions belong beside classification fields.
- `IdtsSmartAssignment` stays after classification assistance, because assignment is a separate ownership area.
- `IdtsHandoffSummary` now appears before `History`, because handoff summary is easiest to understand beside audit/history context.

Important anchors:

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsSimilarBugCheck`
  **IDTS concept**: duplicate/similar review near Bug Summary.
  **Impact if broken**: users may think duplicate review is part of assigning a developer.
  **Must check together**: `SimilarBugCheckSection.fragment.xml`, `DuplicateReview.js`, and `scripts/qa/test-idts77-ai-action-placement.js`.

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **IDTS concept**: handoff summary near History.
  **Impact if broken**: users may see handoff review too early and miss the connection with lifecycle/audit context.
  **Must check together**: `HandoffSummarySection.fragment.xml`, `HistoryTimeline.fragment.xml`, and browser smoke.

### Vietnamese

IDTS-77 chỉnh lại thứ tự custom section trên Object Page cho các action AI review.

Rule quan trọng là đặt theo đúng ngữ nghĩa:

- `IdtsSimilarBugCheck` nằm sau `BugDetails`, vì review duplicate/similar liên quan trực tiếp tới nội dung bug summary.
- `IdtsClassificationAssistance` giữ sau `ClassificationAndAssignment`, vì suggestion classification thuộc ngữ cảnh các field phân loại.
- `IdtsSmartAssignment` giữ sau classification assistance, vì assignment là vùng ownership riêng.
- `IdtsHandoffSummary` hiện nằm trước `History`, vì handoff summary dễ hiểu nhất khi đặt gần ngữ cảnh audit/history.

Anchor quan trọng:

- **Vị trí**: `BugsObjectPage.options.settings.content.body.sections.IdtsSimilarBugCheck`
  **Khái niệm IDTS**: review duplicate/similar nằm gần Bug Summary.
  **Ảnh hưởng nếu sai**: user có thể hiểu nhầm duplicate review là một phần của việc assign developer.
  **Phải kiểm tra cùng**: `SimilarBugCheckSection.fragment.xml`, `DuplicateReview.js`, và `scripts/qa/test-idts77-ai-action-placement.js`.

- **Vị trí**: `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **Khái niệm IDTS**: handoff summary nằm gần History.
  **Ảnh hưởng nếu sai**: user có thể thấy handoff review quá sớm và không thấy liên kết với lifecycle/audit context.
  **Phải kiểm tra cùng**: `HandoffSummarySection.fragment.xml`, `HistoryTimeline.fragment.xml`, và browser smoke.

## IDTS-78 correction - AI actions must not be standalone Object Page sections

### English

IDTS-78 supersedes the IDTS-77 placement note above. IDTS-77 moved AI actions near the right business areas, but it still rendered them as separate Object Page sections with their own titles. DonHV clarified that the row style is acceptable, but the AI actions must not appear as standalone titled sections.

Corrected rule:

- `Find Similar Bugs` is a helper action for Bug Summary, not a visible `Similar Bug Check` section.
- `Review Classification Suggestions` is a helper action for Classification and Planning, not a visible `Classification Assistance` section.
- `Review Handoff Summary` is rendered inside the History fragment, not as a visible `Handoff Summary` section before or after History.

Important anchors:

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsSimilarBugActionRow`
  **IDTS concept**: Similar-bug review stays near Bug Summary but has no standalone section title.
  **Impact if broken**: Users may again see a separate AI section and misunderstand the action as its own workflow area.
  **Must check together**: `SimilarBugCheckSection.fragment.xml`, `DuplicateReview.js`, and `scripts/qa/test-idts77-ai-action-placement.js`.

- **Location**: `BugsObjectPage.options.settings.content.body.sections.IdtsClassificationActionRow`
  **IDTS concept**: Classification review stays near classification fields but has no standalone section title.
  **Impact if broken**: Users may think AI classification is a separate workflow step instead of review assistance.
  **Must check together**: `ClassificationAssistanceSection.fragment.xml`, `ClassificationReview.js`, and `scripts/qa/test-idts75-classification-review-ui.js`.

- **Location**: removed `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **IDTS concept**: Handoff review belongs inside History because it summarizes lifecycle context.
  **Impact if broken**: The page can show the standalone Handoff Summary section again.
  **Must check together**: `HistoryTimeline.fragment.xml`, `HandoffSummaryReview.js`, and `scripts/qa/test-idts76-handoff-summary-ui.js`.

### Vietnamese

IDTS-78 thay thế ghi chú placement IDTS-77 ở trên. IDTS-77 đã đưa các action AI tới gần khu vực nghiệp vụ hơn, nhưng vẫn render chúng thành các section Object Page riêng có title riêng. DonHV đã chốt rõ: kiểu row mỏng là được, nhưng action AI không được xuất hiện như các section có tiêu đề riêng.

Rule đúng sau khi sửa:

- `Find Similar Bugs` là helper action cho Bug Summary, không phải section `Similar Bug Check` riêng.
- `Review Classification Suggestions` là helper action cho Classification and Planning, không phải section `Classification Assistance` riêng.
- `Review Handoff Summary` được render bên trong History fragment, không phải section `Handoff Summary` riêng trước hoặc sau History.

Anchor quan trọng:

- **Vị trí**: `BugsObjectPage.options.settings.content.body.sections.IdtsSimilarBugActionRow`
  **Khái niệm IDTS**: Review similar bug nằm gần Bug Summary nhưng không có title section riêng.
  **Ảnh hưởng nếu sai**: User có thể lại thấy một section AI riêng và hiểu nhầm action này là một workflow area độc lập.
  **Phải kiểm tra cùng**: `SimilarBugCheckSection.fragment.xml`, `DuplicateReview.js`, và `scripts/qa/test-idts77-ai-action-placement.js`.

- **Vị trí**: `BugsObjectPage.options.settings.content.body.sections.IdtsClassificationActionRow`
  **Khái niệm IDTS**: Review classification nằm gần các field classification nhưng không có title section riêng.
  **Ảnh hưởng nếu sai**: User có thể tưởng AI classification là một workflow step riêng thay vì công cụ hỗ trợ review.
  **Phải kiểm tra cùng**: `ClassificationAssistanceSection.fragment.xml`, `ClassificationReview.js`, và `scripts/qa/test-idts75-classification-review-ui.js`.

- **Vị trí**: đã bỏ `BugsObjectPage.options.settings.content.body.sections.IdtsHandoffSummary`
  **Khái niệm IDTS**: Handoff review nằm trong History vì nó tóm tắt lifecycle context.
  **Ảnh hưởng nếu sai**: Trang có thể hiện lại section Handoff Summary riêng.
  **Phải kiểm tra cùng**: `HistoryTimeline.fragment.xml`, `HandoffSummaryReview.js`, và `scripts/qa/test-idts76-handoff-summary-ui.js`.

## IDTS-79 correction - action rows must live inside their business forms

### English

IDTS-78 removed the visible titles of the Similar Bug and Classification action rows, but the manifest still registered them under `content.body.sections`. Fiori Elements therefore still rendered each row as a separate Object Page block.

IDTS-79 uses native `controlConfiguration` field extensions instead:

- `IdtsSimilarBugReview` is injected after Description in `@UI.FieldGroup#GeneralInfo`.
- `IdtsClassificationReview` is injected after Defect Category in `@UI.FieldGroup#Classification`.
- The old `IdtsSimilarBugActionRow` and `IdtsClassificationActionRow` section entries are removed.

This keeps the review dialogs and backend contracts unchanged while placing each entry point inside the form where users need it.

On a brand-new root draft, Fiori Elements creates the custom-field label outside the XML fragment. The manifest therefore applies the persisted-source visibility expression to the whole custom field, while the fragment keeps the same defensive visibility. This hides both the label and button until the draft has an active source Bug; edit drafts of active Bugs remain supported.

### Vietnamese

IDTS-78 đã bỏ title nhìn thấy được của hai action row Similar Bug và Classification, nhưng manifest vẫn đăng ký chúng trong `content.body.sections`. Vì vậy Fiori Elements vẫn render mỗi row thành một block Object Page riêng.

IDTS-79 dùng native field extension của `controlConfiguration` thay vào đó:

- `IdtsSimilarBugReview` được chèn sau Description trong `@UI.FieldGroup#GeneralInfo`.
- `IdtsClassificationReview` được chèn sau Defect Category trong `@UI.FieldGroup#Classification`.
- Hai section entry cũ `IdtsSimilarBugActionRow` và `IdtsClassificationActionRow` được bỏ.

Cách này giữ nguyên dialog review và backend contract hiện có, nhưng đặt mỗi entry point vào đúng form mà user cần dùng.

## IDTS-79 visual follow-up

### English

The first form-field version used long helper text inside the custom fragment. Browser evidence showed that a standard Fiori Form cell was too narrow for that layout. The final manifest therefore supplies short i18n labels (`Similar bugs` and `Classification suggestions`) and lets the fragments render only their action buttons.

### Vietnamese

Phiên bản field đầu tiên dùng helper text dài bên trong custom fragment. Evidence browser cho thấy một Fiori Form cell chuẩn quá hẹp cho layout đó. Manifest cuối cùng vì vậy cung cấp label i18n ngắn (`Similar bugs` và `Classification suggestions`) và để fragment chỉ render action button.

## IDTS-113 update - HTML5 repository service declaration

### English

The manifest now declares `sap.cloud.service: idts.sap01`. The MTA HTML5
content module uses this stable service name when it packages the UI into the
SAP HTML5 Application Repository. OData data-source paths remain unchanged;
AppRouter routes `/odata/*` to the CAP service and forwards the XSUAA token.

### Vietnamese

Manifest khai bao `sap.cloud.service: idts.sap01`. HTML5 content module trong
MTA dung service name on dinh nay de dong goi UI vao SAP HTML5 Application
Repository. Duong dan OData khong doi; AppRouter route `/odata/*` den CAP
service va forward XSUAA token.

## IDTS-116 attachment section registration (2026-08-03)

`IdtsAttachmentsCustom` and the unused `sap.ui.unified` dependency were removed.

Superseded on 2026-08-04: the manifest must also avoid a `controlConfiguration` override for `attachments/@com.sap.vocabularies.UI.v1.LineItem`. The CAP attachment plugin owns the generated `attachments_attachments` facet and table lifecycle. IDTS keeps only the custom Comments section.

Do not fix attachment reload by adding a raw request, custom `UploadSet`, hard-coded generated control ID, or custom CAP `READ` handler. First verify the active navigation response, then verify that the generated facet initiates its list request.

Cập nhật ngày 2026-08-04: manifest không override table attachment. Facet `attachments_attachments` và vòng đời bảng do CAP attachment plugin quản lý; IDTS chỉ giữ custom Comments section.
# IDTS-122 PM dashboard drill-down

## N2 notification model / Model notification N2

**English.** Named model `notifications` targets `/odata/v4/notification/` with OData V4, server mode, direct groups and no preload/early requests. Keep DTO/parameters aligned with `NotificationClient.js` and `srv/notification.cds`. Component initialization still follows authenticated bootstrap. N2 cache identity is `0.0.7`, aligned with app package/lock; no dependency versions change.

**Tiếng Việt.** Model `notifications` trỏ tới `/odata/v4/notification/` bằng OData V4, server mode, direct group, không preload/early request. Giữ DTO/parameter đồng bộ với `NotificationClient.js` và `srv/notification.cds`. Component vẫn khởi tạo sau bootstrap đã xác thực. Cache identity N2 là `0.0.7`, khớp package/lock app; không đổi version dependency.

The List Report uses the supported `sap.fe.templates.ListReport.ListReportController` extension point to consume the dashboard `status_code` navigation parameter. The extension applies the filter with `ExtensionAPI.setFilterValues()` and accepts only the ten canonical workflow status codes. This keeps dashboard navigation inside supported Fiori Elements APIs and prevents arbitrary filter injection.

## Gate 6.4 header navigation / Điều hướng header Gate 6.4

**English.** The `UserAdministration` List Report header action sits beside `OpenDashboard`. Its `visible` and `enabled` properties bind to `session>/canAdministerUsers`, its press handler is `BugListActions.openUserAdministration`, and its text comes from i18n. Do not add a domain, AppRouter route, token, or unsupported tooltip metadata here.

**Tiếng Việt.** Action header `UserAdministration` nằm cạnh `OpenDashboard`. `visible` và `enabled` bind vào `session>/canAdministerUsers`, press handler là `BugListActions.openUserAdministration`, còn text lấy từ i18n. Không thêm domain, AppRouter route, token hoặc tooltip metadata chưa được hỗ trợ vào đây.

**Gate 6.4 release identity.** `sap.app.applicationVersion.version` is `0.0.6`, aligned with the app package and lockfile so AppRouter/HTML5 Repository can distinguish the new navigation bundle. Vietnamese: `sap.app.applicationVersion.version` là `0.0.6`, đồng bộ package và lockfile để AppRouter/HTML5 Repository phân biệt bundle navigation mới.
