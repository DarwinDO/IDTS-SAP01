# Knowledge: `db/data/idts.cap-Users.csv`

## English

### What this file is for

This CSV is the safe local/demo identity list for IDTS. CAP imports it into `idts.cap.Users` when a fresh database is deployed. A User represents a person and their application role; it is not yet a Developer assignment profile.

IDTS-90 keeps the four original team accounts and adds ten synthetic Developer users under `example.local`. These rows improve assignment, workload and mentor demonstrations without storing real personal data or passwords.

### How the rows flow through IDTS

1. `db/schema.cds` defines the `Users` entity and its `role` association.
2. CAP matches this CSV name to `idts.cap.Users` and imports the columns.
3. `DeveloperProfiles.user_ID` links a Developer profile to one of these User IDs.
4. `srv/bug-service/read-models.js` joins User names with profiles and responsibilities.
5. Fiori Smart Assign and PM monitoring show the resulting developer names.

The login system also reads Users, but this CSV deliberately has no password column. Password hashes are private runtime data and the narrow IDTS-90 UPSERT must preserve them.

### Column walkthrough

- `ID`: stable UUID used by associations. Never replace an existing ID casually.
- `displayName`: human-readable name shown in Fiori.
- `email`: login identity for configured accounts. IDTS-90 demo users use synthetic `example.local` addresses.
- `role_code`: business role. All new rows use the existing `DEVELOPER` role; no new role type is invented.
- `active`: inactive users must not be treated as normal working users.

### Cross-folder links

- `db/schema.cds`, entity `Users`: defines the columns and role association.
- `srv/auth.js` and authentication helpers: resolve a login identity to a User.
- `srv/bug-service/read-models.js`: joins `Users.displayName` into `AssignableDevelopers` and workload rows.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`: displays the joined developer identity.
- `scripts/db/upsert-developer-demo-data.js`: reads only the ten IDTS-90 IDs and performs an idempotent, password-preserving UPSERT.

### Safe editing checklist

- Use synthetic data only for additional demo users.
- Keep UUIDs unique and preserve the original four team rows.
- Do not add passwords, password hashes, tokens or real private email addresses.
- Update DeveloperProfiles and DeveloperResponsibilities together for a new Developer.
- Run `npm run qa:idts90:developer-demo-data`.
- On Shared QA, use the narrow UPSERT script; do not run a seed-loading `cds deploy`.

## Vietnamese

### File này dùng để làm gì

CSV này là danh sách danh tính an toàn cho môi trường local/demo của IDTS. Khi deploy một database mới, CAP import file vào `idts.cap.Users`. Một User biểu diễn một người và role trong ứng dụng; User chưa phải là hồ sơ dùng để phân công Developer.

IDTS-90 giữ nguyên bốn tài khoản team ban đầu và thêm mười Developer giả lập dùng domain `example.local`. Các dòng này giúp demo assignment, workload và mentor review phong phú hơn mà không lưu dữ liệu cá nhân thật hoặc password.

### Dữ liệu đi qua IDTS như thế nào

1. `db/schema.cds` định nghĩa entity `Users` và association tới role.
2. CAP dựa vào tên CSV để import các cột vào `idts.cap.Users`.
3. `DeveloperProfiles.user_ID` nối một hồ sơ Developer tới một User ID trong file này.
4. `srv/bug-service/read-models.js` join tên User với profile và responsibility.
5. Smart Assign và màn hình PM của Fiori hiển thị danh sách Developer sau khi join.

Hệ thống login cũng đọc Users, nhưng CSV này cố ý không có cột password. Password hash là dữ liệu private ở runtime, và UPSERT hẹp của IDTS-90 phải giữ nguyên password hash hiện có.

### Giải thích từng cột

- `ID`: UUID ổn định để các bảng khác tham chiếu. Không tự ý đổi ID đã tồn tại.
- `displayName`: tên dễ đọc hiển thị trên Fiori.
- `email`: danh tính login của account đã được cấu hình. User demo IDTS-90 dùng email giả `example.local`.
- `role_code`: role nghiệp vụ. Tất cả dòng mới dùng role `DEVELOPER` đã có; không tạo role mới.
- `active`: user inactive không được coi như user đang làm việc bình thường.

### Liên kết với file ở folder khác

- `db/schema.cds`, entity `Users`: định nghĩa cột và association role.
- `srv/auth.js` và auth helpers: tìm User tương ứng với danh tính login.
- `srv/bug-service/read-models.js`: join `Users.displayName` vào `AssignableDevelopers` và workload.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`: hiển thị danh tính Developer đã join.
- `scripts/db/upsert-developer-demo-data.js`: chỉ đọc mười ID của IDTS-90 và UPSERT idempotent mà không đụng password.

### Checklist sửa an toàn

- Chỉ dùng dữ liệu giả cho demo user bổ sung.
- UUID phải unique và phải giữ nguyên bốn user team ban đầu.
- Không thêm password, password hash, token hoặc email cá nhân thật.
- Khi thêm Developer phải cập nhật cả DeveloperProfiles và DeveloperResponsibilities.
- Chạy `npm run qa:idts90:developer-demo-data`.
- Trên Shared QA chỉ dùng UPSERT hẹp; không chạy `cds deploy` có nạp seed.

## Metadata

- Source: `db/data/idts.cap-Users.csv`
- Rows after IDTS-90: 14
- Last reviewed: 2026-07-23
