# `scripts/qa/test-idts94-ai-review-controls.js`

Purpose: fast, deterministic contract check for the IDTS-94 Handoff Summary and Smart Assign explanation review controls.

What it verifies:

- both action result types expose the persisted `suggestionID`;
- the two AI generation helpers return that audit identifier;
- each contextual dialog delegates Accept, Reject, and Ignore to the shared `AiSuggestionReview` helper;
- review state, reviewer/time, and repeat-decision disabling remain wired to the UI model;
- Handoff and Smart Assign copy preserves their review-only, no-automatic-mutation boundary;
- caught backend diagnostics are not rendered directly in the Smart Assign UI.

Run:

```powershell
npm run qa:idts94:programmatic
```

Debug anchors:

- if an audit-ID check fails, inspect `srv/service.cds` and the matching helper under `srv/ai/`;
- if a control check fails, inspect the two controllers under `app/bug-management-ui/webapp/ext/actions/`;
- this suite checks source wiring only; use the focused IDTS-68/69/91 behavioral suites and IDTS-56/76 browser suites for persistence, authorization, no-mutation, and rendered-UI evidence.

Ownership:

- Primary: SangVN for IDTS-94.
- Support: DonHV.
- The broader automated-regression task IDTS-96 remains owned by NhanT; this file is limited to IDTS-94 delivery evidence.
