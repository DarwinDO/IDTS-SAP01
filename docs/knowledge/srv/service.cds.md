# Knowledge: `srv/service.cds`

## 2026-08-26 DeveloperWorkloads access-readiness contract

### English

The read-only `BugService.DeveloperWorkloads` contract now includes `identityAccessReady : Boolean`. This is a safe server-derived access-link state, not a persisted column and not Developer assignment readiness. `srv/bug-service/monitoring.js` fills it from the existing active internal User plus immutable identity-hash and exactly-one matching `ACTIVE` onboarding-request invariant; no database/schema/HANA artifact is added.

### Tiếng Việt

Contract read-only `BugService.DeveloperWorkloads` có thêm `identityAccessReady : Boolean`. Đây là trạng thái link access an toàn do server tính, không phải column persist và không phải assignment readiness của Developer. `srv/bug-service/monitoring.js` điền field này từ invariant User nội bộ active + immutable identity hash + đúng một onboarding request `ACTIVE` khớp; không thêm database/schema/HANA artifact.

Keep this field read-only and documented with `srv/access/identity-readiness.js`, `srv/bug-service/monitoring.js`, the User Administration Workload view, and the focused backend/UI contracts.

Giữ field này read-only và đồng bộ tài liệu với `srv/access/identity-readiness.js`, `srv/bug-service/monitoring.js`, view Workload User Administration và focused backend/UI contract.

## Optional Note action contract (2026-08-06)

`moveToPendingAssignment`, `markInReview`, `startProgress`, `sendToRetest`, and `closeBug` now have zero non-binding parameters, so Fiori does not render a Note input for them. Request More Information, Resubmit, Reject, Resolve, and Reopen retain their explanation parameters. `assignToDeveloper` also retains its optional `note` because DatDT explicitly kept the manual assignment contract. Check together with `app/bug-management-ui/annotations/actions.cds`, `srv/service.js`, and `scripts/qa/test-note-action-contract.js`.

## IDTS-122 PM operational dashboard contracts

`readBugStatusMetrics()` is a PM-only read function returning the ten canonical workflow statuses with label, criticality, sort order and Bug count. It is an aggregate read contract, not a HANA table and requires no schema deployment. `AiOperationalMetric` now exposes semantic outcome counters so the UI can distinguish known bad requests, rate limits, provider 5xx, timeouts, unavailable calls and unknown failures without exposing prompts, provider payloads or raw errors.

## IDTS-122 contract delta

`Bugs` exposes durable retest ownership and capability flags, and declares the bound `reassignRetestOwner` action. Active Testers are provided through a value help. These are additive service contracts; ordinary Closed-Bug mutation remains blocked in handlers, not trusted to metadata alone.

## IDTS-114 handoff comment-summary contract

`BugHandoffSummaryResult.commentSummary` and `verifiedComments` are transient `LargeString` fields in the OData action result. They are not columns and do not create a HANA migration. `commentSummary` contains grounded advisory insights, while `verifiedComments` keeps the bounded sanitized source lines for human comparison.

Vietnamese: `BugHandoffSummaryResult.commentSummary` là chuỗi tạm trong response OData, không phải cột database và không cần migration HANA. `srv/ai/bug-summary.js` tạo giá trị này từ tập comment đã lưu có giới hạn khi action `summarizeBugHandoff` chạy.

## IDTS-113 email scheduler contract

`processEmailOutbox()` is a technical unbound OData action. It returns only
`sent`, `failed`, and `skipped` counts through `EmailOutboxRunResult`. The
`@requires: 'OutboxProcessor'` contract prevents normal Tester, Developer, or
PM users from running background delivery manually. XSUAA grants that scope
only to the bound SAP Job Scheduling Service instance.

Vietnamese: `processEmailOutbox()` là unbound OData action kỹ thuật, chỉ trả
về số lượng `sent`, `failed` và `skipped`. Contract
`@requires: 'OutboxProcessor'` chặn Tester, Developer và PM gọi xử lý email nền
thủ công. XSUAA chỉ cấp scope này cho SAP Job Scheduling Service đã bind.

## IDTS-97 PM operational aggregate

