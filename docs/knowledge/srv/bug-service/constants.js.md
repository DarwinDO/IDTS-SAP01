# Knowledge: `srv/bug-service/constants.js`

## English

### What this file is for

Backend helper module for `constants` behavior inside BugService. Read this file as one focused part of the service runtime. It is loaded directly or indirectly from `srv/service.js` and supports validation, permissions, read enrichment, side effects, drafts, content, monitoring, or history.

### How to read this file

This file belongs to the CAP service layer. It handles OData requests, business validation, read enrichment, permissions, or side effects.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- An OData request/action arrives at BugService.
- `srv/service.js` dispatches the request to this module or uses it during before/after processing.
- The module validates permissions/data, computes display fields, records side effects, or builds read models.
- The result is returned to Fiori and/or persisted using entities from `db/schema.cds`.

### Main concepts explained

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 189: `module.exports = {` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- **Module wiring → `srv/service.js`**: This module is loaded by the BugService bootstrap or a module that bootstrap uses. Impact: Changing exports/imports requires updating the service wiring.
- **Runtime contract → `srv/service.cds`**: The module implements behavior behind service entities/actions declared in CDS. Impact: The public OData contract and JavaScript behavior must stay aligned.
- **Data access → `db/schema.cds`**: The module reads/writes/query entities and associations from the data model. Impact: Renaming schema fields or changing associations can break handlers.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Keep backend validation authoritative; hidden UI buttons are not a security boundary.
- If action names, virtual fields, or entity names change, update CDS, annotations, tests, and this note together.

## Vietnamese

### File này dùng để làm gì

Backend helper module for `constants` behavior inside BugService. File này nằm ở lớp backend CAP service. Nó xử lý request OData, kiểm tra nghiệp vụ, tính field hiển thị, phân quyền hoặc side effect.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- An OData request/action arrives at BugService.
- `srv/service.js` dispatches the request to this module or uses it during before/after processing.
- The module validates permissions/data, computes display fields, records side effects, or builds read models.
- The result is returned to Fiori and/or persisted using entities from `db/schema.cds`.

### Các ý quan trọng cần hiểu

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **Module wiring → `srv/service.js`**: This module is loaded by the BugService bootstrap or a module that bootstrap uses. Impact: Changing exports/imports requires updating the service wiring.
- **Runtime contract → `srv/service.cds`**: The module implements behavior behind service entities/actions declared in CDS. Impact: The public OData contract and JavaScript behavior must stay aligned.
- **Data access → `db/schema.cds`**: The module reads/writes/query entities and associations from the data model. Impact: Renaming schema fields or changing associations can break handlers.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Keep backend validation authoritative; hidden UI buttons are not a security boundary.
- If action names, virtual fields, or entity names change, update CDS, annotations, tests, and this note together.

## Metadata

- Source file: `srv/bug-service/constants.js`
- Knowledge mirror: `docs/knowledge/srv/bug-service/constants.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: 207
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22
