# IDTS-117 — Restore explicit SAP BTP re-login after sign-out

## Status

Done — PR #254 merged, the exact merge SHA was selectively deployed to the
AppRouter, and two complete browser logout/re-login cycles passed.

## Context

After Sign Out, AppRouter redirected to the protected root route. A still-valid
SAP identity-provider session could therefore authenticate the same identity
immediately, leaving no stable signed-out screen or explicit re-entry point.

## Scope

- Add one public post-logout page to the standalone AppRouter.
- Redirect `/do/logout` to that page.
- Preserve XSUAA as the only BTP login mechanism.
- Preserve local/Render custom authentication.
- Add focused regression coverage and beginner-first knowledge mirrors.

## Out of scope

- Clearing the user's global SAP identity-provider session.
- Adding a custom BTP password form.
- Changing HANA users, role collections, XSUAA scopes or OData contracts.
- Database deployment or data migration.

## Acceptance criteria

- [x] `/do/logout` redirects to a public route.
- [x] The public page contains no token/password/custom-auth logic.
- [x] The explicit sign-in link enters a dedicated XSUAA-protected login bridge before the Fiori entry.
- [x] Existing XSUAA auth regression passes.
- [x] Exact merge SHA is selectively deployed to AppRouter.
- [x] Browser Sign Out → public page → protected login bridge → XSUAA → Fiori is verified twice.
- [x] A user without valid IDTS mapping still receives the existing safe denial
  in the unchanged IDTS-113 authorization regression.

## Evidence

- `npm run qa:idts117:btp-relogin`
- `npm run qa:idts113:btp-auth`
- Browser Network screenshots after BTP rollout (no cookie/token values).

## Follow-up finding after first rollout

The signed-out page worked, but a repeated sign-in exposed a race: the app shell
loaded while `AuthService.me` followed an XSUAA redirect and received HTML with
HTTP 200. The browser then treated the non-JSON body as an access failure. The
follow-up adds a protected `/login.html` bridge and content-type recovery; this
is a browser/AppRouter defect, not a HANA user-mapping failure.

Jira comment `10803` recorded the live finding. The required two complete
post-deployment round trips now pass; final rollout evidence supersedes that
temporary In Progress note.

## Follow-up verification before PR

- `npm run qa:idts117:btp-relogin`: PASS.
- `node --check app/bug-management-ui/webapp/auth-guard.js`: PASS.
- UI5 manifest validation: PASS, zero errors.
- Targeted UI5 lint for `webapp/auth-guard.js`: PASS, zero findings.
- `qa:idts113:btp-auth`: PASS 12/12; `qa:auth:programmatic`: PASS 28/28.
- Secret scan, agent rules and depth self-test: PASS; depth self-test 15/15.
- CAP compile: PASS with the pre-existing attachment capability warning.
- UI5 production build: PASS; AI DevKit lint: PASS 5/5.
- `git diff --check`: PASS with line-ending warnings only.
- Ponytail review: PASS. The fix adds one protected route, one static bridge and
  one content-type guard; no dependency, framework or duplicate auth layer.
- PR #254 QA Depth Gate initially failed because the GitHub CLI submission
  escaped newlines as literal `\\n`; the corrected PR body contains all required
  headings. This is a tooling/evidence-format issue, not a runtime test failure.
- A subsequent gate required the full structured Ownership Knowledge Gate
  fields rather than a short reference. The PR body now records the existing
  DonHV 90% PASS result with exact parser labels; no reassessment was performed.

## Dependencies and security

IDTS-117 blocks IDTS-108. No credential, cookie, JWT, service key or private
endpoint may be committed or attached to Jira.

## Final rollout and acceptance

- PR #254 merged normally at `d73377163056728a513eacc70aaa1a926afdfb3c`.
- Selective MTA operation `fae23f46-8d99-11f1-8630-eeee0a801182` deployed only
  the standalone AppRouter application module.
- MTAR SHA-256:
  `F0E51CE5E25C3BA1986F33C48B8A37F045B4A62E865ECA56ACA2B136AB0D4A2E`.
- AppRouter and service are running one of one; health returned HTTP 200.
- Two fresh Sign Out → signed-out page → `/login.html` → XSUAA → Fiori cycles
  passed. In both cycles `AuthService.me` returned HTTP 200 JSON and parsed
  successfully.
- Evidence: `docs/pm/evidence/idts-117/btp-rollout/roundtrip-verification.md`.
- Invalid mapping remains covered by the unchanged IDTS-113 negative auth
  regression; this rollout did not create or impersonate another SAP identity
  for an interactive retest.
