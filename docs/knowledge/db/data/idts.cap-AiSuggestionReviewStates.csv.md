# Knowledge: `db/data/idts.cap-AiSuggestionReviewStates.csv`

## English

This CSV seeds the human review states for AI suggestions.

AI output in IDTS is never treated as final. It starts as `PENDING`, then a human can accept, reject, ignore, or let it expire when the bug changes.

Cross-folder links:

- `db/schema.cds` defines `AiSuggestionReviewStates`.
- `srv/ai/audit.js` defaults new audit rows to `PENDING`.
- Future review UI work must display and update these states through backend-approved paths.

Safe editing checklist:

- Keep `PENDING` because new suggestions depend on it as the default.
- Do not rename states without updating tests and future UI review behavior.
- Do not add states that imply AI has applied a workflow change by itself.

## Vietnamese

CSV này seed các trạng thái human review cho AI suggestion.

Output AI trong IDTS không bao giờ được xem là kết quả cuối ngay lập tức. Nó bắt đầu là `PENDING`, sau đó con người có thể accept, reject, ignore, hoặc để expired khi bug đã thay đổi.

Liên kết với file khác:

- `db/schema.cds` định nghĩa `AiSuggestionReviewStates`.
- `srv/ai/audit.js` mặc định dòng audit mới là `PENDING`.
- UI review tương lai phải hiển thị và cập nhật các trạng thái này qua backend-approved path.

Lưu ý khi sửa:

- Giữ `PENDING` vì suggestion mới phụ thuộc vào nó làm default.
- Không đổi tên state nếu chưa cập nhật test và UI review tương lai.
- Không thêm state khiến người đọc hiểu rằng AI đã tự apply workflow change.

