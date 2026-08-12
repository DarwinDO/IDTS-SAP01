# Knowledge: `app/user-administration-ui`

`idts.useradministrationui` is the standalone SAPUI5 administration surface for controlled IDTS onboarding. The responsive table uses the protected `searchOnboarding` POST action, normalizes the query to lowercase, and shows at most 200 request summaries containing the requested business role, optional PM-only UserAdmin overlay, lifecycle status, expiry, and sanitized delivery failure summary. The search value is carried in a POST body instead of an OData `$filter` URL, reducing email exposure in browser/proxy access logs.

The invite dialog submits the unbound OData V4 `requestOnboarding` action with `email`, exactly one allowlisted `requestedRole`, and `userAdminRequested`. The checkbox is disabled outside PM and is cleared when the role changes away from PM. Invalid email receives an accessible inline value state. Submit and cancel controls are locked while the action is pending, and the controller rejects a second invocation. This UI behavior is only guidance; `srv/user-admin.js` remains the authoritative authorization and validation layer.

The HTML5 application's `xs-app.json` requires the `$XSAPPNAME.UserAdmin` scope for both static application entry and the OData route. CAP additionally requires exactly one PM business role and a matching active internal PM, so direct API calls and stale/non-PM sessions still fail closed. The UI never displays raw provider responses, credentials, invitation tokens, issuer values, or identity subjects.

Vietnamese: Day la app SAPUI5 rieng cho PM duoc gan capability UserAdmin. Man hinh chi tao invitation va theo doi trang thai onboarding an toan; khong truc tiep tao SAP ID, gan Role Collection, kich hoat Users, hay giu credential quan tri SAP.

## Verification

- `npm run qa:user-admin-ui:programmatic`
- `npm --prefix app/user-administration-ui test`
- `npm --prefix app/user-administration-ui run build`
- UI5 MCP manifest validation and linter

Live browser, XSUAA scope deployment, Role Collection assignment, HANA migration, identity reconciliation, revoke, and stale-session acceptance remain later controlled gates.