`readAiOperationalMetrics(windowDays)` is a PM-only read function. It returns typed counts grouped by feature/provider/model and never exposes `suggestionPayload`, prompt, response, error text, user email, endpoint, token, or credential. The reporting window defaults to 30 days and is capped at 90 days by the runtime handler.

## IDTS-95 confirmation contract

`confirmDuplicateSuggestion(suggestionID, candidateBugID)` is an unbound OData action returning `DuplicateLinks`. The backend resolves candidate membership and relation type from the persisted accepted suggestion; clients cannot submit arbitrary candidate content.

Vietnamese: `confirmDuplicateSuggestion(suggestionID, candidateBugID)` là unbound OData action trả về `DuplicateLinks`. Backend lấy candidate và relation type từ suggestion đã Accept và persist; client không được tự gửi candidate content.

## Beginner-first OData contract map (2026-07-18)

### English

`db/schema.cds` defines storage; this file defines what authenticated clients can see/call. `srv/service.js` implements the contract, and Fiori annotations/manifest consume it. AI `type` declarations are response shapes, while the four unbound actions are review operations. `Bugs` projection adds calculated overdue/queue flags, virtual display/capability fields and bound lifecycle actions. Comments/history/notifications enrich names for UI. NotificationDeliveries and AiSuggestions deliberately expose read-only safe subsets. Users deliberately omits password/session fields. AssignableDevelopers and DeveloperWorkloads are non-persisted custom READ contracts implemented in JavaScript. `ValidDefectCategories` is a database select for active value-help pairs. The final draft annotation changes create/edit protocol to NEW → PATCH → SAVE.

Debug from Browser Network method/path → action/entity declaration here → registration in `srv/service.js` → implementation module → database entity in `schema.cds`. For a Fiori button, also trace annotation action name/parameter. A contract rename or parameter change must update all callers and compile EDMX; adding a field here does not automatically populate it unless projection/database/enrichment supplies a value.

### Vietnamese

`db/schema.cds` định nghĩa nơi lưu; file này định nghĩa client đã xác thực được thấy/gọi gì. `srv/service.js` implement contract, còn Fiori annotation/manifest sử dụng nó. Các `type` AI là hình dạng response, còn bốn unbound action là thao tác review. Projection `Bugs` thêm cờ overdue/queue tính toán, virtual display/capability field và bound lifecycle action. Comment/history/notification enrich tên cho UI. NotificationDeliveries và AiSuggestions cố ý chỉ expose tập field an toàn read-only. Users cố ý bỏ password/session. AssignableDevelopers và DeveloperWorkloads là contract custom READ không persist, được JavaScript implement. `ValidDefectCategories` là database select cho cặp value-help active. Draft annotation cuối file đổi protocol create/edit thành NEW → PATCH → SAVE.

Debug từ method/path trong Browser Network → action/entity declaration tại đây → registration trong `srv/service.js` → implementation module → database entity trong `schema.cds`. Với nút Fiori, lần thêm tên action/parameter trong annotation. Đổi tên/parameter contract phải cập nhật mọi caller và compile EDMX; thêm field ở đây không tự có giá trị nếu projection/database/enrichment không cấp.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: BugService OData contract. Use this file first when an action is absent from metadata or an OData URL is invalid; then check the same action in `srv/service.js` and its focused module. A contract change may also require Fiori annotation and knowledge-mirror updates.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: OData contract của BugService. Đọc file này đầu tiên khi action không có trong metadata hoặc URL OData sai; sau đó kiểm tra action cùng tên trong `srv/service.js` và module cụ thể. Đổi contract có thể cần cập nhật Fiori annotation và knowledge mirror.

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

### File này dùng �Ồ làm gì

File này ��9nh nghĩa hợp ��ng OData công khai của CAP service cho IDTS.

Trong CAP, `db/schema.cds` ��9nh nghĩa data model lưu trữ, còn `srv/service.cds` quyết ��9nh phần nào �ược expose ra ngoài qua OData. Fiori không nói chuy�!n trực tiếp v�:i database table. Fiori gọi `BugService` tại `/odata/v4/bug/`, và file này ��9nh nghĩa entity, virtual field, read model và action mà Fiori có thỒ dùng.

