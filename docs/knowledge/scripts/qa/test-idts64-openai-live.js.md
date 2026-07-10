# `scripts/qa/test-idts64-openai-live.js`

Purpose: opt-in smoke test for the real OpenAI provider after an authorized owner sets private environment configuration.

Usage:

```powershell
$env:OPENAI_API_KEY = '<private key>'
$env:IDTS_OPENAI_MODEL = '<approved model alias>'
npm run qa:idts64:openai-live -- --execute
```

Safety:

- Does nothing without `--execute`.
- Skips when the key or model is missing.
- Sends only a synthetic prompt, does not print the key, request, raw response, or provider text.
- A live result is required before claiming that real-provider integration works in the configured environment.
