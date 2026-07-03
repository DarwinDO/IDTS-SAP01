# Knowledge: `app/bug-management-ui/webapp/login.html`

## English

### What this file is for

`login.html` is the standalone entry page for custom IDTS sign-in. It loads the SAPUI5 runtime, the login-only CSS, and `login-page.js`, then gives `login-page.js` a root element named `loginContent` where the UI5 login screen is rendered.

This page appears before the Fiori Elements app in `index.html`. That matters because the user must authenticate before the main app creates its OData model and calls protected CAP services.

### Beginner explanation

In a normal Fiori Elements app, `index.html` starts SAPUI5 and then loads the app component. IDTS cannot go straight there for anonymous users because `BugService` is protected. So the browser first opens `login.html`.

This file is intentionally small. It does not contain the form markup itself anymore. Instead, it bootstraps SAPUI5 with the Horizon theme and lets `login-page.js` build the form using SAPUI5 controls such as `sap.m.Input`, `sap.m.Button`, and `sap.m.MessageStrip`. This keeps the login screen closer to SAP Fiori visual patterns than a hand-built HTML card.

### Flow in IDTS

1. A user opens `/bug-management-ui/webapp/login.html`, or `auth-guard.js` redirects them here from `index.html`.
2. `login.html` loads `css/login.css` for page-specific SAP-token styling.
3. `login.html` bootstraps SAPUI5 with theme `sap_horizon` and libraries `sap.m,sap.f`.
4. `login-page.js` renders the actual login page inside `<div id="loginContent">`.
5. On successful login, `login-page.js` stores the token/profile in `sessionStorage` and redirects to `index.html`.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `<link rel="stylesheet" href="css/login.css">` | Login visual style | Login may still work, but the page loses SAP/Fiori layout and responsive styling. | `css/login.css`, `login-page.js` |
| `src="https://sapui5.hana.ondemand.com/1.148.0/resources/sap-ui-core.js"` | SAPUI5 runtime | The UI5 login controls cannot render if the runtime cannot load. | `index.html`, `ui5.yaml`, local `cds watch` behavior |
| `data-sap-ui-theme="sap_horizon"` | SAP Horizon theme | Login may look inconsistent with the Fiori app if the theme changes. | `css/login.css`, `index.html` |
| `data-sap-ui-libs="sap.m,sap.f"` | UI5 control libraries | `login-page.js` cannot load the controls it uses. | `login-page.js` dependencies |
| `<div id="loginContent"></div>` | Login render target | The login page becomes blank because `login-page.js` has nowhere to place the UI. | `login-page.js` |
| `<script src="login-page.js"></script>` | Login behavior | Users cannot authenticate or redirect into the app. | `srv/auth.js`, `auth-guard.js` |

### Cross-folder impact

- `srv/auth.js` implements the `AuthService.login` action called after this page renders.
- `srv/auth.cds` exposes the login OData action.
- `db/schema.cds` stores `Users` and `AuthSessions`, which the backend login action uses after the user submits this screen.
- `app/bug-management-ui/webapp/index.html` is the next page after successful login; it must still load `auth-guard.js` before SAPUI5 so protected OData calls receive the bearer token.

### Safe editing checklist

- Do not add inline JavaScript that handles passwords or tokens.
- Keep this page independent from the Fiori Elements component; login must happen before the app model starts.
- If changing SAPUI5 version, theme, or libraries, run UI5 build/lint and browser smoke.
- If the render target id changes, update `login-page.js` in the same commit.
- Do not place real user emails, passwords, bearer tokens, API keys, or private endpoints in this file or its knowledge note.

## Vietnamese

### File này dùng để làm gì

`login.html` là trang vào riêng cho màn hình đăng nhập custom của IDTS. File này load SAPUI5 runtime, CSS riêng cho login, và `login-page.js`, sau đó tạo một vùng tên là `loginContent` để `login-page.js` render giao diện đăng nhập bằng UI5.

Trang này xuất hiện trước app Fiori Elements trong `index.html`. Lý do là người dùng phải đăng nhập trước khi app chính tạo OData model và gọi các CAP service đã được bảo vệ.

### Giải thích cho người mới

Với Fiori Elements bình thường, `index.html` sẽ khởi động SAPUI5 rồi load app component. Nhưng IDTS không thể cho user chưa đăng nhập đi thẳng vào đó, vì `BugService` yêu cầu token. Do đó browser sẽ mở `login.html` trước.

File này giờ được giữ rất gọn. Nó không tự viết form HTML nữa. Nó chỉ bootstrap SAPUI5 bằng theme Horizon, rồi để `login-page.js` dựng form bằng các control SAPUI5 như `sap.m.Input`, `sap.m.Button`, và `sap.m.MessageStrip`. Cách này giúp màn hình login gần chuẩn SAP Fiori hơn so với card HTML/CSS tự dựng.

### Flow hoạt động trong IDTS

1. User mở `/bug-management-ui/webapp/login.html`, hoặc bị `auth-guard.js` redirect từ `index.html` sang đây.
2. `login.html` load `css/login.css` để lấy layout/styling riêng cho login.
3. `login.html` bootstrap SAPUI5 với theme `sap_horizon` và thư viện `sap.m,sap.f`.
4. `login-page.js` render màn hình login thật vào `<div id="loginContent">`.
5. Khi login thành công, `login-page.js` lưu token/profile vào `sessionStorage` và redirect sang `index.html`.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `<link rel="stylesheet" href="css/login.css">` | Giao diện login | Login có thể vẫn chạy, nhưng mất layout/responsive theo hướng SAP/Fiori. | `css/login.css`, `login-page.js` |
| `src="https://sapui5.hana.ondemand.com/1.148.0/resources/sap-ui-core.js"` | SAPUI5 runtime | Các control UI5 của màn hình login không render được. | `index.html`, `ui5.yaml`, hành vi `cds watch` local |
| `data-sap-ui-theme="sap_horizon"` | Theme SAP Horizon | Login nhìn lệch với app Fiori nếu theme đổi sai. | `css/login.css`, `index.html` |
| `data-sap-ui-libs="sap.m,sap.f"` | Thư viện control UI5 | `login-page.js` không load được control cần dùng. | Dependency trong `login-page.js` |
| `<div id="loginContent"></div>` | Vùng render login | Trang login bị trắng vì `login-page.js` không có chỗ đặt UI. | `login-page.js` |
| `<script src="login-page.js"></script>` | Logic đăng nhập | User không đăng nhập hoặc redirect vào app được. | `srv/auth.js`, `auth-guard.js` |

### Liên kết với folder khác

- `srv/auth.js` implement action `AuthService.login` được gọi sau khi user submit màn hình này.
- `srv/auth.cds` expose OData action login.
- `db/schema.cds` chứa `Users` và `AuthSessions`, là dữ liệu backend dùng sau khi user submit login.
- `app/bug-management-ui/webapp/index.html` là trang kế tiếp sau khi login thành công; nó vẫn phải load `auth-guard.js` trước SAPUI5 để OData request có bearer token.

### Checklist sửa file an toàn

- Không thêm inline JavaScript xử lý password hoặc token.
- Giữ trang này độc lập với Fiori Elements component; login phải xảy ra trước khi app model khởi động.
- Nếu đổi SAPUI5 version, theme, hoặc libraries, phải chạy UI5 build/lint và browser smoke.
- Nếu đổi id vùng render, phải cập nhật `login-page.js` trong cùng commit.
- Không đưa email thật, password, bearer token, API key, hoặc private endpoint vào file này hoặc knowledge note.
