# `scripts/qa/test-idts122-classification-catalog.js`

## English

This deterministic file-level QA guard reads the three classification CSVs without deploying CAP or contacting an external system. It validates the exact 8/8/31 counts, UUID sets, duplicate component codes and pairs, foreign keys, the unchanged original 13 ComponentCategory rows, the exact AI Advisory row, and the approved matrix.

The script also runs red assertions against cloned rows in memory. It proves failures for wrong counts, duplicate code or pair, broken foreign key, changed original row, non-deterministic IDs, incorrect AI component fields, and a wrong matrix. It never writes to the CSV files.

Run:

```powershell
npm run qa:idts122:classification-catalog
```

### Important source anchors

- **Location**: `scripts/qa/test-idts122-classification-catalog.js:assertCatalog`
  **IDTS concept**: Enforces the ComponentCategory assignment key linking ApplicationComponents to DefectCategories.
  **Impact if broken**: Invalid catalog data can reach value helps and developer-responsibility matching, giving missing or incorrect classification choices.
  **Must check together**: `db/data/idts.cap-ApplicationComponents.csv`, `db/data/idts.cap-DefectCategories.csv`, `db/data/idts.cap-ComponentCategories.csv`, and separately owned `DeveloperResponsibilities.csv`.

## Tiếng Việt

QA guard xác định ở cấp file này đọc ba CSV phân loại mà không deploy CAP hoặc gọi hệ thống bên ngoài. Nó kiểm tra đúng số lượng 8/8/31, tập UUID, mã component và cặp trùng, foreign key, 13 dòng ComponentCategory gốc không đổi, dòng AI Advisory chính xác và ma trận đã duyệt.

Script cũng chạy red assertions trên các row bản sao trong bộ nhớ. Nó chứng minh các trường hợp sai số lượng, mã hoặc cặp trùng, foreign key hỏng, row gốc thay đổi, ID không xác định, trường AI component sai và ma trận sai đều fail. Nó không bao giờ ghi vào các CSV.

Chạy:

```powershell
npm run qa:idts122:classification-catalog
```

### Important source anchors

- **Vị trí**: `scripts/qa/test-idts122-classification-catalog.js:assertCatalog`
  **Khái niệm IDTS**: Bảo vệ khóa phân công ComponentCategory nối ApplicationComponents với DefectCategories.
  **Ảnh hưởng nếu sai**: Dữ liệu catalog không hợp lệ có thể đi vào value help và so khớp trách nhiệm developer, gây thiếu hoặc sai lựa chọn phân loại.
  **Cần kiểm tra cùng**: `db/data/idts.cap-ApplicationComponents.csv`, `db/data/idts.cap-DefectCategories.csv`, `db/data/idts.cap-ComponentCategories.csv` và `DeveloperResponsibilities.csv` do người khác phụ trách.
