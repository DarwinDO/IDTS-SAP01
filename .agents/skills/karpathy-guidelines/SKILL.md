---
name: karpathy-guidelines
description: Behavioral guardrails for SAP CAP/Fiori coding agents working in IDTS. Use when making nontrivial code, model, UI, documentation, review, refactor, debugging, or planning changes to surface assumptions, avoid overengineering, keep edits surgical, and define verifiable success criteria.
---

# Karpathy Guidelines for IDTS

Use this skill as a behavior layer. It does not replace SAP MCP routing, CAP/Fiori/UI5 rules, AI DevKit workflow, or the IDTS business documents.

Source inspiration: `multica-ai/andrej-karpathy-skills`, adapted for this repository instead of copied directly.

## 1. Think Before Editing

Before changing files, identify what is known, what is assumed, and what could be ambiguous.

For IDTS, pause and clarify when ambiguity affects:

- SAP Module vs Application Component vs Defect Category.
- Entity relationships, ownership, or status transitions.
- Role permissions for Reporter/Admin, Developer, or PM.
- Whether a request changes MVP scope.
- Whether a Fiori requirement is annotation-driven or custom UI5.
- Whether a CAP rule belongs in CDS, service definition, handler logic, or UI annotation.

If a safer or smaller approach exists, say it and explain the tradeoff.

## 2. Simplicity First

Choose the smallest maintainable solution that satisfies the documented IDTS requirement.

Do:

- Prefer CAP built-in patterns over custom infrastructure.
- Prefer Fiori Elements annotations over custom SAPUI5 code.
- Add only entities, fields, actions, validations, and UI behavior needed by the current flow.
- Keep MVP boundaries visible in docs and implementation.

Avoid:

- Turning IDTS into Jira, SAP Cloud ALM, SAP Solution Manager, ServiceNow, CI/CD, or source-code management.
- Adding generic workflow engines, plugin systems, complex approvals, or mandatory AI Root Cause Analysis without explicit scope.
- Creating abstractions for one use case.
- Making future deployment choices, tenant endpoints, or credentials part of source code.

## 3. Surgical Changes

Touch only the files needed for the request.

When editing:

- Match the local naming, formatting, and structure.
- Keep unrelated markdown, schema, generated Fiori files, and package metadata untouched.
- Do not reformat or refactor adjacent code to make it prettier.
- If you discover unrelated problems, report them separately.
- Remove only unused artifacts introduced by your current change.

For business changes, update the canonical docs together:

- `IDTS-SUMMARY.md`
- `IDTS-Business-Rule.md`
- `IDTS-PROJECT-SCOPE-SAP01.md`
- `docs/project-context.md`

## 4. Goal-Driven Execution

Convert the request into a verifiable goal before claiming completion.

Examples:

- "Add a status" becomes "Update business docs, CDS enum/value list if present, status transition validation, Fiori display, and verification."
- "Improve assignment" becomes "Filter assignee choices by Component Category and optional SAP Module, then validate the rule in CAP."
- "Update diagrams" becomes "Update the affected diagram files and check Mermaid code fences."

For multi-step work, keep a short plan with verification per phase.

## 5. Verification Discipline

Use the smallest relevant verification:

- CAP model/service: `cds compile srv --to edmx`.
- CAP DB config: `cds env requires.db`.
- AI DevKit docs/workflow: `npx ai-devkit@latest lint --json`.
- Markdown: check code fences and key terms with `rg`.
- Fiori/UI5 changes: run available UI5/Fiori lint or preview command.

If verification fails, report the exact command and error before moving on.

## 6. How to Know This Skill Is Working

The output is good when:

- The diff contains only requested and necessary files.
- The solution is smaller than a generic enterprise platform design.
- Assumptions and tradeoffs are explicit.
- SAP-specific work still follows the right MCP/server and Fiori guideline routing.
- The final response lists verification evidence and any remaining risk.
