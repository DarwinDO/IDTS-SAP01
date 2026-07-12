# Knowledge: `srv/service.cds`

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

The important CAP idea is â€œprojectionâ€. `entity Bugs as projection on db.Bugs` means `BugService.Bugs` is not a new database table. It is an API-facing view over the persistent `db.Bugs` entity, with extra calculated or virtual fields added for Fiori and PM monitoring.

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

### File nÃ y dÃ¹ng Ä‘á»ƒ lÃ m gÃ¬

File nÃ y Ä‘á»‹nh nghÄ©a há»£p Ä‘á»“ng OData cÃ´ng khai cá»§a CAP service cho IDTS.

Trong CAP, `db/schema.cds` Ä‘á»‹nh nghÄ©a data model lÆ°u trá»¯, cÃ²n `srv/service.cds` quyáº¿t Ä‘á»‹nh pháº§n nÃ o Ä‘Æ°á»£c expose ra ngoÃ i qua OData. Fiori khÃ´ng nÃ³i chuyá»‡n trá»±c tiáº¿p vá»›i database table. Fiori gá»i `BugService` táº¡i `/odata/v4/bug/`, vÃ  file nÃ y Ä‘á»‹nh nghÄ©a entity, virtual field, read model vÃ  action mÃ  Fiori cÃ³ thá»ƒ dÃ¹ng.

Vá»›i ngÆ°á»i má»›i há»c, hÃ£y hiá»ƒu file nÃ y nhÆ° â€œmenu APIâ€ giá»¯a Fiori vÃ  backend. Náº¿u má»™t field, entity hoáº·c action khÃ´ng Ä‘Æ°á»£c expose á»Ÿ Ä‘Ã¢y, Fiori khÃ´ng thá»ƒ bind hoáº·c gá»i nÃ³ má»™t cÃ¡ch á»•n Ä‘á»‹nh.

### Giáº£i thÃ­ch cho ngÆ°á»i má»›i

File nÃ y tráº£ lá»i cÃ¡c cÃ¢u há»i:

- Fiori cÃ³ thá»ƒ Ä‘á»c vÃ  sá»­a dá»¯ liá»‡u bug nÃ o?
- Fiori cÃ³ thá»ƒ gá»i workflow action nÃ o?
- Collection nÃ o phá»¥c vá»¥ value help, vÃ­ dá»¥ assignable developers vÃ  valid defect categories?
- Virtual field nÃ o chá»‰ phá»¥c vá»¥ UI hoáº·c monitoring, vÃ­ dá»¥ `canClose`, `isOverdue`, `currentActionOwnerDisplayName`?
- Entity nÃ o lÃ  read-only output cho monitoring hoáº·c read model?

Ã quan trá»ng cá»§a CAP á»Ÿ Ä‘Ã¢y lÃ  â€œprojectionâ€. `entity Bugs as projection on db.Bugs` nghÄ©a lÃ  `BugService.Bugs` khÃ´ng pháº£i table má»›i. NÃ³ lÃ  hÃ¬nh dáº¡ng API-facing cá»§a entity `db.Bugs`, cÃ³ thÃªm cÃ¡c field tÃ­nh toÃ¡n hoáº·c virtual field phá»¥c vá»¥ Fiori vÃ  PM monitoring.

### Flow hoáº¡t Ä‘á»™ng trong IDTS

1. Browser má»Ÿ Fiori app.
2. `app/bug-management-ui/webapp/manifest.json` trá» frontend Ä‘áº¿n `/odata/v4/bug/`.
3. CAP tráº£ metadata Ä‘Æ°á»£c sinh tá»« `BugService`.
4. Fiori Ä‘á»c metadata Ä‘Ã³ Ä‘á»ƒ dá»±ng List Report/Object Page, fields, actions, value helps vÃ  child tables.
5. `srv/service.js` gáº¯n runtime handlers vÃ o cÃ¡c entity vÃ  action Ä‘Æ°á»£c khai bÃ¡o á»Ÿ Ä‘Ã¢y.
6. CÃ¡c handler Ä‘Ã³ Ä‘á»c/ghi persistent model trong `db/schema.cds`.

