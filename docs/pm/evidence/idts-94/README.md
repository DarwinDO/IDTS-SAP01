# IDTS-94 — Handoff Summary and Smart Assign review controls

Owner: SangVN

Date: 2026-07-24

Status: implementation, local evidence, and SangVN Ownership Knowledge Gate are complete; human review, dependency merge, PR merge, and Jira closure remain pending.

## Delivered scope

- Handoff Summary and Smart Assign explanation return the persisted `suggestionID`.
- Their existing contextual dialogs expose Accept, Reject, and Ignore through the shared CAP review actions.
- The UI shows the persisted state, reviewer, and review time and disables repeat decisions.
- Handoff review does not change Bug status, assignee, action owner, comments, or history.
- Smart Assign explanation review does not select or assign a developer and does not enable Assign.
- Missing persisted suggestion IDs disable review; provider/backend failures display safe generic copy.
- The Handoff dialog uses supported `stretch: Device.system.phone` plus wrapping; Smart Assign review controls wrap at phone width.

## Evidence matrix

| Area | Evidence |
| --- | --- |
| Positive review | Handoff and Smart Assign browser suites click Accept and confirm `ACCEPTED`. |
| Persistence/reload | Browser suites query persisted reviewer/time; IDTS-91 verifies persisted state and conflict-safe repeat review. |
| Repeat review | All three controls become disabled immediately after the first decision; IDTS-91 verifies a second decision returns 409. |
| Role/authorization | IDTS-91 verifies Developer review for a readable suggestion and 403 for an unknown authenticated identity; Smart Assign remains limited to the existing Tester/PM assignment UI. |
| No mutation | IDTS-68 and the Handoff browser compare Bug snapshots; IDTS-69 and the Smart Assign browser verify assignee, status, and action owner remain unchanged. |
| Empty/error | A response without `suggestionID` disables Handoff review; unsafe/provider-error flows show safe copy and do not change the Bug. |
| Responsive UI | Mobile screenshots use a 390x844 true mobile-emulation context for Handoff and a 390x844 viewport for Smart Assign. |
| Browser health | Both suites finish with no unexpected blocking console/network/page signals. |
| Ownership Knowledge Gate | SangVN passed 3/3 (100%), including critical answers, teach-back, and controlled debug retest. Evidence: `knowledge-gate-sangvn-2026-07-24.md`. |

## Verification commands

```powershell
npm run qa:idts94:programmatic
npm run qa:idts68:programmatic
npm run qa:idts69:programmatic
npm run qa:idts91:programmatic
npm run qa:idts92:programmatic
npm run qa:idts76:browser
npm run qa:idts56:browser
npx cds compile srv app/bug-management-ui --to edmx -s all
Push-Location app/bug-management-ui
npx ui5 build --config ui5.yaml --clean-dest
Pop-Location
npm run qa:secret-scan
git diff --check
```

Latest focused results:

- IDTS-94 source contract: 32 checks passed.
- IDTS-68 handoff behavior: 31 passed, 0 failed.
- IDTS-69 Smart Assign explanation: 8 passed, 0 failed.
- IDTS-91 review actions: 19 passed, 0 failed.
- IDTS-92 existing review UI regression: 47 checks passed.
- IDTS-56 Smart Assign regression: 13 passed, 0 failed.
- Handoff browser: 7 checks passed.
- Smart Assign browser: 7 checks passed.
- CAP compile and UI5 build: exit 0.
- UI5 MCP linter for both changed controllers: no findings.
- Ownership Knowledge Gate: 3/3 (100%), critical/debug/teach-back PASS.

## Screenshots

- `handoff/idts76_handoff_summary_dialog.png`
- `handoff/idts94_handoff_summary_mobile.png`
- `handoff/idts76_handoff_summary_sparse.png`
- `handoff/idts76_handoff_summary_unsafe.png`
- `handoff/idts76_handoff_summary_safe_failure.png`
- `smart-assign/01b_smart_assign_explanation_reviewed.png`
- `smart-assign/01c_smart_assign_explanation_mobile.png`
- `smart-assign/03_smart_assign_after_valid_assign.png`
- `smart-assign/04_smart_assign_reload_persistence.png`

## Known limitations and gates

- The branch is stacked on the open IDTS-91/92/93 dependency branch; it must not merge before that foundation is approved.
- SangVN's Ownership Knowledge Gate is complete. PR #168 still requires human review and remains stacked on the open foundation PR #167.
- OfficeCLI is unavailable in this environment (`OFFICECLI_NOT_FOUND`), so this Markdown evidence received repository/native checks but no OfficeCLI format validation.
- CAP compile retains the existing unrelated attachment annotation warning for `NonUpdateableProperties`.
- This work contains only the focused tests required to prove IDTS-94. The broader IDTS-96 regression task remains owned by NhanT.
