# `srv/ai/provider.js`

## Beginner-first execution map (2026-07-18)

### English

Feature code calls `createAiProvider`, receives `SafeAiProvider`, then calls chat/structured/embedding through one envelope. The wrapper sanitizes the request, chooses a delegate (OpenAI/mock/disabled), applies timeout and converts success/failure into a stable result containing safe status/data/metadata. It never throws raw provider diagnostics to feature/UI. `redactSensitiveObject` protects nested input; `modelAliasFor` returns a safe alias, not an endpoint/key. Debug feature request before sanitize → sanitized size/shape → delegate choice → timeout/provider result → final envelope. Fallback decisions belong to each feature, not this adapter.

### Vietnamese

Feature code gọi `createAiProvider`, nhận `SafeAiProvider`, rồi gọi chat/structured/embedding qua một envelope chung. Wrapper sanitize request, chọn delegate OpenAI/mock/disabled, áp timeout và chuyển success/failure thành result ổn định có status/data/metadata an toàn. Nó không throw raw provider diagnostic ra feature/UI. `redactSensitiveObject` bảo vệ input lồng nhau; `modelAliasFor` trả alias an toàn, không phải endpoint/key. Debug theo feature request trước sanitize → size/shape đã sanitize → delegate được chọn → timeout/provider result → envelope cuối. Quyết định fallback thuộc từng feature, không thuộc adapter này.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: feature request -> configured provider or fallback. Inspect provider status, timeout, and sanitized diagnostics here. Do not let a provider failure mutate a Bug or bypass the feature's human-review contract.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: feature request -> configured provider hoặc fallback. Quan sát provider status, timeout và sanitized diagnostic ở đây. Provider failure không được mutate Bug hoặc bỏ qua human-review contract.

## English

### What this file is for

This file is the safe backend wrapper around AI operations. Feature code should call this wrapper instead of talking directly to any AI provider.

It provides three operations for future tasks:

- `chat()` for text responses such as summaries.
- `structured()` for JSON-like suggestions such as classification.
- `embedding()` for vector output used by similar-bug search.

### Beginner explanation

Without this wrapper, each AI feature might handle disabled config, timeout, provider error, redaction, and logging differently. That would be hard to secure and hard to test.

This wrapper makes AI behavior consistent:

- if AI is disabled, return a safe `AI_DISABLED` result;
- if provider config is unsupported, return a safe failure;
- if provider succeeds, return a normalized success result;
- if provider fails or times out, return a sanitized failure result and do not throw into the bug workflow.

### Flow in IDTS

1. Feature code calls `createAiProvider()`.
2. The provider reads normalized config from `srv/ai/config.js`.
3. The request is sanitized before reaching the delegate provider.
4. The delegate provider runs.
5. The wrapper returns `{ ok, status, operation, featureType, correlationId, data/error }`.

The delegates are the deterministic mock provider and the optional real OpenAI provider. The wrapper still owns disabled/incomplete configuration, timeout, sanitization, and safe failure behavior for both.

### Important source anchors

- Location: `SafeAiProvider.#run()`
  - IDTS concept: AI failure must not rollback normal workflow.
  - Impact if broken: provider errors may throw into create/edit/assignment flows.
  - Must check together: `scripts/qa/test-idts64-ai-provider.js` and future feature tests.

- Location: `sanitizeChatRequest()`, `sanitizeStructuredRequest()`, `sanitizeEmbeddingRequest()`
  - IDTS concept: minimum-data and no-secret prompt boundary.
  - Impact if broken: private text may reach provider calls.
  - Must check together: `srv/ai/safety.js`.

- Location: `successResult()` and `failureResult()`
  - IDTS concept: stable backend contract for AI result handling.
  - Impact if broken: future features may parse inconsistent fields.
  - Must check together: future `IDTS-65` audit model and `IDTS-70` Fiori review UI.

### Cross-folder impact

