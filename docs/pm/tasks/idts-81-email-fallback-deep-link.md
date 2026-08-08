# IDTS-81 — Correct BTP Shared QA email fallback deep link

## Goal

Correct newly generated IDTS email links so both the CTA and visible fallback link open the current Fiori Object Page instead of a retired route that can end at `Cannot GET`.

## Scope

- Owner: DonHV. Support: DatDT for browser retest and NhanT for QA evidence.
- Due date: 2026-07-12.
- Change only the shared email URL normalizer and its focused regression test.
- Accept deployment root, the current `/idtsbugmanagementui` AppRouter path, the retired dotted `/idts.bugmanagementui` path, and the older `/bug-management-ui/webapp` path as input; always emit the current app route.
- Update the matching `srv` knowledge mirror.

## Out of scope

- No SMTP/Brevo credential change.
- No email recipient-routing, workflow, database, or UI redesign change.
- Do not rewrite historical stored email snapshots.

## Acceptance evidence

- Focused email outbox test covers root, current folder, current HTML, and retired legacy inputs.
- Focused regression passes red-green-red restoration proof for the BTP AppRouter route.
- Fresh BTP Shared QA email reaches `SENT` and opens the active Object Page after XSUAA login.
- No `Cannot GET` route is reached.
- CAP compile, secret scan, whitespace check, and QA-depth gate pass.

## Dependencies

- Relates to IDTS-113 BTP Shared QA migration and is a regression follow-up of IDTS-50/IDTS-81's earlier Render-route correction.
- IDTS-79 cannot be called full email UX acceptance PASS until this task is deployed and retested.

## Security note

Never store real recipients, provider redirect URLs, BTP bindings/configuration, credentials, tokens, database URLs, or raw mailbox bodies in this work package or its evidence.

## 2026-08-08 supervised BTP correction

- SangVN reproduced the mismatch between email output `/idts.bugmanagementui/index.html` and AppRouter route `/idtsbugmanagementui/index.html`.
- Branch `fix/idts-81-btp-email-deep-link-sangvn` applies the smallest shared normalizer change and covers root/current/dotted/older legacy inputs.
- Focused outbox regression passes, fails on the URL assertion when the source fix is temporarily reverted, and passes again after restoration.
- Local implementation remains unmerged and is ready for normal PR review: SangVN's equivalent Y/N Email Knowledge Gate retest is `4/4 (100%) PASS`; Critical, controlled Debug, and Teach-back are all PASS. Jira Done still requires merge/deployment evidence and final acceptance.
- Deployment and fresh mailbox click verification remain pending and are not claimed by local tests.
