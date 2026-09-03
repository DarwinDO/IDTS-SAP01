# Gate 7 Profile and Notification — Live Rollout Evidence

## Frozen integration state

- Source PR `#376` merged into `dev` at `6c9ae2c9bcb5b64876493b75c4cd66b7e9c50270`.
- Cache-identity PR `#377` merged into `dev` at `cff43a0146bfa3a9b4e122e0203bc7076ebca8be`.
- Released identities: User Administration `1.0.20`; Bug Management `0.0.8`.
- Both GitHub QA Depth checks succeeded before merge.

## HANA migration

- A broad simulation was rejected because it included unrelated table-data and dependent artifacts; no real make followed that candidate.
- The accepted simulation and real make used exactly two direct deploy inputs: `idts.cap.UserOnboardingRequests.hdbtable` and `idts.cap.UserIdentityAuditEvents.hdbtable`.
- Accepted simulation and migration each reported: two files deployed, zero undeployed, zero warnings, and five automatically redeployed dependents.
- Migration task `gate7-hdi-migrate` completed successfully. Fast migration added nullable `requestedDisplayName` and the three nullable structured display-name audit fields; no CSV, seed, backfill, provider call, invitation, or historical audit replay was submitted.

## Selective application rollout

- CAP used the generated Node `22.x` package. It was staged as a CAP-owned droplet and assigned to the existing `idts-sap01-srv` app without changing its route or seven service bindings. Final droplet: `250a8a7e-4b57-4f58-a8ce-f808abc3bb43`.
- UI artifact `idts-gate7-ui-cff43a01.mtar` was 363,279 bytes with SHA-256 `100F5D047F93FEC743CA7D83360841BC39464846EB187985B8A36F1659E5BC95`.
- Deep archive inspection found six outer entries, exactly one content module and zero CAP, DB deployer, AppRouter, or `node_modules` entry.
- Content operation `04f5409a-a780-11f1-866f-eeee0a815b5e` finished successfully and skipped service deletion. No active MTA operation remained.

## Live acceptance

- Final check returned CAP/AppRouter `1/1`, liveness `200`, DB readiness `200`, anonymous protected API `401`, Web `200`, and `DEMO READY`.
- Edge browser control, using the existing authenticated DonHV PM + UserAdmin session, verified:
  - My Notifications opens with separate Read state and Category controls plus the native empty-state strip/list; no notification or read-state mutation was submitted.
  - Invite User exposes required Display name, Email and Business Role fields; Send Invitation remained disabled and no invitation was sent.
  - Active user details for the existing Developer exposes a distinct Edit user information action.
  - The edit dialog contains only Display name and required change reason; Save remained disabled and no profile data was changed.
- Existing SAPUI5/LRep/S-CUBE/deprecated-module/future-fatal console debt remained. A transient unread-count `401` appeared during the first CAP-restart bootstrap, while the subsequently reloaded authenticated screens and bounded UI flows rendered. No HTTP `5xx`, JavaScript TypeError from Gate 7 source, failed dialog load, provider call, email, or business-data mutation was observed.

## Final mutation boundary

- Performed: two PR merges, one additive two-table HDI make, one CAP droplet replacement/restart, and one UI content operation.
- Not performed: login-email mutation, SAP Universal ID/IAS update, user role/access/profile save, invitation send, notification/read mutation, email send, seed/backfill, AppRouter/XSUAA/provider/scheduler configuration change, or Bug workflow mutation.
- Both stopped no-route staging helpers were removed after the HDI binding disappeared; the production CAP/DB/AppRouter bindings and routes remained intact.

## Vietnamese summary

Gate 7 đã merge và rollout live. Migration HANA chỉ deploy trực tiếp hai bảng cần thêm field nullable, zero undeploy/zero warning; CAP giữ nguyên route/binding; content UI dùng artifact đã kiểm hash và không chứa CAP/DB/AppRouter. Browser Edge xác nhận UI Notification mới, Display name khi Invite và dialog sửa Display name cho UserAdmin, nhưng không bấm Save/Send nên không đổi dữ liệu user hay gửi email. Readiness cuối là `DEMO READY`.
