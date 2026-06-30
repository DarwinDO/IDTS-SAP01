# Knowledge: `app/bug-management-ui/webapp/Component.js`

## English

### What this file is for

`Component.js` is the standard SAPUI5 component entry point for the IDTS Fiori
Elements application. Its job is intentionally small: extend
`sap/fe/core/AppComponent` and tell UI5 to use `manifest.json` as the app
configuration.

### Beginner explanation

Think of this file as the front door of the Fiori app after the browser has
already been allowed into `index.html`. It does not decide what screens exist,
what fields are shown, or how OData is called. Those parts come mostly from
`manifest.json`, CDS annotations, and the CAP OData metadata.

In IDTS-35, login is not handled here anymore. The login guard runs earlier in
`auth-guard.js`, before the UI5 bootstrap script loads. That order matters
because Fiori Elements may request `$metadata` immediately during startup, and
that first request must already have the bearer token.

### Flow in IDTS

1. Browser opens `webapp/index.html`.
2. `index.html` loads `auth-guard.js` before the UI5 bootstrap.
3. `auth-guard.js` redirects unauthenticated users to `login.html`, or installs
   the OData bearer-token interceptor for authenticated users.
4. UI5 bootstrap runs with `sap/ui/core/ComponentSupport`.
5. UI5 loads this `Component.js`.
6. This component extends `sap/fe/core/AppComponent` and lets Fiori Elements
   render the List Report and Object Page based on `manifest.json` and service
   metadata.

### Important source anchors

| Location | IDTS concept | Impact if broken | Must check together |
| --- | --- | --- | --- |
| `sap.ui.define(["sap/fe/core/AppComponent"], ...)` | Fiori Elements app bootstrap | The app may fail to start or may not use Fiori Elements behavior. | `webapp/index.html`, `webapp/manifest.json` |
| `metadata: { manifest: "json" }` | Manifest-driven app configuration | Routes, models, pages, and service binding may not load. | `webapp/manifest.json`, `app/bug-management-ui/annotations*.cds` |

### Cross-folder impact

- `srv/service.cds` exposes `BugService`, which is the OData service used by the
  Fiori app after this component starts.
- `srv/auth.cds`, `srv/auth.js`, and `srv/auth/custom-auth.js` provide the login
  and bearer-token contract that `auth-guard.js` and `login-page.js` depend on.
- `db/schema.cds` defines `Users`, `AuthSessions`, and the bug-tracking entities
  rendered through the Fiori app.

### Safe editing checklist

- Keep this file small unless there is a clear SAPUI5 component-level reason to
  change it.
- Do not put login flow, XHR monkey-patching, or UI code here; IDTS-35 keeps
  those in `auth-guard.js` and `login-page.js`.
- After editing, run UI5 build and at least one browser smoke test because this
  file is part of application startup.

## Vietnamese

### File này dùng để làm gì

`Component.js` là điểm vào chuẩn của SAPUI5 component cho app Fiori Elements của
IDTS. Nhiệm vụ của nó được giữ rất nhỏ: extend `sap/fe/core/AppComponent` và nói
cho UI5 biết rằng app sẽ lấy cấu hình từ `manifest.json`.

### Giải thích cho người mới

Có thể hiểu file này là “cửa vào” của Fiori app sau khi browser đã được phép đi
vào `index.html`. Nó không quyết định app có màn hình nào, field nào được hiển
thị, hoặc OData được gọi ra sao. Những phần đó chủ yếu đến từ `manifest.json`,
CDS annotation, và metadata OData do CAP sinh ra.

Trong IDTS-35, login không còn xử lý trong file này. Phần kiểm tra đăng nhập
chạy sớm hơn trong `auth-guard.js`, trước cả khi UI5 bootstrap được load. Thứ tự
này quan trọng vì Fiori Elements có thể gọi `$metadata` ngay khi khởi động, và
request đầu tiên đó phải có bearer token sẵn.

### Flow hoạt động trong IDTS

1. Browser mở `webapp/index.html`.
2. `index.html` load `auth-guard.js` trước UI5 bootstrap.
3. `auth-guard.js` redirect user chưa đăng nhập sang `login.html`, hoặc gắn
   interceptor để tự thêm bearer token cho OData nếu user đã đăng nhập.
4. UI5 bootstrap chạy với `sap/ui/core/ComponentSupport`.
5. UI5 load file `Component.js` này.
6. Component extend `sap/fe/core/AppComponent` và để Fiori Elements render List
   Report/Object Page dựa trên `manifest.json` và metadata service.

### Các điểm source quan trọng

| Vị trí | Khái niệm IDTS | Ảnh hưởng nếu sai | Phải kiểm tra cùng |
| --- | --- | --- | --- |
| `sap.ui.define(["sap/fe/core/AppComponent"], ...)` | Bootstrap app Fiori Elements | App có thể không start được hoặc không chạy đúng hành vi Fiori Elements. | `webapp/index.html`, `webapp/manifest.json` |
| `metadata: { manifest: "json" }` | App cấu hình bằng manifest | Routes, models, pages, và service binding có thể không load. | `webapp/manifest.json`, `app/bug-management-ui/annotations*.cds` |

### Liên kết với folder khác

- `srv/service.cds` expose `BugService`, là OData service mà Fiori app dùng sau
  khi component này start.
- `srv/auth.cds`, `srv/auth.js`, và `srv/auth/custom-auth.js` cung cấp contract
  login/bearer-token mà `auth-guard.js` và `login-page.js` đang dựa vào.
- `db/schema.cds` định nghĩa `Users`, `AuthSessions`, và các entity bug-tracking
  được hiển thị qua Fiori app.

### Checklist sửa file an toàn

- Giữ file này nhỏ, chỉ sửa khi thật sự cần thay đổi ở cấp SAPUI5 component.
- Không đưa login flow, XHR monkey-patch, hoặc UI code vào đây; IDTS-35 giữ
  chúng trong `auth-guard.js` và `login-page.js`.
- Sau khi sửa, chạy UI5 build và ít nhất một browser smoke test vì file này nằm
  trong luồng khởi động app.
