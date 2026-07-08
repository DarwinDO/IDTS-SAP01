# Knowledge: `srv/service.js`

## English

### What this file is for

This is the runtime bootstrap (wiring layer) for `BugService`. `srv/service.cds` declares the public OData contract (entities, actions, virtual fields). This JavaScript file attaches the real behavior: before-hooks for validation and preparation, after-hooks for side effects and enrichment, and on-handlers for custom reads and workflow actions.

It is the central "glue" that makes the bug lifecycle (create, assign, status transitions, comments, attachments, history, PM views) actually work at runtime.

### Beginner explanation (SAP/CAP for newcomers)

In SAP CAP, you define the data shape and API in CDS. The actual implementation (business rules, permissions, side effects) lives in a Node.js `ApplicationService` class.

This file extends `cds.ApplicationService` and in `init()` registers handlers:
- `this.before(...)` — run before the database operation (e.g. prepare data, validate permissions, set reporter/status).
- `this.after(...)` — run after the database operation (e.g. write HistoryEvents, create Notifications, enrich display names).
- `this.on(...)` — completely override or implement a custom read or action (e.g. `AssignableDevelopers` value help, `DeveloperWorkloads` aggregate, `assignToDeveloper`).

The detailed logic is delegated to focused modules under `srv/bug-service/` so this file stays clean as the registration point.

### IDTS flow

When a Tester or Developer interacts with the Fiori app:
1. Fiori calls an OData action (e.g. `assignToDeveloper`) or reads `/Bugs`.
2. CAP routes the request to this service.
3. Before hooks run `prepareBugWrite`, permission checks, draft preparation.
4. The action (from `actions.js`) or transition is executed.
5. After hooks write history, notifications, and enrich capabilities so the UI can show/hide the right buttons (`canResolve`, `canReject`...).
6. Read models (`read-models.js`, `monitoring.js`) fill display names and workload data for List Report/Object Page and PM monitoring.

This file is where all the IDTS status rules, nextProcessor updates, role separation (Tester vs Developer vs PM), and audit requirements come together at runtime.

### Important source anchors

- **Location**: `srv/service.js:43`
  `module.exports = class BugService extends cds.ApplicationService { async init() { ... } }`
  **IDTS concept**: The single place that wires the entire Bug lifecycle. It registers every before/after/on handler that enforces status transitions, assignment rules, history, notifications, capability flags for UI buttons, and PM monitoring aggregates.
  **Impact if broken**: No status transitions will run correctly, history will stop being written, DeveloperWorkloads and action visibility will be wrong, PM sees stale data.
  **Must check together**: `srv/service.cds` (the actions and virtual `can*` fields it binds to), all files under `srv/bug-service/` (actions, bug-write, read-models, history, permissions, monitoring), `db/schema.cds` (Bugs + compositions).

- **Location**: `srv/service.js:59-60`
  `this.before('CREATE', Bugs, req => prepareBugWrite(...))` and `this.before('UPDATE', Bugs, ...)`
  **IDTS concept**: Guarantees every bug create or edit goes through the central write pipeline (sets reporter, derives componentCategory, decides ASSIGNED vs PENDING_ASSIGNMENT, enforces rejection reason, validates transitions).
  **Impact if broken**: Bugs can be created without reporter or componentCategory, Rejected bugs without reason, invalid status jumps.
  **Must check together**: `srv/bug-service/bug-write.js`, `srv/service.cds:4` (Bugs projection), permissions.js, history side effects.

- **Location**: `srv/service.js:94-100` (approx)
  `this.on('assignToDeveloper', ...)` + other action ons + `this.on('READ', DeveloperWorkloads, ...)`
  **IDTS concept**: Dispatches the real IDTS actions (assign, addComment, moveToPending, resolve, reject, etc.) and the two key read models that power Fiori value help for assignment and the PM workload view.
  **Impact if broken**: Buttons do nothing or do the wrong thing; AssignableDevelopers and DeveloperWorkloads return empty or wrong data; PM monitoring broken.
  **Must check together**: `srv/bug-service/actions.js`, `read-models.js`, `monitoring.js`, `srv/service.cds` action declarations, Fiori `annotations/actions.cds` and value-helps.

- **Location**: `srv/service.js:71-76` + history and comment after hooks
  `this.after('CREATE', Bugs, recordCreateSideEffects)` + similar for UPDATE, Comments
  **IDTS concept**: Ensures every important change (including comments and attachments) creates proper HistoryEvents and Notifications. This is the foundation of the audit trail and in-app notification requirements.
  **Impact if broken**: No history visible on Object Page, no notifications for developers when assigned or when more info is needed, broken PM audit evidence.
  **Must check together**: `srv/bug-service/history.js`, `content.js`, `db/schema.cds` (HistoryEvents, Notifications compositions).

