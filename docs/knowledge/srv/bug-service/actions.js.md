# Knowledge: `srv/bug-service/actions.js`

## 2026-08-08 capacity guard

English: assignment actions request capacity validation only when the Developer owner changes, before assignment side effects are written. Vietnamese: action assignment chỉ yêu cầu capacity validation khi đổi Developer owner và chạy trước khi ghi side effect assignment.

## IDTS-122 retest continuity

Lifecycle actions preserve a durable `retestOwner`. Closing clears `nextProcessor` but keeps the retest owner. Reopen routes verification back to that owner, while PM can use `reassignRetestOwner` without changing status or Developer assignee. All lifecycle actions except Reopen are rejected when the current status is `CLOSED`.

## IDTS-89 audit boundary

`assignToDeveloper` writes `ASSIGN_TO_DEVELOPER`; `resubmitToDeveloper` writes `RESUBMIT_TO_DEVELOPER`; the shared `transitionBug` persists the exact ActionType supplied by `service.js`. Bug update, `HistoryEvents`, and `HistoryLogs` stay in the same request transaction, so a history insert failure rolls back the workflow change. See `docs/ai/implementation/knowledge-one-to-one-action-audit.md` for the full mapping and debug order.

## Beginner-first symbol walkthrough (2026-07-18)

### English

`service.js` dispatches Object Page OData actions here. `assignToDeveloper` reads the Bug, checks coordinator permission and assignee suitability, then writes assignee/status/next owner. `resubmitToDeveloper` returns a Need More Information Bug to its existing Developer. `addComment` creates a child Comment with trusted actor. `transitionBug` is the shared lifecycle pipeline: read → permission → option checks → transition validation → next processor calculation → transactional update → history/notification. Break at the public action, then `enforceActionPermission`, `validateTransition`, database UPDATE and side-effect writer. Inspect `req.data`, current Bug, `options`, actor, target status and next processor. A failure before UPDATE must leave Bug/history/notification unchanged.

### Vietnamese

`service.js` chuyển các OData action từ Object Page vào đây. `assignToDeveloper` đọc Bug, kiểm quyền coordinator và độ phù hợp assignee, rồi ghi assignee/status/next owner. `resubmitToDeveloper` trả Bug Need More Information về Developer cũ. `addComment` tạo Comment con với actor đáng tin. `transitionBug` là pipeline lifecycle dùng chung: đọc → permission → kiểm option → validation transition → tính next processor → update transaction → history/notification. Break tại public action, rồi `enforceActionPermission`, `validateTransition`, database UPDATE và side-effect writer. Xem `req.data`, Bug hiện tại, `options`, actor, status đích và next processor. Lỗi trước UPDATE phải để Bug/history/notification nguyên vẹn.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: assignment and status lifecycle. Start at `transitionBug`; inspect actor, old status, requested status, reason, next processor, and side effects. Every action must preserve authorization, history, and notification behavior.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: assignment và status lifecycle. Bắt đầu tại `transitionBug`; quan sát actor, old status, requested status, reason, next processor và side effect. Mọi action phải giữ authorization, history và notification behavior.

## English

### What this file is for

This file implements the backend behavior behind bug lifecycle buttons and comment actions.

In Fiori, a user sees buttons such as Reject Bug, Resolve Bug, Close Bug, Reopen Bug, Request More Information, or Add Comment. Those buttons are declared in `srv/service.cds` and displayed by annotations in `app/bug-management-ui/annotations/actions.cds`. When a user clicks one of them, CAP routes the OData action to handlers in `srv/service.js`, and `srv/service.js` calls the functions in this file.

For a new learner, think of this file as the place where a Fiori button becomes a real business operation.

### Beginner explanation

Fiori action buttons are only the UI entry point. This file decides the actual backend result:

- Which status the bug moves to.
- Whether the user is allowed to perform the action.
- Whether a reason or note is required.
- Whether an assignee is required.
- Whether `nextProcessorUser` and `nextProcessorRole` change.
- Whether history, comment, and notification side effects are written.

The most important design choice is that most lifecycle buttons go through one shared function: `transitionBug()`. That prevents every button from implementing its own slightly different status logic.

### IDTS flow

