# Knowledge: `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml`

## English

### What this file is for

This XML fragment renders the custom Assignment section on the Bug Object Page.

Its main job is to replace the old generated Assignee value help with a user-facing Assignee input whose value-help icon opens the Smart Assign dialog. It also shows `Current Action Owner` and `Action Owner Role` so users can still distinguish the technical assignee from the person or role that must act next.

### Beginner explanation

Fiori Elements can generate forms from annotations, but the standard generated value help was too generic for IDTS assignment. IDTS needs a picker that shows developer capability, SAP module scope, responsibility, and availability. This fragment keeps the page in SAPUI5/Fiori style while giving IDTS a richer picker.

The Assignee input is bound one-way to `assigneeDisplayName`. This means the user can see the current assignee, but typing text into the field does not write arbitrary text to the Bug. The only supported change path is the value-help icon, which calls `SmartAssignDeveloper.openAssigneePicker`.

### Flow inside IDTS

1. `manifest.json` inserts this fragment as `IdtsSmartAssignment`.
2. `SmartAssignmentSection.js` gives the fragment the current Bug binding context.
3. The Assignee input displays `assigneeDisplayName`.
4. The user presses the value-help icon.
5. `SmartAssignDeveloper.openAssigneePicker` opens the Smart Assign dialog.
6. The selected developer updates `assignee_ID` on draft pages or calls `BugService.assignToDeveloper` for active bugs.

### Important source anchors

- **Location**: `Input value="{path: 'assigneeDisplayName', mode: 'OneWay'}"`
  **IDTS concept**: Shows the readable assignee name while preventing free-text assignment from becoming data.
  **Impact if broken**: Users could type misleading names into Assignee or the UI could try to patch a computed display field.
  **Must check together**: `SmartAssignDeveloper.resetAssigneeInput`, draft save behavior, and backend assignment validation.

- **Location**: `showValueHelp="true"` and `valueHelpRequest="SmartAssign.openAssigneePicker"`
  **IDTS concept**: Makes the Assignee field itself the Smart Assign entry point.
  **Impact if broken**: Users may lose the picker or fall back to the old generic value help.
  **Must check together**: `SmartAssignDeveloper.js`, `manifest.json`, and browser smoke.

- **Location**: `Current Action Owner` and `Action Owner Role` fields
  **IDTS concept**: Keeps the distinction between technical owner and current workflow owner visible.
  **Impact if broken**: Tester, Developer, and PM users may confuse who owns the fix with who must act next.
  **Must check together**: `ownership-assignment.cds`, `srv/bug-service/read-models.js`, and lifecycle browser checks.

### Cross-folder impact

- `ownership-assignment.cds` no longer renders the generated Assignee DataFields.
- `manifest.json` owns section placement.
- `SmartAssignDeveloper.js` owns picker behavior and assignment execution.
- `srv/service.cds` and backend handlers still own the OData contract and validation.

### Safe editing checklist

- Do not add internal or developer-facing explanation text to the UI.
- Do not enable free-text assignment.
- Do not use DOM selectors or generated Fiori control IDs.
- Keep labels user-facing and consistent with `Assignee (Technical Owner)` and `Current Action Owner`.
- Run UI5 build, UI5 linter, and browser smoke after changes.

### IDTS-74 update: similar bug review entry point

IDTS-74 adds a `Find Similar Bugs` button to the Assignment section header.

The button uses `core:require` to load `idts/bugmanagementui/ext/actions/DuplicateReview` and calls `DuplicateReview.openDialog`. This is intentionally a small entry point: the fragment only renders the button, while `DuplicateReview.js` owns the dialog and the OData call to `suggestSimilarBugs`.

This keeps the Object Page simple. The user can review similar/duplicate candidates from the bug detail page, but the UI does not confirm a duplicate automatically and does not write `DuplicateLinks`.

Must check together:

- `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js`
- `srv/service.cds`
- `srv/ai/duplicate-detection.js`
- `scripts/qa/test-idts74-duplicate-review-ui.js`

## Vietnamese

### File nay dung de lam gi

XML fragment nay render custom section Assignment tren Bug Object Page.

Nhiem vu chinh la thay old generated Assignee value help bang mot input Assignee co icon value-help. Khi user bam icon nay, app mo dialog Smart Assign. Fragment cung hien `Current Action Owner` va `Action Owner Role` de user van phan biet duoc technical assignee voi nguoi/role phai xu ly buoc tiep theo.

