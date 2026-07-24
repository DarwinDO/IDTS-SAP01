# `srv/ai/duplicate-detection.js`

## Beginner-first execution map (2026-07-18)

### English

`service.js` calls `suggestSimilarBugs`. Execution is: resolve source Bug/text → query candidate Bugs → ask provider for embeddings when available → `rankSimilarBugCandidates` → `scoreCandidate` → enrich names/status → audit → return sorted review rows. Scoring combines title/description token overlap, classification matches and valid cosine similarity; provider failure is converted to deterministic fallback. `embeddingText` sends only bounded Bug text/classification. Candidate concurrency/limit/minScore are bounded. No DuplicateLinks row is created here; the user must separately confirm a duplicate relation. Debug `input`, candidate count, provider status/vector validity, score components, threshold, ranked output and audit. A no-result is valid when every score is below threshold.

### Vietnamese

`service.js` gọi `suggestSimilarBugs`. Thứ tự: resolve source Bug/text → query candidate Bugs → xin embedding khi provider có sẵn → `rankSimilarBugCandidates` → `scoreCandidate` → enrich tên/status → audit → trả row review đã sort. Điểm kết hợp overlap token title/description, classification match và cosine hợp lệ; provider fail chuyển sang fallback deterministic. `embeddingText` chỉ gửi text/classification Bug đã giới hạn. Concurrency/limit/minScore đều bị giới hạn. File không tạo DuplicateLinks; user phải xác nhận quan hệ duplicate riêng. Debug `input`, số candidate, provider status/vector hợp lệ, thành phần score, threshold, ranked output và audit. Không có kết quả là hợp lệ khi mọi score dưới ngưỡng.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: Similar Bugs review. Start at `suggestSimilarBugs`, inspect bounded candidates, provider status, score, and audit row. The result must remain a suggestion; it must not write `DuplicateLinks` automatically.

### Vietnamese

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: Similar Bugs review. Bắt đầu tại `suggestSimilarBugs`, quan sát bounded candidate, provider status, score và audit row. Kết quả luôn là suggestion; không được tự ghi `DuplicateLinks`.

## English

### What this file is for

This file implements the IDTS backend feature that suggests existing bugs which may be duplicates or closely related to a bug being written or reviewed.

It does **not** confirm a duplicate. It returns ranked candidates so a human can inspect them. It never creates `DuplicateLinks`, never blocks bug creation, and never changes assignment or lifecycle status.

### Beginner explanation

Two bug reports can describe the same problem using slightly different words. An exact-text search may miss that. This module compares candidates in three ways:

1. **Text overlap**: meaningful words shared by the title and description.
2. **Business classification**: matching SAP module, application component, defect category, and component/category.
3. **Embedding similarity**: how close the numeric vectors returned by the configured AI provider are.

The signals are combined into a score from `0` to `1`. A high score means “worth reviewing”, not “confirmed duplicate”. The result includes a short reason such as “very similar title” or “same application component”.

If AI is disabled, times out, fails, or returns an invalid vector, the module falls back to deterministic text and classification matching. The normal IDTS workflow remains available.

### Flow in IDTS

1. An authenticated client calls `POST /odata/v4/bug/suggestSimilarBugs`.
2. The request contains either a persisted `sourceBugID`, or draft-like title, description, status, and classification values before create.
3. The module reads up to 50 recently modified existing bugs and excludes the source bug itself. This is the bounded, database-portable MVP fallback while no vector index exists.
4. Code-list IDs are resolved to readable status, module, component, and category context before embedding requests are built.
5. `srv/ai/provider.js` sanitizes and runs embedding calls with a maximum concurrency of four.
6. This module calculates the hybrid score, removes low-confidence results, sorts candidates, and returns at most ten.
7. If a persisted source bug exists, a safe `AiSuggestions` audit row is written. A pre-create search does not invent a fake bug link, so it does not write an audit row yet.
8. The user may ignore every result without any workflow side effect.

### Important source anchors

- **Location**: `suggestSimilarBugs()`
  - **IDTS concept**: public suggestion-only request orchestration.
  - **Impact if broken**: the API may return the source bug itself, leak unsafe fields, or mutate confirmed duplicate data.
  - **Must check together**: `srv/service.cds`, `srv/service.js`, `srv/ai/audit.js`, and `scripts/qa/test-idts66-duplicate-detection.js`.

- **Location**: `rankSimilarBugCandidates()` and `scoreCandidate()`
  - **IDTS concept**: hybrid ranking, not autonomous decision making.
  - **Impact if broken**: unrelated bugs may receive misleading confidence, or useful candidates may disappear.
  - **Must check together**: score thresholds, relation labels, and positive/unrelated test fixtures.

