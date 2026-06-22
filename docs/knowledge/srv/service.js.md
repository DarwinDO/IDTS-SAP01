# Knowledge: `srv/service.js`

## English

### What this file is for

Runtime bootstrap for BugService. Read this file as the place where the CDS service contract becomes executable behavior. `srv/service.cds` says what exists; this file wires the before/on/after handlers that make it work.

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

- `this.before(...)` is where the service prepares or validates data before CAP saves or reads it.
- `this.after(...)` enriches read results or records side effects after CAP has done the core operation.
- `this.on(...)` handles custom reads/actions such as `AssignableDevelopers`, `DeveloperWorkloads`, and workflow actions.
- This file should stay as wiring/orchestration; detailed logic belongs in focused modules under `srv/bug-service/`.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 1: `const cds = require('@sap/cds')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 6: `} = require('./bug-service/constants')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 12: `} = require('./bug-service/history')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 19: `} = require('./bug-service/read-models')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 23: `} = require('./bug-service/history-read-models')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 25: `const { readDeveloperWorkloads } = require('./bug-service/monitoring')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 26: `const { registerReadOnlyEntityGuards } = require('./bug-service/guards')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 27: `const { prepareBugWrite } = require('./bug-service/bug-write')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.
- Line 33: `} = require('./bug-service/actions')` — This declares or uses a business operation that Fiori/OData can call.
- Line 37: `} = require('./bug-service/content')` — This is a control point that changes imports, metadata, runtime behavior, routing, test behavior, or displayed text.

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

Runtime bootstrap for BugService. File này nằm ở lớp backend CAP service. Nó xử lý request OData, kiểm tra nghiệp vụ, tính field hiển thị, phân quyền hoặc side effect.

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

- `this.before(...)` is where the service prepares or validates data before CAP saves or reads it.
- `this.after(...)` enriches read results or records side effects after CAP has done the core operation.
- `this.on(...)` handles custom reads/actions such as `AssignableDevelopers`, `DeveloperWorkloads`, and workflow actions.
- This file should stay as wiring/orchestration; detailed logic belongs in focused modules under `srv/bug-service/`.

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

- Source file: `srv/service.js`
- Knowledge mirror: `docs/knowledge/srv/service.js.md`
- Source layer: `srv`
- Source type: `.js`
- Source line count at documentation time: 156
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22
