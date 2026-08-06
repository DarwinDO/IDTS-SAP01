# Knowledge: `srv/bug-service/bug-write.js`

## IDTS-122 write semantics

New Bugs are Tester-only and initialize `retestOwner` from the trusted Tester actor. Active writes preserve server-owned reporter/retest ownership. When routing a verification step, the handler prefers an active retest owner and falls back to PM coordination only when the stored Tester is missing or inactive.

Classification writes validate three active boundaries in the same CAP transaction: the selected Application Component, the selected Defect Category, and their Component Category bridge. An active bridge does not make an inactive parent catalog row valid. Direct OData writes and draft SAVE therefore cannot bypass the active master-data rule exposed by Fiori value help.

## Beginner execution walkthrough (2026-07-18)

### English

#### Mental model and input

`prepareBugWrite()` is the final inspection desk for an active Bug write. Its input is not a complete form in every request: on update, `req.data` may contain only one changed field. Therefore it reads `oldBug`, merges old and incoming values, validates the complete result, and adds server-managed fields back to `req.data`. Rejecting stops persistence; mutating `req.data` changes what CAP writes.

#### Execution order inside `prepareBugWrite()`

1. Resolve Bug ID and read `oldBug` for update. Missing old data returns 404 rather than creating an accidental row.
2. On create, generate `bugNumber` and derive reporter from the authenticated IDTS user. The fallback Tester only protects legacy/non-standard calls.
3. Build `merged` and call required-field, active-catalog, and component/category validators.
4. Derive the starting/updated status from assignee: `ASSIGNED` when present, otherwise `PENDING_ASSIGNMENT`.
5. Call `enforceBugWritePermission()` using the final calculated state, then validate lifecycle transition and rejection reason.
6. If an assignee exists, confirm the developer is active, available, and responsible for the selected scope.
7. Calculate the next action owner with `determineNextProcessor()` and add its user/role IDs to `req.data`.
8. Store old/final snapshots and important changes on `req` for `history.js`; these underscore properties are request-local, not database columns.

#### Function-by-function boundaries

- `validateActiveCodeLists`: input is a merged Bug; output is no value. It either continues or rejects with field-targeted 400. It queries Priority/Severity/Environment projections in the current transaction.
- `validateRequiredBugFields`: checks business-required values after `trimToNull`. `rejectFirst` controls one error versus collecting multiple `req.error` messages.
- `deriveOrValidateComponentCategory`: queries the active bridge row and writes its ID into both the outgoing payload and merged working object.
- `validateAssignee`: crosses into DeveloperProfiles and DeveloperResponsibilities. It does not assign; it only accepts or rejects the requested assignee.
- `validateTransition`: reads the state machine in `constants.js`; it has no database side effect.
- `determineNextProcessor`: maps status to the next Users.ID/role. It may query PM/Tester or map DeveloperProfile to User, but only returns data for the caller to persist.

#### Debug order and variables

Set breakpoints at `prepareBugWrite`, the validator named in the 400 response, `enforceBugWritePermission`, and `determineNextProcessor`. Inspect `isCreate`, `req.data`, `oldBug`, `merged`, `finalData`, `finalStatus`, `actor`, and returned `nextProcessor`. If UI value help accepts a value but save rejects it, compare the sent code/ID with the active catalog/responsibility row queried here.

#### Failure and safe editing

Moving permission checks earlier than final status calculation can authorize the wrong state. Removing the backend catalog/assignee check lets direct OData callers bypass UI value help. Changing next-processor rules requires checking notifications, display enrichment, history wording, and role dashboard filters together.

### Vietnamese

#### Mô hình tư duy và input

`prepareBugWrite()` là bàn kiểm tra cuối trước khi ghi Bug active. Input không phải lúc nào cũng là toàn bộ form: khi update, `req.data` có thể chỉ chứa một field vừa đổi. Vì vậy hàm đọc `oldBug`, ghép dữ liệu cũ với dữ liệu mới, kiểm toàn bộ kết quả, rồi thêm field do server quản lý trở lại `req.data`. Reject sẽ dừng persist; sửa `req.data` sẽ đổi dữ liệu CAP ghi.

