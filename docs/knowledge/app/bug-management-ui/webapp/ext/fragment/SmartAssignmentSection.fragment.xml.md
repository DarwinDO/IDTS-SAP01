# Knowledge: `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml`

## IDTS-122 update

Assignment value help and Smart Assign are state-aware and unavailable while the Bug is Closed. PM retest-owner reassignment is a separate action and does not change Developer assignment.

> **Ownership / debug anchor:** SangVN owns the integrated assignee picker UI (backup: DonHV). It combines search and guidance in the assignee flow, but never auto-assigns or replaces server validation.
> **Ownership / điểm debug:** SangVN sở hữu UI picker assignee tích hợp (backup: DonHV). Nó kết hợp search/guidance trong flow assignee nhưng không auto-assign hoặc thay server validation.

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

- **Location**: expression-bound `showValueHelp`, `editable`, and `enabled`, plus `valueHelpRequest="SmartAssign.openAssigneePicker"`
  **IDTS concept**: Makes the Assignee field itself the Smart Assign entry point while Closed Bugs and an authoritative `canAssign=false` remain blocked. A temporarily undefined virtual `canAssign` value must not hide the picker before the controller requests the current capability.
  **Impact if broken**: Tester or PM users may lose the picker during initial Object Page binding even though the server allows assignment.
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

### IDTS-77 update: similar bug review moved out of Assignment

IDTS-77 removes the `Find Similar Bugs` button from this Assignment fragment.

The earlier IDTS-74 implementation proved the duplicate/similar review dialog, but the button placement was misleading because duplicate checking belongs to the bug summary context, not to assignment. The button now lives in `SimilarBugCheckSection.fragment.xml`, and this fragment only handles assignment ownership.

This keeps the Assignment section focused: choose or review the technical owner, show the current action owner, and do not mix in unrelated AI review actions.

Must check together:

- `app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml`
- `app/bug-management-ui/webapp/manifest.json`
- `srv/service.cds`
- `scripts/qa/test-idts77-ai-action-placement.js`

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

- **Vi tri**: `showValueHelp`, `editable`, `enabled` dung expression binding va `valueHelpRequest="SmartAssign.openAssigneePicker"`
  **Khai niem IDTS**: Field Assignee la diem mo Smart Assign; Bug Closed va ket qua `canAssign=false` chinh thuc van bi chan. Gia tri virtual `canAssign` tam thoi chua tai khong duoc lam mat picker truoc khi controller request capability hien tai.
  **Anh huong neu sai**: Tester hoac PM co the mat picker luc Object Page moi bind du server van cho phep assignment.
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

### Cap nhat IDTS-77: review bug tuong tu duoc chuyen ra khoi Assignment

IDTS-77 bo nut `Find Similar Bugs` khoi fragment Assignment nay.

IDTS-74 truoc do da chung minh dialog review duplicate/similar chay duoc, nhung vi tri nut gay hieu nham vi duplicate check thuoc ngu canh bug summary, khong thuoc assignment. Nut hien nam trong `SimilarBugCheckSection.fragment.xml`, con fragment nay chi xu ly phan assignment ownership.

Cach nay giu section Assignment dung trong tam: chon hoac xem technical owner, hien thi current action owner, va khong tron action AI khong lien quan vao day.

Phai kiem tra cung:

- `app/bug-management-ui/webapp/ext/fragment/SimilarBugCheckSection.fragment.xml`
- `app/bug-management-ui/webapp/manifest.json`
- `srv/service.cds`
- `scripts/qa/test-idts77-ai-action-placement.js`

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/fragment/SmartAssignmentSection.fragment.xml.md`
- Source layer: `app`
- Last reviewed: 2026-07-09

## Binding walkthrough / Walkthrough binding (2026-07-18)

**English.** The Assignee Input displays `assigneeDisplayName` one-way and replaces normal value help with `SmartAssign.openAssigneePicker`. Change resets invalid free text; value-help request opens the candidate dialog. Separate Text controls show current action owner and role, so technical ownership is not confused with workflow responsibility. Editable/enabled bindings improve UX; backend validation remains final.

**Tiếng Việt.** Input Assignee hiển thị `assigneeDisplayName` one-way và thay value help thường bằng `SmartAssign.openAssigneePicker`. Change reset free text không hợp lệ; value-help request mở dialog candidate. Text riêng hiển thị current action owner và role để không nhầm technical ownership với trách nhiệm workflow. Binding editable/enabled chỉ cải thiện UX; backend validation vẫn là lớp cuối.
