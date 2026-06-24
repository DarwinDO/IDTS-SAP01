# pm-monitoring.cds — Knowledge Mirror

**Source file**: `app/bug-management-ui/annotations/pm-monitoring.cds`
**Last mirrored**: 2026-06-24
**Related task**: IDTS-22

---

## What this file is for / File này dùng để làm gì

**English**: This file creates the PM monitoring view presets for the main Bug List Report. In Fiori Elements, a `UI.SelectionVariant` is a named saved filter. The app's `manifest.json` points to these variants, and Fiori renders them as selectable PM monitoring views.

**Vietnamese**: File này tạo các preset theo dõi cho PM trên Bug List Report chính. Trong Fiori Elements, `UI.SelectionVariant` có thể hiểu đơn giản là một bộ filter được đặt tên sẵn. File `manifest.json` của app trỏ tới các variant này, rồi Fiori tự render thành các lựa chọn monitoring cho PM.

---

## Beginner explanation / Giải thích cho người mới

**English**: No custom UI5 controller is needed for these tabs. The backend already exposes fields such as `isOverdue` and `isPendingAssignment`. This file tells Fiori: "When the PM chooses Overdue, apply `isOverdue = true`; when the PM chooses Pending Assignment, apply `isPendingAssignment = true`."

The important point is that Fiori does not calculate these values by itself. Fiori only sends an OData `$filter` request to CAP. CAP and the database must be able to answer that filter. PR #17 added `dev:sqlite:refresh-views` because old local SQLite databases may still have an old generated service view without the monitoring columns.

**Vietnamese**: Các tab này không cần custom UI5 controller. Backend đã expose sẵn các field như `isOverdue` và `isPendingAssignment`. File này nói với Fiori rằng: "Khi PM chọn Overdue thì filter `isOverdue = true`; khi PM chọn Pending Assignment thì filter `isPendingAssignment = true`."

Điểm quan trọng là Fiori không tự tính các giá trị này. Fiori chỉ gửi request OData `$filter` xuống CAP. CAP và database phải trả lời được filter đó. PR #17 đã thêm lệnh `dev:sqlite:refresh-views` vì các database SQLite local cũ có thể vẫn giữ service view cũ, chưa có các cột monitoring mới.

---

## Flow in IDTS / Flow hoạt động trong IDTS

**English**:

1. PM opens the Bug List Report.
2. `manifest.json` registers six view paths that point to this file's `UI.SelectionVariant` annotations.
3. PM chooses a view such as `Overdue` or `Rejected Follow-up`.
4. Fiori sends an OData filter request to `BugService.Bugs`.
5. CAP applies the filter using the service fields from `srv/service.cds`.
6. The list refreshes with the matching bugs.

**Vietnamese**:

1. PM mở Bug List Report.
2. `manifest.json` đăng ký sáu view path trỏ tới các annotation `UI.SelectionVariant` trong file này.
3. PM chọn một view như `Overdue` hoặc `Rejected Follow-up`.
4. Fiori gửi request OData có `$filter` tới `BugService.Bugs`.
5. CAP áp dụng filter dựa trên các field service trong `srv/service.cds`.
6. Danh sách bug refresh lại và chỉ hiện các bug phù hợp.

---

## SelectionVariants defined / Các SelectionVariant được định nghĩa

| Variant | User-facing text | Filter meaning |
| --- | --- | --- |
| `#AllBugs` | `All Bugs` | No filter. Shows the normal list. |
| `#PendingAssignment` | `Pending Assignment` | `isPendingAssignment = true`. Shows bugs waiting for developer assignment. |
| `#RejectedFollowUp` | `Rejected Follow-up` | `isRejectedFollowUp = true`. Shows rejected bugs that need follow-up. |
| `#RetestRequired` | `Retest Required` | `isRetestRequired = true`. Shows bugs waiting for retest. |
| `#Overdue` | `Overdue` | `isOverdue = true`. Shows open bugs whose due date is before today. |
| `#MyActionItems` | `PM Action Queue` | `nextProcessorRole_code = 'PM'`. Shows records currently routed to the PM queue. |

Vietnamese:

| Variant | Text hiển thị | Ý nghĩa filter |
| --- | --- | --- |
| `#AllBugs` | `All Bugs` | Không filter. Hiển thị danh sách bình thường. |
| `#PendingAssignment` | `Pending Assignment` | `isPendingAssignment = true`. Hiển thị bug đang chờ assign developer. |
| `#RejectedFollowUp` | `Rejected Follow-up` | `isRejectedFollowUp = true`. Hiển thị bug bị reject và cần xử lý tiếp. |
| `#RetestRequired` | `Retest Required` | `isRetestRequired = true`. Hiển thị bug đang chờ retest. |
| `#Overdue` | `Overdue` | `isOverdue = true`. Hiển thị bug còn mở nhưng đã quá hạn. |
| `#MyActionItems` | `PM Action Queue` | `nextProcessorRole_code = 'PM'`. Hiển thị các record đang được route tới queue của PM. |

---

## Important source anchors / Các điểm code quan trọng

### Anchor 1 — Monitoring flags used by the tabs

- **Location**: `UI.SelectionVariant #PendingAssignment`, `#RejectedFollowUp`, `#RetestRequired`, `#Overdue`
- **IDTS concept**: PM monitoring slices for assignment, rejected follow-up, retest, and overdue work.
- **Impact if broken**: PM sees the wrong monitoring list or the browser gets an OData filter error.
- **Must check together**: `srv/service.cds` computed fields, `scripts/qa/test-pm-monitoring-http.js`, and local SQLite view refresh with `npm run dev:sqlite:refresh-views`.

