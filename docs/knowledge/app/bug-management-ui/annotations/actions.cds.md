# Knowledge: `app/bug-management-ui/annotations/actions.cds`

> **Ownership / debug anchor:** SangVN owns Fiori action placement (backup: DatDT). Trace a pressed action from this metadata to its UI5 extension, then to the CAP handler that still authorizes it.
> **Ownership / điểm debug:** SangVN sở hữu vị trí action Fiori (backup: DatDT). Trace action được nhấn từ metadata này tới UI5 extension, rồi tới CAP handler vẫn kiểm quyền.

## English

### What this file is for

This file tells Fiori Elements how to display IDTS bug action buttons and how to refresh the page after those actions run.

The backend actions are declared in `srv/service.cds` and implemented in `srv/bug-service/actions.js`. This annotation file is the Fiori layer that turns those backend actions into Object Page buttons such as Reject Bug, Resolve Bug, Close Bug, Reopen Bug, and Add Comment.

For a new SAP/Fiori learner, this file does not implement business logic. It describes UI behavior using metadata. Fiori reads this metadata and generates buttons without a custom UI5 controller.

### Beginner explanation

Fiori Elements is metadata-driven. That means the app can render many UI parts from CDS annotations:

- `UI.DataFieldForAction` creates a button for a CAP action.
- `Action : 'BugService.rejectBug'` tells Fiori which OData action to call.
- `![@UI.Hidden]` controls whether the button is visible.
- `canReject`, `canResolve`, `canClose`, and other `canXXX` fields come from the backend read model.
- `Common.SideEffects` tells Fiori what fields or child tables to reload after the action completes.

So this file is the bridge between backend workflow actions and the generated Fiori UI.

### IDTS flow

1. `srv/service.cds` declares bound actions on `BugService.Bugs`.
2. This file annotates those actions as Fiori buttons.
3. Fiori renders the buttons on the Object Page.
4. User clicks a button.
5. Fiori calls the corresponding OData action.
6. `srv/service.js` routes the call to `srv/bug-service/actions.js`.
7. After success, `Common.SideEffects` tells Fiori to refresh status, assignee, next processor, capability fields, history, notifications, comments, or attachments.

### Important source anchors

- **Location**: `app/bug-management-ui/annotations/actions.cds:1`
  `using BugService as service from '../../../srv/service';`
  **IDTS concept**: UI annotations target the CAP service, not the database directly. This imports `BugService` so Fiori metadata can annotate `service.Bugs` and its bound actions.
  **Impact if broken**: Fiori cannot attach these action annotations to the service, so buttons and side effects may disappear from generated metadata.
  **Must check together**: `srv/service.cds`, `app/bug-management-ui/annotations.cds`, Fiori metadata compile.

- **Location**: `app/bug-management-ui/annotations/actions.cds:6-63`
  `UI.DataFieldForAction` entries for lifecycle buttons
  **IDTS concept**: Object Page lifecycle actions. These entries create buttons such as Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Resolve Bug, Close Bug, and Reopen Bug.
  **Impact if broken**: Users may lose the correct workflow entry points or see buttons that do not match the backend lifecycle.
  **Must check together**: `srv/service.cds:68-78` action declarations, `srv/service.js:96-147` action wiring, `srv/bug-service/actions.js:184` transition logic.

- **Location**: `app/bug-management-ui/annotations/actions.cds:8`, `:14`, `:20`, `:26`, `:32`, `:38`, `:44`, `:50`, `:56`, `:62`
  `Action : 'BugService.<actionName>'`
  **IDTS concept**: OData action binding. Each button points to the exact backend action name.
  **Impact if broken**: A button can render but fail when clicked, or call the wrong workflow operation.
  **Must check together**: `srv/service.cds` bound action names, `srv/service.js` `this.on(...)` handlers, backend action tests.

- **Location**: `app/bug-management-ui/annotations/actions.cds:9`, `:15`, `:21`, `:27`, `:33`, `:39`, `:45`, `:51`, `:57`, `:63`
  `![@UI.Hidden] : {$edmJson : {$Not : {$Path : 'canXXX' } } }`
  **IDTS concept**: Backend-driven action visibility. Fiori hides or shows buttons based on capability fields calculated by the backend, such as `canReject` or `canClose`.
  **Impact if broken**: Users can see invalid buttons, miss valid buttons, or experience UI/backend mismatch. Backend permission still protects the server, but the UI becomes confusing.
  **Must check together**: `srv/service.cds:16-27` `canXXX` virtual fields, `srv/bug-service/read-models.js:368` capability enrichment, `srv/bug-service/permissions.js`.

