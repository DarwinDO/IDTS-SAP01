# WP2/WP3/WP4 CAP and Fiori Implementation Notes

## English

This note explains the implementation added for WP2 Service and Value Help, WP3 Handler Rules and Validation, and the next WP4 Fiori Elements improvements.

### Files Changed

- `srv/service.cds`
- `srv/service.js`
- `app/bug-management-ui/annotations.cds`

### `srv/service.cds`

`srv/service.cds` defines the OData V4 service contract exposed by CAP.

Before this change, `BugService.Bugs` was only a projection. That meant the UI could read and edit bug data, but there were no business actions such as reject, request information, resolve, or reopen.

The `Bugs` projection now has bound actions:

- `assignToDeveloper`
- `moveToPendingAssignment`
- `markInReview`
- `requestMoreInformation`
- `rejectBug`
- `startProgress`
- `resolveBug`
- `sendToRetest`
- `closeBug`
- `reopenBug`

A bound action is an OData operation executed on one specific entity instance. In IDTS, that means the user triggers the action from one bug record.

Example:

- The user opens bug `BUG-0004`.
- The user clicks `Reject Bug`.
- Fiori calls a bound OData action on that exact bug.
- CAP handler updates status, reason, next processor, history, and notification.

The `assignToDeveloper` action parameter `assigneeID` also has a `Common.ValueList` annotation in `service.cds`. This allows Fiori Elements to show a value help for choosing a Developer Profile instead of forcing the user to type a UUID manually.

### `srv/service.js`

`srv/service.js` is the CAP Node.js service implementation. CAP automatically attaches this file to `BugService` because it has the same basename as `srv/service.cds`.

The file exports a class:

```js
module.exports = class BugService extends cds.ApplicationService {
  async init () {
    // event registrations
  }
}
```

This is a standard CAP Node.js pattern. `init()` is where handlers are registered.

#### Constants

The top part defines constants:

- `STATUS`: status codes from `StatusValues`.
- `PROCESSOR_ROLE`: next processor role/queue codes.
- `ACTION`: history action type codes.
- `EVENT`: notification event type codes.
- `ALLOWED_TRANSITIONS`: backend status transition matrix.
- `DEVELOPER_STATUSES`: statuses where the assigned developer should act next.
- `TESTER_STATUSES`: statuses where the tester should act next.

These constants keep handler logic readable and avoid scattering magic strings through the file.

#### Create and Update Handlers

These handlers run before and after direct OData create/update:

```js
this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))
```

The `before` handlers protect data consistency before the record is saved:

- Generate `bugNumber` if missing.
- Default reporter to the first active Tester in local demo mode if missing.
- Validate mandatory fields.
- Derive `componentCategory_ID` from `applicationComponent_ID` and `defectCategory_ID`.
- Validate assigned developer responsibility.
- Validate status transition.
- Enforce rejection reason for `Rejected`.
- Automatically set `nextProcessorUser_ID` and `nextProcessorRole_code`.

The `after` handlers create audit side effects:

- Create a `HistoryLogs` entry after bug creation.
- Create `HistoryLogs` entries after important updates.
- Create `Notifications` when status changes require attention.

#### Action Handlers

Action handlers implement business buttons:

```js
this.on('rejectBug', req => transitionBug(...))
this.on('resolveBug', req => transitionBug(...))
```

Most actions call the shared helper `transitionBug()`. This keeps behavior consistent:

- Read current bug.
- Check required reason or assignee.
- Validate allowed status transition.
- Apply status/assignee/rejection changes.
- Recalculate next processor.
- Update the bug.
- Write history.
- Write notification when needed.
- Return the updated bug to Fiori.

`assignToDeveloper()` is separate because it must read an `assigneeID` action parameter and validate that developer against `DeveloperResponsibilities`.

#### Component Category Derivation

`deriveOrValidateComponentCategory()` implements the agreed IDTS model:

- Tester selects Application Component.
- Tester selects Defect Category.
- Backend finds the valid `ComponentCategories` record for that pair.

This means users do not need to understand or manually enter the internal assignment key.

#### Assignment Validation

`validateAssignee()` checks:

- Developer profile exists.
- Developer profile is active.
- Developer is not `UNAVAILABLE`.
- Developer has an active `DeveloperResponsibility` for the bug's Component Category.
- If SAP Module is selected, the responsibility must either be general or match that SAP Module.

This is important because UI filtering is helpful but not enough. Backend validation prevents invalid assignment through raw OData calls.

#### Next Processor Calculation

`determineNextProcessor()` applies the ownership rule:

