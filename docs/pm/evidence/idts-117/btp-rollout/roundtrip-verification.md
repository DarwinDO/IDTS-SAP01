# IDTS-117 SAP BTP logout and re-login verification

## Release baseline

- Merge SHA: `d73377163056728a513eacc70aaa1a926afdfb3c`
- Pull request: `#254`
- MTA operation ID: `fae23f46-8d99-11f1-8630-eeee0a801182`
- MTAR SHA-256: `F0E51CE5E25C3BA1986F33C48B8A37F045B4A62E865ECA56ACA2B136AB0D4A2E`
- Deployment scope: standalone AppRouter application module only.
- Database safety: no HDI deployer, broad `cds deploy`, schema migration, or data reload was run.

## Environment verification

- `idts-sap01-approuter`: running, one of one instance.
- `idts-sap01-srv`: running, one of one instance; service upload was unchanged by this rollout.
- Service health endpoint: HTTP 200.
- Anonymous AppRouter entry: redirects to XSUAA.
- Signed-out landing page: public and contains only an explicit SAP BTP sign-in link.

## Browser round trips

| Cycle | Logout landing | Explicit sign-in bridge | XSUAA sign-in | Fiori shell | `AuthService.me` |
| --- | --- | --- | --- | --- | --- |
| 1 | PASS | PASS | PASS | PASS | HTTP 200, JSON parsed |
| 2 | PASS | PASS | PASS | PASS | HTTP 200, JSON parsed |

The tests used the saved SAP identity in the user-owned browser session. No
password, token, cookie, service key, private endpoint, or identity value was
read or stored. The safe `AuthService.me` check retained only HTTP status,
content type, JSON parse result, response key names, and body length.

## Evidence

- `01-signed-out-page.png`: public signed-out page with the explicit
  `Sign in with SAP BTP` link.
- `02-two-cycle-final-app.png`: Fiori List Report after the second complete
  logout and re-login cycle.

## Result

`PASS` — the protected `/login.html` bridge prevents the Fiori shell from
misclassifying an HTML XSUAA login response as an IDTS authorization denial.
Two consecutive fresh logout and re-login cycles completed successfully.

## Limitations

- A SAP identity-provider session may still remember the user's account. This
  task guarantees an explicit re-entry step; it does not clear the global SAP
  identity-provider session.
- SAP BTP Trial can stop applications after inactivity. Starting the AppRouter
  and service is an environment operation and is separate from authentication
  correctness.

