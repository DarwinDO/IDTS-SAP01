# IDTS User Administration UI

Standalone SAPUI5 application for selected PM users who also hold the `UserAdmin` capability. It lists controlled onboarding requests and invokes `UserAdministrationService.requestOnboarding` to queue one invitation for exactly one PM, Tester, or Developer business role.

The UI is not an authorization boundary by itself. Its HTML5 routes require the XSUAA `UserAdmin` scope, and CAP additionally verifies PM + UserAdmin plus a matching active internal PM. The app does not collect SAP passwords, create SAP identities, assign BTP Role Collections, or expose raw provider errors.

Local verification:

```text
npm ci --workspaces=false
npm test
npm run build
```

The production build creates `dist/user-administration-ui.zip` for the MTA application-content module. Building does not deploy the app or update XSUAA/HANA.