- **Location**: `enrichSemanticContext()` and `embeddingText()`
  - **IDTS concept**: minimum readable context sent to the embedding seam.
  - **Impact if broken**: embeddings may receive meaningless UUID-only context or unnecessary private data.
  - **Must check together**: `srv/ai/provider.js` request sanitization and the business allowlist in `docs/project-context.md`.

- **Location**: `recordSuggestionAudit()`
  - **IDTS concept**: traceable human-review evidence.
  - **Impact if broken**: persisted searches may have no audit trail, or raw prompts/provider responses may be stored.
  - **Must check together**: `db/schema.cds` `AiSuggestions`, `srv/ai/audit.js`, and `BugService.AiSuggestions`.

### Cross-folder impact

- `srv/service.cds` declares the unbound OData action and structured result.
- `srv/service.js` routes that action to this module.
- `db/schema.cds` provides `Bugs`, `DuplicateLinks`, and `AiSuggestions`; this module reads Bugs and may write only a safe AI audit row.
- `scripts/qa/test-idts66-duplicate-detection.js` proves ranking, fallback, no-result, malformed-output, audit, and no-auto-link behavior.
- A later Fiori task such as IDTS-70 may display candidates, but must still label them as suggestions requiring review.

### Safe editing checklist

- Keep `DuplicateLinks` write-free in this module.
- Keep bug creation and lifecycle actions independent from AI availability.
- Do not add comments, attachments, email addresses, credentials, storage references, or raw provider output to embedding input or audit payloads.
- Test unrelated examples whenever score weights or thresholds change.
- Keep SQLite and PostgreSQL portability. The current on-demand scan is intentionally capped for the small QA dataset; adding pgvector or another durable vector index requires a separate reviewed infrastructure task before production-scale use.
- Update this mirror and the service mirrors when the action contract changes.

## Tiếng Việt

### File này dùng để làm gì

File này triển khai tính năng backend IDTS dùng để gợi ý các bug hiện có có thể bị trùng hoặc có nội dung gần giống với bug đang được viết hay đang được xem lại.

File này **không xác nhận bug trùng**. Nó chỉ trả về danh sách ứng viên đã xếp hạng để con người kiểm tra. Nó không tự tạo `DuplicateLinks`, không chặn việc tạo bug, và không thay đổi assignment hay trạng thái vòng đời.

### Giải thích cho người mới

Hai báo cáo bug có thể mô tả cùng một vấn đề nhưng dùng từ khác nhau. Tìm kiếm khớp chính xác theo chuỗi có thể bỏ sót trường hợp đó. Module này so sánh ứng viên theo ba cách:

1. **Mức trùng từ ngữ**: các từ quan trọng giống nhau trong title và description.
2. **Phân loại nghiệp vụ**: SAP module, application component, defect category và component/category có khớp hay không.
3. **Độ tương đồng embedding**: các vector số do AI provider trả về gần nhau đến mức nào.

Các tín hiệu được kết hợp thành điểm từ `0` đến `1`. Điểm cao chỉ có nghĩa là “nên xem lại”, không có nghĩa là “đã xác nhận trùng”. Kết quả còn có lý do ngắn như “title rất giống” hoặc “cùng application component”.

Nếu AI bị tắt, timeout, lỗi hoặc trả vector sai định dạng, module quay về cách so khớp text và classification có tính xác định. Workflow IDTS bình thường vẫn hoạt động.

### Flow hoạt động trong IDTS

1. Client đã đăng nhập gọi `POST /odata/v4/bug/suggestSimilarBugs`.
2. Request gửi `sourceBugID` của bug đã lưu, hoặc gửi title, description, status và classification giống dữ liệu draft trước khi create.
3. Module đọc tối đa 50 bug hiện có được sửa gần nhất và loại chính bug nguồn khỏi danh sách. Đây là fallback MVP có giới hạn, chạy được trên nhiều database khi chưa có vector index.
4. ID code list được đổi thành context dễ đọc về status, module, component và category trước khi tạo embedding request.
5. `srv/ai/provider.js` sanitize và chạy embedding call với tối đa bốn call đồng thời.
6. Module tính điểm hybrid, loại kết quả điểm thấp, sắp xếp ứng viên và trả tối đa mười kết quả.
7. Nếu có bug nguồn đã lưu, hệ thống ghi một `AiSuggestions` audit row an toàn. Tìm kiếm trước khi create không tạo bug link giả nên chưa ghi audit row.
8. Người dùng có thể bỏ qua toàn bộ kết quả mà không gây side effect cho workflow.

