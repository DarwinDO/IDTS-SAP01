# Knowledge: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`

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
