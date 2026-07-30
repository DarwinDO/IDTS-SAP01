# `srv/ai/vercel-gateway-provider.js`

## 2026-07-30 rate-limit and embedding-batch boundary

### English

`embeddingBatch()` sends one bounded embeddings request for at most eleven
sanitized texts. It rejects a wrong vector count, unstable index mapping,
mixed dimensions, or non-finite numbers as one whole batch. An HTTP 400 on the
array contract becomes `AI_EMBEDDING_BATCH_UNSUPPORTED`, allowing the Similar
Bugs feature to use its bounded sequential compatibility path.

All Vercel operations share one in-memory cooldown. A transient HTTP 429 uses
`Retry-After`, or 60 seconds when the header is absent, clamped to 1–900
seconds. Calls during cooldown do not reach the network. HTTP 429, budget
errors, generic 400, and malformed output never spend an OpenAI fallback call;
only timeout, network, and HTTP 5xx may use the single configured fallback.

Debug order: `#request()` → `httpError()` → `activateGatewayCooldown()` → the
safe provider envelope. Inspect only status, safe model alias, retry seconds,
latency, and fallback flag. Never inspect Authorization or raw response data.

### Tiếng Việt

`embeddingBatch()` gửi một request embedding đã giới hạn tối đa mười một đoạn
text được làm sạch. Nếu số vector sai, index không ổn định, dimension khác nhau
hoặc có số không hữu hạn thì toàn bộ batch bị loại. HTTP 400 của array contract
được đổi thành `AI_EMBEDDING_BATCH_UNSUPPORTED`, để Similar Bugs chuyển sang
đường tương thích tuần tự đã giới hạn.

Mọi thao tác Vercel dùng chung một cooldown trong bộ nhớ. HTTP 429 tạm thời dùng
`Retry-After`, hoặc mặc định 60 giây khi thiếu header, và bị chặn trong khoảng
1–900 giây. Trong cooldown không có request mạng mới. HTTP 429, lỗi budget,
HTTP 400 chung và output sai cấu trúc không gọi OpenAI fallback; chỉ timeout,
lỗi mạng và HTTP 5xx mới được dùng đúng một fallback đã cấu hình.

Thứ tự debug: `#request()` → `httpError()` → `activateGatewayCooldown()` →
provider envelope an toàn. Chỉ xem status, model alias an toàn, retry seconds,
latency và fallback flag; không mở Authorization hoặc raw response.

## Purpose

This is the thin server-side adapter for Vercel AI Gateway. UI code never calls
it directly, and it never decides Bug workflow state. `srv/ai/provider.js`
redacts and bounds feature input first, then calls this adapter with private
runtime configuration and approved model aliases.

## Execution flow

1. `SafeAiProvider` selects this delegate only for ready `vercel` configuration.
2. `chat()` and `structured()` use the fixed `/v1/chat/completions` path.
3. `embedding()` uses `/v1/embeddings` only when an embedding model exists.
4. `#request()` sends the key in memory, parses the required response shape and
   discards the raw response body.
5. `#withFallback()` attempts the primary model first. Timeout, network error,
   retryable 5xx, transient non-budget 429 or malformed output may use the one
   configured fallback.
6. Generic 400/401/403/404 and quota/budget 429 do not use fallback.
7. A response-format-specific HTTP 400 is the one compatibility exception:
   `structured()` retries the same primary Qwen model once without
   `response_format`, using a bounded JSON-only system instruction.
8. The adapter parses the returned text as JSON. Malformed JSON becomes a safe
   provider failure and may use the existing bounded fallback.
9. The adapter returns only text/JSON/vector data plus safe model/fallback
   metadata. The wrapper converts errors to a stable public result.

## Qwen structured compatibility

IDTS sends `json_schema` first. Live SAP BTP diagnostics showed that the
current Qwen route rejected `json_schema`, legacy JSON and `json_object`, while
the same model returned a parseable JSON object when no `response_format` was
sent. The compatibility path therefore adds one JSON-only system instruction
and retries once without `response_format`, only when the first Qwen 400 is
identified as response-format incompatibility.

This is one bounded retry on the same model, not a model switch or a general
retry loop. The existing JSON parser and feature validator still reject
malformed, ungrounded or unsafe output.

HTTP 429 is classified before fallback. A temporary rate limit is retryable;
spend quota/budget exhaustion is not. `Retry-After` is bounded to 0–86400
seconds. The error may keep only a safe reason and allowlisted provider code;
it never keeps the key, endpoint, prompt or raw provider body.

## Debugging safely

Use this breakpoint order:

1. `structured()`
2. `#chatCompletion()`
3. `#request()`
4. `httpError()`
5. optional same-Qwen prompt-only compatibility call
6. `#withFallback()`

Inspect only operation, safe model alias, HTTP status, `gatewayReason`,
`providerErrorCode`, bounded `retryAfterSeconds`, latency and `fallbackUsed`.
Never expand `headers.Authorization` or copy provider payloads. If Bug state
changes after an AI action, debug the feature/action handler instead; this
adapter has no Bug transaction or OData mutation code.

## Files to inspect together

