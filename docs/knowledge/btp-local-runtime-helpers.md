# BTP local runtime helpers

## English

### Purpose

The repository provides two small PowerShell helpers behind npm commands:

- `npm run btp:login:sso` renews the Cloud Foundry CLI session through SAP's temporary SSO passcode page. The passcode is read from the clipboard, passed to `cf login --sso`, then cleared. It is never written to a repository file or printed.
- `npm run dev:ai:preflight:btp` checks that the current CF target can read the `idts-sap01-ai-gateway` binding on `idts-sap01-srv`. It confirms only that a credential is available in process memory; it sends no AI request.
- `npm run dev:ai:watch:btp` starts the existing `watch-bug-management-ui` command with the real BTP AI Gateway configuration injected only into the child PowerShell process.

### Execution flow

`scripts/dev/run-cds-watch-real-ai.ps1` derives the repository root from its own location, so it is not tied to `E:\IDTS-SAP01`. It uses `cf app ... --guid` and `cf curl /v3/apps/<guid>/env` to read the existing service binding. It selects only the named AI binding and recognizes the supported gateway-key field names.

Full mode saves the previous process-level AI variables, applies the runtime aliases, launches the existing CDS watch npm script, and restores every previous value in `finally`. The credential and runtime configuration are cleared from script variables before exit. This helper does not deploy, bind, migrate, seed, start BTP apps, or persist configuration.

### Safe use

1. Run `npm run btp:login:sso` if the CF CLI session has expired, and copy only the temporary code from SAP's passcode page.
2. Run `npm run dev:ai:preflight:btp`. Expect `IDTS_REAL_AI_WATCH=PREFLIGHT_READY` and `AI_REQUEST_SENT=false`.
3. Run `npm run dev:ai:watch:btp` in a JavaScript Debug Terminal when breakpoints must attach to the local Node.js process.
4. Trigger an AI feature from the local UI only when a real provider request is intended. Preflight alone does not prove that a provider request succeeded.

Never print or inspect the gateway key, raw `VCAP_SERVICES`, authorization headers, CF tokens, passwords, or temporary SSO codes. Local Smart Assign testing also requires a separately prepared local identity fixture; this helper does not create users or change business data.

## Tiếng Việt

### Mục đích

Repository cung cấp hai helper PowerShell nhỏ thông qua các lệnh npm:

- `npm run btp:login:sso` làm mới phiên Cloud Foundry CLI qua trang mã SSO tạm thời của SAP. Mã được đọc từ clipboard, truyền vào `cf login --sso`, rồi bị xóa. Mã không được ghi vào file trong repository và không được in ra màn hình.
- `npm run dev:ai:preflight:btp` kiểm tra CF target hiện tại có đọc được binding `idts-sap01-ai-gateway` của `idts-sap01-srv` hay không. Lệnh chỉ xác nhận credential tồn tại trong bộ nhớ process; không gửi AI request.
- `npm run dev:ai:watch:btp` chạy lệnh `watch-bug-management-ui` hiện có, đồng thời đưa cấu hình AI Gateway thật trên BTP vào riêng process PowerShell con.

### Luồng chạy

`scripts/dev/run-cds-watch-real-ai.ps1` tự suy ra thư mục gốc repository từ vị trí của script, nên không bị khóa vào đường dẫn `E:\IDTS-SAP01`. Script dùng `cf app ... --guid` và `cf curl /v3/apps/<guid>/env` để đọc service binding hiện có. Nó chỉ chọn đúng AI binding theo tên và chỉ nhận các tên field gateway key được hỗ trợ.

Ở chế độ đầy đủ, script lưu các biến AI cấp process trước đó, áp dụng các runtime alias, khởi động npm script CDS watch hiện có, rồi khôi phục mọi giá trị cũ trong `finally`. Credential và runtime configuration được xóa khỏi biến script trước khi thoát. Helper này không deploy, bind, migrate, seed, start ứng dụng BTP hoặc lưu cấu hình xuống file.

### Cách dùng an toàn

1. Chạy `npm run btp:login:sso` nếu phiên CF CLI đã hết hạn, rồi chỉ copy mã tạm thời từ trang passcode của SAP.
2. Chạy `npm run dev:ai:preflight:btp`. Kết quả mong đợi là `IDTS_REAL_AI_WATCH=PREFLIGHT_READY` và `AI_REQUEST_SENT=false`.
3. Chạy `npm run dev:ai:watch:btp` trong JavaScript Debug Terminal nếu cần breakpoint bắt đúng process Node.js local.
4. Chỉ kích hoạt chức năng AI trên UI local khi thật sự muốn gửi provider request. Preflight không phải bằng chứng rằng provider request đã thành công.

Không in hoặc inspect gateway key, `VCAP_SERVICES` thô, authorization header, CF token, password hoặc mã SSO tạm thời. Test Smart Assign local còn cần local identity fixture được chuẩn bị riêng; helper này không tạo user và không thay đổi dữ liệu nghiệp vụ.
