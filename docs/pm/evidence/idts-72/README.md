# IDTS-72 AI Acceptance Evidence

## English

This folder contains selected, secret-safe evidence for the final QA acceptance of the approved IDTS AI assistance flows.

Important clarification after DonHV review:

- `Smart Assign` has real product UI evidence because the Object Page assignment flow calls `explainSmartAssignment`.
- Duplicate/similar bug detection, classification suggestion, and bug handoff summary are verified through backend/API suites, but they are not currently exposed as standalone user-visible Fiori UI panels.
- Therefore, the visual evidence bundle separates actual product UI evidence from visual QA report evidence. Do not treat the three backend-only screenshots as product screen screenshots.

Coverage:

- Duplicate and similar bug suggestions.
- Classification suggestions with active-catalog validation.
- Grounded bug and handoff summaries.
- Smart Assign explanations.
- Disabled provider, provider error, malformed output, low confidence, empty/no-result, prompt-misuse, authorization, audit persistence, and no-automatic-mutation behavior.
- Browser review of safe user-facing Smart Assign explanation text, manual candidate selection, cancel behavior, and unchanged bug workflow state.

Key files:

- `idts72-ai-acceptance.json`: concise result of the local programmatic suites.
- `render-ai-smoke.json`: sanitized shared-QA API evidence from the earlier authenticated Render smoke. It contains no bearer token or password.
- `idts72-ai-browser.json`: browser assertions for the Smart Assign review flow.
- `idts72_smart_assign_ai_review.png`: product UI screenshot showing a reviewable Smart Assign explanation and manual decision controls.
- `visual-ai-flows/`: additional visual evidence audit requested after DonHV noticed only Smart Assign had visible UI evidence.

Visual evidence bundle:

- `visual-ai-flows/visual-ai-flows-report.html`: human-readable visual audit report.
- `visual-ai-flows/visual-ai-flows-summary.json`: machine-readable summary of what is product UI versus backend/API evidence.
- `visual-ai-flows/00-visual-ai-flows-overview.png`: overview screenshot.
- `visual-ai-flows/01-duplicate-similar-bug-detection.png`: visual report card for duplicate detection API evidence.
- `visual-ai-flows/02-classification-suggestion.png`: visual report card for classification API evidence.
- `visual-ai-flows/03-bug-summary-handoff.png`: visual report card for summary API evidence.
- `visual-ai-flows/04-smart-assign-ai-explanation-product-ui.png`: copied product UI screenshot for Smart Assign.
- `visual-ai-flows/05-failure-fallback-safe-behavior.png`: visual report card for failure/fallback coverage.
- `visual-ai-flows/06-qa-gap-decision.png`: QA decision screenshot explaining the remaining UI evidence gap.

Commands:

```powershell
npm run qa:idts72:acceptance
npm run qa:idts72:browser
npm run qa:idts72:visual-evidence
```

Private values must be supplied only through environment variables. Review every generated artifact before attaching it to Jira.

## Tiếng Việt

Folder này chứa evidence đã chọn lọc và không lộ secret cho vòng QA acceptance cuối của các luồng AI assistance đã được duyệt trong IDTS.

Làm rõ quan trọng sau khi DonHV review:

- `Smart Assign` có evidence UI sản phẩm thật, vì flow Assignment trên Object Page đang gọi `explainSmartAssignment`.
- Duplicate/similar bug detection, classification suggestion, và bug handoff summary đã được verify bằng backend/API suite, nhưng hiện chưa có panel Fiori riêng để user nhìn thấy trực tiếp trên UI.
- Vì vậy, bộ visual evidence mới tách rõ đâu là evidence UI sản phẩm thật, đâu là visual QA report từ kết quả backend/API. Không xem ba screenshot backend-only là screenshot màn hình sản phẩm.

Phạm vi đã cover:

- Gợi ý bug trùng hoặc tương tự.
- Gợi ý phân loại có kiểm tra active catalog.
- Tóm tắt bug và handoff có căn cứ.
- Giải thích Smart Assign.
- Provider bị tắt, provider lỗi, output sai cấu trúc, confidence thấp, không có kết quả, prompt misuse, authorization, audit persistence, và đảm bảo AI không tự mutate workflow.
- Browser review cho Smart Assign: copy an toàn với user, chọn candidate thủ công, cancel không đổi workflow, và bug state không bị mutate khi chưa xác nhận.

Các file chính:

- `idts72-ai-acceptance.json`: kết quả ngắn gọn của các suite programmatic local.
- `render-ai-smoke.json`: evidence API shared QA đã sanitize từ lần Render smoke authenticated trước đó, không chứa bearer token hoặc password.
- `idts72-ai-browser.json`: assertion browser cho luồng review Smart Assign.
- `idts72_smart_assign_ai_review.png`: screenshot UI sản phẩm cho Smart Assign, có explanation có thể review và nút quyết định thủ công.
- `visual-ai-flows/`: bộ visual evidence audit bổ sung sau khi DonHV nhận thấy mới có evidence UI rõ cho Smart Assign.

Bộ visual evidence:

- `visual-ai-flows/visual-ai-flows-report.html`: báo cáo visual audit đọc được bằng browser.
- `visual-ai-flows/visual-ai-flows-summary.json`: summary dạng JSON, ghi rõ flow nào là product UI và flow nào mới là backend/API evidence.
- `visual-ai-flows/00-visual-ai-flows-overview.png`: screenshot tổng quan.
- `visual-ai-flows/01-duplicate-similar-bug-detection.png`: report card cho evidence API duplicate detection.
- `visual-ai-flows/02-classification-suggestion.png`: report card cho evidence API classification.
- `visual-ai-flows/03-bug-summary-handoff.png`: report card cho evidence API handoff summary.
- `visual-ai-flows/04-smart-assign-ai-explanation-product-ui.png`: screenshot UI sản phẩm của Smart Assign.
- `visual-ai-flows/05-failure-fallback-safe-behavior.png`: report card cho failure/fallback.
- `visual-ai-flows/06-qa-gap-decision.png`: screenshot quyết định QA, nói rõ gap UI còn lại.

Command:

```powershell
npm run qa:idts72:acceptance
npm run qa:idts72:browser
npm run qa:idts72:visual-evidence
```

Giá trị private chỉ được truyền qua environment variable. Phải review từng artifact trước khi tự attach lên Jira.
