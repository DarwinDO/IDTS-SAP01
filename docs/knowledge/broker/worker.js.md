# Knowledge: `broker/worker.js`

## English

`processOneAccessOperation` maps `PROVISION` to the existing `ASSIGN` action and maps `LINK_EXISTING` explicitly to the read-only broker action. The provider factory receives only the verified identity snapshot needed for the allowlisted call. A successful link reports the existing safe `NOOP_ALREADY_DESIRED`/`ROLE_COLLECTIONS_VERIFIED` result; raw provider data is never forwarded.

## Tiếng Việt

`processOneAccessOperation` map `PROVISION` sang action `ASSIGN` hiện có và map rõ `LINK_EXISTING` sang action broker chỉ đọc. Provider factory chỉ nhận identity snapshot đã verify cần cho call allowlist. Link thành công dùng result an toàn `NOOP_ALREADY_DESIRED`/`ROLE_COLLECTIONS_VERIFIED`; raw provider data không bao giờ được forward.

### Important source anchor

- **Location**: `broker/worker.js:26` `brokerActionFor(...)`
  **IDTS concept**: Separates identity-link proof from provider mutations.
  **Impact if broken**: A link could accidentally assign/change/revoke Role Collections.
  **Must check together**: `broker/lib/access-provisioning.js` and `scripts/qa/test-user-access-broker-runtime.js`.
