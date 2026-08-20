# Validated XSUAA identity extraction

`srv/auth/validated-xsuaa-identity.js` reads the immutable SAP identity tuple only from the token already validated by CAP/XSUAA middleware:

- origin: `req.user.authInfo.token.origin`;
- issuer: `req.user.authInfo.token.issuer`;
- subject: `req.user.authInfo.token.payload.user_uuid`.

For the separate provisioning target only, the helper also reads `req.user.authInfo.token.payload.user_id`. SAP documents `user_uuid` as the cross-layer Global User ID and shows that it can differ from XSUAA `userId`; the User Management SCIM API addresses a shadow user by that SCIM/XSUAA user ID. IDTS therefore never substitutes one identifier for the other:

- `user_uuid` remains part of the immutable IDTS identity hash;
- `user_id` selects the exact SCIM shadow-user resource for Role Collection membership;
- both must come from the CAP/XSUAA-validated token before provisioning can be approved.

It never decodes the Authorization header and never falls back to the xssec `token.userId` convenience getter, `sub`, email, display name, or `req.user.id`. Missing or invalid tuple members fail closed. Email remains a mutable profile attribute and is not identity authority.
