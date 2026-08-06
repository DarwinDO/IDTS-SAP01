# Knowledge: `app/bug-management-ui/webapp/dashboard-page.js`

> **Ownership / debug anchor:** DatDT owns dashboard rendering (backup: NhanT). Inspect its OData read/filter and safe role profile when KPI content is wrong.
> **Ownership / điểm debug:** DatDT sở hữu phần render dashboard (backup: NhanT). Khi KPI sai, kiểm OData read/filter và role profile an toàn.

## English

### What this file is for

This file renders the IDTS role-based dashboard. It builds a read-only SAPUI5 page, loads existing OData data, and turns that data into role-specific tiles and lists.

### Beginner explanation

The dashboard does not introduce a new backend service. It reads:

- `BugService.Bugs`
- `BugService.DeveloperWorkloads`

Then it calculates what each role should see:

- Tester: bugs I reported, items waiting for my input, retest required.
- Developer: bugs assigned to me, in-progress work, information requested.
- PM: open bugs, pending assignment, overdue bugs, and developer workload.

### Flow in IDTS

1. `dashboard.html` loads this script after SAPUI5 bootstrap.
2. The script creates a SAPUI5 `App` and `Page`.
3. It creates dashboard header actions, including `Refresh` and the signed-in profile action.
4. It reads the safe login session through `LoginController`.
5. It calls existing protected OData endpoints with the current Bearer token.
6. It fills a JSON model named `dashboard`.
7. SAPUI5 bindings render KPI tiles, "Needs attention", and PM workload.

### Important source anchors

- Location: `fetchOData(...)`
  - IDTS concept: protected read-only dashboard data access.
  - Impact if broken: dashboard cannot read Bugs or DeveloperWorkloads.
  - Must check together: `auth-guard.js`, `srv/service.cds`, and `srv/auth.js`.

- Location: `testerDashboard(...)`
  - IDTS concept: Tester action overview.
  - Impact if broken: Tester may miss need-more-info or retest items.
  - Must check together: bug workflow actions and List Report monitoring tabs.

- Location: `developerDashboard(...)`
  - IDTS concept: Developer workload and assignment overview.
  - Impact if broken: Developer may see unrelated work or miss assigned bugs.
  - Must check together: `DeveloperWorkloads` and assignment handling.

- Location: `pmDashboard(...)`
  - IDTS concept: PM monitoring overview.
  - Impact if broken: PM view may under-report pending assignment, overdue work, or team load.
  - Must check together: `srv/bug-service/monitoring.js` and `srv/service.cds`.

- Location: `openBug(...)`
  - IDTS concept: drill down from dashboard to bug Object Page.
  - Impact if broken: dashboard becomes a read-only summary without direct navigation to the actual bug.
  - Must check together: `manifest.json` Object Page route and browser smoke.

- Location: `headerContent`
  - IDTS concept: standalone-page action area for refresh and profile access.
  - Impact if broken: header actions can overlap each other or the signed-in profile menu can become unreachable on the dashboard.
  - Must check together: `ProfileShell.js`, `dashboard.html`, and browser smoke.

### Cross-folder impact

- Reads data exposed by `srv/service.cds`.
- Depends on virtual display fields enriched by `srv/bug-service/read-models.js`.
- Uses `ProfileShell.js` and `LoginController.js` from `webapp/ext/login`.
- Uses `ProfileShell.createHeaderButton()` so the dashboard profile action stays inside the SAPUI5 page header instead of floating above it.
- The visible entry point comes from `manifest.json` and `BugListActions.js`.

### Safe editing checklist

- Keep this page read-only unless a new Jira task explicitly adds dashboard actions.
- Do not log bearer tokens, passwords, private endpoints, SMTP data, S3 data, or full private email lists.
- Do not hardcode real team emails.
- Do not show internal/dev-facing text on the UI.
- If role grouping changes, update business/PM docs because the meaning of the dashboard changes.

## IDTS-58 follow-up notes

### English

The original IDTS-54 dashboard used the fixed profile shell overlay from `index.html`. During IDTS-58 browser smoke, that approach caused the profile trigger to overlap the `Refresh` button. The fix was not a visual hack inside CSS alone; the dashboard now requests a normal profile button from `ProfileShell.js` and places it in `sap.m.Page` `headerContent`.

