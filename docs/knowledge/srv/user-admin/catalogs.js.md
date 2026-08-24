# Knowledge: `srv/user-admin/catalogs.js`

## English

### What this file is for

This CAP handler module owns the server-side administration boundary for four reusable IDTS classification catalogs: `SAPModules`, `ApplicationComponents`, `DefectCategories`, and `ComponentCategories`. It is not a generic master-data editor. It accepts only the fields needed by the Business Catalogs screen, keeps CAP authorization authoritative, and preserves historical references by using activation state instead of hard deletion.

### Runtime flow

1. `srv/user-admin.js` registers this module inside the authenticated `UserAdministrationService` and supplies `requireActiveUserAdministrator`.
2. A catalog `READ`, `CREATE`, `UPDATE`, or `DELETE` request enters the handler. Every path authorizes the exact active PM + `UserAdmin` principal before reading or changing persistence.
3. CREATE discards any client/framework ID, assigns a fresh server UUID, normalizes code/name/type fields, and validates duplicate codes or active parent pairs. A caller-supplied ID is never persisted.
4. UPDATE accepts the same normalized ID in route and payload only as the immutable target key, rejects route/payload mismatch, locks the target row, checks the request `If-Match` value against `modifiedAt`, removes the key from the persistence change set, validates only allowlisted changes, and blocks deactivation when active responsibility or child references remain.
5. CAP commits the catalog change and its append-only sanitized audit row together. A failure rolls both back. Rejected requests record only a safe result code, never a raw request body or provider identity.
6. `readCatalogImpact` returns counts for Bugs, DeveloperResponsibilities, and active child catalog rows. It does not expose the audit table or unrestricted navigation into Bugs/Users.

### Important source anchors

- **Location**: `srv/user-admin/catalogs.js:7-57` — `CATALOG_ENTITIES`, `CATALOGS`, and `CATALOG_BY_SERVICE_ENTITY`.
  **IDTS concept**: The allowlist maps each public projection to one persistence entity, code length, Bug reference field, responsibility path, child-reference path, and writable field set. `ComponentCategories` is the actual Application Component + Defect Category assignment pair.
  **Impact if broken**: An incorrect mapping can count the wrong impact, accept fields from another catalog, or deactivate a master row while active DeveloperResponsibilities still depend on it.
  **Must check together**: `srv/user-admin.cds:236-293` (four projections and safe fields), `db/schema.cds:91-137` (catalog entities/audit), `scripts/qa/test-user-admin-catalogs.js:23-28` (public field contract), and `app/user-administration-ui/webapp/controller/Main.controller.js:10-15` (UI payload allowlist).

- **Location**: `srv/user-admin/catalogs.js:59-70` — `registerCatalogHandlers`.
  **IDTS concept**: CAP lifecycle wiring applies authorization and validation before CRUD, records audits after successful CREATE/UPDATE, rejects DELETE, and exposes only the bounded `readCatalogImpact` action.
  **Impact if broken**: UI visibility could become the only apparent guard, DELETE could bypass the no-hard-delete rule, or audit rows could be omitted from successful changes.
  **Must check together**: `srv/user-admin.js:51-89` (authorization injection), `srv/user-admin.cds:193-196` (impact action), and `scripts/qa/test-user-admin-catalogs.js:111-150,237-242` (role/impact/DELETE contract).

- **Location**: `srv/user-admin/catalogs.js:72-109` — `prepareCatalogCreate`.
  **IDTS concept**: CREATE replaces any client/framework `ID` with a fresh server UUID, normalizes codes to uppercase/trimmed allowlisted syntax, validates names and active Component Category parents, strips the transient administration reason before persistence, and records a rejection context before validation.
  **Impact if broken**: A caller could choose a durable catalog identity, a transient reason could leak into persistence, duplicate or malformed value-help entries could be created, or a Component Category could reference inactive parents.
  **Must check together**: `srv/user-admin.cds:234-280` (`@Core.Immutable` keys and insert capability), `db/schema.cds:91-125` (unique code/pair constraints), and `scripts/qa/test-user-admin-catalogs.js:152-182,196-207` (normalization, immutable-ID, duplicate, and parent tests).

- **Location**: `srv/user-admin/catalogs.js:111-187` — `prepareCatalogUpdate`.
  **IDTS concept**: UPDATE accepts equal normalized route/payload IDs only as the immutable target key, rejects a mismatch, removes the ID from the persistence change set, locks the current row, checks the ETag, validates normalized fields, requires a bounded reason for deactivation, and blocks active dependency loss.
  **Impact if broken**: Stale PM edits could overwrite another change, an ID could be retargeted, or a catalog used by active responsibility/child rows could disappear from new selections without a controlled follow-up.
  **Must check together**: `srv/user-admin.cds:236-293` (`modifiedAt @odata.etag`, capabilities), `scripts/qa/test-user-admin-catalogs.js:164-228` (ETag/deactivation/reactivation/audit), and the UI5 update-group flow in `Main.controller.js:803-861`.

