# Agent Skills

This repository uses local skills and an installed SAP AI Skills Library skill to keep future coding agents aligned with the IDTS scope.

## Installed SAP AI Skills Library Skill

The official SAP skill was installed with:

```bash
npx skills add SAP/ai-skills-library --skill sap-fiori-guidelines
```

Installed location:

- `.agents/skills/sap-fiori-guidelines`

Lock file:

- `skills-lock.json`

Use `sap-fiori-guidelines` when designing, building, or reviewing:

- Fiori Elements List Report
- Object Page
- SAP table behavior
- SAP form behavior
- SAP message handling
- Status semantic colors
- SAPUI5 component patterns
- Accessibility and UX consistency

## Repo-Local Routing Skills

The repo-local skills have been copied into `.agents/skills/` so Codex can discover them as active project skills. The root `skills/` folder can remain as a source/reference copy, but `.agents/skills/` is the active location agents should use.

The following skills are inspired by `SAP-samples/cap-agentic-engineered`, but rewritten for the Issue and Defect Tracking System domain:

- `.agents/skills/sap-cap/SKILL.md`: CAP/CDS/service/handler work
- `.agents/skills/sap-fiori/SKILL.md`: Fiori Elements annotations and manifest work
- `.agents/skills/sap-ui5/SKILL.md`: SAPUI5 XML/controller/formatter/binding work
- `.agents/skills/karpathy-guidelines/SKILL.md`: behavior guardrails for assumption handling, simple design, surgical edits, and verifiable completion
- `.agents/skills/product-discovery/SKILL.md`: BA product discovery before BRD/SRS/FRS, diagrams, scope changes, or unclear requirements
- `.agents/skills/idts-ba-docx-deliverables/SKILL.md`: IDTS-specific SAP490 hybrid BRD/SRS/FRS Markdown and DOCX deliverable routing
- `.agents/skills/idts-database-modeling/SKILL.md`: IDTS-specific database modeling review for CAP/CDS, ERD support, normalization, value helps, audit/history, notifications, and assignment data

These skills do not replace the installed SAP Fiori Guidelines skill. They route the agent to the correct MCP server before code changes.

`.agents/skills/sap-cap/SKILL.md` also incorporates selected CAP/Capire practices from the community `secondsky/sap-skills` CAP skill as secondary guidance. Because that external skill is GPL-3.0, do not copy its templates or long examples into this repo. Use the local skill's distilled IDTS-specific rules and verify current CAP syntax with `@cap-js/mcp-server`.

`.agents/skills/karpathy-guidelines/SKILL.md` is adapted from `multica-ai/andrej-karpathy-skills` as repo-local behavioral guidance. It should be used for nontrivial code, model, UI, documentation, review, refactor, debugging, or planning work. It must not override SAP MCP-first routing, SAP Fiori Guidelines, AI DevKit workflow, or the canonical IDTS business documents.

`.agents/skills/product-discovery/SKILL.md` is adapted from `phucnt-bazone-vietnam/product-discovery` by Phuc NT / BA Zone / Digital School. It keeps the Ask Why discovery structure, preserves attribution, and rewrites the active examples and question bank for IDTS SAP defect tracking. Use it before committing unclear business requests into BRD/SRS/FRS, diagrams, CAP model/service behavior, Fiori UX, or PM planning.

Vietnamese:

`.agents/skills/product-discovery/SKILL.md` được điều chỉnh từ `phucnt-bazone-vietnam/product-discovery` của Phuc NT / BA Zone / Digital School. Skill này giữ cấu trúc Ask Why, giữ attribution và viết lại ví dụ/question bank cho IDTS SAP defect tracking. Dùng skill này trước khi đưa requirement chưa rõ vào BRD/SRS/FRS, diagrams, CAP model/service behavior, Fiori UX hoặc PM planning.

## BA and DOCX Deliverable Skills

Use `.agents/skills/idts-ba-docx-deliverables/SKILL.md` as the primary skill for formal IDTS BA deliverables. It coordinates SAP490 hybrid structure, English/Vietnamese split files, Markdown/DOCX output locations, DOCX quality rules, and the safe use of external document skills.

Installed external document support skills:

- `.agents/skills/docx/SKILL.md`: advanced DOCX and OOXML support.
- `.agents/skills/docx-manipulation/SKILL.md`: practical `python-docx` generation and table formatting guidance.
- `.agents/skills/brd-creation/SKILL.md`: generic BRD checklist and structure guidance.
- `.agents/skills/srs-documentation/SKILL.md`: generic SRS checklist and structure guidance.
- `.agents/skills/frs-creation/SKILL.md`: generic FRS checklist and functional requirement structure guidance.

