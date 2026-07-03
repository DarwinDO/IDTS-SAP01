# Knowledge: `app/bug-management-ui/webapp/index.html`

## English

### What this file is for

`index.html` is the browser entry page for the protected IDTS Fiori Elements application. It loads `auth-guard.js` first, then bootstraps SAPUI5, then starts the `idts.bugmanagementui` component.

After `IDTS-53`, it also contains a stable host element named `idtsProfileShellHost`. `auth-guard.js` uses that host to render the signed-in profile button and Sign Out popover.

### Beginner explanation

When a user opens the real app, this file is the first HTML page the browser receives. It does not define List Report or Object Page content directly. Instead, it starts SAPUI5 and tells UI5 to load the application component.

The most important detail is load order:

1. `auth-guard.js` loads first.
2. `auth-guard.js` checks whether the browser has a login token.
3. Only then does SAPUI5 load and start the Fiori Elements app.

This prevents the app from making its first OData metadata request without authentication.

### Flow in IDTS

1. Successful login redirects the browser from `login.html` to `index.html`.
2. `index.html` loads `css/idts-shell.css` for profile shell styling.
3. `index.html` loads `auth-guard.js` before SAPUI5.
4. If the token is missing, `auth-guard.js` redirects back to `login.html`.
5. If the token exists, SAPUI5 bootstraps with theme `sap_horizon`.
6. UI5 ComponentSupport loads `idts.bugmanagementui`.
7. The Fiori Elements List Report/Object Page renders from `manifest.json`, annotations, and OData metadata.
8. `auth-guard.js` renders the profile/sign-out menu into `#idtsProfileShellHost`.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `<link rel="stylesheet" href="css/idts-shell.css">` | App shell/profile styling | Profile menu may render but look misplaced or inconsistent. | `css/idts-shell.css`, `auth-guard.js` |
| `<script src="auth-guard.js"></script>` | Pre-bootstrap auth guard | First OData calls can be unauthenticated, causing blank app or 401/403. | `auth-guard.js`, `srv/auth/custom-auth.js` |
| `src="https://sapui5.hana.ondemand.com/1.148.0/resources/sap-ui-core.js"` | SAPUI5 runtime | The Fiori Elements app cannot start if UI5 fails to load. | `login.html`, UI5 build config |
| `data-sap-ui-theme="sap_horizon"` | SAP Horizon theme | App visual style can diverge from login/profile styling if changed. | `login.html`, CSS theme tokens |
| `data-sap-ui-on-init="module:sap/ui/core/ComponentSupport"` | Component bootstrapping | The app component may not start automatically. | `Component.js`, `manifest.json` |
| `<div id="idtsProfileShellHost"></div>` | Signed-in profile shell host | The profile menu cannot render if this host is removed or renamed. | `auth-guard.js`, `css/idts-shell.css` |
| `data-name="idts.bugmanagementui"` | UI5 app component name | UI5 cannot locate the app component if the name changes incorrectly. | `Component.js`, `manifest.json` |

### Cross-folder impact

- `srv/service.cds` exposes the protected `BugService` used by the Fiori Elements app started here.
- `srv/auth/custom-auth.js` validates the bearer token injected by `auth-guard.js`.
- `db/schema.cds` stores the business data shown by the app after OData calls succeed.
- `app/bug-management-ui/webapp/manifest.json` defines the Fiori Elements pages and OData model loaded after this page starts the component.
- `app/bug-management-ui/annotations/*.cds` affects the generated List Report/Object Page that appears after this bootstrap.

### Safe editing checklist

- Keep `auth-guard.js` before the UI5 bootstrap.
- Do not add inline code that logs or exposes tokens.
- Do not remove `idtsProfileShellHost` unless `auth-guard.js` is updated in the same change.
- If the UI5 version/theme changes, test both login and main app because they should stay visually aligned.
- If component name/resource root changes, verify UI5 build and app startup.

## Vietnamese

### File này dùng để làm gì

`index.html` là trang HTML vào chính của IDTS Fiori Elements app đã được bảo vệ. File này load `auth-guard.js` trước, sau đó bootstrap SAPUI5, rồi khởi động component `idts.bugmanagementui`.

