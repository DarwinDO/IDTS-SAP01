# Knowledge: `app/bug-management-ui/webapp/manifest.json`

## English

### What this file is for

Main Fiori Elements application descriptor. Read this file as the frontend wiring file. It points the app to `/odata/v4/bug/`, declares the OData model, and maps List Report/Object Page routes to `Bugs`.

### How to read this file

This file belongs to the Fiori/UI5 frontend layer. It affects generated screens, OData calls, UI tests, app bootstrap, or visible text.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- Browser starts the UI5 component.
- UI5 reads this manifest and finds the OData service `/odata/v4/bug/`.
- Fiori Elements uses `contextPath: /Bugs` to generate the List Report and Object Page.
- Annotation files add fields, sections, actions, and value helps on top of service metadata.

### Main concepts explained

- `dataSources.mainService.uri` is the backend URL the frontend calls.
- `models` tells UI5 which OData model and i18n resource bundle the app uses.
- `routes` and `targets` define movement from Bugs List Report to Bug Object Page.
- `contextPath: /Bugs` is the key connection from UI page to CAP service entity.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 3: `"sap.app": {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 18: `"dataSources": {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 20: `"uri": "/odata/v4/bug/"` — This is the backend OData endpoint the frontend calls.
- Line 45: `"sap.ui5": {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 59: `"models": {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 77: `"uri": "i18n/i18n.properties"` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 85: `"routes": [` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 97: `"targets": {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 104: `"contextPath": "/Bugs"` — This binds a Fiori page to a CAP service entity.
- Line 142: `"contextPath": "/Bugs"` — This binds a Fiori page to a CAP service entity.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- **Line 20 → `srv/service.cds`**: The frontend annotation/manifest points to `BugService` or its `/odata/v4/bug/` endpoint. Impact: If service entity/action names change, Fiori fields, buttons, routing, or data loading must be updated.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Vietnamese

### File này dùng để làm gì

Main Fiori Elements application descriptor. File này nằm ở lớp frontend Fiori/UI5. Nó ảnh hưởng màn hình, cách gọi OData, test UI, bootstrap app hoặc text hiển thị.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- Browser starts the UI5 component.
- UI5 reads this manifest and finds the OData service `/odata/v4/bug/`.
- Fiori Elements uses `contextPath: /Bugs` to generate the List Report and Object Page.
- Annotation files add fields, sections, actions, and value helps on top of service metadata.

### Các ý quan trọng cần hiểu

- `dataSources.mainService.uri` is the backend URL the frontend calls.
- `models` tells UI5 which OData model and i18n resource bundle the app uses.
- `routes` and `targets` define movement from Bugs List Report to Bug Object Page.
- `contextPath: /Bugs` is the key connection from UI page to CAP service entity.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **Line 20 → `srv/service.cds`**: The frontend annotation/manifest points to `BugService` or its `/odata/v4/bug/` endpoint. Impact: If service entity/action names change, Fiori fields, buttons, routing, or data loading must be updated.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Metadata

- Source file: `app/bug-management-ui/webapp/manifest.json`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/manifest.json.md`
- Source layer: `app`
- Source type: `.json`
- Source line count at documentation time: 170
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22
