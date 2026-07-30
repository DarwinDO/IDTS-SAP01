# `srv/ai/assignment-explanation.js`

## Candidate-reference JSON Schema (2026-07-30)

`buildAssignmentOutputSchema()` constrains the structured result to short references created for the current request (`C1`, `C2`, ...). Each returned item must contain `candidateRef`, `explanation` and `confidence`. The provider never receives a developer profile UUID and cannot create a candidate outside the backend list.

Debug order: candidate query → assign short references → `buildAssignmentOutputSchema()` → provider call → `providerRowsByCandidateRef()` → deterministic fallback for missing rows. AI remains advisory; the Assign action and backend authorization/validation remain mandatory.

Tiếng Việt: backend cấp mã tạm `C1`, `C2`; model chỉ giải thích theo các mã này rồi backend ghép lại với Developer thật. AI không thể tự thêm người ngoài danh sách hoặc tự assign.

## IDTS-114 stable candidate-reference contract (2026-07-30)

The provider no longer receives `developerProfileID` UUID values. After IDTS reads and sorts eligible candidates, it assigns backend-only references `C1`, `C2`, and so on. `buildProviderInput()` sends only `candidateRef` plus allow-listed facts. The provider must return that exact ref; `buildAssignmentExplanations()` maps it back to the real candidate in memory.

Returned OData rows retain `developerProfileID` for the final user-selected assignment, but now include `explanationSource`: `AI` only for a mapped provider explanation and `RULES` for deterministic guidance. Debug `buildProviderInput()` then `providerRowsByCandidateRef()`; never infer model output merely from 55% or 72% confidence.

## IDTS-97 operational evidence

`recordAssignmentAudit()` stores only normalized provider status and duration for the feature-level audit. Candidate personal/contact data, prompt, raw response, and error detail are not operational metric fields.

## Beginner-first execution map (2026-07-18)

### English

`explainSmartAssignment` resolves Bug/component/module input, reads assignable candidate profiles/responsibilities and workload, builds a bounded provider request, then merges provider rows by real candidate ID. Missing, hallucinated or unsafe provider explanations are replaced by `fallbackExplanation` grounded in suitability, availability and workload. Every public row carries warnings/confidence/provider/grounding/review status. Audit stores a safe summary/payload. This feature explains existing candidates; it does not rank with hidden authority, choose a developer, or call assignment action. Debug input IDs → candidate context → workload map → provider rows keyed by candidate ID → fallback/row builder → audit/result. Backend `validateAssignee` remains the final assignment gate.

### Vietnamese

`explainSmartAssignment` resolve input Bug/component/module, đọc candidate profile/responsibility và workload có thể assign, dựng provider request có giới hạn, rồi ghép provider row theo candidate ID thật. Explanation provider thiếu, hallucinate hoặc không an toàn được thay bằng `fallbackExplanation` grounded trên suitability, availability và workload. Mỗi public row có warning/confidence/provider/grounding/review status. Audit lưu summary/payload an toàn. Feature chỉ giải thích candidate hiện có; nó không ranking bằng quyền ẩn, không chọn developer và không gọi assignment action. Debug theo input ID → candidate context → workload map → provider row theo candidate ID → fallback/row builder → audit/result. Backend `validateAssignee` vẫn là hàng rào assign cuối.

## Ownership and debug anchor / Ownership và điểm dừng debug

### English

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: candidate developer -> explanation row. Inspect explanation fallback and validation when the Smart Assign dialog is misleading. Human selection and backend `assignToDeveloper` remain authoritative.

### Vietnamese

Primary owner: DonHV. Backup: DatDT/NhanT. Flow: candidate developer -> explanation row. Quan sát explanation fallback/validation khi Smart Assign dialog gây hiểu nhầm. Human selection và backend `assignToDeveloper` vẫn là authoritative.

## English

### What this file is for

This file implements the backend logic for IDTS-69: AI-assisted explanation for Smart Assign developer candidates.

It does not assign a developer. It only explains why each already-eligible developer may fit the bug, then leaves the final decision to the Tester or PM.

### Beginner explanation

Smart Assign already knows which developers are valid candidates because the backend checks `DeveloperResponsibilities`, active profiles, component category, SAP module, and availability data. This file adds an explanation layer on top of that candidate list.

Think of it as a review note beside each candidate:

- why the developer matches the component/category,
- what their current workload looks like,
- whether they appear busy or unavailable,
- whether the AI provider was used or the deterministic fallback was used,
- why the user must still review the suggestion manually.

The important rule is: AI helps explain, but IDTS still uses normal backend validation before an assignment is saved.

### Flow in IDTS

1. The Smart Assign UI calls the unbound OData action `explainSmartAssignment`.
2. `srv/service.js` routes the action into this module.
3. This module reads the same candidate source used by `/AssignableDevelopers`.
4. It gathers workload context from existing `Bugs`.
5. It asks the AI provider for structured explanations when AI is enabled.
6. If AI is disabled, fails, or returns unsafe text, it falls back to safe deterministic explanations.
7. If a source bug exists, it writes a sanitized `AiSuggestions` audit row.
8. It returns explanation rows to the UI without mutating `Bugs` or choosing an assignee.

