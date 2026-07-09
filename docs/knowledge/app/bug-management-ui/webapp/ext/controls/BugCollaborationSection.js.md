# Knowledge: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js`

## English

### What this file is for

This file defines a small SAPUI5 control used as the root container for the custom Comments and Evidence / Attachments sections.

It exists because the Fiori Elements Object Page gives the custom section wrapper the current Bug binding context, but the plain fragment root did not inherit that context reliably in this runtime. Without the Bug context, bindings such as `comments`, `attachments`, `IsActiveEntity`, and `HasDraftEntity` cannot work.

### Beginner explanation

In SAPUI5, a binding context tells a control which business object it is currently showing. On the Bug Object Page, that object is one bug, for example `/Bugs(ID=...,IsActiveEntity=true)`.

The comments and attachments fragments need that context:

- the comment feed needs `comments`;
- the attachment table needs `attachments`;
- the action controls need to know whether the bug is active and has no open draft.

This control extends `sap.m.VBox`. Before rendering, it walks up through public parent controls until it finds the nearest binding context. Then it sets that context on itself, so child controls can use normal relative bindings.

It does not use DOM selectors, generated Fiori internal IDs, private SAPUI5 APIs, credentials, or backend endpoints.

### Flow in IDTS

1. `manifest.json` loads the comments and attachments fragments.
2. Each fragment uses `<collab:BugCollaborationSection>` as the root container.
3. Fiori Elements places the section inside an Object Page subsection that already has the current Bug context.
4. `BugCollaborationSection` copies that public context onto itself.
5. Child controls can bind to `comments`, `attachments`, `IsActiveEntity`, and `HasDraftEntity`.

### Important source anchors

- **Location**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:1`
  `sap.ui.define(["sap/m/VBox"], ...)`
  **IDTS concept**: The custom collaboration sections remain normal SAPUI5 controls, not raw HTML.
  **Impact if broken**: The custom sections may stop rendering or may not follow SAPUI5/Fiori lifecycle behavior.
  **Must check together**: UI5 build, `CommentsSection.fragment.xml`, and `AttachmentsSection.fragment.xml`.

- **Location**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:17`
  `onBeforeRendering`
  **IDTS concept**: Copies the current Bug context into the custom section before the UI is drawn.
  **Impact if broken**: The comment input can stay disabled, the feed/table can show no data, and browser smoke can fail with missing context symptoms.
  **Must check together**: `BugCollaboration.js`, Object Page browser smoke, and `manifest.json` custom section registration.

- **Location**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:24`
  `parent.getBindingContext()`
  **IDTS concept**: Uses public SAPUI5 binding APIs instead of generated Fiori DOM IDs.
  **Impact if broken**: The implementation may become brittle across Fiori runtime updates.
  **Must check together**: SAP Fiori extension guidance and browser smoke after UI5/Fiori version changes.

### Cross-folder impact

- `CommentsSection.fragment.xml` and `AttachmentsSection.fragment.xml` instantiate this control.
- `manifest.json` loads the fragments as Object Page custom sections.
- `BugCollaboration.js` depends on the context being available so event handlers can find the current bug safely.

### Safe editing checklist

- Do not use generated IDs from Fiori Elements.
- Do not read or modify DOM nodes from this control.
- Do not add backend calls here; this control only handles context propagation.
- After changes, verify: comment input enabled on an active bug, comments load, attachments load, and full browser smoke passes.

## Vietnamese

### File này dùng để làm gì

File này định nghĩa một SAPUI5 control nhỏ dùng làm container gốc cho hai custom section Comments và Evidence / Attachments.

Nó tồn tại vì Object Page của Fiori Elements có binding context của Bug ở wrapper của custom section, nhưng root `VBox` thường trong fragment không kế thừa context đó ổn định trong runtime hiện tại. Nếu thiếu Bug context, các binding như `comments`, `attachments`, `IsActiveEntity`, và `HasDraftEntity` sẽ không hoạt động.

### Giải thích cho người mới

Trong SAPUI5, binding context cho một control biết nó đang hiển thị business object nào. Trên Bug Object Page, object đó là một bug, ví dụ `/Bugs(ID=...,IsActiveEntity=true)`.

Hai fragment comments và attachments cần context này:

- comment feed cần đọc `comments`;
- attachment table cần đọc `attachments`;
- các control action cần biết bug có active và không có draft mở hay không.

Control này kế thừa `sap.m.VBox`. Trước khi render, nó đi ngược lên các parent control bằng public API cho đến khi tìm thấy binding context gần nhất. Sau đó nó đặt context đó lên chính nó, để các control con dùng binding tương đối bình thường.

Nó không dùng DOM selector, generated internal ID của Fiori, private SAPUI5 API, credential, hoặc backend endpoint.

### Flow trong IDTS

1. `manifest.json` load hai fragment comments và attachments.
2. Mỗi fragment dùng `<collab:BugCollaborationSection>` làm root container.
3. Fiori Elements đặt section vào Object Page subsection đã có context của bug hiện tại.
4. `BugCollaborationSection` copy public context đó lên chính nó.
5. Các control con bind được `comments`, `attachments`, `IsActiveEntity`, và `HasDraftEntity`.

### Các điểm neo quan trọng trong source

- **Vị trí**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:1`
  `sap.ui.define(["sap/m/VBox"], ...)`
  **Khái niệm IDTS**: Hai custom collaboration section vẫn là SAPUI5 control bình thường, không phải raw HTML.
  **Ảnh hưởng nếu sai**: Custom section có thể không render hoặc không còn đi theo lifecycle SAPUI5/Fiori.
  **Phải kiểm tra cùng**: UI5 build, `CommentsSection.fragment.xml`, và `AttachmentsSection.fragment.xml`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:17`
  `onBeforeRendering`
  **Khái niệm IDTS**: Copy context của bug hiện tại vào custom section trước khi UI được vẽ.
  **Ảnh hưởng nếu sai**: Ô comment có thể bị disabled, feed/table có thể không có dữ liệu, và browser smoke fail vì thiếu context.
  **Phải kiểm tra cùng**: `BugCollaboration.js`, browser smoke Object Page, và đăng ký custom section trong `manifest.json`.

- **Vị trí**: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js:24`
  `parent.getBindingContext()`
  **Khái niệm IDTS**: Dùng public SAPUI5 binding API thay vì generated DOM ID của Fiori.
  **Ảnh hưởng nếu sai**: Implementation có thể trở nên dễ vỡ khi runtime Fiori đổi version.
  **Phải kiểm tra cùng**: SAP Fiori extension guidance và browser smoke sau khi đổi version UI5/Fiori.

