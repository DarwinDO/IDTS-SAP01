# IDTS-75 Classification Suggestion Review UI Evidence

## English

- `classification-review-ui-static-check.json` proves the UI reuses `suggestClassification`, has the required section/dialog/i18n wiring, and contains no OData classification mutation path.
- `classification-review-browser-smoke.json` records seven passing product-browser checks, including PM and Tester access.
- `idts75_classification_review_dialog.png` shows five current-versus-suggested classification rows with confidence, reasons, and manual-review guidance.
- `idts75_classification_review_guarded_states.png` shows an invalid catalog suggestion as `No safe suggestion / Not available` and a separate low-confidence row.
- `idts75_classification_review_safe_failure.png` shows the generic failure message without backend/provider diagnostics.
- `render-ai-smoke.json` records the authenticated shared-QA Render AI API smoke: 25 pass / 0 fail.
- `render-classification-review-browser-smoke.json` records the deployed shared-QA browser smoke for the classification dialog.
- `render-classification-review-dialog.png` shows the deployed shared-QA Classification Suggestions dialog on the Render Object Page.
- The browser fixture is temporary and deleted after the run. No password, bearer token, provider credential, private endpoint, or personal email is stored.
- Known non-blocking UI5/Fiori runtime fallback messages are recorded in the Render browser evidence as `knownNonBlockingConsole`; no HTTP 5xx or unexpected blocking browser error was observed.

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
- `render-ai-smoke.json` ghi authenticated shared-QA Render AI API smoke: 25 pass / 0 fail.
- `render-classification-review-browser-smoke.json` ghi browser smoke tren shared-QA da deploy cho classification dialog.
- `render-classification-review-dialog.png` cho thay Classification Suggestions dialog da deploy tren Render Object Page.
- Browser fixture chi ton tai tam thoi va bi xoa sau run. Artifact khong luu password, bearer token, provider credential, private endpoint hoac email ca nhan.
- Cac message fallback runtime UI5/Fiori khong blocking duoc ghi trong evidence Render browser bang field `knownNonBlockingConsole`; khong co HTTP 5xx hoac browser error blocking bat thuong.