1. Fiori renders actions from `app/bug-management-ui/annotations/actions.cds`.
2. The user clicks an action on the Object Page.
3. CAP receives a bound OData action call on `BugService.Bugs`.
4. `srv/service.js:94-147` routes that action to this module.
5. This module checks permission, validates transition, updates status/assignee/nextProcessor, and records side effects.
6. Fiori refreshes fields and child tables based on `Common.SideEffects` in the annotation file.

### Important source anchors

- **Location**: `srv/bug-service/actions.js:29`
  `async function assignToDeveloper(req, entities)`
  **IDTS concept**: Assignment action. It moves a bug to `ASSIGNED`, validates the selected Developer, recalculates next processor, and uses action type `ASSIGN`.
  **Impact if broken**: Tester/PM may assign a bug without updating owner, status, history, or notification correctly. PM workload and developer queue become unreliable.
  **Must check together**: `srv/service.cds:31` action contract, `srv/bug-service/bug-write.js:138` assignee validation, `srv/bug-service/read-models.js:31` assignable developer read model, Fiori value help/action annotations.

- **Location**: `srv/bug-service/actions.js:44`
  `async function resubmitToDeveloper(req, entities)`
  **IDTS concept**: Recovery path from `NEED_MORE_INFORMATION` back to Developer processing. It validates transition to `ASSIGNED`, checks assignee suitability, and stores the required update summary in immutable History without creating a Comment automatically.
  **Impact if broken**: A Tester can provide missing information but the bug may not return to the assigned Developer, or the update summary may disappear from History. Comments remain explicit user-authored discussion entries.
  **Must check together**: `srv/service.cds:71` `resubmitToDeveloper`, `app/bug-management-ui/annotations/actions.cds` side effects for comments/history/notifications, `srv/bug-service/history.js` comment and status side effects.

- **Location**: `srv/bug-service/actions.js:139`
  `async function addComment(req, entities)`
  **IDTS concept**: Controlled comment creation. It creates a comment under the active bug and lets history record that discussion happened.
  **Impact if broken**: Users may lose discussion context, comment author/role can be wrong, or comment history may not appear on the Object Page.
  **Must check together**: `srv/service.cds:30` `addComment`, `db/schema.cds:121` `Comments`, `app/bug-management-ui/annotations/actions.cds:85` comment side effects, `history-notifications.cds` comment table display.

- **Location**: `srv/bug-service/actions.js:184`
  `async function transitionBug(req, entities, options)`
  **IDTS concept**: Central lifecycle transition implementation. It powers actions like Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug, and Reopen Bug.
  **Impact if broken**: Bugs can move through invalid lifecycle paths, permission checks can be bypassed, required reasons can be skipped, history/notifications can be missing, and `nextProcessor` can point to the wrong role.
  **Must check together**: `srv/service.js:96-147` action wiring, `srv/service.cds:68-78` action declarations, `srv/bug-service/constants.js:96` allowed transitions, `app/bug-management-ui/annotations/actions.cds` Fiori action buttons.

- **Location**: `srv/bug-service/actions.js:189`
  `await enforceActionPermission(req, entities, oldBug, options.actionType)`
  **IDTS concept**: Backend authorization for lifecycle actions. UI button visibility is helpful, but this line is the server-side protection.
  **Impact if broken**: A user could manually call an OData action even if Fiori hides the button, causing unauthorized status changes.
  **Must check together**: `srv/bug-service/permissions.js:46`, capability virtual fields in `srv/bug-service/read-models.js:368`, and `@UI.Hidden` conditions in `app/bug-management-ui/annotations/actions.cds`.

- **Location**: `srv/bug-service/actions.js:199`
  `validateTransition(req, oldBug.status_code, options.status)`
  **IDTS concept**: Lifecycle rule enforcement for button actions. Each action must still obey the same transition rules as direct bug updates.
  **Impact if broken**: Fiori buttons can move bugs to invalid states, for example bypassing retest or closing without valid path.
  **Must check together**: `srv/bug-service/bug-write.js:171`, `srv/bug-service/constants.js:96`, SAP490 lifecycle test scenarios.

### Cross-folder impact