### Important source anchors

- **Vá»‹ trÃ­**: `srv/service.cds:1`
  `using idts.cap as db from '../db/schema';`
  **KhÃ¡i niá»‡m IDTS**: LiÃªn káº¿t service vá»›i data model. DÃ²ng nÃ y import persistent model cá»§a IDTS Ä‘á»ƒ service cÃ³ thá»ƒ project Bugs, Comments, Users, DeveloperResponsibilities, code lists vÃ  child entities.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: `BugService` khÃ´ng expose Ä‘Æ°á»£c domain model, Fiori metadata generation fail, vÃ  backend handlers máº¥t entity contract.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `db/schema.cds`, `srv/service.js`, táº¥t cáº£ Fiori annotations import `BugService`.

- **Vá»‹ trÃ­**: `srv/service.cds:4`
  `entity Bugs as projection on db.Bugs { ... }`
  **KhÃ¡i niá»‡m IDTS**: OData collection chÃ­nh cho bug tracking. ÄÃ¢y lÃ  hÃ¬nh dáº¡ng service-level cá»§a bug mÃ  List Report, Object Page, actions, comments, attachments, history, notifications vÃ  PM monitoring Ä‘á»u dÃ¹ng.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: ToÃ n bá»™ Fiori app cÃ³ thá»ƒ máº¥t fields, actions, child sections hoáº·c monitoring flags. Create/edit/list/detail flows Ä‘á»u cÃ³ thá»ƒ há»ng vÃ¬ phá»¥ thuá»™c `BugService.Bugs`.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `db/schema.cds:87` `Bugs`, `app/bug-management-ui/webapp/manifest.json` `contextPath: /Bugs`, `app/bug-management-ui/annotations/*.cds`, `srv/service.js`.

- **Vá»‹ trÃ­**: `srv/service.cds:6-9`
  `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
  **KhÃ¡i niá»‡m IDTS**: CÃ¡c flag phá»¥c vá»¥ PM monitoring. ÄÃ¢y lÃ  derived fields á»Ÿ service layer giÃºp UI lá»c cÃ¡c nhÃ³m bug thÆ°á»ng gáº·p.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: PM dashboard vÃ  filter cÃ³ thá»ƒ hiá»ƒn thá»‹ sai bug overdue, pending assignment, rejected follow-up hoáº·c retest required.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/bug-service/read-models.js`, PM monitoring tests, List Report annotations, pháº§n PM Monitoring trong `docs/project-context.md`.

- **Vá»‹ trÃ­**: `srv/service.cds:13-28`
  CÃ¡c virtual display vÃ  capability fields nhÆ° `currentActionOwnerDisplayName`, `canReject`, `canClose`, `canAssign`, `canAddComment`
  **KhÃ¡i niá»‡m IDTS**: Tráº¡ng thÃ¡i action mÃ  UI cÃ³ thá»ƒ Ä‘á»c. CAP expose cÃ¡c field nÃ y qua OData, cÃ²n JavaScript fill giÃ¡ trá»‹ khi Ä‘á»c. Fiori annotation dÃ¹ng chÃºng Ä‘á»ƒ áº©n/hiá»‡n button vÃ  hiá»ƒn thá»‹ current owner.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: User cÃ³ thá»ƒ tháº¥y sai nÃºt action, nÃºt cáº§n áº©n láº¡i hiá»‡n, nÃºt há»£p lá»‡ láº¡i biáº¿n máº¥t, hoáº·c current owner hiá»ƒn thá»‹ khÃ³ hiá»ƒu.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/bug-service/read-models.js:213` vÃ  `:368`, `app/bug-management-ui/annotations/actions.cds`, `app/bug-management-ui/annotations/ownership-assignment.cds`.

- **Vá»‹ trÃ­**: `srv/service.cds:30-78`
  CÃ¡c bound actions bÃªn trong `entity Bugs`
  **KhÃ¡i niá»‡m IDTS**: Há»£p Ä‘á»“ng OData cÃ´ng khai cho lifecycle operations. ÄÃ¢y lÃ  cÃ¡c action mÃ  Fiori buttons gá»i; JavaScript handlers trong `srv/bug-service/actions.js` implement hÃ nh vi tháº­t.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: Fiori action buttons cÃ³ thá»ƒ gá»i action bá»‹ thiáº¿u hoáº·c Ä‘á»•i tÃªn, parameter note/reason cÃ³ thá»ƒ lá»‡ch, vÃ  lifecycle tests fail.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/service.js:94-147` action wiring, `srv/bug-service/actions.js`, `app/bug-management-ui/annotations/actions.cds`.

