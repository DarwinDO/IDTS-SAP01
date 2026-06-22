# Knowledge: `srv/service.cds`

## English

### What this file is for

This file defines the public CAP OData service contract for IDTS.

In CAP, `db/schema.cds` defines the persistence model, while `srv/service.cds` decides what the outside world can access through OData. Fiori does not talk directly to database tables. It talks to `BugService` at `/odata/v4/bug/`, and this file defines the entities, virtual fields, read models, and actions available through that service.

For a new learner, think of this file as the API menu between Fiori and the backend. If a field, entity, or action is not exposed here, the Fiori app cannot reliably bind to it or call it.

### Beginner explanation

This file answers these questions:

- Which bug data can Fiori read and edit?
- Which workflow actions can Fiori call?
- Which helper collections power value helps, such as assignable developers and valid defect categories?
- Which virtual fields exist only for UI or monitoring, such as `canClose`, `isOverdue`, or `currentActionOwnerDisplayName`?
- Which entities are read-only monitoring/read-model outputs?

The important CAP idea is “projection”. `entity Bugs as projection on db.Bugs` means `BugService.Bugs` is not a new database table. It is an API-facing view over the persistent `db.Bugs` entity, with extra calculated or virtual fields added for Fiori and PM monitoring.

### IDTS flow

1. The browser opens the Fiori app.
2. `app/bug-management-ui/webapp/manifest.json` points the frontend to `/odata/v4/bug/`.
3. CAP serves metadata generated from this `BugService`.
4. Fiori reads that metadata and builds the List Report/Object Page, fields, actions, value helps, and child tables.
5. `srv/service.js` attaches runtime handlers to the entities and actions declared here.
6. Those handlers read/write the persistent model defined in `db/schema.cds`.

### Important source anchors

- **Location**: `srv/service.cds:1`
  `using idts.cap as db from '../db/schema';`
  **IDTS concept**: Service-to-data-model link. This imports the persistent IDTS model so the service can project Bugs, Comments, Users, DeveloperResponsibilities, code lists, and child entities.
  **Impact if broken**: `BugService` cannot expose the domain model, Fiori metadata generation fails, and backend handlers lose their entity contract.
  **Must check together**: `db/schema.cds`, `srv/service.js`, all Fiori annotations importing `BugService`.

- **Location**: `srv/service.cds:4`
  `entity Bugs as projection on db.Bugs { ... }`
  **IDTS concept**: Main OData collection for bug tracking. This is the service-level shape of bugs used by List Report, Object Page, actions, comments, attachments, history, notifications, and PM monitoring.
  **Impact if broken**: The whole Fiori app can lose fields, actions, child sections, or monitoring flags. Create/edit/list/detail flows fail together because they all depend on `BugService.Bugs`.
  **Must check together**: `db/schema.cds:87` `Bugs`, `app/bug-management-ui/webapp/manifest.json` `contextPath: /Bugs`, `app/bug-management-ui/annotations/*.cds`, `srv/service.js`.

- **Location**: `srv/service.cds:6-9`
  `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
  **IDTS concept**: PM monitoring flags. These are service-level derived fields that make common monitoring filters easier for the UI.
  **Impact if broken**: PM dashboards and filters can show wrong overdue, pending assignment, rejected follow-up, or retest-required bugs.
  **Must check together**: `srv/bug-service/read-models.js`, PM monitoring tests, List Report annotations, `docs/project-context.md` PM Monitoring section.

- **Location**: `srv/service.cds:13-28`
  Virtual display and capability fields such as `currentActionOwnerDisplayName`, `canReject`, `canClose`, `canAssign`, `canAddComment`
  **IDTS concept**: UI-readable action state. CAP exposes these fields in OData, while JavaScript fills their values at read time. Fiori annotations use them to show/hide buttons and display current owner text.
  **Impact if broken**: Users can see wrong action buttons, hidden buttons may appear, valid buttons may disappear, and current owner display becomes confusing.
  **Must check together**: `srv/bug-service/read-models.js:213` and `:368`, `app/bug-management-ui/annotations/actions.cds`, `app/bug-management-ui/annotations/ownership-assignment.cds`.

- **Location**: `srv/service.cds:30-78`
  Bound actions inside `entity Bugs`
  **IDTS concept**: Public OData action contract for lifecycle operations. These actions are what Fiori buttons call; JavaScript handlers in `srv/bug-service/actions.js` implement the actual behavior.
  **Impact if broken**: Fiori action buttons can call missing or renamed actions, mandatory note/reason parameters can drift, and lifecycle tests fail.
  **Must check together**: `srv/service.js:94-147` action wiring, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/actions.cds`.

