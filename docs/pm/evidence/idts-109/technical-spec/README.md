# IDTS-109 Technical Specification Candidate

Status: `CANDIDATE APPROVED AT COMMENT 10763 — POST-DEV-SYNC DELTA REVIEW REQUIRED — DO NOT SYNC TO MENTOR CURRENT`

Owner: DatDT

Final integrator: DonHV

Briefing baseline: `4b4c93c1d8b45024677653e1f890d52e742b2aaf`

DatDT briefing acknowledgment: Jira IDTS-109 comment `10762`

DatDT candidate approval: Jira IDTS-109 comment `10763`

Prepared: 2026-07-31

Submission language: English only

Current source baseline: `origin/dev` commit
`69f6d06310df90a31afd63f05b7c0f2b102fe860`, merged into this branch by commit
`72a5501d3baa54313eeb54861a01523457e243cd`.

## Purpose

This package supplies structured English source for the IDTS-109-owned portions of
the SAP490 Technical Specification. It is a review candidate, not the official
workbook and not evidence that the task has passed.

## Package map

| File | Intended workbook destination | Content |
| --- | --- | --- |
| `functional-requirements.md` | Functional Requirements | Business-level requirements only |
| `development-standards.md` | Development Standards | SAP concept to CAP/Fiori equivalent and verification |
| `message-catalog.md` | Message Definition | Source-derived user, API, worker and AI messages |
| `technical-implementation.md` | Technical Implementation | Separate 14-part traces for DatDT-owned functions |
| `review-checklist.md` | Review/evidence control | Gaps, approval and final-integration gates |

## Source baseline

- `srv/auth.js`, `srv/auth/custom-auth.js`
- `srv/service.cds`, `srv/service.js`
- `srv/bug-service/monitoring.js`, `srv/bug-service/history.js`
- `srv/email/`
- `srv/ai/`
- `srv/ai/vercel-gateway-provider.js`
- `app/bug-management-ui/webapp/login-page.js`
- `app/bug-management-ui/webapp/auth-guard.js`
- `app/bug-management-ui/webapp/dashboard-page.js`
- `app/bug-management-ui/webapp/ext/login/`
- `app/bug-management-ui/webapp/ext/actions/`
- `app/bug-management-ui/webapp/ext/ai/`
- `app/bug-management-ui/webapp/i18n/i18n_en.properties`
- `package.json` QA command definitions
- `scripts/qa/test-idts115-ai-fiori-entrypoints.js`
- `docs/pm/evidence/idts-114/`
- `docs/pm/evidence/idts-115/`

## Candidate boundaries

- No runtime code is changed.
- No Drive file is changed.
- No provider secret, private endpoint, raw prompt or raw provider response is
  included.
- Direct OpenAI live acceptance remains
  `BLOCKED / NOT ACCEPTED` for this candidate. The later Vercel AI Gateway path is
  separately recorded as staged with partial runtime acceptance; it must not be
  described as complete provider-primary acceptance.
- DatDT reviewed and approved the pre-sync candidate in IDTS-109 comment `10763`.
  The latest `dev` added three UI entry points and a Vercel provider path after that
  approval; the corresponding delta requires review before final integration.
- DonHV remains responsible for final workbook integration, generation, visual
  review and upload under the current shared-artifact workflow.
