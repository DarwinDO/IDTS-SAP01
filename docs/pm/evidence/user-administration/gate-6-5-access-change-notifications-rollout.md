# WP8 Gate 6.5 — Later Rollout and Rollback Plan

## Purpose

This is a later-approval plan, not execution evidence. Gate 6.5 source documentation does not authorize any operation below. Never backfill, queue, or send email for historical `UserIdentityAuditEvents`.

## Ordered approval gates

1. **Source review and merge.** Obtain one bounded independent exact-head review with no unresolved Critical, Major, or Important finding; then separately authorize the Draft PR, CI readback, merge, and final merged SHA. No runtime mutation during this gate.
2. **Encrypted backup plus HANA simulation/restore proof.** Before any schema action, take an encrypted, checksum-recorded logical backup using approved credentials outside the repository; prove restore in an isolated approved target, preserving row counts/digests and without exposing raw identities, emails, content, credentials, or provider data. Re-run the generated-artifact comparison against the merged source and reject any changed/removed existing artifact, table data, seed, procedure, or unrelated artifact.
3. **One additive migration.** With explicit DonHV approval and an exact before-state, run only the checksum-reviewed migration that adds `UserAccessNotificationDeliveries` and its unique `sourceAuditEvent` index. Precheck that the objects are absent and no existing table/data/index is changed; read back the exact objects and capture rollback inputs. No seed, CSV, historical audit replay, or DML backfill is allowed.
4. **Selective CAP and UI deployment.** Package only the merged CAP/UI source after scope/hash inspection. Do not deploy an HDI module again, AppRouter, XSUAA, provider binding, scheduler configuration, route, or unrelated component. Verify protected API behavior, app health, and the User Administration `1.0.17` content identity separately.
5. **Controlled `APPLIED` acceptance.** Use one separately approved, eligible non-historical access change. Prove the final audit is exactly `APPLIED` with an allowlisted action, exactly one delivery exists, its recipient is masked in all committed evidence, and no delivery is created for NOOP/queued/failure/linking/responsibility cases. Do not reveal body, raw recipient, audit ID, lock, provider response, token, credential, or endpoint.
6. **Unified Operations acceptance.** As PM + UserAdmin, verify the one table/filter/details/retry flow, bounded paging, recipient masking, exact-type retry, and persisted reload. Verify unauthorized/unknown-type/stale-lock/permanent-error paths fail closed. Browser evidence must not submit an unapproved retry or expose private data.
7. **Final readiness and rollback decision.** Read readiness after controlled evidence: recent `SENT` precedes recent `FAILED`; otherwise report `UNKNOWN`, never invented availability. Capture health/ready/auth/web separately. If acceptance fails, stop further sends, preserve evidence, use the approved rollback path, and do not delete delivery/audit history or schema objects casually.

## Hard stops

- Any comparison difference outside the two approved compiler additions.
- Existing row/index/table change, `.hdbtabledata`, CSV, seed, procedure, destructive conversion, or unknown migration input.
- Any attempted historical backfill, email replay, unmasked private value, provider/configuration mutation outside approval, or failure to restore the encrypted backup rehearsal.
- A Critical, Major, or Important source-review finding, unavailable explicit approval, or a failed precondition/readback.

## Vietnamese summary

Đây là plan cho approval sau, không phải bằng chứng đã thực thi. Trước hết phải review/merge source riêng. Sau đó mới được approval backup mã hóa và restore rehearsal, simulation HANA additive, đúng một migration đã checksum, deploy chọn lọc CAP/UI, một acceptance `APPLIED` không lịch sử, acceptance Operations hợp nhất, rồi readiness/rollback. Không bao giờ backfill, queue hoặc gửi email cho `UserIdentityAuditEvents` lịch sử. Bất kỳ artifact ngoài hai artifact compiler được duyệt, thay đổi dữ liệu/index/table cũ, seed/CSV/procedure, private data lộ ra, source finding nghiêm trọng hoặc thiếu approval/readback đều là hard stop.

## 2026-08-26 controlled rollout evidence

### Frozen source and artifacts

- Merged source and `origin/dev`: `e587aa5b1603d32c89ce01b4bcab9854f07eb157`.
- Rollout tooling branch/head: `chore/wp8-gate65-rollout-donhv` / `50ed57b7615937e8c9428c4d8b21fefb66899484`.
- Baseline/candidate HANA comparison: `60 / 62` artifacts, removed `0`, changed existing `0`, added exactly `2`.
- Added table SHA-256: `0A4D1DB155FC8B88C010599BFA7A74CA4B9477A557723B36AFA5C314EFB65FB3`.
- Added unique-index SHA-256: `2E90ED61A394260002841526D4F9035A4E498F11316BBC8CD4A959518368E370`.
- Eligible HDI recovery/migration R2 ZIP SHA-256: `D595397428C85ACFBB0E52A1783023BB142E88911C1231B2B9AE479DA4116085`; 11 entries; forbidden/private/CSV/`.hdbtabledata`/seed/`node_modules` count `0`.
- Eligible CAP R2 ZIP SHA-256: `D9317122716D45830AB2B63B0818E6FBE665566E70B0FFAA56530E2B0534EE6C`; Node `22.x`; DB/HDI/private/`node_modules` count `0`; changed CAP file hashes match generated source.
- Dedicated UI MTAR SHA-256: `560FFE01FED9BD0C3E2CD74FF99E930191CCB7BE5CCDE3924C15A76C96286473`; one application-content module, one existing HTML5 host, Bug UI `0.0.6`, User Administration UI `1.0.17`, no CAP/HDI/AppRouter/XSUAA module.

