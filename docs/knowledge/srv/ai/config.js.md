# `srv/ai/config.js`

## 2026-07-31 feature-specific model aliases

### English

`normalizeAiConfig()` now keeps separate structured-model aliases for
Classification, Handoff Summary, and Smart Assign while retaining the existing
embedding alias for Similar Bugs. `runtimeOverrides()` maps the corresponding
SAP BTP environment variables. Handoff also has one dedicated backup alias;
the private Gateway key is still shared only in memory and is never returned.

Flow: SAP BTP environment -> `runtimeOverrides()` -> `normalizeAiConfig()` ->
`SafeAiProvider.structured()` -> feature route.

Debug only `classificationModelAlias`, `handoffModelAlias`,
`assignmentModelAlias`, `handoffFallbackModelAlias`, and `ready`. Never inspect
the Gateway key.

### Tiếng Việt

`normalizeAiConfig()` giữ model riêng cho Classification, Handoff Summary và
Smart Assign; Similar Bugs tiếp tục dùng model embedding riêng. Handoff có đúng
một model dự phòng. Chỉ kiểm tra alias và cờ `ready` khi debug, không mở hoặc
ghi Gateway key.

## 2026-07-31 request-budget settings

### English

`requestLimit` and `requestWindowSeconds` normalize
`IDTS_AI_REQUEST_LIMIT` and `IDTS_AI_REQUEST_WINDOW_SECONDS`. A zero limit
disables proactive limiting for local/default configuration. SAP BTP sets
`4/60`, meaning at most four outbound requests per model in sixty seconds.
These values contain no credential and may be inspected safely; the Gateway
key must still never be opened or logged.

Flow: BTP environment → `runtimeOverrides()` → `normalizeAiConfig()` →
`VercelGatewayProvider.reserveModelRequest()`.

### Tiếng Việt

`requestLimit` và `requestWindowSeconds` đọc hai biến môi trường giới hạn
request. Giá trị `0` tắt giới hạn chủ động ở cấu hình mặc định/local. SAP BTP
dùng `4/60`: tối đa bốn request cho từng model trong sáu mươi giây. Có thể
kiểm tra hai số này khi debug, nhưng không được xem hoặc ghi Gateway key.

## Beginner-first execution map (2026-07-18)

### English

Every AI feature reaches configuration through `getAiConfig`; `normalizeAiConfig` converts CAP/private env strings into provider, enabled flags, model aliases, timeout, batch and text limits. Provider/mock normalizers accept only known values; number/boolean helpers avoid common env parsing mistakes. The API key remains private and is not returned by this module. Debug enabled/provider/mode/limits and alias only. Invalid or incomplete config must produce disabled/fallback behavior through provider, not leak configuration or crash Bug workflow.

### Vietnamese

Mọi AI feature lấy cấu hình qua `getAiConfig`; `normalizeAiConfig` chuyển chuỗi CAP/private env thành provider, cờ enabled, model alias, timeout, batch và text limit. Provider/mock normalizer chỉ nhận giá trị biết trước; helper number/boolean tránh lỗi parse env phổ biến. API key vẫn private và module không return nó. Khi debug chỉ xem enabled/provider/mode/limit/alias. Config sai hoặc thiếu phải dẫn tới disabled/fallback qua provider, không lộ config hay làm crash Bug workflow.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: private AI configuration -> provider selection. Inspect feature enablement and safe defaults only; keys, endpoints, and model credentials never belong in this file or its evidence.

### Vietnamese

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: private AI configuration -> provider selection. Chỉ kiểm tra feature enablement và safe default; key, endpoint và model credential không được nằm trong file/evidence này.

## English

### What this file is for

This file reads and normalizes the private AI runtime configuration for IDTS. It is intentionally safe by default: AI is disabled unless private configuration explicitly enables it.

In simple terms, this file answers: "Is AI allowed to run right now, and if yes, which safe provider mode should backend code use?"

### Beginner explanation

CAP loads project configuration into `cds.env`. IDTS already uses this pattern for authentication and email. `srv/ai/config.js` follows the same idea for AI:

