# Hướng Dẫn Setup `gws` Cho Team SAP490

## Vietnamese

### 1. Mục Đích

Guide này giúp từng developer của IDTS cài đặt, authenticate và dùng workflow `gws` local cho việc cộng tác SAP490 trên Google Drive, Google Docs và Google Sheets.

Dùng guide này cùng với:

- `docs/sap490/sync-workflow.vi.md`
- `docs/sap490/drive-ids.example.json`
- `AGENTS.md`

### 2. Setup Này Làm Gì

Setup này giúp mọi developer có cùng command local:

| Command | Mục đích |
| --- | --- |
| `npm run sap490:gws:version` | Verify version `gws` local. |
| `npm run sap490:gws:auth-status` | Kiểm tra developer hiện tại đã authenticate chưa. |
| `npm run sap490:gws:check` | Kiểm tra CLI, auth và local Drive config. |
| `npm run sap490:gws:find-review-folder` | Tìm folder `SAP490 Review` trong phạm vi Google Drive mà developer có quyền truy cập. |
| `npm run sap490:gws:dry-run` | Hiển thị target sync BRD/SRS/FRS lên Drive mà không thay đổi file remote. |
| `npm run sap490:gws:upload-review-docx` | Preview upload bản review DOCX BRD/SRS/FRS có timestamp. |
| `npm run sap490:gws:upload-review-docx:execute` | Upload bản review DOCX BRD/SRS/FRS có timestamp mà không overwrite file hiện có. |
| `npm run sap490:gws:sync-review-sheets` | Preview Google Sheets review workbook có timestamp. |
| `npm run sap490:gws:sync-review-sheets:execute` | Tạo Google Sheets review workbook có timestamp mà không overwrite spreadsheet hiện có. |

Các script hiện tại chủ yếu là read/check/dry-run. Chúng không upload, overwrite hoặc delete file.

### 3. Điều Kiện Cần Có

Mỗi developer cần:

- Có Node.js trên máy.
- Cài dependency của repo bằng `npm install`.
- Có quyền truy cập Google account vào folder Drive `SAP490 Review`.
- Có OAuth setup local cho Google Workspace thông qua `gws`.

Project dùng `@googleworkspace/cli` làm dev dependency. Không cài npm package `gws` không scope vì package đó là tool khác.

### 4. Cài Dependency Của Project

Từ root repository:

```powershell
npm install
```

Verify CLI local:

```powershell
npm run sap490:gws:version
```

Kết quả kỳ vọng:

```text
gws 0.22.5
This is not an officially supported Google product.
```

### 5. Authenticate `gws`

Kiểm tra trạng thái auth:

```powershell
npm run sap490:gws:auth-status
```

Nếu chưa authenticated, dùng một trong hai cách sau.

Cách A: OAuth client do team cung cấp

1. Lấy OAuth client ID và client secret từ team owner hoặc Google Cloud project owner.
2. Lưu vào user environment local, không lưu trong repo.
3. Chạy:

```powershell
npx gws auth login
```

Cách B: setup qua Google Cloud CLI local

Chỉ dùng nếu bạn có quyền Google Cloud và được phép tạo hoặc cấu hình OAuth client:

```powershell
npx gws auth setup
npx gws auth login
```

Không commit OAuth credential, token file, generated config hoặc Drive ID.

### 6. Tạo Local Drive Config

Copy file config mẫu:

```powershell
Copy-Item docs/sap490/drive-ids.example.json docs/sap490/drive-ids.local.json
```

Sau đó chỉnh `docs/sap490/drive-ids.local.json` ở local.

Các field bắt buộc:

| Field | Ý nghĩa |
| --- | --- |
| `googleWorkspace.reviewFolderId` | Google Drive folder ID của `SAP490 Review`. |
| `googleWorkspace.deliverableTemplateFolderId` | Google Drive folder ID của `Deliverable_template`. |

File local này đã được ignore bởi git.

### 7. Tìm Folder Review

Sau khi authenticate, chạy:

```powershell
npm run sap490:gws:find-review-folder
```

Dùng folder ID trả về để điền vào `googleWorkspace.reviewFolderId` trong `docs/sap490/drive-ids.local.json`.

Nếu không tìm thấy folder:

- Kiểm tra Google account có quyền vào folder `SAP490 Review`.
- Kiểm tra tên folder đúng chính xác là `SAP490 Review`.
- Nhờ Drive owner share folder cho tài khoản developer.

### 8. Chạy Local Check

Chạy:

```powershell
npm run sap490:gws:check
```

Check này cần xác nhận:

- `gws` đã được cài.
- Authentication hoạt động.
- `docs/sap490/drive-ids.local.json` tồn tại.
- `reviewFolderId` đã được điền.

### 9. Chạy Dry-Run

Chạy:

```powershell
npm run sap490:gws:dry-run
```

Lệnh này in ra các file DOCX BRD/SRS/FRS sau này sẽ được upload hoặc update. Lệnh không thay đổi Google Drive.

### 10. Rule Sử Dụng Cho Team

Với deliverable SAP490:

1. Cập nhật Markdown trong repo trước.
2. Regenerate DOCX/XLSX local.
3. Verify layout local.
4. Chạy `npm run sap490:gws:dry-run`.
5. Chạy `npm run sap490:gws:upload-review-docx` để preview tên file upload.
6. Chạy `npm run sap490:gws:upload-review-docx:execute` chỉ khi team muốn tạo bản review mới trên Drive.
7. Chạy `npm run sap490:gws:sync-review-sheets` để preview workbook review.
8. Chạy `npm run sap490:gws:sync-review-sheets:execute` chỉ khi team muốn tạo Google Sheets workbook mới để review có cấu trúc.

Google Docs và Google Sheets là bản review. Repository vẫn là source of truth.

Để import DOCX thành Google Docs native cho mentor comment, dùng:

```powershell
node scripts/sap490/upload-review-docx.mjs --execute --as-google-docs
```

Lệnh này cũng tạo file mới có timestamp. Nó không overwrite Google Docs hiện có.

### 11. Troubleshooting

| Triệu chứng | Nguyên nhân khả dĩ | Cách sửa |
| --- | --- | --- |
| `gws` is not recognized | Chưa cài dependency hoặc chạy ngoài npm script context | Chạy `npm install`, sau đó dùng `npm run sap490:gws:version`. |
| Auth status fail | Chưa login OAuth | Chạy `npx gws auth login` sau khi setup OAuth. |
| Không tìm thấy folder | Account chưa có quyền hoặc tên folder khác | Nhờ Drive owner share `SAP490 Review`; retry. |
| Thiếu local config | Chưa tạo `drive-ids.local.json` | Copy từ `drive-ids.example.json` rồi điền local IDs. |
| Dry-run báo thiếu DOCX | Chưa generate document | Regenerate DOCX BRD/SRS/FRS trước khi lên kế hoạch sync. |