- **Location**: `srv/service.cds:120`
  `entity AssignableDevelopers { ... }`
  **IDTS concept**: Value-help read model for assigning developers. It exposes developer profile, name, email, availability, component, defect category, SAP module, and responsibility information in a UI-friendly shape.
  **Impact if broken**: The Assignee value help can show UUIDs, duplicate developers, unavailable developers, or missing responsibility context.
  **Must check together**: `srv/bug-service/read-models.js:31`, `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, Fiori value-help annotations.

- **Location**: `srv/service.cds:136`
  `@readonly entity DeveloperWorkloads { ... }`
  **IDTS concept**: PM monitoring aggregate. This is not a normal table; it is a read-only service output calculated by backend logic.
  **Impact if broken**: PM workload view can miss zero-load active developers, count wrong status buckets, or misread overloaded developers.
  **Must check together**: `srv/bug-service/monitoring.js`, PM monitoring tests, List Report or future monitoring UI annotations.

- **Location**: `srv/service.cds:187`
  `annotate BugService.Bugs with @odata.draft.enabled;`
  **IDTS concept**: Fiori draft editing. Draft support lets Fiori create/edit a temporary draft before activating the final bug.
  **Impact if broken**: Create/edit flow, attachment draft flow, and Object Page save behavior can break.
  **Must check together**: `srv/bug-service/drafts.js`, attachment handling, Fiori Object Page create/edit behavior, HTTP draft regression tests.

### Cross-folder impact

- `db/schema.cds` is the source data model. This service projects it and adds OData-facing fields/actions.
- `app/bug-management-ui/webapp/manifest.json` points Fiori to this service endpoint and `/Bugs` context path.
- Fiori annotation files under `app/bug-management-ui/annotations/` annotate entities/actions declared here; annotations cannot invent missing service fields.
- `srv/service.js` wires runtime behavior to every important entity/action declared here.
- Backend modules under `srv/bug-service/` fill virtual fields, enforce permissions, calculate monitoring read models, and implement lifecycle actions.

### Safe editing checklist

- Treat this file as a public API contract. Renaming an entity, field, or action affects Fiori, tests, and external OData clients.
- When adding a virtual field, add or update the read-model code that fills it.
- When changing an action, update `srv/service.js`, `actions.js`, Fiori action annotations, and side effects.
- When changing value-help read models, check Fiori value-help annotations and seed data.
- Keep English and Vietnamese sections equivalent.

## Vietnamese

### File này dùng để làm gì

File này định nghĩa hợp đồng OData công khai của CAP service cho IDTS.

Trong CAP, `db/schema.cds` định nghĩa data model lưu trữ, còn `srv/service.cds` quyết định phần nào được expose ra ngoài qua OData. Fiori không nói chuyện trực tiếp với database table. Fiori gọi `BugService` tại `/odata/v4/bug/`, và file này định nghĩa entity, virtual field, read model và action mà Fiori có thể dùng.

Với người mới học, hãy hiểu file này như “menu API” giữa Fiori và backend. Nếu một field, entity hoặc action không được expose ở đây, Fiori không thể bind hoặc gọi nó một cách ổn định.

### Giải thích cho người mới

File này trả lời các câu hỏi:

- Fiori có thể đọc và sửa dữ liệu bug nào?
- Fiori có thể gọi workflow action nào?
- Collection nào phục vụ value help, ví dụ assignable developers và valid defect categories?
- Virtual field nào chỉ phục vụ UI hoặc monitoring, ví dụ `canClose`, `isOverdue`, `currentActionOwnerDisplayName`?
- Entity nào là read-only output cho monitoring hoặc read model?

Ý quan trọng của CAP ở đây là “projection”. `entity Bugs as projection on db.Bugs` nghĩa là `BugService.Bugs` không phải table mới. Nó là hình dạng API-facing của entity `db.Bugs`, có thêm các field tính toán hoặc virtual field phục vụ Fiori và PM monitoring.

### Flow hoạt động trong IDTS

1. Browser mở Fiori app.
2. `app/bug-management-ui/webapp/manifest.json` trỏ frontend đến `/odata/v4/bug/`.
3. CAP trả metadata được sinh từ `BugService`.
4. Fiori đọc metadata đó để dựng List Report/Object Page, fields, actions, value helps và child tables.
5. `srv/service.js` gắn runtime handlers vào các entity và action được khai báo ở đây.
6. Các handler đó đọc/ghi persistent model trong `db/schema.cds`.

### Important source anchors

- **Vị trí**: `srv/service.cds:1`
  `using idts.cap as db from '../db/schema';`
  **Khái niệm IDTS**: Liên kết service với data model. Dòng này import persistent model của IDTS để service có thể project Bugs, Comments, Users, DeveloperResponsibilities, code lists và child entities.
  **Ảnh hưởng nếu sai**: `BugService` không expose được domain model, Fiori metadata generation fail, và backend handlers mất entity contract.
  **Phải kiểm tra cùng**: `db/schema.cds`, `srv/service.js`, tất cả Fiori annotations import `BugService`.

- **Vị trí**: `srv/service.cds:4`
  `entity Bugs as projection on db.Bugs { ... }`
  **Khái niệm IDTS**: OData collection chính cho bug tracking. Đây là hình dạng service-level của bug mà List Report, Object Page, actions, comments, attachments, history, notifications và PM monitoring đều dùng.
  **Ảnh hưởng nếu sai**: Toàn bộ Fiori app có thể mất fields, actions, child sections hoặc monitoring flags. Create/edit/list/detail flows đều có thể hỏng vì phụ thuộc `BugService.Bugs`.
  **Phải kiểm tra cùng**: `db/schema.cds:87` `Bugs`, `app/bug-management-ui/webapp/manifest.json` `contextPath: /Bugs`, `app/bug-management-ui/annotations/*.cds`, `srv/service.js`.

- **Vị trí**: `srv/service.cds:6-9`
  `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
  **Khái niệm IDTS**: Các flag phục vụ PM monitoring. Đây là derived fields ở service layer giúp UI lọc các nhóm bug thường gặp.
  **Ảnh hưởng nếu sai**: PM dashboard và filter có thể hiển thị sai bug overdue, pending assignment, rejected follow-up hoặc retest required.
  **Phải kiểm tra cùng**: `srv/bug-service/read-models.js`, PM monitoring tests, List Report annotations, phần PM Monitoring trong `docs/project-context.md`.

- **Vị trí**: `srv/service.cds:13-28`
  Các virtual display và capability fields như `currentActionOwnerDisplayName`, `canReject`, `canClose`, `canAssign`, `canAddComment`
  **Khái niệm IDTS**: Trạng thái action mà UI có thể đọc. CAP expose các field này qua OData, còn JavaScript fill giá trị khi đọc. Fiori annotation dùng chúng để ẩn/hiện button và hiển thị current owner.
  **Ảnh hưởng nếu sai**: User có thể thấy sai nút action, nút cần ẩn lại hiện, nút hợp lệ lại biến mất, hoặc current owner hiển thị khó hiểu.
  **Phải kiểm tra cùng**: `srv/bug-service/read-models.js:213` và `:368`, `app/bug-management-ui/annotations/actions.cds`, `app/bug-management-ui/annotations/ownership-assignment.cds`.

- **Vị trí**: `srv/service.cds:30-78`
  Các bound actions bên trong `entity Bugs`
  **Khái niệm IDTS**: Hợp đồng OData công khai cho lifecycle operations. Đây là các action mà Fiori buttons gọi; JavaScript handlers trong `srv/bug-service/actions.js` implement hành vi thật.
  **Ảnh hưởng nếu sai**: Fiori action buttons có thể gọi action bị thiếu hoặc đổi tên, parameter note/reason có thể lệch, và lifecycle tests fail.
  **Phải kiểm tra cùng**: `srv/service.js:94-147` action wiring, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/actions.cds`.

- **Vị trí**: `srv/service.cds:120`
  `entity AssignableDevelopers { ... }`
  **Khái niệm IDTS**: Read model cho value help chọn Developer. Nó expose developer profile, name, email, availability, component, defect category, SAP module và responsibility dưới dạng dễ dùng cho UI.
  **Ảnh hưởng nếu sai**: Value help Assignee có thể hiện UUID, duplicate Developer, Developer unavailable hoặc thiếu context responsibility.
  **Phải kiểm tra cùng**: `srv/bug-service/read-models.js:31`, `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, Fiori value-help annotations.

- **Vị trí**: `srv/service.cds:136`
  `@readonly entity DeveloperWorkloads { ... }`
  **Khái niệm IDTS**: Aggregate phục vụ PM monitoring. Đây không phải table bình thường; nó là output read-only được backend tính toán.
  **Ảnh hưởng nếu sai**: PM workload view có thể thiếu Developer active đang có 0 bug, đếm sai status bucket hoặc đánh giá sai Developer overloaded.
  **Phải kiểm tra cùng**: `srv/bug-service/monitoring.js`, PM monitoring tests, List Report hoặc future monitoring UI annotations.

- **Vị trí**: `srv/service.cds:187`
  `annotate BugService.Bugs with @odata.draft.enabled;`
  **Khái niệm IDTS**: Fiori draft editing. Draft cho phép Fiori tạo/sửa dữ liệu tạm trước khi activate thành bug chính thức.
  **Ảnh hưởng nếu sai**: Create/edit flow, attachment draft flow và Object Page save behavior có thể hỏng.
  **Phải kiểm tra cùng**: `srv/bug-service/drafts.js`, attachment handling, Fiori Object Page create/edit behavior, HTTP draft regression tests.

### Liên kết với file khác

- `db/schema.cds` là data model gốc. Service này project model đó và thêm các field/action phục vụ OData.
- `app/bug-management-ui/webapp/manifest.json` trỏ Fiori đến endpoint service này và context path `/Bugs`.
- Các annotation dưới `app/bug-management-ui/annotations/` annotate entity/action được khai báo ở đây; annotation không thể tự tạo field thiếu trong service.
- `srv/service.js` gắn runtime behavior vào các entity/action quan trọng được khai báo ở đây.
- Các module dưới `srv/bug-service/` fill virtual fields, enforce permissions, tính monitoring read models và implement lifecycle actions.

### Lưu ý khi sửa file này

- Xem file này như public API contract. Đổi tên entity, field hoặc action sẽ ảnh hưởng Fiori, tests và OData clients.
- Khi thêm virtual field, phải thêm hoặc cập nhật read-model code để fill giá trị.
- Khi đổi action, cập nhật `srv/service.js`, `actions.js`, Fiori action annotations và side effects.
- Khi đổi value-help read model, kiểm tra Fiori value-help annotations và seed data.
- Giữ English và Vietnamese tương đương nhau.

## Metadata

- Source file: `srv/service.cds`
- Knowledge mirror: `docs/knowledge/srv/service.cds.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-06-22
