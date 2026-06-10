# IDTS CAP Permission Model Notes

## English

This note explains the backend permission layer added for IDTS Sprint 02 / DonHV task `IDTS-2`.

### Why this was needed

The mentor clarified that developers must be able to see and discuss bugs as a team. A bug should not become private just because it is assigned to one developer.

However, processing actions such as changing workflow status, requesting more information, rejecting, or resolving a bug must still be controlled. Otherwise, any developer could move any bug through the lifecycle, which would make ownership and audit history unreliable.

### Main rule

IDTS separates two concepts:

- **Visibility and discussion**: internal users can view and discuss bugs.
- **Processing responsibility**: only the assigned developer, Tester, or PM can process the bug workflow.

This means:

- Developers can see bugs even when the bug is assigned to another developer.
- Developers can add normal comments for team discussion.
- Only the assigned developer can perform developer processing actions.
- Tester and PM can coordinate the workflow, assignment, follow-up, retest, close, and reopen steps.

### How CAP knows the current user

SAP CAP exposes the current request user through `req.user`.

Typical values can come from:

- `req.user.id`
- `req.user.attr.email`
- `req.user.attr.user_name`
- Other identity attributes from the authentication provider

The implementation maps those values to the local `Users` entity. If a matching active user is found, the backend can enforce role and assignment rules.

For local development, CAP may run without real authentication and the user can be `anonymous`. In that case, the permission layer does not block the demo flow. This keeps the current SQLite/local development workflow usable while still making the code ready for authenticated runtime later.

### Direct updates vs bound actions

Fiori Elements can change a bug through:

- Direct OData update of the `Bugs` entity.
- Bound OData actions such as `requestMoreInformation`, `rejectBug`, or `resolveBug`.

Because of that, the backend checks permissions in both places:

- `before CREATE/UPDATE Bugs` checks create, assignment, and direct status updates.
- Bound action handlers check action-level processing permission.

### Comments

Comments are intentionally different from workflow processing.

The backend allows Tester, Developer, and PM users to create comments. When the current user can be resolved, CAP automatically fills:

- `author_ID`
- `authorRole_code`

This prevents users from creating comments on behalf of another user in authenticated runtime.

### What is still not included

This is not a full SAP authorization setup yet.

Not included:

- XSUAA role collections.
- `@requires` or `@restrict` service-level authorization.
- Tenant-level authorization.
- Production identity provider setup.

Those should be added later when the team moves from local SQLite development toward BTP deployment.

### History, nextProcessor, and notification side effects

IDTS uses `nextProcessor` to show who should act next. It is not the same as `assignee`.

When a bound action changes the bug workflow, the backend now records history for:

- Status change.
- Assignee change, when applicable.
- `nextProcessorUser` change, when applicable.
- `nextProcessorRole` change, when applicable.

This matters because PM and Tester users need to understand not only that the status changed, but also why the next owner or queue changed.

The MVP notification event catalog currently has general event types such as `ASSIGNED`, `NEED_MORE_INFORMATION`, `REJECTED`, `UPDATED`, and `CLOSED`. It does not yet define separate `RESOLVED`, `RETEST_REQUIRED`, or `REOPENED` notification event types. For that reason, the backend uses `UPDATED` for resolved, retest-required, and reopened notifications with a clear message text.

This keeps the implementation aligned with the existing value list and avoids expanding master data unless the team decides to add more notification event types later.

## Vietnamese

Ghi chú này giải thích lớp kiểm soát quyền backend được thêm cho Sprint 02 / task `IDTS-2` của DonHV.

### Vì sao cần phần này

Mentor đã làm rõ rằng developer phải được xem và thảo luận bug với nhau trong team. Bug không nên trở thành dữ liệu riêng tư chỉ vì đang được assign cho một developer cụ thể.