- `Assigned`, `In Review`, `In Progress`, `Reopened`: assigned developer acts next.
- `Need More Information`, `Rejected`, `Resolved`, `Retest Required`: tester acts next.
- `Pending Assignment`: PM acts next.
- `Closed`: no next processor.

This keeps `nextProcessor` system-maintained instead of making users manually maintain it.

#### History and Notification

`writeHistory()` writes immutable audit entries to `HistoryLogs`.

`writeNotificationForStatus()` creates in-app notification records for key events:

- Assigned.
- Need More Information.
- Rejected.
- Closed.

The implementation creates notification records only. It does not send real email, Teams, Slack, or SAP BTP notification messages yet. Real external delivery remains a later integration topic.

### `app/bug-management-ui/annotations.cds`

This file was extended in two major ways.

#### Object Page Actions

`UI.Identification` now adds Object Page action buttons:

- Assign Developer.
- Move to Pending Assignment.
- Mark In Review.
- Request More Information.
- Reject Bug.
- Start Progress.
- Resolve Bug.
- Send to Retest.
- Close Bug.
- Reopen Bug.

Fiori Elements reads these annotations and renders action buttons on the Object Page header/overflow area.

#### Value Help

The file now adds `Common.ValueList` annotations to the generated foreign-key properties of managed associations using CAP's managed-association FK annotation syntax:

```cds
annotate service.Bugs:status.code with @Common.ValueList : { ... };
annotate service.Bugs:applicationComponent.ID with @Common.ValueList : { ... };
```

This syntax matters because generated fields like `status_code` and `applicationComponent_ID` cannot be directly annotated in a normal `annotate service.Bugs with { ... }` block without compiler warnings.

Value helps were added for:

- Status.
- Priority.
- Severity.
- Environment.
- SAP Module.
- Application Component.
- Defect Category.
- Assignee / Assignable Developer.
- Reporter.
- Next Processor Role.

The Assignee value help uses `DeveloperResponsibilities` as the value list so Fiori can show developers in the context of their responsibility mapping. Backend validation remains the final authority.

#### Value Help Dialog Columns

The supporting value-list entities also received `UI.LineItem` and `UI.SelectionFields` annotations. This makes value-help dialogs show useful columns such as code, name, component type, category type, developer name, availability, and responsibility level.

### Current Limitations

- Fiori dependent value help can filter assignee by `componentCategory_ID` after the bug has a derived Component Category. During initial create, the backend still derives and validates the assignment key after save.
- `assignToDeveloper` parameter value help currently lists Developer Profiles; backend validates responsibility after selection.
- Real file upload/storage is not implemented yet; attachment metadata remains the MVP behavior.
- Notifications are persisted as records but not delivered externally.
- Authorization is still mock/local; real XSUAA role enforcement is a later deployment topic.

## Vietnamese

Ghi chú này giải thích phần implementation vừa thêm cho WP2 Service and Value Help, WP3 Handler Rules and Validation, và phần cải thiện tiếp theo của WP4 Fiori Elements.

### Các File Đã Chỉnh

- `srv/service.cds`
- `srv/service.js`
- `app/bug-management-ui/annotations.cds`

### `srv/service.cds`

`srv/service.cds` định nghĩa service contract OData V4 được CAP expose.

Trước thay đổi này, `BugService.Bugs` chỉ là projection. Nghĩa là UI có thể đọc và sửa dữ liệu bug, nhưng chưa có action nghiệp vụ như reject, request information, resolve hoặc reopen.

Projection `Bugs` hiện có các bound action:

- `assignToDeveloper`
- `moveToPendingAssignment`
- `markInReview`
- `requestMoreInformation`
- `rejectBug`
- `startProgress`
- `resolveBug`
- `sendToRetest`
- `closeBug`
- `reopenBug`

Bound action là một operation OData chạy trên một record cụ thể. Trong IDTS, nghĩa là user trigger action từ một bug cụ thể.

Ví dụ:

- User mở bug `BUG-0004`.
- User bấm `Reject Bug`.
- Fiori gọi bound OData action trên đúng bug đó.
- CAP handler cập nhật status, reason, next processor, history và notification.

Parameter `assigneeID` của action `assignToDeveloper` cũng có annotation `Common.ValueList` trong `service.cds`. Điều này giúp Fiori Elements hiện value help để chọn Developer Profile thay vì bắt user nhập UUID thủ công.

### `srv/service.js`

`srv/service.js` là implementation CAP Node.js cho service. CAP tự attach file này vào `BugService` vì file có cùng basename với `srv/service.cds`.

File export một class:

```js
module.exports = class BugService extends cds.ApplicationService {
  async init () {
    // event registrations
  }
}
```

