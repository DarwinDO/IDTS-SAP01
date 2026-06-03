---
name: sap-ui5
description: Query @ui5/mcp-server before writing SAPUI5 controllers, XML views, fragments, formatters, event handlers, or bindings.
paths:
  - "**/app/**/*.xml"
  - "**/app/**/ext/**/*.js"
  - "**/app/**/ext/**/*.ts"
  - "**/app/**/formatter*.js"
  - "**/app/**/fragment*.xml"
---

# UI5 MCP-First Development

Before writing, modifying, debugging, or fixing SAPUI5 code, query the UI5 MCP server and apply its guidance.

## Tools

Use `mcp__ui5__*` tools when available:

- `mcp__ui5__get_guidelines`
- `mcp__ui5__get_api_reference`
- `mcp__ui5__get_project_info`
- `mcp__ui5__run_ui5_linter`
- `mcp__ui5__run_manifest_validation`

## Scope

This skill covers:

- SAPUI5 XML views
- Controller extensions
- Fragments
- Formatters
- Event handlers
- Model bindings
- UI5 API usage and linting

## UI5 Rules

- Use XML views/fragments, not JavaScript views.
- Use `sap.ui.define`; do not rely on globals.
- Keep async loading enabled.
- Use i18n for all user-facing text.
- Avoid deprecated APIs such as `jQuery.sap.*`, sync loading, and direct `sap.ui.getCore()` usage.
- For Fiori Elements controller extensions, follow UI5 MCP guidance for extension API usage.
- Use `sap-fiori-guidelines` for message handling, action placement, tables, forms, and semantic status colors.

## Verification

After UI5 changes, run the UI5 MCP linter when available:

```text
mcp__ui5__run_ui5_linter
```

Also run the local app preview if the change affects runtime behavior.
