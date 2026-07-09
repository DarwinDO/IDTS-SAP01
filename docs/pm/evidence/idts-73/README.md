# IDTS-73 Create-Time Attachment Browser Evidence

## English

This folder contains selected browser evidence for the create-time attachment regression.

The browser suite proves:

- Comments are hidden while creating a new bug.
- Evidence / Attachments remains visible and enabled.
- Two selected files stay visible in the pending list before the bug is created.
- Unsupported and oversized files are not added.
- Creating the bug uploads the pending files.
- Downloaded content has the same SHA-256 as the selected content.
- Reload keeps the saved attachments visible and shows Comments only after the bug exists.
- A controlled upload failure keeps the bug saved and shows a safe recovery message.
- Controlled local QA records are cleaned after the run.

Key command:

```powershell
$env:IDTS_QA_BASE_URL = "http://localhost:4005"
$env:IDTS_QA_ALLOW_MUTATION = "true"
$env:IDTS_QA_UPLOAD_FULL_E2E = "true"
npm run qa:idts73:browser
```

The shared-QA mutation mode must be enabled deliberately. Credentials must stay in private environment variables.

## Tiếng Việt

Folder này chứa browser evidence đã chọn lọc cho regression attachment trong lúc tạo bug.

Browser suite chứng minh:

- Comments bị ẩn khi đang tạo bug mới.
- Evidence / Attachments vẫn hiển thị và sử dụng được.
- Hai file đã chọn vẫn nằm trong danh sách pending trước khi tạo bug.
- File sai loại và file quá lớn không được thêm vào.
- Khi tạo bug, các file pending được upload.
- Nội dung download có SHA-256 giống nội dung đã chọn.
- Sau reload, attachment đã lưu vẫn hiển thị và Comments chỉ xuất hiện khi bug đã tồn tại.
- Khi mô phỏng upload lỗi, bug vẫn được lưu và user nhận message phục hồi an toàn.
- Dữ liệu QA local có kiểm soát được dọn sau khi chạy.

Command chính:

```powershell
$env:IDTS_QA_BASE_URL = "http://localhost:4005"
$env:IDTS_QA_ALLOW_MUTATION = "true"
$env:IDTS_QA_UPLOAD_FULL_E2E = "true"
npm run qa:idts73:browser
```

Chế độ thay đổi dữ liệu shared QA phải được bật có chủ đích. Credential phải nằm trong private environment variable.
