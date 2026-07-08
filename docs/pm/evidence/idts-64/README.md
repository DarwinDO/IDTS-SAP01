# IDTS-64 Evidence - AI Provider Abstraction

Date: 2026-07-08

Branch: `feature/idts-64-ai-provider-abstraction-donhv`

## Scope verified

- AI is disabled by default.
- Mock provider supports chat, structured output, and embedding calls.
- Provider failure and timeout return sanitized failure results instead of throwing into workflow code.
- Secret-like prompt input is redacted before provider handling.
- No real AI provider credential, endpoint, or dependency is required.

## Focused evidence

Command:

```powershell
npm run qa:idts64:programmatic
```

Result:

```text
TOTAL: 26 PASS  |  0 FAIL  |  26 checks
```

Important pass points:

- Disabled config returns `AI_DISABLED`.
- Mock chat, structured output, and embedding succeed.
- Provider error returns `AI_PROVIDER_ERROR` with sanitized diagnostics.
- Timeout returns `AI_TIMEOUT` with retryable flag.
- Redactor masks AWS-style key and Brevo-style key patterns generated at runtime.

## Notes

- A fresh worktree initially failed because `node_modules` was absent and `@sap/cds` could not be resolved. This was fixed by running `npm ci --include=dev`; it is an environment setup issue, not a product defect.
- `npm ci --include=dev` reported the known baseline npm audit findings. IDTS-64 adds no new runtime dependency; remaining vulnerability tracking belongs to dependency/security follow-up work.
- `npx cds compile srv --to edmx -s all` completed. It still reports the existing attachment vocabulary warning about `NonUpdateableProperties`; this is baseline attachment noise and IDTS-64 does not touch attachments.
- `npm run qa:secret-scan` passed.
- `git diff --check` exited successfully. The only messages were Windows LF/CRLF warnings.
- `npx ai-devkit@latest lint --json` passed with `pass: true`.
