# IDTS SAP CAP/Fiori Agent Instructions

## Entry Point

IDTS is a SAP CAP Node.js and SAP Fiori/UI5 application for defect tracking. Work conservatively: understand the project first, use SAP-supported patterns, preserve documented scope, and explain SAP concepts plainly for a team new to CAP/Fiori.

`AGENTS.md` is intentionally short. The canonical detailed rules live in [`.agents/rules/README.md`](.agents/rules/README.md); read every rule that matches the task before acting.

## Required Start Sequence

1. Read `docs/project-context.md`.
2. Identify the team member: `donhv`, `sangvn`, `datdt`, or `nhant`. DonHV is the BA/PM consolidation lead and may coordinate cross-member work.
3. Read `docs/pm/current-status.md`, `docs/pm/task-board.md`, the executing member status, and the relevant work package. Read `docs/pm/risk-decision-log.md` for scope, priority, risk, ownership, or durable decisions.
4. For code/artifact changes, read the relevant parts of `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, `IDTS-SUMMARY.md`, `README.md`, `package.json`, `db/`, `srv/`, and `app/`.
5. For bug, test, QA, or SAP490 synchronization, read every `docs/pm/status/*.md` file before selecting evidence.

## Mandatory Rule Routing

| Task | Required rules |
| --- | --- |
| Any project work | `scope-and-domain`, `handover-and-issue-logging`, `change-control-and-git` |
| CAP/CDS/OData/Fiori/UI5 | `sap-routing-and-ui` |
| Any code question, reading, design, writing, refactor, debug, review, or audit | `skills-quality-and-ponytail` |
| Docs, knowledge mirrors, SAP490, Drive, DOCX/XLSX/PPTX/PDF | `documentation-knowledge-and-sap490` |
| Tests, security, config, deployment, release claims | `testing-security-and-release` |

## Non-Negotiable Rules

- Use a dedicated branch for every nontrivial task: `<type>/<jira-key-or-task-id>-<short-task-slug>-<member>`.
- Record every observed issue immediately in the correct member status file. SAP490 Test and Fix Bug contains product defects only; minor non-product issues remain in member status.
- For SAP-specific code, query the matching MCP first: CAP for backend/CDS, SAP UX for Fiori Elements, UI5 for UI5 code. Verify a deferred MCP with a read-only call before modification.
- Apply `karpathy-guidelines` to nontrivial project work. Apply the mandatory Ponytail matrix in `skills-quality-and-ponytail.md` to every code-related task.
- Update canonical business documents together only when business meaning changes. Update knowledge mirrors for changed tracked files in `app/`, `srv/`, or `db/`.
- Never commit credentials, tokens, OAuth data, private endpoints, or local/private configuration.
- Use fresh verification evidence before claiming completion and report every skill, MCP, connector, command, warning, and remaining risk.

## Project Boundaries

In scope: bug reporting, duplicate support, classification, assignment, developer review, information requests, rejection follow-up, lifecycle actions, comments, notifications, audit/history, attachments, and PM monitoring.

Out of scope: direct code fixing, source control, CI/CD, code-review workflow, full Jira replacement, complex incident management, mandatory AI root-cause analysis, and autonomous AI workflow decisions.