#### Thứ tự chạy trong `prepareBugWrite()`

1. Lấy Bug ID và đọc `oldBug` khi update. Không thấy dữ liệu cũ thì trả 404, không vô tình tạo row mới.
2. Khi create, sinh `bugNumber` và lấy reporter từ user IDTS đã xác thực. Fallback Tester chỉ bảo vệ call cũ/không chuẩn.
3. Tạo `merged`, rồi kiểm field bắt buộc, catalog active và cặp component/category.
4. Suy ra status từ assignee: có assignee là `ASSIGNED`, chưa có là `PENDING_ASSIGNMENT`.
5. Gọi `enforceBugWritePermission()` với trạng thái cuối đã tính, sau đó kiểm transition và rejection reason.
6. Nếu có assignee, xác nhận developer active, available và có responsibility đúng scope.
7. Tính người xử lý tiếp theo bằng `determineNextProcessor()` và thêm user/role ID vào `req.data`.
8. Lưu ảnh chụp cũ/cuối và thay đổi quan trọng vào `req` cho `history.js`; các property gạch dưới chỉ sống trong request, không phải cột DB.

#### Ranh giới từng hàm

- `validateActiveCodeLists`: input là Bug đã merge; không return dữ liệu. Hàm hoặc đi tiếp, hoặc reject 400 gắn đúng field. Nó query projection Priority/Severity/Environment trong transaction hiện tại.
- `validateRequiredBugFields`: kiểm giá trị bắt buộc sau `trimToNull`. `rejectFirst` quyết định dừng ở một lỗi hay gom nhiều `req.error`.
- `deriveOrValidateComponentCategory`: query bridge row active và ghi ID vào cả payload gửi đi lẫn object làm việc đã merge.
- `validateAssignee`: đi sang DeveloperProfiles và DeveloperResponsibilities. Hàm không assign; nó chỉ chấp nhận hoặc từ chối assignee được yêu cầu.
- `validateTransition`: đọc state machine trong `constants.js`; không có side effect database.
- `determineNextProcessor`: map status sang Users.ID/role tiếp theo. Hàm có thể query PM/Tester hoặc map DeveloperProfile sang User, nhưng chỉ return dữ liệu để caller persist.

#### Thứ tự debug và biến cần xem

Đặt breakpoint tại `prepareBugWrite`, validator được nêu trong response 400, `enforceBugWritePermission`, và `determineNextProcessor`. Quan sát `isCreate`, `req.data`, `oldBug`, `merged`, `finalData`, `finalStatus`, `actor` và `nextProcessor` trả về. Nếu value help trên UI nhận giá trị nhưng Save bị reject, so code/ID đã gửi với catalog/responsibility active được query tại đây.

#### Failure path và sửa an toàn

Đưa permission check lên trước lúc tính final status có thể kiểm quyền trên trạng thái sai. Bỏ backend catalog/assignee check sẽ cho người gọi OData trực tiếp né value help UI. Đổi rule next processor phải kiểm cùng notification, display enrichment, history wording và filter dashboard theo role.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: create/update validation and assignment preparation. Break at `prepareBugWrite` for invalid field, reporter, component category, assignee, or starting status behavior. Check `schema.cds`, draft handlers, and Fiori value lists together.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: create/update validation và assignment preparation. Đặt breakpoint `prepareBugWrite` khi field, reporter, component category, assignee hoặc starting status sai. Kiểm tra cùng `schema.cds`, draft handler và Fiori value list.

## English

### What this file is for

This file is the backend checkpoint before a bug is created or updated.

In this CAP application, the Fiori screen does not write directly to the database. The user edits a bug in the browser, Fiori sends an OData request to `BugService`, and `srv/service.js` calls `prepareBugWrite()` before CAP saves the row. That makes this file the place where IDTS protects the bug lifecycle from invalid write data.

For a new SAP/CAP/Fiori learner, think of this file as the “write gatekeeper” for `BugService.Bugs`. Fiori helps the user enter data, but this backend file decides whether the data follows IDTS business rules.

### Beginner explanation