- `srv/ai/config.js` — private configuration and model aliases.
- `srv/ai/provider.js` — sanitization, diagnostics and stable result envelope.
- `srv/ai/metrics.js` — safe operational metadata.
- `scripts/qa/test-idts114-vercel-gateway-provider.js` — fake-fetch contract,
  compatibility and fallback tests.
- `scripts/qa/test-idts114-ling-live.js` — opt-in synthetic live smoke.

## Tiếng Việt

### File này làm gì

Đây là adapter backend gọn để nối IDTS với Vercel AI Gateway. Feature AI chỉ
đưa dữ liệu đã được lọc qua `srv/ai/provider.js` vào adapter. File này không
được tự sửa Bug, assignee, next processor hoặc lifecycle.

### Luồng xử lý

1. `SafeAiProvider` chọn adapter khi cấu hình Vercel đã sẵn sàng.
2. Chat và structured output đi qua `/v1/chat/completions`.
3. Embedding đi qua `/v1/embeddings`.
4. `#request()` gọi Gateway, chỉ lấy kết quả cần thiết rồi bỏ raw response.
5. `#withFallback()` chỉ dùng fallback một lần với lỗi retryable.
6. HTTP 400 chung, lỗi quyền và hết budget không được fallback.
7. Nếu Qwen trả HTTP 400 được xác định rõ là không tương thích
   `response_format`, `structured()` mới thử lại đúng một lần trên chính Qwen,
   bỏ `response_format` và thêm yêu cầu chỉ trả về một JSON object hợp lệ.
8. Kết quả vẫn phải qua `JSON.parse()` và validator của từng feature. JSON lỗi,
   nội dung không grounded hoặc không an toàn không được đưa thẳng lên UI.

### Cách debug

Đặt breakpoint theo thứ tự `structured()` → `#request()` → `httpError()` →
prompt-only compatibility retry → `#withFallback()`. Chỉ xem status, model
alias, lý do an toàn, mã lỗi allowlist, `Retry-After`, latency và fallback flag.
Không xem hoặc ghi API key, prompt, dữ liệu Bug, endpoint private hay raw
provider response.

### Checklist sửa an toàn

- Không tạo retry loop.
- Không đổi model khi chưa có quyết định.
- Không fallback cho lỗi payload 400 chung hoặc hết budget.
- Không đưa provider diagnostic thô lên UI.
- Không lưu raw prompt hoặc raw provider response.

## Qwen schema-envelope compatibility

Some Qwen responses contain valid JSON but wrap the result once under the
requested schema name:

```json
{
  "IdtsSmartAssignmentExplanation": {
    "candidates": []
  }
}
```

After `JSON.parse()`, `unwrapSchemaEnvelope()` removes that wrapper only when
the root has exactly one property, its name equals the sanitized schema name,
and its value is an object. It does not unwrap recursively. Direct feature
payloads, arrays, primitives, multi-key objects and unrelated wrappers remain
unchanged. Feature-level validation still decides whether candidate IDs,
catalog values and explanations are grounded.

The SAP BTP module declares `IDTS_AI_TIMEOUT_MS: 45000` in `mta.yaml`. This is
the deadline for one model call, not permission to add another retry loop.
Browser acceptance must still verify that the full OData request completes
within the client/router deadline.

## Shared request deadline

Structured calls may provide an internal absolute deadline. Every Qwen compatibility retry and the single allowed OpenAI fallback reuses the remaining time from that same deadline; it does not receive a fresh timeout window. When the remaining time reaches zero, `AbortController` stops the active request and marks the timeout as not fallback-eligible. A fast HTTP 5xx can still use one fallback while time remains.

Breakpoint order: `structured()` → `#withFallback()` → `#chatCompletion()` → `#request()` → `requestBudgetFor()`. Watch only the bounded deadline, remaining milliseconds, model alias, HTTP status and fallback flag; never inspect or log key, prompt or raw response.

### Deadline dùng chung

Structured request có thể truyền deadline nội bộ. Qwen compatibility retry và một OpenAI fallback được phép phải dùng phần thời gian còn lại của cùng deadline, không được nhận thêm một cửa sổ timeout mới. Khi hết thời gian, `AbortController` hủy request hiện tại và timeout không còn đủ điều kiện fallback. HTTP 5xx xảy ra sớm vẫn có thể fallback một lần nếu deadline còn thời gian.

Thứ tự breakpoint: `structured()` → `#withFallback()` → `#chatCompletion()` → `#request()` → `requestBudgetFor()`. Chỉ quan sát deadline đã giới hạn, thời gian còn lại, model alias, HTTP status và fallback flag; không xem hoặc log key, prompt hay raw response.

## Giải thích tiếng Việt

Qwen có thể trả JSON hợp lệ nhưng bọc kết quả dưới đúng tên schema, ví dụ
`IdtsSmartAssignmentExplanation`. Adapter chỉ gỡ đúng một lớp khi object ngoài
cùng có đúng một key trùng với tên schema đã chuẩn hóa và giá trị bên trong là
object. Payload trực tiếp, array, object nhiều key hoặc wrapper sai tên được
giữ nguyên.

Sau bước này, validator của từng tính năng vẫn kiểm tra candidate ID, catalog
value và dữ liệu grounding. Vì vậy provider trả `SUCCESS` không có nghĩa hệ
thống tự động tin, assign hoặc áp dụng nội dung AI.
