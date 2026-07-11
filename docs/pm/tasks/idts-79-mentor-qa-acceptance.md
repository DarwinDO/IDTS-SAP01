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

## Acceptance còn lại

- SangVN: create/validation/attachment/comment/resubmit/retest/close/reopen và inbox/spam confirmation.
- DatDT: developer lifecycle/request information/resolve/evidence review và inbox/spam confirmation.
- NhanT: dashboard/history/assignment role boundary, falsification-first exploratory test và responsive/UX review.
- DonHV: một controlled S3 persistence proof sau same-commit restart/redeploy, dọn UAT records không giữ làm demo.

## Known limitations

- Safe AI fallback (`AI_DISABLED`) đang được chứng minh; chưa phải live-provider response evidence.
- Component-preload/i18n/flexibility 404 ngoài SAP Launchpad là baseline runtime đã biết. Mọi 5xx hoặc error mới vẫn phải xem là defect.
- Không đính kèm raw log, credential, token, database URL hoặc email đầy đủ vào Jira.
