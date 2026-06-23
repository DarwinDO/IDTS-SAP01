# Knowledge: `srv/bug-service/guards.js`

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