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
