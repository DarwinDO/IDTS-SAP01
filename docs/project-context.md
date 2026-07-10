# Project Context: Issue and Defect Tracking System in SAP

## Summary

IDTS is a SAP CAP + Fiori Elements/SAPUI5 application for tracking bugs and defects in an SAP software testing environment. The system supports reporting, duplicate checking, classification by SAP module, application component, and defect category, assignment to a suitable developer, developer review, retest before closure, comments, attachments, notifications, audit/history logs, and PM monitoring.

This is not a full Jira replacement and not a source-code workflow system. Developers use IDTS to review assigned bugs, request information, reject wrong assignments, add notes, and update statuses. A rejected bug must continue to a clear follow-up owner and action through `nextProcessor`; rejection is not a silent final state. Code fixes, CI/CD, code review, sprint planning, mandatory AI root cause analysis, and autonomous AI workflow actions are outside the current scope.

Vietnamese: IDTS không phải Jira đầy đủ và không phải hệ thống quản lý source code. Developer dùng IDTS để review bug được assign, request thêm thông tin, reject assignment/phân loại sai, ghi chú và cập nhật status. Bug ở trạng thái `Rejected` vẫn phải có người xử lý tiếp và action tiếp theo rõ ràng thông qua `nextProcessor`; reject không phải trạng thái kết thúc im lặng.

## AI Assistance Direction

- Approved AI v1 capabilities are duplicate/similar detection, classification suggestion, bug/handoff summary, and Smart Assign explanation.
- AI is suggestion-only. Users explicitly review, accept, reject, ignore, or apply results.
- AI cannot assign, persist classification, confirm duplicates, or change bug lifecycle state by itself.
- CAP validation and authorization remain authoritative.
- AI is disabled by default, and provider failure cannot break the normal bug workflow.
- Provider payloads use minimum allowlisted data. Credentials, tokens, private email/endpoint data, attachments, and storage references are forbidden in v1.
- Persist only normalized safe suggestion/audit data; do not persist raw prompts, raw provider responses, or hidden reasoning.
- AI suggestions are stored as reviewable `AiSuggestions` audit rows linked to a source bug. The row is evidence for human review, not an autonomous workflow decision.
- Runtime supports a disabled-by-default `mock` provider and an optional server-side OpenAI provider. OpenAI credentials and approved model aliases remain private environment configuration; a missing key or model returns a safe unavailable result and never breaks the normal workflow.
- Vietnamese note: Runtime hỗ trợ provider `mock` mặc định tắt và provider OpenAI phía server là tùy chọn. Credential OpenAI và model alias được duyệt chỉ nằm trong cấu hình môi trường private; thiếu key hoặc model phải trả trạng thái unavailable an toàn và không được làm hỏng workflow bình thường.
- Vietnamese note: AI suggestion duoc luu thanh audit row `AiSuggestions` gan voi bug nguon de con nguoi review, khong phai quyet dinh workflow tu dong.
- IDTS-66 exposes suggestion-only duplicate/similar candidates through `BugService.suggestSimilarBugs`. It combines text overlap, business classification, and provider embeddings, falls back safely when AI is unavailable, and never writes `DuplicateLinks` automatically. Pre-create checks can run without a persisted bug; source-linked checks write only a safe `AiSuggestions` audit row.
- Vietnamese note: IDTS-66 expose candidate duplicate/similar theo huong suggestion-only qua `BugService.suggestSimilarBugs`. Backend ket hop text, classification va embedding, fallback an toan khi AI khong san sang, khong tu ghi `DuplicateLinks`; check truoc create khong can bug da persist, con check co source bug chi ghi `AiSuggestions` audit row an toan.

Vietnamese: AI v1 chỉ hỗ trợ tìm bug trùng/tương tự, gợi ý phân loại, tạo bug/handoff summary và giải thích Smart Assign. AI không tự hành động; người dùng phải review và chủ động quyết định. CAP vẫn là lớp validation/phân quyền cuối. AI mặc định tắt, lỗi AI không được làm hỏng workflow bình thường, và dữ liệu gửi provider phải tối thiểu, đã allowlist, không chứa secret, email private, attachment hoặc storage reference.

## Stack

