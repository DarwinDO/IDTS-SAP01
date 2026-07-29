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
- PR #211 merged into `dev` at `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`.
- SAP BTP now uses Qwen `alibaba/qwen3.7-flash` for structured generation and
  `alibaba/qwen3-embedding-0.6b` for embeddings. One bounded OpenAI fallback is
  enabled with `openai/gpt-5.4-nano` and `openai/text-embedding-3-small`.
- Live synthetic BTP tasks passed for Qwen structured output, Qwen embeddings,
  controlled structured fallback, and controlled embedding fallback. Ling
  plain chat connectivity passed, but Ling JSON-Schema structured output
  returned HTTP 400 and was not selected as the production primary model.
- No secret is committed or copied into evidence. Full authenticated browser
  acceptance of the four AI actions is now partially executed on the SAP BTP
  AppRouter. Review-state persistence and no-mutation checks passed for the
  PM flow, but IDTS-114 remains In Progress because provider calls were not
  stable, the deployed UI has no Apply Classification action, no Duplicate
  Confirmation action, and no Operational Metrics page, and Tester/Developer
  role evidence still requires their approved interactive identities.
- PR #216 merged the first Qwen error-classification remediation at merge SHA
  `8be1081f83b903e78a8b2e8728aa1a0d927e8103`. Selective SAP BTP deployment
  proved that the current Qwen route still rejects all tested
  `response_format` variants, including the legacy JSON format.
- A bounded synthetic BTP diagnostic returned HTTP 200 with parseable JSON on
  the same `alibaba/qwen3.7-flash` model when `response_format` was omitted.
  Follow-up branch `fix/idts-114-qwen-prompt-json-compat-donhv` therefore keeps
  `json_schema` first and changes only the exact incompatibility retry to one
  prompt-only JSON request. Generic HTTP 400, transient 429, exhausted budget
  and OpenAI fallback policy remain unchanged. Local focused result is 30/30
  PASS; feature-level BTP acceptance remains required.
- PR #218 merged the exact one-level Qwen schema-envelope normalization at
  merge SHA `112a7356c1828736051002275c6c5ca604e498fa`. BTP audit evidence now
  contains primary-Qwen `SUCCESS` for Classification, Handoff Summary, Smart
  Assign and Similar Bugs embedding. The next Smart Assign UI read was blocked
  before the provider call by a cold HANA connection-acquisition timeout. A
  separate production-only follow-up raises that boundary from the CAP default
  of 1000 ms to 10000 ms; selective deployment and cold-read/Scheduler
  acceptance are still required.

## BTP browser acceptance handoff

- Evidence root: `docs/pm/evidence/idts-114/btp-browser/`.
- Test object: `BUG-0018`; no new business Bug was created or deleted.
- Baseline SHA: `016a6067de1c3c7725b6f74f23b90ef6b8b5f7fa`.
- Primary models: Qwen structured `alibaba/qwen3.7-flash`; embedding `alibaba/qwen3-embedding-0.6b`.
- Bounded fallbacks: OpenAI structured `openai/gpt-5.4-nano`; embedding `openai/text-embedding-3-small`.
- Result truth: Similar Bugs, Classification review, Handoff Summary and Smart Assign UI entry points were exercised by PM; review audit persisted and Bug workflow fields did not mutate. Provider-live structured success is not claimed where the UI used safe fallback.
- Blockers: Apply Classification, Duplicate Confirmation and Operational Metrics have no deployed UI entry point; Tester/Developer role matrix requires member-owned SAP identities.
- Follow-up bug: IDTS-115 tracks the missing Fiori UI entry points and is linked to IDTS-114, IDTS-93, IDTS-95 and IDTS-97.
- Security: selected evidence excludes credentials, tokens, cookies, DB URLs, private endpoints, full email addresses and raw provider payloads.

## Out of scope

No S3, Brevo, database schema, UI workflow, automatic classification/assignment, or BTP deployment configuration changes in this branch.