### Liên kết với file/folder khác

- `CommentsSection.fragment.xml` và `AttachmentsSection.fragment.xml` dùng control này.
- `manifest.json` load hai fragment đó vào Object Page custom sections.
- `BugCollaboration.js` phụ thuộc context đã có để event handler tìm đúng bug hiện tại.

### Checklist sửa an toàn

- Không dùng generated ID của Fiori Elements.
- Không đọc hoặc sửa DOM node từ control này.
- Không thêm backend call ở đây; control này chỉ xử lý context propagation.
- Sau khi sửa, verify: comment input enabled trên active bug, comments load, attachments load, và full browser smoke pass.

## Metadata

- Source file: `app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/ext/controls/BugCollaborationSection.js.md`
- Source layer: `app`
- Last reviewed: 2026-07-04

## IDTS-73 create-page visibility and pending upload notes

### English

IDTS-73 extends this root control with two small properties:

- `hideOnCreate`: used by the Comments custom section so comments are not shown on the Create Bug page.
- `uploadPendingAttachmentsOnActive`: used by the Attachments custom section so files selected during create are uploaded after the bug becomes active.

This is still not a DOM hack. The control reads the public Fiori/Object Page binding context and uses the normal SAPUI5 control lifecycle. For comments, it hides the custom subsection only when the context is a brand-new create draft. For attachments, it asks `BugCollaboration.js` to flush any files that were selected while creating the bug.

Important anchors:

- **Location**: `hideOnCreate`
  **IDTS concept**: Comments are collaboration after a bug exists, not part of initial bug creation.
  **Impact if broken**: The Create Bug page can show a disabled or confusing Comments section.
  **Must check together**: `CommentsSection.fragment.xml` and browser create-page smoke.

- **Location**: `uploadPendingAttachmentsOnActive`
  **IDTS concept**: Create-time file selection is completed only after the bug is saved.
  **Impact if broken**: The selected evidence may never upload after Save.
  **Must check together**: `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, and IDTS-73 QA evidence.

### Vietnamese

IDTS-73 mở rộng root control này bằng hai property nhỏ:

- `hideOnCreate`: dùng cho custom section Comments để không hiện Comments trên màn hình Create Bug.
- `uploadPendingAttachmentsOnActive`: dùng cho custom section Attachments để file được chọn trong lúc create sẽ upload sau khi bug trở thành active.

Đây vẫn không phải DOM hack. Control đọc public binding context của Fiori/Object Page và dùng lifecycle SAPUI5 bình thường. Với Comments, nó chỉ ẩn custom subsection khi context là draft tạo mới. Với Attachments, nó gọi `BugCollaboration.js` để flush các file đã chọn trong lúc tạo bug.

Các anchor quan trọng:

- **Vị trí**: `hideOnCreate`
  **Khái niệm IDTS**: Comments là phần cộng tác sau khi bug đã tồn tại, không phải phần nhập liệu ban đầu khi tạo bug.
  **Ảnh hưởng nếu sai**: Create Bug page có thể hiện Comments section bị disabled hoặc gây rối.
  **Phải kiểm tra cùng**: `CommentsSection.fragment.xml` và browser smoke cho create page.

- **Vị trí**: `uploadPendingAttachmentsOnActive`
  **Khái niệm IDTS**: File chọn trong lúc tạo bug chỉ được hoàn tất sau khi bug được Save.
  **Ảnh hưởng nếu sai**: Evidence đã chọn có thể không bao giờ được upload sau khi Save.
  **Phải kiểm tra cùng**: `AttachmentsSection.fragment.xml`, `BugCollaboration.js`, và evidence QA của IDTS-73.
