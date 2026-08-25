# Knowledge: `srv/bug-service/monitoring.js`

## 2026-08-08 effective availability

English: Dashboard rows use 0-1 Available, 2 Busy, and 3+ Unavailable for every assigned non-Closed Bug, including Rejected. Vietnamese: Dashboard dùng 0-1 Available, 2 Busy, từ 3 Unavailable cho mọi Bug còn assignee và chưa Closed, kể cả Rejected.

## 2026-08-26 DeveloperWorkloads authorization boundary

### English

Before loading profiles or Bugs, `readDeveloperWorkloads` resolves the caller through the existing `resolveRequestUser` helper. That helper requires one active internal IDTS user and preserves the existing XSUAA platform-role alignment check. An active PM may read all workload rows without requiring the `UserAdmin` capability. An active Developer is scoped server-side to rows whose `developerUserID` equals the resolved actor `Users.ID`; the client cannot widen this scope with `$filter`, `$search`, `$count`, `$skip`, `$top`, `$orderby`, or `$select`. Tester, UserAdmin without PM business role, inactive, unmapped, and misaligned callers fail closed with the repository's 403 path.

The Developer scope is applied before aggregate filtering, ordering, paging and count calculation. Ordinary `BugService.Bugs` read policy is not changed by this Gate 6.3 remediation; the authorization boundary is specifically the `DeveloperWorkloads` read model.

### Vietnamese

Trước khi tải profile hoặc Bug, `readDeveloperWorkloads` resolve caller qua helper dùng chung `resolveRequestUser`. Helper này yêu cầu đúng một internal IDTS user đang active và giữ nguyên kiểm tra platform-role alignment của XSUAA. PM active được đọc toàn bộ workload mà không cần capability `UserAdmin`. Developer active bị scope ở server vào những row có `developerUserID` bằng `Users.ID` của actor đã resolve; client không thể mở rộng scope bằng `$filter`, `$search`, `$count`, `$skip`, `$top`, `$orderby` hoặc `$select`. Tester, UserAdmin không có business role PM, caller inactive, không map được hoặc misaligned đều fail-closed theo path 403 của repository.

Scope Developer được áp dụng trước khi aggregate xử lý filter, order, paging và count. Gate 6.3 remediation này không thay đổi read policy của `BugService.Bugs` thông thường; boundary được sửa cụ thể là read model `DeveloperWorkloads`.

## Beginner-first execution map (2026-07-18)

### English

`service.js` handles READ DeveloperWorkloads with `readDeveloperWorkloads`. It resolves the active internal actor first, scopes PM or Developer access server-side, queries only the permitted profile/Bug set, calls `buildDeveloperWorkloadRows`, then applies CQN search/filter/order/paging/select in memory because these are calculated rows rather than a database table. Workload distinguishes technical ownership from current action ownership and computes overdue/effort/overload without persisting aggregates. Debug actor resolution → scoped profiles/Bugs → one developer's empty row → each Bug contribution → filter evaluator → final page. The small expression evaluator uses an operator allow-list; never replace it with JavaScript `eval`.

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

`readDeveloperWorkloads` is registered as an `on('READ', DeveloperWorkloads)` handler. It resolves an active internal actor with platform-role alignment, permits PM all-rows monitoring, scopes an active Developer to the actor's own `developerUserID`, then calculates counts per status, overdue flag, total effort, and whether the developer is overloaded.

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

Handler on READ DeveloperWorkloads. Resolve actor active + platform-role alignment, cho PM xem toàn cảnh, scope Developer vào `developerUserID` của chính actor, rồi tải profile/bug được assign để tính số lượng theo trạng thái, overdue, effort, overloaded.

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
- Last reviewed: 2026-08-26
