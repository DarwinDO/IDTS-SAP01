# Knowledge: `app/bug-management-ui/webapp/Component.js`

## English

### What this file is for

Standard UI5 Component bootstrap for the Fiori Elements app. It initializes the component with the manifest and starts the app.

### IDTS flow

This is the entry point loaded by index.html / manifest. It tells UI5 to use the configuration from manifest.json to connect to the BugService and render the List Report + Object Page.

Very little custom code; most behavior comes from annotations and the service metadata.

## Vietnamese

### File này dùng để làm gì

File bootstrap Component UI5 chuẩn cho Fiori Elements app.

### Flow IDTS

Điểm vào của app. Load manifest và kết nối service.

Hầu như không có code tùy chỉnh; hành vi đến từ annotation và service.

## Metadata

- Source file: `app/bug-management-ui/webapp/Component.js`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/webapp/Component.js.md`
- Source layer: `app`
- Last reviewed: 2026-06-22