- **Location**: `srv/user-admin/catalogs.js:189-225` and `291-342` — rejection/success audit and `readCatalogImpact`.
  **IDTS concept**: Audit rows are append-only, bounded to safe summaries/reasons/correlation IDs, and impact responses contain counts only. The audit is written in the same CAP transaction as the catalog mutation.
  **Impact if broken**: PM cannot explain a rejected/deactivated catalog change, or an impact response could leak raw Bug/user/provider data.
  **Must check together**: `db/schema.cds:127-137` (`CatalogAdministrationAuditEvents`), `srv/user-admin.cds:109-115` (`CatalogImpactResult`), `docs/pm/evidence/user-administration/gate-5-business-catalogs-source.md`, and the privacy assertions in `scripts/qa/test-user-admin-catalogs.js:155-178`.

### Safe editing checklist

- On CREATE, always replace any client/framework ID with a fresh server UUID and never persist the supplied value. On UPDATE, allow the same normalized route/payload ID only to identify the target, reject mismatches, and remove the key before persistence.
- Keep `If-Match`/`modifiedAt` checks and `forUpdate()` in the same request transaction.
- Never add DELETE, bulk import, raw SQL, provider data, identity claims, credentials, or raw request payload fields.
- When changing a catalog field or impact relationship, update the CDS projection, `CATALOGS` map, UI payload/display logic, focused CAP/UI contracts, and this mirror together.
- Re-run `npm run qa:user-admin-catalogs:programmatic`, CAP EDMX/HANA compile, secret scan, and diff checks. Live catalog mutation and HDI migration belong to later approvals.

## Tiếng Việt

### File này dùng để làm gì

Module handler CAP này sở hữu boundary quản trị phía server cho bốn classification catalog dùng lại trong IDTS: `SAPModules`, `ApplicationComponents`, `DefectCategories` và `ComponentCategories`. Đây không phải generic master-data editor. Module chỉ nhận các field cần cho màn hình Business Catalogs, giữ CAP là authority của authorization và bảo vệ reference lịch sử bằng trạng thái active thay vì hard delete.

### Luồng runtime

1. `srv/user-admin.js` đăng ký module trong `UserAdministrationService` đã authenticated và truyền guard `requireActiveUserAdministrator`.
2. Request `READ`, `CREATE`, `UPDATE` hoặc `DELETE` của catalog đi vào handler. Mọi path đều authorize đúng principal PM + `UserAdmin` đang active trước khi đọc hoặc đổi persistence.
3. CREATE bỏ ID do client/framework đưa vào, gán UUID mới do server tạo, normalize code/name/type và kiểm tra duplicate code hoặc cặp parent đang active. ID caller gửi không bao giờ được persist.
4. UPDATE chỉ chấp nhận route/payload ID đã normalize giống nhau để xác định target immutable, reject mismatch, lock row đích, so sánh `If-Match` với `modifiedAt`, bỏ key khỏi change set, chỉ validate field allowlist và chặn deactivate khi còn responsibility hoặc child reference active.
5. CAP commit thay đổi catalog và audit append-only sanitize trong cùng transaction. Nếu lỗi, cả hai cùng rollback. Request bị reject chỉ ghi result code an toàn, không ghi raw body hay provider identity.
6. `readCatalogImpact` chỉ trả count của Bug, `DeveloperResponsibilities` và child catalog active. Action không expose audit table hoặc navigation không giới hạn vào Bugs/Users.

### Các điểm neo source quan trọng

