# Knowledge: `srv/auth/identity-map.js`

This helper derives the external identity key from provider origin, issuer, and the pinned `user_uuid` subject claim, then compares its SHA-256 hash for fast unique matching. The bounded original fields are retained privately for controlled audit/reconciliation. In XSUAA runtime, any incomplete tuple fails closed. Mutable ID/email candidates remain only for confirmed local/custom-auth requests; display name is never an authority candidate.

If a request contains complete external identity claims and its hash does not match, a matching email cannot take over either a linked or unlinked row. Local/custom-auth requests without external identity claims retain the existing internal-ID/email behavior. The public `BugService.Users` projection does not expose the origin, issuer, subject, or hash fields.

Vietnamese: XSUAA request chi map bang hash cua origin + issuer + `user_uuid` va fail closed neu thieu/khong match; khong tu chuyen sang `sub`, `req.user.id`, email hay name. ID/email chi dung cho runtime local/custom-auth da xac nhan. Source nay khong backfill hay migrate HANA; pilot van phai chung minh tenant live co `user_uuid` on dinh.