This keeps the dashboard closer to standard SAPUI5 page behavior: both actions are peers inside the same header layout, and overlap should be checked with browser smoke whenever header actions change.

### Vietnamese

Ban dau dashboard IDTS-54 dung fixed profile shell overlay giong `index.html`. Trong browser smoke cua IDTS-58, cach nay lam profile trigger de len nut `Refresh`. Ban fix cuoi khong chi la meo CSS; dashboard hien lay mot profile button binh thuong tu `ProfileShell.js` va dat no vao `sap.m.Page` `headerContent`.

Cach nay gan hon voi hanh vi page SAPUI5 chuan: hai action nam cung mot header layout, va moi lan doi header actions deu nen kiem tra lai bang browser smoke.

## Vietnamese

### File này dùng để làm gì

File này render dashboard theo role cho IDTS. Nó dựng một SAPUI5 page chỉ đọc, load dữ liệu OData hiện có, rồi biến dữ liệu đó thành tile và list theo từng role.

### Giải thích cho người mới

Dashboard không tạo backend service mới. Nó đọc:

- `BugService.Bugs`
- `BugService.DeveloperWorkloads`

Sau đó nó tính mỗi role nên thấy gì:

- Tester: bug do tôi report, item đang chờ tôi bổ sung, bug cần retest.
- Developer: bug assign cho tôi, việc đang in progress, thông tin đã request.
- PM: bug đang mở, pending assignment, bug overdue, và workload developer.

### Flow hoạt động trong IDTS

1. `dashboard.html` load script này sau SAPUI5 bootstrap.
2. Script tạo SAPUI5 `App` và `Page`.
3. Nó khởi tạo signed-in profile shell.
4. Nó đọc session an toàn qua `LoginController`.
5. Nó gọi các OData endpoint protected hiện có bằng Bearer token hiện tại.
6. Nó fill JSON model tên `dashboard`.
7. SAPUI5 binding render KPI tile, "Needs attention", và workload cho PM.

### Các source anchor quan trọng

- Vị trí: `fetchOData(...)`
  - Khái niệm IDTS: đọc dữ liệu dashboard protected và chỉ đọc.
  - Ảnh hưởng nếu sai: dashboard không đọc được Bugs hoặc DeveloperWorkloads.
  - Phải kiểm tra cùng: `auth-guard.js`, `srv/service.cds`, và `srv/auth.js`.

- Vị trí: `testerDashboard(...)`
  - Khái niệm IDTS: tổng quan hành động cho Tester.
  - Ảnh hưởng nếu sai: Tester có thể bỏ sót item need-more-info hoặc retest.
  - Phải kiểm tra cùng: workflow action của bug và các tab monitoring List Report.

- Vị trí: `developerDashboard(...)`
  - Khái niệm IDTS: tổng quan assignment và workload cho Developer.
  - Ảnh hưởng nếu sai: Developer có thể thấy việc không liên quan hoặc bỏ sót bug được assign.
  - Phải kiểm tra cùng: `DeveloperWorkloads` và xử lý assignment.

- Vị trí: `pmDashboard(...)`
  - Khái niệm IDTS: tổng quan monitoring cho PM.
  - Ảnh hưởng nếu sai: PM view có thể báo thiếu pending assignment, overdue work, hoặc team load.
  - Phải kiểm tra cùng: `srv/bug-service/monitoring.js` và `srv/service.cds`.

- Vị trí: `openBug(...)`
  - Khái niệm IDTS: drill down từ dashboard vào Object Page của bug.
  - Ảnh hưởng nếu sai: dashboard chỉ còn là summary, không mở được bug thật.
  - Phải kiểm tra cùng: route Object Page trong `manifest.json` và browser smoke.

### Liên kết với folder khác

- Đọc dữ liệu expose bởi `srv/service.cds`.
- Phụ thuộc virtual display fields được enrich trong `srv/bug-service/read-models.js`.
- Dùng `ProfileShell.js` và `LoginController.js` từ `webapp/ext/login`.
- Entry point hiển thị đến từ `manifest.json` và `BugListActions.js`.

### Checklist sửa an toàn

