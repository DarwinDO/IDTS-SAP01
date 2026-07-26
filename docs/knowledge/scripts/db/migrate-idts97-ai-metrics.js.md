# IDTS-97 AI metrics migration helper

## English

### What this file is for

This script safely adds the nullable `operationStatus` and `latencyMs` columns to the existing PostgreSQL `AiSuggestions` table. It is deliberately narrower than `cds deploy`: it does not recreate the schema or reload seed data.

### Beginner flow

1. Running the command without `--execute` prints a sanitized dry-run summary and does not connect to PostgreSQL.
2. `--execute` requires `IDTS_RENDER_DATABASE_URL` from private environment configuration.
3. The script opens one transaction and runs two `ADD COLUMN IF NOT EXISTS` statements.
4. It reads `information_schema.columns` to prove both columns exist before committing.
5. Any error rolls the transaction back and passes through a redactor before it reaches the terminal.

### Must check together

- `db/schema.cds`: defines the two nullable fields for new deployments.
- `srv/ai/audit.js`: writes normalized status and latency.
- `srv/ai/metrics.js`: reads and aggregates those fields.
- `scripts/qa/test-idts97-ai-operational-metrics.js`: verifies the migration contract and runtime behavior.

### Safe editing checklist

- Keep dry-run as the default.
- Never print the connection string.
- Do not add seed loading or broad `cds deploy` behavior.
- Keep both statements idempotent and inside one transaction.

## Tiếng Việt

### File này dùng để làm gì

Script này thêm an toàn hai cột nullable `operationStatus` và `latencyMs` vào bảng PostgreSQL `AiSuggestions` đang có. Nó cố ý hẹp hơn `cds deploy`: không tạo lại schema và không nạp lại seed data.

### Luồng dễ hiểu cho người mới

1. Chạy lệnh không có `--execute` chỉ in bản tóm tắt dry-run đã làm sạch và không kết nối PostgreSQL.
2. Khi có `--execute`, script bắt buộc đọc `IDTS_RENDER_DATABASE_URL` từ private environment.
3. Script mở một transaction rồi chạy hai câu `ADD COLUMN IF NOT EXISTS`.
4. Script đọc `information_schema.columns` để chứng minh cả hai cột đã tồn tại trước khi commit.
5. Nếu có lỗi, toàn bộ transaction rollback và thông báo lỗi được redactor làm sạch trước khi hiện ở terminal.

### Phải kiểm tra cùng

- `db/schema.cds`: khai báo hai field nullable cho deployment mới.
- `srv/ai/audit.js`: ghi status và latency đã normalize.
- `srv/ai/metrics.js`: đọc và tổng hợp hai field đó.
- `scripts/qa/test-idts97-ai-operational-metrics.js`: kiểm tra contract migration và runtime.

### Checklist sửa an toàn

- Luôn giữ dry-run là mặc định.
- Không bao giờ in connection string.
- Không thêm seed loading hoặc broad `cds deploy`.
- Giữ hai câu lệnh idempotent và nằm trong cùng một transaction.
