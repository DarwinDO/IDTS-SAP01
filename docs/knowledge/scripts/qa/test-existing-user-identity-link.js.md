# Knowledge: `scripts/qa/test-existing-user-identity-link.js`

## English

The Gate 3B focused fixture defines the request, immutable verification, read-only provider, atomic same-row completion, preservation, readiness, privacy, collision, invalid-email, concurrent-link, exact-correlation mismatch, retry, reconcile, and expired-lease recovery contracts. Recovery fixtures assert request/operation correlation equality before a subsequent exact `LINK_EXISTING` completion; they use only ephemeral SQLite when CAP dependencies are available and treat missing locked dependencies as an environment blocker rather than a runtime PASS.

## Tiếng Việt

Fixture focused Gate 3B định nghĩa contract request, verify immutable, provider read-only, completion cùng row, preservation, readiness, privacy, collision, email invalid, concurrent link, mismatch correlation exact, retry, reconcile và recovery lease hết hạn. Fixture assert correlation request/operation bằng nhau trước completion `LINK_EXISTING` tiếp theo; chỉ dùng SQLite ephemeral khi dependency CAP có sẵn và ghi thiếu dependency locked là blocker môi trường, không claim runtime PASS.
