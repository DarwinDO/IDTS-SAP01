# IDTS-105 — Briefing current-truth audit

Baseline: `32111c0c7689f8040fce49205445432cc7d1892e`

Status: candidate remediation evidence. This report does not acknowledge the briefing
or approve any member-owned package.

## Audit matrix

| Briefing claim | Current project truth | Source/evidence | Decision | Implemented wording |
| --- | --- | --- | --- | --- |
| SQLite local, PostgreSQL QA and OpenAI disabled | SQLite remains local; deployed baseline is SAP BTP Cloud Foundry with CAP/AppRouter/XSUAA and HANA Cloud/HDI. AI is enabled through a private Vercel AI Gateway binding with feature-specific routes. | `mta.yaml`, `srv/ai/config.js`, `docs/project-context.md` | Update | Separate local, deployed, external-integration and rollback/reference environments. |
| Render deployment replaces SAP Transport Request | Current release control is Git/PR plus MTA, Cloud Foundry and HTML5 deployment. Render is rollback/reference only. | `mta.yaml`, BTP readiness evidence under `docs/pm/evidence/idts-117/` | Update | Record SAP TR as not applicable and explain the complete BTP equivalent. |
| DDIC maps to PostgreSQL tables | Current deployed physical artifacts are created in SAP HANA HDI from CDS. | `db/`, `mta.yaml`, IDTS-107 production-build inventory | Update | Map DDIC to CDS logical entities and HANA HDI artifacts; keep SQLite/PostgreSQL secondary. |
| Attachment external-storage acceptance is one undifferentiated PASS | BTP stores metadata/reference in HANA and binary in bound external object storage. Adapter/storage evidence and browser native-picker evidence are different acceptance layers. | `srv/attachment-storage.js`, `mta.yaml`, IDTS-113 evidence | Update | State the deployed storage split and report adapter/storage versus browser picker evidence separately. |
| HistoryLogs reasons are database-immutable | Current service behavior writes HistoryLogs append-only, but no database immutability constraint is proven. | `srv/bug-service/history.js`, `db/schema.cds` | Update | Describe append-only service behavior and do not claim a DB immutability guarantee. |
| Background work is an email polling worker | SAP Job Scheduling Service invokes a protected CAP outbox-processing endpoint; CAP owns delivery retry/lock/failure isolation. | `mta.yaml`, `srv/email/`, `docs/project-context.md` | Update | Explain scheduler, protected endpoint and worker responsibilities separately. |
| NhanT creates the Unit Test catalog | DonHV owns/approves the Unit Test catalog and integrates the workbook; NhanT executes and captures evidence. | `docs/pm/evidence/idts-110/unit-test-catalog-review.md` | Update | Record 188 `NOT_RUN` cases and the current owner/executor boundary. |
| IDTS-110 generated catalog status remains `DRAFT_FOR_DONHV_REVIEW` after human approval | The catalog was approved for execution, while every case must remain `NOT_RUN`. | `docs/pm/evidence/idts-110/unit-test-catalog-review.md`, `scripts/qa/generate-idts110-unit-test-catalog.js` | Update | Change only catalog-level status to `APPROVED_FOR_EXECUTION`; preserve 188 `NOT_RUN`. Normalize line endings in `--check` to avoid false stale results on Windows. |
| Broad UAT description without current count/ownership | DonHV owns/approves/integrates; NhanT executes Tester cases, SangVN/DatDT Developer cases, DonHV PM/database/integration cases. | `docs/pm/evidence/idts-111/uat-catalog-review.md` | Update | Record 90 `PREPARED`, with zero executed/PASS/FAIL/BLOCKED. |
| Historical test truth can be read as current | The former `21 PASSED + 6 PREPARED` result is legacy history and must not populate the new atomic catalogs. | IDTS-110/111 review evidence | Update | Explicitly separate legacy history from the 188/90 catalogs. |
| OpenAI live is disabled/not accepted | Current routes are feature-specific: Qwen embedding, GPT-5.4 Nano classification, MiniMax handoff and Z.AI assignment/general, with bounded route-specific fallback. | `mta.yaml`, `srv/ai/provider.js`, `srv/ai/vercel-gateway-provider.js` | Update | Require separate primary, model-fallback, deterministic-fallback, rate-limit and blocked evidence. |
| Functional Specification remediation continues | Mentor explicitly removed Functional Specification from the current remediation scope. | Existing briefing decision and IDTS-105 scope | Keep | Keep the exclusion unchanged. |
| Visible technical IDs are headings | Mentor requires natural numbering while technical identifiers remain in trace columns. | Existing mentor briefing decision | Keep | Keep `1`, `1.1`, `1.2`; prohibit `FN-*`, `FLOW-*`, `SCR-*` as primary headings. |
| Submission may remain bilingual | Current Mentor Current policy is English-only. | `AGENTS.md`, IDTS-106 scope | Keep | Keep internal Vietnamese briefing, but generate/upload only English submission artifacts. |

## Independent-audit handling

- BTP/runtime, test-truth/ownership, AI-routing and SAP490-formality audits were delegated
  as read-only work with disjoint scope.
- The primary agent accepts only findings that resolve against the frozen repository
  baseline and cited evidence.
- No delegated agent may edit the briefing, acknowledge for a member, approve a package,
  merge a PR, transition Jira, or modify Google Drive.

## Human gate

After the remediation PR merges, DonHV must personally read the briefing at the merge
SHA and add the matching repo acknowledgment and Jira comment. Until then the DonHV row
remains `PENDING`; this audit is not a substitute for that action.

## OfficeCLI gate

`officecli --version` returned `1.0.143`. OfficeCLI does not semantically validate
Markdown, so UTF-8, source-trace, path, policy and Git checks remain separate gates.

## BTP point-in-time readiness

Fresh `npm run btp:demo:check` returned `DEMO READY`: HANA-bound `/ready` HTTP 200,
CAP 1/1, AppRouter 1/1, `/health` HTTP 200, anonymous protected API HTTP 401 as
expected, and web entry HTTP 200. The HDI service's last broker operation was
`create succeeded`. `btp:demo:prepare` was not run because recovery was unnecessary.
No DB deploy, seed load, schema migration or credential read was performed.
