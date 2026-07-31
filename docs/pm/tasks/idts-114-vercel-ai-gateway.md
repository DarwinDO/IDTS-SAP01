# IDTS-114 — Backend: Integrate staged Vercel AI Gateway into SAP BTP AI assistance

Owner: DonHV

## 2026-07-30 result-grounding remediation in progress

- Browser review found a product UX/grounding defect: Smart Assign deterministic 55%/72% explanations and Classification fallback rows could look like AI output. The focused fix uses short backend references (`C1`, `SM1`, `AC1`, etc.), maps results to trusted candidates/catalog rows server-side, and exposes explicit `AI`, `RULES`, or `NONE` provenance to the UI.
- Handoff now labels its generated advisory overview separately from verified comments/history/current-state data. No lifecycle, assignee, classification, HANA schema, provider model, key, or configuration is changed.
- Local focused verification passed: IDTS-69 12/12, IDTS-67 33/33, IDTS-68 45/45, and IDTS-115 static UI 241 checks. BTP deployment/browser verification remains pending a normal PR review and merge.
- PR #234 merged at `c39468b636f695031ab7f4130b71112962408873` and selective MTA operation `38f256db-8c0f-11f1-82db-eeee0a91e4f4` deployed `idts-sap01-srv` plus `idts-sap01-app-content`. The HDI deployer was not selected; health is HTTP 200 and protected OData is HTTP 401 anonymously. User-browser hard-refresh/visual verification remains pending.

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
- The application content and service runtime are deployed at merge SHA
  `5476479312986412739fbff3cfa6da29acc7905d`; the deployment controller also
  refreshed declared service bindings, while the HDI deployer and broad `cds
  deploy` were not selected. Synthetic batch proof and sequential live
  acceptance remain pending. IDTS-114 stays In Progress. Evidence:
  `docs/pm/evidence/idts-114/rate-limit-request-bounding/btp-runtime-rollout-20260730.md`.

## 2026-07-30 Smart Assign AppRouter timeout follow-up

- Sequential PM acceptance proved Qwen completed `ASSIGNMENT_EXPLANATION` successfully in `30,495 ms`, but AppRouter returned HTTP 504 at approximately 30 seconds before the CAP result reached the UI.
- The minimal local correction gives Smart Assign a shared 24-second provider deadline, limits provider input to ten candidates and a compact workload allowlist, and returns deterministic explanations when the deadline expires. Deadline exhaustion does not start OpenAI; an early HTTP 5xx can still use one bounded fallback while time remains.
- Focused tests pass at IDTS-114 `58/58` and IDTS-69 `9/9`; all requested AI regressions, CAP compile, secret/process gates, AI DevKit and `git diff --check` pass. Evidence: `docs/pm/evidence/idts-114/smart-assign-timeout/local-verification-20260730.md`.
- Selective service deployment is complete at merge SHA
  `5476479312986412739fbff3cfa6da29acc7905d`. PM browser re-test and
  Tester/Developer role evidence remain pending, so IDTS-114 stays In Progress.

## 2026-07-30 responsive AI review follow-up

- Similar Bugs now uses a vertical candidate list, wraps metadata, expands long reasons in place, disables horizontal dialog scrolling, and clears all candidate/review state before each initial load or Retry so a failed retry cannot leave stale actions enabled.
- Classification now uses `sap.m.Table` auto-pop-in with the current value and confidence moved into desktop pop-ins when space is constrained. Fixed dialog width/height and horizontal scrolling were removed.
- Handoff Summary now parses trusted timeline lines into separate actor, action, localized time and expandable detail controls. Comment and event contracts remain unchanged.
- `AI_RATE_LIMITED` is shown as a safe temporary-busy warning rather than a provider diagnostic.
- Local focused and integrated regressions, CAP compile, UI5 build, manifest validation, targeted UI5 lint, targeted ESLint, secret/process gates, AI DevKit and `git diff --check` pass. The existing pre-V2 manifest warning remains separate application debt.
- SAP BTP application content and runtime deployment are complete at merge SHA
  `5476479312986412739fbff3cfa6da29acc7905d`. PM browser visual/no-mutation
  evidence and the deferred Tester/Developer matrix remain open; IDTS-114
  stays In Progress.

## 2026-07-30 post-deploy Handoff timestamp follow-up

- Browser review found that comment/event lines prefixed by a bullet or list
  number could bypass the existing `[timestamp]` parser and display raw ISO
  text. The finding is a presentation defect only; the handoff contract,
  grounding rules and lifecycle behavior are unchanged.
- The focused correction accepts optional bullet/number prefixes and formats
  valid timestamps with the UI5 locale-aware `DateFormat` API. Invalid or
  missing timestamps continue to render without technical exceptions.
- Red regression evidence failed before the correction and IDTS-76 now passes
  `118/118`. UI5 production build, manifest validation, targeted lint and the
  integrated AI regressions also pass locally.
- SAP BTP visual verification remains pending; IDTS-114 stays In Progress.

## 2026-07-30 durable BTP configuration binding follow-up

- Root cause evidence changed the current browser result classification: the
  fallback on Classification is caused by AI-disabled/mock configuration in the
  deployed runtime, not by a primary-Qwen provider response. The focused branch
  adds a dedicated existing BTP user-provided service binding, plus non-secret
  MTA properties for the approved Qwen primary and bounded OpenAI fallback.
