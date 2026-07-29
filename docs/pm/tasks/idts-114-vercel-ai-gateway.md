# IDTS-114 — Backend: Integrate staged Vercel AI Gateway into SAP BTP AI assistance

Owner: DonHV
Due: 2026-08-03
Jira: https://dutassociation.atlassian.net/browse/IDTS-114

## Scope

Add a minimal Vercel AI Gateway provider adapter to the existing safe AI abstraction. The staged configuration is Ling first, Qwen primary later, then one OpenAI fallback. The AI functions remain advisory and human-reviewed.

## Current progress

- Implemented a native-fetch Vercel adapter with structured chat, embeddings, bounded timeout, and one safe fallback attempt.
- Added non-secret runtime override names and private configuration example placeholders.
- Completed deterministic provider and existing AI regressions; see `docs/pm/evidence/idts-114/README.md`.
- Live provider acceptance is pending private BTP configuration after review/merge. No secret is committed.

## Out of scope

No S3, Brevo, database schema, UI workflow, automatic classification/assignment, or BTP deployment configuration changes in this branch.