### Important source anchors

- **Location**: `srv/ai/assignment-explanation.js`, `async function explainSmartAssignment(req, entities)`
  **IDTS concept**: Public action handler for Smart Assign explanation. It turns request parameters into safe candidate explanations.
  **Impact if broken**: The UI may show no explanation, leak provider diagnostics, or accidentally treat an AI suggestion as an assignment decision.
  **Must check together**: `srv/service.cds` `action explainSmartAssignment(...)`, `srv/service.js`, `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, and `scripts/qa/test-idts69-assignment-explanation.js`.

- **Location**: `buildAssignableDeveloperRows(tx, entities, criteria)`
  **IDTS concept**: Reuses the existing backend candidate model instead of duplicating assignment rules inside the AI module.
  **Impact if broken**: AI explanations may describe candidates that the real Smart Assign dialog would not allow, causing user confusion.
  **Must check together**: `srv/bug-service/read-models.js`, `/AssignableDevelopers`, DeveloperProfiles, DeveloperResponsibilities, and backend assignment validation.

- **Location**: fallback explanation builder
  **IDTS concept**: Safe no-AI behavior. Smart Assign remains useful even when AI is disabled or unavailable.
  **Impact if broken**: A provider outage could break the assignment dialog, which would violate the IDTS AI guardrail that AI must not block the workflow.
  **Must check together**: `srv/ai/provider.js`, `srv/ai/config.js`, `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`, and IDTS-69 QA evidence.

- **Location**: audit writer call using `createAiSuggestion`
  **IDTS concept**: Suggestion traceability. When the action is source-bug-based, IDTS records a sanitized audit trail for later review.
  **Impact if broken**: PM/QA cannot prove what AI suggested, or unsafe payload could be persisted.
  **Must check together**: `srv/ai/audit.js`, `db/schema.cds` `AiSuggestions`, `srv/bug-service/constants.js`, and AI suggestion review UI tasks.

### Cross-folder impact

- `srv/service.cds` defines the OData contract consumed by the UI.
- `srv/service.js` wires the action into CAP runtime.
- `srv/bug-service/read-models.js` supplies candidate rows.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` displays the explanation beside candidates.
- `scripts/qa/test-idts69-assignment-explanation.js` verifies provider success, fallback, audit, missing classification, and non-mutation behavior.

### Safe editing checklist

- Do not let AI select or assign the developer automatically.
- Do not send email addresses, password hashes, tokens, credentials, private URLs, attachment content, or full sensitive bug text to the provider.
- Keep fallback behavior working when AI is disabled or unavailable.
- Keep `requiresReview = true` because the explanation is advisory.
- Rerun `npm run qa:idts69:programmatic` and `npm run qa:idts56:programmatic` after changes.

## Vietnamese

### File nay dung de lam gi

File nay trien khai logic backend cho IDTS-69: giai thich bang AI cho cac ung vien developer trong Smart Assign.

No khong tu phan cong developer. No chi giai thich vi sao tung developer hop voi bug, sau do Tester hoac PM van la nguoi quyet dinh cuoi cung.

### Giai thich cho nguoi moi

Smart Assign da co san danh sach developer hop le vi backend kiem tra `DeveloperResponsibilities`, profile con active, component category, SAP module va availability. File nay them mot lop giai thich len tren danh sach do.

Co the hieu moi dong la mot ghi chu review:

- vi sao developer hop voi component/category,
- workload hien tai cua developer,
- developer co dang busy hoac unavailable khong,
- AI provider co duoc dung hay fallback deterministic duoc dung,
- vi sao user van phai tu review truoc khi chon.

Quy tac quan trong: AI chi ho tro giai thich, con IDTS van dung backend validation binh thuong truoc khi luu assignment.

### Flow hoat dong trong IDTS

1. Smart Assign UI goi unbound OData action `explainSmartAssignment`.
2. `srv/service.js` noi action nay vao module nay.
3. Module doc cung nguon candidate ma `/AssignableDevelopers` dang dung.
4. Module gom context workload tu entity `Bugs`.
5. Neu AI duoc bat, module goi provider de lay explanation co cau truc.
6. Neu AI tat, loi, hoac tra ve noi dung khong an toan, module dung fallback an toan.
7. Neu co source bug, module ghi audit row `AiSuggestions` da sanitize.
8. Module tra ve explanation cho UI ma khong sua `Bugs` va khong tu chon assignee.

### Important source anchors

- **Vi tri**: `srv/ai/assignment-explanation.js`, `async function explainSmartAssignment(req, entities)`
  **Khai niem IDTS**: Handler cho action giai thich Smart Assign. No bien request thanh cac dong explanation an toan.
  **Anh huong neu sai**: UI co the khong co explanation, lam lo diagnostic cua provider, hoac lam nguoi dung hieu nham AI la quyet dinh phan cong.
  **Phai kiem tra cung**: `srv/service.cds` `action explainSmartAssignment(...)`, `srv/service.js`, `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`, va `scripts/qa/test-idts69-assignment-explanation.js`.

