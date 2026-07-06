# Knowledge: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`

## English

### What this file is for

This file contains the custom Fiori Elements Object Page action handler for `Smart Assign`.

It opens a SAPUI5 dialog that helps PM/Tester users choose a developer from `BugService.AssignableDevelopers`. The dialog shows developer name, email, application component, defect category, SAP module scope, responsibility level, and availability state. It supports client-side search across developer, module, capability, responsibility, and availability fields.

### IDTS flow

1. `manifest.json` registers the Object Page header action `SmartAssignDeveloper`.
2. Fiori calls `openDialog(...)` when the user presses `Smart Assign`.
3. The module reads the current login session through `LoginController`.
4. Only Tester and PM users can see/invoke the UI action.
5. The module requests assignment-related properties that Fiori may not have selected yet, especially `componentCategory_ID`.
6. It loads `/AssignableDevelopers` filtered by the bug's component category and optional SAP module.
7. The user chooses a candidate; the module calls the existing bound action `BugService.assignToDeveloper`.
8. CAP backend remains the final validation boundary for role permission, valid developer profile, availability, and responsibility.

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
  - IDTS concept: uses existing CAP action `BugService.assignToDeveloper`; no backend rule change was introduced by IDTS-56.
  - Must check together: `srv/bug-service/actions.js`, `srv/bug-service/bug-write.js`, `srv/bug-service/permissions.js`, and `srv/bug-service/read-models.js`.

### Safe editing checklist

- Do not copy raw mockup HTML/CSS into this file.
- Use SAPUI5 controls (`sap.m.Dialog`, `sap.m.Table`, `sap.m.SearchField`, `sap.m.ObjectStatus`, `sap.m.MessageStrip`).
- Keep backend validation authoritative; do not auto-select or auto-rank developers.
- Rerun `npm run qa:idts56:programmatic` and `npm run qa:idts56:browser` after changes.

## Vietnamese

### File nay dung de lam gi

File nay la handler cho action `Smart Assign` tren Object Page.

Dialog giup PM/Tester chon developer de hon value help mac dinh. UI hien ten developer, email, component/category, SAP module scope, responsibility, va availability. Search co the tim theo developer, module, capability, responsibility, va availability.

### Flow IDTS

1. `manifest.json` dang ky action `SmartAssignDeveloper`.
2. Fiori goi `openDialog(...)` khi user bam `Smart Assign`.
3. Module doc login session qua `LoginController`.
4. Chi Tester va PM duoc thay/goi action.
5. Module request them cac field assignment an ma Fiori co the chua select, nhat la `componentCategory_ID`.
6. Module doc `/AssignableDevelopers` theo component category va SAP module neu co.
7. User chon developer; module goi bound action `BugService.assignToDeveloper`.
8. CAP backend van la lop validate cuoi cung cho quyen, developer hop le, availability, va responsibility.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/actions/SmartAssignDeveloper.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-06
