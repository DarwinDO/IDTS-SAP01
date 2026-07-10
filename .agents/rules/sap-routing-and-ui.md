---
name: idts-sap-routing-and-ui
description: MCP-first routing and SAP CAP/Fiori/UI5 implementation rules.
applies_to: CDS, CAP handlers, OData, Fiori Elements, SAPUI5, UI copy
priority: required
---

# SAP Routing and UI

- Before SAP-specific changes, query the appropriate MCP server and use a small read-only probe after lazy loading:
  - CAP MCP for CDS, services, handlers, transactions, CQL, OData actions/functions.
  - SAP UX MCP for annotations, List Report/Object Page, manifest routing, and Fiori Elements configuration.
  - UI5 MCP for views, controllers, fragments, bindings, formatters, and control APIs.
- Prefer CAP-supported APIs, request-aware transactions, and portable models. Use `cds.log`, not production `console.log`.
- Prefer annotations before custom UI5. Keep Fiori Elements List Report/Object Page patterns and i18n user-visible copy.
- Use `sap-fiori-guidelines` for tables, forms, messages, status colors, accessibility, and UX decisions.
- User-visible screens must not expose developer notes, prompts, provider internals, environment details, credentials, deployment text, or team-process language.
- For code under `app/`, `srv/`, or `db/`, update the matching bilingual knowledge mirror under `docs/knowledge/`.
