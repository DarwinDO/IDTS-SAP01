# IDTS-117 — Restore explicit SAP BTP re-login after sign-out

## Status

In Progress — local implementation and focused regression pass; BTP rollout and
interactive browser verification remain.

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
- [ ] Exact merge SHA is selectively deployed to AppRouter.
- [ ] Browser Sign Out → public page → protected login bridge → XSUAA → Fiori is verified twice.
- [ ] A user without valid IDTS mapping still receives the existing safe denial.

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

Jira tracking: IDTS-117 comment `10803` records the live finding and keeps the
issue In Progress until two complete post-deployment round trips pass.

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

## Dependencies and security

IDTS-117 blocks IDTS-108. No credential, cookie, JWT, service key or private
endpoint may be committed or attached to Jira.