V�:i người m�:i học, hãy hiỒu file này như �Smenu API⬝ giữa Fiori và backend. Nếu m�"t field, entity hoặc action không �ược expose �x �ây, Fiori không thỒ bind hoặc gọi nó m�"t cách �"n ��9nh.

### Giải thích cho người m�:i

File này trả lời các câu hỏi:

- Fiori có thỒ �ọc và sửa dữ li�!u bug nào?
- Fiori có thỒ gọi workflow action nào?
- Collection nào phục vụ value help, ví dụ assignable developers và valid defect categories?
- Virtual field nào ch�0 phục vụ UI hoặc monitoring, ví dụ `canClose`, `isOverdue`, `currentActionOwnerDisplayName`?
- Entity nào là read-only output cho monitoring hoặc read model?

Ý quan trọng của CAP �x �ây là �Sprojection⬝. `entity Bugs as projection on db.Bugs` nghĩa là `BugService.Bugs` không phải table m�:i. Nó là hình dạng API-facing của entity `db.Bugs`, có thêm các field tính toán hoặc virtual field phục vụ Fiori và PM monitoring.

### Flow hoạt ��"ng trong IDTS

1. Browser m�x Fiori app.
2. `app/bug-management-ui/webapp/manifest.json` trỏ frontend �ến `/odata/v4/bug/`.
3. CAP trả metadata �ược sinh từ `BugService`.
4. Fiori �ọc metadata �ó �Ồ dựng List Report/Object Page, fields, actions, value helps và child tables.
5. `srv/service.js` gắn runtime handlers vào các entity và action �ược khai báo �x �ây.
6. Các handler �ó �ọc/ghi persistent model trong `db/schema.cds`.

### Important source anchors

- **V�9 trí**: `srv/service.cds:1`
  `using idts.cap as db from '../db/schema';`
  **Khái ni�!m IDTS**: Liên kết service v�:i data model. Dòng này import persistent model của IDTS �Ồ service có thỒ project Bugs, Comments, Users, DeveloperResponsibilities, code lists và child entities.
  **Ảnh hư�xng nếu sai**: `BugService` không expose �ược domain model, Fiori metadata generation fail, và backend handlers mất entity contract.
  **Phải kiỒm tra cùng**: `db/schema.cds`, `srv/service.js`, tất cả Fiori annotations import `BugService`.

- **V�9 trí**: `srv/service.cds:4`
  `entity Bugs as projection on db.Bugs { ... }`
  **Khái ni�!m IDTS**: OData collection chính cho bug tracking. Đây là hình dạng service-level của bug mà List Report, Object Page, actions, comments, attachments, history, notifications và PM monitoring �ều dùng.
  **Ảnh hư�xng nếu sai**: Toàn b�" Fiori app có thỒ mất fields, actions, child sections hoặc monitoring flags. Create/edit/list/detail flows �ều có thỒ hỏng vì phụ thu�"c `BugService.Bugs`.
  **Phải kiỒm tra cùng**: `db/schema.cds:87` `Bugs`, `app/bug-management-ui/webapp/manifest.json` `contextPath: /Bugs`, `app/bug-management-ui/annotations/*.cds`, `srv/service.js`.

