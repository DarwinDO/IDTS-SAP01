# IDTS-75 Classification Suggestion Review UI Evidence

## English

- `classification-review-ui-static-check.json` proves the UI reuses `suggestClassification`, has the required section/dialog/i18n wiring, and contains no OData classification mutation path.
- `classification-review-browser-smoke.json` records seven passing product-browser checks, including PM and Tester access.
- `idts75_classification_review_dialog.png` shows five current-versus-suggested classification rows with confidence, reasons, and manual-review guidance.
- `idts75_classification_review_guarded_states.png` shows an invalid catalog suggestion as `No safe suggestion / Not available` and a separate low-confidence row.
- `idts75_classification_review_safe_failure.png` shows the generic failure message without backend/provider diagnostics.
- The browser fixture is temporary and deleted after the run. No password, bearer token, provider credential, private endpoint, or personal email is stored.

Run locally:

```powershell
$env:PORT='4015'
npx cds serve all
```

Then:

```powershell
$env:IDTS_QA_BASE_URL='http://localhost:4015'
npm run qa:idts75:browser
```

## Vietnamese

- `classification-review-ui-static-check.json` chung minh UI tai su dung `suggestClassification`, wire dung section/dialog/i18n va khong co duong ghi OData classification.
- `classification-review-browser-smoke.json` ghi bay browser check san pham da pass, gom ca PM va Tester.
- `idts75_classification_review_dialog.png` cho thay nam row so sanh current/suggested, confidence, reason va huong dan user tu review.
- `idts75_classification_review_guarded_states.png` cho thay suggestion sai catalog duoc hien `No safe suggestion / Not available` va row low-confidence rieng.
- `idts75_classification_review_safe_failure.png` cho thay thong bao loi generic, khong lo diagnostic backend/provider.
- Browser fixture chi ton tai tam thoi va bi xoa sau run. Artifact khong luu password, bearer token, provider credential, private endpoint hoac email ca nhan.
