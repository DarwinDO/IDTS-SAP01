# IDTS-109 Technical Specification Candidate

Status: `CANDIDATE REFRESHED FROM CURRENT DEV — NEW EXACT-HEAD DATDT APPROVAL REQUIRED — DO NOT SYNC TO MENTOR CURRENT`

Owner: DatDT

Final integrator: DonHV

Required briefing baseline: `3e78b495cb8feb56188cc446b827d47e040e1b98`

DatDT briefing acknowledgment: `PENDING` for the required briefing baseline; the older Jira comment `10762` does not satisfy this gate

DatDT candidate approval: `PENDING`; Jira comment `10763` predates the refreshed candidate

Prepared: 2026-07-31; refreshed against current dev: 2026-08-04

Submission language: English only

Current source baseline: `origin/dev` commit
`cbce7b6196da5cc8ce64dbd36a61709a8f4121c3`, merged normally into this branch.
The final exact candidate head will be recorded after the refreshed checks pass.

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
- `srv/auth/platform-role.js`, `app/router/xs-app.json`, `app/router/resources/`
- `mta.yaml`, `server.js`
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
- The standalone `provider=openai` live path remains `BLOCKED / NOT ACCEPTED` for
  this candidate. The SAP BTP Vercel AI Gateway route has PM live acceptance for
  Classification, Handoff, Similar Bugs and Smart Assign, including an OpenAI
  classification model behind the Gateway. Tester/Developer interactive role
  coverage remains open; neither result is generalized into full acceptance.
- Earlier DatDT approval in IDTS-109 comment `10763` predates the current source
  baseline. A new personal approval naming the final candidate commit is required.
- DonHV remains responsible for final workbook integration, generation, visual
  review and upload under the current shared-artifact workflow.