When a Tester creates or edits a bug, the system must do more than save form fields:

- It must require the minimum bug report details: title, description, reproduction steps, actual/expected result, priority, severity, application component, defect category, and reporter.
- It must derive `componentCategory` from Application Component + Defect Category. In IDTS, `componentCategory` is the real assignment key used to match developers.
- It must decide whether the bug starts or returns to `ASSIGNED` or `PENDING_ASSIGNMENT`.
- It must reject invalid status jumps, for example skipping required lifecycle steps.
- It must prevent `REJECTED` bugs without `rejectionReason`.
- It must validate that the assignee is an active and suitable Developer.
- It must set `nextProcessorUser` and `nextProcessorRole`, which drive “Current Action Owner” behavior for Tester, Developer, and PM.

So this file is not just validation code. It is the core backend rule layer for create/update, assignment, rejected follow-up, and current owner routing.

### IDTS flow

1. Fiori sends create/update data for `BugService.Bugs`.
2. `srv/service.js:59-60` registers `prepareBugWrite()` as a `before CREATE` and `before UPDATE` handler.
3. `prepareBugWrite()` merges the existing bug with incoming data, because an update may only send changed fields.
4. The file validates required fields, derives `componentCategory`, sets or checks status, checks permissions, validates assignee, and calculates next processor.
5. CAP saves the bug only if this file does not reject the request.
6. Later `srv/bug-service/history.js` uses `_oldBug`, `_finalBug`, and `_importantChanges` prepared here to write audit history.

### Important source anchors

These anchors point to the lines that control real IDTS behavior. They are intentionally domain-focused, not generic code summaries.

- **Location**: `srv/bug-service/bug-write.js:25`
  `async function prepareBugWrite(req, entities, { isCreate })`
  **IDTS concept**: Central write pipeline for bug create/update. It sets `bugNumber` and reporter on create, derives `componentCategory`, decides `ASSIGNED` vs `PENDING_ASSIGNMENT`, enforces `rejectionReason`, validates transitions and assignee, and calculates next processor.
  **Impact if broken**: Testers can create incomplete bugs, bugs can enter wrong status, rejected bugs may have no follow-up reason, and PM monitoring can show the wrong current owner.
  **Must check together**: `srv/service.js:59-60` handler registration, `srv/service.cds:4` `Bugs` projection, `db/schema.cds:87` `Bugs` fields, `srv/bug-service/history.js:53` update history side effects.

- **Location**: `srv/bug-service/bug-write.js:90`
  `function validateRequiredBugFields(req, bug)`
  **IDTS concept**: Minimum bug report quality gate. It blocks saving a bug without the fields needed for Tester, Developer, and PM to understand and process the issue.
  **Impact if broken**: Developers may receive bugs without reproduction steps or expected result, making triage and retest unreliable.
  **Must check together**: `db/schema.cds:87` required `Bugs` fields, Object Page create/edit fields in `app/bug-management-ui/annotations/object-page.cds`, seed demo data in `db/data/idts.cap-Bugs.csv`.

- **Location**: `srv/bug-service/bug-write.js:109`
  `async function deriveOrValidateComponentCategory(req, entities, bug)`
  **IDTS concept**: Assignment-key derivation. Tester chooses Application Component and Defect Category, but backend derives `componentCategory`, the key used by `DeveloperResponsibilities`.
  **Impact if broken**: Developer matching fails, value helps can show unsuitable developers, and PM may see bugs stuck in the wrong assignment queue.
  **Must check together**: `db/schema.cds:73` `ComponentCategories`, `db/schema.cds:79` `DeveloperResponsibilities`, `srv/service.cds:160` `ValidDefectCategories`, Fiori value-help annotations.

