# Knowledge: `db/data/idts.cap-DeveloperResponsibilities.csv`

## English

### What this file is for

Seed data for `DeveloperResponsibilities`. This table defines **which developers are responsible for which ComponentCategories** (and optionally scoped by SAP Module).

This is the core data used to calculate the list of "Assignable Developers" when a tester wants to assign a bug.

### IDTS flow and business meaning

- A developer can be marked as `PRIMARY` or `BACKUP` for a ComponentCategory.
- When creating/assigning a bug, the system queries DeveloperResponsibilities filtered by the bug's `componentCategory_ID` (and sapModule_ID if present).
- Only developers with matching active responsibilities appear in the Assign value help.
- This implements the "Developer Responsibility" concept for fair and correct assignment.

### Columns explained

- `ID`: UUID.
- `developerProfile_ID`: Link to DeveloperProfiles.
- `componentCategory_ID`: The assignment key (from ComponentCategories).
- `sapModule_ID`: Optional scope (null = responsible for all modules in that category).
- `responsibilityLevel_code`: PRIMARY or BACKUP.
- `active`: Whether this responsibility is currently valid.

### Impact if data is wrong or missing

- No responsibilities for a ComponentCategory → no one appears in the assignee value help; bugs stay in Pending Assignment.
- Wrong links → unsuitable developers are suggested or correct ones are hidden.
- Missing PRIMARY entries → demo assignment flows break.

### Cross-folder dependency map

- **db/schema.cds**: Entity `DeveloperResponsibilities` + associations to DeveloperProfiles and ComponentCategories.
- **srv/service.cds**: Projection + `AssignableDevelopers` read model and `ValidDefectCategories`.
- **srv/bug-service/read-models.js**: `readAssignableDevelopers` logic filters exactly on this data.
- **srv/bug-service/bug-write.js**: Validation during assignment.
- **app/bug-management-ui/annotations/ownership-assignment.cds** and **value-helps.cds**: Display of assignee and filtered value help.
- **db/data/idts.cap-DeveloperProfiles.csv** and **ComponentCategories.csv**: Foreign keys must be valid.
- **db/data/idts.cap-Bugs.csv**: Demo bugs have assignee linked to these responsibilities.

### Safe editing checklist

- Keep foreign keys consistent with other seed files.
- When changing responsibilities for demo, also check that the linked bugs and developers still make sense.
- Changes directly affect the "Assign Developer" experience in Fiori.
- After edit, test the assignee value help in create and edit flows.

## Vietnamese

### File này dùng để làm gì

Dữ liệu seed cho `DeveloperResponsibilities`. Bảng này định nghĩa **developer nào chịu trách nhiệm cho ComponentCategory nào** (và có thể giới hạn theo SAP Module).

Đây là dữ liệu cốt lõi để tính danh sách "Assignable Developers" khi tester muốn gán bug.

### Flow nghiệp vụ IDTS

- Một developer có thể là `PRIMARY` hoặc `BACKUP` cho một ComponentCategory.
- Khi tạo/gán bug, hệ thống query DeveloperResponsibilities theo `componentCategory_ID` của bug (và sapModule_ID nếu có).
- Chỉ developer có responsibility phù hợp mới xuất hiện trong value help Assign.
- Đây là hiện thực hóa khái niệm "Developer Responsibility" để phân công đúng và công bằng.

### Giải thích các cột

- `ID`: UUID.
- `developerProfile_ID`: Liên kết đến DeveloperProfiles.
- `componentCategory_ID`: Khóa phân công (từ ComponentCategories).
- `sapModule_ID`: Phạm vi tùy chọn (null = chịu trách nhiệm tất cả module trong category đó).
- `responsibilityLevel_code`: PRIMARY hoặc BACKUP.
- `active`: Responsibility này còn hiệu lực không.

### Ảnh hưởng nếu dữ liệu sai hoặc thiếu

- Không có responsibility cho một ComponentCategory → không ai xuất hiện trong value help assignee; bug kẹt Pending Assignment.
- Liên kết sai → gợi ý developer không phù hợp hoặc giấu developer đúng.
- Thiếu entry PRIMARY → các flow demo assignment hỏng.

### Liên kết với file/folder khác

- **db/schema.cds**: Entity `DeveloperResponsibilities` + association đến DeveloperProfiles và ComponentCategories.
- **srv/service.cds**: Projection + read model `AssignableDevelopers` và `ValidDefectCategories`.
- **srv/bug-service/read-models.js**: Logic `readAssignableDevelopers` lọc chính xác trên dữ liệu này.
- **srv/bug-service/bug-write.js**: Kiểm tra khi gán.
- **app/bug-management-ui/annotations/ownership-assignment.cds** và **value-helps.cds**: Hiển thị assignee và value help đã lọc.
- **db/data/idts.cap-DeveloperProfiles.csv** và **ComponentCategories.csv**: Khóa ngoại phải hợp lệ.
- **db/data/idts.cap-Bugs.csv**: Bug demo có assignee liên kết với các responsibility này.

### Khi sửa file này cần chú ý

- Giữ khóa ngoại nhất quán với các file seed khác.
- Khi thay đổi responsibility cho demo, kiểm tra bug và developer liên kết vẫn hợp lý.
- Thay đổi ảnh hưởng trực tiếp trải nghiệm "Assign Developer" trên Fiori.
- Sau sửa, test value help assignee ở luồng create và edit.

## Metadata

- Source file: `db/data/idts.cap-DeveloperResponsibilities.csv`
- Knowledge mirror: `docs/knowledge/db/data/idts.cap-DeveloperResponsibilities.csv.md`
- Source layer: `db/data`
- Documentation style: learning-oriented + IDTS domain impact
- Last reviewed: 2026-06-22