Sau `IDTS-53`, file này còn có một host ổn định tên `idtsProfileShellHost`. `auth-guard.js` dùng host đó để render nút profile và popover Sign Out.

### Giải thích cho người mới

Khi user mở app thật, đây là file HTML đầu tiên browser nhận được. Nó không tự định nghĩa nội dung List Report hoặc Object Page. Thay vào đó, nó khởi động SAPUI5 và bảo UI5 load application component.

Chi tiết quan trọng nhất là thứ tự load:

1. `auth-guard.js` load trước.
2. `auth-guard.js` kiểm tra browser có login token chưa.
3. Sau đó SAPUI5 mới load và khởi động Fiori Elements app.

Cách này tránh việc app gửi request OData metadata đầu tiên khi chưa có authentication.

### Flow hoạt động trong IDTS

1. Login thành công redirect browser từ `login.html` sang `index.html`.
2. `index.html` load `css/idts-shell.css` cho styling của profile shell.
3. `index.html` load `auth-guard.js` trước SAPUI5.
4. Nếu thiếu token, `auth-guard.js` redirect về `login.html`.
5. Nếu có token, SAPUI5 bootstrap với theme `sap_horizon`.
6. UI5 ComponentSupport load component `idts.bugmanagementui`.
7. Fiori Elements List Report/Object Page render dựa trên `manifest.json`, annotations, và OData metadata.
8. `auth-guard.js` render profile/sign-out menu vào `#idtsProfileShellHost`.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `<link rel="stylesheet" href="css/idts-shell.css">` | Styling app shell/profile | Profile menu có thể render nhưng nhìn lệch hoặc sai vị trí. | `css/idts-shell.css`, `auth-guard.js` |
| `<script src="auth-guard.js"></script>` | Auth guard trước bootstrap | Request OData đầu tiên có thể thiếu auth, gây app trắng hoặc 401/403. | `auth-guard.js`, `srv/auth/custom-auth.js` |
| `src="https://sapui5.hana.ondemand.com/1.148.0/resources/sap-ui-core.js"` | SAPUI5 runtime | Fiori Elements app không khởi động được nếu UI5 không load. | `login.html`, UI5 build config |
| `data-sap-ui-theme="sap_horizon"` | SAP Horizon theme | App có thể nhìn lệch với login/profile nếu đổi sai theme. | `login.html`, CSS theme tokens |
| `data-sap-ui-on-init="module:sap/ui/core/ComponentSupport"` | Bootstrap component | App component có thể không tự start. | `Component.js`, `manifest.json` |
| `<div id="idtsProfileShellHost"></div>` | Host cho signed-in profile shell | Profile menu không render nếu host bị xóa hoặc đổi tên. | `auth-guard.js`, `css/idts-shell.css` |
| `data-name="idts.bugmanagementui"` | Tên UI5 app component | UI5 không tìm được app component nếu đổi sai tên. | `Component.js`, `manifest.json` |

### Liên kết với folder khác

- `srv/service.cds` expose protected `BugService` mà Fiori Elements app dùng sau khi start.
- `srv/auth/custom-auth.js` validate bearer token được `auth-guard.js` gắn vào request.
- `db/schema.cds` lưu dữ liệu nghiệp vụ được app hiển thị sau khi OData call thành công.
- `app/bug-management-ui/webapp/manifest.json` định nghĩa Fiori Elements pages và OData model được load sau khi file này start component.
- `app/bug-management-ui/annotations/*.cds` ảnh hưởng List Report/Object Page generated sau bootstrap này.

### Checklist sửa file an toàn

- Giữ `auth-guard.js` nằm trước UI5 bootstrap.
- Không thêm inline code log hoặc expose token.
- Không xóa `idtsProfileShellHost` nếu không cập nhật `auth-guard.js` trong cùng thay đổi.
- Nếu đổi UI5 version/theme, test cả login và main app vì hai bên cần nhìn đồng bộ.
- Nếu đổi component name/resource root, verify UI5 build và app startup.
