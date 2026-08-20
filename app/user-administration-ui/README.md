# IDTS User Administration UI

Standalone SAPUI5 application for selected PM users who also hold the `UserAdmin` capability. It supports controlled invitation and identity verification, human approval, access-operation monitoring, role change, retry, and revoke for exactly one PM, Tester, or Developer business role.

The UI is not an authorization boundary by itself. Its HTML5 routes require the XSUAA `UserAdmin` scope, and CAP additionally verifies PM + UserAdmin plus a matching active internal PM. The app never collects SAP passwords or calls SAP authorization APIs directly. CAP writes a versioned operation journal and a separate least-privilege broker is the only component allowed to reconcile BTP Role Collections. The real SAP provider adapter and credentials are disabled/not present in this source candidate; local tests use a fake provider, so this README is not a live provisioning claim.

Local verification:

```text
npm ci --workspaces=false
npm test
npm run build
```

The production build creates `dist/user-administration-ui.zip` for the MTA application-content module. Building does not deploy the app or update XSUAA/HANA.
