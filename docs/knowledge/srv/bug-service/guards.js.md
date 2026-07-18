# Knowledge: `srv/bug-service/guards.js`

## Beginner-first execution map (2026-07-18)

### English

`service.js` calls `registerReadOnlyEntityGuards` once during initialization. The function loops over `READ_ONLY_ENTITY_NAMES`, finds each runtime projection, and registers rejection handlers for client write events. The entities remain readable and may still be written internally by trusted backend code using database entities/transactions. Break during startup to inspect resolved targets, or at the rejection callback when direct OData unexpectedly allows/denies a write. Adding a read model/audit projection requires adding it to the constant list; removing a guard can expose internal aggregates or audit records to client mutation.

### Vietnamese

`service.js` gọi `registerReadOnlyEntityGuards` một lần khi init. Hàm lặp `READ_ONLY_ENTITY_NAMES`, tìm runtime projection và đăng ký handler reject thao tác ghi từ client. Entity vẫn đọc được và backend đáng tin vẫn có thể ghi nội bộ qua database entity/transaction. Break lúc startup để xem target resolve được, hoặc tại callback reject khi direct OData cho phép/từ chối bất ngờ. Thêm read model/audit projection phải thêm vào danh sách constant; bỏ guard có thể cho client sửa aggregate hoặc audit nội bộ.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: SangVN. Flow: read-only contracts. Inspect the registered target list when a client write is rejected or an audit/read model accidentally becomes mutable. Check service projections with the guard together.

### Vietnamese

Primary owner: DonHV. Backup: SangVN. Flow: read-only contract. Quan sát registered target list khi client write bị reject hoặc audit/read model vô tình trở thành mutable. Kiểm tra cùng service projection.

## English

### What this file is for

Registers "read-only" guards on all master data and read-model entities (Users, value lists, DeveloperWorkloads, AssignableDevelopers, HistoryEvents, etc.).

These entities must never be written through the main BugService OData endpoint.

### IDTS flow

During service init, `registerReadOnlyEntityGuards` attaches before-CREATE/UPDATE/PATCH/DELETE handlers that immediately reject with 405.

This protects the master data (statuses, roles, components, developer responsibilities) and the computed read models from accidental or malicious writes.

### Important source anchors

- `registerReadOnlyEntityGuards` using READ_ONLY_ENTITY_NAMES from constants.
  **IDTS concept**: Prevents direct modification of all lookup tables and PM/assignment read models.
  **Impact if broken**: Someone could corrupt value lists or computed workload data through the OData API.
  **Must check together**: `constants.js` (READ_ONLY_ENTITY_NAMES), `srv/service.js` (call in init), `db/schema.cds`.

### Cross-folder dependency map

Called from `srv/service.js`. The list of protected entities comes from constants (which is derived from the schema projections).

### Safe editing checklist

When you add a new read-only projection in service.cds, add its name to the constant list so the guard protects it.

## Vietnamese

### File này dùng để làm gì

Đăng ký guard "chỉ đọc" cho tất cả các entity master data và read model (Users, value lists, DeveloperWorkloads, AssignableDevelopers, HistoryEvents...).

Những entity này không được phép ghi qua endpoint BugService chính.

### Flow hoạt động trong IDTS

Khi khởi động service, hàm đăng ký before handler cho CREATE/UPDATE/PATCH/DELETE và reject ngay 405.

Điều này bảo vệ dữ liệu tham chiếu (trạng thái, vai trò, component, developer responsibility) và các read model tính toán.

### Các điểm neo quan trọng trong source

`registerReadOnlyEntityGuards` + READ_ONLY_ENTITY_NAMES từ constants.
Bảo vệ các bảng lookup và dữ liệu tính toán của PM/assignment.

### Liên kết với file/folder khác

Gọi từ service.js. Danh sách đến từ constants (dựa trên schema).

### Checklist sửa an toàn

Khi thêm projection chỉ đọc mới ở service.cds, thêm tên vào constant để guard bảo vệ.

## Metadata

- Source file: `srv/bug-service/guards.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/guards.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22
