# IDTS-114 feature-specific model routing — local verification

## Baseline

- Source branch: `fix/idts-114-feature-model-routing-donhv`
- Frozen base SHA: `96c5ea60467f80b7b6f9d6b4f0d59f7f1810c2bf`
- Environment: local isolated worktree
- Secret handling: no key, credential, endpoint, prompt, or raw provider body was read or written

## Approved routing

| Capability | Primary model | Bounded backup behavior |
| --- | --- | --- |
| Similar Bugs | `alibaba/qwen3-embedding-0.6b` | Existing embedding policy |
| Classification | `openai/gpt-5.6-luna` | Existing eligible global fallback policy |
| Handoff Summary | `deepseek/deepseek-v4-flash` | One `xai/grok-4.1-fast-non-reasoning` attempt for eligible model-route denial, timeout, network failure, or HTTP 5xx |
| Smart Assign Explanation | `zai/glm-4.7-flash` | Existing eligible global fallback policy |

HTTP 429 never calls another model. Generic HTTP 403 never calls another model.
Only explicit allowlisted model-route denial codes enable the Handoff-specific
Grok backup.

## Focused evidence

`npm run qa:idts114:programmatic`

Result: `77 PASS | 0 FAIL`.

The focused suite proves:

- Classification, Handoff, and Smart Assign select their configured models.
- SAP BTP environment variable names map to all four feature route fields.
- Model-specific Handoff denial uses Grok exactly once.
- Handoff HTTP 5xx uses Grok exactly once.
- Handoff HTTP 429 does not spend Grok and returns `AI_RATE_LIMITED`.
- Generic account/key HTTP 403 does not use Grok and remains sanitized.
- Successful fallback records the actual model and `fallbackUsed=true`.

## Regression evidence

| Command | Result |
| --- | --- |
| `npm run qa:idts64:programmatic` | 40/40 PASS |
| `npm run qa:idts66:programmatic` | 45/45 PASS |
| `npm run qa:idts67:programmatic` | 36/36 PASS |
| `npm run qa:idts68:programmatic` | 47/47 PASS |
| `npm run qa:idts69:programmatic` | 13/13 PASS |
| `npm run qa:idts71:programmatic` | 31/31 PASS |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS |
| `npm run qa:depth:self-test` | 15/15 PASS |
| `npm run qa:ownership-gate` | 5/5 PASS |
| `officecli --version` | 1.0.143 PASS |
| JavaScript syntax checks | PASS |
| `cds compile srv --to edmx -s all` | PASS with one pre-existing attachment annotation warning |
| `cds build --production` | PASS |
| MTA YAML parse | PASS |
| AI DevKit lint | PASS |
| `git diff --check` | PASS |

## Known limitations

- This file proves deterministic local routing and fallback policy; it does not
  claim that every selected model is enabled for the current Vercel account.
- SAP BTP deployment and one sequential live call per feature are still
  required after normal PR merge.
- Tester/Developer interactive role evidence remains outside this routing-only
  verification.
- The existing CAP attachment annotation warning and npm audit findings are
  recorded in `docs/pm/status/donhv.md`; this focused change does not alter
  attachments or dependencies.