- **Location**: `srv/bug-service/bug-write.js:138`
  `async function validateAssignee(req, entities, bug)`
  **IDTS concept**: Developer suitability validation. It confirms the selected assignee is an active developer, is not unavailable, and is responsible for the selected component/category and optional SAP module scope.
  **Impact if broken**: Tester or PM can assign bugs to unavailable or wrong-skill developers, which damages workload accuracy and demo credibility.
  **Must check together**: `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, `db/data/idts.cap-DeveloperResponsibilities.csv`, `srv/service.cds:120` `AssignableDevelopers`.

- **Location**: `srv/bug-service/bug-write.js:171`
  `function validateTransition(req, fromStatus, toStatus)`
  **IDTS concept**: Status lifecycle guard. It uses `ALLOWED_TRANSITIONS` so a bug cannot jump through invalid workflow paths.
  **Impact if broken**: A bug can skip required review, retest, rejection follow-up, or reopen steps; history and SAP490 test evidence become misleading.
  **Must check together**: `srv/bug-service/constants.js:96` transition map, `srv/bug-service/actions.js:184` action transition centralizer, `app/bug-management-ui/annotations/actions.cds` Fiori lifecycle buttons.

- **Location**: `srv/bug-service/bug-write.js:179`
  `async function determineNextProcessor(req, entities, bug)`
  **IDTS concept**: Current Action Owner routing. It maps statuses to the next responsible person or queue: PM for pending assignment, Developer for active developer work, Tester for tester follow-up, none for closed.
  **Impact if broken**: The UI can show the wrong Current Action Owner, rejected or information-needed bugs may not return to the right role, and PM monitoring queues become unreliable.
  **Must check together**: `db/schema.cds:105-106` `nextProcessorUser` and `nextProcessorRole`, `srv/service.cds:13-15` display virtuals, `srv/bug-service/read-models.js:213` display enrichment, ownership/assignment annotations.

### Cross-folder impact

- `db/schema.cds` defines the fields and relationships this file protects: `status`, `applicationComponent`, `defectCategory`, `componentCategory`, `assignee`, `nextProcessorUser`, `nextProcessorRole`, and `rejectionReason`.
- `srv/service.cds` exposes these fields through `BugService.Bugs`. If the service projection removes or renames a field, this handler must be reviewed.
- `app/bug-management-ui/annotations/*.cds` controls what users can see and edit in Fiori. Backend validation here must remain stricter than the UI, because UI hidden/read-only rules are not a security boundary.
- `srv/bug-service/actions.js` reuses `validateTransition`, `validateAssignee`, and `determineNextProcessor` when lifecycle buttons are clicked.
- `srv/bug-service/history.js` depends on `_oldBug`, `_finalBug`, and `_importantChanges` prepared here to create correct audit history.

### Safe editing checklist

- Do not relax backend validation just because Fiori already has required fields.
- If `componentCategory`, status, assignee, rejection, or nextProcessor behavior changes, update both service/action docs and Fiori value-help/action annotations.
- If changing status rules, update `ALLOWED_TRANSITIONS`, lifecycle action handlers, PM monitoring expectations, and tests together.
- If changing required fields, check create flow, seeded demo bugs, SAP490 test scenarios, and browser smoke paths.
- Keep this note bilingual and update English and Vietnamese equally.

## Vietnamese

### File này dùng để làm gì

File này là cổng kiểm tra backend trước khi một bug được tạo mới hoặc cập nhật.

Trong ứng dụng CAP này, màn hình Fiori không ghi thẳng vào database. Người dùng nhập hoặc sửa bug trên trình duyệt, Fiori gửi request OData đến `BugService`, sau đó `srv/service.js` gọi `prepareBugWrite()` trước khi CAP lưu dòng dữ liệu. Vì vậy file này là nơi IDTS bảo vệ lifecycle của bug khỏi dữ liệu ghi sai.

Với người mới học SAP/CAP/Fiori, hãy hiểu file này như “người gác cổng” cho thao tác ghi `BugService.Bugs`. Fiori giúp user nhập dữ liệu, nhưng backend ở file này mới là nơi quyết định dữ liệu đó có đúng rule IDTS hay không.

### Giải thích cho người mới

Khi Tester tạo hoặc sửa bug, hệ thống không chỉ lưu các ô trên form:

- Hệ thống phải bắt buộc các thông tin tối thiểu: title, description, steps to reproduce, actual result, expected result, priority, severity, application component, defect category, reporter.
- Hệ thống phải derive `componentCategory` từ Application Component + Defect Category. Trong IDTS, `componentCategory` là khóa phân công thật dùng để tìm Developer phù hợp.
- Hệ thống phải quyết định bug ở trạng thái `ASSIGNED` hay `PENDING_ASSIGNMENT`.
- Hệ thống phải chặn các bước nhảy status không hợp lệ.
- Hệ thống phải chặn bug `REJECTED` nếu không có `rejectionReason`.
- Hệ thống phải kiểm tra assignee có phải Developer active và phù hợp hay không.
- Hệ thống phải set `nextProcessorUser` và `nextProcessorRole`, tức người hoặc queue cần xử lý tiếp theo.

Vì vậy đây không chỉ là file validate dữ liệu. Đây là lớp rule backend cốt lõi cho create/update, assignment, rejected follow-up và current owner routing.

### Flow hoạt động trong IDTS

1. Fiori gửi dữ liệu create/update cho `BugService.Bugs`.
2. `srv/service.js:59-60` đăng ký `prepareBugWrite()` chạy trước `CREATE` và `UPDATE`.
3. `prepareBugWrite()` gộp dữ liệu bug cũ với dữ liệu mới, vì update có thể chỉ gửi các field thay đổi.
4. File này kiểm tra required fields, derive `componentCategory`, set hoặc kiểm tra status, kiểm tra permission, validate assignee và tính next processor.
5. CAP chỉ lưu bug nếu file này không reject request.
6. Sau đó `srv/bug-service/history.js` dùng `_oldBug`, `_finalBug`, và `_importantChanges` được chuẩn bị ở đây để ghi audit history.

### Important source anchors

Các anchor này chỉ ra những dòng kiểm soát nghiệp vụ thật của IDTS. Mục tiêu là nối code với flow nghiệp vụ, không phải mô tả code chung chung.

- **Vị trí**: `srv/bug-service/bug-write.js:25`
  `async function prepareBugWrite(req, entities, { isCreate })`
  **Khái niệm IDTS**: Pipeline ghi bug chính cho create/update. Nó set `bugNumber` và reporter khi tạo mới, derive `componentCategory`, quyết định `ASSIGNED` hay `PENDING_ASSIGNMENT`, bắt buộc `rejectionReason`, validate transition và assignee, rồi tính next processor.
  **Ảnh hưởng nếu sai**: Tester có thể tạo bug thiếu dữ liệu, bug có thể vào sai status, bug rejected có thể thiếu lý do follow-up, và PM monitoring có thể hiển thị sai current owner.
  **Phải kiểm tra cùng**: `srv/service.js:59-60` nơi đăng ký handler, `srv/service.cds:4` projection `Bugs`, `db/schema.cds:87` các field của `Bugs`, `srv/bug-service/history.js:53` side effect ghi history khi update.

- **Vị trí**: `srv/bug-service/bug-write.js:90`
  `function validateRequiredBugFields(req, bug)`
  **Khái niệm IDTS**: Cổng kiểm tra chất lượng tối thiểu của bug report. Nó chặn việc lưu bug thiếu thông tin cần thiết để Tester, Developer và PM hiểu và xử lý bug.
  **Ảnh hưởng nếu sai**: Developer có thể nhận bug thiếu steps to reproduce hoặc expected result, làm triage và retest không đáng tin.
  **Phải kiểm tra cùng**: `db/schema.cds:87` các required field của `Bugs`, field create/edit trên Object Page trong `app/bug-management-ui/annotations/object-page.cds`, demo seed trong `db/data/idts.cap-Bugs.csv`.

- **Vị trí**: `srv/bug-service/bug-write.js:109`
  `async function deriveOrValidateComponentCategory(req, entities, bug)`
  **Khái niệm IDTS**: Derive khóa phân công. Tester chọn Application Component và Defect Category, nhưng backend derive ra `componentCategory`, là khóa dùng bởi `DeveloperResponsibilities`.
  **Ảnh hưởng nếu sai**: Matching Developer sẽ sai, value help có thể hiện Developer không phù hợp, và PM có thể thấy bug bị kẹt ở queue phân công sai.
  **Phải kiểm tra cùng**: `db/schema.cds:73` `ComponentCategories`, `db/schema.cds:79` `DeveloperResponsibilities`, `srv/service.cds:160` `ValidDefectCategories`, các annotation value help của Fiori.

- **Vị trí**: `srv/bug-service/bug-write.js:138`
  `async function validateAssignee(req, entities, bug)`
  **Khái niệm IDTS**: Kiểm tra Developer được assign có phù hợp không. Nó xác nhận assignee là Developer active, không unavailable, và có responsibility đúng component/category cùng phạm vi SAP module nếu có.
  **Ảnh hưởng nếu sai**: Tester hoặc PM có thể assign bug cho Developer không rảnh hoặc không đúng năng lực, làm sai workload và giảm độ tin cậy demo.
  **Phải kiểm tra cùng**: `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, `db/data/idts.cap-DeveloperResponsibilities.csv`, `srv/service.cds:120` `AssignableDevelopers`.

- **Vị trí**: `srv/bug-service/bug-write.js:171`
  `function validateTransition(req, fromStatus, toStatus)`
  **Khái niệm IDTS**: Guard cho status lifecycle. Nó dùng `ALLOWED_TRANSITIONS` để bug không nhảy qua các bước workflow không hợp lệ.
  **Ảnh hưởng nếu sai**: Bug có thể bỏ qua review, retest, rejected follow-up hoặc reopen; history và bằng chứng SAP490 test sẽ không còn đáng tin.
  **Phải kiểm tra cùng**: `srv/bug-service/constants.js:96` transition map, `srv/bug-service/actions.js:184` action transition centralizer, các nút lifecycle trong `app/bug-management-ui/annotations/actions.cds`.

- **Vị trí**: `srv/bug-service/bug-write.js:179`
  `async function determineNextProcessor(req, entities, bug)`
  **Khái niệm IDTS**: Điều phối Current Action Owner. Nó map status sang người hoặc queue cần xử lý tiếp theo: PM cho pending assignment, Developer cho các trạng thái Developer xử lý, Tester cho follow-up của Tester, và không ai khi bug đã closed.
  **Ảnh hưởng nếu sai**: UI có thể hiển thị sai Current Action Owner, bug rejected hoặc need more information có thể không quay về đúng role, và queue monitoring của PM không còn đáng tin.
  **Phải kiểm tra cùng**: `db/schema.cds:105-106` `nextProcessorUser` và `nextProcessorRole`, `srv/service.cds:13-15` các virtual display field, `srv/bug-service/read-models.js:213` display enrichment, các annotation ownership/assignment.

### Liên kết với file khác

- `db/schema.cds` định nghĩa các field và quan hệ mà file này bảo vệ: `status`, `applicationComponent`, `defectCategory`, `componentCategory`, `assignee`, `nextProcessorUser`, `nextProcessorRole`, và `rejectionReason`.
- `srv/service.cds` expose các field đó qua `BugService.Bugs`. Nếu service projection xóa hoặc đổi tên field, handler này phải được kiểm tra lại.
- `app/bug-management-ui/annotations/*.cds` quyết định user thấy và sửa gì trong Fiori. Backend validation ở đây phải luôn chặt hơn UI, vì hidden/read-only trên UI không phải lớp bảo mật.
- `srv/bug-service/actions.js` dùng lại `validateTransition`, `validateAssignee`, và `determineNextProcessor` khi user bấm các lifecycle button.
- `srv/bug-service/history.js` phụ thuộc `_oldBug`, `_finalBug`, và `_importantChanges` được chuẩn bị ở đây để ghi audit history chính xác.

### Lưu ý khi sửa file này

- Không nới lỏng backend validation chỉ vì Fiori đã có required fields.
- Nếu đổi logic `componentCategory`, status, assignee, rejection hoặc nextProcessor, phải cập nhật service/action docs và Fiori value-help/action annotations.
- Nếu đổi status rule, phải cập nhật `ALLOWED_TRANSITIONS`, lifecycle action handlers, kỳ vọng PM monitoring và test cùng lúc.
- Nếu đổi required fields, kiểm tra create flow, seeded demo bugs, SAP490 test scenarios và browser smoke paths.
- Giữ note này song ngữ đầy đủ; sửa English và Vietnamese tương đương nhau.

## Metadata

- Source file: `srv/bug-service/bug-write.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/bug-write.js.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-06-22

## 2026-07-01 update: active catalog validation

### English

`prepareBugWrite()` now verifies that Priority, Severity, and Environment refer to real, active catalog rows before CAP writes a bug. This remains a backend rule even when Fiori provides value helps: a browser control improves data entry but cannot protect the database from direct OData calls or a modified client.

`validateActiveCodeLists()` uses the exact catalog code as the contract. For example, `QAS` is valid while `qas`, `1`, an unknown code, an inactive row, and whitespace are rejected with HTTP 400. The error targets the matching `*_code` field so Fiori can associate the message with the input.

- **Location**: `CODE_LIST_FIELDS` and `validateActiveCodeLists()`
  **IDTS concept**: Priority, Severity, and Environment are controlled classifications, not arbitrary text.
  **Impact if broken**: Invalid classifications can corrupt filtering, reporting, criticality colors, and QA evidence.
  **Must check together**: `db/schema.cds`, the three catalog CSV files, `srv/bug-service/drafts.js`, and Fiori value-list annotations.

When editing this rule, test create and update and prove rejected values are not persisted. Do not silently trim or change case, because that hides a faulty client and makes the API contract unpredictable.

### Vietnamese

`prepareBugWrite()` hiện kiểm tra Priority, Severity và Environment có trỏ đến dòng catalog thật sự tồn tại và đang active trước khi CAP ghi bug. Rule này vẫn phải nằm ở backend dù Fiori có value help: control trên trình duyệt chỉ hỗ trợ nhập liệu, không thể bảo vệ database trước OData gọi trực tiếp hoặc client đã bị sửa.

`validateActiveCodeLists()` dùng chính xác code trong catalog làm contract. Ví dụ `QAS` hợp lệ; còn `qas`, `1`, code không tồn tại, dòng inactive và chuỗi chỉ có khoảng trắng đều bị trả HTTP 400. Error target trỏ đúng field `*_code` để Fiori gắn thông báo vào ô gây lỗi.

- **Vị trí**: `CODE_LIST_FIELDS` và `validateActiveCodeLists()`
  **Khái niệm IDTS**: Priority, Severity và Environment là phân loại có kiểm soát, không phải text tự do.
  **Ảnh hưởng nếu sai**: Dữ liệu phân loại sai có thể làm hỏng filter, report, màu criticality và evidence QA.
  **Phải kiểm tra cùng**: `db/schema.cds`, ba file CSV catalog, `srv/bug-service/drafts.js` và annotation value list của Fiori.

Khi sửa rule này, phải test cả create lẫn update và chứng minh giá trị bị reject không được persist. Không tự trim hoặc đổi hoa/thường âm thầm vì cách đó che lỗi client và làm contract API khó đoán.

## IDTS-93 reusable Component Category validation

### English

`resolveComponentCategory()` is now an exported validation helper. Normal Bug writes still call it through `deriveOrValidateComponentCategory()`, while `classification-apply.js` calls it to re-derive the active component/category pair before applying an accepted suggestion. Primary owner: DonHV; backup: DatDT. Debug the selected component/category IDs, active pair query, and returned `ComponentCategories.ID`. Keep the helper read/validate-only; callers remain responsible for deciding which request patch is persisted.

### Vietnamese

`resolveComponentCategory()` hiện là validation helper được export. Ghi Bug bình thường vẫn gọi nó qua `deriveOrValidateComponentCategory()`, còn `classification-apply.js` dùng nó để derive lại cặp component/category active trước khi áp dụng suggestion đã Accept. Owner chính: DonHV; backup: DatDT. Khi debug, xem component/category ID được chọn, query cặp active và `ComponentCategories.ID` trả về. Giữ helper chỉ đọc/validate; caller vẫn chịu trách nhiệm quyết định patch nào được persist.
