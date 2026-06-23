# Knowledge: `app/bug-management-ui/webapp/test/integration/opaTests.qunit.js`

## English

### What this file is for

Frontend automated test/support file. Read this file as test code for the generated Fiori app. It checks user-facing behavior that depends on manifest routing, annotations, and service metadata.

### How to read this file

This file belongs to the Fiori/UI5 frontend layer. It affects generated screens, OData calls, UI tests, app bootstrap, or visible text.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- The test starts or targets the Fiori app.
- It navigates generated pages that depend on `manifest.json`, annotations, and BugService metadata.
- If UI annotations or service fields change, selectors/assertions may need to change too.

### Main concepts explained

- This is test automation, not production behavior.
- It depends on stable labels, routes, controls, and service metadata.
- When annotations change layout, update tests in the same task.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 20: `sap.ui.require(` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 28: `], function (QUnit) {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- **Test journey/page object → `srv/service.cds`**: The tested UI is generated from BugService metadata. Impact: Backend metadata changes can break UI assertions even if the test file did not change.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Vietnamese

### File này dùng để làm gì

Frontend automated test/support file. File này nằm ở lớp frontend Fiori/UI5. Nó ảnh hưởng màn hình, cách gọi OData, test UI, bootstrap app hoặc text hiển thị.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- The test starts or targets the Fiori app.
- It navigates generated pages that depend on `manifest.json`, annotations, and BugService metadata.
- If UI annotations or service fields change, selectors/assertions may need to change too.

### Các ý quan trọng cần hiểu

- This is test automation, not production behavior.
- It depends on stable labels, routes, controls, and service metadata.
- When annotations change layout, update tests in the same task.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **Test journey/page object → `srv/service.cds`**: The tested UI is generated from BugService metadata. Impact: Backend metadata changes can break UI assertions even if the test file did not change.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Metadata

- Source file: `app/bug-management-ui/webapp/test/integration/opaTests.qunit.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/test/integration/opaTests.qunit.js.md`
- Source layer: `app`
- Source type: `.js`
- Source line count at documentation time: 31
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22
