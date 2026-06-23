# Knowledge: `app/bug-management-ui/eslint.config.mjs`

## English

### What this file is for

ESLint configuration for the Fiori/UI5 part of the app. It activates the official `@sap-ux/eslint-plugin-fiori-tools` rules.

### IDTS flow

During development and CI, this config helps catch common mistakes in annotations, manifest, i18n, and test code for the bug management app.

It is not core business logic but supports code quality for the Fiori layer.

### Important source anchors

- Import and export of the Fiori Tools ESLint plugin.
  **IDTS concept**: Enforces SAP Fiori / UI5 best practices in the files that define how the bug List Report and Object Page look and behave.
  **Impact if broken**: Bad annotation or manifest code may reach the browser and cause runtime UI issues or failed tests.
  **Must check together**: The actual annotation, manifest, i18n, and OPA test files under the app.

### Cross-folder dependency map

Only affects the `app/bug-management-ui` folder. Does not directly affect CAP service or database.

### Safe editing checklist

When adding new UI5 or annotation patterns, make sure the lint rules still cover them or extend the config if needed. Run the linter before committing Fiori changes.

## Vietnamese

### File này dùng để làm gì

Cấu hình ESLint cho phần Fiori/UI5 của app. Kích hoạt plugin chính thức của SAP-UX cho Fiori.

### Flow hoạt động trong IDTS

Trong dev và CI, config này giúp phát hiện lỗi phổ biến trong annotation, manifest, i18n và test của app quản lý bug.

Không phải logic nghiệp vụ cốt lõi, nhưng hỗ trợ chất lượng code cho lớp Fiori.

### Các điểm neo quan trọng trong source

Import và export Fiori Tools ESLint plugin.

### Liên kết với file/folder khác

Chỉ ảnh hưởng thư mục app/bug-management-ui. Không ảnh hưởng trực tiếp CAP service hay DB.

### Checklist sửa an toàn

Khi thêm pattern UI5/annotation mới, đảm bảo rule lint vẫn bao quát hoặc mở rộng config. Chạy linter trước khi commit thay đổi Fiori.

## Metadata

- Source file: `app/bug-management-ui/eslint.config.mjs`
- Knowledge mirror: `docs/knowledge/app/bug-management-ui/eslint.config.mjs.md`
- Source layer: `app`
- Last reviewed: 2026-06-22