- **Vá»‹ trÃ­**: `srv/service.cds:120`
  `entity AssignableDevelopers { ... }`
  **KhÃ¡i niá»‡m IDTS**: Read model cho value help chá»n Developer. NÃ³ expose developer profile, name, email, availability, component, defect category, SAP module vÃ  responsibility dÆ°á»›i dáº¡ng dá»… dÃ¹ng cho UI.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: Value help Assignee cÃ³ thá»ƒ hiá»‡n UUID, duplicate Developer, Developer unavailable hoáº·c thiáº¿u context responsibility.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/bug-service/read-models.js:31`, `db/schema.cds:40` `DeveloperProfiles`, `db/schema.cds:79` `DeveloperResponsibilities`, Fiori value-help annotations.

- **Vá»‹ trÃ­**: `srv/service.cds:136`
  `@readonly entity DeveloperWorkloads { ... }`
  **KhÃ¡i niá»‡m IDTS**: Aggregate phá»¥c vá»¥ PM monitoring. ÄÃ¢y khÃ´ng pháº£i table bÃ¬nh thÆ°á»ng; nÃ³ lÃ  output read-only Ä‘Æ°á»£c backend tÃ­nh toÃ¡n.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: PM workload view cÃ³ thá»ƒ thiáº¿u Developer active Ä‘ang cÃ³ 0 bug, Ä‘áº¿m sai status bucket hoáº·c Ä‘Ã¡nh giÃ¡ sai Developer overloaded.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/bug-service/monitoring.js`, PM monitoring tests, List Report hoáº·c future monitoring UI annotations.

