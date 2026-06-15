# Quy Trình Sync Google Workspace SAP490

## Vietnamese

### 1. Mục Đích

Tài liệu này định nghĩa cách team IDTS sync deliverable SAP490 giữa repository, artifact DOCX/XLSX local, Google Drive, Google Docs và Google Sheets.

Mục tiêu là hỗ trợ team nhiều developer cùng làm mà vẫn giữ repository là source of truth.

### 2. Source Of Truth

| Layer | Vai trò | Rule |
| --- | --- | --- |
| Repository Markdown | Nguồn canonical có thể chỉnh sửa | Cập nhật phần này trước cho BRD, SRS, FRS, tài liệu BA/PM, decision, risk và requirement. |
| DOCX/XLSX/PPTX local | Artifact template-filled sẵn sàng để nộp | Copy template SAP490 tương ứng trước, rồi fill bản copy từ source đã duyệt trong repo. Verify layout trước khi share. |
| Google Docs/Sheets | Bản collaboration và mentor review | Dùng cho comment, feedback, review và shared visibility. Không xem là source canonical. |
| Google Drive folder | Nơi phân phối và review | Lưu bản review và artifact generated. Không lưu credential. |

### 3. Tooling Ưu Tiên

| Nhu cầu | Tool ưu tiên | Fallback |
| --- | --- | --- |
| Sync lặp lại cho team lên Google Drive/Docs/Sheets | `gws` CLI | Google Drive connector |
| Readback hoặc kiểm tra nhanh trong Codex | Google Drive connector | `gws` CLI |
| Tạo hoặc chỉnh DOCX local | Documents plugin, `python-docx`, project script fill vào template copy | Pandoc chỉ dùng cho draft/prototype có label rõ, không dùng cho file SAP490 chính thức |
| Tạo hoặc chỉnh XLSX local | Spreadsheets plugin, `openpyxl`, project script | Chỉnh thủ công khi được duyệt |
| Verify layout DOCX cuối | Documents render/export workflow, LibreOffice PDF export | Kiểm tra trực quan thủ công |
| Verify XLSX cuối | Spreadsheets inspection, LibreOffice open/convert check | Kiểm tra trực quan thủ công |

`gws` được ưu tiên cho automation lặp lại vì cùng một command hoặc npm script có thể được chạy bởi nhiều developer ở nhiều chat thread hoặc terminal khác nhau. Google Drive connector vẫn hữu ích cho thao tác tương tác nhanh bên trong Codex.

### 4. Flow Sync Chuẩn

1. Cập nhật source trong repo trước.
2. Copy template SAP490 tương ứng và fill thành các file DOCX/XLSX/PPTX local tiếng Anh và tiếng Việt riêng từ source đã duyệt trong repo.
3. Verify layout DOCX/XLSX/PPTX generated ở local.
4. Dùng `gws` để upload hoặc update file tương ứng trên Google Drive.
5. Convert bản DOCX review sang Google Docs khi cần mentor comment.
6. Sync bảng có cấu trúc sang Google Sheets khi cần shared spreadsheet.
7. Ghi kết quả sync vào sync log hoặc PM task note.
8. Khi có feedback từ mentor, cập nhật Markdown trong repo trước.
9. Tạo lại các bản DOCX/XLSX/PPTX đã fill từ template.
10. Sync lại bản review đã cập nhật.

### 5. Google Sheets Mục Tiêu

Dùng Google Sheets cho collaboration dạng bảng khi table dễ review hơn một section trong tài liệu.

Các sheet khuyến nghị:

| Sheet | Source |
| --- | --- |
| Requirement Backlog | `docs/ba/04-requirement-backlog.md` và bảng requirement trong BRD/SRS/FRS |
| Traceability Matrix | Section traceability trong BRD/SRS/FRS |
| Business Rule Matrix | `IDTS-Business-Rule.md` và validation/status rule trong FRS |
| Risk and Decision Log | `docs/pm/risk-decision-log.md` |
| Open Questions | Section open issue trong BRD/SRS/FRS và PM task files |
| Test Case / Test Report | `docs/sap490/templates/2_SAP490_Test Report Template (1).xlsx` và QA artifact sau này |

### 6. Rule Bảo Toàn Template

Xem `docs/sap490/templates/` là source template dạng read-only.

Nên làm:

- Copy template trước khi fill.
- Tách deliverable SAP490 tiếng Anh và tiếng Việt thành file riêng.
- Chỉ fill placeholder, named range, section đã map, hoặc dòng bảng đã map.
- Giữ nguyên page setup, style, header, footer, cover page, table layout, formula, merged cell và cấu trúc sheet.
- Render/export DOCX generated trước khi báo hoàn tất nếu layout quan trọng.
- Kiểm tra XLSX generated trước khi báo hoàn tất nếu formula hoặc format quan trọng.

