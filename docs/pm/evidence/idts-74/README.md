# IDTS-74 Duplicate/Similar Review UI Evidence

## English

- `duplicate-review-ui-static-check.json` proves the Object Page entry point, existing `suggestSimilarBugs` action reuse, safe copy, and review-only behavior are wired in source.
- `duplicate-review-browser-smoke.json` records positive, no-result, safe-failure, and no-mutation browser checks.
- `idts74_duplicate_review_dialog.png` shows the real SAPUI5 dialog with a visible similar-bug candidate, match score, reason, and manual-review guidance.
- `idts74_duplicate_review_empty_state.png` shows the readable no-result state.
- `idts74_duplicate_review_safe_failure.png` shows the generic failure message without backend/provider diagnostics.
- The browser fixture is temporary and is deleted after the run. No password, bearer token, provider credential, private endpoint, or personal email is stored in these artifacts.

Run:

```powershell
$env:PORT='4014'
npx cds serve all
```

Then, in a second terminal:

```powershell
$env:IDTS_QA_BASE_URL='http://localhost:4014'
npm run qa:idts74:browser
```

## Vietnamese

- `duplicate-review-ui-static-check.json` chung minh entry point tren Object Page, viec tai su dung action `suggestSimilarBugs`, copy an toan, va behavior chi de review da duoc wire trong source.
- `duplicate-review-browser-smoke.json` ghi cac check browser positive, no-result, safe-failure va no-mutation.
- `idts74_duplicate_review_dialog.png` cho thay dialog SAPUI5 that co candidate tuong tu, match score, reason, va huong dan user tu review.
- `idts74_duplicate_review_empty_state.png` cho thay no-result state de doc.
- `idts74_duplicate_review_safe_failure.png` cho thay thong bao loi generic, khong lo diagnostic backend/provider.
- Browser fixture chi ton tai tam thoi va duoc xoa sau khi test. Artifact khong luu password, bearer token, provider credential, private endpoint, hoac email ca nhan.
