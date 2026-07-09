# IDTS-72 AI Acceptance Evidence

## English

This folder contains selected, secret-safe evidence for the final QA acceptance of the four approved AI assistance flows.

Coverage:

- Duplicate and similar bug suggestions.
- Classification suggestions with active-catalog validation.
- Grounded bug and handoff summaries.
- Smart Assign explanations.
- Disabled provider, provider error, malformed output, low confidence, empty/no-result, prompt-misuse, authorization, audit persistence, and no-automatic-mutation behavior.
- Browser review of safe user-facing explanation text, manual candidate selection, cancel behavior, and unchanged bug workflow state.
- Shared-QA Render API smoke for all four flows.

Key files:

- `idts72-ai-acceptance.json`: concise result of the local programmatic suites and shared-QA Render smoke.
- `render-ai-smoke.json`: sanitized shared-QA API evidence. It contains no bearer token or password.
- `idts72-ai-browser.json`: browser assertions for the Smart Assign review flow.
- `idts72_smart_assign_ai_review.png`: selected browser screenshot showing a reviewable explanation and manual decision controls.

Commands:

```powershell
npm run qa:idts72:acceptance
npm run qa:idts72:browser
```

Private values must be supplied only through environment variables. Review every generated artifact before attaching it to Jira.

## Tiếng Việt

Folder này chứa evidence đã chọn lọc và không lộ secret cho vòng QA acceptance cuối của bốn luồng AI assistance đã được duyệt.

Phạm vi:

- Gợi ý bug trùng hoặc tương tự.
- Gợi ý phân loại có kiểm tra active catalog.
- Tóm tắt bug và handoff có căn cứ.
- Giải thích Smart Assign.
- Provider bị tắt, provider lỗi, output sai cấu trúc, confidence thấp, không có kết quả, prompt misuse, authorization, lưu audit và bảo đảm AI không tự đổi dữ liệu.
- Browser test kiểm tra nội dung giải thích an toàn cho user, chọn candidate thủ công, hủy thao tác và trạng thái workflow của bug không đổi.
- Shared-QA Render API smoke cho đủ bốn luồng.

File chính:

- `idts72-ai-acceptance.json`: kết quả ngắn gọn của các suite programmatic local và shared-QA Render smoke.
- `render-ai-smoke.json`: evidence API shared QA đã sanitize, không chứa bearer token hoặc password.
- `idts72-ai-browser.json`: assertion browser cho luồng review Smart Assign.
- `idts72_smart_assign_ai_review.png`: screenshot được chọn, thể hiện explanation có thể review và quyền quyết định thủ công.

Command:

```powershell
npm run qa:idts72:acceptance
npm run qa:idts72:browser
```

Giá trị private chỉ được truyền qua environment variable. Phải review từng artifact trước khi tự attach lên Jira.