- The service-side lookup accepts a gateway key only from the exact named binding
  or an already private direct environment variable. It never scans the retained
  S3/Brevo binding. The empty service exists in BTP; DonHV must add the key
  directly before deployment. No key is committed or copied to evidence.
- Local verification is PASS: IDTS-64 `38/38`, IDTS-114 `58/58`, CAP compile,
  UI5 production build, secret scan, agent rules, QA-depth self-test, AI DevKit
  and `git diff --check`. Evidence:
  `docs/pm/evidence/idts-114/btp-ai-config-binding/local-verification-20260730.md`.

## 2026-07-30 durable Z.AI structured-primary correction

- Cloud Foundry revision history proved that revision 5 used
  `zai/glm-4.7-flash`, but later MTA deployments restored
  `alibaba/qwen3.7-flash` because `mta.yaml` still declared Qwen as the
  structured default.
- The live SAP BTP service is corrected back to `zai/glm-4.7-flash`, and the
  MTA declaration now matches that runtime choice so a future deploy does not
  silently revert it.
- Similar Bugs continues to use `alibaba/qwen3-embedding-0.6b`; this change only
  replaces the structured model used by Classification, Handoff Summary and
  Smart Assign explanations. OpenAI remains the bounded fallback.
- No key, endpoint, HANA schema/data, OData contract or business workflow was
  changed. Fresh feature-level acceptance is still required before IDTS-114
  can close.

## 2026-07-30 feature-specific structured contracts

- Live BTP logs proved that Classification, Handoff Summary and Smart Assign all reached `zai/glm-4.7-flash` and returned provider-level `SUCCESS`. The rules-based Classification and Smart Assign rows were therefore not a model-selection problem.
- Root cause: the shared Gateway adapter requested only a generic JSON object, so parseable provider output could still omit the exact catalog/candidate keys required by the feature parsers.
- The focused remediation forwards a bounded per-feature JSON Schema. Classification can select only active short catalog references (`SM/AC/DC/P/S`), and Smart Assign can explain only backend-issued candidate references (`C1..Cn`). UUIDs remain backend-only.
- Local verification PASS: provider 59/59, Classification 36/36, Smart Assign 13/13, AI provider 38/38, Handoff 45/45, AI security 31/31, CAP compile, secret/process gates, AI DevKit 5/5 and `git diff --check`.
- No provider/model/key, OData contract, HANA schema, role, workflow or UI contract changed. Fresh BTP feature calls remain required before declaring the visual defect closed.

## 2026-07-31 proactive per-model request budget

- Browser/Gateway evidence showed that Z.AI could complete several structured
  calls and then return HTTP 429. The existing protection only started after
  that first upstream 429.
- The focused correction reserves provider capacity before each call and
  limits each model alias to four requests in a rolling sixty-second window on
  the current application instance. Z.AI structured calls and Qwen embedding
  calls therefore do not consume each other's local budget.
- A locally rejected fifth structured call returns the existing safe
  `AI_RATE_LIMITED` result and does not trigger OpenAI. This prevents the
  predictable upstream 429 but does not claim to increase provider quota.
- Fresh local results pass IDTS-64 `38/38`, IDTS-66 `45/45`, IDTS-67 `36/36`,
  IDTS-68 `47/47`, IDTS-69 `13/13`, IDTS-71 `31/31`, IDTS-114 `63/63`, CAP
  compile, MTA parse, secret/process gates, AI DevKit and `git diff --check`.
  Evidence:
  `docs/pm/evidence/idts-114/rate-limit-request-bounding/proactive-model-budget-20260731.md`.
- Selective SAP BTP rollout and sequential live verification remain pending;
  IDTS-114 stays In Progress.

## 2026-07-31 live acceptance follow-up: bounded audit text

- The proactive Z.AI request budget deployed successfully at merge SHA
  `809f963376467c7542665991b54de3bd0daea955`.
- Live Classification returned grounded Z.AI suggestions successfully.
- The following Handoff call also returned provider-level `SUCCESS`, proving
  the new request budget did not cause a provider 429. Persistence then failed
  separately because the sanitized audit summary exceeded the HANA
  `String(500)` column after its truncation marker was appended.
- The focused correction makes every sanitized value, including its marker,
  fit within the caller's declared maximum. IDTS-114 remains In Progress until
  the correction is deployed and the sequential browser check is repeated.
## 2026-07-31 sequential SAP BTP verification

- PR #243 introduced a process-local, per-model request window (`4` requests per `60` seconds on BTP) and preserved separate budgets for ZAI structured calls and Qwen embeddings.
- PR #244 corrected the Handoff Summary audit-text bound so a successful provider response fits the existing HANA `AiSuggestions.summary` column.
- Selective service deployment at merge SHA `f000ce170abf716ca18d7586f5e2ce0e5c1f8487` completed without HDI/database deployment.
- PM browser sequence PASS: Classification → Handoff Summary → Smart Assign Explanation → Similar Bugs.
- ZAI structured metrics were `SUCCESS` for Classification, Handoff, and Smart Assign. Qwen embedding batch was `SUCCESS` for Similar Bugs.
- No exact HTTP 429 route response occurred in the sequence. The fifth-call local guard remains covered by focused regression.
- IDTS-114 remains In Progress pending the deferred Tester/Developer interactive role matrix.
- Evidence: `docs/pm/evidence/idts-114/qwen-sequential-acceptance/btp-sequential-live-verification-20260731.md`.