- version-controlled defaults live in `package.json`;
- private overrides may live in `.cdsrc-private.json`, `.env`, or Render/AWS environment variables;
- real secrets must never be committed.

`mock` remains the default provider for deterministic tests. IDTS also supports `openai` when an authorized environment owner explicitly supplies a private `openaiApiKey` or `OPENAI_API_KEY` and a model alias; missing configuration stays unavailable safely.

### Flow in IDTS

1. Backend code calls `getAiConfig()`.
2. The file reads `cds.env.idts.ai`.
3. It normalizes booleans, provider name, timeout, input length, model aliases, and mock settings.
4. It returns a frozen config object with `ready`, `missing`, and `unsupported` flags.
5. `srv/ai/provider.js` uses that config to decide whether an AI operation is disabled, mock-backed, or unsupported.

### Important source anchors

- Location: `DEFAULTS`
  - IDTS concept: AI must be disabled by default.
  - Impact if broken: IDTS could accidentally start using AI in local/shared QA without an explicit private decision.
  - Must check together: `package.json` `cds.idts.ai`, `.cdsrc-private.example.json`, and `srv/ai/provider.js`.

- Location: `SUPPORTED_PROVIDERS`
  - IDTS concept: IDTS-64 only adds a safe provider abstraction, not real provider integration.
  - Impact if broken: a developer could think OpenAI/Brevo/other providers are supported when no safe runtime adapter exists.
  - Must check together: future provider adapter tasks and security review `IDTS-71`.

- Location: `normalizeAiConfig()`
  - IDTS concept: runtime safety flags for AI.
  - Impact if broken: feature code may not know whether AI is disabled, unsupported, or ready.
  - Must check together: `scripts/qa/test-idts64-ai-provider.js`.

### Cross-folder impact

- `package.json`: contains non-secret AI defaults under `cds.idts.ai`.
- `.cdsrc-private.example.json`: shows placeholder private override shape.
- `srv/ai/provider.js`: consumes the normalized config.
- `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`: defines why AI must be disabled by default and human-reviewed.

## IDTS-114 Vercel AI Gateway update (2026-07-29)

`vercel` is now an allowed provider, but it is still disabled by default. `runtimeOverrides()` allows only named, non-secret settings such as `IDTS_AI_PROVIDER`, `IDTS_AI_MODEL`, timeout, and fallback switches. The only secret read by this module is the runtime-only `AI_GATEWAY_API_KEY` (or an equivalent private CAP binding property); it must never appear in `package.json`, evidence, or a suggestion audit row.

Model IDs are deliberately not handled by `safeAlias()`: Vercel uses IDs such as `inclusionai/ling-3.0-flash-free` and `alibaba/qwen3.7-flash`. `safeModelId()` preserves the single `provider/model` slash but rejects a URL and `..` path traversal. An explicit `embeddingModelAlias: null` disables embeddings for the low-cost Ling proving phase, so Similar Bugs can use its existing deterministic lexical fallback instead of incorrectly sending a chat model to the embedding endpoint.

Breakpoints: start at `getAiConfig()` to inspect only `enabled`, `provider`, model IDs, `fallbackEnabled`, and `ready`; then enter `normalizeAiConfig()` to see which missing field made a configuration unavailable. Never inspect or copy the gateway key. The next file is `srv/ai/provider.js`.

### Safe editing checklist

- Keep `enabled` default as `false`.
- Do not add real provider keys, endpoints, tokens, or account IDs.
- OpenAI uses the real adapter in `srv/ai/openai-provider.js`; keep its key private and leave `enabled` false in committed defaults.
- Keep aliases sanitized; they are allowed in logs/audit only because they must not contain private endpoint or credential text.

## IDTS-114 BTP dedicated AI binding (2026-07-30)

On SAP BTP, `getAiConfig()` first honors a directly injected `AI_GATEWAY_API_KEY` for local/private compatibility. If it is absent, it reads only the credentials of the user-provided service named `idts-sap01-ai-gateway` from `VCAP_SERVICES`. It accepts `gatewayApiKey`, `aiGatewayApiKey`, or `AI_GATEWAY_API_KEY`.