- Backend: SAP CAP Node.js
- API: OData V4
- Frontend: SAP Fiori Elements / SAPUI5
- Local database: SQLite
- Team integration database: shared PostgreSQL through CAP profile `integration`
- Future deployment database: SAP HANA Cloud or PostgreSQL
- Current Fiori app: `app/bug-management-ui`
- Current service: `BugService` at `/odata/v4/bug/`

## Authentication Direction

- Near-term login does not depend on SAP BTP/XSUAA because the team does not currently have a BTP account path.
- IDTS uses a custom CAP Node.js auth foundation: `AuthService.login` verifies email/password against `Users.passwordHash`, creates an `AuthSessions` row, and returns a bearer token.
- `Users` remains the internal business profile and role source for Tester, Developer, and PM.
- HTTP requests to `BugService` must send the bearer token; the custom auth middleware maps the token back to `cds.User` with `authenticated-user` plus the IDTS business role.
- Passwords, tokens, auth secrets, SMTP credentials, and private endpoints must not be committed. Local passwords are set through private environment variables and stored only as hashes.

Vietnamese: Huong login gan han khong phu thuoc SAP BTP/XSUAA. IDTS dung custom auth trong CAP Node.js: `AuthService.login` verify email/password bang `Users.passwordHash`, tao `AuthSessions`, va tra bearer token. `Users` van la nguon profile/role noi bo cho Tester, Developer, PM. Request vao `BugService` gui bearer token; middleware map token thanh `cds.User`. Khong commit password, token, auth secret, SMTP credential hoac private endpoint.

## Email Notification Direction

- `Notifications` is the in-app source event. New in-app rows are considered delivered when persisted (`IN_APP/SENT`).
- `NotificationDeliveries` is the separate email outbox and stores safe payload snapshots, delivery status, attempts, retry timing, sanitized failure detail, and worker locking.
- Nodemailer sends through real SMTP only when private configuration is explicitly enabled and complete.
- A CAP `cds.spawn` worker processes outbox rows after the original workflow request. SMTP failure changes delivery status but does not roll back bug assignment or lifecycle work.
- Existing historical notifications are not automatically emailed after IDTS-36 deployment.
- Email v1 uses the CAP database outbox; Redis, RabbitMQ, BullMQ, and provider-specific SDKs are not required.

Vietnamese: `Notifications` la source event trong app va record moi duoc xem la `IN_APP/SENT` ngay khi luu thanh cong. `NotificationDeliveries` la email outbox rieng, luu payload snapshot an toan, status, so lan thu, lich retry, loi da lam sach va worker lock. Nodemailer chi gui SMTP that khi private config duoc bat ro rang va day du. Worker CAP `cds.spawn` xu ly outbox sau request workflow ban dau; SMTP fail chi doi delivery status, khong rollback assignment hoac lifecycle action. Notification lich su khong tu dong duoc gui lai. V1 dung CAP database outbox, khong can Redis/RabbitMQ/BullMQ hay provider SDK.

## Roles

| Role | Responsibility |
| --- | --- |
| Tester | Detect bugs, create and update bug reports, check duplicates, classify bugs, assign/reassign developers, provide requested information, retest, close or reopen when needed, comment, and track status |
| Developer | View assigned and team-visible bugs when permitted, discuss/comment, review bug details, request more information, reject wrong classification or unsuitable assignment with reason, add optional developer notes when useful, and update processing status only when assigned or authorized |
| PM | Monitor all bugs, workload, overdue bugs, status progress, history, reports, and escalation notifications |

MVP role baseline: IDTS currently uses three active roles only: Tester, Developer, and PM. `Reporter` is not a separate MVP role because the project is internal and Testers are the primary people who find and report bugs. `Admin` is not a separate MVP role because no dedicated admin workflow is planned yet; lightweight administrative responsibilities such as master-data upkeep, classification correction, and reassignment coordination are handled by Tester or PM where authorized.

Vietnamese: Baseline role của MVP hiện chỉ có ba role active: Tester, Developer và PM. `Reporter` không tách thành role riêng trong MVP vì dự án dùng nội bộ và Tester là người chính phát hiện, báo cáo bug. `Admin` cũng chưa tách thành role riêng vì hiện chưa có workflow admin chuyên biệt; các trách nhiệm quản trị nhẹ như duy trì master data, sửa phân loại và điều phối reassignment sẽ do Tester hoặc PM xử lý theo quyền được cấp.

## Main Entities

Expected domain entities:

