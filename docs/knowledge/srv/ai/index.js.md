# `srv/ai/index.js`

## English

### What this file is for

This file is the public import entry for backend AI helpers. Other backend modules can import from `srv/ai` instead of knowing each internal file path.

### Beginner explanation

This is a small convenience layer. It does not run AI by itself. It exports the approved AI helper functions from the AI folder.

### Flow in IDTS

1. Future feature code imports `createAiProvider` from `srv/ai`.
2. That function creates the safe provider wrapper.
3. The feature receives normalized success/failure results.

### Important source anchors

- Location: exported functions
  - IDTS concept: one stable backend import point for AI foundation.
  - Impact if broken: future feature code may import internal files inconsistently.
  - Must check together: `srv/ai/provider.js`, `srv/ai/config.js`, and tests.

### Cross-folder impact

- Future files under `srv/bug-service/` may import from this entry point.
- No direct dependency from Fiori/UI exists in IDTS-64.

### Safe editing checklist

- Export only safe helpers that are intended for backend feature code.
- Do not export raw provider internals unless a task requires it.

## Tiếng Việt

### File này dùng để làm gì

File này là entry point để backend import các helper AI. Module backend khác có thể import từ `srv/ai` thay vì biết từng đường dẫn file bên trong.

### Giải thích cho người mới

Đây là lớp tiện ích nhỏ. Nó không tự chạy AI. Nó chỉ export các helper AI đã được phép dùng từ folder AI.

### Flow hoạt động trong IDTS

1. Feature code sau này import `createAiProvider` từ `srv/ai`.
2. Function đó tạo safe provider wrapper.
3. Feature nhận result success/failure đã chuẩn hóa.

### Important source anchors

- Vị trí: exported functions
  - Khái niệm IDTS: một import point ổn định cho AI foundation backend.
  - Ảnh hưởng nếu sai: feature code sau này có thể import file nội bộ không nhất quán.
  - Phải kiểm tra cùng: `srv/ai/provider.js`, `srv/ai/config.js`, và tests.

### Liên kết với folder khác

- Các file tương lai trong `srv/bug-service/` có thể import từ entry point này.
- IDTS-64 chưa tạo dependency trực tiếp từ Fiori/UI.

### Checklist sửa file an toàn

- Chỉ export helper an toàn, có chủ đích cho backend feature code.
- Không export raw provider internals nếu chưa có task yêu cầu.
