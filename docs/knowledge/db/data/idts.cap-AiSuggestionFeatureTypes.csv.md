# Knowledge: `db/data/idts.cap-AiSuggestionFeatureTypes.csv`

## English

This CSV seeds the allowed AI feature types for suggestion audit records.

IDTS uses these codes to classify why an `AiSuggestions` row exists:

- `DUPLICATE_DETECTION`: possible duplicate or similar bug suggestion.
- `CLASSIFICATION`: suggested module/component/category/priority/severity style output.
- `BUG_SUMMARY`: bug summary or handoff summary.
- `ASSIGNMENT_EXPLANATION`: explanation for Smart Assign recommendation.

Cross-folder links:

- `db/schema.cds` defines `AiSuggestionFeatureTypes`.
- `srv/ai/audit.js` validates `featureType` against this code list before writing audit rows.
- `srv/service.cds` exposes the code list through `BugService`.

Safe editing checklist:

- Do not remove existing codes once feature tasks depend on them.
- Keep codes stable and uppercase.
- Add new codes only when business scope approves a new AI capability.

## Vietnamese

CSV này seed các loại AI feature được phép dùng cho audit record của suggestion.

IDTS dùng các code này để phân loại lý do tồn tại của một dòng `AiSuggestions`:

- `DUPLICATE_DETECTION`: suggestion về bug trùng hoặc bug tương tự.
- `CLASSIFICATION`: suggestion về module/component/category/priority/severity.
- `BUG_SUMMARY`: summary bug hoặc handoff summary.
- `ASSIGNMENT_EXPLANATION`: giải thích cho gợi ý Smart Assign.

Liên kết với file khác:

- `db/schema.cds` định nghĩa `AiSuggestionFeatureTypes`.
- `srv/ai/audit.js` validate `featureType` theo code list này trước khi ghi audit row.
- `srv/service.cds` expose code list này qua `BugService`.

Lưu ý khi sửa:

- Không xóa code cũ sau khi feature task đã phụ thuộc vào chúng.
- Giữ code ổn định và dùng chữ hoa.
- Chỉ thêm code mới khi business scope đã duyệt thêm capability AI mới.

