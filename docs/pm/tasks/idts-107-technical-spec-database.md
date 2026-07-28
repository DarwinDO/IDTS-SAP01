# IDTS-107 — Technical Specification database and persistence package

- Owner: DonHV
- Due: 2026-07-30
- Status: In Progress — Gate 1 candidate prepared; human acknowledgment/approval and IDTS-112 integration remain blocked
- Jira: https://dutassociation.atlassian.net/browse/IDTS-107

## Gate sequence

1. Agent prepares candidate rows, diagrams, source traces and evidence-gap register.
2. DonHV reviews accuracy/template/evidence and records Jira + repo approval.
3. Approved package is handed to IDTS-112 integration.

## Scope

Architecture/data design, full entity/physical-table/column dictionary, draft/active,
transactions, PostgreSQL, S3, AuthSessions, history, notification deliveries/outbox,
email and related Technical Implementation.

## Gate 1 candidate — 2026-07-29

- Baseline: `362ace2a39a82d19c4acc723fe96a15bf7373f5e`.
- Generator: `scripts/sap490/generate-idts107-database-candidate.js`.
- Candidate narrative: `docs/pm/evidence/idts-107/technical-spec/database-persistence-candidate.md`.
- Generated physical dictionary: `docs/pm/evidence/idts-107/technical-spec/database-dictionary.csv`.
- Draft PR: https://github.com/DarwinDO/IDTS-SAP01/pull/208.
- CDS/HANA compile inventory: 35 physical tables and 326 physical columns.
- Candidate covers HANA/HDI, draft and active persistence, transaction/rollback,
  PostgreSQL rollback baseline, S3 metadata/binary boundary, AuthSessions,
  history, notification outbox, Brevo and Job Scheduler.
- Gate state: candidate only. DonHV acknowledgment and approval are still required;
  the official Technical Specification workbook and Google Drive artifact have not
  been changed.
