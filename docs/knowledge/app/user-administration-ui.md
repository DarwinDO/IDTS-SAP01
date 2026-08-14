# Knowledge: `app/user-administration-ui`

`idts.useradministrationui` is the standalone SAPUI5 administration surface for controlled IDTS onboarding. The responsive table uses the protected `searchOnboarding` POST action, normalizes the query to lowercase, and shows at most 200 request summaries containing the requested business role, optional PM-only UserAdmin overlay, lifecycle status, expiry, and sanitized delivery failure summary. The search value is carried in a POST body instead of an OData `$filter` URL, reducing email exposure in browser/proxy access logs.

The invite dialog submits the unbound OData V4 `requestOnboarding` action with `email`, exactly one allowlisted `requestedRole`, and `userAdminRequested`. After identity verification the table exposes confirmation-gated Approve & Provision, Change Role, Revoke Access, and Retry actions only for their matching states. Role change/revoke require a reason; revoke uses destructive emphasis. The UI never calls the broker or BTP API directly and never announces `ACTIVE` merely because an operation was queued. `srv/user-admin.js` remains the authoritative authorization, state and optimistic-version boundary.

The HTML5 application's `xs-app.json` requires the `$XSAPPNAME.UserAdmin` scope for both static application entry and the OData route. CAP additionally requires exactly one PM business role and a matching active internal PM, so direct API calls and stale/non-PM sessions still fail closed. The UI never displays raw provider responses, credentials, invitation tokens, issuer values, or identity subjects.

Vietnamese: Day la app SAPUI5 rieng cho PM duoc gan capability UserAdmin. Man hinh moi, approve, doi role va revoke qua CAP. Retry chi hien cho loi tam thoi; Reconcile chi hien cho ket qua provider mo ho va co confirmation rieng. UI khong goi BTP API truc tiep va khong giu credential. `ACTIVE` chi hien sau khi broker readback thanh cong. Real SAP adapter van chua live trong source-candidate.

## Verification

- `npm run qa:user-admin-ui:programmatic`
- `npm --prefix app/user-administration-ui test`
- `npm --prefix app/user-administration-ui run build`
- UI5 MCP manifest validation and linter

Live browser, XSUAA scope deployment, real Role Collection assignment, HANA migration, provider reconciliation, revoke, and stale-session acceptance remain later controlled gates.
