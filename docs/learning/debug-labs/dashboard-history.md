# Debug Lab: Dashboard and History

## English

### Goal and mental model

The dashboard reads and reshapes existing data; it is not a second source of truth. History is persisted audit data. UI enrichment may improve how a history row is displayed but must not rewrite old audit records.

### Step 1 — Dashboard UI and Network

Open `/bug-management-ui/webapp/dashboard.html` as Tester, Developer, then PM. In Network identify reads to Bug OData data and `DeveloperWorkloads`. Place breakpoints at:

1. `app/bug-management-ui/webapp/dashboard-page.js:loadDashboard`;
2. `fetchOData` and `buildDashboardModel`;
3. one role function: `testerDashboard`, `developerDashboard`, or `pmDashboard`;
4. `srv/service.js` registration for `DeveloperWorkloads`;
5. `srv/bug-service/monitoring.js:readDeveloperWorkloads`.

`loadDashboard` starts the reads. `fetchOData` checks HTTP responses. `buildDashboardModel` selects the role-specific transformation. Inspect current user/role, returned Bugs/workloads, filtered rows, and KPI values. The backend read model computes safe workload data; the browser only creates display cards/lists from the response.

### Step 2 — History read path

Open a Bug Object Page and the History section. In Network locate the `HistoryEvents` read and inspect `$select`, `$orderby`, `$top`, and paging parameters. Place breakpoints at:

1. `srv/bug-service/history-read-models.js:ensureHistoryEventSelectDependencies`;
2. `enrichHistoryEventPayload`;
3. `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, especially the `List` binding and `growingThreshold`.

The before-READ helper adds fields needed for enrichment. CAP executes the database SELECT. The after-READ helper turns stored actor/action/status references into safe display payload. The UI renders the initial page and requests more only through the explicit Show More/paging path.

### Step 3 — Prove persistence

Perform one valid action, reload the Object Page, and confirm exactly one new history event. The persisted row is authoritative; changing UI wording must happen in enrichment/labels, not by editing old audit content.

### Failure exercises

- Compare the same dashboard as two roles; unsafe cross-role data must not appear.
- Simulate a failed dashboard request: show a clear safe error/empty state, no raw stack.
- Use a Bug with more history than the initial limit: the first request must be limited and Show More must fetch the next portion.
- Repeat/double-click an action: no unexplained duplicate transition.

### Teach-back

Explain the difference between database audit row, backend read-model/enrichment, and UI presentation. Trace one KPI and one history row from request to screen.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

Dashboard đọc và biến đổi dữ liệu đã có; nó không phải nguồn dữ liệu chính thứ hai. History là audit data đã persist. UI enrichment được phép làm cách hiển thị dễ hiểu hơn nhưng không được viết lại audit record cũ.

### Bước 1 — Dashboard UI và Network

Mở `/bug-management-ui/webapp/dashboard.html` lần lượt bằng Tester, Developer và PM. Trong Network tìm request đọc Bug OData và `DeveloperWorkloads`. Đặt breakpoint:

1. `app/bug-management-ui/webapp/dashboard-page.js:loadDashboard`;
2. `fetchOData` và `buildDashboardModel`;
3. một hàm theo role: `testerDashboard`, `developerDashboard` hoặc `pmDashboard`;
4. chỗ đăng ký `DeveloperWorkloads` trong `srv/service.js`;
5. `srv/bug-service/monitoring.js:readDeveloperWorkloads`.

`loadDashboard` khởi động các read request. `fetchOData` kiểm HTTP response. `buildDashboardModel` chọn cách biến đổi theo role. Xem user/role hiện tại, danh sách Bugs/workloads trả về, row sau filter và KPI. Backend read model tính workload an toàn; browser chỉ dựng card/list để hiển thị từ response.

### Bước 2 — Đường đọc History

Mở Object Page của một Bug và section History. Trong Network tìm request `HistoryEvents`, xem `$select`, `$orderby`, `$top` và tham số paging. Đặt breakpoint:

1. `srv/bug-service/history-read-models.js:ensureHistoryEventSelectDependencies`;
2. `enrichHistoryEventPayload`;
3. `app/bug-management-ui/webapp/ext/fragment/HistoryTimeline.fragment.xml`, đặc biệt binding của `List` và `growingThreshold`.

Before-READ helper thêm field cần cho enrichment. CAP chạy database SELECT. After-READ helper đổi reference actor/action/status đã lưu thành payload hiển thị an toàn. UI render trang đầu và chỉ lấy thêm qua đường Show More/paging rõ ràng.

### Bước 3 — Chứng minh persistence

Thực hiện một action hợp lệ, reload Object Page và xác nhận đúng một history event mới. Row đã persist là nguồn chính; muốn đổi wording UI thì sửa enrichment/label chứ không sửa audit content cũ.

### Bài lỗi

- So sánh cùng dashboard bằng hai role; không được lộ dữ liệu ngoài phạm vi role.
- Mô phỏng request dashboard fail: hiện error/empty state an toàn, không raw stack.
- Dùng Bug có history dài hơn giới hạn đầu: request đầu phải có limit và Show More mới lấy phần tiếp theo.
- Repeat/double-click action: không có transition trùng không giải thích được.

### Teach-back

Giải thích khác nhau giữa database audit row, backend read-model/enrichment và UI presentation. Trace một KPI và một history row từ request tới màn hình.
