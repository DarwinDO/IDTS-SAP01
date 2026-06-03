---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
---

# Implementation Guide

Use this phase for implementation notes that help future agents understand what changed and why.

## Development Setup

- CAP Node.js project.
- Local SQLite development.
- Fiori app path: `app/bug-management-ui`.
- Main model path: `db/schema.cds`.
- Main service path: `srv/service.cds`.

## Code Structure

- `db/`: persistent model and reusable domain entities.
- `srv/`: service projections, OData actions/functions, handlers, backend validation.
- `app/bug-management-ui`: Fiori Elements/SAPUI5 app, annotations, manifest, extensions.
- `docs/`: project context, MCP setup, AI DevKit workflow notes.

## Implementation Notes

- Prefer annotation-driven Fiori Elements.
- Use CAP service event handlers and `cds.log` for backend behavior.
- Keep business-critical status transitions enforced server-side.
- Keep user-facing text in i18n where applicable.

## Integration Points

- No hardcoded SAP BTP/HANA/PostgreSQL endpoints.
- No hardcoded webhook or notification endpoints.
- Add external service configuration only when explicitly requested.

## Error Handling

- Use CAP request errors for business validation.
- Use Fiori message handling patterns for user-facing issues.
- Use MessageBox only for interrupting decisions.

## Performance Considerations

- Avoid unnecessary custom UI code when annotations are sufficient.
- Avoid raw SQL unless CAP MCP/docs confirm the need.
- Keep PM monitoring queries scoped and explainable.

## Security Notes

- Never commit credentials, tokens, service keys, `.env`, `default-env.json`, or `.cdsrc-private.json`.
- Do not store secrets in AI DevKit memory.
- Treat MCP config, manifest files, and package scripts as security-sensitive.
