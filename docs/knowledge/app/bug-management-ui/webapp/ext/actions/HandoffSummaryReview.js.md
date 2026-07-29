# Knowledge: `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js`

## IDTS-114 readability and comment summary

The dialog now orders content as Summary, Current State, Missing Information, Comment Summary, Recent Important Events, and Next Expected Action. Long prose uses `ExpandableText`; comments and events use separate `sap.m.List` controls; the next action is highlighted with a `MessageStrip`. `splitLines()` converts each already-sanitized backend line into a display item, so a legitimate term such as “access token expired” cannot hide the whole section. It does not infer or mutate business state.

Vietnamese: Dialog hiện sắp xếp Summary, Current State, Missing Information, Comment Summary, Recent Important Events và Next Expected Action. Đoạn dài dùng `ExpandableText`; comment và event dùng hai `sap.m.List`; bước tiếp theo được nhấn bằng `MessageStrip`. `splitLines()` chỉ chuyển chuỗi backend đã làm sạch thành item hiển thị, không suy diễn hay thay đổi trạng thái nghiệp vụ.

> **Ownership / debug anchor:** DatDT owns handoff-summary review UI (backup: DonHV). It must never write history, assignee, or status merely by opening the dialog.
> **Ownership / điểm debug:** DatDT sở hữu UI review handoff summary (backup: DonHV). Mở dialog không được tự ghi history, assignee hoặc status.

## English

### What this file is for

This file opens the Handoff Summary review dialog on the Bug Object Page.

It calls the existing CAP action `BugService.summarizeBugHandoff(sourceBugID)` and displays a short reviewable summary for the current Bug. It does not save anything back to the Bug, does not add comments, does not change status, and does not assign anyone.

### Beginner explanation

Think of this dialog as a reading assistant for a busy tester, developer, or PM.

The backend already knows how to read the Bug details, comments, and history, then prepare a concise handoff summary. This UI file only gives the user a safe place to read that result before deciding what to do next.

The important rule is: AI text is never treated as a workflow decision. The person still reviews the Bug and manually chooses the next action in the normal IDTS flow.

### Flow inside IDTS

1. `HistoryTimeline.fragment.xml` renders the History section and the handoff review action row.
2. `openDialog(...)` finds the current Bug binding context from the clicked control.
3. `requestProperty("ID")` reads the current Bug ID.
4. `readHandoffSummary(...)` invokes `/summarizeBugHandoff(...)` through the existing OData V4 model.
5. `AiReviewUi.decorateResult(...)` converts confidence, provider status, and warnings into user-facing review status.
6. `safeText(...)` prevents internal/dev-facing text from appearing in the dialog.
7. The dialog shows summary, current status, current action owner, missing information, recent events, and next expected action.
8. Closing the dialog performs no workflow write.

### Important source anchors

- **Location**: `readHandoffSummary(...)`
  **IDTS concept**: Reuses the existing backend handoff-summary action instead of creating another endpoint.
  **Impact if broken**: The UI can drift away from the backend security/fallback rules from IDTS-68.
  **Must check together**: `srv/service.cds`, `srv/ai/bug-summary.js`, and `scripts/qa/test-idts68-bug-summary.js`.

- **Location**: `safeText(...)`
  **IDTS concept**: User-facing UI must not expose prompts, SQL, credentials, tokens, stack traces, or provider/debug wording.
  **Impact if broken**: A bad provider response or failure detail could leak internal information to testers, developers, or PMs.
  **Must check together**: `AiReviewUi.js`, i18n copy, and IDTS-76 unsafe-output browser evidence.

- **Location**: `enrichSummary(...)`
  **IDTS concept**: Turns backend data into review-only UI state.
  **Impact if broken**: Sparse or low-confidence summaries may look too authoritative, or missing data may not be explained clearly.
  **Must check together**: `AiReviewUi.js`, `handoffSummarySparseWarning`, and browser sparse-data evidence.

- **Location**: `buildDialog(...)`
  **IDTS concept**: Presents AI output as review evidence, not as an action.
  **Impact if broken**: The UI could accidentally imply that AI has already approved or completed a handoff.
  **Must check together**: SAP Fiori dialog guidance, i18n keys, and no-mutation browser evidence.

