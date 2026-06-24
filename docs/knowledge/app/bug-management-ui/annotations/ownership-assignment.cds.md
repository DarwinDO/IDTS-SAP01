# Knowledge: `app/bug-management-ui/annotations/ownership-assignment.cds`

## English

### What this file is for

This file teaches Fiori Elements how to display ownership and assignment information on the Bug Object Page.

The backend exposes technical fields such as `assignee_ID`, `assigneeDisplayName`, `currentActionOwnerDisplayName`, and `nextProcessorRoleName`. This annotation file turns those fields into a form that users can understand:

- `Assignee (Technical Owner)` is the developer responsible for the technical work.
- `Current Action Owner` is the person or queue expected to act next.
- `Action Owner Role` explains whether that next action belongs to a Developer, Tester, PM, or another supported queue.

These concepts must remain separate. The assignee can stay the same while the current action owner changes during Request More Information, Retest, Rejection follow-up, or Pending Assignment.

### Beginner explanation

CAP sends data through OData, but OData does not decide where a field appears on the screen or which label users see. Fiori Elements reads the annotations in this file and builds the Assignment form automatically.

There are two display modes:

1. In edit mode, Fiori uses `assignee_ID`. The value help attached elsewhere lets the user select a developer.
2. In display mode, Fiori uses `assigneeDisplayName` so the user sees a readable name instead of a UUID.

`currentActionOwnerDisplayName` and `nextProcessorRoleName` are read-only because CAP derives them from the current workflow state. A user should not type arbitrary values into those fields.

### Flow inside IDTS

Example:

1. A Tester assigns a bug to SangVN.
2. `Assignee (Technical Owner)` shows SangVN.
3. While SangVN is working, `Current Action Owner` also shows SangVN.
4. SangVN requests more information.
5. The assignee remains SangVN, but `Current Action Owner` changes to the Tester because the Tester must provide information.

This file makes that distinction visible without changing the underlying CAP workflow.

### Important source anchors

#### Assignment field group

- **Location:** `UI.FieldGroup #Assignment`
- **IDTS concept:** Shows the technical owner, current action owner, and action-owner role in the Classification and Assignment section.
- **Impact if broken:** Users may confuse the developer who owns the fix with the person who must act now.
- **Must check together:** `app/bug-management-ui/annotations/object-page.cds`, `app/bug-management-ui/annotations/labels.cds`, `srv/service.cds`, and `srv/bug-service/read-models.js`.

#### Active and draft visibility

- **Location:** `@UI.Hidden` expressions on `assignee_ID` and `assigneeDisplayName`
- **IDTS concept:** Edit mode shows the selectable assignee field; display mode shows the readable developer name.
- **Impact if broken:** The Object Page may show both fields, hide both fields, or expose a UUID to users.
- **Must check together:** `app/bug-management-ui/annotations/value-helps.cds` and the draft fields `IsActiveEntity` / `HasActiveEntity`.

#### Rejected follow-up field group

- **Location:** `UI.FieldGroup #RejectedFollowUp`
- **IDTS concept:** Shows the rejection reason and who must handle the rejected bug next.
- **Impact if broken:** A rejected bug can appear to have no owner or follow-up path.
- **Must check together:** `srv/bug-service/actions.js`, `srv/bug-service/bug-write.js`, and the Rejected facet visibility in `object-page.cds`.

### Cross-folder dependency map

- `srv/service.cds` exposes the fields used here through `BugService.Bugs`.
- `srv/bug-service/read-models.js` derives readable ownership values for OData responses.
- `srv/bug-service/actions.js` and `bug-write.js` update ownership when status or assignment changes.
- `db/schema.cds` stores the assignee and next-processor relationships.
- `app/bug-management-ui/annotations/object-page.cds` places `#Assignment` and `#RejectedFollowUp` on the Object Page.
- `app/bug-management-ui/annotations/value-helps.cds` controls developer selection for `assignee_ID`.
- `app/bug-management-ui/annotations/labels.cds` keeps the same ownership wording in other Fiori surfaces.

### Safe editing checklist

- Keep `Assignee (Technical Owner)` and `Current Action Owner` as different concepts.
- Do not add another Ownership section if the same summary is already visible in the Object Page header.
- Keep derived ownership fields read-only.
- Test both active display mode and draft edit/create mode.
- Verify Pending Assignment, Need More Information, Rejected, Retest Required, and Closed states.
- Update this knowledge note when field meaning, visibility, wording, or workflow dependency changes.

## Vietnamese

### File này dùng để làm gì

File này hướng dẫn Fiori Elements cách hiển thị thông tin phân công và ownership trên trang chi tiết Bug.

Backend cung cấp các field kỹ thuật như `assignee_ID`, `assigneeDisplayName`, `currentActionOwnerDisplayName` và `nextProcessorRoleName`. File annotation này biến chúng thành thông tin dễ hiểu trên giao diện:

- `Assignee (Technical Owner)` là Developer chịu trách nhiệm kỹ thuật cho bug.
- `Current Action Owner` là người hoặc hàng đợi phải thực hiện hành động tiếp theo.
- `Action Owner Role` cho biết hành động tiếp theo thuộc về Developer, Tester, PM hay một queue được hỗ trợ khác.

