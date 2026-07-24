# `srv/ai/index.js`

## IDTS-95 duplicate confirmation export

### English

The public AI module entry point now exports `confirmDuplicateSuggestion` from `duplicate-confirmation.js`. `srv/service.js` imports it only through this index, keeping the service wiring independent of the feature file path. The export changes no provider configuration and does not call AI by itself.

Primary owner: SangVN. Backup: DonHV. Debug from the `confirmDuplicateSuggestion` import/export here to its registration in `srv/service.js`, then into `srv/ai/duplicate-confirmation.js`.

### Vietnamese

Entry point chung của AI hiện export `confirmDuplicateSuggestion` từ `duplicate-confirmation.js`. `srv/service.js` chỉ import qua index này để wiring của service không phụ thuộc trực tiếp đường dẫn file feature. Export này không đổi provider config và tự nó không gọi AI.

Owner chính: SangVN. Backup: DonHV. Khi debug, trace từ import/export `confirmDuplicateSuggestion` tại đây sang registration trong `srv/service.js`, sau đó vào `srv/ai/duplicate-confirmation.js`.

## Beginner-first module map (2026-07-18)

### English

This is an export barrel only. `srv/service.js` imports four feature entry points from here; tests may import pure builders/config/safety helpers. Requiring this file loads modules but does not call AI, query data or write audit. Trace an action from its exported name to `duplicate-detection`, `classification-suggestion`, `bug-summary`, or `assignment-explanation`; shared calls then go to provider, safety and audit. Keep exports explicit so a service action cannot accidentally use an unsafe internal helper.

### Vietnamese

Đây chỉ là file gom export. `srv/service.js` import bốn feature entry point từ đây; test có thể import pure builder/config/safety helper. Require file này chỉ load module, không gọi AI, query data hay ghi audit. Lần một action từ tên export sang `duplicate-detection`, `classification-suggestion`, `bug-summary` hoặc `assignment-explanation`; sau đó các lời gọi dùng chung đi tới provider, safety và audit. Giữ export rõ ràng để service action không vô tình dùng helper nội bộ thiếu bảo vệ.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: BugService AI-action wiring. This barrel identifies the supported AI public surface; changing exports requires matching `srv/service.js`, service CDS action declarations, UI caller, and focused tests.

### Vietnamese

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: BugService AI-action wiring. Barrel này xác định AI public surface được hỗ trợ; đổi export phải kiểm tra cùng `srv/service.js`, service CDS action declaration, UI caller và focused test.

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
## IDTS-67 Classification Suggestion Export Update

### English

IDTS-67 exports `suggestClassification` for the CAP service handler and `buildClassificationSuggestions` for focused backend verification.

The classification logic remains in `srv/ai/classification-suggestion.js`. This index keeps `srv/service.js` from importing deep feature files directly and gives tests a stable import boundary.

### Vietnamese

IDTS-67 export thêm `suggestClassification` cho CAP service handler và `buildClassificationSuggestions` cho focused backend verification.

Logic phân loại vẫn nằm trong `srv/ai/classification-suggestion.js`. Index này giúp `srv/service.js` không phải import sâu vào từng file feature và giúp test có một import boundary ổn định.

## IDTS-68 Export Update

### English

IDTS-68 exports `summarizeBugHandoff` and `buildBugHandoffSummary` from this index file.

This lets `srv/service.js` import the new bug summary action from the same stable AI module boundary as duplicate detection and classification suggestion.

### Vietnamese

IDTS-68 export `summarizeBugHandoff` va `buildBugHandoffSummary` tu index file nay.

Nho vay `srv/service.js` co the import action bug summary moi tu cung mot module boundary on dinh voi duplicate detection va classification suggestion.

## IDTS-69 Assignment Explanation Export Update

### English

IDTS-69 additionally exports `explainSmartAssignment` for the CAP service handler and `buildAssignmentExplanations` for focused backend verification.

The explanation logic remains in `srv/ai/assignment-explanation.js`. This index only keeps the backend import boundary stable, so `srv/service.js` can import from `srv/ai` instead of reaching into each AI feature file directly.

### Vietnamese

IDTS-69 export them `explainSmartAssignment` cho CAP service handler va `buildAssignmentExplanations` cho focused backend verification.

Logic giai thich assignment van nam trong `srv/ai/assignment-explanation.js`. File index nay chi giu import boundary on dinh de `srv/service.js` import tu `srv/ai` thay vi import sau vao tung feature file.

## IDTS-91/93 review and apply exports

### English

The barrel now exports the three review actions from `review.js` and the accepted-classification apply action from `classification-apply.js`. Primary owner: DonHV; backup: DatDT. Debug from the exported action name into its focused module, then confirm `srv/service.js` registers the same name and `srv/service.cds` declares the matching OData action. Keep these exports explicit; removing or renaming one can leave metadata and runtime wiring out of sync.

### Vietnamese

Barrel hiện export ba review action từ `review.js` và action áp dụng classification đã Accept từ `classification-apply.js`. Owner chính: DonHV; backup: DatDT. Khi debug, đi từ tên action được export vào module tập trung, rồi xác nhận `srv/service.js` đăng ký đúng tên và `srv/service.cds` khai báo OData action tương ứng. Giữ export rõ ràng; xóa hoặc đổi tên một action có thể làm metadata lệch runtime wiring.