- **Vi tri**: `buildAssignableDeveloperRows(tx, entities, criteria)`
  **Khai niem IDTS**: Tai su dung nguon candidate backend hien co thay vi viet lai rule assignment trong module AI.
  **Anh huong neu sai**: AI co the giai thich cho developer ma Smart Assign that su khong cho phep, gay sai lech voi nguoi dung.
  **Phai kiem tra cung**: `srv/bug-service/read-models.js`, `/AssignableDevelopers`, DeveloperProfiles, DeveloperResponsibilities, va backend assignment validation.

- **Vi tri**: fallback explanation builder
  **Khai niem IDTS**: Co che an toan khi khong co AI. Smart Assign van dung duoc khi AI tat hoac provider loi.
  **Anh huong neu sai**: Loi provider co the lam hong dialog assignment, trai voi guardrail AI cua IDTS la AI khong duoc chan workflow chinh.
  **Phai kiem tra cung**: `srv/ai/provider.js`, `srv/ai/config.js`, `docs/ba/discovery/idts-63-ai-assistance-guardrails.md`, va evidence IDTS-69.

- **Vi tri**: audit writer call dung `createAiSuggestion`
  **Khai niem IDTS**: Luu vet suggestion. Khi action co source bug, IDTS ghi audit trail da sanitize de review sau.
  **Anh huong neu sai**: PM/QA khong chung minh duoc AI da goi y gi, hoac payload khong an toan bi luu vao DB.
  **Phai kiem tra cung**: `srv/ai/audit.js`, `db/schema.cds` `AiSuggestions`, `srv/bug-service/constants.js`, va task UI review AI suggestion.

### Lien ket voi folder khac

- `srv/service.cds` dinh nghia contract OData cho UI goi.
- `srv/service.js` noi action vao CAP runtime.
- `srv/bug-service/read-models.js` cung cap candidate rows.
- `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js` hien explanation ben canh candidate.
- `scripts/qa/test-idts69-assignment-explanation.js` verify provider success, fallback, audit, missing classification va khong mutate workflow.

### Checklist sua file an toan

- Khong de AI tu chon hoac tu assign developer.
- Khong gui email, password hash, token, credential, private URL, attachment content, hoac noi dung bug nhay cam day du cho provider.
- Giu fallback khi AI tat hoac provider loi.
- Giu `requiresReview = true` vi explanation chi la goi y.
- Chay lai `npm run qa:idts69:programmatic` va `npm run qa:idts56:programmatic` sau khi sua.

## IDTS-94 persisted review bridge (2026-07-24)

### English

`recordAssignmentAudit()` now returns the single sanitized audit row created for the explanation request. `explainSmartAssignment()` copies that row's UUID to every returned candidate as `suggestionID`. The dialog therefore reviews the explanation set as one unit; accepting it never selects a table row and never calls `assignToDeveloper`.

### Vietnamese

`recordAssignmentAudit()` giờ trả một audit row đã sanitize của request explanation. `explainSmartAssignment()` copy UUID của row đó vào mỗi candidate dưới field `suggestionID`. Vì vậy dialog review cả tập explanation như một unit; Accept không chọn table row và không gọi `assignToDeveloper`.

## SAP BTP response budget

`explainSmartAssignment()` sends at most ten candidates and passes `SMART_ASSIGNMENT_PROVIDER_DEADLINE_MS = 24000` to the provider wrapper. The provider input keeps only the Bug classification/title and a compact workload summary. If Qwen cannot complete inside 24 seconds, the provider returns `AI_TIMEOUT` and `buildAssignmentExplanations()` immediately uses the existing deterministic explanation. This keeps the OData response below the approximately 30-second AppRouter boundary.

Expected execution order: read grounded candidates → call structured provider with the 24-second deadline → validate provider rows or build deterministic rows → write one sanitized audit row → return candidate explanations. No branch updates `Bugs`, assignment history, notifications or email.

### Giải thích tiếng Việt

`explainSmartAssignment()` gửi tối đa mười candidate và truyền `SMART_ASSIGNMENT_PROVIDER_DEADLINE_MS = 24000` vào provider wrapper. Input chỉ giữ title/classification của Bug và workload summary gọn. Nếu Qwen chưa xong trong 24 giây, provider trả `AI_TIMEOUT`; hàm lập tức dùng explanation deterministic sẵn có để OData trả trước ngưỡng AppRouter khoảng 30 giây.

Thứ tự chạy mong đợi: đọc candidate có grounding → gọi provider với deadline 24 giây → validate kết quả hoặc dựng fallback deterministic → ghi một audit row đã sanitize → trả explanation. Không nhánh nào sửa `Bugs`, history phân công, notification hoặc email.
