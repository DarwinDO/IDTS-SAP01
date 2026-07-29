# `srv/ai/vercel-gateway-provider.js`

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

## Giải thích tiếng Việt

Qwen có thể trả JSON hợp lệ nhưng bọc kết quả dưới đúng tên schema, ví dụ
`IdtsSmartAssignmentExplanation`. Adapter chỉ gỡ đúng một lớp khi object ngoài
cùng có đúng một key trùng với tên schema đã chuẩn hóa và giá trị bên trong là
object. Payload trực tiếp, array, object nhiều key hoặc wrapper sai tên được
giữ nguyên.

Sau bước này, validator của từng tính năng vẫn kiểm tra candidate ID, catalog
value và dữ liệu grounding. Vì vậy provider trả `SUCCESS` không có nghĩa hệ
thống tự động tin, assign hoặc áp dụng nội dung AI.