This exact-name lookup is intentional. `idts-sap01-external-services` remains the retained S3/Brevo binding and is never searched for AI credentials. A malformed or missing VCAP document returns no key, so the provider stays safely unavailable instead of crashing the Bug service. Breakpoints: `getAiConfig()` and `readGatewayApiKeyFromVcap()`; inspect only enabled/provider/aliases/ready, never the key value.

## Tiếng Việt

### File này dùng để làm gì

File này đọc và chuẩn hóa cấu hình AI private/runtime cho IDTS. Mặc định nó an toàn: AI bị tắt trừ khi cấu hình private bật rõ ràng.

Nói dễ hiểu, file này trả lời câu hỏi: "Hiện tại backend có được phép chạy AI không, và nếu có thì dùng provider mode nào an toàn?"

### Giải thích cho người mới

CAP gom cấu hình project vào `cds.env`. IDTS đã dùng cách này cho auth và email. `srv/ai/config.js` dùng cùng pattern đó cho AI:

- default không chứa secret nằm trong `package.json`;
- cấu hình private có thể nằm trong `.cdsrc-private.json`, `.env`, hoặc biến môi trường Render/AWS;
- secret thật tuyệt đối không được commit.

Trong IDTS-64, chỉ hỗ trợ provider `mock`. Đây là quyết định có chủ ý. Mục tiêu task này là tạo lớp backend an toàn trước, chưa gọi provider AI thật hoặc có phí.

### Flow hoạt động trong IDTS

1. Backend gọi `getAiConfig()`.
2. File đọc `cds.env.idts.ai`.
3. File chuẩn hóa boolean, provider name, timeout, giới hạn input, model alias và mock settings.
4. File trả về config object đã freeze, có các cờ `ready`, `missing`, `unsupported`.
5. `srv/ai/provider.js` dùng config này để quyết định AI đang disabled, chạy mock, hay provider không được hỗ trợ.

### Important source anchors

- Vị trí: `DEFAULTS`
  - Khái niệm IDTS: AI phải mặc định tắt.
  - Ảnh hưởng nếu sai: IDTS có thể vô tình chạy AI trong local/shared QA mà chưa có quyết định private.
  - Phải kiểm tra cùng: `package.json` `cds.idts.ai`, `.cdsrc-private.example.json`, và `srv/ai/provider.js`.

- Vị trí: `SUPPORTED_PROVIDERS`
  - Khái niệm IDTS: IDTS-64 chỉ thêm abstraction an toàn, chưa tích hợp provider thật.
  - Ảnh hưởng nếu sai: developer có thể hiểu nhầm rằng OpenAI/Brevo/provider khác đã được support dù chưa có adapter an toàn.
  - Phải kiểm tra cùng: các task provider adapter tương lai và security review `IDTS-71`.

- Vị trí: `normalizeAiConfig()`
  - Khái niệm IDTS: cờ an toàn runtime cho AI.
  - Ảnh hưởng nếu sai: feature code không phân biệt được AI disabled, unsupported hay ready.
  - Phải kiểm tra cùng: `scripts/qa/test-idts64-ai-provider.js`.

### Liên kết với folder khác

- `package.json`: chứa default AI không có secret dưới `cds.idts.ai`.
- `.cdsrc-private.example.json`: mô tả shape cấu hình private bằng placeholder.
- `srv/ai/provider.js`: dùng config đã chuẩn hóa.
- `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`: giải thích vì sao AI phải disabled-by-default và human-reviewed.

### Checklist sửa file an toàn

- Giữ default `enabled` là `false`.
- Không thêm provider key, endpoint thật, token hoặc account ID.
- Nếu thêm provider mới, phải thêm adapter thật, test và evidence security review.
- Model alias phải được sanitize vì alias có thể xuất hiện trong log/audit, không được chứa endpoint hoặc credential private.
