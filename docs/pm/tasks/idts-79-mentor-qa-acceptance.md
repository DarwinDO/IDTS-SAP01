# IDTS-79 — Mentor-ready Shared QA acceptance

## Mục tiêu

Chạy acceptance mới trên Render Shared QA trước mentor review, không reset database và không deploy schema mới lên môi trường dùng chung.

## Owner và hỗ trợ

- Owner: DonHV.
- Tester sign-off: SangVN.
- Developer sign-off: DatDT.
- PM/falsification sign-off: NhanT.

## Evidence đã có

- Render API smoke cho auth và bốn capability AI: `25/25 PASS`.
- Smart Assign review-only browser smoke: PASS.
- Similar Bugs, Classification Suggestions, Handoff Summary browser smoke: `32 checks PASS`.
- Local Brevo API integration, SMTP integration, secret scan và QA Depth Gate self-test: PASS.
- Báo cáo chính: [`mentor-ready-qa-report.vi.md`](../evidence/idts-79/mentor-ready-qa-report.vi.md).
- Fresh role lifecycle: PM, Developer, and Tester completed the controlled full lifecycle; the retained demo record is closed.
- Fresh S3/PostgreSQL proof: draft upload, activation, SHA-256 download, Render restart, post-restart re-download, delete, and post-delete read all passed.
- Fresh email proof: controlled deliveries are `SENT` with provider message IDs and the connected mailbox received the notifications in Inbox.

## Acceptance còn lại

- `IDTS-81` must correct the newly confirmed email fallback deep-link regression. Generate a new mail and click-test both CTA/fallback destination before calling email UX accepted.
- NhanT: dashboard/history/assignment role boundary, falsification-first exploratory test and responsive/UX review remain useful supplementary sign-off, but no longer block the role lifecycle/S3/inbox proof already executed.
- DonHV: manually attach selected safe evidence to Jira `IDTS-79`; do not attach raw mailbox content, recipient addresses, credentials, tokens, or redirect URLs.

## Known limitations

- Safe AI fallback (`AI_DISABLED`) đang được chứng minh; chưa phải live-provider response evidence.
- Component-preload/i18n/flexibility 404 ngoài SAP Launchpad là baseline runtime đã biết. Mọi 5xx hoặc error mới vẫn phải xem là defect.
- Không đính kèm raw log, credential, token, database URL hoặc email đầy đủ vào Jira.
