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
- [x] The explicit sign-in link returns to the protected Fiori entry.
- [x] Existing XSUAA auth regression passes.
- [ ] Exact merge SHA is selectively deployed to AppRouter.
- [ ] Browser Sign Out → public page → Sign in → XSUAA is verified.
- [ ] A user without valid IDTS mapping still receives the existing safe denial.

## Evidence

- `npm run qa:idts117:btp-relogin`
- `npm run qa:idts113:btp-auth`
- Browser Network screenshots after BTP rollout (no cookie/token values).

## Dependencies and security

IDTS-117 blocks IDTS-108. No credential, cookie, JWT, service key or private
endpoint may be committed or attached to Jira.