- **Location**: `app/bug-management-ui/annotations/actions.cds:67-82`
  `UI.Identification #CommentAction` and `Action : 'BugService.addComment'`
  **IDTS concept**: Contextual Add Comment action. It exposes the comment action near the Comments section while hiding it for draft-only states where it should not run.
  **Impact if broken**: Users may not find the Add Comment entry point, or comments may be attempted in invalid draft state.
  **Must check together**: `srv/service.cds:30` `addComment`, `srv/bug-service/actions.js:139`, Comments facet/table annotations, comment/history tests.

- **Location**: `app/bug-management-ui/annotations/actions.cds:91-438`
  `@Common.SideEffects` blocks for bound actions
  **IDTS concept**: Fiori refresh contract after backend action changes data. Lifecycle actions change status, assignee, next processor, capability booleans, history, notifications, and sometimes comments. Side effects tell Fiori what to reload. We use `TargetEntities: [in]` (and related paths like `'in/historyEvents'`) to force Fiori Elements V4 to fully refresh the bound entity instead of flat `TargetProperties`, which caused stale Object Page issues (IDTS-13).
  **Impact if broken**: Backend changes may succeed, but the Object Page can still show stale status/buttons/history until manual reload. This was a real class of UI issue in IDTS.
  **Must check together**: `srv/bug-service/actions.js`, `srv/bug-service/read-models.js`, Object Page sections, browser lifecycle refresh tests.

- **Location**: `app/bug-management-ui/annotations/actions.cds:441-447`
  `Common.SideEffects #AttachmentRowsRefresh` and `#AssigneeDisplayNameRefresh`
  **IDTS concept**: Local refresh rules for attachment and assignee display. These keep child rows and readable owner fields synchronized after related changes.
  **Impact if broken**: Attachment rows or assignee/current owner display can stay stale after upload or assignment changes.
  **Must check together**: attachment Object Page facet, `srv/bug-service/read-models.js:213` display enrichment, attachment/comment HTTP tests.

### Cross-folder impact

- `srv/service.cds` must expose every action and virtual `canXXX` field referenced here.
- `srv/bug-service/actions.js` implements the behavior behind the buttons.
- `srv/bug-service/read-models.js` fills capability and display fields that this file uses for visibility and refresh.
- `db/schema.cds` stores the fields affected by actions, such as status, assignee, next processor, comments, history, notifications, and attachments.
- Object Page annotations decide where the actions and child sections appear; this file controls the action behavior metadata.

### Safe editing checklist

- Do not add a Fiori action button unless the action exists in `srv/service.cds` and is wired in `srv/service.js`.
- Keep `@UI.Hidden` conditions aligned with backend capability fields and permission rules.
- When backend action changes more fields, update `Common.SideEffects` so the page refreshes correctly.
- If users report stale status/buttons after an action, check this file before writing custom UI5 code.
- Keep English and Vietnamese explanations equivalent.

## Vietnamese

### File này dùng để làm gì

File này nói cho Fiori Elements biết cần hiển thị các nút action của bug như thế nào và cần refresh trang ra sao sau khi action chạy xong.

Backend actions được khai báo trong `srv/service.cds` và được implement trong `srv/bug-service/actions.js`. File annotation này là lớp Fiori biến các backend actions đó thành button trên Object Page, ví dụ Reject Bug, Resolve Bug, Close Bug, Reopen Bug và Add Comment.

Với người mới học SAP/Fiori, file này không implement nghiệp vụ. Nó mô tả hành vi UI bằng metadata. Fiori đọc metadata này và tự generate button mà không cần custom UI5 controller.

### Giải thích cho người mới

Fiori Elements hoạt động dựa trên metadata. Nghĩa là app có thể render nhiều phần UI từ CDS annotations:

- `UI.DataFieldForAction` tạo button cho một CAP action.
- `Action : 'BugService.rejectBug'` nói cho Fiori biết cần gọi OData action nào.
- `![@UI.Hidden]` điều khiển button có hiện hay không.
- `canReject`, `canResolve`, `canClose` và các field `canXXX` khác đến từ backend read model.
- `Common.SideEffects` nói cho Fiori biết cần reload field hoặc child table nào sau khi action hoàn tất.

Vì vậy file này là cầu nối giữa backend workflow actions và UI Fiori được generate.

### Flow hoạt động trong IDTS

1. `srv/service.cds` khai báo bound actions trên `BugService.Bugs`.
2. File này annotate các action đó thành Fiori buttons.
3. Fiori render buttons trên Object Page.
4. User bấm button.
5. Fiori gọi OData action tương ứng.
6. `srv/service.js` route call đó tới `srv/bug-service/actions.js`.
7. Sau khi backend chạy thành công, `Common.SideEffects` nói cho Fiori refresh status, assignee, next processor, capability fields, history, notifications, comments hoặc attachments.