These external skills are secondary references. They must not override `AGENTS.md`, `docs/project-context.md`, SAP490 hybrid decisions, the canonical IDTS business documents, SAP MCP routing, or the `idts-ba-docx-deliverables` skill.

Vietnamese:

Dùng `.agents/skills/idts-ba-docx-deliverables/SKILL.md` làm skill chính cho các deliverable BA chính thức của IDTS. Skill này điều phối cấu trúc SAP490 hybrid, file tách tiếng Anh/tiếng Việt, vị trí output Markdown/DOCX, rule chất lượng DOCX, và cách dùng an toàn các external document skills.

Các external document support skills đã cài:

- `.agents/skills/docx/SKILL.md`: hỗ trợ DOCX và OOXML nâng cao.
- `.agents/skills/docx-manipulation/SKILL.md`: guidance thực dụng cho `python-docx` và format bảng.
- `.agents/skills/brd-creation/SKILL.md`: checklist và cấu trúc BRD generic.
- `.agents/skills/srs-documentation/SKILL.md`: checklist và cấu trúc SRS generic.
- `.agents/skills/frs-creation/SKILL.md`: checklist FRS generic và cấu trúc functional requirement.

Các external skills này chỉ là nguồn tham khảo phụ. Chúng không được override `AGENTS.md`, `docs/project-context.md`, quyết định SAP490 hybrid, các file nghiệp vụ canonical của IDTS, SAP MCP routing, hoặc skill `idts-ba-docx-deliverables`.

## Database Modeling Skills and Tools

Use `.agents/skills/idts-database-modeling/SKILL.md` as the primary skill for IDTS database review and CAP/CDS data-model planning.

Installed database support:

- `.agents/skills/database-schema-design/SKILL.md`: generic normalization and relationship design reference.
- DBML CLI was evaluated but not kept because its binary timed out in this session and it added dependency audit noise.

These are secondary aids. CAP CDS remains the implementation source of truth, and database work must still follow `sap-cap`, CAP MCP-first routing, `docs/project-context.md`, and the IDTS BA data dictionary.

Vietnamese:

Dùng `.agents/skills/idts-database-modeling/SKILL.md` làm skill chính cho review database và lập kế hoạch CAP/CDS data model của IDTS.

Database support đã cài:

- `.agents/skills/database-schema-design/SKILL.md`: nguồn tham khảo generic về normalization và relationship design.
- DBML CLI đã được thử nhưng không giữ lại vì binary bị timeout trong phiên này và làm tăng cảnh báo audit dependency.

Các công cụ này chỉ là nguồn hỗ trợ phụ. CAP CDS vẫn là source of truth cho implementation, và database work vẫn phải đi theo `sap-cap`, CAP MCP-first routing, `docs/project-context.md`, và IDTS BA data dictionary.

## AI DevKit Workflow Skills

The following AI DevKit skills are installed under `.agents/skills` from `codeaholicguy/ai-devkit`:

- `dev-lifecycle`: requirements, design, planning, implementation, and testing workflow.
- `verify`: structured verification before reporting completion.
- `memory`: stable project memory; never store secrets or personal data.
- `structured-debug`: reproduce, isolate, fix, and verify defects.
- `document-code`: keep implementation notes and docs aligned with code changes.

Use these skills as workflow scaffolding only. SAP domain decisions still come from the business markdown files, SAP MCP servers, repo-local SAP routing skills, and the SAP Fiori Guidelines skill.

## How Agents Should Use These Skills

- For `db/**/*.cds`, `srv/**/*.cds`, and `srv/**/*.js`, query CAP MCP first.
- For `app/**/*.cds` and `app/**/manifest.json`, query Fiori MCP first.
- For `app/**/*.xml`, `app/**/ext/**/*.js`, fragments, formatters, and controller extensions, query UI5 MCP first.
- For user experience decisions, read `sap-fiori-guidelines` and the relevant reference file under `.agents/skills/sap-fiori-guidelines/references`.
- For new or unclear business requirements, use `product-discovery` first and store findings under `docs/ba/discovery/` when the result should persist.
- For cross-layer changes, combine the relevant skills instead of guessing.
- For multi-file or business-flow changes, use AI DevKit phases under `docs/ai` before and after implementation.

## Scope Reminder

Keep all skill guidance inside the documented IDTS scope. Do not expand the project into a full Jira clone, source-code management system, CI/CD tool, or mandatory AI root cause analysis product.
