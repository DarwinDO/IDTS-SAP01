# IDTS-105 — Mentor review briefing and acknowledgment gate

- Owner: DonHV
- Support: SangVN, DatDT, NhanT
- Due: 2026-07-27
- Status: In Progress
- Jira: https://dutassociation.atlassian.net/browse/IDTS-105

## Output

- Mandatory Vietnamese briefing for Technical Specification, Unit Test and UAT.
- `AGENTS.md` briefing/acknowledgment gate.
- Human-only acknowledgment register.
- Jira dependency links to IDTS-106–112 and related legacy tasks.

## Acceptance boundary

This task may prepare rules and templates. It must not fabricate member acknowledgment,
candidate approval, UAT execution, mentor sign-off or OpenAI live acceptance.

## Verification

- OfficeCLI preflight.
- Markdown/path checks.
- Agent rules, secret scan, AI DevKit and `git diff --check`.
- PR #192 body validation: PASS with 11 required QA Depth sections and DonHV's
  existing 90% PASS Knowledge Gate evidence from IDTS-89/IDTS-90.

## 2026-08-03 live closeout audit

- BTP readiness was restored with `npm run btp:demo:prepare` and rechecked with
  `npm run btp:demo:check`: HANA ready, CAP 1/1, AppRouter 1/1, `/health` 200,
  `/ready` 200, anonymous protected API 401, and web entry 200.
- No database deploy, seed load, schema migration, or credential read was used.
- Jira and the repository register still contain zero completed human READ
  acknowledgments; DonHV, SangVN, DatDT, and NhanT remain `PENDING`.
- Reminder comments were added to IDTS-105, IDTS-108, IDTS-109, IDTS-110, and
  IDTS-111. The task remains In Progress and downstream approval/Drive gates
  remain blocked; the agent did not acknowledge for any member.
