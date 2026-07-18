# Knowledge: `srv/bug-service/monitoring.js`

## Beginner-first execution map (2026-07-18)

### English

`service.js` handles READ DeveloperWorkloads with `readDeveloperWorkloads`. It queries active profiles and relevant Bugs, calls `buildDeveloperWorkloadRows`, then applies CQN search/filter/order/paging/select in memory because these are calculated rows rather than a database table. Workload distinguishes technical ownership from current action ownership and computes overdue/effort/overload without persisting aggregates. Debug raw profiles/Bugs → one developer's empty row → each Bug contribution → filter evaluator → final page. The small expression evaluator uses an operator allow-list; never replace it with JavaScript `eval`.

### Vietnamese

`service.js` xử lý READ DeveloperWorkloads bằng `readDeveloperWorkloads`. Hàm query profile active và các Bug liên quan, gọi `buildDeveloperWorkloadRows`, rồi áp CQN search/filter/order/paging/select trong memory vì đây là row tính toán chứ không phải table DB. Workload phân biệt technical ownership với current action ownership và tính overdue/effort/overload mà không persist aggregate. Debug theo profile/Bug raw → empty row của một developer → đóng góp của từng Bug → filter evaluator → page cuối. Expression evaluator nhỏ dùng allow-list operator; không thay bằng JavaScript `eval`.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: Bugs -> DeveloperWorkloads/dashboard. Break at aggregation when PM counts or overload flags differ from Bug data. This is read-only analysis, not an assignment engine.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: Bugs -> DeveloperWorkloads/dashboard. Đặt breakpoint tại aggregation khi PM count hoặc overload flag khác Bug data. Đây là phân tích read-only, không phải assignment engine.

## English

### What this file is for

Implements the `DeveloperWorkloads` read model — the aggregate view used by PM to see workload, overdue bugs, and status breakdown per developer.

### IDTS flow

`readDeveloperWorkloads` is registered as an `on('READ', DeveloperWorkloads)` handler. It loads all active developer profiles + their assigned bugs, calculates counts per status, overdue flag, total effort, and whether the developer is overloaded.

It keeps inactive developers only while they still own open bugs (important for PM cleanup).

### Important source anchors

- `readDeveloperWorkloads` + build logic using STATUS_COUNT_FIELDS.
  **IDTS concept**: Provides the PM monitoring view (assignee-based, not nextProcessor). Includes developers with zero bugs if they are active.
  **Impact if broken**: PM cannot see workload or overloaded developers correctly.
  **Must check together**: `srv/service.cds` (DeveloperWorkloads entity), `db/schema.cds` (DeveloperProfiles + Bugs), Fiori monitoring views.

### Cross-folder dependency map

Exposed via `srv/service.cds`. Data comes from DeveloperProfiles and Bugs in the schema. Used by PM dashboards in the Fiori app.

### Safe editing checklist

Changes to status codes or workload calculation must be reflected here and in tests. Keep the filter that retains inactive developers who still have open bugs.

## Vietnamese

### File này dùng để làm gì

Thực hiện read model `DeveloperWorkloads` — view tổng hợp để PM xem khối lượng công việc, bug quá hạn, phân bố trạng thái theo developer.

### Flow hoạt động trong IDTS

Handler on READ DeveloperWorkloads. Tải developer profiles + bug được assign, tính số lượng theo trạng thái, overdue, effort, overloaded.

Giữ developer không active chỉ khi họ vẫn còn bug đang mở (để PM dọn dẹp).

### Các điểm neo quan trọng

Logic build + STATUS_COUNT_FIELDS. Cung cấp view PM theo assignee.

### Liên kết

service.cds + schema (DeveloperProfiles, Bugs) + Fiori monitoring.

### Checklist

Đồng bộ khi thay đổi status hoặc logic workload. Giữ logic giữ developer inactive có bug mở.

## Metadata

- Source file: `srv/bug-service/monitoring.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/monitoring.js.md`
- Source layer: `srv`
- Last reviewed: 2026-06-22
