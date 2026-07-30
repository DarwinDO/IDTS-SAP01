# IDTS-114 Z.AI structured contract — local verification

Baseline: `7fb46b6ff0dd977bd67ef15da77ac47a106e8260`

## Finding

Provider logs showed `zai/glm-4.7-flash` `SUCCESS` for Classification, Handoff Summary and Smart Assign, while two feature parsers still produced rules-based rows. The previous Gateway request used a generic JSON object schema, which did not require grounded catalog or candidate references.

## Correction

- Classification schema allows only active short catalog references and requires confidence/reason.
- Smart Assign schema allows only backend-issued `C1..Cn` references and requires explanation/confidence.
- `provider.js` clones and bounds feature schemas before the Gateway adapter receives them.
- No UUID, key, prompt, raw provider response or private endpoint is included in the schema/evidence.

## Fresh verification

| Check | Result |
| --- | --- |
| `npm run qa:idts114:programmatic` | PASS — 59/59 |
| `npm run qa:idts67:programmatic` | PASS — 36/36 |
| `npm run qa:idts69:programmatic` | PASS — 13/13 |
| `npm run qa:idts64:programmatic` | PASS — 38/38 |
| `npm run qa:idts68:programmatic` | PASS — 45/45 |
| `npm run qa:idts71:programmatic` | PASS — 31/31 |
| `npx cds compile srv/service.cds --to json` | PASS |
| `npm run qa:secret-scan` | PASS |
| `npm run qa:agent-rules` | PASS |
| `npm run qa:depth:self-test` | PASS — 15/15 |
| `npx ai-devkit@latest lint --json` | PASS — 5/5 |
| `git diff --check` | PASS; line-ending warnings only |

## Remaining acceptance

Deploy the service-only change and invoke Classification and Smart Assign once each after any Gateway cooldown. A visual PASS requires `explanationSource/suggestionSource = AI` with grounded mapped references; provider HTTP success alone is insufficient.