### Important source anchors

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:1`
  `using BugService as service from '../../../srv/service';`
  **Khái niệm IDTS**: UI annotations target CAP service, không target database trực tiếp. Dòng này import `BugService` để Fiori metadata có thể annotate `service.Bugs` và các bound actions.
  **Ảnh hưởng nếu sai**: Fiori không gắn được action annotations vào service, nên buttons và side effects có thể biến mất khỏi generated metadata.
  **Phải kiểm tra cùng**: `srv/service.cds`, `app/bug-management-ui/annotations.cds`, Fiori metadata compile.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:6-63`
  Các entry `UI.DataFieldForAction` cho lifecycle buttons
  **Khái niệm IDTS**: Lifecycle actions trên Object Page. Các entry này tạo buttons như Move to Pending Assignment, Mark In Review, Request More Information, Reject Bug, Resolve Bug, Close Bug và Reopen Bug.
  **Ảnh hưởng nếu sai**: User có thể mất entry point workflow đúng, hoặc thấy button không khớp backend lifecycle.
  **Phải kiểm tra cùng**: `srv/service.cds:68-78` action declarations, `srv/service.js:96-147` action wiring, `srv/bug-service/actions.js:184` transition logic.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:8`, `:14`, `:20`, `:26`, `:32`, `:38`, `:44`, `:50`, `:56`, `:62`
  `Action : 'BugService.<actionName>'`
  **Khái niệm IDTS**: Binding tới OData action. Mỗi button trỏ đúng tên backend action.
  **Ảnh hưởng nếu sai**: Button có thể render nhưng fail khi bấm, hoặc gọi sai workflow operation.
  **Phải kiểm tra cùng**: Tên bound action trong `srv/service.cds`, các handler `this.on(...)` trong `srv/service.js`, backend action tests.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:9`, `:15`, `:21`, `:27`, `:33`, `:39`, `:45`, `:51`, `:57`, `:63`
  `![@UI.Hidden] : {$edmJson : {$Not : {$Path : 'canXXX' } } }`
  **Khái niệm IDTS**: Ẩn/hiện action dựa trên backend. Fiori ẩn hoặc hiện button dựa trên capability fields được backend tính, ví dụ `canReject` hoặc `canClose`.
  **Ảnh hưởng nếu sai**: User có thể thấy button không hợp lệ, mất button hợp lệ, hoặc gặp mismatch giữa UI và backend. Backend permission vẫn bảo vệ server, nhưng UI sẽ gây hiểu nhầm.
  **Phải kiểm tra cùng**: `srv/service.cds:16-27` virtual fields `canXXX`, `srv/bug-service/read-models.js:368` capability enrichment, `srv/bug-service/permissions.js`.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:67-82`
  `UI.Identification #CommentAction` và `Action : 'BugService.addComment'`
  **Khái niệm IDTS**: Add Comment action theo ngữ cảnh. Nó expose action comment gần Comments section và ẩn khi đang ở draft-only state không nên chạy action này.
  **Ảnh hưởng nếu sai**: User có thể không tìm thấy chỗ Add Comment, hoặc comment bị gọi ở trạng thái draft không hợp lệ.
  **Phải kiểm tra cùng**: `srv/service.cds:30` `addComment`, `srv/bug-service/actions.js:139`, annotations cho Comments facet/table, comment/history tests.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:91-438`
  Các block `@Common.SideEffects` cho bound actions
  **Khái niệm IDTS**: Hợp đồng refresh của Fiori sau khi backend action đổi dữ liệu. Lifecycle actions đổi status, assignee, next processor, capability booleans, history, notifications và đôi khi comments. Side effects nói cho Fiori biết cần reload gì. Chúng ta sử dụng `TargetEntities: [in]` (và các path con như `'in/historyEvents'`) để buộc Fiori Elements V4 tải lại toàn bộ bound entity; tránh dùng `TargetProperties` phẳng từng gây ra lỗi stale Object Page (IDTS-13).
  **Ảnh hưởng nếu sai**: Backend đã đổi dữ liệu thành công nhưng Object Page vẫn hiển thị status/buttons/history cũ cho đến khi user reload thủ công. Đây từng là một nhóm lỗi UI thật trong IDTS.
  **Phải kiểm tra cùng**: `srv/bug-service/actions.js`, `srv/bug-service/read-models.js`, các Object Page sections, browser lifecycle refresh tests.

- **Vị trí**: `app/bug-management-ui/annotations/actions.cds:441-447`
  `Common.SideEffects #AttachmentRowsRefresh` và `#AssigneeDisplayNameRefresh`
  **Khái niệm IDTS**: Rule refresh cục bộ cho attachment và assignee display. Chúng giữ child rows và field owner dễ đọc đồng bộ sau khi dữ liệu liên quan đổi.
  **Ảnh hưởng nếu sai**: Attachment rows hoặc assignee/current owner display có thể bị stale sau upload hoặc assignment changes.
  **Phải kiểm tra cùng**: Attachment facet trên Object Page, `srv/bug-service/read-models.js:213` display enrichment, attachment/comment HTTP tests.