- **V�9 trí**: `srv/service.cds:6-9`
  `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
  **Khái ni�!m IDTS**: Các flag phục vụ PM monitoring. Đây là derived fields �x service layer giúp UI lọc các nhóm bug thường gặp.
  **Ảnh hư�xng nếu sai**: PM dashboard và filter có thỒ hiỒn th�9 sai bug overdue, pending assignment, rejected follow-up hoặc retest required.
  **Phải kiỒm tra cùng**: `srv/bug-service/read-models.js`, PM monitoring tests, List Report annotations, phần PM Monitoring trong `docs/project-context.md`.

- **V�9 trí**: `srv/service.cds:13-28`
  Các virtual display và capability fields như `currentActionOwnerDisplayName`, `canReject`, `canClose`, `canAssign`, `canAddComment`
  **Khái ni�!m IDTS**: Trạng thái action mà UI có thỒ �ọc. CAP expose các field này qua OData, còn JavaScript fill giá tr�9 khi �ọc. Fiori annotation dùng chúng �Ồ ẩn/hi�!n button và hiỒn th�9 current owner.
  **Ảnh hư�xng nếu sai**: User có thỒ thấy sai nút action, nút cần ẩn lại hi�!n, nút hợp l�! lại biến mất, hoặc current owner hiỒn th�9 khó hiỒu.
  **Phải kiỒm tra cùng**: `srv/bug-service/read-models.js:213` và `:368`, `app/bug-management-ui/annotations/actions.cds`, `app/bug-management-ui/annotations/ownership-assignment.cds`.

- **V�9 trí**: `srv/service.cds:30-78`
  Các bound actions bên trong `entity Bugs`
  **Khái ni�!m IDTS**: Hợp ��ng OData công khai cho lifecycle operations. Đây là các action mà Fiori buttons gọi; JavaScript handlers trong `srv/bug-service/actions.js` implement hành vi thật.
  **Ảnh hư�xng nếu sai**: Fiori action buttons có thỒ gọi action b�9 thiếu hoặc ��"i tên, parameter note/reason có thỒ l�!ch, và lifecycle tests fail.
  **Phải kiỒm tra cùng**: `srv/service.js:94-147` action wiring, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/actions.cds`.

