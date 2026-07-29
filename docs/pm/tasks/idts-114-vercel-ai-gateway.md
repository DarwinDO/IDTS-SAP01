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
- PR #209 merged into `dev` at `d9a1df1b157f3c50c75b6861259cfb284455c147`.
- SAP BTP now uses Qwen `alibaba/qwen3.7-flash` for structured generation and
  `alibaba/qwen3-embedding-0.6b` for embeddings. One bounded OpenAI fallback is
  enabled with `openai/gpt-5.4-nano` and `openai/text-embedding-3-small`.
- Live synthetic BTP tasks passed for Qwen structured output, Qwen embeddings,
  controlled structured fallback, and controlled embedding fallback. Ling
  plain chat connectivity passed, but Ling JSON-Schema structured output
  returned HTTP 400 and was not selected as the production primary model.
- No secret is committed or copied into evidence. Full authenticated browser
  acceptance of the four AI actions remains a separate final check.

## Out of scope

No S3, Brevo, database schema, UI workflow, automatic classification/assignment, or BTP deployment configuration changes in this branch.