### Giai thich cho nguoi moi

Fiori Elements co the tu generate form tu annotation, nhung value help mac dinh qua chung chung cho assignment cua IDTS. IDTS can picker hien capability cua developer, SAP module scope, responsibility va availability. Fragment nay van giu style SAPUI5/Fiori, nhung cho IDTS picker giau thong tin hon.

Input Assignee bind one-way vao `assigneeDisplayName`. Nghia la user thay ten assignee hien tai, nhung go text vao field se khong ghi text tuy y vao Bug. Duong thay doi hop le la bam icon value-help, goi `SmartAssignDeveloper.openAssigneePicker`.

### Flow trong IDTS

1. `manifest.json` chen fragment nay voi key `IdtsSmartAssignment`.
2. `SmartAssignmentSection.js` dua current Bug binding context cho fragment.
3. Input Assignee hien `assigneeDisplayName`.
4. User bam icon value-help.
5. `SmartAssignDeveloper.openAssigneePicker` mo dialog Smart Assign.
6. Developer duoc chon se cap nhat `assignee_ID` tren draft page hoac goi `BugService.assignToDeveloper` voi active bug.

### Anchor quan trong

- **Vi tri**: `Input value="{path: 'assigneeDisplayName', mode: 'OneWay'}"`
  **Khai niem IDTS**: Hien ten assignee de doc nhung khong cho free-text assignment tro thanh data.
  **Anh huong neu sai**: User co the go ten gay hieu nham vao Assignee hoac UI co the patch nham computed display field.
  **Phai kiem tra cung**: `SmartAssignDeveloper.resetAssigneeInput`, draft save behavior, va backend assignment validation.

- **Vi tri**: `showValueHelp="true"` va `valueHelpRequest="SmartAssign.openAssigneePicker"`
  **Khai niem IDTS**: Bien chinh field Assignee thanh diem mo Smart Assign.
  **Anh huong neu sai**: User mat picker hoac quay lai generic value help cu.
  **Phai kiem tra cung**: `SmartAssignDeveloper.js`, `manifest.json`, va browser smoke.

- **Vi tri**: field `Current Action Owner` va `Action Owner Role`
  **Khai niem IDTS**: Giu ro su khac nhau giua technical owner va current workflow owner.
  **Anh huong neu sai**: Tester, Developer va PM co the nham nguoi fix voi nguoi phai hanh dong tiep theo.
  **Phai kiem tra cung**: `ownership-assignment.cds`, `srv/bug-service/read-models.js`, va lifecycle browser checks.

### Lien ket voi file/folder khac

- `ownership-assignment.cds` khong con render generated Assignee DataFields.
- `manifest.json` quan ly vi tri section.
- `SmartAssignDeveloper.js` quan ly hanh vi picker va thuc thi assignment.
- `srv/service.cds` va backend handlers van quan ly OData contract va validation.

### Checklist sua an toan

- Khong dua text noi bo/dev-facing len UI.
- Khong cho free-text assignment.
- Khong dung DOM selector hoac generated Fiori control ID.
- Giu label dung voi `Assignee (Technical Owner)` va `Current Action Owner`.
- Chay UI5 build, UI5 linter va browser smoke sau khi sua.

### Cap nhat IDTS-74: diem mo review bug tuong tu

IDTS-74 them nut `Find Similar Bugs` vao header cua section Assignment.

Nut nay dung `core:require` de load `idts/bugmanagementui/ext/actions/DuplicateReview` va goi `DuplicateReview.openDialog`. Fragment chi lam entry point nho: no render button, con `DuplicateReview.js` quan ly dialog va viec goi OData action `suggestSimilarBugs`.

Cach nay giu Object Page gon. User co the review candidate bug trung/tuong tu ngay tren bug detail page, nhung UI khong tu xac nhan duplicate va khong ghi `DuplicateLinks`.

Phai kiem tra cung:

- `app/bug-management-ui/webapp/ext/actions/DuplicateReview.js`
- `app/bug-management-ui/webapp/ext/ai/AiReviewUi.js`
- `srv/service.cds`
- `srv/ai/duplicate-detection.js`
- `scripts/qa/test-idts74-duplicate-review-ui.js`

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-06
