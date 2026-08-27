# Knowledge: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`

## Smart Assign Note policy (2026-08-06)

For an active Bug, `executeAssignment()` now sends only the selected `assigneeID`; it no longer injects “Assigned from Smart Assign dialog.” Manual Assign Developer still exposes its optional Developer Note. Assignment audit remains available through the action type, actor, assignee/owner changes, and timestamp.

## IDTS-122 closed-state behavior

Smart Assign does not open or assign when the Bug is Closed. The field/action binding is status-aware, and the backend independently rejects assignment or AI explanation generation on a Closed aggregate.

## IDTS-114 explanation provenance (2026-07-30)

`applyAssignmentExplanations()` now renders **AI-generated explanation** only when backend returns `explanationSource = AI`. A deterministic row renders **Rules-based guidance** and does not display a model-confidence claim. This is display-only: selecting a candidate still requires the explicit Assign action and CAP validation.

## IDTS-115 draft classification synchronization

Before candidate lookup, `synchronizeAssignmentContext()` submits pending changes through the model update group, refreshes the Bug context, and re-reads `applicationComponent_ID`, `defectCategory_ID`, and backend-derived `componentCategory_ID`. A missing pair and an invalid active mapping use different user messages. An already-derived component category remains authoritative and opens the picker without unnecessary rejection.

Vietnamese: Trước khi tìm Developer, helper chờ PATCH, refresh context và đọc lại cặp classification cùng `componentCategory_ID` do backend derive. Thiếu lựa chọn và mapping không hợp lệ có thông báo riêng.

> **Ownership / debug anchor:** SangVN owns the candidate-selection dialog (backup: DonHV). The dialog may explain/filter candidates, but a human selects and CAP validates the final assignee.
> **Ownership / điểm debug:** SangVN sở hữu dialog chọn candidate (backup: DonHV). Dialog có thể giải thích/lọc candidate, nhưng người dùng chọn và CAP validate assignee cuối cùng.

## English

### What this file is for

This file contains the Smart Assign picker logic for the Bugs Object Page.

It opens a SAPUI5 dialog that helps PM/Tester users choose a developer from `BugService.AssignableDevelopers`. Since IDTS-61, the dialog is opened from the Assignee field's value-help icon instead of a separate Object Page header button. The dialog shows developer name, email, application component, defect category, SAP module scope, responsibility level, and availability state. It supports client-side search across developer, module, capability, responsibility, and availability fields.

### IDTS flow

1. `manifest.json` registers a custom Object Page Assignment section.
2. `SmartAssignmentSection.fragment.xml` renders the Assignee input with a value-help icon.
3. Fiori calls `openAssigneePicker(...)` when the user presses that value-help icon.
3. The module reads the current login session through `LoginController`.
4. Only Tester and PM users can invoke the picker.
5. The module requests assignment-related properties that Fiori may not have selected yet, especially `componentCategory_ID`.
6. It loads `/AssignableDevelopers` filtered by the bug's component category and optional SAP module.
7. If the page is a draft/create/edit context, the module writes `assignee_ID` through the public OData V4 context API.
8. If the page is an active bug, the module calls the existing bound action `BugService.assignToDeveloper`.
9. CAP backend remains the final validation boundary for role permission, valid developer profile, availability, and responsibility.

### Important source anchors

- `requestMissingAssignmentProperties(...)`
  - IDTS concept: hidden technical fields such as `componentCategory_ID` are needed for assignment filtering but may not be loaded in the Object Page binding context.
  - Impact if broken: the dialog can incorrectly claim classification is missing even when Application Component and Defect Category are visible.

- `readCandidates(...)`
  - IDTS concept: uses the existing `AssignableDevelopers` read model instead of duplicating responsibility logic in the UI.
  - Impact if broken: the dialog can show wrong or unfiltered candidates.

- `availabilityState(...)`, `smartAssignBusyWarning`, `smartAssignUnavailableWarning`
  - IDTS concept: busy/on-leave/unavailable warnings are visible in the UI, but backend still blocks invalid assignment.

- `executeAssignment(...)`
  - IDTS concept: uses `context.setProperty("assignee_ID", ...)` for drafts and `BugService.assignToDeveloper` for active bugs; no backend rule change was introduced by IDTS-61.
  - Must check together: `SmartAssignmentSection.fragment.xml`, `srv/bug-service/actions.js`, `srv/bug-service/bug-write.js`, `srv/bug-service/permissions.js`, and `srv/bug-service/read-models.js`.