### Cross-folder impact

- `srv/service.cds` exposes `summarizeBugHandoff(sourceBugID)`.
- `srv/ai/bug-summary.js` owns the backend summary rules, fallback behavior, and safe audit behavior.
- `db/schema.cds` defines the Bug, Comment, History, and AI suggestion entities that provide grounded source data.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` provides shared review status, confidence, warning, and manual-review wording.
- `app/bug-management-ui/webapp/i18n/i18n.properties` and `i18n_en.properties` provide all user-facing labels.
- `scripts/qa/test-idts76-handoff-summary-ui.js` checks static wiring.
- `scripts/qa/test-idts76-handoff-summary-browser.js` checks the real browser behavior.

### Safe editing checklist

- Do not add automatic Save, PATCH, comment creation, history creation, status change, or assignment change.
- Do not add a second handoff-summary API while `summarizeBugHandoff` is enough.
- Do not display raw provider output if it contains internal or unsafe words.
- Keep all user-facing text in both i18n bundles.
- Run IDTS-68 backend QA and IDTS-76 UI/browser QA after changes.

## Vietnamese

### File nay dung de lam gi

File nay mo dialog Handoff Summary tren Bug Object Page.

No goi CAP action da co `BugService.summarizeBugHandoff(sourceBugID)` va hien thi mot ban tom tat ngan de user review cho Bug hien tai. No khong luu nguoc vao Bug, khong them comment, khong doi status, va khong assign ai.

### Giai thich cho nguoi moi

Co the hieu dialog nay la mot tro ly doc nhanh cho Tester, Developer hoac PM khi Bug da co nhieu thong tin.

Backend da biet cach doc Bug details, comments va history, sau do tao mot ban tom tat handoff ngan gon. File UI nay chi dua ket qua do len man hinh theo cach an toan de user doc truoc khi tu quyet dinh buoc tiep theo.

Quy tac quan trong: text AI khong bao gio la quyet dinh workflow. Nguoi dung van phai review Bug va tu bam action trong flow IDTS binh thuong.

### Flow trong IDTS

1. `HistoryTimeline.fragment.xml` render History section va action row de mo handoff review.
2. `openDialog(...)` tim binding context cua Bug hien tai tu control vua duoc bam.
3. `requestProperty("ID")` doc Bug ID hien tai.
4. `readHandoffSummary(...)` goi `/summarizeBugHandoff(...)` qua OData V4 model da co.
5. `AiReviewUi.decorateResult(...)` chuyen confidence, provider status va warning thanh trang thai review de user doc duoc.
6. `safeText(...)` chan text noi bo/dev-facing khong hien ra UI.
7. Dialog hien summary, status hien tai, current action owner, thong tin con thieu, su kien gan day, va next expected action.
8. Dong dialog khong ghi bat ky thay doi workflow nao.

### Anchor quan trong

- **Vi tri**: `readHandoffSummary(...)`
  **Khai niem IDTS**: Tai su dung action handoff-summary backend da co thay vi tao endpoint moi.
  **Anh huong neu sai**: UI co the lech khoi security/fallback rule backend cua IDTS-68.
  **Phai kiem tra cung**: `srv/service.cds`, `srv/ai/bug-summary.js`, va `scripts/qa/test-idts68-bug-summary.js`.

- **Vi tri**: `safeText(...)`
  **Khai niem IDTS**: UI cho user khong duoc lo prompt, SQL, credential, token, stack trace, hoac wording provider/debug.
  **Anh huong neu sai**: Provider response hoac failure detail xau co the bi lo cho Tester, Developer hoac PM.
  **Phai kiem tra cung**: `AiReviewUi.js`, i18n copy, va browser evidence unsafe-output cua IDTS-76.

- **Vi tri**: `enrichSummary(...)`
  **Khai niem IDTS**: Chuyen data backend thanh state UI chi de review.
  **Anh huong neu sai**: Summary thieu du lieu hoac confidence thap co the nhin nhu ket luan chac chan.
  **Phai kiem tra cung**: `AiReviewUi.js`, `handoffSummarySparseWarning`, va browser evidence sparse-data.

- **Vi tri**: `buildDialog(...)`
  **Khai niem IDTS**: Hien AI output nhu bang chung de review, khong phai action.
  **Anh huong neu sai**: UI co the lam user hieu nham rang AI da phe duyet hoac hoan tat handoff.
  **Phai kiem tra cung**: guideline SAP Fiori cho dialog, i18n keys, va browser evidence no-mutation.

### Lien ket voi folder/file khac

- `srv/service.cds` expose `summarizeBugHandoff(sourceBugID)`.
- `srv/ai/bug-summary.js` giu rule backend cho summary, fallback va safe audit.
- `db/schema.cds` dinh nghia Bug, Comment, History va AI suggestion entities dung lam du lieu nguon.
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js` cung cap wording review status, confidence, warning va manual-review dung chung.
- `app/bug-management-ui/webapp/i18n/i18n.properties` va `i18n_en.properties` giu tat ca label user-facing.
- `scripts/qa/test-idts76-handoff-summary-ui.js` kiem tra static wiring.
- `scripts/qa/test-idts76-handoff-summary-browser.js` kiem tra hanh vi that tren browser.

