# Knowledge: `srv/user-admin/invitations.js`

Invitation tokens contain a bounded invitation ID, normalized email, expiry, and random nonce, signed with HMAC-SHA256. The database keeps the nonce and SHA-256 token hash; the signing key remains private configuration and the raw token exists only transiently for the provider message and callback.

The public CAP action and parser both cap the token at 2,048 characters before decoding. Verification compares both signature and stored hash with timing-safe comparison, then checks persisted payload fields, expiry, replay state, and the authenticated SAP identity snapshot. The immutable candidate is `(origin, issuer, subject)`; email is checked for invitation ownership but remains a mutable attribute.
