# pm-monitoring.cds — Knowledge Mirror

**Source file**: `app/bug-management-ui/annotations/pm-monitoring.cds`
**Last mirrored**: 2026-06-24
**Related task**: IDTS-22

---

## Purpose / Mục đích

**English**: Provides six `@UI.SelectionVariant` presets so PM users can switch between key monitoring slices from the Fiori Elements List Report without any custom UI5 module.

**Vietnamese**: Cung cấp 6 preset `@UI.SelectionVariant` để PM có thể chuyển đổi giữa các góc nhìn theo dõi quan trọng trên List Report của Fiori Elements mà không cần viết module UI5 tùy chỉnh nào.

---

## Why status_code, not computed flags? / Tại sao dùng status_code thay vì computed flags?

**English**: `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired` are CDS **computed expressions** evaluated in-memory by the CAP runtime when reading data. They do not exist as physical columns in SQLite. When Fiori sends an OData `$filter=isOverdue eq true` request, CAP tries to translate it into SQL `WHERE isOverdue = true`, which fails with `no such column: $B.isOverdue`. The fix is to use the **underlying persistent columns** (`status_code`, `dueDate`) which replicate the same business logic but are actual DB columns.

**Vietnamese**: `isOverdue`, `isPendingAssignment`, v.v. là **computed expression** trong CDS — CAP tính toán chúng trong bộ nhớ khi đọc dữ liệu. Chúng **không tồn tại** như cột vật lý trong SQLite. Khi Fiori gửi `$filter=isOverdue eq true`, CAP cố dịch thành SQL `WHERE isOverdue = true` và lỗi với `no such column: $B.isOverdue`. Cách sửa là dùng **cột vật lý** (`status_code`, `dueDate`) để tái hiện cùng logic nghiệp vụ.

---

## SelectionVariants defined / Các SelectionVariant đã định nghĩa

| Qualifier | Text | Filter (persistent column) | Tab key in manifest |
|---|---|---|---|
| `#AllBugs` | All Bugs | (không filter) | `_tab_AllBugs` |
| `#PendingAssignment` | Pending Assignment | `status_code = 'PENDING_ASSIGNMENT'` | `_tab_PendingAssignment` |
| `#RejectedFollowUp` | Rejected Follow-up | `status_code = 'REJECTED'` | `_tab_RejectedFollowUp` |
| `#RetestRequired` | Retest Required | `status_code = 'RETEST_REQUIRED'` | `_tab_RetestRequired` |
| `#Overdue` | Overdue | `status_code ≠ 'CLOSED'` (+ PM dùng dueDate filter bar) | `_tab_Overdue` |
| `#MyActionItems` | My Action Items | `status_code ≠ 'CLOSED'` — PM tự filter theo Current Action Owner | `_tab_MyActionItems` |

> **Note / Lưu ý**: Tab Overdue và My Action Items đều dùng `status_code ≠ 'CLOSED'` làm base. PM có thể thêm filter `Due Date` trên filter bar và lưu thành personal variant để xem đúng các bug overdue cá nhân.

---

## Design decisions / Quyết định thiết kế

**English**:
- Uses `@UI.SelectionVariant` (not `@UI.SelectionPresentationVariant`) because no custom sort or column layout per tab is needed.
- `My Action Items` uses `status_code ≠ 'CLOSED'` — a fully automatic "me" filter (inject `nextProcessorUser_ID = currentUser`) requires a UI5 ControllerExtension, deferred per the IDTS lightweight FE strategy.
- Boolean `@UI.HiddenFilter : false` flags are set in `labels.cds` (not here) to avoid duplicate annotation blocks.
- Tabs are registered in `manifest.json` under `BugsList.settings.views.paths`.

**Vietnamese**:
- Dùng `@UI.SelectionVariant` (không dùng `@UI.SelectionPresentationVariant`) vì không cần cấu hình sort hay layout cột riêng cho từng tab.
- `My Action Items` dùng `status_code ≠ 'CLOSED'` — filter tự động theo user đăng nhập cần UI5 ControllerExtension, hoãn lại theo chiến lược lightweight FE của IDTS.
- Annotation `@UI.HiddenFilter : false` cho 4 boolean flag được đặt trong `labels.cds` để tránh block annotation trùng.
- Các tab được đăng ký trong `manifest.json` tại `BugsList.settings.views.paths`.

---

## How tabs are rendered / Cách các tab được render

**English**: With 6 paths in `views.paths`, Fiori Elements V4 automatically renders a **Select control** (dropdown) rather than a segmented button (used when ≤ 3 tabs).

**Vietnamese**: Với 6 path trong `views.paths`, Fiori Elements V4 tự động render **Select control** (dropdown) thay vì segmented button (dùng khi có ≤ 3 tab).

```json
"views": {
  "showCounts": true,
  "paths": [
    { "key": "_tab_AllBugs",           "annotationPath": "...SelectionVariant#AllBugs" },
    { "key": "_tab_PendingAssignment", "annotationPath": "...SelectionVariant#PendingAssignment" },
    { "key": "_tab_RejectedFollowUp",  "annotationPath": "...SelectionVariant#RejectedFollowUp" },
    { "key": "_tab_RetestRequired",    "annotationPath": "...SelectionVariant#RetestRequired" },
    { "key": "_tab_Overdue",           "annotationPath": "...SelectionVariant#Overdue" },
    { "key": "_tab_MyActionItems",     "annotationPath": "...SelectionVariant#MyActionItems" }
  ]
}
```

---

## Cross-references / Tham chiếu chéo

- `labels.cds` — `@UI.HiddenFilter : false` cho `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, `isRetestRequired`
- `manifest.json` — `views.paths` + `initialLoad: "Enabled"`
- `annotations.cds` — hub import `using from './annotations/pm-monitoring'`
- `srv/service.cds` — computed boolean fields on `BugService.Bugs` (in-memory only, not filterable via OData)

---

## Known limitation / Giới hạn đã biết

**English**: `My Action Items` and `Overdue` tabs do not auto-filter to the current user or today's date. The PM must manually add filters in the filter bar and save as a personal Page variant. A future UI5 ControllerExtension could inject these values automatically at page load.

**Vietnamese**: Tab `My Action Items` và `Overdue` không tự động filter theo user hiện tại hay ngày hôm nay. PM phải tự thêm filter trên thanh filter và lưu thành personal Page variant. Một UI5 ControllerExtension trong tương lai có thể inject các giá trị này tự động khi tải trang.
