# IDTS-111 NhanT Follow-up Evidence — 2026-08-04

This directory contains new member-owned evidence requested in Jira comment `10978`. Historical evidence is unchanged. Every outcome below remains a candidate pending DonHV disposition; this package does not grant final UAT approval.

- Executor: NhanT
- Role: Tester
- Deployed runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`
- Repository baseline: `9202adbf788fa52b309ebabc7560babfbc505dce`
- Fixture: `../../fixtures/uat-att-001-nhant-20260804.txt`
- Fixture size: 183 bytes
- Fixture SHA-256: `1BB8C0F0CC1767605368B1E3CD139EBB33F9FCA02C4FEA33F619DA29C572ED26`

## Truthful rerun disposition

| Case | Candidate result | New observation |
| --- | --- | --- |
| UAT-ATT-001 | DOES_NOT_MEET | The exact fixture appeared after Save but no attachment remained after reload. |
| UAT-ATT-002 | DOES_NOT_MEET | The active link produced no browser download within 12 seconds, so byte/hash equality could not be demonstrated. |
| UAT-ATT-003 | BLOCKED / INCONCLUSIVE | The controlled duplicate was selected and deleted in draft; after Save it was still present, then all attachments disappeared after reload. The old content route returned a sanitized 404, but deletion cannot be separated from ATT-001 persistence loss. |
| UAT-AI-005 | DOES_NOT_MEET | Suggestion `650478d7-4d9f-4944-90c5-f017c0420150` was accepted; Apply returned the safe error and did not mutate the Bug. |
| UAT-AI-007 | MEETS | Handoff Summary was grounded in three controlled comments and five visible history records; closing and reloading caused no workflow mutation. |
| UAT-AI-009 | MEETS | Smart Assign loaded grounded candidates; suggestion `9a000a39-eca1-4e5e-bb81-e1c6d69bbc54` remained PENDING and Cancel preserved BUG-0026 Assigned to SangVN. |
| UAT-UX-002 | MEETS | At 834×1112, the controlled long Smart Assign explanation used normal/pre-line wrapping with `scrollWidth == clientWidth`; Assign and Cancel remained inside the viewport. |
| UAT-UX-003 | DOES NOT MEET | NhanT's physical Tab-key check confirmed logical Create/comment/action focus and correct Enter/Escape/focus return, but Similar Bugs exposed only the first result to sequential Tab navigation and skipped the remaining results. |

## Evidence interpretation

The case-named PNG/SVG cards are authored trace summaries assembled from the recorded SAP UI/OData observations. They are not independent browser screenshots and must not be used alone to prove runtime execution.

`01-uat-att-001-active-before-reload.png`, `UAT-UX-003-trigger-focus.png`, and `UAT-UX-003-first-result-focus.png` are product/browser screenshots. Browser chrome and the deployed host were removed from the UX-003 screenshots. No credential, token, cookie, private endpoint, full email, or raw AI payload is stored.
