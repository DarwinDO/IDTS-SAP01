# Knowledge: `app/bug-management-ui/annotations.cds`

## English

### What this file is for

Root annotation aggregator for the Fiori app. Read this file as the index of UI metadata. It imports `BugService` and then includes smaller annotation files for actions, list report, object page, labels, value helps, and child tables.

### How to read this file

This file belongs to the Fiori/UI5 frontend layer. It affects generated screens, OData calls, UI tests, app bootstrap, or visible text.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- CAP/Fiori tooling combines this annotation with `srv/service.cds` metadata.
- Fiori Elements reads the generated metadata and creates list/detail pages.
- When a user clicks a generated action button, Fiori calls the CAP action declared in `srv/service.cds` and handled by `srv/service.js`/`srv/bug-service/*`.

### Main concepts explained

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- Line 1: `using BugService as service from '../../srv/service';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 3: `using from './annotations/capabilities';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 4: `using from './annotations/labels';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 5: `using from './annotations/value-helps';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 6: `using from './annotations/list-report';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 7: `using from './annotations/object-page';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 8: `using from './annotations/actions';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 9: `using from './annotations/ownership-assignment';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.
- Line 10: `using from './annotations/history-notifications';` — This imports another CDS service/model; if the imported file changes, this file can compile differently.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- **Line 1 → `srv/service.cds`**: The frontend annotation/manifest points to `BugService` or its `/odata/v4/bug/` endpoint. Impact: If service entity/action names change, Fiori fields, buttons, routing, or data loading must be updated.
- **Annotation target → `db/schema.cds`**: Most annotated fields originate from `db/schema.cds` through `srv/service.cds` projections. Impact: Schema field/association changes can break Fiori metadata through the service layer.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Compile or inspect OData metadata after annotation changes so you know Fiori can still find the target fields/actions.
- Check `srv/service.cds` before adding a field/action reference; annotations cannot invent backend fields.

## Vietnamese

### File này dùng để làm gì

Root annotation aggregator for the Fiori app. File này nằm ở lớp frontend Fiori/UI5. Nó ảnh hưởng màn hình, cách gọi OData, test UI, bootstrap app hoặc text hiển thị.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- CAP/Fiori tooling combines this annotation with `srv/service.cds` metadata.
- Fiori Elements reads the generated metadata and creates list/detail pages.
- When a user clicks a generated action button, Fiori calls the CAP action declared in `srv/service.cds` and handled by `srv/service.js`/`srv/bug-service/*`.

### Các ý quan trọng cần hiểu

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- **Line 1 → `srv/service.cds`**: The frontend annotation/manifest points to `BugService` or its `/odata/v4/bug/` endpoint. Impact: If service entity/action names change, Fiori fields, buttons, routing, or data loading must be updated.
- **Annotation target → `db/schema.cds`**: Most annotated fields originate from `db/schema.cds` through `srv/service.cds` projections. Impact: Schema field/association changes can break Fiori metadata through the service layer.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.
- Compile or inspect OData metadata after annotation changes so you know Fiori can still find the target fields/actions.
- Check `srv/service.cds` before adding a field/action reference; annotations cannot invent backend fields.

## Metadata

- Source file: `app/bug-management-ui/annotations.cds`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/annotations.cds.md`
- Source layer: `app`
- Source type: `.cds`
- Source line count at documentation time: 10
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22
