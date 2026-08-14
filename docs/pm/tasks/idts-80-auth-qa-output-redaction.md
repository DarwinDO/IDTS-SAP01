# IDTS-80 — Redact sensitive values from auth QA output

## Context

The local auth QA suite printed a generated bearer token and a token hash in PASS diagnostics. This is a test-harness security-hygiene problem, not an authentication-runtime defect.

## Scope

- Keep the existing auth assertions.
- Do not print bearer tokens or token hashes in diagnostic output.
- Do not change the public login contract, token format, auth database model, or private configuration.

## Verification

- `npm run qa:auth:programmatic`: 28 PASS / 0 FAIL.
- Captured output scan: no bearer-like value and no SHA-256-like value.
- `npm run qa:secret-scan`, `git diff --check`, and AI DevKit lint pass.

## Evidence hygiene

Only attach a short sanitized result summary to Jira. Do not upload raw terminal logs, tokens, hashes, passwords, API keys, database URLs, or full private email addresses.
