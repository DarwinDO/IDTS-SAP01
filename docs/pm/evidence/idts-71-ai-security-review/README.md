# IDTS-71 AI security review evidence

This folder stores safe evidence for `IDTS-71` only. Do not place raw provider prompts, provider responses, bearer tokens, passwords, SMTP/API keys, AWS keys, database URLs, or full private team email lists here.

## Local programmatic evidence

Run:

```powershell
npm run qa:idts71:programmatic
```

Current result captured during implementation:

- Result: PASS
- Checks: 31 PASS / 0 FAIL
- Main coverage:
  - AI audit payload serialization removes raw prompt/message/provider response fields.
  - Provider wrapper does not expose unsafe request details in safe responses.
  - Classification suggestions mark unsafe provider output as `AI_OUTPUT_UNSAFE`.
  - Bug/handoff summary marks unsafe provider output as `AI_OUTPUT_UNSAFE`.
  - Smart assignment explanation marks unsafe provider output as `AI_OUTPUT_UNSAFE`.
  - Disabled similar-bug suggestion path returns a safe response shape.
  - AI actions do not mutate bug workflow fields.
  - `AiSuggestions` records are sanitized review records only.

## Render shared QA smoke

Run only with private environment variables set outside the repo:

```powershell
$env:IDTS_QA_BASE_URL='https://idts-sap01-qa.onrender.com'
$env:IDTS_QA_EMAIL='<qa-user-email>'
$env:IDTS_QA_PASSWORD='<qa-user-password>'
npm run qa:idts71:render-smoke
```

The script writes sanitized evidence to:

```text
docs/pm/evidence/idts-71-ai-security-review/render-ai-smoke.json
```

Do not commit the generated JSON if it contains private email addresses or environment-specific values that should stay outside the repository. Attach the sanitized evidence to Jira manually when accepted by DonHV.

## Vietnamese

Folder này chỉ lưu evidence an toàn cho `IDTS-71`. Không đưa raw prompt, raw provider response, bearer token, password, SMTP/API key, AWS key, database URL hoặc danh sách email thật đầy đủ của team vào đây.

Smoke test trên Render cần biến môi trường private do DonHV tự set ở máy chạy test. Script đã có cơ chế redact, nhưng vẫn phải review file evidence trước khi commit hoặc attach lên Jira.