### Liên kết với file khác

- `srv/service.cds` phải expose mọi action và virtual field `canXXX` mà file này reference.
- `srv/bug-service/actions.js` implement hành vi thật phía sau các button.
- `srv/bug-service/read-models.js` fill capability và display fields mà file này dùng để ẩn/hiện và refresh.
- `db/schema.cds` lưu các field bị action ảnh hưởng, như status, assignee, next processor, comments, history, notifications và attachments.
- Object Page annotations quyết định action và child sections nằm ở đâu; file này kiểm soát metadata hành vi của action.

### Lưu ý khi sửa file này

- Không thêm Fiori action button nếu action chưa tồn tại trong `srv/service.cds` và chưa được wire trong `srv/service.js`.
- Giữ `@UI.Hidden` conditions khớp backend capability fields và permission rules.
- Khi backend action đổi thêm field, cập nhật `Common.SideEffects` để page refresh đúng.
- Nếu user báo status/buttons bị stale sau action, kiểm tra file này trước khi viết custom UI5 code.
- Giữ English và Vietnamese tương đương nhau.

## IDTS-43 update - clearer reopen wording

### English

IDTS-43 changes the user-facing reopen wording from `Reopen Bug` to `Reopen Bug for Further Work`, and the action parameter label from `Reason` to `Reason for Reopening`.

This does not change the backend transition. It only makes the Object Page action clearer. In IDTS, reopening means the bug needs more work after it had reached a resolved/closed-like state. The new label reduces the chance that a tester or PM interprets reopen as a generic edit action.

Important anchor:

- Location: `BugService.reopenBug` action label and `BugService.reopenBug.reason` label
  - IDTS concept: Reopen sends a bug back into active work, so the reason must be explicit and auditable.
  - Impact if broken: Users may reopen bugs without understanding the workflow meaning, or enter vague reasons.
  - Must check together: `srv/service.cds` action parameter, `srv/bug-service/actions.js` reopen transition, history side effects in this file, and browser action dialog evidence.

### Vietnamese

IDTS-43 đổi wording hiển thị từ `Reopen Bug` thành `Reopen Bug for Further Work`, và đổi label parameter từ `Reason` thành `Reason for Reopening`.

Thay đổi này không đổi transition backend. Nó chỉ làm action trên Object Page rõ nghĩa hơn. Trong IDTS, reopen nghĩa là bug cần quay lại xử lý sau khi đã ở trạng thái resolved/closed-like. Label mới giảm khả năng Tester hoặc PM hiểu nhầm reopen là một action edit chung chung.

Điểm neo quan trọng:

- Vị trí: label của action `BugService.reopenBug` và label của `BugService.reopenBug.reason`
  - Khái niệm IDTS: Reopen đưa bug quay lại luồng xử lý, nên lý do phải rõ và audit được.
  - Ảnh hưởng nếu sai: User có thể reopen bug mà không hiểu ý nghĩa workflow, hoặc nhập lý do quá mơ hồ.
  - Phải kiểm tra cùng: action parameter trong `srv/service.cds`, reopen transition trong `srv/bug-service/actions.js`, side effects history trong file này, và evidence dialog action trên browser.

## Metadata

- Source file: `app/bug-management-ui/annotations/actions.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/actions.cds.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-07-01

## Execution map / Sơ đồ thực thi (2026-07-18)

**English.** CAP compiler merges `UI.Identification` and action-parameter annotations into `BugService` metadata; Fiori Elements then renders buttons/dialog fields. A button press invokes the matching bound CAP action in `srv/service.cds`; the backend handler authorizes and changes status/history. `can*` fields only control visibility. Debug: metadata button → OData action request → handler/permission/workflow. This file never changes a Bug itself.

**Tiếng Việt.** CAP compiler merge `UI.Identification` và annotation parameter action vào metadata `BugService`; Fiori Elements dùng chúng để dựng nút/dialog field. Nhấn nút sẽ invoke bound CAP action tương ứng trong `srv/service.cds`; handler backend mới authorize và đổi status/history. Field `can*` chỉ điều khiển visibility. Debug: nút metadata → request OData action → handler/permission/workflow. File này không tự đổi Bug.