Ba thông tin này không được hiểu là một. Assignee có thể không đổi, nhưng Current Action Owner vẫn thay đổi khi bug chuyển sang Request More Information, Retest, Rejected follow-up hoặc Pending Assignment.

### Giải thích cho người mới

CAP gửi dữ liệu qua OData, nhưng OData không tự quyết định field nằm ở đâu trên màn hình hoặc label nào sẽ hiển thị. Fiori Elements đọc annotation trong file này rồi tự tạo form Assignment.

Có hai chế độ hiển thị:

1. Khi chỉnh sửa, Fiori dùng `assignee_ID`. Value help được định nghĩa ở file khác cho phép người dùng chọn Developer.
2. Khi chỉ xem, Fiori dùng `assigneeDisplayName` để hiển thị tên dễ đọc thay vì UUID.

`currentActionOwnerDisplayName` và `nextProcessorRoleName` là field chỉ đọc vì CAP tự tính chúng dựa trên trạng thái workflow. Người dùng không nên tự nhập tùy ý vào các field này.

### Flow trong IDTS

Ví dụ:

1. Tester assign bug cho SangVN.
2. `Assignee (Technical Owner)` hiển thị SangVN.
3. Khi SangVN đang xử lý, `Current Action Owner` cũng là SangVN.
4. SangVN yêu cầu thêm thông tin.
5. Assignee vẫn là SangVN, nhưng `Current Action Owner` chuyển sang Tester vì Tester phải bổ sung thông tin.

File này giúp giao diện thể hiện rõ sự khác nhau đó mà không thay đổi workflow CAP bên dưới.

### Các điểm neo quan trọng trong source

#### Field group Assignment

- **Vị trí:** `UI.FieldGroup #Assignment`
- **Khái niệm IDTS:** Hiển thị technical owner, current action owner và role của người phải hành động trong section Classification and Assignment.
- **Ảnh hưởng nếu sai:** Người dùng có thể nhầm Developer chịu trách nhiệm fix với người đang phải xử lý bước tiếp theo.
- **Phải kiểm tra cùng:** `app/bug-management-ui/annotations/object-page.cds`, `app/bug-management-ui/annotations/labels.cds`, `srv/service.cds` và `srv/bug-service/read-models.js`.

#### Điều kiện hiển thị active và draft

- **Vị trí:** Các biểu thức `@UI.Hidden` trên `assignee_ID` và `assigneeDisplayName`
- **Khái niệm IDTS:** Chế độ edit hiển thị field chọn assignee; chế độ xem hiển thị tên Developer dễ đọc.
- **Ảnh hưởng nếu sai:** Object Page có thể hiện cả hai field, ẩn cả hai field hoặc để lộ UUID cho người dùng.
- **Phải kiểm tra cùng:** `app/bug-management-ui/annotations/value-helps.cds` và các field draft `IsActiveEntity` / `HasActiveEntity`.

#### Field group Rejected Follow-up

- **Vị trí:** `UI.FieldGroup #RejectedFollowUp`
- **Khái niệm IDTS:** Hiển thị lý do reject và người phải xử lý bug bị reject tiếp theo.
- **Ảnh hưởng nếu sai:** Bug bị reject có thể trông như không còn owner hoặc không có hướng follow-up.
- **Phải kiểm tra cùng:** `srv/bug-service/actions.js`, `srv/bug-service/bug-write.js` và điều kiện hiển thị facet Rejected trong `object-page.cds`.

### Liên kết với file/folder khác

- `srv/service.cds` expose các field được dùng ở đây thông qua `BugService.Bugs`.
- `srv/bug-service/read-models.js` tính các giá trị ownership dễ đọc cho OData response.
- `srv/bug-service/actions.js` và `bug-write.js` cập nhật ownership khi status hoặc assignment thay đổi.
- `db/schema.cds` lưu quan hệ assignee và next processor.
- `app/bug-management-ui/annotations/object-page.cds` đặt `#Assignment` và `#RejectedFollowUp` lên Object Page.
- `app/bug-management-ui/annotations/value-helps.cds` điều khiển việc chọn Developer cho `assignee_ID`.
- `app/bug-management-ui/annotations/labels.cds` giữ wording ownership đồng nhất ở các màn hình Fiori khác.

### Checklist sửa an toàn

- Luôn giữ `Assignee (Technical Owner)` và `Current Action Owner` là hai khái niệm khác nhau.
- Không thêm một section Ownership khác nếu cùng thông tin đã xuất hiện ở header Object Page.
- Giữ các field ownership được backend tính toán ở trạng thái chỉ đọc.
- Test cả active display mode và draft edit/create mode.
- Kiểm tra các trạng thái Pending Assignment, Need More Information, Rejected, Retest Required và Closed.
- Cập nhật knowledge note này khi ý nghĩa field, điều kiện hiển thị, wording hoặc dependency workflow thay đổi.

## Metadata

- Source file: `app/bug-management-ui/annotations/ownership-assignment.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations/ownership-assignment.cds.md`
- Source layer: `app`
- Last reviewed: 2026-06-24