- `Bugs`
- `Developers`
- `SAPModules`
- `ApplicationComponents`
- `DefectCategories`
- `ComponentCategories`
- `DeveloperResponsibilities`
- `Comments`
- `Attachments`
- `HistoryEvents`
- `HistoryLogs`
- `Notifications`
- `NotificationDeliveries`
- `AiSuggestions`

Potential support entities:

- `Users` or role mapping, if needed later
- `DeveloperResponsibilities` for developer capability matching by component/category and optional SAP module scope
- `StatusValues`, `PriorityValues`, `SeverityValues`, if the model needs managed value lists
- Optional test context fields on `Bugs`, such as `testCaseRef`, `testRunRef`, and `environment`, without building a full test management module
- Optional planning/ownership fields on `Bugs`, such as `plannedCompletionDate`, `dueDate`, `estimatedEffortHours`, and `nextProcessor`

## Database Modeling Baseline

WP1 Data Model Foundation should follow the decision baseline in `docs/ba/09-database-model-review.md`.

Key baseline decisions:

- `nextProcessor` is a lightweight hybrid ownership concept: store a specific user when known and keep a role/queue code for cases such as PM queue, Tester follow-up, or Unassigned Queue. It is not a second assignee.
- Tester selects Application Component and Defect Category in Fiori. The system derives or validates Component Category as the assignment key.
- Bug should store Application Component, Defect Category, and Component Category with backend consistency validation.
- Rejected bugs should keep the latest `rejectionReason` on Bug and immutable rejection reasons in HistoryLogs.
- User-facing history should be grouped as `HistoryEvents` with a readable summary, while `HistoryLogs` remains the append-only field-level audit trail under each event.
- The attachment model now uses the SAP-supported `@cap-js/attachments` composition. SQLite/DB fallback remains available for local development, while profile `integration` targets shared PostgreSQL plus bound external object storage. Final external-storage acceptance still requires the shared object-store binding.
- Bugs should have a human-readable `bugNumber` in addition to UUID.
- SAP Module remains optional context and optional assignment filter, not a mandatory field for every bug. For pure IDTS bugs, leave it empty instead of using a pseudo-value such as `Not Applicable`.
- Duplicate checking stores confirmed Duplicate/Similar/Related links in `DuplicateLinks`; runtime candidates are not persisted in MVP.
- AI suggestion audit stores safe, normalized `AiSuggestions` rows linked to a source bug. It does not store raw prompts, raw provider responses, attachment content, credentials, or hidden reasoning.
- Vietnamese note: AI suggestion audit chi luu cac dong `AiSuggestions` da chuan hoa va an toan, gan voi bug nguon. Khong luu raw prompt, raw provider response, attachment content, credential hoac hidden reasoning.

Vietnamese:

WP1 Data Model Foundation nên đi theo decision baseline trong `docs/ba/09-database-model-review.md`.

Các quyết định chính:

- `nextProcessor` là ownership concept dạng hybrid nhẹ: lưu user cụ thể khi biết rõ và lưu role/queue code cho các trường hợp như PM queue, Tester follow-up hoặc Unassigned Queue. Nó không phải assignee thứ hai.
- Tester chọn Application Component và Defect Category trên Fiori. Hệ thống derive hoặc validate Component Category làm assignment key.
- Bug nên lưu Application Component, Defect Category và Component Category, kèm backend consistency validation.
- Bug bị Rejected nên lưu `rejectionReason` mới nhất trên Bug và lưu reason bất biến trong HistoryLogs.
- Lich su hien cho nguoi dung nen duoc nhom theo `HistoryEvents` co summary de doc nhanh, con `HistoryLogs` van la audit trail append-only o muc field cho moi event.
- Model attachment hiện dùng composition của `@cap-js/attachments`. Local development vẫn có SQLite/DB fallback; profile `integration` dùng PostgreSQL chung và external object storage được bind riêng. Acceptance cuối cho external storage còn phụ thuộc shared object-store binding.
- Bug nên có `bugNumber` dễ đọc ngoài UUID.
- SAP Module là context tùy chọn và filter assignment tùy chọn, không bắt buộc cho mọi bug. Với bug thuần IDTS thì để trống, không dùng giá trị giả như `Not Applicable`.
- Duplicate checking chỉ lưu link Duplicate/Similar/Related đã xác nhận trong `DuplicateLinks`; candidate runtime không persist trong MVP.

