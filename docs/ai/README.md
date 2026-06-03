# AI DevKit Workflow for IDTS

This folder stores AI DevKit workflow notes for the Issue and Defect Tracking System in SAP.

Use these phase folders for substantial changes:

- `requirements`: what the change must do, mapped to the business markdown files.
- `design`: CAP, OData, Fiori Elements, SAPUI5, and UX design decisions.
- `planning`: implementation steps and affected files.
- `implementation`: notable implementation details and migration notes.
- `testing`: verification commands, manual checks, and known gaps.

Rules:

- Keep every note inside the IDTS scope in `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, and `docs/project-context.md`.
- Prefer SAP MCP guidance for CAP/Fiori/UI5 details before writing code.
- Do not store credentials, tokens, service keys, private endpoints, or personal data here.
- Do not use AI DevKit templates to introduce unrelated stacks or product areas.
- Record stable reusable decisions through `/remember` only when they are non-secret and broadly useful.
