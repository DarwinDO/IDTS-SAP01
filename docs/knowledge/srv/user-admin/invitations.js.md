# Knowledge: `srv/user-admin/invitations.js`

Invitation tokens contain a bounded invitation ID, normalized email, expiry, and random nonce, signed with HMAC-SHA256. The database keeps the nonce and SHA-256 token hash; the signing key remains private configuration and the raw token exists only transiently for the provider message and callback.

The public CAP action and parser both cap the token at 2,048 characters before decoding. Verification compares both signature and stored hash with timing-safe comparison, then checks persisted payload fields, expiry, replay state, and the authenticated SAP identity snapshot. The immutable candidate is `(origin, issuer, subject)`; email is checked for invitation ownership but remains a mutable attribute.
## Gate 3B normalizer reuse / Tai su dung normalizer Gate 3B

The existing `normalizeEmail` helper is exported and reused by the existing-user link handler. This keeps invitation email normalization identical across normal onboarding and legacy identity-link requests; no second parser or mutable-email identity fallback is introduced.

Helper `normalizeEmail` hien co duoc export va dung lai trong handler link identity hien huu. Nho do normal onboarding va request link legacy dung cung mot quy tac normalize email; khong co parser thu hai hay fallback identity theo email mutable.
