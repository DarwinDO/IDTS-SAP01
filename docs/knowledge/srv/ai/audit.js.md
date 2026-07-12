# Knowledge: `srv/ai/audit.js`

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: NhanT. Flow: reviewed AI result -> AiSuggestions audit. Break at audit creation to prove a feature recorded a suggestion without changing the Bug. Store sanitized feature data only.

### Vietnamese

Primary owner: DonHV. Backup: NhanT. Flow: reviewed AI result -> AiSuggestions audit. Đặt breakpoint tại audit creation để chứng minh feature ghi suggestion mà không đổi Bug. Chỉ lưu feature data đã sanitize.

## English

### What this file is for

This file is the backend-owned writer for AI suggestion audit records.

IDTS does not let the browser create AI audit rows directly. A future AI feature such as duplicate detection, classification suggestion, bug summary, or Smart Assign explanation will call this helper after it receives a safe provider result. The helper then writes one normalized `AiSuggestions` row into the CAP database.

### Beginner explanation

Think of this file as the receipt writer for AI output.

The AI provider may produce a suggestion, but that suggestion is not automatically trusted. IDTS stores it as a reviewable record with:

- which bug it belongs to;
- which AI feature produced it;
- who requested it;
- which provider/model alias was used;
- the safe suggestion payload;
- the human review state, starting as `PENDING`.

This keeps the AI feature auditable without letting AI own the workflow.

### Flow in IDTS

1. A future AI feature calls the AI provider through `srv/ai/provider.js`.
2. The feature receives a safe, normalized result.
3. The feature calls `createAiSuggestion(tx, data)` from this file.
4. This file validates the bug, requester, feature type, and review state.
5. It removes raw prompts, raw messages, provider responses, stack traces, tokens, passwords, and secrets from the payload.
6. It inserts an `idts.cap.AiSuggestions` row.
7. Fiori or QA can later read the safe row through `BugService.AiSuggestions`, but cannot write it directly.

### Important source anchors

- **Location**: `srv/ai/audit.js`, `FEATURE_TYPES`
  **IDTS concept**: Approved AI capability list. These codes match the four AI ideas DonHV approved.
  **Impact if broken**: AI feature work may write inconsistent audit type codes, making reporting and review confusing.
  **Must check together**: `db/data/idts.cap-AiSuggestionFeatureTypes.csv`, `db/schema.cds`, `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`.

- **Location**: `srv/ai/audit.js`, `REVIEW_STATES`
  **IDTS concept**: Human review lifecycle for AI suggestions.
  **Impact if broken**: The system may not distinguish pending, accepted, rejected, ignored, or expired suggestions.
  **Must check together**: `db/data/idts.cap-AiSuggestionReviewStates.csv`, future IDTS-70 review UI.

- **Location**: `srv/ai/audit.js`, `FORBIDDEN_PAYLOAD_KEYS`
  **IDTS concept**: Do not store raw prompt/provider material.
  **Impact if broken**: Private prompt text, provider response, token, password, or diagnostic data may leak into business persistence.
  **Must check together**: `srv/ai/safety.js`, `scripts/qa/test-idts65-ai-suggestion-audit.js`.

- **Location**: `srv/ai/audit.js`, `createAiSuggestion`
  **IDTS concept**: Backend-only AI audit write path.
  **Impact if broken**: AI suggestions may be written without validation or client code may bypass the intended audit boundary.
  **Must check together**: `srv/service.cds` read-only projection, `srv/bug-service/constants.js` read-only guard list, IDTS-65 QA script.

### Cross-folder impact

- `db/schema.cds` defines the persistent `AiSuggestions` entity and its associations.
- `srv/service.cds` exposes `BugService.AiSuggestions` as read-only.
- `db/data/idts.cap-AiSuggestionFeatureTypes.csv` and `db/data/idts.cap-AiSuggestionReviewStates.csv` seed valid codes.
- `scripts/qa/test-idts65-ai-suggestion-audit.js` verifies this helper and the service read-only contract.

### Safe editing checklist

- Do not add raw prompt, raw provider response, hidden reasoning, stack traces, or secret-bearing fields to the audit row.
- Keep this helper backend-owned; do not expose a public OData create action for AI suggestions unless a later task explicitly approves it.
- If a new AI feature type is added, update the seed CSV, this file, tests, and the guardrail docs.
- If the review state lifecycle changes, update the seed CSV, future review UI, and tests together.

## Vietnamese

### File này dùng để làm gì

File này là writer do backend sở hữu để ghi audit record cho AI suggestion.