Đây là pattern chuẩn của CAP Node.js. `init()` là nơi đăng ký handler.

#### Constants

Phần đầu file định nghĩa các constant:

- `STATUS`: mã status từ `StatusValues`.
- `PROCESSOR_ROLE`: mã role/queue của next processor.
- `ACTION`: mã action type cho history.
- `EVENT`: mã event type cho notification.
- `ALLOWED_TRANSITIONS`: ma trận chuyển status ở backend.
- `DEVELOPER_STATUSES`: các status mà developer được assign cần xử lý tiếp.
- `TESTER_STATUSES`: các status mà tester cần xử lý tiếp.

Các constant này giúp logic handler dễ đọc và tránh rải magic string khắp file.

#### Create và Update Handlers

Các handler này chạy trước và sau khi OData create/update trực tiếp:

```js
this.before('CREATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: true }))
this.before('UPDATE', Bugs, req => prepareBugWrite(req, entities, { isCreate: false }))
this.after('CREATE', Bugs, (data, req) => recordCreateSideEffects(req, data, entities))
this.after('UPDATE', Bugs, (data, req) => recordUpdateSideEffects(req, entities))
```

`before` handler bảo vệ tính nhất quán dữ liệu trước khi record được lưu:

- Sinh `bugNumber` nếu thiếu.
- Default reporter thành Tester active đầu tiên trong local demo nếu thiếu.
- Validate field bắt buộc.
- Derive `componentCategory_ID` từ `applicationComponent_ID` và `defectCategory_ID`.
- Validate Developer Responsibility của assignee.
- Validate status transition.
- Bắt buộc có rejection reason cho `Rejected`.
- Tự set `nextProcessorUser_ID` và `nextProcessorRole_code`.

`after` handler tạo side effect audit:

- Tạo `HistoryLogs` sau khi tạo bug.
- Tạo `HistoryLogs` sau các update quan trọng.
- Tạo `Notifications` khi status đổi và cần người khác chú ý.

#### Action Handlers

Action handler implement các nút nghiệp vụ:

```js
this.on('rejectBug', req => transitionBug(...))
this.on('resolveBug', req => transitionBug(...))
```

Phần lớn action gọi helper chung `transitionBug()`. Nhờ vậy behavior nhất quán:

- Đọc bug hiện tại.
- Kiểm tra reason hoặc assignee bắt buộc.
- Validate status transition hợp lệ.
- Áp dụng thay đổi status/assignee/rejection.
- Tính lại next processor.
- Update bug.
- Ghi history.
- Ghi notification khi cần.
- Trả bug đã update về cho Fiori.

`assignToDeveloper()` tách riêng vì action này cần đọc parameter `assigneeID` và validate developer đó với `DeveloperResponsibilities`.

#### Derive Component Category

`deriveOrValidateComponentCategory()` implement model IDTS đã thống nhất:

- Tester chọn Application Component.
- Tester chọn Defect Category.
- Backend tìm record `ComponentCategories` hợp lệ cho cặp đó.

Nhờ vậy user không cần hiểu hoặc nhập thủ công assignment key nội bộ.

#### Validate Assignment

`validateAssignee()` kiểm tra:

- Developer profile tồn tại.
- Developer profile active.
- Developer không ở trạng thái `UNAVAILABLE`.
- Developer có `DeveloperResponsibility` active cho Component Category của bug.
- Nếu bug có SAP Module, responsibility phải là general hoặc match SAP Module đó.

Điều này quan trọng vì UI filtering chỉ hỗ trợ user, nhưng chưa đủ an toàn. Backend validation ngăn assign sai kể cả khi user gọi raw OData.

#### Tính Next Processor

`determineNextProcessor()` áp dụng rule ownership:

- `Assigned`, `In Review`, `In Progress`, `Reopened`: developer được assign xử lý tiếp.
- `Need More Information`, `Rejected`, `Resolved`, `Retest Required`: tester xử lý tiếp.
- `Pending Assignment`: PM xử lý tiếp.
- `Closed`: không còn next processor.

Điều này giúp `nextProcessor` được hệ thống duy trì, không bắt user tự nhập thủ công.

#### History và Notification

`writeHistory()` ghi audit entry bất biến vào `HistoryLogs`.

`writeNotificationForStatus()` tạo notification record trong app cho các event chính:

- Assigned.
- Need More Information.
- Rejected.
- Closed.

Implementation hiện chỉ tạo notification record. Nó chưa gửi email, Teams, Slack hoặc SAP BTP notification thật. External delivery vẫn là phần tích hợp sau.

