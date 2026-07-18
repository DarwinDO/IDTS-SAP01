# Debug Lab: Create Bug and Lifecycle

## English

### Goal and mental model

A Fiori draft create is not one POST. It is a sequence: `NEW` creates a draft shell, `PATCH` updates it, and `SAVE` activates it. CAP validates every route so a direct API caller cannot bypass the UI.

### Step 1 — Prepare and place breakpoints

Log in locally as Tester or PM and open Browser Network. Use a harmless title prefixed `LEARN-`.

Place breakpoints in this order:

1. `app/bug-management-ui/webapp/ext/actions/BugListActions.js` -> `createBug`;
2. `srv/service.js` -> `this.before('NEW', Bugs.drafts, ...)`;
3. `srv/bug-service/permissions.js` -> `enforceBugCreatePermission`;
4. `srv/bug-service/drafts.js` -> `prepareDraftNew`, then `prepareDraftPatch`, then `handleDraftSave`;
5. `srv/bug-service/bug-write.js` -> `prepareBugWrite` and relevant validation helper;
6. `srv/bug-service/actions.js` -> `transitionBug` for a later lifecycle action.

### Step 2 — NEW creates the draft shell

Click **Create Bug**. Network shows a draft request with `NEW` semantics to `Bugs`. `BugListActions.createBug` asks Fiori Elements edit flow to create the draft. CAP reaches the `NEW` hook before persistence. Inspect `req.user`, `req.data`, and role. `enforceBugCreatePermission` must reject Developer with 403. `prepareDraftNew` sets trusted reporter/owner defaults from the authenticated actor.

### Step 3 — PATCH validates edits

Change title, priority, severity, or environment. Network shows one or more PATCH requests for the draft. `prepareDraftPatch` calls the write/validation path. Inspect the draft ID and changed fields in `req.data`. Catalog checks verify that codes exist and are active; required-text checks reject blank/whitespace values. A rejected PATCH returns field-targeted 400 and must not persist the invalid value.

### Step 4 — SAVE activates the draft

Click **Create/Save**. Network shows the draft activation request. `handleDraftSave(req, entities, next)` performs the final checks, then calls `next()` so CAP executes the actual draft-to-active persistence in the same request transaction. Inspect the result after `next()`: the active Bug has an ID/status and the draft is no longer the authoritative record. Post-save helpers create history, notification, and queued pre-save attachment side effects only for a successful activation.

### Step 5 — Trace one lifecycle action

On the saved Bug, run **Request More Information**. The bound OData action reaches its registration in `srv/service.js`, then `transitionBug`. Inspect actor, current bug status, requested destination status, reason, assignee, and current action owner. The function validates permission and transition, updates the Bug, and writes history/notification side effects in the request transaction.

### Failure exercise

1. As Developer, call the draft NEW route directly: expected 403 and no draft.
2. PATCH whitespace or inactive catalog code: expected targeted 400 and old value after reload.
3. Call a lifecycle action from an invalid source status: expected 4xx, no status/history change.

### Teach-back

Narrate `UI create -> NEW -> PATCH -> SAVE -> active Bug -> lifecycle action`. State where authorization, validation, persistence, and side effects happen.

## Vietnamese

### Mục tiêu và mô hình dễ nhớ

Create draft của Fiori không phải một POST duy nhất. Nó là chuỗi: `NEW` tạo vỏ draft, `PATCH` cập nhật draft và `SAVE` activate thành Bug thật. CAP kiểm tra mọi đường nên người gọi API trực tiếp không thể né UI.

### Bước 1 — Chuẩn bị và đặt breakpoint

Login local bằng Tester hoặc PM, mở Browser Network và dùng title vô hại bắt đầu bằng `LEARN-`.

Đặt breakpoint theo thứ tự:

1. `app/bug-management-ui/webapp/ext/actions/BugListActions.js` -> `createBug`;
2. `srv/service.js` -> `this.before('NEW', Bugs.drafts, ...)`;
3. `srv/bug-service/permissions.js` -> `enforceBugCreatePermission`;
4. `srv/bug-service/drafts.js` -> `prepareDraftNew`, rồi `prepareDraftPatch`, rồi `handleDraftSave`;
5. `srv/bug-service/bug-write.js` -> `prepareBugWrite` và helper validation liên quan;
6. `srv/bug-service/actions.js` -> `transitionBug` cho action lifecycle sau đó.

### Bước 2 — NEW tạo vỏ draft

Bấm **Create Bug**. Network hiện request draft có ý nghĩa `NEW` tới `Bugs`. `BugListActions.createBug` nhờ edit flow của Fiori Elements tạo draft. CAP vào hook `NEW` trước khi persist. Xem `req.user`, `req.data` và role. `enforceBugCreatePermission` phải chặn Developer bằng 403. `prepareDraftNew` lấy reporter/owner mặc định đáng tin từ actor đã login.

### Bước 3 — PATCH kiểm tra dữ liệu sửa

Đổi title, priority, severity hoặc environment. Network hiện một hoặc nhiều PATCH vào draft. `prepareDraftPatch` gọi đường write/validation. Xem draft ID và field thay đổi trong `req.data`. Catalog check bảo đảm code tồn tại và active; required-text check chặn rỗng/khoảng trắng. PATCH sai phải trả 400 đúng field và không persist giá trị sai.

### Bước 4 — SAVE activate draft

Bấm **Create/Save**. Network hiện request activate draft. `handleDraftSave(req, entities, next)` kiểm tra lần cuối rồi gọi `next()` để CAP persist draft thành active trong cùng request transaction. Sau `next()`, xem kết quả: active Bug đã có ID/status và draft không còn là record chính. Helper sau save chỉ tạo history, notification và attachment đã chọn trước save khi activation thành công.

### Bước 5 — Trace một lifecycle action

Trên Bug đã lưu, chạy **Request More Information**. Bound OData action vào chỗ đăng ký trong `srv/service.js`, sau đó tới `transitionBug`. Xem actor, status hiện tại, status đích, reason, assignee và current action owner. Hàm kiểm quyền/transition, update Bug và ghi side effect history/notification trong request transaction.

### Bài lỗi

1. Dùng Developer gọi trực tiếp draft NEW: phải 403 và không có draft.
2. PATCH khoảng trắng hoặc catalog inactive: phải 400 đúng field, reload vẫn là giá trị cũ.
3. Gọi lifecycle action từ source status sai: phải 4xx, không đổi status/history.

### Teach-back

Kể lại `UI create -> NEW -> PATCH -> SAVE -> active Bug -> lifecycle action`, đồng thời nói rõ authorization, validation, persistence và side effect nằm ở đâu.
