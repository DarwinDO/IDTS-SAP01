# Knowledge: `scripts/qa/test-provisioning-broker-programmatic.js`

## English / Tiếng Việt

The provisioning-broker fixture covers the existing standard lifecycle plus a `LINK_EXISTING` operation. The link case snapshots the exact User ID, display name, role, active state, password hash, Developer Profile, responsibilities, and cross-target same-email race. It proves only one target wins, the loser remains legacy/unlinked, and request/operation/audit finalize safely. Fixture execution requires the locked CAP runtime.

Fixture provisioning-broker cover lifecycle chuẩn hiện có và operation `LINK_EXISTING`. Case link snapshot User ID, display name, role, active, password hash, Developer Profile, responsibility và race cùng email cross-target; chứng minh chỉ một target thắng, loser vẫn legacy/unlinked, request/operation/audit finalize an toàn. Fixture cần CAP runtime locked.