- `openAssigneePicker(...)`
  - IDTS concept: replaces the old separate Smart Assign button by making the Assignee field itself the picker entry point.
  - Impact if broken: users either see the old generic value help again or cannot open Smart Assign from the Assignee field.
  - Must check together: `manifest.json`, `ownership-assignment.cds`, and the browser QA script for IDTS-56/61.

- `resetAssigneeInput(...)`
  - IDTS concept: prevents free-text Assignee changes. Users must choose a real developer from Smart Assign.
  - Impact if broken: a user could type a name that looks valid in the field but is not a valid DeveloperProfile assignment.
  - Must check together: `SmartAssignmentSection.fragment.xml` and OData draft save behavior.

### Safe editing checklist

- Do not copy raw mockup HTML/CSS into this file.
- Use SAPUI5 controls (`sap.m.Dialog`, `sap.m.Table`, `sap.m.SearchField`, `sap.m.ObjectStatus`, `sap.m.MessageStrip`).
- Keep backend validation authoritative; do not auto-select or auto-rank developers.
- Rerun `npm run qa:idts56:programmatic` and `npm run qa:idts56:browser` after changes.

## Vietnamese

### File nay dung de lam gi

File nay chua logic cho Smart Assign picker tren Object Page cua Bug.

Dialog giup PM/Tester chon developer de hon value help mac dinh. Tu IDTS-61, dialog khong con mo bang nut `Smart Assign` rieng tren header nua. Thay vao do, user bam icon value-help ngay trong field Assignee. UI hien ten developer, email, component/category, SAP module scope, responsibility, va availability. Search co the tim theo developer, module, capability, responsibility, va availability.

### Flow IDTS

1. `manifest.json` dang ky custom section Assignment tren Object Page.
2. `SmartAssignmentSection.fragment.xml` render field Assignee co icon value-help.
3. Fiori goi `openAssigneePicker(...)` khi user bam icon value-help do.
3. Module doc login session qua `LoginController`.
4. Chi Tester va PM duoc goi picker.
5. Module request them cac field assignment an ma Fiori co the chua select, nhat la `componentCategory_ID`.
6. Module doc `/AssignableDevelopers` theo component category va SAP module neu co.
7. Neu dang o draft/create/edit, module set `assignee_ID` bang public OData V4 context API.
8. Neu dang o active bug, module goi bound action `BugService.assignToDeveloper`.
9. CAP backend van la lop validate cuoi cung cho quyen, developer hop le, availability, va responsibility.

### Ghi chu IDTS-61

- `openAssigneePicker(...)` la entry moi tu field Assignee.
- `executeAssignment(...)` phan biet draft va active bug de khong goi action sai context.
- `resetAssigneeInput(...)` chan viec user go tu do vao Assignee. User phai chon developer that qua Smart Assign.
- Khi sua file nay phai kiem tra chung voi `manifest.json`, `ownership-assignment.cds`, `SmartAssignmentSection.fragment.xml`, backend action `assignToDeveloper`, va browser QA.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-06

## Detailed request lifecycle / Vòng đời request chi tiết (2026-07-18)

**English.** Value-help event → root Bug context → request missing classification fields → read `AssignableDevelopers` → optionally invoke `explainSmartAssignment` → sanitize/decorate candidates → client search/filter → user selects one row → `executeAssignment()` invokes the backend assignment operation and refreshes the Bug. Selection and AI explanation are review aids only; no auto-assignment occurs. Watch Bug classification, candidate profile ID, availability/workload, selected row, action response, and refreshed assignee/current action owner.

**Tiếng Việt.** Event value help → root Bug context → request classification field còn thiếu → đọc `AssignableDevelopers` → có thể invoke `explainSmartAssignment` → sanitize/decorate candidate → search/filter client → user chọn một row → `executeAssignment()` invoke operation backend và refresh Bug. Selection và AI explanation chỉ hỗ trợ review; không auto-assign. Quan sát classification Bug, candidate profile ID, availability/workload, row chọn, action response và assignee/current action owner sau refresh.

## IDTS-94 explanation review controls (2026-07-24)

### English

The Smart Assign dialog treats one explanation request as one review unit. `applyAssignmentExplanations()` takes the shared `suggestionID`, enables contextual Accept/Reject/Ignore buttons, and shows persisted state plus reviewer/time through `AiSuggestionReview.submit`. These controls sit beside the AI explanation notice, separate from the footer Assign button.