IDTS không cho browser tự tạo dòng audit AI. Các feature AI sau này như tìm bug trùng, gợi ý phân loại, tóm tắt bug, hoặc giải thích Smart Assign sẽ gọi helper này sau khi nhận được kết quả provider đã được làm sạch. Helper sau đó ghi một dòng `AiSuggestions` đã chuẩn hóa vào CAP database.

### Giải thích cho người mới

Hãy hiểu file này như nơi viết “biên nhận” cho output AI.

AI provider có thể tạo suggestion, nhưng suggestion đó không được tự động tin tưởng. IDTS lưu nó thành một record để người dùng review, gồm:

- suggestion thuộc bug nào;
- feature AI nào tạo ra nó;
- ai là người yêu cầu;
- provider/model alias nào được dùng;
- payload suggestion đã được làm sạch;
- trạng thái review của con người, mặc định là `PENDING`.

Cách này giúp AI có audit rõ ràng nhưng vẫn không để AI sở hữu workflow.

### Flow hoạt động trong IDTS

1. Một feature AI sau này gọi AI provider qua `srv/ai/provider.js`.
2. Feature nhận kết quả đã normalize và an toàn.
3. Feature gọi `createAiSuggestion(tx, data)` từ file này.
4. File này validate bug, requester, feature type và review state.
5. File bỏ raw prompt, raw messages, provider response, stack trace, token, password và secret khỏi payload.
6. File insert một dòng `idts.cap.AiSuggestions`.
7. Fiori hoặc QA sau đó có thể đọc dòng an toàn qua `BugService.AiSuggestions`, nhưng không thể ghi trực tiếp.

### Important source anchors

- **Vị trí**: `srv/ai/audit.js`, `FEATURE_TYPES`
  **Khái niệm IDTS**: Danh sách capability AI đã được duyệt. Các code này khớp bốn ý tưởng AI DonHV đã chốt.
  **Ảnh hưởng nếu sai**: Feature AI có thể ghi sai loại audit, làm phần review/reporting bị rối.
  **Phải kiểm tra cùng**: `db/data/idts.cap-AiSuggestionFeatureTypes.csv`, `db/schema.cds`, `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`.

- **Vị trí**: `srv/ai/audit.js`, `REVIEW_STATES`
  **Khái niệm IDTS**: Vòng đời review của AI suggestion bởi con người.
  **Ảnh hưởng nếu sai**: Hệ thống không phân biệt rõ suggestion đang pending, accepted, rejected, ignored hoặc expired.
  **Phải kiểm tra cùng**: `db/data/idts.cap-AiSuggestionReviewStates.csv`, UI review tương lai IDTS-70.

- **Vị trí**: `srv/ai/audit.js`, `FORBIDDEN_PAYLOAD_KEYS`
  **Khái niệm IDTS**: Không lưu raw prompt hoặc dữ liệu thô từ provider.
  **Ảnh hưởng nếu sai**: Prompt riêng tư, provider response, token, password hoặc diagnostic data có thể bị lưu vào business data.
  **Phải kiểm tra cùng**: `srv/ai/safety.js`, `scripts/qa/test-idts65-ai-suggestion-audit.js`.

- **Vị trí**: `srv/ai/audit.js`, `createAiSuggestion`
  **Khái niệm IDTS**: Đường ghi audit AI chỉ thuộc backend.
  **Ảnh hưởng nếu sai**: AI suggestion có thể được ghi thiếu validation hoặc client có thể bypass boundary audit mong muốn.
  **Phải kiểm tra cùng**: `srv/service.cds` read-only projection, `srv/bug-service/constants.js` read-only guard list, QA script IDTS-65.

### Liên kết với file khác

- `db/schema.cds` định nghĩa entity `AiSuggestions` lưu thật trong database.
- `srv/service.cds` expose `BugService.AiSuggestions` dạng read-only.
- `db/data/idts.cap-AiSuggestionFeatureTypes.csv` và `db/data/idts.cap-AiSuggestionReviewStates.csv` seed các code hợp lệ.
- `scripts/qa/test-idts65-ai-suggestion-audit.js` verify helper này và contract read-only của service.

### Lưu ý khi sửa file này

- Không thêm raw prompt, raw provider response, hidden reasoning, stack trace hoặc field có thể chứa secret vào audit row.
- Giữ helper này là backend-owned; không expose public OData create action cho AI suggestion trừ khi task sau duyệt rõ.
- Nếu thêm AI feature type mới, phải cập nhật seed CSV, file này, test và guardrail docs.
- Nếu đổi lifecycle review state, phải cập nhật seed CSV, UI review tương lai và test cùng lúc.

