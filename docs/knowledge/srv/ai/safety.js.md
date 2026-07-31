# `srv/ai/safety.js`

## Beginner-first execution map (2026-07-18)

### English

Provider, audit and feature builders call this module at every untrusted text boundary. `redactSensitiveText` removes known secret/diagnostic patterns and limits length. `sanitizeErrorSummary` converts Error/provider responses into generic safe text. Diagnostic/feature token helpers allow only bounded characters. `containsUnsafeDiagnosticText` is a final guard that forces fallback when generated output still resembles SQL, stack traces or credentials. These functions return sanitized values and have no persistence/network side effect. Test both ordinary text preservation and malicious/secret-like text removal.

### Vietnamese

Provider, audit và feature builder gọi module này tại mọi ranh giới text không tin cậy. `redactSensitiveText` bỏ pattern secret/diagnostic đã biết và giới hạn độ dài. `sanitizeErrorSummary` chuyển Error/provider response thành text chung an toàn. Helper diagnostic/feature token chỉ cho ký tự có giới hạn. `containsUnsafeDiagnosticText` là hàng rào cuối buộc fallback khi output vẫn giống SQL, stack trace hoặc credential. Các hàm chỉ return giá trị đã sanitize, không có side effect DB/network. Phải test cả text bình thường được giữ và text độc hại/giống secret bị loại.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: raw candidate input/output -> safe AI boundary. Break at redaction/sanitization when a provider error or suspicious prompt reaches the feature. This module protects logs and audit evidence as well as provider calls.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: raw candidate input/output -> safe AI boundary. Đặt breakpoint tại redaction/sanitization khi provider error hoặc prompt đáng ngờ đi vào feature. Module này bảo vệ log/audit evidence lẫn provider call.

## English

### What this file is for

This file contains small safety helpers used before and after AI provider calls. It removes secret-like text from prompts and keeps error diagnostics safe for logs, tests, and future audit records.

### Beginner explanation

Bug text is user input. A user may accidentally paste a token, database URL, SMTP password, or private key into a bug description. Before IDTS sends any text to an AI provider, the backend must redact obvious secret patterns. If a provider fails, the error must also be cleaned before it reaches a user-visible response or evidence file.

### Flow in IDTS

1. Provider wrapper receives a request.
2. Text fields pass through `redactSensitiveText()`.
3. Feature names and diagnostic codes pass through `safeFeatureType()` or `sanitizeDiagnosticToken()`.
4. Provider errors pass through `sanitizeErrorSummary()`.
5. Tests use `containsUnsafeDiagnosticText()` to prove unsafe SQL/token/key-like details are not returned.

### Important source anchors

- Location: `SECRET_PATTERNS`
  - IDTS concept: minimum data boundary before AI calls.
  - Impact if broken: secrets may enter prompts, logs, or evidence.
  - Must check together: `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` and `scripts/qa/test-idts64-ai-provider.js`.

- Location: `sanitizeErrorSummary()`
  - IDTS concept: user-safe provider failure handling.
  - Impact if broken: raw SQL, token names, provider details, or stack-like text may leak.
  - Must check together: `srv/ai/provider.js`.

### Cross-folder impact

- `srv/ai/provider.js`: uses these helpers for every AI operation.
- `scripts/qa/test-idts64-ai-provider.js`: verifies redaction and no-leak behavior.
- Future AI feature tasks must reuse these helpers before provider calls.

### Safe editing checklist

- Add redaction patterns conservatively; avoid breaking normal bug text unnecessarily.
- Never log raw provider request/response just to debug a failure.
- Keep user-facing error text generic.

## 2026-07-31 storage-bound correction

`redactSensitiveText()` previously kept `maxLength` source characters and then
appended a truncation marker. A 500-character audit value therefore became 512
characters and HANA rejected `AiSuggestions.summary : String(500)`. The helper
now reserves space for the marker, so the complete returned string never
exceeds the caller's limit. Break here when an AI operation succeeds but its
audit insert fails with a column-length error.

`redactSensitiveText()` trước đây giữ đủ `maxLength` ký tự rồi mới nối thêm dấu
đã cắt. Vì vậy giá trị audit giới hạn 500 ký tự lại dài thành 512 ký tự và HANA
từ chối ghi vào `AiSuggestions.summary : String(500)`. Helper hiện chừa sẵn chỗ
cho dấu đã cắt, nên toàn bộ chuỗi trả về không bao giờ vượt giới hạn caller yêu
cầu. Hãy đặt breakpoint tại đây khi provider trả SUCCESS nhưng bước ghi audit
bị lỗi độ dài cột.

## Tiếng Việt

### File này dùng để làm gì

File này chứa các helper an toàn dùng trước và sau khi gọi AI provider. Nó loại bỏ text giống secret khỏi prompt và làm sạch lỗi để log, test hoặc audit sau này không lộ dữ liệu nhạy cảm.

### Giải thích cho người mới

Nội dung bug là input từ người dùng. Người dùng có thể vô tình paste token, database URL, SMTP password hoặc private key vào description. Trước khi IDTS gửi text nào cho AI provider, backend phải redact các pattern giống secret. Nếu provider lỗi, lỗi đó cũng phải được làm sạch trước khi trả ra response hoặc lưu evidence.

### Flow hoạt động trong IDTS

1. Provider wrapper nhận request.
2. Các field dạng text đi qua `redactSensitiveText()`.
3. Tên feature và diagnostic code đi qua `safeFeatureType()` hoặc `sanitizeDiagnosticToken()`.
4. Lỗi provider đi qua `sanitizeErrorSummary()`.
5. Test dùng `containsUnsafeDiagnosticText()` để chứng minh không trả ra raw SQL/token/key-like details.

### Important source anchors

- Vị trí: `SECRET_PATTERNS`
  - Khái niệm IDTS: ranh giới dữ liệu tối thiểu trước khi gọi AI.
  - Ảnh hưởng nếu sai: secret có thể đi vào prompt, log hoặc evidence.
  - Phải kiểm tra cùng: `docs/ba/discovery/idts-63-ai-assistance-guardrails.md` và `scripts/qa/test-idts64-ai-provider.js`.

- Vị trí: `sanitizeErrorSummary()`
  - Khái niệm IDTS: xử lý lỗi provider theo hướng an toàn cho người dùng.
  - Ảnh hưởng nếu sai: raw SQL, token name, provider detail hoặc stack-like text có thể bị lộ.
  - Phải kiểm tra cùng: `srv/ai/provider.js`.

### Liên kết với folder khác

- `srv/ai/provider.js`: dùng helper này cho mọi AI operation.
- `scripts/qa/test-idts64-ai-provider.js`: verify redaction và no-leak behavior.
- Các task AI sau này phải tái dùng helper này trước khi gọi provider.

### Checklist sửa file an toàn

- Thêm redaction pattern vừa đủ; tránh làm hỏng nội dung bug bình thường.
- Không log raw provider request/response chỉ để debug.
- Giữ lỗi hiển thị cho user ở mức generic.
