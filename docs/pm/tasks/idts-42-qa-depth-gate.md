# IDTS-42 - QA Depth Gate and Hardened Browser Harness

Status: Implementation branch ready for PR/merge.

Owner: NhanT primary QA owner; DonHV implemented the repository gate and process wiring.

## Purpose

IDTS-32 showed that happy-path QA can look clean while still missing invalid input, role, persistence, and UI/UX defects. IDTS-42 turns those lessons into a repeatable gate:

- every relevant PR must show positive and negative evidence;
- browser QA must actively look for runtime errors, unexpected 5xx responses, SAP error dialogs, and persistence problems;
- missing QA areas must be explained instead of silently skipped.

Vietnamese: IDTS-32 cho thấy QA chỉ chạy luồng chính có thể báo PASS nhưng vẫn bỏ sót lỗi input sai, role, persistence và UI/UX. IDTS-42 biến các bài học đó thành gate lặp lại được: PR phải có evidence cả positive/negative, browser QA phải bắt runtime error/5xx/dialog/persistence, và phần chưa test phải ghi lý do rõ.

## Implemented changes

- Added `.github/pull_request_template.md` with mandatory evidence sections.
- Added `.github/workflows/qa-depth-gate.yml` for PRs into `dev` touching `app/`, `srv/`, `db/`, `scripts/qa/`, GitHub workflow files, or package files.
- Added `scripts/qa/check-pr-depth.js` to fail PR bodies that miss evidence sections, leave sections empty, or use bare `N/A`.
- Added `scripts/qa/test-qa-depth-gate.js` to self-test the PR body gate and browser-harness classifiers.
- Added `scripts/qa/lib/browser-harness.js` with reusable checks for page errors, console errors, unexpected HTTP failures, SAP error dialogs, screenshots, and save/reload persistence checkpoints.
- Added `scripts/qa/secret-scan.js` as a lightweight no-secret guard for code/docs/test output.
- Added `docs/qa/qa-depth-gate.md` as the team guideline.
- Updated `AGENTS.md` so future QA/review work must run deterministic regression and falsification-first exploratory testing.

Vietnamese:

- Thêm PR template bắt buộc có các nhóm evidence.
- Thêm GitHub Action `qa-depth-gate` cho PR vào `dev` khi chạm `app/`, `srv/`, `db/`, `scripts/qa/`, workflow hoặc package files.
- Thêm script kiểm tra PR body để fail nếu thiếu section, section rỗng, hoặc ghi `N/A` không có lý do.
- Thêm self-test cho gate và browser-harness classifier.
- Thêm browser harness dùng lại để bắt page error, console error, HTTP fail bất thường, SAP error dialog, screenshot và checkpoint save/reload.
- Thêm secret scan nhẹ.
- Thêm guideline QA Depth Gate.
- Siết `AGENTS.md` để QA/review sau này phải có regression xác định và exploratory theo hướng cố phá feature.

## Verification evidence

- `npm run qa:depth:self-test` -> `QA Depth Gate self-test: 5 PASS / 0 FAIL`.
- `node scripts/qa/check-pr-depth.js --stdin` with a valid IDTS-42 PR body -> `QA Depth Gate PR body check: PASS (9 required sections)`.
- `npx cds compile srv app/bug-management-ui --to edmx -s all` -> passed; existing attachment annotation warning remains non-blocking.
- `npm run qa:auth:programmatic` -> `TOTAL: 23 PASS | 0 FAIL | 23 checks`.
- `npm run qa:idts41:programmatic` -> `Checks: 18 | Passed: 18 | Failed: 0`.
- `npm run qa:idts43:programmatic` -> `IDTS-43 Fiori UX checks: 11 PASS / 0 FAIL`.
- `npm run qa:email-outbox:programmatic` -> `IDTS-36 email outbox programmatic checks: PASS`.
- `npx ui5 build --config ui5.yaml` under `app/bug-management-ui` -> build succeeded.
- `npm run qa:secret-scan` -> no credential-like key patterns found.
- `npx ai-devkit@latest lint --json` -> pass.
- `git diff --check` -> pass; only line-ending conversion warnings were printed by Git for existing CRLF handling.

Vietnamese: Các lệnh verify chính đã pass. Cảnh báo CAP về attachment annotation là warning cũ, không phải lỗi mới của IDTS-42. `git diff --check` không báo whitespace error, chỉ có warning chuyển line-ending.

## Remaining handoff

- After this branch is merged, require the `qa-depth-gate` GitHub Action in branch protection for `dev`.
- NhanT should reuse `scripts/qa/lib/browser-harness.js` when hardening PR #33 or future browser QA scripts.
- SangVN should retest IDTS-32 after IDTS-41, IDTS-42, and IDTS-43 are all on `dev`.
- Scheduled automation can later inspect PRs for missing evidence and remote branches that are ahead of `dev` without an open PR.

Vietnamese: Sau khi merge, cần bật branch protection yêu cầu `qa-depth-gate` pass. NhanT nên dùng browser harness mới cho PR #33 và các script QA sau này. SangVN retest IDTS-32 khi IDTS-41/42/43 đều đã vào `dev`.
