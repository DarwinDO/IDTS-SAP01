# Knowledge: `app/bug-management-ui/webapp/ext/controls/SmartAssignmentSection.js`

> **Ownership / debug anchor:** SangVN owns the smart-assignment section wrapper (backup: DonHV). It presents a guided selection; it must not bypass the explicit assignment action or backend checks.
> **Ownership / điểm debug:** SangVN sở hữu wrapper section smart assignment (backup: DonHV). Nó trình bày lựa chọn có hướng dẫn; không được bỏ qua action assign rõ ràng hoặc backend check.

## English

### What this file is for

This file defines the root SAPUI5 control for the custom Assignment section on the Bug Object Page.

Fiori Elements wraps custom Object Page sections inside framework blocks. In this app runtime, the Bug binding context lives on a parent block, not always directly on the fragment root. This small control copies the nearest public binding context from its parent chain so normal XML bindings inside `SmartAssignmentSection.fragment.xml` can read Bug fields such as `assigneeDisplayName`, `canAssign`, `currentActionOwnerDisplayName`, and `nextProcessorRoleName`.

### Beginner explanation

A Fiori Elements custom section is like inserting a small custom UI island into a generated Object Page. The generated page knows which Bug is currently open, but the custom fragment does not always automatically inherit that Bug context. Without this control, the Assignee input could render without data or without the correct enabled/disabled state.

The control does not change data. It only makes sure the fragment can see the same Bug record as the Object Page.

### Flow inside IDTS

1. `manifest.json` inserts `IdtsSmartAssignment` into the Bugs Object Page.
2. The section loads `SmartAssignmentSection.fragment.xml`.
3. The fragment root is this `SmartAssignmentSection` control.
4. Before rendering, the control copies the nearest Bug binding context from its parent.
5. The Assignee input and ownership fields then bind to the correct Bug.

### Important source anchors

- **Location**: `onBeforeRendering()`
  **IDTS concept**: Gives the custom Assignee picker access to the current Bug record.
  **Impact if broken**: The Assignee field can show empty data, stay disabled incorrectly, or fail to open Smart Assign for the current bug.
  **Must check together**: `SmartAssignmentSection.fragment.xml`, `manifest.json`, and Object Page browser smoke.

- **Location**: `this.setBindingContext(parentContext)`
  **IDTS concept**: Reuses the public UI5 binding context; it does not inspect DOM or Fiori internal IDs.
  **Impact if broken**: Future code may accidentally depend on unstable generated control IDs.
  **Must check together**: SAPUI5 linter, Fiori custom section behavior, and existing `BugCollaborationSection.js` pattern.

### Cross-folder impact

- `manifest.json` loads this section through `IdtsSmartAssignment`.
- `SmartAssignmentSection.fragment.xml` relies on this control as its root.
- `SmartAssignDeveloper.js` relies on the same binding context to locate the current Bug.

### Safe editing checklist

- Do not read DOM nodes.
- Do not depend on generated Fiori internal IDs.
- Keep this control data-neutral; assignment changes belong in `SmartAssignDeveloper.js`.
- Run UI5 build, UI5 linter, and browser smoke after changes.

## Vietnamese

### File nay dung de lam gi

File nay dinh nghia root SAPUI5 control cho custom section Assignment tren Bug Object Page.

Fiori Elements boc custom Object Page section trong cac block cua framework. Trong runtime hien tai cua app, binding context cua Bug nam tren parent block, khong phai luc nao cung tu dong nam tren root cua fragment. Control nho nay copy binding context public gan nhat tu parent chain de XML binding trong `SmartAssignmentSection.fragment.xml` doc duoc cac field Bug nhu `assigneeDisplayName`, `canAssign`, `currentActionOwnerDisplayName`, va `nextProcessorRoleName`.

### Giai thich cho nguoi moi

Custom section cua Fiori Elements giong nhu chen mot mien UI tuy chinh vao Object Page generated. Trang generated biet dang mo Bug nao, nhung fragment custom khong phai luc nao cung tu thua huong context Bug do. Neu thieu control nay, input Assignee co the hien trong, disable sai, hoac khong mo dung Smart Assign cho bug hien tai.

Control nay khong sua du lieu. No chi dam bao fragment thay cung Bug record voi Object Page.

### Flow trong IDTS

1. `manifest.json` chen `IdtsSmartAssignment` vao Bugs Object Page.
2. Section load `SmartAssignmentSection.fragment.xml`.
3. Root cua fragment la control `SmartAssignmentSection`.
4. Truoc khi render, control copy Bug binding context gan nhat tu parent.
5. Input Assignee va cac field ownership bind dung vao Bug hien tai.

### Anchor quan trong

- **Vi tri**: `onBeforeRendering()`
  **Khai niem IDTS**: Cho custom Assignee picker truy cap dung Bug record hien tai.
  **Anh huong neu sai**: Field Assignee co the hien trong, disable sai, hoac mo Smart Assign khong dung bug.
  **Phai kiem tra cung**: `SmartAssignmentSection.fragment.xml`, `manifest.json`, va browser smoke Object Page.

- **Vi tri**: `this.setBindingContext(parentContext)`
  **Khai niem IDTS**: Dung UI5 binding context public; khong doc DOM va khong dung ID noi bo cua Fiori.
  **Anh huong neu sai**: Code tuong lai co the phu thuoc vao generated control ID khong on dinh.
  **Phai kiem tra cung**: SAPUI5 linter, hanh vi Fiori custom section, va pattern san co `BugCollaborationSection.js`.

### Lien ket voi file/folder khac

- `manifest.json` load section nay qua `IdtsSmartAssignment`.
- `SmartAssignmentSection.fragment.xml` dung control nay lam root.
- `SmartAssignDeveloper.js` dua vao binding context nay de tim Bug hien tai.

### Checklist sua an toan

- Khong doc DOM.
- Khong phu thuoc generated internal ID cua Fiori.
- Giu control nay khong sua data; logic assign nam trong `SmartAssignDeveloper.js`.
- Chay UI5 build, UI5 linter va browser smoke sau khi sua.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/controls/SmartAssignmentSection.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/controls/SmartAssignmentSection.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-06

## Lifecycle walkthrough / Walkthrough lifecycle (2026-07-18)

**English.** This module defines a stable VBox wrapper used by assignment and AI-action fragments. Fiori creates it while rendering custom content; child controls own events and bindings. There is no candidate state, OData request, or assignment side effect here. If layout content disappears, verify module/namespace/renderer; if selection fails, continue in `SmartAssignDeveloper.js`.

**Tiếng Việt.** Module định nghĩa VBox wrapper ổn định cho assignment và fragment action AI. Fiori tạo nó khi render custom content; child control tự sở hữu event/binding. Không có candidate state, OData request hay side effect assignment ở đây. Nội dung layout mất thì kiểm module/namespace/renderer; chọn assignment lỗi thì qua `SmartAssignDeveloper.js`.
