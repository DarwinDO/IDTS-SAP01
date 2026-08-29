# N5-Lite rollout acceptance — 2026-08-29

## English

### Integrated source

- Source PR: #368, `FE: Add read-only Digest delivery diagnostics`.
- Final feature head: `f286909fafc521bb181df8e8c3c928fc85a0d663`.
- Merge commit on `dev`: `68f9cba580e4e5e69425ec02ab1b4361468fbb46`.
- The final source change keeps Digest diagnostics read-only in the existing User Administration Operations table, caps privileged search work at 20,000 candidate rows per request and returns `DIGEST_SEARCH_TOO_BROAD` instead of scanning without a ceiling.
- Sealed exact-source Codex Security scan `d6540079-0847-4d38-a3a4-63d0e187bdbc` reported complete coverage and zero reportable findings. The TAC advisory connector was unavailable.

### Artifact and deployment

- Exact detached rollout worktree HEAD: `68f9cba580e4e5e69425ec02ab1b4361468fbb46`.
- MTAR: `idts-sap01-n5-lite-68f9cba5.mtar`, 34,270,688 bytes.
- MTAR SHA-256: `6F6F0D1FC8661DF9FADA3A218A6731FEF631C23E4F9265ECE9039B783B0A8590`.
- Archive inspection proved non-empty `idts-sap01-srv/data.zip` (28,280,586 bytes), `idts-sap01-app-content/app/data.zip` (360,276 bytes), and the packaged `operations-audit.js` contained `MAX_DIGEST_SEARCH_ROWS = 20000` plus `DIGEST_SEARCH_TOO_BROAD`.
- Cloud Foundry target: org `f5648117trial`, space `dev`, region `ap21`.
- Selective MTA operation: `683d4429-a376-11f1-833b-eeee0a8315a1`.
- Selected modules: `idts-sap01-srv` and `idts-sap01-app-content` only. `idts-sap01-db-deployer` and AppRouter were not selected. The MTA controller updated/rebound the selected service module's declared bindings; it did not run an HDI/schema deployment, migration or seed.
- Completion readback: CAP `STARTED` `1/1`, AppRouter `STARTED` `1/1`, and no active MTA operation.

### Runtime and UI acceptance

- Final `npm run btp:demo:check`: CAP `1/1`; AppRouter `1/1`; `/health` `200`; `/ready` `200`; anonymous `/odata/v4/auth/me` `401` as expected; Web `200`; `DEMO READY`.
- Signed-in Edge Browser Control opened User Administration from the deployed AppRouter. Operations → Delivery displayed the new `Type` and `Event` columns and offered `Daily digest` in the delivery-type filter.
- Selecting `Daily digest` returned `No deliveries match this filter`. A full reload followed by repeating the navigation/filter succeeded, and browser warning/error logs remained empty.
- Because no live Digest delivery existed, row-detail masking and absence of Retry were not asserted from fabricated runtime data. The focused backend/UI contracts and exact packaged source remain the evidence for safe fields, allowlisted errors and `canRetry=false`.
- Acceptance did not create a notification, Digest delivery, email, scheduler run, Bug change, user/role change or other business-data mutation.

### Closure

N5-Lite is live and closed. Manual Digest retry, automated retention deletion and N6 are not opened by this rollout. A natural future Digest row may be inspected read-only as an operational observation, but it is not a blocker for N5-Lite closure.

## Tiếng Việt

### Source đã tích hợp

- Source PR: #368, `FE: Add read-only Digest delivery diagnostics`.
- Feature head cuối: `f286909fafc521bb181df8e8c3c928fc85a0d663`.
- Merge commit trên `dev`: `68f9cba580e4e5e69425ec02ab1b4361468fbb46`.
- Thay đổi cuối giữ diagnostic Digest read-only trong bảng Operations User Administration hiện có, cap search đặc quyền ở 20.000 candidate row mỗi request và trả `DIGEST_SEARCH_TOO_BROAD` thay vì scan không giới hạn.
- Codex Security scan exact-source đã seal `d6540079-0847-4d38-a3a4-63d0e187bdbc` báo coverage complete và zero reportable finding. Connector TAC advisory không khả dụng.

### Artifact và deployment

- HEAD rollout worktree detached chính xác: `68f9cba580e4e5e69425ec02ab1b4361468fbb46`.
- MTAR: `idts-sap01-n5-lite-68f9cba5.mtar`, 34.270.688 byte.
- SHA-256 MTAR: `6F6F0D1FC8661DF9FADA3A218A6731FEF631C23E4F9265ECE9039B783B0A8590`.
- Kiểm archive xác nhận `idts-sap01-srv/data.zip` không rỗng (28.280.586 byte), `idts-sap01-app-content/app/data.zip` không rỗng (360.276 byte), và `operations-audit.js` đã package có `MAX_DIGEST_SEARCH_ROWS = 20000` cùng `DIGEST_SEARCH_TOO_BROAD`.
- Cloud Foundry target: org `f5648117trial`, space `dev`, region `ap21`.
- Operation MTA chọn lọc: `683d4429-a376-11f1-833b-eeee0a8315a1`.
- Chỉ chọn module `idts-sap01-srv` và `idts-sap01-app-content`. Không chọn `idts-sap01-db-deployer` hoặc AppRouter. MTA controller cập nhật/rebind các binding khai báo của module service được chọn; không chạy HDI/schema deploy, migration hoặc seed.
- Readback hoàn tất: CAP `STARTED` `1/1`, AppRouter `STARTED` `1/1`, không có MTA operation active.

### Acceptance runtime và UI

- `npm run btp:demo:check` cuối: CAP `1/1`; AppRouter `1/1`; `/health` `200`; `/ready` `200`; `/odata/v4/auth/me` anonymous trả `401` đúng kỳ vọng; Web `200`; `DEMO READY`.
- Edge Browser Control đã đăng nhập mở User Administration từ AppRouter deployed. Operations → Delivery hiển thị cột `Type`, `Event` và có `Daily digest` trong filter delivery type.
- Chọn `Daily digest` trả `No deliveries match this filter`. Reload toàn trang rồi điều hướng/lọc lại thành công; browser log không có warning/error.
- Vì live chưa có Digest delivery, không claim masking detail và việc không có Retry bằng dữ liệu runtime giả. Contract backend/UI focused cùng source exact đã package là evidence cho field an toàn, error allowlist và `canRetry=false`.
- Acceptance không tạo notification, Digest delivery, email, scheduler run, thay đổi Bug, user/role hoặc business data khác.

### Đóng gate

N5-Lite đã live và đóng. Retry Digest thủ công, xóa retention tự động và N6 không được mở bởi rollout này. Có thể kiểm tra read-only một row Digest phát sinh tự nhiên trong tương lai như observation vận hành, nhưng đó không phải blocker đóng N5-Lite.
