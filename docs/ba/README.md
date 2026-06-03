# IDTS BA Documentation Pack

Status: BA baseline draft v1  
Last updated: 2026-05-28

This folder contains the business-analysis baseline used before CAP/Fiori implementation. It translates the current project scope and business rules into implementation-ready artifacts.

## Formal Deliverables

| Deliverable | English | Vietnamese | DOCX |
| --- | --- | --- | --- |
| BRD v1.1 | `brd/brd.en.md` | `brd/brd.vi.md` | `brd/brd.en.docx`, `brd/brd.vi.docx` |

Vietnamese:

| Deliverable | Tiếng Anh | Tiếng Việt | DOCX |
| --- | --- | --- | --- |
| BRD v1.1 | `brd/brd.en.md` | `brd/brd.vi.md` | `brd/brd.en.docx`, `brd/brd.vi.docx` |

## Source Documents

- `IDTS-SUMMARY.md`
- `IDTS-Business-Rule.md`
- `IDTS-PROJECT-SCOPE-SAP01.md`
- `docs/project-context.md`
- `docs/diagrams/`
- `docs/knowledge/`
- Current CAP/Fiori project files under `db/`, `srv/`, and `app/bug-management-ui/`

## Reading Order

1. `01-mvp-scope.md` - MVP scope, out-of-scope, and assumptions.
2. `02-glossary.md` - core business and SAP terminology.
3. `03-status-transition-matrix.md` - allowed status transitions and ownership.
4. `04-requirement-backlog.md` - BA backlog with acceptance criteria.
5. `05-data-dictionary.md` - entity and field blueprint for CDS modeling.
6. `06-authorization-matrix.md` - role permissions and action ownership.
7. `07-fiori-ux-requirements.md` - List Report/Object Page requirements.
8. `08-implementation-gap-analysis.md` - current repo gap against BA baseline.
9. `brd/brd.en.md` or `brd/brd.vi.md` - formal SAP490 hybrid Business Requirements Document.

## Working Rules

- These files are BA-level guidance. CAP implementation still needs CAP MCP guidance before modifying CDS, services, or handlers.
- When business meaning changes, update the canonical docs and this BA pack together.
- Keep IDTS focused on defect tracking. Do not expand it into a full Jira, SAP Cloud ALM, SAP Solution Manager, CI/CD, source-code management, or code review system.