## Main Statuses

- New (legacy/import compatibility only)
- Pending Assignment
- Assigned
- In Review
- Need More Information
- In Progress
- Resolved
- Retest Required
- Rejected
- Reopened
- Closed

## Main Flows

### Create Bug

1. Tester detects a bug.
2. Tester checks for an existing similar bug.
3. Tester creates a bug report if no suitable open bug exists.
4. Tester enters title, description, SAP module if relevant, application component, defect category, priority, severity, environment, steps to reproduce, actual result, expected result, optional test case/test run references, and optional evidence.
5. System validates mandatory fields.
6. System creates a unique bug ID, sets the initial persisted status to `Assigned` or `Pending Assignment`, and writes audit history.

Current MVP note: `New` remains in the status catalog for legacy/import compatibility, but the normal create happy flow does not persist `New`. A newly submitted bug starts in `Assigned` when a developer is selected, or `Pending Assignment` when no suitable developer is selected.

Current create-assignment clarification: IDTS must not automatically pick a Developer during create. If the Tester or PM does not explicitly select an assignee, the bug starts as `Pending Assignment`.

Vietnamese: IDTS không được tự chọn Developer khi tạo bug. Nếu Tester hoặc PM không chủ động chọn assignee, bug sẽ bắt đầu ở `Pending Assignment`.

### Assign Bug

1. Tester selects SAP module if relevant, application component, and defect category.
2. System filters suitable developers by component/category and optional SAP module scope.
3. Tester selects a developer or "No suitable developer".
4. If a developer is selected, status becomes Assigned.
5. If no suitable developer is selected, status becomes Pending Assignment.
6. System records assignment history and sends notification when applicable.

### Developer Review

1. Developer opens assigned bug.
2. Developer reviews details, evidence, comments, and history.
3. Developer moves status to In Review or In Progress when appropriate.
4. Developer can request more information if the bug is unclear.
5. Developer can reject if the bug classification or assignment is unsuitable.
6. Developer adds notes and status updates; the system writes history entries.

### Request More Information

1. Developer changes status to Need More Information and adds a reason.
2. Tester receives notification.
3. Tester updates the bug report, comments, attachments, or reproduction details with the missing information.
4. Tester or PM uses a dedicated `Resubmit to Developer` action and enters an update summary.
5. System returns the bug to Assigned, sets `nextProcessor` back to the assigned Developer, writes history, creates a follow-up comment, and sends a notification to the Developer.

### Reject and Reassign

1. Developer rejects a bug with a reason when classification or assignment is wrong.
2. System sets status to Rejected and sets nextProcessor to Tester or PM.
3. Tester or PM reviews the rejection reason.
4. Tester or PM updates SAP module, application component, defect category, missing information, or assignee if needed.
5. Tester or PM reassigns to a suitable developer or moves it to Pending Assignment.
6. Rejected is not a final status; it must lead to a follow-up action and history log.
7. In MVP, Rejected does not go directly to Need More Information; the follow-up path is reassign or move to Pending Assignment.

Vietnamese:

1. Developer reject bug kèm lý do khi phân loại hoặc assignee không phù hợp.
2. Hệ thống chuyển status sang Rejected và set nextProcessor là Tester hoặc PM.
3. Tester hoặc PM xem lại lý do reject.
4. Tester hoặc PM sửa SAP module, application component, defect category, thông tin thiếu hoặc assignee nếu cần.
5. Tester hoặc PM reassign cho Developer phù hợp hoặc chuyển về Pending Assignment.
6. Rejected không phải final status; nó phải dẫn tới follow-up action và history log.

### Resolve, Retest, Close, and Reopen

1. Developer marks bug as Resolved and adds a note.
2. System or Tester moves the bug to Retest Required when verification is needed.
3. Tester or PM verifies the result.
4. Bug is Closed when accepted.
5. Tester can Reopen if the issue still exists.

### Next Processor Ownership

