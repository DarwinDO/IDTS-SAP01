# Debug Lab: Dashboard and History

## English

### Goal

Learn why a dashboard is a read model and why history is an audit trail, not a free-form log that the UI can rewrite.

### Safe setup and breakpoints

Open the dashboard as Tester, Developer, then PM. Break in `app/bug-management-ui/webapp/ext/dashboard/dashboard-page.js` at its data-load method, `srv/service.js` at `readDeveloperWorkloads`, and `srv/bug-service/monitoring.js`. For a Bug Object Page, break in `srv/service.js` at `ensureHistoryEventSelectDependencies` and `enrichHistoryEventPayload`, then inspect the history fragment/controller under `app/bug-management-ui/webapp/ext/sections`.

### Expected execution order

1. The dashboard issues read requests; it does not create a new authoritative business table.
2. CAP derives role-aware counts from Bugs and developer workload/read-model data. The authenticated user determines which rows are safe to show.
3. A lifecycle/comment/assignment write creates a HistoryEvent as a side effect.
4. When the Object Page reads history, CAP adds the required select fields and enriches display payload so the UI can present actor, action, and status safely.
5. History loading must use the configured page limit and a deliberate Show More/pagination action. It must not silently load an unlimited audit trail.

### Inspect and failure exercise

Compare the same dashboard request as two roles. Inspect `$top`, skip/page values, and returned history count. Refresh after an action and confirm the new event is persisted once. Repeated clicking may be a race; it must never create an unexplained duplicate state change.

### Teach-back

Explain the difference between a read model, a history record, and the UI's display enrichment. Explain why an old history item must not be edited simply because the wording on screen needs improvement.

## Vietnamese

### Mục tiêu

Hiểu dashboard là read model và history là audit trail, không phải log tự do để UI ghi đè.

### Chuẩn bị và breakpoint

Mở dashboard lần lượt bằng Tester, Developer rồi PM. Đặt breakpoint trong `app/bug-management-ui/webapp/ext/dashboard/dashboard-page.js` tại phần load data, `srv/service.js` tại `readDeveloperWorkloads`, và `srv/bug-service/monitoring.js`. Trên Bug Object Page, đặt breakpoint tại `ensureHistoryEventSelectDependencies` và `enrichHistoryEventPayload`, sau đó xem history fragment/controller trong `app/bug-management-ui/webapp/ext/sections`.

### Thứ tự chạy mong đợi

1. Dashboard gửi read request; nó không tạo một business table authoritative mới.
2. CAP tính count theo role từ Bugs và developer workload/read-model. User đã authenticate quyết định row nào được hiển thị an toàn.
3. Lifecycle/comment/assignment write tạo HistoryEvent như side effect.
4. Khi Object Page đọc history, CAP thêm select field cần thiết và enrich display payload để UI trình bày actor, action, status an toàn.
5. History phải dùng page limit và Show More/pagination có chủ đích. Không được âm thầm load audit trail vô hạn.

### Cần quan sát và bài lỗi

So sánh cùng dashboard request ở hai role. Quan sát `$top`, skip/page và số history trả về. Refresh sau action để xác nhận event mới persist đúng một lần. Click lặp có thể là race; không được tạo state change trùng mà không giải thích được.

### Giải thích lại

Giải thích khác nhau giữa read model, history record và display enrichment của UI. Giải thích vì sao history cũ không được sửa chỉ vì wording trên màn hình cần đẹp hơn.
