# IDTS-66 Evidence Index

## Scope

This folder stores repository-safe evidence for the duplicate/similar bug suggestion backend. It contains no private endpoint, credential, bearer token, email address, attachment content, or raw AI prompt/provider response.

Vietnamese: Folder này lưu evidence an toàn trong repo cho backend gợi ý bug trùng/tương tự. Evidence không chứa endpoint private, credential, bearer token, email, attachment content hoặc raw AI prompt/provider response.

## Fresh verification

- Command: `npm run qa:idts66:programmatic`
- Result on 2026-07-08: `30 PASS / 0 FAIL`
- Covered cases:
  - similar bug ranked first;
  - unrelated bug absent or below similar confidence;
  - pre-create search without a persisted bug;
  - source-linked safe `AiSuggestions` audit;
  - AI disabled fallback;
  - provider error fallback;
  - no-result high-threshold case;
  - malformed embedding fallback;
  - invalid empty input;
  - no automatic `DuplicateLinks` write.
- Safe structured result sample: `api-sample.json`.

Regression and repository gates also passed:

- `npm run qa:idts64:programmatic` — `26 PASS / 0 FAIL`.
- `npm run qa:idts65:programmatic` — `19 PASS / 0 FAIL`.
- `npm run qa:auth:programmatic` — `28 PASS / 0 FAIL`.
- `npm run qa:depth:self-test` — `6 PASS / 0 FAIL`.
- `npx cds compile srv --to edmx -s all` — pass with the existing non-blocking attachment annotation warning recorded in DonHV status.
- `npm run qa:secret-scan` — pass.
- `npx ai-devkit@latest lint --json` — pass, 5 checks OK.
- JavaScript syntax checks and `git diff --check` — pass.

## Manual Jira attachment

DonHV can attach this README and `api-sample.json` to IDTS-66 after the PR is ready. The repository remains the source copy; the agent does not upload evidence automatically.

Vietnamese: DonHV có thể tự attach README này và `api-sample.json` lên IDTS-66 khi PR sẵn sàng. Repo giữ bản nguồn; agent không tự upload evidence.

Implementation review: GitHub PR #110 is open and mergeable. Jira comment `10425` links the PR and this evidence index.