- **Vá»‹ trÃ­**: `srv/service.cds:187`
  `annotate BugService.Bugs with @odata.draft.enabled;`
  **KhÃ¡i niá»‡m IDTS**: Fiori draft editing. Draft cho phÃ©p Fiori táº¡o/sá»­a dá»¯ liá»‡u táº¡m trÆ°á»›c khi activate thÃ nh bug chÃ­nh thá»©c.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: Create/edit flow, attachment draft flow vÃ  Object Page save behavior cÃ³ thá»ƒ há»ng.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/bug-service/drafts.js`, attachment handling, Fiori Object Page create/edit behavior, HTTP draft regression tests.

### LiÃªn káº¿t vá»›i file khÃ¡c

- `db/schema.cds` lÃ  data model gá»‘c. Service nÃ y project model Ä‘Ã³ vÃ  thÃªm cÃ¡c field/action phá»¥c vá»¥ OData.
- `app/bug-management-ui/webapp/manifest.json` trá» Fiori Ä‘áº¿n endpoint service nÃ y vÃ  context path `/Bugs`.
- CÃ¡c annotation dÆ°á»›i `app/bug-management-ui/annotations/` annotate entity/action Ä‘Æ°á»£c khai bÃ¡o á»Ÿ Ä‘Ã¢y; annotation khÃ´ng thá»ƒ tá»± táº¡o field thiáº¿u trong service.
- `srv/service.js` gáº¯n runtime behavior vÃ o cÃ¡c entity/action quan trá»ng Ä‘Æ°á»£c khai bÃ¡o á»Ÿ Ä‘Ã¢y.
- CÃ¡c module dÆ°á»›i `srv/bug-service/` fill virtual fields, enforce permissions, tÃ­nh monitoring read models vÃ  implement lifecycle actions.

### LÆ°u Ã½ khi sá»­a file nÃ y

- Xem file nÃ y nhÆ° public API contract. Äá»•i tÃªn entity, field hoáº·c action sáº½ áº£nh hÆ°á»Ÿng Fiori, tests vÃ  OData clients.
- Khi thÃªm virtual field, pháº£i thÃªm hoáº·c cáº­p nháº­t read-model code Ä‘á»ƒ fill giÃ¡ trá»‹.
- Khi Ä‘á»•i action, cáº­p nháº­t `srv/service.js`, `actions.js`, Fiori action annotations vÃ  side effects.
- Khi Ä‘á»•i value-help read model, kiá»ƒm tra Fiori value-help annotations vÃ  seed data.
- Giá»¯ English vÃ  Vietnamese tÆ°Æ¡ng Ä‘Æ°Æ¡ng nhau.

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

`SimilarBugCandidate` and the unbound `suggestSimilarBugs` action form the public OData contract for duplicate/similar suggestions. â€œUnboundâ€ means the client can call the action before a Bug row exists by sending title, description, status, and classification values. It may also send `sourceBugID` when checking an existing bug.

The action returns rank, bug identity, status, score, suggested relation label, readable reason, provider status, and whether an embedding was used. It does not expose vectors, prompts, provider responses, or credentials. It also does not create `DuplicateLinks`; only a later explicit human confirmation flow may do that.

Important anchor:

- **Location**: `type SimilarBugCandidate` and `action suggestSimilarBugs(...)`
  - **IDTS concept**: suggestion-only duplicate review contract.
  - **Impact if broken**: the future Fiori review UI cannot safely call or interpret the backend result.
  - **Must check together**: `srv/ai/duplicate-detection.js`, `srv/service.js`, IDTS-66 QA, and future IDTS-70 UI integration.

### Vietnamese

`SimilarBugCandidate` vÃ  unbound action `suggestSimilarBugs` táº¡o thÃ nh OData contract cÃ´ng khai cho gá»£i Ã½ bug trÃ¹ng/tÆ°Æ¡ng tá»±. â€œUnboundâ€ nghÄ©a lÃ  client cÃ³ thá»ƒ gá»i action trÆ°á»›c khi cÃ³ Bug row báº±ng cÃ¡ch gá»­i title, description, status vÃ  classification. Khi kiá»ƒm tra bug Ä‘Ã£ tá»“n táº¡i, client cÃ³ thá»ƒ gá»­i thÃªm `sourceBugID`.

Action tráº£ rank, Ä‘á»‹nh danh bug, status, score, nhÃ£n relation gá»£i Ã½, lÃ½ do dá»… Ä‘á»c, provider status vÃ  thÃ´ng tin embedding cÃ³ Ä‘Æ°á»£c dÃ¹ng hay khÃ´ng. Action khÃ´ng expose vector, prompt, provider response hoáº·c credential. NÃ³ cÅ©ng khÃ´ng táº¡o `DuplicateLinks`; chá»‰ flow xÃ¡c nháº­n rÃµ rÃ ng cá»§a con ngÆ°á»i trong task sau má»›i Ä‘Æ°á»£c lÃ m viá»‡c Ä‘Ã³.

Äiá»ƒm neo quan trá»ng:

- **Vá»‹ trÃ­**: `type SimilarBugCandidate` vÃ  `action suggestSimilarBugs(...)`
  - **KhÃ¡i niá»‡m IDTS**: contract review duplicate theo hÆ°á»›ng suggestion-only.
  - **áº¢nh hÆ°á»Ÿng náº¿u sai**: Fiori review UI sau nÃ y khÃ´ng thá»ƒ gá»i hoáº·c hiá»ƒu káº¿t quáº£ backend má»™t cÃ¡ch an toÃ n.
  - **Pháº£i kiá»ƒm tra cÃ¹ng**: `srv/ai/duplicate-detection.js`, `srv/service.js`, QA IDTS-66 vÃ  UI integration IDTS-70 sau nÃ y.

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

`BugService.NotificationDeliveries` lÃ  projection read-only cho client Ä‘Ã£ login. NÃ³ cung cáº¥p Ä‘á»§ dá»¯ liá»‡u Ä‘á»ƒ IDTS-37 hiá»ƒn thá»‹ recipient, subject, status, sá»‘ láº§n thá»­, thá»i gian, lá»—i Ä‘Ã£ lÃ m sáº¡ch vÃ  provider message ID. NÃ³ cá»‘ Ã½ khÃ´ng expose `textBody`, `htmlBody`, worker lock hoáº·c báº¥t ká»³ SMTP config nÃ o.

- **Vá»‹ trÃ­**: `srv/service.cds:108-126`
  `@readonly entity NotificationDeliveries as projection on db.NotificationDeliveries`
  **KhÃ¡i niá»‡m IDTS**: Cho phÃ©p xem tÃ¬nh tráº¡ng email an toÃ n mÃ  khÃ´ng lÃ m lá»™ payload/control field private cá»§a worker.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: Fiori khÃ´ng giáº£i thÃ­ch Ä‘Æ°á»£c email fail hoáº·c OData client nhÃ¬n tháº¥y dá»¯ liá»‡u chá»‰ backend má»›i nÃªn dÃ¹ng.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `db/schema.cds:189`, `srv/bug-service/constants.js`, task UI/readability IDTS-37, API contract test.

`Notifications` giá»¯ navigation `deliveries` vÃ¬ delivery lÃ  dá»¯ liá»‡u con cá»§a source event. Endpoint cÃ´ng khai lÃ  `/odata/v4/bug/NotificationDeliveries`; client khÃ´ng Ä‘Æ°á»£c ghi vÃ o collection nÃ y.

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

`BugService.AiSuggestions` lÃ  OData projection read-only cho cÃ¡c dÃ²ng audit AI suggestion Ä‘Ã£ Ä‘Æ°á»£c lÃ m sáº¡ch.

Projection nÃ y tá»“n táº¡i Ä‘á»ƒ cÃ¡c task UI/review sau nÃ y cÃ³ thá»ƒ hiá»ƒn thá»‹ AI suggestion mÃ  khÃ´ng má»Ÿ quyá»n ghi tá»« client. NÃ³ gá»“m bug nguá»“n, loáº¡i feature, ngÆ°á»i request, provider/model alias, confidence, payload suggestion an toÃ n, summary, review state, reviewer, timestamps vÃ  correlation ID. NÃ³ cá»‘ Ã½ khÃ´ng cung cáº¥p public create/update/delete path.

Important anchor:

- **Vá»‹ trÃ­**: `srv/service.cds`, `@readonly entity AiSuggestions as projection on db.AiSuggestions`
  **KhÃ¡i niá»‡m IDTS**: Public read contract an toÃ n cho AI suggestion.
  **áº¢nh hÆ°á»Ÿng náº¿u sai**: UI review Fiori sau nÃ y cÃ³ thá»ƒ khÃ´ng hiá»ƒn thá»‹ Ä‘Æ°á»£c AI suggestion, hoáº·c client cÃ³ thá»ƒ ghi trá»±c tiáº¿p vÃ o audit row.
  **Pháº£i kiá»ƒm tra cÃ¹ng**: `db/schema.cds` `AiSuggestions`, `srv/ai/audit.js`, `srv/bug-service/constants.js`, `scripts/qa/test-idts65-ai-suggestion-audit.js`.

`AiSuggestionFeatureTypes` vÃ  `AiSuggestionReviewStates` cÅ©ng Ä‘Æ°á»£c expose nhÆ° code-list projection Ä‘á»ƒ client cÃ³ label dá»… Ä‘á»c. Ghi dá»¯ liá»‡u vÃ o cÃ¡c entity nÃ y bá»‹ cháº·n bá»Ÿi read-only guard list cá»§a BugService.

## IDTS-67 update: AI classification suggestion action

### English

`srv/service.cds` now also exposes `suggestClassification`, an unbound OData action that returns reviewable classification suggestions for SAP Module, Application Component, Defect Category, Priority, and Severity.

This action is intentionally suggestion-only. It does not update `Bugs`; it only returns structured rows for review. The runtime validation and fallback logic lives in `srv/ai/classification-suggestion.js`, and `srv/service.js` wires the action into CAP.

- **Location**: `type ClassificationSuggestionCandidate` and `action suggestClassification(...)`
  - **IDTS concept**: AI-assisted classification review, not automatic classification.
  - **Impact if broken**: Fiori or API clients may not be able to request classification help, or may receive a contract that hides validation status/confidence.
  - **Must check together**: `srv/ai/classification-suggestion.js`, `srv/service.js`, `db/schema.cds` catalog entities, and `scripts/qa/test-idts67-classification-suggestion.js`.

### Ti?ng Vi?t

`srv/service.cds` hi?n expose thêm `suggestClassification`, m?t unbound OData action tr? v? g?i ý phân lo?i d? review cho SAP Module, Application Component, Defect Category, Priority và Severity.

Action này du?c thi?t k? ch? d? g?i ý. Nó không update `Bugs`; nó ch? tr? v? các dòng có c?u trúc d? ngu?i dùng review. Logic validate và fallback runtime n?m trong `srv/ai/classification-suggestion.js`, còn `srv/service.js` n?i action này vào CAP.

- **V? trí**: `type ClassificationSuggestionCandidate` và `action suggestClassification(...)`
  - **Khái ni?m IDTS**: AI h? tr? review phân lo?i, không ph?i t? d?ng phân lo?i.
  - **?nh hu?ng n?u sai**: Fiori ho?c API client có th? không g?i du?c g?i ý phân lo?i, ho?c contract thi?u tr?ng thái validation/confidence.
  - **Ph?i ki?m tra cùng**: `srv/ai/classification-suggestion.js`, `srv/service.js`, các catalog entity trong `db/schema.cds`, và `scripts/qa/test-idts67-classification-suggestion.js`.

## IDTS-68 Bug Handoff Summary Update

### English

IDTS-68 adds the unbound action `summarizeBugHandoff(sourceBugID)` and result type `BugHandoffSummaryResult`.

This action belongs in `srv/service.cds` because it is a public OData contract, not a private helper. Clients call it when they need a reviewable summary for an existing bug. The action returns status, current action owner, missing information, latest important events, next expected action, provider status, grounding status, confidence, and a human-review flag.

It does not expose a write API. It does not change the bug lifecycle. Runtime behavior is implemented in `srv/ai/bug-summary.js` and wired in `srv/service.js`.

### Vietnamese

IDTS-68 them unbound action `summarizeBugHandoff(sourceBugID)` va result type `BugHandoffSummaryResult`.

Action nay nam trong `srv/service.cds` vi day la contract OData public, khong phai helper noi bo. Client goi no khi can mot ban summary co the review cho bug da ton tai. Action tra ve status, current action owner, thong tin con thieu, su kien quan trong gan day, next expected action, provider status, grounding status, confidence va co bat buoc human review.

Action nay khong expose write API. No khong doi lifecycle cua bug. Runtime behavior nam trong `srv/ai/bug-summary.js` va duoc noi trong `srv/service.js`.