### Cross-folder dependency map

- **Wiring layer → `srv/service.cds`**: This file implements the contract declared in the CDS service (actions, virtual fields, projections). Changing an action signature or adding a virtual field here requires matching CDS + annotations.
- **Implementation modules → `srv/bug-service/*`**: All real logic lives in the submodules loaded here. Changing wiring without the submodule will break.
- **Data model → `db/schema.cds`**: Every handler ultimately reads/writes Bugs, Comments, HistoryEvents, etc. Schema changes (new fields, associations, compositions) must be reflected in the enrichment and side-effect code.
- **UI layer → `app/bug-management-ui/webapp/manifest.json` + annotations/**: The manifest points at `/odata/v4/bug/`. Annotations rely on the virtual capability fields and action names exposed through this service. Wrong wiring = wrong buttons or missing data in Fiori.

### Safe editing checklist

- Never remove a before/after/on registration without also handling the corresponding action or read model.
- When adding a new lifecycle action, register the handler here + implement it in actions.js + expose it in service.cds + add annotation for the button + update capability logic if needed.
- When touching read enrichment (display names, canXXX flags), also check Fiori Object Page/List Report and PM views.
- Always run `cds compile srv --to edmx` and the relevant programmatic/backend tests after changes.
- Update the matching knowledge mirror (this file) and the mirrors of any bug-service module you touched.

## Vietnamese

### File này dùng để làm gì

Đây là file "khởi động runtime" (lớp nối) cho BugService. File `srv/service.cds` khai báo hợp đồng OData công khai (các entity, action, virtual field). File JavaScript này gắn hành vi thực tế vào: before-hook để kiểm tra và chuẩn bị dữ liệu, after-hook để ghi side effect và làm giàu dữ liệu, on-handler cho các đọc tùy chỉnh và action workflow.

Đây là "keo nối" trung tâm khiến toàn bộ vòng đời bug (tạo, phân công, chuyển trạng thái, comment, attachment, lịch sử, màn hình PM) thực sự chạy được.

### Giải thích cho người mới (SAP/CAP)

Trong SAP CAP, bạn định nghĩa hình dạng dữ liệu và API bằng CDS. Phần thực thi nghiệp vụ (luật kinh doanh, phân quyền, side effect) nằm trong class `ApplicationService` Node.js.

File này kế thừa `cds.ApplicationService` và trong hàm `init()` đăng ký các handler:
- `this.before(...)`: chạy trước khi ghi xuống CSDL (chuẩn bị dữ liệu, kiểm tra quyền, set reporter/status).
- `this.after(...)`: chạy sau khi ghi (ghi HistoryEvents, tạo Notifications, bổ sung tên hiển thị).
- `this.on(...)`: ghi đè hoặc tự xử lý hoàn toàn một read/action (ví dụ AssignableDevelopers, DeveloperWorkloads, assignToDeveloper).

Logic chi tiết được đẩy sang các module con trong `srv/bug-service/`, file này chỉ giữ vai trò đăng ký sạch sẽ.

### Flow hoạt động trong IDTS

Khi Tester hoặc Developer thao tác trên Fiori:
1. Fiori gọi action OData (ví dụ assignToDeveloper) hoặc đọc /Bugs.
2. CAP chuyển request vào service này.
3. Before hooks chạy prepareBugWrite, kiểm tra quyền, chuẩn bị draft.
4. Action (từ actions.js) hoặc transition được thực thi.
5. After hooks ghi lịch sử, thông báo và tính toán capability để UI hiện/ẩn đúng nút (canResolve, canReject...).
6. Read models (read-models, monitoring) điền tên hiển thị và dữ liệu workload cho List Report/Object Page và màn hình theo dõi PM.

File này là nơi tất cả quy tắc trạng thái IDTS, cập nhật nextProcessor, phân tách vai trò (Tester/Developer/PM) và yêu cầu audit được thực thi lúc chạy.

### Các điểm neo quan trọng trong source

- **Vị trí**: `srv/service.js:43`
  `module.exports = class BugService extends cds.ApplicationService { async init() { ... } }`
  **Khái niệm IDTS**: Nơi duy nhất nối toàn bộ vòng đời Bug. Nó đăng ký mọi before/after/on handler để thực thi chuyển trạng thái, quy tắc phân công, lịch sử, thông báo, cờ khả năng cho nút UI, và aggregate theo dõi PM.
  **Ảnh hưởng nếu sai**: Chuyển trạng thái không chạy đúng, không ghi history, DeveloperWorkloads và khả năng hành động sai, PM thấy dữ liệu cũ.
  **Phải kiểm tra cùng**: `srv/service.cds`, tất cả file trong `srv/bug-service/`, `db/schema.cds`.

- **Vị trí**: `srv/service.js:59-60`
  before CREATE và UPDATE Bugs gọi prepareBugWrite
  **Khái niệm IDTS**: Đảm bảo mọi lần tạo/sửa bug đều đi qua pipeline ghi trung tâm (set reporter, suy ra componentCategory, chọn ASSIGNED hay PENDING_ASSIGNMENT, bắt buộc rejectionReason, kiểm tra transition).
  **Ảnh hưởng nếu sai**: Bug tạo thiếu reporter hoặc componentCategory, Rejected không có lý do, chuyển trạng thái sai quy tắc.
  **Phải kiểm tra cùng**: `srv/bug-service/bug-write.js`, service.cds, permissions, history.

- **Vị trí**: Các dòng đăng ký action và read model (assignToDeveloper, DeveloperWorkloads, ...)
  **Khái niệm IDTS**: Gọi thực thi các action nghiệp vụ IDTS và hai read model quan trọng cho value help phân công và view workload của PM.
  **Ảnh hưởng nếu sai**: Nút không hoạt động hoặc sai, AssignableDevelopers và DeveloperWorkloads trả dữ liệu sai, theo dõi PM hỏng.
  **Phải kiểm tra cùng**: actions.js, read-models.js, monitoring.js, service.cds, annotations.

- **Vị trí**: Các after hook cho CREATE/UPDATE + Comments
  **Khái niệm IDTS**: Đảm bảo mọi thay đổi quan trọng (kể cả comment, attachment) đều tạo HistoryEvents và Notifications. Đây là nền tảng của audit trail và thông báo trong app.
  **Ảnh hưởng nếu sai**: Không thấy lịch sử trên Object Page, không có thông báo cho developer, thiếu bằng chứng audit cho PM.
  **Phải kiểm tra cùng**: history.js, content.js, schema.cds.

### Liên kết với file/folder khác

- Lớp nối → `srv/service.cds`: File này thực thi hợp đồng đã khai báo (action, virtual field). Thay đổi chữ ký action ở đây phải khớp CDS + annotation.
- Module thực thi → `srv/bug-service/*`: Logic thật nằm ở các module con được nạp ở đây.
- Mô hình dữ liệu → `db/schema.cds`: Mọi handler cuối cùng đọc/ghi Bugs, Comments, HistoryEvents... Thay đổi schema phải phản ánh trong enrichment và side-effect.
- Lớp UI → manifest.json + annotations: Manifest trỏ đến service. Annotation dựa vào các virtual capability và tên action do service này cung cấp.

### Checklist sửa an toàn

- Không bỏ đăng ký before/after/on mà không xử lý tương ứng action/read model.
- Khi thêm action lifecycle mới: đăng ký handler ở đây + implement trong actions.js + expose trong service.cds + thêm annotation + cập nhật logic capability.
- Khi sửa enrichment (tên hiển thị, cờ canXXX) thì phải kiểm tra Object Page/List Report và view PM.
- Luôn chạy `cds compile srv --to edmx` và test backend liên quan sau khi sửa.
- Cập nhật mirror knowledge của file này và các module bug-service bị thay đổi.

## Metadata

- Source file: `srv/service.js`
- Knowledge mirror: `docs/knowledge/srv/service.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: ~156 (approx after refactor)
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## IDTS-67 update: classification suggestion wiring

### English

`srv/service.js` now imports `suggestClassification` from `srv/ai` and registers it as the handler for the `suggestClassification` OData action declared in `srv/service.cds`.

This file still only wires the action. It does not contain the classification logic. The actual AI provider call, catalog validation, fallback, and audit writing are in `srv/ai/classification-suggestion.js`.

- **Location**: AI import and `this.on('suggestClassification', ...)`
  - **IDTS concept**: CAP runtime action wiring.
  - **Impact if broken**: the OData action may exist in metadata but fail at runtime, or call the wrong handler.
  - **Must check together**: `srv/service.cds`, `srv/ai/index.js`, `srv/ai/classification-suggestion.js`, and `scripts/qa/test-idts67-classification-suggestion.js`.

### Tiếng Việt

`srv/service.js` hiện import `suggestClassification` từ `srv/ai` và đăng ký nó làm handler cho OData action `suggestClassification` đã khai báo trong `srv/service.cds`.

File này vẫn chỉ làm nhiệm vụ nối action vào runtime. Nó không chứa logic phân loại. Phần gọi AI provider, validate catalog, fallback và ghi audit nằm trong `srv/ai/classification-suggestion.js`.

- **Vị trí**: import AI và `this.on('suggestClassification', ...)`
  - **Khái niệm IDTS**: nối CAP action vào runtime handler.
  - **Ảnh hưởng nếu sai**: OData action có thể xuất hiện trong metadata nhưng lỗi khi gọi runtime, hoặc gọi nhầm handler.
  - **Phải kiểm tra cùng**: `srv/service.cds`, `srv/ai/index.js`, `srv/ai/classification-suggestion.js`, và `scripts/qa/test-idts67-classification-suggestion.js`.

## IDTS-66 similar-bug handler wiring

### English

The service now registers `this.on('suggestSimilarBugs', ...)` and delegates the work to `srv/ai/duplicate-detection.js`. `service.js` does not contain scoring logic; it remains the wiring layer between the CDS action and the focused AI module.

Important anchor:

- **Location**: `this.on('suggestSimilarBugs', req => suggestSimilarBugs(req, entities))`
  - **IDTS concept**: authenticated CAP action dispatch.
  - **Impact if broken**: the action still appears in OData metadata but fails at runtime or bypasses the approved module.
  - **Must check together**: `srv/service.cds`, `srv/ai/index.js`, `srv/ai/duplicate-detection.js`, and the IDTS-66 programmatic test.

### Vietnamese

Service đăng ký thêm `this.on('suggestSimilarBugs', ...)` và giao toàn bộ xử lý cho `srv/ai/duplicate-detection.js`. `service.js` không chứa logic tính điểm; nó vẫn chỉ là lớp nối giữa CDS action và module AI chuyên trách.

Điểm neo quan trọng:

- **Vị trí**: `this.on('suggestSimilarBugs', req => suggestSimilarBugs(req, entities))`
  - **Khái niệm IDTS**: điều phối CAP action đã được bảo vệ bởi authenticated service.
  - **Ảnh hưởng nếu sai**: action vẫn xuất hiện trong OData metadata nhưng lỗi runtime hoặc bỏ qua module đã được duyệt.
  - **Phải kiểm tra cùng**: `srv/service.cds`, `srv/ai/index.js`, `srv/ai/duplicate-detection.js` và programmatic test IDTS-66.

## 2026-07-01 update: draft lifecycle authorization

### English

The service registers `enforceBugCreatePermission()` on `before('NEW', Bugs.drafts, ...)`. `NEW` is CAP's draft-specific event for starting a root draft; it is different from an ordinary database `CREATE`. This stops an unauthorized Developer before Fiori opens a writable new-Bug draft.

For IDTS-49, this hook also captures the returned authenticated IDTS actor and passes it to `prepareDraftNew()`. That makes reporter initialization happen at draft creation time, not only at active `CREATE` time.

- **Location**: the `NEW` hook beside CREATE/UPDATE/PATCH registration
  **IDTS concept**: Backend authorization and role-aware Fiori UX agree from the first create step.
  **Impact if broken**: Developer enters the form and is rejected only later, or a valid PM/Tester draft can fail activation with `Reporter is required`.
  **Must check together**: `permissions.js`, `drafts.js`, CAP draft lifecycle, List Report Create behavior, and role-matrix browser QA.

### Vietnamese

Service dang ky `enforceBugCreatePermission()` tai `before('NEW', Bugs.drafts, ...)`. `NEW` la event rieng cua CAP khi bat dau root draft; no khac database `CREATE` thong thuong. Hook nay chan Developer khong co quyen truoc khi Fiori mo draft tao Bug co the chinh sua.

Voi IDTS-49, hook nay con lay authenticated IDTS actor do permission function tra ve va truyen sang `prepareDraftNew()`. Nho vay reporter duoc khoi tao ngay luc tao draft, khong phai chi den active `CREATE` moi set.

- **Vi tri**: hook `NEW` canh phan dang ky CREATE/UPDATE/PATCH
  **Khai niem IDTS**: Backend authorization va UX theo role cua Fiori phai khop ngay tu buoc create dau tien.
  **Anh huong neu sai**: Developer vao duoc form roi chi bi chan o buoc sau, hoac draft hop le do PM/Tester tao co the fail activation voi `Reporter is required`.
  **Phai kiem tra cung**: `permissions.js`, `drafts.js`, CAP draft lifecycle, hanh vi Create cua List Report, va browser QA theo role matrix.

### Vietnamese

Service đăng ký `enforceBugCreatePermission()` tại `before('NEW', Bugs.drafts, ...)`. `NEW` là event riêng của CAP khi bắt đầu root draft; nó khác database `CREATE` thông thường. Hook này chặn Developer không có quyền trước khi Fiori mở draft tạo Bug có thể chỉnh sửa.

- **Vị trí**: hook `NEW` cạnh phần đăng ký CREATE/UPDATE/PATCH
  **Khái niệm IDTS**: Backend authorization và UX theo role của Fiori phải khớp ngay từ bước create đầu tiên.
  **Ảnh hưởng nếu sai**: Developer vào được form rồi chỉ bị chặn ở bước sau, gây khó hiểu và không an toàn.
  **Phải kiểm tra cùng**: `permissions.js`, lifecycle draft CAP, hành vi Create của List Report và browser QA theo ma trận role.

## IDTS-36 Worker Bootstrap Update

### English

After all BugService handlers are registered and `super.init()` completes, the service calls `startEmailWorker()`. This does not immediately send email: the worker module first checks private configuration and stays inactive when email is disabled or incomplete.

- **Location**: `srv/service.js:42` and `:156`
  import and call of `startEmailWorker`
  **IDTS concept**: Start asynchronous SMTP delivery only after the CAP service is ready.
  **Impact if broken**: No outbox rows are delivered, or a worker starts too early/too often and competes with service initialization.
  **Must check together**: `srv/email/worker.js`, `package.json` email defaults, application startup smoke test.

### Vietnamese

Sau khi toàn bộ BugService handler được đăng ký và `super.init()` hoàn tất, service gọi `startEmailWorker()`. Lệnh này chưa gửi email ngay: worker kiểm tra private config trước và không hoạt động nếu email đang tắt hoặc cấu hình chưa đủ.

- **Vị trí**: `srv/service.js:42` và `:156`
  import và gọi `startEmailWorker`
  **Khái niệm IDTS**: Chỉ khởi động việc gửi SMTP bất đồng bộ sau khi CAP service đã sẵn sàng.
  **Ảnh hưởng nếu sai**: Outbox không được xử lý hoặc worker khởi động quá sớm/quá nhiều lần và xung đột với service initialization.
  **Phải kiểm tra cùng**: `srv/email/worker.js`, email defaults trong `package.json`, startup smoke test.
- The result is returned to Fiori and/or persisted using entities from `db/schema.cds`.

### Các ý quan trọng cần hiểu

- `this.before(...)` is where the service prepares or validates data before CAP saves or reads it.
- `this.after(...)` enriches read results or records side effects after CAP has done the core operation.
- `this.on(...)` handles custom reads/actions such as `AssignableDevelopers`, `DeveloperWorkloads`, and workflow actions.
- This file should stay as wiring/orchestration; detailed logic belongs in focused modules under `srv/bug-service/`.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **Module wiring → `srv/service.js`**: This module is loaded by the BugService bootstrap or a module that bootstrap uses. Impact: Changing exports/imports requires updating the service wiring.
- **Runtime contract → `srv/service.cds`**: The module implements behavior behind service entities/actions declared in CDS. Impact: The public OData contract and JavaScript behavior must stay aligned.
- **Data access → `db/schema.cds`**: The module reads/writes/query entities and associations from the data model. Impact: Renaming schema fields or changing associations can break handlers.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Keep backend validation authoritative; hidden UI buttons are not a security boundary.
- If action names, virtual fields, or entity names change, update CDS, annotations, tests, and this note together.

## Metadata

- Source file: `srv/service.js`
- Knowledge mirror: `docs/knowledge/srv/service.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: 156
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## IDTS-68 Bug Handoff Summary Wiring Update

### English

IDTS-68 updates this runtime wiring file to register `this.on('summarizeBugHandoff', ...)`.

The service declaration lives in `srv/service.cds`, but CAP still needs this JavaScript registration so incoming OData action calls reach `srv/ai/bug-summary.js`. This keeps the service entry point consistent with the existing AI actions `suggestSimilarBugs` and `suggestClassification`.

If this registration is removed, metadata may still show the action, but the runtime action will not execute correctly.

### Vietnamese

IDTS-68 cap nhat file wiring runtime nay de dang ky `this.on('summarizeBugHandoff', ...)`.

Khai bao service nam trong `srv/service.cds`, nhung CAP van can registration JavaScript nay de OData action goi vao dung `srv/ai/bug-summary.js`. Cach nay giu service entry point nhat quan voi hai AI action hien co la `suggestSimilarBugs` va `suggestClassification`.

Neu bo registration nay, metadata co the van thay action, nhung runtime action se khong chay dung.