Vietnamese:

- **Vị trí**: `UI.SelectionVariant #PendingAssignment`, `#RejectedFollowUp`, `#RetestRequired`, `#Overdue`
- **Khái niệm IDTS**: Các lát cắt monitoring cho PM: chờ assign, rejected cần follow-up, cần retest, và quá hạn.
- **Ảnh hưởng nếu sai**: PM sẽ thấy sai danh sách monitoring hoặc browser gặp lỗi OData filter.
- **Phải kiểm tra cùng**: Các computed field trong `srv/service.cds`, script `scripts/qa/test-pm-monitoring-http.js`, và việc refresh SQLite local bằng `npm run dev:sqlite:refresh-views`.

### Anchor 2 — `PM Action Queue`

- **Location**: `UI.SelectionVariant #MyActionItems`
- **IDTS concept**: PM queue ownership through `nextProcessorRole_code`.
- **Impact if broken**: A tab labeled like personal action items may show unrelated bugs, which is misleading during review.
- **Must check together**: `db/data/idts.cap-ProcessorRoleValues.csv`, `db/data/idts.cap-Bugs.csv`, and current action owner wording in `app/bug-management-ui/annotations/ownership-assignment.cds`.

Vietnamese:

- **Vị trí**: `UI.SelectionVariant #MyActionItems`
- **Khái niệm IDTS**: Queue xử lý của PM thông qua `nextProcessorRole_code`.
- **Ảnh hưởng nếu sai**: Một tab có tên giống việc cá nhân nhưng lại hiển thị bug không liên quan sẽ gây hiểu nhầm khi review.
- **Phải kiểm tra cùng**: `db/data/idts.cap-ProcessorRoleValues.csv`, `db/data/idts.cap-Bugs.csv`, và wording current action owner trong `app/bug-management-ui/annotations/ownership-assignment.cds`.

### Anchor 3 — Local SQLite refresh requirement

- **Location**: Header comment in this file.
- **IDTS concept**: CAP service view synchronization for local development.
- **Impact if broken**: The source code can be correct while an old local `db.sqlite` still fails with `no such column`.
- **Must check together**: `scripts/dev/refresh-sqlite-service-views.js`, `package.json` script `dev:sqlite:refresh-views`, and browser UAT setup notes.

Vietnamese:

- **Vị trí**: Comment đầu file.
- **Khái niệm IDTS**: Đồng bộ service view CAP cho môi trường local.
- **Ảnh hưởng nếu sai**: Source code có thể đúng nhưng `db.sqlite` local cũ vẫn lỗi `no such column`.
- **Phải kiểm tra cùng**: `scripts/dev/refresh-sqlite-service-views.js`, script `dev:sqlite:refresh-views` trong `package.json`, và note setup browser UAT.

---

## Cross-folder impact / Liên kết với file khác

**English**:

- `srv/service.cds`: Defines the service fields consumed by the tabs, including `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, and `isRetestRequired`.
- `app/bug-management-ui/webapp/manifest.json`: Registers each SelectionVariant as a view path in the List Report.
- `app/bug-management-ui/annotations.cds`: Imports this annotation file into the app annotation bundle.
- `app/bug-management-ui/annotations/labels.cds`: Provides labels and filter visibility for monitoring fields.
- `scripts/qa/test-pm-monitoring-http.js`: Verifies that OData `$filter` works through the real HTTP path.
- `scripts/dev/refresh-sqlite-service-views.js`: Repairs stale local SQLite generated service views.

**Vietnamese**:

- `srv/service.cds`: Định nghĩa các field service mà tab sử dụng, gồm `isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, và `isRetestRequired`.
- `app/bug-management-ui/webapp/manifest.json`: Đăng ký từng SelectionVariant thành view path trong List Report.
- `app/bug-management-ui/annotations.cds`: Import file annotation này vào bundle annotation của app.
- `app/bug-management-ui/annotations/labels.cds`: Cung cấp label và trạng thái hiển thị filter cho các field monitoring.
- `scripts/qa/test-pm-monitoring-http.js`: Verify OData `$filter` qua đúng đường HTTP runtime.
- `scripts/dev/refresh-sqlite-service-views.js`: Sửa các service view SQLite local đã cũ.

---

## Safe editing checklist / Checklist sửa an toàn

**English**:

- Do not rename qualifiers unless `manifest.json` is updated at the same time.
- If a tab name says `Overdue`, filter by `isOverdue`, not just `status_code != 'CLOSED'`.
- Do not call a tab `My Action Items` unless it really filters to the current runtime user.
- After changing this file, run CAP compile and the PM monitoring HTTP regression.
- If browser UAT uses persistent local SQLite, run `npm run dev:sqlite:refresh-views` before retesting.

**Vietnamese**:

- Không đổi tên qualifier nếu chưa cập nhật `manifest.json` cùng lúc.
- Nếu tab tên là `Overdue`, phải filter theo `isOverdue`, không chỉ filter `status_code != 'CLOSED'`.
- Không gọi tab là `My Action Items` nếu nó chưa thật sự filter theo user runtime hiện tại.
- Sau khi sửa file này, chạy CAP compile và regression HTTP cho PM monitoring.
- Nếu browser UAT dùng SQLite local persistent, chạy `npm run dev:sqlite:refresh-views` trước khi retest.