- **V�9 trí**: `srv/service.cds:120`
  `entity AssignableDevelopers { ... }`
  **Khái ni�!m IDTS**: Read model cho value help chọn Developer. Nó expose developer profile, name, email, availability, component, defect category, SAP module và responsibility dư�:i dạng d�& dùng cho UI.
  **Ảnh hư�xng nếu sai**: Value help Assignee có thỒ hi�!n UUID, duplicate Developer, Developer unavailable hoặc thiếu context responsibility.
  **Phải kiỒm tra cùng**: `srv/bug-service/read-models.js:31`, `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, Fiori value-help annotations.

- **V�9 trí**: `srv/service.cds:136`
  `@readonly entity DeveloperWorkloads { ... }`
  **Khái ni�!m IDTS**: Aggregate phục vụ PM monitoring. Đây không phải table bình thường; nó là output read-only �ược backend tính toán.
  **Ảnh hư�xng nếu sai**: PM workload view có thỒ thiếu Developer active �ang có 0 bug, �ếm sai status bucket hoặc �ánh giá sai Developer overloaded.
  **Phải kiỒm tra cùng**: `srv/bug-service/monitoring.js`, PM monitoring tests, List Report hoặc future monitoring UI annotations.

- **V�9 trí**: `srv/service.cds:187`
  `annotate BugService.Bugs with @odata.draft.enabled;`
  **Khái ni�!m IDTS**: Fiori draft editing. Draft cho phép Fiori tạo/sửa dữ li�!u tạm trư�:c khi activate thành bug chính thức.
  **Ảnh hư�xng nếu sai**: Create/edit flow, attachment draft flow và Object Page save behavior có thỒ hỏng.
  **Phải kiỒm tra cùng**: `srv/bug-service/drafts.js`, attachment handling, Fiori Object Page create/edit behavior, HTTP draft regression tests.

### Liên kết v�:i file khác

- `db/schema.cds` là data model g�c. Service này project model �ó và thêm các field/action phục vụ OData.
- `app/bug-management-ui/webapp/manifest.json` trỏ Fiori �ến endpoint service này và context path `/Bugs`.
- Các annotation dư�:i `app/bug-management-ui/annotations/` annotate entity/action �ược khai báo �x �ây; annotation không thỒ tự tạo field thiếu trong service.
- `srv/service.js` gắn runtime behavior vào các entity/action quan trọng �ược khai báo �x �ây.
- Các module dư�:i `srv/bug-service/` fill virtual fields, enforce permissions, tính monitoring read models và implement lifecycle actions.

### Lưu ý khi sửa file này

- Xem file này như public API contract. Đ�"i tên entity, field hoặc action sẽ ảnh hư�xng Fiori, tests và OData clients.
- Khi thêm virtual field, phải thêm hoặc cập nhật read-model code �Ồ fill giá tr�9.
- Khi ��"i action, cập nhật `srv/service.js`, `actions.js`, Fiori action annotations và side effects.
- Khi ��"i value-help read model, kiỒm tra Fiori value-help annotations và seed data.
- Giữ English và Vietnamese tương �ương nhau.

## IDTS-34 Auth Contract Update

### English

- `BugService.Users` is now an explicit safe projection. It exposes normal user profile fields such as ID, display name, email, role, and active flag, but it does not expose `passwordHash` or `passwordChangedAt`.
- The actual login contract is not in this file. It is in `srv/auth.cds` as `AuthService.login`, `AuthService.logout`, and `AuthService.me`.
- This split is intentional: `BugService` remains the defect-tracking OData service, while `AuthService` is the small authentication boundary.

Important anchor:

- **Location**: `srv/service.cds`, `entity Users as projection on db.Users { ... }`
  **IDTS concept**: Safe user projection for BugService.
  **Impact if broken**: Fiori or external OData clients could see password hashes, or existing user value helps/read models could lose safe profile fields.
  **Must check together**: `db/schema.cds` `Users`, `srv/auth.cds`, `srv/auth.js`, `srv/bug-service/helpers.js`.

### Vietnamese

- `BugService.Users` hien la projection an toan co liet ke field ro rang. No expose cac field profile binh thuong nhu ID, display name, email, role va active, nhung khong expose `passwordHash` hoac `passwordChangedAt`.
- Contract login that khong nam trong file nay. No nam trong `srv/auth.cds` voi `AuthService.login`, `AuthService.logout`, va `AuthService.me`.
- Cach tach nay la co chu y: `BugService` van tap trung vao defect tracking OData service, con `AuthService` la boundary nho cho authentication.

## IDTS-66 similar-bug action update

### English

`SimilarBugCandidate` and the unbound `suggestSimilarBugs` action form the public OData contract for duplicate/similar suggestions. �SUnbound⬝ means the client can call the action before a Bug row exists by sending title, description, status, and classification values. It may also send `sourceBugID` when checking an existing bug.

The action returns rank, bug identity, status, score, suggested relation label, readable reason, provider status, and whether an embedding was used. It does not expose vectors, prompts, provider responses, or credentials. It also does not create `DuplicateLinks`; only a later explicit human confirmation flow may do that.

Important anchor:

- **Location**: `type SimilarBugCandidate` and `action suggestSimilarBugs(...)`
  - **IDTS concept**: suggestion-only duplicate review contract.
  - **Impact if broken**: the future Fiori review UI cannot safely call or interpret the backend result.
  - **Must check together**: `srv/ai/duplicate-detection.js`, `srv/service.js`, IDTS-66 QA, and future IDTS-70 UI integration.

### Vietnamese

`SimilarBugCandidate` và unbound action `suggestSimilarBugs` tạo thành OData contract công khai cho gợi ý bug trùng/tương tự. �SUnbound⬝ nghĩa là client có thỒ gọi action trư�:c khi có Bug row bằng cách gửi title, description, status và classification. Khi kiỒm tra bug �ã t�n tại, client có thỒ gửi thêm `sourceBugID`.

Action trả rank, ��9nh danh bug, status, score, nhãn relation gợi ý, lý do d�& �ọc, provider status và thông tin embedding có �ược dùng hay không. Action không expose vector, prompt, provider response hoặc credential. Nó cũng không tạo `DuplicateLinks`; ch�0 flow xác nhận rõ ràng của con người trong task sau m�:i �ược làm vi�!c �ó.

ĐiỒm neo quan trọng:

- **V�9 trí**: `type SimilarBugCandidate` và `action suggestSimilarBugs(...)`
  - **Khái ni�!m IDTS**: contract review duplicate theo hư�:ng suggestion-only.
  - **Ảnh hư�xng nếu sai**: Fiori review UI sau này không thỒ gọi hoặc hiỒu kết quả backend m�"t cách an toàn.
  - **Phải kiỒm tra cùng**: `srv/ai/duplicate-detection.js`, `srv/service.js`, QA IDTS-66 và UI integration IDTS-70 sau này.

Anchor quan trong:

- **Vi tri**: `srv/service.cds`, `entity Users as projection on db.Users { ... }`
  **Khai niem IDTS**: Projection user an toan cho BugService.
  **Anh huong neu sai**: Fiori hoac OData client co the thay password hash, hoac cac read model/value help dang dung user profile co the mat field can thiet.
  **Phai kiem tra cung**: `db/schema.cds` `Users`, `srv/auth.cds`, `srv/auth.js`, `srv/bug-service/helpers.js`.

## Metadata

- Source file: `srv/service.cds`
- Knowledge mirror: `docs/knowledge/srv/service.cds.md`
- Style baseline: `docs/knowledge/guidelines/knowledge-mirror-anchors.md`
- Last reviewed: 2026-06-22

## IDTS-36 Email Delivery OData Contract

### English

`BugService.NotificationDeliveries` is a read-only projection for authenticated clients. It gives IDTS-37 enough information to show recipient, subject, status, attempts, timestamps, safe error summary, and provider message ID. It intentionally excludes `textBody`, `htmlBody`, worker locks, and all SMTP configuration.

- **Location**: `srv/service.cds:108-126`
  `@readonly entity NotificationDeliveries as projection on db.NotificationDeliveries`
  **IDTS concept**: Safe operational visibility into email delivery without exposing the worker's private payload/control fields.
  **Impact if broken**: Fiori may be unable to explain failed email, or an OData client may see data that should remain backend-only.
  **Must check together**: `db/schema.cds:189`, `srv/bug-service/constants.js`, IDTS-37 UI/readability task, API contract test.

`Notifications` keeps its `deliveries` navigation because the persistence model owns delivery rows as children. The public endpoint is `/odata/v4/bug/NotificationDeliveries`; client writes are rejected.

### Vietnamese

`BugService.NotificationDeliveries` là projection read-only cho client �ã login. Nó cung cấp �ủ dữ li�!u �Ồ IDTS-37 hiỒn th�9 recipient, subject, status, s� lần thử, thời gian, l�i �ã làm sạch và provider message ID. Nó c� ý không expose `textBody`, `htmlBody`, worker lock hoặc bất kỳ SMTP config nào.

- **V�9 trí**: `srv/service.cds:108-126`
  `@readonly entity NotificationDeliveries as projection on db.NotificationDeliveries`
  **Khái ni�!m IDTS**: Cho phép xem tình trạng email an toàn mà không làm l�" payload/control field private của worker.
  **Ảnh hư�xng nếu sai**: Fiori không giải thích �ược email fail hoặc OData client nhìn thấy dữ li�!u ch�0 backend m�:i nên dùng.
  **Phải kiỒm tra cùng**: `db/schema.cds:189`, `srv/bug-service/constants.js`, task UI/readability IDTS-37, API contract test.

`Notifications` giữ navigation `deliveries` vì delivery là dữ li�!u con của source event. Endpoint công khai là `/odata/v4/bug/NotificationDeliveries`; client không �ược ghi vào collection này.

## IDTS-65 AI Suggestion Read Contract

### English

`BugService.AiSuggestions` is a read-only OData projection for safe AI suggestion audit rows.

This projection exists so future UI/review tasks can show AI suggestions without exposing backend-only write control. It includes source bug, feature type, requester, provider/model aliases, confidence, safe suggestion payload, summary, review state, reviewer, timestamps, and correlation ID. It intentionally does not provide a public create/update/delete path.

Important anchor:

- **Location**: `srv/service.cds`, `@readonly entity AiSuggestions as projection on db.AiSuggestions`
  **IDTS concept**: Safe public read contract for AI suggestions.
  **Impact if broken**: Future Fiori review UI may not be able to display AI suggestions, or clients may gain the ability to write audit rows directly.
  **Must check together**: `db/schema.cds` `AiSuggestions`, `srv/ai/audit.js`, `srv/bug-service/constants.js`, `scripts/qa/test-idts65-ai-suggestion-audit.js`.

`AiSuggestionFeatureTypes` and `AiSuggestionReviewStates` are also exposed as service code-list projections so clients can display readable labels. Writes are blocked by the normal BugService read-only guard list.

### Vietnamese

`BugService.AiSuggestions` là OData projection read-only cho các dòng audit AI suggestion �ã �ược làm sạch.

Projection này t�n tại �Ồ các task UI/review sau này có thỒ hiỒn th�9 AI suggestion mà không m�x quyền ghi từ client. Nó g�m bug ngu�n, loại feature, người request, provider/model alias, confidence, payload suggestion an toàn, summary, review state, reviewer, timestamps và correlation ID. Nó c� ý không cung cấp public create/update/delete path.

Important anchor:

- **V�9 trí**: `srv/service.cds`, `@readonly entity AiSuggestions as projection on db.AiSuggestions`
  **Khái ni�!m IDTS**: Public read contract an toàn cho AI suggestion.
  **Ảnh hư�xng nếu sai**: UI review Fiori sau này có thỒ không hiỒn th�9 �ược AI suggestion, hoặc client có thỒ ghi trực tiếp vào audit row.
  **Phải kiỒm tra cùng**: `db/schema.cds` `AiSuggestions`, `srv/ai/audit.js`, `srv/bug-service/constants.js`, `scripts/qa/test-idts65-ai-suggestion-audit.js`.

`AiSuggestionFeatureTypes` và `AiSuggestionReviewStates` cũng �ược expose như code-list projection �Ồ client có label d�& �ọc. Ghi dữ li�!u vào các entity này b�9 chặn b�xi read-only guard list của BugService.

## IDTS-67 update: AI classification suggestion action

### English

`srv/service.cds` now also exposes `suggestClassification`, an unbound OData action that returns reviewable classification suggestions for SAP Module, Application Component, Defect Category, Priority, and Severity.

This action is intentionally suggestion-only. It does not update `Bugs`; it only returns structured rows for review. The runtime validation and fallback logic lives in `srv/ai/classification-suggestion.js`, and `srv/service.js` wires the action into CAP.

- **Location**: `type ClassificationSuggestionCandidate` and `action suggestClassification(...)`
  - **IDTS concept**: AI-assisted classification review, not automatic classification.
  - **Impact if broken**: Fiori or API clients may not be able to request classification help, or may receive a contract that hides validation status/confidence.
  - **Must check together**: `srv/ai/classification-suggestion.js`, `srv/service.js`, `db/schema.cds` catalog entities, and `scripts/qa/test-idts67-classification-suggestion.js`.

### Ti?ng Vi?t

`srv/service.cds` hi?n expose th�m `suggestClassification`, m?t unbound OData action tr? v? g?i � ph�n lo?i d? review cho SAP Module, Application Component, Defect Category, Priority v� Severity.

Action n�y du?c thi?t k? ch? d? g?i �. N� kh�ng update `Bugs`; n� ch? tr? v? c�c d�ng c� c?u tr�c d? ngu?i d�ng review. Logic validate v� fallback runtime n?m trong `srv/ai/classification-suggestion.js`, c�n `srv/service.js` n?i action n�y v�o CAP.

- **V? tr�**: `type ClassificationSuggestionCandidate` v� `action suggestClassification(...)`
  - **Kh�i ni?m IDTS**: AI h? tr? review ph�n lo?i, kh�ng ph?i t? d?ng ph�n lo?i.
  - **?nh hu?ng n?u sai**: Fiori ho?c API client c� th? kh�ng g?i du?c g?i � ph�n lo?i, ho?c contract thi?u tr?ng th�i validation/confidence.
  - **Ph?i ki?m tra c�ng**: `srv/ai/classification-suggestion.js`, `srv/service.js`, c�c catalog entity trong `db/schema.cds`, v� `scripts/qa/test-idts67-classification-suggestion.js`.

## IDTS-68 Bug Handoff Summary Update

### English

IDTS-68 adds the unbound action `summarizeBugHandoff(sourceBugID)` and result type `BugHandoffSummaryResult`.

This action belongs in `srv/service.cds` because it is a public OData contract, not a private helper. Clients call it when they need a reviewable summary for an existing bug. The action returns status, current action owner, missing information, latest important events, next expected action, provider status, grounding status, confidence, and a human-review flag.

It does not expose a write API. It does not change the bug lifecycle. Runtime behavior is implemented in `srv/ai/bug-summary.js` and wired in `srv/service.js`.

### Vietnamese

IDTS-68 them unbound action `summarizeBugHandoff(sourceBugID)` va result type `BugHandoffSummaryResult`.

Action nay nam trong `srv/service.cds` vi day la contract OData public, khong phai helper noi bo. Client goi no khi can mot ban summary co the review cho bug da ton tai. Action tra ve status, current action owner, thong tin con thieu, su kien quan trong gan day, next expected action, provider status, grounding status, confidence va co bat buoc human review.

Action nay khong expose write API. No khong doi lifecycle cua bug. Runtime behavior nam trong `srv/ai/bug-summary.js` va duoc noi trong `srv/service.js`.

## IDTS-91/92/93 AI review contracts

### English

The service contract now exposes `suggestionID` on duplicate/classification candidate rows, the safe `AiSuggestionReviewResult`, three explicit review actions, and `applyClassificationSuggestion(suggestionID)`. Review actions update only suggestion audit state. The apply action returns the affected `Bugs` row but may change only validated classification fields after Tester/PM authorization.

Primary owner: DonHV. Backup: DatDT. Debug the action name and parameter in generated metadata, then follow the same name through `srv/service.js` into `srv/ai/review.js` or `srv/ai/classification-apply.js`. A contract rename requires updating UI callers and focused QA.

### Vietnamese

Service contract hiện expose `suggestionID` trên candidate duplicate/classification, result an toàn `AiSuggestionReviewResult`, ba review action rõ ràng và `applyClassificationSuggestion(suggestionID)`. Review action chỉ đổi trạng thái audit của suggestion. Apply action trả Bug bị tác động nhưng chỉ được đổi các field classification đã validate sau khi kiểm quyền Tester/PM.

Owner chính: DonHV. Backup: DatDT. Khi debug, xem tên action và parameter trong metadata đã generate, rồi lần theo cùng tên qua `srv/service.js` tới `srv/ai/review.js` hoặc `srv/ai/classification-apply.js`. Đổi contract phải cập nhật UI caller và focused QA.

## IDTS-94 review-control response bridge (2026-07-24)

### English

`BugHandoffSummaryResult` and `SmartAssignmentExplanationCandidate` now expose `suggestionID`. The value is the UUID of the sanitized `AiSuggestions` row created for that exact response. Handoff returns one ID on its result. Every Smart Assign explanation row from one request carries the same ID because the request is persisted as one review unit.

The UI sends only this ID to `acceptAiSuggestion`, `rejectAiSuggestion`, or `ignoreAiSuggestion`. Adding the ID does not make Accept apply a summary, create history, select a developer, or assign anyone.

### Vietnamese

`BugHandoffSummaryResult` và `SmartAssignmentExplanationCandidate` giờ expose `suggestionID`. Giá trị này là UUID của row `AiSuggestions` đã sanitize được tạo cho chính response đó. Handoff trả một ID trên result. Mỗi explanation row của cùng một request Smart Assign mang cùng ID vì request được persist thành một review unit.

UI chỉ gửi ID này cho `acceptAiSuggestion`, `rejectAiSuggestion`, hoặc `ignoreAiSuggestion`. Việc thêm ID không làm Accept áp dụng summary, tạo history, chọn developer, hoặc assign bất kỳ ai.
## IDTS-125 authorization metadata contract (2026-08-05)

**English.** `Bugs` exposes virtual `canManageAttachments`, `bugRequiredFieldControl`, and `bugOptionalFieldControl` alongside `canEdit`. They carry per-row UX state only; CAP handlers remain authoritative.

**Tiếng Việt.** `Bugs` expose virtual `canManageAttachments`, `bugRequiredFieldControl`, `bugOptionalFieldControl` bên cạnh `canEdit`. Chúng chỉ mang trạng thái UX theo row; CAP handler vẫn là nguồn quyền chính thức.