- `srv/service.cds` defines the public OData actions. If an action name or parameter changes there, this file and Fiori annotations must change together.
- `app/bug-management-ui/annotations/actions.cds` makes these actions visible as Fiori buttons and tells Fiori which data to refresh after the action.
- `db/schema.cds` defines the target fields changed by these actions: `status`, `assignee`, `nextProcessorUser`, `nextProcessorRole`, `rejectionReason`, comments, history, and notifications.
- `srv/bug-service/bug-write.js` provides shared transition, assignee, and next processor logic used by this file.
- `srv/bug-service/history.js` and notification logic are affected because lifecycle actions must leave an audit trail.

### Safe editing checklist

- Do not add a new lifecycle action here without adding the action contract in `srv/service.cds` and the Fiori action annotation.
- Do not rely only on `@UI.Hidden`; keep `enforceActionPermission()` in the backend path.
- When changing a status action, update `Common.SideEffects` so Fiori refreshes status, current owner, capability fields, history, comments, and notifications.
- Keep reason/note rules aligned with business decisions and SAP490 test cases.
- Maintain equal English and Vietnamese explanations.

## Vietnamese

### File này dùng để làm gì

File này implement hành vi backend phía sau các nút lifecycle và comment của bug.

Trong Fiori, user thấy các nút như Reject Bug, Resolve Bug, Close Bug, Reopen Bug, Request More Information hoặc Add Comment. Các nút đó được khai báo trong `srv/service.cds` và được hiển thị nhờ annotation ở `app/bug-management-ui/annotations/actions.cds`. Khi user bấm nút, CAP nhận OData action, `srv/service.js` route action đó, rồi gọi các function trong file này.

Với người mới học, hãy hiểu file này là nơi một nút trên Fiori biến thành một thao tác nghiệp vụ thật.

### Giải thích cho người mới

Nút action trên Fiori chỉ là điểm bắt đầu trên UI. File này mới quyết định kết quả backend:

- Bug chuyển sang status nào.
- User có được phép thực hiện action không.
- Action có cần reason hoặc note không.
- Action có cần assignee không.
- `nextProcessorUser` và `nextProcessorRole` có đổi không.
- History, comment và notification side effects có được ghi không.

Điểm thiết kế quan trọng nhất là hầu hết lifecycle buttons đi qua một function chung: `transitionBug()`. Nhờ vậy mỗi nút không tự viết logic status riêng và tránh lệch rule.

### Flow hoạt động trong IDTS

1. Fiori render các action từ `app/bug-management-ui/annotations/actions.cds`.
2. User bấm action trên Object Page.
3. CAP nhận bound OData action call trên `BugService.Bugs`.
4. `srv/service.js:94-147` route action đó đến module này.
5. Module này kiểm tra permission, validate transition, cập nhật status/assignee/nextProcessor và ghi side effects.
6. Fiori refresh các field và child table dựa trên `Common.SideEffects` trong annotation file.

### Important source anchors

- **Vị trí**: `srv/bug-service/actions.js:29`
  `async function assignToDeveloper(req, entities)`
  **Khái niệm IDTS**: Action phân công Developer. Nó chuyển bug sang `ASSIGNED`, validate Developer được chọn, tính lại next processor và dùng action type `ASSIGN`.
  **Ảnh hưởng nếu sai**: Tester/PM có thể assign bug nhưng owner, status, history hoặc notification không được cập nhật đúng. Workload PM và queue Developer sẽ sai.
  **Phải kiểm tra cùng**: `srv/service.cds:31` action contract, `srv/bug-service/bug-write.js:138` assignee validation, `srv/bug-service/read-models.js:31` read model assignable developer, Fiori value help/action annotations.

- **Vị trí**: `srv/bug-service/actions.js:44`
  `async function resubmitToDeveloper(req, entities)`
  **Khái niệm IDTS**: Đường phục hồi từ `NEED_MORE_INFORMATION` về lại Developer xử lý. Nó validate transition về `ASSIGNED`, kiểm tra assignee phù hợp và lưu update summary bắt buộc trong History bất biến mà không tự tạo Comment.
  **Ảnh hưởng nếu sai**: Tester bổ sung thông tin nhưng bug có thể không quay về Developer được assign, hoặc update summary biến mất khỏi History. Comment chỉ được tạo khi user chủ động đăng nội dung trao đổi.
  **Phải kiểm tra cùng**: `srv/service.cds:71` `resubmitToDeveloper`, side effects trong `app/bug-management-ui/annotations/actions.cds`, `srv/bug-service/history.js` cho comment và status side effects.