### Các điểm neo quan trọng trong source

- **Vị trí**: `suggestSimilarBugs()`
  - **Khái niệm IDTS**: điều phối request suggestion-only công khai.
  - **Ảnh hưởng nếu sai**: API có thể trả chính bug nguồn, làm lộ field không an toàn hoặc thay đổi dữ liệu duplicate đã xác nhận.
  - **Phải kiểm tra cùng**: `srv/service.cds`, `srv/service.js`, `srv/ai/audit.js` và `scripts/qa/test-idts66-duplicate-detection.js`.

- **Vị trí**: `rankSimilarBugCandidates()` và `scoreCandidate()`
  - **Khái niệm IDTS**: xếp hạng hybrid, không phải AI tự quyết định.
  - **Ảnh hưởng nếu sai**: bug không liên quan có thể nhận điểm gây hiểu nhầm, hoặc ứng viên hữu ích bị loại.
  - **Phải kiểm tra cùng**: threshold, nhãn relation và fixture positive/unrelated.

- **Vị trí**: `enrichSemanticContext()` và `embeddingText()`
  - **Khái niệm IDTS**: chỉ gửi context tối thiểu và có ý nghĩa vào embedding seam.
  - **Ảnh hưởng nếu sai**: embedding có thể chỉ nhận UUID vô nghĩa hoặc nhận dữ liệu private không cần thiết.
  - **Phải kiểm tra cùng**: bước sanitize request trong `srv/ai/provider.js` và allowlist nghiệp vụ trong `docs/project-context.md`.

- **Vị trí**: `recordSuggestionAudit()`
  - **Khái niệm IDTS**: bằng chứng có thể truy vết cho human review.
  - **Ảnh hưởng nếu sai**: tìm kiếm trên bug đã lưu có thể thiếu audit trail, hoặc raw prompt/provider response có thể bị lưu.
  - **Phải kiểm tra cùng**: `AiSuggestions` trong `db/schema.cds`, `srv/ai/audit.js` và `BugService.AiSuggestions`.

### Liên kết với file/folder khác

- `srv/service.cds` khai báo unbound OData action và cấu trúc result.
- `srv/service.js` chuyển action đó vào module này.
- `db/schema.cds` cung cấp `Bugs`, `DuplicateLinks` và `AiSuggestions`; module này đọc Bugs và chỉ có thể ghi AI audit row an toàn.
- `scripts/qa/test-idts66-duplicate-detection.js` chứng minh ranking, fallback, no-result, malformed-output, audit và no-auto-link.
- Task Fiori sau như IDTS-70 có thể hiển thị ứng viên, nhưng vẫn phải ghi rõ đây là suggestion cần review.

### Checklist sửa file an toàn

- Không ghi `DuplicateLinks` trong module này.
- Giữ create bug và lifecycle action độc lập với việc AI có hoạt động hay không.
- Không đưa comment, attachment, email, credential, storage reference hoặc raw provider output vào embedding input hay audit payload.
- Luôn test ví dụ không liên quan khi đổi trọng số hoặc threshold.
- Giữ khả năng chạy trên SQLite và PostgreSQL. Cách scan theo request hiện tại được giới hạn cho bộ dữ liệu QA nhỏ; trước khi dùng ở quy mô production, pgvector hoặc vector index bền vững khác phải có task hạ tầng riêng được review.
- Cập nhật mirror này và mirror service khi đổi contract action.

## IDTS-92 persisted review ID

### English

For a saved source Bug, `recordSuggestionAudit()` now returns the created audit row and `suggestSimilarBugs()` adds that row's `suggestionID` to every candidate. The UI uses this ID only to review the persisted suggestion; it is not a Bug ID and does not authorize a duplicate link. Primary owner: DonHV; backup: DatDT. Debug at the audit call and confirm every returned row shares the same ID. Check with `review.js`, `DuplicateReview.js`, and IDTS-66/91/92 tests.

### Vietnamese

Với Bug nguồn đã lưu, `recordSuggestionAudit()` hiện trả audit row vừa tạo và `suggestSimilarBugs()` gắn `suggestionID` đó vào mọi candidate. UI chỉ dùng ID này để review suggestion đã persist; đây không phải Bug ID và không cho quyền tạo duplicate link. Owner chính: DonHV; backup: DatDT. Khi debug, dừng tại lời gọi audit và xác nhận mọi row trả về dùng cùng một ID. Kiểm cùng `review.js`, `DuplicateReview.js` và test IDTS-66/91/92.
