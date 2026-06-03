---
name: sap-fiori
description: Query @sap-ux/fiori-mcp-server before writing Fiori Elements annotations, List Report/Object Page config, manifest routing, or Fiori app configuration.
paths:
  - "**/app/**/*.cds"
  - "**/app/**/manifest.json"
---

# Fiori MCP-First Development

Before writing, modifying, debugging, or fixing Fiori Elements artifacts, query the Fiori MCP server and apply its guidance.

## Tools

Use `mcp__fiori__*` tools when available:

- `mcp__fiori__search_docs`
- `mcp__fiori__list_fiori_apps`
- `mcp__fiori__list_functionality`
- `mcp__fiori__get_functionality_details`
- `mcp__fiori__execute_functionality`

## Scope

This skill covers:

- CDS annotations in `app/**/*.cds`
- `@UI`, `@Common`, `@Capabilities`, and related vocabularies
- Fiori Elements List Report and Object Page configuration
- `manifest.json` data sources, routing, targets, and control configuration
- Fiori Elements custom actions

## IDTS Fiori Rules

- Prefer annotation-driven Fiori Elements over custom UI5.
- The main user experience should remain a bug tracking app, not a generic project management suite.
- Use List Report for bug lists and Object Page for bug details, comments, attachments, and history sections.
- Use SAP semantic colors for status and priority presentation.
- Use i18n for user-facing text.
- When changing manifest or annotations, check whether Fiori MCP has a supported functionality before manual edits.
- Use the installed `sap-fiori-guidelines` skill for UX decisions involving tables, forms, messages, object pages, list reports, and status indicators.

## Verification

After Fiori annotation or manifest changes, run:

```bash
cds compile srv --to edmx
npm run watch-bug-management-ui
```

Use the most specific preview command available in `package.json`.