- **Vị trí**: `srv/bug-service/actions.js:139`
  `async function addComment(req, entities)`
  **Khái niệm IDTS**: Tạo comment có kiểm soát. Nó tạo comment dưới bug active và cho phép history ghi lại rằng có trao đổi xảy ra.
  **Ảnh hưởng nếu sai**: User có thể mất ngữ cảnh thảo luận, author/role của comment có thể sai, hoặc comment history không hiện trên Object Page.
  **Phải kiểm tra cùng**: `srv/service.cds:30` `addComment`, `db/schema.cds:121` `Comments`, `app/bug-management-ui/annotations/actions.cds:85` comment side effects, phần hiển thị comment table trong `history-notifications.cds`.

- **Vị trí**: `srv/bug-service/actions.js:184`
  `async function transitionBug(req, entities, options)`
  **Khái niệm IDTS**: Hàm trung tâm xử lý lifecycle transition. Nó phục vụ các action như Mark In Review, Request More Information, Reject Bug, Start Progress, Resolve Bug, Send to Retest, Close Bug và Reopen Bug.
  **Ảnh hưởng nếu sai**: Bug có thể đi qua lifecycle sai, permission có thể bị bypass, reason bắt buộc có thể bị bỏ qua, history/notification có thể thiếu, và `nextProcessor` có thể trỏ sai role.
  **Phải kiểm tra cùng**: `srv/service.js:96-147` action wiring, `srv/service.cds:68-78` action declarations, `srv/bug-service/constants.js:96` allowed transitions, Fiori action buttons trong `app/bug-management-ui/annotations/actions.cds`.

- **Vị trí**: `srv/bug-service/actions.js:189`
  `await enforceActionPermission(req, entities, oldBug, options.actionType)`
  **Khái niệm IDTS**: Phân quyền backend cho lifecycle actions. UI ẩn/hiện nút là cần thiết, nhưng dòng này mới là lớp bảo vệ server-side.
  **Ảnh hưởng nếu sai**: User có thể gọi OData action thủ công dù Fiori đã ẩn nút, dẫn tới status change trái quyền.
  **Phải kiểm tra cùng**: `srv/bug-service/permissions.js:46`, capability virtual fields trong `srv/bug-service/read-models.js:368`, điều kiện `@UI.Hidden` trong `app/bug-management-ui/annotations/actions.cds`.

- **Vị trí**: `srv/bug-service/actions.js:199`
  `validateTransition(req, oldBug.status_code, options.status)`
  **Khái niệm IDTS**: Enforce rule lifecycle cho button actions. Mỗi action vẫn phải tuân thủ transition rules giống direct bug update.
  **Ảnh hưởng nếu sai**: Nút Fiori có thể đẩy bug sang trạng thái không hợp lệ, ví dụ bỏ qua retest hoặc close sai đường.
  **Phải kiểm tra cùng**: `srv/bug-service/bug-write.js:171`, `srv/bug-service/constants.js:96`, các SAP490 lifecycle test scenarios.

### Liên kết với file khác

- `srv/service.cds` định nghĩa các OData action công khai. Nếu tên action hoặc parameter đổi ở đó, file này và Fiori annotations phải đổi cùng lúc.
- `app/bug-management-ui/annotations/actions.cds` biến các action này thành nút trên Fiori và nói cho Fiori biết cần refresh dữ liệu nào sau action.
- `db/schema.cds` định nghĩa các field mà action thay đổi: `status`, `assignee`, `nextProcessorUser`, `nextProcessorRole`, `rejectionReason`, comments, history và notifications.
- `srv/bug-service/bug-write.js` cung cấp logic chung cho transition, assignee và next processor mà file này dùng lại.
- `srv/bug-service/history.js` và notification logic bị ảnh hưởng vì lifecycle action phải để lại audit trail.

### Lưu ý khi sửa file này

- Không thêm lifecycle action mới ở đây nếu chưa thêm action contract trong `srv/service.cds` và Fiori action annotation.
- Không chỉ dựa vào `@UI.Hidden`; backend vẫn phải gọi `enforceActionPermission()`.
- Khi đổi status action, cập nhật `Common.SideEffects` để Fiori refresh status, current owner, capability fields, history, comments và notifications.
- Giữ rule reason/note khớp với business decision và SAP490 test case.
- Giữ English và Vietnamese đầy đủ tương đương nhau.

