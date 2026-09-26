# Knowledge: `app/router/resources/onboarding/onboarding-page.mjs`

The onboarding handoff deliberately uses two small AppRouter pages. The public `/onboarding/continue` page reads the signed invitation from the URL fragment, stores it only in browser `sessionStorage`, removes the fragment from the visible URL, and navigates to the XSUAA-protected `/onboarding/authenticate` page. The protected page fetches a CSRF token and POSTs the bounded invitation to `UserAdministrationService.verifySapIdentity`.

The token is never placed in a query string, referrer, application log, HTML, or persistent browser storage. Both pages use no-store caching, a no-referrer policy, a restrictive CSP, external script/style files, semantic status messages, and no password fields. Provider/CAP error bodies are not displayed; status codes map to allowlisted user messages.

Vietnamese: Trang public chi nhan token tu fragment, luu tam trong `sessionStorage`, xoa fragment roi chuyen qua route XSUAA. Trang da authenticate moi POST token bang CSRF toi CAP. UI khong hoi password/OTP/passkey va khong hien raw provider error.

## Post-verification SAP session refresh / Làm mới SAP session sau xác minh

### English

Successful identity verification means provisioning has started; it does not mean the current XSUAA JWT already contains the newly assigned Role Collection. The success message therefore tells the recipient to wait until User Administration shows `ACTIVE`. The `Refresh SAP sign-in` button removes the temporary invitation token and navigates to `/do/logout`, allowing AppRouter/XSUAA to issue a new session before the recipient opens IDTS.

- **Location**: `refreshSapSignIn`, `runAuthenticationPage`, and the authenticate-page button handler.
  **Impact if broken**: a recipient may remain on a valid but stale pre-provisioning SAP session and see an authorization denial.
  **Must check together**: `authenticate.html`, AppRouter `/do/logout`, `auth-guard.js`, and `srv/auth/platform-role.js`.

### Tiếng Việt

Xác minh identity thành công chỉ có nghĩa provisioning đã bắt đầu; JWT XSUAA hiện tại chưa chắc đã chứa Role Collection mới. Vì vậy thông báo thành công yêu cầu chờ tới khi User Administration hiển thị `ACTIVE`. Nút `Refresh SAP sign-in` xóa invitation token tạm và chuyển tới `/do/logout`, để AppRouter/XSUAA cấp session mới trước khi người nhận mở IDTS.

- **Vị trí**: `refreshSapSignIn`, `runAuthenticationPage` và handler của nút trên trang authenticate.
  **Ảnh hưởng nếu sai**: người nhận có thể tiếp tục dùng SAP session hợp lệ nhưng cũ từ trước provisioning và bị từ chối quyền.
  **Phải kiểm tra cùng**: `authenticate.html`, `/do/logout` của AppRouter, `auth-guard.js` và `srv/auth/platform-role.js`.
