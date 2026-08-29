# Knowledge: `scripts/qa/test-user-admin-operations-audit.js`

## N5-Lite coverage / Coverage N5-Lite

English: focused QA proves authorization precedes Digest reads, a concrete type reads only the Digest table, mixed `ALL` includes all three sources, recipient masking is preserved, forbidden snapshot/provider/lock fields are absent, and manual Digest retry is disabled.

Tiếng Việt: QA focused chứng minh authorization chạy trước read Digest, filter concrete chỉ đọc bảng Digest, `ALL` gồm đủ ba source, recipient vẫn mask, field snapshot/provider/lock bị loại và retry Digest thủ công bị tắt.

## English / Tiếng Việt

The Gate 6 programmatic contract is a source-level and in-memory behavior guard for safe operational visibility. It verifies the CDS DTO/action surface, default/max page clamping, stable safe mapping, masked recipient/actor/target display, 12-character correlation fingerprinting, persisted-state readiness, PM/UserAdmin authorization, exact retry eligibility, optimistic `modifiedAt`, fixed attempt ceiling, lock rejection, atomic reset plus audit, preservation of delivery history, and post-commit immediate-kick registration.

Contract programmatic Gate 6 là guard source-level và behavior in-memory cho operational visibility an toàn. Test kiểm tra DTO/action CDS, clamp page default/max, mapping safe ổn định, mask recipient/actor/target, correlation fingerprint 12 ký tự, readiness chỉ từ state đã persist, authorization PM/UserAdmin, retry eligibility exact, optimistic `modifiedAt`, attempt ceiling cố định, reject lock, reset atomic kèm audit, giữ delivery history và đăng ký immediate-kick sau commit.

The fixture may contain raw persistence-shaped values only in memory so forbidden-field behavior can be tested; it does not persist, print, or return those values. It must remain a focused programmatic suite and must not be replaced by root `npm test`.

Fixture có thể chứa raw persistence-shaped value chỉ trong memory để test forbidden-field behavior; fixture không persist, print hoặc return các value đó. Suite phải giữ focused programmatic và không thay bằng root `npm test`.

**Safe editing:** Every new safe DTO field needs an explicit assertion and a matching UI/knowledge update. Any provider outage or email retry scenario must use deterministic in-memory fixtures; do not manufacture a live outage or call a provider.

**Sửa an toàn:** Field safe DTO mới phải có assertion explicit và cập nhật UI/knowledge tương ứng. Scenario provider outage hoặc email retry phải dùng fixture deterministic in-memory; không tạo outage live hoặc gọi provider.
