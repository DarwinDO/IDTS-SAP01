---
phase: testing
title: IDTS-91/92/93 AI Review and Apply Testing
description: Focused, regression, browser, security, and build evidence for AI review actions.
---

# IDTS-91/92/93 Testing

## Coverage matrix

| Area | Evidence |
| --- | --- |
| Review happy paths | Accept, Reject, Ignore persistence; authenticated reviewer and time; UI display |
| Review negative paths | Invalid/missing ID, missing suggestion, unknown user, repeated/concurrent-style decision conflict |
| Review integrity | No Bug, assignment, workflow, classification, or `DuplicateLinks` mutation; transaction rollback |
| Apply happy path | Tester apply; PM idempotent repeat; six classification fields; one grouped history event |
| Apply negative paths | Pending, Rejected, Ignored, expired, wrong feature, malformed/incomplete payload, unknown field, no applicable values, inactive catalog, ID/code mismatch, invalid component/category pair, stale snapshot, Developer role, missing/invalid ID |
| Apply integrity | Status/assignee unchanged; stale manual value preserved; Bug and history rollback together |
| UI | Shared helper, three buttons, persisted state/reviewer/time, repeat disable, locale time, generic failure, busy cleanup |
| Browser | Similar Bugs Accept and Classification Reject; guarded/no-result/failure flows; Tester review; no Bug/workflow mutation |

## Automated tests

- `scripts/qa/test-idts91-ai-review-actions.js`
- `scripts/qa/test-idts92-ai-review-ui.js`
- `scripts/qa/test-idts93-apply-classification.js`
- Updated IDTS-66/67 backend regression and IDTS-74/75 browser suites.

The repository does not currently instrument these custom CAP/browser scripts for line-percentage coverage, so no unsupported 100% line-coverage claim is made. Acceptance branches and cross-layer risks above are explicitly covered.

## Environment notes

- Browser suites use a disposable SQLite file with the current schema because the persistent local `db.sqlite` is stale.
- Active Node is `v24.16.0`, outside the repository engine range `>=20 <23`; tests execute successfully, but supported-runtime acceptance still requires Node 20 or 22.
- OfficeCLI is unavailable, so only Markdown documentation was changed and no Office-format validation is claimed.
