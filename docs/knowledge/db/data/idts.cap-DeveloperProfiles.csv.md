# Knowledge: `db/data/idts.cap-DeveloperProfiles.csv`

## English

### What this file is for

`Users` says who a person is. `DeveloperProfiles` says whether that User participates in technical assignment and adds availability plus workload capacity. The separate IDs are intentional: `Users.ID` and `DeveloperProfiles.ID` are not interchangeable.

IDTS-90 adds ten profiles with `AVAILABLE`, `BUSY` and `UNAVAILABLE` examples and varied workload limits. This gives Smart Assign and PM monitoring realistic states to explain.

### Request/data flow

`Users.csv` → this profile through `user_ID` → `DeveloperResponsibilities.csv` through `developerProfile_ID` → `srv/bug-service/read-models.js` → `BugService.AssignableDevelopers` / `DeveloperWorkloads` → Fiori UI.

The unfiltered Smart Assign read model may still show an unavailable active developer so the UI can explain the warning. Availability is information for the user; backend responsibility and permission validation remain authoritative.

### Column walkthrough

- `ID`: DeveloperProfile UUID; this is the value stored in `Bugs.assignee_ID`.
- `user_ID`: foreign key to `Users.ID`; permissions later map the profile back to its User.
- `availabilityStatus_code`: `AVAILABLE`, `BUSY` or `UNAVAILABLE`.
- `workloadLimit`: planning capacity used by workload/suitability calculations; it is not a hard automatic assignment rule.
- `active`: inactive profiles are excluded from normal assignment reads.

### Cross-folder links

- `db/schema.cds`, entity `DeveloperProfiles`: model and associations.
- `srv/bug-service/read-models.js`, `buildAssignableDeveloperRows`: reads profile, user, availability and workload.
- `srv/bug-service/monitoring.js`: calculates DeveloperWorkloads.
- `srv/bug-service/helpers.js`, `userIDForDeveloper`: maps a profile ID back to User ID.
- Fiori Smart Assign and dashboard files consume the read models, not this CSV directly.

### Safe editing checklist

- Confirm each `user_ID` exists and has role `DEVELOPER`.
- Keep profile IDs stable because Bugs and responsibilities reference them.
- Do not confuse availability with authorization.
- Give each new profile matching responsibility rows.
- Run the IDTS-90 test and existing developer-workload regression.

## Vietnamese

### File này dùng để làm gì

`Users` cho biết một người là ai. `DeveloperProfiles` cho biết User đó có tham gia phân công kỹ thuật hay không, đồng thời bổ sung availability và giới hạn workload. Việc dùng hai ID khác nhau là có chủ ý: `Users.ID` và `DeveloperProfiles.ID` không thể dùng thay cho nhau.

IDTS-90 thêm mười profile có các ví dụ `AVAILABLE`, `BUSY`, `UNAVAILABLE` và workload limit khác nhau. Nhờ vậy Smart Assign và PM monitoring có dữ liệu thực tế hơn để giải thích khi demo.

### Luồng request/dữ liệu

`Users.csv` → profile này qua `user_ID` → `DeveloperResponsibilities.csv` qua `developerProfile_ID` → `srv/bug-service/read-models.js` → `BugService.AssignableDevelopers` / `DeveloperWorkloads` → giao diện Fiori.

Read model Smart Assign không filter có thể vẫn hiển thị một Developer active nhưng unavailable để UI giải thích cảnh báo. Availability là thông tin hỗ trợ người chọn; validation responsibility và permission ở backend vẫn là lớp quyết định cuối.

### Giải thích từng cột

- `ID`: UUID của DeveloperProfile; đây là giá trị lưu trong `Bugs.assignee_ID`.
- `user_ID`: khóa ngoại tới `Users.ID`; permission sẽ map profile này ngược về User.
- `availabilityStatus_code`: `AVAILABLE`, `BUSY` hoặc `UNAVAILABLE`.
- `workloadLimit`: năng lực kế hoạch dùng cho workload/suitability; không phải luật tự động assign cứng.
- `active`: profile inactive bị loại khỏi luồng phân công bình thường.

### Liên kết với file ở folder khác

- `db/schema.cds`, entity `DeveloperProfiles`: model và association.
- `srv/bug-service/read-models.js`, `buildAssignableDeveloperRows`: đọc profile, user, availability và workload.
- `srv/bug-service/monitoring.js`: tính DeveloperWorkloads.
- `srv/bug-service/helpers.js`, `userIDForDeveloper`: map profile ID về User ID.
- Smart Assign và dashboard Fiori đọc read model, không đọc CSV trực tiếp.

### Checklist sửa an toàn

- Xác nhận mỗi `user_ID` tồn tại và có role `DEVELOPER`.
- Giữ profile ID ổn định vì Bugs và responsibilities đang tham chiếu.
- Không nhầm availability với authorization.
- Mỗi profile mới phải có responsibility tương ứng.
- Chạy test IDTS-90 và regression developer workload hiện có.

## Metadata

- Source: `db/data/idts.cap-DeveloperProfiles.csv`
- Rows after IDTS-90: 12
- Last reviewed: 2026-07-23