- **Vị trí**: `srv/user-admin/catalogs.js:7-57` — `CATALOG_ENTITIES`, `CATALOGS`, `CATALOG_BY_SERVICE_ENTITY`.
  **Khái niệm IDTS**: Allowlist map mỗi projection public tới entity persistence, code length, field reference Bug, đường responsibility, child reference và tập writable field. `ComponentCategories` là cặp Application Component + Defect Category dùng làm assignment key thật.
  **Ảnh hưởng nếu sai**: Mapping sai có thể đếm impact nhầm, nhận field của catalog khác hoặc deactivate master row trong khi `DeveloperResponsibilities` active vẫn phụ thuộc.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:236-293` (bốn projection và safe field), `db/schema.cds:91-137` (catalog/audit entity), `scripts/qa/test-user-admin-catalogs.js:23-28` (public field contract) và `app/user-administration-ui/webapp/controller/Main.controller.js:10-15` (UI payload allowlist).

- **Vị trí**: `srv/user-admin/catalogs.js:59-70` — `registerCatalogHandlers`.
  **Khái niệm IDTS**: CAP lifecycle wiring authorize và validate trước CRUD, ghi audit sau CREATE/UPDATE thành công, reject DELETE và chỉ expose action `readCatalogImpact` có boundary.
  **Ảnh hưởng nếu sai**: UI visibility có thể trở thành guard duy nhất, DELETE có thể vượt rule no-hard-delete hoặc audit success bị bỏ qua.
  **Phải kiểm tra cùng**: `srv/user-admin.js:51-89` (inject authorization), `srv/user-admin.cds:193-196` (impact action) và `scripts/qa/test-user-admin-catalogs.js:111-150,237-242` (role/impact/DELETE contract).

- **Vị trí**: `srv/user-admin/catalogs.js:72-109` — `prepareCatalogCreate`.
  **Khái niệm IDTS**: CREATE thay mọi `ID` do client/framework cung cấp bằng UUID mới của server, normalize code thành uppercase/trim theo syntax allowlist, validate name và parent active của Component Category, bỏ administration reason transient trước persistence và lưu context rejection trước validation.
  **Ảnh hưởng nếu sai**: Caller có thể tự chọn durable catalog identity, reason transient có thể lọt vào persistence, value-help entry trùng/malformed có thể được tạo hoặc Component Category có parent inactive.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:234-280` (key `@Core.Immutable` và insert capability), `db/schema.cds:91-125` (unique code/pair) và `scripts/qa/test-user-admin-catalogs.js:152-182,196-207` (normalize, immutable-ID, duplicate, parent).

- **Vị trí**: `srv/user-admin/catalogs.js:111-187` — `prepareCatalogUpdate`.
  **Khái niệm IDTS**: UPDATE chỉ chấp nhận route/payload ID đã normalize giống nhau như target key immutable, reject mismatch, bỏ ID khỏi persistence change set, lock row hiện tại, enforce ETag, validate field normalize, bắt buộc reason khi deactivate và chặn mất dependency active.
  **Ảnh hưởng nếu sai**: PM edit cũ có thể overwrite thay đổi mới, ID có thể bị đổi target hoặc catalog đang được responsibility/child active dùng bị mất khỏi selection mà không có follow-up có kiểm soát.
  **Phải kiểm tra cùng**: `srv/user-admin.cds:236-293` (`modifiedAt @odata.etag`, capability), `scripts/qa/test-user-admin-catalogs.js:164-228` (ETag/deactivate/reactivate/audit) và UI5 update-group tại `Main.controller.js:803-861`.

- **Vị trí**: `srv/user-admin/catalogs.js:189-225` và `291-342` — audit rejection/success và `readCatalogImpact`.
  **Khái niệm IDTS**: Audit row append-only, chỉ lưu summary/reason/correlation an toàn; impact response chỉ có count. Audit được ghi trong cùng CAP transaction với mutation catalog.
  **Ảnh hưởng nếu sai**: PM không giải thích được thay đổi catalog bị reject/deactivate hoặc impact response có thể làm lộ raw Bug/user/provider data.
  **Phải kiểm tra cùng**: `db/schema.cds:127-137` (`CatalogAdministrationAuditEvents`), `srv/user-admin.cds:109-115` (`CatalogImpactResult`), `docs/pm/evidence/user-administration/gate-5-business-catalogs-source.md` và privacy assertions `scripts/qa/test-user-admin-catalogs.js:155-178`.

### Checklist sửa an toàn

- Với CREATE, luôn thay ID từ client/framework bằng UUID mới của server và không persist giá trị caller gửi. Với UPDATE, chỉ dùng route/payload ID giống nhau sau normalize để xác định target, reject mismatch và bỏ key trước persistence.
- Giữ ETag/`modifiedAt` và `forUpdate()` trong cùng request transaction.
- Không thêm DELETE, bulk import, raw SQL, provider data, identity claim, credential hoặc raw request payload.
- Khi đổi field catalog hoặc quan hệ impact, cập nhật đồng thời CDS projection, map `CATALOGS`, UI payload/display, CAP/UI contract và mirror này.
- Chạy lại `npm run qa:user-admin-catalogs:programmatic`, compile CAP EDMX/HANA, secret scan và diff check. Live catalog mutation và HDI migration thuộc approval sau.

## Metadata

- Source: `srv/user-admin/catalogs.js`
- Knowledge mirror: `docs/knowledge/srv/user-admin/catalogs.js.md`
- Layer: CAP service handler / OData V4 boundary
- Last reviewed: 2026-08-23, Gate 5 remediation branch
