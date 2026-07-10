---
name: idts-scope-and-domain
description: Product scope, domain boundaries, and AI advisory constraints for IDTS.
applies_to: requirements, BA, design, CAP, Fiori, AI, documentation
priority: required
---

# Scope and Domain

- IDTS is a SAP CAP + Fiori defect-tracking application, not a Jira replacement, source-control system, CI/CD tool, code-review system, or incident-management platform.
- Preserve the documented flows: create, duplicate check, classification, assignment/reassignment, developer review, request information, reject/follow-up, resolve, retest, close/reopen, comments, notifications, history, attachments, and PM monitoring.
- `Rejected` is never a silent terminal state: keep a reason, next action owner, history, and follow-up path.
- CAP data and workflow validation remain authoritative; UI visibility never replaces backend authorization.
- Keep SQLite portability and avoid hardcoded deployment endpoints, credentials, or target-specific SQL.

## AI boundary

- AI may suggest similar bugs, classification, handoff summaries, and Smart Assign explanations only.
- AI output is reviewable advice. It must never auto-assign, create duplicate links, persist classification, or transition status.
- Send only allowlisted minimum data. Never send/passwords, hashes, tokens, keys, private emails/endpoints, attachment content, storage references, raw logs, or hidden reasoning.
- Provider failure, timeout, malformed output, or disabled configuration must not block the non-AI workflow.
- Update `IDTS-SUMMARY.md`, `IDTS-Business-Rule.md`, `IDTS-PROJECT-SCOPE-SAP01.md`, and `docs/project-context.md` only when business meaning changes; otherwise state why they remain unchanged.
