# Knowledge: `app/bug-management-ui/package.json`

## English

### What this file is for

Supporting configuration or documentation artifact. Read this file as project support for build, lint, preview, generated app metadata, package scripts, or local developer understanding.

### How to read this file

This file belongs to the Fiori/UI5 frontend layer. It affects generated screens, OData calls, UI tests, app bootstrap, or visible text.

Read it through three practical questions:

- What screen, API, data model, or developer workflow does this file support?
- Which other layer consumes the output of this file?
- If this file changes, which service/UI/data/test file must be checked next?

### Runtime / project flow

- The file supports app bootstrap, build, preview, lint, translation, or generated UI behavior.
- It normally affects the frontend first, but bad configuration can stop the UI from reaching the backend service.

### Main concepts explained

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Important source anchors

These anchors are deliberately short. They are not the main explanation; they only point you back to the most useful source locations after you understand the flow above.

- No concise source anchor was detected; update this note if future behavior becomes important.

### Cross-folder dependency map

This section answers: which file in another main folder is linked, where the link appears, and how the linked files affect each other.

- No direct cross-folder dependency was detected. If future edits add one, document the exact line/declaration and impact here.

### Safe editing checklist

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Vietnamese

### File này dùng để làm gì

Supporting configuration or documentation artifact. File này nằm ở lớp frontend Fiori/UI5. Nó ảnh hưởng màn hình, cách gọi OData, test UI, bootstrap app hoặc text hiển thị.

### Cách đọc file này cho dễ hiểu

- Đừng đọc file này như danh sách dòng code rời rạc.
- Hãy đọc theo flow: người dùng/UI làm gì, CAP service nhận gì, backend xử lý gì, và dữ liệu nào bị ảnh hưởng.
- Nếu phần English dài hơn, hãy xem đó là bản giải thích đầy đủ; phần Vietnamese này giúp nắm ý chính trước.

### Flow chính

- The file supports app bootstrap, build, preview, lint, translation, or generated UI behavior.
- It normally affects the frontend first, but bad configuration can stop the UI from reaching the backend service.

### Các ý quan trọng cần hiểu

- This file supports build, preview, lint, bootstrap, translation, or generated app behavior.
- It may not implement business behavior directly, but it can still affect whether developers can run, test, or understand the app.
- Configuration changes should be treated as code changes when they alter behavior or dependencies.

### Liên kết với file ở folder khác

Phần này nói rõ file này liên kết với file nào, liên kết nằm ở đâu, và nếu sửa một bên thì bên kia bị ảnh hưởng thế nào.

- No direct cross-folder dependency was detected. If future edits add one, document the exact line/declaration and impact here.

### Khi sửa file này cần chú ý

- Update this knowledge note in the same task whenever the source file changes meaning, dependency, API shape, UI behavior, validation, or seed data.
- Do not put secrets, AWS keys, passwords, private endpoints, or local-only credential values into the note.
- After changing linked CAP/Fiori files, verify metadata or UI behavior instead of assuming the service/UI contract still matches.

## Metadata

- Source file: `app/bug-management-ui/package.json`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/package.json.md`
- Source layer: `app`
- Source type: `.json`
- Source line count at documentation time: 21
- Documentation style: learning-oriented explanation, not line listing only
- Last reviewed: 2026-06-22

## Gate 6.4 release identity / Release identity Gate 6.4

### N2

English: N2 advances the app identity to `0.0.7`, aligned with manifest and lock root metadata. The new `lint` script checks changed notification modules and Component with the focused `eslint.notification.config.mjs`; no dependency is added. The app-wide Fiori config still fails to load missing dev-only `@babel/eslint-parser`, which is reported separately rather than hidden as green.

Tiếng Việt: N2 tăng identity app lên `0.0.7`, đồng bộ manifest và metadata gốc lockfile. Script `lint` mới kiểm module notification và Component bằng `eslint.notification.config.mjs` tập trung; không thêm dependency. Config Fiori toàn app vẫn thiếu `@babel/eslint-parser` dev-only và được báo riêng, không bị gọi sai là GREEN.

### N3 Task 8

**English:** The same `lint` script additionally targets `webapp/ext/sections/BugCollaboration.js`, the selected-comment-mention controller. This keeps changed-module lint reproducible with the already locked fallback configuration; it does not install or upgrade packages.

**Tiếng Việt:** Script `lint` này thêm target `webapp/ext/sections/BugCollaboration.js`, controller selected-comment-mention. Việc này giữ lint module đã đổi tái lập được bằng fallback configuration đã lock; không install hay upgrade package.

**English.** Version `0.0.6` publishes the Gate 6.4 User Administration header action under a fresh HTML5 cache identity. It changes release metadata only; dependencies and build commands are unchanged. Keep it equal to `webapp/manifest.json`, the top/root versions in `package-lock.json`, the built ZIP, and live HTML5 Repository readback.

**Tiếng Việt.** Version `0.0.6` phát hành action User Administration của Gate 6.4 bằng cache identity HTML5 mới. Chỉ metadata release thay đổi; dependency và build command giữ nguyên. Phải giữ bằng `webapp/manifest.json`, version top/root trong `package-lock.json`, ZIP build và readback HTML5 Repository live.

## Gate 7 notification cache identity / Cache identity thông báo Gate 7

**English:** Version `0.0.8` publishes the reviewed My Notifications hierarchy under a fresh HTML5 cache identity. Dependencies and scripts are unchanged.

**Tiếng Việt:** Version `0.0.8` phát hành bố cục My Notifications đã review bằng cache identity HTML5 mới. Dependency và script không đổi.
# 2026-09-03 cache identity 0.0.9

Bug Management advances to `0.0.9` so the live HTML5 repository and browser can distinguish the notification metadata-spacing bundle from `0.0.8`. Scripts and dependencies are unchanged.

Bug Management tăng lên `0.0.9` để HTML5 repository và trình duyệt phân biệt bundle sửa khoảng cách metadata notification với `0.0.8`. Script và dependency không đổi.