### Recovery and additive migration

- Initial expired CF token was recovered through the reviewed clipboard-to-stdin SSO helper; the temporary code was never printed or persisted and the clipboard was overwritten in `finally`.
- Check-first readiness found only DB readiness `503`; the approved prepare path ran once, requested the supported HANA start, and a fresh independent check returned `DEMO READY`. No schema or seed action occurred in prepare.
- Pre-state aggregate counts were Users `16`, User Identity Audit Events `28`, User Onboarding Deliveries `10`; the access-delivery table was absent.
- Encrypted logical backup/temporary-table restore rehearsal passed for all 16 Users. Pre and post canonical digest prefix remained `6e6f90976a63`. The encrypted envelopes and DPAPI-protected private key are outside Git; no raw row, email, credential or plaintext key entered committed evidence.
- One HDI simulation task succeeded with exact working/deploy set `2`, warnings `0`, undeployed `0`, dependent redeploy `0`, and no CSV/`.hdbtabledata`/seed. A log classifier initially counted HDI's excluded-deleted-file listing; task-scoped `Adding/Deploying` and exact make summary proved only the two approved artifacts were scheduled.
- One real HDI migration task succeeded. Post-state preserved `16 / 28 / 10`, created the access-delivery table with `0` rows, and retained the same encrypted Users digest. Schema rollback attempts were `0`.
- The stopped/no-route temporary app ran seven terminal tasks, was unbound once, and was deleted once. It had no remaining binding, route, task or app state after cleanup.

### Selective CAP and UI rollout

- CAP R1 staging failed before cutover because direct packaging omitted the repository's generated Node-engine pin and the buildpack rejected `>=20 <23`. The current droplet remained unchanged. The existing pin contract passed, CAP R2 used exact `22.x`, then package upload/stage/set-owned-droplet/restart each ran once and succeeded. Rollback attempts were `0`.
- CAP retained one route and seven bindings and reached `1/1`. AppRouter was not deployed and retained one route, three bindings and `1/1`.
- One content-only MultiApps operation deployed only `idts-user-admin-ui-r3c-content`, did not delete services, and finished successfully. Active MTA operations after deployment were `0`.
- Fresh final check returned CAP `1/1`, AppRouter `1/1`, liveness `200`, DB readiness `200`, anonymous protected API `401`, Web `200`, and `DEMO READY`.

### Acceptance boundary

- Automated source, artifact, migration and runtime-readiness evidence is complete.
- Browser acceptance initially stopped at SAP Sign In without entering a login identifier, password, OTP, cookie, or token. DonHV later authenticated directly and explicitly approved the bounded Tester scenario recorded below.
- No Operations retry, historical replay, role change, permanent provider configuration change, or raw-recipient evidence was produced.

### Controlled live acceptance closure — 2026-08-27

- DonHV explicitly approved one bounded Suspend -> Reactivate cycle for the existing Tester account `donhvse`; committed evidence retains only the masked recipient `d***@fpt.edu.vn`.
- Suspend completed and produced exactly one Access change delivery. Operations showed state `Sent`, attempts `1`, and the Gmail mailbox readback confirmed one `[IDTS] Your access suspended` message in Inbox. No message body, raw audit identifier, provider response, token, credential, or endpoint is committed here.
- The access broker was found stopped while Reactivate was pending. It was started once and reached `1/1`; the same Reactivate operation then completed with attempts `1`. Its details reported that the assigned role collections were verified, so the external provider was already at the desired state. Consistent with the approved `NOOP_ALREADY_DESIRED` exclusion, no Reactivate delivery was added and Gmail search found no `[IDTS] Your access reactivated` message.
- Final User Administration readback showed the Tester restored to `Active`, identity link `Yes`, and pending operation `None`. Operations reported email delivery `Available`, provisioning broker `Recent success`, and the latest successful reconciliation timestamp. No role change, retry/replay, historical backfill, permanent provider configuration change, or extra email was submitted.
- The runtime acceptance therefore passes the Gate 6.5 contract: one eligible applied transition produced one persisted delivery and one email; the provider-verification no-op produced neither. A separate real provider-side state transition would be required to test the Reactivated email template and is not authorized by this acceptance.
