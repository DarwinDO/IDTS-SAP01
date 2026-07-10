# Knowledge: `srv/ai/openai-provider.js`

## English

### Purpose

This file is the real OpenAI transport for the existing IDTS AI provider seam. It is used only when private configuration explicitly selects `provider: "openai"`; the normal default remains disabled and mock-backed tests do not contact OpenAI.

### How it fits in IDTS

`srv/ai/provider.js` sanitizes feature input and owns safe failure handling. This file only sends that already-sanitized input to the official OpenAI HTTPS API and returns a small normalized result:

- `chat()` returns text for a future text-only feature.
- `structured()` requests JSON output for classification, handoff, and Smart Assign suggestions.
- `embedding()` returns a numeric vector for the existing duplicate/similar ranking feature.

Every Responses request sends `store: false`. The file has no access to CAP transactions, bug actions, assignments, lifecycle transitions, attachments, or audit persistence. Those remain under the existing CAP feature handlers and human-review flow.

### Important source anchors

- `OpenAiProvider.#responses()`
  - IDTS concept: a real model remains an advisory service, not a workflow engine.
  - Impact if broken: a feature could call a provider with a different request contract or retention setting.
  - Must check together: `srv/ai/provider.js`, `srv/ai/config.js`, and `scripts/qa/test-idts64-ai-provider.js`.

- `OpenAiProvider.structured()`
  - IDTS concept: catalog and review suggestions must be machine-readable before feature code can validate them against IDTS data.
  - Impact if broken: malformed provider text must fall back safely instead of being treated as a confirmed suggestion.
  - Must check together: `srv/ai/classification-suggestion.js`, `srv/ai/bug-summary.js`, and `srv/ai/assignment-explanation.js`.

- `OpenAiProvider.embedding()`
  - IDTS concept: semantic ranking improves duplicate/similar hints but does not create `DuplicateLinks`.
  - Impact if broken: `srv/ai/duplicate-detection.js` uses its deterministic text/classification fallback.
  - Must check together: `srv/ai/duplicate-detection.js` and its focused QA.

### Safe editing notes

- Keep the endpoint fixed to the official OpenAI API and keep keys private.
- Never log the Authorization header, request body, raw response, attachment bytes, or private bug data.
- Do not add tool calling, remote MCP, background work, automatic retries, or workflow writes here.
- A real deployment requires an authorized owner to set `OPENAI_API_KEY`, enable AI, and choose approved model aliases outside Git.

## Tiếng Việt

### Mục đích

File này là lớp kết nối OpenAI thật cho provider AI đã có của IDTS. Nó chỉ được dùng khi cấu hình private chọn rõ `provider: "openai"`; mặc định hệ thống vẫn tắt AI và test vẫn dùng mock, không gọi OpenAI.

### Vị trí trong IDTS

`srv/ai/provider.js` làm sạch input của feature và xử lý lỗi an toàn. File này chỉ gửi input đã được làm sạch tới API HTTPS chính thức của OpenAI rồi trả về kết quả nhỏ đã chuẩn hóa:

- `chat()` trả text cho feature text-only trong tương lai.
- `structured()` yêu cầu JSON cho suggestion phân loại, handoff và Smart Assign.
- `embedding()` trả vector số cho tính năng xếp hạng bug trùng/tương tự hiện có.

Mọi request Responses đều gửi `store: false`. File này không có quyền truy cập CAP transaction, action bug, assignment, lifecycle transition, attachment hay ghi audit. Các phần đó vẫn thuộc handler CAP hiện có và flow review của con người.

### Important source anchors

- `OpenAiProvider.#responses()`
  - Khái niệm IDTS: model thật vẫn chỉ là dịch vụ tư vấn, không phải workflow engine.
  - Ảnh hưởng nếu sai: feature có thể gọi provider với contract hoặc cài đặt lưu trữ khác.
  - Phải kiểm tra cùng: `srv/ai/provider.js`, `srv/ai/config.js` và `scripts/qa/test-idts64-ai-provider.js`.

- `OpenAiProvider.structured()`
  - Khái niệm IDTS: suggestion catalog và review phải đọc được theo cấu trúc trước khi feature kiểm tra lại với dữ liệu IDTS.
  - Ảnh hưởng nếu sai: text provider sai format phải fallback an toàn, không được xem là suggestion đã xác nhận.
  - Phải kiểm tra cùng: `srv/ai/classification-suggestion.js`, `srv/ai/bug-summary.js` và `srv/ai/assignment-explanation.js`.

- `OpenAiProvider.embedding()`
  - Khái niệm IDTS: semantic ranking cải thiện hint duplicate/similar nhưng không tạo `DuplicateLinks`.
  - Ảnh hưởng nếu sai: `srv/ai/duplicate-detection.js` sẽ dùng fallback text/classification xác định sẵn.
  - Phải kiểm tra cùng: `srv/ai/duplicate-detection.js` và QA riêng của nó.

### Lưu ý sửa an toàn

- Giữ endpoint cố định là OpenAI API chính thức và giữ key ở cấu hình private.
- Không log Authorization header, request body, raw response, attachment bytes hoặc bug data private.
- Không thêm tool calling, remote MCP, background work, retry tự động hoặc workflow write vào file này.
- Deploy thật cần owner được ủy quyền đặt `OPENAI_API_KEY`, bật AI và chọn model alias được duyệt ngoài Git.