1. The system maintains `nextProcessor` as the person or queue expected to take the next action.
2. `nextProcessor` does not replace `assignee`; `assignee` remains the main Developer responsible for technical handling.
3. UI wording baseline: show `Assignee (Technical Owner)` for the developer owner and `Current Action Owner` for the person or queue that must act now.
4. CAP handlers should update `nextProcessor` automatically when status, assignee, or assignment decision changes.
5. Common mappings:
   - Assigned, In Review, In Progress: assigned Developer.
   - Need More Information: Tester.
   - Pending Assignment: PM queue or Tester.
   - Rejected: Tester or PM must correct classification, reassign, or move to Pending Assignment.
   - Resolved and Retest Required: Tester or PM.
   - Closed: no next processor.
6. Manual override should be limited to PM escalation or exceptional reassignment in the MVP.
7. Every important `nextProcessor` change should be written to history logs.

### PM Monitoring

1. PM views all bug reports and filters by status, priority, severity, SAP module, application component, defect category, assignee, next processor, created date, updated date, and overdue state.
2. Backend monitoring contract on `BugService.Bugs` now exposes read-only derived fields `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`, and `currentActionOwnerDisplayName` for PM-facing monitoring and ownership clarity.
3. User/queue filtering for the current action owner should continue to use `nextProcessorUser` and `nextProcessorRole`; `currentActionOwnerDisplayName` is a readable summary, not the filtering key.
4. Backend workload summary is exposed separately as read-only `BugService.DeveloperWorkloads`, aggregated by `assignee` as the technical owner rather than by `nextProcessor`.
5. `BugService.DeveloperWorkloads` includes active developers even when they currently own zero open bugs, and it retains inactive developers only while they still own open bugs that PM must clean up.
6. PM receives escalation notifications for high-priority unassigned bugs, overdue bugs, repeated reassignments, rejected bugs, and stale updates.
7. PM can comment or request reassignment without replacing Developer or Tester responsibilities.

## Mentor-Confirmed Sprint 02 Delta

English:

The latest mentor feedback confirms that the current business rules and diagrams are settled enough for implementation. Sprint 02 should focus on the happy flow demo and UI/backend corrections rather than redrawing accepted diagrams.

Business and UI deltas:

- Developers may view and discuss bugs within the same project/team when they have visibility permission. A bug should not be private to only the assigned developer.
- Primary processing remains controlled: only the assignee or an authorized role should perform lifecycle-changing actions such as request more information, reject, resolve, or main status processing.
- Developer note is optional by default.
- Note/reason is mandatory only for transitions that need explicit explanation:
  - `Assigned` / `In Review` / `In Progress` -> `Need More Information`.
  - `Assigned` / `In Review` / `In Progress` -> `Rejected`.
  - `In Progress` -> `Resolved`.
  - `Resolved` -> `Reopened`.
- Bug Detail UI should place assignee near the top, use dropdown/value help for editable status, group important input fields for fast entry and review, and move severity/environment into a supporting or right-side information area where possible.
- Team allocation for Sprint 02: DonHV leads Backend CAP and backend bug fixing, NhanT supports backend verification/QA, DatDT leads Fiori/UI5, and SangVN supports Fiori/UI5.

Vietnamese:

Feedback mentor mới nhất xác nhận business rules và diagrams hiện tại đã đủ ổn để implementation. Sprint 02 nên tập trung vào happy flow demo và các chỉnh sửa UI/backend thay vì vẽ lại diagram đã được chấp nhận.

Delta nghiệp vụ và UI:

- Developer có thể xem và thảo luận bug trong cùng project/team khi có quyền visibility. Bug không nên private chỉ cho developer được assign.
- Xử lý chính vẫn phải được kiểm soát: chỉ assignee hoặc role được phép mới nên thực hiện action đổi lifecycle như request more information, reject, resolve hoặc xử lý status chính.
- Developer note mặc định là optional.
- Note/reason chỉ bắt buộc ở các transition cần giải thích rõ:
  - `Assigned` / `In Review` / `In Progress` -> `Need More Information`.
  - `Assigned` / `In Review` / `In Progress` -> `Rejected`.
  - `In Progress` -> `Resolved`.
  - `Resolved` -> `Reopened`.
- Bug Detail UI cần đưa assignee lên gần đầu, status khi edit dùng dropdown/value help, field quan trọng được nhóm để nhập và review nhanh, và severity/environment nằm ở vùng thông tin phụ hoặc bên phải khi có thể.
- Phân công Sprint 02: DonHV lead Backend CAP và backend bug fixing, NhanT hỗ trợ backend verification/QA, DatDT lead Fiori/UI5, SangVN hỗ trợ Fiori/UI5.