Tuy nhiên, các thao tác xử lý như đổi trạng thái workflow, yêu cầu thêm thông tin, reject hoặc resolve bug vẫn phải được kiểm soát. Nếu không, bất kỳ developer nào cũng có thể đẩy bất kỳ bug nào qua lifecycle, làm cho ownership và audit history không đáng tin cậy.

### Rule chính

IDTS tách hai khái niệm:

- **Visibility and discussion**: user nội bộ có thể xem và thảo luận bug.
- **Processing responsibility**: chỉ developer được assign, Tester hoặc PM mới được xử lý workflow của bug.

Điều này có nghĩa là:

- Developer vẫn xem được bug dù bug đang assign cho developer khác.
- Developer có thể thêm comment bình thường để thảo luận trong team.
- Chỉ developer đang được assign mới được thực hiện các action xử lý của developer.
- Tester và PM có thể điều phối workflow, assignment, follow-up, retest, close và reopen.

### CAP biết user hiện tại bằng cách nào

SAP CAP cung cấp user hiện tại của request thông qua `req.user`.

Các giá trị thường có thể đến từ:

- `req.user.id`
- `req.user.attr.email`
- `req.user.attr.user_name`
- Các identity attribute khác từ authentication provider

Implementation sẽ map những giá trị này vào entity `Users` của hệ thống. Nếu tìm thấy active user phù hợp, backend có thể kiểm tra role và assignment.

Trong local development, CAP có thể chạy chưa có authentication thật và user có thể là `anonymous`. Khi đó lớp permission không chặn demo flow. Cách này giữ cho workflow SQLite/local hiện tại vẫn chạy được, nhưng code đã sẵn sàng hơn cho runtime có authentication sau này.

### Direct update và bound action

Fiori Elements có thể thay đổi bug bằng:

- Direct OData update vào entity `Bugs`.
- Bound OData action như `requestMoreInformation`, `rejectBug`, hoặc `resolveBug`.

Vì vậy backend kiểm tra quyền ở cả hai nơi:

- `before CREATE/UPDATE Bugs` kiểm tra create, assignment và đổi status trực tiếp.
- Bound action handler kiểm tra quyền xử lý action.

### Comments

Comment được xem khác với xử lý workflow.

Backend cho phép Tester, Developer và PM tạo comment. Khi xác định được user hiện tại, CAP tự điền:

- `author_ID`
- `authorRole_code`

Điều này tránh việc user tạo comment thay cho người khác trong authenticated runtime.

### Những gì chưa bao gồm

Đây chưa phải là setup authorization đầy đủ cho SAP production.

Chưa bao gồm:

- XSUAA role collections.
- Authorization cấp service bằng `@requires` hoặc `@restrict`.
- Tenant-level authorization.
- Setup production identity provider.

Các phần này nên được thêm sau khi team chuyển từ local SQLite development sang triển khai trên BTP.

### Side effect cho history, nextProcessor và notification

IDTS dùng `nextProcessor` để thể hiện ai cần xử lý bước tiếp theo. Nó không giống `assignee`.

Khi một bound action thay đổi workflow của bug, backend hiện ghi history cho:

- Thay đổi status.
- Thay đổi assignee nếu có.
- Thay đổi `nextProcessorUser` nếu có.
- Thay đổi `nextProcessorRole` nếu có.

Điều này quan trọng vì PM và Tester cần hiểu không chỉ status đã đổi, mà còn vì sao người xử lý tiếp theo hoặc queue tiếp theo bị thay đổi.

Danh mục notification event của MVP hiện có các event type tổng quát như `ASSIGNED`, `NEED_MORE_INFORMATION`, `REJECTED`, `UPDATED`, và `CLOSED`. Hiện chưa có event type riêng cho `RESOLVED`, `RETEST_REQUIRED`, hoặc `REOPENED`. Vì vậy backend dùng `UPDATED` cho notification của resolved, retest-required, và reopened, nhưng message sẽ ghi rõ ý nghĩa.

Cách này giữ implementation khớp với value list hiện có và tránh mở rộng master data nếu team chưa chốt cần thêm notification event type mới.
