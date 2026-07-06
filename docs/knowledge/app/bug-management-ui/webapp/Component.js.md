# Knowledge: `app/bug-management-ui/webapp/Component.js`

## English

### What this file is for

`Component.js` is the SAPUI5 component entry point for the protected IDTS Fiori Elements app. It extends `sap/fe/core/AppComponent`, uses `manifest.json` as the app configuration source, and initializes the post-login profile shell after UI5 is available.

It does not validate tokens and it does not inject OData headers. Those pre-bootstrap responsibilities stay in `auth-guard.js`.

### Beginner explanation

After the browser passes the login guard in `index.html`, SAPUI5 loads this component. Fiori Elements then reads `manifest.json`, service metadata, and annotations to generate the List Report and Object Page.

For `IDTS-53`, this component also calls `ProfileShell.init()`. That is the right place for the profile shell because UI5 is already running here. The earlier `auth-guard.js` runs before UI5, so it should not create UI5 controls directly.

### Flow in IDTS

1. Browser opens `webapp/index.html`.
2. `index.html` loads `auth-guard.js` before UI5.
3. `auth-guard.js` redirects unauthenticated users or prepares bearer-token injection.
4. SAPUI5 starts and loads `Component.js`.
5. `Component.js` calls the normal Fiori Elements component initialization.
6. `Component.js` calls `ProfileShell.init()`.
7. `ProfileShell` renders the signed-in profile/sign-out UI into the stable host in `index.html`.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `"sap/fe/core/AppComponent"` | Fiori Elements application base | The generated app may fail to start or lose Fiori Elements behavior. | `manifest.json`, annotations |
| `"idts/bugmanagementui/ext/login/ProfileShell"` | Signed-in profile shell module | The visible profile menu and Sign Out UX may disappear. | `ext/login/ProfileShell.js`, `index.html`, `css/idts-shell.css` |
| `metadata: { manifest: "json" }` | Manifest-driven configuration | Routes, models, pages, and service binding may not load. | `manifest.json` |
| `AppComponent.prototype.init.apply(this, arguments)` | Required base initialization | Fiori Elements startup can break if this call is skipped. | UI5 build/browser smoke |
| `ProfileShell.init()` | IDTS-53 profile startup | User cannot see signed-in account or Sign Out action. | `auth-guard.js`, `ProfileShell.js` |

### Cross-folder impact

- `srv/service.cds` exposes `BugService`, which the Fiori app uses after this component starts.
- `srv/auth.cds`, `srv/auth.js`, and `srv/auth/custom-auth.js` define the login/session contract used before this component starts.
- `db/schema.cds` contains the business data rendered by the Fiori Elements pages.
- `app/bug-management-ui/webapp/manifest.json` defines the pages/routes/models consumed by this component.

### Safe editing checklist

- Always call the base `AppComponent` init before adding component-level startup behavior.
- Do not move token validation or XHR header injection into this file; those must stay before UI5 bootstrap.
- Keep component-level UI additions small and stable.
- If profile shell behavior changes, update `ProfileShell.js`, `auth-guard.js`, and their knowledge mirrors together.
- Run UI5 build/linter and browser smoke after changing this file.

## Vietnamese

### File này dùng để làm gì

`Component.js` là entry point SAPUI5 component cho protected IDTS Fiori Elements app. File này extend `sap/fe/core/AppComponent`, dùng `manifest.json` làm nguồn cấu hình app, và khởi tạo profile shell sau khi UI5 đã sẵn sàng.

File này không validate token và không tự gắn OData header. Những trách nhiệm cần chạy trước bootstrap vẫn nằm trong `auth-guard.js`.

### Giải thích cho người mới

Sau khi browser vượt qua login guard trong `index.html`, SAPUI5 load component này. Fiori Elements sau đó đọc `manifest.json`, service metadata, và annotations để generate List Report và Object Page.

Với `IDTS-53`, component này cũng gọi `ProfileShell.init()`. Đây là chỗ phù hợp để khởi tạo profile shell vì lúc này UI5 đã chạy. `auth-guard.js` chạy sớm hơn UI5, nên không nên tạo UI5 controls trực tiếp ở đó.

### Flow hoạt động trong IDTS

1. Browser mở `webapp/index.html`.
2. `index.html` load `auth-guard.js` trước UI5.
3. `auth-guard.js` redirect user chưa đăng nhập hoặc chuẩn bị bearer-token injection.
4. SAPUI5 start và load `Component.js`.
5. `Component.js` gọi initialization chuẩn của Fiori Elements component.
6. `Component.js` gọi `ProfileShell.init()`.
7. `ProfileShell` render signed-in profile/sign-out UI vào host ổn định trong `index.html`.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `"sap/fe/core/AppComponent"` | Base app Fiori Elements | Generated app có thể không start hoặc mất hành vi Fiori Elements. | `manifest.json`, annotations |
| `"idts/bugmanagementui/ext/login/ProfileShell"` | Module profile shell đã đăng nhập | Profile menu và Sign Out UX có thể biến mất. | `ext/login/ProfileShell.js`, `index.html`, `css/idts-shell.css` |
| `metadata: { manifest: "json" }` | Cấu hình app bằng manifest | Routes, models, pages, service binding có thể không load. | `manifest.json` |
| `AppComponent.prototype.init.apply(this, arguments)` | Base initialization bắt buộc | Fiori Elements startup có thể hỏng nếu bỏ call này. | UI5 build/browser smoke |
| `ProfileShell.init()` | Khởi động profile IDTS-53 | User không thấy account đang login hoặc action Sign Out. | `auth-guard.js`, `ProfileShell.js` |

### Liên kết với folder khác

- `srv/service.cds` expose `BugService`, được Fiori app dùng sau khi component này start.
- `srv/auth.cds`, `srv/auth.js`, và `srv/auth/custom-auth.js` định nghĩa login/session contract dùng trước khi component này start.
- `db/schema.cds` chứa dữ liệu nghiệp vụ được Fiori Elements pages hiển thị.
- `app/bug-management-ui/webapp/manifest.json` định nghĩa pages/routes/models mà component này sử dụng.

### Checklist sửa file an toàn

- Luôn gọi base `AppComponent` init trước khi thêm startup behavior ở cấp component.
- Không chuyển token validation hoặc XHR header injection vào file này; các phần đó phải nằm trước UI5 bootstrap.
- Giữ UI bổ sung ở cấp component thật nhỏ và ổn định.
- Nếu đổi profile shell behavior, cập nhật `ProfileShell.js`, `auth-guard.js`, và knowledge mirrors tương ứng cùng lúc.
- Chạy UI5 build/linter và browser smoke sau khi sửa file này.
