# IDTS-96/98/99 stale-work disposition — 2026-08-03

## Baseline

- Current source of truth: `origin/dev` at `39f6f87c4330ed8e1e0152463345fb9ab97e8132`.
- Review is read-only with respect to CAP/Fiori runtime and SAP BTP data.
- No database deploy, seed load, provider call, credential read, or Drive update was performed.

## PR #177 / IDTS-96

PR #177 adds one historical SQLite regression script for AI review persistence and no-mutation. The current baseline already contains narrower and deeper suites:

- `scripts/qa/test-idts68-bug-summary.js` — grounded handoff summary, persisted review, fallback safety and no workflow mutation.
- `scripts/qa/test-idts69-assignment-explanation.js` — Smart Assign explanation review and no assignment/workflow mutation.
- `scripts/qa/test-idts91-ai-review-actions.js` — Accept, Reject and Ignore persistence, reviewer identity, rollback and unchanged Bug business data.
- `scripts/qa/test-idts93-apply-classification.js` — authorized apply, stale/invalid/expired denial, idempotency, rollback and no assignment/status mutation.
- `scripts/qa/test-idts95-confirm-duplicate-suggestion.js` — authorized confirmation, repeated/reverse/self-link denial, rollback and no status/assignee mutation.

All five current suites exited `0` on the frozen baseline. `qa:secret-scan` and `qa:agent-rules` also passed. Therefore the old PR does not need to be ported or merged; its useful acceptance intent is superseded by current tests.

## PR #178 / IDTS-98

The historical branch is not safe to merge:

- It is conflicting with current `dev`.
- It includes unrelated `LICENSE`, package-lock and PR-body noise.
- It changes runtime mock-provider code from a QA branch.
- Its evaluation logic can mark scenarios safe from scenario naming/heuristics instead of measuring the real feature outcome.
- It logs the full result payload, which is incompatible with the current sanitized-evidence policy.
- Eight shallow scenarios are not sufficient evidence for current feature-specific routing, grounding, prompt-injection resistance, no-mutation and provider/fallback separation.

Only the conceptual scenario categories are reusable. Any future deterministic AI quality evaluation must be rebuilt from current `dev` in a fresh branch and call the actual feature logic.

## IDTS-99

The historical Render/OpenAI-live acceptance scope is obsolete. Current deployment and acceptance are tracked through SAP BTP/HANA/XSUAA and IDTS-114/115. No mock or deterministic fallback result may be reported as primary-provider live acceptance.

## Superseded documentation PRs

- PR #193 is superseded by merged PR #264 (`cd03aedde4fa2d3d146b54ec76d400e4de3f670b`).
- PR #208 is superseded by merged PR #265 (`104cad4bd43a16483ea0cfd8e117f5ca36de2874`).

## Tooling note

The first isolated test run had no local `node_modules`; a second `NODE_PATH`-only attempt could not resolve a CDS package module. The successful run used a temporary workspace-local junction to an existing verified dependency installation. The junction reparse point was removed after execution. This was a tooling issue, not a product failure.

## Recommended disposition

1. Close PR #177 as superseded by the current AI regression suites; do not merge its old package script/evidence.
2. Close PR #178 without merge; retain only its scenario ideas for a future clean rewrite if IDTS-98 remains required.
3. Mark IDTS-99 superseded by IDTS-114/115 and the SAP BTP acceptance baseline.
4. Close PR #193 and PR #208 as superseded by merged PR #264 and PR #265.
