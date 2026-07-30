# IDTS-114/115 SAP BTP Chrome PM acceptance — 2026-07-30

## Verdict

`PARTIAL PASS — functional fixes verified; responsive/readability findings and non-PM role evidence remain open.`

## Baseline

- Runtime merge SHA: `d12ceef22ce8cae62987430a08fca4f11a5af088`.
- Environment: SAP BTP AppRouter with XSUAA-authenticated PM session.
- Primary read-only Bug: `BUG-0011`.
- Create-flow test used a new draft only; the draft was discarded and no active Bug was created.
- No credential, token, cookie, private endpoint, full email, raw AI payload or database URL was captured.

## Results

| Area | Result | Actual result |
| --- | --- | --- |
| Similar Bugs | PARTIAL PASS | Grounded candidates loaded without an error popup. The dialog still has horizontal overflow and clips right-side match/reason content. |
| Classification Suggestions | PARTIAL PASS | Safety fallback is now rendered as review content instead of `Could not load classification suggestions`. The table still has horizontal overflow and clips the Confidence column. |
| Handoff Summary | PASS WITH POLISH FINDINGS | Summary, current state, missing information, comment summary, important events and next action loaded. Comment Summary was grounded in the two stored comments. Raw ISO timestamps, dense event text and awkward fallback wording remain UX findings. |
| New Bug AI guards | PASS WITH MINOR UX FINDING | Similar Bugs and Classification buttons are hidden on a root new draft. Their empty labels remain visible and should be hidden with the complete custom field. |
| Smart Assign draft synchronization | PASS | After selecting `IDTS Assignment` and `Authorization`, Assignee value help opened Smart Assign candidates without the previous missing-mapping warning. No assignee was selected. |
| No unintended mutation | PASS | After opening the AI dialogs and reloading `BUG-0011`, status, assignee, current action owner and `Updated At` remained unchanged. |
| Cleanup | PASS | The temporary new draft was discarded after the test. |
| Tester/Developer role matrix | PENDING | This run used the authenticated DonHV PM session only. No role impersonation was attempted. |
| Network evidence | TOOLING LIMITATION | The connected Chrome control session supported page interaction, snapshots and console inspection, but this run did not expose a sanitized request-status capture without enabling broader CDP access. |

## Grounding checks

### Similar Bugs

- `BUG-0012` was presented as a high-confidence duplicate candidate with a reason grounded in similar title, description and classification.
- Lower-score candidates were presented as related by the shared application component.
- Opening and reviewing the dialog did not create a duplicate link or modify the Bug.

### Classification Suggestions

- Missing SAP Module returned `No safe suggestion` with zero confidence.
- Existing Application Component, Defect Category, Priority and Severity were retained as low-confidence review starting points.
- The safe fallback was not misclassified as a transport/load error.

### Handoff Summary and comments

- The summary referenced the real Bug status and current action owner.
- Comment Summary included the two stored comments in chronological order.
- Recent Important Events and the next expected Tester/PM action were grounded in stored workflow/history data.

## Findings requiring follow-up

1. **Product UX defect — Similar Bugs dialog overflow:** remove the remaining fixed-width content that forces a horizontal scrollbar and clips match/reason content.
2. **Product UX defect — Classification dialog overflow:** make columns genuinely responsive; Confidence and review detail must remain visible without horizontal scrolling.
3. **Product UX defect — New Bug empty labels:** hide the complete Similar Bugs and Classification custom fields, not only their buttons.
4. **Product UX/content defect — Handoff formatting:** format dates using the user locale, separate actor/action/time visually, and replace ambiguous fallback wording with business-facing text.
5. **Acceptance gap:** complete Tester and Developer browser authorization evidence before closing IDTS-114/115.
6. **Tooling limitation:** collect sanitized Network status through an approved mechanism in the follow-up run; do not enable broad browser access only to manufacture evidence.

## Evidence handling

Screenshots were reviewed interactively in the connected Chrome session. They were not committed in this update because the Smart Assign candidate view exposed full member email addresses and the current Chrome integration did not provide a repository-safe redaction/export path. Existing selected screenshots under this evidence directory remain the authoritative committed image set.

## Completion decision

- Do not close IDTS-114 or IDTS-115.
- Functional hotfix behavior is verified for the PM flow.
- A follow-up UI PR is required for the responsive/readability defects.
- Tester/Developer role evidence remains mandatory and deferred.
