# IDTS-81 — Correct Shared QA email fallback deep link

## Goal

Correct newly generated IDTS email links so both the CTA and visible fallback link open the current Fiori Object Page instead of a retired route that can end at `Cannot GET`.

## Scope

- Owner: DonHV. Support: DatDT for browser retest and NhanT for QA evidence.
- Due date: 2026-07-12.
- Change only the shared email URL normalizer and its focused regression test.
- Accept Render root, the current `idts.bugmanagementui` app path, and retired legacy paths as input; always emit the current app route.
- Update the matching `srv` knowledge mirror.

## Out of scope

- No SMTP/Brevo credential change.
- No email recipient-routing, workflow, database, or UI redesign change.
- Do not rewrite historical stored email snapshots.

## Acceptance evidence

- Focused email outbox test covers root, current folder, current HTML, and retired legacy inputs.
- Fresh Shared QA email reaches `SENT` and opens the active Object Page after login.
- No `Cannot GET` route is reached.
- CAP compile, secret scan, whitespace check, and QA-depth gate pass.

## Dependencies

- Relates to IDTS-79 Shared QA acceptance and is a regression follow-up of IDTS-50.
- IDTS-79 cannot be called full email UX acceptance PASS until this task is deployed and retested.

## Security note

Never store real recipients, provider redirect URLs, Render configuration, credentials, tokens, database URLs, or raw mailbox bodies in this work package or its evidence.