## Metadata

- Source file: `srv/bug-service/actions.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/actions.js.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-06-22

## IDTS-122 Retest-owner reassignment

`reassignRetestOwner` is a PM-only controlled exception for a Closed Bug. It validates an active Tester, rejects no-op reassignment, writes the dedicated `REASSIGN_RETEST_OWNER` history action with display-safe old/new Tester names, and creates the target Tester's notification/outbox record in the same CAP request transaction. It does not reopen the Bug or change the Developer assignee.

## IDTS-36 Resubmit Notification Update

### English

`resubmitToDeveloper` creates its follow-up notification through the shared email outbox boundary. It passes the active CAP request transaction plus normalized email configuration, so the resubmit status/history/notification/outbox commit together while SMTP still runs later.

- **Location**: `srv/bug-service/actions.js:25-26` and `:130`
  imports and call of `writeNotificationRecord(cds.tx(req), ..., getEmailConfig())`
  **IDTS concept**: A Tester/PM resubmit must notify the assigned Developer and create matching email delivery evidence.
  **Impact if broken**: The bug returns to `ASSIGNED`, but the Developer receives no follow-up notification and the outbox has no email to process.
  **Must check together**: `srv/email/outbox.js`, `srv/bug-service/history.js`, scenario SC-05e in `scripts/qa/test-idts6-programmatic.js`.

### Vietnamese

`resubmitToDeveloper` tạo follow-up notification qua email outbox boundary dùng chung. Hàm truyền CAP request transaction đang chạy và email config đã chuẩn hóa, nên status/history/notification/outbox của resubmit commit cùng nhau, còn SMTP vẫn chạy sau.

- **Vị trí**: `srv/bug-service/actions.js:25-26` và `:130`
  import và gọi `writeNotificationRecord(cds.tx(req), ..., getEmailConfig())`
  **Khái niệm IDTS**: Khi Tester/PM resubmit, Developer được assign phải nhận notification và hệ thống phải có email delivery evidence tương ứng.
  **Ảnh hưởng nếu sai**: Bug quay lại `ASSIGNED` nhưng Developer không nhận follow-up notification và outbox không có email để xử lý.
  **Phải kiểm tra cùng**: `srv/email/outbox.js`, `srv/bug-service/history.js`, scenario SC-05e trong `scripts/qa/test-idts6-programmatic.js`.

## Immediate delivery handoff (2026-08-12)

**English.** The direct resubmit and retest-owner notification paths now use `writeNotificationAndSchedule(req, entry)`, matching status-driven notifications. The wrapper keeps persistence atomic and registers at most one post-commit kick per CAP request. It does not send from inside either action transaction.

**Tiếng Việt.** Hai đường notification trực tiếp của resubmit và đổi retest owner nay dùng `writeNotificationAndSchedule(req, entry)`, giống notification theo status. Wrapper giữ persistence atomic và đăng ký tối đa một post-commit kick cho mỗi CAP request. Nó không gửi email bên trong transaction của action.
## Gate 3B assignment action boundary / Ranh gioi action assignment Gate 3B

`transitionBug` passes `enforceIdentityAccess` only when the action supplies a different assignee. Lifecycle transitions that keep an existing assignee do not turn the new-link readiness rule into an ownership migration. The backend remains authoritative even if the UI value help is bypassed.

`transitionBug` chi truyen `enforceIdentityAccess` khi action cung cap assignee khac. Lifecycle transition giu assignee hien tai khong bien rule readiness thanh migration ownership. Backend van la authority ke ca khi bypass value help tren UI.

## N3 lifecycle delivery policy

**English.** Lifecycle actions reuse the history ID as their notification source key. Resubmit and retest-owner reassignment select their stable event codes and require prompt email; assignment removal is planned by history as inbox-only. The action transaction still owns authorization and business updates.

**Tiếng Việt.** Lifecycle action dùng lại history ID làm source key notification. Resubmit và đổi retest owner chọn stable event code và cần email prompt; bỏ assignment do history lập plan inbox-only. Transaction action vẫn sở hữu authorization và business update.
