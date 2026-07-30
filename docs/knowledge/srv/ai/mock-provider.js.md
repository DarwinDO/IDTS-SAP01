# `srv/ai/mock-provider.js`

## 2026-07-30 batch fixture

### English

`embeddingBatch()` maps each input text to one deterministic vector in the same
order. It is a local contract fixture only; it does not prove the live Gateway
supports batch input or that a model produces useful semantic vectors.

### Tiếng Việt

`embeddingBatch()` map từng text đầu vào thành một vector deterministic theo
đúng thứ tự. Đây chỉ là fixture contract local; nó không chứng minh Gateway
thật hỗ trợ batch hoặc model tạo vector ngữ nghĩa có chất lượng.

## Beginner-first execution map (2026-07-18)

### English

`createDelegate` selects `MockAiProvider` for local/programmatic QA. Its methods return configured deterministic success/failure/no-result without network or API key. `latestUserMessage` supports predictable chat fixtures; `deterministicEmbedding` maps the same text to the same numeric vector so duplicate ranking tests are reproducible. This mock proves orchestration/fallback/safety, not real model quality. Debug mock mode/structured fixture and compare repeated output; never use mock PASS as evidence that a live provider understands bugs well.

### Vietnamese

`createDelegate` chọn `MockAiProvider` cho QA local/programmatic. Các method trả success/failure/no-result deterministic theo config, không gọi network hay cần API key. `latestUserMessage` hỗ trợ fixture chat đoán trước được; `deterministicEmbedding` map cùng text thành cùng vector số để test duplicate ranking lặp lại được. Mock chứng minh orchestration/fallback/safety, không chứng minh chất lượng model thật. Debug mock mode/structured fixture và so output lặp; không dùng mock PASS làm evidence rằng provider live hiểu Bug tốt.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: local/QA deterministic AI response. Use this provider to reproduce feature logic without network or a private key; changing its deterministic behavior requires matching test expectations.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: local/QA deterministic AI response. Dùng provider này để reproduce feature logic không cần network/private key; đổi deterministic behavior phải khớp test expectation.

## English

### What this file is for

This file implements the only provider available in IDTS-64: a deterministic mock AI provider for local and CI tests.

### Beginner explanation

A provider is the code that would normally talk to an AI service. For this task, IDTS does not call a real external service. The mock provider behaves like an AI provider from the rest of the backend's point of view, but it returns predictable local results.

This lets the team test disabled mode, success mode, provider error mode, timeout mode, structured output, and embeddings without paying for an AI provider or storing real API keys.

### Flow in IDTS

1. `srv/ai/provider.js` creates `MockAiProvider` when config provider is `mock`.
2. Feature code may call `chat()`, `structured()`, or `embedding()`.
3. The mock returns predictable data or throws a controlled error based on `mockMode`.
4. The safe wrapper catches failures and converts them to sanitized result objects.

### Important source anchors

- Location: `chat()`
  - IDTS concept: future natural-language AI output.
  - Impact if broken: feature tests cannot verify the safe provider wrapper.
  - Must check together: `srv/ai/provider.js`.

- Location: `structured()`
  - IDTS concept: future catalog/classification suggestions.
  - Impact if broken: tests cannot exercise structured AI output without a real provider.
  - Must check together: `scripts/qa/test-idts64-ai-provider.js`.

- Location: `embedding()`
  - IDTS concept: future duplicate/similar bug detection.
  - Impact if broken: IDTS-66 cannot test embedding flow safely.
  - Must check together: future duplicate detection task.

### Cross-folder impact

- `srv/ai/config.js`: controls `mockMode` and embedding dimensions.
- `scripts/qa/test-idts64-ai-provider.js`: relies on deterministic output.
- Future `IDTS-66` duplicate detection can use this mock for local tests.

### Safe editing checklist

- Keep output deterministic.
- Do not add real network calls here.
- Do not put real tokens or provider names in mock errors.

## Tiếng Việt

### File này dùng để làm gì

File này implement provider duy nhất trong IDTS-64: mock AI provider có kết quả ổn định cho local test và CI test.

### Giải thích cho người mới

Provider là đoạn code bình thường sẽ gọi tới AI service. Trong task này, IDTS chưa gọi service thật bên ngoài. Mock provider nhìn từ backend thì giống một AI provider, nhưng nó trả kết quả local có thể dự đoán được.

Nhờ vậy team có thể test disabled mode, success mode, provider error mode, timeout mode, structured output và embeddings mà không cần trả phí AI provider hoặc lưu API key thật.

### Flow hoạt động trong IDTS

1. `srv/ai/provider.js` tạo `MockAiProvider` khi config provider là `mock`.
2. Feature code có thể gọi `chat()`, `structured()` hoặc `embedding()`.
3. Mock trả dữ liệu dự đoán được hoặc throw lỗi có kiểm soát dựa trên `mockMode`.
4. Safe wrapper bắt lỗi và chuyển thành result object đã sanitize.

### Important source anchors

- Vị trí: `chat()`
  - Khái niệm IDTS: output AI dạng ngôn ngữ tự nhiên trong tương lai.
  - Ảnh hưởng nếu sai: test feature không verify được safe provider wrapper.
  - Phải kiểm tra cùng: `srv/ai/provider.js`.

- Vị trí: `structured()`
  - Khái niệm IDTS: suggestion phân loại/catalog trong tương lai.
  - Ảnh hưởng nếu sai: test không exercise được structured AI output nếu chưa có provider thật.
  - Phải kiểm tra cùng: `scripts/qa/test-idts64-ai-provider.js`.

- Vị trí: `embedding()`
  - Khái niệm IDTS: duplicate/similar bug detection trong tương lai.
  - Ảnh hưởng nếu sai: IDTS-66 không test được embedding flow an toàn.
  - Phải kiểm tra cùng: task duplicate detection sau này.

### Liên kết với folder khác

- `srv/ai/config.js`: điều khiển `mockMode` và embedding dimensions.
- `scripts/qa/test-idts64-ai-provider.js`: dựa vào output deterministic.
- `IDTS-66` sau này có thể dùng mock này để test duplicate detection local.

### Checklist sửa file an toàn

- Giữ output deterministic.
- Không thêm network call thật trong file này.
- Không đặt token thật hoặc provider name thật trong mock error.
