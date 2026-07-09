# IDTS-76 Evidence - Handoff Summary Review Panel

## Scope

IDTS-76 adds a user-visible Handoff Summary review panel on the Bug Object Page. The panel reuses the existing backend action `summarizeBugHandoff` and remains review-only.

Ponytail decision: no new API, no new CDS entity, no new AI provider wiring, and no automatic workflow write were added. The smallest useful change is one Object Page section, one SAPUI5 dialog action, i18n labels, and focused QA.

## Local evidence

| File | Purpose |
| --- | --- |
| `handoff-summary-ui-static-check.json` | Static wiring check for manifest section, action module, i18n keys, no internal UI copy, and no workflow mutation patterns. |
| `handoff-summary-browser-smoke.json` | Browser smoke result for positive, sparse-data, unsafe-output, safe-failure, and no-workflow-mutation scenarios. |
| `idts76_handoff_summary_dialog.png` | Positive dialog evidence. |
| `idts76_handoff_summary_sparse.png` | Sparse-data warning evidence. |
| `idts76_handoff_summary_unsafe.png` | Unsafe output fallback evidence. |
| `idts76_handoff_summary_safe_failure.png` | Provider/action failure safe-message evidence. |

## Shared-QA evidence

| File | Purpose |
| --- | --- |
| `render-ai-smoke.json` | Authenticated Render AI smoke against `https://idts-sap01-qa.onrender.com`; 25/25 checks passed for classification, duplicate/similar, handoff summary, Smart Assign explanation, no mutation, and sanitized audit rows. |
| `render-handoff-summary-browser-smoke.json` | Browser smoke against deployed Render app; verified the Handoff Summary button, dialog, summary, next action, and no internal/developer-facing copy. |
| `render_handoff_summary_dialog.png` | Screenshot evidence of the deployed Handoff Summary dialog on shared QA. |

## Deployment evidence

- GitHub PR: #134.
- Merged commit on `dev`: `1f9510b3ba8fb689de08a65be5bdf643e02eb61d`.
- Render deploy: `dep-d97r30l7vvec73cp5gq0`.
- Render status: `live` on the merged `dev` commit.

## Verification commands

```powershell
npx cds deploy --to sqlite:db.sqlite
$env:IDTS_QA_BASE_URL='http://localhost:4016'
$env:IDTS_QA_EVIDENCE_DIR='docs/pm/evidence/idts-76'
npm run qa:idts76:browser
npm run qa:idts76:programmatic
npm run qa:idts68:programmatic

$env:IDTS_QA_BASE_URL='https://idts-sap01-qa.onrender.com'
$env:IDTS_QA_EMAIL='donhv@example.local'
$env:IDTS_QA_EVIDENCE_DIR='docs/pm/evidence/idts-76'
node scripts/qa/test-idts71-render-ai-smoke.js
npm run qa:idts76:browser
```

## Jira attachment note

Attach at least these files to Jira if manual evidence upload is required:

- `handoff-summary-browser-smoke.json`
- `handoff-summary-ui-static-check.json`
- `idts76_handoff_summary_dialog.png`
- `idts76_handoff_summary_sparse.png`
- `idts76_handoff_summary_unsafe.png`
- `idts76_handoff_summary_safe_failure.png`
- `render-ai-smoke.json`
- `render-handoff-summary-browser-smoke.json`
- `render_handoff_summary_dialog.png`