- Giữ page này read-only trừ khi có Jira task mới thêm dashboard action.
- Không log bearer token, password, private endpoint, SMTP data, S3 data, hoặc danh sách email private đầy đủ.
- Không hardcode email thật của team.
- Không đưa text nội bộ/dev-facing lên UI.
- Nếu rule group theo role thay đổi, cập nhật business/PM docs vì ý nghĩa dashboard đã thay đổi.

## Symbol walkthrough and breakpoint order / Walkthrough theo symbol và thứ tự breakpoint (2026-07-18)

**English.** Page startup → `loadDashboard()` reads `LoginSession` → two `fetchOData()` calls load `Bugs` and `DeveloperWorkloads` → normalization converts OData values → `buildDashboardModel()` routes to Tester/Developer/PM builders → JSONModel refreshes tiles/lists. `focusList()` limits/deduplicates rows; `openBugList()` and `openBug()` only navigate. Breakpoints: `loadDashboard`, each fetch response, `buildDashboardModel`, then the role builder. Wrong source counts belong in backend read models; correct data but wrong grouping belongs here.

**Tiếng Việt.** Page start → `loadDashboard()` đọc `LoginSession` → hai `fetchOData()` lấy `Bugs` và `DeveloperWorkloads` → normalize chuyển kiểu OData → `buildDashboardModel()` chọn builder Tester/Developer/PM → JSONModel refresh tile/list. `focusList()` giới hạn và loại trùng row; `openBugList()`/`openBug()` chỉ điều hướng. Breakpoint: `loadDashboard` → response từng fetch → `buildDashboardModel` → builder theo role. Count nguồn sai thì debug backend read model; dữ liệu đúng nhưng nhóm sai thì debug file này.
## IDTS-115 — PM-only AI Activity

The dashboard header exposes one PM-only `AI Activity` button. `openAiActivity()` calls the existing `readAiOperationalMetrics(windowDays=30)` function, opens a responsive SAPUI5 dialog/table, and `aggregateAiMetrics()` combines backend rows by capability while hiding provider/model aliases, prompts, responses, and raw diagnostics. The dialog uses `Device.system.phone` with the supported `stretch` property instead of deprecated `stretchOnPhone`. Non-PM direct calls remain protected by CAP and must return 403.

Debug order: Dashboard startup → button visibility → `openAiActivity()` → OData Network response → `aggregateAiMetrics()` → `aiMetrics` model → table binding. Check weighted latency and capability totals for data issues; check the HTTP response and `srv/service.cds`/`srv/ai/metrics.js` for authorization issues. Empty, loading, and generic error states are expected UI states.

Tiếng Việt: Dashboard PM có nút `AI Activity` trong header, không tạo route mới. Hàm gọi metrics 30 ngày, gộp theo capability và không hiển thị provider/model, prompt, response hay raw error. Dialog dùng `Device.system.phone` với thuộc tính `stretch` được hỗ trợ, không dùng `stretchOnPhone` đã deprecated. Backend vẫn kiểm quyền PM. Debug theo thứ tự startup → visibility → handler → Network → aggregate → model → table.

Aggregation note: backend `failureCount` already includes timeout and unavailable outcomes. The UI sums `failureCount` once and must not add `unavailableCount` again, otherwise the business-facing failure total is overstated.

## IDTS-122 — PM status drill-down and semantic AI outcomes

The PM dashboard now reads `readBugStatusMetrics()` instead of counting a capped client-side Bug list. The service always returns the ten current workflow statuses, including zero-count rows, and deliberately excludes legacy `NEW`. Each tile carries the canonical `statusCode` and opens the List Report with a `status_code` hash parameter. The List Report controller extension then applies that value through the public Fiori Elements ExtensionAPI; it does not manipulate table controls or the DOM.

The AI Activity dialog displays explicit semantic outcomes: success, bad request, rate limited, provider 5xx, timeout, unavailable, and other failure. Unknown historical failures remain `other failure`; the UI must never infer a provider HTTP class that was not captured by the adapter.

Debug order: `loadDashboard()` → `readBugStatusMetrics()` Network response → `pmDashboard()` tile model → tile press hash → `ext/listreport/ListReportController.controller.js` → List Report filter bar. For AI metrics, continue through `readAiOperationalMetrics()` and `srv/ai/metrics.js`.
