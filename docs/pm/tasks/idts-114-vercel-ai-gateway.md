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
  before the provider call while the HANA Free Tier database was stopped. SAP
  HANA error `1890` and HANA Cloud Central independently confirmed the stopped
  state. After restart, read-only BTP checks passed in `340 ms` and in `262 ms`
  with the original 1000 ms acquisition boundary. The temporary 10-second
  workaround is being removed; Smart Assign UI acceptance remains required.
- The current follow-up branch improves the three AI review dialogs without
  adding a new section or framework: Similar Bugs is now a selectable list,
  Classification separates confidence from an expandable reason, and Handoff
  Summary uses dedicated lists for comments and events. The handoff action now
  returns a transient, deterministic `commentSummary` grounded in up to five
  recent sanitized comments. No database schema or workflow behavior changes.
- Fresh local verification on 2026-07-30 passed IDTS-56/66/67/68/69,
  IDTS-74/75/76, IDTS-93/95, IDTS-114/115, CAP compile, UI5 production build,
  targeted ESLint, secret scan, agent rules and QA-depth self-test. Evidence:
  `docs/pm/evidence/idts-114/review-readability/` and
  `docs/pm/evidence/idts-114/handoff-comment-summary/`.
- Independent review findings were corrected before PR: raw comment text is
  excluded from provider input; workflow advice and important events are
  derived from trusted status/history; comment lines are concise, redacted and
  chronological; Classification secondary columns pop in at desktop width;
  and dead per-row guidance state was removed. The provider-success injection
  fixture now proves that a malicious comment cannot replace trusted next
  action or audit events.
- PR #225 merged at `d12ceef22ce8cae62987430a08fca4f11a5af088` and the selective SAP BTP rollout completed successfully through MTA operation `0246e01f-8b80-11f1-abdb-eeee0a953fee`. The service/AppRouter health and deployed `commentSummary` metadata checks passed without a database deployer or broad `cds deploy`. Remaining work is browser visual/no-mutation verification and the deferred Tester/Developer role matrix. IDTS-114 therefore remains In Progress.

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

## 2026-07-30 rate-limit request-bounding follow-up

- Branch `fix/idts-114-ai-rate-limit-request-bounding-donhv` now limits Similar
  Bugs embeddings to the deterministic top ten candidates while preserving the
  existing 50-row database scan.
- A single batch of at most eleven sanitized texts is preferred. Unsupported
  array input may use only the bounded sequential compatibility path with
  concurrency one; malformed batches use deterministic ranking directly.
- Transient HTTP 429 activates a shared in-memory cooldown and does not call the
  OpenAI fallback. Only timeout, network failure, and HTTP 5xx remain fallback
  eligible. Generic 400, budget exhaustion, and malformed output are not.
- Focused local evidence is PASS at
  `docs/pm/evidence/idts-114/rate-limit-request-bounding/local-verification-20260730.md`.
- Final local verification includes IDTS-114 `53/53`, IDTS-66 `45/45`,
  IDTS-64 `36/36`, the related AI/UI regressions, CAP compile, UI5 production
  build, secret/process gates, AI DevKit `5/5` and `git diff --check`. An
  independent correctness pass also prevents generic batch HTTP 400 from
  expanding into scalar requests and removes workflow status from provider
  embedding input. Ponytail review result: `Lean already. Ship.`
- SAP BTP synthetic batch proof, selective service deployment, sequential live
  acceptance, and responsive UI PR remain pending. IDTS-114 stays In Progress.
