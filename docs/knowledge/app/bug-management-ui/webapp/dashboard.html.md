# Knowledge: `app/bug-management-ui/webapp/dashboard.html`

> **Ownership / debug anchor:** DatDT owns dashboard bootstrap (backup: SangVN). The page must load the guard before UI5 so the first protected request is authenticated.
> **Ownership / điểm debug:** DatDT sở hữu bootstrap dashboard (backup: SangVN). Trang phải nạp guard trước UI5 để request protected đầu tiên có xác thực.

## English

### What this file is for

This file is the browser entry page for the IDTS Sprint 4 dashboard. It loads the same SAPUI5 runtime, same Horizon theme, same shell CSS, and same authentication guard as the main Fiori app.

### Beginner explanation

The generated Fiori Elements List Report/Object Page still live in `index.html`. The dashboard is a richer overview screen, so IDTS serves it through `dashboard.html` and builds the UI with SAPUI5 controls in `dashboard-page.js`.

This page is still protected. `auth-guard.js` runs before SAPUI5, so an unauthenticated browser is redirected to `login.html` before any dashboard data is requested.

### Flow in IDTS

1. User clicks `Open Dashboard` from the bug List Report.
2. `BugListActions.openDashboard()` redirects to `dashboard.html`.
3. `auth-guard.js` checks the session token.
4. SAPUI5 starts with the Horizon theme.
5. `dashboard-page.js` renders the role-based dashboard and profile shell.

### Important source anchors

- Location: `<script src="auth-guard.js"></script>`
  - IDTS concept: protected dashboard access.
  - Impact if broken: dashboard may load without authentication or OData requests may miss the Bearer token.
  - Must check together: `auth-guard.js`, `login-page.js`, and `srv/auth.js`.

- Location: `data-sap-ui-resource-roots`
  - IDTS concept: module namespace for app-local SAPUI5 code.
  - Impact if broken: `dashboard-page.js` cannot load profile/session helper modules.
  - Must check together: `dashboard-page.js`, `ext/login/ProfileShell.js`, and `ext/login/LoginController.js`.

- Location: `<script src="dashboard-page.js"></script>`
  - IDTS concept: actual dashboard rendering and OData read logic.
  - Impact if broken: the page shell loads but no dashboard appears.
  - Must check together: `dashboard-page.js`.

### Cross-folder impact

- Uses backend auth and bug OData services from `srv/auth.js` and `srv/service.cds`.
- Reuses profile shell code under `webapp/ext/login`.
- The entry action is configured in `manifest.json` and implemented in `BugListActions.js`.

### Safe editing checklist

- Keep `auth-guard.js` before SAPUI5 bootstrap.
- Do not add private endpoints, credentials, QA notes, CAP/BTP/XSUAA explanations, or developer-facing text to the page.
- Keep the page as dashboard shell only; business grouping belongs in `dashboard-page.js`.

## Vietnamese

### File này dùng để làm gì

File này là entry page trên browser cho dashboard Sprint 4 của IDTS. Nó load cùng SAPUI5 runtime, cùng Horizon theme, cùng shell CSS, và cùng authentication guard như app Fiori chính.

### Giải thích cho người mới

List Report/Object Page do Fiori Elements generate vẫn nằm trong `index.html`. Dashboard là màn tổng quan có tương tác nhiều hơn, nên IDTS phục vụ nó qua `dashboard.html` và dựng UI bằng SAPUI5 controls trong `dashboard-page.js`.

Page này vẫn được bảo vệ. `auth-guard.js` chạy trước SAPUI5, nên browser chưa đăng nhập sẽ bị chuyển về `login.html` trước khi dashboard gọi dữ liệu.

### Flow hoạt động trong IDTS

1. User bấm `Open Dashboard` từ bug List Report.
2. `BugListActions.openDashboard()` redirect sang `dashboard.html`.
3. `auth-guard.js` kiểm tra session token.
4. SAPUI5 start với Horizon theme.
5. `dashboard-page.js` render dashboard theo role và profile shell.

### Các source anchor quan trọng

- Vị trí: `<script src="auth-guard.js"></script>`
  - Khái niệm IDTS: bảo vệ truy cập dashboard.
  - Ảnh hưởng nếu sai: dashboard có thể load khi chưa đăng nhập hoặc OData request thiếu Bearer token.
  - Phải kiểm tra cùng: `auth-guard.js`, `login-page.js`, và `srv/auth.js`.

- Vị trí: `data-sap-ui-resource-roots`
  - Khái niệm IDTS: namespace module cho SAPUI5 code local của app.
  - Ảnh hưởng nếu sai: `dashboard-page.js` không load được profile/session helper.
  - Phải kiểm tra cùng: `dashboard-page.js`, `ext/login/ProfileShell.js`, và `ext/login/LoginController.js`.

- Vị trí: `<script src="dashboard-page.js"></script>`
  - Khái niệm IDTS: logic render dashboard và đọc OData.
  - Ảnh hưởng nếu sai: page shell load nhưng dashboard không hiện.
  - Phải kiểm tra cùng: `dashboard-page.js`.

### Liên kết với folder khác

- Dùng backend auth và bug OData service từ `srv/auth.js` và `srv/service.cds`.
- Reuse profile shell code trong `webapp/ext/login`.
- Entry action được cấu hình trong `manifest.json` và implement trong `BugListActions.js`.

### Checklist sửa an toàn

- Giữ `auth-guard.js` trước SAPUI5 bootstrap.
- Không đưa private endpoint, credential, QA note, giải thích CAP/BTP/XSUAA, hoặc developer-facing text lên page.
- Giữ file này như shell của dashboard; logic gom nhóm nghiệp vụ nằm trong `dashboard-page.js`.