Accepting an explanation records only the audit decision. It does not select a candidate, set `selectedCandidate`, enable assignment, write `assignee_ID`, or call `assignToDeveloper`. Empty/provider-error results keep review disabled and show a safe unavailable state. Assignment/load failures use localized generic messages rather than caught backend detail.

## IDTS-115 draft synchronization guard (2026-07-30)

### English

Before Smart Assign validates `componentCategory_ID`, `flushPendingChanges()` lets pending draft PATCH work finish. It submits only a named application update group. CAP OData V4 reserves groups such as `$auto` and `$direct`, so the module must never call `submitBatch("$auto")`; it polls `hasPendingChanges()` until the automatic submission completes instead. The Bug context is then refreshed and the three classification properties are read again. This keeps `prepareDraftPatch()` and `deriveOrValidateComponentCategory()` in the backend as the source of truth.

If synchronization fails, both Smart Assign entry points catch the rejected promise and show a localized safe message. A complete component/category pair without a derived mapping is reported differently from an incomplete pair.

The pending check is scoped to `model.getUpdateGroupId()` (normally `$auto`).
UI5 value-help bindings may retain transient recommendation contexts in the
internal `donotsubmit` group. That unrelated group must never delay, submit, or
reset Smart Assign. When global pending is `true` but `$auto` pending is
`false`, the flow refreshes the Bug context and requests
`/AssignableDevelopers` immediately.

Vietnamese: Kiem tra pending phai gioi han theo
`model.getUpdateGroupId()` (thuong la `$auto`). Value help cua UI5 co the giu
transient context trong group noi bo `donotsubmit`; Smart Assign khong duoc
cho, submit hoac reset group nay. Neu global pending la `true` nhung `$auto`
pending la `false`, flow phai refresh Bug context va doc
`/AssignableDevelopers` ngay.

### Vietnamese

Trước khi Smart Assign kiểm tra `componentCategory_ID`, `flushPendingChanges()` chờ PATCH của draft hoàn tất. Hàm chỉ submit một application update group có tên. Các group như `$auto` và `$direct` là group dành riêng của CAP OData V4, vì vậy module tuyệt đối không gọi `submitBatch("$auto")`; thay vào đó nó kiểm tra `hasPendingChanges()` cho đến khi cơ chế tự động gửi xong. Sau đó Bug context được refresh và ba thuộc tính classification được đọc lại. Backend `prepareDraftPatch()` và `deriveOrValidateComponentCategory()` vẫn là nguồn quyết định cuối cùng.

Nếu đồng bộ thất bại, cả hai entry point của Smart Assign đều bắt rejected promise và hiển thị thông báo i18n an toàn. Trường hợp đã chọn đủ component/category nhưng không có mapping được báo riêng với trường hợp còn thiếu lựa chọn.

### Vietnamese

Dialog Smart Assign xem một request explanation là một review unit. `applyAssignmentExplanations()` lấy `suggestionID` dùng chung, enable các nút Accept/Reject/Ignore theo ngữ cảnh, và hiện state đã persist kèm reviewer/time qua `AiSuggestionReview.submit`. Các nút này nằm cạnh notice AI, tách khỏi nút Assign ở footer.

## N2 unread refresh signal / Tín hiệu refresh unread N2

**English.** After the active `assignToDeveloper` operation succeeds, Smart Assign dispatches the payload-free browser event `idts:notification-change`. `NotificationShell` listens only to refresh the caller's server-authoritative unread count immediately instead of waiting up to 30 seconds. It sends no recipient, notification content or authorization state. Draft property changes do not signal because no final assignment notification exists yet. Check the shell listener/cleanup and UI QA together.

**Tiếng Việt.** Sau khi operation active `assignToDeveloper` thành công, Smart Assign phát browser event không payload `idts:notification-change`. `NotificationShell` chỉ nghe để đọc lại unread count caller từ server ngay, không chờ tối đa 30 giây. Event không gửi recipient, nội dung notification hay state authorization. Thay đổi property draft chưa phát event vì chưa có notification assignment cuối. Kiểm cùng listener/cleanup shell và QA UI.

Accept explanation chỉ ghi quyết định audit. Nó không chọn candidate, không set `selectedCandidate`, không enable assignment, không ghi `assignee_ID`, và không gọi `assignToDeveloper`. Kết quả rỗng/lỗi provider giữ review bị disable và hiện state unavailable an toàn. Lỗi load/assign dùng thông báo i18n chung thay vì chi tiết backend bị catch.
