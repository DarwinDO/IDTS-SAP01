# IDTS-107 — Technical Specification database and persistence package

- Owner: DonHV
- Due: 2026-07-30
- Status: Blocked by IDTS-105 and IDTS-106
- Jira: https://dutassociation.atlassian.net/browse/IDTS-107

## Gate sequence

1. Agent prepares candidate rows, diagrams, source traces and evidence-gap register.
2. DonHV reviews accuracy/template/evidence and records Jira + repo approval.
3. Approved package is handed to IDTS-112 integration.

## Scope

Architecture/data design, full entity/physical-table/column dictionary, draft/active,
transactions, PostgreSQL, S3, AuthSessions, history, notification deliveries/outbox,
email and related Technical Implementation.