### Checklist sua an toan

- Khong them tu dong Save, PATCH, tao comment, tao history, doi status, hoac doi assignee.
- Khong tao API handoff-summary thu hai khi `summarizeBugHandoff` da du dung.
- Khong hien raw provider output neu no co tu noi bo hoac unsafe.
- Moi text user-facing phai co trong ca hai i18n bundle.
- Sau khi sua phai chay QA backend IDTS-68 va QA UI/browser IDTS-76.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/HandoffSummaryReview.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-09

## Detailed request lifecycle / Vòng đời request chi tiết (2026-07-18)

**English.** History button → `openDialog()` → root Bug context → request `ID` → `readHandoffSummary()` invokes `summarizeBugHandoff(...)` → backend reads persisted Bug/history context and produces grounded text → `enrichSummary()` sanitizes fields → `buildDialog()` updates its JSONModel. Observe Bug ID, provider/grounding status, missing-information text, latest events, and next action. The dialog is read-only: no comment, history, status, owner, or database row is written.

**Tiếng Việt.** Nút trong History → `openDialog()` → root Bug context → request `ID` → `readHandoffSummary()` invoke `summarizeBugHandoff(...)` → backend đọc Bug/history đã lưu và tạo text grounded → `enrichSummary()` sanitize field → `buildDialog()` cập nhật JSONModel. Quan sát Bug ID, provider/grounding status, missing-information, latest events và next action. Dialog chỉ đọc: không ghi comment, history, status, owner hay row database.

## IDTS-94 explicit review controls (2026-07-24)

Responsive note: Bug metadata and the provider/confidence status are vertically stacked so long localized text wraps instead of widening the dialog on phone-sized viewports.

### English

The dialog now reads `suggestionID` from `summarizeBugHandoff`, shows the persisted review state plus reviewer/time, and delegates Accept/Reject/Ignore to `AiSuggestionReview.submit`. Buttons remain disabled while loading, when no persisted result exists, and immediately after the first decision. The notice explicitly says that reviewing the summary does not change the Bug or create comment/history content.

Debug order: summary action response `suggestionID` → JSONModel `/suggestionID` and `/reviewActionEnabled` → review action network call → returned `reviewStateCode`, reviewer, and timestamp → disabled controls. The only write is the `AiSuggestions` review audit update.

### Vietnamese

Dialog giờ đọc `suggestionID` từ `summarizeBugHandoff`, hiện review state đã persist kèm reviewer/time, và giao Accept/Reject/Ignore cho `AiSuggestionReview.submit`. Button bị disable khi đang load, khi không có result đã persist, và ngay sau quyết định đầu tiên. Notice nói rõ review summary không đổi Bug và không tạo comment/history.

Thứ tự debug: `suggestionID` trong response → JSONModel `/suggestionID` và `/reviewActionEnabled` → request review action → `reviewStateCode`, reviewer, timestamp trả về → controls bị khóa. Write duy nhất là update review audit trong `AiSuggestions`.
