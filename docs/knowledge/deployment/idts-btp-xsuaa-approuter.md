# IDTS SAP BTP XSUAA and AppRouter deployment

## Runtime map

`Browser → standalone AppRouter → HTML5 Application Repository` serves the Fiori application. Requests under `/odata` go from AppRouter to the CAP `srv-api` destination with the XSUAA token forwarded. CAP maps the JWT identity to `idts.cap.Users` and checks that the platform role matches the business role.

## Configuration files

| File | Responsibility |
| --- | --- |
| `mta.yaml` | CAP, HDI deployer, AppRouter, HTML5 content and managed-service bindings |
| `xs-security.json` | XSUAA scopes and role templates |
| `app/router/xs-app.json` | Browser entry, logout and protected OData forwarding |
| `app/bug-management-ui/xs-app.json` | HTML5 app routes for UI5 resources and CAP OData |
| `package.json` | XSUAA production profile and custom-auth integration profile |

## Environment separation

- SAP BTP production: HANA + XSUAA.
- Render rollback environment: PostgreSQL + custom bearer auth through the `integration` profile.
- Local development: SQLite + custom bearer auth.

S3 and Brevo are intentionally retained as private external integrations. AI
remains disabled/mock. The next IDTS-113 migration increment binds the existing
private configuration to BTP without changing those providers.

## Verification order

1. Read effective BTP and Render profiles with `cds env`.
2. Run `qa:idts113:btp-auth`.
3. Compile CAP and build UI5.
4. Build the MTAR.
5. After deployment, assign exactly one IDTS role collection per user.
6. Smoke AppRouter login, `AuthService.me`, protected OData, logout and role mismatch.

## Security notes

Do not commit service keys, JWTs, destination credentials or external-provider secrets. A successful AppRouter login is not sufficient: the IDTS user row must be active and its `role_code` must match the XSUAA role.
