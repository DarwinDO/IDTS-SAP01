---
name: idts-testing-security-and-release
description: QA depth, security boundaries, verification evidence, and release handoff rules.
applies_to: tests, configuration, deployments, reviews, completion claims
priority: required
---

# Testing, Security, and Release

- Test to the risk: positive, negative, edge/boundary, role/authorization, persistence/reload, and UI/UX evidence where applicable.
- Use focused CAP compile, programmatic, HTTP, browser, and shared-QA checks; do not represent a narrow green test as broad acceptance.
- The PR body must complete all QA Depth Gate sections and explain every N/A claim.
- Never commit secrets: passwords, tokens, API keys, private URLs, SMTP/AWS/DB credentials, OAuth data, `.env`, or `.cdsrc-private.json`.
- Treat provider/configuration failures as safe operational failures; they must not roll back normal IDTS workflow.
- Use `verify` before any completion claim. Report fresh command, exit code, key result, known warning, and remaining risk.
- Use security review/secret scan for sensitive code, configuration, external API, auth, email, storage, or deployment work.