### `app/bug-management-ui/annotations.cds`

File này được mở rộng theo hai hướng chính.

#### Object Page Actions

`UI.Identification` hiện thêm các nút action trên Object Page:

- Assign Developer.
- Move to Pending Assignment.
- Mark In Review.
- Request More Information.
- Reject Bug.
- Start Progress.
- Resolve Bug.
- Send to Retest.
- Close Bug.
- Reopen Bug.

Fiori Elements đọc annotation này và render button action trên header/overflow của Object Page.

#### Value Help

File này hiện thêm annotation `Common.ValueList` cho các foreign-key property được CAP sinh ra từ managed association bằng cú pháp annotate FK path của CAP:

```cds
annotate service.Bugs:status.code with @Common.ValueList : { ... };
annotate service.Bugs:applicationComponent.ID with @Common.ValueList : { ... };
```

Cú pháp này quan trọng vì các field generated như `status_code` và `applicationComponent_ID` không nên annotate trực tiếp trong block `annotate service.Bugs with { ... }`; nếu làm vậy CAP compiler sẽ báo warning.

Value help được thêm cho:

- Status.
- Priority.
- Severity.
- Environment.
- SAP Module.
- Application Component.
- Defect Category.
- Assignee / Assignable Developer.
- Reporter.
- Next Processor Role.

Value help của Assignee dùng `DeveloperResponsibilities` làm value list để Fiori có thể hiển thị developer theo mapping trách nhiệm. Backend validation vẫn là nguồn kiểm tra cuối cùng.

#### Cột Trong Value Help Dialog

Các entity hỗ trợ value list cũng được thêm `UI.LineItem` và `UI.SelectionFields`. Nhờ vậy value-help dialog hiển thị các cột có ý nghĩa như code, name, component type, category type, developer name, availability và responsibility level.

### 2026-06-04 Fiori Create Button and Draft Support

English:

Fiori Elements OData V4 standard create/edit behavior uses draft choreography. CAP could already accept a manual `POST /odata/v4/bug/Bugs`, but the Fiori toolbar Create button did not appear until `BugService.Bugs` was marked with `@odata.draft.enabled`.

The current MVP implementation therefore adds:

- `@odata.draft.enabled` on `BugService.Bugs` in `srv/service.cds`.
- `Capabilities.InsertRestrictions.Insertable : true` in `app/bug-management-ui/annotations.cds`.
- `CreationDialog` in `manifest.json`.
- `UI.FieldGroup#CreateBug` for the dialog fields.
- `enhanceI18n` plus create-dialog i18n keys so the dialog title can display **Create Bug**.

This keeps the UI mostly Fiori-standard. The tradeoff is that draft introduces Fiori draft concepts such as `IsActiveEntity`, `draftActivate`, and draft lifecycle requests. Backend handlers must be tested carefully when create/edit validation becomes deeper.

Vietnamese:

Fiori Elements OData V4 dùng draft choreography cho hành vi create/edit chuẩn. CAP vốn đã nhận được `POST /odata/v4/bug/Bugs` thủ công, nhưng toolbar Create button của Fiori không xuất hiện cho tới khi `BugService.Bugs` được đánh dấu `@odata.draft.enabled`.

Implementation MVP hiện tại vì vậy thêm:

- `@odata.draft.enabled` trên `BugService.Bugs` trong `srv/service.cds`.
- `Capabilities.InsertRestrictions.Insertable : true` trong `app/bug-management-ui/annotations.cds`.
- `CreationDialog` trong `manifest.json`.
- `UI.FieldGroup#CreateBug` cho các field trong dialog.
- `enhanceI18n` cùng các key i18n của create dialog để title dialog hiển thị **Create Bug**.

Cách này giữ UI đi theo chuẩn Fiori nhiều nhất có thể. Tradeoff là draft đưa thêm các khái niệm Fiori như `IsActiveEntity`, `draftActivate`, và draft lifecycle request. Backend handler cần được test kỹ khi validation create/edit được làm sâu hơn.

### Hạn Chế Hiện Tại

- Dependent value help của Fiori có thể filter assignee theo `componentCategory_ID` sau khi bug đã có Component Category được derive. Trong lúc create ban đầu, backend vẫn derive và validate assignment key sau khi save.
- Value help của parameter `assignToDeveloper` hiện list Developer Profiles; backend validate responsibility sau khi chọn.
- Chưa implement upload/storage file thật; attachment metadata vẫn là scope MVP.
- Notification mới được lưu thành record, chưa gửi ra kênh ngoài.
- Authorization vẫn là mock/local; role enforcement bằng XSUAA thật là phần sau khi deploy.