- `srv/ai/config.js`: determines enabled/disabled/provider behavior.
- `srv/ai/mock-provider.js`: deterministic delegate used by tests.
- `srv/ai/openai-provider.js`: optional server-side provider that uses only sanitized input and returns normalized text, JSON, or embeddings.
- `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`: defines fallback and no-autonomy rules.
- Future `db/schema.cds` changes in `IDTS-65`: should store only safe normalized result data returned by this wrapper.

### Safe editing checklist

- Do not throw provider failures into business workflow unless the caller explicitly opts into failure.
- Keep returned error summaries sanitized.
- Do not add real provider integration without private config, tests, and security review.
- Do not persist raw prompts or raw provider responses here.

## Tiếng Việt

### File này dùng để làm gì

File này là wrapper backend an toàn cho các operation AI. Feature code nên gọi wrapper này thay vì gọi trực tiếp bất kỳ AI provider nào.

Nó cung cấp ba operation cho các task sau:

- `chat()` cho text response như summary.
- `structured()` cho suggestion dạng JSON như classification.
- `embedding()` cho vector dùng trong tìm bug tương tự.

### Giải thích cho người mới

Nếu không có wrapper này, mỗi feature AI sẽ tự xử lý config disabled, timeout, provider error, redaction và logging theo cách riêng. Như vậy vừa khó bảo mật vừa khó test.

Wrapper này làm hành vi AI nhất quán:

- nếu AI bị tắt, trả result an toàn `AI_DISABLED`;
- nếu provider config không được support, trả failure an toàn;
- nếu provider chạy thành công, trả success result chuẩn hóa;
- nếu provider lỗi hoặc timeout, trả failure đã sanitize và không throw ngược vào bug workflow.

### Flow hoạt động trong IDTS

1. Feature code gọi `createAiProvider()`.
2. Provider đọc config đã chuẩn hóa từ `srv/ai/config.js`.
3. Request được sanitize trước khi tới delegate provider.
4. Delegate provider chạy.
5. Wrapper trả `{ ok, status, operation, featureType, correlationId, data/error }`.

Trong IDTS-64, delegate duy nhất là mock provider. Provider thật phải được thêm ở task sau kèm security review.

### Important source anchors

- Vị trí: `SafeAiProvider.#run()`
  - Khái niệm IDTS: lỗi AI không được rollback workflow bình thường.
  - Ảnh hưởng nếu sai: lỗi provider có thể throw vào create/edit/assignment flow.
  - Phải kiểm tra cùng: `scripts/qa/test-idts64-ai-provider.js` và các feature test sau này.

- Vị trí: `sanitizeChatRequest()`, `sanitizeStructuredRequest()`, `sanitizeEmbeddingRequest()`
  - Khái niệm IDTS: ranh giới prompt tối thiểu dữ liệu và không secret.
  - Ảnh hưởng nếu sai: dữ liệu private có thể bị gửi đến provider.
  - Phải kiểm tra cùng: `srv/ai/safety.js`.

- Vị trí: `successResult()` và `failureResult()`
  - Khái niệm IDTS: contract backend ổn định cho AI result.
  - Ảnh hưởng nếu sai: feature sau này phải parse field không nhất quán.
  - Phải kiểm tra cùng: audit model `IDTS-65` và Fiori review UI `IDTS-70`.

### Liên kết với folder khác

- `srv/ai/config.js`: quyết định enabled/disabled/provider behavior.
- `srv/ai/mock-provider.js`: delegate implementation hiện tại.
- `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`: định nghĩa fallback và no-autonomy rules.
- Thay đổi `db/schema.cds` tương lai ở `IDTS-65`: chỉ nên lưu safe normalized result trả từ wrapper này.

### Checklist sửa file an toàn

- Không throw provider failure vào business workflow trừ khi caller chủ động chọn như vậy.
- Giữ error summary đã sanitize.
- Không thêm provider thật nếu chưa có private config, test và security review.
- Không persist raw prompt hoặc raw provider response ở đây.
