# Knowledge: `db/data/idts.cap-Bugs.csv`

## English

### What this file is for

Demo / sample bug data. These rows are loaded into the `Bugs` table for local development and demonstrations.

They are designed to showcase different IDTS states and flows:
- Pending Assignment cases
- Assigned + In Progress
- Rejected with clear follow-up owner and reason
- etc.

### IDTS flow and business meaning

These records are not just random data. They are crafted to exercise:
- ComponentCategory-based assignment (or lack of it → PENDING_ASSIGNMENT)
- Rejection flow with `rejectionReason` and `nextProcessor`
- Different priority/severity combinations
- Planned dates for overdue detection

They help testers and developers see realistic data when running the app locally or doing demos.

### Columns explained (selected important ones)

- `bugNumber`: Human readable ID (BUG-0001, ...).
- `status_code`, `priority_code`, `severity_code`: Direct references to the code list seeds.
- `componentCategory_ID`: The assignment key.
- `assignee_ID` / `nextProcessorUser_ID` / `nextProcessorRole_code`: Ownership fields.
- `rejectionReason`: Only populated on rejected bugs (mandatory in business rule).
- `dueDate`, `estimatedEffortHours`: Used for PM monitoring and overdue flags.

### Impact if data is wrong or missing

- Wrong componentCategory or status codes → demo flows (assignment, rejection, PM views) break or look unrealistic.
- Missing rejectionReason on REJECTED rows → violates the rule that Rejected is not final.
- Bad dates → isOverdue calculations fail in monitoring.

### Cross-folder dependency map

- **db/schema.cds**: Directly populates the `Bugs` entity and all its associations.
- **db/data/** other CSVs: All foreign keys (status, priority, componentCategory, developer, user, etc.) must exist in the corresponding seeds.
- **srv/service.cds**: The virtual fields (`isOverdue`, `isPendingAssignment`, `isRejectedFollowUp`, display names, canXXX capabilities) are calculated on top of this data.
- **srv/bug-service/**: Handlers, read-models, and monitoring use this data for realistic behavior.
- **app/bug-management-ui/**: List Report and Object Page are populated from these rows during demo.

### Safe editing checklist

- When editing a demo bug, make sure all referenced codes/IDs still exist in the other seed CSVs.
- Keep at least one PENDING_ASSIGNMENT, one REJECTED with nextProcessor + reason, and one with dueDate in the past (for overdue testing).
- After changes, reload the app (`cds watch` or redeploy) and verify the List Report filters + Object Page actions behave as expected for that state.

## Vietnamese

### File này dùng để làm gì

Dữ liệu bug mẫu / demo. Các dòng này được nạp vào bảng `Bugs` để dùng khi phát triển local và trình diễn.

Chúng được thiết kế để thể hiện nhiều trạng thái và flow khác nhau của IDTS.

### Flow nghiệp vụ IDTS và ý nghĩa

Không phải dữ liệu ngẫu nhiên. Chúng được tạo để minh họa:
- Trường hợp Pending Assignment (chưa có developer phù hợp)
- Bug đã assign và đang làm
- Bug bị Rejected có lý do rõ ràng và nextProcessor
- Các mức priority/severity khác nhau
- Ngày đến hạn để test overdue

Giúp người mới và demo thấy dữ liệu thực tế khi chạy app.

### Giải thích các cột quan trọng

- `bugNumber`: Mã dễ đọc (BUG-0001...).
- `status_code`, `priority_code`, `severity_code`: Tham chiếu đến code list.
- `componentCategory_ID`: Khóa phân công.
- `assignee_ID` / `nextProcessorUser_ID` / `nextProcessorRole_code`: Các trường ownership.
- `rejectionReason`: Chỉ có ở bug REJECTED (bắt buộc theo rule).
- `dueDate`, `estimatedEffortHours`: Dùng cho PM monitoring và cờ quá hạn.

### Ảnh hưởng nếu dữ liệu sai hoặc thiếu

- Sai componentCategory hoặc status code → các flow demo (phân công, reject, PM) bị hỏng hoặc không thực tế.
- Bug REJECTED thiếu rejectionReason → vi phạm quy tắc "Rejected không phải trạng thái cuối".
- Ngày sai → tính isOverdue trong monitoring sai.

### Liên kết với file/folder khác

- **db/schema.cds**: Nạp trực tiếp vào entity `Bugs` và tất cả association.
- **db/data/** các file CSV khác: Tất cả khóa ngoại phải tồn tại ở seed tương ứng.
- **srv/service.cds**: Các virtual field (isOverdue, isPendingAssignment, isRejectedFollowUp, tên hiển thị, canXXX) được tính trên dữ liệu này.
- **srv/bug-service/**: Handler, read-model, monitoring dùng dữ liệu này để có hành vi thực tế.
- **app/bug-management-ui/**: List Report và Object Page được đổ từ các dòng này khi demo.

### Khi sửa file này cần chú ý

- Khi sửa bug demo, đảm bảo tất cả code/ID tham chiếu vẫn tồn tại trong các CSV seed khác.
- Giữ ít nhất: một PENDING_ASSIGNMENT, một REJECTED có nextProcessor + lý do, và một bug có dueDate trong quá khứ (để test overdue).
- Sau khi sửa, reload app và kiểm tra filter List Report + action Object Page hoạt động đúng với trạng thái đó.

## Metadata

- Source file: `db/data/idts.cap-Bugs.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-Bugs.csv.md`
- Source layer: `db/data`
- Documentation style: learning-oriented + IDTS domain impact
- Last reviewed: 2026-06-22