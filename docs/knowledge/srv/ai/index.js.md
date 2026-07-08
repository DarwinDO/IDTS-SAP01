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

## IDTS-65 Audit Export Update

### English

IDTS-65 exports `createAiSuggestion` and `serializeSuggestionPayload` from this index file.

This lets future AI feature modules import the provider abstraction and the audit writer from one stable module boundary:

```js
const { createAiProvider, createAiSuggestion } = require('../ai')
```

The important point is still separation of responsibility. `createAiProvider` talks to the AI seam, while `createAiSuggestion` stores the already-safe suggestion audit row. This file only exposes both helpers; it does not decide when AI should run or when a suggestion should be accepted.

### Vietnamese

IDTS-65 export thêm `createAiSuggestion` và `serializeSuggestionPayload` từ index file này.

Điều này giúp các module AI sau này import provider abstraction và audit writer từ cùng một module boundary ổn định:

```js
const { createAiProvider, createAiSuggestion } = require('../ai')
```

Điểm quan trọng vẫn là tách trách nhiệm. `createAiProvider` gọi AI seam, còn `createAiSuggestion` lưu audit row của suggestion đã an toàn. File này chỉ expose helper; nó không quyết định khi nào AI chạy hoặc suggestion nào được accept.

## IDTS-66 Duplicate Detection Export Update

### English

IDTS-66 additionally exports `suggestSimilarBugs` for the CAP service handler and `rankSimilarBugCandidates` for focused backend verification. The implementation remains in `srv/ai/duplicate-detection.js`; this index only provides the stable import boundary used by `srv/service.js` and QA code.

### Vietnamese

IDTS-66 export thêm `suggestSimilarBugs` cho CAP service handler và `rankSimilarBugCandidates` cho focused backend verification. Phần triển khai vẫn nằm trong `srv/ai/duplicate-detection.js`; index này chỉ cung cấp import boundary ổn định cho `srv/service.js` và mã QA.