Không được làm:

- Chỉnh trực tiếp template SAP490 gốc.
- Build lại DOCX hoặc XLSX từ đầu khi task là fill school template.
- Dùng output Markdown/Pandoc làm file SAP490 chính thức trừ khi user duyệt rõ một prototype có label.
- Trộn tiếng Anh và tiếng Việt trong cùng deliverable SAP490, trừ khi template của trường bắt buộc field song ngữ.
- Replace toàn bộ document hoặc sheet khi chỉ cần update một section đã map.
- Xóa file Google Drive nếu chưa được user duyệt rõ.
- Commit credential, token, Drive file ID, OAuth data, hoặc private sync config.

### 7. Local Config Và Security

Giữ local sync config ngoài git.

Được phép commit:

- Tài liệu workflow chung.
- Tài liệu mapping template không chứa secret.
- Generated deliverable khi team quyết định version chúng.

Không được commit:

- Google OAuth credential.
- Token/config local của `gws`.
- Private Drive folder ID hoặc file ID.
- Local sync config có thông tin tài khoản cá nhân hoặc Drive detail.

Tên config local khuyến nghị:

- `docs/sap490/sync.local.json`
- `docs/sap490/drive-ids.local.json`
- `.gws/`
- `gws-credentials.json`

### 8. Xử Lý Conflict

Nếu Google Docs/Sheets có comment của mentor hoặc manual edit, không overwrite ngay.

Dùng rule này:

1. Đọc feedback trên Google.
2. Quyết định feedback đó có làm đổi ý nghĩa project không.
3. Cập nhật Markdown trong repo và PM/canonical docs khi cần.
4. Regenerate artifact local.
5. Sync bản review mới hoặc update file Drive hiện tại sau khi readback.

Khi hai developer cùng sync một file, developer vừa đổi source trong repo gần nhất nên tạo lại bản copy đã fill từ template rồi sync. Nếu cả hai cùng đổi source, merge thay đổi trong repo trước.

### 9. Script Local Đã Có

Các script này đã có để setup an toàn và dry-run. Chúng không upload, update, overwrite hoặc delete file Google Drive.

| Script | Mục đích |
| --- | --- |
| `npm run sap490:gws:version` | Kiểm tra version `gws` local. |
| `npm run sap490:gws:auth-status` | Kiểm tra developer hiện tại đã authenticate `gws` chưa. |
| `npm run sap490:gws:check` | Kiểm tra `gws`, auth status và local Drive config. |
| `npm run sap490:gws:find-review-folder` | Tìm folder `SAP490 Review` trên Google Drive sau khi login. |
| `npm run sap490:gws:dry-run` | In ra target sync BRD/SRS/FRS lên Drive mà không đổi file remote. |
| `npm run sap490:gws:upload-review-docx` | Dry-run kế hoạch upload bản review DOCX BRD/SRS/FRS có timestamp. |
| `npm run sap490:gws:upload-review-docx:execute` | Upload bản review DOCX BRD/SRS/FRS có timestamp mà không overwrite file hiện có. |
| `npm run sap490:gws:sync-review-sheets` | Dry-run việc tạo Google Sheets review workbook có timestamp. |
| `npm run sap490:gws:sync-review-sheets:execute` | Tạo Google Sheets review workbook có timestamp gồm backlog, traceability, business rules, risks/decisions và open questions. |

Script upload luôn tạo bản review mới có timestamp. Script không overwrite file Drive hiện có. Chỉ dùng `node scripts/sap490/upload-review-docx.mjs --execute --as-google-docs` khi team muốn import thành Google Docs để mentor comment.

Script sync Google Sheets luôn tạo workbook mới có timestamp. Script không overwrite spreadsheet hiện có. Việc update spreadsheet hiện có chỉ nên thêm sau khi team verify folder ID, permission và overwrite rule.

### 10. Checklist Hoàn Tất

Trước khi báo một task sync SAP490 là hoàn tất:

- Source trong repo đã được cập nhật trước.
- File SAP490 tiếng Anh và tiếng Việt đã được tách riêng khi artifact do project tự viết.
- File DOCX/XLSX/PPTX generated đã được copy từ template và kiểm tra.
- Template SAP490 không bị chỉnh trực tiếp.
- Layout, font, bảng, formula, header/footer và cover page của template được giữ nguyên.
- Text tiếng Việt đã được kiểm tra lỗi encoding, thiếu dấu và mojibake.
- Target Google Drive/Docs/Sheets đã được xác định.
- Kết quả sync đã được readback hoặc verify bằng cách phù hợp.
- Credential và private config không bị commit.
- PM task/status hoặc risk/decision liên quan đã được cập nhật khi sync ảnh hưởng delivery coordination.

