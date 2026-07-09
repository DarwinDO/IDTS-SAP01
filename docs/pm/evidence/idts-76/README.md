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

## Verification commands

```powershell
npx cds deploy --to sqlite:db.sqlite
$env:IDTS_QA_BASE_URL='http://localhost:4016'
$env:IDTS_QA_EVIDENCE_DIR='docs/pm/evidence/idts-76'
npm run qa:idts76:browser
npm run qa:idts76:programmatic
npm run qa:idts68:programmatic
```

## Jira attachment note

Attach at least these files to Jira if manual evidence upload is required:

- `handoff-summary-browser-smoke.json`
- `handoff-summary-ui-static-check.json`
- `idts76_handoff_summary_dialog.png`
- `idts76_handoff_summary_sparse.png`
- `idts76_handoff_summary_unsafe.png`
- `idts76_handoff_summary_safe_failure.png`
