# Knowledge: `srv/bug-service/bug-write.js`

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
